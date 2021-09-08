import {
  FormState,
  InputValueType,
  FormEntryConstraint,
  Validator,
  ValidationValue,
  ValidationType,
} from "./form.shared";

/**
 * `Enum` of supported form actions. Can be extended but
 * should cover the majority of use-cases for a form.
 */
export type ValidationFunc<S extends FormEntryConstraint> = (
  value: InputValueType,
  isValid: boolean,
  validator?: Validator,
  state?: FormState<S>
) => boolean;

export const count = (
  target: string,
  callback: (entry: string) => boolean
): number => {
  let result = 0;
  for (let i = 0; i < target.length; i++) {
    if (callback(target[i])) {
      result++;
    }
  }
  return result;
};

export const countUpperCase = (target: string): number => {
  return count(target, (e) => e >= "A" && e <= "Z");
};

export const countNumbers = (target: string): number => {
  return count(target, (e) => {
    const n = parseInt(e);
    return typeof n === "number" && !Number.isNaN(n);
  });
};

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
 * `Enum` of supported form actions. Can be extended but
 * should cover the majority of use-cases for a form.
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
