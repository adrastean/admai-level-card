import {
  SlashCommandBuilder,
  EmbedBuilder
} from 'discord.js';

import {
  getUserLevelData,
  getGuildLevelConfig
} from '../utils/levelManager.js';

import fs from 'node:fs';
import path from 'node:path';

export const data = new SlashCommandBuilder()
  .setName('level')
  .setDescription('Kendi seviyenizi ve XP durumunuzu görüntülersiniz.')
  .setNameLocalizations({
    'tr': 'level',
    'en-US': 'level',
    'en-GB': 'level'
  })
  .setDescriptionLocalizations({
    'tr': 'Kendi seviyenizi ve XP durumunuzu görüntülersiniz.',
    'en-US': 'Displays your level and XP progress.',
    'en-GB': 'Displays your level and XP progress.'
  })
  .addUserOption(option =>
    option
      .setName('kullanici')
      .setDescription('Seviyesine bakılacak üye')
      .setNameLocalizations({
        'tr': 'kullanici',
        'en-US': 'user',
        'en-GB': 'user'
      })
      .setDescriptionLocalizations({
        'tr': 'Seviyesine bakılacak üye',
        'en-US': 'The member whose level you want to view',
        'en-GB': 'The member whose level you want to view'
      })
      .setRequired(false)
  );

/*
 * AdMai kendi sunucu dilini languages.json içinde saklıyor.
 * Dosya bulunamazsa Türkçe kullanılır.
 *
 * AdMai stores each server's language in languages.json.
 * Turkish is used when the file cannot be read.
 */
function getGuildLang(guildId) {
  const filePath = path.resolve('languages.json');

  if (!fs.existsSync(filePath)) {
    return 'tr';
  }

  try {
    const languageData = JSON.parse(
      fs.readFileSync(filePath, 'utf8')
    );

    const savedLanguage = String(
      languageData[guildId] || 'tr'
    ).toLowerCase();

    return savedLanguage.startsWith('en')
      ? 'en'
      : 'tr';
  } catch {
    return 'tr';
  }
}

/*
 * Metin tabanlı XP çubuğu oluşturur.
 * Creates a simple text-based XP progress bar.
 */
function createProgressBar(current, maximum, length = 10) {
  if (maximum <= 0) {
    return '░'.repeat(length);
  }

  const progress = Math.min(
    Math.max(current / maximum, 0),
    1
  );

  const filledBlocks = Math.round(progress * length);
  const emptyBlocks = length - filledBlocks;

  return (
    '▓'.repeat(filledBlocks) +
    '░'.repeat(emptyBlocks)
  );
}

async function showLevel({
  guild,
  targetUser,
  executorUser,
  reply,
  lang
}) {
  const user = targetUser || executorUser;
  const levelConfig = getGuildLevelConfig(guild.id);

  if (!levelConfig.enabled) {
    return reply({
      content: lang === 'en'
        ? '❌ The level system is disabled on this server.'
        : '❌ Bu sunucuda seviye sistemi kapalı.'
    });
  }

  const levelData = getUserLevelData(
    guild.id,
    user.id
  );

  const currentLevel = Number(levelData.level || 0);
  const currentXp = Number(levelData.xp || 0);
  const requiredXp = (currentLevel + 1) * 1000;

  const progressBar = createProgressBar(
    currentXp,
    requiredXp
  );

  const percentage = Math.min(
    Math.floor((currentXp / requiredXp) * 100),
    100
  );

  const embed = new EmbedBuilder()
    .setColor(0xd79fdf)
    .setTitle(
      lang === 'en'
        ? `📊 ${user.username} — Level Profile`
        : `📊 ${user.username} — Seviye Profili`
    )
    .setThumbnail(
      user.displayAvatarURL({
        size: 256
      })
    )
    .setDescription(
      lang === 'en'
        ? [
            `⭐ **Level:** \`${currentLevel}\``,
            `✨ **XP:** \`${currentXp.toLocaleString()} / ${requiredXp.toLocaleString()}\``,
            `📈 **Progress:** \`${percentage}%\``,
            '',
            `\`[${progressBar}]\``
          ].join('\n')
        : [
            `⭐ **Seviye:** \`${currentLevel}\``,
            `✨ **XP:** \`${currentXp.toLocaleString()} / ${requiredXp.toLocaleString()}\``,
            `📈 **İlerleme:** \`${percentage}%\``,
            '',
            `\`[${progressBar}]\``
          ].join('\n')
    )
    .setFooter({
      text: lang === 'en'
        ? 'XP progress is separate for each server.'
        : 'XP ilerlemesi her sunucu için ayrıdır.'
    })
    .setTimestamp();

  return reply({
    embeds: [embed]
  });
}

export async function execute(context, args = []) {
  const isSlash =
    typeof context.isChatInputCommand === 'function' &&
    context.isChatInputCommand();

  const guild = context.guild;

  if (!guild) {
    return;
  }

  const lang = getGuildLang(guild.id);

  if (isSlash) {
    const targetUser =
      context.options.getUser('kullanici') ||
      context.user;

    return showLevel({
      guild,
      targetUser,
      executorUser: context.user,
      reply: options => context.reply(options),
      lang
    });
  }

  const mentionedMember =
    context.mentions?.members?.first();

  const targetUser =
    mentionedMember?.user ||
    context.author;

  return showLevel({
    guild,
    targetUser,
    executorUser: context.author,
    reply: options => context.reply(options),
    lang
  });
}

export default {
  data,
  execute
};
