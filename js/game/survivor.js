// Survivor Management System
// Handles recruitment, task assignment, equipment, XP, and survivor actions

// 0.8.0 - Helper: Randomly assign survivor class
function assignRandomClass() {
  const classIndex = Math.floor(Math.random() * SURVIVOR_CLASSES.length);
  return SURVIVOR_CLASSES[classIndex].id;
}

// 0.8.0 - Helper: Roll for special abilities based on class
function rollAbilities(classId) {
  const abilities = [];
  const classAbilities = SPECIAL_ABILITIES[classId];
  if (!classAbilities) return abilities;

  for (const ability of classAbilities) {
    if (Math.random() < ability.chance) {
      abilities.push(ability.id);
    }
  }
  return abilities;
}

function recruitSurvivor(name) {
  // 0.8.0 - Assign random class and roll for abilities
  const survivorClass = assignRandomClass();
  const abilities = rollAbilities(survivorClass);

  // 0.8.0 - Weighted skill distribution: mostly 1, some 2, rarely 3
  let skill = 1;
  const skillRoll = Math.random();
  if (skillRoll < 0.70) skill = 1;      // 70% chance skill 1
  else if (skillRoll < 0.95) skill = 2; // 25% chance skill 2
  else skill = 3;                        // 5% chance skill 3

  // 0.8.10 - Roll class bonus values from ranges and store them
  const classInfo = SURVIVOR_CLASSES.find(c => c.id === survivorClass);
  const rolledBonuses = {};
  
  if (classInfo && classInfo.bonuses) {
    for (const [key, value] of Object.entries(classInfo.bonuses)) {
      if (Array.isArray(value) && value.length === 2) {
        // Roll a random value between min and max
        const [min, max] = value;
        const rolled = min + Math.random() * (max - min);
        // Round to 2 decimal places for percentages, whole numbers for flat values
        rolledBonuses[key] = (key === 'hp' || key === 'defense') ? Math.round(rolled) : Math.round(rolled * 100) / 100;
      } else {
        // Fallback for any non-range values
        rolledBonuses[key] = value;
      }
    }
  }
  
  // 0.8.10 - Apply HP bonus from rolled values
  let baseHp = 20;
  if (rolledBonuses.hp) {
    baseHp += rolledBonuses.hp;
  }

  const s = {
    id: state.nextSurvivorId++,
    name: name || getRandomName(),
    level: 1,
    xp: 0,
    nextXp: 50,
    // skill removed - redundant with level (0.9.0)
    hp: baseHp,
    maxHp: baseHp,
    morale: 60,
    role: 'Idle',
    task: 'Idle',
    injured: false,
    equipment: { weapon: null, armor: null },
    // 0.8.0 - New fields
    class: survivorClass,
    abilities: abilities,
    // 0.8.10 - Store rolled class bonuses
    classBonuses: rolledBonuses
  };
  state.survivors.push(s);
  
  // Build recruitment log message
  let logMsg = `${s.name} was recruited.`;
  const className = SURVIVOR_CLASSES.find(c => c.id === survivorClass)?.name || survivorClass;
  logMsg += ` Class: ${className}`;
  if (abilities.length > 0) {
    const abilityNames = abilities.map(id => {
      for (const classKey in SPECIAL_ABILITIES) {
        const found = SPECIAL_ABILITIES[classKey].find(a => a.id === id);
        if (found) return found.name;
      }
      return id;
    });
    logMsg += `. Abilities: ${abilityNames.join(', ')}`;
  }
  appendLog(logMsg);
  updateUI();
}

// 1.0.1 - Removed getRecruitCost(): dead code from the old recruit-at-base system
// (survivors are only found via exploration now; nothing charged this cost).

function assignTask(id, newTask) {
  const s = state.survivors.find(x => x.id === id);
  if (!s) return;
  
  // 0.8.10 - Enforce max guards limit
  if (newTask === 'Guard') {
    const currentGuards = state.survivors.filter(surv => surv.task === 'Guard' && surv.id !== id && !surv.onMission).length;
    const maxGuards = BALANCE.MAX_GUARDS || 4;
    if (currentGuards >= maxGuards) {
      appendLog(`Cannot assign more guards. Maximum: ${maxGuards}`);
      updateUI();
      return;
    }
  }
  
  if (TASKS.includes(newTask)) {
    s.task = newTask;
    s.role = newTask; // Update role to match task
    appendLog(`${s.name} assigned to ${s.task}.`);
    setTimeout(updateUI, 0);
  }
}

