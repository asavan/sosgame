import presenterObj from "../presenter.js";

export default function gameMode(window, document, settings, gameFunction) {
    return new Promise((resolve) => {
        const presenter = presenterObj.presenterFuncDefault(settings);
        presenter.setMyTurn();
        const game = gameFunction(window, document, settings, presenter);
        presenter.on("nextPlayer", () => {
            presenter.setClientIndex(presenter.getCurrentIndex());
            return game.redraw();
        });
        presenter.resetRound();
        game.redraw();
        resolve(game);
    });
}
