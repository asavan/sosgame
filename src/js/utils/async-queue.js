
export default function PromiseQueue(logger) {
    let queue = Promise.resolve();
  
    const add = (operation) => {
        return new Promise((resolve, reject) => {
            queue = queue
                .then(operation)
                .then(resolve)
                .catch((e) => {
                    logger.log(e);
                    reject(e);
                });
        });
    };
    return {add};
}
