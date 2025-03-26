export class AudioProcessor {
    constructor() {
        try {
            this.audioContext = null;
            this.analyser = null;
            this.source = null;
            this.audioBuffer = null;
            this.bufferLength = 2048;
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
            
            // Clean up existing audio context if any
            if (this.audioContext) {
                await this.cleanup();
            }

            // Create new audio context
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 2048;
            this.bufferLength = this.analyser.frequencyBinCount;
            this.dataArray = new Uint8Array(this.bufferLength);

            const arrayBuffer = await file.arrayBuffer();
            console.log('File converted to array buffer');
            
            this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            console.log('Audio decoded successfully');
            
            return this.audioBuffer;
        } catch (error) {
            console.error('Error processing audio file:', error);
            throw error;
        }
    }

    startPlayback() {
        if (!this.audioContext || !this.audioBuffer) {
            console.warn('Cannot start playback: audio context or buffer not initialized');
            return;
        }

        try {
            // Create and connect audio source
            this.source = this.audioContext.createBufferSource();
            this.source.buffer = this.audioBuffer;
            
            // Connect the audio nodes
            this.source.connect(this.analyser);
            this.analyser.connect(this.audioContext.destination);
            
            // Start playback
            this.source.start(0);
            this.audioContext.resume();
            
            // Add onended handler to reset state
            this.source.onended = () => {
                console.log('Audio playback ended');
                this.cleanup();
            };
            
            console.log('Playback started');
        } catch (error) {
            console.error('Error starting playback:', error);
            throw error;
        }
    }

    pausePlayback() {
        if (!this.audioContext) {
            console.warn('Cannot pause: audio context not initialized');
            return;
        }
        
        try {
            this.audioContext.suspend();
            console.log('Playback paused');
        } catch (error) {
            console.error('Error pausing playback:', error);
            throw error;
        }
    }

    resumePlayback() {
        if (!this.audioContext) {
            console.warn('Cannot resume: audio context not initialized');
            return;
        }
        
        try {
            this.audioContext.resume();
            console.log('Playback resumed');
        } catch (error) {
            console.error('Error resuming playback:', error);
            throw error;
        }
    }

    async cleanup() {
        try {
            if (this.source) {
                this.source.stop();
                this.source.disconnect();
            }
            if (this.audioContext) {
                await this.audioContext.close();
            }
            this.source = null;
            this.audioContext = null;
            this.analyser = null;
            this.audioBuffer = null;
            console.log('Audio resources cleaned up');
        } catch (error) {
            console.error('Error cleaning up audio resources:', error);
            throw error;
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
        if (!this.analyser) return 0;
        
        const start = Math.floor(startFreq * this.bufferLength / (this.audioContext.sampleRate / 2));
        const end = Math.floor(endFreq * this.bufferLength / (this.audioContext.sampleRate / 2));
        
        let sum = 0;
        for (let i = start; i < end; i++) {
            sum += this.dataArray[i];
        }
        return sum / (end - start);
    }
}
