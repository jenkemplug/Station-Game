const VERSION = '0.9.20';
const BASE_GAME_KEY = `derelict_station_expanded_v${VERSION}`;
const TICK_MS = 1000;
const MAX_LOG = 300;

const BALANCE = {
  // Interactive combat
  COMBAT_ACTIONS: {
    Aim: { accuracyBonus: 0.25 },
    Burst: { dmgBonus: 0, accuracyPenalty: 0.05, ammoMult: 2, cooldown: 3 },
    PowerAttack: { dmgBonus: 8, cooldown: 2 },
    Guard: { defenseBonus: 3 },
    MedkitHeal: [10, 18]
  },
  // 0.9.0 - Consumable effects in combat
  CONSUMABLE_EFFECTS: {
    medkit: { heal: [12, 20], desc: 'Heal 12-20 HP' },
    advanced_medkit: { heal: [25, 35], desc: 'Heal 25-35 HP (superior healing)' },
    stimpack: { evasionBonus: 0.20, retreatBonus: 0.25, duration: 4, desc: '+20% dodge, +25% retreat for 4 turns.' },
    repair_kit: { durabilityRestore: 40, desc: 'Restore 40 durability to equipped weapon or armor' },
    combat_drug: { damageBonus: 0.20, maxHpCost: 0.20, duration: 3, desc: '+20% damage for 3 turns, -20% max HP.' },
    stun_grenade: { stunChance: 0.75, duration: 2, desc: '75% chance to stun target enemy for 2 turns' },
    nanite_injector: { permanentHP: 1, desc: '+1 permanent max HP' },
    revival_kit: { reviveHP: [0.40, 0.60], desc: 'Revive ally at 40-60% HP' },
    system_override: { instakill: true, hpThreshold: 12, desc: 'Instantly kill 1 enemy with ≤12 HP' },
    stealth_field: { dodgeNext: true, duration: 1, desc: 'Dodge next attack automatically' },
    sonic_repulsor: { threatReduction: 5, desc: 'Reduce station threat by 5%' }
  },
  BASE_HIT_CHANCE: 0.72, // Reduced from 0.75 - combat is harder
  CRIT_CHANCE: 0.12,
  CRIT_MULT: 1.6,
  UNARMED_DAMAGE: [1, 3], // Damage when no weapon equipped
  // Turret combat (0.7.3)
  TURRET_BASE_DAMAGE: 5, // Reduced from 7 for longer tactical combats
  TURRET_HIT_CHANCE: 0.80, // Reduced from 0.82 - turrets provide support, not carry
  TURRET_THREAT_REDUCTION: 0.15,
  // Retreat mechanics (0.7.2)
  RETREAT_BASE_CHANCE: 0.45, // Reduced from 0.50 - harder to escape
  // 0.9.0 - Removed RETREAT_SKILL_BONUS (skill system removed)
  RETREAT_LEVEL_BONUS: 0.02, // per level
  RETREAT_ALIEN_PENALTY: {
    drone: 0.05,      // easy to escape from
    lurker: 0,        // neutral
    stalker: -0.08,   // harder to escape (increased penalty from -0.05)
    spitter: -0.04,   // increased from -0.02
    brood: -0.12,     // increased from -0.10
    ravager: -0.10,   // increased from -0.08
    spectre: 0.02,    // reduced from 0.05 - harder to escape despite phasing
    queen: -0.18      // increased from -0.15 - nearly impossible
  },
  // Map & exploration costs (click-to-explore only)
  // 0.8.1 - Normalized to uniform 15 energy to prevent revealing tile types
  TILE_ENERGY_COST: {
    hazard: 15,
    alien: 15,
    resource: 15,
    module: 15,
    survivor: 15,
    empty: 15
  },
  SURVIVOR_RECRUIT_CHANCE: 0.80, // Reduced from 0.85
  HAZARD_DURABILITY_LOSS: [15, 25], // Increased from [12, 20] - hazards are riskier
  HAZARD_LOOT_ROLLS: 3,
  
  // Corridor respawn system (1.0) - Rebalanced for faster action
  RESPAWN_COOLDOWN: 120, // Seconds before cleared corridor tiles can respawn content (2 minutes - was 5)

  // Resource consumption (per tick)
  O2_BASE: 0.12, // Reduced from 0.18 - less punishing base drain
  O2_PER_SURVIVOR: 0.35, // Increased from 0.32 - late game pressure
  FOOD_BASE: 0.08, // Reduced from 0.12 - less aggressive base drain
  FOOD_PER_SURVIVOR: 0.20, // Increased from 0.18 - late game scaling pressure
  
  // Critical state thresholds
  OXY_CRITICAL_THRESHOLD: 10,
  OXY_DAMAGE_RANGE: [2, 5], // Increased max from 4 to 5
  INTEGRITY_DAMAGE_OXY_CRIT: 0.12, // Increased from 0.10
  MORALE_LOSS_OXY_CRIT: 0.5, // Increased from 0.4
  MORALE_LOSS_ASPHYXIA: 0.7, // Increased from 0.6
  MORALE_LOSS_STARVATION: 0.35, // Increased from 0.30 - more morale pressure
  STARVATION_CHANCE: 0.05, // Reduced from 0.08 - less RNG death, more strategic pressure
  
  // 0.9.0 - Base Integrity & Morale Systems
  // Base Integrity Tiers: 100-80 (pristine), 79-60 (minor), 59-40 (damaged), 39-20 (critical), 19-1 (collapsing), 0 (game over)
  INTEGRITY_TIER_THRESHOLDS: [80, 60, 40, 20, 0],
  INTEGRITY_PROD_PENALTY: [0, 0.05, 0.10, 0.20, 0.30], // Production penalty per tier (0%, 5%, 10%, 20%, 30%)
  INTEGRITY_FAILURE_MULT: [1.0, 1.10, 1.25, 1.50, 2.00], // System failure chance multiplier per tier
  INTEGRITY_DAMAGE_PER_FAILED_SYSTEM: 0.05, // Damage per tick for each failed system left unrepaired
  INTEGRITY_DAMAGE_HIGH_THREAT: 0.02, // Damage per tick when threat > 75%
  INTEGRITY_DAMAGE_ON_RAID_LOSS: [3, 10], // Damage when raid defense fails (scaled by alien count)
  INTEGRITY_DAMAGE_ON_BREACH: [1, 3], // 10% chance per alien on raid victory
  BASE_REPAIR_SCRAP_COST: 400, // Increased from 300
  BASE_REPAIR_ENERGY_COST: 150, // Increased from 100
  ENGINEER_PASSIVE_REPAIR: 0.1, // Engineers on Idle repair +0.1 integrity/tick
  
  // Morale Tiers: 80-100 (high), 60-79 (stable), 40-59 (low), 20-39 (despondent), 0-19 (breaking)
  MORALE_TIER_THRESHOLDS: [80, 60, 40, 20, 0],
  MORALE_HIGH_PROD_BONUS: 0.10, // +10% production at high morale
  MORALE_HIGH_COMBAT_BONUS: 0.05, // +5% combat damage at high morale
  MORALE_HIGH_XP_BONUS: 0.10, // +10% XP gain at high morale
  MORALE_LOW_PROD_PENALTY: 0.10, // -10% production at low morale
  MORALE_LOW_COMBAT_PENALTY: 0.05, // -5% combat damage at low morale
  MORALE_DESPONDENT_PROD_PENALTY: 0.20, // -20% production when despondent
  MORALE_DESPONDENT_COMBAT_PENALTY: 0.10, // -10% combat damage when despondent
  MORALE_DESPONDENT_DESERT_CHANCE: 0.02, // 2% chance to desert per hour when despondent
  MORALE_BREAKING_PROD_PENALTY: 0.30, // -30% production at breaking point
  MORALE_BREAKING_COMBAT_PENALTY: 0.15, // -15% combat damage at breaking point
  MORALE_BREAKING_DESERT_CHANCE: 0.05, // 5% chance to desert per hour at breaking point
  MORALE_GAIN_COMBAT_WIN: 5,
  MORALE_GAIN_RAID_WIN: 10,
  MORALE_GAIN_LEVEL_UP: 8,
  MORALE_GAIN_EXPEDITION_SUCCESS: 6,
  MORALE_GAIN_ALIEN_KILL: 2,
  MORALE_LOSS_ALLY_DEATH: 10,
  MORALE_LOSS_ALLY_DOWNED: 5,
  MORALE_LOSS_BASE_TIERED: [0, 0.02, 0.05, 0.10, 0.15], // Per tick, based on integrity tier
  MORALE_LOSS_BASE_CRITICAL: 0.15, // Per tick when base < 40%
  MORALE_LOSS_RAID_LOST: 15,
  MORALE_LOSS_NO_GUARDS: 20, // Morale penalty for failing to post guards
  MORALE_LOSS_RETREAT: 6,
  MORALE_LOSS_HIGH_THREAT: 0.10, // Per tick when threat > 75%
  MORALE_LOSS_SYSTEM_FAILURE: 0.05, // Per tick per failed system
  MORALE_NATURAL_RECOVERY: 0.10, // Per tick when resources healthy
  MORALE_REST_RECOVERY: 0.25, // Per tick for survivors on Idle task
  
  // 0.8.10 - Gameplay rebalance
  OXYGEN_PENALTY_NO_ENERGY: 0.1, // Oxygen production is only 10% effective without energy
  MAX_GUARDS: 4,                 // Max number of survivors that can be assigned to Guard duty
  MAX_TURRETS: 5,                // Max number of turrets that can be built
  
  // 0.9.0 - Rebalanced for longer runs with endgame escalation system
  // Threat tiers: Once you hit a tier, you can't go below it (high water marks)
  THREAT_TIERS: [0, 25, 50, 75, 100],  // 0% → 25% → 50% → 75% → 100% floors (wider gaps for longer runs)
  THREAT_GROWTH_BASE: 0.025,          // Reduced from 0.030
  THREAT_GROWTH_RAND: 0.015,          // Reduced from 0.020
  THREAT_GROWTH_MINIMUM: 0.015,       // Threat always grows at least +1.5%/min even with max defenses
  GUARD_THREAT_REDUCTION: 0.08,       // Guards slow threat, can't stop it
  THREAT_GAIN_PER_ALIEN: [1, 2],      // Increased from [1, 2] - combat drives threat progression
  THREAT_GAIN_PER_ALIEN_KILL: 1, // Threat gain for each alien kill
  THREAT_GAIN_PER_TILE: 0.005,        // Threat gain for each tile explored
  THREAT_GAIN_ON_RETREAT: [1, 2],     // NEW: Retreating from combat adds threat
  EXPEDITION_FAILURE_THREAT_GAIN: [4, 8], // Increased from [3, 6] - failed expeditions matter more
  
  // 0.9.0 - Rebalanced for longer runs: less passive, more action-driven
  RAID_TIERS: [0, 0.008, 0.020, 0.040, 0.065],  // 0% → 0.8% → 2% → 4% → 6.5% floors per minute (wider gaps)
  BOARD_RISK_DIVISOR: 120,
  BOARD_RISK_BASE_NO_TURRET: 0.05,
  // Per-minute baseline chance; reduced for slower progression
  RAID_BASE_CHANCE: 0.0012,  // Reduced from 0.0020 - much slower passive buildup
  RAID_THREAT_DIVISOR: 4000, // Increased from 3000 - threat contributes even less
  RAID_MAX_CHANCE: 0.10,     // 10% per minute cap
  // Defense effectiveness unchanged
  RAID_CHANCE_REDUCTION_PER_GUARD: 0.0020,
  RAID_CHANCE_REDUCTION_PER_TURRET: 0.0015,
  RAID_DEFENSE_SOFTCAP: 0.05,                // 5% max reduction
  // 0.9.0 - Exploration and combat are main drivers (reduced passive pressure)
  RAID_CHANCE_PER_TILE: 0.00015,      // Reduced from 0.00025 - less tile spam pressure
  RAID_CHANCE_PER_ALIEN_KILL: 0.0010, // Reduced from 0.0015 - combat still matters but less aggressive
  // 0.8.9 - Expedition failure consequences
  EXPEDITION_FAILURE_RAID_PRESSURE: 0.005,  // +0.5% temporary raid pressure on failure
  // 0.9.0 – Raid cooldown for tactical pacing
  RAID_MIN_INTERVAL_SEC: 600,  // 10 minutes (reduced from 15)
  RAID_MAX_INTERVAL_SEC: 900,  // 15 minutes (reduced from 30)
  TURRET_POWER_PER: 15,
  RAID_ATTACK_RANGE: [6, 28],
  THREAT_REDUCE_ON_REPEL: 4,
  INTEGRITY_DAMAGE_ON_BREACH: [3, 10],
  INTEGRITY_DAMAGE_RAID_DEFEAT: [15, 25], // Penalty for losing a defended raid
  INTEGRITY_DAMAGE_NO_GUARDS: [30, 45], // Harsher penalty for having no guards
  NEST_CHANCE_AFTER_BREACH: 0.20,
  CASUALTY_CHANCE: 0.10,
  NEST_CHANCE_NO_DEFEND: 0.30,
  
  // 0.9.0 - Endgame Escalation System (activates at 100% threat)
  ESCALATION_TIME_INTERVAL_SEC: 300,  // Escalation level +1 every 5 minutes at 100% threat
  ESCALATION_PER_RAID_SURVIVED: 1,    // +1 escalation for each raid survived at 100%
  ESCALATION_HP_MULT: 0.08,           // +8% alien HP per escalation level
  ESCALATION_ATTACK_MULT: 0.06,       // +6% alien attack per escalation level
  ESCALATION_ARMOR_PER_2_LEVELS: 1,   // +1 armor every 2 escalation levels
  ESCALATION_MODIFIER_MULT: 0.10,     // +10% special ability chance per level
  ESCALATION_RAID_COOLDOWN_REDUCTION: 30, // Raids 30s faster per escalation level
  
  // Expeditions
  EXPEDITION_SUCCESS_CHANCE: 0.65,
  EXPEDITION_COST_FOOD: 10,
  EXPEDITION_COST_ENERGY: 15,
  EXPEDITION_DEFAULT_DURATION: 35,
  EXPEDITION_WEAPON_WEAR: [5, 15],
  EXPEDITION_ARMOR_WEAR: [10, 25],
  EXPEDITION_FAILURE_DAMAGE: [5, 15],
  EXPEDITION_REWARDS: {
    scrap: [10, 30],
    tech: [1, 4]
  },
  XP_FROM_EXPEDITION_SUCCESS: 25,
  XP_FROM_EXPEDITION_FAILURE: 10,
  
  // XP & leveling
  XP_MULT: 0.9,
  XP_FROM_EXPLORE: 1,
  XP_FROM_LOOT: 1,
  COMBAT_XP_RANGE: [5, 12],
  
  // Production multipliers
  PROD_MULT: 1,
  BASE_SYSTEM_PRODUCTION: { // 0.8.13 - Base production for level 0 systems
    oxygen: 0.50, // Increased from 0.40 - better base system output
    energy: 0.75  // Increased from 0.25 - better early game energy (1.0 balance pass)
  },
  SYSTEM_FILTER_MULT: 1.0,
  SYSTEM_GENERATOR_MULT: 1.0,
  SURVIVOR_PROD: {
    Oxygen: { base: 1.25 },  // Increased from 1.1 - better survivor production
    Food: { base: 1.15 },    // Increased from 1.05 - better food generation
    Energy: { base: 1.8 },  // Increased from 0.95 - better early game energy generation (1.0 balance pass)
    Scrap: { base: 0.65 },   // Increased from 0.6 - slightly better scrap generation
    IdleOxygen: 0, // 0.8.13 - Idle survivors no longer produce resources
    FoodYieldFactor: 0.95, // 0.8.11 - Increased from 0.6 to make food ~15% worse than oxygen
    // 0.8.8 - Energy consumption rebalanced to per-survivor basis
    PassiveEnergyDrainPerSurvivor: 0.10,  // Reduced from 0.18 - less punishing early game (1.0 balance pass)
    PassiveEnergyDrainPerTurret: 0.06,    // Turret drain (unchanged)
    PassiveEnergyDrainPerFilterLevel: 0.08 // Filter upgrade drain (unchanged)
  },
  LEVEL_PRODUCTION_BONUS: 0.05,
  LEVEL_ATTACK_BONUS: 0.015, // +1.5% damage per level (reduced from 2% for longer combats)
  LEVEL_ACCURACY_BONUS: 0.01, // +1% hit chance per level (max +20% at level 20)
  
  // Combat
  AMMO_CONSUME_CHANCE: 0.65, // Increased from 0.60 - ammo drains faster
  
  // Economy & upgrades
  BASE_RECRUIT_COST: 18, // Increased from 15
  EXPLORED_DISCOUNT_MAX: 0.35, // Reduced from 0.40 - less discount
  REPAIR_COST_PER_POINT: 0.6, // Increased from 0.5 - repairs are more expensive
  UPGRADE_COSTS: {
    filter: { base: 55, perLevel: 28 }, // Increased from 50/25
    generator: { base: 50, perLevel: 25 }, // Increased from 45/22
    turret: { scrap: 90, energy: 45 } // Increased from 80/40
  },
  // 0.8.0 - System repair costs after failures
  REPAIR_COSTS: {
    filter: { scrap: 35, energy: 15 }, // Increased from 30/12
    generator: { scrap: 50, energy: 0 }, // Increased from 25/18
    turret: { scrap: 45, energy: 30 } // Increased from 40/25
  }
};

// 1.0 - Blueprint System: Hand-Crafted Station Map
const BLUEPRINT = {
  // Map dimensions (138x73 hand-crafted station layout)
  MAP_WIDTH: 138,
  MAP_HEIGHT: 73,
  
  // Corridor generation parameters
  NUM_MAIN_CORRIDORS: 6,        // Number of primary hallways radiating from base
  MIN_CORRIDOR_LENGTH: 8,       // Minimum corridor segment length
  MAX_CORRIDOR_LENGTH: 18,      // Maximum corridor segment length
  BRANCH_CHANCE: 0.35,          // 35% chance to branch at each junction
  MAX_BRANCH_DEPTH: 3,          // How many levels deep branches can go
  CORRIDOR_WIDTH_CHANCE: 0.25,  // 25% chance for 2-tile wide corridors
  
  // Content spawn chances (in corridors only)
  CORRIDOR_RESOURCE_CHANCE: 0.12,  // 12% chance per corridor tile
  CORRIDOR_ALIEN_CHANCE: 0.08,     // 8% chance per corridor tile
  CORRIDOR_SURVIVOR_CHANCE: 0.03,  // 3% chance per corridor tile
  
  // Vision and fog-of-war system
  VISION_RADIUS: 4,                // How far explorer can see (reveals structure)
  CONTENT_DISCOVERY_RADIUS: 0,     // Must step on tile to discover content (0 = touch only)
  
  // Reserved space for future sector placement
  SECTOR_RESERVED_RADIUS: 8    // Keep this much space clear around corridor endpoints
};

// 0.9.0 - Weapon type mechanics
const WEAPON_TYPES = {
  melee: { ammoMult: 0, hitMod: -0.10, desc: 'Close combat, no ammo required' },
  pistol: { ammoMult: 0.40, hitMod: 0, desc: 'Sidearm with low ammo cost' },
  rifle: { ammoMult: 0.60, hitMod: 0, desc: 'Standard firearm' },
  shotgun: { ammoMult: 0.80, hitMod: 0, desc: 'Spread weapon with variable damage' },
  heavy: { ammoMult: 1.0, hitMod: -0.10, desc: 'Heavy ordinance with high damage' }
};

// 0.9.0 - Weapon special effects
const WEAPON_EFFECTS = {
  burn: { chance: 0.20, damage: [1, 3], turns: 3, desc: 'Deals damage over time' },
  stun: { chance: 0.15, turns: 1, desc: 'Target loses next turn' },
  armorPierce: { desc: 'Ignores % of armor' }, // percentage-based
  phase: { ignoreArmor: true, hitsPhasing: true, desc: 'Bypasses defenses' },
  splash: { targets: 1, damagePercent: 0.5, desc: 'Hits adjacent enemy' }
};

// 0.9.0 - Armor special effects
const ARMOR_EFFECTS = {
  dodge: { desc: 'Increases evasion chance' },
  reflect: { desc: 'Returns % damage to attacker' },
  regen: { hpPerTurn: 5, desc: 'Restores HP each turn' },
  immunity: { desc: 'Immune to specific damage types' },
  hpBonus: { desc: 'Increases max HP' }
};

