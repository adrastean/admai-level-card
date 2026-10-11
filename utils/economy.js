import fs from 'node:fs';
import path from 'node:path';

/*
 * Seviye verilerinin kaydedileceği dosya.
 * File used to store level data.
 */
const dataPath = path.join(
  process.cwd(),
  'data',
  'rankData.json'
);

/*
 * Veri klasörü yoksa otomatik oluşturur.
 * Automatically creates the data directory when needed.
 */
function ensureDataDirectory() {
  const directory = path.dirname(dataPath);

  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, {
      recursive: true
    });
  }
}

/*
 * Kayıtlı seviye verilerini okur.
 * Reads the saved level data.
 */
export function getEcoData() {
  ensureDataDirectory();

  if (!fs.existsSync(dataPath)) {
    fs.writeFileSync(
      dataPath,
      JSON.stringify({}, null, 2),
      'utf8'
    );

    return {};
  }

  try {
    const rawData = fs
      .readFileSync(dataPath, 'utf8')
      .trim();

    if (!rawData) {
      return {};
    }

    return JSON.parse(rawData);
  } catch (error) {
    console.error(
      'Level data could not be read:',
      error
    );

    return {};
  }
}

/*
 * Seviye verilerini JSON dosyasına kaydeder.
 * Saves level data to the JSON file.
 */
export function saveEcoData(data) {
  ensureDataDirectory();

  try {
    fs.writeFileSync(
      dataPath,
      JSON.stringify(data, null, 2),
      'utf8'
    );
  } catch (error) {
    console.error(
      'Level data could not be saved:',
      error
    );
  }
}

/*
 * Kullanıcının kaydı yoksa başlangıç verilerini oluşturur.
 * Creates default level data when the user has no record.
 */
export function ensureUser(
  levelData,
  userId
) {
  if (!levelData[userId]) {
    levelData[userId] = {
      level: 1,
      xp: 0,
      totalXpToday: 0,
      lastXpReset: new Date().toDateString()
    };
  }

  const user = levelData[userId];

  /*
   * Bozuk veya eski kayıtların komutu bozmasını engeller.
   * Prevents invalid or older records from breaking the command.
   */
  if (
    !Number.isFinite(Number(user.level)) ||
    Number(user.level) < 1
  ) {
    user.level = 1;
  } else {
    user.level = Number(user.level);
  }

  if (
    !Number.isFinite(Number(user.xp)) ||
    Number(user.xp) < 0
  ) {
    user.xp = 0;
  } else {
    user.xp = Number(user.xp);
  }

  if (
    !Number.isFinite(
      Number(user.totalXpToday)
    ) ||
    Number(user.totalXpToday) < 0
  ) {
    user.totalXpToday = 0;
  } else {
    user.totalXpToday = Number(
      user.totalXpToday
    );
  }

  /*
   * Gün değiştiğinde günlük XP sayacını sıfırlar.
   * Resets the daily XP counter when a new day begins.
   */
  const today = new Date().toDateString();

  if (user.lastXpReset !== today) {
    user.totalXpToday = 0;
    user.lastXpReset = today;
  }

  return user;
}

/*
 * Belirtilen seviyede bir sonraki seviye için gereken XP'yi hesaplar.
 * Calculates how much XP is required for the next level.
 */
export function getRequiredXp(level) {
  const safeLevel = Math.max(
    Number(level) || 1,
    1
  );

  return Math.floor(
    2000 *
    Math.pow(1.5, safeLevel - 1)
  );
}

/*
 * Kullanıcının yeterli XP'si varsa seviye atlamasını sağlar.
 * Handles one or multiple level-ups when enough XP is available.
 */
export function processLevelUps(user) {
  let levelsGained = 0;
  let requiredXp = getRequiredXp(
    user.level
  );

  while (user.xp >= requiredXp) {
    user.xp -= requiredXp;
    user.level += 1;
    levelsGained += 1;

    requiredXp = getRequiredXp(
      user.level
    );
  }

  return {
    leveledUp: levelsGained > 0,
    levelsGained,
    newLevel: user.level,
    currentXp: user.xp,
    requiredXp
  };
}

/*
 * Kullanıcıya XP eklemek isteyen projeler için yardımcı fonksiyon.
 * Helper function for projects that need to award XP.
 *
 * Rank komutunun çalışması için doğrudan gerekli değildir.
 * It is not directly required for rendering the rank card.
 */
export function addXpToUser(
  userId,
  amount
) {
  const levelData = getEcoData();
  const user = ensureUser(
    levelData,
    userId
  );

  const xpAmount = Math.max(
    Math.floor(Number(amount) || 0),
    0
  );

  user.xp += xpAmount;
  user.totalXpToday += xpAmount;

  const levelResult =
    processLevelUps(user);

  saveEcoData(levelData);

  return {
    user,
    xpAdded: xpAmount,
    ...levelResult
  };
}
