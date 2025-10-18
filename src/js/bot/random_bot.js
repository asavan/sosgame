import {assert, random} from "netutils";
import fieldObj from "../field.js";
import simpleBot from "./simple_bot.js";

function bestMove(field) {
    const goodMoves = [];
    const possibleMoves = [];
    for (let position = 0; position < field.size(); ++position) {
        for (let digit = 0; digit < 2; ++digit) {
            const clonedField = field.clone();
            const res = clonedField.setSafeByIndex(digit, position);
            if (res === fieldObj.IMPOSSIBLE_MOVE) {
                break;
            }
            if (res === fieldObj.WINNING_MOVE) {
                return {res, digit, position};
            }
            const res1 = simpleBot.bestMove(clonedField, position - 2, position + 3);
            if (res1.res === fieldObj.WINNING_MOVE) {
                possibleMoves.push({res, digit, position});
            } else {
                goodMoves.push({res, digit, position});
            }
        }
    }
    if (goodMoves.length > 0) {
        return random.randomEl(goodMoves);
    }
    if (possibleMoves.length > 0) {
        return random.randomEl(possibleMoves);
    }
    assert(false, "No moves");
}

export default {
    bestMove
};
