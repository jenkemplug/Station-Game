const VERSION = '0.6.1';
const BASE_GAME_KEY = `derelict_station_expanded_v${VERSION}`;
const TICK_MS = 1000;
const MAX_LOG = 300;

const BALANCE = {
  // Consumption
  O2_BASE: 0.15,
  O2_PER_SURVIVOR: 0.3,
  FOOD_BASE: 0.05,
  FOOD_PER_SURVIVOR: 0.15,
  // Critical thresholds and damage
  OXY_CRITICAL_THRESHOLD: 6,
  OXY_DAMAGE_RANGE: [1, 3],
  STARVATION_CHANCE: 0.05,
  // Raid tuning
  RAID_BASE_CHANCE: 0.004,
  RAID_THREAT_DIVISOR: 3500,
  RAID_MAX_CHANCE: 0.08,
  RAID_DEFENSE_SCALE: 1.0,
  // Expeditions
  EXPEDITION_SUCCESS_CHANCE: 0.75,
  // XP scaling
  XP_MULT: 1.0,
  // Production tuning
  PROD_MULT: 1.35,
  SYSTEM_FILTER_MULT: 1.5,
  SYSTEM_GENERATOR_MULT: 1.6
};

const LOOT_TABLE = [
  { type: 'junk', weight: 50, desc: 'Scrap wiring and bent conduits', onPickup: (s) => { s.resources.scrap += rand(2, 8); return 'Scrap salvaged.'; } },
  { type: 'foodpack', weight: 20, desc: 'Sealed ration pack', onPickup: (s) => { s.resources.food += rand(4, 12); return 'Recovered food supplies.'; } },
  { type: 'medkit', weight: 10, desc: 'Field medkit (stabilizes wounds)', onPickup: (s) => { s.inventory.push({ id: s.nextItemId++, type: 'medkit', name: 'Medkit' }); return 'Medkit added to inventory.'; } },
  { type: 'tech', weight: 8, desc: 'Sensitive electronics and processors', onPickup: (s) => { s.resources.tech += 1; return 'Tech component recovered.'; } },
  { type: 'weaponPart', weight: 6, desc: 'Pulse emitter module', onPickup: (s) => { s.inventory.push({ id: s.nextItemId++, type: 'weaponPart', name: 'Weapon Part' }); return 'Weapon part recovered.'; } },
  { type: 'ammo', weight: 12, desc: 'Rounded energy cells', onPickup: (s) => { s.resources.ammo += rand(3, 8); return 'Ammo recovered.'; } },
  { type: 'armor', weight: 4, desc: 'Light Armor plating', onPickup: (s) => { s.inventory.push({ id: s.nextItemId++, type: 'armor', name: 'Light Armor', durability: 100, maxDurability: 100 }); return 'Light Armor recovered.'; } },
  { type: 'rifle', weight: 2, desc: 'Pulse Rifle components', onPickup: (s) => { s.inventory.push({ id: s.nextItemId++, type: 'rifle', name: 'Pulse Rifle', durability: 100, maxDurability: 100 }); return 'Pulse Rifle recovered.'; } },
  { type: 'heavyArmor', weight: 1, desc: 'Heavy Armor plating', onPickup: (s) => { s.inventory.push({ id: s.nextItemId++, type: 'heavyArmor', name: 'Heavy Armor', durability: 200, maxDurability: 200 }); return 'Heavy Armor recovered.'; } },
  { type: 'shotgun', weight: 2, desc: 'Shotgun components', onPickup: (s) => { s.inventory.push({ id: s.nextItemId++, type: 'shotgun', name: 'Shotgun', durability: 80, maxDurability: 80 }); return 'Shotgun recovered.'; } },
  { type: 'filter', weight: 0.5, desc: 'A filter module', onPickup: (s) => { s.systems.filter++; return 'Filter module recovered.'; } },
  { type: 'generator', weight: 0.5, desc: 'A micro-generator', onPickup: (s) => { s.systems.generator++; return 'Micro-generator recovered.'; } }
];

const ALIEN_TYPES = [
  { id: 'lurker', name: 'Lurker', hpRange: [8, 14], attackRange: [3, 6], stealth: 0.4, flavor: 'A pale, elongated organism that hides in vents.' },
  { id: 'stalker', name: 'Stalker', hpRange: [14, 22], attackRange: [5, 9], stealth: 0.2, flavor: 'Moves in small coordinated packs, aggressive.' },
  { id: 'brood', name: 'Brood', hpRange: [28, 40], attackRange: [8, 14], stealth: 0.05, flavor: 'A nesting cluster — dangerous and territorial.' },
  { id: 'spectre', name: 'Spectre', hpRange: [10, 18], attackRange: [4, 8], stealth: 0.7, flavor: 'An elusive lifeform that strikes from darkness.' },
];

const RECIPES = {
  filter: { scrap: 25, energy: 15, tech: 0, result: () => { state.systems.filter++; appendLog('Filter upgraded (fabricated).'); } },
  generator: { scrap: 20, energy: 0, result: () => { state.systems.generator++; appendLog('Micro-generator assembled.'); } },
  medkit: { scrap: 12, energy: 0, result: () => { state.inventory.push({ id: state.nextItemId++, type: 'medkit' }); appendLog('Medkit crafted.'); } },
  ammo: { scrap: 8, energy: 0, result: () => { state.resources.ammo += rand(4, 10); appendLog('Ammo manufactured.'); } },
  turret: { scrap: 60, energy: 30, tech: 2, result: () => { state.systems.turret++; appendLog('Auto-turret constructed.'); } },
  armor: { name: 'Light Armor', scrap: 30, tech: 2, durability: 100, result: () => { state.inventory.push({ id: state.nextItemId++, type: 'armor', name: 'Light Armor', durability: 100, maxDurability: 100 }); appendLog('Light Armor crafted.'); } },
  rifle: { name: 'Pulse Rifle', scrap: 45, tech: 4, durability: 100, result: () => { state.inventory.push({ id: state.nextItemId++, type: 'rifle', name: 'Pulse Rifle', durability: 100, maxDurability: 100 }); appendLog('Pulse Rifle built.'); } },
  heavyArmor: { name: 'Heavy Armor', scrap: 60, tech: 4, durability: 200, result: () => { state.inventory.push({ id: state.nextItemId++, type: 'heavyArmor', name: 'Heavy Armor', durability: 200, maxDurability: 200 }); appendLog('Heavy Armor crafted.'); } },
  shotgun: { name: 'Shotgun', scrap: 55, tech: 3, durability: 80, result: () => { state.inventory.push({ id: state.nextItemId++, type: 'shotgun', name: 'Shotgun', durability: 80, maxDurability: 80 }); appendLog('Shotgun built.'); } }
};

const TASKS = ['Idle', 'Oxygen', 'Food', 'Energy', 'Scrap', 'Guard'];
