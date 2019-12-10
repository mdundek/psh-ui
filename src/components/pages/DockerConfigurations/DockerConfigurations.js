import React from 'react';
import { connect } from 'react-redux';
import { Redirect } from 'react-router-dom';
import { withStyles } from '@material-ui/core/styles';
import { Grid } from '@material-ui/core';
import styles from '../styles.js';
import SharableView from '../../elements/SharableView/index';

import NetworksTable from '../../elements/TableEditors/networks';
import DockerImagesTable from '../../elements/TableEditors/dockerImages';
import ContainersTable from '../../elements/TableEditors/containers';

import { Button } from '@material-ui/core';
import AlertSnackbars from '../../elements/AlertBar/index';

class DockerPage extends React.Component {
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
            snackVariant: null
        };
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
     * render
     */
    render() {
        // If loged in, redirect to boardingpass page
        if (!this.props.userSession.token) {
            return <Redirect to='/login' />
        }

        return (
            <SharableView
                ref={(el) => this.sharedView = el}
                history={this.props.history}
                pageIndex={1}
                notify={this.openSnack.bind(this)}
            >
                {/* Display editor */}
                {/* {!this.state.loading &&  */}
                <Grid item xs={12}>
                    <Grid container spacing={16}>
                        <Grid item xs={4}>
                            <Grid container spacing={16}>
                                <Grid item xs={12}>
                                    <DockerImagesTable notify={this.openSnack.bind(this)}></DockerImagesTable>
                                </Grid>
                                {/* <Grid item xs={12}>
                                    <NetworksTable notify={this.openSnack.bind(this)}></NetworksTable>
                                </Grid> */}
                            </Grid>
                        </Grid>
                        <Grid item xs={8}>
                            <ContainersTable notify={this.openSnack.bind(this)}></ContainersTable>
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

            </SharableView>
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
export default connect(mapStateToProps, mapDispatchToProps)(withStyles(styles)(DockerPage));