import useForm from './form.hook';

export { getInput } from './form.hook';
export type { FormState, FormValueType } from './form.hook';
export type {
    ValidationType,
    CustomValidationRule,
    ValidationValue,
    ValidationFunc,
    Validator
} from './form.validation';

export default useForm;
