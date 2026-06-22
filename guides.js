// ─── Scenario Guides ─────────────────────────────────────────────────────────
// Comprehensive bilingual (FA/EN) moderator & player guides for each scenario.
// Dependencies (all globals, resolved at call time): appLang, getScenarioConfig, openToolModal, t.

// ── internal helpers ──────────────────────────────────────────────────────────
function _escHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
function _gs(title, body) {
  return (
    '<div style="margin-bottom:14px;">' +
    '<div style="font-weight:1050;font-size:13px;padding-bottom:4px;margin-bottom:8px;border-bottom:1px solid var(--border);">' +
    title + '</div>' +
    '<div style="font-size:12px;line-height:1.9;color:var(--muted);">' +
    body + '</div></div>'
  );
}
function _gw(arr) {
  return '<div class="toolBox" style="font-size:12px;line-height:1.75;">' + arr.join('') + '</div>';
}

// ── Guide content ─────────────────────────────────────────────────────────────
const SCENARIO_GUIDES = {

  // ══════════════════════════════════════════════════════════════════════════
  classic: {
    fa: _gw([
      _gs('معرفی و ترکیب', [
        'سناریو پایه‌ای و ساده‌ترین نسخه. مناسب برای ۱۰ تا ۱۴ نفر (پیش‌فرض: ۱۲ نفر، ۴ مافیا).',
        '<br /><b>تیم مافیا:</b> رئیس مافیا + مافیا ساده',
        '<br /><b>تیم شهر:</b> کارآگاه + پزشک + شهروند ساده',
        '<br />نسبت پیشنهادی: به ازای هر ۳ شهروند، ۱ مافیا.',
      ].join('')),
      _gs('شب معارفه (شب صفر)', [
        'همه چشم می‌بندند.',
        '<br />گرداننده: «تیم مافیا چشم باز کنید» → مافیا یکدیگر را می‌شناسند و رئیس مافیا را می‌دانند → چشم می‌بندند.',
        '<br />در شب معارفه معمولاً شلیک/نجات/استعلام انجام نمی‌شود (گرداننده ممکن است پزشک و کارآگاه را هم بیدار کند تا مطمئن شود روند را می‌دانند، ولی نتیجه اعمال نمی‌شود).',
      ].join('')),
      _gs('ترتیب شب (شب اول به بعد)', [
        '<b>۱. تیم مافیا:</b> بیدار می‌شوند → با اشاره هدف شلیک را انتخاب می‌کنند → چشم می‌بندند.',
        '<br /><b>۲. پزشک:</b> بیدار می‌شود → یک نفر را برای نجات انتخاب می‌کند → چشم می‌بندد.',
        '<br />&nbsp;&nbsp;• نمی‌تواند دو شب پشت‌سرهم یک نفر را نجات دهد (اکثر قوانین).',
        '<br />&nbsp;&nbsp;• نجات خود: فقط یک‌بار در کل بازی مجاز است.',
        '<br /><b>۳. کارآگاه:</b> بیدار می‌شود → یک نفر را نشان می‌دهد → گرداننده با علامت جواب می‌دهد (۱ انگشت = شهروند / بیشتر = مافیا) → چشم می‌بندد.',
        '<br /><b>پایان شب:</b> گرداننده نتیجه را اعلام می‌کند.',
      ].join('')),
      _gs('فاز روز', [
        '<b>اعلام نتیجه:</b> گرداننده می‌گوید چه کسی از بازی خارج شد (یا نجات پیدا کرد).',
        '<br /><br /><b>بحث:</b> هر بازیکن فرصت صحبت دارد. مدت بحث معمولاً ۲ دقیقه است.',
        '<br /><br /><b>رأی‌گیری:</b> بازیکنان روی یک نفر رأی می‌دهند.',
        '<br />&nbsp;&nbsp;• اگر اکثریتِ قانونی (بیشتر از نصف حاضران) روی یک نفر متمرکز شود → آن نفر به دفاعیه می‌رود.',
        '<br />&nbsp;&nbsp;• اگر آرا پراکنده باشد → رأی‌گیری مجدد انجام می‌شود یا شب می‌شود (قوانین میز).',
        '<br /><br /><b>دفاعیه:</b> فرد دفاعیه‌رفته دفاع می‌کند (معمولاً ۳۰–۶۰ ثانیه).',
        '<br /><br /><b>حذف:</b> رأی نهایی. اکثریت می‌توانند حذف کنند → نقش فرد حذف‌شده اعلام می‌شود.',
      ].join('')),
      _gs('قوانین خاص', [
        '<b>رئیس مافیا:</b> استعلام کارآگاه همیشه «شهروند» (منفی) نمایش می‌دهد.',
        '<br /><b>مافیا ساده:</b> استعلام کارآگاه «مافیا» (مثبت) نشان می‌دهد.',
        '<br /><b>حرف آخر:</b> بازیکن حذف‌شده معمولاً یک حرف آخر کوتاه دارد (قوانین میز).',
      ].join('')),
      _gs('شرط پیروزی', [
        '<b>شهر:</b> همه اعضای مافیا از بازی خارج شوند.',
        '<br /><b>مافیا:</b> تعداد مافیا برابر یا بیشتر از شهروندان باقی‌مانده شود.',
      ].join('')),
    ]),
    en: _gw([
      _gs('Overview & Composition', [
        'The base Mafia scenario. Best for 10–14 players (default: 12 players, 4 mafia).',
        '<br /><b>Mafia team:</b> Mafia Boss + Simple Mafia members',
        '<br /><b>City team:</b> Detective + Doctor + Citizens',
        '<br />Recommended ratio: 1 mafia per 3 citizens.',
      ].join('')),
      _gs('Intro Night (Night 0)', [
        'All players close eyes.',
        '<br />Host: "Mafia team, open eyes." Mafia learn each other and identify the Boss → close eyes.',
        '<br />No shots/saves/inquiries occur on Night 0 (Host may run Doctor/Detective through motions so they know the process, but no effects apply).',
      ].join('')),
      _gs('Night Phase (Night 1+)', [
        '<b>1. Mafia team:</b> Open eyes → silently agree on target → close eyes.',
        '<br /><b>2. Doctor:</b> Opens eyes → selects a player to save → closes eyes.',
        '<br />&nbsp;&nbsp;• Cannot protect the same person on consecutive nights (most rule sets).',
        '<br />&nbsp;&nbsp;• Self-save: usually once per game.',
        '<br /><b>3. Detective:</b> Opens eyes → points at a player → Host signals: 1 finger = citizen, more fingers = mafia → closes eyes.',
        '<br /><b>End of night:</b> Host announces result.',
      ].join('')),
      _gs('Day Phase', [
        '<b>Night result:</b> Host announces who was eliminated or saved.',
        '<br /><br /><b>Discussion:</b> Each player speaks in turn (~2 minutes total).',
        '<br /><br /><b>Vote:</b> Players vote on one player to defend.',
        '<br />&nbsp;&nbsp;• Legal majority (more than half) on one player → defense.',
        '<br />&nbsp;&nbsp;• Scattered votes → re-vote or night begins (table rules).',
        '<br /><br /><b>Defense:</b> Defendant speaks (30–60 seconds).',
        '<br /><br /><b>Elimination:</b> Final vote. Majority eliminates → role is revealed.',
      ].join('')),
      _gs('Special Rules', [
        '<b>Mafia Boss:</b> Always shows as "citizen" (negative) to the Detective.',
        '<br /><b>Simple Mafia:</b> Shows as "mafia" (positive) to the Detective.',
        '<br /><b>Last words:</b> Eliminated player may say a brief final statement (table rules).',
      ].join('')),
      _gs('Win Conditions', [
        '<b>City:</b> All mafia members eliminated.',
        '<br /><b>Mafia:</b> Mafia count equals or exceeds remaining citizens.',
      ].join('')),
    ]),
  },

  // ══════════════════════════════════════════════════════════════════════════
  bazras: {
    fa: _gw([
      _gs('معرفی و ترکیب', [
        'سناریو بازپرس. مناسب برای ۱۰، ۱۲ یا ۱۳ نفر (پیش‌فرض: ۱۰ نفر، ۳ مافیا).',
        '<br /><b>تیم مافیا:</b> رئیس مافیا + شیاد + ناتو + (مافیا ساده — در ۱۲ و ۱۳ نفر اضافه می‌شود)',
        '<br /><b>تیم شهر:</b> کارآگاه + پزشک + بازپرس + محقق (هانتر) + رویین‌تن (اختیاری) + تک‌تیرانداز (در ۱۲/۱۳ نفر) + شهروند',
        '<br />شیاد با تیم مافیا آشناست ولی به‌طور مستقل بیدار می‌شود.',
      ].join('')),
      _gs('شب معارفه', [
        'تیم مافیا بیدار می‌شوند → یکدیگر را می‌شناسند → چشم می‌بندند.',
        '<br />شیاد بیدار می‌شود → تیم مافیا را می‌شناسد → چشم می‌بندد.',
        '<br />محقق <b>شب معارفه لینک نمی‌زند</b> (فقط از شب اول به بعد).',
      ].join('')),
      _gs('ترتیب شب', [
        '<b>۱. محقق (هانتر):</b> بیدار می‌شود → یک نفر را برای لینک انتخاب می‌کند → چشم می‌بندد.',
        '<br />&nbsp;&nbsp;• اگر محقق با شات شب یا رأی از بازی خارج شود، لینک‌شده هم خارج می‌شود — فقط اگر لینک‌شده ناتو یا شیاد باشد.',
        '<br />&nbsp;&nbsp;• استثنا: اگر لینک‌شده رئیس مافیا باشد، رئیس خارج نمی‌شود.',
        '<br /><b>۲. تیم مافیا:</b> بیدار می‌شوند → شلیک یا سوداگری انتخاب می‌کنند → چشم می‌بندند.',
        '<br />&nbsp;&nbsp;• <b>سوداگری (یک‌بار در کل بازی):</b> رئیس مافیا یک عضو مافیا را فدا می‌کند (فردا حذف می‌شود) + یک شهروند ساده یا رویین‌تن را به مافیا تبدیل می‌کند.',
        '<br />&nbsp;&nbsp;• اگر هدف سوداگری نقش دیگری داشته باشد → سوداگری شکست می‌خورد.',
        '<br /><b>۳. شیاد:</b> بیدار می‌شود → یک نفر را نشان می‌دهد → چشم می‌بندد.',
        '<br />&nbsp;&nbsp;• اگر شیاد کارآگاه را هدف قرار دهد → استعلام کارآگاه آن شب «منفی» می‌شود.',
        '<br />&nbsp;&nbsp;• در سناریو بازپرس، شیاد می‌تواند دو شب پشت‌سرهم یک نفر را هدف بزند.',
        '<br /><b>۴. پزشک:</b> بیدار می‌شود → یک نفر را نجات می‌دهد → چشم می‌بندد.',
        '<br />&nbsp;&nbsp;• نجات خود: فقط <b>دو بار</b> در کل بازی مجاز است.',
        '<br /><b>۵. تک‌تیرانداز (اگر فعال باشد):</b> بیدار می‌شود → اگر می‌خواهد شلیک کند، هدف را نشان می‌دهد → چشم می‌بندد.',
        '<br />&nbsp;&nbsp;• شلیک به شهروند → تک‌تیرانداز خارج می‌شود (حتی اگر پزشک نجات دهد).',
        '<br />&nbsp;&nbsp;• شلیک به ناتو/شیاد/مافیا ساده (بدون سیو) → آن نفر خارج می‌شود.',
        '<br />&nbsp;&nbsp;• شلیک به رئیس مافیا → <b>هیچ‌کس خارج نمی‌شود</b>.',
        '<br /><b>۶. کارآگاه:</b> بیدار می‌شود → استعلام می‌گیرد → گرداننده جواب می‌دهد → چشم می‌بندد.',
        '<br />&nbsp;&nbsp;• استعلام رئیس مافیا همیشه «شهروند» (منفی) است.',
        '<br /><b>۷. بازپرس:</b> بیدار می‌شود → دو نفر را برای بازپرسی انتخاب می‌کند → چشم می‌بندد.',
      ].join('')),
      _gs('فاز روز — بازپرسی', [
        '<b>بازپرس هر شب دو نفر را انتخاب می‌کند.</b> اگر هر دو نفر فردا زنده باشند، بازپرسی آغاز می‌شود.',
        '<br />• هر کدام دو بار صحبت می‌کنند (هر بار ۱–۲ دقیقه).',
        '<br />• بازپرس تصمیم می‌گیرد رأی‌گیری بین آن دو نفر انجام شود یا نه.',
        '<br />• اگر رأی‌گیری باشد: اجباری است — هر کسی بیشتر رأی بیاورد خارج می‌شود.',
        '<br />• بازپرسی جدا از رأی‌گیری عادی روز است.',
      ].join('')),
      _gs('قوانین خاص', [
        '<b>رئیس مافیا:</b> استعلام کارآگاه همیشه «شهروند» (منفی) است.',
        '<br /><b>شیاد:</b> اگر به کارآگاه بزند → استعلام آن شب «منفی» می‌شود؛ تکرار پشت‌سرهم مجاز است.',
        '<br /><b>محقق:</b> گره فقط برای ناتو و شیاد فعال است؛ رئیس مافیا استثناست.',
        '<br /><b>پزشک:</b> نجات خود حداکثر <b>دو بار</b> در کل بازی.',
        '<br /><b>رویین‌تن:</b> شلیک مافیا کشنده نیست؛ فقط با رأی یا سوداگری از بازی خارج می‌شود.',
      ].join('')),
      _gs('شرط پیروزی', [
        '<b>شهر:</b> همه اعضای مافیا حذف شوند.',
        '<br /><b>مافیا:</b> تعداد مافیا برابر یا بیشتر از شهروندان شود.',
      ].join('')),
    ]),
    en: _gw([
      _gs('Overview & Composition', [
        'Inspector scenario. Best for 10, 12, or 13 players (default: 10 players, 3 mafia).',
        '<br /><b>Mafia:</b> Mafia Boss + Charlatan + NATO + (Simple Mafia — added at 12/13 players)',
        '<br /><b>City:</b> Detective + Doctor + Inspector + Researcher (Hunter) + Invulnerable (optional) + Sniper (at 12/13) + Citizens',
        '<br />Charlatan knows the mafia team but wakes independently.',
      ].join('')),
      _gs('Intro Night', [
        'Mafia team opens eyes → learns each other → closes eyes.',
        '<br />Charlatan opens eyes → sees the mafia team → closes eyes.',
        '<br />Researcher does <b>not</b> link on the intro night.',
      ].join('')),
      _gs('Night Phase', [
        '<b>1. Researcher (Hunter):</b> Opens eyes → picks a player to link → closes eyes.',
        '<br />&nbsp;&nbsp;• If Researcher is eliminated (shot or vote), linked player is also eliminated — only if they are NATO or Charlatan.',
        '<br />&nbsp;&nbsp;• Exception: Mafia Boss is immune to the chain elimination.',
        '<br /><b>2. Mafia team:</b> Opens eyes → choose shot or trade → closes eyes.',
        '<br />&nbsp;&nbsp;• <b>Trade / Sodagari (once per game):</b> Mafia Boss sacrifices a mafia member (eliminated next morning) + converts a Simple Citizen or Invulnerable to Mafia.',
        '<br />&nbsp;&nbsp;• If the trade target has any other role → trade fails.',
        '<br /><b>3. Charlatan:</b> Opens eyes → points at a target → closes eyes.',
        '<br />&nbsp;&nbsp;• Targeting the Detective forces that night\'s inquiry to "citizen." Consecutive targeting is allowed.',
        '<br /><b>4. Doctor:</b> Opens eyes → saves someone → closes eyes.',
        '<br />&nbsp;&nbsp;• Self-save allowed only <b>twice</b> per game.',
        '<br /><b>5. Sniper (if active):</b> Opens eyes → points at target if shooting → closes eyes.',
        '<br />&nbsp;&nbsp;• Shooting a citizen → Sniper is eliminated (Doctor cannot prevent).',
        '<br />&nbsp;&nbsp;• Shooting NATO/Charlatan/Simple Mafia (no doctor save) → that player is eliminated.',
        '<br />&nbsp;&nbsp;• Shooting the Mafia Boss → <b>nobody is eliminated</b>.',
        '<br /><b>6. Detective:</b> Opens eyes → inquires → Host signals result → closes eyes.',
        '<br />&nbsp;&nbsp;• Mafia Boss always returns "citizen" (negative).',
        '<br /><b>7. Inspector:</b> Opens eyes → picks two players for interrogation → closes eyes.',
      ].join('')),
      _gs('Day Phase — Interrogation', [
        '<b>Inspector picks two players each night.</b> If both are still alive the next morning, interrogation begins.',
        '<br />• Each speaks twice (1–2 min per turn).',
        '<br />• Inspector decides whether a vote is held between the two.',
        '<br />• If vote: mandatory — whoever receives more votes is eliminated.',
        '<br />• Interrogation is separate from the regular daily vote.',
      ].join('')),
      _gs('Special Rules', [
        '<b>Mafia Boss:</b> Always shows "citizen" (negative) to Detective.',
        '<br /><b>Charlatan:</b> Targeting Detective forces "citizen" result; consecutive targeting allowed.',
        '<br /><b>Researcher:</b> Chain only activates for NATO or Charlatan; Mafia Boss is excepted.',
        '<br /><b>Doctor:</b> Self-save limit is <b>two times</b> per game.',
        '<br /><b>Invulnerable:</b> Immune to night shots; only eliminated by vote or trade.',
      ].join('')),
      _gs('Win Conditions', [
        '<b>City:</b> All mafia members eliminated.',
        '<br /><b>Mafia:</b> Mafia count equals or exceeds remaining citizens.',
      ].join('')),
    ]),
  },

  // ══════════════════════════════════════════════════════════════════════════
  devil: {
    fa: _gw([
      _gs('معرفی و ترکیب', [
        'سناریوی خون روی برج ساعت نسخه الهام گرفته از Trouble Brewing در Blood on the Clocktower است. این سناریو برای یادگیری نقش های Clocktower مناسب است: اطلاعات واقعی زیاد دارد، اما مسمومیت، مستی و ثبت اشتباه می تواند بازیکنان را گمراه کند.',
        '<br /><br /><b>ترکیب رسمی Trouble Brewing:</b> ۱۳ شهروند نیک، ۴ غریبه، ۴ دستیار شیطان، ۱ شیطان.',
        '<br /><b>پیش فرض ۱۲ نفره برنامه:</b> ۷ شهروند نیک + ۲ غریبه + ۲ دستیار شیطان + ۱ شیطان.',
        '<br /><b>تیم خوب:</b> شهروندان نیک و غریبه ها. هدف: کشتن شیطان.',
        '<br /><b>تیم بد:</b> دستیارهای شیطان و خود شیطان. هدف: رساندن بازی به دو بازیکن زنده یا ایجاد باخت ویژه برای تیم خوب.',
        '<br /><br /><b>نکته برنامه:</b> نقش های پایه شهروند نیک و دستیار فقط برای پر کردن چیدمان سفارشی هستند؛ نقش های رسمی سناریو همان ۲۲ نقش Trouble Brewing هستند.',
      ].join('')),
      _gs('آماده سازی گرداننده', [
        '<b>۱. نقش ها را بچینید.</b> اگر Baron در بازی است، دو غریبه بیشتر وارد کنید و به همان تعداد شهروند نیک کم کنید.',
        '<br /><b>۲. Drunk را مخفی کنید.</b> مست خودش نمی داند مست است؛ باید یک نقش ظاهری شهروند نیک برای او در ذهن داشته باشید و با او مثل همان نقش رفتار کنید، اما توانایی واقعی ندارد.',
        '<br /><b>۳. طعمه قرمز Fortune Teller را انتخاب کنید.</b> یک بازیکن خوب را انتخاب کنید که برای فال گیر مثل شیطان جواب "بله" بدهد.',
        '<br /><b>۴. سه بلوف خوب برای Imp آماده کنید.</b> شیطان باید چند نقش خوب خارج از بازی داشته باشد که بتواند با آن ها بلوف بزند.',
        '<br /><b>۵. اثرهای گمراه کننده را ثبت کنید.</b> Poisoner، Drunk، Recluse و Spy می توانند اطلاعات را غلط یا عجیب کنند. در برنامه این موارد را در Flow و یادداشت ها ثبت کنید.',
      ].join('')),
      _gs('شب معارفه در برنامه', [
        'در ابزار Flow، <b>شب معارفه برج ساعت</b> را باز کنید. برنامه ترتیب رسمی شب اول Trouble Brewing را مرحله به مرحله اجرا می‌کند: اطلاعات تیم بد و پوشش‌ها، Poisoner، Washerwoman، Librarian، Investigator، Chef، Empath، Fortune Teller، Butler و Spy.',
        '<br /><br /><b>اطلاعات اولیه:</b>',
        '<br />• Poisoner: اول انتخاب می‌کند و مسمومیت او می‌تواند روی نقش‌های اطلاعاتی همان شب معارفه و توانایی‌های روز اول اثر بگذارد.',
        '<br />• Washerwoman: دو بازیکن + یک نقش شهروند نیک؛ یکی از آن دو آن نقش است.',
        '<br />• Librarian: دو بازیکن + یک نقش غریبه؛ یکی از آن دو آن نقش است، یا اعلام می شود غریبه ای نیست.',
        '<br />• Investigator: دو بازیکن + یک نقش دستیار شیطان؛ یکی از آن دو آن نقش است.',
        '<br />• Chef: تعداد جفت های بد کنار هم.',
        '<br />• Empath: تعداد همسایه های زنده بد در همان شروع بازی.',
        '<br />• Fortune Teller: ثبت طعمه قرمز و جواب اولین بررسی.',
        '<br />• Butler: ارباب شب اول را انتخاب می کند.',
        '<br />• Spy: دفتر کامل بازی را می بیند.',
        '<br /><br />اگر Poisoner، Drunk، Recluse یا Spy روی نتیجه ای اثر می گذارند، نتیجه ای را به بازیکن بدهید که با تصمیم گرداننده و وضعیت مسموم/مست سازگار است.',
      ].join('')),
      _gs('ترتیب شب های عادی', [
        '<b>۱. Poisoner:</b> یک بازیکن را مسموم می کند. توانایی او همان شب و روز بعد خاموش است، ولی گرداننده وانمود می کند توانایی کار کرده است.',
        '<br /><b>۲. Monk:</b> یک بازیکن دیگر را از حمله شیطان همان شب محافظت می کند. خودش را نمی تواند انتخاب کند.',
        '<br /><b>۳. Scarlet Woman:</b> بررسی کنید آیا شیطان وقتی حداقل پنج بازیکن زنده بودند مرده است یا نه. اگر بله، او شیطان جدید می‌شود. انتخاب هدف ندارد.',
        '<br /><b>۴. Imp:</b> یک بازیکن را برای مرگ انتخاب می کند. می تواند خودش را بکشد؛ در این صورت یک دستیار زنده به Imp جدید تبدیل می شود. اگر Soldier سالم هدف باشد، نمی میرد.',
        '<br /><b>۵. Ravenkeeper:</b> فقط اگر همان شب کشته شده باشد بیدار می شود و نقش یک بازیکن را می فهمد.',
        '<br /><b>۶. Empath:</b> عدد ۰، ۱ یا ۲ از دو همسایه زنده نزدیک خود می گیرد.',
        '<br /><b>۷. Fortune Teller:</b> دو بازیکن را انتخاب می کند و جواب بله/خیر می گیرد که آیا یکی از آن ها شیطان ثبت می شود یا نه. طعمه قرمز هم جواب بله می دهد.',
        '<br /><b>۸. Undertaker:</b> اگر امروز کسی با اعدام مرده باشد، نقش او را می فهمد.',
        '<br /><b>۹. Butler:</b> ارباب فردا را انتخاب می کند.',
        '<br /><b>۱۰. Spy:</b> دفتر کامل بازی را می بیند.',
      ].join('')),
      _gs('روز و اعدام', [
        '<b>بحث و نامزدی:</b> بازیکنان اطلاعات، ادعاها و تناقض ها را بررسی می کنند. هدف خوب ها پیدا کردن شیطان است، نه صرفا پیدا کردن هر بازیکن بد.',
        '<br /><br /><b>توانایی‌های روز برج ساعت در برنامه:</b> قبل از رای گیری روز، اگر Virgin یا Slayer در بازی است این مرحله را بررسی کنید.',
        '<br />• Virgin: اولین بار که نامزد شود، اگر نامزدکننده شهروند نیک ثبت شود، نامزدکننده همان لحظه اعدام می شود و روز تمام می شود. اگر فعال نشود هم توانایی مصرف شده است.',
        '<br />• Slayer: یک بار در بازی، در روز یک هدف را اعلام می کند. اگر هدف زنده و Imp باشد، هدف می میرد. هدف اشتباه یا مسمومیت شلیک را مصرف می کند.',
        '<br />• Mayor: اگر فقط سه نفر زنده باشند و روز بدون اعدام تمام شود، تیم خوب می برد. حمله شبانه به Mayor هم می تواند توسط گرداننده به بازیکن دیگری منتقل شود.',
        '<br /><br /><b>Saint:</b> اگر با اعدام بمیرد، تیم بد فورا می برد. با مرگ شبانه این شرط فعال نمی شود.',
      ].join('')),
      _gs('مرجع سریع نقش ها', [
        '<b>شهروندان نیک:</b> Washerwoman، Librarian، Investigator و Chef اطلاعات شروع بازی می دهند. Empath، Fortune Teller و Undertaker در طول بازی اطلاعات می دهند. Monk و Soldier محافظتی هستند. Ravenkeeper می خواهد شب کشته شود. Virgin و Slayer با اتفاق روز اطلاعات می سازند. Mayor شرط برد ویژه دارد.',
        '<br /><br /><b>غریبه ها:</b> Butler محدودیت رای دارد. Drunk نقش ظاهری خوب دارد ولی توانایی واقعی ندارد. Recluse خوب است ولی ممکن است بد/دستیار/شیطان ثبت شود. Saint اگر اعدام شود تیم خوب می بازد.',
        '<br /><br /><b>دستیارهای شیطان:</b> Poisoner توانایی ها را خاموش و اطلاعات را خراب می کند. Spy دفتر کامل را می بیند و ممکن است خوب ثبت شود. Scarlet Woman اگر شیطان با حداقل ۵ زنده بمیرد، شیطان جدید می شود. Baron در چیدمان دو غریبه اضافه می کند.',
        '<br /><br /><b>شیطان:</b> Imp هر شب به جز شروع بازی می کشد. اگر خودش را بکشد، یک دستیار زنده Imp جدید می شود.',
      ].join('')),
      _gs('شرط های برد در این برنامه', [
        '<b>تیم خوب می برد اگر:</b> هیچ شیطان زنده ای باقی نماند، یا Mayor در سه نفر پایانی زنده باشد و روز بدون اعدام تمام شود.',
        '<br /><b>تیم بد می برد اگر:</b> Saint با اعدام بمیرد، یا بازی به دو بازیکن زنده برسد در حالی که شیطان هنوز زنده است.',
        '<br /><b>Scarlet Woman:</b> اگر Imp با حداقل ۵ بازیکن زنده بمیرد، می تواند جلوی برد فوری خوب را بگیرد و به Imp تبدیل شود.',
      ].join('')),
      _gs('نکته های گردانندگی', [
        'اطلاعات را زیاد توضیح ندهید؛ فقط همان چیزی را بدهید که نقش باید بگیرد. اگر بازیکن مسموم یا مست است، نتیجه می تواند غلط باشد ولی باید طبیعی به نظر برسد.',
        '<br />Recluse و Spy ابزار تعادل هستند: هر بار جداگانه تصمیم بگیرید چگونه ثبت شوند تا بازی قابل حل ولی جذاب بماند.',
        '<br />اگر گروه تازه کار است، از نقش های ساده تر شروع کنید: Chef، Empath، Fortune Teller، Undertaker، Monk، Slayer، Recluse، Saint، Poisoner، Scarlet Woman و Imp.',
        '<br /><br /><i>منبع: صفحه رسمی How To Play و ویکی رسمی Trouble Brewing در Blood on the Clocktower.</i>',
      ].join('')),
    ]),
    en: _gw([
      _gs('Overview & Composition', [
        'Blood on the Clocktower is the app version of the Trouble Brewing script. It is beginner-friendly Clocktower: good players get many clues, but poison, drunkenness, and false registration can make those clues unreliable.',
        '<br /><br /><b>Official Trouble Brewing character list:</b> 13 Townsfolk, 4 Outsiders, 4 Minions, 1 Demon.',
        '<br /><b>App default at 12 players:</b> 7 Townsfolk + 2 Outsiders + 2 Minions + 1 Demon.',
        '<br /><b>Good team:</b> Townsfolk and Outsiders. Goal: kill the Demon.',
        '<br /><b>Evil team:</b> Minions and Demon. Goal: reach two living players or trigger a special good loss.',
        '<br /><br /><b>App note:</b> The filler Townsfolk and Minion roles only support custom table sizes. The official script roles are the 22 Trouble Brewing characters.',
      ].join('')),
      _gs('Moderator Setup', [
        '<b>1. Build the script.</b> If Baron is in play, add two extra Outsiders and remove the same number of Townsfolk.',
        '<br /><b>2. Hide the Drunk.</b> The Drunk thinks they are a Townsfolk. Pick an apparent Townsfolk character for them and treat them as if that ability works, but they have no real ability.',
        '<br /><b>3. Pick the Fortune Teller red herring.</b> Choose one good player who will register as the Demon to the Fortune Teller.',
        '<br /><b>4. Prepare three good bluffs for the Imp.</b> These should be good characters that are not in play.',
        '<br /><b>5. Track misinformation.</b> Poisoner, Drunk, Recluse, and Spy can all make information wrong or strange. Record those choices in Flow notes when needed.',
      ].join('')),
      _gs('App Intro Night', [
        'Open <b>Flow -> Clocktower Intro Night</b>. The app follows the Trouble Brewing first-night sheet as separate steps: evil info and bluffs, Poisoner, Washerwoman, Librarian, Investigator, Chef, Empath, Fortune Teller, Butler, and Spy.',
        '<br /><br /><b>Starting information:</b>',
        '<br />• Poisoner: chooses first, and that poison can affect the information roles later in the same intro night plus Day 1 abilities.',
        '<br />• Washerwoman: two players + one Townsfolk character; one of those players is that character.',
        '<br />• Librarian: two players + one Outsider character; one is that Outsider, or no Outsiders are in play.',
        '<br />• Investigator: two players + one Minion character; one is that Minion.',
        '<br />• Chef: number of adjacent evil pairs.',
        '<br />• Empath: number of evil living neighbors at the start.',
        '<br />• Fortune Teller: record red herring and first check.',
        '<br />• Butler: chooses first master.',
        '<br />• Spy: sees the full grimoire.',
        '<br /><br />If Poisoner, Drunk, Recluse, or Spy affect a result, give the player information that matches the moderator choice and the current poisoned/drunk state.',
      ].join('')),
      _gs('Regular Night Order', [
        '<b>1. Poisoner:</b> Chooses a player. That player is poisoned tonight and tomorrow day; the moderator still acts as if their ability worked.',
        '<br /><b>2. Monk:</b> Chooses another player to protect from the Demon for this night. Cannot choose self.',
        '<br /><b>3. Scarlet Woman:</b> Check whether the Demon died while five or more players were alive. If so, she becomes the new Demon. No target is chosen.',
        '<br /><b>4. Imp:</b> Chooses one player to die. The Imp may choose themself; if so, an alive Minion becomes the new Imp. A healthy Soldier does not die from the Demon attack.',
        '<br /><b>5. Ravenkeeper:</b> Only wakes if killed that night, then learns one player character.',
        '<br /><b>6. Empath:</b> Learns 0, 1, or 2 evil living neighbors.',
        '<br /><b>7. Fortune Teller:</b> Chooses two players and gets yes/no for whether either registers as the Demon. The red herring also causes yes.',
        '<br /><b>8. Undertaker:</b> If a player died by execution today, learns that character.',
        '<br /><b>9. Butler:</b> Chooses tomorrow master.',
        '<br /><b>10. Spy:</b> Sees the full grimoire.',
      ].join('')),
      _gs('Day & Execution', [
        '<b>Discussion and nominations:</b> Players compare claims, information, and contradictions. Good is trying to find the Demon, not merely any evil player.',
        '<br /><br /><b>Clocktower Day Actions in the app:</b> Check this Flow step before normal voting when Virgin or Slayer is in play.',
        '<br />• Virgin: The first time the Virgin is nominated, if the nominator registers as Townsfolk, that nominator is executed immediately and the day ends. If it does not trigger, the ability is still spent.',
        '<br />• Slayer: Once per game in the day, publicly chooses a target. If the target is alive and is the Imp, the target dies. Wrong target or poison still spends the shot.',
        '<br />• Mayor: If exactly three players are alive and the day ends with no execution, good wins. A night attack on the Mayor may also be redirected by the moderator.',
        '<br /><br /><b>Saint:</b> If the Saint dies by execution, evil wins immediately. Night death does not trigger this loss.',
      ].join('')),
      _gs('Role Quick Reference', [
        '<b>Townsfolk:</b> Washerwoman, Librarian, Investigator, and Chef give setup clues. Empath, Fortune Teller, and Undertaker give ongoing information. Monk and Soldier protect. Ravenkeeper wants to die at night. Virgin and Slayer create public day tests. Mayor has a special win condition.',
        '<br /><br /><b>Outsiders:</b> Butler has a voting restriction. Drunk thinks they are a Townsfolk but has no real ability. Recluse is good but may register as evil, Minion, or Demon. Saint loses for good if executed.',
        '<br /><br /><b>Minions:</b> Poisoner turns abilities off and corrupts info. Spy sees the grimoire and may register as good. Scarlet Woman becomes Demon if the Demon dies with at least five players alive. Baron adds two Outsiders during setup.',
        '<br /><br /><b>Demon:</b> Imp kills each night except the start of the game. If the Imp kills themself, an alive Minion becomes the new Imp.',
      ].join('')),
      _gs('Win Conditions In This App', [
        '<b>Good wins if:</b> no living Demon remains, or Mayor is alive at final three and the day ends with no execution.',
        '<br /><b>Evil wins if:</b> Saint dies by execution, or the game reaches two living players while a Demon is still alive.',
        '<br /><b>Scarlet Woman:</b> If the Imp dies with at least five players alive, she can prevent the immediate good win by becoming the new Imp.',
      ].join('')),
      _gs('Moderator Tips', [
        'Do not over-explain information. Give only what the role should receive. If a player is poisoned or drunk, the result can be false, but it should still feel plausible.',
        '<br />Use Recluse and Spy registration carefully: decide each check separately so the game remains solvable but interesting.',
        '<br />For new groups, start with simpler roles: Chef, Empath, Fortune Teller, Undertaker, Monk, Slayer, Recluse, Saint, Poisoner, Scarlet Woman, and Imp.',
        '<br /><br /><i>Source: official Blood on the Clocktower How To Play page and official Trouble Brewing wiki.</i>',
      ].join('')),
    ]),
  },

  namayande: {
    fa: _gw([
      _gs('معرفی و ترکیب', [
        'سناریو نماینده (دن کلاب). نفرات مجاز: ۱۰، ۱۲ یا ۱۳ نفر.',
        '<br /><br /><b>۱۰ نفر (۳ مافیا):</b>',
        '<br /><b>تیم مافیا:</b> دون مافیا + یاغی + هکر',
        '<br /><b>تیم شهر:</b> راهنما + پزشک + مین‌گذار + محافظ + وکیل + شهروند ساده (×۲)',
        '<br /><br /><b>۱۲ نفر (۴ مافیا):</b> تیم مافیا + ناتو | تیم شهر + سرباز',
        '<br /><b>۱۳ نفر (۴ مافیا):</b> تیم مافیا + ناتو | تیم شهر + سرباز + شهروند ساده',
        '<br /><br /><b>نکته مهم:</b> «نماینده» یک <b>مکانیک انتخابی</b> روزانه است، نه یک نقش ثابت.',
      ].join('')),
      _gs('انتخاب نماینده', [
        'بعد از صحبت‌های روز اول و قبل از رأی‌گیری، انتخاب نماینده شروع می‌شود.',
        '<br /><br /><b>دور اول:</b> هر فرد یک نفر را به‌عنوان نماینده معرفی می‌کند (فرد به فرد). کسی با بیشترین رأی → <b>نماینده اول</b>.',
        '<br />&nbsp;&nbsp;• اگر دو نفر بیشترین رأی برابر را بیاورند → هر دو نماینده می‌شوند.',
        '<br />&nbsp;&nbsp;• اگر بیش از دو نفر بیشترین رأی برابر را بیاورند → رأی‌گیری مجدد بین آن‌ها.',
        '<br /><b>دور دوم:</b> به ترتیب معکوس، نماینده دوم انتخاب می‌شود.',
      ].join('')),
      _gs('رأی خیانت (دون مافیا)', [
        'بعد از انتخاب نمایندگان، شب می‌شود و تیم مافیا «رأی خیانت» را انتخاب می‌کند.',
        '<br />دون مافیا تعیین می‌کند که هنگام رأی‌گیری برای کدام نماینده، رأی‌ها بیشتر یا کمتر شود.',
        '<br /><b>نکته:</b> اگر دون مافیا خودش نماینده باشد، نمی‌تواند روی خودش رأی خیانت بگذارد.',
        '<br /><b>نکته:</b> مافیا قبل از انتخاب تارگت باید رأی خیانت را انتخاب کند.',
      ].join('')),
      _gs('صحبت نمایندگان و دفاع', [
        '<b>۱. اتهام:</b> نماینده اول صحبت می‌کند و تارگت خود را معرفی می‌کند. سپس نماینده دوم.',
        '<br /><b>۲. انتخاب کاور:</b> تارگت‌ها می‌توانند یک کاور (مدافع) انتخاب کنند. کاورها از تارگت‌ها دفاع می‌کنند.',
        '<br /><b>۳. دفاع نهایی:</b> تارگت‌ها از خودشان دفاع می‌کنند.',
        '<br /><b>۴. رأی‌گیری اختیاری:</b> بین دو تارگت؛ اگر فردی رأی حد نصاب بیاورد، از بازی خارج می‌شود.',
      ].join('')),
      _gs('رول‌بوک‌های خاص', [
        '<b>ناتویی در شب:</b> تیم مافیا یک‌بار در کل بازی می‌تواند به‌جای شات، ناتویی انجام دهد. این قابلیت برای کل تیم مافیاست (نه فقط ناتو).',
        '<br />&nbsp;&nbsp;• اگر راهنما یکی از مافیاها را انتخاب کند و برای مافیا «شو» شود، دیگر تیم مافیا نمی‌تواند راهنما را ناتویی کند.',
        '<br /><br /><b>شات با خنثی:</b> تیم مافیا یک‌بار می‌تواند شات به همراه خنثی‌سازی انجام دهد. اگر روبروی فرد شات شده مین باشد، کسی از تیم مافیا کشته نمی‌شود.',
        '<br /><br /><b>انفجار یاغی:</b> اگر یکی از یارهای مافیا از بازی خارج شود، ضامن یاغی آزاد می‌شود و می‌تواند تا قبل از شروع رأی‌گیری اول با یکی از بازیکنان خارج شود. اگر هدف توسط محافظ محافظت شده باشد یا خودش محافظ باشد، یاغی به تنهایی خارج می‌شود.',
      ].join('')),
      _gs('نقش‌های مافیا', [
        '<b>دون مافیا:</b> رهبر تیم. استعلام کارآگاه همیشه «منفی» (شهروند) است. می‌تواند رأی خیانت روی یکی از نمایندگان بگذارد.',
        '<br /><b>هکر:</b> هر شب دو نفر را به ترتیب انتخاب می‌کند. اگر فرد اول روی فرد دوم ابیلیتی داشته باشد، ابیلیتی اعمال نمی‌شود. مین‌گذاری در هر صورت انجام می‌شود.',
        '<br /><b>یاغی:</b> هر زمان که یکی از یارهای مافیا از بازی خارج شود، ضامن یاغی آزاد می‌شود.',
        '<br /><b>ناتو (۱۲ و ۱۳ نفر):</b> یک‌بار در کل بازی می‌تواند به‌جای شات، نقش یک بازیکن را حدس بزند. اگر درست حدس بزند → بازیکن تحت هر شرایطی خارج می‌شود.',
      ].join('')),
      _gs('نقش‌های شهر', [
        '<b>راهنما:</b> هر شب یک بازیکن را انتخاب می‌کند و او می‌تواند استعلام بگیرد. اگر راهنما یکی از مافیاها را انتخاب کند، هویت راهنما برای مافیا افشا می‌شود. نمی‌تواند اسپم کند.',
        '<br /><b>پزشک:</b> هر شب یک نفر را نجات می‌دهد. <b>نجات خودش دو بار</b> در کل بازی مجاز است.',
        '<br /><b>مین‌گذار:</b> یک‌بار در کل بازی جلوی یک بازیکن مین می‌گذارد.',
        '<br />&nbsp;&nbsp;• اگر مافیا آن فرد را <b>بدون شات خنثی</b> شات کند → مین فعال + یک عضو مافیا نیز خارج می‌شود.',
        '<br />&nbsp;&nbsp;• اگر مافیا با <b>شات خنثی</b> شات کند → فقط هدف خارج می‌شود.',
        '<br />&nbsp;&nbsp;• حتی اگر پزشک سیو بدهد، مین فعال می‌شود.',
        '<br />&nbsp;&nbsp;• اگر هکر ابیلیتی مین‌گذار را درست انتخاب کند، ابیلیتی هکر انجام نمی‌شود و مین‌گذاری انجام می‌شود.',
        '<br /><b>محافظ:</b> هر شب یک نفر را از انفجار یاغی محافظت می‌کند. محافظ خودش نیز مصون است.',
        '<br /><b>وکیل:</b> یک‌بار در کل بازی می‌تواند از ورود یک بازیکن به دفاعیه جلوگیری کند.',
        '<br /><b>سرباز (۱۲ و ۱۳ نفر):</b> یک تیر دارد که شبانه به یک بازیکن می‌دهد.',
        '<br />&nbsp;&nbsp;• تیر به مافیا → سرباز از بازی خارج می‌شود.',
        '<br />&nbsp;&nbsp;• تیر به شهروند → شهروند در همان شب قابلیت شلیک دارد: مافیا → مافیا خارج؛ دون مافیا → هیچ‌کس خارج نمی‌شود؛ شهروند → شهروند خودش خارج می‌شود.',
        '<br /><b>شهروند ساده:</b> قابلیتی ندارد. با شهروند ساده، سوداگری با موفقیت انجام می‌شود.',
      ].join('')),
      _gs('ترتیب شب', [
        '<b>۱. هکر:</b> بیدار → هدف مسدودسازی را انتخاب می‌کند → چشم می‌بندد.',
        '<br /><b>۲. تیم مافیا (دون):</b> بیدار → هدف شلیک یا ناتویی را انتخاب می‌کند → چشم می‌بندد.',
        '<br /><b>۳. راهنما:</b> بیدار → یک نفر را انتخاب می‌کند (شهروند: استعلام؛ مافیا: هویت راهنما برای مافیا افشا می‌شود) → چشم می‌بندد.',
        '<br /><b>۴. پزشک:</b> بیدار → یک نفر را نجات می‌دهد → چشم می‌بندد.',
        '<br /><b>۵. محافظ:</b> بیدار → یک نفر را محافظت می‌کند → چشم می‌بندد.',
        '<br /><b>۶. سرباز:</b> بیدار → تیر خود را به یک بازیکن می‌دهد (اگر شهروند، او نیز در همان شب شلیک می‌کند) → چشم می‌بندد.',
        '<br /><b>۷. مین‌گذار (یک‌بار در کل بازی):</b> بیدار → هدف مین را انتخاب می‌کند → چشم می‌بندد. پس از استفاده، دیگر بیدار نمی‌شود.',
        '<br /><b>۸. وکیل (یک‌بار در کل بازی):</b> بیدار → هدف مصونیت را انتخاب می‌کند → چشم می‌بندد. پس از استفاده، دیگر بیدار نمی‌شود.',
      ].join('')),
      _gs('شرط پیروزی', [
        '<b>شهر:</b> همه اعضای مافیا حذف شوند.',
        '<br /><b>مافیا:</b> تعداد مافیا برابر یا بیشتر از شهروندان شود.',
      ].join('')),
      _gs('یادداشت (پیاده‌سازی اپلیکیشن)', [
        'مکانیک انتخاب نمایندگان و رأی خیانت دون مافیا باید توسط گرداننده به‌صورت دستی مدیریت شود.',
        '<br />اپ: شلیک سرباز، شات خنثی، و انفجار یاغی را ردیابی می‌کند.',
      ].join('')),
    ]),
    en: _gw([
      _gs('Overview & Composition', [
        'Representative (Don Club) scenario. Allowed: 10, 12, or 13 players.',
        '<br /><br /><b>10 players (3 mafia):</b>',
        '<br /><b>Mafia team:</b> Don Mafia + Rebel + Hacker',
        '<br /><b>City team:</b> Guide + Doctor + Minemaker + Bodyguard + Lawyer + Citizen (×2)',
        '<br /><br /><b>12 players (4 mafia):</b> Mafia + NATO | City + Soldier',
        '<br /><b>13 players (4 mafia):</b> Mafia + NATO | City + Soldier + Citizen',
        '<br /><br /><b>Note:</b> "Representative" is a daily <b>election mechanic</b>, not a fixed role.',
      ].join('')),
      _gs('Representative Election', [
        'After Day 1 speeches and before voting, the election begins.',
        '<br /><br /><b>Round 1:</b> Each player nominates one representative (one by one). Most votes → <b>1st Representative</b>.',
        '<br />&nbsp;&nbsp;• Tie between two → both become representatives.',
        '<br />&nbsp;&nbsp;• Tie among more than two → revote among tied players.',
        '<br /><b>Round 2:</b> Reverse order, elect <b>2nd Representative</b>.',
      ].join('')),
      _gs('Betrayal Vote (Don Mafia)', [
        'After representatives are chosen, night falls and the mafia selects the betrayal vote.',
        '<br />The Don decides whether votes for one representative\'s target will go up or down.',
        '<br /><b>Note:</b> If the Don is elected representative, they cannot place the betrayal vote on themselves.',
        '<br /><b>Note:</b> Mafia must choose the betrayal direction before knowing who each representative will target.',
      ].join('')),
      _gs('Speeches, Cover & Defense', [
        '<b>1. Accusation:</b> Rep 1 speaks and names their target. Then Rep 2.',
        '<br /><b>2. Cover:</b> Targets may each name one defender (cover). Defenders speak first.',
        '<br /><b>3. Final defense:</b> Targets defend themselves.',
        '<br /><b>4. Optional vote:</b> Between the two targets; quorum of votes eliminates.',
      ].join('')),
      _gs('Special Rules', [
        '<b>NATO Night:</b> Once per game, the whole mafia team may perform a NATO guess instead of shooting. This is a team ability, not limited to the NATO role.',
        '<br />&nbsp;&nbsp;• If Guide picks a mafia member and the mafia learns Guide\'s identity, mafia can no longer NATO-guess the Guide.',
        '<br /><br /><b>Neutralized Shot:</b> Once per game, mafia may fire a neutralized shot. If the target has a mine in front of them, no mafia member dies from the mine explosion.',
        '<br /><br /><b>Rebel Explosion:</b> Whenever any mafia ally is eliminated, the Rebel\'s pin is pulled. Rebel may explode with one player before the first vote. If the chosen target is protected by Bodyguard (or is the Bodyguard), Rebel exits alone.',
      ].join('')),
      _gs('Mafia Roles', [
        '<b>Don Mafia:</b> Team leader; always shows "citizen" to Detective. May place the betrayal vote on one representative per round.',
        '<br /><b>Hacker:</b> Each night picks two players in order. If player A used an ability on player B, that ability is cancelled. Minemaker\'s mine always goes through.',
        '<br /><b>Rebel:</b> Whenever any mafia ally is eliminated, Rebel becomes the Assassin.',
        '<br /><b>NATO (12 & 13 players):</b> Once per game, guesses a player\'s exact role instead of the night shot. Correct → unconditional elimination.',
      ].join('')),
      _gs('City Roles', [
        '<b>Guide:</b> Each night selects one player; that player may receive an inquiry. If Guide picks a mafia member, Guide\'s identity is revealed to the mafia. Cannot spam (no consecutive repeat).',
        '<br /><b>Doctor:</b> Saves one player each night. <b>Self-save allowed twice</b> per game.',
        '<br /><b>Minemaker:</b> Once per game plants a mine on one player.',
        '<br />&nbsp;&nbsp;• Normal mafia shot on mined target → mine activates; one volunteering mafia member also exits.',
        '<br />&nbsp;&nbsp;• Neutralized shot on mined target → only the target exits.',
        '<br />&nbsp;&nbsp;• Mine activates even if the Doctor saves the target.',
        '<br />&nbsp;&nbsp;• If Hacker correctly selects Minemaker\'s target, Hacker\'s block fails and the mine still lands.',
        '<br /><b>Bodyguard:</b> Each night protects one player from the Rebel explosion. Bodyguard is also immune.',
        '<br /><b>Lawyer:</b> Once per game prevents one player from entering the defense phase.',
        '<br /><b>Soldier (12 & 13 players):</b> Has one bullet to give a player at night.',
        '<br />&nbsp;&nbsp;• Given to mafia → Soldier is eliminated.',
        '<br />&nbsp;&nbsp;• Given to citizen → that citizen may shoot: hitting mafia (non-Don) → mafia exits; hitting Don → nobody exits; hitting citizen → recipient exits.',
        '<br /><b>Citizen:</b> No night ability. Negotiation succeeds with a plain Citizen.',
      ].join('')),
      _gs('Night Phase Order', [
        '<b>1. Hacker:</b> Wakes → picks block target → sleeps.',
        '<br /><b>2. Mafia team (Don):</b> Wakes → picks shot or NATO target → sleeps.',
        '<br /><b>3. Guide:</b> Wakes → picks target → Host signals (citizen: inquiry; mafia: Guide\'s identity revealed to that mafia member) → sleeps.',
        '<br /><b>4. Doctor:</b> Wakes → saves someone → sleeps.',
        '<br /><b>5. Bodyguard:</b> Wakes → protects someone → sleeps.',
        '<br /><b>6. Soldier:</b> Wakes → gives bullet to a player (if citizen, they shoot immediately) → sleeps.',
        '<br /><b>7. Minemaker (once per game):</b> Wakes → picks mine target → sleeps. Does not wake again after ability is used.',
        '<br /><b>8. Lawyer (once per game):</b> Wakes → picks immunity target → sleeps. Does not wake again after ability is used.',
      ].join('')),
      _gs('Win Conditions', [
        '<b>City:</b> All mafia members eliminated.',
        '<br /><b>Mafia:</b> Mafia equals or outnumbers remaining citizens.',
      ].join('')),
      _gs('App Implementation Note', [
        'Representative election and Don\'s betrayal vote must be managed manually by the host.',
        '<br />The app tracks: Soldier bullet, neutralized shot, and Rebel explosion.',
      ].join('')),
    ]),
  },

  // ══════════════════════════════════════════════════════════════════════════
  mozaker: {
    fa: _gw([
      _gs('معرفی و ترکیب', [
        'سناریو مذاکره. مناسب برای ۱۰ نفر (پیش‌فرض: ۱۰ نفر، ۳ مافیا).',
        '<br /><b>تیم مافیا:</b> رئیس مافیا + مذاکره‌کننده + مافیا ساده',
        '<br /><b>تیم شهر:</b> کارآگاه + پزشک + زره‌پوش + خبرنگار + تک‌تیرانداز (اختیاری) + شهروند',
      ].join('')),
      _gs('ترتیب شب (معمولی)', [
        '<b>۱. تیم مافیا:</b> بیدار → هدف شلیک → چشم می‌بندد.',
        '<br /><b>۲. پزشک:</b> بیدار → نجات → چشم می‌بندد.',
        '<br /><b>۳. کارآگاه:</b> بیدار → استعلام → چشم می‌بندد.',
        '<br /><b>۴. مذاکره‌کننده:</b> معمولاً فقط در شب مذاکره بیدار می‌شود.',
        '<br /><b>۵. خبرنگار:</b> در شب مذاکره بیدار می‌شود.',
      ].join('')),
      _gs('شب مذاکره (ویژه)', [
        'وقتی ۱ یا ۲ نفر از مافیا از بازی خارج شده باشند، مذاکره‌کننده می‌تواند «شب مذاکره» را فعال کند.',
        '<br /><br /><b>روند شب مذاکره:</b>',
        '<br />• در شب مذاکره، <b>مافیا شلیک نمی‌کند</b>.',
        '<br />• مذاکره‌کننده بیدار می‌شود → یک نفر را برای مذاکره انتخاب می‌کند → چشم می‌بندد.',
        '<br />• اگر هدف <b>شهروند ساده</b> یا <b>زره‌پوشِ زره‌دار</b> باشد → مذاکره موفق است → آن نفر به «مافیا ساده» تبدیل می‌شود.',
        '<br />• اگر هدف نقش دیگری (کارآگاه، پزشک، خبرنگار...) باشد → مذاکره شکست می‌خورد (اعلام نمی‌شود چه کسی هدف بوده).',
        '<br /><b>خبرنگار:</b> بیدار می‌شود → گرداننده با علامت نشان می‌دهد آیا هدف مذاکره شهروند/زره‌پوش بود یا نه → چشم می‌بندد.',
        '<br /><br /><b>زره‌پوش:</b>',
        '<br />• شلیک مافیا در شب کشنده نیست.',
        '<br />• اگر با رأی از بازی خارج شود، نقشش اعلام می‌شود و <b>به بازی برمی‌گردد</b>.',
        '<br />• پس از برگشت، دیگر قابل مذاکره نیست (مصونیت از مذاکره).',
      ].join('')),
      _gs('فاز روز', [
        'بحث، رأی‌گیری و دفاعیه مثل کلاسیک.',
      ].join('')),
      _gs('شرط پیروزی', [
        '<b>شهر:</b> همه مافیا حذف شوند.',
        '<br /><b>مافیا:</b> تعداد مافیا برابر یا بیشتر از شهروندان شود.',
      ].join('')),
    ]),
    en: _gw([
      _gs('Overview & Composition', [
        'Negotiator scenario. Default: 10 players, 3 mafia.',
        '<br /><b>Mafia:</b> Mafia Boss + Negotiator + Simple Mafia',
        '<br /><b>City:</b> Detective + Doctor + Armored + Reporter + Sniper (optional) + Citizens',
      ].join('')),
      _gs('Regular Night Phase', [
        '<b>1. Mafia team:</b> Open eyes → pick shot → close eyes.',
        '<br /><b>2. Doctor:</b> Open eyes → save → close eyes.',
        '<br /><b>3. Detective:</b> Open eyes → inquire → close eyes.',
        '<br /><b>4. Negotiator:</b> Only wakes on Negotiation Night.',
        '<br /><b>5. Reporter:</b> Only wakes on Negotiation Night.',
      ].join('')),
      _gs('Negotiation Night (Special)', [
        'When 1 or 2 mafia members have been eliminated, the Negotiator may activate a Negotiation Night.',
        '<br /><br /><b>Negotiation Night flow:</b>',
        '<br />• <b>No mafia shot</b> during a negotiation night.',
        '<br />• Negotiator opens eyes → picks a player to negotiate → closes eyes.',
        '<br />• If target is a <b>Simple Citizen</b> or <b>Armored (still armored)</b> → negotiation succeeds → target joins mafia as Simple Mafia.',
        '<br />• If target has any other role → negotiation fails (not announced who was targeted).',
        '<br /><b>Reporter:</b> Opens eyes → Host signals whether the negotiation target was a citizen/armored → closes eyes.',
        '<br /><br /><b>Armored:</b>',
        '<br />• Cannot be killed by night shot.',
        '<br />• If voted out during the day → role is revealed and they <b>return to the game</b>.',
        '<br />• After returning, Armored is no longer eligible for negotiation.',
      ].join('')),
      _gs('Win Conditions', [
        '<b>City:</b> All mafia eliminated.',
        '<br /><b>Mafia:</b> Mafia equals or outnumbers remaining citizens.',
      ].join('')),
    ]),
  },

  // ══════════════════════════════════════════════════════════════════════════
  takavar: {
    fa: _gw([
      _gs('معرفی و ترکیب', [
        'سناریو تکاور (مافیا تی‌وی). پیش‌فرض: ۱۰ نفر، ۳ مافیا.',
        '<br /><b>تیم مافیا:</b> دن مافیا + ناتو + گروگانگیر',
        '<br /><b>تیم شهر:</b> پزشک + تکاور + کارآگاه + تفنگدار + نگهبان + شهروند ساده',
        '<br />نقش‌های خاص: گروگانگیر مستقل بیدار می‌شود و تکاور در صورت کشته شدن، پاسخ می‌دهد.',
      ].join('')),
      _gs('ترتیب شب', [
        '<b>۱. نگهبان:</b> ۱–۲ نفر را محافظت می‌کند.',
        '<br /><b>۲. گروگانگیر (مستقل):</b> قابلیت یک بازیکن را مسدود می‌کند.',
        '<br /><b>۳. تیم مافیا (دن + ناتو):</b> شلیک یا حدس ناتو.',
        '<br /><b>۴. کارآگاه:</b> استعلام.',
        '<br /><b>۵. تکاور:</b> اگر مافیا او را کشته، پاسخ می‌دهد.',
        '<br /><b>۶. پزشک:</b> نجات.',
        '<br /><b>۷. تفنگدار:</b> توزیع گلوله.',
      ].join('')),
      _gs('نگهبان', [
        '۸+ بازیکن: ۲ نفر را محافظت می‌کند. ۷ بازیکن یا کمتر: ۱ نفر.',
        '<br />اگر گروگانگیر همان نفر محافظت‌شده را هدف بگیرد، مسدودسازی خنثی می‌شود.',
        '<br />اگر گروگانگیر خودِ نگهبان را هدف بگیرد، مسدودسازی نیز خنثی می‌شود.',
      ].join('')),
      _gs('گروگانگیر', [
        'مستقل بیدار می‌شود (جدا از مافیا).',
        '<br />هر شب قابلیت شبانه یک نفر را مسدود می‌کند.',
        '<br />نمی‌تواند دو شب پشت‌سرهم یک نفر را هدف بگیرد.',
      ].join('')),
      _gs('تکاور', [
        'اگر مافیا در شب تکاور را بکشد، تکاور بلافاصله یک نفر را می‌زند.',
        '<br /><b>اصابت به مافیا:</b> هر دو خارج می‌شوند.',
        '<br /><b>اصابت به شهروند:</b> فقط تکاور خارج می‌شود.',
      ].join('')),
      _gs('ناتو (یک‌بار در بازی)', [
        'نقش دقیق یک بازیکن را حدس می‌زند.',
        '<br /><b>درست:</b> آن بازیکن در هر شرایطی خارج می‌شود.',
        '<br /><b>غلط:</b> هیچ اتفاقی نمی‌افتد (سکوت).',
        '<br />شب استفاده از ناتو معمولاً بدون شلیک مافیاست.',
      ].join('')),
      _gs('شرط پیروزی', [
        '<b>شهر:</b> همه مافیا حذف شوند.',
        '<br /><b>مافیا:</b> تعداد مافیا برابر یا بیشتر از شهروندان شود.',
      ].join('')),
    ]),
    en: _gw([
      _gs('Overview & Composition', [
        'Commando / TV Mafia scenario. Default: 10 players, 3 mafia.',
        '<br /><b>Mafia:</b> Don (Mafia Boss) + NATO + Hostage-Taker',
        '<br /><b>City:</b> Doctor + Commando + Detective + Gunner + Guardian + Simple Citizens',
        '<br />Key roles: Hostage-Taker wakes independently; Commando counter-shoots when killed.',
      ].join('')),
      _gs('Night Phase', [
        '<b>1. Guardian:</b> Protects 1–2 players from Hostage-Taker.',
        '<br /><b>2. Hostage-Taker (solo):</b> Blocks one player\'s night ability.',
        '<br /><b>3. Mafia team (Don + NATO):</b> Shoot or use NATO guess.',
        '<br /><b>4. Detective:</b> Inquiry.',
        '<br /><b>5. Commando:</b> Counter-shot if Mafia killed Commando.',
        '<br /><b>6. Doctor:</b> Save.',
        '<br /><b>7. Gunner:</b> Distribute blank/real bullet.',
      ].join('')),
      _gs('Guardian', [
        '8+ players alive: protects 2 players. 7 or fewer: protects 1.',
        '<br />If Hostage-Taker targets a protected player, the block is nullified.',
        '<br />If Hostage-Taker targets Guardian directly, the block is also nullified.',
      ].join('')),
      _gs('Hostage-Taker', [
        'Wakes independently (separate from Mafia team).',
        '<br />Blocks one player\'s night ability each night.',
        '<br />Cannot target the same player on consecutive nights.',
      ].join('')),
      _gs('Commando', [
        'If Mafia kills Commando at night, Commando fires one counter-shot.',
        '<br /><b>Hits Mafia:</b> Both Commando and target are eliminated.',
        '<br /><b>Hits citizen:</b> Only Commando is eliminated.',
        '<br />Does not trigger if Commando was not killed by Mafia.',
      ].join('')),
      _gs('NATO (once per game)', [
        'Guesses one player\'s exact role.',
        '<br /><b>Correct:</b> That player is unconditionally eliminated.',
        '<br /><b>Wrong:</b> Nothing happens (silent fail).',
        '<br />Using NATO usually means no mafia shot that night.',
      ].join('')),
      _gs('Win Conditions', [
        '<b>City:</b> All mafia eliminated.',
        '<br /><b>Mafia:</b> Mafia count equals or exceeds city count.',
      ].join('')),
    ]),
  },

  // ══════════════════════════════════════════════════════════════════════════
  kabo: {
    fa: _gw([
      _gs('معرفی و ترکیب', [
        'سناریو کاپو. مناسب برای ۱۰ نفر (پیش‌فرض: ۱۰ نفر، ۳ مافیا).',
        '<br /><b>تیم مافیا:</b> دن مافیا + جادوگر + جلاد + خبرچین (اختیاری)',
        '<br /><b>تیم شهر:</b> کارآگاه + وارث + عطار + زره‌ساز + کدخدا + مظنون + شهروند',
        '<br />پیچیده‌ترین سناریو از نظر مکانیک‌های ویژه.',
      ].join('')),
      _gs('شب معارفه', [
        'وارث بیدار می‌شود → یک نفر را برای وراثت انتخاب می‌کند → چشم می‌بندد.',
        '<br />تیم مافیا بیدار می‌شوند → یکدیگر را می‌شناسند → چشم می‌بندند.',
        '<br />در شب معارفه معمولاً عطار زهر نمی‌دهد.',
      ].join('')),
      _gs('روز اول — رأی اعتماد و شلیک کاپو', [
        '<b>۱. رأی اعتماد:</b> هر بازیکن با کارت‌های +/- رأی می‌دهد. بیشترین رأی = معتمد.',
        '<br /><b>۲. انتخاب مظنون:</b> معتمد ۲ مظنون انتخاب می‌کند (با کارت).',
        '<br /><b>۳. چرت روز:</b> دن مافیا (کاپو) مشخص می‌کند کدام گلوله واقعی است: تفنگ ۱ یا تفنگ ۲.',
        '<br /><b>۴. دفاع و شلیک:</b> دو مظنون دفاع می‌کنند؛ هر تفنگ یک هدف دارد. گلوله واقعی هدف خود را حذف می‌کند.',
        '<br />اگر دن مافیا با گلوله کاپو حذف شود، پادزهرش به جادوگر منتقل می‌شود.',
      ].join('')),
      _gs('روز دوم — وضعیت زهر', [
        'اگر شب قبل عطار کسی را مسموم کرده باشد، روز دوم با «وضعیت زهر» شروع می‌شود: گرداننده اعلام می‌کند زهر وارد بازی شده است.',
        '<br />سپس رأی‌گیری عادی و حذف.',
      ].join('')),
      _gs('شب دوم — جریان زهر (وقتی مسموم زنده است)', [
        'اگر فرد مسموم تا پایان روز حذف نشده باشد، شب دوم این مراحل اضافه می‌شود:',
        '<br /><b>۱. بازیکن مسموم:</b> گرداننده نام مسموم را اعلام می‌کند.',
        '<br /><b>۲. رأی پادزهر:</b> بازیکنان با کارت‌های موافق/مخالف رأی می‌دهند. پیام به‌صورت زنده به‌روز می‌شود (بیشتر موافق یا مخالف). گرداننده اعلام می‌کند.',
        '<br /><b>۳. تصمیم عطار:</b> عطار با کارت انتخاب می‌کند: پادزهر می‌دهد یا نه. تصمیم نهایی با عطار است.',
        '<br /><b>۴. نتیجه زهر:</b> اگر پادزهر داده شد → «زهر خنثی شد». اگر نه → «زهر اثر کرد، [نام] مسموم شد و حذف می‌شود».',
        '<br /><b>دن مافیا:</b> یک پادزهر شخصی دارد. وقتی خودش مسموم است، حتی اگر عطار پادزهر ندهد، زنده می‌ماند و اعلام «زهر خنثی شد» می‌شود.',
      ].join('')),
      _gs('ترتیب شب', [
        '<b>۱. وارث:</b> بیدار → تأیید/تغییر وراثت → چشم می‌بندد.',
        '<br /><b>۲. تیم مافیا (جادوگر/دن/جلاد):</b> بیدار → مشورت:',
        '<br />&nbsp;&nbsp;• <b>دن مافیا:</b> شلیک، یاکوزا (خرید شهروند)، یا حدس نقش.',
        '<br />&nbsp;&nbsp;• <b>جادوگر:</b> یک شهروند را انتخاب می‌کند؛ اگر آن شهروند توانایی داشته باشد، هر کاری که بکند روی خودش اثر می‌کند (کارآگاه→استعلام خودش؛ عطار→زهر به خودش؛ زره‌ساز→زره به خودش).',
        '<br />&nbsp;&nbsp;• <b>جلاد:</b> نقش دقیق یک بازیکن را حدس می‌زند → درست = حذف بی‌قید.',
        '<br />&nbsp;&nbsp;→ تیم مافیا چشم می‌بندند.',
        '<br /><b>۳. عطار:</b> بیدار → یک نفر را برای زهر انتخاب می‌کند → چشم می‌بندد.',
        '<br /><b>۴. کارآگاه:</b> بیدار → استعلام → چشم می‌بندد. مظنون «مثبت»، خبرچین «منفی».',
        '<br /><b>۵. زره‌ساز:</b> بیدار → نجات خود (یک‌بار در کل بازی) → چشم می‌بندد.',
        '<br /><b>۶. کدخدا:</b> بیدار → یک نفر را لینک می‌کند → چشم می‌بندد. لینک به مافیا = کدخدا حذف.',
      ].join('')),
      _gs('ویژگی وارث', [
        'شب معارفه یک نفر را برای وراثت انتخاب می‌کند.',
        '<br />تا قبل از حذف آن نفر، وارث «نامیراست» (مافیا نمی‌تواند او را شات کند).',
        '<br />وقتی فردِ انتخاب‌شده حذف شود، وارث توانایی آن نقش را به ارث می‌برد.',
        '<br />پس از ارث بردن، وارث دیگر نامیرا نیست.',
      ].join('')),
      _gs('شرط پیروزی', [
        '<b>شهر:</b> همه مافیا حذف شوند.',
        '<br /><b>مافیا:</b> تعداد مافیا برابر یا بیشتر از شهروندان شود.',
      ].join('')),
    ]),
    en: _gw([
      _gs('Overview & Composition', [
        'Capo scenario. Default: 10 players, 3 mafia.',
        '<br /><b>Mafia:</b> Mafia Don + Witch + Executioner + Informant (optional)',
        '<br /><b>City:</b> Detective + Heir + Herbalist + Armorsmith + Village chief + Suspect + Citizens',
        '<br />The most mechanically complex scenario.',
      ].join('')),
      _gs('Intro Night', [
        'Heir opens eyes → picks a player to inherit from → closes eyes.',
        '<br />Mafia team opens eyes → learns each other → closes eyes.',
        '<br />Herbalist typically does not poison on the intro night.',
      ].join('')),
      _gs('Day 1 — Trust Vote & Capo Shoot', [
        '<b>1. Trust Vote:</b> Each player votes with +/- cards. Most votes = Trusted person.',
        '<br /><b>2. Select Suspects:</b> Trusted person picks 2 suspects (card selection).',
        '<br /><b>3. Mid-day Sleep:</b> Mafia Don (Capo) chooses which bullet is real: Gun 1 or Gun 2.',
        '<br /><b>4. Defense & Shoot:</b> Two suspects defend; each gun has a target. The real bullet eliminates its target.',
        '<br />If the Don is eliminated by the Capo gun, his antidote transfers to the Witch.',
      ].join('')),
      _gs('Day 2 — Poison Status', [
        'If the Herbalist poisoned someone the previous night, Day 2 starts with "Poison Status": Host announces poison has entered the game.',
        '<br />Then normal voting and elimination.',
      ].join('')),
      _gs('Night 2 — Poison Flow (when victim survives)', [
        'If the poisoned player was not eliminated by end of day, Night 2 adds these steps:',
        '<br /><b>1. Poisoned Player:</b> Host announces who was poisoned.',
        '<br /><b>2. Antidote Vote:</b> Players vote with Agree/Disagree cards. Message updates live (more agree or more disagree). Host announces.',
        '<br /><b>3. Herbalist Decision:</b> Herbalist chooses with cards: Give antidote or Withhold. Herbalist has the final say.',
        '<br /><b>4. Poison Result:</b> If antidote given → "Poison was fixed." If not → "Poison worked, [name] was poisoned and dies."',
        '<br /><b>Mafia Don:</b> Has one personal antidote. When poisoned, he survives even if Herbalist withholds; Host announces "Poison was fixed."',
      ].join('')),
      _gs('Night Phase', [
        '<b>1. Heir:</b> Opens eyes → confirms/updates inheritance → closes eyes.',
        '<br /><b>2. Mafia team (Witch/Don/Executioner):</b> Open eyes → coordinate:',
        '<br />&nbsp;&nbsp;• <b>Mafia Don:</b> Shoot, Yakooza (buy citizen), or Guess role.',
        '<br />&nbsp;&nbsp;• <b>Witch:</b> Picks a citizen; if they have an ability, whatever action they do reflects onto themselves (Detective→inquiry about self; Herbalist→poisons self; Armorsmith→armors self).',
        '<br />&nbsp;&nbsp;• <b>Executioner:</b> Guesses one player\'s exact role → correct = unconditional elimination.',
        '<br />&nbsp;&nbsp;→ Mafia team closes eyes.',
        '<br /><b>3. Herbalist:</b> Opens eyes → picks poison target → closes eyes.',
        '<br /><b>4. Detective:</b> Opens eyes → inquires → closes eyes. Suspect shows "positive"; Informant shows "negative."',
        '<br /><b>5. Armorsmith:</b> Opens eyes → self-save if desired (once per game) → closes eyes.',
        '<br /><b>6. Village chief:</b> Opens eyes → links one player → closes eyes. Link to mafia = chief eliminated.',
      ].join('')),
      _gs('Heir Ability', [
        'On intro night, Heir selects one player whose ability to inherit.',
        '<br />Until that selected player is eliminated, Heir is <b>immortal</b> (immune to night shot).',
        '<br />When the selected player is eliminated, Heir inherits their ability.',
        '<br />After inheriting, Heir is no longer immortal.',
      ].join('')),
      _gs('Win Conditions', [
        '<b>City:</b> All mafia eliminated.',
        '<br /><b>Mafia:</b> Mafia equals or outnumbers remaining citizens.',
      ].join('')),
    ]),
  },

  // ══════════════════════════════════════════════════════════════════════════
  pedarkhande: {
    fa: _gw([
      _gs('معرفی و ترکیب', [
        'سناریو پدرخوانده. مناسب برای ۱۱ نفر (پیش‌فرض: ۱۱ نفر، ۳ مافیا). نقش‌ها از فیلم‌های معروف الهام گرفته‌اند.',
        '<br /><b>تیم مافیا:</b> پدرخوانده + ماتادور + ساول گودمن',
        '<br /><b>تیم شهر:</b> دکتر واتسون + لئون + همشهری کین + کنستانتین + نوستراداموس (مستقل/سایدانتخابی)',
        '<br />ویژگی: <b>کارت حذف</b> — هر بار کسی از بازی خارج می‌شود یک کارت ویژه کشیده می‌شود.',
      ].join('')),
      _gs('شب معارفه', [
        'نوستراداموس بیدار می‌شود → ۳ نفر را نشان می‌دهد → گرداننده تعداد مافیاهای داخل آن ۳ نفر را اعلام می‌کند (پدرخوانده مافیا حساب نمی‌شود).',
        '<br />نوستراداموس بر اساس این اطلاعات ساید خود را انتخاب می‌کند:',
        '<br />&nbsp;&nbsp;• اگر هیچ‌کدام مافیا نباشند → معمولاً شهروند می‌شود.',
        '<br />&nbsp;&nbsp;• اگر ۱ نفر مافیا باشد → آزاد است.',
        '<br />&nbsp;&nbsp;• اگر ۲ نفر یا بیشتر مافیا باشند → <b>مجبور است</b> ساید مافیا را انتخاب کند.',
        '<br />تیم مافیا بیدار می‌شوند → یکدیگر را می‌شناسند → چشم می‌بندند.',
        '<br />نوستراداموس فقط شب معارفه بیدار می‌شود.',
      ].join('')),
      _gs('ترتیب شب', [
        '<b>۱. تیم مافیا (پدرخوانده/ماتادور/ساول):</b> بیدار → مشورت:',
        '<br />&nbsp;&nbsp;• <b>پدرخوانده:</b> شلیک یا «حس ششم» (هر شب یک گزینه: شلیک/حس ششم/خرید توسط ساول).',
        '<br />&nbsp;&nbsp;• <b>ماتادور:</b> یک نفر را نشان می‌دهد؛ آن نفر ۲۴ ساعت قابلیت ندارد. نمی‌تواند دو شب متوالی یک نفر را انتخاب کند.',
        '<br />&nbsp;&nbsp;• <b>ساول گودمن:</b> یک‌بار در کل بازی می‌تواند یک «شهروند ساده» را بخرد و به «مافیا ساده» تبدیل کند.',
        '<br />&nbsp;&nbsp;→ تیم مافیا چشم می‌بندند.',
        '<br /><b>۲. دکتر واتسون:</b> بیدار → یک نفر را نجات می‌دهد → چشم می‌بندد.',
        '<br />&nbsp;&nbsp;• نجات خود: فقط یک‌بار در کل بازی.',
        '<br /><b>۳. لئون:</b> بیدار → اگر می‌خواهد شلیک کند، هدف را مشخص می‌کند → چشم می‌بندد.',
        '<br />&nbsp;&nbsp;• اگر به شهروند شلیک کند → خودش از بازی خارج می‌شود.',
        '<br />&nbsp;&nbsp;• دکتر واتسون نمی‌تواند لئون را در این حالت نجات دهد.',
        '<br />&nbsp;&nbsp;• لئون یک جلیقه دارد (شلیک اول مافیا را تحمل می‌کند).',
        '<br /><b>۴. همشهری کین:</b> بیدار → یک نفر را نشان می‌دهد → چشم می‌بندد.',
        '<br />&nbsp;&nbsp;• اگر آن نفر مافیا باشد، گرداننده روز بعد او را از بازی خارج می‌کند؛ همان شب کین با تیر غیب خارج می‌شود.',
        '<br />&nbsp;&nbsp;• اگر اشتباه: اتفاقی نمی‌افتد؛ کین قابلیتش را از دست می‌دهد.',
        '<br /><b>۵. کنستانتین:</b> بیدار → اگر می‌خواهد یک بازیکن اخراجی را برگرداند، اعلام می‌کند → چشم می‌بندد.',
        '<br />&nbsp;&nbsp;• فقط بازیکنانی که نقششان هنوز اعلام نشده قابل برگشت هستند.',
        '<br />&nbsp;&nbsp;• کنستانتین فقط یک‌بار می‌تواند این کار را بکند.',
      ].join('')),
      _gs('رأی‌گیری و دفاعیه', [
        'حدنصاب دفاعیه: <b>نصف منهای یک</b> (هرکس این تعداد رأی بگیرد به دفاعیه می‌رود).',
        '<br />دور دوم: بیشترین رأی = خروج. مساوی = قرعه مرگ.',
        '<br />وصیت نداریم؛ به‌جای آن کارت حذف کشیده می‌شود.',
      ].join('')),
      _gs('کارت‌های حذف', [
        'وقتی هر بازیکنی از بازی خارج می‌شود، یک کارت از بین کارت‌های زیر کشیده می‌شود:',
        '<br /><b>ذهن زیبا:</b> یک شانس حدس نوستراداموس. درست = جای او می‌نشیند و نوستراداموس خارج. اگر خود نوستراداموس بکشد: استعلام نقش، نوستراداموس می‌ماند اما سپری ندارد و شب شات می‌شود.',
        '<br /><b>افشای هویت:</b> نقش واقعی را بلند اعلام کند. کنستانتین نمی‌تواند بازگرداند.',
        '<br /><b>سکوت بره‌ها:</b> ۲ نفر را ساکت کند (حق دفاع ندارند). نیمه دوم بازی: فقط ۱ نفر.',
        '<br /><b>دستبند:</b> یک نفر را دستبند بزند؛ آن بازیکن یک روز قابلیت‌اش را از دست می‌دهد. پدرخوانده: حس ششم آن شب غیرفعال (مافیا شات دارد).',
        '<br /><b>تغییر چهره:</b> ابتدای شب، مخفیانه نقش را با یکی عوض کند.',
        '<br /><i>منبع: ویجیاتو — آموزش سناریو پدرخوانده</i>',
      ].join('')),
      _gs('شرط پیروزی', [
        '<b>شهر:</b> همه مافیا حذف شوند.',
        '<br /><b>مافیا:</b> تعداد مافیا برابر یا بیشتر از شهروندان شود.',
        '<br /><b>نوستراداموس:</b> بسته به ساید انتخابی، شرط پیروزی همان ساید را دارد.',
      ].join('')),
    ]),
    en: _gw([
      _gs('Overview & Composition', [
        'Godfather scenario. Default: 11 players, 3 mafia. Roles inspired by famous movies.',
        '<br /><b>Mafia:</b> Godfather + Matador + Saul Goodman',
        '<br /><b>City:</b> Dr. Watson + Leon + Citizen Kane + Constantine + Nostradamus (side-choosing)',
        '<br />Feature: <b>Elimination Cards</b> — drawn every time a player is eliminated.',
      ].join('')),
      _gs('Intro Night', [
        'Nostradamus opens eyes → selects 3 players → Host reveals how many of those 3 are mafia.',
        '<br />Nostradamus chooses their side based on this info:',
        '<br />&nbsp;&nbsp;• 0 mafia among 3 → usually becomes city.',
        '<br />&nbsp;&nbsp;• 1 mafia among 3 → free choice.',
        '<br />&nbsp;&nbsp;• 2+ mafia among 3 → <b>must</b> join mafia.',
        '<br />Mafia team opens eyes → learns each other → closes eyes.',
        '<br />Nostradamus only wakes on the intro night.',
      ].join('')),
      _gs('Night Phase', [
        '<b>1. Mafia team (Godfather/Matador/Saul):</b> Open eyes → coordinate:',
        '<br />&nbsp;&nbsp;• <b>Godfather:</b> Chooses one action per night: shoot / use sixth sense / let Saul buy.',
        '<br />&nbsp;&nbsp;• <b>Matador:</b> Points at one player; if that player wakes up this night, Host signals with an X that their ability is blocked.',
        '<br />&nbsp;&nbsp;• <b>Saul Goodman:</b> Once per game can buy a Simple Citizen, converting them to Simple Mafia.',
        '<br />&nbsp;&nbsp;→ Mafia team closes eyes.',
        '<br /><b>2. Dr. Watson:</b> Opens eyes → saves someone → closes eyes.',
        '<br />&nbsp;&nbsp;• Self-save: once per game only.',
        '<br /><b>3. Leon:</b> Opens eyes → points at target if shooting → closes eyes.',
        '<br />&nbsp;&nbsp;• If shoots a citizen → Leon is eliminated (Watson cannot prevent this).',
        '<br />&nbsp;&nbsp;• Leon has one vest (survives first mafia shot).',
        '<br /><b>4. Citizen Kane:</b> Opens eyes → points at one player → closes eyes.',
        '<br />&nbsp;&nbsp;• If that player is mafia → Host eliminates them next day; Kane is eliminated the following night (invisible bullet).',
        '<br />&nbsp;&nbsp;• If wrong → nothing happens; Kane loses the ability.',
        '<br /><b>5. Constantine:</b> Opens eyes → signals if reviving an eliminated player → closes eyes.',
        '<br />&nbsp;&nbsp;• Only players whose roles were not yet announced can be revived.',
        '<br />&nbsp;&nbsp;• Constantine can do this once per game.',
      ].join('')),
      _gs('Voting & Defense', [
        'Defense threshold: <b>half minus one</b> (anyone with this many votes enters defense).',
        '<br />Second round: most votes = eliminated. Tie = death lottery.',
        '<br />No will; instead an elimination card is drawn.',
      ].join('')),
      _gs('Elimination Cards', [
        'Every time a player is eliminated, one card is drawn:',
        '<br /><b>Beautiful Mind:</b> One chance to guess who Nostradamus is. If correct: guesser returns to game with own role, Nostradamus eliminated. If Nostradamus draws it: host does role inquiry; Nostradamus stays but loses shield, shot at night.',
        '<br /><b>Identity Reveal:</b> Must announce real role. Constantine cannot revive.',
        '<br /><b>Silence of the Lambs:</b> Silence 2 players for one day (no defense). Second half of game: only 1.',
        '<br /><b>Handcuffs:</b> Handcuff one player; they lose their ability for one day. Godfather: loses sixth sense that night (mafia keeps shot).',
        '<br /><b>Face Off:</b> At night start, secretly swap role with one player.',
        '<br /><i>Source: Vigiato — Godfather scenario guide</i>',
      ].join('')),
      _gs('Win Conditions', [
        '<b>City:</b> All mafia eliminated.',
        '<br /><b>Mafia:</b> Mafia equals or outnumbers remaining citizens.',
        '<br /><b>Nostradamus:</b> Wins with whichever side they chose.',
      ].join('')),
    ]),
  },

  // ══════════════════════════════════════════════════════════════════════════
  zodiac: {
    fa: _gw([
      _gs('معرفی و ترکیب', [
        'سناریو زودیاک. مناسب برای ۱۲ نفر (پیش‌فرض: ۱۲ نفر، ۳ مافیا). دارای تیم <b>مستقل</b> (زودیاک).',
        '<br /><b>تیم مافیا:</b> آلکاپن + شعبده‌باز + بمب‌گذار + مافیا ساده',
        '<br /><b>تیم مستقل:</b> زودیاک',
        '<br /><b>تیم شهر:</b> کارآگاه + پزشک + حرفه‌ای + محافظ + اوشن + تفنگدار + شهروند',
        '<br />فاز روز در این سناریو دارای مراحل اضافه (تفنگ) است.',
      ].join('')),
      _gs('ترتیب شب', [
        '<b>۱. تیم مافیا:</b> بیدار → هدف شلیک → چشم می‌بندد.',
        '<br /><b>۲. شعبده‌باز:</b> بیدار → یک نفر از شهر را برای غیرفعال‌سازی انتخاب می‌کند → چشم می‌بندد.',
        '<br />&nbsp;&nbsp;• آن نفر در همان شب توانایی‌اش ندارد (مثلاً کارآگاه نمی‌تواند استعلام کند).',
        '<br /><b>۳. بمب‌گذار:</b> بیدار → اگر می‌خواهد بمب‌گذاری کند:',
        '<br />&nbsp;&nbsp;• یک عدد بین ۱ تا ۴ را به گرداننده اعلام می‌کند (کد مخفی).',
        '<br />&nbsp;&nbsp;• یک هدف را نشان می‌دهد → چشم می‌بندد.',
        '<br />&nbsp;&nbsp;• صبح: گرداننده به هدف اعلام می‌کند که بمب‌گذاری شده.',
        '<br />&nbsp;&nbsp;• هدف باید عدد ۱ تا ۴ را حدس بزند → درست = زنده می‌ماند / غلط = از بازی خارج می‌شود.',
        '<br />&nbsp;&nbsp;• محافظ می‌تواند فدا شود (ر.ک. بخش بعد).',
        '<br /><b>۴. زودیاک:</b> بیدار → <b>فقط شب‌های زوج</b> می‌تواند شلیک کند → هدف را نشان می‌دهد → چشم می‌بندد.',
        '<br />&nbsp;&nbsp;• زودیاک با شلیک شب کشته نمی‌شود.',
        '<br />&nbsp;&nbsp;• اگر به محافظ شلیک کند → زودیاک کشته می‌شود.',
        '<br /><b>۵. حرفه‌ای:</b> بیدار → اگر می‌خواهد شلیک کند، هدف را نشان می‌دهد → چشم می‌بندد.',
        '<br />&nbsp;&nbsp;• اگر به شهروند شلیک کند → خودش از بازی خارج می‌شود.',
        '<br /><b>۶. پزشک:</b> بیدار → نجات → چشم می‌بندد.',
        '<br /><b>۷. کارآگاه:</b> بیدار → استعلام → چشم می‌بندد.',
        '<br /><b>۸. تفنگدار:</b> بیدار → یک تفنگ به یک نفر می‌دهد → چشم می‌بندد.',
        '<br />&nbsp;&nbsp;• ۳ تفنگ دارد: ۲ تیر مشقی + ۱ تیر جنگی. خودش نمی‌داند کدام‌ها مشقی هستند.',
        '<br />&nbsp;&nbsp;• گیرنده تفنگ روز بعد می‌تواند با آن شلیک کند.',
        '<br /><b>۹. اوشن:</b> بیدار → ۲ بار در کل بازی می‌تواند چند شهروند را بیدار کند → چشم می‌بندد.',
        '<br />&nbsp;&nbsp;• اگر اشتباهاً یک مافیا یا زودیاک را بیدار کند → اوشن از بازی خارج می‌شود.',
      ].join('')),
      _gs('مکانیک بمب‌گذار و محافظ', [
        '<b>بمب‌گذاری:</b>',
        '<br />• بمب‌گذار هدف را مشخص می‌کند و کد ۱–۴ به گرداننده می‌دهد.',
        '<br />• هدف یک بار حدس می‌زند. درست → زنده / غلط → خارج.',
        '<br /><br /><b>محافظ (فدا):</b>',
        '<br />• وقتی بمب اعلام می‌شود، محافظ می‌تواند خودش را فدا کند (جای هدف بمب را می‌گیرد).',
        '<br />• محافظ باید کد خنثی‌سازی را حدس بزند.',
        '<br />• درست → هم محافظ زنده، هم هدف اصلی زنده.',
        '<br />• غلط → محافظ از بازی خارج می‌شود ولی هدف اصلی زنده می‌ماند.',
      ].join('')),
      _gs('فاز روز (مراحل)', [
        '<b>۱. بررسی تفنگ‌ها:</b> گیرندگان تفنگ می‌توانند اعلام کنند که شلیک می‌کنند یا نه.',
        '<br /><b>۲. انقضا تفنگ:</b> اگر کسی با تفنگ به هدفی شلیک کرد، نتیجه بررسی می‌شود.',
        '<br />&nbsp;&nbsp;• تیر جنگی → هدف خارج می‌شود (اگر پزشک یا زودیاک نباشد).',
        '<br />&nbsp;&nbsp;• تیر مشقی → هیچ‌اتفاقی نمی‌افتد.',
        '<br /><b>۳. رأی‌گیری:</b> مثل کلاسیک.',
        '<br /><b>۴. دفاعیه و حذف:</b> مثل کلاسیک.',
      ].join('')),
      _gs('شرط پیروزی', [
        '<b>شهر:</b> همه مافیا و زودیاک از بازی خارج شوند.',
        '<br /><b>مافیا:</b> تعداد مافیا برابر یا بیشتر از باقی‌مانده‌های غیرمافیا شود.',
        '<br /><b>زودیاک:</b> آخرین تیم یا آخرین نفر باقی‌مانده باشد (قوانین میز).',
      ].join('')),
    ]),
    en: _gw([
      _gs('Overview & Composition', [
        'Zodiac scenario. Default: 12 players, 3 mafia. Has an <b>independent</b> team.',
        '<br /><b>Mafia:</b> Al Capone + Magician + Bomber + Simple Mafia',
        '<br /><b>Independent:</b> Zodiac',
        '<br /><b>City:</b> Detective + Doctor + Professional + Guard + Ocean + Gunslinger + Citizens',
        '<br />Day phase has extra steps (guns).',
      ].join('')),
      _gs('Night Phase', [
        '<b>1. Mafia team:</b> Open eyes → pick shot → close eyes.',
        '<br /><b>2. Magician:</b> Opens eyes → picks a city player to disable their ability → closes eyes.',
        '<br /><b>3. Bomber:</b> Opens eyes → if planting a bomb:',
        '<br />&nbsp;&nbsp;• Tells Host a secret code (1–4).',
        '<br />&nbsp;&nbsp;• Points at target → closes eyes.',
        '<br />&nbsp;&nbsp;• Morning: Host announces bomb was planted on that player.',
        '<br />&nbsp;&nbsp;• Target must guess 1–4 → correct = survives / wrong = eliminated.',
        '<br /><b>4. Zodiac:</b> Opens eyes → can shoot <b>only on even nights</b> → points at target → closes eyes.',
        '<br />&nbsp;&nbsp;• Cannot be killed by the night shot.',
        '<br />&nbsp;&nbsp;• If Zodiac shoots Guard → Zodiac is eliminated.',
        '<br /><b>5. Professional:</b> Opens eyes → points at target if shooting → closes eyes.',
        '<br />&nbsp;&nbsp;• Shooting a citizen → Professional is eliminated.',
        '<br /><b>6. Doctor:</b> Opens eyes → saves → closes eyes.',
        '<br /><b>7. Detective:</b> Opens eyes → inquires → closes eyes.',
        '<br /><b>8. Gunslinger:</b> Opens eyes → gives one gun to a player → closes eyes.',
        '<br />&nbsp;&nbsp;• Has 3 guns: 2 blanks + 1 real. Doesn\'t know which are which.',
        '<br />&nbsp;&nbsp;• Recipient may shoot the next day.',
        '<br /><b>9. Ocean:</b> Opens eyes → up to 2 times per game can wake some citizens for silent consultation → closes eyes.',
        '<br />&nbsp;&nbsp;• Waking a mafia member or Zodiac accidentally → Ocean is eliminated.',
      ].join('')),
      _gs('Bomb & Guard Mechanics', [
        '<b>Bomb:</b> Target guesses code (1–4). Correct = survives. Wrong = eliminated.',
        '<br /><b>Guard (sacrifice):</b> When bomb is announced, Guard may step in front of the target.',
        '<br />• Guard then guesses the disarm code.',
        '<br />• Correct → both Guard and original target survive.',
        '<br />• Wrong → Guard is eliminated; original target survives.',
      ].join('')),
      _gs('Day Phase Steps', [
        '<b>1. Gun check:</b> Gun holders decide whether to shoot.',
        '<br /><b>2. Gun expiry:</b> Real bullet eliminates target; blank does nothing.',
        '<br /><b>3. Vote:</b> Same as Classic.',
        '<br /><b>4. Defense & Elimination:</b> Same as Classic.',
      ].join('')),
      _gs('Win Conditions', [
        '<b>City:</b> All mafia and Zodiac eliminated.',
        '<br /><b>Mafia:</b> Mafia equals or outnumbers all non-mafia survivors.',
        '<br /><b>Zodiac:</b> Be the last team or last player standing (table rules).',
      ].join('')),
    ]),
  },

  // ══════════════════════════════════════════════════════════════════════════
  meeting_epic: {
    fa: _gw([
      _gs('معرفی و ترکیب', [
        'سناریو میتینگ/اپیک. مناسب برای ۱۲ نفر (پیش‌فرض: ۱۲ نفر، ۴ مافیا).',
        '<br /><b>تیم مافیا:</b> رئیس مافیا + ناتو + ناتاشا + دکتر لکتر + مافیا ساده',
        '<br /><b>تیم شهر:</b> کارآگاه + پزشک + تک‌تیرانداز + زره‌پوش + قاضی + فرمانده + کشیش + شهروند',
      ].join('')),
      _gs('ترتیب شب', [
        '<b>۱. ناتاشا:</b> بیدار → یک نفر را برای سایلنت فردا انتخاب می‌کند → چشم می‌بندد.',
        '<br />&nbsp;&nbsp;• هدف فردا نمی‌تواند صحبت کند (سایلنت).',
        '<br />&nbsp;&nbsp;• معمولاً نمی‌تواند دو شب پشت‌سرهم یک نفر را سایلنت کند.',
        '<br /><b>۲. تیم مافیا (رئیس/ناتو):</b> بیدار → هدف شلیک → چشم می‌بندند.',
        '<br />&nbsp;&nbsp;• <b>ناتو:</b> یک‌بار در کل بازی می‌تواند به‌جای شلیک، نقش دقیق یک بازیکن را حدس بزند.',
        '<br />&nbsp;&nbsp;&nbsp;&nbsp;◦ درست → آن بازیکن از بازی خارج می‌شود.',
        '<br />&nbsp;&nbsp;&nbsp;&nbsp;◦ غلط → هیچ‌اتفاقی نمی‌افتد.',
        '<br /><b>۳. دکتر لکتر:</b> بیدار → یک نفر (معمولاً از تیم مافیا) را نجات می‌دهد → چشم می‌بندد.',
        '<br />&nbsp;&nbsp;• فقط یک‌بار می‌تواند خودش را نجات دهد.',
        '<br /><b>۴. پزشک:</b> بیدار → نجات → چشم می‌بندد.',
        '<br /><b>۵. کارآگاه:</b> بیدار → استعلام → چشم می‌بندد.',
        '<br /><b>۶. تک‌تیرانداز (اگر فعال):</b> بیدار → اگر می‌خواهد شلیک کند، هدف را نشان می‌دهد → چشم می‌بندد.',
        '<br />&nbsp;&nbsp;• فرمانده بعد از انتخاب هدف بیدار می‌شود و تأیید یا رد می‌کند.',
      ].join('')),
      _gs('قوانین خاص', [
        '<b>ناتاشا (سایلنت):</b> هدف روز بعد نمی‌تواند صحبت کند. کشیش می‌تواند این سایلنت را خنثی کند.',
        '<br /><b>دکتر لکتر:</b> اگر شلیک مافیا به یک مافیایی دیگر اصابت کند (اشتباه)، لکتر می‌تواند او را نجات دهد.',
        '<br /><b>قاضی:</b> یک‌بار در کل بازی می‌تواند نتیجه رأی‌گیری روز را ملغی کند (معمولاً شب اعمال می‌شود).',
        '<br /><b>فرمانده:</b> بعد از شلیک تک‌تیرانداز بیدار می‌شود و می‌تواند تأیید یا رد کند.',
        '<br />&nbsp;&nbsp;• اگر رد کند → شلیک اثر ندارد.',
        '<br /><b>کشیش:</b> شب چند نفر را انتخاب می‌کند تا روز بعد وقت صحبت اضافه داشته باشند.',
        '<br />&nbsp;&nbsp;• می‌تواند سایلنت ناتاشا را خنثی کند.',
        '<br /><b>زره‌پوش:</b> با شلیک شب کشته نمی‌شود. اگر با رأی خارج شود، نقش اعلام و به بازی برمی‌گردد.',
      ].join('')),
      _gs('شرط پیروزی', [
        '<b>شهر:</b> همه مافیا حذف شوند.',
        '<br /><b>مافیا:</b> تعداد مافیا برابر یا بیشتر از شهروندان شود.',
      ].join('')),
    ]),
    en: _gw([
      _gs('Overview & Composition', [
        'Meeting/Epic scenario. Default: 12 players, 4 mafia.',
        '<br /><b>Mafia:</b> Mafia Boss + NATO + Natasha + Dr. Lecter + Simple Mafia',
        '<br /><b>City:</b> Detective + Doctor + Sniper + Armored + Judge + Commander + Priest + Citizens',
      ].join('')),
      _gs('Night Phase', [
        '<b>1. Natasha:</b> Opens eyes → picks a player to silence tomorrow → closes eyes.',
        '<br />&nbsp;&nbsp;• Target cannot speak during next day. Cannot silence the same player on consecutive nights.',
        '<br /><b>2. Mafia team (Boss/NATO):</b> Open eyes → pick shot → close eyes.',
        '<br />&nbsp;&nbsp;• <b>NATO:</b> Once per game may guess a player\'s exact role instead of shooting.',
        '<br />&nbsp;&nbsp;&nbsp;&nbsp;◦ Correct → that player is eliminated. Wrong → nothing happens.',
        '<br /><b>3. Dr. Lecter:</b> Opens eyes → saves one player (usually a mafia member) → closes eyes.',
        '<br />&nbsp;&nbsp;• Can save themselves only once per game.',
        '<br /><b>4. Doctor:</b> Opens eyes → saves → closes eyes.',
        '<br /><b>5. Detective:</b> Opens eyes → inquires → closes eyes.',
        '<br /><b>6. Sniper (if active):</b> Opens eyes → points at target if shooting → closes eyes.',
        '<br />&nbsp;&nbsp;• Commander then wakes to confirm or cancel the shot.',
      ].join('')),
      _gs('Special Rules', [
        '<b>Natasha (Silence):</b> Target cannot speak the next day. Priest can neutralize this silence.',
        '<br /><b>Dr. Lecter:</b> Saves mafia members (or anyone) from the night shot; one self-save per game.',
        '<br /><b>Judge:</b> Once per game may void a day vote result (usually declared at night).',
        '<br /><b>Commander:</b> Wakes after Sniper shoots and can confirm or cancel the shot.',
        '<br /><b>Priest:</b> Selects players to receive extra speaking time next day. Can neutralize Natasha\'s silence.',
        '<br /><b>Armored:</b> Immune to night shots. If voted out, role is revealed and they return to game.',
      ].join('')),
      _gs('Win Conditions', [
        '<b>City:</b> All mafia eliminated.',
        '<br /><b>Mafia:</b> Mafia equals or outnumbers remaining citizens.',
      ].join('')),
    ]),
  },

  // ══════════════════════════════════════════════════════════════════════════
  classicPro: {
    fa: _gw([
      _gs('معرفی و ترکیب', [
        'سناریو کلاسیک پرو — ترکیب کامل نقش‌ها. پیش‌فرض: ۱۲ نفر، ۴ مافیا.',
        '<br /><b>تیم مافیا:</b> پدرخوانده + ناتاشا + ناتو + تروریست + افسون‌گر + جاسوس + خراب‌کار + دزد + روانی + شاه‌کش + طردشده + مرد قوی + وکیل + یاکوزا + بمب‌گذار + دوئل‌من + قمارباز + لیدی وودو + مخترع خبیث + جراح + معشوقه + مافیا ساده',
        '<br /><b>تیم شهر:</b> کارآگاه + پزشک + تک‌تیرانداز + فرمانده + فراماسون + تایلر + کشیش + قاضی + کابوی + رویین‌تن + نگهبان + آهنگر + بازجو + بُمبر + تراز + تفنگ‌دار + دَبِل + روان‌شناس + ساقی + فداکار + لیدر + محافظ + آدم‌برفی + انتی لیدی وودو + چمدان‌دار + ردگیر + رولت روسی + ساعت‌ساز + عنکبوت + مخترع + ناجی + جادوگر + فدایی + کارآگاه ویژه + گورکن + شهروند',
        '<br /><b>مستقل:</b> پریزاد + ریپر + کیلر + نِرون + جک + گمبلر',
      ].join('')),
      _gs('ترتیب شب', [
        '<b>۱. دَبِل:</b> اولین نفر — بیدار → یک نفر را انتخاب می‌کند تا قابلیتش دو برابر شود → چشم می‌بندد.',
        '<br /><b>۲. ساقی:</b> بیدار → یک نفر را مست می‌کند → چشم می‌بندد.',
        '<br /><b>۳. دزد:</b> بیدار → یک نفر را انتخاب می‌کند تا قابلیتش را بدزدد → چشم می‌بندد.',
        '<br /><b>۴. ناتاشا:</b> بیدار → هدف فلج‌کردن روز بعد → چشم می‌بندد.',
        '<br /><b>۵. تیم مافیا (پدرخوانده):</b> بیدار → مشورت → پدرخوانده به‌تنهایی هدف شلیک را انتخاب می‌کند → چشم می‌بندند.',
        '<br />&nbsp;&nbsp;• پدرخوانده استعلام «منفی» (شهروند) دارد.',
        '<br />&nbsp;&nbsp;• ناتو: یک‌بار می‌تواند نقش دقیق یک نفر را حدس بزند (به جای شلیک).',
        '<br />&nbsp;&nbsp;• مرد قوی: یک‌بار می‌تواند به‌جای پدرخوانده شلیک مهلک کند.',
        '<br /><b>۶. جراح:</b> بیدار → یک مافیا را انتخاب می‌کند تا از حمله شبانه نجات دهد → چشم می‌بندد.',
        '<br /><b>۷. روان‌شناس:</b> بیدار → هدف شلیک را انتخاب می‌کند → تأییدکننده را انتخاب می‌کند → چشم می‌بندد. سپس تأییدکننده بیدار می‌شود و شلیک را تأیید یا رد می‌کند.',
        '<br /><b>۸. پزشک:</b> بیدار → نجات → چشم می‌بندد.',
        '<br /><b>۹. فراماسون/تایلر:</b> بیدار → یک نفر را بررسی می‌کند (مافیا = هر دو کشته / شهروند = آشنایی) → چشم می‌بندند.',
        '<br /><b>۱۰. کارآگاه:</b> بیدار → استعلام (یا شلیک مهلک یک‌باره) → چشم می‌بندد.',
        '<br /><b>۱۱. تک‌تیرانداز:</b> بیدار → اگر شلیک کند فرمانده بیدار می‌شود و تأیید یا رد می‌کند → چشم می‌بندند.',
        '<br /><b>۱۲. کشیش:</b> بیدار → هدف فلج‌کردن ناتاشا را حدس می‌زند (خنثی‌سازی) + نطق به یک نفر می‌دهد → چشم می‌بندد.',
      ].join('')),
      _gs('نقش‌های ویژه — مافیا', [
        '<b>تروریست:</b> یار خاموش — تیم مافیا را نمی‌شناسد. استعلام کارآگاه «شهروند». اگر قطعاً حذف شود می‌تواند یک نفر را با خود ببرد. اگر قبل از حذف قطعی اعلام کند به‌تنهایی بیرون می‌رود.',
        '<br /><b>دزد:</b> یار خاموش — قابلیت‌ها را می‌دزدد. اگر کارآگاه را انتخاب کند دستگیر می‌شود.',
        '<br /><b>طردشده:</b> یار خاموش — ۴ شب نامیرا. باید در ۴ شب اول ۲ هم‌تیمی را پیدا کند.',
        '<br /><b>شاه‌کش:</b> ۳ بار شانس حدس نقش دارد. اشتباه هر ۳ بار = خودش حذف می‌شود.',
        '<br /><b>معشوقه:</b> حذفش = مافیا آن شب ۲ نفر می‌کشد.',
      ].join('')),
      _gs('نقش‌های ویژه — شهر', [
        '<b>محافظ:</b> در شب نامیراست. جلوی تروریست را می‌گیرد (نامیرایی را از دست می‌دهد).',
        '<br /><b>آهنگر:</b> یک‌بار زره می‌سازد. زره: یک‌بار از مرگ در امان است.',
        '<br /><b>بُمبر:</b> انفجار روز (قبل رأی‌گیری) یا شب (اگر شلیک شود) — دو نفر کنارش هم حذف می‌شوند.',
        '<br /><b>تراز:</b> اگر رأی‌گیری تساوی داشت، تراز تعیین تکلیف می‌کند.',
        '<br /><b>بازجو:</b> یک‌بار دو نفر را به دفاع می‌برد و رأی حذف می‌زند (قاضی رد نمی‌کند).',
        '<br /><b>قاضی:</b> یک‌بار رأی‌گیری را باطل می‌کند.',
        '<br /><b>تفنگ‌دار:</b> تفنگ به شهروندان می‌دهد. تیرش رویین‌تن/محافظ/مستقل را می‌کشد.',
      ].join('')),
      _gs('مستقل‌ها', [
        '<b>پریزاد:</b> ارتش سایه می‌سازد. حدس نقش → تسخیر. اگر مافیا حدس بزند هر دو کشته می‌شوند.',
        '<br /><b>ریپر:</b> شب‌های زوج شلیک می‌کند. شب‌های فرد هر کس او را انتخاب کند (به جز دکتر) خودش کشته می‌شود.',
        '<br /><b>کیلر:</b> هر شب شلیک می‌کند. نامیراست. با ریپر هم‌زمان استفاده نمی‌شود.',
        '<br /><b>نِرون:</b> نفتی می‌کند. یک‌بار فندک می‌زند و همه نفتی‌شدگان می‌سوزند. شرط پیروزی: اول فندک.',
      ].join('')),
      _gs('شرط پیروزی', [
        '<b>شهر:</b> همه مافیا حذف شوند.',
        '<br /><b>مافیا:</b> تعداد مافیا برابر یا بیشتر از شهروندان شود.',
        '<br /><b>مستقل‌ها:</b> برابری شهروند و مافیا یا حذف کامل مافیا (نِرون: باید قبلاً فندک زده باشد).',
      ].join('')),
    ]),
    en: _gw([
      _gs('Overview & Composition', [
        'Classic Pro scenario — full role set. Default: 12 players, 4 mafia.',
        '<br /><b>Mafia:</b> Godfather + Natasha + NATO + Terrorist + Enchantress + Spy + Saboteur + Thief + Psycho + Shahkesh + Outcast + Strongman + Lawyer + Yakuza + Bomber + Duelman + Gambler + Lady Voodoo + Evil Inventor + Surgeon + Mistress + Simple Mafia',
        '<br /><b>City:</b> Detective + Doctor + Sniper + Commander + Freemason + Tyler + Priest + Judge + Cowboy + Invulnerable + Guardian + Armorer + Interrogator + Bomber + Tiebreaker + Gunmaker + Doubler + Psychologist + Bartender + Devout + Leader + Protector + Snowman + Anti-Lady Voodoo + Luggage Bearer + Tracker + Russian Roulette + Clockmaker + Spider + Inventor + Savior + Wizard + Devotee + Special Detective + Gravedigger + Citizens',
        '<br /><b>Independent:</b> Perizad + Reaper + Killer + Nero + Jack + Gambler',
      ].join('')),
      _gs('Night Phase', [
        '<b>1. Doubler:</b> First to wake — picks a player to double their ability → closes eyes.',
        '<br /><b>2. Bartender:</b> Opens eyes → intoxicates one player → closes eyes.',
        '<br /><b>3. Thief:</b> Opens eyes → steals one player\'s ability → closes eyes.',
        '<br /><b>4. Natasha:</b> Opens eyes → picks paralysis target (silenced next day) → closes eyes.',
        '<br /><b>5. Mafia team (Godfather):</b> Opens eyes → consults → Godfather alone picks the shot → close eyes.',
        '<br />&nbsp;&nbsp;• Godfather always shows "citizen" (negative) to Detective.',
        '<br />&nbsp;&nbsp;• NATO: once may guess an exact role instead of shooting.',
        '<br />&nbsp;&nbsp;• Strongman: once may replace the shot with a lethal bullet.',
        '<br /><b>6. Surgeon:</b> Opens eyes → selects a mafia member to protect from night attacks → closes eyes.',
        '<br /><b>7. Psychologist:</b> Opens eyes → picks shot target → picks confirmant → closes eyes. Confirmant then wakes and approves or cancels.',
        '<br /><b>8. Doctor:</b> Opens eyes → saves → closes eyes.',
        '<br /><b>9. Freemason/Tyler:</b> Open eyes → check one player (mafia = both die / citizen = mutual recognition) → close eyes.',
        '<br /><b>10. Detective:</b> Opens eyes → inquires (or uses one-time lethal shot) → closes eyes.',
        '<br /><b>11. Sniper:</b> Opens eyes → shoots if desired; Commander wakes to confirm or cancel → close eyes.',
        '<br /><b>12. Priest:</b> Opens eyes → guesses Natasha\'s paralysis target (to neutralize) + grants speech time to one player → closes eyes.',
      ].join('')),
      _gs('Special Roles — Mafia', [
        '<b>Terrorist:</b> Silent — doesn\'t know the team. Shows "citizen" to Detective. If definitively eliminated, can drag one player out. Announcing before elimination = exits alone.',
        '<br /><b>Thief:</b> Silent — steals abilities. Targeting Detective = arrested.',
        '<br /><b>Outcast:</b> Silent — 4-night immortal. Must find 2 teammates in the first 4 nights.',
        '<br /><b>Shahkesh:</b> 3 role-guess attempts. All 3 wrong = Shahkesh eliminated.',
        '<br /><b>Mistress:</b> If eliminated, mafia kills 2 that night.',
      ].join('')),
      _gs('Special Roles — City', [
        '<b>Protector:</b> Night-immortal. Intercepts Terrorist (loses immortality afterward).',
        '<br /><b>Armorer:</b> Crafts armor for one player. Armor: survives one lethal event.',
        '<br /><b>Bomber:</b> Day explosion (before vote) or night explosion (if shot) — two adjacent players also eliminated.',
        '<br /><b>Tiebreaker:</b> Breaks voting ties in round 2.',
        '<br /><b>Interrogator:</b> Once forces two players to defend and casts a binding elimination vote (Judge cannot override).',
        '<br /><b>Judge:</b> Once per game voids the day vote.',
        '<br /><b>Gunmaker:</b> Gives guns to citizens. Bullets kill Invulnerable, Protector, and independents.',
      ].join('')),
      _gs('Independents', [
        '<b>Perizad:</b> Builds shadow army by possessing players. Guessing mafia kills both.',
        '<br /><b>Reaper:</b> Shoots on even nights. On odd nights, anyone who selects Reaper (except Doctor) dies.',
        '<br /><b>Killer:</b> Shoots every night. Night-immortal. Cannot be used with Reaper.',
        '<br /><b>Nero:</b> Oils players, then ignites. Win condition requires igniting first.',
      ].join('')),
      _gs('Win Conditions', [
        '<b>City:</b> All mafia eliminated.',
        '<br /><b>Mafia:</b> Mafia equals or outnumbers remaining citizens.',
        '<br /><b>Independents:</b> City equals mafia or all mafia gone (Nero: must have ignited first).',
      ].join('')),
    ]),
  },

  // ══════════════════════════════════════════════════════════════════════════
  shab_mafia: {
    fa: _gw([
      _gs('معرفی و ترکیب', [
        'سناریو شب مافیا. مناسب برای ۱۲ نفر (پیش‌فرض: ۱۲ نفر، ۴ مافیا). دارای ویژگی «حرف آخر» و «کارت حذف».',
        '<br /><b>تیم مافیا:</b> پدرخوانده + دکتر لکتر + جوکر مافیا + مافیا ساده',
        '<br /><b>تیم شهر:</b> کارآگاه + پزشک + حرفه‌ای + جان‌سخت + روانپزشک + شهردار + فروشنده + شهروند',
      ].join('')),
      _gs('ترتیب شب', [
        '<b>۱. تیم مافیا (پدرخوانده):</b> بیدار → هدف شلیک → چشم می‌بندند.',
        '<br />&nbsp;&nbsp;• پدرخوانده استعلام «منفی» (شهروند) دارد.',
        '<br /><b>۲. دکتر لکتر:</b> بیدار → یک نفر را نجات می‌دهد → چشم می‌بندد.',
        '<br /><b>۳. جوکر مافیا:</b> بیدار → اگر می‌خواهد استعلام کارآگاه را برعکس کند، هدف را نشان می‌دهد → چشم می‌بندد.',
        '<br />&nbsp;&nbsp;• فقط ۲ بار در کل بازی. انتخاب تکراری پشت‌سرهم ممنوع.',
        '<br /><b>۴. کارآگاه:</b> بیدار → استعلام → چشم می‌بندد.',
        '<br /><b>۵. حرفه‌ای:</b> بیدار → اگر می‌خواهد شلیک کند، هدف را نشان می‌دهد → چشم می‌بندد.',
        '<br /><b>۶. پزشک:</b> بیدار → نجات → چشم می‌بندد.',
      ].join('')),
      _gs('نقش‌های شهری ویژه', [
        '<b>جان‌سخت:</b>',
        '<br />• شلیک اول مافیا کشنده نیست (خودش معمولاً متوجه نمی‌شود).',
        '<br />• ۲ بار در کل بازی می‌تواند وضعیت (ساید) یک بازیکن اخراجی را از گرداننده بپرسد.',
        '<br /><br /><b>روانپزشک:</b>',
        '<br />• ۲ بار در کل بازی می‌تواند توانایی صحبت/مکالمه یک بازیکن را برای آن جلسه از او بگیرد.',
        '<br /><br /><b>شهردار:</b>',
        '<br />• یک‌بار (فقط وقتی حداقل ۲ نفر در دفاعیه باشند و خودش در دفاعیه نباشد) می‌تواند:',
        '<br />&nbsp;&nbsp;• رأی‌گیری را لغو کند، یا',
        '<br />&nbsp;&nbsp;• مستقیماً حکم خروج یکی از افراد دفاعیه را بدهد.',
        '<br /><br /><b>فروشنده:</b>',
        '<br />• یک‌بار می‌تواند توانایی یک نفر را برای <b>کل بازی</b> از او بگیرد.',
        '<br />• فردای همان روز، انتخاب فروشنده توسط گرداننده اعلام می‌شود.',
      ].join('')),
      _gs('کارت‌های حذف', [
        'وقتی هر بازیکنی از بازی خارج می‌شود، یک کارت کشیده می‌شود:',
        '<br /><b>بی‌خوابی:</b> بازیکن باید تمام شب بیدار بماند (بدون خوابیدن در صحنه).',
        '<br /><b>شلیک نهایی:</b> بازیکن می‌تواند یک شلیک نهایی انجام دهد.',
        '<br /><b>ذهن زیبا:</b> بازیکن یک پیش‌بینی از بازی می‌گوید.',
        '<br /><b>دروغ سیزده:</b> بازیکن باید یک دروغ مشخص درباره بازی بگوید.',
        '<br /><b>مسیر سبز:</b> بازیکن می‌تواند یک نفر را از کارت نجات دهد.',
        '<br /><b>فرش قرمز:</b> بازیکن با احترام کامل بازی را ترک می‌کند (اعلام خاص گرداننده).',
        '<br /><i>جزئیات دقیق بسته به قوانین میز متفاوت است.</i>',
      ].join('')),
      _gs('ویژگی حرف آخر', [
        'این سناریو ویژگی «حرف آخر» دارد:',
        '<br />وقتی بازیکنی از بازی خارج می‌شود، قبل از کشیدن کارت، فرصت دارد حرف آخر بزند.',
        '<br />حرف آخر معمولاً محدود (۳۰–۶۰ ثانیه) است.',
      ].join('')),
      _gs('شرط پیروزی', [
        '<b>شهر:</b> همه مافیا حذف شوند.',
        '<br /><b>مافیا:</b> تعداد مافیا برابر یا بیشتر از شهروندان شود.',
      ].join('')),
    ]),
    en: _gw([
      _gs('Overview & Composition', [
        'Mafia Nights scenario. Default: 12 players, 4 mafia. Features "Last Words" and Elimination Cards.',
        '<br /><b>Mafia:</b> Godfather + Dr. Lecter + Mafia Joker + Simple Mafia',
        '<br /><b>City:</b> Detective + Doctor + Professional + Hard John + Psychiatrist + Mayor + Seller + Citizens',
      ].join('')),
      _gs('Night Phase', [
        '<b>1. Mafia team (Godfather):</b> Open eyes → pick shot → close eyes.',
        '<br />&nbsp;&nbsp;• Godfather shows "citizen" (negative) to Detective.',
        '<br /><b>2. Dr. Lecter:</b> Opens eyes → saves someone → closes eyes.',
        '<br /><b>3. Mafia Joker:</b> Opens eyes → may pick a player to flip Detective\'s inquiry result → closes eyes.',
        '<br />&nbsp;&nbsp;• Max 2 times per game; no consecutive repeat target.',
        '<br /><b>4. Detective:</b> Opens eyes → inquires → closes eyes.',
        '<br /><b>5. Professional:</b> Opens eyes → shoots if desired → closes eyes.',
        '<br /><b>6. Doctor:</b> Opens eyes → saves → closes eyes.',
      ].join('')),
      _gs('Special City Roles', [
        '<b>Hard John:</b>',
        '<br />• Survives the first mafia night shot (usually doesn\'t know they were shot).',
        '<br />• Twice per game may ask the Host for the side (team) of any eliminated player.',
        '<br /><br /><b>Psychiatrist:</b>',
        '<br />• Twice per game can remove a player\'s ability to speak for that session.',
        '<br /><br /><b>Mayor:</b>',
        '<br />• Once (when 2+ players are in defense and Mayor is not one of them) may:',
        '<br />&nbsp;&nbsp;• Cancel the vote entirely, or',
        '<br />&nbsp;&nbsp;• Directly order one defendant eliminated.',
        '<br /><br /><b>Seller:</b>',
        '<br />• Once can remove a player\'s ability for the <b>rest of the game</b>.',
        '<br />• Next morning the Host announces which player was targeted.',
      ].join('')),
      _gs('Elimination Cards', [
        'When any player is eliminated, one card is drawn:',
        '<br /><b>Insomnia:</b> Player must stay "awake" (no in-scene sleeping).',
        '<br /><b>Final Shot:</b> Player may take one final shot.',
        '<br /><b>Beautiful Mind:</b> Player makes a game prediction.',
        '<br /><b>Thirteen Lies:</b> Player must state one specific lie about the game.',
        '<br /><b>Green Mile:</b> Player may save one person from their card.',
        '<br /><b>Red Carpet:</b> Player exits with special host fanfare.',
        '<br /><i>Exact effects depend on table rules.</i>',
      ].join('')),
      _gs('Last Words Feature', [
        'This scenario features "Last Words":',
        '<br />When eliminated, a player may speak briefly (30–60 seconds) before the elimination card is drawn.',
      ].join('')),
      _gs('Win Conditions', [
        '<b>City:</b> All mafia eliminated.',
        '<br /><b>Mafia:</b> Mafia equals or outnumbers remaining citizens.',
      ].join('')),
    ]),
  },

};

