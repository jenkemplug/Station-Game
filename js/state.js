let USER_ID = localStorage.getItem('derelict_station_user_id');
if (!USER_ID) {
  USER_ID = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  localStorage.setItem('derelict_station_user_id', USER_ID);
}

const GAME_KEY = `${BASE_GAME_KEY}_${USER_ID}`;

let state = {
  startedAt: Date.now(),
  lastTick: Date.now(),
  secondsPlayed: 0,
  resources: { oxygen: 60, food: 30, energy: 40, scrap: 25, tech: 0, ammo: 10 },
  production: { oxygen: 0, food: 0, energy: 0, scrap: 0 },
  survivors: [],
  nextSurvivorId: 1,
  tiles: [],
  mapSize: { w: 20, h: 10 },
  baseTile: { x: 10, y: 5 },
  explored: new Set(),
  inventory: [], // Changed to an array to support item durability
  nextItemId: 1,
  equipment: { turrets: 0, bulkhead: 0 },
  systems: { filter: 0, generator: 0, turret: 0 },
  threat: 8,
  baseIntegrity: 100,
  boardRisk: 0,
  journal: ["Station systems nominal. Maintain discipline."],
  missions: [], // active expeditions
  timeNow: Date.now(),
};

// track which task dropdown is currently open across re-renders
let activeTaskDropdownId = null;
// preserve per-dropdown scroll position between renders
const activeTaskDropdownScroll = {};
let lastRenderedSurvivors = {};
let autoSaveCounter = 0;
let activeDropdown = null;
let selectedExpeditionSurvivorId = null;
let lastRenderedAvailableSurvivors = null;
