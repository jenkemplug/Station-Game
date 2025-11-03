// Crafting System
// Handles item crafting, system upgrades, repair, and salvage

function craft(item) {
  const r = RECIPES[item];
  if (!r) {
    appendLog('Unknown recipe.');
    return;
  }
  
  // 0.8.11 - Technician class bonus: crafting cost reduction (additive stacking)
  let costReduction = 0; // Additive reduction (0.10 = 10% reduction)
  const technicians = state.survivors.filter(s => !s.onMission);
  
  // Apply all Technician class bonuses additively
  const techsWithBonus = technicians.filter(t => t.class === 'technician' && t.classBonuses && t.classBonuses.crafting);
  for (const tech of techsWithBonus) {
    costReduction += (1 - tech.classBonuses.crafting); // e.g., 0.85 -> 0.15 reduction
  }
  
  // 0.8.11 - Technician abilities reduce crafting costs (additive stacking)
  for (const t of technicians) {
    if (hasAbility(t, 'resourceful')) costReduction += 0.10; // -10% cost
    if (hasAbility(t, 'prodigy')) costReduction += 0.25; // -25% cost
  }
  
  const costMult = Math.max(0.1, 1 - costReduction); // Cap at 90% reduction
  const scrapCost = Math.ceil((r.scrap || 0) * costMult);
  const energyCost = Math.ceil((r.energy || 0) * costMult);
  const techCost = Math.ceil((r.tech || 0) * costMult);
  
  // 0.9.0 - Check for component items in inventory (not affected by cost reduction)
  const componentTypes = ['weaponPart', 'electronics', 'armor_plating', 'power_core', 'nano_material', 'advanced_component', 'quantum_core', 'alien_artifact'];
  const componentCosts = {};
  for (const compType of componentTypes) {
    componentCosts[compType] = r[compType] || 0;
  }
  
  // Count components in inventory
  const componentCounts = {};
  for (const compType of componentTypes) {
    componentCounts[compType] = state.inventory.filter(i => i.type === 'component' && i.subtype === compType).length;
  }

  // Check if we have enough resources and components
  if (state.resources.scrap < scrapCost || state.resources.energy < energyCost || state.resources.tech < techCost) {
    appendLog('Insufficient resources for ' + (r.name || item) + '.');
    return;
  }
  
  // Check components
  for (const compType of componentTypes) {
    if (componentCounts[compType] < componentCosts[compType]) {
      appendLog(`Insufficient components for ${r.name || item}. Need ${componentCosts[compType]} ${compType}.`);
      return;
    }
  }
  
  // 0.8.11 - Technician Recycler ability: 25% chance per Recycler to refund materials
  const recyclerCount = technicians.filter(t => hasAbility(t, 'recycler')).length;
  const refundChance = recyclerCount * 0.25; // 25% per Recycler, stacks
  if (recyclerCount > 0 && Math.random() < refundChance) {
    appendLog(`♻️ Recycler: Materials refunded! (${Math.floor(refundChance * 100)}% chance)`);
    // Skip resource consumption if refunded
  } else {
    // Consume components
    for (const compType of componentTypes) {
      for (let i = 0; i < componentCosts[compType]; i++) {
        const partIndex = state.inventory.findIndex(invItem => invItem.type === 'component' && invItem.subtype === compType);
        if (partIndex !== -1) {
          state.inventory.splice(partIndex, 1);
        }
      }
    }
    
    state.resources.scrap -= scrapCost;
    state.resources.energy -= energyCost;
    state.resources.tech -= techCost;
  }
  
  r.result();
  
  // 0.9.0 - Inventor: 30% chance to create Advanced Component when crafting equipment
  const engineers = state.survivors.filter(s => !s.onMission && s.class === 'engineer');
  const hasInventor = engineers.some(e => hasAbility(e, 'inventor'));
  const isEquipmentCraft = ['rifle', 'shotgun', 'armor', 'heavyArmor', 'hazmatSuit', 
    'combat_knife', 'stun_baton', 'reinforced_bat', 'laser_pistol', 'heavy_pistol',
    'assault_rifle', 'scoped_rifle', 'pump_shotgun', 'light_armor', 'tactical_vest',
    'reinforced_plating', 'plasma_blade', 'shock_maul', 'plasma_pistol', 'smart_pistol',
    'pulse_rifle', 'plasma_rifle', 'combat_shotgun', 'plasma_shotgun', 'light_machine_gun',
    'grenade_launcher', 'heavy_armor', 'composite_armor', 'stealth_suit', 'power_armor_frame',
    'thermal_suit', 'nano_edge_katana', 'void_pistol', 'gauss_rifle', 'quantum_rifle',
    'disintegrator_cannon', 'minigun', 'railgun', 'nano_weave_armor', 'titan_armor',
    'shield_suit', 'void_suit', 'regenerative_armor'].includes(item);
  
  if (hasInventor && isEquipmentCraft) {
    if (Math.random() < 0.30) {
      // Find a weapon part in inventory to consume
      const weaponPartIndex = state.inventory.findIndex(i => i.type === 'component' && i.subtype === 'weaponPart');
      if (weaponPartIndex !== -1) {
        state.inventory.splice(weaponPartIndex, 1); // Consume the part
        const bonusTech = rand(2, 4);
        state.resources.tech += bonusTech;
        appendLog(`🔧 Inventor: Extracted ${bonusTech} bonus Tech from spare parts!`);
      }
    }
  }
  
  // 0.8.11 - Technician class + ability durability bonuses (additive stacking)
  let durabilityAdd = 0; // Additive bonus (0.20 = +20%)
  
  // Apply all Technician class durability bonuses additively
  const techsWithDurability = technicians.filter(t => t.class === 'technician' && t.classBonuses && t.classBonuses.durability);
  for (const tech of techsWithDurability) {
    durabilityAdd += (tech.classBonuses.durability - 1); // e.g., 1.15 -> 0.15
  }
  
  // Apply Technician ability bonuses (additive stacking)
  for (const t of technicians) {
    if (hasAbility(t, 'durable')) durabilityAdd += 0.20; // +20%
    if (hasAbility(t, 'prodigy')) durabilityAdd += 0.30; // +30%
  }
  
  const durabilityMult = 1 + durabilityAdd;
  
  if (durabilityMult > 1) {
    const lastItem = state.inventory[state.inventory.length - 1];
    if (lastItem && lastItem.durability !== undefined) {
      lastItem.maxDurability = Math.floor(lastItem.maxDurability * durabilityMult);
      lastItem.durability = lastItem.maxDurability;
      appendLog('Crafted with enhanced durability!');
    }
  }
  
  updateUI();
}

