// Combat System
// Handles alien encounters, skirmishes, damage calculation

// 0.8.0 - Helper: Check if survivor has a specific ability
function hasAbility(survivor, abilityId) {
  return survivor.abilities && survivor.abilities.includes(abilityId);
}

// 0.8.0 - Helper: Check if alien has a specific modifier
function hasModifier(alien, modifierId) {
  return alien.modifiers && alien.modifiers.includes(modifierId);
}

// 0.8.6 - Helper: Get class bonuses for a survivor
function getClassBonuses(survivor) {
  if (!survivor.class) return {};
  const classInfo = SURVIVOR_CLASSES.find(c => c.id === survivor.class);
  return classInfo ? classInfo.bonuses : {};
}

// 0.8.0 - Helper: Apply survivor ability effects to damage
function applyAbilityDamageModifiers(survivor, baseDamage, context = {}) {
  let damage = baseDamage;
  
  // 0.8.6 - Soldier class bonus: +15% combat damage
  const classBonuses = getClassBonuses(survivor);
  if (classBonuses.combat) damage *= classBonuses.combat;
  
  // Soldier abilities
  if (hasAbility(survivor, 'veteran')) damage *= 1.2; // +20% damage
  if (hasAbility(survivor, 'berserker') && survivor.hp < survivor.maxHp * 0.3) damage *= 1.3; // +30% below 30% HP
  
  // Guardian abilities
  if (hasAbility(survivor, 'last') && context.allyCount === 1) damage *= 1.5; // +50% when alone
  
  // Guardian Commander: +10% to nearby allies (implemented by checking party for commanders)
  if (context.fighters) {
    const hasCommander = context.fighters.some(f => f !== survivor && f.hp > 0 && hasAbility(f, 'commander'));
    if (hasCommander) damage = Math.floor(damage * 1.10);
  }
  
  return Math.round(damage);
}

// 0.8.0 - Helper: Apply survivor ability effects to hit/crit chance
function applyAbilityHitModifiers(survivor) {
  let hitBonus = 0;
  let critBonus = 0;
  let dodgeChance = 0;
  
  // 0.8.6 - Soldier class bonuses: +10% hit, +15% crit
  const classBonuses = getClassBonuses(survivor);
  if (survivor.class === 'soldier') {
    hitBonus += 0.10; // +10% hit
    critBonus += 0.15; // +15% crit
  }
  
  // 0.8.6 - Scout class bonus: +15% dodge (matches exploration 0.8 = -20% cost, so ~15% effective)
  if (survivor.class === 'scout' && classBonuses.dodge) {
    dodgeChance += 0.15; // base 15% from class
  }
  
  if (hasAbility(survivor, 'marksman')) hitBonus += 0.10; // +10% hit
  if (hasAbility(survivor, 'tactical')) critBonus += 0.15; // +15% crit
  
  // Scout evasion abilities (stack with class bonus)
  if (hasAbility(survivor, 'evasive')) dodgeChance += 0.20; // 20% dodge
  if (hasAbility(survivor, 'ghost')) dodgeChance += 0.35; // 35% dodge
  
  return { hitBonus, critBonus, dodgeChance };
}

// 0.8.0 - Helper: Apply survivor defensive abilities
function applyAbilityDefenseModifiers(survivor, baseDef, context = {}) {
  let defense = baseDef;
  
  // 0.8.6 - Guardian class bonus: +3 defense
  if (survivor.class === 'guardian') {
    defense += 3;
  }
  
  // Guardian abilities
  if (hasAbility(survivor, 'stalwart') && survivor.task === 'Guard') defense += 3;
  if (hasAbility(survivor, 'fortress')) defense += 5;
  
  // Guardian Fortress: +3 def to nearby allies
  if (context.fighters) {
    const hasFortress = context.fighters.some(f => f !== survivor && f.hp > 0 && hasAbility(f, 'fortress'));
    if (hasFortress) defense += 3;
  }
  
  return defense;
}

