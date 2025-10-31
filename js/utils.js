const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const el = id => document.getElementById(id);

function formatTime(s) {
  const hh = Math.floor(s / 3600);
  s %= 3600;
  const mm = Math.floor(s / 60);
  const ss = s % 60;
  return `${hh}h ${mm}m ${ss}s`;
}

// 0.8.0 - Calculate current inventory capacity
function getInventoryCapacity() {
  // Base capacity
  let capacity = state.inventoryCapacity;
  
  // Hoarder ability: +2 capacity per survivor with ability
  const hoarders = state.survivors.filter(s => hasAbility(s, 'hoarder'));
  capacity += hoarders.length * 2;
  
  return capacity;
}

// 0.8.0 - Check if inventory has room for items
function canAddToInventory(count = 1) {
  const maxCapacity = getInventoryCapacity();
  return state.inventory.length + count <= maxCapacity;
}

// 0.8.0 - Attempt to add item to inventory, return true if successful
function tryAddToInventory(item) {
  if (!canAddToInventory()) {
    appendLog('Inventory is full! Cannot pick up item.');
    return false;
  }
  state.inventory.push(item);
  return true;
}
