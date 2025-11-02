// Combat System
// Handles alien encounters, skirmishes, damage calculation

// 0.9.0 - NEW: Apply modifier bonuses to alien stats at spawn
function applyModifiersToAlienStats(alien) {
  const effects = applyModifierStatEffects(alien);
  
  // Apply HP changes (both multiplier and flat bonus)
  const baseMaxHp = alien.maxHp;
  alien.maxHp = Math.round(baseMaxHp * effects.hpMult) + effects.hpBonus;
  alien.hp = alien.maxHp; // Set current HP to new max
  
  // Apply attack bonus
  alien.attack += effects.atkBonus;
  
  // Store other bonuses for use during combat
  alien._defBonus = effects.defBonus;
  alien._dodgeBonus = effects.dodgeBonus;
  alien._phaseBonus = effects.phaseBonus;
  
  return alien;
}

// 0.9.0 - Apply weapon effects (burn, stun, armorPierce, etc.)
function applyWeaponEffects(weapon, target, attacker, baseDmg) {
  if (!weapon.effects || weapon.effects.length === 0) return;
  
  for (const effect of weapon.effects) {
    const [effectType, valueStr] = effect.split(':');
    const value = parseInt(valueStr) || 0;
    const chance = value; // Percent chance
    
    if (Math.random() * 100 < chance) {
      switch (effectType) {
        case 'burn':
          // Burn: Deal damage over time (3 ticks)
          target._burnStacks = (target._burnStacks || 0) + 1;
          const burnDmg = Math.max(1, Math.floor(baseDmg * 0.3));
          target.hp -= burnDmg;
          appendLog(`🔥 ${target.name} is burning! (-${burnDmg} HP)`);
          break;
          
        case 'stun':
          // Stun: Skip next turn
          if (!target._stunned) {
            target._stunned = true;
            appendLog(`⚡ ${target.name} is stunned!`);
          }
          break;
          
        case 'armorPierce':
          // ArmorPierce: Deal bonus damage ignoring armor
          const pierceDmg = Math.max(1, Math.floor(baseDmg * 0.25));
          target.hp -= pierceDmg;
          appendLog(`🎯 Armor pierced! (-${pierceDmg} HP)`);
          break;
          
        case 'phase':
          // Phase: Chance to ignore next attack
          target._phaseActive = true;
          appendLog(`👻 ${target.name} is destabilized!`);
          break;
          
        case 'splash':
          // Splash: Hit additional targets
          appendLog(`💥 Splash damage!`);
          break;
          
        // Note: accuracy and crit are passive bonuses, applied elsewhere
      }
    }
  }
}

// 0.9.0 - Get passive bonuses from weapon effects (accuracy, crit)
function getWeaponPassiveBonuses(weapon) {
  const bonuses = { accuracy: 0, crit: 0 };
  if (!weapon || !weapon.effects) return bonuses;
  
  for (const effect of weapon.effects) {
    const [effectType, valueStr] = effect.split(':');
    const value = parseInt(valueStr) || 0;
    
    switch (effectType) {
      case 'accuracy':
        bonuses.accuracy += value / 100; // Convert percent to decimal
        break;
      case 'crit':
        bonuses.crit += value / 100; // Convert percent to decimal
        break;
    }
  }
  
  return bonuses;
}

// 0.9.0 - Apply armor effects (dodge, reflect, regen, etc.)
function applyArmorEffects(armor, survivor) {
  if (!armor || !armor.effects || armor.effects.length === 0) return {};
  
  const bonuses = {
    dodgeBonus: 0,
    reflectChance: 0,
    regenAmount: 0,
    immunities: [],
    hpBonus: 0,
    critBonus: 0
  };
  
  for (const effect of armor.effects) {
    const [effectType, valueStr] = effect.split(':');
    const value = parseInt(valueStr) || 0;
    
    switch (effectType) {
      case 'dodge':
        bonuses.dodgeBonus += value / 100; // Convert percent to decimal
        break;
      case 'reflect':
        bonuses.reflectChance += value / 100;
        break;
      case 'regen':
        bonuses.regenAmount += value;
        break;
      case 'immunity':
        bonuses.immunities.push(valueStr); // e.g., 'burn', 'stun'
        break;
      case 'hpBonus':
        bonuses.hpBonus += value;
        break;
      case 'crit':
        bonuses.critBonus += value / 100; // Armor can provide crit bonus (Nano-Weave)
        break;
    }
  }
  
  return bonuses;
}

