import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

type Props = { active: boolean; bars?: number; color?: string; height?: number };

/** Barres de « son » : animées pendant l'enregistrement, calmes sinon. */
export function Waveform({ active, bars = 28, color = 'rgba(255,255,255,0.85)', height = 56 }: Props) {
  const [values] = useState(() => Array.from({ length: bars }, () => new Animated.Value(0)));

  useEffect(() => {
    const loops = values.map((v, i) => {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(v, { toValue: 1, duration: 280 + ((i * 53) % 320), easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(v, { toValue: 0, duration: 280 + ((i * 71) % 320), easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        ]),
      );
      return loop;
    });
    if (active) loops.forEach((l) => l.start());
    else values.forEach((v) => v.setValue(0));
    return () => loops.forEach((l) => l.stop());
  }, [active, values]);

  return (
    <View style={[styles.row, { height }]}>
      {values.map((v, i) => {
        const base = 0.18 + 0.22 * Math.abs(Math.sin(i * 0.9)); // silhouette au repos
        return (
          <Animated.View
            key={i}
            style={{
              width: 4,
              height,
              borderRadius: 2,
              backgroundColor: color,
              opacity: active ? 1 : 0.55,
              transform: [{ scaleY: active ? v.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.4 + 0.6 * Math.abs(Math.cos(i * 1.3))] }) : base }],
            }}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
});
