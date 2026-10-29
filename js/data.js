// ÇOCUK OYUNLARI DÜNYASI (3-6 YAŞ) - PBS KIDS EN İYİ 5 OYUN & POPÜLER TABLET OYUNU
// KURAL GEREĞİ TARİH VE SAAT İÇEREN VERSİYON NUMARASI:
const APP_VERSION = "v2.0.1 - 2026-10-29 19:08";

// Eğer tarayıcıda eski Service Worker önbelleğinden kalan eski index.html yüklendiyse (#game-stage yoksa),
// tüm eski önbellekleri ve Service Worker'ı silip sayfayı temiz olarak yeniden yükle:
(function ensureFreshDOMShell() {
  if (typeof document !== "undefined" && !document.getElementById("game-stage")) {
    Promise.all([
      ("serviceWorker" in navigator)
        ? navigator.serviceWorker.getRegistrations().then(function(regs) {
            return Promise.all(regs.map(function(r) { return r.unregister(); }));
          })
        : Promise.resolve(),
      ("caches" in window)
        ? caches.keys().then(function(keys) {
            return Promise.all(keys.map(function(k) { return caches.delete(k); }));
          })
        : Promise.resolve()
    ]).finally(function() {
      if (window.location.search.indexOf("reloaded=1") === -1) {
        window.location.replace(window.location.pathname + "?reloaded=1&t=" + Date.now());
      }
    });
  }
})();

