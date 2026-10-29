// ÇOCUK OYUNLARI DÜNYASI (3-6 YAŞ) - TAM EKRAN İNTERAKTİF SAHNE & OYUN MOTORU
// KURAL GEREĞİ: Her yeni oyun, kullanılan cihazın ekranına göre oyun alanını hesaplar (calculateGameArea)
// ve tüm oyun bileşenlerini bu alana tam sığacak şekilde boyutlandırır.

class KidsGamesPortal {
  constructor() {
    this.stageEl = document.getElementById("game-stage");
    this.fxCanvas = document.getElementById("fx-canvas");
    this.fxCtx = this.fxCanvas ? this.fxCanvas.getContext("2d") : null;

    this.activeCategory = "all";
    this.activeGameId = "tablet_tocalife";
    this.gameMeta = KIDS_GAMES[0];
    this.activeModeId = "kitchen";
    this.levelNum = 1;
    this.state = "HUB"; // HUB, PLAYING

    this.stepProgress = 0;
    this.stepTarget = 4;

    this.layout = {
      width: window.innerWidth || 800,
      height: window.innerHeight || 600,
      usableW: 760,
      usableH: 520,
      scale: 1,
      heroImgSize: 96,
      cardHeight: 130,
      choiceImgSize: 68,
      fontSizeTitle: 18
    };

    this.particles = [];
    this.lastFrame = performance.now();
    this.gs = {};

    this.save = this.loadSave();
    this.initUI();
    this.bindEvents();
    requestAnimationFrame((t) => this.loop(t));
  }

