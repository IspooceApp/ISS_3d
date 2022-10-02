import './style.css'
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { TextureLoader } from 'three';
import gsap from 'gsap';
import fs from 'node:fs'

import { FirstPersonControls } from 'three/examples/jsm/controls/FirstPersonControls.js'
// import atmospherevertexShader from './shaders/atmosphereFragment.glsl'
// import atmospherefragmentShader from './shaders/atmosphereFragment.glsl'

// ----------------------------------------------------------------------------------------------------------------------

let time = 0;
const renderer = new THREE.WebGLRenderer();
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75,
    window.innerWidth / window.innerHeight,
    0.1,
    100, );

const controls = new OrbitControls(camera, renderer.domElement);
camera.position.set(0, 0, 40);
camera.lookAt(0, 0, 0)


renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(devicePixelRatio);
requestAnimationFrame(animate);

function resize(force) {
    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (force || canvas.width !== width || canvas.height !== height) {
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
    }
}
resize(true);
document.body.appendChild(renderer.domElement);

window.addEventListener( 'resize', onWindowResize, false );

function onWindowResize(){

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}




const SpaceMesh = new THREE.Mesh(
    new THREE.SphereGeometry(80, 64, 64),
    new THREE.MeshBasicMaterial({
        roughness: 1,
        metalness: 0,
        map: new THREE.TextureLoader().load('textures/milkyway.jpg')
    }))

SpaceMesh.material.side = THREE.BackSide;

//DAY AND NIGHT SHADER

const nightFragmentShader = `
uniform sampler2D dayTexture;
uniform sampler2D nightTexture;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vSunDir;

void main(void) {
    vec3 dayColor = texture2D(dayTexture, vUv).rgb;
    vec3 nightColor = texture2D(nightTexture, vUv).rgb;

    float cosineAngleSunToNormal = dot(normalize(vNormal), normalize(vSunDir));

    cosineAngleSunToNormal = clamp(cosineAngleSunToNormal * 20.0, -1.0, 1.0);

    float mixAmount = cosineAngleSunToNormal * 0.6+ 0.5;

    vec3 color = mix(nightColor, dayColor, mixAmount);

    gl_FragColor = vec4(color, 1.0);
}

`;

const nightVertexShader = `
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vSunDir;

uniform vec3 sunDirection;

void main() {
    vUv = uv;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

    vNormal = normalMatrix * normal;
    vSunDir = mat3(viewMatrix) * sunDirection;

    gl_Position = projectionMatrix * mvPosition;
}
`;

const textureLoader = new THREE.TextureLoader();

const uniforms = {
    sunDirection: { value: new THREE.Vector3(0, 0, 0.2) },
    dayTexture: { value: textureLoader.load("textures/Earth.jpg") },
    nightTexture: { value: textureLoader.load("textures/nightlight.jpg") }
};

const material = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: nightVertexShader,
    fragmentShader: nightFragmentShader,
});

// Earth
const EarthGeometry = new THREE.SphereGeometry(4, 32, 32);
const EarthTexture = new THREE.TextureLoader().load('textures/Earth.jpg');
const EarthBumpTexture = new TextureLoader().load('textures/Elevation.jpg')

const EarthMesh = new THREE.Mesh(EarthGeometry, material);

//Atmosphere

const atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(4.8, 32, 32),
    new THREE.ShaderMaterial({
        vertexShader: `
    varying vec3 vertexNormal;
    
    void main(){
        vertexNormal = normal;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(
            position, 1.2
        );
    }`,
        fragmentShader: `
    varying vec3 vertexNormal;
    void main(){
        float intensity = pow(0.25 -dot(vertexNormal,vec3(0,0,1.0)), 2.0);
        gl_FragColor = vec4(0.3, 0.3,1.0, 1.0) * intensity;
    }`,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide
    })
)
atmosphere.scale.set(1.001, 1.01, 1.05)
scene.add(atmosphere)


//Clouds
// const clouds = new THREE.Mesh(
//   new THREE.SphereGeometry(5,32,32),
//   new THREE.TextureLoader().load('textures/clouds.png'));
// clouds.scale.set(1.1,1.1,1.1)


// LOADING ISS MODEL 
var is_iss_selected = false;
const loader = new GLTFLoader();
loader.load(
    'Models/ISS_2016.glb',

    function(gltf) {
        scene.add(gltf.scene);

        const iss_animations = gltf.animations;
        const iss_scene = gltf.scene;
        const iss_cameras = gltf.cameras;


        iss_scene.scale.set(0.001, 0.001, 0.001)
        iss_scene.position.set(10, 2, 3)

        window.addEventListener('dblclick', function() {
            console.log(iss_cameras)
            var aabb = new THREE.Box3().setFromObject(gltf.scene);
            var center = aabb.getCenter(new THREE.Vector3());
            var size = aabb.getSize(new THREE.Vector3());
            if (is_iss_selected === false) {
                gsap.to(camera.position, {
                    duration: 1,
                    x: center.x,
                    y: center.y,
                    z: center.z + size.z + size.z, // maybe adding even more offset depending on your model
                    onUpdate: function() {
                        camera.lookAt(center);
                    }
                });
                is_iss_selected = true;
            } else {
                camera.lookAt(0, 0, 0)
                is_iss_selected = false;
            }

        })


    },
    function(xhr) {
        console.log((xhr.loaded / xhr.total * 100) + '% loaded');

    },
    function(error) {
        console.log('An error happened');
    }
);

//HELPER FUNCTIONS

//function to get XYZ coordinates (on Sphere) using latitude and longitude 

function calcPosFromLatLonRad(lat, lon, radius) {
    x = -(radius * Math.sin((90 - lat) * (Math.PI / 180)) * Math.cos((lon + 180) * (Math.PI / 180)));
    z = (radius * Math.sin((90 - lat) * (Math.PI / 180)) * Math.sin((lon + 180) * (Math.PI / 180)));
    y = (radius * Math.cos((90 - lat) * (Math.PI / 180)));
    return [x, y, z];
}




// Camera and selection functions





//Lightings
const AmbientLight = new THREE.AmbientLight(0xffffff, 0.4);
// const spotLight = new THREE.AmbientLight( 0xffffff );
// spotLight.position.copy( camera.position);
// scene.add( spotLight );
scene.add(EarthMesh);
scene.add(SpaceMesh)
scene.add(AmbientLight);
// scene.add(directionalLight);
// scene.add(clouds)




camera.position.z = 8

function animate() {
    var time = (new THREE.Clock()).getElapsedTime();
    var delta = (new THREE.Clock()).getDelta();
    time *= Math.floor(Date.now() / 1000)
    resize();

    uniforms.sunDirection.value.y = Math.sin(time);
    uniforms.sunDirection.value.x = Math.cos(time);
    // uniforms.sunDirection.value.copy(sunPosition);
    // uniforms.sunDirection.value.normalize();
    EarthMesh.rotation.x -= 0.000
    EarthMesh.rotation.y += delta * 45 * Math.PI / 180;

    renderer.render(scene, camera)
    requestAnimationFrame(animate)
}

function onMouseMove(event) {
    Mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    Mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

}


function onClick(event) {

}


animate();