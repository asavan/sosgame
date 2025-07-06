export default async function scanBarcode(logger, document) {
    try {
        logger.error("before media1");
        const barcodeDetector = new BarcodeDetector({ formats: ["qr_code"] });
        logger.error("before media2");
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        const video = document.createElement("video");
        video.srcObject = stream;
        document.querySelector(".video-barcode").appendChild(video);
        // video.autoplay = true;
        await video.play();
        logger.error("after media2");
        const barcodes = await barcodeDetector.detect(video);

        if (barcodes.length > 0) {
            logger.log(barcodes);
            // Process the detected barcodes
            stream.getTracks().forEach(track => track.stop()); // Stop the camera when done
        }
        return barcodes;
    } catch (error) {
        logger.error("Error accessing camera or detecting barcodes:", error);
    }
}
