export async function processCandidates(candidates, peerConnection) {
    for (const candMessage of candidates) {
        if (!candMessage.candidate) {
            await peerConnection.addIceCandidate(null);
        } else {
            await peerConnection.addIceCandidate(candMessage);
        }
    }
}
