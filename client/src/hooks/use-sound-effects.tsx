import { useState, useEffect, useCallback, useRef } from 'react';

type SoundEffect = 'click' | 'success' | 'error' | 'spin' | 'notification';

const soundUrls: Record<SoundEffect, string> = {
  click: '/sounds/click.mp3',
  success: '/sounds/success.mp3',
  error: '/sounds/error.mp3',
  spin: '/sounds/spin.mp3',
  notification: '/sounds/notification.mp3'
};

export function useSoundEffects() {
  const [muted, setMuted] = useState<boolean>(() => {
    // Try to load preference from localStorage
    const savedPreference = localStorage.getItem('soundEffectsMuted');
    return savedPreference ? savedPreference === 'true' : false;
  });
  
  const audioElementsRef = useRef<Record<SoundEffect, HTMLAudioElement | null>>({
    click: null,
    success: null,
    error: null,
    spin: null,
    notification: null
  });
  
  useEffect(() => {
    // Create audio elements when component mounts
    Object.entries(soundUrls).forEach(([key, url]) => {
      const audio = new Audio(url);
      audio.preload = 'auto';
      audio.volume = 0.5;
      audioElementsRef.current[key as SoundEffect] = audio;
    });
    
    // Save muted preference when it changes
    localStorage.setItem('soundEffectsMuted', muted.toString());
    
    // Clean up audio elements when component unmounts
    return () => {
      Object.values(audioElementsRef.current).forEach(audio => {
        if (audio) {
          audio.pause();
          audio.src = '';
        }
      });
    };
  }, [muted]);
  
  const play = useCallback((effect: SoundEffect) => {
    if (muted) return;
    
    const audio = audioElementsRef.current[effect];
    if (audio) {
      // Reset audio to beginning if it's already playing
      audio.pause();
      audio.currentTime = 0;
      
      // Play the audio with a small delay to avoid blocking UI
      setTimeout(() => {
        audio.play().catch(err => {
          console.warn('Failed to play audio:', err);
        });
      }, 10);
    }
  }, [muted]);
  
  const toggleMute = useCallback(() => {
    setMuted(prev => !prev);
  }, []);
  
  return { play, muted, toggleMute };
}

// To use this hook:
// const { play, muted, toggleMute } = useSoundEffects();
// play('click'); // To play a sound
// <button onClick={toggleMute}>{muted ? 'Unmute' : 'Mute'}</button> // To toggle muted state