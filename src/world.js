import * as THREE from 'three';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const smoothstep = (edge0, edge1, value) => {
  const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
};

function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function hash2(x, y, seed) {
  let n = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(seed, 1442695041);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  n ^= n >>> 16;
  return (n >>> 0) / 4294967295;
}

function makeNoiseGrid(seed, width, height) {
  const random = seededRandom(seed);
  const values = new Float32Array(width * height);
  for (let i = 0; i < values.length; i += 1) values[i] = random();
  return { values, width, height };
}

function sampleGrid(grid, u, v) {
  const px = ((u % 1) + 1) % 1 * grid.width;
  const py = clamp(v, 0, 1) * (grid.height - 1);
  const x0 = Math.floor(px);
  const x1 = (x0 + 1) % grid.width;
  const y0 = Math.floor(py);
  const y1 = Math.min(y0 + 1, grid.height - 1);
  const tx = px - x0;
  const ty = py - y0;
  const sx = tx * tx * (3 - 2 * tx);
  const sy = ty * ty * (3 - 2 * ty);
  const a = grid.values[y0 * grid.width + x0] * (1 - sx) + grid.values[y0 * grid.width + x1] * sx;
  const b = grid.values[y1 * grid.width + x0] * (1 - sx) + grid.values[y1 * grid.width + x1] * sx;
  return a * (1 - sy) + b * sy;
}

function hexRgb(hex) {
  const value = hex.replace('#', '');
  return [0, 2, 4].map((offset) => parseInt(value.slice(offset, offset + 2), 16));
}

function mixByte(a, b, t) {
  return Math.round(a + (b - a) * clamp(t, 0, 1));
}

function makePlanetTexture(planet, width = 1024) {
  const height = Math.floor(width / 2);
  const baseWidth = Math.min(width, 1024);
  const baseHeight = Math.floor(baseWidth / 2);
  const base = document.createElement('canvas');
  base.width = baseWidth;
  base.height = baseHeight;
  const context = base.getContext('2d', { willReadFrequently: true });
  const image = context.createImageData(baseWidth, baseHeight);
  const grids = [
    makeNoiseGrid(planet.seed + 11, 12, 8),
    makeNoiseGrid(planet.seed + 29, 24, 16),
    makeNoiseGrid(planet.seed + 47, 48, 32),
    makeNoiseGrid(planet.seed + 83, 96, 64),
  ];
  const sea = hexRgb(planet.palette.ocean);
  const land = hexRgb(planet.palette.land);
  const high = hexRgb(planet.palette.high);
  const ice = hexRgb(planet.palette.ice);
  const bands = (planet.palette.bands ?? [planet.palette.land, planet.palette.high, planet.palette.ocean, planet.palette.land]).map(hexRgb);
  const isBandWorld = ['gas', 'ice-giant', 'sub-neptune'].includes(planet.bodyClass);

  for (let y = 0; y < baseHeight; y += 1) {
    const v = y / (baseHeight - 1);
    const latitude = Math.abs(v * 2 - 1);
    for (let x = 0; x < baseWidth; x += 1) {
      const u = x / baseWidth;
      const broad = sampleGrid(grids[0], u, v);
      const mid = sampleGrid(grids[1], u, v);
      const fine = sampleGrid(grids[2], u, v);
      const detail = sampleGrid(grids[3], u, v);
      const terrain = broad * 0.52 + mid * 0.25 + fine * 0.15 + detail * 0.08;
      const warp = Math.sin(u * Math.PI * 12 + broad * 8) * 0.018;
      let rgb;

      if (isBandWorld) {
        const bandSignal = Math.sin((v * 21 + (mid - 0.5) * 0.9 + Math.sin(u * 16 + fine * 4) * 0.035) * Math.PI * 2);
        const bandIndex = bandSignal > 0.48 ? 0 : bandSignal > -0.12 ? 1 : bandSignal > -0.66 ? 2 : 3;
        const bandBlend = smoothstep(-0.18, 0.24, bandSignal);
        const nextBand = bands[(bandIndex + 1) % bands.length];
        rgb = bands[bandIndex].map((channel, index) => mixByte(channel, nextBand[index], bandBlend * 0.35));
        const storm = planet.id === 'jupiter' && Math.pow((u - 0.72) * 3.2, 2) + Math.pow((v - 0.56) * 11, 2) < 0.72;
        if (storm) rgb = rgb.map((channel, index) => mixByte(channel, index === 0 ? 190 : index === 1 ? 94 : 65, 0.62));
      } else {
        const threshold = planet.hasOcean ? 0.50 + Math.max(0, latitude - 0.6) * 0.13 : 0.27;
        const isLand = planet.hasOcean ? terrain + warp > threshold : true;
        const mountain = smoothstep(0.57, 0.79, terrain + fine * 0.12);
        const coast = smoothstep(threshold - 0.035, threshold + 0.16, terrain + warp);
        const polar = smoothstep(planet.bodyClass === 'ice' ? 0.72 : 0.92, 0.995, latitude);
        const craterRoughness = planet.hasCraters ? smoothstep(0.31, 0.54, fine) * 0.16 : 0;
        if (isLand) {
          const upland = Math.max(mountain, craterRoughness);
          rgb = land.map((channel, index) => mixByte(channel, high[index], upland));
        } else {
          rgb = sea.map((channel, index) => mixByte(channel * 0.66, channel, coast));
        }
        if (planet.bodyClass === 'ice' || planet.id === 'pluto' || planet.id === 'enceladus') {
          const frozen = Math.max(polar * 0.68, smoothstep(0.57, 0.76, detail) * 0.26);
          rgb = rgb.map((channel, index) => mixByte(channel, ice[index], frozen));
        } else if (planet.hasClouds) {
          const clouds = smoothstep(0.66, 0.78, mid * 0.65 + fine * 0.35) * 0.46;
          rgb = rgb.map((channel, index) => mixByte(channel, 224 + index * 5, clouds));
        } else if (planet.id === 'mars' || planet.id === 'titan') {
          const dust = smoothstep(0.42, 0.78, broad + fine * 0.1) * 0.18;
          rgb = rgb.map((channel, index) => mixByte(channel, high[index], dust));
        }
      }

      const grain = (detail - 0.5) * 17 + (fine - 0.5) * 8;
      const index = (y * baseWidth + x) * 4;
      image.data[index] = clamp(rgb[0] + grain, 0, 255);
      image.data[index + 1] = clamp(rgb[1] + grain, 0, 255);
      image.data[index + 2] = clamp(rgb[2] + grain, 0, 255);
      image.data[index + 3] = 255;
    }
  }
  context.putImageData(image, 0, 0);

  const textureCanvas = document.createElement('canvas');
  textureCanvas.width = width;
  textureCanvas.height = height;
  const textureContext = textureCanvas.getContext('2d');
  textureContext.imageSmoothingEnabled = true;
  textureContext.imageSmoothingQuality = 'high';
  textureContext.drawImage(base, 0, 0, width, height);
  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.anisotropy = Math.min(8, window.__perigeeMaxAnisotropy ?? 4);
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}

