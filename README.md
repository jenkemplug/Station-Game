# Derelict Station

A browser-based survival/management game where you manage a space station, survivors, and resources while facing alien threats.

**Current Version:** 0.6.4 (Exploration Update)

##  Play Now

Visit [Derelict Station](https://derelictstation.netlify.app/) to play the latest version!

##  Features

### 🎮 Core Gameplay
- **Click-to-Explore Map**: Click adjacent tiles to explore the derelict station
- **Survivor Management**: Recruit, assign tasks, and level up survivors with unique skills
- **Resource Management**: Balance oxygen, food, energy, and scrap production
- **Combat System**: Fight aliens in tactical skirmishes with weapons and armor
- **XP & Progression**: Survivors gain experience and level up for better stats

### 🔧 Crafting & Equipment
- **Weapons**: Pulse Rifles and Shotguns for combat advantages
- **Armor**: Light Armor, Heavy Armor, and Hazmat Suits for protection
- **Consumables**: Medkits and ammo manufacturing
- **Systems**: Oxygen filters, generators, and auto-turrets
- **Durability System**: Equipment degrades and can be repaired

### 🗺️ Exploration
- **20x10 Tile Map**: Large station to explore with varied encounters
- **Explorer Selection**: Choose which survivor explores dangerous areas
- **Dynamic Energy Costs**: Different tile types require varying energy (8-25)
- **Tile Types**: Empty corridors, resource caches, survivors, alien nests, hazard rooms, modules
- **Solo Combat**: Your selected explorer fights aliens alone during exploration

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

### 👾 Threats
- **Four Alien Types**: Lurkers, Stalkers, Broods, and Spectres with unique stats
- **Threat Level**: Increases over time, reduced by guards
- **Base Raids**: Defend against alien attacks with turrets and guards
- **Critical Resource States**: Oxygen and food depletion cause casualties

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