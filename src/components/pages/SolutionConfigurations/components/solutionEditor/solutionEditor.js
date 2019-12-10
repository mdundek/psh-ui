import React from 'react';
import { connect } from 'react-redux';
import { withStyles } from '@material-ui/core/styles';
import styles from '../styles.js';
import ValidatorForm from "../../../../elements/ValidationForm/index";
import DeleteIcon from '@material-ui/icons/Delete';
import LoadingIndicator from "../../../../elements/LoadingIndicator/index";
import API from "../../../../../services/API";

import {
    FormControl,
    Select,
    Menu,
    MenuItem,
    InputLabel,
    Grid, Button, TextField,
    FormControlLabel,
    FormGroup,
    Switch,
    Fab,
    Divider,
    Slide,
    Typography
} from '@material-ui/core';

const shortid = require('shortid');

function Transition(props) {
    return <Slide direction="up" {...props} />;
}

class SolutionEditor extends React.Component {
    VOLUME_MAPPER = {}

    /**
     * constructor
     * @param {*} props 
     */
    constructor(props) {
        super(props);

        this.state = {
            _name: "",
            _description: "",
            _solutionParameters: [],

            availableContainersAnchorEl: null,

            loading: false,
            loadingMessage: null
        }
    }

    /**
     * componentDidMount
     */
    componentDidMount() {
        let _solutionParameters = [];
        if (this.props.solution) {
            // Need a deep copy for clones here
            _solutionParameters = JSON.parse(JSON.stringify(this.props.solutionParameters.filter(sp => sp.solutionId == this.props.solution.id)));

            this.setState({
                _name: this.props.solution ? this.props.solution.name : "",
                _description: this.props.solution ? this.props.solution.description : "",
                _solutionParameters: _solutionParameters
            });

            // Map existing container volume short IDs
            _solutionParameters.forEach(sp => {
                this._prepareContainerStates({}, sp);
            });
        } else {
            this.setState({
                _name: this.props.solution ? this.props.solution.name : "",
                _description: this.props.solution ? this.props.solution.description : "",
                _solutionParameters: _solutionParameters
            });
        }
    }

