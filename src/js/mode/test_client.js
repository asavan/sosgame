import presenterObj from "../presenter.js";
import {loggerFunc, netObj, addLoggerBtn, addFullScreenBtn, createDataChannelV2} from "netutils";
import {packSDP, sendSound} from "../ggwave_client.js";
import {addButton} from "netutils/src/js/views/buttons.js";

function getAddrFromSettings(host) {
    const hostUrl = new URL(host);
    return hostUrl.hostname;
}


export default async function test(window, document, settings, gameFunction) {
    addFullScreenBtn(window, document);
    addLoggerBtn(window, document);
    const presenter = presenterObj.presenterFuncDefault(settings);
    const game = gameFunction(window, document, settings, presenter);
    const mainLogger = loggerFunc(document, settings, 2, null, "mainLog");
    const logger = loggerFunc(document, settings, 2, null, "socketLogger");
    const myId = netObj.getMyId(window, settings, Math.random);
    mainLogger.log("Started " + myId);
    logger.log(JSON.stringify(settings));
    const rtcC = createDataChannelV2(logger, false);
    const dataTosend = await rtcC.processOffer(settings.webrtc);
    logger.log(JSON.stringify(dataTosend));
    const ip = getAddrFromSettings(settings.sh);
    const packedData = packSDP(dataTosend.sdp, ip, mainLogger);
    addButton(window, document, "v", "sound", async () => {
        mainLogger.log(packedData);
        await sendSound(packedData, mainLogger);
    });
    await rtcC.ready();
    logger.log("send join " + myId);
    presenter.resetRound();
    game.redraw();
    return Promise.resolve(game);
}
