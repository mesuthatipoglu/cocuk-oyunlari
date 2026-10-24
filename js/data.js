// ÇOCUK OYUNLARI DÜNYASI (3-6 YAŞ) - PBS KIDS EN İYİ 5 OYUN & EN ÇOK TUTULAN TABLET OYUNU
// KURAL GEREĞİ TARİH VE SAAT İÇEREN VERSİYON NUMARASI:
const APP_VERSION = "v1.0.0 - 2026-10-25 00:18";

const KIDS_GAMES = [
  {
    id: "tablet_tocalife",
    num: 1,
    category: "tablet",
    isFeaturedTablet: true,
    badge: "📱 DÜNYADA EN ÇOK TUTULAN 3-6 YAŞ TABLET OYUNU",
    ageTag: "3-6 Yaş • Serbest Keşif & Yaratıcılık",
    title: "TOCA MİNİ DÜNYA: HAYAL EVİ, ŞİRİN MUTFAK & SANAT",
    skill: "Hayal Gücü • Yemek Hazırlama • Karakter Giydirme • Evcil Hayvan Bakımı",
    icon: "🏡",
    color: "#ff5e8e",
    accent: "#ffd93d",
    desc: "Piyasadaki en popüler 3-6 yaş tablet oyunu (Toca Life World & Khan Kids tarzı)! 4 interaktif odada karakterlere yemek ve smoothie hazırla, komik tepkilerini izle, kostümler giydir, yavru hayvanları köpükle yıka ve gökkuşağı fırçasıyla boyama yap!",
    modes: [
      { id: "kitchen", name: "🍓 Şirin Mutfak & Smoothie", icon: "🍓", desc: "Karaktere meyve, pizza ve dondurma hazırla, yedir!" },
      { id: "dressup", name: "👑 Kostüm & Giydirme Odası", icon: "👑", desc: "Şapkalar, pelerinler ve gözlüklerle karakterini süsle!" },
      { id: "petcare", name: "🐶 Köpüklü Hayvan Banyosu", icon: "🐶", desc: "Yavru köpeği, kediyi ve tavşanı köpükle yıka ve besle!" },
      { id: "artparty", name: "🎨 Balon & Gökkuşağı Boyama", icon: "🎨", desc: "Renkli fırçalarla çiz, çıkartma yapıştır ve balon patlat!" }
    ]
  },
  {
    id: "pbs_daniel",
    num: 2,
    category: "pbs",
    badge: "📺 PBS KIDS 3-6 YAŞ EN İYİ #1",
    ageTag: "3-6 Yaş • Sosyal & Duygusal Gelişim",
    title: "DANIEL TIGER: DUYGULAR & PAYLAŞIM PARTİSİ",
    skill: "Duyguları Tanıma • Sakinleşme Nefesi • Arkadaşlarla Paylaşma",
    icon: "🐯",
    color: "#ff8c32",
    accent: "#ff5e8e",
    desc: "Daniel Tiger's Neighborhood klasiği! Sevimli kaplan Daniel ile mutlu, üzgün, şaşkın ve kızgın duyguları tanı, 4'e kadar sayarak sakinleşme balonlarını patlat ve çay partisinde arkadaşlarınla kurabiye paylaş!",
    modes: [
      { id: "feelings", name: "😊 Duygu Yüzünü Bul", icon: "😊", desc: "Daniel'in hikayesini dinle ve doğru duygu yüzüne dokun!" },
      { id: "breathe", name: "🫧 Sakinleşme Balonları", icon: "🫧", desc: "Derin nefes al, 1-2-3-4 diye sayarak balonları patlat!" },
      { id: "sharing", name: "🧁 Çay Partisi Paylaşımı", icon: "🧁", desc: "Kurabiyeleri ve meyveleri arkadaşlara eşit paylaştır!" }
    ]
  },
  {
    id: "pbs_wildkratts",
    num: 3,
    category: "pbs",
    badge: "📺 PBS KIDS 3-6 YAŞ EN İYİ #2",
    ageTag: "3-6 Yaş • Doğa & Hayvan Bilimi",
    title: "WILD KRATTS: HAYVAN GÜCÜ KURTARMA",
    skill: "Hayvan Yetenekleri • Doğa Sevgisi • Refleks & Hareket",
    icon: "🐾",
    color: "#2ecc71",
    accent: "#00f2fe",
    desc: "Kardeşler Kratt'ın Creature Power (Hayvan Gücü) giysilerini giy! Çita gibi hızlı koş, Kanguru gibi yükseğe zıpla, Yunus gibi okyanusta yüz ve Kartal gibi gökyüzünde süzülerek yavru hayvanları kurtar!",
    modes: [
      { id: "cheetah", name: "🐆 Çita Hızı (Savana)", icon: "🐆", desc: "Engellerden zıpla ve yavru çitaları kurtar!" },
      { id: "dolphin", name: "🐬 Yunus Dalışı (Okyanus)", icon: "🐬", desc: "Mercanların arasında yüzerek yavru balıkları kurtar!" },
      { id: "eagle", name: "🦅 Kartal Uçuşu (Gökyüzü)", icon: "🦅", desc: "Bulutların arasında uçarak yuvadaki kuşlara ulaş!" }
    ]
  },
  {
    id: "pbs_george",
    num: 4,
    category: "pbs",
    badge: "📺 PBS KIDS 3-6 YAŞ EN İYİ #3",
    ageTag: "3-6 Yaş • Sayı Sayma & Renk Gruplama",
    title: "CURIOUS GEORGE: MERAKLI MAYMUN SAYI FESTİVALİ",
    skill: "1-10 Sayı Sayma • Renk Eşleştirme • Tren Örüntüleri",
    icon: "🐵",
    color: "#ffd93d",
    accent: "#ff8c32",
    desc: "Meraklı Maymun George ile sayıları ve renkleri keşfet! Sesli Türkçe sayarak George'a balon topla, elma ve muzları doğru renkteki sepetlere ayır ve neşeli oyuncak trenin eksik vagonunu tamamla!",
    modes: [
      { id: "balloons", name: "🎈 Balon & Muz Sayma", icon: "🎈", desc: "1'den 10'a kadar birlikte sesli sayarak balonları topla!" },
      { id: "baskets", name: "🧺 Renkli Meyve Sepetleri", icon: "🧺", desc: "Meyveleri Kırmızı, Sarı ve Yeşil sepetlere yerleştir!" },
      { id: "train", name: "🚂 Tren Vagonu Örüntüsü", icon: "🚂", desc: "Sıradaki rengi veya şekli bularak treni hareket ettir!" }
    ]
  },
  {
    id: "pbs_superwhy",
    num: 5,
    category: "pbs",
    badge: "📺 PBS KIDS 3-6 YAŞ EN İYİ #4",
    ageTag: "3-6 Yaş • Harfler, Sesler & İlk Kelimeler",
    title: "SUPER WHY!: SÜPER HARF & MASAL KAHRAMANLARI",
    skill: "Harf Tanıma • Baş Harf Bulma • Kelime Roketi",
    icon: "🦸‍♂️",
    color: "#00f2fe",
    accent: "#a66cff",
    desc: "Süper Okuyucular (Super Readers) iş başında! Alpha Pig ile harf köprüsünü kur, Wonder Red ile kelimelerin hangi harfle başladığını bul ve Super Why'ın masal roketiyle yıldız harfleri topla!",
    modes: [
      { id: "firstletter", name: "🔤 Hangi Harfle Başlar?", icon: "🔤", desc: "Resmi dinle (Elma, Kedi, Arı...) ve baş harfini seç!" },
      { id: "alphabridge", name: "🌉 Alpha Pig Harf Köprüsü", icon: "🌉", desc: "Harflere sırayla dokunarak gökkuşağı köprüsünü tamamla!" },
      { id: "wordrocket", name: "🚀 Kelime Roketi Uçuşu", icon: "🚀", desc: "Roketle uçarak kelimenin harflerini sırayla yakala!" }
    ]
  },
  {
    id: "pbs_pegcat",
    num: 6,
    category: "pbs",
    badge: "📺 PBS KIDS 3-6 YAŞ EN İYİ #5",
    ageTag: "3-6 Yaş • Şekiller, Boyutlar & Uzay Matematiği",
    title: "PEG + CAT: ŞEKİLLİ PİZZA & UZAY MATEMATİĞİ",
    skill: "Geometrik Şekiller • Küçük-Orta-Büyük • 10'a Tamamlama",
    icon: "🐱",
    color: "#a66cff",
    accent: "#ffd93d",
    desc: "Peg ve sevimli mavi kedisi Cat ile eğlenceli matematik krizlerini çöz! Müşterilere Daire, Üçgen, Kare ve Yıldız şekilleriyle pizza hazırla, eşyaları küçükten büyüğe sırala ve uzay tavuklarını rokete bindir!",
    modes: [
      { id: "pizza", name: "🍕 Şekilli Pizza Dükkanı", icon: "🍕", desc: "İstenen geometrik şekilleri seçerek pizzayı süsle!" },
      { id: "sizes", name: "📏 Küçük - Orta - Büyük", icon: "📏", desc: "Nesneleri boyutlarına göre doğru kutulara yerleştir!" },
      { id: "chickens", name: "🐔 Uzay Tavukları Roketi", icon: "🐔", desc: "Eksik koltukları sayarak tavukları uzay roketine bindir!" }
    ]
  }
];

