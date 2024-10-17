import {assert} from "../utils/helper.js";
import fieldObj from "../field.js";
import random from "../utils/random.js";
import randomBot from "./random_bot.js";
import simpleBot from "./simple_bot.js";

const SOOS_MOVE = 4;
const FIRST_S_MOVE = 5;
// const LOOSING_MOVE = 6;

function findPattern(pattern, shift, field) {
    const soosMoves = [];
    const str = field.asString();
    let ind = str.indexOf(pattern);
    while (ind !== -1) {
        const digit = 0;
        const position = ind + shift;
        const clonedField = field.clone();
        const res = clonedField.setSafeByIndex(digit, position);
        assert(res === fieldObj.NORMAL_MOVE, position);
        const res1 = simpleBot.bestMove(clonedField, position - 2, position + 3);
        if (res1.res !== fieldObj.WINNING_MOVE) {
            soosMoves.push({res: SOOS_MOVE, digit, position});
        }
        ind = str.indexOf(pattern, position + 1);
    }
    return soosMoves;
}

function findSooSMoves(field) {
    const soosMoves = [];
    soosMoves.push(...findPattern("   S", 0, field));
    soosMoves.push(...findPattern("S   ", 3, field));
    return soosMoves;
}

function findLongEmpty(field) {
    const moves = [];
    const str = " " + field.asString() + " ";

    const pattern = " ".repeat(9);
    let ind = str.indexOf(pattern);
    while (ind !== -1) {
        const digit = 0;
        const shift = 4;
        const position = ind + shift - 1;
        const res = FIRST_S_MOVE;
        moves.push({res, digit, position});
        ind = str.indexOf(pattern, ind + 1);
    }
    return moves;
}

function bestSecondMove(field) {
    assert(field.movesLeft()%2 === 1);
    const soosMoves = findSooSMoves(field);
    if (soosMoves.length > 0) {
        return random.randomEl(soosMoves);
    }
    const sMoves = findLongEmpty(field);
    if (sMoves.length > 0) {
        return random.randomEl(sMoves);
    }
    return randomBot.bestMove(field);
}

function longestEmptyMids(field) {
    const arr = field.toArr();
    let ans = [];
    let curLen = 0;
    let maxLen = 0;
    let curBegin = -1;
    let curEnd = -1;
    for (let i = 0; i < arr.length; i++) {
        const c = arr[i];
        if (c === 0) {
            if (curLen === 0) {
                curBegin = i;
            }
            ++curLen;
            curEnd = i + 1;
            if (curLen > maxLen) {
                maxLen = curLen;

                assert(maxLen === (curEnd - curBegin));
                if (maxLen%2 === 0) {
                    ans = [curBegin + maxLen/2 - 1, (curBegin + maxLen/2)];
                } else {
                    ans = [(maxLen-1)/2 + curBegin];
                }
            } else if (curLen === maxLen) {
                assert(maxLen === (curEnd - curBegin));
                if (maxLen%2 === 0) {
                    ans.push(maxLen/2 + curBegin - 1);
                    ans.push(curBegin + maxLen/2);
                } else {
                    ans.push((maxLen-1)/2 + curBegin);
                }
            }
        } else {
            curLen = 0;
            curEnd = -1;
            curBegin = -1;
        }
    }
    return ans;
}

function randomEmptyMid(field) {
    random.randomEl(longestEmptyMids(field));
}


function bestFirstMove(field) {
    assert(field.movesLeft()%2 === 0);
    const str = field.asString();
    let ind = str.indexOf("S  S");
    if (ind >= 0) {
        return randomBot.bestMove(field);
    }
    ind = str.indexOf("   ");
    if (ind < 0) {
        return randomBot.bestMove(field);
    }
    // const res = fieldObj.NORMAL_MOVE;
    // const digit = 1;

    // ind = str.indexOf("S");
    // if (ind < 0) {
    //     const position = randomEmptyMid(field);
    //     return {res, digit, position};
    // }
    return bestMove1(field);
}

function bestMove1(field) {
    const goodMoves = [];
    const loosingMoves = [];
    const lSooSMoves = [];
    const lSMoves = [];
    for (let position = 0; position < field.size(); ++position) {
        for (let digit = 1; digit < 2; ++digit) {
            const clonedField = field.clone();
            const res = clonedField.setSafeByIndex(digit, position);
            if (res === fieldObj.IMPOSSIBLE_MOVE) {
                break;
            }
            if (res === fieldObj.WINNING_MOVE) {
                assert(false, "Bad state");
            }

            const res1 = simpleBot.bestMove(clonedField, position - 2, position + 3);
            if (res1.res === fieldObj.WINNING_MOVE) {
                loosingMoves.push({res, digit, position});
            } else {
                const res2 = bestSecondMove(clonedField);
                if (res2.res === SOOS_MOVE) {
                    lSooSMoves.push({res, digit, position});
                } else if (res2.res === FIRST_S_MOVE) {
                    lSMoves.push({res, digit, position});
                } else {
                    goodMoves.push({res, digit, position});
                    // return {res, digit, position};
                }
            }
        }
    }
    if (goodMoves.length > 0) {
        return random.randomEl(goodMoves);
    }
    if (lSMoves.length > 0) {
        return random.randomEl(lSMoves);
    }
    if (lSooSMoves.length > 0) {
        return random.randomEl(lSooSMoves);
    }
    if (loosingMoves.length > 0) {
        return random.randomEl(loosingMoves);
    }
    assert(false, "No moves");
}

function bestMove(field) {
    const result = simpleBot.bestMove(field);
    if (result.res === fieldObj.WINNING_MOVE) {
        return result;
    }
    if (field.movesLeft() % 2 === 1) {
        const soosMove = bestSecondMove(field);
        if (soosMove.res > fieldObj.DRAW_MOVE) {
            soosMove.res = fieldObj.NORMAL_MOVE;
        }
        return soosMove;
    }
    return bestFirstMove(field);
}

export default {
    bestMove,
    // for tests
    findPattern,
    findLongEmpty,
    longestEmptyMids,
    randomEmptyMid,
    SOOS_MOVE,
    FIRST_S_MOVE
};
