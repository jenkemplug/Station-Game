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

function updateUI() {
  // resources
  el('res-oxygen').textContent = `O₂: ${Math.floor(state.resources.oxygen)}`;
  el('res-food').textContent = `Food: ${Math.floor(state.resources.food)}`;
  el('res-energy').textContent = `Energy: ${Math.floor(state.resources.energy)}`;
  el('res-scrap').textContent = `Scrap: ${Math.floor(state.resources.scrap)}`;
  el('res-oxygen-rate').textContent = `${state.production.oxygen.toFixed(1)}/s`;
  el('res-food-rate').textContent = `${state.production.food.toFixed(1)}/s`;
  el('res-energy-rate').textContent = `${state.production.energy.toFixed(1)}/s`;
  el('res-scrap-rate').textContent = `${state.production.scrap.toFixed(1)}/s`;

  // survivors
  el('survivorCount').textContent = state.survivors.length;
  renderSurvivors();

  // systems
  el('sys-filter').textContent = `Level ${state.systems.filter}`;
  el('sys-generator').textContent = `Level ${state.systems.generator}`;
  el('sys-turret').textContent = state.systems.turret > 0 ? `${state.systems.turret} turret(s)` : 'Offline';

  // inventory
  renderInventory();

  // map
  renderMap();
  el('mapInfo').textContent = `Explored: ${state.explored.size}/${state.mapSize.w * state.mapSize.h}`;

  // threats
  el('threatLevel').textContent = threatText();
  el('baseIntegrity').textContent = `${Math.max(0, Math.floor(state.baseIntegrity))}%`;
  el('boardRisk').textContent = `${Math.round(state.boardRisk * 100)}%`;

  // journal
  el('journal').textContent = state.journal.slice(-5).join(' ');
  el('timePlayed').textContent = `Played: ${formatTime(state.secondsPlayed)}`;

  // (loot preview removed)
  el('statTech').textContent = state.resources.tech;
  el('statAmmo').textContent = state.resources.ammo;

  renderExpeditionSurvivorSelect();
}

function renderSurvivors() {
  const cont = el('survivorList');

  // Create a snapshot of the current survivor state
  const currentSurvivorsSnapshot = JSON.stringify(state.survivors);

  // If the survivor data hasn't changed, don't re-render
  if (lastRenderedSurvivors === currentSurvivorsSnapshot) {
    return;
  }

  lastRenderedSurvivors = currentSurvivorsSnapshot;

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
    }    card.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div><strong style="color:var(--accent)">${s.name}</strong><div class="small">Lvl ${s.level} • ${s.onMission ? 'On Expedition' : (s.task || 'Idle')}</div></div>
        <div class="small">${healthPct}% HP • Morale ${morale}</div>
      </div>
      <div style="margin-top:6px" class="small">
        Skill: ${s.skill} • Exp: ${s.xp}/${s.nextXp} ${s.injured ? ' • Injured' : ''}
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
  cont.querySelectorAll('button.equip').forEach(b => b.onclick = () => equipBest(Number(b.dataset.id)));
}

function renderMap() {
  const grid = el('mapGrid');
  const { w, h } = state.mapSize;
  grid.style.gridTemplateColumns = `repeat(${w},1fr)`;
  grid.innerHTML = '';
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      const t = state.tiles[idx];
      const tile = document.createElement('div');
      tile.className = 'tile';
      if (t.scouted || state.explored.has(idx)) tile.classList.add('explored');
      if (t.type === 'base') tile.classList.add('base');
      tile.title = t.scouted ? `${t.type}` : `Unexplored`;
      const content = document.createElement('span');
      content.textContent = t.scouted ? (t.type === 'base' ? 'B' : (t.type[0] || '?').toUpperCase()) : '.';
      tile.appendChild(content);
      grid.appendChild(tile);
    }
  }
}

function renderInventory() {
  const inv = el('inventory');
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
    node.textContent = `${item.name || item.type}${durabilityInfo}`;
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
  const v = state.threat;
  if (v < 15) return 'Low';
  if (v < 35) return 'Moderate';
  if (v < 60) return 'High';
  return 'Critical';
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
