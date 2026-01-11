export const gameNameMapping = {
  'DNM': 'Doubutsu no Mori',
  'DNM+': 'Doubutsu no Mori+',
  'AC': 'Animal Crossing (GameCube)',
  'DNME+': 'Doubutsu no Mori e+',
  'E_plus': 'Doubutsu no Mori e+',
  'E_PLUS': 'Doubutsu no Mori e+',
  'WW': 'Animal Crossing: Wild World',
  'CF': 'Animal Crossing: City Folk',
  'NL': 'Animal Crossing: New Leaf',
  'WA': 'Animal Crossing: New Leaf - Welcome Amiibo',
  'NH': 'Animal Crossing: New Horizons',
  'HHD': 'Animal Crossing: Happy Home Designer',
  'PC': 'Animal Crossing: Pocket Camp',
  'HHP': 'Animal Crossing: Happy Home Paradise',
  'AF': 'Animal Forest',
  'AF+': 'Animal Forest+',
  'AFe+': 'Animal Forest e+',
  'e+': 'Doubutsu no Mori e+',
  'GC': 'Animal Crossing (GameCube)',
  'PG': 'Animal Crossing: Pocket Camp',
  'AFi+': 'Animal Forest i+',
  'DnM+': 'Doubutsu no Mori+',
  'DnM': 'Doubutsu no Mori',
  'DnMe+': 'Doubutsu no Mori e+',
  'ACNH': 'Animal Crossing: New Horizons',
  'ACNL': 'Animal Crossing: New Leaf',
  'ACCF': 'Animal Crossing: City Folk',
  'ACWW': 'Animal Crossing: Wild World',
  'ACGC': 'Animal Crossing (GameCube)',
  'ACPC': 'Animal Crossing: Pocket Camp',
  'ACHHD': 'Animal Crossing: Happy Home Designer',
  'ACHHP': 'Animal Crossing: Happy Home Paradise'
};

export function getFullGameName(code) {
  if (!gameNameMapping[code]) {
    console.log('Unmapped game code:', code);
  }
  return gameNameMapping[code] || code;
}
