"use strict";

import test from "node:test";
import assert from "node:assert/strict";

import fieldObj from "../src/js/field.js";

test("init_field", () => {
    assert.deepStrictEqual(fieldObj.init(3), [-1, -1, 0, 0, 0, -1, -1], "init correct");
    assert.deepStrictEqual(fieldObj.init(1), [-1, -1, 0, -1, -1], "init correct");
    assert.deepStrictEqual(fieldObj.init(0), [-1, -1, -1, -1], "init correct");
});

test("canSet", () => {
    const field = fieldObj.defaultField(10);
    assert.ok(field.inBounds(6));
    assert.ok(field.isEmpty(6));
    assert.ok(field.canSet(6));
    assert.ok(field.canSet(9));
    assert.ok(field.canSet(0));
});


test("winning", () => {
    const field = fieldObj.field([-1, -1, 5, 5, 2, 5, 0, -1, -1]);
    assert.equal(fieldObj.NORMAL_MOVE, field.checkWinning(0));
    for (let i = 1; i < 4; ++i) {
        assert.equal(fieldObj.WINNING_MOVE, field.checkWinning(i), `error on ${i}`);
    }
});

test("drawing", () => {
    const field = fieldObj.field([-1, -1, 5, 5, 2, 5, -1, -1]);
    assert.equal(fieldObj.DRAW_MOVE, field.checkWinning(0));
    for (let i = 1; i < 4; ++i) {
        assert.equal(fieldObj.WINNING_MOVE, field.checkWinning(i), `error on ${i}`);
    }
});

