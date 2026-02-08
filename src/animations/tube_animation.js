import * as THREE from 'three';
import { ImprovedNoise } from "https://cdn.skypack.dev/three@0.133.1/examples/jsm/math/ImprovedNoise.js";

export function tubesAnimation(tubeRadius, levelSpeed) {
    const ringRadius = 1.5;
    const tubeLength = 200;
    const numRings = 100;
    const ringSpacing = tubeLength / numRings;
    
    const noise = new ImprovedNoise();
    const color = new THREE.Color();
    const hueNoiseFreq = 0.005;
    const noisefreq = 0.1;
    const noiseAmp = 0.5;

    function createRing(zPosition, index) {
        const ringGeo = new THREE.TorusGeometry(tubeRadius, 0.05, 16, 64);
        const ringVerts = ringGeo.attributes.position;
        const colors = [];
        let p = new THREE.Vector3();
        let v3 = new THREE.Vector3();

        for (let i = 0; i < ringVerts.count; i++) {
            p.fromBufferAttribute(ringVerts, i);
            v3.copy(p);
            
            let vertexNoise = noise.noise(
                v3.x * noisefreq,
                v3.y * noisefreq,
                (zPosition + index) * 0.1
            );
            v3.addScaledVector(p.normalize(), vertexNoise * noiseAmp);
            ringVerts.setXYZ(i, v3.x, v3.y, v3.z);

            let colorNoise = noise.noise(
                v3.x * hueNoiseFreq, 
                v3.y * hueNoiseFreq, 
                zPosition * hueNoiseFreq
            );
            color.setHSL(0.5 - colorNoise, 1, 0.5);
            colors.push(color.r, color.g, color.b);
        }

        ringGeo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
        const mat = new THREE.PointsMaterial({ 
          size: 0.03, 
          vertexColors: true,
          transparent: true,
          opacity: 0.9,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        });
        
        const ring = new THREE.Mesh(ringGeo, mat);
        ring.position.z = zPosition;
        
        return ring;
    }

    function getTube(index) {
        const startPosZ = -tubeLength * index;
        const endPosZ = tubeLength;
        const resetPosZ = -tubeLength;
        
        const tubeGroup = new THREE.Group();
        const rings = [];

        for (let i = 0; i < numRings; i++) {
            const zPos = startPosZ + (i * ringSpacing);
            const ring = createRing(zPos, i);
            rings.push(ring);
            tubeGroup.add(ring);
        }

        tubeGroup.position.z = 0;

        function update() {
            tubeGroup.rotation.z += 0.005;
            
            rings.forEach(ring => {
                ring.position.z += levelSpeed;
                
                // Reset Ring position wenn er zu weit ist
                if (ring.position.z > endPosZ) {
                    ring.position.z -= tubeLength * 2;
                }
            });
        }

        return { points: tubeGroup, update };
    }

    const tubeA = getTube(0);
    const tubeB = getTube(1);
    const tubes = [tubeA, tubeB];

    return tubes;
}