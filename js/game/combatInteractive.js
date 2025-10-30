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
    t.aliens.push({
      id: `a_${Date.now()}_${i}`,
      type: at.id,
      name: at.name,
      hp,
      maxHp: hp,
      attack: rand(at.attackRange[0], at.attackRange[1]),
      stealth: at.stealth,
      flavor: at.flavor
    });
  }
  const explorer = state.survivors.find(s => s.id === selectedExplorerId);
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
  appendLog(`Engagement: ${currentCombat.partyIds.length} survivor vs ${t.aliens.length} alien(s).`);
  logCombat(`Turn ${currentCombat.turn} — Your move.`);
  openCombatOverlay();
}

function interactiveRaidCombat(aliens) {
  // All survivors not on mission defend the base
  const defenders = state.survivors.filter(s => !s.onMission).map(s => s.id);
  if (defenders.length === 0) {
    appendLog('No defenders available: raid overwhelms the base.');
    state.baseIntegrity -= rand(10, 20);
    return;
  }
  currentCombat = {
    context: 'base',
    idx: null,
    partyIds: defenders,
    aliens,
    turn: 1,
    aimed: {},
    log: [],
    activePartyIdx: 0
  };
  appendLog(`Base Defense: ${defenders.length} survivor(s) vs ${aliens.length} alien(s).`);
  logCombat(`Turn ${currentCombat.turn} — Defender ${currentCombat.activePartyIdx + 1} of ${defenders.length}.`);
  openCombatOverlay();
}

function logCombat(msg) {
  if (!currentCombat) return;
  currentCombat.log.push(msg);
  // Keep log limited to last 12 entries
  if (currentCombat.log.length > 12) currentCombat.log.shift();
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
    return `<div class="card-like" ${activeClass}><strong>${s.name}${isActive ? ' ⬅' : ''}</strong><div class="small">HP ${s.hp}/${s.maxHp}</div><div class="small">${weap} • ${armor}</div></div>`;
  }).join('');

  const alienHtml = aliens.map(a => {
    const alive = a.hp > 0;
    return `<div class="card-like ${alive ? '' : 'small'}"><strong>${a.name}</strong><div class="small">HP ${Math.max(0,a.hp)}/${a.maxHp}</div></div>`;
  }).join('');

  const combatLogHtml = currentCombat.log.map(l => `<div class="small" style="color:var(--muted)">${l}</div>`).join('');

  content.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
      <div>
        <div style="margin-bottom:6px"><strong>Team</strong> <span class="small">Turn ${currentCombat.turn}</span></div>
        ${partyHtml || '<div class="small">No combatants</div>'}
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
  
  if (shoot) shoot.title = 'Fire a single shot at the target.';
  if (aim) aim.title = `Take careful aim (+${Math.round(BALANCE.COMBAT_ACTIONS.Aim.accuracyBonus * 100)}% hit chance next turn).`;
  if (burst) burst.title = `Fire 2 shots with +${BALANCE.COMBAT_ACTIONS.Burst.dmgBonus[0]}-${BALANCE.COMBAT_ACTIONS.Burst.dmgBonus[1]} bonus damage. Uses 2x ammo.`;
  if (guard) guard.title = `Brace for impact (+${BALANCE.COMBAT_ACTIONS.Guard.defenseBonus} defense this turn).`;
  if (med) {
    const medkits = state.inventory.filter(i => i.type === 'medkit').length;
    med.title = `Use a medkit to heal ${BALANCE.COMBAT_ACTIONS.MedkitHeal[0]}-${BALANCE.COMBAT_ACTIONS.MedkitHeal[1]} HP. (${medkits} available)`;
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
  if (w === 'rifle') base += 6;
  else if (w === 'shotgun') base += rand(4, 10);
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
    // All survivors acted, trigger enemy turn
    currentCombat.activePartyIdx = 0;
    enemyTurn();
  } else {
    const nextSurvivor = party[currentCombat.activePartyIdx];
    logCombat(`${nextSurvivor.name}'s turn.`);
    renderCombatUI();
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
      logCombat(`${s.name} is out of ammo!`);
      appendLog(`${s.name} is out of ammo!`);
      break;
    }
    if (Math.random() < BALANCE.AMMO_CONSUME_CHANCE) state.resources.ammo = Math.max(0, state.resources.ammo - 1);
    const hit = rollHitChance(s) && !(action === 'aim' && i>0);
    if (hit) {
      let dmg = computeSurvivorDamage(s);
      if (action === 'burst') {
        const r = BALANCE.COMBAT_ACTIONS.Burst.dmgBonus;
        dmg += rand(r[0], r[1]);
      }
      // crit
      if (Math.random() < BALANCE.CRIT_CHANCE) {
        dmg = Math.floor(dmg * BALANCE.CRIT_MULT);
        logCombat(`${s.name} scores a CRITICAL hit on ${target.name}!`);
      }
      const dealt = rand(Math.max(1, dmg - 1), dmg + 2);
      target.hp -= dealt;
      logCombat(`${s.name} hits ${target.name} for ${dealt} damage.`);
      appendLog(`${s.name} hits ${target.name} for ${dealt}.`);
      if (target.hp <= 0) {
        logCombat(`${target.name} eliminated.`);
        appendLog(`${target.name} downed.`);
        // Loot on kill
        const loot = pickLoot();
        loot.onPickup(state);
      }
    } else {
      logCombat(`${s.name} missed.`);
      appendLog(`${s.name} missed.`);
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
  logCombat(`${s.name} takes careful aim...`);
  appendLog(`${s.name} takes careful aim...`);
  advanceToNextSurvivor();
}

