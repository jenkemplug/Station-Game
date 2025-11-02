
// Component metadata lookup for consistent item creation
const COMPONENT_DATA = {
  weaponPart: { name: 'Weapon Part', rarity: 'common', subtype: 'weaponPart' },
  armorPlating: { name: 'Armor Plating', rarity: 'uncommon', subtype: 'armorPlating' },
  armor_plating: { name: 'Armor Plating', rarity: 'uncommon', subtype: 'armorPlating' }, // Alias for recipes
  electronics: { name: 'Electronics', rarity: 'uncommon', subtype: 'electronics' },
  chemicalCompound: { name: 'Chemical Compound', rarity: 'uncommon', subtype: 'chemical_compound' },
  chemical_compound: { name: 'Chemical Compound', rarity: 'uncommon', subtype: 'chemical_compound' }, // Alias
  energyCell: { name: 'Energy Cell', rarity: 'uncommon', subtype: 'energy_cell' },
  energy_cell: { name: 'Energy Cell', rarity: 'uncommon', subtype: 'energy_cell' }, // Alias
  nanoFiber: { name: 'Nano-Fiber', rarity: 'uncommon', subtype: 'nano_fiber' },
  nano_fiber: { name: 'Nano-Fiber', rarity: 'uncommon', subtype: 'nano_fiber' }, // Alias
  alienTissue: { name: 'Alien Tissue', rarity: 'uncommon', subtype: 'alien_tissue' },
  alien_tissue: { name: 'Alien Tissue', rarity: 'uncommon', subtype: 'alien_tissue' }, // Alias
  xenoCrystal: { name: 'Xeno-Crystal', rarity: 'uncommon', subtype: 'xeno_crystal' },
  xeno_crystal: { name: 'Xeno-Crystal', rarity: 'uncommon', subtype: 'xeno_crystal' }, // Alias
  power_core: { name: 'Power Core', rarity: 'rare', subtype: 'power_core' },
  nano_material: { name: 'Nano-Material', rarity: 'rare', subtype: 'nano_material' },
  advanced_component: { name: 'Advanced Component', rarity: 'rare', subtype: 'advanced_component' },
  quantum_core: { name: 'Quantum Core', rarity: 'veryrare', subtype: 'quantum_core' },
  alien_artifact: { name: 'Alien Artifact', rarity: 'veryrare', subtype: 'alien_artifact' }
};

// Helper function to calculate 50% refund value
function refundValue(amount) {
  return amount === 1 ? 0 : Math.ceil(amount * 0.5);
}

function recycleItem(itemId, event) {
  const itemIndex = state.inventory.findIndex(i => i.id === itemId);
  if (itemIndex === -1) {
    appendLog('Item not found.');
    return;
  }

  const item = state.inventory[itemIndex];

  // Junk cannot be recycled
  if (item.name === 'Junk') {
    return;
  }

  // Unified handling for components and consumables - rarity-based scrap refund
  if (['component', 'consumable'].includes(item.type)) {
    const rarityValues = { common: 5, uncommon: 10, rare: 15, veryrare: 20 };
    const scrapValue = rarityValues[item.rarity] ?? 5;
    
    showRecycleConfirmation(item, { scrap: scrapValue }, event, () => {
      state.resources.scrap += scrapValue;
      state.inventory.splice(itemIndex, 1);
      const itemColor = RARITY_COLORS[item.rarity] || '#a0a0a0';
      appendLog(`♻️ Recycled <span style="color:${itemColor}">${item.name}</span> → <span style="color:var(--accent)">+${scrapValue} Scrap</span>`);
      updateUI();
    });
    return;
  }

  // Craftable items - calculate component refunds
  const recipe = Object.values(RECIPES).find(r => r.name === item.name);
  const refunds = {};

  if (recipe) {
    // Calculate 50% refund for all recipe components (excluding 'name' field)
    for (const [key, value] of Object.entries(recipe)) {
      if (value && key !== 'name' && typeof value === 'number') {
        refunds[key] = refundValue(value);
      }
    }
  } else {
    // Default salvage value for non-craftable items
    refunds.scrap = 5;
  }

  // Show themed confirmation popup
  showRecycleConfirmation(item, refunds, event, () => {
    // Grant all refunded resources
    for (const [resource, amount] of Object.entries(refunds)) {
      // Check if this is a crafting component using lookup table
      if (COMPONENT_DATA[resource]) {
        // Add component items back to inventory using metadata
        const { name, rarity, subtype } = COMPONENT_DATA[resource];
        for (let i = 0; i < amount; i++) {
          state.inventory.push({
            id: state.nextItemId++,
            type: 'component',
            subtype: subtype,
            name: name,
            rarity: rarity
          });
        }
      } else {
        // Regular resources (scrap, tech, energy, ammo)
        state.resources[resource] = (state.resources[resource] || 0) + amount;
      }
    }
    state.inventory.splice(itemIndex, 1);
    
    // 0.9.0 - Build colored notification showing all resources received with rarity colors
    const itemColor = RARITY_COLORS[item.rarity] || '#a0a0a0';
    const resourceParts = [];
    
    for (const [resource, amount] of Object.entries(refunds)) {
      if (amount > 0) {
        let displayName = '';
        let color = 'var(--accent)'; // Default for basic resources
        
        // Check if component exists in lookup table
        if (COMPONENT_DATA[resource]) {
          displayName = COMPONENT_DATA[resource].name;
          color = RARITY_COLORS[COMPONENT_DATA[resource].rarity];
        } else {
          // Basic resources use accent color
          displayName = resource === 'scrap' ? 'Scrap' :
                        resource === 'tech' ? 'Tech' :
                        resource === 'energy' ? 'Energy' : resource;
          color = 'var(--accent)';
        }
        
        resourceParts.push(`<span style="color:${color}">+${amount} ${displayName}</span>`);
      }
    }
    
    const resourcesText = resourceParts.join(', ');
    appendLog(`♻️ Recycled <span style="color:${itemColor}">${item.name}</span> → ${resourcesText}`);
    updateUI();
  });
}

