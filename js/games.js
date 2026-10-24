// ÇOCUK OYUNLARI DÜNYASI (3-6 YAŞ) - ANA OYUN MOTORU
// KURAL GEREĞİ: Her yeni oyun, kullanılan cihazın ekranına göre oyun alanını hesaplar (calculateGameArea)
// ve tüm oyun bileşenlerini bu alana sığdıracak şekilde boyutlandırır.

class KidsGamesPortal {
  constructor() {
    this.canvas = document.getElementById("kids-canvas");
    this.ctx = this.canvas ? this.canvas.getContext("2d") : null;

    this.activeCategory = "all";
    this.activeGameId = null;
    this.gameMeta = null;
    this.activeModeId = null;
    this.levelNum = 1;
    this.state = "HUB"; // HUB, MENU, PLAYING, CELEBRATION

    // Oyun içi ilerleme
    this.stepProgress = 0;
    this.stepTarget = 5;
    this.sessionStars = 0;

    // Ekran ölçüm ve bileşen yerleşim metrikleri
    this.layout = {
      width: 640,
      height: 480,
      dpr: 1,
      scale: 1,
      unit: 40,
      pad: 16
    };

    this.particles = [];
    this.floatingLabels = [];
    this.hintTimer = 0;
    this.animTime = 0;
    this.lastFrame = performance.now();

    // Aktif oyunun bileşen durumu
    this.gs = {};

    this.save = this.loadSave();
    this.initUI();
    this.bindEvents();
    requestAnimationFrame((t) => this.loop(t));
  }

