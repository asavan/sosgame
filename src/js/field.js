const IMPOSSIBLE_MOVE = -1;
const NORMAL_MOVE = 1;
const DRAW_MOVE = 2;
const WINNING_MOVE = 3;

function valueToString(val) {
    switch(val) {
    case 5: { 
        return "S"; 
    }
    case 2: { 
        return "O"; 
    }
    case 0: { 
        return " "; 
    }
    }
    return "";
}

function stringToVal(str) {
    switch(str) {
    case "S":
    case "s": { 
        return 5; 
    }
    case "O":
    case "o": { 
        return 2; 
    }
    case " ": { 
        return 0; 
    }
    case "": { 
        return -1; 
    }
    }
    return -1;
}

function init(fieldSize) {
    return Array.from({length: fieldSize}).fill(0);
}

function field(arrInn) {
    const digits = [5, 2];
    const arr = [-1, -1, ...arrInn, -1, -1];
    const fieldSize = arr.length - 4;
    const size = () => fieldSize;
    const inBounds = (pos) => pos >= 0 && pos < fieldSize;
    const checkWinning = (pos) => {
        for (let i = pos+2; i < pos + 5; ++i) {
            let res = arr[i-2] === 5 && arr[i-1] === 2 && arr[i] === 5;
            if (res) {
                return WINNING_MOVE;
            }
        }
        for (let i = 0; i < fieldSize; i++) {
            if (arr[i+2] === 0) {
                return NORMAL_MOVE;
            }
        }
        return DRAW_MOVE;
    };

    const isEmpty = (pos) => arr[2+pos] === 0;
    const canSet = (pos) => inBounds(pos) && isEmpty(pos);
    const setStr = (c, pos) => arr[2+pos] = stringToVal(c);
    const setSafeByIndex = (ind, pos, needrestore = false) => {
        if (!canSet(pos)) {
            return IMPOSSIBLE_MOVE;
        }
        if (ind < 0 || ind >= digits.length) {
            return IMPOSSIBLE_MOVE;
        }
        const oldVal = arr[2+pos];
        arr[2+pos] = digits[ind];
        const res = checkWinning(pos);
        if (needrestore) {
            arr[2+pos] = oldVal;
        }
        return res;
    };
    const setSafe = (c, pos) => {
        if (!canSet(pos)) {
            return IMPOSSIBLE_MOVE;
        }
        setStr(c, pos);
        return checkWinning(pos);
    };
    const getChar = (pos) => valueToString(arr[2+pos]);
    const getCharSafe = (pos) => {
        if (!inBounds(pos)) {
            return "";
        }
        return getChar(pos);
    };
    const clone = () => field(arrInn);
    const toArr = () => arr.slice(2, -2);
    const movesLeft = () => arr.reduce((accumulator, currentValue) => accumulator + (currentValue === 0), 0);
    const asString = () => toArr().map(valueToString).join("");
    return {
        size,
        setSafe,
        setSafeByIndex,
        getCharSafe,
        canSet,
        clone,
        movesLeft,
        toArr,
        asString,
        // for tests
        isEmpty,
        inBounds,
        checkWinning
    };
}

function defaultField(fieldSize) {
    return field(init(fieldSize));
}

export default {
    defaultField,
    field,
    init,
    IMPOSSIBLE_MOVE,
    NORMAL_MOVE,
    WINNING_MOVE,
    DRAW_MOVE
};
