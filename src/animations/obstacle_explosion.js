import * as THREE from 'three';

export function explode(position, scene) {
  const particles = new THREE.Group();

  for (let i = 0; i < 20; i++) {
    const material = new THREE.MeshBasicMaterial({
        color: 0xffaa00,
        transparent: true
    });

    const p = new THREE.Mesh(
      new THREE.SphereGeometry(0.03),
      material
    );

    p.position.copy(position);
    p.userData.velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 0.2,
      (Math.random() - 0.5) * 0.2,
      (Math.random() - 0.5) * 0.2
    );

    particles.add(p);
  }

  scene.add(particles);

  let life = 0;
  function animateExplosion() {
    particles.children.forEach(p => {
      p.position.add(p.userData.velocity);
      p.material.opacity = 1 - life / 30;
      //p.material.transparent = true;
    });

    life++;
    if (life < 30) {
      requestAnimationFrame(animateExplosion);
    } else {
      scene.remove(particles);
    }
  }

  animateExplosion();
}
 