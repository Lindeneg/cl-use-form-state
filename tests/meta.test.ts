import { getValidationResult } from "./test-util";
import { ValidationType, FormState } from "../src/shared";

test("can getResult create correct validation result", () => {
  const notValidWithOption = getValidationResult("", "", null, [
    ValidationType.Require,
    true,
  ]);
  const validNoOption = getValidationResult("", "", null);
  const validOptions = getValidationResult("hel", "h", null, [
    ValidationType.MaxLength,
    3,
  ]);

  const invalidValidOptions = getValidationResult(
    "hel",
    "hello",
    null,
    [ValidationType.MaxLength, 3],
    [ValidationType.MinLength, 1]
  );
  const invalidInvalidOptions = getValidationResult(
    "h",
    "hello",
    null,
    [ValidationType.MaxLength, 3],
    [ValidationType.MinLength, 2]
  );

  expect(notValidWithOption).toEqual([false, false]);
  expect(validNoOption).toEqual([true, true]);
  expect(validOptions).toEqual([true, true]);
  expect(invalidValidOptions).toEqual([true, false]);
  expect(invalidInvalidOptions).toEqual([false, false]);
});

test("can getResult handle initialState", () => {
  const initialState: FormState<{ testInput: string }> = {
    inputs: {
      testInput: {
        value: "test-input",
        isTouched: false,
        isValid: true,
        validators: [],
        connectedFields: [],
      },
    },
    isValid: true,
  };
  const valid = getValidationResult("", "", initialState, [
    ValidationType.CustomRule,
    (v: any, s: any) =>
      Object.keys(s.inputs).length === 1 &&
      s.isValid &&
      s.inputs.testInput &&
      s.inputs.testInput.isValid &&
      !s.inputs.testInput.isTouched &&
      s.inputs.testInput.value === "test-input",
  ])[0];
  expect(valid).toBe(true);
});
