export const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

export const delayReject = async (ms) => {
    await delay(ms);
    return Promise.reject(new Error("timeout"));
};
