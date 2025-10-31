// Crafting System
// Handles item crafting, system upgrades, repair, and salvage

function craft(item) {
  const r = RECIPES[item];
  if (!r) {
    appendLog('Unknown recipe.');
    return;
  }
  
  // 0.8.10 - Technician class bonus: crafting cost reduction (rolled 0.80-0.90 = 10-20% reduction)
  let costMult = 1;
  const technicians = state.survivors.filter(s => !s.onMission);
  
  // Apply best Technician's class bonus first
  const techsWithBonus = technicians.filter(t => t.class === 'technician' && t.classBonuses && t.classBonuses.crafting);
  if (techsWithBonus.length > 0) {
    const bestCraftingBonus = Math.min(...techsWithBonus.map(t => t.classBonuses.crafting));
    costMult *= bestCraftingBonus;
  }
  
  // 0.8.0 - Technician abilities reduce crafting costs (stack with class bonus)
  for (const t of technicians) {
    if (hasAbility(t, 'resourceful')) costMult *= 0.90; // -10% cost
    if (hasAbility(t, 'prodigy')) costMult *= 0.75; // -25% cost
  }
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
  
  // 0.8.0 - Technician Recycler ability: 25% chance to refund materials
  const hasRecycler = technicians.some(t => hasAbility(t, 'recycler'));
  if (hasRecycler && Math.random() < 0.25) {
    state.resources.scrap += scrapCost;
    state.resources.energy += energyCost;
    state.resources.tech += techCost;
    appendLog('Recycler: Materials refunded!');
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
  
  // 0.8.10 - Technician class + ability durability bonuses
  const hasDurable = technicians.some(t => hasAbility(t, 'durable'));
  const hasProdigy = technicians.some(t => hasAbility(t, 'prodigy'));
  
  // Apply Technician class durability bonus
  let durabilityMult = 1;
  const techsWithDurability = technicians.filter(t => t.class === 'technician' && t.classBonuses && t.classBonuses.durability);
  if (techsWithDurability.length > 0) {
    const bestDurabilityBonus = Math.max(...techsWithDurability.map(t => t.classBonuses.durability));
    durabilityMult *= bestDurabilityBonus;
  }
  
  // Apply Technician ability bonuses (stack with class bonus)
  if (hasDurable) durabilityMult *= 1.2; // +20%
  if (hasProdigy) durabilityMult *= 1.3; // +30%
  
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

  let repairCost = Math.ceil((item.maxDurability - item.durability) * BALANCE.REPAIR_COST_PER_POINT);
  
  // 0.8.10 - Engineer class bonus: repair cost reduction (rolled 0.75-0.85 = 15-25% reduction)
  const activeEngineers = state.survivors.filter(s => !s.onMission && s.class === 'engineer' && s.classBonuses && s.classBonuses.repair);
  if (activeEngineers.length > 0) {
    // Use the best Engineer's bonus
    const bestRepairBonus = Math.min(...activeEngineers.map(e => e.classBonuses.repair));
    repairCost = Math.ceil(repairCost * bestRepairBonus);
  }
  
  // 0.8.0 - Engineer Quick Fix ability: -20% repair costs (stacks with class bonus)
  const hasQuickFix = state.survivors.some(s => !s.onMission && hasAbility(s, 'quickfix'));
  if (hasQuickFix) repairCost = Math.ceil(repairCost * 0.80);
  
  if (state.resources.scrap < repairCost) {
    appendLog(`Not enough scrap to repair. Need ${repairCost}.`);
    return;
  }

  state.resources.scrap -= repairCost;
  item.durability = item.maxDurability;
  appendLog(`${item.name} repaired for ${repairCost} scrap.`);
  updateUI();
}
