import type { PropsWithChildren } from 'react';
import { Pressable, type PressableProps } from 'react-native';

import { AppText } from '@/components/ui/AppText';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

type ButtonProps = PropsWithChildren<
  PressableProps & {
    className?: string;
    fullWidth?: boolean;
    label?: string;
    title?: string;
    variant?: ButtonVariant;
  }
>;

const buttonClasses: Record<ButtonVariant, string> = {
  primary: 'border-slate-900 bg-slate-900',
  secondary: 'border-slate-300 bg-white',
  ghost: 'border-transparent bg-transparent',
};

export function Button({
  children,
  className = '',
  disabled,
  fullWidth = false,
  label,
  title,
  variant = 'primary',
  ...props
}: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      className={`min-h-[52px] items-center justify-center rounded-lg border px-[18px] ${
        buttonClasses[variant]
      } ${fullWidth ? 'self-stretch' : ''} ${disabled ? 'opacity-45' : 'active:opacity-80'} ${className}`}
      disabled={disabled}
      {...props}>
      {children ?? (
        <AppText color={variant === 'primary' ? 'inverse' : 'primary'} variant="body">
          {title ?? label}
        </AppText>
      )}
    </Pressable>
  );
}
