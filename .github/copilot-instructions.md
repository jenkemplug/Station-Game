# Derelict Station - AI Agent Instructions

## Project Overview
This is a browser-based survival/management game where players manage a space station, survivors, and resources while facing alien threats. The project uses vanilla JavaScript, HTML, and CSS with no external dependencies.

**Current Version:** 0.9.0 (Complete + Aggressive Rebalance)

## Game Design Philosophy

### **Core Pillars**
1. **Tactical Combat Over Stats**: Combat should last 5-8 rounds with meaningful decisions each turn. Equipment choices, consumable timing, and ability usage matter more than raw numbers.
2. **Inevitable Pressure**: Threat is an unstoppable tide. Defenses slow it down but can't reverse it. Players are always on a timer.
3. **Resource Tension**: Early game has tight energy (forces generator rush). Late game scales consumption with survivor count, creating management pressure.
4. **High Difficulty**: This is a survival game. Players should lose survivors, fail expeditions, and face hard choices. Death is part of the experience.
5. **Exploration Risk/Reward**: Hazards offer 3x loot but cost durability. Aliens guard valuable tech. Retreating is a valid tactical choice.

### **Balance Goals**
- **Combat Duration**: 5-8 rounds on average (not 2-4 instant kills)
- **Threat Growth**: Always climbing at minimum +0.5%/minute even with max defenses
- **Raid Frequency**: 1-7% per minute based on threat/exploration (10-15 min cooldowns)
- **Raid Size**: 2-6 aliens scaling with threat (not 2-7 exponential spam)
- **Resource Scaling**: Early game: tight energy. Mid game: balanced. Late game: consumption scales with population/systems
- **Equipment Progression**: Common (2-6 dmg) → Uncommon (4-13 dmg) → Rare (8-20 dmg) → Legendary (12-25 dmg)
- **Armor Scaling**: Common (2 def) → Uncommon (3 def) → Rare (4-6 def) → Legendary (4-7 def)
- **Alien Scaling**: HP/damage scale 1.0x → 1.5x and 1.0x → 1.4x with threat (not exponential)

### **Intended Player Experience**
1. **Early Game (0-20% threat)**: Scramble for energy, learn systems, first alien encounters feel dangerous
2. **Mid Game (20-60% threat)**: Stable resource loops, tactical combat with rare gear, threat slowly climbing despite defenses
3. **Late Game (60-100% threat)**: Multiple systems to manage, frequent raids with elite aliens, constant pressure to upgrade and optimize
4. **Endgame Challenge**: Can you reach 100% threat and survive the Queen raids? Or will the station fall?

## v0.9.0 — All Goals Completed + Aggressive Rebalance

This section captures the completed work for v0.9.0. All major features and fixes are implemented, tested, and verified.

**Summary (high level)**
- **Goal**: Ship an updated combat UX and systems polish for v0.9.0.
- **Status**: ✅ **100% COMPLETE**. All 10 major subtasks are finished, including adaptive combat UI, full effect coverage, consumable integration, debug updates, and a final balance pass.

**Completed work (specific)**
- ✅ **Step 1: Crafting Materials**: Added 8 new component types (Weapon Part, Armor Plating, Electronics, etc.) to the loot table and crafting recipes.
- ✅ **Step 2: Component Consumption & Inventor**: Crafting recipes now consume components. The Engineer's "Inventor" ability correctly processes these components for bonus tech.
- ✅ **Step 3: Workbench UI**: Expanded the workbench to show all 47+ craftable items, grouped into 8 categories with rarity colors and detailed tooltips.
- ✅ **Step 4: Rarity Colors**: Implemented rarity colors (Common, Uncommon, Rare, Legendary) across all UI elements, including inventory, crafting, loot logs, and combat.
- ✅ **Step 5: All Weapon & Armor Effects**: All 8 weapon effects (stun, burn, splash, phase, etc.) and 8 armor effects (dodge, reflect, regen, etc.) are now fully implemented and functional in combat.
- ✅ **Step 6: Adaptive Combat UI**: The combat UI now dynamically adapts to the equipped weapon type (melee, ranged, unarmed), showing relevant actions like Strike, Shoot, Aim, and Burst.
- ✅ **Step 7: Equipment System Compatibility**: Ensured the new item structure (with `damage` arrays and `defense` properties) is backward-compatible with the old type-based system.
- ✅ **Step 8: 10 Consumables in Combat**: All 10 new consumables are craftable, usable in combat, and apply their unique effects correctly. The medkit button is also fixed.
- ✅ **Step 9: Debug Menu Expansion**: The debug menu (`Ctrl+D`) has been expanded to spawn all new items, components, and consumables for easy testing.
- ✅ **Step 10: Comprehensive Balance Pass**:
    - Rebalanced the entire loot table to match target rarity distributions.
    - **MAJOR FIX: Removed Skill System** - Skill was causing exponential damage scaling (+23 at level 12). Damage now based purely on weapon × (level/class bonuses).
    - Shifted leveling bonuses to percentage-based (0% at L1, +2% per level).
    - Overhauled enemy scaling with threat level for a smoother difficulty curve.
    - Tuned resource costs, threat growth, and expedition penalties.