function grantXp(survivor, amount) {
  if (!survivor || survivor.hp <= 0) return;

  let xpMult = BALANCE.XP_MULT; // Base global multiplier (0.9)
  let xpBonusAdd = 0; // 0.8.11 - Additive XP bonuses
  
  // 0.8.11 - Use rolled class bonus for XP (Scientist, additive)
  if (survivor.classBonuses && survivor.classBonuses.xp) {
    xpBonusAdd += (survivor.classBonuses.xp - 1); // e.g., 1.20 -> 0.20
  }
  
  // 0.8.11 - Add ability XP bonuses (Scientist abilities, additive)
  if (hasAbility(survivor, 'studious')) xpBonusAdd += 0.15; // +15% XP
  if (hasAbility(survivor, 'genius')) xpBonusAdd += 0.25; // +25% XP
  
  // 0.9.0 - Apply morale XP modifier (high morale gives +10% XP)
  const moraleModifier = getMoraleModifier(survivor);
  xpMult *= moraleModifier.xp;
  
  // Apply base mult and additive bonuses
  xpMult *= (1 + xpBonusAdd);

  const gained = Math.round(amount * xpMult);
  survivor.xp += gained;
  appendLog(`${survivor.name} gains ${gained} XP.`);
  
  // 1.0 Phase 3.2 - Show XP popup animation
  if (typeof showXPPopup === 'function') {
    showXPPopup(survivor.id, gained);
  }

  // Check for level up
  if (survivor.xp >= survivor.nextXp) {
    survivor.level++;
    // skill removed - redundant with level (0.9.0)
    
    // 1.0 Phase 3.2 - Flash level up animation
    if (typeof flashLevelUp === 'function') {
      flashLevelUp(survivor.id);
    }
    
    // 0.9.0 - Increase max HP by 5, maintaining HP percentage if armor equipped
    const oldEffectiveMaxHp = getEffectiveMaxHp(survivor);
    const hpPercentage = survivor.hp / oldEffectiveMaxHp;
    survivor.maxHp += 5;
    const newEffectiveMaxHp = getEffectiveMaxHp(survivor);
    survivor.hp = Math.min(Math.round(newEffectiveMaxHp * hpPercentage), newEffectiveMaxHp);
    
    survivor.xp -= survivor.nextXp; // Carry over excess XP
    survivor.nextXp = Math.floor(survivor.nextXp * 1.5);
    appendLog(`${survivor.name} leveled up to Level ${survivor.level}!`);
    
  // 0.9.0 - Morale gain on level up
    survivor.morale = Math.min(100, survivor.morale + BALANCE.MORALE_GAIN_LEVEL_UP);
  }
}

function releaseSurvivor(id) {
  // 0.8.10 - Prevent releasing last survivor
  if (state.survivors.length <= 1) {
    appendLog('Cannot release your last survivor!');
    return;
  }

  const idx = state.survivors.findIndex(x => x.id === id);
  if (idx === -1) return;
  const survivor = state.survivors[idx];

  // 1.0.1 - Block release while the survivor is deployed: releasing the active
  // explorer or a mission-assigned survivor left dangling references (locked
  // exploration mode, missions pointing at a nonexistent survivor).
  if (survivor.onMission || state.activeMissions.some(m => m.survivorId === id)) {
    appendLog(`${survivor.name} is on a mission and cannot be released. Recall them first.`);
    return;
  }
  if (survivor.onExploration || (state.isExploring && state.selectedExplorerId === id)) {
    appendLog(`${survivor.name} is out exploring and cannot be released. Return to base first.`);
    return;
  }

  const name = survivor.name;
  state.survivors.splice(idx, 1);
  appendLog(`${name} was released from the base.`);
  updateUI();
}