// ==================== EĞİTİCİ İÇERİK VERİ SETLERİ ====================
const DANIEL_EMOTIONS = [
  { id: "happy", emoji: "😄", label: "MUTLU", color: "#2ecc71", prompt: "Daniel bugün parkta arkadaşlarıyla kaydıraktan kaydı! Daniel nasıl hissediyor? Mutlu yüzü bul!" },
  { id: "sad", emoji: "😢", label: "ÜZGÜN", color: "#38bdf8", prompt: "Daniel'in dondurması külahından yere düştü! Daniel nasıl hissediyor? Üzgün yüzü bul!" },
  { id: "excited", emoji: "🤩", label: "HEYECANLI", color: "#ffd93d", prompt: "Daniel doğum günü pastasını ve balonları gördü! Çok heyecanlı yüzü bul!" },
  { id: "angry", emoji: "😠", label: "KIZGIN", color: "#ff5e8e", prompt: "Daniel'in yaptığı oyuncak kule devrildi ve biraz kızdı. Kızgın yüzü bul!" },
  { id: "surprised", emoji: "😮", label: "ŞAŞKIN", color: "#a66cff", prompt: "Kutunun içinden bir anda sevimli bir tavşan çıktı! Şaşkın yüzü bul!" },
  { id: "loved", emoji: "🥰", label: "SEVGİ DOLU", color: "#ff8c32", prompt: "Annesi Daniel'e sımsıkı sarıldı! Sevgi dolu yüzü bul!" }
];

