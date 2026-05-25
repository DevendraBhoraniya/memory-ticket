import { Stack } from 'expo-router';
import { Theme } from '@/theme';

export default function SettingsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Theme.colors.background },
        animation: 'slide_from_right',
      }}
    />
  );
}
