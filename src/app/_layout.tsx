import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: '#F9FAFB' },
          headerShadowVisible: false,
          headerStyle: { backgroundColor: '#F9FAFB' },
          headerTitleStyle: { fontWeight: '700' },
        }}>
        <Stack.Screen name="index" options={{ title: 'RunFlow' }} />
        <Stack.Screen name="workout/index" options={{ title: 'Treino' }} />
        <Stack.Screen name="workout/free-run" options={{ title: 'Corrida Livre' }} />
        <Stack.Screen name="workout/interval/index" options={{ title: 'Treinos Intervalados' }} />
        <Stack.Screen name="workout/interval/create" options={{ title: 'Criar Treino' }} />
        <Stack.Screen name="history/index" options={{ title: 'Historico' }} />
        <Stack.Screen name="settings/index" options={{ title: 'Configuracoes' }} />
      </Stack>
    </>
  );
}
