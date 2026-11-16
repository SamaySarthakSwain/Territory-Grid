/**
 * ============================================================================
 * TERRITORY GRID // TACTICAL AUDIO & HAPTIC FEEDBACK ENGINE
 * ============================================================================
 * Procedurally synthesizes high-tech UI audio via standard Web Audio API
 * and triggers native tactile vibrations via Capacitor Haptics / Web Vibrate.
 * 100% offline, zero external audio asset dependency, zero network overhead.
 * ============================================================================
 */

(function (window) {
  'use strict';

  let audioCtx = null;
  let isUnlocked = false;

  function getAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  }

  // Unlock audio on initial user touch/click
  function unlockAudio() {
    if (isUnlocked) return;
    const ctx = getAudioContext();
    if (ctx) {
      if (ctx.state === 'suspended') {
        ctx.resume().then(() => {
          isUnlocked = true;
        }).catch(() => {});
      } else {
        isUnlocked = true;
      }
    }
  }

  window.addEventListener('click', unlockAudio, { once: true, passive: true });
  window.addEventListener('touchstart', unlockAudio, { once: true, passive: true });

  const tacticalAudio = {
    click: function () {
      try {
        const ctx = getAudioContext();
        if (!ctx) return;
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(440, now + 0.025);

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.03);
      } catch (e) {}
    },

    scan: function () {
      try {
        const ctx = getAudioContext();
        if (!ctx) return;
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(1320, now + 0.07);

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.075);
      } catch (e) {}
    },

    success: function () {
      try {
        const ctx = getAudioContext();
        if (!ctx) return;
        const now = ctx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 (Major arpeggio)

        notes.forEach((freq, i) => {
          const noteTime = now + (i * 0.06);
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, noteTime);

          gain.gain.setValueAtTime(0.15, noteTime);
          gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.14);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(noteTime);
          osc.stop(noteTime + 0.15);
        });
      } catch (e) {}
    },

    error: function () {
      try {
        const ctx = getAudioContext();
        if (!ctx) return;
        const now = ctx.currentTime;
        [160, 110].forEach((freq, i) => {
          const buzzTime = now + (i * 0.09);
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(freq, buzzTime);

          gain.gain.setValueAtTime(0.18, buzzTime);
          gain.gain.exponentialRampToValueAtTime(0.001, buzzTime + 0.08);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(buzzTime);
          osc.stop(buzzTime + 0.085);
        });
      } catch (e) {}
    },

    countdown: function () {
      try {
        const ctx = getAudioContext();
        if (!ctx) return;
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(330, now);
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.09);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.1);
      } catch (e) {}
    },

    award: function () {
      try {
        const ctx = getAudioContext();
        if (!ctx) return;
        const now = ctx.currentTime;
        const chords = [
          [523.25, 659.25, 783.99],       // C5 Major
          [587.33, 739.99, 880.00],       // D5 Major
          [659.25, 830.61, 987.77],       // E5 Major
          [1046.50, 1318.51, 1567.98]     // C6 High Triumph
        ];
        chords.forEach((chord, step) => {
          const t = now + step * 0.11;
          chord.forEach(freq => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, t);
            gain.gain.setValueAtTime(0.12, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(t);
            osc.stop(t + 0.3);
          });
        });
      } catch (e) {}
    },

    radar: function () {
      try {
        const ctx = getAudioContext();
        if (!ctx) return;
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1760, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.3);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.32);
      } catch (e) {}
    }
  };

  const tacticalHaptics = {
    light: function () {
      try {
        if (window.Capacitor?.Plugins?.Haptics) {
          window.Capacitor.Plugins.Haptics.impact({ style: 'LIGHT' }).catch(() => {});
        } else if (navigator.vibrate) {
          navigator.vibrate(15);
        }
      } catch (e) {}
    },

    medium: function () {
      try {
        if (window.Capacitor?.Plugins?.Haptics) {
          window.Capacitor.Plugins.Haptics.impact({ style: 'MEDIUM' }).catch(() => {});
        } else if (navigator.vibrate) {
          navigator.vibrate(30);
        }
      } catch (e) {}
    },

    success: function () {
      try {
        if (window.Capacitor?.Plugins?.Haptics) {
          window.Capacitor.Plugins.Haptics.notification({ type: 'SUCCESS' }).catch(() => {});
        } else if (navigator.vibrate) {
          navigator.vibrate([30, 40, 60]);
        }
      } catch (e) {}
    },

    error: function () {
      try {
        if (window.Capacitor?.Plugins?.Haptics) {
          window.Capacitor.Plugins.Haptics.notification({ type: 'ERROR' }).catch(() => {});
        } else if (navigator.vibrate) {
          navigator.vibrate([60, 50, 80]);
        }
      } catch (e) {}
    }
  };

  const tacticalFeedback = {
    audio: tacticalAudio,
    haptics: tacticalHaptics,

    click: function () {
      tacticalAudio.click();
      tacticalHaptics.light();
    },

    scan: function () {
      tacticalAudio.scan();
      tacticalHaptics.medium();
    },

    success: function () {
      tacticalAudio.success();
      tacticalHaptics.success();
    },

    error: function () {
      tacticalAudio.error();
      tacticalHaptics.error();
    },

    countdown: function () {
      tacticalAudio.countdown();
      tacticalHaptics.light();
    },

    award: function () {
      tacticalAudio.award();
      tacticalHaptics.success();
    },

    radar: function () {
      tacticalAudio.radar();
      tacticalHaptics.light();
    }
  };

  // Expose globally
  window.tacticalFeedback = tacticalFeedback;
  window.tacticalAudio = tacticalAudio;
  window.tacticalHaptics = tacticalHaptics;

  // Auto-delegate click feedback to tactical interactive elements
  document.addEventListener('click', function (e) {
    const target = e.target.closest('button, .tactical-btn, .btn, a.btn-action, [role="button"]');
    if (target && !target.hasAttribute('data-no-feedback')) {
      tacticalFeedback.click();
    }
  }, true);

})(window);
