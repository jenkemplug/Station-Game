// Threat System
// Handles threat level management and base raids

// 0.8.2 - Weight alien types by threat for consistent progression
// 0.9.0 - Rebalanced to keep early enemies viable late-game (with more modifiers)
function pickAlienTypeByThreat(threatValue) {
  const t = Math.max(0, Math.min(100, Number(threatValue) || 0));
  
  // Philosophy: Early enemies never disappear, just become less common
  // Late game = mix of weak enemies with lots of modifiers + elite enemies
  const weights = [
    // Drone & Lurker: Always present, decrease from dominant to rare
    { id: 'drone',   w: t < 25 ? 10 : t < 50 ? 6 : t < 75 ? 3 : 2 }, // 10→6→3→2 (always present)
    { id: 'lurker',  w: t < 25 ? 8 : t < 50 ? 5 : t < 75 ? 3 : 2 },  // 8→5→3→2 (always present)
    
    // Stalker & Spitter: Mid-game introduction, remain common
    { id: 'stalker', w: t < 25 ? 0 : t < 50 ? 7 : t < 75 ? 6 : 4 },  // 0→7→6→4 (mid→late viable)
    { id: 'spitter', w: t < 25 ? 0 : t < 50 ? 6 : t < 75 ? 5 : 4 },  // 0→6→5→4 (mid→late viable)
    
    // Brood & Ravager: Late-game tanks, become more common
    { id: 'brood',   w: t < 50 ? 0 : t < 75 ? 5 : 6 },               // 0→0→5→6 (late-game focus)
    { id: 'ravager', w: t < 50 ? 0 : t < 75 ? 4 : 6 },               // 0→0→4→6 (late-game focus)
    
    // Spectre & Queen: Endgame elites at 75%+
    { id: 'spectre', w: t < 75 ? 0 : 5 },                            // 0→0→0→5 (endgame only)
    { id: 'queen',   w: t < 75 ? 0 : 4 }                             // 0→0→0→4 (endgame only)
  ];
  
  // Weight distribution examples:
  // 0-24%: Drone(10) + Lurker(8) = 18 total (56% drone, 44% lurker)
  // 25-49%: Drone(6) + Lurker(5) + Stalker(7) + Spitter(6) = 24 total (balanced mix)
  // 50-74%: All 6 types = 29 total (diverse encounters)
  // 75-100%: All 8 types = 29 total (early enemies become modifier carriers)
  
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

// 0.9.0 - Endgame Escalation System
// Handles difficulty scaling past 100% threat
function handleEscalation() {
  if (!state.threatLocked || state.threat < 100) return;
  
  // Time-based escalation: +1 level every 5 minutes at 100%
  const now = Date.now();
  const timeSinceLastEscalation = now - (state.lastEscalationTime || now);
  const escalationInterval = (BALANCE.ESCALATION_TIME_INTERVAL_SEC || 300) * 1000;
  
  if (timeSinceLastEscalation >= escalationInterval) {
    state.escalationLevel = (state.escalationLevel || 0) + 1;
    state.lastEscalationTime = now;
    
    const hpBonus = Math.round(state.escalationLevel * (BALANCE.ESCALATION_HP_MULT || 0.08) * 100);
    const atkBonus = Math.round(state.escalationLevel * (BALANCE.ESCALATION_ATTACK_MULT || 0.06) * 100);
    const armorBonus = Math.floor(state.escalationLevel / 2) * (BALANCE.ESCALATION_ARMOR_PER_2_LEVELS || 1);
    
    appendLog(`🔥 ESCALATION LEVEL ${state.escalationLevel}: All aliens now have +${hpBonus}% HP, +${atkBonus}% attack, +${armorBonus} armor.`);
  }
}

// 0.9.0 - Apply escalation bonuses to alien stats
// Used by both raid generation and field exploration
function applyEscalationToAlien(alien) {
  if (!state.escalationLevel || state.escalationLevel <= 0) return;
  
  const escLevel = state.escalationLevel;
  const hpMult = 1 + escLevel * (BALANCE.ESCALATION_HP_MULT || 0.08);
  const atkMult = 1 + escLevel * (BALANCE.ESCALATION_ATTACK_MULT || 0.06);
  const armorBonus = Math.floor(escLevel / 2) * (BALANCE.ESCALATION_ARMOR_PER_2_LEVELS || 1);
  
  // Apply HP bonus
  alien.maxHp = Math.round(alien.maxHp * hpMult);
  alien.hp = Math.round(alien.hp * hpMult);
  
  // Apply attack bonus
  alien.attack = Math.round(alien.attack * atkMult);
  if (alien.attackRange) {
    alien.attackRange[0] = Math.round(alien.attackRange[0] * atkMult);
    alien.attackRange[1] = Math.round(alien.attackRange[1] * atkMult);
  }
  
  // Apply armor bonus
  alien.armor = (alien.armor || 0) + armorBonus;
}

// 0.8.0 - Helper: Roll for alien rare modifiers (0.9.0 - threat + escalation scaling)
function rollAlienModifiers(alienType, threatValue = 0) {
  const modifiers = [];
  const mods = ALIEN_MODIFIERS[alienType];
  if (!mods) return modifiers;
  
  // 0.9.0 - Threat + Escalation increases modifier chance
  // Threat: At 0% = 1.0x, at 100% = 2.0x
  // Escalation: +10% per level (level 5 = +50%)
  const t = Math.max(0, Math.min(100, Number(threatValue) || 0));
  const threatMultiplier = 1.0 + (t / 100);
  const escalationMultiplier = 1.0 + (state.escalationLevel || 0) * (BALANCE.ESCALATION_MODIFIER_MULT || 0.10);
  const totalMultiplier = threatMultiplier * escalationMultiplier;

  for (const mod of mods) {
    const adjustedChance = Math.min(0.5, mod.chance * totalMultiplier); // Cap at 50%
    if (Math.random() < adjustedChance) {
      modifiers.push(mod.id);
    }
  }
  return modifiers;
}

function evaluateThreat() {
  // 0.9.0 - Threat system rebalanced for longer runs with endgame escalation
  const guards = state.survivors.filter(s => s.task === 'Guard' && !s.onMission).length;
  const turrets = state.systems.turret || 0;
  const prevThreat = state.threat || 0;
  
  // 0.9.0 - Once at 100%, threat is locked (escalation takes over)
  if (state.threatLocked && state.threat >= 100) {
    state.threat = 100;
    handleEscalation(); // Increment escalation level instead
    // Continue to evaluate raids
  } else {
    // Normal threat growth calculation
    const threatChange = BALANCE.THREAT_GROWTH_BASE
      + Math.random() * BALANCE.THREAT_GROWTH_RAND
      - guards * BALANCE.GUARD_THREAT_REDUCTION
      - turrets * (BALANCE.TURRET_THREAT_REDUCTION || 0);
    
    // 0.9.0 - Enforce minimum threat growth: defenses slow it, but can't stop it
    const minimumGrowth = BALANCE.THREAT_GROWTH_MINIMUM || 0.005;
    const effectiveThreatChange = Math.max(minimumGrowth, threatChange);
    
    // 0.9.0 - Wider tier system for longer runs
    const tiers = BALANCE.THREAT_TIERS || [0];
    const currentTierIndex = state.highestThreatTier || 0;
    const currentFloor = tiers[currentTierIndex] || 0;
    
    // Calculate new threat (always growing due to minimum)
    let newThreat = clamp(state.threat + effectiveThreatChange, 0, 100);
    
    // Check if we've crossed into a new tier
    for (let i = currentTierIndex + 1; i < tiers.length; i++) {
      if (newThreat >= tiers[i]) {
        state.highestThreatTier = i;
        const tierPercent = tiers[i];
        
        // Special handling for 100% threshold
        if (tierPercent >= 100) {
          state.threatLocked = true;
          state.lastEscalationTime = Date.now();
          appendLog(`🔴 CRITICAL: Station threat has reached 100%. Threat is now LOCKED. Escalation protocol initiated.`);
        } else {
          appendLog(`⚠️ THREAT MILESTONE: Station threat has reached ${tierPercent}%. This level becomes the new permanent minimum.`);
        }
      }
    }
    
    // Apply floor: cannot go below highest tier reached
    const activeFloor = tiers[state.highestThreatTier || 0] || 0;
    state.threat = Math.max(newThreat, activeFloor);
  }
  
  // Notify on notable threat changes and quartile crossings (throttled)
  try {
    const nowMs = Date.now();
    const lastNote = Number(state.lastThreatNoticeAt) || 0;
    const throttleMs = 20000; // 20s between notices
    
    // Check if we crossed a tier threshold (not quartile)
    const tiers = BALANCE.THREAT_TIERS || [0, 25, 50, 75, 100];
    const prevTier = tiers.findIndex(t => prevThreat < t);
    const currentTier = tiers.findIndex(t => state.threat < t);
    const crossedTier = prevTier !== currentTier && prevTier !== -1 && currentTier !== -1;
    
    if (crossedTier && (nowMs - lastNote) > throttleMs && !state.threatLocked) {
      const tierValue = tiers[prevTier];
      appendLog(`⚠️ Threat crossed ${tierValue}%. Alien encounters become stronger. This level is now the permanent minimum.`);
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
  
  // 0.9.0 - Escalation reduces raid cooldown (raids get more frequent)
  const cdMin = (BALANCE.RAID_MIN_INTERVAL_SEC || 600);
  const cdMax = (BALANCE.RAID_MAX_INTERVAL_SEC || 900);
  const escReduction = (state.escalationLevel || 0) * (BALANCE.ESCALATION_RAID_COOLDOWN_REDUCTION || 30);
  const adjustedMin = Math.max(300, cdMin - escReduction); // Min 5 minutes
  const adjustedMax = Math.max(adjustedMin + 60, cdMax - escReduction);
  state.raidCooldownMs = rand(adjustedMin, adjustedMax) * 1000;
  
  // Generate raid aliens based on threat level
  // 0.9.0 - Reduced alien count scaling for winnable late-game encounters
  const baseCount = rand(2, 3); // Reduced from rand(2, 4)
  const scale = Math.floor(state.threat / 25); // Increased divisor from 20 to 25 (slower scaling)
  const alienCount = Math.min(6, baseCount + Math.max(1, Math.floor(scale * 0.6))); // Reduced multiplier from 0.8 to 0.6, max from 7 to 6
  const raidAliens = [];
  for (let i = 0; i < alienCount; i++) {
    const at = pickAlienTypeByThreat(state.threat);
    let hp = rand(at.hpRange[0], at.hpRange[1]);
    // 0.9.0 - Reduced scaling multipliers for more tactical combat
    const hMult = 1 + (state.threat || 0) / 200; // Increased divisor from 120 to 200 (1.0 → 1.5x instead of 1.83x)
    const aMult = 1 + (state.threat || 0) / 250; // Increased divisor from 150 to 250 (1.0 → 1.4x instead of 1.67x)
    hp = Math.round(hp * hMult);
    
    // 0.8.0 - Roll for rare modifiers
    // 0.9.0 - Pass threat value for scaling (now includes escalation)
    const modifiers = rollAlienModifiers(at.id, state.threat);
    
    const alien = {
      id: `raid_${Date.now()}_${i}`,
      type: at.id,
      name: at.name,
      hp,
      maxHp: hp,
      attack: Math.round(rand(at.attackRange[0], at.attackRange[1]) * aMult),
      armor: at.armor || 0, // 0.9.0 - Include armor value
      rarity: at.rarity || 'common', // 0.9.0 - Include rarity
      attackRange: [at.attackRange[0], Math.round(at.attackRange[1] * aMult)], // 0.9.0 - Scaled range for display
      stealth: at.stealth,
      flavor: at.flavor,
      special: at.special,
      specialDesc: at.specialDesc,
      modifiers: modifiers, // 0.8.0
      firstStrike: true
    };
    
    // 0.9.0 - CRITICAL FIX: Apply modifier stat bonuses to alien
    if (typeof applyModifiersToAlienStats === 'function') {
      applyModifiersToAlienStats(alien);
    }
    
    // 0.9.0 - Apply escalation bonuses to raid aliens
    applyEscalationToAlien(alien);
    
    raidAliens.push(alien);
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
  
  // 0.9.0 - Increment escalation level for each raid survived at 100%
  // (Will be incremented after combat resolves successfully)
  
  // Check if interactive combat is available
  if (typeof interactiveRaidCombat === 'function') {
    interactiveRaidCombat(raidAliens, guards, turretCount);
  } else {
    // Fall back to auto-resolve
    resolveSkirmish(raidAliens, 'base', null);
  }
}
