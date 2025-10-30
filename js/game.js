function pickLoot() {
  const total = LOOT_TABLE.reduce((s, i) => s + i.weight, 0);
  let t = Math.random() * total;
  for (const l of LOOT_TABLE) {
    t -= l.weight;
    if (t <= 0) return l;
  }
  return LOOT_TABLE[0];
}

function initTiles() {
  const { w, h } = state.mapSize;
  state.tiles = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      let type = 'empty';
      let r = Math.random();
      if (x === state.baseTile.x && y === state.baseTile.y) type = 'base';
      else if (r < 0.06) type = 'survivor';
      else if (r < 0.18) type = 'resource';
      else if (r < 0.28) type = 'alien';
      else if (r < 0.36) type = 'hazard';
      else if (r < 0.40) type = 'module';
      state.tiles[idx] = { x, y, type, scouted: false, cleared: false, aliens: [] };
    }
  }
  // ensure base tile scouted
  const bi = state.baseTile.y * state.mapSize.w + state.baseTile.x;
  state.tiles[bi].scouted = true;
  state.explored.add(bi);
}

function makeSaveSnapshot() {
  // pick properties explicitly to avoid serializing methods or unexpected types
  return {
    _version: '1.8.0',
    startedAt: state.startedAt,
    lastTick: state.lastTick,
    secondsPlayed: state.secondsPlayed,
    resources: state.resources,
    production: state.production,
    survivors: state.survivors,
    nextSurvivorId: state.nextSurvivorId,
    nextItemId: state.nextItemId,
    tiles: state.tiles,
    mapSize: state.mapSize,
    baseTile: state.baseTile,
    explored: Array.from(state.explored || []),
    inventory: state.inventory,
    equipment: state.equipment,
    systems: state.systems,
    threat: state.threat,
    baseIntegrity: state.baseIntegrity,
    boardRisk: state.boardRisk,
    journal: state.journal,
    missions: state.missions,
    timeNow: Date.now()
  };
}

function saveGame(type = 'action') {
  try {
    const snap = makeSaveSnapshot();
    localStorage.setItem(GAME_KEY, JSON.stringify(snap));

    switch (type) {
      case 'manual':
        appendLog('Manual save complete.');
        break;
      case 'auto':
        autoSaveCounter = (autoSaveCounter + 1) % 10;
        if (autoSaveCounter === 0) {
          appendLog('[Game autosaved]');
        }
        break;
      case 'action':
        // Action saves are now silent to reduce log spam.
        break;
    }
  } catch (e) {
    console.error('Save failed', e);
    appendLog('[Save failed: see console]');
  }
}

function loadGame() {
  const raw = localStorage.getItem(GAME_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      // Basic sanity: if parsed looks like a snapshot, restore fields we expect
      if (parsed && typeof parsed === 'object') {
        // Map basic props
        state.startedAt = parsed.startedAt || state.startedAt;
        state.lastTick = parsed.lastTick || state.lastTick;
        state.secondsPlayed = parsed.secondsPlayed || state.secondsPlayed;
        state.resources = Object.assign({}, state.resources, parsed.resources || {});
        state.production = Object.assign({}, state.production, parsed.production || {});
        state.survivors = Array.isArray(parsed.survivors) ? parsed.survivors : state.survivors;
        state.nextSurvivorId = parsed.nextSurvivorId || state.nextSurvivorId;
        state.tiles = Array.isArray(parsed.tiles) && parsed.tiles.length > 0 ? parsed.tiles : state.tiles;
        state.mapSize = parsed.mapSize || state.mapSize;
        state.baseTile = parsed.baseTile || state.baseTile;
        state.explored = Array.isArray(parsed.explored) ? new Set(parsed.explored) : new Set();
        
        // Handle inventory migration from object to array
        if (Array.isArray(parsed.inventory)) {
          state.inventory = parsed.inventory;
        } else {
          state.inventory = []; // Reset inventory for old save formats
        }
        state.nextItemId = parsed.nextItemId || 1;

        state.equipment = Object.assign({}, state.equipment, parsed.equipment || {});
        state.systems = Object.assign({}, state.systems, parsed.systems || {});
        state.threat = Number(parsed.threat) || state.threat;
        state.baseIntegrity = Number(parsed.baseIntegrity) || state.baseIntegrity;
        state.boardRisk = Number(parsed.boardRisk) || state.boardRisk;
        state.journal = Array.isArray(parsed.journal) ? parsed.journal : state.journal;
        state.missions = Array.isArray(parsed.missions) ? parsed.missions : state.missions;
        state.timeNow = parsed.timeNow || Date.now();

        // sanitize numeric resource fields
        for (const k of ['oxygen', 'food', 'energy', 'scrap', 'tech', 'ammo']) {
          state.resources[k] = Number(state.resources[k]) || 0;
        }
        for (const k of ['oxygen', 'food', 'energy', 'scrap']) {
          state.production[k] = Number(state.production[k]) || 0;
        }
        // ensure survivors numeric fields
        state.survivors = state.survivors.map(s => ({
          id: Number(s.id) || 0,
          name: s.name || 'Unknown',
          level: Number(s.level) || 1,
          xp: Number(s.xp) || 0,
          nextXp: Number(s.nextXp) || 50,
          skill: Number(s.skill) || 1,
          hp: Number(s.hp) || 1,
          maxHp: Number(s.maxHp) || 1,
          morale: Number(s.morale) || 0,
          role: s.role || 'Idle',
          task: s.task || 'Idle',
          injured: !!s.injured,
          equipment: s.equipment || { weapon: null, armor: null }
        }));

        // ensure tiles exist
        if (!state.tiles || state.tiles.length === 0) initTiles();

        appendLog('[Loaded save]');
        handleOffline();
        return;
      }
    } catch (e) {
      console.error(e);
      appendLog('[Failed loading save: corrupt data]');
    }
  }
  initTiles();
  appendLog('[New game]');
}

