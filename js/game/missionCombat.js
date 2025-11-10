// js/game/missionCombat.js

/**
 * Creates a new alien object based on its type ID.
 * This is a self-contained version for mission-specific alien generation.
 * It relies on helper functions from threat.js and combat.js being globally available.
 * @param {string} typeId - The ID of the alien to create (e.g., 'drone', 'stalker').
 * @returns {object|null} The created alien object or null if the type is invalid.
 */
function createAlien(typeId) {
  const alienData = ALIEN_TYPES.find(a => a.id === typeId);
  if (!alienData) {
    console.error(`[createAlien] Alien type ID not found: ${typeId}`);
    return null;
  }

  const hp = rand(alienData.hpRange[0], alienData.hpRange[1]);
  const attack = rand(alienData.attackRange[0], alienData.attackRange[1]);
  
  const modifiers = typeof rollAlienModifiers === 'function' 
    ? rollAlienModifiers(alienData.id, state.threat) 
    : [];

  const alien = {
    id: `${typeId}_${Date.now()}_${Math.random()}`,
    type: alienData.id,
    name: alienData.name,
    hp: hp,
    maxHp: hp,
    attack: attack,
    armor: alienData.armor || 0,
    rarity: alienData.rarity || 'common',
    attackRange: [...alienData.attackRange],
    stealth: alienData.stealth,
    flavor: alienData.flavor,
    special: alienData.special,
    specialDesc: alienData.specialDesc,
    modifiers: modifiers,
    firstStrike: true
  };

  if (typeof applyModifiersToAlienStats === 'function') {
    applyModifiersToAlienStats(alien);
  }

  if (typeof applyEscalationToAlien === 'function') {
    applyEscalationToAlien(alien);
  }

  return alien;
}

/**
 * Initiates an interactive combat encounter triggered from an Away Mission.
 * This function is the bridge between the mission system and the interactive combat system.
 * @param {string} missionId - The ID of the mission triggering the combat.
 * @param {number} survivorId - The ID of the survivor involved in the combat.
 * @param {string} combatTrigger - A string defining the type of encounter (e.g., 'ambush', 'horde_ambush').
 * @param {object} choice - The full choice object that triggered the combat.
 */
