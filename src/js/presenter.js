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

function defaultPresenter(settings) {
    return {
        currentUserIdx : settings.colorOrder.indexOf(settings.color),
        clientUserIdx : settings.colorOrder.indexOf(settings.color),
        playersSize : settings.colorOrder.length,
        activeCellIndex : -1,
        activeDigitIndex : -1,
        lastMove : -1,
        gameover : false,
        fieldArr : fieldObj.init(settings.size),
        movesIdx : Array(settings.size).fill(-1)
    };
}

export function presenterFunc({currentUserIdx, clientUserIdx, playersSize,
    activeCellIndex, activeDigitIndex, lastMove, gameover, fieldArr, movesIdx}, settings) {

    const field = fieldObj.field(fieldArr);

    function* enumerate() {
        for (let i = 0; i < field.size(); ++i) {
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
    };

    const setMove = function(position, digit, playerIdx) {
        if (!canMove(position, digit, playerIdx, currentUserIdx)) {
            return {res: fieldObj.IMPOSSIBLE_MOVE, position: -1, digit: -1, playerId: currentUserIdx, clientId: playerIdx};
        }

        const res = field.setSafeByIndex(digit, position);
        if (res === fieldObj.IMPOSSIBLE_MOVE) {
            return {res, position: -1, digit: -1, playerId: currentUserIdx, clientId: playerIdx};
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
        if (clientUserIdx !== currentUserIdx || gameover) {
            return;
        }
        activeDigitIndex = ind;
    };

    const getActiveDigitIndex = () => activeDigitIndex;

    const setActivePosition = function (pos) {

        if (clientUserIdx !== currentUserIdx || gameover) {
            return;
        }

        if (!field.canSet(pos)) {
            activeCellIndex = -1;
            return;
        }
        activeCellIndex = pos;
    };

    const size = field.size;

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

    const toJson = (externalClientIndex) => {
        return {currentUserIdx, clientUserIdx: externalClientIndex, playersSize,
            activeCellIndex, activeDigitIndex, lastMove, gameover, fieldArr: field.toArr(), movesIdx};
    };

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
        endMessage2,
        toJson
    };
}

function presenterFuncDefault(settings) {
    return presenterFunc(defaultPresenter(settings), settings);
}

export default {
    presenterFunc,
    defaultPresenter,
    presenterFuncDefault
};
