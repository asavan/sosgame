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
    let qrBtn = document.querySelector(".qr-btn");
    qrBtn.classList.remove("hidden");
    qrBtn.addEventListener("click", async () => {
        logger.error("before");
        const codes = await scanBarcode(logger);
        logger.error("after", codes);
        barCodeready.resolve(codes);
    });

    return barCodeready.promise;
}

export default function gameMode(window, document, settings, gameFunction) {
    return new Promise((resolve, reject) => {
        const networkLogger = netObj.setupLogger(document, settings);
        showReadBtn(document, networkLogger);
        const myId = netObj.getMyId(window, settings, Math.random);
        const connection = connectionFunc(myId, networkLogger);
        const lobby = lobbyFunc({}, presenter.getClientIndex());
        lobby.addClient(myId, myId);

        const offerPromice = connection.placeOfferAndWaitCandidates();
        const timer = delay(2000);
        Promise.race([offerPromice, timer]).then(() => {
            const dataToSend = connection.getOfferAndCands();
            const baseUrl = "https://asavan.github.io/sosgame/";
            const jsonString = JSON.stringify(dataToSend);
            const encodedString = encodeURIComponent(jsonString);
            const url = baseUrl + "?con= " + encodedString;
            makeQrPlain(url, document, ".qrcode");

            showReadBtn(document).then(async (answerAndCand) => {
                connection.on("open", (openCon) => {
                    const presenter = presenterObj.presenterFuncDefault(settings);
                    const game = gameFunction(window, document, settings, presenter);
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
