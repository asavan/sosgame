import fieldObj from "../field.js";



function bestMove(field, start = 0, finish=undefined) {
    let bestMove = fieldObj.IMPOSSIBLE_MOVE;
    let bestAns = {res: bestMove, digit: -1, position: -1};
    const end = finish || field.size();
    for (let position = Math.max(start, 0); position < Math.min(end, field.size()); ++position) {
        for (let digit = 0; digit < 2; ++digit) {
            const res = field.setSafeByIndex(digit, position, true);
            if (res === fieldObj.IMPOSSIBLE_MOVE) {
                break;
            }
            if (res === fieldObj.WINNING_MOVE) {
                return {res, digit, position};
            }
            if (bestMove < res) {
                bestMove = res;
                bestAns = {res: bestMove, digit, position};
            }
        }
    }
    return bestAns;
}

function notLoosingMove(field) {
    let ans = {res: fieldObj.IMPOSSIBLE_MOVE, digit: -1, position: -1};
    for (let position = 0; position < field.size(); ++position) {
        for (let digit = 0; digit < 2; ++digit) {
            const clonedField = field.clone();
            const res = clonedField.setSafeByIndex(digit, position);
            if (res === fieldObj.IMPOSSIBLE_MOVE) {
                break;
            }
            const res1 = bestMove(clonedField, position - 2, position + 3);
            if (res1.res !== fieldObj.WINNING_MOVE) {
                return {res, digit, position};
            }
            ans = {res, digit, position};
        }
    }
    return ans;
}

function simpleMove(field) {
    const result = bestMove(field);
    if (result.res === fieldObj.WINNING_MOVE) {
        return result;
    }
    return notLoosingMove(field);
}

export default {
    bestMove,
    notLoosingMove,
    simpleMove
};
