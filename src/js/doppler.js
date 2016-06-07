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
        this.freq = 20000;
        this.relevantFreqWindow = 33;
        this.nyquist = this.audioCtx.sampleRate / 2;

        this.readMicInterval = 0;

        this.callbacks = callbacks;
    }

    pushToCallbacks(...args) {
        callbacks.each((callback) => callback(args));
    }

    getBandwidth (analyser, freqs) {
        const primaryTone = this.freqToIndex(analyser, this.freq),
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
    
    freqToIndex (analyser, freq) {
        return Math.round(
            freq / this.nyquist * analyser.fftSize / 2
        );
    }
    
    indexToFreq (analyser, index) {
        return this.nyquist / (analyser.fftSize / 2) * index;
    }
    
    optimizeFrequency (oscillator, analyser, freqSweepStart, freqSweepEnd) {
        let oldFreq = oscillator.frequency.value,
            audioData = new Uint8Array(analyser.frequencyBinCount),
            maxAmp = 0,
            maxAmpIndex = 0,
            from = this.freqToIndex(analyser, freqSweepStart),
            to   = this.freqToIndex(analyser, freqSweepEnd);
    
        for (var i = from; i < to; i++) {
            oscillator.frequency.value = this.indexToFreq(analyser, i);
            analyser.getByteFrequencyData(audioData);
    
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
            return this.indexToFreq(analyser, maxAmpIndex);
        }
    }
    
    readMic (analyser, userCallback) {
        let audioData = new Uint8Array(analyser.frequencyBinCount);

        analyser.getByteFrequencyData(audioData);

        let primaryTone = this.freqToIndex(analyser, this.freq);

        this.pushToCallbacks({
            type: 'TYPE_1',
            payload: {
                primaryTone: primaryTone,
                index: this.freqToIndex(analyser, 22000),
                analyser,
                audioData
            }
        });

        this.pushToCallbacks({
            type: 'TYPE_2',
            payload: {
                primaryTone: primaryTone,
                to: primaryTone - this.relevantFreqWindow,
                from: primaryTone + this.relevantFreqWindow,
                analyser,
                audioData
            }
        });
        
        let band = this.getBandwidth(analyser, audioData);
        userCallback(band);

        this.pushToCallbacks({
            type: 'TYPE_3',
            payload: {
                bandDiff: band[0] - band[1]
            }
        });
    
        this.readMicInterval = requestAnimationFrame(this.readMic.bind(this, analyser, userCallback));
    
        return this.readMicInterval;
    }
    
    handleMic (stream, callback, userCallback) {
    
        let mic = this.audioCtx.createMediaStreamSource(stream),
            analyser = this.audioCtx.createAnalyser();
    
        analyser.smoothingTimeConstant = 0.5;
        analyser.fftSize = 2048;
    
        mic.connect(analyser);
    
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
            let freq = this.optimizeFrequency(this.oscillator, analyser, 19000, 22000);
    
            this.oscillator.frequency.value = freq;
    
            callback(analyser, userCallback);
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
    
        navigator.mediaDevices
            .getUserMedia(options)
            .then((stream) => this.handleMic(stream, this.readMic.bind(this), callback))
            .catch(() => console.log('Error!'));
    }
    
    stop() {
        cancelAnimationFrame(this.readMicInterval);
    }
}

