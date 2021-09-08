import { useReducer, useCallback, Reducer } from "react";
import {
  FormState,
  FormEntryConstraint,
  FormEntryState,
  InputValueType,
  Inputs,
  ValidationType,
  CustomValidationRule,
} from "./form.shared";
import { getValidator, validate, validateState } from "./form.validation";

enum FormAction {
  INPUT_CHANGE = "INPUT_CHANGE",
  INPUT_TOUCH = "INPUT_TOUCH",
  SET_FORM = "SET_FORM",
}

interface FormPayload<S extends FormEntryConstraint, T extends keyof Inputs<S>>
  extends Pick<FormEntryState<InputValueType>, "value"> {
  readonly id: T;
  readonly state?: FormState<FormEntryConstraint>;
}

type FormElementConstraint =
  | HTMLInputElement
  | HTMLTextAreaElement
  | HTMLSelectElement
  | HTMLOptionElement;

type ReducerAction<S extends FormEntryConstraint, T extends keyof Inputs<S>> = {
  type: FormAction;
  payload: FormPayload<S, T>;
};

export type GetInputOptions<
  T extends InputValueType,
  S extends FormEntryConstraint
> = {
  [key: string]:
    | number
    | boolean
    | CustomValidationRule<T, S>
    | string[]
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
  connectFields?: string[];
};

/**
 * Get an object of type FormEntryState by just defining the input type, initial value and options.
 *
 * @param initialValue - initial value of the input entry.
 * @param options      - (optional) options for initial input state and validation
 * @returns Object of type FormEntryState
 */
export function getInput<
  T extends InputValueType,
  S extends FormEntryConstraint
>(initialValue: T, options?: GetInputOptions<T, S>): FormEntryState<T> {
  const parsedOptions: Omit<FormEntryState<T>, "value"> = {
    isValid: false,
    isTouched: false,
    validators: [],
    connectedFields: options?.connectFields || [],
  };
  if (typeof options !== "undefined") {
    const keys = Object.keys(options);
    parsedOptions.isTouched = !!options.isTouched;
    parsedOptions.isValid = !!options.isValid;
    keys.forEach((key) => {
      if (!["isValid", "isTouched", "connectedFields"].includes(key)) {
        parsedOptions.validators.push(
          getValidator(key as ValidationType, options[key] as T)
        );
      }
    });
  }
  return {
    ...parsedOptions,
    value: initialValue,
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
): { [key: string]: FormEntryState<InputValueType> } => {
  try {
    const newInputState = { ...state.inputs };
    // find connected fields from the targetId
    newInputState[targetId].connectedFields.forEach((connectedFieldId) => {
      // if the connected field exists
      if (typeof newInputState[connectedFieldId] !== "undefined") {
        // then validate it given the specified state
        newInputState[connectedFieldId] = {
          ...newInputState[connectedFieldId],
          isValid: validate(
            newInputState[connectedFieldId].value,
            newInputState[connectedFieldId].validators,
            state
          ),
        };
      }
    });
    return newInputState;
  } catch (err) {
    process.env.NODE_ENV !== "production" && console.error(err);
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
function formReducer<S extends FormState<FormEntryConstraint>>(
  state: S,
  action: ReducerAction<S, any>
): S {
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
              isValid: validate<InputValueType, S>(
                pl.value,
                state.inputs[pl.id].validators,
                state
              ),
            },
          },
        };
        // copy the inputs and validate connected fields given the now updated state.
        newState.inputs = {
          ...newState.inputs,
          ...handleConnectedFields(newState, pl.id),
        };
        // return the updated FormState
        return {
          ...newState,
          inputs: {
            ...newState.inputs,
          },
          isValid: validateState(newState),
        };
      } catch (err) {
        process.env.NODE_ENV !== "test" &&
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
              isTouched: true,
            },
          },
        };
      } catch (err) {
        process.env.NODE_ENV !== "test" &&
          console.error(
            `use-form-state cannot recognize input-id '${pl.id}'. Please make sure that all form input names are tied to a form element, such as <input id='${pl.id}' />.`
          );
        break;
      }
    case FormAction.SET_FORM:
      if (typeof pl.state !== "undefined") {
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
    typeof initialState.inputs !== "undefined" &&
    typeof initialState.isValid !== "undefined"
  ) {
    state = { ...(initialState as FormState<S>) };
  } else {
    state = {
      inputs: { ...(initialState as Inputs<S>) },
      isValid: false,
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
export function useForm<S extends FormEntryConstraint>(
  initialState: (
    createInput: <T extends InputValueType>(
      initialValue: T,
      options?: GetInputOptions<T, S>
    ) => FormEntryState<T>
  ) => FormState<S> | Inputs<S>
) {
  const [formState, dispatch] = useReducer<
    Reducer<FormState<S>, ReducerAction<S, any>>
  >(formReducer, {
    ...getState(initialState(getInput)),
  });

  const { inputs, isValid } = formState;

  const setFormState = useCallback((state: FormState<S> | Inputs<S>): void => {
    dispatch({
      type: FormAction.SET_FORM,
      payload: { state: { ...getState(state) }, value: "", id: "" },
    });
  }, []);

  const onTouchHandler: React.FocusEventHandler<FormElementConstraint> = useCallback(
    (event) => {
      dispatch({
        type: FormAction.INPUT_TOUCH,
        payload: { id: event.target.id, value: "" },
      });
    },
    []
  );

  const updateInput = useCallback(
    <T extends keyof Inputs<S>>(id: T, value: S[T]) => {
      dispatch({
        type: FormAction.INPUT_CHANGE,
        payload: {
          id,
          value,
        },
      });
    },
    []
  );

  const getInputValues = useCallback(() => {
    return Object.keys(inputs)
      .map((key) => ({ [key]: inputs[key].value }))
      .reduce((a, b) => ({ ...a, ...b }), {});
  }, [inputs]);

  const onChangeHandler: React.ChangeEventHandler<FormElementConstraint> = useCallback(
    (event) => {
      dispatch({
        type: FormAction.INPUT_CHANGE,
        payload: {
          id: event.target.id,
          value: event.target.value,
        },
      });
    },
    []
  );

  return {
    inputs,
    isValid,
    getInputValues,
    updateInput,
    onChangeHandler,
    onTouchHandler,
    setFormState,
  };
}

export default useForm;
