import {loggerFunc, netObj, addLoggerBtn, addFullScreenBtn, createDataChannelV2} from "netutils";
import {qrHandler} from "../views/manual-qr.js";
import JSONCrush from "jsoncrush";
import {unpackSDP, waitForSound} from "../ggwave_server.js";


function showQr(window, document, settings, dataToSend, logger) {
    const urlWithoutParams = netObj.getHostUrl(settings, window.location);
    const baseUrl = urlWithoutParams;
    let url4 = baseUrl;
    if (dataToSend) {
        const finalData = {
            "webrtc": dataToSend,
            "mode": "test_client"
        };
        const jsonString = JSON.stringify(finalData);
        const encoded3 = JSONCrush.crush(jsonString);
        const encoded4 = window.encodeURIComponent(encoded3);
        url4 = baseUrl + "?z=" + encoded4;
    } else {
        logger.log("No data", dataToSend);
    }
    return url4;
}

export default async function test(window, document, settings) {
    addFullScreenBtn(window, document);
    addLoggerBtn(window, document);
    const handle = qrHandler(window, document);
    const mainLogger = loggerFunc(document, settings, 3, null, "mainLog");
    const logger = loggerFunc(document, settings, 2, null, "socketLogger");
    const myId = netObj.getMyId(window, settings, Math.random);
    mainLogger.log("Started " + myId);
    // await unlockLocalNetworkIP(mainLogger);
    const rtcC = createDataChannelV2(logger, true);
    const dataToSend = await rtcC.createOffer("test1");
    mainLogger.log("data " + JSON.stringify(dataToSend));
    const strUrl = showQr(window, document, settings, dataToSend, logger);
    mainLogger.log("dataUrl " + strUrl);
    handle.set(strUrl);
    const packedSdp = await waitForSound(mainLogger);
    const sdp = unpackSDP(packedSdp, "answer");
    const answer = {
        sdp,
        type: "answer",
    };
    logger.log(answer);
    await rtcC.processAnswer(answer);
    await rtcC.ready();
    logger.log("send join " + myId);
}
