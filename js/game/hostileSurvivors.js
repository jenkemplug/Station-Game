// 1.0 - Hostile Survivor System
// Procedurally generate human NPC enemies with AI

// Generate a hostile survivor with threat-scaled gear and abilities
function generateHostileSurvivor() {
  const threat = state.threat;
  
  // Determine rarity based on threat (progressive scaling)
  // 0-25% threat: mostly common, some uncommon
  // 25-50%: common/uncommon mix
  // 50-75%: uncommon/rare mix
  // 75-100%: rare/legendary mix
  let rarity = 'common';
  const rarityRoll = Math.random() * 100;
  
  if (threat < 25) {
    // Early game: 70% common, 30% uncommon
    rarity = rarityRoll < 70 ? 'common' : 'uncommon';
  } else if (threat < 50) {
    // Mid-early: 40% common, 50% uncommon, 10% rare
    if (rarityRoll < 40) rarity = 'common';
    else if (rarityRoll < 90) rarity = 'uncommon';
    else rarity = 'rare';
  } else if (threat < 75) {
    // Mid-late: 20% uncommon, 60% rare, 20% veryrare
    if (rarityRoll < 20) rarity = 'uncommon';
    else if (rarityRoll < 80) rarity = 'rare';
    else rarity = 'veryrare';
  } else {
    // Late game: 40% rare, 60% veryrare
    rarity = rarityRoll < 40 ? 'rare' : 'veryrare';
  }
  
  // Pick random class
  const classes = ['Soldier', 'Medic', 'Engineer', 'Scout', 'Technician', 'Scientist', 'Guardian', 'Scavenger'];
  const survivorClass = classes[Math.floor(Math.random() * classes.length)];
  
  // Level scales with threat (1-12)
  const level = Math.min(12, Math.max(1, Math.floor(1 + (threat / 100) * 11)));
  
  // Generate base stats
  const baseHp = 20;
  const hpPerLevel = 5;
  const maxHp = baseHp + (level - 1) * hpPerLevel;
  
  // Generate class bonuses (similar to player survivors)
  const classBonuses = generateClassBonuses(survivorClass);
  
  // Generate abilities based on rarity
  const abilities = generateAbilitiesForRarity(survivorClass, rarity);
  
  // Generate equipment based on rarity and threat
  const equipment = generateHostileEquipment(rarity, threat);
  
  // Generate consumables (higher threat = more consumables)
  const inventory = generateHostileInventory(threat);
  
  // Generate hostile name
  const hostileName = getHostileName();
  
  return {
    id: state.nextSurvivorId++,
    name: hostileName,
    class: survivorClass,
    level,
    hp: maxHp,
    maxHp,
    xp: 0,
    nextXp: 100,
    morale: 100,
    task: 'hostile',
    equipment,
    classBonuses,
    abilities,
    inventory,
    rarity,
    isHostile: true,
    downed: false
  };
}