// 0.9.0 - Rarity color coding (matches ability/modifier colors from CSS)
const RARITY_COLORS = {
  common: '#a0a0a0',      // Gray
  uncommon: '#a78bfa',    // Purple (matches --rarity-uncommon)
  rare: '#fb923c',        // Orange
  veryrare: '#ef4444',     // Red - Legendary
  boss: '#22c55e',         // Green for unique mission enemies
  special: '#06b6d4'      // Cyan for special mission enemies
};

const LOOT_TABLE = [
  // ===== COMMON TIER (65% total weight - increased from 50%) =====
  { type: 'junk', weight: 30, rarity: 'common', desc: 'Scrap wiring and bent conduits', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'junk', name: 'Junk', rarity: 'common' };
    return tryAddAndReturn(item, 'Junk added to inventory.', 'Inventory full.');
  }},
  { type: 'foodpack', weight: 14, rarity: 'common', desc: 'Sealed ration pack', onPickup: (s) => { s.resources.food += rand(4, 12); return 'Recovered food supplies.'; } },
  { type: 'ammo', weight: 10, rarity: 'common', desc: 'Energy cells', onPickup: (s) => { s.resources.ammo += rand(3, 8); return 'Ammo recovered.'; } },
  
  // Common melee weapons
  { type: 'makeshift_pipe', weight: 3.5, rarity: 'common', desc: 'Scrap metal bent into a weapon', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'weapon', subtype: 'makeshift_pipe', weaponType: 'melee', name: 'Makeshift Pipe', rarity: 'common', durability: 15, maxDurability: 15, damage: [2, 3] }; 
    return tryAddAndReturn(item, '', ''); 
  }},
  { type: 'sharpened_tool', weight: 3.5, rarity: 'common', desc: 'Station tools repurposed for combat', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'weapon', subtype: 'sharpened_tool', weaponType: 'melee', name: 'Sharpened Tool', rarity: 'common', durability: 20, maxDurability: 20, damage: [3, 5] }; 
    return tryAddAndReturn(item, '', ''); 
  }},
  { type: 'crowbar', weight: 3, rarity: 'common', desc: 'Heavy but effective', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'weapon', subtype: 'crowbar', weaponType: 'melee', name: 'Crowbar', rarity: 'common', durability: 25, maxDurability: 25, damage: [4, 6] }; 
    return tryAddAndReturn(item, '', ''); 
  }},
  
  // Common pistols
  { type: 'scrap_pistol', weight: 3, rarity: 'common', desc: 'Barely functional firearm', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'weapon', subtype: 'scrap_pistol', weaponType: 'pistol', name: 'Scrap Pistol', rarity: 'common', durability: 30, maxDurability: 30, damage: [4, 5] }; 
    return tryAddAndReturn(item, '', ''); 
  }},
  { type: 'old_revolver', weight: 2.5, rarity: 'common', desc: 'Reliable but outdated', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'weapon', subtype: 'old_revolver', weaponType: 'pistol', name: 'Old Revolver', rarity: 'common', durability: 35, maxDurability: 35, damage: [5, 6] }; 
    return tryAddAndReturn(item, '', ''); 
  }},
  { type: 'jury_rigged_pistol', weight: 2.5, rarity: 'common', desc: 'Held together with hope', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'weapon', subtype: 'jury_rigged_pistol', weaponType: 'pistol', name: 'Jury-Rigged Pistol', rarity: 'common', durability: 25, maxDurability: 25, damage: [3, 6] }; 
    return tryAddAndReturn(item, '', ''); 
  }},
  { type: 'homemade_handgun', weight: 2.5, rarity: 'common', desc: 'Basic but functional', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'weapon', subtype: 'homemade_handgun', weaponType: 'pistol', name: 'Homemade Handgun', rarity: 'common', durability: 30, maxDurability: 30, damage: [4, 6] }; 
    return tryAddAndReturn(item, '', ''); 
  }},
  
  // Common melee (add 1 more)
  { type: 'steel_pipe', weight: 3, rarity: 'common', desc: 'Solid metal club', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'weapon', subtype: 'steel_pipe', weaponType: 'melee', name: 'Steel Pipe', rarity: 'common', durability: 25, maxDurability: 25, damage: [3, 6] }; 
    return tryAddAndReturn(item, '', ''); 
  }},
  
  // Common armor
  { type: 'scrap_vest', weight: 3.5, rarity: 'common', desc: 'Makeshift protection', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'armor', subtype: 'scrap_vest', name: 'Scrap Vest', rarity: 'common', durability: 30, maxDurability: 30, defense: 1 }; 
    return tryAddAndReturn(item, '', ''); 
  }},
  { type: 'padded_suit', weight: 3, rarity: 'common', desc: 'Layered clothing', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'armor', subtype: 'padded_suit', name: 'Padded Suit', rarity: 'common', durability: 40, maxDurability: 40, defense: 2 }; 
    return tryAddAndReturn(item, '', ''); 
  }},
  { type: 'work_gear', weight: 3, rarity: 'common', desc: 'Reinforced work clothes', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'armor', subtype: 'work_gear', name: 'Work Gear', rarity: 'common', durability: 35, maxDurability: 35, defense: 1 }; 
    return tryAddAndReturn(item, '', ''); 
  }},
  { type: 'leather_jacket', weight: 3, rarity: 'common', desc: 'Tough hide protection', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'armor', subtype: 'leather_jacket', name: 'Leather Jacket', rarity: 'common', durability: 45, maxDurability: 45, defense: 2 }; 
    return tryAddAndReturn(item, '', ''); 
  }},
  
  // Common components
  { type: 'weaponPart', weight: 6.0, rarity: 'common', desc: 'Basic weapon components', onPickup: (s) => { const item = { id: s.nextItemId++, type: 'component', subtype: 'weaponPart', name: 'Weapon Part', rarity: 'common' }; return tryAddAndReturn(item, '', ''); } },
  
  // ===== UNCOMMON TIER (22% total weight - reduced from 30%) =====
  { type: 'tech', weight: 10.0, rarity: 'uncommon', desc: 'Sensitive electronics and processors', onPickup: (s) => { s.resources.tech += 1; return 'Tech component recovered.'; } }, // Increased from 4.0 for massive map (1.0 balance pass)
  
  // 1.0 - Mission Keycards (high weight 8.0 for progression, filtered dynamically by pickLoot)
  { type: 'medicalBayKeycard', weight: 8.0, rarity: 'uncommon', desc: '🔑 Medical Bay access keycard', onPickup: (s) => {
    if (!s.keycards.includes('medicalBay')) {
      s.keycards.push('medicalBay');
      return '🔑 Medical Bay Keycard found! Mission access granted.';
    }
    return 'Already have this keycard.';
  }},
  { type: 'engineeringDeckKeycard', weight: 8.0, rarity: 'uncommon', desc: '🔑 Engineering Deck access keycard', onPickup: (s) => {
    if (!s.keycards.includes('engineeringDeck')) {
      s.keycards.push('engineeringDeck');
      return '🔑 Engineering Deck Keycard found! Mission access granted.';
    }
    return 'Already have this keycard.';
  }},
  { type: 'securityWingKeycard', weight: 8.0, rarity: 'uncommon', desc: '🔑 Security Wing access keycard', onPickup: (s) => {
    if (!s.keycards.includes('securityWing')) {
      s.keycards.push('securityWing');
      return '🔑 Security Wing Keycard found! Mission access granted.';
    }
    return 'Already have this keycard.';
  }},
  { type: 'crewQuartersKeycard', weight: 8.0, rarity: 'uncommon', desc: '🔑 Crew Quarters access keycard', onPickup: (s) => {
    if (!s.keycards.includes('crewQuarters')) {
      s.keycards.push('crewQuarters');
      return '🔑 Crew Quarters Keycard found! Mission access granted.';
    }
    return 'Already have this keycard.';
  }},
  { type: 'researchLabsKeycard', weight: 8.0, rarity: 'uncommon', desc: '🔑 Research Labs access keycard', onPickup: (s) => {
    if (!s.keycards.includes('researchLabs')) {
      s.keycards.push('researchLabs');
      return '🔑 Research Labs Keycard found! Mission access granted.';
    }
    return 'Already have this keycard.';
  }},
  { type: 'shoppingMallKeycard', weight: 8.0, rarity: 'uncommon', desc: '🔑 Shopping Mall access keycard', onPickup: (s) => {
    if (!s.keycards.includes('shoppingMall')) {
      s.keycards.push('shoppingMall');
      return '🔑 Shopping Mall Keycard found! Mission access granted.';
    }
    return 'Already have this keycard.';
  }},
  { type: 'maintenanceHubKeycard', weight: 8.0, rarity: 'uncommon', desc: '🔑 Maintenance Hub access keycard', onPickup: (s) => {
    if (!s.keycards.includes('maintenanceHub')) {
      s.keycards.push('maintenanceHub');
      return '🔑 Maintenance Hub Keycard found! Mission access granted.';
    }
    return 'Already have this keycard.';
  }},
  { type: 'communicationsKeycard', weight: 8.0, rarity: 'uncommon', desc: '🔑 Communications access keycard', onPickup: (s) => {
    if (!s.keycards.includes('communications')) {
      s.keycards.push('communications');
      return '🔑 Communications Keycard found! Mission access granted.';
    }
    return 'Already have this keycard.';
  }},
  { type: 'cargoBayKeycard', weight: 8.0, rarity: 'uncommon', desc: '🔑 Cargo Bay access keycard', onPickup: (s) => {
    if (!s.keycards.includes('cargoBay')) {
      s.keycards.push('cargoBay');
      return '🔑 Cargo Bay Keycard found! Mission access granted.';
    }
    return 'Already have this keycard.';
  }},
  { type: 'corporateOfficesKeycard', weight: 8.0, rarity: 'uncommon', desc: '🔑 Corporate Offices access keycard', onPickup: (s) => {
    if (!s.keycards.includes('corporateOffices')) {
      s.keycards.push('corporateOffices');
      return '🔑 Corporate Offices Keycard found! Mission access granted.';
    }
    return 'Already have this keycard.';
  }},
  { type: 'reactorChamberKeycard', weight: 8.0, rarity: 'uncommon', desc: '🔑 Reactor Chamber access keycard', onPickup: (s) => {
    if (!s.keycards.includes('reactorChamber')) {
      s.keycards.push('reactorChamber');
      return '🔑 Reactor Chamber Keycard found! Mission access granted.';
    }
    return 'Already have this keycard.';
  }},
  { type: 'observationDeckKeycard', weight: 8.0, rarity: 'uncommon', desc: '🔑 Observation Deck access keycard', onPickup: (s) => {
    if (!s.keycards.includes('observationDeck')) {
      s.keycards.push('observationDeck');
      return '🔑 Observation Deck Keycard found! Mission access granted.';
    }
    return 'Already have this keycard.';
  }},
  { type: 'hangarBayKeycard', weight: 8.0, rarity: 'uncommon', desc: '🔑 Hangar Bay access keycard', onPickup: (s) => {
    if (!s.keycards.includes('hangarBay')) {
      s.keycards.push('hangarBay');
      return '🔑 Hangar Bay Keycard found!';
    }
    return 'Already have this keycard.';
  }},
  
  // Uncommon melee weapons
  { type: 'combat_knife', weight: 1.6, rarity: 'uncommon', desc: 'Military-grade blade', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'weapon', subtype: 'combat_knife', weaponType: 'melee', name: 'Combat Knife', rarity: 'uncommon', durability: 40, maxDurability: 40, damage: [4, 7] }; 
    return tryAddAndReturn(item, '', ''); 
  }},
  { type: 'stun_baton', weight: 1.5, rarity: 'uncommon', desc: 'Electrical discharge weapon', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'weapon', subtype: 'stun_baton', weaponType: 'melee', name: 'Stun Baton', rarity: 'uncommon', durability: 50, maxDurability: 50, damage: [5, 8], effects: ['stun:10'] }; 
    return tryAddAndReturn(item, '', ''); 
  }},
  { type: 'reinforced_bat', weight: 1.4, rarity: 'uncommon', desc: 'Metal bat with added weight', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'weapon', subtype: 'reinforced_bat', weaponType: 'melee', name: 'Reinforced Bat', rarity: 'uncommon', durability: 45, maxDurability: 45, damage: [6, 9] }; 
    return tryAddAndReturn(item, '', ''); 
  }},
  { type: 'electro_spear', weight: 1.3, rarity: 'uncommon', desc: 'Charged polearm', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'weapon', subtype: 'electro_spear', weaponType: 'melee', name: 'Electro-Spear', rarity: 'uncommon', durability: 55, maxDurability: 55, damage: [5, 10], effects: ['stun:8'] }; 
    return tryAddAndReturn(item, '', ''); 
  }},
  
  // Uncommon pistols
  { type: 'laser_pistol', weight: 1.5, rarity: 'uncommon', desc: 'Energy sidearm', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'weapon', subtype: 'laser_pistol', weaponType: 'pistol', name: 'Laser Pistol', rarity: 'uncommon', durability: 60, maxDurability: 60, damage: [6, 9], effects: ['burn:10'] }; 
    return tryAddAndReturn(item, '', ''); 
  }},
  { type: 'heavy_pistol', weight: 1.4, rarity: 'uncommon', desc: 'High-caliber stopping power', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'weapon', subtype: 'heavy_pistol', weaponType: 'pistol', name: 'Heavy Pistol', rarity: 'uncommon', durability: 55, maxDurability: 55, damage: [7, 10] }; 
    return tryAddAndReturn(item, '', ''); 
  }},
  { type: 'burst_pistol', weight: 1.3, rarity: 'uncommon', desc: 'Three-round burst', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'weapon', subtype: 'burst_pistol', weaponType: 'pistol', name: 'Burst Pistol', rarity: 'uncommon', durability: 60, maxDurability: 60, damage: [6, 8], effects: ['burst:2'] }; 
    return tryAddAndReturn(item, '', ''); 
  }},
  { type: 'needle_pistol', weight: 1.3, rarity: 'uncommon', desc: 'Precision piercing rounds', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'weapon', subtype: 'needle_pistol', weaponType: 'pistol', name: 'Needle Pistol', rarity: 'uncommon', durability: 65, maxDurability: 65, damage: [5, 9], effects: ['armorPierce:10'] }; 
    return tryAddAndReturn(item, '', ''); 
  }},
  
  // Uncommon rifles
  { type: 'assault_rifle', weight: 1.2, rarity: 'uncommon', desc: 'Rapid-fire capability', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'weapon', subtype: 'assault_rifle', weaponType: 'rifle', name: 'Assault Rifle', rarity: 'uncommon', durability: 70, maxDurability: 70, damage: [8, 11], effects: ['burst:3'] }; 
    return tryAddAndReturn(item, '', ''); 
  }},
  { type: 'scoped_rifle', weight: 1.2, rarity: 'uncommon', desc: 'Precision weapon', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'weapon', subtype: 'scoped_rifle', weaponType: 'rifle', name: 'Scoped Rifle', rarity: 'uncommon', durability: 75, maxDurability: 75, damage: [9, 12], effects: ['crit:15'] }; 
    return tryAddAndReturn(item, '', ''); 
  }},
  { type: 'battle_rifle', weight: 1.1, rarity: 'uncommon', desc: 'Military-grade firearm', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'weapon', subtype: 'battle_rifle', weaponType: 'rifle', name: 'Battle Rifle', rarity: 'uncommon', durability: 80, maxDurability: 80, damage: [8, 13] }; 
    return tryAddAndReturn(item, '', ''); 
  }},
  { type: 'carbine', weight: 1.1, rarity: 'uncommon', desc: 'Compact rifle', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'weapon', subtype: 'carbine', weaponType: 'rifle', name: 'Carbine', rarity: 'uncommon', durability: 65, maxDurability: 65, damage: [7, 11] }; 
    return tryAddAndReturn(item, '', ''); 
  }},
  
  // Uncommon shotguns
  { type: 'pump_shotgun', weight: 1.2, rarity: 'uncommon', desc: 'Reliable close-range weapon', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'weapon', subtype: 'pump_shotgun', weaponType: 'shotgun', name: 'Pump Shotgun', rarity: 'uncommon', durability: 60, maxDurability: 60, damage: [7, 13] }; 
    return tryAddAndReturn(item, '', ''); 
  }},
  { type: 'auto_shotgun', weight: 1.1, rarity: 'uncommon', desc: 'Semi-automatic scatter', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'weapon', subtype: 'auto_shotgun', weaponType: 'shotgun', name: 'Auto-Shotgun', rarity: 'uncommon', durability: 65, maxDurability: 65, damage: [6, 14], effects: ['burst:1'] }; 
    return tryAddAndReturn(item, '', ''); 
  }},
  { type: 'riot_shotgun', weight: 1.1, rarity: 'uncommon', desc: 'Crowd control weapon', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'weapon', subtype: 'riot_shotgun', weaponType: 'shotgun', name: 'Riot Shotgun', rarity: 'uncommon', durability: 70, maxDurability: 70, damage: [7, 12], effects: ['stun:5'] }; 
    return tryAddAndReturn(item, '', ''); 
  }},
  { type: 'tactical_shotgun', weight: 1.0, rarity: 'uncommon', desc: 'Modular combat shotgun', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'weapon', subtype: 'tactical_shotgun', weaponType: 'shotgun', name: 'Tactical Shotgun', rarity: 'uncommon', durability: 75, maxDurability: 75, damage: [8, 13] }; 
    return tryAddAndReturn(item, '', ''); 
  }},
  
  // Uncommon armor
  { type: 'light_armor', weight: 1.5, rarity: 'uncommon', desc: 'Light Armor plating', onPickup: (s) => { const item = { id: s.nextItemId++, type: 'armor', subtype: 'light_armor', name: 'Light Armor', rarity: 'uncommon', durability: 100, maxDurability: 100, defense: 3 }; return tryAddAndReturn(item, '', ''); } },
  { type: 'tactical_vest', weight: 1.4, rarity: 'uncommon', desc: 'Combat-ready gear', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'armor', subtype: 'tactical_vest', name: 'Tactical Vest', rarity: 'uncommon', durability: 90, maxDurability: 90, defense: 3, effects: ['dodge:5'] }; 
    return tryAddAndReturn(item, '', ''); 
  }},
  { type: 'reinforced_plating', weight: 1.2, rarity: 'uncommon', desc: 'Extra protection', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'armor', subtype: 'reinforced_plating', name: 'Reinforced Plating', rarity: 'uncommon', durability: 120, maxDurability: 120, defense: 3 }; 
    return tryAddAndReturn(item, '', ''); 
  }},
  { type: 'ballistic_vest', weight: 1.3, rarity: 'uncommon', desc: 'Anti-projectile armor', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'armor', subtype: 'ballistic_vest', name: 'Ballistic Vest', rarity: 'uncommon', durability: 110, maxDurability: 110, defense: 3, effects: ['hpBonus:5'] }; 
    return tryAddAndReturn(item, '', ''); 
  }},
  
  // Uncommon components
  { type: 'armor_plating', weight: 3.0, rarity: 'uncommon', desc: 'Reinforcement material', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'component', subtype: 'armor_plating', name: 'Armor Plating', rarity: 'uncommon' }; 
    return tryAddAndReturn(item, '', ''); 
  }},
  { type: 'electronics', weight: 3.0, rarity: 'uncommon', desc: 'Circuit boards and chips', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'component', subtype: 'electronics', name: 'Electronics', rarity: 'uncommon' }; 
    return tryAddAndReturn(item, '', ''); 
  }},
  
  // Uncommon consumables
  { type: 'medkit', weight: 2.0, rarity: 'uncommon', desc: 'Field medkit (stabilizes wounds)', onPickup: (s) => { const item = { id: s.nextItemId++, type: 'medkit', name: 'Medkit', rarity: 'uncommon' }; return tryAddAndReturn(item, '', ''); } },
  { type: 'advanced_medkit', weight: 1.2, rarity: 'uncommon', desc: 'Superior medical supplies', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'consumable', subtype: 'advanced_medkit', name: 'Advanced Medkit', rarity: 'uncommon' }; 
    return tryAddAndReturn(item, '', ''); 
  }},
  { type: 'stimpack', weight: 1.0, rarity: 'uncommon', desc: '+20% dodge, +25% retreat for 4 turns.', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'consumable', subtype: 'stimpack', name: 'Stimpack', rarity: 'uncommon' }; 
    return tryAddAndReturn(item, '', ''); 
  }},
  
  // ===== RARE TIER (11% total weight - reduced from 15%) =====
  // Rare melee weapons
  { type: 'plasma_blade', weight: 0.5, rarity: 'rare', desc: 'Superheated cutting edge', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'weapon', subtype: 'plasma_blade', weaponType: 'melee', name: 'Plasma Blade', rarity: 'rare', durability: 80, maxDurability: 80, damage: [8, 13], effects: ['armorPierce:15'] }; 
    return tryAddAndReturn(item, '', ''); 
  }},
  { type: 'shock_maul', weight: 0.45, rarity: 'rare', desc: 'Heavy electrical weapon', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'weapon', subtype: 'shock_maul', weaponType: 'melee', name: 'Shock Maul', rarity: 'rare', durability: 75, maxDurability: 75, damage: [10, 13], effects: ['stun:20'] }; 
    return tryAddAndReturn(item, '', ''); 
  }},
  { type: 'vibro_axe', weight: 0.45, rarity: 'rare', desc: 'High-frequency cutting blade', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'weapon', subtype: 'vibro_axe', weaponType: 'melee', name: 'Vibro-Axe', rarity: 'rare', durability: 85, maxDurability: 85, damage: [9, 14], effects: ['armorPierce:20', 'crit:10'] }; 
    return tryAddAndReturn(item, '', ''); 
  }},
  { type: 'power_fist', weight: 0.4, rarity: 'rare', desc: 'Hydraulic-powered gauntlet', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'weapon', subtype: 'power_fist', weaponType: 'melee', name: 'Power Fist', rarity: 'rare', durability: 90, maxDurability: 90, damage: [11, 15] }; 
    return tryAddAndReturn(item, '', ''); 
  }},
  
  // Rare pistols
  { type: 'plasma_pistol', weight: 0.5, rarity: 'rare', desc: 'Advanced energy weapon', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'weapon', subtype: 'plasma_pistol', weaponType: 'pistol', name: 'Plasma Pistol', rarity: 'rare', durability: 90, maxDurability: 90, damage: [10, 13], effects: ['burn:15', 'armorPierce:25'] }; 
    return tryAddAndReturn(item, '', ''); 
  }},
  { type: 'smart_pistol', weight: 0.45, rarity: 'rare', desc: 'Auto-targeting system', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'weapon', subtype: 'smart_pistol', weaponType: 'pistol', name: 'Smart Pistol', rarity: 'rare', durability: 85, maxDurability: 85, damage: [8, 12], effects: ['accuracy:10'] }; 
    return tryAddAndReturn(item, '', ''); 
  }},
  { type: 'mag_pistol', weight: 0.45, rarity: 'rare', desc: 'Magnetic accelerator sidearm', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'weapon', subtype: 'mag_pistol', weaponType: 'pistol', name: 'Mag Pistol', rarity: 'rare', durability: 95, maxDurability: 95, damage: [9, 14], effects: ['armorPierce:15'] }; 
    return tryAddAndReturn(item, '', ''); 
  }},
  { type: 'arc_pistol', weight: 0.4, rarity: 'rare', desc: 'Lightning discharge weapon', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'weapon', subtype: 'arc_pistol', weaponType: 'pistol', name: 'Arc Pistol', rarity: 'rare', durability: 90, maxDurability: 90, damage: [8, 13], effects: ['stun:15', 'splash:10'] }; 
    return tryAddAndReturn(item, '', ''); 
  }},
  
  // Rare rifles
  { type: 'pulse_rifle', weight: 0.55, rarity: 'rare', desc: 'Pulse Rifle components', onPickup: (s) => { const item = { id: s.nextItemId++, type: 'weapon', subtype: 'pulse_rifle', weaponType: 'rifle', name: 'Pulse Rifle', rarity: 'rare', durability: 100, maxDurability: 100, damage: [10, 13] }; return tryAddAndReturn(item, '', ''); } },
  { type: 'plasma_rifle', weight: 0.5, rarity: 'rare', desc: 'Energy-based assault weapon', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'weapon', subtype: 'plasma_rifle', weaponType: 'rifle', name: 'Plasma Rifle', rarity: 'rare', durability: 95, maxDurability: 95, damage: [11, 15], effects: ['burn:20'] }; 
    return tryAddAndReturn(item, '', ''); 
  }},
  { type: 'laser_rifle', weight: 0.5, rarity: 'rare', desc: 'Precision beam weapon', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'weapon', subtype: 'laser_rifle', weaponType: 'rifle', name: 'Laser Rifle', rarity: 'rare', durability: 105, maxDurability: 105, damage: [9, 14], effects: ['burn:18', 'accuracy:8'] }; 
    return tryAddAndReturn(item, '', ''); 
  }},
  { type: 'marksman_rifle', weight: 0.45, rarity: 'rare', desc: 'Long-range precision firearm', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'weapon', subtype: 'marksman_rifle', weaponType: 'rifle', name: 'Marksman Rifle', rarity: 'rare', durability: 110, maxDurability: 110, damage: [12, 16], effects: ['crit:20', 'accuracy:10'] }; 
    return tryAddAndReturn(item, '', ''); 
  }},
  
  // Rare shotguns
  { type: 'combat_shotgun', weight: 0.5, rarity: 'rare', desc: 'Combat Shotgun components', onPickup: (s) => { const item = { id: s.nextItemId++, type: 'weapon', subtype: 'combat_shotgun', weaponType: 'shotgun', name: 'Combat Shotgun', rarity: 'rare', durability: 80, maxDurability: 80, damage: [8, 15] }; return tryAddAndReturn(item, '', ''); } },
  { type: 'plasma_shotgun', weight: 0.45, rarity: 'rare', desc: 'Energy scatter weapon', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'weapon', subtype: 'plasma_shotgun', weaponType: 'shotgun', name: 'Plasma Shotgun', rarity: 'rare', durability: 85, maxDurability: 85, damage: [10, 17], effects: ['burn:25'] }; 
    return tryAddAndReturn(item, '', ''); 
  }},
  { type: 'arc_shotgun', weight: 0.45, rarity: 'rare', desc: 'Electrified buckshot', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'weapon', subtype: 'arc_shotgun', weaponType: 'shotgun', name: 'Arc Shotgun', rarity: 'rare', durability: 90, maxDurability: 90, damage: [9, 16], effects: ['stun:20', 'splash:15'] }; 
    return tryAddAndReturn(item, '', ''); 
  }},
  { type: 'flechette_cannon', weight: 0.4, rarity: 'rare', desc: 'Armor-piercing shrapnel launcher', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'weapon', subtype: 'flechette_cannon', weaponType: 'shotgun', name: 'Flechette Cannon', rarity: 'rare', durability: 95, maxDurability: 95, damage: [8, 18], effects: ['armorPierce:30'] }; 
    return tryAddAndReturn(item, '', ''); 
  }},
  
  // Rare heavy weapons
  { type: 'light_machine_gun', weight: 0.45, rarity: 'rare', desc: 'Suppression weapon', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'weapon', subtype: 'light_machine_gun', weaponType: 'heavy', name: 'Light Machine Gun', rarity: 'rare', durability: 90, maxDurability: 90, damage: [11, 14], effects: ['burst:4'] }; 
    return tryAddAndReturn(item, '', ''); 
  }},
  { type: 'grenade_launcher', weight: 0.4, rarity: 'rare', desc: 'Area effect weapon', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'weapon', subtype: 'grenade_launcher', weaponType: 'heavy', name: 'Grenade Launcher', rarity: 'rare', durability: 70, maxDurability: 70, damage: [15, 20], effects: ['splash:50'] }; 
    return tryAddAndReturn(item, '', ''); 
  }},
  { type: 'plasma_cannon', weight: 0.4, rarity: 'rare', desc: 'Heavy energy projector', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'weapon', subtype: 'plasma_cannon', weaponType: 'heavy', name: 'Plasma Cannon', rarity: 'rare', durability: 95, maxDurability: 95, damage: [13, 18], effects: ['burn:30', 'splash:20'] }; 
    return tryAddAndReturn(item, '', ''); 
  }},
  { type: 'missile_pod', weight: 0.35, rarity: 'rare', desc: 'Multi-warhead launcher', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'weapon', subtype: 'missile_pod', weaponType: 'heavy', name: 'Missile Pod', rarity: 'rare', durability: 85, maxDurability: 85, damage: [14, 19], effects: ['splash:40', 'burst:1'] }; 
    return tryAddAndReturn(item, '', ''); 
  }},
  
  // Rare armor
  { type: 'heavy_armor', weight: 0.6, rarity: 'rare', desc: 'Heavy Armor plating', onPickup: (s) => { const item = { id: s.nextItemId++, type: 'armor', subtype: 'heavy_armor', name: 'Heavy Armor', rarity: 'rare', durability: 200, maxDurability: 200, defense: 5 }; return tryAddAndReturn(item, '', ''); } },
  { type: 'composite_armor', weight: 0.45, rarity: 'rare', desc: 'Advanced materials', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'armor', subtype: 'composite_armor', name: 'Composite Armor', rarity: 'rare', durability: 140, maxDurability: 140, defense: 4, effects: ['dodge:10'] }; 
    return tryAddAndReturn(item, '', ''); 
  }},
  { type: 'stealth_suit', weight: 0.4, rarity: 'rare', desc: 'Covert operations gear', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'armor', subtype: 'stealth_suit', name: 'Stealth Suit', rarity: 'rare', durability: 120, maxDurability: 120, defense: 4, effects: ['dodge:15', 'retreat:10'] }; 
    return tryAddAndReturn(item, '', ''); 
  }},
  { type: 'power_armor_frame', weight: 0.45, rarity: 'rare', desc: 'Exoskeleton-assisted', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'armor', subtype: 'power_armor_frame', name: 'Power Armor Frame', rarity: 'rare', durability: 180, maxDurability: 180, defense: 6, effects: ['hpBonus:10'] }; 
    return tryAddAndReturn(item, '', ''); 
  }},
  { type: 'hazmat_suit', weight: 0.5, rarity: 'rare', desc: 'A hazmat suit', onPickup: (s) => { const item = { id: s.nextItemId++, type: 'armor', subtype: 'hazmat_suit', name: 'Hazmat Suit', rarity: 'rare', durability: 150, maxDurability: 150, defense: 4 }; return tryAddAndReturn(item, '', ''); } },
  { type: 'thermal_suit', weight: 0.4, rarity: 'rare', desc: 'Temperature protection', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'armor', subtype: 'thermal_suit', name: 'Thermal Suit', rarity: 'rare', durability: 130, maxDurability: 130, defense: 4, effects: ['immunity:burn'] }; 
    return tryAddAndReturn(item, '', ''); 
  }},
  
  // Rare components (MORE COMMON than legendary items)
  { type: 'power_core', weight: 1.5, rarity: 'rare', desc: 'Compact fusion cell', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'component', subtype: 'power_core', name: 'Power Core', rarity: 'rare' }; 
    return tryAddAndReturn(item, '', ''); 
  }},
  { type: 'nano_material', weight: 1.4, rarity: 'rare', desc: 'Programmable matter', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'component', subtype: 'nano_material', name: 'Nano-Material', rarity: 'rare' }; 
    return tryAddAndReturn(item, '', ''); 
  }},
  { type: 'advanced_component', weight: 1.5, rarity: 'rare', desc: 'Rare crafting component', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'component', subtype: 'advanced_component', name: 'Advanced Component', rarity: 'rare' }; 
    return tryAddAndReturn(item, '', ''); 
  }},
  
  // Rare consumables
  { type: 'repair_kit', weight: 0.8, rarity: 'rare', desc: 'System maintenance tool', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'consumable', subtype: 'repair_kit', name: 'Repair Kit', rarity: 'rare' }; 
    return tryAddAndReturn(item, '', ''); 
  }},
  { type: 'combat_drug', weight: 0.6, rarity: 'rare', desc: '+20% damage for 3 turns, -20% max HP.', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'consumable', subtype: 'combat_drug', name: 'Combat Drug', rarity: 'rare' }; 
    return tryAddAndReturn(item, '', ''); 
  }},
  { type: 'stun_grenade', weight: 0.7, rarity: 'rare', desc: 'Tactical flashbang', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'consumable', subtype: 'stun_grenade', name: 'Stun Grenade', rarity: 'rare' }; 
    return tryAddAndReturn(item, '', ''); 
  }},
  { type: 'nanite_injector', weight: 0.5, rarity: 'rare', desc: 'Permanent enhancement', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'consumable', subtype: 'nanite_injector', name: 'Nanite Injector', rarity: 'rare' }; 
    return tryAddAndReturn(item, '', ''); 
  }},
  
  // ===== LEGENDARY TIER (2% total weight - reduced from 5%) =====
  // Legendary melee weapons
  { type: 'nano_edge_katana', weight: 0.15, rarity: 'veryrare', desc: 'Molecular-sharpened blade', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'weapon', subtype: 'nano_edge_katana', weaponType: 'melee', name: 'Nano-Edge Katana', rarity: 'veryrare', durability: 120, maxDurability: 120, damage: [12, 18], effects: ['crit:25', 'armorPierce:20'] }; 
    return tryAddAndReturn(item, '', ''); 
  }},
  { type: 'venom_blade', weight: 0.14, rarity: 'veryrare', desc: 'Toxic molecular edge', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'weapon', subtype: 'venom_blade', weaponType: 'melee', name: 'Venom Blade', rarity: 'veryrare', durability: 120, maxDurability: 120, damage: [14, 20], effects: ['burn:40'] }; 
    return tryAddAndReturn(item, '', ''); 
  }},
  { type: 'void_reaper', weight: 0.13, rarity: 'veryrare', desc: 'Reality-cutting scythe', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'weapon', subtype: 'void_reaper', weaponType: 'melee', name: 'Void Reaper', rarity: 'veryrare', durability: 130, maxDurability: 130, damage: [13, 21], effects: ['phase:15', 'armorPierce:25'] }; 
    return tryAddAndReturn(item, '', ''); 
  }},
  { type: 'thunder_hammer', weight: 0.13, rarity: 'veryrare', desc: 'Charged impact weapon', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'weapon', subtype: 'thunder_hammer', weaponType: 'melee', name: 'Thunder Hammer', rarity: 'veryrare', durability: 140, maxDurability: 140, damage: [15, 22], effects: ['stun:30', 'splash:20'] }; 
    return tryAddAndReturn(item, '', ''); 
  }},
  
  // Legendary pistols
  { type: 'void_pistol', weight: 0.15, rarity: 'veryrare', desc: 'Exotic tech, bypasses defenses', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'weapon', subtype: 'void_pistol', weaponType: 'pistol', name: 'Void Pistol', rarity: 'veryrare', durability: 130, maxDurability: 130, damage: [13, 18], effects: ['phase:20'] }; 
    return tryAddAndReturn(item, '', ''); 
  }},
  { type: 'annihilator_pistol', weight: 0.14, rarity: 'veryrare', desc: 'Condensed plasma core', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'weapon', subtype: 'annihilator_pistol', weaponType: 'pistol', name: 'Annihilator Pistol', rarity: 'veryrare', durability: 135, maxDurability: 135, damage: [14, 20], effects: ['burn:35', 'crit:15'] }; 
    return tryAddAndReturn(item, '', ''); 
  }},
  { type: 'hurricane_pistol', weight: 0.13, rarity: 'veryrare', desc: 'Rapid-fire energy bursts', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'weapon', subtype: 'hurricane_pistol', weaponType: 'pistol', name: 'Hurricane Pistol', rarity: 'veryrare', durability: 125, maxDurability: 125, damage: [11, 17], effects: ['burst:3', 'accuracy:12'] }; 
    return tryAddAndReturn(item, '', ''); 
  }},
  { type: 'executioner_revolver', weight: 0.13, rarity: 'veryrare', desc: 'Devastating single shots', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'weapon', subtype: 'executioner_revolver', weaponType: 'pistol', name: 'Executioner Revolver', rarity: 'veryrare', durability: 140, maxDurability: 140, damage: [16, 22], effects: ['crit:30', 'armorPierce:25'] }; 
    return tryAddAndReturn(item, '', ''); 
  }},
  
  // Legendary rifles
  { type: 'gauss_rifle', weight: 0.18, rarity: 'veryrare', desc: 'Electromagnetic accelerator', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'weapon', subtype: 'gauss_rifle', weaponType: 'rifle', name: 'Gauss Rifle', rarity: 'veryrare', durability: 150, maxDurability: 150, damage: [15, 21], effects: ['armorPierce:30'] }; 
    return tryAddAndReturn(item, '', ''); 
  }},
  { type: 'quantum_rifle', weight: 0.15, rarity: 'veryrare', desc: 'Reality-warping projectiles', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'weapon', subtype: 'quantum_rifle', weaponType: 'rifle', name: 'Quantum Rifle', rarity: 'veryrare', durability: 140, maxDurability: 140, damage: [13, 19], effects: ['phase:25', 'accuracy:10'] }; 
    return tryAddAndReturn(item, '', ''); 
  }},
  { type: 'antimatter_rifle', weight: 0.14, rarity: 'veryrare', desc: 'Devastation at molecular level', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'weapon', subtype: 'antimatter_rifle', weaponType: 'rifle', name: 'Antimatter Rifle', rarity: 'veryrare', durability: 160, maxDurability: 160, damage: [16, 23], effects: ['armorPierce:35', 'burst:2'] }; 
    return tryAddAndReturn(item, '', ''); 
  }},
  { type: 'railgun', weight: 0.14, rarity: 'veryrare', desc: 'Hypersonic projectile weapon', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'weapon', subtype: 'railgun', weaponType: 'rifle', name: 'Railgun', rarity: 'veryrare', durability: 155, maxDurability: 155, damage: [18, 25], effects: ['accuracy:15', 'crit:25'] }; 
    return tryAddAndReturn(item, '', ''); 
  }},
  
  // Legendary shotguns
  { type: 'disintegrator_cannon', weight: 0.15, rarity: 'veryrare', desc: 'Molecular breakdown weapon', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'weapon', subtype: 'disintegrator_cannon', weaponType: 'shotgun', name: 'Disintegrator Cannon', rarity: 'veryrare', durability: 130, maxDurability: 130, damage: [13, 23], effects: ['armorPierce:40'] }; 
    return tryAddAndReturn(item, '', ''); 
  }},
  { type: 'void_scattergun', weight: 0.14, rarity: 'veryrare', desc: 'Reality-bending scatter weapon', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'weapon', subtype: 'void_scattergun', weaponType: 'shotgun', name: 'Void Scattergun', rarity: 'veryrare', durability: 125, maxDurability: 125, damage: [12, 21], effects: ['phase:25', 'splash:20'] }; 
    return tryAddAndReturn(item, '', ''); 
  }},
  { type: 'inferno_blaster', weight: 0.13, rarity: 'veryrare', desc: 'Superheated plasma spread', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'weapon', subtype: 'inferno_blaster', weaponType: 'shotgun', name: 'Inferno Blaster', rarity: 'veryrare', durability: 135, maxDurability: 135, damage: [14, 24], effects: ['burn:45', 'splash:25'] }; 
    return tryAddAndReturn(item, '', ''); 
  }},
  { type: 'shredder_cannon', weight: 0.13, rarity: 'veryrare', desc: 'Ultra-penetrating flechettes', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'weapon', subtype: 'shredder_cannon', weaponType: 'shotgun', name: 'Shredder Cannon', rarity: 'veryrare', durability: 140, maxDurability: 140, damage: [15, 25], effects: ['armorPierce:35', 'crit:20'] }; 
    return tryAddAndReturn(item, '', ''); 
  }},
  
  // Legendary heavy weapons
  { type: 'minigun', weight: 0.15, rarity: 'veryrare', desc: 'Continuous fire', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'weapon', subtype: 'minigun', weaponType: 'heavy', name: 'Minigun', rarity: 'veryrare', durability: 120, maxDurability: 120, damage: [10, 14], effects: ['burst:5'] }; 
    return tryAddAndReturn(item, '', ''); 
  }},
  { type: 'venom_cannon', weight: 0.13, rarity: 'veryrare', desc: 'Toxic devastation', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'weapon', subtype: 'venom_cannon', weaponType: 'heavy', name: 'Venom Cannon', rarity: 'veryrare', durability: 150, maxDurability: 150, damage: [16, 23], effects: ['poison:40', 'splash:25'] }; 
    return tryAddAndReturn(item, '', ''); 
  }},
  { type: 'flamethrower', weight: 0.12, rarity: 'veryrare', desc: 'Incinerates everything', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'weapon', subtype: 'flamethrower', weaponType: 'heavy', name: 'Flamethrower', rarity: 'veryrare', durability: 140, maxDurability: 140, damage: [14, 22], effects: ['burn:50', 'splash:30'] }; 
    return tryAddAndReturn(item, '', ''); 
  }},
  { type: 'storm_cannon', weight: 0.12, rarity: 'veryrare', desc: 'Electrified area weapon', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'weapon', subtype: 'storm_cannon', weaponType: 'heavy', name: 'Storm Cannon', rarity: 'veryrare', durability: 135, maxDurability: 135, damage: [12, 20], effects: ['stun:35', 'splash:35', 'burst:2'] }; 
    return tryAddAndReturn(item, '', ''); 
  }},
  
  // Legendary armor
  { type: 'nano_weave_armor', weight: 0.15, rarity: 'veryrare', desc: 'Adaptive protection', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'armor', subtype: 'nano_weave_armor', name: 'Nano-Weave Armor', rarity: 'veryrare', durability: 200, maxDurability: 200, defense: 5, effects: ['dodge:15', 'crit:5'] }; 
    return tryAddAndReturn(item, '', ''); 
  }},
  { type: 'titan_armor', weight: 0.13, rarity: 'veryrare', desc: 'Maximum protection', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'armor', subtype: 'titan_armor', name: 'Titan Armor', rarity: 'veryrare', durability: 280, maxDurability: 280, defense: 7, effects: ['hpBonus:15'] }; 
    return tryAddAndReturn(item, '', ''); 
  }},
  { type: 'shield_suit', weight: 0.13, rarity: 'veryrare', desc: 'Energy shielding', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'armor', subtype: 'shield_suit', name: 'Shield Suit', rarity: 'veryrare', durability: 250, maxDurability: 250, defense: 6, effects: ['reflect:20'] }; 
    return tryAddAndReturn(item, '', ''); 
  }},
  { type: 'regenerative_armor', weight: 0.13, rarity: 'veryrare', desc: 'Self-repairing nanites', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'armor', subtype: 'regenerative_armor', name: 'Regenerative Armor', rarity: 'veryrare', durability: 200, maxDurability: 200, defense: 5, effects: ['regen:5'] }; 
    return tryAddAndReturn(item, '', ''); 
  }},
  { type: 'spectre_armor', weight: 0.12, rarity: 'veryrare', desc: 'Alien-tech phasing armor', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'armor', subtype: 'spectre_armor', name: 'Spectre Armor', rarity: 'veryrare', durability: 230, maxDurability: 230, defense: 6, effects: ['phase:40'] }; 
    return tryAddAndReturn(item, '', ''); 
  }},
  
  // Legendary components (MORE COMMON than legendary weapons/armor)
  { type: 'alien_artifact', weight: 0.28, rarity: 'veryrare', desc: 'Recovered alien technology', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'component', subtype: 'alien_artifact', name: 'Alien Artifact', rarity: 'veryrare' }; 
    return tryAddAndReturn(item, '', ''); 
  }},
  { type: 'quantum_core', weight: 0.25, rarity: 'veryrare', desc: 'Unstable reality tech', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'component', subtype: 'quantum_core', name: 'Quantum Core', rarity: 'veryrare' }; 
    return tryAddAndReturn(item, '', ''); 
  }},
  
  // Legendary consumables
  { type: 'revival_kit', weight: 0.18, rarity: 'veryrare', desc: 'Life-saving equipment', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'consumable', subtype: 'revival_kit', name: 'Revival Kit', rarity: 'veryrare' }; 
    return tryAddAndReturn(item, '', ''); 
  }},
  { type: 'system_override', weight: 0.15, rarity: 'veryrare', desc: 'Emergency restoration', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'consumable', subtype: 'system_override', name: 'System Override', rarity: 'veryrare' }; 
    return tryAddAndReturn(item, '', ''); 
  }},
  { type: 'stealth_field', weight: 0.30, rarity: 'veryrare', desc: 'Tactical stealth', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'consumable', subtype: 'stealth_field', name: 'Stealth Field', rarity: 'veryrare' }; 
    return tryAddAndReturn(item, '', ''); 
  }}
];

