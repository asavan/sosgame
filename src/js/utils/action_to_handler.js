import handlersFunc from "./handlers.js";

export default function actionToHandler(queue, actions) {
    const keys = Object.keys(actions);
    const handler = handlersFunc(keys, queue);
    for (const [key, value] of Object.entries(actions)) {
        handler.on(key, value);
    }
    return handler;
}
