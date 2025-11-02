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
  resources: { oxygen: 60, food: 40, energy: 50, scrap: 35, tech: 0, ammo: 10 },
  production: { oxygen: 0, food: 0, energy: 0, scrap: 0 },
  survivors: [],
  nextSurvivorId: 1,
  tiles: [],
  mapSize: { w: 20, h: 10 },
  baseTile: { x: 10, y: 5 },
  explored: new Set(),
  inventory: [], // Changed to an array to support item durability
  nextItemId: 1,
  inventoryCapacity: 30, // 0.9.0 - Increased from 20 to 30 for better early game
  equipment: { turrets: 0, bulkhead: 0 },
  systems: { filter: 0, generator: 0, turret: 0 },
  systemFailures: [], // 0.8.1 - Track system failures
  threat: 8,
  baseIntegrity: 100,
  raidChance: 0, // 0.7.3 - replaces boardRisk
  lastRaidAt: 0, // 0.7.3 - cooldown tracking
  alienKills: 0, // 0.7.3 - used to scale raid chance
  // 0.8.x - temporary pressure that boosts raid chance after retreats/casualties; decays over time
  raidPressure: 0,
  // 0.8.x - throttle threat change notifications
  lastThreatNoticeAt: 0,
  // 0.8.8 - persist selected explorer and expedition survivor
  selectedExplorerId: null,
  selectedExpeditionSurvivorId: null,
  // 0.8.9 - track highest tier reached (becomes permanent floor)
  highestThreatTier: 0,  // index into BALANCE.THREAT_TIERS
  highestRaidTier: 0,    // index into BALANCE.RAID_TIERS
  // 0.9.0 - Endgame escalation system (activates at 100% threat)
  escalationLevel: 0,    // Increments past 100% threat for endless difficulty scaling
  lastEscalationTime: 0, // Timestamp for time-based escalation
  threatLocked: false,   // Once at 100%, threat cannot decrease
  missions: [], // active expeditions
  timeNow: Date.now(),
  gameOver: false, // 0.8.10 - Track game over state to prevent respawn on reload
};

// track which task dropdown is currently open across re-renders
let activeTaskDropdownId = null;
// preserve per-dropdown scroll position between renders
const activeTaskDropdownScroll = {};
let lastRenderedSurvivors = {};
let autoSaveCounter = 0;
let activeDropdown = null;
// 0.8.8 - selectedExplorerId and selectedExpeditionSurvivorId moved to state for persistence
let lastRenderedAvailableSurvivors = null;
let lastRenderedAvailableExplorers = null;
