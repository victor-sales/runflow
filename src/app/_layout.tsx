import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { runMigrations } from '@/database/migrate';

import '../global.css';
import '@/features/location/location-task';

export default function RootLayout() {
  const [isDatabaseReady, setIsDatabaseReady] = useState(false);
  const [migrationError, setMigrationError] = useState<unknown>(null);

  useEffect(() => {
    let isMounted = true;

    void runMigrations()
      .then(() => {
        if (isMounted) {
          setIsDatabaseReady(true);
        }
      })
      .catch((error: unknown) => {
        console.error('Failed to run database migrations', error);

        if (isMounted) {
          setMigrationError(error);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (migrationError) {
    throw migrationError;
  }

  if (!isDatabaseReady) {
    return <StatusBar style="dark" />;
  }

  return (
    <SafeAreaProvider>
      <StatusBar backgroundColor="#F9FAFB" style="dark" translucent={false} />
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: '#F9FAFB' },
          headerShadowVisible: false,
          headerStyle: { backgroundColor: '#F9FAFB' },
          headerTitleStyle: { fontWeight: '700' },
          statusBarBackgroundColor: '#F9FAFB',
          statusBarTranslucent: false,
        }}
      >
        <Stack.Screen name="index" options={{ title: 'RunFlow' }} />
        <Stack.Screen name="workout/index" options={{ title: 'Treino' }} />
        <Stack.Screen
          name="workout/free-run"
          options={{ title: 'Corrida Livre' }}
        />
        <Stack.Screen
          name="workout/interval/index"
          options={{ title: 'Treinos Intervalados' }}
        />
        <Stack.Screen
          name="workout/interval/create"
          options={{ title: 'Criar Treino' }}
        />
        <Stack.Screen
          name="workout/interval/active"
          options={{ title: 'Treino Intervalado' }}
        />
        <Stack.Screen name="history/index" options={{ title: 'Historico' }} />
        <Stack.Screen name="history/[id]" options={{ title: 'Detalhe' }} />
        <Stack.Screen
          name="settings/index"
          options={{ title: 'Configuracoes' }}
        />
      </Stack>
    </SafeAreaProvider>
  );
}
