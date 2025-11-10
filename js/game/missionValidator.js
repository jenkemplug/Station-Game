// Lightweight mission validator
// Usage: call MissionValidator.validateAllMissions() from console or debug UI.
(function(window){
  const MissionValidator = {};

  MissionValidator.validateAllMissions = function() {
    const issues = [];
    if (typeof AWAY_MISSIONS !== 'object') {
      issues.push('AWAY_MISSIONS is not defined or not an object.');
      return issues;
    }

    const specialRewards = new Set(['tech']);
    const allowedExitTokens = new Set(['exit_mission','exit_ambush','exit_mission_failure']);

    const recipeKeys = typeof RECIPES === 'object' ? Object.keys(RECIPES) : [];
    const lootTypes = Array.isArray(LOOT_TABLE) ? LOOT_TABLE.map(l => l.type) : [];

    const triggerPattern = /^(ambush(_.*)?|horde_ambush|combat_[a-z0-9_]+|ambush_[a-z0-9_]+)$/i;

    Object.entries(AWAY_MISSIONS).forEach(([missionId, mission]) => {
      if (!mission || typeof mission !== 'object') {
        issues.push(`${missionId}: mission entry is not an object`);
        return;
      }
      const events = mission.events || {};
      if (!events || typeof events !== 'object') {
        issues.push(`${missionId}: missing or invalid events object`);
        return;
      }

      Object.entries(events).forEach(([eventId, event]) => {
        if (!event || typeof event !== 'object') {
          issues.push(`${missionId}.${eventId}: event is not an object`);
          return;
        }
        const choices = event.choices || [];
        if (!Array.isArray(choices)) {
          issues.push(`${missionId}.${eventId}: choices should be an array`);
          return;
        }

        choices.forEach((choice, ci) => {
          const base = `${missionId}.${eventId}.choice[${ci}]`;
          if (!choice) {
            issues.push(`${base}: choice is empty`);
            return;
          }

          if (choice.skillCheck) {
            if (typeof choice.skillCheck.difficulty !== 'number') {
              issues.push(`${base}: skillCheck.difficulty must be a number`);
            }
            // warn if unknown keys present
            Object.keys(choice.skillCheck).forEach(k => {
              if (k !== 'difficulty') {
                issues.push(`${base}: unexpected skillCheck key '${k}' (only 'difficulty' is supported).`);
              }
            });
          }

          const handleOutcome = (outcomeObj, branch) => {
            if (!outcomeObj) return;
            const prefix = `${base}.${branch}`;
            if (outcomeObj.reward && outcomeObj.reward.items) {
              outcomeObj.reward.items.forEach((itemName, idx) => {
                if (!itemName) {
                  issues.push(`${prefix}: reward item at index ${idx} is empty`);
                  return;
                }
                if (specialRewards.has(itemName)) return; // allowed special
                if (recipeKeys.includes(itemName)) return;
                if (lootTypes.includes(itemName)) return;
                issues.push(`${prefix}: reward item '${itemName}' not found in RECIPES or LOOT_TABLE`);
              });
            }

            if (outcomeObj.nextEvent) {
              const ne = outcomeObj.nextEvent;
              if (!allowedExitTokens.has(ne) && !events[ne]) {
                issues.push(`${prefix}: nextEvent '${ne}' not found in mission events or allowed exit tokens`);
              }
            }

            if (outcomeObj.trigger) {
              if (typeof outcomeObj.trigger !== 'string') {
                issues.push(`${prefix}: trigger must be a string`);
              } else if (!triggerPattern.test(outcomeObj.trigger)) {
                issues.push(`${prefix}: trigger '${outcomeObj.trigger}' looks suspicious (doesn't match expected patterns)`);
              }
            }
            
            // Add a warning for the specific bug case: a trigger that leads to failure even on win
            if (outcomeObj.trigger && outcomeObj.nextEvent === 'exit_mission_failure') {
              issues.push(`[WARN] ${prefix}: contains both a 'trigger' and 'exit_mission_failure'. Winning this combat will now result in a mission success, but this may not be the intended flow.`);
            }
          };

          handleOutcome(choice.outcome && choice.outcome.success, 'success');
          handleOutcome(choice.outcome && choice.outcome.failure, 'failure');
        });
      });
    });

    // Print summary
    if (issues.length === 0) {
      appendLog('[Missions] Validation OK — no issues found.');
    } else {
      appendLog(`[Missions] Validation found ${issues.length} issue(s):`);
      // Print up to 50 issues to the log to avoid spamming
      issues.slice(0, 200).forEach(i => appendLog(`• ${i}`));
    }

    return issues;
  };

  // Expose globally
  window.MissionValidator = MissionValidator;
})(window);
