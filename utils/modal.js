import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const CURRENCY = '฿';

const EMPTY_FORM = {
  type: 'Expense',
  amount: '',
  reason: '',
};

export default function TrackModal({
  visible,
  mode = 'create',
  track = null,
  saving = false,
  onClose,
  onSave,
}) {
  const [form, setForm] = useState(EMPTY_FORM);

  const isEditing = mode === 'edit';

  // Reset the form whenever the modal opens.
  // In edit mode, fill it with the existing transaction.
  useEffect(() => {
    if (!visible) return;

    if (isEditing && track) {
      setForm({
        type: String(track.type || '').toLowerCase() === 'income' ? 'Income' : 'Expense',
        amount: String(track.amount ?? ''),
        reason: track.reason ?? '',
      });
    } else {
      setForm({ ...EMPTY_FORM });
    }
  }, [visible, isEditing, track]);

  function updateForm(key, value) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function handleSave() {
    const reason = form.reason.trim();
    const amountText = form.amount.trim();
    const amount = Number(amountText);

    if (!reason || !amountText) {
      Alert.alert('Missing information', 'Enter a reason and an amount.');
      return;
    }

    if (reason.length > 200) {
      Alert.alert('Reason too long', 'The reason cannot exceed 200 characters.');
      return;
    }

    if (!Number.isSafeInteger(amount) || amount <= 0) {
      Alert.alert('Invalid amount', 'Enter a positive whole number without decimals.');
      return;
    }

    await onSave({
      type: form.type,
      amount,
      reason,
    });
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={() => {
        if (!saving) onClose();
      }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 justify-end bg-black/40">
        <View className="max-h-[85%] rounded-t-3xl bg-white px-5 pb-8 pt-6">
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View className="mb-6 flex-row items-center justify-between">
              <View>
                <Text className="text-2xl font-bold text-gray-900">
                  {isEditing ? 'Edit transaction' : 'New transaction'}
                </Text>

                <Text className="mt-1 text-sm text-gray-500">
                  {isEditing ? 'Update your transaction details' : 'Record your income or expense'}
                </Text>
              </View>

              <Pressable
                disabled={saving}
                onPress={onClose}
                className="h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                <Ionicons name="close" size={23} color="#374151" />
              </Pressable>
            </View>

            {/* Transaction type */}
            <Text className="mb-2 text-sm font-semibold text-gray-700">Transaction type</Text>

            <View className="mb-5 flex-row gap-3">
              {['Income', 'Expense'].map((type) => {
                const selected = form.type === type;
                const income = type === 'Income';

                return (
                  <Pressable
                    key={type}
                    disabled={saving}
                    onPress={() => updateForm('type', type)}
                    className={`flex-1 items-center rounded-xl border py-3 ${
                      selected
                        ? income
                          ? 'border-emerald-600 bg-emerald-50'
                          : 'border-red-500 bg-red-50'
                        : 'border-gray-200 bg-gray-50'
                    }`}>
                    <Text
                      className={`font-bold ${
                        selected ? (income ? 'text-emerald-700' : 'text-red-600') : 'text-gray-500'
                      }`}>
                      {type}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Reason */}
            <Text className="mb-2 text-sm font-semibold text-gray-700">Reason</Text>

            <TextInput
              value={form.reason}
              onChangeText={(value) => updateForm('reason', value)}
              placeholder={
                isEditing ? 'What was this transaction for?' : 'e.g. Salary, lunch, transport'
              }
              placeholderTextColor="#9CA3AF"
              maxLength={200}
              editable={!saving}
              className="mb-4 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 text-base text-gray-900"
            />

            {/* Amount */}
            <Text className="mb-2 text-sm font-semibold text-gray-700">Amount ({CURRENCY})</Text>

            <TextInput
              value={form.amount}
              onChangeText={(value) => updateForm('amount', value)}
              placeholder="Enter a whole number"
              placeholderTextColor="#9CA3AF"
              keyboardType="number-pad"
              editable={!saving}
              className="mb-6 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 text-base text-gray-900"
            />

            {/* Save button */}
            <Pressable
              onPress={handleSave}
              disabled={saving}
              className={`min-h-14 flex-row items-center justify-center rounded-2xl py-4 ${
                saving ? 'bg-emerald-400' : 'bg-emerald-600'
              }`}>
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={21} color="#FFFFFF" />
                  <Text className="ml-2 text-base font-bold text-white">
                    {isEditing ? 'Save changes' : 'Save transaction'}
                  </Text>
                </>
              )}
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
