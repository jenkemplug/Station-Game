// Interactive Combat System (0.7.0)
// Presents a modal where the player can select actions per round.

// 0.9.0 - Helper: Calculate effective max HP including armor bonuses
function getEffectiveMaxHpCombat(survivor) {
  let effectiveMax = survivor.maxHp || 20;
  if (survivor.equipment && survivor.equipment.armor && survivor.equipment.armor.effects) {
    for (const effect of survivor.equipment.armor.effects) {
      if (effect.startsWith('hpBonus:')) {
        const bonus = parseInt(effect.split(':')[1]) || 0;
        effectiveMax += bonus;
      }
    }
  }
  return effectiveMax;
}

// 0.9.0 - Helper: Get rarity color
function getRarityColor(rarity) {
  const colors = {
    common: '#a0a0a0',
    uncommon: '#a78bfa',
    rare: '#fb923c',
    veryrare: '#ef4444'
  };
  return colors[rarity] || colors.common;
}

// 0.9.0 - Calculate weapon damage for display (mimics combat.js logic)
function calculateWeaponDamage(survivor) {
  let damage = 0;
  const weapon = survivor.equipment.weapon;
  
  if (weapon) {
    if (weapon.damage && Array.isArray(weapon.damage)) {
      // Average damage for display
      damage = (weapon.damage[0] + weapon.damage[1]) / 2;
    } else if (weapon.type === 'rifle') {
      damage = 8;
    } else if (weapon.type === 'shotgun') {
      damage = 9; // Average of 6-12
    }
  }
  
  return damage;
}

// 0.9.0 - Calculate armor defense for display (mimics combat.js logic)
function calculateArmorDefense(survivor) {
  let defense = 0;
  const armor = survivor.equipment.armor;
  
  if (armor) {
    if (armor.defense !== undefined) {
      defense += armor.defense;
    } else if (armor.type === 'armor') {
      defense += 3;
    } else if (armor.type === 'heavyArmor') {
      defense += 6;
    } else if (armor.type === 'hazmatSuit') {
      defense += 3;
    }
  }
  
  return defense;
}

// 0.9.0 - Get active status effects for display
function getStatusEffectsDisplay(entity, isAlien = false, rarityColor = null, party = null) {
  const effects = [];
  
  // === TEMPORARY STATUS EFFECTS (Combat-inflicted) ===
  
  // Negative effects (red)
  // Check entity properties directly (set during combat)
  if (entity._burnStacks && entity._burnStacks > 0) {
    const minTurns = entity._burnQueue && entity._burnQueue.length > 0 ? Math.min(...entity._burnQueue) : 0;
    const maxTurns = entity._burnQueue && entity._burnQueue.length > 0 ? Math.max(...entity._burnQueue) : 0;
    const totalDmg = entity._burnStacks * 2;
    const turnsText = minTurns > 0 ? ` (${totalDmg} dmg/turn, ${minTurns}-${maxTurns > minTurns ? maxTurns : minTurns} turns left)` : '';
    effects.push({ text: `🔥 Burning x${entity._burnStacks}${turnsText}`, color: 'var(--danger)', tooltip: `${entity._burnStacks} stack${entity._burnStacks > 1 ? 's' : ''}, dealing ${totalDmg} damage per turn. Each stack lasts 3 turns.` });
  }
  if (entity._stunned) {
    effects.push({ text: '⚡ Stunned', color: 'var(--danger)', tooltip: 'Cannot attack' });
  }
  if (entity._phaseActive) {
    effects.push({ text: '🌀 Destabilized', color: 'var(--danger)', tooltip: 'May phase out next attack' });
  }
  if (entity._poisonStacks && entity._poisonStacks > 0) {
    const minTurns = entity._poisonQueue && entity._poisonQueue.length > 0 ? Math.min(...entity._poisonQueue) : 0;
    const maxTurns = entity._poisonQueue && entity._poisonQueue.length > 0 ? Math.max(...entity._poisonQueue) : 0;
    const totalDmg = entity._poisonStacks * 2;
    const turnsText = minTurns > 0 ? ` (${totalDmg} dmg/turn, ${minTurns}-${maxTurns > minTurns ? maxTurns : minTurns} turns left)` : '';
    effects.push({ text: `☠️ Poisoned x${entity._poisonStacks}${turnsText}`, color: 'var(--danger)', tooltip: `${entity._poisonStacks} stack${entity._poisonStacks > 1 ? 's' : ''}, dealing ${totalDmg} damage per turn. Each stack lasts 3 turns.` });
  }
  
  // Positive effects (blue)
  // Check entity properties directly (set during combat)
  if (entity._adrenalineBonus && entity._adrenalineBonus > 0) {
    effects.push({ text: `💪 Adrenaline +${entity._adrenalineBonus}`, color: 'var(--accent)', tooltip: `+${entity._adrenalineBonus} bonus damage` });
  }
  
  // 0.9.0 - Consumable buffs
  if (entity._stimpackEvasion && entity._stimpackEvasion > 0) {
    effects.push({ text: `💉 Stimpack (+${Math.round(entity._stimpackEvasion*100)}% dodge) [${entity._stimpackTurns || 0}]`, color: 'var(--success)', tooltip: `Enhanced evasion for ${entity._stimpackTurns || 0} more turns` });
  }
  if (entity._combatDrugBonus && entity._combatDrugBonus > 0) {
    effects.push({ text: `💊 Combat Drug +${entity._combatDrugBonus} damage [${entity._combatDrugTurns || 0}]`, color: '#ff8c00', tooltip: `+${entity._combatDrugBonus} damage for ${entity._combatDrugTurns || 0} more turns` });
  }
  if (entity._stealthField) {
    effects.push({ text: '🌫️ Stealth Field', color: '#9c27b0', tooltip: 'Will dodge next attack' });
  }
  
  // Check currentCombat objects for action-based status (these persist across renders)
  if (currentCombat && currentCombat.guarding && currentCombat.guarding[entity.id]) {
    effects.push({ text: '🛡️ Guarding', color: 'var(--accent)', tooltip: `+${BALANCE.COMBAT_ACTIONS.Guard.defenseBonus} defense this turn` });
  }
  if (currentCombat && currentCombat.aimed && currentCombat.aimed[entity.id]) {
    effects.push({ text: '🎯 Aimed', color: 'var(--accent)', tooltip: `+${Math.round(BALANCE.COMBAT_ACTIONS.Aim.accuracyBonus * 100)}% hit chance next shot` });
  }
  
  // 0.9.0 - Entity flag checks (retreating/retreated status)
  if (entity._retreated) {
    effects.push({ text: 'Retreated', color: '#808080', tooltip: 'Successfully fled from combat' });
  } else if (entity._retreating) {
    effects.push({ text: 'Retreating', color: 'var(--muted)', tooltip: 'Attempting to flee combat' });
  }
  
  // === EQUIPMENT PASSIVE EFFECTS (Survivors only) ===
  if (!isAlien) {
    const weapon = entity.equipment && entity.equipment.weapon;
    const armor = entity.equipment && entity.equipment.armor;
    const classColor = 'var(--accent)'; // Blue color for class bonuses
    const weapColor = weapon?.rarity ? (RARITY_COLORS[weapon.rarity] || 'var(--accent)') : 'var(--accent)';
    const armorColor = armor?.rarity ? (RARITY_COLORS[armor.rarity] || 'var(--accent)') : 'var(--accent)';
    
    // Calculate level bonuses
    const levelDamageBonus = entity.level > 1 ? Math.round((entity.level - 1) * (BALANCE.LEVEL_ATTACK_BONUS || 0.02) * 100) : 0;
    const levelAccBonus = entity.level > 1 ? Math.round((entity.level - 1) * (BALANCE.LEVEL_ACCURACY_BONUS || 0.01) * 100) : 0;
    
    // === DAMAGE BONUS ===
    const classCombatBonus = entity.classBonuses?.combat ? Math.round((entity.classBonuses.combat - 1) * 100) : 0;
    const totalDamageBonus = levelDamageBonus + classCombatBonus;
    
    if (totalDamageBonus > 0) {
      const sources = [];
      if (levelDamageBonus > 0) sources.push(`Level ${entity.level} (+${levelDamageBonus}%)`);
      if (classCombatBonus > 0) sources.push(`Class (+${classCombatBonus}%)`);
      effects.push({ 
        text: `Damage +${totalDamageBonus}%`, 
        color: classColor, 
        tooltip: `+${totalDamageBonus}% damage from: ${sources.join(', ')}` 
      });
    }
    
    // === ACCURACY BONUS ===
    const classAccBonus = entity.classBonuses?.accuracy ? Math.round(entity.classBonuses.accuracy * 100) : 0;
    const weaponAccBonus = weapon?.effects?.find(e => e.startsWith('accuracy:')) ? parseInt(weapon.effects.find(e => e.startsWith('accuracy:')).split(':')[1]) : 0;
    const totalAccBonus = levelAccBonus + classAccBonus + weaponAccBonus;
    
    if (totalAccBonus > 0) {
      const sources = [];
      if (levelAccBonus > 0) sources.push(`Level ${entity.level} (+${levelAccBonus}%)`);
      if (classAccBonus > 0) sources.push(`Class (+${classAccBonus}%)`);
      if (weaponAccBonus > 0) sources.push(`${weapon.name} (+${weaponAccBonus}%)`);
      
      // Use weapon color if weapon contributes, otherwise class color
      const accColor = weaponAccBonus > 0 ? weapColor : classColor;
      effects.push({ 
        text: `Accuracy +${totalAccBonus}%`, 
        color: accColor, 
        tooltip: `+${totalAccBonus}% hit chance from: ${sources.join(', ')}` 
      });
    }
    
    // === DEFENSE BONUS ===
    const classDefBonus = entity.classBonuses?.defense || 0;
    if (classDefBonus > 0) {
      effects.push({ 
        text: `Defense +${classDefBonus}`, 
        color: classColor, 
        tooltip: `+${classDefBonus} damage reduction from Class` 
      });
    }
    
    // === CRIT BONUS ===
    const classCritBonus = entity.classBonuses?.crit ? Math.round(entity.classBonuses.crit * 100) : 0;
    const weaponCritBonus = weapon?.effects?.find(e => e.startsWith('crit:')) ? parseInt(weapon.effects.find(e => e.startsWith('crit:')).split(':')[1]) : 0;
    const armorCritBonus = armor?.effects?.find(e => e.startsWith('crit:')) ? parseInt(armor.effects.find(e => e.startsWith('crit:')).split(':')[1]) : 0;
    const totalCritBonus = classCritBonus + weaponCritBonus + armorCritBonus;
    
    if (totalCritBonus > 0) {
      const sources = [];
      if (classCritBonus > 0) sources.push(`Class (+${classCritBonus}%)`);
      if (weaponCritBonus > 0) sources.push(`${weapon.name} (+${weaponCritBonus}%)`);
      if (armorCritBonus > 0) sources.push(`${armor.name} (+${armorCritBonus}%)`);
      
      // Use equipment color if equipment contributes, otherwise class color
      let critColor = classColor;
      if (armorCritBonus > 0) critColor = armorColor;
      else if (weaponCritBonus > 0) critColor = weapColor;
      
      effects.push({ 
        text: `Crit +${totalCritBonus}%`, 
        color: critColor, 
        tooltip: `+${totalCritBonus}% crit chance from: ${sources.join(', ')}` 
      });
    }
    
    // === DODGE BONUS ===
    const classDodgeBonus = entity.classBonuses?.dodge ? Math.round((entity.classBonuses.dodge - 1) * 100) : 0;
    const armorDodgeBonus = armor?.effects?.find(e => e.startsWith('dodge:')) ? parseInt(armor.effects.find(e => e.startsWith('dodge:')).split(':')[1]) : 0;
    const totalDodgeBonus = classDodgeBonus + armorDodgeBonus;
    
    if (totalDodgeBonus > 0) {
      const sources = [];
      if (classDodgeBonus > 0) sources.push(`Class (+${classDodgeBonus}%)`);
      if (armorDodgeBonus > 0) sources.push(`${armor.name} (+${armorDodgeBonus}%)`);
      
      const dodgeColor = armorDodgeBonus > 0 ? armorColor : classColor;
      effects.push({ 
        text: `Dodge +${totalDodgeBonus}%`, 
        color: dodgeColor, 
        tooltip: `+${totalDodgeBonus}% dodge chance from: ${sources.join(', ')}` 
      });
    }
    
    // === OTHER WEAPON EFFECTS (non-stackable) ===
    if (weapon?.effects) {
      for (const effect of weapon.effects) {
        const [effectType, value] = effect.split(':');
        switch (effectType) {
          case 'accuracy':
          case 'crit':
            // Already handled above
            break;
          case 'burn':
            effects.push({ text: `Burn ${value}%`, color: weapColor, tooltip: `${value}% chance to ignite (2 dmg/turn for 3 turns) from ${weapon.name}` });
            break;
          case 'stun':
            effects.push({ text: `Stun ${value}%`, color: weapColor, tooltip: `${value}% chance to stun enemies (skip turn) from ${weapon.name}` });
            break;
          case 'armorPierce':
            effects.push({ text: `Pierce ${value}%`, color: weapColor, tooltip: `Ignores ${value}% of enemy armor from ${weapon.name}` });
            break;
          case 'phase':
            effects.push({ text: `Phase ${value}%`, color: weapColor, tooltip: `${value}% chance to destabilize enemies from ${weapon.name}` });
            break;
          case 'splash':
            if (value) {
              effects.push({ text: `Splash ${value}%`, color: weapColor, tooltip: `${value}% chance for area damage from ${weapon.name}` });
            }
            break;
          case 'burst':
            effects.push({ text: `Burst +${value}`, color: weapColor, tooltip: `+${value} bonus shots from ${weapon.name}` });
            break;
        }
      }
    }
    
    // === OTHER ARMOR EFFECTS (non-stackable) ===
    if (armor?.effects) {
      for (const effect of armor.effects) {
        const [effectType, value] = effect.split(':');
        switch (effectType) {
          case 'dodge':
          case 'crit':
            // Already handled above
            break;
          case 'reflect':
            effects.push({ text: `Reflect ${value}%`, color: armorColor, tooltip: `${value}% chance to reflect damage from ${armor.name}` });
            break;
          case 'regen':
            effects.push({ text: `Regen +${value}`, color: armorColor, tooltip: `+${value} HP per combat round from ${armor.name}` });
            break;
          case 'hpBonus':
            effects.push({ text: `Max HP +${value}`, color: armorColor, tooltip: `+${value} max HP from ${armor.name}` });
            break;
          case 'retreat':
            effects.push({ text: `Retreat +${value}%`, color: armorColor, tooltip: `+${value}% retreat chance from ${armor.name}` });
            break;
          case 'exploration':
            effects.push({ text: `Explore Cost -${value}%`, color: armorColor, tooltip: `-${value}% exploration energy cost from ${armor.name}` });
            break;
          case 'immunity':
            effects.push({ text: `Immune: ${value}`, color: armorColor, tooltip: `Immune to ${value} effects from ${armor.name}` });
            break;
        }
      }
    }
    
    // === DYNAMIC AURA EFFECTS (0.9.0) ===
    if (party && party.length > 0) {
      const aliveParty = party.filter(p => p.hp > 0 && !p.downed);
      
      // Guardian Aura: +3 defense per Guardian
      const guardians = aliveParty.filter(g => hasAbility(g, 'aura') && g !== entity);
      if (guardians.length > 0) {
        const auraBonus = guardians.length * 3;
        effects.push({
          text: `Guardian Aura +${auraBonus}`,
          color: 'var(--accent)',
          tooltip: `+${auraBonus} defense from ${guardians.length} Guardian${guardians.length > 1 ? 's' : ''} on the field`
        });
      }
    }
  }
  
  // === ALIEN SPECIAL ABILITIES ===
  // NOTE: Base alien specials (dodge, ambush, etc.) are now shown in the modifiers line above stats
  // Only show temporary combat status effects here for aliens
  if (isAlien) {
    // Don't add base special abilities here - they're already shown as hoverable badges above
    // This section is ONLY for temporary combat effects like burning, stunned, etc.
  }
  
  if (effects.length === 0) return '';
  
  const effectsHtml = effects.map(e => 
    `<span title="${e.tooltip}" style="color:${e.color};white-space:nowrap">${e.text}</span>`
  ).join(' • ');
  
  return `<div class="small" style="margin-top:8px;padding-top:8px;border-top:1px solid rgba(255,255,255,0.1)">${effectsHtml}</div>`;
}

