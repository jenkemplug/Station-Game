// Save/Load System
// Handles game persistence, save snapshots, and offline progress

function pickLoot(qualityBonus = 0, terrain = null) {
  // qualityBonus increases chance of better loot (0.0 to 1.0+)
  // terrain = room type for sector-specific loot (1.0)
  
  // 1.0 - Use sector-specific loot table if in a special room
  let lootTable = LOOT_TABLE;
  if (terrain && SECTOR_LOOT[terrain]) {
    lootTable = SECTOR_LOOT[terrain];
    qualityBonus += 0.3; // Sector loot is inherently better quality
  }
  
  // 1.0 Rebalance - Gate rarities behind threat levels
  const currentThreat = state.threat || 0;
  lootTable = lootTable.filter(item => {
    // Common: Always available
    if (item.rarity === 'common') return true;
    // Uncommon: Available at 15%+ threat
    if (item.rarity === 'uncommon') return currentThreat >= 15;
    // Rare: Available at 35%+ threat
    if (item.rarity === 'rare') return currentThreat >= 35;
    // Very Rare/Legendary: Available at 60%+ threat
    if (item.rarity === 'veryrare' || item.rarity === 'legendary') return currentThreat >= 60;
    return true; // Allow items without rarity
  });
  
  // 1.0 - Filter loot table based on mission completion progression
  // Only show keycards for the NEXT mission in sequence (based on sector unlocks)
  // After completing a mission, the sector name is added to state.successfulMissions
  const sectorToNextKeycard = {
    // Start of game: can find medicalBay keycard
    'medicalBay': 'engineeringDeck',
    'engineeringDeck': 'securityWing',
    'securityWing': 'crewQuarters',
    'crewQuarters': 'researchLabs',
    'researchLabs': 'shoppingMall',
    'shoppingMall': 'maintenanceHub',
    'maintenanceHub': 'communications',
    'communications': 'cargoBay',
    'cargoBay': 'corporateOffices',
    'corporateOffices': 'reactorChamber',
    'reactorChamber': 'observationDeck',
    'observationDeck': 'hangarBay'
  };
  
  // Determine which keycard should be available based on last completed sector
  let availableKeycard = 'medicalBay'; // Default: can always find mission 1 keycard
  
  for (const [sectorName, nextKeycard] of Object.entries(sectorToNextKeycard)) {
    if (state.successfulMissions.includes(sectorName)) {
      availableKeycard = nextKeycard; // Update to next keycard in chain
    }
  }
  
  lootTable = lootTable.filter(item => {
    // Remove all keycard items except the one unlocked by mission progression
    if (item.type.includes('Keycard')) {
      return item.type === `${availableKeycard}Keycard`;
    }
    return true;
  });
  
  // Rarity weight adjustments based on quality
  const adjustedTable = lootTable.map(item => {
    let weight = item.weight;
    if (qualityBonus > 0) {
      // Increase weight of uncommon/rare/veryrare items
      if (item.rarity === 'uncommon') weight *= (1 + qualityBonus * 0.5);
      if (item.rarity === 'rare') weight *= (1 + qualityBonus * 1.0);
      if (item.rarity === 'veryrare') weight *= (1 + qualityBonus * 2.0);
      // Decrease weight of common items
      if (item.rarity === 'common') weight *= (1 - qualityBonus * 0.3);
    }
    return { ...item, adjustedWeight: Math.max(0.1, weight) };
  });
  
  const total = adjustedTable.reduce((s, i) => s + i.adjustedWeight, 0);
  let t = Math.random() * total;
  for (const l of adjustedTable) {
    t -= l.adjustedWeight;
    if (t <= 0) {
      // If using sector loot, return the full loot item from LOOT_TABLE
      if (terrain && SECTOR_LOOT[terrain]) {
        const fullItem = LOOT_TABLE.find(li => li.type === l.type);
        return fullItem || l;
      }
      return l;
    }
  }
  return adjustedTable[0];
}