function playerGuard() {
  if (!currentCombat) return;
  const s = getActiveSurvivor();
  if (!s) return;
  s._guardBonus = (s._guardBonus || 0) + (BALANCE.COMBAT_ACTIONS.Guard.defenseBonus || 2);
  logCombat(`${s.name} braces for impact.`);
  appendLog(`${s.name} braces for impact.`);
  advanceToNextSurvivor();
}

function playerUseMedkit() {
  const s = getActiveSurvivor();
  if (!s) return;
  const idx = state.inventory.findIndex(i => i.type === 'medkit');
  if (idx === -1) { 
    logCombat('No medkits available.');
    appendLog('No medkits available.'); 
    return; 
  }
  const heal = rand(BALANCE.COMBAT_ACTIONS.MedkitHeal[0], BALANCE.COMBAT_ACTIONS.MedkitHeal[1]);
  s.hp = Math.min(s.maxHp, s.hp + heal);
  state.inventory.splice(idx,1);
  logCombat(`${s.name} uses a Medkit and heals ${heal} HP.`);
  appendLog(`${s.name} uses a Medkit and heals ${heal} HP.`);
  advanceToNextSurvivor();
}

function enemyTurn() {
  if (!currentCombat) return;
  const party = currentCombat.partyIds.map(id => state.survivors.find(s => s.id === id)).filter(Boolean);
  const aliveAliens = currentCombat.aliens.filter(a => a.hp > 0);
  const aliveParty = party.filter(p => p.hp > 0);
  if (aliveAliens.length === 0) return endCombat(true);
  if (aliveParty.length === 0) return endCombat(false);

  logCombat(`— Enemy Turn —`);
  for (const a of aliveAliens) {
    // Pick a random survivor to attack
    const targ = aliveParty[rand(0, aliveParty.length - 1)];
    if (!targ) break;
    const defense = (targ._guardBonus || 0) + (targ.equipment.armor?.type === 'armor' ? 2 : targ.equipment.armor?.type === 'heavyArmor' ? 4 : targ.equipment.armor?.type === 'hazmatSuit' ? 2 : 0);
    const aDmg = rand(Math.max(1, a.attack - 1), a.attack + 1);
    const taken = Math.max(0, aDmg - defense);
    targ.hp -= taken;
    logCombat(`${a.name} strikes ${targ.name} for ${taken} damage.`);
    appendLog(`${a.name} strikes ${targ.name} for ${taken}.`);
    if (targ.hp <= 0) {
      logCombat(`${targ.name} has fallen.`);
    }
  }

  currentCombat.turn++;
  // Reset guard bonuses after enemy phase
  for (const p of party) p._guardBonus = 0;
  
  // Check if any survivors remain
  if (aliveParty.filter(p => p.hp > 0).length === 0) {
    return endCombat(false);
  }

  // Reset to first survivor for next round
  currentCombat.activePartyIdx = 0;
  logCombat(`— Turn ${currentCombat.turn} —`);
  const nextSurvivor = party[currentCombat.activePartyIdx];
  if (nextSurvivor) logCombat(`${nextSurvivor.name}'s turn.`);
  renderCombatUI();
}

