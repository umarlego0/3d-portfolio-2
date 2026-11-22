/**
 * ============================================================================
 * RPG 3D DIORAMA PORTFOLIO & CV ENGINE
 * Technologies: Three.js (ESM), Web Audio API, Interactive Raycasting & Waypoint Lerp
 * ============================================================================
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

/* ============================================================================
   1. ASSET CONFIGURATION & OVERRIDE SLOT
   ============================================================================ */
/**
 * Custom 3D Island GLB Model Override:
 * Set to a path like './assets/island.glb' if you have your own 3D model.
 * If left blank (""), the procedural low-poly island diorama renders automatically!
 */
const CUSTOM_ISLAND_MODEL_PATH = "";

/* ============================================================================
   2. GLOBAL STATE & AUDIO SYSTEM
   ============================================================================ */
let scene, camera, renderer, controls;
let dioramaGroup, particlesGroup;
let campfireLight, cabinLight, chestLight;
let smokeParticles = [], emberParticles = [], waterParticles = [], fireflyParticles = [];
let interactiveLandmarks = [];
let currentHoveredLandmark = null;
let customLoadedModel = null;
let cvData = null;

// Sound FX state (Procedural Web Audio API)
let audioCtx = null;
let isAudioMuted = false;

// Mouse & Parallax tracking
const mouse = new THREE.Vector2();
const raycaster = new THREE.Raycaster();
let mouseScreen = { x: 0, y: 0 };
let targetParallax = { x: 0, y: 0 };
let currentParallax = { x: 0, y: 0 };

// Scroll Waypoint Interpolation
let scrollProgress = 0;
let isUserInteractingWithControls = false;
let userInteractionTimeout = null;

// Camera Waypoints matching the diorama landmarks
const WAYPOINTS = [
  // 0: Overlook / Hero View
  { progress: 0.00, pos: new THREE.Vector3(0, 4.8, 14.5), target: new THREE.Vector3(0, 0.6, 0), title: "Overlook" },
  // 1: Workshop Cabin (About & Education)
  { progress: 0.20, pos: new THREE.Vector3(-4.4, 3.2, 7.0), target: new THREE.Vector3(-2.2, 1.2, 0.2), title: "Cozy Workshop" },
  // 2: Wizard Tower (Experience Roll)
  { progress: 0.45, pos: new THREE.Vector3(5.6, 4.2, 7.5), target: new THREE.Vector3(2.8, 2.0, -0.8), title: "Wizard Tower" },
  // 3: Treasure Chests & Campfire (Projects & Artifacts)
  { progress: 0.70, pos: new THREE.Vector3(0.2, 2.6, 5.4), target: new THREE.Vector3(0.0, 0.5, 0.8), title: "Treasure Vault" },
  // 4: Campfire Clearing (Skills)
  { progress: 0.88, pos: new THREE.Vector3(-1.5, 2.5, 5.0), target: new THREE.Vector3(-0.2, 0.6, 0.5), title: "Adventurer's Campfire" },
  // 5: Crystal Cascade (Contact & Overview)
  { progress: 1.00, pos: new THREE.Vector3(6.2, 5.8, 11.2), target: new THREE.Vector3(0.5, 0.8, 0.0), title: "Crystal Cascade" }
];

/* ============================================================================
   3. INITIALIZATION & LIFECYCLE
   ============================================================================ */
window.addEventListener('DOMContentLoaded', async () => {
  await loadCVData();
  initThree();
  buildDiorama();
  initParticles();
  initEventListeners();
  initUI();
  initMascot();
  animate();
});

/* ============================================================================
   4. DATA INGESTION (data.json WITH OFFLINE FALLBACK)
   ============================================================================ */
async function loadCVData() {
  try {
    const res = await fetch('data.json');
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    cvData = await res.json();
  } catch (err) {
    console.warn("Could not fetch data.json directly (likely file:// protocol). Using embedded default CV data.", err);
    cvData = {
      profile: {
        fullName: "MUHAMMAD UMAR FAROOQ",
        headline: "CS STUDENT & CREATOR",
        subHeadline: "Game Developer, 3D Generalist & Video Editor",
        bio: "Computer Science undergraduate at the University of Central Punjab specializing in programming, algorithms, data structures, game development in Unity & Unreal Engine, 3D modeling in Blender, and creative video production.",
        location: "Wapda Town, Gujranwala, Punjab, Pakistan",
        email: "Umarleg01@gmail.com",
        phone: "+92 310 7227522",
        avatarPath: "",
        cvPdfPath: "",
        languages: ["English", "Urdu"],
        hobbies: ["Video Gaming", "Coding", "Exercising", "Puzzle Solving"]
      },
      socials: {
        github: "https://github.com",
        linkedin: "https://linkedin.com",
        itchio: "",
        youtube: "",
        instagram: "",
        artstation: "",
        website: ""
      },
      education: [
        {
          degree: "BS Computer Science",
          institution: "University of Central Punjab (UCP)",
          period: "Jul 2024 - Present",
          details: "Pursuing a 4-year BS degree in Computer Science with focus on programming, algorithms, data structures, and software development."
        },
        {
          degree: "Intermediate (FSc)",
          institution: "Board of Intermediate and Secondary Education, Punjab",
          period: "Completed: 2024",
          details: "Grade: A"
        },
        {
          degree: "Matriculation (SSC)",
          institution: "Board of Intermediate and Secondary Education, Punjab",
          period: "Completed: 2022",
          details: "Grade: A"
        }
      ],
      experienceRoll: [
        {
          role: "Full-Time BS Computer Science Student",
          company: "University of Central Punjab",
          period: "2024 - Present",
          location: "Lahore / Gujranwala",
          description: "Actively pursuing undergraduate studies, specializing in computer science fundamentals, game engines (Unity & Unreal), and technical software projects.",
          tags: ["C++", "Data Structures", "Unity", "Unreal Engine"]
        },
        {
          role: "Manager",
          company: "Kingston Auto Paint Booth",
          period: "2023 - 2024",
          location: "Khiali, Gujranwala",
          description: "Managed daily operations, coordinated team workflows, and ensured strict service quality standards in an automotive paint facility.",
          tags: ["Operations Management", "Workflow Coordination", "Quality Control"]
        },
        {
          role: "Part-Time Cashier / Chef",
          company: "Chicken Munch",
          period: "2022",
          location: "Kings Mall, Gujranwala",
          description: "Handled monetary transactions accurately, performed food preparation tasks, and maintained strict safety and hygiene standards.",
          tags: ["POS & Cash Handling", "Fast-Paced Operations", "Safety Standards"]
        },
        {
          role: "Part-Time Salesman",
          company: "Family Mart",
          period: "2019",
          location: "Wapda Town, Gujranwala",
          description: "Provided customer service, managed inventory stock levels, and assisted with daily retail floor operations.",
          tags: ["Customer Service", "Inventory Management", "Retail"]
        }
      ],
      skills: [
        {
          category: "Programming & Low-Level",
          items: [
            { name: "C++", level: "Advanced" },
            { name: "HTML5 / CSS3 / JavaScript", level: "Proficient" },
            { name: "Three.js / WebGL", level: "Exploring" },
            { name: "8086 Assembly Language", level: "Intermediate" }
          ]
        },
        {
          category: "Game Development & 3D",
          items: [
            { name: "Unity Engine", level: "Proficient" },
            { name: "Unreal Engine", level: "Intermediate" },
            { name: "Blender (3D Modeling)", level: "Intermediate" }
          ]
        },
        {
          category: "Media & Creative Production",
          items: [
            { name: "Video Editing", level: "Advanced" },
            { name: "Videography", level: "Proficient" }
          ]
        }
      ],
      projects: [
        {
          title: "Low-Poly Dungeon Crawler",
          category: "Unity / 3D Game",
          description: "Action-adventure RPG featuring low-poly asset pipelines, custom combat mechanics, and dynamic lighting in Unity Engine.",
          techStack: ["Unity", "C#", "Blender"],
          thumbnailPath: "",
          liveDemoUrl: "",
          githubRepoUrl: ""
        },
        {
          title: "Interactive 3D Diorama Portfolio",
          category: "Web / Three.js",
          description: "Stylized low-poly 3D floating island diorama with scroll-driven camera choreography and tactile RPG game UI.",
          techStack: ["HTML5", "CSS3", "JavaScript", "Three.js"],
          thumbnailPath: "",
          liveDemoUrl: "",
          githubRepoUrl: ""
        },
        {
          title: "Cinematic Unreal Engine Environment",
          category: "Unreal Engine / Video",
          description: "High-fidelity real-time environment showcasing volumetric lighting, Niagara particles, and cinematic camera cuts.",
          techStack: ["Unreal Engine", "C++", "Video Editing"],
          thumbnailPath: "",
          liveDemoUrl: "",
          githubRepoUrl: ""
        }
      ]
    };
  }

  // Update header subtitle with user's actual headline
  const headerSubtitleEl = document.getElementById('header-subtitle');
  if (headerSubtitleEl && cvData.profile) {
    headerSubtitleEl.textContent = `${cvData.profile.fullName} • ${cvData.profile.headline}`;
  }
}

/* ============================================================================
   5. THREE.JS ENGINE SETUP
   ============================================================================ */
function initThree() {
  const container = document.getElementById('canvas-container');

  // Scene
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0xc8f4c4, 0.022);

  // Camera
  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.copy(WAYPOINTS[0].pos);

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  container.appendChild(renderer.domElement);

  // OrbitControls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.target.copy(WAYPOINTS[0].target);
  controls.maxPolarAngle = Math.PI / 2 + 0.06; // Prevent flipping upside down
  controls.minDistance = 4.5;
  controls.maxDistance = 22.0;

  // Track user manual interaction with OrbitControls
  controls.addEventListener('start', () => {
    isUserInteractingWithControls = true;
    if (userInteractionTimeout) clearTimeout(userInteractionTimeout);
  });
  controls.addEventListener('end', () => {
    if (userInteractionTimeout) clearTimeout(userInteractionTimeout);
    userInteractionTimeout = setTimeout(() => {
      isUserInteractingWithControls = false;
    }, 2500);
  });

  // Lighting System
  setupLighting();

  // Root Groups
  dioramaGroup = new THREE.Group();
  scene.add(dioramaGroup);

  particlesGroup = new THREE.Group();
  scene.add(particlesGroup);
}