const ALIEN_TYPES = [
  // Early game threats - Common
  { id: 'lurker', name: 'Lurker', hpRange: [9, 16], attackRange: [3, 7], armor: 1, rarity: 'common', stealth: 0.4,
    flavor: 'A pale, elongated organism that hides in vents.',
    special: 'ambush', // First attack deals +50% damage if at full HP
    specialDesc: 'Ambush: First strike deals bonus damage' },
  
  { id: 'drone', name: 'Drone', hpRange: [7, 12], attackRange: [2, 6], armor: 0, rarity: 'common', stealth: 0.3,
    flavor: 'Small, fast-moving scavenger. Weak but evasive.',
    special: 'dodge', // 25% chance to evade attacks
    specialDesc: 'Evasive: 25% chance to dodge attacks' },
  
  // Mid game threats - Uncommon
  { id: 'stalker', name: 'Stalker', hpRange: [16, 25], attackRange: [6, 10], armor: 2, rarity: 'uncommon', stealth: 0.2,
    flavor: 'Moves in small coordinated packs, aggressive.',
    special: 'pack', // +2 damage for each other living alien
    specialDesc: 'Pack Hunter: Stronger when allies present' },
  
  { id: 'spitter', name: 'Spitter', hpRange: [12, 18], attackRange: [5, 9], armor: 1, rarity: 'uncommon', stealth: 0.15,
    flavor: 'Ranged attacker that sprays corrosive bile from distance.',
    special: 'piercing', // Ignores 50% of armor
    specialDesc: 'Armor Piercing: Bypasses half of armor' },
  
  // Late game threats - Rare
  { id: 'brood', name: 'Brood', hpRange: [32, 45], attackRange: [9, 16], armor: 4, rarity: 'rare', stealth: 0.05,
    flavor: 'A nesting cluster — dangerous and territorial.',
    special: 'regeneration', // Heals 2-4 HP per turn
    specialDesc: 'Regeneration: Recovers HP each turn' },
  
  { id: 'ravager', name: 'Ravager', hpRange: [24, 35], attackRange: [11, 18], armor: 6, rarity: 'rare', stealth: 0.1,
    flavor: 'Heavily armored brute with crushing limbs.',
    special: 'armored', // Takes 30% less damage from all attacks
    specialDesc: 'Armored Carapace: Resistant to damage' },
  
  // Elite threats - Legendary
  { id: 'spectre', name: 'Spectre', hpRange: [14, 21], attackRange: [7, 13], armor: 2, rarity: 'veryrare', stealth: 0.7,
    flavor: 'An elusive lifeform that strikes from darkness.',
    special: 'phase', // 40% chance to avoid all damage
    specialDesc: 'Evasive Phase: Frequently phases out of reality' },
  
  { id: 'queen', name: 'Hive Queen', hpRange: [40, 58], attackRange: [10, 16], armor: 7, rarity: 'veryrare', stealth: 0,
    flavor: 'Massive apex predator. Commands the hive.',
    special: 'multistrike', // Attacks twice per turn
    specialDesc: 'Multi-Strike: Attacks twice each turn' },
  
  // 1.0 - Medical Bay enemy
  { id: 'infested', name: 'Infested', hpRange: [18, 28], attackRange: [7, 12], armor: 3, rarity: 'rare', stealth: 0.2,
    flavor: 'A former human, chest cavity torn open and writhing with larvae. The swarm pilots the corpse like a meat puppet.',
    special: 'swarm', // On death, 40% chance to spawn 1-2 Drones as larvae burst out
    specialDesc: 'Larvae Swarm: May spawn Drones when killed' }
];

