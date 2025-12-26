import { OrbitControls } from 'three/examples/jsm/Addons.js';
import { loadSpaceship } from './components/low_poly_space_ship';
import { explode } from './animations/obstacle_explosion';
import './style.css'
import * as THREE from 'three';
import * as CANNON from 'cannon-es'
import CannonDebugger from 'cannon-es-debugger';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/**
 * Variables
 */
let spacecraftRoot;
const shipBox = new THREE.Box3();
const currentObstacleBox = new THREE.Box3();
let skybox;
const loader = new GLTFLoader();

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
 */
const gridHelper = new THREE.GridHelper(30,30);
scene.add(gridHelper);

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
window.addEventListener("keydown", (e) =>{
  if (!spacecraftRoot) return;

  if(e.key === "d" || e.key === "D" || e.key === "ArrowRight") {
    spacecraftRoot.position.x += 0.1;
  }
  if(e.key === "w" || e.key === "W" || e.key === "ArrowUp") {
    spacecraftRoot.position.y += 0.1;
  }
  if(e.key === "a" || e.key === "A" || e.key === "ArrowLeft") {
    spacecraftRoot.position.x -= 0.1;
  }
  if(e.key === "s" || e.key === "S" || e.key === "ArrowDown") {
    spacecraftRoot.position.y -= 0.1;
  }
  if(e.key === "r" || e.key === "R") {
    spacecraftRoot.position.set(0, 0, 0);
  }
});