import { TextField, type TextFieldProps } from '@mui/material';
import { useController, type Control, type FieldValues, type Path } from 'react-hook-form';

export type FormTextFieldProps<TFormValues extends FieldValues> = Omit<TextFieldProps, 'name'> & {
  control: Control<TFormValues>;
  name: Path<TFormValues>;
};

export const FormTextField = <TFormValues extends FieldValues>({
  control,
  name,
  ...rest
}: FormTextFieldProps<TFormValues>) => {
  const { field, fieldState } = useController({ control, name });
  return (
    <TextField
      {...rest}
      {...field}
      value={field.value ?? ''}
      error={!!fieldState.error}
      helperText={fieldState.error?.message ?? rest.helperText}
    />
  );
};
