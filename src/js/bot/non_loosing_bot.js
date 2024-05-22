import fieldObj from "../field.js";
import simpleBot from "./simple_bot.js";

function notLoosingMove(field) {
    let ans = {res: fieldObj.IMPOSSIBLE_MOVE, digit: -1, position: -1};
    for (let position = 0; position < field.size(); ++position) {
        for (let digit = 0; digit < 2; ++digit) {
            const clonedField = field.clone();
            const res = clonedField.setSafeByIndex(digit, position);
            if (res === fieldObj.IMPOSSIBLE_MOVE) {
                break;
            }
            const res1 = simpleBot.bestMove(clonedField, position - 2, position + 3);
            if (res1.res !== fieldObj.WINNING_MOVE) {
                return {res, digit, position};
            }
            ans = {res, digit, position};
        }
    }
    return ans;
}

function bestMove(field) {
    const result = simpleBot.bestMove(field);
    if (result.res === fieldObj.WINNING_MOVE) {
        return result;
    }
    return notLoosingMove(field);
}

export default {
    bestMove
};