const KIDS_GAMES = [
  {
    id: "tablet_tocalife",
    num: 1,
    category: "tablet",
    isFeaturedTablet: true,
    badge: "📱 EN ÇOK TUTULAN 3-6 YAŞ TABLET OYUNU",
    ageTag: "3-6 Yaş",
    title: "TOCA MİNİ DÜNYA: HAYAL EVİ & MUTFAK",
    skill: "Yemek Hazırlama • Kostüm Giydirme • Köpüklü Banyo • Sanat",
    svg: "assets/svg/house.svg",
    sideSvgs: ["assets/svg/strawberry.svg", "assets/svg/crown.svg", "assets/svg/dog.svg"],
    bannerBg: "linear-gradient(135deg, #fbcfe8 0%, #fef08a 50%, #bbf7d0 100%)",
    color: "#ec4899",
    accent: "#f97316",
    desc: "Piyasadaki en popüler 3-6 yaş tablet oyunu! Karakterlere meyve, pizza ve dondurma yedir, kostümler giydir, yavru hayvanları köpükle yıka ve balon patlat!",
    modes: [
      { id: "kitchen", name: "Şirin Mutfak", svg: "assets/svg/strawberry.svg", voiceKey: "toca_kitchen", desc: "Meyve, pizza ve dondurma yedir!" },
      { id: "dressup", name: "Kostüm Odası", svg: "assets/svg/crown.svg", voiceKey: "toca_dressup", desc: "Şapkalar ve kostümler giydir!" },
      { id: "petcare", name: "Köpüklü Banyo", svg: "assets/svg/dog.svg", voiceKey: "toca_petcare", desc: "Yavru hayvanları köpükle yıka!" },
      { id: "artparty", name: "Balon & Sanat", svg: "assets/svg/palette.svg", voiceKey: "toca_artparty", desc: "Renkli balonları patlat ve boya!" }
    ]
  },
  {
    id: "pbs_daniel",
    num: 2,
    category: "pbs",
    badge: "📺 PBS KIDS #1",
    ageTag: "3-6 Yaş",
    title: "DANIEL TIGER: DUYGU & PAYLAŞIM",
    skill: "Duyguları Tanıma • Sakinleşme Nefesi • Paylaşma",
    svg: "assets/svg/tiger.svg",
    sideSvgs: ["assets/svg/happy.svg", "assets/svg/cupcake.svg", "assets/svg/rainbow.svg"],
    bannerBg: "linear-gradient(135deg, #fed7aa 0%, #fef08a 100%)",
    color: "#f97316",
    accent: "#ec4899",
    desc: "Sevimli kaplan Daniel ile mutlu, üzgün, şaşkın ve heyecanlı yüzleri bul, 4'e kadar sayarak nefes balonlarını patlat ve arkadaşlarınla kurabiye paylaş!",
    modes: [
      { id: "feelings", name: "Duygu Yüzleri", svg: "assets/svg/happy.svg", voiceKey: "daniel_happy", desc: "Doğru duygu yüzünü bul!" },
      { id: "breathe", name: "Nefes Balonları", svg: "assets/svg/bubbles.svg", voiceKey: "daniel_breathe", desc: "1-2-3-4 sayarak balonları patlat!" },
      { id: "sharing", name: "Çay Partisi", svg: "assets/svg/cupcake.svg", voiceKey: "daniel_sharing", desc: "Arkadaşlara ikramları paylaştır!" }
    ]
  },
  {
    id: "pbs_wildkratts",
    num: 3,
    category: "pbs",
    badge: "📺 PBS KIDS #2",
    ageTag: "3-6 Yaş",
    title: "WILD KRATTS: HAYVAN GÜCÜ",
    skill: "Doğa & Hayvan Bilimi • Çita, Yunus & Kartal Gücü",
    svg: "assets/svg/cheetah.svg",
    sideSvgs: ["assets/svg/dolphin.svg", "assets/svg/eagle.svg", "assets/svg/lion.svg"],
    bannerBg: "linear-gradient(135deg, #bbf7d0 0%, #7dd3fc 100%)",
    color: "#16a34a",
    accent: "#0284c7",
    desc: "Hayvan Gücü giysilerini giy! Savanada Çita, okyanusta Yunus ve gökyüzünde Kartal gücüyle yavru hayvanları kurtar!",
    modes: [
      { id: "cheetah", name: "Çita Savanası", svg: "assets/svg/cheetah.svg", voiceKey: "kratts_cheetah", desc: "Yavru çitaları ve aslanları kurtar!" },
      { id: "dolphin", name: "Yunus Okyanusu", svg: "assets/svg/dolphin.svg", voiceKey: "kratts_dolphin", desc: "Mercanlardaki yavru balıkları kurtar!" },
      { id: "eagle", name: "Kartal Gökyüzü", svg: "assets/svg/eagle.svg", voiceKey: "kratts_eagle", desc: "Bulutlardaki yavru kuşları kurtar!" }
    ]
  },
  {
    id: "pbs_george",
    num: 4,
    category: "pbs",
    badge: "📺 PBS KIDS #3",
    ageTag: "3-6 Yaş",
    title: "CURIOUS GEORGE: SAYI & RENK",
    skill: "1-10 Sayı Sayma • Renkli Sepetler • Tren Örüntüsü",
    svg: "assets/svg/monkey.svg",
    sideSvgs: ["assets/svg/balloon.svg", "assets/svg/banana.svg", "assets/svg/train.svg"],
    bannerBg: "linear-gradient(135deg, #fef08a 0%, #fed7aa 100%)",
    color: "#eab308",
    accent: "#f97316",
    desc: "Meraklı Maymun George ile sesli Türkçe sayarak balonları topla, meyveleri rengine göre sepetlere ayır ve oyuncak trenin vagonunu tamamla!",
    modes: [
      { id: "balloons", name: "Balon Sayma", svg: "assets/svg/balloon.svg", voiceKey: "george_balloons", desc: "Sesli sayarak balonları topla!" },
      { id: "baskets", name: "Meyve Sepetleri", svg: "assets/svg/apple.svg", voiceKey: "george_red", desc: "Meyveleri doğru renk sepete koy!" },
      { id: "train", name: "Renkli Tren", svg: "assets/svg/train.svg", voiceKey: "george_train", desc: "Eksik tren vagonunu bul!" }
    ]
  },
  {
    id: "pbs_superwhy",
    num: 5,
    category: "pbs",
    badge: "📺 PBS KIDS #4",
    ageTag: "3-6 Yaş",
    title: "SUPER WHY!: SÜPER HARFLER",
    skill: "Harf Tanıma • Baş Harf Bulma • Kelime Roketi",
    svg: "assets/svg/superhero.svg",
    sideSvgs: ["assets/svg/pig.svg", "assets/svg/rocket.svg", "assets/svg/castle.svg"],
    bannerBg: "linear-gradient(135deg, #bae6fd 0%, #e9d5ff 100%)",
    color: "#0284c7",
    accent: "#7c3aed",
    desc: "Süper Okuyucular ile kelimelerin hangi harfle başladığını bul, Alpha Pig ile gökkuşağı harf köprüsünü kur ve kelime roketiyle uç!",
    modes: [
      { id: "firstletter", name: "Baş Harfi Bul", svg: "assets/svg/apple.svg", voiceKey: "super_firstletter", desc: "Resmin ilk harfini bul!" },
      { id: "alphabridge", name: "Harf Köprüsü", svg: "assets/svg/pig.svg", voiceKey: "super_bridge", desc: "Harflere sırayla dokun ve köprüyü kur!" },
      { id: "wordrocket", name: "Kelime Roketi", svg: "assets/svg/rocket.svg", voiceKey: "super_rocket", desc: "Roketle kelimenin harflerini yakala!" }
    ]
  },
  {
    id: "pbs_pegcat",
    num: 6,
    category: "pbs",
    badge: "📺 PBS KIDS #5",
    ageTag: "3-6 Yaş",
    title: "PEG + CAT: ŞEKİLLER & PİZZA",
    skill: "Geometrik Şekiller • Küçük-Orta-Büyük • Uzay Roketi",
    svg: "assets/svg/cat.svg",
    sideSvgs: ["assets/svg/pizza.svg", "assets/svg/guitar.svg", "assets/svg/chicken.svg"],
    bannerBg: "linear-gradient(135deg, #e9d5ff 0%, #fbcfe8 100%)",
    color: "#7c3aed",
    accent: "#ec4899",
    desc: "Peg ve mavi kedisi Cat ile Daire, Üçgen, Kare ve Yıldız şekillerinden pizza hazırla, eşyaları boyutlarına göre sırala ve uzay tavuklarını rokete bindir!",
    modes: [
      { id: "pizza", name: "Şekilli Pizza", svg: "assets/svg/pizza.svg", voiceKey: "peg_circle", desc: "Pizzayı istenen şekillerle süsle!" },
      { id: "sizes", name: "Boyut Sırala", svg: "assets/svg/guitar.svg", voiceKey: "peg_large", desc: "Küçük, orta ve büyük olanı bul!" },
      { id: "chickens", name: "Uzay Tavukları", svg: "assets/svg/chicken.svg", voiceKey: "peg_chickens", desc: "Tavukları sayarak rokete bindir!" }
    ]
  }
];

