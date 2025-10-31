# Changelog
All notable changes to the Derelict Station project will be documented in this file.

## [0.8.12] - 2025-10-31
### Fixed - Balance & Mechanics
- **Item Repair Cost Stacking**: Fixed repair costs to use additive stacking like all other bonuses
  - **Before**: Only used best Engineer's bonus (multiplicative)
  - **After**: All Engineers' repair bonuses stack additively, Quick Fix stacks additively
  - Example: 2 Engineers (20% each) + Quick Fix = 60% total reduction (was ~36% before)
  - Consistent with crafting costs, production bonuses, and all other systems
  - Capped at 90% reduction to prevent exploits

### Changed - Balance Adjustments
- **Food Production Buffed**: FoodYieldFactor increased from 0.6 to 0.95 (58% buff)
  - **Before**: Food production was ~43% as efficient as oxygen (too weak)
  - **After**: Food production now ~87% as efficient as oxygen (~13% worse)
  - Example at skill 5: Food now +1.05/s vs Oxygen +1.4/s (was +0.66/s vs +1.4/s)
  - Makes food management more reasonable without trivializing the resource
  - Food consumption remains unchanged (0.05 base + 0.22 per survivor)

## [0.8.11] - 2025-10-31
### Fixed - Balance & Mechanics
- **Food Production Display Bug**: Fixed UI showing incorrect food production rate
  - **Issue**: Food production shown as higher than actual (e.g., +1.1/s displayed but only +0.66/s applied)
  - **Cause**: FoodYieldFactor (0.6) was applied to resources but not to UI display value
  - **Fix**: Now applies FoodYieldFactor before storing in `state.production.food`
  - UI now accurately reflects actual food gain rate

- **Scientist XP Bonuses**: Fixed Genius (+25%) and Studious (+15%) ability bonuses not applying
  - Previously only class bonus was applied to XP gains
  - **Changed to additive stacking** for consistency with other bonuses
  - Example: Scientist with +20% class bonus and Studious now gets 0.9 × (1 + 0.20 + 0.15) = 1.215× XP
  - **Removed double-application** of XP bonuses in combat.js and map.js

- **Multiple Survivor Bonus Stacking**: **ALL bonuses now stack additively** for consistency
  - **Combat Damage**: Soldier class + Veteran + Berserker stack additively
  - **Engineer Production**: Multiple Engineers' bonuses stack additively **only for their own tasks**
  - **Technician Crafting**: Multiple Technicians' cost reductions stack additively
  - **Technician Durability**: Multiple Technicians' durability bonuses stack additively
  - **Technician Recycler**: Multiple Recycler abilities stack (25% per Technician, up to 100%)
  - **Medic Healing**: Class bonus + Triage stack additively
  - **Scavenger Scrap/Loot**: All bonuses stack additively, now applies to expeditions and scrap task
  - **Scout Retreat**: Retreat chance bonuses now additive instead of multiplicative
  - More predictable and rewarding for specializing with multiple class members

- **Production Localization**: Fixed Engineer bonuses incorrectly boosting all systems globally
  - **Before**: One Engineer's class bonus boosted ALL Filter/Generator production
  - **After**: Engineer class/Efficient bonuses only affect their own assigned task
  - **Global abilities preserved**: Overclock and Mastermind still boost all systems (intended design)
  - This prevents stacking multiple Engineers from creating excessive passive income

- **Scavenger Scrap Bonuses**: Extended scrap bonus to cover all scrap-generating activities
  - Now applies to: Exploration loot, Scrap task production, and **Expedition rewards**
  - Previously expeditions ignored Scavenger bonuses entirely
  - Consistent reward scaling across all gameplay modes

- **UI Clarity**: Removed misleading "Level: +X%" display
  - Level bonuses now properly integrated into specific stat displays
  - **Level affects**: Production tasks (+5% per level) and Combat damage (+0.5 per level)
  - **Level does NOT affect**: XP gain, healing, crafting, or most other bonuses
  - Each stat line now shows total bonus including level where applicable

### Changed - Balance Adjustments
- **Food Production Buffed**: FoodYieldFactor increased from 0.6 to 0.95 (58% buff)
  - **Before**: Food production was ~43% as efficient as oxygen (too weak)
  - **After**: Food production now ~85% as efficient as oxygen (~15% worse)
  - Example at skill 5: Food now +1.05/s vs Oxygen +1.4/s (was +0.66/s vs +1.4/s)
  - Makes food management more reasonable without trivializing the resource
  - Food consumption remains unchanged (0.05 base + 0.22 per survivor)

- **Tech Generation Nerfed**: Analytical and Genius passive tech generation significantly reduced
  - Analytical: Changed from +1 tech per 10 seconds to +1 tech per 60 seconds (6x slower)
  - Genius: Changed from +2 tech per 10 seconds to +2 tech per 60 seconds (6x slower)
  - Still provides steady tech income but at a more balanced rate
  - Breakthrough ability unchanged (still 5% chance per tick for burst tech)

- **Overclock Rework**: Changed from energy consumption penalty to system failure rate increase
  - **Before**: Systems produce +30% but consume +10% more energy
  - **After**: Systems produce +30% but increase failure rate by +50%
  - Creates more interesting risk/reward: high production vs. repair costs
  - **Stacks additively**: 2× Overclock = +60% production, +100% failure rate (2× base rate)
  - **Failsafe counterplay**: Failsafe reduces failure rate by -50%, can offset Overclock's downside
  - Example: 1 Overclock + 1 Failsafe = +30% production, normal failure rate (balanced trade)