const WILD_KRATTS_ANIMALS = {
  cheetah: {
    heroEmoji: "🐆",
    babyEmoji: "🐱",
    foodEmoji: "🥩",
    obsEmoji: "🪵",
    bgTop: "#f59e0b",
    bgBot: "#78350f",
    name: "Çita Gücü",
    fact: "Biliyor muydun? Çitalar dünyanın en hızlı koşan kara hayvanıdır! Saniyeler içinde rüzgar gibi hızlanırlar."
  },
  dolphin: {
    heroEmoji: "🐬",
    babyEmoji: "🐠",
    foodEmoji: "🐚",
    obsEmoji: "🪼",
    bgTop: "#0284c7",
    bgBot: "#0c4a6e",
    name: "Yunus Gücü",
    fact: "Biliyor muydun? Yunuslar su altında ıslık ve tıklama sesleriyle birbirleriyle konuşurlar ve çok zekidirler!"
  },
  eagle: {
    heroEmoji: "🦅",
    babyEmoji: "🐣",
    foodEmoji: "🍒",
    obsEmoji: "⛈️",
    bgTop: "#38bdf8",
    bgBot: "#1e3a8a",
    name: "Kartal Gücü",
    fact: "Biliyor muydun? Kartalların gözleri o kadar keskindir ki çok yüksekten bile küçücük bir balığı görebilirler!"
  }
};

