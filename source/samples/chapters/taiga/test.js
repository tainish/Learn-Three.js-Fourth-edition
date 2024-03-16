// Import Three.js library
import * as THREE from 'three';
import { MeshStandardMaterial } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader'

// Set up necessary variables
let camera, scene, renderer;
let keyboard = {};
let player = { height: 0, speed: 0.1 * 4/3, turnSpeed: Math.PI * 0.02 };
let pochitaModel;
let maze;
let dead = false;
let camera_light;
let finished = false;
const walls = [];
let pochita_init = false;
let sound;

// Initialize Three.js scene
function init() {
    // Create scene
    scene = new THREE.Scene();
    
    // Create camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.x = -36;
    camera.position.y = player.height;
    camera.position.z = 0;
    camera.rotation.y = -Math.PI / 2;

    // Create renderer
    renderer = new THREE.WebGLRenderer();
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.VSMShadowMap;
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x111111);
    document.body.appendChild(renderer.domElement);
    
    // Add event listeners for keyboard input
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    
    // add lights
    scene.add(new THREE.AmbientLight(0x151515)); //3d3d3d

    const dirLight = new THREE.DirectionalLight(0x1d1d1d); //202020
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
    const groundGeometry = new THREE.PlaneBufferGeometry(200, 200);
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
    
    /*
    function createWall(x, y, z){
        const boxGeometry = new THREE.BoxGeometry(3, 6, 3);
        const boxMesh = new THREE.Mesh(boxGeometry, hedgeMaterial);
        boxMesh.castShadow = true;
        boxMesh.position.set(x, y, z);
        boxMesh.rotation.set(0, 0, 0);
        scene.add(boxMesh);
    }
    */

    maze = [
        [1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 0, 1, 1, 0, 1, 1, 0, 1],
        [1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 1],
        [1, 1, 0, 1, 0, 0, 1, 0, 0, 0, 1],
        [1, 0, 0, 1, 1, 0, 1, 1, 0, 1, 1],
        [1, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1],
        [1, 0, 1, 0, 1, 1, 0, 0, 1, 0, 1],
        [1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1],
        [1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1],
        [1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0]
    ];
    
    for (let i = 0; i < maze.length; i++) {
        for (let j = 0; j < maze[i].length; j++) {
            if (maze[i][j]) {
                const boxGeometry = new THREE.BoxGeometry(3, 6, 3);
                const boxMesh = new THREE.Mesh(boxGeometry, hedgeMaterial);
                boxMesh.castShadow = true;
                boxMesh.receiveShadow = true;
                boxMesh.position.set(-15 + i * 3, 0, 15 - j * 3);
                boxMesh.rotation.set(0, 0, 0);
                walls.push(boxMesh);
            }
        }
    }

    for (let i = -35; i <= -5; i++) {
        const boxGeometry = new THREE.BoxGeometry(3, 6, 3);
        const boxMesh = new THREE.Mesh(boxGeometry, hedgeMaterial);
        boxMesh.castShadow = true;
        boxMesh.receiveShadow = true;
        boxMesh.position.set(i * 3, 0, 3);
        boxMesh.rotation.set(0, 0, 0);
        walls.push(boxMesh);

        const boxGeometry2 = new THREE.BoxGeometry(3, 6, 3);
        const boxMesh2 = new THREE.Mesh(boxGeometry2, hedgeMaterial);
        boxMesh2.castShadow = true;
        boxMesh2.receiveShadow = true;
        boxMesh2.position.set(i * 3, 0, -3);
        boxMesh2.rotation.set(0, 0, 0);
        walls.push(boxMesh2);
    }

    for (let i = 5; i <= 35; i++) {
        const boxGeometry = new THREE.BoxGeometry(3, 6, 3);
        const boxMesh = new THREE.Mesh(boxGeometry, hedgeMaterial);
        boxMesh.castShadow = true;
        boxMesh.receiveShadow = true;
        boxMesh.position.set(i * 3, 0, 15);
        boxMesh.rotation.set(0, 0, 0);
        walls.push(boxMesh);

        const boxGeometry2 = new THREE.BoxGeometry(3, 6, 3);
        const boxMesh2 = new THREE.Mesh(boxGeometry2, hedgeMaterial);
        boxMesh2.castShadow = true;
        boxMesh2.receiveShadow = true;
        boxMesh2.position.set(i * 3, 0, -15);
        boxMesh2.rotation.set(0, 0, 0);
        walls.push(boxMesh2);
    }
    
    const boxGeometry = new THREE.BoxGeometry(3, 6, 3);
    const boxMesh = new THREE.Mesh(boxGeometry, hedgeMaterial);
    boxMesh.castShadow = true;
    boxMesh.receiveShadow = true;
    boxMesh.position.set(-39, 0, 0);
    boxMesh.rotation.set(0, 0, 0);
    walls.push(boxMesh);

    for (let i = 0; i < walls.length; i ++) {
        scene.add(walls[i]);
    }

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

    // Load G letter
    const loader = new STLLoader()
    loader.load(
        '/assets/stl/GG.stl',
        function (geometry) {
            const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial(0x33ffff));
            mesh.scale.set(0.01, 0.01, 0.01);
            mesh.position.x += 35;
            mesh.position.y -= 2;
            mesh.position.z += 2.2;
            mesh.rotation.y = Math.PI;
            scene.add(mesh);
            const mesh2 = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial(0x33ffff));
            mesh2.scale.set(0.01, 0.01, 0.01);
            mesh2.position.x += 35;
            mesh2.position.y -= 2;
            mesh2.position.z -= 2.2;
            mesh2.rotation.y = Math.PI;
            scene.add(mesh2);
        },
        (xhr) => {
            console.log((xhr.loaded / xhr.total) * 100 + '% loaded')
        },
        (error) => {
            console.log(error)
        }
    )

    const light = new THREE.PointLight( 0xffffff, 1.2, 16, 5 );
    light.position.set(camera.position.x, camera.position.y, camera.position.z);
    camera_light = light;
    scene.add( light );


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
    // Turn left
    if (keyboard['ArrowLeft']) {
        camera.rotation.y += player.turnSpeed * 3 / 4;
    }
    // Turn right
    if (keyboard['ArrowRight']) {
        camera.rotation.y -= player.turnSpeed * 3 / 4;
    }

    if (dead) return;

    let dx = 0;
    let dz = 0;
    // Move forward
    if (keyboard['KeyW']) {
        dx -= Math.sin(camera.rotation.y) * player.speed;
        dz -= Math.cos(camera.rotation.y) * player.speed;
    }
    // Move backward
    if (keyboard['KeyS']) {
        dx += Math.sin(camera.rotation.y) * player.speed;
        dz += Math.cos(camera.rotation.y) * player.speed;
    }
    // Strafe right
    if (keyboard['KeyD']) {
        dx -= Math.sin(camera.rotation.y - Math.PI / 2) * player.speed;
        dz -= Math.cos(camera.rotation.y - Math.PI / 2) * player.speed;
    }
    // Strafe left
    if (keyboard['KeyA']) {
        dx -= Math.sin(camera.rotation.y + Math.PI / 2) * player.speed;
        dz -= Math.cos(camera.rotation.y + Math.PI / 2) * player.speed;
    }
    
    camera.position.x += dx;
    camera.position.z += dz;
    
    for (let i = 0; i < walls.length; i++) {
        let wall = walls[i];
        if (camera.position.z >= wall.position.z - 1.75 && camera.position.z <= wall.position.z + 1.75 && camera.position.x >=  wall.position.x - 1.75 && camera.position.x <= wall.position.x + 1.75) {
            let dbx = camera.position.x - wall.position.x;
            let dbz = camera.position.z - wall.position.z;
            if (dbx >= dbz) {
                if (dbx >= -dbz) {
                    camera.position.x = wall.position.x + 1.75;
                } else {
                    camera.position.z = wall.position.z - 1.75;
                }
            } else {
                if (dbx >= -dbz) {
                    camera.position.z = wall.position.z + 1.75;
                } else {
                    camera.position.x = wall.position.x - 1.75;
                }
            }
        }
    }

    camera_light.position.set(camera.position.x, camera.position.y, camera.position.z);
}