### Technical Notes
- **Additive Stacking Formula**: All bonuses now use `finalValue = baseValue × (1 + bonus1 + bonus2 + ...)`
- **System Failure Rate**: Base 1% per system per 10s check, modified by abilities
  - Failure rate = base × (1.0 + 0.5×Overclocks - 0.5×Failsafes), minimum 10%
  - Example rates: 0 abilities = 1%, 1 Overclock = 1.5%, 1 Failsafe = 0.5%, both = 1%

## [0.8.10] - 2025-10-31
### Added - Class Bonus Ranges
- **Randomized Class Bonuses**: All survivor classes now have rolled bonus values within ranges
  - **Soldier**: +10-20% combat damage, +4-8 HP, +2-4 defense
  - **Medic**: +25-35% healing, +5-15% survival bonus
  - **Engineer**: +15-30% production, 15-25% repair cost reduction
  - **Scout**: 10-20% exploration energy reduction, +15-25% dodge, +20-30% retreat chance
  - **Technician**: 10-20% crafting cost reduction, +15-25% durability, +10-20% tech gains
  - **Scientist**: +15-30% XP gain, +15-25% analysis bonus
  - **Guardian**: +3-6 defense, +5-10% morale bonus
  - **Scavenger**: +15-25% loot quality, +20-30% scrap gain
  - Bonuses rolled randomly when recruiting and stored per survivor
  - Applied throughout all game systems (combat, production, crafting, exploration)
  - Save migration: existing survivors get rolled bonuses automatically on load

- **Survivor Bonus Display**: Total bonuses now shown in survivor UI
  - Displays combined level, class, and ability bonuses
  - Shows production, combat, defense, dodge, XP multipliers
  - Color-coded and positioned below class and abilities
  
- **Crafting Cost Discounts Visible**: Workbench shows original prices crossed out when Technician bonuses apply
  - Original cost displayed with strikethrough
  - Discounted cost shown alongside
  - Makes cost reduction bonuses clearly visible
  
- **Dynamic Tile Costs**: Map tooltips show actual energy costs including Scout bonuses
  - Reflects both class bonuses and Pathfinder ability
  - Shows real cost player will pay when hovering tiles

- **Last Survivor Protection**: Cannot release your last surviving crew member
  - Release button disabled when only 1 survivor remains
  - Tooltip explains restriction
  - Backend validation prevents accidental releases
  
### Fixed
- **Raid/Threat Minimum Persistence**: Fixed bug where raid and threat tier minimums persisted between new games
  - `highestThreatTier` and `highestRaidTier` now properly reset on new game start
  - Only load from saves, don't carry over in memory between sessions

- **Game Over State Persistence**: Fixed multiple critical bugs with game over screen
  - Added `gameOver` flag to track ended games
  - Prevents survivor respawn bug when reloading on game over screen
  - Game over modal now properly shows on reload with functioning buttons
  - UI renders correctly in background (no black screen)
  - Start New Game and Load Save buttons work reliably

- **Panel Re-rendering**: Fixed unnecessary re-renders of base, map, and survivor panels
  - Added snapshot checks for survivor count and map info
  - Prevents UI flicker from constant DOM updates
  - Optimized performance during normal gameplay
  
### Changed - Gameplay Rebalance & UI Improvements
- **Energy Now Critical for Oxygen**: Running out of energy severely impacts oxygen production
  - Oxygen production reduced to 10% effectiveness when energy is depleted
  - Makes energy management crucial for survival
  
- **Defense Limits**: Maximum caps on guards and turrets
  - Max 4 guards can be assigned to Guard duty
  - Max 5 turrets can be built
  - Visual feedback: Guard option grayed out and disabled when limit reached
  - Log notification when attempting to exceed limits
  - Aligns with tiered threat/raid system for balanced progression
  
### Removed
- **Journal Panel**: Removed journal display from UI
  - Cleaned up all journal references from codebase
  - Streamlined interface for better readability
  
- **Turret Crafting**: Removed redundant turret crafting from Workbench
  - Turrets can only be built via Systems panel now
  - Reduces UI clutter and confusion
  
### UI Changes
- **Panel Rearrangement**: Swapped positions for better workflow
  - Workbench moved to bottom-left (main content area)
  - Threats & Base moved to bottom-right (main content area)
  - Inventory remains in right sidebar above notifications
  - Middle space left blank for future features
  
- **Visual Refinements**: Resource consumption text alignment adjusted (3px margin)

## [0.8.9] - 2025-10-31
### Changed - Tiered Threshold System
- **Threat Tier System**: Threat now uses dynamic floors based on highest tier reached
  - Tiers at 0% → 20% → 40% → 60% → 80% become permanent floors once crossed
  - Replacing static 15% floor with progressive milestone system
  - Milestone notifications alert when crossing into new tier
  - Can temporarily reduce threat below tier but not below highest tier reached
  
- **Raid Chance Tier System**: Raid frequency uses tiered floors
  - Tiers at 0% → 1.5% → 3.5% → 5.5% → 8.0% per minute
  - Once you hit a tier, raid pressure cannot fall below it permanently
  - Creates escalating difficulty curve as you progress
  
