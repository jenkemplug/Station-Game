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
  const weaponPartCost = r.weaponPart || 0;
  
  // Check for weapon parts in inventory
  const weaponPartsInInventory = state.inventory.filter(i => i.type === 'weaponPart').length;

  if (state.resources.scrap < scrapCost || state.resources.energy < energyCost || state.resources.tech < techCost || weaponPartsInInventory < weaponPartCost) {
    appendLog('Insufficient resources for ' + item + '.');
    return;
  }
  
  // Consume weapon parts
  if (weaponPartCost > 0) {
    for (let i = 0; i < weaponPartCost; i++) {
      const partIndex = state.inventory.findIndex(invItem => invItem.type === 'weaponPart');
      if (partIndex !== -1) {
        state.inventory.splice(partIndex, 1);
      }
    }
  }
  
  state.resources.scrap -= scrapCost;
  state.resources.energy -= energyCost;
  state.resources.tech -= techCost;
  
  // 0.8.11 - Technician Recycler ability: 25% chance per Recycler to refund materials
  const recyclerCount = technicians.filter(t => hasAbility(t, 'recycler')).length;
  const refundChance = recyclerCount * 0.25; // 25% per Recycler, stacks
  if (recyclerCount > 0 && Math.random() < refundChance) {
    state.resources.scrap += scrapCost;
    state.resources.energy += energyCost;
    state.resources.tech += techCost;
    appendLog(`♻️ Recycler: Materials refunded! (${Math.floor(refundChance * 100)}% chance)`);
  }
  
  r.result();
  
  // 0.8.0 - Inventor: 30% chance to craft bonus rare component when crafting equipment
  const engineers = state.survivors.filter(s => !s.onMission && s.class === 'engineer');
  const hasInventor = engineers.some(e => hasAbility(e, 'inventor'));
  if (hasInventor && (item === 'rifle' || item === 'shotgun' || item === 'armor' || item === 'heavyArmor' || item === 'hazmatSuit')) {
    if (Math.random() < 0.30) {
      // Find weapon parts in inventory
      const weaponPartIndex = state.inventory.findIndex(i => i.type === 'weaponPart');
      if (weaponPartIndex !== -1) {
        state.inventory.splice(weaponPartIndex, 1); // Consume the part
        state.resources.tech += rand(2, 4); // Grant tech bonus
        appendLog('🔧 Inventor: Rare component extracted (+2-4 tech)!');
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
  
  // Check resources
  if (state.resources.scrap < costs.scrap || state.resources.energy < costs.energy) {
    appendLog(`Need ${costs.scrap} scrap and ${costs.energy} energy to repair ${systemType}.`);
    return;
  }
  
  // Deduct costs and restore system
  state.resources.scrap -= costs.scrap;
  state.resources.energy -= costs.energy;
  state.systems[systemType]++;
  state.systemFailures.splice(failureIndex, 1);
  
  appendLog(`✅ ${systemType.charAt(0).toUpperCase() + systemType.slice(1)} system repaired!`);
  updateUI();
  saveGame('action');
}

function autoSalvage() {
  const junkItems = state.inventory.filter(item => item.type === 'junk');
  if (junkItems.length === 0) {
    appendLog('No junk to salvage.');
    return;
  }
  const scrapGained = junkItems.length * rand(2, 4);
  state.inventory = state.inventory.filter(item => item.type !== 'junk');
  state.resources.scrap += scrapGained;
  appendLog(`Salvaged ${junkItems.length} junk items for ${scrapGained} scrap.`);
  updateUI();
}

function repairItem(itemId) {
  const item = state.inventory.find(i => i.id === itemId);
  if (!item) {
    appendLog('Item not found.');
    return;
  }

  let baseCost = Math.ceil((item.maxDurability - item.durability) * BALANCE.REPAIR_COST_PER_POINT);
  
  // 0.8.11 - Engineer class bonus: repair cost reduction (additive stacking)
  const activeEngineers = state.survivors.filter(s => !s.onMission && s.class === 'engineer');
  let costReductionAdd = 0;
  
  activeEngineers.forEach(eng => {
    if (eng.classBonuses && eng.classBonuses.repair) {
      // classBonuses.repair is stored as multiplier (0.75-0.85), convert to reduction
      costReductionAdd += (1 - eng.classBonuses.repair); // e.g., 0.80 -> 0.20 (20% reduction)
    }
  });
  
  // 0.8.11 - Engineer Quick Fix ability: -20% repair costs (additive stacking)
  const quickFixCount = state.survivors.filter(s => !s.onMission && hasAbility(s, 'quickfix')).length;
  costReductionAdd += quickFixCount * 0.20;
  
  // Apply cost reduction (cap at 90% reduction)
  const costMult = Math.max(0.1, 1 - costReductionAdd);
  const repairCost = Math.ceil(baseCost * costMult);
  
  if (state.resources.scrap < repairCost) {
    appendLog(`Not enough scrap to repair. Need ${repairCost}.`);
    return;
  }

  state.resources.scrap -= repairCost;
  item.durability = item.maxDurability;
  appendLog(`${item.name} repaired for ${repairCost} scrap.`);
  updateUI();
}