function initTiles() {
  // 1.0 - Blueprint System: Load Hand-Crafted Station Map
  const mapData = parseStationMap();
  
  // Update state dimensions to match map
  state.fullMap.width = mapData.width;
  state.fullMap.height = mapData.height;
  state.baseTile.x = mapData.basePos.x;
  state.baseTile.y = mapData.basePos.y;
  
  // Load tiles from map
  state.tiles = mapData.tiles;
  
  // Mark base as explored
  const baseIdx = mapData.basePos.idx;
  state.tiles[baseIdx].scouted = true;
  state.explored.add(baseIdx);
  state.visible.add(baseIdx);
  state.seen.add(baseIdx);
  
  // Randomly spawn content on valid tiles based on terrain type
  state.tiles.forEach((tile, idx) => {
    // Skip base, baseRoom, mission doors, hangar, walls, and void
    if (tile.content || tile.terrain === 'wall' || tile.terrain === 'void' || tile.terrain === 'baseRoom') return;
    
    // Define spawn chances per terrain type
    let survivorChance = 0;
    let lootChance = 0;
    let alienChance = 0;
    let hostileChance = 0; // 1.0 - Hostile survivors
    
    if (tile.terrain === 'corridor') {
      survivorChance = 0.002;  // 0.2% per corridor tile (was 0.5% - 60% reduction)
      lootChance = 0.012;      // 1.2% per corridor tile (was 1.5% - 20% reduction)
      alienChance = 0.025;     // 2.5% per corridor tile (was 1% - 150% increase)
      hostileChance = 0.005;   // 0.5% (was 0.3% - 67% increase)
    } else if (tile.terrain === 'room') {
      survivorChance = 0.006;  // 0.6% per generic room tile (was 1% - 40% reduction)
      lootChance = 0.025;      // 2.5% per generic room tile (was 3% - 17% reduction)
      alienChance = 0.04;      // 4% per generic room tile (was 2% - 100% increase)
      hostileChance = 0.008;   // 0.8% (was 0.5% - 60% increase)
    } else if (tile.terrain === 'medicalBay') {
      survivorChance = 0.03;   // 3% (was 5% - 40% reduction)
      lootChance = 0.07;       // 7% - medical supplies (was 8% - 13% reduction)
      alienChance = 0.02;      // 2% (was 1% - 100% increase)
      hostileChance = 0.015;   // 1.5% - desperate survivors (was 1% - 50% increase)
    } else if (tile.terrain === 'engineeringDeck') {
      lootChance = 0.09;       // 9% - tech/parts (was 10% - 10% reduction)
      alienChance = 0.06;      // 6% (was 3% - 100% increase)
      hostileChance = 0.012;   // 1.2% (was 0.8% - 50% increase)
    } else if (tile.terrain === 'securityWing') {
      lootChance = 0.07;       // 7% - weapons/armor (was 8% - 13% reduction)
      alienChance = 0.08;      // 8% - contested area (was 5% - 60% increase)
      hostileChance = 0.022;   // 2.2% - heavily armed hostiles (was 1.5% - 47% increase)
    } else if (tile.terrain === 'crewQuarters') {
      survivorChance = 0.05;   // 5% (was 8% - 38% reduction)
      lootChance = 0.035;      // 3.5% - personal items (was 4% - 13% reduction)
      alienChance = 0.04;      // 4% (was 2% - 100% increase)
      hostileChance = 0.018;   // 1.8% - territorial survivors (was 1.2% - 50% increase)
    } else if (tile.terrain === 'researchLabs') {
      lootChance = 0.08;       // 8% - rare tech (was 9% - 11% reduction)
      alienChance = 0.07;      // 7% (was 4% - 75% increase)
      hostileChance = 0.010;   // 1.0% (was 0.6% - 67% increase)
    } else if (tile.terrain === 'shoppingMall') {
      lootChance = 0.11;       // 11% - high loot area (was 12% - 8% reduction)
      alienChance = 0.04;      // 4% (was 2% - 100% increase)
      hostileChance = 0.015;   // 1.5% - looters (was 1% - 50% increase)
    } else if (tile.terrain === 'maintenanceHub') {
      lootChance = 0.065;      // 6.5% - tools/repair (was 7% - 7% reduction)
      alienChance = 0.06;      // 6% (was 3% - 100% increase)
      hostileChance = 0.008;   // 0.8% (was 0.5% - 60% increase)
    } else if (tile.terrain === 'communications') {
      lootChance = 0.05;       // 5% - electronics (unchanged)
      alienChance = 0.06;      // 6% (was 3% - 100% increase)
      hostileChance = 0.011;   // 1.1% (was 0.7% - 57% increase)
    } else if (tile.terrain === 'cargoBay') {
      lootChance = 0.14;       // 14% - good loot area (was 15% - 7% reduction)
      alienChance = 0.10;      // 10% - heavily infested (was 6% - 67% increase)
      hostileChance = 0.018;   // 1.8% - scavenger gangs (was 1.2% - 50% increase)
    } else if (tile.terrain === 'corporateOffices') {
      lootChance = 0.06;       // 6% - luxury items (unchanged)
      alienChance = 0.04;      // 4% (was 2% - 100% increase)
      hostileChance = 0.012;   // 1.2% (was 0.8% - 50% increase)
    } else if (tile.terrain === 'reactorChamber') {
      lootChance = 0.08;       // 8% - power components (unchanged)
      alienChance = 0.14;      // 14% - very dangerous (was 8% - 75% increase)
      hostileChance = 0.006;   // 0.6% - few survive here (was 0.4% - 50% increase)
    } else if (tile.terrain === 'observationDeck') {
      survivorChance = 0.02;   // 2% (was 3% - 33% reduction)
      lootChance = 0.04;       // 4% (unchanged)
      alienChance = 0.02;      // 2% (was 1% - 100% increase)
      hostileChance = 0.009;   // 0.9% (was 0.6% - 50% increase)
    } else if (tile.terrain === 'hangarBay') {
      lootChance = 0.09;       // 9% - ship parts (was 10% - 10% reduction)
      alienChance = 0.12;      // 12% - final area danger (was 7% - 71% increase)
      hostileChance = 0.015;   // 1.5% - desperate escapees (was 1% - 50% increase)
    }
    
    // Roll for content (only one type per tile)
    const roll = Math.random();
    if (roll < hostileChance) {
      tile.content = 'hostile';
    } else if (roll < hostileChance + alienChance) {
      tile.content = 'alien';
    } else if (roll < hostileChance + alienChance + survivorChance) {
      tile.content = 'survivor';
    } else if (roll < hostileChance + alienChance + survivorChance + lootChance) {
      tile.content = 'resource';
    }
  });
  
  // Assign mission IDs to mission doors based on available missions
  const availableMissions = Object.keys(AWAY_MISSIONS);
  const sortedDoors = Object.keys(mapData.missionDoors).sort((a, b) => a - b);
  
  sortedDoors.forEach((doorNum, index) => {
    const doorInfo = mapData.missionDoors[doorNum];
    if (index < availableMissions.length) {
      const missionId = availableMissions[index];
      state.tiles[doorInfo.idx].missionId = missionId;
    }
  });
  
  // Center viewport on base
  centerViewportOnPosition(mapData.basePos.x, mapData.basePos.y);
  
  appendLog('🛰️ Derelict station systems online. 12 sealed sectors detected. Explore to survive.');
}

