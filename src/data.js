const palette = (ocean, land, high, ice, sky, soil, rock, accent, atmosphere, extra = {}) => ({
  ocean, land, high, ice, sky, soil, rock, accent, atmosphere, ...extra,
});

const body = (data) => ({
  hasOcean: false,
  bodyClass: 'rocky',
  landable: true,
  terrainScale: 1,
  albedo: 0.25,
  water: '—',
  ...data,
});

export const SOLAR_SYSTEM = {
  id: 'solar',
  type: 'solar',
  name: 'СОЛНЕЧНАЯ СИСТЕМА',
  subtitle: 'СОЛ · 4,6 МЛРД ЛЕТ',
  seed: 0x5a17,
  star: { name: 'Солнце', spectralClass: 'G2 V', temperatureK: 5772, luminosity: 1, colour: '#fff1cc', radius: 2.55 },
  bodies: [
    body({
      id: 'mercury', name: 'МЕРКУРИЙ', designation: 'СОЛ · I', className: 'Планета земной группы', type: 'Каменистая планета',
      summary: 'Ближайший к Солнцу мир. Почти лишён атмосферы: днём поверхность раскаляется, а ночью быстро остывает.',
      temperature: '+167', temperatureRange: '−180…+430', gravity: '0,38 g', pressure: '< 10⁻¹⁵ бар', radius: '2 440 км',
      radiusKm: 2440, massEarth: 0.055, radiusEarth: 0.383, atmosphere: 'Экзосфера: O · Na · H · He', water: 'Лёд в полярных тенях',
      hazard: 'Вакуум · тепловой перепад', severity: 'Экстремальный риск', orbitAU: 0.387, orbitalPeriod: 87.97, rotationHours: 1407.6,
      palette: palette('#17191d', '#77736b', '#cbc5b5', '#e3e0d7', '#131820', '#5c5952', '#807d76', '#d6b582', '#b1bbc8'),
      seed: 101, terrainScale: 1.12, albedo: 0.12, hasCraters: true,
    }),
    body({
      id: 'venus', name: 'ВЕНЕРА', designation: 'СОЛ · II', className: 'Планета земной группы', type: 'Каменистая планета',
      summary: 'Плотная атмосфера из углекислого газа удерживает тепло. Под облаками из серной кислоты — сухая вулканическая поверхность.',
      temperature: '+464', temperatureRange: '+462…+467', gravity: '0,90 g', pressure: '92 бар', radius: '6 052 км',
      radiusKm: 6052, massEarth: 0.815, radiusEarth: 0.949, atmosphere: 'CO₂ 96,5% · N₂ 3,5%', water: 'Следы водяного пара',
      hazard: 'Жара · давление · облака H₂SO₄', severity: 'Экстремальный риск', orbitAU: 0.723, orbitalPeriod: 224.7, rotationHours: 5832.5,
      palette: palette('#4d3428', '#a77a4f', '#d3b17a', '#eee1c2', '#92725b', '#835b3c', '#ab8257', '#f1c084', '#e7bd91'),
      seed: 202, terrainScale: 1.2, albedo: 0.75, hasCraters: false,
    }),
    body({
      id: 'earth', name: 'ЗЕМЛЯ', designation: 'СОЛ · III', className: 'Планета земной группы', type: 'Умеренный водный мир',
      summary: 'Единственный известный мир с устойчивой жидкой водой на поверхности и подтверждённой жизнью. Наш исходный дом.',
      temperature: '+15', temperatureRange: '−89…+57', gravity: '1,00 g', pressure: '1,00 бар', radius: '6 371 км',
      radiusKm: 6371, massEarth: 1, radiusEarth: 1, atmosphere: 'N₂ 78% · O₂ 21% · Ar 0,9%', water: '71% поверхности',
      hazard: 'Среда обитания', severity: 'Низкий риск', orbitAU: 1, orbitalPeriod: 365.256, rotationHours: 23.93,
      palette: palette('#17476c', '#526d42', '#a8a884', '#e8f0ec', '#5f9db9', '#4b6040', '#74806c', '#82d1e8', '#73c9ee'),
      seed: 303, terrainScale: 0.68, albedo: 0.306, hasOcean: true, hasClouds: true,
    }),
    body({
      id: 'moon', name: 'ЛУНА', designation: 'ЗЕМЛЯ · СПУТНИК', className: 'Естественный спутник Земли', type: 'Безатмосферный мир',
      summary: 'Ближайшее к Земле небесное тело. В полярных кратерах постоянно затенённые участки могут хранить водяной лёд.',
      temperature: '−20', temperatureRange: '−173…+127', gravity: '0,165 g', pressure: 'Экзосфера', radius: '1 737 км',
      radiusKm: 1737, massEarth: 0.0123, radiusEarth: 0.273, atmosphere: 'Экзосфера: He · Ne · Ar', water: 'Лёд в полярных кратерах',
      hazard: 'Вакуум · радиация · пыль', severity: 'Высокий риск', parentId: 'earth', moonOrbit: 1.35, orbitalPeriod: 27.32, rotationHours: 655.7,
      palette: palette('#24272c', '#777a7b', '#c6c4ba', '#e5e4de', '#121923', '#5a5b5a', '#858783', '#d3cfbe', '#abb9c7'),
      seed: 404, terrainScale: 0.82, albedo: 0.12, hasCraters: true,
    }),
    body({
      id: 'mars', name: 'МАРС', designation: 'СОЛ · IV', className: 'Планета земной группы', type: 'Холодная пустыня',
      summary: 'Разрежённая CO₂-атмосфера, древние речные долины и полярные шапки. Самый доступный кандидат для длительных экспедиций.',
      temperature: '−65', temperatureRange: '−125…+20', gravity: '0,38 g', pressure: '0,006 бар', radius: '3 390 км',
      radiusKm: 3390, massEarth: 0.107, radiusEarth: 0.532, atmosphere: 'CO₂ 95,3% · N₂ 2,7% · Ar 1,6%', water: 'Лёд под поверхностью и на полюсах',
      hazard: 'Пыль · холод · низкое давление', severity: 'Высокий риск', orbitAU: 1.524, orbitalPeriod: 686.98, rotationHours: 24.62,
      palette: palette('#38231d', '#9b5035', '#d4905f', '#e5d7c0', '#745248', '#7f3d2d', '#a05d41', '#f0a476', '#c68c73'),
      seed: 505, terrainScale: 1.08, albedo: 0.25, hasCraters: true,
    }),
    body({
      id: 'ceres', name: 'ЦЕРЕРА', designation: 'ПОЯС АСТЕРОИДОВ', className: 'Карликовая планета', type: 'Ледяное тело',
      summary: 'Крупнейшее тело главного пояса астероидов. На поверхности обнаружены водосодержащие минералы и яркие солевые отложения.',
      temperature: '−105', temperatureRange: '−143…−33', gravity: '0,029 g', pressure: 'Практически вакуум', radius: '473 км',
      radiusKm: 473, massEarth: 0.00016, radiusEarth: 0.074, atmosphere: 'Следы водяного пара', water: 'Лёд и гидратированные соли',
      hazard: 'Вакуум · микрометеориты', severity: 'Высокий риск', orbitAU: 2.767, orbitalPeriod: 1681.6, rotationHours: 9.07,
      palette: palette('#26282b', '#797c7e', '#c4c6c5', '#e1e3e0', '#111923', '#55595c', '#83888a', '#c5dce3', '#9ab6c2'),
      seed: 606, terrainScale: 0.45, albedo: 0.09, hasCraters: true,
    }),
    body({
      id: 'jupiter', name: 'ЮПИТЕР', designation: 'СОЛ · V', className: 'Газовый гигант', type: 'Газовый гигант', bodyClass: 'gas', landable: false,
      summary: 'Самая массивная планета Солнечной системы. У неё нет твёрдой поверхности: давление и температура растут с глубиной.',
      temperature: '−110', temperatureRange: '−145…−108', gravity: '2,53 g*', pressure: 'Газовая оболочка', radius: '69 911 км',
      radiusKm: 69911, massEarth: 317.8, radiusEarth: 10.97, atmosphere: 'H₂ ~90% · He ~10% · следы CH₄', water: 'Следы водяных облаков',
      hazard: 'Нет поверхности · радиационные пояса', severity: 'Посадка невозможна', orbitAU: 5.204, orbitalPeriod: 4332.6, rotationHours: 9.93,
      palette: palette('#7c5b47', '#c18d69', '#e5c7a0', '#f0dec4', '#111822', '#78553f', '#aa7958', '#e5b895', '#d2ac8f', { bands: ['#a97958', '#e1bd98', '#8e624b', '#d7ad87'] }),
      seed: 707, terrainScale: 1, albedo: 0.503,
    }),
    body({
      id: 'io', name: 'ИО', designation: 'ЮПИТЕР · СПУТНИК', className: 'Вулканический спутник', type: 'Активный вулканический мир', parentId: 'jupiter', moonOrbit: 1.5,
      summary: 'Самое вулканически активное тело Солнечной системы. Приливное нагревание поддерживает сотни вулканических центров.',
      temperature: '−130', temperatureRange: '−160…+20', gravity: '0,183 g', pressure: 'Практически вакуум', radius: '1 822 км',
      radiusKm: 1822, massEarth: 0.015, radiusEarth: 0.286, atmosphere: 'SO₂ разреженная · локальные шлейфы', water: 'Следы связанной серы',
      hazard: 'Вулканические выбросы · радиация', severity: 'Экстремальный риск', orbitalPeriod: 1.77, rotationHours: 42.46,
      palette: palette('#3a281f', '#b78847', '#e0c983', '#f0dc9f', '#281b19', '#806039', '#b69b60', '#f2d887', '#d5b582'),
      seed: 808, terrainScale: 1.2, albedo: 0.63, hasCraters: false,
    }),
    body({
      id: 'europa', name: 'ЕВРОПА', designation: 'ЮПИТЕР · СПУТНИК', className: 'Ледяной спутник', type: 'Океан подо льдом', parentId: 'jupiter', moonOrbit: 2.05,
      summary: 'Гладкая ледяная кора покрывает глобальный солёный океан. Один из главных объектов поиска внеземной обитаемости.',
      temperature: '−160', temperatureRange: '−220…−148', gravity: '0,134 g', pressure: '10⁻¹² бар', radius: '1 561 км',
      radiusKm: 1561, massEarth: 0.008, radiusEarth: 0.245, atmosphere: 'Следы O₂ · водяной пар', water: 'Подповерхностный океан',
      hazard: 'Радиация Юпитера · криогенный холод', severity: 'Экстремальный риск', orbitalPeriod: 3.55, rotationHours: 85.2,
      palette: palette('#344858', '#8eaaa9', '#e4e5da', '#f4f3ea', '#152332', '#617b7e', '#a4b6b4', '#a8e6f1', '#a8dceb'),
      seed: 909, terrainScale: 0.74, albedo: 0.67, hasCraters: false,
    }),
    body({
      id: 'ganymede', name: 'ГАНИМЕД', designation: 'ЮПИТЕР · СПУТНИК', className: 'Крупнейший спутник', type: 'Ледяной каменистый мир', parentId: 'jupiter', moonOrbit: 2.65,
      summary: 'Крупнее Меркурия. Состоит из силикатной породы и водяного льда; вероятно, под корой скрыт солёный океан.',
      temperature: '−163', temperatureRange: '−203…−121', gravity: '0,146 g', pressure: '10⁻¹¹ бар', radius: '2 634 км',
      radiusKm: 2634, massEarth: 0.025, radiusEarth: 0.413, atmosphere: 'Экзосфера O₂', water: 'Лёд и возможный внутренний океан',
      hazard: 'Радиация · вакуум · холод', severity: 'Высокий риск', orbitalPeriod: 7.15, rotationHours: 171.7,
      palette: palette('#303b42', '#7d8e91', '#c2c9c5', '#e2e6e2', '#141d28', '#5b676b', '#889497', '#a6dce5', '#9dc8d3'),
      seed: 1001, terrainScale: 0.9, albedo: 0.43, hasCraters: true,
    }),
    body({
      id: 'callisto', name: 'КАЛЛИСТО', designation: 'ЮПИТЕР · СПУТНИК', className: 'Кратерированный спутник', type: 'Ледяной мир', parentId: 'jupiter', moonOrbit: 3.25,
      summary: 'Древняя поверхность с огромным числом кратеров. Находится за основными радиационными поясами Юпитера.',
      temperature: '−139', temperatureRange: '−193…−108', gravity: '0,126 g', pressure: '10⁻¹² бар', radius: '2 410 км',
      radiusKm: 2410, massEarth: 0.018, radiusEarth: 0.378, atmosphere: 'Следы CO₂', water: 'Лёд в составе коры',
      hazard: 'Вакуум · холод · микрометеориты', severity: 'Высокий риск', orbitalPeriod: 16.69, rotationHours: 400.5,
      palette: palette('#252b31', '#656b70', '#9ea3a2', '#d2d8d3', '#111924', '#51575d', '#787f83', '#b8d0d2', '#91adb7'),
      seed: 1102, terrainScale: 0.86, albedo: 0.22, hasCraters: true,
    }),
    body({
      id: 'saturn', name: 'САТУРН', designation: 'СОЛ · VI', className: 'Газовый гигант', type: 'Газовый гигант', bodyClass: 'gas', landable: false,
      summary: 'Газовый гигант с системой ярких ледяных колец. Твёрдой поверхности нет; известны десятки спутников.',
      temperature: '−140', temperatureRange: '−191…−130', gravity: '1,07 g*', pressure: 'Газовая оболочка', radius: '58 232 км',
      radiusKm: 58232, massEarth: 95.16, radiusEarth: 9.14, atmosphere: 'H₂ ~96% · He ~3% · CH₄', water: 'Лёд в кольцах и на спутниках',
      hazard: 'Нет поверхности · быстрый ветер', severity: 'Посадка невозможна', orbitAU: 9.58, orbitalPeriod: 10759, rotationHours: 10.7,
      palette: palette('#635844', '#b09a70', '#ddc99d', '#eee3c6', '#131a22', '#827553', '#ad9872', '#f0dba9', '#c8b490', { bands: ['#9d8964', '#d7c49a', '#827453', '#e1d1aa'] }),
      seed: 1203, terrainScale: 1, albedo: 0.342, hasRings: true,
    }),
    body({
      id: 'titan', name: 'ТИТАН', designation: 'САТУРН · СПУТНИК', className: 'Крупнейший спутник Сатурна', type: 'Мир метановых морей', parentId: 'saturn', moonOrbit: 1.7,
      summary: 'Плотная азотная атмосфера, метановые облака, реки и озёра углеводородов. Единственный спутник с устойчивой плотной атмосферой.',
      temperature: '−179', temperatureRange: '−183…−179', gravity: '0,138 g', pressure: '1,47 бар', radius: '2 575 км',
      radiusKm: 2575, massEarth: 0.0225, radiusEarth: 0.404, atmosphere: 'N₂ ~95% · CH₄ ~5%', water: 'Водяной лёд · метановые озёра',
      hazard: 'Криогенный холод · углеводородный дождь', severity: 'Высокий риск', orbitalPeriod: 15.95, rotationHours: 382.7,
      palette: palette('#443026', '#a66b3d', '#c69459', '#d5bb8a', '#986b4e', '#7d5032', '#aa7444', '#edbd7b', '#dfa870'),
      seed: 1304, terrainScale: 0.92, albedo: 0.22, hasCraters: false,
    }),
    body({
      id: 'enceladus', name: 'ЭНЦЕЛАД', designation: 'САТУРН · СПУТНИК', className: 'Небольшой ледяной спутник', type: 'Мир водяных гейзеров', parentId: 'saturn', moonOrbit: 2.35,
      summary: 'Из южнополярных трещин в космос выбрасываются водяные шлейфы. Под поверхностью находится глобальный океан.',
      temperature: '−201', temperatureRange: '−240…−128', gravity: '0,011 g', pressure: 'Экзосфера', radius: '252 км',
      radiusKm: 252, massEarth: 0.000018, radiusEarth: 0.0395, atmosphere: 'H₂O · следы N₂ и CO₂', water: 'Подповерхностный океан · гейзеры',
      hazard: 'Вакуум · лёд · слабая гравитация', severity: 'Высокий риск', orbitalPeriod: 1.37, rotationHours: 32.9,
      palette: palette('#647b83', '#b9c9c7', '#e7eddf', '#fbfff2', '#182731', '#869b9e', '#bdcdca', '#a9ecf1', '#a2e1e9'),
      seed: 1405, terrainScale: 0.47, albedo: 0.81, hasCraters: true,
    }),
    body({
      id: 'uranus', name: 'УРАН', designation: 'СОЛ · VII', className: 'Ледяной гигант', type: 'Ледяной гигант', bodyClass: 'ice-giant', landable: false,
      summary: 'Атмосфера водорода, гелия и метана. Ось вращения наклонена почти на 98 градусов; твёрдой поверхности нет.',
      temperature: '−195', temperatureRange: '−224…−197', gravity: '0,89 g*', pressure: 'Газовая оболочка', radius: '25 362 км',
      radiusKm: 25362, massEarth: 14.54, radiusEarth: 3.98, atmosphere: 'H₂ · He · CH₄', water: 'Вода и аммиак в глубинной мантии',
      hazard: 'Нет поверхности · холод', severity: 'Посадка невозможна', orbitAU: 19.2, orbitalPeriod: 30688.5, rotationHours: 17.24,
      palette: palette('#315967', '#5893a0', '#84bdc4', '#c7e4dc', '#101c2a', '#39747f', '#6da7ae', '#8ce3e9', '#80dce3', { bands: ['#45818d', '#72afb7', '#366977', '#8dc4c8'] }),
      seed: 1506, terrainScale: 1, albedo: 0.3,
    }),
    body({
      id: 'neptune', name: 'НЕПТУН', designation: 'СОЛ · VIII', className: 'Ледяной гигант', type: 'Ледяной гигант', bodyClass: 'ice-giant', landable: false,
      summary: 'Далёкий ледяной гигант с самыми быстрыми ветрами среди планет Солнечной системы. Твёрдой поверхности нет.',
      temperature: '−200', temperatureRange: '−218…−200', gravity: '1,14 g*', pressure: 'Газовая оболочка', radius: '24 622 км',
      radiusKm: 24622, massEarth: 17.15, radiusEarth: 3.86, atmosphere: 'H₂ · He · CH₄', water: 'Лёд в глубинной мантии',
      hazard: 'Нет поверхности · сверхзвуковые ветры', severity: 'Посадка невозможна', orbitAU: 30.07, orbitalPeriod: 60182, rotationHours: 16.11,
      palette: palette('#152d68', '#2850ab', '#5276d0', '#99b5e9', '#101a36', '#203b7f', '#355ec0', '#85a9ff', '#5785ff', { bands: ['#233b86', '#365bc0', '#1b3170', '#5680df'] }),
      seed: 1607, terrainScale: 1, albedo: 0.29,
    }),
    body({
      id: 'pluto', name: 'ПЛУТОН', designation: 'ПОЯС КОЙПЕРА', className: 'Карликовая планета', type: 'Ледяной мир',
      summary: 'Маленький мир на окраине пояса Койпера. Азотные льды образуют светлые равнины, под ними — водяная ледяная кора.',
      temperature: '−229', temperatureRange: '−240…−218', gravity: '0,063 g', pressure: 'Переменная N₂-атмосфера', radius: '1 188 км',
      radiusKm: 1188, massEarth: 0.00218, radiusEarth: 0.186, atmosphere: 'N₂ · CH₄ · CO', water: 'Водяной лёд · азотные равнины',
      hazard: 'Вакуум · экстремальный холод', severity: 'Критический риск', orbitAU: 39.48, orbitalPeriod: 90560, rotationHours: 153.3,
      palette: palette('#30343b', '#9b9690', '#d8d1c3', '#f0e8d5', '#101922', '#746f69', '#aaa49b', '#dfd5bd', '#b1cbd3'),
      seed: 1708, terrainScale: 0.56, albedo: 0.49, hasCraters: true,
    }),
  ],
};

