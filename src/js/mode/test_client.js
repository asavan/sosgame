import {loggerFunc, netObj, addLoggerBtn, addFullScreenBtn, createDataChannelV2, addButton} from "netutils";
import {packSDP, sendSound} from "../ggwave_client.js";

export default async function test(window, document, settings) {
    addFullScreenBtn(window, document);
    addLoggerBtn(window, document);
    const mainLogger = loggerFunc(document, settings, 2, null, "mainLog");
    const logger = loggerFunc(document, settings, 2, null, "socketLogger");
    const myId = netObj.getMyId(window, settings, Math.random);
    mainLogger.log("Started " + myId);
    logger.log(JSON.stringify(settings));
    const rtcC = createDataChannelV2(logger, false);
    const dataToSend = await rtcC.processOffer(settings.webrtc);
    logger.log(JSON.stringify(dataToSend));
    const packedData = packSDP(dataToSend.sdp, mainLogger);
    addButton(window, document, "🔊", "sound", async () => {
        mainLogger.log(packedData);
        await sendSound(packedData, mainLogger);
    });
    await rtcC.ready();
    logger.log("send join " + myId);
}
