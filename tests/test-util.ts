import { FormState, FormValueType, Inputs, getInput } from '../src/form.hook';
import { validate, getValidator, ValidationType, Validator, ValidationValue } from '../src/form.validation';

export type TestInputState = {
    age: number;
    username: string;
    password: string;
    confirmPassword?: string;
};

export const getEmptyState = (): FormState<any> => ({ inputs: {}, isValid: false });

export const getInitialInvalidInputs = (): Inputs<TestInputState> => ({
    age: getInput<number>(25, { isValid: true, minValue: 18 }),
    username: getInput<string>('', { minLength: 5, maxLength: 12, maxNumericalSymbols: 0 }),
    password: getInput<string>('', {
        minLength: 8,
        maxLength: 20,
        minNumericalSymbols: 1,
        minUppercaseCharacters: 1,
        connectFields: ['confirmPassword']
    })
});

export const getInitialValidInputs = (): Inputs<TestInputState> => ({
    age: getInput<number>(25, { isValid: true, minValue: 18 }),
    username: getInput<string>('hello', { isValid: true, minLength: 5, maxLength: 12, maxNumericalSymbols: 0 }),
    password: getInput<string>('helloT5', {
        isValid: true,
        minLength: 8,
        maxLength: 20,
        minNumericalSymbols: 1,
        minUppercaseCharacters: 1
    })
});

export const getInitialState = (): FormState<TestInputState> => ({
    inputs: {
        age: getInput<number>(25, { isValid: true, minValue: 18 }),
        username: getInput<string>('', { minLength: 5, maxLength: 12, maxNumericalSymbols: 0 }),
        password: getInput<string>('', {
            minLength: 8,
            maxLength: 20,
            minNumericalSymbols: 1,
            minUppercaseCharacters: 1,
            connectFields: ['confirmPassword']
        })
    },
    isValid: false
});

export const getConfirmedState = (): FormState<TestInputState> => {
    const state = getInitialState();
    return {
        ...state,
        inputs: {
            ...state.inputs,
            confirmPassword: getInput<string, TestInputState>('', {
                customRule: (value, state) => {
                    return state.inputs.password.isValid && state.inputs.password.value === value;
                }
            })
        },
        isValid: state.isValid
    };
};

export const getConfirmedInputs = (): Inputs<TestInputState> => {
    const inputs = getInitialInvalidInputs();
    return {
        ...inputs,
        confirmPassword: getInput<string, TestInputState>('', {
            customRule: (value, state) => {
                return state.inputs.password.isValid && state.inputs.password.value === value;
            }
        })
    };
};

export const getValidationResult = (
    validValue: FormValueType,
    invalidValue: FormValueType,
    state: FormState<any> | null,
    ...validatorsTypes: Array<[ValidationType, ValidationValue]>
): [boolean, boolean] => {
    const currentState = state !== null ? state : getEmptyState();
    const validators: Validator[] = validatorsTypes.map((e) => getValidator(e[0], e[1]));
    return [validate(validValue, validators, currentState), validate(invalidValue, validators, currentState)];
};
