/**
 * combatSequencer.js - Sequential Combat Animation System
 * Ensures all animations play out fully before combat ends or next action
 */

// Animation queue
let animationQueue = [];
let isProcessingAnimations = false;
// 1.0.1 - Generation token: clearAnimationQueue() bumps this, invalidating any
// in-flight setTimeout/setInterval chains from an earlier combat so their
// onComplete callbacks (endCombatImmediate, advanceToNextSurvivorImmediate, ...)
// can never fire against a different combat or turn.
let animationGeneration = 0;

/**
 * Add an animation to the queue
 * @param {Function} animationFn - Function that performs the animation
 * @param {number} duration - How long to wait (in ms) before next animation
 */
function queueAnimation(animationFn, duration = 600) {
  animationQueue.push({ fn: animationFn, duration });
}

/**
 * Process the animation queue sequentially
 * This should be called after an action completes to play all queued animations
 */
function processAnimationQueue(onComplete = null) {
  const generation = animationGeneration;

  // If already processing, just add the callback
  if (isProcessingAnimations) {
    if (onComplete) {
      // Wait for current processing to finish, then call callback
      const checkComplete = setInterval(() => {
        // Queue was cleared for a new combat: this waiter is stale
        if (generation !== animationGeneration) {
          clearInterval(checkComplete);
          return;
        }
        if (!isProcessingAnimations && animationQueue.length === 0) {
          clearInterval(checkComplete);
          onComplete();
        }
      }, 50);
    }
    return;
  }

  // If queue is empty, call callback immediately
  if (animationQueue.length === 0) {
    if (onComplete) onComplete();
    return;
  }

  isProcessingAnimations = true;

  function runNext() {
    // Queue was cleared for a new combat: abandon this chain silently
    if (generation !== animationGeneration) return;

    if (animationQueue.length === 0) {
      isProcessingAnimations = false;
      if (onComplete) onComplete();
      return;
    }

    const { fn, duration } = animationQueue.shift();

    // Execute animation function
    if (fn) {
      try {
        fn();
      } catch (e) {
        console.error('[QUEUE] Animation error:', e);
      }
    }

    // Wait for duration, then run next
    setTimeout(runNext, duration);
  }

  runNext();
}

/**
 * Clear the animation queue
 */
function clearAnimationQueue() {
  animationQueue = [];
  isProcessingAnimations = false;
  animationGeneration++;
}

/**
 * Check if animations are currently playing
 */
function isAnimating() {
  return isProcessingAnimations || animationQueue.length > 0;
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    queueAnimation,
    processAnimationQueue,
    clearAnimationQueue,
    isAnimating
  };
}
