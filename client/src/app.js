import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { AudioProcessor } from './audioProcessor.js';
import { ParticleSystem } from './ParticleSystem.js';
import { ShaderEffect } from './ShaderEffect.js';

class AudioVisualizer {
    constructor() {
        console.log('Initializing AudioVisualizer');
        this.isPlaying = false;
        this.playPauseBtn = null;
        this.fileInput = null;
        this.restartBtn = null;
        this.initThreeJS();
        this.audioProcessor = new AudioProcessor();
        this.particleSystem = new ParticleSystem(this.scene);
        this.shaderEffect = new ShaderEffect(this.renderer, this.scene, this.camera);
        this.setupEventListeners();
        this.animate();
    }

    initThreeJS() {
        try {
            console.log('Initializing Three.js');
            this.scene = new THREE.Scene();
            this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
            this.renderer = new THREE.WebGLRenderer({ antialias: true });
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            document.body.appendChild(this.renderer.domElement);
            this.camera.position.z = 5;
            console.log('Three.js initialized successfully');

            // Initialize post-processing
            this.composer = new EffectComposer(this.renderer);
            const renderPass = new RenderPass(this.scene, this.camera);
            this.composer.addPass(renderPass);
        } catch (error) {
            console.error('Error initializing Three.js:', error);
        }
    }

    setupEventListeners() {
        // Get UI elements
        this.fileInput = document.getElementById('audioFile');
        this.playPauseBtn = document.getElementById('playPause');
        this.restartBtn = document.getElementById('restart');

        if (!this.fileInput || !this.playPauseBtn || !this.restartBtn) {
            console.error('Required UI elements not found!');
            return;
        }

        this.fileInput.addEventListener('change', async (e) => {
            console.log('File selected');
            const file = e.target.files[0];
            if (file) {
                try {
                    await this.processAudio(file);
                    this.startPlayback();
                    console.log('Audio processing complete');
                } catch (error) {
                    console.error('Error processing audio:', error);
                }
            }
        });

        this.playPauseBtn.addEventListener('click', () => {
            if (this.isPlaying) {
                this.pausePlayback();
            } else {
                this.resumePlayback();
            }
        });

        this.restartBtn.addEventListener('click', async () => {
            await this.restartPlayback();
        });

        window.addEventListener('resize', () => {
            const width = window.innerWidth;
            const height = window.innerHeight;
            
            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(width, height);
            this.composer.setSize(width, height);
        });
    }

    async processAudio(file) {
        try {
            console.log('Processing audio file...');
            await this.audioProcessor.processFile(file);
            console.log('Audio file processed successfully');
        } catch (error) {
            console.error('Error in processAudio:', error);
            throw error;
        }
    }

    startPlayback() {
        try {
            this.audioProcessor.startPlayback();
            this.isPlaying = true;
            if (this.playPauseBtn) {
                this.playPauseBtn.textContent = 'Pause';
            }
            console.log('Playback started');
        } catch (error) {
            console.error('Error starting playback:', error);
            this.isPlaying = false;
            if (this.playPauseBtn) {
                this.playPauseBtn.textContent = 'Play';
            }
        }
    }

    pausePlayback() {
        try {
            this.audioProcessor.pausePlayback();
            this.isPlaying = false;
            if (this.playPauseBtn) {
                this.playPauseBtn.textContent = 'Play';
            }
            console.log('Playback paused');
        } catch (error) {
            console.error('Error pausing playback:', error);
        }
    }

    resumePlayback() {
        try {
            this.audioProcessor.resumePlayback();
            this.isPlaying = true;
            if (this.playPauseBtn) {
                this.playPauseBtn.textContent = 'Pause';
            }
            console.log('Playback resumed');
        } catch (error) {
            console.error('Error resuming playback:', error);
            this.isPlaying = false;
            if (this.playPauseBtn) {
                this.playPauseBtn.textContent = 'Play';
            }
        }
    }

    async cleanupAudio() {
        try {
            await this.audioProcessor.cleanup();
            this.isPlaying = false;
        } catch (error) {
            console.error('Error cleaning up audio:', error);
        }
    }

    async restartPlayback() {
        try {
            // Clean up audio
            await this.cleanupAudio();
            
            // Reset UI
            if (this.playPauseBtn) {
                this.playPauseBtn.textContent = 'Play';
            }
            if (this.fileInput) {
                this.fileInput.value = '';
            }
            
            // Reset visualization
            this.particleSystem.reset();
            this.shaderEffect.reset();
            
            console.log('Playback restarted');
        } catch (error) {
            console.error('Error restarting playback:', error);
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        if (this.isPlaying) {
            try {
                const frequencyData = this.audioProcessor.getFrequencyData();
                
                // Log some debug info occasionally
                if (Math.random() < 0.01) { // Log roughly every 100 frames
                    console.log('Frequency data sample:', frequencyData.slice(0, 5));
                }

                this.particleSystem.update(frequencyData);
                this.shaderEffect.update(frequencyData, performance.now() * 0.001);
                
                // Use composer for rendering if available
                if (this.composer) {
                    this.composer.render();
                } else {
                    this.renderer.render(this.scene, this.camera);
                }
            } catch (error) {
                console.error('Error in animation loop:', error);
            }
        } else {
            // Render static scene when not playing
            if (this.composer) {
                this.composer.render();
            } else {
                this.renderer.render(this.scene, this.camera);
            }
        }
    }
}

// Initialize the visualizer when the page loads
window.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded');
    try {
        new AudioVisualizer();
        console.log('AudioVisualizer created successfully');
    } catch (error) {
        console.error('Error creating AudioVisualizer:', error);
    }
});