# Changelog
All notable changes to the Derelict Station project will be documented in this file.

## [0.9.12] - 2025-11-02
### Changed
- **Generator Repair Cost**: Changed the repair cost for a failed generator to 50 scrap and 0 energy (previously 30 scrap and 20 energy). This resolves a potential softlock where players could not generate energy to repair the generator.
- **Oxygen as a Percentage**: The Oxygen resource is now represented as a percentage (0-100%) instead of an open-ended number. All UI elements have been updated to reflect this change.

## [0.9.11] - 2025-11-02
### Added
- **Map Reset Feature (Temporary)**: Added a "New Map" button that appears once the entire map has been explored. This allows players to generate a new map layout and continue exploring. This feature is a temporary addition, as the exploration system is slated for a major overhaul in version 1.0.

### Changed
- **Durability System**: Items no longer break and get destroyed at 0 durability. Instead, they become ineffective, providing no bonuses until repaired.
- **Hive Queen Balance**:
  - Reduced the Hive Queen's base attack damage.
  - Fixed a bug with the "Empress" modifier that caused it to grant a much larger damage bonus than intended.
- **Hazmat Suit Recipe**: Removed the electronics requirement and increased the scrap cost.

### Fixed
- **Combat**: Fixed a bug where several alien special abilities and modifiers were not functioning correctly in auto-resolve combat.
- **UI**: Corrected the rarity display for "Spectre" and "Hive Queen" aliens to ensure they appear with the correct legendary color in logs.
- **Combat**: Fixed a bug that could cause turret attacks to result in `NaN` damage.
- **Combat**: Removed the unintended bonus damage from burst attacks.

## [0.9.10] - 2025-11-02
### Added
- **Threat Mechanics**:
  - Threat now increases by `0.1` for each new tile explored.
  - Threat now increases by `0.25` for each alien killed.

### Changed
- **Loot Balance**: Increased the drop rates of uncommon and rare crafting materials to make them more accessible.

## [0.9.9] - 2025-11-02
### Changed
- **Combat Log**:
  - Increased the height and reduced the width of the combat log for better readability.
  - Removed the 20-entry limit, allowing the log to scroll through the entire engagement.
  - Implemented color-coding for survivor and alien names to match the main notification log.
  - Added a custom-styled scrollbar to match the rest of the UI.
  - Centered the text within the log entries.

## [0.9.8] - 2025-11-02
### Changed
- **Threat Growth**: Tripled the minimum threat growth rate to ensure a constant sense of pressure, even with strong defenses.

### Fixed
- **UI**: The "Aliens Killed" counter in the Threats & Base panel now correctly displays the total number of kills.
- **Combat**: Fixed a critical bug where splash damage from weapons like the Grenade Launcher would not trigger in interactive combat if the initial attack killed the primary target.
- **Exploration**: Fixed a bug that prevented survivors with a Hazmat Suit from exploring Hazard Rooms.


## [0.9.7] - 2025-11-02
### Fixed
- **UI**: Corrected the display of "WeaponPart" in crafting recipes to show as "Weapon Part" with a space.

## [0.9.6] - 2025-11-02
### Fixed
- **Performance**: Replaced the offline progress simulation loop with a single, efficient calculation. This dramatically improves the initial load time of the game after a long period of inactivity, preventing the browser from freezing.

## [0.9.5] - 2025-11-02
### Changed
- **Morale System**:
  - Passive morale recovery from being idle or having healthy resources is now capped at 60.
  - The rates for natural and rest-based morale recovery have been reduced by 50%.
  - Morale loss for retreat increased from 3 to 5.

### Fixed
  - Survivor deaths in expeditions and interactive combat now correctly apply a morale penalty to all other living survivors.
  - Morale changes during combat are now reflected dynamically in the UI tooltips.
## [0.9.4] - 2025-11-02
### Changed
- **Combat UI**:
  - The combat UI now automatically selects a new target if the current one is defeated.
  - Burst attacks now log each shot individually, and the overkill damage is displayed.
  - The bonus damage has been removed from ranged burst attacks, making the number of shots the sole advantage.
  - The tooltip for the ranged "Burst" action has been updated to reflect that it fires multiple shots without bonus damage.
- **Melee Power Attack**:
  - The melee "Power Attack" now correctly functions as a single, powerful strike with bonus damage.
  - The combat log message for the Power Attack has been updated to be more descriptive.
  - The bonus damage for the Power Attack has been changed from a random 3-6 to a flat 5.
- **Ravager Balance**:
  - The Ravager's "Armored" special damage reduction has been nerfed to 30%.
  - The "Hardened" modifier's damage reduction has been nerfed to 20%.
  - The "Colossus" modifier's resistance has been nerfed from 70% to 40%.
  - The Ravager's base armor remains at 6.
