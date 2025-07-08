import connectionFunc from "../connection/server_webrtc.js";
import lobbyFunc from "../lobby.js";
import netObj from "./net.js";
import presenterObj from "../presenter.js";
import {makeQrPlain} from "../views/qr_helper.js";
import { delay } from "../utils/helper.js";
import scanBarcode from "../views/barcode.js";
import LZString from "lz-string";
import {showGameView} from "../views/section_view.js";
import loggerFunc from "../views/logger.js";
import actionsFunc from "../actions.js";
import PromiseQueue from "../utils/async-queue.js";

function setupGameToConnectionSend(game, con, serverId, lobby) {
    for (const handlerName of game.actionKeys()) {
        game.on(handlerName, (n) => {
            let ignore;
            if (n && n.playerId !== undefined) {
                const toIgnore = lobby.idByInd(n.playerId);
                ignore = [toIgnore];
            }
            con.sendRawAll(handlerName, n, ignore);
        });
    }
    return Promise.resolve();
    // return reconnect(con, serverId);
}

function connectNetworkAndGame(document, game, presenter, myId, settings, con, connection) {
    const lobby = lobbyFunc({}, presenter.getClientIndex());
    lobby.addClient(myId, myId);

    const gameLogger = loggerFunc(document, settings);
    const queue = PromiseQueue(gameLogger);

    connection.on("join", (data) => {
        lobby.addClient(data.from, data.from);
        const joinedInd = lobby.indById(data.from);
        const serverInd = lobby.indById(myId);
        if (lobby.size() === settings.playerLimit && presenter.isGameOver()) {
            presenter.resetRound();
        }

        const presenterObj = presenter.toJson(joinedInd);
        const toSend = {
            serverId: myId,
            joinedInd,
            serverInd,
            presenter: presenterObj
        };
        con.sendRawTo("gameinit", toSend, data.from);
        game.redraw();
    });

    const actions = actionsFunc(game);
    connection.registerHandler(actions, queue);
    return setupGameToConnectionSend(game, con, myId, lobby);
}

function showReadBtn(document, logger) {
    const barCodeready = Promise.withResolvers();
    const qrBtn = document.querySelector(".qr-btn");
    qrBtn.classList.remove("hidden");
    qrBtn.addEventListener("click", async () => {
        let codes = await scanBarcode(logger, document);
        logger.log(codes);
        if (!codes) {
            const sign = prompt("Get code from qr");
            if (sign === null) {
                barCodeready.reject();
                return;
            }
            codes = sign;
        }
        const decode = LZString.decompressFromEncodedURIComponent(codes);
        barCodeready.resolve(JSON.parse(decode));
    });

    return barCodeready.promise;
}

export default function gameMode(window, document, settings, gameFunction) {
    return new Promise((resolve, reject) => {
        const networkLogger = loggerFunc(document, settings);
        const myId = netObj.getMyId(window, settings, Math.random);
        const connection = connectionFunc(myId, networkLogger);
        const mainSection = document.querySelector(".game");
        mainSection.classList.add("hidden");

        const offerPromice = connection.placeOfferAndWaitCandidates();
        const timer = delay(2000);
        Promise.race([offerPromice, timer]).then(() => {
            const dataToSend = connection.getOfferAndCands();
            const currentUrl = new URL(window.location.href);
            const urlWithoutParams = currentUrl.origin + currentUrl.pathname;
            const baseUrl = urlWithoutParams || "https://asavan.github.io/sosgame/";
            const jsonString = JSON.stringify(dataToSend);
            const encoded2 = LZString.compressToEncodedURIComponent(jsonString);
            const url2 = baseUrl + "?mode=cwrtc&c=" + encoded2;
            makeQrPlain(url2, document, ".qrcode");

            showReadBtn(document, networkLogger).then(async (answerAndCand) => {
                networkLogger.log(answerAndCand);
                connection.on("open", (openCon) => {
                    showGameView(document); const presenter = presenterObj.presenterFuncDefault(settings);
                    const game = gameFunction(window, document, settings, presenter);
                    connectNetworkAndGame(document, game, presenter, myId, settings, openCon, connection);
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