    /**
     * saveSolution
     */
    saveSolution = () => {
        (async () => {
            try {
                let isValide = this.formEl.validate();
                if (isValide) {
                    if (this.props.solutions.find(o => (!this.props.solution || o.id != this.props.solution.id) && o.name.toLowerCase() == this.state._name.toLowerCase())) {
                        return this.props.notify("Conflict: Solution name already in use.", "error");
                    }

                    // Validate nginx configs
                    let nginxErrors = null;
                    for (let i = 0; i < this.state._solutionParameters.length; i++) {
                        let nginxConfigIds = this.props.nginxDockerLinks.filter(ndx => ndx.containerId == this.state._solutionParameters[i].containerId).map(ndx => ndx.nginxConfigId);
                        for (let y = 0; y < nginxConfigIds.length; y++) {
                            if (this.state["proxy_asSubdomain_" + nginxConfigIds[y]] && this.state["proxy_subdomain_" + nginxConfigIds[y]].length == 0) {
                                nginxErrors = "Please set the missing subdomains for the Nginx domain configs";
                            }
                        }
                    }
                    if (nginxErrors) {
                        return this.props.notify(nginxErrors, "error");
                    }

                    // All good, save now
                    this.setState({
                        loading: true,
                        loadingMessage: "Saving ..."
                    });

                    let dbSolution = null;
                    // If existing solution
                    if (this.props.solution) {
                        // First, look up solution in DB
                        dbSolution = await API.endpoints.Solutions.getOne({
                            "where": { "id": this.props.solution.id }
                        });
                        // Update object with name and alias
                        dbSolution.name = this.state._name;
                        dbSolution.description = this.state._description;
                        dbSolution.alias = this.props.alias;

                        await API.endpoints.Solutions.update(dbSolution);
                    }
                    // New solution
                    else {
                        // First create solution in DB
                        dbSolution = await API.endpoints.Solutions.create({
                            name: this.state._name,
                            description: this.state._description,
                            alias: this.props.alias,
                        });
                    }

                    // Check if we need to delete a solution parameter that no longer exists (only possible for existing solutions)
                    if (this.props.solution) {
                        for (let y = 0; y < this.props.solutionParameters.length; y++) {
                            if (this.props.solutionParameters[y].solutionId == this.props.solution.id) {
                                // If solution parameter no longer exists, delete it from db
                                if (!this.state._solutionParameters.find(_sp => _sp.containerId == this.props.solutionParameters[y].containerId)) {
                                    await API.endpoints.SolutionParameters.deleteById(this.props.solutionParameters[y].id);
                                }
                            }
                        }
                    }

                    // Now create / update solution parameters
                    for (let i = 0; i < this.state._solutionParameters.length; i++) {
                        if (this.state._solutionParameters[i].id) {
                            await API.endpoints.SolutionParameters.update(this.state._solutionParameters[i]);
                        } else {
                            await API.endpoints.SolutionParameters.create({
                                solutionId: dbSolution.id,
                                containerId: this.state._solutionParameters[i].containerId,
                                volumes: this.state._solutionParameters[i].volumes
                            });
                        }

                        // Now update container volume mappings
                        if (this.state._solutionParameters[i].volumes.length > 0) {
                            let container = this.props.containers.find(c => c.id == this.state._solutionParameters[i].containerId);

                            this.state._solutionParameters[i].volumes.forEach((spVolumeObj) => {
                                let pathMapKey = this.VOLUME_MAPPER[this.state._solutionParameters[i].containerId][spVolumeObj.path];
                                container.volumes = container.volumes.map(vObject => {
                                    if (vObject.containerPath == spVolumeObj.path) {
                                        vObject.hostPath = this.state[pathMapKey];
                                    }
                                    return vObject;
                                });
                            });

                            await API.endpoints.Containers.update(container);

                            this.props.dispatch({
                                type: "UPDATE_CONTAINER",
                                data: container
                            });
                        }

                        // update nginx configs
                        let nginxConfigIds = this.props.nginxDockerLinks.filter(ndx => ndx.containerId == this.state._solutionParameters[i].containerId).map(ndx => ndx.nginxConfigId);
                        for (let y = 0; y < nginxConfigIds.length; y++) {
                            let nginxConfigObj = this.props.nginxConfigs.find(nc => nc.id == nginxConfigIds[y]);
                            if (this.state["proxy_uri_" + nginxConfigIds[y]] != undefined) {
                                nginxConfigObj.uriPath = this.state["proxy_uri_" + nginxConfigIds[y]];
                            }
                            if (this.state["proxy_subdomain_" + nginxConfigIds[y]] != undefined) {
                                nginxConfigObj.subdomain = this.state["proxy_subdomain_" + nginxConfigIds[y]];
                            }
                            if (this.state["proxy_domain_" + nginxConfigIds[y]] != undefined) {
                                nginxConfigObj.domainId = this.state["proxy_domain_" + nginxConfigIds[y]];
                            }
                            if (this.state["proxy_asSubdomain_" + nginxConfigIds[y]] != undefined) {
                                nginxConfigObj.asSubdomain = this.state["proxy_asSubdomain_" + nginxConfigIds[y]];
                            }

                            await API.endpoints.NginxConfigs.update(nginxConfigObj);
                        }
                    }

                    let resultSolutions = await API.endpoints.Solutions.getAll();
                    this.props.dispatch({
                        type: "SET_SOLUTIONS",
                        data: resultSolutions
                    });

                    let resultSolutionParameters = await API.endpoints.SolutionParameters.getAll();
                    this.props.dispatch({
                        type: "SET_SOLUTION_PARAMETERS",
                        data: resultSolutionParameters
                    });

                    let resultNginxConfigs = await API.endpoints.NginxConfigs.getAll();
                    this.props.dispatch({
                        type: "SET_NGINX_CONFIGS",
                        data: resultNginxConfigs
                    });

                    this.setState({
                        loading: false,
                        loadingMessage: null
                    });

                    this.props.notify("Solution saved");

                    this.props.solutionSaved(dbSolution.id);
                }
            } catch (err) {
                console.log(err);
                this.setState({
                    loading: false,
                    loadingMessage: null
                });

                this.props.notify("An error occured", "error");
            }
        })();
    }

