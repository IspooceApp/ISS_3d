import './css/style.css'
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import { TextureLoader, Vector4 } from 'three';
import gsap from 'gsap';
import {FirstPersonControls } from 'three/examples/jsm/controls/FirstPersonControls.js'

//shaders
import atmospherevertexShader from './shaders/atmosphereFragment.glsl'
import atmospherefragmentShader from './shaders/atmosphereFragment.glsl'
import nightFragmentShader from './shaders/nightFragShader.glsl'
import nightVertexShader   from './shaders/nightVertexShader.glsl'
import issVertexShader from './shaders/issVertexShader.glsl'
import issFragmentShader from './shaders/issFragShader.glsl'

let time = 0;

const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer();

//camera-------------------------------------------------------------------------------------->
const camera = new THREE.PerspectiveCamera( 75, 
  window.innerWidth / window.innerHeight, 
  0.1, 
  1000,);
const controls = new OrbitControls( camera, renderer.domElement );
camera.position.set( 0, 0, 40 );
camera.lookAt( 0, 0, 0 )

//renderer ------------------------------------------------------------------------------------>
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
  

  
//SpaceMesh ------------------------------------------------------------------------------------>
const SpaceMesh = new THREE.Mesh(
  new THREE.SphereGeometry(80,64,64),
  new THREE.MeshBasicMaterial({
    roughness: 1,
    metalness: 0,
    map: new THREE.TextureLoader().load('textures/milkyway.jpg')
  }))
SpaceMesh.material.side = THREE.BackSide;
SpaceMesh.name = 'spacemesh';


//Earth------------------------------------------------------------------------------>
const textureLoader = new THREE.TextureLoader();
const uniforms = {
  sunDirection: {value: new THREE.Vector3(0,0,0.2) },
  dayTexture: { value: textureLoader.load( "textures/Earth.jpg" ) },
  nightTexture: { value: textureLoader.load( "textures/nightlight.jpg" ) },
};
const material = new THREE.ShaderMaterial({
  uniforms: uniforms,
  vertexShader: nightVertexShader,
  fragmentShader: nightFragmentShader,
});


const EarthGeometry = new THREE.SphereGeometry(4,32,32);
const EarthTexture = new THREE.TextureLoader().load('textures/Earth.jpg');
const EarthBumpTexture = new TextureLoader().load('textures/Elevation.jpg');

const EarthMesh = new THREE.Mesh(EarthGeometry,material);
EarthMesh.name = 'Earth';



//Atmosphere----------------------------------------------------------------------------------->

const atmosphere = new THREE.Mesh(
  new THREE.SphereGeometry(4.8,32,32),
  new THREE.ShaderMaterial({
    vertexShader: atmospherevertexShader,
    fragmentShader: atmospherefragmentShader,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide
  })
)
atmosphere.name = 'atmoshpere';
atmosphere.scale.set(1.001,1.01,1.05)
scene.add(atmosphere)

//Clouds------------------------------------------------------------------------------>
// const clouds = new THREE.Mesh(
//   new THREE.SphereGeometry(5,32,32),
//   new THREE.TextureLoader().load('textures/clouds.png'));
// clouds.scale.set(1.1,1.1,1.1)

//particle emitter ---------------------------------------------------------------------->
const issParent = new THREE.Object3D();
const trans = new THREE.MeshBasicMaterial({color: 1, transparent:true, opacity:0});
const geometry = new THREE.BoxGeometry( 2/10, 1/10 , 3/10 );
const cube = new THREE.Mesh( geometry, trans );
cube.position.set(10,2,3);
cube.rotation.set(0,0,90);
cube.name = 'ISS';
issParent.add( cube );

// LOADING ISS MODEL--------------------------------------------------------------------> 
var is_iss_selected = false;


var highlightColor = new THREE.Vector3(0.0,0.0,0.0);

const iss_material = new THREE.ShaderMaterial({
  vertexShader:issVertexShader,
  fragmentShader: issFragmentShader,
  uniforms: {
    hover:{value: highlightColor}
  }
});



