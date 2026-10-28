import { Link, usePathname } from 'expo-router';
import { View, Text } from 'react-native';

export default function NotFoundScreen() {
  const pathname = usePathname();

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Unmatched route</Text>
      <Text>Path: {pathname}</Text>

      <Link href="/">
        <Text>Go to Tracks</Text>
      </Link>
    </View>
  );
}
