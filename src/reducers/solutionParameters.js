let initialState = [];

export default (state = initialState, action) => {
    switch (action.type) {
        case "SET_SOLUTION_PARAMETERS":
            return action.data;
        case "DELETE_SOLUTION_PARAMETER":
            return state.filter(o => o.id != action.data);
        default:
            return state;
    }
};