/// <reference types="react" />
import { Validator, CustomValidationRule } from './form.validation';
declare type FormElementConstraint = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
declare type GetInputOptions<T extends FormValueType, S extends FormStateConstraint = any> = {
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
declare type FormEntryState<T extends FormValueType> = {
    value: T;
    isValid: boolean;
    isTouched: boolean;
    readonly validators: Validator[];
    readonly connectedFields: string[];
};
export declare type FormStateConstraint = {
    [key: string]: FormValueType;
};
export declare type FormValueType = string | number | boolean | File;
export declare type FormState<T extends FormStateConstraint> = {
    inputs: {
        [K in keyof T]: FormEntryState<T[K]>;
    };
    isValid: boolean;
};
export declare function getInput<T extends FormValueType, S extends FormStateConstraint>(initialValue: T, options?: GetInputOptions<T, S>): FormEntryState<T>;
declare function useFormState<S extends FormStateConstraint, E extends FormElementConstraint = HTMLInputElement>(initialState: FormState<S>): {
    formState: FormState<S>;
    onTouchHandler: React.FocusEventHandler<E>;
    onChangeHandler: React.ChangeEventHandler<E>;
    setFormState: (state: FormState<S>) => void;
};
export default useFormState;
