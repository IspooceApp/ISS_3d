import './style.css'
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { TextureLoader } from 'three';

// import atmospherevertexShader from './shaders/atmosphereFragment.glsl'
// import atmospherefragmentShader from './shaders/atmosphereFragment.glsl'

let time = 0;
const renderer = new THREE.WebGLRenderer();
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, 
  window.innerWidth / window.innerHeight, 
  0.1, 
  100,);
  
const controls = new OrbitControls( camera, renderer.domElement );
camera.position.set( 0, 0, 40 );
camera.lookAt( 0, 0, 0 )


renderer.setSize( window.innerWidth, window.innerHeight );
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
document.body.appendChild( renderer.domElement );
  
  //Earth Shits
  
  // const iss_loader = new THREE.BufferGeometryLoader();
  // iss_loader.load(
  // 	// resource URL
  // 	'Spooce_App/Earth_3d/Models/iss_parts.json',
  
  // 	// onLoad callback
  // 	function ( geometry ) {
    // 		const material = new THREE.MeshLambertMaterial( { color: 0xF5F5F5 } );
    // 		const object = new THREE.Mesh( geometry, material );
    // 		scene.add( object );
    // 	},
    
    // 	// onProgress callback
    // 	function ( xhr ) {
// 		console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );
// 	},

// 	// onError callback
// 	function ( err ) {
  // 		console.log( 'An error happened' );
  // 	}
  // );
  
  

const SpaceMesh = new THREE.Mesh(
  new THREE.SphereGeometry(80,64,64),
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
  sunDirection: {value: new THREE.Vector3(0,0,0.2) },
  dayTexture: { value: textureLoader.load( "textures/Earth.jpg" ) },
  nightTexture: { value: textureLoader.load( "textures/nightlight.jpg" ) }
};

const material = new THREE.ShaderMaterial({
  uniforms: uniforms,
  vertexShader: nightVertexShader,
  fragmentShader: nightFragmentShader,
});


const EarthGeometry = new THREE.SphereGeometry(4,32,32);
const EarthTexture = new THREE.TextureLoader().load('textures/Earth.jpg');
const EarthBumpTexture = new TextureLoader().load('textures/Elevation.jpg')

const EarthMesh = new THREE.Mesh(EarthGeometry,material);

//Atmosphere

const atmosphere = new THREE.Mesh(
  new THREE.SphereGeometry(4.8,32,32),
  new THREE.ShaderMaterial({
    vertexShader:`
    varying vec3 vertexNormal;
    
    void main(){
        vertexNormal = normal;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(
            position, 1.2
        );
    }`,
    fragmentShader:`
    varying vec3 vertexNormal;
    void main(){
        float intensity = pow(0.25 -dot(vertexNormal,vec3(0,0,1.0)), 2.0);
        gl_FragColor = vec4(0.3, 0.3,1.0, 1.0) * intensity;
    }`,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide
  })
)
atmosphere.scale.set(1.001,1.01,1.05)
scene.add(atmosphere)


//Clouds
// const clouds = new THREE.Mesh(
//   new THREE.SphereGeometry(5,32,32),
//   new THREE.TextureLoader().load('textures/clouds.png'));
// clouds.scale.set(1.1,1.1,1.1)


// LOADING ISS MODEL 
const loader = new GLTFLoader();
loader.load(
	'Models/ISS_2016.glb',
	function ( gltf ) {
		scene.add( gltf.scene );
		const iss_animations = gltf.animations; 
		const iss_scene = gltf.scene; 
		const iss_scenes = gltf.scenes; 
		const iss_cameras = gltf.cameras; 
		const iss_assets = gltf.asset; 

    iss_scene.scale.set(0.001,0.001,0.001)
    iss_scene.position.set(10,10,10)

	},
	function ( xhr ) {
		console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
	},
	function ( error ) {
		console.log( 'An error happened' );
	}
);



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


camera.position.z =8 
function animate() {
  time *= 0.01
  resize();
  
  uniforms.sunDirection.value.y = Math.sin(time);
  uniforms.sunDirection.value.x = Math.cos(time);
  // uniforms.sunDirection.value.copy(sunPosition);
  // uniforms.sunDirection.value.normalize();
  EarthMesh.rotation.x -= 0.000
  EarthMesh.rotation.y += 0.0001
  
  renderer.render(scene, camera)
  requestAnimationFrame(animate)
}
animate();
