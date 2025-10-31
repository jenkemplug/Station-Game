// Threat System
// Handles threat level management and base raids

// 0.8.2 - Weight alien types by threat for consistent progression
function pickAlienTypeByThreat(threatValue) {
  const t = Math.max(0, Math.min(100, Number(threatValue) || 0));
  const weights = [
    { id: 'drone',   w: t < 20 ? 7 : t < 40 ? 4 : t < 60 ? 2 : 1 },
    { id: 'lurker',  w: t < 30 ? 6 : t < 50 ? 4 : 2 },
    { id: 'stalker', w: t < 35 ? 3 : t < 60 ? 6 : 4 },
    { id: 'spitter', w: t < 45 ? 2 : t < 70 ? 5 : 4 },
    { id: 'brood',   w: t < 55 ? 1 : t < 75 ? 4 : 6 },
    { id: 'ravager', w: t < 60 ? 0 : t < 80 ? 3 : 6 },
    { id: 'spectre', w: t < 70 ? 0 : 3 },
    { id: 'queen',   w: t < 90 ? 0 : 2 }
  ];
  const total = weights.reduce((s, x) => s + x.w, 0) || 1;
  let r = Math.random() * total;
  for (const w of weights) {
    r -= w.w;
    if (r <= 0) {
      const alienType = ALIEN_TYPES.find(a => a.id === w.id);
      return alienType || ALIEN_TYPES[0];
    }
  }
  return ALIEN_TYPES[0];
}

// 0.8.0 - Helper: Roll for alien rare modifiers
function rollAlienModifiers(alienType) {
  const modifiers = [];
  const mods = ALIEN_MODIFIERS[alienType];
  if (!mods) return modifiers;

  for (const mod of mods) {
    if (Math.random() < mod.chance) {
      modifiers.push(mod.id);
    }
  }
  return modifiers;
}

