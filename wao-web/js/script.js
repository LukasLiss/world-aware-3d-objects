////////////////////////////////////////////////////////////
//                    SETUP FUNCTIONS                     //
////////////////////////////////////////////////////////////



//global objects
let camera, scene, renderer, cube;

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

	// Render to canvas element
	document.getElementById("threeDView").appendChild(renderer.domElement);

	// Position camera
	camera.position.z = 5;
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

	renderer.render(scene, camera);
};

window.onload = function(){
    window.addEventListener('resize', onWindowResize, false);

    init();
    drawCoordinateSystem();

    //loadGLTF("/Users/lukasliss/Documents/GitHub/world-aware-3d-objects/Example-Objects/BrainStem.glb")

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
}