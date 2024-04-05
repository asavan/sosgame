import {assert} from "./utils/helper.js";

export default function lobby(clients) {
    const clientsArr = [];
    for (const [key,] of Object.entries(clients)) {
        clientsArr.push(key);
    }
    let index = clientsArr.length;
    const addClient = (id, name) => {
        const oldClient = clients[id];
        if (oldClient) {
            oldClient.name = name;
        } else {
            clients[id] = {index, name};
            clientsArr.push(id);
            ++index;
        }
        assert(index === clientsArr.length);
    };
    const findByIndex = (ind) => {
        const id = clientsArr[ind];
        assert(id, "Bad Index");
        const client = clients[id];
        assert(client, "Empty client");
        return client;
    };

    const getById = (id) => {
        const el = clients[id];
        assert(el, `No id ${id} in clients`);
        return el;
    };

    // TODO maybe use splice instead
    const remove = (id) => {
        const toRemove = clients[id];
        --index;
        const lastClientId = clientsArr[index];
        clientsArr[toRemove.index] = lastClientId;
        clientsArr.pop();
        const lastClient = clients[lastClientId];
        lastClient.index = toRemove.index;
        clients[id] = null;
        assert(index === clientsArr.length);
    };

    const swapEl = (e1, e2) => {
        const tempInd = e1.index;
        const tempId = clientsArr[tempInd];
        clientsArr[e1.index] = clientsArr[e2.index];
        e1.index = e2.index;
        clientsArr[e2.index] = tempId;
        e2.index = tempInd;
    };

    const swapInd = (ind1, ind2) => {
        const el1 = findByIndex(ind1);
        const el2 = findByIndex(ind2);
        swapEl(el1, el2);
    };

    const swapById = (id1, id2) => {
        const el1 = getById(id1);
        const el2 = getById(id2);
        swapEl(el1, el2);
    };

    const indById = (id) => getById(id).index;

    return {
        addClient,
        remove,
        swapInd,
        swapById,
        indById
    };
}
