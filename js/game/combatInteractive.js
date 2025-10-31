// Interactive Combat System (0.7.0)
// Presents a modal where the player can select actions per round.

let currentCombat = null; // { context, idx, partyIds, aliens, turn, aimed, log, explorerId, activePartyIdx }

function openCombatOverlay() {
  const overlay = document.getElementById('combatOverlay');
  overlay.style.display = 'flex';
  renderCombatUI();
}

function closeCombatOverlay() {
  const overlay = document.getElementById('combatOverlay');
  overlay.style.display = 'none';
  currentCombat = null;
}

function interactiveEncounterAtTile(idx) {
  // build aliens similar to spawnAlienEncounter but don't autobattle
  const t = state.tiles[idx];
  const size = rand(1, 3);
  t.aliens = [];
  for (let i = 0; i < size; i++) {
    const at = ALIEN_TYPES[rand(0, ALIEN_TYPES.length - 1)];
    const hp = rand(at.hpRange[0], at.hpRange[1]);
    
    // 0.8.0 - Roll for rare modifiers
    const modifiers = rollAlienModifiers(at.id);
    
    t.aliens.push({
      id: `a_${Date.now()}_${i}`,
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
      firstStrike: true
    });
  }
  const explorer = state.survivors.find(s => s.id === state.selectedExplorerId);
  if (!explorer) {
    appendLog('No explorer selected for engagement.');
    return;
  }
  currentCombat = {
    context: 'field',
    idx,
    partyIds: [explorer.id],
    aliens: t.aliens,
    turn: 1,
    aimed: {},
    log: [],
    activePartyIdx: 0
  };
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
  const defenders = guards.map(s => s.id);
  currentCombat = {
    context: 'base',
    idx: null,
    partyIds: defenders,
    aliens,
    turrets: Math.max(0, Number(turretCount) || 0),
    turretsState: Array.from({ length: Math.max(0, Number(turretCount) || 0) }, () => ({ aimed: false })),
    turn: 1,
    aimed: {},
    log: [],
    activePartyIdx: 0
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

function renderCombatUI() {
  if (!currentCombat) return;
  const content = document.getElementById('combatContent');
  const party = currentCombat.partyIds.map(id => state.survivors.find(s => s.id === id)).filter(Boolean);
  const aliens = currentCombat.aliens;
  const activeSurvivor = party[currentCombat.activePartyIdx];

  const partyHtml = party.map((s, idx) => {
    const weap = s.equipment.weapon ? `${s.equipment.weapon.name}` : 'Unarmed';
    const armor = s.equipment.armor ? `${s.equipment.armor.name}` : 'No Armor';
    const isActive = idx === currentCombat.activePartyIdx;
    const activeClass = isActive ? 'style="border: 2px solid var(--accent);"' : '';
    
    // 0.8.0 - Show downed status
    const downedStatus = s.downed ? '<div class="small" style="color:var(--danger)">⚠️ DOWNED</div>' : '';
    
    // 0.8.0 - Show class with tooltip
    const classInfo = SURVIVOR_CLASSES.find(c => c.id === s.class);
    const className = classInfo ? classInfo.name : (s.class || 'Unknown');
    const classDesc = classInfo ? classInfo.desc : '';
    const classHtml = `<div class="small" style="color:var(--class-common)" title="${classDesc}">${className}</div>`;
    
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
      abilitiesHtml = `<div class="small">${abilityDetails.join(' • ')}</div>`;
    }
    
    return `<div class="card-like" ${activeClass}><strong>${s.name}${isActive ? ' ⬅' : ''}</strong><div class="small">HP ${s.hp}/${s.maxHp}</div>${downedStatus}<div class="small">${weap} • ${armor}</div>${classHtml}${abilitiesHtml}</div>`;
  }).join('');

  const turretHtml = (currentCombat.turrets && currentCombat.turrets > 0)
    ? `<div class="card-like small"><strong>Auto-Turrets</strong><div class="small">${currentCombat.turrets} unit(s) ready</div></div>`
    : '';

  const alienHtml = aliens.map(a => {
    const alive = a.hp > 0;
    
    // 0.8.0 - Show base special in red (for aliens)
    const special = a.specialDesc ? `<div class="small" style="color:var(--mod-alien)">${a.specialDesc}</div>` : '';
    
    // 0.8.0 - Show rare modifiers with rarity-based colors (all red shades for aliens)
    let modifiersHtml = '';
    if (a.modifiers && a.modifiers.length > 0) {
      const modDetails = a.modifiers.map(modId => {
        // Find the modifier definition
        const mods = ALIEN_MODIFIERS[a.type];
        if (mods) {
          const modDef = mods.find(m => m.id === modId);
          if (modDef) {
            return `<span style="color: ${modDef.color}" title="${modDef.effect}">${modDef.name}</span>`;
          }
        }
        return modId;
      });
      modifiersHtml = `<div class="small">${modDetails.join(' • ')}</div>`;
    }
    
    return `<div class="card-like ${alive ? '' : 'small'}"><strong>${a.name}</strong><div class="small">HP ${Math.max(0,a.hp)}/${a.maxHp}</div>${special}${modifiersHtml}</div>`;
  }).join('');

  const combatLogHtml = currentCombat.log.map(l => `<div class="small" style="color:var(--muted)">${l}</div>`).join('');

  content.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
      <div>
        <div style="margin-bottom:6px"><strong>Team</strong> <span class="small">Turn ${currentCombat.turn}</span></div>
  ${partyHtml || '<div class="small">No combatants</div>'}
  ${turretHtml}
      </div>
      <div>
        <div style="margin-bottom:6px"><strong>Hostiles</strong></div>
        ${alienHtml || '<div class="small">Cleared</div>'}
      </div>
    </div>
    <div style="margin-top:8px;padding:8px;background:rgba(0,0,0,0.2);border-radius:4px;max-height:120px;overflow-y:auto">
      <div class="small" style="margin-bottom:4px"><strong>Combat Log</strong></div>
      ${combatLogHtml || '<div class="small" style="color:var(--muted)">No events yet.</div>'}
    </div>
  `;

  // Update action button tooltips
  updateActionTooltips(activeSurvivor);
}

function updateActionTooltips(survivor) {
  if (!survivor) return;
  const shoot = document.getElementById('btnActionShoot');
  const aim = document.getElementById('btnActionAim');
  const burst = document.getElementById('btnActionBurst');
  const guard = document.getElementById('btnActionGuard');
  const med = document.getElementById('btnActionMedkit');
  const revive = document.getElementById('btnActionRevive');
  
  if (shoot) shoot.title = 'Fire a single shot at the target.';
  if (aim) aim.title = `Take careful aim (+${Math.round(BALANCE.COMBAT_ACTIONS.Aim.accuracyBonus * 100)}% hit chance next turn).`;
  if (burst) burst.title = `Fire 2 shots with +${BALANCE.COMBAT_ACTIONS.Burst.dmgBonus[0]}-${BALANCE.COMBAT_ACTIONS.Burst.dmgBonus[1]} bonus damage. Uses 2x ammo.`;
  if (guard) guard.title = `Brace for impact (+${BALANCE.COMBAT_ACTIONS.Guard.defenseBonus} defense this turn).`;
  if (med) {
    const medkits = state.inventory.filter(i => i.type === 'medkit').length;
    med.title = `Use a medkit to heal ${BALANCE.COMBAT_ACTIONS.MedkitHeal[0]}-${BALANCE.COMBAT_ACTIONS.MedkitHeal[1]} HP. (${medkits} available)`;
  }
  
  // 0.8.0 - Show/hide Revive button based on Field Medic ability and downed allies
  if (revive) {
    const hasFieldMedic = hasAbility(survivor, 'fieldmedic');
    const party = currentCombat.partyIds.map(id => state.survivors.find(s => s.id === id)).filter(Boolean);
    const hasDownedAllies = party.some(p => p.downed && p.id !== survivor.id);
    
    if (hasFieldMedic && hasDownedAllies) {
      revive.style.display = 'inline-block';
      revive.title = 'Revive a downed ally (25-50% HP). Requires Field Medic ability.';
    } else {
      revive.style.display = 'none';
    }
  }
}

function rollHitChance(survivor) {
  let chance = BALANCE.BASE_HIT_CHANCE;
  if (currentCombat.aimed[survivor.id]) chance += BALANCE.COMBAT_ACTIONS.Aim.accuracyBonus;
  chance = clamp(chance, 0.05, 0.95);
  return Math.random() < chance;
}

function computeSurvivorDamage(s) {
  // use existing calculateAttackDamage if available
  let base = 2 + s.skill + (s.level * BALANCE.LEVEL_ATTACK_BONUS);
  const w = s.equipment.weapon?.type;
    if (w === 'rifle') base += 8;
    else if (w === 'shotgun') base += rand(6, 12);
  return base;
}

function getActiveSurvivor() {
  const party = currentCombat.partyIds.map(id => state.survivors.find(s => s.id === id)).filter(Boolean);
  return party[currentCombat.activePartyIdx];
}

function advanceToNextSurvivor() {
  const party = currentCombat.partyIds.map(id => state.survivors.find(s => s.id === id)).filter(Boolean);
  currentCombat.activePartyIdx++;
  if (currentCombat.activePartyIdx >= party.length) {
    // All survivors acted — turrets fire, then enemy turn
    currentCombat.activePartyIdx = 0;
    renderCombatUI(); // Update UI before turret phase
    turretPhase();
    enemyTurn();
  } else {
    const nextSurvivor = party[currentCombat.activePartyIdx];
    renderCombatUI();
  }
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
  const target = currentCombat.aliens.find(a => a.hp > 0);
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
      renderCombatUI(); // Update UI after kill
    }
  }
}

function playerShoot(action = 'shoot') {
  if (!currentCombat) return;
  const s = getActiveSurvivor();
  if (!s || s.hp <= 0) return;
  const target = currentCombat.aliens.find(a => a.hp > 0);
  if (!target) return endCombat(true);

  // ammo
  let shots = 1;
  if (action === 'burst') shots = BALANCE.COMBAT_ACTIONS.Burst.ammoMult || 2;

  for (let i = 0; i < shots; i++) {
    if (state.resources.ammo <= 0) {
      logCombat(`${s.name} is out of ammo!`, true);
      break;
    }
    if (Math.random() < BALANCE.AMMO_CONSUME_CHANCE) state.resources.ammo = Math.max(0, state.resources.ammo - 1);
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
      if (action === 'burst') {
        const r = BALANCE.COMBAT_ACTIONS.Burst.dmgBonus;
        dmg += rand(r[0], r[1]);
      }
      // 0.8.0 - Medic Adrenaline Shot bonus damage
      if (s._adrenalineBonus) {
        dmg += s._adrenalineBonus;
      }
      // crit
      if (Math.random() < BALANCE.CRIT_CHANCE) {
        dmg = Math.floor(dmg * BALANCE.CRIT_MULT);
        logCombat(`${s.name} scores a CRITICAL hit on ${target.name}!`);
      }
      
      let dealt = rand(Math.max(1, dmg - 1), dmg + 2);
      
      // Apply armored special
      if (target.special === 'armored') {
        dealt = Math.floor(dealt * 0.5);
        logCombat(`${target.name}'s carapace absorbs damage!`);
      }
      
      target.hp -= dealt;
      logCombat(`${s.name} hits ${target.name} for ${dealt} damage.`, true);
      renderCombatUI(); // Update UI after damage
      
      if (target.hp <= 0) {
        logCombat(`${target.name} eliminated.`, true);
        state.alienKills = (state.alienKills || 0) + 1;
        
        // 0.8.0 - Spawner: summon drone on death
        if (hasModifier(target, 'spawner')) {
          const droneType = ALIEN_TYPES.find(at => at.id === 'drone');
          if (droneType) {
            const spawnedHp = rand(droneType.hpRange[0], droneType.hpRange[1]);
            currentCombat.aliens.push({
              id: `spawned_${Date.now()}`,
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
            logCombat(`${target.name} spawns a drone as it dies!`, true);
            renderCombatUI(); // Update UI after spawn
          }
        }
        
        // Loot on kill
        const loot = pickLoot();
        loot.onPickup(state);
        // 0.8.0 - Scientist Xenobiologist: tech on alien kill
        if (hasAbility(s, 'xenobiologist')) {
          state.resources.tech += 1;
          appendLog(`${s.name} extracts alien tech.`);
        }
      }
    } else {
      logCombat(`${s.name} missed.`, true);
      renderCombatUI(); // Update UI after miss
    }
  }

  currentCombat.aimed[s.id] = false;
  advanceToNextSurvivor();
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
  s._guardBonus = (s._guardBonus || 0) + (BALANCE.COMBAT_ACTIONS.Guard.defenseBonus || 2);
  logCombat(`${s.name} braces for impact.`, true);
  renderCombatUI(); // Update UI after guard
  advanceToNextSurvivor();
}

