export class AudioProcessor {
    constructor() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 2048;
            this.bufferLength = this.analyser.frequencyBinCount;
            this.dataArray = new Uint8Array(this.bufferLength);
            this.spectrogramData = [];
            this.maxSpectrogramHistory = 60; // Keep 60 frames of history
            console.log('AudioProcessor initialized successfully');
        } catch (error) {
            console.error('Failed to initialize AudioProcessor:', error);
        }
    }

    async processFile(file) {
        try {
            console.log('Processing audio file:', file.name);
            const arrayBuffer = await file.arrayBuffer();
            console.log('File converted to array buffer');
            
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            console.log('Audio decoded successfully');
            
            if (this.source) {
                this.source.stop();
                this.source.disconnect();
            }
            
            this.source = this.audioContext.createBufferSource();
            this.source.buffer = audioBuffer;
            this.source.connect(this.analyser);
            this.analyser.connect(this.audioContext.destination);
            console.log('Audio source connected');
            
            // Start playback immediately
            this.source.start(0);
            console.log('Playback started');
            
            return audioBuffer;
        } catch (error) {
            console.error('Error processing audio file:', error);
            throw error;
        }
    }

    startPlayback() {
        if (this.source) {
            this.source.start(0);
        }
    }

    stopPlayback() {
        if (this.source) {
            this.source.stop();
        }
    }

    getFrequencyData() {
        if (!this.analyser) {
            console.warn('Analyser not initialized');
            return new Uint8Array(this.bufferLength);
        }
        this.analyser.getByteFrequencyData(this.dataArray);
        this.updateSpectrogram(this.dataArray);
        return this.dataArray;
    }

    updateSpectrogram(frequencyData) {
        this.spectrogramData.push(Array.from(frequencyData));
        if (this.spectrogramData.length > this.maxSpectrogramHistory) {
            this.spectrogramData.shift();
        }
    }

    getSpectrogramData() {
        return this.spectrogramData;
    }

    async extractFeatures(audioBuffer) {
        // Calculate basic audio features
        const features = {
            duration: audioBuffer.duration,
            sampleRate: audioBuffer.sampleRate,
            numberOfChannels: audioBuffer.numberOfChannels,
            
            // Real-time features
            bass: this.getAverageFrequencyRange(0, 200),
            mid: this.getAverageFrequencyRange(200, 2000),
            treble: this.getAverageFrequencyRange(2000, this.analyser.frequencyBinCount)
        };

        return features;
    }

    getAverageFrequencyRange(startFreq, endFreq) {
        const start = Math.floor(startFreq * this.bufferLength / (this.audioContext.sampleRate / 2));
        const end = Math.floor(endFreq * this.bufferLength / (this.audioContext.sampleRate / 2));
        
        let sum = 0;
        for (let i = start; i < end; i++) {
            sum += this.dataArray[i];
        }
        return sum / (end - start);
    }
}