- ✅ **UI/UX Polish**:
    - Made long panels like the Workbench and Survivor List scrollable.
    - Fixed dropdowns being clipped in scrollable containers with a dynamic repositioning script.
    - Prevented scroll-chaining from scrollable panels to the main page.
    - Optimized UI rendering to prevent unnecessary panel refreshes.
    - Removed skill display from survivor cards.
    - Updated damage tooltips: Base Weapon → Bonuses → Final Damage.
- ✅ **Bug Fixes**:
    - **Alien Modifiers**: Fixed 7 HP modifiers using wrong calculations. All now apply correctly at spawn.
    - **Duplicate Names**: Fixed survivors spawning with duplicate names (e.g., two "Lucas").

**Files touched (non-exhaustive)**
- `js/game/combatInteractive.js` — Major overhaul for adaptive UI, consumables, all weapon/armor effects, damage tooltips.
- `js/game/combat.js` — Updated damage calculations to remove skill, apply modifiers correctly.
- `js/game/survivor.js` — Removed skill from creation and level-up.
- `js/constants.js` — Major balance pass, new item definitions, loot table adjustments, recipe updates, alien modifier fixes.
- `js/ui.js` — Rarity color integration, workbench rendering, UI optimizations, removed skill display.
- `js/names.js` — Added duplicate name prevention in getRandomName().
- `js/debug.js` — Added spawning for all new items.
- `js/game/threat.js` — Retuned enemy scaling, fixed modifier application.
- `js/game/crafting.js` — Repair Kit auto-use system, removed old manual repair kit functions.
- `js/game/recycling.js` — New file for inventory recycling system.
- `styles.css` — Added styles for scrollable panels, custom scrollbars, dropdown positioning, and recycle popup.
- `js/dropdownPosition.js` — New file to handle smart dropdown positioning.
- `index.html` — Added new script references.
- `CHANGELOG.md` — Documented all changes for v0.9.0.

## Architecture

### Core Components
1. **State Management** (`js/state.js`)
   - Central `state` object manages all game data
   - Uses localStorage for persistence with unique user IDs (key: `derelict_station_expanded_v0.7.4_${USER_ID}`)
   - State includes: resources, survivors, map, inventory, systems, threat levels, missions, alienKills, raidChance, raidCooldownMs, gameOver
   - Multi-user support: Each player on the same domain gets a unique save file
   - UI state tracking: `activeDropdown`, `selectedExplorerId`, `selectedExpeditionSurvivorId`, `activeTaskDropdownScroll`

2. **UI Structure** (`index.html`, `styles.css`)
   - Two-column layout with main content and side panels
   - Panels use CSS Grid for layout (`grid-template-columns: 1fr 480px`)
   - All UI elements use the `panel` class with consistent styling
   - Custom dropdown components with state preservation

3. **Game Loop** (`js/game/tick.js`, `js/main.js`)
   - Runs every 1000ms (`TICK_MS = 1000`)
   - Handles resource production, consumption, and event triggers
   - Updates UI after state changes
   - Supports offline progress calculation

