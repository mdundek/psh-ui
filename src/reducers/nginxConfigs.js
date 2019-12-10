let initialState = [];

export default (state = initialState, action) => {
    switch (action.type) {
        case "SET_NGINX_CONFIGS":
            return action.data;
        default:
            return state;
    }
};