function setupLighting() {
  // Ambient Soft Light
  const ambientLight = new THREE.AmbientLight(0xe8f7ea, 0.75);
  scene.add(ambientLight);

  // Hemisphere Sky/Ground Light
  const hemiLight = new THREE.HemisphereLight(0xdff8db, 0x5a4836, 0.6);
  scene.add(hemiLight);

  // Warm Directional Sun Light
  const dirLight = new THREE.DirectionalLight(0xfff7e6, 1.4);
  dirLight.position.set(12, 22, 14);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;
  dirLight.shadow.camera.near = 0.5;
  dirLight.shadow.camera.far = 50;
  const d = 10;
  dirLight.shadow.camera.left = -d;
  dirLight.shadow.camera.right = d;
  dirLight.shadow.camera.top = d;
  dirLight.shadow.camera.bottom = -d;
  dirLight.shadow.bias = -0.0005;
  scene.add(dirLight);

  // Point Lights for Landmarks
  // 1. Campfire Point Light
  campfireLight = new THREE.PointLight(0xff7711, 2.8, 9, 1.8);
  campfireLight.position.set(0, 1.2, 0.4);
  campfireLight.castShadow = true;
  scene.add(campfireLight);

  // 2. Cabin Window Light
  cabinLight = new THREE.PointLight(0xffb733, 2.0, 7, 1.5);
  cabinLight.position.set(-2.5, 1.5, -0.2);
  scene.add(cabinLight);

  // 3. Treasure Chest Light
  chestLight = new THREE.PointLight(0xffd700, 1.8, 5, 2.0);
  chestLight.position.set(-1.1, 0.9, 1.4);
  scene.add(chestLight);
}

/* ============================================================================
   6. 3D ISLAND DIORAMA BUILDER (PROCEDURAL & CUSTOM ASSET)
   ============================================================================ */
function buildDiorama() {
  if (CUSTOM_ISLAND_MODEL_PATH && CUSTOM_ISLAND_MODEL_PATH.trim() !== "") {
    loadCustomModel(CUSTOM_ISLAND_MODEL_PATH);
  } else {
    createProceduralIsland();
  }
}

function loadCustomModel(path) {
  const loader = new GLTFLoader();
  loader.load(
    path,
    (gltf) => {
      customLoadedModel = gltf.scene;
      customLoadedModel.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          if (child.material) {
            child.material.flatShading = true;
          }
        }
      });

      // Compute bounding box and center model
      const bbox = new THREE.Box3().setFromObject(customLoadedModel);
      const center = bbox.getCenter(new THREE.Vector3());
      const size = bbox.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 8.5 / maxDim;
      customLoadedModel.scale.setScalar(scale);
      customLoadedModel.position.sub(center.multiplyScalar(scale));

      dioramaGroup.clear();
      dioramaGroup.add(customLoadedModel);
      console.log("Successfully loaded custom 3D island model from:", path);
    },
    (xhr) => {
      console.log(`Loading custom model: ${(xhr.loaded / xhr.total) * 100}%`);
    },
    (error) => {
      console.warn("Failed to load custom GLB model. Falling back to procedural island.", error);
      createProceduralIsland();
    }
  );
}

/**
 * Creates the ultra low-poly diorama floating island using clean, single-color flat-shaded meshes.
 */
