import { combineReducers } from 'redux';

import userSession from './userSession';
import networks from './networks';
import basicAuth from './basicAuth';
import dockerImages from './dockerImages';
import containers from './containers';
import solutions from './solution';
import solutionParameters from './solutionParameters';
import domains from './domains';
import nginxConfigs from './nginxConfigs';
import settings from './settings';
import nginxDockerLinks from './nginxDockerLinks';
import literals from './literals';
import nginxPresetParams from './nginxPresetParams';

export default () => {
    return combineReducers({
        userSession,
        networks,
        dockerImages,
        containers,
        domains,
        nginxConfigs,
        nginxPresetParams,
        settings,
        basicAuth,
        literals,
        solutions,
        solutionParameters,
        nginxDockerLinks
    })
};