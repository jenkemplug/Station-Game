const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const el = id => document.getElementById(id);

let userId = null;

function getOrSetUserId() {
  if (userId) return userId;
  let storedId = localStorage.getItem('derelict_station_userId');
  if (!storedId) {
    storedId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('derelict_station_userId', storedId);
  }
  userId = storedId;
  return userId;
}

function getGameKey() {
  return `${BASE_GAME_KEY}_${getOrSetUserId()}`;
}

function formatTime(s) {
  const hh = Math.floor(s / 3600);
  s %= 3600;
  const mm = Math.floor(s / 60);
  const ss = s % 60;
  return `${hh}h ${mm}m ${ss}s`;
}
