import React from 'react'
import logo from '../../../logo.svg';
import { connect } from 'react-redux';

import { withStyles } from '@material-ui/core/styles';
import { Paper, Grid, TextField, Button } from '@material-ui/core';
import { Face, Fingerprint } from '@material-ui/icons';
import ValidatorForm from "../../elements/ValidationForm/index";
import Authentication from '../../../services/authentication';
import { Redirect } from 'react-router-dom';
import AlertSnackbars from '../../elements/AlertBar/index';

const styles = theme => ({
    root: {
        flexGrow: 1,
    },
    title: {
        fontSize: 32,
        color: '#ffffff'
    },
    paper: {
        padding: theme.spacing.unit,
        width: 400,
    },
    margin: {
        margin: theme.spacing.unit * 2,
    },
    padding: {
        padding: theme.spacing.unit
    },
    modalPaper: {
        position: 'absolute',
        width: theme.spacing.unit * 50,
        backgroundColor: theme.palette.background.paper,
        boxShadow: theme.shadows[5],
        padding: theme.spacing.unit * 4,
    },
});

/**
 * LoginPage
 */
class LoginPage extends React.Component {
    /**
     * constructor
     * @param {*} props 
     */
    constructor(props) {
        super(props);

        this.state = {
            snackOpen: false,
            snackMessage: "",
            snackVariant: null,
            username: "admin",
            password: "mdundek.heart"
        };
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
     * login
     */
    login() {
        let isValide = this.formEl.validate();
        if (isValide) {
            // Build return object
            let formData = {
                "password": this.state.password
            };
            if (this.state.username.indexOf('@') === -1) {
                formData.username = this.state.username;
            } else {
                formData.email = this.state.username;
            }

            // Try to login on the sdf server
            Authentication.login(formData).then(() => { }).catch((err) => {
                this.setState({
                    snackOpen: true,
                    snackVariant: "error",
                    snackMessage: err.status === 401 ? "Wrong username or password" : err.status === 403 ? "User is not an administrator" : "An error occured, please try again later"
                });
                console.log("ERROR =>", err);
            });
        }
        // if (this.state.username.trim().length === 0 || this.state.password.trim().length === 0) {
        //     this.setState({
        //         snackOpen: true,
        //         snackVariant: "error",
        //         snackMessage: "Invalide form"
        //     });
        //     return;
        // }


    }

    /**
     * getModalStyle
     */
    getModalStyle() {
        const top = 50;
        const left = 50;
        return {
            top: `${top}%`,
            left: `${left}%`,
            transform: `translate(-${top}%, -${left}%)`,
        };
    }

    /**
     * render
     */
    render() {
        // If loged in, redirect to boardingpass page
        if (this.props.userSession.token) {
            return <Redirect to='/solution' />
        }

        const { classes } = this.props;
        return (
            <div className="App">
                <header className="App-header">
                    <img src={logo} className="App-logo" alt="logo" />
                    <p>Server Docker Farm</p>
                </header>
                <div className="App-body">
                    <Grid item xs={12} style={{ marginTop: 100 }}>
                        <Grid container justify="center" spacing={16}>
                            <Grid item xs={12} className={classes.title}>
                                LOGIN
                            </Grid>
                            <Grid item>
                                <Paper className={classes.paper}>
                                    <ValidatorForm ref={form => (this.formEl = form)}>
                                        <div className={classes.margin}>
                                            <Grid container spacing={32} alignItems="flex-end">
                                                <Grid item>
                                                    <Face />
                                                </Grid>
                                                <Grid item md={true} sm={true} xs={true}>
                                                    <div className={"form-group"}>
                                                        <TextField
                                                            id="username"
                                                            value={this.state.username}
                                                            onChange={(e) => { this.setState({ username: e.target.value }) }}
                                                            label="Username"
                                                            type="text"
                                                            fullWidth
                                                            autoFocus
                                                            required />
                                                        <div className="invalid-feedback"></div>
                                                    </div>
                                                </Grid>
                                            </Grid>
                                            <Grid container spacing={32} alignItems="flex-end">
                                                <Grid item>
                                                    <Fingerprint />
                                                </Grid>
                                                <Grid item md={true} sm={true} xs={true}>
                                                    <div className={"form-group"}>
                                                        <TextField
                                                            id="password"
                                                            value={this.state.password}
                                                            onChange={(e) => { this.setState({ password: e.target.value }) }}
                                                            label="Password"
                                                            type="password"
                                                            fullWidth
                                                            required />
                                                        <div className="invalid-feedback"></div>
                                                    </div>
                                                </Grid>
                                            </Grid>
                                            <Grid container justify="center" style={{ marginTop: '40px' }}>
                                                <Button variant="contained" color="primary" style={{ textTransform: "none" }} onClick={this.login.bind(this)} fullWidth>Login</Button>
                                            </Grid>
                                        </div>
                                    </ValidatorForm>
                                </Paper>
                            </Grid>
                        </Grid>
                    </Grid>
                </div>

                <AlertSnackbars
                    open={this.state.snackOpen}
                    handleClose={this.handleSnackClose}
                    message={this.state.snackMessage}
                    variant={this.state.snackVariant}
                />

            </div >
        );
    }
}

// The function takes data from the app current state,
// and insert/links it into the props of our component.
// This function makes Redux know that this component needs to be passed a piece of the state
const mapStateToProps = (state, props) => ({
    userSession: state.userSession
});

const mapDispatchToProps = (dispatch) => ({ "dispatch": dispatch });

//Connect everything
export default connect(mapStateToProps, mapDispatchToProps)(withStyles(styles)(LoginPage));