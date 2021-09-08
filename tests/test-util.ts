import { GetInputOptions } from "../src/form.hook";
import {
  FormState,
  InputValueType,
  ValidationType,
  Validator,
  ValidationValue,
  FormEntryConstraint,
} from "../src/form.shared";
import { validate, getValidator } from "../src/form.validation";

export type TestInputState = {
  age: number;
  username: string;
  password: string;
  confirmPassword?: string;
};

export type MetaState = {
  key: keyof TestInputState;
  value: unknown;
  options: GetInputOptions<unknown, TestInputState>;
};

export const getEmptyState = (): FormState<FormEntryConstraint> => ({
  inputs: {},
  isValid: false,
});

export const getState = (
  description: string,
  type: "initial" | "valid" | "invalid"
): {
  description: string;
  valid: boolean;
  inputs: Array<{
    key: string;
    value: unknown;
    options: GetInputOptions<unknown, TestInputState>;
  }>;
} => ({
  description,
  valid: type === "valid",
  inputs: [
    {
      key: "age",
      value: 25,
      options: { isValid: true, minValue: type === "initial" ? 10 : 18 },
    },
    {
      key: "username",
      value: type === "valid" ? "hello" : "",
      options: {
        minLength: 5,
        maxLength: 12,
        maxNumericalSymbols: 0,
        isValid: type === "valid",
      },
    },
    {
      key: "password",
      value: type === "valid" ? "helloT5" : "",
      options: {
        minLength: 8,
        maxLength: 20,
        minNumericalSymbols: 1,
        minUppercaseCharacters: 1,
        connectFields: ["confirmPassword"],
        isValid: type === "valid",
      },
    },
  ],
});

export const getValidationResult = (
  validValue: InputValueType,
  invalidValue: InputValueType,
  state: FormState<FormEntryConstraint> | null,
  ...validatorsTypes: Array<[ValidationType, ValidationValue<any, any>]>
): [boolean, boolean] => {
  const currentState = state !== null ? state : getEmptyState();
  const validators: Validator[] = validatorsTypes.map((e) =>
    getValidator(e[0], e[1])
  );
  return [
    validate(validValue, validators, currentState),
    validate(invalidValue, validators, currentState),
  ];
};
