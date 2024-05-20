import presenterObj from "../presenter.js";
import {delay} from "../utils/helper.js";
import simpleBot from "../bot/simple_bot.js";

function botTryToMove(presenter, botInd, game) {
    const state = presenter.toJson(botInd);
    if (state.currentUserIdx !== botInd) {
        return;
    }
    const move = simpleBot.simpleMoveArr(state.fieldArr);
    move.playerId = botInd;
    return game.onMessage(move);
}

export default function ai(window, document, settings, gameFunction) {
    return new Promise((resolve) => {
        const presenter = presenterObj.presenterFuncDefault(settings);
        const game = gameFunction(window, document, settings, presenter);
        const userInd = 0;
        const botInd = 1;
        game.on("gameover", () => {
            const btnAdd = document.querySelector(".butInstall");
            btnAdd.classList.remove("hidden2");
        });

        game.on("message", async (data) => {
            if (data.playerId !== userInd) {
                return;
            }
            await delay(100);
            await botTryToMove(presenter, botInd, game);
        });

        game.on("winclosed", () => {
            presenter.nextRound();
            game.redraw();
            botTryToMove(presenter, botInd, game);
        });
        
        botTryToMove(presenter, botInd, game);
        resolve(game);
    });
}
