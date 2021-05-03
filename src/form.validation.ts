import { FormState, FormValueType, FormEntryConstraint } from './form.hook';

/* Predefined validation options. However, a custom rule, which takes a function, can be created
   and thus any validation rule that is desired, can be created. */
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

/* Function that is tied to a custom rule. Must return a boolean and will always receive two arguments: 
   value: current value of the input field where this custom rule is tied 
   state: the most updated state of the entire form. */
export type CustomValidationRule<T extends FormValueType, S extends FormEntryConstraint = any> = (
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

export const count = (target: string, callback: (entry: string) => boolean): number => {
    let result = 0;
    for (let i = 0; i < target.length; i++) {
        if (callback(target[i])) {
            result++;
        }
    }
    return result;
};

export const countUpperCase = (target: string): number => {
    return count(target, (e) => e >= 'A' && e <= 'Z');
};

export const countNumbers = (target: string): number => {
    return count(target, (e) => {
        const n = parseInt(e);
        return typeof n === 'number' && !Number.isNaN(n);
    });
};

const validationFunc: { [key: string]: ValidationFunc } = {
    [ValidationType.Require]: (value, isValid) => {
        return isValid && value.toString().trim().length > 0;
    },
    [ValidationType.MinLength]: (value, isValid, validator) => {
        if (Array.isArray(value)) {
            return isValid && value.length >= validator.value;
        }
        return isValid && value.toString().trim().length >= validator.value;
    },
    [ValidationType.MaxLength]: (value, isValid, validator) => {
        if (Array.isArray(value)) {
            return isValid && value.length <= validator.value;
        }
        return isValid && value.toString().trim().length <= validator.value;
    },
    [ValidationType.MinValue]: (value, isValid, validator) => {
        return isValid && +value >= validator.value;
    },
    [ValidationType.MaxValue]: (value, isValid, validator) => {
        return isValid && +value <= validator.value;
    },
    [ValidationType.MinUppercaseCharacters]: (value, isValid, validator) => {
        const uppercaseChars: number = countUpperCase(value.toString());
        return isValid && uppercaseChars >= validator.value;
    },
    [ValidationType.MaxUppercaseCharacters]: (value, isValid, validator) => {
        const uppercaseChars: number = countUpperCase(value.toString());
        return isValid && uppercaseChars <= validator.value;
    },
    [ValidationType.MinNumericalSymbols]: (value, isValid, validator) => {
        const numericalSymbols: number = countNumbers(value.toString());
        return isValid && numericalSymbols >= validator.value;
    },
    [ValidationType.MaxNumericalSymbols]: (value, isValid, validator) => {
        const numericalSymbols: number = countNumbers(value.toString());
        return isValid && numericalSymbols <= validator.value;
    },
    [ValidationType.CustomRule]: (value, isValid, validator, state) => {
        return isValid && typeof validator.value === 'function' && validator.value(value, state);
    }
};

export const validateState = (state: FormState<any>): boolean => {
    let isValid: boolean = true;
    for (const key in state.inputs) {
        isValid = isValid && state.inputs[key].isValid;
    }
    return isValid;
};

export const getValidator = (type: ValidationType, value: ValidationValue): Validator => ({ type, value });

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