function generateNewMap() {
  const totalTiles = state.fullMap.width * state.fullMap.height;
  if (state.explored.size < totalTiles) {
    appendLog('Map must be fully explored to generate a new one.');
    return;
  }

  // Generate a new map layout
  initTiles();

  // Clear explored set, but keep the base tile explored
  state.explored.clear();
  const baseIdx = getTileIndex(state.baseTile.x, state.baseTile.y);
  state.explored.add(baseIdx);

  // Provide a reward for clearing the map
  const scrapReward = 100;
  const techReward = 10;
  state.resources.scrap += scrapReward;
  state.resources.tech += techReward;

  appendLog(`Map cleared! You've been awarded ${scrapReward} scrap and ${techReward} tech.`);
  appendLog('A new map has been generated.');

  // Update the UI to reflect the new map and rewards
  updateUI();
  saveGame('action');
}

function makeSaveSnapshot() {
  // pick properties explicitly to avoid serializing methods or unexpected types
  return {
    _version: '1.0.0', // 1.0 - Blueprint System
    startedAt: state.startedAt,
    lastTick: state.lastTick,
    secondsPlayed: state.secondsPlayed,
    resources: state.resources,
    production: state.production,
    survivors: state.survivors,
    nextSurvivorId: state.nextSurvivorId,
    nextItemId: state.nextItemId,
    tiles: state.tiles,
    // 1.0 - Viewport system
    fullMap: state.fullMap,
    viewport: state.viewport,
    explorerPos: state.explorerPos,
    isExploring: state.isExploring,
    mapSize: state.mapSize, // Deprecated but kept for compatibility
    baseTile: state.baseTile,
    explored: Array.from(state.explored || []),
    inventory: state.inventory,
    inventoryCapacity: state.inventoryCapacity,
    equipment: state.equipment,
    systems: state.systems,
    systemFailures: state.systemFailures,
    threat: state.threat,
    baseIntegrity: state.baseIntegrity,
    raidChance: state.raidChance,
    lastRaidAt: state.lastRaidAt,
    raidCooldownMs: state.raidCooldownMs,
    alienKills: state.alienKills,
    raidPressure: state.raidPressure,
    lastThreatNoticeAt: state.lastThreatNoticeAt,
    selectedExplorerId: state.selectedExplorerId,
    selectedExpeditionSurvivorId: state.selectedExpeditionSurvivorId,
    highestThreatTier: state.highestThreatTier,
    highestRaidTier: state.highestRaidTier,
    escalationLevel: state.escalationLevel,
    lastEscalationTime: state.lastEscalationTime,
    threatLocked: state.threatLocked,
    activeMissions: state.activeMissions,
    completedMissions: state.completedMissions,
    keycards: state.keycards, // 1.0 - Unlocked sectors
    successfulMissions: state.successfulMissions, // 1.0 - Successful mission completions
    timeNow: Date.now()
  };
}