function createProceduralIsland() {
  dioramaGroup.clear();
  interactiveLandmarks = [];

  // Single-color flat-shaded materials (strictly roughness: 0.85, metalness: 0.05, flatShading: true)
  const mats = {
    // Terrain & Base
    grassTop: new THREE.MeshStandardMaterial({ color: 0x6BCB4B, flatShading: true, roughness: 0.85, metalness: 0.05 }),
    grassMid: new THREE.MeshStandardMaterial({ color: 0x52B788, flatShading: true, roughness: 0.85, metalness: 0.05 }),
    cliffUpper: new THREE.MeshStandardMaterial({ color: 0x8C6239, flatShading: true, roughness: 0.85, metalness: 0.05 }),
    cliffLower: new THREE.MeshStandardMaterial({ color: 0x6F4E2E, flatShading: true, roughness: 0.85, metalness: 0.05 }),
    cliffCore: new THREE.MeshStandardMaterial({ color: 0x543A22, flatShading: true, roughness: 0.85, metalness: 0.05 }),
    cliffSpike: new THREE.MeshStandardMaterial({ color: 0x422F1B, flatShading: true, roughness: 0.85, metalness: 0.05 }),

    // Cabin
    woodPlank: new THREE.MeshStandardMaterial({ color: 0xB87333, flatShading: true, roughness: 0.85, metalness: 0.05 }),
    woodDark: new THREE.MeshStandardMaterial({ color: 0x5C3A21, flatShading: true, roughness: 0.85, metalness: 0.05 }),
    roofTile: new THREE.MeshStandardMaterial({ color: 0xD9534F, flatShading: true, roughness: 0.85, metalness: 0.05 }),
    chimneyStone: new THREE.MeshStandardMaterial({ color: 0x8E9AAF, flatShading: true, roughness: 0.85, metalness: 0.05 }),
    windowGlow: new THREE.MeshStandardMaterial({ color: 0xFFE066, emissive: 0xFFA200, emissiveIntensity: 1.0, flatShading: true, roughness: 0.85, metalness: 0.05 }),

    // Tower
    stoneTower: new THREE.MeshStandardMaterial({ color: 0x8E9AAF, flatShading: true, roughness: 0.85, metalness: 0.05 }),
    stoneTrim: new THREE.MeshStandardMaterial({ color: 0x6C757D, flatShading: true, roughness: 0.85, metalness: 0.05 }),
    towerRoof: new THREE.MeshStandardMaterial({ color: 0x7B2CBF, flatShading: true, roughness: 0.85, metalness: 0.05 }),
    goldMetal: new THREE.MeshStandardMaterial({ color: 0xFFD166, flatShading: true, roughness: 0.85, metalness: 0.05 }),

    // Water & Gems
    water: new THREE.MeshStandardMaterial({ color: 0x4CC9F0, transparent: true, opacity: 0.85, flatShading: true, roughness: 0.2, metalness: 0.05 }),

    // Foliage
    pineFoliage: new THREE.MeshStandardMaterial({ color: 0x2D6A4F, flatShading: true, roughness: 0.85, metalness: 0.05 }),
    pineFoliageLight: new THREE.MeshStandardMaterial({ color: 0x40916C, flatShading: true, roughness: 0.85, metalness: 0.05 }),
    deciduousFoliage: new THREE.MeshStandardMaterial({ color: 0x52B788, flatShading: true, roughness: 0.85, metalness: 0.05 }),
    deciduousDark: new THREE.MeshStandardMaterial({ color: 0x2D6A4F, flatShading: true, roughness: 0.85, metalness: 0.05 }),

    // Campfire
    campfireCoal: new THREE.MeshStandardMaterial({ color: 0x332211, flatShading: true, roughness: 0.85, metalness: 0.05 }),
    fireOrange: new THREE.MeshStandardMaterial({ color: 0xFF6B35, emissive: 0xFF3E00, emissiveIntensity: 1.2, flatShading: true, roughness: 0.85, metalness: 0.05 }),
    fireYellow: new THREE.MeshStandardMaterial({ color: 0xFFD166, emissive: 0xFFA200, emissiveIntensity: 1.4, flatShading: true, roughness: 0.85, metalness: 0.05 }),

    // Characters
    skin: new THREE.MeshStandardMaterial({ color: 0xFFD1A9, flatShading: true, roughness: 0.85, metalness: 0.05 }),
    wizardRobe: new THREE.MeshStandardMaterial({ color: 0x7B2CBF, flatShading: true, roughness: 0.85, metalness: 0.05 }),
    wizardHat: new THREE.MeshStandardMaterial({ color: 0x5A189A, flatShading: true, roughness: 0.85, metalness: 0.05 }),
    beardWhite: new THREE.MeshStandardMaterial({ color: 0xF8F9FA, flatShading: true, roughness: 0.85, metalness: 0.05 }),
    staffWood: new THREE.MeshStandardMaterial({ color: 0x5C3A21, flatShading: true, roughness: 0.85, metalness: 0.05 }),
    staffGem: new THREE.MeshStandardMaterial({ color: 0x4CC9F0, emissive: 0x00A8E8, emissiveIntensity: 1.2, flatShading: true, roughness: 0.85, metalness: 0.05 }),
    knightArmor: new THREE.MeshStandardMaterial({ color: 0xCED4DA, flatShading: true, roughness: 0.85, metalness: 0.05 }),
    knightCape: new THREE.MeshStandardMaterial({ color: 0x1D3557, flatShading: true, roughness: 0.85, metalness: 0.05 })
  };

  // -------------------------------------------------------------
  // A. ULTRA LOW-POLY FLOATING ISLAND LANDMASS & CRAGS
  // -------------------------------------------------------------
  const islandLandmass = new THREE.Group();

  // Tier 1: Main Grass Plate (Hexagonal 6-segment cylinder)
  const mainGrassGeo = new THREE.CylinderGeometry(4.7, 4.3, 0.7, 6);
  const mainGrassMesh = new THREE.Mesh(mainGrassGeo, mats.grassTop);
  mainGrassMesh.position.y = 0.35;
  mainGrassMesh.receiveShadow = true;
  mainGrassMesh.castShadow = true;
  islandLandmass.add(mainGrassMesh);

  // Stepped Grass Turf Blocks around edges (BoxGeometry 1x1x1)
  const turfBlocks = [
    { pos: [-3.0, 0.7, 1.2], size: [0.9, 0.45, 0.9], rot: 0.2 },
    { pos: [1.8, 0.7, 2.2], size: [0.8, 0.4, 0.8], rot: -0.3 },
    { pos: [-1.4, 0.7, 2.5], size: [0.75, 0.4, 0.75], rot: 0.4 },
    { pos: [-3.4, 0.65, -0.8], size: [0.85, 0.45, 0.85], rot: -0.15 }
  ];
  turfBlocks.forEach(b => {
    const geo = new THREE.BoxGeometry(b.size[0], b.size[1], b.size[2], 1, 1, 1);
    const m = new THREE.Mesh(geo, mats.grassMid);
    m.position.set(...b.pos);
    m.rotation.y = b.rot;
    m.castShadow = true;
    m.receiveShadow = true;
    islandLandmass.add(m);
  });

  // Tier 2: Upper Plateau (back & left elevated terrain, 1x1x1 box)
  const upperPlateauGeo = new THREE.BoxGeometry(4.2, 0.6, 3.6, 1, 1, 1);
  const upperPlateauMesh = new THREE.Mesh(upperPlateauGeo, mats.grassMid);
  upperPlateauMesh.position.set(-1.2, 0.85, -1.0);
  upperPlateauMesh.rotation.y = 0.15;
  upperPlateauMesh.receiveShadow = true;
  upperPlateauMesh.castShadow = true;
  islandLandmass.add(upperPlateauMesh);

  // Tier 3: Right Elevated Tower Platform (Hexagonal 6-segment cylinder)
  const towerHillGeo = new THREE.CylinderGeometry(1.9, 2.2, 0.75, 6);
  const towerHillMesh = new THREE.Mesh(towerHillGeo, mats.grassTop);
  towerHillMesh.position.set(2.8, 0.8, -0.6);
  towerHillMesh.receiveShadow = true;
  towerHillMesh.castShadow = true;
  islandLandmass.add(towerHillMesh);

  // Layered Rocky Cliff Root Base (Tapering downward into the void)
  const cliffBase1 = new THREE.CylinderGeometry(4.3, 3.0, 1.4, 6);
  const cliffMesh1 = new THREE.Mesh(cliffBase1, mats.cliffUpper);
  cliffMesh1.position.y = -0.65;
  cliffMesh1.castShadow = true;
  cliffMesh1.receiveShadow = true;
  islandLandmass.add(cliffMesh1);

  const cliffBase2 = new THREE.CylinderGeometry(3.0, 1.7, 1.8, 5);
  const cliffMesh2 = new THREE.Mesh(cliffBase2, mats.cliffLower);
  cliffMesh2.position.set(0.1, -2.1, 0.1);
  cliffMesh2.rotation.y = 0.4;
  cliffMesh2.castShadow = true;
  islandLandmass.add(cliffMesh2);

  // Jagged bottom stalactite peak (5-segment inverted cone)
  const bottomCragGeo = new THREE.ConeGeometry(1.7, 2.4, 5);
  const bottomCragMesh = new THREE.Mesh(bottomCragGeo, mats.cliffCore);
  bottomCragMesh.position.set(0.15, -3.8, 0.15);
  bottomCragMesh.rotation.x = Math.PI;
  bottomCragMesh.rotation.y = 0.3;
  islandLandmass.add(bottomCragMesh);

  // Additional hanging crags / rock spires (5-segment cones)
  const spires = [
    { pos: [1.8, -1.8, 1.2], scale: [0.6, 1.6, 0.6], rot: [0.1, 0.3, 0.2] },
    { pos: [-2.0, -1.6, 1.4], scale: [0.7, 1.4, 0.7], rot: [-0.2, 0.6, -0.1] },
    { pos: [-1.4, -2.0, -1.8], scale: [0.8, 1.8, 0.8], rot: [0.15, 0.1, -0.2] },
    { pos: [2.2, -1.7, -1.5], scale: [0.65, 1.5, 0.65], rot: [-0.1, -0.3, 0.2] }
  ];
  spires.forEach(s => {
    const spireGeo = new THREE.ConeGeometry(0.8, 1.8, 5);
    const spireMesh = new THREE.Mesh(spireGeo, mats.cliffSpike);
    spireMesh.position.set(...s.pos);
    spireMesh.rotation.set(Math.PI + s.rot[0], s.rot[1], s.rot[2]);
    spireMesh.scale.set(...s.scale);
    islandLandmass.add(spireMesh);
  });

  dioramaGroup.add(islandLandmass);

  // -------------------------------------------------------------
  // B. LANDMARK 1: COZY WORKSHOP CABIN (ABOUT & EDUCATION)
  // -------------------------------------------------------------
  const cabinGroup = new THREE.Group();
  cabinGroup.position.set(-2.4, 1.15, -0.8);
  cabinGroup.rotation.y = 0.35;

  // Cabin Main Body (1x1x1 Box)
  const cabinBodyGeo = new THREE.BoxGeometry(1.9, 1.3, 1.5, 1, 1, 1);
  const cabinBody = new THREE.Mesh(cabinBodyGeo, mats.woodPlank);
  cabinBody.position.y = 0.65;
  cabinBody.castShadow = true;
  cabinBody.receiveShadow = true;
  cabinGroup.add(cabinBody);

  // Angled Timber Pyramid Roof (4-sided cone)
  const roofGeo = new THREE.ConeGeometry(1.6, 1.0, 4);
  const roof = new THREE.Mesh(roofGeo, mats.roofTile);
  roof.position.set(0, 1.8, 0);
  roof.rotation.y = Math.PI / 4;
  roof.scale.set(1.1, 1.0, 0.85);
  roof.castShadow = true;
  cabinGroup.add(roof);

  // Wooden Door (1x1x1 Box)
  const doorGeo = new THREE.BoxGeometry(0.42, 0.75, 0.06, 1, 1, 1);
  const door = new THREE.Mesh(doorGeo, mats.woodDark);
  door.position.set(0.2, 0.4, 0.78);
  cabinGroup.add(door);

  // Glowing Windows (1x1x1 Box)
  const winGeo = new THREE.BoxGeometry(0.32, 0.32, 0.06, 1, 1, 1);
  const winFront = new THREE.Mesh(winGeo, mats.windowGlow);
  winFront.position.set(-0.5, 0.72, 0.78);
  cabinGroup.add(winFront);

  const winSide = new THREE.Mesh(winGeo, mats.windowGlow);
  winSide.position.set(-0.98, 0.72, 0.1);
  winSide.rotation.y = Math.PI / 2;
  cabinGroup.add(winSide);

  // Stone Chimney (1x1x1 Box)
  const chimneyGeo = new THREE.BoxGeometry(0.42, 1.5, 0.42, 1, 1, 1);
  const chimney = new THREE.Mesh(chimneyGeo, mats.chimneyStone);
  chimney.position.set(-0.72, 1.35, -0.38);
  chimney.castShadow = true;
  cabinGroup.add(chimney);

  // Barrel by door (6-segment cylinder)
  const barrelGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.5, 6);
  const barrel = new THREE.Mesh(barrelGeo, mats.woodPlank);
  barrel.position.set(0.72, 0.25, 0.9);
  barrel.castShadow = true;
  cabinGroup.add(barrel);

  // Crate by door (1x1x1 Box)
  const crateGeo = new THREE.BoxGeometry(0.32, 0.32, 0.32, 1, 1, 1);
  const crate = new THREE.Mesh(crateGeo, mats.woodDark);
  crate.position.set(0.82, 0.16, 0.5);
  crate.castShadow = true;
  cabinGroup.add(crate);

  dioramaGroup.add(cabinGroup);

  // Register Cabin landmark for raycasting
  registerLandmark(cabinBody, {
    key: 'about',
    title: 'Cozy Workshop',
    subtitle: 'About & Education',
    icon: 'fa-house-chimney',
    focusPos: WAYPOINTS[1].pos,
    focusTarget: WAYPOINTS[1].target
  });

  // -------------------------------------------------------------
  // C. LANDMARK 2: STONE WIZARD TOWER (EXPERIENCE ROLL)
  // -------------------------------------------------------------
  const towerGroup = new THREE.Group();
  towerGroup.position.set(2.8, 1.18, -0.6);

  // Tower Base Hexagonal Cylinder (6 segments)
  const towerBaseGeo = new THREE.CylinderGeometry(1.0, 1.2, 3.0, 6);
  const towerBase = new THREE.Mesh(towerBaseGeo, mats.stoneTower);
  towerBase.position.y = 1.5;
  towerBase.castShadow = true;
  towerBase.receiveShadow = true;
  towerGroup.add(towerBase);

  // Stone belt ring (6 segments)
  const ringGeo = new THREE.CylinderGeometry(1.12, 1.12, 0.15, 6);
  const ring = new THREE.Mesh(ringGeo, mats.stoneTrim);
  ring.position.y = 1.5;
  towerGroup.add(ring);

  // Battlements / Crenellations (6 segments)
  const battlementsBase = new THREE.CylinderGeometry(1.18, 1.0, 0.4, 6);
  const battlements = new THREE.Mesh(battlementsBase, mats.stoneTrim);
  battlements.position.y = 3.2;
  battlements.castShadow = true;
  towerGroup.add(battlements);

  // Conical Purple Witch Roof (6-sided pyramid cone)
  const towerRoofGeo = new THREE.ConeGeometry(1.35, 2.1, 6);
  const towerRoof = new THREE.Mesh(towerRoofGeo, mats.towerRoof);
  towerRoof.position.y = 4.45;
  towerRoof.castShadow = true;
  towerGroup.add(towerRoof);

  // Golden Spire Sphere (Dodecahedron detail 0)
  const spireGeo = new THREE.DodecahedronGeometry(0.16, 0);
  const spire = new THREE.Mesh(spireGeo, mats.goldMetal);
  spire.position.y = 5.6;
  towerGroup.add(spire);

  // Tower Door (1x1x1 Box)
  const towerDoorGeo = new THREE.BoxGeometry(0.45, 0.8, 0.08, 1, 1, 1);
  const towerDoor = new THREE.Mesh(towerDoorGeo, mats.woodDark);
  towerDoor.position.set(0, 0.42, 1.1);
  towerGroup.add(towerDoor);

  // Glowing Arrow Slit (1x1x1 Box)
  const slitGeo = new THREE.BoxGeometry(0.14, 0.4, 0.08, 1, 1, 1);
  const slit = new THREE.Mesh(slitGeo, mats.windowGlow);
  slit.position.set(0, 2.2, 0.98);
  towerGroup.add(slit);

  dioramaGroup.add(towerGroup);

  // Register Tower landmark for raycasting
  registerLandmark(towerBase, {
    key: 'experience',
    title: 'Wizard Tower',
    subtitle: 'Experience Roll',
    icon: 'fa-chess-rook',
    focusPos: WAYPOINTS[2].pos,
    focusTarget: WAYPOINTS[2].target
  });

  // -------------------------------------------------------------
  // D. LANDMARK 3: TREASURE CHESTS (PROJECTS / QUESTS)
  // -------------------------------------------------------------
  const chestsGroup = new THREE.Group();
  chestsGroup.position.set(-1.1, 0.72, 1.4);

  // Chest 1: Open Glowing Treasure Chest (Chunky Box Primitives)
  const openChestGroup = new THREE.Group();
  openChestGroup.position.set(0, 0, 0);

  const chestBottomGeo = new THREE.BoxGeometry(0.68, 0.32, 0.48, 1, 1, 1);
  const chestBottom = new THREE.Mesh(chestBottomGeo, mats.goldMetal);
  chestBottom.position.y = 0.16;
  chestBottom.castShadow = true;
  openChestGroup.add(chestBottom);

  // Chest rim trim
  const chestTrimGeo = new THREE.BoxGeometry(0.70, 0.06, 0.50, 1, 1, 1);
  const chestTrim = new THREE.Mesh(chestTrimGeo, mats.woodDark);
  chestTrim.position.y = 0.16;
  openChestGroup.add(chestTrim);

  // Open tilted lid (1x1x1 box angled upward)
  const chestLidGeo = new THREE.BoxGeometry(0.68, 0.08, 0.48, 1, 1, 1);
  const chestLid = new THREE.Mesh(chestLidGeo, mats.woodDark);
  chestLid.position.set(0, 0.44, -0.16);
  chestLid.rotation.x = -Math.PI / 3;
  chestLid.castShadow = true;
  openChestGroup.add(chestLid);

  // Faceted gold & gems inside (Dodecahedron detail 0)
  const goldInsideGeo = new THREE.DodecahedronGeometry(0.16, 0);
  const goldInside = new THREE.Mesh(goldInsideGeo, mats.goldMetal);
  goldInside.position.set(-0.06, 0.28, 0.04);
  openChestGroup.add(goldInside);

  const gemInsideGeo = new THREE.DodecahedronGeometry(0.09, 0);
  const gemInside = new THREE.Mesh(gemInsideGeo, mats.staffGem);
  gemInside.position.set(0.12, 0.29, 0.05);
  openChestGroup.add(gemInside);

  chestsGroup.add(openChestGroup);

  // Chest 2: Closed Chest beside it
  const closedChestGeo = new THREE.BoxGeometry(0.52, 0.38, 0.42, 1, 1, 1);
  const closedChest = new THREE.Mesh(closedChestGeo, mats.woodPlank);
  closedChest.position.set(-0.82, 0.19, -0.1);
  closedChest.rotation.y = 0.35;
  closedChest.castShadow = true;
  chestsGroup.add(closedChest);

  const closedChestTrimGeo = new THREE.BoxGeometry(0.54, 0.06, 0.44, 1, 1, 1);
  const closedChestTrim = new THREE.Mesh(closedChestTrimGeo, mats.goldMetal);
  closedChestTrim.position.set(-0.82, 0.19, -0.1);
  closedChestTrim.rotation.y = 0.35;
  chestsGroup.add(closedChestTrim);

  dioramaGroup.add(chestsGroup);

  // Register Chest landmark for raycasting
  registerLandmark(chestBottom, {
    key: 'projects',
    title: 'Treasure Vault',
    subtitle: 'Projects & Quests',
    icon: 'fa-gem',
    focusPos: WAYPOINTS[3].pos,
    focusTarget: WAYPOINTS[3].target
  });

  // -------------------------------------------------------------
  // E. LANDMARK 4: CAMPFIRE (SKILLS & MASTERIES)
  // -------------------------------------------------------------
  const campfireGroup = new THREE.Group();
  campfireGroup.position.set(0.05, 0.72, 0.4);

  // Stone ring around fire (7 faceted rocks of Dodecahedron detail 0)
  const stoneCount = 7;
  for (let i = 0; i < stoneCount; i++) {
    const angle = (i / stoneCount) * Math.PI * 2;
    const stoneGeo = new THREE.DodecahedronGeometry(0.11, 0);
    const stoneMesh = new THREE.Mesh(stoneGeo, mats.stoneTrim);
    stoneMesh.position.set(Math.cos(angle) * 0.52, 0.07, Math.sin(angle) * 0.52);
    stoneMesh.rotation.set(Math.random(), Math.random(), Math.random());
    campfireGroup.add(stoneMesh);
  }

  // Crossed wooden logs (5-segment cylinders)
  const logGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.7, 5);
  const log1 = new THREE.Mesh(logGeo, mats.woodDark);
  log1.rotation.z = Math.PI / 3;
  log1.rotation.y = 0.4;
  log1.position.y = 0.09;
  campfireGroup.add(log1);

  const log2 = new THREE.Mesh(logGeo, mats.woodDark);
  log2.rotation.z = -Math.PI / 3;
  log2.rotation.y = -0.4;
  log2.position.y = 0.09;
  campfireGroup.add(log2);

  // Stylized Low-Poly Fire Flames (5-sided cones)
  const fireGeo1 = new THREE.ConeGeometry(0.22, 0.5, 5);
  const fireFlame1 = new THREE.Mesh(fireGeo1, mats.fireOrange);
  fireFlame1.position.set(0, 0.3, 0);
  campfireGroup.add(fireFlame1);

  const fireGeo2 = new THREE.ConeGeometry(0.14, 0.36, 5);
  const fireFlame2 = new THREE.Mesh(fireGeo2, mats.fireYellow);
  fireFlame2.position.set(0.04, 0.34, 0.02);
  campfireGroup.add(fireFlame2);

  dioramaGroup.add(campfireGroup);

  // Register Campfire landmark for raycasting
  registerLandmark(fireFlame1, {
    key: 'skills',
    title: "Adventurer's Campfire",
    subtitle: 'Skills & Masteries',
    icon: 'fa-fire',
    focusPos: WAYPOINTS[4].pos,
    focusTarget: WAYPOINTS[4].target
  });

  // -------------------------------------------------------------
  // F. LANDMARK 5: WATERFALL & STREAM (CONTACT & CASCADE)
  // -------------------------------------------------------------
  const waterGroup = new THREE.Group();

  // Mountain Pool Origin (6-segment hexagonal pool)
  const poolGeo = new THREE.CylinderGeometry(0.7, 0.65, 0.12, 6);
  const poolMesh = new THREE.Mesh(poolGeo, mats.water);
  poolMesh.position.set(0.8, 1.25, -1.8);
  waterGroup.add(poolMesh);

  // Angular, faceted stream segments running across island
  const streamSteps = [
    { pos: [1.05, 0.98, -1.1], size: [0.45, 0.08, 0.85], rot: 0.3 },
    { pos: [1.35, 0.84, -0.3], size: [0.45, 0.08, 0.9], rot: 0.4 },
    { pos: [1.8, 0.78, 0.55], size: [0.5, 0.08, 0.95], rot: 0.5 },
    { pos: [2.3, 0.76, 1.45], size: [0.55, 0.08, 1.05], rot: 0.55 }
  ];
  streamSteps.forEach(s => {
    const geo = new THREE.BoxGeometry(s.size[0], s.size[1], s.size[2], 1, 1, 1);
    const m = new THREE.Mesh(geo, mats.water);
    m.position.set(...s.pos);
    m.rotation.y = s.rot;
    waterGroup.add(m);
  });

  // Cascading Waterfall off the cliff into the void (Low-poly flat plane)
  const fallGeo = new THREE.PlaneGeometry(0.85, 4.6, 1, 2);
  const waterfallMesh = new THREE.Mesh(fallGeo, mats.water);
  waterfallMesh.position.set(2.45, -1.2, 2.05);
  waterfallMesh.rotation.y = -0.45;
  waterfallMesh.rotation.x = 0.12;
  waterGroup.add(waterfallMesh);

  dioramaGroup.add(waterGroup);

  // Register Waterfall landmark for raycasting
  registerLandmark(waterfallMesh, {
    key: 'contact',
    title: 'Crystal Cascade',
    subtitle: 'Contact & Inquiries',
    icon: 'fa-water',
    focusPos: WAYPOINTS[5].pos,
    focusTarget: WAYPOINTS[5].target
  });

  // -------------------------------------------------------------
  // G. ULTRA LOW-POLY CHARACTERS
  // -------------------------------------------------------------
  // Mini Wizard near Campfire
  const miniWizard = createMiniCharacter(mats, {
    isWizard: true
  });
  miniWizard.position.set(-0.6, 0.72, 0.65);
  miniWizard.rotation.y = 0.7;
  miniWizard.scale.setScalar(0.75);
  dioramaGroup.add(miniWizard);

  // Mini Knight near Campfire
  const miniKnight = createMiniCharacter(mats, {
    isKnight: true
  });
  miniKnight.position.set(0.75, 0.72, 0.6);
  miniKnight.rotation.y = -0.8;
  miniKnight.scale.setScalar(0.75);
  dioramaGroup.add(miniKnight);

  // -------------------------------------------------------------
  // H. ULTRA LOW-POLY FOLIAGE, TREES & BOULDERS
  // -------------------------------------------------------------
  // Pine Trees (5-segment cones)
  const pineLocations = [
    { pos: [1.6, 1.2, -1.8], scale: 1.1 },
    { pos: [3.8, 0.8, -1.4], scale: 0.9 },
    { pos: [3.2, 0.75, 0.8], scale: 1.0 },
    { pos: [-3.8, 0.5, 0.6], scale: 0.85 }
  ];
  pineLocations.forEach(p => {
    const pine = createPineTree(mats);
    pine.position.set(...p.pos);
    pine.scale.setScalar(p.scale);
    dioramaGroup.add(pine);
  });

  // Deciduous Oak Trees (Detail 0 Dodecahedron faceted crowns)
  const oakLocations = [
    { pos: [-1.8, 1.2, -2.4], scale: 1.25 },
    { pos: [-3.6, 0.6, -1.2], scale: 1.1 },
    { pos: [0.2, 0.9, -2.5], scale: 1.0 }
  ];
  oakLocations.forEach(o => {
    const oak = createOakTree(mats);
    oak.position.set(...o.pos);
    oak.scale.setScalar(o.scale);
    dioramaGroup.add(oak);
  });

  // Scatter decorative low-poly boulders & flower blooms
  createScatterDetails(mats);
}

