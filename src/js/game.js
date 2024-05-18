import fieldObj from "./field.js";
import {delay, assert} from "./utils/helper.js";
import handlersFunc from "./utils/handlers.js";

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

function drawField(presenter, box, digits, settings, overlay, btnInstall, field) {
    draw(presenter, box);
    drawDigits(presenter, digits, settings);
    if (presenter.isMyMove()) {
        field.classList.remove("disabled");
    } else {
        field.classList.add("disabled");
    }
    if (presenter.isGameOver()) {
        const res = presenter.calcLastMoveRes();
        if (res === fieldObj.WINNING_MOVE || res === fieldObj.DRAW_MOVE) {
            onGameEndDraw(res, presenter, overlay, btnInstall, field);
        }
    }
}

function initField(document, fieldSize, className, elem) {
    assert(elem);
    for (let i = 0; i < fieldSize; i++) {
        const cell = document.createElement("div");
        cell.className = className;
        elem.appendChild(cell);
    }
}


function onGameEndDraw(res, presenter, overlay, btnInstall, field) {
    const message = presenter.endMessage(res);
    const h2 = overlay.querySelector("h2");
    h2.textContent = message;
    const content = overlay.querySelector(".content");
    content.textContent = presenter.endMessage2(res);
    overlay.classList.add("show");
    btnInstall.classList.remove("hidden2");
    field.classList.add("disabled");
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

function setupOverlay(document) {
    const overlay = document.querySelector(".overlay");
    const close = document.querySelector(".close");
    assert(overlay, "No overlay");
    assert(close, "No close button");
    close.addEventListener("click", function (e) {
        e.preventDefault();
        overlay.classList.remove("show");
    }, false);
    return overlay;
}

export default function game(_window, document, settings, presenter) {
    const field = document.querySelector(".field");
    const box = document.getElementsByClassName("box")[0];
    const digits = document.getElementsByClassName("buttons")[0];
    const btnInstall = document.getElementsByClassName("install")[0];
    const overlay = setupOverlay(document);
    const root = document.documentElement;
    root.style.setProperty("--field-size", presenter.size());
    // field.classList.remove("disabled");

    const handlers = handlersFunc(["message", "gameover", "started"]);

    function on(name, f) {
        return handlers.on(name, f);
    }
    const actionKeys = handlers.actionKeys;
    const makePresenter = presenter.toJson;

    async function animate(result, fromId) {
        const res = result.res;
        if (res !== fieldObj.IMPOSSIBLE_MOVE) {
            drawField(presenter, box, digits, settings, overlay, btnInstall, field);
            let toSend = result;
            if (fromId) {
                toSend = {data: result, ignore: [fromId]};
            }
            await handlers.call("message", toSend);
            if (res === fieldObj.WINNING_MOVE || res === fieldObj.DRAW_MOVE) {
                await handlers.call("gameover", toSend);
            }
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


    function onMessage({res, position, digit, playerId}, fromId) {
        const result = presenter.setMove(position, digit, playerId);
        console.log("onMessage", res === result.res, fromId);
        return animate(result, fromId);
    }

    initField(document, presenter.size(), "cell", box);
    box.addEventListener("click", handleBox, false);
    digits.addEventListener("click", handleClickDigits, false);

    drawField(presenter, box, digits, settings, overlay, btnInstall, field);

    presenter.on("firstmove", (obj) => {
        return handlers.call("started", obj);
    });

    return {
        on,
        actionKeys,
        onMessage,
        makePresenter
    };
}
