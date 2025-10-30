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
  const explorer = state.survivors.find(s => s.id === selectedExplorerId);

  if (t.type === 'resource') {
    // produce loot
    const loot = pickLoot();
    const message = loot.onPickup(state);
    appendLog(`Scavenged ${loot.type} at (${x},${y}): ${message}`);
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
    // immediate encounter: spawn alien(s)
    // Mark as not cleared initially so retreat can revisit (0.7.2)
    t.cleared = false;
    spawnAlienEncounter(idx);
  } else if (t.type === 'hazard') {
    const explorer = state.survivors.find(s => s.id === selectedExplorerId);
    if (!explorer) {
      appendLog(`Detected hazard at (${x},${y}). No explorer selected.`);
      return;
    }
    const hasHazmat = explorer.equipment.armor?.type === 'hazmatSuit';
    if (!hasHazmat) {
      appendLog(`Detected hazard at (${x},${y}). Hazmat Suit required to clear.`);
      // Mark as cleared so it can be revisited later with a suit (0.7.2)
      t.cleared = false;
      return;
    }
    
    // Successful hazard room clear
    explorer.equipment.armor.durability -= rand(BALANCE.HAZARD_DURABILITY_LOSS[0], BALANCE.HAZARD_DURABILITY_LOSS[1]); // Damage the suit
    if (explorer.equipment.armor.durability <= 0) {
      appendLog(`${explorer.name}'s Hazmat Suit was destroyed clearing the hazard.`);
      explorer.equipment.armor = null;
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
}
