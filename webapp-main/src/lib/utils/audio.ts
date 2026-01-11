/**
 * @file audio.ts
 * @brief Audio and Haptic feedback utility for the Rest Timer.
 *
 * This module handles "polite" audio playback by attempting to duck other audio if possible,
 * and manages vibration patterns for device feedback.
 */

export class audioManager {
    private static audioContext: AudioContext | null = null;
    private static gainNode: GainNode | null = null;
    private static isInitialized = false;

    /**
     * @brief Initialize AudioContext on first user interaction.
     *
     * Browsers often block AudioContext until a user gesture occurs.
     * This method ensures the context is created and ready.
     */
    static init() {
        if (this.isInitialized) return;

        try {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioContextClass) {
                this.audioContext = new AudioContext();
                this.gainNode = this.audioContext.createGain();
                this.gainNode.connect(this.audioContext.destination);
                this.isInitialized = true;
            }
        } catch (e) {
            console.warn('AudioContext not supported', e);
        }
    }

    /**
     * @brief Plays a pleasant chime sound.
     *
     * Uses a synthesized sound to avoid external asset dependencies and ensure snappy loading.
     * Generates a primary sine wave tone (A5) and a triangle harmonic (A6) with decay.
     *
     * @async
     */
    static async playChime() {
        if (!this.isInitialized) this.init();
        if (!this.audioContext || !this.gainNode) return;

        // Resume context if suspended (browser autoplay policy)
        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }

        const now = this.audioContext.currentTime;

        // Simple nice chime: Sine wave with decay
        // Primary tone
        const osc1 = this.audioContext.createOscillator();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(880, now); // A5
        osc1.frequency.exponentialRampToValueAtTime(0.01, now + 1.5);

        const gain1 = this.audioContext.createGain();
        gain1.gain.setValueAtTime(0.3, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

        osc1.connect(gain1);
        gain1.connect(this.gainNode);

        osc1.start(now);
        osc1.stop(now + 1.5);

        // Harmonic
        const osc2 = this.audioContext.createOscillator();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(1760, now); // A6
        osc2.frequency.exponentialRampToValueAtTime(0.01, now + 1.0);

        const gain2 = this.audioContext.createGain();
        gain2.gain.setValueAtTime(0.1, now);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.0);

        osc2.connect(gain2);
        gain2.connect(this.gainNode);

        osc2.start(now);
        osc2.stop(now + 1.0);
    }

    /**
     * @brief Triggers device vibration.
     *
     * Wrapper around navigator.vibrate.
     *
     * @param pattern Vibrate pattern in ms (single number or array). Default is 200ms.
     */
    static vibrate(pattern: number | number[] = 200) {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(pattern);
        }
    }

    /**
     * @brief Plays the completion alert (Sound + Haptics).
     *
     * Triggers a double pulse vibration and plays the chime.
     * @async
     */
    static async playCompletionAlert() {
        // Haptics: Double pulse
        this.vibrate([500, 100, 500]);

        // Audio
        await this.playChime();
    }

    /**
     * @brief Plays a subtle tick/warning sound.
     *
     * Used for countdowns (e.g., 3-2-1). Uses a short, high-frequency blip.
     * @async
     */
    static async playTick() {
        if (!this.isInitialized) this.init();
        if (!this.audioContext || !this.gainNode) return;

        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }

        const now = this.audioContext.currentTime;
        const osc = this.audioContext.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);

        const gain = this.audioContext.createGain();
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

        osc.connect(gain);
        gain.connect(this.gainNode);

        osc.start(now);
        osc.stop(now + 0.1);

        // Light haptic
        this.vibrate(50);
    }
}
