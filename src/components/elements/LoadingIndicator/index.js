'use strict';

import React, { Component } from 'react';
import logo from '../../../logo.svg';

class LoadingIndicator extends Component {
	/**
	 * 
	 * @param {*} props 
	 */
	constructor(props) {
		super(props);
	}

	/**
	 * 
	 */
	render() {
		if (this.props.show) {
			return <div style={{
				position: "fixed",
				zIndex: 2000,
				top: 0,
				bottom: 0,
				left: 0,
				right: 0,
				flex: 1,
				alignItems: "center",
				justifyContent: "center",
				textAlign: "center",
				backgroundColor: 'rgba(0, 0, 0, 0.7)'
			}}>
				<img className="Loading" src={logo} />
				<div style={{
					color: "#ffffff",
					fontWeight: "bold",
					lineHeight: 2,
					paddingLeft: 40,
					paddingRight: 40,
				}}>{this.props.message ? this.props.message : "Processing..."}</div>
			</div >;
		} else {
			return null;
		}
	}
}

//Connect everything
export default LoadingIndicator;