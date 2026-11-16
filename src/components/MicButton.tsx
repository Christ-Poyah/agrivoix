import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';

import { colors, gradients, radius } from '../theme';

type Props = { recording: boolean; onPress: () => void; size?: number };

/** Bouton micro : halo qui respire au repos, onde qui se propage pendant l'enregistrement. */
export function MicButton({ recording, onPress, size = 104 }: Props) {
  const [pulse] = useState(() => new Animated.Value(0));

  useEffect(() => {
    pulse.setValue(0);
    const loop = Animated.loop(
      Animated.timing(pulse, {
        toValue: 1,
        duration: recording ? 1100 : 2400,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [recording, pulse]);

  const tint = recording ? colors.danger : colors.primary;
  const box = size * 1.9;

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        onPress();
      }}
      accessibilityLabel={recording ? "Arrêter l'enregistrement" : 'Enregistrer un vocal'}
      style={{ width: box, height: box, alignItems: 'center', justifyContent: 'center' }}
    >
      <Animated.View
        style={[
          styles.ring,
          {
            width: size,
            height: size,
            backgroundColor: tint,
            opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [recording ? 0.35 : 0.22, 0] }),
            transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, recording ? 1.8 : 1.5] }) }],
          },
        ]}
      />
      <View style={[styles.shadow, { width: size, height: size, shadowColor: tint }]}>
        <LinearGradient
          colors={recording ? gradients.buttonRec : gradients.button}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.core}
        >
          <Ionicons name={recording ? 'stop' : 'mic'} size={size * 0.42} color="#fff" />
        </LinearGradient>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  ring: { position: 'absolute', borderRadius: radius.full },
  shadow: {
    borderRadius: radius.full,
    borderWidth: 5,
    borderColor: '#fff',
    shadowOpacity: 0.45,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
    backgroundColor: '#fff',
  },
  core: { flex: 1, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
});
