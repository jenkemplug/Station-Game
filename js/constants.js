const VERSION = '0.9.0';
const BASE_GAME_KEY = `derelict_station_expanded_v${VERSION}`;
const TICK_MS = 1000;
const MAX_LOG = 300;

const BALANCE = {
  // Interactive combat
  COMBAT_ACTIONS: {
    Aim: { accuracyBonus: 0.25 },
    Burst: { dmgBonus: [3, 6], accuracyPenalty: 0.05, ammoMult: 2, cooldown: 3 },
    Guard: { defenseBonus: 3 },
    MedkitHeal: [10, 18]
  },
  // 0.9.0 - Consumable effects in combat
  CONSUMABLE_EFFECTS: {
    medkit: { heal: [12, 20], desc: 'Heal 12-20 HP' },
    advanced_medkit: { heal: [25, 35], desc: 'Heal 25-35 HP (superior healing)' },
    stimpack: { evasionBonus: 0.20, retreatBonus: 0.25, duration: 4, desc: '+20% dodge, +25% retreat for 4 turns' },
    repair_kit: { durabilityRestore: 40, desc: 'Restore 40 durability to equipped weapon or armor' },
    combat_drug: { damageBonus: 0.20, maxHpCost: 0.20, duration: 3, desc: '+20% damage for 3 turns, -20% max HP' },
    stun_grenade: { stunChance: 0.75, desc: '75% chance to stun target enemy' },
    nanite_injector: { permanentHP: 1, desc: '+1 permanent max HP' },
    revival_kit: { reviveHP: [0.40, 0.60], desc: 'Revive ally at 40-60% HP' },
    system_override: { instakill: true, hpThreshold: 12, desc: 'Instantly kill 1 enemy with ≤12 HP' },
    stealth_field: { dodgeNext: true, duration: 1, desc: 'Dodge next attack automatically' }
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
  BASE_REPAIR_SCRAP_COST: 50, // Base cost to repair from 0% to 100%
  BASE_REPAIR_ENERGY_COST: 30,
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
  MORALE_GAIN_BASE_REPAIRED: 15,
  MORALE_GAIN_SYSTEM_REPAIRED: 3,
  MORALE_LOSS_ALLY_DEATH: 10,
  MORALE_LOSS_ALLY_DOWNED: 5,
  MORALE_LOSS_BASE_CRITICAL: 0.15, // Per tick when base < 40%
  MORALE_LOSS_RAID_LOST: 15,
  MORALE_LOSS_RETREAT: 3,
  MORALE_LOSS_HIGH_THREAT: 0.10, // Per tick when threat > 75%
  MORALE_LOSS_SYSTEM_FAILURE: 0.05, // Per tick per failed system
  MORALE_NATURAL_RECOVERY: 0.20, // Per tick when resources healthy
  MORALE_REST_RECOVERY: 0.50, // Per tick for survivors on Idle task
  
  // 0.8.10 - Gameplay rebalance
  OXYGEN_PENALTY_NO_ENERGY: 0.1, // Oxygen production is only 10% effective without energy
  MAX_GUARDS: 4,                 // Max number of survivors that can be assigned to Guard duty
  MAX_TURRETS: 5,                // Max number of turrets that can be built
  
  // 0.9.0 - Rebalanced for longer runs with endgame escalation system
  // Threat tiers: Once you hit a tier, you can't go below it (high water marks)
  THREAT_TIERS: [0, 25, 50, 75, 100],  // 0% → 25% → 50% → 75% → 100% floors (wider gaps for longer runs)
  THREAT_GROWTH_BASE: 0.030,          // Reduced from 0.050 - slower passive growth for longer runs
  THREAT_GROWTH_RAND: 0.020,          // Reduced from 0.025 - more predictable, less swingy
  THREAT_GROWTH_MINIMUM: 0.005,       // Threat always grows at least +0.5%/min even with max defenses
  GUARD_THREAT_REDUCTION: 0.08,       // Guards slow threat, can't stop it
  THREAT_GAIN_PER_ALIEN: [2, 3],      // Increased from [1, 2] - combat drives threat progression
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
  XP_FROM_EXPLORE: 7,
  XP_FROM_LOOT: 8,
  COMBAT_XP_RANGE: [10, 22],
  
  // Production multipliers
  PROD_MULT: 1,
  BASE_SYSTEM_PRODUCTION: { // 0.8.13 - Base production for level 0 systems
    oxygen: 0.50, // Increased from 0.40 - better base system output
    energy: 0.25  // Increased from 0.20 - better base system output
  },
  SYSTEM_FILTER_MULT: 1.0,
  SYSTEM_GENERATOR_MULT: 1.0,
  SURVIVOR_PROD: {
    Oxygen: { base: 1.25 },  // Increased from 1.1 - better survivor production
    Food: { base: 1.15 },    // Increased from 1.05 - better food generation
    Energy: { base: 0.95 },  // Increased from 0.85 - better energy generation
    Scrap: { base: 0.65 },   // Increased from 0.6 - slightly better scrap generation
    IdleOxygen: 0, // 0.8.13 - Idle survivors no longer produce resources
    FoodYieldFactor: 0.95, // 0.8.11 - Increased from 0.6 to make food ~15% worse than oxygen
    // 0.8.8 - Energy consumption rebalanced to per-survivor basis
    PassiveEnergyDrainPerSurvivor: 0.18,  // Increased from 0.15 - late game energy pressure
    PassiveEnergyDrainPerTurret: 0.06,    // Increased from 0.04 - turrets same as survivors
    PassiveEnergyDrainPerFilterLevel: 0.08 // Increased from 0.06 - filter upgrades cost energy
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
    generator: { scrap: 30, energy: 20 }, // Increased from 25/18
    turret: { scrap: 45, energy: 28 } // Increased from 40/25
  }
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
  regen: { hpPerTurn: 1, desc: 'Restores HP each turn' },
  immunity: { desc: 'Immune to specific damage types' },
  hpBonus: { desc: 'Increases max HP' }
};

// 0.9.0 - Rarity color coding (matches ability/modifier colors from CSS)
const RARITY_COLORS = {
  common: '#a0a0a0',      // Gray
  uncommon: '#a78bfa',    // Purple (matches --rarity-uncommon)
  rare: '#fb923c',        // Orange
  veryrare: '#ef4444'     // Red - Legendary
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
  
  // Common armor
  { type: 'scrap_vest', weight: 3.5, rarity: 'common', desc: 'Makeshift protection', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'armor', subtype: 'scrap_vest', name: 'Scrap Vest', rarity: 'common', durability: 30, maxDurability: 30, defense: 1 }; 
    return tryAddAndReturn(item, '', ''); 
  }},
  { type: 'padded_suit', weight: 3, rarity: 'common', desc: 'Layered clothing', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'armor', subtype: 'padded_suit', name: 'Padded Suit', rarity: 'common', durability: 40, maxDurability: 40, defense: 2 }; 
    return tryAddAndReturn(item, '', ''); 
  }},
  
  // Common components
  { type: 'weaponPart', weight: 6.0, rarity: 'common', desc: 'Basic weapon components', onPickup: (s) => { const item = { id: s.nextItemId++, type: 'component', subtype: 'weaponPart', name: 'Weapon Part', rarity: 'common' }; return tryAddAndReturn(item, '', ''); } },
  
  // ===== UNCOMMON TIER (22% total weight - reduced from 30%) =====
  { type: 'tech', weight: 4.0, rarity: 'uncommon', desc: 'Sensitive electronics and processors', onPickup: (s) => { s.resources.tech += 1; return 'Tech component recovered.'; } },
  
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
  
  // Uncommon pistols
  { type: 'laser_pistol', weight: 1.5, rarity: 'uncommon', desc: 'Energy sidearm', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'weapon', subtype: 'laser_pistol', weaponType: 'pistol', name: 'Laser Pistol', rarity: 'uncommon', durability: 60, maxDurability: 60, damage: [6, 9], effects: ['burn:10'] }; 
    return tryAddAndReturn(item, '', ''); 
  }},
  { type: 'heavy_pistol', weight: 1.4, rarity: 'uncommon', desc: 'High-caliber stopping power', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'weapon', subtype: 'heavy_pistol', weaponType: 'pistol', name: 'Heavy Pistol', rarity: 'uncommon', durability: 55, maxDurability: 55, damage: [7, 10] }; 
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
  
  // Uncommon shotgun
  { type: 'pump_shotgun', weight: 1.2, rarity: 'uncommon', desc: 'Reliable close-range weapon', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'weapon', subtype: 'pump_shotgun', weaponType: 'shotgun', name: 'Pump Shotgun', rarity: 'uncommon', durability: 60, maxDurability: 60, damage: [7, 13] }; 
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
  
  // Uncommon components
  { type: 'armor_plating', weight: 2.2, rarity: 'uncommon', desc: 'Reinforcement material', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'component', subtype: 'armor_plating', name: 'Armor Plating', rarity: 'uncommon' }; 
    return tryAddAndReturn(item, '', ''); 
  }},
  { type: 'electronics', weight: 2.2, rarity: 'uncommon', desc: 'Circuit boards and chips', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'component', subtype: 'electronics', name: 'Electronics', rarity: 'uncommon' }; 
    return tryAddAndReturn(item, '', ''); 
  }},
  
  // Uncommon consumables
  { type: 'medkit', weight: 2.0, rarity: 'uncommon', desc: 'Field medkit (stabilizes wounds)', onPickup: (s) => { const item = { id: s.nextItemId++, type: 'medkit', name: 'Medkit', rarity: 'uncommon' }; return tryAddAndReturn(item, '', ''); } },
  { type: 'advanced_medkit', weight: 1.2, rarity: 'uncommon', desc: 'Superior medical supplies', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'consumable', subtype: 'advanced_medkit', name: 'Advanced Medkit', rarity: 'uncommon' }; 
    return tryAddAndReturn(item, '', ''); 
  }},
  { type: 'stimpack', weight: 1.0, rarity: 'uncommon', desc: 'Combat enhancer', onPickup: (s) => { 
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
  
  // Rare pistols
  { type: 'plasma_pistol', weight: 0.5, rarity: 'rare', desc: 'Advanced energy weapon', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'weapon', subtype: 'plasma_pistol', weaponType: 'pistol', name: 'Plasma Pistol', rarity: 'rare', durability: 90, maxDurability: 90, damage: [10, 13], effects: ['burn:15', 'armorPierce:25'] }; 
    return tryAddAndReturn(item, '', ''); 
  }},
  { type: 'smart_pistol', weight: 0.45, rarity: 'rare', desc: 'Auto-targeting system', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'weapon', subtype: 'smart_pistol', weaponType: 'pistol', name: 'Smart Pistol', rarity: 'rare', durability: 85, maxDurability: 85, damage: [8, 12], effects: ['accuracy:10'] }; 
    return tryAddAndReturn(item, '', ''); 
  }},
  
  // Rare rifles
  { type: 'pulse_rifle', weight: 0.55, rarity: 'rare', desc: 'Pulse Rifle components', onPickup: (s) => { const item = { id: s.nextItemId++, type: 'weapon', subtype: 'pulse_rifle', weaponType: 'rifle', name: 'Pulse Rifle', rarity: 'rare', durability: 100, maxDurability: 100, damage: [10, 13] }; return tryAddAndReturn(item, '', ''); } },
  { type: 'plasma_rifle', weight: 0.5, rarity: 'rare', desc: 'Energy-based assault weapon', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'weapon', subtype: 'plasma_rifle', weaponType: 'rifle', name: 'Plasma Rifle', rarity: 'rare', durability: 95, maxDurability: 95, damage: [11, 15], effects: ['burn:20'] }; 
    return tryAddAndReturn(item, '', ''); 
  }},
  
  // Rare shotguns
  { type: 'combat_shotgun', weight: 0.5, rarity: 'rare', desc: 'Combat Shotgun components', onPickup: (s) => { const item = { id: s.nextItemId++, type: 'weapon', subtype: 'combat_shotgun', weaponType: 'shotgun', name: 'Combat Shotgun', rarity: 'rare', durability: 80, maxDurability: 80, damage: [8, 15] }; return tryAddAndReturn(item, '', ''); } },
  { type: 'plasma_shotgun', weight: 0.45, rarity: 'rare', desc: 'Energy scatter weapon', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'weapon', subtype: 'plasma_shotgun', weaponType: 'shotgun', name: 'Plasma Shotgun', rarity: 'rare', durability: 85, maxDurability: 85, damage: [10, 17], effects: ['burn:25'] }; 
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
  { type: 'power_core', weight: 1.2, rarity: 'rare', desc: 'Compact fusion cell', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'component', subtype: 'power_core', name: 'Power Core', rarity: 'rare' }; 
    return tryAddAndReturn(item, '', ''); 
  }},
  { type: 'nano_material', weight: 1.1, rarity: 'rare', desc: 'Programmable matter', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'component', subtype: 'nano_material', name: 'Nano-Material', rarity: 'rare' }; 
    return tryAddAndReturn(item, '', ''); 
  }},
  { type: 'advanced_component', weight: 1.2, rarity: 'rare', desc: 'Rare crafting component', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'component', subtype: 'advanced_component', name: 'Advanced Component', rarity: 'rare' }; 
    return tryAddAndReturn(item, '', ''); 
  }},
  
  // Rare consumables
  { type: 'repair_kit', weight: 0.8, rarity: 'rare', desc: 'System maintenance tool', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'consumable', subtype: 'repair_kit', name: 'Repair Kit', rarity: 'rare' }; 
    return tryAddAndReturn(item, '', ''); 
  }},
  { type: 'combat_drug', weight: 0.6, rarity: 'rare', desc: 'High-risk enhancer', onPickup: (s) => { 
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
  
  // Legendary pistols
  { type: 'void_pistol', weight: 0.15, rarity: 'veryrare', desc: 'Exotic tech, bypasses defenses', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'weapon', subtype: 'void_pistol', weaponType: 'pistol', name: 'Void Pistol', rarity: 'veryrare', durability: 130, maxDurability: 130, damage: [13, 18], effects: ['phase:20'] }; 
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
  
  // Legendary shotguns
  { type: 'disintegrator_cannon', weight: 0.15, rarity: 'veryrare', desc: 'Molecular breakdown weapon', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'weapon', subtype: 'disintegrator_cannon', weaponType: 'shotgun', name: 'Disintegrator Cannon', rarity: 'veryrare', durability: 130, maxDurability: 130, damage: [13, 23], effects: ['armorPierce:40'] }; 
    return tryAddAndReturn(item, '', ''); 
  }},
  
  // Legendary heavy weapons
  { type: 'minigun', weight: 0.15, rarity: 'veryrare', desc: 'Continuous fire', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'weapon', subtype: 'minigun', weaponType: 'heavy', name: 'Minigun', rarity: 'veryrare', durability: 120, maxDurability: 120, damage: [12, 16], effects: ['burst:6'] }; 
    return tryAddAndReturn(item, '', ''); 
  }},
  { type: 'railgun', weight: 0.13, rarity: 'veryrare', desc: 'Devastating single-shot weapon', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'weapon', subtype: 'railgun', weaponType: 'heavy', name: 'Railgun', rarity: 'veryrare', durability: 150, maxDurability: 150, damage: [18, 25], effects: ['armorPierce:50'] }; 
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
  { type: 'void_suit', weight: 0.13, rarity: 'veryrare', desc: 'Reality-stable protection', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'armor', subtype: 'void_suit', name: 'Void Suit', rarity: 'veryrare', durability: 220, maxDurability: 220, defense: 4, effects: ['immunity:phase', 'exploration:20'] }; 
    return tryAddAndReturn(item, '', ''); 
  }},
  { type: 'regenerative_armor', weight: 0.13, rarity: 'veryrare', desc: 'Self-repairing nanites', onPickup: (s) => { 
    const item = { id: s.nextItemId++, type: 'armor', subtype: 'regenerative_armor', name: 'Regenerative Armor', rarity: 'veryrare', durability: 200, maxDurability: 200, defense: 5, effects: ['regen:1'] }; 
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
    special: 'armored', // Takes 50% less damage from all attacks
    specialDesc: 'Armored Carapace: Resistant to damage' },
  
  // Elite threats - Legendary
  { id: 'spectre', name: 'Spectre', hpRange: [14, 21], attackRange: [7, 13], armor: 2, rarity: 'legendary', stealth: 0.7,
    flavor: 'An elusive lifeform that strikes from darkness.',
    special: 'phase', // 40% chance to avoid all damage
    specialDesc: 'Evasive Phase: Frequently phases out of reality' },
  
  { id: 'queen', name: 'Hive Queen', hpRange: [40, 58], attackRange: [14, 23], armor: 7, rarity: 'legendary', stealth: 0,
    flavor: 'Massive apex predator. Commands the hive.',
    special: 'multistrike', // Attacks twice per turn
    specialDesc: 'Multi-Strike: Attacks twice each turn' }
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
    { id: 'alpha', name: 'Alpha', rarity: 'veryrare', chance: 0.01, effect: '+4 attack, +50% dodge', color: '#ef4444' }
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
    { id: 'hardened', name: 'Hardened', rarity: 'uncommon', chance: 0.06, effect: 'Take 60% less damage', color: '#a78bfa' },
    { id: 'crusher', name: 'Crusher', rarity: 'uncommon', chance: 0.05, effect: '+4 attack', color: '#a78bfa' },
    { id: 'unstoppable', name: 'Unstoppable', rarity: 'rare', chance: 0.03, effect: 'Immune to crits', color: '#fb923c' },
    { id: 'juggernaut', name: 'Juggernaut', rarity: 'rare', chance: 0.025, effect: '+8 HP, 20% chance to stun on hit', color: '#fb923c' },
    { id: 'colossus', name: 'Colossus', rarity: 'veryrare', chance: 0.01, effect: '70% resist, +6 attack, +12 HP', color: '#ef4444' }
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
    scrap: 85, 
    tech: 6,
    armor_plating: 1,
    electronics: 1,
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
      const item = { id: state.nextItemId++, type: 'weapon', subtype: 'nano_edge_katana', weaponType: 'melee', name: 'Nano-Edge Katana', rarity: 'veryrare', durability: 120, maxDurability: 120, damage: [15, 22], effects: ['crit:25', 'armorPierce:20'] };
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
      const item = { id: state.nextItemId++, type: 'weapon', subtype: 'void_pistol', weaponType: 'pistol', name: 'Void Pistol', rarity: 'veryrare', durability: 130, maxDurability: 130, damage: [16, 22], effects: ['phase:20'] };
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
      const item = { id: state.nextItemId++, type: 'weapon', subtype: 'gauss_rifle', weaponType: 'rifle', name: 'Gauss Rifle', rarity: 'veryrare', durability: 150, maxDurability: 150, damage: [18, 25], effects: ['armorPierce:30'] };
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
      const item = { id: state.nextItemId++, type: 'weapon', subtype: 'quantum_rifle', weaponType: 'rifle', name: 'Quantum Rifle', rarity: 'veryrare', durability: 140, maxDurability: 140, damage: [16, 23], effects: ['phase:25', 'accuracy:10'] };
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
      const item = { id: state.nextItemId++, type: 'weapon', subtype: 'disintegrator_cannon', weaponType: 'shotgun', name: 'Disintegrator Cannon', rarity: 'veryrare', durability: 130, maxDurability: 130, damage: [16, 28], effects: ['armorPierce:40'] };
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
      const item = { id: state.nextItemId++, type: 'weapon', subtype: 'minigun', weaponType: 'heavy', name: 'Minigun', rarity: 'veryrare', durability: 120, maxDurability: 120, damage: [14, 19], effects: ['burst:6'] };
      tryAddAndLog(item);
    }
  },
  railgun: {
    name: 'Railgun',
    scrap: 160,
    tech: 20,
    weaponPart: 4,
    advanced_component: 3,
    power_core: 2,
    rarity: 'veryrare',
    result: () => {
      const item = { id: state.nextItemId++, type: 'weapon', subtype: 'railgun', weaponType: 'heavy', name: 'Railgun', rarity: 'veryrare', durability: 150, maxDurability: 150, damage: [22, 30], effects: ['armorPierce:50'] };
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
      const item = { id: state.nextItemId++, type: 'armor', subtype: 'nano_weave_armor', name: 'Nano-Weave Armor', rarity: 'veryrare', durability: 200, maxDurability: 200, defense: 6, effects: ['dodge:15', 'crit:5'] };
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
      const item = { id: state.nextItemId++, type: 'armor', subtype: 'shield_suit', name: 'Shield Suit', rarity: 'veryrare', durability: 250, maxDurability: 250, defense: 8, effects: ['reflect:20'] };
      tryAddAndLog(item);
    }
  },
  void_suit: {
    name: 'Void Suit',
    scrap: 135,
    tech: 18,
    armor_plating: 3,
    advanced_component: 2,
    quantum_core: 1,
    rarity: 'veryrare',
    result: () => {
      const item = { id: state.nextItemId++, type: 'armor', subtype: 'void_suit', name: 'Void Suit', rarity: 'veryrare', durability: 220, maxDurability: 220, defense: 5, effects: ['immunity:phase', 'exploration:20'] };
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
      const item = { id: state.nextItemId++, type: 'armor', subtype: 'regenerative_armor', name: 'Regenerative Armor', rarity: 'veryrare', durability: 200, maxDurability: 200, defense: 6, effects: ['regen:1'] };
      tryAddAndLog(item);
    }
  }
};

const TASKS = ['Idle', 'Oxygen', 'Food', 'Energy', 'Scrap', 'Guard'];
