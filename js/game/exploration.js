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

function exploreTiles(count = 1) {
  const energyCost = 3;
  if (state.resources.energy < energyCost) {
    appendLog("Insufficient energy to explore.");
    return;
  }
  state.resources.energy -= energyCost;
  let got = revealRandomTiles(count);
  appendLog(`Exploration: revealed ${got} tile(s).`);
  updateUI();
}

function longRangeScan() {
  if (state.resources.energy < 10) {
    appendLog('Insufficient energy for long-range scan.');
    return;
  }
  state.resources.energy -= 10;
  let toReveal = rand(3, 7);
  revealRandomTiles(toReveal);
  appendLog('Long-range scan revealed nearby sectors.');
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
    if (Math.random() < 0.85) {
      const foundName = getRandomName();
      recruitSurvivor(foundName);
      appendLog(`Rescued ${foundName} at (${x},${y}) who joins the base.`);
      if (explorer) grantXp(explorer, BALANCE.XP_FROM_LOOT * 2); // More XP for finding a person
    } else appendLog(`Signs of life at (${x},${y}) but no one remained.`);
    t.type = 'empty';
  } else if (t.type === 'alien') {
    // immediate encounter: spawn alien(s)
    spawnAlienEncounter(idx);
  } else if (t.type === 'hazard') {
    const explorer = state.survivors.find(s => s.id === selectedExplorerId);
    if (!explorer) {
      appendLog(`Detected hazard at (${x},${y}). No explorer selected.`);
      return;
    }
    const hasHazmat = explorer.equipment.armor?.type === 'hazmatSuit';
    if (!hasHazmat) {
      appendLog(`Detected hazard at (${x},${y}). Hazmat Suit required.`);
      return;
    }
    
    // Successful hazard room clear
    explorer.equipment.armor.durability -= rand(15, 25); // Damage the suit
    if (explorer.equipment.armor.durability <= 0) {
      appendLog(`${explorer.name}'s Hazmat Suit was destroyed clearing the hazard.`);
      explorer.equipment.armor = null;
    }

    // Extra XP for clearing hazard
    grantXp(explorer, BALANCE.XP_FROM_LOOT * 3);
    
    // Better loot chances
    for (let i = 0; i < 3; i++) {
      const loot = pickLoot();
      const message = loot.onPickup(state);
      appendLog(`${explorer.name} found ${message}`);
    }

    appendLog(`${explorer.name} successfully cleared the hazardous area.`);
    t.type = 'empty';
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
