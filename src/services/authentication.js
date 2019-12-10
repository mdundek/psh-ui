import API from "./API";
import SocketPubSub from './sockerPubSub';



class Authentication {

    /**
     * login
     */
    static async login(credentials) {
        // Try to login on the sdf server
        let loginData = await API.endpoints.SdfUsers.remote("login", null, "POST", credentials);
        await this.setUser(loginData);
    }

    /**
     * setUser
     */
    static async setUser(loginData) {
        SocketPubSub.login(loginData.userId);

        API.headers.Authorization = loginData.id;
        sessionStorage.accessToken = JSON.stringify(loginData);
        // Dispatch userObject to store
        this.store.dispatch(
            {
                type: "LOGGIN_USER",
                data: { "token": loginData.id, "userId": loginData.userId }
            }
        );
    }

    /**
     * logout
     */
    static async logout() {
        // TODO: Needs to be implemented
        // await API.endpoints.SdfUsers.remote("logout", null, "POST", );

        SocketPubSub.logout();

        // Dispatch userObject to store
        this.store.dispatch({
            type: "LOGGIN_USER",
            data: { "token": null }
        });

        delete API.headers.Authorization;
        sessionStorage.accessToken = null;
    }
}

Authentication.store = null;

export default Authentication;
