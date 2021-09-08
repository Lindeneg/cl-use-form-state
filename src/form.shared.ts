/**
 * In theory, the input value could be anything
 * so `unknown` is the most appropriate type here.
 * Once the hook gets used, we're able to infer the
 * correct input type given an input key.
 */
export type InputValueType = unknown;

/**
 * Property names and types of `inputs`, for example:
 * `{ password: string; age: number; isHappy: boolean; }`
 */
export type FormEntryConstraint = { [key: string]: InputValueType };

/**
 * `inputs` contains `string` keys with `FormEntryState` values.
 * `isValid` is only true if all form `inputs` are valid
 */
export type FormState<T extends FormEntryConstraint> = {
  inputs: Inputs<T>;
  isValid: boolean;
};

/**
 * Mapped type of `string` keys with `FormEntryState` values
 */
export type Inputs<T extends FormEntryConstraint> = {
  [K in keyof T]: FormEntryState<T[K] extends File ? T[K] | null : T[K], T>;
};

/**
 * This is the base for any input entry in a `formState`. In other words
 * all input entries will have these properties available.
 */
export type FormEntryState<
  T extends InputValueType,
  S extends FormEntryConstraint
> = {
  value: T;
  isValid: boolean;
  isTouched: boolean;
  readonly validators: Validator[];
  readonly connectedFields: KeyOf<S>[];
};

/**
 * Function that is tied to a custom rule. Must return
 * a `boolean` and will always receive two arguments:
 * `value`: current value of the input field where this custom rule is tied
 * `state`: the most updated state of the entire form.
 */
export type CustomValidationRule<
  T extends InputValueType,
  S extends FormEntryConstraint
> = (value: T, state: FormState<S>) => boolean;

/**
 * The validation value will either be the input value or a custom rule function.
 */
export type ValidationValue<
  T extends InputValueType,
  S extends FormEntryConstraint
> = T | CustomValidationRule<T, S>;

/**
 * Predefined validation options. However, a custom rule, which takes a function
 * can be created and thus any validation rule that is desired, can be created.
 */
export enum ValidationType {
  Require = "isRequired",
  MinLength = "minLength",
  MaxLength = "maxLength",
  MinValue = "minValue",
  MaxValue = "maxValue",
  MinUppercaseCharacters = "minUppercaseCharacters",
  MaxUppercaseCharacters = "maxUppercaseCharacters",
  MinNumericalSymbols = "minNumericalSymbols",
  MaxNumericalSymbols = "maxNumericalSymbols",
  CustomRule = "customRule",
}

/**
 * `ValidationType` determines how the `value` is handled.
 */
export interface Validator {
  type: ValidationType;
  value: ValidationValue<InputValueType, FormEntryConstraint>;
}

/**
 * Mapped type of the input keys
 */
export type KeyOf<
  S extends FormEntryConstraint,
  T extends keyof Inputs<S> = keyof S
> = T;

/**
 * Validation options for `getInput` function.
 */
export type GetInputOptions<
  T extends InputValueType,
  S extends FormEntryConstraint
> = {
  [key: string]:
    | number
    | boolean
    | CustomValidationRule<T, S>
    | KeyOf<S>[]
    | undefined;
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
  connectFields?: KeyOf<S>[];
};
