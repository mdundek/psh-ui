let initialState = { };

export default (state = initialState, action) => {
    switch (action.type) {
        case "LOAD_LITERALS":
            state = Object.assign({}, state, action.data);
            return state;
        default:
            return state;
    }
};