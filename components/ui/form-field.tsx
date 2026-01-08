'use client';

import { ReactNode } from 'react';
import { Label } from './label';
import { Input } from './input';
import { cn } from '@/lib/utils/cn';

/**
 * Props for FormField component
 */
export interface FormFieldProps {
  label: string;
  name: string;
  error?: string;
  required?: boolean;
  className?: string;
  children?: ReactNode;
  description?: string;
}

/**
 * Reusable form field component with label and error display
 */
export function FormField({
  label,
  name,
  error,
  required = false,
  className,
  children,
  description,
}: FormFieldProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={name}>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      {children || (
        <Input
          id={name}
          name={name}
          className={error ? 'border-destructive' : ''}
        />
      )}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}

/**
 * Props for SelectField component
 */
export interface SelectFieldProps extends Omit<FormFieldProps, 'children'> {
  options: Array<{ value: string; label: string }>;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
}

/**
 * Select field component
 */
export function SelectField({
  label,
  name,
  error,
  required,
  className,
  description,
  options,
  value,
  onChange,
  placeholder,
}: SelectFieldProps) {
  return (
    <FormField
      label={label}
      name={name}
      error={error}
      required={required}
      className={className}
      description={description}
    >
      <select
        id={name}
        name={name}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
          'file:border-0 file:bg-transparent file:text-sm file:font-medium',
          'placeholder:text-muted-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          error && 'border-destructive'
        )}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FormField>
  );
}

/**
 * Props for TextareaField component
 */
export interface TextareaFieldProps extends Omit<FormFieldProps, 'children'> {
  value?: string;
  onChange?: (value: string) => void;
  rows?: number;
  placeholder?: string;
}

/**
 * Textarea field component
 */
export function TextareaField({
  label,
  name,
  error,
  required,
  className,
  description,
  value,
  onChange,
  rows = 4,
  placeholder,
}: TextareaFieldProps) {
  return (
    <FormField
      label={label}
      name={name}
      error={error}
      required={required}
      className={className}
      description={description}
    >
      <textarea
        id={name}
        name={name}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className={cn(
          'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
          'placeholder:text-muted-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          error && 'border-destructive'
        )}
      />
    </FormField>
  );
}

