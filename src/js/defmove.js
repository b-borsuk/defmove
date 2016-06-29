const {
    requestAnimationFrame,
    cancelAnimationFrame,
    setTimeout,
    navigator
} = window;

export default class {

    constructor(...callbacks) {
        const AudioContext = (
            window.AudioContext
            || window.webkitAudioContext
            || window.mozAudioContext
            || window.oAudioContext
            || window.msAudioContext
        );

        this.audioCtx = new AudioContext();
        this.oscillator = this.audioCtx.createOscillator();
        this.analyser = this.audioCtx.createAnalyser();

        this.freq = 20000;
        this.relevantFreqWindow = 33;
        this.nyquist = this.audioCtx.sampleRate / 2;

        this.readMicInterval = 0;

        this.callbacks = callbacks;
    }

    pushToCallbacks(args) {
        if (this.callbacks.length > 0) {
            this.callbacks.forEach((callback) => callback(args));
        }
    }

    getBandwidth (freqs) {
        const primaryTone = this.freqToIndex(this.freq),
              primaryVolume = freqs[primaryTone],
              maxVolumeRatio = 0.001;

        let leftBandwidth = 0,
            rightBandwidth = 0,
            volume,
            normalizedVolume;

        do {
            leftBandwidth++;
            volume = freqs[primaryTone-leftBandwidth];
            normalizedVolume = volume / primaryVolume;
        } while (normalizedVolume > maxVolumeRatio && leftBandwidth < this.relevantFreqWindow);

        do {
            rightBandwidth++;
            volume = freqs[primaryTone+rightBandwidth];
            normalizedVolume = volume / primaryVolume;
        } while (normalizedVolume > maxVolumeRatio && rightBandwidth < this.relevantFreqWindow);

        return {
            left: leftBandwidth,
            right: rightBandwidth
        };
    }

    freqToIndex (freq) {
        return Math.round(
            freq / this.nyquist * this.analyser.fftSize / 2
        );
    }

    indexToFreq (index) {
        return this.nyquist / (this.analyser.fftSize / 2) * index;
    }

    optimizeFrequency (oscillator, freqSweepStart, freqSweepEnd) {
        let oldFreq = oscillator.frequency.value,
            audioData = new Uint8Array(this.analyser.frequencyBinCount),
            maxAmp = 0,
            maxAmpIndex = 0,
            from = this.freqToIndex(freqSweepStart),
            to   = this.freqToIndex(freqSweepEnd);

        for (var i = from; i < to; i++) {
            oscillator.frequency.value = this.indexToFreq(i);
            this.analyser.getByteFrequencyData(audioData);

            if (audioData[i] > maxAmp) {
                maxAmp = audioData[i];
                maxAmpIndex = i;
            }
        }
        // Sometimes the above procedure seems to fail, not sure why.
        // If that happends, just use the old value.
        if (maxAmpIndex == 0) {
            return oldFreq;
        }
        else {
            return this.indexToFreq(maxAmpIndex);
        }
    }

    readMic (userCallback) {
        let audioData = new Uint8Array(this.analyser.frequencyBinCount);

        this.analyser.getByteFrequencyData(audioData);

        let primaryTone = this.freqToIndex(this.freq);

        let analyser = this.analyser;

        this.pushToCallbacks({
            type: 'TYPE_1',
            payload: {
                primaryTone: primaryTone,
                index: this.freqToIndex(22000),
                to: primaryTone + this.relevantFreqWindow,
                from: primaryTone - this.relevantFreqWindow,
                analyser,
                audioData
            }
        });

        var band = this.getBandwidth(audioData);
        userCallback(band);

        this.pushToCallbacks({
            type: 'TYPE_2',
            payload: {
                band,
            }
        });

        this.readMicInterval = requestAnimationFrame(this.readMic.bind(this, userCallback));

        return this.readMicInterval;
    }

    handleMic (stream, callback, userCallback) {

        let mic = this.audioCtx.createMediaStreamSource(stream);
        this.stream = stream;
        this.mic = mic;

        this.analyser.smoothingTimeConstant = 0.5;
        this.analyser.fftSize = 2048;

        mic.connect(this.analyser);

        // Doppler tone
        this.oscillator.frequency.value = this.freq;
        this.oscillator.type = this.oscillator.SINE;
        this.oscillator.start(0);
        this.oscillator.connect(this.audioCtx.destination);

        // There seems to be some initial "warm-up" period
        // where all frequencies are significantly louder.
        // A quick timeout will hopefully decrease that bias effect.
        setTimeout(() => {
            // Optimize doppler tone
            let freq = this.optimizeFrequency(this.oscillator, 19000, 22000);

            this.oscillator.frequency.value = freq;
            this.freq = freq;

            callback(userCallback);
        });
    }

    init(callback) {

        let options = {
            audio: {
                optional: [
                    {
                        echoCancellation: false
                    }
                ]
            }
        };

        try {
            navigator.mediaDevices.getUserMedia(options)
                .then((stream) => this.handleMic(stream, this.readMic.bind(this), callback))
                .catch(() => console.log('Error!'));
        } catch (e) {
            alert('Нажаль Ваш браузер не підтримує роботу з динаміком та мікрофонами.');
            this.stop();
            throw e;
        }
    }

    setFrequency(frequency) {
        if (frequency >= 18000 && frequency <= 20000) {
            this.freq = frequency;
            this.oscillator.frequency.value = frequency;
        }
    }

    getFrequency() {
        return this.freq;
    }

    stop() {
        this.stream.getAudioTracks()[0].stop();
        this.stream.removeTrack(this.stream.getAudioTracks()[0]);
        this.mic.disconnect();
        this.oscillator.disconnect();
        cancelAnimationFrame(this.readMicInterval);
    }
}

