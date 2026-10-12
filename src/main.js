import '@fontsource/manrope/400.css';
import '@fontsource/manrope/500.css';
import '@fontsource/manrope/600.css';
import '@fontsource/manrope/700.css';
import '@fontsource/dm-mono/400.css';
import '@fontsource/dm-mono/500.css';
import './styles.css';
import './override.css';
import './low-end.css';
import { SOLAR_SYSTEM, KNOWN_SYSTEMS, RESOURCE_INFO, RESOURCE_REQUIREMENTS, generateProceduralSystem, getPlanet } from './data.js';
import { World } from './world.js';

const SAVE_KEY = 'perigee-save-v2';
const uiRoot = document.querySelector('#ui-root');
const canvas = document.querySelector('#world-canvas');
const toastStack = document.querySelector('#toast-stack');

let world = null;
let activeSystem = SOLAR_SYSTEM;
let screen = 'menu';
let selectedPlanet = getPlanet('mars');
let run = null;
let modal = null;
let loadingError = false;
let nearbyResource = null;
let hudTimer = 0;
let saveTimer = 0;
let toastId = 0;
let quality = 'balanced';

function publishSystem() {
  window.__perigeeSystemData = activeSystem;
  window.__perigeePlanets = activeSystem.bodies;
  window.__perigeeSelectedPlanet = selectedPlanet?.id ?? null;
}
publishSystem();

function activePlanet(id) {
  return activeSystem.bodies.find((planet) => planet.id === id)
    ?? activeSystem.bodies.find((planet) => planet.id === 'mars')
    ?? activeSystem.bodies.find((planet) => planet.landable)
    ?? SOLAR_SYSTEM.bodies.find((planet) => planet.id === 'mars');
}

const icon = (name, size = 18) => {
  const paths = {
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    chevron: '<path d="m9 18 6-6-6-6"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    pause: '<path d="M8 5v14M16 5v14"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.7a8 8 0 0 1-1.6.9l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.6-.9l-1.7.7-1.4-2.4L7.5 15a8 8 0 0 1 0-1.9L6.1 12l1.4-2.4 1.7.7a8 8 0 0 1 1.6-.9l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.6.9l1.7-.7 1.4 2.4-1.4 1.1a8 8 0 0 1-.1 1.9Z"/>',
    scan: '<circle cx="11" cy="11" r="6"/><path d="m16 16 4 4M11 8v6M8 11h6"/>',
    home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1V10Z"/>',
    orbit: '<circle cx="12" cy="12" r="2"/><ellipse cx="12" cy="12" rx="9" ry="4.5" transform="rotate(-35 12 12)"/>',
  };
  return `<svg aria-hidden="true" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${paths[name] ?? paths.orbit}</svg>`;
};

function brandMark() {
  return '<span class="brand-mark" aria-hidden="true"><svg viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="12.2" stroke="currentColor" stroke-opacity=".65"/><ellipse cx="16" cy="16" rx="14" ry="5.7" transform="rotate(-32 16 16)" stroke="currentColor"/><circle cx="16" cy="16" r="2.4" fill="currentColor"/></svg></span>';
}

function getSavedRun() {
  try {
    const value = localStorage.getItem(SAVE_KEY);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

function restoreSystem(record) {
  if (record?.systemType === 'procedural' && Number.isFinite(record.systemSeed)) {
    activeSystem = generateProceduralSystem(record.systemSeed);
  } else if (record?.systemType === 'known') {
    activeSystem = KNOWN_SYSTEMS.find((system) => system.id === record.systemId) ?? SOLAR_SYSTEM;
  } else {
    activeSystem = SOLAR_SYSTEM;
  }
  publishSystem();
}

function makeNewRun() {
  return {
    systemType: activeSystem.type ?? (activeSystem.generated ? 'procedural' : 'solar'),
    systemId: activeSystem.id,
    systemSeed: activeSystem.generated ? activeSystem.seed : activeSystem.seed ?? SOLAR_SYSTEM.seed,
    planetId: null,
    location: 'system',
    resources: { iron: 0, crystal: 0, ice: 0 },
    shipReady: false,
    oxygen: 100,
    health: 100,
    battery: 100,
    seconds: 0,
    position: null,
    cameraYaw: 0,
    collectedByPlanet: {},
    visited: [],
  };
}

function normalizeRun(raw) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const resources = source.resources && typeof source.resources === 'object' ? source.resources : {};
  const collectedByPlanet = source.collectedByPlanet && typeof source.collectedByPlanet === 'object' ? source.collectedByPlanet : {};
  const position = source.position && Number.isFinite(source.position.x) && Number.isFinite(source.position.z)
    ? { x: Math.max(-205, Math.min(205, source.position.x)), z: Math.max(-205, Math.min(205, source.position.z)) }
    : null;
  return {
    ...makeNewRun(),
    systemType: activeSystem.type ?? (activeSystem.generated ? 'procedural' : 'solar'),
    systemId: activeSystem.id,
    systemSeed: activeSystem.generated ? activeSystem.seed : activeSystem.seed ?? SOLAR_SYSTEM.seed,
    planetId: activeSystem.bodies.some((planet) => planet.id === source.planetId) ? source.planetId : null,
    location: source.location === 'orbit' ? 'orbit' : 'surface',
    resources: {
      iron: Math.max(0, Number(resources.iron) || 0),
      crystal: Math.max(0, Number(resources.crystal) || 0),
      ice: Math.max(0, Number(resources.ice) || 0),
    },
    shipReady: Boolean(source.shipReady),
    oxygen: Math.max(0, Math.min(100, Number(source.oxygen ?? 100) || 0)),
    health: Math.max(0, Math.min(100, Number(source.health ?? 100) || 0)),
    battery: Math.max(0, Math.min(100, Number(source.battery ?? 100) || 0)),
    seconds: Math.max(0, Number(source.seconds) || 0),
    position,
    cameraYaw: Number.isFinite(source.cameraYaw) ? source.cameraYaw : 0,
    collectedByPlanet: Object.fromEntries(Object.entries(collectedByPlanet).map(([key, values]) => [key, Array.isArray(values) ? values.filter(Number.isInteger) : []])),
    visited: Array.isArray(source.visited) ? source.visited.filter((id) => activeSystem.bodies.some((planet) => planet.id === id)) : [],
  };
}

function saveRun() {
  if (!run || !run.planetId) return;
  if (world && screen === 'landing') {
    run.position = world.getPlayerPosition();
    run.cameraYaw = world.getCameraYaw();
    run.location = 'surface';
  }
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(run));
  } catch {
    // Browser storage is optional; the current run remains playable.
  }
}

