const VERSION = '0.8.13';
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
  // 0.8.1 - Normalized to uniform 15 energy to prevent revealing tile types
  TILE_ENERGY_COST: {
    hazard: 15,
    alien: 15,
    resource: 15,
    module: 15,
    survivor: 15,
    empty: 15
  },
  SURVIVOR_RECRUIT_CHANCE: 0.85,
  HAZARD_DURABILITY_LOSS: [12, 20],
  HAZARD_LOOT_ROLLS: 3,

  // Resource consumption (per tick)
  O2_BASE: 0.15,
  O2_PER_SURVIVOR: 0.35,
  FOOD_BASE: 0.1, // 0.8.13 - Increased from 0.05
  FOOD_PER_SURVIVOR: 0.2, // 0.8.13 - Adjusted from 0.18
  
  // Critical state thresholds
  OXY_CRITICAL_THRESHOLD: 10,
  OXY_DAMAGE_RANGE: [2, 4],
  INTEGRITY_DAMAGE_OXY_CRIT: 0.1,
  MORALE_LOSS_OXY_CRIT: 0.4,
  MORALE_LOSS_ASPHYXIA: 0.6,
  MORALE_LOSS_STARVATION: 0.25,
  STARVATION_CHANCE: 0.07,
  
  // 0.8.10 - Gameplay rebalance
  OXYGEN_PENALTY_NO_ENERGY: 0.1, // Oxygen production is only 10% effective without energy
  MAX_GUARDS: 4,                 // Max number of survivors that can be assigned to Guard duty
  MAX_TURRETS: 5,                // Max number of turrets that can be built
  
  // 0.8.9 - Tiered threshold system: reaching milestones creates permanent floors
  // Threat tiers: Once you hit a tier, you can't go below it (high water marks)
  THREAT_TIERS: [0, 20, 40, 60, 80],  // 0% → 20% → 40% → 60% → 80% floors
  THREAT_GROWTH_BASE: 0.055,          // Increased from 0.035 to ensure progression
  THREAT_GROWTH_RAND: 0.055,          // Increased from 0.045
  GUARD_THREAT_REDUCTION: 0.09,       // Slightly increased from 0.08 but won't prevent tier progression
  
  // Raid chance tiers: Once you hit a tier, base raid chance can't go below it
  RAID_TIERS: [0, 0.015, 0.035, 0.055, 0.080],  // 0% → 1.5% → 3.5% → 5.5% → 8% floors per minute
  BOARD_RISK_DIVISOR: 120,
  BOARD_RISK_BASE_NO_TURRET: 0.05,
  // Per-minute baseline chance; tuned for early-mid-late progression
  RAID_BASE_CHANCE: 0.0030,  // Increased from 0.0025 to ensure progression
  RAID_THREAT_DIVISOR: 2200, // Reduced from 2500 (threat contributes more)
  RAID_MAX_CHANCE: 0.15,     // Increased from 0.12 to allow higher late-game pressure
  // 0.8.9 - Defense slightly more effective but won't prevent tier progression
  RAID_CHANCE_REDUCTION_PER_GUARD: 0.0022,   // Slightly increased from 0.0020
  RAID_CHANCE_REDUCTION_PER_TURRET: 0.0018,  // Slightly increased from 0.0015
  RAID_DEFENSE_SOFTCAP: 0.07,                // Increased from 0.06 to 7% max reduction
  // 0.8.9 - Exploration and combat pressure increased to overcome defenses
  RAID_CHANCE_PER_TILE: 0.00040,      // Increased from 0.00035
  RAID_CHANCE_PER_ALIEN_KILL: 0.0025, // Increased from 0.0020
  // 0.8.9 - Expedition failure consequences
  EXPEDITION_FAILURE_THREAT_GAIN: [3, 6],   // Threat increase on failed expedition
  EXPEDITION_FAILURE_RAID_PRESSURE: 0.015,  // +1.5% temporary raid pressure on failure
  // 0.7.3 – Raid cooldown to keep raids impactful and infrequent
  RAID_MIN_INTERVAL_SEC: 900,  // 15 minutes
  RAID_MAX_INTERVAL_SEC: 1800, // 30 minutes
  TURRET_POWER_PER: 15,
  RAID_ATTACK_RANGE: [6, 28],
  THREAT_REDUCE_ON_REPEL: 4,
  INTEGRITY_DAMAGE_ON_BREACH: [3, 10],
  NEST_CHANCE_AFTER_BREACH: 0.20,
  CASUALTY_CHANCE: 0.10,
  THREAT_GAIN_PER_ALIEN: [1, 2],
  NEST_CHANCE_NO_DEFEND: 0.30,
  
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
  PROD_MULT: 1.15,
  SYSTEM_FILTER_MULT: 1.3,
  SYSTEM_GENERATOR_MULT: 1.2,
  SURVIVOR_PROD: {
    Oxygen: { base: 1.1, perSkill: 0.06 },  // 0.8.6 - Boosted from 0.9/0.05
    Food: { base: 0.9, perSkill: 0.04 },    // 0.8.6 - Boosted from 0.7/0.03
    Energy: { base: 0.7, perSkill: 0.04 },
    Scrap: { base: 0.6, perSkill: 0.03 },
    IdleOxygen: 0.04,
    FoodYieldFactor: 0.95, // 0.8.11 - Increased from 0.6 to make food ~15% worse than oxygen
    // 0.8.8 - Energy consumption rebalanced to per-survivor basis
    PassiveEnergyDrainPerSurvivor: 0.18,  // Base energy per survivor
    PassiveEnergyDrainPerTurret: 0.05,    // Turret energy cost (increased from 0.03)
    PassiveEnergyDrainPerFilterLevel: 0.08 // Filter energy cost per upgrade level
  },
  LEVEL_PRODUCTION_BONUS: 0.05,
  LEVEL_ATTACK_BONUS: 0.5,
  
  // Combat
  AMMO_CONSUME_CHANCE: 0.6,
  
  // Economy & upgrades
  BASE_RECRUIT_COST: 15,
  EXPLORED_DISCOUNT_MAX: 0.4,
  REPAIR_COST_PER_POINT: 0.5,
  UPGRADE_COSTS: {
    filter: { base: 50, perLevel: 25 },
    generator: { base: 45, perLevel: 22 },
    turret: { scrap: 80, energy: 40 }
  },
  // 0.8.0 - System repair costs after failures
  REPAIR_COSTS: {
    filter: { scrap: 30, energy: 12 },
    generator: { scrap: 25, energy: 18 },
    turret: { scrap: 40, energy: 25 }
  }
};

