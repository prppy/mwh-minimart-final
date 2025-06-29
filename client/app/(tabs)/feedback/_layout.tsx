import { Stack } from 'expo-router';

export default function FeedbackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="product-request" />
      <Stack.Screen name="rate-us" />
    </Stack>
  );
}