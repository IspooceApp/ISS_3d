import "./style.css";
import * as satellite from "satellite.js"
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { CubeTexture, TextureLoader } from "three";
import gsap from "gsap";
import { FirstPersonControls } from "three/examples/jsm/controls/FirstPersonControls.js";
// import atmospherevertexShader from './shaders/atmosphereFragment.glsl'
// import atmospherefragmentShader from './shaders/atmosphereFragment.glsl'
const tleendpoint = "http://127.0.0.1:8000/tle";
let time = 0;
const renderer = new THREE.WebGLRenderer();
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
	75,
	window.innerWidth / window.innerHeight,
	0.1,
	100
);

const controls = new OrbitControls(camera, renderer.domElement);
camera.position.set(0, 0, 40);
camera.lookAt(0, 0, 0);

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

const SpaceMesh = new THREE.Mesh(
	new THREE.SphereGeometry(80, 64, 64),
	new THREE.MeshBasicMaterial({
		roughness: 1,
		metalness: 0,
		map: new THREE.TextureLoader().load("textures/milkyway.jpg"),
	})
);

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
	nightTexture: { value: textureLoader.load("textures/nightlight.jpg") },
};

const material = new THREE.ShaderMaterial({
	uniforms: uniforms,
	vertexShader: nightVertexShader,
	fragmentShader: nightFragmentShader,
});

// Earth
const EarthGeometry = new THREE.SphereGeometry(4, 32, 32);
const EarthTexture = new THREE.TextureLoader().load("textures/Earth.jpg");
const EarthBumpTexture = new TextureLoader().load("textures/Elevation.jpg");

const EarthMesh = new THREE.Mesh(EarthGeometry, material);
// const Zaxis = new THREE.Vector3(0,0,1);
// EarthMesh.rotateOnWorldAxis(Zaxis, 0.4084)

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
		side: THREE.BackSide,
	})
);
atmosphere.scale.set(1.001, 1.01, 1.05);
scene.add(atmosphere);

//Clouds
// const clouds = new THREE.Mesh(
//   new THREE.SphereGeometry(5,32,32),
//   new THREE.TextureLoader().load('textures/clouds.png'));
// clouds.scale.set(1.1,1.1,1.1)

var iss_model;
// LOADING ISS MODEL
var is_iss_selected = false;
const loader = new GLTFLoader();
loader.load(
	"Models/ISS_2016.glb",

	function (gltf) {
    iss_model = gltf.scene;
		scene.add(gltf.scene);

		const iss_animations = gltf.animations;
		// const iss_scene = gltf.scene;
		const iss_cameras = gltf.cameras;

		iss_model.scale.set(0.0001, 0.0001, 0.0001);
		iss_model.position.set(10, 2, 3);

		window.addEventListener("dblclick", function () {
			// console.log(iss_cameras);
			var aabb = new THREE.Box3().setFromObject(gltf.scene);
			var center = aabb.getCenter(new THREE.Vector3());
			var size = aabb.getSize(new THREE.Vector3());
			if (is_iss_selected === false) {
				gsap.to(camera.position, {
					duration: 1,
					x: center.x,
					y: center.y,
					z: center.z + size.z + size.z, // maybe adding even more offset depending on your model
					onUpdate: function () {
						camera.lookAt(center);
					},
				});
				is_iss_selected = true;
			} else {
				camera.lookAt(0, 0, 0);
				is_iss_selected = false;
			}
		});
	},
	function (xhr) {
		console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
	},
	function (error) {
		console.log("An error happened", error);
	}
);

//HELPER FUNCTIONS

//function to get XYZ coordinates (on Sphere) using latitude and longitude

// function calcPosFromLatLonRad(lat, lon, radius) {
// 	x = -(
// 		radius *
// 		Math.sin((90 - lat) * (Math.PI / 180)) *
// 		Math.cos((lon + 180) * (Math.PI / 180))
// 	);
// 	z =
// 		radius *
// 		Math.sin((90 - lat) * (Math.PI / 180)) *
// 		Math.sin((lon + 180) * (Math.PI / 180));
// 	y = radius * Math.cos((90 - lat) * (Math.PI / 180));
// 	return [x, y, z];
// }

// Camera and selection functions

//Lightings
const AmbientLight = new THREE.AmbientLight(0xffffff, 0.4);
// const spotLight = new THREE.AmbientLight( 0xffffff );
// spotLight.position.copy( camera.position);
// scene.add( spotLight );
scene.add(EarthMesh);
scene.add(SpaceMesh);
scene.add(AmbientLight);
// scene.add(directionalLight);
// scene.add(clouds)
async function getTLE() {
	const res = await fetch(tleendpoint);
  const tle = await res.json();
  return tle
}

let tle = await getTLE();
let goddecide = 4/6371;
let delta = 0;
let Clock = new THREE.Clock();
camera.position.z = 8;
function calcPosFromLatLonRad(lat,lon,radius){
  
    var phi   = (90-lat)*(Math.PI/180);
    var theta = (lon+180)*(Math.PI/180);

    const x = -(radius * Math.sin(phi)*Math.cos(theta));
    const z = (radius * Math.sin(phi)*Math.sin(theta));
    const y = (radius * Math.cos(phi));
  
    return [x,y,z];

}
function animate() {
	time = new THREE.Clock().getElapsedTime();
	delta = new THREE.Clock().getDelta();
	time *= Math.floor(Date.now() / 1000);
	resize();
	uniforms.sunDirection.value.y = Math.sin(time);
	uniforms.sunDirection.value.x = Math.cos(time);
	// uniforms.sunDirection.value.copy(sunPosition);
	// uniforms.sunDirection.value.normalize();
	EarthMesh.rotation.x -= 0.0;
	EarthMesh.rotation.y += (delta * 45 * Math.PI) / 180;
  if (iss_model && tle) {

    var satrec = satellite.twoline2satrec(tle[0], tle[1]);
    var gmst = satellite.gstime(new Date());
    var positionAndVelocity = satellite.propagate(satrec, new Date());
    var positionEci = positionAndVelocity.position;
    var positionGd    = satellite.eciToGeodetic(positionEci, gmst)
    var longitude =satellite.degreesLong(positionGd.longitude),
    latitude  = satellite.degreesLat(positionGd.latitude),
    height    = positionGd.height;
	const pos = calcPosFromLatLonRad(latitude, longitude, 4.2)
    iss_model.position.x =pos[0];
    iss_model.position.y =pos[1];
    iss_model.position.z =pos[2];

    console.log(positionEci, latitude, longitude, height, pos);
  }
	renderer.render(scene, camera);
	requestAnimationFrame(animate);
}

function onMouseMove(event) {
	Mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
	Mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function onClick(event) {}

animate();

