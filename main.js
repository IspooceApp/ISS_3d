import "./style.css";
import * as satellite from "satellite.js";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { CubeTexture, TextureLoader, Vector4 } from "three";
import gsap from "gsap";
// import { FirstPersonControls } from "three/examples/jsm/controls/FirstPersonControls.js";
import atmospherevertexShader from "./shaders/atmosphereVertex.glsl";
import atmospherefragmentShader from "./shaders/atmosphereFragment.glsl";
import nightFragmentShader from "./shaders/nightFragShader.glsl";
import nightVertexShader from "./shaders/nightVertexShader.glsl";
import issVertexShader from "./shaders/issVertexShader.glsl";
import issFragmentShader from "./shaders/issFragShader.glsl";
const tleendpoint = "http://127.0.0.1:8000/tle";
let time = 0;
const scene = new THREE.Scene();

const renderer = new THREE.WebGLRenderer();

//camera-------------------------------------------------------------------------------------->
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
const controls = new OrbitControls(camera, renderer.domElement);
camera.position.set(0, 0, 40);
camera.lookAt(0, 0, 0);

//renderer ------------------------------------------------------------------------------------>
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(devicePixelRatio);
requestAnimationFrame(animate);

const canvas = renderer.domElement;

renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
camera.aspect = canvas.clientWidth / canvas.clientHeight;
camera.updateProjectionMatrix();
document.body.appendChild(renderer.domElement);

//SpaceMesh ------------------------------------------------------------------------------------>

const SpaceMesh = new THREE.Mesh(
  new THREE.SphereGeometry(80, 64, 64),
  new THREE.MeshBasicMaterial({
    roughness: 1,
    metalness: 0,
    map: new THREE.TextureLoader().load("textures/milkyway.jpg"),
  })
);

SpaceMesh.material.side = THREE.BackSide;
SpaceMesh.name = "spacemesh";

//Earth------------------------------------------------------------------------------>
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

const EarthGeometry = new THREE.SphereGeometry(4, 32, 32);
// const EarthTexture = new THREE.TextureLoader().load('textures/Earth.jpg');
// const EarthBumpTexture = new TextureLoader().load('textures/Elevation.jpg');

const EarthMesh = new THREE.Mesh(EarthGeometry, material);
EarthMesh.name = "Earth";
console.log("earth mess created");

//Atmosphere----------------------------------------------------------------------------------->

const atmosphere = new THREE.Mesh(
  new THREE.SphereGeometry(4.8, 32, 32),
  new THREE.ShaderMaterial({
    vertexShader: atmospherevertexShader,
    fragmentShader: atmospherefragmentShader,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
  })
);
atmosphere.name = "atmoshpere";
atmosphere.scale.set(1.001, 1.01, 1.05);
scene.add(atmosphere);
console.log("atmosphere added");
//particle emitter ---------------------------------------------------------------------->
var issParent = new THREE.Object3D();
const trans = new THREE.MeshBasicMaterial({
  color: 1,
  transparent: true,
  opacity: 0,
});
const geometry = new THREE.BoxGeometry(2 / 5, 1 / 5, 3 / 5);
const cube = new THREE.Mesh(geometry, trans);
cube.position.set(10, 2, 3);
// cube.rotation.set(0,0,3.14/2);
cube.name = "ISS";
issParent.add(cube);

//Clouds
const cloudMesh = new THREE.Mesh(
  new THREE.SphereGeometry(4.1, 32, 32),
  new THREE.MeshBasicMaterial({
    map: new THREE.TextureLoader().load("textures/clouds.png"),
    transparent: true,
    opacity: 0.4,
  })
);
scene.add(cloudMesh);
console.log("cloud added");
// LOADING ISS MODEL-------------------------------------------------------------------->

var is_iss_selected = false;
var highlightColor = new THREE.Vector3(0, 0, 0);

const iss_material = new THREE.ShaderMaterial({
  vertexShader: issVertexShader,
  fragmentShader: issFragmentShader,
  uniforms: {
    hover: { value: highlightColor },
  },
});

