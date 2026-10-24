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

    this.stepProgress = 0;
    this.stepTarget = 4;

    this.layout = {
      width: 640,
      height: 480,
      dpr: 1,
      scale: 1,
      unit: 48,
      pad: 16,
      headerH: 64,
      playTop: 80,
      playH: 380,
      fontLg: 22,
      fontMd: 16,
      fontSm: 13
    };

    this.particles = [];
    this.floatingLabels = [];
    this.hintTimer = 0;
    this.animTime = 0;
    this.lastFrame = performance.now();

    // Her zaman güvenli varsayılanlarla başlatılan oyun durumu
    this.gs = this.createEmptyGameState();

    this.save = this.loadSave();
    this.initUI();
    this.bindEvents();
    requestAnimationFrame((t) => this.loop(t));
  }

  createEmptyGameState(mode = "") {
    return {
      mode,
      promptText: "",
      items: [],
      targets: [],
      target: null,
      suit: WILD_KRATTS_ANIMALS.cheetah,
      hero: {
        emoji: "👧",
        baseEmoji: "🧒",
        name: "Mia",
        hat: "👑",
        costumeName: "Altın Taç",
        bodyColor: "#fbbf24",
        mood: "normal",
        moodTimer: 0,
        danceTimer: 0,
        characterIdx: 0,
        characters: [
          { emoji: "👧", name: "Mia" },
          { emoji: "👦", name: "Leo" },
          { emoji: "🐱", name: "Minnoş Kedi" },
          { emoji: "🦖", name: "Yeşil Dino" }
        ],
        smoothieColors: [],
        activeTool: "soap",
        mudSpots: [],
        rx: 0.18,
        ry: 0.65,
        vy: 0,
        onGround: true
      },
      extra: {
        poppedCount: 0,
        targetCount: 4,
        treatEmoji: "🧁",
        remaining: 3,
        rescued: 0,
        targetRescue: 5,
        spawnTimer: 0.5,
        scrollX: 0,
        collected: 0,
        targetNum: 4,
        seq: ["🔴", "🔵", "🔴", "🔵"],
        ans: "🔴",
        opts: ["🔴", "🔵", "🟢"],
        nextIdx: 0,
        wordObj: { word: "ELMA", letters: ["E", "L", "M", "A"], emoji: "🍎" },
        collectedIdx: 0,
        placedCount: 0,
        neededCount: 3,
        toppingsOnPizza: [],
        totalSeats: 5,
        currentChickens: 2,
        needed: 3,
        paintDots: [],
        palette: ["#ec4899", "#f59e0b", "#22c55e", "#0ea5e9", "#8b5cf6", "#fb923c"],
        stickers: ["🦄", "🌟", "🌈", "🦖", "🍓", "🚀"],
        balloons: []
      }
    };
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
          <div class="kg-avatar" style="background:${g.color}22;border:3px solid ${g.color}">${g.icon}</div>
          <div class="kg-meta">
            <div class="kg-badges">
              <span class="kg-tag" style="background:${g.color};color:#ffffff">${g.badge}</span>
              <span class="kg-tag" style="background:#e0f2fe;color:#0369a1;border:1px solid #7dd3fc">${g.ageTag}</span>
            </div>
            <h3 style="color:#1e293b">${g.title}</h3>
            <div class="kg-skill">✨ ${g.skill}</div>
          </div>
        </div>
        <p class="kg-desc">${g.desc}</p>
        <div class="kg-modes-preview">${modesHtml}</div>
        <div class="kg-footer">
          <span class="kg-progress">⭐ Yıldızlar: ${earnedStars} / 90</span>
          <button class="btn btn-primary btn-sm kg-play-btn" style="background:linear-gradient(135deg, ${g.color}, ${g.accent});color:#ffffff">
            ▶️ HEMEN OYNA
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
    titleEl.style.color = "#db2777";
    document.getElementById("gm-desc").textContent = g.desc;

    // Mod/Oda Seçici Butonlar
    const modesRow = document.getElementById("gm-modes-row");
    modesRow.innerHTML = "";
    g.modes.forEach((m, idx) => {
      const btn = document.createElement("button");
      btn.className = `mode-select-btn ${m.id === this.activeModeId ? "active" : ""}`;
      btn.innerHTML = `
        <span style="font-size:2rem">${m.icon}</span>
        <span>${m.name}</span>
        <small style="font-size:0.74rem;color:#475569;font-weight:700">${m.desc}</small>
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
      if (st > 0) cell.style.borderColor = "#f59e0b";
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
  }

  /**
   * KURAL GEREĞİ: Kullanılan cihazın ekran boyutuna göre oyun alanını hesaplar
   * ve her yeni oyunun bileşenlerini bu alana tam sığacak şekilde ölçeklendirir.
   */
  calculateGameArea() {
    if (!this.canvas || !this.ctx) return;
    const screenW = Math.max(320, window.innerWidth || 360);
    const screenH = Math.max(420, window.innerHeight || 640);

    const hudEl = document.getElementById("play-hud");
    const touchEl = document.getElementById("kids-touch-bar");

    const hudH = hudEl && hudEl.offsetHeight ? hudEl.offsetHeight : 56;
    const touchH = touchEl && touchEl.offsetHeight ? touchEl.offsetHeight : 100;

    const availW = Math.max(280, Math.min(1100, screenW - 18));
    const availH = Math.max(230, screenH - hudH - touchH - 18);

    const maxAspect = screenW > screenH ? 1.68 : 0.95;
    let gameW = availW;
    let gameH = availH;
    if (gameW / gameH > maxAspect) {
      gameW = Math.floor(gameH * maxAspect);
    } else if (gameW / gameH < 0.55) {
      gameH = Math.floor(gameW / 0.55);
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.style.width = `${gameW}px`;
    this.canvas.style.height = `${gameH}px`;
    this.canvas.width = Math.floor(gameW * dpr);
    this.canvas.height = Math.floor(gameH * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const minDim = Math.min(gameW, gameH);
    const scale = Math.max(0.62, Math.min(1.4, minDim / 450));
    const pad = Math.round(14 * scale);
    const headerH = Math.round(62 * scale);

    this.layout = {
      width: gameW,
      height: gameH,
      dpr,
      scale,
      unit: Math.round(minDim / 10),
      pad,
      headerH,
      playTop: headerH + pad,
      playH: Math.max(150, gameH - headerH - pad * 2),
      fontLg: Math.round(22 * scale),
      fontMd: Math.round(16 * scale),
      fontSm: Math.round(13 * scale)
    };

    this.relayoutActiveGame();
  }

  // ==================== OYUN BAŞLATMA VE ODA KURULUMU ====================
  startGameLevel(lvl, forcedModeId = null) {
    if (!this.gameMeta) return;
    this.levelNum = Math.max(1, Math.min(30, lvl));
    const modes = this.gameMeta.modes;
    const defaultMode = modes[(this.levelNum - 1) % modes.length].id;
    this.activeModeId = forcedModeId || defaultMode;

    this.stepProgress = 0;
    this.stepTarget = this.activeGameId === "tablet_tocalife" ? 5 : 4;
    this.particles = [];
    this.floatingLabels = [];
    document.getElementById("celebration-overlay")?.classList.add("hidden");

    this.showScreen("play-screen");
    this.renderTouchModeBar();

    // ÖNCE oyun verisini oluştur, SONRA ekran alanını hesapla ve yerleştir!
    this.setupTaskForActiveGame();
    this.calculateGameArea();
    this.updatePlayHUD();
    this.state = "PLAYING";
    this.renderGame();

    // Mobil Safari / iPhone ekran yerleşimi tamamlandıktan sonra yeniden ölçüm
    setTimeout(() => {
      if (this.state === "PLAYING") {
        this.calculateGameArea();
        this.renderGame();
      }
    }, 60);
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
        this.setupTaskForActiveGame();
        this.calculateGameArea();
        this.updatePlayHUD();
        this.renderGame();
      });
      wrap.appendChild(btn);
    });

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
    if (this.gs) this.gs.promptText = text;
    const instrEl = document.getElementById("touch-instruction-text");
    if (instrEl) instrEl.textContent = `👆 ${text}`;
    if (speakIt) KidsAudio.speak(text);
  }

  // ==================== 6 OYUN İÇİN GÖREV VE BİLEŞEN OLUŞTURMA ====================
  setupTaskForActiveGame() {
    const id = this.activeGameId;
    const mode = this.activeModeId;
    this.gs = this.createEmptyGameState(mode);

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
      const idx = (this.levelNum + this.stepProgress) % characters.length;
      const char = characters[idx];
      this.gs.hero = {
        ...this.gs.hero,
        emoji: char.emoji,
        name: char.name,
        mood: "normal",
        moodTimer: 0,
        characterIdx: idx,
        characters,
        smoothieColors: []
      };
      this.gs.items = TOCA_FOODS.map((f) => ({ ...f, x: 100, y: 200, r: 32 }));
      this.setPrompt(`${char.name} acıktı! Meyvelere, pizzaya veya dondurmaya dokunup ona yedir!`, this.stepProgress === 0);
    } else if (mode === "dressup") {
      this.gs.hero = {
        ...this.gs.hero,
        baseEmoji: "🧒",
        hat: "👑",
        costumeName: "Altın Taç",
        bodyColor: "#f59e0b",
        danceTimer: 0
      };
      this.gs.items = TOCA_COSTUMES.map((c) => ({ ...c, x: 100, y: 200, w: 110, h: 80 }));
      this.setPrompt("Kostüm ve şapkalara dokunarak karakterini giydir ve dans ettir!", this.stepProgress === 0);
    } else if (mode === "petcare") {
      const pets = [
        { emoji: "🐶", name: "Yavru Köpek Pamuk" },
        { emoji: "🐱", name: "Yavru Kedi Tarçın" },
        { emoji: "🐰", name: "Yavru Tavşan Kartopu" }
      ];
      const pet = pets[(this.levelNum + this.stepProgress) % pets.length];
      this.gs.hero = {
        ...this.gs.hero,
        emoji: pet.emoji,
        name: pet.name,
        activeTool: "soap",
        mudSpots: [
          { dx: -0.22, dy: -0.1, cleaned: false },
          { dx: 0.2, dy: -0.08, cleaned: false },
          { dx: -0.14, dy: 0.18, cleaned: false },
          { dx: 0.16, dy: 0.16, cleaned: false }
        ]
      };
      this.gs.items = [
        { id: "soap", emoji: "🧼", name: "Köpüklü Sabun", color: "#ec4899", x: 100, y: 300, w: 120, h: 52 },
        { id: "shower", emoji: "🚿", name: "Su Duşu", color: "#0ea5e9", x: 240, y: 300, w: 120, h: 52 },
        { id: "treat", emoji: "🦴", name: "Ödül Maması", color: "#f59e0b", x: 380, y: 300, w: 120, h: 52 }
      ];
      this.setPrompt(`${pet.name} bahçede çamur olmuş! Üzerindeki lekelere dokunarak köpükle yıka!`, this.stepProgress === 0);
    } else if (mode === "artparty") {
      const palette = ["#ec4899", "#f59e0b", "#22c55e", "#0ea5e9", "#8b5cf6", "#fb923c"];
      const balloons = [];
      for (let i = 0; i < 6; i++) {
        balloons.push({
          rx: 0.16 + (i / 5) * 0.68,
          ry: 0.38 + (i % 2) * 0.18,
          color: palette[i % 6],
          popped: false
        });
      }
      this.gs.extra = {
        ...this.gs.extra,
        paintDots: [],
        palette,
        stickers: ["🦄", "🌟", "🌈", "🦖", "🍓", "🚀"],
        balloons
      };
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
      this.gs.items = options.map((o) => ({ ...o, x: 50, y: 150, w: 120, h: 100 }));
      this.setPrompt(target.prompt, true);
    } else if (mode === "breathe") {
      this.gs.extra.poppedCount = 0;
      const colors = ["#0ea5e9", "#ec4899", "#f59e0b", "#22c55e"];
      this.gs.items = [0, 1, 2, 3].map((i) => ({
        num: i + 1,
        color: colors[i],
        popped: false,
        rx: 0.18 + i * 0.21,
        ry: 0.56 + (i % 2) * 0.1,
        x: 100 + i * 90,
        y: 240,
        r: 40
      }));
      this.setPrompt("Daniel ile derin bir nefes alalım! Balonlara 1, 2, 3, 4 diye dokunarak patlat!", true);
    } else if (mode === "sharing") {
      const friends = [
        { emoji: "🐯", name: "Daniel", count: 0, x: 120, y: 200, r: 45 },
        { emoji: "🐱", name: "Katerina", count: 0, x: 260, y: 200, r: 45 },
        { emoji: "🦉", name: "Baykuş O", count: 0, x: 400, y: 200, r: 45 }
      ];
      const treatEmoji = ["🧁", "🍓", "🍪", "🍎"][(this.levelNum + this.stepProgress) % 4];
      this.gs.targets = friends;
      this.gs.extra.treatEmoji = treatEmoji;
      this.gs.extra.remaining = 3;
      this.setPrompt(`Arkadaşlarla paylaşmak çok güzeldir! Her arkadaşa dokunarak birer ${treatEmoji} ikram et!`, true);
    }
  }

  // -------------------- 3. WILD KRATTS (PBS KIDS #2) --------------------
  setupWildKratts(mode) {
    const suitKey = WILD_KRATTS_ANIMALS[mode] ? mode : "cheetah";
    const info = WILD_KRATTS_ANIMALS[suitKey];
    this.gs.suit = info;
    this.gs.hero = {
      ...this.gs.hero,
      rx: 0.18,
      ry: suitKey === "cheetah" ? 0.72 : 0.52,
      vy: 0,
      onGround: true
    };
    this.gs.extra.rescued = 0;
    this.gs.extra.spawnTimer = 0.35;
    this.gs.items = [];
    this.setPrompt(`${info.name} aktif! Ekrana veya Zıpla tuşuna dokunarak yavru hayvanları (${info.babyEmoji}) kurtar!`, this.stepProgress === 0);
  }

  // -------------------- 4. CURIOUS GEORGE (PBS KIDS #3) --------------------
  setupCuriousGeorge(mode) {
    if (mode === "balloons") {
      const targetNum = ((this.levelNum + this.stepProgress - 1) % 7) + 2; // 2..8
      const palette = ["#ec4899", "#f59e0b", "#0ea5e9", "#22c55e", "#8b5cf6", "#fb923c"];
      this.gs.extra.collected = 0;
      this.gs.extra.targetNum = targetNum;
      this.gs.items = [];
      for (let i = 0; i < targetNum; i++) {
        this.gs.items.push({
          idx: i + 1,
          collected: false,
          color: palette[i % palette.length],
          rx: 0.18 + (i % 4) * 0.21,
          ry: 0.38 + Math.floor(i / 4) * 0.25,
          x: 100 + (i % 4) * 90,
          y: 220,
          r: 36
        });
      }
      this.setPrompt(`Meraklı George'a ${targetNum} tane balon verelim! Balonlara dokunup birlikte sayalım!`, true);
    } else if (mode === "baskets") {
      const baskets = [
        { id: "red", label: "KIRMIZI", emoji: "🍎", color: "#ef4444", x: 120, y: 300, w: 120, h: 110 },
        { id: "yellow", label: "SARI", emoji: "🍌", color: "#f59e0b", x: 260, y: 300, w: 120, h: 110 },
        { id: "green", label: "YEŞİL", emoji: "🍐", color: "#22c55e", x: 400, y: 300, w: 120, h: 110 }
      ];
      const current = baskets[(this.levelNum + this.stepProgress) % baskets.length];
      this.gs.target = current;
      this.gs.targets = baskets;
      this.setPrompt(`${current.emoji} hangi renk sepete gitmeli? ${current.label} sepete dokun!`, true);
    } else if (mode === "train") {
      const patterns = [
        { seq: ["🔴", "🔵", "🔴", "🔵"], ans: "🔴", opts: ["🔴", "🔵", "🟢"] },
        { seq: ["🍌", "🍎", "🍌", "🍎"], ans: "🍌", opts: ["🍌", "🍎", "🍇"] },
        { seq: ["⭐", "🌙", "⭐", "🌙"], ans: "⭐", opts: ["⭐", "🌙", "☀️"] },
        { seq: ["🟢", "🟡", "🟢", "🟡"], ans: "🟢", opts: ["🟢", "🟡", "🟣"] }
      ];
      const p = patterns[(this.levelNum + this.stepProgress) % patterns.length];
      this.gs.extra.seq = p.seq;
      this.gs.extra.ans = p.ans;
      this.gs.items = p.opts.map((o, idx) => ({ emoji: o, x: 120 + idx * 140, y: 320, r: 40 }));
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
      this.gs.items = opts.map((o, idx) => ({
        letter: o.letter,
        color: o.color,
        x: 100 + idx * 110,
        y: 300,
        r: 40
      }));
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
      this.gs.extra.seq = seq;
      this.gs.extra.nextIdx = 0;
      this.gs.items = seq.map((ch, idx) => ({
        letter: ch,
        idx,
        done: false,
        x: 80 + idx * 90,
        y: 260,
        w: 75,
        h: 90
      }));
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
      this.gs.extra.wordObj = w;
      this.gs.extra.collectedIdx = 0;
      this.gs.hero.rx = 0.16;
      this.gs.hero.ry = 0.55;
      this.gs.items = w.letters.map((ch, i) => ({
        letter: ch,
        idx: i,
        collected: false,
        rx: 0.36 + i * 0.16,
        ry: 0.38 + (i % 2) * 0.24,
        x: 200 + i * 90,
        y: 220,
        r: 36
      }));
      this.setPrompt(`Süper Roketle "${w.word}" kelimesinin harflerine sırayla dokunarak topla!`, true);
    }
  }

  // -------------------- 6. PEG + CAT (PBS KIDS #5) --------------------
  setupPegCat(mode) {
    if (mode === "pizza") {
      const targetShape = PEGCAT_SHAPES[(this.levelNum + this.stepProgress) % PEGCAT_SHAPES.length];
      this.gs.target = targetShape;
      this.gs.extra.placedCount = 0;
      this.gs.extra.neededCount = 3;
      this.gs.extra.toppingsOnPizza = [];
      this.gs.items = PEGCAT_SHAPES.map((s, idx) => ({
        ...s,
        x: 80 + idx * 90,
        y: 340,
        r: 34
      }));
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
      this.gs.extra.theme = th;
      this.gs.items = shuffled.map((s, idx) => ({
        ...s,
        emoji: th.emoji,
        x: 120 + idx * 140,
        y: 260,
        r: 52
      }));
      this.setPrompt(`Cat için ${targetSize.label} olan ${th.name} hangisi? Ona dokun!`, true);
    } else if (mode === "chickens") {
      const totalSeats = 5;
      const startChickens = ((this.levelNum + this.stepProgress) % 3) + 1;
      const needed = totalSeats - startChickens;
      this.gs.extra.totalSeats = totalSeats;
      this.gs.extra.currentChickens = startChickens;
      this.gs.extra.needed = needed;
      this.setPrompt(`Uzay roketinde ${totalSeats} koltuk var! ${startChickens} tavuk içeride. Roketi doldurmak için aşağıdaki tavuk butonuna ${needed} kez dokun!`, true);
    }
  }

  /**
   * Hesaplanan ekran alanına (this.layout) göre aktif oyunun tüm kart, buton ve nesne
   * koordinatlarını dinamik olarak yeniden boyutlandırır ve yerleştirir.
   */
  relayoutActiveGame() {
    if (!this.gs) return;
    const { width, height, pad, playTop, playH, scale } = this.layout;
    const id = this.activeGameId;
    const mode = this.activeModeId;
    const items = Array.isArray(this.gs.items) ? this.gs.items : [];
    const targets = Array.isArray(this.gs.targets) ? this.gs.targets : [];

    if (id === "tablet_tocalife") {
      if (mode === "kitchen" && items.length > 0) {
        const cols = 4;
        const rows = 2;
        const areaTop = playTop + playH * 0.5;
        const areaH = playH * 0.48;
        const cellW = (width - pad * 2) / cols;
        const cellH = areaH / rows;
        items.forEach((it, idx) => {
          const c = idx % cols;
          const r = Math.floor(idx / cols);
          it.x = pad + (c + 0.5) * cellW;
          it.y = areaTop + (r + 0.5) * cellH;
          it.r = Math.min(cellW, cellH) * 0.39;
        });
      } else if (mode === "dressup" && items.length > 0) {
        const cols = 3;
        const rows = 2;
        const areaTop = playTop + playH * 0.5;
        const areaH = playH * 0.48;
        const cellW = (width - pad * 2) / cols;
        const cellH = areaH / rows;
        items.forEach((it, idx) => {
          const c = idx % cols;
          const r = Math.floor(idx / cols);
          it.x = pad + (c + 0.5) * cellW;
          it.y = areaTop + (r + 0.5) * cellH;
          it.w = cellW * 0.88;
          it.h = cellH * 0.84;
        });
      } else if (mode === "petcare" && items.length > 0) {
        const count = items.length;
        const cellW = (width - pad * 2) / count;
        const btnY = height - pad - 32 * scale;
        items.forEach((it, idx) => {
          it.x = pad + (idx + 0.5) * cellW;
          it.y = btnY;
          it.w = cellW * 0.9;
          it.h = Math.max(44, 54 * scale);
        });
      }
    } else if (id === "pbs_daniel") {
      if (mode === "feelings" && items.length > 0) {
        const cols = 2;
        const rows = 2;
        const gridTop = playTop + playH * 0.3;
        const gridH = playH * 0.67;
        const cellW = (width - pad * 3) / cols;
        const cellH = (gridH - pad) / rows;
        items.forEach((it, idx) => {
          const c = idx % cols;
          const r = Math.floor(idx / cols);
          it.x = pad + c * (cellW + pad);
          it.y = gridTop + r * (cellH + pad * 0.6);
          it.w = cellW;
          it.h = cellH;
        });
      } else if (mode === "breathe" && items.length > 0) {
        items.forEach((it) => {
          it.x = it.rx * width;
          it.y = it.ry * height;
          it.r = Math.min(width, height) * 0.1;
        });
      } else if (mode === "sharing" && targets.length > 0) {
        const count = targets.length;
        const cellW = (width - pad * 2) / count;
        targets.forEach((t, i) => {
          t.x = pad + (i + 0.5) * cellW;
          t.y = playTop + playH * 0.42;
          t.r = Math.min(cellW * 0.38, playH * 0.25);
        });
      }
    } else if (id === "pbs_george") {
      if (mode === "balloons" && items.length > 0) {
        items.forEach((b) => {
          b.x = b.rx * width;
          b.y = b.ry * height;
          b.r = Math.min(width, height) * 0.085;
        });
      } else if (mode === "baskets" && targets.length > 0) {
        const count = targets.length;
        const cellW = (width - pad * 2) / count;
        targets.forEach((t, i) => {
          t.x = pad + (i + 0.5) * cellW;
          t.y = playTop + playH * 0.7;
          t.w = cellW * 0.88;
          t.h = playH * 0.38;
        });
      } else if (mode === "train" && items.length > 0) {
        const count = items.length;
        const cellW = (width - pad * 2) / count;
        items.forEach((it, i) => {
          it.x = pad + (i + 0.5) * cellW;
          it.y = playTop + playH * 0.74;
          it.r = Math.min(cellW * 0.36, playH * 0.19);
        });
      }
    } else if (id === "pbs_superwhy") {
      if (mode === "firstletter" && items.length > 0) {
        const count = items.length;
        const cellW = (width - pad * 2) / count;
        items.forEach((it, i) => {
          it.x = pad + (i + 0.5) * cellW;
          it.y = playTop + playH * 0.72;
          it.r = Math.min(cellW * 0.38, playH * 0.21);
        });
      } else if (mode === "alphabridge" && items.length > 0) {
        const count = items.length;
        const cellW = (width - pad * 2) / count;
        items.forEach((it, i) => {
          it.x = pad + (i + 0.5) * cellW;
          it.y = playTop + playH * 0.56;
          it.w = cellW * 0.86;
          it.h = playH * 0.3;
        });
      } else if (mode === "wordrocket" && items.length > 0) {
        items.forEach((it) => {
          it.x = it.rx * width;
          it.y = it.ry * height;
          it.r = Math.min(width, height) * 0.085;
        });
      }
    } else if (id === "pbs_pegcat") {
      if (mode === "pizza" && items.length > 0) {
        const count = items.length;
        const cellW = (width - pad * 2) / count;
        items.forEach((it, i) => {
          it.x = pad + (i + 0.5) * cellW;
          it.y = playTop + playH * 0.81;
          it.r = Math.min(cellW * 0.38, playH * 0.15);
        });
      } else if (mode === "sizes" && items.length > 0) {
        const count = items.length;
        const cellW = (width - pad * 2) / count;
        items.forEach((it, i) => {
          it.x = pad + (i + 0.5) * cellW;
          it.y = playTop + playH * 0.58;
          it.r = Math.min(cellW * 0.4, playH * 0.27);
        });
      }
    }
  }

  // ==================== DOKUNMATİK / FARE ETKİLEŞİMİ ====================
  handleCanvasTap(px, py) {
    if (this.state !== "PLAYING" || !this.gs) return;
    KidsAudio.init();
    const { width, height, playTop, playH, scale } = this.layout;
    const id = this.activeGameId;
    const mode = this.activeModeId;
    const items = Array.isArray(this.gs.items) ? this.gs.items : [];
    const targets = Array.isArray(this.gs.targets) ? this.gs.targets : [];

    // Üst bilgi kutusuna dokunulursa sesli yönergeyi tekrarla
    if (py < playTop) {
      KidsAudio.pop();
      KidsAudio.speak(this.gs.promptText || "");
      return;
    }

    if (id === "tablet_tocalife") {
      if (mode === "kitchen") {
        const charX = width * 0.5;
        const charY = playTop + playH * 0.24;
        const h = this.gs.hero;
        if (h && Array.isArray(h.characters) && Math.hypot(px - charX, py - charY) < 58 * scale) {
          h.characterIdx = (h.characterIdx + 1) % h.characters.length;
          const nextC = h.characters[h.characterIdx];
          h.emoji = nextC.emoji;
          h.name = nextC.name;
          KidsAudio.pop();
          KidsAudio.speak(`Merhaba! Ben ${h.name}!`);
          return;
        }
        for (const it of items) {
          if (Math.hypot(px - it.x, py - it.y) <= (it.r || 32) * 1.2) {
            KidsAudio.munch();
            h.mood = it.reaction;
            h.moodTimer = 2.0;
            h.smoothieColors.push(it.color);
            if (h.smoothieColors.length > 4) h.smoothieColors.shift();
            this.spawnBurst(charX, charY, it.color, 18);
            this.addFloatingText(charX, charY - 36, `${it.emoji} ${it.name}!`, "#db2777");
            KidsAudio.speak(it.msg);
            this.advanceStep(false);
            return;
          }
        }
      } else if (mode === "dressup") {
        for (const it of items) {
          if (Math.abs(px - it.x) <= (it.w || 100) * 0.5 && Math.abs(py - it.y) <= (it.h || 70) * 0.5) {
            KidsAudio.correct();
            this.gs.hero.hat = it.hat;
            this.gs.hero.costumeName = it.name;
            this.gs.hero.bodyColor = it.bodyColor;
            this.gs.hero.danceTimer = 2.2;
            this.spawnBurst(width * 0.5, playTop + playH * 0.24, it.bodyColor, 20);
            KidsAudio.speak(`Harika! ${it.name} çok yakıştı!`);
            this.advanceStep(false);
            return;
          }
        }
      } else if (mode === "petcare") {
        for (const it of items) {
          if (Math.abs(px - it.x) <= (it.w || 100) * 0.5 && Math.abs(py - it.y) <= (it.h || 50) * 0.55) {
            this.gs.hero.activeTool = it.id;
            KidsAudio.pop();
            KidsAudio.speak(it.name);
            if (it.id === "treat") {
              KidsAudio.munch();
              this.spawnBurst(width * 0.5, playTop + playH * 0.36, "#f59e0b", 20);
              this.advanceStep(false);
            }
            return;
          }
        }
        const petX = width * 0.5;
        const petY = playTop + playH * 0.36;
        const petR = Math.min(width, playH) * 0.24;
        let cleanedAny = false;
        const spots = Array.isArray(this.gs.hero?.mudSpots) ? this.gs.hero.mudSpots : [];
        spots.forEach((s) => {
          const sx = petX + s.dx * petR * 1.4;
          const sy = petY + s.dy * petR * 1.4;
          if (!s.cleaned && Math.hypot(px - sx, py - sy) < 58 * scale) {
            s.cleaned = true;
            cleanedAny = true;
            this.spawnBurst(sx, sy, "#0ea5e9", 14);
          }
        });
        if (cleanedAny) {
          KidsAudio.pop();
          if (spots.every((s) => s.cleaned)) {
            KidsAudio.correct();
            KidsAudio.speak("Tertemiz oldu! Aferin sana!");
            this.advanceStep(true);
          }
        }
      } else if (mode === "artparty") {
        const ex = this.gs.extra;
        const balloons = Array.isArray(ex?.balloons) ? ex.balloons : [];
        for (const b of balloons) {
          const bx = b.rx * width;
          const by = b.ry * height;
          if (!b.popped && Math.hypot(px - bx, py - by) < 46 * scale) {
            b.popped = true;
            KidsAudio.pop();
            this.spawnBurst(bx, by, b.color, 20);
            if (balloons.every((bl) => bl.popped)) {
              KidsAudio.correct();
              KidsAudio.speak("Bütün balonları patlattın! Harikasın!");
              this.advanceStep(true);
            }
            return;
          }
        }
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
        for (const it of items) {
          if (px >= it.x && px <= it.x + it.w && py >= it.y && py <= it.y + it.h) {
            if (this.gs.target && it.id === this.gs.target.id) {
              KidsAudio.correct();
              this.spawnBurst(it.x + it.w / 2, it.y + it.h / 2, it.color, 22);
              KidsAudio.speak(`Evet! ${it.label} yüz! Çok doğru buldun!`);
              this.advanceStep(true);
            } else {
              KidsAudio.gentleTryAgain();
              KidsAudio.speak(`Bu ${it.label} yüz. Tekrar bakalım!`);
            }
            return;
          }
        }
      } else if (mode === "breathe") {
        const nextNum = (this.gs.extra.poppedCount || 0) + 1;
        for (const it of items) {
          if (!it.popped && Math.hypot(px - it.x, py - it.y) <= (it.r || 40) * 1.25) {
            if (it.num === nextNum) {
              it.popped = true;
              this.gs.extra.poppedCount = nextNum;
              KidsAudio.pop();
              this.spawnBurst(it.x, it.y, it.color, 18);
              KidsAudio.speak(`${it.num}!`);
              if (nextNum >= 4) {
                setTimeout(() => {
                  KidsAudio.correct();
                  KidsAudio.speak("Harika nefes aldın! Şimdi çok sakin ve mutluyuz!");
                  this.advanceStep(true);
                }, 400);
              }
            } else {
              KidsAudio.speak(`Önce ${nextNum} numaralı balona dokunalım!`);
            }
            return;
          }
        }
      } else if (mode === "sharing") {
        for (const f of targets) {
          if (Math.hypot(px - f.x, py - f.y) <= (f.r || 45) * 1.25) {
            if (f.count === 0) {
              f.count = 1;
              this.gs.extra.remaining = Math.max(0, (this.gs.extra.remaining || 1) - 1);
              KidsAudio.pop();
              this.spawnBurst(f.x, f.y, "#f59e0b", 16);
              KidsAudio.speak(`Teşekkürler! ${f.name} çok sevindi!`);
              if (targets.every((t) => t.count > 0)) {
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
        for (const b of items) {
          if (!b.collected && Math.hypot(px - b.x, py - b.y) <= (b.r || 36) * 1.28) {
            b.collected = true;
            this.gs.extra.collected = (this.gs.extra.collected || 0) + 1;
            const cNum = this.gs.extra.collected;
            KidsAudio.pop();
            this.spawnBurst(b.x, b.y, b.color, 16);
            KidsAudio.speak(`${cNum}!`);
            if (cNum >= this.gs.extra.targetNum) {
              setTimeout(() => {
                KidsAudio.correct();
                KidsAudio.speak(`Aferin! Tam ${cNum} tane balon saydın!`);
                this.advanceStep(true);
              }, 400);
            }
            return;
          }
        }
      } else if (mode === "baskets") {
        for (const b of targets) {
          if (Math.abs(px - b.x) <= (b.w || 110) * 0.5 && Math.abs(py - b.y) <= (b.h || 100) * 0.55) {
            if (this.gs.target && b.id === this.gs.target.id) {
              KidsAudio.correct();
              this.spawnBurst(b.x, b.y, b.color, 22);
              KidsAudio.speak(`Harika! ${b.label} sepete koydun!`);
              this.advanceStep(true);
            } else {
              KidsAudio.gentleTryAgain();
              KidsAudio.speak(`Bu ${b.label} sepet. Tekrar deneyelim!`);
            }
            return;
          }
        }
      } else if (mode === "train") {
        for (const it of items) {
          if (Math.hypot(px - it.x, py - it.y) <= (it.r || 40) * 1.25) {
            if (it.emoji === this.gs.extra.ans) {
              KidsAudio.correct();
              this.spawnBurst(it.x, it.y, "#f59e0b", 22);
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
        for (const it of items) {
          if (Math.hypot(px - it.x, py - it.y) <= (it.r || 40) * 1.25) {
            if (this.gs.target && it.letter === this.gs.target.letter) {
              KidsAudio.correct();
              this.spawnBurst(it.x, it.y, it.color, 24);
              KidsAudio.speak(`Süpersin! ${this.gs.target.letter} harfi! ${this.gs.target.word}!`);
              this.advanceStep(true);
            } else {
              KidsAudio.gentleTryAgain();
              KidsAudio.speak(`Bu ${it.letter} harfi. Tekrar bakalım!`);
            }
            return;
          }
        }
      } else if (mode === "alphabridge") {
        const seq = this.gs.extra.seq || [];
        const expected = seq[this.gs.extra.nextIdx || 0];
        for (const it of items) {
          if (!it.done && Math.abs(px - it.x) <= (it.w || 70) * 0.5 && Math.abs(py - it.y) <= (it.h || 80) * 0.55) {
            if (it.letter === expected) {
              it.done = true;
              this.gs.extra.nextIdx++;
              KidsAudio.pop();
              this.spawnBurst(it.x, it.y, "#0ea5e9", 18);
              KidsAudio.speak(it.letter);
              if (this.gs.extra.nextIdx >= seq.length) {
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
        this.gs.hero.ry = Math.max(0.24, Math.min(0.84, py / height));
        const nextIdx = this.gs.extra.collectedIdx || 0;
        for (const it of items) {
          if (!it.collected && Math.hypot(px - it.x, py - it.y) <= (it.r || 36) * 1.35) {
            if (it.idx === nextIdx) {
              it.collected = true;
              this.gs.extra.collectedIdx = nextIdx + 1;
              KidsAudio.pop();
              this.spawnBurst(it.x, it.y, "#f59e0b", 18);
              KidsAudio.speak(it.letter);
              if (this.gs.extra.collectedIdx >= items.length) {
                setTimeout(() => {
                  KidsAudio.correct();
                  KidsAudio.speak(`Tebrikler! ${this.gs.extra.wordObj.word} kelimesini yazdın!`);
                  this.advanceStep(true);
                }, 400);
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
        for (const it of items) {
          if (Math.hypot(px - it.x, py - it.y) <= (it.r || 34) * 1.25) {
            if (this.gs.target && it.id === this.gs.target.id) {
              this.gs.extra.placedCount++;
              const angle = (this.gs.extra.placedCount / 3) * Math.PI * 2;
              this.gs.extra.toppingsOnPizza.push({
                shapeId: it.id,
                color: it.color,
                dx: Math.cos(angle) * 0.42,
                dy: Math.sin(angle) * 0.42
              });
              KidsAudio.pop();
              this.spawnBurst(width * 0.5, playTop + playH * 0.36, it.color, 18);
              KidsAudio.speak(`${this.gs.extra.placedCount} ${it.name}!`);
              if (this.gs.extra.placedCount >= this.gs.extra.neededCount) {
                setTimeout(() => {
                  KidsAudio.correct();
                  KidsAudio.speak("Harika! Şekilli pizza hazır!");
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
        for (const it of items) {
          if (Math.hypot(px - it.x, py - it.y) <= (it.r || 48) * 1.2) {
            if (this.gs.target && it.id === this.gs.target.id) {
              KidsAudio.correct();
              this.spawnBurst(it.x, it.y, "#22c55e", 22);
              KidsAudio.speak(`Evet! ${it.label} olanı buldun!`);
              this.advanceStep(true);
            } else {
              KidsAudio.gentleTryAgain();
              KidsAudio.speak(`Bu ${it.label}. Tekrar bakalım!`);
            }
            return;
          }
        }
      } else if (mode === "chickens") {
        const ex = this.gs.extra;
        if (py > playTop + playH * 0.48 && ex.currentChickens < ex.totalSeats) {
          ex.currentChickens++;
          KidsAudio.pop();
          this.spawnBurst(width * 0.5, playTop + playH * 0.34, "#f59e0b", 16);
          KidsAudio.speak(`${ex.currentChickens}!`);
          if (ex.currentChickens >= ex.totalSeats) {
            setTimeout(() => {
              KidsAudio.correct();
              KidsAudio.speak("5, 4, 3, 2, 1, Fırlat! Tüm uzay tavukları rokete bindi!");
              this.advanceStep(true);
            }, 400);
          }
        }
      }
    }
  }

  triggerHeroJumpOrMove(px, py) {
    if (this.activeGameId !== "pbs_wildkratts" || !this.gs?.hero) return;
    const h = this.gs.hero;
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
      }, 600);
    }
  }

  completeStage() {
    this.state = "CELEBRATION";
    KidsAudio.fanfare();

    const gId = this.activeGameId;
    if (!this.save.starsByGame[gId]) this.save.starsByGame[gId] = {};
    this.save.starsByGame[gId][this.levelNum] = 3;
    this.save.totalStars = (this.save.totalStars || 0) + 3;

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
    if (this.activeGameId === "pbs_wildkratts" && this.gs?.suit) {
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
    KidsAudio.speak("Harikasın! Aşamayı başarıyla tamamladın ve üç yıldız kazandın!");
  }

  // ==================== OYUN DÖNGÜSÜ VE ÇİZİM (RENDER) ====================
  loop(now) {
    requestAnimationFrame((t) => this.loop(t));
    const dt = Math.min(0.05, Math.max(0.001, (now - this.lastFrame) / 1000));
    this.lastFrame = now;
    this.animTime += dt;

    if (this.state === "PLAYING" && this.ctx) {
      try {
        this.updateGame(dt);
        this.renderGame();
      } catch (err) {
        console.error("Render warning:", err);
      }
    }
  }

  updateGame(dt) {
    if (this.hintTimer > 0) this.hintTimer = Math.max(0, this.hintTimer - dt);

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

    const h = this.gs?.hero;
    if (h && h.moodTimer > 0) {
      h.moodTimer = Math.max(0, h.moodTimer - dt);
      if (h.moodTimer === 0) h.mood = "normal";
    }
    if (h && h.danceTimer > 0) {
      h.danceTimer = Math.max(0, h.danceTimer - dt);
    }

    // Wild Kratts gerçek zamanlı hareket güncellemesi
    if (this.activeGameId === "pbs_wildkratts" && h && this.gs?.extra) {
      const ex = this.gs.extra;
      const suit = this.gs.suit || WILD_KRATTS_ANIMALS.cheetah;
      ex.scrollX += dt * 150;

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
          emoji: isBaby ? suit.babyEmoji : suit.obsEmoji,
          rx: 1.06,
          ry: this.activeModeId === "cheetah" ? (isBaby ? 0.56 : 0.73) : 0.3 + Math.random() * 0.48
        });
      }

      for (let i = this.gs.items.length - 1; i >= 0; i--) {
        const it = this.gs.items[i];
        it.rx -= dt * 0.35;
        const dist = Math.hypot((it.rx - h.rx) * this.layout.width, (it.ry - h.ry) * this.layout.height);
        if (dist < 48 * this.layout.scale) {
          if (it.kind === "baby") {
            KidsAudio.correct();
            this.spawnBurst(it.rx * this.layout.width, it.ry * this.layout.height, "#22c55e", 18);
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
    if (!ctx || !this.gs) return;
    const { width, height, pad, headerH, scale, fontLg } = this.layout;
    ctx.clearRect(0, 0, width, height);

    // Sevimli Gündüz Gökyüzü + Yeşil Çimenlik Arka Planı
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
    skyGrad.addColorStop(0, "#bae6fd");
    skyGrad.addColorStop(0.62, "#fef9c3");
    skyGrad.addColorStop(1, "#bbf7d0");
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height);

    // Sevimli güneş ve bulutlar
    ctx.font = `${Math.round(32 * scale)}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("☀️", width - 38 * scale, headerH + 26 * scale);
    ctx.fillText("☁️", 42 * scale, headerH + 24 * scale);

    // Üst Yönerge Kutusu (Parlak Beyaz & Sarı Çerçeveli)
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = this.gameMeta ? this.gameMeta.color : "#f59e0b";
    ctx.lineWidth = 3;
    this.roundRect(ctx, pad, pad * 0.55, width - pad * 2, headerH - pad * 0.35, 16, true, true);

    ctx.fillStyle = "#1e293b";
    ctx.font = `900 ${Math.max(12, Math.round(14 * scale))}px 'Nunito', 'Segoe UI', sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const promptStr = `🗣️ ${this.gs.promptText || ""}`;
    this.drawWrappedText(ctx, promptStr, width / 2, pad * 0.55 + (headerH - pad * 0.35) / 2, width - pad * 4, Math.round(17 * scale));

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
    const h = this.gs?.hero || {};
    const items = Array.isArray(this.gs?.items) ? this.gs.items : [];

    if (mode === "kitchen") {
      const cx = width * 0.5;
      const cy = playTop + playH * 0.24;
      const r = Math.min(width, playH) * 0.17;

      // Mutfak Karakter Dairesi
      ctx.fillStyle = "#fff1f2";
      ctx.strokeStyle = "#ec4899";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      const bounce = (h.moodTimer || 0) > 0 ? Math.sin(this.animTime * 14) * 6 : 0;
      ctx.font = `${Math.round(r * 1.15)}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(h.emoji || "👧", cx, cy + bounce);

      const moodBadge = h.mood === "love" ? "😍😋" : h.mood === "excited" ? "🤩🎉" : h.mood === "sour" ? "😖🍋" : h.mood === "strong" ? "💪😄" : "😋";
      ctx.font = `${Math.round(26 * scale)}px sans-serif`;
      ctx.fillText(moodBadge, cx + r * 0.85, cy - r * 0.65);

      // Smoothie Bardağı
      const cupX = width * 0.82;
      const cupY = cy;
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 3;
      this.roundRect(ctx, cupX - 24 * scale, cupY - 34 * scale, 48 * scale, 68 * scale, 12, true, true);
      (h.smoothieColors || []).forEach((col, idx) => {
        ctx.fillStyle = col;
        ctx.fillRect(cupX - 20 * scale, cupY + (18 - idx * 14) * scale, 40 * scale, 13 * scale);
      });

      // Yiyecek Kartları
      for (const it of items) {
        const ir = it.r || 32;
        ctx.fillStyle = "#ffffff";
        ctx.strokeStyle = it.color || "#f59e0b";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(it.x, it.y, ir, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.font = `${Math.round(ir * 0.95)}px sans-serif`;
        ctx.fillText(it.emoji, it.x, it.y - 5 * scale);
        ctx.fillStyle = "#1e293b";
        ctx.font = `900 ${Math.round(11 * scale)}px sans-serif`;
        ctx.fillText(it.name, it.x, it.y + ir * 0.72);
      }
    } else if (mode === "dressup") {
      const cx = width * 0.5;
      const cy = playTop + playH * 0.24;
      const danceX = (h.danceTimer || 0) > 0 ? Math.sin(this.animTime * 12) * 14 : 0;

      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = h.bodyColor || "#f59e0b";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(cx + danceX, cy, Math.min(width, playH) * 0.17, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.font = `${Math.round(54 * scale)}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(h.baseEmoji || "🧒", cx + danceX, cy + 10 * scale);
      ctx.font = `${Math.round(38 * scale)}px sans-serif`;
      ctx.fillText(h.hat || "👑", cx + danceX, cy - 32 * scale);

      for (const it of items) {
        const iw = it.w || 100;
        const ih = it.h || 70;
        ctx.fillStyle = "#ffffff";
        ctx.strokeStyle = it.bodyColor || "#ec4899";
        ctx.lineWidth = 3;
        this.roundRect(ctx, it.x - iw / 2, it.y - ih / 2, iw, ih, 16, true, true);
        ctx.font = `${Math.round(28 * scale)}px sans-serif`;
        ctx.fillText(it.emoji, it.x, it.y - 8 * scale);
        ctx.fillStyle = "#1e293b";
        ctx.font = `900 ${Math.round(12 * scale)}px sans-serif`;
        ctx.fillText(it.name, it.x, it.y + ih * 0.3);
      }
    } else if (mode === "petcare") {
      const cx = width * 0.5;
      const cy = playTop + playH * 0.36;
      const petR = Math.min(width, playH) * 0.23;

      ctx.fillStyle = "#e0f2fe";
      ctx.strokeStyle = "#0ea5e9";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(cx, cy, petR, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.font = `${Math.round(petR * 1.15)}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(h.emoji || "🐶", cx, cy);

      (h.mudSpots || []).forEach((s) => {
        const sx = cx + s.dx * petR * 1.4;
        const sy = cy + s.dy * petR * 1.4;
        if (!s.cleaned) {
          ctx.fillStyle = "#b45309";
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 2.5;
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

      for (const it of items) {
        const iw = it.w || 110;
        const ih = it.h || 50;
        const active = h.activeTool === it.id;
        ctx.fillStyle = active ? "#fef9c3" : "#ffffff";
        ctx.strokeStyle = it.color || "#0ea5e9";
        ctx.lineWidth = active ? 4 : 2.5;
        this.roundRect(ctx, it.x - iw / 2, it.y - ih / 2, iw, ih, 16, true, true);
        ctx.fillStyle = "#1e293b";
        ctx.font = `900 ${Math.round(13 * scale)}px sans-serif`;
        ctx.fillText(`${it.emoji} ${it.name}`, it.x, it.y);
      }
    } else if (mode === "artparty") {
      const ex = this.gs.extra || {};
      for (const d of ex.paintDots || []) {
        ctx.fillStyle = d.color;
        ctx.beginPath();
        ctx.arc(d.x, d.y, 24 * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = `${Math.round(26 * scale)}px sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText(d.sticker, d.x, d.y + 4);
      }
      for (const b of ex.balloons || []) {
        if (b.popped) continue;
        const bx = b.rx * width;
        const by = b.ry * height + Math.sin(this.animTime * 3 + b.rx * 10) * 8;
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.arc(bx, by, 34 * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.font = `${Math.round(24 * scale)}px sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText("🎈", bx, by);
      }
    }
  }

  // -------------------- RENDER: DANIEL TIGER --------------------
  renderDanielTiger(ctx) {
    const { width, playTop, playH, scale } = this.layout;
    const mode = this.activeModeId;
    const items = Array.isArray(this.gs?.items) ? this.gs.items : [];
    const targets = Array.isArray(this.gs?.targets) ? this.gs.targets : [];

    if (mode === "feelings") {
      const cx = width * 0.5;
      const cy = playTop + playH * 0.14;
      ctx.font = `${Math.round(46 * scale)}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`🐯 ${this.gs.target ? this.gs.target.emoji : "😊"}`, cx, cy);

      for (const it of items) {
        const isHint = this.hintTimer > 0 && this.gs.target && it.id === this.gs.target.id;
        ctx.fillStyle = isHint ? "#fef9c3" : "#ffffff";
        ctx.strokeStyle = it.color || "#fb923c";
        ctx.lineWidth = isHint ? 5 : 3.5;
        this.roundRect(ctx, it.x, it.y, it.w, it.h, 20, true, true);

        ctx.font = `${Math.round(it.h * 0.46)}px sans-serif`;
        ctx.fillText(it.emoji, it.x + it.w / 2, it.y + it.h * 0.42);
        ctx.fillStyle = "#1e293b";
        ctx.font = `900 ${Math.round(15 * scale)}px sans-serif`;
        ctx.fillText(it.label, it.x + it.w / 2, it.y + it.h * 0.82);
      }
    } else if (mode === "breathe") {
      ctx.font = `${Math.round(52 * scale)}px sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText("🐯 🌈", width * 0.5, playTop + playH * 0.2);

      for (const it of items) {
        if (it.popped) continue;
        const floatY = it.y + Math.sin(this.animTime * 3 + it.num) * 8;
        ctx.fillStyle = it.color;
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(it.x, floatY, it.r || 40, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#ffffff";
        ctx.font = `900 ${Math.round((it.r || 40) * 0.85)}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(it.num, it.x, floatY);
      }
    } else if (mode === "sharing") {
      const treat = this.gs.extra?.treatEmoji || "🧁";
      for (const f of targets) {
        const fr = f.r || 45;
        ctx.fillStyle = f.count > 0 ? "#dcfce7" : "#ffffff";
        ctx.strokeStyle = f.count > 0 ? "#22c55e" : "#f59e0b";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(f.x, f.y, fr, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.font = `${Math.round(fr * 0.9)}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(f.emoji, f.x, f.y - 6 * scale);
        ctx.fillStyle = "#1e293b";
        ctx.font = `900 ${Math.round(13 * scale)}px sans-serif`;
        ctx.fillText(f.name, f.x, f.y + fr * 0.72);

        if (f.count > 0) {
          ctx.font = `${Math.round(32 * scale)}px sans-serif`;
          ctx.fillText(treat, f.x, f.y + fr * 1.25);
        }
      }
      ctx.font = `900 ${Math.round(18 * scale)}px sans-serif`;
      ctx.fillStyle = "#b45309";
      ctx.fillText(`Tepsideki İkramlar: ${treat.repeat(Math.max(0, this.gs.extra?.remaining || 0))}`, width * 0.5, playTop + playH * 0.86);
    }
  }

  // -------------------- RENDER: WILD KRATTS --------------------
  renderWildKratts(ctx) {
    const { width, height, playTop, scale } = this.layout;
    const suit = this.gs?.suit || WILD_KRATTS_ANIMALS.cheetah;
    const h = this.gs?.hero || { rx: 0.18, ry: 0.72 };
    const items = Array.isArray(this.gs?.items) ? this.gs.items : [];

    // Doğa arka planı (Aydınlık ve sevimli)
    const bg = ctx.createLinearGradient(0, playTop, 0, height);
    if (this.activeModeId === "dolphin") {
      bg.addColorStop(0, "#7dd3fc");
      bg.addColorStop(1, "#0284c7");
    } else if (this.activeModeId === "eagle") {
      bg.addColorStop(0, "#bae6fd");
      bg.addColorStop(1, "#fef9c3");
    } else {
      bg.addColorStop(0, "#fef08a");
      bg.addColorStop(1, "#bbf7d0");
    }
    ctx.fillStyle = bg;
    ctx.fillRect(0, playTop, width, height - playTop);

    if (this.activeModeId === "cheetah") {
      ctx.fillStyle = "#4ade80";
      ctx.fillRect(0, height * 0.79, width, height * 0.21);
    }

    const hx = h.rx * width;
    const hy = h.ry * height;
    ctx.font = `${Math.round(48 * scale)}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(suit.heroEmoji, hx, hy);

    for (const it of items) {
      const ix = it.rx * width;
      const iy = it.ry * height;
      ctx.fillStyle = it.kind === "baby" ? "#ffffff" : "#fee2e2";
      ctx.strokeStyle = it.kind === "baby" ? "#22c55e" : "#ef4444";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(ix, iy, 28 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.font = `${Math.round(32 * scale)}px sans-serif`;
      ctx.fillText(it.emoji, ix, iy);
    }
  }

  // -------------------- RENDER: CURIOUS GEORGE --------------------
  renderCuriousGeorge(ctx) {
    const { width, playTop, playH, scale } = this.layout;
    const mode = this.activeModeId;
    const items = Array.isArray(this.gs?.items) ? this.gs.items : [];
    const targets = Array.isArray(this.gs?.targets) ? this.gs.targets : [];

    if (mode === "balloons") {
      ctx.fillStyle = "#1e293b";
      ctx.font = `900 ${Math.round(32 * scale)}px sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(`🐵 🎈 ${this.gs.extra?.collected || 0} / ${this.gs.extra?.targetNum || 4}`, width * 0.5, playTop + playH * 0.14);

      for (const b of items) {
        if (b.collected) continue;
        const br = b.r || 36;
        const fy = b.y + Math.sin(this.animTime * 3 + b.idx) * 6;
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.arc(b.x, fy, br, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.font = `${Math.round(br * 0.9)}px sans-serif`;
        ctx.textBaseline = "middle";
        ctx.fillText("🎈", b.x, fy);
      }
    } else if (mode === "baskets") {
      const cur = this.gs?.target || { emoji: "🍎", color: "#ef4444" };
      const cx = width * 0.5;
      const cy = playTop + playH * 0.24;
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = cur.color;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(cx, cy, 52 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.font = `${Math.round(56 * scale)}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(cur.emoji, cx, cy);

      for (const b of targets) {
        const bw = b.w || 110;
        const bh = b.h || 100;
        ctx.fillStyle = "#ffffff";
        ctx.strokeStyle = b.color;
        ctx.lineWidth = 4;
        this.roundRect(ctx, b.x - bw / 2, b.y - bh / 2, bw, bh, 18, true, true);
        ctx.font = `${Math.round(36 * scale)}px sans-serif`;
        ctx.fillText(`🧺 ${b.emoji}`, b.x, b.y - 10 * scale);
        ctx.fillStyle = "#1e293b";
        ctx.font = `900 ${Math.round(14 * scale)}px sans-serif`;
        ctx.fillText(b.label, b.x, b.y + bh * 0.3);
      }
    } else if (mode === "train") {
      const seq = this.gs.extra?.seq || ["🔴", "🔵", "🔴", "🔵"];
      const totalCars = seq.length + 1;
      const carW = Math.min(78 * scale, (width - 40) / totalCars);
      const startX = (width - totalCars * carW) / 2;
      const trainY = playTop + playH * 0.32;

      for (let i = 0; i < totalCars; i++) {
        const cx = startX + (i + 0.5) * carW;
        ctx.fillStyle = i === seq.length ? "#fef9c3" : "#ffffff";
        ctx.strokeStyle = i === seq.length ? "#f59e0b" : "#0ea5e9";
        ctx.lineWidth = 3.5;
        this.roundRect(ctx, cx - carW * 0.44, trainY - 36 * scale, carW * 0.88, 72 * scale, 14, true, true);
        ctx.font = `${Math.round(32 * scale)}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(i < seq.length ? seq[i] : "❓", cx, trainY);
      }

      for (const it of items) {
        const ir = it.r || 40;
        ctx.fillStyle = "#ffffff";
        ctx.strokeStyle = "#f59e0b";
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(it.x, it.y, ir, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.font = `${Math.round(ir * 0.95)}px sans-serif`;
        ctx.fillText(it.emoji, it.x, it.y);
      }
    }
  }

  // -------------------- RENDER: SUPER WHY! --------------------
  renderSuperWhy(ctx) {
    const { width, playTop, playH, scale } = this.layout;
    const mode = this.activeModeId;
    const items = Array.isArray(this.gs?.items) ? this.gs.items : [];

    if (mode === "firstletter") {
      const t = this.gs?.target || SUPERWHY_WORDS[0];
      const cx = width * 0.5;
      const cy = playTop + playH * 0.27;
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = "#0ea5e9";
      ctx.lineWidth = 4;
      this.roundRect(ctx, cx - 125 * scale, cy - 55 * scale, 250 * scale, 110 * scale, 22, true, true);

      ctx.font = `${Math.round(52 * scale)}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(t.emoji, cx - 52 * scale, cy);
      ctx.fillStyle = "#db2777";
      ctx.font = `900 ${Math.round(26 * scale)}px sans-serif`;
      ctx.fillText(t.word, cx + 38 * scale, cy);

      for (const it of items) {
        const ir = it.r || 40;
        const isHint = this.hintTimer > 0 && it.letter === t.letter;
        ctx.fillStyle = isHint ? "#fef9c3" : "#ffffff";
        ctx.strokeStyle = isHint ? "#ec4899" : "#38bdf8";
        ctx.lineWidth = isHint ? 5 : 4;
        ctx.beginPath();
        ctx.arc(it.x, it.y, ir, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#0369a1";
        ctx.font = `900 ${Math.round(ir * 0.95)}px sans-serif`;
        ctx.fillText(it.letter, it.x, it.y);
      }
    } else if (mode === "alphabridge") {
      ctx.font = `${Math.round(44 * scale)}px sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText("🐷 🌈 🏰", width * 0.5, playTop + playH * 0.18);

      for (const it of items) {
        const iw = it.w || 70;
        const ih = it.h || 85;
        ctx.fillStyle = it.done ? "#dcfce7" : "#ffffff";
        ctx.strokeStyle = it.done ? "#22c55e" : "#0ea5e9";
        ctx.lineWidth = 4;
        this.roundRect(ctx, it.x - iw / 2, it.y - ih / 2, iw, ih, 18, true, true);
        ctx.fillStyle = "#1e293b";
        ctx.font = `900 ${Math.round(30 * scale)}px sans-serif`;
        ctx.textBaseline = "middle";
        ctx.fillText(it.letter, it.x, it.y);
      }
    } else if (mode === "wordrocket") {
      const wObj = this.gs.extra?.wordObj || { word: "ELMA", emoji: "🍎" };
      ctx.font = `900 ${Math.round(24 * scale)}px sans-serif`;
      ctx.fillStyle = "#db2777";
      ctx.textAlign = "center";
      ctx.fillText(`${wObj.emoji} HEDEF KELİME: ${wObj.word}`, width * 0.5, playTop + 22 * scale);

      const hx = (this.gs.hero?.rx || 0.16) * width;
      const hy = (this.gs.hero?.ry || 0.55) * this.layout.height;
      ctx.font = `${Math.round(48 * scale)}px sans-serif`;
      ctx.fillText("🚀", hx, hy);

      for (const it of items) {
        if (it.collected) continue;
        const ir = it.r || 36;
        ctx.fillStyle = "#fef9c3";
        ctx.strokeStyle = "#f59e0b";
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(it.x, it.y, ir, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#1e293b";
        ctx.font = `900 ${Math.round(ir * 0.9)}px sans-serif`;
        ctx.textBaseline = "middle";
        ctx.fillText(it.letter, it.x, it.y);
      }
    }
  }

  // -------------------- RENDER: PEG + CAT --------------------
  renderPegCat(ctx) {
    const { width, playTop, playH, scale } = this.layout;
    const mode = this.activeModeId;
    const items = Array.isArray(this.gs?.items) ? this.gs.items : [];

    if (mode === "pizza") {
      const px = width * 0.5;
      const py = playTop + playH * 0.35;
      const pr = Math.min(width, playH) * 0.24;

      ctx.fillStyle = "#f59e0b";
      ctx.beginPath();
      ctx.arc(px, py, pr, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fef08a";
      ctx.beginPath();
      ctx.arc(px, py, pr * 0.84, 0, Math.PI * 2);
      ctx.fill();

      for (const top of this.gs.extra?.toppingsOnPizza || []) {
        this.drawGeometricShape(ctx, top.shapeId, px + top.dx * pr, py + top.dy * pr, pr * 0.22, top.color);
      }

      for (const it of items) {
        const ir = it.r || 34;
        ctx.fillStyle = "#ffffff";
        ctx.strokeStyle = it.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(it.x, it.y, ir, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        this.drawGeometricShape(ctx, it.id, it.x, it.y - 4 * scale, ir * 0.52, it.color);
        ctx.fillStyle = "#1e293b";
        ctx.font = `900 ${Math.round(11 * scale)}px sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText(it.name, it.x, it.y + ir * 0.75);
      }
    } else if (mode === "sizes") {
      for (const it of items) {
        const ir = it.r || 48;
        ctx.fillStyle = "#ffffff";
        ctx.strokeStyle = "#8b5cf6";
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(it.x, it.y, ir, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.font = `${Math.round(36 * scale * (it.scale || 1))}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(it.emoji, it.x, it.y - 8 * scale);

        ctx.fillStyle = "#1e293b";
        ctx.font = `900 ${Math.round(12 * scale)}px sans-serif`;
        ctx.fillText(it.label, it.x, it.y + ir * 0.72);
      }
    } else if (mode === "chickens") {
      const ex = this.gs.extra || { totalSeats: 5, currentChickens: 2 };
      const slotW = Math.min(68 * scale, (width - 40) / ex.totalSeats);
      const startX = (width - ex.totalSeats * slotW) / 2;
      const rocketY = playTop + playH * 0.32;

      for (let i = 0; i < ex.totalSeats; i++) {
        const sx = startX + (i + 0.5) * slotW;
        const filled = i < ex.currentChickens;
        ctx.fillStyle = filled ? "#dcfce7" : "#ffffff";
        ctx.strokeStyle = filled ? "#22c55e" : "#0ea5e9";
        ctx.lineWidth = 3.5;
        this.roundRect(ctx, sx - slotW * 0.44, rocketY - 36 * scale, slotW * 0.88, 72 * scale, 16, true, true);
        ctx.fillStyle = "#1e293b";
        ctx.font = `900 ${Math.round(30 * scale)}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(filled ? "🐔" : `${i + 1}`, sx, rocketY);
      }

      const btnY = playTop + playH * 0.74;
      ctx.fillStyle = "#fef9c3";
      ctx.strokeStyle = "#f59e0b";
      ctx.lineWidth = 4;
      this.roundRect(ctx, width * 0.18, btnY - 38 * scale, width * 0.64, 76 * scale, 22, true, true);
      ctx.fillStyle = "#b45309";
      ctx.font = `900 ${Math.round(18 * scale)}px sans-serif`;
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

  // Tüm iOS Safari (iPhone/iPad) ve tarayıcılarla %100 uyumlu yuvarlatılmış dikdörtgen çizimi
  roundRect(ctx, x, y, w, h, r, fill = true, stroke = false) {
    const radius = Math.max(0, Math.min(r, w / 2, h / 2));
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
  }

  drawWrappedText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = String(text || "").split(" ");
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

  addFloatingText(x, y, text, color = "#db2777") {
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
      if (this.state === "PLAYING") {
        this.calculateGameArea();
        this.renderGame();
      }
    });

    document.querySelectorAll(".cat-tab").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".cat-tab").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        this.activeCategory = btn.dataset.cat || "all";
        KidsAudio.pop();
        this.renderHubGames();
      });
    });

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
      KidsAudio.speak(this.gs?.promptText || "");
    });

    document.getElementById("btn-kid-hint")?.addEventListener("click", () => {
      this.hintTimer = 3.0;
      KidsAudio.pop();
      KidsAudio.speak(this.gs?.promptText || "Parlayan seçeneğe dokun!");
    });
    document.getElementById("btn-kid-next-task")?.addEventListener("click", () => {
      KidsAudio.pop();
      this.setupTaskForActiveGame();
      this.calculateGameArea();
      this.renderGame();
    });

    document.getElementById("td-up")?.addEventListener("pointerdown", () => {
      if (this.activeGameId === "pbs_wildkratts") {
        this.triggerHeroJumpOrMove();
      } else if (this.gs?.hero) {
        this.gs.hero.ry = Math.max(0.24, (this.gs.hero.ry || 0.5) - 0.12);
      }
    });
    document.getElementById("td-down")?.addEventListener("pointerdown", () => {
      if (this.gs?.hero && this.activeModeId !== "cheetah") {
        this.gs.hero.ry = Math.min(0.82, (this.gs.hero.ry || 0.5) + 0.12);
      }
    });
    document.getElementById("td-action")?.addEventListener("pointerdown", () => {
      this.triggerHeroJumpOrMove();
    });

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

    if (this.canvas) {
      this.canvas.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
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
