import { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import Screen from '@/Screen';
import api from '@/api';
import TrackModal from '@/modal';

const CURRENCY = '฿';

const EMPTY_FORM = {
  type: 'Expense',
  amount: '',
  reason: '',
};

function getErrorMessage(error) {
  return (
    error.response?.data?.error ||
    error.response?.data?.err ||
    error.response?.data?.message ||
    error.message ||
    'Please try again.'
  );
}

function formatAmount(value) {
  return `${CURRENCY}${Math.abs(Number(value || 0)).toLocaleString('en-US', {
    maximumFractionDigits: 0,
  })}`;
}

function isIncome(track) {
  return String(track?.type || '').toLowerCase() === 'income';
}

export default function TrackDetailsScreen() {
  const { id } = useLocalSearchParams();
  const trackId = Array.isArray(id) ? id[0] : id;

  const [track, setTrack] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const [showEdit, setShowEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  function updateForm(key, value) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  // Load this transaction.
  const fetchTrack = useCallback(async () => {
    if (!trackId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const { data } = await api.get(`/tracks/${encodeURIComponent(trackId)}`);

      if (!data.success) {
        throw new Error(data.error || data.err || data.message || 'Could not load transaction.');
      }

      setTrack(data.track || null);
    } catch (error) {
      Alert.alert('Could not load transaction', getErrorMessage(error), [
        { text: 'Go back', onPress: () => router.back() },
      ]);
    } finally {
      setLoading(false);
    }
  }, [trackId]);

  useEffect(() => {
    fetchTrack();
  }, [fetchTrack]);

  // Fill the form with the current transaction.
  function openEdit() {
    setShowEdit(true);
  }

  // Save changes.
  async function handleUpdate(form) {
    try {
      setSaving(true);

      const { data } = await api.patch(`/tracks/${encodeURIComponent(trackId)}`, form);

      if (!data.success) {
        throw new Error(data.error || data.err || data.message || 'Could not update transaction.');
      }

      setShowEdit(false);

      if (data.track) {
        setTrack(data.track);
      } else {
        await fetchTrack();
      }

      Alert.alert('Success', 'Transaction updated.');
    } catch (error) {
      Alert.alert(
        'Update failed',
        error.response?.data?.error ||
          error.response?.data?.err ||
          error.response?.data?.message ||
          error.message ||
          'Please try again.'
      );
    } finally {
      setSaving(false);
    }
  }

  // Ask for confirmation before deleting.
  function handleDelete() {
    Alert.alert(
      'Delete transaction',
      'Are you sure you want to permanently delete this transaction?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: deleteTrack,
        },
      ]
    );
  }

  async function deleteTrack() {
    try {
      setDeleting(true);

      const { data } = await api.delete(`/tracks/${encodeURIComponent(trackId)}`);

      if (!data.success) {
        throw new Error(data.error || data.err || data.message || 'Could not delete transaction.');
      }

      router.replace('/');
    } catch (error) {
      Alert.alert('Delete failed', getErrorMessage(error));
    } finally {
      setDeleting(false);
    }
  }

  // Loading screen.
  if (loading) {
    return (
      <Screen className="items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#059669" />
        <Text className="mt-3 text-gray-500">Loading transaction...</Text>
      </Screen>
    );
  }

  // Transaction not found.
  if (!track) {
    return (
      <Screen className="items-center justify-center bg-gray-50">
        <Ionicons name="document-text-outline" size={48} color="#9CA3AF" />

        <Text className="mt-4 text-lg font-bold text-gray-900">Transaction not found</Text>

        <Pressable
          onPress={() => router.back()}
          className="mt-5 rounded-xl bg-emerald-600 px-6 py-3">
          <Text className="font-bold text-white">Go back</Text>
        </Pressable>
      </Screen>
    );
  }

  const income = isIncome(track);
  const amount = Number(track.amount || 0);
  const title = track.reason || 'Transaction';
  const date = track.createdAt ? new Date(track.createdAt) : null;
  const validDate = date && !Number.isNaN(date.getTime());

  return (
    <>
      <Screen scroll className="bg-gray-50" contentClassName="pb-10 pt-5">
        {/* Back button */}
        <Pressable
          onPress={() => router.back()}
          className="mb-6 flex-row items-center self-start py-2">
          <Ionicons name="arrow-back" size={22} color="#374151" />
          <Text className="ml-2 font-semibold text-gray-700">Back</Text>
        </Pressable>

        {/* Transaction summary */}
        <View className="items-center rounded-3xl bg-white px-6 py-8">
          <View
            className={`mb-4 h-16 w-16 items-center justify-center rounded-2xl ${
              income ? 'bg-emerald-50' : 'bg-red-50'
            }`}>
            <Ionicons
              name={income ? 'arrow-down-outline' : 'arrow-up-outline'}
              size={30}
              color={income ? '#059669' : '#DC2626'}
            />
          </View>

          <Text className="text-sm font-medium text-gray-500">{income ? 'INCOME' : 'EXPENSE'}</Text>

          <Text
            className={`mt-2 text-4xl font-bold ${income ? 'text-emerald-700' : 'text-red-600'}`}>
            {income ? '+' : '-'}
            {formatAmount(amount)}
          </Text>

          <Text className="mt-4 text-center text-xl font-bold text-gray-900">{title}</Text>
        </View>

        {/* Transaction information */}
        <View className="mt-5 rounded-3xl bg-white p-5">
          <Text className="mb-5 text-lg font-bold text-gray-900">Transaction details</Text>

          <View className="mb-5 flex-row items-center justify-between">
            <Text className="text-gray-500">Type</Text>
            <Text className="font-semibold text-gray-900">{track.type}</Text>
          </View>

          <View className="mb-5 flex-row items-center justify-between">
            <Text className="text-gray-500">Amount</Text>
            <Text className="font-semibold text-gray-900">{formatAmount(amount)}</Text>
          </View>

          <View className="mb-5 flex-row items-center justify-between">
            <Text className="text-gray-500">Date created</Text>
            <Text className="font-semibold text-gray-900">
              {validDate ? date.toLocaleDateString() : '—'}
            </Text>
          </View>

          <View className="border-t border-gray-100 pt-4">
            <Text className="mb-2 text-gray-500">Reason</Text>
            <Text className="leading-6 text-gray-800">{track.reason || '—'}</Text>
          </View>
        </View>

        {/* Edit button */}
        <Pressable
          onPress={openEdit}
          disabled={deleting}
          className="mt-5 min-h-14 flex-row items-center justify-center rounded-2xl bg-emerald-600 px-4 py-4">
          <Ionicons name="create-outline" size={21} color="#FFFFFF" />
          <Text className="ml-2 font-bold text-white">Edit transaction</Text>
        </Pressable>

        {/* Delete button */}
        <Pressable
          onPress={handleDelete}
          disabled={deleting}
          className="mt-3 min-h-14 flex-row items-center justify-center rounded-2xl border border-red-200 bg-white px-4 py-4">
          {deleting ? (
            <ActivityIndicator color="#DC2626" />
          ) : (
            <>
              <Ionicons name="trash-outline" size={20} color="#DC2626" />
              <Text className="ml-2 font-bold text-red-600">Delete transaction</Text>
            </>
          )}
        </Pressable>
      </Screen>

      <TrackModal
        visible={showEdit}
        mode="edit"
        track={track}
        saving={saving}
        onClose={() => setShowEdit(false)}
        onSave={handleUpdate}
      />
    </>
  );
}
