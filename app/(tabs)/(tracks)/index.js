import { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Modal,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Screen from '@/Screen';
import api from '@/api';
import TrackModal from '@/modal';

const formatAmount = (amount) =>
  `฿${Number(amount || 0).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;

const getAmount = (track) => Number(track.amount || 0);
const isIncome = (track) => String(track.type || '').toLowerCase() === 'income';

const getTrackDate = (track) => {
  const date = new Date(track.createdAt);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getMonthKey = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

const formatMonth = (key) => {
  const [year, month] = key.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
};

const formatDay = (key, includeYear = true) => {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    ...(includeYear ? { year: 'numeric' } : {}),
  });
};

const getTotals = (tracks) => {
  let income = 0;
  let expenses = 0;
  for (const track of tracks) {
    const amount = getAmount(track);
    if (isIncome(track)) income += amount;
    else expenses += amount;
  }
  return { income, expenses, net: income - expenses, count: tracks.length };
};

/** Groups tracks into a Map keyed by month (YYYY-MM) or day (YYYY-MM-DD). */
const groupTracksBy = (tracks, getKey) => {
  const groups = new Map();
  for (const track of tracks) {
    const date = getTrackDate(track);
    if (!date) continue;
    const key = getKey(date);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(track);
  }
  return groups;
};

const getErrorMessage = (error) =>
  error.response?.data?.error ||
  error.response?.data?.err ||
  error.response?.data?.message ||
  error.message ||
  'Please try again.';

export default function TracksScreen() {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const [filter, setFilter] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState(getMonthKey(new Date()));
  const [selectedDay, setSelectedDay] = useState(getDateKey(new Date()));
  const [selectorType, setSelectorType] = useState(null); // null | 'month' | 'day'

  const fetchTracks = useCallback(async (showLoader = false) => {
    try {
      if (showLoader) setLoading(true);
      const { data } = await api.get('/tracks');
      setTracks(Array.isArray(data.tracks) ? data.tracks : []);
    } catch (error) {
      Alert.alert('Error', getErrorMessage(error));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchTracks(true);
    }, [fetchTracks])
  );

  const sortedTracks = useMemo(
    () =>
      [...tracks].sort(
        (a, b) => (getTrackDate(b)?.getTime() || 0) - (getTrackDate(a)?.getTime() || 0)
      ),
    [tracks]
  );

  const byMonth = useMemo(() => groupTracksBy(sortedTracks, getMonthKey), [sortedTracks]);
  const byDay = useMemo(() => groupTracksBy(sortedTracks, getDateKey), [sortedTracks]);

  const monthOptions = useMemo(() => [...byMonth.keys()], [byMonth]);
  const dayOptions = useMemo(() => [...byDay.keys()], [byDay]);

  const activeMonth = byMonth.has(selectedMonth) ? selectedMonth : monthOptions[0] || selectedMonth;
  const activeDay = byDay.has(selectedDay) ? selectedDay : dayOptions[0] || selectedDay;

  const monthTracks = byMonth.get(activeMonth) || [];
  const dayTracks = byDay.get(activeDay) || [];

  const monthlySummaries = useMemo(
    () =>
      monthOptions.map((month) => ({
        key: month,
        label: formatMonth(month),
        ...getTotals(byMonth.get(month) || []),
      })),
    [monthOptions, byMonth]
  );

  const dailySummaries = useMemo(
    () =>
      dayOptions
        .filter((day) => day.startsWith(activeMonth))
        .map((day) => ({
          key: day,
          label: formatDay(day),
          ...getTotals(byDay.get(day) || []),
        })),
    [dayOptions, byDay, activeMonth]
  );

  const visibleTracks =
    filter === 'day' ? dayTracks : filter === 'month' ? monthTracks : sortedTracks;
  const totals = useMemo(() => getTotals(visibleTracks), [visibleTracks]);

  const handleSave = async (values) => {
    try {
      setSaving(true);
      const { data } = await api.post('/tracks', values);
      if (data.success === false) {
        throw new Error(data.message || 'Could not create transaction.');
      }
      setModalVisible(false);
      await fetchTracks();
    } catch (error) {
      Alert.alert('Could not save transaction', getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const goToMonth = (month) => {
    setSelectedMonth(month);
    const firstDay = dayOptions.find((day) => day.startsWith(month));
    if (firstDay) setSelectedDay(firstDay);
  };

  const chooseMonth = (month) => {
    goToMonth(month);
    setSelectorType(null);
  };

  const chooseDay = (day) => {
    setSelectedDay(day);
    setSelectedMonth(day.slice(0, 7));
    setSelectorType(null);
  };

  const openMonth = (month) => {
    goToMonth(month);
    setFilter('month');
  };

  const openDay = (day) => {
    setSelectedDay(day);
    setSelectedMonth(day.slice(0, 7));
    setFilter('day');
  };

  const selectorOptions = selectorType === 'month' ? monthOptions : dayOptions;
  const selectorValue = selectorType === 'month' ? activeMonth : activeDay;
  const selectorLabel = selectorType === 'month' ? 'Choose month' : 'Choose day';

  const renderSelector = (type) => {
    const isMonth = type === 'month';
    return (
      <Pressable
        onPress={() => setSelectorType(type)}
        className="mt-4 flex-row items-center justify-between rounded-2xl border border-gray-200 bg-white px-4 py-3.5 active:bg-gray-50">
        <View className="flex-row items-center gap-3">
          <View className="h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
            <Ionicons
              name={isMonth ? 'calendar-outline' : 'today-outline'}
              size={20}
              color="#374151"
            />
          </View>

          <View>
            <Text className="text-xs text-gray-500">
              {isMonth ? 'Selected month' : 'Selected day'}
            </Text>
            <Text className="mt-0.5 text-base font-semibold text-gray-900">
              {isMonth ? formatMonth(activeMonth) : formatDay(activeDay)}
            </Text>
          </View>
        </View>

        <Ionicons name="chevron-down" size={20} color="#6B7280" />
      </Pressable>
    );
  };

  const renderTotals = () => (
    <View className="mt-5 rounded-3xl bg-gray-900 p-5">
      <Text className="text-sm font-medium text-gray-300">
        {filter === 'all'
          ? 'All-time balance'
          : filter === 'month'
            ? 'Monthly balance'
            : 'Daily balance'}
      </Text>

      <Text
        className={`mt-2 text-3xl font-bold ${totals.net >= 0 ? 'text-white' : 'text-red-300'}`}>
        {formatAmount(totals.net)}
      </Text>

      <Text className="mt-1 text-sm text-gray-400">Income minus expenses</Text>

      <View className="mt-5 flex-row gap-3">
        <View className="flex-1 rounded-2xl bg-white/10 p-3">
          <View className="flex-row items-center gap-1.5">
            <Ionicons name="arrow-down-circle" size={17} color="#4ADE80" />
            <Text className="text-xs text-gray-300">Income</Text>
          </View>
          <Text className="mt-2 text-base font-bold text-green-400">
            {formatAmount(totals.income)}
          </Text>
        </View>

        <View className="flex-1 rounded-2xl bg-white/10 p-3">
          <View className="flex-row items-center gap-1.5">
            <Ionicons name="arrow-up-circle" size={17} color="#FCA5A5" />
            <Text className="text-xs text-gray-300">Expenses</Text>
          </View>
          <Text className="mt-2 text-base font-bold text-red-300">
            {formatAmount(totals.expenses)}
          </Text>
        </View>
      </View>

      <View className="mt-4 flex-row items-center gap-2 border-t border-white/10 pt-4">
        <Ionicons name="receipt-outline" size={17} color="#D1D5DB" />
        <Text className="text-sm text-gray-300">
          {totals.count} {totals.count === 1 ? 'transaction' : 'transactions'}
        </Text>
      </View>
    </View>
  );

  const renderSummaryRow = (item, type) => (
    <Pressable
      key={item.key}
      onPress={() => (type === 'month' ? openMonth(item.key) : openDay(item.key))}
      className="mb-3 rounded-2xl border border-gray-100 bg-white p-4 active:bg-gray-50">
      <View className="flex-row items-center justify-between">
        <View className="flex-1 pr-3">
          <Text className="text-base font-semibold text-gray-900">{item.label}</Text>
          <Text className="mt-1 text-xs text-gray-500">
            {item.count} {item.count === 1 ? 'transaction' : 'transactions'}
          </Text>
        </View>

        <View className="items-end">
          <Text
            className={`text-base font-bold ${item.net >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            {item.net > 0 ? '+' : ''}
            {formatAmount(item.net)}
          </Text>

          <View className="mt-1 flex-row items-center gap-2">
            <Text className="text-xs text-green-600">+{formatAmount(item.income)}</Text>
            <Text className="text-xs text-red-500">-{formatAmount(item.expenses)}</Text>
          </View>
        </View>

        <Ionicons name="chevron-forward" size={18} color="#9CA3AF" style={{ marginLeft: 8 }} />
      </View>
    </Pressable>
  );

  const renderTransaction = (track) => {
    const income = isIncome(track);
    const trackId = track.id ?? track._id;
    const date = getTrackDate(track);

    return (
      <Pressable
        key={String(trackId)}
        onPress={() => router.push(`/(tabs)/(tracks)/${encodeURIComponent(String(trackId))}`)}
        className="mb-3 flex-row items-center rounded-2xl border border-gray-100 bg-white p-4 active:bg-gray-50">
        <View
          className={`h-12 w-12 items-center justify-center rounded-2xl ${
            income ? 'bg-green-50' : 'bg-red-50'
          }`}>
          <Ionicons
            name={income ? 'arrow-down-outline' : 'arrow-up-outline'}
            size={23}
            color={income ? '#16A34A' : '#EF4444'}
          />
        </View>

        <View className="ml-3 flex-1">
          <Text numberOfLines={1} className="text-base font-semibold text-gray-900">
            {track.reason || (income ? 'Income' : 'Expense')}
          </Text>
          <Text className="mt-1 text-xs text-gray-500">
            {date
              ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : 'Time unavailable'}
          </Text>
        </View>

        <View className="items-end">
          <Text className={`text-base font-bold ${income ? 'text-green-600' : 'text-red-500'}`}>
            {income ? '+' : '-'}
            {formatAmount(getAmount(track))}
          </Text>
          <Text className="mt-1 text-xs text-gray-400">{income ? 'Income' : 'Expense'}</Text>
        </View>
      </Pressable>
    );
  };

  if (loading && !refreshing) {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#111827" />
          <Text className="mt-3 text-sm text-gray-500">Loading transactions...</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll={false} contentClassName="flex-1 bg-gray-50">
      <View className="flex-1">
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 20, paddingBottom: 36 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchTracks();
              }}
              tintColor="#111827"
            />
          }>
          {/* Header */}
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-2xl font-bold text-gray-900">My finances</Text>
              <Text className="mt-1 text-sm text-gray-500">Track your money, simply.</Text>
            </View>

            <Pressable
              onPress={() => setModalVisible(true)}
              className="h-12 w-12 items-center justify-center rounded-2xl bg-gray-900 active:bg-gray-700">
              <Ionicons name="add" size={28} color="#FFFFFF" />
            </Pressable>
          </View>

          {/* View tabs */}
          <View className="mt-6 flex-row rounded-2xl bg-gray-200/70 p-1">
            {[
              { key: 'day', label: 'Day' },
              { key: 'month', label: 'Month' },
              { key: 'all', label: 'All time' },
            ].map((item) => (
              <Pressable
                key={item.key}
                onPress={() => setFilter(item.key)}
                className={`flex-1 items-center rounded-xl py-3 ${
                  filter === item.key ? 'bg-white' : ''
                }`}
                style={
                  filter === item.key
                    ? { shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }
                    : undefined
                }>
                <Text
                  className={`text-sm font-semibold ${
                    filter === item.key ? 'text-gray-900' : 'text-gray-500'
                  }`}>
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Selector — only for Month / Day. Never in All time. */}
          {filter !== 'all' && renderSelector(filter)}

          {renderTotals()}

          {/* All time: monthly summaries */}
          {filter === 'all' && (
            <View className="mt-7">
              <View className="mb-4 flex-row items-center justify-between">
                <Text className="text-lg font-bold text-gray-900">Monthly overview</Text>
                <Text className="text-xs text-gray-500">{monthlySummaries.length} months</Text>
              </View>

              {monthlySummaries.length === 0 ? (
                <EmptyState
                  title="No transactions yet"
                  message="Add your first transaction to see your monthly overview."
                />
              ) : (
                monthlySummaries.map((item) => renderSummaryRow(item, 'month'))
              )}
            </View>
          )}

          {/* Month: daily summaries */}
          {filter === 'month' && (
            <View className="mt-7">
              <View className="mb-4">
                <Text className="text-lg font-bold text-gray-900">Daily overview</Text>
                <Text className="mt-1 text-sm text-gray-500">
                  Tap a day to see its transactions.
                </Text>
              </View>

              {dailySummaries.length === 0 ? (
                <EmptyState
                  title="No transactions this month"
                  message="Choose another month using the selector above."
                />
              ) : (
                dailySummaries.map((item) => renderSummaryRow(item, 'day'))
              )}
            </View>
          )}

          {/* Day: individual transactions */}
          {filter === 'day' && (
            <View className="mt-7">
              <View className="mb-4">
                <Text className="text-lg font-bold text-gray-900">Transactions</Text>
                <Text className="mt-1 text-sm text-gray-500">{formatDay(activeDay)}</Text>
              </View>

              {dayTracks.length === 0 ? (
                <EmptyState
                  title="No transactions on this day"
                  message="Choose another day or add a transaction."
                />
              ) : (
                dayTracks.map(renderTransaction)
              )}
            </View>
          )}
        </ScrollView>
      </View>

      {/* Period selector modal */}
      <Modal
        visible={selectorType !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectorType(null)}
        statusBarTranslucent>
        <View className="flex-1 justify-end bg-black/40">
          <Pressable onPress={() => setSelectorType(null)} className="absolute inset-0" />

          <View className="max-h-[70%] rounded-t-3xl bg-white px-5 pb-8 pt-5">
            <View className="mb-5 flex-row items-center justify-between">
              <View>
                <Text className="text-xl font-bold text-gray-900">{selectorLabel}</Text>
                <Text className="mt-1 text-sm text-gray-500">Select a period to view.</Text>
              </View>

              <Pressable
                onPress={() => setSelectorType(null)}
                className="h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                <Ionicons name="close" size={21} color="#374151" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {selectorOptions.map((option) => {
                const selected = option === selectorValue;
                const label = selectorType === 'month' ? formatMonth(option) : formatDay(option);

                return (
                  <Pressable
                    key={option}
                    onPress={() =>
                      selectorType === 'month' ? chooseMonth(option) : chooseDay(option)
                    }
                    className={`mb-2 flex-row items-center justify-between rounded-2xl border px-4 py-4 ${
                      selected ? 'border-gray-900 bg-gray-50' : 'border-gray-100 bg-white'
                    }`}>
                    <Text
                      className={`text-base ${
                        selected ? 'font-bold text-gray-900' : 'font-medium text-gray-700'
                      }`}>
                      {label}
                    </Text>

                    {selected && <Ionicons name="checkmark-circle" size={22} color="#111827" />}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Create transaction modal */}
      <TrackModal
        visible={modalVisible}
        mode="create"
        track={null}
        saving={saving}
        onClose={() => {
          if (!saving) setModalVisible(false);
        }}
        onSave={handleSave}
      />
    </Screen>
  );
}

function EmptyState({ title, message }) {
  return (
    <View className="items-center rounded-3xl border border-dashed border-gray-200 bg-white px-6 py-10">
      <View className="h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
        <Ionicons name="receipt-outline" size={27} color="#9CA3AF" />
      </View>

      <Text className="mt-4 text-base font-semibold text-gray-900">{title}</Text>
      <Text className="mt-2 text-center text-sm leading-5 text-gray-500">{message}</Text>
    </View>
  );
}
