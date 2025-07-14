export function networkHandler(actions, queue, logger) {
    let currentHandler = actions;
    function callCurrentHandler(method, data) {
        logger.log("callCurrentHandler");
        const callback = currentHandler[method];
        if (typeof callback !== "function") {
            logger.log("Not function");
            return;
        }
        if (!queue) {
            logger.log("No queue");
            return;
        }
        queue.add(() => callback(data.data, data.from));
    }
    function check(action) {
        return Object.keys(currentHandler).includes(action);
    }
    function changeHandler(actions) {
        currentHandler = actions;
    }
    return {
        check,
        changeHandler,
        process: callCurrentHandler,
    };
}
