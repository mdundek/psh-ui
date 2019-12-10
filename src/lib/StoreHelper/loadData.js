import API from "../../services/API";

class StoreHelper {

    /**
     * loadStoreData
     * @param {*} dispatch 
     */
    static async loadStoreData(dispatch) {
        if (!this.initialized) {
            await this.reloadCoreData(dispatch);

            let resultSettings = await API.endpoints.Settings.getAll();
            dispatch({
                type: "SET_SETTINGS",
                data: resultSettings
            });
        }
        this.initialized = true;
    }

    /**
     * clearStoreData
     * @param {*} dispatch 
     */
    static async clearStoreData(dispatch) {
        this.initialized = false;
        dispatch({
            type: "SET_NETWORKS",
            data: []
        });
        dispatch({
            type: "SET_BASICAUTH",
            data: []
        });
        dispatch({
            type: "SET_CONTAINERS",
            data: []
        });
        dispatch({
            type: "SET_DOCKER_IMAGES",
            data: []
        });
        dispatch({
            type: "SET_DOMAINS",
            data: []
        });
        dispatch({
            type: "SET_NGINX_CONFIGS",
            data: []
        });
        dispatch({
            type: "SET_NGINX_PRESET_PARAMS",
            data: []
        });
        dispatch({
            type: "SET_SETTINGS",
            data: []
        });
    }

    /**
     * reloadCoreData
     * @param {*} dispatch 
     */
    static async reloadCoreData(dispatch) {
        let resultNetworks = await API.endpoints.Networks.getAll();
        dispatch({
            type: "SET_NETWORKS",
            data: resultNetworks
        });

        let resultBasicAuth = await API.endpoints.BasicAuths.getAll();
        dispatch({
            type: "SET_BASICAUTH",
            data: resultBasicAuth
        });

        let resultDockerImages = await API.endpoints.DockerImages.getAll();
        dispatch({
            type: "SET_DOCKER_IMAGES",
            data: resultDockerImages
        });

        let resultContainers = await API.endpoints.Containers.getAll();
        for (let i = 0; i < resultContainers.length; i++) {
            let networkRelations = await API.endpoints.Containers.getAllRelations(resultContainers[i].id, "networks");
            resultContainers[i].networks = networkRelations.map(o => o.id);
        }
        dispatch({
            type: "SET_CONTAINERS",
            data: resultContainers
        });

        let resultSolutions = await API.endpoints.Solutions.getAll();
        dispatch({
            type: "SET_SOLUTIONS",
            data: resultSolutions
        });

        let nginxDockerLinks = await API.endpoints.NginxDockerLinks.getAll();
        dispatch({
            type: "SET_NGINX_DOCKER_LINKS",
            data: nginxDockerLinks
        });

        let resultSolutionParameters = await API.endpoints.SolutionParameters.getAll();
        dispatch({
            type: "SET_SOLUTION_PARAMETERS",
            data: resultSolutionParameters
        });

        let resultDomains = await API.endpoints.Domains.getAll();
        dispatch({
            type: "SET_DOMAINS",
            data: resultDomains
        });

        let resultNginxConfigs = await API.endpoints.NginxConfigs.getAll();
        dispatch({
            type: "SET_NGINX_CONFIGS",
            data: resultNginxConfigs
        });

        let resultNginxPresetParams = await API.endpoints.NginxPresetParams.getAll();
        dispatch({
            type: "SET_NGINX_PRESET_PARAMS",
            data: resultNginxPresetParams
        });
    }
}
StoreHelper.initialized = false;
export default StoreHelper;