function endCombat(win) {
  const idx = currentCombat?.idx ?? null;
  const isRaid = currentCombat?.context === 'base';
  
  if (win) {
    logCombat('Victory! Area secured.');
    appendLog('Engagement resolved. Area cleared.');
    if (idx !== null && state.tiles[idx]) {
      state.tiles[idx].aliens = [];
      state.tiles[idx].type = 'empty';
    }
    // XP reward for all surviving party members
    const party = currentCombat.partyIds.map(id => state.survivors.find(s => s.id === id)).filter(Boolean);
    for (const s of party) {
      if (s && s.hp > 0) grantXp(s, rand(BALANCE.COMBAT_XP_RANGE[0], BALANCE.COMBAT_XP_RANGE[1]));
    }
    
    // Raid success rewards
    if (isRaid) {
      state.resources.scrap += rand(2, 10);
      state.threat = clamp(state.threat - BALANCE.THREAT_REDUCE_ON_REPEL, 0, 100);
      appendLog('Raid repelled. Recovered scrap from wreckage.');
    }
  } else {
    logCombat('Defeat. Fall back.');
    appendLog('Engagement failed. Retreat.');
    // Remove dead
    state.survivors = state.survivors.filter(x => x.hp > 0);
    
    // Raid failure penalties
    if (isRaid) {
      state.baseIntegrity -= rand(BALANCE.INTEGRITY_DAMAGE_ON_BREACH[0], BALANCE.INTEGRITY_DAMAGE_ON_BREACH[1]);
      appendLog('Raid breached defenses. Base integrity damaged.');
      
      // Chance of alien nest spawning
      if (Math.random() < BALANCE.NEST_CHANCE_AFTER_BREACH) {
        const explored = Array.from(state.explored);
        if (explored.length > 0) {
          const tileIdx = explored[rand(0, explored.length - 1)];
          state.tiles[tileIdx].type = 'alien';
          appendLog('Aliens established a nest inside the station.');
        }
      }
    }
  }
  updateUI();
  closeCombatOverlay();
}

function bindCombatUIEvents() {
  const btnClose = document.getElementById('btnCloseCombat');
  if (btnClose) btnClose.onclick = () => { 
    // If closing mid-combat, auto-resolve
    if (currentCombat && currentCombat.aliens.some(a => a.hp > 0)) {
      const t = currentCombat?.idx;
      if (t != null) {
        resolveSkirmish(currentCombat.aliens, currentCombat.context, t);
      } else if (currentCombat.context === 'base') {
        resolveSkirmish(currentCombat.aliens, 'base', null);
      }
    }
    closeCombatOverlay(); 
  };
  const shoot = document.getElementById('btnActionShoot');
  const aim = document.getElementById('btnActionAim');
  const burst = document.getElementById('btnActionBurst');
  const guard = document.getElementById('btnActionGuard');
  const med = document.getElementById('btnActionMedkit');
  const auto = document.getElementById('btnActionAuto');
  if (shoot) shoot.onclick = () => playerShoot('shoot');
  if (aim) aim.onclick = () => playerAim();
  if (burst) burst.onclick = () => playerShoot('burst');
  if (guard) guard.onclick = () => playerGuard();
  if (med) med.onclick = () => playerUseMedkit();
  if (auto) auto.onclick = () => { // fall back to auto resolver
    const t = currentCombat?.idx;
    if (t != null) {
      // call existing auto resolver
      resolveSkirmish(currentCombat.aliens, currentCombat.context, t);
    } else if (currentCombat.context === 'base') {
      resolveSkirmish(currentCombat.aliens, 'base', null);
    }
    closeCombatOverlay();
  };
}

// Initialize bindings after DOM ready
setTimeout(bindCombatUIEvents, 0);