const loader = new GLTFLoader();
loader.load(
	'Models/ISS_2016_3.glb',
	
  function ( gltf ) {
		
    const iss = gltf.scene;

    console.log(gltf);
    gltf.scene.children[0].material = iss_material;
    // gltf.scene.children[0].name = "hello";

    issParent.add(iss);
    EarthMesh.add(issParent);

		const iss_animations = gltf.animations; 
		const iss_cameras = gltf.cameras;
    iss.scale.set(1/10,1/10,1/10);
    iss.rotation.set(0,0,90);
    iss.position.set(10,2,3);

    window.addEventListener('keydown', function onDocumentKeyDown(event) {
      var keycode = event.which;
      if(keycode == 87)// w 
      {
        console.log(iss_cameras)
        var aabb = new THREE.Box3().setFromObject(iss);
        var center = aabb.getCenter( new THREE.Vector3() );
        var size = aabb.getSize( new THREE.Vector3() );
        if (is_iss_selected === false) {
          gsap.to( camera.position, {
            duration: 1,
            x: center.x,
            y: center.y,
            z: center.z + size.z + size.z, // maybe adding even more offset depending on your model
            onUpdate: function() {
              camera.lookAt( center );
            }
            } );
            is_iss_selected = true;
        }
        else {
          camera.lookAt(0, 0, 0)
          is_iss_selected = false;
        }
      }      
    })
    

	},
	function ( xhr ) {
		console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
    
	},
	function ( error ) {
		console.log( 'An error happened' );
	}
);



//HELPER FUNCTIONS

//function to get XYZ coordinates (on Sphere) using latitude and longitude 

function calcPosFromLatLonRad(lat,lon,radius){
  x = -(radius * Math.sin((90-lat)*(Math.PI/180))*Math.cos((lon+180)*(Math.PI/180)));
  z = (radius * Math.sin((90-lat)*(Math.PI/180))*Math.sin((lon+180)*(Math.PI/180)));
  y = (radius * Math.cos((90-lat)*(Math.PI/180)));
  return [x,y,z];
}




// Camera and selection functions





//Lightings------------------------------------------------------------------------------->
const AmbientLight = new THREE.AmbientLight(0xffffff, 0.4);
// const spotLight = new THREE.AmbientLight( 0xffffff );
// spotLight.position.copy( camera.position);
// scene.add( spotLight );
scene.add(EarthMesh);
scene.add(SpaceMesh)
scene.add(AmbientLight);
// scene.add(directionalLight);
// scene.add(clouds)


//Mouse Events------------------------------------------------------------------------------>

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function onMouseMove(event) {

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

}
window.addEventListener('mousemove', onMouseMove);

function hoverPieces() {
  raycaster.setFromCamera(mouse,camera);
  var obj = [];
  obj.push(cube);
  var found = raycaster.intersectObjects(obj);

  if(found.length > 0 && found[0].object.name ==='ISS')
  {
    console.log('found object: '+ found[0].object.name);
    highlightColor.x = 0.8;
    highlightColor.y = -0.2;
    highlightColor.z = -0.2;
    setTimeout(function()
    {
      highlightColor.x = 0.0;
      highlightColor.y = 0.0;
      highlightColor.z = 0.0;
    },1000);
  }
}

//animate --------------------------------->

camera.position.z =8 

let delta =0;
let clock = new THREE.Clock();
function animate() {

  time *=0.01; 
  // time  =  clock.getElapsedTime();
  // delta = clock.getDelta();
  // time *= Math.floor(Date.now() / 1000)
  resize();

  uniforms.sunDirection.value.y = Math.sin(time);
  uniforms.sunDirection.value.x = Math.cos(time);
  // uniforms.sunDirection.value.copy(sunPosition);
  // uniforms.sunDirection.value.normalize();
  // EarthMesh.rotation.x -= 0.000
  // EarthMesh.rotation.y += delta * 45 * Math.PI / 180;
  
  
  EarthMesh.rotation.x -= 0.000
  EarthMesh.rotation.y += 0.001

  // issParent.rotation.x -= 0.000
  // issParent.rotation.y += 0.01

  hoverPieces();
  renderer.render(scene, camera)
  requestAnimationFrame(animate)
}


animate();
