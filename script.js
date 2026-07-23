(function () {
  const envelopeScreen = document.getElementById("envelope-screen");
  const openButton = document.getElementById("open-letter");
  const site = document.getElementById("site");
  const petalLayer = document.getElementById("petal-layer");
  const burstLayer = document.getElementById("burst-layer");
  const popLayer = document.getElementById("pop-layer");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isSmallScreen = window.matchMedia("(max-width: 640px)").matches;
  const MAX_BITS = isSmallScreen ? 18 : 26;

  const HEART_SVG =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-6.2-4.35-9.33-8.08C.8 10.7 1.1 7.4 3.4 5.7c2-1.5 4.7-1.1 6.2.7L12 9l2.4-2.6c1.5-1.8 4.2-2.2 6.2-.7 2.3 1.7 2.6 5 .73 7.22C18.2 16.65 12 21 12 21z" fill="currentColor"/></svg>';

  const PETAL_SVG =
    '<svg viewBox="0 0 24 32" aria-hidden="true"><ellipse cx="12" cy="16" rx="9" ry="14" fill="currentColor"/><ellipse cx="12" cy="16" rx="3.2" ry="12" fill="#fff8f4" opacity="0.35"/></svg>';

  const PETAL2_SVG =
    '<svg viewBox="0 0 24 32" aria-hidden="true"><path d="M12 2C20 8 22 20 14 30C10 24 4 14 12 2Z" fill="currentColor"/><path d="M12 4C10 14 11 22 14 28" stroke="#fff8f4" stroke-width="1" opacity="0.3" fill="none"/></svg>';

  const LEAF_SVG =
    '<svg viewBox="0 0 28 40" aria-hidden="true"><path d="M14 2C6 12 4 24 14 38C24 24 22 12 14 2Z" fill="currentColor"/><path d="M14 8v26" stroke="#fff8f4" stroke-width="1.2" opacity="0.35" fill="none"/></svg>';

  const SPARKLE_SVG =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5Z" fill="currentColor"/></svg>';

  // Layered rose: 6 outer petals + 5 inner petals + gold center. Each petal path
  // carries .f-petal/--i so the pop layer can bloom them one by one; the placement
  // transforms live on wrapper <g>s so CSS transform animation doesn't clobber them.
  const ROSE_SVG = (function () {
    const petal = "M32 4C41 10 43 22 32 31C21 22 23 10 32 4Z";
    let out = '<svg viewBox="0 0 64 64" aria-hidden="true">';
    for (let i = 0; i < 6; i += 1) {
      out +=
        '<g transform="rotate(' + i * 60 + ' 32 32)">' +
        '<path class="f-petal" style="--i:' + i + '" d="' + petal + '" fill="currentColor"/>' +
        "</g>";
    }
    for (let i = 0; i < 5; i += 1) {
      out +=
        '<g transform="rotate(' + (36 + i * 72) + ' 32 32) translate(32 32) scale(0.66) translate(-32 -32)">' +
        '<path class="f-petal" style="--i:' + (6 + i) + '" d="' + petal + '" fill="currentColor"/>' +
        '<path d="' + petal + '" fill="#fff8f4" opacity="0.3"/>' +
        "</g>";
    }
    out +=
      '<circle cx="32" cy="32" r="6.5" fill="#f4d27a"/>' +
      '<circle cx="30" cy="30" r="2.2" fill="#fff8f4" opacity="0.6"/>' +
      '<circle cx="27" cy="32" r="1.1" fill="#d4a017"/>' +
      '<circle cx="34" cy="28" r="1.1" fill="#d4a017"/>' +
      '<circle cx="36" cy="34" r="1.1" fill="#d4a017"/>' +
      '<circle cx="31" cy="36" r="1.1" fill="#d4a017"/>' +
      "</svg>";
    return out;
  })();

  // Sakura: 5 notched petals with a faint vein line.
  const SAKURA_SVG = (function () {
    const petal = "M28 7L32 12L36 7C42 10 43 20 32 30C21 20 22 10 28 7Z";
    let out = '<svg viewBox="0 0 64 64" aria-hidden="true">';
    for (let i = 0; i < 5; i += 1) {
      out +=
        '<g transform="rotate(' + i * 72 + ' 32 32)">' +
        '<path class="f-petal" style="--i:' + i + '" d="' + petal + '" fill="currentColor"/>' +
        '<path d="M32 13L32 27" stroke="#fff8f4" stroke-width="1" opacity="0.4" fill="none"/>' +
        "</g>";
    }
    out +=
      '<circle cx="32" cy="32" r="4.5" fill="#f4d27a"/>' +
      '<circle cx="29" cy="30" r="1" fill="#d4a017"/>' +
      '<circle cx="35" cy="31" r="1" fill="#d4a017"/>' +
      '<circle cx="32" cy="35" r="1" fill="#d4a017"/>' +
      "</svg>";
    return out;
  })();

  let ambientTimer = null;
  let ambientDense = false;

  /* Background music via a hidden YouTube embed — streamed through YouTube's
     official player, not downloaded. Autoplay-with-sound needs a user
     gesture, so playback starts on the first tap/click anywhere. */
  const musicToggle = document.getElementById("music-toggle");
  const YT_VIDEO_ID = "YFgtSaxQFb4";
  let ytPlayer = null;
  let ytReady = false;
  let musicWanted = false;
  let musicStarted = false;
  let musicMuted = false;

  window.onYouTubeIframeAPIReady = function () {
    ytPlayer = new YT.Player("yt-audio-player", {
      videoId: YT_VIDEO_ID,
      playerVars: {
        autoplay: 0,
        controls: 0,
        disablekb: 1,
        modestbranding: 1,
        rel: 0,
        playsinline: 1,
        loop: 1,
        playlist: YT_VIDEO_ID,
      },
      events: {
        onReady: function () {
          ytReady = true;
          if (musicWanted) startMusic();
        },
      },
    });
  };

  function startMusic() {
    if (musicStarted || !ytReady || !ytPlayer) return;
    musicStarted = true;
    ytPlayer.playVideo();
    if (musicToggle) musicToggle.classList.add("is-playing");
  }

  function requestMusic() {
    if (musicWanted) return;
    musicWanted = true;
    startMusic();
  }

  function toggleMusic() {
    if (!ytPlayer) return;
    musicMuted = !musicMuted;
    if (musicMuted) {
      ytPlayer.mute();
    } else {
      ytPlayer.unMute();
    }
    if (musicToggle) {
      musicToggle.classList.toggle("is-muted", musicMuted);
      musicToggle.setAttribute("aria-pressed", String(musicMuted));
      musicToggle.setAttribute("aria-label", musicMuted ? "Unmute music" : "Mute music");
    }
  }

  function pickFloral() {
    const roll = Math.random();
    if (roll < 0.1) return { kind: "heart", html: HEART_SVG, cls: "float-bit--heart" };
    if (roll < 0.22) return { kind: "flower", html: ROSE_SVG, cls: "float-bit--flower" };
    if (roll < 0.37) return { kind: "flower", html: SAKURA_SVG, cls: "float-bit--flower" };
    if (roll < 0.52) return { kind: "leaf", html: LEAF_SVG, cls: "float-bit--leaf" };
    if (roll < 0.62) return { kind: "sparkle", html: SPARKLE_SVG, cls: "float-bit--sparkle" };
    return {
      kind: "petal",
      html: Math.random() < 0.5 ? PETAL_SVG : PETAL2_SVG,
      cls: "float-bit--petal",
    };
  }

  function startAmbientFlorals(dense) {
    if (reduceMotion || !petalLayer) return;
    ambientDense = !!dense;

    const initial = dense ? 16 : 12;
    for (let i = 0; i < initial; i += 1) {
      createFloatingBit(i * 220);
    }

    if (ambientTimer) window.clearInterval(ambientTimer);
    ambientTimer = window.setInterval(
      function () {
        if (document.hidden) return;
        createFloatingBit(0);
        if (ambientDense && Math.random() > 0.45) createFloatingBit(180);
      },
      dense ? 700 : 1100
    );
  }

  function createFloatingBit(delay) {
    if (petalLayer.childElementCount > MAX_BITS) return;

    const pick = pickFloral();
    const bit = document.createElement("span");
    const sway = 1 + Math.floor(Math.random() * 3);
    const tint = Math.floor(Math.random() * 4) + 1;

    const depthRoll = Math.random();
    let depth = "depth-mid";
    let sizeMul = 1;
    let durMul = 1;
    let opacity = 0.55 + Math.random() * 0.35;
    if (depthRoll < 0.25) {
      depth = "depth-near";
      sizeMul = 1.3;
      durMul = 0.75;
      opacity = 0.8 + Math.random() * 0.15;
    } else if (depthRoll > 0.75) {
      depth = "depth-far";
      sizeMul = 0.6;
      durMul = 1.4;
      opacity = 0.35 + Math.random() * 0.15;
    }

    bit.className = "float-bit " + pick.cls + " sway-" + sway + " tint-" + tint + " " + depth;
    bit.innerHTML = '<span class="float-inner">' + pick.html + "</span>";

    const left = Math.random() * 100;
    const duration = (8 + Math.random() * 10) * durMul;
    let size = 14 + Math.random() * 16;
    if (pick.kind === "flower") size = 22 + Math.random() * 18;
    if (pick.kind === "sparkle") size = 8 + Math.random() * 6;
    size *= sizeMul;

    const drift = (Math.random() * 160 - 80).toFixed(1) + "px";
    const spin = (220 + Math.random() * 280).toFixed(0) + "deg";

    bit.style.left = left + "%";
    bit.style.width = size.toFixed(1) + "px";
    bit.style.height = (size * (pick.kind === "petal" || pick.kind === "leaf" ? 1.35 : 1)).toFixed(1) + "px";
    bit.style.setProperty("--drift-x", drift);
    bit.style.setProperty("--spin", spin);
    bit.style.setProperty("--fall-dur", duration.toFixed(2) + "s");
    bit.style.animationDelay = delay + "ms";
    bit.style.opacity = String(opacity);

    petalLayer.appendChild(bit);
    window.setTimeout(function () {
      bit.remove();
    }, (duration + delay / 1000) * 1000 + 600);
  }

  /* Canvas fireworks — used for the open-moment sparkle bursts. */
  let fxCanvas = null;
  let fxCtx = null;
  let fxDpr = 1;
  let fxRunning = false;
  const fxParticles = [];
  const FX_COLORS = ["#f4d27a", "#e8a0a8", "#c45c6a", "#fff8f4", "#8fae8b"];

  function initFxCanvas() {
    fxCanvas = document.getElementById("fx-canvas");
    if (!fxCanvas || !fxCanvas.getContext) return false;
    fxCtx = fxCanvas.getContext("2d");
    fxDpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = function () {
      fxCanvas.width = Math.round(window.innerWidth * fxDpr);
      fxCanvas.height = Math.round(window.innerHeight * fxDpr);
    };
    resize();
    window.addEventListener("resize", resize);
    return true;
  }

  function fireworkBurst(xFrac, yFrac, count) {
    if (reduceMotion) return;
    if (!fxCtx && !initFxCanvas()) return;

    const cx = window.innerWidth * xFrac * fxDpr;
    const cy = window.innerHeight * yFrac * fxDpr;
    for (let i = 0; i < count; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (1.5 + Math.random() * 4.5) * fxDpr;
      fxParticles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1 * fxDpr,
        life: 1,
        decay: 0.008 + Math.random() * 0.012,
        color: FX_COLORS[Math.floor(Math.random() * FX_COLORS.length)],
        size: (1.2 + Math.random() * 2.2) * fxDpr,
        twinkle: 0.8 + Math.random() * 2,
        t: Math.random() * Math.PI * 2,
      });
    }

    if (!fxRunning) {
      fxRunning = true;
      window.requestAnimationFrame(fxLoop);
    }
  }

  function fxLoop() {
    fxCtx.clearRect(0, 0, fxCanvas.width, fxCanvas.height);
    const gravity = 0.05 * fxDpr;

    for (let i = fxParticles.length - 1; i >= 0; i -= 1) {
      const p = fxParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.985;
      p.vy = p.vy * 0.985 + gravity;
      p.t += p.twinkle * 0.3;
      p.life -= p.decay;
      if (p.life <= 0) {
        fxParticles.splice(i, 1);
        continue;
      }

      const alpha = Math.max(0, p.life * (0.6 + 0.4 * Math.sin(p.t)));
      fxCtx.fillStyle = p.color;
      // Soft halo behind each dot fakes a glow without shadowBlur.
      fxCtx.globalAlpha = alpha * 0.3;
      fxCtx.beginPath();
      fxCtx.arc(p.x, p.y, p.size * 2.4, 0, Math.PI * 2);
      fxCtx.fill();
      fxCtx.globalAlpha = alpha;
      fxCtx.beginPath();
      fxCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      fxCtx.fill();
    }

    fxCtx.globalAlpha = 1;
    if (fxParticles.length) {
      window.requestAnimationFrame(fxLoop);
    } else {
      fxRunning = false;
      fxCtx.clearRect(0, 0, fxCanvas.width, fxCanvas.height);
    }
  }

  function spawnBurst() {
    if (!burstLayer) return;
    const total = reduceMotion ? 10 : 22;

    for (let i = 0; i < total; i += 1) {
      const bit = document.createElement("span");
      const angle = (Math.PI * 2 * i) / total + Math.random() * 0.35;
      const distance = 90 + Math.random() * 200;
      const bx = Math.cos(angle) * distance;
      const by = Math.sin(angle) * distance - 50;
      const roll = Math.random();
      let kind = "petal";

      if (roll < 0.22) kind = "heart";
      else if (roll < 0.55) kind = "flower";
      else if (roll < 0.7) kind = "leaf";

      bit.className = "burst-bit burst-bit--" + kind + " tint-" + (1 + Math.floor(Math.random() * 4));
      if (kind === "heart") bit.innerHTML = HEART_SVG;
      else if (kind === "flower") bit.innerHTML = Math.random() < 0.5 ? ROSE_SVG : SAKURA_SVG;
      else if (kind === "leaf") bit.innerHTML = LEAF_SVG;
      else bit.innerHTML = Math.random() < 0.5 ? PETAL_SVG : PETAL2_SVG;

      const size = kind === "flower" ? 28 + Math.random() * 16 : 16 + Math.random() * 14;
      bit.style.width = size + "px";
      bit.style.height = size + "px";
      bit.style.setProperty("--bx", bx.toFixed(1) + "px");
      bit.style.setProperty("--by", by.toFixed(1) + "px");
      bit.style.setProperty("--spin", (Math.random() * 420 - 210).toFixed(0) + "deg");
      bit.style.animationDelay = Math.random() * 160 + "ms";

      burstLayer.appendChild(bit);
      window.setTimeout(function () {
        bit.remove();
      }, 1400);
    }
  }

  function spawnOpenPops() {
    if (!popLayer) return;

    const items = [];
    const flowerCount = reduceMotion ? 4 : 8;
    const heartCount = reduceMotion ? 4 : 8;

    for (let i = 0; i < flowerCount; i += 1) {
      items.push({ kind: "flower", html: Math.random() < 0.5 ? ROSE_SVG : SAKURA_SVG });
    }
    for (let i = 0; i < heartCount; i += 1) {
      items.push({ kind: "heart", html: HEART_SVG });
    }

    // Shuffle so flowers and hearts interleave
    for (let i = items.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = items[i];
      items[i] = items[j];
      items[j] = tmp;
    }

    items.forEach(function (item, index) {
      const el = document.createElement("span");
      const angle = (Math.PI * 2 * index) / items.length + Math.random() * 0.25;
      const radius = 28 + Math.random() * 38;
      const x = 50 + Math.cos(angle) * radius * 0.55;
      const y = 46 + Math.sin(angle) * radius * 0.42;
      const size = item.kind === "flower" ? 56 + Math.random() * 48 : 42 + Math.random() * 36;
      const floatX = (Math.cos(angle) * (40 + Math.random() * 90)).toFixed(1) + "px";
      const floatY = (-60 - Math.random() * 120).toFixed(1) + "px";

      el.className = "pop-bit pop-bit--" + item.kind;
      el.innerHTML = item.html;
      el.style.left = x.toFixed(1) + "%";
      el.style.top = y.toFixed(1) + "%";
      el.style.width = size.toFixed(0) + "px";
      el.style.height = size.toFixed(0) + "px";
      el.style.setProperty("--float-x", floatX);
      el.style.setProperty("--float-y", floatY);
      el.style.animationDelay = index * 55 + "ms";

      popLayer.appendChild(el);
      window.setTimeout(function () {
        el.remove();
      }, 2200);
    });

    // One big center rose + heart for a clear "pop" — the rose blooms petal by petal
    const centerFlower = document.createElement("span");
    centerFlower.className = "pop-bit pop-bit--flower pop-bit--hero";
    centerFlower.innerHTML = ROSE_SVG;
    centerFlower.style.left = "50%";
    centerFlower.style.top = "44%";
    centerFlower.style.width = "110px";
    centerFlower.style.height = "110px";
    centerFlower.style.setProperty("--float-x", "0px");
    centerFlower.style.setProperty("--float-y", "-40px");
    centerFlower.style.animationDelay = "0ms";
    popLayer.appendChild(centerFlower);

    const centerHeart = document.createElement("span");
    centerHeart.className = "pop-bit pop-bit--heart pop-bit--hero";
    centerHeart.innerHTML = HEART_SVG;
    centerHeart.style.left = "50%";
    centerHeart.style.top = "52%";
    centerHeart.style.width = "72px";
    centerHeart.style.height = "72px";
    centerHeart.style.setProperty("--float-x", "0px");
    centerHeart.style.setProperty("--float-y", "-30px");
    centerHeart.style.animationDelay = "90ms";
    popLayer.appendChild(centerHeart);

    window.setTimeout(function () {
      centerFlower.remove();
      centerHeart.remove();
    }, 2200);
  }

  function revealOnScroll() {
    const nodes = document.querySelectorAll(".reveal");
    if (!nodes.length) return;

    if (reduceMotion || !("IntersectionObserver" in window)) {
      nodes.forEach(function (node) {
        node.classList.add("is-shown");
      });
      return;
    }

    const observer = new IntersectionObserver(
      function (entries) {
        entries
          .filter(function (entry) {
            return entry.isIntersecting;
          })
          .forEach(function (entry, index) {
            entry.target.style.setProperty("--reveal-delay", index * 90 + "ms");
            entry.target.classList.add("is-shown");
            observer.unobserve(entry.target);
          });
      },
      { threshold: 0.16, rootMargin: "0px 0px -6% 0px" }
    );

    nodes.forEach(function (node) {
      observer.observe(node);
    });
  }

  function openLetter() {
    if (!envelopeScreen || !site || !openButton || openButton.classList.contains("is-opening")) {
      return;
    }

    openButton.classList.add("is-opening");

    if (reduceMotion) {
      spawnOpenPops();
      spawnBurst();
    } else {
      // Flap opens 0–0.7s, seal breaks 0–0.5s, letter slides out 0.45–1.2s;
      // pops, petals and fireworks punctuate the letter emerging.
      window.setTimeout(spawnOpenPops, 500);
      window.setTimeout(spawnBurst, 500);
      window.setTimeout(function () {
        fireworkBurst(0.5, 0.42, 70);
      }, 600);
      window.setTimeout(function () {
        fireworkBurst(0.28, 0.3, 45);
      }, 850);
      window.setTimeout(function () {
        fireworkBurst(0.72, 0.28, 45);
      }, 1050);
    }

    const leaveDelay = reduceMotion ? 180 : 1450;
    window.setTimeout(function () {
      envelopeScreen.classList.add("is-leaving");
      site.hidden = false;
      site.classList.add("is-visible");
      document.body.style.overflow = "";
      revealOnScroll();
      startAmbientFlorals(true);

      window.setTimeout(function () {
        envelopeScreen.remove();
        if (burstLayer) burstLayer.remove();
        if (popLayer) popLayer.remove();
      }, reduceMotion ? 220 : 2000);
    }, leaveDelay);
  }

  function init() {
    document.body.style.overflow = "hidden";
    startAmbientFlorals(false);

    if (openButton) {
      openButton.addEventListener("click", openLetter);
      openButton.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openLetter();
        }
      });
    }

    document.addEventListener("keydown", function (event) {
      if (event.key === "Enter" && envelopeScreen && !envelopeScreen.classList.contains("is-leaving")) {
        openLetter();
      }
    });

    ["pointerdown", "keydown"].forEach(function (type) {
      document.addEventListener(type, requestMusic, { once: true, passive: true });
    });

    if (musicToggle) {
      musicToggle.addEventListener("click", toggleMusic);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
