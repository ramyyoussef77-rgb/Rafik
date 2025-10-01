import { useState, useEffect, useCallback } from 'react';

interface QueueItem {
  text: string;
  messageId: string;
}

export const useTextToSpeech = () => {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);

  /**
   * Adds a piece of text to the speech queue.
   * This is designed to handle single sentences for smooth streaming.
   * @param text The text chunk (ideally a sentence) to speak.
   * @param messageId The ID of the message this text belongs to.
   */
  const speak = useCallback((text: string, messageId: string) => {
    if (text.trim()) {
      setQueue(prev => [...prev, { text: text.trim(), messageId }]);
    }
  }, []);

  /**
   * Clears the speech queue and stops any currently speaking utterance.
   */
  const cancel = useCallback(() => {
    setQueue([]);
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    // Immediately reset speaking state for a responsive UI
    setIsSpeaking(false);
    setSpeakingMessageId(null);
  }, []);

  // Effect to process the speech queue
  useEffect(() => {
    if (!isSpeaking && queue.length > 0) {
      const { text, messageId } = queue[0];
      
      const utterance = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();
      const arabicVoice = voices.find(voice => voice.lang.startsWith('ar-'));
      
      if (arabicVoice) {
        utterance.voice = arabicVoice;
      } else {
        console.warn("No Arabic voice found, using default.");
      }
      
      utterance.lang = 'ar-EG'; // Explicitly set to Egyptian Arabic for better pronunciation
      utterance.rate = 1.0; // A slightly more natural pace
      utterance.pitch = 1;

      utterance.onstart = () => {
        setIsSpeaking(true);
        setSpeakingMessageId(messageId);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        setSpeakingMessageId(null);
        setQueue(prev => prev.slice(1)); // Remove the spoken item and trigger the effect for the next
      };
      
      utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
        console.error('Speech synthesis error:', event.error);
        // Attempt a recovery for common errors like 'interrupted' or 'synthesis-failed'
        if (window.speechSynthesis.speaking) {
          window.speechSynthesis.cancel();
        }
        setIsSpeaking(false);
        setSpeakingMessageId(null);
        // After a short delay, try processing the rest of the queue.
        setTimeout(() => {
            setQueue(prev => prev.slice(1)); // Skip the problematic item
        }, 100);
      };

      window.speechSynthesis.speak(utterance);
    }
  }, [queue, isSpeaking]);

  // Effect to ensure browser voices are loaded
  useEffect(() => {
      const triggerVoicesLoad = () => window.speechSynthesis.getVoices();
      triggerVoicesLoad();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = triggerVoicesLoad;
      }
  }, []);

  return { speak, cancel, isSpeaking, speakingMessageId };
};
