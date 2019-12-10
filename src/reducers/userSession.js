let initialState = { token: null, userId: null, online: false };

export default (state = initialState, action) => {
    switch (action.type) {
        case "LOGGIN_USER":
            state = Object.assign({}, state, action.data);
            return state;
        default:
            return state;
    }
};