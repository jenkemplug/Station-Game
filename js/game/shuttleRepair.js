// js/game/shuttleRepair.js
// 1.0 - Phase 2.4: Shuttle Repair & Win Condition System

function installShuttleComponent(componentType) {
  if (!state.shuttleRepair.unlocked) {
    appendLog('Shuttle repair system not yet unlocked.');
    return;
  }
  
  if (state.shuttleRepair.progress >= 100) {
    appendLog('Shuttle is fully repaired!');
    return;
  }
  
  const costs = {
    'hullPlating': { 
      scrap: 150, 
      tech: 25, 
      name: 'Hull Plating',
      components: { armor_plating: 8, weaponPart: 5 }
    },
    'engineCore': { 
      scrap: 200, 
      tech: 40, 
      name: 'Engine Core',
      components: { power_core: 4, electronics: 6, advanced_component: 3 }
    },
    'navigationSystem': { 
      scrap: 100, 
      tech: 50, 
      name: 'Navigation System',
      components: { electronics: 8, advanced_component: 5 }
    },
    'lifeSupport': { 
      scrap: 120, 
      tech: 30, 
      name: 'Life Support Module',
      components: { electronics: 5, nano_material: 4, power_core: 2 }
    },
    'fuelCell': { 
      scrap: 180, 
      tech: 35, 
      name: 'Fuel Cell',
      components: { power_core: 5, quantum_core: 2, nano_material: 3 }
    }
  };
  
  const cost = costs[componentType];
  if (!cost) {
    appendLog('Unknown component type.');
    return;
  }
  
  // Check resources
  if (state.resources.scrap < cost.scrap) {
    appendLog(`Not enough scrap. Need ${cost.scrap}, have ${state.resources.scrap}.`);
    return;
  }
  if (state.resources.tech < cost.tech) {
    appendLog(`Not enough tech. Need ${cost.tech}, have ${state.resources.tech}.`);
    return;
  }
  
  // Check crafting components
  for (const [compType, needed] of Object.entries(cost.components)) {
    const available = state.inventory.filter(item => item.type === compType).length;
    if (available < needed) {
      const displayName = compType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      appendLog(`Not enough ${displayName}. Need ${needed}, have ${available}.`);
      return;
    }
  }
  
  // Consume resources
  state.resources.scrap -= cost.scrap;
  state.resources.tech -= cost.tech;
  
  // Consume crafting components
  for (const [compType, needed] of Object.entries(cost.components)) {
    let toRemove = needed;
    state.inventory = state.inventory.filter(item => {
      if (item.type === compType && toRemove > 0) {
        toRemove--;
        return false;
      }
      return true;
    });
  }
  
  // Update progress
  const progressGain = 20; // Each component is 20% progress
  state.shuttleRepair.progress = Math.min(100, state.shuttleRepair.progress + progressGain);
  
  if (componentType === 'fuelCell') {
    state.shuttleRepair.fuelCellsInstalled++;
  } else {
    state.shuttleRepair.componentsInstalled++;
  }
  
  appendLog(`<span style="color:var(--success)">🔧 Installed ${cost.name}! Shuttle repair: ${state.shuttleRepair.progress}%</span>`);
  
  // Check if fully repaired - trigger Mission 13 (Boss Fight)
  if (state.shuttleRepair.progress >= 100 && !state.shuttleRepair.finalBossTriggered) {
    state.shuttleRepair.finalBossTriggered = true;
    appendLog(`<span style="color:var(--warning)">⚠️ ALERT: Shuttle systems coming online. Massive hostile signature detected inbound!</span>`);
    appendLog(`<span style="color:var(--danger)">🚨 Mission 13 available: "Final Assault" - Defend against the Alpha Queen!</span>`);
    
    // Add Mission 13 to available missions
    if (!state.activeMissions.find(m => m.missionId === 'finalAssault')) {
      state.activeMissions.push({
        missionId: 'finalAssault',
        currentEvent: 'start',
        survivorId: null,
        tileIndex: null // Not tied to a map tile
      });
    }
  }
  
  saveGame('action');
  updateUI();
}

function winGame() {
  if (state.gameWon) return;
  
  state.gameWon = true;
  state.shuttleRepair.finalBossDefeated = true;
  
  // Calculate stats
  const survivorCount = state.survivors.length;
  const sectorsCleared = state.successfulMissions.length;
  const totalAlienKills = state.alienKills;
  const timePlayedHours = Math.floor(state.secondsPlayed / 3600);
  const timePlayedMinutes = Math.floor((state.secondsPlayed % 3600) / 60);
  
  // Show victory modal
  const modal = el('missionModal');
  const modalContent = el('missionModalContent');
  
  modalContent.innerHTML = `
    <div style="text-align: center; padding: 20px;">
      <h1 style="color: var(--success); font-size: 2.5em; margin-bottom: 20px;">🎉 VICTORY! 🎉</h1>
      <p style="font-size: 1.3em; margin-bottom: 30px;">You have escaped the Derelict Station!</p>
      
      <div style="background: var(--card-gradient); padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="color: var(--accent); margin-bottom: 15px;">Mission Statistics</h2>
        <div style="text-align: left; max-width: 400px; margin: 0 auto;">
          <p>⏱️ <strong>Time Survived:</strong> ${timePlayedHours}h ${timePlayedMinutes}m</p>
          <p>👥 <strong>Survivors Rescued:</strong> ${survivorCount}</p>
          <p>🗺️ <strong>Sectors Cleared:</strong> ${sectorsCleared}/13</p>
          <p>👾 <strong>Aliens Eliminated:</strong> ${totalAlienKills}</p>
          <p>⚠️ <strong>Final Threat Level:</strong> ${Math.floor(state.threat)}%</p>
        </div>
      </div>
      
      <div style="margin-top: 30px;">
        <p style="color: var(--muted); font-style: italic; margin-bottom: 20px;">
          "As the shuttle breaks atmosphere, you look back at the station—a tomb of metal and darkness. 
          But you made it. Against all odds, you survived."
        </p>
      </div>
      
      <div style="margin-top: 30px;">
        <button onclick="closeVictoryModal()" style="padding: 12px 30px; font-size: 1.1em; background: var(--accent); color: white; border: none; border-radius: 4px; cursor: pointer;">
          Continue (New Game+ Coming Soon)
        </button>
      </div>
    </div>
  `;
  
  modal.style.display = 'flex';
  saveGame('action');
}

function closeVictoryModal() {
  const modal = el('missionModal');
  modal.style.display = 'none';
  updateUI();
}
