import React from 'react';
import PropTypes from 'prop-types'
import { render, unmountComponentAtNode } from 'react-dom'
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import Divider from '@material-ui/core/Divider';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import ValidatorForm from "../ValidationForm/index";
import Grid from '@material-ui/core/Grid';
import CloudUploadIcon from '@material-ui/icons/CloudUpload';
import ReactDOM from 'react-dom'
import API from "../../../services/API";

export default class CertificateUploadDialog extends React.Component {
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
                label: 'Upload',
                onClick: () => null
            }
        ],
        willUnmount: () => null
    }

    constructor(props) {
        super(props);

        this.state = {
            privkey: null,
            cert: null
        };
    }

    handleClickButton = async (doit) => {
        if (doit) {
            // Prepare form data
            const data = new FormData();
            data.append("privkey", this.state.privkey);
            data.append("cert", this.state.cert);

            try {
                let response = await API.endpoints.Domains.uploadCertificate(this.props.domainId, data);
                if (response.data.success) {
                    this.props.notify("Certificate uploaded!");
                    this.props.onDone();
                    this.close();
                } else {
                    this.props.notify(response.data.error, 'error');
                }
            } catch (err) {
                this.props.notify(err.message, 'error');
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
    }

    componentWillUnmount = () => {
        document.removeEventListener('keydown', this.keyboardClose, false);
        this.props.willUnmount()
    }

    handleFileSelected(name, event) {
        if (event.target.files && event.target.files.length == 1) {
            let fName = event.target.files[0].name;
            if (fName.toLowerCase().endsWith(".pem") || fName.toLowerCase().endsWith(".crt")) {
                this.setState({ [name]: event.target.files[0] });
            } else {
                this.props.notify("Invalide file format", 'error');
            }
        }
    }

    openFileDialog(refName) {
        var fileInputDom = ReactDOM.findDOMNode(this.refs[refName]);
        fileInputDom.click()
    }

    render() {
        return (
            <Dialog
                open={true}
                onClose={this.close}
                aria-labelledby="ssl-cert-upload-dialog-title"
                aria-describedby="ssl-cert-upload-dialog-description"
            >
                <DialogTitle id="ssl-cert-upload-dialog-title">Upload SSL certificate files</DialogTitle>
                <DialogContent>
                    <DialogContentText id="ssl-cert-upload-dialog-description">
                        Please upload the required certificate files for this domain. If you are using subdomains, make sure your certificate is a wild card certificate.
                    </DialogContentText>
                    <Divider style={{ marginTop: 10, marginBottom: 10 }} />
                    <DialogContentText id="ssl-cert-upload-dialog-description">
                        Some of the browsers may consider the connection as unsafe, if there is no valid intermediate certificate. So, proper installation of intermediate certificate is a critical step.
                       <br /><br />
                        Most of the times, the primary certificate and intermediate certificate will be given as 2 different files.
                        <br />
                        For example, we combine the primary certificate and the intermediate certificate using the below command.
                    </DialogContentText>
                    <div style={{ backgroundColor: "#eeeeee", padding: 10, marginTop: 20, marginBottom: 20 }}>
                        cat domain.crt domain_intermediate.ca-bundle >> ssl_bundle.crt
                    </div>
                    <ValidatorForm ref={form => (this.formEl = form)}>
                        <Grid container alignItems="center" style={{ marginTop: 20 }}>
                            <Grid item xs={3} style={{ textAlign: 'right' }}>
                                Private Key
                            </Grid>
                            <Grid item xs={3} style={{ textAlign: 'center' }}>
                                <input
                                    style={{ display: 'none' }}
                                    type="file"
                                    ref={'ssl_privkey'}
                                    onChange={this.handleFileSelected.bind(this, "privkey")}
                                />
                                <label htmlFor="raised-button-file">
                                    <Button variant="contained" color={this.state['privkey'] ? 'primary' : 'default'} onClick={this.openFileDialog.bind(this, 'ssl_privkey')}>
                                        {this.state['privkey'] ? 'SELECTED' : 'SELECT'}
                                        <CloudUploadIcon style={{ marginLeft: 10 }} />
                                    </Button>
                                </label>
                            </Grid>

                            <Grid item xs={3} style={{ textAlign: 'right' }}>
                                Certificate
                            </Grid>
                            <Grid item xs={3} style={{ textAlign: 'center' }}>
                                <input
                                    style={{ display: 'none' }}
                                    type="file"
                                    ref={'ssl_cert'}
                                    onChange={this.handleFileSelected.bind(this, "cert")}
                                />
                                <label htmlFor="raised-button-file">
                                    <Button variant="contained" color={this.state['cert'] ? 'primary' : 'default'} onClick={this.openFileDialog.bind(this, 'ssl_cert')}>
                                        {this.state['cert'] ? 'SELECTED' : 'SELECT'}
                                        <CloudUploadIcon style={{ marginLeft: 10 }} />
                                    </Button>
                                </label>
                            </Grid>
                        </Grid>
                    </ValidatorForm>
                </DialogContent>
                <DialogActions>
                    {this.state.privkey && this.state.cert && <Button onClick={() => this.handleClickButton(true)}>
                        Upload
                    </Button>}
                    <Button onClick={() => this.handleClickButton()}>
                        Cancel
                    </Button>
                </DialogActions>
            </Dialog>
        )
    }
}

function createElementReconfirm(properties) {
    let divTarget = document.getElementById('react-ssl-cert-upload-dialog')
    if (divTarget) {
        // Rerender - the mounted CertificateUploadDialog
        render(<CertificateUploadDialog {...properties} />, divTarget)
    } else {
        // Mount the CertificateUploadDialog component
        document.body.children[0].classList.add('react-ssl-cert-upload-dialog-blur')
        divTarget = document.createElement('div')
        divTarget.id = 'react-ssl-cert-upload-dialog'
        document.body.appendChild(divTarget)
        render(<CertificateUploadDialog {...properties} />, divTarget)
    }
}

function removeElementReconfirm() {
    const target = document.getElementById('react-ssl-cert-upload-dialog')
    unmountComponentAtNode(target)
    target.parentNode.removeChild(target)
}

export function certificateUploadDialog(properties) {
    createElementReconfirm(properties)
}