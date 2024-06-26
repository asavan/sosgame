import test from "node:test";
import assert from "node:assert/strict";

import fieldObj from "../../src/js/field.js";
import simplebot from "../../src/js/bot/simple_bot.js";


test("winning", () => {
    const field = fieldObj.field([0, 5, 0, 5, 0, 2]);
    const result = simplebot.bestMove(field);
    assert.equal(fieldObj.WINNING_MOVE, result.res);
    assert.equal(1, result.digit);
    assert.equal(2, result.position);
});

test("normal move", () => {
    const field = fieldObj.field([5, 5, 0, 0, 0]);
    const result = simplebot.bestMove(field);
    assert.equal(fieldObj.NORMAL_MOVE, result.res);
    assert.equal(2, result.position);
});
