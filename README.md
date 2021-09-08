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
    // optional function to (re)set entire form state
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
          console.log("getInputValues:", getInputValues());
          console.log("inputs:", inputs);
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

`updateInput` can be used to update the value of an input if `onChangeHandler` cannot be used.
It takes two arguments, the `id` of the input to change and the new `value` of that input.
The type of the `value` argument is inferred from the `id`. Say we have these simple input types

```ts
type FormInputs = {
  name: string;
  age: number;
};
```

and we use `updateInput` as an `onClick` handler. Then this pattern follows:

```ts

// Ok

onClick={() => updateInput("name", "someValue")} // expects string
onClick={() => updateInput("age", 21)}           // expects number

// Not ok

onClick={() => updateInput("name", 21)}          // expects string
onClick={() => updateInput("age", "someValue")}  // expects number
```

---

##### customRule

A `customRule` must be a function that takes two arguments, `value` and `state`. The value will always be the newest value of the associated input field while the state always will be the newest state of the entire form.

Lets say we have an input where we'd only want to support any given `username` that starts with **C**, ends with **h** and has a maximum length of the current `age` value:

```ts
const form = useForm<{
  name: string;
  age: number | null;
}>((createInput) => {
  return {
    name: createInput("", {
      customRule: (value, state) => {
        const trimmedValue = value.trim();
        const length = trimmedValue.length;
        return (
          length > 0 &&
          length <= (state.inputs.age.value || 0) &&
          trimmedValue[0] === "C" &&
          trimmedValue[length - 1] === "h"
        );
      },
    }),
    age: createInput(null, { minValue: 1 }),
  };
});
```

---

##### connectFields

The above `customRule` example has an issue. Lets assume that we have a `name` that starts with **C**, ends with **h** and has a maximum length of the `age` value. Lets say the `name` length is `12` and the `age` value is `15`. Now `name` is a valid input. However, if we change the `age` value to say `10`, then the `name` value is still valid although it no longer satisfies its own validation constraints.

In this scenario, we want a behavior where each time the value of `age` changes, the validation for `name` is re-run. We can achieve this using the `connectFields` option, that just takes an `id` of the input we'd like to connect.

```ts
const form = useForm<{
  name: string;
  age: number | null;
}>((createInput) => {
  return {
    name: createInput("", {
      customRule: (value, state) => {
        const trimmedValue = value.trim();
        const length = trimmedValue.length;
        return (
          length > 0 &&
          length <= (state.inputs.age.value || 0) &&
          trimmedValue[0] === "C" &&
          trimmedValue[length - 1] === "h"
        );
      },
    }),
    age: createInput(null, { minValue: 1, connectFields: ["name"] }),
  };
});
```
