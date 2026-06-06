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