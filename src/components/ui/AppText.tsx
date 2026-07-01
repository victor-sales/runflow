import type { PropsWithChildren } from 'react';
import { StyleSheet, Text, type TextProps } from 'react-native';

type AppTextVariant = 'body' | 'title' | 'subtitle' | 'caption' | 'metric';

type AppTextProps = PropsWithChildren<
  TextProps & {
    color?: 'primary' | 'secondary' | 'muted' | 'inverse' | 'success';
    variant?: AppTextVariant;
  }
>;

export function AppText({
  children,
  color = 'primary',
  style,
  variant = 'body',
  ...props
}: AppTextProps) {
  return (
    <Text style={[styles.base, variantStyles[variant], colorStyles[color], style]} {...props}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    includeFontPadding: false,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
  },
  title: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
  },
  caption: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  metric: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
  },
  primary: {
    color: '#111827',
  },
  secondary: {
    color: '#4B5563',
  },
  muted: {
    color: '#6B7280',
  },
  inverse: {
    color: '#FFFFFF',
  },
  success: {
    color: '#16A34A',
  },
});

const colorStyles = {
  primary: styles.primary,
  secondary: styles.secondary,
  muted: styles.muted,
  inverse: styles.inverse,
  success: styles.success,
} as const;

const variantStyles = {
  body: styles.body,
  title: styles.title,
  subtitle: styles.subtitle,
  caption: styles.caption,
  metric: styles.metric,
} as const;
