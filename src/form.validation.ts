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
export type CustomValidationRule<T extends FormValueType, S extends FormEntryConstraint> = (
    value: T,
    state: FormState<S>
) => boolean;

export type ValidationValue<T extends FormValueType, S extends FormEntryConstraint> =
    | FormValueType
    | CustomValidationRule<T, S>;

export interface Validator {
    type: ValidationType;
    value: ValidationValue<FormValueType, FormEntryConstraint>;
}

export type ValidationFunc = (
    value: FormValueType,
    isValid: boolean,
    validator: Validator,
    state: FormState<FormEntryConstraint>
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

function checkIsValid<T extends FormValueType>(
    isValid: boolean,
    value: FormValueType,
    validatorValue: ValidationValue<FormValueType, FormEntryConstraint>,
    callback: (value: T, rule: number) => boolean
): boolean {
    if (typeof value !== 'undefined' && value !== null && typeof validatorValue === 'number') {
        return isValid && callback(value as T, validatorValue);
    }
    return isValid;
}

const validationFunc: { [key: string]: ValidationFunc } = {
    [ValidationType.Require]: (value, isValid) => {
        if (Array.isArray(value)) {
            return value.length > 0;
        }
        return (
            isValid &&
            typeof value !== 'undefined' &&
            value !== null &&
            value.toString().trim().length > 0
        );
    },
    [ValidationType.MinLength]: (value, isValid, validator) => {
        return checkIsValid<string | string[]>(
            isValid,
            value,
            validator.value,
            (actualValue, rule) => {
                if (Array.isArray(actualValue)) {
                    return actualValue.length >= rule;
                }
                return actualValue.toString().trim().length >= rule;
            }
        );
    },
    [ValidationType.MaxLength]: (value, isValid, validator) => {
        return checkIsValid<string | string[]>(
            isValid,
            value,
            validator.value,
            (actualValue, rule) => {
                if (Array.isArray(actualValue)) {
                    return actualValue.length <= rule;
                }
                return actualValue.toString().trim().length <= rule;
            }
        );
    },
    [ValidationType.MinValue]: (value, isValid, validator) => {
        return checkIsValid<string | number>(
            isValid,
            value,
            validator.value,
            (actualValue, rule) => +actualValue >= rule
        );
    },
    [ValidationType.MaxValue]: (value, isValid, validator) => {
        return checkIsValid<string | number>(
            isValid,
            value,
            validator.value,
            (actualValue, rule) => +actualValue <= rule
        );
    },
    [ValidationType.MinUppercaseCharacters]: (value, isValid, validator) => {
        return checkIsValid<string>(isValid, value, validator.value, (actualValue, rule) => {
            const uppercaseChars = countUpperCase(actualValue);
            return uppercaseChars >= rule;
        });
    },
    [ValidationType.MaxUppercaseCharacters]: (value, isValid, validator) => {
        return checkIsValid<string>(isValid, value, validator.value, (actualValue, rule) => {
            const uppercaseChars = countUpperCase(actualValue);
            return uppercaseChars <= rule;
        });
    },
    [ValidationType.MinNumericalSymbols]: (value, isValid, validator) => {
        return checkIsValid<string>(isValid, value, validator.value, (actualValue, rule) => {
            const numericalSymbols = countNumbers(actualValue.toString());
            return numericalSymbols >= rule;
        });
    },
    [ValidationType.MaxNumericalSymbols]: (value, isValid, validator) => {
        return checkIsValid<string>(isValid, value, validator.value, (actualValue, rule) => {
            const numericalSymbols = countNumbers(actualValue.toString());
            return numericalSymbols <= rule;
        });
    },
    [ValidationType.CustomRule]: (value, isValid, validator, state) => {
        return isValid && typeof validator.value === 'function' && validator.value(value, state);
    }
};

export const validateState = (state: FormState<FormEntryConstraint>): boolean => {
    let isValid = true;
    for (const key in state.inputs) {
        isValid = isValid && state.inputs[key].isValid;
    }
    return isValid;
};

export const getValidator = (
    type: ValidationType,
    value: ValidationValue<FormValueType, FormEntryConstraint>
): Validator => ({
    type,
    value
});

export const validate = (
    value: FormValueType,
    validators: Validator[],
    state: FormState<FormEntryConstraint>
): boolean => {
    let isValid = true;
    validators.forEach((validator) => {
        const func: ValidationFunc | undefined = validationFunc[validator.type];
        if (typeof func !== 'undefined') {
            isValid = func(value, isValid, validator, state);
        }
    });
    return isValid;
};
