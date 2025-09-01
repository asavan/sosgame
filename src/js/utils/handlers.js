export default function handlersFunc(arr, queue) {
    const handlers = {};
    for (const f of arr) {
        handlers[f] = [];
    }

    const actionKeys = () => Object.keys(handlers);
    const getSafe = (name) => {
        const arr = handlers[name];
        if (!Array.isArray(arr)) {
            console.error("No key", name);
            console.trace("No key", name);
            throw new Error("No name " + name);
        }
        return arr;
    };
    const hasAction = (name) => actionKeys().includes(name);
    const on = (name, callback) => {
        if (typeof callback !== "function") {
            console.error("bad setup", name);
            return;
        }
        getSafe(name).push(callback);
    };
    const reset = (name, callback) => {
        if (!hasAction(name)) {
            throw new Error("No name for reset " + name);
        }
        handlers[name] = [];
        on(name, callback);
    };
    const set = (f, arr1) => {
        handlers[f] = arr1;
    };
    const call = (name, arg) => {
        const callbacks = getSafe(name);
        if (callbacks.length === 0) {
            console.log("No handlers " + name);
            return Promise.resolve();
        }
        console.log("call ", name, arg);
        const operation = () => {
            const promises = callbacks.map(f => f(arg));
            console.log("form operation", name, promises[0]);
            return Promise.allSettled(promises);
        };

        if (queue) {
            console.log("run in queue");
            return queue.add(operation);
        } else {
            console.log("run sync");
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