var iss_model;
const loader = new GLTFLoader();
loader.load(
  "./Models/ISS_2016_3 (3).glb",
  function (gltf) {
    iss_model = gltf.scene;
    scene.add(iss_model);
    iss_model.scale.set(1 / 5, 1 / 5, 1 / 5);
    gltf.scene.children[0].material = iss_material;
    issParent.add(iss_model);
    EarthMesh.add(issParent);
    window.addEventListener("dblclick", function () {
      var aabb = new THREE.Box3().setFromObject(gltf.scene);
      var center = aabb.getCenter(new THREE.Vector3());
      var size = aabb.getSize(new THREE.Vector3());

      if (is_iss_selected === false) {
        gsap.to(camera.position, {
          duration: 1,
          x: center.x,
          y: center.y,
          z: center.z + size.z + size.z, // maybe adding even more offset depending on your model
        });
        is_iss_selected = true;
      } else {
        camera.lookAt(0, 0, 0),
          gsap.to(camera.position, {
            duration: 1,
            x: 0,
            y: 0,
            z: 10, // maybe adding even more offset depending on your model
          });
        is_iss_selected = false;
      }
    });
  },
  function (xhr) {
    const element = document.querySelector(".iss-helper");
    if (Number((xhr.loaded / xhr.total) * 100) >= 99) {
      element.innerHTML = "ISS loaded. Double click anywhere to zoom ISS.";
    } else {
      element.innerHTML =
        "ISS model is loading " +
        ((xhr.loaded / xhr.total) * 100).toFixed(1) +
        "% loaded";
    }
  },
  function (error) {
    console.log("An error happened", error);
  }
);

//Lightings------------------------------------------------------------------------------->

const AmbientLight = new THREE.AmbientLight(0xffffff, 0.4);
// const spotLight = new THREE.AmbientLight( 0xffffff );
// spotLight.position.copy( camera.position);
// scene.add( spotLight );
scene.add(EarthMesh);
scene.add(SpaceMesh);
scene.add(AmbientLight);
// scene.add(directionalLight);
// scene.add(clouds)

camera.position.z = 8;

//Mouse Events------------------------------------------------------------------------------>

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function hoverPieces() {
  raycaster.setFromCamera(mouse, camera);
  var obj = [];
  obj.push(cube);
  var found = raycaster.intersectObjects(obj);

  if (found.length > 0 && found[0].object.name === "ISS") {
    console.log("found object: " + found[0].object.name);
    highlightColor.x = 0.8;
    highlightColor.y = -0.2;
    highlightColor.z = -0.2;
    setTimeout(function () {
      highlightColor.x = 0.0;
      highlightColor.y = 0.0;
      highlightColor.z = 0.0;
    }, 1000);
  }
}

//animate --------------------------------->

async function getTLE() {
  const res = await fetch(tleendpoint);
  const tle = await res.json();
  console.log(tle);
  return tle;
}

let tle = await getTLE();
let heightofiss = 6;
// let Clock = new THREE.Clock();
camera.position.z = 8;

function calcPosFromLatLonRad(lat, lon, radius) {
  var phi = (90 - lat) * (Math.PI / 180);
  var theta = (lon + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return [x, y, z];
}

// Render Line

camera.aspect = window.innerWidth / window.innerHeight;
camera.updateProjectionMatrix();
renderer.setSize(window.innerWidth, window.innerHeight);
var satrec,
  gmst,
  positionAndVelocity,
  positionEci,
  positionGd,
  longitude,
  latitude,
  height,
  pos;

function animate() {
  let delta = 1;
  time = new THREE.Clock().getElapsedTime();
  delta = new THREE.Clock().getDelta();
  time *= Math.floor(Date.now() / 1000);

  uniforms.sunDirection.value.y = Math.sin(time);
  uniforms.sunDirection.value.x = Math.cos(time);
  // uniforms.sunDirection.value.copy(sunPosition);
  // uniforms.sunDirection.value.normalize();
  EarthMesh.rotation.x -= 0.0;
  EarthMesh.rotation.y += (0.000035 * 45 * Math.PI) / 180;
  cloudMesh.rotation.y -= (0.00005 * 45 * Math.PI) / 180;

  if (iss_model && tle) {
    satrec = satellite.twoline2satrec(tle[0], tle[1]);
    gmst = satellite.gstime(new Date());
    positionAndVelocity = satellite.propagate(satrec, new Date());
    positionEci = positionAndVelocity.position;
    positionGd = satellite.eciToGeodetic(positionEci, gmst);
    (longitude = satellite.degreesLong(positionGd.longitude)),
      (latitude = satellite.degreesLat(positionGd.latitude)),
      (height = positionGd.height);
    pos = calcPosFromLatLonRad(latitude, longitude, heightofiss);
    iss_model.position.x = pos[0];
    iss_model.position.y = pos[1];
    iss_model.position.z = pos[2];

    cube.position.x = pos[0];
    cube.position.y = pos[1];
    cube.position.z = pos[2];
    if (is_iss_selected === true) {
      camera.lookAt(pos[0], pos[1], pos[2]);
      controls.target.set(pos[0], pos[1], pos[2]);
    } else {
      camera.lookAt(0, 0, 0);
      controls.target.set(0, 0, 0);
    }
    // window.addEventListener("resize", onWindowResize, false);
  }
  hoverPieces();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
function onMouseMove(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}
window.addEventListener('mousemove', onMouseMove);
animate();