function upgradeFilter() {
  const cost = BALANCE.UPGRADE_COSTS.filter.base + state.systems.filter * BALANCE.UPGRADE_COSTS.filter.perLevel;
  if (state.resources.scrap < cost) {
    appendLog('Not enough scrap to upgrade filter.');
    return;
  }
  state.resources.scrap -= cost;
  state.systems.filter++;
  appendLog(`Filter upgraded to level ${state.systems.filter}.`);
  updateUI();
}

function upgradeGenerator() {
  const cost = BALANCE.UPGRADE_COSTS.generator.base + state.systems.generator * BALANCE.UPGRADE_COSTS.generator.perLevel;
  if (state.resources.scrap < cost) {
    appendLog('Not enough scrap to upgrade generator.');
    return;
  }
  state.resources.scrap -= cost;
  state.systems.generator++;
  appendLog(`Generator upgraded to level ${state.systems.generator}.`);
  updateUI();
}

function buildTurret() {
  // 0.8.10 - Enforce max turret limit
  const maxTurrets = BALANCE.MAX_TURRETS || 5;
  if (state.systems.turret >= maxTurrets) {
    appendLog(`Cannot build more turrets. Maximum: ${maxTurrets}`);
    return;
  }
  
  // 0.8.4 - Scale turret costs by 10% per existing turret
  const baseCost = BALANCE.UPGRADE_COSTS.turret.scrap;
  const baseEnergy = BALANCE.UPGRADE_COSTS.turret.energy;
  const scalingFactor = 1 + (state.systems.turret * 0.10);
  const cost = Math.ceil(baseCost * scalingFactor);
  const energyCost = Math.ceil(baseEnergy * scalingFactor);
  
  if (state.resources.scrap < cost || state.resources.energy < energyCost) {
    appendLog('Not enough resources to build turret.');
    return;
  }
  state.resources.scrap -= cost;
  state.resources.energy -= energyCost;
  state.systems.turret++;
  appendLog('Auto-turret deployed.');
  updateUI();
}

