"use strict";

import fieldObj from "./field.js";

function cell(isLastMove, isActive, value, colors, playerIdx) {
    let text = value;
    let color = "";
    if (playerIdx >= 0 && playerIdx < colors.length) {
        color = colors[playerIdx];
    }
    return {
        isLastMove,
        isActive,
        text,
        color
    };
}

export default function presenterFunc(settings) {
    let currentUserIdx = settings.colorOrder.indexOf(settings.color);
    let clientUserIdx = settings.colorOrder.indexOf(settings.color);
    const playersSize = settings.colorOrder.length;
    let activeCellIndex = -1;
    let activeDigitIndex = -1;
    let lastMove = -1;
    let gameover = false;

    const field = fieldObj.defaultField(settings.size);
    const movesIdx = Array(settings.size).fill(-1);

    function* enumerate() {
        for (let i = 0; i < settings.size; ++i) {
            yield [i, cell(lastMove === i, activeCellIndex === i, field.getCharSafe(i), settings.colorOrder, movesIdx[i])];
        }
    }

    const canMove = (position, digit, playerIdx, currentUserIdx) => {
        if (digit < 0 || digit >= 2) {
            return false;
        }
        if (playerIdx != currentUserIdx) {
            return false;
        }
        return field.canSet(position);
    };

    const nextUser = () => {
        currentUserIdx = (currentUserIdx + 1) % playersSize;
        if (settings.mode === "hotseat") {
            clientUserIdx = currentUserIdx;
        }
        console.log("nextUser", clientUserIdx, currentUserIdx);
    };

    const setMove = function(position, digit, playerIdx) {
        if (!canMove(position, digit, playerIdx, currentUserIdx)) {
            return fieldObj.IMPOSSIBLE_MOVE;
        }

        const res = field.setSafeByIndex(digit, position);
        if (res === fieldObj.IMPOSSIBLE_MOVE) {
            return res;
        }

        activeCellIndex = -1;
        activeDigitIndex = -1;
        movesIdx[position] = playerIdx;
        lastMove = position;
        const playerId = currentUserIdx;
        const clientId = clientUserIdx;
        if (res === fieldObj.NORMAL_MOVE) {
            nextUser();
        }
        if (res === fieldObj.WINNING_MOVE || res === fieldObj.DRAW_MOVE) {
            gameover = true;
        }
        return {res, position, digit, playerId, clientId};
    };

    const tryMove = function () {
        return setMove(activeCellIndex, activeDigitIndex, currentUserIdx);
    };

    const setActiveDigitIndex = function (ind) {
        if (clientUserIdx !== currentUserIdx && !gameover) {
            return;
        }
        activeDigitIndex = ind;
    };

    const getActiveDigitIndex = () => activeDigitIndex;

    const setActivePosition = function (pos) {

        if (clientUserIdx !== currentUserIdx && !gameover) {
            return;
        }

        if (!field.canSet(pos)) {
            activeCellIndex = -1;
            return;
        }
        activeCellIndex = pos;
    };

    const size = () => settings.size;

    const enum1 = () => {
        return enumerate();
    };

    const endMessage = (res) => {
        if (res === fieldObj.DRAW_MOVE) {
            return "Draw";
        }
        if (currentUserIdx !== clientUserIdx) {
            return "You lose";
        }
        return "You win";
    };

    const currentColor = () => settings.colorOrder[currentUserIdx];

    const endMessage2 = (res) => {
        if (res === fieldObj.DRAW_MOVE) {
            return "Draw";
        }
        return currentColor() + " player win";
    };

    return {
        size,
        tryMove,
        setMove,
        enum1,
        setActivePosition,
        setActiveDigitIndex,
        currentColor,
        getActiveDigitIndex,
        endMessage,
        endMessage2
    };
}
