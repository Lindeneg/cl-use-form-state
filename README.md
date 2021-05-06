## cl-use-form-state

React form state and validation hook

---

#### Dev Todo

- Provide `onUpload` function that can be used to keep track of a `File`.

- Provide `onMultipleSelect` function that can keep track of an array of selected `<option />` elements

---

###### Install

`$ yarn add cl-use-form-state`

---


##### Usage

_Check out [this](https://github.com/Lindeneg/cl-form-component#readme) repository for a complete Form component built on top of this library._

```tsx
import React from 'react';
import useForm, { getInput } from 'cl-use-form-state';

type Inputs = {
    age: number;
    username: string;
    password: string;
};

const SomeComponent = (props) => {
    const { formState, onChangeHandler, onTouchHandler, setFormState } = useForm<Inputs>({
        age: getInput(21, { minValue: 18, isValid: true }),
        username: getInput('', {
            minLength: 5,
            maxLength: 12,
            maxNumericalSymbols: 0
        }),
        password: getInput('', {
            minLength: 8,
            maxLength: 20,
            minNumericalSymbols: 1,
            minUppercaseCharacters: 1
        })
    });
    // element ids must correspond to the correct property key in the formState.
    // So the input element for 'username' should have an Id with the value 'username'
    return (
        <>
            <input id="username" type="text" onChange={onChangeHandler} onBlur={onTouchHandler} />
            <p>
                {`Username isValid: ${formState.inputs.username.isValid} | isTouched: ${formState.inputs.username.isTouched}`}
            </p>

            <input
                id="password"
                type="password"
                onChange={onChangeHandler}
                onBlur={onTouchHandler}
            />
            <p>
                {`Password isValid: ${formState.inputs.password.isValid} | isTouched: ${formState.inputs.password.isTouched}`}
            </p>

            <input
                id="age"
                type="number"
                onChange={onChangeHandler}
                onBlur={onTouchHandler}
                value={formState.inputs.age.value}
            />
            <p>{`Age isValid: ${formState.inputs.age.isValid} | isTouched: ${formState.inputs.age.isTouched}`}</p>
            <hr />
            <p>{`Form isValid: ${formState.isValid}`}</p>
        </>
    );
};
```

`useForm({...}).formState` returns an object with the keys:

`inputs | isValid`, where `isValid` is true if all form `inputs` are valid.

`formState.inputs.[INPUT_NAME]` (when created by the `getInput` function) will always have the keys:

`value | isValid | isTouched | validators | connectedFields`

---

##### getInput Options

`getInput` takes two arguments. An initial value and an object with options for the created input.

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

##### customRule

If none of the predefined rules are useful, then you can create your own. A `customRule` must be a function
that takes two arguments, `value` and `state`. The value will always be the newest value of the associated
input field while the state always will be the newest state of the entire form.

Lets say you have an input where you'd only want to support `username`s that starts with C, ends with l and has a maximum length of the current `age` value:

```ts
const { formState } = useForm<Inputs>({
    age: getInput(21, { minValue: 18, isValid: true }),
    // pass value and state type args for customRule
    username: getInput<string, Inputs>('', {
        minLength: 5,
        maxNumericalSymbols: 0,
        customRule: (value, state) => {
            const trimmedValue = value.trim();
            const length = trimmedValue.length;
            return (
                length > 0 &&
                length <= state.inputs.age.value &&
                trimmedValue[0] === 'C' &&
                trimmedValue[length - 1] === 'l'
            );
        }
    }),
    password: getInput('', {
        minLength: 8,
        maxLength: 20,
        minNumericalSymbols: 1,
        minUppercaseCharacters: 1
    })
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
    username: getInput('', {
        minLength: 5,
        maxLength: 12,
        maxNumericalSymbols: 0
    }),
    password: getInput('', {
        minLength: 8,
        maxLength: 20,
        minNumericalSymbols: 1,
        minUppercaseCharacters: 1,
        // run validation for passwordConfirmation on each password value change
        connectFields: ['passwordConfirmation']
    }),
    // pass value and state type args for customRule
    passwordConfirmation: getInput<string, AuthInputs>('', {
        // verify password is valid and then check if passwordConfirmation and password are equal
        customRule: (value, state) =>
            state.inputs.password.isValid && value === state.inputs.password.value
    })
});
```

Or in the `customRule` example, where the validation for `username` should run each time the `age` value changes:

```ts
const { formState } = useForm<Inputs>({
    age: getInput(21, {
        minValue: 18,
        isValid: true,
        connectFields: ['username']
    }),
    username: getInput<string, Inputs>('', {
        minLength: 5,
        maxNumericalSymbols: 0,
        customRule: (value, state) => {
            const trimmedValue = value.trim();
            const length = trimmedValue.length;
            return (
                length > 0 &&
                length <= state.inputs.age.value &&
                trimmedValue[0] === 'C' &&
                trimmedValue[length - 1] === 'l'
            );
        }
    }),
    password: getInput('', {
        minLength: 8,
        maxLength: 20,
        minNumericalSymbols: 1,
        minUppercaseCharacters: 1
    })
});
```
