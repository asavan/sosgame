export default function startGame(window, document, settings) {
    return startGameAsync(window, document, settings);
}

async function startGameAsync(window, document, settings) {
    const con = connection();

    const gameCore = init_client(con, window, document);
    setupGameToConnectionSend(gameCore, con);
    setupConnectionToGame(gameCore, con);
}
function init_client(con, window, document) {

}