// 0.8.0 - Helper: Check if survivor has a specific ability
function hasAbility(survivor, abilityId) {
  return survivor.abilities && survivor.abilities.includes(abilityId);
}

// 0.8.0 - Helper: Check if alien has a specific modifier
function hasModifier(alien, modifierId) {
  return alien.modifiers && alien.modifiers.includes(modifierId);
}

// 0.8.10 - Helper: Apply survivor ability effects to damage
function applyAbilityDamageModifiers(survivor, baseDamage, context = {}) {
  let damage = baseDamage;
  let damageAdd = 0; // 0.8.11 - Additive stacking
  
  // 0.8.11 - Soldier class bonus (additive): combat damage
  if (survivor.classBonuses && survivor.classBonuses.combat) {
    damageAdd += (survivor.classBonuses.combat - 1); // e.g., 1.15 -> 0.15
  }
  
  // Soldier abilities (additive)
  if (hasAbility(survivor, 'veteran')) damageAdd += 0.20; // +20% damage
  if (hasAbility(survivor, 'berserker') && survivor.hp < survivor.maxHp * 0.3) damageAdd += 0.30; // +30% below 30% HP
  
  // Guardian abilities (additive)
  if (hasAbility(survivor, 'last') && context.allyCount === 1) damageAdd += 0.50; // +50% when alone
  
  // Guardian Commander: +10% to nearby allies (implemented by checking party for commanders)
  if (context.fighters) {
    const hasCommander = context.fighters.some(f => f !== survivor && f.hp > 0 && hasAbility(f, 'commander'));
    if (hasCommander) damageAdd += 0.10;
  }
  
  damage = Math.round(damage * (1 + damageAdd));
  return damage;
}

