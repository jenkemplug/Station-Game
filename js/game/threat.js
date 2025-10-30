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
  
  // Generate raid aliens based on threat level
  const alienCount = Math.min(4, Math.floor(state.threat / 20) + rand(1, 2));
  const raidAliens = [];
  for (let i = 0; i < alienCount; i++) {
    const at = ALIEN_TYPES[rand(0, ALIEN_TYPES.length - 1)];
    const hp = rand(at.hpRange[0], at.hpRange[1]);
    raidAliens.push({
      id: `raid_${Date.now()}_${i}`,
      type: at.id,
      name: at.name,
      hp,
      maxHp: hp,
      attack: rand(at.attackRange[0], at.attackRange[1]),
      stealth: at.stealth,
      flavor: at.flavor
    });
  }

  // ONLY guards defend the base (0.7.1 - hardcore defense)
  const guards = state.survivors.filter(s => s.task === 'Guard' && !s.onMission);
  
  if (guards.length === 0) {
    // No guards = instant game over
    appendLog('No guards on duty. The base is overrun.');
    triggerGameOver('The aliens breached the base with no resistance. All is lost.');
    return;
  }
  
  // Check if interactive combat is available
  if (typeof interactiveRaidCombat === 'function') {
    interactiveRaidCombat(raidAliens, guards);
  } else {
    // Fall back to auto-resolve
    resolveSkirmish(raidAliens, 'base', null);
  }
}