// 0.9.0 - Apply weapon effects in interactive combat
function applyWeaponEffectsInteractive(weapon, target, attacker, baseDmg) {
  if (!weapon.effects || weapon.effects.length === 0) return;
  
  for (const effect of weapon.effects) {
    const [effectType, valueStr] = effect.split(':');
    const value = parseInt(valueStr) || 0;
    
    // Check if this is a chance-based effect or passive effect
    const isChanceBased = ['burn', 'stun', 'phase', 'splash'].includes(effectType);
    const chance = isChanceBased ? value : 100; // armorPierce is passive (always active for this weapon)
    
    if (Math.random() * 100 < chance) {
      switch (effectType) {
        case 'burn':
          // Burn: Each stack lasts 3 turns independently
          // Deal 2 damage per stack per turn (no initial damage)
          if (!target._burnQueue) target._burnQueue = [];
          target._burnQueue.push(3); // Add new stack with 3 turns
          target._burnStacks = target._burnQueue.length;
          logCombat(`🔥 ${target.name} is set ablaze! (${target._burnStacks} stack${target._burnStacks > 1 ? 's' : ''})`, true);
          renderCombatUI(); // Update UI to show burn status
          break;
          
        case 'stun':
          // Stun: Skip next turn
          if (!target._stunned) {
            target._stunned = true;
            logCombat(`⚡ ${target.name} is stunned!`, true);
            renderCombatUI(); // Update UI to show stun status
          }
          break;
          
        case 'armorPierce':
          // ArmorPierce: Store on attacker's current attack (not the target)
          // This will be read during damage calculation
          if (!attacker._currentArmorPierce) {
            attacker._currentArmorPierce = value;
          }
          break;
          
        case 'phase':
          // Phase: Chance to ignore next attack
          target._phaseActive = true;
          logCombat(`👻 ${target.name} is destabilized!`, true);
          renderCombatUI(); // Update UI to show destabilized status
          break;
          
        case 'splash':
          // Splash: Hit additional targets (always triggers)
          const splashDmg = Math.max(1, Math.floor(baseDmg * 0.5)); // 50% splash damage
          const targetIndex = currentCombat.aliens.findIndex(al => al.id === target.id);
          const splashTargets = [];
          if (targetIndex > 0) {
            const leftTarget = currentCombat.aliens[targetIndex - 1];
            if (leftTarget && leftTarget.hp > 0) splashTargets.push(leftTarget);
          }
          if (targetIndex < currentCombat.aliens.length - 1) {
            const rightTarget = currentCombat.aliens[targetIndex + 1];
            if (rightTarget && rightTarget.hp > 0) splashTargets.push(rightTarget);
          }
          
          if (splashTargets.length > 0) {
            logCombat(`💥 Splash damage hits adjacent targets!`, true);
            for (const splashTarget of splashTargets) {
              // Apply alien armor to splash damage too
              const splashArmor = splashTarget.armor || 0;
              const splashDealt = Math.max(1, splashDmg - splashArmor);
              splashTarget.hp -= splashDealt;
              logCombat(`${splashTarget.name} is hit by splash for ${splashDealt} damage.`);
              if (splashTarget.hp <= 0) {
                logCombat(`${splashTarget.name} eliminated by splash damage.`);
                state.alienKills = (state.alienKills || 0) + 1;
              }
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

// 0.9.0 - Get passive dodge bonus from armor (simpler version for dodge checks)
function getArmorPassiveBonuses(armor) {
  const bonuses = { dodgeBonus: 0 };
  if (!armor || !armor.effects) return bonuses;
  
  for (const effect of armor.effects) {
    const [effectType, valueStr] = effect.split(':');
    const value = parseInt(valueStr) || 0;
    
    if (effectType === 'dodge') {
      bonuses.dodgeBonus += value / 100;
    }
  }
  
  return bonuses;
}

// 0.9.0 - Apply armor effects in interactive combat
function applyArmorEffectsInteractive(armor, survivor) {
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
        bonuses.dodgeBonus += value / 100;
        break;
      case 'reflect':
        bonuses.reflectChance += value / 100;
        break;
      case 'regen':
        bonuses.regenAmount += value;
        break;
      case 'immunity':
        bonuses.immunities.push(valueStr);
        break;
      case 'hpBonus':
        bonuses.hpBonus += value;
        break;
      case 'crit':
        bonuses.critBonus += value / 100;
        break;
    }
  }
  
  return bonuses;
}

let currentCombat = null; // { context, idx, partyIds, aliens, turn, aimed, log, explorerId, activePartyIdx, selectedTargetId }

function openCombatOverlay() {
  const overlay = document.getElementById('combatOverlay');
  overlay.style.display = 'flex';
  renderCombatUI();
}

function closeCombatOverlay() {
  const overlay = document.getElementById('combatOverlay');
  overlay.style.display = 'none';
  
  // 0.9.0 - Clear all temporary combat flags from aliens when closing overlay
  if (currentCombat && currentCombat.aliens) {
    currentCombat.aliens.forEach(a => {
      delete a._stunned;
      delete a._stunnedLastTurn;
      delete a._burnStacks;
      delete a._burnQueue;
      delete a._poisonStacks;
      delete a._poisonQueue;
      delete a._phaseActive;
      delete a._justPhased;
      delete a._relentlessBonus;
      delete a._currentArmorPierce;
      delete a._shieldUsed;
      delete a._lifesaverUsed;
      delete a._hivemindUsed;
    });
  }
  
  currentCombat = null;
}

// 0.9.0 - Patch alien objects missing armor/rarity (for backward compatibility with old saves)
function patchAlienData(alien) {
  // Ensure alien has a stable id even if other properties are present
  if (alien.id === undefined || alien.id === null) {
    const tStamp = Date.now();
    const rand = Math.floor(Math.random() * 10000);
    alien.id = alien.type ? `${alien.type}_${tStamp}_${rand}` : `a_${tStamp}_${rand}`;
  }

  // If alien already has armor/rarity/attackRange, continue to ensure id exists but skip further patches
  if (alien.armor !== undefined && alien.rarity !== undefined && alien.attackRange !== undefined) {
    return alien;
  }
  
  // Find the alien type definition
  const alienType = ALIEN_TYPES.find(at => at.id === alien.type);
  if (!alienType) return alien;
  
  // Patch missing properties
  if (alien.armor === undefined) {
    alien.armor = alienType.armor || 0;
  }
  if (alien.rarity === undefined) {
    alien.rarity = alienType.rarity || 'common';
  }
  if (alien.attackRange === undefined) {
    alien.attackRange = alienType.attackRange || [alien.attack || 0, alien.attack || 0];
  }

  // Ensure alien has a stable id (fix for missing ids from older or programmatically-created objects)
  if (alien.id === undefined || alien.id === null) {
    // Prefer using type-based id when available to improve readability in logs
    const tStamp = Date.now();
    const rand = Math.floor(Math.random() * 10000);
    alien.id = alien.type ? `${alien.type}_${tStamp}_${rand}` : `a_${tStamp}_${rand}`;
  }
  
  return alien;
}

function interactiveEncounterAtTile(idx) {
  const t = state.tiles[idx];
  
  // 0.9.0 - Check if aliens already exist on this tile (from previous retreat)
  if (!t.aliens || t.aliens.length === 0) {
    // First visit - spawn new aliens
    const size = rand(1, 3);
    t.aliens = [];
    for (let i = 0; i < size; i++) {
      // 0.9.0 - Use threat-based selection instead of random
      const at = (typeof pickAlienTypeByThreat === 'function')
        ? pickAlienTypeByThreat(state.threat)
        : ALIEN_TYPES[rand(0, ALIEN_TYPES.length - 1)];
      const hp = rand(at.hpRange[0], at.hpRange[1]);
      
      // 0.8.0 - Roll for rare modifiers
      // 0.9.0 - Pass threat value for scaling
      const modifiers = rollAlienModifiers(at.id, state.threat);
      
      const alien = {
        id: `a_${Date.now()}_${i}`,
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
      firstStrike: true
    };
    
    // 0.9.0 - CRITICAL FIX: Apply modifier stat bonuses to alien
    if (typeof applyModifiersToAlienStats === 'function') {
      applyModifiersToAlienStats(alien);
    }
    
    // 0.9.0 - Apply escalation bonuses to field aliens (affects all exploration)
    if (typeof applyEscalationToAlien === 'function') {
      applyEscalationToAlien(alien);
    }
    
    t.aliens.push(alien);
    }
  } else {
    // Revisit - heal alive aliens to full HP (dead aliens stay dead)
    t.aliens.forEach(alien => {
      if (alien.hp > 0) {
        alien.hp = alien.maxHp;
        alien.firstStrike = true; // Reset combat state
      }
    });
    // Remove dead aliens
    t.aliens = t.aliens.filter(a => a.hp > 0);
    
    if (t.aliens.length === 0) {
      // All aliens were killed previously
      appendLog(`The sector is clear of threats.`);
      t.type = 'empty';
      t.cleared = true;
      return;
    }
  }
  
  const explorer = state.survivors.find(s => s.id === state.selectedExplorerId);
  if (!explorer) {
    appendLog('No explorer selected for engagement.');
    return;
  }
  
  // 0.9.0 - Patch any aliens from old saves
  t.aliens = t.aliens.map(patchAlienData);
  
  currentCombat = {
    context: 'field',
    idx,
    partyIds: [explorer.id],
    aliens: t.aliens,
    turn: 1,
    aimed: {},
    guarding: {},
    log: [],
    activePartyIdx: 0,
    selectedTargetId: (t.aliens && t.aliens.find(a => a.hp > 0) ? t.aliens.find(a => a.hp > 0).id : null)
  };
  
  // 0.9.0 - Clear cooldowns at start of combat
  explorer._burstCooldown = 0;
  
  logCombat('=== ENGAGEMENT START ===');
  logCombat(`${currentCombat.partyIds.length} Survivor vs ${t.aliens.length} Alien(s)`);
  logCombat(`— Turn ${currentCombat.turn} —`);
  logCombat('— Your Turn —');
  appendLog(`Engagement: ${currentCombat.partyIds.length} survivor vs ${t.aliens.length} alien(s).`);
  openCombatOverlay();
}

function interactiveRaidCombat(aliens, guards, turretCount = 0) {
  // Only guards defend the base (0.7.1 - hardcore mode)
  if (!guards || guards.length === 0) {
    appendLog('No guards available: raid overwhelms the base.');
    triggerGameOver('The base was overrun with no defenders. Game Over.');
    return;
  }
  
  // 0.9.0 - Patch any aliens from old saves
  aliens = aliens.map(patchAlienData);
  
  const defenders = guards.map(s => s.id);
  
  // 0.9.0 - Clear cooldowns at start of combat for all guards
  guards.forEach(g => { g._burstCooldown = 0; });
  
  currentCombat = {
    context: 'base',
    idx: null,
    partyIds: defenders,
    aliens,
    turrets: Math.max(0, Number(turretCount) || 0),
    turretsState: Array.from({ length: Math.max(0, Number(turretCount) || 0) }, () => ({ aimed: false })),
    turn: 1,
    aimed: {},
    guarding: {},
    log: [],
    activePartyIdx: 0,
    selectedTargetId: (aliens && aliens.find(a => a.hp > 0) ? aliens.find(a => a.hp > 0).id : null)
  };
  logCombat('=== BASE DEFENSE ===');
  logCombat(`${defenders.length} Guard(s) vs ${aliens.length} Alien(s)`);
  logCombat(`— Turn ${currentCombat.turn} —`);
  logCombat('— Your Turn —');
  appendLog(`Base Defense: ${defenders.length} guard(s) vs ${aliens.length} alien(s).`);
  openCombatOverlay();
}

function logCombat(msg, alsoAppend = false) {
  if (!currentCombat) return;
  currentCombat.log.unshift(msg); // Add to beginning (newest first)
  // Keep log limited to last 12 entries
  if (currentCombat.log.length > 12) currentCombat.log.pop(); // Remove from end
  if (alsoAppend) appendLog(msg);
}

// 0.9.0 - Generate passive effect displays for aliens (like survivor equipment effects)
function getAlienPassiveEffects(alien, alienColor) {
  const effects = [];
  
  // Base special ability effects (use alien's rarity color)
  if (alien.special === 'dodge') {
    effects.push({ text: 'Dodge +25%', color: alienColor, tooltip: '25% chance to evade attacks' });
  } else if (alien.special === 'ambush') {
    effects.push({ text: 'Ambush +50%', color: alienColor, tooltip: 'First strike deals +50% damage' });
  } else if (alien.special === 'pack') {
    effects.push({ text: 'Pack +2', color: alienColor, tooltip: '+2 damage per ally' });
  } else if (alien.special === 'piercing') {
    effects.push({ text: 'Pierce 50%', color: alienColor, tooltip: 'Ignores 50% of armor' });
  } else if (alien.special === 'regeneration') {
    effects.push({ text: 'Regen 2-4', color: alienColor, tooltip: 'Heals 2-4 HP per turn' });
  } else if (alien.special === 'armored') {
    effects.push({ text: 'Resist 50%', color: alienColor, tooltip: 'Takes 50% less damage from all attacks' });
  } else if (alien.special === 'phase') {
    effects.push({ text: 'Phase Shift 40%', color: alienColor, tooltip: '40% chance to phase out and avoid damage' });
  } else if (alien.special === 'multistrike') {
    effects.push({ text: 'Rapid Strikes', color: alienColor, tooltip: 'Attacks twice per turn' });
  }
  
  // Modifier-based passive effects (use modifier's rarity color)
  if (alien.modifiers && alien.modifiers.length > 0) {
    alien.modifiers.forEach(modId => {
      const mods = ALIEN_MODIFIERS[alien.type];
      if (mods) {
        const modDef = mods.find(m => m.id === modId);
        if (modDef) {
          // Extract passive effect text from modifier effects
          const effect = modDef.effect;
          const modColor = modDef.color; // Use the modifier's own color
          
          // Parse ALL patterns and create display text for EVERY modifier
          if (effect.includes('dodge')) {
            const match = effect.match(/\+(\d+)%\s+dodge/);
            if (match) effects.push({ text: `Dodge +${match[1]}%`, color: modColor, tooltip: effect });
          } else if (effect.includes('attack') && effect.includes('+') && !effect.includes('All aliens')) {
            const match = effect.match(/\+(\d+)\s+attack/);
            if (match) effects.push({ text: `Attack +${match[1]}`, color: modColor, tooltip: effect });
          } else if (effect.includes('HP') && effect.includes('+')) {
            const match = effect.match(/\+(\d+)\s+HP/);
            if (match) effects.push({ text: `HP +${match[1]}`, color: modColor, tooltip: effect });
          } else if (effect.includes('regen') && effect.includes('+')) {
            const match = effect.match(/\+(\d+)\s+regen/);
            if (match) effects.push({ text: `Regen +${match[1]}`, color: modColor, tooltip: effect });
          } else if (effect.includes('armor') && effect.includes('Ignores')) {
            const match = effect.match(/Ignores\s+(\d+)%\s+armor/);
            if (match) effects.push({ text: `Pierce ${match[1]}%`, color: modColor, tooltip: effect });
          } else if (effect.includes('less damage') && effect.includes('Take')) {
            const match = effect.match(/Take\s+(\d+)%\s+less\s+damage/);
            if (match) effects.push({ text: `Resist ${match[1]}%`, color: modColor, tooltip: effect });
          } else if (effect.includes('phase') && effect.includes('+')) {
            const match = effect.match(/\+(\d+)%\s+phase/);
            if (match) effects.push({ text: `Phase +${match[1]}%`, color: modColor, tooltip: effect });
          } else if (effect.includes('pack bonus') && effect.includes('+')) {
            const match = effect.match(/\+(\d+)%\s+pack\s+bonus/);
            if (match) effects.push({ text: `Pack +${match[1]}%`, color: modColor, tooltip: effect });
          } else if (effect.includes('damage') && effect.includes('+') && effect.includes('%')) {
            const match = effect.match(/\+(\d+)%\s+damage/);
            if (match) effects.push({ text: `Damage +${match[1]}%`, color: modColor, tooltip: effect });
          } else if (effect.includes('crit damage')) {
            const match = effect.match(/\+(\d+)%\s+crit\s+damage/);
            if (match) effects.push({ text: `Crit +${match[1]}%`, color: modColor, tooltip: effect });
          }
          // Handle special cases that don't match numeric patterns
          else if (modId === 'shadow') {
            effects.push({ text: 'Shadow +20%', color: modColor, tooltip: effect });
          } else if (modId === 'pack_leader') {
            effects.push({ text: 'Pack Aura +2', color: modColor, tooltip: effect });
          } else if (modId === 'matriarch') {
            effects.push({ text: 'Hive Aura +1', color: modColor, tooltip: effect });
          } else if (modId === 'empress') {
            effects.push({ text: 'Triple Strike', color: modColor, tooltip: effect });
          } else if (modId === 'cunning') {
            effects.push({ text: '2nd Ambush', color: modColor, tooltip: effect });
          } else if (modId === 'relentless') {
            effects.push({ text: 'Vengeance', color: modColor, tooltip: effect });
          } else if (modId === 'blink') {
            effects.push({ text: 'Phase Strike', color: modColor, tooltip: effect });
          } else if (modId === 'spawner') {
            effects.push({ text: 'Death Spawn', color: modColor, tooltip: effect });
          } else if (modId === 'unstoppable') {
            effects.push({ text: 'Crit Immune', color: modColor, tooltip: effect });
          } else if (modId === 'hivemind') {
            effects.push({ text: 'Resurrect', color: modColor, tooltip: effect });
          } else if (modId === 'toxic') {
            effects.push({ text: 'Weaken -2', color: modColor, tooltip: effect });
          } else if (modId === 'caustic') {
            effects.push({ text: 'Splash', color: modColor, tooltip: effect });
          } else if (modId === 'plague') {
            effects.push({ text: 'AOE+Poison', color: modColor, tooltip: effect });
          }
          // Generic fallback for remaining effects
          else if (effect.includes('poison') || effect.includes('ambush') || effect.includes('when') || effect.includes('Summon') || effect.includes('All')) {
            effects.push({ text: modDef.name, color: modColor, tooltip: effect });
          }
        }
      }
    });
  }
  
  if (effects.length === 0) return '';
  
  const effectsHtml = effects.map(e => 
    `<span title="${e.tooltip}" style="color:${e.color};white-space:nowrap">${e.text}</span>`
  ).join(' • ');
  
  return `<div class="small" style="margin-top:8px;padding-top:8px;border-top:1px solid rgba(255,255,255,0.1)">${effectsHtml}</div>`;
}

// 0.9.0 - Calculate dynamic damage for aliens (includes pack bonus, auras, etc.)
function calculateAlienDamage(alien, aliens) {
  const aliveAliens = aliens.filter(a => a.hp > 0);
  
  // Base damage
  const attackMin = alien.attackRange ? alien.attackRange[0] : (alien.attack || 0);
  const attackMax = alien.attackRange ? alien.attackRange[1] : (alien.attack || 0);
  let minDmg = attackMin;
  let maxDmg = attackMax;
  const sources = [];
  
  // Matriarch aura: All aliens gain +1 attack
  const matriarchs = aliveAliens.filter(al => hasModifier(al, 'matriarch'));
  if (matriarchs.length > 0) {
    const matriarchBonus = matriarchs.length;
    minDmg += matriarchBonus;
    maxDmg += matriarchBonus;
    sources.push(`Hive Aura (+${matriarchBonus})`);
  }
  
  // Empress aura: All aliens gain +2 attack
  const empress = aliveAliens.filter(al => hasModifier(al, 'empress'));
  if (empress.length > 0) {
    const empressBonus = empress.length * 2;
    minDmg += empressBonus;
    maxDmg += empressBonus;
    sources.push(`Empress Aura (+${empressBonus})`);
  }
  
  // Pack tactics: +2 damage per ally (or more with modifiers)
  if (alien.special === 'pack') {
    const allyCount = aliveAliens.filter(al => al !== alien).length;
    let packBonus = 2;
    
    // Coordinated: +50% pack bonus
    if (hasModifier(alien, 'coordinated')) {
      packBonus = Math.floor(packBonus * 1.5);
    }
    
    // Dire: +100% pack bonus
    if (hasModifier(alien, 'dire')) {
      packBonus = Math.floor(packBonus * 2);
    }
    
    const totalPackBonus = allyCount * packBonus;
    if (totalPackBonus > 0) {
      minDmg += totalPackBonus;
      maxDmg += totalPackBonus;
      sources.push(`Pack (${allyCount} × ${packBonus} = +${totalPackBonus})`);
    }
    
    // Pack Leader aura: All pack members gain +2 damage
    const leaders = aliveAliens.filter(al => hasModifier(al, 'pack_leader'));
    if (leaders.length > 0 && alien.special === 'pack') {
      const leaderBonus = leaders.length * 2;
      minDmg += leaderBonus;
      maxDmg += leaderBonus;
      sources.push(`Pack Leader Aura (+${leaderBonus})`);
    }
  }
  
  // Enraged: +4 attack below 50% HP
  if (hasModifier(alien, 'enraged') && alien.hp < alien.maxHp * 0.5) {
    minDmg += 4;
    maxDmg += 4;
    sources.push('Enraged (+4)');
  }
  
  // Feral: +3 attack when pack active (Stalker with allies)
  if (hasModifier(alien, 'feral') && alien.special === 'pack') {
    const allyCount = aliveAliens.filter(al => al !== alien).length;
    if (allyCount > 0) {
      minDmg += 3;
      maxDmg += 3;
      sources.push('Feral (+3)');
    }
  }
  
  // Aggressive: +2 attack (Drone modifier)
  if (hasModifier(alien, 'aggressive')) {
    minDmg += 2;
    maxDmg += 2;
    sources.push('Aggressive (+2)');
  }
  
  // Alpha: +4 attack (Drone modifier)
  if (hasModifier(alien, 'alpha')) {
    minDmg += 4;
    maxDmg += 4;
    sources.push('Alpha (+4)');
  }
  
  // Crusher: +4 attack (Ravager modifier)
  if (hasModifier(alien, 'crusher')) {
    minDmg += 4;
    maxDmg += 4;
    sources.push('Crusher (+4)');
  }
  
  // Colossus: +6 attack (Ravager modifier)
  if (hasModifier(alien, 'colossus')) {
    minDmg += 6;
    maxDmg += 6;
    sources.push('Colossus (+6)');
  }
  
  // Dominant: +3 attack (Queen modifier)
  if (hasModifier(alien, 'dominant')) {
    minDmg += 3;
    maxDmg += 3;
    sources.push('Dominant (+3)');
  }
  
  // Ancient: +2 attack (Queen modifier)
  if (hasModifier(alien, 'ancient')) {
    minDmg += 2;
    maxDmg += 2;
    sources.push('Ancient (+2)');
  }
  
  // Titan: +3 attack (Brood modifier)
  if (hasModifier(alien, 'titan')) {
    minDmg += 3;
    maxDmg += 3;
    sources.push('Titan (+3)');
  }
  
  return {
    min: minDmg,
    max: maxDmg,
    sources: sources,
    display: minDmg === maxDmg ? `${minDmg}` : `${minDmg}-${maxDmg}`
  };
}

// 0.9.0 - Calculate dynamic defense for survivors (includes Guardian aura, etc.)
function calculateSurvivorDefense(survivor, party) {
  const aliveParty = party.filter(s => s.hp > 0 && !s.downed);
  
  const armorDef = calculateArmorDefense(survivor);
  const classDef = (survivor.classBonuses && survivor.classBonuses.defense) ? survivor.classBonuses.defense : 0;
  let totalDef = armorDef + classDef;
  const sources = [];
  
  if (armorDef > 0) sources.push(`Armor (${armorDef})`);
  if (classDef > 0) sources.push(`Class (${classDef})`);
  
  // Guardian aura: +3 defense to all allies
  const guardians = aliveParty.filter(g => hasAbility(g, 'aura') && g !== survivor);
  if (guardians.length > 0) {
    const auraBonus = guardians.length * 3;
    totalDef += auraBonus;
    sources.push(`Guardian Aura (+${auraBonus})`);
  }
  
  // Guarding stance: +3 defense this turn
  if (currentCombat && currentCombat.guarding && currentCombat.guarding[survivor.id]) {
    totalDef += 3;
    sources.push('Guarding (+3)');
  }
  
  return {
    value: totalDef,
    sources: sources
  };
}

// 0.9.0 - Calculate all dynamic combat stats for survivors
function calculateSurvivorStats(survivor, party) {
  const aliveParty = party.filter(s => s.hp > 0 && !s.downed);
  
  // DAMAGE calculation - 0.9.0: Removed skill system, damage comes from weapon + level/class bonuses
  
  // Calculate damage multiplier (level + class bonuses)
  let damageMultiplier = 1.0;
  const levelBonus = (survivor.level - 1) * BALANCE.LEVEL_ATTACK_BONUS; // 0% at level 1, +2% per level
  damageMultiplier += levelBonus;
  
  const classCombatBonus = (survivor.classBonuses && survivor.classBonuses.combat) ? (survivor.classBonuses.combat - 1) : 0;
  damageMultiplier += classCombatBonus;
  
  // Add Berserker bonus if active
  if (hasAbility(survivor, 'berserker') && survivor.hp < survivor.maxHp * 0.3) {
    damageMultiplier += 0.30;
  }
  
  // 0.9.0 - Add morale combat modifier
  const moraleModifier = getMoraleModifier(survivor);
  const moraleCombatBonus = moraleModifier.combat - 1; // -0.15 to +0.15
  damageMultiplier *= moraleModifier.combat;
  
  const weapon = survivor.equipment.weapon;
  let damageDisplay = '';
  let damageMin = 0;
  let damageMax = 0;
  
  const damageSources = [];
  
  // Get base weapon damage first
  let baseMin = 0;
  let baseMax = 0;
  let weaponName = '';
  
  if (weapon && weapon.damage && Array.isArray(weapon.damage)) {
    baseMin = weapon.damage[0];
    baseMax = weapon.damage[1];
    weaponName = weapon.name;
  } else if (weapon && weapon.type === 'rifle') {
    baseMin = baseMax = 8;
    weaponName = weapon.name;
  } else if (weapon && weapon.type === 'shotgun') {
    baseMin = 6;
    baseMax = 12;
    weaponName = weapon.name;
  } else {
    baseMin = BALANCE.UNARMED_DAMAGE?.[0] || 1;
    baseMax = BALANCE.UNARMED_DAMAGE?.[1] || 3;
    weaponName = 'Unarmed';
  }
  
  // Show base weapon damage
  const baseDisplay = baseMin === baseMax ? `${baseMin}` : `${baseMin}-${baseMax}`;
  damageSources.push(`${weaponName} (${baseDisplay})`);
  
  // Show all percentage bonuses
  if (levelBonus > 0) {
    const levelPercent = (levelBonus * 100).toFixed(0);
    damageSources.push(`Level (+${levelPercent}%)`);
  }
  if (classCombatBonus > 0) {
    const classPercent = (classCombatBonus * 100).toFixed(0);
    damageSources.push(`Class (+${classPercent}%)`);
  }
  if (moraleCombatBonus !== 0) {
    const moralePercent = (moraleCombatBonus * 100).toFixed(0);
    const moraleTier = getMoraleTier(survivor.morale || 0);
    const moraleTierName = getMoraleTierName(moraleTier);
    damageSources.push(`Morale [${moraleTierName}] (${moralePercent >= 0 ? '+' : ''}${moralePercent}%)`);
  }
  
  // Calculate final damage with bonuses applied
  damageMin = Math.round(baseMin * damageMultiplier);
  damageMax = Math.round(baseMax * damageMultiplier);
  
  // Display final damage (already shown at bottom of tooltip)
  const totalDisplay = damageMin === damageMax ? `${damageMin}` : `${damageMin}-${damageMax}`;
  damageDisplay = totalDisplay;
  
  // ACCURACY calculation
  const baseAcc = 0.75;
  const levelAccBonus = (survivor.level - 1) * (BALANCE.LEVEL_ACCURACY_BONUS || 0.01);
  const classAccBonus = (survivor.classBonuses && survivor.classBonuses.accuracy) ? survivor.classBonuses.accuracy : 0;
  const weaponAccBonus = weapon?.effects?.find(e => e.startsWith('accuracy:')) 
    ? parseFloat(weapon.effects.find(e => e.startsWith('accuracy:')).split(':')[1]) / 100 
    : 0;
  
  const totalAcc = baseAcc + levelAccBonus + classAccBonus + weaponAccBonus;
  const accSources = [];
  accSources.push(`Base (${Math.round(baseAcc * 100)}%)`);
  if (levelAccBonus > 0) accSources.push(`Level (+${Math.round(levelAccBonus * 100)}%)`);
  if (classAccBonus > 0) accSources.push(`Class (+${Math.round(classAccBonus * 100)}%)`);
  if (weaponAccBonus > 0) accSources.push(`Weapon (+${Math.round(weaponAccBonus * 100)}%)`);
  
  // DEFENSE calculation (already have this function)
  const defenseCalc = calculateSurvivorDefense(survivor, party);
  
  // CRIT calculation
  const baseCrit = 0.12;
  const classCritBonus = (survivor.classBonuses && survivor.classBonuses.crit) ? survivor.classBonuses.crit : 0;
  const weaponCritBonus = weapon?.effects?.find(e => e.startsWith('crit:')) 
    ? parseFloat(weapon.effects.find(e => e.startsWith('crit:')).split(':')[1]) / 100 
    : 0;
  const armorCritBonus = survivor.equipment.armor?.effects?.find(e => e.startsWith('crit:')) 
    ? parseFloat(survivor.equipment.armor.effects.find(e => e.startsWith('crit:')).split(':')[1]) / 100 
    : 0;
  
  const totalCrit = baseCrit + classCritBonus + weaponCritBonus + armorCritBonus;
  const critSources = [];
  critSources.push(`Base (${Math.round(baseCrit * 100)}%)`);
  if (classCritBonus > 0) critSources.push(`Class (+${Math.round(classCritBonus * 100)}%)`);
  if (weaponCritBonus > 0) critSources.push(`Weapon (+${Math.round(weaponCritBonus * 100)}%)`);
  if (armorCritBonus > 0) critSources.push(`Armor (+${Math.round(armorCritBonus * 100)}%)`);
  
  // DODGE calculation
  const classDodgeBonus = (survivor.classBonuses && survivor.classBonuses.dodge) ? (survivor.classBonuses.dodge - 1) : 0;
  const armorDodgeBonus = survivor.equipment.armor?.effects?.find(e => e.startsWith('dodge:')) 
    ? parseFloat(survivor.equipment.armor.effects.find(e => e.startsWith('dodge:')).split(':')[1]) / 100 
    : 0;
  
  let totalDodge = classDodgeBonus + armorDodgeBonus;
  const dodgeSources = [];
  if (classDodgeBonus > 0) dodgeSources.push(`Class (+${Math.round(classDodgeBonus * 100)}%)`);
  if (armorDodgeBonus > 0) dodgeSources.push(`Armor (+${Math.round(armorDodgeBonus * 100)}%)`);
  
  return {
    damage: { display: damageDisplay, min: damageMin, max: damageMax, sources: damageSources },
    accuracy: { value: totalAcc, percent: Math.round(totalAcc * 100), sources: accSources },
    defense: defenseCalc,
    crit: { value: totalCrit, percent: Math.round(totalCrit * 100), sources: critSources },
    dodge: { value: totalDodge, percent: Math.round(totalDodge * 100), sources: dodgeSources }
  };
}

// 0.9.0 - Calculate all dynamic combat stats for aliens
function calculateAlienStats(alien, aliens) {
  const aliveAliens = aliens.filter(a => a.hp > 0);
  
  // DAMAGE calculation (already have this function)
  const damageCalc = calculateAlienDamage(alien, aliens);
  
  // ARMOR/DEFENSE calculation
  const baseArmor = alien.armor || 0;
  const armorSources = [];
  if (baseArmor > 0) armorSources.push(`Base (${baseArmor})`);
  
  // DODGE calculation
  let baseDodge = 0;
  const dodgeSources = [];
  
  // Base special dodge
  if (alien.special === 'dodge') {
    baseDodge = 0.25;
    dodgeSources.push('Evasion (25%)');
  }
  
  // Modifier bonuses
  if (hasModifier(alien, 'swift')) {
    baseDodge += 0.30;
    dodgeSources.push('Swift (+30%)');
  }
  if (hasModifier(alien, 'alpha')) {
    baseDodge += 0.50;
    dodgeSources.push('Alpha (+50%)');
  }
  
  const totalDodge = baseDodge;
  
  // PHASE calculation (similar to dodge but different mechanic)
  let basePhase = 0;
  const phaseSources = [];
  
  if (alien.special === 'phase') {
    basePhase = 0.40;
    phaseSources.push('Phase Shift (40%)');
  }
  if (hasModifier(alien, 'ethereal')) {
    basePhase += 0.10;
    phaseSources.push('Ethereal (+10%)');
  }
  if (hasModifier(alien, 'void')) {
    basePhase = 0.60; // Overrides to 60%
    phaseSources.length = 0;
    phaseSources.push('Void Touched (60%)');
  }
  
  const totalPhase = basePhase;
  
  // REGEN calculation
  let baseRegenMin = 0;
  let baseRegenMax = 0;
  const regenSources = [];
  
  if (alien.special === 'regeneration') {
    baseRegenMin = 2;
    baseRegenMax = 4;
    regenSources.push('Regeneration (2-4)');
  }
  if (hasModifier(alien, 'fastHeal')) {
    baseRegenMin += 2;
    baseRegenMax += 2;
    regenSources.push('Fast Healing (+2)');
  }
  if (hasModifier(alien, 'titan')) {
    baseRegenMin += 4;
    baseRegenMax += 4;
    regenSources.push('Titan (+4)');
  }
  
  const totalRegenMin = baseRegenMin;
  const totalRegenMax = baseRegenMax;
  const regenDisplay = (totalRegenMin > 0 && totalRegenMax > 0) 
    ? (totalRegenMin === totalRegenMax ? `${totalRegenMin}` : `${totalRegenMin}-${totalRegenMax}`)
    : null;
  
  // RESIST calculation (damage reduction %)
  let totalResist = 0;
  const resistSources = [];
  
  if (alien.special === 'armored') {
    totalResist += 0.30;
    resistSources.push('Armored (30%)');
  }
  if (hasModifier(alien, 'hardened')) {
    totalResist += 0.20;
    resistSources.push('Hardened (20%)');
  }
  // Note: Colossus is not additive, it sets a new base.
  if (hasModifier(alien, 'colossus')) {
    totalResist = 0.40;
    resistSources.length = 0;
    resistSources.push('Colossus (40%)');
  }
  
  return {
    damage: damageCalc,
    armor: { value: baseArmor, sources: armorSources },
    dodge: { value: totalDodge, percent: Math.round(totalDodge * 100), sources: dodgeSources },
    phase: { value: totalPhase, percent: Math.round(totalPhase * 100), sources: phaseSources },
    regen: { min: totalRegenMin, max: totalRegenMax, display: regenDisplay, sources: regenSources },
    resist: { value: totalResist, percent: Math.round(totalResist * 100), sources: resistSources }
  };
}

function selectTarget(alienId) {
  if (!currentCombat) return;
  const alien = currentCombat.aliens.find(a => a.id === alienId);
  // Only allow targeting living aliens
  if (alien && alien.hp > 0) {
    currentCombat.selectedTargetId = alienId;
    renderCombatUI();
  }
}


function renderCombatUI() {
  if (!currentCombat) return;
  const content = document.getElementById('combatContent');
  const party = currentCombat.partyIds.map(id => state.survivors.find(s => s.id === id)).filter(Boolean);
  const aliens = currentCombat.aliens;
  const activeSurvivor = party[currentCombat.activePartyIdx];

  const partyHtml = party.map((s, idx) => {
    // 0.9.0 - Show equipment with rarity colors and tooltips
    const weapColor = s.equipment.weapon?.rarity ? (RARITY_COLORS[s.equipment.weapon.rarity] || '#ffffff') : '#ffffff';
    const armorColor = s.equipment.armor?.rarity ? (RARITY_COLORS[s.equipment.armor.rarity] || '#ffffff') : '#ffffff';
    const weapTooltip = s.equipment.weapon ? getItemTooltip(s.equipment.weapon) : '';
    const armorTooltip = s.equipment.armor ? getItemTooltip(s.equipment.armor) : '';
    const weap = s.equipment.weapon ? `<span style="color:${weapColor}" title="${weapTooltip}">${s.equipment.weapon.name}</span>` : 'Unarmed';
    const armor = s.equipment.armor ? `<span style="color:${armorColor}" title="${armorTooltip}">${s.equipment.armor.name}</span>` : 'No Armor';
    const isActive = idx === currentCombat.activePartyIdx;
    const activeClass = isActive ? 'style="border: 2px solid var(--accent);"' : '';
    
    // 0.8.0 - Show downed status
    const downedStatus = s.downed ? '<div class="small" style="color:var(--danger);margin-top:4px">⚠️ DOWNED</div>' : '';
    
    // 0.8.0 - Show class with tooltip
    const classInfo = SURVIVOR_CLASSES.find(c => c.id === s.class);
    const className = classInfo ? classInfo.name : (s.class || 'Unknown');
    const classDesc = classInfo ? classInfo.desc : '';
    const classHtml = `<div class="small" style="color:var(--class-common);margin-top:4px" title="${classDesc}">${className}</div>`;
    
    // 0.8.0 - Show abilities with rarity colors and tooltips
    let abilitiesHtml = '';
    if (s.abilities && s.abilities.length > 0) {
      const abilityDetails = s.abilities.map(abilityId => {
        // Find the ability definition
        for (const classKey in SPECIAL_ABILITIES) {
          const found = SPECIAL_ABILITIES[classKey].find(a => a.id === abilityId);
          if (found) {
            return `<span style="color: ${found.color}" title="${found.effect}">${found.name}</span>`;
          }
        }
        return abilityId;
      });
      abilitiesHtml = `<div class="small" style="margin-top:4px">${abilityDetails.join(' • ')}</div>`;
    }
    
    // 0.9.0 - Calculate ALL combat stats dynamically
    const stats = calculateSurvivorStats(s, party);
    
    // Build comprehensive tooltips with all sources
    let damageTooltip = `Attack Damage per hit`;
    if (stats.damage.sources.length > 0) {
      damageTooltip += `:\n• ${stats.damage.sources.join('\n• ')}`;
      damageTooltip += `\n\nTotal: ${stats.damage.display}`;
    }
    
    let accuracyTooltip = `Hit Chance`;
    if (stats.accuracy.sources.length > 0) {
      accuracyTooltip += `:\n• ${stats.accuracy.sources.join('\n• ')}`;
      accuracyTooltip += `\n\nTotal: ${stats.accuracy.percent}%`;
    }
    
    let defenseTooltip = 'Damage Reduction per hit';
    if (stats.defense.sources.length > 0) {
      defenseTooltip += `:\n• ${stats.defense.sources.join('\n• ')}`;
      defenseTooltip += `\n\nTotal: ${stats.defense.value}`;
    } else {
      defenseTooltip += `: ${stats.defense.value}`;
    }
    
    let critTooltip = `Critical Hit Chance (×1.6 damage)`;
    if (stats.crit.sources.length > 0) {
      critTooltip += `:\n• ${stats.crit.sources.join('\n• ')}`;
      critTooltip += `\n\nTotal: ${stats.crit.percent}%`;
    }
    
    // Build stats display - show dodge only if > 0
    let statsDisplay = `<span title="${damageTooltip}">⚔️ ${stats.damage.display}</span> • <span title="${accuracyTooltip}">🎯 ${stats.accuracy.percent}%</span> • <span title="${defenseTooltip}">🛡️ ${stats.defense.value}</span> • <span title="${critTooltip}">💥 ${stats.crit.percent}%</span>`;
    
    if (stats.dodge.value > 0) {
      let dodgeTooltip = `Dodge Chance`;
      if (stats.dodge.sources.length > 0) {
        dodgeTooltip += `:\n• ${stats.dodge.sources.join('\n• ')}`;
        dodgeTooltip += `\n\nTotal: ${stats.dodge.percent}%`;
      }
      statsDisplay += ` • <span title="${dodgeTooltip}">🌀 ${stats.dodge.percent}%</span>`;
    }
    
    // 0.9.0 - Add morale display with color and tooltip
    const morale = Math.floor(s.morale || 0);
    const moraleTier = getMoraleTier(morale);
    const moraleTierName = getMoraleTierName(moraleTier);
    const moraleColor = getMoraleTierColor(moraleTier);
    const moraleModifiers = getMoraleModifier({ morale: morale });
    const moraleTooltip = `Morale: ${moraleTierName} (${morale})\n• Production: ${moraleModifiers.production >= 1 ? '+' : ''}${Math.round((moraleModifiers.production - 1) * 100)}%\n• Combat: ${moraleModifiers.combat >= 1 ? '+' : ''}${Math.round((moraleModifiers.combat - 1) * 100)}%\n• XP: ${moraleModifiers.xp >= 1 ? '+' : ''}${Math.round((moraleModifiers.xp - 1) * 100)}%`;
    statsDisplay += ` • <span title="${moraleTooltip}" style="color:${moraleColor}">😊 ${morale}</span>`;
    
    // 0.9.0 - Add shared ammo display
    statsDisplay += ` • <span title="Shared Ammo Pool">🔫 ${state.resources.ammo}</span>`;
    
    const statsHtml = `<div class="small" style="margin-top:6px;padding-top:6px;border-top:1px solid rgba(255,255,255,0.1)">${statsDisplay}</div>`;
    
    // 0.9.0 - Show active status effects at the bottom (pass party for dynamic aura calculations)
    const statusEffects = getStatusEffectsDisplay(s, false, null, party);
    
    // 0.9.0 - Calculate effective max HP including armor bonuses
    let effectiveMaxHp = s.maxHp || 20; // Fallback to 20 if undefined
    let hpTooltip = 'Current HP / Maximum HP';
    if (s.equipment && s.equipment.armor) {
      const armorBonuses = applyArmorEffectsInteractive(s.equipment.armor, s);
      if (armorBonuses && armorBonuses.hpBonus) {
        effectiveMaxHp += armorBonuses.hpBonus;
        hpTooltip += `\n• Base Max HP: ${s.maxHp}\n• Armor Bonus: +${armorBonuses.hpBonus}`;
      }
    }
    
    return `<div class="card-like" ${activeClass}><strong>${s.name}${isActive ? ' ⬅' : ''}</strong><div class="small" title="${hpTooltip}">HP ${s.hp}/${effectiveMaxHp}</div>${downedStatus}<div class="small" style="margin-top:4px">${weap} • ${armor}</div>${classHtml}${abilitiesHtml}${statsHtml}${statusEffects}</div>`;
  }).join('');

  const turretHtml = (currentCombat.turrets && currentCombat.turrets > 0)
    ? `<div class="card-like small"><strong>Auto-Turrets</strong><div class="small">${currentCombat.turrets} unit(s) ready</div></div>`
    : '';

  const alienHtml = aliens.map(a => {
    
    const alive = a.hp > 0;
      const isTarget = alive && a.id === currentCombat.selectedTargetId;
      const targetClass = isTarget ? 'targeted-enemy' : '';
    const clickableClass = alive ? 'clickable' : '';
    
    // 0.9.0 - Define rarity color mapping
    const rarityColors = {
      common: 'var(--rarity-common)',
      uncommon: 'var(--rarity-uncommon)',
      rare: 'var(--rarity-rare)',
      legendary: 'var(--rarity-veryrare)'
    };
    const alienColor = rarityColors[a.rarity] || '#ff8a65';
    
    // 0.9.0 - Build combined modifiers display (base special + extra modifiers)
    let modifiersHtml = '';
    const allModifiers = [];
    
    // Add base special ability as a hoverable badge with detailed tooltip
    if (a.specialDesc) {
      const specialName = a.specialDesc.split(':')[0]; // Extract just the name (e.g., "Ambush")
      
      // Create detailed tooltip based on special type
      let detailedTooltip = '';
      if (a.special === 'dodge') {
        detailedTooltip = '25% chance to evade attacks';
      } else if (a.special === 'ambush') {
        detailedTooltip = 'First strike deals +50% damage if at full HP';
      } else if (a.special === 'pack') {
        detailedTooltip = '+2 damage for each other living alien';
      } else if (a.special === 'piercing') {
        detailedTooltip = 'Ignores 50% of armor on all attacks';
      } else if (a.special === 'regeneration') {
        detailedTooltip = 'Recovers 2-4 HP at the end of each turn';
      } else if (a.special === 'armored') {
        detailedTooltip = 'Takes 50% less damage from all attacks';
      } else if (a.special === 'phase') {
        detailedTooltip = '40% chance to phase out of reality and avoid damage';
      } else if (a.special === 'multistrike') {
        detailedTooltip = 'Attacks twice per turn instead of once';
      } else {
        detailedTooltip = a.specialDesc; // Fallback to full description
      }
      
      allModifiers.push(`<span style="color:${alienColor}" title="${detailedTooltip}">${specialName}</span>`);
    }
    
    // Add extra modifiers from ALIEN_MODIFIERS (these already have detailed effect tooltips)
    if (a.modifiers && a.modifiers.length > 0) {
      a.modifiers.forEach(modId => {
        const mods = ALIEN_MODIFIERS[a.type];
        if (mods) {
          const modDef = mods.find(m => m.id === modId);
          if (modDef) {
            allModifiers.push(`<span style="color:${modDef.color}" title="${modDef.effect}">${modDef.name}</span>`);
          }
        }
      });
    }
    
    // Combine all modifiers into one line
    if (allModifiers.length > 0) {
      modifiersHtml = `<div class="small" style="margin-top:4px">${allModifiers.join(' • ')}</div>`;
    }
    
    // 0.9.0 - Combat stats for aliens with COMPREHENSIVE DYNAMIC calculation
    const stats = calculateAlienStats(a, aliens);
    
    // Build detailed damage tooltip (matching survivor format)
    let alienDamageTooltip = `Attack Damage`;
    alienDamageTooltip += `:\n• Base (${a.attackRange ? `${a.attackRange[0]}-${a.attackRange[1]}` : a.attack})`;
    if (stats.damage.sources.length > 0) {
      alienDamageTooltip += `\n• ${stats.damage.sources.join('\n• ')}`;
    }
    alienDamageTooltip += `\n\nTotal: ${stats.damage.display}`;
    
    // Build armor tooltip (matching survivor format)
    let alienArmorTooltip = `Damage Reduction per hit`;
    if (stats.armor.sources.length > 0) {
      alienArmorTooltip += `:\n• ${stats.armor.sources.join('\n• ')}`;
      alienArmorTooltip += `\n\nTotal: ${stats.armor.value}`;
    } else {
      alienArmorTooltip += `: ${stats.armor.value}`;
    }
    
    // Build stats display - start with damage and armor
    let statsDisplay = `<span title="${alienDamageTooltip}">⚔️ ${stats.damage.display}</span> • <span title="${alienArmorTooltip}">🛡️ ${stats.armor.value}</span>`;
    
    // Add dodge if present
    if (stats.dodge.value > 0) {
      let dodgeTooltip = `Dodge Chance`;
      if (stats.dodge.sources.length > 0) {
        dodgeTooltip += `:\n• ${stats.dodge.sources.join('\n• ')}`;
        dodgeTooltip += `\n\nTotal: ${stats.dodge.percent}%`;
      }
      statsDisplay += ` • <span title="${dodgeTooltip}">🌀 ${stats.dodge.percent}%</span>`;
    }
    
    // Add phase if present
    if (stats.phase.value > 0) {
      let phaseTooltip = `Phase Chance`;
      if (stats.phase.sources.length > 0) {
        phaseTooltip += `:\n• ${stats.phase.sources.join('\n• ')}`;
        phaseTooltip += `\n\nTotal: ${stats.phase.percent}%`;
      }
      statsDisplay += ` • <span title="${phaseTooltip}">👻 ${stats.phase.percent}%</span>`;
    }
    
    // Add regen if present (now shows as range)
    if (stats.regen.display) {
      let regenTooltip = `Regeneration`;
      if (stats.regen.sources.length > 0) {
        regenTooltip += `:\n• ${stats.regen.sources.join('\n• ')}`;
        regenTooltip += `\n\nTotal: ${stats.regen.display} HP per turn`;
      }
      statsDisplay += ` • <span title="${regenTooltip}">💚 ${stats.regen.display}/turn</span>`;
    }
    
    // Add resist if present
    if (stats.resist.value > 0) {
      let resistTooltip = `Damage Resistance`;
      if (stats.resist.sources.length > 0) {
        resistTooltip += `:\n• ${stats.resist.sources.join('\n• ')}`;
        resistTooltip += `\n\nTotal: ${stats.resist.percent}%`;
      }
      statsDisplay += ` • <span title="${resistTooltip}">🛟 ${stats.resist.percent}%</span>`;
    }
    
    const statsHtml = `<div class="small" style="margin-top:6px;padding-top:6px;border-top:1px solid rgba(255,255,255,0.1)">${statsDisplay}</div>`;
    
    // 0.9.0 - Show passive effects below stats (like survivor equipment effects)
    const passiveEffects = getAlienPassiveEffects(a, alienColor);
    
    // 0.9.0 - Show temporary combat status effects at the bottom (pass aliens array for dynamic calculations)
    const tempStatusEffects = getStatusEffectsDisplay(a, true, alienColor, aliens);
    
    // 0.9.0 - Use the same rarity color for the alien name
    const nameColor = alienColor;
    
    return `<div class="card-like ${alive ? '' : 'small'} ${targetClass} ${clickableClass}" data-alien-id="${a.id}"><strong style="color: ${nameColor}">${a.name}</strong><div class="small">HP ${Math.max(0,a.hp)}/${a.maxHp}</div>${modifiersHtml}${statsHtml}${passiveEffects}${tempStatusEffects}</div>`;
  }).join('');

  const combatLogHtml = currentCombat.log.map(l => `<div class="small" style="color:var(--muted)">${l}</div>`).join('');

  content.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
      <div>
        <div style="margin-bottom:6px"><strong>Team</strong> <span class="small">Turn ${currentCombat.turn}</span></div>
  ${partyHtml || '<div class="small">No combatants</div>'}
  ${turretHtml}
      </div>
      <div id="hostiles-container">
        <div style="margin-bottom:6px"><strong>Hostiles</strong></div>
        ${alienHtml || '<div class="small">Cleared</div>'}
      </div>
    </div>
    <div style="display: flex; flex-direction: column; padding:8px;background:rgba(0,0,0,0.2);border-radius:4px;height:260px;width:50%;margin:auto;text-align:center;">
      <div class="small" style="margin-bottom:2px"><strong>Combat Log</strong></div>
      <div style="overflow-y:auto; display:flex; flex-direction:column; justify-content:flex-end; flex-grow:1;">
        ${combatLogHtml || '<div class="small" style="color:var(--muted)">No events yet.</div>'}
      </div>
    </div>
  `;

  // Add event listeners for alien targeting using event delegation
  const hostilesContainer = document.getElementById('hostiles-container');
  if (hostilesContainer) {
    // This is a re-render, so we need to make sure we don't add duplicate listeners.
    // A simple way is to replace the node, which removes all old listeners.
    const newContainer = hostilesContainer.cloneNode(true);
    hostilesContainer.parentNode.replaceChild(newContainer, hostilesContainer);

    newContainer.addEventListener('click', (e) => {
      const targetCard = e.target.closest('[data-alien-id]');
      if (targetCard) {
        const hasAttr = targetCard.hasAttribute('data-alien-id');
        const attrValue = targetCard.getAttribute('data-alien-id');
        if (attrValue) {
          selectTarget(attrValue);
        }
      } else {
        // No target card found on click
      }
    });
  }

  // 0.9.0 - Render adaptive action buttons based on weapon type
  renderAdaptiveActions(activeSurvivor);
}

// 0.9.0 - Render combat action buttons based on active survivor's weapon
function renderAdaptiveActions(survivor) {
  const actionsDiv = document.querySelector('.combat-actions');
  if (!actionsDiv || !survivor) return;
  
  const weapon = survivor.equipment?.weapon;
  const weaponType = weapon?.weaponType || 'unarmed';
  const effects = weapon?.effects || [];
  
  // Parse weapon effects
  const hasBurst = effects.some(e => e.startsWith('burst:'));
  const hasAccuracy = effects.some(e => e.startsWith('accuracy:'));
  const hasSplash = effects.some(e => e.startsWith('splash:'));
  
  // Determine available actions based on weapon type
  let actions = [];
  
  if (weaponType === 'melee') {
    // Melee weapons: Strike (basic), Power Attack (burst-like), Guard
    actions.push({ 
      id: 'btnActionShoot', 
      label: 'Strike', 
      class: 'primary', 
      tooltip: 'Melee attack against the target.',
      onclick: 'playerShoot()'
    });
    
    // 0.9.0 - Power Attack with cooldown
    const cooldown = survivor._burstCooldown || 0;
    actions.push({ 
      id: 'btnActionBurst', 
      label: cooldown > 0 ? `Power Attack (${cooldown})` : 'Power Attack', 
      class: '', 
      disabled: cooldown > 0,
      tooltip: cooldown > 0 
        ? `Powerful melee strike. Available in ${cooldown} turn${cooldown !== 1 ? 's' : ''}.`
        : `Powerful melee strike with +${BALANCE.COMBAT_ACTIONS.Burst.dmgBonus} bonus damage. (${BALANCE.COMBAT_ACTIONS.Burst.cooldown} turn cooldown)`,
      onclick: 'playerBurst()'
    });
  } else if (weaponType === 'unarmed') {
    // Unarmed: Punch, Guard only
    actions.push({ 
      id: 'btnActionShoot', 
      label: 'Punch', 
      class: 'primary', 
      tooltip: 'Unarmed strike (low damage).',
      onclick: 'playerShoot()'
    });
  } else {
    // Ranged weapons: Shoot, Aim, Burst (if available)
    actions.push({ 
      id: 'btnActionShoot', 
      label: 'Shoot', 
      class: 'primary', 
      tooltip: 'Fire a single shot at the target.',
      onclick: 'playerShoot()'
    });
    
  // Allow aiming for all ranged weapon types (including shotgun)
  if (hasAccuracy || ['rifle','pistol','shotgun','heavy'].includes(weaponType)) {
      actions.push({ 
        id: 'btnActionAim', 
        label: 'Aim', 
        class: '', 
        tooltip: `Take careful aim (+${Math.round(BALANCE.COMBAT_ACTIONS.Aim.accuracyBonus * 100)}% hit chance next shot).`,
        onclick: 'playerAim()'
      });
    }
    
    // Always offer a Burst action for ranged weapons; weapon effects can add extra shots
    if (weaponType !== 'melee' && weaponType !== 'unarmed') {
      const burstEff = effects.find(e => e.startsWith('burst:'));
      const burstVal = burstEff ? parseInt(burstEff.split(':')[1], 10) || 0 : 0;
      const defaultShots = BALANCE.COMBAT_ACTIONS.Burst.ammoMult || 2;
      const burstShots = defaultShots + burstVal;
      
      // 0.9.0 - Burst with cooldown
      const cooldown = survivor._burstCooldown || 0;
      actions.push({ 
        id: 'btnActionBurst', 
        label: cooldown > 0 ? (hasBurst ? `Burst (${burstShots}) - ${cooldown}` : `Burst (${cooldown})`) : (hasBurst ? `Burst (${burstShots})` : 'Burst'),
        class: '', 
        disabled: cooldown > 0,
        tooltip: cooldown > 0
          ? `Fire multiple shots. Available in ${cooldown} turn${cooldown !== 1 ? 's' : ''}.`
          : (hasBurst 
            ? `Fire ${burstShots} shots. Uses ${burstShots}x ammo. (${BALANCE.COMBAT_ACTIONS.Burst.cooldown} turn cooldown)`
            : `Fire 2 shots. Uses 2x ammo. (${BALANCE.COMBAT_ACTIONS.Burst.cooldown} turn cooldown)`),
        onclick: 'playerBurst()'
      });
    }
  }
  
  // Universal actions available to all
  actions.push({ 
    id: 'btnActionGuard', 
    label: 'Guard', 
    class: '', 
    tooltip: `Brace for impact (+${BALANCE.COMBAT_ACTIONS.Guard.defenseBonus} defense this turn).`,
    onclick: 'playerGuard()'
  });
  
  // 0.9.0 - Use Item button (opens consumable selector)
  const consumables = getAvailableConsumables();
  actions.push({ 
    id: 'btnActionUseItem', 
    label: 'Use Item', 
    class: '', 
    tooltip: `Use a consumable item. (${consumables.length} available)`,
    onclick: 'showConsumableSelector()'
  });
  
  // Check if there are downed allies (revive requires Field Medic ability)
  const party = currentCombat.partyIds.map(id => state.survivors.find(s => s.id === id)).filter(Boolean);
  const hasDowned = party.some(s => s.downed && s.id !== survivor.id);
  const hasFieldMedic = hasAbility(survivor, 'fieldmedic');
  if (hasDowned && hasFieldMedic) {
    actions.push({ 
      id: 'btnActionRevive', 
      label: 'Revive', 
      class: '', 
      style: 'background:var(--success)', 
      tooltip: 'Revive a downed ally (25-50% HP). Requires Field Medic ability.',
      onclick: 'playerRevive()'
    });
  }
  
  // 0.9.0 - Dynamic retreat tooltip with chance breakdown
  const s = getActiveSurvivor();
  let retreatTooltip = 'Attempt to flee from combat.';
  if (s && currentCombat.context !== 'base') {
    const { total, breakdown, clamped } = calculateRetreatChance(s);
    const percentChance = Math.round(total * 100);
    
    // Build detailed tooltip matching combat stats style
    let tooltipLines = [`Retreat Chance (${percentChance}%)`];
    breakdown.forEach(item => {
      const sign = item.value >= 0 ? '+' : '';
      const percent = Math.round(item.value * 100);
      tooltipLines.push(`• ${item.label} (${sign}${percent}%)`);
    });
    if (clamped) {
      tooltipLines.push(`(Clamped to 10-95%)`);
    }
    retreatTooltip = tooltipLines.join('\n');
  }
  
  actions.push({ 
    id: 'btnActionRetreat', 
    label: 'Retreat', 
    class: 'danger', 
    tooltip: retreatTooltip,
    onclick: 'playerRetreat()'
  });
  
  actions.push({ 
    id: 'btnActionAuto', 
    label: 'Auto-Resolve', 
    class: '', 
    style: 'margin-left:auto;', 
    tooltip: 'Let the AI handle combat automatically.',
    onclick: 'autoResolveCombat()'
  });
  
  // Render buttons
  actionsDiv.innerHTML = actions.map(a => {
    const disabledAttr = a.disabled ? ' disabled' : '';
    const disabledClass = a.disabled ? ' disabled-btn' : '';
    return `<button id="${a.id}" class="${a.class}${disabledClass}" style="${a.style || ''}" title="${a.tooltip}" onclick="${a.onclick}"${disabledAttr}>${a.label}</button>`;
  }).join('');
}

function rollHitChance(survivor) {
  let chance = BALANCE.BASE_HIT_CHANCE;
  
  // Add level accuracy bonus (+1% per level above 1)
  const levelAccuracyBonus = (survivor.level - 1) * (BALANCE.LEVEL_ACCURACY_BONUS || 0.01);
  chance += levelAccuracyBonus;
  
  if (currentCombat.aimed[survivor.id]) chance += BALANCE.COMBAT_ACTIONS.Aim.accuracyBonus;
  
  // 0.9.0 - Add weapon accuracy bonus
  const weapon = survivor.equipment && survivor.equipment.weapon;
  if (weapon) {
    const weaponBonuses = getWeaponPassiveBonuses(weapon);
    chance += weaponBonuses.accuracy;
  }

  // Add bonuses from abilities and class (Soldier, Marksman)
  const { hitBonus } = applyAbilityHitModifiers(survivor);
  chance += hitBonus;
  
  chance = clamp(chance, 0.05, 0.95);
  return Math.random() < chance;
}

function computeSurvivorDamage(s) {
  // 0.9.0 - Removed skill system, damage comes from weapon + level/class bonuses
  let damage = 0;
  
  // Get weapon damage
  const weapon = s.equipment.weapon;
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
  
  // Apply percentage-based bonuses from level, class, and abilities
  let damageMultiplier = 1.0;
  
  // Level bonus: 0% at level 1, +2% per level after that
  damageMultiplier += (s.level - 1) * BALANCE.LEVEL_ATTACK_BONUS;
  
  // Apply class/ability bonuses
  if (s.classBonuses && s.classBonuses.combat) {
    damageMultiplier += (s.classBonuses.combat - 1);
  }
  if (hasAbility(s, 'veteran')) {
    damageMultiplier += 0.20;
  }
  
  damage *= damageMultiplier;
  
  // Add consumable damage bonuses after multiplication
  if (s._combatDrugBonus && s._combatDrugBonus > 0) {
    damage += s._combatDrugBonus;
  }
  if (s._adrenalineBonus && s._adrenalineBonus > 0) {
    damage += s._adrenalineBonus;
  }
  
  return Math.max(1, Math.round(damage)); // Minimum 1 damage
}

function getActiveSurvivor() {
  const party = currentCombat.partyIds.map(id => state.survivors.find(s => s.id === id)).filter(Boolean);
  return party[currentCombat.activePartyIdx];
}

function advanceToNextSurvivor() {
  const party = currentCombat.partyIds.map(id => state.survivors.find(s => s.id === id)).filter(Boolean);
  
  // 0.9.0 - Find next survivor who hasn't retreated and is alive
  let attempts = 0;
  do {
    currentCombat.activePartyIdx++;
    attempts++;
    if (currentCombat.activePartyIdx >= party.length) {
      // All survivors have had their turn — turrets fire, then enemy turn
      currentCombat.activePartyIdx = 0;
      
      // Check if any survivors are still active (not retreated, not dead)
      const activeSurvivors = party.filter(p => p.hp > 0 && !p._retreated);
      if (activeSurvivors.length === 0) {
        // All survivors dead or retreated
        return endCombat(false);
      }
      
      // 0.9.0 - Decrement cooldowns for ALL survivors at the start of a new round
      party.forEach(s => {
        if (s && s._burstCooldown && s._burstCooldown > 0) {
          s._burstCooldown--;
        }
      });
      
      renderCombatUI(); // Update UI before turret phase
      
      // Log turn transition BEFORE enemy phase starts
      logCombat('— Enemy Turn —');
      
      turretPhase();
      enemyTurn();
      return;
    }
    // Loop until we find a survivor who is alive and hasn't retreated, or we've checked everyone
  } while (attempts < party.length && (party[currentCombat.activePartyIdx].hp <= 0 || party[currentCombat.activePartyIdx]._retreated));
  
  // If we've looped through everyone and found no active survivors
  if (attempts >= party.length) {
    const activeSurvivors = party.filter(p => p.hp > 0 && !p._retreated);
    if (activeSurvivors.length === 0) {
      return endCombat(false);
    }
  }
  
  renderCombatUI();
}

function turretPhase() {
  if (!currentCombat || !currentCombat.turrets || currentCombat.turrets <= 0) return;
  const aliens = currentCombat.aliens.filter(a => a.hp > 0);
  if (aliens.length === 0) return;
  logCombat('— Turret Support —');
  for (let i = 0; i < currentCombat.turrets; i++) {
    const aliveAliens = currentCombat.aliens.filter(a => a.hp > 0);
    if (aliveAliens.length === 0) break;
    const tState = currentCombat.turretsState[i] || { aimed: false };
    // Decide action: aim if not aimed (35%), else burst (35%) or shoot
    if (!tState.aimed && Math.random() < 0.35) {
      tState.aimed = true;
      logCombat(`Auto-Turret #${i + 1} acquiring target...`);
      continue;
    }
    const doBurst = Math.random() < 0.35;
    turretAttack(i, doBurst ? 'burst' : 'shoot', tState);
    // reset aim after firing
    tState.aimed = false;
    currentCombat.turretsState[i] = tState;
  }
}

function turretAttack(idx, action, tState) {
  let target = currentCombat.aliens.find(a => a.id === currentCombat.selectedTargetId && a.hp > 0);
  if (!target) {
    target = currentCombat.aliens.find(a => a.hp > 0);
    if (target) {
      currentCombat.selectedTargetId = target.id;
    }
  }
  if (!target) return;
  const shots = action === 'burst' ? (BALANCE.COMBAT_ACTIONS.Burst.ammoMult || 2) : 1;
  for (let s = 0; s < shots; s++) {
    let hitChance = BALANCE.TURRET_HIT_CHANCE;
    if (tState && tState.aimed) hitChance += BALANCE.COMBAT_ACTIONS.Aim.accuracyBonus;
    hitChance = clamp(hitChance, 0.05, 0.98);
    const hit = Math.random() < hitChance;
    if (!hit) {
      logCombat(`Auto-Turret #${idx + 1} missed.`);
      renderCombatUI(); // Update UI after miss
      continue;
    }
    
    // Check alien special defenses
    if (target.special === 'dodge' && Math.random() < 0.25) {
      logCombat(`${target.name} evades auto-turret fire!`);
      renderCombatUI(); // Update UI after dodge
      continue;
    }
    if (target.special === 'phase' && Math.random() < 0.40) {
      logCombat(`${target.name} phases through turret fire!`);
      renderCombatUI(); // Update UI after phase
      continue;
    }
    
    let dmg = BALANCE.TURRET_BASE_DAMAGE;
    if (action === 'burst') {
      const r = BALANCE.COMBAT_ACTIONS.Burst.dmgBonus;
      dmg += rand(r[0], r[1]);
    }
    // Apply small variance and crit
    if (Math.random() < BALANCE.CRIT_CHANCE) {
      dmg = Math.floor(dmg * BALANCE.CRIT_MULT);
      logCombat(`Auto-Turret #${idx + 1} scores a CRITICAL hit!`);
    }
    let dealt = rand(Math.max(1, dmg - 1), dmg + 2);
    
    // 0.9.0 - Apply alien armor
    const alienArmor = target.armor || 0;
    dealt = Math.max(1, dealt - alienArmor);
    
    // Apply armored special
    if (target.special === 'armored') {
      dealt = Math.floor(dealt * 0.5);
      logCombat(`${target.name}'s armor deflects turret fire!`);
    }
    
    target.hp -= dealt;
    logCombat(`Auto-Turret #${idx + 1} hits ${target.name} for ${dealt}.`);
    renderCombatUI(); // Update UI after damage
    
    if (target.hp <= 0) {
      logCombat(`${target.name} neutralized by automated fire.`);
      state.alienKills = (state.alienKills || 0) + 1;
      
      // Auto-select next available target
      const nextTarget = currentCombat.aliens.find(a => a.hp > 0);
      if (nextTarget) {
        currentCombat.selectedTargetId = nextTarget.id;
      } else {
        currentCombat.selectedTargetId = null;
      }
      
      renderCombatUI(); // Update UI after kill
    }
  }
}

function playerShoot(action = 'shoot', burstShots = null) {
  if (!currentCombat) return;
  const s = getActiveSurvivor();
  if (!s || s.hp <= 0) return;
  
  // 0.9.0 - Check cooldowns for burst/power attack
  if (action === 'burst') {
    if (s._burstCooldown && s._burstCooldown > 0) {
      logCombat(`${s.name} cannot use that attack yet! (Cooldown: ${s._burstCooldown} turns)`, true);
      return;
    }
  }
  
  let target = currentCombat.aliens.find(a => a.id === currentCombat.selectedTargetId && a.hp > 0);
  
  // If no target is selected or the selected target is dead, fall back to the first alive alien.
  if (!target) {
    target = currentCombat.aliens.find(a => a.hp > 0);
    // Automatically select the new target
    if (target) {
      currentCombat.selectedTargetId = target.id;
    }
  }

  if (!target) {
    return endCombat(true);
  }

  // 0.9.0 - Get weapon type for ammo consumption
  const weapon = s.equipment && s.equipment.weapon;
  const weaponType = weapon && weapon.weaponType ? weapon.weaponType : 'rifle'; // Default to rifle
  const ammoMultiplier = WEAPON_TYPES[weaponType] ? WEAPON_TYPES[weaponType].ammoMult : 0.6;
  
  // ammo - melee weapons don't use ammo
  let shots = 1;
  if (action === 'burst') {
    // Allow caller to specify burst shot count (computed per-weapon) or fall back to default
    shots = burstShots != null ? burstShots : (BALANCE.COMBAT_ACTIONS.Burst.ammoMult || 2);
  }
  // Melee power attacks are a single, high-damage hit, not multiple shots.
  if (weaponType === 'melee') {
    shots = 1;
  }

  if (action === 'burst') {
    if (weaponType === 'melee') {
      logCombat(`${s.name} winds up for a powerful melee attack!`);
    } else {
      logCombat(`${s.name} opens fire with a burst attack!`);
    }
  }
  for (let i = 0; i < shots; i++) {
    if (target.hp <= 0) {
      if (action === 'burst' && weaponType !== 'melee') {
        logCombat(`Target eliminated, ending burst fire.`);
      }
      break;
    }
    if (action === 'burst' && weaponType !== 'melee') {
      logCombat(`Shot ${i + 1} of ${shots}...`);
    }
    // Melee weapons skip ammo consumption
    if (ammoMultiplier > 0) {
      if (state.resources.ammo <= 0) {
        logCombat(`${s.name} is out of ammo!`, true);
        break;
      }
      // Apply weapon-specific ammo consumption rate
      const consumeChance = BALANCE.AMMO_CONSUME_CHANCE * ammoMultiplier;
      if (Math.random() < consumeChance) state.resources.ammo = Math.max(0, state.resources.ammo - 1);
    }
    
    const hit = rollHitChance(s) && !(action === 'aim' && i>0);
    if (hit) {
      // Check alien special defenses before applying damage
      if (target.special === 'dodge' && Math.random() < 0.25) {
        logCombat(`${target.name} dodges the attack!`, true);
        renderCombatUI(); // Update UI after dodge
        continue;
      }
      
      // 0.8.0 - Enhanced phase check with modifiers
      let phaseChance = 0;
      if (target.special === 'phase') {
        phaseChance = 0.40;
        if (hasModifier(target, 'ethereal')) phaseChance += 0.10;
        if (hasModifier(target, 'void')) phaseChance = 0.60;
      }
      
      if (phaseChance > 0 && Math.random() < phaseChance) {
        logCombat(`${target.name} phases out of reality!`, true);
        
        // 0.8.0 - Mark as just phased for Wraith modifier
        target._justPhased = true;
        
        // 0.8.0 - Blink Strike: counter-attack after successful phase
        if (hasModifier(target, 'blink') && s.hp > 0) {
          const blinkDmg = rand(Math.max(1, target.attack - 1), target.attack + 1);
          s.hp -= blinkDmg;
          logCombat(`${target.name} blinks behind ${s.name} for ${blinkDmg} damage!`, true);
        }
        
        // 0.8.0 - Void Touched: phase drains HP
        if (hasModifier(target, 'void')) {
          target.hp -= 2;
          logCombat(`${target.name} suffers void corruption (-2 HP).`);
        }
        
        renderCombatUI(); // Update UI after phase
        continue;
      }
      
      let dmg = computeSurvivorDamage(s);
      if (action === 'burst' && weaponType === 'melee') {
        dmg += BALANCE.COMBAT_ACTIONS.Burst.dmgBonus;
      }
      // 0.8.0 - Medic Adrenaline Shot bonus damage
      if (s._adrenalineBonus) {
        dmg += s._adrenalineBonus;
      }
      
      // Get bonuses from abilities and class
      const { critBonus } = applyAbilityHitModifiers(s);

      // 0.9.0 - Add weapon and armor crit bonuses
      const weaponBonuses = weapon ? getWeaponPassiveBonuses(weapon) : { accuracy: 0, crit: 0 };
      const armor = s.equipment && s.equipment.armor;
      const armorEffects = armor ? applyArmorEffectsInteractive(armor, s) : {};
      const totalCritChance = BALANCE.CRIT_CHANCE + critBonus + weaponBonuses.crit + (armorEffects.critBonus || 0);
      
      // 0.9.0 - Unstoppable: Immune to crits (Ravager)
      const canBeCrit = !hasModifier(target, 'unstoppable');
      
      // crit
      if (canBeCrit && Math.random() < totalCritChance) {
        dmg = Math.floor(dmg * BALANCE.CRIT_MULT);
        logCombat(`${s.name} scores a CRITICAL hit on ${target.name}!`);
      }
      
      let dealt = rand(Math.max(1, dmg - 1), dmg + 2);
      
      // 0.9.0 - Apply alien armor (reduced by attacker's armor pierce)
      let alienArmor = target.armor || 0;
      if (s._currentArmorPierce) {
        const piercePercent = s._currentArmorPierce / 100; // Convert to decimal
        alienArmor = Math.floor(alienArmor * (1 - piercePercent));
        logCombat(`🎯 Armor piercing! (${alienArmor} effective armor after ${s._currentArmorPierce}% reduction)`, true);
        s._currentArmorPierce = null; // Clear after this attack
      }
      dealt = Math.max(1, dealt - alienArmor); // Armor reduces damage, min 1
      
      // Apply resistance from armored special and other modifiers
      const stats = calculateAlienStats(target, currentCombat.aliens);
      if (stats.resist.value > 0) {
        dealt = Math.floor(dealt * (1 - stats.resist.value));
        logCombat(`${target.name}'s carapace absorbs damage!`);
      }
      
      const overkill = Math.max(0, dealt - target.hp);
      target.hp -= dealt;
      logCombat(`${s.name} hits ${target.name} for ${dealt} damage.` + (overkill > 0 ? ` (${overkill} overkill)` : ``), true);
      
      // Apply weapon effects (Moved before death check for splash on kill)
      if (weapon && weapon.effects && weapon.effects.length > 0) {
        applyWeaponEffectsInteractive(weapon, target, s, dealt);
      }
      
      renderCombatUI(); // Update UI after damage
      
      if (target.hp <= 0) {
        logCombat(`${target.name} eliminated!`, true);
        state.alienKills = (state.alienKills || 0) + 1;
        
  // 0.9.0 - Morale gain for killing alien
        s.morale = Math.min(100, (s.morale || 0) + BALANCE.MORALE_GAIN_ALIEN_KILL);
        renderCombatUI();
        
        // 0.9.0 - Relentless: Stalkers with this modifier attack twice if an ally dies
        const relentlessStalkers = currentCombat.aliens.filter(al => 
          al.hp > 0 && 
          al.type === 'stalker' && 
          hasModifier(al, 'relentless') && 
          !al._relentlessUsed
        );
        for (const stalker of relentlessStalkers) {
          stalker._relentlessBonus = true; // Flag to grant extra attack
          stalker._relentlessUsed = true; // Once per combat
        }
        
        // 0.8.0 - Spawner: summon drone on death
        if (hasModifier(target, 'spawner')) {
          const droneType = ALIEN_TYPES.find(at => at.id === 'drone');
          if (droneType) {
            const spawnedHp = rand(droneType.hpRange[0], droneType.hpRange[1]);
            const spawnedDrone = {
              id: `spawned_${Date.now()}`,
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
            if (typeof applyModifiersToAlienStats === 'function') {
              applyModifiersToAlienStats(spawnedDrone);
            }
            
            // 0.9.0 - Apply escalation bonuses to spawned aliens
            if (typeof applyEscalationToAlien === 'function') {
              applyEscalationToAlien(spawnedDrone);
            }
            
            currentCombat.aliens.push(spawnedDrone);
            logCombat(`${target.name} spawns a drone as it dies!`, true);
            renderCombatUI(); // Update UI after spawn
          }
        }
        
        // Loot on kill
        const loot = pickLoot();
        const lootMessage = loot.onPickup(state);
        appendLog(`Loot dropped: ${lootMessage}`);
        
        // 0.8.0 - Scientist Xenobiologist: tech on alien kill
        if (hasAbility(s, 'xenobiologist')) {
          state.resources.tech += 1;
          appendLog(`${s.name} extracts alien tech.`);
        }
        break; // Stop burst fire on this target
      }
    } else {
      logCombat(`${s.name} missed.`, true);
      renderCombatUI(); // Update UI after miss
    }
  }

  // After the attack sequence, check if the target is dead and if so, select a new one.
  const stillExists = currentCombat.aliens.find(a => a.id === currentCombat.selectedTargetId);
  if (!stillExists || stillExists.hp <= 0) {
    const nextTarget = currentCombat.aliens.find(a => a.hp > 0);
    if (nextTarget) {
      selectTarget(nextTarget.id);
    }
  }

  // 0.9.0 - Clear aimed flag after shooting
  if (currentCombat && currentCombat.aimed) currentCombat.aimed[s.id] = false;
  s._aimed = false;
  
  // 0.9.0 - Apply cooldown after burst/power attack (2 turns)
  if (action === 'burst') {
  // 0.9.0 - Set cooldown for burst/power attack
  s._burstCooldown = BALANCE.COMBAT_ACTIONS.Burst.cooldown || 2;
  }
  
  advanceToNextSurvivor();
}

// Helper: Burst action invoked by UI (computes shots from weapon effects)
function playerBurst() {
  if (!currentCombat) return;
  const s = getActiveSurvivor();
  if (!s || s.hp <= 0) return;

  // Compute additional burst shots from weapon effects
  const weapon = s.equipment && s.equipment.weapon;
  const defaultShots = BALANCE.COMBAT_ACTIONS.Burst.ammoMult || 2;
  let extra = 0;
  if (weapon && weapon.effects) {
    const burstEff = weapon.effects.find(e => e.startsWith('burst:'));
    if (burstEff) {
      const parts = burstEff.split(':');
      const val = parseInt(parts[1], 10);
      if (!isNaN(val)) extra = val;
    }
  }

  const totalShots = Math.max(1, defaultShots + extra);
  // Call main shoot logic with action 'burst' and computed shot count
  playerShoot('burst', totalShots);
}

function playerAim() {
  if (!currentCombat) return;
  const s = getActiveSurvivor();
  if (!s) return;
  currentCombat.aimed[s.id] = true;
  logCombat(`${s.name} takes careful aim...`, true);
  renderCombatUI(); // Update UI after aim
  advanceToNextSurvivor();
}

function playerGuard() {
  if (!currentCombat) return;
  const s = getActiveSurvivor();
  if (!s) return;
  currentCombat.guarding[s.id] = true;
  logCombat(`${s.name} braces for impact.`, true);
  renderCombatUI(); // Update UI after guard
  advanceToNextSurvivor();
}

// 0.9.0 - Get available consumables from inventory
function getAvailableConsumables() {
  // Get all consumable items (both type 'consumable' and legacy 'medkit')
  const consumables = state.inventory.filter(i => {
    return i.type === 'consumable' || i.type === 'medkit';
  });
  
  // Group by subtype/type and count
  const grouped = {};
  consumables.forEach(item => {
    const key = item.subtype || item.type; // subtype for new items, type for legacy medkit
    if (!grouped[key]) {
      grouped[key] = { item, count: 0 };
    }
    grouped[key].count++;
  });
  
  return Object.values(grouped);
}

// 0.9.0 - Show consumable selector overlay
function showConsumableSelector() {
  const s = getActiveSurvivor();
  if (!s) return;
  
  const consumables = getAvailableConsumables();
  
  if (consumables.length === 0) {
    logCombat('No consumables available.', true);
    return;
  }
  
  // Create overlay
  const overlay = document.createElement('div');
  overlay.id = 'consumable-selector-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.8);
    z-index: 10001;
    display: flex;
    align-items: center;
    justify-content: center;
  `;
  
  const panel = document.createElement('div');
  panel.style.cssText = `
    background: var(--bg);
    border: 2px solid var(--accent);
    border-radius: 8px;
    padding: 24px;
    max-width: 500px;
    max-height: 600px;
    overflow-y: auto;
  `;
  
  let html = '<h3 style="margin-top:0;color:var(--accent)">Select Consumable</h3>';
  html += '<div style="display:flex;flex-direction:column;gap:8px;">';
  
  consumables.forEach(({ item, count }) => {
    const key = item.subtype || item.type;
    const effect = BALANCE.CONSUMABLE_EFFECTS[key];
    const desc = effect ? effect.desc : 'Unknown effect';
    const rarityColor = getRarityColor(item.rarity || 'common');
    
    html += `
      <button onclick="useConsumableFromSelector('${key}')" style="
        text-align: left;
        padding: 12px;
        background: var(--card-bg);
        border: 1px solid ${rarityColor};
        border-radius: 4px;
        color: var(--text);
        cursor: pointer;
        transition: all 0.2s;
      " onmouseover="this.style.background='var(--card-hover)'" onmouseout="this.style.background='var(--card-bg)'">
        <div style="font-weight:bold;color:${rarityColor}">${item.name} x${count}</div>
        <div style="font-size:0.9em;color:var(--muted);margin-top:4px;">${desc}</div>
      </button>
    `;
  });
  
  html += '</div>';
  html += '<button onclick="closeConsumableSelector()" style="margin-top:16px;width:100%;padding:8px;background:var(--danger);border:none;border-radius:4px;color:white;cursor:pointer;">Cancel</button>';
  
  panel.innerHTML = html;
  overlay.appendChild(panel);
  document.body.appendChild(overlay);
}

function closeConsumableSelector() {
  const overlay = document.getElementById('consumable-selector-overlay');
  if (overlay) overlay.remove();
}

function useConsumableFromSelector(consumableKey) {
  closeConsumableSelector();
  playerUseConsumable(consumableKey);
}

// 0.9.0 - Main consumable usage function
function playerUseConsumable(consumableKey) {
  const s = getActiveSurvivor();
  if (!s) return;
  
  // Find consumable in inventory
  const idx = state.inventory.findIndex(i => {
    const key = i.subtype || i.type;
    return key === consumableKey;
  });
  
  if (idx === -1) {
    logCombat('Consumable not found in inventory.', true);
    return;
  }
  
  const item = state.inventory[idx];
  const effect = BALANCE.CONSUMABLE_EFFECTS[consumableKey];
  
  if (!effect) {
    logCombat('Unknown consumable effect.', true);
    return;
  }
  
  // Apply consumable effect based on type
  let effectApplied = false;
  
  // HEALING ITEMS
  if (effect.heal) {
    let heal = Array.isArray(effect.heal) ? rand(effect.heal[0], effect.heal[1]) : effect.heal;
    
    // Apply Medic class bonus + Triage ability (additive)
    let healBonusAdd = 0;
    if (s.classBonuses && s.classBonuses.healing) {
      healBonusAdd += (s.classBonuses.healing - 1);
    }
    if (hasAbility(s, 'triage')) {
      healBonusAdd += 0.25;
    }
    if (healBonusAdd > 0) {
      heal = Math.floor(heal * (1 + healBonusAdd));
    }
    
    const effectiveMaxHp = getEffectiveMaxHpCombat(s);
    s.hp = Math.min(effectiveMaxHp, s.hp + heal);
    logCombat(`${s.name} uses ${item.name} and heals ${heal} HP.`, true);
    
    // Medic Adrenaline Shot ability
    if (hasAbility(s, 'adrenaline')) {
      s._adrenalineBonus = (s._adrenalineBonus || 0) + 2;
      logCombat(`${s.name} feels a surge of adrenaline!`);
    }
    
    effectApplied = true;
  }
  
  // STIMPACK - Evasion/Retreat buff
  if (effect.evasionBonus && effect.retreatBonus && effect.duration) {
    s._stimpackEvasion = effect.evasionBonus;
    s._stimpackRetreat = effect.retreatBonus;
    s._stimpackTurns = effect.duration;
    logCombat(`${s.name} uses ${item.name}! +${Math.round(effect.evasionBonus*100)}% dodge, +${Math.round(effect.retreatBonus*100)}% retreat for ${effect.duration} turns.`, true);
    effectApplied = true;
  }
  
  // REPAIR KIT - Restore equipment durability
  if (effect.durabilityRestore) {
    const weapon = s.equipment && s.equipment.weapon;
    const armor = s.equipment && s.equipment.armor;
    
    if (weapon && weapon.durability < weapon.maxDurability) {
      weapon.durability = Math.min(weapon.maxDurability, weapon.durability + effect.durabilityRestore);
      logCombat(`${s.name} repairs ${weapon.name} (+${effect.durabilityRestore} durability).`, true);
      effectApplied = true;
    } else if (armor && armor.durability < armor.maxDurability) {
      armor.durability = Math.min(armor.maxDurability, armor.durability + effect.durabilityRestore);
      logCombat(`${s.name} repairs ${armor.name} (+${effect.durabilityRestore} durability).`, true);
      effectApplied = true;
    } else {
      logCombat('No damaged equipment to repair.', true);
      return; // Don't consume item
    }
  }
  
  // COMBAT DRUG - Big damage boost with max HP cost
  if (effect.maxHpCost !== undefined && effect.damageBonus) {
    s._combatDrugBonus = effect.damageBonus;
    s._combatDrugTurns = effect.duration;
    const maxHpLoss = Math.floor(s.maxHp * effect.maxHpCost);
    s.maxHp = Math.max(1, s.maxHp - maxHpLoss); // Reduce max HP
    s.hp = Math.min(s.hp, s.maxHp); // Clamp current HP to new max
    logCombat(`${s.name} uses ${item.name}! +${effect.damageBonus} damage for ${effect.duration} turns (-${maxHpLoss} max HP).`, true);
    effectApplied = true;
  }
  
  // STUN GRENADE - Stun random enemy
  if (effect.stunChance) {
    const aliens = currentCombat.aliens.filter(a => a.hp > 0 && !a.downed);
    if (aliens.length === 0) {
      logCombat('No enemies to target.', true);
      return;
    }
    
    const target = aliens[Math.floor(Math.random() * aliens.length)];
    if (Math.random() < effect.stunChance) {
      target._stunned = true;
      logCombat(`${s.name} throws ${item.name} at ${target.name}! Stunned!`, true);
    } else {
      logCombat(`${s.name} throws ${item.name}, but ${target.name} resists!`, true);
    }
    effectApplied = true;
  }
  
  // NANITE INJECTOR - Permanent HP boost
  if (effect.permanentHP) {
    s.maxHp += effect.permanentHP;
    s.hp += effect.permanentHP;
    logCombat(`${s.name} uses ${item.name}! Max HP permanently increased by ${effect.permanentHP}!`, true);
    effectApplied = true;
  }
  
  // REVIVAL KIT - Revive downed ally
  if (effect.reviveHP) {
    const party = currentCombat.partyIds.map(id => state.survivors.find(sur => sur.id === id)).filter(Boolean);
    const downedAllies = party.filter(p => p.downed && p.id !== s.id);
    
    if (downedAllies.length === 0) {
      logCombat('No downed allies to revive.', true);
      return;
    }
    
    const target = downedAllies[0];
    let reviveHP = Math.floor(target.maxHp * (effect.reviveHP[0] + Math.random() * (effect.reviveHP[1] - effect.reviveHP[0])));
    
    // Apply Medic bonuses to revival
    let healBonusAdd = 0;
    if (s.classBonuses && s.classBonuses.healing) {
      healBonusAdd += (s.classBonuses.healing - 1);
    }
    if (hasAbility(s, 'triage')) {
      healBonusAdd += 0.25;
    }
    if (healBonusAdd > 0) {
      reviveHP = Math.floor(reviveHP * (1 + healBonusAdd));
    }
    
    target.hp = reviveHP;
    target.downed = false;
    logCombat(`${s.name} uses ${item.name} on ${target.name}! Revived at ${reviveHP} HP.`, true);
    effectApplied = true;
  }
  
  // SYSTEM OVERRIDE - Instant kill weak enemy
  if (effect.instakill) {
    const aliens = currentCombat.aliens.filter(a => a.hp > 0 && a.hp <= effect.hpThreshold && !a.downed);
    if (aliens.length === 0) {
      logCombat(`No enemies with ≤${effect.hpThreshold} HP to target.`, true);
      return;
    }
    
    const target = aliens[0];
    target.hp = 0;
    target.downed = true;
    logCombat(`${s.name} uses ${item.name} on ${target.name}! System overload - eliminated!`, true);
    effectApplied = true;
  }
  
  // STEALTH FIELD - Dodge next attack
  if (effect.dodgeNext) {
    s._stealthField = true;
    logCombat(`${s.name} activates ${item.name}! Next attack will be dodged.`, true);
    effectApplied = true;
  }
  
  // Consume the item if effect was applied
  if (effectApplied) {
    state.inventory.splice(idx, 1);
    renderCombatUI();
    advanceToNextSurvivor();
  }
}

// LEGACY: Keep for compatibility but redirect to new system
function playerUseMedkit() {
  playerUseConsumable('medkit');
}

// 0.8.0 - Field Medic Revival
function playerRevive() {
  if (!currentCombat) return;
  const s = getActiveSurvivor();
  if (!s) return;
  
  // Check for Field Medic ability
  if (!hasAbility(s, 'fieldmedic')) {
    logCombat('Only Field Medics can revive downed allies.', true);
    return;
  }
  
  // Find downed allies
  const party = currentCombat.partyIds.map(id => state.survivors.find(sur => sur.id === id)).filter(Boolean);
  const downedAllies = party.filter(p => p.downed && p.id !== s.id);
  
  if (downedAllies.length === 0) {
    logCombat('No downed allies to revive.', true);
    return;
  }
  
  // Revive the first downed ally (in real implementation, could add targeting UI)
  const target = downedAllies[0];
  let reviveHP = rand(Math.floor(target.maxHp * 0.25), Math.floor(target.maxHp * 0.50));
  
  // 0.8.11 - Apply Medic class bonus + Triage to revival healing (additive)
  let healBonusAdd = 0;
  if (s.classBonuses && s.classBonuses.healing) {
    healBonusAdd += (s.classBonuses.healing - 1);
  }
  if (hasAbility(s, 'triage')) {
    healBonusAdd += 0.25;
  }
  if (healBonusAdd > 0) {
    reviveHP = Math.floor(reviveHP * (1 + healBonusAdd));
  }
  
  target.hp = reviveHP;
  target.downed = false;
  
  logCombat(`${s.name} revives ${target.name}! Restored to ${reviveHP} HP.`, true);
  renderCombatUI(); // Update UI after revival
  advanceToNextSurvivor();
}

// 0.9.0 - Calculate retreat chance with detailed breakdown for tooltip
function calculateRetreatChance(survivor) {
  if (!currentCombat || !survivor) return { total: 0, breakdown: [] };
  
  const breakdown = [];
  let total = BALANCE.RETREAT_BASE_CHANCE;
  breakdown.push({ label: 'Base', value: BALANCE.RETREAT_BASE_CHANCE, color: 'var(--text)' });
  
  // Level bonus
  const levelBonus = survivor.level * BALANCE.RETREAT_LEVEL_BONUS;
  if (levelBonus > 0) {
    total += levelBonus;
    breakdown.push({ label: `Level ${survivor.level}`, value: levelBonus, color: 'var(--accent)' });
  }
  
  // Class bonus (Scout)
  if (survivor.classBonuses && survivor.classBonuses.retreat) {
    const classBonus = survivor.classBonuses.retreat - 1;
    total += classBonus;
    breakdown.push({ label: 'Scout', value: classBonus, color: '#4a9eff' });
  }
  
  // Stimpack bonus
  if (survivor._stimpackRetreat && survivor._stimpackRetreat > 0) {
    total += survivor._stimpackRetreat;
    breakdown.push({ label: 'Stimpack', value: survivor._stimpackRetreat, color: '#00ff88' });
  }
  
  // Armor effects (retreat bonus)
  if (survivor.equipment && survivor.equipment.armor) {
    const armor = survivor.equipment.armor;
    if (armor.effects) {
      for (const effect of armor.effects) {
        if (effect.type === 'retreat') {
          const retreatValue = effect.value / 100; // Convert from percentage
          total += retreatValue;
          const armorColor = RARITY_COLORS[armor.rarity] || '#a0a0a0';
          breakdown.push({ label: armor.name, value: retreatValue, color: armorColor });
        }
      }
    }
  }
  
  // Alien type penalty/bonus
  const aliens = currentCombat.aliens.filter(a => a.hp > 0);
  if (aliens.length > 0) {
    const avgPenalty = aliens.reduce((sum, a) => sum + (BALANCE.RETREAT_ALIEN_PENALTY[a.type] || 0), 0) / aliens.length;
    if (avgPenalty !== 0) {
      total += avgPenalty;
      const alienLabel = aliens.length === 1 ? aliens[0].name : `${aliens.length} Aliens`;
      breakdown.push({ label: alienLabel, value: avgPenalty, color: avgPenalty < 0 ? 'var(--danger)' : 'var(--success)' });
    }
  }
  
  // Clamp final chance
  const clamped = clamp(total, 0.1, 0.95);
  
  return { total: clamped, breakdown, clamped: clamped !== total };
}

function playerRetreat() {
  if (!currentCombat) return;
  const isRaid = currentCombat.context === 'base';
  
  // Cannot retreat from raids (0.7.2)
  if (isRaid) {
    logCombat('Cannot retreat from base defense!', true);
    return;
  }
  
  const s = getActiveSurvivor();
  if (!s) return;
  
  // 0.9.0 - Use centralized retreat calculation
  const { total: retreatChance } = calculateRetreatChance(s);
  
  const success = Math.random() < retreatChance;
  
  if (success) {
    logCombat(`${s.name} successfully retreats!`, true);
    
    // 0.9.0 - Mark survivor as retreated (per-survivor retreat)
    s._retreated = true;
    s._retreating = false; // Clear temporary flag
    
  // 0.9.0 - Morale loss for retreating
    s.morale = Math.max(0, (s.morale || 0) - BALANCE.MORALE_LOSS_RETREAT);
    renderCombatUI();
    
    // Check if all survivors have retreated or died
    const party = currentCombat.partyIds.map(id => state.survivors.find(surv => surv.id === id)).filter(Boolean);
    const activeSurvivors = party.filter(p => p.hp > 0 && !p._retreated);
    
    if (activeSurvivors.length === 0) {
      // All survivors retreated or died - end combat as retreat
      logCombat('All survivors have retreated from combat.', true);
      
      // 0.9.0 - Retreat threat gain (replaces old 0.5 flat gain)
      const retreatThreatGain = rand(BALANCE.THREAT_GAIN_ON_RETREAT[0], BALANCE.THREAT_GAIN_ON_RETREAT[1]);
      if (!state.threatLocked || state.threat < 100) {
        state.threat = clamp(state.threat + retreatThreatGain, 0, 100);
      }
      
      // 0.8.x - Retreat increases raid pressure slightly
      state.raidPressure = Math.min((state.raidPressure || 0) + 0.003, 0.03);
      
      // 0.9.0 - Mark tile as not cleared so it can be revisited
      if (currentCombat.idx !== null && state.tiles[currentCombat.idx]) {
        state.tiles[currentCombat.idx].cleared = false;
      }
      
      // Clear retreated flags before closing
      party.forEach(p => {
        if (p._retreated) delete p._retreated;
        if (p._retreating) delete p._retreating;
      });
      
      updateUI();
      closeCombatOverlay();
    } else {
      // Some survivors still fighting - advance to next survivor
      advanceToNextSurvivor();
    }
  } else {
    logCombat(`${s.name} failed to retreat!`, true);
    s._retreating = false; // Clear temporary flag
    // Advance to next survivor's turn (or enemy turn if last survivor)
    advanceToNextSurvivor();
  }
}

function enemyTurn() {
  if (!currentCombat) return;
  const party = currentCombat.partyIds.map(id => state.survivors.find(s => s.id === id)).filter(Boolean);
  const aliveAliens = currentCombat.aliens.filter(a => a.hp > 0);
  // 0.9.0 - Filter out retreated survivors when checking alive party
  const aliveParty = party.filter(p => p.hp > 0 && !p._retreated);
  if (aliveAliens.length === 0) return endCombat(true);
  if (aliveParty.length === 0) return endCombat(false);

  // 0.9.0 - Clear temporary status effects and update consumable durations at start of enemy turn
  aliveParty.forEach(p => {
    if (p._retreating) {
      p._retreating = false;
    }
    
    // Stealth field persists until used
    
    // Decrement stimpack duration
    if (p._stimpackTurns && p._stimpackTurns > 0) {
      p._stimpackTurns--;
      if (p._stimpackTurns <= 0) {
        p._stimpackEvasion = 0;
        p._stimpackRetreat = 0;
        logCombat(`${p.name}'s Stimpack effect wears off.`);
      }
    }
    
    // Decrement combat drug duration
    if (p._combatDrugTurns && p._combatDrugTurns > 0) {
      p._combatDrugTurns--;
      if (p._combatDrugTurns <= 0) {
        p._combatDrugBonus = 0;
        logCombat(`${p.name}'s Combat Drug effect wears off.`);
      }
    }
  });
  
  renderCombatUI(); // Update UI at start of enemy turn
  
  // 0.8.0 - Medic Miracle Worker: passive heal 1 HP/turn to all allies
  const miracleWorkers = aliveParty.filter(p => hasAbility(p, 'miracle'));
  if (miracleWorkers.length > 0) {
    aliveParty.forEach(p => {
      if (p.hp > 0 && p.hp < p.maxHp) {
        p.hp = Math.min(p.maxHp, p.hp + miracleWorkers.length);
      }
    });
    logCombat(`Miracle Worker provides healing to the team.`);
    renderCombatUI(); // Update UI after healing
  }
  
  // Apply poison damage and decrement duration (queue-based)
  for (const p of aliveParty) {
    if (p._poisonQueue && p._poisonQueue.length > 0) {
      const poisonDmg = p._poisonQueue.length * 2; // 2 damage per stack
      p.hp = Math.max(0, p.hp - poisonDmg);
      logCombat(`${p.name} takes ${poisonDmg} poison damage (${p._poisonQueue.length} stacks).`);
      
      // Decrement each stack's duration and remove expired ones
      p._poisonQueue = p._poisonQueue.map(turns => turns - 1).filter(turns => turns > 0);
      p._poisonStacks = p._poisonQueue.length;
      
      if (p._poisonQueue.length === 0) {
        logCombat(`${p.name}'s poison wears off.`);
      }
      
      renderCombatUI(); // Update UI after poison damage
      if (p.hp <= 0) {
        logCombat(`${p.name} succumbs to poison.`);
      }
    }
  }
  
  // Apply burn damage to survivors and decrement duration (queue-based)
  for (const p of aliveParty) {
    if (p._burnQueue && p._burnQueue.length > 0) {
      const burnDmg = p._burnQueue.length * 2; // 2 damage per stack
      p.hp = Math.max(0, p.hp - burnDmg);
      logCombat(`🔥 ${p.name} takes ${burnDmg} burn damage (${p._burnQueue.length} stacks).`);
      
      // Decrement each stack's duration and remove expired ones
      p._burnQueue = p._burnQueue.map(turns => turns - 1).filter(turns => turns > 0);
      p._burnStacks = p._burnQueue.length;
      
      if (p._burnQueue.length === 0) {
        logCombat(`${p.name}'s burn extinguishes.`);
      }
      
      renderCombatUI(); // Update UI after burn damage
      if (p.hp <= 0) {
        logCombat(`${p.name} is consumed by flames.`);
      }
    }
  }
  
  // Apply burn damage to aliens and decrement duration (queue-based)
  for (const a of aliveAliens) {
    if (a._burnQueue && a._burnQueue.length > 0) {
      const burnDmg = a._burnQueue.length * 2; // 2 damage per stack
      a.hp = Math.max(0, a.hp - burnDmg);
      logCombat(`🔥 ${a.name} takes ${burnDmg} burn damage (${a._burnQueue.length} stacks).`);
      
      // Decrement each stack's duration and remove expired ones
      a._burnQueue = a._burnQueue.map(turns => turns - 1).filter(turns => turns > 0);
      a._burnStacks = a._burnQueue.length;
      
      if (a._burnQueue.length === 0) {
        logCombat(`${a.name}'s burn extinguishes.`);
      }
      
      renderCombatUI(); // Update UI after burn damage
      if (a.hp <= 0) {
        a.downed = true;
        logCombat(`${a.name} is consumed by flames.`);
      }
    }
  }
  
  // Regeneration phase (brood special)
  for (const a of aliveAliens) {
    if (a.special === 'regeneration') {
      const healAmount = rand(2, 4);
      a.hp = Math.min(a.maxHp, a.hp + healAmount);
      logCombat(`${a.name} regenerates ${healAmount} HP!`);
      renderCombatUI(); // Update UI after regeneration
    }
  }
  
  // 0.8.0 - Hivemind: Queen resurrects fallen drones
  const queens = aliveAliens.filter(a => a.type === 'queen' && hasModifier(a, 'hivemind'));
  for (const queen of queens) {
    if (queen._hivemindUsed) continue; // Once per combat
    const deadDrones = currentCombat.aliens.filter(a => a.hp <= 0 && a.type === 'drone');
    if (deadDrones.length > 0) {
      const resurrected = deadDrones[0];
      resurrected.hp = Math.floor(resurrected.maxHp * 0.5);
      queen._hivemindUsed = true;
      logCombat(`${queen.name}'s Hivemind resurrects ${resurrected.name}!`, true);
      renderCombatUI(); // Update UI after resurrection
    }
  }
  
  for (const a of aliveAliens) {
    // 0.9.0 - Clear stun at start of next turn (so badge shows during skip)
    if (a._stunnedLastTurn) {
      a._stunnedLastTurn = false;
      delete a._stunned; // Clear the display flag
    }
    
    // 0.9.0 - Skip stunned aliens
    if (a._stunned) {
      logCombat(`${a.name} is stunned and cannot attack!`, true);
      a._stunnedLastTurn = true; // Mark for clearing next turn
      renderCombatUI();
      continue;
    }
    
    // 0.9.0 - Check for phase effect (destabilized)
    if (a._phaseActive) {
      a._phaseActive = false; // Effect is consumed
      if (Math.random() < 0.5) { // 50% chance to fail attack
        logCombat(`👻 ${a.name} is destabilized and its attack phases out!`, true);
        renderCombatUI();
        continue;
      }
    }
    
    // Check if any survivors are still alive before each alien attacks
    // 0.9.0 - Exclude retreated survivors
    const currentAliveParty = party.filter(p => p.hp > 0 && !p.downed && !p._retreated);
    if (currentAliveParty.length === 0) {
      return endCombat(false);
    }
    
    // 0.9.0 - Matriarch aura: All aliens gain +1 attack (Queen)
    let matriarchBonus = 0;
    const matriarchs = aliveAliens.filter(al => hasModifier(al, 'matriarch'));
    if (matriarchs.length > 0) {
      matriarchBonus = matriarchs.length; // Stacks if multiple matriarchs
    }
    
    // 0.9.0 - Pack Leader aura: All pack members gain +2 damage (Stalker)
    let packLeaderBonus = 0;
    if (a.special === 'pack') {
      const leaders = aliveAliens.filter(al => hasModifier(al, 'pack_leader'));
      if (leaders.length > 0) {
        packLeaderBonus = leaders.length * 2; // +2 per leader
      }
    }
    
    // Multi-strike special (queen)
    let attackCount = (a.special === 'multistrike') ? 2 : 1;
    
    // 0.9.0 - Relentless: Attack twice if ally died this turn (Stalker)
    if (a._relentlessBonus) {
      attackCount = 2;
      a._relentlessBonus = false; // Consume flag
      logCombat(`${a.name} is driven to relentless fury!`, true);
    }
    
    for (let strike = 0; strike < attackCount; strike++) {
      // Pick a random survivor to attack
      // 0.9.0 - Exclude retreated survivors from targeting
      const targetsAvailable = party.filter(p => p.hp > 0 && !p.downed && !p._retreated);
      if (targetsAvailable.length === 0) {
        return endCombat(false);
      }
      
      let targ = targetsAvailable[rand(0, targetsAvailable.length - 1)];
      if (!targ || targ.hp <= 0) break;
      
      let aDmg = rand(Math.max(1, a.attack - 1), a.attack + 1);
      
      // Apply aura bonuses
      aDmg += matriarchBonus + packLeaderBonus;
      
      // 0.8.0 - Wraith: +50% damage after phasing
      if (hasModifier(a, 'wraith') && a._justPhased) {
        aDmg = Math.floor(aDmg * 1.5);
        logCombat(`${a.name} strikes from the void!`, true);
        a._justPhased = false; // Clear flag
      }
      
      // Apply alien special attack modifiers
      if (a.special === 'ambush' && a.firstStrike) {
        aDmg = Math.floor(aDmg * 1.5);
        a.firstStrike = false;
        logCombat(`${a.name} ambushes from the shadows!`);
      }
      
      // 0.9.0 - Silent Killer: +20% ambush damage (Lurker)
      if (hasModifier(a, 'silent') && a.firstStrike) {
        aDmg = Math.floor(aDmg * 1.2);
      }
      
      // 0.9.0 - Nightmare: Ambush ignores armor (Lurker)
      if (hasModifier(a, 'nightmare') && a.firstStrike) {
        a._ignoreArmorThisHit = true;
        logCombat(`${a.name}'s nightmare strike bypasses all defenses!`, true);
      }
      
      // 0.8.0 - Cunning: second ambush at 50% HP
      if (hasModifier(a, 'cunning') && a.hp < a.maxHp * 0.5 && !a._cunningUsed) {
        aDmg = Math.floor(aDmg * 1.5);
        a._cunningUsed = true;
        logCombat(`${a.name} strikes with renewed cunning!`);
      }
      
      // 0.9.0 - Brutal: +50% crit damage on 15% chance (Lurker)
      if (hasModifier(a, 'brutal') && Math.random() < 0.15) {
        aDmg = Math.floor(aDmg * 1.5);
        logCombat(`${a.name} delivers a brutal critical strike!`, true);
      }
      
      // 0.9.0 - Apex Predator: +30% damage vs wounded targets (Lurker)
      if (hasModifier(a, 'predator') && targ.hp < targ.maxHp * 0.75) {
        aDmg = Math.floor(aDmg * 1.3);
      }
      
      if (a.special === 'pack') {
        const allyCount = aliveAliens.filter(al => al !== a).length;
        let packBonus = 2;
        
        // 0.9.0 - Coordinated: +50% pack bonus (Stalker)
        if (hasModifier(a, 'coordinated')) {
          packBonus = Math.floor(packBonus * 1.5);
        }
        
        // 0.9.0 - Dire: +100% pack bonus (Stalker)
        if (hasModifier(a, 'dire')) {
          packBonus = Math.floor(packBonus * 2);
        }
        
        aDmg += allyCount * packBonus;
        if (allyCount > 0) logCombat(`${a.name} coordinated pack attack!`);
        
        // 0.9.0 - Pack Leader: All allies gain +2 damage (Stalker)
        if (hasModifier(a, 'pack_leader')) {
          // This is applied passively in stat calculation
        }
      }
      
      // 0.9.0 - Enraged: +4 attack below 50% HP (Brood)
      if (hasModifier(a, 'enraged') && a.hp < a.maxHp * 0.5) {
        aDmg += 4;
      }
      
      // 0.9.0 - Rapid Fire: 30% chance to double attack (Spitter)
      if (hasModifier(a, 'rapid') && Math.random() < 0.30 && !a._rapidFired) {
        a._rapidFired = true;
        logCombat(`${a.name} fires rapidly - extra shot!`, true);
        attackCount++; // Add extra attack this turn
      }
      
      // 0.9.0 - Empress: Triple attack (Queen)
      if (hasModifier(a, 'empress') && attackCount === 2) {
        attackCount = 3; // Upgrade from double to triple
      }
      
      // 0.9.0 - Matriarch: All aliens gain +1 attack (Queen aura)
      // This is applied passively via a check during enemy turn start
      
      // 0.8.0 - Living Shield: Guardian intercepts damage for ally
      let actualTarget = targ;
      const guardians = aliveParty.filter(g => g.hp > 0 && hasAbility(g, 'shield') && !g._shieldUsed && g !== targ);
      if (guardians.length > 0 && Math.random() < 0.50) { // 50% chance to intercept
        actualTarget = guardians[0];
        actualTarget._shieldUsed = true;
        logCombat(`${actualTarget.name} intercepts with Living Shield!`, true);
      }
      
      // 0.9.0 - Stealth Field: auto-dodge next attack
      if (actualTarget._stealthField) {
        actualTarget._stealthField = false; // Consume effect
        logCombat(`${actualTarget.name}'s Stealth Field activates - attack dodged!`, true);
        renderCombatUI();
        continue; // Skip this attack entirely
      }
      
      // 0.9.0 - Calculate total dodge chance (armor + abilities + stimpack)
      let totalDodgeChance = 0.05; // Base 5% dodge for all survivors
      
      // Armor dodge bonus
      const armor = actualTarget.equipment && actualTarget.equipment.armor;
      if (armor && armor.effects) {
        const armorBonuses = getArmorPassiveBonuses(armor);
        totalDodgeChance += armorBonuses.dodgeBonus;
      }
      
      // Scout class dodge bonus (flat % on top of base)
      if (actualTarget.class === 'scout' && actualTarget.classBonuses && actualTarget.classBonuses.dodge) {
        // Scout bonus is a flat percentage (not a multiplier)
        // classBonuses.dodge should be treated as a flat % bonus (e.g., 0.15 = 15%)
        totalDodgeChance += (actualTarget.classBonuses.dodge - 1); // Subtract 1 since it's stored as multiplier (1.15 = 15%)
      }
      
      // Scout abilities
      if (hasAbility(actualTarget, 'evasive')) totalDodgeChance += 0.20;
      if (hasAbility(actualTarget, 'ghost')) totalDodgeChance += 0.35;
      
      // Stimpack evasion bonus
      if (actualTarget._stimpackEvasion && actualTarget._stimpackEvasion > 0) {
        totalDodgeChance += actualTarget._stimpackEvasion;
      }
      
      // Apply dodge check
      if (totalDodgeChance > 0 && Math.random() < totalDodgeChance) {
        logCombat(`${actualTarget.name} dodges the attack!`, true);
        renderCombatUI();
        continue; // Skip this attack
      }
      
      // 0.9.0 - Calculate defense for the actual target, applying guard bonus
      let armorDefense = 0;
      if (actualTarget.equipment.armor) {
        // New structure: has defense property
        if (actualTarget.equipment.armor.defense !== undefined) {
          armorDefense = actualTarget.equipment.armor.defense;
        }
        // Old structure: type-based defense
        else if (actualTarget.equipment.armor.type === 'armor') {
          armorDefense = 3;
        } else if (actualTarget.equipment.armor.type === 'heavyArmor') {
          armorDefense = 6;
        } else if (actualTarget.equipment.armor.type === 'hazmatSuit') {
          armorDefense = 3;
        }
      }
      
      let defense = armorDefense;
      if (currentCombat.guarding && currentCombat.guarding[actualTarget.id]) {
        defense += BALANCE.COMBAT_ACTIONS.Guard.defenseBonus;
      }
      
      // 0.9.0 - Nightmare: Ambush ignores all armor
      if (a._ignoreArmorThisHit) {
        defense = 0;
        a._ignoreArmorThisHit = false; // Clear flag
      }
      
      // Piercing special (spitter) - ignore 50% of armor
      else if (a.special === 'piercing') {
        defense = Math.floor(defense * 0.5);
        logCombat(`${a.name} sprays corrosive bile!`);
        
        // 0.9.0 - Hyper-Corrosive: +40% pierce (90% total = 50% base + 40% bonus = only 10% armor remains)
        if (hasModifier(a, 'corrosive')) {
          defense = Math.floor(armorDefense * 0.10); // 90% ignore total
        }
      }
      
      // 0.9.0 - Toxic: Reduce target defense by 2 for this hit (Spitter)
      if (hasModifier(a, 'toxic')) {
        defense = Math.max(0, defense - 2);
      }
      
      const taken = Math.max(0, aDmg - defense);
      actualTarget.hp -= taken;
      logCombat(`${a.name} strikes ${actualTarget.name} for ${taken} damage.`);
      renderCombatUI(); // Update UI after damage
      
      if (actualTarget !== targ) {
        appendLog(`${a.name} hits ${actualTarget.name} for ${taken} (shielded ${targ.name}).`);
      } else {
        appendLog(`${a.name} strikes ${actualTarget.name} for ${taken}.`);
      }
      
      // Check actual target for effects
      targ = actualTarget;
      
      // 0.9.0 - Juggernaut: 20% chance to stun on hit (Ravager)
      if (hasModifier(a, 'juggernaut') && taken > 0 && Math.random() < 0.20) {
        if (!targ._stunned) {
          targ._stunned = true;
          logCombat(`⚡ ${targ.name} is stunned by the devastating blow!`, true);
          renderCombatUI(); // Update UI to show stun status
        }
      }
      
      // 0.8.0 - Venomous: apply poison
      if (hasModifier(a, 'venomous') && taken > 0) {
        // Poison: Each stack lasts 3 turns independently
        // Deal 2 damage per stack per turn
        if (!targ._poisonQueue) targ._poisonQueue = [];
        targ._poisonQueue.push(3); // Add new stack with 3 turns
        targ._poisonStacks = targ._poisonQueue.length;
        logCombat(`${targ.name} is poisoned!`);
        renderCombatUI(); // Update UI after poison applied
      }
      
      // 0.9.0 - Plague Bringer: AOE + poison all targets (Spitter)
      if (hasModifier(a, 'plague') && taken > 0) {
        // Apply poison to primary target
        if (!targ._poisonQueue) targ._poisonQueue = [];
        targ._poisonQueue.push(3);
        targ._poisonStacks = targ._poisonQueue.length;
        
        // AOE splash to all other survivors
        const splashTargets = aliveParty.filter(p => p.hp > 0 && p !== targ);
        for (const splashTarg of splashTargets) {
          const plagueDmg = Math.floor(taken * 0.5);
          splashTarg.hp -= plagueDmg;
          
          // Poison splash targets too
          if (!splashTarg._poisonQueue) splashTarg._poisonQueue = [];
          splashTarg._poisonQueue.push(3);
          splashTarg._poisonStacks = splashTarg._poisonQueue.length;
        }
        logCombat(`💀 ${a.name} unleashes a plague cloud! All survivors poisoned!`, true);
        renderCombatUI();
      }
      
      // 0.8.0 - Caustic: splash damage
      if (hasModifier(a, 'caustic') && aliveParty.filter(p => p.hp > 0).length > 1) {
        const splashTargets = aliveParty.filter(p => p.hp > 0 && p !== targ);
        if (splashTargets.length > 0) {
          const splashTarg = splashTargets[rand(0, splashTargets.length - 1)];
          const splashDmg = Math.floor(taken * 0.5);
          splashTarg.hp -= splashDmg;
          logCombat(`Caustic splash hits ${splashTarg.name} for ${splashDmg}!`);
          renderCombatUI(); // Update UI after splash damage
        }
      }
      
      if (targ.hp <= 0) {
        // 0.8.0 - Medic Lifesaver: survive fatal blow once per combat
        if (hasAbility(targ, 'lifesaver') && !targ._lifesaverUsed) {
          targ.hp = 1;
          targ._lifesaverUsed = true;
          logCombat(`${targ.name}'s Lifesaver ability prevents death!`, true);
          renderCombatUI(); // Update UI after lifesaver
        } else {
          // 0.8.0 - Downed state instead of instant death
          targ.hp = 0;
          targ.downed = true;
          logCombat(`${targ.name} has died.`, true);

          // Morale loss for all other survivors
          state.survivors.forEach(s => {
            if (s.id !== targ.id && s.hp > 0) {
              s.morale = Math.max(0, (s.morale || 0) - BALANCE.MORALE_LOSS_ALLY_DEATH);
            }
          });
          
          renderCombatUI(); // Update UI after downed
          if (currentCombat.context !== 'base') {
            state.raidPressure = Math.min((state.raidPressure || 0) + 0.004, 0.03);
            state.threat = clamp(state.threat + 1, 0, 100);
          }
        }
        
        // Check if ALL survivors in this combat are now dead
        const stillAlive = party.filter(p => p.hp > 0 && !p.downed).length;
        if (stillAlive === 0) {
          // All survivors dead - end combat immediately
          return endCombat(false);
        }
        
        break; // Don't continue multi-strike on dead target
      }
    }
  }

  currentCombat.turn++;
  
  // Check if any survivors remain alive (not downed)
  const survivorsAlive = aliveParty.filter(p => p.hp > 0 && !p.downed && !p._retreated).length;
  if (survivorsAlive === 0) {
    return endCombat(false);
  }

  // Reset to first survivor for next round
  currentCombat.activePartyIdx = 0;
  
  // Log the start of the new player turn FIRST
  logCombat(`— Turn ${currentCombat.turn} —`);
  logCombat('— Your Turn —');
  
  // Render UI to show turn markers immediately (before resetting guard status)
  renderCombatUI();
  
  // 0.8.0 & 0.9.0 - Reset per-turn flags AFTER rendering
  for (const p of party) {
    p._guardBonus = 0;
    p._shieldUsed = false; // Reset Living Shield
    if (currentCombat.guarding) {
      currentCombat.guarding[p.id] = false; // Clear guard status for next turn
    }
  }
  for (const a of currentCombat.aliens) {
    if (a._justPhased) a._justPhased = false; // Clear wraith flag
  }
}