const SUPERWHY_WORDS = [
  { letter: "A", word: "ARI", emoji: "🐝", color: "#ffd93d" },
  { letter: "B", word: "BALIK", emoji: "🐟", color: "#00f2fe" },
  { letter: "C", word: "CİVCİV", emoji: "🐥", color: "#facc15" },
  { letter: "Ç", word: "ÇİLEK", emoji: "🍓", color: "#ff5e8e" },
  { letter: "D", word: "DONDURMA", emoji: "🍦", color: "#f472b6" },
  { letter: "E", word: "ELMA", emoji: "🍎", color: "#ef4444" },
  { letter: "F", word: "FİL", emoji: "🐘", color: "#94a3b8" },
  { letter: "G", word: "GÜNEŞ", emoji: "🌞", color: "#fbbf24" },
  { letter: "K", word: "KEDİ", emoji: "🐱", color: "#fb923c" },
  { letter: "K", word: "KÖPEK", emoji: "🐶", color: "#a8a29e" },
  { letter: "M", word: "MAYMUN", emoji: "🐵", color: "#d97706" },
  { letter: "O", word: "OTOBÜS", emoji: "🚌", color: "#f59e0b" },
  { letter: "P", word: "PASTA", emoji: "🎂", color: "#ec4899" },
  { letter: "S", word: "SAAT", emoji: "⏰", color: "#38bdf8" },
  { letter: "T", word: "TAVŞAN", emoji: "🐰", color: "#f472b6" },
  { letter: "U", word: "UÇAK", emoji: "✈️", color: "#60a5fa" },
  { letter: "Y", word: "YILDIZ", emoji: "⭐", color: "#fde047" },
  { letter: "Z", word: "ZÜRAFA", emoji: "🦒", color: "#fbbf24" }
];

const PEGCAT_SHAPES = [
  { id: "circle", name: "DAİRE", color: "#ff5e8e", emoji: "🔴" },
  { id: "triangle", name: "ÜÇGEN", color: "#ffd93d", emoji: "🔺" },
  { id: "square", name: "KARE", color: "#00f2fe", emoji: "🟦" },
  { id: "star", name: "YILDIZ", color: "#2ecc71", emoji: "⭐" },
  { id: "heart", name: "KALP", color: "#a66cff", emoji: "💜" }
];

const TOCA_FOODS = [
  { id: "strawberry", emoji: "🍓", name: "Çilek", color: "#ff5e8e", reaction: "love", msg: "Mmm! Tatlı çilek çok lezzetli!" },
  { id: "banana", emoji: "🍌", name: "Muz", color: "#ffd93d", reaction: "love", msg: "Harika! Muz enerji verdi!" },
  { id: "pizza", emoji: "🍕", name: "Pizza", color: "#ff8c32", reaction: "love", msg: "Sıcak peynirli pizza, nefiiis!" },
  { id: "icecream", emoji: "🍦", name: "Dondurma", color: "#00f2fe", reaction: "excited", msg: "Buz gibi vanilyalı dondurma, yaşasın!" },
  { id: "broccoli", emoji: "🥦", name: "Brokoli", color: "#2ecc71", reaction: "strong", msg: "Sağlıklı brokoli! Süper güçlü oldum!" },
  { id: "lemon", emoji: "🍋", name: "Limon", color: "#fde047", reaction: "sour", msg: "Brrr! Limon çok ekşiymiş, yüzüm buruştu!" },
  { id: "cake", emoji: "🎂", name: "Pasta", color: "#a66cff", reaction: "excited", msg: "Doğum günü pastası! Parti zamanı!" },
  { id: "milk", emoji: "🥛", name: "Süt", color: "#f8fafc", reaction: "love", msg: "Kemikler için taze süt!" }
];

