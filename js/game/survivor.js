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
  // Check recruitment cost
  const cost = getRecruitCost();
  if (!name && state.resources.scrap < cost) {
    appendLog(`Need ${cost} scrap to recruit.`);
    return;
  }

  // Only deduct cost if this is a manual recruitment (not from exploration)
  if (!name) state.resources.scrap -= cost;

  // 0.8.0 - Assign random class and roll for abilities
  const survivorClass = assignRandomClass();
  const abilities = rollAbilities(survivorClass);

  // 0.8.0 - Weighted skill distribution: mostly 1, some 2, rarely 3
  let skill = 1;
  const skillRoll = Math.random();
  if (skillRoll < 0.70) skill = 1;      // 70% chance skill 1
  else if (skillRoll < 0.95) skill = 2; // 25% chance skill 2
  else skill = 3;                        // 5% chance skill 3

  // 0.8.6 - Apply class-specific HP bonuses
  let baseHp = 20;
  const classInfo = SURVIVOR_CLASSES.find(c => c.id === survivorClass);
  if (classInfo && classInfo.bonuses.hp) {
    baseHp += classInfo.bonuses.hp; // Soldier gets +5 HP
  }

  const s = {
    id: state.nextSurvivorId++,
    name: name || getRandomName(),
    level: 1,
    xp: 0,
    nextXp: 50,
    skill: skill,
    hp: baseHp,
    maxHp: baseHp,
    morale: 60,
    role: 'Idle',
    task: 'Idle',
    injured: false,
    equipment: { weapon: null, armor: null },
    // 0.8.0 - New fields
    class: survivorClass,
    abilities: abilities
  };
  state.survivors.push(s);
  
  // Build recruitment log message
  let logMsg = `${s.name} was recruited${!name ? ` (cost: ${cost} scrap)` : ''}.`;
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

function getRecruitCost() {
  const baseCost = BALANCE.BASE_RECRUIT_COST;
  const survivorMult = Math.pow(1.5, state.survivors.length);
  const exploredDiscount = Math.min(BALANCE.EXPLORED_DISCOUNT_MAX, state.explored.size / (state.mapSize.w * state.mapSize.h));
  return Math.floor(baseCost * survivorMult * (1 - exploredDiscount));
}

function assignTask(id, newTask) {
  const s = state.survivors.find(x => x.id === id);
  if (!s) return;
  if (TASKS.includes(newTask)) {
    s.task = newTask;
    s.role = newTask; // Update role to match task
    appendLog(`${s.name} assigned to ${s.task}.`);
    setTimeout(updateUI, 0);
  }
}

function grantXp(survivor, amount) {
  if (!survivor || survivor.hp <= 0) return;

  let xpMult = BALANCE.XP_MULT;
  
  // 0.8.6 - Scientist class bonus: +15% XP
  const classInfo = SURVIVOR_CLASSES.find(c => c.id === survivor.class);
  if (classInfo && classInfo.bonuses.xp) {
    xpMult *= classInfo.bonuses.xp;
  }

  const gained = Math.round(amount * xpMult);
  survivor.xp += gained;
  appendLog(`${survivor.name} gains ${gained} XP.`);

  // Check for level up
  if (survivor.xp >= survivor.nextXp) {
    survivor.level++;
    survivor.skill += rand(1, 2);
    survivor.maxHp += 5;
    survivor.hp = survivor.maxHp; // Full heal on level up
    survivor.xp -= survivor.nextXp; // Carry over excess XP
    survivor.nextXp = Math.floor(survivor.nextXp * 1.5);
    appendLog(`${survivor.name} leveled up to Level ${survivor.level}!`);
  }
}

function releaseSurvivor(id) {
  const idx = state.survivors.findIndex(x => x.id === id);
  if (idx === -1) return;
  const name = state.survivors[idx].name;
  state.survivors.splice(idx, 1);
  appendLog(`${name} was released from the base.`);
  updateUI();
}

function useMedkit(id) {
  const s = state.survivors.find(x => x.id === id);
  if (!s) return;
  const medkitIndex = state.inventory.findIndex(item => item.type === 'medkit');
  if (medkitIndex === -1) {
    appendLog('No medkits available.');
    return;
  }
  state.inventory.splice(medkitIndex, 1);
  
  // 0.8.6 - Medic class bonus: +30% healing (base 10 -> 13)
  let healAmount = 10;
  const classInfo = SURVIVOR_CLASSES.find(c => c.id === s.class);
  if (classInfo && classInfo.bonuses.healing) {
    healAmount = Math.floor(healAmount * classInfo.bonuses.healing);
  }
  
  s.hp = Math.min(s.maxHp, s.hp + healAmount);
  s.injured = false;
  appendLog(`${s.name} treated with medkit${healAmount > 10 ? ` (healed ${healAmount})` : ''}.`);
  updateUI();
}

function equipBest(id) {
  const s = state.survivors.find(x => x.id === id);
  if (!s) return;
  // equip if we have weapons
  const weaponIndex = state.inventory.findIndex(item => item.type === 'rifle' || item.type === 'shotgun');
  if (weaponIndex !== -1 && !s.equipment.weapon) {
    const weapon = state.inventory.splice(weaponIndex, 1)[0];
    s.equipment.weapon = weapon;
    appendLog(`${s.name} equipped a ${weapon.name}.`);
    updateUI();
    return;
  }
  const armorIndex = state.inventory.findIndex(item => item.type === 'armor' || item.type === 'heavyArmor' || item.type === 'hazmatSuit');
  if (armorIndex !== -1 && !s.equipment.armor) {
    const armor = state.inventory.splice(armorIndex, 1)[0];
    s.equipment.armor = armor;
    appendLog(`${s.name} equipped ${armor.name}.`);
    updateUI();
    return;
  }
  appendLog(`${s.name} has nothing new to equip.`);
}

// Equip a specific inventory item to a survivor, auto-detecting slot
function equipItemToSurvivor(survivorId, itemId) {
  const s = state.survivors.find(x => x.id === survivorId);
  if (!s) return;
  const idx = state.inventory.findIndex(i => i.id === itemId);
  if (idx === -1) { appendLog('Item not found in inventory.'); return; }
  const item = state.inventory[idx];
  let slot = null;
  if (item.type === 'rifle' || item.type === 'shotgun') slot = 'weapon';
  if (item.type === 'armor' || item.type === 'heavyArmor' || item.type === 'hazmatSuit') slot = 'armor';
  if (!slot) { appendLog('That item cannot be equipped.'); return; }

  // If slot already occupied, check if inventory has room for it
  if (slot === 'weapon' && s.equipment.weapon) {
    if (!canAddToInventory()) {
      appendLog('Inventory full - cannot swap equipment.');
      return;
    }
    state.inventory.push(s.equipment.weapon);
  }
  if (slot === 'armor' && s.equipment.armor) {
    if (!canAddToInventory()) {
      appendLog('Inventory full - cannot swap equipment.');
      return;
    }
    state.inventory.push(s.equipment.armor);
  }

  // Assign and remove from inventory
  if (slot === 'weapon') s.equipment.weapon = item;
  else s.equipment.armor = item;
  state.inventory.splice(idx, 1);

  appendLog(`${s.name} equipped ${item.name}.`);
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
  
  state.inventory.push(eq);
  if (slot === 'weapon') s.equipment.weapon = null; else s.equipment.armor = null;
  appendLog(`${s.name} unequipped ${eq.name}.`);
  updateUI();
  saveGame('action');
}