// 1.0.1 - Removed dead functions with no callers:
// - useMedkit(): superseded by openConsumableModal -> useOutOfCombatConsumable
// - equipBest(): superseded by openLoadoutForSurvivor / equipItemToSurvivor
// - getArmorHpBonus(): duplicated logic centralized in getEffectiveMaxHp (utils.js)

// getEffectiveMaxHp lives in js/utils.js (loaded earlier); do not redefine here.

function equipItemToSurvivor(survivorId, itemId) {
  const s = state.survivors.find(x => x.id === survivorId);
  if (!s) return;
  const idx = state.inventory.findIndex(i => i.id === itemId);
  if (idx === -1) { appendLog('Item not found in inventory.'); return; }
  const item = state.inventory[idx];
  let slot = null;
  
  // 0.9.0 - Support both old and new item structure
  // Old structure: type = 'rifle', 'shotgun', 'armor', 'heavyArmor', 'hazmatSuit'
  // New structure: type = 'weapon' (with weaponType property) or type = 'armor'
  if (item.type === 'weapon') slot = 'weapon';
  else if (item.type === 'armor') slot = 'armor';
  else if (item.type === 'rifle' || item.type === 'shotgun') slot = 'weapon';
  else if (item.type === 'armor' || item.type === 'heavyArmor' || item.type === 'hazmatSuit') slot = 'armor';
  
  if (!slot) { appendLog('That item cannot be equipped.'); return; }

  // 0.9.0 - Handle armor HP bonus with proportional scaling
  if (slot === 'armor') {
    // Calculate current HP percentage
    const currentMaxHp = getEffectiveMaxHp(s);
    const hpPercentage = s.hp / currentMaxHp;
    
    // Remove old armor bonus if swapping
    if (s.equipment.armor) {
      if (!canAddToInventory()) {
        appendLog('Inventory full - cannot swap equipment.');
        return;
      }
      state.inventory.push(s.equipment.armor);
    }
    
    // Equip new armor
    s.equipment.armor = item;
    state.inventory.splice(idx, 1);
    
    // Apply new HP proportionally
    const newMaxHp = getEffectiveMaxHp(s);
    s.hp = Math.round(newMaxHp * hpPercentage);
  } else {
    // Weapon slot handling (unchanged)
    if (slot === 'weapon' && s.equipment.weapon) {
      if (!canAddToInventory()) {
        appendLog('Inventory full - cannot swap equipment.');
        return;
      }
      state.inventory.push(s.equipment.weapon);
    }
    
    // Assign and remove from inventory
    s.equipment.weapon = item;
    state.inventory.splice(idx, 1);
  }

  // 0.9.0 - Color item name by rarity
  const coloredName = colorItemName(item.name, item.rarity);
  appendLog(`${s.name} equipped ${coloredName}.`);
  updateUI();
  saveGame('action');
}

// Unequip an item from a survivor back into inventory
function unequipFromSurvivor(survivorId, slot) {
  const s = state.survivors.find(x => x.id === survivorId);
  if (!s) return;
  if (slot !== 'weapon' && slot !== 'armor') return;
  const eq = slot === 'weapon' ? s.equipment.weapon : s.equipment.armor;
  if (!eq) { appendLog('Nothing to unequip.'); return; }
  
  // Check capacity before unequipping
  if (!canAddToInventory()) {
    appendLog('Inventory full - cannot unequip item.');
    return;
  }
  
  // 0.9.0 - Handle armor HP bonus with proportional scaling
  if (slot === 'armor') {
    // Calculate current HP percentage
    const currentMaxHp = getEffectiveMaxHp(s);
    const hpPercentage = s.hp / currentMaxHp;
    
    // Remove armor
    state.inventory.push(eq);
    s.equipment.armor = null;
    
    // Apply HP proportionally to new max (without armor bonus)
    const newMaxHp = getEffectiveMaxHp(s);
    s.hp = Math.min(Math.round(newMaxHp * hpPercentage), newMaxHp);
  } else {
    // Weapon unequip (unchanged)
    state.inventory.push(eq);
    s.equipment.weapon = null;
  }
  
  // 0.9.0 - Color item name by rarity
  const coloredName = colorItemName(eq.name, eq.rarity);
  appendLog(`${s.name} unequipped ${coloredName}.`);
  updateUI();
  saveGame('action');
}