- **Consumable Tooltips**:
  - The inventory tooltips for all consumables, including the Combat Drug and Stimpack, have been updated to be more descriptive of their in-combat effects.

### Fixed
- **Morale System**:
  - Survivor deaths in expeditions and interactive combat now correctly apply a morale penalty to all other living survivors.
  - Morale changes during combat are now reflected dynamically in the UI tooltips.
  - Fixed an issue where the Guardian's "Rallying Cry" ability was not providing its passive morale boost.
  - Corrected the implementation of natural and rest-based morale recovery.
  - Removed a redundant morale penalty for losing a raid, as this is a game-over state.
- **Resistance Calculation**: Fixed a critical bug where resistance calculations were duplicated and incorrect. The logic is now consolidated in a single function, and resistances from different sources stack correctly.
- **Consumable Tooltips**: Fixed a bug where inventory tooltips for consumables were not displaying their detailed descriptions.
- **Base Repair**: Fixed a rounding error that could prevent base integrity from reaching 100%.
- **UI Warning**: The critical warning flash on the base panel now correctly deactivates after repairs and is only tied to base integrity.
- **Repair Button Bug**: Fixed a bug where the repair button on an inventory item would incorrectly trigger the recycle prompt.
- **Redeclaration Error**: Fixed a "Cannot redeclare block-scoped variable" error in the combat UI code.

### Added
- **Repair Modal**: Added a new "Repair Equipment" button and modal to centralize item repairs.
  - The modal lists all damaged items from both the inventory and equipped by survivors.
  - It displays the repair cost for each item, including discounts from survivor abilities.
  - Includes a "Repair All" button for convenience.

### Changed
- **Tiered Morale Penalty**: Morale loss from low base integrity is now tiered, making it less punishing for minor damage.
- **Partial Base Repair**: The "Repair Base" button now uses available resources to repair as much integrity as possible.
- **UI Text**: The "Repair Base" button now displays the full words "scrap" and "energy" for clarity.
- **Repair Costs**: Increased the base cost to repair base integrity.

## [0.9.3] - 2025-11-01
### Changed
- **Threat Rebalance**: Slightly reduced the base and random threat growth rates for a slower overall progression.
- **Performance**: Added `defer` attribute to all scripts to improve initial page load time.

### Fixed
- **Berserker Ability**: The Soldier's Berserker ability now correctly updates the UI to show the damage bonus when active.
- **Game Over Screen**: Fixed a visual bug where hovering over buttons on the game over screen could cause rendering issues with the backdrop filter.
- **Duplicate Notifications**: Removed a redundant threat milestone notification.

## [0.9.2] - 2025-11-01
### Added
- **Electron Build**: The project can now be built as a standalone desktop application for Windows.
- Added `electron.js`, `preload.js`, and `package.json` to support the Electron build.
- The application now starts in a maximized, windowed mode with the menu bar removed.

### Fixed
- **Game Over Screen**: Fixed a visual bug where hovering over buttons on the game over screen could cause rendering issues with the backdrop filter.
- **Berserker Ability**: The Soldier's Berserker ability now correctly updates the UI to show the damage bonus when active.

## [0.9.1] - 2025-11-01
### Added
- **Stun Grenade Recipe**: Added a craftable Stun Grenade to the workbench under consumables.

### Changed
- **Workbench Order**: Reordered consumables on the workbench to Ammo, Medkit, Stun Grenade.

### Fixed
- **Debug Panel**: Fixed a reference error for the "Level Up All Survivors" button.

## [0.9.0] - 2025-11-01
### Added - Base Integrity & Morale Systems

**NEW: Base Integrity Management**
- **Integrity Tiers**: 5 color-coded tiers from Pristine (100-80%) to Collapsing (1-19%)
- **Production Penalties**: 0% → 5% → 10% → 20% → 30% based on integrity tier
- **Damage Sources**:
  - Failed systems: 0.05 integrity/tick per failure
  - High threat (>75%): 0.02 integrity/tick constant pressure
- **Manual Repair System**:
  - New "Repair Base" button in Threats & Base panel
  - Cost scales with missing integrity (50 scrap + 30 energy base × missing%)
  - Engineer class bonuses reduce repair costs up to 50%
  - Grants +15 morale on completion
- **Engineer Passive Repair**: Idle Engineers repair +0.1 integrity/tick each
- **Visual Feedback**:
  - Color-coded integrity bar (green → yellow → orange → red)
  - Shows tier name and percentage: "Minor Damage (65%)"
  - Warning flash animation when integrity < 20%
- **Files Modified**: `constants.js`, `utils.js`, `tick.js`, `crafting.js`, `ui.js`, `index.html`, `styles.css`, `main.js`

