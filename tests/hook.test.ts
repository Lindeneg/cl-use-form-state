import { renderHook, act } from "@testing-library/react-hooks";
import { useForm, getInput } from "../src/hook";
import { Inputs } from "../src/shared";
import { validate } from "../src/validation";
import { TestInputState, getEmptyState, getState } from "./test-util";

test("can get empty input correctly initialized", () => {
  const input = getInput("");

  expect(input.value).toBe("");
  expect(input.isTouched).toBe(false);
  expect(input.isValid).toBe(false);
  expect(input.connectedFields.length).toBe(0);
  expect(input.validators.length).toBe(0);
});

test("can get initial input correctly initialized", () => {
  const input = getInput("initial");

  expect(input.value).toBe("initial");
  expect(input.isTouched).toBe(false);
  expect(input.isValid).toBe(false);
  expect(input.connectedFields.length).toBe(0);
  expect(input.validators.length).toBe(0);
});

test("can get input options correctly initialized", () => {
  const input = getInput("initial", {
    minLength: 5,
    maxLength: 12,
    isValid: true,
  });

  expect(input.value).toBe("initial");
  expect(input.isTouched).toBe(false);
  expect(input.isValid).toBe(true);
  expect(input.connectedFields.length).toBe(0);
  expect(input.validators.length).toBe(2);
  expect(input.validators[0]).toEqual({ type: "minLength", value: 5 });
  expect(input.validators[1]).toEqual({ type: "maxLength", value: 12 });
});

test("can handle invalid input options without throwing errors on validation", () => {
  //@ts-expect-error raised due to unknown input option 'ayy'
  const input = getInput(5, { ayy: "", minValue: 6 });
  const emptyState = getEmptyState();

  expect(validate(input.value, input.validators, emptyState)).toBe(false);

  input.value = 6;

  expect(validate(input.value, input.validators, emptyState)).toBe(true);
});

test.each([
  getState("can initialize useForm using initial state", "initial"),
  getState(
    "can initialize useForm using initial inputs with invalid state",
    "invalid"
  ),
  getState(
    "can initialize useForm using initial inputs with valid state",
    "valid"
  ),
])("%s", ({ description, valid, inputs }) => {
  const { result } = renderHook(() =>
    useForm<TestInputState>((createInput) => {
      return inputs
        .map((input) => ({
          [input.key]: createInput(input.value, input.options),
        }))
        .reduce((a, b) => ({ ...a, ...b }), {}) as Inputs<TestInputState>;
    })
  );

  expect(result.current.inputs).toBeDefined();
  expect(result.current.isValid).toBe(valid);

  expect(Object.keys(result.current.inputs)).toEqual([
    "age",
    "username",
    "password",
  ]);
});

test.each([
  getState(
    "can handle overall form validity with initial state using onChangeHandler",
    "initial"
  ),
  getState(
    "can handle overall form validity with invalid inputs using onChangeHandler",
    "invalid"
  ),
])("%s", ({ description, valid, inputs }) => {
  const { result } = renderHook(() =>
    useForm<TestInputState>((createInput) => {
      return inputs
        .map((input) => ({
          [input.key]: createInput(input.value, input.options),
        }))
        .reduce((a, b) => ({ ...a, ...b }), {}) as Inputs<TestInputState>;
    })
  );
  const ageEl = document.createElement("input");
  const usernameEl = document.createElement("input");
  const passwordEl = document.createElement("input");
  ageEl.id = "age";
  usernameEl.id = "username";
  passwordEl.id = "password";

  expect(result.current.isValid).toBe(valid);

  usernameEl.value = "lindeneg";
  passwordEl.value = "helloThere1";

  act(() => {
    result.current.onChangeHandler({
      target: usernameEl,
    } as React.ChangeEvent<HTMLInputElement>);
    result.current.onChangeHandler({
      target: passwordEl,
    } as React.ChangeEvent<HTMLInputElement>);
  });

  expect(result.current.isValid).toBe(!valid);

  ageEl.value = "8";

  act(() => {
    result.current.onChangeHandler({
      target: ageEl,
    } as React.ChangeEvent<HTMLInputElement>);
  });

  expect(result.current.isValid).toBe(valid);
});

test("can handle change using updateInput", () => {
  const { result } = renderHook(() => {
    return useForm<{ test: string }>((createInput) => ({
      test: createInput(""),
    }));
  });
  expect(result.current.inputs.test.value).toEqual("");
  expect(result.current.inputs.test.isValid).toEqual(false);
  act(() => {
    result.current.updateInput("test", "hello there");
  });
  expect(result.current.inputs.test.value).toEqual("hello there");
  expect(result.current.inputs.test.isValid).toEqual(true);
});