const TOCA_COSTUMES = [
  { id: "crown", emoji: "👑", name: "Altın Taç", hat: "👑", bodyColor: "#ffd93d" },
  { id: "astro", emoji: "🧑‍🚀", name: "Astronot", hat: "🪖", bodyColor: "#38bdf8" },
  { id: "chef", emoji: "👨‍🍳", name: "Usta Şef", hat: "🎩", bodyColor: "#f8fafc" },
  { id: "super", emoji: "🦸", name: "Süper Kahraman", hat: "⚡", bodyColor: "#ef4444" },
  { id: "wizard", emoji: "🧙", name: "Sihirbaz", hat: "🔮", bodyColor: "#a66cff" },
  { id: "party", emoji: "🎉", name: "Parti Kostümü", hat: "🥳", bodyColor: "#2ecc71" }
];

const STICKER_COLLECTION = [
  { id: "s1", emoji: "🐯", name: "Daniel Kaplan" },
  { id: "s2", emoji: "🐆", name: "Süper Çita" },
  { id: "s3", emoji: "🐵", name: "Meraklı Maymun" },
  { id: "s4", emoji: "🦸‍♂️", name: "Süper Okuyucu" },
  { id: "s5", emoji: "🐱", name: "Mavi Kedi Cat" },
  { id: "s6", emoji: "🏡", name: "Hayal Evi" },
  { id: "s7", emoji: "🦄", name: "Gökkuşağı Unicorn" },
  { id: "s8", emoji: "🦖", name: "Neşeli Dino" },
  { id: "s9", emoji: "🐬", name: "Mavi Yunus" },
  { id: "s10", emoji: "🦅", name: "Altın Kartal" },
  { id: "s11", emoji: "🚀", name: "Uzay Roketi" },
  { id: "s12", emoji: "🌈", name: "Parlak Gökkuşağı" },
  { id: "s13", emoji: "🍕", name: "Şekilli Pizza" },
  { id: "s14", emoji: "🍦", name: "Süper Dondurma" },
  { id: "s15", emoji: "🎈", name: "Uçan Balon" },
  { id: "s16", emoji: "👑", name: "Kraliyet Tacı" },
  { id: "s17", emoji: "🐶", name: "Köpüklü Köpek" },
  { id: "s18", emoji: "🐰", name: "Pamuk Tavşan" },
  { id: "s19", emoji: "🚂", name: "Renkli Tren" },
  { id: "s20", emoji: "🎸", name: "Peg'in Gitarı" },
  { id: "s21", emoji: "🧁", name: "Paylaşım Kek" },
  { id: "s22", emoji: "🌟", name: "Süper Yıldız" },
  { id: "s23", emoji: "🎨", name: "Sanat Paleti" },
  { id: "s24", emoji: "🏆", name: "Şampiyon Kupası" }
];

// ==================== SES & TÜRKÇE KONUŞMA MOTORU (3-6 YAŞ DOSTU) ====================
const KidsAudio = {
  ctx: null,
  soundEnabled: true,
  voiceEnabled: true,

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  },

  playTone(freq, dur = 0.14, type = "sine", vol = 0.18, delay = 0) {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + dur);
  },

  pop() {
    this.playTone(520, 0.09, "sine", 0.2);
    this.playTone(780, 0.11, "triangle", 0.18, 0.04);
  },

  correct() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((n, i) => this.playTone(n, 0.16, "triangle", 0.2, i * 0.07));
  },

  gentleTryAgain() {
    this.playTone(350, 0.15, "sine", 0.14);
    this.playTone(310, 0.18, "sine", 0.12, 0.12);
  },

  fanfare() {
    const melody = [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5];
    melody.forEach((n, i) => this.playTone(n, 0.22, "triangle", 0.22, i * 0.11));
  },

  munch() {
    this.playTone(280, 0.08, "sawtooth", 0.12, 0);
    this.playTone(340, 0.08, "sawtooth", 0.12, 0.1);
    this.playTone(420, 0.12, "triangle", 0.15, 0.2);
  },

  speak(text) {
    if (!this.voiceEnabled || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "tr-TR";
      u.rate = 0.96;
      u.pitch = 1.15;
      const voices = window.speechSynthesis.getVoices();
      const trVoice = voices.find((v) => v.lang && v.lang.toLowerCase().includes("tr"));
      if (trVoice) u.voice = trVoice;
      window.speechSynthesis.speak(u);
    } catch (e) {}
  }
};
