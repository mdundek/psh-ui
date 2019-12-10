let initialState = [];

export default (state = initialState, action) => {
    switch (action.type) {
        case "SET_SETTINGS":
            return action.data;
        default:
            return state;
    }
};