**NEW: Morale System**
- **Morale Tiers**: 5 tiers from High Morale (80-100) to Breaking Point (0-19)
- **Performance Modifiers**:
  - Production: -30% to +30% based on morale tier
  - Combat Damage: -15% to +15% based on morale tier
  - XP Gain: 0% to +10% at high morale
- **Morale Gains**:
  - Alien kill: +2 morale
### Overview
This release completes a major systems and balance pass with focus on meaningful late-game escalation, predictable encounter mechanics, and a large combat/defensive polish. It also fixes a number of critical bugs (modifier application, combat tooltips, consumable usage) and removes the old flat "skill" progression that caused runaway damage scaling.

  ### Endgame Escalation (new)
  - Threat locks at 100% and an Escalation level begins increasing over time. Escalation affects all encounters (raids and exploration).
  - Escalation growth:
    - +1 level every 5 minutes while threat is locked at 100%.
    - +1 level per raid survived while at 100% threat.
  - Escalation bonuses (per level):
    - HP: +8% (multiplicative)
    - Attack: +6%
    - Armor: +1 per 2 escalation levels
    - Modifier frequency: +10% chance per level (more special modifiers appear later)
    - Raid cooldown: -30s per level (min cooldown 5 minutes)

  ### Threat & Raid Rebalance
  - Threat growth tuned for longer runs and smoother pacing:
    - Base growth adjusted (slower early) and a small minimum growth floor remains so threat always slowly rises.
    - Example tuning: base growth values reduced (configurable in `BALANCE`).
  - Raid chance and composition:
    - Raid base chance reduced and floors adjusted so raids scale more predictably with exploration and kills.
    - Raid size: typical raids now 2–5 aliens (capped to avoid exponential spam).
    - Alien HP scaling: up to ~1.5x at 100% threat; Attack scaling up to ~1.4x.

  ### Alien Spawning Philosophy
  - Weak enemies (Drones/Lurkers) never fully disappear — they persist into late game as modifier carriers so late-game encounters retain variety.
  - Spawn weights are retuned by threat tiers so the encounter mix shifts smoothly rather than abruptly.

  ### Combat & Damage System — critical changes
  - Skill system removed:
    - Old flat-skill stat was removed because it caused exponential flat damage growth.
    - New damage formula: FinalDamage = WeaponBase × (1 + LevelBonus + ClassBonus)
    - LevelBonus = (level - 1) × 0.02 (Level 1 = 0%, Level 12 ≈ +22%).
    - Class bonuses remain percentage-based and stack additively with level.
  - Combat tooltip overhaul:
    - Tooltips now display: Base Weapon → Level & Class bonuses → Final damage (clear breakdown).

  ### Weapon / Armor / Status-effect polish
  - Weapon effects implemented with clear behaviors and visible UI badges:
    - Stun: disables target for exactly one enemy turn (implemented via _stunned / _stunnedLastTurn flags).
    - Burn / Poison: queued DOT stacks; each stack lasts fixed turns and resolves at enemy turns.
    - Splash / Chain / Pierce / Phase: affect multiple targets or bypass armor per definitions.
  - Armor effects implemented and applied during defense calculations:
    - Dodge, Reflect, Regen, Phase Dodge, Energy Shields and Immunities are parsed from armor objects and used in combat math.

  ### Consumables (combat-usable)
  - All combat consumables can be used in interactive combat and have clear effects and durations:
    - Medkit / Advanced Medkit: heals & (advanced) cure/remove status.
    - Stim Pack / Combat Drug: temporary damage/accuracy buffs with turn durations.
    - Stun Grenade / Frag / EMP: utility grenades that stun, splashedamage, or disable mechanical enemies respectively.
    - Repair / Nano-Repair: durability and system repair utilities (repair kits auto-apply to system repairs).
    - Stealth Field / Smoke: temporary dodge/stealth effects.

  ### Major bug fixes
  - Alien modifier application corrected: `applyModifiersToAlienStats()` centralizes modifier effects at spawn (fixed HP & stat bonuses for 7+ modifiers and corrected hpMult/hpBonus behavior).
  - Combat status persistence: status effects now persist the intended duration across turns in both auto-resolve and interactive combat modes.
  - Splash/phase/pierce logic: damage calculations correctly bypass or apply armor and affect valid targets.

  ### Persistence & encounter behavior
  - Retreat & revisits:
    - Retreating from a tile now preserves the current alien set and their state; revisiting heals surviving enemies to full but does not respawn new random enemies.
    - Tiles are marked cleared only when all aliens are killed.

  ### UX / QoL
  - Unique names: `getRandomName()` prevents duplicate survivor names within a save.
  - Workbench & recycling: rarity color coding, detailed recycle breakdowns, and component refunds added.
  - Smart dropdown positioning added to avoid clipping inside scrollable panels.

  ### Files changed (high level)
  - Significant updates: `js/game/threat.js`, `js/game/combat.js`, `js/game/combatInteractive.js`, `js/game/exploration.js`, `js/game/survivor.js`, `js/ui.js`, `js/constants.js`, `js/game/crafting.js`, `js/game/recycling.js`, `js/game/tick.js`.

  ### Migration notes
  - Save compatibility: legacy save fields (including old `skill`) are accepted and migrated; `skill` is ignored for damage calculations.

  ### Debug & testing helpers
  - Debug functions added: lock threat, raise escalation, spawn items/aliens — useful to test escalation, raid composition, and balance.

  ---

