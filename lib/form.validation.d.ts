import { FormState, FormValueType, FormEntryConstraint } from './form.hook';
export declare enum ValidationType {
    Require = "isRequired",
    MinLength = "minLength",
    MaxLength = "maxLength",
    MinValue = "minValue",
    MaxValue = "maxValue",
    MinUppercaseCharacters = "minUppercaseCharacters",
    MaxUppercaseCharacters = "maxUppercaseCharacters",
    MinNumericalSymbols = "minNumericalSymbols",
    MaxNumericalSymbols = "maxNumericalSymbols",
    CustomRule = "customRule"
}
export declare type CustomValidationRule<T extends FormValueType, S extends FormEntryConstraint = any> = (value: T, state: FormState<S>) => boolean;
export declare type ValidationValue = FormValueType | CustomValidationRule<any, any>;
export interface Validator {
    type: ValidationType;
    value: ValidationValue;
}
export declare type ValidationFunc = (value: FormValueType, isValid: boolean, validator: Validator, state: FormState<any>) => boolean;
export declare const count: (target: string, callback: (entry: string) => boolean) => number;
export declare const countUpperCase: (target: string) => number;
export declare const countNumbers: (target: string) => number;
export declare const getValidator: (type: ValidationType, value: ValidationValue) => Validator;
export declare const validate: (value: FormValueType, validators: Validator[], state: FormState<any>) => boolean;
