import { renderHook, act } from '@testing-library/react-hooks';

import useForm, { getInput } from '../form.hook';
import { validate } from '../form.validation';
import { TestInputState, getEmptyState, getInitialState, getConfirmedState } from './test-util';

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
    //@ts-ignore
    const input = getInput<number>(5, { ayy: '', minValue: 6 });
    const emptyState = getEmptyState();

    expect(validate(input.value, input.validators, emptyState)).toBe(false);

    input.value = 6;

    expect(validate(input.value, input.validators, emptyState)).toBe(true);
});

test('can initialize useForm', () => {
    const state = getInitialState();
    const { result } = renderHook(() => useForm<TestInputState>(state));

    expect(result.current.formState).toBeDefined();
    expect(result.current.formState.inputs).toBeDefined();
    expect(result.current.formState.isValid).toBe(false);

    expect(Object.keys(result.current.formState)).toEqual(['inputs', 'isValid']);
    expect(Object.keys(result.current.formState.inputs)).toEqual(['age', 'username', 'password']);
});

test('can handle overall form validity', () => {
    const state = getInitialState();
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
        //@ts-ignore
        result.current.onChangeHandler({ target: usernameEl });
        //@ts-ignore
        result.current.onChangeHandler({ target: passwordEl });
    });

    expect(result.current.formState.isValid).toBe(true);

    ageEl.value = '17';

    act(() => {
        //@ts-ignore
        result.current.onChangeHandler({ target: ageEl });
    });

    expect(result.current.formState.isValid).toBe(false);
});

test('can handle touch change', () => {
    const state = getInitialState();

    const { result } = renderHook(() => useForm<TestInputState>(state));
    const userEl = document.createElement('input');
    userEl.id = 'username';

    expect(result.current.formState.inputs.username.isTouched).toBe(false);

    act(() => {
        //@ts-ignore
        result.current.onTouchHandler({ target: userEl });
    });

    expect(result.current.formState.inputs.username.isTouched).toBe(true);
});

test('can handle changes first test', () => {
    const state = getInitialState();

    const { result } = renderHook(() => useForm<TestInputState>(state));
    const userEl = document.createElement('input');
    userEl.value = 'lindeneg';
    userEl.id = 'username';

    expect(result.current.formState.inputs.username.value).toBe('');
    expect(result.current.formState.inputs.username.isValid).toBe(false);
    expect(result.current.formState.inputs.username.validators.length).toBe(3);

    act(() => {
        //@ts-ignore
        result.current.onChangeHandler({ target: userEl });
    });

    expect(result.current.formState.inputs.username.value).toBe('lindeneg');
    expect(result.current.formState.inputs.username.isValid).toBe(true);

    userEl.value = 'lindeneg1';

    act(() => {
        //@ts-ignore
        result.current.onChangeHandler({ target: userEl });
    });

    expect(result.current.formState.inputs.username.value).toBe('lindeneg1');
    expect(result.current.formState.inputs.username.isValid).toBe(false);
});

test('can handle changes second test', () => {
    const state = getInitialState();

    const { result } = renderHook(() => useForm<TestInputState>(state));
    const passwordEl = document.createElement('input');
    passwordEl.value = 'hellothere';
    passwordEl.id = 'password';

    expect(result.current.formState.inputs.password.value).toBe('');
    expect(result.current.formState.inputs.password.isValid).toBe(false);
    expect(result.current.formState.inputs.password.validators.length).toBe(5);

    act(() => {
        //@ts-ignore
        result.current.onChangeHandler({ target: passwordEl });
    });

    expect(result.current.formState.inputs.password.value).toBe('hellothere');
    expect(result.current.formState.inputs.password.isValid).toBe(false);

    passwordEl.value = 'lindeneG42';

    act(() => {
        //@ts-ignore
        result.current.onChangeHandler({ target: passwordEl });
    });

    expect(result.current.formState.inputs.password.value).toBe('lindeneG42');
    expect(result.current.formState.inputs.password.isValid).toBe(true);
});

test('can setForm', () => {
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

    act(() => {
        result.current.setFormState(newState);
    });

    expect(result.current.formState.inputs.confirmPassword).toBeDefined();
});

test('can handle input connections', () => {
    const state = getConfirmedState();
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
        //@ts-ignore
        result.current.onChangeHandler({ target: passwordEl });
        //@ts-ignore
        result.current.onChangeHandler({ target: passwordConfirmEl });
    });

    expect(result.current.formState.inputs.password.value).toBe('hello there');
    expect(result.current.formState.inputs.password.isValid).toBe(false);
    expect(result.current.formState.inputs.confirmPassword.value).toBe('hello');
    expect(result.current.formState.inputs.confirmPassword.isValid).toBe(false);

    passwordEl.value = 'hello therE21';

    // origin valid, connection invalid
    act(() => {
        //@ts-ignore
        result.current.onChangeHandler({ target: passwordEl });
    });

    expect(result.current.formState.inputs.password.value).toBe('hello therE21');
    expect(result.current.formState.inputs.password.isValid).toBe(true);
    expect(result.current.formState.inputs.confirmPassword.value).toBe('hello');
    expect(result.current.formState.inputs.confirmPassword.isValid).toBe(false);

    passwordConfirmEl.value = 'hello therE21';

    // origin valid, connection valid
    act(() => {
        //@ts-ignore
        result.current.onChangeHandler({ target: passwordConfirmEl });
    });

    expect(result.current.formState.inputs.password.value).toBe('hello therE21');
    expect(result.current.formState.inputs.password.isValid).toBe(true);
    expect(result.current.formState.inputs.confirmPassword.value).toBe('hello therE21');
    expect(result.current.formState.inputs.confirmPassword.isValid).toBe(true);

    passwordEl.value = 'hello therE2';

    act(() => {
        //@ts-ignore
        result.current.onChangeHandler({ target: passwordEl });
    });

    // origin valid, connection invalid
    expect(result.current.formState.inputs.password.value).toBe('hello therE2');
    expect(result.current.formState.inputs.password.isValid).toBe(true);
    expect(result.current.formState.inputs.confirmPassword.value).toBe('hello therE21');
    expect(result.current.formState.inputs.confirmPassword.isValid).toBe(false);
});
