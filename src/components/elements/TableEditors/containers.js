import React from 'react';
import { connect } from 'react-redux';
import { withStyles } from '@material-ui/core/styles';
import {
    Paper,
    Grid,
    FormControl,
    Button,
    TextField,
    Select,
    MenuItem,
    InputLabel,
    Checkbox,
    Avatar,
    ListItemText,
    List,
    ListItem,
    ListItemAvatar,
    ListSubheader,
    ListItemSecondaryAction,
    Divider,
    DialogContent,
    DialogContentText,
    DialogActions,
    IconButton
} from '@material-ui/core';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import LinearProgress from '@material-ui/core/LinearProgress';
import Dialog from '@material-ui/core/Dialog';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import CloseIcon from '@material-ui/icons/Close';
import Slide from '@material-ui/core/Slide';
import ValidatorForm from "../ValidationForm/index";
import API from "../../../services/API";
import styles from './styles.js';
import CheckIcon from '@material-ui/icons/CheckCircleOutline';
import FolderOpen from '@material-ui/icons/FolderOpen';
import DnsIcon from '@material-ui/icons/Dns';
import DeleteIcon from '@material-ui/icons/Delete';
import { confirmAlert } from '../Dialogs/AlertDialog';
import { volumeDialog } from '../Dialogs/ContainerVolumeDialog';

import YAML from 'yaml';

let SAFE_STRING_REGEX = /([^A-Za-z0-9_]+)/;
let PORT_MAPPING_REGEX = /(\d{1,5}:{1,5})/;
// let VOLUME_MAPPING_REGEX = /(.+\:.+)/;
let DNS_MAPPING_REGEX = /(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}/;
let ENV_REGEX = /(^([^=]+=[^;]+;)*([^=]+=[^;]+;?))/;

function Transition(props) {
    return <Slide direction="up" {...props} />;
}

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
    PaperProps: {
        style: {
            maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
            width: 250,
        },
    },
};

class ConfigsTable extends React.Component {
    /**
     * constructor
     * @param {*} props 
     */
    constructor(props) {
        super(props);

        this.state = this.populateEditorFormFromObject();
        this.state.selected = null;
        this.state.mode = null;

        this.state.inputDialogOpen = false;
        this.state.inputDialogLabel = "";
        this.state.inputDialogTarget = "";
        this.state.inputDialogValue = "";
        this.state.inputDialogKey = "";
        this.state.inputDialogValueErrors = null;

        this.tblClickDebouncer = null;
    }

    // *****************************************************************
    SET_DATA_REDUCER_ACTION = "SET_CONTAINERS";
    tableRow(cellClasses, isSelected, selectedId, row) {
        let dImage = this.props.dockerImages.find(di => di.id == row.dockerImageId);
        return <TableRow hover key={row.id}
            className={isSelected ? "" : "hoverPointer"}
            onClick={event => this.handleRowClick(event, row.id)}
            selected={selectedId && selectedId === row.id}>

            <TableCell className={cellClasses}>{row.name}</TableCell>
            <TableCell className={cellClasses}>
                {`${this.props.dockerImages.find(di => di.id == row.dockerImageId).name}${dImage.version.length > 0 ? ":" + dImage.version : ""}`}
            </TableCell>
        </TableRow>;
    }
    populateEditorFormFromObject(selected) {
        return {
            _id: selected && selected.id ? selected.id : null,
            _name: selected && selected.name ? selected.name : "",
            _networks: selected && selected.networks ? selected.networks : [],
            _dependsOn: selected && selected.dependsOn ? selected.dependsOn : [],
            _dockerImageId: selected && selected.dockerImageId ? selected.dockerImageId : "",
            _env: selected && selected.env ? selected.env : [],
            _ports: selected && selected.ports ? selected.ports : [],
            _command: selected && selected.command ? selected.command : "",
            _user: selected && selected.user ? selected.user : "",
            _workingDir: selected && selected.workingDir ? selected.workingDir : "",
            _volumes: selected && selected.volumes ? selected.volumes : [],
            _dns: selected && selected.dns ? selected.dns : [],
        }
    }
    populateSelected(state) {
        return {
            name: state._name,
            dockerImageId: state._dockerImageId,
            env: state._env,
            dependsOn: state._dependsOn,
            ports: state._ports,
            command: state._command,
            user: state._user,
            workingDir: state._workingDir,
            volumes: state._volumes,
            dns: state._dns
        }
    }
    tableHeader() {
        return this.props.containers.length > 0 ? <TableRow>
            <TableCell className={this.props.classes.tableHeaderCell}>Name</TableCell>
            <TableCell className={this.props.classes.tableHeaderCell}>Image</TableCell>
        </TableRow> : null;
    }
    // *****************************************************************

