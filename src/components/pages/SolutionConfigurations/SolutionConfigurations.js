import React from 'react';
import { connect } from 'react-redux';
import { Redirect } from 'react-router-dom';
import ReactDOM from 'react-dom'
import { withStyles } from '@material-ui/core/styles';
import styles from '../styles.js';
import SharableView from '../../elements/SharableView/index';
import LoadingIndicator from "../../elements/LoadingIndicator/index";
import API from "../../../services/API";
import SocketPubSub from '../../../services/sockerPubSub';
import StoreHelper from '../../../lib/StoreHelper/loadData';
import AlertSnackbars from '../../elements/AlertBar/index';
import { confirmAlert } from '../../elements/Dialogs/AlertDialog';

import {
    Button,
    Paper,
    Grid,
    Menu,
    Snackbar,
    MenuList,
    MenuItem,
    ListItemIcon,
    ListItemText,
    Typography,
    Divider,
    Dialog,
    DialogContent,
    DialogContentText,
    TextField,
    DialogActions
} from '@material-ui/core';

import ConfigIcon from '@material-ui/icons/DonutLarge';
import NewIcon from '@material-ui/icons/CreateNewFolderOutlined';
import ImportIcon from '@material-ui/icons/ImportExport';
import SolutionEditor from './components/solutionEditor/solutionEditor';
import ExportWizardDialog from './components/exportWizardDialog/exportWizardDialog';

let isProd = require('../../../env.json').environment === 'prod';

let SAFE_STRING_REGEX = /([^A-Za-z0-9_]+)/;

class SolutionPage extends React.Component {
    sharedView = null

    /**
     * constructor
     * @param {*} props 
     */
    constructor(props) {
        super(props);

        this.state = {
            newSolutionAnchorEl: null,

            // loading: false
            snackOpen: false,
            snackMessage: "",
            snackVariant: null,
            aliasInputDialogOpen: false,
            selectedSolutionId: null,
            selectedSolutionAlias: null,
            aliasInputDialogValue: "",
            aliasInputDialogValueErrors: null,

            loading: false,
            loadingMessage: null,

            exportSolutionWizard: false
        };
    }

    /**
     * componentDidMount
     */
    componentDidMount() {
        SocketPubSub.on("importStatus", (data) => {
            if (data.status == "done") {
                (async () => {
                    await StoreHelper.reloadCoreData(this.props.dispatch);

                    this.setState({
                        "loading": false,
                        "loadingMessage": null
                    });

                    if (data.hasSubdomains) {
                        this.openSnack(["Solution imported.", "WARNING: One or more Ndginx configurations have a subdomain configured. You will have to specify a domain for those configurations before deploying the solution."], "warning");
                    } else {
                        this.openSnack("Solution imported.");
                    }
                })();
            } else if (data.status == "message") {
                this.setState({
                    "loadingMessage": data.message
                });
            } else if (data.status == "error") {
                this.setState({
                    "loading": false,
                    "loadingMessage": null
                });
                this.openSnack("An error occured, the solution could not be imported", "error");
            }
        });
    }

    /**
	 *componentWillUnmount
	 */
    componentWillUnmount() {
        SocketPubSub.off("importStatus");
    }

    /**
     * openSnack
     * @param {*} message 
     * @param {*} variant 
     */
    openSnack(message, variant) {
        this.setState({ snackOpen: true, snackMessage: message, snackVariant: variant ? variant : "success" });
    }

