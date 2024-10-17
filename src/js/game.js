import {assert, delay} from "./utils/helper.js";
import handlersFunc from "./utils/handlers.js";

const getIndex = function (e, parent) {
    const target = e.target || e.srcElement;
    for (let i = 0; i < parent.children.length; i++) {
        if (parent.children[i] === target) {
            return i;
        }
    }
    return -1;
};

const handleClick = function (evt, parent) {
    evt.preventDefault();
    if (!evt.target.classList.contains("cell") || evt.target.classList.contains("disabled")) {
        return -1;
    }
    return getIndex(evt, parent);
};

function drawDigits(presenter, digits) {
    for (let i = 0; i < 2; i++) {
        const tile = digits.childNodes[i];
        if (presenter.getActiveDigitIndex() === i) {
            tile.classList.add("active");
            tile.classList.add(presenter.currentColor());
        } else {
            tile.classList.remove("active");
            tile.classList.remove(presenter.currentColor());
        }
    }
}

function drawField(presenter, box, digits, field) {
    draw(presenter, box);
    drawDigits(presenter, digits);
    if (presenter.isMyMove()) {
        field.classList.remove("disabled");
    } else {
        field.classList.add("disabled");
    }
}

function initField(document, fieldSize, className, elem) {
    assert(elem);
    elem.replaceChildren();
    for (let i = 0; i < fieldSize; i++) {
        const cell = document.createElement("div");
        cell.className = className;
        elem.append(cell);
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

function setupOverlay(document, handlers) {
    const overlay = document.querySelector(".overlay");
    const close = document.querySelector(".close");
    assert(overlay, "No overlay");
    assert(close, "No close button");
    close.addEventListener("click", (e) => {
        e.preventDefault();
        overlay.classList.remove("show");
        return handlers.call("winclosed", {});
    }, false);
    return overlay;
}

export default function game(_window, document, settings, presenter) {
    const field = document.querySelector(".field");
    const box = document.querySelector(".box");
    const digits = document.querySelector(".buttons");
    const btnInstall = document.querySelector(".install");
    const root = document.documentElement;
    root.style.setProperty("--field-size", presenter.size());
    // field.classList.remove("disabled");

    const handlers = handlersFunc(["message", "gameover", "started", "winclosed"]);
    const overlay = setupOverlay(document, handlers);

    function on(name, f) {
        return handlers.on(name, f);
    }
    const actionKeys = handlers.actionKeys;

    const redraw = () => drawField(presenter, box, digits, field);

    presenter.on("moveEnd", async (obj) => {
        const promises = [];
        if (obj.moveCount === 0) {
            promises.push(handlers.call("started", obj));
        }
        promises.push(redraw());
        await Promise.allSettled(promises);
        const promises2 = [];
        promises2.push(delay(200));
        promises2.push(handlers.call("message", obj));
        await Promise.allSettled(promises);
    });

    presenter.on("nextPlayer", () => {
        const promises = [];
        promises.push(delay(100));
        promises.push(redraw());
        return Promise.allSettled(promises);
    });

    presenter.on("gameover", (result) => {
        const promises = [];
        promises.push(onGameEndDraw(result.res, presenter, overlay, btnInstall, field));
        promises.push(handlers.call("gameover", result));
        return Promise.allSettled(promises);
    });

    function doStep() {
        return presenter.tryMove();
    }

    const handleBox = function (evt) {
        const ind = handleClick(evt, box);
        if (ind < 0) {
            return;
        }
        presenter.setActivePosition(ind);
        draw(presenter, box);
        return doStep();
    };

    const handleClickDigits = function (evt) {
        const ind = handleClick(evt, digits);
        if (ind < 0) {
            return;
        }
        presenter.setActiveDigitIndex(ind);
        drawDigits(presenter, digits);
        return doStep();
    };


    async function onMessage({res, position, digit, playerId}) {
        const result = await presenter.setMove(position, digit, playerId);
        if (settings.logicDebug) {
            assert(res === result.res, "Bad move");
        }
        return result;
    }

    initField(document, presenter.size(), "cell", box);
    box.addEventListener("click", handleBox, false);
    digits.addEventListener("click", handleClickDigits, false);

    redraw();

    return {
        on,
        actionKeys,
        onMessage,
        redraw
    };
}