    /**
     * handleDialogClose
     */
    handleDialogClose = () => {
        this.setSelected(null, null);
    };

    /**
    * setSelected
    * @param {*} mode 
    */
    setSelected(mode, selected) {
        if (selected && !selected.id && this.props.dockerImages.length == 0) {
            return this.props.notify("No docker images available", "error");
        }

        let stateData = this.populateEditorFormFromObject(selected);
        stateData.selected = selected;
        stateData.mode = mode;
        this.setState(stateData);
    }

    /**
     * saveDialogData
     */
    saveDialogData = () => {
        (async () => {
            let isValide = this.formEl.validate();
            if (isValide) {
                // Extra validation checks
                if (SAFE_STRING_REGEX.exec(this.state._name)) {
                    return this.props.notify("Error: Container name must contain only letters, numbers or underscore.", "error");
                }
                if (this.props.containers.find(c => (!this.state._id || c.id != this.state._id) && c.name.toLowerCase() == this.state._name.toLowerCase())) {
                    return this.props.notify("Conflict: container name already in use.", "error");
                }
                else if (this.state._id) {
                    let dependsOnOverlap = false;
                    this.state._dependsOn.find(depCont => {
                        let overlapingDependsOn = this.props.containers.filter(c => c.id != this.state._id).find(o => o.dependsOn && o.dependsOn.find(u => u == this.state._id));
                        if (overlapingDependsOn) {
                            dependsOnOverlap = true;
                        }
                    });
                    if (dependsOnOverlap) {
                        return this.props.notify("Conflict: this container is dependent on a container that is itself dependant on this container.", "error");
                    }
                }

                // Now move on
                let modelObject = this.populateSelected(this.state);
                try {
                    // On add container
                    if (this.state.mode === "ADD") {
                        let dbResult = await API.endpoints.Containers.create(modelObject);

                        // Networks
                        for (let i = 0; i < this.state._networks.length; i++) {
                            await API.endpoints.Containers.linkRelation(dbResult.id, "networks", this.state._networks[i], {
                                "containerId": dbResult.id,
                                "networkId": this.state._networks[i]
                            });
                        }
                        dbResult.networks = this.state._networks;

                        // Now dispatch updates
                        this.props.dispatch({
                            type: this.SET_DATA_REDUCER_ACTION,
                            data: [...this.props.containers, dbResult]
                        });
                    }
                    // On update container
                    else {
                        modelObject.id = this.state._id;

                        // if (this.state.selected.nginxConfigId) {
                        //     modelObject.nginxConfigId = this.state.selected.nginxConfigId;
                        // }

                        let dbResult = await API.endpoints.Containers.update(modelObject);

                        for (let i = 0; i < this.state.selected.networks.length; i++) {
                            if (this.state._networks.indexOf(this.state.selected.networks[i]) == -1) {
                                await API.endpoints.Containers.unlinkRelation(this.state._id, "networks", this.state.selected.networks[i]);
                            }
                        }

                        for (let i = 0; i < this.state._networks.length; i++) {
                            if (this.state.selected.networks.indexOf(this.state._networks[i]) == -1) {
                                await API.endpoints.Containers.linkRelation(this.state._id, "networks", this.state._networks[i], {
                                    "containerId": this.state._id,
                                    "networkId": this.state._networks[i]
                                });
                            }
                        }

                        dbResult.networks = this.state._networks;

                        let updData = this.props.containers.map(o => {
                            if (o.id === this.state._id) {
                                return dbResult;
                            } else {
                                return o;
                            }
                        });

                        this.props.dispatch({
                            type: this.SET_DATA_REDUCER_ACTION,
                            data: updData
                        });
                    }
                    this.setSelected(null, null);
                    this.props.notify("Saved");
                }
                catch (err) {
                    console.log("ERROR =>", err);
                    this.props.notify("An error occured, make sure the server is running.", "error");
                };
            }
        })();
    }