/**
 * Creates ultra low-poly pine tree using 5-sided cones and cylinder
 */
function createPineTree(mats) {
  const tree = new THREE.Group();
  const trunkGeo = new THREE.CylinderGeometry(0.1, 0.14, 0.75, 5);
  const trunk = new THREE.Mesh(trunkGeo, mats.woodDark);
  trunk.position.y = 0.38;
  trunk.castShadow = true;
  tree.add(trunk);

  // Tiered foliage cones (5 segments each)
  const cone1 = new THREE.Mesh(new THREE.ConeGeometry(0.85, 0.9, 5), mats.pineFoliage);
  cone1.position.y = 0.95;
  cone1.castShadow = true;
  tree.add(cone1);

  const cone2 = new THREE.Mesh(new THREE.ConeGeometry(0.68, 0.78, 5), mats.pineFoliageLight);
  cone2.position.y = 1.45;
  cone2.castShadow = true;
  tree.add(cone2);

  const cone3 = new THREE.Mesh(new THREE.ConeGeometry(0.48, 0.65, 5), mats.pineFoliage);
  cone3.position.y = 1.88;
  cone3.castShadow = true;
  tree.add(cone3);

  return tree;
}

/**
 * Creates ultra low-poly deciduous oak tree with detail 0 Dodecahedron crowns
 */
