const SURVIVOR_NAMES = [
    // Common names from various cultures
    'Alex', 'Morgan', 'Sam', 'Jordan', 'Taylor', 'Casey', 'Jamie', 
    'Avery', 'Riley', 'Quinn', 'Blake', 'Parker', 'Sage', 'Skylar',
    'Ali', 'Kai', 'Rin', 'Jun', 'Wei', 'Yue', 'Zhen', 'Ming',
    'Eva', 'Ana', 'Lena', 'Sofia', 'Nina', 'Mira', 'Tara', 'Dina',
    'Omar', 'Amir', 'Zaid', 'Rami', 'Karim', 'Samir', 'Idris',
    'Leo', 'Max', 'Theo', 'Felix', 'Oscar', 'Hugo', 'Louis',
    'Mia', 'Emma', 'Luna', 'Nova', 'Aria', 'Eden', 'Ivy', 'Cora',
    'Kai', 'Liam', 'Noah', 'Ethan', 'Mason', 'Lucas', 'Logan',
    'Zoe', 'Chloe', 'Ruby', 'Lucy', 'Maya', 'Alice', 'Clara',
    'Jin', 'Hana', 'Yuki', 'Akira', 'Ryu', 'Kei', 'Sora', 'Hiro',
    'Raj', 'Priya', 'Dev', 'Arya', 'Kiran', 'Arun', 'Maya', 'Veer',
    'Finn', 'Bjorn', 'Erik', 'Freya', 'Thor', 'Odin', 'Astrid',
    'Dante', 'Marco', 'Luca', 'Enzo', 'Aria', 'Nico', 'Milo',
    'Elias', 'Marta', 'Vera', 'Rosa', 'Diego', 'Carlos', 'Ivan',
    'Petra', 'Viktor', 'Sasha', 'Dmitri', 'Natasha', 'Yuri', 'Anya',
    'Hassan', 'Leila', 'Tariq', 'Fatima', 'Jamal', 'Amara', 'Kofi',
    'Chinwe', 'Kwame', 'Zuri', 'Jabari', 'Nia', 'Malik', 'Imani',
    // Sci-fi inspired names
    'Atlas', 'Nova', 'Echo', 'Orion', 'Phoenix', 'Vega', 'Cygnus',
    'Lyra', 'Rigel', 'Terra', 'Sol', 'Astro', 'Nebula', 'Comet',
    'Zero', 'Edge', 'Flux', 'Core', 'Pulse', 'Helix', 'Vector',
    'Dawn', 'Dusk', 'Storm', 'Shade', 'Vale', 'Brook', 'River',
    'Zenith', 'Quasar', 'Cosmos', 'Nebula', 'Star', 'Galaxy',
    'Meteor', 'Stellar', 'Nova', 'Pulsar', 'Void', 'Eclipse',
    'Aurora', 'Comet', 'Celeste', 'Astral', 'Solace', 'Orbit',
    'Sirius', 'Andromeda', 'Cassiopeia', 'Draco', 'Perseus', 'Titan',
    'Aether', 'Chronos', 'Helios', 'Selene', 'Nyx', 'Artemis',
    'Apollo', 'Athena', 'Hera', 'Zeus', 'Ares', 'Hades', 'Poseidon',
    'Juno', 'Diana', 'Mars', 'Jupiter', 'Saturn', 'Neptune', 'Pluto',
    'Ranger', 'Scout', 'Pilot', 'Navigator', 'Commander', 'Captain',
    'Sentinel', 'Guardian', 'Warden', 'Keeper', 'Striker', 'Vanguard',
    'Ghost', 'Phantom', 'Specter', 'Wraith', 'Shadow', 'Raven',
    'Hawk', 'Eagle', 'Falcon', 'Wolf', 'Bear', 'Tiger', 'Lion',
    'Blade', 'Arrow', 'Spear', 'Shield', 'Axe', 'Hammer', 'Sword',
    'Ember', 'Frost', 'Blaze', 'Chill', 'Thunder', 'Lightning',
    'Tempest', 'Gale', 'Zephyr', 'Breeze', 'Cyclone', 'Typhoon',
    // Technology inspired names
    'Data', 'Cipher', 'Cache', 'Pixel', 'Vector', 'Matrix', 'Shell',
    'Link', 'Loop', 'Node', 'Query', 'Spark', 'Arc', 'Byte',
    'Binary', 'Crypto', 'Delta', 'Echo', 'Nexus', 'Proxy', 'Quantum',
    'Router', 'Server', 'Trace', 'Unix', 'Vortex', 'Wave', 'Xen',
    'Logic', 'Syntax', 'Parse', 'Compile', 'Debug', 'Kernel', 'Daemon',
    'Firmware', 'Protocol', 'Packet', 'Signal', 'Feed', 'Stream',
    'Buffer', 'Index', 'Hash', 'Token', 'Key', 'Lock', 'Code',
    'Script', 'Command', 'Terminal', 'Console', 'Interface', 'Portal',
    'Grid', 'Network', 'System', 'Module', 'Framework', 'Engine',
    'Codec', 'Render', 'Shader', 'Texture', 'Vertex', 'Mesh', 'Poly',
    // Station/Engineering inspired names
    'Bolt', 'Gear', 'Wrench', 'Steel', 'Copper', 'Iron', 'Circuit',
    'Volt', 'Watt', 'Amp', 'Tesla', 'Edison', 'Maxwell', 'Ohm',
    'Diesel', 'Carbon', 'Neutron', 'Proton', 'Electron', 'Photon',
    'Ray', 'Beam', 'Laser', 'Plasma', 'Crystal', 'Element', 'Fusion',
    'Rivet', 'Torque', 'Piston', 'Valve', 'Turbine', 'Rotor', 'Shaft',
    'Clutch', 'Brake', 'Gauge', 'Meter', 'Dial', 'Switch', 'Relay',
    'Coil', 'Magnet', 'Dynamo', 'Generator', 'Conduit', 'Junction',
    'Welder', 'Forge', 'Anvil', 'Foundry', 'Smelter', 'Crucible',
    'Alloy', 'Titanium', 'Cobalt', 'Chrome', 'Nickel', 'Zinc',
    'Hydraulic', 'Pneumatic', 'Mechanic', 'Engineer', 'Technician',
    'Rigger', 'Fabricator', 'Machinist', 'Operator', 'Specialist'
];

// Get a random name and optionally remove it from the list
function getRandomName(remove = true) {
    if (SURVIVOR_NAMES.length === 0) return 'Unknown';
    const idx = Math.floor(Math.random() * SURVIVOR_NAMES.length);
    const name = SURVIVOR_NAMES[idx];
    if (remove) SURVIVOR_NAMES.splice(idx, 1);
    return name;
}
