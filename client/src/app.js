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
            this.composer = new THREE.EffectComposer(this.renderer);
            const renderPass = new RenderPass(this.scene, this.camera);
            this.composer.addPass(renderPass);
        } catch (error) {
            console.error('Error initializing Three.js:', error);
        }
    }

    setupEventListeners() {
        const fileInput = document.getElementById('audioFile');
        if (!fileInput) {
            console.error('Audio file input not found!');
            return;
        }

        fileInput.addEventListener('change', async (e) => {
            console.log('File selected');
            const file = e.target.files[0];
            if (file) {
                try {
                    await this.processAudio(file);
                    this.isPlaying = true;
                    console.log('Audio processing complete');
                } catch (error) {
                    console.error('Error processing audio:', error);
                }
            }
        });

        // Add visible feedback for file selection
        fileInput.addEventListener('click', () => {
            console.log('File input clicked');
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
                this.renderer.render(this.scene, this.camera);
            } catch (error) {
                console.error('Error in animation loop:', error);
            }
        } else {
            // Render static scene when not playing
            this.renderer.render(this.scene, this.camera);
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