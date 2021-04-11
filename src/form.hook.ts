import { useReducer, useCallback, Reducer } from 'react';

import { Validator, ValidationType, CustomValidationRule, getValidator, validate } from './form.validation';

enum FormAction {
    INPUT_CHANGE = 'INPUT_CHANGE',
    INPUT_TOUCH = 'INPUT_TOUCH',
    SET_FORM = 'SET_FORM'
}

type FormElementConstraint = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

type ReducerAction = { type: FormAction; payload: FormPayload };

type GetInputOptions<T extends FormValueType, S extends FormStateConstraint = any> = {
    [key: string]: T | number | boolean | CustomValidationRule<T, S> | string[] | undefined;
    minLength?: number;
    maxLength?: number;
    minValue?: number;
    maxValue?: number;
    minUppercaseCharacters?: number;
    maxUppercaseCharacters?: number;
    minNumericalSymbols?: number;
    maxNumericalSymbols?: number;
    isRequired?: boolean;
    isValid?: boolean;
    isTouched?: boolean;
    customRule?: CustomValidationRule<T, S>;
    connectFields?: string[];
};

type FormEntryState<T extends FormValueType> = {
    value: T;
    isValid: boolean;
    isTouched: boolean;
    readonly validators: Validator[];
    readonly connectedFields: string[];
};

interface FormPayload extends Pick<FormEntryState<any>, 'value'> {
    readonly id: string;
    readonly state?: FormState<any>;
}

export type FormStateConstraint = { [key: string]: FormValueType };

export type FormValueType = string | number | boolean | File;

export type FormState<T extends FormStateConstraint> = {
    inputs: { [K in keyof T]: FormEntryState<T[K]> };
    isValid: boolean;
};

export function getInput<T extends FormValueType, S extends FormStateConstraint>(
    initialValue: T,
    options?: GetInputOptions<T, S>
): FormEntryState<T> {
    const parsedOptions: Pick<FormEntryState<T>, 'validators' | 'isValid' | 'isTouched' | 'connectedFields'> = {
        isValid: false,
        isTouched: false,
        validators: [],
        connectedFields: options?.connectFields || []
    };
    if (typeof options !== 'undefined') {
        const keys = Object.keys(options);
        parsedOptions.isTouched = !!options.isTouched;
        parsedOptions.isValid = !!options.isValid;
        keys.forEach((key) => {
            if (!(key in ['isValid', 'isTouched', 'connectedFields'])) {
                parsedOptions.validators.push(getValidator(key as ValidationType, options[key] as T));
            }
        });
    }
    return {
        ...parsedOptions,
        value: initialValue
    };
}

const handleConnectedFields = (state: FormState<any>, targetId: string): { [key: string]: FormEntryState<any> } => {
    try {
        const newInputState = { ...state.inputs };
        newInputState[targetId].connectedFields.forEach((connectedFieldId) => {
            if (typeof newInputState[connectedFieldId] !== 'undefined') {
                newInputState[connectedFieldId] = {
                    ...newInputState[connectedFieldId],
                    isValid: validate(
                        newInputState[connectedFieldId].value,
                        newInputState[connectedFieldId].validators,
                        state
                    )
                };
            }
        });
        return newInputState;
    } catch (err) {
        process.env.NODE_ENV !== 'production' && console.error(err);
        return state.inputs;
    }
};

function formReducer<S extends FormState<any>>(state: S, action: ReducerAction): S {
    const pl = action.payload;
    switch (action.type) {
        case FormAction.INPUT_CHANGE:
            const newState: S = {
                ...state,
                inputs: {
                    ...state.inputs,
                    [pl.id]: {
                        ...state.inputs[pl.id],
                        value: pl.value,
                        isValid: validate(pl.value, state.inputs[pl.id].validators, state)
                    }
                }
            };
            newState.inputs = {
                ...newState.inputs,
                ...handleConnectedFields({ ...newState }, pl.id)
            };
            let isValid: boolean = true;
            for (const key in newState.inputs) {
                isValid = isValid && newState.inputs[key].isValid;
            }
            return {
                ...newState,
                inputs: {
                    ...newState.inputs
                },
                isValid
            };
        case FormAction.INPUT_TOUCH:
            return {
                ...state,
                inputs: {
                    ...state.inputs,
                    [pl.id]: {
                        ...state.inputs[pl.id],
                        isTouched: true
                    }
                }
            };
        case FormAction.SET_FORM:
            if (typeof pl.state !== 'undefined') {
                return { ...(pl.state as S) };
            } else {
                return state;
            }
        default:
            return state;
    }
}

function useFormState<S extends FormStateConstraint, E extends FormElementConstraint = HTMLInputElement>(
    initialState: FormState<S>
): {
    formState: FormState<S>;
    onTouchHandler: React.FocusEventHandler<E>;
    onChangeHandler: React.ChangeEventHandler<E>;
    setFormState: (state: FormState<S>) => void;
} {
    const [formState, dispatch] = useReducer<Reducer<FormState<S>, ReducerAction>>(formReducer, {
        ...initialState
    });

    const setFormState = useCallback((state: FormState<S>): void => {
        dispatch({ type: FormAction.SET_FORM, payload: { state, value: '', id: '' } });
    }, []);

    const onTouchHandler: React.FocusEventHandler<E> = useCallback((event) => {
        dispatch({ type: FormAction.INPUT_TOUCH, payload: { id: event.target.id, value: '' } });
    }, []);

    const onChangeHandler: React.ChangeEventHandler<E> = useCallback((event) => {
        dispatch({
            type: FormAction.INPUT_CHANGE,
            payload: {
                id: event.target.id,
                value: event.target.value
            }
        });
    }, []);

    return { formState, onChangeHandler, onTouchHandler, setFormState };
}

export default useFormState;
