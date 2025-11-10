// Combat System
// Handles alien encounters, skirmishes, damage calculation

// 1.0 - Advanced AI: Smart target selection for aliens
function selectAlienTarget(alien, fighters) {
  const validTargets = fighters.filter(f => f.hp > 0);
  if (validTargets.length === 0) return null;
  if (validTargets.length === 1) return validTargets[0];
  
  // Different alien types have different targeting priorities
  const alienType = alien.type || 'drone';
  
  switch (alienType) {
    case 'spitter':
    case 'brood':
      // Spitters/Broods target high-defense survivors (they have armor piercing)
      return validTargets.reduce((highest, f) => {
        const fDef = calculateDefense(f);
        const highestDef = calculateDefense(highest);
        return fDef > highestDef ? f : highest;
      });
      
    case 'stalker':
    case 'ravager':
    case 'queen':
      // Aggressive types focus fire on lowest HP (finish kills)
      return validTargets.reduce((lowest, f) => {
        const fPercent = f.hp / f.maxHp;
        const lowestPercent = lowest.hp / lowest.maxHp;
        return fPercent < lowestPercent ? f : lowest;
      });
      
    case 'lurker':
      // Lurkers target high-value classes (Medics, Engineers, Scientists)
      const priorityClasses = ['Medic', 'Engineer', 'Scientist'];
      const highValue = validTargets.filter(f => priorityClasses.includes(f.class));
      if (highValue.length > 0) {
        return highValue[Math.floor(Math.random() * highValue.length)];
      }
      // Fall through to random if no priority targets
      
    case 'drone':
    case 'spectre':
    default:
      // Drones/Spectres: Random targeting (unpredictable)
      return validTargets[Math.floor(Math.random() * validTargets.length)];
  }
}

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
          const splashDmg = Math.max(1, Math.floor(baseDmg * 0.5));
          const splashTarget = aliens.find(a => a.hp > 0 && a !== target);
          if (splashTarget) {
            const splashArmor = splashTarget.armor || 0;
            const splashDealt = Math.max(1, splashDmg - splashArmor);
            splashTarget.hp -= splashDealt;
            appendLog(`💥 Splash damage hits ${splashTarget.name} for ${splashDealt} damage!`);
            if (splashTarget.hp <= 0) {
              appendLog(`${splashTarget.name} downed by splash damage.`);
              state.alienKills = (state.alienKills || 0) + 1;
            }
          }
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
  if (hasModifier(alien, 'alpha')) { atkBonus += 4; dodgeBonus += 0.25; }
  
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
  if (hasModifier(alien, 'crusher')) atkBonus += 4;
  if (hasModifier(alien, 'juggernaut')) hpBonus += 8;
  if (hasModifier(alien, 'colossus')) { atkBonus += 6; hpBonus += 12; }
  
  // Spectre modifiers
  if (hasModifier(alien, 'ethereal')) phaseBonus += 0.10;
  if (hasModifier(alien, 'shadow')) phaseBonus += 0.20; // +20% phase (Shadow Form)
  if (hasModifier(alien, 'void')) phaseBonus = 0.60;
  
  // Queen modifiers
  if (hasModifier(alien, 'dominant')) atkBonus += 3;
  if (hasModifier(alien, 'ancient')) { atkBonus += 2; hpBonus += 15; }
  if (hasModifier(alien, 'empress')) { atkBonus += 2; hpBonus += 20; }
  
  return { hpMult, hpBonus, atkBonus, defBonus, dodgeBonus, phaseBonus };
}

