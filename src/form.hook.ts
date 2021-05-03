import { useReducer, useCallback, Reducer } from 'react';

import {
    Validator,
    ValidationType,
    CustomValidationRule,
    getValidator,
    validate,
    validateState
} from './form.validation';

enum FormAction {
    INPUT_CHANGE = 'INPUT_CHANGE',
    INPUT_TOUCH = 'INPUT_TOUCH',
    SET_FORM = 'SET_FORM'
}

interface FormPayload extends Pick<FormEntryState<FormValueType>, 'value'> {
    readonly id: string;
    readonly state?: FormState<FormEntryConstraint>;
}

type FormElementConstraint =
    | HTMLInputElement
    | HTMLTextAreaElement
    | HTMLSelectElement
    | HTMLOptionElement;

type ReducerAction = { type: FormAction; payload: FormPayload };

/* This is the base for any input entry in a 'formState'. In other words
   all input entries will have these properties available. */
type FormEntryState<T extends FormValueType> = {
    value: T;
    isValid: boolean;
    isTouched: boolean;
    readonly validators: Validator[];
    readonly connectedFields: string[];
};

export type GetInputOptions<
    T extends FormValueType,
    S extends FormEntryConstraint = Record<string, FormValueType>
> = {
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

/* The type of object returned by useForm when initialized. */
export type UseForm<S extends FormEntryConstraint> = {
    /**
     * formState' will always have properties 'inputs' and 'isValid'
     * available while the 'inputs' property, if non-empty, will
     * have keys that yields an object of type FormEntryState
     */
    formState: FormState<S>;

    /**
     * Handles touch events. Can be used with prop 'onBlur', for example:
     *
     * \<input onBlur={onTouchHandler} /\>
     *
     */
    onTouchHandler: React.FocusEventHandler<FormElementConstraint>;

    /**
     * Handles change events. Can be used with prop 'onChange', for example:
     *
     * \<input onChange={onChangeHandler} /\>
     *
     */
    onChangeHandler: React.ChangeEventHandler<FormElementConstraint>;

    /**
     * Overwrite existing inputs by setting new ones:
     *
     * setFormState({
     *     ...newInputs
     * })
     *
     * Or add to current inputs:
     *
     * setFormState({
     *     ...formState.inputs,
     *     ...newInputs
     * })
     *
     * @param state Object with the new FormState
     */
    setFormState: (state: FormState<S> | Inputs<S>) => void;
};

export type Inputs<T extends FormEntryConstraint> = { [K in keyof T]: FormEntryState<T[K]> };

// Supported input vales. Can be extended if need be.
export type FormValueType = string | string[] | number | boolean | File;

/* Property names and types of inputs, for example:
   { password: string; age: number; isHappy: boolean; } */
export type FormEntryConstraint = { [key: string]: FormValueType };

export type FormState<T extends FormEntryConstraint> = {
    inputs: Inputs<T>;
    isValid: boolean;
};

/**
 * Get an object of type FormEntryState by just defining the input type, initial value and options.
 *
 * @param initialValue - initial value of the input entry.
 * @param options      - (optional) options for initial input state and validation
 * @returns Object of type FormEntryState
 */
export function getInput<
    T extends FormValueType,
    S extends FormEntryConstraint = Record<string, FormValueType>
>(initialValue: T, options?: GetInputOptions<T, S>): FormEntryState<T> {
    const parsedOptions: Omit<FormEntryState<T>, 'value'> = {
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
            if (!['isValid', 'isTouched', 'connectedFields'].includes(key)) {
                parsedOptions.validators.push(
                    getValidator(key as ValidationType, options[key] as T)
                );
            }
        });
    }
    return {
        ...parsedOptions,
        value: initialValue
    };
}

/**
 * Handle all connected fields tied to a certain input. This is useful for the following reason:
 *
 * If we have input A and input B and input B is dependent upon input A. Then we'd like to be able to
 * run the validation for input B each time the value of input A changes.
 *
 * @param state   - current FormState where the connected inputs can be found
 * @param targetId - Id of the owning input (input A in the example above)
 * @returns An object with entry keys and their updated object of type FormEntryState
 */
