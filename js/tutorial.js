// js/tutorial.js
// 1.0 - Phase 3.1: Tutorial System

const TUTORIAL_SECTIONS = {
  overview: {
    title: '🎮 Game Overview',
    content: `
      <p><strong>Welcome to Derelict Station!</strong></p>
      <p>You've found yourself on an abandoned space station overrun by hostile aliens. Your goal is to <strong>survive, explore, and ultimately escape</strong> by repairing a shuttle in the hidden Hangar Bay.</p>
      
      <div class="tutorial-box">
        <strong>Core Gameplay Loop:</strong>
        <ol>
          <li><strong>Manage Resources:</strong> Keep Oxygen, Food, and Energy positive</li>
          <li><strong>Explore the Map:</strong> Find survivors, loot, and mission objectives</li>
          <li><strong>Complete Missions:</strong> Progress through 13 sectors to unlock the Hangar Bay</li>
          <li><strong>Combat Threats:</strong> Fight aliens and hostile survivors</li>
          <li><strong>Craft & Upgrade:</strong> Improve equipment and base systems</li>
          <li><strong>Repair the Shuttle:</strong> Escape and win the game!</li>
        </ol>
      </div>
      
      <p class="tutorial-tip">💡 <strong>Tip:</strong> Start by exploring nearby tiles to find survivors and resources. You need survivors to assign to tasks and defend your base!</p>
    `
  },
  
  resources: {
    title: '⚡ Resources & Systems',
    content: `
      <p>Your base requires constant resource management to stay operational:</p>
      
      <div class="tutorial-box">
        <strong>Core Resources:</strong>
        <ul>
          <li><strong>Oxygen (O₂):</strong> Consumed by survivors. Below 10% damages base integrity. At 0%, survivors take 2-5 HP damage per second!</li>
          <li><strong>Food:</strong> Consumed by survivors. At 0%, causes morale loss and 5% chance of starvation death per second.</li>
          <li><strong>Energy:</strong> Powers base systems and exploration. At 0%, oxygen production is reduced by 90%!</li>
          <li><strong>Scrap:</strong> Crafting material for equipment and upgrades.</li>
          <li><strong>Tech:</strong> Advanced material for high-tier equipment and shuttle repairs.</li>
          <li><strong>Ammo:</strong> Consumed during combat (65% chance per shot). Without ammo, ranged damage is halved!</li>
        </ul>
      </div>
      
      <div class="tutorial-box">
        <strong>Base Systems:</strong>
        <ul>
          <li><strong>O₂ Filter:</strong> Generates oxygen. Upgrade to increase production.</li>
          <li><strong>Generator:</strong> Generates energy. Essential for long-term survival.</li>
          <li><strong>Turrets:</strong> Provide automated defense during raids. Build multiple!</li>
        </ul>
        <p class="tutorial-warning">⚠️ <strong>System Failures:</strong> Systems can randomly fail (higher chance when base integrity is low). Failed systems reduce ALL production by 90% and damage base integrity (-0.05/s each). Repair immediately!</p>
      </div>
      
      <div class="tutorial-box">
        <strong>Base Integrity (Critical!):</strong>
        <p>Your base's structural condition, displayed with color-coded tiers:</p>
        <ul>
          <li><strong style="color:#4ade80">Pristine (100-80%):</strong> No penalties</li>
          <li><strong style="color:#facc15">Minor Damage (79-60%):</strong> -5% production, +10% system failure rate</li>
          <li><strong style="color:#fb923c">Damaged (59-40%):</strong> -10% production, +25% system failure rate</li>
          <li><strong style="color:#f97316">Critical (39-20%):</strong> -20% production, +50% system failure rate</li>
          <li><strong style="color:#ef4444">Collapsing (19-1%):</strong> -30% production, +100% system failure rate</li>
        </ul>
        <p><strong>Damage Sources:</strong> Low oxygen (<10%), failed systems, lost raid battles (-15-25%), undefended raids (-30-45%)</p>
        <p><strong>Repairs:</strong> Manual repair button (costs scrap/energy) or idle Engineers (+0.1/s each)</p>
        <p class="tutorial-warning">⚠️ <strong>If Base Integrity reaches 0%, it's GAME OVER!</strong></p>
      </div>
      
      <div class="tutorial-box">
        <strong>Survivor Tasks:</strong>
        <p>Assign survivors to tasks to produce resources (scales with level and class bonuses):</p>
        <ul>
          <li><strong>Oxygen:</strong> Base production per survivor (boosted by Engineers)</li>
          <li><strong>Food:</strong> Base production per survivor</li>
          <li><strong>Energy:</strong> Base production per survivor (boosted by Engineers)</li>
          <li><strong>Scrap:</strong> Base production per survivor (boosted by Scavengers)</li>
          <li><strong>Guard:</strong> Defend against raids and reduce threat growth</li>
          <li><strong>Idle:</strong> Engineers passively repair base integrity</li>
        </ul>
      </div>
    `
  },
  
  survivors: {
    title: '👥 Survivors & Classes',
    content: `
      <p>Survivors are your most valuable resource. They can be assigned to tasks, sent on missions, and will defend your base.</p>
      
      <div class="tutorial-box">
        <strong>Finding Survivors:</strong>
        <p>You <strong>cannot recruit survivors at base</strong>. You must <strong>explore the map</strong> and find tiles marked with <strong>S</strong> (Survivor) after exploring them. These appear randomly based on terrain type.</p>
      </div>
      
      <div class="tutorial-box">
        <strong>8 Survivor Classes (with randomized bonuses):</strong>
        <ul>
          <li><strong>🗡️ Soldier:</strong> +10-20% combat damage, +4-8 HP, +2-4 defense</li>
          <li><strong>⚕️ Medic:</strong> +25-35% healing effectiveness, +5-15% survival chance</li>
          <li><strong>🔧 Engineer:</strong> +15-30% production, 15-25% cheaper repairs</li>
          <li><strong>🏃 Scout:</strong> 10-20% cheaper exploration, +15-25% dodge, +20-30% retreat</li>
          <li><strong>⚙️ Technician:</strong> 10-20% cheaper crafting, +15-25% durability, +10-20% tech gains</li>
          <li><strong>🔬 Scientist:</strong> +15-30% XP gain, +15-25% analysis</li>
          <li><strong>🛡️ Guardian:</strong> +3-6 defense, +5-10% morale aura</li>
          <li><strong>💰 Scavenger:</strong> +15-25% loot quality, +20-30% scrap finds</li>
        </ul>
      </div>
      
      <div class="tutorial-box">
        <strong>Special Abilities (40+ total):</strong>
        <p>Survivors have unique abilities with color-coded rarity tiers:</p>
        <ul>
          <li><strong style="color:#a78bfa">● Uncommon (Purple):</strong> Marksman, Tactical Mind, Triage, Field Medic, Efficient, Quick Fix, Pathfinder, Keen Eye, Resourceful, Durable Craft, Analytical, Studious, Stalwart, Rallying Cry, Lucky Find, Salvage Expert</li>
          <li><strong style="color:#fb923c">● Rare (Orange):</strong> Veteran, Berserker, Adrenaline Shot, Lifesaver, Overclock, Failsafe, Evasive, Tracker, Recycler, Inventor, Xenobiologist, Breakthrough, Living Shield, Last Stand, Hoarder, Treasure Hunter</li>
          <li><strong style="color:#ef4444">● Legendary (Red):</strong> Commander, Miracle Worker, Mastermind, Ghost, Prodigy, Genius, Fortress, Golden Nose</li>
        </ul>
      </div>
      
      <p class="tutorial-tip">💡 <strong>Tip:</strong> Always keep at least 2 survivors assigned to <strong>Guard</strong> duty. Raids damage base integrity severely if undefended!</p>
    `
  },
  
  exploration: {
    title: '🗺️ Exploration',
    content: `
      <p>The station is a 138×73 tile hand-crafted map divided into 13 unique sectors. Exploration is the primary way to progress.</p>
      
      <div class="tutorial-box">
        <strong>How to Explore:</strong>
        <ol>
          <li>Select an explorer from the dropdown menu at the map</li>
          <li>Click an adjacent tile to explore it (or use WASD keys)</li>
          <li>Pay the energy cost (varies by tile type)</li>
          <li>The selected explorer gains XP and handles any combat alone</li>
        </ol>
      </div>
      
      <div class="tutorial-box">
        <strong>Tile Types & Map Legend:</strong>
        <p>The map uses ASCII characters to represent different areas:</p>
        <ul>
          <li><strong>B:</strong> Your Base (starting location)</li>
          <li><strong>. (dots):</strong> Empty corridors (8 energy)</li>
          <li><strong>S/M/E/W/Q/Y/P/N/O/G/F/T/V/J:</strong> Mission sector interiors (loot, resources, enemies)</li>
          <li><strong>1-9/A/D/C/H:</strong> Mission Door tiles (unlocked with keycards)</li>
          <li><strong># (walls):</strong> Impassable barriers</li>
        </ul>
        <p><strong>After exploring a tile, it displays content markers:</strong></p>
        <ul>
          <li><strong>Empty:</strong> No marker (just corridor)</li>
          <li><strong>Resource:</strong> Green background (scrap/tech/loot found)</li>
          <li><strong>Survivor (S):</strong> Blue background - ONLY way to get new survivors!</li>
          <li><strong>Alien (A):</strong> Red background (combat encounter, drops loot)</li>
          <li><strong>Hazard (H):</strong> Orange background (requires Hazmat Suit, 3x loot, damages suit)</li>
          <li><strong>Hostile Survivor (HS):</strong> Purple background (human NPCs with gear/abilities)</li>
          <li><strong>Mission (M):</strong> Yellow background (mission door, shows 🔒 locked or unlocked)</li>
        </ul>
      </div>
      
      <div class="tutorial-box">
        <strong>Keycards & Sector Progression:</strong>
        <p>The station has <strong>13 mission sectors</strong>, each with a unique interior:</p>
        <ul>
          <li><strong>1. Medical Bay (M tiles):</strong> Start area (unlocked by default)</li>
          <li><strong>2. Engineering Deck (E tiles):</strong> Unlock after Mission 1</li>
          <li><strong>3. Security Wing (W tiles):</strong> Unlock after Mission 2</li>
          <li><strong>4. Crew Quarters (Q tiles):</strong> Unlock after Mission 3</li>
          <li><strong>5. Research Labs (Y tiles):</strong> Unlock after Mission 4</li>
          <li><strong>6. Shopping Mall (P tiles):</strong> Unlock after Mission 5</li>
          <li><strong>7. Maintenance Hub (N tiles):</strong> Unlock after Mission 6</li>
          <li><strong>8. Communications (O tiles):</strong> Unlock after Mission 7</li>
          <li><strong>9. Cargo Bay (G tiles):</strong> Unlock after Mission 8</li>
          <li><strong>10. Corporate Offices (F tiles):</strong> Unlock after Mission 9</li>
          <li><strong>11. Reactor Chamber (T tiles):</strong> Unlock after Mission 10</li>
          <li><strong>12. Observation Deck (V tiles):</strong> Unlock after Mission 11</li>
          <li><strong>13. Hangar Bay (J tiles):</strong> Final escape! (unlock after Mission 12)</li>
        </ul>
        <p>Each mission grants access to the next sector. Sectors have themed loot tables!</p>
      </div>
      
      <div class="tutorial-box">
        <strong>Retreat Mechanics:</strong>
        <p>During field combat, you can attempt to retreat:</p>
        <ul>
          <li><strong>Base Chance:</strong> 45%</li>
          <li><strong>Bonuses:</strong> +2% per level, Scout class (+20-30%), abilities (Ghost +25%), armor effects, consumables (Stimpack +40%)</li>
          <li><strong>Success:</strong> Explorer escapes with XP, tile remains unexplored, can try again later</li>
          <li><strong>Failure:</strong> Combat continues normally</li>
        </ul>
      </div>
      
      <p class="tutorial-tip">💡 <strong>Tip:</strong> Hazard tiles offer 3x rewards but damage your Hazmat Suit. Bring repair materials or multiple suits for hazard-heavy areas!</p>
    `
  },
  
  missions: {
    title: '📜 Away Missions',
    content: `
      <p>Missions are multi-stage story encounters with unique challenges and guaranteed rewards. There are <strong>13 hand-crafted missions</strong>, one per sector.</p>
      
      <div class="tutorial-box">
        <strong>How Missions Work:</strong>
        <ol>
          <li>Explore the map to find <strong>Mission Door tiles (numbered 1-9/A/D/C/H on map)</strong></li>
          <li>Door shows 🔒 if locked or unlocked status based on keycards owned</li>
          <li>You automatically unlock sectors by completing the previous mission</li>
          <li>Assign a survivor to the mission from the popup</li>
          <li>Navigate through 3-5 story events with choices</li>
          <li>Face boss encounters and unique challenges</li>
          <li>Complete the mission to unlock the next sector</li>
        </ol>
      </div>
      
      <div class="tutorial-box">
        <strong>Mission Sectors (13 total):</strong>
        <ul>
          <li><strong>1. Medical Bay:</strong> Unlocked at start</li>
          <li><strong>2. Engineering Deck:</strong> Unlock after Mission 1</li>
          <li><strong>3. Security Wing:</strong> Unlock after Mission 2</li>
          <li><strong>4. Crew Quarters:</strong> Unlock after Mission 3</li>
          <li><strong>5. Research Labs:</strong> Unlock after Mission 4</li>
          <li><strong>6. Shopping Mall:</strong> Unlock after Mission 5</li>
          <li><strong>7. Maintenance Hub:</strong> Unlock after Mission 6</li>
          <li><strong>8. Communications:</strong> Unlock after Mission 7</li>
          <li><strong>9. Cargo Bay:</strong> Unlock after Mission 8</li>
          <li><strong>10. Corporate Offices:</strong> Unlock after Mission 9</li>
          <li><strong>11. Reactor Chamber:</strong> Unlock after Mission 10</li>
          <li><strong>12. Observation Deck:</strong> Unlock after Mission 11</li>
          <li><strong>13. Final Assault (Hangar Bay):</strong> Unlock after Mission 12 AND completing shuttle repairs</li>
        </ul>
      </div>
      
      <div class="tutorial-box">
        <strong>Mission Rewards:</strong>
        <ul>
          <li>� <strong>Sector Access:</strong> Unlock the next sector for exploration</li>
          <li>🎁 <strong>Guaranteed Loot:</strong> Rare/Legendary equipment and components</li>
          <li>⭐ <strong>XP Bonuses:</strong> 30-60 XP per mission</li>
          <li>📊 <strong>Story Progression:</strong> Learn about the station's history</li>
        </ul>
      </div>
      
      <p class="tutorial-tip">💡 <strong>Tip:</strong> Missions have multiple story paths. Your choices matter! Some paths are safer, others offer better rewards. Send your best-equipped survivor!</p>
    `
  },
  
  combat: {
    title: '⚔️ Combat System',
    content: `
      <p>Combat is turn-based and tactical. You'll face <strong>8 alien types</strong> and <strong>hostile survivors</strong> with advanced AI.</p>
      
      <div class="tutorial-box">
        <strong>Combat Actions:</strong>
        <ul>
          <li><strong>Shoot:</strong> Standard ranged attack (requires ammo, 65% chance to consume 1 ammo)</li>
          <li><strong>Strike:</strong> Melee attack (no ammo needed, less damage than ranged)</li>
          <li><strong>Aim:</strong> +25% hit chance on next shot</li>
          <li><strong>Burst:</strong> Fire 2 shots with bonus damage (costs 2 ammo)</li>
          <li><strong>Guard:</strong> +3 defense until your next turn</li>
          <li><strong>Use Medkit:</strong> Heal 15-25 HP (if you have medkits)</li>
          <li><strong>Revive:</strong> Bring back downed allies at 25-50% HP (Field Medic ability)</li>
          <li><strong>Retreat:</strong> Attempt to escape (45% base + bonuses, keeps XP, tile remains)</li>
        </ul>
      </div>
      
      <div class="tutorial-box">
        <strong>Alien Types (with Advanced AI):</strong>
        <ul>
          <li><strong>Drone (HP 6-10, Atk 2-5):</strong> Weak but fast, 25% dodge</li>
          <li><strong>Lurker (HP 8-14, Atk 3-6):</strong> Ambush predator, +50% damage on first strike</li>
          <li><strong>Stalker (HP 14-22, Atk 5-9):</strong> Pack tactics, +2 damage per ally alive</li>
          <li><strong>Spitter (HP 10-16, Atk 4-8):</strong> Ranged, ignores 50% armor (armor-piercing)</li>
          <li><strong>Brood (HP 28-40, Atk 8-14):</strong> Regenerates 2-4 HP per turn</li>
          <li><strong>Ravager (HP 20-30, Atk 10-16):</strong> Heavily armored, takes 50% less damage</li>
          <li><strong>Spectre (HP 12-18, Atk 6-11):</strong> 40% phase chance (attacks miss), can counter-attack</li>
          <li><strong>Hive Queen (HP 35-50, Atk 12-20):</strong> Attacks twice per turn, resurrects fallen drones once</li>
        </ul>
        <p><strong>Smart Alien AI:</strong></p>
        <ul>
          <li><strong>Aggressive types (Lurker, Stalker, Ravager):</strong> Focus fire on lowest HP% survivor to finish kills</li>
          <li><strong>Tactical types (Spitter, Queen):</strong> Prioritize high-value targets (Medics, Engineers first)</li>
          <li><strong>Opportunistic (Drone, Brood, Spectre):</strong> Random targeting</li>
        </ul>
        <p>Aliens also have 40+ special modifiers like Venomous, Armored, Ethereal, Pack Leader, Hivemind, etc.</p>
      </div>
      
      <div class="tutorial-box">
        <strong>Hostile Survivors (Smart AI):</strong>
        <p>Human NPCs with procedurally generated:</p>
        <ul>
          <li><strong>Classes:</strong> Soldier, Medic, Guardian, etc. (same as your survivors)</li>
          <li><strong>Abilities:</strong> Special abilities from the same pool (40+ abilities)</li>
          <li><strong>Equipment:</strong> Weapons and armor with passive effects (burn, stun, reflect, regen, pierce)</li>
          <li><strong>Consumables:</strong> Medkits, Stimpacks, Stun Grenades, Combat Drugs</li>
        </ul>
        <p><strong>Advanced AI Behavior:</strong></p>
        <ul>
          <li>Focus fire on lowest HP% survivors</li>
          <li>Use Medkit when below 50% HP</li>
          <li>Use Stimpack when below 70% HP (+30% evasion)</li>
          <li>Throw Stun Grenades at your strongest survivor (2 turn stun)</li>
          <li>Use Aim for +25% hit chance (30% chance per turn)</li>
          <li>Use Guard when HP drops below 30% (+3 defense, 60% chance)</li>
        </ul>
      </div>
      
      <div class="tutorial-box">
        <strong>Raid Defense:</strong>
        <p>Raids occur when threat is high. Here's how defense works:</p>
        <ul>
          <li><strong>ONLY Guards defend:</strong> Survivors on Guard duty fight together</li>
          <li><strong>Turrets assist:</strong> Each turret provides automated fire support during raids</li>
          <li><strong>No Guards:</strong> Base integrity -30-45%, severe morale loss, 25% chance of alien nest spawning</li>
          <li><strong>Guards Defeated:</strong> Base integrity -15-25%, morale loss</li>
          <li><strong>Victory:</strong> Morale boost, threat reduction, chance of loot</li>
        </ul>
        <p class="tutorial-warning">⚠️ <strong>Important:</strong> Raids do NOT cause instant game over! They damage base integrity. Game over only happens when base integrity reaches 0% or all survivors die.</p>
      </div>
      
      <p class="tutorial-tip">💡 <strong>Tip:</strong> Keep at least 2-3 survivors on Guard duty at all times, especially when threat is high. Build multiple turrets for extra firepower - they attack every raid automatically!</p>
    `
  },
  
  crafting: {
    title: '🔨 Crafting & Equipment',
    content: `
      <p>Craft weapons, armor, consumables, and base systems using scrap, tech, and crafting components.</p>
      
      <div class="tutorial-box">
        <strong>Workbench Categories (47+ Items):</strong>
        <ul>
          <li><strong>Consumables:</strong> Medkits, Ammo, Repair Kits, Stimpacks, Stun Grenades, Smoke Grenades, Combat Drugs, Stealth Fields</li>
          <li><strong>Melee Weapons:</strong> Combat Knives, Plasma Blades, Nano Blades</li>
          <li><strong>Rifles:</strong> Pulse Rifles, Plasma Rifles, Railguns, Gauss Rifles</li>
          <li><strong>Shotguns:</strong> Shotguns, Plasma Shotguns</li>
          <li><strong>Heavy Weapons:</strong> Light Machine Guns, Beam Cannons</li>
          <li><strong>Light Armor:</strong> Light Armor, Composite, Stealth Suits, Nano-Weave, Shield Suits, Regenerative Armor</li>
          <li><strong>Heavy Armor:</strong> Heavy Armor, Titan Armor, Void Suits</li>
          <li><strong>Hazmat Suits:</strong> Required for clearing hazard tiles</li>
          <li><strong>Systems:</strong> Filters, Generators, Turrets</li>
        </ul>
      </div>
      
      <div class="tutorial-box">
        <strong>Rarity Tiers:</strong>
        <p>Equipment found or crafted has rarity that affects stats and effects:</p>
        <ul>
          <li><strong style="color:#a0a0a0">● Common (Gray):</strong> Basic stats, common loot drops</li>
          <li><strong style="color:#a78bfa">● Uncommon (Purple):</strong> +20-40% better stats, some passive effects</li>
          <li><strong style="color:#fb923c">● Rare (Orange):</strong> +50-80% better stats, powerful passive effects</li>
          <li><strong style="color:#ef4444">● Legendary (Red):</strong> +100-150% better stats, game-changing effects</li>
        </ul>
        <p>Example: Common Pulse Rifle (4-8 dmg) → Legendary Pulse Rifle (12-20 dmg + Burn effect)</p>
      </div>
      
      <div class="tutorial-box">
        <strong>Crafting Components (8 Types):</strong>
        <p>Found through exploration and required for advanced crafting:</p>
        <ul>
          <li><strong>Weapon Parts:</strong> Rifles, shotguns, heavy weapons, shuttle hull</li>
          <li><strong>Armor Plating:</strong> All armor types, shuttle hull</li>
          <li><strong>Electronics:</strong> Systems, navigation, life support</li>
          <li><strong>Power Cores:</strong> Energy weapons, shuttle engine/life support/fuel</li>
          <li><strong>Quantum Cores:</strong> Advanced weapons, shuttle fuel cells</li>
          <li><strong>Nano Materials:</strong> Elite equipment, shuttle life support/fuel</li>
          <li><strong>Advanced Components:</strong> Top-tier gear, shuttle engine/navigation</li>
          <li><strong>Bio Materials:</strong> Special items</li>
        </ul>
      </div>
      
      <div class="tutorial-box">
        <strong>Equipment Passive Effects:</strong>
        <ul>
          <li><strong>Burn:</strong> Deal 2 damage/turn per stack (stacks up to 3 turns each)</li>
          <li><strong>Stun:</strong> Disable enemy for 1-2 turns</li>
          <li><strong>Splash:</strong> Hit multiple enemies at once</li>
          <li><strong>Pierce:</strong> Ignore 50% of enemy armor</li>
          <li><strong>Phase:</strong> Attacks have chance to miss completely</li>
          <li><strong>Poison:</strong> Deal 2 damage/turn per stack</li>
          <li><strong>Reflect:</strong> Return 30% of damage to attacker</li>
          <li><strong>Regen:</strong> Heal 2-4 HP per turn</li>
          <li><strong>Dodge:</strong> +10-35% evasion chance</li>
          <li><strong>Immunity:</strong> Immune to poison/burn effects</li>
        </ul>
      </div>
      
      <div class="tutorial-box">
        <strong>Special Features:</strong>
        <ul>
          <li><strong>Recycling:</strong> Click any crafted item in inventory to recycle for 50% resource refund (scrap, tech, and all components)</li>
          <li><strong>Repair Kits:</strong> Automatically make all system repairs FREE when in inventory</li>
          <li><strong>Inventor (Engineer rare):</strong> 30% chance when crafting to consume 1 Weapon Part and gain 2-4 bonus Tech</li>
          <li><strong>Durability:</strong> Equipment degrades in combat/hazards. Repair with scrap (0.4 per point) or use Repair Kits</li>
        </ul>
      </div>
    `
  },
  
  victory: {
    title: '🚀 Victory Condition',
    content: `
      <p>To escape the Derelict Station and win the game, you must repair a shuttle in the <strong>Hangar Bay</strong>.</p>
      
      <div class="tutorial-box">
        <strong>Step 1: Reach the Hangar Bay</strong>
        <ol>
          <li>Complete all 12 missions to unlock Sector 13</li>
          <li>The Hangar Bay is revealed after Mission 12</li>
          <li>Explore to find the Hangar Bay tile</li>
        </ol>
      </div>
      
      <div class="tutorial-box">
        <strong>Step 2: Repair the Shuttle (5 Components)</strong>
        <p>Each component requires resources and crafting components:</p>
        <ul>
          <li><strong>Hull Plating:</strong> 150 scrap, 25 tech, 8 Armor Plating, 5 Weapon Parts</li>
          <li><strong>Engine Core:</strong> 200 scrap, 40 tech, 4 Power Cores, 6 Electronics, 3 Advanced</li>
          <li><strong>Navigation System:</strong> 100 scrap, 50 tech, 8 Electronics, 5 Advanced</li>
          <li><strong>Life Support:</strong> 120 scrap, 30 tech, 5 Electronics, 4 Nano, 2 Power Cores</li>
          <li><strong>Fuel Cell:</strong> 180 scrap, 35 tech, 5 Power Cores, 2 Quantum, 3 Nano</li>
        </ul>
        <p>Progress: <strong>20% per component</strong> (5 components = 100%)</p>
      </div>
      
      <div class="tutorial-box">
        <strong>Step 3: Defend Against the Final Boss</strong>
        <p>When the shuttle reaches 100% repair, <strong>Mission 13: Final Assault</strong> activates!</p>
        <ul>
          <li>Face the <strong>Alpha Queen</strong> and her elite brood</li>
          <li>This is the hardest fight in the game</li>
          <li>Victory triggers the escape sequence</li>
        </ul>
      </div>
      
      <div class="tutorial-box">
        <strong>Victory Statistics:</strong>
        <p>After defeating the Alpha Queen, you'll see:</p>
        <ul>
          <li>⏱️ Total time survived</li>
          <li>👥 Survivors rescued</li>
          <li>🗺️ Sectors cleared</li>
          <li>👾 Aliens eliminated</li>
        </ul>
      </div>
      
      <p class="tutorial-tip">💡 <strong>Preparation Tips:</strong> Before triggering the final boss, make sure you have:</p>
      <ul class="tutorial-tip">
        <li>✅ 4+ high-level survivors with rare/very rare equipment</li>
        <li>✅ Full inventory of consumables (Medkits, Stimpacks, Grenades)</li>
        <li>✅ Multiple turrets built for extra firepower</li>
        <li>✅ High morale across your team</li>
      </ul>
      
      <p style="text-align:center;margin-top:24px;font-size:1.2em;"><strong>Good luck, Commander. The station is counting on you.</strong> 🚀</p>
    `
  }
};

function openTutorial() {
  const modal = document.getElementById('tutorialModal');
  if (!modal) return;
  
  modal.style.display = 'flex';
  renderTutorialSection('overview'); // Start with overview
}

function closeTutorial() {
  const modal = document.getElementById('tutorialModal');
  if (modal) modal.style.display = 'none';
}

function renderTutorialSection(sectionId) {
  const section = TUTORIAL_SECTIONS[sectionId];
  if (!section) return;
  
  const container = document.getElementById('tutorial-sections');
  if (!container) return;
  
  container.innerHTML = `
    <div class="tutorial-section">
      <h2 style="color:var(--accent);margin-bottom:16px;">${section.title}</h2>
      ${section.content}
    </div>
  `;
  
  // Update active tab
  document.querySelectorAll('.tutorial-tab').forEach(tab => {
    tab.classList.remove('active');
    if (tab.dataset.section === sectionId) {
      tab.classList.add('active');
    }
  });
}

// Event delegation for tutorial tabs
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('tutorial-tab')) {
    const sectionId = e.target.dataset.section;
    renderTutorialSection(sectionId);
  }
});
