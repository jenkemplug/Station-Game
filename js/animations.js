/**
 * animations.js - UI Animation System for Phase 3.2
 * Handles visual feedback for resource changes, XP gains, and game events
 */

// Track previous resource values to detect changes
const resourceTracker = {
  oxygen: 0,
  food: 0,
  energy: 0,
  scrap: 0,
  tech: 0,
  ammo: 0
};

/**
 * Initialize resource tracker with current values
 */
function initResourceTracker() {
  resourceTracker.oxygen = state.resources.oxygen || 0;
  resourceTracker.food = state.resources.food || 0;
  resourceTracker.energy = state.resources.energy || 0;
  resourceTracker.scrap = state.resources.scrap || 0;
  resourceTracker.tech = state.resources.tech || 0;
  resourceTracker.ammo = state.resources.ammo || 0;
}

/**
 * Check for resource changes and trigger animations
 */
function updateResourceAnimations() {
  const resources = ['oxygen', 'food', 'energy', 'scrap', 'tech', 'ammo'];
  
  resources.forEach(res => {
    const elementId = `res-${res}`;
    const element = el(elementId);
    if (!element) return;
    
    const oldValue = resourceTracker[res];
    const newValue = state.resources[res] || 0;
    
    // Remove previous animation classes
    element.classList.remove('resource-increase', 'resource-decrease', 'resource-critical');
    
    // Check for critical state (< 10 and not ammo)
    if (res !== 'ammo' && newValue < 10 && newValue > 0) {
      element.classList.add('resource-critical');
    }
    
    // Trigger animation on change
    if (newValue > oldValue) {
      element.classList.add('resource-increase');
    } else if (newValue < oldValue) {
      element.classList.add('resource-decrease');
    }
    
    // Update tracker
    resourceTracker[res] = newValue;
  });
}

/**
 * Show XP gain popup on survivor card
 * @param {number} survivorId - ID of survivor gaining XP
 * @param {number} amount - XP gained
 */
function showXPPopup(survivorId, amount) {
  const survivorCard = document.querySelector(`[data-survivor-id="${survivorId}"]`);
  if (!survivorCard) return;
  
  const popup = document.createElement('div');
  popup.className = 'xp-popup';
  popup.textContent = `+${amount} XP`;
  popup.style.position = 'absolute';
  popup.style.top = '10px';
  popup.style.right = '10px';
  
  survivorCard.style.position = 'relative';
  survivorCard.appendChild(popup);
  
  // Remove after animation completes
  setTimeout(() => {
    if (popup.parentNode) {
      popup.parentNode.removeChild(popup);
    }
  }, 1500);
}

/**
 * Flash survivor card on level up
 * @param {number} survivorId - ID of survivor leveling up
 */
function flashLevelUp(survivorId) {
  const survivorCard = document.querySelector(`[data-survivor-id="${survivorId}"]`);
  if (!survivorCard) return;
  
  survivorCard.classList.add('level-up-flash');
  
  // Remove class after animation
  setTimeout(() => {
    survivorCard.classList.remove('level-up-flash');
  }, 800);
}

/**
 * Animate loot notification in log
 * @param {string} logMessage - Message to highlight
 */
function animateLootLog(logMessage) {
  const logPanel = el('logPanel');
  if (!logPanel) return;
  
  // Wait for log to be added, then animate last entry
  setTimeout(() => {
    const logEntries = logPanel.querySelectorAll('.log-entry');
    if (logEntries.length > 0) {
      const lastEntry = logEntries[logEntries.length - 1];
      lastEntry.classList.add('loot-notification');
    }
  }, 50);
}

/**
 * Highlight important button (e.g., mission ready to complete)
 * @param {string} buttonId - ID of button to highlight
 */
function highlightButton(buttonId) {
  const button = el(buttonId);
  if (!button) return;
  
  button.classList.add('button-highlight');
}

/**
 * Remove button highlight
 * @param {string} buttonId - ID of button to remove highlight from
 */
function removeButtonHighlight(buttonId) {
  const button = el(buttonId);
  if (!button) return;
  
  button.classList.remove('button-highlight');
}

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    initResourceTracker,
    updateResourceAnimations,
    showXPPopup,
    flashLevelUp,
    animateLootLog,
    highlightButton,
    removeButtonHighlight
  };
}