### File Structure
```
js/
├── constants.js    # Game balance, recipes, loot tables, alien types (8 types)
├── state.js        # Global state object and UI state variables
├── utils.js        # Helper functions (rand, clamp, el, formatTime)
├── names.js        # Survivor name pool (300+ names)
├── map.js          # Map utilities, exploration, tile management
├── ui.js           # All rendering functions (updateUI, renderSurvivors, etc.)
├── game/           # Modular game systems
│   ├── save.js           # Save/load, tiles init
│   ├── survivor.js       # Survivors: recruit, tasks, equip, XP
│   ├── combat.js         # Auto-resolve combat system with alien specials
│   ├── combatInteractive.js # Interactive turn-based combat
│   ├── exploration.js    # Exploration and tile events
│   ├── crafting.js       # Crafting and upgrades
│   ├── expedition.js     # Expeditions
│   ├── threat.js         # Threat and raids with dynamic composition
│   └── tick.js           # Game tick orchestrator
├── debug.js        # Debug panel functions (Ctrl+D to toggle)
└── main.js         # Entry point, event bindings, game loop
```

### Key Patterns

1. **Element Access** (`js/utils.js`)
   ```javascript
   // Use el() helper instead of getElementById
   const el = id => document.getElementById(id);
   el('survivorList').innerHTML = '';
   ```

2. **State Updates**
   ```javascript
   // Always call updateUI() after state changes
   state.resources.scrap += 10;
   updateUI();
   saveGame('action'); // Optional: trigger save
   ```

3. **Save/Load System** (`js/game/save.js`)
   - Game state saved every 15s automatically (silent autosave every 10 ticks)
   - Manual save available via UI (shows log message)
   - Action saves are silent (called after user actions)
   - Handles offline progress calculation via `handleOffline()`
   - Save key includes version and unique user ID
   - Current snapshot version: 1.10.0

4. **XP and Leveling** (`js/game/survivor.js`)
   ```javascript
   grantXp(survivor, amount); // Handles XP gain and level ups
   // Level ups: +1-2 skill, +5 maxHP, full heal, 1.5x nextXp
   ```

5. **Combat System** (`js/game/combat.js`, `js/game/combatInteractive.js`)
   ```javascript
   resolveSkirmish(aliens, context, idx);
   // context: 'field' (exploration) or 'base' (raids)
   // Interactive combat: turn-based with actions (Shoot, Aim, Burst, Guard, Medkit, Retreat)
   // Auto-resolve fallback available
   // Turrets participate in base defense (0.7.3)
   // Alien special abilities apply in both modes (0.7.4)
   // Weapons add damage, armor reduces incoming damage
   // Ammo consumed during combat (55% chance per shot)
   ```

## Game Systems

### 1. Exploration System (`js/map.js`, `js/game/exploration.js`)
- **Click-to-explore**: Players click adjacent tiles on the map
- **Explorer Selection**: Dropdown menu selects which survivor explores
- **Energy Costs**: Vary by tile type (8-25 energy)
  - Empty: 8, Survivor: 10, Resource: 12, Module: 15, Alien: 18, Hazard: 25
- **Solo Combat**: Selected explorer fights aliens encountered during exploration
- **XP Rewards**: Explorer gains XP for discovering tiles and finding loot
- **Retreat System**: Can escape from field encounters (chance-based on stats/alien type)
- **Revisitable Content**: Uncleared hazards/aliens can be returned to after retreat

### 2. Survivor System (`js/game/survivor.js`)
- **Attributes**: level, xp, hp, maxHp, morale, task, equipment, class, abilities, downed, classBonuses
- **NO SKILL**: Skill system removed in 0.9.0 - was redundant with level and caused exponential scaling
- **Classes**: 8 types (Soldier, Medic, Engineer, Scout, Technician, Scientist, Guardian, Scavenger)
- **Class Bonuses**: Randomized bonus ranges rolled when recruiting (0.8.10)
  - Soldier: +10-20% combat, +4-8 HP, +2-4 defense
  - Medic: +25-35% healing, +5-15% survival
  - Engineer: +15-30% production, 15-25% repair cost reduction
  - Scout: 10-20% exploration energy reduction, +15-25% dodge, +20-30% retreat
  - Technician: 10-20% crafting cost reduction, +15-25% durability, +10-20% tech gains
  - Scientist: +15-30% XP gain, +15-25% analysis
  - Guardian: +3-6 defense, +5-10% morale
  - Scavenger: +15-25% loot quality, +20-30% scrap
  - Stored in `survivor.classBonuses` object
  - Applied throughout combat, production, crafting, exploration systems
