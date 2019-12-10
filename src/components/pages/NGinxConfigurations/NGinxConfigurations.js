import React from 'react';
import { connect } from 'react-redux';
import { Redirect } from 'react-router-dom';
import { withStyles } from '@material-ui/core/styles';
import { Grid } from '@material-ui/core';
import styles from '../styles.js';
import SharableView from '../../elements/SharableView/index';
import LoadingIndicator from "../../elements/LoadingIndicator/index";
import DomainsTable from '../../elements/TableEditors/domains';
import BasicAuthTable from '../../elements/TableEditors/basicAuth';
import NGinxPresetParamsTable from '../../elements/TableEditors/nginxPresetParams';
import NGinxConfigsTable from '../../elements/TableEditors/nginxConfigs';

import { Button } from '@material-ui/core';
import AlertSnackbars from '../../elements/AlertBar/index';

class NginxConfigurationsPage extends React.Component {
    sharedView = null

    /**
     * constructor
     * @param {*} props 
     */
    constructor(props) {
        super(props);

        this.state = {
            loading: false,
            loadingMessage: null,

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
     * loadingStateChange
     * @param {*} state 
     * @param {*} message 
     */
    loadingStateChange(state, message) {
        this.setState({ loading: state, loadingMessage: message });
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
                pageIndex={2}
                notify={this.openSnack.bind(this)}
            >
                {/* {!this.state.loading &&  */}
                <Grid item xs={12}>
                    <Grid container spacing={16}>
                        <Grid item xs={4}>
                            <Grid container spacing={16}>
                                <Grid item xs={12}>
                                    <DomainsTable notify={this.openSnack.bind(this)} setLoading={this.loadingStateChange.bind(this)}></DomainsTable>
                                </Grid>
                                <Grid item xs={12}>
                                    <NGinxPresetParamsTable notify={this.openSnack.bind(this)}></NGinxPresetParamsTable>
                                </Grid>
                                <Grid item xs={12}>
                                    <BasicAuthTable notify={this.openSnack.bind(this)}></BasicAuthTable>
                                </Grid>
                            </Grid>
                        </Grid>
                        <Grid item xs={8}>
                            <NGinxConfigsTable notify={this.openSnack.bind(this)}></NGinxConfigsTable>
                        </Grid>
                    </Grid>
                </Grid>
                {/* } */}

                <LoadingIndicator show={this.state.loading} message={this.state.loadingMessage} />

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
    userSession: state.userSession,
    domains: state.domains,
    nginxConfigs: state.nginxConfigs,
    nginxPresetParams: state.nginxPresetParams
});

const mapDispatchToProps = (dispatch) => ({ "dispatch": dispatch });

//Connect everything
export default connect(mapStateToProps, mapDispatchToProps)(withStyles(styles)(NginxConfigurationsPage));