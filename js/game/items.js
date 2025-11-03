// Item System
// Handles the logic for using consumable items outside of combat.

function useOutOfCombatConsumable(survivorId, itemId) {
    const survivor = state.survivors.find(s => s.id === survivorId);
    const itemIndex = state.inventory.findIndex(i => i.id === itemId);

    if (!survivor || itemIndex === -1) {
        appendLog('Could not use item: Survivor or item not found.');
        return;
    }

    const item = state.inventory[itemIndex];
    const itemKey = item.subtype || item.type;
    const effect = BALANCE.CONSUMABLE_EFFECTS[itemKey];

    if (!effect) {
        appendLog(`Item ${item.name} has no defined effect.`);
        return;
    }

    let effectApplied = false;

    // Medkit and Advanced Medkit
    if (effect.heal) {
        let healAmount = rand(effect.heal[0], effect.heal[1]);
        // Apply Medic class bonus and Triage ability
        if (survivor.class === 'medic' && survivor.classBonuses && survivor.classBonuses.healing) {
            healAmount = Math.floor(healAmount * survivor.classBonuses.healing);
        }
        if (hasAbility(survivor, 'triage')) {
            healAmount = Math.floor(healAmount * 1.25);
        }
        survivor.hp = Math.min(survivor.maxHp, survivor.hp + healAmount);
        appendLog(`${survivor.name} used a ${item.name} and healed ${healAmount} HP.`);
        effectApplied = true;
    }

    // Nanite Injector
    if (effect.permanentHP) {
        survivor.maxHp += effect.permanentHP;
        survivor.hp += effect.permanentHP;
        appendLog(`${survivor.name} used a ${item.name}. Their maximum HP has permanently increased!`);
        effectApplied = true;
    }

    // Sonic Repulsor
    if (effect.threatReduction) {
        const reduction = effect.threatReduction;
        const oldThreat = state.threat;
        state.threat = Math.max(0, state.threat - reduction);
        // Respect threat floors
        const tiers = BALANCE.THREAT_TIERS || [0];
        const currentTierIndex = state.highestThreatTier || 0;
        const currentFloor = tiers[currentTierIndex] || 0;
        state.threat = Math.max(state.threat, currentFloor);
        
        appendLog(`A ${item.name} was activated. The alien presence feels less immediate. (Threat reduced by ${reduction}%)`);
        effectApplied = true;
    }

    if (effectApplied) {
        state.inventory.splice(itemIndex, 1); // Consume item
        updateUI();
        saveGame('action');
    } else {
        appendLog(`The ${item.name} cannot be used at this time.`);
    }
}