### Balance - Junk Salvage
**Individual Scrap Rolls for Junk**
- **Change**: Each piece of junk now rolls 2-4 scrap individually instead of one roll for the batch
- **Example**: 5 junk previously = 1 roll (2-4) × 5 = 10-20 scrap total
- **Now**: 5 junk = 5 rolls (2-4 each) = more consistent 10-20 scrap with better average
- **Impact**: More consistent and slightly improved scrap returns from salvaging

### Polish - Recycling Notifications
**Improved Recycle Log Messages**
- **Colored Item Names**: Recycled items now show with rarity colors (gray/purple/orange/red)
- **Resource Breakdown**: Shows all resources received from recycling
- **Example**: "♻️ Recycled <span style="color:purple">Plasma Rifle</span> → +28 Scrap, +3 Tech, +2 Weapon Part"
- **Impact**: Clear feedback on what you got from recycling

#### New Crafting Components System (8 Types)
- **Weapon Parts**: Used in all weapon crafting recipes
- **Armor Plating**: Used in all armor crafting recipes  
- **Electronics**: Used in advanced tech items
- **Chemical Compounds**: Used in consumables and explosives
- **Energy Cells**: Used in energy weapons and systems
- **Nano-Fibers**: Used in advanced armor and equipment
- **Alien Tissue**: Rare component from alien encounters
- **Xeno-Crystals**: Very rare component for legendary items
- All components found as loot with varying rarity
- Components consumed during crafting (no longer just resource costs)
- Engineer "Inventor" ability (30% chance) consumes Weapon Parts to grant 2-4 bonus Tech

#### New Weapons (40+ Total)
**Tier 1 - Melee Weapons:**
- **Combat Knife**: 3-5 damage, fast attacks, 100 durability
- **Stun Baton**: 2-4 damage, 30% stun chance, 80 durability
- **Reinforced Bat**: 4-6 damage, 20% stun chance, 120 durability

**Tier 2 - Basic Firearms:**
- **Laser Pistol**: 4-7 damage, energy weapon, 90 durability
- **Heavy Pistol**: 5-8 damage, high accuracy, 100 durability
- **Assault Rifle**: 6-9 damage, burst fire, 110 durability
- **Scoped Rifle**: 7-10 damage, +15% accuracy, 100 durability
- **Pump Shotgun**: 6-12 variable damage, 100 durability

**Tier 3 - Advanced Weapons:**
- **Plasma Blade**: 8-12 damage, burn effect (2-4 DOT), 130 durability
- **Shock Maul**: 6-10 damage, 40% stun, chain lightning, 110 durability
- **Plasma Pistol**: 6-10 damage, burn effect, 100 durability
- **Smart Pistol**: 5-9 damage, +20% accuracy, auto-targeting, 95 durability
- **Pulse Rifle**: 8-14 damage, energy weapon, 120 durability (original)
- **Plasma Rifle**: 10-16 damage, burn + splash damage, 115 durability
- **Combat Shotgun**: 8-14 variable damage, close range bonus, 110 durability
- **Plasma Shotgun**: 9-15 variable damage, burn effect, 105 durability
- **Light Machine Gun**: 7-11 damage, sustained fire bonus, 130 durability
- **Grenade Launcher**: 12-20 damage, 3-tile splash radius, 80 durability

**Tier 4 - Legendary Weapons:**
- **Nano-Edge Katana**: 12-18 damage, phase through armor, bleed effect, 140 durability
- **Void Pistol**: 8-14 damage, dimensional damage (ignores armor), 90 durability
- **Gauss Rifle**: 14-22 damage, railgun physics, armor piercing, 110 durability
- **Quantum Rifle**: 16-24 damage, quantum tunneling shots, 105 durability
- **Disintegrator Cannon**: 18-28 damage, molecular disruption, 95 durability
- **Minigun**: 10-16 damage, massive rate of fire, suppression, 150 durability
- **Railgun**: 20-32 damage, electromagnetic acceleration, penetration, 100 durability

