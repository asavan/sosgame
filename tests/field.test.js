"use strict";

import test from "node:test";
import assert from "node:assert/strict";

import fieldObj from "../src/js/field.js";

test("init_field", () => {
    assert.deepStrictEqual(fieldObj.init(3), [0, 0, 0], "init correct");
    assert.deepStrictEqual(fieldObj.init(1), [0], "init correct");
    assert.deepStrictEqual(fieldObj.init(0), [], "init correct");
});


test("size", () => {
    const field = fieldObj.defaultField(10);
    assert.equal(field.size(), 10);
});

test("toArr", () => {
    const field = fieldObj.defaultField(2);
    assert.deepStrictEqual(field.toArr(), [0, 0]);
});

test("canSet", () => {
    const field = fieldObj.defaultField(10);
    assert.ok(field.inBounds(6));
    assert.ok(!field.inBounds(10));
    assert.ok(field.isEmpty(6));
    assert.ok(field.canSet(6));
    assert.ok(field.canSet(9));
    assert.ok(field.canSet(0));
});


test("winning", () => {
    const field = fieldObj.field([5, 5, 2, 5, 0]);
    assert.equal(fieldObj.NORMAL_MOVE, field.checkWinning(0));
    for (let i = 1; i < 4; ++i) {
        assert.equal(fieldObj.WINNING_MOVE, field.checkWinning(i), `error on ${i}`);
    }
});

test("drawing", () => {
    const field = fieldObj.field([5, 5, 2, 5]);
    assert.equal(fieldObj.DRAW_MOVE, field.checkWinning(0));
    for (let i = 1; i < 4; ++i) {
        assert.equal(fieldObj.WINNING_MOVE, field.checkWinning(i), `error on ${i}`);
    }
});