// Render loop
function animate() {
    requestAnimationFrame(animate);
    update();
    renderer.render(scene, camera);

    if (pochitaModel) {
        if (!pochita_init) {
            pochitaModel.scene.position.x = 15;

            // create listener
            const listener = new THREE.AudioListener();
            camera.add( listener );

            // create a global audio source
            sound = new THREE.Audio( listener );

            // load a sound and set it as the Audio object's buffer
            const audioLoader = new THREE.AudioLoader();
            audioLoader.load( '/assets/sounds/Heartbeat.ogg', function( buffer ) {
                sound.setBuffer( buffer );
                sound.setLoop( true );
                sound.setVolume( 0.5 );
                sound.play();
            });

            pochitaModel.scene.add(sound);
            pochita_init = true;
        }
        if (camera.position.x >= -15 && camera.position.x <= 15) {
            pochitaModel.scene.scale.set(0.5, 0.5, 0.5);
            let dx = camera.position.x - pochitaModel.scene.position.x;
            let dz = camera.position.z - pochitaModel.scene.position.z;
            let len = Math.sqrt(dx * dx + dz * dz);
            let factor = len * 22 * 3/4 / 1.5;
            if (len > 1.5) {
                pochitaModel.scene.position.x += dx / factor;
                pochitaModel.scene.position.z += dz / factor;
                pochitaModel.scene.rotation.y = -(Math.atan(dz/dx) - Math.PI / 2);
                if (dx/Math.abs(dx) < 0) pochitaModel.scene.rotation.y -= Math.PI;
            }
            else {
                scene.background = new THREE.Color( 0x550000 );
                dead = true;
            }
        } else if (camera.position.x > 20) {
            if (!finished) {
                sound.stop();
                scene.background = new THREE.Color( 0x88dddd );
                scene.add(new THREE.AmbientLight( 0x505050 ));

                const dirLight = new THREE.DirectionalLight( 0xdddddd ); //202020
                dirLight.position.set(-5, 12, -8);
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
                finished = true;
            };
        }
    };
    if (dead) {
        scene.background = new THREE.Color( 0xff0000 );
        scene.add(new THREE.AmbientLight( 0x150000 ));
    };
}

// Initialize the scene
init();
