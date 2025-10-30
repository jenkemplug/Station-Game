# Changelog
All notable changes to the Derelict Station project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.6.7] - 2025-10-30
### Changed
- **Major Code Refactor:** Split monolithic game.js (805 lines) into focused modules
  - `js/game/save.js` - Save/load system and tile initialization
  - `js/game/survivor.js` - Survivor recruitment, tasks, equipment, XP
  - `js/game/combat.js` - Combat system with helper functions for damage calculation
  - `js/game/exploration.js` - Tile exploration and event handling
  - `js/game/crafting.js` - Item crafting, system upgrades, repairs
  - `js/game/expedition.js` - Expedition management and mission tracking
  - `js/game/threat.js` - Threat evaluation and raid resolution
  - `js/game/tick.js` - Main game loop orchestrator
- Improved code maintainability and readability
- Added helper functions `calculateAttackDamage()` and `calculateDefense()` for cleaner combat logic
- Better separation of concerns across game systems

### Technical
- No gameplay changes - purely architectural improvements
- All existing functionality preserved and tested
- Updated script loading order in index.html

## [0.6.6] - 2025-10-30
### Fixed
- **Critical Bug:** Fixed equipment bonuses not applying in combat
  - Weapon bonuses (Pulse Rifle +6 damage, Shotgun variable damage) now work correctly
  - Armor defense bonuses (Light Armor -2, Heavy Armor -4, Hazmat Suit -3) now apply properly
  - Equipment checks now correctly use object properties instead of string comparison
  - Combat system now properly recognizes all equipment types

### Changed
- Improved combat damage calculation for more balanced gameplay
- Enhanced equipment bonus system for better clarity

## [0.6.5] - 2025-10-30
### Added
- **Debug Panel:** Press Ctrl+D to open a comprehensive debug panel for testing
- **Resource Debug Tools:** Instantly add oxygen, food, energy, scrap, tech, and ammo
- **Equipment Debug Tools:** Add weapons, armor, and hazmat suits to inventory
- **Survivor Debug Tools:** Free recruitment, heal all, max morale, level up all survivors
- **Map Debug Tools:** Reveal entire map, spawn aliens, clear aliens, add hazard rooms
- **System Debug Tools:** Upgrade all systems, reset threat, repair base, trigger raids
- **Time Control:** Skip forward by 1 minute, 5 minutes, or 1 hour for testing

### Changed
- Updated footer to show debug panel keyboard shortcut (Ctrl+D)

## [0.6.4] - 2025-10-30
### Added
- **Hazmat Suit:** New craftable equipment (85 scrap, 6 tech, 150 durability)
- **Hazard Room Clearing:** Requires Hazmat Suit to clear contaminated areas
- **Enhanced Hazard Rewards:** 3x loot rolls and 3x XP for clearing hazard rooms
- **Hazmat Suit Durability:** Suit degrades 15-25 points per hazard cleared
- **Explorer Selection:** Added a dropdown menu on the map panel to select a specific survivor for exploration.
- **Solo Exploration XP:** Only the selected explorer now gains XP from discovering new tiles and finding loot.
- **Explorer Combat:** The selected explorer is now the sole combatant in battles triggered by exploration.
- **Visible Equipment:** Survivor cards now display currently equipped weapons and armor.
- **Expedition XP:** Survivors now gain XP for completing expeditions, with more XP awarded for success.

### Changed
- Updated workbench UI to show the correct, rebalanced crafting costs.
- Refactored combat logic to differentiate between exploration skirmishes and base raids.
- Hazard rooms are now high-value targets with best risk/reward ratio

## [0.6.3] - 2025-10-30
### Added
- **Expedition Costs:** Expeditions now cost 10 Food and 15 Energy to launch.
- **Functional XP System:** Survivors now gain XP from exploring, finding loot, and combat.
- **Level-Up Bonuses:**
  - Survivor level now increases resource production rates.
  - Survivor level now increases combat damage.
  - Leveling up now fully heals the survivor and increases their max HP.

### Changed
- Survivors on expeditions no longer consume the base's Food and Oxygen.
- Rebalanced XP rewards for different activities.
- Refactored level-up logic into a reusable `grantXp` function.

## [0.6.2] - 2025-10-30
### Changed
- **Major Balance Pass:** Implemented a wide range of changes to increase game difficulty and strategic depth.
- **Increased Resource Consumption:** Survivors now consume more Food and Oxygen.
- **Harsher Penalties:** Negative consequences for low resources (starvation, asphyxiation) are more severe.
- **Tougher Aliens:** Increased HP and attack power for all alien types.
- **More Frequent Raids:** Raids occur more often and scale faster with threat level.
- **Reduced Production:** Survivor and system production efficiency has been lowered.
- **Riskier Expeditions:** Lowered the base success chance for expeditions.
- **Increased Crafting/Upgrade Costs:** All crafting recipes and system upgrades are now more expensive.

## [0.6.1] - 2025-10-30
### Changed
- Removed 'Explore' task from survivor assignments
- Significantly increased exploration energy costs for better game balance:
  - Hazard tiles: 25 energy
  - Alien tiles: 20 energy
  - Module tiles: 18 energy
  - Resource tiles: 15 energy
  - Survivor tiles: 12 energy
  - Empty tiles: 8 energy

### Removed
- Scanner button and functionality
- Scanner key shortcut (L key)
- Long-range scanning system

## [0.6.0] - 2025-10-30
### Added
- New exploration system: click adjacent tiles to explore them
- Visual indicators for explorable tiles
- Dynamic energy costs based on tile type
- Enhanced tooltips showing exploration costs
- Improved adjacent tile detection system