function handleOffline() {
  const now = Date.now();
  const elapsed = Math.floor((now - (state.lastTick || state.timeNow || state.startedAt)) / 1000);
  if (elapsed <= 1) {
    state.lastTick = now;
    return;
  }
  appendLog(`Recovered ${elapsed}s of offline activity.`);
  for (let i = 0; i < elapsed; i++) applyTick(true);
  state.lastTick = now;
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
  const baseCost = 15;
  const survivorMult = Math.pow(1.5, state.survivors.length);
  const exploredDiscount = Math.min(0.5, state.explored.size / (state.mapSize.w * state.mapSize.h));
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
  const armorIndex = state.inventory.findIndex(item => item.type === 'armor' || item.type === 'heavyArmor');
  if (armorIndex !== -1 && !s.equipment.armor) {
    const armor = state.inventory.splice(armorIndex, 1)[0];
    s.equipment.armor = armor;
    appendLog(`${s.name} equipped ${armor.name}.`);
    updateUI();
    return;
  }
  appendLog(`${s.name} has nothing new to equip.`);
}

function revealRandomTiles(count = 1) {
  const uncovered = [];
  for (let i = 0; i < state.tiles.length; i++)
    if (!state.tiles[i].scouted) uncovered.push(i);
  if (uncovered.length === 0) return 0;
  let revealed = 0;
  for (let i = 0; i < count; i++) {
    if (uncovered.length === 0) break;
    const pickIdx = rand(0, uncovered.length - 1);
    const pick = uncovered.splice(pickIdx, 1)[0];
    state.tiles[pick].scouted = true;
    state.explored.add(pick);
    handleTileEvent(pick);
    revealed++;
  }
  return revealed;
}

function exploreTiles(count = 1) {
  const energyCost = 3;
  if (state.resources.energy < energyCost) {
    appendLog("Insufficient energy to explore.");
    return;
  }
  state.resources.energy -= energyCost;
  let got = revealRandomTiles(count);
  appendLog(`Exploration: revealed ${got} tile(s).`);
  updateUI();
}

function longRangeScan() {
  if (state.resources.energy < 10) {
    appendLog('Insufficient energy for long-range scan.');
    return;
  }
  state.resources.energy -= 10;
  let toReveal = rand(3, 7);
  revealRandomTiles(toReveal);
  appendLog('Long-range scan revealed nearby sectors.');
}