  // ==================== KAYIT & VERSİYON YÖNETİMİ ====================
  loadSave() {
    try {
      const raw = localStorage.getItem("cocuk_oyunlari_3_6_save_v1");
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    const def = {
      totalStars: 15,
      unlockedStickers: ["s1", "s6"],
      starsByGame: {},
      unlockedLevelByGame: {}
    };
    KIDS_GAMES.forEach((g) => {
      def.starsByGame[g.id] = {};
      def.unlockedLevelByGame[g.id] = 1;
    });
    return def;
  }

  saveData() {
    try {
      localStorage.setItem("cocuk_oyunlari_3_6_save_v1", JSON.stringify(this.save));
    } catch (e) {}
  }

  initUI() {
    const verEl = document.getElementById("main-version-badge");
    if (verEl && typeof APP_VERSION !== "undefined") {
      verEl.textContent = APP_VERSION;
    }
    this.updateHubHeaderStats();
    this.renderHubGames();
  }

  updateHubHeaderStats() {
    const starsEl = document.getElementById("hub-total-stars");
    if (starsEl) starsEl.textContent = this.save.totalStars || 0;
    const stCountEl = document.getElementById("hub-sticker-count");
    if (stCountEl) {
      const count = (this.save.unlockedStickers || []).length;
      stCountEl.textContent = `${count}/${STICKER_COLLECTION.length}`;
    }
  }

  // ==================== ANA MENÜ (ÇOCUK OYUNLARI MENÜSÜ) ====================
  renderHubGames() {
    const grid = document.getElementById("games-grid");
    if (!grid) return;
    grid.innerHTML = "";

    const list = KIDS_GAMES.filter((g) => {
      if (this.activeCategory === "all") return true;
      return g.category === this.activeCategory;
    });

    list.forEach((g) => {
      const card = document.createElement("div");
      card.className = `kid-game-card ${g.isFeaturedTablet ? "featured-tablet" : ""}`;
      card.style.borderColor = g.color;

      const gameStarsObj = (this.save.starsByGame && this.save.starsByGame[g.id]) || {};
      const earnedStars = Object.values(gameStarsObj).reduce((a, b) => a + b, 0);

      const modesHtml = g.modes
        .map((m) => `<span class="kg-mode-chip">${m.icon} ${m.name}</span>`)
        .join("");

      card.innerHTML = `
        <div class="kg-top">
          <div class="kg-avatar" style="background:${g.color}28;border:2px solid ${g.color}">${g.icon}</div>
          <div class="kg-meta">
            <div class="kg-badges">
              <span class="kg-tag" style="background:${g.color};color:#0f172a">${g.badge}</span>
              <span class="kg-tag" style="background:rgba(255,255,255,0.14);color:#fff">${g.ageTag}</span>
            </div>
            <h3 style="color:${g.color}">${g.title}</h3>
            <div class="kg-skill">✨ ${g.skill}</div>
          </div>
        </div>
        <p class="kg-desc">${g.desc}</p>
        <div class="kg-modes-preview">${modesHtml}</div>
        <div class="kg-footer">
          <span class="kg-progress">⭐ Kazanılan Yıldız: ${earnedStars} / 90</span>
          <button class="btn btn-primary btn-sm kg-play-btn" style="background:linear-gradient(135deg, ${g.color}, ${g.accent});color:#0f172a">
            ▶️ OYUNU AÇ
          </button>
        </div>
      `;

      card.addEventListener("click", () => {
        KidsAudio.pop();
        this.openGameMenu(g.id);
      });

      grid.appendChild(card);
    });
  }

  openGameMenu(gameId) {
    this.activeGameId = gameId;
    this.gameMeta = KIDS_GAMES.find((g) => g.id === gameId);
    if (!this.gameMeta) return;
    this.activeModeId = this.gameMeta.modes[0].id;
    this.state = "MENU";

    this.renderGameMenuScreen();
    this.showScreen("game-menu-screen");
    KidsAudio.speak(`${this.gameMeta.title}. Oynamak istediğin odayı veya aşamayı seç!`);
  }

  renderGameMenuScreen() {
    const g = this.gameMeta;
    if (!g) return;
    document.getElementById("gm-icon").textContent = g.icon;
    document.getElementById("gm-badge").textContent = `${g.badge} • ${g.ageTag}`;
    const titleEl = document.getElementById("gm-title");
    titleEl.textContent = g.title;
    titleEl.style.color = g.color;
    document.getElementById("gm-desc").textContent = g.desc;

    // Mod/Oda Seçici Butonlar
    const modesRow = document.getElementById("gm-modes-row");
    modesRow.innerHTML = "";
    g.modes.forEach((m, idx) => {
      const btn = document.createElement("button");
      btn.className = `mode-select-btn ${m.id === this.activeModeId ? "active" : ""}`;
      btn.innerHTML = `
        <span style="font-size:1.8rem">${m.icon}</span>
        <span>${m.name}</span>
        <small style="font-size:0.72rem;color:#cbd5e1;font-weight:700">${m.desc}</small>
      `;
      btn.addEventListener("click", () => {
        this.activeModeId = m.id;
        KidsAudio.pop();
        this.startGameLevel(idx + 1, m.id);
      });
      modesRow.appendChild(btn);
    });

    // 30 Aşama Izgarası
    const lvlGrid = document.getElementById("gm-levels-grid");
    lvlGrid.innerHTML = "";
    const starsMap = (this.save.starsByGame && this.save.starsByGame[g.id]) || {};

    for (let lvl = 1; lvl <= 30; lvl++) {
      const modeObj = g.modes[(lvl - 1) % g.modes.length];
      const st = starsMap[lvl] || 0;
      const cell = document.createElement("div");
      cell.className = "lvl-card";
      cell.style.borderColor = st > 0 ? "#ffd93d" : "rgba(255,255,255,0.22)";
      cell.innerHTML = `
        <div class="lvl-num">${modeObj.icon} ${lvl}</div>
        <div class="lvl-mode-tag">${modeObj.name.replace(/^[^\s]+\s/, "")}</div>
        <div class="lvl-stars">${st > 0 ? "⭐".repeat(st) : "▶️ OYNA"}</div>
      `;
      cell.addEventListener("click", () => {
        KidsAudio.pop();
        this.startGameLevel(lvl, modeObj.id);
      });
      lvlGrid.appendChild(cell);
    }
  }

  showScreen(screenId) {
    document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
    const target = document.getElementById(screenId);
    if (target) target.classList.add("active");
    if (screenId === "play-screen") {
      setTimeout(() => this.calculateGameArea(), 20);
    }
  }

  /**
   * KURAL GEREĞİ: Kullanılan cihazın ekran boyutuna göre oyun alanını hesaplar
   * ve her yeni oyunun bileşenlerini bu alana tam sığacak şekilde ölçeklendirir.
   */
  calculateGameArea() {
    if (!this.canvas) return;
    const screenW = window.innerWidth;
    const screenH = window.innerHeight;

    const hudEl = document.getElementById("play-hud");
    const touchEl = document.getElementById("kids-touch-bar");

    const hudH = hudEl && hudEl.offsetHeight ? hudEl.offsetHeight : 54;
    const touchH = touchEl && touchEl.offsetHeight ? touchEl.offsetHeight : 96;

    const availW = Math.max(290, Math.min(1100, screenW - 16));
    const availH = Math.max(250, screenH - hudH - touchH - 14);

    // Cihaz yatay (tablet/PC) veya dikey (telefon/dikey tablet) oranına göre ideal oyun alanı
    const maxAspect = screenW > screenH ? 1.65 : 0.92;
    let gameW = availW;
    let gameH = availH;
    if (gameW / gameH > maxAspect) {
      gameW = Math.floor(gameH * maxAspect);
    } else if (gameW / gameH < 0.56) {
      gameH = Math.floor(gameW / 0.56);
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.style.width = `${gameW}px`;
    this.canvas.style.height = `${gameH}px`;
    this.canvas.width = Math.floor(gameW * dpr);
    this.canvas.height = Math.floor(gameH * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const minDim = Math.min(gameW, gameH);
    const scale = Math.max(0.62, Math.min(1.45, minDim / 460));
    const pad = Math.round(14 * scale);
    const headerH = Math.round(64 * scale);

    this.layout = {
      width: gameW,
      height: gameH,
      dpr,
      scale,
      unit: Math.round(minDim / 10),
      pad,
      headerH,
      playTop: headerH + pad,
      playH: gameH - headerH - pad * 2,
      fontLg: Math.round(22 * scale),
      fontMd: Math.round(16 * scale),
      fontSm: Math.round(13 * scale)
    };

    if (this.state === "PLAYING") {
      this.relayoutActiveGame();
    }
  }

  // ==================== OYUN BAŞLATMA VE ODA KURULUMU ====================
  startGameLevel(lvl, forcedModeId = null) {
    if (!this.gameMeta) return;
    this.levelNum = Math.max(1, Math.min(30, lvl));
    const modes = this.gameMeta.modes;
    const defaultMode = modes[(this.levelNum - 1) % modes.length].id;
    this.activeModeId = forcedModeId || defaultMode;

    this.state = "PLAYING";
    this.stepProgress = 0;
    this.stepTarget = this.activeGameId === "tablet_tocalife" ? 5 : 4;
    this.particles = [];
    this.floatingLabels = [];
    document.getElementById("celebration-overlay").classList.add("hidden");

    this.showScreen("play-screen");
    this.renderTouchModeBar();
    this.calculateGameArea();
    this.setupTaskForActiveGame();
    this.updatePlayHUD();
  }

  renderTouchModeBar() {
    const wrap = document.getElementById("touch-mode-buttons");
    const dpad = document.getElementById("touch-dpad-row");
    if (!wrap || !this.gameMeta) return;

    wrap.innerHTML = "";
    this.gameMeta.modes.forEach((m) => {
      const btn = document.createElement("button");
      btn.className = `touch-mode-chip ${m.id === this.activeModeId ? "active" : ""}`;
      btn.textContent = `${m.icon} ${m.name}`;
      btn.addEventListener("click", () => {
        KidsAudio.pop();
        this.activeModeId = m.id;
        this.stepProgress = 0;
        this.renderTouchModeBar();
        this.calculateGameArea();
        this.setupTaskForActiveGame();
        this.updatePlayHUD();
      });
      wrap.appendChild(btn);
    });

    // Hareket gerektiren modlarda büyük yön tuşlarını göster
    const needsDpad =
      this.activeGameId === "pbs_wildkratts" ||
      (this.activeGameId === "pbs_superwhy" && this.activeModeId === "wordrocket");
    if (dpad) {
      dpad.classList.toggle("hidden", !needsDpad);
    }
  }

  updatePlayHUD() {
    if (!this.gameMeta) return;
    const modeObj = this.gameMeta.modes.find((m) => m.id === this.activeModeId) || this.gameMeta.modes[0];
    document.getElementById("hud-game-title").textContent = this.gameMeta.title.split(":")[0];
    document.getElementById("hud-level-label").textContent = `Aşama ${this.levelNum} • ${modeObj.name}`;
    document.getElementById("hud-stars").textContent = this.save.totalStars || 0;
    document.getElementById("hud-step").textContent = `${this.stepProgress}/${this.stepTarget}`;
  }

  setPrompt(text, speakIt = true) {
    this.gs.promptText = text;
    const instrEl = document.getElementById("touch-instruction-text");
    if (instrEl) instrEl.textContent = `👆 ${text}`;
    if (speakIt) KidsAudio.speak(text);
  }

  // ==================== 6 OYUN İÇİN GÖREV VE BİLEŞEN OLUŞTURMA ====================
  setupTaskForActiveGame() {
    const id = this.activeGameId;
    const mode = this.activeModeId;
    this.gs = {
      mode,
      promptText: "",
      items: [],
      targets: [],
      hero: {},
      extra: {},
      celebrateTimer: 0
    };

    if (id === "tablet_tocalife") {
      this.setupTocaLife(mode);
    } else if (id === "pbs_daniel") {
      this.setupDanielTiger(mode);
    } else if (id === "pbs_wildkratts") {
      this.setupWildKratts(mode);
    } else if (id === "pbs_george") {
      this.setupCuriousGeorge(mode);
    } else if (id === "pbs_superwhy") {
      this.setupSuperWhy(mode);
    } else if (id === "pbs_pegcat") {
      this.setupPegCat(mode);
    }

    this.relayoutActiveGame();
  }

  // -------------------- 1. TOCA MİNİ DÜNYA (TABLET #1) --------------------
  setupTocaLife(mode) {
    if (mode === "kitchen") {
      const characters = [
        { emoji: "👧", name: "Mia" },
        { emoji: "👦", name: "Leo" },
        { emoji: "🐱", name: "Minnoş Kedi" },
        { emoji: "🦖", name: "Yeşil Dino" }
      ];
      const char = characters[(this.levelNum + this.stepProgress) % characters.length];
      this.gs.hero = {
        emoji: char.emoji,
        name: char.name,
        mood: "normal",
        moodTimer: 0,
        characterIdx: (this.levelNum + this.stepProgress) % characters.length,
        characters,
        smoothieColors: []
      };
      this.gs.items = TOCA_FOODS.map((f) => ({ ...f, x: 0, y: 0, r: 30 }));
      this.setPrompt(`${char.name} acıktı! Meyvelere, pizzaya veya dondurmaya dokunup ona yedir!`, this.stepProgress === 0);
    } else if (mode === "dressup") {
      this.gs.hero = {
        baseEmoji: "🧒",
        hat: "👑",
        costumeName: "Altın Taç",
        bodyColor: "#ffd93d",
        danceTimer: 0,
        bgThemeIdx: 0
      };
      this.gs.items = TOCA_COSTUMES.map((c) => ({ ...c, x: 0, y: 0, r: 32 }));
      this.setPrompt("Kostüm ve şapkalara dokunarak karakterini giydir ve dans ettir!", this.stepProgress === 0);
    } else if (mode === "petcare") {
      const pets = [
        { emoji: "🐶", name: "Yavru Köpek Pamuk" },
        { emoji: "🐱", name: "Yavru Kedi Tarçın" },
        { emoji: "🐰", name: "Yavru Tavşan Kartopu" }
      ];
      const pet = pets[(this.levelNum + this.stepProgress) % pets.length];
      this.gs.hero = {
        emoji: pet.emoji,
        name: pet.name,
        activeTool: "soap",
        mudSpots: [
          { dx: -0.22, dy: -0.1, cleaned: false, foam: 0 },
          { dx: 0.2, dy: -0.08, cleaned: false, foam: 0 },
          { dx: -0.14, dy: 0.18, cleaned: false, foam: 0 },
          { dx: 0.16, dy: 0.16, cleaned: false, foam: 0 }
        ]
      };
      this.gs.items = [
        { id: "soap", emoji: "🧼", name: "Köpüklü Sabun", color: "#ff5e8e" },
        { id: "shower", emoji: "🚿", name: "Su Duşu", color: "#00f2fe" },
        { id: "treat", emoji: "🦴", name: "Ödül Maması", color: "#ffd93d" }
      ];
      this.setPrompt(`${pet.name} bahçede çamur olmuş! Üzerindeki lekelere dokunarak köpükle yıka!`, this.stepProgress === 0);
    } else if (mode === "artparty") {
      this.gs.extra = {
        paintDots: [],
        activeColor: "#ff5e8e",
        activeSticker: "🦄",
        palette: ["#ff5e8e", "#ffd93d", "#2ecc71", "#00f2fe", "#a66cff", "#ff8c32"],
        stickers: ["🦄", "🌟", "🌈", "🦖", "🍓", "🚀"],
        balloons: []
      };
      for (let i = 0; i < 6; i++) {
        this.gs.extra.balloons.push({
          rx: 0.16 + (i / 5) * 0.68,
          ry: 0.35 + (i % 2) * 0.18,
          color: this.gs.extra.palette[i % 6],
          popped: false
        });
      }
      this.setPrompt("Renkli balonları patlat veya ekrana dokunarak gökkuşağı çıkartmaları yapıştır!", this.stepProgress === 0);
    }
  }

  // -------------------- 2. DANIEL TIGER (PBS KIDS #1) --------------------
  setupDanielTiger(mode) {
    if (mode === "feelings") {
      const target = DANIEL_EMOTIONS[(this.levelNum + this.stepProgress) % DANIEL_EMOTIONS.length];
      const others = DANIEL_EMOTIONS.filter((e) => e.id !== target.id)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);
      const options = [target, ...others].sort(() => Math.random() - 0.5);
      this.gs.target = target;
      this.gs.items = options.map((o) => ({ ...o, x: 0, y: 0, w: 120, h: 110 }));
      this.setPrompt(target.prompt, true);
    } else if (mode === "breathe") {
      this.gs.extra = { poppedCount: 0, targetCount: 4 };
      const colors = ["#00f2fe", "#ff5e8e", "#ffd93d", "#2ecc71"];
      this.gs.items = [0, 1, 2, 3].map((i) => ({
        num: i + 1,
        color: colors[i],
        popped: false,
        rx: 0.2 + i * 0.2,
        ry: 0.58 + (i % 2) * 0.1
      }));
      this.setPrompt("Daniel ile derin bir nefes alalım! Balonlara 1, 2, 3, 4 diye dokunarak patlat!", true);
    } else if (mode === "sharing") {
      const friends = [
        { emoji: "🐯", name: "Daniel", count: 0 },
        { emoji: "🐱", name: "Katerina", count: 0 },
        { emoji: "🦉", name: "Baykuş O", count: 0 }
      ];
      const treatEmoji = ["🧁", "🍓", "🍪", "🍎"][(this.levelNum + this.stepProgress) % 4];
      this.gs.targets = friends;
      this.gs.extra = { treatEmoji, remaining: 3 };
      this.setPrompt(`Arkadaşlarla paylaşmak çok güzeldir! Her arkadaşa dokunarak birer ${treatEmoji} ikram et!`, true);
    }
  }

  // -------------------- 3. WILD KRATTS (PBS KIDS #2) --------------------
  setupWildKratts(mode) {
    const suitKey = WILD_KRATTS_ANIMALS[mode] ? mode : "cheetah";
    const info = WILD_KRATTS_ANIMALS[suitKey];
    this.gs.suit = info;
    this.gs.hero = {
      rx: 0.18,
      ry: suitKey === "cheetah" ? 0.72 : 0.5,
      vy: 0,
      onGround: true
    };
    this.gs.extra = {
      rescued: 0,
      targetRescue: 5,
      spawnTimer: 0.4,
      scrollX: 0
    };
    this.gs.items = []; // babies, snacks, obstacles
    this.setPrompt(`${info.name} aktif! Zıplayarak veya hareket ederek 5 yavru hayvanı (${info.babyEmoji}) kurtar!`, this.stepProgress === 0);
  }

  // -------------------- 4. CURIOUS GEORGE (PBS KIDS #3) --------------------
  setupCuriousGeorge(mode) {
    if (mode === "balloons") {
      const targetNum = ((this.levelNum + this.stepProgress - 1) % 8) + 2; // 2..9
      const palette = ["#ff5e8e", "#ffd93d", "#00f2fe", "#2ecc71", "#a66cff", "#ff8c32"];
      this.gs.extra = { collected: 0, targetNum };
      this.gs.items = [];
      for (let i = 0; i < targetNum; i++) {
        this.gs.items.push({
          idx: i + 1,
          collected: false,
          color: palette[i % palette.length],
          rx: 0.16 + (i % 4) * 0.22,
          ry: 0.36 + Math.floor(i / 4) * 0.24
        });
      }
      this.setPrompt(`Meraklı George'a ${targetNum} tane balon verelim! Balonlara dokunup birlikte sayalım!`, true);
    } else if (mode === "baskets") {
      const baskets = [
        { id: "red", label: "KIRMIZI", emoji: "🍎", color: "#ef4444" },
        { id: "yellow", label: "SARI", emoji: "🍌", color: "#facc15" },
        { id: "green", label: "YEŞİL", emoji: "🍐", color: "#22c55e" }
      ];
      const current = baskets[(this.levelNum + this.stepProgress) % baskets.length];
      this.gs.target = current;
      this.gs.targets = baskets;
      this.setPrompt(`${current.emoji} hangi renk sepete gitmeli? ${current.label} sepete dokun!`, true);
    } else if (mode === "train") {
      const patterns = [
        { seq: ["🔴", "🔵", "🔴", "🔵"], ans: "🔴", opts: ["🔴", "🔵", "🟢"], name: "Kırmızı Daire" },
        { seq: ["🍌", "🍎", "🍌", "🍎"], ans: "🍌", opts: ["🍌", "🍎", "🍇"], name: "Sarı Muz" },
        { seq: ["⭐", "🌙", "⭐", "🌙"], ans: "⭐", opts: ["⭐", "🌙", "☀️"], name: "Parlak Yıldız" },
        { seq: ["🟢", "🟡", "🟢", "🟡"], ans: "🟢", opts: ["🟢", "🟡", "🟣"], name: "Yeşil Top" }
      ];
      const p = patterns[(this.levelNum + this.stepProgress) % patterns.length];
      this.gs.extra = p;
      this.gs.items = p.opts.map((o) => ({ emoji: o }));
      this.setPrompt("George'un trenindeki sıraya dikkatle bak! Soru işaretli vagona hangisi gelmeli?", true);
    }
  }

  // -------------------- 5. SUPER WHY! (PBS KIDS #4) --------------------
  setupSuperWhy(mode) {
    if (mode === "firstletter") {
      const target = SUPERWHY_WORDS[(this.levelNum + this.stepProgress) % SUPERWHY_WORDS.length];
      const distractors = SUPERWHY_WORDS.filter((w) => w.letter !== target.letter)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);
      const opts = [target, ...distractors].sort(() => Math.random() - 0.5);
      this.gs.target = target;
      this.gs.items = opts.map((o) => ({ letter: o.letter, color: o.color }));
      this.setPrompt(`${target.word}! "${target.word}" kelimesi hangi harfle başlar? "${target.letter}" harfini bul!`, true);
    } else if (mode === "alphabridge") {
      const sets = [
        ["A", "B", "C", "Ç", "D"],
        ["E", "F", "G", "H", "I"],
        ["İ", "J", "K", "L", "M"],
        ["N", "O", "Ö", "P", "R"],
        ["S", "Ş", "T", "U", "Ü"]
      ];
      const seq = sets[(this.levelNum + this.stepProgress) % sets.length];
      this.gs.extra = { seq, nextIdx: 0 };
      this.gs.items = seq.map((ch, idx) => ({ letter: ch, idx, done: false }));
      this.setPrompt(`Alpha Pig'in karşıya geçmesi için harflere sırayla dokun: Önce "${seq[0]}" harfi!`, true);
    } else if (mode === "wordrocket") {
      const words = [
        { word: "ARI", letters: ["A", "R", "I"], emoji: "🐝" },
        { word: "KEDİ", letters: ["K", "E", "D", "İ"], emoji: "🐱" },
        { word: "ELMA", letters: ["E", "L", "M", "A"], emoji: "🍎" },
        { word: "TOP", letters: ["T", "O", "P"], emoji: "⚽" },
        { word: "SÜT", letters: ["S", "Ü", "T"], emoji: "🥛" }
      ];
      const w = words[(this.levelNum + this.stepProgress) % words.length];
      this.gs.extra = { wordObj: w, collectedIdx: 0 };
      this.gs.hero = { rx: 0.18, ry: 0.55 };
      this.gs.items = w.letters.map((ch, i) => ({
        letter: ch,
        idx: i,
        collected: false,
        rx: 0.38 + i * 0.16,
        ry: 0.35 + (i % 2) * 0.28
      }));
      this.setPrompt(`Süper Roketle "${w.word}" kelimesinin harflerine sırayla dokunarak topla!`, true);
    }
  }

  // -------------------- 6. PEG + CAT (PBS KIDS #5) --------------------
  setupPegCat(mode) {
    if (mode === "pizza") {
      const targetShape = PEGCAT_SHAPES[(this.levelNum + this.stepProgress) % PEGCAT_SHAPES.length];
      this.gs.target = targetShape;
      this.gs.extra = { placedCount: 0, neededCount: 3, toppingsOnPizza: [] };
      this.gs.items = PEGCAT_SHAPES.map((s) => ({ ...s }));
      this.setPrompt(`Peg'in Pizza Dükkanı! Pizzanın üzerine 3 tane ${targetShape.name} yerleştirmek için ${targetShape.name} şekline dokun!`, true);
    } else if (mode === "sizes") {
      const themes = [
        { emoji: "🎸", name: "Gitar" },
        { emoji: "🚀", name: "Roket" },
        { emoji: "🎩", name: "Şapka" },
        { emoji: "⭐", name: "Yıldız" }
      ];
      const th = themes[(this.levelNum + this.stepProgress) % themes.length];
      const askOrder = [
        { id: "small", label: "EN KÜÇÜK", scale: 0.65 },
        { id: "medium", label: "ORTA BOY", scale: 1.0 },
        { id: "large", label: "EN BÜYÜK", scale: 1.4 }
      ];
      const targetSize = askOrder[(this.levelNum + this.stepProgress) % 3];
      const shuffled = [...askOrder].sort(() => Math.random() - 0.5);
      this.gs.target = targetSize;
      this.gs.extra = { theme: th };
      this.gs.items = shuffled.map((s) => ({ ...s, emoji: th.emoji }));
      this.setPrompt(`Cat için ${targetSize.label} olan ${th.name} hangisi? Ona dokun!`, true);
    } else if (mode === "chickens") {
      const totalSeats = 5;
      const startChickens = ((this.levelNum + this.stepProgress) % 3) + 1; // 1..3
      const needed = totalSeats - startChickens;
      this.gs.extra = { totalSeats, currentChickens: startChickens, needed };
      this.setPrompt(`Uzay roketinde ${totalSeats} koltuk var! ${startChickens} tavuk içeride. Roketi doldurmak için aşağıdaki tavuklara ${needed} kez dokun!`, true);
    }
  }

  /**
   * Hesaplanan ekran alanına (this.layout) göre aktif oyunun tüm kart, buton ve nesne
   * koordinatlarını dinamik olarak yeniden boyutlandırır ve yerleştirir.
   */
  relayoutActiveGame() {
    const { width, height, pad, playTop, playH, scale } = this.layout;
    const id = this.activeGameId;
    const mode = this.activeModeId;
    if (!this.gs) return;

    if (id === "tablet_tocalife") {
      if (mode === "kitchen") {
        const cols = 4;
        const rows = 2;
        const areaTop = playTop + playH * 0.52;
        const areaH = playH * 0.45;
        const cellW = (width - pad * 2) / cols;
        const cellH = areaH / rows;
        this.gs.items.forEach((it, idx) => {
          const c = idx % cols;
          const r = Math.floor(idx / cols);
          it.x = pad + (c + 0.5) * cellW;
          it.y = areaTop + (r + 0.5) * cellH;
          it.r = Math.min(cellW, cellH) * 0.38;
        });
      } else if (mode === "dressup") {
        const cols = 3;
        const rows = 2;
        const areaTop = playTop + playH * 0.52;
        const areaH = playH * 0.45;
        const cellW = (width - pad * 2) / cols;
        const cellH = areaH / rows;
        this.gs.items.forEach((it, idx) => {
          const c = idx % cols;
          const r = Math.floor(idx / cols);
          it.x = pad + (c + 0.5) * cellW;
          it.y = areaTop + (r + 0.5) * cellH;
          it.w = cellW * 0.88;
          it.h = cellH * 0.84;
        });
      } else if (mode === "petcare") {
        const count = this.gs.items.length;
        const cellW = (width - pad * 2) / count;
        const btnY = height - pad - 34 * scale;
        this.gs.items.forEach((it, idx) => {
          it.x = pad + (idx + 0.5) * cellW;
          it.y = btnY;
          it.w = cellW * 0.88;
          it.h = 56 * scale;
        });
      }
    } else if (id === "pbs_daniel") {
      if (mode === "feelings") {
        const cols = 2;
        const rows = 2;
        const gridTop = playTop + playH * 0.32;
        const gridH = playH * 0.65;
        const cellW = (width - pad * 3) / cols;
        const cellH = (gridH - pad) / rows;
        this.gs.items.forEach((it, idx) => {
          const c = idx % cols;
          const r = Math.floor(idx / cols);
          it.x = pad + c * (cellW + pad);
          it.y = gridTop + r * (cellH + pad * 0.6);
          it.w = cellW;
          it.h = cellH;
        });
      } else if (mode === "breathe") {
        this.gs.items.forEach((it) => {
          it.x = it.rx * width;
          it.y = it.ry * height;
          it.r = Math.min(width, height) * 0.1;
        });
      } else if (mode === "sharing" && this.gs.targets) {
        const count = this.gs.targets.length;
        const cellW = (width - pad * 2) / count;
        this.gs.targets.forEach((t, i) => {
          t.x = pad + (i + 0.5) * cellW;
          t.y = playTop + playH * 0.42;
          t.r = Math.min(cellW * 0.38, playH * 0.25);
        });
      }
    } else if (id === "pbs_george") {
      if (mode === "balloons") {
        this.gs.items.forEach((b) => {
          b.x = b.rx * width;
          b.y = b.ry * height;
          b.r = Math.min(width, height) * 0.085;
        });
      } else if (mode === "baskets" && this.gs.targets) {
        const count = this.gs.targets.length;
        const cellW = (width - pad * 2) / count;
        this.gs.targets.forEach((t, i) => {
          t.x = pad + (i + 0.5) * cellW;
          t.y = playTop + playH * 0.72;
          t.w = cellW * 0.86;
          t.h = playH * 0.36;
        });
      } else if (mode === "train") {
        const count = this.gs.items.length;
        const cellW = (width - pad * 2) / count;
        this.gs.items.forEach((it, i) => {
          it.x = pad + (i + 0.5) * cellW;
          it.y = playTop + playH * 0.75;
          it.r = Math.min(cellW * 0.36, playH * 0.18);
        });
      }
    } else if (id === "pbs_superwhy") {
      if (mode === "firstletter") {
        const count = this.gs.items.length;
        const cellW = (width - pad * 2) / count;
        this.gs.items.forEach((it, i) => {
          it.x = pad + (i + 0.5) * cellW;
          it.y = playTop + playH * 0.72;
          it.r = Math.min(cellW * 0.38, playH * 0.2);
        });
      } else if (mode === "alphabridge") {
        const count = this.gs.items.length;
        const cellW = (width - pad * 2) / count;
        this.gs.items.forEach((it, i) => {
          it.x = pad + (i + 0.5) * cellW;
          it.y = playTop + playH * 0.55;
          it.w = cellW * 0.85;
          it.h = playH * 0.28;
        });
      } else if (mode === "wordrocket") {
        this.gs.items.forEach((it) => {
          it.x = it.rx * width;
          it.y = it.ry * height;
          it.r = Math.min(width, height) * 0.08;
        });
      }
    } else if (id === "pbs_pegcat") {
      if (mode === "pizza") {
        const count = this.gs.items.length;
        const cellW = (width - pad * 2) / count;
        this.gs.items.forEach((it, i) => {
          it.x = pad + (i + 0.5) * cellW;
          it.y = playTop + playH * 0.82;
          it.r = Math.min(cellW * 0.38, playH * 0.14);
        });
      } else if (mode === "sizes") {
        const count = this.gs.items.length;
        const cellW = (width - pad * 2) / count;
        this.gs.items.forEach((it, i) => {
          it.x = pad + (i + 0.5) * cellW;
          it.y = playTop + playH * 0.58;
          it.r = Math.min(cellW * 0.4, playH * 0.26);
        });
      }
    }
  }

  // ==================== DOKUNMATİK / FARE ETKİLEŞİMİ ====================
  handleCanvasTap(px, py) {
    if (this.state !== "PLAYING") return;
    KidsAudio.init();
    const { width, height, playTop, playH, scale } = this.layout;
    const id = this.activeGameId;
    const mode = this.activeModeId;

    // Üst bilgi kutusuna dokunulursa sesli yönergeyi tekrarla
    if (py < playTop) {
      KidsAudio.pop();
      KidsAudio.speak(this.gs.promptText || "");
      return;
    }

    if (id === "tablet_tocalife") {
      if (mode === "kitchen") {
        // Karakter değiştirme (karaktere dokunulursa)
        const charX = width * 0.5;
        const charY = playTop + playH * 0.25;
        if (Math.hypot(px - charX, py - charY) < 55 * scale) {
          const h = this.gs.hero;
          h.characterIdx = (h.characterIdx + 1) % h.characters.length;
          const nextC = h.characters[h.characterIdx];
          h.emoji = nextC.emoji;
          h.name = nextC.name;
          KidsAudio.pop();
          KidsAudio.speak(`Merhaba! Ben ${h.name}!`);
          return;
        }
        for (const it of this.gs.items) {
          if (Math.hypot(px - it.x, py - it.y) <= it.r * 1.15) {
            KidsAudio.munch();
            this.gs.hero.mood = it.reaction;
            this.gs.hero.moodTimer = 2.0;
            this.gs.hero.lastFood = it.emoji;
            this.gs.hero.smoothieColors.push(it.color);
            if (this.gs.hero.smoothieColors.length > 4) this.gs.hero.smoothieColors.shift();
            this.spawnBurst(charX, charY, it.color, 18);
            this.addFloatingText(charX, charY - 40, `${it.emoji} ${it.name}!`, it.color);
            KidsAudio.speak(it.msg);
            this.advanceStep(false);
            return;
          }
        }
      } else if (mode === "dressup") {
        for (const it of this.gs.items) {
          if (Math.abs(px - it.x) <= it.w * 0.5 && Math.abs(py - it.y) <= it.h * 0.5) {
            KidsAudio.correct();
            this.gs.hero.hat = it.hat;
            this.gs.hero.costumeName = it.name;
            this.gs.hero.bodyColor = it.bodyColor;
            this.gs.hero.danceTimer = 2.2;
            this.spawnBurst(width * 0.5, playTop + playH * 0.26, it.bodyColor, 20);
            KidsAudio.speak(`Harika! ${it.name} çok yakıştı!`);
            this.advanceStep(false);
            return;
          }
        }
      } else if (mode === "petcare") {
        // Alt araç seçimi
        for (const it of this.gs.items) {
          if (Math.abs(px - it.x) <= it.w * 0.5 && Math.abs(py - it.y) <= it.h * 0.55) {
            this.gs.hero.activeTool = it.id;
            KidsAudio.pop();
            KidsAudio.speak(it.name);
            if (it.id === "treat") {
              KidsAudio.munch();
              this.spawnBurst(width * 0.5, playTop + playH * 0.38, "#ffd93d", 20);
              this.advanceStep(false);
            }
            return;
          }
        }
        // Hayvanın üzerindeki çamurları temizleme
        const petX = width * 0.5;
        const petY = playTop + playH * 0.38;
        const petR = Math.min(width, playH) * 0.26;
        let cleanedAny = false;
        this.gs.hero.mudSpots.forEach((s) => {
          const sx = petX + s.dx * petR * 1.4;
          const sy = petY + s.dy * petR * 1.4;
          if (!s.cleaned && Math.hypot(px - sx, py - sy) < 55 * scale) {
            s.cleaned = true;
            cleanedAny = true;
            this.spawnBurst(sx, sy, "#00f2fe", 14);
          }
        });
        if (cleanedAny) {
          KidsAudio.pop();
          const allClean = this.gs.hero.mudSpots.every((s) => s.cleaned);
          if (allClean) {
            KidsAudio.correct();
            KidsAudio.speak(`Tertemiz oldu! Aferin sana!`);
            this.advanceStep(true);
          }
        }
      } else if (mode === "artparty") {
        const ex = this.gs.extra;
        // Balon kontrolü
        for (const b of ex.balloons) {
          const bx = b.rx * width;
          const by = b.ry * height;
          if (!b.popped && Math.hypot(px - bx, py - by) < 42 * scale) {
            b.popped = true;
            KidsAudio.pop();
            this.spawnBurst(bx, by, b.color, 20);
            if (ex.balloons.every((bl) => bl.popped)) {
              KidsAudio.correct();
              KidsAudio.speak("Bütün balonları patlattın! Harikasın!");
              this.advanceStep(true);
            }
            return;
          }
        }
        // Çıkartma ve boya ekleme
        const color = ex.palette[ex.paintDots.length % ex.palette.length];
        const sticker = ex.stickers[ex.paintDots.length % ex.stickers.length];
        ex.paintDots.push({ x: px, y: py, color, sticker });
        KidsAudio.pop();
        this.spawnBurst(px, py, color, 10);
        if (ex.paintDots.length % 5 === 0) {
          this.advanceStep(false);
        }
      }
      return;
    }

    // -------------------- DANIEL TIGER --------------------
    if (id === "pbs_daniel") {
      if (mode === "feelings") {
        for (const it of this.gs.items) {
          if (px >= it.x && px <= it.x + it.w && py >= it.y && py <= it.y + it.h) {
            if (it.id === this.gs.target.id) {
              KidsAudio.correct();
              this.spawnBurst(it.x + it.w / 2, it.y + it.h / 2, it.color, 22);
              KidsAudio.speak(`Evet! ${it.label} yüz! Çok doğru buldun!`);
              this.advanceStep(true);
            } else {
              KidsAudio.gentleTryAgain();
              KidsAudio.speak(`Bu ${it.label} yüz. Tekrar bakalım, ${this.gs.target.label} yüz hangisi?`);
            }
            return;
          }
        }
      } else if (mode === "breathe") {
        const nextNum = this.gs.extra.poppedCount + 1;
        for (const it of this.gs.items) {
          if (!it.popped && Math.hypot(px - it.x, py - it.y) <= it.r * 1.2) {
            if (it.num === nextNum) {
              it.popped = true;
              this.gs.extra.poppedCount++;
              KidsAudio.pop();
              this.spawnBurst(it.x, it.y, it.color, 18);
              KidsAudio.speak(`${it.num}!`);
              if (this.gs.extra.poppedCount >= 4) {
                setTimeout(() => {
                  KidsAudio.correct();
                  KidsAudio.speak("Harika nefes aldın! Şimdi çok sakin ve mutluyuz!");
                  this.advanceStep(true);
                }, 450);
              }
            } else {
              KidsAudio.speak(`Önce ${nextNum} numaralı balona dokunalım!`);
            }
            return;
          }
        }
      } else if (mode === "sharing") {
        for (const f of this.gs.targets) {
          if (Math.hypot(px - f.x, py - f.y) <= f.r * 1.2) {
            if (f.count === 0) {
              f.count = 1;
              this.gs.extra.remaining--;
              KidsAudio.pop();
              this.spawnBurst(f.x, f.y, "#ffd93d", 16);
              KidsAudio.speak(`Teşekkürler! ${f.name} çok sevindi!`);
              if (this.gs.targets.every((t) => t.count > 0)) {
                setTimeout(() => {
                  KidsAudio.correct();
                  this.advanceStep(true);
                }, 400);
              }
            }
            return;
          }
        }
      }
      return;
    }

    // -------------------- WILD KRATTS --------------------
    if (id === "pbs_wildkratts") {
      this.triggerHeroJumpOrMove(px, py);
      return;
    }

    // -------------------- CURIOUS GEORGE --------------------
    if (id === "pbs_george") {
      if (mode === "balloons") {
        for (const b of this.gs.items) {
          if (!b.collected && Math.hypot(px - b.x, py - b.y) <= b.r * 1.25) {
            b.collected = true;
            this.gs.extra.collected++;
            const cNum = this.gs.extra.collected;
            KidsAudio.pop();
            this.spawnBurst(b.x, b.y, b.color, 16);
            KidsAudio.speak(`${cNum}!`);
            if (cNum >= this.gs.extra.targetNum) {
              setTimeout(() => {
                KidsAudio.correct();
                KidsAudio.speak(`Aferin! Tam ${cNum} tane balon saydın!`);
                this.advanceStep(true);
              }, 450);
            }
            return;
          }
        }
      } else if (mode === "baskets") {
        for (const b of this.gs.targets) {
          if (Math.abs(px - b.x) <= b.w * 0.5 && Math.abs(py - b.y) <= b.h * 0.55) {
            if (b.id === this.gs.target.id) {
              KidsAudio.correct();
              this.spawnBurst(b.x, b.y, b.color, 22);
              KidsAudio.speak(`Harika! ${b.label} sepete koydun!`);
              this.advanceStep(true);
            } else {
              KidsAudio.gentleTryAgain();
              KidsAudio.speak(`Bu ${b.label} sepet. ${this.gs.target.label} sepeti bulalım!`);
            }
            return;
          }
        }
      } else if (mode === "train") {
        for (const it of this.gs.items) {
          if (Math.hypot(px - it.x, py - it.y) <= it.r * 1.2) {
            if (it.emoji === this.gs.extra.ans) {
              KidsAudio.correct();
              this.spawnBurst(it.x, it.y, "#ffd93d", 22);
              KidsAudio.speak("Çuf çuf! Tren tamamlandı, harikasın!");
              this.advanceStep(true);
            } else {
              KidsAudio.gentleTryAgain();
              KidsAudio.speak("Sıraya tekrar bakalım, hangisi gelmeli?");
            }
            return;
          }
        }
      }
      return;
    }

    // -------------------- SUPER WHY! --------------------
    if (id === "pbs_superwhy") {
      if (mode === "firstletter") {
        for (const it of this.gs.items) {
          if (Math.hypot(px - it.x, py - it.y) <= it.r * 1.2) {
            if (it.letter === this.gs.target.letter) {
              KidsAudio.correct();
              this.spawnBurst(it.x, it.y, it.color, 24);
              KidsAudio.speak(`Süpersin! ${this.gs.target.letter} harfi! ${this.gs.target.word}!`);
              this.advanceStep(true);
            } else {
              KidsAudio.gentleTryAgain();
              KidsAudio.speak(`Bu ${it.letter} harfi. Biz "${this.gs.target.letter}" harfini arıyoruz!`);
            }
            return;
          }
        }
      } else if (mode === "alphabridge") {
        const expected = this.gs.extra.seq[this.gs.extra.nextIdx];
        for (const it of this.gs.items) {
          if (!it.done && Math.abs(px - it.x) <= it.w * 0.5 && Math.abs(py - it.y) <= it.h * 0.55) {
            if (it.letter === expected) {
              it.done = true;
              this.gs.extra.nextIdx++;
              KidsAudio.pop();
              this.spawnBurst(it.x, it.y, "#00f2fe", 18);
              KidsAudio.speak(it.letter);
              if (this.gs.extra.nextIdx >= this.gs.extra.seq.length) {
                setTimeout(() => {
                  KidsAudio.correct();
                  KidsAudio.speak("Harf köprüsü tamamlandı! Alpha Pig karşıya geçti!");
                  this.advanceStep(true);
                }, 400);
              }
            } else {
              KidsAudio.speak(`Sırada "${expected}" harfi var!`);
            }
            return;
          }
        }
      } else if (mode === "wordrocket") {
        // Dokunulan yere roketi uçur ve harfi kontrol et
        this.gs.hero.ry = Math.max(0.22, Math.min(0.84, py / height));
        const nextIdx = this.gs.extra.collectedIdx;
        for (const it of this.gs.items) {
          if (!it.collected && Math.hypot(px - it.x, py - it.y) <= it.r * 1.35) {
            if (it.idx === nextIdx) {
              it.collected = true;
              this.gs.extra.collectedIdx++;
              KidsAudio.pop();
              this.spawnBurst(it.x, it.y, "#ffd93d", 18);
              KidsAudio.speak(it.letter);
              if (this.gs.extra.collectedIdx >= this.gs.items.length) {
                setTimeout(() => {
                  KidsAudio.correct();
                  KidsAudio.speak(`Tebrikler! ${this.gs.extra.wordObj.word} kelimesini yazdın!`);
                  this.advanceStep(true);
                }, 450);
              }
            } else {
              const expCh = this.gs.extra.wordObj.letters[nextIdx];
              KidsAudio.speak(`Önce "${expCh}" harfini yakalayalım!`);
            }
            return;
          }
        }
      }
      return;
    }

    // -------------------- PEG + CAT --------------------
    if (id === "pbs_pegcat") {
      if (mode === "pizza") {
        for (const it of this.gs.items) {
          if (Math.hypot(px - it.x, py - it.y) <= it.r * 1.25) {
            if (it.id === this.gs.target.id) {
              this.gs.extra.placedCount++;
              const angle = (this.gs.extra.placedCount / 3) * Math.PI * 2;
              this.gs.extra.toppingsOnPizza.push({
                shapeId: it.id,
                color: it.color,
                dx: Math.cos(angle) * 0.42,
                dy: Math.sin(angle) * 0.42
              });
              KidsAudio.pop();
              this.spawnBurst(width * 0.5, playTop + playH * 0.38, it.color, 18);
              KidsAudio.speak(`${this.gs.extra.placedCount} ${it.name}!`);
              if (this.gs.extra.placedCount >= this.gs.extra.neededCount) {
                setTimeout(() => {
                  KidsAudio.correct();
                  KidsAudio.speak(`Harika! Şekilli pizza hazır!`);
                  this.advanceStep(true);
                }, 400);
              }
            } else {
              KidsAudio.gentleTryAgain();
              KidsAudio.speak(`Bu ${it.name}. Sipariş için ${this.gs.target.name} seçelim!`);
            }
            return;
          }
        }
      } else if (mode === "sizes") {
        for (const it of this.gs.items) {
          if (Math.hypot(px - it.x, py - it.y) <= it.r * 1.15) {
            if (it.id === this.gs.target.id) {
              KidsAudio.correct();
              this.spawnBurst(it.x, it.y, "#2ecc71", 22);
              KidsAudio.speak(`Evet! ${it.label} olanı buldun!`);
              this.advanceStep(true);
            } else {
              KidsAudio.gentleTryAgain();
              KidsAudio.speak(`Bu ${it.label}. Biz ${this.gs.target.label} olanı arıyoruz!`);
            }
            return;
          }
        }
      } else if (mode === "chickens") {
        const ex = this.gs.extra;
        if (py > playTop + playH * 0.5 && ex.currentChickens < ex.totalSeats) {
          ex.currentChickens++;
          KidsAudio.pop();
          this.spawnBurst(width * 0.5, playTop + playH * 0.35, "#ffd93d", 16);
          KidsAudio.speak(`${ex.currentChickens}!`);
          if (ex.currentChickens >= ex.totalSeats) {
            setTimeout(() => {
              KidsAudio.correct();
              KidsAudio.speak("5, 4, 3, 2, 1, Fırlat! Tüm uzay tavukları rokete bindi!");
              this.advanceStep(true);
            }, 450);
          }
        }
      }
    }
  }

  triggerHeroJumpOrMove(px, py) {
    if (this.activeGameId !== "pbs_wildkratts") return;
    const h = this.gs.hero;
    if (!h) return;
    KidsAudio.pop();
    if (this.activeModeId === "cheetah") {
      if (h.onGround) {
        h.vy = -0.95;
        h.onGround = false;
      }
    } else {
      if (py !== undefined && this.layout.height > 0) {
        h.ry = Math.max(0.24, Math.min(0.82, py / this.layout.height));
      } else {
        h.ry = Math.max(0.24, h.ry - 0.14);
      }
    }
  }

  advanceStep(setupNewRound = true) {
    this.stepProgress++;
    this.save.totalStars = (this.save.totalStars || 0) + 1;
    this.saveData();
    this.updatePlayHUD();
    this.updateHubHeaderStats();

    if (this.stepProgress >= this.stepTarget) {
      this.completeStage();
    } else if (setupNewRound) {
      setTimeout(() => {
        if (this.state === "PLAYING") {
          this.setupTaskForActiveGame();
        }
      }, 650);
    }
  }

  completeStage() {
    this.state = "CELEBRATION";
    KidsAudio.fanfare();

    const gId = this.activeGameId;
    if (!this.save.starsByGame[gId]) this.save.starsByGame[gId] = {};
    this.save.starsByGame[gId][this.levelNum] = 3;
    this.save.totalStars = (this.save.totalStars || 0) + 3;

    // Yeni çıkartma ödülü aç
    const lockedStickers = STICKER_COLLECTION.filter(
      (s) => !(this.save.unlockedStickers || []).includes(s.id)
    );
    let wonSticker = null;
    if (lockedStickers.length > 0) {
      wonSticker = lockedStickers[0];
      this.save.unlockedStickers.push(wonSticker.id);
    }
    this.saveData();
    this.updateHubHeaderStats();

    document.getElementById("cel-big-emoji").textContent = this.gameMeta.icon;
    document.getElementById("cel-title").textContent = "🌟 HARİKASIN! AŞAMA TAMAMLANDI!";
    document.getElementById("cel-subtitle").textContent = `${this.gameMeta.title} - Aşama ${this.levelNum}`;

    const factBox = document.getElementById("cel-fact-box");
    if (this.activeGameId === "pbs_wildkratts" && this.gs.suit) {
      factBox.textContent = `🐾 ${this.gs.suit.fact}`;
    } else {
      factBox.textContent = `✨ Harika iş çıkardın! +3 Altın Yıldız kazandın!`;
    }

    const stRewardEl = document.getElementById("cel-sticker-reward");
    if (wonSticker) {
      stRewardEl.textContent = `🎁 YENİ ÇIKARTMA KAZANDIN: ${wonSticker.emoji} ${wonSticker.name}!`;
      stRewardEl.classList.remove("hidden");
    } else {
      stRewardEl.classList.add("hidden");
    }

    document.getElementById("celebration-overlay").classList.remove("hidden");
    KidsAudio.speak(`Harikasın! Aşamayı başarıyla tamamladın ve üç yıldız kazandın!`);
  }

  // ==================== OYUN DÖNGÜSÜ VE ÇİZİM (RENDER) ====================
  loop(now) {
    const dt = Math.min(0.05, (now - this.lastFrame) / 1000);
    this.lastFrame = now;
    this.animTime += dt;

    if (this.state === "PLAYING" && this.ctx) {
      this.updateGame(dt);
      this.renderGame();
    }
    requestAnimationFrame((t) => this.loop(t));
  }

  updateGame(dt) {
    if (this.hintTimer > 0) this.hintTimer = Math.max(0, this.hintTimer - dt);

    // Parçacık efektleri
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 180 * dt;
      p.life -= dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }

    for (let i = this.floatingLabels.length - 1; i >= 0; i--) {
      const f = this.floatingLabels[i];
      f.y -= 35 * dt;
      f.life -= dt;
      if (f.life <= 0) this.floatingLabels.splice(i, 1);
    }

    if (this.gs.hero && this.gs.hero.moodTimer > 0) {
      this.gs.hero.moodTimer = Math.max(0, this.gs.hero.moodTimer - dt);
      if (this.gs.hero.moodTimer === 0) this.gs.hero.mood = "normal";
    }
    if (this.gs.hero && this.gs.hero.danceTimer > 0) {
      this.gs.hero.danceTimer = Math.max(0, this.gs.hero.danceTimer - dt);
    }

    // Wild Kratts gerçek zamanlı hareket güncellemesi
    if (this.activeGameId === "pbs_wildkratts") {
      const h = this.gs.hero;
      const ex = this.gs.extra;
      if (!h || !ex) return;
      ex.scrollX += dt * 160;

      if (this.activeModeId === "cheetah") {
        if (!h.onGround) {
          h.ry += h.vy * dt;
          h.vy += 2.1 * dt;
          if (h.ry >= 0.72) {
            h.ry = 0.72;
            h.vy = 0;
            h.onGround = true;
          }
        }
      }

      ex.spawnTimer -= dt;
      if (ex.spawnTimer <= 0) {
        ex.spawnTimer = 1.25;
        const isBaby = Math.random() < 0.72;
        this.gs.items.push({
          kind: isBaby ? "baby" : "obs",
          emoji: isBaby ? this.gs.suit.babyEmoji : this.gs.suit.obsEmoji,
          rx: 1.06,
          ry: this.activeModeId === "cheetah" ? (isBaby ? 0.56 : 0.73) : 0.28 + Math.random() * 0.5
        });
      }

      for (let i = this.gs.items.length - 1; i >= 0; i--) {
        const it = this.gs.items[i];
        it.rx -= dt * 0.36;
        const dist = Math.hypot((it.rx - h.rx) * this.layout.width, (it.ry - h.ry) * this.layout.height);
        if (dist < 46 * this.layout.scale) {
          if (it.kind === "baby") {
            KidsAudio.correct();
            this.spawnBurst(it.rx * this.layout.width, it.ry * this.layout.height, "#2ecc71", 18);
            this.gs.items.splice(i, 1);
            this.advanceStep(false);
            return;
          } else {
            KidsAudio.pop();
            it.rx = -0.2;
          }
        }
        if (it.rx < -0.1) this.gs.items.splice(i, 1);
      }
    }
  }

