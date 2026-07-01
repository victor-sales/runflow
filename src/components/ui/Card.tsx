import type { PropsWithChildren } from 'react';
import { View, type ViewProps } from 'react-native';

type CardProps = PropsWithChildren<
  ViewProps & {
    className?: string;
  }
>;

export function Card({ children, className = '', ...props }: CardProps) {
  return (
    <View className={`gap-3 rounded-lg border border-slate-200 bg-white p-[18px] ${className}`} {...props}>
      {children}
    </View>
  );
}
