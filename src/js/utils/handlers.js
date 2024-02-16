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
    const set = (f, arr) => handlers[f] = arr;
    const call = async (name, arg) => {
        for (const f of getSafe(name)) {
            if (typeof f !== "function") {
                console.error("bad ", name);
                return;
            }
            await f(arg);
        }
    };
    return {
        on,
        set,
        call,
        actionKeys
    };
}