function handleTileEvent(idx) {
  const t = state.tiles[idx];
  const { x, y } = t;
  const explorer = state.survivors.find(s => s.id === selectedExplorerId);

  if (t.type === 'resource') {
    // produce loot
    const loot = pickLoot();
    const message = loot.onPickup(state);
    appendLog(`Scavenged ${loot.type} at (${x},${y}): ${message}`);
    if (explorer) grantXp(explorer, BALANCE.XP_FROM_LOOT);
    t.type = 'empty';
  } else if (t.type === 'survivor') {
    // recruit chance
    if (Math.random() < 0.85) {
      const foundName = getRandomName();
      recruitSurvivor(foundName);
      appendLog(`Rescued ${foundName} at (${x},${y}) who joins the base.`);
      if (explorer) grantXp(explorer, BALANCE.XP_FROM_LOOT * 2); // More XP for finding a person
    } else appendLog(`Signs of life at (${x},${y}) but no one remained.`);
    t.type = 'empty';
  } else if (t.type === 'alien') {
    // immediate encounter: spawn alien(s)
    spawnAlienEncounter(idx);
  } else if (t.type === 'hazard') {
    const explorer = state.survivors.find(s => s.id === selectedExplorerId);
    if (!explorer) {
      appendLog(`Detected hazard at (${x},${y}). No explorer selected.`);
      return;
    }
    const hasHazmat = explorer.equipment.armor?.type === 'hazmatSuit';
    if (!hasHazmat) {
      appendLog(`Detected hazard at (${x},${y}). Hazmat Suit required.`);
      return;
    }
    
    // Successful hazard room clear
    explorer.equipment.armor.durability -= rand(15, 25); // Damage the suit
    if (explorer.equipment.armor.durability <= 0) {
      appendLog(`${explorer.name}'s Hazmat Suit was destroyed clearing the hazard.`);
      explorer.equipment.armor = null;
    }

    // Extra XP for clearing hazard
    grantXp(explorer, BALANCE.XP_FROM_LOOT * 3);
    
    // Better loot chances
    for (let i = 0; i < 3; i++) {
      const loot = pickLoot();
      const message = loot.onPickup(state);
      appendLog(`${explorer.name} found ${message}`);
    }

    appendLog(`${explorer.name} successfully cleared the hazardous area.`);
    t.type = 'empty';
  } else if (t.type === 'module') {
    // grant a minor system node or tech
    state.resources.tech += 1;
    appendLog(`Found a module node at (${x},${y}). Tech +1.`);
    if (explorer) grantXp(explorer, BALANCE.XP_FROM_LOOT);
    t.type = 'empty';
  } else {
    appendLog(`Empty corridor at (${x},${y}).`);
  }
}

function spawnAlienEncounter(idx) {
  const t = state.tiles[idx];
  // decide group size
  const size = rand(1, 3);
  for (let i = 0; i < size; i++) {
    const at = ALIEN_TYPES[rand(0, ALIEN_TYPES.length - 1)];
    const hp = rand(at.hpRange[0], at.hpRange[1]);
    t.aliens.push({
      type: at.id,
      name: at.name,
      hp,
      maxHp: hp,
      attack: rand(at.attackRange[0], at.attackRange[1]),
      stealth: at.stealth,
      flavor: at.flavor
    });
  }
  appendLog(`Encountered ${t.aliens.length} alien(s) in this sector.`);
  // immediate skirmish using current team (scout)
  resolveSkirmish(t.aliens, 'field', idx);
}