- **Expedition Failures Now Matter**: Failed expeditions have consequences
  - +3-6 threat increase on failure (immediate pressure)
  - +1.5% temporary raid pressure (decays over time)
  - Makes expedition risk/reward more meaningful
  
- **Rebalanced Growth Rates**: Increased pressure to overcome heavy defenses
  - Threat growth: 0.055 base + 0.055 random (up from 0.035 + 0.045)
  - Raid base chance: 0.30% (up from 0.25%)
  - Exploration pressure: 0.040% per tile (up from 0.035%)
  - Combat pressure: 0.25% per kill (up from 0.20%)
  - Defense soft cap: 7% max reduction (up from 6%)
  - Ensures threat/raids meaningfully progress even with max defenses

### System Design
- **High Water Marks**: Once you reach a tier, it becomes your new minimum
- **Still Reducible**: Can lower threat/raids temporarily, just not below tier floor
- **Progression Guaranteed**: Even with 10+ guards/turrets, tiers will eventually progress
- **Milestone Feedback**: Special log messages when crossing tier thresholds

## [0.8.8] - 2025-10-30
### Changed - Major Balance & Progression Overhaul
- **Energy Consumption Rebalanced**: Energy now scales per-survivor (0.18/s each) instead of flat base rate
  - Oxygen filters consume 0.08 energy per upgrade level (scales with production)
  - Turrets consume 0.05 energy each (increased from 0.03)
  - Makes energy management more challenging as base grows
  
- **Threat & Raid System Overhaul**: Mid-to-late game progression now functional
  - **Permanent Threat Floor**: 15% threat cannot be reduced below by guards/turrets
  - **Guard/Turret Effectiveness**: Reduced from 0.10 → 0.08 per guard (less effective)
  - **Defense Soft Cap**: Guards + turrets can only reduce raid chance by max 6%
  - **Threat Scaling**: Threat contributes more to raids (divisor 3000 → 2500)
  - **Raid Cap Increased**: Maximum raid chance raised from 10% → 12% per minute
  - **Exploration Pressure**: Tile exploration increases raids (0.00030 → 0.00035 per tile)
  - **Combat Pressure**: Alien kills increase raids (0.0015 → 0.0020 per kill)
  - **Result**: Stacking guards/turrets no longer eliminates all threat; progression remains meaningful

- **UI Polish**: Consumption text alignment further improved (5px right margin)

### Added
- **Explorer Persistence**: Selected explorer now persists between reloads (saved to state)
- **Expedition Survivor Persistence**: Selected expedition survivor now persists between reloads

### Fixed
- **Load System Bug**: UI selections now properly restored from save file on game load

## [0.8.7] - 2025-10-30
### Changed
- **UI Polish**: Consumption text alignment improved (2px right margin for better visual balance)

### Verified
- **Comprehensive Ability Audit**: All 40 class abilities across 8 classes confirmed working
  - Soldier (5): marksman, tactical, veteran, berserker, commander
  - Medic (5): triage, stabilize/fieldmedic, adrenaline, lifesaver, miracle
  - Engineer (5): efficient, quickfix, overclock, failsafe, mastermind
  - Scout (5): pathfinder, keen, evasive, tracker, ghost
  - Technician (5): resourceful, durable, recycler, inventor, prodigy
  - Scientist (5): analytical, studious, xenobiologist, breakthrough, genius
  - Guardian (5): stalwart, rallying, shield, last, fortress
  - Scavenger (5): lucky, salvage, hoarder, treasure, goldnose
- **Efficient ability confirmed working**: +15% production to both survivor tasks (tick.js line 13) and system production (line 46)

## [0.8.6] - 2025-10-30
### Added
- **Resource Consumption Display**: Base panel now shows consumption rates under production rates in grayish-red text
  - Displays oxygen, food, and energy consumption per second
  - Helps players understand net resource flow at a glance
  - Updates dynamically with survivor count and system states
- **Class Base Bonuses Implemented**: All 8 classes now have their advertised base bonuses active
  - **Soldier**: +10% hit chance, +15% crit chance, +15% combat damage, +5 max HP
  - **Medic**: +30% medkit healing (10 HP → 13 HP base)
  - **Engineer**: Production bonuses work (verified in previous fix)
  - **Scout**: +15% base dodge chance (stacks with abilities to reach 20-35% range)
  - **Technician**: Crafting bonuses work (verified in audit)
  - **Scientist**: +15% XP gain (multiplicative with XP abilities for 15-25% total)
  - **Guardian**: +3 base defense (stacks with abilities to reach 3-11 defense range)
  - **Scavenger**: Scrap and loot bonuses work (verified in audit)

### Changed
- **Production Balance**: Increased base oxygen and food production for better early-game progression
  - Oxygen: 0.9 → 1.1 base, 0.05 → 0.06 per skill
  - Food: 0.7 → 0.9 base, 0.03 → 0.04 per skill
  - Makes early game slightly more forgiving while maintaining challenge
- **Scientist Class Rebalance**: Removed automatic tech generation from base class
  - Base class now provides +15% XP gain (previously had tech multiplier)
  - Tech generation now exclusive to Analytical and Genius abilities
  - Keeps Scientists valuable for leveling while making tech generation more specialized
  - Analysis bonus (1.2x) remains for future alien analysis features