function recycleAllItems(event) {
  // Get all recyclable items (exclude junk)
  const recyclableItems = state.inventory.filter(item => item.name !== 'Junk');
  
  if (recyclableItems.length === 0) {
    appendLog('No items to recycle.');
    return;
  }
  
  // Store the IDs of items we're going to recycle to exclude them later
  const itemsToRecycleIds = recyclableItems.map(item => item.id);
  
  // Calculate total refunds for all items
  const totalRefunds = {};
  
  recyclableItems.forEach(item => {
    // Components and consumables - rarity-based scrap refund
    if (['component', 'consumable'].includes(item.type)) {
      const rarityValues = { common: 5, uncommon: 10, rare: 15, veryrare: 20 };
      const scrapValue = rarityValues[item.rarity] ?? 5;
      totalRefunds.scrap = (totalRefunds.scrap || 0) + scrapValue;
    } else {
      // Craftable items (weapons, armor) - calculate component refunds
      const recipe = Object.values(RECIPES).find(r => r.name === item.name);
      
      if (recipe) {
        // Calculate 50% refund for all recipe components
        for (const [key, value] of Object.entries(recipe)) {
          if (value && key !== 'name' && typeof value === 'number') {
            const refund = refundValue(value);
            totalRefunds[key] = (totalRefunds[key] || 0) + refund;
          }
        }
      } else {
        // Default salvage value for non-craftable items
        totalRefunds.scrap = (totalRefunds.scrap || 0) + 5;
      }
    }
  });
  
  // Show confirmation popup with total refunds
  showRecycleAllConfirmation(recyclableItems.length, totalRefunds, event, () => {
    // Grant all refunded resources
    for (const [resource, amount] of Object.entries(totalRefunds)) {
      // Check if this is a crafting component using lookup table
      if (COMPONENT_DATA[resource]) {
        // Add component items back to inventory using metadata
        const { name, rarity, subtype } = COMPONENT_DATA[resource];
        for (let i = 0; i < amount; i++) {
          state.inventory.push({
            id: state.nextItemId++,
            type: 'component',
            subtype: subtype,
            name: name,
            rarity: rarity
          });
        }
      } else {
        // Regular resources (scrap, tech, energy, ammo)
        state.resources[resource] = (state.resources[resource] || 0) + amount;
      }
    }
    
    // Remove only the items we recycled (by ID), keeping junk and newly created components
    state.inventory = state.inventory.filter(item => !itemsToRecycleIds.includes(item.id));
    
    // Build colored notification showing all resources received
    const resourceParts = [];
    for (const [resource, amount] of Object.entries(totalRefunds)) {
      if (amount > 0) {
        let displayName = '';
        let color = 'var(--accent)';
        
        if (COMPONENT_DATA[resource]) {
          displayName = COMPONENT_DATA[resource].name;
          color = RARITY_COLORS[COMPONENT_DATA[resource].rarity];
        } else {
          displayName = resource === 'scrap' ? 'Scrap' :
                        resource === 'tech' ? 'Tech' :
                        resource === 'energy' ? 'Energy' : resource;
          color = 'var(--accent)';
        }
        
        resourceParts.push(`<span style="color:${color}">+${amount} ${displayName}</span>`);
      }
    }
    
    const resourcesText = resourceParts.join(', ');
    appendLog(`♻️ Recycled ${recyclableItems.length} items → ${resourcesText}`);
    updateUI();
  });
}