- **Abilities**: 40+ special abilities with rarity tiers (uncommon, rare, very rare)
- **Equipment Slots**: weapon (rifle/shotgun), armor (light/heavy/hazmat)
- **Tasks**: Idle, Oxygen, Food, Energy, Scrap, Guard
- **Level Bonuses**: +2% combat damage per level (0% at L1, +22% at L12), +6% production per level
- **Recruitment**: Cost scales with survivor count, discounted by exploration progress
- **Randomized Names**: Starter survivors have random names from 300+ name pool (unique per save)
- **Downed State**: Survivors at 0 HP become downed instead of dying immediately
- **Release Protection**: Cannot release last survivor (button disabled, backend validation) (0.8.10)

### 3. Combat System (`js/game/combat.js`, `js/game/combatInteractive.js`)
- **Damage Formula (0.9.0)**: Weapon Damage × (1 + LevelBonus + ClassBonus)
  - NO base damage from skill - pure weapon scaling with percentage modifiers
  - Level bonus: (level - 1) × 0.02 = 0% at L1, +2% per level
  - Class combat bonus: +10-20% for Soldier, varies by class
  - Example: Light Machine Gun (13-17) × (1 + 0.22 + 0.15) = 18-23 damage at L12 Soldier
- **Interactive Combat**: Turn-based overlay with tactical actions
  - Actions: Shoot, Aim (+25% hit), Burst (2 shots + bonus dmg), Guard (+3 def), Medkit, Retreat, Revive
  - Auto-resolve option available for quick battles
  - Combat log tracks all actions and alien specials
  - Damage tooltips show: Base Weapon → Bonuses → Final Damage
- **Revival System**: 
  - Field Medics can revive downed allies (25-50% HP)
  - Revive button in interactive combat
  - Auto-revival in combat.js after combat rounds
- **Advanced Abilities**:
  - Living Shield: Guardian intercepts damage (50% chance)
  - Blink Strike: Spectre counter-attack after phase
  - Wraith: +50% damage after phasing
  - Ethereal/Void: Enhanced phase mechanics
  - Hivemind: Queen resurrects drones at 50% HP
- **Field Combat**: Selected explorer vs aliens during exploration
- **Base Defense**: ONLY GUARDS defend raids (0.7.1 hardcore mode)
  - Turrets assist guards with automated support (0.7.3)
  - Raid defeat = instant game over
- **Equipment Structure**: All equipment stored as objects with `type`, `name`, `durability` properties
  - Example: `{ id: 1, type: 'rifle', name: 'Pulse Rifle', durability: 100, maxDurability: 100 }`
- **Weapon Bonuses**: 
  - Pulse Rifle (type: 'rifle'): +8 damage
  - Shotgun (type: 'shotgun'): +6-12 variable damage
  - Check with: `survivor.equipment.weapon?.type === 'rifle'`
- **Armor Defense**: 
  - Light Armor (type: 'armor'): -3 damage
  - Heavy Armor (type: 'heavyArmor'): -6 damage
  - Hazmat Suit (type: 'hazmatSuit'): -3 damage
  - Check with: `survivor.equipment.armor?.type === 'armor'`
- **Ammo System**: Consumed during combat (55% chance per attack), halved damage when depleted
- **XP Rewards**: 12-25 XP per combat, survivors gain levels
- **Hit Chance**: 75% base, 12% crit chance (1.6x damage multiplier)
- **Per-Combat Flags**: _shieldUsed, _justPhased, _lifesaverUsed, _hivemindUsed track one-time abilities

### 4. Alien Types (`js/constants.js`) - 8 unique types with 40+ modifiers
- **Drone** (HP 6-10, Atk 2-5): 25% dodge chance
- **Lurker** (HP 8-14, Atk 3-6): +50% damage on first strike (ambush)
- **Stalker** (HP 14-22, Atk 5-9): +2 damage per ally (pack tactics)
- **Spitter** (HP 10-16, Atk 4-8): Ignores 50% armor (armor piercing)
- **Brood** (HP 28-40, Atk 8-14): Regenerates 2-4 HP per turn
- **Ravager** (HP 20-30, Atk 10-16): Takes 50% less damage (armored)
- **Spectre** (HP 12-18, Atk 6-11): 40% base phase with advanced modifiers:
  - Ethereal: +10% phase chance
  - Void: 60% phase, -2 HP drain per phase
  - Wraith: +50% damage after phasing
  - Blink Strike: Counter-attack after phase
- **Hive Queen** (HP 35-50, Atk 12-20): Attacks twice per turn (multi-strike)
  - Hivemind: Resurrects first dead drone at 50% HP once per combat

