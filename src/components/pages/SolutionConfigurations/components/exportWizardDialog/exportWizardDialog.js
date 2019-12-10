import React from 'react';
import { connect } from 'react-redux';
import ReactDOM from 'react-dom'
import { withStyles } from '@material-ui/core/styles';
import styles from '../styles.js';
import API from "../../../../../services/API";
import CloudUploadIcon from '@material-ui/icons/CloudUpload';
import CloseIcon from '@material-ui/icons/Close';
import IconButton from '@material-ui/core/IconButton';
import Divider from '@material-ui/core/Divider';
import FormGroup from '@material-ui/core/FormGroup';
import Checkbox from '@material-ui/core/Checkbox';
import CheckBoxOutlineBlankIcon from '@material-ui/icons/CheckBoxOutlineBlank';
import CheckBoxIcon from '@material-ui/icons/CheckBox';

import {
    Grid,
    Button,
    FormControlLabel,
    Switch,
    Typography,
    Dialog,
    DialogContent,
    DialogContentText,
    AppBar,
    Toolbar
} from '@material-ui/core';

class ExportWizardDialog extends React.Component {

    /**
     * constructor
     * @param {*} props 
     */
    constructor(props) {
        super(props);

        this.state = {
            solution: null,
            solutionParameters: []
        }
    }

    /**
     * componentDidMount
     */
    componentDidMount() {
        let stateObj = {
            solution: this.props.solutions.find(s => s.id == this.props.solutionId)
        };

        stateObj.solutionParameters = this.props.solutionParameters.filter(sp => sp.solutionId == this.props.solutionId);
        stateObj.solutionParameters.forEach(sp => {
            // let container = this.props.containers.find(c => c.id == sp.containerId);
            stateObj['public_di_hub_' + sp.containerId] = true;
            stateObj['public_di_zip_' + sp.containerId] = null;
        });

        this.setState(stateObj);
    }

    /**
     * openFileDialog
     * @param {*} refName 
     */
    openFileDialog(refName) {
        var fileInputDom = ReactDOM.findDOMNode(this.refs[refName]);
        fileInputDom.click()
    }

    /**
     * handlePublicImageSwitchChange
     */
    handlePublicImageSwitchChange = cid => event => {
        this.setState({
            ['public_di_hub_' + cid]: event.target.checked,
            ['public_di_zip_' + cid]: null
        });
    };

    /**
     * handleDockerfileZipSelected
     * @param {*} cid
     * @param {*} event 
     */
    handleDockerfileZipSelected(cid, event) {
        if (event.target.files && event.target.files.length == 1) {
            if (event.target.files[0].type != "application/zip") {
                return this.props.notify("Invalide file format, expected a ZIP file", "error");
            }
            this.setState({ ['public_di_zip_' + cid]: event.target.files[0] });
        }
    }

    /**
     * exportNow
     */
    async exportNow() {
        // Prepare form data
        const data = new FormData();
        for (let key in this.state) {
            if (key.indexOf('public_di_zip_') == 0) {
                data.append(key, this.state[key]);
            }
        }

        try {
            // Upload
            let response = await API.endpoints.Solutions.solutionExport(this.props.solutionId, data);

            // Get return solution blob file
            let blob = await response.blob();

            // Let user download it
            var url = window.URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url;
            a.download = "solution.zip";
            document.body.appendChild(a);
            a.click();
            a.remove();
        } catch (err) {
            this.props.notify(err.message, "error");
        }
    }

