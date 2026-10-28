import { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../../utils/AuthProvider';
import api from '@/api';
import Screen from '@/Screen';

export default function ProfileScreen() {
  const { signOut } = useAuth();

  const [passwordExpanded, setPasswordExpanded] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleChangePassword() {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Missing information', 'Please complete all password fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Password mismatch', 'The new passwords do not match.');
      return;
    }

    if (currentPassword === newPassword) {
      Alert.alert('Invalid password', 'Your new password must differ from your current password.');
      return;
    }

    try {
      setLoading(true);

      const { data } = await api.patch('/auth/password', {
        currentPassword,
        newPassword,
      });

      if (!data.success) {
        throw new Error(data.error || data.message || 'Could not change password.');
      }

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordExpanded(false);

      Alert.alert('Success', data.message || 'Password changed successfully.');
    } catch (error) {
      Alert.alert(
        'Password change failed',
        error.response?.data?.error ||
          error.response?.data?.message ||
          error.message ||
          'Something went wrong.'
      );
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: () => {
          signOut().catch(() => {
            Alert.alert('Error', 'Could not log out. Please try again.');
          });
        },
      },
    ]);
  }

  function togglePasswordSection() {
    if (loading) return;

    if (passwordExpanded) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }

    setPasswordExpanded(!passwordExpanded);
  }

  return (
    <Screen scroll keyboard className="bg-gray-50" contentClassName="gap-6 p-5">
      <View>
        <Text className="text-3xl font-bold text-gray-900">Profile</Text>
        <Text className="mt-2 text-base text-gray-500">Manage your account and security.</Text>
      </View>

      {/* Change password option */}
      <View className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
        <Pressable
          onPress={togglePasswordSection}
          accessibilityRole="button"
          accessibilityState={{ expanded: passwordExpanded }}
          className="flex-row items-center px-5 py-5 active:bg-gray-50">
          <View className="mr-4 h-11 w-11 items-center justify-center rounded-xl bg-emerald-50">
            <Ionicons name="lock-closed-outline" size={22} color="#059669" />
          </View>

          <View className="flex-1">
            <Text className="text-base font-bold text-gray-900">Change password</Text>
            <Text className="mt-1 text-sm text-gray-500">Update your account password</Text>
          </View>

          <Ionicons
            name={passwordExpanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color="#6B7280"
          />
        </Pressable>

        {passwordExpanded && (
          <View className="gap-4 border-t border-gray-100 px-5 pb-5 pt-5">
            <View className="gap-2">
              <Text className="text-sm font-semibold text-gray-700">Current password</Text>
              <TextInput
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Enter current password"
                placeholderTextColor="#9CA3AF"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="current-password"
                editable={!loading}
                className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-4 text-base text-gray-900"
              />
            </View>

            <View className="gap-2">
              <Text className="text-sm font-semibold text-gray-700">New password</Text>
              <TextInput
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Enter new password"
                placeholderTextColor="#9CA3AF"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="new-password"
                editable={!loading}
                className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-4 text-base text-gray-900"
              />
            </View>

            <View className="gap-2">
              <Text className="text-sm font-semibold text-gray-700">Confirm new password</Text>
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm new password"
                placeholderTextColor="#9CA3AF"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="new-password"
                editable={!loading}
                returnKeyType="done"
                onSubmitEditing={handleChangePassword}
                className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-4 text-base text-gray-900"
              />
            </View>

            <Pressable
              onPress={handleChangePassword}
              disabled={loading}
              accessibilityRole="button"
              className={`mt-1 min-h-14 flex-row items-center justify-center rounded-xl px-4 py-4 ${
                loading ? 'bg-emerald-400' : 'bg-emerald-600 active:bg-emerald-700'
              }`}>
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="font-bold text-white">Update password</Text>
              )}
            </Pressable>
          </View>
        )}
      </View>

      {/* Logout option */}
      <View className="rounded-2xl border border-red-100 bg-white p-5">
        <View className="mb-4 flex-row items-center">
          <View className="mr-4 h-11 w-11 items-center justify-center rounded-xl bg-red-50">
            <Ionicons name="log-out-outline" size={22} color="#DC2626" />
          </View>

          <View className="flex-1">
            <Text className="text-base font-bold text-gray-900">Log out</Text>
            <Text className="mt-1 text-sm text-gray-500">
              Sign out of your account on this device.
            </Text>
          </View>
        </View>

        <Pressable
          onPress={handleLogout}
          disabled={loading}
          accessibilityRole="button"
          className="min-h-12 flex-row items-center justify-center rounded-xl border border-red-200 bg-red-50 px-4 py-3 active:bg-red-100">
          <Text className="font-bold text-red-600">Log out</Text>
        </Pressable>
      </View>
    </Screen>
  );
}