    /**
     * deleteDialogData
     */
    deleteDialogData = async () => {
        if (this.state.selected.id) {
            let nginxConfigIds = this.props.nginxDockerLinks.filter(ndl => ndl.containerId == this.state.selected.id).map(ndl => ndl.nginxConfigId);
            if (nginxConfigIds.length > 0) {
                return this.props.notify(`Conflict: this container configuration is in use by NGinx configs '${this.props.nginxConfigs.filter(nxc => nginxConfigIds.indexOf(nxc.id) != -1).map(nxc => nxc.name).join(', ')}'`, "error");
            }
        }

        if (this.props.containers.filter(c => c.id != this.state._id).find(o => o.dependsOn && o.dependsOn.find(u => u == this.state._id))) {
            this.props.notify(`Conflict: Cannot delete because there is a container that flagged this container as a dependency.`, "error");
        } else {
            // Confirm delete
            confirmAlert({
                title: null,
                message: 'Are you sure you want to delete this?',
                buttons: [
                    {
                        label: 'Yes',
                        onClick: async () => {
                            try {
                                // Remove potential solution parameters
                                let toDelSolutionParams = this.props.solutionParameters.filter(sp => sp.containerId == this.state._id);
                                for (let i = 0; i < toDelSolutionParams.length; i++) {
                                    await API.endpoints.SolutionParameters.deleteById(toDelSolutionParams[i].id);
                                    this.props.dispatch({
                                        type: "DELETE_SOLUTION_PARAMETER",
                                        data: toDelSolutionParams[i].id
                                    });
                                }

                                // Now remove container
                                await API.endpoints.Containers.deleteById(this.state._id);
                                this.props.dispatch({
                                    type: this.SET_DATA_REDUCER_ACTION,
                                    data: this.props.containers.filter(o => {
                                        return o.id != this.state._id
                                    })
                                });
                                this.setSelected(null, null);
                                this.props.notify("Deleted");
                            }
                            catch (err) {
                                console.log("ERROR =>", err);
                                this.props.notify("An error occured, make sure the server is running.", "error");
                            }
                        }
                    },
                    {
                        label: 'No',
                        onClick: () => {

                        }
                    }
                ]
            });
        }
    }

    /**
     * handleRowClick
     */
    handleRowClick(event, id) {
        let selectedItem = this.props.containers.find(o => o.id === id);
        if (this.state.selected && this.state._id === selectedItem.id) {
            return;
        }

        this.setState({ selected: null });

        if (this.tblClickDebouncer) {
            clearTimeout(this.tblClickDebouncer);
        }

        this.tblClickDebouncer = setTimeout(function (si) {
            this.tblClickDebouncer = null;
            this.setSelected("EDIT", JSON.parse(JSON.stringify(si)));
        }.bind(this, selectedItem), 200);
    }

