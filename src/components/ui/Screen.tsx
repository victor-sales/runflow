import type { PropsWithChildren } from 'react';
import { ScrollView, View, type ViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type ScreenProps = PropsWithChildren<
  ViewProps & {
    className?: string;
    scroll?: boolean;
  }
>;

export function Screen({
  children,
  className = '',
  scroll = true,
  ...props
}: ScreenProps) {
  const content = (
    <View
      className={`flex-1 w-full max-w-[760px] self-center gap-[18px] px-5 py-6 ${className}`}
      {...props}
    >
      {children}
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      {scroll ? (
        <ScrollView contentContainerClassName="flex-grow">{content}</ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}
