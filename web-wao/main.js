import './style.css'

////////////////////////////////////////////////////////////
//                    SETUP FUNCTIONS                     //
////////////////////////////////////////////////////////////

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'; 
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'; 

//global objects
let camera, scene, renderer, control;

function getTDWidth(){
    return document.getElementById("threeDView").clientWidth;
}

function getTDHeight(){
    return document.getElementById("threeDView").clientHeight;
}

function init(){
    // Init scene
	scene = new THREE.Scene();

	// Init Perspective Camera
	camera = new THREE.PerspectiveCamera(
		75,
		getTDWidth() / getTDHeight(),
		0.1,
		1000
	);

	// Init renderer
	renderer = new THREE.WebGLRenderer({ antialias: true });

	// Set size
	renderer.setSize(getTDWidth(), getTDHeight());

  // Set encoding for working with GLTF
  renderer.outputEncoding = THREE.sRGBEncoding;

	// Render to canvas element
	document.getElementById("threeDView").appendChild(renderer.domElement);

	// Position camera
	camera.position.z = 5;

  //add ambient light
  const ambientLight = new THREE.AmbientLight(0x999999);
  scene.add(ambientLight);

  // add point light
  const light = new THREE.PointLight( 0xffffff, 0.5, 0 );
  light.position.set( 20, 20, 20 );
  scene.add( light );

  //orbit control activation
  control = new OrbitControls(camera, renderer.domElement);
}

function onWindowResize(){
    // Camera frustum aspect ratio
	camera.aspect = getTDWidth() / getTDHeight();
	// After making changes to aspect
	camera.updateProjectionMatrix();
	// Reset size
	renderer.setSize(getTDWidth(), getTDHeight());
}

function animate() {
    requestAnimationFrame(animate);

  control.update();
	renderer.render(scene, camera);
};

window.onload = function(){
    window.addEventListener('resize', onWindowResize, false);

    init();
    drawCoordinateSystem();

    loadGLTF("/resources/BrainStem.glb")
    
    animate();
    console.log("Animation started");
}
////////////////////////////////////////////////////////////
//                    LOGIC FUNCTIONS                     //
////////////////////////////////////////////////////////////

function loadGLTF(path){
    const loader = new GLTFLoader();

    loader.load(
        // resource URL
        path,
        // called when the resource is loaded
        function ( gltf ) {
    
            scene.add( gltf.scene );
    
            gltf.animations; // Array<THREE.AnimationClip>
            gltf.scene; // THREE.Group
            gltf.scenes; // Array<THREE.Group>
            gltf.cameras; // Array<THREE.Camera>
            gltf.asset; // Object
    
        },
        // called while loading is progressing
        function ( xhr ) {
    
            console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
    
        },
        // called when loading has errors
        function ( error ) {
    
            console.log( 'An error happened' );
    
        }
    );
}

////////////////////////////////////////////////////////////
//                    DRAWING FUNCTIONS                   //
////////////////////////////////////////////////////////////

function drawCoordinateSystem(){
    let material = new THREE.LineBasicMaterial( { color: 0x0000ff } );

    // X-Achse
    let points = [];
    points.push(new THREE.Vector3(-1, 0, 0));
    points.push(new THREE.Vector3(1, 0, 0));

    let xAcsisGeo = new THREE.BufferGeometry().setFromPoints( points );
    let xAcsis = new THREE.Line( xAcsisGeo, material );
    scene.add( xAcsis );

    // Y-Achse
    points = [];
    points.push(new THREE.Vector3(0, -1, 0));
    points.push(new THREE.Vector3(0, 1, 0));

    let yAcsisGeo = new THREE.BufferGeometry().setFromPoints( points );
    let yAcsis = new THREE.Line( yAcsisGeo, material );
    scene.add( yAcsis );

    // Z-Achse
    points = [];
    points.push(new THREE.Vector3(0, -1, 0));
    points.push(new THREE.Vector3(0, 1, 0));

    let zAcsisGeo = new THREE.BufferGeometry().setFromPoints( points );
    let zAcsis = new THREE.Line( zAcsisGeo, material );
    scene.add( zAcsis );

    //Grid
    const gridHelper = new THREE.GridHelper(50, 25);
    scene.add(gridHelper);
}