function formatTime(seconds) {
  const total = Math.floor(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function formatMass(massEarth) {
  if (!Number.isFinite(massEarth)) return '—';
  const value = massEarth < 0.001
    ? massEarth.toExponential(1).replace('.', ',')
    : massEarth.toLocaleString('ru-RU', { maximumFractionDigits: 3 });
  return `${value} M⊕`;
}

function planetEntry(planet) {
  const active = selectedPlanet.id === planet.id;
  const isMoon = Boolean(planet.parentId);
  return `<button class="body-entry ${active ? 'is-selected' : ''} ${isMoon ? 'is-moon' : ''} ${planet.landable ? '' : 'is-unlandable'}" data-action="select-planet" data-planet="${planet.id}" style="--world-tint:${planet.palette.accent}" aria-pressed="${active}">
    <span class="body-entry-orb ${planet.bodyClass === 'gas' || planet.bodyClass === 'ice-giant' ? 'is-gas' : ''}"></span>
    <span class="body-entry-name"><b>${planet.name}</b><small>${planet.parentId ? `↳ ${activePlanet(planet.parentId).name}` : planet.designation}</small></span>
    <span class="body-entry-temp">${planet.temperature}°</span>
  </button>`;
}

function renderHome() {
  const saved = getSavedRun();
  const savedSystem = saved?.systemType === 'procedural' && Number.isFinite(saved.systemSeed)
    ? generateProceduralSystem(saved.systemSeed)
    : saved?.systemType === 'known'
      ? KNOWN_SYSTEMS.find((system) => system.id === saved.systemId) ?? SOLAR_SYSTEM
      : SOLAR_SYSTEM;
  const savedWorld = saved?.planetId ? savedSystem.bodies.find((planet) => planet.id === saved.planetId) : null;
  return `<section class="screen home-screen real-home" aria-label="Главное меню">
    <header class="topbar home-topbar">
      <a class="brand" href="#" data-action="back-home" aria-label="ПЕРИГЕЛИЙ">${brandMark()}<span class="brand-copy"><strong>ПЕРИГЕЛИЙ</strong><small>СИСТЕМА СОЛ · 01</small></span></a>
      <div class="home-top-right"><span class="solar-clock">ЗЕМЛЯ <i>·</i> 1 а.е.</span><button class="icon-button" data-action="settings" aria-label="Настройки">${icon('settings', 16)}</button></div>
    </header>
    <div class="home-copy">
      <div class="eyebrow"><span class="eyebrow-index">СОЛ · III</span><span>НАЧАЛО ЭКСПЕДИЦИИ</span></div>
      <h1>МИР<br><em>ЗА МИРОМ.</em></h1>
      <p class="home-intro">Реальная Солнечная система. Планеты и спутники — по известным орбитам и измерениям. Незнакомые системы — по законам физики.</p>
      <div class="home-actions"><button class="button button-primary" data-action="new-expedition"><span>Выбрать место высадки</span>${icon('arrow', 17)}</button>${savedWorld ? `<button class="button button-quiet" data-action="continue">Продолжить · ${savedWorld.name}</button>` : ''}</div>
      <div class="home-note"><span class="home-note-line"></span><span>МАРС / 225 МЛН КМ ОТ СОЛНЦА / НОВАЯ ЭКСПЕДИЦИЯ</span></div>
    </div>
    <footer class="home-footer"><span>ПЕРИГЕЛИЙ <i>·</i> НАУЧНО-ФАНТАСТИЧЕСКОЕ ВЫЖИВАНИЕ</span><span>ФАКТИЧЕСКИЕ ДАННЫЕ / ПРОЦЕДУРНЫЕ МИРЫ</span></footer>
    ${renderModal()}
  </section>`;
}

function renderSystem() {
  const isOrbit = screen === 'orbit';
  const planet = selectedPlanet;
  const parent = planet.parentId ? activePlanet(planet.parentId) : null;
  const altitude = planet.orbitAU ? `${planet.orbitAU.toFixed(3).replace('.', ',')} а.е.` : `${parent?.name ?? 'ОРБИТА'} · спутник`;
  const isGenerated = activeSystem.generated;
  const isKnown = activeSystem.type === 'known';
  const visits = run?.visited?.includes(planet.id);
  const surfaceLabel = planet.modelOnly ? 'МОДЕЛИРУЕМАЯ ПОВЕРХНОСТЬ' : 'ДОСТУПНО ДЛЯ ВЫСАДКИ';
  const cta = planet.landable
    ? `<button class="button button-primary planet-cta" data-action="land"><span>${isOrbit ? 'Курс на объект' : planet.modelOnly ? 'Модельная высадка' : 'Начать высадку'}</span>${icon('arrow', 17)}</button>`
    : `<div class="no-surface"><span>⊘</span><span>ТВЁРДОЙ ПОВЕРХНОСТИ НЕТ</span></div><p class="moon-hint">Выбери один из спутников в списке слева.</p>`;
  const sourceTabs = isOrbit
    ? `<div class="source-readout">ОРБИТА · ${activeSystem.name}</div>`
    : `<nav class="system-source-tabs" aria-label="Каталог систем">
        <button class="${activeSystem.type === 'solar' ? 'is-active' : ''}" data-action="solar-system">СОЛ</button>
        <button class="${activeSystem.id === 'proxima-centauri' ? 'is-active' : ''}" data-action="known-system" data-system="proxima-centauri">PROXIMA</button>
        <button class="${activeSystem.id === 'trappist-1' ? 'is-active' : ''}" data-action="known-system" data-system="trappist-1">TRAPPIST-1</button>
        <button class="${activeSystem.id === 'kepler-186' ? 'is-active' : ''}" data-action="known-system" data-system="kepler-186">KEPLER</button>
        <button class="${isGenerated ? 'is-active' : ''}" data-action="generate-system">СИНТЕЗ</button>
      </nav>`;
  return `<section class="screen system-screen solar-screen ${isOrbit ? 'is-orbit' : ''}" aria-label="Астрономическая карта">
    <header class="topbar system-topbar">
      <a class="brand" href="#" data-action="back-home" aria-label="В главное меню">${brandMark()}<span class="brand-copy"><strong>ПЕРИГЕЛИЙ</strong><small>НАВИГАЦИОННАЯ КАРТА</small></span></a>
      <div class="system-heading"><b>${activeSystem.name}</b><small>${activeSystem.subtitle}</small></div>
      <div class="topbar-right">${isOrbit ? '<span class="ship-ready-tag"><i></i> КАПСУЛА ГОТОВА</span>' : ''}<button class="icon-button" data-action="settings" aria-label="Настройки">${icon('settings', 16)}</button></div>
    </header>

    <aside class="body-browser">
      <div class="browser-kicker">${isGenerated ? 'ФИЗИЧЕСКАЯ МОДЕЛЬ' : isKnown ? 'ИЗВЕСТНАЯ ЭКЗОСИСТЕМА' : 'СОЛНЕЧНАЯ СИСТЕМА · НАБЛЮДЕНИЯ'}</div>
      <h1>${isGenerated ? 'Новый<br>сектор.' : isKnown ? activeSystem.name : 'Солнечная<br>система.'}</h1>
      <p class="browser-caption">${isGenerated ? `Звезда ${activeSystem.star.spectralClass}. Орбиты и температуры рассчитаны по физической модели.` : isKnown ? activeSystem.description : 'Изученные планеты и спутники. Газовые гиганты показаны без выдуманной поверхности.'}</p>
      ${sourceTabs}
      <div class="body-list-label"><span>ОБЪЕКТЫ</span><span>${String(activeSystem.bodies.length).padStart(2, '0')}</span></div>
      <nav class="body-list" aria-label="Небесные тела">${activeSystem.bodies.map(planetEntry).join('')}</nav>
      ${isOrbit ? `<div class="system-tools"><button class="system-tool-button" data-action="stay">${icon('home', 14)}<span>Вернуться на ${activePlanet(run?.planetId).name}</span></button></div>` : `<div class="catalog-note">ИСТОЧНИКИ: НАБЛЮДЕНИЯ / МОДЕЛИ</div>`}
    </aside>

    <aside class="planet-detail" style="--planet-accent:${planet.palette.accent}">
      <div class="planet-detail-head"><span class="micro-label">${planet.designation}</span><span class="planet-risk">${visits ? 'ПОСЕЩЁН' : planet.landable ? surfaceLabel : 'ГАЗОВАЯ ОБОЛОЧКА'}</span></div>
      <h2>${planet.name}</h2>
      <p class="planet-kind">${planet.type}</p>
      <p class="planet-summary">${planet.summary}</p>
      <div class="planet-stat-grid">
        <div><small>СРЕДНЯЯ ТЕМПЕРАТУРА</small><b>${planet.temperature} <sup>°C</sup></b></div>
        <div><small>УСКОРЕНИЕ СВОБОДНОГО ПАДЕНИЯ</small><b>${planet.gravity}</b></div>
        <div><small>СРЕДНИЙ РАДИУС</small><b>${planet.radius}</b></div>
        <div><small>МАССА ${planet.massLabel ? `· ${planet.massLabel.toUpperCase()}` : ''}</small><b>${formatMass(planet.massEarth)}</b></div>
        <div><small>ДАВЛЕНИЕ</small><b>${planet.pressure}</b></div>
        <div><small>ОРБИТА</small><b>${altitude}</b></div>
        <div><small>ПЕРИОД ВРАЩЕНИЯ</small><b>${planet.rotationHours < 48 ? `${planet.rotationHours} ч` : `${(planet.rotationHours / 24).toFixed(1)} сут`}</b></div>
      </div>
      <div class="planet-atmosphere"><span class="atmo-icon">◌</span><span><small>СОСТАВ / ПОВЕРХНОСТЬ</small><b>${planet.atmosphere}</b></span></div>
      <div class="planet-hazard"><span class="hazard-mark">!</span><span><small>УСЛОВИЯ</small><b>${planet.hazard}</b></span></div>
      ${planet.dataStatus ? `<p class="model-disclaimer">${planet.dataStatus}</p>` : isGenerated ? '<p class="model-disclaimer">МОДЕЛЬНЫЕ ПАРАМЕТРЫ · НЕ КАТАЛОГ РЕАЛЬНЫХ НАБЛЮДЕНИЙ</p>' : ''}
      ${cta}
      ${isOrbit && run?.planetId && run.planetId !== planet.id && planet.landable ? `<button class="button button-quiet return-surface" data-action="stay">${icon('home', 14)}<span>Назад на ${activePlanet(run.planetId).name}</span></button>` : ''}
    </aside>

    <div class="map-scale-note"><span>${activeSystem.star.name} <b>·</b> ${activeSystem.star.spectralClass ?? activeSystem.star.spectral}</span><i></i><span>ОРБИТЫ СЖАТЫ ДЛЯ ЧИТАЕМОСТИ</span><i></i><span>ДАННЫЕ: ${isGenerated ? 'ФИЗИЧЕСКАЯ МОДЕЛЬ' : isKnown ? 'ЭКЗОПЛАНЕТНЫЕ НАБЛЮДЕНИЯ' : 'СОЛНЕЧНАЯ СИСТЕМА'}</span></div>
    ${renderModal()}
  </section>`;
}

function renderLanding() {
  const planet = activePlanet(run?.planetId);
  const collected = run?.resources ?? { iron: 0, crystal: 0, ice: 0 };
  const repaired = Boolean(run?.shipReady);
  return `<section class="screen fps-screen" aria-label="Высадка на ${planet.name}">
    <header class="fps-header">
      <div class="fps-location"><span class="location-signal"></span><span><b id="planet-name">${planet.name}</b><small id="planet-id">${planet.designation} / ПОВЕРХНОСТЬ</small></span></div>
      <div class="fps-time"><span>ЛОКАЛЬНОЕ ВРЕМЯ</span><b id="game-clock">00:00:00</b><small>${planet.temperature} °C <i>·</i> ${planet.gravity}</small></div>
      <button class="fps-pause" data-action="pause" aria-label="Пауза">${icon('pause', 15)}<span>ESC</span></button>
    </header>

    <div class="fps-objective"><span class="objective-dot"></span><span class="objective-label">${repaired ? 'ЗАДАЧА ВЫПОЛНЕНА' : 'АВАРИЙНЫЙ ПРОТОКОЛ'}</span><b id="objective-title">${repaired ? 'Капсула готова к запуску' : 'Восстанови посадочный модуль'}</b><small id="objective-progress">Fe ${Math.min(collected.iron, 3)}/3 <i>·</i> Si ${Math.min(collected.crystal, 2)}/2</small></div>

    <aside class="survival-readout">
      <div class="readout-heading"><span>СКАФАНДР</span><span id="suit-state">EVA-7 / ACTIVE</span></div>
      <div class="readout-stat"><span>O₂</span><div class="readout-track"><i id="oxygen-fill"></i></div><b id="oxygen-value">100%</b></div>
      <div class="readout-stat"><span>SUIT</span><div class="readout-track"><i id="health-fill"></i></div><b id="health-value">100%</b></div>
      <div class="readout-stat battery-stat"><span>BAT</span><div class="readout-track"><i id="battery-fill"></i></div><b id="battery-value">100%</b></div>
      <button class="oxygen-action" id="oxygen-action" data-action="oxygen">${icon('orbit', 13)}<span>ПЕРЕРАБОТАТЬ ЛЁД</span><small id="ice-count-inline">0 H₂O</small></button>
    </aside>

    <div class="fps-reticle" aria-hidden="true"><i></i><b></b><em></em></div>
    <div class="interact-prompt" id="interact-prompt" hidden></div>

    <div class="fps-actions">
      <div class="resource-line"><span>CARGO</span><b id="iron-count">0</b><small>Fe</small><i>·</i><b id="crystal-count">0</b><small>Si</small><i>·</i><b id="ice-count">0</b><small>H₂O</small></div>
      <div class="action-row">
        <button class="fps-tool-button" data-action="scan">${icon('scan', 16)}<span>СКАНИРОВАТЬ</span><kbd>R</kbd><small id="scan-state"></small></button>
        <button class="fps-tool-button repair-button" id="repair-action" data-action="repair"><span>ВОССТАНОВИТЬ МОДУЛЬ</span><kbd>F</kbd></button>
        <button class="fps-tool-button launch-button" id="launch-action" data-action="launch"><span>ВЫХОД НА ОРБИТУ</span>${icon('arrow', 15)}</button>
      </div>
    </div>

    <div class="fps-control-note"><span><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> ДВИЖЕНИЕ</span><span><kbd>SHIFT</kbd> БЕГ</span><span><kbd>E</kbd> ВЗЯТЬ</span><span>МЫШЬ · ОБЗОР</span></div>
    <div class="mobile-controls" aria-label="Сенсорное управление"><div class="touch-dpad"><button data-hold="KeyW" aria-label="Вперёд">▲</button><button data-hold="KeyA" aria-label="Влево">◀</button><button data-hold="KeyS" aria-label="Назад">▼</button><button data-hold="KeyD" aria-label="Вправо">▶</button></div><div class="touch-actions"><button data-hold="Space" aria-label="Прыжок">↑</button><button data-action="interact" aria-label="Взять">E</button></div></div>
    ${renderModal()}
  </section>`;
}

function renderLoading() {
  if (loadingError) {
    return `<section class="screen startup-error load-error" aria-label="Не удалось подготовить высадку"><span class="eyebrow">СИСТЕМА ПОВЕРХНОСТИ</span><h1>Мир не загрузился.</h1><p>Похоже, устройству не хватило ресурсов для подготовки сцены. Включён облегчённый режим; можно попробовать ещё раз или вернуться к карте.</p><div class="startup-error-actions"><button class="button button-primary" data-action="retry-landing">Повторить в лёгком режиме</button><button class="button button-quiet" data-action="return-system">Назад к карте</button></div></section>`;
  }
  return `<section class="screen loading-screen" aria-label="Подготовка к высадке"><div class="loading-core"><div class="loading-orbit loading-orbit-one"></div><div class="loading-orbit loading-orbit-two"></div><span class="loading-core-mark">${brandMark()}</span></div><p class="eyebrow">ОРБИТАЛЬНЫЙ СПУСК</p><h1>${selectedPlanet.name}</h1><p class="loading-message">Подготовка упрощённой сцены <i></i> рельеф и свет <i></i> экипировка</p><div class="loading-track"><i></i></div><small>${activeSystem.name} · ${selectedPlanet.designation}</small></section>`;
}

function renderModal() {
  if (!modal) return '';
  if (modal === 'settings') {
    return `<div class="modal-backdrop" data-action="modal-backdrop"><section class="dialog-card settings-card" role="dialog" aria-modal="true" aria-labelledby="dialog-title"><button class="dialog-close" data-action="close-modal" aria-label="Закрыть">${icon('close')}</button><span class="eyebrow"><span class="eyebrow-index">SYSTEM</span><span>НАСТРОЙКИ</span></span><h2 id="dialog-title">Изображение.</h2><p class="settings-lede">Качество теней и разрешение рендера.</p><div class="setting-row"><span><b>Графика</b><small>Сглаживание и мягкие тени</small></span><div class="quality-switch"><button data-action="quality" data-quality="balanced" class="${quality === 'balanced' ? 'is-selected' : ''}">Баланс</button><button data-action="quality" data-quality="high" class="${quality === 'high' ? 'is-selected' : ''}">Высокая</button></div></div><button class="button button-primary dialog-action" data-action="close-modal"><span>Готово</span>${icon('arrow', 16)}</button></section></div>`;
  }
  if (modal === 'pause') {
    return `<div class="modal-backdrop"><section class="dialog-card pause-card" role="dialog" aria-modal="true" aria-labelledby="dialog-title"><span class="eyebrow"><span class="eyebrow-index">СИГНАЛ ПРИОСТАНОВЛЕН</span></span><h2 id="dialog-title">Передышка.</h2><p>Положение и запасы сохранены.</p><button class="button button-primary dialog-action" data-action="resume"><span>Продолжить</span>${icon('arrow', 16)}</button><button class="button button-quiet pause-home" data-action="quit-home">${icon('home', 14)}<span>В главное меню</span></button></section></div>`;
  }
  return '';
}

function renderScreen() {
  document.body.dataset.screen = screen;
  if (screen === 'menu') uiRoot.innerHTML = renderHome() + renderModal();
  else if (screen === 'system' || screen === 'orbit') uiRoot.innerHTML = renderSystem();
  else if (screen === 'landing') uiRoot.innerHTML = renderLanding();
  else uiRoot.innerHTML = renderLoading();
  if (screen === 'system' || screen === 'orbit') {
    publishSystem();
    world?.setSelectedPlanet(selectedPlanet.id);
  }
  if (screen === 'landing') updateHud();
}

function showToast(title, detail = '', tone = 'normal') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${tone}`;
  toast.innerHTML = `<span class="toast-mark">${tone === 'warning' ? '!' : '·'}</span><span><b>${title}</b>${detail ? `<small>${detail}</small>` : ''}</span>`;
  toastStack.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('is-visible'));
  window.setTimeout(() => {
    toast.classList.remove('is-visible');
    window.setTimeout(() => toast.remove(), 350);
  }, 3200);
}

function beginLanding() {
  if (!selectedPlanet.landable) {
    showToast('Посадка невозможна', 'У этого тела нет твёрдой поверхности. Выбери спутник.', 'warning');
    return;
  }
  if (!run) run = makeNewRun();
  const previousPlanetId = run.planetId;
  const previousPosition = run.position;
  run.planetId = selectedPlanet.id;
  run.location = 'surface';
  run.position = previousPlanetId === selectedPlanet.id ? previousPosition : null;
  run.visited = [...new Set([...(run.visited ?? []), selectedPlanet.id])];
  modal = null;
  loadingError = false;
  nearbyResource = null;
  screen = 'loading';
  renderScreen();
  window.setTimeout(() => {
    if (screen !== 'loading') return;
    try {
      world.showLanding(selectedPlanet, run);
      screen = 'landing';
      renderScreen();
      saveRun();
      showToast(`${selectedPlanet.name} · высадка завершена`, 'Управление камерой — мышью. Для освобождения курсора нажми Esc.');
    } catch (error) {
      console.error('Не удалось загрузить сцену высадки:', error);
      if (quality === 'high') {
        quality = 'balanced';
        try {
          world.setQuality(quality);
          world.showLanding(selectedPlanet, run);
          screen = 'landing';
          renderScreen();
          saveRun();
          showToast('Включён облегчённый режим', 'Высадка запущена с упрощённой графикой.');
          return;
        } catch (fallbackError) {
          console.error('Облегчённый режим тоже не запустился:', fallbackError);
        }
      }
      loadingError = true;
      renderScreen();
      showToast('Не удалось подготовить поверхность', 'Можно попробовать ещё раз или вернуться к карте.', 'warning');
    }
  }, 120);
}

function continueExpedition() {
  const saved = getSavedRun();
  if (!saved) return;
  restoreSystem(saved);
  run = normalizeRun(saved);
  selectedPlanet = activePlanet(run.planetId);
  publishSystem();
  modal = null;
  if (run.location === 'orbit' && run.shipReady) {
    screen = 'orbit';
    world.showSystem(true);
    renderScreen();
    return;
  }
  beginLanding();
}

function updateHud() {
  if (screen !== 'landing' || !run) return;
  const planet = activePlanet(run.planetId);
  const oxygen = Math.max(0, Math.min(100, run.oxygen));
  const health = Math.max(0, Math.min(100, run.health));
  const battery = Math.max(0, Math.min(100, run.battery));
  const repaired = run.shipReady;
  const enough = run.resources.iron >= RESOURCE_REQUIREMENTS.iron && run.resources.crystal >= RESOURCE_REQUIREMENTS.crystal;
  const setText = (id, value) => { const node = document.getElementById(id); if (node) node.textContent = value; };
  const setWidth = (id, value) => { const node = document.getElementById(id); if (node) node.style.width = `${Math.max(0, Math.min(100, value))}%`; };

  setText('planet-name', planet.name);
  setText('planet-id', `${planet.designation} / ПОВЕРХНОСТЬ`);
  setText('game-clock', formatTime(run.seconds));
  setText('objective-label', repaired ? 'ЭКСПЕДИЦИЯ ПРОДОЛЖАЕТСЯ' : 'АВАРИЙНЫЙ ПРОТОКОЛ');
  setText('objective-title', repaired ? 'Капсула готова к запуску' : 'Восстанови посадочный модуль');
  setText('objective-progress', repaired ? 'ОРБИТАЛЬНЫЙ МАРШРУТ РАЗБЛОКИРОВАН' : `Fe ${Math.min(run.resources.iron, 3)}/3  ·  Si ${Math.min(run.resources.crystal, 2)}/2`);
  setText('oxygen-value', `${Math.ceil(oxygen)}%`);
  setText('health-value', `${Math.ceil(health)}%`);
  setText('battery-value', `${Math.ceil(battery)}%`);
  setText('iron-count', Math.floor(run.resources.iron));
  setText('crystal-count', Math.floor(run.resources.crystal));
  setText('ice-count', Math.floor(run.resources.ice));
  setText('ice-count-inline', `${Math.floor(run.resources.ice)} H₂O`);
  setWidth('oxygen-fill', oxygen);
  setWidth('health-fill', health);
  setWidth('battery-fill', battery);

  const repair = document.getElementById('repair-action');
  const launch = document.getElementById('launch-action');
  if (repair) {
    repair.disabled = repaired || !enough;
    repair.classList.toggle('is-ready', !repaired && enough);
    repair.hidden = repaired;
  }
  if (launch) launch.hidden = !repaired;
  const oxygenAction = document.getElementById('oxygen-action');
  if (oxygenAction) oxygenAction.disabled = run.resources.ice < 1 || oxygen >= 99.5;

  const prompt = document.getElementById('interact-prompt');
  if (prompt) {
    if (nearbyResource) {
      const info = RESOURCE_INFO[nearbyResource.type];
      prompt.hidden = false;
      prompt.innerHTML = `<kbd>E</kbd><span>ВЗЯТЬ <b>${info.label.toUpperCase()}</b></span><i>${info.short}</i>`;
    } else prompt.hidden = true;
  }
  const scanState = document.getElementById('scan-state');
  if (scanState && world) {
    scanState.textContent = world.scanCooldownUntil > performance.now()
      ? `${Math.ceil((world.scanCooldownUntil - performance.now()) / 1000)}с`
      : 'ГОТОВ';
  }
}

function onResourceCollect(resource) {
  if (!run || typeof run.resources[resource.type] !== 'number') return;
  run.resources[resource.type] += 1;
  if (!run.collectedByPlanet[resource.planetId]) run.collectedByPlanet[resource.planetId] = [];
  run.collectedByPlanet[resource.planetId].push(resource.id);
  const info = RESOURCE_INFO[resource.type];
  showToast(`${info.label} собраны`, `В контейнере ${run.resources[resource.type]} ${info.short}.`);
  updateHud();
  saveRun();
}

function scanSurface() {
  if (!world || !run || screen !== 'landing') return;
  if (run.battery < 12) {
    showToast('Низкий заряд', 'Сканеру нужно минимум 12% энергии.', 'warning');
    return;
  }
  const result = world.scan();
  if (!result.ok && result.remaining) {
    showToast('Сканер перезаряжается', `Импульс будет готов через ${result.remaining} сек.`, 'warning');
    return;
  }
  if (!result.ok) return;
  run.battery = Math.max(0, run.battery - 12);
  showToast('Импульс сканера', result.count ? `${result.count} залежей отмечено на поверхности.` : 'Залежей в зоне сканирования нет.');
  updateHud();
  saveRun();
}

function repairLander() {
  if (!run || run.shipReady) return;
  if (run.resources.iron < RESOURCE_REQUIREMENTS.iron || run.resources.crystal < RESOURCE_REQUIREMENTS.crystal) {
    showToast('Не хватает деталей', 'Нужно 3 Fe и 2 Si. Отмечай залежи импульсом сканера.', 'warning');
    return;
  }
  run.resources.iron -= RESOURCE_REQUIREMENTS.iron;
  run.resources.crystal -= RESOURCE_REQUIREMENTS.crystal;
  run.shipReady = true;
  showToast('Посадочный модуль восстановлен', 'Тяга и навигация проверены. Орбита доступна.');
  updateHud();
  saveRun();
}

function setSolarSystem() {
  activeSystem = SOLAR_SYSTEM;
  selectedPlanet = activeSystem.bodies.find((planet) => planet.id === 'mars');
  run = makeNewRun();
  publishSystem();
  screen = 'system';
  modal = null;
  world.showSystem(false);
  renderScreen();
}

function makeProceduralSystem() {
  const seed = (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0;
  activeSystem = generateProceduralSystem(seed);
  selectedPlanet = activeSystem.bodies.find((planet) => planet.landable) ?? activeSystem.bodies[0];
  run = makeNewRun();
  publishSystem();
  screen = 'system';
  modal = null;
  world.showSystem(false);
  renderScreen();
  showToast('Экзосистема рассчитана', `${activeSystem.star.spectral} · ${activeSystem.bodies.length} орбитальных тел · модельные данные.`);
}

function actionClick(action, button, event) {
  switch (action) {
    case 'new-expedition':
      activeSystem = SOLAR_SYSTEM;
      selectedPlanet = activeSystem.bodies.find((planet) => planet.id === 'mars');
      run = makeNewRun();
      publishSystem();
      screen = 'system';
      modal = null;
      world.showSystem(false);
      renderScreen();
      break;
    case 'continue':
      continueExpedition();
      break;
    case 'select-planet': {
      const planet = activeSystem.bodies.find((item) => item.id === button.dataset.planet);
      if (planet) {
        selectedPlanet = planet;
        publishSystem();
        renderScreen();
      }
      break;
    }
    case 'land':
      beginLanding();
      break;
    case 'stay':
      if (run?.planetId) {
        selectedPlanet = activePlanet(run.planetId);
        beginLanding();
      }
      break;
    case 'generate-system':
      makeProceduralSystem();
      break;
    case 'solar-system':
      setSolarSystem();
      break;
    case 'retry-landing':
      loadingError = false;
      quality = 'balanced';
      world.setQuality(quality);
      beginLanding();
      break;
    case 'return-system':
      loadingError = false;
      screen = 'system';
      modal = null;
      world.showSystem(false);
      renderScreen();
      break;
    case 'reload-game':
      window.location.reload();
      break;
    case 'known-system': {
      const system = KNOWN_SYSTEMS.find((item) => item.id === button.dataset.system);
      if (!system) break;
      activeSystem = system;
      selectedPlanet = system.bodies.find((planet) => planet.landable) ?? system.bodies[0];
      run = makeNewRun();
      publishSystem();
      screen = 'system';
      modal = null;
      world.showSystem(false);
      renderScreen();
      break;
    }
    case 'back-home':
      if (screen === 'landing') saveRun();
      modal = null;
      screen = 'menu';
      world.showMenu();
      renderScreen();
      break;
    case 'settings':
      modal = 'settings';
      if (screen === 'landing') world.setPaused(true);
      renderScreen();
      break;
    case 'quality':
      quality = button.dataset.quality === 'balanced' ? 'balanced' : 'high';
      world.setQuality(quality);
      renderScreen();
      break;
    case 'close-modal':
      modal = null;
      if (screen === 'landing') world.setPaused(false);
      renderScreen();
      break;
    case 'modal-backdrop':
      if (event.target === button) {
        modal = null;
        if (screen === 'landing') world.setPaused(false);
        renderScreen();
      }
      break;
    case 'pause':
      modal = 'pause';
      world.setPaused(true);
      if (document.pointerLockElement === canvas) document.exitPointerLock?.();
      saveRun();
      renderScreen();
      break;
    case 'resume':
      modal = null;
      world.setPaused(false);
      renderScreen();
      break;
    case 'quit-home':
      saveRun();
      modal = null;
      screen = 'menu';
      world.setPaused(false);
      world.showMenu();
      renderScreen();
      break;
    case 'scan':
      scanSurface();
      break;
    case 'interact':
      if (!world.interact()) showToast('Ничего рядом', 'Подойди к отмеченному объекту.', 'warning');
      break;
    case 'repair':
      repairLander();
      break;
    case 'launch':
      if (!run?.shipReady) return;
      saveRun();
      run.location = 'orbit';
      screen = 'orbit';
      modal = null;
      world.showSystem(true);
      renderScreen();
      showToast('Орбита достигнута', 'Выбери следующий мир или вернись на поверхность.');
      saveRun();
      break;
    case 'oxygen':
      if (!run || run.resources.ice < 1 || run.oxygen >= 99.5) return;
      run.resources.ice -= 1;
      run.oxygen = Math.min(100, run.oxygen + 38);
      showToast('Регенерация кислорода', 'Один контейнер льда переработан скафандром.');
      updateHud();
      saveRun();
      break;
    default:
      break;
  }
}

uiRoot.addEventListener('click', (event) => {
  const button = event.target.closest('[data-action]');
  if (!button || button.disabled || button.getAttribute('aria-disabled') === 'true') return;
  actionClick(button.dataset.action, button, event);
});
uiRoot.addEventListener('pointerdown', (event) => {
  const control = event.target.closest('[data-hold]');
  if (!control || !world) return;
  event.preventDefault();
  world.setKey(control.dataset.hold, true);
});

function releaseTouchControls() {
  if (!world) return;
  for (const code of ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space']) world.setKey(code, false);
}
window.addEventListener('pointerup', releaseTouchControls);
window.addEventListener('pointercancel', releaseTouchControls);
window.addEventListener('blur', releaseTouchControls);

window.addEventListener('keydown', (event) => {
  if (event.code === 'Escape' && screen === 'landing') {
    event.preventDefault();
    if (modal === 'pause') {
      modal = null;
      world.setPaused(false);
    } else {
      modal = 'pause';
      world.setPaused(true);
      if (document.pointerLockElement === canvas) document.exitPointerLock?.();
      saveRun();
    }
    renderScreen();
  } else if (event.code === 'Escape' && modal) {
    modal = null;
    if (screen === 'landing') world.setPaused(false);
    renderScreen();
  } else if (event.code === 'KeyF' && screen === 'landing' && !modal) {
    repairLander();
  } else if (event.code === 'KeyR' && screen === 'landing' && !modal) {
    scanSurface();
  }
});

function tickGame(delta) {
  if (screen !== 'landing' || !run || modal === 'pause' || modal === 'settings') return;
  const planet = activePlanet(run.planetId);
  const temperature = Number.parseFloat(String(planet.temperature).replace('−', '-')) || 0;
  const thermalStress = Math.max(0, Math.abs(temperature) - 90) / 600;
  const lowPressureStress = planet.pressure.includes('бар') && parseFloat(planet.pressure.replace(',', '.')) < 0.1 ? 0.012 : 0;
  const sprintStress = world?.keys?.ShiftLeft || world?.keys?.ShiftRight ? 0.012 : 0;
  run.seconds += delta;
  run.oxygen = Math.max(0, run.oxygen - delta * (0.027 + (run.oxygen < 30 ? 0.016 : 0)));
  run.battery = Math.max(0, run.battery - delta * (0.0018 + thermalStress * 0.008 + sprintStress));
  run.health = Math.max(0, run.health - delta * (thermalStress * 0.018 + lowPressureStress));
  if (run.oxygen <= 0) run.health = Math.max(0, run.health - delta * 0.14);
  if (run.health <= 0) {
    run.health = 48;
    run.oxygen = 30;
    run.position = { x: 0, z: 3 };
    if (world?.player && world.groundAt) world.player.position.set(0, world.groundAt(0, 3), 3);
    showToast('Аварийная стабилизация', 'Скафандр вернул тебя к капсуле. Проверь кислород и заряд.', 'warning');
  }
  hudTimer += delta;
  saveTimer += delta;
  if (hudTimer >= 0.3) { hudTimer = 0; updateHud(); }
  if (saveTimer >= 8) { saveTimer = 0; saveRun(); }
}

function onPlanetPick(planetId) {
  const planet = activeSystem.bodies.find((item) => item.id === planetId);
  if (!planet) return;
  selectedPlanet = planet;
  publishSystem();
  renderScreen();
}

function showStartupError(error) {
  console.error('Не удалось запустить 3D-движок:', error);
  document.body.dataset.screen = 'startup-error';
  canvas.style.display = 'none';
  uiRoot.innerHTML = `<section class="screen startup-error" aria-label="Ошибка запуска"><span class="eyebrow">ПЕРИГЕЛИЙ · ЗАПУСК</span><h1>3D-сцена не запустилась.</h1><p>Проверьте, что в браузере включено аппаратное ускорение и поддерживается WebGL. Закройте другие тяжёлые вкладки и попробуйте перезагрузить игру.</p><button class="button button-primary" data-action="reload-game">Перезагрузить</button></section>`;
}

renderScreen();
try {
  world = new World(canvas);
  world.onPlanetPick = onPlanetPick;
  world.onContextLost = () => showStartupError(new Error('WebGL context lost: GPU memory limit reached.'));
  world.onResourceCollect = onResourceCollect;
  world.onNearbyChange = (resource) => { nearbyResource = resource; updateHud(); };
  world.onFrame = tickGame;
  world.setQuality(quality);
} catch (error) {
  world = null;
  showStartupError(error);
}