function saveGame(type = 'action') {
  try {
    const snap = makeSaveSnapshot();
    localStorage.setItem(GAME_KEY, JSON.stringify(snap));

    switch (type) {
      case 'manual':
        appendLog('Manual save complete.');
        break;
      case 'auto':
        autoSaveCounter = (autoSaveCounter + 1) % 10;
        if (autoSaveCounter === 0) {
          appendLog('[Game autosaved]');
        }
        break;
      case 'action':
        // Action saves are now silent to reduce log spam.
        break;
    }
  } catch (e) {
    console.error('Save failed', e);
    appendLog('[Save failed: see console]');
  }
}

function loadGame() {
  const raw = localStorage.getItem(GAME_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      // Basic sanity: if parsed looks like a snapshot, restore fields we expect
      if (parsed && typeof parsed === 'object') {
        // Map basic props
        state.startedAt = parsed.startedAt || state.startedAt;
        state.lastTick = parsed.lastTick || state.lastTick;
        state.secondsPlayed = parsed.secondsPlayed || state.secondsPlayed;
        state.resources = Object.assign({}, state.resources, parsed.resources || {});
        state.production = Object.assign({}, state.production, parsed.production || {});
        state.survivors = Array.isArray(parsed.survivors) ? parsed.survivors : state.survivors;
        state.nextSurvivorId = parsed.nextSurvivorId || state.nextSurvivorId;
        state.tiles = Array.isArray(parsed.tiles) && parsed.tiles.length > 0 ? parsed.tiles : state.tiles;
        
        // 1.0 - Viewport system migration
        if (parsed.fullMap) {
          state.fullMap = parsed.fullMap;
        }
        if (parsed.viewport) {
          state.viewport = parsed.viewport;
        }
        state.explorerPos = parsed.explorerPos || null;
        state.isExploring = !!parsed.isExploring;
        
        state.mapSize = parsed.mapSize || state.mapSize;
        state.baseTile = parsed.baseTile || state.baseTile;
        state.explored = Array.isArray(parsed.explored) ? new Set(parsed.explored) : new Set();
        
        // Handle inventory migration from object to array
        if (Array.isArray(parsed.inventory)) {
          state.inventory = parsed.inventory;
        } else {
          state.inventory = []; // Reset inventory for old save formats
        }
        state.nextItemId = parsed.nextItemId || 1;
        state.inventoryCapacity = Number(parsed.inventoryCapacity) || 30;

        state.equipment = Object.assign({}, state.equipment, parsed.equipment || {});
        state.systems = Object.assign({}, state.systems, parsed.systems || {});
        state.systemFailures = Array.isArray(parsed.systemFailures) ? parsed.systemFailures : [];
        state.threat = Number(parsed.threat) || state.threat;
    state.baseIntegrity = Number(parsed.baseIntegrity) || state.baseIntegrity;
  // raidChance is derived; load if present else default 0
  state.raidChance = Number(parsed.raidChance) || 0;
  state.lastRaidAt = Number(parsed.lastRaidAt) || 0;
  state.raidCooldownMs = Number(parsed.raidCooldownMs) || 0;
  state.alienKills = Number(parsed.alienKills) || 0;
  state.raidPressure = Number(parsed.raidPressure) || 0;
  state.lastThreatNoticeAt = Number(parsed.lastThreatNoticeAt) || 0;
        state.activeMissions = Array.isArray(parsed.activeMissions) ? parsed.activeMissions : [];
        state.completedMissions = Array.isArray(parsed.completedMissions) ? parsed.completedMissions : [];
        state.keycards = Array.isArray(parsed.keycards) ? parsed.keycards : []; // 1.0 - No starting keycards
        state.successfulMissions = Array.isArray(parsed.successfulMissions) ? parsed.successfulMissions : []; // 1.0 - Mission replay tracking
        state.timeNow = parsed.timeNow || Date.now();
        
        // Restore UI selections
        state.selectedExplorerId = parsed.selectedExplorerId || null;
        state.selectedExpeditionSurvivorId = parsed.selectedExpeditionSurvivorId || null;
        
        // 0.8.9 - Restore tier tracking
        state.highestThreatTier = Number(parsed.highestThreatTier) || 0;
        state.highestRaidTier = Number(parsed.highestRaidTier) || 0;
        
        // 0.9.0 - Restore escalation system
        state.escalationLevel = Number(parsed.escalationLevel) || 0;
        state.lastEscalationTime = Number(parsed.lastEscalationTime) || 0;
        state.threatLocked = !!parsed.threatLocked;

        // sanitize numeric resource fields
        for (const k of ['oxygen', 'food', 'energy', 'scrap', 'tech', 'ammo']) {
          state.resources[k] = Number(state.resources[k]) || 0;
        }
        for (const k of ['oxygen', 'food', 'energy', 'scrap']) {
          state.production[k] = Number(state.production[k]) || 0;
        }
        // ensure survivors numeric fields
        state.survivors = state.survivors.map(s => {
          const migratedSurvivor = {
            id: Number(s.id) || 0,
            name: s.name || 'Unknown',
            level: Number(s.level) || 1,
            xp: Number(s.xp) || 0,
            nextXp: Number(s.nextXp) || 50,
            skill: Number(s.skill) || 1,
            hp: Number(s.hp) || 1,
            maxHp: Number(s.maxHp) || 1,
            morale: Number(s.morale) || 0,
            role: s.role || 'Idle',
            task: s.task || 'Idle',
            injured: !!s.injured,
            downed: !!s.downed, // 0.8.0 - Revival system
            equipment: s.equipment || { weapon: null, armor: null },
            // 0.8.0 - Migration: add class/abilities for old saves
            class: s.class || assignRandomClass(),
            abilities: Array.isArray(s.abilities) ? s.abilities : (s.class ? rollAbilities(s.class) : [])
          };
          
          // 0.8.10 - Migration: roll class bonuses for existing survivors without them
          if (!s.classBonuses && migratedSurvivor.class) {
            const classInfo = SURVIVOR_CLASSES.find(c => c.id === migratedSurvivor.class);
            const rolledBonuses = {};
            
            if (classInfo && classInfo.bonuses) {
              for (const [key, value] of Object.entries(classInfo.bonuses)) {
                if (Array.isArray(value) && value.length === 2) {
                  const [min, max] = value;
                  const rolled = min + Math.random() * (max - min);
                  rolledBonuses[key] = (key === 'hp' || key === 'defense') ? Math.round(rolled) : Math.round(rolled * 100) / 100;
                } else {
                  rolledBonuses[key] = value;
                }
              }
            }
            
            migratedSurvivor.classBonuses = rolledBonuses;
            
            // Apply retroactive HP bonus if it exists
            if (rolledBonuses.hp && !s._hpMigrated) {
              migratedSurvivor.maxHp += rolledBonuses.hp;
              migratedSurvivor.hp = Math.min(migratedSurvivor.hp + rolledBonuses.hp, migratedSurvivor.maxHp);
              migratedSurvivor._hpMigrated = true;
            }
          } else {
            migratedSurvivor.classBonuses = s.classBonuses || {};
            migratedSurvivor._hpMigrated = s._hpMigrated || false;
          }
          
          return migratedSurvivor;
        });

        // ensure tiles exist
        if (!state.tiles || state.tiles.length === 0) initTiles();

        appendLog('[Loaded save]');
        handleOffline();
        return;
      }
    } catch (e) {
      console.error(e);
      appendLog('[Failed loading save: corrupt data]');
    }
  }
  // 0.8.10 - Reset to defaults for new game
  state.highestThreatTier = 0;
  state.highestRaidTier = 0;
  // Clear completed missions for a true fresh start
  state.completedMissions = [];
  initTiles();
  appendLog('[New game]');
}

function handleOffline() {
  const now = Date.now();
  const elapsed = Math.floor((now - (state.lastTick || state.timeNow || state.startedAt)) / 1000);
  if (elapsed <= 1) {
    state.lastTick = now;
    return;
  }

  // New: Use the simplified offline calculation instead of the loop
  calculateOfflineProgress(elapsed);
  
  state.lastTick = now;
}
