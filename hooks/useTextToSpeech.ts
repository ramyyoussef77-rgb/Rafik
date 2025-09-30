import { useState, useRef, useEffect, useCallback } from 'react';

export const useTextToSpeech = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const speak = useCallback((text: string, messageId: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      console.warn('Text-to-speech is not supported in this browser.');
      return;
    }
    
    // Stop any currently speaking utterance
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Find an Arabic voice
    const voices = window.speechSynthesis.getVoices();
    const arabicVoice = voices.find(voice => voice.lang.startsWith('ar-'));
    if (arabicVoice) {
      utterance.voice = arabicVoice;
    } else {
        console.warn("No Arabic voice found, using default.");
    }

    utterance.lang = 'ar-SA';
    utterance.rate = 0.9;
    utterance.pitch = 1;

    utterance.onstart = () => {
        setIsSpeaking(true);
        setSpeakingMessageId(messageId);
    };
    utterance.onend = () => {
        setIsSpeaking(false);
        setSpeakingMessageId(null);
    };
    utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
      // Log the specific error code for better debugging
      console.error('Speech synthesis error:', event.error);
      setIsSpeaking(false);
      setSpeakingMessageId(null);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, []);

  const cancel = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setSpeakingMessageId(null);
    }
  }, []);
  
  // Ensure voices are loaded
  useEffect(() => {
      const triggerVoicesLoad = () => window.speechSynthesis.getVoices();
      triggerVoicesLoad();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = triggerVoicesLoad;
      }
  }, []);

  return { speak, cancel, isSpeaking, speakingMessageId };
};