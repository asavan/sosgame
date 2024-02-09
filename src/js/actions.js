"use strict";

function init(game) {
    return {
        "message": (m) => {
            return game.onMessage(m);
        }
    };
}

export default init;