function makeAtmosphere(radius, colour, opacity = 0.72) {
  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.BackSide,
    uniforms: {
      glowColor: { value: new THREE.Color(colour) },
      glowOpacity: { value: opacity },
    },
    vertexShader: `
      varying vec3 vWorldPosition;
      varying vec3 vWorldNormal;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        vWorldNormal = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * worldPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 glowColor;
      uniform float glowOpacity;
      varying vec3 vWorldPosition;
      varying vec3 vWorldNormal;
      void main() {
        vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
        float rim = 1.0 - max(dot(normalize(vWorldNormal), viewDirection), 0.0);
        float glow = pow(rim, 2.55) * glowOpacity;
        gl_FragColor = vec4(glowColor, glow);
      }
    `,
  });
  return new THREE.Mesh(new THREE.SphereGeometry(radius, 48, 32), material);
}

function makeGlobe(planet, radius, textureSize = 1024) {
  const group = new THREE.Group();
  const texture = makePlanetTexture(planet, textureSize);
  const surface = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 80, 56),
    new THREE.MeshStandardMaterial({
      map: texture,
      bumpMap: texture,
      bumpScale: radius * 0.007,
      roughness: 0.88,
      metalness: 0.025,
    }),
  );
  surface.castShadow = true;
  surface.receiveShadow = true;
  group.add(surface);
  const atmosphere = makeAtmosphere(radius * 1.045, planet.palette.atmosphere, 0.8);
  group.add(atmosphere);
  group.userData.surface = surface;
  group.userData.planetId = planet.id;
  return group;
}

function valueNoise2D(x, y, seed) {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const tx = x - x0;
  const ty = y - y0;
  const sx = tx * tx * (3 - 2 * tx);
  const sy = ty * ty * (3 - 2 * ty);
  const a = hash2(x0, y0, seed) * (1 - sx) + hash2(x0 + 1, y0, seed) * sx;
  const b = hash2(x0, y0 + 1, seed) * (1 - sx) + hash2(x0 + 1, y0 + 1, seed) * sx;
  return a * (1 - sy) + b * sy;
}

function terrainHeight(x, z, seed, scale = 1) {
  const broad = valueNoise2D(x * 0.012, z * 0.012, seed + 3);
  const mid = valueNoise2D(x * 0.035, z * 0.035, seed + 7);
  const fine = valueNoise2D(x * 0.095, z * 0.095, seed + 13);
  const ridgeNoise = valueNoise2D(x * 0.022, z * 0.022, seed + 19);
  const ridges = 1 - Math.abs(ridgeNoise * 2 - 1);
  return ((broad - 0.5) * 23 + (mid - 0.5) * 9 + (fine - 0.5) * 2.8 + (ridges - 0.45) * 3) * scale;
}

function makeSurfaceMaps(planet) {
  const sourceSize = 1024;
  const source = document.createElement('canvas');
  source.width = sourceSize;
  source.height = sourceSize;
  const colorContext = source.getContext('2d', { willReadFrequently: true });
  const colorImage = colorContext.createImageData(sourceSize, sourceSize);
  const heightCanvas = document.createElement('canvas');
  heightCanvas.width = sourceSize;
  heightCanvas.height = sourceSize;
  const heightContext = heightCanvas.getContext('2d', { willReadFrequently: true });
  const heightImage = heightContext.createImageData(sourceSize, sourceSize);
  const grids = [
    makeNoiseGrid(planet.seed + 1401, 16, 16),
    makeNoiseGrid(planet.seed + 1403, 48, 48),
    makeNoiseGrid(planet.seed + 1409, 128, 128),
    makeNoiseGrid(planet.seed + 1423, 256, 256),
  ];
  const soil = hexRgb(planet.palette.soil);
  const rock = hexRgb(planet.palette.rock);
  for (let y = 0; y < sourceSize; y += 1) {
    const v = y / sourceSize;
    for (let x = 0; x < sourceSize; x += 1) {
      const u = x / sourceSize;
      const macro = sampleGrid(grids[0], u, v);
      const mid = sampleGrid(grids[1], u, v);
      const fine = sampleGrid(grids[2], u, v);
      const grain = sampleGrid(grids[3], u, v);
      let relief = macro * 0.43 + mid * 0.28 + fine * 0.2 + grain * 0.09;
      if (planet.hasCraters) {
        const craterField = Math.pow(Math.abs(Math.sin(u * 59 + macro * 13) * Math.sin(v * 51 + mid * 11)), 0.38);
        relief = relief * 0.79 + craterField * 0.21;
      }
      const tone = (relief - 0.5) * 0.56 + (grain - 0.5) * 0.22;
      const index = (y * sourceSize + x) * 4;
      colorImage.data[index] = clamp(soil[0] * (1 + tone) + (rock[0] - soil[0]) * smoothstep(0.62, 0.88, relief) * 0.24, 0, 255);
      colorImage.data[index + 1] = clamp(soil[1] * (1 + tone) + (rock[1] - soil[1]) * smoothstep(0.62, 0.88, relief) * 0.24, 0, 255);
      colorImage.data[index + 2] = clamp(soil[2] * (1 + tone) + (rock[2] - soil[2]) * smoothstep(0.62, 0.88, relief) * 0.24, 0, 255);
      colorImage.data[index + 3] = 255;
      const elevation = clamp(104 + relief * 118 + (fine - 0.5) * 54, 0, 255);
      heightImage.data[index] = elevation;
      heightImage.data[index + 1] = elevation;
      heightImage.data[index + 2] = elevation;
      heightImage.data[index + 3] = 255;
    }
  }
  colorContext.putImageData(colorImage, 0, 0);
  heightContext.putImageData(heightImage, 0, 0);

  if (planet.hasCraters) {
    const random = seededRandom(planet.seed + 1501);
    for (let crater = 0; crater < 180; crater += 1) {
      const x = random() * sourceSize;
      const y = random() * sourceSize;
      const radius = 2 + random() * (planet.id === 'moon' ? 28 : 15);
      heightContext.beginPath();
      heightContext.arc(x, y, radius, 0, Math.PI * 2);
      heightContext.strokeStyle = `rgba(255,255,255,${0.12 + random() * 0.22})`;
      heightContext.lineWidth = 1 + random() * 2;
      heightContext.stroke();
      heightContext.beginPath();
      heightContext.arc(x, y, radius * 0.8, 0, Math.PI * 2);
      heightContext.fillStyle = `rgba(25,30,34,${0.08 + random() * 0.13})`;
      heightContext.fill();
    }
  }

  const makeTexture = (canvas, colorSpace = false) => {
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(18, 18);
    texture.anisotropy = Math.min(8, window.__perigeeMaxAnisotropy ?? 4);
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = true;
    if (colorSpace) texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  };
  return { map: makeTexture(source, true), bumpMap: makeTexture(heightCanvas) };
}

