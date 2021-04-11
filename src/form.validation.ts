import { FormState, FormValueType, FormStateConstraint } from './form.hook';

export enum ValidationType {
    Require = 'isRequired',
    MinLength = 'minLength',
    MaxLength = 'maxLength',
    MinValue = 'minValue',
    MaxValue = 'maxValue',
    MinUppercaseCharacters = 'minUppercaseCharacters',
    MaxUppercaseCharacters = 'maxUppercaseCharacters',
    MinNumericalSymbols = 'minNumericalSymbols',
    MaxNumericalSymbols = 'maxNumericalSymbols',
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

const count = (target: string, callback: (entry: string) => boolean): number => {
    let result = 0;
    for (let i = 0; i < target.length; i++) {
        if (callback(target[i])) {
            result++;
        }
    }
    return result;
};

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
        const uppercaseChars: number = count(value.toString(), (e) => e >= 'A' && e <= 'Z');
        return isValid && uppercaseChars >= validator.value;
    },
    [ValidationType.MaxUppercaseCharacters]: (value, isValid, validator) => {
        const uppercaseChars: number = count(value.toString(), (e) => e >= 'A' && e <= 'Z');
        return isValid && uppercaseChars <= validator.value;
    },
    [ValidationType.MinNumericalSymbols]: (value, isValid, validator) => {
        const numericalSymbols: number = count(value.toString(), (e) => {
            const n = parseInt(e);
            return typeof n === 'number' && !Number.isNaN(n);
        });
        return isValid && numericalSymbols >= validator.value;
    },
    [ValidationType.MaxNumericalSymbols]: (value, isValid, validator) => {
        const numericalSymbols: number = count(value.toString(), (e) => {
            const n = parseInt(e);
            return typeof n === 'number' && !Number.isNaN(n);
        });
        return isValid && numericalSymbols <= validator.value;
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
