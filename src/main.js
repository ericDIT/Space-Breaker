import { OrbitControls } from 'three/examples/jsm/Addons.js';
import { loadSpaceship } from './components/low_poly_space_ship';
import { explode } from './animations/obstacle_explosion';
import { tubesAnimation } from './animations/tube_animation';
import './style.css'
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/**
 * Main.js class for Spacebreaker.
 * Sources and more information in README.md
 * 
 * Author @Eric M. (580802)
 */

/**
 * Variables
 */
const levelSpeed = 0.1; //Here is the general speed of the level which in a way ist also the difficulty
const tubeRadius = 10;
let spacecraftRoot;
const shipBox = new THREE.Box3();
const currentObstacleBox = new THREE.Box3();
const obstacles = [];
const currentRewardBox = new THREE.Box3(); //TODO: box mit stern verbinden und laser collision einbinden
const stars = [];
let skybox;
const loader = new GLTFLoader();
let lastShotTime = 0;
const fireRate = 200;
const pointsUI = document.querySelector("#pointsUI");
let points = 0;
let highscore = localStorage.getItem("highscore") || 0;
if(highscoreUI) {
  highscoreUI.innerText = highscore;
}
console.log(pointsUI);

const randomRangeNum = (max,min) =>{
  return Math.floor(Math.random() * (max - min + 1) + min);
}

const scene = new THREE.Scene();

const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 10, 5);
scene.add(directionalLight);

const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.position.x = 4.5;
camera.position.y = 1.5;
camera.far = 5000;
camera.updateProjectionMatrix();

const renderer = new THREE.WebGLRenderer();
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setAnimationLoop( animate );
document.body.appendChild( renderer.domElement );

/**
 * Orbitcontrols
 */
const controls = new OrbitControls(camera, renderer.domElement);

/**
 * Skybox
 */
loader.load('models/space_nebula_hdri_panorama_360_skydome.glb', (gltf) => {
    skybox = gltf.scene;
    skybox.scale.set(100, 100, 100);
    scene.add(skybox);
});

/**
 * Spacecraft (player)
 */
loadSpaceship({ position: [0,0,0], scale: 0.3}).then((spaceship) =>{
  spacecraftRoot = new THREE.Group();
  spacecraftRoot.add(spaceship)
  spacecraftRoot.castShadow = true;
  spacecraftRoot.receiveShadow = true;
  spacecraftRoot.position.set(0, 0, 0);
  scene.add(spacecraftRoot);
});

/**
 * Spacecraft engine trail animation
 */
const textureLoader = new THREE.TextureLoader();
const engineParticleCount = 100;
const particleGeometry = new THREE.BufferGeometry();
const particlePositions = new Float32Array(engineParticleCount * 3);
const particleColors = new Float32Array(engineParticleCount * 3);

const particleMaterial = new THREE.PointsMaterial({
  size: 0.3,
  map: textureLoader.load('https://threejs.org/examples/textures/sprites/disc.png'),
  transparent: true,
  opacity: 0.2,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
  vertexColors: true
});

const particlePoints = new THREE.Points(particleGeometry, particleMaterial);
scene.add(particlePoints);

particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
particleGeometry.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

let currentParticleIdx = 0;

function updateTrail() {
  if (!spacecraftRoot) return;

  let idxL = currentParticleIdx * 3;
  particlePositions[idxL] = spacecraftRoot.position.x + 0.17;
  particlePositions[idxL + 1] = spacecraftRoot.position.y + 0.2;
  particlePositions[idxL + 2] = spacecraftRoot.position.z + 0.5;
  particleColors[idxL] = 0; particleColors[idxL + 1] = 1; particleColors[idxL + 2] = 1;

  currentParticleIdx = (currentParticleIdx + 1) % engineParticleCount;
  
  let idxR = currentParticleIdx * 3;
  particlePositions[idxR] = spacecraftRoot.position.x - 0.15;
  particlePositions[idxR + 1] = spacecraftRoot.position.y + 0.2;
  particlePositions[idxR + 2] = spacecraftRoot.position.z + 0.5;
  particleColors[idxR] = 0; particleColors[idxR + 1] = 1; particleColors[idxR + 2] = 1;

  currentParticleIdx = (currentParticleIdx + 1) % engineParticleCount;

  for (let i = 0; i < engineParticleCount; i++) {
    const i3 = i * 3;

    particlePositions[i3 + 2] += 0.05;

    particleColors[i3] *= 0.85;
    particleColors[i3 + 1] *= 0.85;
    particleColors[i3 + 2] *= 0.85;
    
    particlePositions[i3] += (Math.random() - 0.5) * 0.01;
    particlePositions[i3 + 1] += (Math.random() - 0.5) * 0.01;
  }

  particleGeometry.attributes.position.needsUpdate = true;
  particleGeometry.attributes.color.needsUpdate = true;
}

/**
 * Projectiles
 */