  // ==================== KAYIT & VERSİYON YÖNETİMİ ====================
  loadSave() {
    try {
      const raw = localStorage.getItem("cocuk_oyunlari_3_6_save_v2");
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    const def = {
      totalStars: 15,
      unlockedStickers: ["s1", "s2", "s3", "s6"],
      starsByGame: {}
    };
    KIDS_GAMES.forEach((g) => {
      def.starsByGame[g.id] = {};
    });
    return def;
  }

  saveData() {
    try {
      localStorage.setItem("cocuk_oyunlari_3_6_save_v2", JSON.stringify(this.save));
    } catch (e) {}
  }

  initUI() {
    const verEl = document.getElementById("main-version-badge");
    if (verEl && typeof APP_VERSION !== "undefined") {
      verEl.textContent = APP_VERSION;
    }
    this.updateHeaderStats();
    this.renderHubGames();
  }

  updateHeaderStats() {
    const stars = this.save.totalStars || 0;
    const hubStars = document.getElementById("hub-total-stars");
    if (hubStars) hubStars.textContent = stars;
    const hudStars = document.getElementById("hud-stars");
    if (hudStars) hudStars.textContent = stars;

    const stCountEl = document.getElementById("hub-sticker-count");
    if (stCountEl) {
      const count = (this.save.unlockedStickers || []).length;
      stCountEl.textContent = `${count}/${STICKER_COLLECTION.length}`;
    }
  }

  // ==================== ANA MENÜ: 6 BÜYÜK RESİMLİ OYUN KARTI ====================
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
      card.className = "kid-game-card";
      card.style.borderColor = g.color;

      const gameStarsObj = (this.save.starsByGame && this.save.starsByGame[g.id]) || {};
      const earnedStars = Object.values(gameStarsObj).reduce((a, b) => a + b, 0);

      const sideImgs = (g.sideSvgs || [])
        .slice(0, 2)
        .map((s) => `<img src="${s}" alt="" class="kg-side-art" />`)
        .join("");

      const modeBtns = g.modes
        .map(
          (m, idx) => `
          <button class="kg-mode-btn" data-mode="${m.id}" data-lvl="${idx + 1}" title="${m.desc}">
            <img src="${m.svg}" alt="" />
            <span>${m.name}</span>
          </button>
        `
        )
        .join("");

      card.innerHTML = `
        <div>
          <div class="kg-illustration-banner" style="background:${g.bannerBg}">
            ${sideImgs ? `<img src="${g.sideSvgs[0]}" alt="" class="kg-side-art" />` : ""}
            <img src="${g.svg}" alt="${g.title}" class="kg-main-art" />
            ${g.sideSvgs && g.sideSvgs[1] ? `<img src="${g.sideSvgs[1]}" alt="" class="kg-side-art" />` : ""}
          </div>
          <div class="kg-badge-strip" style="margin-top:8px">
            <span class="kg-badge-pill" style="background:${g.color}">${g.badge}</span>
            <span class="kg-stars-pill">⭐ ${earnedStars}/90</span>
          </div>
          <h3 class="kg-card-title" style="margin-top:5px">${g.title}</h3>
        </div>
        <div class="kg-modes-mini">${modeBtns}</div>
        <button class="kg-big-play-btn" style="background:linear-gradient(135deg, ${g.color}, ${g.accent})">
          ▶️ HEMEN TAM EKRAN OYNA!
        </button>
      `;

      // Alt mod butonlarına doğrudan tıklama
      card.querySelectorAll(".kg-mode-btn").forEach((mBtn) => {
        mBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          KidsAudio.pop();
          this.launchGame(g.id, parseInt(mBtn.dataset.lvl || "1", 10), mBtn.dataset.mode);
        });
      });

      // Karta veya Hemen Oyna butonuna tıklama
      card.addEventListener("click", () => {
        KidsAudio.pop();
        this.launchGame(g.id, 1, g.modes[0].id);
      });

      grid.appendChild(card);
    });
  }

  showScreen(screenId) {
    document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
    const target = document.getElementById(screenId);
    if (target) target.classList.add("active");
  }

  /**
   * KURAL GEREĞİ: Kullanılan cihazın ekran boyutuna göre (telefon, tablet, laptop)
   * tam ekran oyun alanını hesaplar ve tüm oyun bileşenlerini bu alana sığdırır.
   */
  calculateGameArea() {
    const screenW = Math.max(320, window.innerWidth || 800);
    const screenH = Math.max(400, window.innerHeight || 600);

    if (this.fxCanvas && this.fxCtx) {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.fxCanvas.width = Math.floor(screenW * dpr);
      this.fxCanvas.height = Math.floor(screenH * dpr);
      this.fxCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    const isPortraitMobile = screenW < 640;
    const topReserved = isPortraitMobile ? 96 : 62;
    const bottomReserved = 18;
    const usableW = Math.max(290, screenW - 28);
    const usableH = Math.max(280, screenH - topReserved - bottomReserved);

    const minDim = Math.min(usableW, usableH);
    const scale = Math.max(0.68, Math.min(1.4, minDim / 500));

    this.layout = {
      width: screenW,
      height: screenH,
      usableW,
      usableH,
      isPortraitMobile,
      scale,
      heroImgSize: Math.round(Math.max(68, Math.min(140, usableH * 0.21))),
      cardHeight: Math.round(Math.max(88, Math.min(180, usableH * 0.26))),
      choiceImgSize: Math.round(Math.max(46, Math.min(96, usableH * 0.14))),
      fontSizeTitle: Math.round(Math.max(14, Math.min(22, 17 * scale)))
    };

    if (this.state === "PLAYING") {
      this.applyResponsiveSizesToStage();
    }
  }

  applyResponsiveSizesToStage() {
    if (!this.stageEl) return;
    const { usableW, usableH, heroImgSize, choiceImgSize, fontSizeTitle, isPortraitMobile } = this.layout;

    this.stageEl.querySelectorAll(".hero-mascot-img").forEach((img) => {
      img.style.width = `${heroImgSize}px`;
      img.style.height = `${heroImgSize}px`;
    });

    this.stageEl.querySelectorAll(".choice-art").forEach((img) => {
      const customScale = parseFloat(img.dataset.scale || "1");
      const sz = Math.round(choiceImgSize * customScale);
      img.style.width = `${sz}px`;
      img.style.height = `${sz}px`;
    });

    this.stageEl.querySelectorAll(".choice-title").forEach((el) => {
      el.style.fontSize = `${fontSizeTitle}px`;
    });

    const grid = this.stageEl.querySelector(".stage-choices-grid");
    if (grid) {
      const count = grid.children.length;
      let cols = count;
      if (count >= 7) cols = isPortraitMobile ? 2 : 4;
      else if (count === 6) cols = isPortraitMobile ? 2 : 3;
      else if (count === 5) cols = isPortraitMobile ? 3 : 5;
      else if (count === 4) cols = 2;
      else if (count <= 3) cols = count;

      const rows = Math.ceil(count / Math.max(1, cols));
      const maxGridH = Math.floor(usableH * 0.54);
      const cellH = Math.max(78, Math.min(175, Math.floor((maxGridH - (rows - 1) * 12) / Math.max(1, rows))));

      grid.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;
      grid.style.maxWidth = `${Math.min(1100, usableW)}px`;

      Array.from(grid.children).forEach((card) => {
        card.style.minHeight = `${cellH}px`;
      });
    }
  }

  // ==================== OYUN BAŞLATMA ====================
  launchGame(gameId, lvl = 1, forcedModeId = null) {
    this.activeGameId = gameId;
    this.gameMeta = KIDS_GAMES.find((g) => g.id === gameId) || KIDS_GAMES[0];
    this.levelNum = Math.max(1, Math.min(30, lvl));

    const modes = this.gameMeta.modes;
    const defaultMode = modes[(this.levelNum - 1) % modes.length].id;
    this.activeModeId = forcedModeId || defaultMode;

    this.stepProgress = 0;
    this.stepTarget = 4;
    this.state = "PLAYING";

    document.getElementById("rooms-modal")?.classList.add("hidden");
    document.getElementById("celebration-overlay")?.classList.add("hidden");

    this.showScreen("play-screen");
    this.calculateGameArea();
    this.buildStageForActiveGame();
    this.updateFloatingHUD();
  }

  updateFloatingHUD() {
    if (!this.gameMeta) return;
    const modeObj = this.gameMeta.modes.find((m) => m.id === this.activeModeId) || this.gameMeta.modes[0];
    const roomLabel = document.getElementById("float-room-label");
    if (roomLabel) {
      roomLabel.textContent = `${modeObj.name} (${this.levelNum}/30)`;
    }
    const stepEl = document.getElementById("hud-step");
    if (stepEl) {
      stepEl.textContent = `🎯 ${this.stepProgress}/${this.stepTarget}`;
    }
    this.updateHeaderStats();
  }

  setPrompt(text, voiceKey = null, speakNow = true) {
    this.gs.promptText = text;
    this.gs.voiceKey = voiceKey;
    const promptEl = document.getElementById("float-prompt-text");
    if (promptEl) promptEl.textContent = text;
    if (speakNow) {
      KidsAudio.speak(text, voiceKey);
    }
  }

  // ==================== 6 OYUN İÇİN TAM EKRAN GÖRSEL SAHNE OLUŞTURMA ====================
  buildStageForActiveGame() {
    if (!this.stageEl) return;
    const id = this.activeGameId;
    const mode = this.activeModeId;
    this.gs = { mode, promptText: "", voiceKey: null };

    if (id === "tablet_tocalife") {
      this.buildTocaStage(mode);
    } else if (id === "pbs_daniel") {
      this.buildDanielStage(mode);
    } else if (id === "pbs_wildkratts") {
      this.buildWildKrattsStage(mode);
    } else if (id === "pbs_george") {
      this.buildGeorgeStage(mode);
    } else if (id === "pbs_superwhy") {
      this.buildSuperWhyStage(mode);
    } else if (id === "pbs_pegcat") {
      this.buildPegCatStage(mode);
    }

    this.calculateGameArea();
  }

  // -------------------- 1. TOCA MİNİ DÜNYA --------------------
  buildTocaStage(mode) {
    if (mode === "kitchen") {
      const chars = [
        { svg: "assets/svg/girl.svg", name: "Mia" },
        { svg: "assets/svg/boy.svg", name: "Leo" },
        { svg: "assets/svg/cat.svg", name: "Minnoş Kedi" },
        { svg: "assets/svg/trex.svg", name: "Neşeli Dino" }
      ];
      const char = chars[(this.levelNum + this.stepProgress) % chars.length];
      this.setPrompt(`${char.name} acıktı! Aşağıdaki lezzetli yiyeceklere dokunup ona yedir!`, "toca_kitchen", this.stepProgress === 0);

      const cardsHtml = TOCA_FOODS.map(
        (f, idx) => `
        <div class="choice-card" data-idx="${idx}" style="border-color:${f.color}">
          <img src="${f.svg}" alt="${f.name}" class="choice-art" />
          <div class="choice-title">${f.name}</div>
        </div>
      `
      ).join("");

      this.stageEl.innerHTML = `
        <div class="stage-world theme-kitchen">
          <img src="assets/svg/sun.svg" alt="" class="scene-deco-sun" />
          <img src="assets/svg/cloud.svg" alt="" class="scene-deco-cloud" />
          <div class="stage-showcase">
            <div class="hero-mascot-box" id="toca-hero-box" title="Karakteri Değiştirmek İçin Dokun">
              <div style="display:flex;align-items:center;gap:14px">
                <img id="toca-hero-img" src="${char.svg}" alt="${char.name}" class="hero-mascot-img" />
                <img id="toca-reaction-img" src="assets/svg/yummy.svg" alt="" style="width:52px;height:52px" />
              </div>
              <div class="hero-mascot-label" id="toca-hero-label">🍽️ ${char.name} (Dokun: Değiştir)</div>
            </div>
          </div>
          <div class="stage-choices-grid">${cardsHtml}</div>
        </div>
      `;

      let curIdx = (this.levelNum + this.stepProgress) % chars.length;
      this.stageEl.querySelector("#toca-hero-box")?.addEventListener("click", () => {
        curIdx = (curIdx + 1) % chars.length;
        const c = chars[curIdx];
        document.getElementById("toca-hero-img").src = c.svg;
        document.getElementById("toca-hero-label").textContent = `🍽️ ${c.name} (Dokun: Değiştir)`;
        KidsAudio.pop();
        KidsAudio.speak(`Merhaba! Ben ${c.name}!`);
      });

      this.stageEl.querySelectorAll(".choice-card").forEach((card) => {
        card.addEventListener("click", (e) => {
          const f = TOCA_FOODS[parseInt(card.dataset.idx, 10)];
          const reactEl = document.getElementById("toca-reaction-img");
          if (reactEl) reactEl.src = f.reactionSvg;
          KidsAudio.munch();
          KidsAudio.speak(f.msg);
          this.spawnConfettiFromEvent(e, f.color);
          this.advanceStep(false);
        });
      });
    } else if (mode === "dressup") {
      this.setPrompt("Kostüm ve şapkalara dokunarak karakterini süsle ve dans ettir!", "toca_dressup", this.stepProgress === 0);

      const cardsHtml = TOCA_COSTUMES.map(
        (c, idx) => `
        <div class="choice-card" data-idx="${idx}" style="border-color:${c.bodyColor}">
          <img src="${c.svg}" alt="${c.name}" class="choice-art" />
          <div class="choice-title">${c.name}</div>
        </div>
      `
      ).join("");

      this.stageEl.innerHTML = `
        <div class="stage-world theme-boutique">
          <img src="assets/svg/sparkles.svg" alt="" class="scene-deco-sun" />
          <div class="stage-showcase">
            <div class="hero-mascot-box" id="dress-hero-box">
              <img id="dress-hat-img" src="assets/svg/crown.svg" alt="" style="width:54px;height:54px;margin-bottom:-14px;z-index:2" />
              <img src="assets/svg/kid.svg" alt="Karakter" class="hero-mascot-img" />
              <div class="hero-mascot-label" id="dress-label">👑 Altın Kral Tacı</div>
            </div>
          </div>
          <div class="stage-choices-grid">${cardsHtml}</div>
        </div>
      `;

      this.stageEl.querySelectorAll(".choice-card").forEach((card) => {
        card.addEventListener("click", (e) => {
          const c = TOCA_COSTUMES[parseInt(card.dataset.idx, 10)];
          document.getElementById("dress-hat-img").src = c.svg;
          document.getElementById("dress-label").textContent = `✨ ${c.name}`;
          const box = document.getElementById("dress-hero-box");
          if (box) box.style.borderColor = c.bodyColor;
          KidsAudio.correct();
          KidsAudio.speak(`Harika! ${c.name} çok yakıştı!`);
          this.spawnConfettiFromEvent(e, c.bodyColor);
          this.advanceStep(false);
        });
      });
    } else if (mode === "petcare") {
      const pets = [
        { svg: "assets/svg/dog.svg", name: "Yavru Köpek Pamuk" },
        { svg: "assets/svg/cat.svg", name: "Yavru Kedi Tarçın" },
        { svg: "assets/svg/rabbit.svg", name: "Yavru Tavşan Kartopu" }
      ];
      const pet = pets[(this.levelNum + this.stepProgress) % pets.length];
      this.setPrompt(`${pet.name} yıkanmak istiyor! Köpük, duş ve ödül mamasına dokunarak onu mutlu et!`, "toca_petcare", this.stepProgress === 0);

      const tools = [
        { svg: "assets/svg/soap.svg", badge: "assets/svg/bubbles.svg", name: "Köpüklü Sabunla", color: "#ec4899", msg: "Köpük köpük oldu!" },
        { svg: "assets/svg/shower.svg", badge: "assets/svg/sparkles.svg", name: "Su İle Durula", color: "#0284c7", msg: "Tertemiz ve pırıl pırıl oldu!" },
        { svg: "assets/svg/bone.svg", badge: "assets/svg/loved.svg", name: "Ödül Maması Ver", color: "#f59e0b", msg: "Karnı doydu, çok mutlu!" },
        { svg: "assets/svg/bubbles.svg", badge: "assets/svg/excited.svg", name: "Köpük Baloncukları", color: "#8b5cf6", msg: "Yaşasın banyo partisi!" }
      ];

      const cardsHtml = tools
        .map(
          (t, idx) => `
        <div class="choice-card" data-idx="${idx}" style="border-color:${t.color}">
          <img src="${t.svg}" alt="${t.name}" class="choice-art" />
          <div class="choice-title">${t.name}</div>
        </div>
      `
        )
        .join("");

      this.stageEl.innerHTML = `
        <div class="stage-world theme-bath">
          <img src="assets/svg/bubbles.svg" alt="" class="scene-deco-cloud" />
          <div class="stage-showcase">
            <div class="hero-mascot-box">
              <div style="display:flex;align-items:center;gap:12px">
                <img src="${pet.svg}" alt="${pet.name}" class="hero-mascot-img" />
                <img id="pet-status-img" src="assets/svg/bubbles.svg" alt="" style="width:54px;height:54px" />
              </div>
              <div class="hero-mascot-label">🛁 ${pet.name}</div>
            </div>
          </div>
          <div class="stage-choices-grid">${cardsHtml}</div>
        </div>
      `;

      this.stageEl.querySelectorAll(".choice-card").forEach((card) => {
        card.addEventListener("click", (e) => {
          const t = tools[parseInt(card.dataset.idx, 10)];
          const stImg = document.getElementById("pet-status-img");
          if (stImg) stImg.src = t.badge;
          KidsAudio.correct();
          KidsAudio.speak(t.msg, "correct");
          this.spawnConfettiFromEvent(e, t.color);
          this.advanceStep(false);
        });
      });
    } else {
      // artparty
      this.setPrompt("Renkli balonlara ve çıkartmalara dokunarak patlat ve kutlama yap!", "toca_artparty", this.stepProgress === 0);
      const artItems = [
        { svg: "assets/svg/balloon.svg", name: "Kırmızı Balon", color: "#ef4444" },
        { svg: "assets/svg/unicorn.svg", name: "Sihirli Unicorn", color: "#ec4899" },
        { svg: "assets/svg/rainbow.svg", name: "Parlak Gökkuşağı", color: "#f59e0b" },
        { svg: "assets/svg/trex.svg", name: "Neşeli Dinozor", color: "#16a34a" },
        { svg: "assets/svg/rocket.svg", name: "Uzay Roketi", color: "#0284c7" },
        { svg: "assets/svg/star.svg", name: "Altın Yıldız", color: "#eab308" }
      ];

      const cardsHtml = artItems
        .map(
          (a, idx) => `
        <div class="choice-card" data-idx="${idx}" style="border-color:${a.color}">
          <img src="${a.svg}" alt="${a.name}" class="choice-art" />
          <div class="choice-title">${a.name}</div>
        </div>
      `
        )
        .join("");

      this.stageEl.innerHTML = `
        <div class="stage-world theme-sunny-meadow">
          <img src="assets/svg/sun.svg" alt="" class="scene-deco-sun" />
          <img src="assets/svg/rainbow.svg" alt="" class="scene-deco-cloud" />
          <div class="stage-showcase">
            <div class="hero-mascot-box">
              <div style="display:flex;align-items:center;gap:14px">
                <img src="assets/svg/palette.svg" alt="Sanat" class="hero-mascot-img" />
                <img id="art-preview-img" src="assets/svg/unicorn.svg" alt="" class="hero-mascot-img" />
              </div>
              <div class="hero-mascot-label" id="art-preview-label">🎨 Sanat &amp; Balon Partisi!</div>
            </div>
          </div>
          <div class="stage-choices-grid">${cardsHtml}</div>
        </div>
      `;

      this.stageEl.querySelectorAll(".choice-card").forEach((card) => {
        card.addEventListener("click", (e) => {
          const a = artItems[parseInt(card.dataset.idx, 10)];
          document.getElementById("art-preview-img").src = a.svg;
          document.getElementById("art-preview-label").textContent = `✨ ${a.name}!`;
          KidsAudio.pop();
          KidsAudio.speak(a.name);
          this.spawnConfettiFromEvent(e, a.color);
          this.advanceStep(false);
        });
      });
    }
  }

  // -------------------- 2. DANIEL TIGER (PBS KIDS #1) --------------------
  buildDanielStage(mode) {
    if (mode === "feelings") {
      const target = DANIEL_EMOTIONS[(this.levelNum + this.stepProgress) % DANIEL_EMOTIONS.length];
      const others = DANIEL_EMOTIONS.filter((e) => e.id !== target.id)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);
      const options = [target, ...others].sort(() => Math.random() - 0.5);
      this.setPrompt(target.prompt, target.voiceKey, true);

      const cardsHtml = options
        .map(
          (o) => `
        <div class="choice-card" data-id="${o.id}" data-correct="${o.id === target.id ? "1" : "0"}" style="border-color:${o.color}">
          <img src="${o.svg}" alt="${o.label}" class="choice-art" />
          <div class="choice-title">${o.label}</div>
        </div>
      `
        )
        .join("");

      this.stageEl.innerHTML = `
        <div class="stage-world theme-sunny-meadow">
          <img src="assets/svg/sun.svg" alt="" class="scene-deco-sun" />
          <img src="assets/svg/cloud.svg" alt="" class="scene-deco-cloud" />
          <div class="stage-showcase">
            <div class="hero-mascot-box" style="border-color:${target.color}">
              <div style="display:flex;align-items:center;gap:16px">
                <img src="assets/svg/tiger.svg" alt="Daniel Tiger" class="hero-mascot-img" />
                <img src="${target.svg}" alt="${target.label}" class="hero-mascot-img" />
              </div>
              <div class="hero-mascot-label">🐯 Daniel Nasıl Hissediyor? (${target.label})</div>
            </div>
          </div>
          <div class="stage-choices-grid">${cardsHtml}</div>
        </div>
      `;

      this.stageEl.querySelectorAll(".choice-card").forEach((card) => {
        card.addEventListener("click", (e) => {
          if (card.dataset.correct === "1") {
            KidsAudio.correct();
            KidsAudio.speak(`Evet! ${target.label} yüz! Aferin!`, "correct");
            this.spawnConfettiFromEvent(e, target.color);
            this.advanceStep(true);
          } else {
            KidsAudio.gentleTryAgain();
            KidsAudio.speak("Tekrar deneyelim!", "try_again");
          }
        });
      });
    } else if (mode === "breathe") {
      this.setPrompt("Daniel ile derin bir nefes alalım! Balonlara 1, 2, 3, 4 diye sırayla dokunarak patlat!", "daniel_breathe", true);
      let nextNum = 1;
      const colors = ["#0284c7", "#ec4899", "#f59e0b", "#16a34a"];

      const cardsHtml = [1, 2, 3, 4]
        .map(
          (n, i) => `
        <div class="choice-card" data-num="${n}" data-correct="${n === 1 ? "1" : "0"}" style="border-color:${colors[i]}">
          <img src="assets/svg/bubbles.svg" alt="Balon ${n}" class="choice-art" />
          <div class="choice-title" style="font-size:1.5rem;color:${colors[i]}">${n}. NEFES BALONU</div>
        </div>
      `
        )
        .join("");

      this.stageEl.innerHTML = `
        <div class="stage-world theme-sunny-meadow">
          <img src="assets/svg/rainbow.svg" alt="" class="scene-deco-sun" />
          <div class="stage-showcase">
            <div class="hero-mascot-box">
              <div style="display:flex;align-items:center;gap:14px">
                <img src="assets/svg/tiger.svg" alt="Daniel" class="hero-mascot-img" />
                <img src="assets/svg/rainbow.svg" alt="Gökkuşağı" class="hero-mascot-img" />
              </div>
              <div class="hero-mascot-label" id="breathe-status">🫧 Sıradaki Balon: 1</div>
            </div>
          </div>
          <div class="stage-choices-grid">${cardsHtml}</div>
        </div>
      `;

      this.stageEl.querySelectorAll(".choice-card").forEach((card) => {
        card.addEventListener("click", (e) => {
          const num = parseInt(card.dataset.num, 10);
          if (num === nextNum) {
            card.style.opacity = "0.35";
            card.style.pointerEvents = "none";
            card.dataset.correct = "0";
            KidsAudio.pop();
            KidsAudio.speak(`${num}!`, `num_${num}`);
            this.spawnConfettiFromEvent(e, colors[num - 1]);
            nextNum++;
            const nextCard = this.stageEl.querySelector(`.choice-card[data-num="${nextNum}"]`);
            if (nextCard) nextCard.dataset.correct = "1";
            const stEl = document.getElementById("breathe-status");
            if (stEl) stEl.textContent = nextNum <= 4 ? `🫧 Sıradaki Balon: ${nextNum}` : "🌈 Harika Nefes Aldın!";
            if (nextNum > 4) {
              setTimeout(() => {
                KidsAudio.correct();
                this.advanceStep(true);
              }, 450);
            }
          } else {
            KidsAudio.gentleTryAgain();
            KidsAudio.speak(`${nextNum}!`, `num_${nextNum}`);
          }
        });
      });
    } else {
      // sharing
      const treats = [
        { svg: "assets/svg/cupcake.svg", name: "Kek" },
        { svg: "assets/svg/strawberry.svg", name: "Çilek" },
        { svg: "assets/svg/cookie.svg", name: "Kurabiye" },
        { svg: "assets/svg/apple.svg", name: "Elma" }
      ];
      const treat = treats[(this.levelNum + this.stepProgress) % treats.length];
      const friends = [
        { svg: "assets/svg/tiger.svg", name: "Daniel Tiger", color: "#f97316" },
        { svg: "assets/svg/cat.svg", name: "Katerina Kedi", color: "#ec4899" },
        { svg: "assets/svg/owl.svg", name: "Baykuş O", color: "#0284c7" }
      ];
      this.setPrompt(`Paylaşmak çok güzeldir! Her arkadaşa dokunarak birer ${treat.name} ikram et!`, "daniel_sharing", true);

      let sharedCount = 0;
      const cardsHtml = friends
        .map(
          (f, i) => `
        <div class="choice-card" data-idx="${i}" data-correct="1" style="border-color:${f.color}">
          <img src="${f.svg}" alt="${f.name}" class="choice-art" />
          <div class="choice-title">${f.name}</div>
          <img src="${treat.svg}" alt="" class="shared-treat-icon hidden" style="width:36px;height:36px" />
        </div>
      `
        )
        .join("");

      this.stageEl.innerHTML = `
        <div class="stage-world theme-kitchen">
          <div class="stage-showcase">
            <div class="hero-mascot-box">
              <img src="${treat.svg}" alt="${treat.name}" class="hero-mascot-img" />
              <div class="hero-mascot-label">🧁 İkram Tepsisi: ${treat.name}</div>
            </div>
          </div>
          <div class="stage-choices-grid">${cardsHtml}</div>
        </div>
      `;

      this.stageEl.querySelectorAll(".choice-card").forEach((card) => {
        card.addEventListener("click", (e) => {
          if (card.dataset.shared === "1") return;
          card.dataset.shared = "1";
          card.dataset.correct = "0";
          card.style.background = "#dcfce7";
          card.querySelector(".shared-treat-icon")?.classList.remove("hidden");
          sharedCount++;
          KidsAudio.pop();
          KidsAudio.speak(`${ sharedCount }!`, `num_${sharedCount}`);
          this.spawnConfettiFromEvent(e, "#16a34a");
          if (sharedCount >= 3) {
            setTimeout(() => {
              KidsAudio.correct();
              this.advanceStep(true);
            }, 450);
          }
        });
      });
    }
  }

  // -------------------- 3. WILD KRATTS (PBS KIDS #2) --------------------
  buildWildKrattsStage(mode) {
    const suitKey = WILD_KRATTS_ANIMALS[mode] ? mode : "cheetah";
    const info = WILD_KRATTS_ANIMALS[suitKey];
    this.setPrompt(`${info.name}! Yavru hayvan kartlarına dokunarak onları kurtar!`, info.voiceKey, true);

    let rescued = 0;
    const cards = [
      { kind: "baby", svg: info.babySvg, label: "Yavru Hayvanı Kurtar!", color: "#16a34a" },
      { kind: "baby", svg: info.babySvg, label: "Yavru Hayvanı Kurtar!", color: "#16a34a" },
      { kind: "food", svg: info.foodSvg, label: "Güç Enerjisi Topla!", color: "#f59e0b" },
      { kind: "baby", svg: info.babySvg, label: "Yavru Hayvanı Kurtar!", color: "#16a34a" }
    ];

    const cardsHtml = cards
      .map(
        (c, i) => `
      <div class="choice-card" data-idx="${i}" data-correct="1" style="border-color:${c.color}">
        <img src="${c.svg}" alt="${c.label}" class="choice-art" />
        <div class="choice-title">${c.label}</div>
      </div>
    `
      )
      .join("");

    this.stageEl.innerHTML = `
      <div class="stage-world ${info.themeClass}">
        <img src="assets/svg/sun.svg" alt="" class="scene-deco-sun" />
        <img src="assets/svg/cloud.svg" alt="" class="scene-deco-cloud" />
        <div class="stage-showcase">
          <div class="hero-mascot-box" style="border-color:#16a34a">
            <div style="display:flex;align-items:center;gap:14px">
              <img src="${info.heroSvg}" alt="${info.name}" class="hero-mascot-img" />
              <img src="assets/svg/sparkles.svg" alt="" style="width:48px;height:48px" />
            </div>
            <div class="hero-mascot-label" id="kratts-status">🐾 ${info.name} • Kurtarılan: 0/3</div>
          </div>
        </div>
        <div class="stage-choices-grid">${cardsHtml}</div>
      </div>
    `;

    this.stageEl.querySelectorAll(".choice-card").forEach((card) => {
      card.addEventListener("click", (e) => {
        if (card.dataset.done === "1") return;
        card.dataset.done = "1";
        card.dataset.correct = "0";
        card.style.background = "#dcfce7";
        card.style.transform = "scale(0.92)";
        rescued++;
        KidsAudio.pop();
        KidsAudio.speak(`${rescued}!`, `num_${rescued}`);
        this.spawnConfettiFromEvent(e, "#22c55e");
        const stEl = document.getElementById("kratts-status");
        if (stEl) stEl.textContent = `🐾 ${info.name} • Kurtarılan: ${rescued}/3`;
        if (rescued >= 3) {
          setTimeout(() => {
            KidsAudio.correct();
            this.advanceStep(true);
          }, 400);
        }
      });
    });
  }

  // -------------------- 4. CURIOUS GEORGE (PBS KIDS #3) --------------------
  buildGeorgeStage(mode) {
    if (mode === "balloons") {
      const targetNum = ((this.levelNum + this.stepProgress - 1) % 5) + 3; // 3..7
      this.setPrompt(`Meraklı George için balonlara dokunup 1'den ${targetNum}'e kadar birlikte sayalım!`, "george_balloons", true);

      let count = 0;
      const colors = ["#ec4899", "#f59e0b", "#0284c7", "#16a34a", "#8b5cf6", "#f97316", "#ef4444"];
      const cardsHtml = Array.from({ length: targetNum })
        .map(
          (_, i) => `
        <div class="choice-card" data-idx="${i}" data-correct="1" style="border-color:${colors[i % colors.length]}">
          <img src="assets/svg/balloon.svg" alt="Balon" class="choice-art" />
          <div class="choice-title" style="color:${colors[i % colors.length]}">BALON ${i + 1}</div>
        </div>
      `
        )
        .join("");

      this.stageEl.innerHTML = `
        <div class="stage-world theme-sunny-meadow">
          <img src="assets/svg/sun.svg" alt="" class="scene-deco-sun" />
          <div class="stage-showcase">
            <div class="hero-mascot-box">
              <div style="display:flex;align-items:center;gap:14px">
                <img src="assets/svg/monkey.svg" alt="Curious George" class="hero-mascot-img" />
                <img src="assets/svg/balloon.svg" alt="Balon" class="hero-mascot-img" />
              </div>
              <div class="hero-mascot-label" id="george-count-label">🐵 Sayılan Balon: 0 / ${targetNum}</div>
            </div>
          </div>
          <div class="stage-choices-grid">${cardsHtml}</div>
        </div>
      `;

      this.stageEl.querySelectorAll(".choice-card").forEach((card) => {
        card.addEventListener("click", (e) => {
          if (card.dataset.done === "1") return;
          card.dataset.done = "1";
          card.dataset.correct = "0";
          card.style.background = "#fef9c3";
          card.style.opacity = "0.5";
          count++;
          KidsAudio.pop();
          KidsAudio.speak(`${count}!`, `num_${count}`);
          this.spawnConfettiFromEvent(e, "#f59e0b");
          const lbl = document.getElementById("george-count-label");
          if (lbl) lbl.textContent = `🐵 Sayılan Balon: ${count} / ${targetNum}`;
          if (count >= targetNum) {
            setTimeout(() => {
              KidsAudio.correct();
              this.advanceStep(true);
            }, 450);
          }
        });
      });
    } else if (mode === "baskets") {
      const baskets = [
        { id: "red", label: "KIRMIZI SEPET", fruitName: "Kırmızı Elma", svg: "assets/svg/apple.svg", color: "#ef4444", voiceKey: "george_red" },
        { id: "yellow", label: "SARI SEPET", fruitName: "Sarı Muz", svg: "assets/svg/banana.svg", color: "#eab308", voiceKey: "george_yellow" },
        { id: "green", label: "YEŞİL SEPET", fruitName: "Yeşil Armut", svg: "assets/svg/pear.svg", color: "#16a34a", voiceKey: "george_green" }
      ];
      const target = baskets[(this.levelNum + this.stepProgress) % baskets.length];
      this.setPrompt(`${target.fruitName} hangi sepete gitmeli? ${target.label} kartına dokun!`, target.voiceKey, true);

      const cardsHtml = baskets
        .map(
          (b) => `
        <div class="choice-card" data-id="${b.id}" data-correct="${b.id === target.id ? "1" : "0"}" style="border-color:${b.color}">
          <div style="display:flex;align-items:center;gap:8px">
            <img src="assets/svg/basket.svg" alt="" class="choice-art" />
            <img src="${b.svg}" alt="" style="width:42px;height:42px" />
          </div>
          <div class="choice-title" style="color:${b.color}">${b.label}</div>
        </div>
      `
        )
        .join("");

      this.stageEl.innerHTML = `
        <div class="stage-world theme-sunny-meadow">
          <div class="stage-showcase">
            <div class="hero-mascot-box" style="border-color:${target.color}">
              <div style="display:flex;align-items:center;gap:14px">
                <img src="assets/svg/monkey.svg" alt="George" class="hero-mascot-img" />
                <img src="${target.svg}" alt="${target.fruitName}" class="hero-mascot-img" />
              </div>
              <div class="hero-mascot-label">${target.fruitName} Hangi Sepete Gider?</div>
            </div>
          </div>
          <div class="stage-choices-grid">${cardsHtml}</div>
        </div>
      `;

      this.stageEl.querySelectorAll(".choice-card").forEach((card) => {
        card.addEventListener("click", (e) => {
          if (card.dataset.correct === "1") {
            KidsAudio.correct();
            KidsAudio.speak("Aferin! Çok doğru buldun!", "correct");
            this.spawnConfettiFromEvent(e, target.color);
            this.advanceStep(true);
          } else {
            KidsAudio.gentleTryAgain();
            KidsAudio.speak("Tekrar deneyelim!", "try_again");
          }
        });
      });
    } else {
      // train
      const patterns = [
        {
          seq: ["assets/svg/apple.svg", "assets/svg/banana.svg", "assets/svg/apple.svg", "assets/svg/banana.svg"],
          ans: "assets/svg/apple.svg",
          opts: [
            { svg: "assets/svg/apple.svg", label: "Kırmızı Elma" },
            { svg: "assets/svg/banana.svg", label: "Sarı Muz" },
            { svg: "assets/svg/pear.svg", label: "Yeşil Armut" }
          ]
        },
        {
          seq: ["assets/svg/star.svg", "assets/svg/sun.svg", "assets/svg/star.svg", "assets/svg/sun.svg"],
          ans: "assets/svg/star.svg",
          opts: [
            { svg: "assets/svg/star.svg", label: "Parlak Yıldız" },
            { svg: "assets/svg/sun.svg", label: "Güneş" },
            { svg: "assets/svg/rainbow.svg", label: "Gökkuşağı" }
          ]
        },
        {
          seq: ["assets/svg/shape_circle.svg", "assets/svg/shape_square.svg", "assets/svg/shape_circle.svg", "assets/svg/shape_square.svg"],
          ans: "assets/svg/shape_circle.svg",
          opts: [
            { svg: "assets/svg/shape_circle.svg", label: "Pembe Daire" },
            { svg: "assets/svg/shape_square.svg", label: "Mavi Kare" },
            { svg: "assets/svg/shape_triangle.svg", label: "Sarı Üçgen" }
          ]
        }
      ];
      const p = patterns[(this.levelNum + this.stepProgress) % patterns.length];
      this.setPrompt("George'un trenindeki sıraya dikkatle bak! Soru işaretli vagona hangisi gelmeli?", "george_train", true);

      const seqHtml = p.seq
        .map((s) => `<img src="${s}" alt="" style="width:46px;height:46px;background:#f0f9ff;padding:6px;border-radius:12px;border:2px solid #38bdf8" />`)
        .join("");

      const cardsHtml = p.opts
        .map(
          (o) => `
        <div class="choice-card" data-correct="${o.svg === p.ans ? "1" : "0"}">
          <img src="${o.svg}" alt="${o.label}" class="choice-art" />
          <div class="choice-title">${o.label}</div>
        </div>
      `
        )
        .join("");

      this.stageEl.innerHTML = `
        <div class="stage-world theme-sunny-meadow">
          <div class="stage-showcase">
            <div class="hero-mascot-box">
              <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:center">
                <img src="assets/svg/train.svg" alt="Tren" style="width:58px;height:58px" />
                ${seqHtml}
                <div style="width:48px;height:48px;border-radius:12px;background:#fef9c3;border:3px dashed #f59e0b;display:flex;align-items:center;justify-content:center;font-size:1.5rem;font-weight:900;color:#b45309">?</div>
              </div>
              <div class="hero-mascot-label">🚂 Sıradaki Vagon Hangisi?</div>
            </div>
          </div>
          <div class="stage-choices-grid">${cardsHtml}</div>
        </div>
      `;

      this.stageEl.querySelectorAll(".choice-card").forEach((card) => {
        card.addEventListener("click", (e) => {
          if (card.dataset.correct === "1") {
            KidsAudio.correct();
            KidsAudio.speak("Aferin! Çok doğru buldun!", "correct");
            this.spawnConfettiFromEvent(e, "#22c55e");
            this.advanceStep(true);
          } else {
            KidsAudio.gentleTryAgain();
            KidsAudio.speak("Tekrar deneyelim!", "try_again");
          }
        });
      });
    }
  }

  // -------------------- 5. SUPER WHY! (PBS KIDS #4) --------------------
  buildSuperWhyStage(mode) {
    if (mode === "firstletter") {
      const target = SUPERWHY_WORDS[(this.levelNum + this.stepProgress) % SUPERWHY_WORDS.length];
      const others = SUPERWHY_WORDS.filter((w) => w.letter !== target.letter)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);
      const opts = [target, ...others].sort(() => Math.random() - 0.5);
      this.setPrompt(`"${target.word}" hangi harfle başlar? "${target.letter}" harfine dokun!`, "super_firstletter", true);

      const cardsHtml = opts
        .map(
          (o) => `
        <div class="choice-card" data-correct="${o.letter === target.letter ? "1" : "0"}" style="border-color:${o.color}">
          <div style="width:68px;height:68px;border-radius:50%;background:${o.color};color:#fff;display:flex;align-items:center;justify-content:center;font-size:2.2rem;font-weight:900;box-shadow:0 4px 10px rgba(0,0,0,0.15)">${o.letter}</div>
          <div class="choice-title">${o.letter} HARFİ</div>
        </div>
      `
        )
        .join("");

      this.stageEl.innerHTML = `
        <div class="stage-world theme-sunny-meadow">
          <div class="stage-showcase">
            <div class="hero-mascot-box" style="border-color:${target.color}">
              <div style="display:flex;align-items:center;gap:16px">
                <img src="${target.svg}" alt="${target.word}" class="hero-mascot-img" />
                <div style="font-size:2.2rem;font-weight:900;color:#db2777">${target.word}</div>
              </div>
              <div class="hero-mascot-label">🦸‍♂️ İlk Harfi Hangisi? (${target.letter})</div>
            </div>
          </div>
          <div class="stage-choices-grid">${cardsHtml}</div>
        </div>
      `;

      this.stageEl.querySelectorAll(".choice-card").forEach((card) => {
        card.addEventListener("click", (e) => {
          if (card.dataset.correct === "1") {
            KidsAudio.correct();
            KidsAudio.speak("Aferin! Çok doğru buldun!", "correct");
            this.spawnConfettiFromEvent(e, target.color);
            this.advanceStep(true);
          } else {
            KidsAudio.gentleTryAgain();
            KidsAudio.speak("Tekrar deneyelim!", "try_again");
          }
        });
      });
    } else if (mode === "alphabridge") {
      const sets = [
        ["A", "B", "C", "Ç"],
        ["D", "E", "F", "G"],
        ["H", "I", "İ", "J"],
        ["K", "L", "M", "N"],
        ["O", "Ö", "P", "R"]
      ];
      const seq = sets[(this.levelNum + this.stepProgress) % sets.length];
      let nextIdx = 0;
      this.setPrompt(`Alpha Pig'in köprüsü için harflere sırayla dokun: ${seq.join(" - ")}`, "super_bridge", true);

      const cardsHtml = seq
        .map(
          (ch, idx) => `
        <div class="choice-card" data-idx="${idx}" data-correct="${idx === 0 ? "1" : "0"}">
          <div style="width:64px;height:64px;border-radius:18px;background:#0ea5e9;color:#fff;display:flex;align-items:center;justify-content:center;font-size:2rem;font-weight:900">${ch}</div>
          <div class="choice-title">${idx + 1}. Harf: ${ch}</div>
        </div>
      `
        )
        .join("");

      this.stageEl.innerHTML = `
        <div class="stage-world theme-sunny-meadow">
          <div class="stage-showcase">
            <div class="hero-mascot-box">
              <div style="display:flex;align-items:center;gap:14px">
                <img src="assets/svg/pig.svg" alt="Alpha Pig" class="hero-mascot-img" />
                <img src="assets/svg/rainbow.svg" alt="Köprü" style="width:58px;height:58px" />
                <img src="assets/svg/castle.svg" alt="Kale" class="hero-mascot-img" />
              </div>
              <div class="hero-mascot-label" id="bridge-status">🌉 Sıradaki Harf: ${seq[0]}</div>
            </div>
          </div>
          <div class="stage-choices-grid">${cardsHtml}</div>
        </div>
      `;

      this.stageEl.querySelectorAll(".choice-card").forEach((card) => {
        card.addEventListener("click", (e) => {
          const idx = parseInt(card.dataset.idx, 10);
          if (idx === nextIdx) {
            card.style.background = "#dcfce7";
            card.style.borderColor = "#22c55e";
            card.dataset.correct = "0";
            nextIdx++;
            KidsAudio.pop();
            this.spawnConfettiFromEvent(e, "#22c55e");
            const nextCard = this.stageEl.querySelector(`.choice-card[data-idx="${nextIdx}"]`);
            if (nextCard) nextCard.dataset.correct = "1";
            const stEl = document.getElementById("bridge-status");
            if (stEl) stEl.textContent = nextIdx < seq.length ? `🌉 Sıradaki Harf: ${seq[nextIdx]}` : "🎉 Köprü Tamamlandı!";
            if (nextIdx >= seq.length) {
              setTimeout(() => {
                KidsAudio.correct();
                KidsAudio.speak("Aferin! Çok doğru buldun!", "correct");
                this.advanceStep(true);
              }, 400);
            }
          } else {
            KidsAudio.gentleTryAgain();
            KidsAudio.speak("Tekrar deneyelim!", "try_again");
          }
        });
      });
    } else {
      // wordrocket
      const words = [
        { word: "ARI", letters: ["A", "R", "I"], svg: "assets/svg/bee.svg" },
        { word: "KEDİ", letters: ["K", "E", "D", "İ"], svg: "assets/svg/cat.svg" },
        { word: "ELMA", letters: ["E", "L", "M", "A"], svg: "assets/svg/apple.svg" },
        { word: "TOP", letters: ["T", "O", "P"], svg: "assets/svg/soccer.svg" },
        { word: "SÜT", letters: ["S", "Ü", "T"], svg: "assets/svg/milk.svg" }
      ];
      const w = words[(this.levelNum + this.stepProgress) % words.length];
      let nextIdx = 0;
      this.setPrompt(`Süper Roketle "${w.word}" kelimesinin yıldız harflerine sırayla dokun!`, "super_rocket", true);

      const cardsHtml = w.letters
        .map(
          (ch, idx) => `
        <div class="choice-card" data-idx="${idx}" data-correct="${idx === 0 ? "1" : "0"}" style="border-color:#f59e0b">
          <div style="position:relative;display:flex;align-items:center;justify-content:center">
            <img src="assets/svg/star.svg" alt="" class="choice-art" />
            <span style="position:absolute;font-size:1.8rem;font-weight:900;color:#0f172a">${ch}</span>
          </div>
          <div class="choice-title">${idx + 1}. Harf: ${ch}</div>
        </div>
      `
        )
        .join("");

      this.stageEl.innerHTML = `
        <div class="stage-world theme-space">
          <div class="stage-showcase">
            <div class="hero-mascot-box">
              <div style="display:flex;align-items:center;gap:14px">
                <img src="assets/svg/rocket.svg" alt="Roket" class="hero-mascot-img" />
                <img src="${w.svg}" alt="${w.word}" class="hero-mascot-img" />
              </div>
              <div class="hero-mascot-label" id="rocket-word-status">🚀 Hedef Kelime: ${w.word}</div>
            </div>
          </div>
          <div class="stage-choices-grid">${cardsHtml}</div>
        </div>
      `;

      this.stageEl.querySelectorAll(".choice-card").forEach((card) => {
        card.addEventListener("click", (e) => {
          const idx = parseInt(card.dataset.idx, 10);
          if (idx === nextIdx) {
            card.style.background = "#fef9c3";
            card.style.opacity = "0.55";
            card.dataset.correct = "0";
            nextIdx++;
            KidsAudio.pop();
            this.spawnConfettiFromEvent(e, "#f59e0b");
            const nextCard = this.stageEl.querySelector(`.choice-card[data-idx="${nextIdx}"]`);
            if (nextCard) nextCard.dataset.correct = "1";
            if (nextIdx >= w.letters.length) {
              setTimeout(() => {
                KidsAudio.correct();
                KidsAudio.speak("Aferin! Çok doğru buldun!", "correct");
                this.advanceStep(true);
              }, 400);
            }
          } else {
            KidsAudio.gentleTryAgain();
          }
        });
      });
    }
  }

  // -------------------- 6. PEG + CAT (PBS KIDS #5) --------------------
  buildPegCatStage(mode) {
    if (mode === "pizza") {
      const target = PEGCAT_SHAPES[(this.levelNum + this.stepProgress) % PEGCAT_SHAPES.length];
      this.setPrompt(`Peg'in Pizza Dükkanı! Pizzayı süslemek için ${target.name} şekline dokun!`, target.voiceKey, true);

      const cardsHtml = PEGCAT_SHAPES.slice(0, 4)
        .map(
          (s) => `
        <div class="choice-card" data-correct="${s.id === target.id ? "1" : "0"}" style="border-color:${s.color}">
          <img src="${s.svg}" alt="${s.name}" class="choice-art" />
          <div class="choice-title">${s.name}</div>
        </div>
      `
        )
        .join("");

      this.stageEl.innerHTML = `
        <div class="stage-world theme-pizzeria">
          <div class="stage-showcase">
            <div class="hero-mascot-box" style="border-color:${target.color}">
              <div style="display:flex;align-items:center;gap:16px">
                <img src="assets/svg/pizza.svg" alt="Pizza" class="hero-mascot-img" />
                <img src="${target.svg}" alt="${target.name}" class="hero-mascot-img" />
              </div>
              <div class="hero-mascot-label">🍕 Sipariş: ${target.name} Şekilli Pizza!</div>
            </div>
          </div>
          <div class="stage-choices-grid">${cardsHtml}</div>
        </div>
      `;

      this.stageEl.querySelectorAll(".choice-card").forEach((card) => {
        card.addEventListener("click", (e) => {
          if (card.dataset.correct === "1") {
            KidsAudio.correct();
            KidsAudio.speak("Aferin! Çok doğru buldun!", "correct");
            this.spawnConfettiFromEvent(e, target.color);
            this.advanceStep(true);
          } else {
            KidsAudio.gentleTryAgain();
            KidsAudio.speak("Tekrar deneyelim!", "try_again");
          }
        });
      });
    } else if (mode === "sizes") {
      const themes = [
        { svg: "assets/svg/guitar.svg", name: "Gitar" },
        { svg: "assets/svg/rocket.svg", name: "Roket" },
        { svg: "assets/svg/tophat.svg", name: "Şapka" },
        { svg: "assets/svg/star.svg", name: "Yıldız" }
      ];
      const th = themes[(this.levelNum + this.stepProgress) % themes.length];
      const sizes = [
        { id: "small", label: "EN KÜÇÜK", scale: "0.62", voiceKey: "peg_small" },
        { id: "medium", label: "ORTA BOY", scale: "1.0", voiceKey: "peg_medium" },
        { id: "large", label: "EN BÜYÜK", scale: "1.38", voiceKey: "peg_large" }
      ];
      const target = sizes[(this.levelNum + this.stepProgress) % 3];
      const shuffled = [...sizes].sort(() => Math.random() - 0.5);
      this.setPrompt(`Mavi Kedi Cat için ${target.label} olan ${th.name} hangisi? Ona dokun!`, target.voiceKey, true);

      const cardsHtml = shuffled
        .map(
          (s) => `
        <div class="choice-card" data-correct="${s.id === target.id ? "1" : "0"}">
          <img src="${th.svg}" alt="${s.label}" class="choice-art" data-scale="${s.scale}" />
          <div class="choice-title">${s.label}</div>
        </div>
      `
        )
        .join("");

      this.stageEl.innerHTML = `
        <div class="stage-world theme-boutique">
          <div class="stage-showcase">
            <div class="hero-mascot-box">
              <div style="display:flex;align-items:center;gap:14px">
                <img src="assets/svg/cat.svg" alt="Cat" class="hero-mascot-img" />
                <img src="${th.svg}" alt="${th.name}" class="hero-mascot-img" />
              </div>
              <div class="hero-mascot-label">📏 Hedef: ${target.label} ${th.name}</div>
            </div>
          </div>
          <div class="stage-choices-grid">${cardsHtml}</div>
        </div>
      `;

      this.stageEl.querySelectorAll(".choice-card").forEach((card) => {
        card.addEventListener("click", (e) => {
          if (card.dataset.correct === "1") {
            KidsAudio.correct();
            KidsAudio.speak("Aferin! Çok doğru buldun!", "correct");
            this.spawnConfettiFromEvent(e, "#7c3aed");
            this.advanceStep(true);
          } else {
            KidsAudio.gentleTryAgain();
            KidsAudio.speak("Tekrar deneyelim!", "try_again");
          }
        });
      });
    } else {
      // chickens
      this.setPrompt("Uzay tavuklarına dokunarak 4 tavuğu da uzay roketine bindir!", "peg_chickens", true);
      let boarded = 0;

      const cardsHtml = [1, 2, 3, 4]
        .map(
          (n) => `
        <div class="choice-card" data-correct="1" style="border-color:#f59e0b">
          <img src="assets/svg/chicken.svg" alt="Uzay Tavuğu" class="choice-art" />
          <div class="choice-title">${n}. Uzay Tavuğu</div>
        </div>
      `
        )
        .join("");

      this.stageEl.innerHTML = `
        <div class="stage-world theme-space">
          <div class="stage-showcase">
            <div class="hero-mascot-box">
              <div style="display:flex;align-items:center;gap:14px">
                <img src="assets/svg/rocket.svg" alt="Roket" class="hero-mascot-img" />
                <img src="assets/svg/chicken.svg" alt="Tavuk" class="hero-mascot-img" />
              </div>
              <div class="hero-mascot-label" id="chicken-status">🚀 Roketteki Tavuklar: 0 / 4</div>
            </div>
          </div>
          <div class="stage-choices-grid">${cardsHtml}</div>
        </div>
      `;

      this.stageEl.querySelectorAll(".choice-card").forEach((card) => {
        card.addEventListener("click", (e) => {
          if (card.dataset.done === "1") return;
          card.dataset.done = "1";
          card.dataset.correct = "0";
          card.style.background = "#dcfce7";
          card.style.opacity = "0.5";
          boarded++;
          KidsAudio.pop();
          KidsAudio.speak(`${boarded}!`, `num_${boarded}`);
          this.spawnConfettiFromEvent(e, "#f59e0b");
          const stEl = document.getElementById("chicken-status");
          if (stEl) stEl.textContent = `🚀 Roketteki Tavuklar: ${boarded} / 4`;
          if (boarded >= 4) {
            setTimeout(() => {
              KidsAudio.correct();
              this.advanceStep(true);
            }, 450);
          }
        });
      });
    }
  }

  // ==================== İLERLEME VE KUTLAMA MODALI ====================
  advanceStep(rebuildStage = true) {
    this.stepProgress++;
    this.save.totalStars = (this.save.totalStars || 0) + 1;
    this.saveData();
    this.updateFloatingHUD();

    if (this.stepProgress >= this.stepTarget) {
      this.completeStage();
    } else if (rebuildStage) {
      setTimeout(() => {
        if (this.state === "PLAYING") {
          this.buildStageForActiveGame();
        }
      }, 550);
    }
  }

  completeStage() {
    KidsAudio.fanfare();
    KidsAudio.speak("Harikasın! Aşamayı başarıyla tamamladın ve üç altın yıldız kazandın!", "win_stage");

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
    this.updateFloatingHUD();

    const bigImg = document.getElementById("cel-big-img");
    if (bigImg && this.gameMeta) bigImg.src = this.gameMeta.svg;

    document.getElementById("cel-title").textContent = "🌟 HARİKASIN! AŞAMA TAMAMLANDI!";
    document.getElementById("cel-subtitle").textContent = `${this.gameMeta.title} - Aşama ${this.levelNum}`;

    const factBox = document.getElementById("cel-fact-box");
    if (this.activeGameId === "pbs_wildkratts") {
      const suit = WILD_KRATTS_ANIMALS[this.activeModeId] || WILD_KRATTS_ANIMALS.cheetah;
      factBox.textContent = `🐾 ${suit.fact}`;
    } else {
      factBox.textContent = "✨ Harika iş çıkardın! +3 Altın Yıldız kazandın!";
    }

    const stRewardEl = document.getElementById("cel-sticker-reward");
    if (wonSticker) {
      stRewardEl.innerHTML = `<img src="${wonSticker.svg}" alt="" style="width:36px;height:36px" /> <span>YENİ ÇIKARTMA: ${wonSticker.name}!</span>`;
      stRewardEl.classList.remove("hidden");
    } else {
      stRewardEl.classList.add("hidden");
    }

    document.getElementById("celebration-overlay")?.classList.remove("hidden");
    this.spawnBurst(this.layout.width * 0.5, this.layout.height * 0.4, "#f59e0b", 36);
  }

  // ==================== ODALAR VE AŞAMALAR MODALI ====================
  openRoomsModal() {
    const g = this.gameMeta;
    if (!g) return;
    document.getElementById("rm-game-icon").src = g.svg;
    document.getElementById("rm-game-badge").textContent = `${g.badge} • ${g.ageTag}`;
    document.getElementById("rm-game-title").textContent = g.title;

    const modesGrid = document.getElementById("rm-modes-grid");
    modesGrid.innerHTML = "";
    g.modes.forEach((m, idx) => {
      const card = document.createElement("div");
      card.className = `rm-mode-card ${m.id === this.activeModeId ? "active" : ""}`;
      card.innerHTML = `
        <img src="${m.svg}" alt="${m.name}" />
        <div style="font-weight:900;color:#0f172a">${m.name}</div>
        <small style="font-size:0.75rem;color:#475569;font-weight:700">${m.desc}</small>
      `;
      card.addEventListener("click", () => {
        KidsAudio.pop();
        this.launchGame(g.id, idx + 1, m.id);
      });
      modesGrid.appendChild(card);
    });

    const lvlGrid = document.getElementById("rm-levels-grid");
    lvlGrid.innerHTML = "";
    const starsMap = (this.save.starsByGame && this.save.starsByGame[g.id]) || {};

    for (let lvl = 1; lvl <= 30; lvl++) {
      const modeObj = g.modes[(lvl - 1) % g.modes.length];
      const st = starsMap[lvl] || 0;
      const btn = document.createElement("div");
      btn.className = `rm-lvl-btn ${lvl === this.levelNum ? "active" : ""}`;
      btn.innerHTML = `
        <div>Aşama ${lvl}</div>
        <div style="font-size:0.72rem">${st > 0 ? "⭐".repeat(st) : "▶️ Oyna"}</div>
      `;
      btn.addEventListener("click", () => {
        KidsAudio.pop();
        this.launchGame(g.id, lvl, modeObj.id);
      });
      lvlGrid.appendChild(btn);
    }

    document.getElementById("rooms-modal")?.classList.remove("hidden");
  }

  // ==================== ÇIKARTMA ALBÜMÜ MODALI ====================
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
        <img src="${st.svg}" alt="${st.name}" />
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

  // ==================== PARÇACIK EFEKT DÖNGÜSÜ ====================
  spawnConfettiFromEvent(e, color = "#f59e0b") {
    const x = e && e.clientX ? e.clientX : this.layout.width * 0.5;
    const y = e && e.clientY ? e.clientY : this.layout.height * 0.5;
    this.spawnBurst(x, y, color, 22);
  }

  spawnBurst(x, y, color, count = 20) {
    const palette = [color, "#f59e0b", "#ec4899", "#22c55e", "#0ea5e9"];
    for (let i = 0; i < count; i++) {
      const a = (Math.PI * 2 * i) / count + Math.random() * 0.3;
      const spd = 80 + Math.random() * 190;
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd - 60,
        r: 5 + Math.random() * 5,
        color: palette[i % palette.length],
        life: 0.65 + Math.random() * 0.3
      });
    }
  }

  loop(now) {
    requestAnimationFrame((t) => this.loop(t));
    const dt = Math.min(0.05, Math.max(0.001, (now - this.lastFrame) / 1000));
    this.lastFrame = now;

    if (!this.fxCtx || this.particles.length === 0) return;
    this.fxCtx.clearRect(0, 0, this.layout.width, this.layout.height);

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 240 * dt;
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      this.fxCtx.fillStyle = p.color;
      this.fxCtx.beginPath();
      this.fxCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      this.fxCtx.fill();
    }
  }

  // ==================== OLAY DİNLEYİCİLERİ ====================
  bindEvents() {
    window.addEventListener("resize", () => {
      this.calculateGameArea();
    });

    document.querySelectorAll(".cat-pill").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".cat-pill").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        this.activeCategory = btn.dataset.cat || "all";
        KidsAudio.pop();
        this.renderHubGames();
      });
    });

    // Ana menü modal butonları
    document.getElementById("btn-open-stickers")?.addEventListener("click", () => {
      KidsAudio.pop();
      this.renderStickerModal();
      document.getElementById("sticker-modal")?.classList.remove("hidden");
    });
    document.getElementById("btn-close-stickers")?.addEventListener("click", () => {
      KidsAudio.pop();
      document.getElementById("sticker-modal")?.classList.add("hidden");
    });

    document.getElementById("btn-open-info")?.addEventListener("click", () => {
      KidsAudio.pop();
      document.getElementById("info-modal")?.classList.remove("hidden");
    });
    document.getElementById("btn-close-info")?.addEventListener("click", () => {
      KidsAudio.pop();
      document.getElementById("info-modal")?.classList.add("hidden");
    });

    // Ses & konuşma ayarları
    document.getElementById("btn-toggle-voice")?.addEventListener("click", () => {
      KidsAudio.voiceEnabled = !KidsAudio.voiceEnabled;
      document.getElementById("voice-status-text").textContent = KidsAudio.voiceEnabled ? "AÇIK" : "KAPALI";
      if (KidsAudio.voiceEnabled) KidsAudio.speak("Sesli rehber açıldı!", "test_audio");
    });

    const toggleSoundFn = () => {
      KidsAudio.soundEnabled = !KidsAudio.soundEnabled;
      const st = document.getElementById("sound-status-text");
      if (st) st.textContent = KidsAudio.soundEnabled ? "AÇIK" : "KAPALI";
      const flBtn = document.getElementById("btn-float-sound");
      if (flBtn) flBtn.textContent = KidsAudio.soundEnabled ? "🔊" : "🔇";
      if (KidsAudio.soundEnabled) KidsAudio.pop();
    };
    document.getElementById("btn-toggle-sound")?.addEventListener("click", toggleSoundFn);
    document.getElementById("btn-float-sound")?.addEventListener("click", toggleSoundFn);

    document.getElementById("btn-test-audio")?.addEventListener("click", () => {
      KidsAudio.soundEnabled = true;
      KidsAudio.voiceEnabled = true;
      document.getElementById("voice-status-text").textContent = "AÇIK";
      document.getElementById("sound-status-text").textContent = "AÇIK";
      KidsAudio.fanfare();
      KidsAudio.speak("Merhaba! Ses ve Türkçe konuşma rehberi harika çalışıyor!", "test_audio");
    });

    // Tam ekran oyun içi yüzen köşe butonları
    document.getElementById("btn-float-hub")?.addEventListener("click", () => {
      KidsAudio.pop();
      this.state = "HUB";
      this.renderHubGames();
      this.showScreen("hub-screen");
    });

    document.getElementById("btn-float-rooms")?.addEventListener("click", () => {
      KidsAudio.pop();
      this.openRoomsModal();
    });

    document.getElementById("btn-close-rooms")?.addEventListener("click", () => {
      KidsAudio.pop();
      document.getElementById("rooms-modal")?.classList.add("hidden");
    });

    document.getElementById("rm-btn-resume")?.addEventListener("click", () => {
      KidsAudio.pop();
      document.getElementById("rooms-modal")?.classList.add("hidden");
    });

    document.getElementById("rm-btn-back-hub")?.addEventListener("click", () => {
      KidsAudio.pop();
      document.getElementById("rooms-modal")?.classList.add("hidden");
      this.state = "HUB";
      this.renderHubGames();
      this.showScreen("hub-screen");
    });

    document.getElementById("btn-float-prompt")?.addEventListener("click", () => {
      KidsAudio.pop();
      KidsAudio.speak(this.gs.promptText || "", this.gs.voiceKey);
    });

    document.getElementById("btn-float-hint")?.addEventListener("click", () => {
      KidsAudio.pop();
      KidsAudio.speak(this.gs.promptText || "", this.gs.voiceKey);
      this.stageEl?.querySelectorAll('.choice-card[data-correct="1"]').forEach((c) => {
        c.classList.add("hint-glow");
        setTimeout(() => c.classList.remove("hint-glow"), 2500);
      });
    });

    // Kutlama modalı butonları
    document.getElementById("cel-btn-next")?.addEventListener("click", () => {
      KidsAudio.pop();
      const nextLvl = this.levelNum < 30 ? this.levelNum + 1 : 1;
      const nextMode = this.gameMeta.modes[(nextLvl - 1) % this.gameMeta.modes.length].id;
      this.launchGame(this.activeGameId, nextLvl, nextMode);
    });

    document.getElementById("cel-btn-rooms")?.addEventListener("click", () => {
      KidsAudio.pop();
      document.getElementById("celebration-overlay")?.classList.add("hidden");
      this.openRoomsModal();
    });

    document.getElementById("cel-btn-hub")?.addEventListener("click", () => {
      KidsAudio.pop();
      document.getElementById("celebration-overlay")?.classList.add("hidden");
      this.state = "HUB";
      this.renderHubGames();
      this.showScreen("hub-screen");
    });
  }
}

window.addEventListener("DOMContentLoaded", () => {
  if (!document.getElementById("game-stage")) return;
  window.kidsPortal = new KidsGamesPortal();
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("sw.js")
      .then((reg) => reg.update())
      .catch(() => {});
  }
});
