const styles = theme => ({
    root: {
        flexGrow: 1
    },
    title: {
        fontSize: 32,
        color: '#ffffff'
    },
    paper: {
        padding: theme.spacing.unit,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        position: 'relative'
    },
    margin: {
        margin: theme.spacing.unit * 2,
    },
    padding: {
        padding: theme.spacing.unit
    },
    redColor: {
        color: "#db1d1d",
    },
    greenColor: {
        color: "green",
    },
    blueColor: {
        color: "blue",
    },
    greyColor: {
        color: "#cccccc",
    },
    modalPaper: {
        position: 'absolute',
        width: theme.spacing.unit * 50,
        backgroundColor: theme.palette.background.paper,
        boxShadow: theme.shadows[5],
        padding: theme.spacing.unit * 4,
    },
    tableTitleDiv: {
        fontSize: 28,
        marginTop: 5,
        marginBottom: 10,
        textAlign: 'left'
    },
    tableCell: {
        whiteSpace: 'normal',
        wordWrap: 'break-word'
    },
    snackClose: {
        padding: theme.spacing.unit / 2,
    },
    configPaper: {
        padding: theme.spacing.unit,
        position: 'relative',
        textAlign: 'left',
        paddingLeft: 10,
        paddingRight: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.8)'
    },
    menuItem: {},
    menuItemSelected: {
        backgroundColor: '#bbbbbb',
    },
    primary: {},
    icon: {},
    viewContainer: {
        borderLeft: '10px solid #cccccc'
    },
    emptyView: {
        height: 400,
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center'
    }
});

export default styles;
