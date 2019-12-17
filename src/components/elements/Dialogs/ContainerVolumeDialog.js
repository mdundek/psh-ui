import React from 'react';
import PropTypes from 'prop-types'
import { render, unmountComponentAtNode } from 'react-dom'
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import TextField from '@material-ui/core/TextField';
import ValidatorForm from "../ValidationForm/index";
import Grid from '@material-ui/core/Grid';
import Divider from '@material-ui/core/Divider';
import Switch from '@material-ui/core/Switch';
import FormGroup from '@material-ui/core/FormGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';

export default class ReactContainerVolumeDialog extends React.Component {
    static propTypes = {
        buttons: PropTypes.array.isRequired,
        willUnmount: PropTypes.func
    }

    static defaultProps = {
        buttons: [
            {
                label: 'Cancel',
                onClick: () => null
            },
            {
                label: 'Confirm',
                onClick: () => null
            }
        ],
        willUnmount: () => null
    }

    constructor(props) {
        super(props);

        this.state = {
            hostPath: "",
            volumeDescription: "",
            containerPath: "",
            execOnEveryDeploy: false,
            git: "",
            cmd: ""
        };
    }

    handleClickButton = doit => {
        if (doit) {
            let isValide = this.formEl.validate();
            if (isValide) {
                let duplicate = null;
                // If update volume
                if (this.props.containerPath.length > 0) {
                    duplicate = this.props.currentVolumes.find(o => o.containerPath != this.props.containerPath && this.state.containerPath == o.containerPath);
                }
                // If add volume
                else {
                    duplicate = this.props.currentVolumes.find(o => this.state.containerPath == o.containerPath);
                }
                if (!duplicate) {
                    this.props.onSubmit({
                        hostPath: this.state.hostPath,
                        volumeDescription: this.state.volumeDescription,
                        containerPath: this.state.containerPath,
                        git: this.state.git,
                        cmd: this.state.cmd,
                        execOnEveryDeploy: this.state.execOnEveryDeploy
                    });
                    this.close();
                } else {
                    this.props.onDuplicate();
                }
            }
        } else {
            this.close();
        }
    }

    close = () => {
        removeElementReconfirm();
    }

    keyboardClose = event => {
        if (event.keyCode === 27) {
            this.close()
        }
    }

    componentDidMount = () => {
        document.addEventListener('keydown', this.keyboardClose, false);
        this.setState({
            hostPath: this.props.hostPath,
            volumeDescription: this.props.volumeDescription,
            containerPath: this.props.containerPath,
            git: this.props.git,
            cmd: this.props.cmd,
            execOnEveryDeploy: this.props.execOnEveryDeploy
        });
    }

    componentWillUnmount = () => {
        document.removeEventListener('keydown', this.keyboardClose, false);
        this.props.willUnmount()
    }

    render() {
        return (
            <Dialog
                open={true}
                onClose={this.close}
                aria-labelledby="volume-dialog-title"
                aria-describedby="volume-dialog-description"
            >
                <DialogTitle id="volume-dialog-title">Volume configuration</DialogTitle>
                <DialogContent>
                    <DialogContentText id="volume-dialog-description">
                        You can optionally specify a GIT repository for this volume, in which case the repo will be cloned inside this volume if it does not exist on deploy.
                    </DialogContentText>
                    <ValidatorForm ref={form => (this.formEl = form)}>

                        <Grid container alignItems="center" style={{ marginTop: 20 }}>
                            <Grid item xs={12}>
                                <div className={"form-group"} style={{ marginRight: 10 }}>
                                    <TextField
                                        autoFocus
                                        margin="dense"
                                        label="Container volume description"
                                        type="text"
                                        value={this.state.volumeDescription}
                                        onChange={(e) => {
                                            this.setState({ "volumeDescription": e.target.value })
                                        }}
                                        fullWidth />
                                    <div className="invalid-feedback"></div>
                                </div>
                            </Grid>
                            <Grid item xs>
                                <div className={"form-group"} style={{ marginRight: 10 }}>
                                    <TextField
                                        required
                                        // inputProps={{ pattern: "^\/([ A-z0-9\-_+]+\/)*([ A-z0-9\-_+]+)$" }}
                                        margin="dense"
                                        label="Host volume path"
                                        type="text"
                                        value={this.state.hostPath}
                                        onChange={(e) => {
                                            this.setState({ "hostPath": e.target.value })
                                        }}
                                        fullWidth />
                                    <div className="invalid-feedback"></div>
                                </div>
                            </Grid>
                            <Grid item xs>
                                <div className={"form-group"} style={{ marginLeft: 10 }}>
                                    <TextField
                                        required
                                        // inputProps={{ pattern: "^\/([ A-z0-9\-_+]+\/)*([ A-z0-9\-_+]+)$" }}
                                        margin="dense"
                                        label="Container path"
                                        type="text"
                                        value={this.state.containerPath}
                                        onChange={(e) => {
                                            this.setState({ "containerPath": e.target.value })
                                        }}
                                        fullWidth />
                                    <div className="invalid-feedback"></div>
                                </div>
                            </Grid>
                        </Grid>

                        <Divider style={{ marginTop: 40, marginBottom: 10 }}></Divider>

                        <Grid container alignItems="center">
                            <Grid item xs>
                                <div className={"form-group"}>
                                    <TextField
                                        margin="dense"
                                        label="Git repo (optional)"
                                        type="text"
                                        value={this.state.git}
                                        onChange={(e) => {
                                            this.setState({ "git": e.target.value })
                                        }}
                                        fullWidth />
                                    <div className="invalid-feedback"></div>
                                </div>
                            </Grid>
                        </Grid>

                        {this.state.git.length > 0 && <Grid container alignItems="center">
                            <Grid item xs>
                                <div className={"form-group"} style={{ marginRight: 10 }}>
                                    <TextField
                                        margin="dense"
                                        label="Execute command after clone"
                                        type="text"
                                        value={this.state.cmd}
                                        onChange={(e) => {
                                            this.setState({ "cmd": e.target.value })
                                        }}
                                        fullWidth />
                                    <div className="invalid-feedback"></div>
                                </div>
                            </Grid>

                            <Grid item xs>
                                <FormGroup row style={{ marginLeft: 10 }}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={this.state.execOnEveryDeploy}
                                                onChange={(event) => {
                                                    this.setState({ execOnEveryDeploy: event.target.checked });
                                                }}
                                            />
                                        }
                                        label="Pull and execute command on every deploy"
                                    />
                                </FormGroup>
                            </Grid>

                        </Grid>}
                    </ValidatorForm>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => this.handleClickButton(true)}>
                        {this.props.submitLabel}
                    </Button>
                    <Button onClick={() => this.handleClickButton()}>
                        Cancel
                    </Button>
                </DialogActions>
            </Dialog>
        )
    }
}

function createElementReconfirm(properties) {
    let divTarget = document.getElementById('react-volume-dialog')
    if (divTarget) {
        // Rerender - the mounted ReactContainerVolumeDialog
        render(<ReactContainerVolumeDialog {...properties} />, divTarget)
    } else {
        // Mount the ReactContainerVolumeDialog component
        document.body.children[0].classList.add('react-volume-dialog-blur')
        divTarget = document.createElement('div')
        divTarget.id = 'react-volume-dialog'
        document.body.appendChild(divTarget)
        render(<ReactContainerVolumeDialog {...properties} />, divTarget)
    }
}

function removeElementReconfirm() {
    const target = document.getElementById('react-volume-dialog')
    unmountComponentAtNode(target)
    target.parentNode.removeChild(target)
}

export function volumeDialog(properties) {
    createElementReconfirm(properties)
}