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
    const set = (f, arr1) => {
        handlers[f] = arr1;
    };
    const call = (name, arg) => {
        const operation = () => {
            const promises = getSafe(name).map(f => f(arg));
            return Promise.allSettled(promises);
        };

        if (queue) {
            return queue.add(() => operation);
        } else {
            return operation();
        }
    };

    return {
        on,
        set,
        call,
        hasAction,
        actionKeys
    };
}
