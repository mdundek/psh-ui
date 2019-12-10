class API {
    /**
     * Create and store a single entity's endpoints
     * @param {A entity Object} entity
     */
    static createEntity(entity) {
        this.endpoints[entity.name] = this.createBasicCRUDEndpoints(entity)
    }

    /**
     * createEntities
     * @param {*} arrayOfEntity 
     */
    static createEntities(arrayOfEntity) {
        arrayOfEntity.forEach(this.createEntity.bind(this))
    }
    /**
     * Create the basic endpoints handlers for CRUD operations
     * @param {A entity Object} entity
     */
    static createBasicCRUDEndpoints({ name }) {
        var endpoints = {}

        const resourceURL = `${this.url}/${name}`;
        /**
         * getOne
         * @param {*} query 
         */
        endpoints.getOne = (query) => {
            return new Promise((resolve, reject) => {
                fetch(`${resourceURL}/findOne${query ? ('?filter=' + JSON.stringify(query)) : ''}`, {
                    method: "GET",
                    headers: this.headers
                }).then(response => {
                    if (!response.ok) {
                        let err = new Error("An error occured");
                        err.status = response.status;
                        return reject(err);
                    }
                    resolve(response.json());
                }).catch(err => {
                    console.log(err);
                    reject(err);
                });
            });
        }

        /**
         * getAll
         * @param {*} query 
         */
        endpoints.getAll = (query) => {
            return new Promise((resolve, reject) => {
                fetch(`${resourceURL}${query ? ('?filter=' + JSON.stringify(query)) : ''}`, {
                    method: "GET",
                    headers: this.headers
                }).then(response => {
                    if (!response.ok) {
                        let err = new Error("An error occured");
                        err.status = response.status;
                        return reject(err);
                    }
                    resolve(response.json());
                }).catch(err => {
                    reject(err);
                });
            });
        }

        /**
         * getAll
         * @param {*} query 
         */
        endpoints.getAllRelations = (id, relationName) => {
            return new Promise((resolve, reject) => {

                fetch(`${resourceURL}/${id}/${relationName}`, {
                    method: "GET",
                    headers: this.headers
                }).then(response => {
                    if (!response.ok) {
                        let err = new Error("An error occured");
                        err.status = response.status;
                        return reject(err);
                    }
                    resolve(response.json());
                }).catch(err => {
                    reject(err);
                });
            });
        }

        /**
         * deleteById
         * @param {*} query 
         */
        endpoints.deleteById = (id) => {
            return new Promise((resolve, reject) => {
                fetch(`${resourceURL}/${id}`, {
                    method: "DELETE",
                    headers: this.headers
                }).then(response => {
                    if (!response.ok) {
                        let err = new Error("An error occured");
                        err.status = response.status;
                        return reject(err);
                    }
                    resolve(response.json());
                }).catch(err => {
                    reject(err);
                });
            });
        }

        /**
         * create
         * @param {*} toCreate 
         */
        endpoints.create = (toCreate) => {
            return new Promise((resolve, reject) => {
                fetch(`${resourceURL}`, {
                    method: "POST",
                    headers: this.headers,
                    body: JSON.stringify(toCreate)
                }).then(response => {
                    if (!response.ok) {
                        let err = new Error("An error occured");
                        err.status = response.status;
                        return reject(err);
                    }
                    resolve(response.json());
                }).catch(err => {
                    reject(err);
                });
            });
        }

        /**
         * linkRelation
         */
        endpoints.linkRelation = (id, relatedModelName, relatedId, relationObject) => {
            return new Promise((resolve, reject) => {
                fetch(`${resourceURL}/${id}/${relatedModelName}/rel/${relatedId}`, {
                    method: "PUT",
                    headers: this.headers,
                    body: JSON.stringify(relationObject)
                }).then(response => {
                    if (!response.ok) {
                        let err = new Error("An error occured");
                        err.status = response.status;
                        return reject(err);
                    }
                    resolve();
                }).catch(err => {
                    reject(err);
                });
            });
        }

        /**
         * linkRelation
         */
        endpoints.unlinkRelation = (id, relatedModelName, relatedId) => {
            return new Promise((resolve, reject) => {
                fetch(`${resourceURL}/${id}/${relatedModelName}/rel/${relatedId}`, {
                    method: "DELETE",
                    headers: this.headers
                }).then(response => {
                    if (!response.ok) {
                        let err = new Error("An error occured");
                        err.status = response.status;
                        return reject(err);
                    }
                    resolve();
                }).catch(err => {
                    reject(err);
                });
            });
        }

        /**
         * update
         * @param {*} toUpdate 
         */
        endpoints.update = (toUpdate) => {
            return new Promise((resolve, reject) => {
                fetch(`${resourceURL}`, {
                    method: "PUT",
                    headers: this.headers,
                    body: JSON.stringify(toUpdate)
                }).then(response => {
                    if (!response.ok) {
                        let err = new Error("An error occured");
                        err.status = response.status;
                        return reject(err);
                    }
                    resolve(response.json());
                }).catch(err => {
                    reject(err);
                });
            });
        }

        /**
         * remote
         * @param {*} name 
         * @param {*} id 
         * @param {*} body 
         */
        endpoints.remote = (name, id, method, body) => {
            return new Promise((resolve, reject) => {
                fetch(`${resourceURL}/${name}${id ? ("/" + id) : ""}`, {
                    method: method,
                    headers: this.headers,
                    body: JSON.stringify(body)
                }).then(response => {
                    if (!response.ok) {
                        let err = new Error("An error occured");
                        err.status = response.status;
                        return reject(err);
                    }
                    resolve(response.status != 204 ? response.json() : null);
                }).catch(err => {
                    reject(err);
                });
            });
        }

        /**
         * solutionExport
         */
        endpoints.solutionExport = (solutionId, formData) => {
            return new Promise((resolve, reject) => {
                fetch(`${resourceURL}/exportSolution/${solutionId}`, {
                    method: "POST",
                    headers: {
                        'Authorization': this.headers.Authorization
                    },
                    body: formData
                }).then(response => {
                    if (!response.ok) {
                        let err = new Error("Invalide Dockerfile folder");
                        err.status = response.status;
                        return reject(err);
                    }
                    resolve(response);
                }).catch(err => {
                    reject(err);
                });
            });
        }

        /**
         * solutionImport
         */
        endpoints.solutionImport = (formData) => {
            return new Promise((resolve, reject) => {
                fetch(`${resourceURL}/importSolution`, {
                    method: "POST",
                    headers: {
                        'Authorization': this.headers.Authorization
                    },
                    body: formData
                }).then(response => {
                    if (!response.ok) {
                        let err = new Error("An error occured");
                        err.status = response.status;
                        return reject(err);
                    }
                    resolve(response.status != 204 ? response.json() : null);
                }).catch(err => {
                    reject(err);
                });
            });
        }

        /**
         * solutionImport
         */
        endpoints.uploadCertificate = (domainId, formData) => {
            return new Promise((resolve, reject) => {
                fetch(`${resourceURL}/uploadCertificate/${domainId}`, {
                    method: "POST",
                    headers: {
                        'Authorization': this.headers.Authorization
                    },
                    body: formData
                }).then(response => {
                    if (!response.ok) {
                        let err = new Error("An error occured");
                        err.status = response.status;
                        return reject(err);
                    }
                    resolve(response.status != 204 ? response.json() : null);
                }).catch(err => {
                    reject(err);
                });
            });
        }

        /**
         * remoteGet
         */
        endpoints.remoteGet = (name, query) => {
            let queryString = [];
            query = query || {};
            for (let key in query) {
                queryString.push(key + "=" + encodeURIComponent(query[key]));
            }

            return new Promise((resolve, reject) => {
                fetch(`${resourceURL}/${name}${queryString.length > 0 ? ("?" + queryString.join("&")) : ""}`, {
                    method: "GET",
                    headers: this.headers
                }).then(response => {
                    if (!response.ok) {
                        let err = new Error("An error occured");
                        err.status = response.status;
                        return reject(err);
                    }
                    resolve(response.json());
                }).catch(err => {
                    reject(err);
                });
            });
        }

        /**
         * buildRemoteFileUri
         */
        endpoints.buildRemoteFileUri = (name, query) => {
            let queryString = [];
            query = query || {};
            for (let key in query) {
                queryString.push(key + "=" + encodeURIComponent(query[key]));
            }
            if (this.headers.Authorization)
                queryString.push("access_token=" + this.headers.Authorization);

            return `${resourceURL}/${name}${queryString.length > 0 ? ("?" + queryString.join("&")) : ""}`;
        }

        /**
         * upload
         * @param {*} name 
         * @param {*} id 
         * @param {*} formData 
         */
        endpoints.upload = (name, id, formData) => {
            return new Promise((resolve, reject) => {
                fetch(`${resourceURL}/${name}${id ? ("/" + id) : ""}`, {
                    method: "POST",
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'Authorization': this.headers.Authorization
                    },
                    body: formData
                }).then(response => {
                    if (!response.ok) {
                        let err = new Error("An error occured");
                        err.status = response.status;
                        return reject(err);
                    }
                    resolve(response.json());
                }).catch(err => {
                    reject(err);
                });
            });
        }



        // endpoints.getOne = ({ id }) => fetch.get(`${resourceURL}/${id}`)

        // endpoints.update = (toUpdate) => fetch.put(`${resourceURL}/${toUpdate.id}`, toUpdate)

        // endpoints.patch = ({ id }, toPatch) => fetch.patch(`${resourceURL}/${id}`, toPatch)

        // endpoints.delete = ({ id }) => fetch.delete(`${resourceURL}/${id}`)

        return endpoints
    }
}

API.headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
};
API.url = require("../env.json").apiBaseRoute;
API.endpoints = {};

API.createEntity({ name: 'SdfUsers' });
API.createEntity({ name: 'Networks' });
API.createEntity({ name: 'DockerImages' });
API.createEntity({ name: 'Containers' });
API.createEntity({ name: 'NginxConfigs' });
API.createEntity({ name: 'NginxPresetParams' });
API.createEntity({ name: 'Domains' });
API.createEntity({ name: 'BasicAuths' });
API.createEntity({ name: 'Settings' });
API.createEntity({ name: 'Solutions' });
API.createEntity({ name: 'SolutionParameters' });
API.createEntity({ name: 'NginxDockerLinks' });

export default API;