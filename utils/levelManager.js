import fs from 'node:fs';
import path from 'node:path';

/*
 * Sunucu ve kullanıcı seviyeleri burada saklanır.
 * Guild and user level data is stored here.
 */
const dataPath = path.join(
  process.cwd(),
  'data',
  'levels.json'
);

function createDefaultGuildData() {
  return {
    /*
     * GitHub örneğinde sistem doğrudan çalışsın diye true.
     * Kendi botunda bir açma/kapatma komutun varsa false yapabilirsin.
     */
    enabled: true,

    xpPerMessage: 50,

    levelChannelId: null,
    levelChannelEnabled: false,

    // level -> Discord role ID
    roles: {},

    // user ID -> { xp, level }
    users: {}
  };
}

function ensureDataDirectory() {
  const dataDirectory = path.dirname(dataPath);

  if (!fs.existsSync(dataDirectory)) {
    fs.mkdirSync(dataDirectory, {
      recursive: true
    });
  }
}

function loadData() {
  ensureDataDirectory();

  if (!fs.existsSync(dataPath)) {
    return {};
  }

  try {
    const content = fs.readFileSync(
      dataPath,
      'utf8'
    );

    if (!content.trim()) {
      return {};
    }

    return JSON.parse(content);
  } catch (error) {
    console.error(
      'Level verisi okunamadı:',
      error
    );

    return {};
  }
}

function saveData(data) {
  ensureDataDirectory();

  try {
    fs.writeFileSync(
      dataPath,
      JSON.stringify(data, null, 2),
      'utf8'
    );
  } catch (error) {
    console.error(
      'Level verisi kaydedilemedi:',
      error
    );
  }
}

/*
 * Eski veri kayıtlarında eksik alanlar varsa tamamlar.
 * Restores missing fields in older data records.
 */
function ensureGuildData(data, guildId) {
  if (!data[guildId]) {
    data[guildId] = createDefaultGuildData();
    return data[guildId];
  }

  const guildData = data[guildId];

  if (guildData.enabled === undefined) {
    guildData.enabled = true;
  }

  if (!Number.isFinite(guildData.xpPerMessage)) {
    guildData.xpPerMessage = 50;
  }

  if (guildData.levelChannelId === undefined) {
    guildData.levelChannelId = null;
  }

  if (guildData.levelChannelEnabled === undefined) {
    guildData.levelChannelEnabled = false;
  }

  if (
    !guildData.roles ||
    typeof guildData.roles !== 'object'
  ) {
    guildData.roles = {};
  }

  if (
    !guildData.users ||
    typeof guildData.users !== 'object'
  ) {
    guildData.users = {};
  }

  return guildData;
}

/*
 * Sunucunun seviye ayarlarını döndürür.
 * Returns the level settings for a guild.
 */
export function getGuildLevelConfig(guildId) {
  const data = loadData();
  const isNewGuild = !data[guildId];

  const guildData = ensureGuildData(
    data,
    guildId
  );

  if (isNewGuild) {
    saveData(data);
  }

  return guildData;
}

/*
 * Sunucunun seviye ayarlarını günceller.
 * Updates the guild's level configuration.
 */
export function setGuildLevelConfig(
  guildId,
  configUpdates
) {
  const data = loadData();
  const guildData = ensureGuildData(
    data,
    guildId
  );

  data[guildId] = {
    ...guildData,
    ...configUpdates
  };

  /*
   * configUpdates içinde roles veya users gönderilmezse
   * mevcut verilerin silinmesini engeller.
   */
  data[guildId].roles =
    configUpdates.roles ??
    guildData.roles;

  data[guildId].users =
    configUpdates.users ??
    guildData.users;

  saveData(data);

  return data[guildId];
}

/*
 * Seviye atlama mesajlarının gönderileceği kanalı ayarlar.
 * Configures the level-up notification channel.
 */
export function updateGuildLevelChannel(
  guildId,
  channelId,
  enabled
) {
  const data = loadData();
  const guildData = ensureGuildData(
    data,
    guildId
  );

  if (channelId !== undefined) {
    guildData.levelChannelId = channelId;
  }

  if (enabled !== undefined) {
    guildData.levelChannelEnabled =
      Boolean(enabled);
  }

  saveData(data);

  return guildData;
}

/*
 * Kullanıcıya XP ekler ve gerekirse seviye atlatır.
 * Adds XP and handles multiple level-ups at once.
 */
export function addXpToUser(
  guildId,
  userId,
  amount
) {
  const data = loadData();
  const guildData = ensureGuildData(
    data,
    guildId
  );

  if (!guildData.enabled) {
    return {
      disabled: true,
      leveledUp: false
    };
  }

  if (!guildData.users[userId]) {
    guildData.users[userId] = {
      xp: 0,
      level: 0
    };
  }

  const user = guildData.users[userId];

  const xpAmount = Math.max(
    0,
    Math.floor(Number(amount) || 0)
  );

  const oldLevel = user.level;

  user.xp += xpAmount;

  /*
   * Kullanıcı tek seferde çok XP kazanırsa birden fazla
   * seviye atlayabilir.
   */
  while (
    user.xp >= (user.level + 1) * 1000
  ) {
    const requiredXp =
      (user.level + 1) * 1000;

    user.xp -= requiredXp;
    user.level += 1;
  }

  const levelsGained =
    user.level - oldLevel;

  saveData(data);

  return {
    disabled: false,
    leveledUp: levelsGained > 0,
    levelsGained,
    oldLevel,
    newLevel: user.level,
    currentXp: user.xp,
    requiredXp: (user.level + 1) * 1000
  };
}

/*
 * Kullanıcının mevcut seviyesini ve XP'sini döndürür.
 * Returns the user's current level and XP.
 */
export function getUserLevelData(
  guildId,
  userId
) {
  const data = loadData();

  const user =
    data[guildId]?.users?.[userId];

  if (!user) {
    return {
      xp: 0,
      level: 0
    };
  }

  return {
    xp: Number(user.xp || 0),
    level: Number(user.level || 0)
  };
}