### Fixed
- **Engineer Overclock Ability**: Now correctly applies +30% bonus to system production (filters, generators)
  - Previously only affected survivor-task production
  - System production bonuses now properly stack (Efficient, Overclock, Mastermind)
  - All Engineer abilities verified working correctly

### Technical
- Added `state.consumption` object tracking oxygen, food, and energy consumption rates
- Modified `applyTick()` to calculate and store consumption for UI display
- Added snapshot tracking for consumption in `updateUI()` to prevent unnecessary re-renders
- Added `.stat-consume` CSS class for consumption text styling (grayish-red: #d47a7a)
- Refactored system production to apply Engineer ability bonuses correctly
- Comprehensive audit of all 40 abilities across 8 classes - all verified functional
- VERSION bumped to 0.8.6

## [0.8.5] - 2025-10-30
### Fixed
- **Focus Loss Bug**: Fixed critical bug where all panels (survivors, base systems, map) lost focus every second on live deployment
  - Root cause: `updateUI()` was unconditionally updating DOM every tick, even when values hadn't changed
  - Added snapshot tracking for resource panel (oxygen, food, energy, scrap, production rates)
  - Added snapshot tracking for systems panel (filters, generators, turrets, failures, repair buttons)
  - Added snapshot tracking for threat panel (threat level, base integrity, raid chance, cooldown, tech, ammo, journal, time played)
  - UI now only updates specific panels when their underlying data actually changes
  - Prevents DOM manipulation from interrupting user interactions with dropdowns, buttons, and inputs
  - Works correctly in both local and production environments

### Technical
- Added `lastRenderedResourceSnapshot`, `lastRenderedSystemSnapshot`, `lastRenderedThreatSnapshot` global variables
- Modified `updateUI()` to use JSON.stringify() snapshots for change detection on all panels
- Each panel section wrapped in conditional update blocks to minimize DOM manipulation
- Preserves existing snapshot optimizations for survivors, map, inventory, workbench, and dropdown menus
- VERSION bumped to 0.8.5

## [0.8.4] - 2025-10-30
### Added
- **Game Over on Total Party Wipe**: All survivors dying from any cause now triggers game over
  - Applies to starvation, asphyxiation, combat defeats, and any other death causes
  - Prevents impossible-to-recover scenarios

### Changed
- **Capitalized Inventory Item Names**: All items in inventory now display with capitalized names (e.g., "Medkit" instead of "medkit")
- **Scout Energy Cost Tooltips**: Map tile tooltips now show reduced energy costs when a Scout with Pathfinder ability is selected as explorer (-15% cost displayed in real-time)
- **Scaling Turret Costs**: Each additional turret now costs 10% more than the previous one
  - Base cost: 75 scrap / 40 energy
  - 2nd turret: 83 scrap / 44 energy
  - 3rd turret: 91 scrap / 48 energy
  - And so on... makes turret spam less viable in late game

### Technical
- Added game over check in `applyTick()` to detect when `state.survivors.length === 0`
- Updated `renderInventory()` to capitalize item display names
- Enhanced `renderMap()` to calculate explorer-specific energy costs with Pathfinder bonus
- Modified `buildTurret()` with 10% scaling factor per existing turret
- Updated UI to display scaled turret costs in real-time
- VERSION bumped to 0.8.4

## [0.8.3] - 2025-10-30
### Fixed
- **Combat UI Updates**: Fixed combat engagement UI not updating correctly after each action
  - Added `renderCombatUI()` calls after all player actions (shoot, aim, guard, medkit, revive)
  - Added UI updates after turret attacks and enemy turns
  - Combat now displays HP changes, status effects, and alien/survivor states in real-time
- **Combat Log Format**: Improved combat log structure for better readability
  - Added "=== ENGAGEMENT START ===" header for field encounters
  - Added "=== BASE DEFENSE ===" header for raids
  - Clear turn indicators with "— Turn X —" and "— Your Turn —" / "— Enemy Turn —" separators
  - Removed redundant per-survivor turn announcements
  - Combat log now displays newest messages at top (like notifications panel)
- **Field Exploration Combat**: Fixed multiple issues with solo explorer encounters
  - Only the selected explorer now participates in field combat (no other survivors involved)
  - Explorer death now automatically closes engagement window without requiring manual closure
  - Closing engagement window during field combat no longer auto-resolves with all survivors
  - Fixed "Combat abandoned" message appearing when explorer dies
  - Death message changed from "is down!" to "has died." for field exploration
  - Tile properly marked as not cleared when explorer is defeated
  - Fixed JavaScript error (`const` vs `let`) that prevented death detection from working

### Changed
- Close button behavior during field combat now simply abandons the encounter (no auto-resolve)
- Auto-resolve button during field combat now correctly uses only the explorer
- Only survivors actually participating in combat are removed on defeat
- Target selection in combat now filters out dead/downed survivors

### Technical
- Enhanced `endCombat()` to only remove survivors who were in the specific combat
- Added immediate death check in `enemyTurn()` to auto-close window on explorer death
- Updated `bindCombatUIEvents()` to distinguish between field and base combat contexts
- Fixed `targ` variable scope issue (changed from `const` to `let` for reassignment)
- Added pre-attack survivor check to prevent targeting dead survivors
- Combat log uses `unshift()` instead of `push()` for reverse chronological order

## [0.8.2] - 2025-10-30
### Changed
- Threat display in UI now shows the exact percentage instead of bucketed labels
- Raid chance display increased to two decimal places for better clarity

### Technical
- VERSION bumped to 0.8.2; cache-busting updated

## [0.8.1] - 2025-10-30
### Added
- Threat quartile notifications at 25%, 50%, 75%, and 100% (logs when crossing above/below)
- Unified alien spawn weighting by threat for both exploration encounters and raids

### Changed
- Rebalanced raid chance scaling for clearer early → mid → late progression
  - Base per-minute chance lowered to 0.25%
  - Per-tile and per-kill contributions tuned; max capped at 10%/min
- Alien type selection now scales more smoothly with threat (fewer high-tier enemies early)

### Fixed
- Workbench buttons no longer re-render every tick; costs only re-evaluate when technician bonuses change

### Technical
- Version bump with cache-busting for GitHub Pages (0.8.2)
- Helper `pickAlienTypeByThreat()` shared across raids and exploration

## [0.8.1] - 2025-10-30
### Added
- **Dynamic Workbench Costs**: Crafting recipes now display reduced costs when Technician abilities (Resourceful, Prodigy) are active
- Original costs shown with strikethrough when discounts apply

### Changed
- **Normalized Exploration Costs**: All tile types now cost uniform 15 energy to explore (prevents revealing room types via energy cost differences)
- Pathfinder ability (-15%) still applies for Scouts

### Fixed
- **System Failures Save/Load**: `systemFailures` now properly saved and loaded from save files
- **Downed State Persistence**: Survivor `downed` status now correctly saved across game sessions
- **Inventory Capacity Save**: `inventoryCapacity` now properly saved and restored
- **Reset Game**: Added missing state fields (`systemFailures`, `inventoryCapacity`, `alienKills`, `raidPressure`, `lastThreatNoticeAt`) to reset function

### Technical
- Save version: 1.10.1
- Added `renderWorkbench()` function for dynamic cost calculation
- Workbench buttons now rendered via JavaScript instead of static HTML
- Improved save/load robustness for all 0.8.0 features

## [0.8.0] - 2025-10-30
### Added - Advanced Survivor & Alien Systems
- **8 Survivor Classes** with unique roles and bonuses:
  - **Soldier**: Combat specialist (+15% combat damage, +5 max HP)
  - **Medic**: Healing specialist with Field Medic ability (revives downed allies to 25-50% HP)
  - **Engineer**: Systems expert (+20% production) with Inventor ability (30% chance to extract rare components for 2-4 tech)
  - **Scout**: Exploration specialist (-20% exploration cost, +15% dodge)
  - **Technician**: Crafting specialist (-15% crafting costs, +15% tech) with Failsafe ability (reduces system failures to 0.5%)
  - **Scientist**: Research specialist (+25% tech gain, +20% XP gain)
  - **Guardian**: Defense specialist (+20% defense) with Living Shield ability (50% chance to intercept damage for allies)
  - **Scavenger**: Resource specialist (+25% loot) with Keen Eye (+20% rarity) and Treasure Hunter (+40% rarity)

- **40+ Unique Survivor Abilities** (3-5 per class) with rarity tiers:
  - **Uncommon** (12-15% spawn chance): Minor bonuses and utility effects
  - **Rare** (6-8% spawn chance): Significant tactical advantages
  - **Very Rare** (3% spawn chance): Powerful game-changing abilities
  - Examples: Marksman (+10% hit), Veteran (+20% damage), Ghost (35% dodge), Field Medic (revival), Living Shield (damage intercept)

- **40+ Unique Alien Modifiers** (5 per alien type) with escalating power:
  - **Uncommon** (10-12% spawn chance): Small stat boosts
  - **Rare** (5-6% spawn chance): Tactical modifications including advanced phase abilities
  - **Very Rare** (2% spawn chance): Devastating combinations
  - Advanced Spectre modifiers: Ethereal (+10% phase), Void (60% phase with -2 HP drain), Wraith (+50% damage after phase), Blink Strike (counter-attack)
  - Queen modifiers: Hivemind (resurrects fallen drones at 50% HP once per combat)

- **Revival/Downed State System**:
  - Survivors at 0 HP become "downed" instead of dying immediately
  - Field Medics can revive downed allies during interactive combat (Revive button)
  - Auto-combat: Field Medics automatically attempt revival after combat rounds
  - Downed survivors removed from combat but can be saved

- **Inventory Capacity System**:
  - Base capacity: 20 items
  - Hoarder ability: +2 capacity per instance
  - UI displays current/max capacity with color coding (green/yellow/red)
  - Full inventory prevents looting

- **Loot Rarity System**:
  - Four quality tiers: Common, Uncommon, Rare, Very Rare
  - Quality bonuses: Better durability, enhanced stats
  - Keen Eye: +20% rarity chance (Scavenger uncommon)
  - Treasure Hunter: +40% rarity chance (Scavenger rare)
  - Color-coded loot messages

- **System Failure Events**:
  - Random system failures (1% base chance per system per tick)
  - Failures disable system production until repaired
  - Repair costs: 10-20 scrap, 5-10 energy
  - Failsafe ability: Reduces failure chance to 0.5% (Technician rare)
  - UI warnings and repair panel

- **Color-Coded Rarity System**:
  - Blue: Base class info and common abilities
  - Purple: Uncommon abilities/modifiers
  - Orange: Rare abilities/modifiers
  - Red: Very rare abilities/modifiers

### Changed
- **Random Class Assignment**: Every recruited survivor gets a random class (equal probability)
- **Probabilistic Abilities**: Survivors have chances to spawn with 0-5 special abilities based on rarity
- **Enhanced Combat**: All combat calculations now factor in survivor abilities and alien modifiers
  - Soldier abilities boost damage, accuracy, and critical hits
  - Scout abilities provide evasion and energy efficiency
  - Guardian abilities enhance defense with Living Shield interception
  - Medic abilities enable revival and healing
- **Production Bonuses**: Engineer abilities boost resource production (up to +30% with Overclock)
- **Crafting Bonuses**: 
  - Technician abilities reduce costs (-25% with Prodigy) and increase durability (+30%)
  - Engineer Inventor ability extracts rare components (weapon parts → tech)
- **Loot Bonuses**: Scavenger abilities provide extra loot rolls and improved quality (double rolls with Golden Nose)
- **XP Bonuses**: Scientist abilities increase experience gain (+25% with Genius)
- **Advanced Combat Mechanics**:
  - Living Shield: Guardian intercepts damage for allies (50% chance)
  - Blink Strike: Spectre counter-attacks after phasing
  - Wraith: +50% damage bonus after successful phase
  - Ethereal/Void: Enhanced phase chances with unique effects
  - Hivemind: Queen resurrects first dead drone at 50% HP

### UI Improvements
- Survivor cards display class name (blue) and abilities with color-coded rarity
- Combat overlay shows all survivor abilities and alien modifiers with tooltips
- Downed status displayed with ⚠️ indicator in combat
- Revive button appears for Field Medics when allies are downed
- Inventory capacity shown as (current/max) with color coding
- Dynamic panels expand to accommodate multiple modifiers per combatant
- Recruitment log shows assigned class and abilities
- System failure warnings and repair UI
- All ability/modifier effects visible during combat

### Balance
- Ability spawn rates tuned for exciting but not overwhelming variance
- Rare modifiers can stack on aliens for challenging elite encounters
- Multiple ability combinations create diverse survivor playstyles
- Class bonuses provide baseline identity, abilities add specialization
- Revival system provides risk/reward for high-difficulty encounters
- Inventory management encourages strategic equipment choices
- System failures create maintenance challenges

### Technical
- Save version bumped to 1.10.0 with migration for old saves
- SURVIVOR_CLASSES, SPECIAL_ABILITIES, and ALIEN_MODIFIERS in constants.js
- Helper functions: hasAbility(), hasModifier(), applyAbilityDamageModifiers(), applyModifierStatEffects()
- Downed state tracking: hp=0, downed=true
- Per-combat flags: _shieldUsed, _justPhased, _lifesaverUsed, _hivemindUsed
- CSS variables for rarity colors (--rarity-uncommon, --rarity-rare, --rarity-veryrare)
- Integrated abilities into combat.js, combatInteractive.js, exploration.js, crafting.js, and tick.js
- All 30+ abilities and 20+ modifiers fully functional in both combat modes

## [0.7.4] - 2025-10-30
### Added
- **Four New Alien Types:**
  - **Drone**: Weak but evasive scavenger (25% dodge chance)
  - **Spitter**: Ranged attacker with armor-piercing corrosive bile (ignores 50% armor)
  - **Ravager**: Heavily armored brute (takes 50% less damage from all attacks)
  - **Hive Queen**: Massive apex predator (attacks twice per turn)
- **Unique Alien Mechanics:**
  - **Ambush (Lurker)**: First strike deals +50% damage
  - **Dodge (Drone)**: 25% chance to evade attacks completely
  - **Pack Tactics (Stalker)**: +2 damage per living ally
  - **Armor Piercing (Spitter)**: Ignores 50% of defender armor
  - **Regeneration (Brood)**: Heals 2-4 HP per turn
  - **Armored Carapace (Ravager)**: Takes 50% reduced damage
  - **Phase Shift (Spectre)**: 40% chance to phase through attacks
  - **Multi-Strike (Queen)**: Attacks twice each turn
- **Expanded Name Pool**: Added 150+ new names across all categories
  - More cultural diversity (Russian, African, Arabic names)
  - Enhanced sci-fi names (mythological, military ranks, natural phenomena)
  - More technology-inspired names (programming terms, protocols)
  - More engineering names (tools, materials, job roles)

### Changed
- **Randomized Starter Survivors**: Initial two survivors now have randomly generated names (Elias and Marta added to name pool)
- **Rebalanced All Aliens**: Adjusted HP and attack ranges across all 8 types for better difficulty progression
- **Smart Raid Composition**: Raids now spawn aliens appropriate to threat level
  - Low threat (0-20): Drones and Lurkers
  - Mid threat (20-50): Stalkers and Spitters  
  - High threat (50-80): Broods and Ravagers
  - Very high threat (80+): Spectres and Queens
- **Retreat Penalties Updated**: Added retreat difficulty modifiers for all new alien types
- **Enhanced Combat Feedback**: Combat log now displays alien special abilities when triggered
- **Alien UI**: Interactive combat overlay shows each alien's special ability

### Fixed
- Starter survivors are now free (no longer charges scrap for initial two recruits)
- Reduced notification panel height by 50% for better UI layout and less scrolling

### Technical
- Extended ALIEN_TYPES with 4 new entries (8 total)
- Added special mechanics handling to both auto-resolve and interactive combat systems
- Updated spawn weights in threat.js for balanced raid progression
- All alien special abilities fully functional in both combat modes

## [0.7.3] - 2025-10-30
### Added
- **Turret Support in Raids:** Auto-turrets now actively participate in base defense during raids.
  - Turrets take automatic actions between the defenders' and enemies' turns (Aim/Shoot/Burst only).
  - Uses new turret balance constants: base damage, hit chance, and crit interactions.
- **Raid Chance Display:** Replaced legacy Boarding Risk with a new Raid Chance indicator.
  - Displayed as a per-minute probability and updated each tick.
  - Visible with one decimal place for small early-game values.

### Changed
- **Combat Rebalance (less punishing):**
  - Rifles: +8 damage (up from +6), Shotguns: +6–12 variable damage (up from +4–10).
  - Armor: Light +3, Heavy +6, Hazmat +3 (up from +2/+4/+2).
  - Base hit chance increased to 75%; crit chance to 12%; crit multiplier to 1.6x.
- **Threat & Raids:**
  - Raid chance now increases with exploration and alien kills in addition to threat.
  - Guards and turrets both reduce raid chance.
  - The displayed Raid Chance is per minute; the game converts it to a per-tick probability for rolls.
  - Raids are now infrequent but impactful: a randomized cooldown (15–20 minutes) between raids, and tougher raid groups at higher threat (more enemies, heavier types favored, slight stat scaling).
- **Map Visuals:**
  - Revisitable tiles (uncleared hazards/aliens) have a distinct color for clarity.

### Removed
- Removed Filter Module and Micro Generator as craftables and as loot; use system upgrades via the Systems panel instead.

### Fixed
- Interactive combat defeat message no longer incorrectly states "Retreat" when survivors die.
- Recreated and wired `js/game/threat.js` after accidental removal; evaluated each tick.

### Technical
- New constants: `RAID_CHANCE_REDUCTION_PER_GUARD`, `RAID_CHANCE_REDUCTION_PER_TURRET`,
  `RAID_CHANCE_PER_TILE`, `RAID_CHANCE_PER_ALIEN_KILL`, `TURRET_BASE_DAMAGE`, `TURRET_HIT_CHANCE`.
- State additions: `state.raidChance` (UI) and `state.alienKills` (scaling input).
- Save snapshot `_version` bumped to 1.9.1; includes `raidChance` and `alienKills`.


The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.7.2] - 2025-10-30
### Added
- **Retreat System:**
  - Added Retreat button to exploration combat (not available for raids)
  - Retreat chance based on: 50% base + 3% per skill + 2% per level
  - Different alien types affect retreat chance (Spectres easier, Broods harder)
  - Failed retreats cost a turn and trigger enemy attacks
  - Successful retreats preserve the encounter for later revisiting
