window.focus();

let camera, scena, renderer;
const objectSize = 2;

let stack = [];
const boxHeight = 1;
let overhangs, world, lastTime, pilotAutomat, final, precizie;

const scorEl = document.getElementById("score");
const instructiuneEL = document.getElementById("instructions");
const rezultatEl = document.getElementById("results");

function addLayer(x, z, width, depth, direction) {
  const y = boxHeight * stack.length;
  const layer = generateBox(x, y, z, width, depth, false);
  layer.direction = direction;
  stack.push(layer);
}

function addOverhang(x, z, width, depth) {
  const y = boxHeight * (stack.length - 1);
  const overhang = generateBox(x, y, z, width, depth, true);
  overhangs.push(overhang);
}

function generateBox(x, y, z, width, depth, falls) {
  const geometrie = new THREE.BoxGeometry(width, boxHeight, depth);

  const texture = new THREE.TextureLoader().load("dots.PNG");
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    specular: 0x555555,
    shininess: 30,
  });
  material.blending = THREE.NormalBlending;
  material.side = THREE.FrontSide;

  texture.format = THREE.RGB_ETC1_Format;

  const mesh = new THREE.Mesh(geometrie, material);
  mesh.position.set(x, y, z);
  scena.add(mesh);

  const shape = new CANNON.Box(
    new CANNON.Vec3(width / 2, boxHeight / 2, depth / 2)
  );
  var mass;
  if (falls) mass = 5;
  else mass = 0;
  mass *= width / objectSize;
  mass *= depth / objectSize;
  const body = new CANNON.Body({ mass, shape });
  body.position.set(x, y, z);
  world.addBody(body);

  return {
    threejs: mesh,
    cannonjs: body,
    width,
    depth,
  };
}

function start() {
  final = false;
  pilotAutomat = false;
  overhangs = [];
  stack = [];
  lastTime = 0;

  if (instructiuneEL) instructiuneEL.style.display = "none";
  if (rezultatEl) rezultatEl.style.display = "none";
  if (scorEl) scorEl.innerText = "Your score is: 0";

  if (world) while (world.bodies.length > 0) world.remove(world.bodies[0]);

  if (scena) {
    while (scena.children.find((c) => c.type == "Mesh")) {
      const mesh = scena.children.find((c) => c.type == "Mesh");
      scena.remove(mesh);
    }

    addLayer(0, 0, objectSize, objectSize);

    addLayer(-10, 0, objectSize, objectSize, "x");
  }

  if (camera) {
    camera.position.set(4, 4, 4);
    camera.lookAt(0, 0, 0);
  }
}

function redim(topLayer, overlap, size, delta) {
  if (!pilotAutomat) {
    const listener = new THREE.AudioListener();
    camera.add(listener);

    const sound = new THREE.Audio(listener);
    const audioLoader = new THREE.AudioLoader();
    audioLoader.load("a.wav", function (buffer) {
      sound.setBuffer(buffer);
      sound.setLoop(false);
      sound.setVolume(0.5);
      sound.play();
    });
  }

  const direction = topLayer.direction;

  var latimeNoua;
  if (direction == "x") latimeNoua = overlap;
  else latimeNoua = topLayer.width;

  var adancimeNoua;
  if (direction == "z") adancimeNoua = overlap;
  else adancimeNoua = topLayer.depth;

  topLayer.width = latimeNoua;
  topLayer.depth = adancimeNoua;

  topLayer.threejs.scale[direction] = overlap / size;
  topLayer.threejs.position[direction] -= delta / 2;

  topLayer.cannonjs.position[direction] -= delta / 2;

  const shape = new CANNON.Box(
    new CANNON.Vec3(latimeNoua / 2, boxHeight / 2, adancimeNoua / 2)
  );
  topLayer.cannonjs.shapes = [];
  topLayer.cannonjs.addShape(shape);
}

window.addEventListener("touchstart", eventHandler);
window.addEventListener("keydown", function (event) {
  if (event.key == " ") {
    event.preventDefault();
    eventHandler();
    return;
  }
  if (event.key == "S" || event.key == "s") {
    event.preventDefault();
    start();
    return;
  }
});
window.addEventListener("mousedown", eventHandler);

function eventHandler() {
  if (!pilotAutomat) adaugareNivel();
  else start();
}

