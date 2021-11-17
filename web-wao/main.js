import './style.css'

////////////////////////////////////////////////////////////
//                    SETUP FUNCTIONS                     //
////////////////////////////////////////////////////////////

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'; 
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'; 
import { WAO } from './wao.js';
import * as Dracula from 'graphdracula';

// global objects
let camera, scene, renderer, control, mixer, clock;

// gloabal logic objects

let currentGlftObj;
let myWAO;

//Dracula graph
let Graph, Renderer, Layout, graph;

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

  myWAO = null;
  mixer = null;
  clock = new THREE.Clock();

  //Dracula graph init
  Graph = Dracula.Graph
  Renderer = Dracula.Renderer.Raphael
  Layout = Dracula.Layout.Spring
  graph = new Graph();

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

  if(mixer){
    mixer.update(clock.getDelta());
  }
  control.update();
	renderer.render(scene, camera);
};

window.onload = function(){
    window.addEventListener('resize', onWindowResize, false);
    document.getElementById("addStateBtn").onclick = () => {
      addStateBtnClick();
    }
    document.getElementById("addTransitionBtn").onclick = () =>{
      addTransitionBtnClick();
    }
    document.getElementById("fireEventBtn").onclick = () => {
      fireEventBtnClick();
    }

    init();
    drawCoordinateSystem();

    loadGLTF("/resources/Wolf.glb");
    //loadGLTF("/resources/BrainStem.glb");
    
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
            setCurrentGlftObj(gltf);

            //scene.add( gltf.scene );
    
            gltf.animations; // Array<THREE.AnimationClip>
            gltf.scene; // THREE.Group
            gltf.scenes; // Array<THREE.Group>
            gltf.cameras; // Array<THREE.Camera>
            gltf.asset; // Object
    
        },
        // called while loading is progressing
        function ( xhr ) {
    
            //console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
    
        },
        // called when loading has errors
        function ( error ) {
    
            console.log( 'An error happened' );
    
        }
    );
}

function setCurrentGlftObj(glft){
  //remove old from scene


  //add new to scene
  currentGlftObj = glft;
  scene.add(glft.scene);

  ///////////////////////
  // UPDATE VIEW       //
  ///////////////////////

  //update animations
  mixer = new THREE.AnimationMixer( glft.scene );
  //remove
  const animDiv = document.getElementById("animationList");
  animDiv.innerHTML = '';
  //add
  for(let i = 0; i < glft.animations.length; i++){

    console.log(glft.animations[i]);
    var b = document.createElement('button');
    b.setAttribute('class', 'animBtn');  
    b.textContent = "Play: " + glft.animations[i].name;
    b.onclick = function(){
      startAnimation(glft, i);
      return false;
    };

    animDiv.appendChild(b);
  }

  //update select for add state section
  let selectElem = document.getElementById("addStateAnim");
  selectElem.innerHTML = '';
  for(let i = 0; i < glft.animations.length; i++){
    var opt = document.createElement('option');
    opt.value = i; //save the index of the animation
    opt.innerHTML = glft.animations[i].name;
    selectElem.appendChild(opt);
  }

  /////////////////////

  // create WAO
  myWAO = new WAO();
  myWAO.setMixer(mixer);
  myWAO.setChangeCallback(waoCahnged);

}

function startAnimation(glft, index){
  console.log("start anim: " + index);
  mixer.stopAllAction();
  const action = mixer.clipAction( glft.animations[index] );
  action.play();
}

function addStateBtnClick(){
  let givenName = document.getElementById("addStateName").value;
  let givenAnim = currentGlftObj.animations[parseInt(document.getElementById("addStateAnim").value)];

  //console.log("Add State: " + givenName + " / " + givenAnim.name);
  myWAO.addState(givenName, [givenAnim]);
}

function addTransitionBtnClick(){
  let evID = document.getElementById("addTransitionEvID").value;
  let sourceName = document.getElementById("addTransitionSource").value;
  let targetName = document.getElementById("addTransitionTarget").value;

  myWAO.addTransition(evID, sourceName, targetName);
}

function fireEventBtnClick(){
  let evID = document.getElementById("simulateEvName").value;
  myWAO.eventNotification(evID);
}

function waoCahnged(updates){ 
  //ubdates is object with .states [str:names] and .transitions [(str:source, str:evID, str:target)]

  //update view of add Transition
  let source = document.getElementById("addTransitionSource");
  source.innerHTML = '';

  let target = document.getElementById("addTransitionTarget");
  target.innerHTML = '';

  for(var i = 0; i < myWAO.getStates().length; i++){
    var opt = document.createElement('option');
    opt.value = myWAO.getStates()[i].name; //the name is enough since the addTransition function needs that
    opt.innerHTML = myWAO.getStates()[i].name;
    source.appendChild(opt);

    var opt2 = document.createElement('option');
    opt2.value = myWAO.getStates()[i].name; //the name is enough since the addTransition function needs that
    opt2.innerHTML = myWAO.getStates()[i].name;
    target.appendChild(opt2);
  }

  drawWAOGraph(updates);
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

function drawWAOGraph(updates){

  for(var i = 0; i < updates.states.length; i++){
    graph.addNode(updates.states[i], {label: updates.states[i]});
  }

  for(var i = 0; i < updates.transitions.length; i++){
    graph.addEdge(updates.transitions[i][0], updates.transitions[i][2], {directed: true, label: updates.transitions[i][1]});
  }

  //remove old graph
  document.getElementById("paper").innerHTML = "";

  //add new graph

  var layoutDracula = new Layout(graph);
  var rendererDracula = new Renderer('#paper', graph, document.getElementById("paper").clientWidth, document.getElementById("paper").clientHeight - 5);
  rendererDracula.draw();

}