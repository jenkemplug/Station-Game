# Derelict Station - AI Agent Instructions

## Project Overview
This is a browser-based survival/management game where players manage a space station, survivors, and resources while facing alien threats. The project uses vanilla JavaScript, HTML, and CSS with no external dependencies.

**Current Version:** 0.6.4 (Exploration Update)

## Architecture

### Core Components
1. **State Management** (`js/state.js`)
   - Central `state` object manages all game data
   - Uses localStorage for persistence with unique user IDs (key: `derelict_station_expanded_v0.6.4_${USER_ID}`)
   - State includes: resources, survivors, map, inventory, systems, threat levels, missions
   - Multi-user support: Each player on the same domain gets a unique save file
   - UI state tracking: `activeDropdown`, `selectedExplorerId`, `selectedExpeditionSurvivorId`

2. **UI Structure** (`index.html`, `styles.css`)
   - Two-column layout with main content and side panels
   - Panels use CSS Grid for layout (`grid-template-columns: 1fr 480px`)
   - All UI elements use the `panel` class with consistent styling
   - Custom dropdown components with state preservation

3. **Game Loop** (`js/game.js`, `js/main.js`)
   - Runs every 1000ms (`TICK_MS = 1000`)
   - Handles resource production, consumption, and event triggers
   - Updates UI after state changes
   - Supports offline progress calculation

### File Structure
```
js/
├── constants.js    # Game balance, recipes, loot tables, alien types
├── state.js        # Global state object and UI state variables
├── utils.js        # Helper functions (rand, clamp, el, formatTime)
├── names.js        # Survivor name pool (200+ names)
├── map.js          # Map utilities, exploration, tile management
├── ui.js           # All rendering functions (updateUI, renderSurvivors, etc.)
├── game.js         # Core game logic, combat, crafting, saves
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

3. **Save/Load System** (`js/game.js`)
   - Game state saved every 15s automatically (silent autosave every 10 ticks)
   - Manual save available via UI (shows log message)
   - Action saves are silent (called after user actions)
   - Handles offline progress calculation via `handleOffline()`
   - Save key includes version and unique user ID

4. **XP and Leveling** (`js/game.js`)
   ```javascript
   grantXp(survivor, amount); // Handles XP gain and level ups
   // Level ups: +1-2 skill, +5 maxHP, full heal, 1.5x nextXp
   ```

5. **Combat System** (`js/game.js`)
   ```javascript
   resolveSkirmish(aliens, context, idx);
   // context: 'field' (exploration) or 'base' (raids)
   // Weapons add damage, armor reduces incoming damage
   // Ammo consumed during combat (60% chance per shot)
   ```

## Game Systems

### 1. Exploration System (`js/map.js`, `js/game.js`)
- **Click-to-explore**: Players click adjacent tiles on the map
- **Explorer Selection**: Dropdown menu selects which survivor explores
- **Energy Costs**: Vary by tile type (8-25 energy)
  - Empty: 8, Survivor: 12, Resource: 15, Module: 18, Alien: 20, Hazard: 25
- **Solo Combat**: Selected explorer fights aliens encountered during exploration
- **XP Rewards**: Explorer gains XP for discovering tiles and finding loot

### 2. Survivor System (`js/game.js`)
- **Attributes**: level, xp, skill, hp, maxHp, morale, task, equipment
- **Equipment Slots**: weapon (rifle/shotgun), armor (light/heavy/hazmat)
- **Tasks**: Idle, Oxygen, Food, Energy, Scrap, Guard
- **Level Bonuses**: +5% production per level, +0.5 combat damage per level
- **Recruitment**: Cost scales with survivor count, discounted by exploration progress

### 3. Combat System (`js/game.js`)
- **Field Combat**: Selected explorer vs aliens during exploration
- **Base Defense**: Guards defend against raids
- **Weapon Bonuses**: Pulse Rifle +6 damage, Shotgun varies
- **Armor Defense**: Light Armor -2 damage, Heavy Armor -4 damage
- **Ammo System**: Consumed during combat (60% chance per attack), halved damage when depleted
- **XP Rewards**: 10-20 XP per combat, survivors gain levels

### 4. Hazard Rooms (`js/game.js`)
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

### 6. Crafting System (`js/game.js`, `js/constants.js`)
- **Recipes**: Defined in `RECIPES` object in `constants.js`
- **Resources**: scrap, energy, tech used for crafting
- **Craftable Items**:
  - Consumables: Medkit (15 scrap), Ammo (10 scrap)
  - Systems: Filter (30s/20e), Generator (25s), Turret (75s/40e/3t)
  - Equipment: Light Armor (40s/3t), Heavy Armor (70s/5t), Pulse Rifle (55s/5t), Shotgun (65s/4t), Hazmat Suit (85s/6t)
- **Durability**: Weapons and armor have durability, can be repaired for 0.5 scrap per point

### 7. Resource Management (`js/game.js`)
- **Production**: Survivors + systems generate oxygen, food, energy, scrap
- **Consumption**: Base consumption + per-survivor rates
- **Critical States**:
  - Oxygen < 6: Base integrity damage, morale loss
  - Oxygen = 0: 2-4 HP damage per tick to all survivors
  - Food = 0: Morale loss, 8% chance of starvation death per tick

### 8. Threat & Raids (`js/game.js`)
- **Threat Level**: Increases over time, reduced by guards
- **Raid Chance**: Base 0.5% + (threat/3000), max 8%
- **Defense Calculation**: Turrets + guards + armor bonuses
- **Raid Outcomes**: Success = scrap reward, Failure = base damage + possible casualties

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
- Use `var(--accent)` for highlighted text (#4a9eff blue)
- Use `var(--muted)` for secondary text (#808080 gray)
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
- Tag releases in git: `git tag v0.6.4`

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
- Verify equipment checks use `.type` property (e.g., `equipment.weapon?.type === 'rifle'`)
- Remember combat uses equipment objects, not just strings
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