// 0.8.0 - Helper: Apply alien modifier effects to stats
function applyModifierStatEffects(alien) {
  let hpMult = 1;
  let atkBonus = 0;
  let defBonus = 0;
  let dodgeBonus = 0;
  let phaseBonus = 0;
  
  // Universal modifiers across all types
  if (hasModifier(alien, 'aggressive')) atkBonus += 2;
  if (hasModifier(alien, 'resilient')) hpMult += 0.5;
  
  // Drone modifiers
  if (hasModifier(alien, 'swift')) dodgeBonus += 0.30;
  if (hasModifier(alien, 'alpha')) { atkBonus += 4; dodgeBonus += 0.50; }
  
  // Lurker modifiers handled in ambush logic
  
  // Stalker modifiers handled in pack logic
  if (hasModifier(alien, 'feral')) atkBonus += 3; // Applied when pack is active
  if (hasModifier(alien, 'pack_leader')) atkBonus += 2; // Allies gain +2, handled separately
  if (hasModifier(alien, 'dire')) atkBonus += 6; // Massive bonus when pack active
  
  // Spitter modifiers
  if (hasModifier(alien, 'corrosive')) defBonus -= 999; // Signal full armor pierce
  
  // Brood modifiers
  if (hasModifier(alien, 'thick')) hpMult += 0.30;
  if (hasModifier(alien, 'enraged')) atkBonus += 4; // Applied when below 50% HP
  if (hasModifier(alien, 'titan')) { hpMult += 0.40; atkBonus += 3; }
  
  // Ravager modifiers
  if (hasModifier(alien, 'hardened')) defBonus += 0.60; // Take 60% less (stacks with armored)
  if (hasModifier(alien, 'crusher')) atkBonus += 4;
  if (hasModifier(alien, 'juggernaut')) hpMult += 0.30;
  if (hasModifier(alien, 'colossus')) { defBonus += 0.70; atkBonus += 6; hpMult += 0.40; }
  
  // Spectre modifiers
  if (hasModifier(alien, 'ethereal')) phaseBonus += 0.10;
  if (hasModifier(alien, 'void')) phaseBonus += 0.60;
  
  // Queen modifiers
  if (hasModifier(alien, 'dominant')) atkBonus += 3;
  if (hasModifier(alien, 'ancient')) { atkBonus += 2; hpMult += 0.30; }
  if (hasModifier(alien, 'empress')) atkBonus += 20; // Handled in multi-strike logic
  
  return { hpMult, atkBonus, defBonus, dodgeBonus, phaseBonus };
}

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
    // 0.8.2 - Bias alien type based on current threat for progression
    const at = (typeof pickAlienTypeByThreat === 'function')
      ? pickAlienTypeByThreat(state.threat)
      : ALIEN_TYPES[rand(0, ALIEN_TYPES.length - 1)];
    const hp = rand(at.hpRange[0], at.hpRange[1]);
    
    // 0.8.0 - Roll for rare modifiers (use rollAlienModifiers from threat.js)
    const modifiers = rollAlienModifiers(at.id);
    
    t.aliens.push({
      type: at.id,
      name: at.name,
      hp,
      maxHp: hp,
      attack: rand(at.attackRange[0], at.attackRange[1]),
      stealth: at.stealth,
      flavor: at.flavor,
      special: at.special,
      specialDesc: at.specialDesc,
      modifiers: modifiers, // 0.8.0
      firstStrike: true // Track if alien has attacked yet (for ambush)
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
    // Apply poison damage at start of round
    for (const s of fighters) {
      if (s._poisonStacks && s._poisonStacks > 0 && s.hp > 0) {
        const poisonDmg = s._poisonStacks;
        s.hp = Math.max(0, s.hp - poisonDmg);
        appendLog(`${s.name} takes ${poisonDmg} poison damage.`);
        if (s.hp <= 0) {
          appendLog(`${s.name} succumbs to poison.`);
        }
      }
    }
    
    // Alien regeneration phase (brood special)
    for (const a of aliens) {
      if (a.hp <= 0 || a.special !== 'regeneration') continue;
      let healAmount = rand(2, 4);
      
      // 0.8.0 - Brood modifiers
      if (hasModifier(a, 'fastHeal')) healAmount += 2;
      if (hasModifier(a, 'titan')) healAmount += 4;
      
      a.hp = Math.min(a.maxHp, a.hp + healAmount);
      if (healAmount > 0) appendLog(`${a.name} regenerates ${healAmount} HP.`);
    }
    
    // 0.8.0 - Hivemind: Queen resurrects fallen drones
    const queens = aliens.filter(a => a.hp > 0 && a.type === 'queen' && hasModifier(a, 'hivemind'));
    for (const queen of queens) {
      if (queen._hivemindUsed) continue; // Once per combat
      const deadDrones = aliens.filter(a => a.hp <= 0 && a.type === 'drone');
      if (deadDrones.length > 0) {
        const resurrected = deadDrones[0];
        resurrected.hp = Math.floor(resurrected.maxHp * 0.5);
        queen._hivemindUsed = true;
        appendLog(`${queen.name}'s Hivemind resurrects ${resurrected.name}!`);
      }
    }
    
    // survivors attack
    for (const s of fighters) {
      if (s.hp <= 0) continue;
      // choose target
      const target = aliens.find(a => a.hp > 0);
      if (!target) break;
      
      let baseAtk = calculateAttackDamage(s);
      
      // 0.8.0 - Apply survivor ability damage modifiers
      const allyCount = fighters.filter(f => f.hp > 0).length;
      baseAtk = applyAbilityDamageModifiers(s, baseAtk, { allyCount, fighters });
      
      // ammo check
      if (state.resources.ammo <= 0) {
        appendLog(`${s.name} attempted to fire but no ammo.`);
        baseAtk = Math.max(1, Math.floor(baseAtk / 2));
      } else {
        // consume ammo some chance
        if (Math.random() < BALANCE.AMMO_CONSUME_CHANCE) state.resources.ammo = Math.max(0, state.resources.ammo - 1);
      }
      
      let dmg = rand(Math.max(1, baseAtk - 1), baseAtk + 2);
      
      // 0.8.0 - Apply hit/crit modifiers from abilities
      const { hitBonus, critBonus } = applyAbilityHitModifiers(s);
      const hitChance = 0.75 + hitBonus;
      const critChance = 0.12 + critBonus;
      
      // Miss check
      if (Math.random() > hitChance) {
        appendLog(`${s.name} misses ${target.name}!`);
        continue;
      }
      
      // Crit check
      if (Math.random() < critChance) {
        dmg = Math.floor(dmg * 1.6);
        appendLog(`${s.name} scores a critical hit!`);
      }
      
      // Apply alien special defenses
      // 0.8.0 - Check modifiers for enhanced dodge/phase
      const modStats = applyModifierStatEffects(target);
      const totalDodge = (target.special === 'dodge' ? 0.25 : 0) + modStats.dodgeBonus;
      const totalPhase = (target.special === 'phase' ? 0.40 : 0) + modStats.phaseBonus;
      
      if (target.special === 'dodge' && Math.random() < totalDodge) {
        appendLog(`${target.name} dodges ${s.name}'s attack!`);
        continue;
      }
      if (target.special === 'phase' && Math.random() < totalPhase) {
        appendLog(`${target.name} phases out, avoiding damage!`);
        
        // 0.8.0 - Mark as just phased for Wraith modifier
        target._justPhased = true;
        
        // 0.8.0 - Blink Strike: counter-attack after successful phase
        if (hasModifier(target, 'blink') && s.hp > 0) {
          const blinkDmg = rand(Math.max(1, target.attack - 1), target.attack + 1);
          s.hp -= blinkDmg;
          appendLog(`${target.name} blinks behind ${s.name} for ${blinkDmg} damage!`);
        }
        
        // 0.8.0 - Void Touched: phase drains HP
        if (hasModifier(target, 'void')) {
          target.hp -= 2;
          appendLog(`${target.name} suffers void corruption (-2 HP).`);
        }
        
        continue;
      }
      if (target.special === 'armored' || modStats.defBonus > 0) {
        let resist = 0.5;
        if (hasModifier(target, 'hardened')) resist = 0.60;
        if (hasModifier(target, 'colossus')) resist = 0.70;
        dmg = Math.floor(dmg * (1 - resist));
        appendLog(`${target.name}'s armor absorbs damage.`);
      }
      
      target.hp -= dmg;
      appendLog(`${s.name} hits ${target.name} for ${dmg} dmg.`);
      
      if (target.hp <= 0) {
        appendLog(`${target.name} downed.`);
        state.alienKills = (state.alienKills || 0) + 1;
        
        // 0.8.0 - Spawner: summon drone on death
        if (hasModifier(target, 'spawner')) {
          const droneType = ALIEN_TYPES.find(at => at.id === 'drone');
          if (droneType) {
            const spawnedHp = rand(droneType.hpRange[0], droneType.hpRange[1]);
            aliens.push({
              type: 'drone',
              name: 'Spawned Drone',
              hp: spawnedHp,
              maxHp: spawnedHp,
              attack: rand(droneType.attackRange[0], droneType.attackRange[1]),
              stealth: droneType.stealth,
              flavor: droneType.flavor,
              special: droneType.special,
              specialDesc: droneType.specialDesc,
              modifiers: [],
              firstStrike: true
            });
            appendLog(`${target.name} spawns a drone as it dies!`);
          }
        }
        
        // loot on kill
        const loot = pickLoot();
        loot.onPickup(state);
        // 0.8.0 - Scientist Xenobiologist: tech on alien kill
        if (hasAbility(s, 'xenobiologist')) {
          state.resources.tech += 1;
          appendLog(`${s.name} extracts alien tech.`);
        }
      }
    }
    
    // aliens attack back
    for (const a of aliens) {
      if (a.hp <= 0) continue;
      
      // Multi-strike special (queen)
      let attackCount = (a.special === 'multistrike') ? 2 : 1;
      // 0.8.0 - Empress modifier adds third attack
      if (hasModifier(a, 'empress')) attackCount = 3;
      
      for (let strike = 0; strike < attackCount; strike++) {
        // choose random survivor alive
        const targ = fighters.find(x => x.hp > 0);
        if (!targ) break;
        
        // 0.8.0 - Get modifier stat bonuses
        const modStats = applyModifierStatEffects(a);
        
        let aDmg = rand(Math.max(1, a.attack - 1), a.attack + 1);
        aDmg += modStats.atkBonus;
        
        // 0.8.0 - Wraith: +50% damage after phasing
        if (hasModifier(a, 'wraith') && a._justPhased) {
          aDmg = Math.floor(aDmg * 1.5);
          appendLog(`${a.name} strikes from the void!`);
          a._justPhased = false; // Clear flag
        }
        
        // Apply alien special attack modifiers
        if (a.special === 'ambush' && a.firstStrike) {
          let ambushMult = 1.5;
          // 0.8.0 - Lurker modifiers
          if (hasModifier(a, 'silent')) ambushMult = 1.7;
          if (hasModifier(a, 'nightmare')) ambushMult = 2.0; // Also ignores armor
          
          aDmg = Math.floor(aDmg * ambushMult);
          a.firstStrike = false;
          appendLog(`${a.name} ambushes from the shadows!`);
        }
        // 0.8.0 - Cunning: second ambush at 50% HP
        if (hasModifier(a, 'cunning') && a.hp < a.maxHp * 0.5 && !a._cunningUsed) {
          aDmg = Math.floor(aDmg * 1.5);
          a._cunningUsed = true;
          appendLog(`${a.name} strikes with renewed cunning!`);
        }
        if (a.special === 'pack') {
          const allyCount = aliens.filter(al => al.hp > 0 && al !== a).length;
          let packBonus = allyCount * 2;
          
          // 0.8.0 - Stalker modifiers
          if (hasModifier(a, 'coordinated')) packBonus = Math.floor(packBonus * 1.5);
          if (hasModifier(a, 'feral') && allyCount > 0) packBonus += 3;
          if (hasModifier(a, 'dire')) packBonus *= 2;
          
          aDmg += packBonus;
          if (allyCount > 0) appendLog(`${a.name} is empowered by pack tactics.`);
        }
        
        let defense = calculateDefense(targ);
        // 0.8.0 - Apply survivor defensive abilities
        defense = applyAbilityDefenseModifiers(targ, defense, { fighters });
        
        // 0.8.0 - Check for survivor dodge abilities
        const { dodgeChance } = applyAbilityHitModifiers(targ);
        if (dodgeChance > 0 && Math.random() < dodgeChance) {
          appendLog(`${targ.name} dodges the attack!`);
          continue;
        }
        
        // Piercing special (spitter) - ignore 50% of armor
        if (a.special === 'piercing') {
          defense = Math.floor(defense * 0.5);
          // 0.8.0 - Spitter modifiers
          if (hasModifier(a, 'corrosive')) defense = Math.floor(defense * 0.30); // 70% ignore
          if (hasModifier(a, 'plague')) defense = 0; // Full pierce
          
          appendLog(`${a.name} sprays corrosive bile!`);
        }
        
        // 0.8.0 - Nightmare modifier ignores armor completely
        if (hasModifier(a, 'nightmare')) defense = 0;
        
        // 0.8.0 - Enraged modifier below 50% HP
        if (hasModifier(a, 'enraged') && a.hp < a.maxHp * 0.5) {
          aDmg += 4;
          appendLog(`${a.name} is enraged!`);
        }
        
        // 0.8.0 - Living Shield: Guardian intercepts damage for ally
        let actualTarget = targ;
        const guardians = fighters.filter(g => g.hp > 0 && hasAbility(g, 'shield') && !g._shieldUsed && g !== targ);
        if (guardians.length > 0 && Math.random() < 0.50) { // 50% chance to intercept
          actualTarget = guardians[0];
          actualTarget._shieldUsed = true;
          appendLog(`${actualTarget.name} intercepts the attack with Living Shield!`);
        }
        
        const dealt = Math.max(0, aDmg - defense);
        actualTarget.hp -= dealt;
        appendLog(`${a.name} strikes ${actualTarget.name} for ${dealt} dmg.`);
        
        // Check if original target or shield guardian was downed
        if (actualTarget.hp <= 0) {
          targ = actualTarget; // Update target for downed check
        }
        
        // 0.8.0 - Venomous: apply poison effect (1 dmg/turn)
        if (hasModifier(a, 'venomous') && dealt > 0) {
          actualTarget._poisonStacks = (actualTarget._poisonStacks || 0) + 1;
          appendLog(`${actualTarget.name} is poisoned!`);
        }
        
        // 0.8.0 - Rapid Fire: 30% chance to attack twice
        if (hasModifier(a, 'rapid') && Math.random() < 0.30 && strike === 0) {
          attackCount++;
        }
        
        // 0.8.0 - Caustic: splash damage to random nearby survivor
        if (hasModifier(a, 'caustic') && fighters.filter(f => f.hp > 0).length > 1) {
          const splashTargets = fighters.filter(f => f.hp > 0 && f !== targ);
          if (splashTargets.length > 0) {
            const splashTarg = splashTargets[rand(0, splashTargets.length - 1)];
            const splashDmg = Math.floor(dealt * 0.5);
            splashTarg.hp -= splashDmg;
            appendLog(`Caustic splash hits ${splashTarg.name} for ${splashDmg} dmg!`);
          }
        }
        
        if (targ.hp <= 0) {
          // 0.8.0 - Medic Lifesaver: survive fatal blow once per combat
          if (hasAbility(targ, 'lifesaver') && !targ._lifesaverUsed) {
            targ.hp = 1;
            targ._lifesaverUsed = true;
            appendLog(`${targ.name}'s Lifesaver ability prevents death!`);
          } else {
            // 0.8.0 - Downed state instead of instant death
            targ.hp = 0;
            targ.downed = true;
            appendLog(`${targ.name} is down! (${dealt} dmg from ${a.name})`);
            // 0.8.x - Field losses increase raid pressure
            if (context === 'field') {
              state.raidPressure = Math.min((state.raidPressure || 0) + 0.004, 0.03);
              state.threat = clamp(state.threat + 1, 0, 100);
            }
          }
          break; // Don't continue multi-strike on dead target
        }
      }
    }
    
    // 0.8.0 - Field Medic revival phase (auto-resolve)
    const medics = fighters.filter(s => s.hp > 0 && hasAbility(s, 'fieldmedic'));
    if (medics.length > 0) {
      const downedAllies = fighters.filter(s => s.downed);
      for (const medic of medics) {
        if (downedAllies.length === 0) break;
        const target = downedAllies.shift(); // Revive first downed
        const reviveHP = rand(Math.floor(target.maxHp * 0.25), Math.floor(target.maxHp * 0.50));
        target.hp = reviveHP;
        target.downed = false;
        appendLog(`${medic.name} revives ${target.name} (${reviveHP} HP)!`);
      }
    }
    
    // quick break safety
    if (Math.random() < 0.001) break;
  }
  
  // resolve aftermath: remove downed/dead survivors
  state.survivors = state.survivors.filter(s => {
    if (s.hp <= 0 || s.downed) {
      // Clear downed state if they survived the battle
      if (s.downed && fighters.includes(s)) {
        s.downed = false;
        if (s.hp === 0) s.hp = 1;
        return true; // Keep survivor
      }
      appendLog(`${s.name} was lost in combat.`);
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
      let xpGain = rand(BALANCE.COMBAT_XP_RANGE[0], BALANCE.COMBAT_XP_RANGE[1]);
      // 0.8.0 - Scientist Studious and Genius abilities
      if (hasAbility(s, 'studious')) xpGain = Math.floor(xpGain * 1.15);
      if (hasAbility(s, 'genius')) xpGain = Math.floor(xpGain * 1.25);
      grantXp(s, xpGain);
    }
  }
  
  updateUI();
}
