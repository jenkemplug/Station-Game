const VERSION = '0.7.4';
const BASE_GAME_KEY = `derelict_station_expanded_v${VERSION}`;
const TICK_MS = 1000;
const MAX_LOG = 300;

const BALANCE = {
  // Interactive combat
  COMBAT_ACTIONS: {
    Aim: { accuracyBonus: 0.25 },
    Burst: { dmgBonus: [3, 6], accuracyPenalty: 0.05, ammoMult: 2 },
    Guard: { defenseBonus: 3 },
    MedkitHeal: [10, 18]
  },
  BASE_HIT_CHANCE: 0.75,
  CRIT_CHANCE: 0.12,
  CRIT_MULT: 1.6,
  // Turret combat (0.7.3)
  TURRET_BASE_DAMAGE: 8,
  TURRET_HIT_CHANCE: 0.85,
  TURRET_THREAT_REDUCTION: 0.15,
  // Retreat mechanics (0.7.2)
  RETREAT_BASE_CHANCE: 0.50,
  RETREAT_SKILL_BONUS: 0.03, // per skill point
  RETREAT_LEVEL_BONUS: 0.02, // per level
  RETREAT_ALIEN_PENALTY: {
    drone: 0.05,      // easy to escape from
    lurker: 0,        // neutral
    stalker: -0.05,   // harder to escape
    spitter: -0.02,   // ranged attacker
    brood: -0.10,     // very hard to escape
    ravager: -0.08,   // armored and persistent
    spectre: 0.05,    // easier to slip away from stealthy enemies
    queen: -0.15      // nearly impossible to escape
  },
  // Map & exploration costs (click-to-explore only)
  TILE_ENERGY_COST: {
    hazard: 25,
    alien: 18,
    resource: 12,
    module: 15,
    survivor: 10,
    empty: 8
  },
  SURVIVOR_RECRUIT_CHANCE: 0.85,
  HAZARD_DURABILITY_LOSS: [12, 20],
  HAZARD_LOOT_ROLLS: 3,

  // Resource consumption (per tick)
  O2_BASE: 0.12,
  O2_PER_SURVIVOR: 0.30,
  FOOD_BASE: 0.04,
  FOOD_PER_SURVIVOR: 0.18,
  
  // Critical state thresholds
  OXY_CRITICAL_THRESHOLD: 8,
  OXY_DAMAGE_RANGE: [1, 3],
  INTEGRITY_DAMAGE_OXY_CRIT: 0.08,
  MORALE_LOSS_OXY_CRIT: 0.3,
  MORALE_LOSS_ASPHYXIA: 0.5,
  MORALE_LOSS_STARVATION: 0.20,
  STARVATION_CHANCE: 0.06,
  
  // Threat & raid mechanics
  THREAT_GROWTH_BASE: 0.04,
  THREAT_GROWTH_RAND: 0.05,
  GUARD_THREAT_REDUCTION: 0.10,
  BOARD_RISK_DIVISOR: 120,
  BOARD_RISK_BASE_NO_TURRET: 0.05,
  RAID_BASE_CHANCE: 0.004,
  RAID_THREAT_DIVISOR: 3500,
  RAID_MAX_CHANCE: 0.07,
  // 0.7.3 – Defensive reduction to raid chance (absolute)
  RAID_CHANCE_REDUCTION_PER_GUARD: 0.0025,
  RAID_CHANCE_REDUCTION_PER_TURRET: 0.002,
  // 0.7.3 – Additive pressure from exploration and alien kills
  RAID_CHANCE_PER_TILE: 0.00003, // ~0.6% at 200 tiles fully explored
  RAID_CHANCE_PER_ALIEN_KILL: 0.0005, // 0.05% per alien kill
  // 0.7.3 – Raid cooldown to keep raids impactful and infrequent
  RAID_MIN_INTERVAL_SEC: 900,  // 15 minutes
  RAID_MAX_INTERVAL_SEC: 1200, // 20 minutes
  TURRET_POWER_PER: 15,
  RAID_ATTACK_RANGE: [6, 28],
  THREAT_REDUCE_ON_REPEL: 4,
  INTEGRITY_DAMAGE_ON_BREACH: [3, 10],
  NEST_CHANCE_AFTER_BREACH: 0.20,
  CASUALTY_CHANCE: 0.10,
  THREAT_GAIN_PER_ALIEN: [1, 2],
  NEST_CHANCE_NO_DEFEND: 0.30,
  
  // Expeditions
  EXPEDITION_SUCCESS_CHANCE: 0.70,
  EXPEDITION_COST_FOOD: 8,
  EXPEDITION_COST_ENERGY: 12,
  EXPEDITION_DEFAULT_DURATION: 30,
  EXPEDITION_WEAPON_WEAR: [4, 12],
  EXPEDITION_ARMOR_WEAR: [8, 20],
  EXPEDITION_FAILURE_DAMAGE: [4, 12],
  EXPEDITION_REWARDS: {
    scrap: [12, 35],
    tech: [1, 5]
  },
  XP_FROM_EXPEDITION_SUCCESS: 30,
  XP_FROM_EXPEDITION_FAILURE: 12,
  
  // XP & leveling
  XP_MULT: 1.0,
  XP_FROM_EXPLORE: 8,
  XP_FROM_LOOT: 10,
  COMBAT_XP_RANGE: [12, 25],
  
  // Production multipliers
  PROD_MULT: 1.20,
  SYSTEM_FILTER_MULT: 1.4,
  SYSTEM_GENERATOR_MULT: 1.5,
  SURVIVOR_PROD: {
    Oxygen: { base: 1.0, perSkill: 0.06 },
    Food: { base: 0.8, perSkill: 0.04 },
    Energy: { base: 1.0, perSkill: 0.06 },
    Scrap: { base: 0.9, perSkill: 0.05 },
    IdleOxygen: 0.05,
    FoodYieldFactor: 0.65,
    PassiveEnergyDrainBase: 0.05,
    PassiveEnergyDrainPerTurret: 0.02
  },
  LEVEL_PRODUCTION_BONUS: 0.06,
  LEVEL_ATTACK_BONUS: 0.6,
  
  // Combat
  AMMO_CONSUME_CHANCE: 0.55,
  
  // Economy & upgrades
  BASE_RECRUIT_COST: 12,
  EXPLORED_DISCOUNT_MAX: 0.5,
  REPAIR_COST_PER_POINT: 0.4,
  UPGRADE_COSTS: {
    filter: { base: 45, perLevel: 22 },
    generator: { base: 40, perLevel: 20 },
    turret: { scrap: 70, energy: 35 }
  }
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
  { type: 'hazmatSuit', weight: 0.1, desc: 'A hazmat suit', onPickup: (s) => { s.inventory.push({ id: s.nextItemId++, type: 'hazmatSuit', name: 'Hazmat Suit', durability: 150, maxDurability: 150 }); return 'Hazmat Suit recovered.'; } }
];