// 0.8.0 - Repair failed systems
function repairSystem(systemType) {
  const costs = BALANCE.REPAIR_COSTS[systemType];
  if (!costs) {
    appendLog('Invalid system type.');
    return;
  }
  
  // Check if there's a failed system to repair
  const failureIndex = state.systemFailures.findIndex(f => f.type === systemType);
  if (failureIndex === -1) {
    appendLog(`No failed ${systemType} to repair.`);
    return;
  }
  
  // 0.9.0 - Check for Repair Kit and use it if available
  const repairKitIdx = state.inventory.findIndex(i => 
    i.type === 'consumable' && i.subtype === 'repair_kit'
  );
  
  if (repairKitIdx !== -1) {
    // Use Repair Kit for free repair
    state.inventory.splice(repairKitIdx, 1);
    state.systemFailures.splice(failureIndex, 1);
    const displayName = systemType.charAt(0).toUpperCase() + systemType.slice(1);
    appendLog(`🔧 Used Repair Kit to restore ${displayName} system!`);
    updateUI();
    saveGame('action');
    return;
  }
  
  // Check resources (if no Repair Kit)
  if (state.resources.scrap < costs.scrap || state.resources.energy < costs.energy) {
    appendLog(`Need ${costs.scrap} scrap and ${costs.energy} energy to repair ${systemType}.`);
    return;
  }
  
  // Deduct costs and restore system
  state.resources.scrap -= costs.scrap;
  state.resources.energy -= costs.energy;
  // Remove the failure (don't level up the system)
  state.systemFailures.splice(failureIndex, 1);
  
  appendLog(`✅ ${systemType.charAt(0).toUpperCase() + systemType.slice(1)} system repaired!`);
  
  updateUI();
  saveGame('action');
}

// 0.9.0 - Repair base integrity
function repairBase() {
  if (state.baseIntegrity >= 100) {
    appendLog('Base integrity is already at 100%.');
    return;
  }
  
  const missingIntegrity = 100 - state.baseIntegrity;
  
  // Calculate total cost for full repair
  let fullScrapCost = Math.ceil(BALANCE.BASE_REPAIR_SCRAP_COST * (missingIntegrity / 100));
  let fullEnergyCost = Math.ceil(BALANCE.BASE_REPAIR_ENERGY_COST * (missingIntegrity / 100));
  
  // Apply Engineer/Technician discounts
  let costReduction = 0;
  state.survivors.forEach(s => {
    if (s.classBonuses && s.classBonuses.repair) {
      costReduction += (1 - s.classBonuses.repair);
    }
    if (hasAbility(s, 'quickfix')) {
      costReduction += 0.20;
    }
  });
  
  const costMult = 1 - Math.min(0.5, costReduction); // Cap at 50% reduction
  fullScrapCost = Math.ceil(fullScrapCost * costMult);
  fullEnergyCost = Math.ceil(fullEnergyCost * costMult);

  // Determine affordable repair amount
  const scrapRatio = state.resources.scrap / fullScrapCost;
  const energyRatio = state.resources.energy / fullEnergyCost;
  const affordableRatio = Math.min(1, scrapRatio, energyRatio);

  if (affordableRatio <= 0) {
    appendLog(`Not enough resources to repair the base. Need ${fullScrapCost} scrap and ${fullEnergyCost} energy for a full repair.`);
    return;
  }

  const integrityToRepair = Math.ceil(missingIntegrity * affordableRatio);
  const scrapToSpend = Math.floor(fullScrapCost * affordableRatio);
  const energyToSpend = Math.floor(fullEnergyCost * affordableRatio);

  // Deduct costs and repair
  state.resources.scrap -= scrapToSpend;
  state.resources.energy -= energyToSpend;
  const oldIntegrity = Math.floor(state.baseIntegrity);
  state.baseIntegrity += integrityToRepair;
  
  appendLog(`🔧 Base repaired by ${integrityToRepair}% to ${Math.floor(state.baseIntegrity)}%! Cost: ${scrapToSpend} scrap, ${energyToSpend} energy.`);
  
  updateUI();
  saveGame('action');
}

