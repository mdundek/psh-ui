const io = require("socket.io-client");

class SockerPubSub {
    /**
     * login
     */
    static login(userId) {
        let sockerio_url = require("../env.json").socketioBaseRoute;
        console.log("=> Connecting to socket IO server: ", `${window.location.protocol}//${window.location.hostname}`);
        this.socket = io(sockerio_url ? sockerio_url : `${window.location.protocol}//${window.location.hostname}`, { path: '/psh-socket' });

        // When the RTM server socket connections is established
        this.socket.on('connect', () => {
            console.log("connected");
            // Ask to open a connection for a specific 
            this.socket.emit('registerSockerUser', {
                "uid": userId
            });

            this.store.dispatch(
                {
                    type: "LOGGIN_USER",
                    data: { "online": true }
                }
            );
        });

        // When an update on the server occures
        this.socket.on('dataUpdate', (data) => {
            // console.log(JSON.stringify(data, null, 4));
        });

        // When an update on the server occures
        this.socket.on('deployStatus', (data) => {
            this.subscriptions.forEach(o => {
                if (o.eventName == 'deployStatus') {
                    o.cb(data);
                }
            });
        });

        // When an update on the server occures
        this.socket.on('importStatus', (data) => {
            this.subscriptions.forEach(o => {
                if (o.eventName == 'importStatus') {
                    o.cb(data);
                }
            });
        });

        // When the RTM server socket connections goes down
        this.socket.on('disconnect', () => {
            console.log("Disconnected");
            this.store.dispatch(
                {
                    type: "LOGGIN_USER",
                    data: { "online": false }
                }
            );
        });
    }

    /**
     * logout
     */
    static logout() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    /**
     * on
     */
    static on(eventName, cb) {
        this.subscriptions.push({
            "eventName": eventName,
            "cb": cb
        });
    }

    /**
     * off
     */
    static off(eventName) {
        this.subscriptions = this.subscriptions.filter(o => o.eventName != eventName);
    }
}
SockerPubSub.store = null;
SockerPubSub.socket = null;
SockerPubSub.subscriptions = [];

export default SockerPubSub;