// ==================== EĞİTİCİ İÇERİK VERİ SETLERİ (YÜKSEK ÇÖZÜNÜRLÜKLÜ SVG DESTEKLİ) ====================
const DANIEL_EMOTIONS = [
  { id: "happy", svg: "assets/svg/happy.svg", label: "MUTLU", color: "#16a34a", voiceKey: "daniel_happy", prompt: "Daniel parkta arkadaşlarıyla oynadı! Mutlu yüzü bul!" },
  { id: "sad", svg: "assets/svg/sad.svg", label: "ÜZGÜN", color: "#0284c7", voiceKey: "daniel_sad", prompt: "Daniel'in dondurması yere düştü! Üzgün yüzü bul!" },
  { id: "excited", svg: "assets/svg/excited.svg", label: "HEYECANLI", color: "#eab308", voiceKey: "daniel_excited", prompt: "Daniel doğum günü pastasını gördü! Heyecanlı yüzü bul!" },
  { id: "angry", svg: "assets/svg/angry.svg", label: "KIZGIN", color: "#ef4444", voiceKey: "daniel_angry", prompt: "Oyuncak kule devrilince Daniel biraz kızdı! Kızgın yüzü bul!" },
  { id: "surprised", svg: "assets/svg/surprised.svg", label: "ŞAŞKIN", color: "#7c3aed", voiceKey: "daniel_surprised", prompt: "Kutudan bir anda sevimli bir tavşan çıktı! Şaşkın yüzü bul!" },
  { id: "loved", svg: "assets/svg/loved.svg", label: "SEVGİ DOLU", color: "#ec4899", voiceKey: "daniel_loved", prompt: "Annesi Daniel'e sımsıkı sarıldı! Sevgi dolu yüzü bul!" }
];