const handleConnectedFields = (
    state: FormState<FormEntryConstraint>,
    targetId: string
): { [key: string]: FormEntryState<FormValueType> } => {
    try {
        const newInputState = { ...state.inputs };
        // find connected fields from the targetId
        newInputState[targetId].connectedFields.forEach((connectedFieldId) => {
            // if the connected field exists
            if (typeof newInputState[connectedFieldId] !== 'undefined') {
                // then validate it given the specified state
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

/**
 * Handle changes to FormState given an action associated with a payload.
 *
 * @param state Object with current FormState
 * @param action FormAction and FormPayload to handle
 * @returns Object with the updated FormState
 */
function formReducer<S extends FormState<FormEntryConstraint>>(state: S, action: ReducerAction): S {
    const pl = action.payload;
    switch (action.type) {
        case FormAction.INPUT_CHANGE:
            try {
                // copy the current state, update the entry with the specified payload Id and validate it.
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
                // copy the inputs and validate connected fields given the now updated state.
                newState.inputs = {
                    ...newState.inputs,
                    ...handleConnectedFields(newState, pl.id)
                };
                // return the updated FormState
                return {
                    ...newState,
                    inputs: {
                        ...newState.inputs
                    },
                    isValid: validateState(newState)
                };
            } catch (err) {
                process.env.NODE_ENV !== 'test' &&
                    console.error(
                        `use-form-state cannot recognize input-id '${pl.id}'. Please make sure that all form input names are tied to a form element, such as <input id='${pl.id}' />.`
                    );
                break;
            }
        case FormAction.INPUT_TOUCH:
            try {
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
            } catch (err) {
                process.env.NODE_ENV !== 'test' &&
                    console.error(
                        `use-form-state cannot recognize input-id '${pl.id}'. Please make sure that all form input names are tied to a form element, such as <input id='${pl.id}' />.`
                    );
                break;
            }
        case FormAction.SET_FORM:
            if (typeof pl.state !== 'undefined') {
                return { ...(pl.state as S) };
            } else {
                return state;
            }
        default:
            break;
    }
    return state;
}

function getState<S extends FormEntryConstraint>(
    initialState: FormState<S> | Inputs<S>
): FormState<S> {
    let state: FormState<S>;
    if (
        Object.keys(initialState).length === 2 &&
        typeof initialState.inputs !== 'undefined' &&
        typeof initialState.isValid !== 'undefined'
    ) {
        state = { ...(initialState as FormState<S>) };
    } else {
        state = {
            inputs: { ...(initialState as Inputs<S>) },
            isValid: false
        };
        state.isValid = validateState(state);
    }
    return state;
}

/**
 * React hook for managing the state of a form and its associated inputs.
 *
 * @param initialState - Object with initial FormState or initial Inputs

 * @returns Object of UseForm type with specified properties and types.
 */
function useForm<S extends FormEntryConstraint>(
    initialState: FormState<S> | Inputs<S>
): UseForm<S> {
    const [formState, dispatch] = useReducer<Reducer<FormState<S>, ReducerAction>>(formReducer, {
        ...getState(initialState)
    });

    const setFormState = useCallback((state: FormState<S> | Inputs<S>): void => {
        dispatch({
            type: FormAction.SET_FORM,
            payload: { state: { ...getState(state) }, value: '', id: '' }
        });
    }, []);

    const onTouchHandler: React.FocusEventHandler<FormElementConstraint> = useCallback((event) => {
        dispatch({ type: FormAction.INPUT_TOUCH, payload: { id: event.target.id, value: '' } });
    }, []);

    const onChangeHandler: React.ChangeEventHandler<FormElementConstraint> = useCallback(
        (event) => {
            dispatch({
                type: FormAction.INPUT_CHANGE,
                payload: {
                    id: event.target.id,
                    value: event.target.value
                }
            });
        },
        []
    );

    return { formState, onChangeHandler, onTouchHandler, setFormState };
}

export default useForm;