function createOakTree(mats) {
  const tree = new THREE.Group();
  const trunkGeo = new THREE.CylinderGeometry(0.16, 0.22, 1.1, 5);
  const trunk = new THREE.Mesh(trunkGeo, mats.woodPlank);
  trunk.position.y = 0.55;
  trunk.castShadow = true;
  tree.add(trunk);

  // Faceted clustered leaf canopy (detail 0)
  const canopy1 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.8, 0), mats.deciduousFoliage);
  canopy1.position.set(0, 1.5, 0);
  canopy1.castShadow = true;
  tree.add(canopy1);

  const canopy2 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.6, 0), mats.deciduousDark);
  canopy2.position.set(0.4, 1.35, 0.25);
  canopy2.castShadow = true;
  tree.add(canopy2);

  const canopy3 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.55, 0), mats.deciduousFoliage);
  canopy3.position.set(-0.35, 1.3, -0.2);
  canopy3.castShadow = true;
  tree.add(canopy3);

  return tree;
}

/**
 * Creates ultra low-poly miniature character
 */
function createMiniCharacter(mats, opts = {}) {
  const char = new THREE.Group();

  // Head (Faceted Dodecahedron detail 0)
  const headGeo = new THREE.DodecahedronGeometry(0.16, 0);
  const head = new THREE.Mesh(headGeo, mats.skin);
  head.position.y = 0.74;
  head.castShadow = true;
  char.add(head);

  if (opts.isKnight) {
    // Body (5-segment cylinder armor)
    const bodyGeo = new THREE.CylinderGeometry(0.18, 0.3, 0.6, 5);
    const body = new THREE.Mesh(bodyGeo, mats.knightArmor);
    body.position.y = 0.3;
    body.castShadow = true;
    char.add(body);

    // Silver bucket helm (5-segment cylinder)
    const helmGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.28, 5);
    const helm = new THREE.Mesh(helmGeo, mats.knightArmor);
    helm.position.y = 0.78;
    helm.castShadow = true;
    char.add(helm);

    // Cape (1x1x1 Box)
    const capeGeo = new THREE.BoxGeometry(0.32, 0.5, 0.05, 1, 1, 1);
    const cape = new THREE.Mesh(capeGeo, mats.knightCape);
    cape.position.set(0, 0.38, -0.2);
    char.add(cape);
  } else {
    // Wizard Robe (5-segment cylinder)
    const bodyGeo = new THREE.CylinderGeometry(0.18, 0.3, 0.6, 5);
    const body = new THREE.Mesh(bodyGeo, mats.wizardRobe);
    body.position.y = 0.3;
    body.castShadow = true;
    char.add(body);

    // Conical Hat (5-sided cone)
    const hatGeo = new THREE.ConeGeometry(0.3, 0.6, 5);
    const hat = new THREE.Mesh(hatGeo, mats.wizardHat);
    hat.position.y = 1.1;
    hat.castShadow = true;
    char.add(hat);

    // White Beard (4-sided cone)
    const beardGeo = new THREE.ConeGeometry(0.15, 0.28, 4);
    const beard = new THREE.Mesh(beardGeo, mats.beardWhite);
    beard.position.set(0, 0.62, 0.14);
    beard.rotation.x = 0.3;
    char.add(beard);

    // Staff & Gem
    const staffGeo = new THREE.CylinderGeometry(0.025, 0.025, 1.1, 5);
    const staff = new THREE.Mesh(staffGeo, mats.staffWood);
    staff.position.set(0.32, 0.55, 0.12);
    staff.rotation.z = -0.15;
    char.add(staff);

    const gemGeo = new THREE.DodecahedronGeometry(0.07, 0);
    const gem = new THREE.Mesh(gemGeo, mats.staffGem);
    gem.position.set(0.41, 1.1, 0.12);
    char.add(gem);
  }

  return char;
}

/**
 * Scatter low-poly boulders and colorful blooms
 */
function createScatterDetails(mats) {
  const flowerMats = [
    new THREE.MeshStandardMaterial({ color: 0xFFFFFF, flatShading: true, roughness: 0.85, metalness: 0.05 }),
    new THREE.MeshStandardMaterial({ color: 0xFFD166, flatShading: true, roughness: 0.85, metalness: 0.05 }),
    new THREE.MeshStandardMaterial({ color: 0xFF6B6B, flatShading: true, roughness: 0.85, metalness: 0.05 }),
    new THREE.MeshStandardMaterial({ color: 0x7B2CBF, flatShading: true, roughness: 0.85, metalness: 0.05 })
  ];

  // Faceted Boulders (Dodecahedron detail 0)
  const rocks = [
    { pos: [0.6, 0.78, 1.2], scale: 0.26 },
    { pos: [-2.2, 0.75, 1.8], scale: 0.32 },
    { pos: [2.1, 0.8, -1.8], scale: 0.36 },
    { pos: [-0.6, 0.8, -1.2], scale: 0.2 }
  ];
  rocks.forEach(r => {
    const geo = new THREE.DodecahedronGeometry(r.scale, 0);
    const m = new THREE.Mesh(geo, mats.stoneTrim);
    m.position.set(...r.pos);
    m.rotation.set(Math.random(), Math.random(), Math.random());
    m.castShadow = true;
    m.receiveShadow = true;
    dioramaGroup.add(m);
  });

  // Low-poly flower blooms (4-sided cone)
  for (let i = 0; i < 20; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 0.85 + Math.random() * 2.7;
    const x = Math.cos(angle) * dist;
    const z = Math.sin(angle) * dist;
    if (Math.hypot(x, z) < 0.8) continue;

    const fGeo = new THREE.ConeGeometry(0.06, 0.09, 4);
    const fMat = flowerMats[i % flowerMats.length];
    const flower = new THREE.Mesh(fGeo, fMat);
    flower.position.set(x, 0.73, z);
    flower.rotation.y = Math.random() * Math.PI;
    dioramaGroup.add(flower);
  }
}

/**
 * Register a mesh as an interactive landmark
 */
function registerLandmark(mesh, data) {
  mesh.userData.isLandmark = true;
  mesh.userData.landmarkData = data;
  interactiveLandmarks.push(mesh);
}

/* ============================================================================
   7. PARTICLE SYSTEMS (SMOKE, EMBERS, WATER MIST & FIREFLIES)
   ============================================================================ */
function initParticles() {
  particlesGroup.clear();
  smokeParticles = [];
  emberParticles = [];
  waterParticles = [];
  fireflyParticles = [];

  // A. Chimney Smoke Particles (Detail 0 Dodecahedrons)
  const smokeGeo = new THREE.DodecahedronGeometry(0.11, 0);
  const smokeMat = new THREE.MeshStandardMaterial({
    color: 0xF8F9FA,
    transparent: true,
    opacity: 0.55,
    roughness: 0.85,
    metalness: 0.05,
    flatShading: true
  });
  for (let i = 0; i < 8; i++) {
    const mesh = new THREE.Mesh(smokeGeo, smokeMat.clone());
    mesh.position.set(-3.05, 2.65 + i * 0.22, -1.15);
    particlesGroup.add(mesh);
    smokeParticles.push({
      mesh,
      baseX: -3.05,
      baseY: 2.65,
      baseZ: -1.15,
      offset: i * 0.4,
      speed: 0.8 + Math.random() * 0.4
    });
  }

  // B. Campfire Ember Particles (BoxGeometry 1x1x1)
  const emberGeo = new THREE.BoxGeometry(0.035, 0.035, 0.035, 1, 1, 1);
  const emberMat = new THREE.MeshBasicMaterial({ color: 0xFF6B35, transparent: true, opacity: 0.85 });
  for (let i = 0; i < 12; i++) {
    const mesh = new THREE.Mesh(emberGeo, emberMat);
    particlesGroup.add(mesh);
    emberParticles.push({
      mesh,
      x: (Math.random() - 0.5) * 0.35 + 0.05,
      y: 0.8 + Math.random() * 1.5,
      z: (Math.random() - 0.5) * 0.35 + 0.4,
      speed: 0.6 + Math.random() * 0.8,
      wobble: Math.random() * Math.PI * 2
    });
  }

  // C. Waterfall Splash Mist Particles (Detail 0 Dodecahedrons)
  const mistGeo = new THREE.DodecahedronGeometry(0.09, 0);
  const mistMat = new THREE.MeshBasicMaterial({ color: 0x4CC9F0, transparent: true, opacity: 0.6 });
  for (let i = 0; i < 15; i++) {
    const mesh = new THREE.Mesh(mistGeo, mistMat);
    particlesGroup.add(mesh);
    waterParticles.push({
      mesh,
      x: 2.45 + (Math.random() - 0.5) * 0.45,
      y: -2.8 + Math.random() * 1.6,
      z: 2.05 + (Math.random() - 0.5) * 0.45,
      vy: 0.4 + Math.random() * 0.6,
      phase: Math.random() * Math.PI * 2
    });
  }

  // D. Ambient Magical Fireflies (Detail 0 Dodecahedrons)
  const fireflyGeo = new THREE.DodecahedronGeometry(0.05, 0);
  const fireflyColors = [0xFFD166, 0x4CC9F0, 0x6BCB4B, 0xFF6B6B];
  for (let i = 0; i < 30; i++) {
    const mat = new THREE.MeshBasicMaterial({
      color: fireflyColors[i % fireflyColors.length],
      transparent: true,
      opacity: 0.75
    });
    const mesh = new THREE.Mesh(fireflyGeo, mat);
    particlesGroup.add(mesh);
    fireflyParticles.push({
      mesh,
      radius: 3.5 + Math.random() * 4.2,
      angle: Math.random() * Math.PI * 2,
      speed: (Math.random() - 0.5) * 0.35,
      height: -0.5 + Math.random() * 4.5,
      pulse: Math.random() * Math.PI * 2
    });
  }
}

