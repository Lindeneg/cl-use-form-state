import { renderHook, act } from '@testing-library/react-hooks';

import useForm, { getInput } from '../src/form.hook';
import { validate } from '../src/form.validation';
import {
    TestInputState,
    getEmptyState,
    getInitialState,
    getConfirmedState,
    getInitialInvalidInputs,
    getInitialValidInputs,
    getConfirmedInputs
} from './test-util';

test('can get empty input correctly initialized', () => {
    const input = getInput<string>('');

    expect(input.value).toBe('');
    expect(input.isTouched).toBe(false);
    expect(input.isValid).toBe(false);
    expect(input.connectedFields.length).toBe(0);
    expect(input.validators.length).toBe(0);
});

test('can get initial input correctly initialized', () => {
    const input = getInput<string>('initial');

    expect(input.value).toBe('initial');
    expect(input.isTouched).toBe(false);
    expect(input.isValid).toBe(false);
    expect(input.connectedFields.length).toBe(0);
    expect(input.validators.length).toBe(0);
});

test('can get input options correctly initialized', () => {
    const input = getInput<string>('initial', { minLength: 5, maxLength: 12, isValid: true });

    expect(input.value).toBe('initial');
    expect(input.isTouched).toBe(false);
    expect(input.isValid).toBe(true);
    expect(input.connectedFields.length).toBe(0);
    expect(input.validators.length).toBe(2);
    expect(input.validators[0]).toEqual({ type: 'minLength', value: 5 });
    expect(input.validators[1]).toEqual({ type: 'maxLength', value: 12 });
});

test('can handle invalid input options without throwing errors on validation', () => {
    //@ts-expect-error raised due to unknown input option 'ayy'
    const input = getInput<number>(5, { ayy: '', minValue: 6 });
    const emptyState = getEmptyState();

    expect(validate(input.value, input.validators, emptyState)).toBe(false);

    input.value = 6;

    expect(validate(input.value, input.validators, emptyState)).toBe(true);
});

const handleInitialize = (state, description, isValid?) => {
    test(description, () => {
        const { result } = renderHook(() => useForm<TestInputState>(state));

        expect(result.current.formState).toBeDefined();
        expect(result.current.formState.inputs).toBeDefined();
        expect(result.current.formState.isValid).toBe(
            typeof isValid === 'undefined' ? false : isValid
        );

        expect(Object.keys(result.current.formState)).toEqual(['inputs', 'isValid']);
        expect(Object.keys(result.current.formState.inputs)).toEqual([
            'age',
            'username',
            'password'
        ]);
    });
};

handleInitialize(getInitialState(), 'can initialize useForm using initial state');
handleInitialize(
    getInitialInvalidInputs(),
    'can initialize useForm using initial inputs with invalid state'
);
handleInitialize(
    getInitialValidInputs(),
    'can initialize useForm using initial inputs with valid state',
    true
);

const handleFormValidityChange = (state, description) => {
    test(description, () => {
        const { result } = renderHook(() => useForm<TestInputState>(state));
        const ageEl = document.createElement('input');
        const usernameEl = document.createElement('input');
        const passwordEl = document.createElement('input');
        ageEl.id = 'age';
        usernameEl.id = 'username';
        passwordEl.id = 'password';

        expect(result.current.formState.isValid).toBe(false);

        usernameEl.value = 'lindeneg';
        passwordEl.value = 'helloThere1';

        act(() => {
            result.current.onChangeHandler({
                target: usernameEl
            } as React.ChangeEvent<HTMLInputElement>);
            result.current.onChangeHandler({
                target: passwordEl
            } as React.ChangeEvent<HTMLInputElement>);
        });

        expect(result.current.formState.isValid).toBe(true);

        ageEl.value = '17';

        act(() => {
            result.current.onChangeHandler({
                target: ageEl
            } as React.ChangeEvent<HTMLInputElement>);
        });

        expect(result.current.formState.isValid).toBe(false);
    });
};

handleFormValidityChange(getInitialState(), 'can handle overall form validity with initial state');
handleFormValidityChange(
    getInitialInvalidInputs(),
    'can handle overall form validity with initial inputs'
);