// Generate class bonuses for hostile (same ranges as friendly survivors)
function generateClassBonuses(survivorClass) {
  const bonuses = {};
  
  switch (survivorClass) {
    case 'Soldier':
      bonuses.combat = 1 + (Math.random() * 0.10 + 0.10); // 1.10-1.20
      bonuses.hp = Math.floor(Math.random() * 5 + 4); // +4-8 HP
      bonuses.defense = Math.floor(Math.random() * 3 + 2); // +2-4 defense
      break;
    case 'Medic':
      bonuses.healing = 1 + (Math.random() * 0.10 + 0.25); // 1.25-1.35
      bonuses.survival = 1 + (Math.random() * 0.10 + 0.05); // 1.05-1.15
      break;
    case 'Engineer':
      bonuses.production = 1 + (Math.random() * 0.15 + 0.15); // 1.15-1.30
      bonuses.repairCost = 1 - (Math.random() * 0.10 + 0.15); // 0.75-0.85
      break;
    case 'Scout':
      bonuses.exploration = 1 - (Math.random() * 0.10 + 0.10); // 0.80-0.90
      bonuses.dodge = Math.random() * 0.10 + 0.15; // +15-25%
      bonuses.retreat = Math.random() * 0.10 + 0.20; // +20-30%
      break;
    case 'Technician':
      bonuses.craftingCost = 1 - (Math.random() * 0.10 + 0.10); // 0.80-0.90
      bonuses.durability = 1 + (Math.random() * 0.10 + 0.15); // 1.15-1.25
      bonuses.tech = 1 + (Math.random() * 0.10 + 0.10); // 1.10-1.20
      break;
    case 'Scientist':
      bonuses.xp = 1 + (Math.random() * 0.15 + 0.15); // 1.15-1.30
      bonuses.analysis = Math.random() * 0.10 + 0.15; // +15-25%
      break;
    case 'Guardian':
      bonuses.defense = Math.floor(Math.random() * 4 + 3); // +3-6 defense
      bonuses.morale = 1 + (Math.random() * 0.05 + 0.05); // 1.05-1.10
      break;
    case 'Scavenger':
      bonuses.lootQuality = Math.random() * 0.10 + 0.15; // +15-25%
      bonuses.scrap = 1 + (Math.random() * 0.10 + 0.20); // 1.20-1.30
      break;
  }
  
  return bonuses;
}

// Generate abilities based on rarity tier
function generateAbilitiesForRarity(survivorClass, rarity) {
  const abilities = [];
  
  // Get abilities for this class from SPECIAL_ABILITIES
  const classKey = survivorClass.toLowerCase();
  const classAbilities = SPECIAL_ABILITIES[classKey] || [];
  
  let abilityCount = 0;
  if (rarity === 'uncommon') abilityCount = 1;
  else if (rarity === 'rare') abilityCount = 2;
  else if (rarity === 'legendary') abilityCount = 3;
  
  // Pick random abilities from class pool
  const shuffled = [...classAbilities].sort(() => Math.random() - 0.5);
  for (let i = 0; i < Math.min(abilityCount, shuffled.length); i++) {
    abilities.push(shuffled[i].id);
  }
  
  return abilities;
}

