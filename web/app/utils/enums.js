// Client-side mirror of the registry enumerations (labels in Tamil + English).
export const COLORS = {
  MAYILAI: { ta: 'மயிலை', en: 'Mayilai (peacock grey)', hex: '#8d9aa5' },
  SEVALAI: { ta: 'செவலை', en: 'Sevalai (red-brown)', hex: '#9c4a24' },
  KARI: { ta: 'கரி', en: 'Kaari (black)', hex: '#2f2b28' },
  KARAM_PASU: { ta: 'காராம் பசு', en: 'Kaarampasu', hex: '#6e5f52' },
  KURRA: { ta: 'குர்ரா', en: 'Kurra', hex: '#8a5a2b' },
  OTHER: { ta: 'மற்றவை', en: 'Other / mixed', hex: '#b9a68a' },
};

export const COLORS_LIST = Object.entries(COLORS).map(([value, meta]) => ({ value, ...meta }));

export const BIRTH_COLORS = {
  RED_FAWN: { ta: 'சிவந்த மான் நிறம்', en: 'Red / fawn calf coat' },
  GREY: { ta: 'சாம்பல்', en: 'Grey' },
  BLACK: { ta: 'கருப்பு', en: 'Black' },
  OTHER: { ta: 'மற்றவை', en: 'Other' },
};

export const DOB_PRECISION = {
  EXACT: { ta: 'துல்லியமான தேதி', en: 'Exact date' },
  MONTH_YEAR: { ta: 'மாதம் & ஆண்டு', en: 'Month & year' },
  YEAR_ONLY: { ta: 'ஆண்டு மட்டும்', en: 'Year only' },
  ESTIMATED_BY_TEETH: { ta: 'பல் மதிப்பீடு', en: 'Estimated by teeth' },
};

export const DENTITION = {
  CALF_MILK_TEETH: { ta: 'கன்றுப் பால் பல்', en: 'Calf — milk teeth' },
  TWO_TOOTH: { ta: 'இரண்டு பல்', en: 'Two-tooth' },
  FOUR_TOOTH: { ta: 'நான்கு பல்', en: 'Four-tooth' },
  SIX_TOOTH: { ta: 'ஆறு பல்', en: 'Six-tooth' },
  FULL_MOUTH: { ta: 'முழுப் பல்', en: 'Full mouth' },
};

export const LIFE_STAGE = {
  CALF: { ta: 'கன்று', en: 'Calf' },
  TWO_TOOTH: { ta: 'இரண்டு பல்', en: 'Two-tooth' },
  FOUR_TOOTH: { ta: 'நான்கு பல்', en: 'Four-tooth' },
  ADULT: { ta: 'முதிர்ந்த', en: 'Adult' },
  EVENT: { ta: 'நிகழ்வு', en: 'Event' },
};

export const CATEGORIES = {
  REKLA_RACE: { ta: 'ரேக்ளா பந்தயம்', en: 'Rekla race', icon: '🏁' },
  JALLIKATTU: { ta: 'ஜல்லிக்கட்டு', en: 'Jallikattu', icon: '🐂' },
  BREED_SHOW: { ta: 'கால்நடை கண்காட்சி', en: 'Breed show', icon: '🏅' },
  PROGENY_MILESTONE: { ta: 'சந்ததி சாதனை', en: 'Progeny milestone', icon: '🌱' },
  DAIRY_LACTATION: { ta: 'பால் உற்பத்தி', en: 'Dairy lactation', icon: '🥛' },
  DRAUGHT_ENDURANCE: { ta: 'உழவு சகிப்புத்திறன்', en: 'Draught endurance', icon: '🌾' },
};

export const ROLES = {
  BREEDER: { ta: 'இனப்பெருக்குநர்', en: 'Breeder' },
  PREVIOUS_OWNER: { ta: 'முன்னாள் உரிமையாளர்', en: 'Previous owner' },
  CURRENT_OWNER: { ta: 'தற்போதைய உரிமையாளர்', en: 'Current owner' },
};

export const STATUS = {
  ACTIVE: { ta: 'செயலில்', en: 'Active' },
  SOLD: { ta: 'விற்பனை', en: 'Sold' },
  DECEASED: { ta: 'இறந்தது', en: 'Deceased' },
};

export const DISTRICTS = ['Tiruppur', 'Erode', 'Coimbatore', 'Karur', 'Namakkal', 'Dindigul', 'Salem', 'Madurai', 'Thanjavur', 'Other'];

export const BREEDS_NOTE = 'Kangeyam (Kangayam) — Kongu Nadu\'s draught breed, known for its hump, grey/red coats and Rekla speed.';

export function entries(dict) {
  return Object.entries(dict).map(([value, meta]) => ({ value, ...meta }));
}

export function labelFor(dict, key) {
  return dict[key] ? dict[key].en : '—';
}