### 5. Hazard Rooms (`js/game/exploration.js`)
- **Requirement**: Hazmat Suit equipped to clear
- **Durability Loss**: 15-25 durability per hazard cleared
- **Rewards**: 3x loot rolls, 3x normal XP (24 XP base)
- **High-value targets**: Best risk/reward ratio in the game

### 5. Expedition System (`js/game.js`)
- **Costs**: 10 Food, 15 Energy to launch
- **Duration**: 30-45 seconds (configurable)
- **Success Rate**: 65% base chance
- **Rewards**: 10-30 scrap, 1-4 tech, XP (25 success / 10 failure)
- **Equipment Wear**: Weapons/armor lose durability during expeditions
- **Mission Tracking**: Active missions tracked in `state.missions` array

### 6. Crafting System (`js/game/crafting.js`, `js/constants.js`)
- **Recipes**: Defined in `RECIPES` object in `constants.js`
- **Resources**: scrap, energy, tech used for crafting
- **Craftable Items**:
  - Consumables: Medkit (15 scrap), Ammo (10 scrap)
  - Systems: Filter (30s/20e), Generator (25s), Turret (75s/40e/3t)
  - Equipment: Light Armor (40s/3t), Heavy Armor (70s/5t), Pulse Rifle (55s/5t), Shotgun (65s/4t), Hazmat Suit (85s/6t)
- **Durability**: Weapons and armor have durability, can be repaired for 0.4 scrap per point
- **Inventor Ability**: Engineers have 30% chance when crafting equipment to:
  - Consume 1 Weapon Part from inventory
  - Grant 2-4 bonus Tech
  - Shows "🔧 Inventor: Rare component extracted!" message
- **Loot Rarity**: Items can drop in four quality tiers (Common, Uncommon, Rare, Very Rare)
  - Keen Eye: +20% rarity chance (Scavenger uncommon)
  - Treasure Hunter: +40% rarity chance (Scavenger rare)
- **Recycling System** (`js/game/recycling.js`):
  - Click crafted items in inventory to recycle for 50% refund (rounded up with Math.ceil)
  - All 8 crafting components refunded correctly (Weapon Parts, Armor Plating, Electronics, etc.)
  - Junk cannot be recycled (use Salvage button)
  - Non-craftable items get default scrap value
  - Themed confirmation popup shows exact resources before recycling
- **Repair Kits**: 
  - Automatically make system repairs free when in inventory
  - Repair buttons show "Repair (Free with Repair Kit)" when available
  - Clicking repair consumes one Repair Kit instead of resources
  - Display "✓ Auto-used on system repairs" in inventory
  - No manual "Use" button needed

### 7. Resource Management (`js/game/tick.js`)
- **Production**: Survivors + systems generate oxygen, food, energy, scrap
- **Consumption Rates (0.9.0 Aggressive Rebalance)**:
  - **Early Game (3 survivors)**: O2 +3.05/s net, Food +2.48/s net, Energy -0.29/s net (tight, forces generator)
  - **Mid Game (6 survivors, L3 systems)**: O2 +5.57/s net, Food +0.90/s net, Energy +4.91/s net (balanced)
  - **Late Game (10 survivors, L5 systems, turrets)**: O2 +6.75/s net, Food +1.28/s net, Energy +7.42/s net (scaling pressure)
  - O2: 0.12 base + 0.35/survivor (increased from 0.32)
  - Food: 0.08 base + 0.20/survivor (increased from 0.18)
  - Energy: 0.18/survivor + 0.06/turret + 0.08/filter level (all increased for late-game pressure)
- **Critical States**:
  - Oxygen < 10: Base integrity damage (-0.12/tick), morale loss (-0.5/tick)
  - Oxygen = 0: 2-5 HP damage per tick to all survivors, severe morale loss (-0.7/tick)
  - Food = 0: Morale loss (-0.35/tick), 5% chance of starvation death per tick (reduced from 8% for less RNG)
- **System Failures**: Random breakdowns reduce ALL production by 90% (not just the failed system)
  - 0.3% base chance per system per tick (~17% per minute, reduced from 1%)
  - Failsafe ability: -30% per instance with 20% minimum cap (Technician rare)
  - Repair costs: 35 scrap + 15 energy (filter), 30 scrap + 20 energy (generator)
- **Inventory Capacity**: 
  - Base: 20 items
  - Hoarder ability: +2 per instance
  - UI shows (current/max) with color coding

