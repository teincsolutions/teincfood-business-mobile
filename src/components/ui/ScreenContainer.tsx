import { ScrollView, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Props {
  children: React.ReactNode;
  scrollable?: boolean;
}

export function ScreenContainer({ children, scrollable = false }: Props) {
  const insets = useSafeAreaInsets();
  const inner = (
    <View
      style={[
        styles.inner,
        { paddingBottom: insets.bottom + 16 },
      ]}
    >
      {children}
    </View>
  );

  if (scrollable) {
    return (
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {inner}
      </ScrollView>
    );
  }
  return <View style={styles.container}>{inner}</View>;
}

const styles = StyleSheet.create({
  inner: {
    flex: 1,
    width: '100%',
    maxWidth: 798,
    alignSelf: 'center',
    paddingHorizontal: 20,
  },
  scrollContainer: {
    flexGrow: 1,
    alignItems: 'center',
  },
  container: {
    flex: 1,
    alignItems: 'center',
  },
});