// Generate equipment scaled by rarity and threat
function generateHostileEquipment(rarity, threat) {
  const equipment = { weapon: null, armor: null };
  
  // COMPLETE weapon pools by rarity - ALL CRAFTABLE weapons from RECIPES
  const weaponsByRarity = {
    common: [
      // Melee (4)
      { subtype: 'makeshift_pipe', weaponType: 'melee', name: 'Makeshift Pipe', damage: [2, 3], maxDurability: 15 },
      { subtype: 'sharpened_tool', weaponType: 'melee', name: 'Sharpened Tool', damage: [3, 5], maxDurability: 20 },
      { subtype: 'crowbar', weaponType: 'melee', name: 'Crowbar', damage: [4, 6], maxDurability: 25 },
      { subtype: 'steel_pipe', weaponType: 'melee', name: 'Steel Pipe', damage: [3, 4], maxDurability: 18 },
      // Pistol (4)
      { subtype: 'scrap_pistol', weaponType: 'pistol', name: 'Scrap Pistol', damage: [4, 5], maxDurability: 30 },
      { subtype: 'old_revolver', weaponType: 'pistol', name: 'Old Revolver', damage: [5, 6], maxDurability: 35 },
      { subtype: 'jury_rigged_pistol', weaponType: 'pistol', name: 'Jury-Rigged Pistol', damage: [3, 5], maxDurability: 25 },
      { subtype: 'homemade_handgun', weaponType: 'pistol', name: 'Homemade Handgun', damage: [4, 5], maxDurability: 28 }
    ],
    uncommon: [
      // Melee (4)
      { subtype: 'combat_knife', weaponType: 'melee', name: 'Combat Knife', damage: [4, 7], maxDurability: 40 },
      { subtype: 'stun_baton', weaponType: 'melee', name: 'Stun Baton', damage: [5, 8], maxDurability: 50, effects: ['stun:10'] },
      { subtype: 'reinforced_bat', weaponType: 'melee', name: 'Reinforced Bat', damage: [6, 9], maxDurability: 45 },
      { subtype: 'electro_spear', weaponType: 'melee', name: 'Electro-Spear', damage: [5, 10], maxDurability: 55, effects: ['stun:8'] },
      // Pistol (4)
      { subtype: 'laser_pistol', weaponType: 'pistol', name: 'Laser Pistol', damage: [6, 9], maxDurability: 60, effects: ['burn:10'] },
      { subtype: 'heavy_pistol', weaponType: 'pistol', name: 'Heavy Pistol', damage: [7, 10], maxDurability: 55 },
      { subtype: 'burst_pistol', weaponType: 'pistol', name: 'Burst Pistol', damage: [6, 10], maxDurability: 58, effects: ['burst:2'] },
      { subtype: 'needle_pistol', weaponType: 'pistol', name: 'Needle Pistol', damage: [7, 9], maxDurability: 62, effects: ['armorPierce:10'] },
      // Rifle (4)
      { subtype: 'assault_rifle', weaponType: 'rifle', name: 'Assault Rifle', damage: [8, 11], maxDurability: 70, effects: ['burst:3'] },
      { subtype: 'scoped_rifle', weaponType: 'rifle', name: 'Scoped Rifle', damage: [9, 12], maxDurability: 75, effects: ['crit:15'] },
      { subtype: 'battle_rifle', weaponType: 'rifle', name: 'Battle Rifle', damage: [7, 11], maxDurability: 68 },
      { subtype: 'carbine', weaponType: 'rifle', name: 'Carbine', damage: [8, 10], maxDurability: 65, effects: ['accuracy:5'] },
      // Shotgun (4)
      { subtype: 'pump_shotgun', weaponType: 'shotgun', name: 'Pump Shotgun', damage: [7, 13], maxDurability: 60 },
      { subtype: 'auto_shotgun', weaponType: 'shotgun', name: 'Auto Shotgun', damage: [7, 12], maxDurability: 58, effects: ['burst:2'] },
      { subtype: 'riot_shotgun', weaponType: 'shotgun', name: 'Riot Shotgun', damage: [8, 14], maxDurability: 62 },
      { subtype: 'tactical_shotgun', weaponType: 'shotgun', name: 'Tactical Shotgun', damage: [8, 13], maxDurability: 65, effects: ['crit:10'] }
    ],
    rare: [
      // Melee (4)
      { subtype: 'plasma_blade', weaponType: 'melee', name: 'Plasma Blade', damage: [8, 13], maxDurability: 80, effects: ['armorPierce:15'] },
      { subtype: 'shock_maul', weaponType: 'melee', name: 'Shock Maul', damage: [10, 13], maxDurability: 75, effects: ['stun:20'] },
      { subtype: 'vibro_axe', weaponType: 'melee', name: 'Vibro-Axe', damage: [9, 14], maxDurability: 85, effects: ['armorPierce:20', 'crit:10'] },
      { subtype: 'power_fist', weaponType: 'melee', name: 'Power Fist', damage: [11, 15], maxDurability: 90 },
      // Pistol (4)
      { subtype: 'plasma_pistol', weaponType: 'pistol', name: 'Plasma Pistol', damage: [10, 13], maxDurability: 90, effects: ['burn:15', 'armorPierce:25'] },
      { subtype: 'smart_pistol', weaponType: 'pistol', name: 'Smart Pistol', damage: [8, 12], maxDurability: 85, effects: ['accuracy:10'] },
      { subtype: 'mag_pistol', weaponType: 'pistol', name: 'Mag Pistol', damage: [9, 11], maxDurability: 80 },
      { subtype: 'arc_pistol', weaponType: 'pistol', name: 'Arc Pistol', damage: [9, 12], maxDurability: 85, effects: ['stun:15'] },
      // Rifle (4)
      { subtype: 'pulse_rifle', weaponType: 'rifle', name: 'Pulse Rifle', damage: [10, 13], maxDurability: 100 },
      { subtype: 'plasma_rifle', weaponType: 'rifle', name: 'Plasma Rifle', damage: [11, 15], maxDurability: 95, effects: ['burn:20'] },
      { subtype: 'laser_rifle', weaponType: 'rifle', name: 'Laser Rifle', damage: [9, 14], maxDurability: 90, effects: ['burn:15', 'accuracy:5'] },
      { subtype: 'marksman_rifle', weaponType: 'rifle', name: 'Marksman Rifle', damage: [10, 15], maxDurability: 100, effects: ['crit:20'] },
      // Shotgun (4)
      { subtype: 'combat_shotgun', weaponType: 'shotgun', name: 'Combat Shotgun', damage: [8, 15], maxDurability: 80 },
      { subtype: 'plasma_shotgun', weaponType: 'shotgun', name: 'Plasma Shotgun', damage: [10, 17], maxDurability: 85, effects: ['burn:25'] },
      { subtype: 'arc_shotgun', weaponType: 'shotgun', name: 'Arc Shotgun', damage: [9, 16], maxDurability: 80, effects: ['stun:20'] },
      { subtype: 'flechette_cannon', weaponType: 'shotgun', name: 'Flechette Cannon', damage: [11, 18], maxDurability: 90, effects: ['armorPierce:30'] },
      // Heavy (4)
      { subtype: 'light_machine_gun', weaponType: 'heavy', name: 'Light Machine Gun', damage: [11, 14], maxDurability: 90, effects: ['burst:4'] },
      { subtype: 'grenade_launcher', weaponType: 'heavy', name: 'Grenade Launcher', damage: [15, 20], maxDurability: 70, effects: ['splash:50'] },
      { subtype: 'plasma_cannon', weaponType: 'heavy', name: 'Plasma Cannon', damage: [13, 18], maxDurability: 95, effects: ['burn:30', 'splash:20'] },
      { subtype: 'missile_pod', weaponType: 'heavy', name: 'Missile Pod', damage: [14, 19], maxDurability: 85, effects: ['splash:40', 'burst:1'] }
    ],
    veryrare: [
      // Melee (4)
      { subtype: 'nano_edge_katana', weaponType: 'melee', name: 'Nano-Edge Katana', damage: [12, 18], maxDurability: 120, effects: ['crit:25', 'armorPierce:20'] },
      { subtype: 'venom_blade', weaponType: 'melee', name: 'Venom Blade', damage: [14, 20], maxDurability: 120, effects: ['poison:30'] },
      { subtype: 'void_reaper', weaponType: 'melee', name: 'Void Reaper', damage: [13, 21], maxDurability: 130, effects: ['phase:15', 'armorPierce:25'] },
      { subtype: 'thunder_hammer', weaponType: 'melee', name: 'Thunder Hammer', damage: [15, 22], maxDurability: 140, effects: ['stun:30', 'splash:20'] },
      // Pistol (4)
      { subtype: 'void_pistol', weaponType: 'pistol', name: 'Void Pistol', damage: [13, 18], maxDurability: 130, effects: ['phase:20'] },
      { subtype: 'annihilator_pistol', weaponType: 'pistol', name: 'Annihilator Pistol', damage: [12, 17], maxDurability: 125, effects: ['armorPierce:30', 'crit:10'] },
      { subtype: 'hurricane_pistol', weaponType: 'pistol', name: 'Hurricane Pistol', damage: [11, 16], maxDurability: 120, effects: ['burst:3'] },
      { subtype: 'executioner_revolver', weaponType: 'pistol', name: 'Executioner Revolver', damage: [14, 19], maxDurability: 135, effects: ['crit:25'] },
      // Rifle (4)
      { subtype: 'gauss_rifle', weaponType: 'rifle', name: 'Gauss Rifle', damage: [15, 21], maxDurability: 150, effects: ['armorPierce:30'] },
      { subtype: 'quantum_rifle', weaponType: 'rifle', name: 'Quantum Rifle', damage: [13, 19], maxDurability: 140, effects: ['phase:25', 'accuracy:10'] },
      { subtype: 'antimatter_rifle', weaponType: 'rifle', name: 'Antimatter Rifle', damage: [14, 20], maxDurability: 145, effects: ['splash:30'] },
      { subtype: 'railgun', weaponType: 'rifle', name: 'Railgun', damage: [16, 20], maxDurability: 155, effects: ['armorPierce:35', 'crit:15'] },
      // Shotgun (4)
      { subtype: 'disintegrator_cannon', weaponType: 'shotgun', name: 'Disintegrator Cannon', damage: [13, 23], maxDurability: 130, effects: ['armorPierce:40'] },
      { subtype: 'void_scattergun', weaponType: 'shotgun', name: 'Void Scattergun', damage: [12, 21], maxDurability: 135, effects: ['phase:20', 'splash:15'] },
      { subtype: 'inferno_blaster', weaponType: 'shotgun', name: 'Inferno Blaster', damage: [14, 22], maxDurability: 140, effects: ['burn:40', 'splash:25'] },
      { subtype: 'shredder_cannon', weaponType: 'shotgun', name: 'Shredder Cannon', damage: [15, 24], maxDurability: 145, effects: ['armorPierce:35', 'burst:2'] },
      // Heavy (4)
      { subtype: 'minigun', weaponType: 'heavy', name: 'Minigun', damage: [10, 14], maxDurability: 120, effects: ['burst:5'] },
      { subtype: 'venom_cannon', weaponType: 'heavy', name: 'Venom Cannon', damage: [16, 23], maxDurability: 150, effects: ['poison:40', 'splash:25'] },
      { subtype: 'flamethrower', weaponType: 'heavy', name: 'Flamethrower', damage: [14, 22], maxDurability: 140, effects: ['burn:50', 'splash:30'] },
      { subtype: 'storm_cannon', weaponType: 'heavy', name: 'Storm Cannon', damage: [12, 20], maxDurability: 135, effects: ['stun:35', 'splash:35', 'burst:2'] }
    ]
  };
  
  // COMPLETE armor pools by rarity - ALL CRAFTABLE armor from RECIPES
  const armorsByRarity = {
    common: [
      { subtype: 'scrap_vest', name: 'Scrap Vest', defense: 1, maxDurability: 30 },
      { subtype: 'padded_suit', name: 'Padded Suit', defense: 2, maxDurability: 40 },
      { subtype: 'work_gear', name: 'Work Gear', defense: 2, maxDurability: 35 },
      { subtype: 'leather_jacket', name: 'Leather Jacket', defense: 2, maxDurability: 38 }
    ],
    uncommon: [
      { subtype: 'light_armor', name: 'Light Armor', defense: 3, maxDurability: 100 },
      { subtype: 'tactical_vest', name: 'Tactical Vest', defense: 3, maxDurability: 90, effects: ['dodge:5'] },
      { subtype: 'reinforced_plating', name: 'Reinforced Plating', defense: 3, maxDurability: 120 },
      { subtype: 'ballistic_vest', name: 'Ballistic Vest', defense: 3, maxDurability: 110 }
    ],
    rare: [
      { subtype: 'composite_armor', name: 'Composite Armor', defense: 4, maxDurability: 140, effects: ['dodge:10'] },
      { subtype: 'stealth_suit', name: 'Stealth Suit', defense: 4, maxDurability: 120, effects: ['dodge:15', 'retreat:10'] },
      { subtype: 'power_armor_frame', name: 'Power Armor Frame', defense: 6, maxDurability: 180, effects: ['hpBonus:10'] },
      { subtype: 'heavy_armor', name: 'Heavy Armor', defense: 5, maxDurability: 200 },
      { subtype: 'hazmat_suit', name: 'Hazmat Suit', defense: 4, maxDurability: 150 },
      { subtype: 'thermal_suit', name: 'Thermal Suit', defense: 4, maxDurability: 130, effects: ['immunity:burn'] }
    ],
    veryrare: [
      { subtype: 'nano_weave_armor', name: 'Nano-Weave Armor', defense: 5, maxDurability: 200, effects: ['dodge:15', 'crit:5'] },
      { subtype: 'titan_armor', name: 'Titan Armor', defense: 7, maxDurability: 280, effects: ['hpBonus:15'] },
      { subtype: 'shield_suit', name: 'Shield Suit', defense: 6, maxDurability: 250, effects: ['reflect:20'] },
      { subtype: 'regenerative_armor', name: 'Regenerative Armor', defense: 5, maxDurability: 200, effects: ['regen:5'] },
      { subtype: 'spectre_armor', name: 'Spectre Armor', defense: 6, maxDurability: 240, effects: ['phase:40'] }
    ]
  };
  
  // Pick random weapon from rarity pool
  const weaponPool = weaponsByRarity[rarity] || weaponsByRarity.common;
  if (weaponPool.length > 0) {
    const template = weaponPool[Math.floor(Math.random() * weaponPool.length)];
    equipment.weapon = {
      id: state.nextItemId++,
      type: 'weapon',
      subtype: template.subtype,
      weaponType: template.weaponType,
      name: template.name,
      rarity: rarity,
      damage: template.damage,
      durability: template.maxDurability,
      maxDurability: template.maxDurability,
      effects: template.effects || []
    };
  }
  
  // Pick random armor from rarity pool
  const armorPool = armorsByRarity[rarity] || armorsByRarity.common;
  if (armorPool.length > 0) {
    const template = armorPool[Math.floor(Math.random() * armorPool.length)];
    equipment.armor = {
      id: state.nextItemId++,
      type: 'armor',
      subtype: template.subtype,
      name: template.name,
      rarity: rarity,
      defense: template.defense,
      durability: template.maxDurability,
      maxDurability: template.maxDurability,
      effects: template.effects || []
    };
  }
  
  return equipment;
}

