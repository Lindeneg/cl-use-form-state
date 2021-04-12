## use-form-state

react form state and validation hook

---

_If anyone should actually use this, please let me know if you have any suggestions, improvements or ideas. It's all about learning and improving!_

###### use lib

`$ yarn add https://github.com/lindeneg/use-form-state.git`

###### clone repository

```
$ git clone https://github.com/lindeneg/use-form-state.git
$ cd use-form-state && yarn install
// run some tests
$ yarn test
```

---

##### Usage

```tsx
import useForm, { getInput } from 'use-form-state';

type Inputs = {
    age: number;
    username: string;
    password: string;
};

const SomeComponent = (props) => {
    const { formState, onChangeHandler, onTouchHandler, setFormState } = useForm<Inputs>({
        inputs: {
            age: getInput<number>(17, { minValue: 18, isValid: false }),
            username: getInput<string>('', { minLength: 5, maxLength: 12, maxNumericalSymbols: 0 }),
            password: getInput<string>('', {
                minLength: 8,
                maxLength: 20,
                minNumericalSymbols: 1,
                minUppercaseCharacters: 1
            })
        },
        isValid: false
    });
    // element ids must correspond to the correct property key in the formState.
    // So the input element for 'username' should have an Id with the value 'username'
    return (
        <>
            <input id="username" type="text" onChange={onChangeHandler} onBlur={onTouchHandler} />
            <p>
                {`Username isValid: ${formState.inputs.username.isValid} | isTouched: ${formState.inputs.username.isTouched}`}
            </p>

            <input id="password" type="password" onChange={onChangeHandler} onBlur={onTouchHandler} />
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
        </>
    );
};
```

useForm returns, among other things, an object called formState, which will always have the keys:

`'inputs' | 'isValid'`

where isValid is true if and only if all form inputs are valid.

formState.inputs will always have the keys:

`'value' | 'isValid' | 'isTouched' | 'validators' | 'connectedFields'`

Say I want to use the inputs defined in the above Inputs type, then the FormState can be created like so:

```ts
const formState: FormState<Inputs> = {
    inputs: {
        age: getInput<number>(17, { minValue: 18, isValid: false }),
        username: getInput<string>('', { minLength: 5, maxLength: 12, maxNumericalSymbols: 0 }),
        password: getInput<string>('', {
            minLength: 8,
            maxLength: 20,
            minNumericalSymbols: 1,
            minUppercaseCharacters: 1
        })
    },
    isValid: false
};
```

Thus, each entry of formState.inputs will always have the aforementioned keys, such as:

```ts

formState.inputs.age => {
    value: 17,
    isValid: false,
    isTouched: false,
    validators: [...],
    connectedFields: []
}

```

##### getInput Options

getInput takes two arguments. An initial value and options for the created input.

The options are as follows:

```ts
type InputOptions = {
    // initial state
    isValid               ?: boolean; // default: false
    isTouched             ?: boolean; // default: false

    // predefined validation rules
    minLength             ?: number;
    maxLength             ?: number;
    minValue              ?: number;
    maxValue              ?: number;
    minUppercaseCharacters?: number;
    maxUppercaseCharacters?: number;
    minNumericalSymbols   ?: number;
    maxNumericalSymbols   ?: number;
    isRequired            ?: boolean;

    // custom validation rule:
    customRule            ?: (value: InputValueType, state: FormState) => boolean;

    // connect fields
    connectFields?: string[];
};
```

##### customRule

If none of the predefined rules are useful, then you can create your own. A customRule must be a function
that takes two arguments, value and state. The value will always be the newest value of the associated
input field while the state always will be the newest state of the entire form.

Lets say you have an input where you'd only want to support usernames that starts with C and ends with l:

```ts
const formState: FormState<Inputs> = {
    inputs: {
        age: getInput<number, Inputs>(17, { minValue: 18, isValid: false }),
        username: getInput<string>('', {
            minLength: 5,
            maxLength: 12,
            maxNumericalSymbols: 0,
            customRule: (value, state) => {
                return value.length > 0 && value[0] === 'C' && value[value.length - 1] === 'l';
            }
        }),
        password: getInput<string>('', {
            minLength: 8,
            maxLength: 20,
            minNumericalSymbols: 1,
            minUppercaseCharacters: 1
        })
    },
    isValid: false
};
```

##### connectFields

If you have a field that is dependant upon another field, this can be specified in the connectFields InputOptions.

As an example for a use-case, if you have a signup form with a 'password' input and a 'passwordConfirmation' input, then the 'passwordConfirmation' input is dependant upon the 'password' input value.

In other words, each time the value of 'password' changes, we'd like to re-run the validation for the 'passwordConfirmation' input.

Example:

```ts
type AuthInputs = {
    username: string;
    password: string;
    passwordConfirmation: string;
};

const formState: FormState<AuthInputs> = {
    inputs: {
        username: getInput<string>('', { minLength: 5, maxLength: 12, maxNumericalSymbols: 0 }),
        password: getInput<string>('', {
            minLength: 8,
            maxLength: 20,
            minNumericalSymbols: 1,
            minUppercaseCharacters: 1,
            // run validation for passwordConfirmation on each password value change
            connectFields: ['passwordConfirmation']
        }),
        passwordConfirmation: getInput<string, AuthInputs>('', {
            // verify password is valid and then check if passwordConfirmation and password are equal
            customRule: (value, state) => state.inputs.password.isValid && value === state.inputs.password.value
        })
    },
    isValid: false
};
```
