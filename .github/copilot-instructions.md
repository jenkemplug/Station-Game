# Derelict Station - AI Agent Instructions

## Project Overview
This is a browser-based survival/management game where players manage a space station, survivors, and resources while facing alien threats. The project uses vanilla JavaScript, HTML, and CSS with no external dependencies.

## Architecture

### Core Components
1. **State Management** (`js/state.js`)
   - Central `state` object manages all game data
   - Uses localStorage for persistence (key: `derelict_station_expanded_v1.7.x`)
   - State includes: resources, survivors, map, inventory, systems, threat levels

2. **UI Structure** (`game.html`, `styles.css`)
   - Two-column layout with main content and side panels
   - Panels use CSS Grid for layout (`grid-template-columns: 1fr 480px`)
   - All UI elements use the `panel` class with consistent styling

3. **Game Loop** (`js/game.js`, `js/main.js`)
   - Runs every 1000ms (`TICK_MS`)
   - Handles resource production, consumption, and event triggers
   - Updates UI after state changes

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
   ```

3. **Save/Load System** (`js/game.js`)
   - Game state saved every 15s automatically
   - Manual save available via UI
   - Handles offline progress calculation

## Development Workflows

### Running Locally
1. Start local HTTP server (required for localStorage):
   ```bash
   python -m http.server 8000
   # or
   npx serve -p 8000 .
   ```
2. Open `http://localhost:8000/game.html`

### Making Changes
1. **UI Components** (`js/ui.js`)
   - Add new panels to `game.html` using the `panel` class
   - Update `styles.css` for new component styles
   - Register click handlers in `js/main.js`

2. **Game Mechanics** (`js/game.js`)
   - Define constants in `js/constants.js` for tuning
   - Add state updates to tick loop if time-based
   - Call `saveGame()` after important changes

### Common Tasks

1. **Adding New Resources**
   - Add to `state.resources` object in `js/state.js`
   - Update `updateUI()` function in `js/ui.js`
   - Add production/consumption in tick loop in `js/game.js`

2. **Creating UI Components**
   ```javascript
   const panel = document.createElement('div');
   panel.className = 'panel';
   // Add content
   existingContainer.appendChild(panel);
   ```

## Project Conventions

### CSS
- Use `var(--accent)` for highlighted text
- Use `var(--muted)` for secondary text
- Panel backgrounds use `var(--card)` gradient
- Spacing uses 8px increments

### JavaScript
- Use camelCase for variables and functions
- Prefix button IDs with `btn` (e.g., `btnSave`)
- Resource IDs use `res-` prefix (e.g., `res-oxygen`)
- Always call `updateUI()` after state changes

### Version Control
- Use semantic versioning (MAJOR.MINOR.PATCH)
- Update version in: `js/constants.js`, `game.html`, `CHANGELOG.md`

## Common Pitfalls
- Direct DOM manipulation outside `updateUI()` can cause inconsistencies
- Always use absolute paths in file operations
- Test save/load functionality after state structure changes
- Check mobile responsiveness when modifying layout