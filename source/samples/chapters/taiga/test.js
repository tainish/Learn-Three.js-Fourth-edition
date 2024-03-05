// Import Three.js library
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Set up necessary variables
let camera, scene, renderer;
let keyboard = {};
let player = { height: 0, speed: 0.2, turnSpeed: Math.PI * 0.02 };
let pochitaModel;

// Initialize Three.js scene
function init() {
    // Create scene
    scene = new THREE.Scene();
    
    // Create camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.y = player.height;
    
    // Create renderer
    renderer = new THREE.WebGLRenderer();
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.VSMShadowMap;
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0xffffff);
    document.body.appendChild(renderer.domElement);
    
    // Add event listeners for keyboard input
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    
    // add lights
    scene.add(new THREE.AmbientLight(0xAAAAAA));

    const dirLight = new THREE.DirectionalLight(0xaaaaaa);
    dirLight.position.set(5, 12, 8);
    dirLight.castShadow = true;
    dirLight.intensity = 1;
    dirLight.shadow.camera.near = 0.1;
    dirLight.shadow.camera.far = 200;
    dirLight.shadow.camera.right = 10;
    dirLight.shadow.camera.left = -10;
    dirLight.shadow.camera.top = 10;
    dirLight.shadow.camera.bottom = -10;
    dirLight.shadow.mapSize.width = 512;
    dirLight.shadow.mapSize.height = 512;
    dirLight.shadow.radius = 4;
    dirLight.shadow.bias = -0.0005;

    scene.add(dirLight);

    // Add floor to the scene
    /*
    let floorGeometry = new THREE.PlaneGeometry(100, 100, 1, 1);
    let floorMaterial = new THREE.MeshBasicMaterial({ color: 0xcccccc, wireframe: true });
    let floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);*/

    const dirtBumpMap = new THREE.TextureLoader().load(
        '/assets/textures/dirt/Ground_Dirt_007_normal.jpg',
        (texture) => {
            texture.wrapS = THREE.RepeatWrapping
            texture.wrapT = THREE.RepeatWrapping
            texture.repeat.set(10, 10)
        }
    )
    
    const dirtTextureLoader = new THREE.TextureLoader(); 
    const dirtTexture = dirtTextureLoader.load('/assets/textures/dirt/Ground_Dirt_007_basecolor.jpg') // make sure this file exists!
    
    dirtTexture.wrapS = THREE.RepeatWrapping; // horizontal wrapping
    dirtTexture.wrapT = THREE.RepeatWrapping; // vertical wrapping
    dirtTexture.repeat.set( 10, 10 ); // how many times to repeat
    
    const dirtMaterial = new THREE.MeshPhongMaterial({ color: 
      0xbbbbbb })
    dirtMaterial.map = dirtTexture
    dirtMaterial.bumpMap = dirtBumpMap

    // create a very large ground plane
    const groundGeometry = new THREE.PlaneBufferGeometry(99, 99);
    const groundMesh = new THREE.Mesh(groundGeometry, dirtMaterial);
    groundMesh.receiveShadow = true;
    groundMesh.position.set(0, -3, 0);
    groundMesh.rotation.set(Math.PI / -2, 0, 0);
    scene.add(groundMesh);

    // walls
    const hedgeBumpMap = new THREE.TextureLoader().load(
        '/assets/textures/grass/Grass_002_NRM.jpg',
        (texture) => {
            texture.wrapS = THREE.RepeatWrapping
            texture.wrapT = THREE.RepeatWrapping
            texture.repeat.set(2, 4)
        }
    )
    
    const hedgeTextureLoader = new THREE.TextureLoader(); 
    const hedgeTexture = hedgeTextureLoader.load('/assets/textures/grass/Grass_002_COLOR.jpg') // make sure this file exists!
    
    hedgeTexture.wrapS = THREE.RepeatWrapping; // horizontal wrapping
    hedgeTexture.wrapT = THREE.RepeatWrapping; // vertical wrapping
    hedgeTexture.repeat.set( 2, 4 ); // how many times to repeat
    
    const hedgeMaterial = new THREE.MeshPhongMaterial({ color: 
      0x229922 })
    
    hedgeMaterial.map = hedgeTexture
    hedgeMaterial.bumpMap = hedgeBumpMap
    
    function createWall(x, y, z){
        const boxGeometry = new THREE.BoxGeometry(3, 6, 3);
        const boxMesh = new THREE.Mesh(boxGeometry, hedgeMaterial);
        boxMesh.castShadow = true;
        boxMesh.position.set(x, y, z);
        boxMesh.rotation.set(0, 0, 0);
        scene.add(boxMesh);
    }
    
    const walls = new THREE.Group();
    
    for (let i = 0; i < 10; i++) {
        const boxGeometry = new THREE.BoxGeometry(3, 6, 3);
        const boxMesh = new THREE.Mesh(boxGeometry, hedgeMaterial);
        boxMesh.castShadow = true;
        boxMesh.position.set(i * 3, 0, 0);
        boxMesh.rotation.set(0, 0, 0);
        walls.add(boxMesh);
    }
    
    //scene.add(walls)

    // Load Pochita
    const gltfLoader = new GLTFLoader();
    gltfLoader.load("/assets/gltf/pochita_center/scene.gltf",
        (gltfScene) => {
            gltfScene.scene.traverse((child) => {
                if (child.isMesh) {
                    const m = child;
                    m.receiveShadow = true;
                    m.castShadow = true;
                }
                /*
                if (child.isLight) {
                    const l = child
                    l.castShadow = true
                    l.shadow.bias = -.003
                    l.shadow.mapSize.width = 2048
                    l.shadow.mapSize.height = 2048
                }
                */
            })
            
            const box = new THREE.Box3().setFromObject( gltfScene.scene );
            const center = box.getCenter( new THREE.Vector3() );
            
            gltfScene.scene.position.x += ( gltfScene.scene.position.x - center.x );
            gltfScene.scene.position.y += ( gltfScene.scene.position.y - center.y );
            gltfScene.scene.position.z += ( gltfScene.scene.position.z - center.z );
            
            //gltfScene.scene.position.y -= 2;

            pochitaModel = gltfScene;
            scene.add(gltfScene.scene);
        }
    );

    // Start render loop
    animate();
}

