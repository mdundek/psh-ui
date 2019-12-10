import React from 'react';
import ReactDOM from 'react-dom';
import { Route, BrowserRouter as Router } from 'react-router-dom';
import { Provider } from 'react-redux';
import configureStore from './store/store';
import Authentication from './services/authentication';
import PubSubController from './services/sockerPubSub';
import './index.css';

import * as serviceWorker from './serviceWorker';

import App from './App';
import SolutionConfigurationPage from './components/pages/SolutionConfigurations/SolutionConfigurations';
import DockerConfigurationsPage from './components/pages/DockerConfigurations/DockerConfigurations';
import NginxConfigurationsPage from './components/pages/NGinxConfigurations/NGinxConfigurations';
import SettingsConfigurationsPage from './components/pages/SettingsConfigurations/SettingsConfigurations';
import LoginPage from './components/pages/Login/Login';
import loadLang from "./i18n";

let store = configureStore();
// Set store instance for Authentication service
Authentication.store = store;
PubSubController.store = store;

// Load labels into store
store.dispatch({
    type: "LOAD_LITERALS",
    data: loadLang("en"),
});

// Check to see if user session exists
if (sessionStorage.accessToken && sessionStorage.accessToken !== "null") {
    (async () => {
        await Authentication.setUser(JSON.parse(sessionStorage.accessToken));
    })();
}

const routing = (
    <Router basename="/psh-admin">
        <Provider store={store}>
            <div>
                <Route exact path="/" component={App} />
                <Route path="/login" component={LoginPage} />
                <Route path="/solution" component={SolutionConfigurationPage} />
                <Route path="/docker" component={DockerConfigurationsPage} />
                <Route path="/nginx" component={NginxConfigurationsPage} />
                <Route path="/config" component={SettingsConfigurationsPage} />
            </div>
        </Provider>
    </Router>
)

ReactDOM.render(routing, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();

export default routing;
