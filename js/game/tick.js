// Game Tick System
// Main game loop that orchestrates all game systems

function applyTick(isOffline = false) {
  // production by survivors assigned
  let prod = { oxygen: 0, food: 0, energy: 0, scrap: 0 };
  const activeSurvivors = state.survivors.filter(s => !s.onMission);

  activeSurvivors.forEach(s => {
    const levelBonus = 1 + (s.level - 1) * BALANCE.LEVEL_PRODUCTION_BONUS;
    // 0.8.0 - Engineer production bonuses
    let classBonus = 1;
    if (hasAbility(s, 'efficient')) classBonus *= 1.15; // +15% system production
    if (hasAbility(s, 'overclock')) classBonus *= 1.30; // +30% production (energy cost handled separately)
    if (hasAbility(s, 'mastermind')) classBonus *= 1.25; // +25% all systems
    
    switch (s.task) {
      case 'Oxygen':
        prod.oxygen += (BALANCE.SURVIVOR_PROD.Oxygen.base + s.skill * BALANCE.SURVIVOR_PROD.Oxygen.perSkill) * levelBonus * classBonus;
        break;
      case 'Food':
        prod.food += (BALANCE.SURVIVOR_PROD.Food.base + s.skill * BALANCE.SURVIVOR_PROD.Food.perSkill) * levelBonus * classBonus;
        break;
      case 'Energy':
        prod.energy += (BALANCE.SURVIVOR_PROD.Energy.base + s.skill * BALANCE.SURVIVOR_PROD.Energy.perSkill) * levelBonus * classBonus;
        break;
      case 'Scrap':
        let scrapBonus = classBonus;
        // 0.8.0 - Scavenger Salvage Expert
        if (hasAbility(s, 'salvage')) scrapBonus *= 1.25;
        prod.scrap += (BALANCE.SURVIVOR_PROD.Scrap.base + s.skill * BALANCE.SURVIVOR_PROD.Scrap.perSkill) * levelBonus * scrapBonus;
        break;
      case 'Guard':
        /* reduces threat growth */ break;
      case 'Explore':
        /* handled by manual exploration/missions */ break;
      default: // Idle
        prod.oxygen += BALANCE.SURVIVOR_PROD.IdleOxygen; // Idle survivors produce a tiny bit of O2
        break;
    }
  });
  
  // 0.8.6 - Calculate system production bonuses from Engineer abilities
  let systemBonus = 1;
  activeSurvivors.forEach(s => {
    if (hasAbility(s, 'efficient')) systemBonus *= 1.15; // +15% system production
    if (hasAbility(s, 'overclock')) systemBonus *= 1.30; // +30% system production
    if (hasAbility(s, 'mastermind')) systemBonus *= 1.25; // +25% all systems
  });
  
  // systems contribute (with Engineer bonuses)
  prod.oxygen += state.systems.filter * 1.2 * BALANCE.SYSTEM_FILTER_MULT * systemBonus;
  prod.energy += state.systems.generator * 1.4 * BALANCE.SYSTEM_GENERATOR_MULT * systemBonus;
  
  // apply production multiplier for survivors/systems
  prod.oxygen *= BALANCE.PROD_MULT;
  prod.food *= BALANCE.PROD_MULT;
  prod.energy *= BALANCE.PROD_MULT;
  prod.scrap *= BALANCE.PROD_MULT;
  
  // apply
  state.production = prod;
  state.resources.oxygen += prod.oxygen;
  state.resources.food += prod.food * BALANCE.SURVIVOR_PROD.FoodYieldFactor;
  state.resources.energy += prod.energy;
  state.resources.scrap += prod.scrap;
  
  // consumption
  const o2Consume = BALANCE.O2_BASE + activeSurvivors.length * BALANCE.O2_PER_SURVIVOR;
  const foodConsume = BALANCE.FOOD_BASE + activeSurvivors.length * BALANCE.FOOD_PER_SURVIVOR;
  const energyConsume = BALANCE.SURVIVOR_PROD.PassiveEnergyDrainBase + state.systems.turret * BALANCE.SURVIVOR_PROD.PassiveEnergyDrainPerTurret;
  
  // Store consumption for UI display
  state.consumption = {
    oxygen: o2Consume,
    food: foodConsume,
    energy: energyConsume
  };
  
  state.resources.oxygen -= o2Consume;
  state.resources.food -= foodConsume;
  
  // passive energy drain
  state.resources.energy = Math.max(0, state.resources.energy - energyConsume);
  
  // Prevent resources from going negative
  state.resources.oxygen = Math.max(0, state.resources.oxygen);
  state.resources.food = Math.max(0, state.resources.food);
  state.resources.energy = Math.max(0, state.resources.energy);
  state.resources.scrap = Math.max(0, state.resources.scrap);
  state.resources.ammo = Math.max(0, state.resources.ammo);
  state.resources.tech = Math.max(0, state.resources.tech);
  
  // threat & missions & raids
  evaluateThreat();
  tickMissions();
  
  // consequences
  // Oxygen critical state: warn, damage, and morale loss
  if (state.resources.oxygen <= BALANCE.OXY_CRITICAL_THRESHOLD) {
    if (state.secondsPlayed % 5 === 0) appendLog('Critical: oxygen supplies near collapse.');
    state.baseIntegrity -= BALANCE.INTEGRITY_DAMAGE_OXY_CRIT;
    state.survivors.forEach(s => s.morale -= BALANCE.MORALE_LOSS_OXY_CRIT);
  }
  
  // If oxygen fully depleted, survivors take asphyxiation damage each tick
  if (state.resources.oxygen <= 0) {
    state.survivors.forEach(s => {
      const dmg = rand(BALANCE.OXY_DAMAGE_RANGE[0], BALANCE.OXY_DAMAGE_RANGE[1]);
      s.hp = Math.max(0, s.hp - dmg);
  s.morale = Math.max(0, s.morale - BALANCE.MORALE_LOSS_ASPHYXIA);
    });
    if (state.secondsPlayed % 5 === 0) appendLog('Oxygen depleted: survivors are taking asphyxiation damage.');
  }

  // Food depletion: morale loss and occasional starvation damage
  if (state.resources.food <= 0) {
    // morale gradually drops
  state.survivors.forEach(s => s.morale = Math.max(0, s.morale - BALANCE.MORALE_LOSS_STARVATION));
    // occasional starvation casualties
    if (state.survivors.length > 0 && Math.random() < BALANCE.STARVATION_CHANCE) {
      const idx = rand(0, state.survivors.length - 1);
      appendLog(`${state.survivors[idx].name} succumbed to hunger.`);
      state.survivors.splice(idx, 1);
    }
  }
  
  // base integrity clamp
  state.baseIntegrity = clamp(state.baseIntegrity, -20, 100);
  
  // 0.8.0 - Scientist passive tech generation (Analytical, Genius)
  const scientists = state.survivors.filter(s => !s.onMission);
  for (const sci of scientists) {
    if (hasAbility(sci, 'analytical') && state.secondsPlayed % 10 === 0) {
      state.resources.tech += 1;
    }
    if (hasAbility(sci, 'genius') && state.secondsPlayed % 10 === 0) {
      state.resources.tech += 2;
    }
    // Breakthrough: random tech burst (5% chance per tick when active)
    if (hasAbility(sci, 'breakthrough') && Math.random() < 0.05) {
      state.resources.tech += rand(1, 3);
      appendLog(`${sci.name} achieves a research breakthrough!`);
    }
  }
  
  // 0.8.0 - Guardian morale bonuses
  const guardians = state.survivors.filter(s => !s.onMission);
  let moraleBonus = 0;
  for (const g of guardians) {
    if (hasAbility(g, 'rallying')) moraleBonus += 0.05; // +5% morale to all
  }
  if (moraleBonus > 0) {
    state.survivors.forEach(s => {
      s.morale = Math.min(100, s.morale + moraleBonus);
    });
  }
  
  // 0.8.0 - System failure events
  if (!isOffline && state.secondsPlayed % 10 === 0) { // Check every 10 seconds
    // Check for Failsafe ability (prevents or reduces failures)
    const hasFailsafe = state.survivors.some(s => hasAbility(s, 'failsafe'));
    const failureChance = hasFailsafe ? 0.005 : 0.01; // 1% base, 0.5% with failsafe
    
    // Filter failures
    if (state.systems.filter > 0 && Math.random() < failureChance) {
      state.systems.filter--;
      state.systemFailures.push({ type: 'filter', time: state.secondsPlayed });
      appendLog('⚠️ Air filter system failed! Oxygen production reduced.');
    }
    
    // Generator failures
    if (state.systems.generator > 0 && Math.random() < failureChance) {
      state.systems.generator--;
      state.systemFailures.push({ type: 'generator', time: state.secondsPlayed });
      appendLog('⚠️ Generator system failed! Energy production reduced.');
    }
    
    // Turret failures (more fragile - slightly higher chance)
    if (state.systems.turret > 0 && Math.random() < failureChance * 1.5) {
      state.systems.turret--;
      state.systemFailures.push({ type: 'turret', time: state.secondsPlayed });
      appendLog('⚠️ Turret system failed! Defense reduced.');
    }
    
    // Limit failure log to last 20 entries
    if (state.systemFailures.length > 20) {
      state.systemFailures = state.systemFailures.slice(-20);
    }
  }
  
  // Remove dead survivors after tick and report deaths
  if (state.survivors.length > 0) {
    const beforeCount = state.survivors.length;
    state.survivors = state.survivors.filter(s => {
      if (Number(s.hp) <= 0) {
        appendLog(`${s.name} has died.`);
        return false;
      }
      return true;
    });
    if (state.survivors.length !== beforeCount) updateUI();
  }
  
  // 0.8.4 - Game over if all survivors die
  if (state.survivors.length === 0) {
    triggerGameOver('All survivors have perished. The station is lost. Game Over.');
    return;
  }
  
  if (!isOffline) state.secondsPlayed++;
  state.lastTick = Date.now();
}
