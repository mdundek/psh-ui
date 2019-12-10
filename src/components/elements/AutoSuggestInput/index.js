import React from 'react';
import PropTypes from 'prop-types';
import deburr from 'lodash/deburr';
import Autosuggest from 'react-autosuggest';
import match from 'autosuggest-highlight/match';
import parse from 'autosuggest-highlight/parse';
import TextField from '@material-ui/core/TextField';
import Paper from '@material-ui/core/Paper';
import MenuItem from '@material-ui/core/MenuItem';
import Popper from '@material-ui/core/Popper';
import { withStyles } from '@material-ui/core/styles';

function renderInputComponent(inputProps) {
    const { classes, inputRef = () => { }, ref, ...other } = inputProps;

    return (
        <TextField
            fullWidth
            InputProps={{
                inputRef: node => {
                    ref(node);
                    inputRef(node);
                },
                classes: {
                    input: classes.input,
                },
            }}
            {...other}
        />
    );
}

function renderSuggestion(suggestion, { query, isHighlighted }) {
    const matches = match(suggestion.label, query);
    const parts = parse(suggestion.label, matches);

    return (
        <MenuItem selected={isHighlighted} component="div">
            <div>
                {parts.map((part, index) => {
                    return part.highlight ? (
                        <span key={String(index)} style={{ fontWeight: 500 }}>
                            {part.text}
                        </span>
                    ) : (
                            <strong key={String(index)} style={{ fontWeight: 300 }}>
                                {part.text}
                            </strong>
                        );
                })}
            </div>
        </MenuItem>
    );
}

function getSuggestionValue(suggestion) {
    return suggestion.label;
}

const styles = theme => ({

    container: {
        position: 'relative',
    },
    suggestionsContainerOpen: {
        position: 'absolute',
        zIndex: 1,
        marginTop: theme.spacing.unit,
        left: 0,
        right: 0,
    },
    suggestion: {
        display: 'block',
    },
    suggestionsList: {
        margin: 0,
        padding: 0,
        listStyleType: 'none',
    },
    divider: {
        height: theme.spacing.unit * 2,
    },
});

class IntegrationAutosuggest extends React.Component {
    state = {
        single: '',
        popper: this.props.value ? this.props.value : "",
        suggestions: []
    };

    handleSuggestionsFetchRequested = ({ value }) => {
        const inputValue = deburr(value.trim()).toLowerCase();
        const inputLength = inputValue.length;

        if (inputLength === 0) {
            this.setState({
                suggestions: [],
            });
        } else {
            this.props.fetchSuggestions(value, (data) => {
                this.setState({
                    suggestions: data,
                });
            });
        }
    };

    handleSuggestionsClearRequested = () => {
        this.setState({
            suggestions: [],
        });
    };

    handleChange = name => (event, { newValue }) => {
        this.setState({
            [name]: newValue,
        });

        if (this.props.onChange)
            this.props.onChange(newValue);
    };

    render() {
        const { classes } = this.props;
        const autosuggestProps = {
            renderInputComponent,
            suggestions: this.state.suggestions,
            onSuggestionsFetchRequested: this.handleSuggestionsFetchRequested,
            onSuggestionsClearRequested: this.handleSuggestionsClearRequested,
            getSuggestionValue,
            renderSuggestion,
        };
        if (this.props.onSuggestionSelected) {
            autosuggestProps.onSuggestionSelected = this.props.onSuggestionSelected;
        }

        return (
            <Autosuggest
                {...autosuggestProps}
                inputProps={{
                    classes,
                    name: this.props.name,
                    required: this.props.required ? true : false,
                    label: this.props.label,
                    placeholder: this.props.placeholder ? this.props.placeholder : '',
                    value: this.state.popper,
                    onChange: this.handleChange('popper'),
                    inputRef: node => {
                        this.popperNode = node;
                    },
                    InputLabelProps: {
                        shrink: true,
                    },
                }}
                theme={{
                    suggestionsList: classes.suggestionsList,
                    suggestion: classes.suggestion,
                }}
                renderSuggestionsContainer={options => (
                    <Popper anchorEl={this.popperNode} open={Boolean(options.children)}>
                        <Paper
                            square
                            {...options.containerProps}
                            style={{ width: this.popperNode ? this.popperNode.clientWidth : null }}
                        >
                            {options.children}
                        </Paper>
                    </Popper>
                )}
            />
        );
    }
}

IntegrationAutosuggest.propTypes = {
    classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(IntegrationAutosuggest);