export const PLANETS = SOLAR_SYSTEM.bodies;

export const KNOWN_SYSTEMS = [
  {
    id: 'proxima-centauri', type: 'known', generated: false,
    name: 'ПРОКСИМА ЦЕНТАВРА', subtitle: '4,24 СВ · M5.5 Ve', seed: 181811,
    star: { name: 'Проксима Центавра', spectralClass: 'M5.5 Ve', mass: 0.122, luminosity: 0.0017, temperatureK: 3042, colour: '#ffb16b', radius: 1.58 },
    description: 'Ближайшая к Солнцу звезда. Для Проксимы b измерены период и минимальная масса; состав атмосферы и радиус пока неизвестны.',
    bodies: [
      body({
        id: 'proxima-b', name: 'ПРОКСИМА b', designation: 'PROXIMA CENTAURI b', className: 'Экзопланета · период 11,19 сут', type: 'Каменистая планета-кандидат',
        summary: 'Минимальная масса около 1,07 массы Земли. Мир находится в зоне умеренного облучения, но наличие атмосферы и жидкой воды не подтверждено.',
        temperature: '−39', temperatureRange: 'Модельная оценка', gravity: '≈ 0,9 g*', pressure: 'Не установлено', radius: 'Радиус не измерен',
        radiusKm: 7000, radiusEarth: 1.1, massEarth: 1.07, massLabel: 'минимум', atmosphere: 'Не установлена', water: 'Не установлено',
        hazard: 'Звёздные вспышки · атмосфера неизвестна', severity: 'Условия не подтверждены', orbitAU: 0.0485, orbitalPeriod: 11.186, rotationHours: 268.5,
        palette: palette('#182532', '#65584d', '#b29b7d', '#d9d1be', '#8d5949', '#51483e', '#796d5c', '#e5aa72', '#e49460'),
        seed: 181812, terrainScale: 1, albedo: 0.3, hasCraters: true, modelOnly: true, dataStatus: 'МИНИМАЛЬНАЯ МАССА ИЗ НАБЛЮДЕНИЙ · ПОВЕРХНОСТЬ ВИЗУАЛИЗИРОВАНА ПО МОДЕЛИ',
      }),
    ],
  },
  {
    id: 'trappist-1', type: 'known', generated: false,
    name: 'TRAPPIST-1', subtitle: '39,6 СВ · M8 V', seed: 121023,
    star: { name: 'TRAPPIST-1', spectralClass: 'M8 V', mass: 0.0898, luminosity: 0.000525, temperatureK: 2566, colour: '#ff9e62', radius: 1.75 },
    description: 'Семь планет земного размера у ультрахолодного карлика. Их радиусы и массы измерены; атмосферы требуют дальнейших наблюдений.',
    bodies: [
      ['b', 1.116, 1.374, 0.01154, 1.5109, 400],
      ['c', 1.097, 1.308, 0.01580, 2.4218, 342],
      ['d', 0.788, 0.388, 0.02227, 4.0496, 288],
      ['e', 0.920, 0.692, 0.02925, 6.0996, 251],
      ['f', 1.045, 1.039, 0.03849, 9.2067, 219],
      ['g', 1.129, 1.321, 0.04683, 12.3529, 199],
      ['h', 0.755, 0.326, 0.06189, 18.7729, 169],
    ].map(([letter, radiusEarth, massEarth, orbitAU, periodDays, equilibriumK], index) => body({
      id: `trappist-1-${letter}`, name: `TRAPPIST-1 ${letter.toUpperCase()}`, designation: `TRAPPIST-1 ${letter}`,
      className: `Планета земного размера · ${periodDays.toFixed(2)} суток`, type: 'Каменистая экзопланета',
      summary: `Радиус ${radiusEarth.toFixed(2)} R⊕ и масса ${massEarth.toFixed(2)} M⊕ определены транзитами и динамикой системы. Температура — равновесная оценка; состав атмосферы не подтверждён.`,
      temperature: `${Math.round(equilibriumK - 273.15)}`, temperatureRange: 'Равновесная оценка',
      gravity: `${(massEarth / (radiusEarth * radiusEarth)).toFixed(2).replace('.', ',')} g`, pressure: 'Атмосфера не подтверждена',
      radius: `${Math.round(radiusEarth * 6371).toLocaleString('ru-RU')} км`, radiusKm: Math.round(radiusEarth * 6371), radiusEarth, massEarth,
      atmosphere: 'Состав не установлен', water: 'Не установлено', hazard: 'Приливной захват · активная звезда', severity: 'Модельная высадка',
      orbitAU, orbitalPeriod: periodDays, rotationHours: periodDays * 24, albedo: 0.3, hasCraters: true,
      palette: palette('#182b3b', ['#6f5447', '#896657', '#687352', '#827989', '#65584f', '#657e88', '#9f6a57'][index], '#c5ad8c', '#dfe2d8', '#733f3c', '#554940', '#816e5b', ['#dca77b', '#a8cdd5', '#db9877', '#b9d2c3', '#94a8d9', '#c2a2c8', '#a6bcd7'][index], '#ba8274'),
      seed: 181813 + index * 127, terrainScale: 0.72 + radiusEarth * 0.25, modelOnly: true,
      dataStatus: 'РАДИУС И МАССА — ИЗ НАБЛЮДЕНИЙ · ТЕМПЕРАТУРА ОЦЕНОЧНАЯ · АТМОСФЕРА НЕ ПОДТВЕРЖДЕНА',
    })),
  },
  {
    id: 'kepler-186', type: 'known', generated: false,
    name: 'KEPLER-186', subtitle: '582 СВ · M1 V', seed: 186186,
    star: { name: 'Kepler-186', spectralClass: 'M1 V', mass: 0.54, luminosity: 0.041, temperatureK: 3788, colour: '#ffbc7a', radius: 1.9 },
    description: 'Планетная система красного карлика. Kepler-186 f стала первой найденной планетой земного размера в обитаемой зоне другой звезды.',
    bodies: [
      ['b', 1.07, 0.013, 3.89, 430],
      ['c', 1.25, 0.036, 7.27, 350],
      ['d', 1.40, 0.064, 13.34, 280],
      ['e', 1.27, 0.111, 22.41, 233],
      ['f', 1.17, 0.432, 129.94, 188],
    ].map(([letter, radiusEarth, orbitAU, periodDays, equilibriumK], index) => {
      const estimatedMass = Math.pow(radiusEarth, 2.7);
      return body({
        id: `kepler-186-${letter}`, name: `KEPLER-186 ${letter.toUpperCase()}`, designation: `KEPLER-186 ${letter}`,
        className: `Транзитная планета · ${periodDays.toFixed(1)} суток`, type: 'Кандидат земного размера',
        summary: letter === 'f'
          ? 'Радиус около 1,17 R⊕; год длится почти 130 суток. Орбита получает умеренное звёздное излучение, но существование атмосферы и воды не установлено.'
          : `Транзитный радиус около ${radiusEarth.toFixed(2)} R⊕ и период ${periodDays.toFixed(2)} суток. Масса и состав атмосферы не измерены.`,
        temperature: `${Math.round(equilibriumK - 273.15)}`, temperatureRange: 'Равновесная оценка',
        gravity: `≈ ${(estimatedMass / (radiusEarth * radiusEarth)).toFixed(2).replace('.', ',')} g`, pressure: 'Не установлено',
        radius: `${Math.round(radiusEarth * 6371).toLocaleString('ru-RU')} км`, radiusKm: Math.round(radiusEarth * 6371), radiusEarth,
        massEarth: estimatedMass, massLabel: 'оценка', atmosphere: 'Не установлена', water: 'Не установлено',
        hazard: 'Атмосфера неизвестна · вспышки карлика', severity: 'Модельная высадка',
        orbitAU, orbitalPeriod: periodDays, rotationHours: periodDays * 24, albedo: 0.3, hasCraters: true,
        palette: palette('#183044', ['#8a6550', '#95704e', '#665e52', '#7a6b65', '#718267'][index], '#c4ad88', '#e0e5dd', '#8c5d4f', '#695341', '#94826a', ['#d6a57a', '#c8976f', '#9ac4d3', '#c0d1ac', '#95b9d5'][index], '#d29b81'),
        seed: 186187 + index * 251, terrainScale: 0.85 + radiusEarth * 0.18, modelOnly: true,
        dataStatus: 'РАДИУС И ОРБИТА — ИЗ НАБЛЮДЕНИЙ · МАССА И ТЕМПЕРАТУРА — ОЦЕНКА',
      });
    }),
  },
];

