// Debug functions for development and testing

function toggleDebugPanel() {
  const panel = el('debugPanel');
  if (panel.style.display === 'none') {
    panel.style.display = 'flex';
    appendLog('[Debug panel opened]');
  } else {
    panel.style.display = 'none';
    appendLog('[Debug panel closed]');
  }
}

function debugAddResource(resource, amount) {
  if (state.resources.hasOwnProperty(resource)) {
    state.resources[resource] += amount;
    appendLog(`[DEBUG] Added ${amount} ${resource}`);
    updateUI();
  }
}

function debugAddItem(itemType) {
  let item;
  switch (itemType) {
    case 'rifle':
      item = { id: state.nextItemId++, type: 'rifle', name: 'Pulse Rifle', durability: 100, maxDurability: 100 };
      break;
    case 'shotgun':
      item = { id: state.nextItemId++, type: 'shotgun', name: 'Shotgun', durability: 80, maxDurability: 80 };
      break;
    case 'armor':
      item = { id: state.nextItemId++, type: 'armor', name: 'Light Armor', durability: 100, maxDurability: 100 };
      break;
    case 'heavyArmor':
      item = { id: state.nextItemId++, type: 'heavyArmor', name: 'Heavy Armor', durability: 200, maxDurability: 200 };
      break;
    case 'hazmatSuit':
      item = { id: state.nextItemId++, type: 'hazmatSuit', name: 'Hazmat Suit', durability: 150, maxDurability: 150 };
      break;
    case 'medkit':
      item = { id: state.nextItemId++, type: 'medkit', name: 'Medkit' };
      break;
    default:
      appendLog(`[DEBUG] Unknown item type: ${itemType}`);
      return;
  }
  // Debug mode ignores capacity limits
  state.inventory.push(item);
  appendLog(`[DEBUG] Added ${item.name} to inventory`);
  updateUI();
}

function debugRecruitSurvivor() {
  const s = {
    id: state.nextSurvivorId++,
    name: getRandomName(),
    level: 1,
    xp: 0,
    nextXp: 50,
    skill: rand(1, 6),
    hp: 20,
    maxHp: 20,
    morale: 60,
    role: 'Idle',
    task: 'Idle',
    injured: false,
    equipment: { weapon: null, armor: null }
  };
  state.survivors.push(s);
  appendLog(`[DEBUG] Recruited ${s.name} (free)`);
  updateUI();
}

function debugHealAll() {
  state.survivors.forEach(s => {
    s.hp = s.maxHp;
    s.injured = false;
  });
  appendLog('[DEBUG] All survivors healed');
  updateUI();
}

function debugMaxMorale() {
  state.survivors.forEach(s => {
    s.morale = 100;
  });
  appendLog('[DEBUG] All survivor morale set to 100');
  updateUI();
}

function debugLevelUp() {
  state.survivors.forEach(s => {
    s.level++;
    s.skill += 2;
    s.maxHp += 5;
    s.hp = s.maxHp;
    s.xp = 0;
    s.nextXp = Math.floor(s.nextXp * 1.5);
  });
  appendLog('[DEBUG] All survivors leveled up');
  updateUI();
}

function debugRevealMap() {
  for (let i = 0; i < state.tiles.length; i++) {
    state.tiles[i].scouted = true;
    state.explored.add(i);
  }
  appendLog('[DEBUG] All tiles revealed');
  updateUI();
}

function debugSpawnAliens() {
  const unexplored = [];
  for (let i = 0; i < state.tiles.length; i++) {
    if (!state.explored.has(i) && state.tiles[i].type === 'empty') {
      unexplored.push(i);
    }
  }
  
  if (unexplored.length === 0) {
    appendLog('[DEBUG] No empty tiles available for aliens');
    return;
  }

  const count = Math.min(5, unexplored.length);
  for (let i = 0; i < count; i++) {
    const idx = unexplored[rand(0, unexplored.length - 1)];
    unexplored.splice(unexplored.indexOf(idx), 1);
    state.tiles[idx].type = 'alien';
    state.tiles[idx].scouted = true;
  }
  
  appendLog(`[DEBUG] Spawned ${count} alien encounters`);
  updateUI();
}

function debugClearAliens() {
  let count = 0;
  for (let i = 0; i < state.tiles.length; i++) {
    if (state.tiles[i].type === 'alien') {
      state.tiles[i].type = 'empty';
      state.tiles[i].aliens = [];
      count++;
    }
  }
  appendLog(`[DEBUG] Cleared ${count} alien tiles`);
  updateUI();
}

function debugAddHazards() {
  const empty = [];
  for (let i = 0; i < state.tiles.length; i++) {
    if (state.tiles[i].type === 'empty' && !state.explored.has(i)) {
      empty.push(i);
    }
  }
  
  if (empty.length === 0) {
    appendLog('[DEBUG] No empty tiles available for hazards');
    return;
  }

  const count = Math.min(3, empty.length);
  for (let i = 0; i < count; i++) {
    const idx = empty[rand(0, empty.length - 1)];
    empty.splice(empty.indexOf(idx), 1);
    state.tiles[idx].type = 'hazard';
    state.tiles[idx].scouted = true;
  }
  
  appendLog(`[DEBUG] Added ${count} hazard rooms`);
  updateUI();
}

function debugUpgradeSystems() {
  state.systems.filter += 5;
  state.systems.generator += 5;
  state.systems.turret += 3;
  appendLog('[DEBUG] All systems upgraded (+5 filter, +5 generator, +3 turrets)');
  updateUI();
}

function debugResetThreat() {
  state.threat = 0;
  state.raidChance = 0;
  appendLog('[DEBUG] Threat level reset to 0');
  updateUI();
}

function debugRepairBase() {
  state.baseIntegrity = 100;
  appendLog('[DEBUG] Base integrity restored to 100%');
  updateUI();
}

function debugTriggerRaid() {
  appendLog('[DEBUG] Forcing raid event...');
  resolveRaid();
  updateUI();
}

function debugSkipTime(seconds) {
  appendLog(`[DEBUG] Skipping ${seconds} seconds...`);
  for (let i = 0; i < seconds; i++) {
    applyTick(false);
  }
  appendLog(`[DEBUG] Time skipped. Resources and systems updated.`);
  updateUI();
  saveGame('action');
}
