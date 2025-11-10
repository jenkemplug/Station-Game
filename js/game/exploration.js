// Exploration System
// Handles tile exploration, scanning, and tile events

function revealRandomTiles(count = 1) {
  const uncovered = [];
  for (let i = 0; i < state.tiles.length; i++)
    if (!state.tiles[i].scouted) uncovered.push(i);
  if (uncovered.length === 0) return 0;
  let revealed = 0;
  for (let i = 0; i < count; i++) {
    if (uncovered.length === 0) break;
    const pickIdx = rand(0, uncovered.length - 1);
    const pick = uncovered.splice(pickIdx, 1)[0];
    state.tiles[pick].scouted = true;
    state.explored.add(pick);
    handleTileEvent(pick);
    revealed++;
  }
  return revealed;
}

function handleTileEvent(idx) {
  const t = state.tiles[idx];
  const { x, y } = t;
  const explorer = state.survivors.find(s => s.id === state.selectedExplorerId);

  // 1.0 - Vision System: Use content property instead of type
  if (t.content === 'resource') {
    // produce loot
    let qualityBonus = 0;
    
    // 0.8.10 - Scavenger class bonus: +15-25% loot quality
    if (explorer && explorer.classBonuses && explorer.classBonuses.loot) {
      qualityBonus += (explorer.classBonuses.loot - 1); // Convert 1.15-1.25 to 0.15-0.25
    }
    
    // 0.8.1 - Scout Keen Eye: +20% loot quality (stacks with class bonus)
    if (explorer && hasAbility(explorer, 'keen')) {
      qualityBonus += 0.20;
    }
    // 0.8.1 - Scavenger Treasure Hunter: +40% rare items (stacks with class bonus)
    if (explorer && hasAbility(explorer, 'treasure')) {
      qualityBonus += 0.40;
    }
    
    // 1.0 - Pass terrain for sector-specific loot
    const loot = pickLoot(qualityBonus, t.terrain);
    const message = loot.onPickup(state);
    
    // 0.8.0 - Scavenger abilities for bonus loot
    if (explorer) {
      // Lucky Find - 15% chance for extra loot
      if (hasAbility(explorer, 'lucky') && Math.random() < 0.15) {
        const bonusLoot = pickLoot(qualityBonus, t.terrain);
        const bonusMessage = bonusLoot.onPickup(state);
        appendLog(`${explorer.name}'s Lucky Find triggered: ${bonusMessage}!`);
      }
      // Golden Nose - double loot rolls
      if (hasAbility(explorer, 'goldnose')) {
        const extraLoot = pickLoot(qualityBonus, t.terrain);
        const extraMessage = extraLoot.onPickup(state);
        appendLog(`${explorer.name}'s Golden Nose finds exceptional loot: ${extraMessage}!`);
      }
    }
    
    // 0.9.0 - Cleaner scavenge notification format
    appendLog(`🔍 [${x},${y}] ${message}`);
    if (explorer) grantXp(explorer, BALANCE.XP_FROM_LOOT);
    t.content = null; // Clear content after pickup
    t.cleared = true;
  } else if (t.content === 'survivor') {
    // recruit chance
    recruitSurvivor();
    if (explorer) grantXp(explorer, BALANCE.XP_FROM_LOOT * 2); // More XP for finding a person
    t.content = null;
    t.cleared = true;
  } else if (t.content === 'alien') {
    // 0.9.0 - Check if aliens already exist on this tile (from previous retreat)
    if (t.aliens && t.aliens.length > 0) {
      // Restore alive aliens to full HP (dead aliens stay dead)
      t.aliens.forEach(alien => {
        if (alien.hp > 0) {
          alien.hp = alien.maxHp;
          alien.firstStrike = true; // Reset combat state
        }
      });
      // Remove dead aliens
      t.aliens = t.aliens.filter(a => a.hp > 0);
      
      if (t.aliens.length > 0) {
        appendLog(`Re-encountered ${t.aliens.length} alien(s) in this sector.`);
        // Start combat with existing aliens
        t.cleared = false;
        if (typeof interactiveEncounterAtTile === 'function' && state.selectedExplorerId != null) {
          interactiveEncounterAtTile(idx);
        } else {
          resolveSkirmish(t.aliens, 'field', idx);
        }
      } else {
        // All aliens were killed previously
        appendLog(`The sector is clear of threats.`);
        t.content = null;
        t.cleared = true;
      }
    } else {
      // First visit - spawn new aliens
      t.cleared = false;
      spawnAlienEncounter(idx);
    }
  } else if (t.content === 'hostile') {
    // 1.0 - Hostile survivor encounter
    if (t.hostileSurvivors && t.hostileSurvivors.length > 0) {
      console.log('Before filtering:', t.hostileSurvivors.map(h => ({ name: h.name, hp: h.hp, maxHp: h.maxHp })));
      
      // Remove dead hostiles first
      t.hostileSurvivors = t.hostileSurvivors.filter(h => h.hp > 0);
      
      console.log('After filtering:', t.hostileSurvivors.map(h => ({ name: h.name, hp: h.hp, maxHp: h.maxHp })));
      
      // Re-encounter: Restore alive hostiles to full HP
      t.hostileSurvivors.forEach(hostile => {
        hostile.hp = hostile.maxHp;
      });
      
      console.log('After healing:', t.hostileSurvivors.map(h => ({ name: h.name, hp: h.hp, maxHp: h.maxHp })));
      
      if (t.hostileSurvivors.length > 0) {
        appendLog(`⚔️ Re-encountered ${t.hostileSurvivors.length} hostile survivor(s)!`);
        t.cleared = false;
        
        // Convert hostile survivors to pseudo-aliens for combat (same as spawn logic)
        const pseudoAliens = t.hostileSurvivors.map(hostile => {
          // Calculate attack range from hostile's weapon
          let attackRange = [3, 6];
          let attack = 5;
          
          if (hostile.equipment && hostile.equipment.weapon) {
            const weapon = hostile.equipment.weapon;
            if (weapon.damage && Array.isArray(weapon.damage)) {
              let damageMultiplier = 1.0;
              damageMultiplier += (hostile.level - 1) * (BALANCE.LEVEL_ATTACK_BONUS || 0.02);
              if (hostile.classBonuses && hostile.classBonuses.combat) {
                damageMultiplier += (hostile.classBonuses.combat - 1);
              }
              
              const minDamage = Math.floor(weapon.damage[0] * damageMultiplier);
              const maxDamage = Math.floor(weapon.damage[1] * damageMultiplier);
              attackRange = [minDamage, maxDamage];
              attack = Math.floor((minDamage + maxDamage) / 2);
            }
          }
          
          // Calculate defense from armor
          let defense = 0;
          if (hostile.equipment && hostile.equipment.armor) {
            defense = hostile.equipment.armor.defense || 0;
          }
          
          return {
            ...hostile,
            type: 'hostile_human',
            attack,
            attackRange,
            defense,
            rarity: hostile.rarity,
            special: 'tactical',
            modifiers: hostile.abilities || []
          };
        });
        
        // Start combat using existing system
        if (typeof interactiveEncounterAtTile === 'function' && state.selectedExplorerId != null) {
          t._originalHostiles = t.hostileSurvivors;
          t.aliens = pseudoAliens;
          interactiveEncounterAtTile(idx);
        } else {
          resolveSkirmish(pseudoAliens, 'field', idx);
        }
      } else {
        // All hostiles defeated
        appendLog(`The sector is clear.`);
        t.content = null;
        t.cleared = true;
      }
    } else {
      // First visit - generate hostile survivors
      t.cleared = false;
      spawnHostileEncounter(idx);
    }
  } else if (t.content === 'hazard') {
    const explorer = state.survivors.find(s => s.id === state.selectedExplorerId);
    if (!explorer) {
      appendLog(`Detected hazard at (${x},${y}). No explorer selected.`);
      return;
    }
    const hasHazmat = explorer.equipment.armor?.subtype === 'hazmat_suit';
    if (!hasHazmat) {
      appendLog(`Detected hazard at (${x},${y}). Hazmat Suit required to clear.`);
      // Mark as cleared so it can be revisited later with a suit (0.7.2)
      t.cleared = false;
      return;
    }
    
    // Successful hazard room clear
    explorer.equipment.armor.durability -= rand(BALANCE.HAZARD_DURABILITY_LOSS[0], BALANCE.HAZARD_DURABILITY_LOSS[1]); // Damage the suit
    if (explorer.equipment.armor.durability <= 0) {
      explorer.equipment.armor.durability = 0;
      appendLog(`${explorer.name}'s Hazmat Suit has broken and is no longer functional.`);
    }

    // Extra XP for clearing hazard
    grantXp(explorer, BALANCE.XP_FROM_LOOT * 3);
    
    // Better loot chances (1.0 - with terrain bonus)
    for (let i = 0; i < BALANCE.HAZARD_LOOT_ROLLS; i++) {
      const loot = pickLoot(0, t.terrain);
      const message = loot.onPickup(state);
      appendLog(`${explorer.name} found ${message}`);
    }

    appendLog(`${explorer.name} successfully cleared the hazardous area.`);
    t.content = null;
    t.cleared = true;
  } else if (t.content === 'mission') {
    // Mission tiles are pre-assigned in initTiles() based on map layout
    if (t.missionId && !t.cleared) {
      if (state.activeMissions.some(m => m.missionId === t.missionId)) {
        appendLog("This mission is already active.");
        return;
      }
      const missionData = AWAY_MISSIONS[t.missionId];
      if (missionData) {
        // 1.0 - Consume keycard when starting mission (use sector name, not mission ID)
        const missionToSector = {
          'med_bay_salvage': 'medicalBay',
          'engineeringDeck': 'engineeringDeck',
          'securityWing': 'securityWing',
          'finalAssault': 'hangarBay'
          // TODO: Add missions 3-12 when they are created
        };
        const sectorName = missionToSector[t.missionId];
        if (sectorName) {
          const keycardIndex = state.keycards.indexOf(sectorName);
          if (keycardIndex >= 0) {
            state.keycards.splice(keycardIndex, 1);
            appendLog(`🔑 Used ${missionData.name} Keycard`);
          }
        }
        
        appendLog(`Beginning Mission: ${missionData.name}`);
        state.activeMissions.push({
          missionId: t.missionId,
          currentEvent: 'entry',
          survivorId: null,
          tileIndex: idx // The critical link to the map tile
        });
        openMissionModal(t.missionId);
      } else {
        appendLog(`🚧 Mission data not yet implemented. Check back in a future update!`);
        t.cleared = true;
      }
    } else {
      appendLog(`This mission has already been completed.`);
    }
  } else if (t.content === 'hangar') {
    // 1.0 - Hangar Bay: Special event that unlocks shuttle repair
    if (!state.shuttleRepair.unlocked) {
      // First time entering hangar
      appendLog(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      appendLog(`🚀 HANGAR BAY DISCOVERED`);
      appendLog(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      appendLog(`You step into the vast hangar bay, your boots echoing on the metal deck. Emergency lighting casts long shadows across the space.`);
      appendLog(``);
      appendLog(`In the center of the bay sits a small shuttle craft, its hull scorched but intact. This could be humanity's last hope for escape.`);
      appendLog(``);
      appendLog(`But the vessel is heavily damaged. The control systems are offline, hull plating is breached, and the fuel cells are depleted.`);
      appendLog(``);
      appendLog(`You'll need to scavenge rare components from across the station to make this shuttle flight-worthy.`);
      appendLog(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      
      // Unlock shuttle repair system
      state.shuttleRepair.unlocked = true;
      
      // Grant some hangar loot
      const loot1 = pickLoot(0.3, 'hangarBay');
      const loot2 = pickLoot(0.3, 'hangarBay');
      appendLog(`🔧 ${loot1.onPickup(state)}`);
      appendLog(`🔧 ${loot2.onPickup(state)}`);
      
      if (explorer) grantXp(explorer, BALANCE.XP_FROM_LOOT * 3); // Big XP reward
    } else {
      // Subsequent visits - can scavenge more loot
      const loot = pickLoot(0.2, 'hangarBay');
      appendLog(`🔍 Scavenging the hangar: ${loot.onPickup(state)}`);
      if (explorer) grantXp(explorer, BALANCE.XP_FROM_LOOT);
    }
    
    // Don't clear hangar - allow repeated looting
  } else if (t.content === 'module') {
    // grant a minor system node or tech
    state.resources.tech += 1;
    appendLog(`Found a technology node at (${x},${y}). Tech +1.`);
    if (explorer) grantXp(explorer, BALANCE.XP_FROM_LOOT);
    t.content = null;
    t.cleared = true;
  } else {
    appendLog(`Empty corridor at (${x},${y}).`);
  }
  
  // 0.8.0 - Scout Tracker: reveal adjacent alien tiles
  if (explorer && hasAbility(explorer, 'tracker')) {
    const neighbors = getNeighbors(idx);
    let revealedCount = 0;
    neighbors.forEach(neighborIdx => {
      const tile = state.tiles[neighborIdx];
      if (tile && tile.content === 'alien' && !state.visible.has(neighborIdx)) {
        // Add to visible set to reveal it
        state.visible.add(neighborIdx);
        revealedCount++;
      }
    });
    if (revealedCount > 0) {
      appendLog(`🛰️ Tracker: ${explorer.name} detected ${revealedCount} adjacent alien signal(s).`);
    }
  }
  
  updateUI();
  saveGame('action');
}

// 1.0 - Exploration Mode System
function beginExploration() {
  // Get selected explorer
  const explorer = state.survivors.find(s => s.id === state.selectedExplorerId);
  if (!explorer) {
    appendLog('⚠️ No explorer selected.');
    return;
  }
  
  // Check if survivor is on a mission
  if (explorer.onMission) {
    appendLog(`⚠️ ${explorer.name} is on a mission.`);
    return;
  }
  
  // Enter exploration mode
  state.isExploring = true;
  
  // Spawn explorer at base center
  state.explorerPos = { x: state.baseTile.x, y: state.baseTile.y };
  
  // Update vision from starting position
  updateVision(state.explorerPos.x, state.explorerPos.y);
  
  // Center viewport on base
  centerViewportOnPosition(state.baseTile.x, state.baseTile.y);
  
  // Mark explorer as on exploration (stops production)
  explorer.onExploration = true;
  
  appendLog(`🚶 ${explorer.name} begins exploring the station...`);
  updateUI();
  saveGame('action');
}

function returnToBase() {
  // Get selected explorer
  const explorer = state.survivors.find(s => s.id === state.selectedExplorerId);
  
  // Center viewport back on base before exiting
  centerViewportOnPosition(state.baseTile.x, state.baseTile.y);
  
  // Exit exploration mode
  state.isExploring = false;
  state.explorerPos = null;
  
  // Clear vision
  state.visible.clear();
  
  // Resume production
  if (explorer) {
    explorer.onExploration = false;
  }
  
  appendLog(`🏠 ${explorer ? explorer.name : 'Explorer'} returns to base.`);
  updateUI();
  saveGame('action');
}

// 1.0 - Token Movement System
function moveExplorer(targetX, targetY) {
  if (!state.isExploring || !state.explorerPos) {
    return;
  }
  
  // 1.0 - Block movement during active missions or combat
  if (state.activeMissions.length > 0) {
    appendLog('⚠️ Cannot move while mission is active.');
    return;
  }
  
  // Check if combat overlay is open (interactive combat)
  const combatOverlay = document.getElementById('combatOverlay');
  if (combatOverlay && combatOverlay.style.display !== 'none') {
    appendLog('⚠️ Cannot move during combat.');
    return;
  }
  
  const explorer = state.survivors.find(s => s.id === state.selectedExplorerId);
  if (!explorer) {
    appendLog('⚠️ No explorer selected.');
    return;
  }
  
  // 1.0 - Check if explorer is dead/downed - end exploration
  if (explorer.hp <= 0 || explorer.downed) {
    appendLog(`💀 ${explorer.name} has fallen. Returning to base...`);
    returnToBase();
    return;
  }
  
  const currentX = state.explorerPos.x;
  const currentY = state.explorerPos.y;
  
  // Check if target is orthogonally adjacent (no diagonals)
  const dx = Math.abs(targetX - currentX);
  const dy = Math.abs(targetY - currentY);
  const isAdjacent = (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
  
  if (!isAdjacent) {
    appendLog('⚠️ Can only move to adjacent tiles (no diagonals).');
    return;
  }
  
  // Get target tile
  const targetIdx = getTileIndex(targetX, targetY);
  const targetTile = state.tiles[targetIdx];
  
  if (!targetTile) {
    return; // Out of bounds
  }
  
  // 1.0 - Vision System: Check if tile is walkable (not a wall or void)
  if (targetTile.terrain === 'wall' || targetTile.terrain === 'void') {
    appendLog('⚠️ Cannot move through walls.');
    return;
  }
  
  // Define terrain to keycard mapping
  const terrainToKeycard = {
    'mission1Door': 'medicalBay',
    'medicalBay': 'medicalBay',
    'mission2Door': 'engineeringDeck',
    'engineeringDeck': 'engineeringDeck',
    'mission3Door': 'securityWing',
    'securityWing': 'securityWing',
    'mission4Door': 'crewQuarters',
    'crewQuarters': 'crewQuarters',
    'mission5Door': 'researchLabs',
    'researchLabs': 'researchLabs',
    'mission6Door': 'shoppingMall',
    'shoppingMall': 'shoppingMall',
    'mission7Door': 'maintenanceHub',
    'maintenanceHub': 'maintenanceHub',
    'mission8Door': 'communications',
    'communications': 'communications',
    'mission9Door': 'cargoBay',
    'cargoBay': 'cargoBay',
    'mission10Door': 'corporateOffices',
    'corporateOffices': 'corporateOffices',
    'mission11Door': 'reactorChamber',
    'reactorChamber': 'reactorChamber',
    'mission12Door': 'observationDeck',
    'observationDeck': 'observationDeck',
    'hangarDoor': 'hangarBay',
    'hangarBay': 'hangarBay'
  };
  
  // 1.0 - Map mission IDs to their corresponding keycard sector names
  const missionToSector = {
    'medicalBay': 'medicalBay',
    'engineeringDeck': 'engineeringDeck',
    'finalAssault': 'hangarBay'
    // TODO: Add missions 3-12 when they are created
  };
  
  const sectorNames = {
    'medicalBay': 'Medical Bay',
    'engineeringDeck': 'Engineering Deck',
    'securityWing': 'Security Wing',
    'crewQuarters': 'Crew Quarters',
    'researchLabs': 'Research Labs',
    'shoppingMall': 'Shopping Mall',
    'maintenanceHub': 'Maintenance Hub',
    'communications': 'Communications',
    'cargoBay': 'Cargo Bay',
    'corporateOffices': 'Corporate Offices',
    'reactorChamber': 'Reactor Chamber',
    'observationDeck': 'Observation Deck',
    'hangarBay': 'Hangar Bay'
  };
  
  // 1.0 - Mission doors: Check if player has keycard to START mission
  // Doors remain locked until mission is COMPLETED (unlocks the sector)
  const isMissionDoor = targetTile.terrain && targetTile.terrain.includes('Door');
  if (isMissionDoor) {
    const requiredKeycard = terrainToKeycard[targetTile.terrain];
    const sectorName = sectorNames[requiredKeycard] || 'Unknown';
    
    // Special case: Hangar door - just needs keycard, no mission
    if (targetTile.terrain === 'hangarDoor') {
      if (!state.keycards.includes('hangarBay')) {
        appendLog(`🔒 Hangar Bay door sealed. Find the Hangar Bay Keycard to access this area.`);
        return;
      }
      // Has keycard - allow passage through
    } else {
      // Normal mission doors
      // Check if sector is unlocked (mission completed successfully)
      const sectorUnlocked = state.successfulMissions.includes(requiredKeycard);
      
      if (!sectorUnlocked) {
        // Sector not yet unlocked - need to complete mission first
        if (targetTile.content === 'mission' && state.keycards.includes(requiredKeycard)) {
          // Has keycard - trigger mission without moving onto door
          const idx = getTileIndex(targetX, targetY);
          handleTileEvent(idx);
          return; // Don't move
        } else if (!state.keycards.includes(requiredKeycard)) {
          // No keycard yet - can't start mission
          appendLog(`🔒 ${sectorName} door sealed. Find the ${sectorName} Keycard to access this mission.`);
          return;
        } else {
          // Has keycard but no mission available (mission already active or completed but failed)
          appendLog(`🔒 ${sectorName} door locked. Complete the mission to unlock this sector.`);
          return;
        }
      }
      // Sector unlocked - allow passage through door
    }
  }
  
  // Calculate energy cost based on terrain (reduced to 2 for corridors)
  let cost = 0.5; // Base corridor cost (reduced from 8)
  if (targetTile.terrain === 'room') cost = 3; // Rooms slightly more
  
  // Apply Scout class bonus
  if (explorer.classBonuses && explorer.classBonuses.exploration) {
    cost = Math.floor(cost * explorer.classBonuses.exploration);
  }
  
  // Apply Pathfinder ability
  if (hasAbility(explorer, 'pathfinder')) {
    cost = Math.floor(cost * 0.85);
  }
  
  // Check energy
  if (state.resources.energy < cost) {
    appendLog(`⚠️ Insufficient energy (need ${cost}) to move.`);
    return;
  }
  
  // Consume energy
  state.resources.energy -= cost;
  
  // Move explorer
  state.explorerPos = { x: targetX, y: targetY };
  
  // Update vision from new position
  updateVision(targetX, targetY);
  
  // Center viewport on new position
  centerViewportOnPosition(targetX, targetY);
  
  // Mark tile as explored
  const isNewTile = !state.explored.has(targetIdx);
  state.explored.add(targetIdx);
  
  // Log movement
  const direction = dx === 1 ? (targetX > currentX ? 'east' : 'west') : (targetY > currentY ? 'south' : 'north');
  appendLog(`🚶 Moved ${direction} to (${targetX}, ${targetY})`);
  
  if (isNewTile) {
    // Grant XP for discovering new tile
    if (explorer) {
      grantXp(explorer, BALANCE.XP_FROM_EXPLORE);
    }
    
    // Increase threat
    state.threat += BALANCE.THREAT_GAIN_PER_TILE || 0;
  }
  
  // 1.0 - Vision System: Content discovery
  // Content is discovered when you step on the tile
  if (targetTile.content && !targetTile.cleared) {
    handleTileEvent(targetIdx);
  }
  
  updateUI();
  saveGame('action');
}

// 1.0 - Spawn hostile survivor encounter
function spawnHostileEncounter(idx) {
  const tile = state.tiles[idx];
  const explorer = state.survivors.find(s => s.id === state.selectedExplorerId);
  
  // Determine number of hostiles (1-3 based on threat)
  const threat = state.threat;
  let count = 1;
  if (threat > 60) count = Math.random() < 0.5 ? 3 : 2;
  else if (threat > 30) count = Math.random() < 0.5 ? 2 : 1;
  
  // Generate hostiles
  tile.hostileSurvivors = [];
  for (let i = 0; i < count; i++) {
    tile.hostileSurvivors.push(generateHostileSurvivor());
  }
  
  const names = tile.hostileSurvivors.map(h => h.name).join(', ');
  appendLog(`⚔️ Hostile survivors detected: ${names}`);
  
  // For now, treat hostiles like a special "alien" encounter in the existing combat system
  // Convert hostile survivors to pseudo-aliens for combat compatibility
  const pseudoAliens = tile.hostileSurvivors.map(hostile => {
    // Calculate attack range from hostile's weapon (preserve min/max for variety)
    let attackRange = [3, 6]; // Unarmed baseline range
    let attack = 5; // Average for display
    
    if (hostile.equipment && hostile.equipment.weapon) {
      const weapon = hostile.equipment.weapon;
      if (weapon.damage && Array.isArray(weapon.damage)) {
        // Apply class and level bonuses to BOTH min and max damage
        let damageMultiplier = 1.0;
        damageMultiplier += (hostile.level - 1) * (BALANCE.LEVEL_ATTACK_BONUS || 0.02);
        if (hostile.classBonuses && hostile.classBonuses.combat) {
          damageMultiplier += (hostile.classBonuses.combat - 1);
        }
        
        // Scale both ends of the damage range
        const minDamage = Math.floor(weapon.damage[0] * damageMultiplier);
        const maxDamage = Math.floor(weapon.damage[1] * damageMultiplier);
        attackRange = [minDamage, maxDamage];
        attack = Math.floor((minDamage + maxDamage) / 2); // Average for fallback
      }
    }
    
    // Calculate defense from armor
    let defense = 0;
    if (hostile.equipment && hostile.equipment.armor) {
      const armor = hostile.equipment.armor;
      defense = armor.defense || 0;
    }
    
    return {
      ...hostile,
      type: 'hostile_human',
      attack, // Average attack for fallback AI
      attackRange, // Preserve damage range for variety in combat
      defense, // Add defense value
      rarity: hostile.rarity,
      special: 'tactical', // Mark as tactical enemy (uses AI)
      modifiers: hostile.abilities || []
    };
  });
  
  // Start combat using existing system
  if (typeof interactiveEncounterAtTile === 'function' && state.selectedExplorerId != null) {
    // Store reference for loot drops
    tile._originalHostiles = tile.hostileSurvivors;
    tile.aliens = pseudoAliens;
    interactiveEncounterAtTile(idx);
  } else {
    resolveSkirmish(pseudoAliens, 'field', idx);
  }
}
