import React from 'react';
import { connect } from 'react-redux';
import { withStyles } from '@material-ui/core/styles';
import { Paper, Grid, Button, TextField, Divider } from '@material-ui/core';
import Switch from '@material-ui/core/Switch';
import FormGroup from '@material-ui/core/FormGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import LinearProgress from '@material-ui/core/LinearProgress';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import CloseIcon from '@material-ui/icons/Close';
import SSLIcon from '@material-ui/icons/Security';
import Slide from '@material-ui/core/Slide';
import ValidatorForm from "../ValidationForm/index";
import API from "../../../services/API";
import { confirmAlert } from '../Dialogs/AlertDialog';
import styles from './styles.js';

import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';

import { certificateUploadDialog } from '../Dialogs/CertificateUploadDialog';

function Transition(props) {
    return <Slide direction="up" {...props} />;
}

class DomainsTable extends React.Component {
    /**
     * constructor
     * @param {*} props 
     */
    constructor(props) {
        super(props);

        this.state = this.populateEditorFormFromObject();
        this.state.selected = null;
        this.state.mode = null;
        this.state.sslMissing = false;

        this.state.defaultDomain = null;

        this.tblClickDebouncer = null;
    }

    /**
     * componentDidMount
     */
    componentDidMount() {
        // Wait for settings to be loaded by store to get the default domain
        let settingsInterval = setInterval(() => {
            if (this.props.settings.length > 0) {
                this.setState({
                    "defaultDomain": this.props.settings.find(s => s.name == 'defaultNginxDomain').value
                });
                clearInterval(settingsInterval);
            }
        }, 100);
    }

    // *****************************************************************
    SET_DATA_REDUCER_ACTION = "SET_DOMAINS";

    tableRow(cellClasses, tableCellButton, isSelected, selectedId, row) {
        return <TableRow hover key={row.id}
            className={isSelected ? "" : "hoverPointer"}
            onClick={event => {
                this.handleRowClick(event, row.id);
            }}
            selected={selectedId && selectedId === row.id}>

            <TableCell className={cellClasses}>{row.value}</TableCell>
            <TableCell className={cellClasses} padding="none">
                {row.httpsEnabled && <SSLIcon />}
            </TableCell>
            <TableCell className={tableCellButton}>
                <Switch
                    checked={(this.state.defaultDomain == row.value)}
                    value={row.value}
                    onChange={this.defaultDomainToggleEvent.bind(this)}
                />
            </TableCell>
        </TableRow>;
    }
    /**
     * defaultDomainToggleEvent
     */
    defaultDomainToggleEvent(event) {
        if (this.tblClickDebouncer) {
            clearTimeout(this.tblClickDebouncer);
        }

        let previousDefaultDomain = this.state.defaultDomain;
        let checked = event.target && event.target.checked;
        let value = event.target && event.target.value ? event.target.value : "";
        (async () => {
            this.setState({
                "defaultDomain": checked ? value : null
            });
            let settingsUpdate = this.props.settings.find(s => s.name == 'defaultNginxDomain');
            try {
                settingsUpdate.value = checked ? value : "";
                await API.endpoints.Settings.update(settingsUpdate);

                let settingsClone = JSON.parse(JSON.stringify(this.props.settings));
                settingsClone = settingsClone.map(sc => {
                    if (sc.name == "defaultNginxDomain") {
                        sc.value = checked ? value : "";
                    }
                    return sc;
                });
                this.props.dispatch({
                    type: "SET_SETTINGS",
                    data: settingsClone
                });
            } catch (err) {
                settingsUpdate.value = previousDefaultDomain;
                this.setState({
                    "defaultDomain": previousDefaultDomain
                });
                this.props.notify("Could not save default domain, make sure the server is running.", "error");
            }
        })();
    }
    populateEditorFormFromObject(selected) {
        return {
            _id: selected && selected.id ? selected.id : null,
            _value: selected && selected.value ? selected.value : "",
            _httpsEnabled: selected && selected.httpsEnabled ? selected.httpsEnabled : false,
            sslMissing: false
        }
    }
    populateSelected(state) {
        return {
            value: state._value,
            httpsEnabled: state._httpsEnabled
        }
    }
    tableHeader() {
        return <TableRow>
            <TableCell className={this.props.classes.tableHeaderCell}>Domain</TableCell>
            <TableCell className={this.props.classes.tableHeaderCell} padding="none">SSL</TableCell>
            <TableCell className={[this.props.classes.tableCellButton, this.props.classes.tableHeaderCell].join(" ")}>Is default</TableCell>
        </TableRow>;
    }