// Handle keyboard input
function onKeyDown(event) {
    keyboard[event.code] = true;
}

function onKeyUp(event) {
    keyboard[event.code] = false;
}

// Update player movement
function update() {
    // Move forward
    if (keyboard['KeyW']) {
        camera.position.x -= Math.sin(camera.rotation.y) * player.speed;
        camera.position.z -= Math.cos(camera.rotation.y) * player.speed;
    }
    // Move backward
    if (keyboard['KeyS']) {
        camera.position.x += Math.sin(camera.rotation.y) * player.speed;
        camera.position.z += Math.cos(camera.rotation.y) * player.speed;
    }
    // Strafe right
    if (keyboard['KeyD']) {
        camera.position.x -= Math.sin(camera.rotation.y - Math.PI / 2) * player.speed;
        camera.position.z -= Math.cos(camera.rotation.y - Math.PI / 2) * player.speed;
    }
    // Strafe left
    if (keyboard['KeyA']) {
        camera.position.x -= Math.sin(camera.rotation.y + Math.PI / 2) * player.speed;
        camera.position.z -= Math.cos(camera.rotation.y + Math.PI / 2) * player.speed;
    }
    // Turn left
    if (keyboard['ArrowLeft']) {
        camera.rotation.y += player.turnSpeed * 3 / 4;
    }
    // Turn right
    if (keyboard['ArrowRight']) {
        camera.rotation.y -= player.turnSpeed * 3 / 4;
    }
}

// Render loop
function animate() {
    requestAnimationFrame(animate);
    update();
    renderer.render(scene, camera);

    if (pochitaModel) {
        pochitaModel.scene.scale.set(0.5, 0.5, 0.5);
        let dx = camera.position.x - pochitaModel.scene.position.x;
        let dz = camera.position.z - pochitaModel.scene.position.z;
        let len = Math.sqrt(dx * dx + dz * dz);
        let factor = len * 10;
        if (len > 1) {
            pochitaModel.scene.position.x += dx / factor;
            pochitaModel.scene.position.z += dz / factor;
            pochitaModel.scene.rotation.y = dx / Math.abs(dx) * Math.atan(dz/dx) - Math.PI / 2;
        }
    };
}

// Initialize the scene
init();