### 8. Threat & Raids (`js/game/threat.js`) - 0.9.0 Aggressive Rebalance
- **Threat Philosophy**: Threat is an **unstoppable tide**. Defenses slow it down but cannot reverse it. Players are always on a timer.
- **Threat Growth**: 
  - Base: 0.050/s + random 0.025/s = 0.075/s maximum growth
  - Guards: -0.08/s each (reduced from -0.12, less suppression)
  - Turrets: -0.10/s each (reduced from -0.15, less suppression)
  - **Minimum Growth Floor**: +0.005/s (threat ALWAYS grows, even with max defenses)
  - Example: 4 guards + 3 turrets = 0.075 - 0.32 - 0.30 = -0.545 → clamped to +0.005/s minimum
  - **Tiered Floors**: 0% → 20% → 40% → 60% → 80% (once reached, can't fall below)
- **Raid Chance Formula (0.9.0 retuned for gradual progression)**:
  - Base: 0.002 (0.2% per minute baseline)
  - Per explored tile: 0.00025 (100 tiles = +2.5%)
  - Per alien kill: 0.0015 (50 kills = +7.5%)
  - Threat contribution: threat / 3000 (80% threat = +2.7%)
  - Guards: -0.002 each, Turrets: -0.0015 each (max -5% total reduction)
  - **Raid Tier Floors**: 0% → 1% → 2.5% → 4.5% → 7% per minute (permanent minimums)
  - **Max Chance**: 10% per minute (cap to prevent spam)
- **Raid Cooldown**: 10-15 minutes between raids (reduced from 15-30 for faster testing)
- **Raid Composition (0.9.0 - more winnable)**: 
  - Alien count: 2-3 base + (threat/25) × 0.6 = **2-5 aliens** (reduced from 2-7)
  - Max count: 6 aliens (reduced from 7)
  - HP scaling: 1.0x → 1.5x at 100% threat (reduced from 1.83x)
  - Attack scaling: 1.0x → 1.4x at 100% threat (reduced from 1.67x)
  - Alien type weighted by threat (Drones/Lurkers early → Queens at 90%+)
  - Modifier chance: 1.0x → 2.0x with threat (more special abilities late game)
- **Defense**: Only guards defend raids (hardcore mode); turrets provide automated fire support
- **Raid Outcomes**: Victory reduces threat; defeat = instant game over
- **No Guards**: Instant game over if raid triggers with no guards on duty

### 9. Debug Tools (`js/debug.js`)
- **Access**: Press Ctrl+D to toggle debug panel
- **Resource Tools**: Add resources instantly for testing
- **Equipment Tools**: Spawn weapons, armor, hazmat suits
- **Survivor Tools**: Free recruitment, healing, leveling
- **Map Tools**: Reveal map, spawn/clear aliens, add hazards
- **System Tools**: Upgrade systems, reset threat, trigger raids
- **Time Control**: Skip forward 1 min / 5 min / 1 hour

## Development Workflows

### Running Locally
1. Start local HTTP server (required for localStorage):
   ```bash
   python -m http.server 8000
   # or
   npx serve -p 8000 .
   ```
2. Open `http://localhost:8000/index.html`

### Making Changes
1. **UI Components** (`js/ui.js`)
   - Add new panels to `index.html` using the `panel` class
   - Update `styles.css` for new component styles
   - Register click handlers in `js/main.js`
   - Use `updateUI()` optimization patterns (snapshot comparisons)

2. **Game Mechanics** (`js/game.js`)
   - Define constants in `js/constants.js` for tuning (BALANCE object)
   - Add state updates to `applyTick()` if time-based
   - Call `saveGame('action')` after important changes
   - Use `appendLog()` for player feedback

3. **Balance Changes** (`js/constants.js`)
   - All balance values in `BALANCE` object
   - Loot weights in `LOOT_TABLE`
   - Alien stats in `ALIEN_TYPES`
   - Crafting costs in `RECIPES`

### Common Tasks

1. **Adding New Resources**
   - Add to `state.resources` object in `js/state.js`
   - Update `updateUI()` function in `js/ui.js` (add display elements)
   - Add production/consumption in `applyTick()` in `js/game.js`
   - Add to save snapshot in `makeSaveSnapshot()` if needed

2. **Adding New Craftable Items**
   - Add recipe to `RECIPES` in `js/constants.js`
   - Add button to workbench in `index.html` with `data-item` attribute
   - Optionally add to `LOOT_TABLE` for world drops
   - Item objects should include: `id`, `type`, `name`, `durability` (if applicable)

3. **Creating Custom Dropdowns**
   ```javascript
   // See renderExplorerSelect() in ui.js for reference
   const dropdown = document.createElement('div');
   dropdown.className = 'task-dropdown';
   const button = document.createElement('button');
   button.className = 'task-dropdown-button';
   const content = document.createElement('div');
   content.className = 'task-dropdown-content';
   // Add items and event handlers
   ```

4. **Adding Map Tile Types**
   - Add type to tile generation in `initTiles()` in `js/game.js`
   - Add energy cost case in `getTileEnergyCost()` in `js/map.js`
   - Add event handler in `handleTileEvent()` in `js/game.js`
   - Add visual styling in `styles.css` (`.tile.yourtype`)

## Project Conventions

### CSS
- Use `var(--accent)` for highlighted text (blue: 4a9eff)
- Use `var(--muted)` for secondary text (gray: 808080)
- Use `var(--danger)` for warnings/critical states
- Panel backgrounds use `var(--card-gradient)`
- Spacing uses 8px increments (8, 16, 24, etc.)
- Dropdowns use `.task-dropdown` classes
- Responsive breakpoints: 1200px, 600px

### JavaScript
- Use camelCase for variables and functions
- Prefix button IDs with `btn` (e.g., `btnSave`)
- Resource IDs use `res-` prefix (e.g., `res-oxygen`)
- System IDs use `sys-` prefix (e.g., `sys-filter`)
- Always call `updateUI()` after state changes
- Use `appendLog()` for all player-facing messages
- Prefer `const` and `let` over `var`
- Use template literals for string interpolation

### Naming Conventions
- Functions: `camelCase` (e.g., `recruitSurvivor`, `grantXp`)
- Constants: `UPPER_SNAKE_CASE` (e.g., `TICK_MS`, `LOOT_TABLE`)
- State properties: `camelCase` (e.g., `state.nextSurvivorId`)
- CSS classes: `kebab-case` (e.g., `.survivor-card`, `.task-dropdown`)

### Version Control
- Use semantic versioning (MAJOR.MINOR.PATCH)
- Update version in: `js/constants.js` (VERSION constant), `index.html` (footer), `CHANGELOG.md`
- Update `_version` in `makeSaveSnapshot()` for breaking save changes
- Tag releases in git: `git tag v0.6.7`

### Deployment
- GitHub repo: jenkemplug/Station-Game
- Hosted on Netlify with continuous deployment
- Main branch deploys automatically
- Test locally before pushing to main

## Common Pitfalls
- Direct DOM manipulation outside `updateUI()` can cause inconsistencies
- Forgetting to call `updateUI()` after state changes leaves UI stale
- Test save/load functionality after state structure changes
- Check that new state properties are included in `makeSaveSnapshot()`
- **CRITICAL**: Always use `.type` property for equipment checks (e.g., `equipment.weapon?.type === 'rifle'`)
- **NEVER** compare equipment objects directly to strings (e.g., `equipment.weapon === 'Pulse Rifle'` will fail)
- Equipment is stored as objects with `{ id, type, name, durability, maxDurability }` structure
- Don't forget to deduct costs before granting benefits
- Ensure ammo consumption is checked in combat calculations
- Check mobile responsiveness when modifying layout
- Test dropdown focus and scroll preservation after UI changes
- Verify that mission survivors are filtered from task assignments
- Always validate survivor/item existence before operations

## Performance Optimizations
- UI renders use snapshots to avoid unnecessary re-renders
- `lastRenderedSurvivors`, `lastRenderedAvailableExplorers` track state
- Expedition timers update separately without full re-render
- Dropdown scroll positions preserved in `activeTaskDropdownScroll`
- Map tiles only re-render when exploration state changes
- Log limited to 300 entries max

## Testing Checklist
When making changes, verify:
- [ ] Save/load works correctly
- [ ] Offline progress calculates properly
- [ ] Resources don't go negative
- [ ] UI updates reflect state changes
- [ ] Dropdowns maintain state across re-renders
- [ ] Combat calculations use correct equipment bonuses
- [ ] XP and leveling work as expected
- [ ] Crafting costs are deducted
- [ ] New features have log messages
- [ ] Mobile layout isn't broken
- [ ] No console errors