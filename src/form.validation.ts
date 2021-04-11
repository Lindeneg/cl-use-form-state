import { FormState, FormValueType, FormStateConstraint } from './form.hook';

export enum ValidationType {
    Require = 'isRequired',
    MinLength = 'minLength',
    MaxLength = 'maxLength',
    MinValue = 'minValue',
    MaxValue = 'maxValue',
    MinUppercaseCharacters = 'minUppercaseCharacters',
    MinNumericalSymbols = 'minNumericalSymbols',
    // TODO make the 'max' version of the two above types
    CustomRule = 'customRule'
}

export type CustomValidationRule<T extends FormValueType, S extends FormStateConstraint = any> = (
    value: T,
    state: FormState<S>
) => boolean;

export type ValidationValue = FormValueType | CustomValidationRule<any, any>;

export interface Validator {
    type: ValidationType;
    value: ValidationValue;
}

export type ValidationFunc = (
    value: FormValueType,
    isValid: boolean,
    validator: Validator,
    state: FormState<any>
) => boolean;

const validationFunc: { [key: string]: ValidationFunc } = {
    [ValidationType.Require]: (value, isValid) => {
        return isValid && value.toString().trim().length > 0;
    },
    [ValidationType.MinLength]: (value, isValid, validator) => {
        return isValid && value.toString().trim().length >= validator.value;
    },
    [ValidationType.MaxLength]: (value, isValid, validator) => {
        return isValid && value.toString().trim().length <= validator.value;
    },
    [ValidationType.MinValue]: (value, isValid, validator) => {
        return isValid && +value >= validator.value;
    },
    [ValidationType.MaxValue]: (value, isValid, validator) => {
        return isValid && +value <= validator.value;
    },
    [ValidationType.MinUppercaseCharacters]: (value, isValid, validator) => {
        let uppercaseChars: number = 0;
        const stringifiedValue = value.toString();
        for (let i = 0; i < stringifiedValue.length; i++) {
            let e = stringifiedValue[i];
            if (e >= 'A' && e <= 'Z') {
                uppercaseChars++;
            }
        }
        return isValid && uppercaseChars >= (validator.value || 0);
    },
    [ValidationType.MinNumericalSymbols]: (value, isValid, validator) => {
        let numericalSymbols: number = 0;
        const stringifiedValue = value.toString();
        for (let i = 0; i < stringifiedValue.length; i++) {
            let n = parseInt(stringifiedValue[i]);
            if (typeof n === 'number' && !Number.isNaN(n)) {
                numericalSymbols++;
            }
        }
        return isValid && numericalSymbols >= (validator.value || 0);
    },
    [ValidationType.CustomRule]: (value, isValid, validator, state) => {
        return isValid && typeof validator.value === 'function' && validator.value(value, state);
    }
};

export const getValidator = (type: ValidationType, value: FormValueType): Validator => ({ type, value });

export const validate = (value: FormValueType, validators: Validator[], state: FormState<any>): boolean => {
    let isValid: boolean = true;
    validators.forEach((validator) => {
        const func: ValidationFunc | undefined = validationFunc[validator.type];
        if (typeof func !== 'undefined') {
            isValid = func(value, isValid, validator, state);
        }
    });
    return isValid;
};
