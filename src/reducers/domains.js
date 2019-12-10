let initialState = [];

export default (state = initialState, action) => {
    switch (action.type) {
        case "SET_DOMAINS":
            return action.data;
        default:
            return state;
    }
};