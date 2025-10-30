// Threat System
// Handles threat level management and base raids

function evaluateThreat() {
  // base threat increases slowly; guards reduce it
  const guards = state.survivors.filter(s => s.task === 'Guard').length;
  const threatChange = BALANCE.THREAT_GROWTH_BASE + Math.random() * BALANCE.THREAT_GROWTH_RAND - guards * BALANCE.GUARD_THREAT_REDUCTION;
  state.threat = clamp(state.threat + threatChange, 0, 100);
  // base board risk derived from threat and broken systems
  state.boardRisk = clamp((state.threat / BALANCE.BOARD_RISK_DIVISOR) + (state.systems.turret ? 0 : BALANCE.BOARD_RISK_BASE_NO_TURRET), 0, 1);
  // possible raid
  if (Math.random() < Math.min(BALANCE.RAID_BASE_CHANCE + state.threat / BALANCE.RAID_THREAT_DIVISOR, BALANCE.RAID_MAX_CHANCE)) {
    // raid occurs
    resolveRaid();
  }
}

function resolveRaid() {
  appendLog('Alarm: unidentified activity detected near the base — a raid is incoming.');
  const turretPower = state.systems.turret * BALANCE.TURRET_POWER_PER;
  const guardPower = state.survivors.filter(s => s.task === 'Guard').length * 4;
  const armorBonus = state.survivors.reduce((total, s) => {
    if (s.equipment.armor) {
      return total + (s.equipment.armor.type === 'heavyArmor' ? 4 : 2);
    }
    return total;
  }, 0);
  const defense = turretPower + guardPower + armorBonus;
  const attack = rand(BALANCE.RAID_ATTACK_RANGE[0], BALANCE.RAID_ATTACK_RANGE[1]) + Math.floor(state.threat / 2);
  if (defense >= attack || Math.random() < 0.3) {
    appendLog('Raid repelled by base defenses.');
    // small loot or scrap recovered
    state.resources.scrap += rand(2, 10);
    state.threat = clamp(state.threat - BALANCE.THREAT_REDUCE_ON_REPEL, 0, 100);
  } else {
    appendLog('Raid breached outer perimeter. Boarding risk increased.');
    state.baseIntegrity -= rand(BALANCE.INTEGRITY_DAMAGE_ON_BREACH[0], BALANCE.INTEGRITY_DAMAGE_ON_BREACH[1]);
    // chance of internal breach
    if (Math.random() < BALANCE.NEST_CHANCE_AFTER_BREACH) {
      // spawn internal alien in a nearby explored tile
      const explored = Array.from(state.explored);
      if (explored.length > 0) {
        const tileIdx = explored[rand(0, explored.length - 1)];
        state.tiles[tileIdx].type = 'alien';
        appendLog('An alien force has boarded and established a presence inside the station.');
      }
    }
    // casualties
    if (Math.random() < BALANCE.CASUALTY_CHANCE && state.survivors.length > 0) {
      const idx = rand(0, state.survivors.length - 1);
      appendLog(`${state.survivors[idx].name} lost defending the base.`);
      state.survivors.splice(idx, 1);
    }
  }
}
