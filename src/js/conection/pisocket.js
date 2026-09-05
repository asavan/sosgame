import {jsonSocketChan} from "../mode/test_helper.js";

// https://piehost.com/docs/3.0/websocket-example
// https://piehost.com/docs/3.0/websocket-api

export function piSocket(logger) {
    // const apiKeyDemo = 'oCdCMcMPQpbvNjUIzqtvF1d2X2okWpDQj4AwARJuAgtjhzKxVEjQU6IdCjwm';
    const apiKey = "DlfTS0rSzTPngQV3Apu7aVRNbjXg9vAFg0fvPKoe";
    const roomId = 907;
    // const url = `wss://demo.piesocket.com/v3/${roomId}?api_key=${apiKey}`;
    const url = `wss://free.blr2.piesocket.com/v3/${roomId}?api_key=${apiKey}`;
    return jsonSocketChan(url, logger);
}
