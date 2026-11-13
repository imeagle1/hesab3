/* حساب‌یار — hy-extra.js (companion layer, v2.1, by iramoAi)
 * شامل: دکمه شناور اسکن با دوربین، اسکنر بارکد (دوربین/عکس)،
 * ورود گروهی کالا، مدیریت دسته‌ها — بدون تغییر بقیه رابط برنامه */
(function () {
  "use strict";
  if (window.__hyExtraLoaded) return;
  window.__hyExtraLoaded = true;

  /* ---------------- store helpers ---------------- */
  function store() { return window.__hyStore; }
  function settings() {
    try { return store().getState().settings || {}; } catch (e) { return {}; }
  }
  function soundOn() { return settings().soundEnabled !== false; }

  /* ---------------- tiny DOM helpers ---------------- */
  function el(tag, attrs) {
    var node = document.createElement(tag);
    attrs = attrs || {};
    for (var k in attrs) {
      if (k === "style" && typeof attrs[k] === "object") Object.assign(node.style, attrs[k]);
      else if (k === "class") node.className = attrs[k];
      else if (k === "text") node.textContent = attrs[k];
      else if (k === "html") node.innerHTML = attrs[k];
      else if (k.slice(0, 2) === "on" && typeof attrs[k] === "function") node.addEventListener(k.slice(2), attrs[k]);
      else if (attrs[k] !== undefined && attrs[k] !== null && attrs[k] !== false) node.setAttribute(k, attrs[k] === true ? "" : attrs[k]);
    }
    for (var i = 2; i < arguments.length; i++) {
      var c = arguments[i];
      if (c === null || c === undefined) continue;
      if (Array.isArray(c)) { c.forEach(function (x) { if (x) node.appendChild(x); }); }
      else if (typeof c === "string") node.appendChild(document.createTextNode(c));
      else node.appendChild(c);
    }
    return node;
  }
  function svgCam(cls) {
    var ns = "http://www.w3.org/2000/svg";
    var s = document.createElementNS(ns, "svg");
    s.setAttribute("viewBox", "0 0 24 24"); s.setAttribute("fill", "none");
    s.setAttribute("stroke", "currentColor"); s.setAttribute("stroke-width", "2");
    s.setAttribute("stroke-linecap", "round"); s.setAttribute("stroke-linejoin", "round");
    if (cls) s.setAttribute("class", cls);
    var p1 = document.createElementNS(ns, "path");
    p1.setAttribute("d", "M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z");
    var c = document.createElementNS(ns, "circle");
    c.setAttribute("cx", "12"); c.setAttribute("cy", "13"); c.setAttribute("r", "3");
    s.appendChild(p1); s.appendChild(c);
    return s;
  }
  function svgClose(cls) {
    var ns = "http://www.w3.org/2000/svg";
    var s = document.createElementNS(ns, "svg");
    s.setAttribute("viewBox", "0 0 24 24"); s.setAttribute("fill", "none");
    s.setAttribute("stroke", "currentColor"); s.setAttribute("stroke-width", "2");
    s.setAttribute("stroke-linecap", "round");
    if (cls) s.setAttribute("class", cls);
    [["18", "6", "6", "18"], ["6", "6", "18", "18"]].forEach(function (a) {
      var p = document.createElementNS(ns, "path");
      p.setAttribute("d", "M" + a[0] + " " + a[1] + " " + a[2] + " " + a[3]);
      s.appendChild(p);
    });
    return s;
  }

  /* ---------------- beep ---------------- */
  var hyAC = null;
  function tone(freq, dur, type, gain, delay) {
    try {
      hyAC = hyAC || new (window.AudioContext || window.webkitAudioContext)();
      if (hyAC.state === "suspended") hyAC.resume();
      var o = hyAC.createOscillator(), g = hyAC.createGain();
      o.type = type; o.frequency.value = freq;
      g.gain.setValueAtTime(1e-4, hyAC.currentTime + delay);
      g.gain.exponentialRampToValueAtTime(gain, hyAC.currentTime + delay + 0.012);
      g.gain.exponentialRampToValueAtTime(1e-4, hyAC.currentTime + delay + dur);
      o.connect(g); g.connect(hyAC.destination);
      o.start(hyAC.currentTime + delay); o.stop(hyAC.currentTime + delay + dur + 0.05);
    } catch (e) {}
  }
  function beepOk() { if (!soundOn()) return; tone(1180, 0.09, "sine", 0.18, 0); tone(1560, 0.1, "sine", 0.14, 0.07); }
  function beepErr() { if (!soundOn()) return; tone(190, 0.22, "square", 0.1, 0); tone(150, 0.24, "square", 0.08, 0.14); }

  /* ---------------- inject styles ---------------- */
  var CSS = `
  .hy-fab{position:fixed;left:18px;bottom:18px;z-index:1200;display:none;align-items:center;gap:8px;
    padding:12px 18px;border:none;border-radius:999px;cursor:pointer;color:#fff;
    background:linear-gradient(135deg,#f97e2b,#ef7327);box-shadow:0 10px 24px -8px rgba(239,115,39,.55);
    font:inherit;font-size:13px;font-weight:700;transition:transform .15s,box-shadow .15s,opacity .15s}
  .hy-fab:hover{transform:translateY(-2px);box-shadow:0 14px 28px -8px rgba(239,115,39,.65)}
  .hy-fab svg{width:20px;height:20px}
  body[data-hy-scan="1"] .hy-fab{display:flex}
  .hy-overlay{position:fixed;inset:0;z-index:2000;background:rgba(26,19,12,.55);backdrop-filter:blur(3px);
    display:flex;align-items:center;justify-content:center;padding:16px;font-family:inherit}
  .hy-box{width:100%;max-width:560px;max-height:92vh;overflow:auto;border-radius:20px;border:1px solid var(--border,#e5ddce);
    background:var(--card,#fdfaf4);color:var(--foreground,#33261a);box-shadow:0 24px 64px -16px rgba(0,0,0,.35);position:relative}
  .hy-box-hd{display:flex;align-items:center;gap:10px;padding:14px 18px;border-bottom:1px solid var(--border,#e5ddce);position:sticky;top:0;
    background:var(--card,#fdfaf4);z-index:2}
  .hy-box-hd svg{width:20px;height:20px;color:var(--primary,#ef7327);flex-shrink:0}
  .hy-box-hd b{font-size:15px;flex:1;padding-left:40px}
  .hy-x{position:absolute;left:12px;top:10px;display:flex;align-items:center;justify-content:center;width:32px;height:32px;
    border:none;border-radius:10px;cursor:pointer;background:var(--secondary,#efe8da);color:var(--muted-foreground,#8a7a66)}
  .hy-x svg{width:16px;height:16px}
  .hy-x:hover{background:var(--primary,#ef7327);color:#fff}
  .hy-bd{padding:16px 18px 18px}
  .hy-view{position:relative;border-radius:16px;overflow:hidden;background:#141210;aspect-ratio:4/3}
  .hy-view video{width:100%;height:100%;object-fit:cover;display:block}
  .hy-corner{position:absolute;width:26px;height:26px;border:3px solid #ef7327;z-index:3}
  .hy-c1{top:10px;right:10px;border-left:none;border-bottom:none;border-radius:0 10px 0 0}
  .hy-c2{top:10px;left:10px;border-right:none;border-bottom:none;border-radius:10px 0 0 0}
  .hy-c3{bottom:10px;right:10px;border-left:none;border-top:none;border-radius:0 0 10px 0}
  .hy-c4{bottom:10px;left:10px;border-right:none;border-top:none;border-radius:0 0 0 10px}
  .hy-line{position:absolute;left:8%;right:8%;height:2px;background:linear-gradient(90deg,transparent,#ff8b42,transparent);
    bottom:22%;animation:hy-scanline 1.9s ease-in-out infinite;z-index:3;opacity:.9}
  @keyframes hy-scanline{0%,100%{bottom:16%}50%{bottom:82%}}
  .hy-cam-msg{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;
    color:#d8cfc2;font-size:13px;text-align:center;padding:24px;z-index:4;line-height:2}
  .hy-flash{position:absolute;inset:0;background:rgba(255,255,255,.35);opacity:0;pointer-events:none;z-index:5}
  .hy-row{display:flex;gap:8px;margin-top:12px;align-items:center;flex-wrap:wrap}
  .hy-row select{flex:1;min-width:160px;height:40px;border-radius:12px;border:1px solid var(--border,#e5ddce);
    background:var(--background,#f6f1e7);color:inherit;padding:0 10px;font:inherit;font-size:13px}
  .hy-btn{height:40px;padding:0 14px;border-radius:12px;border:1px solid var(--border,#e5ddce);cursor:pointer;
    background:var(--card,#fdfaf4);color:inherit;font:inherit;font-size:13px;font-weight:600;display:inline-flex;align-items:center;gap:6px}
  .hy-btn:hover{border-color:var(--primary,#ef7327);color:var(--primary,#ef7327)}
  .hy-btn.primary{background:var(--primary,#ef7327);border-color:var(--primary,#ef7327);color:#fff}
  .hy-btn.primary:hover{filter:brightness(1.06);color:#fff}
  .hy-btn.danger{color:#dc2626;border-color:#fca5a5}
  .hy-btn:disabled{opacity:.5;cursor:not-allowed}
  .hy-status{margin-top:10px;font-size:12px;color:var(--muted-foreground,#8a7a66);text-align:center;line-height:2}
  .hy-chip{margin-top:10px;display:none;align-items:center;justify-content:center;gap:10px;background:var(--secondary,#efe8da);
    border-radius:12px;padding:10px 12px;font-size:13px;font-weight:700}
  .hy-chip.show{display:flex}
  .hy-chip .num{direction:ltr;font-variant-numeric:tabular-nums;letter-spacing:1px}
  .hy-hint{margin-top:12px;padding-top:10px;border-top:1px dashed var(--border,#e5ddce);font-size:11px;color:var(--muted-foreground,#8a7a66);line-height:2;text-align:center}
  .hy-input{width:100%;height:42px;border-radius:12px;border:1px solid var(--border,#e5ddce);background:var(--background,#f6f1e7);
    color:inherit;padding:0 12px;font:inherit;font-size:13px;box-sizing:border-box}
  textarea.hy-input{height:120px;padding:10px 12px;resize:vertical;line-height:1.9}
  .hy-label{font-size:12px;font-weight:700;margin:14px 0 6px;display:block}
  .hy-preview{margin-top:10px;border-radius:12px;background:var(--secondary,#efe8da);padding:12px;font-size:12px;line-height:2.2}
  .hy-cat-item{display:flex;align-items:center;gap:8px;padding:8px 10px;border:1px solid var(--border,#e5ddce);border-radius:12px;margin-bottom:8px}
  .hy-cat-item b{flex:1;font-size:13px}
  .hy-count{font-size:11px;background:var(--secondary,#efe8da);border-radius:999px;padding:2px 10px;color:var(--muted-foreground,#8a7a66)}
  @media print{.hy-fab,.hy-overlay{display:none!important}}
  @media (max-width:640px){.hy-fab{left:12px;bottom:12px;padding:11px 14px}.hy-overlay{padding:8px}.hy-box{max-height:96vh}}
  `;
  function injectStyles() {
    if (document.getElementById("hy-extra-style")) return;
    var st = document.createElement("style");
    st.id = "hy-extra-style";
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  /* ---------------- dispatch a scan into the app ---------------- */
  function dispatchGlobalScan(code) {
    try { if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); } catch (e) {}
    var target = document.body;
    for (var i = 0; i < code.length; i++) {
      target.dispatchEvent(new KeyboardEvent("keydown", { key: code[i], bubbles: true, cancelable: true }));
    }
    target.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }));
  }
  function fillBarcodeInput(input, code) {
    try {
      var setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
      setter.call(input, code);
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }));
    } catch (e) { input.value = code; }
  }

  /* ================= camera scanner ================= */
  var SCAN = { stream: null, running: false, detector: null, detectorKind: "native", zxReader: null, timer: null, targetInput: null, devices: [], devIdx: -1, overlay: null };

  function loadScriptOnce(src, id) {
    return new Promise(function (resolve) {
      if (document.getElementById(id)) return resolve(!!window.ZXing || undefined);
      var s = document.createElement("script");
      s.id = id; s.src = src;
      s.onload = function () { resolve(true); };
      s.onerror = function () { resolve(false); };
      document.head.appendChild(s);
    });
  }
  function ensureDetector() {
    if (typeof window.BarcodeDetector === "function") {
      SCAN.detectorKind = "native";
      try {
        SCAN.detector = new window.BarcodeDetector({
          formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39", "code_93", "itf", "codabar", "qr_code"]
        });
      } catch (e) {
        SCAN.detector = new window.BarcodeDetector();
      }
      return Promise.resolve(true);
    }
    return loadScriptOnce("/hy-zxing.js", "hy-zxing-lib").then(function (ok) {
      if (!ok || typeof window.ZXing === "undefined" || !window.ZXing.BrowserMultiFormatReader) return false;
      SCAN.detectorKind = "zxing";
      try { SCAN.zxReader = new window.ZXing.BrowserMultiFormatReader(null, 120); } catch (e) { SCAN.zxReader = new window.ZXing.BrowserMultiFormatReader(); }
      return true;
    });
  }
  function nativeDetect(videoEl) {
    return SCAN.detector.detect(videoEl);
  }
  function zxingDetectOnce(videoEl) {
    return new Promise(function (resolve) {
      try {
        var canvas = document.createElement("canvas");
        canvas.width = videoEl.videoWidth; canvas.height = videoEl.videoHeight;
        if (!canvas.width || !canvas.height) return resolve([]);
        canvas.getContext("2d").drawImage(videoEl, 0, 0);
        var lum = new window.ZXing.HTMLCanvasElementLuminanceSource(canvas);
        var bmp = new window.ZXing.BinaryBitmap(new window.ZXing.HybridBinarizer(lum));
        var hints = new Map();
        if (window.ZXing.DecodeHintType) hints.set(window.ZXing.DecodeHintType.TRY_HARDER, true);
        var res = new window.ZXing.MultiFormatReader().decode(bmp, hints);
        resolve([{ rawValue: res.getText() }]);
      } catch (e) { resolve([]); }
    });
  }

  function stopCamera() {
    SCAN.running = false;
    if (SCAN.timer) { clearTimeout(SCAN.timer); SCAN.timer = null; }
    if (SCAN.zxReader) { try { SCAN.zxReader.reset(); } catch (e) {} }
    if (SCAN.stream) { SCAN.stream.getTracks().forEach(function (t) { t.stop(); }); SCAN.stream = null; }
  }
  function closeScanner() {
    stopCamera();
    if (SCAN.overlay) { SCAN.overlay.remove(); SCAN.overlay = null; }
  }

  function camErrorMessage(err) {
    var n = err && err.name;
    if (n === "NotAllowedError" || n === "PermissionDeniedError")
      return "دسترسی به دوربین داده نشد. از تنظیمات ویندوز (تنظیمات ← حریم خصوصی ← دوربین) و مرورگر اجازه دوربین را فعال کنید.";
    if (n === "NotFoundError" || n === "DevicesNotFoundError")
      return "هیچ دوربینی روی این سیستم پیدا نشد. اگر از دوربین موبایل استفاده می‌کنید (مثل Iriun Webcam)، مطمئن شوید برنامه آن اجراست.";
    if (n === "NotReadableError" || n === "TrackStartError")
      return "دوربین توسط برنامه دیگری اشغال شده است — آن برنامه را ببندید و دوباره تلاش کنید.";
    if (n === "OverconstrainedError")
      return "دوربین انتخاب‌شده در دسترس نیست؛ دوربین دیگری را از فهرست انتخاب کنید.";
    return "روشن کردن دوربین ناموفق بود: " + (err && err.message ? err.message : "خطای ناشناخته");
  }

  function listVideoInputs() {
    return navigator.mediaDevices.enumerateDevices().then(function (ds) {
      return ds.filter(function (d) { return d.kind === "videoinput"; });
    });
  }

  function startStream(videoEl, msgEl, deviceId) {
    stopCamera();
    var constraints = deviceId
      ? { video: { deviceId: { exact: deviceId }, width: { ideal: 1280 }, height: { ideal: 720 } } }
      : { video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } } };
    msgEl.textContent = "در حال روشن کردن دوربین…";
    return navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
      SCAN.stream = stream;
      videoEl.srcObject = stream;
      return videoEl.play().catch(function () {}).then(function () { return stream; });
    }).then(function (stream) {
      // after permission, refresh device labels
      return listVideoInputs().then(function (devices) {
        SCAN.devices = devices;
        if (SCAN.devIdx === -1 && stream.getVideoTracks()[0]) {
          var settings = stream.getVideoTracks()[0].getSettings();
          var i = devices.findIndex(function (d) { return d.deviceId === settings.deviceId; });
          SCAN.devIdx = Math.max(0, i);
        }
        return devices;
      });
    });
  }

  function detectLoop(videoEl, onCode) {
    if (!SCAN.running) return;
    var run = function () {
      if (!SCAN.running) return;
      var ready = videoEl.readyState >= 2 && videoEl.videoWidth > 0;
      var p = Promise.resolve([]);
      if (ready) {
        if (SCAN.detectorKind === "native" && SCAN.detector) p = nativeDetect(videoEl);
        else if (SCAN.detectorKind === "zxing") p = zxingDetectOnce(videoEl);
      }
      p.then(function (codes) {
        if (SCAN.running && codes && codes.length && codes[0].rawValue) onCode(String(codes[0].rawValue));
      }).catch(function () {});
      SCAN.timer = setTimeout(run, SCAN.detectorKind === "zxing" ? 160 : 130);
    };
    run();
  }

  function openScanner(opts) {
    opts = opts || {};
    if (SCAN.overlay) closeScanner();
    injectStyles();
    SCAN.targetInput = opts.targetInput || null;

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("این محیط به دوربین دسترسی ندارد. اگر فایل را مستقیم باز کرده‌اید، نسخه وب را با سرور همراه اجرا کنید (localhost).");
      return;
    }

    var flash = el("div", { class: "hy-flash" });
    var video = el("video", { playsinline: "true", muted: "true", autoplay: "true" });
    var msg = el("div", { class: "hy-cam-msg", text: "در حال آماده‌سازی…" });
    var view = el("div", { class: "hy-view" },
      video, msg, flash,
      el("span", { class: "hy-corner hy-c1" }), el("span", { class: "hy-corner hy-c2" }),
      el("span", { class: "hy-corner hy-c3" }), el("span", { class: "hy-corner hy-c4" }),
      el("span", { class: "hy-line" }));

    var sel = el("select", { "aria-label": "انتخاب دوربین" });
    var status = el("div", { class: "hy-status", text: SCAN.targetInput ? "بارکد را اسکن کنید تا در فیلد بارکد ثبت شود" : "دوربین فعال است — بارکد را داخل کادر بگیرید" });
    var chip = el("div", { class: "hy-chip" });
    var chipCode = el("span", { class: "num" });
    var fileIn = el("input", { type: "file", accept: "image/*", style: { display: "none" } });

    var lastCode = "", lastAt = 0;
    function onCode(code) {
      var now = Date.now();
      if (code === lastCode && now - lastAt < 1500) return;
      lastCode = code; lastAt = now;
      beepOk();
      try { if (navigator.vibrate) navigator.vibrate(60); } catch (e) {}
      flash.style.transition = "none"; flash.style.opacity = ".5";
      requestAnimationFrame(function () { flash.style.transition = "opacity .35s"; flash.style.opacity = "0"; });
      chipCode.textContent = code;
      chip.classList.add("show");
      status.textContent = "بارکد خوانده شد ✓";
      if (SCAN.targetInput) {
        fillBarcodeInput(SCAN.targetInput, code);
        setTimeout(closeScanner, 450);
      } else {
        dispatchGlobalScan(code);
      }
    }

    function refreshSelect() {
      sel.innerHTML = "";
      if (!SCAN.devices.length) {
        sel.appendChild(el("option", { text: "دوربینی یافت نشد" }));
        return;
      }
      SCAN.devices.forEach(function (d, i) {
        sel.appendChild(el("option", { value: d.deviceId, text: d.label || ("دوربین " + (i + 1)) }));
      });
      if (SCAN.devIdx >= 0 && SCAN.devIdx < SCAN.devices.length) sel.selectedIndex = SCAN.devIdx;
    }
    sel.addEventListener("change", function () {
      SCAN.devIdx = SCAN.devices.findIndex(function (d) { return d.deviceId === sel.value; });
      startStream(video, msg, sel.value).then(function () {
        msg.style.display = "none";
        refreshSelect();
        status.textContent = "دوربین فعال است — بارکد را داخل کادر بگیرید";
      }).catch(function (err) {
        msg.style.display = "flex";
        msg.textContent = camErrorMessage(err);
        beepErr();
      });
    });

    fileIn.addEventListener("change", function () {
      var f = fileIn.files && fileIn.files[0];
      fileIn.value = "";
      if (!f) return;
      var go = function (detectFn) {
        detectFn().then(function (codes) {
          if (codes && codes.length && codes[0].rawValue) onCode(String(codes[0].rawValue));
          else { status.textContent = "در این عکس بارکدی پیدا نشد — عکس واضح‌تری بگیرید"; beepErr(); }
        }).catch(function () {
          status.textContent = "خواندن عکس ناموفق بود";
          beepErr();
        });
      };
      if (SCAN.detectorKind === "native" && SCAN.detector) {
        createImageBitmap(f).then(function (bmp) {
          return SCAN.detector.detect(bmp).then(function (codes) { bmp.close && bmp.close(); return codes; });
        }).then(function (codes) { go(function () { return Promise.resolve(codes); }); })
          .catch(function () { status.textContent = "خواندن عکس ناموفق بود"; beepErr(); });
      } else if (SCAN.detectorKind === "zxing" && SCAN.zxReader) {
        var url = URL.createObjectURL(f);
        SCAN.zxReader.decodeFromImageUrl(url).then(function (res) {
          URL.revokeObjectURL(url);
          go(function () { return Promise.resolve([{ rawValue: res.getText() }]); });
        }).catch(function () {
          URL.revokeObjectURL(url);
          status.textContent = "در این عکس بارکدی پیدا نشد — عکس واضح‌تری بگیرید";
          beepErr();
        });
      } else {
        status.textContent = "ماژول تشخیص بارکد آماده نیست";
        beepErr();
      }
    });

    var box = el("div", { class: "hy-box", dir: "rtl" },
      el("button", { class: "hy-x", "aria-label": "بستن", onclick: closeScanner }, svgClose("")),
      el("div", { class: "hy-box-hd" }, svgCam(""),
        el("b", { text: SCAN.targetInput ? "اسکن بارکد برای فرم" : "اسکن بارکد کالا" })),
      el("div", { class: "hy-bd" },
        view,
        el("div", { class: "hy-row" },
          sel,
          el("button", { class: "hy-btn", onclick: function () { fileIn.click(); } }, "اسکن از عکس"),
          el("button", { class: "hy-btn", title: "تازه‌سازی فهرست دوربین‌ها", onclick: function () { listVideoInputs().then(function (d) { SCAN.devices = d; refreshSelect(); }); } }, "↺")),
        fileIn,
        status, chip,
        el("div", { class: "hy-hint" },
          "دوربین موبایل هم کار می‌کند: با برنامه‌هایی مثل Iriun Webcam گوشی را وب‌کم کنید. برای انتخاب دوربین (مثلاً دوربین عقب)، از فهرست بالا استفاده کنید."),
        el("div", { class: "hy-row", style: { justifyContent: "center" } },
          el("button", { class: "hy-btn primary", onclick: closeScanner }, "پایان اسکن و بستن"))));

    var overlay = el("div", { class: "hy-overlay" }, box);
    overlay.addEventListener("keydown", function (e) { if (e.key === "Escape") closeScanner(); });
    document.body.appendChild(overlay);
    SCAN.overlay = overlay;
    setTimeout(function () { overlay.focus && overlay.focus(); }, 0);

    ensureDetector().then(function (ok) {
      if (!ok) {
        msg.style.display = "flex";
        msg.textContent = "هیچ موتور تشخیص بارکدی در دسترس نیست — لطفاً Google Chrome یا Microsoft Edge استفاده کنید یا فایل‌های برنامه را کامل منتقل کنید (فایل hy-zxing.js کنار index.html باشد).";
        return;
      }
      startStream(video, msg).then(function () {
        msg.style.display = "none";
        refreshSelect();
        SCAN.running = true;
        detectLoop(video, onCode);
      }).catch(function (err) {
        msg.style.display = "flex";
        msg.textContent = camErrorMessage(err);
        beepErr();
        listVideoInputs().then(function (d) { SCAN.devices = d; refreshSelect(); }).catch(function () {});
      });
    });
  }

  /* ================= floating scan button ================= */
  function ensureFab() {
    if (document.getElementById("hy-fab")) return;
    var fab = el("button", {
      id: "hy-fab", class: "hy-fab", type: "button",
      "aria-label": "اسکن بارکد با دوربین", title: "اسکن بارکد با دوربین",
      onclick: function () { openScanner(); }
    }, svgCam(""), "اسکن بارکد");
    document.body.appendChild(fab);
  }

  /* ================= bulk import ================= */
  function faDigits(s) {
    return String(s == null ? "" : s)
      .replace(/[۰-۹]/g, function (d) { return "۰۱۲۳۴۵۶۷۸۹".indexOf(d); })
      .replace(/[٠-٩]/g, function (d) { return "٠١٢٣٤٥٦٧٨٩".indexOf(d); });
  }
  function toNum(v) {
    var s = faDigits(v).replace(/[^\d.\-]/g, "");
    if (s === "" || s === "-" || s === ".") return null;
    var n = parseFloat(s);
    return isFinite(n) ? n : null;
  }
  var HEADER_MAP = {
    barcode: ["barcode", "barcod", "بارکد", "باركد"],
    name: ["name", "نام", "نام کالا", "نامکالا", "عنوان"],
    category: ["category", "cat", "دسته", "دسته‌بندی", "دسته بندی", "گروه"],
    unit: ["unit", "واحد"],
    purchaseprice: ["purchaseprice", "purchase", "buy", "قیمت خرید", "خرید"],
    saleprice: ["saleprice", "sale", "price", "قیمت فروش", "فروش"],
    stock: ["stock", "qty", "موجودی", "تعداد"],
    minstock: ["minstock", "min", "حد هشدار", "حد هشدار موجودی"]
  };
  function normalizeHeader(h) {
    var k = faDigits(h).trim().toLowerCase().replace(/[\s_\-]/g, "");
    for (var key in HEADER_MAP) {
      var list = HEADER_MAP[key];
      for (var i = 0; i < list.length; i++) {
        if (k === list[i].replace(/[\s_\-]/g, "").toLowerCase()) return key;
      }
    }
    return null;
  }
  function parseRows(text) {
    text = faDigits(text).replace(/^\uFEFF/, "").trim();
    if (!text) return { rows: [], errors: ["متنی وارد نشده است"] };
    var rows = [];
    if (text[0] === "[" || text[0] === "{") {
      try {
        var j = JSON.parse(text);
        var arr = Array.isArray(j) ? j : (j.products || []);
        arr.forEach(function (o) {
          rows.push({
            barcode: o.barcode ? String(o.barcode) : "",
            name: o.name ? String(o.name) : "",
            category: o.category ? String(o.category) : "",
            unit: o.unit ? String(o.unit) : "",
            purchasePrice: toNum(o.purchasePrice),
            salePrice: toNum(o.salePrice),
            stock: toNum(o.stock),
            minStock: toNum(o.minStock)
          });
        });
        return { rows: rows, errors: [] };
      } catch (e) { return { rows: [], errors: ["JSON نامعتبر است"] }; }
    }
    var lines = text.split(/\r?\n/).filter(function (l) { return l.trim() !== ""; });
    if (!lines.length) return { rows: [], errors: ["متنی وارد نشده است"] };
    var first = lines[0];
    var delim = (first.split("\t").length > first.split(";").length && first.split("\t").length > first.split(",").length) ? "\t" : (first.split(";").length > first.split(",").length ? ";" : ",");
    var head = first.split(delim).map(function (h) { return normalizeHeader(h); });
    if (!head.includes("name")) return { rows: [], errors: ["ستون «نام کالا» (name) در سطر اول پیدا نشد"] };
    var errors = [];
    for (var i = 1; i < lines.length; i++) {
      var cells = lines[i].split(delim);
      var row = {};
      head.forEach(function (h, ci) { if (h) row[h] = cells[ci]; });
      if (!row.name || !String(row.name).trim()) { errors.push("سطر " + (i + 1) + ": بدون نام — رد شد"); continue; }
      rows.push({
        barcode: row.barcode ? String(row.barcode).trim() : "",
        name: String(row.name).trim(),
        category: row.category ? String(row.category).trim() : "",
        unit: row.unit ? String(row.unit).trim() : "",
        purchasePrice: toNum(row.purchasePrice),
        salePrice: toNum(row.salePrice),
        stock: toNum(row.stock),
        minStock: toNum(row.minStock)
      });
    }
    return { rows: rows, errors: errors };
  }
  function templateCsv() {
    var head = "barcode,name,category,unit,purchasePrice,salePrice,stock,minStock";
    var sample = [
      "6260123456789,شیر پرچرب ۱ لیتری,لبنیات,شیشه,26000,31000,40,6",
      "6260987654321,سیب قرمز,میوه و تره‌بار,کیلوگرم,35000,48000,25,4",
      ",نان بربری,نان و غله,عدد,15000,20000,30,5"
    ].join("\n");
    return "\uFEFF" + head + "\n" + sample + "\n";
  }
  function download(name, content, mime) {
    var b = new Blob([content], { type: mime || "text/plain;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(b);
    a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 800);
  }

  function openImport() {
    if (!store()) { alert("برنامه هنوز آماده نیست — چند لحظه بعد دوباره امتحان کنید."); return; }
    closeDialogs();
    injectStyles();
    var ta = el("textarea", { class: "hy-input", dir: "rtl", placeholder: "متن CSV را اینجا بچسبانید…\nbarcode,name,category,unit,purchasePrice,salePrice,stock,minStock" });
    var preview = el("div", { class: "hy-preview", style: { display: "none" } });
    var fileIn = el("input", { type: "file", accept: ".csv,.txt,.json,text/csv,application/json", style: { display: "none" } });
    var okBtn = el("button", { class: "hy-btn primary", disabled: true, text: "ورود کالاها" });
    var parsed = null;

    okBtn.addEventListener("click", function () {
      if (!parsed || !parsed.rows.length) return;
      var res = store().getState().importBulk(parsed.rows);
      var msg = res.added + " کالای جدید اضافه شد، " + res.updated + " کالا به‌روزرسانی شد (" + res.categories + " دسته)";
      beepOk();
      preview.style.display = "block";
      preview.textContent = "✓ " + msg;
      okBtn.disabled = true; parsed = null; ta.value = "";
      setTimeout(function () { closeDialogs(); }, 1400);
    });
    function showPreview() {
      parsed = parseRows(ta.value);
      preview.style.display = "block";
      if (parsed.errors.length && !parsed.rows.length) {
        preview.textContent = parsed.errors.join(" — ");
        okBtn.disabled = true; parsed = null;
        return;
      }
      var st = store().getState();
      var add = 0, upd = 0;
      parsed.rows.forEach(function (r) {
        var ex = r.barcode && st.products.find(function (p) { return p.barcode === r.barcode; });
        if (ex) upd++; else add++;
      });
      var newCats = {};
      parsed.rows.forEach(function (r) { if (r.category) newCats[r.category] = 1; });
      var lines = ["✓ " + add + " کالای جدید — " + upd + " کالای موجود به‌روزرسانی می‌شود"];
      if (parsed.errors.length) lines.push("⚠ " + parsed.errors.join(" — "));
      if (!parsed.rows.length) lines.push("هیچ سطر معتبری پیدا نشد (هر سطر حداقل باید «نام کالا» داشته باشد)");
      preview.textContent = lines.join("\n");
      okBtn.disabled = !parsed.rows.length;
      okBtn.textContent = "ورود " + parsed.rows.length + " کالا";
    }
    ta.addEventListener("input", function () { okBtn.disabled = true; });
    ta.addEventListener("paste", function () { setTimeout(showPreview, 50); });
    ta.addEventListener("change", showPreview);
    fileIn.addEventListener("change", function () {
      var f = fileIn.files && fileIn.files[0];
      fileIn.value = "";
      if (!f) return;
      f.text().then(function (t) { ta.value = t; showPreview(); });
    });

    var box = el("div", { class: "hy-box", dir: "rtl" },
      el("button", { class: "hy-x", "aria-label": "بستن", onclick: closeDialogs }, svgClose("")),
      el("div", { class: "hy-box-hd" }, el("b", { text: "ورود گروهی کالا و دسته‌ها" })),
      el("div", { class: "hy-bd" },
        el("label", { class: "hy-label", text: "۱) از فایل:" }),
        el("div", { class: "hy-row", style: { marginTop: 0 } },
          el("button", { class: "hy-btn", onclick: function () { fileIn.click(); } }, "انتخاب فایل CSV / JSON…"),
          el("button", { class: "hy-btn", onclick: function () { download("hesabyar-template.csv", templateCsv(), "text/csv;charset=utf-8"); } }, "دانلود قالب نمونه"),
          fileIn),
        el("label", { class: "hy-label", text: "۲) یا متن را بچسبانید:" }),
        ta, preview,
        el("div", { class: "hy-hint" },
          "ستون‌های قابل قبول: بارکد، نام کالا (الزامی)، دسته، واحد (عدد/کیلوگرم/…)، قیمت خرید، قیمت فروش، موجودی، حد هشدار — جداشناس: ویرگول ، سمی‌کالن ; یا Tab",
          el("br"), "کالایی که بارکدش تکراری باشد به‌روزرسانی می‌شود؛ بارکد خالی خودکار ساخته می‌شود (HY-####).")),
      el("div", { class: "hy-row", style: { justifyContent: "center", paddingBottom: "16px" } }, okBtn));
    document.body.appendChild(el("div", { class: "hy-overlay" }, box));
  }

  /* ================= categories manager ================= */
  function openCats() {
    if (!store()) { alert("برنامه هنوز آماده نیست — چند لحظه بعد دوباره امتحان کنید."); return; }
    closeDialogs();
    injectStyles();
    var listWrap = el("div");
    var addIn = el("input", { class: "hy-input", dir: "rtl", placeholder: "نام دسته جدید…" });

    function counts() {
      var st = store().getState();
      var m = {};
      st.products.forEach(function (p) { if (p.category) m[p.category] = (m[p.category] || 0) + 1; });
      return m;
    }
    function allCats() {
      var st = store().getState();
      var managed = st.categories || [];
      return [...new Set([...(managed.length ? managed : []), ...st.products.map(function (p) { return p.category; }).filter(Boolean)])];
    }
    function render() {
      listWrap.innerHTML = "";
      var m = counts();
      var cats = allCats();
      if (!cats.length) {
        listWrap.appendChild(el("div", { class: "hy-status", text: "هنوز دسته‌ای ثبت نشده است — از پایین اضافه کنید" }));
      }
      cats.forEach(function (c) {
        var row = el("div", { class: "hy-cat-item" });
        row.appendChild(el("b", { text: c }));
        row.appendChild(el("span", { class: "hy-count", text: (m[c] || 0) + " کالا" }));
        var edit = el("button", { class: "hy-btn", text: "تغییر نام", onclick: function () {
          row.innerHTML = "";
          var inp = el("input", { class: "hy-input", value: c, style: { height: "34px", flex: "1" } });
          var save = el("button", { class: "hy-btn primary", text: "ذخیره", onclick: function () {
            var nn = inp.value.trim();
            if (nn && nn !== c) { store().getState().renameCategory(c, nn); beepOk(); }
            render();
          } });
          var cancel = el("button", { class: "hy-btn", text: "لغو", onclick: render });
          row.appendChild(inp); row.appendChild(save); row.appendChild(cancel);
          inp.focus();
        } });
        var del = el("button", { class: "hy-btn danger", text: "حذف", onclick: function () {
          row.innerHTML = "";
          row.appendChild(el("span", { style: { flex: "1", fontSize: "12px", color: "#dc2626" }, text: "«" + c + "» حذف شود؟ کالاها به «سایر» می‌روند" }));
          row.appendChild(el("button", { class: "hy-btn danger", text: "بله، حذف کن", onclick: function () {
            store().getState().deleteCategory(c); beepErr(); render();
          } }));
          row.appendChild(el("button", { class: "hy-btn", text: "لغو", onclick: render }));
        } });
        row.appendChild(edit); row.appendChild(del);
        listWrap.appendChild(row);
      });
    }
    function addCat() {
      var n = addIn.value.trim();
      if (!n) return;
      var st = store().getState();
      var cur = st.categories || [];
      var exists = cur.includes(n) || st.products.some(function (p) { return p.category === n; });
      if (exists) { addIn.value = ""; return; }
      store().getState().setCategories([...cur, n]);
      addIn.value = "";
      beepOk();
      render();
    }
    addIn.addEventListener("keydown", function (e) { if (e.key === "Enter") addCat(); });

    var box = el("div", { class: "hy-box", dir: "rtl" },
      el("button", { class: "hy-x", "aria-label": "بستن", onclick: closeDialogs }, svgClose("")),
      el("div", { class: "hy-box-hd" }, el("b", { text: "مدیریت دسته‌ها" })),
      el("div", { class: "hy-bd" },
        listWrap,
        el("label", { class: "hy-label", text: "افزودن دسته جدید" }),
        el("div", { class: "hy-row", style: { marginTop: 0 } }, addIn,
          el("button", { class: "hy-btn primary", text: "افزودن", onclick: addCat })),
        el("div", { class: "hy-hint" },
          "تغییر نام دسته روی همه کالاهای آن دسته اعمال می‌شود. حذف دسته، کالاهای آن را به دسته «سایر» منتقل می‌کند. دسته‌ها در فرم کالا و فیلتر صفحه محصولات هم به‌روز می‌شوند.")));
    document.body.appendChild(el("div", { class: "hy-overlay" }, box));
    render();
  }

  function closeDialogs() {
    document.querySelectorAll(".hy-overlay").forEach(function (o) { o.remove(); });
    stopCamera();
    SCAN.overlay = null;
  }
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      document.querySelectorAll(".hy-overlay").forEach(function (o) {
        if (!o.querySelector("video") || !SCAN.running) o.remove();
      });
    }
  });

  /* ================= public API ================= */
  window.__hyOpenScanner = function () { openScanner(); };
  window.__hyScanField = function (inputEl) {
    if (!inputEl) return;
    openScanner({ targetInput: inputEl });
  };
  window.__hyImport = openImport;
  window.__hyCats = openCats;

  /* ================= boot ================= */
  function boot() {
    injectStyles();
    ensureFab();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
    window.addEventListener("load", boot);
  } else {
    boot();
  }
})();
