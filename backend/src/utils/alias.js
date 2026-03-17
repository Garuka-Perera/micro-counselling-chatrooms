const ADJECTIVES = [
  "Quiet",
  "Calm",
  "Gentle",
  "Soft",
  "Kind",
  "Brave",
  "Hopeful",
  "Peaceful",
  "Warm",
  "Bright",
  "Safe",
  "Tender",
  "Steady",
  "Silent",
  "Clear",
];

const NOUNS = [
  "River",
  "Leaf",
  "Cloud",
  "Moon",
  "Forest",
  "Ocean",
  "Sky",
  "Star",
  "Stone",
  "Meadow",
  "Wave",
  "Light",
  "Rain",
  "Breeze",
  "Hill",
];

function randomItem(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function generateAnonymousAlias() {
  const adjective = randomItem(ADJECTIVES);
  const noun = randomItem(NOUNS);
  const number = Math.floor(100 + Math.random() * 900);
  return `${adjective}${noun}${number}`;
}

module.exports = {
  generateAnonymousAlias,
};