- **Revisitable Content:**
  - Hazard rooms can now be revisited after obtaining a Hazmat Suit
  - Alien encounters can be retreated from and cleared later
  - Map shows explorable indicator for uncleared hazards/aliens

### Changed
- **UI Improvements:**
  - Loadout modal now displays equipped items side-by-side at top
  - Inventory weapons and armor moved below equipped items for better visibility
  - Clearer visual hierarchy in equipment management
- **Map Generation:**
  - Alien rooms no longer spawn in tiles directly adjacent to the base
  - Provides safer early exploration around starting position
- **Raid Balance:**
  - Raid chance now scales with exploration progress
  - Early game: 30% of normal raid chance
  - Increases proportionally as you explore more of the station
  - Fully explored: 100% raid chance (normal rates)
  - Makes early game more forgiving while maintaining late-game pressure

### Technical
- Added `RETREAT_BASE_CHANCE`, `RETREAT_SKILL_BONUS`, `RETREAT_LEVEL_BONUS`, and `RETREAT_ALIEN_PENALTY` to BALANCE constants
- Modified `initTiles()` to check for base adjacency before spawning aliens
- Updated `evaluateThreat()` to calculate exploration-scaled raid chance
- Added `playerRetreat()` function to combat system
- Updated `isExplorable()` to allow revisiting uncleared tiles
- Added `cleared` flag to tile state tracking

