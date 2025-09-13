import {assert} from "./helper.js";

export default function handlersFunc(arr, queue) {
    const handlers = {};
    for (const f of arr) {
        handlers[f] = [];
    }

    const actionKeys = () => Object.keys(handlers);
    const getSafe = (name) => {
        const arr = handlers[name];
        assert(Array.isArray(arr), "No key " + name);
        return arr;
    };
    const hasAction = (name) => actionKeys().includes(name);
    const on = (name, callback) => {
        assert(typeof callback === "function", "bad setup " + name);
        getSafe(name).push(callback);
    };
    const reset = (name, callback) => {
        assert(hasAction(name), "No name for reset " + name);
        handlers[name] = [];
        on(name, callback);
    };
    const set = (f, arr1) => {
        handlers[f] = arr1;
    };
    const call = (name, arg) => {
        const callbacks = getSafe(name);
        if (callbacks.length === 0) {
            console.trace("No handlers " + name);
            return Promise.resolve();
        }
        // console.log("call ", name, arg, callbacks.length, handName);
        const operation = () => {
            const promises = callbacks.map(f => Promise.try(f, arg));
            assert(callbacks.length !== 0, "No handlers2 " + name);
            assert(promises[0] !== undefined, "No handlers3 " + name);
            return Promise.allSettled(promises);
        };

        if (queue) {
            // console.error("run in queue " + name);
            return queue.add(operation);
        } else {
            // console.error("run sync");
            return operation();
        }
    };

    return {
        on,
        set,
        call,
        reset,
        hasAction,
        actionKeys
    };
}
