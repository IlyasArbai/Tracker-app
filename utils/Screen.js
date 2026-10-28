import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Screen({
  children,
  scroll = false,
  keyboard = false,
  className = '',
  contentClassName = '',
  edges = ['top'],
  refreshControl,
}) {
  const content = scroll ? (
    <ScrollView
      className="flex-1"
      contentContainerClassName={`flex-grow p-5 ${contentClassName}`}
      keyboardShouldPersistTaps="handled"
      refreshControl={refreshControl}
      showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  ) : (
    <View className={`flex-1 p-5 ${className}`}>{children}</View>
  );

  return (
    <SafeAreaView className={`flex-1 bg-gray-50 ${scroll ? '' : className}`} edges={edges}>
      {keyboard ? (
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          {content}
        </KeyboardAvoidingView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}
