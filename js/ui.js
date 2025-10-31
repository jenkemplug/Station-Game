function appendLog(text) {
  const t = `[${new Date().toLocaleTimeString()}] ${text}`;
  const node = document.createElement('div');
  node.textContent = t;
  const logEl = el('log');
  logEl.prepend(node);
  while (logEl.childNodes.length > MAX_LOG) {
    logEl.removeChild(logEl.lastChild);
  }
}

// Snapshot caches to avoid unnecessary DOM re-renders that break hover/focus
let lastRenderedMapSnapshot = null;
let lastRenderedInventorySnapshot = null;
// 0.8.2 - Avoid rerendering workbench every tick
let lastRenderedWorkbenchKey = null;
// 0.8.5 - Snapshots for all UI panels to prevent focus loss
let lastRenderedResourceSnapshot = null;
let lastRenderedSystemSnapshot = null;
let lastRenderedThreatSnapshot = null;

function computeMapSnapshot() {
  try {
    const parts = [state.mapSize.w, state.mapSize.h];
    for (let i = 0; i < state.tiles.length; i++) {
      const t = state.tiles[i];
      const aliensAlive = (t.aliens && t.aliens.some(a => a && a.hp > 0)) ? 1 : 0;
      parts.push(`${t.type}:${t.scouted?1:0}:${t.cleared?1:0}:${aliensAlive}`);
    }
    return parts.join('|');
  } catch (e) {
    // Fallback to force render on error
    return String(Math.random());
  }
}

