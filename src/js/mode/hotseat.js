import presenterObj from "../presenter.js";
import {showGameView} from "../views/section_view.js";

export default async function gameMode(window, document, settings, gameFunction) {
    showGameView(document);
    const presenter = presenterObj.presenterFuncDefault(settings);
    presenter.setMyTurn();
    const game = gameFunction(window, document, settings, presenter);
    presenter.on("nextPlayer", () => {
        presenter.setClientIndex(presenter.getCurrentIndex());
        return game.redraw();
    });
    presenter.resetRound();
    game.redraw();
    return game;
}
