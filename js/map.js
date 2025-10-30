// Map utilities for exploration and tile management
function isAdjacent(x1, y1, x2, y2) {
  return Math.abs(x1 - x2) <= 1 && Math.abs(y1 - y2) <= 1;
}

function getAdjacentTiles(x, y, mapSize) {
  const adjacent = [];
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;
      const ax = x + dx;
      const ay = y + dy;
      if (ax >= 0 && ax < mapSize.w && ay >= 0 && ay < mapSize.h) {
        adjacent.push({ x: ax, y: ay, idx: ay * mapSize.w + ax });
      }
    }
  }
  return adjacent;
}

function getTileEnergyCost(tile) {
  switch (tile.type) {
    case 'hazard': return 25;
    case 'alien': return 20;
    case 'resource': return 15;
    case 'module': return 18;
    case 'survivor': return 12;
    default: return 8;
  }
}

function getExploredTilesWithType() {
  const explored = [];
  state.explored.forEach(idx => {
    const x = idx % state.mapSize.w;
    const y = Math.floor(idx / state.mapSize.w);
    explored.push({ x, y, idx, type: state.tiles[idx].type });
  });
  return explored;
}

function isExplorable(tile) {
  if (state.explored.has(tile.idx)) return false;
  
  // Check if adjacent to any explored tile
  const explored = getExploredTilesWithType();
  return explored.some(e => isAdjacent(e.x, e.y, tile.x, tile.y));
}

function exploreTile(idx) {
  const tile = state.tiles[idx];
  const cost = getTileEnergyCost(tile);

  if (state.resources.energy < cost) {
    appendLog(`Insufficient energy (need ${cost}) to explore this sector.`);
    return false;
  }

  state.resources.energy -= cost;
  tile.scouted = true;
  state.explored.add(idx);
  
  // Grant XP to the selected explorer
  const explorer = state.survivors.find(s => s.id === selectedExplorerId);
  if (explorer) {
    grantXp(explorer, BALANCE.XP_FROM_EXPLORE);
  }

  handleTileEvent(idx);
  updateUI();
  saveGame('action');
  return true;
}

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

function longRangeScan() {
  if (state.resources.energy < 10) {
    appendLog('Insufficient energy for scanner.');
    return;
  }
  state.resources.energy -= 10;
  let toReveal = rand(3, 7);
  revealRandomTiles(toReveal);
  appendLog('Scanner revealed nearby sectors.');
  updateUI();
}