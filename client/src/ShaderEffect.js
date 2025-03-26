import * as THREE from 'three';

export class ShaderEffect {
    constructor(renderer, scene, camera) {
        this.renderer = renderer;
        this.scene = scene;
        this.camera = camera;
        this.uniforms = {
            time: { value: 0 },
            frequencyData: { value: new Float32Array(2048) }
        };
        this.init();
    }

    init() {
        // Create a basic shader material
        const vertexShader = `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;

        const fragmentShader = `
            uniform float time;
            uniform float frequencyData[2048];
            varying vec2 vUv;
            
            void main() {
                float frequency = frequencyData[int(vUv.x * 2048.0)];
                vec3 color = vec3(frequency / 255.0, 0.5, 0.5);
                gl_FragColor = vec4(color, 1.0);
            }
        `;

        // Create a plane with the shader material
        const geometry = new THREE.PlaneGeometry(10, 10);
        const material = new THREE.ShaderMaterial({
            uniforms: this.uniforms,
            vertexShader: vertexShader,
            fragmentShader: fragmentShader
        });

        this.plane = new THREE.Mesh(geometry, material);
        this.plane.position.z = -5;
        this.scene.add(this.plane);
    }

    update(frequencyData, time) {
        if (this.uniforms) {
            this.uniforms.time.value = time;
            this.uniforms.frequencyData.value = new Float32Array(frequencyData);
        }
    }

    reset() {
        if (this.plane) {
            this.scene.remove(this.plane);
        }
        this.init();
    }
}