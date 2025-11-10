// Map utilities for exploration and tile management

// 1.0 - Blueprint System: Viewport utilities
function getTileIndex(x, y) {
  return y * state.fullMap.width + x;
}

function getTileCoords(idx) {
  return {
    x: idx % state.fullMap.width,
    y: Math.floor(idx / state.fullMap.width)
  };
}

function isInViewport(x, y) {
  const vp = state.viewport;
  return x >= vp.x && x < vp.x + vp.width && y >= vp.y && y < vp.y + vp.height;
}

function centerViewportOnPosition(x, y) {
  const vp = state.viewport;
  const map = state.fullMap;
  
  // Center viewport on position, but clamp to map bounds
  vp.x = Math.max(0, Math.min(map.width - vp.width, x - Math.floor(vp.width / 2)));
  vp.y = Math.max(0, Math.min(map.height - vp.height, y - Math.floor(vp.height / 2)));
}

function getVisibleTiles() {
  const vp = state.viewport;
  const visible = [];
  
  for (let y = vp.y; y < vp.y + vp.height; y++) {
    for (let x = vp.x; x < vp.x + vp.width; x++) {
      const idx = getTileIndex(x, y);
      if (idx < state.tiles.length) {
        visible.push({
          x, y, idx,
          tile: state.tiles[idx],
          viewportX: x - vp.x,
          viewportY: y - vp.y
        });
      }
    }
  }
  
  return visible;
}

// 1.0 - Vision System: Calculate which tiles are within vision radius
function updateVision(centerX, centerY) {
  if (!state.isExploring) return; // Only update vision during exploration
  
  const radius = BLUEPRINT.VISION_RADIUS;
  const newVisible = new Set();
  
  // Chebyshev distance (grid-based square radius)
  for (let y = Math.max(0, centerY - radius); y <= Math.min(state.fullMap.height - 1, centerY + radius); y++) {
    for (let x = Math.max(0, centerX - radius); x <= Math.min(state.fullMap.width - 1, centerX + radius); x++) {
      const idx = getTileIndex(x, y);
      newVisible.add(idx);
      
      // Mark as seen (structure revealed permanently)
      if (!state.seen.has(idx)) {
        state.seen.add(idx);
      }
    }
  }
  
  // Update current visible set
  state.visible = newVisible;
}

function isAdjacent(x1, y1, x2, y2) {
  // 0.9.0 - Only orthogonal (parallel) tiles, not diagonal
  const dx = Math.abs(x1 - x2);
  const dy = Math.abs(y1 - y2);
  return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
}

function getAdjacentTiles(x, y) {
  // 1.0 - Updated to use fullMap instead of mapSize
  const adjacent = [];
  const directions = [
    { dx: 0, dy: -1 },  // Up
    { dx: 0, dy: 1 },   // Down
    { dx: -1, dy: 0 },  // Left
    { dx: 1, dy: 0 }    // Right
  ];
  
  for (const dir of directions) {
    const ax = x + dir.dx;
    const ay = y + dir.dy;
    if (ax >= 0 && ax < state.fullMap.width && ay >= 0 && ay < state.fullMap.height) {
      adjacent.push({ x: ax, y: ay, idx: getTileIndex(ax, ay) });
    }
  }
  return adjacent;
}

function getTileEnergyCost(tile) {
  const costs = BALANCE.TILE_ENERGY_COST;
  const t = tile.type || 'empty';
  return costs[t] ?? costs.empty;
}

function getExploredTilesWithType() {
  // 1.0 - Updated to use fullMap system
  const explored = [];
  state.explored.forEach(idx => {
    const coords = getTileCoords(idx);
    explored.push({ x: coords.x, y: coords.y, idx, type: state.tiles[idx].type });
  });
  return explored;
}

function isExplorable(tile) {
  // 1.0 - In exploration mode, only tiles adjacent to explorer are clickable
  if (state.isExploring && state.explorerPos) {
    const dx = Math.abs(tile.x - state.explorerPos.x);
    const dy = Math.abs(tile.y - state.explorerPos.y);
    // Only orthogonally adjacent tiles (no diagonals)
    return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
  }
  
  // Old click-to-explore mode: Can revisit hazards and alien tiles that weren't cleared (0.7.2)
  if (state.explored.has(tile.idx)) {
    const t = state.tiles[tile.idx];
    // Allow re-exploring hazards or alien tiles if not fully cleared
    return (t.type === 'hazard' || (t.type === 'alien' && t.aliens && t.aliens.length > 0)) && t.cleared === false;
  }
  
  // Check if adjacent to any explored tile
  const explored = getExploredTilesWithType();
  return explored.some(e => isAdjacent(e.x, e.y, tile.x, tile.y));
}

function exploreTile(idx) {
  const tile = state.tiles[idx];
  let cost = getTileEnergyCost(tile);
  
  // 0.8.10 - Scout class bonus: -10-20% exploration energy cost
  const explorer = state.survivors.find(s => s.id === state.selectedExplorerId);
  if (explorer && explorer.classBonuses && explorer.classBonuses.exploration) {
    cost = Math.floor(cost * explorer.classBonuses.exploration);
  }
  
  // 0.8.0 - Scout Pathfinder ability reduces energy cost (stacks with class bonus)
  if (explorer && hasAbility(explorer, 'pathfinder')) {
    cost = Math.floor(cost * 0.85); // -15% energy cost
  }

  if (state.resources.energy < cost) {
    appendLog(`Insufficient energy (need ${cost}) to explore this sector.`);
    return false;
  }

  state.resources.energy -= cost;
  tile.scouted = true;
  state.explored.add(idx);

  updateUI(); // Immediate UI feedback for exploration to prevent lag
  saveGame('action');

  state.threat += BALANCE.THREAT_GAIN_PER_TILE || 0;
  
  // Grant XP to the selected explorer (bonuses applied in grantXp - 0.8.11 additive stacking)
  if (explorer) {
    const xpGain = BALANCE.XP_FROM_EXPLORE;
    grantXp(explorer, xpGain);
  }

  handleTileEvent(idx); // This will handle the event and call updateUI() again for the result
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