// Crafting System
// Handles item crafting, system upgrades, repair, and salvage

function craft(item) {
  const r = RECIPES[item];
  if (!r) {
    appendLog('Unknown recipe.');
    return;
  }
  if (state.resources.scrap < (r.scrap || 0) || state.resources.energy < (r.energy || 0) || state.resources.tech < (r.tech || 0)) {
    appendLog('Insufficient resources for ' + item + '.');
    return;
  }
  state.resources.scrap -= (r.scrap || 0);
  state.resources.energy -= (r.energy || 0);
  state.resources.tech -= (r.tech || 0);
  r.result();
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
  const cost = BALANCE.UPGRADE_COSTS.turret.scrap;
  if (state.resources.scrap < cost || state.resources.energy < BALANCE.UPGRADE_COSTS.turret.energy) {
    appendLog('Not enough resources to build turret.');
    return;
  }
  state.resources.scrap -= cost;
  state.resources.energy -= BALANCE.UPGRADE_COSTS.turret.energy;
  state.systems.turret++;
  appendLog('Auto-turret deployed.');
  updateUI();
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

  const repairCost = Math.ceil((item.maxDurability - item.durability) * BALANCE.REPAIR_COST_PER_POINT);
  if (state.resources.scrap < repairCost) {
    appendLog(`Not enough scrap to repair. Need ${repairCost}.`);
    return;
  }

  state.resources.scrap -= repairCost;
  item.durability = item.maxDurability;
  appendLog(`${item.name} repaired for ${repairCost} scrap.`);
  updateUI();
}
