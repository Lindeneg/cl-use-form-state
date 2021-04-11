import { FormState } from '../form.hook';
import { ValidationType, count, countNumbers, countUpperCase } from '../form.validation';
import { getEmptyState, getValidationResult } from './test-util';

test('can handle isRequired validation', () => {
    const [valid, invalid] = getValidationResult('hello there', '', null, [ValidationType.Require, true]);
    expect(valid).toBe(true);
    expect(invalid).toBe(false);
});

test('can handle custom validation', () => {
    const emptyState = getEmptyState();
    const state: FormState<{ someTestInput: string }> = {
        ...emptyState,
        inputs: {
            ...emptyState.inputs,
            someTestInput: {
                value: 'Kind of Blue',
                isTouched: true,
                isValid: true,
                validators: [],
                connectedFields: []
            }
        },
        isValid: false
    };
    const customRule = (value, state) => {
        return state.inputs.someTestInput.isValid && state.inputs.someTestInput.value === value;
    };
    const [valid, invalid] = getValidationResult('Kind of Blue', 'kind of blue', state, [
        ValidationType.CustomRule,
        customRule
    ]);

    expect(valid).toBe(true);
    expect(invalid).toBe(false);
});

test('can count numbers', () => {
    expect(countNumbers('Hello47There12 9548 General 10')).toBe(10);
    expect(countNumbers('Hello There')).toBe(0);
});

test('can count uppercase', () => {
    expect(countUpperCase("Hello there. General Kenobi. You're a bold one.")).toBe(4);
    expect(countUpperCase("hello there. general kenobi. you're a bold one.")).toBe(0);
});

test('can count custom', () => {
    expect(count("hello there. general kenobi. you're a bold one.", (e) => e === ' ')).toBe(7);
});

test('can handle minLength validation', () => {
    const [valid, invalid] = getValidationResult('hello there', 'hello', null, [ValidationType.MinLength, 8]);
    expect(valid).toBe(true);
    expect(invalid).toBe(false);
});

test('can handle maxLength validation', () => {
    const [valid, invalid] = getValidationResult('hello', 'hello there', null, [ValidationType.MaxLength, 8]);
    expect(valid).toBe(true);
    expect(invalid).toBe(false);
});

test('can handle minValue validation', () => {
    const [valid, invalid] = getValidationResult(10, 2, null, [ValidationType.MinValue, 8]);
    expect(valid).toBe(true);
    expect(invalid).toBe(false);
});

test('can handle maxValue validation', () => {
    const [valid, invalid] = getValidationResult(15, 31, null, [ValidationType.MaxValue, 20]);
    expect(valid).toBe(true);
    expect(invalid).toBe(false);
});

test('can handle minUppercaseCharacters validation', () => {
    const [valid, invalid] = getValidationResult('Hello There', 'hello there', null, [
        ValidationType.MinUppercaseCharacters,
        2
    ]);
    expect(valid).toBe(true);
    expect(invalid).toBe(false);
});

test('can handle maxUppercaseCharacters validation', () => {
    const [valid, invalid] = getValidationResult('Hello There', 'Hello there, General Kenobi', null, [
        ValidationType.MaxUppercaseCharacters,
        2
    ]);
    expect(valid).toBe(true);
    expect(invalid).toBe(false);
});

test('can handle minNumericalSymbols validation', () => {
    const [valid, invalid] = getValidationResult('b1ill 3van5', 'm1les d4vis', null, [
        ValidationType.MinNumericalSymbols,
        3
    ]);
    expect(valid).toBe(true);
    expect(invalid).toBe(false);
});

test('can handle maxNumericalSymbols validation', () => {
    const [valid, invalid] = getValidationResult('b1ill 3van5', 'm1l3s d4v15', null, [
        ValidationType.MaxNumericalSymbols,
        3
    ]);
    expect(valid).toBe(true);
    expect(invalid).toBe(false);
});

test('can handle mix of validation rules', () => {
    const validators: Array<[ValidationType, number]> = [
        [ValidationType.MinLength, 30],
        [ValidationType.MaxLength, 50],
        [ValidationType.MaxNumericalSymbols, 2],
        [ValidationType.MinNumericalSymbols, 1],
        [ValidationType.MinUppercaseCharacters, 1],
        [ValidationType.MaxUppercaseCharacters, 1]
    ];
    const [valid1, invalid1] = getValidationResult(
        "The late 50's was a great time for jazz.",
        "The late 50's was a great time for Jazz.",
        null,
        ...validators
    );
    const [valid2, invalid2] = getValidationResult(
        'There are over 20 droids outside, watch out!.',
        'There are over 9000 droids outside, run!.',
        null,
        ...validators
    );
    const [valid3, invalid3] = getValidationResult(
        'Did you know that 3 squared, surprisingly, is 9? ',
        'chick corea, a great master of jazz died recently. may he rest in peace.',
        null,
        ...validators
    );

    expect(valid1).toBe(true);
    expect(valid2).toBe(true);
    expect(valid3).toBe(true);

    expect(invalid1).toBe(false);
    expect(invalid2).toBe(false);
    expect(invalid3).toBe(false);
});