function updateUI() {
  // 0.8.6 - Include consumption in resource snapshot
  const resourceSnapshot = JSON.stringify({
    oxygen: Math.floor(state.resources.oxygen),
    food: Math.floor(state.resources.food),
    energy: Math.floor(state.resources.energy),
    scrap: Math.floor(state.resources.scrap),
    oxygenRate: state.production.oxygen.toFixed(1),
    foodRate: state.production.food.toFixed(1),
    energyRate: state.production.energy.toFixed(1),
    scrapRate: state.production.scrap.toFixed(1),
    oxygenConsume: state.consumption?.oxygen.toFixed(1) || '0.0',
    foodConsume: state.consumption?.food.toFixed(1) || '0.0',
    energyConsume: state.consumption?.energy.toFixed(1) || '0.0'
  });
  
  if (lastRenderedResourceSnapshot !== resourceSnapshot) {
    lastRenderedResourceSnapshot = resourceSnapshot;
    el('res-oxygen').textContent = `O₂: ${Math.floor(state.resources.oxygen)}`;
    el('res-food').textContent = `Food: ${Math.floor(state.resources.food)}`;
    el('res-energy').textContent = `Energy: ${Math.floor(state.resources.energy)}`;
    el('res-scrap').textContent = `Scrap: ${Math.floor(state.resources.scrap)}`;
    el('res-oxygen-rate').textContent = `+${state.production.oxygen.toFixed(1)}/s`;
    el('res-food-rate').textContent = `+${state.production.food.toFixed(1)}/s`;
    el('res-energy-rate').textContent = `+${state.production.energy.toFixed(1)}/s`;
    el('res-scrap-rate').textContent = `+${state.production.scrap.toFixed(1)}/s`;
    
    // 0.8.6 - Show consumption rates
    if (state.consumption) {
      el('res-oxygen-consume').textContent = `-${state.consumption.oxygen.toFixed(1)}/s`;
      el('res-food-consume').textContent = `-${state.consumption.food.toFixed(1)}/s`;
      el('res-energy-consume').textContent = `-${state.consumption.energy.toFixed(1)}/s`;
    }
  }

  // survivors
  el('survivorCount').textContent = state.survivors.length;
  renderSurvivors();

  // 0.8.5 - Only update systems panel if values changed
  const filterFailures = state.systemFailures.filter(f => f.type === 'filter').length;
  const genFailures = state.systemFailures.filter(f => f.type === 'generator').length;
  const turretFailures = state.systemFailures.filter(f => f.type === 'turret').length;
  const hasFailures = filterFailures + genFailures + turretFailures > 0;
  
  const systemSnapshot = JSON.stringify({
    filter: state.systems.filter,
    generator: state.systems.generator,
    turret: state.systems.turret,
    filterFail: filterFailures,
    genFail: genFailures,
    turretFail: turretFailures
  });
  
  if (lastRenderedSystemSnapshot !== systemSnapshot) {
    lastRenderedSystemSnapshot = systemSnapshot;
    
    const costFilter = BALANCE.UPGRADE_COSTS.filter.base + state.systems.filter * BALANCE.UPGRADE_COSTS.filter.perLevel;
    const costGen = BALANCE.UPGRADE_COSTS.generator.base + state.systems.generator * BALANCE.UPGRADE_COSTS.generator.perLevel;
    // 0.8.4 - Scale turret costs by 10% per existing turret
    const turretScalingFactor = 1 + (state.systems.turret * 0.10);
    const costTurScrap = Math.ceil(BALANCE.UPGRADE_COSTS.turret.scrap * turretScalingFactor);
    const costTurEnergy = Math.ceil(BALANCE.UPGRADE_COSTS.turret.energy * turretScalingFactor);
  
    el('sys-filter').textContent = `Cost: ${costFilter} scrap • Level ${state.systems.filter}` + (filterFailures > 0 ? ` ⚠️ Failed` : '');
    el('sys-generator').textContent = `Cost: ${costGen} scrap • Level ${state.systems.generator}` + (genFailures > 0 ? ` ⚠️ Failed` : '');
    el('sys-turret').textContent = state.systems.turret > 0
      ? `Cost: ${costTurScrap}s/${costTurEnergy}e • ${state.systems.turret} turret(s)` + (turretFailures > 0 ? ` ⚠️ ${turretFailures} failed` : '')
      : `Cost: ${costTurScrap}s/${costTurEnergy}e • Offline` + (turretFailures > 0 ? ` ⚠️ ${turretFailures} failed` : '');
    
    // Show/hide repair section
    el('systemRepairs').style.display = hasFailures ? 'block' : 'none';
    el('btnRepairFilter').style.display = filterFailures > 0 ? 'inline-block' : 'none';
    el('btnRepairGenerator').style.display = genFailures > 0 ? 'inline-block' : 'none';
    el('btnRepairTurret').style.display = turretFailures > 0 ? 'inline-block' : 'none';
    
    // Update repair button text with costs
    if (filterFailures > 0) {
      const costs = BALANCE.REPAIR_COSTS.filter;
      el('btnRepairFilter').textContent = `Repair Filter (${costs.scrap}s/${costs.energy}e)`;
    }
    if (genFailures > 0) {
      const costs = BALANCE.REPAIR_COSTS.generator;
      el('btnRepairGenerator').textContent = `Repair Generator (${costs.scrap}s/${costs.energy}e)`;
    }
    if (turretFailures > 0) {
      const costs = BALANCE.REPAIR_COSTS.turret;
      el('btnRepairTurret').textContent = `Repair Turret (${costs.scrap}s/${costs.energy}e)`;
    }
  }

  // inventory
  renderInventory();

  // map
  renderMap();
  el('mapInfo').textContent = `Explored: ${state.explored.size}/${state.mapSize.w * state.mapSize.h}`;

  // 0.8.5 - Only update threat panel if values changed
  const last = Number(state.lastRaidAt) || 0;
  const dur = Number(state.raidCooldownMs) || 0;
  const now = Date.now();
  const remMs = Math.max(0, (last + dur) - now);
  const totalSec = Math.ceil(remMs / 1000);
  
  const threatSnapshot = JSON.stringify({
    threat: Math.round(Math.max(0, Math.min(100, Number(state.threat) || 0))),
    integrity: Math.max(0, Math.floor(state.baseIntegrity)),
    raidChance: ((Number(state.raidChance) || 0) * 100).toFixed(2),
    cooldownSec: totalSec,
    tech: state.resources.tech,
    ammo: state.resources.ammo,
    journal: state.journal.slice(-5).join(' '),
    played: state.secondsPlayed
  });
  
  if (lastRenderedThreatSnapshot !== threatSnapshot) {
    lastRenderedThreatSnapshot = threatSnapshot;
    
    el('threatLevel').textContent = threatText();
    // Clarify what threat means via tooltip
    try { el('threatLevel').title = 'Threat reflects alien activity around the station. Higher threat means more and stronger raids. Guards and turrets slow threat growth.'; } catch(e) {}
    el('baseIntegrity').textContent = `${Math.max(0, Math.floor(state.baseIntegrity))}%`;
    const rcEl = document.getElementById('raidChance');
    if (rcEl) {
      const pct = (Number(state.raidChance) || 0) * 100;
      // Show two decimals so small chances are visible (e.g., 0.05%)
      rcEl.textContent = `${pct.toFixed(2)}%`;
    }
    // Raid cooldown indicator (only show when active)
    const cdRow = document.getElementById('raidCooldownRow');
    const cdSpan = document.getElementById('raidCooldown');
    if (cdRow && cdSpan) {
      if (last > 0 && dur > 0 && remMs > 0) {
        // format remaining time as mm:ss or hh:mm:ss
        const h = Math.floor(totalSec / 3600);
        const m = Math.floor((totalSec % 3600) / 60);
        const s = totalSec % 60;
        const pad = (n) => String(n).padStart(2, '0');
        cdSpan.textContent = h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
        cdRow.style.display = '';
      } else {
        cdRow.style.display = 'none';
      }
    }
    
    // journal
    el('journal').textContent = state.journal.slice(-5).join(' ');
    el('timePlayed').textContent = `Played: ${formatTime(state.secondsPlayed)}`;

    // (loot preview removed)
    el('statTech').textContent = state.resources.tech;
    el('statAmmo').textContent = state.resources.ammo;
  }

  // 0.8.1 - Render workbench with dynamic costs
  renderWorkbench();

  renderExpeditionSurvivorSelect();
  renderExplorerSelect();
}