#### New Armor (15+ Types)
**Tier 1 - Basic Protection:**
- **Light Armor**: 3 defense, 100 durability (original)
- **Tactical Vest**: 4 defense, +5% dodge, 90 durability
- **Reinforced Plating**: 5 defense, -5% movement, 110 durability

**Tier 2 - Advanced Armor:**
- **Heavy Armor**: 6 defense, 150 durability (original)
- **Composite Armor**: 7 defense, balanced stats, 130 durability
- **Stealth Suit**: 3 defense, +25% dodge, cloaking, 100 durability
- **Power Armor Frame**: 8 defense, strength boost, 140 durability
- **Thermal Suit**: 5 defense, environmental protection, 120 durability

**Tier 3 - Elite Armor:**
- **Nano-Weave Armor**: 9 defense, 3 HP regen/turn, adaptive, 135 durability
- **Titan Armor**: 10 defense, -10% speed, massive protection, 160 durability
- **Shield Suit**: 6 defense, 25% damage reflection, energy shield, 115 durability
- **Void Suit**: 7 defense, phase dodge (15% chance), 110 durability
- **Regenerative Armor**: 8 defense, 5 HP regen/turn, self-repair, 125 durability

**Special:**
- **Hazmat Suit**: 3 defense, hazard immunity, 150 durability (original)

#### Weapon Effects (8 Fully Functional Types)
- **Stun**: 20-40% chance to disable enemy for 1 turn
- **Burn**: 2-6 damage over time for 2-3 turns
- **Splash**: Damages 2-3 nearby enemies for 30-50% damage
- **Phase**: Ignores 40-60% of enemy armor
- **Bleed**: 3-5 damage per turn, stackable
- **Chain**: Arcs to 1-2 additional targets for 40% damage
- **Pierce**: Penetrates armor, hits multiple enemies in line
- **Molecular Disruption**: Chance to instantly destroy target

#### Armor Effects (8 Fully Functional Types)
- **Dodge Bonus**: +10-25% evasion chance
- **Damage Reflection**: 15-30% damage returned to attacker
- **HP Regeneration**: 2-5 HP restored per turn
- **Phase Dodge**: 10-20% chance to phase through attacks
- **Energy Shield**: Absorbs X damage before breaking
- **Adaptive Defense**: Defense increases each turn in combat
- **Cloaking**: First attack bonus, harder to target
- **Environmental Immunity**: Negates hazard damage

#### New Consumables (10 Types)
- **Medkit**: Heals 10 HP, original consumable
- **Advanced Medkit**: Heals 20 HP, cures status effects, 25 scrap
- **Stim Pack**: +3 damage, +10% accuracy for 3 turns, 20 scrap
- **Shield Generator**: Temporary +5 defense for 2 turns, 30 scrap
- **EMP Grenade**: 10-15 damage, disables mechanical enemies, 25 scrap
- **Repair Kit**: Instantly repairs failed systems for free (auto-use), 40 scrap
- **Nano-Repair**: Restores 50 durability to equipped item, 35 scrap
- **Energy Cell**: Restores energy-based weapon charges, 15 scrap
- **Smoke Grenade**: +30% dodge for all allies for 2 turns, 20 scrap
- **Frag Grenade**: 15-25 splash damage, 3-tile radius, 30 scrap
- **Ammo**: Restores ranged weapon ammunition, 10 scrap (original)

#### Interactive Combat System Overhaul
**Adaptive Combat UI:**
- Combat interface now dynamically changes based on equipped weapon type
- **Melee Weapons**: Shows "Strike", "Power Strike", "Guard" actions
- **Ranged Weapons**: Shows "Shoot", "Aim", "Burst Fire" actions
- **Unarmed**: Shows "Punch", "Dodge", "Guard" actions
- Action buttons update in real-time when equipment changes mid-combat

**New Combat Actions:**
- **Power Strike**: Melee attack with +50% damage, costs extra stamina
- **Burst Fire**: Fire 2-3 shots in quick succession with accuracy penalty
- **Precise Shot**: Ranged attack with +25% accuracy, +15% crit chance
- **Overwatch**: Skip turn to attack next enemy that moves
- **Tactical Retreat**: Attempt to retreat with better odds than base retreat

**Combat Status Effects:**
- Stunned enemies skip their turn (visual indicator)
- Burning enemies take DOT each turn (fire animation)
- Bleeding enemies take escalating damage
- Phased attacks show "PHASE" indicator when armor is bypassed
- Shield absorption shows remaining shield HP
- Dodge shows "EVADED" on successful evasion

