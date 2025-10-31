# Derelict Station - AI Agent Instructions

## Project Overview
This is a browser-based survival/management game where players manage a space station, survivors, and resources while facing alien threats. The project uses vanilla JavaScript, HTML, and CSS with no external dependencies.

**Current Version:** 0.8.10 (Advanced Systems)

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
- **Attributes**: level, xp, skill, hp, maxHp, morale, task, equipment, class, abilities, downed, classBonuses
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
- **Level Bonuses**: +6% production per level, +0.6 combat damage per level
- **Recruitment**: Cost scales with survivor count, discounted by exploration progress
- **Randomized Names**: Starter survivors have random names from 300+ name pool
- **Downed State**: Survivors at 0 HP become downed instead of dying immediately
- **Release Protection**: Cannot release last survivor (button disabled, backend validation) (0.8.10)

### 3. Combat System (`js/game/combat.js`, `js/game/combatInteractive.js`)
- **Interactive Combat**: Turn-based overlay with tactical actions
  - Actions: Shoot, Aim (+25% hit), Burst (2 shots + bonus dmg), Guard (+3 def), Medkit, Retreat, Revive
  - Auto-resolve option available for quick battles
  - Combat log tracks all actions and alien specials
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

### 7. Resource Management (`js/game/tick.js`)
- **Production**: Survivors + systems generate oxygen, food, energy, scrap
- **Consumption**: Base consumption + per-survivor rates
- **Critical States**:
  - Oxygen < 6: Base integrity damage, morale loss
  - Oxygen = 0: 2-4 HP damage per tick to all survivors
  - Food = 0: Morale loss, 6% chance of starvation death per tick
- **System Failures**: Random breakdowns disable production
  - 1% base chance per system per tick
  - Failsafe ability: Reduces to 0.5% (Technician rare)
  - Repair costs: 10-20 scrap, 5-10 energy
- **Inventory Capacity**: 
  - Base: 20 items
  - Hoarder ability: +2 per instance
  - UI shows (current/max) with color coding

### 8. Threat & Raids (`js/game/threat.js`)
- **Threat Level**: Increases over time, reduced by guards
- **Raid Chance**: Base 0.4% + contributions from exploration/alienKills, max 7%
  - Per-minute probability displayed in UI
  - Reduced by guards (0.25% each) and turrets (0.2% each)
  - Increased by explored tiles (0.003% each) and alien kills (0.05% each)
- **Raid Cooldown**: 15-20 minute randomized cooldown between raids (0.7.3)
- **Defense**: Only guards defend raids (0.7.1); turrets provide automated fire support (0.7.3)
- **Raid Composition**: Dynamic alien spawning based on threat level (0.7.4)
  - Low threat: Drones and Lurkers
  - Mid threat: Stalkers and Spitters
  - High threat: Broods and Ravagers
  - Very high threat: Spectres and Queens
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