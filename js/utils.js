const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function el(id) { return document.getElementById(id); }

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

// 0.9.0 - Wrap item name in rarity color for log messages
function colorItemName(name, rarity) {
  if (!rarity || !RARITY_COLORS[rarity]) return name;
  return `<span style="color:${RARITY_COLORS[rarity]}">${name}</span>`;
}

// 0.9.0 - Helper for crafting log messages with colored item names
function craftLog(itemName, rarity, suffix = 'crafted.') {
  const coloredName = colorItemName(itemName, rarity);
  appendLog(`${coloredName} ${suffix}`);
}

// 0.9.0 - Smart try add that logs colored name on success
function tryAddAndLog(item, verb = 'crafted') {
  if (tryAddToInventory(item)) {
    craftLog(item.name, item.rarity, `${verb}.`);
    return true;
  }
  return false;
}

// 0.9.0 - Helper for loot pickup that returns colored message
function tryAddAndReturn(item, successMsg, failMsg) {
  if (tryAddToInventory(item)) {
    // If no success message provided, generate one with "recovered"
    if (!successMsg) successMsg = `${item.name} recovered.`;
    const coloredName = colorItemName(item.name, item.rarity);
    return successMsg.replace(item.name, coloredName);
  }
  // If no fail message provided, generate default
  if (!failMsg) failMsg = `Inventory full - ${item.name.toLowerCase()} left behind.`;
  return failMsg;
}

// 0.9.0 - Automatically color known item names in messages
function colorLootMessage(message) {
  // Find items in inventory and their names to color them
  const itemPatterns = [
    // Extract from LOOT_TABLE would be complex, so we'll match common patterns
    /\b(Makeshift Pipe|Sharpened Tool|Crowbar|Scrap Pistol|Old Revolver)\b/gi,
    /\b(Combat Knife|Stun Baton|Reinforced Bat|Laser Pistol|Heavy Pistol)\b/gi,
    /\b(Assault Rifle|Scoped Rifle|Pump Shotgun|Light Armor|Tactical Vest|Reinforced Plating)\b/gi,
    /\b(Plasma Blade|Shock Maul|Plasma Pistol|Smart Pistol|Pulse Rifle|Plasma Rifle)\b/gi,
    /\b(Combat Shotgun|Plasma Shotgun|Light Machine Gun|Grenade Launcher)\b/gi,
    /\b(Heavy Armor|Composite Armor|Stealth Suit|Power Armor Frame|Hazmat Suit|Thermal Suit)\b/gi,
    /\b(Nano-Edge Katana|Void Pistol|Gauss Rifle|Quantum Rifle|Disintegrator Cannon|Minigun|Railgun)\b/gi,
    /\b(Nano-Weave Armor|Titan Armor|Shield Suit|Void Suit|Regenerative Armor)\b/gi,
    /\b(Weapon Part|Electronics|Armor Plating|Power Core|Nano-Material|Advanced Component|Quantum Core|Alien Artifact)\b/gi,
    /\b(Medkit|Stimpack|Repair Kit|Combat Drug|Stun Grenade|Nanite Injector|Revival Kit|System Override|Stealth Field)\b/gi
  ];
  
  // This is a simplified approach - for full coverage we'd need to parse LOOT_TABLE
  // For now, keep messages as-is since recoloring would be complex
  return message;
}

// 0.9.0 - Base Integrity tier helpers
function getIntegrityTier(integrity) {
  const thresholds = BALANCE.INTEGRITY_TIER_THRESHOLDS || [80, 60, 40, 20, 0];
  if (integrity >= thresholds[0]) return 0; // Pristine
  if (integrity >= thresholds[1]) return 1; // Minor Damage
  if (integrity >= thresholds[2]) return 2; // Damaged
  if (integrity >= thresholds[3]) return 3; // Critical
  return 4; // Collapsing
}

function getIntegrityTierName(tier) {
  const names = ['Pristine', 'Minor Damage', 'Damaged', 'Critical', 'Collapsing'];
  return names[tier] || 'Unknown';
}

function getIntegrityTierColor(tier) {
  const colors = ['#4ade80', '#fbbf24', '#fb923c', '#ef4444', '#7f1d1d'];
  return colors[tier] || '#808080';
}

// 0.9.0 - Morale tier helpers
function getMoraleTier(morale) {
  const thresholds = BALANCE.MORALE_TIER_THRESHOLDS || [80, 60, 40, 20, 0];
  if (morale >= thresholds[0]) return 0; // High Morale
  if (morale >= thresholds[1]) return 1; // Stable
  if (morale >= thresholds[2]) return 2; // Low Morale
  if (morale >= thresholds[3]) return 3; // Despondent
  return 4; // Breaking Point
}

function getMoraleTierName(tier) {
  const names = ['High Morale', 'Stable', 'Low Morale', 'Despondent', 'Breaking Point'];
  return names[tier] || 'Unknown';
}

function getMoraleTierColor(tier) {
  const colors = ['#4ade80', '#ffffff', '#fbbf24', '#fb923c', '#ef4444'];
  return colors[tier] || '#808080';
}

function getEffectiveMaxHp(survivor) {
  let effectiveMax = survivor.maxHp || 20;
  if (survivor.equipment && survivor.equipment.armor && survivor.equipment.armor.effects) {
    for (const effect of survivor.equipment.armor.effects) {
      if (effect.startsWith('hpBonus:')) {
        const bonus = parseInt(effect.split(':')[1]) || 0;
        effectiveMax += bonus;
      }
    }
  }
  return effectiveMax;
}

function getMoraleModifier(survivor) {
  const tier = getMoraleTier(survivor.morale);
  switch(tier) {
    case 0: // High Morale
      return {
        production: 1 + BALANCE.MORALE_HIGH_PROD_BONUS,
        combat: 1 + BALANCE.MORALE_HIGH_COMBAT_BONUS,
        xp: 1 + BALANCE.MORALE_HIGH_XP_BONUS
      };
    case 1: // Stable
      return { production: 1.0, combat: 1.0, xp: 1.0 };
    case 2: // Low Morale
      return {
        production: 1 - BALANCE.MORALE_LOW_PROD_PENALTY,
        combat: 1 - BALANCE.MORALE_LOW_COMBAT_PENALTY,
        xp: 1.0
      };
    case 3: // Despondent
      return {
        production: 1 - BALANCE.MORALE_DESPONDENT_PROD_PENALTY,
        combat: 1 - BALANCE.MORALE_DESPONDENT_COMBAT_PENALTY,
        xp: 1.0
      };
    case 4: // Breaking Point
      return {
        production: 1 - BALANCE.MORALE_BREAKING_PROD_PENALTY,
        combat: 1 - BALANCE.MORALE_BREAKING_COMBAT_PENALTY,
        xp: 1.0
      };
    default:
      return { production: 1.0, combat: 1.0, xp: 1.0 };
  }
}