function updateParticles(delta, time) {
  // Update Chimney Smoke
  smokeParticles.forEach((p) => {
    const t = (time * p.speed + p.offset) % 3.0;
    p.mesh.position.y = p.baseY + t * 0.8;
    p.mesh.position.x = p.baseX + Math.sin(t * 3.0) * 0.15;
    p.mesh.position.z = p.baseZ + Math.cos(t * 2.5) * 0.15;
    const progress = t / 3.0;
    const scale = 0.5 + progress * 1.5;
    p.mesh.scale.setScalar(scale);
    p.mesh.material.opacity = Math.max(0, 0.6 * (1.0 - progress));
  });

  // Update Campfire Embers & Light Flicker
  emberParticles.forEach((e) => {
    e.y += delta * e.speed;
    e.wobble += delta * 4;
    if (e.y > 2.6) {
      e.y = 0.8 + Math.random() * 0.2;
      e.x = (Math.random() - 0.5) * 0.35 + 0.05;
      e.z = (Math.random() - 0.5) * 0.35 + 0.4;
    }
    e.mesh.position.set(e.x + Math.sin(e.wobble) * 0.08, e.y, e.z + Math.cos(e.wobble) * 0.08);
    const alpha = 1.0 - ((e.y - 0.8) / 1.8);
    e.mesh.material.opacity = Math.max(0, alpha * 0.85);
  });

  if (campfireLight) {
    campfireLight.intensity = 2.4 + Math.sin(time * 12) * 0.4 + Math.cos(time * 23) * 0.3;
  }

  // Update Waterfall Splash Mist
  waterParticles.forEach((w) => {
    w.phase += delta * 3.5;
    w.mesh.position.y += delta * w.vy;
    w.mesh.position.x = w.x + Math.sin(w.phase) * 0.12;
    w.mesh.position.z = w.z + Math.cos(w.phase) * 0.12;
    if (w.mesh.position.y > -1.2) {
      w.mesh.position.y = -3.2 + Math.random() * 0.4;
    }
    const fade = (-1.2 - w.mesh.position.y) / 2.0;
    w.mesh.material.opacity = Math.max(0, Math.min(0.7, fade));
  });

  // Update Ambient Fireflies
  fireflyParticles.forEach((f) => {
    f.angle += delta * f.speed;
    f.pulse += delta * 3;
    f.mesh.position.x = Math.cos(f.angle) * f.radius;
    f.mesh.position.z = Math.sin(f.angle) * f.radius;
    f.mesh.position.y = f.height + Math.sin(f.pulse) * 0.35;
    f.mesh.material.opacity = 0.3 + (Math.sin(f.pulse) + 1) * 0.35;
  });
}

/* ============================================================================
   8. INTERACTION & RAYCASTING
   ============================================================================ */
function initEventListeners() {
  window.addEventListener('resize', onWindowResize);
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('click', onPointerClick);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}

function onPointerMove(e) {
  mouseScreen.x = e.clientX;
  mouseScreen.y = e.clientY;
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

  // Parallax target (-0.4 to +0.4 units)
  targetParallax.x = mouse.x * 0.45;
  targetParallax.y = mouse.y * 0.25;

  // Perform Raycasting on landmarks
  checkRaycastHover();
}

function checkRaycastHover() {
  if (isUserInteractingWithControls || interactiveLandmarks.length === 0) {
    clearHoverHighlight();
    hideTooltip();
    return;
  }

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(interactiveLandmarks, true);

  if (intersects.length > 0) {
    let target = intersects[0].object;
    while (target && !target.userData.isLandmark && target.parent) {
      target = target.parent;
    }

    if (target && target.userData.isLandmark) {
      const data = target.userData.landmarkData;
      if (currentHoveredLandmark !== target) {
        clearHoverHighlight();
        currentHoveredLandmark = target;
        applyHoverHighlight(target);
        document.body.style.cursor = 'pointer';
        playProceduralAudio('hover');
      }
      showTooltip(data, intersects[0].point);
      return;
    }
  }

  if (currentHoveredLandmark) {
    clearHoverHighlight();
    document.body.style.cursor = 'default';
    hideTooltip();
  }
}

function applyHoverHighlight(obj) {
  obj.traverse((child) => {
    if (child.isMesh && child.material && child.material.emissive) {
      if (!child.userData.origEmissive) {
        child.userData.origEmissive = child.material.emissive.clone();
      }
      child.material.emissive.set(0x283820);
    }
  });
}

function clearHoverHighlight() {
  if (currentHoveredLandmark) {
    currentHoveredLandmark.traverse((child) => {
      if (child.isMesh && child.material && child.material.emissive && child.userData.origEmissive) {
        child.material.emissive.copy(child.userData.origEmissive);
      }
    });
    currentHoveredLandmark = null;
  }
}

function onPointerClick(e) {
  // If clicked inside an interactive button, modal, or UI, let that handle it
  if (e.target.closest('button') || e.target.closest('#rpg-modal') || e.target.closest('#mascot-container')) {
    return;
  }

  // Resume audio context if suspended (browser autoplay policy)
  ensureAudioContext();

  // If clicked on 3D landmark, trigger navigation and open modal
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(interactiveLandmarks, true);
  if (intersects.length > 0) {
    let target = intersects[0].object;
    while (target && !target.userData.isLandmark && target.parent) {
      target = target.parent;
    }
    if (target && target.userData.isLandmark) {
      const data = target.userData.landmarkData;
      playProceduralAudio('click');
      flyCameraToLandmark(data.focusPos, data.focusTarget, () => {
        openModal(data.key);
      });
    }
  }
}

function showTooltip(data, worldPos) {
  const tooltip = document.getElementById('rpg-tooltip');
  const iconEl = document.getElementById('tooltip-icon');
  const textEl = document.getElementById('tooltip-text');
  if (!tooltip || !iconEl || !textEl) return;

  // Project 3D coordinate to 2D screen coordinate
  const pos = worldPos.clone().project(camera);
  const screenX = (pos.x * 0.5 + 0.5) * window.innerWidth;
  const screenY = (-(pos.y * 0.5) + 0.5) * window.innerHeight;

  iconEl.innerHTML = `<i class="fa-solid ${data.icon}"></i>`;
  textEl.textContent = data.title;
  tooltip.style.left = `${screenX}px`;
  tooltip.style.top = `${screenY - 14}px`;
  tooltip.classList.remove('rpg-tooltip-hidden');
}

function hideTooltip() {
  const tooltip = document.getElementById('rpg-tooltip');
  if (tooltip) tooltip.classList.add('rpg-tooltip-hidden');
}

/* ============================================================================
   9. SCROLL CHOREOGRAPHY & WAYPOINT LERP
   ============================================================================ */
function onScroll() {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  if (maxScroll <= 0) return;
  scrollProgress = Math.min(1.0, Math.max(0.0, window.scrollY / maxScroll));
  updateActiveWaypointPill();
}

function updateActiveWaypointPill() {
  const pills = document.querySelectorAll('.waypoint-pill');
  if (!pills.length) return;

  let activeIndex = 0;
  if (scrollProgress >= 0.90) activeIndex = 5;
  else if (scrollProgress >= 0.75) activeIndex = 4;
  else if (scrollProgress >= 0.55) activeIndex = 3;
  else if (scrollProgress >= 0.32) activeIndex = 2;
  else if (scrollProgress >= 0.10) activeIndex = 1;

  pills.forEach((p, idx) => {
    p.classList.toggle('active', idx === activeIndex);
  });
}

/**
 * Calculates smoothly interpolated camera position & target between waypoints
 */
function interpolateWaypoints(progress) {
  let segStart = WAYPOINTS[0];
  let segEnd = WAYPOINTS[WAYPOINTS.length - 1];

  for (let i = 0; i < WAYPOINTS.length - 1; i++) {
    if (progress >= WAYPOINTS[i].progress && progress <= WAYPOINTS[i + 1].progress) {
      segStart = WAYPOINTS[i];
      segEnd = WAYPOINTS[i + 1];
      break;
    }
  }

  const range = segEnd.progress - segStart.progress;
  const localT = range > 0 ? (progress - segStart.progress) / range : 0;
  // Smooth cubic easeInOut
  const smoothT = localT * localT * (3 - 2 * localT);

  const desiredPos = new THREE.Vector3().lerpVectors(segStart.pos, segEnd.pos, smoothT);
  const desiredTarget = new THREE.Vector3().lerpVectors(segStart.target, segEnd.target, smoothT);

  return { pos: desiredPos, target: desiredTarget };
}

/**
 * Programmatically scrolls window or flies camera to target
 */