const WILD_KRATTS_ANIMALS = {
  cheetah: {
    heroSvg: "assets/svg/cheetah.svg",
    babySvg: "assets/svg/lion.svg",
    foodSvg: "assets/svg/meat.svg",
    themeClass: "theme-savanna",
    voiceKey: "kratts_cheetah",
    name: "Çita Gücü (Savana)",
    fact: "Biliyor muydun? Çitalar dünyanın en hızlı koşan kara hayvanıdır! Saniyeler içinde rüzgar gibi hızlanırlar."
  },
  dolphin: {
    heroSvg: "assets/svg/dolphin.svg",
    babySvg: "assets/svg/fish.svg",
    foodSvg: "assets/svg/star.svg",
    themeClass: "theme-ocean",
    voiceKey: "kratts_dolphin",
    name: "Yunus Gücü (Okyanus)",
    fact: "Biliyor muydun? Yunuslar su altında ıslık sesleriyle birbirleriyle konuşurlar ve çok zekidirler!"
  },
  eagle: {
    heroSvg: "assets/svg/eagle.svg",
    babySvg: "assets/svg/chick.svg",
    foodSvg: "assets/svg/cherries.svg",
    themeClass: "theme-sunny-meadow",
    voiceKey: "kratts_eagle",
    name: "Kartal Gücü (Gökyüzü)",
    fact: "Biliyor muydun? Kartalların gözleri o kadar keskindir ki çok yüksekten bile küçücük bir balığı görebilirler!"
  }
};

const SUPERWHY_WORDS = [
  { letter: "A", word: "ARI", svg: "assets/svg/bee.svg", color: "#eab308" },
  { letter: "B", word: "BALIK", svg: "assets/svg/fish.svg", color: "#0284c7" },
  { letter: "C", word: "CİVCİV", svg: "assets/svg/chick.svg", color: "#f59e0b" },
  { letter: "Ç", word: "ÇİLEK", svg: "assets/svg/strawberry.svg", color: "#ec4899" },
  { letter: "D", word: "DONDURMA", svg: "assets/svg/icecream.svg", color: "#db2777" },
  { letter: "E", word: "ELMA", svg: "assets/svg/apple.svg", color: "#ef4444" },
  { letter: "F", word: "FİL", svg: "assets/svg/elephant.svg", color: "#64748b" },
  { letter: "G", word: "GÜNEŞ", svg: "assets/svg/sun.svg", color: "#f59e0b" },
  { letter: "K", word: "KEDİ", svg: "assets/svg/cat.svg", color: "#f97316" },
  { letter: "K", word: "KÖPEK", svg: "assets/svg/dog.svg", color: "#b45309" },
  { letter: "M", word: "MAYMUN", svg: "assets/svg/monkey.svg", color: "#d97706" },
  { letter: "O", word: "OTOBÜS", svg: "assets/svg/bus.svg", color: "#eab308" },
  { letter: "P", word: "PASTA", svg: "assets/svg/cake.svg", color: "#ec4899" },
  { letter: "S", word: "SAAT", svg: "assets/svg/clock.svg", color: "#0284c7" },
  { letter: "T", word: "TAVŞAN", svg: "assets/svg/rabbit.svg", color: "#ec4899" },
  { letter: "U", word: "UÇAK", svg: "assets/svg/airplane.svg", color: "#2563eb" },
  { letter: "Y", word: "YILDIZ", svg: "assets/svg/star.svg", color: "#eab308" },
  { letter: "Z", word: "ZÜRAFA", svg: "assets/svg/giraffe.svg", color: "#d97706" }
];