    /**
     * onLookupContainer
     */
    onLookupContainer(event) {
        this.setState({ availableContainersAnchorEl: event.currentTarget });
    }

    /**
     * onLookupVolume
     */
    onLookupVolume(cIndex, event) {
        let stateObject = {};
        stateObject['availableVolumesAnchorEl_' + cIndex] = event.currentTarget;
        this.setState(stateObject);
    }

    /**
     * onRemoveContainer
     */
    onRemoveContainer(containerId) {
        let stateReset = {
            _solutionParameters: this.state._solutionParameters.filter(sp => sp.containerId != containerId)
        };
        Object.keys(this.VOLUME_MAPPER[containerId]).forEach((key) => {
            stateReset[this.VOLUME_MAPPER[containerId][key]] = null;
        });
        delete this.VOLUME_MAPPER[containerId];

        Object.keys(this.state).forEach((stateKey) => {
            if (stateKey.indexOf('portContainer_' + containerId + '_') == 0) {
                stateReset[stateKey] = null;
            }
        });

        this.setState(stateReset);
    }

    /**
     * onRemoveVolume
     * @param {*} containerId 
     * @param {*} volumeKey 
     */
    onRemoveVolume(containerId, volumeKey) {
        let stateReset = {};
        Object.keys(this.VOLUME_MAPPER[containerId]).forEach((key) => {
            if (this.VOLUME_MAPPER[containerId][key] == volumeKey) {
                this.state._solutionParameters = this.state._solutionParameters.map(sp => {

                    if (sp.containerId == containerId && sp.volumes.find(_v => _v.path == key) != null) {
                        // Remove volume from solution parameter object
                        sp.volumes = sp.volumes.filter(_v => _v.path != key);

                        // Reset volume host path in case volume is added again later
                        let container = this.props.containers.find(c => c.id == containerId);
                        container.volumes.forEach((volumeObj) => {
                            if (volumeObj.containerPath == key) {
                                stateReset[this.VOLUME_MAPPER[containerId][key]] = volumeObj.hostPath;
                            }
                        });
                    }
                    return sp;
                });
            }
        });

        stateReset._solutionParameters = this.state._solutionParameters;
        this.setState(stateReset);
    }

    /**
     * handleAvailableContainerMenuClose
     */
    handleAvailableContainerMenuClose(target) {
        // If selected target container
        if (target.cid) {
            // Create memory solution paramleter
            this.state._solutionParameters.push({
                solutionId: this.props.solution ? this.props.solution.id : -1,
                containerId: target.cid,
                volumes: []
            });

            let stateData = {
                availableContainersAnchorEl: null,
                _solutionParameters: this.state._solutionParameters
            };

            this._prepareContainerStates(stateData, this.state._solutionParameters.find(_sp => _sp.containerId == target.cid));
        } else {
            this.setState({ availableContainersAnchorEl: null });
        }
    }

    /**
     * _prepareContainerStates
     */
    _prepareContainerStates(stateData, sp) {
        // Prepare existing volume objects for state management
        let containerVolumeMapObject = {};
        // console.log(sp.volumes);
        this.props.containers.find(c => c.id == sp.containerId).volumes.forEach(volume => {
            let vId = shortid.generate();

            containerVolumeMapObject[volume.containerPath] = vId;
            stateData[vId] = volume.hostPath;
        });
        this.VOLUME_MAPPER[sp.containerId] = containerVolumeMapObject;

        // Prepare existing nginx config objects for state management
        this.props.nginxDockerLinks.filter(ndl => ndl.containerId == sp.containerId).map(ndl => this.props.nginxConfigs.find(nc => nc.id == ndl.nginxConfigId)).forEach(nc => {
            stateData["proxy_uri_" + nc.id] = nc.uriPath;
            stateData["proxy_subdomain_" + nc.id] = nc.subdomain;
            stateData["proxy_domain_" + nc.id] = nc.domainId;
            stateData["proxy_asSubdomain_" + nc.id] = nc.asSubdomain;
        });

        // Prepare option menu ref state objects if not already done
        this.state._solutionParameters.forEach((_sp, i) => {
            this.state['availableVolumesAnchorEl_' + i] = null;
        });

        this.setState(stateData);
    }

