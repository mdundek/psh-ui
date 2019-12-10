let initialState = [];

export default (state = initialState, action) => {
    switch (action.type) {
        case "SET_DOCKER_IMAGES":
            return action.data;
        default:
            return state;
    }
};