const PEGCAT_SHAPES = [
  { id: "circle", name: "DAİRE", color: "#ec4899", svg: "assets/svg/shape_circle.svg", voiceKey: "peg_circle" },
  { id: "triangle", name: "ÜÇGEN", color: "#f59e0b", svg: "assets/svg/shape_triangle.svg", voiceKey: "peg_triangle" },
  { id: "square", name: "KARE", color: "#0ea5e9", svg: "assets/svg/shape_square.svg", voiceKey: "peg_square" },
  { id: "star", name: "YILDIZ", color: "#22c55e", svg: "assets/svg/shape_star.svg", voiceKey: "peg_star" },
  { id: "heart", name: "KALP", color: "#8b5cf6", svg: "assets/svg/shape_heart.svg", voiceKey: "peg_circle" }
];

const TOCA_FOODS = [
  { id: "strawberry", svg: "assets/svg/strawberry.svg", name: "Çilek", color: "#ec4899", reactionSvg: "assets/svg/loved.svg", msg: "Mmm! Tatlı çilek çok lezzetli!" },
  { id: "banana", svg: "assets/svg/banana.svg", name: "Muz", color: "#eab308", reactionSvg: "assets/svg/happy.svg", msg: "Harika! Muz enerji verdi!" },
  { id: "pizza", svg: "assets/svg/pizza.svg", name: "Pizza", color: "#f97316", reactionSvg: "assets/svg/yummy.svg", msg: "Sıcak peynirli pizza, nefiiis!" },
  { id: "icecream", svg: "assets/svg/icecream.svg", name: "Dondurma", color: "#0ea5e9", reactionSvg: "assets/svg/excited.svg", msg: "Buz gibi dondurma, yaşasın!" },
  { id: "broccoli", svg: "assets/svg/broccoli.svg", name: "Brokoli", color: "#16a34a", reactionSvg: "assets/svg/happy.svg", msg: "Sağlıklı brokoli! Süper güçlü oldum!" },
  { id: "lemon", svg: "assets/svg/lemon.svg", name: "Limon", color: "#eab308", reactionSvg: "assets/svg/sour.svg", msg: "Brrr! Limon çok ekşiymiş!" },
  { id: "cake", svg: "assets/svg/cake.svg", name: "Pasta", color: "#7c3aed", reactionSvg: "assets/svg/excited.svg", msg: "Doğum günü pastası! Parti zamanı!" },
  { id: "milk", svg: "assets/svg/milk.svg", name: "Süt", color: "#0284c7", reactionSvg: "assets/svg/loved.svg", msg: "Kemikler için taze süt!" }
];

const TOCA_COSTUMES = [
  { id: "crown", svg: "assets/svg/crown.svg", name: "Altın Kral Tacı", bodyColor: "#f59e0b" },
  { id: "astro", svg: "assets/svg/helmet.svg", name: "Uzay Kaskı", bodyColor: "#0ea5e9" },
  { id: "chef", svg: "assets/svg/tophat.svg", name: "Sihirbaz Şapkası", bodyColor: "#1e293b" },
  { id: "super", svg: "assets/svg/zap.svg", name: "Süper Kahraman", bodyColor: "#ef4444" },
  { id: "wizard", svg: "assets/svg/crystal.svg", name: "Peri Küresi", bodyColor: "#8b5cf6" },
  { id: "party", svg: "assets/svg/party.svg", name: "Parti Şapkası", bodyColor: "#16a34a" }
];