// ── Public API ────────────────────────────────────────────────────────────────
function showScenarioGuide(scenarioId) {
  const cfg = getScenarioConfig(scenarioId);
  const lang = typeof appLang !== 'undefined' ? appLang : 'fa';
  const guide = SCENARIO_GUIDES[scenarioId];
  const version = (typeof STR !== 'undefined' && STR.version) ? STR.version : '1.0.0';
  const appName = (typeof t === 'function' && t('app.title')) ? t('app.title') : (lang === 'fa' ? 'اپلیکیشن بازی مافیا' : 'Mafia Game Assistant');
  const title = appName + ': v' + version;
  let body = guide ? (guide[lang] || guide.fa) : '<div class="toolBox">' + (lang === 'fa' ? 'راهنمایی برای این سناریو موجود نیست.' : 'No guide available for this scenario.') + '</div>';
  const scenarioLabel = lang === 'fa' ? ('راهنمای سناریو: ' + cfg.name.fa) : ('Scenario Guide: ' + cfg.name.en);
  body = '<div class="note" style="margin-bottom:12px; font-weight:600">' + scenarioLabel + '</div>' + body;
  const hintText = typeof t === "function" ? t("help.clearFairnessHistoryHint") : "";
  const btnText = typeof t === "function" ? t("help.clearFairnessHistory") : "Clear history";
  const clearFooter =
    '<div class="fairness-history-clear" style="margin-top:20px;padding-top:14px;border-top:1px solid rgba(255,255,255,.12)">' +
    '<p class="note" style="margin:0 0 10px;font-size:12px;line-height:1.45;color:#94a3b8">' +
    _escHtml(hintText) +
    "</p>" +
    '<p class="note" id="fairnessClearFeedback" style="display:none;margin:0 0 8px;font-size:12px;color:#86efac" role="status" aria-live="polite"></p>' +
    '<button type="button" class="btn" id="helpClearFairnessHistoryBtn">' +
    _escHtml(btnText) +
    "</button>" +
    "</div>";
  body = body + clearFooter;
  openToolModal(title, body);
}
