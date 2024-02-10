"use strict"; // jshint ;_;


import presenterFunc from "./presenter.js";
import fieldObj from "./field.js";
import {delay} from "./utils/helper.js";

function stub(message) {
    console.trace("Stub " + message);
}

const handleClick = function (evt, parent) {
    const getIndex = function (e, parent) {
        const target = e.target || e.srcElement;
        for (let i = 0; i < parent.children.length; i++) {
            if (parent.children[i] === target) return i;
        }
        return -1;
    };

    evt.preventDefault();
    if (!evt.target.classList.contains("cell") || evt.target.classList.contains("disabled")) {
        return -1;
    }
    return getIndex(evt, parent);
};

function drawDigits(presenter, digits, settings) {
    for (let i = 0; i < 2; i++) {
        const tile = digits.childNodes[i];
        for (const color of settings.colorOrder) {
            tile.classList.remove(color);
        }
        if (presenter.getActiveDigitIndex() === i) {
            tile.classList.add("active");
            tile.classList.add(presenter.currentColor());
        } else {
            tile.classList.remove("active");

        }
    }
}

function draw(presenter, box) {
    const iter = presenter.enum1();
    for (const [i, obj] of iter) {
        const tile = box.childNodes[i];
        const val = obj.text;

        tile.textContent = val.toString();
        if (tile.textContent === " ") {
            // prevent cell shrinking
            tile.innerHTML = "&nbsp;";
        }
        if (val && val !== " ") {
            tile.className = "cell disabled";
        } else {
            tile.className = "cell";
        }

        if (obj.isActive) {
            tile.classList.add("active");
            tile.classList.add(presenter.currentColor());
        }
        if (obj.color) {
            tile.classList.add(obj.color);
        }
        if (obj.isLastMove) {
            tile.classList.add("last");
        }
    }
}

export default function game(window, document, settings) {

    const field = document.querySelector(".field");
    const box = document.getElementsByClassName("box")[0];
    const digits = document.getElementsByClassName("buttons")[0];
    const overlay = document.getElementsByClassName("overlay")[0];
    const close = document.getElementsByClassName("close")[0];
    const btnInstall = document.getElementsByClassName("install")[0];
    const root = document.documentElement;
    root.style.setProperty("--field-size", settings.size);
    field.classList.remove("disabled");


    const presenter = presenterFunc(settings);

    const handlers = {
        "message": stub,
        "gameover": stub
    };

    function onGameEnd(res) {
        const message = presenter.endMessage(res);
        const h2 = overlay.querySelector("h2");
        h2.textContent = message;
        const content = overlay.querySelector(".content");
        content.textContent = presenter.endMessage2(res);
        overlay.classList.add("show");
        btnInstall.classList.remove("hidden2");
        field.classList.add("disabled");
        handlers["gameover"]();
    }

    function on(name, f) {
        handlers[name] = f;
    }

    const actionKeys = () => Object.keys(handlers);

    async function animate(result) {
        const res = result.res;
        if (res !== fieldObj.IMPOSSIBLE_MOVE) {
            console.log("animate", result);
            draw(presenter, box);
            drawDigits(presenter, digits, settings);
            await handlers["message"](result);
        }

        if (res === fieldObj.WINNING_MOVE || res === fieldObj.DRAW_MOVE) {
            onGameEnd(res);
        }
    }

    async function doStep() {
        await delay(200);
        const result = presenter.tryMove();
        await animate(result);
    }

    const handleBox = function (evt) {
        const ind = handleClick(evt, box);
        if (ind < 0) {
            return;
        }
        presenter.setActivePosition(ind);
        draw(presenter, box);
        doStep();
    };

    const handleClickDigits = function (evt) {
        const ind = handleClick(evt, digits);
        if (ind < 0) {
            return;
        }
        presenter.setActiveDigitIndex(ind);
        drawDigits(presenter, digits, settings);
        doStep();
    };

    function initField(fieldSize, className, elem) {
        for (let i = 0; i < fieldSize; i++) {
            const cell = document.createElement("div");
            cell.className = className;
            elem.appendChild(cell);
        }
    }

    function onMessage({res, position, digit, playerId}) {
        const result = presenter.setMove(position, digit, playerId);
        console.log("onMessage", res === result.res);
        return animate(result);
    }

    initField(presenter.size(), "cell", box);

    box.addEventListener("click", handleBox, false);
    digits.addEventListener("click", handleClickDigits, false);
    close.addEventListener("click", function (e) {
        e.preventDefault();
        overlay.classList.remove("show");
    }, false);

    return {
        on,
        actionKeys,
        onMessage
    };
}
