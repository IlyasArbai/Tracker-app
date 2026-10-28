import { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';

import { useAuth } from '../../utils/AuthProvider';
import api from '@/api';
import Screen from '@/Screen';

export default function RegisterScreen() {
  const { signIn } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!name.trim() || !email.trim() || !password) {
      Alert.alert('Missing information', 'Please complete all fields.');
      return;
    }

    try {
      setLoading(true);

      const { data } = await api.post('/auth/register', {
        name: name.trim(),
        email: email.trim(),
        password,
      });

      console.log(data);

      if (!data.success) {
        throw new Error(data.message + ' okok');
      }

      Alert.alert('Account created', 'Please sign in to continue.', [
        {
          text: 'Continue',
          onPress: () => router.replace('/login'),
        },
      ]);
    } catch (error) {
      console.log(error);
      Alert.alert(
        'Registration failed 22',
        error.response?.data?.error ||
          error.response?.data?.message ||
          error.message ||
          'Something went wrong.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen scroll keyboard className="bg-white" contentClassName="justify-center px-6 py-12">
      <View className="mb-10">
        <Text className="mb-3 text-4xl font-bold tracking-tight text-gray-900">Create account</Text>

        <Text className="text-base leading-6 text-gray-500">
          Start tracking your income and expenses in one place.
        </Text>
      </View>

      <View className="gap-5">
        <View className="gap-2">
          <Text className="text-sm font-semibold text-gray-700">Full name</Text>

          <TextInput
            placeholder="Your name"
            placeholderTextColor="#9CA3AF"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            autoComplete="name"
            editable={!loading}
            returnKeyType="next"
            className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 text-base text-gray-900"
          />
        </View>

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
            autoComplete="email"
            editable={!loading}
            returnKeyType="next"
            className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 text-base text-gray-900"
          />
        </View>

        <View className="gap-2">
          <Text className="text-sm font-semibold text-gray-700">Password</Text>

          <TextInput
            placeholder="Create a password"
            placeholderTextColor="#9CA3AF"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="new-password"
            editable={!loading}
            returnKeyType="done"
            onSubmitEditing={handleRegister}
            className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 text-base text-gray-900"
          />
        </View>

        <Pressable
          onPress={handleRegister}
          disabled={loading}
          accessibilityRole="button"
          className={`mt-2 min-h-14 flex-row items-center justify-center rounded-2xl px-4 py-4 ${
            loading ? 'bg-emerald-400' : 'bg-emerald-600 active:bg-emerald-700'
          }`}>
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text className="text-base font-bold text-white">Create account</Text>
          )}
        </Pressable>
      </View>

      <View className="mt-8 flex-row items-center justify-center">
        <Text className="text-sm text-gray-500">Already have an account? </Text>

        <Pressable disabled={loading} onPress={() => router.dismiss()}>
          <Text className="text-sm font-bold text-emerald-700">Sign in</Text>
        </Pressable>
      </View>
    </Screen>
  );
}