    /**
     * handleAvailableVolumeMenuClose
     */
    handleAvailableVolumeMenuClose(cIndex, target) {
        let stateObject = {};
        stateObject['availableVolumesAnchorEl_' + cIndex] = null;

        if (target.volume) {
            this.state._solutionParameters = this.state._solutionParameters.map(sp => {
                if (sp.containerId == target.containerId) {
                    sp.volumes.push({
                        "path": target.volume,
                        // "git": null,
                        // "cmd": null
                    });
                }
                return sp;
            });
            stateObject._solutionParameters = this.state._solutionParameters;
        }
        this.setState(stateObject);
    }

    /**
     * getDialogFormBlockUriPath
     */
    getDialogFormBlockUriPath(container, nxc) {
        return <Grid item xs={3} style={{ textAlign: 'left' }}>
            <div className={"form-group"}>
                <TextField
                    name={"proxy_uri_" + nxc.id}
                    className={"form-control"}
                    value={this.state["proxy_uri_" + nxc.id]}
                    onChange={(e) => {
                        let stateUpd = {};
                        stateUpd["proxy_uri_" + nxc.id] = e.target.value;
                        this.setState(stateUpd);
                    }}
                    label="URI path"
                    type="text" />
                <div className="invalid-feedback"></div>
            </div>
        </Grid>;
    }

    /**
     * getDialogFormBlockIsSubdomain
     */
    getDialogFormBlockIsSubdomain(container, nxc) {
        return <Grid item xs={3} style={{ textAlign: 'left' }}>
            <FormGroup row>
                <FormControlLabel
                    control={
                        <Switch
                            checked={this.state["proxy_asSubdomain_" + nxc.id]}
                            onChange={(event) => {
                                let stateUpd = {};
                                stateUpd["proxy_asSubdomain_" + nxc.id] = event.target.checked;
                                stateUpd["proxy_subdomain_" + nxc.id] = "";
                                this.setState(stateUpd);
                            }}
                        />
                    }
                    label="Subdomain"
                />
            </FormGroup>
        </Grid>;
    }

    /**
     * getDialogFormBlockSubdomain
     */
    getDialogFormBlockSubdomain(container, nxc) {
        return <Grid item xs={3} style={{ textAlign: 'left' }}>
            {this.state["proxy_asSubdomain_" + nxc.id] && <div className={"form-group"}>
                <TextField
                    name={"proxy_subdomain_" + nxc.id}
                    className={"form-control"}
                    value={this.state["proxy_subdomain_" + nxc.id]}
                    onChange={(e) => {
                        let stateUpd = {};
                        stateUpd["proxy_subdomain_" + nxc.id] = e.target.value;
                        this.setState(stateUpd);
                    }}
                    label="Subdomain"
                    type="text"
                    fullWidth />
                <div className="invalid-feedback"></div>
            </div>}
        </Grid>;
    }

    /**
     * getDialogFormBlockDomain
     */
    getDialogFormBlockDomain(container, nxc) {
        return <Grid item xs={3} style={{ textAlign: 'left' }}>
            <div className={"form-group"} style={{ textAlign: 'left' }}>
                <FormControl fullWidth>
                    <InputLabel htmlFor={"proxy_domain_" + nxc.id}>Domain</InputLabel>
                    <Select
                        value={this.state["proxy_domain_" + nxc.id] ? this.state["proxy_domain_" + nxc.id] : ""}
                        onChange={(event) => {
                            this.setState({ ["proxy_domain_" + nxc.id]: event.target.value });
                        }}
                        inputProps={{
                            name: "proxy_domain_" + nxc.id,
                            id: "proxy_domain_" + nxc.id,
                        }}
                        fullWidth
                    >
                        <MenuItem value="">
                            <em>None</em>
                        </MenuItem>

                        {this.props.domains.map(domain => (
                            <MenuItem key={"proxy_domain_item_" + container.id + "_" + nxc.id + "_" + domain.id} value={domain.id}>{domain.value}</MenuItem>
                        ))}
                    </Select>
                    <div className="invalid-feedback"></div>
                </FormControl>
            </div>
        </Grid>;
    }