const STICKER_COLLECTION = [
  { id: "s1", svg: "assets/svg/tiger.svg", name: "Daniel Kaplan" },
  { id: "s2", svg: "assets/svg/cheetah.svg", name: "Süper Çita" },
  { id: "s3", svg: "assets/svg/monkey.svg", name: "Meraklı Maymun" },
  { id: "s4", svg: "assets/svg/superhero.svg", name: "Süper Okuyucu" },
  { id: "s5", svg: "assets/svg/cat.svg", name: "Mavi Kedi Cat" },
  { id: "s6", svg: "assets/svg/house.svg", name: "Hayal Evi" },
  { id: "s7", svg: "assets/svg/unicorn.svg", name: "Gökkuşağı Unicorn" },
  { id: "s8", svg: "assets/svg/trex.svg", name: "Neşeli Dino" },
  { id: "s9", svg: "assets/svg/dolphin.svg", name: "Mavi Yunus" },
  { id: "s10", svg: "assets/svg/eagle.svg", name: "Altın Kartal" },
  { id: "s11", svg: "assets/svg/rocket.svg", name: "Uzay Roketi" },
  { id: "s12", svg: "assets/svg/rainbow.svg", name: "Parlak Gökkuşağı" },
  { id: "s13", svg: "assets/svg/pizza.svg", name: "Şekilli Pizza" },
  { id: "s14", svg: "assets/svg/icecream.svg", name: "Süper Dondurma" },
  { id: "s15", svg: "assets/svg/balloon.svg", name: "Uçan Balon" },
  { id: "s16", svg: "assets/svg/crown.svg", name: "Kraliyet Tacı" },
  { id: "s17", svg: "assets/svg/dog.svg", name: "Köpüklü Köpek" },
  { id: "s18", svg: "assets/svg/rabbit.svg", name: "Pamuk Tavşan" },
  { id: "s19", svg: "assets/svg/train.svg", name: "Renkli Tren" },
  { id: "s20", svg: "assets/svg/guitar.svg", name: "Peg'in Gitarı" },
  { id: "s21", svg: "assets/svg/cupcake.svg", name: "Paylaşım Kek" },
  { id: "s22", svg: "assets/svg/star.svg", name: "Süper Yıldız" },
  { id: "s23", svg: "assets/svg/palette.svg", name: "Sanat Paleti" },
  { id: "s24", svg: "assets/svg/trophy.svg", name: "Şampiyon Kupası" }
];

