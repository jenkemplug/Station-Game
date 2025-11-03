function appendLog(text) {
  const t = `[${new Date().toLocaleTimeString()}] ${text}`;
  const node = document.createElement('div');
  // 0.9.0 - Support HTML for colored item names in log messages
  node.innerHTML = t;
  const logEl = el('log');
  logEl.prepend(node);
  while (logEl.childNodes.length > MAX_LOG) {
    logEl.removeChild(logEl.lastChild);
  }
}

// 0.9.0 - Generate tooltip for items and recipes (plain text for native tooltips)
function getItemTooltip(item, isRecipe = false) {
  if (!item) return '';
  
  // If passed a recipe key string, extract item data from recipe result
  if (typeof item === 'string') {
    const recipe = RECIPES[item];
    if (recipe && recipe.result) {
      // Extract item data from result function by parsing it
      const resultStr = recipe.result.toString();
      const extractValue = (pattern) => {
        const match = resultStr.match(pattern);
        return match ? match[1] : null;
      };
      
      item = {
        name: recipe.name || item,
        rarity: recipe.rarity || 'common',
        type: extractValue(/type:\s*['"](\w+)['"]/),
        subtype: extractValue(/subtype:\s*['"](\w+)['"]/),
        weaponType: extractValue(/weaponType:\s*['"](\w+)['"]/),
        damage: (() => {
          const match = resultStr.match(/damage:\s*\[(\d+),\s*(\d+)\]/);
          return match ? [parseInt(match[1]), parseInt(match[2])] : null;
        })(),
        defense: (() => {
          const match = resultStr.match(/defense:\s*(\d+)/);
          return match ? parseInt(match[1]) : null;
        })(),
        maxDurability: (() => {
          const match = resultStr.match(/maxDurability:\s*(\d+)/);
          return match ? parseInt(match[1]) : null;
        })(),
        effects: (() => {
          const match = resultStr.match(/effects:\s*\[([^\]]+)\]/);
          if (!match) return null;
          return match[1].split(',').map(e => e.trim().replace(/['"]/g, ''));
        })()
      };
      isRecipe = true;
    }
  }
  
  const parts = [];
  
  // Item name and rarity
  if (item.name) {
    parts.push(`${item.name}`);
  }
  if (item.rarity) {
    // 0.9.0 - Format rarity with spaces
    const rarityDisplay = item.rarity === 'veryrare' ? 'LEGENDARY' : item.rarity.toUpperCase();
    parts.push(`[${rarityDisplay}]`);
  }
  
  // Helper function to format effect descriptions
  const formatEffect = (eff, baseDamage = null) => {
    const [name, value] = eff.split(':');
    const val = parseInt(value) || 0;
    
    switch(name.toLowerCase()) {
      case 'burn':
        // Burn deals 2 damage per stack per turn for 3 turns (each stack independent)
        return `Burn: ${val}% chance (2 dmg/turn for 3 turns per stack)`;
      
      case 'splash':
        // Splash has a chance to deal 50% damage to adjacent targets
        return `Splash: ${val}% chance to hit adjacent enemies for 50% damage`;
      
      case 'armorpierce':
        // ArmorPierce reduces target's armor by percentage (for wielder's attacks only)
        return `Armor Pierce: Wielder ignores ${val}% of target armor`;
      
      case 'stun':
        return `Stun: ${val}% chance to stun (enemy skips turn)`;
      
      case 'phase':
        return `Phase: ${val}% chance to destabilize enemy (50% chance to fail next attack)`;
      
      case 'burst':
        return `Burst: Fires ${val + 1} total shot${val > 0 ? 's' : ''} per attack`;
      
      case 'crit':
        return `Critical: +${val}% crit chance (1.6x damage on crit)`;
      
      case 'accuracy':
        return `Accuracy: +${val}% hit chance`;
      
      case 'dodge':
        return `Dodge: +${val}% chance to evade attacks`;
      
      case 'reflect':
        return `Reflect: ${val}% chance to reflect 50% damage back`;
      
      case 'regen':
        return `Regeneration: Heal ${val} HP at start of each turn`;
      
      case 'hpbonus':
        return `HP Bonus: +${val} max HP when equipped`;
      
      case 'retreat':
        return `Retreat: +${val}% chance to successfully flee combat`;
      
      case 'immunity':
        return `Immunity: Immune to ${value} effects`;
      
      default:
        return `${name.charAt(0).toUpperCase() + name.slice(1)}${val ? ` (+${val})` : ''}`;
    }
  };
  
  // Weapon stats
  if (item.weaponType || item.type === 'weapon') {
    if (item.weaponType) {
      parts.push(`Type: ${item.weaponType.charAt(0).toUpperCase() + item.weaponType.slice(1)}`);
    }
    if (item.damage) {
      parts.push(`Damage: ${item.damage[0]}-${item.damage[1]}`);
    }
    if (item.durability !== undefined && !isRecipe) {
      parts.push(`Durability: ${item.durability}/${item.maxDurability}`);
    } else if (item.maxDurability) {
      parts.push(`Durability: ${item.maxDurability}`);
    }
    if (item.effects && item.effects.length > 0) {
      parts.push(`Effects:`);
      item.effects.forEach(eff => {
        parts.push(`  • ${formatEffect(eff, item.damage)}`);
      });
    }
  }
  
  // Armor stats
  if (item.type === 'armor' || (item.defense !== undefined && item.defense !== null)) {
    if (item.defense !== undefined && item.defense !== null) {
      parts.push(`Defense: ${item.defense}`);
    }
    if (item.durability !== undefined && !isRecipe) {
      parts.push(`Durability: ${item.durability}/${item.maxDurability}`);
    } else if (item.maxDurability) {
      parts.push(`Durability: ${item.maxDurability}`);
    }
    if (item.effects && item.effects.length > 0) {
      parts.push(`Effects:`);
      item.effects.forEach(eff => {
        parts.push(`  • ${formatEffect(eff)}`);
      });
    }
  }
  
  // Component type
  if (item.type === 'component') {
    parts.push(`[Crafting Material]`);
  }
  
  // Consumable type
  if (item.type === 'consumable' || item.type === 'medkit') {
    parts.push(`[Consumable Item]`);
    const key = item.subtype || item.type;
    const effect = BALANCE.CONSUMABLE_EFFECTS[key];
    if (effect && effect.desc) {
      parts.push(`\n${effect.desc}`);
    }
  }
  
  return parts.join('\n');
}

// Snapshot caches to avoid unnecessary DOM re-renders that break hover/focus
let lastRenderedMapSnapshot = null;
let lastRenderedInventorySnapshot = null;
// 0.8.2 - Avoid rerendering workbench every tick
let lastRenderedWorkbenchKey = null;
// 0.8.5 - Snapshots for all UI panels to prevent focus loss
let lastRenderedResourceSnapshot = null;
let lastRenderedSystemSnapshot = null;
let lastRenderedThreatSnapshot = null;
// 0.8.10 - Additional snapshots for base panel and map info
let lastRenderedSurvivorCount = null;
let lastRenderedMapInfo = null;

function computeMapSnapshot() {
  try {
    const parts = [state.mapSize.w, state.mapSize.h];
    
    // 0.8.10 - Include explorer ID and bonuses in snapshot to update tooltips
    const explorer = state.survivors.find(s => s.id === state.selectedExplorerId);
    const explorerKey = explorer 
      ? `${explorer.id}:${explorer.classBonuses?.exploration || 1}:${hasAbility(explorer, 'pathfinder') ? 1 : 0}`
      : 'none';
    parts.push(explorerKey);
    
    for (let i = 0; i < state.tiles.length; i++) {
      const t = state.tiles[i];
      const aliensAlive = (t.aliens && t.aliens.some(a => a && a.hp > 0)) ? 1 : 0;
      parts.push(`${t.type}:${t.scouted?1:0}:${t.cleared?1:0}:${aliensAlive}`);
    }
    return parts.join('|');
  } catch (e) {
    // Fallback to force render on error
    return String(Math.random());
  }
}

function updateUI() {
  // 0.8.6 - Include consumption in resource snapshot
  const resourceSnapshot = JSON.stringify({
    oxygen: Math.floor(state.resources.oxygen),
    food: Math.floor(state.resources.food),
    energy: Math.floor(state.resources.energy),
    scrap: Math.floor(state.resources.scrap),
    oxygenRate: state.production.oxygen.toFixed(1),
    foodRate: state.production.food.toFixed(1),
    energyRate: state.production.energy.toFixed(1),
    scrapRate: state.production.scrap.toFixed(1),
    oxygenConsume: state.consumption?.oxygen.toFixed(1) || '0.0',
    foodConsume: state.consumption?.food.toFixed(1) || '0.0',
    energyConsume: state.consumption?.energy.toFixed(1) || '0.0'
  });
  
  if (lastRenderedResourceSnapshot !== resourceSnapshot) {
    lastRenderedResourceSnapshot = resourceSnapshot;
    el('res-oxygen').textContent = `O₂: ${Math.floor(state.resources.oxygen)}%`;
    el('res-food').textContent = `Food: ${Math.floor(state.resources.food)}`;
    el('res-energy').textContent = `Energy: ${Math.floor(state.resources.energy)}`;
    el('res-scrap').textContent = `Scrap: ${Math.floor(state.resources.scrap)}`;
    el('res-oxygen-rate').textContent = `+${state.production.oxygen.toFixed(1)}%/s`;
    el('res-food-rate').textContent = `+${state.production.food.toFixed(1)}/s`;
    el('res-energy-rate').textContent = `+${state.production.energy.toFixed(1)}/s`;
    el('res-scrap-rate').textContent = `+${state.production.scrap.toFixed(1)}/s`;
    
    // 0.8.6 - Show consumption rates
    if (state.consumption) {
      el('res-oxygen-consume').textContent = `-${state.consumption.oxygen.toFixed(1)}%/s`;
      el('res-food-consume').textContent = `-${state.consumption.food.toFixed(1)}/s`;
      el('res-energy-consume').textContent = `-${state.consumption.energy.toFixed(1)}/s`;
    }
  }

  // 0.8.10 - Only update survivor count if changed
  const currentSurvivorCount = state.survivors.length;
  if (lastRenderedSurvivorCount !== currentSurvivorCount) {
    lastRenderedSurvivorCount = currentSurvivorCount;
    el('survivorCount').textContent = currentSurvivorCount;
  }
  renderSurvivors();

  // 0.8.5 - Only update systems panel if values changed
  const filterFailures = state.systemFailures.filter(f => f.type === 'filter').length;
  const genFailures = state.systemFailures.filter(f => f.type === 'generator').length;
  const turretFailures = state.systemFailures.filter(f => f.type === 'turret').length;
  const hasFailures = filterFailures + genFailures + turretFailures > 0;
  
  const systemSnapshot = JSON.stringify({
    filter: state.systems.filter,
    generator: state.systems.generator,
    turret: state.systems.turret,
    filterFail: filterFailures,
    genFail: genFailures,
    turretFail: turretFailures
  });
  
  if (lastRenderedSystemSnapshot !== systemSnapshot) {
    lastRenderedSystemSnapshot = systemSnapshot;
    
    const costFilter = BALANCE.UPGRADE_COSTS.filter.base + state.systems.filter * BALANCE.UPGRADE_COSTS.filter.perLevel;
    const costGen = BALANCE.UPGRADE_COSTS.generator.base + state.systems.generator * BALANCE.UPGRADE_COSTS.generator.perLevel;
    // 0.8.4 - Scale turret costs by 10% per existing turret
    const turretScalingFactor = 1 + (state.systems.turret * 0.10);
    const costTurScrap = Math.ceil(BALANCE.UPGRADE_COSTS.turret.scrap * turretScalingFactor);
    const costTurEnergy = Math.ceil(BALANCE.UPGRADE_COSTS.turret.energy * turretScalingFactor);
  
    el('sys-filter').textContent = `Cost: ${costFilter} scrap • Level ${state.systems.filter}` + (filterFailures > 0 ? ` ⚠️ Failed` : '');
    el('sys-generator').textContent = `Cost: ${costGen} scrap • Level ${state.systems.generator}` + (genFailures > 0 ? ` ⚠️ Failed` : '');
    el('sys-turret').textContent = state.systems.turret > 0
      ? `Cost: ${costTurScrap}s/${costTurEnergy}e • ${state.systems.turret} turret(s)` + (turretFailures > 0 ? ` ⚠️ ${turretFailures} failed` : '')
      : `Cost: ${costTurScrap}s/${costTurEnergy}e • Offline` + (turretFailures > 0 ? ` ⚠️ ${turretFailures} failed` : '');
    
    // Show/hide repair section
    el('systemRepairs').style.display = hasFailures ? 'block' : 'none';
    el('btnRepairFilter').style.display = filterFailures > 0 ? 'inline-block' : 'none';
    el('btnRepairGenerator').style.display = genFailures > 0 ? 'inline-block' : 'none';
    el('btnRepairTurret').style.display = turretFailures > 0 ? 'inline-block' : 'none';
    
    // Update repair button text with costs (or FREE if Repair Kit available)
    const hasRepairKit = state.inventory.some(i => i.type === 'consumable' && i.subtype === 'repair_kit');
    
    if (filterFailures > 0) {
      if (hasRepairKit) {
        el('btnRepairFilter').textContent = `Repair Filter (Free with Repair Kit)`;
      } else {
        const costs = BALANCE.REPAIR_COSTS.filter;
        el('btnRepairFilter').textContent = `Repair Filter (${costs.scrap}s/${costs.energy}e)`;
      }
    }
    if (genFailures > 0) {
      if (hasRepairKit) {
        el('btnRepairGenerator').textContent = `Repair Generator (Free with Repair Kit)`;
      } else {
        const costs = BALANCE.REPAIR_COSTS.generator;
        const costText = costs.energy > 0 ? `${costs.scrap}s/${costs.energy}e` : `${costs.scrap}s`;
        el('btnRepairGenerator').textContent = `Repair Generator (${costText})`;
      }
    }
    if (turretFailures > 0) {
      if (hasRepairKit) {
        el('btnRepairTurret').textContent = `Repair Turret (Free with Repair Kit)`;
      } else {
        const costs = BALANCE.REPAIR_COSTS.turret;
        el('btnRepairTurret').textContent = `Repair Turret (${costs.scrap}s/${costs.energy}e)`;
      }
    }
  }

  // inventory
  renderInventory();

  // map
  renderMap();
  
  // 0.8.10 - Only update map info if changed
  const mapInfoText = `Explored: ${state.explored.size}/${state.mapSize.w * state.mapSize.h}`;
  if (lastRenderedMapInfo !== mapInfoText) {
    lastRenderedMapInfo = mapInfoText;
    el('mapInfo').textContent = mapInfoText;
  }

  // Show "New Map" button when map is fully explored
  const totalTiles = state.mapSize.w * state.mapSize.h;
  const btnNewMap = el('btnNewMap');
  if (btnNewMap) {
    if (state.explored.size >= totalTiles) {
      btnNewMap.style.display = 'inline-block';
    } else {
      btnNewMap.style.display = 'none';
    }
  }

  // 0.8.5 - Only update threat panel if values changed
  const last = Number(state.lastRaidAt) || 0;
  const dur = Number(state.raidCooldownMs) || 0;
  const now = Date.now();
  const remMs = Math.max(0, (last + dur) - now);
  const totalSec = Math.ceil(remMs / 1000);
  
  const threatSnapshot = JSON.stringify({
    threat: Math.round(Math.max(0, Math.min(100, Number(state.threat) || 0))),
    integrity: Math.max(0, Math.floor(state.baseIntegrity)),
    raidChance: ((Number(state.raidChance) || 0) * 100).toFixed(2),
    cooldownSec: totalSec,
    tech: state.resources.tech,
    ammo: state.resources.ammo,
    played: state.secondsPlayed,
    alienKills: state.alienKills,
    activeGuards: state.survivors.filter(s => s.task === 'Guard' && !s.onMission).length,
    totalSurvivors: state.survivors.length,
    activeExpeditions: state.missions.length,
    inventoryUsage: state.inventory.length,
    inventoryCapacity: getInventoryCapacity(),
    exploredTiles: state.explored.size,
    escalationLevel: state.escalationLevel,
    threatLocked: state.threatLocked
  });
  
  if (lastRenderedThreatSnapshot !== threatSnapshot) {
    lastRenderedThreatSnapshot = threatSnapshot;
    
    el('threatLevel').textContent = threatText();
    // Clarify what threat means via tooltip
    const threatTooltip = state.threatLocked 
      ? 'Threat is locked at 100%. Escalation level now controls difficulty scaling for all aliens (raids and exploration).' 
      : `Threat reflects alien activity around the station.

Higher threat increases:
• Raid frequency and size
• Alien stats (HP, attack) in ALL encounters
• Special ability chances
• Stronger alien types appearing

Threat Floors (permanent minimums once reached):
• 0% → 25% → 50% → 75% → 100% (locks permanently)

Guards and turrets slow threat growth (min +0.5%/min).
Threat locks at 100% (escalation takes over).`;
    try { el('threatLevel').title = threatTooltip; } catch(e) {}
    
    // Show escalation level when threat is locked at 100%
    const escRow = document.getElementById('escalationRow');
    const escLevel = document.getElementById('escalationLevel');
    if (escRow && escLevel && state.threatLocked && state.threat >= 100) {
      const hpBonus = (state.escalationLevel * BALANCE.ESCALATION_HP_MULT * 100).toFixed(0);
      const atkBonus = (state.escalationLevel * BALANCE.ESCALATION_ATTACK_MULT * 100).toFixed(0);
      const armorBonus = Math.floor(state.escalationLevel / BALANCE.ESCALATION_ARMOR_LEVELS);
      const modBonus = (state.escalationLevel * BALANCE.ESCALATION_MODIFIER_MULT * 100).toFixed(0);
      
      escLevel.textContent = state.escalationLevel;
      escRow.style.display = '';
      
      // Add detailed tooltip showing bonuses
      try {
        escRow.title = `Endgame Difficulty Scaling\n\nAll aliens (raids AND exploration) gain:\n+${hpBonus}% HP\n+${atkBonus}% Attack\n+${armorBonus} Armor\n+${modBonus}% Special Ability Chance\n\nEscalation increases:\n• Every 5 minutes at 100% threat\n• Each raid survived at 100% threat\n• Reduces raid cooldowns by 30s per level`;
      } catch(e) {}
    } else if (escRow) {
      escRow.style.display = 'none';
    }
    
    // Base Integrity with tier color and bar
    const integrity = Math.max(0, Math.floor(state.baseIntegrity));
    const integrityTier = getIntegrityTier(integrity);
    const integrityName = getIntegrityTierName(integrityTier);
    const integrityColor = getIntegrityTierColor(integrityTier);
    
    // Build integrity tooltip
    const integrityPenalty = [0, 5, 10, 20, 30][integrityTier];
    const integrityTooltip = `${integrityName}\n\nProduction Penalty: -${integrityPenalty}%\n\nDamage Sources:\n• Failed systems: -0.05/tick each\n• High threat (>75%): -0.02/tick\n\nRepair:\n• Manual repair button below\n• Idle Engineers: +0.1/tick each`;
    
    el('baseIntegrity').textContent = `${integrityName} (${integrity}%)`;
    el('baseIntegrity').style.color = integrityColor;
    el('baseIntegrity').style.fontWeight = 'bold';
    
    // Add tooltip to the entire section
    const integritySection = el('baseIntegritySection');
    if (integritySection) {
      integritySection.title = integrityTooltip;
    }
    
    // Update integrity bar
    const integrityBar = el('baseIntegrityBar');
    if (integrityBar) {
      integrityBar.style.width = `${integrity}%`;
      integrityBar.style.background = integrityColor;
    }
    
    // Update repair button
    const repairBtn = el('btnRepairBase');
    if (repairBtn) {
      const missingIntegrity = 100 - integrity;
      if (missingIntegrity <= 0) {
        repairBtn.disabled = true;
        repairBtn.textContent = 'Base at Full Integrity';
        repairBtn.title = 'Base integrity is at 100%. No repairs needed.';
      } else {
        // Calculate repair cost with Engineer bonuses
        const engineers = state.survivors.filter(s => s.class === 'Engineer');
        let costMult = 1.0;
        engineers.forEach(eng => {
          const bonus = eng.classBonuses?.repairCostReduction || 0;
          costMult -= bonus;
        });
        costMult = Math.max(0.5, costMult); // Cap at 50% reduction
        
        const scrapCostPerPercent = Math.ceil((BALANCE.BASE_REPAIR_SCRAP_COST / 100) * costMult);
        const energyCostPerPercent = Math.ceil((BALANCE.BASE_REPAIR_ENERGY_COST / 100) * costMult);
        
        const canAffordAny = state.resources.scrap >= scrapCostPerPercent && state.resources.energy >= energyCostPerPercent;
        repairBtn.disabled = !canAffordAny;
        
        const fullScrapCost = Math.ceil(BALANCE.BASE_REPAIR_SCRAP_COST * (missingIntegrity / 100) * costMult);
        const fullEnergyCost = Math.ceil(BALANCE.BASE_REPAIR_ENERGY_COST * (missingIntegrity / 100) * costMult);
        repairBtn.textContent = `Repair Base (${fullScrapCost} scrap, ${fullEnergyCost} energy)`;
        
        let tooltipText = `Repairs as much integrity as you can afford. Costs ${scrapCostPerPercent} scrap and ${energyCostPerPercent} energy per 1%.`;
        if (engineers.length > 0) {
          const discount = Math.floor((1 - costMult) * 100);
          tooltipText += `\n\nEngineer discount: -${discount}% cost`;
        }
        repairBtn.title = tooltipText;
      }
    }
    
    // Warning flash for critical thresholds
    const threatPanel = el('threatBasePanel');
    if (threatPanel) {
      // Check if base integrity is critical (<20%)
      const integrityIsCritical = integrity < 20;
      
      if (integrityIsCritical) {
        threatPanel.classList.add('critical-warning');
      } else {
        threatPanel.classList.remove('critical-warning');
      }
    }
    
    const rcEl = document.getElementById('raidChance');
    if (rcEl) {
      const pct = (Number(state.raidChance) || 0) * 100;
      // Show two decimals so small chances are visible (e.g., 0.05%)
      rcEl.textContent = `${pct.toFixed(2)}%`;
    }
    // Raid cooldown indicator (only show when active)
    const cdRow = document.getElementById('raidCooldownRow');
    const cdSpan = document.getElementById('raidCooldown');
    if (cdRow && cdSpan) {
      if (last > 0 && dur > 0 && remMs > 0) {
        // format remaining time as mm:ss or hh:mm:ss
        const h = Math.floor(totalSec / 3600);
        const m = Math.floor((totalSec % 3600) / 60);
        const s = totalSec % 60;
        const pad = (n) => String(n).padStart(2, '0');
        cdSpan.textContent = h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
        cdRow.style.display = '';
      } else {
        cdRow.style.display = 'none';
      }
    }
    
    el('alienKills').textContent = state.alienKills;
    el('activeGuards').textContent = state.survivors.filter(s => s.task === 'Guard' && !s.onMission).length;
    el('totalSurvivors').textContent = state.survivors.length;
    el('activeExpeditions').textContent = state.missions.length;
    el('inventoryUsage').textContent = `${state.inventory.length}/${getInventoryCapacity()}`;
    el('exploredTiles').textContent = state.explored.size;

    // (loot preview removed)
    el('statTech').textContent = state.resources.tech;
    el('statAmmo').textContent = state.resources.ammo;
    
    // Update time played display in header
    el('timePlayed').textContent = `Time: ${formatTime(state.secondsPlayed)}`;
  }

  // 0.8.1 - Render workbench with dynamic costs
  renderWorkbench();

  renderExpeditionSurvivorSelect();
  renderExplorerSelect();
}

function renderExplorerSelect() {
  const cont = el('explorerDropdown');
  const availableSurvivors = state.survivors.filter(s => !s.onMission);
  const availableSurvivorsSnapshot = JSON.stringify(availableSurvivors);

  // Optimization: Only re-render if the list of available explorers has changed.
  if (lastRenderedAvailableExplorers === availableSurvivorsSnapshot) {
    return; // Skip re-render to preserve focus
  }
  lastRenderedAvailableExplorers = availableSurvivorsSnapshot;

  cont.innerHTML = '';

  if (availableSurvivors.length === 0) {
    cont.textContent = 'No explorers available';
    return;
  }

  // Use state.selectedExplorerId for persistence
  if (!state.selectedExplorerId || !availableSurvivors.some(s => s.id === state.selectedExplorerId)) {
    state.selectedExplorerId = availableSurvivors[0].id;
  }

  // Create selector with arrow buttons
  const selector = document.createElement('div');
  selector.className = 'task-selector';
  
  const upArrow = document.createElement('button');
  upArrow.className = 'task-arrow task-arrow-up';
  upArrow.type = 'button';
  upArrow.textContent = '▲';
  upArrow.title = 'Previous explorer';
  
  const display = document.createElement('div');
  display.className = 'task-display';
  const selectedSurvivor = availableSurvivors.find(s => s.id === state.selectedExplorerId);
  display.textContent = selectedSurvivor ? selectedSurvivor.name : 'Select Explorer';
  display.title = 'Selected for exploration';
  
  const downArrow = document.createElement('button');
  downArrow.className = 'task-arrow task-arrow-down';
  downArrow.type = 'button';
  downArrow.textContent = '▼';
  downArrow.title = 'Next explorer';
  
  // Up arrow click handler (previous explorer)
  upArrow.addEventListener('click', (e) => {
    e.stopPropagation();
    const currentIdx = availableSurvivors.findIndex(s => s.id === state.selectedExplorerId);
    let newIdx = currentIdx - 1;
    if (newIdx < 0) newIdx = availableSurvivors.length - 1; // Wrap to end
    
    state.selectedExplorerId = availableSurvivors[newIdx].id;
    display.textContent = availableSurvivors[newIdx].name;
    appendLog(`${availableSurvivors[newIdx].name} selected for exploration.`);
  });
  
  // Down arrow click handler (next explorer)
  downArrow.addEventListener('click', (e) => {
    e.stopPropagation();
    const currentIdx = availableSurvivors.findIndex(s => s.id === state.selectedExplorerId);
    let newIdx = currentIdx + 1;
    if (newIdx >= availableSurvivors.length) newIdx = 0; // Wrap to start
    
    state.selectedExplorerId = availableSurvivors[newIdx].id;
    display.textContent = availableSurvivors[newIdx].name;
    appendLog(`${availableSurvivors[newIdx].name} selected for exploration.`);
  });
  
  selector.appendChild(upArrow);
  selector.appendChild(display);
  selector.appendChild(downArrow);
  cont.appendChild(selector);
}

function updateExpeditionTimers() {
  state.survivors.forEach(s => {
    if (s.onMission) {
      const statusEl = document.querySelector(`#survivor-${s.id}-status`);
      if (statusEl) {
        const activeMission = state.missions.find(m => m.party.includes(s.id) && m.status === 'active');
        if (activeMission) {
          const remainingSec = Math.max(0, activeMission.durationSec - activeMission.progress);
          statusEl.textContent = `Lvl ${s.level} • On Expedition (${formatTime(remainingSec)})`;
        }
      }
    }
  });
}

function renderSurvivors() {
  const cont = el('survivorList');

  // Create a snapshot of just the core survivor data (excluding mission progress AND morale)
  const currentSurvivorsSnapshot = JSON.stringify(state.survivors.map(s => ({
    id: s.id,
    name: s.name,
    level: s.level,
    xp: s.xp,
    nextXp: s.nextXp,
    hp: s.hp,
    maxHp: s.maxHp,
    class: s.class,
    task: s.task,
    onMission: s.onMission,
    abilities: s.abilities,
    equipment: s.equipment,
    downed: s.downed,
    injured: s.injured
    // Explicitly exclude morale to prevent re-render on every tick
  })));

  // Only do full re-render if core survivor data changed (and we have survivors)
  if (lastRenderedSurvivors === currentSurvivorsSnapshot && state.survivors.length > 0) {
    updateExpeditionTimers();
    // Update morale bars without full re-render
    state.survivors.forEach(s => {
      const moraleBar = el(`moraleBar-${s.id}`);
      const moraleText = el(`morale-${s.id}`);
      const moraleSection = el(`moraleSection-${s.id}`);
      if (moraleBar && moraleText && moraleSection) {
        const morale = Math.floor(s.morale || 0);
        const moraleTier = getMoraleTier(morale);
        const moraleTierName = getMoraleTierName(moraleTier);
        const moraleColor = getMoraleTierColor(moraleTier);
        moraleBar.style.width = `${morale}%`;
        moraleBar.style.background = moraleColor;
        moraleText.textContent = `${moraleTierName} (${morale})`;
        moraleText.style.color = moraleColor;
        
        // Update tooltip dynamically
        const moraleModifiers = getMoraleModifier({ morale: morale });
        const prodMod = Math.round((moraleModifiers.production - 1) * 100);
        const combatMod = Math.round((moraleModifiers.combat - 1) * 100);
        const xpMod = Math.round((moraleModifiers.xp - 1) * 100);
        moraleSection.title = `${moraleTierName}\n\nCurrent Modifiers:\n• Production: ${prodMod >= 0 ? '+' : ''}${prodMod}%\n• Combat Damage: ${combatMod >= 0 ? '+' : ''}${combatMod}%\n• XP Gain: ${xpMod >= 0 ? '+' : ''}${xpMod}%\n\nGains: Kills, victories, level ups\nLosses: Deaths, retreats, crises`;
      }
    });
    return;
  }

  lastRenderedSurvivors = currentSurvivorsSnapshot;

  cont.innerHTML = '';
  if (state.survivors.length === 0) {
    console.log('[DEBUG] No survivors, showing message');
    cont.textContent = 'No survivors present.';
    return;
  }
  state.survivors.forEach(s => {
    const card = document.createElement('div');
    card.className = 'survivor-card';
    
    // 0.9.0 - Calculate effective max HP including armor bonuses
    const effectiveMaxHp = getEffectiveMaxHp(s);
    const healthPct = Math.max(0, Math.floor((s.hp / effectiveMaxHp) * 100));
    const morale = Math.floor(s.morale || 0);

    // Create task selector with arrow buttons
    const taskSelector = document.createElement('div');
    taskSelector.className = 'task-selector';
    
    const upArrow = document.createElement('button');
    upArrow.className = 'task-arrow task-arrow-up';
    upArrow.type = 'button';
    upArrow.textContent = '▲';
    upArrow.title = 'Previous task';
    
    const taskDisplay = document.createElement('div');
    taskDisplay.className = 'task-display';
    taskDisplay.textContent = s.task || 'Idle';
    taskDisplay.title = 'Selected task';
    
    const downArrow = document.createElement('button');
    downArrow.className = 'task-arrow task-arrow-down';
    downArrow.type = 'button';
    downArrow.textContent = '▼';
    downArrow.title = 'Next task';
    
    // Get current task index
    const currentIndex = TASKS.indexOf(s.task || 'Idle');
    
    // Up arrow click handler (previous task)
    upArrow.addEventListener('click', (e) => {
      e.stopPropagation();
      const currentIdx = TASKS.indexOf(s.task || 'Idle');
      let newIdx = currentIdx - 1;
      if (newIdx < 0) newIdx = TASKS.length - 1; // Wrap to end
      
      const newTask = TASKS[newIdx];
      
      // Check guard limit
      if (newTask === 'Guard') {
        const currentGuards = state.survivors.filter(surv => surv.task === 'Guard' && surv.id !== s.id && !surv.onMission).length;
        const maxGuards = BALANCE.MAX_GUARDS || 4;
        if (currentGuards >= maxGuards) {
          appendLog(`Cannot assign more guards. Maximum: ${maxGuards}`);
          updateUI();
          return;
        }
      }
      
      assignTask(s.id, newTask);
    });
    
    // Down arrow click handler (next task)
    downArrow.addEventListener('click', (e) => {
      e.stopPropagation();
      const currentIdx = TASKS.indexOf(s.task || 'Idle');
      let newIdx = currentIdx + 1;
      if (newIdx >= TASKS.length) newIdx = 0; // Wrap to start
      
      const newTask = TASKS[newIdx];
      
      // Check guard limit
      if (newTask === 'Guard') {
        const currentGuards = state.survivors.filter(surv => surv.task === 'Guard' && surv.id !== s.id && !surv.onMission).length;
        const maxGuards = BALANCE.MAX_GUARDS || 4;
        if (currentGuards >= maxGuards) {
          appendLog(`Cannot assign more guards. Maximum: ${maxGuards}`);
          updateUI();
          return;
        }
      }
      
      assignTask(s.id, newTask);
    });
    
    taskSelector.appendChild(upArrow);
    taskSelector.appendChild(taskDisplay);
    taskSelector.appendChild(downArrow);

    // Get expedition time remaining if on mission
    let expeditionStatus = '';
    if (s.onMission) {
      const activeMission = state.missions.find(m => m.party.includes(s.id) && m.status === 'active');
      if (activeMission) {
        const remainingSec = Math.max(0, activeMission.durationSec - activeMission.progress);
        expeditionStatus = `On Expedition (${formatTime(remainingSec)})`;
      } else {
        expeditionStatus = 'On Expedition';
      }
    }

    card.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div><strong style="color:var(--accent)">${s.name}</strong><div class="small" id="survivor-${s.id}-status"><span title="Level increases max HP and combat effectiveness.">Lvl ${s.level}</span> • ${s.onMission ? expeditionStatus : (s.task || 'Idle')}</div></div>
        <div class="small">HP ${s.hp}/${effectiveMaxHp}</div>
      </div>
      <div style="margin-top:6px" class="small">
        Exp: ${s.xp}/${s.nextXp} ${s.injured ? ' • Injured' : ''}
      </div>
      ${(() => {
        // 0.8.0 - Display class and abilities with tooltips
        const classInfo = SURVIVOR_CLASSES.find(c => c.id === s.class);
        const className = classInfo ? classInfo.name : (s.class || 'Unknown');
        const classDesc = classInfo ? classInfo.desc : '';
        let classDisplay = `<div style="margin-top:4px; font-size: 12px;"><span style="color: var(--class-common)" title="${classDesc}">Class: ${className}</span>`;
        
        if (s.abilities && s.abilities.length > 0) {
          const abilityNames = s.abilities.map(abilityId => {
            // Find the ability in SPECIAL_ABILITIES
            for (const classKey in SPECIAL_ABILITIES) {
              const found = SPECIAL_ABILITIES[classKey].find(a => a.id === abilityId);
              if (found) {
                return `<span style="color: ${found.color}" title="${found.effect}">${found.name}</span>`;
              }
            }
            return abilityId;
          });
          classDisplay += ` • ${abilityNames.join(', ')}`;
        }
        classDisplay += '</div>';
        
        // 0.8.10 - Display total bonuses (level + class + abilities)
        // Note: Level bonus ONLY applies to production tasks (Oxygen, Food, Energy, Scrap)
        const levelBonus = 1 + (s.level - 1) * BALANCE.LEVEL_PRODUCTION_BONUS;
        const levelPct = Math.round((levelBonus - 1) * 100);
        
        let bonusLines = [];
        
        // Production bonus (Engineer class + abilities, PLUS level) - 0.8.11 additive
        let prodBonusAdd = 0;
        if (s.classBonuses && s.classBonuses.production) prodBonusAdd += (s.classBonuses.production - 1);
        if (hasAbility(s, 'efficient')) prodBonusAdd += 0.15;
        if (hasAbility(s, 'overclock')) prodBonusAdd += 0.30;
        if (hasAbility(s, 'mastermind')) prodBonusAdd += 0.25;
        // Level bonus applies to production
        prodBonusAdd += (levelBonus - 1);
        if (prodBonusAdd > 0) {
          bonusLines.push(`Production: +${Math.round(prodBonusAdd * 100)}%`);
        }
        
        // Scrap bonus (Scavenger class + abilities, excluding level) - 0.8.11 additive
        let scrapBonusAdd = 0;
        if (s.classBonuses && s.classBonuses.scrap) scrapBonusAdd += (s.classBonuses.scrap - 1);
        if (hasAbility(s, 'salvage')) scrapBonusAdd += 0.25;
        if (scrapBonusAdd > 0) {
          bonusLines.push(`Scrap: +${Math.round(scrapBonusAdd * 100)}%`);
        }
        
        // Combat bonus (Soldier class + abilities + level)
        let combatBonusAdd = 0;
        if (s.classBonuses && s.classBonuses.combat) combatBonusAdd += (s.classBonuses.combat - 1);
        if (hasAbility(s, 'veteran')) combatBonusAdd += 0.20;
        if (hasAbility(s, 'berserker') && s.hp < s.maxHp * 0.3) {
          combatBonusAdd += 0.30;
        }
        combatBonusAdd += (s.level - 1) * BALANCE.LEVEL_ATTACK_BONUS;
        if (combatBonusAdd > 0) {
          bonusLines.push(`Combat: +${Math.round(combatBonusAdd * 100)}%`);
        }
        
        // Accuracy bonus (from level, abilities, and equipment)
        let totalAccuracyBonus = 0;
        totalAccuracyBonus += (s.level - 1) * BALANCE.LEVEL_ACCURACY_BONUS;
        if (s.classBonuses && s.classBonuses.accuracy) {
          totalAccuracyBonus += s.classBonuses.accuracy;
        }
        if (hasAbility(s, 'marksman')) {
          totalAccuracyBonus += 0.10;
        }
        const weapon = s.equipment.weapon;
        if (weapon && weapon.effects) {
          const accuracyEffect = weapon.effects.find(e => e.startsWith('accuracy:'));
          if (accuracyEffect) {
            const value = parseInt(accuracyEffect.split(':')[1]) || 0;
            totalAccuracyBonus += value / 100;
          }
        }
        if (totalAccuracyBonus > 0) {
          bonusLines.push(`Accuracy: +${Math.round(totalAccuracyBonus * 100)}%`);
        }

        // Crit chance bonus
        let totalCritBonus = 0;
        if (s.classBonuses && s.classBonuses.crit) {
            totalCritBonus += s.classBonuses.crit;
        }
        if (hasAbility(s, 'tactical')) {
            totalCritBonus += 0.15;
        }
        if (weapon && weapon.effects) {
            const critEffect = weapon.effects.find(e => e.startsWith('crit:'));
            if (critEffect) {
                const value = parseInt(critEffect.split(':')[1]) || 0;
                totalCritBonus += value / 100;
            }
        }
        const armor = s.equipment.armor;
        if (armor && armor.effects) {
            const critEffect = armor.effects.find(e => e.startsWith('crit:'));
            if (critEffect) {
                const value = parseInt(critEffect.split(':')[1]) || 0;
                totalCritBonus += value / 100;
            }
        }
        if (totalCritBonus > 0) {
            bonusLines.push(`Crit Chance: +${Math.round(totalCritBonus * 100)}%`);
        }
        let healingBonusAdd = 0;
        if (s.classBonuses && s.classBonuses.healing) healingBonusAdd += (s.classBonuses.healing - 1);
        if (hasAbility(s, 'triage')) healingBonusAdd += 0.25;
        if (healingBonusAdd > 0) {
          bonusLines.push(`Healing: +${Math.round(healingBonusAdd * 100)}%`);
        }
        
        // Defense (Guardian/Soldier class + abilities + armor)
        let defenseBonus = 0;
        if (s.classBonuses && s.classBonuses.defense) defenseBonus += s.classBonuses.defense;
        // Read defense value directly from armor item (works for all armor types)
        if (s.equipment.armor && s.equipment.armor.defense !== undefined) {
          defenseBonus += s.equipment.armor.defense;
        }
        if (hasAbility(s, 'stalwart') && s.task === 'Guard') defenseBonus += 3;
        if (hasAbility(s, 'fortress')) defenseBonus += 5;
        if (defenseBonus > 0) {
          bonusLines.push(`Defense: +${defenseBonus}`);
        }
        
        // Dodge (Scout class + abilities)
        let dodgeChance = 0;
        if (s.class === 'scout' && s.classBonuses && s.classBonuses.dodge) {
          dodgeChance += (s.classBonuses.dodge - 1);
        }
        if (hasAbility(s, 'evasive')) dodgeChance += 0.20;
        if (hasAbility(s, 'ghost')) dodgeChance += 0.35;
        if (dodgeChance > 0) {
          bonusLines.push(`Dodge: ${Math.round(dodgeChance * 100)}%`);
        }
        
        // Retreat bonus (Scout class + abilities)
        let retreatBonus = 0;
        if (s.classBonuses && s.classBonuses.retreat) {
          retreatBonus += (s.classBonuses.retreat - 1);
        }
        if (hasAbility(s, 'ghost')) {
          retreatBonus += 0.25;
        }
        if (retreatBonus > 0) {
          bonusLines.push(`Retreat: +${Math.round(retreatBonus * 100)}%`);
        }
        
        // Exploration cost (Scout class + abilities) - Note: multiplicative is okay for cost reduction
        let explorationCostMult = 1;
        if (s.classBonuses && s.classBonuses.exploration) explorationCostMult *= s.classBonuses.exploration;
        if (hasAbility(s, 'pathfinder')) explorationCostMult *= 0.85;
        if (explorationCostMult < 1) {
          bonusLines.push(`Exploration: ${Math.round((1 - explorationCostMult) * 100)}% cheaper`);
        }
        
        // Loot quality (Scavenger class + abilities)
        let lootBonus = 0;
        if (s.classBonuses && s.classBonuses.loot) lootBonus += (s.classBonuses.loot - 1);
        if (hasAbility(s, 'keen')) lootBonus += 0.20;
        if (hasAbility(s, 'treasure')) lootBonus += 0.25;
        if (hasAbility(s, 'goldnose')) lootBonus += 0.50;
        if (lootBonus > 0) {
          bonusLines.push(`Loot: +${Math.round(lootBonus * 100)}% rarity`);
        }
        
        // Crafting cost (Technician class + abilities)
        let craftingCostMult = 1;
        if (s.classBonuses && s.classBonuses.crafting) craftingCostMult *= s.classBonuses.crafting;
        if (hasAbility(s, 'resourceful')) craftingCostMult *= 0.90;
        if (hasAbility(s, 'prodigy')) craftingCostMult *= 0.75;
        if (craftingCostMult < 1) {
          bonusLines.push(`Crafting: ${Math.round((1 - craftingCostMult) * 100)}% cheaper`);
        }

        // Repair cost (Engineer class + abilities)
        let repairCostMult = 1;
        if (s.classBonuses && s.classBonuses.repair) repairCostMult *= s.classBonuses.repair;
        if (hasAbility(s, 'quickfix')) repairCostMult *= 0.80;
        if (repairCostMult < 1) {
            bonusLines.push(`Repair: ${Math.round((1 - repairCostMult) * 100)}% cheaper`);
        }
        
        // Durability (Technician class + abilities)
        let durabilityBonusAdd = 0;
        if (s.classBonuses && s.classBonuses.durability) durabilityBonusAdd += (s.classBonuses.durability - 1);
        if (hasAbility(s, 'durable')) durabilityBonusAdd += 0.20;
        if (hasAbility(s, 'prodigy')) durabilityBonusAdd += 0.30;
        if (durabilityBonusAdd > 0) {
          bonusLines.push(`Durability: +${Math.round(durabilityBonusAdd * 100)}%`);
        }
        
        // Morale (Guardian class + abilities)
        let moraleBonus = 0;
        if (s.classBonuses && s.classBonuses.morale && s.classBonuses.morale > 1) {
            moraleBonus += (s.classBonuses.morale - 1);
        }
        if (hasAbility(s, 'rallying')) {
            moraleBonus += 0.05;
        }
        if (moraleBonus > 0) {
            bonusLines.push(`Morale Aura: +${Math.round(moraleBonus * 100)}%`);
        }
        
        // XP bonus (Scientist class + abilities)
        let xpBonusAdd = 0;
        if (s.classBonuses && s.classBonuses.xp) xpBonusAdd += (s.classBonuses.xp - 1);
        if (hasAbility(s, 'studious')) xpBonusAdd += 0.15;
        if (hasAbility(s, 'genius')) xpBonusAdd += 0.25;
        if (xpBonusAdd > 0) {
          bonusLines.push(`XP: +${Math.round(xpBonusAdd * 100)}%`);
        }

        // Misc bonuses
        if (hasAbility(s, 'veteran')) {
            bonusLines.push(`Max HP: +10`);
        }
        const hoarderCount = s.abilities.filter(a => a === 'hoarder').length;
        if (hoarderCount > 0) {
            bonusLines.push(`Inventory: +${hoarderCount * 2}`);
        }
        
        if (bonusLines.length > 0) {
          classDisplay += `<div style="font-size: 11px; color: var(--muted); margin-top: 2px;">`;
          classDisplay += bonusLines.join(' • ');
          classDisplay += `</div>`;
        }
        
        return classDisplay;
      })()}
      <div style="margin-top:4px; font-size: 11px; color: var(--muted);">
        Equipped: ${(() => {
          const weaponColor = s.equipment.weapon?.rarity ? (RARITY_COLORS[s.equipment.weapon.rarity] || '#ffffff') : '#ffffff';
          const armorColor = s.equipment.armor?.rarity ? (RARITY_COLORS[s.equipment.armor.rarity] || '#ffffff') : '#ffffff';
          const weaponTooltip = s.equipment.weapon ? getItemTooltip(s.equipment.weapon) : '';
          const armorTooltip = s.equipment.armor ? getItemTooltip(s.equipment.armor) : '';
          const weaponName = s.equipment.weapon?.name ? `<span style="color:${weaponColor}" title="${weaponTooltip}">${s.equipment.weapon.name}</span>` : 'None';
          const armorName = s.equipment.armor?.name ? `<span style="color:${armorColor}" title="${armorTooltip}">${s.equipment.armor.name}</span>` : 'None';
          return `${weaponName} / ${armorName}`;
        })()}
      </div>
      <div id="moraleSection-${s.id}" style="margin-top:8px;">
        <div style="display:flex;justify-content:space-between;font-size:11px;">
          <span>Morale:</span>
          <span id="morale-${s.id}" style="font-weight:bold; color: ${getMoraleTierColor(getMoraleTier(morale))}">${getMoraleTierName(getMoraleTier(morale))} (${morale})</span>
        </div>
        <div style="width:100%;height:8px;background:#333;border-radius:4px;margin-top:2px;box-shadow:inset 0 1px 2px rgba(0,0,0,0.3);">
          <div id="moraleBar-${s.id}" style="width:${morale}%;height:100%;background:${getMoraleTierColor(getMoraleTier(morale))};transition:width 0.3s, background 0.3s;border-radius:4px;"></div>
        </div>
      </div>
      <div style="display:flex;gap:6px;margin-top:8px;align-items:center">
        <div id="task-select-${s.id}" style="flex:1"></div>
        <button data-id="${s.id}" class="equip" style="flex:0 0 auto">Equip</button>
        <button data-id="${s.id}" class="use-item" style="flex:0 0 auto">Use Item</button>
        <button data-id="${s.id}" class="dismiss" style="flex:0 0 auto" ${state.survivors.length <= 1 ? 'disabled title="Cannot release your last survivor"' : ''}>Release</button>
      </div>
    `;
    cont.appendChild(card);
    // Insert the task selector with arrows
    el(`task-select-${s.id}`).appendChild(taskSelector);
    
    // Add morale tooltip to the entire section
    const moraleSection = el(`moraleSection-${s.id}`);
    if (moraleSection) {
      const survivorMorale = Math.floor(s.morale || 0);
      const moraleModifiers = getMoraleModifier({ morale: survivorMorale });
      const prodMod = Math.round((moraleModifiers.production - 1) * 100);
      const combatMod = Math.round((moraleModifiers.combat - 1) * 100);
      const xpMod = Math.round((moraleModifiers.xp - 1) * 100);
      moraleSection.title = `${getMoraleTierName(getMoraleTier(survivorMorale))}\n\nCurrent Modifiers:\n• Production: ${prodMod >= 0 ? '+' : ''}${prodMod}%\n• Combat Damage: ${combatMod >= 0 ? '+' : ''}${combatMod}%\n• XP Gain: ${xpMod >= 0 ? '+' : ''}${xpMod}%\n\nGains: Kills, victories, level ups\nLosses: Deaths, retreats, crises`;
    }
  });

  // bind controls
  cont.querySelectorAll('select.task-select').forEach(select => {
    select.onchange = (e) => assignTask(Number(e.target.dataset.id), e.target.value);
  });
  cont.querySelectorAll('button.dismiss').forEach(b => b.onclick = () => releaseSurvivor(Number(b.dataset.id)));
  cont.querySelectorAll('button.use-item').forEach(b => b.onclick = () => openConsumableModal(Number(b.dataset.id)));
  cont.querySelectorAll('button.equip').forEach(b => b.onclick = () => openLoadoutForSurvivor(Number(b.dataset.id)));
}

// Consumable Modal Logic
let activeConsumableSurvivorId = null;

function openConsumableModal(survivorId) {
    activeConsumableSurvivorId = survivorId;
    const modal = el('consumableModal');
    modal.style.display = 'flex';
    renderConsumableModalContent();
    const btnClose = el('btnCloseConsumableModal');
    if (btnClose) btnClose.onclick = closeConsumableModal;
}

function closeConsumableModal() {
    const modal = el('consumableModal');
    modal.style.display = 'none';
    activeConsumableSurvivorId = null;
}

function renderConsumableModalContent() {
    const cont = el('consumableModalContent');
    const survivor = state.survivors.find(s => s.id === activeConsumableSurvivorId);
    if (!survivor) {
        cont.innerHTML = '<div class="small">No survivor selected.</div>';
        return;
    }

    const outOfCombatConsumables = state.inventory.filter(item => {
        const key = item.subtype || item.type;
        const effect = BALANCE.CONSUMABLE_EFFECTS[key];
        return effect && (effect.heal || effect.permanentHP || effect.threatReduction);
    });

    if (outOfCombatConsumables.length === 0) {
        cont.innerHTML = '<div class="small">No usable consumables in inventory.</div>';
        return;
    }

    const itemsHtml = outOfCombatConsumables.map(item => {
        const key = item.subtype || item.type;
        const effect = BALANCE.CONSUMABLE_EFFECTS[key];
        const color = item.rarity ? (RARITY_COLORS[item.rarity] || '#ffffff') : '#ffffff';
        const tooltip = getItemTooltip(item);
        
        return `
            <div class="inv-row">
                <div>
                    <span style="color:${color}" title="${tooltip}">${item.name}</span>
                    <div class="small">${effect.desc}</div>
                </div>
                <button data-id="${item.id}" class="use-consumable">Use</button>
            </div>
        `;
    }).join('');

    cont.innerHTML = `
        <div style="display:flex;flex-direction:column;gap:12px;">
            <div class="small">Select a consumable to use on ${survivor.name}.</div>
            <div class="scrollable-panel" style="max-height:300px;overflow-y:auto;">
                ${itemsHtml}
            </div>
        </div>
    `;

    // Bind events
    cont.querySelectorAll('button.use-consumable').forEach(b => {
        b.onclick = () => {
            useOutOfCombatConsumable(activeConsumableSurvivorId, Number(b.dataset.id));
            closeConsumableModal();
        };
    });
}

// Repair Modal Logic
function openRepairModal() {
  const modal = el('repairModal');
  modal.style.display = 'flex';
  renderRepairModalContent();
  const btnClose = el('btnCloseRepairModal');
  if (btnClose) btnClose.onclick = closeRepairModal;
}

function closeRepairModal() {
  const modal = el('repairModal');
  modal.style.display = 'none';
}

function renderRepairModalContent() {
  const cont = el('repairModalContent');
  
  // Get damaged items from both inventory and equipped by survivors
  const damagedInventoryItems = state.inventory.filter(i => i.durability < i.maxDurability);
  const damagedEquippedItems = state.survivors.flatMap(s => {
    const items = [];
    if (s.equipment.weapon && s.equipment.weapon.durability < s.equipment.weapon.maxDurability) {
      items.push({ ...s.equipment.weapon, equippedBy: s.name });
    }
    if (s.equipment.armor && s.equipment.armor.durability < s.equipment.armor.maxDurability) {
      items.push({ ...s.equipment.armor, equippedBy: s.name });
    }
    return items;
  });
  const damagedItems = [...damagedInventoryItems, ...damagedEquippedItems];

  if (damagedItems.length === 0) {
    cont.innerHTML = '<div class="small">No damaged items to repair.</div>';
    return;
  }

  // Calculate repair cost multiplier from survivor bonuses
  let repairCostMult = 1.0;
  state.survivors.forEach(s => {
    if (s.classBonuses && s.classBonuses.repair) {
      repairCostMult *= s.classBonuses.repair;
    }
    if (hasAbility(s, 'quickfix')) {
      repairCostMult *= 0.80;
    }
  });
  
  let totalRepairCost = 0;
  const itemsHtml = damagedItems.map(item => {
    const missingDurability = item.maxDurability - item.durability;
    const baseRepairCost = Math.ceil(missingDurability * BALANCE.REPAIR_COST_PER_POINT);
    const actualRepairCost = Math.ceil(baseRepairCost * repairCostMult);
    totalRepairCost += actualRepairCost;
    
    const color = item.rarity ? (RARITY_COLORS[item.rarity] || '#ffffff') : '#ffffff';
    const tooltip = getItemTooltip(item);
    const equippedByInfo = item.equippedBy ? ` <span class="small">(Equipped by ${item.equippedBy})</span>` : '';
    
    return `
      <div class="inv-row repair-row">
        <div class="repair-item-name">
          <span style="color:${color}" title="${tooltip}">${item.name}</span> (${item.durability}/${item.maxDurability})${equippedByInfo}
        </div>
        <div class="repair-item-cost">
          Cost: ${actualRepairCost} scrap
        </div>
        <div class="repair-item-action">
          <button data-id="${item.id}" class="repair-item">Repair</button>
        </div>
      </div>
    `;
  }).join('');

  const totalDiscount = Math.round((1 - repairCostMult) * 100);

  cont.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:12px;">
      <div class="scrollable-panel" style="max-height:300px;overflow-y:auto;">
        ${itemsHtml}
      </div>
      <div style="border-top:1px solid rgba(255,255,255,0.06);padding-top:12px;display:flex;justify-content:space-between;align-items:center;">
        <div>
          <span>Total Cost: ${totalRepairCost} scrap</span>
          ${totalDiscount > 0 ? `<span class="small" style="color:var(--success);margin-left:8px;">(-${totalDiscount}% discount)</span>` : ''}
        </div>
        <button id="btnRepairAllItems">Repair All (${totalRepairCost} scrap)</button>
      </div>
    </div>
  `;

  // Bind events
  cont.querySelectorAll('button.repair-item').forEach(b => {
    b.onclick = () => {
      repairItem(Number(b.dataset.id));
      renderRepairModalContent(); // Re-render to update the list
    };
  });

  const btnRepairAll = document.getElementById('btnRepairAllItems');
  if (btnRepairAll) {
    btnRepairAll.onclick = () => {
      let repairedCount = 0;
      let totalCostPaid = 0;
      
      damagedItems.forEach(item => {
        const missingDurability = item.maxDurability - item.durability;
        const baseCost = Math.ceil(missingDurability * BALANCE.REPAIR_COST_PER_POINT);
        const actualCost = Math.ceil(baseCost * repairCostMult);
        
        if (state.resources.scrap >= actualCost) {
          state.resources.scrap -= actualCost;
          
          // Find the item in its original location (inventory or equipped) and repair it
          const invItem = state.inventory.find(i => i.id === item.id);
          if (invItem) {
            invItem.durability = invItem.maxDurability;
          } else {
            for (const s of state.survivors) {
              if (s.equipment.weapon && s.equipment.weapon.id === item.id) {
                s.equipment.weapon.durability = s.equipment.weapon.maxDurability;
                break;
              }
              if (s.equipment.armor && s.equipment.armor.id === item.id) {
                s.equipment.armor.durability = s.equipment.armor.maxDurability;
                break;
              }
            }
          }
          
          repairedCount++;
          totalCostPaid += actualCost;
        }
      });

      if (repairedCount > 0) {
        appendLog(`Repaired ${repairedCount} items for ${totalCostPaid} scrap.`);
        saveGame('action');
        renderRepairModalContent();
        updateUI();
      } else {
        appendLog('Not enough scrap to repair any items.');
      }
    };
  }
}

// Loadout Modal Logic
let activeLoadoutSurvivorId = null;

function openLoadoutForSurvivor(id) {
  activeLoadoutSurvivorId = id;
  const modal = el('loadoutModal');
  modal.style.display = 'flex';
  renderLoadoutContent();
  const btnClose = el('btnCloseLoadout');
  if (btnClose) btnClose.onclick = closeLoadoutModal;
}

function closeLoadoutModal() {
  const modal = el('loadoutModal');
  modal.style.display = 'none';
  activeLoadoutSurvivorId = null;
}

function renderLoadoutContent() {
  const cont = el('loadoutContent');
  const s = state.survivors.find(x => x.id === activeLoadoutSurvivorId);
  if (!s) { cont.innerHTML = '<div class="small">No survivor selected.</div>'; return; }

  // 0.9.0 - Apply rarity colors to equipped items
  const weaponColor = s.equipment.weapon?.rarity ? (RARITY_COLORS[s.equipment.weapon.rarity] || '#ffffff') : '#ffffff';
  const armorColor = s.equipment.armor?.rarity ? (RARITY_COLORS[s.equipment.armor.rarity] || '#ffffff') : '#ffffff';
  const weaponTooltip = s.equipment.weapon ? getItemTooltip(s.equipment.weapon) : '';
  const armorTooltip = s.equipment.armor ? getItemTooltip(s.equipment.armor) : '';
  const equippedWeapon = s.equipment.weapon ? `<span style="color:${weaponColor}" title="${weaponTooltip}">${s.equipment.weapon.name}</span> ${s.equipment.weapon.durability !== undefined ? `(${s.equipment.weapon.durability}/${s.equipment.weapon.maxDurability})` : ''}` : 'None';
  const equippedArmor = s.equipment.armor ? `<span style="color:${armorColor}" title="${armorTooltip}">${s.equipment.armor.name}</span> ${s.equipment.armor.durability !== undefined ? `(${s.equipment.armor.durability}/${s.equipment.armor.maxDurability})` : ''}` : 'None';

  const weapons = state.inventory.filter(i => i.type === 'weapon');
  const armors = state.inventory.filter(i => i.type === 'armor');

  // 0.9.0 - Apply rarity colors and tooltips to inventory items
  const weaponList = weapons.map(i => {
    const color = i.rarity ? (RARITY_COLORS[i.rarity] || '#ffffff') : '#ffffff';
    const tooltip = getItemTooltip(i);
    return `<div class="inv-row"><span><span style="color:${color}" title="${tooltip}">${i.name}</span> ${i.durability !== undefined ? `(${i.durability}/${i.maxDurability})` : ''}</span><button data-id="${i.id}" class="equip-weapon">Equip</button></div>`;
  }).join('') || '<div class="small">No weapons in inventory.</div>';
  
  const armorList = armors.map(i => {
    const color = i.rarity ? (RARITY_COLORS[i.rarity] || '#ffffff') : '#ffffff';
    const tooltip = getItemTooltip(i);
    return `<div class="inv-row"><span><span style="color:${color}" title="${tooltip}">${i.name}</span> ${i.durability !== undefined ? `(${i.durability}/${i.maxDurability})` : ''}</span><button data-id="${i.id}" class="equip-armor">Equip</button></div>`;
  }).join('') || '<div class="small">No armor in inventory.</div>';

  // 0.9.0 - Calculate effective max HP including armor bonuses
  const effectiveMaxHp = getEffectiveMaxHp(s);

  cont.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:16px">
      <div style="display:flex;gap:16px;flex-wrap:wrap">
        <div style="flex:1;min-width:260px">
          <div><strong>${s.name}</strong> <span class="small">Lvl ${s.level} • HP ${s.hp}/${effectiveMaxHp}</span></div>
          <div class="small" style="margin-top:4px;color:var(--muted)">Ammo: ${state.resources.ammo}</div>
        </div>
      </div>
      <div style="display:flex;gap:16px;flex-wrap:wrap">
        <div style="flex:1;min-width:260px">
          <div style="margin-top:8px" class="card-like">
            <div><strong>Weapon</strong></div>
            <div class="small">${equippedWeapon}</div>
            <div style="margin-top:6px">
              ${s.equipment.weapon ? `<button id="btnUnequipWeapon">Unequip</button>` : '<span class="small" style="color:var(--muted)">Empty slot</span>'}
            </div>
          </div>
        </div>
        <div style="flex:1;min-width:260px">
          <div style="margin-top:8px" class="card-like">
            <div><strong>Armor</strong></div>
            <div class="small">${equippedArmor}</div>
            <div style="margin-top:6px">
              ${s.equipment.armor ? `<button id="btnUnequipArmor">Unequip</button>` : '<span class="small" style="color:var(--muted)">Empty slot</span>'}
            </div>
          </div>
        </div>
      </div>
      <div style="border-top:1px solid rgba(255,255,255,0.06);padding-top:12px">
        <div style="display:flex;gap:16px;flex-wrap:wrap">
          <div style="flex:1;min-width:260px">
            <div><strong>Inventory — Weapons</strong></div>
            <div style="margin-top:6px">${weaponList}</div>
          </div>
          <div style="flex:1;min-width:260px">
            <div><strong>Inventory — Armor</strong></div>
            <div style="margin-top:6px">${armorList}</div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Bind events
  const btnUW = document.getElementById('btnUnequipWeapon');
  if (btnUW) btnUW.onclick = () => { unequipFromSurvivor(s.id, 'weapon'); renderLoadoutContent(); };
  const btnUA = document.getElementById('btnUnequipArmor');
  if (btnUA) btnUA.onclick = () => { unequipFromSurvivor(s.id, 'armor'); renderLoadoutContent(); };
  cont.querySelectorAll('button.equip-weapon').forEach(b => {
    b.onclick = () => { equipItemToSurvivor(s.id, Number(b.dataset.id)); renderLoadoutContent(); };
  });
  cont.querySelectorAll('button.equip-armor').forEach(b => {
    b.onclick = () => { equipItemToSurvivor(s.id, Number(b.dataset.id)); renderLoadoutContent(); };
  });
}

function renderMap() {
  const grid = el('mapGrid');
  const { w, h } = state.mapSize;
  // Early-out if nothing relevant changed to prevent hover/focus flicker
  const snapshot = computeMapSnapshot();
  if (lastRenderedMapSnapshot === snapshot) {
    return; // skip re-render
  }
  lastRenderedMapSnapshot = snapshot;

  grid.style.gridTemplateColumns = `repeat(${w},1fr)`;
  grid.innerHTML = '';
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      const t = state.tiles[idx];
      const tile = document.createElement('div');
      tile.className = 'tile';

      // Add explored and base classes
      if (t.scouted || state.explored.has(idx)) tile.classList.add('explored');
      if (t.type === 'base') tile.classList.add('base');

      // Check if tile is explorable (adjacent to explored OR can be revisited)
      const tileObj = { x, y, idx };
      const canExplore = isExplorable(tileObj);
      
      if (canExplore) {
        tile.classList.add('explorable');
        // Add click handler for explorable tiles
        tile.onclick = () => exploreTile(idx);
        
        // 0.8.10 - Calculate energy cost with Scout class bonus + abilities
        const baseCost = getTileEnergyCost(t);
        const explorer = state.survivors.find(s => s.id === state.selectedExplorerId);
        let actualCost = baseCost;
        
        // Apply Scout class exploration bonus
        if (explorer && explorer.classBonuses && explorer.classBonuses.exploration) {
          actualCost = Math.floor(actualCost * explorer.classBonuses.exploration);
        }
        
        // Apply Pathfinder ability (stacks with class bonus)
        if (explorer && hasAbility(explorer, 'pathfinder')) {
          actualCost = Math.floor(actualCost * 0.85); // -15% cost for Pathfinder
        }
        
        // Show energy cost in tooltip
        if (state.explored.has(idx) && t.cleared === false) {
          tile.classList.add('revisitable');
          if (t.type === 'hazard') {
            tile.title = `Hazard room (needs Hazmat Suit) - Energy: ${actualCost}`;
          } else if (t.type === 'alien') {
            tile.title = `Aliens remain - Energy: ${actualCost}`;
          } else {
            tile.title = `Click to re-explore (Energy: ${actualCost})`;
          }
        } else {
          tile.title = `Click to explore (Energy: ${actualCost})`;
        }
      } else if (state.explored.has(idx)) {
        tile.title = `${t.type} (Explored)`;
      } else {
        tile.title = 'Too far to explore';
      }

      const content = document.createElement('span');
      content.textContent = t.scouted ? (t.type === 'base' ? 'B' : (t.type[0] || '?').toUpperCase()) : '.';
      tile.appendChild(content);
      grid.appendChild(tile);
    }
  }
}

function renderInventory() {
  const inv = el('inventory');
  
  // Update capacity display
  const capacityEl = el('inventoryCapacity');
  const maxCapacity = getInventoryCapacity();
  const currentCount = state.inventory.length;
  capacityEl.textContent = `(${currentCount}/${maxCapacity})`;
  if (currentCount >= maxCapacity) {
    capacityEl.style.color = 'var(--danger)';
  } else if (currentCount >= maxCapacity * 0.8) {
    capacityEl.style.color = 'var(--warning)';
  } else {
    capacityEl.style.color = 'var(--muted)';
  }
  
  // Early-out to prevent hover/focus flicker: only re-render when inventory actually changes
  const snapshot = (() => {
    try {
      return JSON.stringify(state.inventory.map(i => ({ id: i.id, t: i.type, n: i.name, d: i.durability, m: i.maxDurability })));
    } catch (e) {
      return String(Math.random());
    }
  })();

  if (lastRenderedInventorySnapshot === snapshot) {
    return; // no changes; keep DOM as-is to preserve hover state
  }
  lastRenderedInventorySnapshot = snapshot;

  inv.innerHTML = '';
  if (state.inventory.length === 0) {
    inv.textContent = 'No crafted items.';
    return;
  }
  state.inventory.forEach(item => {
    const node = document.createElement('div');
    node.className = 'inv-item';
    
    // 0.9.0 - Only junk cannot be recycled (use Salvage button for junk)
    const isRecyclable = item.type !== 'junk';
    if (isRecyclable) {
      node.onclick = (e) => recycleItem(item.id, e);
      node.style.cursor = 'pointer';
    }
    
    let durabilityInfo = '';
    if (item.durability !== undefined) {
      durabilityInfo = ` (${item.durability}/${item.maxDurability})`;
    }
    // Capitalize first letter of item name
    const displayName = item.name || item.type;
    const capitalizedName = displayName.charAt(0).toUpperCase() + displayName.slice(1);
    
    // 0.9.0 - Apply rarity color to item name
    const rarityColor = item.rarity ? (RARITY_COLORS[item.rarity] || '#ffffff') : '#ffffff';
    node.innerHTML = `<span style="color:${rarityColor}">${capitalizedName}</span>${durabilityInfo}`;
    
    // 0.9.0 - Add tooltip (no help cursor icon)
    node.title = getItemTooltip(item);
    
    // 0.9.0 - Repair Kit info message (automatically used when repairing systems)
    if (item.type === 'consumable' && item.subtype === 'repair_kit') {
      const infoText = document.createElement('div');
      infoText.style.cssText = 'font-size:11px;color:var(--success);margin-top:4px;';
      infoText.textContent = '✓ Auto-used on system repairs';
      node.appendChild(infoText);
    }
    inv.appendChild(node);
  });
}

function threatText() {
  // Show threat as a percentage (0-100%) instead of buckets
  const v = Math.max(0, Math.min(100, Number(state.threat) || 0));
  return `${Math.round(v)}%`;
}

function renderExpeditionSurvivorSelect() {
  const cont = el('expeditionSurvivorDropdown');
  const availableSurvivors = state.survivors.filter(s => !s.onMission);
  const availableSurvivorsSnapshot = JSON.stringify(availableSurvivors);

  if (lastRenderedAvailableSurvivors === availableSurvivorsSnapshot) {
    return;
  }
  lastRenderedAvailableSurvivors = availableSurvivorsSnapshot;

  cont.innerHTML = '';

  if (availableSurvivors.length === 0) {
    cont.textContent = 'No survivors available';
    return;
  }

  // Use state.selectedExpeditionSurvivorId for persistence
  if (!state.selectedExpeditionSurvivorId || !availableSurvivors.some(s => s.id === state.selectedExpeditionSurvivorId)) {
    state.selectedExpeditionSurvivorId = availableSurvivors[0].id;
  }

  // Create selector with arrow buttons
  const selector = document.createElement('div');
  selector.className = 'task-selector';
  
  const upArrow = document.createElement('button');
  upArrow.className = 'task-arrow task-arrow-up';
  upArrow.type = 'button';
  upArrow.textContent = '▲';
  upArrow.title = 'Previous survivor';
  
  const display = document.createElement('div');
  display.className = 'task-display';
  const selectedSurvivor = availableSurvivors.find(s => s.id === state.selectedExpeditionSurvivorId);
  display.textContent = selectedSurvivor ? selectedSurvivor.name : 'Select Survivor';
  display.title = 'Selected for expedition';
  
  const downArrow = document.createElement('button');
  downArrow.className = 'task-arrow task-arrow-down';
  downArrow.type = 'button';
  downArrow.textContent = '▼';
  downArrow.title = 'Next survivor';
  
  // Up arrow click handler (previous survivor)
  upArrow.addEventListener('click', (e) => {
    e.stopPropagation();
    const currentIdx = availableSurvivors.findIndex(s => s.id === state.selectedExpeditionSurvivorId);
    let newIdx = currentIdx - 1;
    if (newIdx < 0) newIdx = availableSurvivors.length - 1; // Wrap to end
    
    state.selectedExpeditionSurvivorId = availableSurvivors[newIdx].id;
    display.textContent = availableSurvivors[newIdx].name;
    appendLog(`${availableSurvivors[newIdx].name} selected for expedition.`);
  });
  
  // Down arrow click handler (next survivor)
  downArrow.addEventListener('click', (e) => {
    e.stopPropagation();
    const currentIdx = availableSurvivors.findIndex(s => s.id === state.selectedExpeditionSurvivorId);
    let newIdx = currentIdx + 1;
    if (newIdx >= availableSurvivors.length) newIdx = 0; // Wrap to start
    
    state.selectedExpeditionSurvivorId = availableSurvivors[newIdx].id;
    display.textContent = availableSurvivors[newIdx].name;
    appendLog(`${availableSurvivors[newIdx].name} selected for expedition.`);
  });
  
  selector.appendChild(upArrow);
  selector.appendChild(display);
  selector.appendChild(downArrow);
  cont.appendChild(selector);
}

// 0.8.1 - Render workbench with dynamic crafting costs
function renderWorkbench() {
  // 0.9.0 - Reorganized workbench with categories and expanded recipes
  let costReduction = 0;
  const technicians = state.survivors.filter(s => !s.onMission);
  
  // Apply all Technician class bonuses additively
  const techsWithBonus = technicians.filter(t => t.class === 'technician' && t.classBonuses && t.classBonuses.crafting);
  for (const tech of techsWithBonus) {
    costReduction += (1 - tech.classBonuses.crafting);
  }
  
  // Apply Technician abilities (additive stacking)
  for (const t of technicians) {
    if (hasAbility(t, 'resourceful')) costReduction += 0.10;
    if (hasAbility(t, 'prodigy')) costReduction += 0.25;
  }
  
  const costMult = Math.max(0.1, 1 - costReduction);

  // Count components in inventory
  const componentCounts = {};
  const componentTypes = ['weaponPart', 'electronics', 'armor_plating', 'power_core', 'nano_material', 'advanced_component', 'quantum_core', 'alien_artifact'];
  for (const compType of componentTypes) {
    componentCounts[compType] = state.inventory.filter(i => i.type === 'component' && i.subtype === compType).length;
  }

  const key = `v2:${costMult.toFixed(3)}:${JSON.stringify(componentCounts)}:${state.resources.tech}`;
  if (lastRenderedWorkbenchKey === key) return;
  lastRenderedWorkbenchKey = key;

  const workbench = el('workbench');
  if (!workbench) return;

  // 0.9.0 - Categorized recipes with rarity indicators
  const categories = [
    { 
      name: '⚗️ Consumables', 
      recipes: [
        { item: 'ammo', name: 'Ammo', rarity: 'common' },
        { item: 'medkit', name: 'Medkit', rarity: 'uncommon' },
        { item: 'advanced_medkit', name: 'Advanced Medkit', rarity: 'uncommon' },
        { item: 'sonic_repulsor', name: 'Sonic Repulsor', rarity: 'uncommon' },
        { item: 'stun_grenade', name: 'Stun Grenade', rarity: 'rare' }
      ]
    },
    { 
      name: '🔪 Melee Weapons', 
      recipes: [
        { item: 'makeshift_pipe', name: 'Makeshift Pipe', rarity: 'common' },
        { item: 'sharpened_tool', name: 'Sharpened Tool', rarity: 'common' },
        { item: 'crowbar', name: 'Crowbar', rarity: 'common' },
        { item: 'combat_knife', name: 'Combat Knife', rarity: 'uncommon' },
        { item: 'stun_baton', name: 'Stun Baton', rarity: 'uncommon' },
        { item: 'reinforced_bat', name: 'Reinforced Bat', rarity: 'uncommon' },
        { item: 'plasma_blade', name: 'Plasma Blade', rarity: 'rare' },
        { item: 'shock_maul', name: 'Shock Maul', rarity: 'rare' },
        { item: 'nano_edge_katana', name: 'Nano-Edge Katana', rarity: 'veryrare' }
      ]
    },
    { 
      name: '🔫 Pistols', 
      recipes: [
        { item: 'scrap_pistol', name: 'Scrap Pistol', rarity: 'common' },
        { item: 'old_revolver', name: 'Old Revolver', rarity: 'common' },
        { item: 'laser_pistol', name: 'Laser Pistol', rarity: 'uncommon' },
        { item: 'heavy_pistol', name: 'Heavy Pistol', rarity: 'uncommon' },
        { item: 'plasma_pistol', name: 'Plasma Pistol', rarity: 'rare' },
        { item: 'smart_pistol', name: 'Smart Pistol', rarity: 'rare' },
        { item: 'void_pistol', name: 'Void Pistol', rarity: 'veryrare' }
      ]
    },
    { 
      name: '🎯 Rifles', 
      recipes: [
        { item: 'assault_rifle', name: 'Assault Rifle', rarity: 'uncommon' },
        { item: 'scoped_rifle', name: 'Scoped Rifle', rarity: 'uncommon' },
        { item: 'pulse_rifle', name: 'Pulse Rifle', rarity: 'rare' },
        { item: 'plasma_rifle', name: 'Plasma Rifle', rarity: 'rare' },
        { item: 'gauss_rifle', name: 'Gauss Rifle', rarity: 'veryrare' },
        { item: 'quantum_rifle', name: 'Quantum Rifle', rarity: 'veryrare' }
      ]
    },
    { 
      name: '💥 Shotguns', 
      recipes: [
        { item: 'pump_shotgun', name: 'Pump Shotgun', rarity: 'uncommon' },
        { item: 'combat_shotgun', name: 'Combat Shotgun', rarity: 'rare' },
        { item: 'plasma_shotgun', name: 'Plasma Shotgun', rarity: 'rare' },
        { item: 'disintegrator_cannon', name: 'Disintegrator Cannon', rarity: 'veryrare' }
      ]
    },
    { 
      name: '🔥 Heavy Weapons', 
      recipes: [
        { item: 'light_machine_gun', name: 'Light Machine Gun', rarity: 'rare' },
        { item: 'grenade_launcher', name: 'Grenade Launcher', rarity: 'rare' },
        { item: 'minigun', name: 'Minigun', rarity: 'veryrare' },
        { item: 'railgun', name: 'Railgun', rarity: 'veryrare' }
      ]
    },
    { 
      name: '🛡️ Light Armor', 
      recipes: [
        { item: 'scrap_vest', name: 'Scrap Vest', rarity: 'common' },
        { item: 'padded_suit', name: 'Padded Suit', rarity: 'common' },
        { item: 'light_armor', name: 'Light Armor', rarity: 'uncommon' },
        { item: 'tactical_vest', name: 'Tactical Vest', rarity: 'uncommon' },
        { item: 'reinforced_plating', name: 'Reinforced Plating', rarity: 'uncommon' },
        { item: 'composite_armor', name: 'Composite Armor', rarity: 'rare' },
        { item: 'stealth_suit', name: 'Stealth Suit', rarity: 'rare' },
        { item: 'nano_weave_armor', name: 'Nano-Weave Armor', rarity: 'veryrare' }
      ]
    },
    { 
      name: '🛡️ Heavy Armor', 
      recipes: [
        { item: 'heavy_armor', name: 'Heavy Armor', rarity: 'rare' },
        { item: 'power_armor_frame', name: 'Power Armor Frame', rarity: 'rare' },
        { item: 'hazmat_suit', name: 'Hazmat Suit', rarity: 'rare' },
        { item: 'thermal_suit', name: 'Thermal Suit', rarity: 'rare' },
        { item: 'titan_armor', name: 'Titan Armor', rarity: 'veryrare' },
        { item: 'shield_suit', name: 'Shield Suit', rarity: 'veryrare' },
        { item: 'void_suit', name: 'Void Suit', rarity: 'veryrare' },
        { item: 'regenerative_armor', name: 'Regenerative Armor', rarity: 'veryrare' }
      ]
    }
  ];

  workbench.innerHTML = '';
  
  categories.forEach(category => {
    // Category header
    const header = document.createElement('div');
    header.style.cssText = 'margin-top:12px;margin-bottom:4px;font-weight:bold;font-size:12px;color:var(--accent)';
    header.textContent = category.name;
    workbench.appendChild(header);
    
    // Recipe buttons
    category.recipes.forEach(r => {
      const recipe = RECIPES[r.item];
      if (!recipe) return; // Skip if recipe doesn't exist
      
      const button = document.createElement('button');
      button.dataset.recipe = r.item;
      button.style.cssText = 'font-size:12px;padding:6px 10px';

      // Calculate actual costs with multiplier (resources only, not components)
      const scrapCost = Math.ceil((recipe.scrap || 0) * costMult);
      const energyCost = Math.ceil((recipe.energy || 0) * costMult);
      const techCost = Math.ceil((recipe.tech || 0) * costMult);

      // Build cost string with component counts
      let costParts = [];
      if (recipe.scrap > 0) {
        const hasDiscount = scrapCost < recipe.scrap;
        if (hasDiscount) {
          costParts.push(`Scrap <span style="text-decoration:line-through;color:var(--muted)">${recipe.scrap}</span> ${scrapCost}`);
        } else {
          costParts.push(`Scrap ${scrapCost}`);
        }
      }
      if (recipe.tech > 0) {
        const hasDiscount = techCost < recipe.tech;
        const techStr = `Tech ${state.resources.tech}/${techCost}`;
        if (hasDiscount) {
          costParts.push(`<span style="text-decoration:line-through;color:var(--muted)">${recipe.tech}</span> ${techStr}`);
        } else {
          costParts.push(techStr);
        }
      }
      
      // Add component requirements
      for (const compType of componentTypes) {
        if (recipe[compType] > 0) {
          const available = componentCounts[compType] || 0;
          const needed = recipe[compType];
          const displayName = compType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()).replace(/([a-z])(Part)/, '$1 $2');
          costParts.push(`${displayName} ${available}/${needed}`);
        }
      }

      const costStr = costParts.length > 0 ? ` (${costParts.join(', ')})` : '';
      
      // Apply rarity color to item name
      const rarityColor = RARITY_COLORS[r.rarity] || '#ffffff';
      button.innerHTML = `<span style="color:${rarityColor}">${r.name}</span>${costStr}`;

      // 0.9.0 - Add tooltip showing item stats (no help cursor icon)
      button.title = getItemTooltip(r.item);

      button.onclick = () => {
        craft(r.item);
        saveGame('action');
        updateUI();
      };

      workbench.appendChild(button);
    });
  });
}
