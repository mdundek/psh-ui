import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import Button from '@material-ui/core/Button';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import ErrorIcon from '@material-ui/icons/Error';
import InfoIcon from '@material-ui/icons/Info';
import CloseIcon from '@material-ui/icons/Close';
import green from '@material-ui/core/colors/green';
import amber from '@material-ui/core/colors/amber';
import IconButton from '@material-ui/core/IconButton';
import Snackbar from '@material-ui/core/Snackbar';
import SnackbarContent from '@material-ui/core/SnackbarContent';
import WarningIcon from '@material-ui/icons/Warning';
import { withStyles } from '@material-ui/core/styles';

const variantIcon = {
    success: CheckCircleIcon,
    warning: WarningIcon,
    error: ErrorIcon,
    info: InfoIcon,
};

const styles1 = theme => ({
    success: {
        backgroundColor: green[600],
    },
    error: {
        backgroundColor: theme.palette.error.dark,
    },
    info: {
        backgroundColor: theme.palette.primary.dark,
    },
    warning: {
        backgroundColor: amber[700],
    },
    icon: {
        fontSize: 20,
    },
    iconVariant: {
        opacity: 0.9,
        marginRight: theme.spacing.unit,
    },
    message: {
        display: 'flex',
        alignItems: 'left',
    },
});

function CustomSnackbarContent(props) {
    const { classes, className, message, onClose, variant, ...other } = props;
    const Icon = variantIcon[variant];

    let msgArray = [];
    if (typeof message === 'string') {
        msgArray.push(message);
    } else {
        msgArray = message;
    }

    return (
        <SnackbarContent
            className={classNames(classes[variant], className)}
            aria-describedby="client-snackbar"
            message={
                <span id="client-snackbar" className={classes.message}>
                    <Icon className={classNames(classes.icon, classes.iconVariant)} />
                    <div>
                        {msgArray.map((m, i) => {
                            return <div key={"snack_" + i} style={{ textAlign: 'left', marginTop: i > 0 ? 10 : 0, maxWidth: 480 }}>{m}</div>
                        })}
                    </div>
                </span>
            }
            action={[
                <IconButton
                    key="close"
                    aria-label="Close"
                    color="inherit"
                    className={classes.close}
                    onClick={onClose}
                >
                    <CloseIcon className={classes.icon} />
                </IconButton>,
            ]}
            {...other}
        />
    );
}

CustomSnackbarContent.propTypes = {
    classes: PropTypes.object.isRequired,
    className: PropTypes.string,
    message: PropTypes.node,
    onClose: PropTypes.func,
    variant: PropTypes.oneOf(['success', 'warning', 'error', 'info']).isRequired,
};

const SnackbarContentWrapper = withStyles(styles1)(CustomSnackbarContent);

const styles2 = theme => ({
    margin: {
        margin: theme.spacing.unit,
    },
});

class AlertSnackbars extends React.Component {
    state = {
        open: false,
    };

    handleClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }

        this.props.handleClose();
    };

    render() {
        const { classes } = this.props;

        let duration = 6000;
        if (this.props.variant && (this.props.variant == "warning" || this.props.variant == "info")) {
            duration = 20000;
        } else if (this.props.variant && this.props.variant == "error") {
            duration = 15000;
        }

        return (
            <div>
                <Snackbar
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'left',
                    }}
                    open={this.props.open}
                    autoHideDuration={duration}
                    onClose={this.handleClose}
                >
                    <SnackbarContentWrapper
                        onClose={this.handleClose}
                        variant={this.props.variant ? this.props.variant : "success"}
                        message={this.props.message}
                    />
                </Snackbar>
            </div>
        );
    }
}

AlertSnackbars.propTypes = {
    classes: PropTypes.object.isRequired,
};

export default withStyles(styles2)(AlertSnackbars);