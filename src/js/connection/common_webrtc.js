export async function processCandidates(candidates, peerConnection) {
    for (const candMessage of candidates) {
        if (!candMessage.candidate) {
            await peerConnection.addIceCandidate(null);
        } else {
            await peerConnection.addIceCandidate(candMessage);
        }
    }
}

export function SetupFreshConnection(id, logger, localCandidates, candidateWaiter) {
    const peerConnection = new RTCPeerConnection(null);
    // window.pc = peerConnection;

    peerConnection.onicecandidate = e => {
        logger.log("Received icecandidate", id, e);
        if (!e) {
            logger.error("No ice");
            return;
        }
        const message = {
            type: "candidate",
            candidate: null,
        };
        if (e.candidate) {
            message.candidate = e.candidate.candidate;
            message.sdpMid = e.candidate.sdpMid;
            message.sdpMLineIndex = e.candidate.sdpMLineIndex;
        }
        localCandidates.push(message);

        if (!e.candidate) {
            candidateWaiter.resolve(localCandidates);
        }
    };

    peerConnection.oniceconnectionstatechange = (e) => {
        logger.log("connection statechange", e);
        if (peerConnection.iceConnectionState === "failed") {
            logger.error("failed iceConnectionState");
            // peerConnection.restartIce();
        }
    };

    return peerConnection;
}
