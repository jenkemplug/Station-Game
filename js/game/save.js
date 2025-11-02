// Save/Load System
// Handles game persistence, save snapshots, and offline progress

function pickLoot(qualityBonus = 0) {
  // qualityBonus increases chance of better loot (0.0 to 1.0+)
  // Rarity weight adjustments based on quality
  const adjustedTable = LOOT_TABLE.map(item => {
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
    if (t <= 0) return l;
  }
  return adjustedTable[0];
}

function initTiles() {
  const { w, h } = state.mapSize;
  state.tiles = [];
  
  // Helper to check if tile is adjacent to base
  const isAdjacentToBase = (x, y) => {
    const dx = Math.abs(x - state.baseTile.x);
    const dy = Math.abs(y - state.baseTile.y);
    return dx <= 1 && dy <= 1 && !(dx === 0 && dy === 0);
  };
  
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      let type = 'empty';
      let r = Math.random();
      if (x === state.baseTile.x && y === state.baseTile.y) {
        type = 'base';
      } else if (isAdjacentToBase(x, y)) {
        // No aliens adjacent to base (0.7.2)
        if (r < 0.06) type = 'survivor';
        else if (r < 0.27) type = 'resource'; // Increased from 0.18
        else if (r < 0.35) type = 'hazard'; // Adjusted from 0.26
        else if (r < 0.39) type = 'module'; // Adjusted from 0.30
        // else empty
      } else {
        if (r < 0.06) type = 'survivor';
        else if (r < 0.27) type = 'resource'; // Increased from 0.18
        else if (r < 0.37) type = 'alien'; // Adjusted from 0.28
        else if (r < 0.45) type = 'hazard'; // Adjusted from 0.36
        else if (r < 0.49) type = 'module'; // Adjusted from 0.40
      }
      state.tiles[idx] = { x, y, type, scouted: false, cleared: false, aliens: [] };
    }
  }
  // ensure base tile scouted
  const bi = state.baseTile.y * state.mapSize.w + state.baseTile.x;
  state.tiles[bi].scouted = true;
  state.explored.add(bi);
}

function generateNewMap() {
  const totalTiles = state.mapSize.w * state.mapSize.h;
  if (state.explored.size < totalTiles) {
    appendLog('Map must be fully explored to generate a new one.');
    return;
  }

  // Generate a new map layout
  initTiles();

  // Clear explored set, but keep the base tile explored
  state.explored.clear();
  const baseIdx = state.baseTile.y * state.mapSize.w + state.baseTile.x;
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
  _version: '0.9.13', // 0.9.3 - Threat rebalance & performance tweaks
    startedAt: state.startedAt,
    lastTick: state.lastTick,
    secondsPlayed: state.secondsPlayed,
    resources: state.resources,
    production: state.production,
    survivors: state.survivors,
    nextSurvivorId: state.nextSurvivorId,
    nextItemId: state.nextItemId,
    tiles: state.tiles,
    mapSize: state.mapSize,
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
    missions: state.missions,
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
        state.missions = Array.isArray(parsed.missions) ? parsed.missions : state.missions;
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