function startMissionCombat(missionId, survivorId, combatTrigger, choice) {
  const missionData = AWAY_MISSIONS[missionId];
  if (!missionData) {
    console.error("Mission data not found for combat trigger.");
    return;
  }

  const survivor = state.survivors.find(s => s.id === survivorId);
  if (!survivor) {
    console.error("Survivor not found for mission combat.");
    return;
  }

  let aliens = [];
  
  // 1.0 - Phase 2.4: Special handling for final boss - use ALL survivors
  let party = [survivor];
  if (combatTrigger === 'combat_alpha_queen') {
    const allSurvivors = state.survivors.filter(s => !s.onMission || s.id === survivorId);
    party = allSurvivors;
    appendLog(`<span style="color:var(--warning)">🚨 ALL SURVIVORS rally to defend the shuttle! This is humanity's last stand!</span>`);
  }
  
  // 1. Generate aliens based on the specific trigger string.
  if (combatTrigger === 'ambush') {
    aliens.push(createAlien('lurker')); // A single Lurker is a thematic generic ambush.
  } else if (combatTrigger === 'horde_ambush') {
    aliens.push(createAlien('drone'));
    aliens.push(createAlien('stalker'));
    aliens.push(createAlien('drone'));
  } else if (combatTrigger === 'combat_infested_horde') {
    // 1.0 - Triage mission: 3 Infested
    aliens.push(createAlien('infested'));
    aliens.push(createAlien('infested'));
    aliens.push(createAlien('infested'));
  } else if (combatTrigger === 'combat_biomass_guardians') {
    // 1.0 - Engineering Deck mission: Mixed alien defenders
    aliens.push(createAlien('stalker'));
    aliens.push(createAlien('infested'));
    aliens.push(createAlien('stalker'));
  } else if (combatTrigger === 'combat_larvae_swarm') {
    // 1.0 - Engineering Deck mission: Larvae burst + drones
    aliens.push(createAlien('drone'));
    aliens.push(createAlien('drone'));
    aliens.push(createAlien('infested'));
  } else if (combatTrigger === 'combat_lurker_pack') {
    // 1.0 - Security Wing mission: Lurkers feeding on corpses
    aliens.push(createAlien('lurker'));
    aliens.push(createAlien('lurker'));
    aliens.push(createAlien('drone'));
  } else if (combatTrigger === 'combat_stalker_swarm') {
    // 1.0 - Security Wing mission: Alarm triggered stalkers
    aliens.push(createAlien('stalker'));
    aliens.push(createAlien('stalker'));
    aliens.push(createAlien('stalker'));
  } else if (combatTrigger.startsWith('combat_')) {
    const enemyId = combatTrigger.replace('combat_', ''); // e.g., 'brood_cyber', 'dr_kaine'
    const customEnemyData = MISSION_ENEMIES[enemyId];

    if (customEnemyData) {
      // Create a shallow copy to avoid modifying the constant
      const enemy = { ...customEnemyData };
      
      // Assign a unique ID for this combat instance
      enemy.id = `${enemy.id}_${Date.now()}_${Math.random()}`;
      
      // Ensure attackRange is present for the combat system, even for fixed-attack enemies
      enemy.attackRange = [enemy.attack, enemy.attack];
      
      // 1.0 - Preserve custom modifiers if defined, otherwise use empty array
      // Custom enemies can now have hand-crafted modifier arrays for unique variants
      if (!enemy.modifiers) {
        enemy.modifiers = [];
      }
      enemy.firstStrike = true;
      
      aliens.push(enemy);
    } else {
      console.error(`Custom mission enemy not found in MISSION_ENEMIES for trigger: ${combatTrigger}`);
    }
  } else if (combatTrigger.startsWith('ambush_')) {
    // Handle specific ambushes like 'ambush_drone_stalker'
    const alienTypes = combatTrigger.replace('ambush_', '').split('_');
    aliens = alienTypes.map(type => createAlien(type));
  }

  aliens = aliens.filter(Boolean); // Clean out any nulls from failed creations.

  if (aliens.length === 0) {
    console.error("Could not create aliens for mission combat from trigger:", combatTrigger);
    appendLog("Error: A mission encounter failed to start correctly.");
    return;
  }

  // 2. Close the mission modal before starting combat.
  if (typeof closeMissionModal === 'function') {
    closeMissionModal();
  }

  // 3. Start the interactive combat session.
  startInteractiveCombat(party, aliens, {
    type: 'mission',
    missionId: missionId,
    onWin: () => {
      appendLog(`The threat has been neutralized. The mission continues.`);
      const missionState = state.activeMissions.find(m => m.missionId === missionId);
      
      const wasTriggeredByFailure = choice.outcome.failure && choice.outcome.failure.trigger === combatTrigger;

      if (wasTriggeredByFailure) {
        // Player won the "punishment" combat. They should now proceed down the success path.
        const successNextEvent = choice.outcome.success.nextEvent;
        if (successNextEvent) {
          missionState.currentEvent = successNextEvent;
          
          // Add the new event to the mission log
          const missionData = AWAY_MISSIONS[missionId];
          const newEvent = missionData.events[successNextEvent];
          if (newEvent && typeof appendMissionLog === 'function') {
            appendMissionLog(`<div style="border-left: 3px solid var(--accent); padding-left: 12px; margin: 16px 0;">${newEvent.eventText}</div>`);
          }
          
          openMissionModal(missionId);
        } else {
          // If success path has no next event, it means the choice itself completes the mission.
          completeMission(missionId);
        }
      } else {
        // Player won a "standard" combat from a success path. Proceed with that path's outcome.
        const successOutcome = choice.outcome.success;
        
        // 1.0 - Phase 2.4: Check if this was the final boss
        if (combatTrigger === 'combat_alpha_queen') {
          appendLog(`<span style="color:var(--success)">🎉 The Alpha Queen has been slain! The station is secure!</span>`);
          state.shuttleRepair.finalBossDefeated = true;
          if (typeof winGame === 'function') {
            winGame();
          }
          completeMission(missionId);
          return;
        }
        
        if (successOutcome.nextEvent) {
          if (successOutcome.nextEvent === 'exit_mission' || successOutcome.nextEvent === 'exit_ambush' || successOutcome.nextEvent === 'exit_mission_failure') {
            // Winning combat should never result in failure, so we treat all exits as success.
            completeMission(missionId);
          } else {
            missionState.currentEvent = successOutcome.nextEvent;
            openMissionModal(missionId);
          }
        } else {
          // No next event means the combat itself was the end of the mission.
          completeMission(missionId);
        }
      }
      updateUI();
    },
    onLoss: () => {
      // 1.0 - Phase 2.4: Final boss loss = game over
      if (combatTrigger === 'combat_alpha_queen') {
        triggerGameOver('The Alpha Queen has overwhelmed your defenses. The station falls to the swarm.');
        return;
      }
      
      // The survivor might be dead/removed from state, so we can't rely on finding them.
      // The missionId is all we need to properly fail the mission.
      failMission(missionId);
    },
    onRetreat: () => {
      const retreatMessage = choice.retreatText || `${survivor.name} escaped the encounter, but the mission has failed.`;
      appendLog(retreatMessage);
      failMission(missionId);
    }
  });
}