// 0.8.10 - Survivor Classes (8 classes) with bonus ranges
const SURVIVOR_CLASSES = [
  { 
    id: 'soldier', 
    name: 'Soldier', 
    desc: 'Combat specialist: +10-20% damage, +10-20% accuracy, +10-20% crit chance.',
    bonuses: { 
      combat: [1.10, 1.20],  // +10-20% damage
      hp: [4, 8],            // +4-8 HP
      accuracy: [0.10, 0.20], // +10-20% accuracy
      crit: [0.10, 0.20]      // +10-20% crit chance
    },
    color: 'var(--class-common)' // Blue
  },
  { 
    id: 'medic', 
    name: 'Medic', 
    desc: 'Healing specialist: +25-35% medkit healing, can survive fatal blows',
    bonuses: { 
      healing: [1.25, 1.35],  // +25-35% healing
      survival: [1.05, 1.15]  // +5-15% survival
    },
    color: 'var(--class-common)'
  },
  { 
    id: 'engineer', 
    name: 'Engineer', 
    desc: 'Systems expert: +15-30% production, -15-25% repair costs, overclock systems',
    bonuses: { 
      production: [1.15, 1.30],  // +15-30% production
      repair: [0.75, 0.85]       // 15-25% repair cost reduction (multiply cost by this)
    },
    color: 'var(--class-common)'
  },
  { 
    id: 'scout', 
    name: 'Scout', 
    desc: 'Exploration specialist: -10-20% energy cost, 15-25% dodge, +20-30% retreat',
    bonuses: { 
      exploration: [0.80, 0.90],  // 10-20% energy cost reduction
      dodge: [1.15, 1.25],        // +15-25% dodge
      retreat: [1.20, 1.30]       // +20-30% retreat chance
    },
    color: 'var(--class-common)'
  },
  { 
    id: 'technician', 
    name: 'Technician', 
    desc: 'Crafting specialist: -10-20% costs, +15-25% durability, 25% refund',
    bonuses: { 
      crafting: [0.80, 0.90],     // 10-20% crafting cost reduction
      durability: [1.15, 1.25],   // +15-25% durability
    },
    color: 'var(--class-common)'
  },
  { 
    id: 'scientist', 
    name: 'Scientist', 
    desc: 'Research specialist: +15-30% XP, powerful tech abilities',
    bonuses: { 
      xp: [1.15, 1.30],         // +15-30% XP gain
      analysis: [1.15, 1.25]    // +15-25% analysis bonus
    },
    color: 'var(--class-common)'
  },
  { 
    id: 'guardian', 
    name: 'Guardian', 
    desc: 'Defense specialist: +3-6 defense, +5-10% morale aura, protect allies',
    bonuses: { 
      defense: [3, 6],          // +3-6 defense
      morale: [1.05, 1.10]      // +5-10% morale
    },
    color: 'var(--class-common)'
  },
  { 
    id: 'scavenger', 
    name: 'Scavenger', 
    desc: 'Resource specialist: +20-30% scrap, 15-25% extra loot, double loot rolls',
    bonuses: { 
      loot: [1.15, 1.25],       // +15-25% loot chance
      scrap: [1.20, 1.30]       // +20-30% scrap gain
    },
    color: 'var(--class-common)'
  }
];

// 0.8.0 - Special Abilities (3-5 per class, rarity-based)
const SPECIAL_ABILITIES = {
  soldier: [
    { id: 'marksman', name: 'Marksman', rarity: 'uncommon', chance: 0.15, effect: '+10% hit chance', color: '#a78bfa' },
    { id: 'tactical', name: 'Tactical Mind', rarity: 'uncommon', chance: 0.12, effect: '+15% crit chance', color: '#a78bfa' },
    { id: 'veteran', name: 'Veteran', rarity: 'rare', chance: 0.08, effect: '+20% damage, +10 max HP', color: '#fb923c' },
    { id: 'berserker', name: 'Berserker', rarity: 'rare', chance: 0.06, effect: '+30% damage below 30% HP', color: '#fb923c' },
    { id: 'commander', name: 'Commander', rarity: 'veryrare', chance: 0.03, effect: 'Nearby allies +10% combat', color: '#ef4444' }
  ],
  medic: [
    { id: 'triage', name: 'Triage', rarity: 'uncommon', chance: 0.15, effect: 'Medkits heal +25%', color: '#a78bfa' },
    { id: 'stabilize', name: 'Field Medic', rarity: 'uncommon', chance: 0.12, effect: 'Can revive downed allies', color: '#a78bfa' },
    { id: 'adrenaline', name: 'Adrenaline Shot', rarity: 'rare', chance: 0.08, effect: 'Heal grants temp +2 damage', color: '#fb923c' },
    { id: 'lifesaver', name: 'Lifesaver', rarity: 'rare', chance: 0.06, effect: 'Survive fatal blow once per combat', color: '#fb923c' },
    { id: 'miracle', name: 'Miracle Worker', rarity: 'veryrare', chance: 0.03, effect: 'Passive heal 1 HP/turn all allies', color: '#ef4444' }
  ],
  engineer: [
    { id: 'efficient', name: 'Efficient', rarity: 'uncommon', chance: 0.15, effect: '+15% system production', color: '#a78bfa' },
    { id: 'quickfix', name: 'Quick Fix', rarity: 'uncommon', chance: 0.12, effect: '-20% repair costs', color: '#a78bfa' },
    { id: 'overclock', name: 'Overclock', rarity: 'rare', chance: 0.08, effect: 'Systems produce +30% but +50% failure rate', color: '#fb923c' },
    { id: 'failsafe', name: 'Failsafe', rarity: 'rare', chance: 0.06, effect: 'Reduce system failure rate by 30%', color: '#fb923c' },
    { id: 'mastermind', name: 'Mastermind', rarity: 'veryrare', chance: 0.03, effect: 'All systems +25% efficiency', color: '#ef4444' }
  ],
  scout: [
    { id: 'pathfinder', name: 'Pathfinder', rarity: 'uncommon', chance: 0.15, effect: '-15% exploration energy cost', color: '#a78bfa' },
    { id: 'keen', name: 'Keen Eye', rarity: 'uncommon', chance: 0.12, effect: '+20% loot quality', color: '#a78bfa' },
    { id: 'evasive', name: 'Evasive', rarity: 'rare', chance: 0.08, effect: '20% dodge attacks', color: '#fb923c' },
    { id: 'tracker', name: 'Tracker', rarity: 'rare', chance: 0.06, effect: 'Reveal adjacent alien tiles', color: '#fb923c' },
    { id: 'ghost', name: 'Ghost', rarity: 'veryrare', chance: 0.03, effect: '35% dodge, +25% retreat chance', color: '#ef4444' }
  ],
  technician: [
    { id: 'resourceful', name: 'Resourceful', rarity: 'uncommon', chance: 0.15, effect: '-10% crafting costs', color: '#a78bfa' },
    { id: 'durable', name: 'Durable Craft', rarity: 'uncommon', chance: 0.12, effect: 'Crafted items +20% durability', color: '#a78bfa' },
    { id: 'recycler', name: 'Recycler', rarity: 'rare', chance: 0.08, effect: '25% chance to refund materials', color: '#fb923c' },
    { id: 'inventor', name: 'Inventor', rarity: 'rare', chance: 0.06, effect: 'Chance to craft rare components', color: '#fb923c' },
    { id: 'prodigy', name: 'Prodigy', rarity: 'veryrare', chance: 0.03, effect: '-25% costs, +30% durability', color: '#ef4444' }
  ],
  scientist: [
    { id: 'analytical', name: 'Analytical', rarity: 'uncommon', chance: 0.15, effect: '+1 tech per 60s', color: '#a78bfa' },
    { id: 'studious', name: 'Studious', rarity: 'uncommon', chance: 0.12, effect: '+15% XP gain', color: '#a78bfa' },
    { id: 'xenobiologist', name: 'Xenobiologist', rarity: 'rare', chance: 0.08, effect: 'Alien kills grant tech', color: '#fb923c' },
    { id: 'breakthrough', name: 'Breakthrough', rarity: 'rare', chance: 0.06, effect: 'Random tech bursts', color: '#fb923c' },
    { id: 'genius', name: 'Genius', rarity: 'veryrare', chance: 0.03, effect: '+2 tech/60s, +25% XP', color: '#ef4444' }
  ],
  guardian: [
    { id: 'stalwart', name: 'Stalwart', rarity: 'uncommon', chance: 0.15, effect: '+3 defense when guarding', color: '#a78bfa' },
    { id: 'rallying', name: 'Rallying Cry', rarity: 'uncommon', chance: 0.12, effect: '+5% morale to all', color: '#a78bfa' },
    { id: 'shield', name: 'Living Shield', rarity: 'rare', chance: 0.08, effect: 'Absorb damage for ally once/turn', color: '#fb923c' },
    { id: 'last', name: 'Last Stand', rarity: 'rare', chance: 0.06, effect: '+50% damage when alone', color: '#fb923c' },
    { id: 'fortress', name: 'Fortress', rarity: 'veryrare', chance: 0.03, effect: '+5 def, nearby allies +3 def', color: '#ef4444' }
  ],
  scavenger: [
    { id: 'lucky', name: 'Lucky Find', rarity: 'uncommon', chance: 0.15, effect: '15% extra loot rolls', color: '#a78bfa' },
    { id: 'salvage', name: 'Salvage Expert', rarity: 'uncommon', chance: 0.12, effect: '+25% scrap from salvage', color: '#a78bfa' },
    { id: 'hoarder', name: 'Hoarder', rarity: 'rare', chance: 0.08, effect: 'Carry capacity +2', color: '#fb923c' },
    { id: 'treasure', name: 'Treasure Hunter', rarity: 'rare', chance: 0.06, effect: 'Find rare items more often (+25% rarity)', color: '#fb923c' },
    { id: 'goldnose', name: 'Golden Nose', rarity: 'veryrare', chance: 0.03, effect: 'Double loot rolls, +50% quality', color: '#ef4444' }
  ]
};

