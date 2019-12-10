import React from 'react';
import { connect } from 'react-redux';
import { withStyles } from '@material-ui/core/styles';
import {
    Paper,
    Grid,
    Button,
    TextField,
    Divider,
    ListItemText,
    List,
    ListItem,
    ListSubheader,
    ListItemSecondaryAction,
    Dialog,
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
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import CloseIcon from '@material-ui/icons/Close';
import Slide from '@material-ui/core/Slide';
import ValidatorForm from "../ValidationForm/index";
import API from "../../../services/API";
import styles from './styles.js';
import { confirmAlert } from '../Dialogs/AlertDialog';
import CheckIcon from '@material-ui/icons/CheckCircleOutline';
import DeleteIcon from '@material-ui/icons/Delete';

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
    SET_DATA_REDUCER_ACTION = "SET_NGINX_PRESET_PARAMS";
    tableRow(cellClasses, isSelected, selectedId, row) {
        return <TableRow hover key={row.id}
            className={isSelected ? "" : "hoverPointer"}
            onClick={event => this.handleRowClick(event, row.id)}
            selected={selectedId && selectedId === row.id}>

            <TableCell className={cellClasses}>{row.name}</TableCell>
        </TableRow>;
    }
    populateEditorFormFromObject(selected) {
        return {
            _id: selected && selected.id ? selected.id : null,
            _name: selected && selected.name ? selected.name : "",
            _list: selected && selected.list ? selected.list : [],
        }
    }
    populateSelected(state) {
        return {
            name: state._name,
            list: state._list
        }
    }
    tableHeader() {
        // return <TableRow>
        //     <TableCell>Name</TableCell>
        // </TableRow>;
        return null;
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
                if (this.props.nginxPresetParams.find(o => (!this.state._id || o.id != this.state._id) && o.name.toLowerCase() == this.state._name.toLowerCase())) {
                    return this.props.notify("Conflict: nginx preset params name already in use.", "error");
                }

                let modelObject = this.populateSelected(this.state);

                try {
                    if (this.state.mode === "ADD") {
                        let dbResult = await API.endpoints.NginxPresetParams.create(modelObject);
                        this.props.dispatch({
                            type: this.SET_DATA_REDUCER_ACTION,
                            data: [...this.props.nginxPresetParams, dbResult]
                        });
                    } else {
                        modelObject.id = this.state._id;
                        let dbResult = await API.endpoints.NginxPresetParams.update(modelObject);
                        let updData = this.props.nginxPresetParams.map(o => {
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
        if (this.props.nginxConfigs.find(o => o.nginxPresetParamsId && o.nginxPresetParamsId == this.state._id)) {
            this.props.notify(`Conflict: Cannot delete because there is at least one nginx config that uses this preset params.`, "error");
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
                                await API.endpoints.NginxPresetParams.deleteById(this.state._id);

                                this.props.dispatch({
                                    type: this.SET_DATA_REDUCER_ACTION,
                                    data: this.props.nginxPresetParams.filter(o => {
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
        let selectedItem = this.props.nginxPresetParams.find(o => o.id === id);
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
     * getDialogFormBlockName
     */
    getDialogFormBlockName() {
        return <Grid item xs={12} style={{ textAlign: 'left' }}>
            <div className={"form-group"}>
                <TextField
                    name="name"
                    className={"form-control"}
                    value={this.state._name}
                    onChange={(e) => { this.setState({ _name: e.target.value }) }}
                    label="Identifier name"
                    type="text"
                    fullWidth
                    autoFocus
                    required />
                <div className="invalid-feedback"></div>
            </div>
        </Grid>;
    }

    /**
     * getDialogFormBlockEnvironementVariables
     */
    getDialogFormBlockParamssList() {
        return <Grid item xs={12} style={{ textAlign: 'left' }}>
            <div className={"form-group"} style={{ textAlign: 'left' }}>
                <Grid container>
                    <Grid item xs={6} style={{ textAlign: 'left' }}>
                        <ListSubheader component="div">Nginx block params</ListSubheader>
                    </Grid>
                    <Grid item xs={6} style={{ textAlign: 'right' }}>
                        <Button color="primary" style={{ marginTop: 8 }} onClick={(e) => {
                            this.setState({
                                inputDialogOpen: true,
                                inputDialogValue: "",
                                inputDialogValueErrors: null,
                                inputDialogTarget: "list",
                                inputDialogLabel: "Nginx block params",
                                inputDialogKey: null
                            });
                        }}>Add param line</Button>
                    </Grid>
                </Grid>
                <List dense={false} >
                    {this.state._list.map((en, i) =>
                        <ListItem key={"blockparam_" + i} button onClick={function (value, index) {
                            this.setState({
                                inputDialogOpen: true,
                                inputDialogValue: value,
                                inputDialogValueErrors: null,
                                inputDialogTarget: "list",
                                inputDialogLabel: "Nginx block params",
                                inputDialogKey: index
                            });
                        }.bind(this, en, i)}>
                            <CheckIcon />
                            <ListItemText
                                primary={en}
                                secondary={null}
                            />
                            <ListItemSecondaryAction onClick={function (index) {
                                this.state._list.splice(index, 1);
                                this.setState({
                                    _list: this.state._list
                                });
                            }.bind(this, i)}>
                                <IconButton aria-label="Delete">
                                    <DeleteIcon />
                                </IconButton>
                            </ListItemSecondaryAction>
                        </ListItem>
                    )}
                    {this.state._list.length == 0 && <Typography variant="caption" className={this.props.classes.emptyDialogLine}>-none-</Typography>}
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
                <div className={classes.tableTitleDiv}>Config preset parameters</div>
                <Divider variant="middle" style={{ marginLeft: 0, marginRight: 0, marginTop: 0, marginBottom: 20 }} />
                <Button variant="contained" color="primary" style={{ textTransform: "none", position: 'absolute', right: 10, top: 10 }} onClick={this.setSelected.bind(this, "ADD", {})}>New</Button>
                <Table className={classes.table}>
                    {tblHeader && <TableHead>
                        {tblHeader}
                    </TableHead>}
                    <TableBody>
                        {this.props.nginxPresetParams.map(row => {
                            let cellClasses = [classes.tableCell];
                            cellClasses = cellClasses.join(' ');
                            return this.tableRow(cellClasses, (this.state.selected && this.state.selected.id === row.id), this.state._id ? this.state._id : null, row);
                        })}
                        {this.props.nginxPresetParams.length == 0 && <TableRow>
                            <TableCell style={{ textAlign: 'center' }}>
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
                                {this.state.mode === "EDIT" ? "Edit" : "Add"} params
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
                                    {this.getDialogFormBlockParamssList()}
                                </Grid>
                            </div>
                        </ValidatorForm>}
                    </div>
                </Dialog>
                {this.stringEditorDialog(null, (action) => {
                    switch (action + "_" + this.state.inputDialogTarget) {
                        case "SAVE_list":
                            if (this.state.inputDialogKey != null) {
                                this.state._list[this.state.inputDialogKey] = this.state.inputDialogValue;
                                this.setState({
                                    _list: this.state._list
                                });
                            } else {
                                this.state._list.push(this.state.inputDialogValue);
                                this.setState({
                                    _list: this.state._list
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
                        case "list":
                            if (value.length == 0) {
                                return ["Required"];
                            }
                            return null;
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
    nginxPresetParams: state.nginxPresetParams,
    nginxConfigs: state.nginxConfigs,
});

const mapDispatchToProps = (dispatch) => ({ "dispatch": dispatch });

//Connect everything
export default connect(mapStateToProps, mapDispatchToProps)(withStyles(styles)(NginxPresetsTable));