    /**
     * handleSnackClose
     */
    handleSnackClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }

        this.setState({ snackOpen: false });
    };

    /**
     * handleSolutionMenuClick
     */
    handleSolutionMenuClick = id => {
        // There is always an ID here, this logic is only there to reset the component for the new solution id object
        if (this.state.selectedSolutionId == id) {
            return;
        }

        if (this.state.selectedSolutionId === null) {
            this.setState({ selectedSolutionId: id, selectedSolutionAlias: null });
        } else {
            this.setState({
                loading: true,
                loadingMessage: null,
                selectedSolutionId: null,
                selectedSolutionAlias: null
            });
            setTimeout(() => {
                this.setState({
                    selectedSolutionId: id,
                    loading: false,
                    loadingMessage: null
                });
            }, 500);
        }
    };

    /**
     * renderSolutionEditor
     */
    renderSolutionEditor() {
        if (this.state.selectedSolutionId === null) {
            return null;
        }
        let solution = null;
        if (this.state.selectedSolutionId != -1) {
            solution = this.props.solutions.find(s => s.id == this.state.selectedSolutionId);
        }

        return <SolutionEditor
            solution={solution}
            alias={solution ? solution.alias : this.state.selectedSolutionAlias}
            notify={this.openSnack.bind(this)}
            onDeleteSolution={this.deleteSolution.bind(this)}
            exportSolution={this.exportSolution.bind(this)}
            solutionSaved={this.afterSolutionSaved.bind(this)} />;
    }

    /**
     * deleteSolution
     */
    async deleteSolution() {
        // Confirm delete
        confirmAlert({
            title: null,
            message: 'Are you sure you want to delete this solution?',
            buttons: [
                {
                    label: 'Yes',
                    onClick: async () => {
                        let sid = this.state.selectedSolutionId;
                        this.setState({
                            selectedSolutionId: null
                        });

                        let solutionLinks = this.props.solutionParameters.filter(ndl => ndl.solutionId == sid);
                        for (let i = 0; i < solutionLinks.length; i++) {
                            await API.endpoints.SolutionParameters.deleteById(solutionLinks[i].id);
                            this.props.dispatch({
                                type: "DELETE_SOLUTION_PARAMETER",
                                data: solutionLinks[i].id
                            });
                        }

                        await API.endpoints.Solutions.deleteById(sid);
                        this.props.dispatch({
                            type: "DELETE_SOLUTION",
                            data: sid
                        });

                        this.openSnack("Solution deleted");
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
     * afterSolutionSaved
     */
    afterSolutionSaved(solutionId) {
        this.setState({
            selectedSolutionId: solutionId
        });
    }

    /**
     * handleNewSolutionClick
     * @param {*} event
     */
    handleNewSolutionClick(event) {
        this.setState({ newSolutionAnchorEl: event.currentTarget });
    }

    /**
     * handleNewSolutionClose
     */
    handleNewSolutionClose = (targetSelect) => {
        if (targetSelect == 'blank') {
            this.setState({
                loading: true,
                loadingMessage: null,
                newSolutionAnchorEl: null,
                aliasInputDialogValueErrors: null,
                selectedSolutionId: null,
                selectedSolutionAlias: null,
                aliasInputDialogValue: "",
                targetSelect: 'blank'
            });

            // Wait 500 millis to flush out container, so that a new instance get's created
            setTimeout(() => {
                this.setState({
                    selectedSolutionId: -1,
                    loading: false,
                    loadingMessage: null
                });
            }, 500);
        } else if (targetSelect == 'template') {
            this.setState({
                newSolutionAnchorEl: null,
                aliasInputDialogOpen: true,
                aliasInputDialogValue: "",
                aliasInputDialogValueErrors: null,
                targetSelect: 'template'
            });
        } else {
            this.setState({
                newSolutionAnchorEl: null,
                aliasInputDialogOpen: false
            });
        }
    };

    /**
     * getAliasEditorDialog
     */
    getAliasEditorDialog() {
        return <Dialog
            open={this.state.aliasInputDialogOpen}
            // onClose={this.setState({ aliasInputDialogOpen: false })}
            aria-labelledby="alias-form-dialog-title"
        >
            <DialogContent>
                <Typography color="textSecondary">
                    Specify an alias to avoid overwriting existing elements in your environement in case the solution uses similar names.
                </Typography>

                <Divider variant="middle" style={{ marginLeft: 0, marginRight: 0, marginTop: 20, marginBottom: 20 }} />

                <DialogContentText>Solution alias name</DialogContentText>
                <TextField
                    autoFocus
                    margin="dense"
                    type="text"
                    value={this.state.aliasInputDialogValue}
                    fullWidth
                    onChange={(e) => {
                        this.setState({ aliasInputDialogValue: e.target.value.toLowerCase() })
                    }}
                />
                {this.state.aliasInputDialogValueErrors && this.state.aliasInputDialogValueErrors.map((error, i) => <div key={"err_" + i} style={{
                    color: "red",
                    fontSize: 12
                }}>{error}</div>)}
            </DialogContent>
            <DialogActions>
                <Button onClick={() => this.setState({ aliasInputDialogOpen: false })} color="primary">
                    Cancel
                </Button>
                <Button onClick={() => {
                    if (this.state.aliasInputDialogValue.length == 0) {
                        this.setState({
                            aliasInputDialogValueErrors: ["Required value"]
                        });
                    } else if (SAFE_STRING_REGEX.exec(this.state.aliasInputDialogValue)) {
                        this.setState({
                            aliasInputDialogValueErrors: ["Error: alias must contain only letters, numbers or underscore."]
                        });
                    }
                    else if (this.props.solutions.find(solution => solution.alias && solution.alias.toLowerCase() == this.state.aliasInputDialogValue.toLowerCase())) {
                        this.setState({
                            aliasInputDialogValueErrors: ["Alias name already in use"]
                        });
                    }
                    else {
                        this.openImportSolutionFileDialog();
                    }
                }} color="secondary">
                    Select ZIP
                </Button>
            </DialogActions>
        </Dialog>;
    }

    /**
     * exportSolution
     */
    exportSolution() {
        this.setState({ exportSolutionWizard: true });
    }

    /**
     * onSolutionExportDialogClose
     */
    onSolutionExportDialogClose() {
        this.setState({ exportSolutionWizard: false });
    }

    /**
     * openImportSolutionFileDialog
     */
    openImportSolutionFileDialog() {
        var fileInputDom = ReactDOM.findDOMNode(this.refs.import_input);
        fileInputDom.value = '';
        fileInputDom.click()
    }

    /**
     * handleImportSolutionSelect
     * @param {*} event 
     */
    async handleImportSolutionSelect(event) {
        if (event.target.files && event.target.files.length == 1) {

            // Prepare form data
            const data = new FormData();
            data.append(this.state.aliasInputDialogValue, event.target.files[0]);

            this.setState({
                "loading": true,
                "loadingMessage": "Importing..."
            });

            // Upload solution files and prepare import artefacts
            let response = await API.endpoints.Solutions.solutionImport(data);
            if (response.data.success) {
                try {
                    this.setState({
                        "newSolutionAnchorEl": null,
                        "aliasInputDialogOpen": false
                    });
                    // Now start the import process using SocketIO. 
                    // This involves building images, therefore it can take quiet a long time
                    SocketPubSub.socket.emit('importSolution', {
                        "uid": this.props.userSession.userId,
                        "containerBuildDirs": response.data.containerBuildDirs,
                        "solutionJsonFilePath": response.data.solutionJsonFilePath,
                        "alias": this.state.aliasInputDialogValue
                    });
                } catch (err) {
                    this.setState({
                        "loading": false,
                        "loadingMessage": null,
                        "newSolutionAnchorEl": null,
                        "aliasInputDialogOpen": false
                    });
                    this.openSnack("An error occured, could not import configuration", "error");
                }
            } else {
                this.setState({
                    "loading": false,
                    "loadingMessage": null,
                    "newSolutionAnchorEl": null,
                    "aliasInputDialogOpen": false
                });

                if (response.data.error) {
                    this.openSnack("Error occured: " + response.data.error, "error");
                } else {
                    this.openSnack(response.data.message);
                }
            }
        }
    }

    /**
     * render
     */
    render() {
        // If loged in, redirect to boardingpass page
        if (!this.props.userSession.token) {
            return <Redirect to='/login' />
        }

        const { newSolutionAnchorEl } = this.state;
        const { classes } = this.props;

        let emptyState = {};
        if (isProd) {
            emptyState.backgroundImage = 'url(/psh-admin/docker_nginx.png)';
        } else {
            emptyState.backgroundImage = 'url(/docker_nginx.png)';
        }

        return (
            <SharableView
                ref={(el) => this.sharedView = el}
                history={this.props.history}
                pageIndex={0}
                notify={this.openSnack.bind(this)}
            >
                {/* Display editor */}
                {/* {!this.state.loading &&  */}
                <Grid item xs={12}>
                    <Paper className={classes.configPaper}>
                        <Grid container spacing={16}>
                            {/* Table List */}
                            <Grid item xs={3}>

                                <Grid container spacing={16}>
                                    <Grid item xs={12}>
                                        <Button
                                            variant="contained"
                                            fullWidth
                                            aria-owns={newSolutionAnchorEl ? 'simple-menu' : undefined}
                                            aria-haspopup="true"
                                            onClick={this.handleNewSolutionClick.bind(this)}>New solution</Button>
                                        <Menu
                                            id="simple-menu-new-solution"
                                            anchorEl={newSolutionAnchorEl}
                                            open={Boolean(newSolutionAnchorEl)}
                                            onClose={this.handleNewSolutionClose.bind(this)}
                                        >
                                            <MenuItem onClick={this.handleNewSolutionClose.bind(this, 'blank')}>
                                                <ListItemIcon className={classes.icon}>
                                                    <NewIcon />
                                                </ListItemIcon>
                                                <ListItemText inset primary="From scratch" />
                                            </MenuItem>
                                            <MenuItem disabled={!this.props.userSession.online} onClick={this.handleNewSolutionClose.bind(this, 'template')}>
                                                <ListItemIcon className={classes.icon}>
                                                    <ImportIcon />
                                                </ListItemIcon>
                                                <ListItemText inset primary="Import" />
                                            </MenuItem>
                                        </Menu>
                                    </Grid>
                                </Grid>
                                <Divider variant="middle" style={{ marginLeft: 0, marginRight: 0, marginTop: 10 }} />
                                <MenuList>
                                    {this.props.solutions.map(s => <MenuItem
                                        key={"solution_menu_" + s.id}
                                        className={[classes.menuItem, this.state.selectedSolutionId == s.id ? classes.menuItemSelected : null].join(' ')}
                                        onClick={this.handleSolutionMenuClick.bind(this, s.id)}>
                                        <ListItemIcon className={classes.icon}>
                                            <ConfigIcon />
                                        </ListItemIcon>
                                        <Typography variant="inherit" noWrap>
                                            {s.name}
                                        </Typography>
                                    </MenuItem>)}
                                </MenuList>
                                {this.props.solutions.length == 0 && <Typography variant="body1" style={{ textAlign: 'center' }}>-none-</Typography>}
                            </Grid>
                            <Grid item xs={9}
                                style={this.state.selectedSolutionId === null ? emptyState : {}}
                                className={[classes.viewContainer, this.state.selectedSolutionId === null ? classes.emptyView : null].join(' ')}>
                                {this.renderSolutionEditor()}
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>
                {/* } */}



                <AlertSnackbars
                    open={this.state.snackOpen}
                    handleClose={this.handleSnackClose}
                    message={this.state.snackMessage}
                    variant={this.state.snackVariant}
                />

                {this.getAliasEditorDialog()}

                <LoadingIndicator show={this.state.loading} message={this.state.loadingMessage} />

                <input
                    accept="application/zip"
                    style={{ display: 'none' }}
                    type="file"
                    ref="import_input"
                    onChange={this.handleImportSolutionSelect.bind(this)}
                />

                {this.state.exportSolutionWizard && <ExportWizardDialog solutionId={this.state.selectedSolutionId} notify={this.openSnack.bind(this)} onDialogClose={this.onSolutionExportDialogClose.bind(this)} />}
            </SharableView >
        );
    }
}

// The function takes data from the app current state,
// and insert/links it into the props of our component.
// This function makes Redux know that this component needs to be passed a piece of the state
const mapStateToProps = (state, props) => ({
    userSession: state.userSession,
    solutions: state.solutions,
    solutionParameters: state.solutionParameters,
});

const mapDispatchToProps = (dispatch) => ({ "dispatch": dispatch });

//Connect everything
export default connect(mapStateToProps, mapDispatchToProps)(withStyles(styles)(SolutionPage));