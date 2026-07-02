import type { PropsWithChildren } from 'react';
import { Text, type TextProps } from 'react-native';

export type AppTextVariant =
  'body' | 'title' | 'subtitle' | 'caption' | 'metric';
type AppTextColor = 'primary' | 'secondary' | 'muted' | 'inverse' | 'success';

type AppTextProps = PropsWithChildren<
  TextProps & {
    className?: string;
    color?: AppTextColor;
    variant?: AppTextVariant;
  }
>;

const colorClasses: Record<AppTextColor, string> = {
  primary: 'text-slate-900',
  secondary: 'text-slate-600',
  muted: 'text-slate-500',
  inverse: 'text-white',
  success: 'text-green-600',
};

const variantClasses: Record<AppTextVariant, string> = {
  body: 'text-base leading-6 font-medium',
  title: 'text-[34px] leading-10 font-extrabold',
  subtitle: 'text-[22px] leading-7 font-bold',
  caption: 'text-[13px] leading-[18px] font-semibold',
  metric: 'text-[28px] leading-[34px] font-extrabold',
};

export function AppText({
  children,
  className = '',
  color = 'primary',
  variant = 'body',
  ...props
}: AppTextProps) {
  return (
    <Text
      className={`${variantClasses[variant]} ${colorClasses[color]} ${className}`}
      style={[{ includeFontPadding: false }, props.style]}
      {...props}
    >
      {children}
    </Text>
  );
}