const projectiles = [];
const projectileSpeed = 0.5;
const laserbox = new THREE.Box3();

const fireLaser = () => {
  const currentTime = Date.now();
  if(!spacecraftRoot || currentTime - lastShotTime < fireRate) return;

  lastShotTime = currentTime;

  const geometry = new THREE.CapsuleGeometry(0.02,0.2,4,8);
  const material = new THREE.MeshBasicMaterial({ color: 0xff0000});
  const laser = new THREE.Mesh(geometry,material);
  const light = new THREE.PointLight(0xff0000, 5, 5);
  light.decay = 1.5;
  light.castShadow = false;
  laser.add(light);

  laser.position.copy(spacecraftRoot.position);
  laser.rotation.x = Math.PI / 2;

  scene.add(laser);
  projectiles.push(laser);
}

const collisionTargets = [
  {
    name: 'star',
    array: stars,
    boundingBox: currentRewardBox,
    distanceThreshold: 2,
    onHit: (target, targetIndex, laser, laserIndex) => {
      explode(target.position.clone(), scene);
      scene.remove(target);
      stars.splice(targetIndex, 1);
      scene.remove(laser);
      projectiles.splice(laserIndex, 1);
      
      points += 10;
      console.log("Shot a Star! +10 points");
      if (pointsUI) pointsUI.innerText = points;
      checkHighscore();
      
      return true;
    }
  },
  {
    name: 'obstacle',
    array: obstacles,
    boundingBox: currentObstacleBox,
    distanceThreshold: 2,
    onHit: (target, targetIndex, laser, laserIndex) => {
      explode(target.position.clone(), scene);
      
      target.position.z = randomRangeNum(-20, -40);
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * (tubeRadius - 1);
      target.position.x = Math.cos(angle) * radius;
      target.position.y = Math.sin(angle) * radius;
      
      scene.remove(laser);
      projectiles.splice(laserIndex, 1);
      
      points += 1;
      console.log("Shot asteroid! +1 point");
      if (pointsUI) pointsUI.innerText = points;
      checkHighscore();
      
      return true;
    }
  }
];

const moveLaser = () => {
  for(let i = projectiles.length - 1; i >= 0; i--) {
    const laser = projectiles[i];
    
    if(!laser) continue;
    
    laser.position.z -= projectileSpeed;

    if(laser.position.z < -50) {
      scene.remove(laser);
      projectiles.splice(i, 1);
      continue;
    }

    laserbox.setFromObject(laser);
    laserbox.expandByScalar(0.2);

    let laserDestroyed = false;

    for(const targetType of collisionTargets) {
      if(laserDestroyed) break;
      
      for(let j = targetType.array.length - 1; j >= 0; j--) {
        const target = targetType.array[j];
        
        if(!target?.position) continue;

        const dist = laser.position.distanceTo(target.position);
        if(dist > targetType.distanceThreshold) continue;

        targetType.boundingBox.setFromObject(target);
        if(laserbox.intersectsBox(targetType.boundingBox)) {
          laserDestroyed = targetType.onHit(target, j, laser, i);
          break;
        }
      }
    }
  }
}

/**
 * Rewards
 */
function createStarGeometry() {
  const pts = [];
  const pikes = 5;
  const outerRadius = 0.3;
  const innerRadius = 0.1;

  for (let i = 0; i<pikes*2; i++) {
    const currRadius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = (i / (pikes*2)) * Math.PI * 2;
    pts.push(new THREE.Vector2(
      Math.cos(angle) * currRadius,
      Math.sin(angle) * currRadius
    ));
  }
  const starShape = new THREE.Shape(pts);
  const putIn3d = {
    depth: 0.2,
    bevelEnabled: true,
    bevelThickness: 0.1,
    bevelSize: 0.1
  };
  return new THREE.ExtrudeGeometry(starShape, putIn3d);
}

const starGeometry = createStarGeometry();
const starMaterial = new THREE.MeshBasicMaterial({ color: 0xDFFF00 });

let lastStarSpawnTime = 0;
const starSpawnInterval = 10000;
function spawnStar() {
  const currentTime = Date.now();
  const timePassed = currentTime - lastStarSpawnTime;
  if(timePassed<starSpawnInterval) return;
  lastStarSpawnTime = currentTime;
  const starMesh = new THREE.Mesh(starGeometry,starMaterial);

  const angle = Math.random() * Math.PI * 2;
  const radius = Math.random() * (tubeRadius - 1);

  starMesh.position.set(
    Math.cos(angle) * radius,
    Math.sin(angle) * radius,
    randomRangeNum(-70, -80)
  );

  starMesh.userData.speed = levelSpeed+0.08;
  stars.push(starMesh);
  scene.add(starMesh);
  console.log(stars.length);
}

const moveStar = (arr) => {
  arr.forEach((o) => {
    o.position.z += o.userData.speed;

    o.rotation.x += 0.01;
    o.rotation.y += 0.01;

    if (o.position.z > camera.position.z) {
      scene.remove(o);
      arr.splice(o);
    }
  });
};

