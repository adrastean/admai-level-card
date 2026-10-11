AdMai Level Card
AdMai'de kullandığım normal sunucu seviye kartı. Ekonomi sistemiyle bağlantısı yok; kullanıcının seviyesi ve XP'si her sunucu için ayrı tutuluyor.
The card uses guild-specific level data. It is not connected to the economy level system.
Kurulum
```bash
npm install @napi-rs/canvas discord.js
```
Kod ES Module olarak yazıldı. Projenin `package.json` dosyasında şunun bulunması gerekiyor:
```json
{
  "type": "module"
}
```
Dosyalar
`utils/rank.js`: Kart görselini oluşturur.
`commands/level.js`: Slash ve prefix komutudur.
`level.js`, seviye verisini şu fonksiyonla alıyor:
```js
const levelData = getUserLevelData(guild.id, user.id);
```
Benim sistemimde bir sonraki seviye için gereken XP:
```js
const requiredXp = (levelData.level + 1) * 1000;
```
Kendi botunda farklı bir formül kullanıyorsan yalnızca bu kısmı değiştirmen yeterli.
Kartı tek başına kullanmak
```js
import { generateRankCard } from './rank.js';

const levelData = getUserLevelData(guild.id, user.id);

const card = await generateRankCard({
  username: user.username,
  avatarURL: user.displayAvatarURL({
    extension: 'png',
    size: 256
  }),
  guildName: guild.name,
  level: levelData.level,
  xp: levelData.xp,
  language: 'tr'
});
```
`generateRankCard()` sana PNG biçiminde bir `Buffer` verir. Discord'a göndermek için:
```js
import { AttachmentBuilder } from 'discord.js';

const attachment = new AttachmentBuilder(card, {
  name: 'level-card.png'
});

await interaction.editReply({
  files: [attachment]
});
```
`requiredXp` değerini ayrıca göndermek zorunda değilsin. Göndermezsen kart bunu `(level + 1) * 1000` şeklinde hesaplar.
Kendi botuna eklemek
`rank.js` dosyasını botundaki `utils` klasörüne koy.
`level.js` dosyasını `commands` klasörüne koy.
`getUserLevelData` importunu kendi `levelManager.js` yoluna göre düzenle.
Slash komutlarını yeniden deploy et.
Botu yeniden başlat.
Bu yerleşimde import satırı şöyle olmalı:
```js
import { generateRankCard } from '../utils/rank.js';
```
Dil
```js
language: 'tr'
```
veya:
```js
language: 'en'
```
Renkleri değiştirmek
Tema vermek zorunlu değil. Sadece değiştirmek istediğin renkleri gönderebilirsin:
```js
const card = await generateRankCard({
  username: user.username,
  avatarURL,
  guildName: guild.name,
  level: levelData.level,
  xp: levelData.xp,
  theme: {
    primary: '#7c3aed',
    secondary: '#22d3ee',
    level: '#f59e0b'
  }
});
```
English quick example
```js
const card = await generateRankCard({
  username: user.username,
  avatarURL: user.displayAvatarURL({ extension: 'png', size: 256 }),
  guildName: guild.name,
  level: levelData.level,
  xp: levelData.xp,
  language: 'en'
});
```
The function returns a PNG `Buffer`. Send it through Discord.js with `AttachmentBuilder`. If `requiredXp` is omitted, the card uses `(level + 1) * 1000`.
License
MIT is included as an optional licence. If you do not want to allow reuse and modification, do not upload the `LICENSE` file to your repository.
