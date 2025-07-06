import {delay} from "../utils/helper.js";

export default async function scanBarcode(logger, document) {
    try {
        const videoCont = document.querySelector(".video-barcode");
        if (!videoCont || videoCont.querySelector("video")) {
            return;
        }
        const barcodeDetector = new BarcodeDetector({formats: ["qr_code"]});
        const stream = await navigator.mediaDevices.getUserMedia({video: {facingMode: "environment"}});
        const video = document.createElement("video");
        video.srcObject = stream;
        videoCont.appendChild(video);
        // video.autoplay = true;
        await video.play();
        const codesPromice = Promise.withResolvers();

        async function detect(codesPromice) {
            const barcodes = await barcodeDetector.detect(video);
            if (barcodes.length > 0) {
                logger.log(barcodes);
                // Process the detected barcodes
                stream.getTracks().forEach(track => track.stop()); // Stop the camera when done
                video.remove();
                codesPromice.resolve(barcodes[0].rawValue);
            } else {
                logger.error("No codes found");
                await delay(100);
                requestAnimationFrame(() => {
                    detect(codesPromice);
                });
            }
            return codesPromice;
        }

        detect(codesPromice);
        return codesPromice.promise;
    } catch (error) {
        logger.error("Error accessing camera or detecting barcodes:", error);
    }
}