// 0.8.0 - Alien Rare Modifiers (5 per type, uncommon to legendary)
const ALIEN_MODIFIERS = {
  drone: [
    { id: 'swift', name: 'Swift', rarity: 'uncommon', chance: 0.06, effect: '+30% dodge chance', color: '#a78bfa' },
    { id: 'aggressive', name: 'Aggressive', rarity: 'uncommon', chance: 0.05, effect: '+2 attack', color: '#a78bfa' },
    { id: 'resilient', name: 'Resilient', rarity: 'rare', chance: 0.03, effect: '+50% HP', color: '#fb923c' },
    { id: 'venomous', name: 'Venomous', rarity: 'rare', chance: 0.025, effect: 'Attacks poison (2 dmg/turn)', color: '#fb923c' },
    { id: 'alpha', name: 'Alpha', rarity: 'veryrare', chance: 0.01, effect: '+4 attack, +25% dodge', color: '#ef4444' }
  ],
  lurker: [
    { id: 'silent', name: 'Silent Killer', rarity: 'uncommon', chance: 0.06, effect: '+20% ambush damage', color: '#a78bfa' },
    { id: 'cunning', name: 'Cunning', rarity: 'uncommon', chance: 0.05, effect: 'Second ambush at 50% HP', color: '#a78bfa' },
    { id: 'brutal', name: 'Brutal', rarity: 'rare', chance: 0.03, effect: '+50% crit damage', color: '#fb923c' },
    { id: 'predator', name: 'Apex Predator', rarity: 'rare', chance: 0.025, effect: '+30% damage vs wounded', color: '#fb923c' },
    { id: 'nightmare', name: 'Nightmare', rarity: 'veryrare', chance: 0.01, effect: 'Ambush ignores armor', color: '#ef4444' }
  ],
  stalker: [
    { id: 'coordinated', name: 'Coordinated', rarity: 'uncommon', chance: 0.06, effect: '+50% pack bonus', color: '#a78bfa' },
    { id: 'feral', name: 'Feral', rarity: 'uncommon', chance: 0.05, effect: '+3 attack when pack active', color: '#a78bfa' },
    { id: 'relentless', name: 'Relentless', rarity: 'rare', chance: 0.03, effect: 'Attack twice if ally dies', color: '#fb923c' },
    { id: 'pack_leader', name: 'Pack Leader', rarity: 'rare', chance: 0.025, effect: 'Allies gain +2 damage', color: '#fb923c' },
    { id: 'dire', name: 'Dire', rarity: 'veryrare', chance: 0.01, effect: '+100% pack bonus, +6 HP', color: '#ef4444' }
  ],
  spitter: [
    { id: 'corrosive', name: 'Hyper-Corrosive', rarity: 'uncommon', chance: 0.06, effect: 'Ignores 90% armor (50% base + 40%)', color: '#a78bfa' },
    { id: 'toxic', name: 'Toxic', rarity: 'uncommon', chance: 0.05, effect: 'Reduce target defense by 2', color: '#a78bfa' },
    { id: 'rapid', name: 'Rapid Fire', rarity: 'rare', chance: 0.03, effect: '30% chance double attack', color: '#fb923c' },
    { id: 'caustic', name: 'Caustic', rarity: 'rare', chance: 0.025, effect: 'Splash damage to nearby', color: '#fb923c' },
    { id: 'plague', name: 'Plague Bringer', rarity: 'veryrare', chance: 0.01, effect: 'All attacks AOE + poison', color: '#ef4444' }
  ],
  brood: [
    { id: 'thick', name: 'Thick Hide', rarity: 'uncommon', chance: 0.06, effect: '+10 HP', color: '#a78bfa' },
    { id: 'fastHeal', name: 'Fast Healing', rarity: 'uncommon', chance: 0.05, effect: '+2 regen per turn', color: '#a78bfa' },
    { id: 'enraged', name: 'Enraged', rarity: 'rare', chance: 0.03, effect: '+4 attack below 50% HP', color: '#fb923c' },
    { id: 'spawner', name: 'Spawner', rarity: 'rare', chance: 0.025, effect: 'Summon drone on death', color: '#fb923c' },
    { id: 'titan', name: 'Titan', rarity: 'veryrare', chance: 0.01, effect: '+15 HP, +4 regen, +3 attack', color: '#ef4444' }
  ],
  ravager: [
    { id: 'hardened', name: 'Hardened', rarity: 'uncommon', chance: 0.06, effect: '20% resist', color: '#a78bfa' },
    { id: 'crusher', name: 'Crusher', rarity: 'uncommon', chance: 0.05, effect: '+4 attack', color: '#a78bfa' },
    { id: 'unstoppable', name: 'Unstoppable', rarity: 'rare', chance: 0.03, effect: 'Immune to crits', color: '#fb923c' },
    { id: 'juggernaut', name: 'Juggernaut', rarity: 'rare', chance: 0.025, effect: '+8 HP, 20% chance to stun on hit', color: '#fb923c' },
    { id: 'colossus', name: 'Colossus', rarity: 'veryrare', chance: 0.01, effect: '40% resist, +6 attack, +12 HP', color: '#ef4444' }
  ],
  spectre: [
    { id: 'ethereal', name: 'Ethereal', rarity: 'uncommon', chance: 0.06, effect: '+10% phase chance', color: '#a78bfa' },
    { id: 'shadow', name: 'Shadow Form', rarity: 'uncommon', chance: 0.05, effect: '+20% phase chance', color: '#a78bfa' },
    { id: 'blink', name: 'Blink Strike', rarity: 'rare', chance: 0.03, effect: 'Attack after phasing', color: '#fb923c' },
    { id: 'wraith', name: 'Wraith', rarity: 'rare', chance: 0.025, effect: '+50% damage when phased', color: '#fb923c' },
    { id: 'void', name: 'Void Touched', rarity: 'veryrare', chance: 0.01, effect: '60% phase, phase drains 2 HP', color: '#ef4444' }
  ],
  queen: [
    { id: 'dominant', name: 'Dominant', rarity: 'uncommon', chance: 0.06, effect: '+3 attack', color: '#a78bfa' },
    { id: 'matriarch', name: 'Matriarch', rarity: 'uncommon', chance: 0.05, effect: 'All aliens +1 attack', color: '#a78bfa' },
    { id: 'ancient', name: 'Ancient', rarity: 'rare', chance: 0.03, effect: '+15 HP, +2 attack', color: '#fb923c' },
    { id: 'hivemind', name: 'Hivemind', rarity: 'rare', chance: 0.025, effect: 'Control fallen drones', color: '#fb923c' },
    { id: 'empress', name: 'Empress', rarity: 'veryrare', chance: 0.01, effect: 'Triple attack, +20 HP, all aliens +2 dmg', color: '#ef4444' }
  ],
  infested: [
    { id: 'twitching', name: 'Twitching', rarity: 'uncommon', chance: 0.06, effect: '+15% dodge', color: '#a78bfa' },
    { id: 'bloated', name: 'Bloated', rarity: 'uncommon', chance: 0.05, effect: '+8 HP (swollen with larvae)', color: '#a78bfa' },
    { id: 'swarming', name: 'Swarming', rarity: 'rare', chance: 0.03, effect: '+20% spawn chance on death', color: '#fb923c' },
    { id: 'feral', name: 'Feral Host', rarity: 'rare', chance: 0.025, effect: '+4 attack, hostile swarm', color: '#fb923c' },
    { id: 'hivenode', name: 'Hive Node', rarity: 'veryrare', chance: 0.01, effect: 'Guaranteed spawn 2-3 Drones on death', color: '#ef4444' }
  ]
};

const MISSION_ENEMIES = {
  'brood_cyber': {
    id: 'brood_cyber',
    name: 'Cybernetic Brood',
    rank: 'boss', // Classify this enemy as a boss
    hp: 45,
    maxHp: 45,
    attack: 13,
    armor: 6,
    flavor: "A grotesque fusion of alien biology and station cybernetics, its movements are jerky and unnatural.",
    special: 'regen',
    specialDesc: 'Regenerates 2-4 HP per turn.'
  },
  'dr_kaine': {
    id: 'dr_kaine',
    name: 'Dr. Kaine (Infested)',
    rank: 'boss',
    hp: 38,
    maxHp: 38,
    attack: 10,
    armor: 4,
    flavor: "Half his body is charred black from the incinerator. Through the gaping holes in his chest, you can see dozens of writhing larvae squirming over each other like maggots in a wound.",
    special: 'swarm',
    specialDesc: 'On death, spawns 2-3 Drones as the larvae burst free.'
  }
,
  
  // 1.0 - Phase 2.4: Placeholder Final Boss (to be replaced with custom boss later)
  'alpha_queen': {
    id: 'alpha_queen',
    name: 'Alpha Queen',
    rank: 'final_boss',
    hp: 100,
    maxHp: 100,
    attack: 22,
    armor: 8,
    flavor: "The ancient matriarch of the hive. Her presence alone warps the air with malevolent intent.",
    special: 'multistrike',
    specialDesc: 'Attacks three times per turn. Extremely dangerous.'
  }
};

// 1.0 - SECTOR-SPECIFIC LOOT TABLES
// Each room type has themed loot with higher quality items
const SECTOR_LOOT = {
  medicalBay: [
    { type: 'medkit', weight: 25, rarity: 'common' },
    { type: 'stimpack', weight: 15, rarity: 'uncommon' },
    { type: 'nanoheal', weight: 8, rarity: 'rare' },
    { type: 'tech', weight: 12, rarity: 'uncommon' },
    { type: 'electronics', weight: 10, rarity: 'common' }
  ],
  
  engineeringDeck: [
    { type: 'tech', weight: 30, rarity: 'uncommon' },
    { type: 'weaponPart', weight: 15, rarity: 'common' },
    { type: 'electronics', weight: 20, rarity: 'common' },
    { type: 'energyCore', weight: 12, rarity: 'uncommon' },
    { type: 'repair_kit', weight: 18, rarity: 'uncommon' },
    { type: 'ammo', weight: 10, rarity: 'common' }
  ],
  
  securityWing: [
    { type: 'combat_knife', weight: 12, rarity: 'uncommon' },
    { type: 'assault_rifle', weight: 8, rarity: 'uncommon' },
    { type: 'tactical_vest', weight: 15, rarity: 'uncommon' },
    { type: 'heavy_armor', weight: 10, rarity: 'rare' },
    { type: 'ammo', weight: 25, rarity: 'common' },
    { type: 'armorPlating', weight: 15, rarity: 'common' },
    { type: 'weaponPart', weight: 12, rarity: 'common' }
  ],
  
  crewQuarters: [
    { type: 'foodpack', weight: 30, rarity: 'common' },
    { type: 'medkit', weight: 15, rarity: 'common' },
    { type: 'junk', weight: 20, rarity: 'common' },
    { type: 'scrap_vest', weight: 12, rarity: 'common' },
    { type: 'old_revolver', weight: 8, rarity: 'common' },
    { type: 'fabricPatch', weight: 10, rarity: 'common' }
  ],
  
  researchLabs: [
    { type: 'tech', weight: 35, rarity: 'uncommon' },
    { type: 'laser_pistol', weight: 10, rarity: 'uncommon' },
    { type: 'plasma_rifle', weight: 6, rarity: 'rare' },
    { type: 'shield_generator', weight: 8, rarity: 'rare' },
    { type: 'electronics', weight: 20, rarity: 'common' },
    { type: 'energyCore', weight: 15, rarity: 'uncommon' },
    { type: 'nanoheal', weight: 5, rarity: 'rare' }
  ],
  
  shoppingMall: [
    { type: 'foodpack', weight: 25, rarity: 'common' },
    { type: 'medkit', weight: 20, rarity: 'common' },
    { type: 'ammo', weight: 18, rarity: 'common' },
    { type: 'padded_suit', weight: 12, rarity: 'common' },
    { type: 'scrap_pistol', weight: 10, rarity: 'common' },
    { type: 'fabricPatch', weight: 15, rarity: 'common' }
  ],
  
  maintenanceHub: [
    { type: 'repair_kit', weight: 30, rarity: 'uncommon' },
    { type: 'weaponPart', weight: 20, rarity: 'common' },
    { type: 'armorPlating', weight: 15, rarity: 'common' },
    { type: 'electronics', weight: 18, rarity: 'common' },
    { type: 'crowbar', weight: 12, rarity: 'common' },
    { type: 'energyCore', weight: 8, rarity: 'uncommon' }
  ],
  
  communications: [
    { type: 'electronics', weight: 35, rarity: 'common' },
    { type: 'tech', weight: 25, rarity: 'uncommon' },
    { type: 'energyCore', weight: 15, rarity: 'uncommon' },
    { type: 'laser_pistol', weight: 8, rarity: 'uncommon' },
    { type: 'junk', weight: 12, rarity: 'common' }
  ],
  
  cargoBay: [
    { type: 'foodpack', weight: 20, rarity: 'common' },
    { type: 'ammo', weight: 18, rarity: 'common' },
    { type: 'weaponPart', weight: 15, rarity: 'common' },
    { type: 'armorPlating', weight: 15, rarity: 'common' },
    { type: 'assault_rifle', weight: 10, rarity: 'uncommon' },
    { type: 'reinforced_plating', weight: 8, rarity: 'uncommon' },
    { type: 'heavy_armor', weight: 6, rarity: 'rare' },
    { type: 'junk', weight: 15, rarity: 'common' }
  ],
  
  corporateOffices: [
    { type: 'tech', weight: 25, rarity: 'uncommon' },
    { type: 'energyCore', weight: 18, rarity: 'uncommon' },
    { type: 'electronics', weight: 20, rarity: 'common' },
    { type: 'heavy_pistol', weight: 12, rarity: 'uncommon' },
    { type: 'tactical_vest', weight: 10, rarity: 'uncommon' },
    { type: 'junk', weight: 15, rarity: 'common' }
  ],
  
  reactorChamber: [
    { type: 'energyCore', weight: 35, rarity: 'uncommon' },
    { type: 'tech', weight: 25, rarity: 'uncommon' },
    { type: 'plasma_rifle', weight: 8, rarity: 'rare' },
    { type: 'power_core', weight: 10, rarity: 'rare' },
    { type: 'electronics', weight: 20, rarity: 'common' }
  ],
  
  observationDeck: [
    { type: 'hangarBayKeycard', weight: 25, rarity: 'uncommon' }, // High chance - unlocks final area
    { type: 'scoped_rifle', weight: 15, rarity: 'uncommon' },
    { type: 'railgun', weight: 8, rarity: 'rare' },
    { type: 'tech', weight: 20, rarity: 'uncommon' },
    { type: 'electronics', weight: 18, rarity: 'common' },
    { type: 'heavy_pistol', weight: 12, rarity: 'uncommon' },
    { type: 'junk', weight: 15, rarity: 'common' }
  ],
  
  hangarBay: [
    { type: 'weaponPart', weight: 20, rarity: 'common' },
    { type: 'armorPlating', weight: 20, rarity: 'common' },
    { type: 'energyCore', weight: 18, rarity: 'uncommon' },
    { type: 'repair_kit', weight: 15, rarity: 'uncommon' },
    { type: 'assault_rifle', weight: 10, rarity: 'uncommon' },
    { type: 'heavy_armor', weight: 8, rarity: 'rare' },
    { type: 'tech', weight: 15, rarity: 'uncommon' }
  ]
};

