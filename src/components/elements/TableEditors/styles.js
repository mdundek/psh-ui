const styles = theme => ({
    paper: {
        padding: theme.spacing.unit,
        position: 'relative',
        textAlign: 'left',
        paddingLeft: 10,
        paddingRight: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.8)'
    },
    formDiv: {
        padding: 20,
        overflow: 'auto',
        maxHeight: 600
    },
    tableTitleDiv: {
        fontSize: 28,
        marginTop: 5,
        marginBottom: 10,
        paddingRight: 70
    },
    tableHeaderCell: {
        color: '#436dbb'
    },
    tableCell: {
        whiteSpace: 'normal',
        wordWrap: 'break-word'
    },
    tableCellButton: {
        textAlign: 'right'
    },
    appBar: {
        position: 'relative',
        minWidth: 550
    },
    flex: {
        flex: 1,
    },
    card: {
        backgroundColor: '#eeeeee',
        overflow: 'auto',
        // height: '100%'
        maxHeight: 400
    },
    cardInfo: {
        backgroundColor: '#ffffd1'
    },
    emptyDialogLine: {
        paddingLeft: 30,
        marginTop: -15
    }
});

export default styles;
