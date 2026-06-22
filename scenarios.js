// ─── Scenario Configs ────────────────────────────────────────────────────
// Single source of truth for all per-scenario data.
// To add a new scenario: add one entry here + one <option> in the HTML <select id="scenario">.
//
// Each entry shape:
//   id              – matches the <option value>
//   name            – { fa, en } display name
//   defaults        – { nPlayers, mafiaCount } recommended table size
//   allowedRoles    – which special roles are available in Setup
//   defaultToggles  – which of those are ON by default
//   wakeOrder       – { fa[], en[] } narrator wake-up order shown in the Wake tool
//   features        – { lastMove, endCards } boolean flags for scenario-exclusive UI
//   eliminationCards– [] or array of { id, fa, en } cards drawn on elimination
//   (Day step order comes from flow-configs/*.js, not from here.)
//   roleOverrides   – { roleId: { descFa } } per-scenario role description overrides

const SCENARIO_CONFIGS = {
  classic: {
    id: "classic",
    name: { fa: "کلاسیک", en: "Classic" },
    defaults: { nPlayers: 12, mafiaCount: 4 },
    allowedRoles: ["mafiaBoss", "detective", "doctor"],
    defaultToggles: ["mafiaBoss", "detective", "doctor"],
    wakeOrder: {
      fa: ["تیم مافیا", "پزشک", "کارآگاه"],
      en: ["Mafia team", "Doctor", "Detective"],
    },
    features: { lastMove: false, endCards: false },
    eliminationCards: [],
    roleOverrides: {},
  },
  devil: {
    id: "devil",
    name: { fa: "خون روی برج ساعت", en: "Blood on the Clocktower" },
    // Blood on the Clocktower style Trouble Brewing script: 7 Townsfolk, 2 Outsiders, 2 Minions, 1 Demon at 12 players.
    defaults: { nPlayers: 12, mafiaCount: 3 },
    baseRoles: { citizen: "devilTownsfolk", mafia: "devilMinion" },
    allowedRoles: [
      "devilWasherwoman", "devilLibrarian", "devilInvestigator", "devilChef", "devilEmpath", "devilFortuneTeller", "devilUndertaker",
      "devilMonk", "devilRavenkeeper", "devilVirgin", "devilSlayer", "devilSoldier", "devilMayor",
      "devilButler", "devilDrunk", "devilRecluse", "devilSaint",
      "devilPoisoner", "devilSpy", "devilScarletWoman", "devilBaron", "devilImp",
    ],
    defaultToggles: [
      "devilWasherwoman", "devilChef", "devilEmpath", "devilFortuneTeller", "devilUndertaker", "devilMonk", "devilSlayer",
      "devilRecluse", "devilSaint",
      "devilPoisoner", "devilScarletWoman", "devilImp",
    ],
    wakeOrder: {
      fa: ["مسموم‌کننده", "راهب", "بانوی سرخ‌پوش", "دیوچه", "نگهبان کلاغ", "همدل", "فال‌گیر", "گورکن", "پیشخدمت", "جاسوس"],
      en: ["Poisoner", "Monk", "Scarlet Woman", "Imp", "Ravenkeeper", "Empath", "Fortune Teller", "Undertaker", "Butler", "Spy"],
    },
    features: { lastMove: false, endCards: false },
    eliminationCards: [],
    roleOverrides: {},
  },
  bazras: {
    id: "bazras",
    name: { fa: "بازپرس", en: "Inspector" },
    defaults: { nPlayers: 10, mafiaCount: 3 },
    allowedRoles: ["mafiaBoss", "nato", "swindler", "detective", "doctor", "investigator", "researcher", "sniper", "invulnerable"],
    defaultToggles: ["mafiaBoss", "nato", "swindler", "detective", "doctor", "investigator", "researcher"],
    wakeOrder: {
      fa: ["محقق", "تیم مافیا", "شیاد", "پزشک", "تک‌تیرانداز", "کارآگاه", "بازپرس"],
      en: ["Researcher", "Mafia team", "Charlatan", "Doctor", "Sniper", "Detective", "Inspector"],
    },
    features: { lastMove: false, endCards: false },
    eliminationCards: [],
    roleOverrides: {
      doctor: { descFa: "هر شب می‌تواند جان یک نفر را از شلیک نجات دهد. نمی‌تواند دو شب پشت‌سرهم یک نفر را نجات دهد. در سناریو بازپرس، نجات خودش دو بار در کل بازی مجاز است." },
      swindler: { descFa: "هر شب یک نفر را «می‌زند». اگر به کارآگاه بزند، استعلامِ کارآگاه برای همه «منفی» می‌شود. در سناریو بازپرس می‌تواند دو شب پشت‌سرهم یک نفر را هدف بزند (تکرار مجاز است). شیاد با تیم مافیا آشناست و بعد از بیداری مافیا، مستقل بیدار می‌شود." },
      sniper: { descFa: "فقط یک شلیک در کل بازی دارد. اگر به شهروند شلیک کند → خودش خارج می‌شود (حتی اگر پزشک نجات دهد). در سناریو بازپرس: شلیک به رئیس مافیا → هیچ‌کس خارج نمی‌شود؛ شلیک به ناتو/شیاد/مافیا ساده (بدون سیو پزشک) → آن نفر خارج می‌شود." },
      investigator: { descFa: "هر شب دو نفر را برای بازپرسی انتخاب می‌کند. اگر هر دو نفر صبح روز بعد زنده باشند، بازپرسی آغاز می‌شود — هر کدام دو بار صحبت می‌کنند. بازپرس تصمیم می‌گیرد رأی‌گیری بین آن دو انجام شود یا نه." },
      researcher: { descFa: "محقق (هانتر): به‌جز شب معارفه می‌تواند هر شب خودش را به یک نفر «گره» بزند. در سناریو بازپرس: اگر لینک‌شده ناتو یا شیاد باشد، هنگام خروج محقق آن نفر هم خارج می‌شود. اگر رئیس مافیا باشد، رئیس خارج نمی‌شود." },
    },
  },
  namayande: {
    id: "namayande",
    name: { fa: "نماینده", en: "Representative" },
    // 10 players: 3 mafia (Don, Rebel, Hacker) + 7 city (Guide, Doctor, Minemaker, Bodyguard, Lawyer + 2 Citizens)
    // 12 players: + NATO (mafia) + Soldier (city) → 4 mafia + 8 city
    // 13 players: + NATO (mafia) + Soldier (city) + Citizen (city) → 4 mafia + 9 city
    defaults: { nPlayers: 10, mafiaCount: 3 },
    allowedRoles: ["don", "rebel", "hacker", "nato", "doctor", "guide", "minemaker", "bodyguard", "lawyer", "soldier", "citizen"],
    defaultToggles: ["don", "rebel", "hacker", "doctor", "guide", "minemaker", "bodyguard", "lawyer"],
    wakeOrder: {
      fa: ["هکر", "تیم مافیا (دن)", "راهنما", "پزشک", "محافظ", "سرباز", "مین‌گذار", "وکیل"],
      en: ["Hacker", "Mafia team (Don)", "Guide", "Doctor", "Bodyguard", "Soldier", "Minemaker", "Lawyer"],
    },
    features: { lastMove: false, endCards: false },
    eliminationCards: [],
    roleOverrides: {
      doctor: { descFa: "هر شب می‌تواند جان یک نفر را نجات دهد. نمی‌تواند دو شب پشت‌سرهم یک نفر را نجات دهد. در سناریو نماینده، نجات خودش دو بار در کل بازی مجاز است." },
      rebel: { descFa: "در سناریو نماینده: هر زمان که یکی از یارهای تیم مافیا (دون مافیا یا هکر یا ناتو) از بازی خارج شود، ضامن یاغی آزاد می‌شود. یاغی می‌تواند تا قبل از شروع رأی‌گیری اول، با یکی از شهروندان منفجر شود. اگر هدف توسط محافظ محافظت شده باشد یا خودش محافظ باشد، یاغی به تنهایی خارج می‌شود." },
      guide: { descFa: "هر شب یکی از بازیکنان را برای راهنمایی انتخاب می‌کند. در سناریو نماینده نمی‌تواند اسپم کند (شب‌های متوالی روی یک نفر). اگر یکی از مافیاها را انتخاب کند، هویت راهنما برای تیم مافیا افشا می‌شود." },
    },
  },
  mozaker: {
    id: "mozaker",
    name: { fa: "مذاکره", en: "Negotiator" },
    defaults: { nPlayers: 10, mafiaCount: 3 },
    allowedRoles: ["mafiaBoss", "negotiator", "detective", "doctor", "armored", "reporter", "sniper"],
    defaultToggles: ["mafiaBoss", "negotiator", "detective", "doctor", "armored", "reporter"],
    wakeOrder: {
      fa: ["تیم مافیا", "پزشک", "کارآگاه", "مذاکره‌کننده", "خبرنگار"],
      en: ["Mafia team", "Doctor", "Detective", "Negotiator", "Reporter"],
    },
    features: { lastMove: false, endCards: false },
    eliminationCards: [],
    roleOverrides: {
      negotiator: { descFa: "اگر یک یا دو نفر از اعضای مافیا از بازی خارج شده باشند، مذاکره‌کننده می‌تواند در شب مذاکره انجام دهد و یک شهروند ساده یا زره‌پوشِ زره‌دار را به مافیای ساده تبدیل کند. اگر نقش دیگری را انتخاب کند مذاکره شکست می‌خورد. در شب مذاکره، مافیا حق شلیک ندارد." },
    },
  },
  takavar: {
    id: "takavar",
    name: { fa: "تکاور", en: "Commando" },
    defaults: { nPlayers: 10, mafiaCount: 3 },
    allowedRoles: ["mafiaBoss", "nato", "hostageTaker", "guardian", "detective", "doctor", "commando", "gunslinger"],
    defaultToggles: ["mafiaBoss", "nato", "hostageTaker", "guardian", "detective", "doctor", "commando", "gunslinger"],
    wakeOrder: {
      fa: ["نگهبان", "گروگانگیر", "تیم مافیا (دن + ناتو)", "کارآگاه", "تکاور", "پزشک", "تفنگدار"],
      en: ["Guardian", "Hostage-Taker", "Mafia team (Don + NATO)", "Detective", "Commando", "Doctor", "Gunner"],
    },
    features: { lastMove: false, endCards: false },
    eliminationCards: [],
    roleOverrides: {
      mafiaBoss: { descFa: "دن مافیاست؛ شلیک شب را تعیین می‌کند. استعلام برای کارآگاه همیشه «منفی» (شهروند) است." },
      nato: { descFa: "یک‌بار در بازی نقش یک شهروند را حدس می‌زند؛ درست → آن بازیکن خارج می‌شود؛ غلط → هیچ اتفاقی نمی‌افتد (سکوت). شب استفاده از ناتو معمولاً بدون شلیک مافیاست." },
      gunslinger: { descFa: "تفنگدار: شب تعدادی گلوله خالی (نامحدود) و ۱ گلوله واقعی به بازیکنان می‌دهد. خودش نمی‌تواند گلوله واقعی را به خودش بدهد. دریافت‌کننده گلوله واقعی می‌تواند روز بعد استفاده کند." },
    },
  },
  kabo: {
    id: "kabo",
    name: { fa: "کاپو", en: "Capo" },
    defaults: { nPlayers: 10, mafiaCount: 3 },
    allowedRoles: ["danMafia", "witch", "executioner", "detective", "heir", "herbalist", "armorsmith", "suspect", "informant", "kadkhoda"],
    defaultToggles: ["danMafia", "witch", "executioner", "detective", "heir", "herbalist", "armorsmith", "suspect"],
    wakeOrder: {
      fa: ["وارث", "عطار", "تیم مافیا (جادوگر/دن/جلاد)", "کارآگاه", "زره‌ساز", "کدخدا"],
      en: ["Heir", "Herbalist", "Mafia team (Witch/Don/Executioner)", "Detective", "Armorsmith", "Village Chief"],
    },
    features: { lastMove: false, endCards: false },
    eliminationCards: [],
    roleOverrides: {
      danMafia: { descFa: "رهبر تیم مافیا در سناریو کاپو. تفنگ کاپو: هر شب ترتیب صف گلوله را بین مظنون‌ها تعیین می‌کند. صبح روز بعد (از روز ۲ به بعد) نفر اول صف یک‌بار دفاع می‌کند، سپس کاپو شلیک می‌کند یا رها می‌کند." },
    },
  },
  pedarkhande: {
    id: "pedarkhande",
    name: { fa: "پدرخوانده", en: "Godfather" },
    defaults: { nPlayers: 11, mafiaCount: 3 },
    allowedRoles: ["godfather", "matador", "saulGoodman", "watson", "leon", "citizenKane", "constantine", "nostradamus"],
    defaultToggles: ["godfather", "matador", "saulGoodman", "watson", "leon", "citizenKane", "constantine", "nostradamus"],
    voteThreshold: "half_minus_one", // defense = floor(eligible/2) - 1 (نصف منهای یک); elimination = ceil(eligible/2) (نصف یا بیشتر)
    wakeOrder: {
      fa: ["نوستراداموس (فقط شب معارفه)", "تیم مافیا (پدرخوانده/ماتادور/ساول)", "دکتر واتسون", "لئون", "همشهری کین", "کنستانتین"],
      en: ["Nostradamus (intro night only)", "Mafia team (Godfather/Matador/Saul)", "Dr. Watson", "Leon", "Citizen Kane", "Constantine"],
    },
    features: { lastMove: false, endCards: true },
    eliminationCards: [
      { id: "silence_lambs", fa: "سکوت بره‌ها", en: "Silence of the Lambs" },
      { id: "identity_reveal", fa: "افشای هویت", en: "Identity reveal" },
      { id: "beautiful_mind", fa: "ذهن زیبا", en: "Beautiful Mind" },
      { id: "handcuffs", fa: "دستبند", en: "Handcuffs" },
      { id: "face_change", fa: "تغییر چهره", en: "Face Off" },
    ],
    roleOverrides: {
      godfather: { descFa: "در سناریو پدرخوانده یک جلیقه دارد و «حس ششم» دارد. تیم مافیا هر شب معمولاً یکی را انتخاب می‌کند: یا شلیک، یا استفاده از حس ششم، یا خرید توسط ساول (طبق قوانین سناریو)." },
      matador: { descFa: "شب‌ها با تیم مافیا بیدار می‌شود. هر شب یک نفر را نشان می‌دهد؛ آن نفر ۲۴ ساعت قابلیت ندارد. نمی‌تواند دو شب متوالی یک نفر را انتخاب کند (طبق سناریو پدرخوانده)." },
      saulGoodman: { descFa: "معمولاً فقط یک‌بار می‌تواند یک «شهروند ساده» را بخرد و به «مافیا ساده» تبدیل کند؛ در شبی که خرید انجام می‌شود، گرداننده اعلام می‌کند خریداری انجام خواهد شد (طبق سناریو پدرخوانده)." },
      watson: { descFa: "مثل پزشک عمل می‌کند: هر شب می‌تواند جان یک نفر را نجات دهد و جان خودش را فقط یک‌بار در کل بازی می‌تواند نجات دهد (طبق سناریو پدرخوانده)." },
      leon: { descFa: "می‌تواند (طبق قوانین سناریو) محدود شلیک کند؛ اگر به شهروند شلیک کند، خودش کشته می‌شود و معمولاً دکتر نمی‌تواند او را نجات دهد. یک جلیقه هم دارد (طبق سناریو پدرخوانده)." },
      citizenKane: { descFa: "یک‌بار یک نفر را نشان می‌دهد؛ اگر مافیا باشد، گرداننده روز بعد نقشش را افشا می‌کند (در بازی می‌ماند) و همان شب کین با تیر غیب خارج می‌شود. اگر اشتباه: اتفاقی نمی‌افتد، کین قابلیتش را از دست می‌دهد (طبق سناریو پدرخوانده)." },
      constantine: { descFa: "یک‌بار می‌تواند یکی از بازیکنان اخراجی (نقش افشا نشده) را برگرداند. نمی‌تواند کسی که با حس ششم یا کارت افشای هویت خارج شده را برگرداند (طبق سناریو پدرخوانده)." },
      nostradamus: { descFa: "فقط شب معارفه بیدار می‌شود. ۳ نفر را نشان می‌دهد و گرداننده تعداد مافیاهای داخل این ۳ نفر را اعلام می‌کند. سپس نوستراداموس ساید خود را انتخاب می‌کند؛ اگر بین ۳ نفر، ۲ مافیا باشد معمولاً مجبور است در ساید مافیا بازی کند (طبق سناریو پدرخوانده)." },
    },
  },
  zodiac: {
    id: "zodiac",
    name: { fa: "زودیاک", en: "Zodiac" },
    defaults: { nPlayers: 12, mafiaCount: 3 },
    allowedRoles: ["alcapone", "zodiac", "magician", "bomber", "detective", "doctor", "professional", "guard", "ocean", "gunslinger"],
    defaultToggles: ["alcapone", "zodiac", "magician", "bomber", "detective", "doctor", "professional", "guard", "ocean", "gunslinger"],
    wakeOrder: {
      fa: ["تیم مافیا", "شعبده‌باز", "بمب‌گذار", "حرفه‌ای", "پزشک", "کارآگاه", "تفنگدار", "اوشن", "زودیاک"],
      en: ["Mafia team", "Magician", "Bomber", "Professional", "Doctor", "Detective", "Gunslinger", "Ocean", "Zodiac"],
    },
    features: { lastMove: false, endCards: false },
    eliminationCards: [],
    roleOverrides: {},
  },
  meeting_epic: {
    id: "meeting_epic",
    name: { fa: "میتینگ/اپیک", en: "Meeting/Epic" },
    defaults: { nPlayers: 12, mafiaCount: 4 },
    allowedRoles: ["mafiaBoss", "nato", "natasha", "doctorLecter", "detective", "doctor", "sniper", "armored", "judge", "commander", "priest"],
    defaultToggles: ["mafiaBoss", "nato", "natasha", "doctorLecter", "detective", "doctor", "sniper", "armored"],
    wakeOrder: {
      fa: ["ناتاشا", "تیم مافیا (رئیس/ناتو)", "دکتر لکتر", "پزشک", "کارآگاه", "تک‌تیرانداز"],
      en: ["Natasha", "Mafia team (Boss/NATO)", "Dr. Lecter", "Doctor", "Detective", "Sniper"],
    },
    features: { lastMove: false, endCards: false },
    eliminationCards: [],
    roleOverrides: {},
  },
  classicPro: {
    id: "classicPro",
    name: { fa: "کلاسیک پرو", en: "Classic Pro" },
    defaults: { nPlayers: 18, mafiaCount: 6 },
    allowedRoles: [
      "snowman", "armorer",
      "enchantress", "antiLadyVoodoo",
      "interrogator", "citizenBomber", "mafBomber",
      "godfather", "perizad", "doctor",
      "tyler", "tiebreaker", "terrorist", "gunmaker", "sniper",
      "wizard", "mafSpy", "surgeon", "jackIndep",
      "luggageBearer",
      "saboteur",
      "doubler", "thief", "duelmanMafia",
      "tracker", "psychShooter", "psycho", "russianRoulette", "invulnerable", "reaper",
      "clockmaker", "bartender",
      "shahkesh",
      "outcast",
      "spiderCity",
      "devout", "devotee", "freemason", "commander",
      "judge", "gamblerMafia",
      "cowboy", "detective", "specialDetective", "priest", "killer",
      "gamblerIndep", "gravedigger",
      "leader", "ladyVoodoo",
      "protector", "inventorCity", "evilInventor", "strongman", "mistress",
      "natasha", "nato", "savior", "nero", "guardian",
      "mafiaLawyer",
      "yakuza",
    ],
    defaultToggles: [
      // Mafia
      "enchantress", "godfather", "mafSpy", "thief", "outcast", "ladyVoodoo",
      // City
      "doctor", "tyler", "gunmaker", "sniper",
      "invulnerable", "freemason", "commander", "cowboy", "detective",
    ],
    wakeOrder: {
      fa: ["نگهبان", "دَبِل", "ساقی", "افسون‌گر", "دزد", "ناتاشا", "یاکوزا", "طردشده", "وکیل مافیا", "شاه‌کش", "روانی", "لیدی وودو", "تیم مافیا (پدرخوانده)", "جراح", "روان‌شناس", "پزشک", "آهنگر", "فراماسون/تایلر", "تفنگ‌دار", "فداکار", "لیدر", "کارآگاه", "کارآگاه ویژه", "تک‌تیرانداز/فرمانده", "ردگیر", "جادوگر", "انتی لیدی وودو", "آدم‌برفی", "کشیش", "پریزاد", "ریپر", "کیلر", "نرون", "جک", "گمبلر"],
      en: ["Guardian", "Doubler", "Bartender", "Enchantress", "Thief", "Natasha", "Yakuza", "Outcast", "Mafia Lawyer", "Shahkesh", "Psycho", "Lady Voodoo", "Mafia team (Godfather)", "Surgeon", "Psychologist", "Doctor", "Armorer", "Freemason/Tyler", "Gunmaker", "Devout", "Leader", "Detective", "Special Detective", "Sniper/Commander", "Tracker", "Wizard", "Anti-Lady Voodoo", "Snowman", "Priest", "Perizad", "Reaper", "Killer", "Nero", "Jack", "Gambler"],
    },
    features: { lastMove: false, endCards: false },
    eliminationCards: [],
    roleOverrides: {
      judge: { descFa: "بعد از پایان رأی‌گیری دور دوم، گرداننده همه را می‌خواند تا چشم ببندند و قاضی به تنهایی بیدار می‌شود. قاضی باید رأی خروج مردم شهر را تأیید کند. یک‌بار می‌تواند رأی‌گیری را باطل کند — در این صورت هیچ‌کس خارج نمی‌شود و قاضی به شهروند ساده تبدیل می‌شود. اگر خودش در دفاع باشد نمی‌تواند از قابلیتش استفاده کند. اگر ساقی شب قبل او را مست کرده باشد و همان روز بخواهد رأی‌گیری را لغو کند، قابلیتش بی‌اثر می‌شود و تنها شانس استفاده را از دست می‌دهد." },
      terrorist: { descFa: "عضو مافیاست اما تیم مافیا را نمی‌شناسد و آن‌ها هم او را نمی‌شناسند. اگر در روز با رأی‌گیری یا روش دیگری قطعاً از بازی خارج شود، می‌تواند نقشش را اعلام کند و یک نفر دلخواه را همراه خودش از بازی بیرون ببرد. اگر قبل از حذف قطعی نقشش را اعلام کند، به تنهایی بیرون می‌رود. اگر در شب کشته شود نمی‌تواند از قابلیتش استفاده کند. اگر هدفش زره داشته باشد، تروریست به تنهایی حذف می‌شود. اگر محافظ در بازی باشد و از قابلیتش استفاده کند، قربانی تروریست نجات می‌یابد و تروریست به تنهایی حذف می‌شود." },
      sniper: { descFa: "تعداد تیرها معمولاً یک سوم مافیاست و قابل ذخیره‌اند. دکتر می‌تواند قربانی را نجات دهد. اگر فرمانده در بازی باشد شلیک باید به تأیید او برسد — اگر فرمانده رد کند تیر کم نمی‌شود. اگر تک‌تیرانداز به خود فرمانده شلیک کند، فرمانده نمی‌تواند آن را لغو کند. شلیک تک‌تیرانداز رویین‌تن را می‌کشد اما بر محافظ و مستقل‌ها تأثیری ندارد. اگر ساقی تک‌تیرانداز را مست کرده باشد و فرمانده شلیک را تأیید کند، خودِ تک‌تیرانداز کشته می‌شود. اگر در شب استراحت ریپر به ریپر شلیک کند، خودِ تک‌تیرانداز کشته می‌شود." },
      freemason: { descFa: "هر شب یک نفر را انتخاب می‌کند تا به اتحاد شهروندی اضافه کند. اگر مافیا باشد هر دو همان شب از بازی خارج می‌شوند (مرگ ماسونی). اگر شهروند باشد هر دو می‌فهمند طرف مقابل شهروند است. اگر تایلر در بازی باشد شب اول تایلر را می‌شناسد و هر شب با هم بیدار می‌شوند. جاسوس مافیا اگر بیدار شود به عنوان شهروند معرفی می‌شود اما اگر مستقل وارد اتحاد شود مرگ ماسونی رخ می‌دهد. اگر فراماسون حذف شود، تایلر جانشین می‌شود." },
      detective: { descFa: "هر شب می‌تواند استعلام یک نفر را بگیرد؛ پدرخوانده و مستقل‌ها همیشه «شهروند» نمایش داده می‌شوند. یک شلیک مهلک دارد — یک‌بار در شب به جای استعلام می‌تواند شلیک کند. شلیک مهلک رویین‌تن، محافظ، مستقل‌ها و طردشده (در چهار شب اول) را هم از پای درمی‌آورد؛ دکتر نمی‌تواند نجات دهد. تنها راه نجات زره آهنگر است. پس از استفاده از شلیک، کارآگاه دیگر استعلام هم ندارد. اگر دزد کارآگاه را انتخاب کند، دزد دستگیر می‌شود." },
      doctor: { descFa: "تعداد کل نجات‌های دکتر در طول بازی نصف تعداد کل بازیکنان است. هر شب می‌تواند یک یا چند نفر را نجات دهد و خودش هم می‌تواند جزو آن‌ها باشد (اگر آخرین نجات نباشد باید حداقل یک نفر دیگر را هم انتخاب کند). نمی‌تواند دو شب پشت سر هم یک نفر را نجات دهد. از شلیک مهلک مرد قوی، کارآگاه، حمله شاه‌کش، تسخیر پریزاد، انفجار شب بمبر، مرگ ماسونی، انتخاب فداکار و آتش چخماق نمی‌تواند نجات دهد." },
      priest: { descFa: "شب‌ها هدف ناتاشا را حدس می‌زند؛ اگر درست تشخیص دهد، سایلنت خنثی می‌شود. همچنین می‌تواند به یک بازیکن یک دقیقه وقت صحبت اضافه بدهد (به خودش نمی‌تواند). اگر در روز با رأی‌گیری از بازی حذف شود، نقشش اعلام می‌شود و سپس یک نفر را انتخاب می‌کند تا گرداننده جناح آن نفر (مثبت/منفی/مستقل) را اعلام کند. اگر یکی از سایه‌های پریزاد را انتخاب کند، آن سایه همان شب حذف می‌شود." },
      guardian: { descFa: "وظیفه‌اش نگهبانی از شهر در برابر دزد یا افسون‌گر است. هر شب قبل از دزد یا افسون‌گر بیدار می‌شود و یک نفر را انتخاب می‌کند؛ اگر دزد یا افسون‌گر در همان شب آن بازیکن را انتخاب کنند، افسون یا دزدی‌شان بی‌نتیجه خواهد بود. اگر دزد از خود نگهبان دزدی کند، دستگیر شده و حذف می‌شود. از نگهبان و کارآگاه در یک بازی همزمان استفاده نمی‌شود." },
      invulnerable: { descFa: "در شب با شلیک مافیا یا مستقل‌ها کشته نمی‌شود؛ چخماق هم نمی‌تواند او را نفتی کند. اما در برابر شلیک تک‌تیرانداز و روان‌شناس، حمله بمبر و کابوی، انفجار تروریست و مرگ ماسونی بی‌دفاع است. شلیک مهلک مرد قوی، کارآگاه و حمله شاه‌کش هم او را حذف می‌کنند. اگر ساقی مست کند یا دزد قابلیتش را بدزدد، آن شب با هر تیری کشته می‌شود." },
      natasha: { descFa: "هر شب یک نفر را انتخاب می‌کند تا روز بعد نتواند صحبت، رأی بدهد یا حرکتی داشته باشد (سایلنت). نمی‌تواند دو شب پشت‌سرهم یک نفر را سایلنت کند. تروریست، کابوی و بمبر اگر فلج شوند باز هم می‌توانند از قابلیت انتحاریشان استفاده کنند. اگر کسی که تفنگ‌دار به او تفنگ داده فلج شود، روز بعد نمی‌تواند از تفنگش استفاده کند." },
      commander: { descFa: "اگر تک‌تیرانداز در شب شلیک کند، فرمانده بعد از او بیدار می‌شود تا شلیک را تأیید یا رد کند. اگر رد کند، شلیک انجام نمی‌شود و از تیرهای تک‌تیرانداز کم نمی‌شود. اگر خود فرمانده هدف تک‌تیرانداز باشد، نمی‌تواند شلیک را لغو کند و کشته خواهد شد. اگر ساقی فرمانده را مست کرده باشد، حتی اگر شلیک را رد کند باز هم تیر شلیک خواهد شد." },
    },
  },
  shab_mafia: {
    id: "shab_mafia",
    name: { fa: "شب مافیا", en: "Mafia Nights" },
    defaults: { nPlayers: 12, mafiaCount: 4 },
    allowedRoles: ["godfather", "doctorLecter", "jokerMafia", "detective", "doctor", "professional", "hardJohn", "psychologist", "mayor", "seller"],
    defaultToggles: ["godfather", "doctorLecter", "jokerMafia", "detective", "doctor", "professional", "hardJohn", "psychologist", "mayor", "seller"],
    wakeOrder: {
      fa: ["تیم مافیا", "دکتر لکتر", "جوکر مافیا", "کارآگاه", "حرفه‌ای", "پزشک"],
      en: ["Mafia team", "Dr. Lecter", "Mafia Joker", "Detective", "Professional", "Doctor"],
    },
    features: { lastMove: true, endCards: false },
    eliminationCards: [
      { id: "insomnia", fa: "بی‌خوابی", en: "Insomnia" },
      { id: "final_shot", fa: "شلیک نهایی", en: "Final Shot" },
      { id: "beautiful_mind", fa: "ذهن زیبا", en: "Beautiful Mind" },
      { id: "thirteen_lies", fa: "دروغ سیزده", en: "Thirteen Lies" },
      { id: "green_mile", fa: "مسیر سبز", en: "Green Mile" },
      { id: "red_carpet", fa: "فرش قرمز", en: "Red Carpet" },
    ],
    roleOverrides: {
      godfather: { descFa: "در «شب‌های مافیا»، پدرخوانده/آل‌کاپون شلیکِ شب را تعیین می‌کند و استعلام او برای کارآگاه «شهروند» نمایش داده می‌شود." },
    },
  },
};

function getScenarioConfig(scenarioId) {
  const cfg = SCENARIO_CONFIGS[scenarioId];
  if (cfg) return cfg;
  // Case-insensitive fallback for camelCase scenario IDs (e.g. "classicpro" → "classicPro")
  const lower = String(scenarioId || "").toLowerCase();
  for (const k of Object.keys(SCENARIO_CONFIGS)) {
    if (k.toLowerCase() === lower) return SCENARIO_CONFIGS[k];
  }
  return SCENARIO_CONFIGS["classic"];
}
