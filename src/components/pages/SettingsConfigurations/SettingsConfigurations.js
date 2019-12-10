import React from 'react';
import { connect } from 'react-redux';
import { Redirect } from 'react-router-dom';
import { withStyles } from '@material-ui/core/styles';
import ValidatorForm from "../../elements/ValidationForm/index";
import LoadingIndicator from "../../elements/LoadingIndicator";
import {
    Paper,
    Grid,
    Button,
    TextField,
    Divider
} from '@material-ui/core';
import styles from '../styles.js';
import SharableView from '../../elements/SharableView/index';
import AlertSnackbars from '../../elements/AlertBar/index';
import API from "../../../services/API";

class NginxConfigurationsPage extends React.Component {
    sharedView = null

    /**
     * constructor
     * @param {*} props 
     */
    constructor(props) {
        super(props);

        this.state = {
            // loading: false
            snackOpen: false,
            snackMessage: "",
            snackVariant: null,
            _nginxConfigPath: "",
            _composeConfigPath: "",
            _defaultNginxDomain: "",
            _nginxHtpasswdDir: ""
        };
    }

    /**
     * componentDidMount
     */
    componentDidMount() {
        this.setState({
            "loading": true,
            "loadingMessage": null
        });
        setTimeout(() => {
            let stateForm = {
                "loading": false,
                "loadingMessage": null
            };
            this.props.settings.map(s => {
                stateForm["_" + s.name] = s.value;
            });
            this.setState(stateForm);
        }, 1000);
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
     * saveSettings
     */
    async saveSettings(event) {
        let isValide = this.formEl.validate();
        if (isValide) {
            this.setState({
                "loading": true,
                "loadingMessage": "Saving..."
            });
            let newSettings = [];
            for (let key in this.state) {
                if (key.indexOf("_") == 0) {
                    let name = key.substring(1);
                    let obj = {
                        "id": this.props.settings.find(s => s.name == name).id,
                        "name": name,
                        "value": this.state[key]
                    };
                    newSettings.push(obj);
                    await API.endpoints.Settings.update(obj);
                }
            }

            this.props.dispatch({
                type: "SET_SETTINGS",
                data: newSettings
            });
            this.setState({
                "loading": false,
                "loadingMessage": null
            });
            this.openSnack("Settings saved");
        }
    }

    /**
     * setting
     */
    getSettingField(setting) {
        const { literals } = this.props;
        return <Grid item xs={12} style={{ textAlign: 'left', paddingBottom: 20 }}>
            <div className={"form-group"}>
                <TextField
                    required
                    name={"_" + setting.name}
                    className={"form-control"}
                    value={this.state["_" + setting.name]}
                    onChange={(e) => {
                        let state = {};
                        state["_" + setting.name] = e.target.value;
                        this.setState(state);
                    }}
                    label={literals.settings[setting.name]}
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
        // If loged in, redirect to boardingpass page
        if (!this.props.userSession.token) {
            return <Redirect to='/login' />
        }

        const { classes } = this.props;

        this.props.settings.sort((a, b) => {
            if (a.id < b.id)
                return -1;
            if (a.id > b.id)
                return 1;
            return 0;
        });

        return (
            <SharableView
                ref={(el) => this.sharedView = el}
                history={this.props.history}
                pageIndex={3}
                notify={this.openSnack.bind(this)}
            >
                {/* {!this.state.loading &&  */}
                <Grid item xs={12}>
                    <Grid container spacing={16}>
                        <Grid item xs={12}>
                            <Paper className={classes.paper}>
                                <div className={classes.tableTitleDiv}>Settings</div>
                                <Divider variant="middle" style={{ marginLeft: 0, marginRight: 0, marginTop: 0, marginBottom: 20 }} />
                                <Button variant="contained" color="primary" style={{ textTransform: "none", position: 'absolute', right: 10, top: 10 }} onClick={this.saveSettings.bind(this)}>Save</Button>
                                <ValidatorForm ref={form => (this.formEl = form)}>
                                    <div style={{ padding: 10 }}>
                                        {this.props.settings.map(s => <div key={"setting" + s.id} className={"form-group"}>
                                            <Grid container spacing={16}>
                                                {this.getSettingField(s)}
                                            </Grid>
                                        </div>
                                        )}
                                    </div>
                                </ValidatorForm>
                            </Paper>
                        </Grid>
                    </Grid>
                </Grid>
                {/* } */}

                <AlertSnackbars
                    open={this.state.snackOpen}
                    handleClose={this.handleSnackClose}
                    message={this.state.snackMessage}
                    variant={this.state.snackVariant}
                />

                <LoadingIndicator show={this.state.loading} />
            </SharableView>
        );
    }
}

// The function takes data from the app current state,
// and insert/links it into the props of our component.
// This function makes Redux know that this component needs to be passed a piece of the state
const mapStateToProps = (state, props) => ({
    userSession: state.userSession,
    settings: state.settings,
    literals: state.literals
});

const mapDispatchToProps = (dispatch) => ({ "dispatch": dispatch });

//Connect everything
export default connect(mapStateToProps, mapDispatchToProps)(withStyles(styles)(NginxConfigurationsPage));