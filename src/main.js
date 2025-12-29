import { OrbitControls } from 'three/examples/jsm/Addons.js';
import { loadSpaceship } from './components/low_poly_space_ship';
import { explode } from './animations/obstacle_explosion';
import './style.css'
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/**
 * Variables
 */
let spacecraftRoot;
const shipBox = new THREE.Box3();
const currentObstacleBox = new THREE.Box3();
let skybox;
const loader = new GLTFLoader();
let lastShotTime = 0;
const fireRate = 200;

const pointsUI = document.querySelector("#points");
let points = 0;
console.log(pointsUI);
const randomRangeNum = (max,min) =>{
  return Math.floor(Math.random() * (max - min + 1) + min);
}
const moveObstacles = (arr) => {
  arr.forEach((o) => {
    o.position.z += o.userData.speed;

    if (o.position.z > camera.position.z) {
      o.position.z = randomRangeNum(-20, -30);
      o.position.x = randomRangeNum(8, -8);
    }
  });
};

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
 * Ground area
 */
const ground = new THREE.Mesh(
  new THREE.BoxGeometry(30, 1, 30),
  new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true })
);
ground.position.y = -1;
scene.add(ground);

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

  laser.position.copy(spacecraftRoot.position);
  laser.rotation.x = Math.PI / 2;

  scene.add(laser);
  projectiles.push(laser);
}

const moveLaser = () => {
  for(let i = projectiles.length -1; i>=0; i--){
    const laser = projectiles[i];
    laser.position.z -= projectileSpeed;

    if(laser.position.z < -50) {
      scene.remove(laser);
      projectiles.splice(i, 1);
      continue;
    }

    laserbox.setFromObject(laser);

    for(let j = obstacles.length -1; j>=0; j--) {
      const asteroid = obstacles[j];
      currentObstacleBox.setFromObject(asteroid);
      if(laserbox.intersectsBox(currentObstacleBox)) {
        explode(asteroid.position.clone(), scene);

        scene.remove(asteroid);
        obstacles.splice(j, 1);

        scene.remove(laser);
        projectiles.splice(i,1);

        points += 10;
        if (pointsUI) pointsUI.innerText = points;
        break;
      }
    }
  }
}

/**
 * Obstacles
 */
const obstacles = [];
const asteroidTemplates = [];
loader.load('models/asteroids_pack_rocky_version.glb', (gltf) => {

  gltf.scene.traverse((child) => {
    if (child.isMesh) {
      asteroidTemplates.push(child);
    }
  });

  for (let i = 0; i < 20; i++) {

    const template =
    asteroidTemplates[Math.floor(Math.random() * asteroidTemplates.length)];
    const asteroid = template.clone(true);

    asteroid.material = template.material.clone();
    asteroid.scale.set(0.1, 0.1, 0.1);

    asteroid.position.set(
      randomRangeNum(8, -8),
      0,
      randomRangeNum(-10, -30)
    );

    asteroid.userData.speed = Math.random() * 0.04 + 0.04;
    asteroid.name = `obstacle_${i}`;
    obstacles.push(asteroid);
    scene.add(asteroid);
  }
});



/**
 * Grid helper
const gridHelper = new THREE.GridHelper(30,30);
scene.add(gridHelper);
*/

camera.position.z = 5;

function checkCollisions() {
  if (!spacecraftRoot) return;
  shipBox.setFromObject(spacecraftRoot);

  for (let i = obstacles.length - 1; i >= 0; i--) {
    const obstacle = obstacles[i];
    currentObstacleBox.setFromObject(obstacle);
    if (shipBox.intersectsBox(currentObstacleBox)) {
      console.log("Kollision mit:", obstacle.name);
      explode(obstacle.position, scene);
      scene.remove(obstacle);
      obstacles.splice(i, 1);
      points -= 1; 
    }
  } 
}

function animate() {

  moveObstacles(obstacles);
  controls.update();
  moveLaser();
  handleMovement(0.1);

  if (skybox) {
    skybox.rotation.y += 0.0002;
  }

  checkCollisions();

  renderer.render( scene, camera );
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
}