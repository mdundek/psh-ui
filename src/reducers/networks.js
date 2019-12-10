let initialState = [];

export default (state = initialState, action) => {
    switch (action.type) {
        case "SET_NETWORKS":
            return action.data;
        default:
            return state;
    }
};