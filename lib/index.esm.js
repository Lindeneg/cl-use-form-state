import { useReducer, useCallback } from 'react';

/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

var __assign = function() {
    __assign = Object.assign || function __assign(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};

var _a;
/* Predefined validation options. However, a custom rule, which takes a function, can be created
   and thus any validation rule that is desired, can be created. */
var ValidationType;
(function (ValidationType) {
    ValidationType["Require"] = "isRequired";
    ValidationType["MinLength"] = "minLength";
    ValidationType["MaxLength"] = "maxLength";
    ValidationType["MinValue"] = "minValue";
    ValidationType["MaxValue"] = "maxValue";
    ValidationType["MinUppercaseCharacters"] = "minUppercaseCharacters";
    ValidationType["MaxUppercaseCharacters"] = "maxUppercaseCharacters";
    ValidationType["MinNumericalSymbols"] = "minNumericalSymbols";
    ValidationType["MaxNumericalSymbols"] = "maxNumericalSymbols";
    ValidationType["CustomRule"] = "customRule";
})(ValidationType || (ValidationType = {}));
var count = function (target, callback) {
    var result = 0;
    for (var i = 0; i < target.length; i++) {
        if (callback(target[i])) {
            result++;
        }
    }
    return result;
};
var countUpperCase = function (target) {
    return count(target, function (e) { return e >= 'A' && e <= 'Z'; });
};
var countNumbers = function (target) {
    return count(target, function (e) {
        var n = parseInt(e);
        return typeof n === 'number' && !Number.isNaN(n);
    });
};
function checkIsValid(isValid, value, validatorValue, callback) {
    if (typeof value !== 'undefined' && value !== null && typeof validatorValue === 'number') {
        return isValid && callback(value, validatorValue);
    }
    return isValid;
}
var validationFunc = (_a = {},
    _a[ValidationType.Require] = function (value, isValid) {
        if (Array.isArray(value)) {
            return value.length > 0;
        }
        return (isValid &&
            typeof value !== 'undefined' &&
            value !== null &&
            value.toString().trim().length > 0);
    },
    _a[ValidationType.MinLength] = function (value, isValid, validator) {
        return checkIsValid(isValid, value, validator.value, function (actualValue, rule) {
            if (Array.isArray(actualValue)) {
                return actualValue.length >= rule;
            }
            return actualValue.toString().trim().length >= rule;
        });
    },
    _a[ValidationType.MaxLength] = function (value, isValid, validator) {
        return checkIsValid(isValid, value, validator.value, function (actualValue, rule) {
            if (Array.isArray(actualValue)) {
                return actualValue.length <= rule;
            }
            return actualValue.toString().trim().length <= rule;
        });
    },
    _a[ValidationType.MinValue] = function (value, isValid, validator) {
        return checkIsValid(isValid, value, validator.value, function (actualValue, rule) { return +actualValue >= rule; });
    },
    _a[ValidationType.MaxValue] = function (value, isValid, validator) {
        return checkIsValid(isValid, value, validator.value, function (actualValue, rule) { return +actualValue <= rule; });
    },
    _a[ValidationType.MinUppercaseCharacters] = function (value, isValid, validator) {
        return checkIsValid(isValid, value, validator.value, function (actualValue, rule) {
            var uppercaseChars = countUpperCase(actualValue);
            return uppercaseChars >= rule;
        });
    },
    _a[ValidationType.MaxUppercaseCharacters] = function (value, isValid, validator) {
        return checkIsValid(isValid, value, validator.value, function (actualValue, rule) {
            var uppercaseChars = countUpperCase(actualValue);
            return uppercaseChars <= rule;
        });
    },
    _a[ValidationType.MinNumericalSymbols] = function (value, isValid, validator) {
        return checkIsValid(isValid, value, validator.value, function (actualValue, rule) {
            var numericalSymbols = countNumbers(actualValue.toString());
            return numericalSymbols >= rule;
        });
    },
    _a[ValidationType.MaxNumericalSymbols] = function (value, isValid, validator) {
        return checkIsValid(isValid, value, validator.value, function (actualValue, rule) {
            var numericalSymbols = countNumbers(actualValue.toString());
            return numericalSymbols <= rule;
        });
    },
    _a[ValidationType.CustomRule] = function (value, isValid, validator, state) {
        return isValid && typeof validator.value === 'function' && validator.value(value, state);
    },
    _a);
var validateState = function (state) {
    var isValid = true;
    for (var key in state.inputs) {
        isValid = isValid && state.inputs[key].isValid;
    }
    return isValid;
};
var getValidator = function (type, value) { return ({
    type: type,
    value: value
}); };
var validate = function (value, validators, state) {
    var isValid = true;
    validators.forEach(function (validator) {
        var func = validationFunc[validator.type];
        if (typeof func !== 'undefined') {
            isValid = func(value, isValid, validator, state);
        }
    });
    return isValid;
};

var FormAction;
(function (FormAction) {
    FormAction["INPUT_CHANGE"] = "INPUT_CHANGE";
    FormAction["INPUT_TOUCH"] = "INPUT_TOUCH";
    FormAction["SET_FORM"] = "SET_FORM";
})(FormAction || (FormAction = {}));
/**
 * Get an object of type FormEntryState by just defining the input type, initial value and options.
 *
 * @param initialValue - initial value of the input entry.
 * @param options      - (optional) options for initial input state and validation
 * @returns Object of type FormEntryState
 */
function getInput(initialValue, options) {
    var parsedOptions = {
        isValid: false,
        isTouched: false,
        validators: [],
        connectedFields: (options === null || options === void 0 ? void 0 : options.connectFields) || []
    };
    if (typeof options !== 'undefined') {
        var keys = Object.keys(options);
        parsedOptions.isTouched = !!options.isTouched;
        parsedOptions.isValid = !!options.isValid;
        keys.forEach(function (key) {
            if (!['isValid', 'isTouched', 'connectedFields'].includes(key)) {
                parsedOptions.validators.push(getValidator(key, options[key]));
            }
        });
    }
    return __assign(__assign({}, parsedOptions), { value: initialValue });
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
var handleConnectedFields = function (state, targetId) {
    try {
        var newInputState_1 = __assign({}, state.inputs);
        // find connected fields from the targetId
        newInputState_1[targetId].connectedFields.forEach(function (connectedFieldId) {
            // if the connected field exists
            if (typeof newInputState_1[connectedFieldId] !== 'undefined') {
                // then validate it given the specified state
                newInputState_1[connectedFieldId] = __assign(__assign({}, newInputState_1[connectedFieldId]), { isValid: validate(newInputState_1[connectedFieldId].value, newInputState_1[connectedFieldId].validators, state) });
            }
        });
        return newInputState_1;
    }
    catch (err) {
        process.env.NODE_ENV !== 'production' && console.error(err);
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
function formReducer(state, action) {
    var _a, _b;
    var pl = action.payload;
    switch (action.type) {
        case FormAction.INPUT_CHANGE:
            try {
                // copy the current state, update the entry with the specified payload Id and validate it.
                var newState = __assign(__assign({}, state), { inputs: __assign(__assign({}, state.inputs), (_a = {}, _a[pl.id] = __assign(__assign({}, state.inputs[pl.id]), { value: pl.value, isValid: validate(pl.value, state.inputs[pl.id].validators, state) }), _a)) });
                // copy the inputs and validate connected fields given the now updated state.
                newState.inputs = __assign(__assign({}, newState.inputs), handleConnectedFields(newState, pl.id));
                // return the updated FormState
                return __assign(__assign({}, newState), { inputs: __assign({}, newState.inputs), isValid: validateState(newState) });
            }
            catch (err) {
                process.env.NODE_ENV !== 'test' &&
                    console.error("use-form-state cannot recognize input-id '" + pl.id + "'. Please make sure that all form input names are tied to a form element, such as <input id='" + pl.id + "' />.");
                break;
            }
        case FormAction.INPUT_TOUCH:
            try {
                return __assign(__assign({}, state), { inputs: __assign(__assign({}, state.inputs), (_b = {}, _b[pl.id] = __assign(__assign({}, state.inputs[pl.id]), { isTouched: true }), _b)) });
            }
            catch (err) {
                process.env.NODE_ENV !== 'test' &&
                    console.error("use-form-state cannot recognize input-id '" + pl.id + "'. Please make sure that all form input names are tied to a form element, such as <input id='" + pl.id + "' />.");
                break;
            }
        case FormAction.SET_FORM:
            if (typeof pl.state !== 'undefined') {
                return __assign({}, pl.state);
            }
            else {
                return state;
            }
    }
    return state;
}
function getState(initialState) {
    var state;
    if (Object.keys(initialState).length === 2 &&
        typeof initialState.inputs !== 'undefined' &&
        typeof initialState.isValid !== 'undefined') {
        state = __assign({}, initialState);
    }
    else {
        state = {
            inputs: __assign({}, initialState),
            isValid: false
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
function useForm(initialState) {
    var _a = useReducer(formReducer, __assign({}, getState(initialState))), formState = _a[0], dispatch = _a[1];
    var setFormState = useCallback(function (state) {
        dispatch({
            type: FormAction.SET_FORM,
            payload: { state: __assign({}, getState(state)), value: '', id: '' }
        });
    }, []);
    var onTouchHandler = useCallback(function (event) {
        dispatch({ type: FormAction.INPUT_TOUCH, payload: { id: event.target.id, value: '' } });
    }, []);
    var onChangeHandler = useCallback(function (event) {
        dispatch({
            type: FormAction.INPUT_CHANGE,
            payload: {
                id: event.target.id,
                value: event.target.value
            }
        });
    }, []);
    return { formState: formState, onChangeHandler: onChangeHandler, onTouchHandler: onTouchHandler, setFormState: setFormState };
}

export default useForm;
export { getInput, validate };
//# sourceMappingURL=index.esm.js.map
