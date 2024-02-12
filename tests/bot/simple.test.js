import test from "node:test";
import assert from "node:assert/strict";

import fieldObj from "../../src/js/field.js";
import simplebot from "../../src/js/bot/simple_bot.js";


test("winning", () => {
    const field = fieldObj.field([-1, -1, 0, 5, 0, 5, 0, 2, -1, -1]);
    const result = simplebot.bestMove(field);
    assert.equal(fieldObj.WINNING_MOVE, result.res);
    assert.equal(1, result.digit);
    assert.equal(2, result.position);
});

test("normal move", () => {
    const field = fieldObj.field([-1, -1, 5, 5, 0, 0, 0, -1, -1]);
    const result = simplebot.bestMove(field);
    assert.equal(fieldObj.NORMAL_MOVE, result.res);
    assert.equal(2, result.position);
});

test("simple move", () => {
    const field = fieldObj.field([-1, -1, 5, 0, 0, 5, 0, -1, -1]);
    const result = simplebot.simpleMove(field);
    assert.equal(fieldObj.NORMAL_MOVE, result.res);
    assert.equal(4, result.position);
    assert.equal(0, result.digit);
});

test("simple move2", () => {
    const field = fieldObj.field([-1, -1, 5, 0, 5, 5, 0, -1, -1]);
    const result = simplebot.simpleMove(field);
    assert.equal(fieldObj.WINNING_MOVE, result.res);
    assert.equal(1, result.position);
    assert.equal(1, result.digit);
});

test("simple move3", () => {
    const field = fieldObj.field([-1, -1, 0, 5, 0, 0, 0, -1, -1]);
    const result = simplebot.simpleMove(field);
    assert.equal(fieldObj.NORMAL_MOVE, result.res);
    assert.equal(0, result.position);
    assert.equal(0, result.digit);
});

test("simple move4", () => {
    const field = fieldObj.field([-1, -1, 5, 0, 0, 5, -1, -1]);
    const result = simplebot.simpleMove(field);
    assert.equal(fieldObj.NORMAL_MOVE, result.res);
    assert.ok([1, 2].includes(result.position));
});

test("notLoosingMove", () => {
    const field = fieldObj.field([-1, -1, 5, 0, 0, 5, 0, 2, 0, 0, -1, -1]);
    const result = simplebot.notLoosingMove(field);
    assert.equal(fieldObj.NORMAL_MOVE, result.res);
    assert.equal(4, result.position);
    assert.equal(1, result.digit);
});
