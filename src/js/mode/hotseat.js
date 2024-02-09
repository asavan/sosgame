export default function gameMode(window, document, settings, gameFunction) {
    return new Promise((resolve) => {
        const game = gameFunction(window, document, settings);
        resolve(game);
    });
}