function showRecycleAllConfirmation(itemCount, refunds, event, onConfirm) {
  // Remove any existing popup
  const existing = document.getElementById('recycle-popup');
  if (existing) existing.remove();

  // Create popup
  const popup = document.createElement('div');
  popup.id = 'recycle-popup';
  popup.className = 'recycle-popup';

  // Format refunds list (only show non-zero amounts)
  const refundLines = Object.entries(refunds)
    .filter(([resource, amount]) => amount > 0)
    .map(([resource, amount]) => {
      // Use component lookup table for display names
      const displayName = COMPONENT_DATA[resource]?.name ||
                          (resource === 'scrap' ? 'Scrap' :
                           resource === 'tech' ? 'Tech' :
                           resource === 'energy' ? 'Energy' : resource);
      return `<div class="refund-line">+${amount} ${displayName}</div>`;
    }).join('');

  popup.innerHTML = `
    <div class="recycle-popup-header">Recycle All Items?</div>
    <div class="recycle-popup-body">
      <div class="refund-label">Recycling ${itemCount} item${itemCount !== 1 ? 's' : ''}. You will receive:</div>
      ${refundLines}
    </div>
    <div class="recycle-popup-buttons">
      <button class="recycle-confirm-btn">Recycle All</button>
      <button class="recycle-cancel-btn">Cancel</button>
    </div>
  `;

  // Position popup near click (absolute positioning with page coordinates)
  document.body.appendChild(popup);
  popup.style.left = `${event.pageX}px`;
  popup.style.top = `${event.pageY - 10}px`;

  // Adjust if off-screen
  const popupRect = popup.getBoundingClientRect();
  if (popupRect.right > window.innerWidth) {
    popup.style.left = `${event.pageX - popupRect.width / 2}px`;
  }
  if (popupRect.top < 0) {
    popup.style.top = `${event.pageY + 10}px`;
  }

  // Event handlers
  popup.querySelector('.recycle-confirm-btn').onclick = () => {
    popup.remove();
    onConfirm();
  };
  popup.querySelector('.recycle-cancel-btn').onclick = () => {
    popup.remove();
  };

  // Close on outside click
  setTimeout(() => {
    const closeOnClickOutside = (e) => {
      if (!popup.contains(e.target)) {
        popup.remove();
        document.removeEventListener('click', closeOnClickOutside);
      }
    };
    document.addEventListener('click', closeOnClickOutside);
  }, 100);
}

function showRecycleConfirmation(item, refunds, event, onConfirm) {
  // Remove any existing popup
  const existing = document.getElementById('recycle-popup');
  if (existing) existing.remove();

  // Create popup
  const popup = document.createElement('div');
  popup.id = 'recycle-popup';
  popup.className = 'recycle-popup';

  // Format refunds list (only show non-zero amounts)
  const refundLines = Object.entries(refunds)
    .filter(([resource, amount]) => amount > 0)
    .map(([resource, amount]) => {
      // Use component lookup table for display names
      const displayName = COMPONENT_DATA[resource]?.name ||
                          (resource === 'scrap' ? 'Scrap' :
                           resource === 'tech' ? 'Tech' :
                           resource === 'energy' ? 'Energy' : resource);
      return `<div class="refund-line">+${amount} ${displayName}</div>`;
    }).join('');

  popup.innerHTML = `
    <div class="recycle-popup-header">Recycle ${item.name}?</div>
    <div class="recycle-popup-body">
      <div class="refund-label">You will receive:</div>
      ${refundLines}
    </div>
    <div class="recycle-popup-buttons">
      <button class="recycle-confirm-btn">Recycle</button>
      <button class="recycle-cancel-btn">Cancel</button>
    </div>
  `;

  // Position popup near click (absolute positioning with page coordinates)
  document.body.appendChild(popup);
  popup.style.left = `${event.pageX}px`;
  popup.style.top = `${event.pageY - 10}px`;

  // Adjust if off-screen
  const popupRect = popup.getBoundingClientRect();
  if (popupRect.right > window.innerWidth) {
    popup.style.left = `${event.pageX - popupRect.width / 2}px`;
  }
  if (popupRect.top < 0) {
    popup.style.top = `${event.pageY + 10}px`;
  }

  // Event handlers
  popup.querySelector('.recycle-confirm-btn').onclick = () => {
    popup.remove();
    onConfirm();
  };
  popup.querySelector('.recycle-cancel-btn').onclick = () => {
    popup.remove();
  };

  // Close on outside click
  setTimeout(() => {
    const closeOnClickOutside = (e) => {
      if (!popup.contains(e.target)) {
        popup.remove();
        document.removeEventListener('click', closeOnClickOutside);
      }
    };
    document.addEventListener('click', closeOnClickOutside);
  }, 100);
}
