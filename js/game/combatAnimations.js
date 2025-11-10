/**
 * combatAnimations.js - Combat Visual Effects System
 * Handles all combat UI animations for interactive combat
 */

/**
 * Animate damage taken on a combatant card
 * @param {HTMLElement} card - The combatant card element
 * @param {boolean} isCritical - Whether this was a critical hit
 */
function animateDamage(card, isCritical = false) {
  if (!card) return;
  
  // Remove previous animations
  card.classList.remove('combat-damage', 'combat-hit', 'combat-crit');
  
  // Trigger reflow to restart animation
  void card.offsetWidth;
  
  // Apply animations
  card.classList.add('combat-damage');
  card.classList.add('combat-hit');
  
  if (isCritical) {
    card.classList.add('combat-crit');
  }
  
  // Clean up after animation
  setTimeout(() => {
    card.classList.remove('combat-damage', 'combat-hit', 'combat-crit');
  }, 500);
}

/**
 * Animate healing on a combatant card
 * @param {HTMLElement} card - The combatant card element
 */
function animateHeal(card) {
  if (!card) return;
  
  card.classList.remove('combat-heal');
  void card.offsetWidth;
  card.classList.add('combat-heal');
  
  setTimeout(() => {
    card.classList.remove('combat-heal');
  }, 500);
}

/**
 * Animate dodge/evade
 * @param {HTMLElement} card - The combatant card element
 */
function animateDodge(card) {
  if (!card) return;
  
  card.classList.remove('combat-dodge');
  void card.offsetWidth;
  card.classList.add('combat-dodge');
  
  setTimeout(() => {
    card.classList.remove('combat-dodge');
  }, 500);
}

/**
 * Animate shooting action
 * @param {HTMLElement} attackerCard - The attacker's card element
 * @param {string} weaponType - Type of weapon ('rifle', 'shotgun', 'melee', etc.)
 * @param {boolean} isBurst - Whether this is a burst attack
 */
function animateShoot(attackerCard, weaponType = 'rifle', isBurst = false) {
  if (!attackerCard) return;
  
  // 1.0 - Temporarily remove status effects so action animation can play
  const statusClasses = ['status-stunned', 'status-burning', 'status-poisoned', 'status-bleeding', 'status-weakened', 'status-phased', 'status-destabilized'];
  const activeStatuses = statusClasses.filter(cls => attackerCard.classList.contains(cls));
  activeStatuses.forEach(cls => attackerCard.classList.remove(cls));
  
  attackerCard.classList.remove('combat-shoot', 'combat-shoot-burst', 'combat-melee', 'combat-power-attack');
  void attackerCard.offsetWidth;
  
  if (weaponType === 'melee' || weaponType === 'unarmed') {
    attackerCard.classList.add('combat-melee');
    setTimeout(() => {
      attackerCard.classList.remove('combat-melee');
      // Restore status effects after animation
      activeStatuses.forEach(cls => attackerCard.classList.add(cls));
    }, 500);
  } else if (isBurst) {
    attackerCard.classList.add('combat-shoot-burst');
    setTimeout(() => {
      attackerCard.classList.remove('combat-shoot-burst');
      // Restore status effects after animation
      activeStatuses.forEach(cls => attackerCard.classList.add(cls));
    }, 900); // 3 flashes × 0.25s = 0.75s + buffer
  } else {
    attackerCard.classList.add('combat-shoot');
    setTimeout(() => {
      attackerCard.classList.remove('combat-shoot');
      // Restore status effects after animation
      activeStatuses.forEach(cls => attackerCard.classList.add(cls));
    }, 400); // Increased from 300ms
  }
}

/**
 * Animate power attack (melee burst)
 * @param {HTMLElement} attackerCard - The attacker's card element
 */
function animatePowerAttack(attackerCard) {
  if (!attackerCard) return;
  
  // 1.0 - Temporarily remove status effects so action animation can play
  const statusClasses = ['status-stunned', 'status-burning', 'status-poisoned', 'status-bleeding', 'status-weakened', 'status-phased', 'status-destabilized'];
  const activeStatuses = statusClasses.filter(cls => attackerCard.classList.contains(cls));
  activeStatuses.forEach(cls => attackerCard.classList.remove(cls));
  
  attackerCard.classList.remove('combat-power-attack');
  void attackerCard.offsetWidth;
  attackerCard.classList.add('combat-power-attack');
  
  setTimeout(() => {
    attackerCard.classList.remove('combat-power-attack');
    // Restore status effects after animation
    activeStatuses.forEach(cls => attackerCard.classList.add(cls));
  }, 900); // Match CSS animation duration
}