function makeTerrainMaterial(planet) {
  const low = new THREE.Color(planet.palette.soil);
  const middle = new THREE.Color(planet.palette.rock);
  const high = new THREE.Color(planet.palette.high);
  const geometry = new THREE.PlaneGeometry(460, 460, 224, 224);
  const positions = geometry.attributes.position;
  const colors = new Float32Array(positions.count * 3);
  const color = new THREE.Color();
  for (let i = 0; i < positions.count; i += 1) {
    const x = positions.getX(i);
    const z = -positions.getY(i);
    const height = terrainHeight(x, z, planet.seed, planet.terrainScale);
    positions.setZ(i, height);
    const altitude = smoothstep(-13, 24, height + (valueNoise2D(x * 0.04, z * 0.04, planet.seed + 91) - 0.5) * 6);
    color.copy(low).lerp(middle, smoothstep(0.2, 0.77, altitude));
    color.lerp(high, smoothstep(0.72, 1, altitude) * 0.75);
    const dust = (valueNoise2D(x * 0.12, z * 0.12, planet.seed + 107) - 0.5) * 0.09;
    color.offsetHSL(0, planet.hasOcean ? 0.04 : 0, dust);
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.rotateX(-Math.PI / 2);
  geometry.computeVertexNormals();
  const maps = makeSurfaceMaps(planet);
  const mesh = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: maps.map,
      bumpMap: maps.bumpMap,
      bumpScale: planet.hasCraters ? 0.32 : 0.19,
      vertexColors: true,
      roughness: 0.94,
      metalness: 0.025,
    }),
  );
  mesh.receiveShadow = true;
  return mesh;
}

function makeFirstPersonViewmodel(accent) {
  const rig = new THREE.Group();
  const sleeveMaterial = new THREE.MeshStandardMaterial({ color: 0x68747a, roughness: 0.86, metalness: 0.16 });
  const gloveMaterial = new THREE.MeshStandardMaterial({ color: 0xc3c6bd, roughness: 0.74, metalness: 0.08 });
  const toolMaterial = new THREE.MeshStandardMaterial({ color: 0x222e34, roughness: 0.42, metalness: 0.48 });
  const trimMaterial = new THREE.MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 0.4, roughness: 0.36, metalness: 0.2 });
  const glassMaterial = new THREE.MeshStandardMaterial({ color: 0x79c5d5, emissive: 0x246d80, emissiveIntensity: 0.9, roughness: 0.2, metalness: 0.55 });

  const leftForearm = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.62, 4, 8), sleeveMaterial);
  leftForearm.position.set(-0.5, -0.58, -0.7);
  leftForearm.rotation.z = -0.5;
  leftForearm.rotation.x = -0.14;
  rig.add(leftForearm);
  const leftGlove = new THREE.Mesh(new THREE.SphereGeometry(0.145, 16, 12), gloveMaterial);
  leftGlove.position.set(-0.27, -0.39, -0.99);
  leftGlove.scale.set(1.02, 0.84, 1.12);
  rig.add(leftGlove);
  for (let finger = 0; finger < 3; finger += 1) {
    const segment = new THREE.Mesh(new THREE.CapsuleGeometry(0.039, 0.105, 3, 5), gloveMaterial);
    segment.position.set(-0.34 + finger * 0.07, -0.49, -1.08);
    segment.rotation.z = 0.34;
    rig.add(segment);
  }

  const rightForearm = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.59, 4, 8), sleeveMaterial);
  rightForearm.position.set(0.53, -0.61, -0.65);
  rightForearm.rotation.z = 0.54;
  rightForearm.rotation.x = -0.12;
  rig.add(rightForearm);
  const rightGlove = new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 12), gloveMaterial);
  rightGlove.position.set(0.32, -0.38, -0.94);
  rightGlove.scale.set(0.88, 0.9, 1.08);
  rig.add(rightGlove);

  const scanner = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.18, 0.5), toolMaterial);
  scanner.add(body);
  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.18, 0.17), toolMaterial);
  grip.position.set(0, -0.15, 0.08);
  grip.rotation.x = -0.22;
  scanner.add(grip);
  const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.072, 0.1, 0.21, 16), toolMaterial);
  lens.rotation.x = -Math.PI / 2;
  lens.position.set(0, 0.015, -0.32);
  scanner.add(lens);
  const lensGlass = new THREE.Mesh(new THREE.CircleGeometry(0.065, 20), glassMaterial);
  lensGlass.position.set(0, 0.015, -0.431);
  scanner.add(lensGlass);
  const scannerBand = new THREE.Mesh(new THREE.BoxGeometry(0.196, 0.035, 0.18), trimMaterial);
  scannerBand.position.set(0, 0.078, 0.035);
  scanner.add(scannerBand);
  const scannerLight = new THREE.Mesh(new THREE.SphereGeometry(0.028, 10, 8), glassMaterial);
  scannerLight.position.set(0.07, 0.09, -0.07);
  scanner.add(scannerLight);
  scanner.position.set(0.4, -0.31, -0.98);
  scanner.rotation.set(-0.16, -0.1, -0.13);
  rig.add(scanner);
  rig.userData.scannerLight = scannerLight;
  rig.userData.scanner = scanner;
  return rig;
}

function makeShuttle(accent) {
  const ship = new THREE.Group();
  const hull = new THREE.MeshStandardMaterial({ color: 0xc4ccce, roughness: 0.53, metalness: 0.34 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x263744, roughness: 0.41, metalness: 0.4 });
  const glow = new THREE.MeshBasicMaterial({ color: accent });
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.72, 2.35, 5, 12), hull);
  body.rotation.x = Math.PI / 2;
  body.position.y = 1.07;
  body.castShadow = true;
  ship.add(body);

  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.71, 1.55, 12), hull);
  nose.rotation.x = -Math.PI / 2;
  nose.position.set(0, 1.07, -2.36);
  nose.castShadow = true;
  ship.add(nose);

  const cockpit = new THREE.Mesh(new THREE.SphereGeometry(0.47, 20, 14), new THREE.MeshPhysicalMaterial({ color: 0x31596b, metalness: 0.7, roughness: 0.17, clearcoat: 1 }));
  cockpit.position.set(0, 1.42, -1.15);
  cockpit.scale.set(1.02, 0.52, 0.9);
  ship.add(cockpit);

  for (const side of [-1, 1]) {
    const wing = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.12, 1.04), hull);
    wing.position.set(side * 1.13, 0.84, 0.55);
    wing.rotation.y = side * 0.08;
    wing.castShadow = true;
    ship.add(wing);
    const engine = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.3, 0.75, 12), dark);
    engine.rotation.x = Math.PI / 2;
    engine.position.set(side * 0.48, 0.85, 2.02);
    ship.add(engine);
    const engineLight = new THREE.Mesh(new THREE.SphereGeometry(0.19, 12, 10), glow);
    engineLight.position.set(side * 0.48, 0.85, 2.43);
    ship.add(engineLight);
  }

  const landingLegs = new THREE.Group();
  for (const side of [-1, 1]) {
    const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.075, 0.85, 8), dark);
    strut.position.set(side * 0.56, 0.36, 0.4);
    strut.rotation.z = side * 0.16;
    landingLegs.add(strut);
  }
  ship.add(landingLegs);
  return ship;
}

function isTypingTarget(target) {
  return target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));
}

