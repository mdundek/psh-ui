let initialState = [];

export default (state = initialState, action) => {
    switch (action.type) {
        case "SET_NGINX_DOCKER_LINKS":
            return action.data;
        case "ADD_NGINX_DOCKER_LINKS":
            return [...state, ...action.data];
        case "DELETE_NGINX_DOCKER_LINK":
            return state.filter(o => o.id != action.data);
        default:
            return state;
    }
};