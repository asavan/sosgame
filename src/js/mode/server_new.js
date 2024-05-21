import netObj from "./net.js";
import connectionFunc from "../connection/socket.js";
import gamePresenter from "../models/game_presenter.js";
import qrRender from "../lib/qrcode.js";
import {removeElem} from "../utils/helper.js";

export default function startGame(window, document, settings) {
    return startGameAsync(window, document, settings);
}

async function startGameAsync(window, document, settings) {
    const con = await connection(window, document, settings);
    const gameCore = await loadFromStorageOrNetOrDefault(con, window, document, settings);
    const code = makeQr(window, document, settings);
    gameCore.on("changestate", (stateTransition) => {
        if (stateTransition.to === gameCore.IN_ROUND) {
            removeElem(code);
            setupRoundNetwork(gameCore.getCurrentRound(), con);
        }
    });
    // console.log(code);
    setupGameToConnectionSend(gameCore, con);
    setupConnectionToGame(gameCore, con);
}

function setupGameToConnectionSend() {
    // TODO
}

function setupConnectionToGame() {
    // TODO
}

async function connection(window, document, settings) {
    const myId = netObj.getMyId(window, settings, Math.random);
    const networkLogger = netObj.setupLogger(document, settings);
    const conF = connectionFunc(myId, networkLogger);
    const con = await conF.connect(conF.getWebSocketUrl(settings, window.location));
    return con;
}

async function loadFromStorageOrNetOrDefault(con, window, document, settings) {
    console.log(con, window, document, settings);
    return gamePresenter.presenter(settings.colorOrder);
}

function makeQr(window, document, settings) {
    const staticHost = settings.sh || window.location.href;
    const url = new URL(staticHost);
    console.log("enemy url", url.toString());
    return qrRender(url.toString(), document.querySelector(".qrcode"));
}

function setupRoundNetwork() {
    // TODO 
}
