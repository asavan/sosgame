import fieldObj from "./field.js";
import handlersFunc from "./utils/handlers.js";
import PromiseQueue from "./utils/async-queue.js";

function cell(isLastMove, isActive, value, colors, playerIdx) {
    const text = value;
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
        round: 0,
        moveCount: 0,
        fieldArr : fieldObj.init(settings.size),
        movesIdx : Array.from({length: settings.size}).fill(-1)
    };
}

export function presenterFunc({currentUserIdx, clientUserIdx, playersSize,
    activeCellIndex, activeDigitIndex, lastMove, gameover, round, moveCount, fieldArr, movesIdx}, settings) {

    let field = fieldObj.field(fieldArr);

    const presenterQueue = PromiseQueue(console);
    const handlers = handlersFunc(["moveEnd", "nextPlayer", "gameover"]);
    const on = handlers.on;

    function* enumerate() {
        for (let i = 0; i < field.size(); ++i) {
            yield [i, cell(lastMove === i, activeCellIndex === i, field.getCharSafe(i),
                settings.colorOrder, movesIdx[i])
            ];
        }
    }

    const canMove = (position, digit, playerIdx, currentUserIdx) => {
        if (digit < 0 || digit >= 2) {
            return false;
        }
        if (playerIdx !== currentUserIdx) {
            console.error("Wrong player", playerIdx, currentUserIdx);
            return false;
        }
        return field.canSet(position);
    };

    const nextCurrentInd = () => (currentUserIdx + 1) % playersSize;
    const nextUser = () => {
        currentUserIdx = nextCurrentInd();
    };


    const setMove = async function(position, digit, playerIdx) {
        if (!canMove(position, digit, playerIdx, currentUserIdx)) {
            return {
                res: fieldObj.IMPOSSIBLE_MOVE,
                position: -1,
                digit: -1,
                playerId: currentUserIdx,
                clientId: playerIdx
            };
        }

        const res = field.setSafeByIndex(digit, position);
        if (res === fieldObj.IMPOSSIBLE_MOVE) {
            return {res, position: -1, digit: -1, playerId: currentUserIdx, clientId: playerIdx};
        }

        activeCellIndex = -1;
        activeDigitIndex = -1;
        movesIdx[position] = playerIdx;
        lastMove = position;
        ++moveCount;
        const playerId = currentUserIdx;
        const clientId = clientUserIdx;
        await handlers.call("moveEnd", {res, position, digit, playerId, clientId, moveCount});
        if (res === fieldObj.NORMAL_MOVE) {
            nextUser();
            await handlers.call("nextPlayer", {res, position, digit, playerId, clientId, moveCount});
        }
        if (res === fieldObj.WINNING_MOVE || res === fieldObj.DRAW_MOVE) {
            gameover = true;
            // need await here
            await handlers.call("gameover", {res, position, digit, playerId, clientId, moveCount});
        }
        return {res, position, digit, playerId, clientId};
    };

    const setMoveAsync = (position, digit, playerIdx) =>
        presenterQueue.add(() => setMove(position, digit, playerIdx));

    const tryMove = () =>
        setMoveAsync(activeCellIndex, activeDigitIndex, currentUserIdx);

    const isGameOver = () => gameover;

    const setActiveDigitIndex = function (ind) {
        if (clientUserIdx !== currentUserIdx || gameover) {
            return;
        }
        activeDigitIndex = ind;
    };

    const isActiveDigit = (pos) => pos === activeDigitIndex;

    const setClientIndex = (ind) => {
        clientUserIdx = ind;
    };

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

    const enum1 = () => enumerate();

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

    const toJson = (externalClientIndex) => ({currentUserIdx, clientUserIdx: externalClientIndex, playersSize,
        activeCellIndex, activeDigitIndex, lastMove, gameover, fieldArr: field.toArr(), movesIdx, moveCount});

    const isMyMove = () => !gameover && currentUserIdx === clientUserIdx;

    const endMessage2 = (res) => {
        if (res === fieldObj.DRAW_MOVE) {
            return "Draw";
        }
        return currentColor() + " player win";
    };

    const resetRound = () => {
        moveCount = 0;
        gameover = false;
        activeCellIndex = -1;
        activeDigitIndex = -1;
        lastMove = -1;
        fieldArr = fieldObj.init(size());
        movesIdx = Array.from({length: size()}).fill(-1);
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
        setMoveAsync,
        enum1,
        setActivePosition,
        setActiveDigitIndex,
        currentColor,
        isActiveDigit,
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
