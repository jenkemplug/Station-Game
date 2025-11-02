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
  
  el('btnNewMap').onclick = generateNewMap;

  // 0.8.0 - System repair buttons
  el('btnRepairFilter').onclick = () => {
    repairSystem('filter');
  };
  el('btnRepairGenerator').onclick = () => {
    repairSystem('generator');
  };
  el('btnRepairTurret').onclick = () => {
    repairSystem('turret');
  };
  
  // 0.9.0 - Base repair button
  el('btnRepairBase').onclick = () => {
    repairBase();
    saveGame('action');
    updateUI();
  };

  // 0.8.1 - Workbench buttons now dynamically rendered in renderWorkbench()

  // Bind inventory action buttons
  el('btnAutoSalvage').onclick = () => {
    autoSalvage();
    saveGame('action');
  };
  
  el('btnRecycleAll').onclick = (e) => {
    recycleAllItems(e);
    saveGame('action');
  };

  el('btnRepairItems').onclick = openRepairModal;

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
    oxygen: 100,
    food: 40,
    energy: 50,
    scrap: 35,
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
  state.inventoryCapacity = 30;
  state.equipment = {
    turrets: 0,
    bulkhead: 0
  };
  state.systems = {
    filter: 0,
    generator: 0,
    turret: 0
  };
  state.systemFailures = [];
  state.threat = 8;
  state.baseIntegrity = 100;
  state.raidChance = 0;
  state.lastRaidAt = 0;
  state.raidCooldownMs = 0;
  state.alienKills = 0;
  state.raidPressure = 0;
  state.lastThreatNoticeAt = 0;
  // 0.8.10 - Reset tier floors for new game
  state.highestThreatTier = 0;
  state.highestRaidTier = 0;
  state.gameOver = false; // Reset game over flag
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
      triggerGameOver('Base integrity compromised. All systems have failed.');
    }
  }
}

// Game Over Function
function triggerGameOver(message) {
  appendLog(message);
  appendLog('=== GAME OVER ===');
  state.gameOver = true; // Mark game as over
  saveGame('action'); // Save the game over state
  clearInterval(loopHandle);
  
  // Display game over modal
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.style.display = 'flex';
  overlay.innerHTML = `
    <div class="modal-card" style="text-align:center;max-width:500px">
      <h2 style="color:var(--danger);margin-bottom:16px">GAME OVER</h2>
      <p style="margin-bottom:24px;color:var(--text)">${message}</p>
      <div style="display:flex;gap:12px;justify-content:center">
        <button id="btnGameOverReset" class="primary">Start New Game</button>
        <button id="btnGameOverLoad" class="danger">Load Save</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  
  document.getElementById('btnGameOverReset').onclick = () => {
    if (!confirm('Start a new game? This will erase your current save.')) return;
    // Remove overlay first
    document.body.removeChild(overlay);
    // Clear the save
    localStorage.removeItem(GAME_KEY);
    // Reload the page to start fresh
    location.reload();
  };
  document.getElementById('btnGameOverLoad').onclick = () => {
    document.body.removeChild(overlay);
    // Trigger file import
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const parsed = JSON.parse(ev.target.result);
          localStorage.setItem(GAME_KEY, JSON.stringify(parsed));
          appendLog('[Imported save]');
          location.reload();
        } catch (err) {
          alert('Failed to load save file: ' + err.message);
        }
      };
      reader.readAsText(file);
    };
    fileInput.click();
  };
}

// Initial load and startup
let loopHandle;
loadGame();

// Check if this is a game over state
if (state.gameOver) {
  // Re-trigger game over modal (page was reloaded on game over screen)
  updateUI(); // Update UI first so the background isn't black
  bindUI();
  
  // Define handler functions globally so inline onclick can access them
  window.handleGameOverReset = function() {
    console.log('Reset button clicked!');
    if (!confirm('Start a new game? This will erase your current save.')) return;
    localStorage.removeItem(GAME_KEY);
    location.reload();
  };
  
  window.handleGameOverLoad = function() {
    console.log('Load button clicked!');
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.onchange = function(e) {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function(ev) {
        try {
          const parsed = JSON.parse(ev.target.result);
          localStorage.setItem(GAME_KEY, JSON.stringify(parsed));
          location.reload();
        } catch (err) {
          alert('Failed to load save file: ' + err.message);
        }
      };
      reader.readAsText(file);
    };
    fileInput.click();
  };
  
  // Create and show game over modal
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.9);display:flex;align-items:center;justify-content:center;z-index:99999;';
  overlay.innerHTML = `
    <div class="modal-card" style="text-align:center;max-width:500px;">
      <h2 style="color:var(--danger);margin-bottom:16px">GAME OVER</h2>
      <p style="margin-bottom:24px;color:var(--text)">Your previous game ended. Start a new game or load a save.</p>
      <div style="display:flex;gap:12px;justify-content:center">
        <button onclick="handleGameOverReset()" class="primary" style="cursor:pointer;">Start New Game</button>
        <button onclick="handleGameOverLoad()" class="danger" style="cursor:pointer;">Load Save</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
} else {
  // Normal game startup
  if (state.survivors.length === 0) {
    // Starter survivors are free (pass random name to skip cost)
    const starterName1 = getRandomName();
    const starterName2 = getRandomName();
    recruitSurvivor(starterName1);
    recruitSurvivor(starterName2);
    // Add initial junk items (0.9.0 - marked as common rarity for UI coloring)
    for (let i = 0; i < 3; i++) {
      state.inventory.push({ id: state.nextItemId++, type: 'junk', name: 'Junk', rarity: 'common' });
    }
    saveGame('action');
  }
  updateUI();
  bindUI();
  loopHandle = setInterval(mainLoop, 1000);
  setInterval(() => saveGame('auto'), 15000);
}