    /**
     * getDialogFormBlockName
     */
    getDialogFormBlockName() {
        return <Grid item xs={7} style={{ textAlign: 'left' }}>
            <div className={"form-group"}>
                <TextField
                    name="value"
                    className={"form-control"}
                    value={this.state._value}
                    onChange={(e) => { this.setState({ _value: e.target.value }) }}
                    label="Value (acme.com)"
                    type="text"
                    fullWidth
                    autoFocus
                    required />
                <div className="invalid-feedback"></div>
            </div>
        </Grid>;
    }

    /**
     * getDialogFormBlockHttpsOnly
     */
    getDialogFormBlockHttpsEnabled() {
        return <Grid item xs={5} style={{ textAlign: 'right' }}>
            {this.state._id &&
                <FormControlLabel
                    style={{ marginRight: 0 }}
                    control={
                        <Switch
                            checked={this.state._httpsEnabled}
                            onChange={(event) => {
                                this.setState({ _httpsEnabled: event.target.checked });

                                if (event.target.checked) {
                                    this.props.setLoading(true);
                                    API.endpoints.Domains.remote("checkDomainSslCert?domainId=" + this.state._id, null, "get").then((checkDomain) => {
                                        this.props.setLoading(false);
                                        this.setState({ sslMissing: !checkDomain.data.configured });
                                    }).catch((err) => {
                                        this.props.setLoading(false);
                                        this.props.notify("A server problem occured.", "error");
                                    });
                                } else {
                                    this.setState({ sslMissing: false });
                                }
                            }}
                        />
                    }
                    label="HTTPS Enabled"
                />
            }
        </Grid>;
    }

    /**
     * getDialogFormBlockUploadCertificates
     */
    getDialogFormBlockUploadCertificates() {
        return this.state._httpsEnabled ? <Grid item xs={12} style={{ textAlign: 'right' }}>
            <Typography gutterBottom variant="caption">
                If you have a certificate, upload it now
            </Typography>
            <Button color="primary" variant="outlined" onClick={(e) => {
                certificateUploadDialog({
                    notify: this.props.notify,
                    domainId: this.state._id,
                    onDone: async () => {
                        this.setState({ sslMissing: false });
                    }
                });
            }}>
                Upload certificates
            </Button>
        </Grid> : null;
    }
    // *****************************************************************

    /**
     * handleDialogClose
     */
    handleDialogClose = () => {
        this.setSelected(null, null);
    };

    /**
    * setSelected
    * @param {*} mode 
    */
    setSelected(mode, selected) {
        let stateData = this.populateEditorFormFromObject(selected);
        stateData.selected = selected;
        stateData.mode = mode;
        this.setState(stateData);
    }

    /**
     * saveDialogData
     */
    saveDialogData = () => {
        (async () => {
            let isValide = this.formEl.validate();
            if (isValide) {
                if (this.props.domains.find(o => (!this.state._id || o.id != this.state._id) && o.value.toLowerCase() == this.state._value.toLowerCase())) {
                    return this.props.notify("Conflict: domain name already in use.", "error");
                }

                let modelObject = this.populateSelected(this.state);
                try {
                    let allOk = true;
                    if (modelObject.httpsEnabled) {
                        let checkDomain = await API.endpoints.Domains.remote("checkDomainSslCert?domainId=" + this.state._id, null, "get");
                        allOk = checkDomain.data.configured;
                    }
                    // If domain ssl ok or ssl not configured
                    if (allOk) {
                        if (this.state.mode === "ADD") {
                            let dbResult = await API.endpoints.Domains.create(modelObject);
                            this.props.dispatch({
                                type: this.SET_DATA_REDUCER_ACTION,
                                data: [...this.props.domains, dbResult]
                            });
                        } else {
                            modelObject.id = this.state._id;
                            let dbResult = await API.endpoints.Domains.update(modelObject);
                            let updData = this.props.domains.map(o => {
                                if (o.id === this.state._id) {
                                    return dbResult;
                                } else {
                                    return o;
                                }
                            });

                            this.props.dispatch({
                                type: this.SET_DATA_REDUCER_ACTION,
                                data: updData
                            });
                        }
                        this.setState({ sslMissing: false });
                        this.setSelected(null, null);
                        this.props.notify("Saved");
                    }
                    // Ssl not configured, show instructions
                    else {
                        this.setState({ sslMissing: true });
                    }
                }
                catch (err) {
                    console.log("ERROR =>", err);
                    this.props.notify("An error occured, make sure the server is running.", "error");
                };
            }
        })();
    }