/**
 * Animate throwing action (for grenades)
 * @param {HTMLElement} attackerCard - The attacker's card element
 */
function animateThrow(attackerCard) {
  if (!attackerCard) return;
  
  attackerCard.classList.remove('combat-throw');
  void attackerCard.offsetWidth;
  attackerCard.classList.add('combat-throw');
  
  setTimeout(() => {
    attackerCard.classList.remove('combat-throw');
  }, 500);
}

/**
 * Animate miss
 * @param {HTMLElement} attackerCard - The attacker's card element
 * @param {HTMLElement} targetCard - The target's card element
 */
function animateMiss(attackerCard, targetCard) {
  if (!targetCard) return;
  
  targetCard.classList.remove('combat-miss');
  void targetCard.offsetWidth;
  targetCard.classList.add('combat-miss');
  
  setTimeout(() => {
    targetCard.classList.remove('combat-miss');
  }, 400);
}

/**
 * Animate aiming action
 * @param {HTMLElement} attackerCard - The attacker's card element
 */
function animateAim(attackerCard) {
  if (!attackerCard) return;
  
  attackerCard.classList.remove('combat-aim');
  void attackerCard.offsetWidth;
  attackerCard.classList.add('combat-aim');
  
  // Aim pulse continues until next action
}

/**
 * Remove aim animation
 * @param {HTMLElement} attackerCard - The attacker's card element
 */
function clearAim(attackerCard) {
  if (!attackerCard) return;
  attackerCard.classList.remove('combat-aim');
}

/**
 * Animate guard action
 * @param {HTMLElement} guardCard - The guarding card element
 */
function animateGuard(guardCard) {
  if (!guardCard) return;
  
  guardCard.classList.remove('combat-guard');
  void guardCard.offsetWidth;
  guardCard.classList.add('combat-guard');
  
  // Guard glow continues until next action
}

/**
 * Animate death
 * @param {HTMLElement} card - The combatant card element
 */
function animateDeath(card) {
  if (!card) return;
  
  card.classList.add('combat-death');
  // Don't remove - death state persists
}

/**
 * Animate revival
 * @param {HTMLElement} card - The combatant card element
 */
function animateRevive(card) {
  if (!card) return;
  
  // Remove death state
  card.classList.remove('combat-death');
  
  // Add revive glow
  card.classList.remove('combat-revive');
  void card.offsetWidth;
  card.classList.add('combat-revive');
  
  setTimeout(() => {
    card.classList.remove('combat-revive');
  }, 1000);
}

/**
 * Show floating status effect text
 * @param {HTMLElement} card - The combatant card element
 * @param {string} text - The status text to display
 * @param {string} color - The color for the text
 */
function showStatusEffect(card, text, color = 'var(--accent)') {
  // If no card element is provided, bail
  if (!card) return;

  // Create popup and position it relative to the page so it survives DOM re-renders
  const popup = document.createElement('div');
  popup.className = 'status-effect-popup';
  popup.textContent = text;
  popup.style.color = color;
  popup.style.position = 'absolute';
  popup.style.pointerEvents = 'none';
  popup.style.zIndex = 10000;

  // Compute card position in viewport and place popup above it
  const rect = card.getBoundingClientRect();
  const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
  const scrollY = window.pageYOffset || document.documentElement.scrollTop;
  // Place popup near the top-center of the card
  popup.style.left = `${rect.left + scrollX + rect.width / 2}px`;
  popup.style.top = `${rect.top + scrollY + rect.height * 0.12}px`;
  popup.style.transform = 'translate(-50%, -50%)';

  // Append to body so it isn't removed by renderCombatUI replacing card HTML
  document.body.appendChild(popup);

  // Remove after animation duration
  setTimeout(() => {
    if (popup.parentNode) popup.parentNode.removeChild(popup);
  }, 2000);
}

/**
 * Animate consumable usage
 * @param {HTMLElement} userCard - The user's card element
 */
/**
 * Animate consumable use with color-coded glow
 * @param {HTMLElement} userCard - The user's card element
 * @param {string} type - Type of consumable ('heal', 'stimpack', 'repair', 'drug', 'stealth', 'nanite', 'stun', 'override', 'revival', 'default')
 */
