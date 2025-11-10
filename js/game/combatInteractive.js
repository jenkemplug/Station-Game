// Interactive Combat System (0.7.0)
// Presents a modal where the player can select actions per round.

// 1.0 - Advanced AI: Smart target selection for aliens in interactive combat
function selectAlienTargetInteractive(alien, validTargets) {
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
    veryrare: '#ef4444',
    legendary: '#ef4444'
  };
  return colors[rarity] || colors.common;
}

// Helper functions for colored log text
function colorSurvivor(name) {
  return `<span style="color:var(--accent)">${name}</span>`;
}

function colorAlien(alien) {
  if (!alien || !alien.name) return 'unknown';
  const color = getRarityColor(alien.rarity);
  return `<span style="color:${color}">${alien.name}</span>`;
}

function colorItem(item) {
    if (!item || !item.name) return 'unknown';
    const color = getRarityColor(item.rarity);
    return `<span style="color:${color}">${item.name}</span>`;
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
    const durationText = typeof entity._stunned === 'number' && entity._stunned > 1 ? ` [${entity._stunned}]` : '';
    effects.push({ text: `⚡ Stunned${durationText}`, color: 'var(--danger)', tooltip: 'Cannot attack or retreat' });
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
  if (entity._toxicDebuff) {
    effects.push({ text: '🤢 Toxic', color: 'var(--danger)', tooltip: 'Defense is reduced' });
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
    effects.push({ text: `💊 Combat Drug +${Math.round(entity._combatDrugBonus * 100)}% damage [${entity._combatDrugTurns || 0}]`, color: '#ff8c00', tooltip: `+${Math.round(entity._combatDrugBonus*100)}% damage for ${entity._combatDrugTurns || 0} more turns` });
  }
  if (entity._stealthField) {
    effects.push({ text: '🌫️ Stealth Field', color: '#9c27b0', tooltip: 'Will dodge next attack' });
  }
  
  // Check currentCombat objects for action-based status (these persist across renders)
  // 1.0 Phase 3.2 FIX: Only check ONE source per status to avoid duplicates
  // For player survivors: use currentCombat.guarding/aimed
  // For hostile survivors/aliens: use entity._guardActive/_aimedShot
  const useEntityFlags = isAlien || entity.type === 'hostile_human';
  
  if (!useEntityFlags && currentCombat && currentCombat.guarding && currentCombat.guarding[entity.id]) {
    effects.push({ text: '🛡️ Guarding', color: 'var(--accent)', tooltip: `+${BALANCE.COMBAT_ACTIONS.Guard.defenseBonus} defense this turn` });
  }
  if (!useEntityFlags && currentCombat && currentCombat.aimed && currentCombat.aimed[entity.id]) {
    effects.push({ text: '🎯 Aimed', color: 'var(--accent)', tooltip: `+${Math.round(BALANCE.COMBAT_ACTIONS.Aim.accuracyBonus * 100)}% hit chance next shot` });
  }
  
  // 1.0 Phase 3.2 - Hostile survivor AI status effects (only for aliens/hostiles)
  if (useEntityFlags && entity._guardActive) {
    effects.push({ text: '🛡️ Guarding', color: 'var(--accent)', tooltip: `+${BALANCE.COMBAT_ACTIONS.Guard.defenseBonus} defense this turn` });
  }
  if (useEntityFlags && entity._aimedShot) {
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
          case 'poison':
            effects.push({ text: `Poison ${value}%`, color: weapColor, tooltip: `${value}% chance to poison enemies (2 dmg/turn for 3 turns) from ${weapon.name}` });
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

    // Scavenger loot bonuses
    if (entity.class === 'scavenger') {
        let lootBonus = 0;
        if (entity.classBonuses && entity.classBonuses.loot) {
            lootBonus += (entity.classBonuses.loot - 1);
        }
        if (hasAbility(entity, 'treasure')) {
            lootBonus += 0.25;
        }
        if (hasAbility(entity, 'goldnose')) {
            lootBonus += 0.50;
        }
        if (lootBonus > 0) {
            effects.push({
                text: `Loot Rarity +${Math.round(lootBonus * 100)}%`,
                color: '#f59e0b', // A gold/yellow color
                tooltip: `Increases the chance of finding rarer items from kills.`
            });
        }
        if (hasAbility(entity, 'goldnose')) {
            effects.push({
                text: `Double Loot Rolls`,
                color: '#f59e0b',
                tooltip: `Grants an extra loot roll on kills.`
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
    const isChanceBased = ['burn', 'stun', 'phase', 'splash', 'poison'].includes(effectType);
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
          
          // 1.0 Phase 3.2 - Queue burn animation
          if (typeof queueAnimation === 'function' && typeof applyStatusAnimation === 'function') {
            queueAnimation(() => {
              const targetCard = getCombatantCard(target.id, true);
              applyStatusAnimation(targetCard, 'burning', true);
              renderCombatUI();
            }, 400);
          } else {
            renderCombatUI();
          }
          break;
        
        case 'poison':
          // Poison: Each stack lasts 3 turns independently
          // Deal 2 damage per stack per turn
          if (!target._poisonQueue) target._poisonQueue = [];
          target._poisonQueue.push(3); // Add new stack with 3 turns
          target._poisonStacks = target._poisonQueue.length;
          logCombat(`☠️ ${target.name} is poisoned! (${target._poisonStacks} stack${target._poisonStacks > 1 ? 's' : ''})`, true);
          
          // 1.0 Phase 3.2 - Queue poison animation
          if (typeof queueAnimation === 'function' && typeof applyStatusAnimation === 'function') {
            queueAnimation(() => {
              const targetCard = getCombatantCard(target.id, true);
              applyStatusAnimation(targetCard, 'poisoned', true);
              renderCombatUI();
            }, 400);
          } else {
            renderCombatUI();
          }
          break;
          
        case 'stun':
          // Stun: Skip next turn
          if (!target._stunned) {
            target._stunned = 1;
            logCombat(`⚡ ${target.name} is stunned!`, true);
            
            // 1.0 Phase 3.2 - Queue stun animation
            if (typeof queueAnimation === 'function' && typeof applyStatusAnimation === 'function') {
              queueAnimation(() => {
                const targetCard = getCombatantCard(target.id, true);
                applyStatusAnimation(targetCard, 'stunned', true);
                setTimeout(() => applyStatusAnimation(targetCard, 'stunned', false), 1800);
                renderCombatUI();
              }, 500);
            } else {
              renderCombatUI();
            }
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
          
          // 1.0 Phase 3.2 - Queue destabilized animation
          if (typeof queueAnimation === 'function' && typeof applyStatusAnimation === 'function') {
            queueAnimation(() => {
              const targetCard = getCombatantCard(target.id, true);
              applyStatusAnimation(targetCard, 'destabilized', true);
              if (typeof showStatusEffect === 'function') {
                showStatusEffect(targetCard, '🌀 DESTABILIZED', 'var(--danger)');
              }
              renderCombatUI();
            }, 400);
          } else {
            renderCombatUI();
          }
          break;
          
        case 'splash':
          // 1.0 Phase 3.2 - Splash: Hit additional targets with weapon-specific effect
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
            // 1.0 Phase 3.2 - Determine splash effect based on weapon subtype or name
            const weaponSubtype = attacker.equipment?.weapon?.subtype || '';
            const weaponName = attacker.equipment?.weapon?.name || '';
            let splashEmoji = '💥'; // Default explosion
            let splashAnimation = 'explode';
            let splashMessage = 'Splash damage hits adjacent targets!';
            
            // Weapon-specific effects (check subtype first, then name as fallback)
            if (weaponSubtype.includes('flame') || weaponName.toLowerCase().includes('flame') || weaponName.toLowerCase().includes('incendiary')) {
              splashEmoji = '🔥';
              splashAnimation = 'burnSpread';
              splashMessage = 'Flames spread to adjacent targets!';
            } else if (weaponSubtype.includes('plasma') || weaponSubtype.includes('energy') || weaponName.toLowerCase().includes('plasma') || weaponName.toLowerCase().includes('energy')) {
              splashEmoji = '🌟'; // Star emoji instead of lightning (used for crits)
              splashAnimation = 'plasmaWave';
              splashMessage = 'Energy discharge hits adjacent targets!';
            }
            // Note: Add more splash types here as needed
            // Pattern: Check weapon.subtype first (reliable), then weapon.name (flexible)
            
            logCombat(`${splashEmoji} ${splashMessage}`, true);
            
            // 1.0 Phase 3.2 - Show splash effect immediately (synchronized with main damage)
            if (typeof queueAnimation === 'function') {
              setTimeout(() => {
                const targetCard = getCombatantCard(target.id, true);
                if (targetCard) {
                  // Create splash effect
                  const splashEffect = document.createElement('div');
                  splashEffect.textContent = splashEmoji;
                  splashEffect.style.position = 'absolute';
                  splashEffect.style.fontSize = '48px';
                  splashEffect.style.left = '50%';
                  splashEffect.style.top = '50%';
                  splashEffect.style.transform = 'translate(-50%, -50%)';
                  splashEffect.style.animation = `${splashAnimation} 600ms ease-out`;
                  splashEffect.style.pointerEvents = 'none';
                  splashEffect.style.zIndex = '1000';
                  targetCard.style.position = 'relative';
                  targetCard.appendChild(splashEffect);
                  setTimeout(() => splashEffect.remove(), 600);
                }
              }, 0); // Play immediately
              
              // Apply splash damage to each target with synchronized animations
              for (const splashTarget of splashTargets) {
                const splashArmor = splashTarget.armor || 0;
                const splashDealt = Math.max(1, splashDmg - splashArmor);
                
                // Apply damage immediately (synchronized)
                setTimeout(() => {
                  splashTarget.hp -= splashDealt;
                  
                  // Update UI and animate
                  renderCombatUI();
                  const splashCard = getCombatantCard(splashTarget.id, true);
                  if (splashCard) {
                    if (typeof animateDamage === 'function') {
                      animateDamage(splashCard, true);
                    }
                    if (typeof showStatusEffect === 'function') {
                      showStatusEffect(splashCard, `${splashEmoji} ${splashDealt}`, '#ff6b6b');
                    }
                  }
                  
                  logCombat(`${splashTarget.name} is hit by splash for ${splashDealt} damage.`);
                  if (splashTarget.hp <= 0) {
                    logCombat(`${splashTarget.name} eliminated by splash damage.`);
                    state.alienKills = (state.alienKills || 0) + 1;
                  }
                }, 0); // Play immediately
              }
              
              // Check if all aliens died from splash (delayed check after animations)
              setTimeout(() => {
                const remainingAliens = currentCombat.aliens.filter(a => a.hp > 0);
                if (remainingAliens.length === 0) {
                  endCombat(true);
                }
              }, 800); // Wait for damage animations to complete
            } else {
              // Fallback without animations
              for (const splashTarget of splashTargets) {
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
  
  // 1.0 Phase 3.2 - Clear enemy turn flag when reopening combat (fixes retreat bug)
  if (currentCombat) {
    currentCombat._enemyTurnActive = false;
  }
  
  // 1.0 Phase 3.2 - Clear animation queue to prevent stuck buttons
  if (typeof clearAnimationQueue === 'function') {
    clearAnimationQueue();
  }
  
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

  // Clear all temporary combat flags from survivors as well
  if (currentCombat && currentCombat.partyIds) {
    const party = currentCombat.partyIds.map(id => state.survivors.find(s => s.id === id)).filter(Boolean);
    party.forEach(s => {
        delete s._stunned;
        delete s._stunnedLastTurn;
        delete s._burnStacks;
        delete s._burnQueue;
        delete s._poisonStacks;
        delete s._poisonQueue;
        delete s._phaseActive;
        delete s._justPhased;
        delete s._currentArmorPierce;
        delete s._shieldUsed;
        delete s._lifesaverUsed;
        delete s._adrenalineBonus;
        delete s._stimpackEvasion;
        delete s._stimpackTurns;
        delete s._combatDrugBonus;
        delete s._combatDrugTurns;
        delete s._stealthField;
        delete s._retreated;
        delete s._retreating;
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
  
  // Determine enemy type for log message
  const isHostile = t.aliens.some(a => a.type === 'hostile_human');
  const enemyLabel = isHostile ? 'Hostile Survivor(s)' : 'Alien(s)';
  const enemyLabelLower = isHostile ? 'hostile survivor(s)' : 'alien(s)';
  
  logCombat('=== ENGAGEMENT START ===');
  logCombat(`${currentCombat.partyIds.length} Survivor vs ${t.aliens.length} ${enemyLabel}`);
  logCombat(`— Turn ${currentCombat.turn} —`);
  logCombat('— Your Turn —');
  appendLog(`Engagement: ${currentCombat.partyIds.length} survivor vs ${t.aliens.length} ${enemyLabelLower}.`);
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

// Generic starter used by missions and other systems to begin an interactive combat
// partyParam: array of survivor objects or survivor ids
// aliensParam: array of alien objects
// contextParam: either a string ('field'|'base') or an object { type: 'mission', ... }
function startInteractiveCombat(partyParam, aliensParam, contextParam = 'field') {
  if (!partyParam || !Array.isArray(partyParam) || partyParam.length === 0) {
    console.error('startInteractiveCombat: invalid party:', partyParam);
    return;
  }

  // Normalize party ids
  const partyIds = partyParam.map(p => (typeof p === 'object' && p !== null) ? (p.id) : p);

  // Patch aliens for backward compatibility
  let aliens = (aliensParam || []).map(patchAlienData).filter(Boolean);
  if (aliens.length === 0) {
    console.error('startInteractiveCombat: no aliens provided');
    return;
  }

  // Clear cooldowns for party members
  partyIds.forEach(id => {
    const s = state.survivors.find(x => x.id === id);
    if (s) s._burstCooldown = 0;
  });

  // Build currentCombat object
  currentCombat = {
    context: contextParam,
    idx: (contextParam && contextParam.idx !== undefined) ? contextParam.idx : null,
    partyIds: partyIds,
    aliens: aliens,
    turn: 1,
    aimed: {},
    guarding: {},
    log: [],
    activePartyIdx: 0,
    selectedTargetId: (aliens && aliens.find(a => a.hp > 0) ? aliens.find(a => a.hp > 0).id : null)
  };

  logCombat('=== ENGAGEMENT START ===');
  logCombat(`${currentCombat.partyIds.length} Survivor(s) vs ${currentCombat.aliens.length} Alien(s)`);
  logCombat(`— Turn ${currentCombat.turn} —`);
  logCombat('— Your Turn —');
  appendLog(`Engagement: ${currentCombat.partyIds.length} survivor(s) vs ${currentCombat.aliens.length} alien(s).`);
  openCombatOverlay();
}

function logCombat(msg, alsoAppend = false) {
  if (!currentCombat) return;

  let coloredMsg = msg;
  const party = currentCombat.partyIds.map(id => state.survivors.find(s => s.id === id)).filter(Boolean);
  const allEntities = [...party, ...currentCombat.aliens];

  allEntities.forEach(entity => {
    if (entity && entity.name) {
      const name = entity.name;
      let color = 'white'; // Default for survivors
      if (entity.rarity) { // Aliens have rarity
        color = getRarityColor(entity.rarity);
      } else if (entity.class) { // Survivors have a class
        color = 'var(--accent)';
      }
      // Use a regex with word boundaries (\b) to avoid replacing parts of words
      const regex = new RegExp(`\\b${name}\\b`, 'g');
      coloredMsg = coloredMsg.replace(regex, `<span style="color:${color}; font-weight: bold;">${name}</span>`);
    }
  });

  currentCombat.log.unshift(coloredMsg);
  if (alsoAppend) appendLog(coloredMsg);
}

// 0.9.0 - Generate passive effect displays for aliens (like survivor equipment effects)
function getAlienPassiveEffects(alien, alienColor) {
  const effects = [];
  
  // 1.0 - For hostile_human, show equipment passive effects (like survivors)
  if (alien.type === 'hostile_human' && alien.equipment) {
    // Weapon effects
    if (alien.equipment.weapon && alien.equipment.weapon.effects) {
      alien.equipment.weapon.effects.forEach(eff => {
        const [type, value] = eff.split(':');
        const weapColor = RARITY_COLORS[alien.equipment.weapon.rarity] || alienColor;
        
        if (type === 'burn') {
          effects.push({ text: `Burn ${value}%`, color: weapColor, tooltip: `${value}% chance to inflict burn (2 damage/turn for 3 turns)` });
        } else if (type === 'stun') {
          effects.push({ text: `Stun ${value}%`, color: weapColor, tooltip: `${value}% chance to stun target (skip next turn)` });
        } else if (type === 'armorPierce') {
          effects.push({ text: `Pierce ${value}%`, color: weapColor, tooltip: `Ignores ${value}% of target's armor` });
        } else if (type === 'phase') {
          effects.push({ text: `Phase ${value}%`, color: weapColor, tooltip: `${value}% chance to phase through armor entirely` });
        } else if (type === 'splash') {
          effects.push({ text: `Splash ${value}%`, color: weapColor, tooltip: `Deals ${value}% damage to all enemies` });
        } else if (type === 'burst') {
          effects.push({ text: `Burst ×${value}`, color: weapColor, tooltip: `Fires ${value} shots in burst mode` });
        } else if (type === 'crit') {
          // Already shown in stats, skip
        } else if (type === 'accuracy') {
          // Already shown in stats, skip
        }
      });
    }
    
    // Armor effects
    if (alien.equipment.armor && alien.equipment.armor.effects) {
      alien.equipment.armor.effects.forEach(eff => {
        const [type, value] = eff.split(':');
        const armorColor = RARITY_COLORS[alien.equipment.armor.rarity] || alienColor;
        
        if (type === 'dodge') {
          // Already shown in stats, skip
        } else if (type === 'reflect') {
          effects.push({ text: `Reflect ${value}%`, color: armorColor, tooltip: `${value}% of damage reflected back to attacker` });
        } else if (type === 'regen') {
          effects.push({ text: `Regen ${value}`, color: armorColor, tooltip: `Regenerates ${value} HP per turn` });
        } else if (type === 'hpBonus') {
          effects.push({ text: `HP +${value}`, color: armorColor, tooltip: `Increases maximum HP by ${value}` });
        } else if (type === 'immunity') {
          effects.push({ text: `Immune: ${value}`, color: armorColor, tooltip: `Immune to ${value} effects` });
        } else if (type === 'retreat') {
          // Retreat bonus, skip for display
        } else if (type === 'exploration') {
          // Not relevant in combat
        }
      });
    }
  }
  
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
  
  // 1.0 - For hostile_human, add level and class bonuses to damage sources
  if (alien.type === 'hostile_human') {
    // Level bonus
    const levelBonus = (alien.level - 1) * (BALANCE.LEVEL_ATTACK_BONUS || 0.02);
    if (levelBonus > 0) {
      sources.push(`Level ${alien.level} (+${Math.round(levelBonus * 100)}%)`);
    }
    
    // Class bonus
    if (alien.classBonuses && alien.classBonuses.combat) {
      const classBonus = (alien.classBonuses.combat - 1) * 100;
      if (classBonus > 0) {
        sources.push(`${alien.class} (+${Math.round(classBonus)}%)`);
      }
    }
  }
  
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
  // For hostile_human, defense comes from equipment.armor.defense
  // For regular aliens, it's stored in alien.armor
  let baseArmor = 0;
  const armorSources = [];
  
  if (alien.type === 'hostile_human') {
    baseArmor = alien.defense || 0;
    if (baseArmor > 0) armorSources.push(`Armor (${baseArmor})`);
  } else {
    baseArmor = alien.armor || 0;
    if (baseArmor > 0) armorSources.push(`Base (${baseArmor})`);
  }
  
  // ACCURACY calculation (for hostile_human only)
  let baseAccuracy = 0;
  const accuracySources = [];
  if (alien.type === 'hostile_human') {
    baseAccuracy = BALANCE.COMBAT_HIT_CHANCE || 0.75;
    accuracySources.push(`Base (${Math.round(baseAccuracy * 100)}%)`);
    
    // Check for accuracy bonuses from equipment effects
    if (alien.equipment && alien.equipment.weapon && alien.equipment.weapon.effects) {
      alien.equipment.weapon.effects.forEach(effect => {
        if (effect.startsWith('accuracy:')) {
          const bonus = parseInt(effect.split(':')[1]) / 100;
          baseAccuracy += bonus;
          accuracySources.push(`${alien.equipment.weapon.name} (+${Math.round(bonus * 100)}%)`);
        }
      });
    }
  }
  
  // CRIT calculation (for hostile_human only)
  let baseCrit = 0;
  const critSources = [];
  if (alien.type === 'hostile_human') {
    baseCrit = BALANCE.COMBAT_CRIT_CHANCE || 0.12;
    critSources.push(`Base (${Math.round(baseCrit * 100)}%)`);
    
    // Check for crit bonuses from equipment effects
    if (alien.equipment && alien.equipment.weapon && alien.equipment.weapon.effects) {
      alien.equipment.weapon.effects.forEach(effect => {
        if (effect.startsWith('crit:')) {
          const bonus = parseInt(effect.split(':')[1]) / 100;
          baseCrit += bonus;
          critSources.push(`${alien.equipment.weapon.name} (+${Math.round(bonus * 100)}%)`);
        }
      });
    }
    if (alien.equipment && alien.equipment.armor && alien.equipment.armor.effects) {
      alien.equipment.armor.effects.forEach(effect => {
        if (effect.startsWith('crit:')) {
          const bonus = parseInt(effect.split(':')[1]) / 100;
          baseCrit += bonus;
          critSources.push(`${alien.equipment.armor.name} (+${Math.round(bonus * 100)}%)`);
        }
      });
    }
  }
  
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
    baseDodge += 0.25;
    dodgeSources.push('Alpha (+25%)');
  }
  
  // For hostile_human, check equipment effects
  if (alien.type === 'hostile_human' && alien.equipment && alien.equipment.armor && alien.equipment.armor.effects) {
    alien.equipment.armor.effects.forEach(effect => {
      if (effect.startsWith('dodge:')) {
        const bonus = parseInt(effect.split(':')[1]) / 100;
        baseDodge += bonus;
        dodgeSources.push(`${alien.equipment.armor.name} (+${Math.round(bonus * 100)}%)`);
      }
    });
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
    accuracy: { value: baseAccuracy, percent: Math.round(baseAccuracy * 100), sources: accuracySources },
    crit: { value: baseCrit, percent: Math.round(baseCrit * 100), sources: critSources },
    dodge: { value: totalDodge, percent: Math.round(totalDodge * 100), sources: dodgeSources },
    phase: { value: totalPhase, percent: Math.round(totalPhase * 100), sources: phaseSources },
    regen: { min: totalRegenMin, max: totalRegenMax, display: regenDisplay, sources: regenSources },
    resist: { value: totalResist, percent: Math.round(totalResist * 100), sources: resistSources }
  };
}

function selectTarget(alienId) {
  console.log('selectTarget called with:', alienId, 'type:', typeof alienId);
  if (!currentCombat) return;
  // Handle both string IDs (aliens) and numeric IDs (hostile survivors)
  const alien = currentCombat.aliens.find(a => {
    // Try direct comparison first
    if (a.id === alienId) return true;
    // If alienId is a string number, try numeric comparison
    if (typeof alienId === 'string' && !isNaN(alienId)) {
      return a.id === Number(alienId);
    }
    // If a.id is a number, try string comparison
    if (typeof a.id === 'number') {
      return String(a.id) === alienId;
    }
    return false;
  });
  console.log('Found alien:', alien, 'All aliens:', currentCombat.aliens.map(a => ({ id: a.id, name: a.name, type: a.type })));
  // Only allow targeting living aliens
  if (alien && alien.hp > 0) {
    // Store the ID in the same format as the alien object
    currentCombat.selectedTargetId = alien.id;
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
  let statsDisplay = `<span title="${damageTooltip}">⚔️ ${stats.damage.display}</span> • <span title="${accuracyTooltip}">🎯 ${stats.accuracy.percent}%</span> • <span title="${defenseTooltip}">🛡️ ${stats.defense.value}</span> • <span title="${critTooltip}">💢 ${stats.crit.percent}%</span>`;
    
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
    
    // 1.0 Phase 3.2 - Add data-survivor-id for animations
    return `<div class="card-like" ${activeClass} data-survivor-id="${s.id}"><strong>${s.name}${isActive ? ' ⬅' : ''}</strong><div class="small" title="${hpTooltip}">HP ${s.hp}/${effectiveMaxHp}</div>${downedStatus}<div class="small" style="margin-top:4px">${weap} • ${armor}</div>${classHtml}${abilitiesHtml}${statsHtml}${statusEffects}</div>`;
  }).join('');

  const turretHtml = (currentCombat.turrets && currentCombat.turrets > 0)
    ? `<div class="card-like small"><strong>Auto-Turrets</strong><div class="small">${currentCombat.turrets} unit(s) ready</div></div>`
    : '';

  const alienHtml = aliens.map(a => {
    
    const alive = a.hp > 0;
      // 1.0 Phase 3.2 - Hide targeting outline during enemy turn
      const isTarget = alive && a.id === currentCombat.selectedTargetId && !currentCombat._enemyTurnActive;
      const targetClass = isTarget ? 'targeted-enemy' : '';
    const clickableClass = alive ? 'clickable' : '';
    
    // 0.9.0 - Define rarity color mapping
    const rarityColors = {
      common: 'var(--rarity-common)',
      uncommon: 'var(--rarity-uncommon)',
      rare: 'var(--rarity-rare)',
      veryrare: 'var(--rarity-veryrare)'
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
    
    // For hostile_human, add accuracy and crit (like survivors)
    if (a.type === 'hostile_human') {
      if (stats.accuracy && stats.accuracy.value > 0) {
        let accuracyTooltip = `Hit Chance`;
        if (stats.accuracy.sources.length > 0) {
          accuracyTooltip += `:\n• ${stats.accuracy.sources.join('\n• ')}`;
          accuracyTooltip += `\n\nTotal: ${stats.accuracy.percent}%`;
        }
        statsDisplay += ` • <span title="${accuracyTooltip}">🎯 ${stats.accuracy.percent}%</span>`;
      }
      
      if (stats.crit && stats.crit.value > 0) {
        let critTooltip = `Critical Hit Chance (×1.6 damage)`;
        if (stats.crit.sources.length > 0) {
          critTooltip += `:\n• ${stats.crit.sources.join('\n• ')}`;
          critTooltip += `\n\nTotal: ${stats.crit.percent}%`;
        }
  statsDisplay += ` • <span title="${critTooltip}">💢 ${stats.crit.percent}%</span>`;
      }
    }
    
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
    
    // 1.0 - Show class and abilities for hostile survivors
    let classAbilitiesHtml = '';
    if (a.type === 'hostile_human') {
      // Show class with tooltip
      const classInfo = SURVIVOR_CLASSES.find(c => c.id === a.class);
      const className = classInfo ? classInfo.name : (a.class || 'Unknown');
      const classDesc = classInfo ? classInfo.desc : '';
      classAbilitiesHtml += `<div class="small" style="color:var(--class-common);margin-top:4px" title="${classDesc}">${className}</div>`;
      
      // Show abilities with rarity colors and tooltips
      if (a.abilities && a.abilities.length > 0) {
        const abilityDetails = a.abilities.map(abilityId => {
          // Find the ability definition
          for (const classKey in SPECIAL_ABILITIES) {
            const found = SPECIAL_ABILITIES[classKey].find(ab => ab.id === abilityId);
            if (found) {
              return `<span style="color: ${found.color}" title="${found.effect}">${found.name}</span>`;
            }
          }
          return abilityId;
        });
        classAbilitiesHtml += `<div class="small" style="margin-top:4px">${abilityDetails.join(' • ')}</div>`;
      }
    }
    
    // 1.0 - Show equipment for hostile survivors
    let equipmentHtml = '';
    if (a.type === 'hostile_human' && a.equipment) {
      const weapColor = a.equipment.weapon?.rarity ? (RARITY_COLORS[a.equipment.weapon.rarity] || '#ffffff') : '#ffffff';
      const armorColor = a.equipment.armor?.rarity ? (RARITY_COLORS[a.equipment.armor.rarity] || '#ffffff') : '#ffffff';
      const weapTooltip = a.equipment.weapon ? getItemTooltip(a.equipment.weapon) : '';
      const armorTooltip = a.equipment.armor ? getItemTooltip(a.equipment.armor) : '';
      const weap = a.equipment.weapon ? `<span style="color:${weapColor}" title="${weapTooltip}">${a.equipment.weapon.name}</span>` : 'Unarmed';
      const armor = a.equipment.armor ? `<span style="color:${armorColor}" title="${armorTooltip}">${a.equipment.armor.name}</span>` : 'No Armor';
      equipmentHtml = `<div class="small" style="margin-top:4px">${weap} • ${armor}</div>`;
    }
    
    // 0.9.0 - Show passive effects below stats (like survivor equipment effects)
    const passiveEffects = getAlienPassiveEffects(a, alienColor);
    
    // 0.9.0 - Show temporary combat status effects at the bottom (pass aliens array for dynamic calculations)
    const tempStatusEffects = getStatusEffectsDisplay(a, true, alienColor, aliens);
    
    // Override color for unique mission enemies based on their rank
    const nameColor = a.rank && rarityColors[a.rank] ? rarityColors[a.rank] : alienColor;
    
    return `<div class="card-like ${alive ? '' : 'small'} ${targetClass} ${clickableClass}" data-alien-id="${a.id}"><strong style="color: ${nameColor}">${a.name}</strong><div class="small">HP ${Math.max(0,a.hp)}/${a.maxHp}</div>${modifiersHtml}${classAbilitiesHtml}${equipmentHtml}${statsHtml}${passiveEffects}${tempStatusEffects}</div>`;
  }).join('');

  const combatLogHtml = currentCombat.log.map(l => `<div class="small" style="padding: 4px 8px; border-bottom: 1px solid rgba(255,255,255,0.05);">${l}</div>`).join('');

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
    <div style="display: flex; flex-direction: column; padding:12px; background:rgba(0,0,0,0.2); border-radius:4px; height:500px; width:90%; margin:12px auto 0 auto;">
      <div class="small" style="margin-bottom:8px; text-align:center;"><strong>Combat Log</strong></div>
      <div class="scrollable-panel" style="overflow-y:auto; flex-grow:1; text-align:center;">
        ${combatLogHtml || '<div class="small" style="color:var(--muted); text-align:center;">No events yet.</div>'}
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
        console.log('Clicked alien card:', { attrValue, hasAttr, targetCard });
        if (attrValue) {
          selectTarget(attrValue);
        }
      } else {
        // No target card found on click
        console.log('No alien card found on click');
      }
    });
  }

  // 0.9.0 - Render adaptive action buttons based on weapon type
  renderAdaptiveActions(activeSurvivor);
  
  // 1.0 Phase 3.3 - Re-apply persistent status animations after DOM recreation
  reapplyStatusAnimations();
}

// 1.0 Phase 3.3 - Re-apply all persistent status effects to cards after renderCombatUI()
function reapplyStatusAnimations() {
  if (!currentCombat) return;
  
  // Re-apply status effects to survivors
  const party = currentCombat.partyIds.map(id => state.survivors.find(s => s.id === id)).filter(Boolean);
  party.forEach(s => {
    const card = getCombatantCard(s.id, false);
    if (!card) return;
    
    // Apply burning status
    if (s._burnQueue && s._burnQueue.length > 0) {
      if (typeof applyStatusAnimation === 'function') {
        applyStatusAnimation(card, 'burning', true);
      }
    }
    
    // Apply poisoned status
    if (s._poisonQueue && s._poisonQueue.length > 0) {
      if (typeof applyStatusAnimation === 'function') {
        applyStatusAnimation(card, 'poisoned', true);
      }
    }
    
    // Apply stunned status
    if (s._stunned && s._stunned > 0) {
      if (typeof applyStatusAnimation === 'function') {
        applyStatusAnimation(card, 'stunned', true);
      }
    }
  });
  
  // Re-apply status effects to aliens
  currentCombat.aliens.forEach(a => {
    const card = getCombatantCard(a.id, true);
    if (!card) return;
    
    // Apply burning status
    if (a._burnQueue && a._burnQueue.length > 0) {
      if (typeof applyStatusAnimation === 'function') {
        applyStatusAnimation(card, 'burning', true);
      }
    }
    
    // Apply poisoned status
    if (a._poisonQueue && a._poisonQueue.length > 0) {
      if (typeof applyStatusAnimation === 'function') {
        applyStatusAnimation(card, 'poisoned', true);
      }
    }
    
    // Apply stunned status
    if (a._stunned && a._stunned > 0) {
      if (typeof applyStatusAnimation === 'function') {
        applyStatusAnimation(card, 'stunned', true);
      }
    }
  });
}

// 0.9.0 - Render combat action buttons based on active survivor's weapon
function renderAdaptiveActions(survivor) {
  const actionsDiv = document.querySelector('.combat-actions');
  if (!actionsDiv || !survivor) return;

  // Stunned survivors can only Aim or Guard
  if (survivor._stunned && survivor._stunned > 0) {
    actionsDiv.innerHTML = `
      <div style="color: var(--danger); text-align: center; margin-bottom: 8px;">Stunned! Only Aim and Guard are available.</div>
      <div>
        <button id="btnActionAim" class="" title="Take careful aim (+${Math.round(BALANCE.COMBAT_ACTIONS.Aim.accuracyBonus * 100)}% hit chance next shot)." onclick="playerAim()">Aim</button>
        <button id="btnActionGuard" class="" title="Brace for impact (+${BALANCE.COMBAT_ACTIONS.Guard.defenseBonus} defense this turn)." onclick="playerGuard()">Guard</button>
        <button id="btnActionAuto" class="" style="margin-left:auto;" title="Let the AI handle combat automatically." onclick="autoResolveCombat()">Auto-Resolve</button>
      </div>
    `;
    return;
  }
  
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
        : `Powerful melee strike with +${BALANCE.COMBAT_ACTIONS.PowerAttack.dmgBonus} bonus damage. (${BALANCE.COMBAT_ACTIONS.PowerAttack.cooldown} turn cooldown)`,
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
    // 1.0 Phase 3.2 - Disable all buttons during enemy turn or animations
    const isEnemyTurnActive = currentCombat && currentCombat._enemyTurnActive;
    const isAnimating = typeof window.isAnimating === 'function' && window.isAnimating();
    const disabledDuringEnemyTurn = isEnemyTurnActive || isAnimating;
    
    const disabledAttr = (a.disabled || disabledDuringEnemyTurn) ? ' disabled' : '';
    const disabledClass = (a.disabled || disabledDuringEnemyTurn) ? ' disabled-btn' : '';
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

  // Add combat drug bonus to multiplier
  if (s._combatDrugBonus && s._combatDrugBonus > 0) {
    damageMultiplier += s._combatDrugBonus;
  }
  
  damage *= damageMultiplier;
  
  // Add flat consumable damage bonuses after multiplication
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
  // 1.0 Phase 3.2 - Process queued animations before advancing turn, no artificial delay
  if (typeof processAnimationQueue === 'function') {
    processAnimationQueue(() => {
      advanceToNextSurvivorImmediate();
    });
  } else {
    advanceToNextSurvivorImmediate();
  }
}

function advanceToNextSurvivorImmediate() {
  const party = currentCombat.partyIds.map(id => state.survivors.find(s => s.id === id)).filter(Boolean);
  const prevSurvivor = party[currentCombat.activePartyIdx];

  // Decrement stun after survivor's turn
  if (prevSurvivor && prevSurvivor._stunned && prevSurvivor._stunned > 0) {
    prevSurvivor._stunned--;
    if (prevSurvivor._stunned <= 0) {
      delete prevSurvivor._stunned;
      logCombat(`${prevSurvivor.name} is no longer stunned.`);
    }
  }
  
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
      
      // 1.0 Phase 3.2 - Set enemy turn flag BEFORE rendering UI to prevent button re-enable
      currentCombat._enemyTurnActive = true;
      
      renderCombatUI(); // Update UI before turret phase
      
      // Log turn transition BEFORE enemy phase starts
      logCombat('— Enemy Turn —');
      
      // 1.0 Phase 3.2 - FIX: Process animation queue before starting turret/enemy phase
      // This prevents turn from ending prematurely if last survivor's action is still animating
      if (typeof processAnimationQueue === 'function') {
        processAnimationQueue(() => {
          turretPhase();
          enemyTurn();
        });
      } else {
        turretPhase();
        enemyTurn();
      }
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
    // Decide action: aim if not aimed (35%), else shoot
    if (!tState.aimed && Math.random() < 0.35) {
      tState.aimed = true;
      logCombat(`Auto-Turret #${i + 1} acquiring target...`);
      continue;
    }
    turretAttack(i, 'shoot', tState);
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
      
      // 1.0 Phase 3.2 - Queue turret miss animation
      renderCombatUI();
      if (typeof queueAnimation === 'function') {
        queueAnimation(() => {
          const targetCard = getCombatantCard(target.id, true);
          if (typeof showStatusEffect === 'function') {
            showStatusEffect(targetCard, 'MISS!', 'var(--muted)');
          }
        }, 400);
      }
      continue;
    }
    
    // Check alien special defenses
    if (target.special === 'dodge' && Math.random() < 0.25) {
      logCombat(`${target.name} evades auto-turret fire!`);
      
      // 1.0 Phase 3.2 - Queue turret dodge animation
      renderCombatUI();
      if (typeof queueAnimation === 'function') {
        queueAnimation(() => {
          const targetCard = getCombatantCard(target.id, true);
          if (typeof animateDodge === 'function') {
            animateDodge(targetCard);
          }
          if (typeof showStatusEffect === 'function') {
            showStatusEffect(targetCard, 'DODGE!', 'var(--accent)');
          }
        }, 500);
      }
      continue;
    }
    if (target.special === 'phase' && Math.random() < 0.40) {
      logCombat(`${target.name} phases through turret fire!`);
      
      // 1.0 Phase 3.2 - Queue turret phase animation
      renderCombatUI();
      if (typeof queueAnimation === 'function') {
        queueAnimation(() => {
          const targetCard = getCombatantCard(target.id, true);
          if (typeof animateDodge === 'function') {
            animateDodge(targetCard);
          }
          if (typeof showStatusEffect === 'function') {
            showStatusEffect(targetCard, '👻 PHASE', 'var(--accent)');
          }
        }, 600);
      }
      continue;
    }
    
    let dmg = BALANCE.TURRET_BASE_DAMAGE;
    if (action === 'burst') {
      dmg += BALANCE.COMBAT_ACTIONS.Burst.dmgBonus;
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
    
    const pendingDamage = dealt;
    logCombat(`Auto-Turret #${idx + 1} hits ${target.name} for ${dealt}.`);
    
    // 1.0 Phase 3.2 - Queue turret damage animation, apply damage INSIDE (NO initial renderCombatUI to prevent cheat window)
    if (typeof queueAnimation === 'function') {
      queueAnimation(() => {
        // Apply damage during animation
        target.hp -= pendingDamage;
        
        // Update UI with new HP FIRST
        renderCombatUI();
        
        // THEN get fresh card and animate
        const targetCard = getCombatantCard(target.id, true);
        if (typeof animateDamage === 'function') {
          animateDamage(targetCard, false);
        }
        if (typeof showStatusEffect === 'function') {
          showStatusEffect(targetCard, `-${pendingDamage}`, '#ff6b6b');
        }
      }, 500);
    } else {
      // Fallback
      target.hp -= pendingDamage;
      renderCombatUI();
    }
    
    if (target.hp - pendingDamage <= 0) {
      logCombat(`${target.name} neutralized by automated fire.`);
      state.alienKills = (state.alienKills || 0) + 1;
      
      // 1.0 Phase 3.2 - Queue death animation before switching target
      if (typeof queueAnimation === 'function') {
        queueAnimation(() => {
          const targetCard = getCombatantCard(target.id, true);
          if (typeof animateDeath === 'function') {
            animateDeath(targetCard);
          }
          
          // Auto-select next available target AFTER death animation
          const nextTarget = currentCombat.aliens.find(a => a.hp > 0);
          if (nextTarget) {
            currentCombat.selectedTargetId = nextTarget.id;
          } else {
            currentCombat.selectedTargetId = null;
          }
          renderCombatUI();
        }, 600);
      } else {
        // Fallback if no animation queue
        const nextTarget = currentCombat.aliens.find(a => a.hp > 0);
        if (nextTarget) {
          currentCombat.selectedTargetId = nextTarget.id;
        } else {
          currentCombat.selectedTargetId = null;
        }
        renderCombatUI();
      }
    }
  }
}

function playerShoot(action = 'shoot', burstShots = null) {
  if (!currentCombat) return;
  const s = getActiveSurvivor();
  if (!s || s.hp <= 0) return;

  if (s._stunned && s._stunned > 0) {
    logCombat(`${s.name} is stunned and cannot attack!`, true);
    return;
  }
  
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
      
      // 1.0 Phase 3.2 - Queue power attack animation ONCE before the damage loop
      if (typeof queueAnimation === 'function' && typeof animatePowerAttack === 'function') {
        queueAnimation(() => {
          const attackerCard = getCombatantCard(s.id, false);
          animatePowerAttack(attackerCard);
        }, 700); // Match the delay used for power attack
      }
    } else {
      logCombat(`${s.name} opens fire with a burst attack!`);
    }
  }
  
  // 1.0 Phase 3.2 - Track if we've queued a killing blow (HP updates are async in animations)
  let killingBlowQueued = false;
  let totalPendingDamage = 0; // Track cumulative damage across all shots
  
  for (let i = 0; i < shots; i++) {
    // Check both actual HP and if we've already queued a killing blow
    if (target.hp <= 0 || killingBlowQueued) {
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
        
        // 1.0 Phase 3.2 - Show out of ammo animation
        renderCombatUI();
        if (typeof queueAnimation === 'function' && typeof showStatusEffect === 'function') {
          queueAnimation(() => {
            const attackerCard = getCombatantCard(s.id, false);
            showStatusEffect(attackerCard, '⚠️ OUT OF AMMO', 'var(--danger)');
          }, 400);
        }
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
        
        // 1.0 Phase 3.2 - Render UI first
        renderCombatUI();
        
        // Queue attack animation THEN dodge reaction
        if (typeof queueAnimation === 'function') {
          const weaponType = s.equipment?.weapon?.weaponType || 'unarmed';
          
          // Skip animation for melee power attacks (already animated)
          if (!(action === 'burst' && weaponType === 'melee')) {
            queueAnimation(() => {
              const attackerCard = getCombatantCard(s.id, false);
              if (typeof animateShoot === 'function') {
                animateShoot(attackerCard, weaponType, false);
              }
            }, weaponType === 'melee' ? 500 : 400);
          }
          
          queueAnimation(() => {
            const targetCard = getCombatantCard(target.id, true);
            if (typeof animateDodge === 'function') {
              animateDodge(targetCard);
            }
            if (typeof showStatusEffect === 'function') {
              showStatusEffect(targetCard, 'DODGE!', 'var(--accent)');
            }
          }, 500);
        }
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
        
        // 1.0 Phase 3.2 - Render UI first
        renderCombatUI();
        
        // Queue attack animation THEN phase reaction
        if (typeof queueAnimation === 'function') {
          const weaponType = s.equipment?.weapon?.weaponType || 'unarmed';
          
          // Skip animation for melee power attacks (already animated)
          if (!(action === 'burst' && weaponType === 'melee')) {
            queueAnimation(() => {
              const attackerCard = getCombatantCard(s.id, false);
              if (typeof animateShoot === 'function') {
                animateShoot(attackerCard, weaponType, false);
              }
            }, weaponType === 'melee' ? 500 : 400);
          }
          
          queueAnimation(() => {
            const targetCard = getCombatantCard(target.id, true);
            if (typeof animateDodge === 'function') {
              animateDodge(targetCard);
            }
            if (typeof showStatusEffect === 'function') {
              showStatusEffect(targetCard, '👻 PHASE', 'var(--accent)');
            }
            if (typeof applyStatusAnimation === 'function') {
              applyStatusAnimation(targetCard, 'phased', true);
              setTimeout(() => applyStatusAnimation(targetCard, 'phased', false), 2000);
            }
          }, 600);
        }
        
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
        dmg += BALANCE.COMBAT_ACTIONS.PowerAttack.dmgBonus;
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
      let armorPierced = false;
      if (s._currentArmorPierce) {
        const piercePercent = s._currentArmorPierce / 100; // Convert to decimal
        alienArmor = Math.floor(alienArmor * (1 - piercePercent));
        logCombat(`🎯 Armor piercing! (${alienArmor} effective armor after ${s._currentArmorPierce}% reduction)`, true);
        armorPierced = true;
        
        // 1.0 Phase 3.2 - Queue armor pierce visual
        if (typeof queueAnimation === 'function') {
          queueAnimation(() => {
            const targetCard = getCombatantCard(target.id, true);
            if (targetCard && typeof showStatusEffect === 'function') {
              showStatusEffect(targetCard, '🎯 PIERCE!', '#ffd700');
            }
          }, 300);
        }
        
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
      if (dealt < dmg) {
          logCombat(`${target.name} blocked ${dmg - dealt} damage.`);
      }
      
      // 1.0 Phase 3.2 - Don't apply damage yet, store it for animation
      const pendingDamage = dealt;
      totalPendingDamage += dealt; // Add to cumulative damage
      const targetWillDie = (target.hp - totalPendingDamage) <= 0; // Check against cumulative damage
      
      logCombat(`${s.name} hits ${target.name} for ${dealt} damage.` + (overkill > 0 ? ` (${overkill} overkill)` : ``), true);
      
      // 1.0 Phase 3.2 - Queue individual shot animations for burst (NO initial renderCombatUI to prevent cheat window)
      if (typeof queueAnimation === 'function') {
  const wasCrit = dmg > computeSurvivorDamage(s) * 1.3;
  const damageText = wasCrit ? `💢 ${dealt}` : `-${dealt}`; // 💢 for crits
  const damageColor = wasCrit ? '#ffd700' : '#ff6b6b'; // Gold for crits
        
        // For burst fire, queue a muzzle flash for THIS shot
        if (action === 'burst' && weaponType !== 'melee') {
          queueAnimation(() => {
            const attackerCard = getCombatantCard(s.id, false);
            if (typeof animateShoot === 'function') {
              animateShoot(attackerCard, weaponType, false); // Single flash per shot
            }
          }, 300);
        }
        // For regular attacks (not burst, or already animated power attack)
        else if (action !== 'burst') {
          queueAnimation(() => {
            const attackerCard = getCombatantCard(s.id, false);
            if (typeof animateShoot === 'function') {
              animateShoot(attackerCard, weaponType, false);
            }
          }, weaponType === 'melee' ? 500 : 400);
        }
        
        // 1.0 Phase 3.2 - Apply damage INSIDE damage animation, then update UI
        queueAnimation(() => {
          // Apply damage NOW
          target.hp -= pendingDamage;
          
          // Apply weapon effects after HP is reduced
          if (weapon && weapon.effects && weapon.effects.length > 0 && target.hp > 0) {
            applyWeaponEffectsInteractive(weapon, target, s, pendingDamage);
          }
          
          // Update UI with new HP FIRST
          renderCombatUI();
          
          // THEN get card from fresh DOM and animate
          const targetCard = getCombatantCard(target.id, true);
          if (typeof animateDamage === 'function') {
            animateDamage(targetCard, wasCrit);
          }
          if (typeof showStatusEffect === 'function') {
            showStatusEffect(targetCard, damageText, damageColor);
          }
        }, 400);
      } else {
        // Fallback if no animations
        target.hp -= pendingDamage;
        if (weapon && weapon.effects && weapon.effects.length > 0 && target.hp > 0) {
          applyWeaponEffectsInteractive(weapon, target, s, pendingDamage);
        }
        renderCombatUI();
      }
      
      if (targetWillDie) {
        logCombat(`${target.name} eliminated!`, true);
        state.alienKills = (state.alienKills || 0) + 1;
        state.threat += BALANCE.THREAT_GAIN_PER_ALIEN_KILL || 0;
        
        // 0.9.0 - Morale gain for killing alien
        s.morale = Math.min(100, (s.morale || 0) + BALANCE.MORALE_GAIN_ALIEN_KILL);
        
        // 1.0 Phase 3.2 - Queue death animation (UI already updated above)
        if (typeof queueAnimation === 'function' && typeof animateDeath === 'function') {
          queueAnimation(() => {
            const targetCard = getCombatantCard(target.id, true);
            animateDeath(targetCard);
          }, 800);
        }
        
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
        let qualityBonus = 0;
        // Bonus for alien rarity
        switch (target.rarity) {
          case 'uncommon': qualityBonus += 0.10; break;
          case 'rare': qualityBonus += 0.15; break;
          case 'veryrare': qualityBonus += 0.30; break;
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
                logCombat(`${s.name}'s Lucky Find triggered: ${bonusMessage}!`, true);
            }
            // Golden Nose - double loot rolls
            if (hasAbility(s, 'goldnose')) {
                const extraLoot = pickLoot(qualityBonus);
                const extraMessage = extraLoot.onPickup(state);
                logCombat(`${s.name}'s Golden Nose finds exceptional loot: ${extraMessage}!`, true);
            }
        }
        
        // 0.8.0 - Scientist Xenobiologist: tech on alien kill
        if (hasAbility(s, 'xenobiologist')) {
          state.resources.tech += 1;
          appendLog(`${s.name} extracts alien tech.`);
        }
        
        // 1.0 Phase 3.2 - Set flag so burst loop stops immediately (HP update is async)
        killingBlowQueued = true;
        break; // Stop burst fire on this target
      }
    } else {
      logCombat(`${s.name} missed.`, true);
      
      // 1.0 Phase 3.2 - Render UI first
      renderCombatUI();
      
      // Queue attack animation THEN miss reaction
      if (typeof queueAnimation === 'function') {
        const weaponType = s.equipment?.weapon?.weaponType || 'unarmed';
        
        queueAnimation(() => {
          const attackerCard = getCombatantCard(s.id, false);
          if (typeof animateShoot === 'function') {
            animateShoot(attackerCard, weaponType, false);
          }
        }, weaponType === 'melee' ? 500 : 400);
        
        queueAnimation(() => {
          const targetCard = getCombatantCard(target.id, true);
          if (typeof animateMiss === 'function') {
            animateMiss(null, targetCard);
          }
          if (typeof showStatusEffect === 'function') {
            showStatusEffect(targetCard, 'MISS!', 'var(--muted)');
          }
        }, 400);
      }
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
  const aimBonus = Math.round((BALANCE.COMBAT_ACTIONS.Aim.accuracyBonus || 0.25) * 100);
  logCombat(`🎯 ${s.name} takes careful aim (+${aimBonus}% hit chance next shot)!`, true);
  
  // 1.0 Phase 3.2 - Show aim animation with status effect
  renderCombatUI();
  if (typeof queueAnimation === 'function' && typeof animateAim === 'function') {
    queueAnimation(() => {
      const card = getCombatantCard(s.id, false);
      animateAim(card);
      if (typeof showStatusEffect === 'function') {
        showStatusEffect(card, `🎯 AIM +${aimBonus}%`, 'var(--accent)');
      }
    }, 600);
  }
  
  advanceToNextSurvivor();
}

function playerGuard() {
  if (!currentCombat) return;
  const s = getActiveSurvivor();
  if (!s) return;
  currentCombat.guarding[s.id] = true;
  const guardBonus = BALANCE.COMBAT_ACTIONS.Guard.defenseBonus || 3;
  logCombat(`🛡️ ${s.name} braces for impact (+${guardBonus} defense this turn)!`, true);
  
  // 1.0 Phase 3.2 - Show guard animation with status effect
  renderCombatUI();
  if (typeof queueAnimation === 'function') {
    queueAnimation(() => {
      const card = getCombatantCard(s.id, false);
      if (typeof animateGuard === 'function') {
        animateGuard(card);
      }
      if (typeof showStatusEffect === 'function') {
        showStatusEffect(card, `🛡️ GUARD +${guardBonus}`, 'var(--accent)');
      }
    }, 600);
  }
  
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
  panel.className = 'modal-card';
  panel.style.maxWidth = '600px';
  
  let html = '<div class="modal-header"><strong>Use Consumable</strong><button id="closeConsumableSelectorBtn" class="danger">✕</button></div>';
  html += '<div id="consumableModalContent">';
  
  html += '<div style="display:flex;flex-direction:column;gap:12px;">';
  html += `<div class="small">Select a consumable for ${s.name} to use.</div>`;
  html += '<div class="scrollable-panel" style="max-height:300px;overflow-y:auto;">';

  consumables.forEach(({ item, count }) => {
    const key = item.subtype || item.type;
    const effect = BALANCE.CONSUMABLE_EFFECTS[key];
    const desc = effect ? effect.desc : 'Unknown effect';
    const color = item.rarity ? (RARITY_COLORS[item.rarity] || '#ffffff') : '#ffffff';
    const tooltip = getItemTooltip(item);
    
    html += `
        <div class="inv-row">
            <div>
                <span style="color:${color}" title="${tooltip}">${item.name} x${count}</span>
                <div class="small">${desc}</div>
            </div>
            <button data-key="${key}" class="use-consumable-combat">Use</button>
        </div>
    `;
  });

  html += '</div></div></div>';
  
  panel.innerHTML = html;
  overlay.appendChild(panel);
  document.body.appendChild(overlay);

  // Bind events
  panel.querySelector('#closeConsumableSelectorBtn').onclick = closeConsumableSelector;
  panel.querySelectorAll('button.use-consumable-combat').forEach(b => {
      b.onclick = () => {
          useConsumableFromSelector(b.dataset.key);
      };
  });
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

  if (s._stunned && s._stunned > 0) {
    logCombat(`${s.name} is stunned and cannot use items!`, true);
    return;
  }
  
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
  
  // Apply consumable effect based on type (each type has its own animation)
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
    
    // 1.0 Phase 3.4 - FIX: Use a simple timeout for self-use items, not the full queue.
    // The animation queue is for multi-step sequences (e.g., throw, then hit).
    // For a simple self-use glow, a single delayed render is more reliable.
    if (typeof animateConsumable === 'function') {
      const userCard = getCombatantCard(s.id, false);
      animateConsumable(userCard, 'heal');
      showStatusEffect(userCard, `+${heal}`, '#4ade80');
      
      setTimeout(() => {
        renderCombatUI();
        advanceToNextSurvivor();
      }, 1200); // Match animation duration
    } else {
      renderCombatUI();
      advanceToNextSurvivor();
    }
    
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
    
    // 1.0 Phase 3.4 - FIX: Use a simple timeout for self-use items
    if (typeof animateConsumable === 'function') {
      const userCard = getCombatantCard(s.id, false);
      animateConsumable(userCard, 'stimpack');
      showStatusEffect(userCard, '💉 STIMPACK!', '#10b981');
      
      setTimeout(() => {
        renderCombatUI();
        advanceToNextSurvivor();
      }, 1200);
    } else {
      renderCombatUI();
      advanceToNextSurvivor();
    }
    effectApplied = true;
  }
  
  // REPAIR KIT - Restore equipment durability
  if (effect.durabilityRestore) {
    const weapon = s.equipment && s.equipment.weapon;
    const armor = s.equipment && s.equipment.armor;
    
    if (weapon && weapon.durability < weapon.maxDurability) {
      weapon.durability = Math.min(weapon.maxDurability, weapon.durability + effect.durabilityRestore);
      logCombat(`${s.name} repairs ${weapon.name} (+${effect.durabilityRestore} durability).`, true);
      
      // 1.0 Phase 3.4 - FIX: Use a simple timeout for self-use items
      if (typeof animateConsumable === 'function') {
        const userCard = getCombatantCard(s.id, false);
        animateConsumable(userCard, 'repair');
        showStatusEffect(userCard, '🔧 REPAIRED!', 'var(--accent)');
        
        setTimeout(() => {
          renderCombatUI();
          advanceToNextSurvivor();
        }, 1200);
      } else {
        renderCombatUI();
        advanceToNextSurvivor();
      }
      effectApplied = true;
    } else if (armor && armor.durability < armor.maxDurability) {
      armor.durability = Math.min(armor.maxDurability, armor.durability + effect.durabilityRestore);
      logCombat(`${s.name} repairs ${armor.name} (+${effect.durabilityRestore} durability).`, true);
      
      // 1.0 Phase 3.4 - FIX: Use a simple timeout for self-use items
      if (typeof animateConsumable === 'function') {
        const userCard = getCombatantCard(s.id, false);
        animateConsumable(userCard, 'repair');
        showStatusEffect(userCard, '🔧 REPAIRED!', 'var(--accent)');
        
        setTimeout(() => {
          renderCombatUI();
          advanceToNextSurvivor();
        }, 1200);
      } else {
        renderCombatUI();
        advanceToNextSurvivor();
      }
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
    logCombat(`${s.name} uses ${item.name}! +${Math.round(effect.damageBonus * 100)}% damage for ${effect.duration} turns (-${maxHpLoss} max HP).`, true);
    
    // 1.0 Phase 3.4 - FIX: Use a simple timeout for self-use items
    if (typeof animateConsumable === 'function') {
      const userCard = getCombatantCard(s.id, false);
      animateConsumable(userCard, 'drug');
      showStatusEffect(userCard, '💊 OVERDRIVE!', '#ff8c00');
      
      setTimeout(() => {
        renderCombatUI();
        advanceToNextSurvivor();
      }, 1200);
    } else {
      renderCombatUI();
      advanceToNextSurvivor();
    }
    effectApplied = true;
  }
  
  // STUN GRENADE - Stun selected target
  if (effect.stunChance) {
    const aliens = currentCombat.aliens.filter(a => a.hp > 0 && !a.downed);
    if (aliens.length === 0) {
      logCombat('No enemies to target.', true);
      return;
    }
    
    // 1.0 Phase 3.2 FIX: Use player's selected target instead of random
    let target = aliens.find(a => a.id === currentCombat.selectedTargetId);
    if (!target || target.hp <= 0 || target.downed) {
      target = aliens[0]; // Fallback to first alive enemy
    }
    
    const stunSuccess = Math.random() < effect.stunChance;
    
    if (stunSuccess) {
      target._stunned = effect.duration || 2;
      logCombat(`${s.name} throws ${item.name} at ${target.name}! Stunned for ${target._stunned} turns!`, true);
    } else {
      logCombat(`${s.name} throws ${item.name}, but ${target.name} resists!`, true);
    }
    
    // 1.0 Phase 3.2 - Always show throw animations (even on resist)
    // FIX: Don't call renderCombatUI() before animations - it destroys the DOM elements we're about to animate!
    if (typeof queueAnimation === 'function') {
      queueAnimation(() => {
        const userCard = getCombatantCard(s.id, false);
        if (typeof animateConsumable === 'function') {
          animateConsumable(userCard, 'stun'); // Rainbow glow for stun grenade
        }
      }, 400);
      
      queueAnimation(() => {
        const userCard = getCombatantCard(s.id, false);
        if (typeof animateThrow === 'function') {
          animateThrow(userCard); // Throw animation
        }
      }, 500);
      
      // Only apply stun effect if it succeeded
      if (stunSuccess) {
        queueAnimation(() => {
          const targetCard = getCombatantCard(target.id, true);
          if (typeof applyStatusAnimation === 'function') {
            applyStatusAnimation(targetCard, 'stunned', true);
            setTimeout(() => applyStatusAnimation(targetCard, 'stunned', false), 1800);
          }
          if (typeof showStatusEffect === 'function') {
            showStatusEffect(targetCard, '⚡ STUNNED!', 'var(--danger)');
          }
        }, 700);
      } else {
        // Show resist message
        queueAnimation(() => {
          const targetCard = getCombatantCard(target.id, true);
          if (typeof showStatusEffect === 'function') {
            showStatusEffect(targetCard, '🛡️ RESISTED', '#808080');
          }
        }, 700);
      }
      
      // Render UI AFTER all animations queued
      queueAnimation(() => {
        renderCombatUI();
      }, 1500); // Extended to 1500ms to ensure all animations complete
      
      // After queue is done, advance turn
      processAnimationQueue(() => {
        advanceToNextSurvivor();
      });
    } else {
      renderCombatUI();
      advanceToNextSurvivor();
    }
    effectApplied = true;
  }
  
  // NANITE INJECTOR - Permanent HP boost
  if (effect.permanentHP) {
    s.maxHp += effect.permanentHP;
    s.hp += effect.permanentHP;
    logCombat(`${s.name} uses ${item.name}! Max HP permanently increased by ${effect.permanentHP}!`, true);
    
    // 1.0 Phase 3.4 - FIX: Use a simple timeout for self-use items
    if (typeof animateConsumable === 'function') {
      const userCard = getCombatantCard(s.id, false);
      animateConsumable(userCard, 'nanite');
      animateHeal(userCard);
      showStatusEffect(userCard, `+${effect.permanentHP} MAX HP`, '#10b981');
      
      setTimeout(() => {
        renderCombatUI();
        advanceToNextSurvivor();
      }, 1200);
    } else {
      renderCombatUI();
      advanceToNextSurvivor();
    }
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
    
    // 1.0 Phase 3.2 - Queue revival kit animation (bright cyan glow)
    // FIX: Don't call renderCombatUI() before animations!
    if (typeof queueAnimation === 'function') {
      queueAnimation(() => {
        const userCard = getCombatantCard(s.id, false);
        if (typeof animateConsumable === 'function') {
          animateConsumable(userCard, 'revival'); // Bright cyan glow
        }
      }, 400);
      
      queueAnimation(() => {
        const targetCard = getCombatantCard(target.id, false);
        if (typeof animateRevive === 'function') {
          animateRevive(targetCard);
        }
        if (typeof showStatusEffect === 'function') {
          showStatusEffect(targetCard, `⚡ REVIVED +${reviveHP}`, '#06b6d4');
        }
      }, 600);
      
      queueAnimation(() => {
        renderCombatUI();
      }, 800);
      
      // After queue is done, advance turn
      processAnimationQueue(() => {
        advanceToNextSurvivor();
      });
    } else {
      renderCombatUI();
      advanceToNextSurvivor();
    }
    
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
    
    // 1.0 Phase 3.2 - Queue system override animation (red/electric glow)
    // FIX: Don't call renderCombatUI() before animations!
    if (typeof queueAnimation === 'function') {
      queueAnimation(() => {
        const userCard = getCombatantCard(s.id, false);
        if (typeof animateConsumable === 'function') {
          animateConsumable(userCard, 'override'); // Red electric glow
        }
      }, 400);
      
      queueAnimation(() => {
        const targetCard = getCombatantCard(target.id, true);
        if (typeof showStatusEffect === 'function') {
          showStatusEffect(targetCard, '⚡ OVERLOAD!', '#ef4444');
        }
        if (typeof animateDeath === 'function') {
          animateDeath(targetCard);
        }
      }, 600);
      
      queueAnimation(() => {
        renderCombatUI();
      }, 800);
      
      // After queue is done, advance turn
      processAnimationQueue(() => {
        advanceToNextSurvivor();
      });
    } else {
      renderCombatUI();
      advanceToNextSurvivor();
    }
    effectApplied = true;
  }
  
  // STEALTH FIELD - Dodge next attack
  if (effect.dodgeNext) {
    s._stealthField = true;
    logCombat(`${s.name} activates ${item.name}! Next attack will be dodged.`, true);
    
    // 1.0 Phase 3.4 - FIX: Use a simple timeout for self-use items
    if (typeof animateConsumable === 'function') {
      const userCard = getCombatantCard(s.id, false);
      animateConsumable(userCard, 'stealth');
      showStatusEffect(userCard, '🌫️ STEALTH!', '#9c27b0');
      
      setTimeout(() => {
        renderCombatUI();
        advanceToNextSurvivor();
      }, 1200);
    } else {
      renderCombatUI();
      advanceToNextSurvivor();
    }
    effectApplied = true;
  }
  
  // Consume the item if effect was applied
  if (effectApplied) {
    state.inventory.splice(idx, 1);
    // For items using the new simple timeout, we must NOT advance the turn here.
    // For items using the animation queue, this call is necessary.
    // The logic inside each item block now handles when to advance the turn.
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

  if (s._stunned && s._stunned > 0) {
    logCombat(`${s.name} is stunned and cannot perform actions!`, true);
    return;
  }
  
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
  
  // 1.0 Phase 3.2 - Queue revive animation with green healing number
  if (typeof queueAnimation === 'function' && typeof animateRevive === 'function') {
    queueAnimation(() => {
      const targetCard = getCombatantCard(target.id, false);
      animateRevive(targetCard);
      if (typeof showStatusEffect === 'function') {
        showStatusEffect(targetCard, `+${reviveHP}`, '#4ade80'); // Green healing number
      }
      renderCombatUI();
    }, 1000);
  } else {
    renderCombatUI();
  }
  
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
  
  if (s._stunned && s._stunned > 0) {
    logCombat(`${s.name} is stunned and cannot retreat!`, true);
    return;
  }

  // 0.9.0 - Use centralized retreat calculation
  const { total: retreatChance } = calculateRetreatChance(s);
  
  const success = Math.random() < retreatChance;
  
  if (success) {
    logCombat(`${s.name} successfully retreats!`, true);
    
    // 1.0 Phase 3.2 - Queue retreat animation
    renderCombatUI();
    if (typeof queueAnimation === 'function') {
      queueAnimation(() => {
        const survivorCard = getCombatantCard(s.id, false);
        if (typeof showStatusEffect === 'function') {
          showStatusEffect(survivorCard, '🏃 RETREAT!', 'var(--muted)');
        }
        if (typeof animateDodge === 'function') {
          animateDodge(survivorCard); // Use dodge animation for fleeing
        }
      }, 600);
    }
    
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
        
        // 1.0 - Sync hostile survivor HP back to tile after retreat (same as defeat)
        if (state.tiles[currentCombat.idx].hostileSurvivors && currentCombat.aliens) {
          console.log('Syncing HP after retreat. Aliens in combat:', currentCombat.aliens.map(a => ({ id: a.id, name: a.name, type: a.type, hp: a.hp })));
          console.log('Hostiles on tile before sync:', state.tiles[currentCombat.idx].hostileSurvivors.map(h => ({ id: h.id, name: h.name, hp: h.hp })));
          
          currentCombat.aliens.forEach(alien => {
            if (alien.type === 'hostile_human') {
              const hostile = state.tiles[currentCombat.idx].hostileSurvivors.find(h => h.id === alien.id);
              if (hostile) {
                console.log(`Syncing ${hostile.name}: ${hostile.hp} → ${alien.hp}`);
                hostile.hp = alien.hp;
                hostile.maxHp = alien.maxHp;
              }
            }
          });
          
          console.log('Hostiles on tile after sync:', state.tiles[currentCombat.idx].hostileSurvivors.map(h => ({ id: h.id, name: h.name, hp: h.hp })));
          
          // Remove dead hostiles from tile
          state.tiles[currentCombat.idx].hostileSurvivors = state.tiles[currentCombat.idx].hostileSurvivors.filter(h => h.hp > 0);
          
          console.log('Hostiles on tile after filtering dead:', state.tiles[currentCombat.idx].hostileSurvivors.map(h => ({ id: h.id, name: h.name, hp: h.hp })));
        }
      }
      
      // Clear retreated flags before closing
      party.forEach(p => {
        if (p._retreated) delete p._retreated;
        if (p._retreating) delete p._retreating;
      });
      
      // Handle mission retreat callback (support context as object or string)
      if (currentCombat.context && (currentCombat.context === 'mission' || currentCombat.context.type === 'mission')) {
        if (typeof currentCombat.context.onRetreat === 'function') {
          currentCombat.context.onRetreat();
        }
      }
      
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
  
  // 1.0 Phase 3.2 - Brief 200ms delay before enemy turn starts for visual clarity
  setTimeout(() => {
    renderCombatUI(); // Update UI to show enemy turn active
    
    const party = currentCombat.partyIds.map(id => state.survivors.find(s => s.id === id)).filter(Boolean);
    const aliveAliens = currentCombat.aliens.filter(a => a.hp > 0);
    // 0.9.0 - Filter out retreated survivors when checking alive party
    const aliveParty = party.filter(p => p.hp > 0 && !p._retreated);
    if (aliveAliens.length === 0) return endCombat(true);
    if (aliveParty.length === 0) return endCombat(false);
  
    enemyTurnContinue(party, aliveAliens, aliveParty);
  }, 200);
}

function enemyTurnContinue(party, aliveAliens, aliveParty) {
  // 0.9.0 - Clear temporary status effects and update consumable durations at start of enemy turn
  aliveParty.forEach(p => {
    p._toxicDebuff = false;
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

  // Clear hostile guard flags at start of enemy turn (guard lasted through the previous player turn)
  if (currentCombat && currentCombat.aliens) {
    for (const al of currentCombat.aliens) {
      if (al._guardActive) {
        delete al._guardActive;
        if (currentCombat && currentCombat.guarding) {
          delete currentCombat.guarding[al.id];
        }
      }
    }
  }
  
  // NOTE: Survivor armor regen and Miracle Worker heals are applied AFTER DOTs
  
  // Apply poison damage and decrement duration (queue-based)
  // Use indexed loop so we can stagger per-entity animations and avoid collisions
  for (let i = 0; i < aliveParty.length; i++) {
    const p = aliveParty[i];
    if (p._poisonQueue && p._poisonQueue.length > 0) {
      const poisonDmg = p._poisonQueue.length * 2; // 2 damage per stack
      // Apply via animation queue to ensure UI order
      if (typeof queueAnimation === 'function') {
        // Stagger each survivor's poison by 600ms per entity to avoid overlap
        queueAnimation(() => {
          p.hp = Math.max(0, p.hp - poisonDmg);
          logCombat(`${p.name} takes ${poisonDmg} poison damage (${p._poisonQueue.length} stacks).`);

          // Decrement each stack's duration and remove expired ones
          p._poisonQueue = p._poisonQueue.map(turns => turns - 1).filter(turns => turns > 0);
          p._poisonStacks = p._poisonQueue.length;
          if (p._poisonQueue.length === 0) {
            logCombat(`${p.name}'s poison wears off.`);
          }

          const survivorCard = getCombatantCard(p.id, false);
          // Add/refresh poisoned status animation
          if (survivorCard && typeof applyStatusAnimation === 'function') {
            applyStatusAnimation(survivorCard, 'poisoned', p._poisonQueue.length > 0);
          }

          renderCombatUI(); // Update UI after poison damage

          // Show poison damage animation
          const freshSurvivorCard = getCombatantCard(p.id, false);
          if (freshSurvivorCard && typeof animateDamage === 'function') {
            animateDamage(freshSurvivorCard, false);
          }
          if (freshSurvivorCard && typeof showStatusEffect === 'function') {
            showStatusEffect(freshSurvivorCard, `☠️ ${poisonDmg}`, '#9d4edd');
          }

          if (p.hp <= 0) {
            logCombat(`${p.name} succumbs to poison.`);
          }
          
          // Check if all aliens died from poison
          const remainingAliensAfterPoison = currentCombat.aliens.filter(a => a.hp > 0);
          if (remainingAliensAfterPoison.length === 0) {
            // Queue the victory immediately after this animation finishes
            queueAnimation(() => {
              endCombat(true);
            }, 100);
          }
        }, 600 * i); // 600ms per entity
      } else {
        p.hp = Math.max(0, p.hp - poisonDmg);
        logCombat(`${p.name} takes ${poisonDmg} poison damage (${p._poisonQueue.length} stacks).`);
        p._poisonQueue = p._poisonQueue.map(turns => turns - 1).filter(turns => turns > 0);
        p._poisonStacks = p._poisonQueue.length;
        if (p._poisonQueue.length === 0) logCombat(`${p.name}'s poison wears off.`);
        renderCombatUI();
        const survivorCard = getCombatantCard(p.id, false);
        if (survivorCard && typeof animateDamage === 'function') animateDamage(survivorCard, false);
        if (survivorCard && typeof showStatusEffect === 'function') showStatusEffect(survivorCard, `☠️ ${poisonDmg}`, '#9d4edd');
        if (p.hp <= 0) logCombat(`${p.name} succumbs to poison.`);
      }
    }
  }
  
  // Apply burn damage to survivors and decrement duration (queue-based)
  for (let i = 0; i < aliveParty.length; i++) {
    const p = aliveParty[i];
    if (p._burnQueue && p._burnQueue.length > 0) {
      const burnDmg = p._burnQueue.length * 2; // 2 damage per stack
      if (typeof queueAnimation === 'function') {
        // Stagger survivor burn by 600ms per entity to avoid overlap
        queueAnimation(() => {
          p.hp = Math.max(0, p.hp - burnDmg);
          logCombat(`🔥 ${p.name} takes ${burnDmg} burn damage (${p._burnQueue.length} stacks).`);

          // Decrement each stack's duration and remove expired ones
          p._burnQueue = p._burnQueue.map(turns => turns - 1).filter(turns => turns > 0);
          p._burnStacks = p._burnQueue.length;
          if (p._burnQueue.length === 0) {
            logCombat(`${p.name}'s burn extinguishes.`);
          }

          const survivorCard = getCombatantCard(p.id, false);
          // Add/refresh burning status animation
          if (survivorCard && typeof applyStatusAnimation === 'function') {
            applyStatusAnimation(survivorCard, 'burning', p._burnQueue.length > 0);
          }

          renderCombatUI(); // Update UI after burn damage

          // 1.0 Phase 3.2 - Show burn damage animation
          const freshSurvivorCard = getCombatantCard(p.id, false);
          if (freshSurvivorCard && typeof animateDamage === 'function') {
            animateDamage(freshSurvivorCard, false);
          }
          if (freshSurvivorCard && typeof showStatusEffect === 'function') {
            showStatusEffect(freshSurvivorCard, `🔥 ${burnDmg}`, '#ff6b6b');
          }

          if (p.hp <= 0) {
            logCombat(`${p.name} is consumed by flames.`);
          }
          
          // Check if all aliens died from burn
          const remainingAliensAfterBurn = currentCombat.aliens.filter(a => a.hp > 0);
          if (remainingAliensAfterBurn.length === 0) {
            // Queue the victory immediately after this animation finishes
            queueAnimation(() => {
              endCombat(true);
            }, 100);
          }
        }, 600 * i); // 600ms per entity
      } else {
        p.hp = Math.max(0, p.hp - burnDmg);
        logCombat(`🔥 ${p.name} takes ${burnDmg} burn damage (${p._burnQueue.length} stacks).`);
        p._burnQueue = p._burnQueue.map(turns => turns - 1).filter(turns => turns > 0);
        p._burnStacks = p._burnQueue.length;
        const survivorCard = getCombatantCard(p.id, false);
        if (survivorCard && typeof applyStatusAnimation === 'function') applyStatusAnimation(survivorCard, 'burning', p._burnQueue.length > 0);
        renderCombatUI();
        const freshSurvivorCard = getCombatantCard(p.id, false);
        if (freshSurvivorCard && typeof animateDamage === 'function') animateDamage(freshSurvivorCard, false);
        if (freshSurvivorCard && typeof showStatusEffect === 'function') showStatusEffect(freshSurvivorCard, `🔥 ${burnDmg}`, '#ff6b6b');
        if (p.hp <= 0) logCombat(`${p.name} is consumed by flames.`);
      }
    }
  }
  
  // Apply burn damage to aliens and decrement duration (queue-based)
  for (let i = 0; i < aliveAliens.length; i++) {
    const a = aliveAliens[i];
    if (a._burnQueue && a._burnQueue.length > 0) {
      const burnDmg = a._burnQueue.length * 2; // 2 damage per stack
      if (typeof queueAnimation === 'function') {
        // Stagger alien burn by 600ms per entity to avoid overlap
        queueAnimation(() => {
          a.hp = Math.max(0, a.hp - burnDmg);
          logCombat(`🔥 ${a.name} takes ${burnDmg} burn damage (${a._burnQueue.length} stacks).`);

          // Decrement each stack's duration and remove expired ones
          a._burnQueue = a._burnQueue.map(turns => turns - 1).filter(turns => turns > 0);
          a._burnStacks = a._burnQueue.length;

          const alienCard = getCombatantCard(a.id, true);
          // Add/refresh burning status animation
          if (alienCard && typeof applyStatusAnimation === 'function') {
            applyStatusAnimation(alienCard, 'burning', a._burnQueue.length > 0);
          }

          if (a._burnQueue.length === 0) {
            logCombat(`${a.name}'s burn extinguishes.`);
          }

          renderCombatUI(); // Update UI after burn damage

          // 1.0 Phase 3.2 - Show burn damage animation
          const freshAlienCard = getCombatantCard(a.id, true);
          if (freshAlienCard && typeof animateDamage === 'function') {
            animateDamage(freshAlienCard, false);
          }
          if (freshAlienCard && typeof showStatusEffect === 'function') {
            showStatusEffect(freshAlienCard, `🔥 ${burnDmg}`, '#ff6b6b');
          }

          if (a.hp <= 0) {
            a.downed = true;
            logCombat(`${a.name} is consumed by flames.`);
          }
          
          // Check if all aliens died from burn
          const remainingAliensAfterBurn = currentCombat.aliens.filter(al => al.hp > 0);
          if (remainingAliensAfterBurn.length === 0) {
            queueAnimation(() => {
              endCombat(true);
            }, 100);
          }
        }, 600 * i); // 600ms per entity
      } else {
        a.hp = Math.max(0, a.hp - burnDmg);
        logCombat(`🔥 ${a.name} takes ${burnDmg} burn damage (${a._burnQueue.length} stacks).`);
        a._burnQueue = a._burnQueue.map(turns => turns - 1).filter(turns => turns > 0);
        a._burnStacks = a._burnQueue.length;
        const alienCard = getCombatantCard(a.id, true);
        if (alienCard && typeof applyStatusAnimation === 'function') applyStatusAnimation(alienCard, 'burning', a._burnQueue.length > 0);
        if (a._burnQueue.length === 0) logCombat(`${a.name}'s burn extinguishes.`);
        renderCombatUI();
        const freshAlienCard = getCombatantCard(a.id, true);
        if (freshAlienCard && typeof animateDamage === 'function') animateDamage(freshAlienCard, false);
        if (freshAlienCard && typeof showStatusEffect === 'function') showStatusEffect(freshAlienCard, `🔥 ${burnDmg}`, '#ff6b6b');
        if (a.hp <= 0) { a.downed = true; logCombat(`${a.name} is consumed by flames.`); }
      }
    }
  }

  // Apply poison damage to aliens and decrement duration (queue-based)
  for (let i = 0; i < aliveAliens.length; i++) {
    const a = aliveAliens[i];
    if (a._poisonQueue && a._poisonQueue.length > 0) {
      const poisonDmg = a._poisonQueue.length * 2; // 2 damage per stack
      if (typeof queueAnimation === 'function') {
        // Stagger alien poison by 600ms per entity to avoid overlap
        queueAnimation(() => {
          a.hp = Math.max(0, a.hp - poisonDmg);
          logCombat(`☠️ ${a.name} takes ${poisonDmg} poison damage (${a._poisonQueue.length} stacks).`);

          // Decrement each stack's duration and remove expired ones
          a._poisonQueue = a._poisonQueue.map(turns => turns - 1).filter(turns => turns > 0);
          a._poisonStacks = a._poisonQueue.length;

          const alienCard = getCombatantCard(a.id, true);
          // Add/refresh poisoned status animation
          if (alienCard && typeof applyStatusAnimation === 'function') {
            applyStatusAnimation(alienCard, 'poisoned', a._poisonQueue.length > 0);
          }

          if (a._poisonQueue.length === 0) {
            logCombat(`${a.name}'s poison wears off.`);
          }

          renderCombatUI(); // Update UI after poison damage

          // Show poison damage animation
          const freshAlienCard = getCombatantCard(a.id, true);
          if (freshAlienCard && typeof animateDamage === 'function') {
            animateDamage(freshAlienCard, false);
          }
          if (freshAlienCard && typeof showStatusEffect === 'function') {
            showStatusEffect(freshAlienCard, `☠️ ${poisonDmg}`, '#9d4edd');
          }

          if (a.hp <= 0) {
            a.downed = true;
            logCombat(`${a.name} succumbs to poison.`);
          }
          
          // Check if all aliens died from poison
          const remainingAliensAfterPoison = currentCombat.aliens.filter(al => al.hp > 0);
          if (remainingAliensAfterPoison.length === 0) {
            queueAnimation(() => {
              endCombat(true);
            }, 100);
          }
        }, 600 * i); // 600ms per entity
      } else {
        a.hp = Math.max(0, a.hp - poisonDmg);
        logCombat(`☠️ ${a.name} takes ${poisonDmg} poison damage (${a._poisonQueue.length} stacks).`);

        // Decrement each stack's duration and remove expired ones
        a._poisonQueue = a._poisonQueue.map(turns => turns - 1).filter(turns => turns > 0);
        a._poisonStacks = a._poisonQueue.length;

        if (a._poisonQueue.length === 0) {
          logCombat(`${a.name}'s poison wears off.`);
        }

        renderCombatUI(); // Update UI after poison damage

        // Show poison damage animation
        const alienCard = getCombatantCard(a.id, true);
        if (alienCard && typeof animateDamage === 'function') {
          animateDamage(alienCard, false);
        }
        if (alienCard && typeof showStatusEffect === 'function') {
          showStatusEffect(alienCard, `☠️ ${poisonDmg}`, '#9d4edd');
        }

        if (a.hp <= 0) {
          a.downed = true;
          logCombat(`${a.name} succumbs to poison.`);
        }
      }
    }
  }
  
  // Check if all aliens died from burn/poison
  const remainingAliens = currentCombat.aliens.filter(a => a.hp > 0);
  if (remainingAliens.length === 0) {
    return endCombat(true);
  }

  // Insert a short visual pause to separate DOT popups from regen/heal popups
  if (typeof queueAnimation === 'function') {
    queueAnimation(() => {}, 200);
  }

  // 1.0 Phase 3.2 - Now apply survivor armor regen at start of turn (AFTER DOT)
  const regenQueue = [];
  aliveParty.forEach(p => {
    if (p.equipment?.armor) {
      const armorEffects = getArmorPassiveBonuses(p.equipment.armor);
      if (armorEffects.regenAmount > 0 && p.hp > 0 && p.hp < p.maxHp) {
        const healAmount = Math.min(p.maxHp - p.hp, armorEffects.regenAmount);
        regenQueue.push({ survivor: p, amount: healAmount });
      }
    }
  });
  
  if (regenQueue.length > 0 && typeof queueAnimation === 'function') {
    for (const {survivor, amount} of regenQueue) {
      queueAnimation(() => {
        survivor.hp = Math.min(survivor.maxHp, survivor.hp + amount);
        renderCombatUI();
        
        const survivorCard = getCombatantCard(survivor.id, false);
        if (survivorCard && typeof showStatusEffect === 'function') {
          showStatusEffect(survivorCard, `+${amount}`, '#4ade80'); // Green healing number
        }
        logCombat(`${survivor.name} regenerates ${amount} HP.`);
      }, 400);
    }
  }
  
  // 0.8.0 - Medic Miracle Worker: passive heal 1 HP/turn to all allies (AFTER DOT)
  const miracleWorkers = aliveParty.filter(p => hasAbility(p, 'miracle'));
  if (miracleWorkers.length > 0) {
    // 1.0 Phase 3.2 - Queue heal animations with green numbers
    if (typeof queueAnimation === 'function') {
      aliveParty.forEach(p => {
        if (p.hp > 0 && p.hp < p.maxHp) {
          queueAnimation(() => {
            p.hp = Math.min(p.maxHp, p.hp + miracleWorkers.length);
            renderCombatUI();
            
            const survivorCard = getCombatantCard(p.id, false);
            if (survivorCard && typeof showStatusEffect === 'function') {
              showStatusEffect(survivorCard, `+${miracleWorkers.length}`, '#4ade80'); // Green healing number
            }
          }, 400);
        }
      });
    } else {
      // Fallback without animation
      aliveParty.forEach(p => {
        if (p.hp > 0 && p.hp < p.maxHp) {
          p.hp = Math.min(p.maxHp, p.hp + miracleWorkers.length);
        }
      });
    }
    logCombat(`Miracle Worker provides healing to the team.`);
    renderCombatUI(); // Update UI after healing
  }
  
  // Regeneration phase (brood special)
  for (const a of aliveAliens) {
    if (a.special === 'regeneration') {
      const healAmount = rand(2, 4);
      a.hp = Math.min(a.maxHp, a.hp + healAmount);
      logCombat(`${a.name} regenerates ${healAmount} HP!`);
      renderCombatUI(); // Update UI after regeneration
      
      // 1.0 Phase 3.2 - Show regen animation with green healing number
      const alienCard = getCombatantCard(a.id, true);
      if (alienCard && typeof showStatusEffect === 'function') {
        showStatusEffect(alienCard, `+${healAmount}`, '#4ade80');
      }
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
  
  // 1.0 - Swarm: Infested spawn drones when killed
  const deadInfested = currentCombat.aliens.filter(a => 
    a.hp <= 0 && 
    !a._swarmSpawned && 
    (a.type === 'infested' || a.special === 'swarm')
  );
  for (const corpse of deadInfested) {
    corpse._swarmSpawned = true; // Prevent multiple spawns
    
    let spawnChance = 0.40; // 40% base chance
    let spawnCount = [1, 2]; // 1-2 drones
    
    // Check for modifiers that affect spawn
    if (hasModifier(corpse, 'hivenode')) {
      spawnChance = 1.0; // Guaranteed
      spawnCount = [2, 3]; // 2-3 drones
    } else if (hasModifier(corpse, 'swarming')) {
      spawnChance = 0.60; // +20% chance
    }
    
    // Boss enemies have fixed spawn counts
    if (corpse.rank === 'boss') {
      spawnChance = 1.0;
      spawnCount = [2, 3];
    }
    
    if (Math.random() < spawnChance) {
      const numSpawn = spawnCount[0] + Math.floor(Math.random() * (spawnCount[1] - spawnCount[0] + 1));
      logCombat(`💀 Larvae burst from ${corpse.name}'s corpse! ${numSpawn} Drones spawn!`, true);
      
      for (let i = 0; i < numSpawn; i++) {
        const newDrone = createAlien('drone');
        if (newDrone) {
          currentCombat.aliens.push(newDrone);
        }
      }
      
      renderCombatUI(); // Update UI after spawning
    }
  }
  
  for (const a of aliveAliens) {
    // 0.9.0 - Skip stunned aliens (numeric duration)
    if (a._stunned && a._stunned > 0) {
      logCombat(`${a.name} is stunned and cannot attack!`);
      a._stunned--;
      if (a._stunned <= 0) {
        delete a._stunned;
        logCombat(`${a.name} is no longer stunned.`);
      }
      renderCombatUI();
      continue;
    }
    
    // 1.0 - Hostile Survivor AI: Tactical actions (Aim, Guard)
    if (a.type === 'hostile_human') {
      // Use Guard if low HP (below 30%) and not already guarding
      if (a.hp < a.maxHp * 0.3 && !a._guardActive && !currentCombat.guarding?.[a.id] && Math.random() < 0.6) {
        a._guardActive = true;
        // Mirror into currentCombat.guarding so defense calc (which checks currentCombat.guarding) picks this up
        if (currentCombat) {
          currentCombat.guarding = currentCombat.guarding || {};
          currentCombat.guarding[a.id] = true;
        }
        const guardBonus = BALANCE.COMBAT_ACTIONS.Guard.defenseBonus || 3;
        logCombat(`🛡️ ${a.name} braces for impact (+${guardBonus} defense this turn)!`, true);
        
        // 1.0 Phase 3.2 - Show guard animation
        renderCombatUI();
        if (typeof queueAnimation === 'function' && typeof animateGuard === 'function') {
          queueAnimation(() => {
            const guardCard = getCombatantCard(a.id, true);
            animateGuard(guardCard);
            if (typeof showStatusEffect === 'function') {
              showStatusEffect(guardCard, `🛡️ GUARD +${guardBonus}`, 'var(--accent)');
            }
          }, 600);
        }
        continue; // Guard instead of attacking
      }
      
      // Use Aim if not aimed and randomly (30% chance)
      if (!a._aimedShot && !currentCombat.aimed?.[a.id] && Math.random() < 0.3) {
        a._aimedShot = true;
        // Mirror into currentCombat.aimed so UI/defense code that checks currentCombat.aimed sees it
        if (currentCombat) {
          currentCombat.aimed = currentCombat.aimed || {};
          currentCombat.aimed[a.id] = true;
        }
        const aimBonus = Math.round((BALANCE.COMBAT_ACTIONS.Aim.accuracyBonus || 0.25) * 100);
        logCombat(`🎯 ${a.name} takes careful aim (+${aimBonus}% hit chance next shot)!`, true);
        
        // 1.0 Phase 3.2 - Show aim animation
        renderCombatUI();
        if (typeof queueAnimation === 'function' && typeof animateAim === 'function') {
          queueAnimation(() => {
            const aimCard = getCombatantCard(a.id, true);
            animateAim(aimCard);
            if (typeof showStatusEffect === 'function') {
              showStatusEffect(aimCard, `🎯 AIM +${aimBonus}%`, 'var(--accent)');
            }
          }, 600);
        }
        continue; // Aim instead of attacking
      }
      
      // 1.0 Phase 3.2 - Hostile survivors can use Burst (ranged) or Power Attack (melee)
      // 25% chance to use special attack if not on cooldown
      if (!a._specialCooldown && Math.random() < 0.25) {
        const weaponType = a.equipment?.weapon?.weaponType || 'unarmed';
        if (weaponType === 'ranged') {
          // Use Burst attack
          a._hostileBurst = true;
          a._specialCooldown = 3; // 3 turn cooldown
          logCombat(`${a.name} fires a devastating burst!`, true);
        } else if (weaponType === 'melee') {
          // Use Power Attack
          a._hostilePowerAttack = true;
          a._specialCooldown = 3; // 3 turn cooldown
          logCombat(`${a.name} winds up a powerful strike!`, true);
        }
      }
      
      // Decrement cooldown
      if (a._specialCooldown && a._specialCooldown > 0) {
        a._specialCooldown--;
      }
    }
    
    // 1.0 - Hostile Survivor AI: Use consumables intelligently
    if (a.type === 'hostile_human' && a.inventory && a.inventory.length > 0) {
      // Use Medkit if HP below 50%
      if (a.hp < a.maxHp * 0.5) {
        const medkitIdx = a.inventory.findIndex(item => item.type === 'medkit');
        if (medkitIdx >= 0) {
          const healAmount = rand(15, 25);
          a.hp = Math.min(a.maxHp, a.hp + healAmount);
          a.inventory.splice(medkitIdx, 1);
          logCombat(`⚕️ ${a.name} uses a Medkit and heals ${healAmount} HP!`, true);
          
          // 1.0 Phase 3.2 - Queue medkit animation
          // FIX: Don't call renderCombatUI() during animations!
          if (typeof queueAnimation === 'function') {
            queueAnimation(() => {
              const card = getCombatantCard(a.id, true);
              if (typeof animateConsumable === 'function') {
                animateConsumable(card, 'heal');
              }
              if (typeof animateHeal === 'function') {
                animateHeal(card);
              }
              if (typeof showStatusEffect === 'function') {
                showStatusEffect(card, `⚕️ +${healAmount} HP`, '#4ade80');
              }
            }, 400);
            queueAnimation(() => {
              renderCombatUI();
            }, 1500); // Wait for 1.2s animation + 300ms buffer
          } else {
            renderCombatUI();
          }
          continue; // End turn after using medkit
        }
      }
      
      // Use Stimpack if HP below 70% and not already active
      if (a.hp < a.maxHp * 0.7 && !a._stimpackTurns) {
        const stimpackIdx = a.inventory.findIndex(item => item.type === 'stimpack');
        if (stimpackIdx >= 0) {
          a._stimpackTurns = 3;
          a._stimpackEvasion = 0.30; // 30% as decimal
          a._stimpackRetreat = 0.40; // 40% as decimal
          a.inventory.splice(stimpackIdx, 1);
          logCombat(`💉 ${a.name} uses a Stimpack (+30% evasion, 3 turns)!`, true);
          
          // 1.0 Phase 3.2 - Queue stimpack animation
          // FIX: Don't call renderCombatUI() during animations!
          if (typeof queueAnimation === 'function') {
            queueAnimation(() => {
              const card = getCombatantCard(a.id, true);
              if (typeof animateConsumable === 'function') {
                animateConsumable(card, 'stimpack');
              }
              if (typeof applyStatusAnimation === 'function') {
                applyStatusAnimation(card, 'buffed', true);
              }
              if (typeof showStatusEffect === 'function') {
                showStatusEffect(card, '💉 STIMPACK +30%', 'var(--accent)');
              }
              setTimeout(() => {
                if (typeof applyStatusAnimation === 'function') {
                  applyStatusAnimation(card, 'buffed', false);
                }
              }, 3000);
            }, 400);
            queueAnimation(() => {
              renderCombatUI();
            }, 1500); // Wait for 1.2s animation + 300ms buffer
          } else {
            renderCombatUI();
          }
          continue; // End turn after using stimpack
        }
      }
      
      // Use Stun Grenade tactically - target highest damage survivor
      const stunGrenadeIdx = a.inventory.findIndex(item => item.type === 'stun_grenade');
      if (stunGrenadeIdx >= 0 && Math.random() < 0.4) { // 40% chance to use each turn
        const currentAliveParty = party.filter(p => p.hp > 0 && !p.downed && !p._retreated && (!p._stunned || p._stunned === 0));
        if (currentAliveParty.length > 0) {
          // Find strongest survivor by weapon damage
          const strongestTarget = currentAliveParty.reduce((max, p) => {
            const pDmg = p.equipment?.weapon?.damage?.[1] || 0;
            const maxDmg = max.equipment?.weapon?.damage?.[1] || 0;
            return pDmg > maxDmg ? p : max;
          }, currentAliveParty[0]);
          
          if (strongestTarget && !strongestTarget._stunned) {
            strongestTarget._stunned = 2;
            a.inventory.splice(stunGrenadeIdx, 1);
            logCombat(`💥 ${a.name} throws a Stun Grenade at ${strongestTarget.name}! Stunned for 2 turns!`, true);
            
            // 1.0 Phase 3.2 - Queue stun grenade throw + impact animations
            // FIX: Don't call renderCombatUI() during animations - wait until after!
            if (typeof queueAnimation === 'function') {
              // Consumable glow on user
              queueAnimation(() => {
                const attackerCard = getCombatantCard(a.id, true);
                if (typeof animateConsumable === 'function') {
                  animateConsumable(attackerCard, 'stun');
                }
              }, 300);
              
              // Throw animation
              queueAnimation(() => {
                const attackerCard = getCombatantCard(a.id, true);
                if (typeof animateThrow === 'function') {
                  animateThrow(attackerCard);
                }
              }, 500);
              
              // Impact + stun effect
              queueAnimation(() => {
                const targetCard = getCombatantCard(strongestTarget.id, false);
                if (typeof applyStatusAnimation === 'function') {
                  applyStatusAnimation(targetCard, 'stunned', true);
                }
                if (typeof showStatusEffect === 'function') {
                  showStatusEffect(targetCard, '💥⚡ STUNNED!', 'var(--danger)');
                }
                setTimeout(() => {
                  if (typeof applyStatusAnimation === 'function') {
                    applyStatusAnimation(targetCard, 'stunned', false);
                  }
                }, 1800);
              }, 700);
              
              // Render UI AFTER all animations complete
              queueAnimation(() => {
                renderCombatUI();
              }, 900);
            } else {
              renderCombatUI();
            }
            continue; // End turn after using stun grenade
          }
        }
      }
    }
    
    // 1.0 Phase 3.2 - Apply alien regeneration (Brood Mother special)
    if (a.special === 'regeneration' && a.hp > 0 && a.hp < a.maxHp) {
      const regenAmount = rand(2, 4);
      const actualHeal = Math.min(a.maxHp - a.hp, regenAmount);
      
      if (typeof queueAnimation === 'function') {
        queueAnimation(() => {
          a.hp = Math.min(a.maxHp, a.hp + actualHeal);
          renderCombatUI();
          
          const alienCard = getCombatantCard(a.id, true);
          if (alienCard && typeof showStatusEffect === 'function') {
            showStatusEffect(alienCard, `+${actualHeal}`, '#4ade80'); // Green healing number
          }
          logCombat(`${a.name} regenerates ${actualHeal} HP.`);
        }, 500);
      } else {
        a.hp = Math.min(a.maxHp, a.hp + actualHeal);
        logCombat(`${a.name} regenerates ${actualHeal} HP.`);
        renderCombatUI();
      }
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
      // 1.0 - Advanced AI: Smart targeting based on alien type
      const targetsAvailable = party.filter(p => p.hp > 0 && !p.downed && !p._retreated);
      if (targetsAvailable.length === 0) {
        return endCombat(false);
      }
      
      // Use smart targeting (same function as combat.js)
      // 1.0 - Hostile survivors also use smart targeting (focus low HP)
      let targ;
      if (a.type === 'hostile_human') {
        // Hostile survivors always focus fire on lowest HP% target
        targ = targetsAvailable.reduce((min, p) => {
          const pHpPercent = p.hp / p.maxHp;
          const minHpPercent = min.hp / min.maxHp;
          return pHpPercent < minHpPercent ? p : min;
        }, targetsAvailable[0]);
      } else {
        targ = selectAlienTargetInteractive(a, targetsAvailable);
      }
      if (!targ || targ.hp <= 0) break;
      
      // 1.0 Phase 3.2 - Handle hostile survivor burst/power attacks
      let burstShots = 1;
      let damageMultiplier = 1;
      
      if (a.type === 'hostile_human') {
        if (a._hostileBurst) {
          // Burst: 2-4 shots with bonus damage
          const weapon = a.equipment?.weapon;
          if (weapon && weapon.burstShots) {
            burstShots = weapon.burstShots;
          } else {
            burstShots = rand(2, 4);
          }
          damageMultiplier = 1.1; // 10% bonus per shot
          a._hostileBurst = false; // Consume flag
        } else if (a._hostilePowerAttack) {
          // Power Attack: 1.5x damage
          damageMultiplier = 1.5;
          a._hostilePowerAttack = false; // Consume flag
        }
      }
      
      // Calculate damage using attackRange if available, otherwise use attack ± 1
      let aDmg;
      if (a.attackRange && Array.isArray(a.attackRange)) {
        aDmg = rand(a.attackRange[0], a.attackRange[1]);
      } else {
        aDmg = rand(Math.max(1, a.attack - 1), a.attack + 1);
      }
      
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
        
        // 1.0 Phase 3.2 - Queue attack animation THEN dodge reaction
        renderCombatUI();
        if (typeof queueAnimation === 'function') {
          queueAnimation(() => {
            const attackerCard = getCombatantCard(a.id, true);
            if (typeof animateShoot === 'function') {
              animateShoot(attackerCard, 'melee', false);
            }
          }, 500);
          
          queueAnimation(() => {
            const targetCard = getCombatantCard(actualTarget.id, false);
            if (typeof animateDodge === 'function') {
              animateDodge(targetCard);
            }
            if (typeof showStatusEffect === 'function') {
              showStatusEffect(targetCard, '🌫️ STEALTH!', 'var(--accent)');
            }
          }, 500);
        }
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
      
      // Consume aimed shot flag (accuracy bonus already applied in rollHitChance)
      if (a._aimedShot) {
        a._aimedShot = false;
        if (currentCombat && currentCombat.aimed) currentCombat.aimed[a.id] = false;
        logCombat(`${a.name} fires a focused shot!`, true);
      }

      // Apply dodge check
      if (totalDodgeChance > 0 && Math.random() < totalDodgeChance) {
        logCombat(`${actualTarget.name} dodges the attack!`, true);
        
        // 1.0 Phase 3.2 - Queue attack animation THEN dodge reaction
        renderCombatUI();
        if (typeof queueAnimation === 'function') {
          queueAnimation(() => {
            const attackerCard = getCombatantCard(a.id, true);
            if (typeof animateShoot === 'function') {
              animateShoot(attackerCard, 'melee', false);
            }
          }, 500);
          
          queueAnimation(() => {
            const targetCard = getCombatantCard(actualTarget.id, false);
            if (typeof animateDodge === 'function') {
              animateDodge(targetCard);
            }
            if (typeof showStatusEffect === 'function') {
              showStatusEffect(targetCard, 'DODGE!', 'var(--accent)');
            }
          }, 500);
        }
        continue; // Skip this attack
      }
      
      // 1.0 - Phase check from armor (Spectre Armor)
      let phaseChance = 0;
      if (actualTarget.equipment && actualTarget.equipment.armor && actualTarget.equipment.armor.effects) {
        const phaseEffect = actualTarget.equipment.armor.effects.find(e => e.startsWith('phase:'));
        if (phaseEffect) {
          phaseChance = parseInt(phaseEffect.split(':')[1]) / 100;
        }
      }
      
      if (phaseChance > 0 && Math.random() < phaseChance) {
        logCombat(`${actualTarget.name} phases through the attack!`, true);
        
        // Queue attack animation THEN phase reaction
        renderCombatUI();
        if (typeof queueAnimation === 'function') {
          queueAnimation(() => {
            const attackerCard = getCombatantCard(a.id, true);
            if (typeof animateShoot === 'function') {
              animateShoot(attackerCard, 'melee', false);
            }
          }, 500);
          
          queueAnimation(() => {
            const targetCard = getCombatantCard(actualTarget.id, false);
            // 1.0 - Use phase animation, not dodge animation
            if (typeof applyStatusAnimation === 'function') {
              applyStatusAnimation(targetCard, 'phased', true);
              setTimeout(() => applyStatusAnimation(targetCard, 'phased', false), 2000);
            }
            if (typeof showStatusEffect === 'function') {
              showStatusEffect(targetCard, '👻 PHASE', 'var(--accent)');
            }
          }, 600);
        }
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
        logCombat(`${a.name}'s toxin weakens ${actualTarget.name}'s armor!`, true);
        actualTarget._toxicDebuff = true;
      }
      
      // 1.0 Phase 3.2 - Calculate damage but DON'T apply to HP yet
      let totalDamage = 0;
      for (let shotNum = 0; shotNum < burstShots; shotNum++) {
        let shotDmg = Math.floor(aDmg * damageMultiplier);
        const taken = Math.max(0, shotDmg - defense);
        totalDamage += taken;
        
        if (burstShots > 1) {
          logCombat(`Shot ${shotNum + 1}: ${taken} damage.`);
        }
      }
      
      if (burstShots === 1) {
        if (aDmg > totalDamage) {
          logCombat(`${actualTarget.name} blocked ${aDmg - totalDamage} damage.`);
        }
        logCombat(`${a.name} strikes ${actualTarget.name} for ${totalDamage} damage.`);
      } else {
        logCombat(`${a.name} burst fires at ${actualTarget.name} for ${totalDamage} total damage!`);
      }
      
      if (actualTarget !== targ) {
        appendLog(`${a.name} hits ${actualTarget.name} for ${totalDamage} (shielded ${targ.name}).`);
      } else {
        appendLog(`${a.name} strikes ${actualTarget.name} for ${totalDamage}.`);
      }
      
      // Check actual target for effects
      targ = actualTarget;
      
      // 1.0 Phase 3.2 - Check for reflect damage (before applying damage)
      let reflectDamage = 0;
      if (actualTarget.equipment?.armor) {
        const armorEffects = getArmorPassiveBonuses(actualTarget.equipment.armor);
        if (armorEffects.reflectChance > 0 && Math.random() < armorEffects.reflectChance) {
          reflectDamage = Math.floor(totalDamage * 0.3);
          logCombat(`⚡ ${actualTarget.name}'s armor reflects ${reflectDamage} damage back!`, true);
        }
      }
      
      // 1.0 Phase 3.2 - Render initial UI so DOM exists
      renderCombatUI();
      
      // Queue alien attack animations - apply damage INSIDE animation
      if (typeof queueAnimation === 'function') {
        // 1.0 Phase 3.2 - Determine weapon type for hostile survivors
        let weaponType = 'melee'; // Default for aliens
        let isBurst = false;
        let isPowerAttack = false;
        
        if (a.type === 'hostile_human') {
          weaponType = a.equipment?.weapon?.weaponType || 'unarmed';
          isBurst = burstShots > 1;
          isPowerAttack = damageMultiplier > 1 && burstShots === 1 && weaponType === 'melee';
        }
        
        const perShotDmg = Math.floor(totalDamage / burstShots);
        
        // Handle burst fire (multiple shots)
        if (isBurst) {
          for (let shotNum = 0; shotNum < burstShots; shotNum++) {
            queueAnimation(() => {
              const attackerCard = getCombatantCard(a.id, true);
              if (typeof animateShoot === 'function') {
                animateShoot(attackerCard, weaponType, false);
              }
            }, 300);
            
            queueAnimation(() => {
              // Apply THIS shot's damage
              actualTarget.hp -= perShotDmg;
              
              // Update UI after each shot FIRST
              renderCombatUI();
              
              // THEN get fresh card and animate
              const targetCard = getCombatantCard(actualTarget.id, false);
              if (typeof animateDamage === 'function') {
                animateDamage(targetCard, false);
              }
              if (typeof showStatusEffect === 'function') {
                showStatusEffect(targetCard, `-${perShotDmg}`, '#ff6b6b');
              }
            }, 400);
          }
        }
        // Handle power attack (melee)
        else if (isPowerAttack) {
          queueAnimation(() => {
            const attackerCard = getCombatantCard(a.id, true);
            if (typeof animatePowerAttack === 'function') {
              animatePowerAttack(attackerCard);
            }
          }, 700);
          
          queueAnimation(() => {
            // Apply damage
            actualTarget.hp -= totalDamage;
            
            // Update UI FIRST
            renderCombatUI();
            
            // THEN get fresh card and animate
            const targetCard = getCombatantCard(actualTarget.id, false);
            if (typeof animateDamage === 'function') {
              animateDamage(targetCard, false);
            }
            if (typeof showStatusEffect === 'function') {
              showStatusEffect(targetCard, `-${totalDamage}`, '#ff6b6b');
            }
          }, 400);
        }
        // Normal attack
        else {
          queueAnimation(() => {
            const attackerCard = getCombatantCard(a.id, true);
            if (typeof animateShoot === 'function') {
              animateShoot(attackerCard, weaponType, false);
            }
          }, weaponType === 'melee' ? 500 : 400);
          
          queueAnimation(() => {
            // Apply damage
            actualTarget.hp -= totalDamage;
            
            // Update UI FIRST
            renderCombatUI();
            
            // THEN get fresh card and animate
            const targetCard = getCombatantCard(actualTarget.id, false);
            if (typeof animateDamage === 'function') {
              animateDamage(targetCard, false);
            }
            if (typeof showStatusEffect === 'function') {
              showStatusEffect(targetCard, `-${totalDamage}`, '#ff6b6b');
            }
          }, 500);
        }
        
        // 1.0 Phase 3.2 - Apply reflect damage if triggered
        if (reflectDamage > 0) {
          queueAnimation(() => {
            // Show reflect effect on defender
            const defenderCard = getCombatantCard(actualTarget.id, false);
            if (defenderCard && typeof showStatusEffect === 'function') {
              showStatusEffect(defenderCard, '⚡ REFLECT!', '#4a9eff');
            }
          }, 300);
          
          queueAnimation(() => {
            // Apply reflect damage to attacker
            a.hp -= reflectDamage;
            
            // Update UI
            renderCombatUI();
            
            // Animate damage on attacker
            const attackerCard = getCombatantCard(a.id, true);
            if (attackerCard) {
              if (typeof animateDamage === 'function') {
                animateDamage(attackerCard, true);
              }
              if (typeof showStatusEffect === 'function') {
                showStatusEffect(attackerCard, `-${reflectDamage}`, '#ff6b6b');
              }
            }
            
            if (a.hp <= 0) {
              logCombat(`${a.name} is destroyed by reflected damage!`, true);
            }
          }, 500);
        }
      } else {
        // Fallback if no animations
        actualTarget.hp -= totalDamage;
        if (reflectDamage > 0) {
          a.hp -= reflectDamage;
          if (a.hp <= 0) {
            logCombat(`${a.name} is destroyed by reflected damage!`, true);
          }
        }
        renderCombatUI();
      }
      
      // 0.9.0 - Juggernaut: 20% chance to stun on hit (Ravager)
      if (hasModifier(a, 'juggernaut') && totalDamage > 0 && Math.random() < 0.20 && targ.hp > 0) {
        if (!targ._stunned) {
          targ._stunned = 1;
          logCombat(`⚡ ${targ.name} is stunned by the devastating blow!`, true);
          
          // 1.0 Phase 3.2 - Queue stun animation
          if (typeof queueAnimation === 'function' && typeof applyStatusAnimation === 'function') {
            queueAnimation(() => {
              const targetCard = getCombatantCard(targ.id, false);
              applyStatusAnimation(targetCard, 'stunned', true);
              if (typeof showStatusEffect === 'function') {
                showStatusEffect(targetCard, '⚡ STUNNED!', 'var(--danger)');
              }
              setTimeout(() => applyStatusAnimation(targetCard, 'stunned', false), 1800);
              renderCombatUI();
            }, 500);
          } else {
            renderCombatUI();
          }
        }
      }
      
      // 0.8.0 - Venomous: apply poison
      if (hasModifier(a, 'venomous') && totalDamage > 0 && targ.hp > 0) {
        // Poison: Each stack lasts 3 turns independently
        // Deal 2 damage per stack per turn
        if (!targ._poisonQueue) targ._poisonQueue = [];
        targ._poisonQueue.push(3); // Add new stack with 3 turns
        targ._poisonStacks = targ._poisonQueue.length;
        logCombat(`${targ.name} is poisoned!`);
        
        // 1.0 Phase 3.2 - Queue poison animation
        if (typeof queueAnimation === 'function' && typeof applyStatusAnimation === 'function') {
          queueAnimation(() => {
            const targetCard = getCombatantCard(targ.id, false);
            applyStatusAnimation(targetCard, 'poisoned', true);
            if (typeof showStatusEffect === 'function') {
              showStatusEffect(targetCard, '☠️ POISONED', '#9333ea');
            }
            renderCombatUI();
          }, 500);
        } else {
          renderCombatUI();
        }
      }
      
      // 0.9.0 - Plague Bringer: AOE + poison all targets (Spitter)
      if (hasModifier(a, 'plague') && totalDamage > 0 && targ.hp > 0) {
        // Apply poison to primary target
        if (!targ._poisonQueue) targ._poisonQueue = [];
        targ._poisonQueue.push(3);
        targ._poisonStacks = targ._poisonQueue.length;
        
        // AOE splash to all other survivors
        const splashTargets = aliveParty.filter(p => p.hp > 0 && p !== targ);
        for (const splashTarg of splashTargets) {
          const plagueDmg = Math.floor(totalDamage * 0.5);
          splashTarg.hp -= plagueDmg;
          
          // Poison splash targets too
          if (!splashTarg._poisonQueue) splashTarg._poisonQueue = [];
          splashTarg._poisonQueue.push(3);
          splashTarg._poisonStacks = splashTarg._poisonQueue.length;
        }
        logCombat(`💀 ${a.name} unleashes a plague cloud! All survivors poisoned!`, true);
        
        // 1.0 Phase 3.2 - Queue plague poison animation for ALL targets
        if (typeof queueAnimation === 'function' && typeof applyStatusAnimation === 'function') {
          const allPoisoned = [targ, ...splashTargets];
          for (const poisonedTarget of allPoisoned) {
            queueAnimation(() => {
              const targetCard = getCombatantCard(poisonedTarget.id, false);
              applyStatusAnimation(targetCard, 'poisoned', true);
              if (typeof showStatusEffect === 'function') {
                showStatusEffect(targetCard, '☠️ PLAGUE!', '#9333ea');
              }
            }, 500);
          }
          queueAnimation(() => renderCombatUI(), 100);
        } else {
          renderCombatUI();
        }
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
          
          // 1.0 Phase 3.2 - Queue death animation (UI already updated)
          if (typeof queueAnimation === 'function' && typeof animateDeath === 'function') {
            queueAnimation(() => {
              const targetCard = getCombatantCard(targ.id, false);
              animateDeath(targetCard);
            }, 800);
          }
          
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
  
  // 1.0 Phase 3.2 - Process all queued alien attack animations, then check defeat or start player turn
  if (typeof processAnimationQueue === 'function') {
    processAnimationQueue(() => {
      // All animations done, check if party survived
      const aliveAfterAnimations = party.filter(p => p.hp > 0 && !p.downed && !p._retreated);
      if (aliveAfterAnimations.length === 0) {
        // Party wiped out - end combat with defeat
        return endCombat(false);
      }
      
      // Party survived - start next turn
      startPlayerTurn(party);
    });
  } else {
    // Fallback
    setTimeout(() => {
      const aliveAfterAnimations = party.filter(p => p.hp > 0 && !p.downed && !p._retreated);
      if (aliveAfterAnimations.length === 0) {
        return endCombat(false);
      }
      startPlayerTurn(party);
    }, 500);
  }
}

function startPlayerTurn(party) {
  // 1.0 Phase 3.2 - Clear enemy turn flag
  if (currentCombat) {
    currentCombat._enemyTurnActive = false;
  }
  
  // Log the start of the new player turn
  logCombat(`— Turn ${currentCombat.turn} —`);
  logCombat('— Your Turn —');
  
  // 1.0 Phase 3.2 - Auto-select first alive alien if no target selected
  if (!currentCombat.selectedTargetId || !currentCombat.aliens.find(a => a.id === currentCombat.selectedTargetId && a.hp > 0)) {
    const firstAlive = currentCombat.aliens.find(a => a.hp > 0);
    if (firstAlive) {
      currentCombat.selectedTargetId = firstAlive.id;
    }
  }
  
  // Render UI to show turn markers
  renderCombatUI();
  
  // Reset per-turn flags
  for (const p of party) {
    p._guardBonus = 0;
    p._shieldUsed = false;
    if (currentCombat.guarding) {
      currentCombat.guarding[p.id] = false;
    }
  }
  for (const a of currentCombat.aliens) {
    if (a._justPhased) a._justPhased = false;
  }
}

function endCombat(win) {
  // 1.0 Phase 3.2 - Wait for all animations to finish before ending combat
  if (typeof isAnimating === 'function' && isAnimating()) {
    if (typeof processAnimationQueue === 'function') {
      processAnimationQueue(() => {
        // All animations done, now end combat
        endCombatImmediate(win);
      });
    } else {
      // Fallback if sequencer not available
      setTimeout(() => endCombatImmediate(win), 1000);
    }
    return;
  }
  
  endCombatImmediate(win);
}

function endCombatImmediate(win) {
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
    
    // 1.0 - Drop loot from defeated hostile survivors
    if (currentCombat.aliens && currentCombat.aliens.some(a => a.type === 'hostile_human')) {
      const hostiles = currentCombat.aliens.filter(a => a.type === 'hostile_human');
      for (const hostile of hostiles) {
        // Drop equipped items
        if (hostile.equipment) {
          if (hostile.equipment.weapon) {
            state.inventory.push(hostile.equipment.weapon);
            appendLog(`⚔️ Looted: ${hostile.equipment.weapon.name} (${hostile.equipment.weapon.durability}/${hostile.equipment.weapon.maxDurability})`);
          }
          if (hostile.equipment.armor) {
            state.inventory.push(hostile.equipment.armor);
            appendLog(`🛡️ Looted: ${hostile.equipment.armor.name} (${hostile.equipment.armor.durability}/${hostile.equipment.armor.maxDurability})`);
          }
        }
        
        // Drop remaining consumables from inventory
        if (hostile.inventory && hostile.inventory.length > 0) {
          for (const item of hostile.inventory) {
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
        const scrapAmount = rarityScrap[hostile.rarity] || 15;
        state.resources.scrap += scrapAmount;
        appendLog(`💰 Looted ${scrapAmount} scrap from ${hostile.name}`);
      }
    }
    
    if (idx !== null && state.tiles[idx]) {
      state.tiles[idx].aliens = [];
      state.tiles[idx].type = 'empty';
      state.tiles[idx].cleared = true; // Mark as fully cleared (0.7.2)
      // 1.0 - Clear hostile survivors from tile
      if (state.tiles[idx].hostileSurvivors) {
        delete state.tiles[idx].hostileSurvivors;
      }
      if (state.tiles[idx]._originalHostiles) {
        delete state.tiles[idx]._originalHostiles;
      }
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
    } else if (currentCombat.context && (currentCombat.context === 'mission' || currentCombat.context.type === 'mission')) {
      // Mission context: call mission onWin callback if present
      if (typeof currentCombat.context.onWin === 'function') {
        currentCombat.context.onWin();
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
    
    // Raid failure - apply penalties instead of game over
    if (isRaid) {
      const integrityDamage = rand(BALANCE.INTEGRITY_DAMAGE_RAID_DEFEAT[0], BALANCE.INTEGRITY_DAMAGE_RAID_DEFEAT[1]);
      state.baseIntegrity -= integrityDamage;
      state.survivors.forEach(s => s.morale -= BALANCE.MORALE_LOSS_RAID_LOST);
      
      appendLog(`The base defenses have fallen! Integrity -${integrityDamage}%.`);
      closeCombatOverlay();
      return;
    } else if (currentCombat.context && (currentCombat.context === 'mission' || currentCombat.context.type === 'mission')) {
      // Mission context: call mission onLoss callback if present
      if (typeof currentCombat.context.onLoss === 'function') {
        currentCombat.context.onLoss();
      }
    }
    
    // For field combat, mark tile as not cleared so it can be revisited
    if (idx !== null && state.tiles[idx]) {
      state.tiles[idx].cleared = false;
      
      // 1.0 Phase 3.2 - Clear selected explorer to return them to base
      state.selectedExplorerId = null;
      
      // 1.0 - Sync hostile survivor HP back to tile after defeat/retreat
      if (state.tiles[idx].hostileSurvivors && currentCombat.aliens) {
        console.log('Syncing HP after defeat/retreat. Aliens in combat:', currentCombat.aliens.map(a => ({ id: a.id, name: a.name, type: a.type, hp: a.hp })));
        console.log('Hostiles on tile before sync:', state.tiles[idx].hostileSurvivors.map(h => ({ id: h.id, name: h.name, hp: h.hp })));
        
        currentCombat.aliens.forEach(alien => {
          if (alien.type === 'hostile_human') {
            const hostile = state.tiles[idx].hostileSurvivors.find(h => h.id === alien.id);
            if (hostile) {
              console.log(`Syncing ${hostile.name}: ${hostile.hp} → ${alien.hp}`);
              hostile.hp = alien.hp;
              hostile.maxHp = alien.maxHp;
            }
          }
        });
        
        console.log('Hostiles on tile after sync:', state.tiles[idx].hostileSurvivors.map(h => ({ id: h.id, name: h.name, hp: h.hp })));
        
        // Remove dead hostiles from tile
        state.tiles[idx].hostileSurvivors = state.tiles[idx].hostileSurvivors.filter(h => h.hp > 0);
        
        console.log('Hostiles on tile after filtering dead:', state.tiles[idx].hostileSurvivors.map(h => ({ id: h.id, name: h.name, hp: h.hp })));
      }
    }
    // (handled above) mission onLoss callback already invoked where appropriate
  }
  
  closeCombatOverlay();
  updateUI(); // 1.0 Phase 3.2 - Update UI after closing to refresh map with cleared explorer
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
