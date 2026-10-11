import {
  SlashCommandBuilder,
  AttachmentBuilder
} from 'discord.js';

import {
  createCanvas,
  loadImage
} from '@napi-rs/canvas';

import {
  getEcoData,
  ensureUser,
  saveEcoData,
  processLevelUps,
  getRequiredXp
} from '../utils/economy.js';

export const data = new SlashCommandBuilder()
  .setName('rank')
  .setDescription('Seviyenizi ve XP durumunuzu gösterir.')
  .setNameLocalizations({
    'tr': 'rank',
    'en-US': 'rank',
    'en-GB': 'rank'
  })
  .setDescriptionLocalizations({
    'tr': 'Seviyenizi ve XP durumunuzu gösterir.',
    'en-US': 'Shows your level and XP progress.',
    'en-GB': 'Shows your level and XP progress.'
  })
  .addUserOption(option =>
    option
      .setName('kullanici')
      .setDescription('Seviyesine bakmak istediğiniz kullanıcı')
      .setNameLocalizations({
        'tr': 'kullanici',
        'en-US': 'user',
        'en-GB': 'user'
      })
      .setDescriptionLocalizations({
        'tr': 'Seviyesine bakmak istediğiniz kullanıcı',
        'en-US': 'The user whose level you want to view',
        'en-GB': 'The user whose level you want to view'
      })
      .setRequired(false)
  );

/*
 * Discord dilini Türkçe veya İngilizce olarak sadeleştirir.
 * Converts Discord's locale into a simple Turkish or English value.
 */
function getLanguage(context) {
  const locale = String(
    context.locale ||
    context.guild?.preferredLocale ||
    'tr'
  ).toLowerCase();

  return locale.startsWith('en')
    ? 'en'
    : 'tr';
}

/*
 * Uzun kullanıcı adlarının kartın dışına taşmasını engeller.
 * Prevents long usernames from overflowing outside the card.
 */
function shortenText(text, maximumLength = 24) {
  if (text.length <= maximumLength) {
    return text;
  }

  return `${text.slice(0, maximumLength - 3)}...`;
}