function animateConsumable(userCard, type = 'default') {
  if (!userCard) return;
  
  // Remove all consumable classes first
  userCard.classList.remove('combat-consumable', 'combat-consumable-heal', 'combat-consumable-stimpack', 
    'combat-consumable-repair', 'combat-consumable-drug', 'combat-consumable-stealth', 'combat-consumable-nanite',
    'combat-consumable-stun', 'combat-consumable-override', 'combat-consumable-revival');
  void userCard.offsetWidth;
  
  // Apply type-specific class for color-coded glow
  const classMap = {
    'heal': 'combat-consumable-heal',       // Green glow
    'stimpack': 'combat-consumable-stimpack', // Cyan glow
    'repair': 'combat-consumable-repair',    // Blue glow
    'drug': 'combat-consumable-drug',        // Orange/red glow
    'stealth': 'combat-consumable-stealth',  // White glow
    'nanite': 'combat-consumable-nanite',    // Bright green glow
    'stun': 'combat-consumable-stun',        // Rainbow glow (like stunned effect)
    'override': 'combat-consumable-override', // Red electric glow
    'revival': 'combat-consumable-revival',  // Bright cyan glow
    'default': 'combat-consumable'           // Default green
  };
  
  const className = classMap[type] || 'combat-consumable';
  userCard.classList.add(className);
  
  // Remove class after animation completes (1.2s + small buffer)
  setTimeout(() => {
    userCard.classList.remove(className);
  }, 1300); // Changed from 800ms to 1300ms to match animation duration
}

/**
 * Apply persistent status effect animation
 * @param {HTMLElement} card - The combatant card element
 * @param {string} statusType - Type of status ('stunned', 'burning', 'poisoned', 'bleeding', 'weakened', 'phased', 'destabilized')
 * @param {boolean} add - Whether to add (true) or remove (false) the effect
 */
function applyStatusAnimation(card, statusType, add = true) {
  if (!card) return;
  
  const className = `status-${statusType}`;
  
  if (add) {
    card.classList.add(className);
  } else {
    card.classList.remove(className);
  }
}

/**
 * Animate action button press
 * @param {string} buttonId - ID of the button
 */
function animateActionButton(buttonId) {
  const button = document.getElementById(buttonId);
  if (!button) return;
  
  button.classList.add('action-ready');
  
  setTimeout(() => {
    button.classList.remove('action-ready');
  }, 2000);
}

/**
 * Get combatant card element by ID
 * @param {string|number} id - Combatant ID (survivor or alien)
 * @param {boolean} isAlien - Whether this is an alien
 * @returns {HTMLElement|null}
 */
function getCombatantCard(id, isAlien = false) {
  const selector = isAlien ? `[data-alien-id="${id}"]` : `[data-survivor-id="${id}"]`;
  return document.querySelector(selector);
}

/**
 * Full combat action animation sequence
 * @param {object} params - Animation parameters
 */
function playCombatAnimation(params) {
  const {
    attackerId,
    attackerIsAlien = false,
    targetId,
    targetIsAlien = false,
    actionType = 'shoot', // 'shoot', 'melee', 'aim', 'heal', 'burst', 'power'
    weaponType = 'rifle',
    hit = true,
    damage = 0,
    isCritical = false,
    isMiss = false,
    statusText = null,
    statusColor = 'var(--accent)'
  } = params;
  
  const attackerCard = getCombatantCard(attackerId, attackerIsAlien);
  const targetCard = getCombatantCard(targetId, targetIsAlien);
  
  // Attacker action animation
  if (actionType === 'power') {
    animatePowerAttack(attackerCard);
  } else if (actionType === 'burst') {
    animateShoot(attackerCard, weaponType, true);
  } else if (actionType === 'shoot' || actionType === 'melee') {
    animateShoot(attackerCard, weaponType, false);
  } else if (actionType === 'aim') {
    animateAim(attackerCard);
  } else if (actionType === 'heal') {
    animateHeal(attackerCard);
  }
  
  // Target reaction animation (delayed for visual feedback)
  if (targetCard) {
    setTimeout(() => {
      if (isMiss) {
        animateMiss(attackerCard, targetCard);
        showStatusEffect(targetCard, 'MISS!', 'var(--muted)');
      } else if (hit) {
        animateDamage(targetCard, isCritical);
        
        if (statusText) {
          const color = isCritical ? 'var(--danger)' : statusColor;
          showStatusEffect(targetCard, statusText, color);
        }
      } else {
        animateDodge(targetCard);
        showStatusEffect(targetCard, 'DODGE!', 'var(--muted)');
      }
    }, 150);
  }
}

// Export for use in combat system
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    animateDamage,
    animateHeal,
    animateDodge,
    animateShoot,
    animatePowerAttack,
    animateThrow,
    animateMiss,
    animateAim,
    clearAim,
    animateGuard,
    animateDeath,
    animateRevive,
    animateConsumable,
    showStatusEffect,
    applyStatusAnimation,
    animateActionButton,
    getCombatantCard,
    playCombatAnimation
  };
}
