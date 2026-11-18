import { useCallback, useEffect, useMemo, useState } from "react";

const cantoneseVoice = (voices: SpeechSynthesisVoice[]) =>
  voices.find((voice) => voice.lang.toLowerCase() === "zh-hk") ??
  voices.find((voice) => voice.lang.toLowerCase().startsWith("yue"));

export const useCantoneseSpeech = () => {
  const supported =
    typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    "SpeechSynthesisUtterance" in window;
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [speakingId, setSpeakingId] = useState("");
  const voice = useMemo(() => cantoneseVoice(voices), [voices]);

  useEffect(() => {
    if (!supported) return;
    const refresh = () => setVoices(window.speechSynthesis.getVoices());
    refresh();
    window.speechSynthesis.addEventListener("voiceschanged", refresh);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", refresh);
      window.speechSynthesis.cancel();
    };
  }, [supported]);

  const stop = useCallback(() => {
    if (supported) window.speechSynthesis.cancel();
    setSpeakingId("");
  }, [supported]);

  const play = useCallback(
    (id: string, text: string) => {
      if (!supported || !voice || !text.trim()) return false;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text.trim());
      utterance.voice = voice;
      utterance.lang = voice.lang;
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.onend = () => setSpeakingId("");
      utterance.onerror = () => setSpeakingId("");
      setSpeakingId(id);
      window.speechSynthesis.speak(utterance);
      return true;
    },
    [supported, voice],
  );

  return {
    available: Boolean(supported && voice),
    play,
    speakingId,
    stop,
    voiceName: voice?.name ?? "",
  };
};
