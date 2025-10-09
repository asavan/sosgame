import {assert, delay} from "netutils";
import bot from "../bot/second_best_bot.js";
import fieldObj from "../field.js";
import lobbyFunc from "../lobby.js";
import presenterObj from "../presenter.js";


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

export default async function ai(window, document, settings, gameFunction) {
    const presenter = presenterObj.presenterFuncDefault(settings);
    const game = gameFunction(window, document, settings, presenter);
    const userInd = presenter.getClientIndex();
    const myId = "user";
    const lobby = lobbyFunc({}, userInd, myId);
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
        return botTryToMove(presenter, game);
    });
    presenter.resetRound();
    game.redraw();
    await botTryToMove(presenter, game);
    return game;
}