const ALIEN_TYPES = [
  // Early game threats
  { id: 'lurker', name: 'Lurker', hpRange: [8, 14], attackRange: [3, 6], stealth: 0.4, 
    flavor: 'A pale, elongated organism that hides in vents.',
    special: 'ambush', // First attack deals +50% damage if at full HP
    specialDesc: 'Ambush: First strike deals bonus damage' },
  
  { id: 'drone', name: 'Drone', hpRange: [6, 10], attackRange: [2, 5], stealth: 0.3,
    flavor: 'Small, fast-moving scavenger. Weak but evasive.',
    special: 'dodge', // 25% chance to evade attacks
    specialDesc: 'Evasive: 25% chance to dodge attacks' },
  
  // Mid game threats
  { id: 'stalker', name: 'Stalker', hpRange: [14, 22], attackRange: [5, 9], stealth: 0.2, 
    flavor: 'Moves in small coordinated packs, aggressive.',
    special: 'pack', // +2 damage for each other living alien
    specialDesc: 'Pack Hunter: Stronger when allies present' },
  
  { id: 'spitter', name: 'Spitter', hpRange: [10, 16], attackRange: [4, 8], stealth: 0.15,
    flavor: 'Ranged attacker that sprays corrosive bile from distance.',
    special: 'piercing', // Ignores 50% of armor
    specialDesc: 'Armor Piercing: Bypasses half of armor' },
  
  // Late game threats
  { id: 'brood', name: 'Brood', hpRange: [28, 40], attackRange: [8, 14], stealth: 0.05, 
    flavor: 'A nesting cluster — dangerous and territorial.',
    special: 'regeneration', // Heals 2-4 HP per turn
    specialDesc: 'Regeneration: Recovers HP each turn' },
  
  { id: 'ravager', name: 'Ravager', hpRange: [20, 30], attackRange: [10, 16], stealth: 0.1,
    flavor: 'Heavily armored brute with crushing limbs.',
    special: 'armored', // Takes 50% less damage from all attacks
    specialDesc: 'Armored Carapace: Resistant to damage' },
  
  // Elite threats
  { id: 'spectre', name: 'Spectre', hpRange: [12, 18], attackRange: [6, 11], stealth: 0.7, 
    flavor: 'An elusive lifeform that strikes from darkness.',
    special: 'phase', // 40% chance to avoid all damage
    specialDesc: 'Phase Shift: Frequently phases out of reality' },
  
  { id: 'queen', name: 'Hive Queen', hpRange: [35, 50], attackRange: [12, 20], stealth: 0,
    flavor: 'Massive apex predator. Commands the hive.',
    special: 'multistrike', // Attacks twice per turn
    specialDesc: 'Multi-Strike: Attacks twice each turn' }
];

