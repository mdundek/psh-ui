import { createStore } from 'redux';
import reducers from '../reducers/index';

let configureStore = () => {
    // Now create the store
    let store = createStore(reducers());// , applyMiddleware(middleware)

    return store;
};

export default configureStore;