    /**
     * getSolutionContainerBlock
     */
    getSolutionContainerBlock() {
        const { classes } = this.props;

        let containerBlocks = this.state._solutionParameters.map((solutionParameter, cIndex) => {
            let container = this.props.containers.find(c => c.id == solutionParameter.containerId);
            let availableVolumes = container.volumes.filter((volume) => {
                return solutionParameter.volumes.find(_v => _v.path == volume.containerPath) == null;
            }).map((volume) => {
                return volume.containerPath;
            });
            let nginxConfigs = this.props.nginxDockerLinks.filter(ndl => ndl.containerId == container.id).map(ndl => this.props.nginxConfigs.find(nxc => nxc.id == ndl.nginxConfigId));

            return <div key={'scont_' + solutionParameter.containerId}>
                <div style={{ marginTop: cIndex == 0 ? 50 : 100 }}>
                    <Grid container alignItems="center">
                        <Grid item xs>
                            <Typography gutterBottom variant="headline" style={{ color: 'rgb(224, 113, 80)' }}>
                                {container.name}
                            </Typography>
                        </Grid>
                        <Grid item>
                            <Button color="secondary" fullWidth onClick={this.onRemoveContainer.bind(this, container.id)}>
                                Remove container
                            </Button>
                        </Grid>
                    </Grid>
                </div>

                <Divider variant="middle" style={{ marginLeft: 0, marginRight: 0 }} />

                <div style={{ paddingLeft: 30, paddingTop: 20 }}>

                    {/* ---------------- Container volumes - header ---------------- */}
                    <Grid container alignItems="center">
                        <Grid item xs>
                            <Typography gutterBottom variant="h6">
                                Container volumes setup
                            </Typography>
                        </Grid>
                        <Grid item>
                            <Button color="primary" fullWidth disabled={availableVolumes.length == 0} onClick={this.onLookupVolume.bind(this, cIndex)}>
                                Configure
                            </Button>
                            <Menu
                                id={"simple-menu-volume-" + cIndex}
                                anchorEl={this.state['availableVolumesAnchorEl_' + cIndex]}
                                open={Boolean(this.state['availableVolumesAnchorEl_' + cIndex])}
                                onClose={this.handleAvailableVolumeMenuClose.bind(this, cIndex)}
                            >
                                {availableVolumes.map((v, i) => <MenuItem key={'vol_mi_' + i} onClick={this.handleAvailableVolumeMenuClose.bind(this, cIndex, { "volume": v, "containerId": container.id })}>Container volume : <i>{v}</i></MenuItem>)}
                            </Menu>
                        </Grid>
                    </Grid>

                    {/* Container volumes - list */}
                    <div>
                        {/* Volumes items */}
                        {solutionParameter.volumes.map((volumeObj, i) => {
                            let vs = this.props.containers.find(c => c.id == solutionParameter.containerId).volumes.find(_v => _v.containerPath == volumeObj.path);
                            return <div key={'vol_line_' + this.VOLUME_MAPPER[container.id][volumeObj.path]}>
                                <Grid container alignItems="center" style={{ marginTop: 10 }}>
                                    <Grid item xs>
                                        <Grid container alignItems="center" style={{ marginTop: 20 }}>
                                            <Grid item xs>
                                                <div className={"form-group"} style={{ paddingRight: 20 }}>
                                                    <TextField
                                                        name={this.VOLUME_MAPPER[container.id][volumeObj.path]}
                                                        className={"form-control"}
                                                        value={this.state[this.VOLUME_MAPPER[container.id][volumeObj.path]]}
                                                        onChange={(e) => { this.setState({ [this.VOLUME_MAPPER[container.id][volumeObj.path]]: e.target.value }) }}
                                                        label="Host path"
                                                        type="text"
                                                        fullWidth
                                                        required />
                                                    <div className="invalid-feedback"></div>
                                                </div>
                                            </Grid>
                                            <Grid item xs>
                                                <Typography gutterBottom variant="body1" style={{ paddingTop: 15 }}>
                                                    Container path:
                                            </Typography>
                                                <Typography gutterBottom color="textSecondary">
                                                    {volumeObj.path}
                                                </Typography>
                                            </Grid>
                                            {vs && vs.volumeDescription && <Grid item xs={12}>
                                                <Typography gutterBottom style={{ color: "#505050", marginLeft: -5, paddingLeft: 10, paddingRight: 10, paddingTop: 5, paddingBottom: 5, backgroundColor: "#cccccc" }}>
                                                    {vs.volumeDescription}
                                                </Typography>
                                            </Grid>}
                                        </Grid>
                                    </Grid>
                                    <Grid item>
                                        <Fab size="small" className={classes.fab} onClick={this.onRemoveVolume.bind(this, container.id, this.VOLUME_MAPPER[container.id][volumeObj.path])}>
                                            <DeleteIcon />
                                        </Fab>
                                    </Grid>
                                </Grid>
                            </div>
                        })}
                        {solutionParameter.volumes.length == 0 && <Typography variant="caption" className={this.props.classes.emptyLine}>-none-</Typography>}
                    </div>

                    {/* ---------------- Container nginx - header ---------------- */}
                    {nginxConfigs.length > 0 && <div>
                        <Grid container alignItems="center">
                            <Grid item xs>
                                <Typography gutterBottom variant="h6" style={{ marginTop: 30 }}>
                                    Nginx proxy configurations
                            </Typography>
                            </Grid>
                        </Grid>

                        {/* Container nginx - list */}
                        <div>
                            {/* HTTP Proxy details */}
                            {nginxConfigs.map((nxc, z) => {
                                return <Grid key={'nginx_block_' + container.id + '_' + nxc.id} container alignItems="center" style={{
                                    marginBottom: (z + 1) == nginxConfigs.length ? 40 : 10,
                                    marginLeft: -10,
                                    padding: 10,
                                    borderRadius: 5,
                                    backgroundColor: '#eeeeee'
                                }}>
                                    <Grid item xs>
                                        <Grid container spacing={16}>
                                            <Grid item xs={12}>
                                                <Typography gutterBottom color="textSecondary" style={{ fontWeight: 'bold' }}>
                                                    HTTP Proxy setup for container port: {nxc.port}
                                                </Typography>
                                            </Grid>
                                            {this.getDialogFormBlockDomain(container, nxc)}
                                            {this.getDialogFormBlockUriPath(container, nxc)}
                                            {this.getDialogFormBlockIsSubdomain(container, nxc)}
                                            {this.getDialogFormBlockSubdomain(container, nxc)}
                                        </Grid>
                                    </Grid>
                                </Grid>
                            })}
                        </div>
                    </div>}
                </div>
            </div>;
        });

        return <div className={classes.sectionBlockBody}>{containerBlocks}</div>;
    }