## [0.7.1] - 2025-10-30
### Changed - HARDCORE MODE
- **Guards Only Defense System:**
  - **BREAKING**: Only survivors assigned to Guard task defend during raids
  - All other survivors (workers, idle, on tasks) do not participate in base defense
  - Makes Guard task absolutely critical for survival
- **Permadeath on Raid Defeat:**
  - Failed raid defense now triggers immediate game over
  - No guards on duty = instant game over when raid occurs
  - Creates high-stakes strategic decision making
- **Game Over System:**
  - Added `triggerGameOver()` function with modal overlay
  - Shows game over screen with "Start New Game" or "Load Save" options
  - Base integrity reaching 0 also triggers game over

### Technical
- Updated `resolveRaid()` in `js/game/threat.js` to only use guards
- Modified `interactiveRaidCombat()` to accept guards parameter
- Updated `resolveSkirmish()` in `js/game/combat.js` to check for game over on raid defeat
- Added game over modal system in `js/main.js`
- Changed `loopHandle` to global scope for proper cleanup

### Balance Impact
- Guard assignment is now mandatory for long-term survival
- Players must balance production workers vs defensive guards
- Threat management becomes critically important
- Turrets remain valuable but guards are essential

## [0.7.0] - 2025-10-30
### Added
- **Interactive Combat System:**
  - Turn-based combat overlay for both exploration encounters and base raids
  - Player actions: Shoot, Aim (+20% hit chance next turn), Burst (2 shots with bonus damage), Guard (+2 defense), Use Medkit (heal 8-14 HP)
  - Auto-resolve fallback for players who prefer automated combat
  - Base raid combat involves all survivors not on expeditions
  - Combat log tracks all actions and events
  - Active survivor indicator shows whose turn it is
  - Hit chance, critical hits (10% chance, 1.5x damage), and equipment bonuses fully functional
  - Loot drops on alien kills; XP rewards on victory
  - Action tooltips show detailed stats and requirements