function flyCameraToLandmark(focusPos, focusTarget, callback) {
  isUserInteractingWithControls = true;
  const startPos = camera.position.clone();
  const startTarget = controls.target.clone();
  const startTime = performance.now();
  const duration = 1200; // ms

  function step(now) {
    const elapsed = now - startTime;
    const t = Math.min(1.0, elapsed / duration);
    const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    camera.position.lerpVectors(startPos, focusPos, ease);
    controls.target.lerpVectors(startTarget, focusTarget, ease);
    controls.update();

    if (t < 1.0) {
      requestAnimationFrame(step);
    } else {
      isUserInteractingWithControls = false;
      if (callback) callback();
    }
  }
  requestAnimationFrame(step);
}

/* ============================================================================
   10. UI CONTROLS, MODALS & EVENT HANDLERS
   ============================================================================ */
function initUI() {
  // Global Action Buttons (Banners, Signboards, Mouse Indicator, Center Sign)
  document.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const action = btn.getAttribute('data-action');
      handleAction(action);
    });
  });

  // Audio Toggle Banner
  const audioBtn = document.getElementById('audio-toggle-btn');
  if (audioBtn) {
    audioBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleAudio();
    });
  }

  // Waypoint Pill Bar
  document.querySelectorAll('.waypoint-pill').forEach(pill => {
    pill.addEventListener('click', (e) => {
      e.stopPropagation();
      const step = parseInt(pill.getAttribute('data-step'), 10);
      scrollToWaypointIndex(step);
    });
  });

  // Modal Close & Backdrop Click
  const closeBtn = document.getElementById('modal-close-btn');
  const backdrop = document.getElementById('rpg-modal-backdrop');
  const ackBtn = document.getElementById('modal-action-btn');

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (ackBtn) ackBtn.addEventListener('click', closeModal);
  if (backdrop) {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeModal();
    });
  }

  // Keyboard accessibility
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });
}

function handleAction(action) {
  playProceduralAudio('click');
  ensureAudioContext();

  switch (action) {
    case 'projects':
      scrollToProgress(0.70);
      openModal('projects');
      break;
    case 'experience':
      scrollToProgress(0.45);
      openModal('experience');
      break;
    case 'skills':
      scrollToProgress(0.88);
      openModal('skills');
      break;
    case 'about':
      scrollToProgress(0.20);
      openModal('about');
      break;
    case 'contact':
      scrollToProgress(1.00);
      openModal('contact');
      break;
    case 'resume':
      openModal('resume');
      break;
    case 'explore':
      smoothScrollNext();
      break;
    default:
      console.log("Unhandled action:", action);
  }
}

function scrollToProgress(targetProgress) {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  window.scrollTo({
    top: targetProgress * maxScroll,
    behavior: 'smooth'
  });
}

function scrollToWaypointIndex(index) {
  if (index >= 0 && index < WAYPOINTS.length) {
    scrollToProgress(WAYPOINTS[index].progress);
  }
}

function smoothScrollNext() {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const currentY = window.scrollY;
  const step = window.innerHeight * 0.9;
  window.scrollTo({
    top: Math.min(maxScroll, currentY + step),
    behavior: 'smooth'
  });
}

/* ============================================================================
   11. RPG PARCHMENT MODAL INJECTION SYSTEM
   ============================================================================ */
function openModal(type) {
  const backdrop = document.getElementById('rpg-modal-backdrop');
  const titleEl = document.getElementById('modal-title');
  const contentEl = document.getElementById('modal-body-content');
  if (!backdrop || !titleEl || !contentEl || !cvData) return;

  contentEl.innerHTML = '';

  switch (type) {
    case 'about':
      titleEl.textContent = 'ABOUT & EDUCATION';
      renderAboutModal(contentEl);
      break;
    case 'experience':
      titleEl.textContent = 'EXPERIENCE ROLL';
      renderExperienceModal(contentEl);
      break;
    case 'projects':
      titleEl.textContent = 'QUESTS & ARTIFACTS';
      renderProjectsModal(contentEl);
      break;
    case 'skills':
      titleEl.textContent = 'SKILLS & MASTERIES';
      renderSkillsModal(contentEl);
      break;
    case 'contact':
      titleEl.textContent = 'MESSENGER RAVEN';
      renderContactModal(contentEl);
      break;
    case 'resume':
      titleEl.textContent = 'ROYAL CURRICULUM VITAE';
      renderResumeModal(contentEl);
      break;
  }

  backdrop.classList.remove('modal-backdrop-hidden');
  document.body.style.overflow = 'hidden';
  playProceduralAudio('scrollOpen');
}

function closeModal() {
  const backdrop = document.getElementById('rpg-modal-backdrop');
  if (backdrop) {
    backdrop.classList.add('modal-backdrop-hidden');
    document.body.style.overflow = '';
    playProceduralAudio('click');
  }
}

function renderAboutModal(container) {
  const { profile, education } = cvData;
  container.innerHTML = `
    <div class="profile-hero-card">
      <div class="profile-avatar-box">
        ${profile.avatarPath ? `<img src="${profile.avatarPath}" alt="${profile.fullName}">` : `<i class="fa-solid fa-hat-wizard avatar-placeholder"></i>`}
      </div>
      <div class="profile-info-box">
        <h3>${profile.fullName}</h3>
        <div class="profile-role">${profile.subHeadline || profile.headline}</div>
        <div class="profile-meta">
          <span><i class="fa-solid fa-location-dot"></i> ${profile.location}</span>
          <span><i class="fa-solid fa-language"></i> ${profile.languages.join(', ')}</span>
        </div>
      </div>
    </div>

    <h4 class="parchment-section-title"><i class="fa-solid fa-scroll"></i> Bio & Mission</h4>
    <p class="bio-paragraph">${profile.bio}</p>

    <h4 class="parchment-section-title"><i class="fa-solid fa-graduation-cap"></i> Academic Training</h4>
    <div class="timeline-container">
      ${education.map(edu => `
        <div class="timeline-card">
          <div class="timeline-header">
            <span class="timeline-title">${edu.degree}</span>
            <span class="timeline-period">${edu.period}</span>
          </div>
          <div class="timeline-institution">${edu.institution}</div>
          <div class="timeline-description">${edu.details}</div>
        </div>
      `).join('')}
    </div>

    <h4 class="parchment-section-title" style="margin-top: 20px;"><i class="fa-solid fa-gamepad"></i> Hobbies & Interests</h4>
    <div class="tag-list">
      ${profile.hobbies.map(h => `<span class="tag-badge"><i class="fa-solid fa-sparkles"></i> ${h}</span>`).join('')}
    </div>
  `;
}

