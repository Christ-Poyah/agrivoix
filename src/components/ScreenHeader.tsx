import { LinearGradient } from 'expo-linear-gradient';
import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { gradients, radius } from '../theme';

type Props = { title: string; subtitle?: string; right?: ReactNode; left?: ReactNode };

export function ScreenHeader({ title, subtitle, right, left }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <LinearGradient
      colors={gradients.hero}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.wrap, { paddingTop: insets.top + 14 }]}
    >
      <View style={styles.row}>
        {left}
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {right}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 20, paddingBottom: 22, borderBottomLeftRadius: radius.xl, borderBottomRightRadius: radius.xl },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { fontSize: 26, fontWeight: '800', color: '#fff' },
  subtitle: { marginTop: 2, fontSize: 14, color: 'rgba(255,255,255,0.8)' },
});