- **Loadout Management Modal:**
  - Equip/unequip weapons and armor for each survivor directly from inventory
  - Visual display of durability and current ammo count
  - One-click equipment swapping
  - Equipment automatically returns to inventory when replaced
- **Enhanced Raid System:**
  - Raids now spawn 1-4 aliens based on threat level
  - Victory rewards scrap and reduces threat
  - Defeat damages base integrity and may spawn alien nests

### Changed
- Exploration alien encounters now open the interactive overlay by default when an explorer is selected
- Survivor "Equip" button now opens the Loadout modal instead of auto-equipping
- Raid resolution now uses interactive combat with all available defenders
- Closing the combat overlay mid-fight auto-resolves the encounter
- Multi-survivor raids allow each defender to take their turn before enemies act

### Technical
- New module `js/game/combatInteractive.js` for interactive engagements:
  - `interactiveEncounterAtTile(idx)` for exploration combat
  - `interactiveRaidCombat(aliens)` for base defense
  - Turn system with `activePartyIdx` tracks current actor
  - Combat log with 12-entry rolling buffer
- Equipment management helpers added to `js/game/survivor.js`:
  - `equipItemToSurvivor(id, itemId)` and `unequipFromSurvivor(id, slot)`
- Loadout modal UI wiring added in `js/ui.js`:
  - `openLoadoutForSurvivor(id)`, `closeLoadoutModal()`, `renderLoadoutContent()`
