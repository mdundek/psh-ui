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
    ListItemText,
    Divider,
    Dialog,
    DialogContent,
    DialogContentText,
    DialogActions,
    IconButton
} from '@material-ui/core';
import Switch from '@material-ui/core/Switch';
import FormGroup from '@material-ui/core/FormGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import LinearProgress from '@material-ui/core/LinearProgress';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import CloseIcon from '@material-ui/icons/Close';
import Slide from '@material-ui/core/Slide';
import ValidatorForm from "../ValidationForm/index";
import API from "../../../services/API";
import { confirmAlert } from '../Dialogs/AlertDialog';
import styles from './styles.js';

import CheckIcon from '@material-ui/icons/CheckCircleOutline';
import DeleteIcon from '@material-ui/icons/Delete';

let SAFE_STRING_REGEX = /([^A-Za-z0-9_]+)/;
let DOMAIN_AS_IP_REGEX = /\b(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])\b/;

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

function Transition(props) {
    return <Slide direction="up" {...props} />;
}

class NginxPresetsTable extends React.Component {
    /**
     * constructor
     * @param {*} props 
     */
    constructor(props) {
        super(props);

        this.state = this.populateEditorFormObject();
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
    SET_DATA_REDUCER_ACTION = "SET_NGINX_CONFIGS";
    tableRow(cellClasses, isSelected, selectedId, row) {
        let domain = this.props.domains.find(o => o.id == row.domainId);
        return <TableRow hover key={row.id}
            className={isSelected ? "" : "hoverPointer"}
            onClick={event => this.handleRowClick(event, row.id)}
            selected={selectedId && selectedId === row.id}>
            <TableCell className={cellClasses}>{row.name}</TableCell>
            <TableCell className={[cellClasses, this.props.classes.tableCellButton].join(" ")}>{
                domain ? `${domain.httpsEnabled ? "https" : "http"}://${row.asSubdomain ? row.subdomain + "." : ""}${domain.value}${row.uriPath.length > 0 ? ((row.uriPath.indexOf('/') == -1 ? "/" : "") + row.uriPath) : ""}` : ''
            }</TableCell>
        </TableRow>;
    }
    populateEditorFormObject(selected) {
        return {
            _id: selected && selected.id ? selected.id : null,
            _name: selected && selected.name ? selected.name : "",
            _uriPath: selected && selected.uriPath ? selected.uriPath : "",
            _port: selected && selected.port ? selected.port : "",
            _asSubdomain: selected && selected.asSubdomain ? true : false,
            _subdomain: selected && selected.subdomain ? selected.subdomain : "",
            _proxyPath: selected && selected.proxyPath ? selected.proxyPath : "",
            _nginxPresetParamsId: selected && selected.nginxPresetParamsId ? selected.nginxPresetParamsId : "",
            _domainId: selected && selected.domainId ? selected.domainId : "",
            _basicAuthId: selected && selected.basicAuthId ? selected.basicAuthId : "",
            _serverTarget: selected && selected.serverTarget ? selected.serverTarget : "c",
            _selectedContainers: selected && selected.id ? this.props.nginxDockerLinks.filter(ndl => ndl.nginxConfigId == selected.id).map(ndl => ndl.containerId) : []
        }
    }
    populateSelected(state) {
        return {
            name: state._name,
            uriPath: state._uriPath,
            port: state._port,
            asSubdomain: state._asSubdomain,
            subdomain: state._subdomain,
            proxyPath: state._proxyPath,
            serverTarget: state._serverTarget,
            nginxPresetParamsId: state._nginxPresetParamsId ? state._nginxPresetParamsId : null,
            domainId: state._domainId ? state._domainId : null,
            basicAuthId: state._basicAuthId ? state._basicAuthId : null
        }
    }
    tableHeader() {
        return <TableRow>
            <TableCell className={this.props.classes.tableHeaderCell}>Name</TableCell>
            <TableCell className={[this.props.classes.tableCellButton, this.props.classes.tableHeaderCell].join(" ")}>URL</TableCell>
        </TableRow>;
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
        let stateData = this.populateEditorFormObject(selected);
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
                // Extra validation first
                if (SAFE_STRING_REGEX.exec(this.state._name)) {
                    return this.props.notify("Error: nginx name must contain only letters, numbers or underscore.", "error");
                }
                if (this.props.nginxConfigs.find(o => (!this.state._id || o.id != this.state._id) && o.name.toLowerCase() == this.state._name.toLowerCase())) {
                    return this.props.notify("Conflict: nginx config name already in use.", "error");
                }
                if (this.state._serverTarget == "h" && (this.state._port == "16199" || this.state._port == "80" || this.state._port == "443" || this.state._port == "9443")) {
                    return this.props.notify("Conflict: Host ports 16199, 80 & 443 are reserved ports.", "error");
                }
                if (this.state._asSubdomain && (!this.state._domainId || this.state._domainId.length == 0)) {
                    return this.props.notify("Error: You need to specify a domain since you configured a subdomain.", "error");
                }
                if (this.state._asSubdomain && DOMAIN_AS_IP_REGEX.exec(this.props.domains.find(o => o.id == this.state._domainId).value)) {
                    return this.props.notify("Error: subdomains are only allowed with real domain names.", "error");
                }

                let modelObject = this.populateSelected(this.state);
                try {
                    // On ADD config
                    if (this.state.mode === "ADD") {
                        let dbResult = await API.endpoints.NginxConfigs.create(modelObject);

                        // Create NginxDocker links
                        if (this.state._selectedContainers.length > 0) {
                            for (let i = 0; i < this.state._selectedContainers.length; i++) {
                                let nginxDockerLink = await API.endpoints.NginxDockerLinks.create({
                                    containerId: this.state._selectedContainers[i],
                                    nginxConfigId: dbResult.id
                                });

                                this.props.dispatch({
                                    type: "ADD_NGINX_DOCKER_LINKS",
                                    data: [nginxDockerLink]
                                });
                            }
                        }

                        // Update local store for nginx configs
                        this.props.dispatch({
                            type: this.SET_DATA_REDUCER_ACTION,
                            data: [...this.props.nginxConfigs, dbResult]
                        });
                    }
                    // On UPDATE config
                    else {
                        // Update NGinx config object
                        modelObject.id = this.state._id;
                        let dbResult = await API.endpoints.NginxConfigs.update(modelObject);
                        let updData = this.props.nginxConfigs.map(o => {
                            if (o.id === this.state._id) {
                                return dbResult;
                            } else {
                                return o;
                            }
                        });

                        // Look for existing links to manipulate
                        let nginxDockerLinks = await API.endpoints.NginxDockerLinks.getAll({
                            "where": {
                                "nginxConfigId": this.state._id
                            }
                        });

                        // Now update links
                        for (let i = 0; i < nginxDockerLinks.length; i++) {
                            // link exists, but is not required anymore
                            if (this.state._selectedContainers.indexOf(nginxDockerLinks[i].containerId) == -1) {
                                await API.endpoints.NginxDockerLinks.deleteById(nginxDockerLinks[i].id);

                                this.props.dispatch({
                                    type: "DELETE_NGINX_DOCKER_LINK",
                                    data: nginxDockerLinks[i].id
                                });
                            }
                        }
                        for (let i = 0; i < this.state._selectedContainers.length; i++) {
                            // If a selected container link does not exist yet, we create it now
                            if (nginxDockerLinks.find(ndl => ndl.containerId == this.state._selectedContainers[i]) == null) {
                                let nginxDockerLink = await API.endpoints.NginxDockerLinks.create({
                                    containerId: this.state._selectedContainers[i],
                                    nginxConfigId: this.state._id
                                });

                                this.props.dispatch({
                                    type: "ADD_NGINX_DOCKER_LINKS",
                                    data: [nginxDockerLink]
                                });
                            }
                        }

                        // Update local store for containers
                        let containers = await API.endpoints.Containers.getAll();
                        this.props.dispatch({
                            type: "SET_CONTAINERS",
                            data: containers
                        });

                        // Update local store for nginx configs
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
        // Confirm delete
        confirmAlert({
            title: null,
            message: 'Are you sure you want to delete this?',
            buttons: [
                {
                    label: 'Yes',
                    onClick: async () => {
                        try {
                            // Update containers links first
                            let cUpdated = false;
                            for (let i = 0; i < this.props.nginxDockerLinks.length; i++) {
                                if (this.props.nginxDockerLinks[i].nginxConfigId == this.state._id) {
                                    await API.endpoints.NginxDockerLinks.deleteById(this.props.nginxDockerLinks[i].id);
                                    cUpdated = true;
                                }
                            }

                            if (cUpdated) {
                                let nginxDockerLinks = await API.endpoints.NginxDockerLinks.getAll();
                                this.props.dispatch({
                                    type: "SET_NGINX_DOCKER_LINKS",
                                    data: nginxDockerLinks
                                });
                            }

                            // Now delete config
                            await API.endpoints.NginxConfigs.deleteById(this.state._id);
                            this.props.dispatch({
                                type: this.SET_DATA_REDUCER_ACTION,
                                data: this.props.nginxConfigs.filter(o => {
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

    /**
     * handleRowClick
     */
    handleRowClick(event, id) {
        let selectedItem = this.props.nginxConfigs.find(o => o.id === id);
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
                        this.setState({ inputDialogValue: e.target.value })
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
                            this.setState({ inputDialogValueErrors: validationErrors })
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
     * getDialogFormBlockUriPath
     */
    getDialogFormBlockUriPath() {
        return <Grid item xs={8} style={{ textAlign: 'left' }}>
            <div className={"form-group"}>
                <TextField
                    name="_uriPath"
                    className={"form-control"}
                    value={this.state._uriPath}
                    onChange={(e) => { this.setState({ _uriPath: e.target.value }) }}
                    label="URI path"
                    type="text" />
                <div className="invalid-feedback"></div>
            </div>
        </Grid>;
    }

    /**
     * getDialogFormBlockName
     */
    getDialogFormBlockName() {
        return <Grid item xs={4} style={{ textAlign: 'left' }}>
            <div className={"form-group"}>
                <TextField
                    name="_name"
                    className={"form-control"}
                    value={this.state._name}
                    onChange={(e) => { this.setState({ _name: e.target.value }) }}
                    label="Config name"
                    type="text"
                    fullWidth
                    required />
                <div className="invalid-feedback"></div>
            </div>
        </Grid>;
    }

    /**
     * getDialogFormBlockPort
     */
    getDialogFormBlockPort() {
        return <Grid item xs={4} style={{ textAlign: 'left' }}>
            <div className={"form-group"}>

                <TextField
                    name="_port"
                    className={"form-control"}
                    value={this.state._port}
                    onChange={(e) => { this.setState({ _port: e.target.value }) }}
                    label={this.state._serverTarget == 'c' ? "Container port" : "Host port"}
                    type="text"
                    fullWidth
                    autoFocus
                    required />
                <div className="invalid-feedback"></div>
            </div>
        </Grid>;
    }

    /**
     * getDialogFormBlockIsSubdomain
     */
    getDialogFormBlockIsSubdomain() {
        return <Grid item xs={4} style={{ textAlign: 'left' }}>
            <FormGroup row>
                <FormControlLabel
                    control={
                        <Switch
                            checked={this.state._asSubdomain}
                            onChange={(event) => {
                                this.setState({ _asSubdomain: event.target.checked, _subdomain: "" });
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
    getDialogFormBlockSubdomain() {
        return <Grid item xs={4} style={{ textAlign: 'left' }}>
            {this.state._asSubdomain && <div className={"form-group"}>
                <TextField
                    required
                    name="_subdomain"
                    className={"form-control"}
                    value={this.state._subdomain}
                    onChange={(e) => {
                        this.setState({ _subdomain: e.target.value });
                    }}
                    label="Subdomain"
                    type="text"
                    fullWidth />
                <div className="invalid-feedback"></div>
            </div>}
        </Grid>;
    }

    /**
     * getDialogFormBlockEnvironementVariables
     */
    getDialogFormBlockPresetParams() {
        return <Grid item xs={8} style={{ textAlign: 'left' }}>
            <div className={"form-group"} style={{ textAlign: 'left' }}>
                <FormControl fullWidth>
                    <InputLabel htmlFor="_nginxPresetParamsId">NGinx preset configuration</InputLabel>
                    <Select
                        value={this.state._nginxPresetParamsId}
                        onChange={(event) => {
                            this.setState({ [event.target.name]: event.target.value });
                        }}
                        inputProps={{
                            name: '_nginxPresetParamsId',
                            id: '_nginxPresetParamsId',
                        }}
                        fullWidth
                    >
                        <MenuItem value="">
                            <em>None</em>
                        </MenuItem>

                        {this.props.nginxPresetParams.map(psItem => (
                            <MenuItem key={"ngparam_" + psItem.id} value={psItem.id}>{psItem.name}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </div>
        </Grid>;
    }

    /**
     * getDialogFormBlockDomain
     */
    getDialogFormBlockDomain() {
        return <Grid item xs={4} style={{ textAlign: 'left' }}>
            <div className={"form-group"} style={{ textAlign: 'left' }}>
                <FormControl fullWidth>
                    <InputLabel htmlFor="_domainId">Domain</InputLabel>
                    <Select
                        value={this.state._domainId}
                        onChange={(event) => {
                            this.setState({ [event.target.name]: event.target.value });
                        }}
                        inputProps={{
                            name: '_domainId',
                            id: '_domainId',
                        }}
                        fullWidth
                    >
                        <MenuItem value="">
                            <em>None</em>
                        </MenuItem>

                        {this.props.domains.map(domain => (
                            <MenuItem key={"domain_" + domain.id} value={domain.id}>{domain.value}</MenuItem>
                        ))}
                    </Select>
                    <div className="invalid-feedback"></div>
                </FormControl>
            </div>
        </Grid>;
    }

    /**
     * getDialogFormBlockBasicAuth
     */
    getDialogFormBlockBasicAuth() {
        return <Grid item xs={4} style={{ textAlign: 'left' }}>
            <div className={"form-group"} style={{ textAlign: 'left' }}>
                <FormControl fullWidth>
                    <InputLabel htmlFor="_basicAuthId">Basic Auth User</InputLabel>
                    <Select
                        value={this.state._basicAuthId}
                        onChange={(event) => {
                            this.setState({ [event.target.name]: event.target.value });
                        }}
                        inputProps={{
                            name: '_basicAuthId',
                            id: '_basicAuthId',
                        }}
                        fullWidth
                    >
                        <MenuItem value="">
                            <em>None</em>
                        </MenuItem>

                        {this.props.basicAuth.map(basicAuth => (
                            <MenuItem key={"basicAuth_" + basicAuth.id} value={basicAuth.id}>{basicAuth.username}</MenuItem>
                        ))}
                    </Select>
                    <div className="invalid-feedback"></div>
                </FormControl>
            </div>
        </Grid>;
    }

    /**
     * getDialogFormBlockServerType
     */
    getDialogFormBlockServerTarget() {
        return <Grid item xs={4} style={{ textAlign: 'left' }}>
            <div className={"form-group"} style={{ textAlign: 'left' }}>
                <FormControl fullWidth>
                    <InputLabel htmlFor="_serverTarget">Target server type</InputLabel>
                    <Select
                        required
                        value={this.state._serverTarget}
                        onChange={(event) => {
                            let stateUpd = { [event.target.name]: event.target.value };
                            if (event.target.value != 'c') {
                                stateUpd._selectedContainers = [];
                            }
                            if (event.target.value != 'e') {
                                stateUpd._port = "";
                            }
                            this.setState(stateUpd);
                        }}
                        inputProps={{
                            name: '_serverTarget',
                            id: '_serverTarget',
                        }}
                        fullWidth
                    >
                        <MenuItem key="serverTarget_c" value="c">Container</MenuItem>
                        <MenuItem key="serverTarget_h" value="h">Host</MenuItem>
                        <MenuItem key="serverTarget_e" value="e">External</MenuItem>
                    </Select>
                    <div className="invalid-feedback"></div>
                </FormControl>
            </div>
        </Grid>;
    }

    /**
     * getDialogFormBlockContainers
     */
    getDialogFormBlockContainers() {
        return <Grid item xs={4} style={{ textAlign: 'left' }}>
            {this.state._serverTarget == 'c' && <div className={"form-group"} style={{ textAlign: 'left' }}>
                <FormControl fullWidth>
                    <InputLabel htmlFor="_selectedContainers">Containers</InputLabel>
                    <Select
                        required
                        multiple
                        value={this.state._selectedContainers}
                        onChange={(event) => {
                            this.setState({ _selectedContainers: event.target.value });
                        }}
                        renderValue={selected => this.props.containers.filter(n => selected.indexOf(n.id) > -1).map(n => n.name).join(', ')}
                        inputProps={{
                            name: '_selectedContainers',
                            id: '_selectedContainers',
                        }}
                        MenuProps={MenuProps}
                        fullWidth
                    >
                        {this.props.containers.map((c) => {
                            // if (!c.nginxConfigId || c.nginxConfigId == this.state._id) {
                            return <MenuItem key={c.name} value={c.id}>
                                <Checkbox checked={this.props.containers.filter(n => this.state._selectedContainers.indexOf(n.id) > -1).map(n => n.name).indexOf(c.name) > -1} />
                                <ListItemText primary={c.name} />
                            </MenuItem>;
                            // } else {
                            //     return null;
                            // }
                        })}
                    </Select>
                    <div className="invalid-feedback"></div>
                </FormControl>
            </div>}

            {this.state._serverTarget == 'e' && <div className={"form-group"} style={{ textAlign: 'left' }}>
                <TextField
                    required
                    name="_proxyPath"
                    className={"form-control"}
                    value={this.state._proxyPath}
                    onChange={(e) => {
                        this.setState({ _proxyPath: e.target.value });
                    }}
                    label="Proxy path"
                    type="text"
                    fullWidth />
                <div className="invalid-feedback"></div>
            </div>}

        </Grid>;
    }

    /**
     * getDialogFormBlockProxyTarget
     */
    getDialogFormBlockProxyTarget() {
        return <Grid item xs={8} style={{ textAlign: 'left' }}>
            <div className={"form-group"} style={{ textAlign: 'left' }}>
                <TextField
                    required
                    name="_proxyPath"
                    className={"form-control"}
                    value={this.state._proxyPath}
                    onChange={(e) => {
                        this.setState({ _proxyPath: e.target.value });
                    }}
                    label="Proxy path"
                    type="text"
                    fullWidth />
                <div className="invalid-feedback"></div>
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
                <div className={classes.tableTitleDiv}>Nginx configuration</div>
                <Divider variant="middle" style={{ marginLeft: 0, marginRight: 0, marginTop: 0, marginBottom: 20 }} />
                <Button variant="contained" color="primary" style={{ textTransform: "none", position: 'absolute', right: 10, top: 10 }} onClick={
                    this.setSelected.bind(this, "ADD", {})
                }>New</Button>
                <Table className={classes.table}>
                    {tblHeader && <TableHead>
                        {tblHeader}
                    </TableHead>}
                    <TableBody>
                        {this.props.nginxConfigs.map(row => {
                            let cellClasses = [classes.tableCell];
                            cellClasses = cellClasses.join(' ');
                            return this.tableRow(cellClasses, (this.state.selected && this.state.selected.id === row.id), this.state._id ? this.state._id : null, row);
                        })}
                        {this.props.nginxConfigs.length == 0 && <TableRow>
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
                                {this.state.mode === "EDIT" ? "Edit" : "Add"} Nginx configuration
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
                                    {this.getDialogFormBlockUriPath()}
                                    {this.getDialogFormBlockIsSubdomain()}
                                    {this.getDialogFormBlockSubdomain()}
                                    {this.getDialogFormBlockDomain()}
                                    {this.getDialogFormBlockBasicAuth()}
                                    {this.getDialogFormBlockServerTarget()}
                                    {this.state._serverTarget == 'c' && this.getDialogFormBlockContainers()}
                                    {this.state._serverTarget != 'e' && this.getDialogFormBlockPort()}
                                    {this.state._serverTarget == 'e' && this.getDialogFormBlockProxyTarget()}
                                    {this.getDialogFormBlockPresetParams()}
                                </Grid>
                            </div>
                        </ValidatorForm>}
                    </div>
                </Dialog>
            </Paper>
        );
    }
}

// The function takes data from the app current state,
// and insert/links it into the props of our component.
// This function makes Redux know that this component needs to be passed a piece of the state
const mapStateToProps = (state, props) => ({
    nginxConfigs: state.nginxConfigs,
    containers: state.containers,
    domains: state.domains,
    basicAuth: state.basicAuth,
    nginxPresetParams: state.nginxPresetParams,
    nginxDockerLinks: state.nginxDockerLinks
});

const mapDispatchToProps = (dispatch) => ({ "dispatch": dispatch });

//Connect everything
export default connect(mapStateToProps, mapDispatchToProps)(withStyles(styles)(NginxPresetsTable));