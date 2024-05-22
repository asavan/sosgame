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

export default {
    bestMove
};
