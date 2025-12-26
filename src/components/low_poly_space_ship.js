import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const loader = new GLTFLoader();

export function loadSpaceship({ position=[0,0,0], scale=1 } = {}) {
    return new Promise((resolve) =>{
        loader.load('/models/low_poly_space_ship.glb', (gltf) => {
            const model = gltf.scene;
            model.position.set(...position);
            model.rotation.y = Math.PI;
            model.scale.setScalar(scale);
            resolve(model);
        });
    });
}