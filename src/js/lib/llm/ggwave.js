// Извлекаем только критически важные данные из полного SDP
function packSDP(sdp) {
    const lines = sdp.split("\r\n");
    const ufrag = lines.find(l => l.startsWith("a=ice-ufrag:"))?.split(":")[1];
    const pwd = lines.find(l => l.startsWith("a=ice-pwd:"))?.split(":")[1];
    const fp = lines.find(l => l.startsWith("a=fingerprint:"))?.split(" ")[1];

    // Берем первый подходящий UDP-кандидат (для локальной сети host, для интернета srflx)
    const candLine = lines.find(l => l.startsWith("a=candidate:") && l.includes("udp"));
    const candParts = candLine.split(" ");
    const ip = candParts[4];
    const port = candParts[5];
    const type = candParts[7]; // 'host' или 'srflx'

    // Собираем в компактную строку через разделитель (~95-110 байт)
    return [ufrag, pwd, fp, ip, port, type].join("|");
}

function packSDP2(sdp) {
    const lines = sdp.split("\r\n");
    const ufrag = lines.find(l => l.startsWith("a=ice-ufrag:"))?.split(":")[1];
    const pwd = lines.find(l => l.startsWith("a=ice-pwd:"))?.split(":")[1];
    const fp = lines.find(l => l.startsWith("a=fingerprint:"))?.split(" ")[1];

    // Ищем все UDP host-кандидаты
    const hostCandidates = lines.filter(l =>
        l.startsWith("a=candidate:") &&
        l.includes("udp") &&
        l.includes("typ host")
    );

    // Приоритет: чистый IPv4 (короче и надежнее), запасной вариант: .local (mDNS)
    const bestCand = hostCandidates.find(l => !l.includes(".local") && !l.includes(":"))
        || hostCandidates[0];

    const candParts = bestCand.split(" ");
    const ip = candParts;
    const port = candParts;

    // Поскольку мы точно знаем, что в одной сети используем 'host',
    // тип кандидата можно даже не передавать по звуку (экономим еще 5 байт!)
    return [ufrag, pwd, fp, ip, port].join("|");
}


// Собираем валидный SDP обратно из сжатой строки
function unpackSDP(packed, type) { // type: 'offer' или 'answer'
    const [ufrag, pwd, fp, ip, port, candType] = packed.split("|");
    const setup = type === "offer" ? "actpass" : "active";

    return [
        "v=0",
        "o=- 0 0 IN IP4 127.0.0.1",
        "s=-",
        "t=0 0",
        "a=group:BUNDLE 0",
        "m=application 9 UDP/DTLS/SCTP webrtc-datachannel",
        "c=IN IP4 0.0.0.0",
        `a=ice-ufrag:${ufrag}`,
        `a=ice-pwd:${pwd}`,
        `a=fingerprint:sha-256 ${fp}`,
        `a=setup:${setup}`,
        "a=mid:0",
        "a=sctp-port:5000",
        `a=candidate:1 1 udp 2122260223 ${ip} ${port} typ ${candType}`,
        ""
    ].join("\r\n");
}

let ggwave = null;
let instance = null;
let audioCtx = null;

async function initAudio() {
    if (!ggwave) {
        ggwave = await ggwave_factory();
        const params = ggwave.getDefaultParameters();
        instance = ggwave.init(params);
        audioCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 48000 });
    }
}

// --- КОД ДЛЯ JOINER (КЛИЕНТА, КОТОРЫЙ НАЖАЛ F5) ---
async function sendAnswerBySound(packedAnswer) {
    await initAudio();

    // GGWAVE_PROTOCOL_AUDIBLE_FAST — быстрый слышимый режим (~16 байт/сек)
    // Для 100 байт звук продлится около 6 секунд
    const waveform = ggwave.encode(
        instance,
        packedAnswer,
        ggwave.ProtocolId.GGWAVE_PROTOCOL_AUDIBLE_FAST,
        10 // громкость (от 1 до 100)
    );

    // Воспроизводим сгенерированный массив сэмплов
    const buf = audioCtx.createBuffer(1, waveform.length, audioCtx.sampleRate);
    buf.getChannelData(0).set(new Float32Array(waveform.buffer));

    const source = audioCtx.createBufferSource();
    source.buffer = buf;
    source.connect(audioCtx.destination);
    source.start();
}

// --- КОД ДЛЯ HOST (УЗЛА ИЗ СЕТИ, КОТОРЫЙ СЛУШАЕТ) ---
async function listenForAnswer(peerConnection) {
    await initAudio();

    // Обязательно отключаем шумодав и эхоподавление, иначе Android исказит сигнал!
    const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
            echoCancellation: false,
            autoGainControl: false,
            noiseSuppression: false
        }
    });

    const mediaStream = audioCtx.createMediaStreamSource(stream);
    const recorder = audioCtx.createScriptProcessor(4096, 1, 1);

    recorder.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        // Скармливаем аудиопоток декодеру ggwave
        const res = ggwave.decode(instance, new Int8Array(new Float32Array(inputData).buffer));

        if (res && res.length > 0) {
            const packedAnswer = new TextDecoder("utf-8").decode(res);
            console.log("Пойман answer:", packedAnswer);

            // Восстанавливаем SDP и завершаем рукопожатие WebRTC
            const fullSdp = unpackSDP(packedAnswer, "answer");
            peerConnection.setRemoteDescription({ type: "answer", sdp: fullSdp });

            // Останавливаем прослушивание микрофона
            recorder.disconnect();
            mediaStream.disconnect();
            stream.getTracks().forEach(t => t.stop());
        }
    };

    mediaStream.connect(recorder);
    recorder.connect(audioCtx.destination);
}