// 0.8.10 - Helper: Apply survivor ability effects to hit/crit chance
function applyAbilityHitModifiers(survivor) {
  let hitBonus = 0;
  let critBonus = 0;
  let dodgeChance = 0.05; // Base 5% dodge for all survivors

  // Apply class bonuses for accuracy and crit
  if (survivor.classBonuses) {
    if (survivor.classBonuses.accuracy) {
      hitBonus += survivor.classBonuses.accuracy;
    }
    if (survivor.classBonuses.crit) {
      critBonus += survivor.classBonuses.crit;
    }
  }

  // 0.8.10 - Scout class bonus: flat dodge % bonus (rolled value 1.15-1.25)
  if (survivor.class === 'scout' && survivor.classBonuses && survivor.classBonuses.dodge) {
    // Scout gets their bonus on top of base 5%
    // classBonuses.dodge is stored as multiplier (1.15-1.25), convert to flat % (15-25%)
    dodgeChance += (survivor.classBonuses.dodge - 1);
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
  
  // 0.8.10 - Guardian/Soldier class bonus (rolled value): defense
  if (survivor.classBonuses && survivor.classBonuses.defense) {
    defense += survivor.classBonuses.defense;
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
  let hpBonus = 0; // NEW: Flat HP bonuses
  let atkBonus = 0;
  let defBonus = 0;
  let dodgeBonus = 0;
  let phaseBonus = 0;
  
  // Universal modifiers across all types
  if (hasModifier(alien, 'aggressive')) atkBonus += 2;
  if (hasModifier(alien, 'resilient')) hpMult += 0.5; // +50% HP (percentage)
  
  // Drone modifiers
  if (hasModifier(alien, 'swift')) dodgeBonus += 0.30;
  if (hasModifier(alien, 'alpha')) { atkBonus += 4; dodgeBonus += 0.50; }
  
  // Lurker modifiers handled in ambush logic
  
  // Stalker modifiers handled in pack logic
  if (hasModifier(alien, 'feral')) atkBonus += 3; // Applied when pack is active
  if (hasModifier(alien, 'pack_leader')) atkBonus += 2; // Allies gain +2, handled separately
  if (hasModifier(alien, 'dire')) { atkBonus += 6; hpBonus += 6; } // FIXED: Was missing HP bonus
  
  // Spitter modifiers
  if (hasModifier(alien, 'corrosive')) defBonus -= 0.40; // +40% armor pierce (spitters have 50% base)
  
  // Brood modifiers
  if (hasModifier(alien, 'thick')) hpBonus += 10; // FIXED: Was hpMult += 0.30, should be +10 flat
  if (hasModifier(alien, 'enraged')) atkBonus += 4; // Applied when below 50% HP
  if (hasModifier(alien, 'titan')) { hpBonus += 15; atkBonus += 3; } // FIXED: Was hpMult += 0.40, should be +15 flat
  // Spawner handled in combat logic, not stats
  
  // Ravager modifiers
  if (hasModifier(alien, 'hardened')) defBonus += 0.60; // Take 60% less (stacks with armored)
  if (hasModifier(alien, 'crusher')) atkBonus += 4;
  if (hasModifier(alien, 'juggernaut')) hpBonus += 8; // FIXED: Was hpMult += 0.30, should be +8 flat
  if (hasModifier(alien, 'colossus')) { defBonus += 0.70; atkBonus += 6; hpBonus += 12; } // FIXED: Was hpMult += 0.40, should be +12 flat
  
  // Spectre modifiers
  if (hasModifier(alien, 'ethereal')) phaseBonus += 0.10;
  if (hasModifier(alien, 'shadow')) phaseBonus += 0.20; // +20% phase (Shadow Form)
  if (hasModifier(alien, 'void')) phaseBonus += 0.60;
  
  // Queen modifiers
  if (hasModifier(alien, 'dominant')) atkBonus += 3;
  if (hasModifier(alien, 'ancient')) { atkBonus += 2; hpBonus += 15; } // FIXED: Was hpMult += 0.30, should be +15 flat
  if (hasModifier(alien, 'empress')) { atkBonus += 20; hpBonus += 20; } // FIXED: Was missing HP bonus
  
  return { hpMult, hpBonus, atkBonus, defBonus, dodgeBonus, phaseBonus };
}

function calculateAttackDamage(survivor) {
  // 0.9.0 - Removed skill system, damage comes from weapon + level/class bonuses
  let damage = 0;
  
  // Get weapon damage
  const weapon = survivor.equipment.weapon;
  if (weapon) {
    // New structure: has damage array
    if (weapon.damage && Array.isArray(weapon.damage)) {
      damage = rand(weapon.damage[0], weapon.damage[1]);
    }
    // Old structure: type-based bonuses (legacy support)
    else if (weapon.type === 'rifle') {
      damage = 8;
    } else if (weapon.type === 'shotgun') {
      damage = rand(6, 12);
    }
  } else {
    // Unarmed combat
    damage = rand(BALANCE.UNARMED_DAMAGE[0], BALANCE.UNARMED_DAMAGE[1]);
  }
  
  // Apply percentage-based bonuses from level, class, and abilities to damage
  let damageMultiplier = 1.0;
  
  // Level bonus: 0% at level 1, +2% per level after that
  damageMultiplier += (survivor.level - 1) * BALANCE.LEVEL_ATTACK_BONUS;
  
  // Apply class/ability bonuses (these are already in percentage format)
  if (survivor.classBonuses && survivor.classBonuses.combat) {
    damageMultiplier += (survivor.classBonuses.combat - 1);
  }
  if (hasAbility(survivor, 'veteran')) {
    damageMultiplier += 0.20;
  }
  
  // 0.9.0 - Apply morale combat modifier
  const moraleModifier = getMoraleModifier(survivor);
  damageMultiplier *= moraleModifier.combat;
  
  damage *= damageMultiplier;
  
  return Math.max(1, Math.round(damage)); // Minimum 1 damage
}

function calculateDefense(survivor) {
  let defense = 0;
  const armor = survivor.equipment.armor;
  
  // 0.9.0 - Support both old and new armor structure
  if (armor) {
    // New structure: has defense property
    if (armor.defense !== undefined) {
      defense += armor.defense;
    }
    // Old structure: type-based defense
    else if (armor.type === 'armor') {
      defense += 3; // Light Armor
    } else if (armor.type === 'heavyArmor') {
      defense += 6; // Heavy Armor
    } else if (armor.type === 'hazmatSuit') {
      defense += 3; // Hazmat Suit
    }
    
    // 0.9.0 - Apply armor effects bonus
    const armorEffects = applyArmorEffects(armor, survivor);
    if (armorEffects.hpBonus > 0 && !survivor._hpBonusApplied) {
      // One-time HP bonus applied
      survivor.maxHp += armorEffects.hpBonus;
      survivor.hp += armorEffects.hpBonus;
      survivor._hpBonusApplied = true;
    }
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
    // 0.9.0 - Pass threat value for scaling
    const modifiers = rollAlienModifiers(at.id, state.threat);
    
    const alien = {
      type: at.id,
      name: at.name,
      hp,
      maxHp: hp,
      attack: rand(at.attackRange[0], at.attackRange[1]),
      armor: at.armor || 0, // 0.9.0 - Include armor value
      rarity: at.rarity || 'common', // 0.9.0 - Include rarity
      attackRange: at.attackRange, // 0.9.0 - Include for UI display
      stealth: at.stealth,
      flavor: at.flavor,
      special: at.special,
      specialDesc: at.specialDesc,
      modifiers: modifiers, // 0.8.0
      firstStrike: true // Track if alien has attacked yet (for ambush)
    };
    
    // 0.9.0 - CRITICAL FIX: Apply modifier stat bonuses to alien
    applyModifiersToAlienStats(alien);
    
    // 0.9.0 - Apply escalation bonuses to field aliens (affects all exploration)
    if (typeof applyEscalationToAlien === 'function') {
      applyEscalationToAlien(alien);
    }
    
    t.aliens.push(alien);
  }
  appendLog(`Encountered ${t.aliens.length} alien(s) in this sector.`);
  // If interactive combat is available and an explorer is selected, open it; otherwise auto-resolve
  if (typeof interactiveEncounterAtTile === 'function' && state.selectedExplorerId != null) {
    interactiveEncounterAtTile(idx);
  } else {
    resolveSkirmish(t.aliens, 'field', idx);
  }
}

function resolveSkirmish(aliens, context = 'field', idx = null) {
  let fighters = [];
  if (context === 'field') {
    const explorer = state.survivors.find(s => s.id === state.selectedExplorerId);
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
      
      // 0.9.0 - Get weapon type for ammo consumption
      const weapon = s.equipment && s.equipment.weapon;
      const weaponType = weapon && weapon.weaponType ? weapon.weaponType : 'rifle'; // Default to rifle if no weapon
      const ammoMultiplier = WEAPON_TYPES[weaponType] ? WEAPON_TYPES[weaponType].ammoMult : 0.6;
      
      // ammo check - melee weapons don't use ammo
      let ammoUsed = false;
      if (ammoMultiplier > 0) {
        if (state.resources.ammo <= 0) {
          appendLog(`${s.name} attempted to fire but no ammo.`);
          baseAtk = Math.max(1, Math.floor(baseAtk / 2));
        } else {
          // consume ammo based on weapon type
          const consumeChance = BALANCE.AMMO_CONSUME_CHANCE * ammoMultiplier;
          if (Math.random() < consumeChance) {
            state.resources.ammo = Math.max(0, state.resources.ammo - 1);
            ammoUsed = true;
          }
        }
      }
      
      let dmg = rand(Math.max(1, baseAtk - 1), baseAtk + 2);
      
      // 0.8.0 - Apply hit/crit modifiers from abilities
      const { hitBonus, critBonus } = applyAbilityHitModifiers(s);
      
      // 0.9.0 - Add weapon passive bonuses (accuracy, crit)
      const weaponBonuses = weapon ? getWeaponPassiveBonuses(weapon) : { accuracy: 0, crit: 0 };
      
      // 0.9.0 - Add armor crit bonus and level accuracy bonus
      const armor = s.equipment && s.equipment.armor;
      const armorEffects = armor ? applyArmorEffects(armor, s) : {};
      const levelAccuracyBonus = s.level * BALANCE.LEVEL_ACCURACY_BONUS;
      
      const hitChance = BALANCE.BASE_HIT_CHANCE + hitBonus + weaponBonuses.accuracy + levelAccuracyBonus;
      const critChance = BALANCE.CRIT_CHANCE + critBonus + weaponBonuses.crit + (armorEffects.critBonus || 0);
      
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
      
      // 0.9.0 - Apply weapon effects
      if (weapon && weapon.effects && weapon.effects.length > 0 && target.hp > 0) {
        applyWeaponEffects(weapon, target, s, dmg);
      }
      
      if (target.hp <= 0) {
        appendLog(`${target.name} downed.`);
        state.alienKills = (state.alienKills || 0) + 1;
        
  // 0.9.0 - Morale gain for killing alien
        s.morale = Math.min(100, s.morale + BALANCE.MORALE_GAIN_ALIEN_KILL);
        
        // 0.8.0 - Spawner: summon drone on death
        if (hasModifier(target, 'spawner')) {
          const droneType = ALIEN_TYPES.find(at => at.id === 'drone');
          if (droneType) {
            const spawnedHp = rand(droneType.hpRange[0], droneType.hpRange[1]);
            const spawnedDrone = {
              type: 'drone',
              name: 'Spawned Drone',
              hp: spawnedHp,
              maxHp: spawnedHp,
              attack: rand(droneType.attackRange[0], droneType.attackRange[1]),
              armor: droneType.armor || 0, // 0.9.0 - Include armor value
              rarity: droneType.rarity || 'common', // 0.9.0 - Include rarity
              attackRange: droneType.attackRange, // 0.9.0 - Include for UI display
              stealth: droneType.stealth,
              flavor: droneType.flavor,
              special: droneType.special,
              specialDesc: droneType.specialDesc,
              modifiers: [],
              firstStrike: true
            };
            
            // 0.9.0 - CRITICAL FIX: Apply modifier bonuses (even though spawned drones have no modifiers, this is future-proof)
            applyModifiersToAlienStats(spawnedDrone);
            
            // 0.9.0 - Apply escalation bonuses to spawned aliens
            if (typeof applyEscalationToAlien === 'function') {
              applyEscalationToAlien(spawnedDrone);
            }
            
            aliens.push(spawnedDrone);
            appendLog(`${target.name} spawns a drone as it dies!`);
          }
        }
        
        // loot on kill
        const loot = pickLoot();
        const lootMessage = loot.onPickup(state);
        appendLog(`Loot dropped: ${lootMessage}`);
        
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
        
        // 0.9.0 - Apply armor effects (dodge, reflect, etc.)
        const armor = targ.equipment && targ.equipment.armor;
        const armorEffects = armor ? applyArmorEffects(armor, targ) : {};
        
        // 0.8.0 - Check for survivor dodge abilities + armor dodge bonus
        const { dodgeChance } = applyAbilityHitModifiers(targ);
        const totalDodge = dodgeChance + (armorEffects.dodgeBonus || 0);
        if (totalDodge > 0 && Math.random() < totalDodge) {
          appendLog(`${targ.name} dodges the attack!`);
          continue;
        }
        
        // 0.9.0 - Reflect damage check
        if (armorEffects.reflectChance > 0 && Math.random() < armorEffects.reflectChance) {
          const reflectDmg = Math.floor(aDmg * 0.3);
          a.hp -= reflectDmg;
          appendLog(`⚡ ${targ.name}'s armor reflects ${reflectDmg} damage!`);
          if (a.hp <= 0) {
            appendLog(`${a.name} is destroyed by reflected damage!`);
            continue;
          }
        }
        
        // Piercing special (spitter) - ignore 50% of armor
        if (a.special === 'piercing') {
          defense = Math.floor(defense * 0.5);
          // 0.8.0 - Spitter modifiers
          // 0.9.0 - Hyper-Corrosive: +40% pierce (90% total = 50% base + 40% bonus = only 10% armor remains)
          if (hasModifier(a, 'corrosive')) defense = Math.floor(defense * 0.10); // 90% ignore total
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
            
            // 0.9.0 - Morale penalty for ally downed
            fighters.forEach(ally => {
              if (ally !== targ && !ally.downed) {
                ally.morale = Math.max(0, ally.morale - BALANCE.MORALE_LOSS_ALLY_DOWNED);
              }
            });
            
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
    
    // 0.9.0 - Armor regeneration phase
    for (const s of fighters) {
      if (s.hp <= 0) continue;
      const armor = s.equipment && s.equipment.armor;
      if (armor) {
        const armorEffects = applyArmorEffects(armor, s);
        if (armorEffects.regenAmount > 0) {
          // Calculate effective max HP including armor bonus
          let effectiveMaxHp = s.maxHp;
          if (armor.effects) {
            for (const effect of armor.effects) {
              if (effect.startsWith('hpBonus:')) {
                effectiveMaxHp += parseInt(effect.split(':')[1]) || 0;
              }
            }
          }
          s.hp = Math.min(effectiveMaxHp, s.hp + armorEffects.regenAmount);
          appendLog(`${s.name}'s armor regenerates ${armorEffects.regenAmount} HP.`);
        }
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
      
  // 0.9.0 - Morale penalty for ally death
      state.survivors.forEach(ally => {
        ally.morale = Math.max(0, ally.morale - BALANCE.MORALE_LOSS_ALLY_DEATH);
      });
      
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
  
  // survivors gain xp (bonuses applied in grantXp - 0.8.11 additive stacking)
  for (const s of fighters) {
    if (s.hp > 0) {
      const xpGain = rand(BALANCE.COMBAT_XP_RANGE[0], BALANCE.COMBAT_XP_RANGE[1]);
      grantXp(s, xpGain);
      
  // 0.9.0 - Morale gain for combat victory
      s.morale = Math.min(100, s.morale + BALANCE.MORALE_GAIN_COMBAT_WIN);
    }
  }
  
  // 0.9.0 - Apply durability loss to all fighters' equipment
  for (const s of fighters) {
    if (!s) continue;
    
    // Weapon durability loss (8-15 per combat)
    if (s.equipment && s.equipment.weapon && s.equipment.weapon.durability !== undefined) {
      const weaponLoss = rand(8, 15);
      s.equipment.weapon.durability = Math.max(0, s.equipment.weapon.durability - weaponLoss);
    }
    
    // Armor durability loss (10-18 per combat)
    if (s.equipment && s.equipment.armor && s.equipment.armor.durability !== undefined) {
      const armorLoss = rand(10, 18);
      s.equipment.armor.durability = Math.max(0, s.equipment.armor.durability - armorLoss);
    }
  }
  
  updateUI();
}