function resolveSkirmish(aliens, context = 'field', idx = null) {
  let fighters = [];
  if (context === 'field') {
    const explorer = state.survivors.find(s => s.id === selectedExplorerId);
    if (explorer) {
      fighters.push(explorer);
    }
  } else { // context === 'base' for raids
    fighters = state.survivors.filter(s => s.task === 'Guard').slice(0, 4);
  }

  if (fighters.length === 0) {
    // no defenders: aliens may increase threat or seed a nest
    appendLog('No defenders available: alien presence grows.');
    state.threat += aliens.length * rand(1, 3);
    // chance of nest established
    if (Math.random() < 0.25) {
      appendLog('Aliens established a nest nearby.');
      if (idx !== null) state.tiles[idx].type = 'alien';
    }
    return;
  }
  appendLog(`Battle begins: ${fighters.length} survivor(s) vs ${aliens.length} alien(s).`);
  // simplistic round-based combat
  while (aliens.some(a => a.hp > 0) && fighters.some(f => f.hp > 0)) {
    // survivors attack
    for (const s of fighters) {
      if (s.hp <= 0) continue;
      // choose target
      const target = aliens.find(a => a.hp > 0);
      if (!target) break;
      let baseAtk = 2 + s.skill + (s.level * BALANCE.LEVEL_ATTACK_BONUS);
      if (s.equipment.weapon === 'Pulse Rifle') baseAtk += 6;
      // ammo check
      if (state.resources.ammo <= 0) {
        appendLog(`${s.name} attempted to fire but no ammo.`);
        baseAtk = Math.max(1, Math.floor(baseAtk / 2));
      } else {
        // consume ammo some chance
        if (Math.random() < 0.6) state.resources.ammo = Math.max(0, state.resources.ammo - 1);
      }
      const dmg = rand(Math.max(1, baseAtk - 1), baseAtk + 2);
      target.hp -= dmg;
      appendLog(`${s.name} hits ${target.name} for ${dmg} dmg.`);
      if (target.hp <= 0) {
        appendLog(`${target.name} downed.`);
        // loot on kill
        const loot = pickLoot();
        loot.onPickup(state);
      }
    }
    // aliens attack back
    for (const a of aliens) {
      if (a.hp <= 0) continue;
      // choose random survivor alive
      const targ = fighters.find(x => x.hp > 0);
      if (!targ) break;
      const aDmg = rand(Math.max(1, a.attack - 1), a.attack + 1);
      // armor reduces damage
      let defense = 0;
      if (targ.equipment.armor === 'Light Armor') defense += 2;
      targ.hp -= Math.max(0, aDmg - defense);
      appendLog(`${a.name} strikes ${targ.name} for ${Math.max(0, aDmg - defense)} dmg.`);
      if (targ.hp <= 0) {
        appendLog(`${targ.name} incapacitated in combat.`);
      }
    }
    // quick break safety
    if (Math.random() < 0.001) break;
  }
  // resolve aftermath: remove dead survivors
  state.survivors = state.survivors.filter(s => {
    if (s.hp <= 0) {
      appendLog(`${s.name} was lost.`);
      return false;
    }
    return true;
  });
  // if all aliens dead, clear tile
  if (idx !== null && state.tiles[idx]) {
    if (!state.tiles[idx].aliens.some(a => a.hp > 0)) {
      state.tiles[idx].aliens = [];
      state.tiles[idx].type = 'empty';
      appendLog('Area cleared.');
    }
  }
  // survivors gain xp
  for (const s of fighters) {
    if (s.hp > 0) {
      grantXp(s, rand(10, 20));
    }
  }
  updateUI();
}

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
  const cost = 50 + state.systems.filter * 25;
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
  const cost = 45 + state.systems.generator * 22;
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
  const cost = 75;
  if (state.resources.scrap < cost || state.resources.energy < 40) {
    appendLog('Not enough resources to build turret.');
    return;
  }
  state.resources.scrap -= cost;
  state.resources.energy -= 40;
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

  const repairCost = Math.ceil((item.maxDurability - item.durability) * 0.5); // Example cost calculation
  if (state.resources.scrap < repairCost) {
    appendLog(`Not enough scrap to repair. Need ${repairCost}.`);
    return;
  }

  state.resources.scrap -= repairCost;
  item.durability = item.maxDurability;
  appendLog(`${item.name} repaired for ${repairCost} scrap.`);
  updateUI();
}

function startExpedition(name = 'Expedition', duration = 30) {
  if (selectedExpeditionSurvivorId === null) {
    appendLog('No survivor selected for expedition.');
    return;
  }

  const survivor = state.survivors.find(s => s.id === selectedExpeditionSurvivorId);
  if (!survivor || survivor.onMission) {
    appendLog('Selected survivor is not available for an expedition.');
    return;
  }

  // Check for expedition costs
  if (state.resources.food < BALANCE.EXPEDITION_COST_FOOD || state.resources.energy < BALANCE.EXPEDITION_COST_ENERGY) {
    appendLog(`Not enough resources for an expedition. Need ${BALANCE.EXPEDITION_COST_FOOD} Food and ${BALANCE.EXPEDITION_COST_ENERGY} Energy.`);
    return;
  }

  // Deduct costs
  state.resources.food -= BALANCE.EXPEDITION_COST_FOOD;
  state.resources.energy -= BALANCE.EXPEDITION_COST_ENERGY;

  survivor.onMission = true;
  activeDropdown = null;

  const mission = {
    id: Date.now(),
    name,
    party: [survivor.id],
    startedAt: Date.now(),
    durationSec: duration,
    progress: 0,
    status: 'active'
  };
  state.missions.push(mission);
  appendLog(`${survivor.name} departs on ${name} (${duration}s).`);
  updateUI();
}