function renderExplorerSelect() {
  const cont = el('explorerDropdown');
  const availableSurvivors = state.survivors.filter(s => !s.onMission);
  const availableSurvivorsSnapshot = JSON.stringify(availableSurvivors);

  // Optimization: Only re-render if the list of available explorers has changed.
  if (lastRenderedAvailableExplorers === availableSurvivorsSnapshot) {
    return; // Skip re-render to preserve focus
  }
  lastRenderedAvailableExplorers = availableSurvivorsSnapshot;

  cont.innerHTML = '';

  if (availableSurvivors.length === 0) {
    cont.textContent = 'No explorers available';
    return;
  }

  if (!selectedExplorerId || !availableSurvivors.some(s => s.id === selectedExplorerId)) {
    selectedExplorerId = availableSurvivors[0].id;
  }

  const dropdown = document.createElement('div');
  dropdown.className = 'task-dropdown';

  const button = document.createElement('button');
  button.className = 'task-dropdown-button';
  button.type = 'button';
  const selectedSurvivor = availableSurvivors.find(s => s.id === selectedExplorerId);
  button.textContent = selectedSurvivor ? `Explorer: ${selectedSurvivor.name}` : 'Select Explorer';

  const content = document.createElement('div');
  content.className = 'task-dropdown-content';

  availableSurvivors.forEach(s => {
    const item = document.createElement('div');
    item.className = 'task-dropdown-item' + (s.id === selectedExplorerId ? ' selected' : '');
    item.textContent = s.name;
    item.onclick = (e) => {
      e.stopPropagation();
      selectedExplorerId = s.id;
      const selectedSurvivor = state.survivors.find(sur => sur.id === s.id);
      if (selectedSurvivor) {
        button.textContent = `Explorer: ${selectedSurvivor.name}`;
      }
      dropdown.classList.remove('open');
      activeDropdown = null;
      
      // Manually update the 'selected' class on items without a full re-render
      content.querySelectorAll('.task-dropdown-item').forEach(el => el.classList.remove('selected'));
      item.classList.add('selected');
    };
    content.appendChild(item);
  });

  button.onclick = (e) => {
    e.stopPropagation();
    const currentlyOpen = dropdown.classList.contains('open');
    
    document.querySelectorAll('.task-dropdown.open').forEach(el => el.classList.remove('open'));

    if (!currentlyOpen) {
      dropdown.classList.add('open');
      activeDropdown = { type: 'explorer' };
    } else {
      activeDropdown = null;
    }
  };

  if (activeDropdown && activeDropdown.type === 'explorer') {
    dropdown.classList.add('open');
  }

  dropdown.appendChild(button);
  dropdown.appendChild(content);
  cont.appendChild(dropdown);
}

function updateExpeditionTimers() {
  state.survivors.forEach(s => {
    if (s.onMission) {
      const statusEl = document.querySelector(`#survivor-${s.id}-status`);
      if (statusEl) {
        const activeMission = state.missions.find(m => m.party.includes(s.id) && m.status === 'active');
        if (activeMission) {
          const remainingSec = Math.max(0, activeMission.durationSec - activeMission.progress);
          statusEl.textContent = `Lvl ${s.level} • On Expedition (${formatTime(remainingSec)})`;
        }
      }
    }
  });
}