### Changed
- Removed old exploration buttons in favor of direct tile interaction
- Updated map UI with clearer exploration guidance
- Optimized map rendering for better performance
- Reorganized exploration code into dedicated map.js module
- Updated Scanner functionality to complement new exploration system

### Removed
- Old exploration task/buttons for cleaner UI
- Legacy exploration functions that are no longer needed

## [0.5.6] - 2025-10-30
### Added
- Added countdown timer display for expeditions
- Improved expedition status to show remaining time in hours, minutes, and seconds

### Changed
- Optimized survivor list rendering to update expedition timers smoothly
- Enhanced UI to maintain dropdown states during timer updates

## [0.5.5] - 2025-10-30
### Added
- Set up a Git repository and connected it to Netlify for continuous deployment.
- Documented the deployment workflow in the README.

### Changed
- Renamed `game.html` to `index.html` to follow web standards.

## [0.5.4] - 2025-10-30
### Fixed
- Resolved a bug where only the first survivor could be selected for expeditions.
- Fixed a visual glitch causing the expedition dropdown to flicker and lose focus.
- Corrected a z-index issue where task dropdowns could appear behind other survivor cards.
- Unified dropdown logic to prevent state conflicts between different UI components.

### Changed
- Restyled the expedition survivor selector to match the custom dropdown style used for tasks.
- Optimized UI rendering for dropdowns to prevent unnecessary updates.

## [0.5.3] - 2025-10-30
### Added
- Added a dropdown menu to select which survivor to send on an expedition
- Filter and generator modules can now be found as very rare loot

### Changed
- Updated the expedition system to use the selected survivor
- Expanded the loot table to include all craftable items

## [0.5.2] - 2025-10-30
### Added
- All craftable items can now be found as rare loot during exploration

### Changed
- Expanded the loot table to include all craftable items with varying rarity
- Increased the map size to 10x20 (200 tiles) for a larger game world

## [0.5.1] - 2025-10-30
### Changed
- Reduced autosave notification frequency to once every 10 saves
- Saves triggered by player actions are now silent to reduce log spam
- Manual save notifications are unchanged

## [0.5.0] - 2025-10-30
### Added
- Implemented item durability for weapons and armor
- Added a repair system that costs scrap
- Added new craftable items: Heavy Armor and Shotgun
- Survivors now have an "On Expedition" status and cannot be assigned to other tasks
- Expedition reports now provide a detailed summary of events

### Changed
- Overhauled the expedition system to be more meaningful and immersive
- Survivors on expeditions no longer contribute to resource production
- Updated the UI to display item durability and on-mission status

## [0.4.0] - 2025-10-30
### Added
- Implemented a unique user ID system to support multiple players on the same domain
- Each player now has their own separate save file
- Added a version constant to `js/constants.js` for easier updates

### Changed
- The save key is now a combination of the base game key and a unique user ID
- All save/load functions now use the new unique save key

## [0.3.1] - 2025-10-30
### Fixed
- Survivors can no longer be sent on multiple expeditions at the same time
- The "Scan" button on the map is now functional again

### Changed
- Overhauled the expedition system to properly check for available survivors
- Re-implemented the `longRangeScan` function that was missed during refactoring

## [0.3.0] - 2025-10-30
### Added
- Refactored entire JavaScript codebase into a modular structure
- Created separate files for constants, state, UI, game logic, and main entry point
- New file structure improves scalability and maintainability

### Changed
- Migrated all game logic from a single `game.js` file to a new `js/` directory
- Updated `game.html` to load the new modular scripts
- Improved code organization and separation of concerns

## [0.2.3] - 2025-10-30
### Changed
- Widened side panels to 480px to better accommodate survivor controls
- Increased overall max-width of the layout to 1400px
- All side panels (survivors, notifications, inventory) now have a consistent, wider layout

## [0.2.2] - 2025-10-30
### Added
- Significantly expanded name pool with more cultural diversity
- Added new sci-fi and technology-themed names
- Added station/engineering themed names
- Improved rescue message to include survivor's name

### Changed
- Found survivors now receive random names instead of "Found-N" format
- Enhanced name variety and theming to better fit station context

## [0.2.1] - 2025-10-30
### Changed
- Set notifications panel to fixed height for consistent UI layout
- Changed notifications panel from max-height to fixed height of 300px

## [0.2.0] - 2025-10-30
### Added
- Reintroduced "Salvage" and "Discard" functionality for inventory management
- Added scroll position memory for task selection dropdowns
- Added proper event handling for inventory management buttons

### Fixed
- Task dropdown selection now works reliably
- Fixed event propagation issues with dropdown menus
- Scroll position in dropdowns now persists between selections
- Restored junk salvaging functionality

### Changed
- Renamed "Auto-salvage" to "Salvage" for clarity
- Improved dropdown menu interaction and reliability
- Enhanced event handling system for UI components

## [0.1.1] - 2025-10-29
### Fixed
- Auto-salvage button now properly converts all junk items to scrap
- Task selection dropdowns no longer close automatically
- Survivors panel widened to better accommodate all controls
- Notifications panel moved to top of sidebar and expanded for better visibility

### Changed
- Improved side panel organization for better usability
- Expanded notifications log height for better message visibility
- Removed debug/shortcuts panel from main view

## [0.1.0] - 2025-10-29
### Added
- New random name generation system from diverse name pool
- Increasing recruitment costs based on survivor count and exploration progress
- Task selection dropdown menu for survivors
- CHANGELOG.md to track version history

### Changed
- Replaced "Cycle Task" button with a styled dropdown menu
- Survivor status/role display now accurately reflects current task
- Split names into separate names.js file
- Visual styling for task selection dropdown

### Fixed
- Survivor role/task synchronization
- Manual recruitment now properly checks and deducts scrap cost