function tickMissions() {
  const now = Date.now();
  for (const m of state.missions) {
    if (m.status !== 'active') continue;
    const elapsed = Math.floor((now - m.startedAt) / 1000);
    m.progress = elapsed;
    if (m.progress >= m.durationSec) {
      const survivor = state.survivors.find(s => s.id === m.party[0]);
      if (survivor) {
        survivor.onMission = false;
        const success = Math.random() < BALANCE.EXPEDITION_SUCCESS_CHANCE;
        let report = `${m.name} completed. `;
        if (success) {
          grantXp(survivor, BALANCE.XP_FROM_EXPEDITION_SUCCESS);
          const scrapFound = rand(10, 30);
          const techFound = rand(1, 4);
          state.resources.scrap += scrapFound;
          state.resources.tech += techFound;
          report += `Found ${scrapFound} scrap and ${techFound} tech. `;
          if (survivor.equipment.weapon) {
            survivor.equipment.weapon.durability -= rand(5, 15);
            if (survivor.equipment.weapon.durability <= 0) {
              report += `${survivor.equipment.weapon.name} broke. `;
              survivor.equipment.weapon = null;
            }
          }
          if (survivor.equipment.armor) {
            survivor.equipment.armor.durability -= rand(10, 25);
            if (survivor.equipment.armor.durability <= 0) {
              report += `${survivor.equipment.armor.name} broke. `;
              survivor.equipment.armor = null;
            }
          }
        } else {
          grantXp(survivor, BALANCE.XP_FROM_EXPEDITION_FAILURE);
          report += 'Encountered heavy resistance. ';
          survivor.hp -= rand(5, 15);
          if (survivor.hp <= 0) {
            report += `${survivor.name} was lost.`;
            state.survivors = state.survivors.filter(s => s.id !== survivor.id);
          }
        }
        appendLog(report);
      }
      m.status = 'complete';
    }
  }
  // prune completed after some time
  state.missions = state.missions.filter(m => m.status === 'active' || (m.status === 'complete' && Date.now() - m.startedAt < 30000));
}

function evaluateThreat() {
  // base threat increases slowly; guards reduce it
  const guards = state.survivors.filter(s => s.task === 'Guard').length;
  const threatChange = 0.05 + Math.random() * 0.06 - guards * 0.08;
  state.threat = clamp(state.threat + threatChange, 0, 100);
  // base board risk derived from threat and broken systems
  state.boardRisk = clamp((state.threat / 120) + (state.systems.turret ? 0 : 0.05), 0, 1);
  // possible raid
  if (Math.random() < Math.min(BALANCE.RAID_BASE_CHANCE + state.threat / BALANCE.RAID_THREAT_DIVISOR, BALANCE.RAID_MAX_CHANCE)) {
    // raid occurs
    resolveRaid();
  }
}

function resolveRaid() {
  appendLog('Alarm: unidentified activity detected near the base — a raid is incoming.');
  const turretPower = state.systems.turret * 12;
  const guardPower = state.survivors.filter(s => s.task === 'Guard').length * 4;
  const armorBonus = state.survivors.reduce((total, s) => {
    if (s.equipment.armor) {
      return total + (s.equipment.armor.type === 'heavyArmor' ? 4 : 2);
    }
    return total;
  }, 0);
  const defense = turretPower + guardPower + armorBonus;
  const attack = rand(8, 30) + Math.floor(state.threat / 2);
  if (defense >= attack || Math.random() < 0.3) {
    appendLog('Raid repelled by base defenses.');
    // small loot or scrap recovered
    state.resources.scrap += rand(2, 10);
    state.threat = clamp(state.threat - 3, 0, 100);
  } else {
    appendLog('Raid breached outer perimeter. Boarding risk increased.');
    state.baseIntegrity -= rand(4, 12);
    // chance of internal breach
    if (Math.random() < 0.25) {
      // spawn internal alien in a nearby explored tile
      const explored = Array.from(state.explored);
      if (explored.length > 0) {
        const tileIdx = explored[rand(0, explored.length - 1)];
        state.tiles[tileIdx].type = 'alien';
        appendLog('An alien force has boarded and established a presence inside the station.');
      }
    }
    // casualties
    if (Math.random() < 0.12 && state.survivors.length > 0) {
      const idx = rand(0, state.survivors.length - 1);
      appendLog(`${state.survivors[idx].name} lost defending the base.`);
      state.survivors.splice(idx, 1);
    }
  }
}

