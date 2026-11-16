import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { useCallback, useState } from 'react';
import { Alert } from 'react-native';

export type Recording = { uri: string; durationMs: number };

/** Enregistrement vocal : démarrer / arrêter (garde le fichier) / annuler. */
export function useVoiceRecorder() {
  const recorder = useAudioRecorder({ ...RecordingPresets.HIGH_QUALITY, directory: 'document' });
  const state = useAudioRecorderState(recorder, 200);
  const [busy, setBusy] = useState(false);

  const start = useCallback(async () => {
    if (busy || state.isRecording) return false;
    setBusy(true);
    try {
      const perm = await AudioModule.requestRecordingPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Micro refusé', "Autorisez le micro dans les réglages pour enregistrer un vocal.");
        return false;
      }
      await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      return true;
    } catch {
      Alert.alert('Erreur', "Impossible de démarrer l'enregistrement.");
      return false;
    } finally {
      setBusy(false);
    }
  }, [busy, recorder, state.isRecording]);

  const stop = useCallback(async (): Promise<Recording | null> => {
    if (!state.isRecording) return null;
    const durationMs = state.durationMillis;
    try {
      await recorder.stop();
      await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false });
    } catch {
      return null;
    }
    const uri = recorder.uri;
    if (!uri || durationMs < 700) return null; // trop court : ignoré
    return { uri, durationMs };
  }, [recorder, state.isRecording, state.durationMillis]);

  return { isRecording: state.isRecording, durationMs: state.durationMillis, start, stop };
}

export function formatDuration(ms: number) {
  const s = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
