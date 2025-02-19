import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

export class ShaderEffect {
    constructor(renderer, scene, camera) {
        this.renderer = renderer;
        this.scene = scene;
        this.camera = camera;
        
        // Initialize effect composer
        this.composer = new EffectComposer(renderer);
        this.composer.addPass(new RenderPass(scene, camera));
        
        // Custom audio reactive shader
        this.audioShader = {
            uniforms: {
                tDiffuse: { value: null },
                time: { value: 0 },
                audioData: { value: new Float32Array(128).fill(0) },
                bassIntensity: { value: 0 },
                trebleIntensity: { value: 0 }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D tDiffuse;
                uniform float time;
                uniform float audioData[128];
                uniform float bassIntensity;
                uniform float trebleIntensity;
                varying vec2 vUv;

                void main() {
                    vec2 uv = vUv;
                    float distortion = bassIntensity * 0.1;
                    uv.x += sin(uv.y * 10.0 + time) * distortion;
                    uv.y += cos(uv.x * 10.0 + time) * distortion;
                    vec4 color = texture2D(tDiffuse, uv);
                    vec3 glow = vec3(trebleIntensity * 0.5, 0.0, bassIntensity * 0.5);
                    color.rgb += glow * audioData[int(uv.x * 128.0)];
                    gl_FragColor = color;
                }
            `
        };

        // Create and add shader pass
        this.audioPass = new ShaderPass(this.audioShader);
        this.composer.addPass(this.audioPass);
    }

    update(frequencyData, time) {
        this.audioPass.uniforms.time.value = time;
        this.audioPass.uniforms.audioData.value = this.normalizeArray(frequencyData);
        this.audioPass.uniforms.bassIntensity.value = this.getAverageRange(frequencyData, 0, 10) / 255.0;
        this.audioPass.uniforms.trebleIntensity.value = this.getAverageRange(frequencyData, 100, 128) / 255.0;
        this.composer.render();
    }

    getAverageRange(array, start, end) {
        let sum = 0;
        for (let i = start; i < end; i++) {
            sum += array[i];
        }
        return sum / (end - start);
    }

    normalizeArray(array) {
        return Array.from(array).map(val => val / 255.0);
    }

    setSize(width, height) {
        this.composer.setSize(width, height);
    }
} 