function bindUI() {
  el('btnAssign').onclick = () => {
    recruitSurvivor();
    saveGame('action');
    updateUI();
  };
  el('btnExpedition').onclick = () => {
    startExpedition('Deep Run', 45);
    saveGame('action');
    updateUI();
  };

  el('btnUpgradeFilter').onclick = upgradeFilter;
  el('btnUpgradeGen').onclick = upgradeGenerator;
  el('btnBuildTurret').onclick = buildTurret;

  el('workbench').querySelectorAll('button').forEach(btn => {
    btn.onclick = (e) => {
      craft(btn.dataset.item);
      saveGame('action');
      updateUI();
    };
  });

  // Bind inventory action buttons
  el('btnAutoSalvage').onclick = () => {
    autoSalvage();
    saveGame('action');
  };
  el('btnDumpJunk').onclick = () => {
    const initialCount = state.inventory.length;
    state.inventory = state.inventory.filter(item => item.type !== 'junk');
    const removedCount = initialCount - state.inventory.length;
    if (removedCount > 0) {
      appendLog(`Discarded ${removedCount} junk items.`);
    } else {
      appendLog('No junk to discard.');
    }
    updateUI();
    saveGame('action');
  };

  el('btnSave').onclick = () => {
    saveGame('manual');
  };
  el('btnReset').onclick = resetGame;

  el('btnExport').onclick = exportSave;
  el('btnImport').onclick = () => el('importFile').click();
  el('importFile').addEventListener('change', (ev) => {
    const f = ev.target.files && ev.target.files[0];
    if (f) handleImportFile(f);
    ev.target.value = '';
  });

  document.addEventListener('keydown', e => {
    const k = (e.key || '').toLowerCase();
    
    // Debug panel toggle (Ctrl+D)
    if (e.ctrlKey && k === 'd') {
      e.preventDefault();
      toggleDebugPanel();
      return;
    }

    // Existing shortcuts
    if (k === 'r') {
      recruitSurvivor();
    }
    if (k === 'f') {
      craft('filter');
    }

  });

  // Close dropdowns when clicking outside
  document.addEventListener('mousedown', (e) => {
    // Only close if clicking outside any dropdown
    if (!e.target.closest('.task-dropdown')) {
      document.querySelectorAll('.task-dropdown').forEach(dropdown => {
        dropdown.classList.remove('open');
      });
      activeTaskDropdownId = null;
    }
  }, true);

  // Debug panel close button
  el('btnCloseDebug').onclick = () => {
    el('debugPanel').style.display = 'none';
  };
}

function resetGame() {
  if (!confirm('Reset and erase save?')) return;
  // remove persistent save
  localStorage.removeItem(GAME_KEY);
  // reset runtime state to defaults (preserve map size/base)
  state.startedAt = Date.now();
  state.lastTick = Date.now();
  state.secondsPlayed = 0;
  state.resources = {
    oxygen: 60,
    food: 30,
    energy: 40,
    scrap: 25,
    tech: 0,
    ammo: 10
  };
  state.production = {
    oxygen: 0,
    food: 0,
    energy: 0,
    scrap: 0
  };
  state.survivors = [];
  state.nextSurvivorId = 1;
  state.tiles = [];
  state.explored = new Set();
  state.inventory = [];
  state.nextItemId = 1;
  state.equipment = {
    turrets: 0,
    bulkhead: 0
  };
  state.systems = {
    filter: 0,
    generator: 0,
    turret: 0
  };
  state.threat = 8;
  state.baseIntegrity = 100;
  state.boardRisk = 0;
  state.journal = ["Station systems nominal. Maintain discipline."];
  state.missions = [];
  initTiles();
  saveGame();
  location.reload();
}

function exportSave() {
  try {
    const snap = makeSaveSnapshot();
    const blob = new Blob([JSON.stringify(snap, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${GAME_KEY}_save_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    appendLog('[Exported save]');
  } catch (e) {
    console.error(e);
    appendLog('[Export failed]');
  }
}

function handleImportFile(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      // basic validation
      if (parsed && typeof parsed === 'object') {
        localStorage.setItem(GAME_KEY, JSON.stringify(parsed));
        appendLog('[Imported save]');
        // reload state from imported save
        loadGame();
        updateUI();
      } else appendLog('[Import failed: invalid file]');
    } catch (e) {
      console.error(e);
      appendLog('[Import failed: parse error]');
    }
  };
  reader.readAsText(file);
}

function mainLoop() {
  const now = Date.now();
  if (now - state.lastTick >= TICK_MS - 20) {
    applyTick(false);
    updateUI();
    // check game over
    if (state.baseIntegrity <= 0) {
      appendLog('Base integrity failed. Game over.');
      clearInterval(loopHandle);
    }
  }
}

// Initial load and startup
loadGame();
if (state.survivors.length === 0) {
  recruitSurvivor('Elias');
  recruitSurvivor('Marta'); // starter survivors
  // Add initial junk items
  for (let i = 0; i < 3; i++) {
    state.inventory.push({ id: state.nextItemId++, type: 'junk', name: 'Junk' });
  }
  saveGame('action');
}
updateUI();
bindUI();
const loopHandle = setInterval(mainLoop, 1000);
setInterval(() => saveGame('auto'), 15000);
