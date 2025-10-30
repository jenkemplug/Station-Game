// Game Tick System
// Main game loop that orchestrates all game systems

function applyTick(isOffline = false) {
  // production by survivors assigned
  let prod = { oxygen: 0, food: 0, energy: 0, scrap: 0 };
  const activeSurvivors = state.survivors.filter(s => !s.onMission);

  activeSurvivors.forEach(s => {
    const levelBonus = 1 + (s.level - 1) * BALANCE.LEVEL_PRODUCTION_BONUS;
    switch (s.task) {
      case 'Oxygen':
        prod.oxygen += (0.9 + s.skill * 0.05) * levelBonus;
        break;
      case 'Food':
        prod.food += (0.7 + s.skill * 0.03) * levelBonus;
        break;
      case 'Energy':
        prod.energy += (0.9 + s.skill * 0.05) * levelBonus;
        break;
      case 'Scrap':
        prod.scrap += (0.8 + s.skill * 0.05) * levelBonus;
        break;
      case 'Guard':
        /* reduces threat growth */ break;
      case 'Explore':
        /* handled by manual exploration/missions */ break;
      default: // Idle
        prod.oxygen += 0.03; // Idle survivors produce a tiny bit of O2
        break;
    }
  });
  
  // systems contribute
  prod.oxygen += state.systems.filter * 1.2 * BALANCE.SYSTEM_FILTER_MULT;
  prod.energy += state.systems.generator * 1.4 * BALANCE.SYSTEM_GENERATOR_MULT;
  
  // apply production multiplier for survivors/systems
  prod.oxygen *= BALANCE.PROD_MULT;
  prod.food *= BALANCE.PROD_MULT;
  prod.energy *= BALANCE.PROD_MULT;
  prod.scrap *= BALANCE.PROD_MULT;
  
  // apply
  state.production = prod;
  state.resources.oxygen += prod.oxygen;
  state.resources.food += prod.food * 0.6;
  state.resources.energy += prod.energy;
  state.resources.scrap += prod.scrap;
  
  // consumption
  const o2Consume = BALANCE.O2_BASE + activeSurvivors.length * BALANCE.O2_PER_SURVIVOR;
  const foodConsume = BALANCE.FOOD_BASE + activeSurvivors.length * BALANCE.FOOD_PER_SURVIVOR;
  state.resources.oxygen -= o2Consume;
  state.resources.food -= foodConsume;
  
  // passive energy drain
  state.resources.energy = Math.max(0, state.resources.energy - 0.06 - state.systems.turret * 0.03);
  
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
    state.baseIntegrity -= 0.12;
    state.survivors.forEach(s => s.morale -= 0.4);
  }
  
  // If oxygen fully depleted, survivors take asphyxiation damage each tick
  if (state.resources.oxygen <= 0) {
    state.survivors.forEach(s => {
      const dmg = rand(BALANCE.OXY_DAMAGE_RANGE[0], BALANCE.OXY_DAMAGE_RANGE[1]);
      s.hp = Math.max(0, s.hp - dmg);
      s.morale = Math.max(0, s.morale - 0.6);
    });
    if (state.secondsPlayed % 5 === 0) appendLog('Oxygen depleted: survivors are taking asphyxiation damage.');
  }

  // Food depletion: morale loss and occasional starvation damage
  if (state.resources.food <= 0) {
    // morale gradually drops
    state.survivors.forEach(s => s.morale = Math.max(0, s.morale - 0.25));
    // occasional starvation casualties
    if (state.survivors.length > 0 && Math.random() < BALANCE.STARVATION_CHANCE) {
      const idx = rand(0, state.survivors.length - 1);
      appendLog(`${state.survivors[idx].name} succumbed to hunger.`);
      state.survivors.splice(idx, 1);
    }
  }
  
  // base integrity clamp
  state.baseIntegrity = clamp(state.baseIntegrity, -20, 100);
  
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
  
  if (!isOffline) state.secondsPlayed++;
  state.lastTick = Date.now();
}