    /**
     * stringEditorDialog
     */
    stringEditorDialog(text, handleClose, validator) {
        return <Dialog
            open={this.state.inputDialogOpen}
            onClose={handleClose.bind(this, "CANCEL")}
            aria-labelledby="form-dialog-title"
        >
            <DialogContent>
                {text && <DialogContentText>{text}</DialogContentText>}
                <TextField
                    autoFocus
                    margin="dense"
                    label={this.state.inputDialogLabel}
                    type="text"
                    value={this.state.inputDialogValue}
                    onChange={(e) => {
                        this.setState({ "inputDialogValue": e.target.value })
                    }}
                    style={{ width: 500 }}
                />
                {this.state.inputDialogValueErrors && this.state.inputDialogValueErrors.map((error, i) => <div key={"err_" + i} style={{
                    color: "red",
                    fontSize: 12
                }}>{error}</div>)}
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose.bind(this, "CANCEL")} color="primary">
                    Cancel
                </Button>
                <Button onClick={() => {
                    if (validator) {
                        let validationErrors = validator(this.state.inputDialogValue);
                        if (validationErrors) {
                            this.setState({ "inputDialogValueErrors": validationErrors })
                        } else {
                            handleClose("SAVE");
                        }
                    }
                    else {
                        handleClose("SAVE");
                    }
                }} color="primary">
                    Save
            </Button>
            </DialogActions>
        </Dialog>;
    }

    /**
     * getDialogFormBlockName
     */
    getDialogFormBlockName() {
        return <Grid item xs={6} style={{ textAlign: 'left' }}>
            <div className={"form-group"}>
                <TextField
                    name="name"
                    className={"form-control"}
                    value={this.state._name}
                    onChange={(e) => { this.setState({ _name: e.target.value }) }}
                    label="Container name"
                    type="text"
                    fullWidth
                    autoFocus
                    required
                />
                <div className="invalid-feedback"></div>
            </div>
        </Grid>;
    }

    /**
     * getDialogFormBlockCommand
     */
    getDialogFormBlockCommand() {
        return <Grid item xs={6} style={{ textAlign: 'left' }}>
            <div className={"form-group"}>
                <TextField
                    name="command"
                    className={"form-control"}
                    value={this.state._command}
                    onChange={(e) => { this.setState({ _command: e.target.value }) }}
                    label="Command"
                    type="text"
                    fullWidth
                />
                <div className="invalid-feedback"></div>
            </div>
        </Grid>;
    }

    /**
     * getDialogFormBlockUser
     */
    getDialogFormBlockUser() {
        return <Grid item xs={6} style={{ textAlign: 'left' }}>
            <div className={"form-group"}>
                <TextField
                    name="user"
                    className={"form-control"}
                    value={this.state._user}
                    onChange={(e) => { this.setState({ _user: e.target.value }) }}
                    label="User"
                    type="text"
                    fullWidth
                />
                <div className="invalid-feedback"></div>
            </div>
        </Grid>;
    }

    /**
     * getDialogFormBlockUser
     */
    getDialogFormBlockWorkingDir() {
        return <Grid item xs={6} style={{ textAlign: 'left' }}>
            <div className={"form-group"}>
                <TextField
                    name="workingDir"
                    className={"form-control"}
                    value={this.state._workingDir}
                    onChange={(e) => { this.setState({ _workingDir: e.target.value }) }}
                    label="Working directory"
                    type="text"
                    fullWidth
                />
                <div className="invalid-feedback"></div>
            </div>
        </Grid>;
    }

    /**
     * getDialogFormBlockNetworks
     */
    getDialogFormBlockNetworks() {
        const networkNames = this.props.networks.map(n => n.name);

        return <Grid item xs={6} style={{ textAlign: 'left' }}>
            {networkNames.length > 0 && <div className={"form-group"} style={{ textAlign: 'left' }}>
                <FormControl fullWidth>
                    <InputLabel htmlFor="networks">Networks</InputLabel>
                    <Select
                        multiple
                        value={this.state._networks}
                        onChange={(event) => {
                            this.setState({ [event.target.name]: event.target.value });
                        }}
                        renderValue={selected => this.props.networks.filter(n => selected.indexOf(n.id) > -1).map(n => n.name).join(', ')}
                        inputProps={{
                            name: '_networks',
                            id: 'networks',
                        }}
                        MenuProps={MenuProps}
                        fullWidth
                    >
                        {networkNames.map(name => (
                            <MenuItem key={name} value={this.props.networks.find(n => n.name == name).id}>
                                <Checkbox checked={this.props.networks.filter(n => this.state._networks.indexOf(n.id) > -1).map(n => n.name).indexOf(name) > -1} />
                                <ListItemText primary={name} />
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </div>}
        </Grid>;
    }

    /**
     * getDialogFormBlockNetworks
     */
    getDialogFormBlockDependsOn() {
        const containerNames = this.props.containers.filter(n => n.id != this.state.selected.id);

        return <Grid item xs={6} style={{ textAlign: 'left' }}>
            {containerNames.length > 0 && <div className={"form-group"} style={{ textAlign: 'left' }}>
                <FormControl fullWidth>
                    <InputLabel htmlFor="_dependsOn">Depends on</InputLabel>
                    <Select
                        multiple
                        value={this.state._dependsOn}
                        onChange={(event) => {
                            this.setState({ [event.target.name]: event.target.value });
                        }}
                        renderValue={selected => {
                            if (this.state._dependsOn) {
                                return this.state._dependsOn.map(oid => this.props.containers.find(cl => cl.id == oid).name).join(', ');
                            } else {
                                return "";
                            }
                        }}
                        inputProps={{
                            name: '_dependsOn',
                            id: '_dependsOn',
                        }}
                        MenuProps={MenuProps}
                        fullWidth
                    >
                        {containerNames.map(c => (
                            <MenuItem key={c.name} value={c.id}>
                                <Checkbox checked={this.state._dependsOn.find(o => o == c.id) ? true : false} />
                                <ListItemText primary={c.name} />
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </div>}
        </Grid>;
    }

    /**
     * getDialogFormBlockDockerImages
     */
    getDialogFormBlockDockerImages() {
        return <Grid item xs={6} style={{ textAlign: 'left' }}>
            <div className={"form-group"} style={{ textAlign: 'left' }}>
                <FormControl fullWidth>
                    <InputLabel htmlFor="dockerImage">Docker Image</InputLabel>
                    <Select
                        required
                        value={this.state._dockerImageId}
                        onChange={(event) => {
                            let imageObject = this.props.dockerImages.find(o => o.id == event.target.value);

                            let stateUpd = { [event.target.name]: event.target.value };
                            if (imageObject.template && imageObject.template.length > 0) {
                                let yamlDoc = YAML.parse(imageObject.template);

                                if (yamlDoc.ports) {
                                    stateUpd._ports = yamlDoc.ports
                                }
                                if (yamlDoc.environment) {
                                    stateUpd._env = yamlDoc.environment
                                }
                                if (yamlDoc.dns) {
                                    stateUpd._dns = yamlDoc.dns
                                }
                                if (yamlDoc.volumes) {
                                    stateUpd._volumes = yamlDoc.volumes.map(v => {
                                        return {
                                            hostPath: v.substring(0, v.indexOf(":")),
                                            containerPath: v.substring(v.indexOf(":") + 1),
                                            git: "",
                                            cmd: ""
                                        }
                                    });
                                }

                                if (yamlDoc.networks) {
                                    let networkIds = yamlDoc.networks.map(name => this.props.networks.find(n => n.name == name) ? this.props.networks.find(n => n.name == name).id : null);
                                    stateUpd._networks = networkIds.filter(o => o != null);
                                }

                                if (yamlDoc.depends_on) {
                                    let configIds = yamlDoc.depends_on.map(name => this.props.containers.find(n => n.name == name) ? name : null);
                                    stateUpd._dependsOn = configIds.filter(o => o != null);
                                }

                                if (yamlDoc.working_dir) {
                                    stateUpd._workingDir = yamlDoc.working_dir
                                }

                                if (yamlDoc.command) {
                                    stateUpd._command = yamlDoc.command
                                }

                                if (yamlDoc.user) {
                                    stateUpd._user = yamlDoc.user
                                }
                            }
                            this.setState(stateUpd);
                        }}
                        inputProps={{
                            name: '_dockerImageId',
                            id: '_dockerImageId',
                        }}
                    >
                        {this.props.dockerImages.map(di => (
                            <MenuItem key={di.id} value={di.id}>{di.name + (di.version.length > 0 ? ":" + di.version : "")}</MenuItem>
                        ))}
                    </Select>
                    <div className="invalid-feedback"></div>
                </FormControl>
            </div>
        </Grid>;
    }

    /**
     * getDialogFormBlockEnvironementVariables
     */
    getDialogFormBlockEnvironementVariables() {
        return <Grid item xs={12} style={{ textAlign: 'left' }}>
            <div className={"form-group"} style={{ textAlign: 'left' }}>
                <Grid container>
                    <Grid item xs={6} style={{ textAlign: 'left' }}>
                        <ListSubheader component="div">Environement Variables</ListSubheader>
                    </Grid>
                    <Grid item xs={6} style={{ textAlign: 'right' }}>
                        <Button color="primary" style={{ marginTop: 8 }} onClick={(e) => {
                            this.setState({
                                inputDialogOpen: true,
                                inputDialogValue: "",
                                inputDialogValueErrors: null,
                                inputDialogTarget: "env",
                                inputDialogLabel: "Environement Variable (<NAME>=<VALUE>)",
                                inputDialogKey: null
                            });
                        }}>Add Env</Button>
                    </Grid>
                </Grid>
                <List dense={false} >
                    {this.state._env.map((en, i) =>
                        <ListItem key={"env_" + i} button onClick={function (value, index) {
                            this.setState({
                                inputDialogOpen: true,
                                inputDialogValue: value,
                                inputDialogValueErrors: null,
                                inputDialogTarget: "env",
                                inputDialogLabel: "Environement Variable (<NAME>=<VALUE>)",
                                inputDialogKey: index
                            });
                        }.bind(this, en, i)}>
                            <CheckIcon />
                            <ListItemText
                                primary={en}
                                secondary={null}
                            />
                            <ListItemSecondaryAction onClick={function (index) {
                                this.state._env.splice(index, 1);
                                this.setState({
                                    _env: this.state._env
                                });
                            }.bind(this, i)}>
                                <IconButton aria-label="Delete">
                                    <DeleteIcon />
                                </IconButton>
                            </ListItemSecondaryAction>
                        </ListItem>
                    )}
                    {this.state._env.length == 0 && <Typography variant="caption" className={this.props.classes.emptyDialogLine}>-none-</Typography>}
                </List>
            </div>
        </Grid>;
    }

    /**
     * getDialogFormBlockVolumes
     */
    getDialogFormBlockVolumes() {
        return <Grid item xs={12} style={{ textAlign: 'left' }}>
            <div className={"form-group"} style={{ textAlign: 'left' }}>
                <Grid container>
                    <Grid item xs={6} style={{ textAlign: 'left' }}>
                        <ListSubheader component="div">Volumes</ListSubheader>
                    </Grid>
                    <Grid item xs={6} style={{ textAlign: 'right' }}>
                        <Button color="primary" style={{ marginTop: 8 }} onClick={(e) => {

                            volumeDialog({
                                submitLabel: "Add",
                                volumeDescription: "",
                                hostPath: "",
                                containerPath: "",
                                git: "",
                                cmd: "",
                                execOnEveryDeploy: false,
                                currentVolumes: this.state._volumes,
                                onDuplicate: () => {
                                    this.props.notify("This container volume already exists", "error");
                                },
                                onSubmit: async (volumeObj) => {
                                    this.state._volumes.push(volumeObj);
                                    this.setState({
                                        _volumes: this.state._volumes
                                    });
                                }
                            });

                        }}>Add Volume</Button>
                    </Grid>
                </Grid>
                <List dense={false} >
                    {this.state._volumes.map((en, i) =>
                        <ListItem
                            key={"volume_" + i}
                            button
                            onClick={function (vObj, index) {

                                volumeDialog({
                                    submitLabel: "Set",
                                    hostPath: vObj.hostPath,
                                    volumeDescription: vObj.volumeDescription ? vObj.volumeDescription : "",
                                    containerPath: vObj.containerPath,
                                    git: vObj.git,
                                    cmd: vObj.cmd,
                                    execOnEveryDeploy: vObj.execOnEveryDeploy ? true : false,
                                    currentVolumes: this.state._volumes,
                                    onDuplicate: () => {
                                        this.props.notify("This container volume already exists", "error");
                                    },
                                    onSubmit: async function (oldContainerPath, volumeObj) {
                                        this.state._volumes = this.state._volumes.map(o => {
                                            if (o.containerPath == oldContainerPath) {
                                                return volumeObj;
                                            } else {
                                                return o;
                                            }
                                        });
                                        this.setState({
                                            _volumes: this.state._volumes
                                        });
                                    }.bind(this, vObj.containerPath)
                                });

                            }.bind(this, en, i)}>

                            {/* <ListItemAvatar>
                                <Avatar alt="Folder" src="/folder_round.png" />
                            </ListItemAvatar> */}

                            <FolderOpen />

                            <ListItemText
                                primary={en.hostPath}
                                secondary={en.containerPath}
                            />
                            <ListItemSecondaryAction onClick={function (index) {
                                this.state._volumes.splice(index, 1);
                                this.setState({
                                    _volumes: this.state._volumes
                                });
                            }.bind(this, i)}>
                                <IconButton aria-label="Delete">
                                    <DeleteIcon />
                                </IconButton>
                            </ListItemSecondaryAction>
                        </ListItem>
                    )}
                    {this.state._volumes.length == 0 && <Typography variant="caption" className={this.props.classes.emptyDialogLine}>-none-</Typography>}
                </List>
            </div>
        </Grid>;
    }

    /**
     * getDialogFormBlockDns
     */
    getDialogFormBlockDns() {
        return <Grid item xs={12} style={{ textAlign: 'left' }}>
            <div className={"form-group"} style={{ textAlign: 'left' }}>
                <Grid container>
                    <Grid item xs={6} style={{ textAlign: 'left' }}>
                        <ListSubheader component="div">DNS's</ListSubheader>
                    </Grid>
                    <Grid item xs={6} style={{ textAlign: 'right' }}>
                        <Button color="primary" style={{ marginTop: 8 }} onClick={(e) => {
                            this.setState({
                                inputDialogOpen: true,
                                inputDialogValue: "",
                                inputDialogValueErrors: null,
                                inputDialogTarget: "dns",
                                inputDialogLabel: "DNS",
                                inputDialogKey: null
                            });
                        }}>Add DNS</Button>
                    </Grid>
                </Grid>
                <List dense={false} >
                    {this.state._dns.map((en, i) =>
                        <ListItem key={"dns_" + i} button onClick={function (value, index) {
                            this.setState({
                                inputDialogOpen: true,
                                inputDialogValue: value,
                                inputDialogValueErrors: null,
                                inputDialogTarget: "dns",
                                inputDialogLabel: "DNS",
                                inputDialogKey: index
                            });
                        }.bind(this, en, i)}>
                            <DnsIcon />
                            <ListItemText
                                primary={en}
                                secondary={null}
                            />
                            <ListItemSecondaryAction onClick={function (index) {
                                this.state._dns.splice(index, 1);
                                this.setState({
                                    _dns: this.state._dns
                                });
                            }.bind(this, i)}>
                                <IconButton aria-label="Delete">
                                    <DeleteIcon />
                                </IconButton>
                            </ListItemSecondaryAction>
                        </ListItem>
                    )}
                    {this.state._dns.length == 0 && <Typography variant="caption" className={this.props.classes.emptyDialogLine}>-none-</Typography>}
                </List>
            </div>
        </Grid>;
    }

    /**
     * getDialogFormBlockPorts
     */
    getDialogFormBlockPorts() {
        return <Grid item xs={12} style={{ textAlign: 'left' }}>
            <div className={"form-group"} style={{ textAlign: 'left' }}>
                <Grid container>
                    <Grid item xs={6} style={{ textAlign: 'left' }}>
                        <ListSubheader component="div">Ports</ListSubheader>
                    </Grid>
                    <Grid item xs={6} style={{ textAlign: 'right' }}>
                        <Button color="primary" style={{ marginTop: 8 }} onClick={(e) => {
                            this.setState({
                                inputDialogOpen: true,
                                inputDialogValue: "",
                                inputDialogValueErrors: null,
                                inputDialogTarget: "port",
                                inputDialogLabel: "Port mapping (<HOST>:<CONTAINER>)",
                                inputDialogKey: null
                            });
                        }}>Add Port</Button>
                    </Grid>
                </Grid>
                <List dense={false} >
                    {this.state._ports.map((en, i) =>
                        <ListItem key={"port_" + i} button onClick={function (value, index) {
                            this.setState({
                                inputDialogOpen: true,
                                inputDialogValue: value,
                                inputDialogValueErrors: null,
                                inputDialogTarget: "port",
                                inputDialogLabel: "Port mapping (<HOST>:<CONTAINER>)",
                                inputDialogKey: index
                            });
                        }.bind(this, en, i)}>
                            <CheckIcon />
                            <ListItemText
                                primary={en}
                                secondary={null}
                            />
                            <ListItemSecondaryAction onClick={function (index) {
                                this.state._ports.splice(index, 1);
                                this.setState({
                                    _ports: this.state._ports
                                });
                            }.bind(this, i)}>
                                <IconButton aria-label="Delete">
                                    <DeleteIcon />
                                </IconButton>
                            </ListItemSecondaryAction>
                        </ListItem>
                    )}
                    {this.state._ports.length == 0 && <Typography variant="caption" className={this.props.classes.emptyDialogLine}>-none-</Typography>}
                </List>
            </div>
        </Grid>;
    }

    /**
     * render
     */
    render() {
        const { classes } = this.props;

        let tblHeader = this.tableHeader();
        return (
            <Paper className={classes.paper}>
                <div className={classes.tableTitleDiv}>Containers</div>
                <Divider variant="middle" style={{ marginLeft: 0, marginRight: 0, marginTop: 0, marginBottom: 20 }} />
                <Button variant="contained" color="primary" style={{ textTransform: "none", position: 'absolute', right: 10, top: 10 }} onClick={this.setSelected.bind(this, "ADD", {})}>New</Button>
                <Table className={classes.table}>
                    {tblHeader && <TableHead>
                        {tblHeader}
                    </TableHead>}
                    <TableBody>
                        {this.props.containers.map(row => {
                            let cellClasses = [classes.tableCell];
                            cellClasses = cellClasses.join(' ');
                            return this.tableRow(cellClasses, (this.state.selected && this.state.selected.id === row.id), this.state._id ? this.state._id : null, row);
                        })}

                        {this.props.containers.length == 0 && <TableRow>
                            <TableCell style={{ textAlign: 'center' }} colSpan={2}>
                                <Typography variant="caption">-none-</Typography>
                            </TableCell>
                        </TableRow>}
                    </TableBody>
                </Table>
                {/* Loading indicator */}
                {this.state.loading && <LinearProgress color="secondary" />}

                {/* ********************************************** EDITOR DIALOG ********************************************** */}
                <Dialog
                    TransitionComponent={Transition}
                    open={this.state.selected ? true : false}
                    onClose={this.handleDialogClose}
                >
                    <AppBar className={classes.appBar}>
                        <Toolbar>
                            <IconButton color="inherit" onClick={this.handleDialogClose} aria-label="Close">
                                <CloseIcon />
                            </IconButton>
                            <Typography variant="h6" color="inherit" className={classes.flex}>
                                {this.state.mode === "EDIT" ? "Edit" : "Add"} container
                            </Typography>
                            <Button color="inherit" onClick={this.saveDialogData}>
                                Save
                            </Button>
                            {this.state.mode === "EDIT" &&
                                <Button color="secondary" onClick={this.deleteDialogData}>
                                    Delete
                                </Button>
                            }
                        </Toolbar>
                    </AppBar>
                    <div className={classes.formDiv}>
                        {this.state.selected && <ValidatorForm ref={form => (this.formEl = form)}>
                            <div className={"form-group"}>
                                <Grid container spacing={16}>
                                    {this.getDialogFormBlockName()}
                                    {/* {this.getDialogFormBlockNetworks()} */}
                                    {this.getDialogFormBlockDockerImages()}

                                    {this.getDialogFormBlockCommand()}
                                    {this.getDialogFormBlockUser()}
                                    {this.getDialogFormBlockWorkingDir()}
                                    {this.props.containers.length > 0 && this.getDialogFormBlockDependsOn()}

                                    {this.getDialogFormBlockVolumes()}
                                    {this.getDialogFormBlockDns()}

                                    {this.getDialogFormBlockEnvironementVariables()}
                                    {this.getDialogFormBlockPorts()}
                                </Grid>
                            </div>
                        </ValidatorForm>}
                    </div>
                </Dialog>

                {this.stringEditorDialog(null, (action) => {
                    switch (action + "_" + this.state.inputDialogTarget) {
                        case "SAVE_env":
                            if (this.state.inputDialogKey != null) {
                                this.state._env[this.state.inputDialogKey] = this.state.inputDialogValue;
                                this.setState({
                                    _env: this.state._env
                                });
                            } else {
                                this.state._env.push(this.state.inputDialogValue);
                                this.setState({
                                    _env: this.state._env
                                });
                            }
                            break;
                        case "SAVE_port":
                            if (this.state.inputDialogKey != null) {
                                this.state._ports[this.state.inputDialogKey] = this.state.inputDialogValue;
                                this.setState({
                                    _ports: this.state._ports
                                });
                            } else {
                                this.state._ports.push(this.state.inputDialogValue);
                                this.setState({
                                    _ports: this.state._ports
                                });
                            }
                            break;
                        case "SAVE_dns":
                            if (this.state.inputDialogKey != null) {
                                this.state._dns[this.state.inputDialogKey] = this.state.inputDialogValue;
                                this.setState({
                                    _dns: this.state._dns
                                });
                            } else {
                                this.state._dns.push(this.state.inputDialogValue);
                                this.setState({
                                    _dns: this.state._dns
                                });
                            }
                            break;
                    }

                    this.setState({
                        inputDialogOpen: false
                    });
                }, (value) => {
                    let isValide;
                    switch (this.state.inputDialogTarget) {
                        case "env":
                            isValide = ENV_REGEX.exec(value);
                            if (isValide) {
                                if (this.state.inputDialogKey != null) {
                                    return null;
                                } else {
                                    return null;
                                }
                            } else {
                                return ["Invalide Environement variable mapping"];
                            }
                        case "port":
                            isValide = PORT_MAPPING_REGEX.exec(value);
                            if (isValide) {
                                if (this.state.inputDialogKey != null) {
                                    return null;
                                } else {
                                    return null;
                                }
                            } else {
                                return ["Invalide port mapping"];
                            }
                        case "dns":
                            isValide = DNS_MAPPING_REGEX.exec(value);
                            if (isValide) {
                                if (this.state.inputDialogKey != null) {
                                    return null;
                                } else {
                                    return null;
                                }
                            } else {
                                return ["Invalide DNS"];
                            }
                    }
                })}
            </Paper>
        );
    }
}

// The function takes data from the app current state,
// and insert/links it into the props of our component.
// This function makes Redux know that this component needs to be passed a piece of the state
const mapStateToProps = (state, props) => ({
    containers: state.containers,
    networks: state.networks,
    dockerImages: state.dockerImages,
    nginxConfigs: state.nginxConfigs,
    nginxDockerLinks: state.nginxDockerLinks,
    solutionParameters: state.solutionParameters,
});

const mapDispatchToProps = (dispatch) => ({ "dispatch": dispatch });

//Connect everything
export default connect(mapStateToProps, mapDispatchToProps)(withStyles(styles)(ConfigsTable));