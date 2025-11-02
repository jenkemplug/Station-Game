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

  if (t.type === 'resource') {
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
    
    const loot = pickLoot(qualityBonus);
    const message = loot.onPickup(state);
    
    // 0.8.0 - Scavenger abilities for bonus loot
    if (explorer) {
      // Lucky Find - 15% chance for extra loot
      if (hasAbility(explorer, 'lucky') && Math.random() < 0.15) {
        const bonusLoot = pickLoot(qualityBonus);
        const bonusMessage = bonusLoot.onPickup(state);
        appendLog(`${explorer.name}'s Lucky Find triggered: ${bonusMessage}!`);
      }
      // Golden Nose - double loot rolls
      if (hasAbility(explorer, 'goldnose')) {
        const extraLoot = pickLoot(qualityBonus);
        const extraMessage = extraLoot.onPickup(state);
        appendLog(`${explorer.name}'s Golden Nose finds exceptional loot: ${extraMessage}!`);
      }
    }
    
    // 0.9.0 - Cleaner scavenge notification format
    appendLog(`🔍 [${x},${y}] ${message}`);
    if (explorer) grantXp(explorer, BALANCE.XP_FROM_LOOT);
    t.type = 'empty';
  } else if (t.type === 'survivor') {
    // recruit chance
    if (Math.random() < BALANCE.SURVIVOR_RECRUIT_CHANCE) {
      const foundName = getRandomName();
      recruitSurvivor(foundName);
      appendLog(`Rescued ${foundName} at (${x},${y}) who joins the base.`);
      if (explorer) grantXp(explorer, BALANCE.XP_FROM_LOOT * 2); // More XP for finding a person
    } else appendLog(`Signs of life at (${x},${y}) but no one remained.`);
    t.type = 'empty';
  } else if (t.type === 'alien') {
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
        t.type = 'empty';
        t.cleared = true;
      }
    } else {
      // First visit - spawn new aliens
      t.cleared = false;
      spawnAlienEncounter(idx);
    }
  } else if (t.type === 'hazard') {
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
    
    // Better loot chances
    for (let i = 0; i < BALANCE.HAZARD_LOOT_ROLLS; i++) {
      const loot = pickLoot();
      const message = loot.onPickup(state);
      appendLog(`${explorer.name} found ${message}`);
    }

    appendLog(`${explorer.name} successfully cleared the hazardous area.`);
    t.type = 'empty';
    t.cleared = true;
  } else if (t.type === 'module') {
    // grant a minor system node or tech
    state.resources.tech += 1;
    appendLog(`Found a module node at (${x},${y}). Tech +1.`);
    if (explorer) grantXp(explorer, BALANCE.XP_FROM_LOOT);
    t.type = 'empty';
  } else {
    appendLog(`Empty corridor at (${x},${y}).`);
  }
  
  // 0.8.0 - Scout Tracker: reveal adjacent alien tiles
  if (explorer && hasAbility(explorer, 'tracker')) {
    const adjacent = getAdjacentTiles(x, y, state.mapSize);
    let revealed = 0;
    for (const adj of adjacent) {
      const adjTile = state.tiles[adj.idx];
      if (!adjTile.scouted && adjTile.type === 'alien') {
        adjTile.scouted = true;
        state.explored.add(adj.idx);
        handleTileEvent(adj.idx); // This will spawn the aliens and mark the tile as not cleared
        revealed++;
      }
    }
    if (revealed > 0) {
      appendLog(`${explorer.name}'s Tracker sense reveals ${revealed} nearby alien presence(s).`);
    }
  }
}
