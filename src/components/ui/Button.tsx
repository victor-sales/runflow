import type { PropsWithChildren } from 'react';
import { Pressable, StyleSheet, type PressableProps } from 'react-native';

import { AppText } from '@/components/ui/AppText';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

type ButtonProps = PropsWithChildren<
  PressableProps & {
    fullWidth?: boolean;
    label?: string;
    variant?: ButtonVariant;
  }
>;

export function Button({
  children,
  disabled,
  fullWidth = false,
  label,
  style,
  variant = 'primary',
  ...props
}: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      style={(state) => [
        styles.base,
        variantStyles[variant],
        fullWidth && styles.fullWidth,
        state.pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        typeof style === 'function' ? style(state) : style,
      ]}
      {...props}>
      {children ?? (
        <AppText color={variant === 'primary' ? 'inverse' : 'primary'} variant="body">
          {label}
        </AppText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: 8,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  primary: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  secondary: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D1D5DB',
  },
  ghost: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  pressed: {
    opacity: 0.78,
  },
  disabled: {
    opacity: 0.45,
  },
});

const variantStyles = {
  primary: styles.primary,
  secondary: styles.secondary,
  ghost: styles.ghost,
} as const;
