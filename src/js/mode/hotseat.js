import presenterObj from "../presenter.js";

export default function gameMode(window, document, settings, gameFunction) {
    return new Promise((resolve) => {
        const presenter = presenterObj.presenterFuncDefault(settings);
        presenter.setMyTurn();
        const game = gameFunction(window, document, settings, presenter);
        game.on("message", () => {
            presenter.setClientIndex(presenter.getCurrentIndex());
            // game.redraw();
        });
        resolve(game);
    });
}