function applyTick(isOffline = false) {
  // production by survivors assigned
  let prod = { oxygen: 0, food: 0, energy: 0, scrap: 0 };
  const activeSurvivors = state.survivors.filter(s => !s.onMission);

  activeSurvivors.forEach(s => {
    const levelBonus = 1 + (s.level - 1) * BALANCE.LEVEL_PRODUCTION_BONUS;
    switch (s.task) {
      case 'Oxygen':
        prod.oxygen += (0.9 + s.skill * 0.05) * levelBonus;
        break;
      case 'Food':
        prod.food += (0.7 + s.skill * 0.03) * levelBonus;
        break;
      case 'Energy':
        prod.energy += (0.9 + s.skill * 0.05) * levelBonus;
        break;
      case 'Scrap':
        prod.scrap += (0.8 + s.skill * 0.05) * levelBonus;
        break;
      case 'Guard':
        /* reduces threat growth */ break;
      case 'Explore':
        /* handled by manual exploration/missions */ break;
      default: // Idle
        prod.oxygen += 0.03; // Idle survivors produce a tiny bit of O2
        break;
    }
  });
  // systems contribute
  prod.oxygen += state.systems.filter * 1.2 * BALANCE.SYSTEM_FILTER_MULT;
  prod.energy += state.systems.generator * 1.4 * BALANCE.SYSTEM_GENERATOR_MULT;
  // apply production multiplier for survivors/systems
  prod.oxygen *= BALANCE.PROD_MULT;
  prod.food *= BALANCE.PROD_MULT;
  prod.energy *= BALANCE.PROD_MULT;
  prod.scrap *= BALANCE.PROD_MULT;
  // apply
  state.production = prod;
  state.resources.oxygen += prod.oxygen;
  state.resources.food += prod.food * 0.6;
  state.resources.energy += prod.energy;
  state.resources.scrap += prod.scrap;
  // consumption
  const o2Consume = BALANCE.O2_BASE + activeSurvivors.length * BALANCE.O2_PER_SURVIVOR;
  const foodConsume = BALANCE.FOOD_BASE + activeSurvivors.length * BALANCE.FOOD_PER_SURVIVOR;
  state.resources.oxygen -= o2Consume;
  state.resources.food -= foodConsume;
  // passive energy drain
  state.resources.energy = Math.max(0, state.resources.energy - 0.06 - state.systems.turret * 0.03);
  // Prevent resources from going negative
  state.resources.oxygen = Math.max(0, state.resources.oxygen);
  state.resources.food = Math.max(0, state.resources.food);
  state.resources.energy = Math.max(0, state.resources.energy);
  state.resources.scrap = Math.max(0, state.resources.scrap);
  state.resources.ammo = Math.max(0, state.resources.ammo);
  state.resources.tech = Math.max(0, state.resources.tech);
  // threat & missions & raids
  evaluateThreat();
  tickMissions();
  // consequences
  // Oxygen critical state: warn, damage, and morale loss
  if (state.resources.oxygen <= BALANCE.OXY_CRITICAL_THRESHOLD) {
    if (state.secondsPlayed % 5 === 0) appendLog('Critical: oxygen supplies near collapse.');
    state.baseIntegrity -= 0.12;
    state.survivors.forEach(s => s.morale -= 0.4);
  }
  // If oxygen fully depleted, survivors take asphyxiation damage each tick
  if (state.resources.oxygen <= 0) {
    state.survivors.forEach(s => {
      const dmg = rand(BALANCE.OXY_DAMAGE_RANGE[0], BALANCE.OXY_DAMAGE_RANGE[1]);
      s.hp = Math.max(0, s.hp - dmg);
      s.morale = Math.max(0, s.morale - 0.6);
    });
    if (state.secondsPlayed % 5 === 0) appendLog('Oxygen depleted: survivors are taking asphyxiation damage.');
  }

  // Food depletion: morale loss and occasional starvation damage
  if (state.resources.food <= 0) {
    // morale gradually drops
    state.survivors.forEach(s => s.morale = Math.max(0, s.morale - 0.25));
    // occasional starvation casualties
    if (state.survivors.length > 0 && Math.random() < BALANCE.STARVATION_CHANCE) {
      const idx = rand(0, state.survivors.length - 1);
      appendLog(`${state.survivors[idx].name} succumbed to hunger.`);
      state.survivors.splice(idx, 1);
    }
  }
  // base integrity clamp
  state.baseIntegrity = clamp(state.baseIntegrity, -20, 100);
  // Remove dead survivors after tick and report deaths
  if (state.survivors.length > 0) {
    const beforeCount = state.survivors.length;
    state.survivors = state.survivors.filter(s => {
      if (Number(s.hp) <= 0) {
        appendLog(`${s.name} has died.`);
        return false;
      }
      return true;
    });
    if (state.survivors.length !== beforeCount) updateUI();
  }
  if (!isOffline) state.secondsPlayed++;
  state.lastTick = Date.now();
}
