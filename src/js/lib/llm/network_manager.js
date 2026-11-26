export function createNetwork(wsUrl, options = {}) {
    const isHost = Boolean(options.isHost);
    const rtcConfig = options.rtcConfig || {
        iceServers: [{ urls: 'stun:://google.com' }]
    };
    const webrtcTimeoutMs = options.webrtcTimeoutMs || 5000;

    const myId = isHost ? 'host' : crypto.randomUUID();
    const peers = new Map(); // peerId -> { pc, dc, state: 'connecting' | 'webrtc' | 'fallback', timer }
    const listeners = new Map();
    let ws = null;

    // --- События ---
    const on = (event, fn) => {
        if (!listeners.has(event)) listeners.set(event, new Set());
        listeners.get(event).add(fn);
        return () => listeners.get(event)?.delete(fn);
    };

    const emit = (event, data) => {
        listeners.get(event)?.forEach((fn) => fn(data));
    };

    // --- WebSocket ---
    const sendWs = (packet) => {
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ ...packet, from: myId }));
        }
    };

    // --- Управление пирами ---
    const switchToFallback = (peerId, reason) => {
        const peer = peers.get(peerId);
        if (!peer || peer.state === 'fallback') return;

        clearTimeout(peer.timer);
        peer.state = 'fallback';

        if (peer.pc) {
            peer.pc.close();
            peer.pc = null;
            peer.dc = null;
        }
        console.warn(`[Net] Канал с ${peerId} переведен на WebSocket (${reason})`);
    };

    const setupDataChannel = (peerId, dc) => {
        const peer = peers.get(peerId);
        if (!peer) return;
        peer.dc = dc;

        dc.onopen = () => {
            clearTimeout(peer.timer);
            peer.state = 'webrtc';
            console.log(`[Net] P2P канал с ${peerId} установлен`);

            // Обычный клиент отключается от WS сразу после установки WebRTC с хостом
            if (!isHost && ws && ws.readyState === WebSocket.OPEN) {
                console.log('[Net] Отключаемся от WebSocket, перешли на P2P');
                ws.close();
                ws = null;
            }
        };

        dc.onclose = () => {
            if (isHost) {
                peers.delete(peerId);
                emit('peer-left', { peerId });
            } else {
                switchToFallback(peerId, 'dc-closed');
            }
        };

        dc.onerror = () => switchToFallback(peerId, 'dc-error');

        dc.onmessage = (e) => {
            const msg = JSON.parse(e.data);
            if (msg.type === 'game-data') {
                emit('message', { from: peerId, payload: msg.payload });
            }
        };
    };

    const initPeer = (peerId, isInitiator) => {
        if (peers.has(peerId)) return peers.get(peerId);

        const pc = new RTCPeerConnection(rtcConfig);
        const peer = {
            pc,
            dc: null,
            state: 'connecting',
            timer: setTimeout(() => switchToFallback(peerId, 'timeout'), webrtcTimeoutMs)
        };
        peers.set(peerId, peer);

        if (isHost) {
            emit('peer-joined', { peerId });
        }

        pc.onicecandidate = (e) => {
            if (e.candidate) {
                sendWs({ type: 'signal', to: peerId, data: { candidate: e.candidate } });
            }
        };

        pc.onconnectionstatechange = () => {
            if (['failed', 'disconnected', 'closed'].includes(pc.connectionState)) {
                switchToFallback(peerId, pc.connectionState);
            }
        };

        if (isInitiator) {
            const dc = pc.createDataChannel('game-data');
            setupDataChannel(peerId, dc);

            pc.createOffer()
                .then((offer) => pc.setLocalDescription(offer))
                .then(() => sendWs({ type: 'signal', to: peerId, data: { sdp: pc.localDescription } }))
                .catch(() => switchToFallback(peerId, 'offer-error'));
        } else {
            pc.ondatachannel = (e) => setupDataChannel(peerId, e.channel);
        }

        return peer;
    };

    const handleSignal = async (fromId, data) => {
        const peer = peers.get(fromId) || initPeer(fromId, false);
        if (!peer || !peer.pc) return;

        try {
            if (data.sdp) {
                await peer.pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
                if (data.sdp.type === 'offer') {
                    const answer = await peer.pc.createAnswer();
                    await peer.pc.setLocalDescription(answer);
                    sendWs({ type: 'signal', to: fromId, data: { sdp: peer.pc.localDescription } });
                }
            } else if (data.candidate) {
                await peer.pc.addIceCandidate(new RTCIceCandidate(data.candidate));
            }
        } catch {
            switchToFallback(fromId, 'signal-error');
        }
    };

    // --- Обработка входящих из WebSocket ---
    const handleWsMessage = async (raw) => {
        let msg;
        try {
            msg = JSON.parse(raw);
        } catch {
            return;
        }

        if (!msg.from || msg.from === myId) return;

        // 1. Новичок зашел -> хост инициирует с ним WebRTC
        if (msg.type === 'hello' && isHost) {
            initPeer(msg.from, true);
            return;
        }

        // 2. Сигналинг WebRTC (принимаем пакеты, адресованные только нам)
        if (msg.type === 'signal' && msg.to === myId) {
            await handleSignal(msg.from, msg.data);
            return;
        }

        // 3. Игровые данные по WS фоллбеку
        if (msg.type === 'game-data') {
            // Клиент принимает данные только от хоста
            if (!isHost && msg.from !== 'host') return;

            // Если хост получил данные по WS от нового клиента, регистрируем его в fallback
            if (isHost && !peers.has(msg.from)) {
                initPeer(msg.from, false);
                switchToFallback(msg.from, 'ws-only');
            }

            emit('message', { from: msg.from, payload: msg.payload });
        }
    };

    // --- Публичный интерфейс ---
    const connect = () => new Promise((resolve, reject) => {
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            if (!isHost) {
                // Регистрируем хост как целевого пира и шлем приветствие
                initPeer('host', false);
                sendWs({ type: 'hello' });
            }
            resolve(myId);
        };

        ws.onerror = (err) => reject(err);
        ws.onmessage = (e) => handleWsMessage(e.data);
    });

    // Универсальная отправка (на клиенте шлет хосту, на хосте — всем игрокам)
    const broadcast = (payload) => {
        const rawPacket = JSON.stringify({ type: 'game-data', payload });

        if (!isHost) {
            const host = peers.get('host');
            if (host?.state === 'webrtc' && host.dc?.readyState === 'open') {
                host.dc.send(rawPacket);
            } else {
                sendWs({ type: 'game-data', payload });
            }
            return;
        }

        // Логика хоста: рассылаем по WebRTC тем, кто на P2P, и 1 раз в WS для фоллбек-клиентов
        let hasWsClients = false;

        for (const peer of peers.values()) {
            if (peer.state === 'webrtc' && peer.dc?.readyState === 'open') {
                peer.dc.send(rawPacket);
            } else {
                hasWsClients = true;
            }
        }

        if (hasWsClients) {
            sendWs({ type: 'game-data', payload });
        }
    };

    return {
        myId,
        isHost,
        connect,
        broadcast,
        on
    };
}