function adaugareNivel() {
  if (!final) {
    const topLayer = stack[stack.length - 1];
    const previousLayer = stack[stack.length - 2];

    const direction = topLayer.direction;
    var size;

    if (direction == "x") size = topLayer.width;
    else size = topLayer.depth;

    const delta =
      topLayer.threejs.position[direction] -
      previousLayer.threejs.position[direction];
    const overhangSize = Math.abs(delta);
    const overlap = size - overhangSize;

    if (overlap > 0) {
      redim(topLayer, overlap, size, delta);

      const overhangShift = (overlap / 2 + overhangSize / 2) * Math.sign(delta);
      var overhangX;
      if (direction == "x")
        overhangX = topLayer.threejs.position.x + overhangShift;
      else overhangX = topLayer.threejs.position.x;

      var overhangZ;
      if (direction == "z")
        overhangZ = topLayer.threejs.position.z + overhangShift;
      else overhangZ = topLayer.threejs.position.z;

      var overhangWidth;
      if (direction == "x") overhangWidth = overhangSize;
      else overhangWidth = topLayer.width;

      var overhangDepth;
      if (direction == "z") overhangDepth = overhangSize;
      else overhangDepth = topLayer.depth;

      addOverhang(overhangX, overhangZ, overhangWidth, overhangDepth);

      var nextX;
      if (direction == "x") nextX = topLayer.threejs.position.x;
      else nextX = -10;

      var nextZ;
      if (direction == "z") nextZ = topLayer.threejs.position.z;
      else nextZ = -10;

      const newWidth = topLayer.width;
      const newDepth = topLayer.depth;

      var nextDirection;
      if (direction == "x") nextDirection = "z";
      else nextDirection = "x";

      if (scorEl)
        if (!pilotAutomat)
          scorEl.innerText = "Your score is: ".concat(stack.length - 1);

      addLayer(nextX, nextZ, newWidth, newDepth, nextDirection);
    } else over();
  } else return;
}

function over() {
  if (!pilotAutomat) {
    const listener = new THREE.AudioListener();
    camera.add(listener);

    const sound = new THREE.Audio(listener);
    const audioLoader = new THREE.AudioLoader();
    audioLoader.load("gameover.wav", function (buffer) {
      sound.setBuffer(buffer);
      sound.setLoop(false);
      sound.setVolume(0.5);
      sound.play();
    });
  }
  const topLayer = stack[stack.length - 1];

  addOverhang(
    topLayer.threejs.position.x,
    topLayer.threejs.position.z,
    topLayer.width,
    topLayer.depth
  );
  world.remove(topLayer.cannonjs);
  scena.remove(topLayer.threejs);

  final = true;
  if (rezultatEl && !pilotAutomat) rezultatEl.style.display = "flex";
}

function animation(time) {
  if (lastTime) {
    const timePassed = time - lastTime;
    const speed = 0.008;

    const topLayer = stack[stack.length - 1];
    const previousLayer = stack[stack.length - 2];

    const boxShouldMove =
      !final &&
      (!pilotAutomat ||
        (pilotAutomat &&
          topLayer.threejs.position[topLayer.direction] <
            previousLayer.threejs.position[topLayer.direction] + precizie));

    if (boxShouldMove) {
      topLayer.threejs.position[topLayer.direction] += speed * timePassed;
      topLayer.cannonjs.position[topLayer.direction] += speed * timePassed;

      if (topLayer.threejs.position[topLayer.direction] > 10) over();
    } else {
      if (pilotAutomat) {
        adaugareNivel();
        precizie = (Math.random() - 0.5) * 30;
      }
    }

    if (camera.position.y < boxHeight * (stack.length - 2) + 4)
      camera.position.y = camera.position.y + timePassed * speed;

    updatePhysics(timePassed);
    renderer.render(scena, camera);
  }
  lastTime = time;
}

function updatePhysics(timePassed) {
  world.step(timePassed / 1000);

  overhangs.forEach((element) => {
    element.threejs.position.copy(element.cannonjs.position);
    element.threejs.quaternion.copy(element.cannonjs.quaternion);
  });
}

window.addEventListener("resize", () => {
  const latime = 10;
  const inaltime = latime / (window.innerWidth / window.innerHeight);

  camera.top = inaltime / 3;
  camera.bottom = inaltime / -3;

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.render(scena, camera);
});


function init() {
  precizie = (Math.random() - 0.5) * 30;
  pilotAutomat = true;
  final = false;
  lastTime = 0;
  stack = [];
  overhangs = [];

  world = new CANNON.World();
  world.gravity.set(0, -11, 0);
  world.solver.iterations = 40;
  world.broadphase = new CANNON.NaiveBroadphase();

  const latime = 8;
  const inaltime = latime * (window.innerHeight / window.innerWidth);
  camera = new THREE.OrthographicCamera(
    latime / -1.5,
    latime / 1.5,
    inaltime / 1.5,
    inaltime / -1.5,
    0,
    1000
  );

  camera.position.set(4, 4, 4);
  camera.lookAt(0, 0, 0);

  scena = new THREE.Scene();

  addLayer(0, 0, objectSize, objectSize);

  addLayer(-10, 0, objectSize, objectSize, "x");

  const spotLight = new THREE.SpotLight(0xffffff);
  spotLight.position.set(100, 1000, 100);
  spotLight.castShadow = true;
  spotLight.shadow.mapSize.width = 1024;
  spotLight.shadow.mapSize.height = 1024;
  spotLight.shadow.camera.near = 500;
  spotLight.shadow.camera.far = 4000;
  spotLight.shadow.camera.fov = 30;
  scena.add(spotLight);

  const loader = new THREE.TextureLoader();
  loader.load("px.png", function (texture) {
    scena.background = texture;
  });

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setAnimationLoop(animation);
  document.body.appendChild(renderer.domElement);
}


init();
