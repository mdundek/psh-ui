let initialState = [];

export default (state = initialState, action) => {
    switch (action.type) {
        case "SET_BASICAUTH":
            return action.data;
        default:
            return state;
    }
};