function evaluateThreat() {
  // 0.8.9 - Threat drift with tiered floors: grows slowly; guards and turrets suppress it
  const guards = state.survivors.filter(s => s.task === 'Guard' && !s.onMission).length;
  const turrets = state.systems.turret || 0;
  const prevThreat = state.threat || 0;
  const threatChange = BALANCE.THREAT_GROWTH_BASE
    + Math.random() * BALANCE.THREAT_GROWTH_RAND
    - guards * BALANCE.GUARD_THREAT_REDUCTION
    - turrets * (BALANCE.TURRET_THREAT_REDUCTION || 0);
  
  // 0.8.9 - Tiered floor system: check if we've hit a new tier
  const tiers = BALANCE.THREAT_TIERS || [0];
  const currentTierIndex = state.highestThreatTier || 0;
  const currentFloor = tiers[currentTierIndex] || 0;
  
  // Calculate new threat (can go above or below current value)
  let newThreat = clamp(state.threat + threatChange, 0, 100);
  
  // Check if we've crossed into a new tier
  for (let i = currentTierIndex + 1; i < tiers.length; i++) {
    if (newThreat >= tiers[i]) {
      state.highestThreatTier = i;
      const tierPercent = tiers[i];
      appendLog(`⚠️ THREAT MILESTONE: Station threat has reached ${tierPercent}%. This level becomes the new permanent minimum.`);
    }
  }
  
  // Apply floor: cannot go below highest tier reached
  const activeFloor = tiers[state.highestThreatTier || 0] || 0;
  state.threat = Math.max(newThreat, activeFloor);
  
  // Notify on notable threat changes and quartile crossings (throttled)
  try {
    const nowMs = Date.now();
    const lastNote = Number(state.lastThreatNoticeAt) || 0;
    const throttleMs = 20000; // 20s between notices
    const prevQuart = Math.floor(prevThreat / 25);
    const newQuart = Math.floor(state.threat / 25);
    const crossedQuart = prevQuart !== newQuart; // 0→1 at 25%, etc.
    if (crossedQuart && (nowMs - lastNote) > throttleMs) {
      const dir = newQuart > prevQuart ? 'crossed above' : 'fell below';
      appendLog(`Threat ${dir} ${Math.min(100, newQuart * 25)}%. Higher threat increases raid odds; guards and turrets slow growth.`);
      state.lastThreatNoticeAt = nowMs;
    }
  } catch (e) { /* noop */ }

  // 0.8.9 - Raid chance with tiered floors: base scaled by exploration + threat pressure, reduced by guards and turrets
  const totalTiles = Math.max(1, state.mapSize.w * state.mapSize.h);
  const explorationFactor = state.explored.size / totalTiles; // 0.0 - 1.0
  const exploredTiles = state.explored.size;
  const kills = Number(state.alienKills || 0);
  const baseChance = BALANCE.RAID_BASE_CHANCE * (0.3 + explorationFactor * 0.7); // 30% early → 100% when fully explored
  let raidChance = baseChance
    + exploredTiles * (BALANCE.RAID_CHANCE_PER_TILE || 0)
    + kills * (BALANCE.RAID_CHANCE_PER_ALIEN_KILL || 0)
    + (state.threat / BALANCE.RAID_THREAT_DIVISOR) * (0.5 + 0.5 * explorationFactor);

  // 0.8.x - Temporary pressure from recent retreats/casualties (decaying bonus)
  state.raidPressure = Math.max(0, (state.raidPressure || 0) - 0.0002); // decay ~0.02/min
  raidChance += (state.raidPressure || 0);

  // 0.8.9 - Defenders reduce incident likelihood (with soft cap on defense)
  const guardReduce = (BALANCE.RAID_CHANCE_REDUCTION_PER_GUARD || 0) * guards;
  const turretReduce = (BALANCE.RAID_CHANCE_REDUCTION_PER_TURRET || 0) * turrets;
  const totalDefenseReduction = Math.min(guardReduce + turretReduce, BALANCE.RAID_DEFENSE_SOFTCAP || 0.07);
  raidChance = Math.max(0, raidChance - totalDefenseReduction);
  
  // 0.8.9 - Check if we've crossed into a new raid tier
  const raidTiers = BALANCE.RAID_TIERS || [0];
  const currentRaidTierIndex = state.highestRaidTier || 0;
  
  for (let i = currentRaidTierIndex + 1; i < raidTiers.length; i++) {
    if (raidChance >= raidTiers[i]) {
      state.highestRaidTier = i;
      const tierPercent = (raidTiers[i] * 100).toFixed(1);
      appendLog(`🚨 RAID MILESTONE: Raid frequency has reached ${tierPercent}% per minute. This becomes the new permanent minimum.`);
    }
  }
  
  // Apply raid floor: cannot go below highest tier reached
  const activeRaidFloor = raidTiers[state.highestRaidTier || 0] || 0;
  raidChance = Math.max(raidChance, activeRaidFloor);
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
  for (let i = 0; i < alienCount; i++) {
    const at = pickAlienTypeByThreat(state.threat);
    let hp = rand(at.hpRange[0], at.hpRange[1]);
    // Slight scaling based on threat to make raids hit harder
    const hMult = 1 + (state.threat || 0) / 120;
    const aMult = 1 + (state.threat || 0) / 150;
    hp = Math.round(hp * hMult);
    
    // 0.8.0 - Roll for rare modifiers
    const modifiers = rollAlienModifiers(at.id);
    
    raidAliens.push({
      id: `raid_${Date.now()}_${i}`,
      type: at.id,
      name: at.name,
      hp,
      maxHp: hp,
      attack: Math.round(rand(at.attackRange[0], at.attackRange[1]) * aMult),
      stealth: at.stealth,
      flavor: at.flavor,
      special: at.special,
      specialDesc: at.specialDesc,
      modifiers: modifiers, // 0.8.0
      firstStrike: true
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