    /**
     * getSolutionContainerEditor
     */
    getSolutionContainerEditor() {
        const { classes } = this.props;
        const { availableContainersAnchorEl } = this.state;
        let availableContainers = this.props.containers.filter(c => this.state._solutionParameters.find(sp => sp.containerId == c.id) == null);

        return (
            <div>
                {/* Container Title Header */}
                <div className={classes.sectionBlockHeader}>
                    <Grid container alignItems="center">
                        <Grid item xs>
                            <Typography gutterBottom variant="h4">
                                Containers
                            </Typography>
                        </Grid>
                        <Grid item>
                            <Button variant="outlined" fullWidth disabled={availableContainers.length == 0} onClick={this.onLookupContainer.bind(this)}>
                                Lookup container
                            </Button>
                            <Menu
                                id="simple-menu"
                                anchorEl={availableContainersAnchorEl}
                                open={Boolean(availableContainersAnchorEl)}
                                onClose={this.handleAvailableContainerMenuClose.bind(this)}
                            >
                                {availableContainers.map(c => <MenuItem key={'cont_mi_' + c.id} onClick={this.handleAvailableContainerMenuClose.bind(this, { "cid": c.id })}>{c.name}</MenuItem>)}
                            </Menu>
                        </Grid>
                    </Grid>
                    <Typography color="textSecondary">
                        The docker containers that are part of the solution. Some container elements can be exposed here for user configuration as required.
                    </Typography>
                </div>

                {/* Container block iteration */}
                {this.getSolutionContainerBlock()}
            </div>
        );
    }

