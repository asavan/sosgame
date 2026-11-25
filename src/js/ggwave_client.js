import { GGWaveAudio } from "ggwave-js/web-audio";


export async function unlockLocalNetworkIP(logger) {
    if (!navigator.mediaDevices) {
        logger.log("No media");
        return;
    }
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
    } catch (e) {
        logger.log("Доступ к микрофону отклонен, используем mDNS (.local) если доступен:", e);
    }
}

function removeColons(hash) {
    return hash.replaceAll(":", "");
}

function removeSuffix(str, suffix) {
    if (str.endsWith(suffix)) {
        return str.slice(0, -suffix.length);
    }
    return str;
}

export function packSDP(sdp, logger) {
    const lines = sdp.split("\r\n");
    const ufrag = lines.find(l => l.startsWith("a=ice-ufrag:"))?.split(":")[1];
    const pwd = lines.find(l => l.startsWith("a=ice-pwd:"))?.split(":")[1];
    const fp = lines.find(l => l.startsWith("a=fingerprint:"))?.split(" ")[1];

    const hostCandidates = lines.filter(l =>
        l.startsWith("a=candidate:") &&
        // l.includes('udp') &&
        l.includes("typ host")
    );

    logger.log(hostCandidates);

    let bestCand = hostCandidates.find(l => !l.includes(".local"));
    if (!bestCand) {
        bestCand = hostCandidates[0];
    }
    logger.log(bestCand);
    const candParts = bestCand.split(" ");
    let ip = candParts[4];
    const port = candParts[5];
    logger.log(ip);
    logger.log(port);
    ip = removeSuffix(ip, ".local");

    // Поскольку мы точно знаем, что в одной сети используем 'host',
    // тип кандидата можно даже не передавать по звуку (экономим еще 5 байт!)
    const fpCompressed = removeColons(fp);
    return [ip, port, ufrag, pwd, fpCompressed].join("|");
}

export async function sendSound(data) {
    const audio = new GGWaveAudio();
    await audio.init();
    await audio.send(data, { protocol: 2, volume: 25 });
}