// ==================== EVRENSEL SES & TÜRKÇE KONUŞMA MOTORU (ANDROID + iOS + LAPTOP) ====================
const KidsAudio = {
  ctx: null,
  soundEnabled: true,
  voiceEnabled: true,
  unlocked: false,
  bufferCache: {},
  activeSource: null,
  htmlAudio: null,

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && (this.ctx.state === "suspended" || this.ctx.state === "interrupted")) {
      this.ctx.resume().catch(() => {});
    }
    if (!this.htmlAudio) {
      this.htmlAudio = new Audio();
      this.htmlAudio.preload = "auto";
    }
  },

  // iOS Safari, Android Chrome ve tüm mobil/masaüstü tarayıcılarda ilk dokunuşta ses kanalını açar
  unlockOnFirstGesture() {
    if (this.unlocked) return;
    const unlockFn = () => {
      this.init();
      if (this.ctx) {
        try {
          const buf = this.ctx.createBuffer(1, 1, 22050);
          const src = this.ctx.createBufferSource();
          src.buffer = buf;
          src.connect(this.ctx.destination);
          if (src.start) src.start(0);
          this.ctx.resume().then(() => {
            this.unlocked = true;
          }).catch(() => {});
        } catch (e) {}
      }
      if ("speechSynthesis" in window) {
        try {
          window.speechSynthesis.getVoices();
        } catch (e) {}
      }
    };
    ["touchstart", "touchend", "pointerdown", "mousedown", "keydown", "click"].forEach((ev) => {
      document.addEventListener(ev, unlockFn, { passive: true });
    });
  },

  playTone(freq, dur = 0.14, type = "sine", vol = 0.22, delay = 0) {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx) return;
    try {
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
    } catch (e) {}
  },

  pop() {
    this.playTone(540, 0.08, "sine", 0.24);
    this.playTone(820, 0.11, "triangle", 0.22, 0.04);
  },

  correct() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((n, i) => this.playTone(n, 0.16, "triangle", 0.24, i * 0.065));
  },

  gentleTryAgain() {
    this.playTone(350, 0.14, "sine", 0.18);
    this.playTone(300, 0.18, "sine", 0.16, 0.11);
  },

  fanfare() {
    const melody = [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5];
    melody.forEach((n, i) => this.playTone(n, 0.22, "triangle", 0.26, i * 0.1));
  },

  munch() {
    this.playTone(300, 0.08, "sawtooth", 0.16, 0);
    this.playTone(370, 0.08, "sawtooth", 0.16, 0.09);
    this.playTone(460, 0.12, "triangle", 0.2, 0.18);
  },

  // Hem yerel MP3 ses dosyalarını (Web Audio + HTML5 Audio) hem de Web Speech API'yi birlikte kullanan
  // Android, iPhone/iPad (iOS) ve Laptop uyumlu Türkçe konuşma motoru
  async speak(text, clipKey = null) {
    if (!this.voiceEnabled || !this.soundEnabled) return;
    this.init();

    // Otomatik MP3 anahtarı eşleştirme (Sayılar ve yaygın ifadeler)
    if (!clipKey && text) {
      const numMap = { "1!": "num_1", "2!": "num_2", "3!": "num_3", "4!": "num_4", "5!": "num_5", "6!": "num_6", "7!": "num_7", "8!": "num_8", "9!": "num_9", "10!": "num_10" };
      if (numMap[text.trim()]) clipKey = numMap[text.trim()];
    }

    if (clipKey) {
      const mp3Url = `assets/voice/${clipKey}.mp3`;
      const played = await this.playMp3Clip(mp3Url);
      if (played) return;
    }

    // Yedek katman: Tarayıcı Web Speech API (Android Chrome gecikme yaması ile)
    if ("speechSynthesis" in window && text) {
      try {
        window.speechSynthesis.cancel();
        setTimeout(() => {
          try {
            const u = new SpeechSynthesisUtterance(text);
            u.lang = "tr-TR";
            u.rate = 0.96;
            u.pitch = 1.12;
            const voices = window.speechSynthesis.getVoices() || [];
            const trVoice = voices.find((v) => v.lang && v.lang.toLowerCase().includes("tr"));
            if (trVoice) u.voice = trVoice;
            window.speechSynthesis.speak(u);
          } catch (e) {}
        }, 55);
      } catch (e) {}
    }
  },

  async playMp3Clip(url) {
    this.init();
    // 1. Önce Web Audio API Buffer ile çalmayı dene (iOS ve Android'de en sorunsuz yöntem)
    if (this.ctx) {
      try {
        if (this.activeSource) {
          try { this.activeSource.stop(); } catch (e) {}
          this.activeSource = null;
        }
        let audioBuffer = this.bufferCache[url];
        if (!audioBuffer) {
          const resp = await fetch(url);
          if (resp.ok) {
            const arr = await resp.arrayBuffer();
            audioBuffer = await this.ctx.decodeAudioData(arr);
            this.bufferCache[url] = audioBuffer;
          }
        }
        if (audioBuffer) {
          if (this.ctx.state === "suspended") await this.ctx.resume();
          const source = this.ctx.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(this.ctx.destination);
          source.start(0);
          this.activeSource = source;
          return true;
        }
      } catch (e) {}
    }

    // 2. HTML5 Audio Yedeği
    if (this.htmlAudio) {
      try {
        this.htmlAudio.pause();
        this.htmlAudio.src = url;
        await this.htmlAudio.play();
        return true;
      } catch (e) {}
    }
    return false;
  }
};

KidsAudio.unlockOnFirstGesture();
