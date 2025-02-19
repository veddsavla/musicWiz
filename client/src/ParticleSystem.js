import * as THREE from "three";

export class ParticleSystem {
  constructor(scene, count = 3000) {
    this.scene = scene;
    this.count = count;
    this.particles = [];
    this.group = new THREE.Group();

    const textureLoader = new THREE.TextureLoader();
    const circleTexture = textureLoader.load(
      "https://threejs.org/examples/textures/sprites/circle.png"
    ); // Circular sprite

    this.materials = [
      new THREE.PointsMaterial({
        size: 0.05,
        color: 0xff0000,
        map: circleTexture,
        transparent: true,
        alphaTest: 0.5, // Ensures the black background is removed
        depthTest: false, // Ensures particles blend correctly
        blending: THREE.AdditiveBlending,
      }),
      new THREE.PointsMaterial({
        size: 0.05,
        color: 0x00ff00,
        map: circleTexture,
        transparent: true,
        alphaTest: 0.5,
        depthTest: false,
        blending: THREE.AdditiveBlending,
      }),
      new THREE.PointsMaterial({
        size: 0.05,
        color: 0x0000ff,
        map: circleTexture,
        transparent: true,
        alphaTest: 0.5,
        depthTest: false,
        blending: THREE.AdditiveBlending,
      }),
    ];

    //old square code
    // this.materials = [
    //     new THREE.PointsMaterial({
    //         size: 0.05,
    //         color: 0xff0000,
    //         transparent: true,
    //         blending: THREE.AdditiveBlending
    //     }),
    //     new THREE.PointsMaterial({
    //         size: 0.05,
    //         color: 0x00ff00,
    //         transparent: true,
    //         blending: THREE.AdditiveBlending
    //     }),
    //     new THREE.PointsMaterial({
    //         size: 0.05,
    //         color: 0x0000ff,
    //         transparent: true,
    //         blending: THREE.AdditiveBlending
    //     })
    // ];
    

    this.createParticleSystems();
    scene.add(this.group);
  }

  createParticleSystems() {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.count * 1.75);
    const velocities = new Float32Array(this.count * 1.75);

    for (let i = 0; i < this.count * 3; i += 3) {
      // Create particles in a sphere
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const radius = Math.random() * 4;

      positions[i] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i + 2] = radius * Math.cos(phi);

      // Random initial velocities
      velocities[i] = (Math.random() - 0.5) * 0.01;
      velocities[i + 1] = (Math.random() - 0.5) * 0.01;
      velocities[i + 2] = (Math.random() - 0.5) * 0.01;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("velocity", new THREE.BufferAttribute(velocities, 3));

    // Create three particle systems with different materials
    this.materials.forEach((material, index) => {
      const system = new THREE.Points(geometry.clone(), material);
      system.rotation.x = Math.random() * Math.PI;
      system.rotation.y = Math.random() * Math.PI;
      this.particles.push({
        system,
        velocities: velocities.slice(),
      });
      this.group.add(system);
    });
  }

  update(frequencyData) {
    const bass = this.getAverageFrequency(frequencyData, 0, 10);
    const mid = this.getAverageFrequency(frequencyData, 10, 100);
    const treble = this.getAverageFrequency(frequencyData, 100, 200);

    this.particles.forEach((particle, index) => {
      const positions = particle.system.geometry.attributes.position.array;
      const velocities = particle.velocities;

      for (let i = 0; i < positions.length; i += 3) {
        // Update positions based on velocities and frequency data
        positions[i] += velocities[i] * (bass * 2);
        positions[i + 1] += velocities[i + 1] * (mid * 2);
        positions[i + 2] += velocities[i + 2] * (treble * 2);

        // Add some rotation
        const radius = Math.sqrt(
          positions[i] ** 2 + positions[i + 1] ** 2 + positions[i + 2] ** 2
        );
        if (radius > 3.8 && Math.random() > 0.95) {
          // Reset particles that go too far (90% of the time)
          positions[i] *= 0.1;
          positions[i + 1] *= 0.1;
          positions[i + 2] *= 0.1;
        }
      }

      // Update material properties based on frequency
      particle.system.material.size =
        0.05 + (index === 0 ? bass : index === 1 ? mid : treble) * 0.01;
      particle.system.material.opacity =
        0.3 + (index === 0 ? bass : index === 1 ? mid : treble) * 0.5;

      particle.system.geometry.attributes.position.needsUpdate = true;
      particle.system.rotation.y += 0.001;
    });
  }

  getAverageFrequency(frequencyData, start, end) {
    let sum = 0;
    for (let i = start; i < end; i++) {
      sum += frequencyData[i];
    }
    return sum / (end - start) / 255;
  }
}
