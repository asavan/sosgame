import connectionFunc from "../connection/server_webrtc.js";
import lobbyFunc from "../lobby.js";
import netObj from "./net.js";
import presenterObj from "../presenter.js";
import {makeQrPlain} from "../views/qr_helper.js";
import {delay} from "../utils/helper.js";
import scanBarcode from "../views/barcode.js";

function connectNetworkAndGame() {
    // later
}

function showReadBtn(document, logger) {
    const barCodeready = Promise.withResolvers();
    const qrBtn = document.querySelector(".qr-btn");
    qrBtn.classList.remove("hidden");
    qrBtn.addEventListener("click", async () => {
        const codes = await scanBarcode(logger, document);
        logger.error(codes);
        barCodeready.resolve(codes);
    });

    return barCodeready.promise;
}

export default function gameMode(window, document, settings, gameFunction) {
    return new Promise((resolve, reject) => {
        const networkLogger = netObj.setupLogger(document, settings);
        const myId = netObj.getMyId(window, settings, Math.random);
        const connection = connectionFunc(myId, networkLogger);
        const mainSection = document.querySelector(".game");
        mainSection.classList.add("hidden");

        const offerPromice = connection.placeOfferAndWaitCandidates();
        const timer = delay(2000);
        Promise.race([offerPromice, timer]).then(() => {
            const dataToSend = connection.getOfferAndCands();
            const baseUrl = "https://asavan.github.io/sosgame/";
            const jsonString = JSON.stringify(dataToSend);
            const encodedString = encodeURIComponent(jsonString);
            const url = baseUrl + "?con= " + encodedString;
            makeQrPlain(url, document, ".qrcode");

            showReadBtn(document, networkLogger).then(async (answerAndCand) => {
                networkLogger.error(answerAndCand);
                connection.on("open", (openCon) => {
                    mainSection.classList.remove("hidden");
                    const menuSection = document.querySelector(".menu");
                    menuSection.querySelector(".control-panel")?.classList.add("absolute");
                    const presenter = presenterObj.presenterFuncDefault(settings);
                    const game = gameFunction(window, document, settings, presenter);
                    const lobby = lobbyFunc({}, presenter.getClientIndex());
                    lobby.addClient(myId, myId);
                    connectNetworkAndGame(game, openCon);
                    resolve(game);
                });
                await connection.setAnswerAndCand(answerAndCand);
                console.log("after set", answerAndCand);
            }).catch((e) => {
                reject(e);
            });
        }).catch(error => {
            networkLogger.error(error);
            reject(error);
        });
    });
}
