import presenterObj from "../presenter.js";
import {delay, assert} from "../utils/helper.js";
import bot from "../bot/random_bot.js";
import lobbyFunc from "../lobby.js";
import fieldObj from "../field.js";


function botTryToMove(presenter, game) {
    const botInd = presenter.getCurrentIndex();
    if (botInd === presenter.getClientIndex()) {
        return;
    }
    const state = presenter.toJson(botInd);
    assert(state.currentUserIdx === botInd, "Corrupt data");
    const move = bot.bestMove(fieldObj.field(state.fieldArr));
    move.playerId = botInd;
    return game.onMessage(move);
}

export default function ai(window, document, settings, gameFunction) {
    return new Promise((resolve) => {
        const presenter = presenterObj.presenterFuncDefault(settings);
        const game = gameFunction(window, document, settings, presenter);
        const userInd = presenter.getClientIndex();
        const lobby = lobbyFunc({}, userInd);
        lobby.addClient("user", "user");

        for (let i = 1; i < presenter.getPlayersSize(); ++i) {
            const name = "bot" + i;
            lobby.addClient(name, name);
        }

        game.on("gameover", () => {
            const btnAdd = document.querySelector(".butInstall");
            btnAdd.classList.remove("hidden2");
        });

        game.on("message", async (data) => {
            if (data.playerId !== userInd) {
                return;
            }
            await delay(100);
            await botTryToMove(presenter, game);
        });

        game.on("winclosed", () => {
            presenter.nextRound();
            game.redraw();
            botTryToMove(presenter, game);
        });
        presenter.resetRound();
        botTryToMove(presenter, game);
        game.redraw();
        resolve(game);
    });
}
