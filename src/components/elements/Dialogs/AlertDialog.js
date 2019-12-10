import React from 'react';
import PropTypes from 'prop-types'
import { render, unmountComponentAtNode } from 'react-dom'
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';

export default class ReactConfirmAlert extends React.Component {
    static propTypes = {
        title: PropTypes.string,
        message: PropTypes.string,
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

    handleClickButton = button => {
        if (button.onClick) {
            button.onClick();
        }
        this.close();
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
        document.addEventListener('keydown', this.keyboardClose, false)
    }

    componentWillUnmount = () => {
        document.removeEventListener('keydown', this.keyboardClose, false)
        this.props.willUnmount()
    }

    render() {
        const { title, message, buttons } = this.props

        return (
            <Dialog
                open={true}
                onClose={this.close}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                {title && <DialogTitle id="alert-dialog-title">{title}</DialogTitle>}
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        {message}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    {buttons.map((button, i) => (
                        <Button
                            key={i}
                            onClick={() => this.handleClickButton(button)}
                        >
                            {button.label}
                        </Button>
                    ))}
                </DialogActions>
            </Dialog>
        )
    }
}

function createElementReconfirm(properties) {
    let divTarget = document.getElementById('react-confirm-alert')
    if (divTarget) {
        // Rerender - the mounted ReactConfirmAlert
        render(<ReactConfirmAlert {...properties} />, divTarget)
    } else {
        // Mount the ReactConfirmAlert component
        document.body.children[0].classList.add('react-confirm-alert-blur')
        divTarget = document.createElement('div')
        divTarget.id = 'react-confirm-alert'
        document.body.appendChild(divTarget)
        render(<ReactConfirmAlert {...properties} />, divTarget)
    }
}

function removeElementReconfirm() {
    const target = document.getElementById('react-confirm-alert')
    unmountComponentAtNode(target)
    target.parentNode.removeChild(target)
}

export function confirmAlert(properties) {
    createElementReconfirm(properties)
}