import { FormState, FormValueType } from '../form.hook';
import { validate, getValidator, ValidationType, Validator, ValidationValue } from '../form.validation';

export const getEmptyState = (): FormState<any> => ({ inputs: {}, isValid: false });

export const getValidationResult = (
    validValue: FormValueType,
    invalidValue: FormValueType,
    state: FormState<any> | null,
    ...validatorsTypes: Array<[ValidationType, ValidationValue]>
): [boolean, boolean] => {
    const currentState = state !== null ? state : getEmptyState();
    const validators: Validator[] = validatorsTypes.map((e) => getValidator(e[0], e[1]));
    return [validate(validValue, validators, currentState), validate(invalidValue, validators, currentState)];
};
