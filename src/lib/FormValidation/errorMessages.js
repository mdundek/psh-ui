'use strict';

const defaultMessages = {
    // English language - Used by default
    en: {
        numbers: 'Invalide number.',
        email: 'Invalide email address.',
        required: 'This field is mandatory.',
        date: 'Invalide date ({1}).',
        minlength: 'length must be greater than {1}.',
        maxlength: 'Length must be lower than {1}.',
        passwordMatch: 'The passwords do not match.'
    },
    // French language
    fr: {
        numbers: 'Nombre invalide',
        email: 'Adresse email invalide',
        required: 'Champ obligatoire.',
        date: 'Date invalide ({1}).',
        minlength: 'Le nombre de caractère doit être supérieur à {1}.',
        maxlength: 'Le nombre de caractère doit être inférieur à {1}.',
        passwordMatch: 'Les mot de passe ne sont pas egaux.'
    }
};

export default defaultMessages;