    /**
     * render
     */
    render() {
        const { classes } = this.props;

        let allValide = true;
        this.state.solutionParameters.forEach(sp => {
            if (!this.state['public_di_hub_' + sp.containerId] && !this.state['public_di_zip_' + sp.containerId]) {
                allValide = false;
            }
        });

        return (
            <Dialog
                open={true}
                onClose={this.props.onDialogClose}
                aria-labelledby="form-dialog-title"
            >
                <AppBar className={classes.appBar}>
                    <Toolbar>
                        <IconButton color="inherit" onClick={this.props.onDialogClose} aria-label="Close">
                            <CloseIcon />
                        </IconButton>
                        <Typography variant="h6" color="inherit" className={classes.flex}>
                            Export solution
                        </Typography>
                        {allValide && <Button color="secondary" onClick={this.exportNow.bind(this)}>
                            Export now
                        </Button>
                        }
                    </Toolbar>
                </AppBar>

                <DialogContent>
                    <DialogContentText style={{ marginTop: 20 }}>
                        If one or more containers are not available on the public Docker Hub, therefore requiering a Docker image to be build locally on the target machine, then upload the required dockerfile and it's dependencies as a zip file for each docker container of your solution.
                    </DialogContentText>

                    {this.state.solutionParameters.map(sp => {
                        let container = this.props.containers.find(c => c.id == sp.containerId);

                        let image = this.props.dockerImages.find(i => i.id == container.dockerImageId);

                        return <div key={'container_i_' + sp.id}>
                            <Grid container spacing={16} style={{ padding: 20/*, height: 112*/ }}>
                                <Grid item xs={this.state['public_di_hub_' + sp.containerId] ? 7 : 4} style={{ textAlign: 'left' }}>
                                    <Typography variant="subtitle2" gutterBottom style={{ marginTop: 17 }}>
                                        {container.name}
                                    </Typography>
                                    <Typography variant="caption" gutterBottom style={{ marginTop: 0 }}>
                                        IMAGE => {image.name + (image.version && image.version.length > 0 ? ":" + image.version : "")}
                                    </Typography>
                                </Grid>

                                {!this.state['public_di_hub_' + sp.containerId] && <Grid item xs={3} style={{ textAlign: 'right' }}>
                                    <input
                                        accept="application/zip"
                                        style={{ display: 'none' }}
                                        type="file"
                                        ref={'dockerfile_c_' + sp.containerId}
                                        onChange={this.handleDockerfileZipSelected.bind(this, sp.containerId)}
                                    />
                                    <label htmlFor="raised-button-file">
                                        <Button variant="contained" color={this.state['public_di_zip_' + sp.containerId] ? 'primary' : 'default'} className={classes.uploadButton} onClick={this.openFileDialog.bind(this, 'dockerfile_c_' + sp.containerId)}>
                                            {this.state['public_di_zip_' + sp.containerId] ? 'SELECTED' : 'SELECT'}
                                            <CloudUploadIcon className={classes.rightButtonIcon} />
                                        </Button>
                                    </label>
                                </Grid>}

                                <Grid item xs={5} style={{ textAlign: 'right' }}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={this.state['public_di_hub_' + sp.containerId]}
                                                onChange={this.handlePublicImageSwitchChange(sp.containerId)}
                                                value={"public_di_hub_" + sp.containerId}
                                                color="primary"
                                            />
                                        }
                                        label="On Docker HUB"
                                    /><br />
                                </Grid>
                                {/* {sp.volumes.map(v => {
                                    let vs = container.volumes.find(_v => _v.containerPath == v.path);
                                    // console.log(v.containerPath);
                                    return <Grid container spacing={16}>
                                        <Grid item xs={6}>
                                            <Typography variant="subtitle1">
                                                {vs.containerPath}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={6} style={{ textAlign: 'right' }}>
                                            <FormControlLabel
                                                control={
                                                    <Checkbox
                                                        checked={true}
                                                        style={{ padding: 0 }}
                                                    // onChange={this.handleChange('checkedA')}
                                                    />
                                                }
                                                label="Include content"
                                            />
                                        </Grid>

                                    </Grid>;
                                })} */}

                            </Grid>
                            <Divider />
                        </div>
                    })}
                </DialogContent>
            </Dialog>
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
    dockerImages: state.dockerImages,
    nginxConfigs: state.nginxConfigs,
    solutions: state.solutions,
    solutionParameters: state.solutionParameters,
    nginxDockerLinks: state.nginxDockerLinks
});

const mapDispatchToProps = (dispatch) => ({ "dispatch": dispatch });

//Connect everything
export default connect(mapStateToProps, mapDispatchToProps)(withStyles(styles)(ExportWizardDialog));