const RECIPES = {
  medkit: { scrap: 15, energy: 0, result: () => { state.inventory.push({ id: state.nextItemId++, type: 'medkit' }); appendLog('Medkit crafted.'); } },
  ammo: { scrap: 10, energy: 0, result: () => { state.resources.ammo += rand(4, 10); appendLog('Ammo manufactured.'); } },
  turret: { scrap: 75, energy: 40, tech: 3, result: () => { state.systems.turret++; appendLog('Auto-turret constructed.'); } },
  armor: { name: 'Light Armor', scrap: 40, tech: 3, durability: 100, result: () => { state.inventory.push({ id: state.nextItemId++, type: 'armor', name: 'Light Armor', durability: 100, maxDurability: 100 }); appendLog('Light Armor crafted.'); } },
  rifle: { name: 'Pulse Rifle', scrap: 55, tech: 5, durability: 100, result: () => { state.inventory.push({ id: state.nextItemId++, type: 'rifle', name: 'Pulse Rifle', durability: 100, maxDurability: 100 }); appendLog('Pulse Rifle built.'); } },
  heavyArmor: { name: 'Heavy Armor', scrap: 70, tech: 5, durability: 200, result: () => { state.inventory.push({ id: state.nextItemId++, type: 'heavyArmor', name: 'Heavy Armor', durability: 200, maxDurability: 200 }); appendLog('Heavy Armor crafted.'); } },
  shotgun: { name: 'Shotgun', scrap: 65, tech: 4, durability: 80, result: () => { state.inventory.push({ id: state.nextItemId++, type: 'shotgun', name: 'Shotgun', durability: 80, maxDurability: 80 }); appendLog('Shotgun built.'); } },
  hazmatSuit: { name: 'Hazmat Suit', scrap: 85, tech: 6, durability: 150, result: () => { state.inventory.push({ id: state.nextItemId++, type: 'hazmatSuit', name: 'Hazmat Suit', durability: 150, maxDurability: 150 }); appendLog('Hazmat Suit assembled.'); } }
};

const TASKS = ['Idle', 'Oxygen', 'Food', 'Energy', 'Scrap', 'Guard'];
