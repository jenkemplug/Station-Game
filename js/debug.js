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

// 0.9.0 - Spawns items using RECIPES or LOOT_TABLE for perfect consistency
function debugAddItem(itemType) {
  // First, try to find in RECIPES (craftable items)
  const recipe = RECIPES[itemType];
  
  if (recipe) {
    // Special handling for ammo (not an inventory item)
    if (itemType === 'ammo') {
      state.resources.ammo += 50;
      appendLog('[DEBUG] Added 50 ammo');
      updateUI();
      return;
    }
    
    // Store inventory count before adding
    const countBefore = state.inventory.length;
    
    // Call the recipe's result function (creates item using canonical logic)
    // We suppress its normal log by temporarily replacing appendLog
    const originalAppendLog = window.appendLog;
    let itemAdded = null;
    window.appendLog = (msg) => {
      // Capture the item name from the log message but don't display it yet
      itemAdded = msg;
    };
    
    recipe.result();
    
    // Restore original appendLog
    window.appendLog = originalAppendLog;
    
    // Check if item was added
    const countAfter = state.inventory.length;
    if (countAfter > countBefore) {
      // Item was successfully added - log with [DEBUG] prefix
      if (itemAdded) {
        appendLog(`[DEBUG] ${itemAdded}`);
      } else {
        appendLog(`[DEBUG] ${recipe.name} added to inventory`);
      }
    } else {
      appendLog('[DEBUG] Inventory full');
    }
    
    updateUI();
    return;
  }
  
  // If not in RECIPES, check LOOT_TABLE (components, non-craftable consumables)
  const lootEntry = LOOT_TABLE.find(entry => entry.type === itemType);
  
  if (lootEntry) {
    // Call the onPickup function which creates the item
    const result = lootEntry.onPickup(state);
    if (result) {
      appendLog(`[DEBUG] ${result}`);
    }
    updateUI();
    return;
  }
  
  // Item not found in either table
  appendLog(`[DEBUG] Unknown item type: ${itemType} (not in RECIPES or LOOT_TABLE)`);
}

function debugRecruitSurvivor() {
  // This function now uses the core recruitSurvivor function to ensure
  // survivors are created with proper classes, abilities, and bonuses.
  // Passing a name bypasses the recruitment cost.
  recruitSurvivor(getRandomName());
  const newSurvivor = state.survivors[state.survivors.length - 1];
  appendLog(`[DEBUG] Recruited ${newSurvivor.name} (${newSurvivor.class}) (free)`);
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

function debugLevelupAll() {
  state.survivors.forEach(s => {
    s.level++;
    // 0.9.0 - Removed skill increment (skill system removed)
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

function debugRaiseThreat() {
  state.threat = Math.min(100, state.threat + 10);
  appendLog(`[DEBUG] Threat level increased to ${state.threat.toFixed(1)}%`);
  updateUI();
}

function debugResetRaidChance() {
  state.raidChance = 0;
  if (state.raidCooldownMs) {
    state.raidCooldownMs = 0;
  }
  appendLog('[DEBUG] Raid chance reset to 0% (cooldown cleared)');
  updateUI();
}

function debugRaiseRaidChance() {
  state.raidChance = Math.min(10, state.raidChance + 1);
  appendLog(`[DEBUG] Raid chance increased to ${state.raidChance.toFixed(2)}%`);
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

function debugFailSystem(systemType) {
  const isFailed = state.systemFailures.some(f => f.type === systemType);
  if (isFailed) {
    appendLog(`[DEBUG] ${systemType} system is already failed.`);
    return;
  }
  
  if (systemType === 'turret' && state.systems.turret > 0) {
    state.systems.turret--;
  }
  
  state.systemFailures.push({ type: systemType, time: state.secondsPlayed });
  appendLog(`[DEBUG] Triggered failure for ${systemType} system.`);
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

function debugLockThreat() {
  state.threat = 100;
  state.threatLocked = true;
  appendLog('[DEBUG] Threat locked at 100%. Escalation system active.');
  updateUI();
}

function debugRaiseEscalation() {
  if (!state.threatLocked || state.threat < 100) {
    appendLog('[DEBUG] Threat must be at 100% and locked for escalation.');
    return;
  }
  state.escalationLevel += 1;
  const hpBonus = (state.escalationLevel * BALANCE.ESCALATION_HP_MULT * 100).toFixed(0);
  const atkBonus = (state.escalationLevel * BALANCE.ESCALATION_ATTACK_MULT * 100).toFixed(0);
  const armorBonus = Math.floor(state.escalationLevel / BALANCE.ESCALATION_ARMOR_LEVELS);
  appendLog(`[DEBUG] Escalation raised to Level ${state.escalationLevel} (+${hpBonus}% HP, +${atkBonus}% Atk, +${armorBonus} Armor)`);
  updateUI();
}