// Generate consumables based on threat level
function generateHostileInventory(threat) {
  const inventory = [];
  
  // Chance of having each consumable type increases with threat
  // Reduced chances: not every hostile should have consumables
  const medkitChance = Math.min(0.50, 0.15 + (threat / 100) * 0.35); // 15% early → 50% late
  const stimpackChance = Math.min(0.30, 0.05 + (threat / 100) * 0.25); // 5% early → 30% late
  const stunGrenadeChance = Math.min(0.25, 0.02 + (threat / 100) * 0.23); // 2% early → 25% late
  const combatDrugChance = Math.min(0.20, 0.01 + (threat / 100) * 0.19); // 1% early → 20% late
  
  if (Math.random() < medkitChance) {
    inventory.push({
      id: state.nextItemId++,
      type: threat > 50 ? 'advanced_medkit' : 'medkit',
      name: threat > 50 ? 'Advanced Medkit' : 'Medkit',
      rarity: threat > 50 ? 'rare' : 'uncommon'
    });
  }
  
  if (Math.random() < stimpackChance) {
    inventory.push({
      id: state.nextItemId++,
      type: 'stimpack',
      name: 'Stimpack',
      rarity: 'uncommon'
    });
  }
  
  if (Math.random() < stunGrenadeChance) {
    inventory.push({
      id: state.nextItemId++,
      type: 'stun_grenade',
      name: 'Stun Grenade',
      rarity: 'uncommon'
    });
  }
  
  if (Math.random() < combatDrugChance) {
    inventory.push({
      id: state.nextItemId++,
      type: 'combat_drug',
      name: 'Combat Drug',
      rarity: 'rare'
    });
  }
  
  return inventory;
}

// Generate hostile survivor names
function getHostileName() {
  const prefixes = ['Hostile', 'Rogue', 'Feral', 'Mad', 'Deranged', 'Desperate', 'Outlaw', 'Raider'];
  const names = ['Survivor', 'Scavenger', 'Marauder', 'Looter', 'Wastelander', 'Exile', 'Outcast'];
  
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const name = names[Math.floor(Math.random() * names.length)];
  
  return `${prefix} ${name}`;
}
