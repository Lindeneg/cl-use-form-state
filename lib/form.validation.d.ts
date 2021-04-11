import { FormState, FormValueType, FormStateConstraint } from './form.hook';
export declare enum ValidationType {
    Require = "isRequired",
    MinLength = "minLength",
    MaxLength = "maxLength",
    MinValue = "minValue",
    MaxValue = "maxValue",
    MinUppercaseCharacters = "minUppercaseCharacters",
    MinNumericalSymbols = "minNumericalSymbols",
    CustomRule = "customRule"
}
export declare type CustomValidationRule<T extends FormValueType, S extends FormStateConstraint = any> = (value: T, state: FormState<S>) => boolean;
export declare type ValidationValue = FormValueType | CustomValidationRule<any, any>;
export interface Validator {
    type: ValidationType;
    value: ValidationValue;
}
export declare type ValidationFunc = (value: FormValueType, isValid: boolean, validator: Validator, state: FormState<any>) => boolean;
export declare const getValidator: (type: ValidationType, value: FormValueType) => Validator;
export declare const validate: (value: FormValueType, validators: Validator[], state: FormState<any>) => boolean;
