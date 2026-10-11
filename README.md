# Discord Rank Card

Discord.js ve `@napi-rs/canvas` kullanılarak hazırlanmış basit bir seviye kartı örneği.

A simple rank card example built with Discord.js and `@napi-rs/canvas`.

Kartta kullanıcının:

- Profil fotoğrafı
- Kullanıcı adı
- Seviyesi
- Mevcut XP miktarı
- Bir sonraki seviye için gereken XP
- Günlük kazandığı XP

gösterilir.

The card displays the user's:

- Avatar
- Username
- Level
- Current XP
- XP required for the next level
- XP earned today

## Gereksinimler / Requirements

- Node.js 18 veya üzeri / Node.js 18 or newer
- discord.js
- @napi-rs/canvas
- ES Modules

Gerekli paketleri yüklemek için:

Install the required packages:

```bash
npm install discord.js @napi-rs/canvas
```

Projenin `package.json` dosyasında ES Module desteği açık olmalıdır:

Your `package.json` must enable ES Modules:

```json
{
  "type": "module"
}
```

## Dosya yapısı / File structure

```text
project/
├── commands/
│   └── rank.js
├── utils/
│   └── economy.js
├── data/
│   └── rankData.json
├── .gitignore
└── package.json
```

`data/rankData.json` dosyasını kendiniz oluşturmanız gerekmez. İlk kullanımda otomatik olarak oluşturulur.

You do not need to create `data/rankData.json` manually. It is created automatically on first use.

## Dosyalar / Files

### `commands/rank.js`

Canvas kullanarak rank kartını oluşturur ve kullanıcıya PNG olarak gönderir.

Creates the rank card with Canvas and sends it to the user as a PNG image.

Komut hem slash hem de prefix komut sistemleriyle kullanılabilecek şekilde hazırlanmıştır.

The command is designed to work with both slash and prefix command systems.

Slash komutu:

```text
/rank
/rank kullanici:@kullanıcı
```

Prefix komutu:

```text
!rank
!rank @kullanıcı
```

Prefix komutunun çalışması için botunuzdaki mevcut prefix komut yöneticisinin `rank.js` dosyasını çağırması gerekir.

For prefix usage, your existing prefix command handler must call the `rank.js` command.

### `utils/economy.js`

Kullanıcıların seviye ve XP verilerini yönetir.

Manages user level and XP data.

Bu dosya:

- Kullanıcı kaydı oluşturur.
- XP verisini kaydeder.
- Günlük XP sayacını yeniler.
- Gerekli XP miktarını hesaplar.
- Bir veya birden fazla seviye atlamayı işler.
- `data/rankData.json` dosyasını otomatik oluşturur.

This file:

- Creates user records.
- Saves XP data.
- Resets the daily XP counter.
- Calculates required XP.
- Handles one or multiple level-ups.
- Automatically creates `data/rankData.json`.

## XP sistemi / XP system

Bir sonraki seviye için gereken XP şu formülle hesaplanır:

XP required for the next level is calculated with:

```js
2000 * Math.pow(1.5, level - 1)
```

Örnek XP gereksinimleri:

Example XP requirements:

| Seviye / Level | Gerekli XP / Required XP |
|---:|---:|
| 1 | 2,000 XP |
| 2 | 3,000 XP |
| 3 | 4,500 XP |
| 4 | 6,750 XP |

Formülü değiştirmek isterseniz `utils/economy.js` içindeki `getRequiredXp()` fonksiyonunu düzenleyebilirsiniz.

To use a different formula, edit the `getRequiredXp()` function inside `utils/economy.js`.

## Kullanıcıya XP eklemek / Adding XP to a user

`rank` komutu yalnızca kayıtlı seviye verisini gösterir. Kendi mesaj, oyun veya komut sisteminizden kullanıcıya XP vermek için `addXpToUser()` fonksiyonunu kullanabilirsiniz.

The `rank` command only displays saved level data. Use `addXpToUser()` to award XP from your own message, game or command system.

```js
import {
  addXpToUser
} from './utils/economy.js';

const result = addXpToUser(
  userId,
  100
);
```

Fonksiyonun döndürdüğü sonuç:

Returned result:

```js
{
  user,
  xpAdded,
  leveledUp,
  levelsGained,
  newLevel,
  currentXp,
  requiredXp
}
```

Seviye atlamayı kontrol etmek için:

To check whether the user levelled up:

```js
const result = addXpToUser(
  userId,
  100
);

if (result.leveledUp) {
  console.log(
    `User reached level ${result.newLevel}`
  );
}
```

XP'nin hangi olayda ve ne kadar verileceği botun mevcut sistemine bağlıdır. Bu repository herhangi bir mesaj dinleyicisi veya zorunlu `index.js` yapısı eklemez.

When and how much XP should be awarded depends on your bot. This repository does not add a message listener or require a specific `index.js` structure.

## Dil desteği / Language support

Kart Türkçe ve İngilizce metinleri destekler.

The card supports Turkish and English text.

Slash komutlarında Discord tarafından gönderilen kullanıcı dili kullanılır. Prefix komutlarında ise sunucunun tercih edilen dili kontrol edilir.

For slash commands, the user's Discord locale is used. For prefix commands, the guild's preferred locale is checked.

İngilizce dışındaki dillerde Türkçe varsayılan dil olarak kullanılır.

Turkish is used as the fallback for languages other than English.

## Renkleri değiştirmek / Changing the colours

Kart renkleri doğrudan `commands/rank.js` içerisinden değiştirilebilir.

Card colours can be changed directly inside `commands/rank.js`.

Örnek renkler:

Example colours:

```js
// Pembe ışık / Pink glow
'rgba(235, 52, 183, 0.22)'

// Mavi ışık / Blue glow
'rgba(52, 140, 235, 0.20)'

// XP çubuğu / XP bar
'#348ceb'

// Seviye yazısı / Level text
'#eb4034'
```

## Verilerin korunması / Protecting user data

Gerçek kullanıcı verilerinin GitHub'a yüklenmemesi için `.gitignore` dosyanızda şu satır bulunmalıdır:

Your `.gitignore` should contain the following line so real user data is not uploaded to GitHub:

```gitignore
data/rankData.json
```

Önerilen `.gitignore` içeriği:

Recommended `.gitignore` content:

```gitignore
node_modules/
data/rankData.json
.env
logs/
```

## Notlar / Notes

- Kart görseli 750 × 260 piksel boyutundadır.
- Kullanıcı avatarı yüklenemezse gri bir yer tutucu gösterilir.
- Uzun kullanıcı adları kartın dışına taşmaması için kısaltılır.
- XP verileri bütün sunucularda ortak tutulur.
- Gerçek kullanıcı verilerini repository içerisine yüklemeyin.

---

- The card is rendered at 750 × 260 pixels.
- A grey placeholder is shown if the avatar cannot be loaded.
- Long usernames are shortened to prevent overflow.
- XP data is shared globally between guilds.
- Do not upload real user data to the repository.

## License

This project is available under the MIT License.

You may use, modify and redistribute the code under the terms of the included `LICENSE` file.

blabla test
