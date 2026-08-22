import {assert, delay, lobby as lobbyFunc, loggerFunc} from "netutils";
import bot from "../bot/second_best_bot.js";
import fieldObj from "../field.js";
import presenterObj from "../presenter.js";
import {showGameView} from "../views/section_view.js";


function botTryToMove(presenter, game, logger) {
    const botInd = presenter.getCurrentIndex();
    logger.log("bot indexes " + JSON.stringify({botInd, myInd: presenter.getClientIndex()}));
    if (botInd === presenter.getClientIndex()) {
        return;
    }
    const state = presenter.toJson(botInd);
    assert(state.currentUserIdx === botInd, "Corrupt data");
    const move = bot.bestMove(fieldObj.field(state.fieldArr));
    move.playerId = botInd;
    logger.log("bot try to move");
    return game.onMessage(move);
}

export default async function ai(window, document, settings, gameFunction) {
    showGameView(document);
    const logger = loggerFunc(document, settings, 1, null, "aiLog");
    const presenter = presenterObj.presenterFuncDefault(settings);
    const game = gameFunction(window, document, settings, presenter);
    const userInd = presenter.getClientIndex();
    const myId = "user";
    logger.log("Started ai " + JSON.stringify({myId, userInd}));
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
        logger.log("get msg " + JSON.stringify(data));
        if (data.playerId !== userInd) {
            return;
        }
        await delay(100);
        logger.log("botTryToMove ");
        await botTryToMove(presenter, game, logger);
    });

    game.on("winclosed", () => {
        presenter.nextRound();
        game.redraw();
        return botTryToMove(presenter, game, logger);
    });
    presenter.resetRound();
    game.redraw();
    await botTryToMove(presenter, game, logger);
    return game;
}
