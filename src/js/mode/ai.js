import presenterObj from "../presenter.js";

export default function ai(window, document, settings, gameFunction) {
    return new Promise((resolve) => {
        const presenter = presenterObj.presenterFuncDefault(settings);
        const game = gameFunction(window, document, settings, presenter);

        game.on("gameover", () => {
            const btnAdd = document.querySelector(".butInstall");
            btnAdd.classList.remove("hidden2");
        });

        resolve(game);
    });
}