function autoSalvage() {
  const junkItems = state.inventory.filter(item => item.type === 'junk');
  if (junkItems.length === 0) {
    appendLog('No junk to salvage.');
    return;
  }
  
  // 0.9.0 - Roll scrap for each individual piece of junk
  let baseScrap = 0;
  for (let i = 0; i < junkItems.length; i++) {
    baseScrap += rand(2, 4);
  }
  
  // 0.8.13 - Apply Scavenger scrap bonuses to salvaging (additive)
  const activeScavengers = state.survivors.filter(s => !s.onMission && s.class === 'scavenger');
  let scrapBonusAdd = 0;
  
  activeScavengers.forEach(scav => {
    if (scav.classBonuses && scav.classBonuses.scrap) {
      scrapBonusAdd += (scav.classBonuses.scrap - 1); // e.g., 1.25 -> 0.25
    }
    if (hasAbility(scav, 'salvage')) scrapBonusAdd += 0.25; // Salvage Expert ability
  });
  
  const scrapGained = Math.floor(baseScrap * (1 + scrapBonusAdd));
  
  state.inventory = state.inventory.filter(item => item.type !== 'junk');
  state.resources.scrap += scrapGained;
  appendLog(`Salvaged ${junkItems.length} junk items for ${scrapGained} scrap.`);
  updateUI();
}

function repairItem(itemId) {
  // Find item in inventory or equipped by a survivor
  let item = state.inventory.find(i => i.id === itemId);
  let ownerSurvivor = null;

  if (!item) {
    for (const s of state.survivors) {
      if (s.equipment.weapon && s.equipment.weapon.id === itemId) {
        item = s.equipment.weapon;
        ownerSurvivor = s;
        break;
      }
      if (s.equipment.armor && s.equipment.armor.id === itemId) {
        item = s.equipment.armor;
        ownerSurvivor = s;
        break;
      }
    }
  }

  if (!item) {
    appendLog('Item not found.');
    return;
  }

  let baseCost = Math.ceil((item.maxDurability - item.durability) * BALANCE.REPAIR_COST_PER_POINT);
  
  // Engineer class and ability cost reduction
  let costReduction = 0;
  const engineers = state.survivors.filter(s => !s.onMission && s.class === 'engineer');
  
  engineers.forEach(eng => {
    if (eng.classBonuses && eng.classBonuses.repair) {
      costReduction += (1 - eng.classBonuses.repair);
    }
    if (hasAbility(eng, 'quickfix')) {
      costReduction += 0.20; // Quick Fix ability
    }
  });
  
  const costMult = Math.max(0.1, 1 - costReduction);
  const repairCost = Math.ceil(baseCost * costMult);
  
  if (state.resources.scrap < repairCost) {
    appendLog(`Not enough scrap to repair. Need ${repairCost}.`);
    return;
  }

  state.resources.scrap -= repairCost;
  item.durability = item.maxDurability;
  const coloredName = colorItemName(item.name, item.rarity);
  appendLog(`${coloredName} repaired for ${repairCost} scrap.`);
  updateUI();
}
