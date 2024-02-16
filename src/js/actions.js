"use strict";

function init(game) {
    return {
        "message": (m, id) => {
            return game.onMessage(m, id);
        }
    };
}

export default init;