export function createNetwork2(wsUrl, options = {}) {
    const isHost = Boolean(options.isHost);
    const rtcConfig = options.rtcConfig || {
        iceServers: [{ urls: 'stun:://google.com' }]
    };
    const webrtcTimeoutMs = options.webrtcTimeoutMs || 5000;
    const maxReconnectAttempts = options.maxReconnectAttempts ?? 2; // Сколько раз пытаться поднять WebRTC заново

    const myId = isHost ? 'host' : crypto.randomUUID();
    const peers = new Map(); // peerId -> { pc, dc, state, timer, attempts }
    const listeners = new Map();
    let ws = null;
    let wsConnectingPromise = null;

    // --- События ---
    const on = (event, fn) => {
        if (!listeners.has(event)) listeners.set(event, new Set());
        listeners.get(event).add(fn);
        return () => listeners.get(event)?.delete(fn);
    };

    const emit = (event, data) => {
        listeners.get(event)?.forEach((fn) => fn(data));
    };

    // --- Управление WebSocket ---
    const ensureWsOpen = () => {
        if (ws && ws.readyState === WebSocket.OPEN) return Promise.resolve();
        if (wsConnectingPromise) return wsConnectingPromise;

        wsConnectingPromise = new Promise((resolve, reject) => {
            const socket = new WebSocket(wsUrl);
            ws = socket;

            socket.onopen = () => {
                wsConnectingPromise = null;
                console.log('[Net] WebSocket открыт');
                resolve();
            };

            socket.onerror = (err) => {
                wsConnectingPromise = null;
                reject(err);
            };

            socket.onclose = () => {
                if (ws === socket) {
                    ws = null;
                    wsConnectingPromise = null;
                }
            };

            socket.onmessage = (e) => handleWsMessage(e.data);
        });

        return wsConnectingPromise;
    };

    const closeWs = () => {
        if (ws) {
            ws.close();
            ws = null;
            wsConnectingPromise = null;
            console.log('[Net] WebSocket закрыт (работаем по WebRTC)');
        }
    };

    const sendWs = (packet) => {
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ ...packet, from: myId }));
        }
    };

    // --- Очистка старого RTCPeerConnection ---
    const cleanupRtc = (peer) => {
        if (!peer) return;
        clearTimeout(peer.timer);
        if (peer.dc) {
            peer.dc.onopen = null;
            peer.dc.onclose = null;
            peer.dc.onerror = null;
            peer.dc.onmessage = null;
            peer.dc.close();
            peer.dc = null;
        }
        if (peer.pc) {
            peer.pc.onicecandidate = null;
            peer.pc.onconnectionstatechange = null;
            peer.pc.ondatachannel = null;
            peer.pc.close();
            peer.pc = null;
        }
    };

    // --- Обработка сбоя WebRTC и попытка реконнекта ---
    const handleRtcDrop = async (peerId, reason) => {
        const peer = peers.get(peerId);
        if (!peer || peer.state === 'reconnecting' || peer.state === 'fallback') return;

        cleanupRtc(peer);
        peer.attempts += 1;

        // 1. В любом случае сначала страхуемся через WebSocket (на клиенте)
        if (!isHost) {
            try {
                await ensureWsOpen();
            } catch (err) {
                console.error('[Net] Критическая ошибка: недоступен даже WebSocket', err);
                return;
            }
        }

        // 2. Проверяем, остались ли попытки восстановить WebRTC
        if (peer.attempts <= maxReconnectAttempts) {
            peer.state = 'reconnecting';
            console.warn(
                `[Net] Обрыв P2P с ${peerId} (${reason}). Временный переход на WS и попытка реконнекта (${peer.attempts}/${maxReconnectAttempts})...`
            );

            if (!isHost) {
                // Инициируем новое рукопожатие WebRTC через открытый WebSocket
                startRtcConnection('host', false);
                sendWs({ type: 'hello' });
            }
        } else {
            // Попытки исчерпаны — остаемся на WebSocket навсегда
            peer.state = 'fallback';
            console.warn(`[Net] P2P с ${peerId} недоступен (${reason}). Окончательный фоллбек на WebSocket.`);
        }
    };

    const setupDataChannel = (peerId, dc) => {
        const peer = peers.get(peerId);
        if (!peer) return;
        peer.dc = dc;

        dc.onopen = () => {
            clearTimeout(peer.timer);
            peer.state = 'webrtc';
            peer.attempts = 0; // Сбрасываем счетчик неудач после стабильного подключения
            console.log(`[Net] P2P канал с ${peerId} активен`);

            if (!isHost) {
                closeWs();
            }
        };

        dc.onclose = () => handleRtcDrop(peerId, 'dc-closed');
        dc.onerror = () => handleRtcDrop(peerId, 'dc-error');

        dc.onmessage = (e) => {
            const msg = JSON.parse(e.data);
            if (msg.type === 'game-data') {
                emit('message', { from: peerId, payload: msg.payload });
            }
        };
    };

    // --- Запуск нового RTCPeerConnection для существующего или нового пира ---
    const startRtcConnection = (peerId, isInitiator) => {
        let peer = peers.get(peerId);
        if (!peer) {
            peer = { pc: null, dc: null, state: 'connecting', timer: null, attempts: 0 };
            peers.set(peerId, peer);
            if (isHost) emit('peer-joined', { peerId });
        } else {
            cleanupRtc(peer);
            peer.state = 'connecting';
        }

        const pc = new RTCPeerConnection(rtcConfig);
        peer.pc = pc;
        peer.timer = setTimeout(() => handleRtcDrop(peerId, 'timeout'), webrtcTimeoutMs);

        pc.onicecandidate = (e) => {
            if (e.candidate) {
                sendWs({ type: 'signal', to: peerId, data: { candidate: e.candidate } });
            }
        };

        pc.onconnectionstatechange = () => {
            if (['failed', 'disconnected', 'closed'].includes(pc.connectionState)) {
                handleRtcDrop(peerId, pc.connectionState);
            }
        };

        if (isInitiator) {
            const dc = pc.createDataChannel('game-data');
            setupDataChannel(peerId, dc);

            pc.createOffer()
                .then((offer) => pc.setLocalDescription(offer))
                .then(() => sendWs({ type: 'signal', to: peerId, data: { sdp: pc.localDescription } }))
                .catch(() => handleRtcDrop(peerId, 'offer-error'));
        } else {
            pc.ondatachannel = (e) => setupDataChannel(peerId, e.channel);
        }

        return peer;
    };

    const handleSignal = async (fromId, data) => {
        const peer = peers.get(fromId) || startRtcConnection(fromId, false);
        if (!peer || !peer.pc) return;

        try {
            if (data.sdp) {
                await peer.pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
                if (data.sdp.type === 'offer') {
                    const answer = await peer.pc.createAnswer();
                    await peer.pc.setLocalDescription(answer);
                    sendWs({ type: 'signal', to: fromId, data: { sdp: peer.pc.localDescription } });
                }
            } else if (data.candidate) {
                await peer.pc.addIceCandidate(new RTCIceCandidate(data.candidate));
            }
        } catch {
            handleRtcDrop(fromId, 'signal-error');
        }
    };

    // --- Входящие сообщения из WS ---
    const handleWsMessage = async (raw) => {
        let msg;
        try {
            msg = JSON.parse(raw);
        } catch {
            return;
        }

        if (!msg.from || msg.from === myId) return;

        // Новое подключение ИЛИ запрос на переподключение WebRTC от клиента
        if (msg.type === 'hello' && isHost) {
            startRtcConnection(msg.from, true);
            return;
        }

        if (msg.type === 'signal' && msg.to === myId) {
            await handleSignal(msg.from, msg.data);
            return;
        }

        if (msg.type === 'game-data') {
            if (!isHost && msg.from !== 'host') return;

            // Если хост получил данные по WS, значит клиент сейчас на временном или постоянном WS-фоллбеке
            if (isHost) {
                let peer = peers.get(msg.from);
                if (!peer) {
                    peer = { pc: null, dc: null, state: 'fallback', timer: null, attempts: maxReconnectAttempts };
                    peers.set(msg.from, peer);
                    emit('peer-joined', { peerId: msg.from });
                } else if (peer.state === 'webrtc') {
                    // Клиент уже отвалился от P2P и шлет по WS, а хост еще не заметил таймаут WebRTC
                    cleanupRtc(peer);
                    peer.state = 'reconnecting';
                }
            }

            emit('message', { from: msg.from, payload: msg.payload });
        }
    };

    // --- Публичный API ---
    const connect = async () => {
        await ensureWsOpen();
        if (!isHost) {
            startRtcConnection('host', false);
            sendWs({ type: 'hello' });
        }
        return myId;
    };

    const broadcast = (payload) => {
        const rawPacket = JSON.stringify({ type: 'game-data', payload });

        if (!isHost) {
            const host = peers.get('host');
            if (host?.state === 'webrtc' && host.dc?.readyState === 'open') {
                host.dc.send(rawPacket);
            } else {
                // Пока идет реконнект WebRTC или активен фоллбек — шлем через WS
                sendWs({ type: 'game-data', payload });
            }
            return;
        }

        let hasWsClients = false;
        for (const peer of peers.values()) {
            if (peer.state === 'webrtc' && peer.dc?.readyState === 'open') {
                peer.dc.send(rawPacket);
            } else {
                // Сюда попадают и клиенты в 'fallback', и клиенты в процессе 'reconnecting'
                hasWsClients = true;
            }
        }

        if (hasWsClients) {
            sendWs({ type: 'game-data', payload });
        }
    };

    return {
        myId,
        isHost,
        connect,
        broadcast,
        on
    };
}
