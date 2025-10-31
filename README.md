# Derelict Station

A browser-based survival/management game where you manage a space station, survivors, and resources while facing alien threats.

**Current Version:** 0.8.5 (Focus Fix)

##  Play Now

Visit [Derelict Station](https://jenkemplug.github.io/Station-Game/) to play the latest version!

##  Features

### 🎮 Core Gameplay
- **Click-to-Explore Map**: Click adjacent tiles to explore the derelict station
- **Survivor Classes & Abilities**: 8 unique classes with 40+ special abilities
  - Each survivor gets a random class (Soldier, Medic, Engineer, Scout, Technician, Scientist, Guardian, Scavenger)
  - Probabilistic ability system - survivors spawn with 0-5 abilities based on rarity tiers
  - Color-coded rarity: Purple (Uncommon), Orange (Rare), Red (Very Rare)
- **Advanced Combat Mechanics**:
  - **Revival System**: Field Medics can revive downed allies (25-50% HP)
  - **Living Shield**: Guardians intercept damage for teammates (50% chance)
  - **Alien Special Abilities**: 40+ modifiers including phase mechanics, counter-attacks, resurrection
  - Turn-based combat with tactical actions (Shoot, Aim, Burst, Guard, Medkit, Retreat, Revive)
  - **HARDCORE MODE**: Only guards defend during raids - no guards = instant game over
  - Raid defeat = permanent game over
  - **Retreat Option**: Escape from exploration encounters (chance-based on stats)
  - Combat log tracks all actions; active turn indicators
  - Auto-resolve option for quick battles
- **Resource Management**: Balance oxygen, food, energy, and scrap production
  - **System Failures**: Random breakdowns require repairs (1% base chance, 0.5% with Failsafe)
  - **Inventory Capacity**: Base 20 slots, expandable with Hoarder ability (+2 per)
- **XP & Progression**: Survivors gain experience and level up for better stats

### 🔧 Crafting & Equipment
- **Weapons**: Pulse Rifles and Shotguns for combat advantages
- **Armor**: Light Armor, Heavy Armor, and Hazmat Suits for protection
- **Consumables**: Medkits and ammo manufacturing
- **Systems**: Auto-turrets (Filters/Generators are upgraded via the Systems panel)
- **Durability System**: Equipment degrades and can be repaired
- **Loadout Management**: Equip/unequip weapons and armor for each survivor via a modal
- **Loot Rarity System**: Four quality tiers with improved durability and stats
  - Keen Eye: +20% rarity chance (Scavenger ability)
  - Treasure Hunter: +40% rarity chance (Scavenger ability)
- **Inventor Ability**: Engineers can extract rare components (weapon parts → 2-4 tech, 30% chance)

### 🗺️ Exploration
- **20x10 Tile Map**: Large station to explore with varied encounters
- **Explorer Selection**: Choose which survivor explores dangerous areas
- **Dynamic Energy Costs**: Different tile types require varying energy (8-25)
- **Tile Types**: Empty corridors, resource caches, survivors, alien nests, hazard rooms, modules
- **Solo Combat**: Your selected explorer fights aliens alone during exploration
- **Retreat & Return**: Can retreat from encounters and revisit them later
- **Safe Start**: No aliens spawn directly adjacent to your base

### 🚀 Expeditions
- **Deep Runs**: Send survivors on timed expeditions (30-45 seconds)
- **Resource Costs**: Requires food and energy to launch
- **Risk & Reward**: 65% success rate with valuable loot or potential casualties
- **Equipment Wear**: Weapons and armor degrade during expeditions

### ☣️ Hazard Rooms
- **Hazmat Suit Required**: Must equip specialized suit to clear contaminated areas
- **High Rewards**: 3x loot rolls and 3x XP compared to normal tiles
- **Durability Cost**: Suit degrades 15-25 points per hazard cleared
- **Best Risk/Reward**: Most lucrative content in the game
- **Revisitable**: Can return to clear hazards after obtaining a suit

### 👾 Threats
- **Eight Alien Types** with unique base abilities:
  - **Drone**: Evasive scavenger (25% dodge)
  - **Lurker**: Ambush predator (+50% first strike)
  - **Stalker**: Pack hunter (+2 dmg per ally)
  - **Spitter**: Armor-piercing ranged attacker
  - **Brood**: Regenerating nest cluster (2-4 HP/turn)
  - **Ravager**: Armored brute (50% damage reduction)
  - **Spectre**: Phase-shifting elite (40% avoidance) with advanced variants (Blink Strike, Ethereal, Wraith, Void)
  - **Hive Queen**: Apex predator (double attacks) with Hivemind modifier (resurrects drones)
- **40+ Alien Modifiers**: Each alien can spawn with special abilities
  - Uncommon: +30% dodge, +20% damage, regeneration boosts
  - Rare: Armor piercing, phase enhancements, pack tactics
  - Very Rare: Triple attacks, party buffs, devastating combos
- **Advanced Alien Mechanics**:
  - Blink Strike: Counter-attack after phasing
  - Ethereal/Void: Enhanced phase chances with unique effects
  - Wraith: +50% damage after phasing
  - Hivemind: Queen resurrects first dead drone at 50% HP
- **Threat Level**: Increases over time, reduced by guards
- **Base Raids**: **ONLY GUARDS DEFEND** - maintain a strong defense force or lose everything
- **Guard Task**: Essential for survival - reduces threat and defends against raids
- **Exploration-Scaled Raids**: Raid frequency increases as you explore more of the station
- **Critical Resource States**: Oxygen and food depletion cause casualties
- **Permadeath**: Failed raid defense = game over

### 💾 Quality of Life
- **Auto-save**: Game saves every 15 seconds
- **Offline Progress**: Catch up on missed time when returning
- **Multi-User Support**: Unique save files per player on same domain
- **Import/Export**: Back up and restore your save files
- **Responsive Design**: Play on desktop or mobile devices

##  Development Setup

### Local Development

1. Clone the repository:
```bash
git clone https://github.com/jenkemplug/Station-Game.git
cd Station-Game
```

2. Run a local server (choose one):

Using Python:
```bash
python -m http.server 8000
```

Using Node.js:
```bash
npx serve -p 8000 .
```

3. Open `http://localhost:8000/index.html` in your browser

##  Technical Details

- Built with vanilla JavaScript, HTML, and CSS
- No external dependencies
- Local storage for game saves
- Responsive design for different screen sizes

##  Version History

See [CHANGELOG.md](CHANGELOG.md) for version history and updates.

##  Contributing

Feel free to open issues and pull requests for:
- Bug fixes
- New features
- Documentation improvements
- UI/UX enhancements

##  License

This project is available for personal use and learning purposes.