function playerUseMedkit() {
  const s = getActiveSurvivor();
  if (!s) return;
  const idx = state.inventory.findIndex(i => i.type === 'medkit');
  if (idx === -1) { 
    logCombat('No medkits available.', true);
    return; 
  }
  let heal = rand(BALANCE.COMBAT_ACTIONS.MedkitHeal[0], BALANCE.COMBAT_ACTIONS.MedkitHeal[1]);
  
  // 0.8.0 - Medic Triage: +25% healing
  if (hasAbility(s, 'triage')) {
    heal = Math.floor(heal * 1.25);
    logCombat(`${s.name}'s Triage expertise maximizes healing!`);
  }
  
  s.hp = Math.min(s.maxHp, s.hp + heal);
  state.inventory.splice(idx,1);
  
  // 0.8.0 - Medic Adrenaline Shot: +2 damage temp buff
  if (hasAbility(s, 'adrenaline')) {
    s._adrenalineBonus = (s._adrenalineBonus || 0) + 2;
    logCombat(`${s.name} feels a surge of adrenaline!`);
  }
  
  logCombat(`${s.name} uses a Medkit and heals ${heal} HP.`, true);
  renderCombatUI(); // Update UI after healing
  advanceToNextSurvivor();
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
  const reviveHP = rand(Math.floor(target.maxHp * 0.25), Math.floor(target.maxHp * 0.50));
  target.hp = reviveHP;
  target.downed = false;
  
  logCombat(`${s.name} revives ${target.name}! Restored to ${reviveHP} HP.`, true);
  renderCombatUI(); // Update UI after revival
  advanceToNextSurvivor();
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
  
  // Calculate retreat chance
  let retreatChance = BALANCE.RETREAT_BASE_CHANCE;
  retreatChance += s.skill * BALANCE.RETREAT_SKILL_BONUS;
  retreatChance += s.level * BALANCE.RETREAT_LEVEL_BONUS;
  
  // Apply alien type penalty/bonus
  const aliens = currentCombat.aliens.filter(a => a.hp > 0);
  if (aliens.length > 0) {
    const avgPenalty = aliens.reduce((sum, a) => sum + (BALANCE.RETREAT_ALIEN_PENALTY[a.type] || 0), 0) / aliens.length;
    retreatChance += avgPenalty;
  }
  
  retreatChance = clamp(retreatChance, 0.1, 0.95);
  
  const success = Math.random() < retreatChance;
  
  if (success) {
    logCombat(`${s.name} successfully retreats!`, true);
    // 0.8.x - Retreat increases raid pressure slightly
    state.raidPressure = Math.min((state.raidPressure || 0) + 0.003, 0.03);
    state.threat = clamp(state.threat + 0.5, 0, 100);
    // Mark tile as not cleared so it can be revisited
    if (currentCombat.idx !== null && state.tiles[currentCombat.idx]) {
      state.tiles[currentCombat.idx].cleared = false;
      // Keep aliens alive for later
    }
    updateUI();
    closeCombatOverlay();
  } else {
    logCombat(`${s.name} failed to retreat!`, true);
    // Advance to next survivor's turn (or enemy turn if last survivor)
    advanceToNextSurvivor();
  }
}

