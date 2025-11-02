// Expedition System
// Handles survivor expeditions and mission tracking

function startExpedition(name = 'Expedition', durationSec = undefined) {
  if (state.selectedExpeditionSurvivorId === null) {
    appendLog('No survivor selected for expedition.');
    return;
  }

  const survivor = state.survivors.find(s => s.id === state.selectedExpeditionSurvivorId);
  if (!survivor || survivor.onMission) {
    appendLog('Selected survivor is not available for an expedition.');
    return;
  }

  // Check for expedition costs
  if (state.resources.food < BALANCE.EXPEDITION_COST_FOOD || state.resources.energy < BALANCE.EXPEDITION_COST_ENERGY) {
    appendLog(`Not enough resources for an expedition. Need ${BALANCE.EXPEDITION_COST_FOOD} Food and ${BALANCE.EXPEDITION_COST_ENERGY} Energy.`);
    return;
  }

  // Deduct costs
  state.resources.food -= BALANCE.EXPEDITION_COST_FOOD;
  state.resources.energy -= BALANCE.EXPEDITION_COST_ENERGY;

  survivor.onMission = true;
  activeDropdown = null;

  const mission = {
    id: Date.now(),
    name,
    party: [survivor.id],
    startedAt: Date.now(),
    durationSec: (durationSec ?? BALANCE.EXPEDITION_DEFAULT_DURATION),
    progress: 0,
    status: 'active'
  };
  state.missions.push(mission);
  appendLog(`${survivor.name} departs on ${name} (${mission.durationSec}s).`);
  updateUI();
}

function tickMissions() {
  const now = Date.now();
  for (const m of state.missions) {
    if (m.status !== 'active') continue;
    const elapsed = Math.floor((now - m.startedAt) / 1000);
    m.progress = elapsed;
    if (m.progress >= m.durationSec) {
      const survivor = state.survivors.find(s => s.id === m.party[0]);
      if (survivor) {
        survivor.onMission = false;
        const success = Math.random() < BALANCE.EXPEDITION_SUCCESS_CHANCE;
        let report = `${m.name} completed. `;
        if (success) {
          grantXp(survivor, BALANCE.XP_FROM_EXPEDITION_SUCCESS);
          let scrapFound = rand(BALANCE.EXPEDITION_REWARDS.scrap[0], BALANCE.EXPEDITION_REWARDS.scrap[1]);
          const techFound = rand(BALANCE.EXPEDITION_REWARDS.tech[0], BALANCE.EXPEDITION_REWARDS.tech[1]);
          
          // 0.8.11 - Apply Scavenger scrap bonus to expeditions (additive)
          let scrapBonusAdd = 0;
          if (survivor.classBonuses && survivor.classBonuses.scrap) {
            scrapBonusAdd += (survivor.classBonuses.scrap - 1); // e.g., 1.25 -> 0.25
          }
          if (hasAbility(survivor, 'salvage')) scrapBonusAdd += 0.25; // +25% scrap
          scrapFound = Math.floor(scrapFound * (1 + scrapBonusAdd));
          
          state.resources.scrap += scrapFound;
          state.resources.tech += techFound;
          report += `Found ${scrapFound} scrap and ${techFound} tech. `;
          
          // 0.9.0 - Morale gain for expedition success
          survivor.morale = Math.min(100, survivor.morale + BALANCE.MORALE_GAIN_EXPEDITION_SUCCESS);
          
          if (survivor.equipment.weapon) {
            survivor.equipment.weapon.durability -= rand(BALANCE.EXPEDITION_WEAPON_WEAR[0], BALANCE.EXPEDITION_WEAPON_WEAR[1]);
            if (survivor.equipment.weapon.durability <= 0) {
              report += `${survivor.equipment.weapon.name} broke. `;
              survivor.equipment.weapon = null;
            }
          }
          if (survivor.equipment.armor) {
            survivor.equipment.armor.durability -= rand(BALANCE.EXPEDITION_ARMOR_WEAR[0], BALANCE.EXPEDITION_ARMOR_WEAR[1]);
            if (survivor.equipment.armor.durability <= 0) {
              report += `${survivor.equipment.armor.name} broke. `;
              survivor.equipment.armor = null;
            }
          }
        } else {
          // 0.8.9 - Failed expeditions increase threat and raid pressure
          grantXp(survivor, BALANCE.XP_FROM_EXPEDITION_FAILURE);
          report += 'Encountered heavy resistance. ';
          survivor.hp -= rand(BALANCE.EXPEDITION_FAILURE_DAMAGE[0], BALANCE.EXPEDITION_FAILURE_DAMAGE[1]);
          
          // Increase threat from failed expedition
          const threatGain = rand(BALANCE.EXPEDITION_FAILURE_THREAT_GAIN[0], BALANCE.EXPEDITION_FAILURE_THREAT_GAIN[1]);
          state.threat = clamp(state.threat + threatGain, 0, 100);
          report += `Threat increased by ${threatGain}. `;
          
          // Add temporary raid pressure
          state.raidPressure = (state.raidPressure || 0) + (BALANCE.EXPEDITION_FAILURE_RAID_PRESSURE || 0);
          
          if (survivor.hp <= 0) {
            report += `${survivor.name} was lost.`;
            state.survivors.forEach(s => {
              if (s.id !== survivor.id) {
                s.morale = Math.max(0, (s.morale || 0) - BALANCE.MORALE_LOSS_ALLY_DEATH);
              }
            });
            state.survivors = state.survivors.filter(s => s.id !== survivor.id);
          }
        }
        appendLog(report);
      }
      m.status = 'complete';
    }
  }
  // prune completed after some time
  state.missions = state.missions.filter(m => m.status === 'active' || (m.status === 'complete' && Date.now() - m.startedAt < 30000));
}
