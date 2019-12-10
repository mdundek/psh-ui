let initialState = [];

export default (state = initialState, action) => {
    switch (action.type) {
        case "SET_CONTAINERS":
            return action.data;
        case "UPDATE_CONTAINER":
            return state.map(c => {
                if (c.id == action.data.id) {
                    return action.data;
                } else {
                    return c;
                }
            });
        default:
            return state;
    }
};