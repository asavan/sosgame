// Минимальный валидный WAV-файл (0.1 сек тишины) для разблокировки звука в Silent Mode на iPhone
const SILENT_WAV_BASE64 = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";

// Функция 1: Пробиваем аппаратный беззвучный режим iOS
async function unlockIosSilentMode() {
    try {
        const audio = new Audio(SILENT_WAV_BASE64);
        audio.setAttribute("playsinline", ""); // Чтобы iOS не пытался открыть плеер
        await audio.play();
    } catch (e) {
        console.warn("Не удалось проиграть silent-audio:", e);
    }
}

// Функция 2: Снимаем блокировку локальных IP-адресов в Safari/Chrome
async function unlockLocalNetworkIP() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Микрофон нам здесь не нужен, сразу выключаем индикатор записи
        stream.getTracks().forEach(track => track.stop());
    } catch (e) {
        console.warn("Доступ к микрофону отклонен, используем mDNS (.local) если доступен:", e);
    }
}

// Функция 3: Ожидание полного сбора ICE-кандидатов
function waitForIceGathering(pc) {
    return new Promise(resolve => {
        if (pc.iceGatheringState === "complete") {
            resolve();
        } else {
            const checkState = () => {
                if (pc.iceGatheringState === "complete") {
                    pc.removeEventListener("icegatheringstatechange", checkState);
                    resolve();
                }
            };
            pc.addEventListener("icegatheringstatechange", checkState);
            // Страховочный таймаут (на случай, если один из интерфейсов завис)
            setTimeout(resolve, 1500);
        }
    });
}

// --- ГЛАВНЫЙ ОБРАБОТЧИК НАЖАТИЯ НА КНОПКУ «ПОДКЛЮЧИТЬСЯ» ---
async function onConnectButtonClick(packedOfferFromUrl) {
    // 1. СРАЗУ внутри синхронного клика создаем и будим AudioContext (строгое требование iOS)
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    await audioCtx.resume();
    await unlockIosSilentMode();

    // 2. Разблокируем чистый локальный IPv4 (192.168.x.x)
    await unlockLocalNetworkIP();

    // 3. Настраиваем WebRTC без внешних STUN-серверов (для мгновенного локального сбора)
    const pc = new RTCPeerConnection({ iceServers: [] });

    pc.ondatachannel = (event) => {
        const dc = event.channel;
        dc.onopen = () => console.log("Ура! Соединение с Host установлено!");
        dc.onmessage = (e) => console.log("Сообщение от Host:", e.data);
    };

    // 4. Применяем offer из QR-кода и создаем answer
    const remoteSdp = unpackSDP(packedOfferFromUrl, "offer"); // функция из прошлых шагов
    await pc.setRemoteDescription({ type: "offer", sdp: remoteSdp });

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    // Ждем, пока в localDescription появятся кандидаты с реальным IPv4
    await waitForIceGathering(pc);

    // 5. Сжимаем готовый answer (~95 байт)
    const packedAnswer = packSDP(pc.localDescription.sdp);
    console.log("Отправляем по звуку:", packedAnswer);

    // 6. Инициализируем ggwave с РЕАЛЬНОЙ частотой дискретизации устройства (44100 или 48000)
    const ggwave = await ggwave_factory();
    const params = ggwave.getDefaultParameters();
    params.sampleRateInp = audioCtx.sampleRate;
    params.sampleRateOut = audioCtx.sampleRate;
    const instance = ggwave.init(params);

    // Кодируем в быстрый слышимый протокол (~6 секунд звука)
    const waveform = ggwave.encode(
        instance,
        packedAnswer,
        ggwave.ProtocolId.GGWAVE_PROTOCOL_AUDIBLE_FAST,
        15 // громкость
    );

    // 7. Воспроизводим в динамик
    const floatData = new Float32Array(waveform.buffer);
    const audioBuffer = audioCtx.createBuffer(1, floatData.length, audioCtx.sampleRate);
    audioBuffer.getChannelData(0).set(floatData);

    const source = audioCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioCtx.destination);
    source.start();

    return pc; // Возвращаем peerConnection для дальнейшей работы в mesh-сети
}
