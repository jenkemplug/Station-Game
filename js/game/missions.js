// js/game/missions.js

function assignSurvivorToMission(missionId, survivorId) {
  const missionState = state.activeMissions.find(m => m.missionId === missionId);
  if (!missionState) {
    console.error(`Mission state not found for ID: ${missionId}`);
    return;
  }

  // If a survivor is already on this mission, make them available again
  if (missionState.survivorId) {
    const oldSurvivor = state.survivors.find(s => s.id === missionState.survivorId);
    if (oldSurvivor) {
      oldSurvivor.onMission = false;
    }
  }

  missionState.survivorId = survivorId;

  // Mark the new survivor as on a mission
  if (survivorId) {
    const newSurvivor = state.survivors.find(s => s.id === survivorId);
    if (newSurvivor) {
      newSurvivor.onMission = true;
      appendMissionLog(`<span style="color:var(--accent)">${newSurvivor.name} assigned to mission.</span>`);
    }
  } else {
    appendMissionLog(`<span style="color:var(--muted)">Survivor unassigned.</span>`);
  }

  saveGame('action');
  updateUI();
}

function triggerPendingMissionCombat(missionId) {
  const missionState = state.activeMissions.find(m => m.missionId === missionId);
  if (!missionState || !missionState.pendingCombat) return;

  const survivor = state.survivors.find(s => s.id === missionState.survivorId);
  if (!survivor) return;

  const { trigger, choice } = missionState.pendingCombat;
  
  // Clear the pending state BEFORE starting combat
  missionState.pendingCombat = null;

  if (typeof startMissionCombat === 'function') {
    startMissionCombat(missionId, survivor.id, trigger, choice);
  }
}

function resolveMissionChoice(missionId, choiceIndex) {
  const missionState = state.activeMissions.find(m => m.missionId === missionId);
  if (!missionState) return;

  const missionData = AWAY_MISSIONS[missionId];
  const survivor = state.survivors.find(s => s.id === missionState.survivorId);
  const currentEvent = missionData.events[missionState.currentEvent];
  const choice = currentEvent.choices[choiceIndex];

  if (!survivor) {
    appendMissionLog('<span style="color:var(--danger)">A survivor must be assigned to make a choice.</span>');
    return;
  }

  let isSuccess = true;
  if (choice.skillCheck) {
    // Per user request, remove class restriction and give a flat bonus to make testing easier.
  let successChance = choice.skillCheck.difficulty + 25;
  isSuccess = (Math.random() * 100) < successChance;
  }

  const outcome = isSuccess ? choice.outcome.success : choice.outcome.failure;
  const outcomeText = isSuccess ? choice.successText : choice.failureText;
  
  if (outcomeText) {
    const textColor = isSuccess ? 'var(--success)' : 'var(--danger)';
    appendMissionLog(`<span style="color:${textColor}">${outcomeText}</span>`);
  }

  // Handle rewards and damage FIRST
  handleMissionRewardsAndDamage(outcome, survivor);

  // NOW, check for combat trigger
  if (outcome.trigger) {
    missionState.pendingCombat = {
      trigger: outcome.trigger,
      choice: choice,
      text: outcomeText || currentEvent.eventText // Fallback text
    };
    // We don't save here, we just update the UI state
    renderMissionModalContent(); // Force the modal to re-render with the new state
    return; // Stop progression until player clicks "Begin Combat"
  }

  if (survivor.downed) {
    failMission(missionId);
    return;
  }
  
  // Handle mission progression
  if (outcome.nextEvent) {
    if (outcome.nextEvent === 'exit_mission' || outcome.nextEvent === 'exit_ambush') {
      completeMission(missionId);
    } else if (outcome.nextEvent === 'exit_mission_failure') {
      failMission(missionId);
    } else {
      missionState.currentEvent = outcome.nextEvent;
      
      // Add the new event to the log
      const newEvent = missionData.events[outcome.nextEvent];
      if (newEvent) {
        appendMissionLog(`<div style="border-left: 3px solid var(--accent); padding-left: 12px; margin: 16px 0;">${newEvent.eventText}</div>`);
      }
    }
  } else {
    if (isSuccess || !choice.skillCheck) {
      completeMission(missionId);
    } else {
      failMission(missionId);
    }
  }
  saveGame('action');
}