function renderExperienceModal(container) {
  const { experienceRoll } = cvData;
  container.innerHTML = `
    <p class="bio-paragraph" style="margin-bottom: 20px;">
      A chronicle of leadership, engineering discipline, and hands-on operational excellence across academia and industry.
    </p>
    <div class="timeline-container">
      ${experienceRoll.map(exp => `
        <div class="timeline-card">
          <div class="timeline-header">
            <span class="timeline-title">${exp.role}</span>
            <span class="timeline-period">${exp.period}</span>
          </div>
          <div class="timeline-institution">${exp.company} &bull; ${exp.location}</div>
          <p class="timeline-description">${exp.description}</p>
          <div class="tag-list">
            ${exp.tags.map(t => `<span class="tag-badge">${t}</span>`).join('')}
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderProjectsModal(container) {
  const { projects } = cvData;
  container.innerHTML = `
    <p class="bio-paragraph" style="margin-bottom: 20px;">
      Interactive creations, games, tools, and technical prototypes. Select any artifact to inspect code or launch live builds.
    </p>
    <div class="projects-grid">
      ${projects.map(p => `
        <div class="project-card">
          <div class="project-thumb">
            ${p.thumbnailPath ? `<img src="${p.thumbnailPath}" alt="${p.title}">` : `<i class="fa-solid fa-dice-d20"></i>`}
            <span class="project-category-badge">${p.category}</span>
          </div>
          <div class="project-details">
            <h4 class="project-title">${p.title}</h4>
            <p class="project-desc">${p.description}</p>
            <div class="tag-list" style="margin-bottom: 12px;">
              ${p.techStack.map(t => `<span class="tag-badge">${t}</span>`).join('')}
            </div>
            <div class="project-actions">
              ${p.liveDemoUrl ? `<a href="${p.liveDemoUrl}" target="_blank" rel="noopener noreferrer" class="btn-project-action btn-project-demo"><i class="fa-solid fa-play"></i> Play Demo</a>` : ''}
              ${p.githubRepoUrl ? `<a href="${p.githubRepoUrl}" target="_blank" rel="noopener noreferrer" class="btn-project-action btn-project-code"><i class="fa-brands fa-github"></i> Source</a>` : ''}
              ${!p.liveDemoUrl && !p.githubRepoUrl ? `<span class="tag-badge" style="text-align:center;width:100%;"><i class="fa-solid fa-clock"></i> In Development</span>` : ''}
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderSkillsModal(container) {
  const { skills } = cvData;
  const levelPercentages = {
    "Exploring": 35,
    "Intermediate": 65,
    "Proficient": 85,
    "Advanced": 95,
    "Master": 100
  };

  container.innerHTML = `
    <p class="bio-paragraph" style="margin-bottom: 20px;">
      Weapon masteries and technical proficiencies forged through extensive problem solving and project execution.
    </p>
    ${skills.map(cat => `
      <div class="skills-category-group">
        <h4 class="skills-category-name"><i class="fa-solid fa-shield-halved"></i> ${cat.category}</h4>
        <div class="skills-list">
          ${cat.items.map(item => {
            const pct = levelPercentages[item.level] || 70;
            return `
              <div class="skill-item-card">
                <div class="skill-info">
                  <span class="skill-name">${item.name}</span>
                  <span class="skill-level-badge">${item.level}</span>
                </div>
                <div class="skill-meter">
                  <div class="skill-meter-fill" style="width: ${pct}%"></div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `).join('')}
  `;
}

function renderContactModal(container) {
  const { profile, socials } = cvData;
  container.innerHTML = `
    <p class="bio-paragraph" style="margin-bottom: 20px;">
      Dispatch a raven or send a direct dispatch for game development opportunities, collaborations, or technical inquiries.
    </p>
    <div class="contact-grid">
      <a href="mailto:${profile.email}" class="contact-card-box">
        <div class="contact-icon-bubble"><i class="fa-solid fa-envelope"></i></div>
        <div class="contact-info-text">
          <strong>Direct Email</strong>
          <span>${profile.email}</span>
        </div>
      </a>
      <a href="tel:${profile.phone}" class="contact-card-box">
        <div class="contact-icon-bubble"><i class="fa-solid fa-phone"></i></div>
        <div class="contact-info-text">
          <strong>Phone & WhatsApp</strong>
          <span>${profile.phone}</span>
        </div>
      </a>
      <div class="contact-card-box">
        <div class="contact-icon-bubble"><i class="fa-solid fa-map-location-dot"></i></div>
        <div class="contact-info-text">
          <strong>Location</strong>
          <span>${profile.location}</span>
        </div>
      </div>
    </div>

    <h4 class="parchment-section-title"><i class="fa-solid fa-share-nodes"></i> Guild Channels & Socials</h4>
    <div class="socials-flex-bar">
      ${socials.github ? `<a href="${socials.github}" target="_blank" rel="noopener noreferrer" class="social-button-rpg"><i class="fa-brands fa-github"></i> GitHub</a>` : ''}
      ${socials.linkedin ? `<a href="${socials.linkedin}" target="_blank" rel="noopener noreferrer" class="social-button-rpg"><i class="fa-brands fa-linkedin"></i> LinkedIn</a>` : ''}
      ${socials.itchio ? `<a href="${socials.itchio}" target="_blank" rel="noopener noreferrer" class="social-button-rpg"><i class="fa-brands fa-itch-io"></i> Itch.io</a>` : ''}
      ${socials.youtube ? `<a href="${socials.youtube}" target="_blank" rel="noopener noreferrer" class="social-button-rpg"><i class="fa-brands fa-youtube"></i> YouTube</a>` : ''}
      ${socials.instagram ? `<a href="${socials.instagram}" target="_blank" rel="noopener noreferrer" class="social-button-rpg"><i class="fa-brands fa-instagram"></i> Instagram</a>` : ''}
      ${socials.artstation ? `<a href="${socials.artstation}" target="_blank" rel="noopener noreferrer" class="social-button-rpg"><i class="fa-brands fa-artstation"></i> ArtStation</a>` : ''}
      <button class="social-button-rpg" id="copy-email-btn" style="cursor: pointer; border: 1.5px solid var(--shield-gold);">
        <i class="fa-solid fa-copy"></i> Copy Email
      </button>
    </div>
  `;

  const copyBtn = document.getElementById('copy-email-btn');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(profile.email).then(() => {
        showToast("Email address copied to scroll!");
      });
    });
  }
}

function renderResumeModal(container) {
  const { profile, education, experienceRoll, skills } = cvData;
  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 10px;">
      <div>
        <h3 style="font-family: var(--font-display); font-size: 1.6rem; color: var(--wood-border);">${profile.fullName}</h3>
        <p style="font-weight: 700; color: var(--wood-main);">${profile.subHeadline}</p>
      </div>
      <div>
        ${profile.cvPdfPath ? `
          <a href="${profile.cvPdfPath}" download class="rpg-btn-primary" style="text-decoration: none;">
            <i class="fa-solid fa-file-arrow-down"></i> Download PDF
          </a>
        ` : `
          <button class="rpg-btn-primary" onclick="window.print()">
            <i class="fa-solid fa-print"></i> Print CV
          </button>
        `}
      </div>
    </div>

    <div class="timeline-card" style="margin-bottom: 16px;">
      <strong>Contact:</strong> ${profile.email} &bull; ${profile.phone} &bull; ${profile.location}
    </div>

    <h4 class="parchment-section-title"><i class="fa-solid fa-graduation-cap"></i> Education</h4>
    <div class="timeline-container" style="margin-bottom: 18px;">
      ${education.map(e => `
        <div class="timeline-card">
          <div class="timeline-header">
            <span class="timeline-title">${e.degree}</span>
            <span class="timeline-period">${e.period}</span>
          </div>
          <div>${e.institution}</div>
          <div style="font-size: 0.85rem; color: var(--parchment-ink-light);">${e.details}</div>
        </div>
      `).join('')}
    </div>

    <h4 class="parchment-section-title"><i class="fa-solid fa-briefcase"></i> Work & Leadership Experience</h4>
    <div class="timeline-container">
      ${experienceRoll.map(exp => `
        <div class="timeline-card">
          <div class="timeline-header">
            <span class="timeline-title">${exp.role}</span>
            <span class="timeline-period">${exp.period}</span>
          </div>
          <div><strong>${exp.company}</strong> (${exp.location})</div>
          <p style="font-size: 0.85rem; margin-top: 4px;">${exp.description}</p>
        </div>
      `).join('')}
    </div>
  `;
}

function showToast(message) {
  const toast = document.getElementById('rpg-toast');
  const msgEl = document.getElementById('toast-message');
  if (!toast || !msgEl) return;
  msgEl.textContent = message;
  toast.classList.remove('toast-hidden');
  playProceduralAudio('chime');
  setTimeout(() => {
    toast.classList.add('toast-hidden');
  }, 2800);
}

/* ============================================================================
   12. 2.5D INTERACTIVE WIZARD MASCOT (BOTTOM-LEFT)
   ============================================================================ */
function initMascot() {
  const mascot = document.getElementById('mascot-container');
  const speechBubble = document.getElementById('wiz-speech');
  if (!mascot || !speechBubble) return;

  const dialogueLines = [
    "Greetings, traveler! Explore my island or click the landmarks!",
    "My tower holds chronicles of quests and experience!",
    "The wooden cabin contains sacred education scrolls!",
    "Sparkling treasure chests hide finished games and builds!",
    "Rest by the campfire to inspect programming masteries!",
    "A wizard's code has zero memory leaks and 60 FPS!"
  ];
  let dialogueIndex = 0;

  mascot.addEventListener('click', () => {
    playProceduralAudio('magicCast');
    dialogueIndex = (dialogueIndex + 1) % dialogueLines.length;
    speechBubble.querySelector('span').textContent = dialogueLines[dialogueIndex];
    mascot.classList.add('active');
    setTimeout(() => mascot.classList.remove('active'), 3200);
  });

  // Eyes track cursor
  window.addEventListener('pointermove', (e) => {
    const rect = mascot.getBoundingClientRect();
    const eyeCenterX = rect.left + rect.width / 2;
    const eyeCenterY = rect.top + rect.height / 2;
    const angle = Math.atan2(e.clientY - eyeCenterY, e.clientX - eyeCenterX);
    const dist = Math.min(2.5, Math.hypot(e.clientX - eyeCenterX, e.clientY - eyeCenterY) / 100);

    const pupils = mascot.querySelectorAll('.wiz-pupil');
    pupils.forEach(pupil => {
      pupil.style.transform = `translate(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist}px)`;
    });
  });
}

/* ============================================================================
   13. PROCEDURAL WEB AUDIO API (TACTILE RPG SOUND SYNTHESIS)
   ============================================================================ */
function ensureAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

function toggleAudio() {
  isAudioMuted = !isAudioMuted;
  const icon = document.getElementById('audio-icon');
  const tooltip = document.getElementById('audio-tooltip-text');
  if (icon) {
    icon.className = isAudioMuted ? 'fa-solid fa-volume-xmark' : 'fa-solid fa-volume-high';
  }
  if (tooltip) {
    tooltip.textContent = isAudioMuted ? 'Audio: MUTED' : 'Audio: ON';
  }
  if (!isAudioMuted) {
    ensureAudioContext();
    playProceduralAudio('chime');
  }
}

function playProceduralAudio(type) {
  if (isAudioMuted) return;
  ensureAudioContext();
  if (!audioCtx) return;

  const now = audioCtx.currentTime;

  try {
    switch (type) {
      case 'hover': {
        // Soft wooden tactile tick
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(120, now + 0.04);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.04);
        break;
      }
      case 'click': {
        // Crisp wooden knock / snap
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(540, now);
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.08);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.08);
        break;
      }
      case 'scrollOpen': {
        // Parchment unroll sound (gentle filtered noise buffer)
        const bufferSize = audioCtx.sampleRate * 0.15;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * 0.15;
        }
        const noise = audioCtx.createBufferSource();
        noise.buffer = buffer;
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(800, now);
        filter.frequency.exponentialRampToValueAtTime(300, now + 0.15);
        const gain = audioCtx.createGain();
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(audioCtx.destination);
        noise.start(now);
        break;
      }
      case 'chime': {
        // Magical two-tone chime
        [523.25, 659.25, 783.99].forEach((freq, i) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + i * 0.07);
          gain.gain.setValueAtTime(0.1, now + i * 0.07);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.28);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(now + i * 0.07);
          osc.stop(now + i * 0.07 + 0.28);
        });
        break;
      }
      case 'magicCast': {
        // Whimsical spell sweep
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.22);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.25);
        break;
      }
    }
  } catch (e) {
    // Graceful silence on audio constraint
  }
}

/* ============================================================================
   14. MAIN ANIMATION LOOP
   ============================================================================ */
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();
  const time = clock.getElapsedTime();

  // Gentle Idle Diorama Floating Bob
  if (dioramaGroup) {
    dioramaGroup.position.y = Math.sin(time * 0.9) * 0.09;
    dioramaGroup.rotation.y = Math.sin(time * 0.25) * 0.02;
  }

  // Smooth Mouse Parallax Lerp
  currentParallax.x += (targetParallax.x - currentParallax.x) * 0.05;
  currentParallax.y += (targetParallax.y - currentParallax.y) * 0.05;

  // Scroll Waypoint Interpolation (when user is not manually orbiting with mouse)
  if (!isUserInteractingWithControls) {
    const interpolated = interpolateWaypoints(scrollProgress);
    // Combine waypoint trajectory with subtle parallax
    const finalPos = interpolated.pos.clone().add(new THREE.Vector3(currentParallax.x, currentParallax.y, 0));
    camera.position.lerp(finalPos, 0.08);
    controls.target.lerp(interpolated.target, 0.08);
  }

  controls.update();

  // Animate Particles & Lights
  updateParticles(delta, time);

  // Render Scene
  renderer.render(scene, camera);
}
