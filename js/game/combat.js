// Combat System
// Handles alien encounters, skirmishes, damage calculation

function calculateAttackDamage(survivor) {
  let baseAtk = 2 + survivor.skill + (survivor.level * BALANCE.LEVEL_ATTACK_BONUS);
  
  // Apply weapon bonuses
  if (survivor.equipment.weapon?.type === 'rifle') {
     baseAtk += 8;
  } else if (survivor.equipment.weapon?.type === 'shotgun') {
     baseAtk += rand(6, 12); // Shotgun has variable damage
  }
  
  return baseAtk;
}

function calculateDefense(survivor) {
  let defense = 0;
  if (survivor.equipment.armor?.type === 'armor') {
     defense += 3; // Light Armor
  } else if (survivor.equipment.armor?.type === 'heavyArmor') {
     defense += 6; // Heavy Armor
  } else if (survivor.equipment.armor?.type === 'hazmatSuit') {
     defense += 3; // Hazmat Suit (some protection)
  }
  return defense;
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
  // If interactive combat is available and an explorer is selected, open it; otherwise auto-resolve
  if (typeof interactiveEncounterAtTile === 'function' && selectedExplorerId != null) {
    interactiveEncounterAtTile(idx);
  } else {
    resolveSkirmish(t.aliens, 'field', idx);
  }
}

function resolveSkirmish(aliens, context = 'field', idx = null) {
  let fighters = [];
  if (context === 'field') {
    const explorer = state.survivors.find(s => s.id === selectedExplorerId);
    if (explorer) {
      fighters.push(explorer);
    }
  } else { // context === 'base' for raids - ONLY GUARDS defend (0.7.1)
    fighters = state.survivors.filter(s => s.task === 'Guard' && !s.onMission);
  }

  if (fighters.length === 0) {
    // no defenders: GAME OVER if raid (0.7.1)
    if (context === 'base') {
      appendLog('No guards on duty: base is overrun.');
      triggerGameOver('The base fell with no defenders. All is lost.');
      return;
    }
    // field: aliens may increase threat or seed a nest
    appendLog('No defenders available: alien presence grows.');
    state.threat += aliens.length * rand(BALANCE.THREAT_GAIN_PER_ALIEN[0], BALANCE.THREAT_GAIN_PER_ALIEN[1]);
    // chance of nest established
    if (Math.random() < BALANCE.NEST_CHANCE_NO_DEFEND) {
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
      
      let baseAtk = calculateAttackDamage(s);
      
      // ammo check
      if (state.resources.ammo <= 0) {
        appendLog(`${s.name} attempted to fire but no ammo.`);
        baseAtk = Math.max(1, Math.floor(baseAtk / 2));
      } else {
        // consume ammo some chance
        if (Math.random() < BALANCE.AMMO_CONSUME_CHANCE) state.resources.ammo = Math.max(0, state.resources.ammo - 1);
      }
      
      const dmg = rand(Math.max(1, baseAtk - 1), baseAtk + 2);
      target.hp -= dmg;
      appendLog(`${s.name} hits ${target.name} for ${dmg} dmg.`);
      
      if (target.hp <= 0) {
        appendLog(`${target.name} downed.`);
        state.alienKills = (state.alienKills || 0) + 1;
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
      const defense = calculateDefense(targ);
      
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
  
  // Check if raid failed (0.7.1 - game over on raid defeat)
  if (context === 'base' && aliens.some(a => a.hp > 0)) {
    // Guards lost = game over
    triggerGameOver('The guards fell and the base was overrun. Game Over.');
    return;
  }
  
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
      grantXp(s, rand(BALANCE.COMBAT_XP_RANGE[0], BALANCE.COMBAT_XP_RANGE[1]));
    }
  }
  
  updateUI();
}