test("can handle invalid referenced variables", () => {
  const { result } = renderHook(() =>
    useForm<TestInputState>((createInput) => {
      return getState("", "initial")
        .inputs.map((input) => ({
          [input.key]: createInput(input.value, input.options),
        }))
        .reduce((a, b) => ({ ...a, ...b }), {}) as Inputs<TestInputState>;
    })
  );
  const usernameEl = document.createElement("input");
  usernameEl.id = "not-username";

  expect(result.current.inputs.username.value).toBe("");
  expect(result.current.inputs.username.isValid).toBe(false);

  usernameEl.value = "lindeneg";

  act(() => {
    result.current.onChangeHandler({
      target: usernameEl,
    } as React.ChangeEvent<HTMLInputElement>);
  });

  expect(result.current.inputs.username.value).toBe("");
  expect(result.current.inputs.username.isValid).toBe(false);
});

test.each([
  getState("can handle touch change with initial state", "initial"),
  getState("can handle touch change with initial inputs", "invalid"),
])("%s", ({ description, valid, inputs }) => {
  const { result } = renderHook(() =>
    useForm<TestInputState>((createInput) => {
      return inputs
        .map((input) => ({
          [input.key]: createInput(input.value, input.options),
        }))
        .reduce((a, b) => ({ ...a, ...b }), {}) as Inputs<TestInputState>;
    })
  );

  const userEl = document.createElement("input");
  userEl.id = "username";

  expect(result.current.inputs.username.isTouched).toBe(false);

  act(() => {
    result.current.onTouchHandler({
      target: userEl,
    } as React.FocusEvent<HTMLInputElement>);
  });

  expect(result.current.inputs.username.isTouched).toBe(true);
});

test("can handle changes with initial state", () => {
  const { result } = renderHook(() =>
    useForm<TestInputState>((createInput) => {
      return getState("", "initial")
        .inputs.map((input) => ({
          [input.key]: createInput(input.value, input.options),
        }))
        .reduce((a, b) => ({ ...a, ...b }), {}) as Inputs<TestInputState>;
    })
  );

  const userEl = document.createElement("input");
  userEl.value = "lindeneg";
  userEl.id = "username";

  expect(result.current.inputs.username.value).toBe("");
  expect(result.current.inputs.username.isValid).toBe(false);
  expect(result.current.inputs.username.validators.length).toBe(3);

  act(() => {
    result.current.onChangeHandler({
      target: userEl,
    } as React.ChangeEvent<HTMLInputElement>);
  });

  expect(result.current.inputs.username.value).toBe("lindeneg");
  expect(result.current.inputs.username.isValid).toBe(true);

  userEl.value = "lindeneg1";

  act(() => {
    result.current.onChangeHandler({
      target: userEl,
    } as React.ChangeEvent<HTMLInputElement>);
  });

  expect(result.current.inputs.username.value).toBe("lindeneg1");
  expect(result.current.inputs.username.isValid).toBe(false);
});

test("can handle changes with initial inputs", () => {
  const { result } = renderHook(() =>
    useForm<TestInputState>((createInput) => {
      return getState("", "initial")
        .inputs.map((input) => ({
          [input.key]: createInput(input.value, input.options),
        }))
        .reduce((a, b) => ({ ...a, ...b }), {}) as Inputs<TestInputState>;
    })
  );

  const passwordEl = document.createElement("input");
  passwordEl.value = "hellothere";
  passwordEl.id = "password";

  expect(result.current.inputs.password.value).toBe("");
  expect(result.current.inputs.password.isValid).toBe(false);
  expect(result.current.inputs.password.validators.length).toBe(5);

  act(() => {
    result.current.onChangeHandler({
      target: passwordEl,
    } as React.ChangeEvent<HTMLInputElement>);
  });

  expect(result.current.inputs.password.value).toBe("hellothere");
  expect(result.current.inputs.password.isValid).toBe(false);

  passwordEl.value = "lindeneG42";

  act(() => {
    result.current.onChangeHandler({
      target: passwordEl,
    } as React.ChangeEvent<HTMLInputElement>);
  });

  expect(result.current.inputs.password.value).toBe("lindeneG42");
  expect(result.current.inputs.password.isValid).toBe(true);
});

