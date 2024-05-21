"use strict";

import fieldObj from "./field.js";
import handlersFunc from "./utils/handlers.js";

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
        clientUserIdx : settings.colorOrder.indexOf(settings.color),
        currentUserIdx : 0,
        playersSize : settings.playerLimit,
        activeCellIndex : -1,
        activeDigitIndex : -1,
        lastMove : -1,
        gameover : true,
        gamestarted : false,
        round: 0,
        fieldArr : fieldObj.init(settings.size),
        movesIdx : Array(settings.size).fill(-1)
    };
}

export function presenterFunc({currentUserIdx, clientUserIdx, playersSize,
    activeCellIndex, activeDigitIndex, lastMove, gameover, gamestarted, round, fieldArr, movesIdx}, settings) {

    let field = fieldObj.field(fieldArr);

    const handlers = handlersFunc(["firstmove", "gameover"]);

    function on(name, f) {
        return handlers.on(name, f);
    }


    function* enumerate() {
        for (let i = 0; i < field.size(); ++i) {
            yield [i, cell(lastMove === i, activeCellIndex === i, field.getCharSafe(i), settings.colorOrder, movesIdx[i])];
        }
    }

    const canMove = (position, digit, playerIdx, currentUserIdx) => {
        if (digit < 0 || digit >= 2) {
            return false;
        }
        if (playerIdx !== currentUserIdx) {
            return false;
        }
        return field.canSet(position);
    };
    
    const nextCurrentInd = () => (currentUserIdx + 1) % playersSize;
    const nextUser = () => {
        currentUserIdx = nextCurrentInd();
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
        if (!gamestarted) {
            // need await here
            handlers.call("firstmove", {});
        }
        gamestarted = true;
        movesIdx[position] = playerIdx;
        lastMove = position;
        const playerId = currentUserIdx;
        const clientId = clientUserIdx;
        if (res === fieldObj.NORMAL_MOVE) {
            nextUser();
        }
        if (res === fieldObj.WINNING_MOVE || res === fieldObj.DRAW_MOVE) {            
            gameover = true;
            // need await here
            handlers.call("gameover", res);
        }
        return {res, position, digit, playerId, clientId};
    };

    const tryMove = function () {
        return setMove(activeCellIndex, activeDigitIndex, currentUserIdx);
    };

    const isGameOver = () => gameover;

    const setActiveDigitIndex = function (ind) {
        if (clientUserIdx !== currentUserIdx || gameover) {
            return;
        }
        activeDigitIndex = ind;
    };

    const getActiveDigitIndex = () => activeDigitIndex;

    const setClientIndex = (ind) => {clientUserIdx = ind;};

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

    const calcLastMoveRes = () => {
        if (lastMove < 0) {
            return fieldObj.IMPOSSIBLE_MOVE;
        }
        const res = field.checkWinning(lastMove);
        return res;
    };

    const setMyTurn = () => {
        currentUserIdx = clientUserIdx;
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
    const getCurrentIndex = () => currentUserIdx;
    const getClientIndex = () => clientUserIdx;
    const getPlayersSize = () => playersSize;

    const toJson = (externalClientIndex) => {
        return {currentUserIdx, clientUserIdx: externalClientIndex, playersSize,
            activeCellIndex, activeDigitIndex, lastMove, gameover, fieldArr: field.toArr(), movesIdx};
    };

    const isMyMove = () => !gameover && currentUserIdx === clientUserIdx;

    const endMessage2 = (res) => {
        if (res === fieldObj.DRAW_MOVE) {
            return "Draw";
        }
        return currentColor() + " player win";
    };

    const resetRound = () => {
        gamestarted = false;
        gameover = false;
        activeCellIndex = -1;
        activeDigitIndex = -1;
        lastMove = -1;
        fieldArr = fieldObj.init(size());
        movesIdx = Array(size()).fill(-1);
        currentUserIdx = round % playersSize;
        field = fieldObj.field(fieldArr);
    };

    const nextRound = () => {
        ++round;
        resetRound();
    };

    return {
        on,
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
        toJson,
        isGameOver,
        isMyMove,
        calcLastMoveRes,
        getCurrentIndex,
        setClientIndex,
        getClientIndex,
        getPlayersSize,
        setMyTurn,
        nextRound,
        resetRound
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