- Updated `js/game/threat.js` `resolveRaid()` to generate aliens and trigger interactive combat
- Added `.inv-row` CSS class for inventory item styling in modals

## [0.6.8] - 2025-10-30
- **Major Balance Pass:** Comprehensive rebalancing for a more forgiving early game
  - Reduced resource consumption by 15-20% (Oxygen and Food)
  - Increased oxygen critical threshold from 6 to 8
  - Reduced asphyxiation damage and morale penalties by 20-25%
  - Lowered starvation chance from 8% to 6%
- **Better Exploration Rewards:**
  - Reduced energy costs for most tile types (alien, resource, module, survivor)
  - Increased all XP gains: Explore +60%, Loot +25%, Combat +20-25%
  - Reduced hazard room durability loss by 20%
- **Improved Expeditions:**
  - Success rate increased from 65% to 70%
  - Costs reduced (8 food/12 energy, down from 10/15)
  - Rewards boosted: Scrap +2 min/+5 max, Tech max +1
  - XP rewards increased by 20%
  - Equipment wear reduced by 20%
- **Gentler Threat Curve:**
  - Reduced base threat growth by 20%
  - Guards 25% more effective at reducing threat
  - Raids 20% less frequent and 10% weaker
  - Reduced casualty chance from 12% to 10%
  - Turrets 25% more powerful (12 → 15 power)
- **Stronger Production:**
  - Overall production multiplier increased from 1.15 to 1.20
  - System bonuses increased (Filter +8%, Generator +7%)
  - Survivor task production boosted 10-15% across all tasks
  - Level bonuses increased: Production 5% → 6%, Attack 0.5 → 0.6
  - Food yield improved from 60% to 65%
  - Energy drain reduced by ~15-17%
  - Idle survivors 67% more productive
- **Cheaper Economy:**
  - Recruit base cost reduced from 15 to 12 scrap
  - Repair cost reduced from 0.5 to 0.4 per durability point
  - All upgrade costs reduced by 10-15%
  - Ammo consumption reduced from 60% to 55%
- **UI Improvements:**
  - Base panel controls (Recruit/Expedition) now properly centered
  - Improved spacing and layout in base panel

### Removed
- **Deprecated Exploration Features:**
  - Removed random exploration function (exploreTiles)
  - Removed long-range scan function
  - Removed 'E' keyboard shortcut for random exploration
  - Removed associated constants: EXPLORE_RANDOM_COST, SCAN_COST, SCAN_REVEAL_RANGE
  - Game now uses click-to-explore exclusively for more intentional gameplay

### Technical
- Centralized all balance values into BALANCE constants for easier tuning
- Save snapshot version updated to 1.9.0
- Removed unused exploration code from game/exploration.js and map.js

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