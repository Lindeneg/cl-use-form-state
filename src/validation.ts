import {
  FormState,
  InputValueType,
  FormEntryConstraint,
  Validator,
  ValidationValue,
  ValidationType,
} from "./shared";

/**
 * Validation function takes at least two args and at most four and always returns a boolean
 */
export type ValidationFunc<S extends FormEntryConstraint> = (
  value: InputValueType,
  isValid: boolean,
  validator?: Validator,
  state?: FormState<S>
) => boolean;

/**
 * Count something by providing a callback that returns a boolean
 * If callback returns true, the counter is incremented
 *
 * @param target   - Target to count something in
 * @param callback - Function that returns on each element of `target`
 *
 * @returns Number of matches
 */
export function count(
  target: string,
  callback: (entry: string) => boolean
): number {
  let result = 0;
  for (let i = 0; i < target.length; i++) {
    if (callback(target[i])) {
      result++;
    }
  }
  return result;
}

export function countUpperCase(target: string): number {
  return count(target, (e) => e >= "A" && e <= "Z");
}

export function countNumbers(target: string): number {
  return count(target, (e) => {
    const n = parseInt(e);
    return typeof n === "number" && !Number.isNaN(n);
  });
}

/**
 * Check if an input is valid given validation rule(s)
 *
 * @param isValid           - Current input validation state
 * @param value             - Current input value
 * @param validatorValue    - Value used for validation
 * @param callback          - Callback used to validate input
 *
 * @returns Boolean with validity of input
 */
function checkIsValid<T extends InputValueType>(
  isValid: boolean,
  value: InputValueType,
  validatorValue: ValidationValue<InputValueType, FormEntryConstraint>,
  callback: (value: T, rule: number) => boolean
): boolean {
  try {
    if (
      typeof value !== "undefined" &&
      value !== null &&
      typeof validatorValue === "number"
    ) {
      return isValid && callback(value as T, validatorValue);
    }
    return isValid;
  } catch (err) {
    process.env.NODE_ENV === "development" &&
      console.error(
        `cl-use-form-state: an error occurred validating an input: '${err}'.`
      );
  }
  return isValid;
}

/**
 * Object of `ValidationType` keys with `ValidationFunc` values
 */
const validationFunc: {
  [key: string]: ValidationFunc<FormState<FormEntryConstraint>>;
} = {
  [ValidationType.Require]: (value, isValid) => {
    return checkIsValid<any>(isValid, value, 0, (actualValue, rule) => {
      if (Array.isArray(actualValue)) {
        return actualValue.length >= rule;
      }
      return actualValue.toString().trim().length > rule;
    });
  },
  [ValidationType.MinLength]: (value, isValid, validator) => {
    return checkIsValid<string | string[]>(
      isValid,
      value,
      validator?.value,
      (actualValue, rule) => {
        if (Array.isArray(actualValue)) {
          return actualValue.length >= rule;
        }
        return actualValue.toString().trim().length >= rule;
      }
    );
  },
  [ValidationType.MaxLength]: (value, isValid, validator) => {
    return checkIsValid<string | string[]>(
      isValid,
      value,
      validator?.value,
      (actualValue, rule) => {
        if (Array.isArray(actualValue)) {
          return actualValue.length <= rule;
        }
        return actualValue.toString().trim().length <= rule;
      }
    );
  },
  [ValidationType.MinValue]: (value, isValid, validator) => {
    return checkIsValid<string | number>(
      isValid,
      value,
      validator?.value,
      (actualValue, rule) => +actualValue >= rule
    );
  },
  [ValidationType.MaxValue]: (value, isValid, validator) => {
    return checkIsValid<string | number>(
      isValid,
      value,
      validator?.value,
      (actualValue, rule) => +actualValue <= rule
    );
  },
  [ValidationType.MinUppercaseCharacters]: (value, isValid, validator) => {
    return checkIsValid<string>(
      isValid,
      value,
      validator?.value,
      (actualValue, rule) => {
        const uppercaseChars = countUpperCase(actualValue);
        return uppercaseChars >= rule;
      }
    );
  },
  [ValidationType.MaxUppercaseCharacters]: (value, isValid, validator) => {
    return checkIsValid<string>(
      isValid,
      value,
      validator?.value,
      (actualValue, rule) => {
        const uppercaseChars = countUpperCase(actualValue);
        return uppercaseChars <= rule;
      }
    );
  },
  [ValidationType.MinNumericalSymbols]: (value, isValid, validator) => {
    return checkIsValid<string>(
      isValid,
      value,
      validator?.value,
      (actualValue, rule) => {
        const numericalSymbols = countNumbers(actualValue.toString());
        return numericalSymbols >= rule;
      }
    );
  },
  [ValidationType.MaxNumericalSymbols]: (value, isValid, validator) => {
    return checkIsValid<string>(
      isValid,
      value,
      validator?.value,
      (actualValue, rule) => {
        const numericalSymbols = countNumbers(actualValue.toString());
        return numericalSymbols <= rule;
      }
    );
  },
  [ValidationType.CustomRule]: (value, isValid, validator, state) => {
    return (
      isValid &&
      typeof validator?.value === "function" &&
      validator.value(value, state)
    );
  },
};

export const validateState = <S extends FormEntryConstraint>(
  state: FormState<S>
): boolean => {
  let isValid = true;
  for (const key in state.inputs) {
    isValid = isValid && state.inputs[key].isValid;
  }
  return isValid;
};

export const getValidator = (
  type: ValidationType,
  value: ValidationValue<InputValueType, FormEntryConstraint>
): Validator => ({
  type,
  value,
});

export const validate = <S extends FormEntryConstraint>(
  value: unknown,
  validators: Validator[],
  state: FormState<S>
): boolean => {
  let isValid = true;
  validators.forEach((validator) => {
    const func = validationFunc[validator.type] as
      | ValidationFunc<S>
      | undefined;
    if (typeof func !== "undefined") {
      isValid = func(value, isValid, validator, state);
    }
  });
  return isValid;
};
