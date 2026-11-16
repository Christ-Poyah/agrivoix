import { useState } from 'react';
import { Platform, StyleSheet, TextInput } from 'react-native';

import { colors } from '../theme';

const LINE = 20;
const PAD = 11;
const MIN = LINE + PAD * 2; // 42, comme les boutons ronds
const MAX = 110;

type Props = { value: string; onChangeText: (t: string) => void; placeholder: string };

/** Champ de message : une ligne = 42 px (aligné avec les boutons), grandit avec le texte. */
export function ComposerInput({ value, onChangeText, placeholder }: Props) {
  const [contentH, setContentH] = useState(LINE);
  // Sur le web, la taille du contenu dépend de la hauteur du champ (boucle) : hauteur fixe.
  const height = Platform.OS === 'web' ? MIN : Math.min(MAX, Math.max(MIN, Math.round(contentH) + PAD * 2));

  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.muted}
      multiline
      onContentSizeChange={(e) => setContentH(Math.max(LINE, Math.min(e.nativeEvent.contentSize.height, MAX)))}
      scrollEnabled={height >= MAX}
      style={[styles.input, { height }]}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    flex: 1,
    paddingHorizontal: 10,
    paddingTop: PAD,
    paddingBottom: PAD,
    fontSize: 15.5,
    lineHeight: LINE,
    color: colors.text,
    textAlignVertical: 'center',
  },
});