/**
 * Obstacles
 */
const asteroidTemplates = [];
loader.load('models/asteroids_pack_rocky_version.glb', (gltf) => {

  gltf.scene.traverse((child) => {
    if (child.isMesh) {
      asteroidTemplates.push(child);
    }
  });

  for (let i = 0; i < 20; i++) {

    const template = asteroidTemplates[Math.floor(Math.random() * asteroidTemplates.length)];
    const asteroid = template.clone(true);

    asteroid.material = template.material.clone();
    asteroid.scale.set(0.1, 0.1, 0.1);

    asteroid.position.set(
      randomRangeNum(8, -8),
      randomRangeNum(8, -8),
      randomRangeNum(-10, -30)
    );

    asteroid.userData.speed = levelSpeed;
    asteroid.name = `obstacle_${i}`;
    obstacles.push(asteroid);
    scene.add(asteroid);
  }
});
const moveObstacles = (arr) => {
  arr.forEach((o) => {
    o.position.z += o.userData.speed;

    if (o.position.z > camera.position.z) {
      o.position.z = randomRangeNum(-20, -30);
      o.position.x = randomRangeNum(8, -8);
    }
  });
};

function updateCamera() {
  if (!spacecraftRoot) return;
  
  const offset = new THREE.Vector3(0, 2, 5);
  camera.position.copy(spacecraftRoot.position).add(offset);
  camera.lookAt(spacecraftRoot.position);
}

function checkCollisions() {
  if (!spacecraftRoot) return;
  shipBox.setFromObject(spacecraftRoot);

  for (let i = obstacles.length - 1; i >= 0; i--) {
    const obstacle = obstacles[i];
    currentObstacleBox.setFromObject(obstacle);
    if (shipBox.intersectsBox(currentObstacleBox)) {
      console.log("Kollision mit:", obstacle.name);
      explode(obstacle.position, scene);
      obstacle.position.z = randomRangeNum(-20, -40);
      obstacle.position.x = randomRangeNum(8, -8);
      points = 0;
      if (pointsUI) pointsUI.innerText = points;
    }
  } 
}

/**
 * Tube animation
 */
const tubes = tubesAnimation(tubeRadius, levelSpeed);
const tubeA = tubes[0];
const tubeB = tubes[1];
scene.add(tubeA.points, tubeB.points);


function animate() {

  moveObstacles(obstacles);
  controls.update();
  moveLaser();
  handleMovement(0.1);

  tubes.forEach((tb) => tb.update())

  updateTrail();
  updateCamera();

  if (skybox) {
    skybox.rotation.x += 0.0002;
    skybox.rotation.y += 0.0002;
  }

  checkCollisions();

  spawnStar();
  moveStar(stars);

  renderer.render( scene, camera );
}

/**
 * Checking highscore
 */
function checkHighscore() {
  if (!highscoreUI) return;
  let currentHighstore = parseInt(localStorage.getItem("highscore")) || 0;
  if(points > currentHighstore) {
    localStorage.setItem("highscore", points);
    highscoreUI.innerText = points;
    console.log("New highscore!: " + points);
  }
}

/**
 * Windows Event-Listener
 */
window.addEventListener("resize", ()=>{
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth,window.innerHeight);
})

/**
 * Controlls Spacecraft
 */
const keys = {};

window.addEventListener('keydown', (e) => {
  keys[e.key] = true;
  keys[e.code] = true;
});

window.addEventListener('keyup', (e) => {
  keys[e.key] = false;
  keys[e.code] = false;
});

function handleMovement(speed) {
  if(!spacecraftRoot) return;
  const maxRadius = tubeRadius;
  if (keys["ArrowUp"] || keys["w"] || keys["W"]) {
    spacecraftRoot.position.y += speed;
  }
  if (keys["ArrowDown"] || keys["s"] || keys["S"]) {
    spacecraftRoot.position.y -= speed;
  }
  if (keys["ArrowRight"] || keys["d"] || keys["D"]) {
    spacecraftRoot.position.x += speed;
  }
  if (keys["ArrowLeft"] || keys["a"] || keys["A"]) {
    spacecraftRoot.position.x -= speed;
  }
  if (keys["Space"] || keys[" "]) {
    fireLaser();
  }
  if (keys["r"] || keys["R"]) {
    spacecraftRoot.position.set(0, 0, 0);
  }

  const distanceFromCenter = Math.sqrt(
    spacecraftRoot.position.x ** 2 + 
    spacecraftRoot.position.y ** 2
  );

  if (distanceFromCenter > maxRadius) {
    const angle = Math.atan2(spacecraftRoot.position.y, spacecraftRoot.position.x);
    spacecraftRoot.position.x = Math.cos(angle) * maxRadius;
    spacecraftRoot.position.y = Math.sin(angle) * maxRadius;
  }
}