function endCombat(win) {
  const idx = currentCombat?.idx ?? null;
  const isRaid = currentCombat?.context === 'base';
  
  // 0.9.0 - Apply durability loss to all party members' equipment
  const party = currentCombat.partyIds.map(id => state.survivors.find(s => s.id === id)).filter(Boolean);
  for (const s of party) {
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
  
  if (win) {
    logCombat('Victory! Area secured.', true);
    if (idx !== null && state.tiles[idx]) {
      state.tiles[idx].aliens = [];
      state.tiles[idx].type = 'empty';
      state.tiles[idx].cleared = true; // Mark as fully cleared (0.7.2)
    }
    // XP reward for all surviving party members (including downed who survived)
    const party = currentCombat.partyIds.map(id => state.survivors.find(s => s.id === id)).filter(Boolean);
    for (const s of party) {
      if (s && s.hp > 0) grantXp(s, rand(BALANCE.COMBAT_XP_RANGE[0], BALANCE.COMBAT_XP_RANGE[1]));
      // 0.8.0 - Clear downed state after combat
      if (s && s.downed) {
        s.downed = false;
        if (s.hp === 0) s.hp = 1; // Give 1 HP if still at 0
      }
      // 0.9.0 - Clear retreat flags after combat
      if (s._retreated) delete s._retreated;
      if (s._retreating) delete s._retreating;
      
  // 0.9.0 - Morale gain for combat victory (raids give double)
      if (s && !s._retreated) {
        const moraleGain = isRaid ? BALANCE.MORALE_GAIN_RAID_WIN : BALANCE.MORALE_GAIN_COMBAT_WIN;
        s.morale = Math.min(100, (s.morale || 0) + moraleGain);
      }
    }
    renderCombatUI();
    
    // Raid success rewards
    if (isRaid) {
      state.resources.scrap += rand(2, 10);
      
      // 0.9.0 - Threat behavior depends on whether we're at 100% or not
      if (state.threatLocked && state.threat >= 100) {
        // At 100%, threat stays locked but escalation increases
        const escGain = BALANCE.ESCALATION_PER_RAID_SURVIVED || 1;
        state.escalationLevel = (state.escalationLevel || 0) + escGain;
        appendLog(`Raid repelled. Station holding at maximum threat. Escalation level increased to ${state.escalationLevel}.`);
      } else {
        // Below 100%, threat can still be reduced
        state.threat = clamp(state.threat - BALANCE.THREAT_REDUCE_ON_REPEL, 0, 100);
        appendLog('Raid repelled. Recovered scrap from wreckage.');
      }
    }
  } else {
    logCombat('Defeat.', true);
    
    // 0.9.0 - Clean up retreat flags for all party members
    const combatPartyIds = currentCombat.partyIds;
    const party = combatPartyIds.map(id => state.survivors.find(s => s.id === id)).filter(Boolean);
    party.forEach(s => {
      if (s._retreated) delete s._retreated;
      if (s._retreating) delete s._retreating;
    });
    
    // 0.8.0 - Remove downed/dead survivors from this combat
    state.survivors = state.survivors.filter(x => {
      // Only remove survivors who were actually in this combat
      const wasInCombat = combatPartyIds.includes(x.id);
      if (wasInCombat && (x.hp <= 0 || x.downed)) {
        appendLog(`${x.name} was lost in combat.`);
        return false;
      }
      return true;
    });
    
    // Raid failure = GAME OVER (0.7.1 - hardcore mode)
    if (isRaid) {
      triggerGameOver('The base defenses have fallen. The aliens have taken control. Game Over.');
      closeCombatOverlay();
      return;
    }
    
    // For field combat, mark tile as not cleared so it can be revisited
    if (idx !== null && state.tiles[idx]) {
      state.tiles[idx].cleared = false;
    }
  }
  updateUI();
  closeCombatOverlay();
}

function bindCombatUIEvents() {
  // 0.9.0 - Close button removed to prevent cheating (early escape = 100% success)
  // Players must use Retreat action or complete combat
  
  const shoot = document.getElementById('btnActionShoot');
  const aim = document.getElementById('btnActionAim');
  const burst = document.getElementById('btnActionBurst');
  const guard = document.getElementById('btnActionGuard');
  const useItem = document.getElementById('btnActionUseItem'); // 0.9.0
  const revive = document.getElementById('btnActionRevive');
  const retreat = document.getElementById('btnActionRetreat');
  const auto = document.getElementById('btnActionAuto');
  if (shoot) shoot.onclick = () => playerShoot('shoot');
  if (aim) aim.onclick = () => playerAim();
  if (burst) burst.onclick = () => playerShoot('burst');
  if (guard) guard.onclick = () => playerGuard();
  if (useItem) useItem.onclick = () => showConsumableSelector(); // 0.9.0
  if (revive) revive.onclick = () => playerRevive();
  if (retreat) retreat.onclick = () => playerRetreat();
  if (auto) auto.onclick = () => { // fall back to auto resolver
    const isFieldCombat = currentCombat?.context === 'field';
    const t = currentCombat?.idx;
    
    if (isFieldCombat && t != null) {
      // For field exploration, only use the explorer in auto-resolve
      const explorer = state.survivors.find(s => s.id === currentCombat.partyIds[0]);
      if (explorer) {
        resolveSkirmish(currentCombat.aliens, 'field', t);
      }
    } else if (currentCombat.context === 'base') {
      resolveSkirmish(currentCombat.aliens, 'base', null);
    }
    closeCombatOverlay();
  };
}

// Initialize bindings after DOM ready
setTimeout(bindCombatUIEvents, 0);