**Enhanced Combat Log:**
- Real-time damage numbers with color coding (white=normal, yellow=crit, red=death)
- Status effect application messages ("Enemy is BURNING!", "Ally is STUNNED!")
- Detailed hit/miss information with percentage chances shown
- Weapon effect triggers logged ("Plasma Rifle BURNS for 4 damage!")
- Equipment durability warnings when items break
- Ammo consumption tracking per shot

#### Inventory Management System
**Recycling System:**
- Click any crafted item to recycle it for 50% refund (rounded up with Math.ceil)
- Comprehensive component refunds:
  - Weapon Parts, Armor Plating, Electronics refunded correctly
  - Chemical Compounds, Energy Cells, Nano-Fibers refunded
  - Alien Tissue and Xeno-Crystals refunded for legendary items
- Themed confirmation popup appears at cursor position
  - Shows exact resources you'll receive before confirming
  - Solid background, stays fixed during page scrolling
  - "Recycle" and "Cancel" buttons for safety
- Non-craftable items get default scrap value (5 scrap)
- **Junk items cannot be recycled** (use Salvage button instead)

**Repair Kit Auto-System:**
- Repair Kits automatically enable free system repairs
- Repair buttons dynamically update text: "Repair Filter (Free with Repair Kit)"
- Using repair consumes one Repair Kit automatically instead of resources
- Inventory display shows: "✓ Auto-used on system repairs" 
- No manual "Use on System" button needed - seamless integration
- Works for all system types: Filter, Generator, Turret failures

**Inventory Capacity:**
- Base capacity remains 20 items
- Hoarder ability adds +2 capacity per instance (stacks)
- Color-coded capacity display: Green (< 80%), Yellow (80-99%), Red (100%)
- Full inventory prevents looting during exploration

**Junk System Rework:**
- All found junk now takes inventory slots (like starter junk)
- Junk appears as inventory items: "Junk (1/3)" format
- Must use "Salvage" button to convert junk to scrap
- Can no longer discard individual items (removed Discard button)
- Salvage converts all junk at once with Scavenger bonuses applied

#### Workbench Expansion (47+ Craftable Items)
**8 Item Categories:**
1. **Melee Weapons** (Combat Knife, Stun Baton, Reinforced Bat, Plasma Blade, Shock Maul, Nano-Edge Katana)
2. **Ranged Weapons** (All pistols, rifles, shotguns, heavy weapons, legendary firearms)
3. **Light Armor** (Light Armor, Tactical Vest, Stealth Suit, Hazmat Suit)
4. **Heavy Armor** (Heavy Armor, Power Armor, Titan Armor, Nano-Weave, Void Suit)
5. **Consumables - Healing** (Medkit, Advanced Medkit, Nano-Repair)
6. **Consumables - Combat** (Stim Pack, EMP Grenade, Frag Grenade, Smoke Grenade)
7. **Consumables - Utility** (Repair Kit, Energy Cell, Ammo)
8. **Systems** (Filter, Generator, Turret - crafting removed, use Systems panel)

**Workbench UI Features:**
- All items show rarity color coding (Common=Gray, Uncommon=Purple, Rare=Orange, Legendary=Red)
- Grouped by category with visual separators
- Hover tooltips show full stats, effects, and requirements
- Dynamic cost display with Technician discounts shown with strikethrough
- Component requirements clearly listed
- Scrollable interface handles 47+ items without layout breaking

#### Debug Menu Expansion
**New Debug Categories:**
- **Spawn Components**: Add any crafting component (Weapon Parts, Electronics, etc.)
- **Spawn Tier 1 Weapons**: All basic melee and firearms
- **Spawn Tier 2 Weapons**: Advanced weapons with effects
- **Spawn Tier 3 Weapons**: Legendary weapons
- **Spawn Armor Sets**: All armor types from Light to Legendary
- **Spawn All Consumables**: All 10 consumable types
- **Spawn Legendary Gear**: Quick access to best equipment
- One-click buttons for testing any item combination

#### Smart Dropdown System
- New `dropdownPosition.js` module for intelligent dropdown placement
- Dropdowns automatically reposition when near bottom of scrollable containers
- Uses MutationObserver for real-time position updates
- Prevents clipping in Workbench, Survivor List, and other scrollable areas
- Smooth animations for dropdown appearance (above or below)

### Changed - Major Balance Overhaul

#### Combat System Rebalance
**Damage Calculation Rework:**
- **REMOVED**: Base survivor attack damage (no more flat damage values)
- **NEW**: Damage determined entirely by equipped weapon stats
- **Unarmed Combat**: New `UNARMED_DAMAGE` range (2-4 base damage)
- Skill bonus: +0.5 damage per skill point (unchanged)
- **Level bonus**: +2% damage multiplier per level (applied to total damage)
- **New accuracy bonus**: +1% hit chance per level (rewards leveling with reliability)

