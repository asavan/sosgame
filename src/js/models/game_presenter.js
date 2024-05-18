import handlersFunc from "../utils/handlers.js";

const IN_ROUND = 1;
const WAIT_FOR_PLAYERS = 2;
const GAME_OVER = 3;

function player({externalId, name, score}) {
    return {externalId, name, score};
}

function gamePresenter({colorOrder}) {    
    const handlers = handlersFunc(["changestate"]);
    function on(name, f) {
        return handlers.on(name, f);
    }

    

    let startPlayerInd = 0;
    let thisPlayerInd = 0;
    let bottomPlayerInd = 0;
    let gameover = false;
    let roundInd = 0;
    let state = WAIT_FOR_PLAYERS;
    const players = [];
    let currentRound = null;

    console.log(colorOrder);

    const changeState = async (newState) => {
        if (newState == state) {
            console.log("Same state");
            return;
        }
        const tmp = state;
        await handlers.call("changestate", {from: tmp, to: newState});
        state = newState;
    };
    const getCurrentRound = () => currentRound;
    return {
        changeState,
        getCurrentRound,
        on,
        IN_ROUND,
        WAIT_FOR_PLAYERS,
        GAME_OVER,
        startPlayerInd,
        thisPlayerInd,
        bottomPlayerInd,
        gameover,
        roundInd,
        players 
    };
}


export default {
    presenter: gamePresenter,
    player
};
