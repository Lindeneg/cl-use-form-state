## cl-use-form-state

React form state and validation hook with great TypeScript support.

---

###### Install

`yarn add cl-use-form-state`

---

##### Usage

```tsx
import React from "react";
import { useForm } from "cl-use-form-state";

type FormInputs = {
  username: string;
  password: string;
  age: number | null;
};

export function Component() {
  const {
    // an object with the current state of the inputs
    inputs,
    // a boolean that is true if all inputs are valid
    isValid,
    // returns an object with every input key along with its current value
    getInputValues,
    // react on change event handler i.e onChange
    onChangeHandler,
    // react on focus event handler i.e onBlur
    onTouchHandler,
    // optional function to update input value
    updateInput,
    // optional function set (re)set entire form state
    setFormState,
  } = useForm<FormInputs>((createInput) => {
    /* useForm takes a function as its argument and that function
       receives another function that can be used to create inputs 
       All defined inputs must be present in the returned object */
    return {
      username: createInput("", { minLength: 1, maxLength: 32 }),
      password: createInput("", {
        minLength: 8,
        maxLength: 64,
        minNumericalSymbols: 1,
        minUppercaseCharacters: 1,
        connectFields: ["confirmation"],
      }),
      age: createInput(null, { minValue: 18 }),
    };
  });

  // deconstruct inputs for better accessability
  const { username, password, age } = inputs;

  // each key in the inputs object must be used as element ids
  return (
    <>
      <input
        id="username"
        type="text"
        value={username.value}
        onChange={onChangeHandler}
        onBlur={onTouchHandler}
      />
      <p>
        {`Username isValid: ${username.isValid} | isTouched: ${username.isTouched}`}
      </p>
      <input
        id="password"
        type="password"
        value={password.value}
        onChange={onChangeHandler}
        onBlur={onTouchHandler}
      />
      <p>
        {`Password isValid: ${password.isValid} | isTouched: ${password.isTouched}`}
      </p>
      <input
        id="age"
        type="number"
        onChange={onChangeHandler}
        onBlur={onTouchHandler}
        value={age.value || ""}
      />
      <p>{`Age isValid: ${age.isValid} | isTouched: ${age.isTouched}`}</p>
      <hr />
      <p>{`Form isValid: ${isValid}`}</p>
      <button
        onClick={(e) => {
          e.preventDefault();
          console.log(getInputValues());
        }}
        disabled={!isValid}
      >
        Submit
      </button>
    </>
  );
}
```

---

##### createInput

`createInput` takes two arguments. An initial value and an object with options for the created input.

| name                     | type                                                   | default     | note                                                                                                                                |
| ------------------------ | ------------------------------------------------------ | ----------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `isValid`                | `boolean`                                              | `false`     | -                                                                                                                                   |
| `isTouched`              | `boolean`                                              | `false`     | -                                                                                                                                   |
| `minLength`              | `number`                                               | `undefined` | -                                                                                                                                   |
| `maxLength`              | `number`                                               | `undefined` | -                                                                                                                                   |
| `minValue`               | `number`                                               | `undefined` | -                                                                                                                                   |
| `maxValue`               | `number`                                               | `undefined` | -                                                                                                                                   |
| `minUppercaseCharacters` | `number`                                               | `undefined` | -                                                                                                                                   |
| `maxUppercaseCharacters` | `number`                                               | `undefined` | -                                                                                                                                   |
| `minNumericalSymbols`    | `number`                                               | `undefined` | -                                                                                                                                   |
| `maxNumericalSymbols`    | `number`                                               | `undefined` | -                                                                                                                                   |
| `customRule`             | `(value: InputValueType, state: FormState) => boolean` | `undefined` | can be used to create any validation rule for any input field, see [here](https://github.com/Lindeneg/cl-use-form-state#customrule) |
| `connectFields`          | `string[]`                                             | `undefined` | can be used to make fields dependant upon each other, see [here](https://github.com/Lindeneg/cl-use-form-state#connectfields)       |

---

##### updateInput

---

##### setFormState

---

##### customRule

A `customRule` must be a function that takes two arguments, `value` and `state`. The value will always be the newest value of the associated input field while the state always will be the newest state of the entire form.

Lets say you have an input where you'd only want to support any given `username` that starts with C, ends with h and has a maximum length of the current `age` value:

```ts
const form = useForm<{ age: number; username: string }>({
  age: getInput(18, { minValue: 18, isValid: true }),
  username: getInput("", {
    customRule: (value, state) => {
      const trimmedValue = value.trim();
      const length = trimmedValue.length;
      return (
        length > 0 &&
        length <= state.inputs.age.value &&
        trimmedValue[0] === "C" &&
        trimmedValue[length - 1] === "h"
      );
    },
  }),
});
```

---

##### connectFields

If you have a field that is dependant upon another field, this can be specified in the `connectFields` option.

Say you have a signup form with a `password` input and a `passwordConfirmation` input, then `passwordConfirmation` is dependant upon the `password` value.

In other words, each time the value of `password` changes, the validation for `passwordConfirmation` should be re-run.

Example:

```ts
type AuthInputs = {
  username: string;
  password: string;
  passwordConfirmation: string;
};

const { formState } = useForm<AuthInputs>({
  username: getInput("", {
    minLength: 5,
    maxLength: 12,
    maxNumericalSymbols: 0,
  }),
  password: getInput("", {
    minLength: 8,
    maxLength: 20,
    minNumericalSymbols: 1,
    minUppercaseCharacters: 1,
    // run validation for passwordConfirmation on each password value change
    connectFields: ["passwordConfirmation"],
  }),
  // pass value and state type args for customRule
  passwordConfirmation: getInput<string, AuthInputs>("", {
    // verify password is valid and then check if passwordConfirmation and password are equal
    customRule: (value, state) =>
      state.inputs.password.isValid && value === state.inputs.password.value,
  }),
});
```
