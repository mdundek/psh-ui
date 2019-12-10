let initialState = [];

export default (state = initialState, action) => {
    switch (action.type) {
        case "SET_SOLUTIONS":
            return action.data;
        case "DELETE_SOLUTION":
            return state.filter(o => o.id != action.data);
        default:
            return state;
    }
};