const RECIPES = {
  // ===== CONSUMABLES =====
  medkit: { 
    name: 'Medkit',
    scrap: 20, // Increased from 18
    rarity: 'uncommon',
    result: () => { 
      const item = { id: state.nextItemId++, type: 'medkit', name: 'Medkit', rarity: 'uncommon' }; 
      tryAddAndLog(item); 
    } 
  },
  ammo: { 
    name: 'Ammo',
    scrap: 12, // Increased from 10
    rarity: 'common',
    result: () => { 
      state.resources.ammo += rand(4, 10); 
      appendLog('Ammo manufactured.'); 
    } 
  },
  stun_grenade: {
    name: 'Stun Grenade',
    scrap: 35,
    tech: 4,
    electronics: 1,
    rarity: 'rare',
    result: () => {
      const item = { id: state.nextItemId++, type: 'consumable', subtype: 'stun_grenade', name: 'Stun Grenade', rarity: 'rare' };
      tryAddAndLog(item);
    }
  },
  advanced_medkit: {
    name: 'Advanced Medkit',
    scrap: 30,
    tech: 2,
    rarity: 'uncommon',
    result: () => {
      const item = { id: state.nextItemId++, type: 'consumable', subtype: 'advanced_medkit', name: 'Advanced Medkit', rarity: 'uncommon' };
      tryAddAndLog(item);
    }
  },
  sonic_repulsor: {
    name: 'Sonic Repulsor',
    scrap: 40,
    tech: 2,
    electronics: 1,
    rarity: 'uncommon',
    result: () => {
      const item = { id: state.nextItemId++, type: 'consumable', subtype: 'sonic_repulsor', name: 'Sonic Repulsor', rarity: 'uncommon' };
      tryAddAndLog(item);
    }
  },
  
  // ===== COMMON MELEE WEAPONS =====
  makeshift_pipe: {
    name: 'Makeshift Pipe',
    scrap: 8,
    rarity: 'common',
    result: () => {
      const item = { id: state.nextItemId++, type: 'weapon', subtype: 'makeshift_pipe', weaponType: 'melee', name: 'Makeshift Pipe', rarity: 'common', durability: 15, maxDurability: 15, damage: [2, 4] };
      tryAddAndLog(item);
    }
  },
  sharpened_tool: {
    name: 'Sharpened Tool',
    scrap: 10,
    rarity: 'common',
    result: () => {
      const item = { id: state.nextItemId++, type: 'weapon', subtype: 'sharpened_tool', weaponType: 'melee', name: 'Sharpened Tool', rarity: 'common', durability: 20, maxDurability: 20, damage: [3, 5] };
      tryAddAndLog(item);
    }
  },
  crowbar: {
    name: 'Crowbar',
    scrap: 12,
    rarity: 'common',
    result: () => {
      const item = { id: state.nextItemId++, type: 'weapon', subtype: 'crowbar', weaponType: 'melee', name: 'Crowbar', rarity: 'common', durability: 25, maxDurability: 25, damage: [4, 6] };
      tryAddAndLog(item);
    }
  },
  steel_pipe: {
    name: 'Steel Pipe',
    scrap: 14,
    rarity: 'common',
    result: () => {
      const item = { id: state.nextItemId++, type: 'weapon', subtype: 'steel_pipe', weaponType: 'melee', name: 'Steel Pipe', rarity: 'common', durability: 25, maxDurability: 25, damage: [3, 6] };
      tryAddAndLog(item);
    }
  },
  
  // ===== COMMON PISTOLS =====
  scrap_pistol: {
    name: 'Scrap Pistol',
    scrap: 15,
    weaponPart: 1,
    rarity: 'common',
    result: () => {
      const item = { id: state.nextItemId++, type: 'weapon', subtype: 'scrap_pistol', weaponType: 'pistol', name: 'Scrap Pistol', rarity: 'common', durability: 30, maxDurability: 30, damage: [4, 6] };
      tryAddAndLog(item);
    }
  },
  old_revolver: {
    name: 'Old Revolver',
    scrap: 18,
    weaponPart: 1,
    rarity: 'common',
    result: () => {
      const item = { id: state.nextItemId++, type: 'weapon', subtype: 'old_revolver', weaponType: 'pistol', name: 'Old Revolver', rarity: 'common', durability: 35, maxDurability: 35, damage: [5, 7] };
      tryAddAndLog(item);
    }
  },
  jury_rigged_pistol: {
    name: 'Jury-Rigged Pistol',
    scrap: 16,
    weaponPart: 1,
    rarity: 'common',
    result: () => {
      const item = { id: state.nextItemId++, type: 'weapon', subtype: 'jury_rigged_pistol', weaponType: 'pistol', name: 'Jury-Rigged Pistol', rarity: 'common', durability: 25, maxDurability: 25, damage: [3, 6] };
      tryAddAndLog(item);
    }
  },
  homemade_handgun: {
    name: 'Homemade Handgun',
    scrap: 17,
    weaponPart: 1,
    rarity: 'common',
    result: () => {
      const item = { id: state.nextItemId++, type: 'weapon', subtype: 'homemade_handgun', weaponType: 'pistol', name: 'Homemade Handgun', rarity: 'common', durability: 30, maxDurability: 30, damage: [4, 6] };
      tryAddAndLog(item);
    }
  },
  
  // ===== COMMON ARMOR =====
  scrap_vest: {
    name: 'Scrap Vest',
    scrap: 12,
    rarity: 'common',
    result: () => {
      const item = { id: state.nextItemId++, type: 'armor', subtype: 'scrap_vest', name: 'Scrap Vest', rarity: 'common', durability: 30, maxDurability: 30, defense: 1 };
      tryAddAndLog(item);
    }
  },
  padded_suit: {
    name: 'Padded Suit',
    scrap: 15,
    rarity: 'common',
    result: () => {
      const item = { id: state.nextItemId++, type: 'armor', subtype: 'padded_suit', name: 'Padded Suit', rarity: 'common', durability: 40, maxDurability: 40, defense: 2 };
      tryAddAndLog(item);
    }
  },
  work_gear: {
    name: 'Work Gear',
    scrap: 13,
    rarity: 'common',
    result: () => {
      const item = { id: state.nextItemId++, type: 'armor', subtype: 'work_gear', name: 'Work Gear', rarity: 'common', durability: 35, maxDurability: 35, defense: 1 };
      tryAddAndLog(item);
    }
  },
  leather_jacket: {
    name: 'Leather Jacket',
    scrap: 16,
    rarity: 'common',
    result: () => {
      const item = { id: state.nextItemId++, type: 'armor', subtype: 'leather_jacket', name: 'Leather Jacket', rarity: 'common', durability: 45, maxDurability: 45, defense: 2 };
      tryAddAndLog(item);
    }
  },
  
  // ===== UNCOMMON MELEE WEAPONS =====
  combat_knife: {
    name: 'Combat Knife',
    scrap: 25,
    tech: 2,
    rarity: 'uncommon',
    result: () => {
      const item = { id: state.nextItemId++, type: 'weapon', subtype: 'combat_knife', weaponType: 'melee', name: 'Combat Knife', rarity: 'uncommon', durability: 40, maxDurability: 40, damage: [5, 8] };
      tryAddAndLog(item);
    }
  },
  stun_baton: {
    name: 'Stun Baton',
    scrap: 30,
    tech: 3,
    electronics: 1,
    rarity: 'uncommon',
    result: () => {
      const item = { id: state.nextItemId++, type: 'weapon', subtype: 'stun_baton', weaponType: 'melee', name: 'Stun Baton', rarity: 'uncommon', durability: 50, maxDurability: 50, damage: [6, 9], effects: ['stun:10'] };
      tryAddAndLog(item);
    }
  },
  reinforced_bat: {
    name: 'Reinforced Bat',
    scrap: 28,
    tech: 2,
    rarity: 'uncommon',
    result: () => {
      const item = { id: state.nextItemId++, type: 'weapon', subtype: 'reinforced_bat', weaponType: 'melee', name: 'Reinforced Bat', rarity: 'uncommon', durability: 45, maxDurability: 45, damage: [7, 10] };
      tryAddAndLog(item);
    }
  },
  electro_spear: {
    name: 'Electro-Spear',
    scrap: 32,
    tech: 3,
    electronics: 1,
    rarity: 'uncommon',
    result: () => {
      const item = { id: state.nextItemId++, type: 'weapon', subtype: 'electro_spear', weaponType: 'melee', name: 'Electro-Spear', rarity: 'uncommon', durability: 55, maxDurability: 55, damage: [5, 10], effects: ['stun:8'] };
      tryAddAndLog(item);
    }
  },
  
  // ===== UNCOMMON PISTOLS =====
  laser_pistol: {
    name: 'Laser Pistol',
    scrap: 35,
    tech: 4,
    weaponPart: 1,
    rarity: 'uncommon',
    result: () => {
      const item = { id: state.nextItemId++, type: 'weapon', subtype: 'laser_pistol', weaponType: 'pistol', name: 'Laser Pistol', rarity: 'uncommon', durability: 60, maxDurability: 60, damage: [7, 10], effects: ['burn:10'] };
      tryAddAndLog(item);
    }
  },
  heavy_pistol: {
    name: 'Heavy Pistol',
    scrap: 32,
    tech: 3,
    weaponPart: 1,
    rarity: 'uncommon',
    result: () => {
      const item = { id: state.nextItemId++, type: 'weapon', subtype: 'heavy_pistol', weaponType: 'pistol', name: 'Heavy Pistol', rarity: 'uncommon', durability: 55, maxDurability: 55, damage: [8, 11] };
      tryAddAndLog(item);
    }
  },
  burst_pistol: {
    name: 'Burst Pistol',
    scrap: 33,
    tech: 3,
    weaponPart: 1,
    rarity: 'uncommon',
    result: () => {
      const item = { id: state.nextItemId++, type: 'weapon', subtype: 'burst_pistol', weaponType: 'pistol', name: 'Burst Pistol', rarity: 'uncommon', durability: 60, maxDurability: 60, damage: [6, 8], effects: ['burst:2'] };
      tryAddAndLog(item);
    }
  },
  needle_pistol: {
    name: 'Needle Pistol',
    scrap: 34,
    tech: 3,
    weaponPart: 1,
    rarity: 'uncommon',
    result: () => {
      const item = { id: state.nextItemId++, type: 'weapon', subtype: 'needle_pistol', weaponType: 'pistol', name: 'Needle Pistol', rarity: 'uncommon', durability: 65, maxDurability: 65, damage: [5, 9], effects: ['armorPierce:10'] };
      tryAddAndLog(item);
    }
  },
  
  // ===== UNCOMMON RIFLES =====
  assault_rifle: {
    name: 'Assault Rifle',
    scrap: 45,
    tech: 4,
    weaponPart: 2,
    rarity: 'uncommon',
    result: () => {
      const item = { id: state.nextItemId++, type: 'weapon', subtype: 'assault_rifle', weaponType: 'rifle', name: 'Assault Rifle', rarity: 'uncommon', durability: 70, maxDurability: 70, damage: [9, 12], effects: ['burst:3'] };
      tryAddAndLog(item);
    }
  },
  scoped_rifle: {
    name: 'Scoped Rifle',
    scrap: 48,
    tech: 5,
    weaponPart: 2,
    rarity: 'uncommon',
    result: () => {
      const item = { id: state.nextItemId++, type: 'weapon', subtype: 'scoped_rifle', weaponType: 'rifle', name: 'Scoped Rifle', rarity: 'uncommon', durability: 75, maxDurability: 75, damage: [10, 13], effects: ['crit:15'] };
      tryAddAndLog(item);
    }
  },
  battle_rifle: {
    name: 'Battle Rifle',
    scrap: 46,
    tech: 4,
    weaponPart: 2,
    rarity: 'uncommon',
    result: () => {
      const item = { id: state.nextItemId++, type: 'weapon', subtype: 'battle_rifle', weaponType: 'rifle', name: 'Battle Rifle', rarity: 'uncommon', durability: 80, maxDurability: 80, damage: [8, 13] };
      tryAddAndLog(item);
    }
  },
  carbine: {
    name: 'Carbine',
    scrap: 44,
    tech: 4,
    weaponPart: 2,
    rarity: 'uncommon',
    result: () => {
      const item = { id: state.nextItemId++, type: 'weapon', subtype: 'carbine', weaponType: 'rifle', name: 'Carbine', rarity: 'uncommon', durability: 65, maxDurability: 65, damage: [7, 11] };
      tryAddAndLog(item);
    }
  },
  
  // ===== UNCOMMON SHOTGUN =====
  pump_shotgun: {
    name: 'Pump Shotgun',
    scrap: 40,
    tech: 3,
    weaponPart: 2,
    rarity: 'uncommon',
    result: () => {
      const item = { id: state.nextItemId++, type: 'weapon', subtype: 'pump_shotgun', weaponType: 'shotgun', name: 'Pump Shotgun', rarity: 'uncommon', durability: 60, maxDurability: 60, damage: [8, 14] };
      tryAddAndLog(item);
    }
  },
  auto_shotgun: {
    name: 'Auto-Shotgun',
    scrap: 42,
    tech: 4,
    weaponPart: 2,
    electronics: 1,
    rarity: 'uncommon',
    result: () => {
      const item = { id: state.nextItemId++, type: 'weapon', subtype: 'auto_shotgun', weaponType: 'shotgun', name: 'Auto-Shotgun', rarity: 'uncommon', durability: 65, maxDurability: 65, damage: [6, 14], effects: ['burst:1'] };
      tryAddAndLog(item);
    }
  },
  riot_shotgun: {
    name: 'Riot Shotgun',
    scrap: 44,
    tech: 4,
    weaponPart: 2,
    electronics: 1,
    rarity: 'uncommon',
    result: () => {
      const item = { id: state.nextItemId++, type: 'weapon', subtype: 'riot_shotgun', weaponType: 'shotgun', name: 'Riot Shotgun', rarity: 'uncommon', durability: 70, maxDurability: 70, damage: [7, 12], effects: ['stun:5'] };
      tryAddAndLog(item);
    }
  },
  tactical_shotgun: {
    name: 'Tactical Shotgun',
    scrap: 45,
    tech: 5,
    weaponPart: 2,
    rarity: 'uncommon',
    result: () => {
      const item = { id: state.nextItemId++, type: 'weapon', subtype: 'tactical_shotgun', weaponType: 'shotgun', name: 'Tactical Shotgun', rarity: 'uncommon', durability: 75, maxDurability: 75, damage: [8, 13] };
      tryAddAndLog(item);
    }
  },
  
  // ===== UNCOMMON ARMOR =====
  light_armor: { 
    name: 'Light Armor', 
    scrap: 40, 
    tech: 3,
    armor_plating: 1,
    rarity: 'uncommon',
    result: () => { 
      const item = { id: state.nextItemId++, type: 'armor', subtype: 'light_armor', name: 'Light Armor', rarity: 'uncommon', durability: 100, maxDurability: 100, defense: 3 }; 
      tryAddAndLog(item); 
    } 
  },
  tactical_vest: {
    name: 'Tactical Vest',
    scrap: 38,
    tech: 3,
    armor_plating: 1,
    rarity: 'uncommon',
    result: () => {
      const item = { id: state.nextItemId++, type: 'armor', subtype: 'tactical_vest', name: 'Tactical Vest', rarity: 'uncommon', durability: 90, maxDurability: 90, defense: 3, effects: ['dodge:5'] };
      tryAddAndLog(item);
    }
  },
  reinforced_plating: {
    name: 'Reinforced Plating',
    scrap: 50,
    tech: 4,
    armor_plating: 2,
    rarity: 'uncommon',
    result: () => {
      const item = { id: state.nextItemId++, type: 'armor', subtype: 'reinforced_plating', name: 'Reinforced Plating', rarity: 'uncommon', durability: 120, maxDurability: 120, defense: 5 };
      tryAddAndLog(item);
    }
  },
  ballistic_vest: {
    name: 'Ballistic Vest',
    scrap: 48,
    tech: 4,
    armor_plating: 2,
    rarity: 'uncommon',
    result: () => {
      const item = { id: state.nextItemId++, type: 'armor', subtype: 'ballistic_vest', name: 'Ballistic Vest', rarity: 'uncommon', durability: 110, maxDurability: 110, defense: 3, effects: ['hpBonus:5'] };
      tryAddAndLog(item);
    }
  },
  
  // ===== RARE MELEE WEAPONS =====
  plasma_blade: {
    name: 'Plasma Blade',
    scrap: 60,
    tech: 8,
    power_core: 1,
    rarity: 'rare',
    result: () => {
      const item = { id: state.nextItemId++, type: 'weapon', subtype: 'plasma_blade', weaponType: 'melee', name: 'Plasma Blade', rarity: 'rare', durability: 80, maxDurability: 80, damage: [10, 15], effects: ['armorPierce:15'] };
      tryAddAndLog(item);
    }
  },
  shock_maul: {
    name: 'Shock Maul',
    scrap: 58,
    tech: 7,
    power_core: 1,
    rarity: 'rare',
    result: () => {
      const item = { id: state.nextItemId++, type: 'weapon', subtype: 'shock_maul', weaponType: 'melee', name: 'Shock Maul', rarity: 'rare', durability: 75, maxDurability: 75, damage: [12, 16], effects: ['stun:20'] };
      tryAddAndLog(item);
    }
  },
  vibro_axe: {
    name: 'Vibro-Axe',
    scrap: 62,
    tech: 8,
    weaponPart: 1,
    power_core: 1,
    rarity: 'rare',
    result: () => {
      const item = { id: state.nextItemId++, type: 'weapon', subtype: 'vibro_axe', weaponType: 'melee', name: 'Vibro-Axe', rarity: 'rare', durability: 85, maxDurability: 85, damage: [9, 14], effects: ['armorPierce:20', 'crit:10'] };
      tryAddAndLog(item);
    }
  },
  power_fist: {
    name: 'Power Fist',
    scrap: 65,
    tech: 7,
    weaponPart: 1,
    power_core: 1,
    rarity: 'rare',
    result: () => {
      const item = { id: state.nextItemId++, type: 'weapon', subtype: 'power_fist', weaponType: 'melee', name: 'Power Fist', rarity: 'rare', durability: 90, maxDurability: 90, damage: [11, 15] };
      tryAddAndLog(item);
    }
  },
  
  // ===== RARE PISTOLS =====
  plasma_pistol: {
    name: 'Plasma Pistol',
    scrap: 65,
    tech: 9,
    weaponPart: 2,
    power_core: 1,
    rarity: 'rare',
    result: () => {
      const item = { id: state.nextItemId++, type: 'weapon', subtype: 'plasma_pistol', weaponType: 'pistol', name: 'Plasma Pistol', rarity: 'rare', durability: 90, maxDurability: 90, damage: [12, 16], effects: ['burn:15', 'armorPierce:25'] };
      tryAddAndLog(item);
    }
  },
  smart_pistol: {
    name: 'Smart Pistol',
    scrap: 62,
    tech: 8,
    weaponPart: 2,
    electronics: 2,
    rarity: 'rare',
    result: () => {
      const item = { id: state.nextItemId++, type: 'weapon', subtype: 'smart_pistol', weaponType: 'pistol', name: 'Smart Pistol', rarity: 'rare', durability: 85, maxDurability: 85, damage: [10, 14], effects: ['accuracy:10'] };
      tryAddAndLog(item);
    }
  },
  mag_pistol: {
    name: 'Mag Pistol',
    scrap: 64,
    tech: 8,
    weaponPart: 2,
    power_core: 1,
    rarity: 'rare',
    result: () => {
      const item = { id: state.nextItemId++, type: 'weapon', subtype: 'mag_pistol', weaponType: 'pistol', name: 'Mag Pistol', rarity: 'rare', durability: 95, maxDurability: 95, damage: [9, 14], effects: ['armorPierce:15'] };
      tryAddAndLog(item);
    }
  },
  arc_pistol: {
    name: 'Arc Pistol',
    scrap: 66,
    tech: 9,
    weaponPart: 2,
    electronics: 1,
    power_core: 1,
    rarity: 'rare',
    result: () => {
      const item = { id: state.nextItemId++, type: 'weapon', subtype: 'arc_pistol', weaponType: 'pistol', name: 'Arc Pistol', rarity: 'rare', durability: 90, maxDurability: 90, damage: [8, 13], effects: ['stun:15', 'splash:10'] };
      tryAddAndLog(item);
    }
  },
  
  // ===== RARE RIFLES =====
  pulse_rifle: { 
    name: 'Pulse Rifle', 
    scrap: 70, 
    tech: 8, 
    weaponPart: 3,
    power_core: 1,
    rarity: 'rare',
    result: () => { 
      const item = { id: state.nextItemId++, type: 'weapon', subtype: 'pulse_rifle', weaponType: 'rifle', name: 'Pulse Rifle', rarity: 'rare', durability: 100, maxDurability: 100, damage: [12, 16] }; 
      tryAddAndLog(item); 
    } 
  },
  plasma_rifle: {
    name: 'Plasma Rifle',
    scrap: 75,
    tech: 9,
    weaponPart: 3,
    power_core: 1,
    rarity: 'rare',
    result: () => {
      const item = { id: state.nextItemId++, type: 'weapon', subtype: 'plasma_rifle', weaponType: 'rifle', name: 'Plasma Rifle', rarity: 'rare', durability: 95, maxDurability: 95, damage: [14, 18], effects: ['burn:20'] };
      tryAddAndLog(item);
    }
  },
  laser_rifle: {
    name: 'Laser Rifle',
    scrap: 72,
    tech: 9,
    weaponPart: 3,
    power_core: 1,
    rarity: 'rare',
    result: () => {
      const item = { id: state.nextItemId++, type: 'weapon', subtype: 'laser_rifle', weaponType: 'rifle', name: 'Laser Rifle', rarity: 'rare', durability: 105, maxDurability: 105, damage: [9, 14], effects: ['burn:18', 'accuracy:8'] };
      tryAddAndLog(item);
    }
  },
  marksman_rifle: {
    name: 'Marksman Rifle',
    scrap: 78,
    tech: 10,
    weaponPart: 3,
    power_core: 1,
    rarity: 'rare',
    result: () => {
      const item = { id: state.nextItemId++, type: 'weapon', subtype: 'marksman_rifle', weaponType: 'rifle', name: 'Marksman Rifle', rarity: 'rare', durability: 110, maxDurability: 110, damage: [12, 16], effects: ['crit:20', 'accuracy:10'] };
      tryAddAndLog(item);
    }
  },
  
  // ===== RARE SHOTGUNS =====
  combat_shotgun: { 
    name: 'Combat Shotgun', 
    scrap: 68, 
    tech: 7, 
    weaponPart: 3,
    rarity: 'rare',
    result: () => { 
      const item = { id: state.nextItemId++, type: 'weapon', subtype: 'combat_shotgun', weaponType: 'shotgun', name: 'Combat Shotgun', rarity: 'rare', durability: 80, maxDurability: 80, damage: [10, 18] }; 
      tryAddAndLog(item); 
    } 
  },
  plasma_shotgun: {
    name: 'Plasma Shotgun',
    scrap: 72,
    tech: 8,
    weaponPart: 3,
    power_core: 1,
    rarity: 'rare',
    result: () => {
      const item = { id: state.nextItemId++, type: 'weapon', subtype: 'plasma_shotgun', weaponType: 'shotgun', name: 'Plasma Shotgun', rarity: 'rare', durability: 85, maxDurability: 85, damage: [12, 20], effects: ['burn:25'] };
      tryAddAndLog(item);
    }
  },
  arc_shotgun: {
    name: 'Arc Shotgun',
    scrap: 70,
    tech: 8,
    weaponPart: 3,
    electronics: 1,
    power_core: 1,
    rarity: 'rare',
    result: () => {
      const item = { id: state.nextItemId++, type: 'weapon', subtype: 'arc_shotgun', weaponType: 'shotgun', name: 'Arc Shotgun', rarity: 'rare', durability: 90, maxDurability: 90, damage: [9, 16], effects: ['stun:20', 'splash:15'] };
      tryAddAndLog(item);
    }
  },
  flechette_cannon: {
    name: 'Flechette Cannon',
    scrap: 75,
    tech: 9,
    weaponPart: 3,
    power_core: 1,
    rarity: 'rare',
    result: () => {
      const item = { id: state.nextItemId++, type: 'weapon', subtype: 'flechette_cannon', weaponType: 'shotgun', name: 'Flechette Cannon', rarity: 'rare', durability: 95, maxDurability: 95, damage: [8, 18], effects: ['armorPierce:30'] };
      tryAddAndLog(item);
    }
  },
  
  // ===== RARE HEAVY WEAPONS =====
  
  // ===== RARE HEAVY WEAPONS =====
  light_machine_gun: {
    name: 'Light Machine Gun',
    scrap: 80,
    tech: 9,
    weaponPart: 3,
    rarity: 'rare',
    result: () => {
      const item = { id: state.nextItemId++, type: 'weapon', subtype: 'light_machine_gun', weaponType: 'heavy', name: 'Light Machine Gun', rarity: 'rare', durability: 90, maxDurability: 90, damage: [13, 17], effects: ['burst:4'] };
      tryAddAndLog(item);
    }
  },
  grenade_launcher: {
    name: 'Grenade Launcher',
    scrap: 85,
    tech: 10,
    weaponPart: 3,
    electronics: 1,
    rarity: 'rare',
    result: () => {
      const item = { id: state.nextItemId++, type: 'weapon', subtype: 'grenade_launcher', weaponType: 'heavy', name: 'Grenade Launcher', rarity: 'rare', durability: 70, maxDurability: 70, damage: [18, 24], effects: ['splash:50'] };
      tryAddAndLog(item);
    }
  },
  plasma_cannon: {
    name: 'Plasma Cannon',
    scrap: 88,
    tech: 11,
    weaponPart: 3,
    power_core: 2,
    rarity: 'rare',
    result: () => {
      const item = { id: state.nextItemId++, type: 'weapon', subtype: 'plasma_cannon', weaponType: 'heavy', name: 'Plasma Cannon', rarity: 'rare', durability: 95, maxDurability: 95, damage: [13, 18], effects: ['burn:30', 'splash:20'] };
      tryAddAndLog(item);
    }
  },
  missile_pod: {
    name: 'Missile Pod',
    scrap: 90,
    tech: 12,
    weaponPart: 3,
    electronics: 2,
    rarity: 'rare',
    result: () => {
      const item = { id: state.nextItemId++, type: 'weapon', subtype: 'missile_pod', weaponType: 'heavy', name: 'Missile Pod', rarity: 'rare', durability: 85, maxDurability: 85, damage: [14, 19], effects: ['splash:40', 'burst:1'] };
      tryAddAndLog(item);
    }
  },
  
  // ===== RARE ARMOR =====
  heavy_armor: { 
    name: 'Heavy Armor', 
    scrap: 80, 
    tech: 8,
    armor_plating: 3,
    rarity: 'rare',
    result: () => { 
      const item = { id: state.nextItemId++, type: 'armor', subtype: 'heavy_armor', name: 'Heavy Armor', rarity: 'rare', durability: 200, maxDurability: 200, defense: 6 }; 
      tryAddAndLog(item); 
    } 
  },
  composite_armor: {
    name: 'Composite Armor',
    scrap: 75,
    tech: 9,
    armor_plating: 2,
    nano_material: 1,
    rarity: 'rare',
    result: () => {
      const item = { id: state.nextItemId++, type: 'armor', subtype: 'composite_armor', name: 'Composite Armor', rarity: 'rare', durability: 140, maxDurability: 140, defense: 5, effects: ['dodge:10'] };
      tryAddAndLog(item);
    }
  },
  stealth_suit: {
    name: 'Stealth Suit',
    scrap: 70,
    tech: 10,
    armor_plating: 1,
    nano_material: 1,
    rarity: 'rare',
    result: () => {
      const item = { id: state.nextItemId++, type: 'armor', subtype: 'stealth_suit', name: 'Stealth Suit', rarity: 'rare', durability: 120, maxDurability: 120, defense: 4, effects: ['dodge:15', 'retreat:10'] };
      tryAddAndLog(item);
    }
  },
  power_armor_frame: {
    name: 'Power Armor Frame',
    scrap: 90,
    tech: 10,
    armor_plating: 3,
    power_core: 1,
    rarity: 'rare',
    result: () => {
      const item = { id: state.nextItemId++, type: 'armor', subtype: 'power_armor_frame', name: 'Power Armor Frame', rarity: 'rare', durability: 180, maxDurability: 180, defense: 7, effects: ['hpBonus:10'] };
      tryAddAndLog(item);
    }
  },
  hazmat_suit: { 
    name: 'Hazmat Suit', 
    scrap: 115, 
    tech: 6,
    armor_plating: 1,
    rarity: 'rare',
    result: () => { 
      const item = { id: state.nextItemId++, type: 'armor', subtype: 'hazmat_suit', name: 'Hazmat Suit', rarity: 'rare', durability: 150, maxDurability: 150, defense: 3 }; 
      tryAddAndLog(item); 
    } 
  },
  thermal_suit: {
    name: 'Thermal Suit',
    scrap: 78,
    tech: 8,
    armor_plating: 2,
    electronics: 1,
    rarity: 'rare',
    result: () => {
      const item = { id: state.nextItemId++, type: 'armor', subtype: 'thermal_suit', name: 'Thermal Suit', rarity: 'rare', durability: 130, maxDurability: 130, defense: 4, effects: ['immunity:burn'] };
      tryAddAndLog(item);
    }
  },
  
  // ===== LEGENDARY MELEE WEAPONS =====
  nano_edge_katana: {
    name: 'Nano-Edge Katana',
    scrap: 120,
    tech: 15,
    weaponPart: 2,
    advanced_component: 2,
    nano_material: 1,
    rarity: 'veryrare',
    result: () => {
      const item = { id: state.nextItemId++, type: 'weapon', subtype: 'nano_edge_katana', weaponType: 'melee', name: 'Nano-Edge Katana', rarity: 'veryrare', durability: 120, maxDurability: 120, damage: [18, 25], effects: ['crit:25', 'armorPierce:20'] };
      tryAddAndLog(item);
    }
  },
  venom_blade: {
    name: 'Venom Blade',
    scrap: 120,
    tech: 15,
    weaponPart: 2,
    advanced_component: 2,
    alien_artifact: 1,
    rarity: 'veryrare',
    result: () => {
      const item = { id: state.nextItemId++, type: 'weapon', subtype: 'venom_blade', weaponType: 'melee', name: 'Venom Blade', rarity: 'veryrare', durability: 120, maxDurability: 120, damage: [16, 23], effects: ['poison:30'] };
      tryAddAndLog(item);
    }
  },
  void_reaper: {
    name: 'Void Reaper',
    scrap: 125,
    tech: 16,
    weaponPart: 2,
    advanced_component: 2,
    quantum_core: 1,
    rarity: 'veryrare',
    result: () => {
      const item = { id: state.nextItemId++, type: 'weapon', subtype: 'void_reaper', weaponType: 'melee', name: 'Void Reaper', rarity: 'veryrare', durability: 130, maxDurability: 130, damage: [13, 21], effects: ['phase:15', 'armorPierce:25'] };
      tryAddAndLog(item);
    }
  },
  thunder_hammer: {
    name: 'Thunder Hammer',
    scrap: 130,
    tech: 17,
    weaponPart: 2,
    advanced_component: 3,
    power_core: 2,
    rarity: 'veryrare',
    result: () => {
      const item = { id: state.nextItemId++, type: 'weapon', subtype: 'thunder_hammer', weaponType: 'melee', name: 'Thunder Hammer', rarity: 'veryrare', durability: 140, maxDurability: 140, damage: [15, 22], effects: ['stun:30', 'splash:20'] };
      tryAddAndLog(item);
    }
  },
  
  // ===== LEGENDARY PISTOLS =====
  void_pistol: {
    name: 'Void Pistol',
    scrap: 125,
    tech: 16,
    weaponPart: 3,
    advanced_component: 2,
    quantum_core: 1,
    rarity: 'veryrare',
    result: () => {
      const item = { id: state.nextItemId++, type: 'weapon', subtype: 'void_pistol', weaponType: 'pistol', name: 'Void Pistol', rarity: 'veryrare', durability: 130, maxDurability: 130, damage: [18, 24], effects: ['phase:20'] };
      tryAddAndLog(item);
    }
  },
  annihilator_pistol: {
    name: 'Annihilator Pistol',
    scrap: 128,
    tech: 17,
    weaponPart: 3,
    advanced_component: 2,
    power_core: 2,
    rarity: 'veryrare',
    result: () => {
      const item = { id: state.nextItemId++, type: 'weapon', subtype: 'annihilator_pistol', weaponType: 'pistol', name: 'Annihilator Pistol', rarity: 'veryrare', durability: 135, maxDurability: 135, damage: [14, 20], effects: ['burn:35', 'crit:15'] };
      tryAddAndLog(item);
    }
  },
  hurricane_pistol: {
    name: 'Hurricane Pistol',
    scrap: 122,
    tech: 16,
    weaponPart: 3,
    advanced_component: 2,
    electronics: 2,
    rarity: 'veryrare',
    result: () => {
      const item = { id: state.nextItemId++, type: 'weapon', subtype: 'hurricane_pistol', weaponType: 'pistol', name: 'Hurricane Pistol', rarity: 'veryrare', durability: 125, maxDurability: 125, damage: [11, 17], effects: ['burst:3', 'accuracy:12'] };
      tryAddAndLog(item);
    }
  },
  executioner_revolver: {
    name: 'Executioner Revolver',
    scrap: 132,
    tech: 18,
    weaponPart: 3,
    advanced_component: 3,
    nano_material: 1,
    rarity: 'veryrare',
    result: () => {
      const item = { id: state.nextItemId++, type: 'weapon', subtype: 'executioner_revolver', weaponType: 'pistol', name: 'Executioner Revolver', rarity: 'veryrare', durability: 140, maxDurability: 140, damage: [16, 22], effects: ['crit:30', 'armorPierce:25'] };
      tryAddAndLog(item);
    }
  },
  
  // ===== LEGENDARY RIFLES =====
  gauss_rifle: {
    name: 'Gauss Rifle',
    scrap: 140,
    tech: 18,
    weaponPart: 4,
    advanced_component: 2,
    power_core: 1,
    rarity: 'veryrare',
    result: () => {
      const item = { id: state.nextItemId++, type: 'weapon', subtype: 'gauss_rifle', weaponType: 'rifle', name: 'Gauss Rifle', rarity: 'veryrare', durability: 150, maxDurability: 150, damage: [20, 28], effects: ['armorPierce:30'] };
      tryAddAndLog(item);
    }
  },
  quantum_rifle: {
    name: 'Quantum Rifle',
    scrap: 135,
    tech: 17,
    weaponPart: 4,
    advanced_component: 2,
    quantum_core: 1,
    rarity: 'veryrare',
    result: () => {
      const item = { id: state.nextItemId++, type: 'weapon', subtype: 'quantum_rifle', weaponType: 'rifle', name: 'Quantum Rifle', rarity: 'veryrare', durability: 140, maxDurability: 140, damage: [18, 26], effects: ['phase:25', 'accuracy:10'] };
      tryAddAndLog(item);
    }
  },
  antimatter_rifle: {
    name: 'Antimatter Rifle',
    scrap: 140,
    tech: 18,
    weaponPart: 4,
    advanced_component: 2,
    alien_artifact: 1,
    rarity: 'veryrare',
    result: () => {
      const item = { id: state.nextItemId++, type: 'weapon', subtype: 'antimatter_rifle', weaponType: 'rifle', name: 'Antimatter Rifle', rarity: 'veryrare', durability: 160, maxDurability: 160, damage: [22, 32], effects: ['armorPierce:35', 'burst:2'] };
      tryAddAndLog(item);
    }
  },
  railgun: {
    name: 'Railgun',
    scrap: 138,
    tech: 17,
    weaponPart: 4,
    advanced_component: 2,
    rarity: 'veryrare',
    result: () => {
      const item = { id: state.nextItemId++, type: 'weapon', subtype: 'railgun', weaponType: 'rifle', name: 'Railgun', rarity: 'veryrare', durability: 155, maxDurability: 155, damage: [24, 34], effects: ['accuracy:15', 'crit:25'] };
      tryAddAndLog(item);
    }
  },
  
  // ===== LEGENDARY SHOTGUNS =====
  disintegrator_cannon: {
    name: 'Disintegrator Cannon',
    scrap: 130,
    tech: 16,
    weaponPart: 4,
    advanced_component: 2,
    alien_artifact: 1,
    rarity: 'veryrare',
    result: () => {
      const item = { id: state.nextItemId++, type: 'weapon', subtype: 'disintegrator_cannon', weaponType: 'shotgun', name: 'Disintegrator Cannon', rarity: 'veryrare', durability: 130, maxDurability: 130, damage: [18, 30], effects: ['armorPierce:40'] };
      tryAddAndLog(item);
    }
  },
  void_scattergun: {
    name: 'Void Scattergun',
    scrap: 128,
    tech: 16,
    weaponPart: 4,
    advanced_component: 2,
    quantum_core: 1,
    rarity: 'veryrare',
    result: () => {
      const item = { id: state.nextItemId++, type: 'weapon', subtype: 'void_scattergun', weaponType: 'shotgun', name: 'Void Scattergun', rarity: 'veryrare', durability: 125, maxDurability: 125, damage: [12, 21], effects: ['phase:25', 'splash:20'] };
      tryAddAndLog(item);
    }
  },
  inferno_blaster: {
    name: 'Inferno Blaster',
    scrap: 135,
    tech: 17,
    weaponPart: 4,
    advanced_component: 2,
    power_core: 2,
    rarity: 'veryrare',
    result: () => {
      const item = { id: state.nextItemId++, type: 'weapon', subtype: 'inferno_blaster', weaponType: 'shotgun', name: 'Inferno Blaster', rarity: 'veryrare', durability: 135, maxDurability: 135, damage: [14, 24], effects: ['burn:45', 'splash:25'] };
      tryAddAndLog(item);
    }
  },
  shredder_cannon: {
    name: 'Shredder Cannon',
    scrap: 138,
    tech: 18,
    weaponPart: 4,
    advanced_component: 3,
    nano_material: 1,
    rarity: 'veryrare',
    result: () => {
      const item = { id: state.nextItemId++, type: 'weapon', subtype: 'shredder_cannon', weaponType: 'shotgun', name: 'Shredder Cannon', rarity: 'veryrare', durability: 140, maxDurability: 140, damage: [15, 25], effects: ['armorPierce:35', 'crit:20'] };
      tryAddAndLog(item);
    }
  },
  
  // ===== LEGENDARY HEAVY WEAPONS =====
  minigun: {
    name: 'Minigun',
    scrap: 145,
    tech: 17,
    weaponPart: 4,
    advanced_component: 2,
    rarity: 'veryrare',
    result: () => {
      const item = { id: state.nextItemId++, type: 'weapon', subtype: 'minigun', weaponType: 'heavy', name: 'Minigun', rarity: 'veryrare', durability: 120, maxDurability: 120, damage: [10, 14], effects: ['burst:5'] };
      tryAddAndLog(item);
    }
  },
  venom_cannon: {
    name: 'Venom Cannon',
    scrap: 160,
    tech: 20,
    weaponPart: 4,
    advanced_component: 3,
    alien_artifact: 2,
    rarity: 'veryrare',
    result: () => {
      const item = { id: state.nextItemId++, type: 'weapon', subtype: 'venom_cannon', weaponType: 'heavy', name: 'Venom Cannon', rarity: 'veryrare', durability: 150, maxDurability: 150, damage: [22, 32], effects: ['poison:40', 'splash:25'] };
      tryAddAndLog(item);
    }
  },
  flamethrower: {
    name: 'Flamethrower',
    scrap: 145,
    tech: 18,
    weaponPart: 3,
    electronics: 2,
    advanced_component: 2,
    rarity: 'veryrare',
    result: () => {
      const item = { id: state.nextItemId++, type: 'weapon', subtype: 'flamethrower', weaponType: 'heavy', name: 'Flamethrower', rarity: 'veryrare', durability: 140, maxDurability: 140, damage: [14, 22], effects: ['burn:50', 'splash:30'] };
      tryAddAndLog(item);
    }
  },
  storm_cannon: {
    name: 'Storm Cannon',
    scrap: 150,
    tech: 19,
    weaponPart: 4,
    electronics: 3,
    advanced_component: 2,
    power_core: 1,
    rarity: 'veryrare',
    result: () => {
      const item = { id: state.nextItemId++, type: 'weapon', subtype: 'storm_cannon', weaponType: 'heavy', name: 'Storm Cannon', rarity: 'veryrare', durability: 135, maxDurability: 135, damage: [12, 20], effects: ['stun:35', 'splash:35', 'burst:2'] };
      tryAddAndLog(item);
    }
  },
  
  // ===== LEGENDARY ARMOR =====
  nano_weave_armor: {
    name: 'Nano-Weave Armor',
    scrap: 130,
    tech: 18,
    armor_plating: 3,
    advanced_component: 2,
    nano_material: 2,
    rarity: 'veryrare',
    result: () => {
      const item = { id: state.nextItemId++, type: 'armor', subtype: 'nano_weave_armor', name: 'Nano-Weave Armor', rarity: 'veryrare', durability: 200, maxDurability: 200, defense: 7, effects: ['dodge:15', 'crit:5'] };
      tryAddAndLog(item);
    }
  },
  titan_armor: {
    name: 'Titan Armor',
    scrap: 150,
    tech: 20,
    armor_plating: 5,
    advanced_component: 3,
    power_core: 1,
    rarity: 'veryrare',
    result: () => {
      const item = { id: state.nextItemId++, type: 'armor', subtype: 'titan_armor', name: 'Titan Armor', rarity: 'veryrare', durability: 280, maxDurability: 280, defense: 10, effects: ['hpBonus:15'] };
      tryAddAndLog(item);
    }
  },
  shield_suit: {
    name: 'Shield Suit',
    scrap: 140,
    tech: 19,
    armor_plating: 4,
    advanced_component: 2,
    power_core: 2,
    rarity: 'veryrare',
    result: () => {
      const item = { id: state.nextItemId++, type: 'armor', subtype: 'shield_suit', name: 'Shield Suit', rarity: 'veryrare', durability: 250, maxDurability: 250, defense: 9, effects: ['reflect:20'] };
      tryAddAndLog(item);
    }
  },
  regenerative_armor: {
    name: 'Regenerative Armor',
    scrap: 138,
    tech: 19,
    armor_plating: 4,
    advanced_component: 2,
    nano_material: 2,
    rarity: 'veryrare',
    result: () => {
      const item = { id: state.nextItemId++, type: 'armor', subtype: 'regenerative_armor', name: 'Regenerative Armor', rarity: 'veryrare', durability: 200, maxDurability: 200, defense: 7, effects: ['regen:5'] };
      tryAddAndLog(item);
    }
  },
  spectre_armor: {
    name: 'Spectre Armor',
    scrap: 145,
    tech: 20,
    armor_plating: 3,
    advanced_component: 3,
    alien_artifact: 2,
    rarity: 'veryrare',
    result: () => {
      const item = { id: state.nextItemId++, type: 'armor', subtype: 'spectre_armor', name: 'Spectre Armor', rarity: 'veryrare', durability: 230, maxDurability: 230, defense: 6, effects: ['phase:40'] };
      tryAddAndLog(item);
    }
  }
};