export class World {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    this.renderer.setSize(window.innerWidth, window.innerHeight, false);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    window.__perigeeMaxAnisotropy = this.renderer.capabilities.getMaxAnisotropy();

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.1, 1800);
    this.root = new THREE.Group();
    this.scene.add(this.root);
    this.clock = new THREE.Clock();
    this.elapsed = 0;
    this.mode = 'menu';
    this.paused = false;
    this.keys = Object.create(null);
    this.onPlanetPick = () => {};
    this.onResourceCollect = () => {};
    this.onNearbyChange = () => {};
    this.onScan = () => {};
    this.onFrame = () => {};
    this.orbiters = [];
    this.moonOrbiters = [];
    this.globeGroups = [];
    this.planetMeshes = [];
    this.resourceNodes = [];
    this.viewModel = null;
    this.scanUntil = 0;
    this.scanCooldownUntil = 0;
    this.lastNearbyId = null;
    this.nearbyTimer = 0;
    this.cameraYaw = 0;
    this.cameraPitch = 0.3;
    this.playerVelocityY = 0;
    this.walkClock = 0;
    this.dragging = false;
    this.lastPointer = { x: 0, y: 0 };

    this.boundResize = () => this.resize();
    this.boundKeyDown = (event) => this.keyDown(event);
    this.boundKeyUp = (event) => this.keyUp(event);
    window.addEventListener('resize', this.boundResize);
    window.addEventListener('keydown', this.boundKeyDown);
    window.addEventListener('keyup', this.boundKeyUp);
    window.addEventListener('blur', () => { this.keys = Object.create(null); this.dragging = false; });
    canvas.addEventListener('pointerdown', (event) => this.pointerDown(event));
    canvas.addEventListener('pointermove', (event) => this.pointerMove(event));
    canvas.addEventListener('pointerup', () => { this.dragging = false; });
    canvas.addEventListener('pointercancel', () => { this.dragging = false; });
    canvas.addEventListener('contextmenu', (event) => event.preventDefault());

    this.showMenu();
    requestAnimationFrame(() => this.frame());
  }

  resize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.quality === 'balanced' ? 1.15 : 1.75));
    this.renderer.setSize(width, height, false);
  }

  setQuality(quality) {
    this.quality = quality;
    this.renderer.shadowMap.enabled = quality !== 'balanced';
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, quality === 'balanced' ? 1.15 : 1.75));
    this.renderer.setSize(window.innerWidth, window.innerHeight, false);
  }

  clearWorld() {
    if (this.menuTextureUpgrade) {
      clearTimeout(this.menuTextureUpgrade);
      this.menuTextureUpgrade = null;
    }
    if (this.viewModel) {
      this.camera.remove(this.viewModel);
      this.viewModel.traverse((object) => {
        object.geometry?.dispose();
        if (object.material) {
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          for (const material of materials) material.dispose();
        }
      });
      this.viewModel = null;
    }
    this.scene.remove(this.root);
    this.root.traverse((object) => {
      if (object.geometry) object.geometry.dispose();
      if (object.material) {
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        for (const material of materials) {
          for (const value of Object.values(material)) {
            if (value?.isTexture) value.dispose();
          }
          material.dispose();
        }
      }
    });
    this.root = new THREE.Group();
    this.scene.add(this.root);
    this.scene.fog = null;
    this.orbiters = [];
    this.moonOrbiters = [];
    this.globeGroups = [];
    this.planetMeshes = [];
    this.resourceNodes = [];
    this.menuPlanet = null;
    this.menuMoon = null;
    this.surfaceSun = null;
    this.surfaceKeyLight = null;
    this.scanWave = null;
    this.scene.background = new THREE.Color(0x030712);
  }

  addStars(count = 1600, radius = 360, seed = 271) {
    const random = seededRandom(seed);
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const a = new THREE.Color(0x7891b5);
    const b = new THREE.Color(0xe1e8eb);
    const c = new THREE.Color(0x85d7de);
    for (let i = 0; i < count; i += 1) {
      const theta = random() * Math.PI * 2;
      const z = random() * 2 - 1;
      const radial = Math.sqrt(1 - z * z);
      const distance = radius * (0.3 + random() * 0.7);
      positions[i * 3] = radial * Math.cos(theta) * distance;
      positions[i * 3 + 1] = z * distance;
      positions[i * 3 + 2] = radial * Math.sin(theta) * distance;
      const tint = random();
      const starColor = tint > 0.82 ? c : tint > 0.55 ? b : a;
      colors[i * 3] = starColor.r;
      colors[i * 3 + 1] = starColor.g;
      colors[i * 3 + 2] = starColor.b;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const stars = new THREE.Points(geometry, new THREE.PointsMaterial({
      size: 0.22,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.86,
      vertexColors: true,
      depthWrite: false,
    }));
    this.root.add(stars);
    return stars;
  }

  addSun(position, radius = 1.5, colour = '#ffd6a0') {
    const sun = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 48, 32),
      new THREE.MeshBasicMaterial({ color: colour }),
    );
    sun.position.copy(position);
    this.root.add(sun);
    const halo = new THREE.Mesh(
      new THREE.SphereGeometry(radius * 1.12, 32, 24),
      new THREE.MeshBasicMaterial({ color: colour, transparent: true, opacity: 0.12, side: THREE.BackSide, depthWrite: false }),
    );
    halo.position.copy(position);
    this.root.add(halo);
    const light = new THREE.PointLight(new THREE.Color(colour), 90, 240, 1.8);
    light.position.copy(position);
    this.root.add(light);
    return sun;
  }

  showMenu() {
    this.clearWorld();
    this.mode = 'menu';
    this.paused = false;
    this.scene.background = new THREE.Color(0x02050d);
    this.addStars(2400, 420, 4102);
    this.camera.fov = 50;
    this.camera.position.set(0, 0, 14);
    this.camera.lookAt(0, 0, 0);
    this.camera.updateProjectionMatrix();

    const solarSystem = window.__perigeeSystemData ?? { bodies: [], star: { colour: '#fff1cc' } };
    const earth = solarSystem.bodies.find((body) => body.id === 'earth') ?? window.__perigeePlanets?.find((body) => body.id === 'earth');
    const moonData = solarSystem.bodies.find((body) => body.id === 'moon');
    const mars = solarSystem.bodies.find((body) => body.id === 'mars');
    const sun = this.addSun(new THREE.Vector3(-12, 7, -25), 1.55, solarSystem.star?.colour ?? '#fff1cc');
    const keyLight = new THREE.DirectionalLight(0xd9edff, 2.8);
    keyLight.position.set(-5, 6, 7);
    this.root.add(keyLight);
    this.root.add(new THREE.AmbientLight(0x34465f, 1.45));

    if (earth) {
      const earthGroup = makeGlobe(earth, 3.72, 1024);
      earthGroup.position.set(4.5, -0.15, -2.2);
      earthGroup.rotation.z = 0.21;
      this.root.add(earthGroup);
      this.menuPlanet = earthGroup;
      this.menuTextureUpgrade = window.setTimeout(() => {
        if (this.mode !== 'menu' || this.menuPlanet !== earthGroup) return;
        const highResolutionTexture = makePlanetTexture(earth, 4096);
        const surfaceMaterial = earthGroup.userData.surface.material;
        const previousTexture = surfaceMaterial.map;
        surfaceMaterial.map = highResolutionTexture;
        surfaceMaterial.bumpMap = highResolutionTexture;
        surfaceMaterial.needsUpdate = true;
        previousTexture?.dispose();
        this.menuTextureUpgrade = null;
      }, 650);

      if (moonData) {
        const orbit = new THREE.Mesh(
          new THREE.RingGeometry(4.55, 4.57, 150),
          new THREE.MeshBasicMaterial({ color: 0xd0dbe1, transparent: true, opacity: 0.12, side: THREE.DoubleSide, depthWrite: false }),
        );
        orbit.position.copy(earthGroup.position);
        orbit.rotation.set(1.43, -0.24, 0.21);
        this.root.add(orbit);
        const moonOrbit = new THREE.Group();
        moonOrbit.position.copy(earthGroup.position);
        const moon = makeGlobe(moonData, 0.32, 512);
        moon.position.set(4.9, 0.38, 0);
        moonOrbit.add(moon);
        this.root.add(moonOrbit);
        this.menuMoon = moonOrbit;
      }
    }

    if (mars) {
      const distantMars = makeGlobe(mars, 0.72, 512);
      distantMars.position.set(-8.4, -3.7, -15);
      this.root.add(distantMars);
    }
    sun.scale.setScalar(1.08);
  }

  showSystem(orbital = false) {
    this.clearWorld();
    this.mode = orbital ? 'orbit' : 'system';
    this.paused = false;
    this.scene.background = new THREE.Color(0x030711);
    const system = window.__perigeeSystemData ?? { bodies: [], star: { colour: '#fff1cc', radius: 2.5, spectralClass: 'G2 V' } };
    const bodies = system.bodies ?? [];
    const seed = system.seed ?? 18041;
    this.addStars(3200, 560, seed + 721);
    this.root.add(new THREE.AmbientLight(0x526179, 1.45));
    this.addSun(new THREE.Vector3(0, 0, 0), system.star?.radius ?? 2.3, system.star?.colour ?? '#fff1cc');

    const solarDistance = (au) => 4.4 + Math.log1p(Math.max(0.01, au)) * 5.35;
    const mapRadius = (planet) => clamp(0.34 + Math.pow(Math.max(0.02, planet.radiusEarth ?? 0.7), 0.39) * 0.43, 0.39, 1.62);
    const primaryBodies = bodies.filter((planet) => !planet.parentId);
    const hostGroups = new Map();
    let furthest = 15;

    primaryBodies.forEach((planet, index) => {
      const distance = solarDistance(planet.orbitAU ?? 0.9 + index * 0.8);
      const radius = mapRadius(planet);
      const angle = ((planet.seed ?? index * 79) % 628) / 100;
      const distanceToYear = Math.max(1, (planet.orbitalPeriod ?? 365) / 88);
      const group = makeGlobe(planet, radius, planet.id === 'earth' ? 1024 : 512);
      group.position.set(Math.cos(angle) * distance, Math.sin(angle * 0.68) * 0.16, Math.sin(angle) * distance);
      group.userData.planetId = planet.id;
      group.userData.radius = radius;
      this.root.add(group);
      hostGroups.set(planet.id, { group, radius, distance, angle, speed: 0.045 / Math.sqrt(distanceToYear) });
      this.orbiters.push({ group, distance, angle, speed: 0.045 / Math.sqrt(distanceToYear), planetId: planet.id });
      this.globeGroups.push(group);
      this.planetMeshes.push(group.userData.surface);
      furthest = Math.max(furthest, distance);

      const points = [];
      for (let step = 0; step < 240; step += 1) {
        const theta = (step / 240) * Math.PI * 2;
        points.push(new THREE.Vector3(Math.cos(theta) * distance, 0, Math.sin(theta) * distance));
      }
      const orbit = new THREE.LineLoop(
        new THREE.BufferGeometry().setFromPoints(points),
        new THREE.LineBasicMaterial({ color: 0x778396, transparent: true, opacity: 0.22 }),
      );
      this.root.add(orbit);

      if (planet.hasRings) {
        const ring = new THREE.Mesh(
          new THREE.RingGeometry(radius * 1.35, radius * 2.25, 120),
          new THREE.MeshStandardMaterial({ color: 0xbda882, roughness: 0.9, metalness: 0.08, transparent: true, opacity: 0.64, side: THREE.DoubleSide }),
        );
        ring.rotation.x = Math.PI / 2.28;
        group.add(ring);
      }
      this.addSelectionRing(group, planet, radius);
    });

    bodies.filter((planet) => planet.parentId).forEach((planet, index) => {
      const host = hostGroups.get(planet.parentId);
      if (!host) return;
      const moonDistance = host.radius * 1.82 + (planet.moonOrbit ?? 1.5) * 0.58;
      const radius = Math.min(0.62, mapRadius(planet) * 0.73);
      const angle = ((planet.seed ?? index * 41) % 628) / 100;
      const speed = 0.32 / Math.sqrt(Math.max(0.15, planet.orbitalPeriod ?? 12));
      const moon = makeGlobe(planet, radius, 512);
      moon.position.set(Math.cos(angle) * moonDistance, 0.03, Math.sin(angle) * moonDistance);
      moon.userData.planetId = planet.id;
      moon.userData.radius = radius;
      host.group.add(moon);
      this.globeGroups.push(moon);
      this.planetMeshes.push(moon.userData.surface);
      this.moonOrbiters.push({ group: moon, distance: moonDistance, angle, speed });
      this.addSelectionRing(moon, planet, radius);

      const orbitPoints = [];
      for (let step = 0; step < 96; step += 1) {
        const theta = (step / 96) * Math.PI * 2;
        orbitPoints.push(new THREE.Vector3(Math.cos(theta) * moonDistance, 0, Math.sin(theta) * moonDistance));
      }
      const moonOrbit = new THREE.LineLoop(
        new THREE.BufferGeometry().setFromPoints(orbitPoints),
        new THREE.LineBasicMaterial({ color: 0xb4c0c9, transparent: true, opacity: 0.22 }),
      );
      host.group.add(moonOrbit);
    });

    this.camera.fov = 49;
    this.camera.position.set(0, furthest * 1.05, furthest * 1.48);
    this.camera.lookAt(0, 0, 0);
    this.camera.updateProjectionMatrix();

    if (orbital) {
      const shuttle = makeShuttle('#bfe976');
      shuttle.scale.setScalar(0.48);
      shuttle.position.set(-furthest * 0.46, -1, furthest * 0.19);
      shuttle.rotation.y = -0.48;
      this.root.add(shuttle);
    }
    this.setSelectedPlanet(window.__perigeeSelectedPlanet);
  }

  addSelectionRing(group, planet, radius) {
    const marker = new THREE.Mesh(
      new THREE.RingGeometry(radius * 1.34, radius * 1.39, 72),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(planet.palette.accent), transparent: true, opacity: 0.58, side: THREE.DoubleSide, depthWrite: false }),
    );
    marker.rotation.x = -Math.PI / 2;
    marker.position.set(0, radius * 1.04, 0);
    marker.visible = false;
    group.add(marker);
    group.userData.selectionRing = marker;
  }

  setSelectedPlanet(planetId) {
    for (const globe of this.globeGroups) {
      const ring = globe.userData.selectionRing;
      if (ring) ring.visible = globe.userData.planetId === planetId;
    }
  }

  showLanding(planet, save = {}) {
    this.clearWorld();
    this.mode = 'landing';
    this.paused = false;
    this.planet = planet;
    const atmospheric = (planet.pressure ?? '').toLowerCase().includes('бар') && !planet.pressure.includes('вакуум');
    const sky = new THREE.Color(planet.palette.sky);
    sky.multiplyScalar(planet.hasClouds ? 0.7 : atmospheric ? 0.42 : 0.19);
    this.scene.background = sky;
    this.scene.fog = new THREE.FogExp2(sky, planet.hasClouds ? 0.003 : atmospheric ? 0.0025 : 0.00125);
    this.camera.fov = 72;
    this.camera.near = 0.055;
    this.camera.far = 1100;
    this.camera.updateProjectionMatrix();

    const system = window.__perigeeSystemData ?? { bodies: [], star: { luminosity: 1, colour: '#fff0d3' } };
    const hostAU = planet.orbitAU ?? system.bodies.find((body) => body.id === planet.parentId)?.orbitAU ?? 1;
    const luminosity = system.star?.luminosity ?? 1;
    const sunlight = clamp(3.2 * Math.sqrt(luminosity / Math.max(0.035, hostAU * hostAU)), 0.42, 8.5);
    const starColour = system.star?.colour ?? '#fff0d3';
    this.root.add(new THREE.HemisphereLight(planet.palette.sky, planet.palette.soil, planet.hasClouds ? 1.2 : 0.42));
    const sun = new THREE.DirectionalLight(starColour, sunlight);
    sun.position.set(135, 88, -275);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -112;
    sun.shadow.camera.right = 112;
    sun.shadow.camera.top = 112;
    sun.shadow.camera.bottom = -112;
    sun.shadow.bias = -0.00014;
    this.root.add(sun);
    this.surfaceKeyLight = sun;
    this.root.add(new THREE.AmbientLight(0x82909b, 0.22));

    this.surfaceSun = new THREE.Mesh(
      new THREE.SphereGeometry(9, 32, 24),
      new THREE.MeshBasicMaterial({ color: starColour }),
    );
    this.surfaceSun.position.set(135, 88, -275);
    this.root.add(this.surfaceSun);
    this.addStars(1500, 780, planet.seed + 913);

    this.terrain = makeTerrainMaterial(planet);
    this.root.add(this.terrain);
    this.groundAt = (x, z) => terrainHeight(x, z, planet.seed, planet.terrainScale);
    this.addBoulders(planet);
    this.addDistantRidge(planet);
    this.addShuttle(planet);
    this.addResources(planet, save);

    this.player = new THREE.Group();
    const savedPosition = save.planetId === planet.id && save.position ? save.position : { x: 0, z: 3 };
    this.player.position.set(savedPosition.x || 0, this.groundAt(savedPosition.x || 0, savedPosition.z || 0), savedPosition.z || 0);
    this.root.add(this.player);
    this.cameraYaw = Number.isFinite(save.cameraYaw) ? save.cameraYaw : 0;
    this.cameraPitch = 0.02;
    this.playerVelocityY = 0;
    this.nearbyTimer = 0;
    this.lastNearbyId = null;
    this.scanCooldownUntil = 0;
    this.scanUntil = 0;
    this.camera.position.set(this.player.position.x, this.player.position.y + 1.65, this.player.position.z);
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.set(this.cameraPitch, this.cameraYaw, 0);
    this.viewModel = makeFirstPersonViewmodel(planet.palette.accent);
    this.camera.add(this.viewModel);
  }

  addBoulders(planet) {
    const random = seededRandom(planet.seed + 201);
    const count = 92;
    const geometry = new THREE.DodecahedronGeometry(1, 0);
    const material = new THREE.MeshStandardMaterial({ color: planet.palette.rock, roughness: 0.98, metalness: 0.025 });
    const instances = new THREE.InstancedMesh(geometry, material, count);
    instances.castShadow = false;
    instances.receiveShadow = true;
    const dummy = new THREE.Object3D();
    for (let i = 0; i < count; i += 1) {
      const angle = random() * Math.PI * 2;
      const distance = 12 + random() * 195;
      const x = Math.cos(angle) * distance;
      const z = Math.sin(angle) * distance;
      const size = 0.32 + random() * (distance < 38 ? 0.65 : 2.4);
      dummy.position.set(x, this.groundAt(x, z) + size * 0.28, z);
      dummy.rotation.set(random() * 1.2, random() * Math.PI, random() * 0.5);
      dummy.scale.set(size * (0.75 + random() * 0.7), size * (0.55 + random() * 0.8), size * (0.7 + random() * 0.65));
      dummy.updateMatrix();
      instances.setMatrixAt(i, dummy.matrix);
    }
    instances.instanceMatrix.needsUpdate = true;
    this.root.add(instances);
  }

  addDistantRidge(planet) {
    const random = seededRandom(planet.seed + 443);
    const material = new THREE.MeshStandardMaterial({ color: planet.palette.soil, roughness: 1, flatShading: true });
    const geometry = new THREE.ConeGeometry(1, 1, 7, 1);
    for (let i = 0; i < 22; i += 1) {
      const angle = (i / 22) * Math.PI * 2 + random() * 0.18;
      const distance = 165 + random() * 34;
      const height = 17 + random() * 42;
      const mountain = new THREE.Mesh(geometry, material);
      mountain.position.set(Math.cos(angle) * distance, this.groundAt(Math.cos(angle) * distance, Math.sin(angle) * distance) + height * 0.47, Math.sin(angle) * distance);
      mountain.scale.set(12 + random() * 20, height, 15 + random() * 24);
      mountain.rotation.y = random() * Math.PI;
      this.root.add(mountain);
    }
  }

  addFlora(planet) {
    const random = seededRandom(planet.seed + 613);
    const plantMaterial = new THREE.MeshStandardMaterial({ color: planet.palette.accent, emissive: planet.palette.accent, emissiveIntensity: 0.22, roughness: 0.7 });
    const stemGeometry = new THREE.CylinderGeometry(0.045, 0.09, 1.25, 7);
    const tipGeometry = new THREE.IcosahedronGeometry(0.26, 0);
    for (let i = 0; i < 17; i += 1) {
      const angle = random() * Math.PI * 2;
      const distance = 18 + random() * 116;
      const x = Math.cos(angle) * distance;
      const z = Math.sin(angle) * distance;
      const plant = new THREE.Group();
      const stem = new THREE.Mesh(stemGeometry, plantMaterial);
      stem.position.y = 0.6;
      const tip = new THREE.Mesh(tipGeometry, plantMaterial);
      tip.position.y = 1.23;
      tip.scale.set(0.8, 1.3, 0.8);
      plant.add(stem, tip);
      plant.position.set(x, this.groundAt(x, z), z);
      plant.rotation.y = random() * Math.PI;
      const scale = 0.55 + random() * 1.05;
      plant.scale.setScalar(scale);
      this.root.add(plant);
    }
  }

  addShuttle(planet) {
    const shuttle = makeShuttle(planet.palette.accent);
    shuttle.position.set(0, this.groundAt(0, -11), -11);
    shuttle.rotation.y = 0.12;
    this.root.add(shuttle);
    this.shuttle = shuttle;

    const panel = new THREE.Mesh(
      new THREE.CylinderGeometry(1.8, 2.4, 0.24, 40),
      new THREE.MeshStandardMaterial({ color: 0x2b3438, metalness: 0.5, roughness: 0.74 }),
    );
    panel.position.set(0, this.groundAt(0, -11) + 0.06, -11);
    this.root.add(panel);
  }

  addResources(planet, save = {}) {
    const resourceOrder = ['iron', 'crystal', 'ice', 'iron', 'iron', 'crystal', 'iron', 'ice', 'crystal', 'iron', 'ice', 'crystal', 'iron', 'iron', 'ice', 'crystal', 'iron', 'ice', 'iron', 'crystal'];
    const collected = new Set(save.collectedByPlanet?.[planet.id] ?? []);
    const random = seededRandom(planet.seed + 997);
    const ironMaterial = new THREE.MeshStandardMaterial({ color: 0x6d5650, roughness: 0.74, metalness: 0.23, emissive: 0x371d18, emissiveIntensity: 0.15 });
    const ironVein = new THREE.MeshStandardMaterial({ color: 0xffaa73, emissive: 0x873b1c, emissiveIntensity: 0.72, roughness: 0.4 });
    const crystalMaterial = new THREE.MeshPhysicalMaterial({ color: 0x9adcf4, emissive: 0x226c9a, emissiveIntensity: 1.0, roughness: 0.18, metalness: 0.08, transparent: true, opacity: 0.91, transmission: 0.12 });
    const iceMaterial = new THREE.MeshPhysicalMaterial({ color: 0xa9e8fa, emissive: 0x226d91, emissiveIntensity: 0.55, roughness: 0.25, metalness: 0.08, transparent: true, opacity: 0.84 });
    const ringMaterial = new THREE.MeshBasicMaterial({ color: planet.palette.accent, transparent: true, opacity: 0.13, side: THREE.DoubleSide, depthWrite: false });

    resourceOrder.forEach((type, index) => {
      if (collected.has(index)) return;
      const angle = random() * Math.PI * 2;
      const distance = 18 + random() * 91;
      const x = Math.cos(angle) * distance;
      const z = Math.sin(angle) * distance;
      const group = new THREE.Group();
      const base = new THREE.Mesh(new THREE.IcosahedronGeometry(0.74 + random() * 0.25, 0), type === 'iron' ? ironMaterial : type === 'crystal' ? crystalMaterial : iceMaterial);
      base.position.y = 0.54;
      base.scale.set(1.2, 0.8, 1.04);
      base.rotation.set(random(), random(), random());
      group.add(base);

      if (type === 'iron') {
        const shard = new THREE.Mesh(new THREE.OctahedronGeometry(0.35, 0), ironVein);
        shard.position.set(0.24, 1.04, -0.2);
        shard.rotation.set(0.4, random() * 2, 0.5);
        group.add(shard);
        const second = new THREE.Mesh(new THREE.OctahedronGeometry(0.25, 0), ironVein);
        second.position.set(-0.3, 0.88, 0.18);
        group.add(second);
      } else {
        const spikeCount = type === 'crystal' ? 3 : 2;
        for (let spike = 0; spike < spikeCount; spike += 1) {
          const crystal = new THREE.Mesh(
            new THREE.ConeGeometry(type === 'ice' ? 0.28 : 0.24, (type === 'ice' ? 0.95 : 1.3) + random() * 0.52, 6, 1),
            type === 'ice' ? iceMaterial : crystalMaterial,
          );
          crystal.position.set((spike - (spikeCount - 1) / 2) * 0.33, 0.76, spike % 2 === 0 ? -0.1 : 0.17);
          crystal.rotation.z = (random() - 0.5) * 0.24;
          crystal.rotation.y = random() * 0.6;
          crystal.castShadow = true;
          group.add(crystal);
        }
      }

      const ring = new THREE.Mesh(new THREE.RingGeometry(0.84, 0.95, 48), ringMaterial.clone());
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.07;
      group.add(ring);
      group.position.set(x, this.groundAt(x, z), z);
      group.userData.resource = { id: index, type, group, ring };
      this.root.add(group);
      this.resourceNodes.push(group);
    });
  }

  pointerDown(event) {
    if (this.mode === 'landing') {
      this.dragging = true;
      this.lastPointer = { x: event.clientX, y: event.clientY };
      if (event.pointerType === 'mouse' && document.pointerLockElement !== this.canvas && typeof this.canvas.requestPointerLock === 'function') {
        this.canvas.requestPointerLock();
      }
      return;
    }
    if (this.mode === 'system' || this.mode === 'orbit') {
      const rect = this.canvas.getBoundingClientRect();
      const pointer = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1,
      );
      this.raycaster ??= new THREE.Raycaster();
      this.raycaster.setFromCamera(pointer, this.camera);
      const intersections = this.raycaster.intersectObjects(this.planetMeshes, false);
      if (intersections.length) this.onPlanetPick(intersections[0].object.parent.userData.planetId);
    }
  }

  pointerMove(event) {
    if (this.mode !== 'landing' || this.paused) return;
    if (document.pointerLockElement === this.canvas) {
      this.cameraYaw -= event.movementX * 0.0022;
      this.cameraPitch = clamp(this.cameraPitch - event.movementY * 0.0018, -0.92, 0.92);
    } else if (this.dragging) {
      const dx = event.clientX - this.lastPointer.x;
      const dy = event.clientY - this.lastPointer.y;
      this.lastPointer = { x: event.clientX, y: event.clientY };
      this.cameraYaw -= dx * 0.0048;
      this.cameraPitch = clamp(this.cameraPitch - dy * 0.0035, -0.92, 0.92);
    }
  }

  keyDown(event) {
    if (isTypingTarget(event.target)) return;
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) event.preventDefault();
    this.keys[event.code] = true;
    if (event.repeat || this.mode !== 'landing' || this.paused) return;
    if (event.code === 'KeyE') this.interact();
  }

  keyUp(event) {
    this.keys[event.code] = false;
  }

  setKey(code, isDown) {
    this.keys[code] = isDown;
  }

  setPaused(paused) {
    this.paused = paused;
    if (paused) this.keys = Object.create(null);
  }

  getPlayerPosition() {
    if (!this.player) return null;
    return { x: this.player.position.x, z: this.player.position.z };
  }

  getCameraYaw() {
    return this.cameraYaw;
  }

  nearestResource() {
    if (!this.player) return null;
    let nearest = null;
    let nearestDistance = Infinity;
    for (const node of this.resourceNodes) {
      if (!node.visible || !node.userData.resource) continue;
      const distance = Math.hypot(node.position.x - this.player.position.x, node.position.z - this.player.position.z);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearest = node;
      }
    }
    return nearest ? { node: nearest, distance: nearestDistance } : null;
  }

  interact() {
    if (this.mode !== 'landing' || this.paused) return false;
    const closest = this.nearestResource();
    if (!closest || closest.distance > 5.7) return false;
    const { id, type } = closest.node.userData.resource;
    closest.node.visible = false;
    this.onResourceCollect({ id, type, planetId: this.planet.id });
    this.lastNearbyId = null;
    this.onNearbyChange(null);
    return true;
  }

  scan() {
    if (this.mode !== 'landing' || this.paused) return { ok: false, reason: 'paused' };
    const now = performance.now();
    if (now < this.scanCooldownUntil) return { ok: false, remaining: Math.ceil((this.scanCooldownUntil - now) / 1000) };
    this.scanCooldownUntil = now + 18000;
    this.scanUntil = now + 7500;
    const waveMaterial = new THREE.MeshBasicMaterial({ color: this.planet.palette.accent, transparent: true, opacity: 0.48, side: THREE.DoubleSide, depthWrite: false });
    const wave = new THREE.Mesh(new THREE.RingGeometry(0.95, 1.03, 96), waveMaterial);
    wave.rotation.x = -Math.PI / 2;
    wave.position.set(this.player.position.x, this.groundAt(this.player.position.x, this.player.position.z) + 0.16, this.player.position.z);
    wave.userData.createdAt = now;
    this.root.add(wave);
    this.scanWave = wave;
    const count = this.resourceNodes.filter((node) => node.visible).length;
    for (const node of this.resourceNodes) {
      const ring = node.userData.resource?.ring;
      if (ring) ring.material.opacity = 0.58;
    }
    this.onScan({ count, cooldown: 18 });
    return { ok: true, count };
  }

  updateLanding(delta) {
    if (!this.player) return;
    const forwardInput = (this.keys.KeyW || this.keys.ArrowUp ? 1 : 0) - (this.keys.KeyS || this.keys.ArrowDown ? 1 : 0);
    const sideInput = (this.keys.KeyD || this.keys.ArrowRight ? 1 : 0) - (this.keys.KeyA || this.keys.ArrowLeft ? 1 : 0);
    const moving = forwardInput !== 0 || sideInput !== 0;
    const sprinting = Boolean(this.keys.ShiftLeft || this.keys.ShiftRight);
    if (moving) {
      const length = Math.hypot(forwardInput, sideInput);
      const forward = new THREE.Vector3(-Math.sin(this.cameraYaw), 0, -Math.cos(this.cameraYaw));
      const right = new THREE.Vector3(Math.cos(this.cameraYaw), 0, -Math.sin(this.cameraYaw));
      const speed = sprinting ? 6.4 : 3.65;
      this.player.position.x += (forward.x * forwardInput + right.x * sideInput) / length * speed * delta;
      this.player.position.z += (forward.z * forwardInput + right.z * sideInput) / length * speed * delta;
      this.player.position.x = clamp(this.player.position.x, -211, 211);
      this.player.position.z = clamp(this.player.position.z, -211, 211);
    }

    const ground = this.groundAt(this.player.position.x, this.player.position.z);
    const localGravity = Number.parseFloat(this.planet.gravity.replace(',', '.')) || 1;
    const gravity = clamp(localGravity, 0.05, 2.5) * 9.81;
    const onGround = this.player.position.y <= ground + 0.045;
    if (this.keys.Space && onGround) {
      this.playerVelocityY = Math.sqrt(2 * gravity * 0.78);
      this.keys.Space = false;
    }
    this.playerVelocityY -= gravity * delta;
    this.player.position.y += this.playerVelocityY * delta;
    if (this.player.position.y < ground) {
      this.player.position.y = ground;
      this.playerVelocityY = 0;
    }

    this.walkClock += delta * (sprinting ? 9.4 : 6.4);
    const cycle = moving && onGround ? Math.sin(this.walkClock) : 0;
    const bob = moving && onGround ? Math.abs(Math.sin(this.walkClock * 2)) * 0.018 : 0;
    this.camera.position.set(this.player.position.x, this.player.position.y + 1.68 + bob, this.player.position.z);
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.set(
      this.cameraPitch + (moving && onGround ? Math.sin(this.walkClock * 2) * 0.004 : 0),
      this.cameraYaw + (moving && onGround ? cycle * 0.006 : 0),
      moving && onGround ? -cycle * 0.004 : 0,
    );
    if (this.viewModel) {
      this.viewModel.position.set(0, -Math.abs(cycle) * 0.012, 0);
      this.viewModel.rotation.set(-cycle * 0.012, cycle * 0.009, -cycle * 0.014);
      const scannerLight = this.viewModel.userData.scannerLight;
      if (scannerLight) scannerLight.material.emissiveIntensity = 0.42 + (Math.sin(this.elapsed * 2.8) + 1) * 0.16;
    }

    this.nearbyTimer += delta;
    if (this.nearbyTimer > 0.14) {
      this.nearbyTimer = 0;
      const nearest = this.nearestResource();
      const payload = nearest && nearest.distance < 5.1
        ? { type: nearest.node.userData.resource.type, id: nearest.node.userData.resource.id, distance: nearest.distance }
        : null;
      const payloadId = payload ? `${payload.type}-${payload.id}` : null;
      if (payloadId !== this.lastNearbyId) {
        this.lastNearbyId = payloadId;
        this.onNearbyChange(payload);
      }
    }

    const now = performance.now();
    for (const node of this.resourceNodes) {
      if (!node.visible || !node.userData.resource) continue;
      const ring = node.userData.resource.ring;
      const active = now < this.scanUntil;
      ring.material.opacity = active ? 0.46 + Math.sin(now * 0.009 + node.position.x) * 0.1 : 0.06;
      const pulse = 1 + Math.sin(now * 0.0025 + node.position.z) * 0.035;
      ring.scale.setScalar(pulse);
    }
    if (this.scanWave) {
      const age = (now - this.scanWave.userData.createdAt) / 1500;
      if (age >= 1) {
        this.root.remove(this.scanWave);
        this.scanWave.geometry.dispose();
        this.scanWave.material.dispose();
        this.scanWave = null;
      } else {
        this.scanWave.scale.setScalar(1 + age * 100);
        this.scanWave.material.opacity = (1 - age) * 0.42;
      }
    }
  }

  frame() {
    const delta = Math.min(this.clock.getDelta(), 0.05);
    this.elapsed += delta;
    if (this.mode === 'menu') {
      if (this.menuPlanet) this.menuPlanet.rotation.y += delta * 0.018;
      if (this.menuMoon) this.menuMoon.rotation.y += delta * 0.11;
    }
    if (this.mode === 'system' || this.mode === 'orbit') {
      for (const record of this.orbiters) {
        record.angle += delta * record.speed;
        const { group, distance, angle } = record;
        group.position.set(Math.cos(angle) * distance, Math.sin(angle * 0.68) * 0.16, Math.sin(angle) * distance);
        group.rotation.y += delta * 0.025;
      }
      for (const record of this.moonOrbiters) {
        record.angle += delta * record.speed;
        record.group.position.set(Math.cos(record.angle) * record.distance, 0.03, Math.sin(record.angle) * record.distance);
        record.group.rotation.y += delta * 0.018;
      }
    }
    if (this.mode === 'landing' && !this.paused) {
      if (this.surfaceKeyLight) {
        const angle = this.elapsed * 0.012 + 0.46;
        const x = Math.sin(angle) * 270;
        const z = -Math.cos(angle) * 270;
        const y = 84 + Math.sin(angle * 0.55) * 38;
        this.surfaceKeyLight.position.set(x, y, z);
        if (this.surfaceSun) this.surfaceSun.position.set(x, y, z);
      }
      this.updateLanding(delta);
    }
    this.onFrame(delta);
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(() => this.frame());
  }
}