test('can handle invalid referenced variables', () => {
    const { result } = renderHook(() => useForm<TestInputState>(getInitialState()));
    const usernameEl = document.createElement('input');
    usernameEl.id = 'not-username';

    expect(result.current.formState.inputs.username.value).toBe('');
    expect(result.current.formState.inputs.username.isValid).toBe(false);

    usernameEl.value = 'lindeneg';

    act(() => {
        result.current.onChangeHandler({
            target: usernameEl
        } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.formState.inputs.username.value).toBe('');
    expect(result.current.formState.inputs.username.isValid).toBe(false);
});

const handleTouchChange = (state, description) => {
    test(description, () => {
        const { result } = renderHook(() => useForm<TestInputState>(state));
        const userEl = document.createElement('input');
        userEl.id = 'username';

        expect(result.current.formState.inputs.username.isTouched).toBe(false);

        act(() => {
            result.current.onTouchHandler({ target: userEl } as React.FocusEvent<HTMLInputElement>);
        });

        expect(result.current.formState.inputs.username.isTouched).toBe(true);
    });
};

handleTouchChange(getInitialState(), 'can handle touch change with initial state');
handleTouchChange(getInitialInvalidInputs(), 'can handle touch change with initial inputs');

test('can handle changes with initial state', () => {
    const state = getInitialState();

    const { result } = renderHook(() => useForm<TestInputState>(state));
    const userEl = document.createElement('input');
    userEl.value = 'lindeneg';
    userEl.id = 'username';

    expect(result.current.formState.inputs.username.value).toBe('');
    expect(result.current.formState.inputs.username.isValid).toBe(false);
    expect(result.current.formState.inputs.username.validators.length).toBe(3);

    act(() => {
        result.current.onChangeHandler({ target: userEl } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.formState.inputs.username.value).toBe('lindeneg');
    expect(result.current.formState.inputs.username.isValid).toBe(true);

    userEl.value = 'lindeneg1';

    act(() => {
        result.current.onChangeHandler({ target: userEl } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.formState.inputs.username.value).toBe('lindeneg1');
    expect(result.current.formState.inputs.username.isValid).toBe(false);
});

test('can handle changes with initial inputs', () => {
    const inputs = getInitialInvalidInputs();

    const { result } = renderHook(() => useForm<TestInputState>(inputs));
    const passwordEl = document.createElement('input');
    passwordEl.value = 'hellothere';
    passwordEl.id = 'password';

    expect(result.current.formState.inputs.password.value).toBe('');
    expect(result.current.formState.inputs.password.isValid).toBe(false);
    expect(result.current.formState.inputs.password.validators.length).toBe(5);

    act(() => {
        result.current.onChangeHandler({
            target: passwordEl
        } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.formState.inputs.password.value).toBe('hellothere');
    expect(result.current.formState.inputs.password.isValid).toBe(false);

    passwordEl.value = 'lindeneG42';

    act(() => {
        result.current.onChangeHandler({
            target: passwordEl
        } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.formState.inputs.password.value).toBe('lindeneG42');
    expect(result.current.formState.inputs.password.isValid).toBe(true);
});

test('can setForm with state', () => {
    const initialState = getInitialState();
    const newState = {
        ...initialState,
        inputs: {
            ...initialState.inputs,
            confirmPassword: getInput<string, TestInputState>('', {
                customRule: (value, state) => {
                    return state.inputs.password.isValid && state.inputs.password.value === value;
                }
            })
        },
        isValid: initialState.isValid
    };
    const { result } = renderHook(() => useForm<TestInputState>(initialState));

    expect(result.current.formState.inputs.confirmPassword).toBeUndefined();
    expect(result.current.formState.inputs.username).toBeDefined();
    expect(result.current.formState.inputs.password).toBeDefined();

    act(() => {
        result.current.setFormState(newState);
    });

    expect(result.current.formState.inputs.confirmPassword).toBeDefined();
    expect(result.current.formState.inputs.username).toBeDefined();
    expect(result.current.formState.inputs.password).toBeDefined();
});

test('can setForm with inputs', () => {
    const initialInputs = getInitialInvalidInputs();
    const newInputs = {
        ...initialInputs,
        confirmPassword: getInput<string, TestInputState>('', {
            customRule: (value, state) => {
                return state.inputs.password.isValid && state.inputs.password.value === value;
            }
        })
    };
    const { result } = renderHook(() => useForm<TestInputState>(initialInputs));

    expect(result.current.formState.inputs.confirmPassword).toBeUndefined();
    expect(result.current.formState.inputs.username).toBeDefined();
    expect(result.current.formState.inputs.password).toBeDefined();

    act(() => {
        result.current.setFormState(newInputs);
    });

    expect(result.current.formState.inputs.confirmPassword).toBeDefined();
    expect(result.current.formState.inputs.username).toBeDefined();
    expect(result.current.formState.inputs.password).toBeDefined();
});

const handleInputConnections = (state, description) => {
    test(description, () => {
        const { result } = renderHook(() => useForm<TestInputState>(state));

        const passwordEl = document.createElement('input');
        const passwordConfirmEl = document.createElement('input');

        expect(result.current.formState.inputs.password.value).toBe('');
        expect(result.current.formState.inputs.password.isValid).toBe(false);
        expect(result.current.formState.inputs.confirmPassword.value).toBe('');
        expect(result.current.formState.inputs.confirmPassword.isValid).toBe(false);

        passwordEl.id = 'password';
        passwordEl.value = 'hello there';
        passwordConfirmEl.id = 'confirmPassword';
        passwordConfirmEl.value = 'hello';

        // origin invalid, connection invalid
        act(() => {
            result.current.onChangeHandler({
                target: passwordEl
            } as React.ChangeEvent<HTMLInputElement>);
            result.current.onChangeHandler({
                target: passwordConfirmEl
            } as React.ChangeEvent<HTMLInputElement>);
        });

        expect(result.current.formState.inputs.password.value).toBe('hello there');
        expect(result.current.formState.inputs.password.isValid).toBe(false);
        expect(result.current.formState.inputs.confirmPassword.value).toBe('hello');
        expect(result.current.formState.inputs.confirmPassword.isValid).toBe(false);

        passwordEl.value = 'hello therE21';

        // origin valid, connection invalid
        act(() => {
            result.current.onChangeHandler({
                target: passwordEl
            } as React.ChangeEvent<HTMLInputElement>);
        });

        expect(result.current.formState.inputs.password.value).toBe('hello therE21');
        expect(result.current.formState.inputs.password.isValid).toBe(true);
        expect(result.current.formState.inputs.confirmPassword.value).toBe('hello');
        expect(result.current.formState.inputs.confirmPassword.isValid).toBe(false);

        passwordConfirmEl.value = 'hello therE21';

        // origin valid, connection valid
        act(() => {
            result.current.onChangeHandler({
                target: passwordConfirmEl
            } as React.ChangeEvent<HTMLInputElement>);
        });

        expect(result.current.formState.inputs.password.value).toBe('hello therE21');
        expect(result.current.formState.inputs.password.isValid).toBe(true);
        expect(result.current.formState.inputs.confirmPassword.value).toBe('hello therE21');
        expect(result.current.formState.inputs.confirmPassword.isValid).toBe(true);

        passwordEl.value = 'hello therE2';

        // origin valid, connection invalid
        act(() => {
            result.current.onChangeHandler({
                target: passwordEl
            } as React.ChangeEvent<HTMLInputElement>);
        });

        expect(result.current.formState.inputs.password.value).toBe('hello therE2');
        expect(result.current.formState.inputs.password.isValid).toBe(true);
        expect(result.current.formState.inputs.confirmPassword.value).toBe('hello therE21');
        expect(result.current.formState.inputs.confirmPassword.isValid).toBe(false);
    });
};

handleInputConnections(getConfirmedState(), 'can handle input connections with initial state');
handleInputConnections(getConfirmedInputs(), 'can handle input connections with initial inputs');