    /**
     * deleteDialogData
     */
    deleteDialogData = async () => {
        if (this.props.nginxConfigs.find(o => o.domainId && o.domainId == this.state._id)) {
            this.props.notify(`Conflict: Cannot delete because there is at least one nginx config that uses this domain.`, "error");
        } else {
            // Confirm delete
            confirmAlert({
                title: null,
                message: 'Are you sure you want to delete this?',
                buttons: [
                    {
                        label: 'Yes',
                        onClick: async () => {
                            try {
                                await API.endpoints.Domains.deleteById(this.state._id);

                                this.props.dispatch({
                                    type: this.SET_DATA_REDUCER_ACTION,
                                    data: this.props.domains.filter(o => {
                                        return o.id != this.state._id
                                    })
                                });
                                this.setSelected(null, null);
                                this.props.notify("Deleted");
                            }
                            catch (err) {
                                console.log("ERROR =>", err);
                                this.props.notify("An error occured, make sure the server is running.", "error");
                            }
                        }
                    },
                    {
                        label: 'No',
                        onClick: () => {

                        }
                    }
                ]
            });
        }
    }

    /**
     * handleRowClick
     */
    handleRowClick(event, id) {
        let selectedItem = this.props.domains.find(o => o.id === id);
        if (this.state.selected && this.state._id === selectedItem.id) {
            return;
        }

        this.setState({ selected: null });

        if (this.tblClickDebouncer) {
            clearTimeout(this.tblClickDebouncer);
        }

        this.tblClickDebouncer = setTimeout(function (si) {
            this.tblClickDebouncer = null;
            this.setSelected("EDIT", JSON.parse(JSON.stringify(si)));
        }.bind(this, selectedItem), 200);
    }

