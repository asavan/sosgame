import presenterObj from "../presenter.js";

export default function gameMode(window, document, settings, gameFunction) {
    return new Promise((resolve) => {
        const presenter = presenterObj.presenterFuncDefault(settings);
        const game = gameFunction(window, document, settings, presenter);
        resolve(game);
    });
}
