/// <reference types="react" />
import { Validator, CustomValidationRule } from './form.validation';
declare type FormElementConstraint = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | HTMLOptionElement;
declare type FormEntryState<T extends FormValueType> = {
    value: T;
    isValid: boolean;
    isTouched: boolean;
    readonly validators: Validator[];
    readonly connectedFields: string[];
};
export declare type GetInputOptions<T extends FormValueType, S extends FormEntryConstraint = Record<string, FormValueType>> = {
    [key: string]: number | boolean | CustomValidationRule<T, S> | string[] | undefined;
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
export declare type UseForm<S extends FormEntryConstraint> = {
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
export declare type Inputs<T extends FormEntryConstraint> = {
    [K in keyof T]: FormEntryState<T[K]>;
};
export declare type FormValueType = string | string[] | number | boolean | File | undefined | null;
export declare type FormEntryConstraint = {
    [key: string]: FormValueType;
};
export declare type FormState<T extends FormEntryConstraint> = {
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
export declare function getInput<T extends FormValueType, S extends FormEntryConstraint = Record<string, FormValueType>>(initialValue: T, options?: GetInputOptions<T, S>): FormEntryState<T>;
/**
 * React hook for managing the state of a form and its associated inputs.
 *
 * @param initialState - Object with initial FormState or initial Inputs

 * @returns Object of UseForm type with specified properties and types.
 */
declare function useForm<S extends FormEntryConstraint>(initialState: FormState<S> | Inputs<S>): UseForm<S>;
export default useForm;