export const RESOURCE_INFO = {
  iron: { label: 'Железо', short: 'Fe', color: '#e6a17b' },
  crystal: { label: 'Силикаты', short: 'Si', color: '#b7d8db' },
  ice: { label: 'Водяной лёд', short: 'H₂O', color: '#8cdbf1' },
};
export const RESOURCE_REQUIREMENTS = { iron: 3, crystal: 2 };

function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function formatBar(value) {
  if (value < 0.001) return '< 0,001 бар';
  if (value < 0.1) return `${value.toFixed(3).replace('.', ',')} бар`;
  return `${value.toFixed(2).replace('.', ',')} бар`;
}

function formatEarthRadius(value) {
  return `${Math.round(value * 6371).toLocaleString('ru-RU')} км`;
}

export function generateProceduralSystem(seed = Math.floor(Math.random() * 0xffffffff)) {
  const random = seededRandom(seed);
  const stars = [
    { type: 'M', label: 'M-карлик', spectral: 'M3 V', mass: 0.35, luminosity: 0.015, temperature: 3400, colour: '#ffb56e' },
    { type: 'K', label: 'K-карлик', spectral: 'K2 V', mass: 0.78, luminosity: 0.38, temperature: 4900, colour: '#ffd1a1' },
    { type: 'G', label: 'G-звезда', spectral: 'G2 V', mass: 1.0, luminosity: 1, temperature: 5772, colour: '#fff1cc' },
    { type: 'F', label: 'F-звезда', spectral: 'F5 V', mass: 1.35, luminosity: 2.7, temperature: 6600, colour: '#dbe7ff' },
  ];
  const starTemplate = stars[Math.floor(random() * stars.length)];
  const star = { ...starTemplate, spectralClass: starTemplate.spectral, name: 'Звезда SIM', radius: 2.45 };
  const count = 5 + Math.floor(random() * 4);
  const bodies = [];
  let orbitAU = star.type === 'M' ? 0.045 : 0.12;
  const accents = ['#d7a676', '#90c8cf', '#db8d6c', '#a7bddc', '#c1d88a', '#cf9dc7'];
  const designations = 'bcdefghijk';

  for (let index = 0; index < count; index += 1) {
    orbitAU *= 1.42 + random() * 0.4;
    const choice = random();
    const bodyClass = choice < 0.51 ? (random() < 0.35 ? 'ice' : 'rocky') : choice < 0.8 ? 'sub-neptune' : 'gas';
    let massEarth;
    let radiusEarth;
    if (bodyClass === 'gas') {
      massEarth = 25 + random() * 210;
      radiusEarth = 5.2 + random() * 6.8;
    } else if (bodyClass === 'sub-neptune') {
      massEarth = 2.2 + random() * 8;
      radiusEarth = 1.7 + random() * 2.5;
    } else {
      massEarth = 0.25 + random() * 4.25;
      radiusEarth = massEarth < 1 ? Math.pow(massEarth, 0.28) : Math.pow(massEarth, 0.27);
    }
    const albedo = bodyClass === 'ice' ? 0.48 + random() * 0.32 : 0.12 + random() * 0.42;
    const equilibriumK = 278 * Math.pow(star.luminosity, 0.25) / Math.sqrt(orbitAU) * Math.pow((1 - albedo) / 0.7, 0.25);
    const greenhouseK = bodyClass === 'gas' ? 0 : bodyClass === 'sub-neptune' ? 35 + random() * 115 : 4 + random() * 92;
    const surfaceK = equilibriumK + greenhouseK;
    const celsius = Math.round(surfaceK - 273.15);
    const gravity = massEarth / (radiusEarth * radiusEarth);
    const hot = surfaceK > 390;
    const cold = surfaceK < 180;
    const habitableBand = surfaceK >= 245 && surfaceK <= 330;
    const landable = bodyClass !== 'gas' && bodyClass !== 'sub-neptune' && radiusEarth < 2.8;
    const name = `МИР ${designations[index]}`;
    const accent = accents[Math.floor(random() * accents.length)];
    const deep = bodyClass === 'ice' || cold;
    const ocean = bodyClass === 'rocky' && habitableBand && random() > 0.35;
    const pressure = bodyClass === 'gas' ? null : bodyClass === 'sub-neptune' ? 2 + random() * 40 : hot ? 2 + random() * 92 : cold ? random() * 0.15 : 0.15 + random() * 1.7;
    const atmosphere = bodyClass === 'gas'
      ? 'H₂ · He · следы CH₄'
      : bodyClass === 'sub-neptune'
        ? 'H₂ · He · летучие соединения'
        : hot
          ? 'CO₂ · N₂ · следы SO₂'
          : cold
            ? 'N₂ · CH₄ · следы CO'
            : 'N₂ · CO₂ · возможные H₂O и O₂';
    const bodyPalette = bodyClass === 'gas'
      ? palette('#513f38', '#a67960', '#d3af89', '#e6d8c5', '#18202b', '#735647', '#ab8068', accent, '#d5b390', { bands: ['#8c6955', '#d2ad86', '#684b40', '#bd9272'] })
      : deep
        ? palette('#192e40', '#6e8f9c', '#b8cdd0', '#e8f4ee', '#547c98', '#496b78', '#819fa8', accent, '#a9d9e7')
        : palette('#222a30', hot ? '#a95f3b' : '#697852', hot ? '#d39962' : '#c1b78d', '#ded6bf', '#8e6550', hot ? '#78412e' : '#4d604d', '#8a8170', accent, '#a9c9d5');
    const orbitPeriodDays = 365.25 * Math.sqrt(Math.pow(orbitAU, 3) / star.mass);

    bodies.push(body({
      id: `sim-${seed.toString(36)}-${index}`,
      name,
      designation: `SIM-${String(seed % 1000).padStart(3, '0')} ${designations[index]}`.toUpperCase(),
      className: bodyClass === 'gas' ? 'Газовый гигант · модель' : bodyClass === 'sub-neptune' ? 'Суб-Нептун · модель' : bodyClass === 'ice' ? 'Ледяной каменистый мир · модель' : 'Планета земной группы · модель',
      type: bodyClass === 'gas' ? 'Газовый гигант' : bodyClass === 'sub-neptune' ? 'Суб-Нептун' : ocean ? 'Возможный океанический мир' : hot ? 'Перегретая каменистая планета' : cold ? 'Холодный мир' : 'Каменистая планета',
      summary: `Синтетический объект у ${star.label.toLowerCase()}. Орбита ${orbitAU.toFixed(2)} а.е.; оценка равновесной температуры и гравитации рассчитана из параметров звезды, альбедо и массы.`,
      temperature: `${celsius >= 0 ? '+' : '−'}${Math.abs(celsius)}`,
      temperatureRange: 'Модельная оценка',
      gravity: `${gravity.toFixed(2).replace('.', ',')} g`,
      pressure: pressure === null ? 'Газовая оболочка' : formatBar(pressure),
      radius: formatEarthRadius(radiusEarth),
      radiusKm: Math.round(radiusEarth * 6371),
      massEarth,
      radiusEarth,
      atmosphere,
      water: ocean ? `${Math.round(25 + random() * 55)}% · модельная оценка` : deep ? 'Возможен водяной лёд' : 'Не установлено',
      hazard: bodyClass === 'gas' ? 'Нет твёрдой поверхности' : hot ? 'Высокая температура' : cold ? 'Холод · низкое давление' : 'Радиация звезды · пыль',
      severity: bodyClass === 'gas' || bodyClass === 'sub-neptune' ? 'Посадка невозможна' : hot || cold ? 'Критический риск' : 'Скафандр обязателен',
      orbitAU,
      orbitalPeriod: orbitPeriodDays,
      rotationHours: Math.round((9 + random() * 1000) * 10) / 10,
      hasOcean: ocean,
      hasCraters: random() > 0.38,
      bodyClass: bodyClass === 'ice' ? 'ice' : bodyClass,
      landable,
      albedo,
      terrainScale: clamp(0.72 + radiusEarth * 0.18, 0.65, 1.55),
      seed: (seed + index * 104729) >>> 0,
      palette: bodyPalette,
      modelOnly: true,
      equilibriumK: Math.round(equilibriumK),
      starClass: star.spectral,
    }));
  }

  return {
    id: `sim-system-${seed.toString(36)}`,
    type: 'procedural',
    name: 'СИНТЕЗИРОВАННЫЙ СЕКТОР',
    subtitle: `МОДЕЛЬ · ${star.spectral} · НЕ КАТАЛОГ НАБЛЮДЕНИЙ`,
    seed,
    star,
    bodies,
    generated: true,
  };
}

export function getPlanet(id, bodies = SOLAR_SYSTEM.bodies) {
  return bodies.find((planet) => planet.id === id) ?? SOLAR_SYSTEM.bodies.find((planet) => planet.id === 'mars');
}