  renderGame() {
    const ctx = this.ctx;
    const { width, height, pad, headerH, playTop, playH, scale, fontLg, fontMd } = this.layout;
    ctx.clearRect(0, 0, width, height);

    // Arka plan renk geçişi
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, "#1e295b");
    grad.addColorStop(1, "#0f172a");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Üst Yönerge Banner'ı (Dokununca sesli okur)
    ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
    ctx.strokeStyle = this.gameMeta ? this.gameMeta.color : "#ffd93d";
    ctx.lineWidth = 2.5;
    this.roundRect(ctx, pad, pad * 0.6, width - pad * 2, headerH - pad * 0.4, 16, true, true);

    ctx.fillStyle = "#ffffff";
    ctx.font = `800 ${Math.max(12, Math.round(14 * scale))}px 'Segoe UI', sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const promptStr = `🗣️ ${this.gs.promptText || ""}`;
    this.drawWrappedText(ctx, promptStr, width / 2, pad * 0.6 + (headerH - pad * 0.4) / 2, width - pad * 4, Math.round(17 * scale));

    // Aktif oyunun sahnesini çiz
    const id = this.activeGameId;
    if (id === "tablet_tocalife") {
      this.renderTocaLife(ctx);
    } else if (id === "pbs_daniel") {
      this.renderDanielTiger(ctx);
    } else if (id === "pbs_wildkratts") {
      this.renderWildKratts(ctx);
    } else if (id === "pbs_george") {
      this.renderCuriousGeorge(ctx);
    } else if (id === "pbs_superwhy") {
      this.renderSuperWhy(ctx);
    } else if (id === "pbs_pegcat") {
      this.renderPegCat(ctx);
    }

    // Parçacıklar ve uçan yazılar
    for (const p of this.particles) {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    for (const f of this.floatingLabels) {
      ctx.fillStyle = f.color;
      ctx.font = `900 ${fontLg}px 'Segoe UI', sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(f.text, f.x, f.y);
    }
  }

  // -------------------- RENDER: TOCA MİNİ DÜNYA --------------------
  renderTocaLife(ctx) {
    const { width, height, playTop, playH, scale } = this.layout;
    const mode = this.activeModeId;

    if (mode === "kitchen") {
      const h = this.gs.hero;
      const cx = width * 0.5;
      const cy = playTop + playH * 0.25;
      const r = Math.min(width, playH) * 0.17;

      // Mutfak Masası & Karakter
      ctx.fillStyle = "rgba(255, 94, 142, 0.2)";
      ctx.strokeStyle = "#ff5e8e";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      const bounce = h.moodTimer > 0 ? Math.sin(this.animTime * 14) * 6 : 0;
      ctx.font = `${Math.round(r * 1.15)}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(h.emoji, cx, cy + bounce);

      // Duygu tepkisi
      const moodBadge = h.mood === "love" ? "😍😋" : h.mood === "excited" ? "🤩🎉" : h.mood === "sour" ? "😖🍋" : h.mood === "strong" ? "💪😄" : "😋";
      ctx.font = `${Math.round(26 * scale)}px sans-serif`;
      ctx.fillText(moodBadge, cx + r * 0.85, cy - r * 0.65);

      // Smoothie Bardağı
      const cupX = width * 0.82;
      const cupY = cy;
      ctx.fillStyle = "rgba(255,255,255,0.2)";
      this.roundRect(ctx, cupX - 24 * scale, cupY - 34 * scale, 48 * scale, 68 * scale, 10, true, true);
      h.smoothieColors.forEach((col, idx) => {
        ctx.fillStyle = col;
        ctx.fillRect(cupX - 20 * scale, cupY + (18 - idx * 14) * scale, 40 * scale, 13 * scale);
      });

      // Yiyecek tepsisi
      for (const it of this.gs.items) {
        ctx.fillStyle = `${it.color}33`;
        ctx.strokeStyle = it.color;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(it.x, it.y, it.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.font = `${Math.round(it.r * 0.95)}px sans-serif`;
        ctx.fillText(it.emoji, it.x, it.y - 4 * scale);
        ctx.fillStyle = "#ffffff";
        ctx.font = `800 ${Math.round(11 * scale)}px sans-serif`;
        ctx.fillText(it.name, it.x, it.y + it.r * 0.72);
      }
    } else if (mode === "dressup") {
      const h = this.gs.hero;
      const cx = width * 0.5;
      const cy = playTop + playH * 0.25;
      const danceX = h.danceTimer > 0 ? Math.sin(this.animTime * 12) * 14 : 0;

      // Podyum halkası
      ctx.fillStyle = `${h.bodyColor}33`;
      ctx.strokeStyle = h.bodyColor;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(cx + danceX, cy, Math.min(width, playH) * 0.17, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.font = `${Math.round(56 * scale)}px sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(h.baseEmoji, cx + danceX, cy + 10 * scale);
      ctx.font = `${Math.round(40 * scale)}px sans-serif`;
      ctx.fillText(h.hat, cx + danceX, cy - 34 * scale);

      for (const it of this.gs.items) {
        ctx.fillStyle = `${it.bodyColor}28`;
        ctx.strokeStyle = it.bodyColor;
        ctx.lineWidth = 2.5;
        this.roundRect(ctx, it.x - it.w / 2, it.y - it.h / 2, it.w, it.h, 14, true, true);
        ctx.font = `${Math.round(28 * scale)}px sans-serif`;
        ctx.fillText(it.emoji, it.x, it.y - 8 * scale);
        ctx.fillStyle = "#fff";
        ctx.font = `800 ${Math.round(12 * scale)}px sans-serif`;
        ctx.fillText(it.name, it.x, it.y + it.h * 0.3);
      }
    } else if (mode === "petcare") {
      const h = this.gs.hero;
      const cx = width * 0.5;
      const cy = playTop + playH * 0.38;
      const petR = Math.min(width, playH) * 0.23;

      // Banyo küveti dairesi
      ctx.fillStyle = "rgba(0, 242, 254, 0.18)";
      ctx.strokeStyle = "#00f2fe";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy, petR, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.font = `${Math.round(petR * 1.15)}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(h.emoji, cx, cy);

      // Çamur lekeleri veya köpükler
      h.mudSpots.forEach((s) => {
        const sx = cx + s.dx * petR * 1.4;
        const sy = cy + s.dy * petR * 1.4;
        if (!s.cleaned) {
          ctx.fillStyle = "#78350f";
          ctx.strokeStyle = "#ffd93d";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(sx, sy, 22 * scale, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.font = `${Math.round(20 * scale)}px sans-serif`;
          ctx.fillText("🫧", sx, sy);
        } else {
          ctx.font = `${Math.round(22 * scale)}px sans-serif`;
          ctx.fillText("✨", sx, sy);
        }
      });

      // Alt bakım araçları
      for (const it of this.gs.items) {
        const active = h.activeTool === it.id;
        ctx.fillStyle = active ? `${it.color}55` : "rgba(255,255,255,0.12)";
        ctx.strokeStyle = it.color;
        ctx.lineWidth = active ? 3.5 : 2;
        this.roundRect(ctx, it.x - it.w / 2, it.y - it.h / 2, it.w, it.h, 14, true, true);
        ctx.fillStyle = "#fff";
        ctx.font = `800 ${Math.round(14 * scale)}px sans-serif`;
        ctx.fillText(`${it.emoji} ${it.name}`, it.x, it.y);
      }
    } else if (mode === "artparty") {
      const ex = this.gs.extra;
      for (const d of ex.paintDots) {
        ctx.fillStyle = d.color;
        ctx.beginPath();
        ctx.arc(d.x, d.y, 24 * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = `${Math.round(26 * scale)}px sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText(d.sticker, d.x, d.y + 4);
      }
      for (const b of ex.balloons) {
        if (b.popped) continue;
        const bx = b.rx * width;
        const by = b.ry * height + Math.sin(this.animTime * 3 + b.rx * 10) * 8;
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.arc(bx, by, 32 * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.font = `${Math.round(22 * scale)}px sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText("🎈", bx, by);
      }
    }
  }

  // -------------------- RENDER: DANIEL TIGER --------------------
  renderDanielTiger(ctx) {
    const { width, playTop, playH, scale } = this.layout;
    const mode = this.activeModeId;

    if (mode === "feelings") {
      const cx = width * 0.5;
      const cy = playTop + playH * 0.15;
      ctx.font = `${Math.round(46 * scale)}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`🐯 ${this.gs.target ? this.gs.target.emoji : "😊"}`, cx, cy);

      for (const it of this.gs.items) {
        const isHint = this.hintTimer > 0 && this.gs.target && it.id === this.gs.target.id;
        ctx.fillStyle = `${it.color}30`;
        ctx.strokeStyle = isHint ? "#ffffff" : it.color;
        ctx.lineWidth = isHint ? 5 : 3;
        this.roundRect(ctx, it.x, it.y, it.w, it.h, 18, true, true);

        ctx.font = `${Math.round(it.h * 0.46)}px sans-serif`;
        ctx.fillText(it.emoji, it.x + it.w / 2, it.y + it.h * 0.4);
        ctx.fillStyle = "#ffffff";
        ctx.font = `900 ${Math.round(15 * scale)}px sans-serif`;
        ctx.fillText(it.label, it.x + it.w / 2, it.y + it.h * 0.8);
      }
    } else if (mode === "breathe") {
      ctx.font = `${Math.round(52 * scale)}px sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText("🐯 🌈", width * 0.5, playTop + playH * 0.2);

      for (const it of this.gs.items) {
        if (it.popped) continue;
        const floatY = it.y + Math.sin(this.animTime * 3 + it.num) * 8;
        ctx.fillStyle = `${it.color}44`;
        ctx.strokeStyle = it.color;
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(it.x, floatY, it.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#fff";
        ctx.font = `900 ${Math.round(it.r * 0.85)}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(it.num, it.x, floatY);
      }
    } else if (mode === "sharing") {
      const treat = this.gs.extra.treatEmoji;
      for (const f of this.gs.targets) {
        ctx.fillStyle = f.count > 0 ? "rgba(46, 204, 113, 0.28)" : "rgba(255, 255, 255, 0.12)";
        ctx.strokeStyle = f.count > 0 ? "#2ecc71" : "#ffd93d";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.font = `${Math.round(f.r * 0.9)}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(f.emoji, f.x, f.y - 6 * scale);
        ctx.fillStyle = "#fff";
        ctx.font = `800 ${Math.round(13 * scale)}px sans-serif`;
        ctx.fillText(f.name, f.x, f.y + f.r * 0.72);

        if (f.count > 0) {
          ctx.font = `${Math.round(30 * scale)}px sans-serif`;
          ctx.fillText(treat, f.x, f.y + f.r * 1.25);
        }
      }
      ctx.font = `800 ${Math.round(18 * scale)}px sans-serif`;
      ctx.fillStyle = "#ffd93d";
      ctx.fillText(`Tepsideki İkramlar: ${treat.repeat(Math.max(0, this.gs.extra.remaining))}`, width * 0.5, playTop + playH * 0.86);
    }
  }

  // -------------------- RENDER: WILD KRATTS --------------------
  renderWildKratts(ctx) {
    const { width, height, playTop, playH, scale } = this.layout;
    const suit = this.gs.suit;
    const h = this.gs.hero;
    if (!suit || !h) return;

    // Doğa arka planı
    const bg = ctx.createLinearGradient(0, playTop, 0, height);
    bg.addColorStop(0, suit.bgTop);
    bg.addColorStop(1, suit.bgBot);
    ctx.fillStyle = bg;
    ctx.fillRect(0, playTop, width, height - playTop);

    // Zemin çizgisi
    if (this.activeModeId === "cheetah") {
      ctx.fillStyle = "#3f6212";
      ctx.fillRect(0, height * 0.79, width, height * 0.21);
    }

    // Kahraman
    const hx = h.rx * width;
    const hy = h.ry * height;
    ctx.font = `${Math.round(46 * scale)}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(suit.heroEmoji, hx, hy);

    // Yavru hayvanlar ve engeller
    for (const it of this.gs.items) {
      const ix = it.rx * width;
      const iy = it.ry * height;
      ctx.fillStyle = it.kind === "baby" ? "rgba(46, 204, 113, 0.35)" : "rgba(239, 68, 68, 0.3)";
      ctx.beginPath();
      ctx.arc(ix, iy, 26 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = `${Math.round(34 * scale)}px sans-serif`;
      ctx.fillText(it.emoji, ix, iy);
    }
  }

  // -------------------- RENDER: CURIOUS GEORGE --------------------
  renderCuriousGeorge(ctx) {
    const { width, playTop, playH, scale } = this.layout;
    const mode = this.activeModeId;

    if (mode === "balloons") {
      ctx.font = `${Math.round(50 * scale)}px sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(`🐵 🎈 x ${this.gs.extra.collected} / ${this.gs.extra.targetNum}`, width * 0.5, playTop + playH * 0.14);

      for (const b of this.gs.items) {
        if (b.collected) continue;
        const fy = b.y + Math.sin(this.animTime * 3 + b.idx) * 6;
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.arc(b.x, fy, b.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.fillStyle = "#0f172a";
        ctx.font = `900 ${Math.round(b.r * 0.85)}px sans-serif`;
        ctx.textBaseline = "middle";
        ctx.fillText("🎈", b.x, fy);
      }
    } else if (mode === "baskets") {
      const cur = this.gs.target;
      const cx = width * 0.5;
      const cy = playTop + playH * 0.25;
      ctx.fillStyle = "rgba(255,255,255,0.12)";
      ctx.beginPath();
      ctx.arc(cx, cy, 52 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = `${Math.round(58 * scale)}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(cur.emoji, cx, cy);

      for (const b of this.gs.targets) {
        ctx.fillStyle = `${b.color}38`;
        ctx.strokeStyle = b.color;
        ctx.lineWidth = 3.5;
        this.roundRect(ctx, b.x - b.w / 2, b.y - b.h / 2, b.w, b.h, 18, true, true);
        ctx.font = `${Math.round(38 * scale)}px sans-serif`;
        ctx.fillText(`🧺 ${b.emoji}`, b.x, b.y - 10 * scale);
        ctx.fillStyle = "#fff";
        ctx.font = `900 ${Math.round(14 * scale)}px sans-serif`;
        ctx.fillText(b.label, b.x, b.y + b.h * 0.3);
      }
    } else if (mode === "train") {
      const seq = this.gs.extra.seq;
      const totalCars = seq.length + 1;
      const carW = Math.min(78 * scale, (width - 40) / totalCars);
      const startX = (width - totalCars * carW) / 2;
      const trainY = playTop + playH * 0.32;

      for (let i = 0; i < totalCars; i++) {
        const cx = startX + (i + 0.5) * carW;
        ctx.fillStyle = i === seq.length ? "rgba(255, 217, 61, 0.28)" : "rgba(0, 242, 254, 0.2)";
        ctx.strokeStyle = i === seq.length ? "#ffd93d" : "#00f2fe";
        ctx.lineWidth = 3;
        this.roundRect(ctx, cx - carW * 0.44, trainY - 36 * scale, carW * 0.88, 72 * scale, 12, true, true);
        ctx.font = `${Math.round(32 * scale)}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#fff";
        ctx.fillText(i < seq.length ? seq[i] : "❓", cx, trainY);
      }

      for (const it of this.gs.items) {
        ctx.fillStyle = "rgba(255,255,255,0.14)";
        ctx.strokeStyle = "#ffd93d";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(it.x, it.y, it.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.font = `${Math.round(it.r * 0.95)}px sans-serif`;
        ctx.fillText(it.emoji, it.x, it.y);
      }
    }
  }

  // -------------------- RENDER: SUPER WHY! --------------------
  renderSuperWhy(ctx) {
    const { width, playTop, playH, scale } = this.layout;
    const mode = this.activeModeId;

    if (mode === "firstletter") {
      const t = this.gs.target;
      const cx = width * 0.5;
      const cy = playTop + playH * 0.27;
      ctx.fillStyle = "rgba(255,255,255,0.12)";
      ctx.strokeStyle = t.color;
      ctx.lineWidth = 3;
      this.roundRect(ctx, cx - 120 * scale, cy - 55 * scale, 240 * scale, 110 * scale, 20, true, true);

      ctx.font = `${Math.round(52 * scale)}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(t.emoji, cx - 50 * scale, cy);
      ctx.fillStyle = "#ffd93d";
      ctx.font = `900 ${Math.round(26 * scale)}px sans-serif`;
      ctx.fillText(t.word, cx + 38 * scale, cy);

      for (const it of this.gs.items) {
        const isHint = this.hintTimer > 0 && it.letter === t.letter;
        ctx.fillStyle = `${it.color}35`;
        ctx.strokeStyle = isHint ? "#fff" : it.color;
        ctx.lineWidth = isHint ? 5 : 3;
        ctx.beginPath();
        ctx.arc(it.x, it.y, it.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#fff";
        ctx.font = `900 ${Math.round(it.r * 0.95)}px sans-serif`;
        ctx.fillText(it.letter, it.x, it.y);
      }
    } else if (mode === "alphabridge") {
      ctx.font = `${Math.round(44 * scale)}px sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText("🐷 🌈 🏰", width * 0.5, playTop + playH * 0.18);

      for (const it of this.gs.items) {
        ctx.fillStyle = it.done ? "rgba(46, 204, 113, 0.45)" : "rgba(0, 242, 254, 0.2)";
        ctx.strokeStyle = it.done ? "#2ecc71" : "#00f2fe";
        ctx.lineWidth = 3;
        this.roundRect(ctx, it.x - it.w / 2, it.y - it.h / 2, it.w, it.h, 16, true, true);
        ctx.fillStyle = "#fff";
        ctx.font = `900 ${Math.round(30 * scale)}px sans-serif`;
        ctx.textBaseline = "middle";
        ctx.fillText(it.letter, it.x, it.y);
      }
    } else if (mode === "wordrocket") {
      const wObj = this.gs.extra.wordObj;
      ctx.font = `900 ${Math.round(24 * scale)}px sans-serif`;
      ctx.fillStyle = "#ffd93d";
      ctx.textAlign = "center";
      ctx.fillText(`${wObj.emoji} HEDEF KELİME: ${wObj.word}`, width * 0.5, playTop + 22 * scale);

      const hx = this.gs.hero.rx * width;
      const hy = this.gs.hero.ry * this.layout.height;
      ctx.font = `${Math.round(48 * scale)}px sans-serif`;
      ctx.fillText("🚀", hx, hy);

      for (const it of this.gs.items) {
        if (it.collected) continue;
        ctx.fillStyle = "rgba(255, 217, 61, 0.28)";
        ctx.strokeStyle = "#ffd93d";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(it.x, it.y, it.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#fff";
        ctx.font = `900 ${Math.round(it.r * 0.9)}px sans-serif`;
        ctx.textBaseline = "middle";
        ctx.fillText(it.letter, it.x, it.y);
      }
    }
  }

  // -------------------- RENDER: PEG + CAT --------------------
  renderPegCat(ctx) {
    const { width, playTop, playH, scale } = this.layout;
    const mode = this.activeModeId;

    if (mode === "pizza") {
      const px = width * 0.5;
      const py = playTop + playH * 0.36;
      const pr = Math.min(width, playH) * 0.25;

      // Pizza Hamuru ve Peynir
      ctx.fillStyle = "#f59e0b";
      ctx.beginPath();
      ctx.arc(px, py, pr, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fde047";
      ctx.beginPath();
      ctx.arc(px, py, pr * 0.84, 0, Math.PI * 2);
      ctx.fill();

      // Yerleştirilen şekiller
      for (const top of this.gs.extra.toppingsOnPizza) {
        this.drawGeometricShape(ctx, top.shapeId, px + top.dx * pr, py + top.dy * pr, pr * 0.22, top.color);
      }

      // Alt şekil seçenekleri
      for (const it of this.gs.items) {
        ctx.fillStyle = "rgba(255,255,255,0.12)";
        ctx.strokeStyle = it.color;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(it.x, it.y, it.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        this.drawGeometricShape(ctx, it.id, it.x, it.y - 4 * scale, it.r * 0.55, it.color);
        ctx.fillStyle = "#fff";
        ctx.font = `800 ${Math.round(11 * scale)}px sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText(it.name, it.x, it.y + it.r * 0.75);
      }
    } else if (mode === "sizes") {
      for (const it of this.gs.items) {
        ctx.fillStyle = "rgba(255,255,255,0.12)";
        ctx.strokeStyle = "#a66cff";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(it.x, it.y, it.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.font = `${Math.round(38 * scale * it.scale)}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(it.emoji, it.x, it.y - 8 * scale);

        ctx.fillStyle = "#ffd93d";
        ctx.font = `900 ${Math.round(12 * scale)}px sans-serif`;
        ctx.fillText(it.label, it.x, it.y + it.r * 0.72);
      }
    } else if (mode === "chickens") {
      const ex = this.gs.extra;
      const slotW = Math.min(68 * scale, (width - 40) / ex.totalSeats);
      const startX = (width - ex.totalSeats * slotW) / 2;
      const rocketY = playTop + playH * 0.32;

      for (let i = 0; i < ex.totalSeats; i++) {
        const sx = startX + (i + 0.5) * slotW;
        const filled = i < ex.currentChickens;
        ctx.fillStyle = filled ? "rgba(46, 204, 113, 0.35)" : "rgba(255, 255, 255, 0.1)";
        ctx.strokeStyle = filled ? "#2ecc71" : "#00f2fe";
        ctx.lineWidth = 3;
        this.roundRect(ctx, sx - slotW * 0.44, rocketY - 36 * scale, slotW * 0.88, 72 * scale, 14, true, true);
        ctx.font = `${Math.round(32 * scale)}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(filled ? "🐔" : `${i + 1}`, sx, rocketY);
      }

      // Altta dokunulacak uzay tavuğu butonu
      const btnY = playTop + playH * 0.75;
      ctx.fillStyle = "rgba(255, 217, 61, 0.25)";
      ctx.strokeStyle = "#ffd93d";
      ctx.lineWidth = 3.5;
      this.roundRect(ctx, width * 0.25, btnY - 38 * scale, width * 0.5, 76 * scale, 20, true, true);
      ctx.fillStyle = "#fff";
      ctx.font = `900 ${Math.round(20 * scale)}px sans-serif`;
      ctx.fillText("🐔 TAVUĞA DOKUN VE ROKETE BİNDİR! 🚀", width * 0.5, btnY);
    }
  }

  drawGeometricShape(ctx, shapeId, x, y, r, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    if (shapeId === "circle") {
      ctx.arc(x, y, r, 0, Math.PI * 2);
    } else if (shapeId === "square") {
      ctx.rect(x - r, y - r, r * 2, r * 2);
    } else if (shapeId === "triangle") {
      ctx.moveTo(x, y - r);
      ctx.lineTo(x + r, y + r);
      ctx.lineTo(x - r, y + r);
      ctx.closePath();
    } else if (shapeId === "star") {
      for (let i = 0; i < 5; i++) {
        const a1 = (i * 2 * Math.PI) / 5 - Math.PI / 2;
        const a2 = a1 + Math.PI / 5;
        ctx.lineTo(x + Math.cos(a1) * r, y + Math.sin(a1) * r);
        ctx.lineTo(x + Math.cos(a2) * r * 0.45, y + Math.sin(a2) * r * 0.45);
      }
      ctx.closePath();
    } else {
      ctx.arc(x, y, r, 0, Math.PI * 2);
    }
    ctx.fill();
  }

  roundRect(ctx, x, y, w, h, r, fill = true, stroke = false) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
  }

  drawWrappedText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(" ");
    let line = "";
    const lines = [];
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + " ";
      if (ctx.measureText(testLine).width > maxWidth && n > 0) {
        lines.push(line.trim());
        line = words[n] + " ";
      } else {
        line = testLine;
      }
    }
    lines.push(line.trim());
    const totalH = (lines.length - 1) * lineHeight;
    lines.forEach((l, i) => {
      ctx.fillText(l, x, y - totalH / 2 + i * lineHeight);
    });
  }

  spawnBurst(x, y, color, count = 16) {
    for (let i = 0; i < count; i++) {
      const a = (Math.PI * 2 * i) / count + Math.random() * 0.3;
      const spd = 60 + Math.random() * 140;
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd - 40,
        r: 4 + Math.random() * 4,
        color,
        life: 0.55 + Math.random() * 0.25
      });
    }
  }

  addFloatingText(x, y, text, color = "#ffd93d") {
    this.floatingLabels.push({ x, y, text, color, life: 1.0 });
  }

  // ==================== ÇIKARTMA ALBÜMÜ (STICKER MODAL) ====================
  renderStickerModal() {
    const grid = document.getElementById("stickers-grid");
    if (!grid) return;
    grid.innerHTML = "";
    const unlocked = this.save.unlockedStickers || [];

    STICKER_COLLECTION.forEach((st) => {
      const isOpen = unlocked.includes(st.id);
      const card = document.createElement("div");
      card.className = `sticker-card ${isOpen ? "unlocked" : "locked"}`;
      card.innerHTML = `
        <div class="sticker-emoji">${st.emoji}</div>
        <div class="sticker-name">${isOpen ? st.name : "🔒 Sürpriz"}</div>
      `;
      card.addEventListener("click", () => {
        if (isOpen) {
          KidsAudio.correct();
          KidsAudio.speak(st.name);
        } else {
          KidsAudio.pop();
          KidsAudio.speak("Bu çıkartmayı açmak için oyunları oynamaya devam et!");
        }
      });
      grid.appendChild(card);
    });
  }

  // ==================== OLAY DİNLEYİCİLERİ (EVENTS) ====================
  bindEvents() {
    window.addEventListener("resize", () => {
      if (this.state === "PLAYING") this.calculateGameArea();
    });

    // Kategori sekmeleri (Çocuk Oyunları Menüsü)
    document.querySelectorAll(".cat-tab").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".cat-tab").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        this.activeCategory = btn.dataset.cat || "all";
        KidsAudio.pop();
        this.renderHubGames();
      });
    });

    // Ses ve konuşma butonları
    document.getElementById("btn-toggle-voice")?.addEventListener("click", () => {
      KidsAudio.voiceEnabled = !KidsAudio.voiceEnabled;
      document.getElementById("voice-status-text").textContent = `🗣️ Sesli Rehber: ${KidsAudio.voiceEnabled ? "AÇIK" : "KAPALI"}`;
      if (KidsAudio.voiceEnabled) KidsAudio.speak("Sesli rehber açıldı!");
    });

    const toggleSoundFn = () => {
      KidsAudio.soundEnabled = !KidsAudio.soundEnabled;
      const txt = document.getElementById("sound-status-text");
      if (txt) txt.textContent = `🔊 Ses: ${KidsAudio.soundEnabled ? "AÇIK" : "KAPALI"}`;
      const hudBtn = document.getElementById("hud-btn-sound");
      if (hudBtn) hudBtn.textContent = KidsAudio.soundEnabled ? "🔊" : "🔇";
    };
    document.getElementById("btn-toggle-sound")?.addEventListener("click", toggleSoundFn);
    document.getElementById("hud-btn-sound")?.addEventListener("click", toggleSoundFn);

    // Çıkartma Albümü
    document.getElementById("btn-open-stickers")?.addEventListener("click", () => {
      KidsAudio.pop();
      this.renderStickerModal();
      this.showScreen("sticker-modal");
      KidsAudio.speak("İşte senin çıkartma albümün! Çıkartmalara dokunarak isimlerini dinleyebilirsin.");
    });
    document.getElementById("btn-close-stickers")?.addEventListener("click", () => {
      KidsAudio.pop();
      this.showScreen("hub-screen");
    });

    // Oyun Menüsü Geri & Başlat
    document.getElementById("gm-back-hub")?.addEventListener("click", () => {
      this.state = "HUB";
      this.renderHubGames();
      this.showScreen("hub-screen");
    });
    document.getElementById("gm-play-now")?.addEventListener("click", () => {
      this.startGameLevel(1, this.activeModeId);
    });
    document.getElementById("gm-speak-desc")?.addEventListener("click", () => {
      if (this.gameMeta) KidsAudio.speak(`${this.gameMeta.title}. ${this.gameMeta.desc}`);
    });

    // Oyun içi üst bar
    document.getElementById("hud-btn-back")?.addEventListener("click", () => {
      this.state = "HUB";
      this.renderHubGames();
      this.showScreen("hub-screen");
    });
    document.getElementById("hud-btn-levels")?.addEventListener("click", () => {
      this.state = "MENU";
      this.renderGameMenuScreen();
      this.showScreen("game-menu-screen");
    });
    document.getElementById("hud-btn-speak")?.addEventListener("click", () => {
      KidsAudio.speak(this.gs.promptText || "");
    });

    // Alt dokunmatik yardımcı butonlar
    document.getElementById("btn-kid-hint")?.addEventListener("click", () => {
      this.hintTimer = 3.0;
      KidsAudio.pop();
      KidsAudio.speak(this.gs.promptText || "Parlayan seçeneğe dokun!");
    });
    document.getElementById("btn-kid-next-task")?.addEventListener("click", () => {
      KidsAudio.pop();
      this.setupTaskForActiveGame();
    });

    // Yön tuşları (Wild Kratts & Super Why Roketi için)
    document.getElementById("td-up")?.addEventListener("pointerdown", () => {
      if (this.activeGameId === "pbs_wildkratts") {
        this.triggerHeroJumpOrMove();
      } else if (this.gs.hero) {
        this.gs.hero.ry = Math.max(0.24, (this.gs.hero.ry || 0.5) - 0.12);
      }
    });
    document.getElementById("td-down")?.addEventListener("pointerdown", () => {
      if (this.gs.hero && this.activeModeId !== "cheetah") {
        this.gs.hero.ry = Math.min(0.82, (this.gs.hero.ry || 0.5) + 0.12);
      }
    });
    document.getElementById("td-action")?.addEventListener("pointerdown", () => {
      this.triggerHeroJumpOrMove();
    });

    // Kutlama ekranı butonları
    document.getElementById("cel-btn-next")?.addEventListener("click", () => {
      const nextLvl = this.levelNum < 30 ? this.levelNum + 1 : 1;
      const nextMode = this.gameMeta.modes[(nextLvl - 1) % this.gameMeta.modes.length].id;
      this.startGameLevel(nextLvl, nextMode);
    });
    document.getElementById("cel-btn-retry")?.addEventListener("click", () => {
      this.startGameLevel(this.levelNum, this.activeModeId);
    });
    document.getElementById("cel-btn-hub")?.addEventListener("click", () => {
      this.state = "HUB";
      this.renderHubGames();
      this.showScreen("hub-screen");
    });

    // Canvas dokunma ve sürükleme
    if (this.canvas) {
      this.canvas.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const px = ((e.clientX - rect.left) / rect.width) * this.layout.width;
        const py = ((e.clientY - rect.top) / rect.height) * this.layout.height;
        this.handleCanvasTap(px, py);
      });
    }
  }
}

window.addEventListener("DOMContentLoaded", () => {
  window.kidsPortal = new KidsGamesPortal();
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
});