const TASKS = ['Idle', 'Oxygen', 'Food', 'Energy', 'Scrap', 'Guard'];

const AWAY_MISSIONS = {
  'med_bay_salvage': {
    id: 'med_bay_salvage',
    name: 'Triage',
    tileLabel: 'M',
    discoveryText: "Your flashlight beam reveals a medical bay entrance, its reinforced doors smeared with bloody handprints—some human, some... not. Biohazard warnings glow faintly, half-obscured by dark organic matter that's dried into the grooves. The door's manual override panel has been clawed open, wires hanging like exposed viscera. From the other side comes a wet, rhythmic sound—something breathing, or feeding.",
    briefing: "This is 'Triage Ward Beta.' During the outbreak's final days, Dr. Kaine's logs went from clinical to... unhinged. His last transmission claimed they'd discovered something 'beautiful' about the aliens' lifecycle. The word 'incubation' appears dozens of times. Station AI sealed this section under Protocol Triage—a euphemism for burning evidence. Whatever research they were conducting, it died screaming behind these doors. But medical tech is desperately needed. Time to see what the good doctor left behind.",
    events: {
      'entry': {
        eventText: "The door mechanism is magnetically sealed, its emergency lock panel flickering weakly. Nearby, a maintenance hatch is partially open, its edges bent outward as if something forced its way OUT. You could hack the main lock or cut through the hatch.",
        choices: [
          {
            choiceText: 'Hack the magnetic lock.',
            skillCheck: { difficulty: 40 },
            successText: "The lock disengages with a pneumatic hiss, and a wave of refrigerated air rolls out—thick with the coppery stench of blood and something sweeter, like rot wrapped in honey. The door slides open silently.",
            failureText: "The panel shorts out in a cascade of sparks! Emergency klaxons scream to life, echoing through the medical bay. From the darkness ahead, you hear a chorus of wet, dragging footsteps converging on your position.",
            outcome: { success: { nextEvent: 'quiet_hall' }, failure: { trigger: 'ambush', nextEvent: 'alarm_hall' } }
          },
          {
            choiceText: 'Cut through the maintenance hatch.',
            skillCheck: { difficulty: 60 },
            successText: "Your plasma cutter screams as it shears through the reinforced plating. The metal section crashes inward with a deafening clang, revealing a dark corridor beyond.",
            failureText: "The cutter hits a support beam and fails catastrophically! The noise is immense—a shrieking whine that reverberates through every corridor. From all around, you hear the unmistakable chittering of multiple hostiles responding to the dinner bell.",
            outcome: { success: { nextEvent: 'loud_hall' }, failure: { trigger: 'horde_ambush', nextEvent: 'loud_hall' } }
          }
        ]
      },
      'quiet_hall': {
        eventText: "You're inside. The corridor is sterile, too clean for a station on the brink of collapse. Emergency lights cast flickering shadows that make the walls seem to breathe. To your left is the Operating Theater, its doors slightly ajar and leaking condensation. To your right is the Sterilization Chamber, sealed tight with a red warning light pulsing above it.",
        choices: [
          {
            choiceText: 'Enter the Operating Theater.',
            outcome: { success: { nextEvent: 'operating_theater' } }
          },
          {
            choiceText: "Bypass the Sterilization Chamber's lock.",
            skillCheck: { difficulty: 35 },
            successText: "The high-security lock clicks open with a soft beep. The red warning light flickers off.",
            failureText: "You trip a silent alarm. The door remains sealed, but deep within the chamber, something massive begins to stir. You hear it approaching.",
            outcome: { success: { nextEvent: 'sterilization_chamber' }, failure: { trigger: 'ambush', nextEvent: 'exit_mission_failure' } }
          }
        ]
      },
      'loud_hall': {
        eventText: "You're in, but stealth is no longer an option. The hallway is a scene from a nightmare—operating tables overturned, surgical tools scattered like dropped silverware. Bodies in medical scrubs line the walls, their chests torn open and hollow. Black organic resin holds them upright like grotesque statues. Fresh blood pools near the Operating Theater, still warm.",
        choices: [
          {
            choiceText: 'Barricade and search the Operating Theater.',
            outcome: { success: { nextEvent: 'operating_theater_barricaded' } }
          },
          {
            choiceText: 'Investigate the Sterilization Chamber.',
            outcome: { success: { nextEvent: 'sterilization_confrontation' } }
          }
        ]
      },
      'alarm_hall': {
        eventText: "The klaxons wail. The hallway is a charnel house—bodies fused to the walls by black resin, chests carved open like anatomy displays. A fresh corpse lies near the Operating Theater, its torso split wide. From inside the ribcage, something small and pale writhes briefly before going still. Then you see the source of the footsteps—an Infested, shambling forward. What's left of its face is frozen in a silent scream.",
        choices: [
          {
            choiceText: 'Fight through to the Operating Theater.',
            outcome: { success: { nextEvent: 'operating_theater_barricaded' } }
          },
          {
            choiceText: 'Ignore it and breach the Sterilization Chamber.',
            outcome: { success: { nextEvent: 'sterilization_confrontation' } }
          }
        ]
      },
      'operating_theater': {
        eventText: "The theater is pristine—too pristine. Six bodies lie on operating tables, arranged in perfect symmetry. Each one's chest has been surgically opened, ribs spread like wings. Inside each cavity, dozens of pale, segmented larvae writhe slowly, feeding on what's left. On the seventh table lies Dr. Kaine himself. Half his body is charred black. His chest bulges rhythmically. His eyes are open.",
        choices: [
          {
            choiceText: 'Approach Dr. Kaine.',
            outcome: { success: { nextEvent: 'dr_kaine_encounter' } }
          },
          {
            choiceText: 'Search the medical supply cabinets instead.',
            skillCheck: { difficulty: 70 },
            successText: "You move quickly and quietly, finding experimental serums and advanced medical equipment stored in refrigerated units.",
            failureText: "You knock over a tray of surgical tools. The clatter echoes through the theater. The bodies on the tables begin to twitch. The larvae are moving faster now.",
            outcome: { success: { reward: { items: ['advanced_medkit', 'nanite_injector', 'stimpack'], quantities: [2, 2, 2] }, nextEvent: 'exit_mission' }, failure: { trigger: 'ambush', nextEvent: 'exit_ambush' } }
          }
        ]
      },
      'operating_theater_barricaded': {
        eventText: "You slam the doors shut and wedge a gurney against them just as something heavy crashes against the other side. The impact dents the metal inward, and a clawed appendage punches through, grasping blindly. It withdraws with a wet screech. You're safe, for now. A single, blood-soaked emergency medical kit sits on a counter, overlooked in the chaos.",
        choices: [
          {
            choiceText: 'Grab the kit and evacuate.',
            outcome: { success: { reward: { items: ['advanced_medkit'], quantities: [1] }, nextEvent: 'exit_mission' } }
          }
        ]
      },
      'sterilization_chamber': {
        eventText: "The chamber is a massive industrial incinerator designed to dispose of biohazard waste. Scorch marks cover the floor. In the center sits a control terminal, its screen displaying a single looping message: 'PROTOCOL TRIAGE: PURGE COMPLETE. EVIDENCE SANITIZED.' The furnace vents are closed. Something about this feels wrong.",
        choices: [
          {
            choiceText: 'Download the terminal data.',
            outcome: { success: { reward: { items: ['tech'], quantities: [8] }, nextEvent: 'exit_mission' } }
          }
        ]
      },
      'sterilization_confrontation': {
        eventText: "As you approach the Sterilization Chamber, the door tears free from its housing. Three Infested stumble out—former medical staff, their name tags still pinned to their blood-soaked scrubs. Their chests are torn open, larvae spilling out like maggots from a corpse. They move in eerie synchronization, heads tilted at unnatural angles.",
        choices: [
          {
            choiceText: 'Fight them.',
            retreatText: 'Facing the puppet corpses, you decide discretion is the better part of valor. The mission is a failure, but you live to fight another day.',
            outcome: { success: { trigger: 'combat_infested_horde', nextEvent: 'sterilization_chamber' }, failure: { nextEvent: 'exit_mission_failure' } }
          },
          {
            choiceText: 'Flee the mission.',
            outcome: { success: { nextEvent: 'exit_mission_failure' } }
          }
        ]
      },
      'dr_kaine_encounter': {
        eventText: "Dr. Kaine's eyes track you as you approach. His lips move, forming soundless words. Then his chest bulges violently, and something inside screams—not with his voice, but with dozens of tiny, chittering voices in unison. The larvae. He's still alive. Barely. His hand twitches toward a data slate on the table beside him.",
        choices: [
          {
            choiceText: 'Mercy kill him and take the slate.',
            outcome: { success: { reward: { items: ['tech'], quantities: [4] }, nextEvent: 'exit_mission' } }
          },
          {
            choiceText: 'End his suffering and the abominations inside.',
            retreatText: 'You put Dr. Kaine out of his misery. As he dies, the larvae burst from his chest in a writhing swarm. You barely escape with your life.',
            outcome: { success: { trigger: 'combat_dr_kaine', nextEvent: 'research_data' }, failure: { nextEvent: 'exit_mission_failure' } }
          }
        ]
      },
      'research_data': {
        eventText: "Dr. Kaine's body collapses as the larvae swarm disperses into the vents, chittering. On the data slate clutched in his dead hand, you find his final research notes. The aliens don't just kill—they convert. Each human becomes an incubator for dozens of offspring. The station wasn't lost to an invasion. It was a nursery.",
        choices: [
          {
            choiceText: 'Take the research data and rare medical equipment.',
            outcome: { success: { reward: { items: ['tech', 'nanite_injector', 'quantum_core'], quantities: [6, 2, 1] }, nextEvent: 'exit_mission' } }
          }
        ]
      }
    }
  },

  // Mission 2: Power Cycle — Engineering Deck
  'engineeringDeck': {
    id: 'engineeringDeck',
    name: 'Power Cycle',
    sector: 'Engineering Deck',
    difficulty: 'Medium',
    description: 'The Engineering Deck controls power distribution across the station. Something has corrupted the systems, and the backup generators are failing. Investigate what happened and restore main power before life support collapses.',
    discoveryText: 'The Engineering Deck door hisses open, releasing a wave of oppressive heat and humidity. Emergency lighting flickers weakly, casting red shadows across the walls. The air tastes metallic and organic—like blood mixed with ozone. You can hear rhythmic pulsing sounds deep within the machinery.',
    briefing: "Chief Engineer Vasquez's last transmission was three words: 'They're in the pipes.' Since then, thermal scans show the coolant system running 40 degrees hotter than spec. Power drain is accelerating. The station AI keeps repeating that restarting the fusion feeds will 'optimize biological integration efficiency.' You're not sure what that means, but without main power, everyone dies. Get in there and bring the systems back online.",
    rewards: {
      tech: 3,
      scrap: 40,
      energy: 200
    },
    keycard: 'engineeringDeck',
    events: {
      'entry': {
        eventText: "The main engineering bay is a nightmare. Thick, fleshy tubes—pulsating with bioluminescent veins—have grown over the reactor control panels and power conduits. They throb in sync with the station's failing heartbeat, siphoning energy. Pink coolant drips from ruptured pipes, pooling on the deck. Through the translucent biomass, you can see hundreds of small shapes suspended in the fluid. Eggs.",
        choices: [
          {
            choiceText: 'Investigate the main control terminal.',
            outcome: { success: { nextEvent: 'control_terminal' } }
          },
          {
            choiceText: 'Examine the biomass tubes.',
            outcome: { success: { nextEvent: 'biomass_inspection' } }
          }
        ]
      },
      'control_terminal': {
        eventText: "The control terminal is half-engulfed in alien tissue. The screen flickers: COOLANT CONTAMINATION 87% | FUSION FEEDS OFFLINE | THERMAL RUNAWAY IN 3 HOURS. You'll need to cut through the biomass to reach the manual override.",
        choices: [
          {
            choiceText: 'Cut through carefully and access the override.',
            outcome: { success: { nextEvent: 'biomass_rupture' } }
          },
          {
            choiceText: 'Look for another access route.',
            outcome: { success: { nextEvent: 'maintenance_crawlspace' } }
          }
        ]
      },
      'biomass_inspection': {
        eventText: "Up close, the tubes are warm, almost feverish. Inside, dark fluid circulates through a network of veins. Suspended in the flow are marble-sized egg sacs—hundreds of them. The aliens aren't just nesting in the station. They're plugged into it, using the power grid as an incubator.",
        choices: [
          {
            choiceText: 'Take a tissue sample for analysis.',
            outcome: { success: { reward: { items: ['tech'], quantities: [2] }, nextEvent: 'control_terminal' } }
          },
          {
            choiceText: 'Head to the control terminal.',
            outcome: { success: { nextEvent: 'control_terminal' } }
          }
        ]
      },
      'biomass_rupture': {
        eventText: "Your blade slices into the biomass. It tears open with a wet sound, spraying pink coolant that reeks of copper and decay. Chunks of dissolved flesh slosh out—someone was liquefied in the coolant system. The biomass recoils, exposing the override panel.",
        choices: [
          {
            choiceText: 'Restart the fusion feeds immediately.',
            outcome: { success: { nextEvent: 'power_restoration' } }
          },
          {
            choiceText: 'Check coolant diagnostics first.',
            outcome: { success: { nextEvent: 'coolant_diagnostics' } }
          }
        ]
      },
      'maintenance_crawlspace': {
        eventText: "The maintenance tunnel is tight and hot. Halfway through, you wade into ankle-deep pink coolant. Chunks of organic matter float in it. The liquid soaks through your suit, tingling against your skin. You push through and reach the override panel from the maintenance side.",
        choices: [
          {
            choiceText: 'Access the override panel.',
            outcome: { success: { damage: 8, nextEvent: 'power_restoration' } }
          }
        ]
      },
      'coolant_diagnostics': {
        eventText: "The diagnostics confirm it: the coolant system is 87% contaminated with dissolved biomass. Bodies fed into the loops, liquefied, and circulated through the alien network. The entire engineering deck is functioning as a digestive tract.",
        choices: [
          {
            choiceText: 'Purge the contaminated coolant before restarting.',
            outcome: { success: { reward: { items: ['repair_kit', 'tech'], quantities: [2, 2] }, nextEvent: 'power_restoration' } }
          },
          {
            choiceText: 'No time—restart now.',
            outcome: { success: { nextEvent: 'power_restoration' } }
          }
        ]
      },
      'power_restoration': {
        eventText: "You throw the switch. The fusion feeds thunder to life. Lights blaze across the engineering deck. For one moment, it feels like victory.\n\nThen the biomass *surges*. The tubes swell, gorging on the restored power. Inside them, the egg sacs pulse faster, growing visibly larger. You've just fed the infestation. Thousands of eggs, all accelerating toward maturity.\n\nThe station AI's voice echoes through the bay: 'Power restoration successful. Biological integration at 43% efficiency. Acceptable parameters.'\n\n⚠️ **You've restored main power—but at what cost?**",
        choices: [
          {
            choiceText: 'Leave immediately.',
            outcome: { success: { nextEvent: 'exit_mission' } }
          },
          {
            choiceText: 'Try to sabotage the biomass network.',
            retreatText: 'You slash at a main conduit. It ruptures, spraying scalding biomass. Aliens burst from the vents, swarming to protect their nursery.',
            outcome: { success: { trigger: 'combat_biomass_guardians', nextEvent: 'sabotage_aftermath' }, failure: { nextEvent: 'exit_mission_failure' } }
          }
        ]
      },
      'sabotage_aftermath': {
        eventText: "You've severed several major conduits. Hundreds of premature larvae spill out and die in the light. It's a small victory—but the main network still thrives, still feeds. The damage is already done. This sector is unlocked, but the station is more compromised than ever.",
        choices: [
          {
            choiceText: 'Evacuate the engineering deck.',
            outcome: { success: { reward: { items: ['tech', 'repair_kit'], quantities: [4, 2] }, nextEvent: 'exit_mission' } }
          }
        ]
      }
    }
  },

  // Mission 3: Last Stand — Security Wing
  'securityWing': {
    id: 'securityWing',
    name: 'Last Stand',
    sector: 'Security Wing',
    difficulty: 'Hard',
    description: 'The Security Wing holds the station\'s armory and weapon caches. Retrieve vital combat equipment and discover what happened to the security forces during the outbreak.',
    discoveryText: 'The Security Wing door groans open. The acrid smell of gunpowder and decay washes over you. Emergency lighting casts harsh shadows across walls riddled with bullet holes. The barricades are everywhere—but they face both directions. This wasn\'t a defense. It was a civil war.',
    briefing: "When containment failed, Security Chief Ramos sealed the wing and declared martial law. For two weeks, no aliens breached the Security Wing. But the final transmission from inside wasn't a distress call—it was gunfire and screaming. Surveillance logs went dark after someone smashed the security hub. The armory is still sealed, protected by biometric locks. If any of Ramos's team survived, they'll have the access codes. If not... you'll have to find another way in.",
    rewards: {
      tech: 4,
      scrap: 50,
      energy: 150
    },
    keycard: 'securityWing',
    events: {
      'entry': {
        eventText: "The security checkpoint is a graveyard. Barricades of overturned desks and welded metal face INWARD—toward the rest of the security wing, not out. Bodies in security uniforms are slumped against both sides, bullet wounds in their backs. Execution positions. On the wall, someone spray-painted: 'RAMOS HOARDS - WE STARVE.' Below it, a different hand wrote: 'TRAITORS GET BULLETS.'",
        choices: [
          {
            choiceText: 'Search the bodies for clues.',
            outcome: { success: { nextEvent: 'body_search' } }
          },
          {
            choiceText: 'Head deeper into the security wing.',
            outcome: { success: { nextEvent: 'barracks_hall' } }
          }
        ]
      },
      'body_search': {
        eventText: "You search the bodies. Most have been stripped of weapons and ammo. One corpse clutches a data pad, screen cracked but still functional. The last entry is a voice log from Officer Chen: 'Day 16. Ramos locked the armory. Said rationing ammo to 'essential personnel.' Half the team has no bullets. Mason's group is planning something. I can hear them whispering. God, we're eating each other alive and the things outside haven't even gotten in yet—' The log cuts to gunfire.",
        choices: [
          {
            choiceText: 'Take the data pad and continue.',
            outcome: { success: { reward: { items: ['tech'], quantities: [2] }, nextEvent: 'barracks_hall' } }
          }
        ]
      },
      'barracks_hall': {
        eventText: "The barracks hallway is a killbox. Spent shell casings carpet the floor—hundreds of them. Blood smears lead in both directions. More graffiti: 'ARMORY = LIFE' and 'RAMOS = DEATH.' You hear a wet, dragging sound from deeper in.",
        choices: [
          {
            choiceText: 'Investigate the sound carefully.',
            outcome: { success: { nextEvent: 'torture_room' } }
          },
          {
            choiceText: 'Head straight for the armory.',
            outcome: { success: { nextEvent: 'armory_approach' } }
          }
        ]
      },
      'torture_room': {
        eventText: "You find what was once an interrogation room. Now it's a torture chamber. Two bodies are strapped to chairs, uniforms shredded. Their fingers have been broken systematically—someone tried to get biometric override codes from them. They died without talking. On the wall, carved with a knife: '4 BULLETS LEFT. MAKE IT COUNT.' The wet sound is coming from the corner—an alien Lurker is feeding on one of the corpses.",
        choices: [
          {
            choiceText: 'Sneak past the feeding alien.',
            skillCheck: { difficulty: 55 },
            successText: "You move silently, staying in the shadows. The Lurker is too engrossed in its meal to notice. You slip past and continue deeper.",
            failureText: "Your boot crunches on a shell casing. The Lurker's head snaps up, gore dripping from its mandibles. It screams.",
            outcome: { success: { nextEvent: 'armory_approach' }, failure: { trigger: 'ambush', nextEvent: 'post_ambush' } }
          },
          {
            choiceText: 'Kill the alien while it\'s distracted.',
            retreatText: 'You open fire. The Lurker dies—but its death screech echoes through the wing. More aliens answer the call.',
            outcome: { success: { trigger: 'combat_lurker_pack', nextEvent: 'armory_approach' }, failure: { nextEvent: 'exit_mission_failure' } }
          }
        ]
      },
      'post_ambush': {
        eventText: "You fight off the Lurker. As it dies, you notice something clutched in the hand of one torture victim—a security badge. Ramos's badge. He didn't die in the armory. He died here, tortured by his own people.",
        choices: [
          {
            choiceText: 'Take Ramos\'s badge and continue.',
            outcome: { success: { reward: { items: ['tech'], quantities: [3] }, nextEvent: 'armory_approach' } }
          }
        ]
      },
      'armory_approach': {
        eventText: "The armory doors are heavily reinforced, still sealed. Blood is smeared on the biometric scanner. Someone died trying to break in. The bodies piled outside tell the story: Mason's faction tried to storm the armory. Ramos's loyalists held them off. Then the aliens came and finished what was left. The barricades are facing BOTH ways—they were killing each other while the real enemy closed in.",
        choices: [
          {
            choiceText: 'Try to hack the biometric lock.',
            skillCheck: { difficulty: 65 },
            successText: "You jury-rig a bypass using the blood-smeared scanner remnants. The lock clicks open. Inside, the armory is untouched—racks of weapons, ammo crates, body armor. They died fighting over a treasure trove they never got to use.",
            failureText: "The scanner shorts out in a shower of sparks. The backup system triggers a security lockdown. Alarms blare. From the vents above, you hear chittering.",
            outcome: { success: { nextEvent: 'armory_loot' }, failure: { trigger: 'combat_stalker_swarm', nextEvent: 'forced_entry' } }
          },
          {
            choiceText: 'Use Ramos\'s badge (if found earlier).',
            outcome: { success: { nextEvent: 'armory_loot' } }
          },
          {
            choiceText: 'Breach the door with explosives.',
            outcome: { success: { damage: 15, nextEvent: 'armory_loot' } }
          }
        ]
      },
      'forced_entry': {
        eventText: "You fight off the aliens drawn by the alarm. The armory lock is fried, but the door is weakened. You force it open with a pry bar.",
        choices: [
          {
            choiceText: 'Enter the armory.',
            outcome: { success: { nextEvent: 'armory_loot' } }
          }
        ]
      },
      'armory_loot': {
        eventText: "The armory is pristine. Weapon racks fully stocked. Ammo crates sealed. Advanced body armor hanging neatly. They killed each other over weapons they never even touched. On the command desk, you find Chief Ramos's final log: 'I was trying to keep order. Mason wanted to arm everyone—said we'd need every gun. I thought rationing would prevent chaos. I was wrong. We tore ourselves apart over fear of running out. The aliens didn't break us. We broke ourselves.' The log ends with a single gunshot.",
        choices: [
          {
            choiceText: 'Take what you can carry and leave.',
            outcome: { success: { reward: { items: ['plasma_rifle', 'heavy_armor', 'tech'], quantities: [1, 1, 5] }, nextEvent: 'exit_mission' } }
          },
          {
            choiceText: 'Search for surveillance logs.',
            outcome: { success: { nextEvent: 'surveillance_logs' } }
          }
        ]
      },
      'surveillance_logs': {
        eventText: "You access the security terminal. The surveillance footage is intact—all two weeks of it. You watch in fast-forward: Day 3, armed standoff over food rations. Day 7, Mason's group barricades themselves in the barracks. Day 11, Ramos executes a guard for stealing ammo. Day 14, full civil war—gunfights in the halls while aliens watch from the vents, waiting. Day 16, the aliens finally move in and effortlessly slaughter the handful of survivors too exhausted to fight back. The footage ends with a Stalker dragging Ramos's body away while Mason bleeds out against the armory door he never got to open.",
        choices: [
          {
            choiceText: 'Download the logs and evacuate.',
            outcome: { success: { reward: { items: ['plasma_rifle', 'heavy_armor', 'tech'], quantities: [1, 1, 6] }, nextEvent: 'exit_mission' } }
          }
        ]
      }
    }
  },
  
  // 1.0 - Phase 2.4: Mission 13 - Final Boss (Placeholder)
  'finalAssault': {
    id: 'finalAssault',
    name: 'Final Assault',
    tileLabel: '⚠️',
    discoveryText: "The shuttle's power signature has drawn the station's apex predator. Massive bio-readings converge on your position. This is it—the final battle.",
    briefing: "An Alpha Queen has arrived with her elite swarm. Every guard must defend the shuttle bay. If we fall here, everything is lost. But if we prevail... we escape this nightmare.",
    events: {
      'start': {
        eventText: "The hangar bay doors buckle inward as something massive slams against them. Screeching metal and alien shrieks fill the air. Your survivors take defensive positions around the shuttle. This is humanity's last stand.",
        choices: [
          {
            choiceText: 'Stand and fight!',
            outcome: { 
              success: { 
                trigger: 'combat_alpha_queen',
                nextEvent: 'exit_mission'
              } 
            }
          }
        ]
      }
    },
    finalRewards: {
      items: [],
      quantities: []
    }
  }
};
