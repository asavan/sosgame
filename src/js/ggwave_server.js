import {GGWaveAudio} from "ggwave-js/web-audio";

// https://github.com/ggerganov/wave-share
// https://github.com/ggerganov/ggwave
// https://github.com/themonnie/ggwave-js

function addColons(cleanHash) {
    const pairs = [];

    for (let i = 0; i < cleanHash.length; i += 2) {
        pairs.push(cleanHash.slice(i, i + 2));
    }

    return pairs.join(":");
}

function restoreIp(ipCompressed) {
    if (ipCompressed.indexOf("-") >= 0) {
        return ipCompressed + ".local";
    }
    return ipCompressed;
}

export function unpackSDP(packed, type) { // type: 'offer' или 'answer'
    const [ipCompressed, port, ufrag, pwd, fpCompressed] = packed.split("|");
    const setup = type === "offer" ? "actpass" : "active";
    const fp = addColons(fpCompressed);
    const ip = restoreIp(ipCompressed);
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
        `a=candidate:1 1 udp 2122260223 ${ip} ${port} typ host generation 0 network-cost 999`,
        ""
    ].join("\r\n");
}

export async function unlockLocalNetworkIP(logger) {
    if (!navigator.mediaDevices) {
        logger.log("No media");
        return;
    }
    try {
        const stream = await navigator.mediaDevices.getUserMedia({audio: true});
        // Микрофон нам здесь не нужен, сразу выключаем индикатор записи
        stream.getTracks().forEach(track => track.stop());
    } catch (e) {
        logger.log("Доступ к микрофону отклонен, используем mDNS (.local) если доступен:", e);
    }
}

export async function waitForSound(logger) {
    const audio = new GGWaveAudio();
    await audio.init();

    const promise = Promise.withResolvers();

    logger.log("waitForSound1");

    await audio.startListening((data, text) => {
        logger.log("Received: " + text);
        audio.stopListening();
        promise.resolve(text);
    });
    logger.log("waitForSound2");
    return promise.promise;
}
