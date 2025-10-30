# Changelog
All notable changes to the Derelict Station project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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