    /**
     * render
     */
    render() {
        const { classes } = this.props;

        let nameSpan = 10;
        if (this.props.alias) {
            nameSpan = nameSpan - 2;
        }
        if (this.props.solution) {
            nameSpan = nameSpan - 4;
        }

        return (
            <div>
                <ValidatorForm ref={form => (this.formEl = form)}>
                    <Grid container spacing={16} style={{ padding: 20 }}>

                        {/* Solution global setting */}
                        <Grid item xs={nameSpan} style={{ textAlign: 'left' }}>
                            <div className={"form-group"}>
                                <TextField
                                    name="name"
                                    className={"form-control"}
                                    value={this.state._name}
                                    onChange={(e) => { this.setState({ _name: e.target.value }) }}
                                    label="Solution name"
                                    type="text"
                                    fullWidth
                                    required />
                                <div className="invalid-feedback"></div>
                            </div>
                        </Grid>

                        {this.props.alias && <Grid item xs={2} style={{ textAlign: 'right' }}>
                            <Typography gutterBottom variant="body1" style={{ paddingTop: 5 }}>
                                Solution alias
                            </Typography>
                            <Typography gutterBottom color="textSecondary">
                                {this.props.alias}
                            </Typography>
                        </Grid>}

                        {this.props.solution && <Grid item xs={2} style={{ textAlign: 'right' }}>
                            <Button variant="outlined" color="secondary" fullWidth onClick={this.props.onDeleteSolution} style={{ marginTop: 8 }}>
                                Delete
                            </Button>
                        </Grid>}

                        <Grid item xs={2} style={{ textAlign: 'right' }}>
                            <Button variant="outlined" color="primary" fullWidth onClick={this.saveSolution} style={{ marginTop: 8 }}>
                                Save
                            </Button>
                        </Grid>

                        {this.props.solution && <Grid item xs={2} style={{ textAlign: 'right' }}>
                            <Button variant="outlined" color="primary" fullWidth onClick={this.props.exportSolution} style={{ marginTop: 8 }}>
                                Export
                            </Button>
                        </Grid>}

                        <Grid item xs={12} style={{ textAlign: 'left' }}>
                            <div className={"form-group"}>
                                <TextField
                                    name="description"
                                    className={"form-control"}
                                    value={this.state._description}
                                    onChange={(e) => { this.setState({ _description: e.target.value }) }}
                                    label="Solution description"
                                    type="text"
                                    multiline
                                    fullWidth />
                            </div>
                        </Grid>

                        <Grid item xs={12}>
                            {this.getSolutionContainerEditor()}
                        </Grid>
                    </Grid>
                </ValidatorForm>
                <LoadingIndicator show={this.state.loading} message={this.state.loadingMessage} />
            </div>
        );
    }
}

// The function takes data from the app current state,
// and insert/links it into the props of our component.
// This function makes Redux know that this component needs to be passed a piece of the state
const mapStateToProps = (state, props) => ({
    domains: state.domains,
    settings: state.settings,
    containers: state.containers,
    nginxConfigs: state.nginxConfigs,
    solutions: state.solutions,
    solutionParameters: state.solutionParameters,
    nginxDockerLinks: state.nginxDockerLinks
});

const mapDispatchToProps = (dispatch) => ({ "dispatch": dispatch });

//Connect everything
export default connect(mapStateToProps, mapDispatchToProps)(withStyles(styles)(SolutionEditor));