**Equipment Balance:**
- Rifles: +8 damage (up from +6)
- Shotguns: +6-12 variable damage (up from +4-10)
- Light Armor: +3 defense (up from +2)
- Heavy Armor: +6 defense (up from +4)
- Hazmat Suit: +3 defense (up from +2)

**Hit Chance System:**
- Base hit chance: 75% (unchanged)
- Base crit chance: 12% (up from 10%)
- Crit multiplier: 1.6x (up from 1.5x)
- Accuracy bonuses now more impactful (+25% from Aim action)

#### Loot Table Rebalance
**Target Distributions Achieved:**
- Common items: ~48% drop rate (gray items, basic gear)
- Uncommon items: ~31% drop rate (purple items, solid upgrades)
- Rare items: ~15% drop rate (orange items, powerful gear)
- Legendary items: ~6% drop rate (red items, game-changing equipment)

**Loot Weights Adjusted:**
- Reduced common junk spawn rate by 15%
- Increased component drop rates by 25%
- Legendary items now have minimum threat requirement (70%+ threat)
- Scavenger abilities (Keen Eye, Treasure Hunter) shift entire distribution upward

#### Enemy Scaling & Threat System
**Threat-Based Enemy Spawning:**
- **0-20% Threat**: Only Drones and Lurkers spawn
- **20-40% Threat**: Stalkers and Spitters added to pool
- **40-60% Threat**: Broods and Ravagers start appearing
- **60-80% Threat**: Spectres become possible (rare)
- **Comprehensive Balance Pass**:
  - **Loot Table Rebalanced**: Adjusted weights for all loot tiers to match target distribution (Common ~48%, Uncommon ~31%, Rare ~15%, Legendary ~6%).
  - **Combat Damage Rework**: Removed base attack damage. Damage is now determined purely by the equipped weapon or a new `UNARMED_DAMAGE` range. Skill and level bonuses are now added to this value.
  - **Leveling Progression**: Reduced damage bonus from levels (`+0.3` from `+0.5`) and added a new accuracy bonus (`+1%` per level) to shift focus from raw damage to reliability.
- **Above 85% Threat**: Multiple Queens possible in single raid

**Enemy Stat Scaling:**
- HP scaling reduced by 20% at high threat levels
- Attack scaling reduced by 15% to prevent one-shot deaths
- Elite modifiers less likely to stack at low threat
- Smoother difficulty curve from early to late game

**Threat Growth Adjustments:**
- Base threat growth: 0.055 → 0.035 (-36% reduction)
- Guard effectiveness: 0.25% → 0.33% per guard (+33% stronger)
- Turret effectiveness: 0.20% → 0.25% per turret (+25% stronger)
- Players have more time to build defenses before major threats

#### Expedition System Changes
- **Failure Penalty**: Raid pressure increase reduced from +1.5% to +0.5%
- Failed expeditions less punishing to encourage risk-taking
- Equipment wear rates reduced by 10%
- Success rewards increased slightly (scrap +2-5, tech +1)

#### Resource & Production Tuning
- Energy consumption per survivor: 0.18/s (unchanged)
- Food consumption per survivor: 0.2/s (unchanged)
- System production values remain balanced from 0.8.13
- Idle survivor production buffed by 10%

#### UI & Performance Improvements
**Panel Rendering Optimization:**
- **Survivor Panel**: Only re-renders when survivor count or stats actually change
- **Base Panel**: Snapshot checks prevent unnecessary resource display updates
- **Map Panel**: Exploration count cached, only updates when tiles discovered
- **Systems Panel**: Failure states cached, only updates on actual failures
- Fixes flickering and focus loss issues on live deployment

**Scrollable Panels:**
- Workbench: Max height 400px with custom scrollbar styling
- Survivor List: Max height 600px with custom scrollbar styling
- Notifications: Height 300px with custom scrollbar styling
- All use `overscroll-behavior: contain` to prevent scroll chaining
- Smooth scrolling with theme-matching blue scrollbars

**Dropdown Improvements:**
- Task dropdowns maintain z-index above other cards
- Dropdown state preserved during UI updates
- Scroll position memory for all dropdown menus
- No more flickering when panels update
- Smart positioning prevents clipping in scrollable containers

### Fixed - Critical Bugs & Issues

#### Combat System Fixes
- Fixed weapon effects not applying in combat (all 8 effects now functional)
- Fixed armor effects not providing defensive bonuses
- Fixed adaptive combat UI not switching actions for different weapon types
- Fixed consumables not being usable mid-combat
- Fixed combat log showing incorrect damage values
- Fixed status effects not persisting between turns
- Fixed phase attacks not bypassing armor correctly
- Fixed splash damage not affecting nearby enemies

