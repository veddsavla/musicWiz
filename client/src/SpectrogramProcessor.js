export class SpectrogramProcessor {
    constructor(fftSize = 2048) {
        this.fftSize = fftSize;
        this.spectrogramData = [];
        this.maxHistoryLength = 60; // Keep 60 frames of history
    }

    processFrequencyData(frequencyData) {
        // Add new frequency data to history
        this.spectrogramData.push(Array.from(frequencyData));
        
        // Keep only recent history
        if (this.spectrogramData.length > this.maxHistoryLength) {
            this.spectrogramData.shift();
        }

        return {
            current: frequencyData,
            history: this.spectrogramData,
            // Calculate additional features
            features: this.extractFeatures(frequencyData)
        };
    }

    extractFeatures(frequencyData) {
        const bass = this.getAverageRange(frequencyData, 0, 10);
        const mid = this.getAverageRange(frequencyData, 10, 100);
        const treble = this.getAverageRange(frequencyData, 100, 200);

        return {
            bass,
            mid,
            treble,
            spectralCentroid: this.calculateSpectralCentroid(frequencyData),
            energy: this.calculateEnergy(frequencyData)
        };
    }

    getAverageRange(array, start, end) {
        let sum = 0;
        for (let i = start; i < end; i++) {
            sum += array[i];
        }
        return sum / (end - start);
    }

    calculateSpectralCentroid(frequencyData) {
        let numerator = 0;
        let denominator = 0;
        
        frequencyData.forEach((amplitude, index) => {
            numerator += amplitude * index;
            denominator += amplitude;
        });

        return denominator === 0 ? 0 : numerator / denominator;
    }

    calculateEnergy(frequencyData) {
        return frequencyData.reduce((sum, value) => sum + (value * value), 0) / frequencyData.length;
    }
} 