export async function execute(context, args = []) {
  /*
   * Komut hem slash hem de prefix kullanımını destekler.
   * The command supports both slash and prefix usage.
   */
  const isSlash =
    typeof context.isChatInputCommand === 'function' &&
    context.isChatInputCommand();

  if (!context.guild) {
    return;
  }

  const lang = getLanguage(context);

  let targetUser;

  if (isSlash) {
    targetUser =
      context.options.getUser('kullanici') ||
      context.user;

    /*
     * Canvas kartının hazırlanması birkaç saniye sürebilir.
     * Generating the Canvas card may take a few seconds.
     */
    await context.deferReply();
  } else {
    targetUser =
      context.mentions?.users?.first() ||
      context.author;

    await context.channel
      ?.sendTyping()
      .catch(() => {});
  }

  /*
   * Kullanıcının seviye verisini yükler veya ilk kaydını oluşturur.
   * Loads the user's level data or creates a new record.
   */
  const ecoData = getEcoData();
  const user = ensureUser(
    ecoData,
    targetUser.id
  );

  /*
   * XP sınırı daha önce aşılmışsa eksik seviye atlamalarını tamamlar.
   * Repairs missed level-ups when the stored XP is above the requirement.
   */
  const levelResult = processLevelUps(user);

  if (levelResult.leveledUp) {
    saveEcoData(ecoData);
  }

  const requiredXp = getRequiredXp(
    user.level
  );

  const remainingXp = Math.max(
    requiredXp - user.xp,
    0
  );

  /*
   * Kart 750 × 260 piksel olarak oluşturulur.
   * The card is rendered at 750 × 260 pixels.
   */
  const canvas = createCanvas(750, 260);
  const ctx = canvas.getContext('2d');

  // Koyu arka plan / Dark background
  ctx.fillStyle = '#0d0e12';
  ctx.fillRect(
    0,
    0,
    canvas.width,
    canvas.height
  );

  /*
   * Sol tarafa pembe, sağ tarafa mavi ışık efekti ekler.
   * Adds a pink glow on the left and a blue glow on the right.
   */
  const pinkGlow = ctx.createRadialGradient(
    100,
    60,
    10,
    100,
    60,
    250
  );

  pinkGlow.addColorStop(
    0,
    'rgba(235, 52, 183, 0.22)'
  );

  pinkGlow.addColorStop(
    1,
    'transparent'
  );

  ctx.fillStyle = pinkGlow;
  ctx.fillRect(
    0,
    0,
    canvas.width,
    canvas.height
  );

  const blueGlow = ctx.createRadialGradient(
    650,
    200,
    10,
    650,
    200,
    250
  );

  blueGlow.addColorStop(
    0,
    'rgba(52, 140, 235, 0.20)'
  );

  blueGlow.addColorStop(
    1,
    'transparent'
  );

  ctx.fillStyle = blueGlow;
  ctx.fillRect(
    0,
    0,
    canvas.width,
    canvas.height
  );

  /*
   * Kartın ortasındaki yarı saydam ana panel.
   * Semi-transparent main panel in the centre of the card.
   */
  ctx.fillStyle = 'rgba(22, 24, 31, 0.90)';
  ctx.beginPath();
  ctx.roundRect(
    25,
    25,
    700,
    210,
    18
  );
  ctx.fill();

  const avatarX = 55;
  const avatarY = 50;
  const avatarRadius = 60;

  /*
   * Avatarı daire şeklinde keser.
   * Clips the avatar into a circular shape.
   */
  ctx.save();
  ctx.beginPath();

  ctx.arc(
    avatarX + avatarRadius,
    avatarY + avatarRadius,
    avatarRadius,
    0,
    Math.PI * 2
  );

  ctx.closePath();
  ctx.clip();

  try {
    const avatarUrl =
      targetUser.displayAvatarURL({
        extension: 'png',
        size: 256
      });

    const avatar = await loadImage(
      avatarUrl
    );

    ctx.drawImage(
      avatar,
      avatarX,
      avatarY,
      avatarRadius * 2,
      avatarRadius * 2
    );
  } catch {
    /*
     * Avatar yüklenemezse boş gri bir alan gösterilir.
     * A grey placeholder is used if the avatar cannot be loaded.
     */
    ctx.fillStyle = '#333333';

    ctx.fillRect(
      avatarX,
      avatarY,
      avatarRadius * 2,
      avatarRadius * 2
    );
  }

  ctx.restore();

  // Avatar çerçevesi / Avatar border
  ctx.strokeStyle = '#eb34b7';
  ctx.lineWidth = 4;
  ctx.beginPath();

  ctx.arc(
    avatarX + avatarRadius,
    avatarY + avatarRadius,
    avatarRadius,
    0,
    Math.PI * 2
  );

  ctx.stroke();

  /*
   * Sistemde yaygın bulunan fontlar kullanılır.
   * Common system fonts are used for better compatibility.
   */
  const safeFont =
    'Arial, "Helvetica Neue", Helvetica, sans-serif';

  // Kullanıcı adı / Username
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold 26px ${safeFont}`;
  ctx.textAlign = 'left';

  ctx.fillText(
    shortenText(targetUser.username),
    200,
    80
  );

  // Seviye bilgisi / Level information
  ctx.fillStyle = '#eb4034';
  ctx.font = `bold 22px ${safeFont}`;
  ctx.textAlign = 'right';

  ctx.fillText(
    `LEVEL ${user.level}`,
    695,
    80
  );

  ctx.textAlign = 'left';

  // XP ilerleme metni / XP progress text
  ctx.fillStyle = '#a0a3bd';
  ctx.font = `15px ${safeFont}`;

  const progressText =
    lang === 'en'
      ? `Progress: ${user.xp.toLocaleString()} / ${requiredXp.toLocaleString()} XP`
      : `İlerleme: ${user.xp.toLocaleString()} / ${requiredXp.toLocaleString()} XP`;

  ctx.fillText(
    progressText,
    200,
    120
  );

  const barX = 200;
  const barY = 138;
  const barWidth = 495;
  const barHeight = 20;

  // XP çubuğunun arka planı / XP bar background
  ctx.fillStyle = '#111216';
  ctx.beginPath();

  ctx.roundRect(
    barX,
    barY,
    barWidth,
    barHeight,
    10
  );

  ctx.fill();

  /*
   * XP miktarını 0 ile 1 arasında bir ilerleme oranına çevirir.
   * Converts the XP amount into a progress value between 0 and 1.
   */
  const progress = Math.min(
    Math.max(user.xp / requiredXp, 0),
    1
  );

  if (progress > 0) {
    ctx.fillStyle = '#348ceb';
    ctx.beginPath();

    ctx.roundRect(
      barX,
      barY,
      Math.max(barWidth * progress, 20),
      barHeight,
      10
    );

    ctx.fill();
  }

  // Kartın alt bilgileri / Bottom card information
  ctx.fillStyle = '#8f92a1';
  ctx.font = `14px ${safeFont}`;
  ctx.textAlign = 'left';

  const dailyXpText =
    lang === 'en'
      ? `Today's XP: ${user.totalXpToday.toLocaleString()}`
      : `Bugünkü XP: ${user.totalXpToday.toLocaleString()}`;

  ctx.fillText(
    dailyXpText,
    200,
    195
  );

  ctx.textAlign = 'right';

  const remainingText =
    lang === 'en'
      ? `${remainingXp.toLocaleString()} XP until next level`
      : `Sonraki seviyeye ${remainingXp.toLocaleString()} XP`;

  ctx.fillText(
    remainingText,
    695,
    195
  );

  /*
   * Canvas çıktısını Discord'a gönderilebilecek PNG dosyasına çevirir.
   * Converts the Canvas output into a PNG attachment for Discord.
   */
  const buffer = canvas.toBuffer(
    'image/png'
  );

  const attachment = new AttachmentBuilder(
    buffer,
    {
      name: 'rank-card.png'
    }
  );

  if (isSlash) {
    return context.editReply({
      files: [attachment]
    });
  }

  return context.reply({
    files: [attachment]
  });
}

export default {
  data,
  execute
};