const LOOT_TABLE = [
  { type: 'junk', weight: 50, rarity: 'common', desc: 'Scrap wiring and bent conduits', onPickup: (s) => { s.resources.scrap += rand(2, 8); return 'Scrap salvaged.'; } },
  { type: 'foodpack', weight: 20, rarity: 'common', desc: 'Sealed ration pack', onPickup: (s) => { s.resources.food += rand(4, 12); return 'Recovered food supplies.'; } },
  { type: 'medkit', weight: 10, rarity: 'uncommon', desc: 'Field medkit (stabilizes wounds)', onPickup: (s) => { const item = { id: s.nextItemId++, type: 'medkit', name: 'Medkit', rarity: 'uncommon' }; return tryAddToInventory(item) ? 'Medkit added to inventory.' : 'Inventory full - medkit left behind.'; } },
  { type: 'tech', weight: 8, rarity: 'uncommon', desc: 'Sensitive electronics and processors', onPickup: (s) => { s.resources.tech += 1; return 'Tech component recovered.'; } },
  { type: 'weaponPart', weight: 6, rarity: 'uncommon', desc: 'Pulse emitter module', onPickup: (s) => { const item = { id: s.nextItemId++, type: 'weaponPart', name: 'Weapon Part', rarity: 'uncommon' }; return tryAddToInventory(item) ? 'Weapon part recovered.' : 'Inventory full - weapon part left behind.'; } },
  { type: 'ammo', weight: 12, rarity: 'common', desc: 'Rounded energy cells', onPickup: (s) => { s.resources.ammo += rand(3, 8); return 'Ammo recovered.'; } },
  { type: 'armor', weight: 4, rarity: 'rare', desc: 'Light Armor plating', onPickup: (s) => { const item = { id: s.nextItemId++, type: 'armor', name: 'Light Armor', rarity: 'rare', durability: 100, maxDurability: 100 }; return tryAddToInventory(item) ? 'Light Armor recovered.' : 'Inventory full - armor left behind.'; } },
  { type: 'rifle', weight: 2, rarity: 'rare', desc: 'Pulse Rifle components', onPickup: (s) => { const item = { id: s.nextItemId++, type: 'rifle', name: 'Pulse Rifle', rarity: 'rare', durability: 100, maxDurability: 100 }; return tryAddToInventory(item) ? 'Pulse Rifle recovered.' : 'Inventory full - rifle left behind.'; } },
  { type: 'heavyArmor', weight: 1, rarity: 'veryrare', desc: 'Heavy Armor plating', onPickup: (s) => { const item = { id: s.nextItemId++, type: 'heavyArmor', name: 'Heavy Armor', rarity: 'veryrare', durability: 200, maxDurability: 200 }; return tryAddToInventory(item) ? 'Heavy Armor recovered.' : 'Inventory full - heavy armor left behind.'; } },
  { type: 'shotgun', weight: 2, rarity: 'rare', desc: 'Shotgun components', onPickup: (s) => { const item = { id: s.nextItemId++, type: 'shotgun', name: 'Shotgun', rarity: 'rare', durability: 80, maxDurability: 80 }; return tryAddToInventory(item) ? 'Shotgun recovered.' : 'Inventory full - shotgun left behind.'; } },
  { type: 'hazmatSuit', weight: 0.1, rarity: 'veryrare', desc: 'A hazmat suit', onPickup: (s) => { const item = { id: s.nextItemId++, type: 'hazmatSuit', name: 'Hazmat Suit', rarity: 'veryrare', durability: 150, maxDurability: 150 }; return tryAddToInventory(item) ? 'Hazmat Suit recovered.' : 'Inventory full - hazmat suit left behind.'; } }
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

// 0.8.10 - Survivor Classes (8 classes) with bonus ranges
const SURVIVOR_CLASSES = [
  { 
    id: 'soldier', 
    name: 'Soldier', 
    desc: 'Combat specialist: +10% hit, +15% crit, bonus damage and defense',
    bonuses: { 
      combat: [1.10, 1.20],  // +10-20% damage
      hp: [4, 8],            // +4-8 HP
      defense: [2, 4]        // +2-4 defense
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
    { id: 'failsafe', name: 'Failsafe', rarity: 'rare', chance: 0.06, effect: 'Reduce system failure rate by 50%', color: '#fb923c' },
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
    { id: 'treasure', name: 'Treasure Hunter', rarity: 'rare', chance: 0.06, effect: 'Find rare items more often', color: '#fb923c' },
    { id: 'goldnose', name: 'Golden Nose', rarity: 'veryrare', chance: 0.03, effect: 'Double loot rolls, +50% quality', color: '#ef4444' }
  ]
};

// 0.8.0 - Alien Rare Modifiers (5 per type, uncommon to very rare)
const ALIEN_MODIFIERS = {
  drone: [
    { id: 'swift', name: 'Swift', rarity: 'uncommon', chance: 0.06, effect: '+30% dodge chance', color: '#a78bfa' },
    { id: 'aggressive', name: 'Aggressive', rarity: 'uncommon', chance: 0.05, effect: '+2 attack', color: '#a78bfa' },
    { id: 'resilient', name: 'Resilient', rarity: 'rare', chance: 0.03, effect: '+50% HP', color: '#fb923c' },
    { id: 'venomous', name: 'Venomous', rarity: 'rare', chance: 0.025, effect: 'Attacks poison (1 dmg/turn)', color: '#fb923c' },
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
    { id: 'corrosive', name: 'Hyper-Corrosive', rarity: 'uncommon', chance: 0.06, effect: 'Ignores 70% armor', color: '#a78bfa' },
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
    { id: 'juggernaut', name: 'Juggernaut', rarity: 'rare', chance: 0.025, effect: '+8 HP, knockback immunity', color: '#fb923c' },
    { id: 'colossus', name: 'Colossus', rarity: 'veryrare', chance: 0.01, effect: '70% resist, +6 attack, +12 HP', color: '#ef4444' }
  ],
  spectre: [
    { id: 'ethereal', name: 'Ethereal', rarity: 'uncommon', chance: 0.06, effect: '+10% phase chance', color: '#a78bfa' },
    { id: 'shadow', name: 'Shadow Form', rarity: 'uncommon', chance: 0.05, effect: 'Phase also dodges counters', color: '#a78bfa' },
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
  medkit: { scrap: 15, energy: 0, result: () => { 
    const item = { id: state.nextItemId++, type: 'medkit' }; 
    if (tryAddToInventory(item)) appendLog('Medkit crafted.'); 
  } },
  ammo: { scrap: 10, energy: 0, result: () => { state.resources.ammo += rand(4, 10); appendLog('Ammo manufactured.'); } },
  // 0.8.10 - Turret removed from crafting (redundant with Systems panel)
  armor: { name: 'Light Armor', scrap: 40, tech: 3, durability: 100, result: () => { 
    const item = { id: state.nextItemId++, type: 'armor', name: 'Light Armor', durability: 100, maxDurability: 100 }; 
    if (tryAddToInventory(item)) appendLog('Light Armor crafted.'); 
  } },
  rifle: { name: 'Pulse Rifle', scrap: 55, tech: 5, weaponPart: 1, durability: 100, result: () => { 
    const item = { id: state.nextItemId++, type: 'rifle', name: 'Pulse Rifle', durability: 100, maxDurability: 100 }; 
    if (tryAddToInventory(item)) appendLog('Pulse Rifle built.'); 
  } },
  heavyArmor: { name: 'Heavy Armor', scrap: 70, tech: 5, durability: 200, result: () => { 
    const item = { id: state.nextItemId++, type: 'heavyArmor', name: 'Heavy Armor', durability: 200, maxDurability: 200 }; 
    if (tryAddToInventory(item)) appendLog('Heavy Armor crafted.'); 
  } },
  shotgun: { name: 'Shotgun', scrap: 65, tech: 4, weaponPart: 1, durability: 80, result: () => { 
    const item = { id: state.nextItemId++, type: 'shotgun', name: 'Shotgun', durability: 80, maxDurability: 80 }; 
    if (tryAddToInventory(item)) appendLog('Shotgun built.'); 
  } },
  hazmatSuit: { name: 'Hazmat Suit', scrap: 85, tech: 6, durability: 150, result: () => { 
    const item = { id: state.nextItemId++, type: 'hazmatSuit', name: 'Hazmat Suit', durability: 150, maxDurability: 150 }; 
    if (tryAddToInventory(item)) appendLog('Hazmat Suit assembled.'); 
  } }
};

const TASKS = ['Idle', 'Oxygen', 'Food', 'Energy', 'Scrap', 'Guard'];
