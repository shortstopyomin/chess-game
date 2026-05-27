/**
 * Grandmaster Chess - Web Audio Sound Synthesizer
 * Synthesizes crisp, clean chess sound effects programmatically without external files.
 */

class ChessAudio {
    constructor() {
        this.ctx = null;
        this.volume = 0.5; // Default volume level
    }

    /**
     * Lazy-initialises the AudioContext on first user interaction to satisfy browser policies
     */
    init() {
        if (this.ctx) return;
        
        try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContextClass();
            console.log("Web Audio Context initialized successfully.");
        } catch (e) {
            console.error("Web Audio API not supported in this browser:", e);
        }
    }

    /**
     * Play a quick, organic wood block "plop" for regular moves
     */
    playMove() {
        this.init();
        if (!this.ctx) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();

        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();

        osc.connect(gainNode);
        gainNode.connect(this.ctx.destination);

        const now = this.ctx.currentTime;

        // Wood knock tone settings
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.12);

        gainNode.gain.setValueAtTime(this.volume * 0.8, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        osc.start(now);
        osc.stop(now + 0.13);
    }

    /**
     * Play a sharp, dry percussion click for capturing pieces
     */
    playCapture() {
        this.init();
        if (!this.ctx) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();

        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();

        osc.connect(gainNode);
        gainNode.connect(this.ctx.destination);

        const now = this.ctx.currentTime;

        // Dry snapping block tone settings
        osc.type = 'square';
        osc.frequency.setValueAtTime(580, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.08);

        gainNode.gain.setValueAtTime(this.volume * 0.7, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        osc.start(now);
        osc.stop(now + 0.09);
    }

    /**
     * Play a dual-tone alert chime for check states
     */
    playCheck() {
        this.init();
        if (!this.ctx) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();

        const now = this.ctx.currentTime;

        // Play 2 quick warning tones
        this.playTone(520, 'sine', 0.05, 0.15);
        
        setTimeout(() => {
            this.playTone(660, 'sine', 0.08, 0.15);
        }, 80);
    }

    /**
     * Play a triumphant ascending major scale chime for checkmate
     */
    playCheckmate() {
        this.init();
        if (!this.ctx) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();

        const now = this.ctx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 (Ascending C major)
        
        notes.forEach((freq, index) => {
            setTimeout(() => {
                this.playTone(freq, 'triangle', 0.25, 0.5, 0.6);
            }, index * 120);
        });
    }

    /**
     * Play a dissonant, low-frequency buzz for draws or stalemate
     */
    playDraw() {
        this.init();
        if (!this.ctx) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();

        const now = this.ctx.currentTime;
        // Two slightly detuned oscillators to make it sound flat and hollow
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();

        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(this.ctx.destination);

        osc1.type = 'sawtooth';
        osc2.type = 'sawtooth';
        osc1.frequency.setValueAtTime(120, now);
        osc2.frequency.setValueAtTime(122, now); // 2Hz beating

        gainNode.gain.setValueAtTime(this.volume * 0.5, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

        osc1.start(now);
        osc2.start(now);
        
        osc1.stop(now + 0.45);
        osc2.stop(now + 0.45);
    }

    /**
     * Helper to play a single tone
     */
    playTone(frequency, type, duration, decay, amp = 0.5) {
        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();

        osc.connect(gainNode);
        gainNode.connect(this.ctx.destination);

        const now = this.ctx.currentTime;

        osc.type = type;
        osc.frequency.setValueAtTime(frequency, now);
        
        gainNode.gain.setValueAtTime(this.volume * amp, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + decay);

        osc.start(now);
        osc.stop(now + duration + decay);
    }
}

// Export global instance
window.chessAudio = new ChessAudio();
