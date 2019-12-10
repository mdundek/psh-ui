import React from 'react';
import { connect } from 'react-redux';
import { withStyles } from '@material-ui/core/styles';
import { Paper, Grid, Button, TextField, Divider } from '@material-ui/core';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import LinearProgress from '@material-ui/core/LinearProgress';
import Dialog from '@material-ui/core/Dialog';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import CloseIcon from '@material-ui/icons/Close';
import Slide from '@material-ui/core/Slide';
import ValidatorForm from "../ValidationForm/index";
import API from "../../../services/API";
import styles from './styles.js';
import { confirmAlert } from '../Dialogs/AlertDialog';
import YAML from 'yaml';

function Transition(props) {
    return <Slide direction="up" {...props} />;
}

class DockerImagesTable extends React.Component {
    /**
     * constructor
     * @param {*} props 
     */
    constructor(props) {
        super(props);

        this.state = this.populateEditorFormFromObject();
        this.state.selected = null;
        this.state.mode = null;

        this.tblClickDebouncer = null;
    }

    // *****************************************************************
    SET_DATA_REDUCER_ACTION = "SET_DOCKER_IMAGES";
    tableRow(cellClasses, isSelected, selectedId, row) {
        return <TableRow hover key={row.id}
            className={isSelected ? "" : "hoverPointer"}
            onClick={event => this.handleRowClick(event, row.id)}
            selected={selectedId && selectedId === row.id}>

            <TableCell className={cellClasses}>{row.name}</TableCell>
            <TableCell className={cellClasses}>{row.version}</TableCell>
        </TableRow>;
    }
    populateEditorFormFromObject(selected) {
        return {
            _id: selected && selected.id ? selected.id : null,
            _name: selected && selected.name ? selected.name : "",
            _version: selected && selected.version ? selected.version : "",
            _template: selected && selected.template ? selected.template : ""
        }
    }
    populateSelected(state) {
        return {
            name: state._name,
            version: state._version,
            template: state._template
        }
    }
    tableHeader() {
        return this.props.dockerImages.length > 0 ? <TableRow>
            <TableCell className={this.props.classes.tableHeaderCell}>Image</TableCell>
            <TableCell className={this.props.classes.tableHeaderCell}>Version</TableCell>
        </TableRow> : null;
    }
    generateFormContent() {
        return <div className={"form-group"}>
            <Grid container spacing={16}>
                <Grid item xs={6} style={{ textAlign: 'left' }}>
                    <div className={"form-group"}>
                        <TextField
                            name="name"
                            className={"form-control"}
                            value={this.state._name}
                            onChange={(e) => { this.setState({ _name: e.target.value }) }}
                            label="Name"
                            type="text"
                            fullWidth
                            autoFocus
                            required />
                        <div className="invalid-feedback"></div>
                    </div>
                </Grid>
                <Grid item xs={6} style={{ textAlign: 'left' }}>
                    <div className={"form-group"}>
                        <TextField
                            name="version"
                            className={"form-control"}
                            value={this.state._version}
                            onChange={(e) => { this.setState({ _version: e.target.value }) }}
                            label="Version"
                            type="text"
                            fullWidth />
                        <div className="invalid-feedback"></div>
                    </div>
                </Grid>
                <Grid item xs={12} style={{ textAlign: 'left' }}>
                    <div className={"form-group"}>
                        <TextField
                            multiline
                            name="template"
                            className={"form-control"}
                            value={this.state._template}
                            onChange={(e) => { this.setState({ _template: e.target.value }) }}
                            label="Template YAML"
                            type="text"
                            fullWidth />
                        <div className="invalid-feedback"></div>
                    </div>
                </Grid>
            </Grid>
        </div>;
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
                let modelObject = this.populateSelected(this.state);

                // First, validate YAML
                if (modelObject.template && modelObject.template.length > 0) {
                    try {
                        let yamlDoc = YAML.parse(modelObject.template);
                        // console.log(JSON.stringify(yamlDoc, null, 4));
                        // console.log(Object.keys(yamlDoc));
                        // console.log(YAML.stringify(yamlDoc));
                    }
                    catch (err) {
                        return this.props.notify("YAML template contains errors", "error");
                    };
                }

                try {
                    if (this.state.mode === "ADD") {
                        let dbResult = await API.endpoints.DockerImages.create(modelObject);
                        this.props.dispatch({
                            type: this.SET_DATA_REDUCER_ACTION,
                            data: [...this.props.dockerImages, dbResult]
                        });
                    } else {
                        modelObject.id = this.state._id;
                        let dbResult = await API.endpoints.DockerImages.update(modelObject);
                        let updData = this.props.dockerImages.map(o => {
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
        if (this.props.containers.find(c => c.dockerImageId == this.state._id)) {
            return this.props.notify("Conflict: this docker image is used by at least one container configuration.", "error");
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
                                await API.endpoints.DockerImages.deleteById(this.state._id);

                                this.props.dispatch({
                                    type: this.SET_DATA_REDUCER_ACTION,
                                    data: this.props.dockerImages.filter(o => {
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
        let selectedItem = this.props.dockerImages.find(o => o.id === id);
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
     * render
     */
    render() {
        const { classes } = this.props;

        let tblHeader = this.tableHeader();
        return (
            <Paper className={classes.paper}>
                <div className={classes.tableTitleDiv}>Docker Images</div>
                <Divider variant="middle" style={{ marginLeft: 0, marginRight: 0, marginTop: 0, marginBottom: 20 }} />
                <Button variant="contained" color="primary" style={{ textTransform: "none", position: 'absolute', right: 10, top: 10 }} onClick={this.setSelected.bind(this, "ADD", {})}>New</Button>
                <Table className={classes.table}>
                    {tblHeader && <TableHead>
                        {tblHeader}
                    </TableHead>}
                    <TableBody>
                        {this.props.dockerImages.map(row => {
                            let cellClasses = [classes.tableCell];
                            cellClasses = cellClasses.join(' ');
                            return this.tableRow(cellClasses, (this.state.selected && this.state.selected.id === row.id), this.state._id ? this.state._id : null, row);
                        })}
                        {this.props.dockerImages.length == 0 && <TableRow>
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
                                {this.state.mode === "EDIT" ? "Edit" : "Add"} Docker image
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
                            {this.generateFormContent()}
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
    dockerImages: state.dockerImages,
    containers: state.containers
});

const mapDispatchToProps = (dispatch) => ({ "dispatch": dispatch });

//Connect everything
export default connect(mapStateToProps, mapDispatchToProps)(withStyles(styles)(DockerImagesTable));