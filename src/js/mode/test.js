import presenterObj from "../presenter.js";

export default function test(window, document, settings, gameFunction) {
    const presenter = presenterObj.presenterFuncDefault(settings);
    const game = gameFunction(window, document, settings, presenter);
    game.on("gameover", () => {
        const btnAdd = document.querySelector(".butInstall");
        btnAdd.classList.remove("hidden2");
    });

    presenter.resetRound();
    game.redraw();
    return Promise.resolve(game);
}
