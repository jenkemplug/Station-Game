// Threat System
// Handles threat level management and base raids

function evaluateThreat() {
  // Threat drift: grows slowly; guards and turrets suppress it
  const guards = state.survivors.filter(s => s.task === 'Guard' && !s.onMission).length;
  const turrets = state.systems.turret || 0;
  const threatChange = BALANCE.THREAT_GROWTH_BASE
    + Math.random() * BALANCE.THREAT_GROWTH_RAND
    - guards * BALANCE.GUARD_THREAT_REDUCTION
    - turrets * (BALANCE.TURRET_THREAT_REDUCTION || 0);
  state.threat = clamp(state.threat + threatChange, 0, 100);

  // Raid chance (0.7.3): base scaled by exploration + threat pressure, reduced by guards and turrets
  const totalTiles = Math.max(1, state.mapSize.w * state.mapSize.h);
  const explorationFactor = state.explored.size / totalTiles; // 0.0 - 1.0
  const exploredTiles = state.explored.size;
  const kills = Number(state.alienKills || 0);
  const baseChance = BALANCE.RAID_BASE_CHANCE * (0.3 + explorationFactor * 0.7); // 30% early → 100% when fully explored
  let raidChance = baseChance
    + exploredTiles * (BALANCE.RAID_CHANCE_PER_TILE || 0)
    + kills * (BALANCE.RAID_CHANCE_PER_ALIEN_KILL || 0)
    + (state.threat / BALANCE.RAID_THREAT_DIVISOR) * (0.5 + 0.5 * explorationFactor);

  // Defenders reduce incident likelihood
  const guardReduce = (BALANCE.RAID_CHANCE_REDUCTION_PER_GUARD || 0) * guards;
  const turretReduce = (BALANCE.RAID_CHANCE_REDUCTION_PER_TURRET || 0) * turrets;
  raidChance = Math.max(0, raidChance - guardReduce - turretReduce);
  raidChance = clamp(raidChance, 0, BALANCE.RAID_MAX_CHANCE);

  // Expose for UI as per-minute chance
  state.raidChance = raidChance;

  // Convert displayed per-minute chance into per-tick probability
  const ticksPerMinute = Math.max(1, Math.round(60000 / (typeof TICK_MS === 'number' ? TICK_MS : 1000)));
  const pTick = 1 - Math.pow(1 - state.raidChance, 1 / ticksPerMinute);

  // Respect raid cooldown
  const now = Date.now();
  const cooldownMs = (state.raidCooldownMs && state.raidCooldownMs > 0)
    ? state.raidCooldownMs
    : (BALANCE.RAID_MIN_INTERVAL_SEC * 1000);
  const onCooldown = (now - (state.lastRaidAt || 0)) < cooldownMs;
  if (!onCooldown) {
    // Roll for raid using per-tick probability
    if (Math.random() < pTick) resolveRaid();
  }
}

function resolveRaid() {
  appendLog('Alarm: unidentified activity detected near the base — a raid is incoming.');
  state.lastRaidAt = Date.now();
  // Randomize next cooldown in [MIN, MAX]
  const cdMin = (BALANCE.RAID_MIN_INTERVAL_SEC || 900);
  const cdMax = (BALANCE.RAID_MAX_INTERVAL_SEC || 1200);
  state.raidCooldownMs = rand(cdMin, cdMax) * 1000;
  
  // Generate raid aliens based on threat level
  const baseCount = rand(2, 4);
  const scale = Math.floor(state.threat / 20);
  const alienCount = Math.min(7, baseCount + Math.max(1, Math.floor(scale * 0.8)));
  const raidAliens = [];
  // Weighted type selection favoring stronger aliens at higher threat
  const pickType = () => {
    const t = state.threat || 0;
    const weights = [
      { id: 'lurker', idx: 0, w: t < 40 ? 5 : 2 },
      { id: 'stalker', idx: 1, w: t < 40 ? 3 : 5 },
      { id: 'brood', idx: 2, w: t < 60 ? 1 : 4 },
      { id: 'spectre', idx: 3, w: 2 }
    ];
    const total = weights.reduce((s, x) => s + x.w, 0);
    let r = Math.random() * total;
    for (const w of weights) { r -= w.w; if (r <= 0) return ALIEN_TYPES[w.idx]; }
    return ALIEN_TYPES[0];
  };
  for (let i = 0; i < alienCount; i++) {
    const at = pickType();
    let hp = rand(at.hpRange[0], at.hpRange[1]);
    // Slight scaling based on threat to make raids hit harder
    const hMult = 1 + (state.threat || 0) / 120;
    const aMult = 1 + (state.threat || 0) / 150;
    hp = Math.round(hp * hMult);
    raidAliens.push({
      id: `raid_${Date.now()}_${i}`,
      type: at.id,
      name: at.name,
      hp,
      maxHp: hp,
      attack: Math.round(rand(at.attackRange[0], at.attackRange[1]) * aMult),
      stealth: at.stealth,
      flavor: at.flavor
    });
  }

  // ONLY guards defend the base (0.7.1 - hardcore defense). Turrets now assist (0.7.3).
  const guards = state.survivors.filter(s => s.task === 'Guard' && !s.onMission);
  const turretCount = state.systems.turret || 0;
  
  if (guards.length === 0) {
    // No guards = instant game over
    appendLog('No guards on duty. The base is overrun.');
    triggerGameOver('The aliens breached the base with no resistance. All is lost.');
    return;
  }
  
  // Check if interactive combat is available
  if (typeof interactiveRaidCombat === 'function') {
    interactiveRaidCombat(raidAliens, guards, turretCount);
  } else {
    // Fall back to auto-resolve
    resolveSkirmish(raidAliens, 'base', null);
  }
}
