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
    // Sci-fi inspired names
    'Atlas', 'Nova', 'Echo', 'Orion', 'Phoenix', 'Vega', 'Cygnus',
    'Lyra', 'Rigel', 'Terra', 'Sol', 'Astro', 'Nebula', 'Comet',
    'Zero', 'Edge', 'Flux', 'Core', 'Pulse', 'Helix', 'Vector',
    'Dawn', 'Dusk', 'Storm', 'Shade', 'Vale', 'Brook', 'River',
    'Zenith', 'Quasar', 'Cosmos', 'Nebula', 'Star', 'Galaxy',
    'Meteor', 'Stellar', 'Nova', 'Pulsar', 'Void', 'Eclipse',
    'Aurora', 'Comet', 'Celeste', 'Astral', 'Solace', 'Orbit',
    // Technology inspired names
    'Data', 'Cipher', 'Cache', 'Pixel', 'Vector', 'Matrix', 'Shell',
    'Link', 'Loop', 'Node', 'Query', 'Spark', 'Arc', 'Byte',
    'Binary', 'Crypto', 'Delta', 'Echo', 'Nexus', 'Proxy', 'Quantum',
    'Router', 'Server', 'Trace', 'Unix', 'Vortex', 'Wave', 'Xen',
    // Station/Engineering inspired names
    'Bolt', 'Gear', 'Wrench', 'Steel', 'Copper', 'Iron', 'Circuit',
    'Volt', 'Watt', 'Amp', 'Tesla', 'Edison', 'Maxwell', 'Ohm',
    'Diesel', 'Carbon', 'Neutron', 'Proton', 'Electron', 'Photon',
    'Ray', 'Beam', 'Laser', 'Plasma', 'Crystal', 'Element', 'Fusion'
];

// Get a random name and optionally remove it from the list
function getRandomName(remove = true) {
    if (SURVIVOR_NAMES.length === 0) return 'Unknown';
    const idx = Math.floor(Math.random() * SURVIVOR_NAMES.length);
    const name = SURVIVOR_NAMES[idx];
    if (remove) SURVIVOR_NAMES.splice(idx, 1);
    return name;
}
