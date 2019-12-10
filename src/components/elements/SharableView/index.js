'use strict';

import React, { Component } from 'react';
import { connect } from 'react-redux';
import logo from '../../../logo.svg';
import { Button } from '@material-ui/core';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Authentication from '../../../services/authentication';
import LoadingIndicator from "../LoadingIndicator/index";
import SocketPubSub from '../../../services/sockerPubSub';
import StoreHelper from '../../../lib/StoreHelper/loadData';

class SharableViewComponent extends Component {
	/**
	 * 
	 * @param {*} props 
	 */
	constructor(props) {
		super(props);
		this.state = {
			selectedPageIndex: this.props.pageIndex,
			loading: false,
			loadingMessage: null
		};
	}

	/**
     * componentDidMount
     */
	componentDidMount() {
		SocketPubSub.on("deployStatus", (data) => {
			if (data.status && data.status == "done") {
				this.setState({
					"loading": false,
					"loadingMessage": null
				});
				this.props.notify(["Successfully deployed configuration.", "If you changed the SSL status of the default config, remember to manually change your URL in your browser to get back to this website.", "Your server might take up to a minute to respond again, so be patient."]);
			} else if (data.status && data.status == "error") {
				this.setState({
					"loading": false,
					"loadingMessage": null
				});
				this.props.notify((data.message ? data.message : "An error occured, could not deploy configuration"), "error");
			} else if (data.message) {
				this.setState({
					"loadingMessage": data.message
				});
			}
		});

		if (!this.props.userSession.token) {
			return;
		}

		this.loadTableList();
	}

	/**
	 *componentWillUnmount
	 */
	componentWillUnmount() {
		SocketPubSub.off("deployStatus");
	}

	/**
     * loadTableList
     */
	loadTableList() {
		(async () => {
			try {
				this.setState({
					"loading": true,
					"loadingMessage": null
				});

				await StoreHelper.loadStoreData(this.props.dispatch);

				this.setState({
					"loading": false,
					"loadingMessage": null
				});
			} catch (err) {

				await StoreHelper.clearStoreData(this.props.dispatch);

				this.setState({
					"loading": false,
					"loadingMessage": null
				});

				this.props.notify("Server unavailable", "error");
			}
		})();
	}

    /**
     * logout
     */
	logout() {
		Authentication.logout();
	}

	/**
     * deploy
     */
	async deploy() {
		let defaultNginxDomain = this.props.settings.find(s => s.name == 'defaultNginxDomain');
		if (!defaultNginxDomain || !defaultNginxDomain.value || defaultNginxDomain.value.length == 0) {
			return this.props.notify("You need to set a default domain first to be able to deploy a new config.", "error");
		}
		let valideDomain = this.props.domains.find(o => (defaultNginxDomain.value == o.value));
		if (!valideDomain) {
			return this.props.notify("You configured default domain has not ben declared in your domains.", "error");
		}

		this.setState({
			"loading": true,
			"loadingMessage": "Deploying..."
		});
		try {
			SocketPubSub.socket.emit('deployConfig', {
				"uid": this.props.userSession.userId
			});
		} catch (err) {
			this.setState({
				"loading": false,
				"loadingMessage": null
			});
			this.props.notify("An error occured, could not deploy configuration", "error");
		}
	}

	/**
	 * 
	 */
	render() {
		return <div style={{ flex: 1 }}>
			<div className="App">
				<header className="App-header">
					<img src={logo} className="App-logo" alt="logo" />
					<p>Server Docker Farm</p>
					<Button variant="contained" color="secondary" style={{ textTransform: "none", position: 'absolute', right: 20, top: 20 }} onClick={this.logout.bind(this)}>Logout</Button>
					<Button disabled={!this.props.userSession.online} variant="contained" color="primary" style={{ textTransform: "none", position: 'absolute', right: 120, top: 20 }} onClick={this.deploy.bind(this)}>Deploy</Button>
				</header>
				{/* <AppBar position="static"> */}

				<Tabs
					value={this.state.selectedPageIndex}
					onChange={(event, value) => {
						this.setState({ selectedPageIndex: value });

						if (value == 2) {
							this.props.history.push("/nginx")
						} else if (value == 3) {
							this.props.history.push("/config")
						} else if (value == 0) {
							this.props.history.push("/solution")
						} else if (value == 1) {
							this.props.history.push("/docker")
						}
					}}
					centered
					textColor="secondary">

					<Tab label="Solutions" style={this.state.selectedPageIndex != 0 ? { color: "#ffffff" } : null} />
					<Tab label="Containers" style={this.state.selectedPageIndex != 1 ? { color: "#ffffff" } : null} />
					<Tab label="NGinx" style={this.state.selectedPageIndex != 2 ? { color: "#ffffff" } : null} />
					<Tab label="Settings" style={this.state.selectedPageIndex != 3 ? { color: "#ffffff" } : null} />
				</Tabs>
				{/* </AppBar> */}
				<div className="App-body">
					{this.props.children}
				</div>

			</div >
			<LoadingIndicator show={this.state.loading} message={this.state.loadingMessage} />
		</div >;
	}
}

// The function takes data from the app current state,
// and insert/links it into the props of our component.
// This function makes Redux know that this component needs to be passed a piece of the state
const mapStateToProps = (state, props) => ({
	userSession: state.userSession,
	domains: state.domains,
	settings: state.settings
});

const mapDispatchToProps = (dispatch) => ({ "dispatch": dispatch });

//Connect everything
export default connect(mapStateToProps, mapDispatchToProps)(SharableViewComponent);