function completeMission(missionId) {
  const missionIndex = state.activeMissions.findIndex(m => m.missionId === missionId);
  if (missionIndex === -1) return;

  const missionState = state.activeMissions[missionIndex];
  const missionData = AWAY_MISSIONS[missionId];
  
  // Find survivor across all survivors, not just active ones, in case they were downed.
  const survivor = state.survivors.find(s => s.id === missionState.survivorId);

  appendLog(`<span style="color:var(--success)">Mission Complete: ${missionData.name}! The assigned survivor has returned.</span>`);

  if (missionData.finalRewards) {
    handleMissionRewardsAndDamage({ reward: missionData.finalRewards }, survivor);
  }

  if (survivor) {
    survivor.onMission = false;
    // If the returning survivor was the active explorer, re-select them.
    if (state.selectedExplorerId === survivor.id) {
      state.selectedExplorerId = survivor.id;
    }
  }
  
  // Use the stored tileIndex to clear the mission from the map.
  if (missionState.tileIndex !== undefined) {
    state.tiles[missionState.tileIndex].cleared = true;
    state.tiles[missionState.tileIndex].type = 'empty'; // Or whatever is appropriate
  }
  
  // 1.0 - Successful mission completion unlocks the NEXT keycard to be found
  // (The keycard must still be found as loot - this just makes it available in the loot pool)
  // successfulMissions stores SECTOR NAMES for door unlocking and keycard progression
  
  const missionToSector = {
    'med_bay_salvage': 'medicalBay',
    'finalAssault': 'hangarBay'
    // TODO: Add missions 2-12 when they are created
  };
  const sectorName = missionToSector[missionId];
  if (sectorName && !state.successfulMissions.includes(sectorName)) {
    state.successfulMissions.push(sectorName);
  }
  
  // completedMissions stores MISSION IDs to prevent re-discovery
  if (!state.completedMissions.includes(missionId)) {
    state.completedMissions.push(missionId);
  }
  state.activeMissions.splice(missionIndex, 1);
  closeMissionModal();
  updateUI();
  saveGame('action');
}

function failMission(missionId) {
    const missionIndex = state.activeMissions.findIndex(m => m.missionId === missionId);
    if (missionIndex === -1) return;

    const missionState = state.activeMissions[missionIndex];
    const missionData = AWAY_MISSIONS[missionId];
    const survivor = state.survivors.find(s => s.id === missionState.survivorId);

    appendLog(`<span style="color:var(--danger)">Mission Failed: ${missionData.name}.</span>`);

    if (survivor) {
        survivor.onMission = false;
        // If the returning survivor was the active explorer, re-select them.
        if (state.selectedExplorerId === survivor.id) {
          state.selectedExplorerId = survivor.id;
        }
    }
    
    // Use the stored tileIndex to clear the mission from the map.
    if (missionState.tileIndex !== undefined) {
      state.tiles[missionState.tileIndex].cleared = true;
      state.tiles[missionState.tileIndex].type = 'empty';
    }
    if (!state.completedMissions.includes(missionId)) {
      state.completedMissions.push(missionId); // Also add to completed to prevent re-discovery
    }
    state.activeMissions.splice(missionIndex, 1);
    closeMissionModal();
    updateUI();
    saveGame('action');
}

function handleMissionRewardsAndDamage(outcome, survivor) {
  if (!outcome) return;

  // Handle damage
  if (outcome.damage) {
    survivor.hp = Math.max(0, survivor.hp - outcome.damage);
    appendMissionLog(`<span style="color:var(--warning)">${survivor.name} was injured! (-${outcome.damage} HP)</span>`);
    if (survivor.hp <= 0) {
      survivor.hp = 0;
      survivor.downed = true;
      appendMissionLog(`<span style="color:var(--danger)">${survivor.name} has been downed!</span>`);
    }
  }

  // Handle reward items
  if (outcome.reward && outcome.reward.items) {
    outcome.reward.items.forEach((itemName, index) => {
      const quantity = (outcome.reward.quantities && outcome.reward.quantities[index]) ? outcome.reward.quantities[index] : 1;
      for (let i = 0; i < quantity; i++) {
        const recipeEntry = RECIPES[itemName];
        // Corrected: Search the LOOT_TABLE by 'type' to find non-craftable items like stimpacks.
        const lootEntry = LOOT_TABLE.find(l => l.type === itemName);

        if (recipeEntry && typeof recipeEntry.result === 'function') {
          recipeEntry.result();
        } else if (lootEntry && typeof lootEntry.onPickup === 'function') {
          const lootMessage = lootEntry.onPickup(state);
          appendMissionLog(`<span style="color:var(--success)">Recovered: ${lootMessage}</span>`);
        } else if (itemName === 'tech') {
            const techAmount = quantity || 1;
            state.resources.tech += techAmount;
            appendMissionLog(`<span style="color:var(--accent)">+${techAmount} Tech</span>`);
            break; 
        } else {
          appendMissionLog(`<span style="color:var(--danger)">[ERROR] Unknown reward: ${itemName}</span>`);
        }
      }
    });
  }
  
  // Handle tech rewards
  if (outcome.reward && outcome.reward.tech) {
      state.resources.tech += outcome.reward.tech;
      appendMissionLog(`<span style="color:var(--accent)">+${outcome.reward.tech} Tech</span>`);
  }
}