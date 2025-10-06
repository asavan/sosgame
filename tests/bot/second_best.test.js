import test from "node:test";
import assert from "node:assert/strict";

import fieldObj from "../../src/js/field.js";
import bot from "../../src/js/bot/second_best_bot.js";


test("winning", () => {
    const field = fieldObj.field([0, 5, 0, 5, 0, 2]);
    const result = bot.bestMove(field);
    assert.equal(fieldObj.WINNING_MOVE, result.res);
    assert.equal(1, result.digit);
    assert.equal(2, result.position);
});

test("findPattern__S", () => {
    const field = fieldObj.field([5, 0, 0, 0, 0, 5]);
    const arr = bot.findPattern("   S", 0, field);
    assert.equal(0, arr.length);
});

test("findPatternS__", () => {
    const field = fieldObj.field([5, 0, 0, 0, 0, 5]);
    const arr = bot.findPattern("S   ", 3, field);
    assert.equal(0, arr.length);
});

test("findPattern1", () => {
    const field = fieldObj.field([5, 0, 0, 0, 0, 0, 0, 5]);
    const arr = bot.findPattern("   S", 0, field);
    assert.equal(1, arr.length);
    const result = arr[0];
    assert.equal(bot.SOOS_MOVE, result.res);
    assert.equal(4, result.position);
});


test("findPattern1S__", () => {
    const field = fieldObj.field([5, 0, 0, 0, 0, 0, 0, 5]);
    const arr = bot.findPattern("S   ", 3, field);
    assert.equal(1, arr.length);
    const result = arr[0];
    assert.equal(bot.SOOS_MOVE, result.res);
    assert.equal(3, result.position);
});

test("findPattern2S__", () => {
    const field = fieldObj.field([5, 0, 0, 0, 5, 0, 0, 0]);
    const arr = bot.findPattern("S   ", 3, field);
    assert.equal(2, arr.length);
    const result = arr[1];
    assert.equal(bot.SOOS_MOVE, result.res);
    assert.equal(7, result.position);
});


test("findLong", () => {
    const fieldArr = Array(11).fill(0);
    const field = fieldObj.field(fieldArr);
    const arr = bot.findLongEmpty(field);
    assert.equal(5, arr.length);
    const result = arr[2];
    assert.equal(bot.FIRST_S_MOVE, result.res);
    assert.equal(5, result.position);
});


test("longestEmptyMids", () => {
    const field = fieldObj.field([5, 0, 0, 0, 5, 0, 0, 0]);
    const arr = bot.longestEmptyMids(field);
    assert.deepStrictEqual(arr, [2, 6]);
});

test("longestEmptyMids2", () => {
    const field = fieldObj.field([5, 0, 0, 5, 0, 0]);
    const arr = bot.longestEmptyMids(field);
    assert.deepStrictEqual(arr, [1, 2, 4, 5]);
});


test("findPattern__S", () => {
    const field = fieldObj.field([0, 0, 0, 0, 0, 0, 5, 0, 0, 0, 2, 0, 0, 0, 0]);
    const arr = bot.findPattern("   S", 0, field);
    assert.equal(arr.length, 1);
});

test("findPatternS__", () => {
    const field = fieldObj.field([0, 0, 0, 0, 0, 0, 5, 0, 0, 0, 2, 0, 0, 0, 0]);
    // [0, 0, 0, 0, 0, 0, 5, 0, 0, 0, 2, 0, 0, 0, 0 ]
    const arr = bot.findPattern("S   ", 3, field);
    assert.equal(arr.length, 0);
});