function calculateAttackDamage(survivor) {
  // 0.9.0 - Removed skill system, damage comes from weapon + level/class bonuses
  let damage = 0;
  
  // Get weapon damage
  const weapon = survivor.equipment.weapon;
  if (weapon && weapon.durability > 0) {
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
  if (armor && armor.durability > 0) {
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
    // Reset per-round flags
    aliens.forEach(a => a._relentlessUsed = false);

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
      if (Math.random() < critChance && !hasModifier(target, 'unstoppable')) {
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
      // Apply resistance from armored special and other modifiers
      let totalResist = 0;
      if (target.special === 'armored') {
        totalResist += 0.30;
      }
      if (hasModifier(target, 'hardened')) {
        totalResist += 0.20;
      }
      if (hasModifier(target, 'colossus')) {
        totalResist = 0.40; // Colossus overrides other resistances
      }

      if (totalResist > 0) {
        dmg = Math.floor(dmg * (1 - totalResist));
        appendLog(`${target.name}'s carapace absorbs damage.`);
      }
      
      const blocked = Math.min(dmg, target.armor || 0);
      if (blocked > 0) {
          appendLog(`${target.name} blocked ${blocked} damage.`);
      }
      dmg = Math.max(0, dmg - (target.armor || 0));
      
      target.hp -= dmg;
      appendLog(`${s.name} hits ${target.name} for ${dmg} dmg.`);
      
      // 0.9.0 - Apply weapon effects
      if (weapon && weapon.effects && weapon.effects.length > 0 && target.hp > 0) {
        applyWeaponEffects(weapon, target, s, dmg);
      }
      
        if (target.hp <= 0) {
          appendLog(`${target.name} downed.`);
          state.alienKills = (state.alienKills || 0) + 1;
          state.threat += BALANCE.THREAT_GAIN_PER_ALIEN_KILL || 0;

          // Stalker 'Relentless' modifier: attack again if an ally dies
          for (const a of aliens) {
            if (a.hp > 0 && hasModifier(a, 'relentless') && !a._relentlessUsed) {
              a._relentlessUsed = true; // Prevent infinite attacks in one turn
              const relentlessTarget = fighters.find(f => f.hp > 0);
              if (relentlessTarget) {
                // Perform a single, immediate attack
                const relentlessDmg = rand(Math.max(1, a.attack - 1), a.attack + 1);
                const defense = calculateDefense(relentlessTarget);
                const dealt = Math.max(0, relentlessDmg - defense);
                relentlessTarget.hp -= dealt;
                appendLog(`Relentless fury! ${a.name} strikes ${relentlessTarget.name} for ${dealt} damage!`);
                if (relentlessTarget.hp <= 0) {
                  appendLog(`${relentlessTarget.name} is down!`);
                }
              }
            }
          }
          
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
        let qualityBonus = 0;
        
        // 1.0 - Hostile survivors drop equipment and consumables (no loot table roll)
        if (target.type === 'hostile_human') {
          // Drop equipped items
          if (target.equipment) {
            if (target.equipment.weapon) {
              state.inventory.push(target.equipment.weapon);
              appendLog(`⚔️ Looted: ${target.equipment.weapon.name} (${target.equipment.weapon.durability}/${target.equipment.weapon.maxDurability})`);
            }
            if (target.equipment.armor) {
              state.inventory.push(target.equipment.armor);
              appendLog(`🛡️ Looted: ${target.equipment.armor.name} (${target.equipment.armor.durability}/${target.equipment.armor.maxDurability})`);
            }
          }
          
          // Drop remaining consumables from inventory
          if (target.inventory && target.inventory.length > 0) {
            for (const item of target.inventory) {
              state.inventory.push(item);
              appendLog(`📦 Looted: ${item.name}`);
            }
          }
          
          // Bonus scrap based on hostile rarity
          const rarityScrap = {
            'common': rand(10, 20),
            'uncommon': rand(20, 35),
            'rare': rand(35, 60),
            'legendary': rand(60, 100)
          };
          const scrapAmount = rarityScrap[target.rarity] || 15;
          state.resources.scrap += scrapAmount;
          appendLog(`💰 Looted ${scrapAmount} scrap from ${target.name}`);
          
          // Skip normal loot table roll for hostile survivors
          continue;
        }
        
        // Normal alien loot drops
        // Bonus for alien rarity
        switch (target.rarity) {
          case 'uncommon': qualityBonus += 0.05; break;
          case 'rare': qualityBonus += 0.10; break;
          case 'veryrare': qualityBonus += 0.20; break;
        }
        // Bonus for number of modifiers
        if (target.modifiers && target.modifiers.length > 0) {
          qualityBonus += target.modifiers.length * 0.03;
        }

        // Scavenger bonuses from the killer (s)
        if (s) {
            // Class bonus
            if (s.class === 'scavenger' && s.classBonuses && s.classBonuses.loot) {
                qualityBonus += (s.classBonuses.loot - 1); // e.g. 1.25 -> 0.25
            }
            // Treasure Hunter ability
            if (hasAbility(s, 'treasure')) {
                qualityBonus += 0.25;
            }
            // Golden Nose ability quality bonus
            if (hasAbility(s, 'goldnose')) {
                qualityBonus += 0.50;
            }
        }

        const loot = pickLoot(qualityBonus);
        const lootMessage = loot.onPickup(state);
        appendLog(`Loot dropped: ${lootMessage}`);

        // Scavenger extra roll abilities
        if (s) {
            // Lucky Find - 15% chance for extra loot
            if (hasAbility(s, 'lucky') && Math.random() < 0.15) {
                const bonusLoot = pickLoot(qualityBonus);
                const bonusMessage = bonusLoot.onPickup(state);
                appendLog(`${s.name}'s Lucky Find triggered: ${bonusMessage}!`);
            }
            // Golden Nose - double loot rolls
            if (hasAbility(s, 'goldnose')) {
                const extraLoot = pickLoot(qualityBonus);
                const extraMessage = extraLoot.onPickup(state);
                appendLog(`${s.name}'s Golden Nose finds exceptional loot: ${extraMessage}!`);
            }
        }
        
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
      
      // 1.0 - Hostile Survivor AI: Use consumables intelligently (auto-resolve)
      if (a.type === 'hostile_human' && a.inventory && a.inventory.length > 0) {
        // Use Medkit if HP below 50%
        if (a.hp < a.maxHp * 0.5) {
          const medkitIdx = a.inventory.findIndex(item => item.type === 'medkit');
          if (medkitIdx >= 0) {
            const healAmount = rand(15, 25);
            a.hp = Math.min(a.maxHp, a.hp + healAmount);
            a.inventory.splice(medkitIdx, 1);
            appendLog(`⚕️ ${a.name} uses a Medkit and heals ${healAmount} HP!`);
          }
        }
        
        // Use Stimpack if HP below 70%
        if (a.hp < a.maxHp * 0.7 && !a._stimpackActive) {
          const stimpackIdx = a.inventory.findIndex(item => item.type === 'stimpack');
          if (stimpackIdx >= 0) {
            a._stimpackActive = true;
            a._stimpackDefense = 5; // +5 defense for this round
            a.inventory.splice(stimpackIdx, 1);
            appendLog(`💉 ${a.name} uses a Stimpack (+5 defense)!`);
          }
        }
      }
      
      // Multi-strike special (queen)
      let attackCount = (a.special === 'multistrike') ? 2 : 1;
      // Empress modifier adds third attack
      if (hasModifier(a, 'empress')) attackCount = 3;
      // Rapid Fire (Spitter) gives a 30% chance for an extra attack
      if (hasModifier(a, 'rapid') && Math.random() < 0.30) {
        attackCount++;
        logCombat(`${a.name} attacks with rapid speed!`);
      }
      
      for (let strike = 0; strike < attackCount; strike++) {
        // 1.0 - Advanced AI: Smart targeting based on alien type
        const targ = selectAlienTarget(a, fighters);
        if (!targ) break;
        
        const modStats = applyModifierStatEffects(a);
        
        let aDmg = rand(Math.max(1, a.attack - 1), a.attack + 1);
        aDmg += modStats.atkBonus;

        // AURA BONUSES
        const matriarchs = aliens.filter(al => al.hp > 0 && hasModifier(al, 'matriarch'));
        if (matriarchs.length > 0) aDmg += matriarchs.length;
        const empresses = aliens.filter(al => al.hp > 0 && hasModifier(al, 'empress'));
        if (empresses.length > 0) aDmg += empresses.length * 2;
        const packLeaders = aliens.filter(al => al.hp > 0 && hasModifier(al, 'pack_leader'));
        if (a.special === 'pack' && packLeaders.length > 0) aDmg += packLeaders.length * 2;
        
        // WRAITH BONUS
        if (hasModifier(a, 'wraith') && a._justPhased) {
          aDmg = Math.floor(aDmg * 1.5);
          appendLog(`${a.name} strikes from the void!`);
          a._justPhased = false;
        }
        
        // AMBUSH
        if (a.special === 'ambush' && a.firstStrike) {
          let ambushMult = 1.5;
          if (hasModifier(a, 'silent')) ambushMult = 1.7;
          aDmg = Math.floor(aDmg * ambushMult);
          a.firstStrike = false;
          appendLog(`${a.name} ambushes from the shadows!`);
        }
        if (hasModifier(a, 'cunning') && a.hp < a.maxHp * 0.5 && !a._cunningUsed) {
          aDmg = Math.floor(aDmg * 1.5);
          a._cunningUsed = true;
          appendLog(`${a.name} strikes with renewed cunning!`);
        }

        // PACK TACTICS
        if (a.special === 'pack') {
          const allyCount = aliens.filter(al => al.hp > 0 && al !== a).length;
          let packBonus = allyCount * 2;
          if (hasModifier(a, 'coordinated')) packBonus = Math.floor(packBonus * 1.5);
          if (hasModifier(a, 'dire')) packBonus *= 2;
          aDmg += packBonus;
          if (allyCount > 0) appendLog(`${a.name} is empowered by pack tactics.`);
        }

        // PREDATOR
        if (hasModifier(a, 'predator') && targ.hp < targ.maxHp * 0.5) {
            aDmg = Math.floor(aDmg * 1.3);
        }

        // BRUTAL
        if (hasModifier(a, 'brutal') && Math.random() < 0.15) { // 15% chance for a brutal strike
            aDmg = Math.floor(aDmg * 1.5);
            appendLog(`${a.name} lands a brutal strike!`);
        }
        
        let defense = calculateDefense(targ);
        defense = applyAbilityDefenseModifiers(targ, defense, { fighters });
        
        const armor = targ.equipment && targ.equipment.armor;
        const armorEffects = armor ? applyArmorEffects(armor, targ) : {};
        
        const { dodgeChance } = applyAbilityHitModifiers(targ);
        const totalDodge = dodgeChance + (armorEffects.dodgeBonus || 0);
        if (totalDodge > 0 && Math.random() < totalDodge) {
          appendLog(`${targ.name} dodges the attack!`);
          continue;
        }
        
        if (armorEffects.reflectChance > 0 && Math.random() < armorEffects.reflectChance) {
          const reflectDmg = Math.floor(aDmg * 0.3);
          a.hp -= reflectDmg;
          appendLog(`⚡ ${targ.name}'s armor reflects ${reflectDmg} damage!`);
          if (a.hp <= 0) {
            appendLog(`${a.name} is destroyed by reflected damage!`);
            continue;
          }
        }
        
        // PIERCING & DEBUFFS
        if (a.special === 'piercing') {
          defense = Math.floor(defense * 0.5);
          if (hasModifier(a, 'corrosive')) defense = Math.floor(defense * 0.10);
          appendLog(`${a.name} sprays corrosive bile!`);
        }
        if (hasModifier(a, 'nightmare')) defense = 0; // Ambush ignores armor
        if (hasModifier(a, 'toxic')) {
            defense = Math.max(0, defense - 2);
            appendLog(`${a.name}'s toxin weakens ${targ.name}'s armor!`);
        }
        
        // ENRAGED
        if (hasModifier(a, 'enraged') && a.hp < a.maxHp * 0.5) {
          aDmg += 4;
          appendLog(`${a.name} is enraged!`);
        }
        
        // LIVING SHIELD
        let actualTarget = targ;
        const guardians = fighters.filter(g => g.hp > 0 && hasAbility(g, 'shield') && !g._shieldUsed && g !== targ);
        if (guardians.length > 0 && Math.random() < 0.50) {
          actualTarget = guardians[0];
          actualTarget._shieldUsed = true;
          appendLog(`${actualTarget.name} intercepts the attack with Living Shield!`);
        }
        
        const dealt = Math.max(0, aDmg - defense);
        if (aDmg > dealt) {
            appendLog(`${actualTarget.name} blocked ${aDmg - dealt} damage.`);
        }
        actualTarget.hp -= dealt;
        appendLog(`${a.name} strikes ${actualTarget.name} for ${dealt} dmg.`);
        
        if (actualTarget.hp <= 0) {
          targ = actualTarget;
        }
        
        // VENOMOUS
        if ((hasModifier(a, 'venomous') || hasModifier(a, 'plague')) && dealt > 0) {
          actualTarget._poisonStacks = (actualTarget._poisonStacks || 0) + 1;
          appendLog(`${actualTarget.name} is poisoned!`);
        }

        // JUGGERNAUT STUN
        if (hasModifier(a, 'juggernaut') && dealt > 0 && Math.random() < 0.20) {
            // No survivor stun in auto-resolve, so we'll just deal extra morale damage
            actualTarget.morale = Math.max(0, actualTarget.morale - 5);
            appendLog(`${a.name}'s crushing blow demoralizes ${actualTarget.name}!`);
        }
        
        // CAUSTIC SPLASH
        if ((hasModifier(a, 'caustic') || hasModifier(a, 'plague')) && fighters.filter(f => f.hp > 0).length > 1) {
          const splashTargets = fighters.filter(f => f.hp > 0 && f !== targ);
          if (splashTargets.length > 0) {
            const splashTarg = splashTargets[rand(0, splashTargets.length - 1)];
            const splashDmg = Math.floor(dealt * 0.5);
            splashTarg.hp -= splashDmg;
            appendLog(`Caustic splash hits ${splashTarg.name} for ${splashDmg} dmg!`);
          }
        }
        
        if (targ.hp <= 0) {
          if (hasAbility(targ, 'lifesaver') && !targ._lifesaverUsed) {
            targ.hp = 1;
            targ._lifesaverUsed = true;
            appendLog(`${targ.name}'s Lifesaver ability prevents death!`);
          } else {
            targ.hp = 0;
            targ.downed = true;
            appendLog(`${targ.name} is down! (${dealt} dmg from ${a.name})`);
            fighters.forEach(ally => {
              if (ally !== targ && !ally.downed) {
                ally.morale = Math.max(0, ally.morale - BALANCE.MORALE_LOSS_ALLY_DOWNED);
              }
            });
            if (context === 'field') {
              state.raidPressure = Math.min((state.raidPressure || 0) + 0.004, 0.03);
              state.threat = clamp(state.threat + 1, 0, 100);
            }
          }
          break;
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
  
  // Check if raid failed
  if (context === 'base' && aliens.some(a => a.hp > 0)) {
    // Guards lost - apply penalties instead of game over
    const integrityDamage = rand(BALANCE.INTEGRITY_DAMAGE_RAID_DEFEAT[0], BALANCE.INTEGRITY_DAMAGE_RAID_DEFEAT[1]);
    state.baseIntegrity -= integrityDamage;
    state.survivors.forEach(s => s.morale -= BALANCE.MORALE_LOSS_RAID_LOST);
    
    appendLog(`The guards have been defeated! The base has been breached. Integrity -${integrityDamage}%.`);
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