    /**
     * render
     */
    render() {
        const { classes } = this.props;

        let tblHeader = this.tableHeader();
        return (
            <Paper className={classes.paper}>
                <div className={classes.tableTitleDiv}>Domains</div>
                <Divider variant="middle" style={{ marginLeft: 0, marginRight: 0, marginTop: 0, marginBottom: 20 }} />
                <Button variant="contained" color="primary" style={{ textTransform: "none", position: 'absolute', right: 10, top: 10 }} onClick={this.setSelected.bind(this, "ADD", {})}>New</Button>
                <Card className={classes.cardInfo}>
                    <CardContent>
                        <Typography>
                            The default domain let's NGinx know what domain name to use for the psh-admin application access (instead of localhost).
                        </Typography>
                    </CardContent>
                </Card>
                <Table className={classes.table}>
                    {tblHeader && <TableHead>
                        {tblHeader}
                    </TableHead>}
                    <TableBody>
                        {this.props.domains.map(row => {
                            let cellClasses = [classes.tableCell];
                            cellClasses = cellClasses.join(' ');
                            return this.tableRow(cellClasses, classes.tableCellButton, (this.state.selected && this.state.selected.id === row.id), this.state._id ? this.state._id : null, row);
                        })}
                        {this.props.domains.length == 0 && <TableRow>
                            <TableCell style={{ textAlign: 'center' }} colSpan={3}>
                                <Typography variant="caption">-none-</Typography>
                            </TableCell>
                        </TableRow>}
                    </TableBody>
                </Table>
                {/* Loading indicator */}
                {this.state.loading && <LinearProgress color="secondary" />}

                {/* ********************************************** EDITOR DIALOG ********************************************** */}
                <Dialog
                    TransitionComponent={Transition}
                    open={this.state.selected ? true : false}
                    onClose={this.handleDialogClose}
                    scroll="paper"
                >
                    <AppBar className={classes.appBar}>
                        <Toolbar>
                            <IconButton color="inherit" onClick={this.handleDialogClose} aria-label="Close">
                                <CloseIcon />
                            </IconButton>
                            <Typography variant="h6" color="inherit" className={classes.flex}>
                                {this.state.mode === "EDIT" ? "Edit" : "Add"} domain
                            </Typography>
                            <Button color="inherit" onClick={this.saveDialogData}>
                                Save
                            </Button>
                            {this.state.mode === "EDIT" &&
                                <Button color="secondary" onClick={this.deleteDialogData}>
                                    Delete
                                </Button>
                            }
                        </Toolbar>
                    </AppBar>

                    <div className={classes.formDiv}>
                        {this.state.selected && <ValidatorForm ref={form => (this.formEl = form)}>
                            <div className={"form-group"}>
                                <Grid container spacing={16}>
                                    {this.getDialogFormBlockName()}
                                    {this.getDialogFormBlockHttpsEnabled()}
                                    {this.getDialogFormBlockUploadCertificates()}
                                </Grid>
                            </div>
                        </ValidatorForm>}
                    </div>

                    <DialogContent>
                        {this.state.sslMissing && <div>
                            <br />
                            <Typography gutterBottom variant="h5" component="h2">
                                Missing certificate for this domain!
                            </Typography>
                            <Card className={classes.card}>
                                <CardContent>

                                    <Typography component="p">
                                        <b>If I don't have a certificate for this domain:</b><br /><br />
                                        The following instructions are specific for CloudFlare, this seems to be the best user experience when it comes to wildcard certificates with Letsencrypt.
                                        Also, CloudFlare being free for 1 domain that you own is a good reason to use them as your domain DNS provider.
                                        Couples with the flexibility of subdomains, this is enougth for most use cases.<br /><br />
                                        Here are the instructions for you to follow in order to set up a Letsencrypt SSL certificate using certbot for your domain:
                                    </Typography>
                                    <div className="MuiTypography-body1-212">
                                        <br /><br />
                                        <b>CloudFlare</b>
                                        <ol>
                                            <li>Configure your domain registrar Nameservers to match CloudFlares Nameservers (instructions provided when creating website on CloudFlare)</li>
                                            <li>Add following DNS records to the domain <span style={{ color: "blue" }}>{this.state._value}</span>:<br />
                                                <div style={{ color: "#888888", paddingLeft: 10 }}>
                                                    <i>A: * => YOUR SERVER PUBLIC IP ADDRESS</i> => TTL 2 Minutes<br />
                                                    <i>A: {this.state._value} => YOUR SERVER PUBLIC IP ADDRESS => TTL 2 Minutes</i> (set DNS only mode)<br />
                                                    <i>A: www => YOUR SERVER PUBLIC IP ADDRESS => TTL 2 Minutes</i> (set DNS only mode)
                                            </div>
                                            </li>
                                            <li>
                                                Get your CloudFlare Global API Key, save it in a file on your server <span style={{ color: "orange" }}>(ex. /root/.secrets/cloudflare.ini)</span> with the following content: <br />
                                                <div style={{ color: "#888888", paddingLeft: 10 }}>
                                                    <i>dns_cloudflare_email = "youremail@example.com"</i><br />
                                                    <i>dns_cloudflare_api_key = "your cloudflare api key here"</i>
                                                </div>
                                            </li>
                                            <li>Set the SSL mode to <b>Full</b> under the <i>Crypto</i> section for the domain</li>
                                            <li><i>Disable Universal SSL</i> option under the <i>Crypto</i> section for the domain</li>
                                        </ol>
                                    </div>
                                    <div className="MuiTypography-body1-212">
                                        <b>SSL setup</b>
                                        <ol>
                                            <li>SSH into your server</li>
                                            <li>Execute the command:<br />
                                                <div style={{ color: "#888888", paddingLeft: 10 }}>
                                                    <i>certbot certonly --dns-cloudflare --dns-cloudflare-credentials <span style={{ color: "orange" }}>/root/.secrets/cloudflare.ini</span> -d {this.state._value},*.{this.state._value} --preferred-challenges dns-01</i>
                                                </div>
                                            </li>
                                            <li>To auto-renew certificate, open crontab editor: crontab -e</li>
                                            <li>Add the following line at the end:<br />
                                                <div style={{ color: "#888888", paddingLeft: 10 }}>
                                                    <i>14 5 * * * /usr/local/bin/certbot renew --quiet --post-hook "docker container exec psh_nginx nginx -s reload" > /dev/null 2>&1</i>
                                                </div>
                                            </li>
                                            <li>Once done try to save your domain again with the SSL flag enabled</li>
                                        </ol>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>}
                        {!this.state.sslMissing && <Typography gutterBottom variant="body1" component="h2">
                            Certificate configured!
                            </Typography>}
                    </DialogContent>
                </Dialog>
            </Paper>
        );
    }
}

// The function takes data from the app current state,
// and insert/links it into the props of our component.
// This function makes Redux know that this component needs to be passed a piece of the state
const mapStateToProps = (state, props) => ({
    domains: state.domains,
    settings: state.settings,
    nginxConfigs: state.nginxConfigs,
});

const mapDispatchToProps = (dispatch) => ({ "dispatch": dispatch });

//Connect everything
export default connect(mapStateToProps, mapDispatchToProps)(withStyles(styles)(DomainsTable));