test("can setForm with state", () => {
  const { result } = renderHook(() =>
    useForm<TestInputState>((createInput) => {
      return getState("", "initial")
        .inputs.map((input) => ({
          [input.key]: createInput(input.value, input.options),
        }))
        .reduce((a, b) => ({ ...a, ...b }), {}) as Inputs<TestInputState>;
    })
  );

  expect(result.current.inputs.confirmPassword).toBeUndefined();
  expect(result.current.inputs.username).toBeDefined();
  expect(result.current.inputs.password).toBeDefined();

  act(() => {
    result.current.setFormState({
      ...result.current.inputs,
      confirmPassword: getInput("", {
        customRule: (value, state) => {
          return (
            state.inputs.password.isValid &&
            state.inputs.password.value === value
          );
        },
      }),
    });
  });

  expect(result.current.inputs.confirmPassword).toBeDefined();
  expect(result.current.inputs.username).toBeDefined();
  expect(result.current.inputs.password).toBeDefined();
});

test.each([
  (() => {
    const state = getState(
      "can handle input connections with initial state",
      "initial"
    );
    state.inputs.push({
      key: "confirmPassword",
      value: "",
      options: {
        customRule: (value, state) => {
          return (
            state.inputs.password.isValid &&
            state.inputs.password.value === value
          );
        },
      },
    });
    return state;
  })(),
  (() => {
    const state = getState(
      "can handle input connections with initial invalid inputs",
      "invalid"
    );
    state.inputs.push({
      key: "confirmPassword",
      value: "",
      options: {
        customRule: (value, state) => {
          return (
            state.inputs.password.isValid &&
            state.inputs.password.value === value
          );
        },
      },
    });
    return state;
  })(),
])("%s", ({ description, valid, inputs }) => {
  const { result } = renderHook(() =>
    useForm<TestInputState>((createInput) => {
      return inputs
        .map((input) => ({
          [input.key]: createInput(input.value, input.options),
        }))
        .reduce((a, b) => ({ ...a, ...b }), {}) as Inputs<TestInputState>;
    })
  );

  const passwordEl = document.createElement("input");
  const passwordConfirmEl = document.createElement("input");

  expect(result.current.inputs.password.value).toBe("");
  expect(result.current.inputs.password.isValid).toBe(false);
  expect(result.current.inputs.confirmPassword?.value).toBe("");
  expect(result.current.inputs.confirmPassword?.isValid).toBe(false);

  passwordEl.id = "password";
  passwordEl.value = "hello there";
  passwordConfirmEl.id = "confirmPassword";
  passwordConfirmEl.value = "hello";

  // origin invalid, connection invalid
  act(() => {
    result.current.onChangeHandler({
      target: passwordEl,
    } as React.ChangeEvent<HTMLInputElement>);
    result.current.onChangeHandler({
      target: passwordConfirmEl,
    } as React.ChangeEvent<HTMLInputElement>);
  });

  expect(result.current.inputs.password.value).toBe("hello there");
  expect(result.current.inputs.password.isValid).toBe(false);
  expect(result.current.inputs.confirmPassword?.value).toBe("hello");
  expect(result.current.inputs.confirmPassword?.isValid).toBe(false);

  passwordEl.value = "hello therE21";

  // origin valid, connection invalid
  act(() => {
    result.current.onChangeHandler({
      target: passwordEl,
    } as React.ChangeEvent<HTMLInputElement>);
  });

  expect(result.current.inputs.password.value).toBe("hello therE21");
  expect(result.current.inputs.password.isValid).toBe(true);
  expect(result.current.inputs.confirmPassword?.value).toBe("hello");
  expect(result.current.inputs.confirmPassword?.isValid).toBe(false);

  passwordConfirmEl.value = "hello therE21";

  // origin valid, connection valid
  act(() => {
    result.current.onChangeHandler({
      target: passwordConfirmEl,
    } as React.ChangeEvent<HTMLInputElement>);
  });

  expect(result.current.inputs.password.value).toBe("hello therE21");
  expect(result.current.inputs.password.isValid).toBe(true);
  expect(result.current.inputs.confirmPassword?.value).toBe("hello therE21");
  expect(result.current.inputs.confirmPassword?.isValid).toBe(true);

  passwordEl.value = "hello therE2";

  // origin valid, connection invalid
  act(() => {
    result.current.onChangeHandler({
      target: passwordEl,
    } as React.ChangeEvent<HTMLInputElement>);
  });

  expect(result.current.inputs.password.value).toBe("hello therE2");
  expect(result.current.inputs.password.isValid).toBe(true);
  expect(result.current.inputs.confirmPassword?.value).toBe("hello therE21");
  expect(result.current.inputs.confirmPassword?.isValid).toBe(false);
});
