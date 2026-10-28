import { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, Alert } from 'react-native';
import { Link } from 'expo-router';

import { useAuth } from '../../utils/AuthProvider';
import api from '@/api';
import Screen from '@/Screen';

export default function LoginScreen() {
  const { signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password) {
      Alert.alert('Missing information', 'Please enter your email and password.');
      return;
    }

    try {
      setLoading(true);
      const { data } = await api.post('/auth/login', {
        email: email.trim(),
        password,
      });
      if (!data.success) throw new Error(data.message || 'Unable to sign in.');
      await signIn(data.token);
    } catch (error) {
      Alert.alert('Login failed', error instanceof Error ? error.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen scroll keyboard className="bg-white" contentClassName="justify-center px-6 py-12">
      <View className="mb-10">
        <Text className="mb-3 text-4xl font-bold tracking-tight text-gray-900">Welcome back</Text>

        <Text className="text-base leading-6 text-gray-500">
          Sign in to continue to your account.
        </Text>
      </View>

      <View className="gap-5">
        <View className="gap-2">
          <Text className="text-sm font-semibold text-gray-700">Email address</Text>

          <TextInput
            placeholder="you@example.com"
            placeholderTextColor="#9CA3AF"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
            autoComplete="email"
            editable={!loading}
            returnKeyType="next"
            className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 text-base text-gray-900"
          />
        </View>

        <View className="gap-2">
          <Text className="text-sm font-semibold text-gray-700">Password</Text>

          <TextInput
            placeholder="Enter your password"
            placeholderTextColor="#9CA3AF"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            textContentType="password"
            autoComplete="current-password"
            editable={!loading}
            returnKeyType="done"
            onSubmitEditing={handleLogin}
            className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 text-base text-gray-900"
          />
        </View>

        <Pressable
          onPress={handleLogin}
          disabled={loading}
          accessibilityRole="button"
          className={`mt-2 min-h-14 flex-row items-center justify-center rounded-2xl px-4 py-4 ${
            loading ? 'bg-emerald-400' : 'bg-emerald-600 active:bg-emerald-700'
          }`}>
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text className="text-base font-bold text-white">Sign in</Text>
          )}
        </Pressable>
      </View>

      <View className="mt-8 flex-row items-center justify-center">
        <Text className="text-sm text-gray-500">Don&apos;t have an account? </Text>

        <Link href="/register" asChild>
          <Pressable disabled={loading}>
            <Text className="text-sm font-bold text-emerald-700">Create account</Text>
          </Pressable>
        </Link>
      </View>

      <Text className="mt-12 text-center text-xs text-gray-400">Secure access to your account</Text>
    </Screen>
  );
}
