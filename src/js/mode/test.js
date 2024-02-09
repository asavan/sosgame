"use strict";

export default function test(window, document, settings, gameFunction) {
    return new Promise((resolve) => {
        const game = gameFunction(window, document, settings);
        game.on("gameover", () => {
            const btnAdd = document.querySelector(".butInstall");
            btnAdd.classList.remove("hidden2");
        });

        resolve(game);
    });
}
