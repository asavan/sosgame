export default function handlersFunc(arr) {
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
            throw "No name";
        }
        return arr;
    };
    const on = (name, callback) => getSafe(name).push(callback);
    const reset = (name) => {
        delete handlers[name];
    };
    const set = (f, arr1) => handlers[f] = arr1;
    const call = async (name, arg) => {
        const promises = [];
        for (const f of getSafe(name)) {
            if (typeof f !== "function") {
                console.error("bad call", name);
                return;
            }
            promises.push(f(arg));
        }
        await Promise.allSettled(promises);
    };

    return {
        on,
        set,
        call,
        reset,
        actionKeys
    };
}
