// Survivor Management System
// Handles recruitment, task assignment, equipment, XP, and survivor actions

function recruitSurvivor(name) {
  // Check recruitment cost
  const cost = getRecruitCost();
  if (!name && state.resources.scrap < cost) {
    appendLog(`Need ${cost} scrap to recruit.`);
    return;
  }

  // Only deduct cost if this is a manual recruitment (not from exploration)
  if (!name) state.resources.scrap -= cost;

  const s = {
    id: state.nextSurvivorId++,
    name: name || getRandomName(),
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
  appendLog(`${s.name} was recruited${!name ? ` (cost: ${cost} scrap)` : ''}.`);
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

  const gained = Math.round(amount * BALANCE.XP_MULT);
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
  s.hp = Math.min(s.maxHp, s.hp + 10);
  s.injured = false;
  appendLog(`${s.name} treated with medkit.`);
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
