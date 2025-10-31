// Game Tick System
// Main game loop that orchestrates all game systems

function applyTick(isOffline = false) {
  // production by survivors assigned
  let prod = { oxygen: 0, food: 0, energy: 0, scrap: 0 };
  const activeSurvivors = state.survivors.filter(s => !s.onMission);

  activeSurvivors.forEach(s => {
    const levelBonus = 1 + (s.level - 1) * BALANCE.LEVEL_PRODUCTION_BONUS;
    // 0.8.11 - Apply Engineer class production bonus (additive per survivor)
    let classBonus = 0;
    if (s.classBonuses && s.classBonuses.production) {
      classBonus += (s.classBonuses.production - 1); // e.g., 1.20 -> 0.20
    }
    // 0.8.11 - Engineer production bonuses (abilities, additive)
    if (hasAbility(s, 'efficient')) classBonus += 0.15; // +15% system production
    if (hasAbility(s, 'overclock')) classBonus += 0.30; // +30% production (energy cost handled separately)
    if (hasAbility(s, 'mastermind')) classBonus += 0.25; // +25% all systems
    
    const finalBonus = 1 + classBonus;
    
    switch (s.task) {
      case 'Oxygen':
        prod.oxygen += (BALANCE.SURVIVOR_PROD.Oxygen.base + s.skill * BALANCE.SURVIVOR_PROD.Oxygen.perSkill) * levelBonus * finalBonus;
        break;
      case 'Food':
        prod.food += (BALANCE.SURVIVOR_PROD.Food.base + s.skill * BALANCE.SURVIVOR_PROD.Food.perSkill) * levelBonus * finalBonus;
        break;
      case 'Energy':
        prod.energy += (BALANCE.SURVIVOR_PROD.Energy.base + s.skill * BALANCE.SURVIVOR_PROD.Energy.perSkill) * levelBonus * finalBonus;
        break;
      case 'Scrap':
        let scrapBonus = classBonus;
        // 0.8.11 - Scavenger class bonus for scrap (additive)
        if (s.classBonuses && s.classBonuses.scrap) {
          scrapBonus += (s.classBonuses.scrap - 1); // e.g., 1.25 -> 0.25
        }
        // 0.8.11 - Scavenger Salvage Expert (ability, additive)
        if (hasAbility(s, 'salvage')) scrapBonus += 0.25;
        prod.scrap += (BALANCE.SURVIVOR_PROD.Scrap.base + s.skill * BALANCE.SURVIVOR_PROD.Scrap.perSkill) * levelBonus * (1 + scrapBonus);
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
  
  // 0.8.11 - Systems contribute base production (bonuses like Overclock/Mastermind are global)
  // Note: Only Overclock and Mastermind abilities should boost system production globally
  // Regular Engineer class production bonuses are localized to their own tasks
  let systemBonusAdd = 0; // Additive bonus from abilities that boost all systems
  activeSurvivors.forEach(s => {
    if (hasAbility(s, 'overclock')) systemBonusAdd += 0.30; // +30% system production (global ability)
    if (hasAbility(s, 'mastermind')) systemBonusAdd += 0.25; // +25% all systems (global ability)
  });
  const systemBonus = 1 + systemBonusAdd;
  
  // Check for failed systems
  const isFilterFailed = state.systemFailures.some(f => f.type === 'filter');
  const isGeneratorFailed = state.systemFailures.some(f => f.type === 'generator');

  // Systems contribute production (0.8.13 - now have base production and can fail at level 0)
  if (!isFilterFailed) {
    prod.oxygen += (BALANCE.BASE_SYSTEM_PRODUCTION.oxygen + state.systems.filter * 1.2) * BALANCE.SYSTEM_FILTER_MULT * systemBonus;
  }
  if (!isGeneratorFailed) {
    prod.energy += (BALANCE.BASE_SYSTEM_PRODUCTION.energy + state.systems.generator * 1.4) * BALANCE.SYSTEM_GENERATOR_MULT * systemBonus;
  }
  
  // apply production multiplier for survivors/systems
  prod.oxygen *= BALANCE.PROD_MULT;
  prod.food *= BALANCE.PROD_MULT;
  prod.energy *= BALANCE.PROD_MULT;
  prod.scrap *= BALANCE.PROD_MULT;
  
  // 0.8.10 - Severe oxygen penalty when out of energy
  if (state.resources.energy <= 0) {
    prod.oxygen *= (BALANCE.OXYGEN_PENALTY_NO_ENERGY || 0.1);
  }
  
  // 0.8.11 - Apply FoodYieldFactor to production before storing for UI display
  prod.food *= BALANCE.SURVIVOR_PROD.FoodYieldFactor;
  
  // apply
  state.production = prod;
  state.resources.oxygen += prod.oxygen;
  state.resources.food += prod.food;
  state.resources.energy += prod.energy;
  state.resources.scrap += prod.scrap;
  
  // 0.8.8 - Energy consumption: per-survivor base + turrets + filter upgrades
  const o2Consume = BALANCE.O2_BASE + activeSurvivors.length * BALANCE.O2_PER_SURVIVOR;
  const foodConsume = BALANCE.FOOD_BASE + activeSurvivors.length * BALANCE.FOOD_PER_SURVIVOR;
  const energyConsume = 
    activeSurvivors.length * BALANCE.SURVIVOR_PROD.PassiveEnergyDrainPerSurvivor +  // Per survivor
    state.systems.turret * BALANCE.SURVIVOR_PROD.PassiveEnergyDrainPerTurret +      // Turret drain
    state.systems.filter * BALANCE.SURVIVOR_PROD.PassiveEnergyDrainPerFilterLevel;  // Filter drain
  
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
  
  // 0.8.11 - Scientist passive tech generation (Analytical, Genius) - nerfed to every 60s
  const scientists = state.survivors.filter(s => !s.onMission);
  for (const sci of scientists) {
    if (hasAbility(sci, 'analytical') && state.secondsPlayed % 60 === 0) {
      state.resources.tech += 1;
    }
    if (hasAbility(sci, 'genius') && state.secondsPlayed % 60 === 0) {
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
  
  // 0.8.11 - System failure events with Overclock/Failsafe modifiers
  if (!isOffline && state.secondsPlayed % 10 === 0) { // Check every 10 seconds
    const activeSurvivors = state.survivors.filter(s => !s.onMission);
    
    // Calculate failure rate modifiers (additive stacking)
    let failureRateMod = 1.0; // Base multiplier
    const overclockCount = activeSurvivors.filter(s => hasAbility(s, 'overclock')).length;
    const failsafeCount = activeSurvivors.filter(s => hasAbility(s, 'failsafe')).length;
    
    // Overclock increases failure rate by +50% each (additive)
    failureRateMod += overclockCount * 0.5;
    // Failsafe reduces failure rate by -50% each (additive)
    failureRateMod -= failsafeCount * 0.5;
    // Clamp to minimum 10% failure rate
    failureRateMod = Math.max(0.1, failureRateMod);
    
    const baseFailureChance = 0.01; // 1% base chance per system
    const failureChance = baseFailureChance * failureRateMod;
    
    // Filter failures - can fail even at level 0
    if (Math.random() < failureChance && !state.systemFailures.some(f => f.type === 'filter')) {
      state.systemFailures.push({ type: 'filter', time: state.secondsPlayed });
      appendLog('⚠️ Air filter system failed! Oxygen production halted.');
    }
    
    // Generator failures - can fail even at level 0
    if (Math.random() < failureChance && !state.systemFailures.some(f => f.type === 'generator')) {
      state.systemFailures.push({ type: 'generator', time: state.secondsPlayed });
      appendLog('⚠️ Generator system failed! Energy production halted.');
    }
    
    // Turret failures (more fragile - slightly higher chance)
    if (state.systems.turret > 0 && Math.random() < failureChance * 1.5 && !state.systemFailures.some(f => f.type === 'turret')) {
      state.systems.turret--; // Still reduces turret count
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