function enemyTurn() {
  if (!currentCombat) return;
  const party = currentCombat.partyIds.map(id => state.survivors.find(s => s.id === id)).filter(Boolean);
  const aliveAliens = currentCombat.aliens.filter(a => a.hp > 0);
  const aliveParty = party.filter(p => p.hp > 0);
  if (aliveAliens.length === 0) return endCombat(true);
  if (aliveParty.length === 0) return endCombat(false);

  logCombat(`— Enemy Turn —`);
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
  
  // Apply poison damage
  for (const p of aliveParty) {
    if (p._poisonStacks && p._poisonStacks > 0) {
      const poisonDmg = p._poisonStacks;
      p.hp = Math.max(0, p.hp - poisonDmg);
      logCombat(`${p.name} takes ${poisonDmg} poison damage.`);
      renderCombatUI(); // Update UI after poison damage
      if (p.hp <= 0) {
        logCombat(`${p.name} succumbs to poison.`);
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
    // Check if any survivors are still alive before each alien attacks
    const currentAliveParty = party.filter(p => p.hp > 0 && !p.downed);
    if (currentAliveParty.length === 0) {
      return endCombat(false);
    }
    
    // Multi-strike special (queen)
    const attackCount = (a.special === 'multistrike') ? 2 : 1;
    
    for (let strike = 0; strike < attackCount; strike++) {
      // Pick a random survivor to attack
      const targetsAvailable = party.filter(p => p.hp > 0 && !p.downed);
      if (targetsAvailable.length === 0) {
        return endCombat(false);
      }
      
      let targ = targetsAvailable[rand(0, targetsAvailable.length - 1)];
      if (!targ || targ.hp <= 0) break;
      
      let aDmg = rand(Math.max(1, a.attack - 1), a.attack + 1);
      
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
      // 0.8.0 - Cunning: second ambush at 50% HP
      if (hasModifier(a, 'cunning') && a.hp < a.maxHp * 0.5 && !a._cunningUsed) {
        aDmg = Math.floor(aDmg * 1.5);
        a._cunningUsed = true;
        logCombat(`${a.name} strikes with renewed cunning!`);
      }
      if (a.special === 'pack') {
        const allyCount = aliveAliens.filter(al => al !== a).length;
        aDmg += allyCount * 2;
        if (allyCount > 0) logCombat(`${a.name} coordinated pack attack!`);
      }
      
      let defense = (targ._guardBonus || 0) + (targ.equipment.armor?.type === 'armor' ? 3 : targ.equipment.armor?.type === 'heavyArmor' ? 6 : targ.equipment.armor?.type === 'hazmatSuit' ? 3 : 0);
      
      // Piercing special (spitter) - ignore 50% of armor
      if (a.special === 'piercing') {
        defense = Math.floor(defense * 0.5);
        logCombat(`${a.name} sprays corrosive bile!`);
      }
      
      // 0.8.0 - Living Shield: Guardian intercepts damage for ally
      let actualTarget = targ;
      const guardians = aliveParty.filter(g => g.hp > 0 && hasAbility(g, 'shield') && !g._shieldUsed && g !== targ);
      if (guardians.length > 0 && Math.random() < 0.50) { // 50% chance to intercept
        actualTarget = guardians[0];
        actualTarget._shieldUsed = true;
        logCombat(`${actualTarget.name} intercepts with Living Shield!`, true);
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
      
      // 0.8.0 - Venomous: apply poison
      if (hasModifier(a, 'venomous') && taken > 0) {
        targ._poisonStacks = (targ._poisonStacks || 0) + 1;
        logCombat(`${targ.name} is poisoned!`);
        renderCombatUI(); // Update UI after poison applied
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
  // Reset guard bonuses after enemy phase
  for (const p of party) p._guardBonus = 0;
  
  // Check if any survivors remain alive (not downed)
  const survivorsAlive = aliveParty.filter(p => p.hp > 0 && !p.downed).length;
  if (survivorsAlive === 0) {
    return endCombat(false);
  }

  // Reset to first survivor for next round
  currentCombat.activePartyIdx = 0;
  logCombat(`— Turn ${currentCombat.turn} —`);
  logCombat('— Your Turn —');
  
  // 0.8.0 - Reset per-turn flags
  for (const p of party) p._guardBonus = 0; // guard bonus was already reset, but keep it explicit
  for (const p of party) p._shieldUsed = false; // Reset Living Shield
  for (const a of currentCombat.aliens) {
    if (a._justPhased) a._justPhased = false; // Clear wraith flag
  }
  
  renderCombatUI();
}

function endCombat(win) {
  const idx = currentCombat?.idx ?? null;
  const isRaid = currentCombat?.context === 'base';
  
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
    }
    
    // Raid success rewards
    if (isRaid) {
      state.resources.scrap += rand(2, 10);
      state.threat = clamp(state.threat - BALANCE.THREAT_REDUCE_ON_REPEL, 0, 100);
      appendLog('Raid repelled. Recovered scrap from wreckage.');
    }
  } else {
    logCombat('Defeat.', true);
    
    // 0.8.0 - Remove downed/dead survivors from this combat
    const combatPartyIds = currentCombat.partyIds;
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
  const btnClose = document.getElementById('btnCloseCombat');
  if (btnClose) btnClose.onclick = () => { 
    // If closing mid-combat during field exploration, treat as retreat/forfeit
    if (currentCombat && currentCombat.aliens.some(a => a.hp > 0)) {
      const isFieldCombat = currentCombat.context === 'field';
      
      if (isFieldCombat) {
        // For field exploration, just close - don't auto-resolve with other survivors
        logCombat('Combat abandoned.', true);
        appendLog('Engagement ended.');
        // Mark tile as not cleared so it can be revisited
        if (currentCombat.idx !== null && state.tiles[currentCombat.idx]) {
          state.tiles[currentCombat.idx].cleared = false;
        }
      } else if (currentCombat.context === 'base') {
        // For base defense, auto-resolve with all guards
        resolveSkirmish(currentCombat.aliens, 'base', null);
      }
    }
    closeCombatOverlay();
    updateUI();
  };
  const shoot = document.getElementById('btnActionShoot');
  const aim = document.getElementById('btnActionAim');
  const burst = document.getElementById('btnActionBurst');
  const guard = document.getElementById('btnActionGuard');
  const med = document.getElementById('btnActionMedkit');
  const revive = document.getElementById('btnActionRevive');
  const retreat = document.getElementById('btnActionRetreat');
  const auto = document.getElementById('btnActionAuto');
  if (shoot) shoot.onclick = () => playerShoot('shoot');
  if (aim) aim.onclick = () => playerAim();
  if (burst) burst.onclick = () => playerShoot('burst');
  if (guard) guard.onclick = () => playerGuard();
  if (med) med.onclick = () => playerUseMedkit();
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