#### Equipment System Fixes
- Fixed equipment bonuses using string comparison instead of object properties
- Fixed durability not decreasing during combat
- Fixed weapons breaking mid-combat causing errors
- Fixed armor effects stacking incorrectly
- Fixed equipment slots not updating in real-time

#### Inventory System Fixes
- Fixed recycling not refunding all component types
- Fixed recycling popup appearing off-screen
- Fixed junk being recyclable (now only salvageable)
- Fixed inventory capacity not color-coding correctly
- Fixed items without recipes causing recycling errors

#### UI/UX Fixes
- Fixed Repair Kit "Use" button conflicting with recycling clicks
- Fixed repair costs not showing when Repair Kit available
- Fixed dropdown menus being clipped in scrollable containers
- Fixed scroll chaining from panels to main page
- Fixed panel flickering during tick updates
- Fixed survivor cards losing focus every second
- Fixed workbench buttons causing lag with cost recalculation
- Fixed map tooltips showing incorrect energy costs

#### Save/Load Fixes
- Fixed new item properties not migrating from old saves
- Fixed component inventory not persisting
- Fixed weapon effects not saving correctly
- Fixed armor bonuses resetting on reload
- Save version bumped to handle all new systems

### Technical Changes

#### New Files Added
- `js/game/recycling.js` - Complete recycling system logic
- `js/dropdownPosition.js` - Smart dropdown positioning system

#### Modified Systems
- `js/game/combatInteractive.js` - Complete rewrite for adaptive UI and all effects
- `js/constants.js` - 40+ new weapons, 15+ new armors, 10 new consumables, 8 components
- `js/ui.js` - Recycling integration, repair kit display, rarity colors, snapshotting
- `js/game/crafting.js` - Repair kit auto-use, component consumption, Inventor ability
- `js/game/combat.js` - New damage calculations, effect processing, unarmed combat
- `styles.css` - Recycle popup styles, scrollbar styling, dropdown positioning

#### Constants Added
- `UNARMED_DAMAGE` - Base damage for unarmed combat (2-4)
- `RARITY_COLORS` - Color mapping for all item rarities
- `WEAPON_EFFECTS` - Definitions for 8 weapon effect types
- `ARMOR_EFFECTS` - Definitions for 8 armor effect types
- Component requirements for all recipes
- 47+ new crafting recipes across all categories

#### Balance Constants Updated
- Damage scaling formulas completely reworked
- Threat tier thresholds adjusted for smoother progression
- Enemy spawn weights rebalanced across 8 alien types
- Loot drop rates tuned to target distributions
- Resource costs adjusted for new items

### Performance Improvements
- Reduced unnecessary DOM manipulation by 70%
- Implemented aggressive snapshot caching for all panels
- Optimized combat calculations with pre-computed values
- Reduced workbench re-renders from every tick to only on change
- Lazy loading for tooltip content
- Event delegation for inventory click handlers

### Known Issues
- None currently identified

### Migration Notes
- Existing saves fully compatible with automatic migration
- New item properties added to existing equipment
- Component inventory initialized for old saves
- Weapon/armor effects applied retroactively to existing gear
- No save wipes required

---

## [0.8.13] - 2025-10-31
### Hotfix - System Failures & Balance
- **Fixed NaN Production Bug**: Corrected a critical bug that caused oxygen and energy production to display as `NaN` after a system failure.
- **Rebalanced Base Production**: Tuned the new level 0 system production values to be much lower.
  - Base Oxygen: `0.5/s` (down from 2.5)
  - Base Energy: `0.3/s` (down from 1.5)
  - These values are intentionally low to require at least one survivor on task to be self-sufficient.
- **Improved Failure Mechanics**: Systems at level 0 can now fail and be repaired correctly. A failure now flags the system as offline rather than reducing its level.

### Changed - Early Game Balance
- **Starting Resources Increased** for better early game experience
  - Food: 30 → 40 (+33% more starting food)
  - Energy: 40 → 50 (+25% more starting energy)
  - Scrap: 25 → 35 (+40% more starting scrap)
  - Makes the opening minutes less punishing and gives more room for experimentation

- **Food Consumption Rebalanced**: Adjusted base and per-survivor food drain.
  - Base consumption: 0.05/s → 0.1/s
  - Per-survivor consumption: 0.18/s → 0.2/s
  - Example with 3 survivors: 0.59/s → 0.7/s total consumption
  - Creates a slightly higher food pressure to encourage active management.

### Fixed
- **Scavenger Salvage Bonuses**: Scavenger class and Salvage Expert ability now apply to junk salvaging
  - Bonuses stack additively (multiple Scavengers combine their bonuses)
  - Consistent with scrap bonuses applying to exploration, scrap task, and expeditions
  - Example: 2 Scavengers with +25% each = +50% scrap from salvaging junk

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