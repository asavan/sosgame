import connectionFunc from "../connection/client_webrtc.js";
import lobbyFunc from "../lobby.js";
import netObj from "./net.js";
import presenterObj from "../presenter.js";
import {makeQrPlain} from "../views/qr_helper.js";
import {delay} from "../utils/helper.js";

import LZString from "lz-string";
import {showGameView} from "../views/section_view.js";
import loggerFunc from "../views/logger.js";


function connectNetworkAndGame() {
    // later
}


export default async function gameMode(window, document, settings, gameFunction) {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const mainSection = document.querySelector(".game");
    mainSection.classList.add("hidden");
    const connectionStr = urlParams.get("c");
    const networkLogger = loggerFunc(document, settings);
    const myId = netObj.getMyId(window, settings, Math.random);
    const connection = connectionFunc(myId, networkLogger);
    const offerAndCandidatesStr = LZString.decompressFromEncodedURIComponent(connectionStr);
    const offerAndCandidates = JSON.parse(offerAndCandidatesStr);
    const gamePromice = Promise.withResolvers();
    connection.on("open", (openCon) => {
        showGameView(document);
        const presenter = presenterObj.presenterFuncDefault(settings);
        const game = gameFunction(window, document, settings, presenter);
        const lobby = lobbyFunc({}, presenter.getClientIndex());
        lobby.addClient(myId, myId);
        connectNetworkAndGame(game, openCon);
        gamePromice.resolve(game);
    });
    const answer = await connection.processOffer(offerAndCandidates);
    const timer = delay(2000);
    const candidatesPromice = connection.getCandidates();
    const cands = await Promise.race([candidatesPromice, timer]);

    const dataToSend = {sdp: answer.sdp};
    if (cands) {
        dataToSend.c = cands;
    }
    const jsonString = JSON.stringify(dataToSend);
    const encoded2 = LZString.compressToEncodedURIComponent(jsonString);
    makeQrPlain(encoded2, document, ".qrcode");
    return gamePromice.promise;
}
