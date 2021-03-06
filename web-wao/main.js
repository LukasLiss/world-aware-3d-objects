import './style.css';

////////////////////////////////////////////////////////////
//                    SETUP FUNCTIONS                     //
////////////////////////////////////////////////////////////

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'; 
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'; 
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { WAO } from './wao.js';
import * as Dracula from 'graphdracula';
import { CubeReflectionMapping } from 'three';

// global objects
let camera, scene, renderer, control, mixer, clock;

// gloabal logic objects

let currentGlftObj;
let myWAO;

//Dracula graph
let Graph, Renderer, Layout, graph, dracSpecialRender;

function getTDWidth(){
    return document.getElementById("threeDView").clientWidth;
}

function getTDHeight(){
    return document.getElementById("threeDView").clientHeight;
}

function init(){
    // Init scene
	scene = new THREE.Scene();
  scene.background = new THREE.Color(0xCEF3EC);

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

  dracSpecialRender = function(r, n) {
    var label = r.text(0, 30, n.label).attr({ opacity: 0 })
    //the Raphael set is obligatory, containing all you want to display
    var set = r.set()
      .push(
        r.rect(-30, -13, 62, 86)
          .attr({ fill: '#fa8', 'stroke-width': 2, r: 9 })
      )
      .push(label)
  }

	// Init renderer
	renderer = new THREE.WebGLRenderer({ antialias: true });

  //allow XR
  renderer.xr.enabled = true;

	// Set size
	renderer.setSize(getTDWidth(), getTDHeight());

  // Set encoding for working with GLTF
  renderer.outputEncoding = THREE.sRGBEncoding;

	// Render to canvas element
	document.getElementById("threeDView").appendChild(renderer.domElement);

  //Add VR Button
  document.body.appendChild( VRButton.createButton( renderer ) );

	// Position camera
	camera.position.z = 5;

  //add ambient light
  const ambientLight = new THREE.AmbientLight(0xffffff);
  scene.add(ambientLight);

  // add point light
  const light = new THREE.PointLight( 0xffffff, 1, 0 );
  light.position.set( 5, 5, 5 );
  scene.add( light );

  //add ground
  const geoGround = new THREE.BoxGeometry(5, 0.1, 5);
  const matGround = new THREE.MeshBasicMaterial( { color: 0x586F7C } );
  const ground = new THREE.Mesh( geoGround, matGround );
  ground.position.y = -0.05;
  scene.add( ground );

  //add shadow plane
  var planeGeometry = new THREE.PlaneGeometry( 200, 200 );
  planeGeometry.rotateX( - Math.PI / 2 );

  var planeMaterial = new THREE.ShadowMaterial();
  planeMaterial.opacity = 0.2;

  var plane = new THREE.Mesh( planeGeometry, planeMaterial );
  plane.position.y = -200;
  plane.receiveShadow = true;
  scene.add( plane );

  //orbit control activation
  control = new OrbitControls(camera, renderer.domElement);

  //start render
  renderer.setAnimationLoop( function () {

    renderer.render( scene, camera );

    if(mixer){
      mixer.update(clock.getDelta());
    }
    control.update();
    renderer.render(scene, camera);
    
  } );
}

function onWindowResize(){
    // Camera frustum aspect ratio
	camera.aspect = getTDWidth() / getTDHeight();
	// After making changes to aspect
	camera.updateProjectionMatrix();
	// Reset size
	renderer.setSize(getTDWidth(), getTDHeight());
}

// function animate() {
//   requestAnimationFrame(animate);

//   if(mixer){
//     mixer.update(clock.getDelta());
//   }
//   control.update();
// 	renderer.render(scene, camera);
// };

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
    document.getElementById("fileSelectButton").onclick = () => {
      loadNewFile();
    }
    document.getElementById("fullscreenButton").onclick = () => {
      enterFullScreen();
    }


    init();
    drawCoordinateSystem();

    loadGLTF("/resources/Wolf.glb");
    //loadGLTF("/resources/BrainStem.glb");
    
    //animate();
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

  //drawWAOGraphUpdate(updates);
  drawWAOGraph(myWAO);
}

function loadNewFile(){
  let path = document.getElementById("fileSelect").files[0];
  console.log(path);

  init();
  drawCoordinateSystem();

  loadGLTF(path);
}

function enterFullScreen(){
  console.log("Fullscreen");
  $("#sidebar").hide();
  //document.getElementById("sidebar").setAttribute("display","none");
  onWindowResize();

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

function drawWAOGraphUpdate(updates){

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

function drawWAOGraph(wao){

  graph = new Graph();

  console.log("Drawing:");
  console.log(wao);
  for(var i = 0; i < wao.states.length; i++){
    if(wao.states[i].name == wao.currentState.name){
      console.log("Gleich: " + wao.states[i].name + " and " + wao.currentState.name);
      graph.addNode(wao.states[i].name, {label: "----> " + wao.states[i].name + " <----"});
    }else{
      graph.addNode(wao.states[i].name, {label: wao.states[i].name});
    }
  }

  let allTransitions = wao.getTransitions();
  for(var i = 0; i < allTransitions.length; i++){
    graph.addEdge(allTransitions[i][0].name, allTransitions[i][2].name, {directed: true, label: allTransitions[i][1]});
  }

  //remove old graph
  document.getElementById("paper").innerHTML = "";

  //add new graph

  var layoutDracula = new Layout(graph);
  var rendererDracula = new Renderer('#paper', graph, document.getElementById("paper").clientWidth, document.getElementById("paper").clientHeight - 5);
  rendererDracula.draw();

}