function renderSurvivors() {
  const cont = el('survivorList');

  // Create a snapshot of just the core survivor data (excluding mission progress)
  const currentSurvivorsSnapshot = JSON.stringify(state.survivors.map(s => ({
    ...s,
    onMission: s.onMission // Include only the flag, not the progress
  })));

  // Only do full re-render if core survivor data changed
  if (lastRenderedSurvivors === currentSurvivorsSnapshot) {
    updateExpeditionTimers();
    return;
  }

  lastRenderedSurvivors = currentSurvivorsSnapshot;

  // Store the open dropdown states before re-render
  const openDropdowns = Array.from(cont.querySelectorAll('.task-dropdown.open')).map(dropdown => {
    const survivorCard = dropdown.closest('.survivor-card');
    const survivorId = dropdown.querySelector('.task-dropdown-button').closest('[data-id]')?.dataset.id;
    const scrollTop = dropdown.querySelector('.task-dropdown-content').scrollTop;
    return { survivorId, scrollTop };
  });

  cont.innerHTML = '';
  if (state.survivors.length === 0) {
    cont.textContent = 'No survivors present.';
    return;
  }
  state.survivors.forEach(s => {
    const card = document.createElement('div');
    card.className = 'survivor-card';
    const healthPct = Math.max(0, Math.floor((s.hp / s.maxHp) * 100));
    const morale = Math.floor(s.morale);

    // Create custom dropdown for tasks
    const dropdown = document.createElement('div');
    dropdown.className = 'task-dropdown';
    dropdown.dataset.id = s.id;

    const button = document.createElement('button');
    button.className = 'task-dropdown-button';
    button.type = 'button'; // Prevent form submission behavior
    button.textContent = s.task || 'Idle';

    const content = document.createElement('div');
    content.className = 'task-dropdown-content';

    // restore previous scroll position for this dropdown (if any)
    setTimeout(() => {
      try {
        content.scrollTop = activeTaskDropdownScroll[s.id] || 0;
      } catch (e) { }
    }, 0);
    // save scroll position as the user scrolls
    content.addEventListener('scroll', () => {
      activeTaskDropdownScroll[s.id] = content.scrollTop;
    });

    TASKS.forEach(task => {
      const item = document.createElement('div');
      item.className = 'task-dropdown-item' + (task === s.task ? ' selected' : '');
      item.textContent = task;

      // click handler — use plain click to avoid interfering with default browser behavior
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        
        // Close the dropdown and clear the active state
        dropdown.classList.remove('open');
        card.classList.remove('dropdown-open');
        activeDropdown = null;

        // Assign the task (this will trigger a UI update)
        assignTask(s.id, task);
      });

      content.appendChild(item);
    });

    button.addEventListener('click', (e) => {
      e.stopPropagation();
      const currentlyOpen = dropdown.classList.contains('open');

      // Close all other dropdowns first
      document.querySelectorAll('.task-dropdown.open').forEach(el => {
        el.classList.remove('open');
        el.closest('.survivor-card')?.classList.remove('dropdown-open');
      });

      if (!currentlyOpen) {
        dropdown.classList.add('open');
        card.classList.add('dropdown-open');
        activeDropdown = { type: 'task', survivorId: s.id };
      } else {
        activeDropdown = null;
      }
    });
    
    dropdown.appendChild(button);
    dropdown.appendChild(content);

    // restore open state if this dropdown was active before a re-render
    if (activeDropdown && activeDropdown.type === 'task' && activeDropdown.survivorId === s.id) {
      dropdown.classList.add('open');
    }    // Get expedition time remaining if on mission
    let expeditionStatus = '';
    if (s.onMission) {
      const activeMission = state.missions.find(m => m.party.includes(s.id) && m.status === 'active');
      if (activeMission) {
        const remainingSec = Math.max(0, activeMission.durationSec - activeMission.progress);
        expeditionStatus = `On Expedition (${formatTime(remainingSec)})`;
      } else {
        expeditionStatus = 'On Expedition';
      }
    }

    card.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div><strong style="color:var(--accent)">${s.name}</strong><div class="small" id="survivor-${s.id}-status">Lvl ${s.level} • ${s.onMission ? expeditionStatus : (s.task || 'Idle')}</div></div>
        <div class="small">${healthPct}% HP • Morale ${morale}</div>
      </div>
      <div style="margin-top:6px" class="small">
        Skill: ${s.skill} • Exp: ${s.xp}/${s.nextXp} ${s.injured ? ' • Injured' : ''}
      </div>
      ${(() => {
        // 0.8.0 - Display class and abilities with tooltips
        const classInfo = SURVIVOR_CLASSES.find(c => c.id === s.class);
        const className = classInfo ? classInfo.name : (s.class || 'Unknown');
        const classDesc = classInfo ? classInfo.desc : '';
        let classDisplay = `<div style="margin-top:4px; font-size: 12px;"><span style="color: var(--class-common)" title="${classDesc}">Class: ${className}</span>`;
        
        if (s.abilities && s.abilities.length > 0) {
          const abilityNames = s.abilities.map(abilityId => {
            // Find the ability in SPECIAL_ABILITIES
            for (const classKey in SPECIAL_ABILITIES) {
              const found = SPECIAL_ABILITIES[classKey].find(a => a.id === abilityId);
              if (found) {
                return `<span style="color: ${found.color}" title="${found.effect}">${found.name}</span>`;
              }
            }
            return abilityId;
          });
          classDisplay += ` • ${abilityNames.join(', ')}`;
        }
        classDisplay += '</div>';
        return classDisplay;
      })()}
      <div style="margin-top:4px; font-size: 11px; color: var(--muted);">
        Equipped: ${s.equipment.weapon?.name || 'None'} / ${s.equipment.armor?.name || 'None'}
      </div>
      <div style="display:flex;gap:6px;margin-top:8px;align-items:center">
        <div style="flex:0 0 auto">Task: </div>
        <div id="task-select-${s.id}" style="flex:1"></div>
        <button data-id="${s.id}" class="equip" style="flex:0 0 auto">Equip</button>
        <button data-id="${s.id}" class="heal" style="flex:0 0 auto">Use Medkit</button>
        <button data-id="${s.id}" class="dismiss" style="flex:0 0 auto">Release</button>
      </div>
    `;
    cont.appendChild(card);
    // Insert the custom dropdown
    el(`task-select-${s.id}`).appendChild(dropdown);
  });

  // bind controls
  cont.querySelectorAll('select.task-select').forEach(select => {
    select.onchange = (e) => assignTask(Number(e.target.dataset.id), e.target.value);
  });
  cont.querySelectorAll('button.dismiss').forEach(b => b.onclick = () => releaseSurvivor(Number(b.dataset.id)));
  cont.querySelectorAll('button.heal').forEach(b => b.onclick = () => useMedkit(Number(b.dataset.id)));
  cont.querySelectorAll('button.equip').forEach(b => b.onclick = () => openLoadoutForSurvivor(Number(b.dataset.id)));
}

// Loadout Modal Logic
let activeLoadoutSurvivorId = null;

function openLoadoutForSurvivor(id) {
  activeLoadoutSurvivorId = id;
  const modal = el('loadoutModal');
  modal.style.display = 'flex';
  renderLoadoutContent();
  const btnClose = el('btnCloseLoadout');
  if (btnClose) btnClose.onclick = closeLoadoutModal;
}

function closeLoadoutModal() {
  const modal = el('loadoutModal');
  modal.style.display = 'none';
  activeLoadoutSurvivorId = null;
}

function renderLoadoutContent() {
  const cont = el('loadoutContent');
  const s = state.survivors.find(x => x.id === activeLoadoutSurvivorId);
  if (!s) { cont.innerHTML = '<div class="small">No survivor selected.</div>'; return; }

  const equippedWeapon = s.equipment.weapon ? `${s.equipment.weapon.name} ${s.equipment.weapon.durability !== undefined ? `(${s.equipment.weapon.durability}/${s.equipment.weapon.maxDurability})` : ''}` : 'None';
  const equippedArmor = s.equipment.armor ? `${s.equipment.armor.name} ${s.equipment.armor.durability !== undefined ? `(${s.equipment.armor.durability}/${s.equipment.armor.maxDurability})` : ''}` : 'None';

  const weapons = state.inventory.filter(i => i.type === 'rifle' || i.type === 'shotgun');
  const armors = state.inventory.filter(i => i.type === 'armor' || i.type === 'heavyArmor' || i.type === 'hazmatSuit');

  const weaponList = weapons.map(i => `<div class="inv-row"><span>${i.name} ${i.durability !== undefined ? `(${i.durability}/${i.maxDurability})` : ''}</span><button data-id="${i.id}" class="equip-weapon">Equip</button></div>`).join('') || '<div class="small">No weapons in inventory.</div>';
  const armorList = armors.map(i => `<div class="inv-row"><span>${i.name} ${i.durability !== undefined ? `(${i.durability}/${i.maxDurability})` : ''}</span><button data-id="${i.id}" class="equip-armor">Equip</button></div>`).join('') || '<div class="small">No armor in inventory.</div>';

  cont.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:16px">
      <div style="display:flex;gap:16px;flex-wrap:wrap">
        <div style="flex:1;min-width:260px">
          <div><strong>${s.name}</strong> <span class="small">Lvl ${s.level} • HP ${s.hp}/${s.maxHp}</span></div>
          <div class="small" style="margin-top:4px;color:var(--muted)">Ammo: ${state.resources.ammo}</div>
        </div>
      </div>
      <div style="display:flex;gap:16px;flex-wrap:wrap">
        <div style="flex:1;min-width:260px">
          <div style="margin-top:8px" class="card-like">
            <div><strong>Weapon</strong></div>
            <div class="small">${equippedWeapon}</div>
            <div style="margin-top:6px">
              ${s.equipment.weapon ? `<button id="btnUnequipWeapon">Unequip</button>` : '<span class="small" style="color:var(--muted)">Empty slot</span>'}
            </div>
          </div>
        </div>
        <div style="flex:1;min-width:260px">
          <div style="margin-top:8px" class="card-like">
            <div><strong>Armor</strong></div>
            <div class="small">${equippedArmor}</div>
            <div style="margin-top:6px">
              ${s.equipment.armor ? `<button id="btnUnequipArmor">Unequip</button>` : '<span class="small" style="color:var(--muted)">Empty slot</span>'}
            </div>
          </div>
        </div>
      </div>
      <div style="border-top:1px solid rgba(255,255,255,0.06);padding-top:12px">
        <div style="display:flex;gap:16px;flex-wrap:wrap">
          <div style="flex:1;min-width:260px">
            <div><strong>Inventory — Weapons</strong></div>
            <div style="margin-top:6px">${weaponList}</div>
          </div>
          <div style="flex:1;min-width:260px">
            <div><strong>Inventory — Armor</strong></div>
            <div style="margin-top:6px">${armorList}</div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Bind events
  const btnUW = document.getElementById('btnUnequipWeapon');
  if (btnUW) btnUW.onclick = () => { unequipFromSurvivor(s.id, 'weapon'); renderLoadoutContent(); };
  const btnUA = document.getElementById('btnUnequipArmor');
  if (btnUA) btnUA.onclick = () => { unequipFromSurvivor(s.id, 'armor'); renderLoadoutContent(); };
  cont.querySelectorAll('button.equip-weapon').forEach(b => {
    b.onclick = () => { equipItemToSurvivor(s.id, Number(b.dataset.id)); renderLoadoutContent(); };
  });
  cont.querySelectorAll('button.equip-armor').forEach(b => {
    b.onclick = () => { equipItemToSurvivor(s.id, Number(b.dataset.id)); renderLoadoutContent(); };
  });
}

function renderMap() {
  const grid = el('mapGrid');
  const { w, h } = state.mapSize;
  // Early-out if nothing relevant changed to prevent hover/focus flicker
  const snapshot = computeMapSnapshot();
  if (lastRenderedMapSnapshot === snapshot) {
    return; // skip re-render
  }
  lastRenderedMapSnapshot = snapshot;

  grid.style.gridTemplateColumns = `repeat(${w},1fr)`;
  grid.innerHTML = '';
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      const t = state.tiles[idx];
      const tile = document.createElement('div');
      tile.className = 'tile';

      // Add explored and base classes
      if (t.scouted || state.explored.has(idx)) tile.classList.add('explored');
      if (t.type === 'base') tile.classList.add('base');

      // Check if tile is explorable (adjacent to explored OR can be revisited)
      const tileObj = { x, y, idx };
      const canExplore = isExplorable(tileObj);
      
      if (canExplore) {
        tile.classList.add('explorable');
        // Add click handler for explorable tiles
        tile.onclick = () => exploreTile(idx);
        
        // Calculate energy cost with explorer bonuses
        const baseCost = getTileEnergyCost(t);
        const explorer = state.survivors.find(s => s.id === selectedExplorerId);
        let actualCost = baseCost;
        if (explorer && hasAbility(explorer, 'pathfinder')) {
          actualCost = Math.ceil(baseCost * 0.85); // -15% cost for Pathfinder
        }
        
        // Show energy cost in tooltip
        if (state.explored.has(idx) && t.cleared === false) {
          tile.classList.add('revisitable');
          if (t.type === 'hazard') {
            tile.title = `Hazard room (needs Hazmat Suit) - Energy: ${actualCost}`;
          } else if (t.type === 'alien') {
            tile.title = `Aliens remain - Energy: ${actualCost}`;
          } else {
            tile.title = `Click to re-explore (Energy: ${actualCost})`;
          }
        } else {
          tile.title = `Click to explore (Energy: ${actualCost})`;
        }
      } else if (state.explored.has(idx)) {
        tile.title = `${t.type} (Explored)`;
      } else {
        tile.title = 'Too far to explore';
      }

      const content = document.createElement('span');
      content.textContent = t.scouted ? (t.type === 'base' ? 'B' : (t.type[0] || '?').toUpperCase()) : '.';
      tile.appendChild(content);
      grid.appendChild(tile);
    }
  }
}

function renderInventory() {
  const inv = el('inventory');
  
  // Update capacity display
  const capacityEl = el('inventoryCapacity');
  const maxCapacity = getInventoryCapacity();
  const currentCount = state.inventory.length;
  capacityEl.textContent = `(${currentCount}/${maxCapacity})`;
  if (currentCount >= maxCapacity) {
    capacityEl.style.color = 'var(--danger)';
  } else if (currentCount >= maxCapacity * 0.8) {
    capacityEl.style.color = 'var(--warning)';
  } else {
    capacityEl.style.color = 'var(--muted)';
  }
  
  // Early-out to prevent hover/focus flicker: only re-render when inventory actually changes
  const snapshot = (() => {
    try {
      return JSON.stringify(state.inventory.map(i => ({ id: i.id, t: i.type, n: i.name, d: i.durability, m: i.maxDurability })));
    } catch (e) {
      return String(Math.random());
    }
  })();

  if (lastRenderedInventorySnapshot === snapshot) {
    return; // no changes; keep DOM as-is to preserve hover state
  }
  lastRenderedInventorySnapshot = snapshot;

  inv.innerHTML = '';
  if (state.inventory.length === 0) {
    inv.textContent = 'No crafted items.';
    return;
  }
  state.inventory.forEach(item => {
    const node = document.createElement('div');
    node.className = 'inv-item';
    let durabilityInfo = '';
    if (item.durability !== undefined) {
      durabilityInfo = ` (${item.durability}/${item.maxDurability})`;
    }
    // Capitalize first letter of item name
    const displayName = item.name || item.type;
    const capitalizedName = displayName.charAt(0).toUpperCase() + displayName.slice(1);
    node.textContent = `${capitalizedName}${durabilityInfo}`;
    if (item.durability < item.maxDurability) {
      const repairButton = document.createElement('button');
      repairButton.textContent = 'Repair';
      repairButton.onclick = () => repairItem(item.id);
      node.appendChild(repairButton);
    }
    inv.appendChild(node);
  });
}

function threatText() {
  // Show threat as a percentage (0-100%) instead of buckets
  const v = Math.max(0, Math.min(100, Number(state.threat) || 0));
  return `${Math.round(v)}%`;
}

function renderExpeditionSurvivorSelect() {
  const cont = el('expeditionSurvivorDropdown');
  const availableSurvivors = state.survivors.filter(s => !s.onMission);
  const availableSurvivorsSnapshot = JSON.stringify(availableSurvivors);

  if (lastRenderedAvailableSurvivors === availableSurvivorsSnapshot) {
    return;
  }
  lastRenderedAvailableSurvivors = availableSurvivorsSnapshot;

  cont.innerHTML = '';

  if (availableSurvivors.length === 0) {
    cont.textContent = 'No survivors available';
    return;
  }

  if (!selectedExpeditionSurvivorId || !availableSurvivors.some(s => s.id === selectedExpeditionSurvivorId)) {
    selectedExpeditionSurvivorId = availableSurvivors[0].id;
  }

  const dropdown = document.createElement('div');
  dropdown.className = 'task-dropdown';

  const button = document.createElement('button');
  button.className = 'task-dropdown-button';
  button.type = 'button';
  const selectedSurvivor = availableSurvivors.find(s => s.id === selectedExpeditionSurvivorId);
  button.textContent = selectedSurvivor ? selectedSurvivor.name : 'Select Survivor';

  const content = document.createElement('div');
  content.className = 'task-dropdown-content';

  availableSurvivors.forEach(s => {
    const item = document.createElement('div');
    item.className = 'task-dropdown-item' + (s.id === selectedExpeditionSurvivorId ? ' selected' : '');
    item.textContent = s.name;
    item.onclick = (e) => {
      e.stopPropagation();
      selectedExpeditionSurvivorId = s.id;
      button.textContent = s.name;
      dropdown.classList.remove('open');
      activeDropdown = null;
      // Re-render only the items to update the 'selected' class
      content.querySelectorAll('.task-dropdown-item').forEach(el => {
        el.classList.remove('selected');
      });
      item.classList.add('selected');
    };
    content.appendChild(item);
  });

  button.onclick = (e) => {
    e.stopPropagation();
    const currentlyOpen = dropdown.classList.contains('open');
    
    // Close all other dropdowns first
    document.querySelectorAll('.task-dropdown.open').forEach(el => {
      el.classList.remove('open');
      el.closest('.survivor-card')?.classList.remove('dropdown-open');
    });

    if (!currentlyOpen) {
      dropdown.classList.add('open');
      activeDropdown = { type: 'expedition' };
    } else {
      activeDropdown = null;
    }
  };

  if (activeDropdown && activeDropdown.type === 'expedition') {
    dropdown.classList.add('open');
  }

  dropdown.appendChild(button);
  dropdown.appendChild(content);
  cont.appendChild(dropdown);
}

// 0.8.1 - Render workbench with dynamic crafting costs
function renderWorkbench() {
  // Calculate cost multiplier from Technician abilities
  let costMult = 1;
  const technicians = state.survivors.filter(s => !s.onMission);
  for (const t of technicians) {
    if (hasAbility(t, 'resourceful')) costMult *= 0.90; // -10% cost
    if (hasAbility(t, 'prodigy')) costMult *= 0.75; // -25% cost
  }

  const key = `v1:${costMult.toFixed(3)}`;
  // Skip rerendering if costs haven't changed
  if (lastRenderedWorkbenchKey === key) return;
  lastRenderedWorkbenchKey = key;

  const workbench = el('workbench');
  if (!workbench) return;

  // Define recipes with their display info
  const recipes = [
    { item: 'medkit', label: 'Assemble Medkit', scrap: 15 },
    { item: 'ammo', label: 'Manufacture Ammo', scrap: 10 },
    { item: 'turret', label: 'Construct Auto-Turret', scrap: 75, energy: 40, tech: 3 },
    { item: 'armor', label: 'Craft Light Armor', scrap: 40, tech: 3 },
    { item: 'rifle', label: 'Build Pulse Rifle', scrap: 55, tech: 5, weaponPart: 1 },
    { item: 'heavyArmor', label: 'Craft Heavy Armor', scrap: 70, tech: 5 },
    { item: 'shotgun', label: 'Build Shotgun', scrap: 65, tech: 4, weaponPart: 1 },
    { item: 'hazmatSuit', label: 'Craft Hazmat Suit', scrap: 85, tech: 6 }
  ];

  // Rebuild workbench buttons when cost structure changes
  workbench.innerHTML = '';
  recipes.forEach(r => {
    const button = document.createElement('button');
    button.dataset.item = r.item;

    // Calculate actual costs with multiplier
    const scrapCost = Math.ceil((r.scrap || 0) * costMult);
    const energyCost = Math.ceil((r.energy || 0) * costMult);
    const techCost = Math.ceil((r.tech || 0) * costMult);
    const weaponPartCost = r.weaponPart || 0;

    // Build cost string
    let costParts = [];
    if (scrapCost > 0) costParts.push(`Scrap ${scrapCost}`);
    if (energyCost > 0) costParts.push(`Energy ${energyCost}`);
    if (techCost > 0) costParts.push(`Tech ${techCost}`);
    if (weaponPartCost > 0) costParts.push(`Parts ${weaponPartCost}`);

    const costStr = costParts.length > 0 ? ` (${costParts.join(', ')})` : '';

    // Show original cost if different (discount applied)
    if (costMult < 1) {
      let originalParts = [];
      if (r.scrap > 0) originalParts.push(`${r.scrap}`);
      if (r.energy > 0) originalParts.push(`${r.energy}`);
      if (r.tech > 0) originalParts.push(`${r.tech}`);
      if (r.weaponPart > 0) originalParts.push(`${r.weaponPart}p`);
      button.innerHTML = `${r.label}${costStr} <span style="text-decoration:line-through;color:var(--muted);font-size:11px">${originalParts.join('/')}</span>`;
    } else {
      button.textContent = `${r.label}${costStr}`;
    }

    button.onclick = () => {
      craft(r.item);
      saveGame('action');
      updateUI();
    };

    workbench.appendChild(button);
  });
}
