/* ---------------------------------------------------------------
   leetv.tv — eleven channels of broadcast, all fighting through
   the same interference.

   Each channel draws a scene into an offscreen 160x120 canvas. The
   compositor then rebuilds every pixel out of noise, pulling toward
   the scene colour by the current signal strength, sampling the R,
   G and B channels a few pixels apart for chromatic split. Nothing
   is drawn ON the static — everything is made OF it.

   Clicking (or Enter/Space on) the set changes channel. Channels
   come from a shuffled bag, so no channel repeats until all eleven
   have been shown.
   --------------------------------------------------------------- */
(function () {
  'use strict';

  var canvas = document.getElementById('tube');
  if (!canvas || !canvas.getContext) return;

  var ctx = canvas.getContext('2d', { alpha: false });
  var W = canvas.width;   /* 160 */
  var H = canvas.height;  /* 120 */

  var image = ctx.createImageData(W, H);
  var data = image.data;

  /* Offscreen scene: what the channel is broadcasting, before noise. */
  var scene = document.createElement('canvas');
  scene.width = W;
  scene.height = H;
  var sctx = scene.getContext('2d');

  /* Coarse on purpose - real static is not smooth. Frame-skipping off rAF
     quantises to the display: on a 60Hz panel this lands at 20fps, on 120Hz
     nearer the nominal 24. */
  var FPS = 24;
  var interval = 1000 / FPS;
  var slack = 6;

  var TAU = Math.PI * 2;

  /* --- small drawing helpers -------------------------------------- */

  function ell(g, x, y, rx, ry, rot) {
    g.beginPath();
    g.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot || 0, 0, TAU);
    g.fill();
  }

  function poly(g, pts) {
    g.beginPath();
    g.moveTo(pts[0][0], pts[0][1]);
    for (var i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
    g.closePath();
    g.fill();
  }

  function limb(g, x, y, len, wide, angle) {
    g.save();
    g.translate(x, y);
    g.rotate(angle);
    g.fillRect(-wide / 2, 0, wide, len);
    g.restore();
  }

  /* ================================================================
     CHANNEL 0 — the LEETV ident
     ================================================================ */

  var ident = (function () {
    var g = sctx;
    var letters = 'LEETV'.split('');
    var squeeze = 0.86;
    var maxRun = W * 0.84;
    var size = Math.round(H * 0.30);
    var tracking, widths, total;

    /* Shrink to fit: "Arial Narrow" may not resolve, and the fallbacks
       are much wider, so measure what we actually got. */
    for (;;) {
      g.font = '700 ' + size + 'px "Arial Narrow", "Helvetica Neue", Arial, sans-serif';
      tracking = Math.max(3, Math.round(size * 0.30));
      widths = letters.map(function (ch) { return g.measureText(ch).width * squeeze; });
      total = widths.reduce(function (a, b) { return a + b; }, 0) +
              tracking * (letters.length - 1);
      if (total <= maxRun || size <= 12) break;
      size -= 1;
    }

    /* Centre the glyphs' actual ink box, not the em box: a 'middle'
       baseline leaves all-caps reading noticeably high. */
    g.textBaseline = 'alphabetic';
    var m = g.measureText('LEETV');
    var asc = m.actualBoundingBoxAscent, desc = m.actualBoundingBoxDescent;
    if (!(isFinite(asc) && isFinite(desc))) { asc = size * 0.72; desc = 0; }

    return {
      font: '700 ' + size + 'px "Arial Narrow", "Helvetica Neue", Arial, sans-serif',
      letters: letters, widths: widths, tracking: tracking,
      squeeze: squeeze, startX: (W - total) / 2,
      baseline: H / 2 + (asc - desc) / 2
    };
  }());

  function drawIdent(g) {
    /* rgb(255,51,153) through the compositor reproduces the original
       ident exactly: red at full luma, green at 0.20, blue at 0.60. */
    g.fillStyle = 'rgb(255,51,153)';
    g.font = ident.font;
    g.textAlign = 'left';
    g.textBaseline = 'alphabetic';
    var x = ident.startX;
    for (var i = 0; i < ident.letters.length; i++) {
      g.save();
      g.translate(x, ident.baseline);
      g.scale(ident.squeeze, 1);
      g.fillText(ident.letters[i], 0, 0);
      g.restore();
      x += ident.widths[i] + ident.tracking;
    }
  }

  /* ================================================================
     CHANNEL 1 — horses running
     ================================================================ */

  function horse(g, x, y, ph) {
    g.fillStyle = '#120e14';
    var legPh = [0, 1.9, 3.3, 5.0];
    for (var i = 0; i < 4; i++) {
      var swing = Math.sin(ph + legPh[i]) * 0.85;
      limb(g, x - 9 + i * 6.5, y - 6, 13, 3, swing);
      limb(g, x - 9 + i * 6.5 + Math.sin(swing) * 12, y + 6, 6, 2.6, -swing * 0.6);
    }
    ell(g, x, y - 11, 14, 7.5);                       /* barrel */
    g.save();
    g.translate(x + 11, y - 15);
    g.rotate(-0.62);
    g.fillRect(0, -3.4, 11, 6.8);                     /* neck */
    g.restore();
    ell(g, x + 18.5, y - 22, 5.6, 3.2, -0.32);        /* head */
    poly(g, [[x + 15, y - 25], [x + 17, y - 29], [x + 18.5, y - 24]]);  /* ear */
    g.save();
    g.translate(x - 13, y - 14);
    g.rotate(0.55 + Math.sin(ph) * 0.18);
    g.fillRect(0, -2.4, 10, 4.8);                     /* tail */
    g.restore();
    ell(g, x + 6, y - 19, 6, 3, -0.5);                /* mane */
  }

  function drawHorses(g, t) {
    g.fillStyle = 'rgba(196,108,40,0.5)';             /* dust horizon */
    g.fillRect(0, 92, W, 5);
    g.fillStyle = 'rgba(120,70,26,0.42)';
    g.fillRect(0, 97, W, 23);
    g.save();
    g.translate(80, 58);
    g.scale(1.3, 1.3);
    g.translate(-80, -58);
    for (var i = 0; i < 3; i++) {
      var x = ((t * 0.055 + i * 62) % 232) - 36;
      horse(g, x, 84 - (i % 2) * 5, t * 0.019 + i * 2.1);
    }
    g.restore();
  }

  /* ================================================================
     CHANNEL 2 — tiger eating sushi
     ================================================================ */

  function drawTiger(g, t) {
    var cycle = (t % 2100) / 2100;
    var sushiX = 152 - cycle * 96;
    var chomp = cycle > 0.58;
    var gape = chomp ? Math.abs(Math.sin((cycle - 0.58) * 26)) * 7 : 2;

    if (!chomp) {                                     /* sushi in flight */
      var sy = 66 + Math.sin(cycle * 9) * 4;
      g.fillStyle = '#f4efe4';
      g.fillRect(sushiX - 9, sy - 5, 18, 12);         /* rice */
      g.fillStyle = '#f2683c';
      g.fillRect(sushiX - 9, sy - 11, 18, 7);         /* salmon */
      g.fillStyle = '#1d2a22';
      g.fillRect(sushiX - 3, sy - 11, 6, 18);         /* nori band */
    }

    g.fillStyle = '#e8871f';                          /* ears */
    ell(g, 34, 34, 9, 9); ell(g, 76, 34, 9, 9);
    g.fillStyle = '#231712';
    ell(g, 34, 35, 4.5, 4.5); ell(g, 76, 35, 4.5, 4.5);

    g.fillStyle = '#e8871f';                          /* head */
    ell(g, 55, 62, 32, 28);

    g.fillStyle = '#231712';                          /* stripes */
    for (var i = 0; i < 4; i++) {
      g.save();
      g.translate(55 + (i < 2 ? -1 : 1) * (14 + (i % 2) * 9), 44 + (i % 2) * 11);
      g.rotate((i < 2 ? 1 : -1) * 0.5);
      g.fillRect(-2, -7, 4, 15);
      g.restore();
    }

    g.fillStyle = '#fdf6e8';                          /* muzzle */
    ell(g, 45, 72, 12, 9); ell(g, 65, 72, 12, 9);
    g.fillStyle = '#231712';
    ell(g, 55, 66, 5, 3.6);                           /* nose */

    g.fillStyle = '#2a0d0d';                          /* mouth */
    ell(g, 55, 78 + gape * 0.3, 12, 3 + gape);
    g.fillStyle = '#fdf6e8';                          /* fangs */
    poly(g, [[48, 75], [52, 75], [50, 81]]);
    poly(g, [[58, 75], [62, 75], [60, 81]]);

    g.strokeStyle = '#fdf6e8';                        /* whiskers */
    g.lineWidth = 1.4;
    for (var wi = 0; wi < 3; wi++) {
      g.beginPath();
      g.moveTo(46, 70 + wi * 3); g.lineTo(24, 64 + wi * 5); g.stroke();
      g.beginPath();
      g.moveTo(64, 70 + wi * 3); g.lineTo(86, 64 + wi * 5); g.stroke();
    }

    g.fillStyle = '#f7e04a';                          /* eyes */
    ell(g, 43, 52, 6.5, 5); ell(g, 67, 52, 6.5, 5);
    g.fillStyle = '#231712';
    var look = chomp ? 1.5 : 0;
    ell(g, 43 + look, 52, 2.4, 4); ell(g, 67 + look, 52, 2.4, 4);
  }

  /* ================================================================
     CHANNEL 3 — pickles dancing
     ================================================================ */

  function pickle(g, x, y, ph) {
    var tilt = Math.sin(ph) * 0.42;
    var hop = Math.abs(Math.sin(ph * 2)) * 6;
    g.save();
    g.translate(x, y - hop);
    g.rotate(tilt);

    g.fillStyle = '#3f7a2a';
    limb(g, -6, 16, 12, 5, 0.5 + Math.sin(ph * 2) * 0.5);
    limb(g, 6, 16, 12, 5, -0.5 - Math.sin(ph * 2) * 0.5);
    limb(g, -11, -4, 13, 4.5, 1.1 + Math.sin(ph * 2 + 1) * 0.8);
    limb(g, 11, -4, 13, 4.5, -1.1 - Math.sin(ph * 2 + 1) * 0.8);

    g.fillStyle = '#5aa832';
    ell(g, 0, 0, 11, 19);
    g.fillStyle = '#79c94a';                          /* warty highlights */
    for (var i = 0; i < 6; i++) {
      ell(g, -5 + (i % 3) * 5, -13 + Math.floor(i / 3) * 13, 2.1, 2.6);
    }
    g.fillStyle = '#e9f7dc';
    ell(g, -4, -6, 2.6, 3.2); ell(g, 4, -6, 2.6, 3.2);
    g.fillStyle = '#12240c';
    ell(g, -4, -6, 1.3, 1.7); ell(g, 4, -6, 1.3, 1.7);
    ell(g, 0, 2, 3.4, 2.4);                           /* open mouth */
    g.restore();
  }

  function drawPickles(g, t) {
    for (var i = 0; i < 8; i++) {                     /* disco floor */
      g.fillStyle = ((i + Math.floor(t / 240)) % 2) ? 'rgba(240,60,150,0.42)'
                                                    : 'rgba(60,190,220,0.42)';
      g.fillRect(i * 20, 104, 20, 16);
    }
    pickle(g, 38, 74, t * 0.0072);
    pickle(g, 80, 68, t * 0.0072 + 2.1);
    pickle(g, 122, 74, t * 0.0072 + 4.2);
  }

  /* ================================================================
     CHANNEL 4 — heart pounding
     ================================================================ */

  function drawHeart(g, t) {
    var c = (t % 1000) / 1000;
    /* lub-dub: two pulses, then rest */
    var beat = Math.exp(-c * 14) + 0.72 * Math.exp(-Math.max(0, c - 0.22) * 14);
    var s = 1 + beat * 0.22;

    if (beat > 0.25) {                                /* shockwave ring */
      g.strokeStyle = 'rgba(255,70,120,' + (beat * 0.5).toFixed(3) + ')';
      g.lineWidth = 3;
      g.beginPath();
      g.arc(80, 60, 30 + (1 - beat) * 34, 0, TAU);
      g.stroke();
    }

    g.save();
    g.translate(80, 62);
    g.scale(s, s);
    g.fillStyle = '#e11b45';
    g.beginPath();
    g.moveTo(0, 26);
    g.bezierCurveTo(-34, 2, -24, -24, 0, -10);
    g.bezierCurveTo(24, -24, 34, 2, 0, 26);
    g.fill();
    g.fillStyle = 'rgba(255,140,170,0.85)';
    ell(g, -11, -6, 5, 7, -0.4);                      /* specular */
    g.restore();
  }

  /* ================================================================
     CHANNEL 5 — eye winking
     ================================================================ */

  function drawEye(g, t) {
    var c = (t % 3000) / 3000;
    var lid = c > 0.82 ? Math.sin((c - 0.82) / 0.18 * Math.PI) : 0;   /* 0..1 */
    var gaze = Math.sin(t * 0.0011) * 9;

    g.fillStyle = '#f6f1e6';                          /* sclera */
    ell(g, 80, 60, 46, 26);

    g.save();                                         /* clip iris to eye */
    g.beginPath();
    g.ellipse(80, 60, 46, 26, 0, 0, TAU);
    g.clip();
    g.fillStyle = '#2f9fc4';
    ell(g, 80 + gaze, 60, 19, 19);
    g.fillStyle = '#1b5f7d';
    for (var i = 0; i < 12; i++) {                    /* iris fibres */
      g.save();
      g.translate(80 + gaze, 60);
      g.rotate(i * TAU / 12);
      g.fillRect(-1, -18, 2, 8);
      g.restore();
    }
    g.fillStyle = '#0d1116';
    ell(g, 80 + gaze, 60, 8.5, 8.5);
    g.fillStyle = 'rgba(255,255,255,0.9)';
    ell(g, 74 + gaze, 53, 4, 3.2, -0.5);
    g.restore();

    if (lid > 0.01) {                                 /* eyelid sweeps down */
      g.save();
      g.fillStyle = '#d98a6a';
      g.beginPath();
      g.ellipse(80, 60, 47, 27, 0, 0, TAU);
      g.clip();
      g.fillRect(33, 33, 94, lid * 54);
      g.fillStyle = '#a85f43';
      g.fillRect(33, 33 + lid * 54 - 3, 94, 3);
      g.restore();
    }

    g.fillStyle = '#8a4a32';                          /* lashes */
    for (var k = 0; k < 5; k++) {
      limb(g, 46 + k * 17, 34 - 6, 7, 2.6, -0.5 + k * 0.25);
    }
  }

  /* ================================================================
     CHANNEL 6 — skull laughing
     ================================================================ */

  function drawSkull(g, t) {
    var laugh = Math.abs(Math.sin(t * 0.011));
    var rock = Math.sin(t * 0.0055) * 0.14;

    g.save();
    g.translate(66, 58 + laugh * 3);
    g.rotate(rock);

    g.fillStyle = '#efe8d8';
    ell(g, 0, -4, 27, 25);                            /* cranium */
    g.fillRect(-17, 10, 34, 12);                      /* upper jaw */

    g.fillStyle = '#15120f';
    ell(g, -11, -6, 8.5, 9.5);                        /* sockets */
    ell(g, 11, -6, 8.5, 9.5);
    poly(g, [[0, 4], [-4, 12], [4, 12]]);             /* nasal */

    g.fillStyle = '#efe8d8';                          /* lower jaw drops */
    g.save();
    g.translate(0, 20);
    g.rotate(laugh * 0.34);
    g.fillRect(-15, 0, 30, 11);
    g.fillStyle = '#15120f';
    for (var i = 0; i < 5; i++) g.fillRect(-13 + i * 6, 0, 2, 11);
    g.restore();

    g.fillStyle = '#15120f';                          /* teeth gap */
    for (var j = 0; j < 5; j++) g.fillRect(-13 + j * 6, 10, 2, 12);
    g.restore();

    g.fillStyle = 'rgba(255,240,120,' + (0.45 + laugh * 0.55).toFixed(2) + ')';
    g.font = 'bold 15px Arial, sans-serif';
    g.textAlign = 'left';
    g.textBaseline = 'alphabetic';
    g.fillText('HA', 108, 40 - laugh * 6);
    g.fillText('HA', 118, 62 + laugh * 5);
    g.fillText('HA', 106, 84 - laugh * 4);
  }

  /* ================================================================
     CHANNEL 7 — ghost sitting on a toilet
     ================================================================ */

  function drawGhostToilet(g, t) {
    var bob = Math.sin(t * 0.004) * 2.4;

    g.fillStyle = '#9fb0ba';                          /* cistern */
    g.fillRect(94, 34, 26, 30);
    g.fillStyle = '#b6c1c8';
    g.fillRect(94, 34, 26, 4);
    g.fillStyle = '#8d9aa2';
    g.fillRect(116, 40, 5, 4);                        /* handle */

    g.fillStyle = '#9fb0ba';                          /* bowl + pedestal */
    ell(g, 78, 72, 24, 12);
    poly(g, [[64, 76], [92, 76], [86, 104], [70, 104]]);
    g.fillStyle = '#6d7d87';
    ell(g, 78, 70, 17, 8);

    g.fillStyle = 'rgba(238,246,250,0.92)';           /* ghost */
    g.save();
    g.translate(78, 50 + bob);
    ell(g, 0, 0, 19, 21);
    g.beginPath();
    g.moveTo(-19, 2);
    for (var i = 0; i <= 6; i++) {
      var wx = -19 + i * 6.33;
      var wy = 20 + Math.sin(t * 0.006 + i) * 3.4;
      g.lineTo(wx, wy);
    }
    g.lineTo(19, 2);
    g.closePath();
    g.fill();
    g.fillStyle = '#1b2430';
    ell(g, -7, -4, 3.4, 4.6);
    ell(g, 7, -4, 3.4, 4.6);
    ell(g, 0, 7, 3.6, 4.4);                           /* ooOOoo mouth */
    g.restore();

    g.fillStyle = 'rgba(230,240,246,0.8)';            /* loo roll */
    ell(g, 132, 62, 8, 8);
    g.fillStyle = 'rgba(150,165,175,0.8)';
    ell(g, 132, 62, 2.6, 2.6);
    g.fillRect(132, 62, 9, 26);
  }

  /* ================================================================
     CHANNEL 8 — camera photographs Bigfoot
     ================================================================ */

  function drawBigfoot(g, t) {
    var cycle = t % 2600;
    var flash = cycle < 110 ? 1 - cycle / 110 : 0;
    var walk = t * 0.0055;
    var x = 66 + Math.sin(t * 0.00055) * 24;

    g.fillStyle = 'rgba(28,44,30,0.55)';              /* treeline */
    for (var i = 0; i < 5; i++) {
      g.fillRect(6 + i * 34, 10, 9, 110);
    }
    g.fillStyle = 'rgba(22,34,24,0.6)';
    g.fillRect(0, 100, W, 20);

    g.fillStyle = '#6b4d31';                          /* the subject */
    g.save();
    g.translate(x, 62);
    limb(g, -6, 30, 20, 8, Math.sin(walk) * 0.55);
    limb(g, 6, 30, 20, 8, -Math.sin(walk) * 0.55);
    ell(g, 0, 8, 15, 22);
    limb(g, -14, -4, 22, 6.5, -Math.sin(walk) * 0.7 + 0.25);
    limb(g, 14, -4, 22, 6.5, Math.sin(walk) * 0.7 - 0.25);
    ell(g, 2, -20, 10, 11);                           /* head, turned */
    g.fillStyle = '#20160e';
    ell(g, 6, -20, 5, 7);
    g.fillStyle = '#d8c9a8';
    ell(g, 5, -22, 1.7, 1.7); ell(g, 9, -22, 1.7, 1.7);
    g.restore();

    g.strokeStyle = 'rgba(255,255,255,0.75)';         /* viewfinder */
    g.lineWidth = 2;
    var b = 14;
    [[10, 10, 1, 1], [150, 10, -1, 1], [10, 110, 1, -1], [150, 110, -1, -1]]
      .forEach(function (c) {
        g.beginPath();
        g.moveTo(c[0] + c[2] * b, c[1]);
        g.lineTo(c[0], c[1]);
        g.lineTo(c[0], c[1] + c[3] * b);
        g.stroke();
      });
    g.fillStyle = 'rgba(255,60,60,0.9)';
    if (cycle % 1000 < 500) ell(g, 144, 16, 3, 3);    /* REC */

    if (flash > 0) {
      g.fillStyle = 'rgba(255,255,255,' + (flash * 0.92).toFixed(3) + ')';
      g.fillRect(0, 0, W, H);
    }
  }

  /* ================================================================
     CHANNEL 9 — tiki man dances
     ================================================================ */

  function drawTiki(g, t) {
    var sway = Math.sin(t * 0.006) * 0.16;
    var hop = Math.abs(Math.sin(t * 0.006)) * 4;

    for (var s = 0; s < 2; s++) {                     /* torch flames */
      var fx = s ? 138 : 22;
      var f = Math.sin(t * 0.018 + s * 2) * 2.6;
      g.fillStyle = 'rgba(255,150,30,0.85)';
      poly(g, [[fx - 6, 54], [fx, 30 + f], [fx + 6, 54]]);
      g.fillStyle = 'rgba(255,232,120,0.9)';
      poly(g, [[fx - 3, 52], [fx, 38 + f], [fx + 3, 52]]);
      g.fillStyle = '#5a3a1e';
      g.fillRect(fx - 3, 54, 6, 52);
    }

    g.save();
    g.translate(80, 66 - hop);
    g.rotate(sway);

    g.scale(1.22, 1.22);
    g.fillStyle = '#2e1a0a';                          /* totem body */
    g.fillRect(-21, -34, 42, 66);
    g.fillStyle = '#c98a3c';
    g.fillRect(-21, -34, 42, 5);
    g.fillRect(-21, 27, 42, 5);

    g.fillStyle = '#c98a3c';                          /* brows */
    poly(g, [[-18, -22], [-2, -16], [-18, -12]]);
    poly(g, [[18, -22], [2, -16], [18, -12]]);
    g.fillStyle = '#ffe9b8';                          /* eyes */
    ell(g, -10, -12, 5.5, 4.5); ell(g, 10, -12, 5.5, 4.5);
    g.fillStyle = '#1c1006';
    ell(g, -10, -12, 2.4, 2.4); ell(g, 10, -12, 2.4, 2.4);

    g.fillStyle = '#c98a3c';                          /* nose */
    poly(g, [[0, -8], [-6, 4], [6, 4]]);

    g.fillStyle = '#1c1006';                          /* wide mouth */
    g.fillRect(-16, 8, 32, 13);
    g.fillStyle = '#f0d9a8';
    for (var i = 0; i < 6; i++) g.fillRect(-15 + i * 5.4, 8, 3.4, 6);
    for (var j = 0; j < 6; j++) g.fillRect(-15 + j * 5.4, 15, 3.4, 6);
    g.restore();

    g.fillStyle = 'rgba(96,150,54,0.9)';              /* grass skirt */
    for (var k = 0; k < 11; k++) {
      var gx = 56 + k * 5;
      limb(g, gx, 98, 16 + (k % 3) * 4, 4, Math.sin(t * 0.008 + k) * 0.3);
    }
  }

  /* ================================================================
     CHANNEL 10 — UFO abducts a cow
     ================================================================ */

  function drawUfoCow(g, t) {
    var cycle = (t % 4200) / 4200;
    var lift = cycle < 0.62 ? Math.pow(cycle / 0.62, 1.6) : 1;
    var cowY = 106 - lift * 38;
    var spin = t * 0.006;
    var ufoX = 80 + Math.sin(t * 0.0011) * 12;

    g.fillStyle = 'rgba(30,44,30,0.55)';              /* ground */
    g.fillRect(0, 108, W, 12);

    g.fillStyle = 'rgba(150,240,170,0.30)';           /* tractor beam */
    poly(g, [[ufoX - 9, 36], [ufoX + 9, 36], [ufoX + 34, 112], [ufoX - 34, 112]]);
    g.fillStyle = 'rgba(210,255,220,0.22)';
    poly(g, [[ufoX - 4, 36], [ufoX + 4, 36], [ufoX + 16, 112], [ufoX - 16, 112]]);

    g.save();                                         /* the cow, tumbling */
    g.translate(ufoX + Math.sin(spin) * 7, cowY);
    g.rotate(Math.sin(spin * 0.8) * 0.7);
    g.fillStyle = '#f2efe9';
    ell(g, 0, 0, 15, 9);
    g.fillRect(-13, 6, 3.4, 8);
    g.fillRect(-5, 6, 3.4, 8);
    g.fillRect(4, 6, 3.4, 8);
    g.fillRect(11, 6, 3.4, 8);
    ell(g, 15, -4, 7, 5.5);                           /* head */
    g.fillStyle = '#2b2b2b';
    ell(g, -5, -2, 5, 3.6); ell(g, 6, 3, 4, 3);       /* patches */
    g.fillStyle = '#f0a6b4';
    ell(g, 20, -3, 3, 2.4);
    g.restore();

    g.fillStyle = '#4a545d';                          /* saucer */
    ell(g, ufoX, 34, 40, 9);
    g.fillStyle = '#d3dde5';
    ell(g, ufoX, 30, 26, 8);
    g.fillStyle = 'rgba(160,240,255,0.92)';
    ell(g, ufoX, 24, 14, 11);
    g.fillStyle = 'rgba(60,90,110,0.8)';
    ell(g, ufoX + 4, 23, 4, 5);                       /* pilot */
    for (var i = 0; i < 5; i++) {                     /* rim lights */
      var on = (Math.floor(t / 130) + i) % 5 === 0;
      g.fillStyle = on ? '#fff3a8' : '#e0645f';
      ell(g, ufoX - 28 + i * 14, 38, 3.4, 2.6);
    }
  }

  /* --- more helpers ------------------------------------------------ */

  function ring(g, x, y, r, lw, col) {
    g.strokeStyle = col; g.lineWidth = lw;
    g.beginPath(); g.arc(x, y, Math.max(0.2, r), 0, TAU); g.stroke();
  }

  function star(g, x, y, r1, r2, pts, rot) {
    g.beginPath();
    for (var i = 0; i < pts * 2; i++) {
      var a = (rot || 0) + i * Math.PI / pts;
      var rr = (i % 2) ? r2 : r1;
      var px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr;
      if (i) g.lineTo(px, py); else g.moveTo(px, py);
    }
    g.closePath(); g.fill();
  }

  function seg(g, x1, y1, x2, y2, w, col) {
    g.strokeStyle = col; g.lineWidth = w;
    g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
  }

  /* ================================================================
     ESOTERIC
     ================================================================ */

  function drawAllSeeingEye(g, t) {
    for (var i = 0; i < 12; i++) {          /* rotating rays */
      var a = t * 0.0009 + i * TAU / 12;
      seg(g, 80, 58, 80 + Math.cos(a) * 78, 58 + Math.sin(a) * 78, 2.5,
          'rgba(255,208,90,0.30)');
    }
    g.fillStyle = '#c8a03a';
    poly(g, [[80, 14], [132, 100], [28, 100]]);
    g.fillStyle = '#3a2c10';
    poly(g, [[80, 24], [122, 94], [38, 94]]);
    g.fillStyle = '#f4e9d2';
    ell(g, 80, 68, 26, 14);
    g.fillStyle = '#2f7fa8';
    ell(g, 80, 68, 10, 10);
    g.fillStyle = '#0c0c10';
    ell(g, 80, 68, 4.6, 4.6 + Math.sin(t * 0.004) * 1.5);
    g.fillStyle = 'rgba(255,255,255,0.9)';
    ell(g, 75, 63, 3, 2.4);
  }

  function drawOuroboros(g, t) {
    var rot = t * 0.0012;
    for (var i = 40; i > 0; i--) {
      var a = rot + i * 0.145;
      var r = 40 - i * 0.05;
      var w = 4 + (40 - i) * 0.14;
      g.fillStyle = (i % 4 < 2) ? '#3f8f4a' : '#2c6b36';
      ell(g, 80 + Math.cos(a) * r, 60 + Math.sin(a) * r, w, w);
    }
    var ha = rot + 0.14;
    var hx = 80 + Math.cos(ha) * 40, hy = 60 + Math.sin(ha) * 40;
    g.fillStyle = '#4fae5c';
    ell(g, hx, hy, 10, 8, ha);
    g.fillStyle = '#e8d24a';
    ell(g, hx + Math.cos(ha) * 3, hy + Math.sin(ha) * 3 - 3, 2.4, 2.4);
    g.fillStyle = '#c23a3a';
    seg(g, hx, hy, hx + Math.cos(ha) * 14, hy + Math.sin(ha) * 14, 2, '#c23a3a');
  }

  function drawPentagram(g, t) {
    ring(g, 80, 60, 42, 3, 'rgba(210,60,60,0.9)');
    g.strokeStyle = 'rgba(230,80,80,0.95)';
    g.lineWidth = 2.6;
    g.beginPath();
    for (var i = 0; i <= 5; i++) {
      var a = -Math.PI / 2 + (i * 4) * TAU / 5;
      var px = 80 + Math.cos(a) * 40, py = 60 + Math.sin(a) * 40;
      if (i) g.lineTo(px, py); else g.moveTo(px, py);
    }
    g.stroke();
    for (var c = 0; c < 5; c++) {           /* candles at the points */
      var ca = -Math.PI / 2 + c * TAU / 5;
      var cx = 80 + Math.cos(ca) * 52, cy = 60 + Math.sin(ca) * 52;
      var fl = Math.sin(t * 0.013 + c * 1.7) * 1.6;
      g.fillStyle = '#e8e0cc'; g.fillRect(cx - 2, cy, 4, 10);
      g.fillStyle = 'rgba(255,190,60,0.95)';
      poly(g, [[cx - 2.6, cy], [cx, cy - 8 + fl], [cx + 2.6, cy]]);
      g.fillStyle = 'rgba(255,246,190,0.95)';
      poly(g, [[cx - 1.2, cy - 1], [cx, cy - 5 + fl], [cx + 1.2, cy - 1]]);
    }
  }

  function drawMoonPhases(g, t) {
    var ph = (t % 6000) / 6000;
    g.fillStyle = '#e9e6d8';
    ell(g, 80, 58, 34, 34);
    g.fillStyle = '#b9b4a2';               /* craters */
    ell(g, 70, 48, 6, 5); ell(g, 90, 66, 8, 6); ell(g, 74, 72, 4, 4);
    /* shadow sweeps across */
    var off = (ph * 2 - 1) * 74;
    g.fillStyle = 'rgba(6,8,16,0.94)';
    ell(g, 80 + off, 58, 34, 34);
    for (var i = 0; i < 14; i++) {
      var sx = (i * 53 % 150) + 6, sy = (i * 97 % 110) + 6;
      if (Math.abs(sx - 80) < 40 && Math.abs(sy - 58) < 40) continue;
      g.fillStyle = 'rgba(255,255,255,' + (0.4 + Math.sin(t * 0.006 + i) * 0.3).toFixed(2) + ')';
      ell(g, sx, sy, 1.5, 1.5);
    }
  }

  function drawSigil(g, t) {
    ring(g, 80, 60, 46, 2, 'rgba(180,140,255,0.85)');
    ring(g, 80, 60, 34, 1.6, 'rgba(150,110,235,0.7)');
    g.save();
    g.translate(80, 60);
    g.rotate(t * 0.0009);
    for (var i = 0; i < 8; i++) {            /* outer runes */
      g.save(); g.rotate(i * TAU / 8);
      g.fillStyle = '#d8c4ff';
      g.fillRect(-1.4, -44, 2.8, 7);
      g.fillRect(-5, -38, 10, 2);
      g.restore();
    }
    g.restore();
    g.save();
    g.translate(80, 60);
    g.rotate(-t * 0.0016);
    g.strokeStyle = '#b98cff'; g.lineWidth = 2;
    g.beginPath();
    for (var k = 0; k <= 7; k++) {
      var a = (k * 3) * TAU / 7;
      var px = Math.cos(a) * 26, py = Math.sin(a) * 26;
      if (k) g.lineTo(px, py); else g.moveTo(px, py);
    }
    g.closePath(); g.stroke();
    g.restore();
    g.fillStyle = 'rgba(240,220,255,0.95)';
    ell(g, 80, 60, 4 + Math.sin(t * 0.006) * 1.6, 4 + Math.sin(t * 0.006) * 1.6);
  }

  function drawTarot(g, t) {
    var c = (t % 3400) / 3400;
    var flip = Math.cos(c * TAU);            /* -1..1 card turn */
    var w = Math.abs(flip) * 34 + 2;
    g.save();
    g.translate(80, 60);
    g.fillStyle = flip > 0 ? '#f0e6cf' : '#3b2a6b';
    g.fillRect(-w, -46, w * 2, 92);
    g.strokeStyle = flip > 0 ? '#8b6b2a' : '#a58cff';
    g.lineWidth = 2.4;
    g.strokeRect(-w + 3, -43, w * 2 - 6, 86);
    if (flip > 0.45) {                        /* face: a scythe moon */
      g.fillStyle = '#2a2018';
      ell(g, 0, -12, w * 0.46, 16);
      g.fillStyle = '#f0e6cf';
      ell(g, w * 0.16, -14, w * 0.4, 14);
      g.fillStyle = '#7a1f1f';
      g.fillRect(-w * 0.5, 18, w, 4);
      g.fillRect(-2, 14, 4, 22);
    } else if (flip < -0.45) {                /* back: star lattice */
      g.fillStyle = '#a58cff';
      for (var i = 0; i < 5; i++) star(g, 0, -30 + i * 15, 6, 2.6, 5, t * 0.001);
    }
    g.restore();
  }

  /* ================================================================
     GEOMETRIC
     ================================================================ */

  function drawSpiral(g, t) {
    g.strokeStyle = '#f2f2f2'; g.lineWidth = 3.4;
    g.beginPath();
    for (var i = 0; i < 220; i++) {
      var a = i * 0.22 + t * 0.0022;
      var r = i * 0.34;
      var px = 80 + Math.cos(a) * r, py = 60 + Math.sin(a) * r * 0.78;
      if (i) g.lineTo(px, py); else g.moveTo(px, py);
    }
    g.stroke();
    g.strokeStyle = '#e0339a'; g.lineWidth = 1.6;
    g.beginPath();
    for (var j = 0; j < 220; j++) {
      var a2 = j * 0.22 - t * 0.0022 + 3.14;
      var r2 = j * 0.34;
      var qx = 80 + Math.cos(a2) * r2, qy = 60 + Math.sin(a2) * r2 * 0.78;
      if (j) g.lineTo(qx, qy); else g.moveTo(qx, qy);
    }
    g.stroke();
  }

  function drawWireCube(g, t) {
    var ax = t * 0.0011, ay = t * 0.0017;
    var v = [], i;
    for (i = 0; i < 8; i++) {
      var x = (i & 1 ? 1 : -1) * 26, y = (i & 2 ? 1 : -1) * 26, z = (i & 4 ? 1 : -1) * 26;
      var x1 = x * Math.cos(ay) - z * Math.sin(ay), z1 = x * Math.sin(ay) + z * Math.cos(ay);
      var y1 = y * Math.cos(ax) - z1 * Math.sin(ax), z2 = y * Math.sin(ax) + z1 * Math.cos(ax);
      var s = 150 / (150 + z2);
      v.push([80 + x1 * s, 60 + y1 * s]);
    }
    var edges = [0,1,1,3,3,2,2,0,4,5,5,7,7,6,6,4,0,4,1,5,2,6,3,7];
    for (i = 0; i < edges.length; i += 2) {
      seg(g, v[edges[i]][0], v[edges[i]][1], v[edges[i+1]][0], v[edges[i+1]][1], 2.2, '#4fe3d0');
    }
    for (i = 0; i < 8; i++) { g.fillStyle = '#ffe45e'; ell(g, v[i][0], v[i][1], 2.6, 2.6); }
  }

  function drawKaleido(g, t) {
    var cols = ['#ff4fa3', '#4fd8ff', '#ffe45e', '#8affa0', '#c07bff'];
    g.save();
    g.translate(80, 60);
    for (var s = 0; s < 8; s++) {
      g.save();
      g.rotate(s * TAU / 8 + t * 0.0009);
      if (s % 2) g.scale(1, -1);
      for (var i = 0; i < 4; i++) {
        g.fillStyle = cols[(i + s) % cols.length];
        var r = 12 + i * 11 + Math.sin(t * 0.003 + i) * 4;
        poly(g, [[0, 0], [r, -r * 0.42], [r * 1.15, r * 0.1]]);
      }
      g.restore();
    }
    g.restore();
  }

  function drawLissajous(g, t) {
    var a = 3 + Math.sin(t * 0.0004) * 1.4, b = 2;
    var d = t * 0.0011;
    g.strokeStyle = '#5ef2c8'; g.lineWidth = 2.4;
    g.beginPath();
    for (var i = 0; i <= 260; i++) {
      var p = i / 260 * TAU;
      var px = 80 + Math.sin(a * p + d) * 62, py = 60 + Math.sin(b * p) * 44;
      if (i) g.lineTo(px, py); else g.moveTo(px, py);
    }
    g.stroke();
    g.strokeStyle = 'rgba(255,90,170,0.8)'; g.lineWidth = 1.4;
    g.beginPath();
    for (var j = 0; j <= 260; j++) {
      var q = j / 260 * TAU;
      var qx = 80 + Math.sin(b * q + d * 1.7) * 62, qy = 60 + Math.sin(a * q) * 44;
      if (j) g.lineTo(qx, qy); else g.moveTo(qx, qy);
    }
    g.stroke();
  }

  function drawMoire(g, t) {
    for (var i = 0; i < 14; i++) {
      var r = ((t * 0.03 + i * 9) % 126);
      ring(g, 58, 60, r, 2, 'rgba(255,120,200,0.6)');
      ring(g, 102, 60, r, 2, 'rgba(120,220,255,0.55)');
    }
  }

  function drawTessellation(g, t) {
    var cols = ['#ff5f6d', '#ffc371', '#4fd8ff', '#8affa0'];
    for (var r = 0; r < 6; r++) {
      for (var c = 0; c < 9; c++) {
        var x = c * 20 - 10 + (r % 2 ? 10 : 0);
        var y = r * 22 - 8;
        var k = (r + c + Math.floor(t / 260)) % cols.length;
        g.fillStyle = cols[k];
        var up = (r + c) % 2 === 0;
        var wob = Math.sin(t * 0.004 + r + c) * 2.5;
        if (up) poly(g, [[x, y + 20], [x + 10, y + wob], [x + 20, y + 20]]);
        else poly(g, [[x, y], [x + 20, y], [x + 10, y + 20 + wob]]);
      }
    }
  }

  function drawSierpinski(g, t) {
    var depth = 1 + Math.floor((t % 5200) / 1300);
    g.fillStyle = '#ffd447';
    (function tri(x, y, s, d) {
      if (d === 0) { poly(g, [[x, y], [x + s, y], [x + s / 2, y - s * 0.866]]); return; }
      tri(x, y, s / 2, d - 1);
      tri(x + s / 2, y, s / 2, d - 1);
      tri(x + s / 4, y - s * 0.433, s / 2, d - 1);
    })(22, 106, 116, depth);
  }

  /* ================================================================
     ANIMALS DOING WEIRD THINGS
     ================================================================ */

  function drawOctopusDJ(g, t) {
    var beat = Math.abs(Math.sin(t * 0.0075));
    g.fillStyle = '#2b2b38';                      /* decks */
    g.fillRect(14, 78, 44, 30); g.fillRect(102, 78, 44, 30);
    g.fillStyle = '#d8dde4';
    ell(g, 36, 92, 15, 15); ell(g, 124, 92, 15, 15);
    g.fillStyle = '#e0339a';
    ell(g, 36, 92, 4, 4); ell(g, 124, 92, 4, 4);
    seg(g, 36, 92, 36 + Math.cos(t * 0.02) * 13, 92 + Math.sin(t * 0.02) * 13, 2, '#333');
    g.fillStyle = '#a24fd8';                      /* tentacles */
    for (var i = 0; i < 6; i++) {
      var a = -2.5 + i * 0.62;
      var wig = Math.sin(t * 0.008 + i) * 0.5;
      limb(g, 80 + Math.cos(a) * 16, 56 + Math.sin(a) * 10, 30, 6, a + wig + 1.57);
    }
    g.fillStyle = '#c46bf0';                      /* head */
    ell(g, 80, 42 - beat * 3, 26, 24);
    g.fillStyle = '#fff';
    ell(g, 71, 40, 7, 8); ell(g, 89, 40, 7, 8);
    g.fillStyle = '#161018';
    ell(g, 71, 41, 3.2, 4); ell(g, 89, 41, 3.2, 4);
    g.fillStyle = '#2b2b38';                      /* headphones */
    g.fillRect(52, 34, 7, 16); g.fillRect(101, 34, 7, 16);
    ring(g, 80, 40, 28, 4, '#2b2b38');
  }

  function drawFrogUnicycle(g, t) {
    var pedal = t * 0.009;
    var x = 80 + Math.sin(t * 0.0012) * 34;
    g.save();
    g.translate(x, 0);
    ring(g, 0, 92, 20, 3.4, '#d8d8e0');           /* wheel */
    for (var i = 0; i < 6; i++) {
      var a = pedal + i * TAU / 6;
      seg(g, 0, 92, Math.cos(a) * 18, 92 + Math.sin(a) * 18, 1.4, '#9aa0ac');
    }
    g.fillStyle = '#8a8f99'; g.fillRect(-2, 58, 4, 16);
    g.fillStyle = '#4fae5c';                      /* frog */
    ell(g, 0, 48, 20, 17);
    ell(g, -13, 36, 8, 8); ell(g, 13, 36, 8, 8);
    g.fillStyle = '#f6f4e2';
    ell(g, -13, 35, 5, 5); ell(g, 13, 35, 5, 5);
    g.fillStyle = '#10160e';
    ell(g, -13, 35, 2.4, 2.6); ell(g, 13, 35, 2.4, 2.6);
    g.strokeStyle = '#1d3a1a'; g.lineWidth = 2;
    g.beginPath(); g.arc(0, 48, 12, 0.25, 2.9); g.stroke();
    g.fillStyle = '#3f8f4a';                      /* legs pedalling */
    limb(g, -7, 60, 15, 6, Math.sin(pedal) * 0.8 + 0.3);
    limb(g, 7, 60, 15, 6, Math.sin(pedal + 3.14) * 0.8 - 0.3);
    limb(g, -17, 44, 14, 5, -1.1 + Math.sin(pedal) * 0.3);
    limb(g, 17, 44, 14, 5, 1.1 - Math.sin(pedal) * 0.3);
    g.restore();
  }

  function drawRocketSnail(g, t) {
    var x = ((t * 0.07) % 220) - 40;
    g.fillStyle = 'rgba(120,220,180,0.45)';       /* slime trail */
    g.fillRect(0, 92, W, 6);
    g.save();
    g.translate(x, 0);
    for (var i = 0; i < 5; i++) {                 /* exhaust */
      g.fillStyle = i % 2 ? 'rgba(255,180,40,0.9)' : 'rgba(255,240,150,0.9)';
      ell(g, -30 - i * 8 - Math.random() * 4, 70, 8 - i, 5 - i * 0.6);
    }
    g.fillStyle = '#c9563f'; g.fillRect(-30, 62, 22, 12);   /* booster */
    g.fillStyle = '#e8e2d0'; g.fillRect(-16, 60, 10, 16);
    g.fillStyle = '#d9b06a';                      /* body */
    ell(g, 6, 80, 26, 10);
    ell(g, 26, 72, 8, 8);
    g.fillStyle = '#0f0d0a';
    ell(g, 29, 68, 2.2, 2.2);
    seg(g, 26, 66, 30, 56, 1.6, '#d9b06a');
    seg(g, 21, 66, 17, 56, 1.6, '#d9b06a');
    g.fillStyle = '#8a5a2a';                      /* shell */
    ell(g, 2, 68, 20, 18);
    g.strokeStyle = '#5d3a18'; g.lineWidth = 2.2;
    g.beginPath();
    for (var k = 0; k < 40; k++) {
      var a = k * 0.36, r = k * 0.48;
      var px = 2 + Math.cos(a) * r, py = 68 + Math.sin(a) * r;
      if (k) g.lineTo(px, py); else g.moveTo(px, py);
    }
    g.stroke();
    g.restore();
  }

  function drawBizCat(g, t) {
    var type = Math.sin(t * 0.03);
    g.fillStyle = '#5b4636'; g.fillRect(0, 92, W, 28);      /* desk */
    g.fillStyle = '#c8ccd4';                                 /* laptop */
    poly(g, [[52, 92], [108, 92], [116, 62], [44, 62]]);
    g.fillStyle = '#1b2430'; g.fillRect(48, 64, 64, 26);
    g.fillStyle = '#5efac0';
    for (var i = 0; i < 4; i++) g.fillRect(52, 68 + i * 5, 20 + ((t / 200 + i) % 5) * 7, 2);
    g.fillStyle = '#2b3550'; g.fillRect(58, 30, 44, 34);     /* suit */
    g.fillStyle = '#f4f4f0'; poly(g, [[74, 30], [86, 30], [80, 48]]);
    g.fillStyle = '#b83a3a'; poly(g, [[78, 34], [82, 34], [83, 50], [77, 50]]);
    g.fillStyle = '#8c8378';                                 /* head */
    ell(g, 80, 22, 20, 17);
    poly(g, [[64, 12], [70, -4], [78, 10]]);
    poly(g, [[96, 12], [90, -4], [82, 10]]);
    g.fillStyle = '#3fe08a';
    ell(g, 73, 20, 4.6, 5.4); ell(g, 87, 20, 4.6, 5.4);
    g.fillStyle = '#10140f';
    ell(g, 73, 20, 1.6, 4.6); ell(g, 87, 20, 1.6, 4.6);
    g.fillStyle = '#e0a0a8'; ell(g, 80, 28, 3, 2.2);
    g.fillStyle = '#8c8378';                                 /* paws typing */
    ell(g, 66, 88 + type * 3, 7, 5);
    ell(g, 94, 88 - type * 3, 7, 5);
  }

  function drawSlothDance(g, t) {
    var ph = t * 0.005;
    g.save();
    g.translate(80, 64 + Math.sin(ph * 2) * 5);
    g.rotate(Math.sin(ph) * 0.5);
    g.fillStyle = '#8a7b63';
    limb(g, -14, 8, 26, 8, 1.2 + Math.sin(ph * 2) * 0.9);
    limb(g, 14, 8, 26, 8, -1.2 - Math.sin(ph * 2) * 0.9);
    limb(g, -8, 26, 22, 9, 0.5 + Math.sin(ph * 2 + 1) * 0.7);
    limb(g, 8, 26, 22, 9, -0.5 - Math.sin(ph * 2 + 1) * 0.7);
    ell(g, 0, 8, 20, 24);
    g.fillStyle = '#a1917a';
    ell(g, 0, -18, 18, 16);
    g.fillStyle = '#6b5c46';
    ell(g, -7, -19, 6, 7); ell(g, 7, -19, 6, 7);
    g.fillStyle = '#efe7d6';
    ell(g, -7, -19, 3, 3.6); ell(g, 7, -19, 3, 3.6);
    g.fillStyle = '#241c12';
    ell(g, -7, -19, 1.5, 2); ell(g, 7, -19, 1.5, 2);
    ell(g, 0, -12, 3.4, 2.6);
    g.strokeStyle = '#241c12'; g.lineWidth = 1.6;
    g.beginPath(); g.arc(0, -12, 7, 0.4, 2.7); g.stroke();
    g.restore();
    g.fillStyle = 'rgba(255,220,80,0.85)';                  /* disco sparkles */
    for (var i = 0; i < 5; i++) {
      var sx = 16 + i * 32, sy = 20 + ((i * 37 + t * 0.05) % 90);
      star(g, sx, sy, 5, 2, 4, t * 0.004 + i);
    }
  }

  function drawCrabShades(g, t) {
    var snap = Math.abs(Math.sin(t * 0.008));
    g.fillStyle = 'rgba(240,220,160,0.5)'; g.fillRect(0, 100, W, 20);
    g.fillStyle = '#d8452f';
    for (var i = 0; i < 3; i++) {                            /* legs */
      limb(g, 58 - i * 4, 78, 18, 4.5, 0.7 + Math.sin(t * 0.01 + i) * 0.3);
      limb(g, 102 + i * 4, 78, 18, 4.5, -0.7 - Math.sin(t * 0.01 + i) * 0.3);
    }
    ell(g, 80, 66, 34, 22);                                  /* shell */
    g.fillStyle = '#f0654c';
    ell(g, 80, 62, 28, 14);
    g.fillStyle = '#d8452f';                                 /* claws */
    g.save(); g.translate(38, 54); g.rotate(-0.4 - snap * 0.3);
    ell(g, 0, 0, 13, 9); g.fillStyle = '#f0654c'; ell(g, 6, -4 - snap * 4, 9, 5);
    g.restore();
    g.fillStyle = '#d8452f';
    g.save(); g.translate(122, 54); g.rotate(0.4 + snap * 0.3);
    ell(g, 0, 0, 13, 9); g.fillStyle = '#f0654c'; ell(g, -6, -4 - snap * 4, 9, 5);
    g.restore();
    g.fillStyle = '#d8452f'; g.fillRect(69, 40, 4, 12); g.fillRect(87, 40, 4, 12);
    g.fillStyle = '#14141c';                                 /* shades */
    g.fillRect(58, 34, 44, 11);
    g.fillStyle = '#2b6cf0';
    g.fillRect(61, 36, 16, 7); g.fillRect(83, 36, 16, 7);
    g.fillStyle = 'rgba(255,255,255,0.75)';
    g.fillRect(62, 37, 5, 2); g.fillRect(84, 37, 5, 2);
  }

  function drawPigeonLift(g, t) {
    var lift = Math.abs(Math.sin(t * 0.004));
    var by = 44 - lift * 22;
    g.fillStyle = '#7d8794';
    ell(g, 80, 78, 20, 22);                                  /* body */
    g.fillStyle = '#5f6b7a';
    ell(g, 80, 84, 13, 14);
    g.fillStyle = '#8b96a4';
    ell(g, 80, 50, 12, 11);                                  /* head */
    g.fillStyle = '#4fd0b0';
    ell(g, 74, 56, 5, 4);                                    /* neck sheen */
    g.fillStyle = '#f0a83c';
    poly(g, [[90, 50], [100, 53], [90, 55]]);                /* beak */
    g.fillStyle = '#f4f4f4'; ell(g, 85, 47, 3.4, 3.4);
    g.fillStyle = '#c8341f'; ell(g, 85, 47, 1.8, 1.8);
    g.fillStyle = '#f0a83c';                                 /* feet */
    g.fillRect(72, 98, 4, 8); g.fillRect(85, 98, 4, 8);
    g.fillStyle = '#7d8794';                                 /* wings as arms */
    limb(g, 64, 62, 22, 8, 2.5 + lift * 0.5);
    limb(g, 96, 62, 22, 8, -2.5 - lift * 0.5);
    g.fillStyle = '#2b2b34';                                 /* barbell */
    g.fillRect(34, by - 2, 92, 5);
    ell(g, 36, by, 11, 13); ell(g, 124, by, 11, 13);
    g.fillStyle = '#4a4a58';
    ell(g, 36, by, 6, 8); ell(g, 124, by, 6, 8);
  }

  /* ================================================================
     SPACESHIPS
     ================================================================ */

  function drawRocketLaunch(g, t) {
    var y = 130 - ((t * 0.05) % 200);
    g.fillStyle = 'rgba(180,180,190,0.4)';                   /* smoke */
    for (var i = 0; i < 6; i++) {
      ell(g, 80 + Math.sin(i * 2 + t * 0.002) * 16, y + 46 + i * 12, 12 + i * 3, 9 + i * 2);
    }
    for (var f = 0; f < 4; f++) {                            /* flame */
      g.fillStyle = f % 2 ? 'rgba(255,120,30,0.95)' : 'rgba(255,230,120,0.95)';
      poly(g, [[74 + f, y + 30], [80, y + 52 + Math.random() * 10], [86 - f, y + 30]]);
    }
    g.fillStyle = '#e6e9ee';                                 /* body */
    poly(g, [[80, y - 34], [92, y + 4], [92, y + 30], [68, y + 30], [68, y + 4]]);
    g.fillStyle = '#d8352f';
    poly(g, [[80, y - 34], [88, y - 6], [72, y - 6]]);
    poly(g, [[68, y + 12], [58, y + 34], [68, y + 30]]);
    poly(g, [[92, y + 12], [102, y + 34], [92, y + 30]]);
    g.fillStyle = '#3fc0f0';
    ell(g, 80, y + 8, 6.5, 6.5);
    g.fillStyle = '#12324a';
    ell(g, 80, y + 8, 3.4, 3.4);
  }

  function drawWarpSpeed(g, t) {
    for (var i = 0; i < 60; i++) {
      var a = i * 2.399;
      var d = ((t * 0.09 + i * 31) % 120);
      var len = 4 + d * 0.34;
      var x1 = 80 + Math.cos(a) * d, y1 = 60 + Math.sin(a) * d * 0.8;
      var x2 = 80 + Math.cos(a) * (d + len), y2 = 60 + Math.sin(a) * (d + len) * 0.8;
      var b = Math.min(1, d / 90);
      g.strokeStyle = 'rgba(' + (170 + b * 85 | 0) + ',' + (200 + b * 55 | 0) + ',255,' + (0.25 + b * 0.7).toFixed(2) + ')';
      g.lineWidth = 0.8 + b * 2.2;
      g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
    }
    g.fillStyle = 'rgba(200,235,255,0.9)';
    ell(g, 80, 60, 3 + Math.sin(t * 0.01) * 1.2, 3);
  }

  function drawDogfight(g, t) {
    var ax = 40 + Math.sin(t * 0.0021) * 30, ay = 40 + Math.cos(t * 0.0017) * 18;
    var bx = 120 + Math.sin(t * 0.0019 + 2) * 26, by = 78 + Math.cos(t * 0.0023) * 16;
    if (Math.floor(t / 260) % 3 === 0) seg(g, ax, ay, bx, by, 2.4, 'rgba(90,255,120,0.95)');
    if (Math.floor(t / 310) % 4 === 0) seg(g, bx, by, ax, ay, 2, 'rgba(255,90,90,0.95)');
    function ship(x, y, col, dome, flip) {
      g.fillStyle = col; ell(g, x, y, 20, 5.4);
      g.fillStyle = dome; ell(g, x, y - 4, 10, 6.5);
      g.fillStyle = 'rgba(255,240,160,0.9)';
      ell(g, x - 13 * flip, y + 2, 3, 2.2); ell(g, x + 13 * flip, y + 2, 3, 2.2);
    }
    ship(ax, ay, '#8f98a4', '#7fe0ff', 1);
    ship(bx, by, '#9a6a4a', '#ff9f5e', -1);
    for (var i = 0; i < 18; i++) {
      g.fillStyle = 'rgba(255,255,255,0.55)';
      ell(g, (i * 71 % 156) + 3, (i * 43 % 112) + 4, 1.2, 1.2);
    }
  }

  function drawSatellite(g, t) {
    g.fillStyle = '#2f6fd0';                                 /* planet edge */
    ell(g, 80, 132, 78, 52);
    g.fillStyle = '#4a9a5c';
    ell(g, 56, 116, 22, 9); ell(g, 104, 122, 18, 7);
    var a = t * 0.0013;
    var sx = 80 + Math.cos(a) * 58, sy = 56 + Math.sin(a) * 26;
    g.save();
    g.translate(sx, sy);
    g.rotate(Math.sin(a) * 0.4);
    g.fillStyle = '#1f4fd0';
    g.fillRect(-30, -7, 20, 14); g.fillRect(10, -7, 20, 14);
    g.strokeStyle = '#8fb8ff'; g.lineWidth = 1;
    for (var i = 0; i < 3; i++) {
      g.beginPath(); g.moveTo(-30, -7 + i * 7); g.lineTo(-10, -7 + i * 7); g.stroke();
      g.beginPath(); g.moveTo(10, -7 + i * 7); g.lineTo(30, -7 + i * 7); g.stroke();
    }
    g.fillStyle = '#d8d2c4'; g.fillRect(-9, -9, 18, 18);
    g.fillStyle = '#f0a83c'; ell(g, 0, 0, 5, 5);
    g.restore();
    for (var k = 0; k < 16; k++) {
      g.fillStyle = 'rgba(255,255,255,0.6)';
      ell(g, (k * 59 % 154) + 3, (k * 29 % 70) + 4, 1.3, 1.3);
    }
  }

  function drawDocking(g, t) {
    var c = (t % 5200) / 5200;
    var approach = c < 0.7 ? c / 0.7 : 1;
    g.fillStyle = '#8b93a0';                                 /* station */
    ell(g, 44, 60, 16, 16);
    g.fillRect(56, 55, 26, 10);
    ring(g, 44, 60, 26, 3.5, '#6f7783');
    g.fillStyle = '#3fc0f0';
    ell(g, 44, 60, 7, 7);
    var sx = 150 - approach * 62;
    g.fillStyle = '#e2e6ec';                                 /* shuttle */
    poly(g, [[sx + 20, 60], [sx - 12, 52], [sx - 12, 68]]);
    g.fillStyle = '#c8452f';
    g.fillRect(sx - 12, 54, 6, 12);
    g.fillStyle = '#3fc0f0';
    ell(g, sx + 8, 60, 4, 3.4);
    if (approach < 1) {
      g.fillStyle = 'rgba(120,200,255,0.8)';
      ell(g, sx - 16 - Math.random() * 5, 60, 5, 3);
    } else if (Math.floor(t / 220) % 2) {
      g.fillStyle = 'rgba(120,255,150,0.9)';
      ell(g, 84, 60, 4, 4);
    }
    for (var k = 0; k < 20; k++) {
      g.fillStyle = 'rgba(255,255,255,0.5)';
      ell(g, (k * 67 % 156) + 2, (k * 41 % 114) + 3, 1.2, 1.2);
    }
  }

  /* ================================================================
     HORROR
     ================================================================ */

  function drawHauntedHouse(g, t) {
    var flash = (t % 3100) < 130 ? 1 : ((t % 3100) < 220 ? 0.5 : 0);
    if (flash) { g.fillStyle = 'rgba(200,220,255,' + (flash * 0.5) + ')'; g.fillRect(0, 0, W, H); }
    g.fillStyle = '#141826';
    poly(g, [[30, 106], [30, 58], [56, 58], [56, 40], [80, 22], [104, 40], [104, 58], [130, 58], [130, 106]]);
    g.fillStyle = '#0c0f18';
    g.fillRect(24, 104, 112, 16);
    g.fillStyle = flash ? '#ffe9a0' : '#f0c040';             /* windows */
    g.fillRect(42, 70, 14, 14); g.fillRect(104, 70, 14, 14);
    poly(g, [[74, 44], [86, 44], [86, 56], [74, 56]]);
    g.fillStyle = '#241a10';
    g.fillRect(72, 82, 16, 24);
    if (flash) {
      g.strokeStyle = 'rgba(220,240,255,0.95)'; g.lineWidth = 2.2;
      g.beginPath(); g.moveTo(120, 0); g.lineTo(108, 22); g.lineTo(120, 26);
      g.lineTo(104, 52); g.stroke();
    }
    g.fillStyle = '#0a0c14';                                 /* dead tree */
    g.fillRect(14, 62, 6, 44);
    seg(g, 17, 74, 4, 60, 3, '#0a0c14');
    seg(g, 17, 82, 30, 66, 3, '#0a0c14');
  }

  function drawGraveHand(g, t) {
    var rise = Math.min(1, (t % 4200) / 2600);
    var y = 104 - rise * 44;
    g.fillStyle = '#2a2b33';                                 /* headstone */
    poly(g, [[46, 96], [46, 54], [56, 44], [70, 44], [80, 54], [80, 96]]);
    g.fillStyle = '#4a4c58';
    g.fillRect(52, 58, 22, 4); g.fillRect(52, 68, 22, 3); g.fillRect(52, 76, 14, 3);
    g.fillStyle = '#241a12';                                 /* mound */
    ell(g, 80, 104, 62, 14);
    g.fillStyle = '#b9b3a2';                                 /* hand */
    g.save();
    g.translate(104, y);
    g.rotate(Math.sin(t * 0.004) * 0.16);
    g.fillRect(-7, 0, 14, 26);
    for (var i = 0; i < 4; i++) {
      limb(g, -6 + i * 4, -2, -14 - (i === 1 || i === 2 ? 4 : 0), 3.6,
           Math.sin(t * 0.006 + i) * 0.2);
    }
    limb(g, -8, 8, -11, 3.6, 1.1);
    g.restore();
    g.fillStyle = '#241a12';
    ell(g, 104, 104, 18, 6);
  }

  function drawScream(g, t) {
    var wob = Math.sin(t * 0.006) * 3;
    var mouth = 14 + Math.abs(Math.sin(t * 0.005)) * 12;
    for (var i = 4; i > 0; i--) {                            /* rippling air */
      ring(g, 80, 58, 40 + i * 9 + Math.sin(t * 0.005 + i) * 4, 2,
           'rgba(255,120,60,' + (0.10 * i).toFixed(2) + ')');
    }
    g.fillStyle = '#e8c39a';
    g.save();
    g.translate(80, 58 + wob * 0.4);
    ell(g, 0, 0, 30, 40);
    g.fillStyle = '#1a1014';
    ell(g, -12, -10, 8, 11); ell(g, 12, -10, 8, 11);
    g.fillStyle = '#f2e2cc';
    ell(g, -12, -10, 3, 4); ell(g, 12, -10, 3, 4);
    g.fillStyle = '#1a1014';
    ell(g, 0, 4, 4, 6);
    ell(g, 0, 22, 11, mouth);
    g.fillStyle = '#5a1220';
    ell(g, 0, 26, 6, mouth * 0.5);
    g.restore();
    g.fillStyle = '#c8b18a';                                 /* hands at cheeks */
    ell(g, 46, 66 + wob, 9, 13); ell(g, 114, 66 - wob, 9, 13);
  }

  function drawBatsMoon(g, t) {
    g.fillStyle = '#f4efc8';
    ell(g, 108, 36, 26, 26);
    g.fillStyle = '#ddd6ab';
    ell(g, 100, 30, 6, 5); ell(g, 116, 44, 7, 5);
    g.fillStyle = '#0e0d14';
    for (var i = 0; i < 7; i++) {
      var bx = ((t * 0.045 + i * 44) % 210) - 26;
      var by = 30 + Math.sin(t * 0.004 + i * 1.4) * 26 + i * 5;
      var flap = Math.sin(t * 0.02 + i) * 5;
      var sc = 0.6 + (i % 3) * 0.28;
      g.save();
      g.translate(bx, by);
      g.scale(sc, sc);
      ell(g, 0, 0, 5, 4);
      poly(g, [[-3, -1], [-16, -6 - flap], [-11, 1], [-16, 4 - flap], [-3, 3]]);
      poly(g, [[3, -1], [16, -6 + flap], [11, 1], [16, 4 + flap], [3, 3]]);
      poly(g, [[-3, -4], [-1, -8], [0, -4]]);
      poly(g, [[3, -4], [1, -8], [0, -4]]);
      g.restore();
    }
  }

  function drawCreatureEyes(g, t) {
    var pairs = [[38, 46, 1.0], [96, 34, 0.75], [66, 82, 0.6], [124, 74, 0.85], [20, 92, 0.5]];
    for (var i = 0; i < pairs.length; i++) {
      var px = pairs[i][0], py = pairs[i][1], sc = pairs[i][2];
      var blink = Math.sin(t * 0.003 + i * 2.1);
      var open = blink > 0.72 ? Math.max(0.05, (1 - blink) * 3.6) : 1;
      var drift = Math.sin(t * 0.0016 + i) * 2.2;
      g.fillStyle = i % 2 ? '#ffd23f' : '#ff5a3c';
      ell(g, px, py, 8 * sc, 8 * sc * open);
      ell(g, px + 22 * sc, py, 8 * sc, 8 * sc * open);
      if (open > 0.35) {
        g.fillStyle = '#100c10';
        ell(g, px + drift, py, 2.6 * sc, 6 * sc * open);
        ell(g, px + 22 * sc + drift, py, 2.6 * sc, 6 * sc * open);
      }
    }
    g.fillStyle = 'rgba(20,10,20,0.35)';
    for (var k = 0; k < 5; k++) g.fillRect(k * 34 - 4, 0, 10, H);
  }

  /* ================================================================
     ESOTERIC II
     ================================================================ */

  function drawCaduceus(g, t) {
    g.fillStyle = '#d8bc63';
    g.fillRect(78, 20, 4, 92);
    ell(g, 80, 18, 6, 6);
    for (var w = 0; w < 2; w++) {               /* wings */
      var s = w ? 1 : -1;
      for (var f = 0; f < 4; f++) {
        g.fillStyle = f % 2 ? '#f0e2b0' : '#d8bc63';
        poly(g, [[80 + s * 4, 26 + f * 3],
                 [80 + s * (26 + f * 5), 20 + f * 6],
                 [80 + s * 4, 34 + f * 3]]);
      }
    }
    for (var k = 0; k < 2; k++) {               /* twin serpents */
      g.strokeStyle = k ? '#4fae5c' : '#3a8fd0';
      g.lineWidth = 4;
      g.beginPath();
      for (var i = 0; i <= 40; i++) {
        var y = 34 + i * 1.9;
        var x = 80 + Math.sin(i * 0.42 + t * 0.004 + k * Math.PI) * 17;
        if (i) g.lineTo(x, y); else g.moveTo(x, y);
      }
      g.stroke();
      var hy = 34, hx = 80 + Math.sin(t * 0.004 + k * Math.PI) * 17;
      g.fillStyle = k ? '#66c973' : '#57a8e8';
      ell(g, hx, hy, 7, 5);
      g.fillStyle = '#e8d24a';
      ell(g, hx + (k ? 2 : -2), hy - 1, 1.6, 1.6);
    }
  }

  function drawTreeOfLife(g, t) {
    var n = [[80,14],[58,32],[102,32],[58,56],[102,56],[80,68],[58,82],[102,82],[80,96],[80,112]];
    var paths = [0,1,0,2,1,2,1,3,2,4,3,4,1,5,2,5,3,5,4,5,3,6,4,7,5,6,5,7,6,7,6,8,7,8,5,8,8,9];
    for (var i = 0; i < paths.length; i += 2) {
      seg(g, n[paths[i]][0], n[paths[i]][1], n[paths[i+1]][0], n[paths[i+1]][1], 1.6,
          'rgba(226,206,140,0.55)');
    }
    for (var k = 0; k < n.length; k++) {
      var pulse = 0.55 + 0.45 * Math.sin(t * 0.004 - k * 0.55);
      g.fillStyle = 'rgba(255,236,160,' + (0.35 + pulse * 0.6).toFixed(2) + ')';
      ell(g, n[k][0], n[k][1], 7 + pulse * 2, 7 + pulse * 2);
      g.fillStyle = '#3a2c0e';
      ell(g, n[k][0], n[k][1], 3.4, 3.4);
    }
  }

  function drawPhilosophersStone(g, t) {
    var r = t * 0.0016;
    for (var i = 5; i > 0; i--) {
      ring(g, 80, 60, 22 + i * 7 + Math.sin(t * 0.004 + i) * 3, 1.6,
           'rgba(220,60,90,' + (0.12 * i).toFixed(2) + ')');
    }
    g.save();
    g.translate(80, 60);
    g.rotate(r);
    g.fillStyle = '#c8203f';
    poly(g, [[0, -30], [24, -8], [15, 26], [-15, 26], [-24, -8]]);
    g.fillStyle = '#f0506e';
    poly(g, [[0, -30], [24, -8], [0, 2], [-24, -8]]);
    g.fillStyle = '#8a0f28';
    poly(g, [[0, 2], [15, 26], [-15, 26]]);
    g.fillStyle = 'rgba(255,220,230,0.7)';
    poly(g, [[0, -26], [10, -10], [0, -4], [-10, -10]]);
    g.restore();
  }

  function drawSolLuna(g, t) {
    var c = (t % 5000) / 5000;
    var gap = (1 - Math.abs(Math.sin(c * Math.PI))) * 34;
    g.fillStyle = '#e8b830';                    /* Sol */
    for (var i = 0; i < 12; i++) {
      var a = i * TAU / 12 + t * 0.001;
      seg(g, 80 - gap, 60, 80 - gap + Math.cos(a) * 34, 60 + Math.sin(a) * 34, 3, '#e8b830');
    }
    ell(g, 80 - gap, 60, 22, 22);
    g.fillStyle = '#8a6a10';
    ell(g, 80 - gap - 7, 56, 2.6, 3.4); ell(g, 80 - gap + 7, 56, 2.6, 3.4);
    g.strokeStyle = '#8a6a10'; g.lineWidth = 2;
    g.beginPath(); g.arc(80 - gap, 62, 9, 0.35, 2.79); g.stroke();
    g.fillStyle = '#cfd6e2';                    /* Luna */
    ell(g, 80 + gap, 60, 20, 20);
    g.fillStyle = '#8d97a8';
    ell(g, 80 + gap + 8, 60, 16, 18);
    g.fillStyle = '#5a6270';
    ell(g, 80 + gap - 7, 56, 2.4, 3.2);
    if (gap < 6) {
      g.fillStyle = 'rgba(255,250,210,' + ((6 - gap) / 6 * 0.55).toFixed(2) + ')';
      ell(g, 80, 60, 40, 40);
    }
  }

  function drawThirdEye(g, t) {
    var open = Math.max(0, Math.sin(t * 0.0016));
    g.fillStyle = '#d8a882';                    /* brow */
    ell(g, 80, 74, 40, 46);
    g.fillStyle = '#3a2a1e';
    ell(g, 62, 62, 10, 4, -0.3); ell(g, 98, 62, 10, 4, 0.3);
    g.fillStyle = '#1a1014';
    ell(g, 62, 72, 7, 3.4); ell(g, 98, 72, 7, 3.4);
    if (open > 0.02) {                          /* the eye itself */
      g.fillStyle = '#f6efdc';
      ell(g, 80, 40, 24, 16 * open);
      g.fillStyle = '#6a3fc0';
      ell(g, 80, 40, 10 * Math.min(1, open * 1.4), 10 * open);
      g.fillStyle = '#0d0a12';
      ell(g, 80, 40, 4.4 * Math.min(1, open * 1.4), 4.4 * open);
      g.fillStyle = 'rgba(255,255,255,0.85)';
      ell(g, 76, 36, 2.6 * open, 2 * open);
      for (var i = 0; i < 10; i++) {
        var a = i * TAU / 10 + t * 0.0016;
        seg(g, 80, 40, 80 + Math.cos(a) * (30 + open * 22), 40 + Math.sin(a) * (30 + open * 22),
            1.6, 'rgba(190,150,255,' + (open * 0.4).toFixed(2) + ')');
      }
    }
  }

  function drawScryingMirror(g, t) {
    ring(g, 80, 60, 44, 5, '#b89a4a');
    g.fillStyle = '#0a0810';
    ell(g, 80, 60, 40, 40);
    for (var i = 0; i < 7; i++) {                /* smoke coils */
      var a = t * 0.0011 + i * 0.9;
      var r = 8 + (i * 4.6) + Math.sin(t * 0.003 + i) * 5;
      g.fillStyle = 'rgba(140,110,200,' + (0.26 - i * 0.03).toFixed(2) + ')';
      ell(g, 80 + Math.cos(a) * r * 0.5, 60 + Math.sin(a) * r * 0.4, r * 0.7, r * 0.5, a);
    }
    var face = Math.max(0, Math.sin(t * 0.0009));
    if (face > 0.25) {
      g.fillStyle = 'rgba(200,190,230,' + ((face - 0.25) * 0.5).toFixed(2) + ')';
      ell(g, 80, 58, 15, 19);
      g.fillStyle = 'rgba(10,8,16,' + ((face - 0.25) * 0.8).toFixed(2) + ')';
      ell(g, 74, 54, 3, 4); ell(g, 86, 54, 3, 4);
      ell(g, 80, 68, 4, 5);
    }
  }

  function drawOuija(g, t) {
    g.fillStyle = '#c8a35e';
    g.fillRect(8, 12, 144, 96);
    g.fillStyle = '#8a6a30';
    g.fillRect(8, 12, 144, 4);
    g.fillStyle = '#3a2a12';
    g.font = 'bold 11px Georgia, serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    var A = 'ABCDEFGHIJKLM', B = 'NOPQRSTUVWXYZ';
    for (var i = 0; i < 13; i++) {
      g.fillText(A[i], 18 + i * 10.4, 40);
      g.fillText(B[i], 18 + i * 10.4, 58);
    }
    g.font = 'bold 10px Georgia, serif';
    for (var d = 0; d < 10; d++) g.fillText(String(d), 26 + d * 12, 76);
    g.font = 'bold 12px Georgia, serif';
    g.fillText('YES', 28, 26); g.fillText('NO', 132, 26);
    g.fillText('GOODBYE', 80, 96);
    var px = 80 + Math.sin(t * 0.0013) * 52;     /* planchette */
    var py = 56 + Math.sin(t * 0.0019 + 1) * 24;
    g.fillStyle = 'rgba(232,220,190,0.92)';
    poly(g, [[px, py - 16], [px + 15, py + 8], [px - 15, py + 8]]);
    g.fillStyle = 'rgba(20,16,10,0.8)';
    ring(g, px, py - 2, 6, 2, 'rgba(40,30,16,0.9)');
  }

  function drawRuneCast(g, t) {
    var glyphs = [
      [[0,-9,0,9]], [[0,-9,0,9],[0,-9,7,-3],[0,1,7,-3]],
      [[0,-9,0,9],[0,-9,7,0],[7,0,0,9]], [[-6,9,0,-9],[0,-9,6,9]],
      [[0,-9,0,9],[-6,-9,6,-9]], [[-6,-9,-6,9],[-6,-9,6,-2],[6,-2,-6,5]],
      [[-6,-9,0,0],[0,0,6,-9],[0,0,0,9]], [[-6,-9,6,9],[6,-9,-6,9]]
    ];
    for (var i = 0; i < 9; i++) {
      var seed = i * 137.5;
      var x = 26 + (i % 3) * 44 + Math.sin(t * 0.0009 + seed) * 5;
      var y = 32 + Math.floor(i / 3) * 32 + Math.cos(t * 0.0011 + seed) * 4;
      var lit = Math.sin(t * 0.004 + i * 1.3) > 0.55;
      g.fillStyle = '#8d7d68';
      g.fillRect(x - 13, y - 15, 26, 30);
      var gl = glyphs[i % glyphs.length];
      for (var k = 0; k < gl.length; k++) {
        seg(g, x + gl[k][0], y + gl[k][1], x + gl[k][2], y + gl[k][3], 2.4,
            lit ? '#ff5f4a' : '#40342a');
      }
    }
  }

  function drawMicrocosmicMan(g, t) {
    var pulse = 0.5 + 0.5 * Math.sin(t * 0.003);
    ring(g, 80, 60, 46, 2, 'rgba(220,200,140,0.8)');
    g.strokeStyle = 'rgba(200,60,80,' + (0.45 + pulse * 0.5).toFixed(2) + ')';
    g.lineWidth = 2;
    g.beginPath();
    for (var i = 0; i <= 5; i++) {
      var a = -Math.PI / 2 + (i * 2) * TAU / 5;
      var px = 80 + Math.cos(a) * 46, py = 60 + Math.sin(a) * 46;
      if (i) g.lineTo(px, py); else g.moveTo(px, py);
    }
    g.stroke();
    g.fillStyle = '#e2cfae';                     /* the figure */
    ell(g, 80, 24, 9, 10);
    g.fillRect(74, 34, 12, 30);
    limb(g, 74, 38, 34, 6, 1.05);
    limb(g, 86, 38, 34, 6, -1.05);
    limb(g, 76, 62, 34, 7, 0.42);
    limb(g, 84, 62, 34, 7, -0.42);
    g.fillStyle = 'rgba(255,230,150,' + (0.4 + pulse * 0.6).toFixed(2) + ')';
    ell(g, 80, 46, 5 + pulse * 2, 5 + pulse * 2);
  }

  function drawZodiacWheel(g, t) {
    var rot = t * 0.0007;
    ring(g, 80, 60, 52, 2.4, '#d8c07a');
    ring(g, 80, 60, 38, 1.8, '#a8904a');
    ring(g, 80, 60, 16, 1.6, '#d8c07a');
    g.save();
    g.translate(80, 60);
    g.rotate(rot);
    for (var i = 0; i < 12; i++) {
      g.save(); g.rotate(i * TAU / 12);
      seg(g, 0, -38, 0, -52, 1.4, 'rgba(216,192,122,0.9)');
      g.fillStyle = i % 3 === 0 ? '#ffd873' : '#c9ab63';
      g.fillRect(-3, -49, 6, 3);
      g.fillRect(-2, -45, 4, 4);
      g.restore();
    }
    g.restore();
    g.save();
    g.translate(80, 60);
    g.rotate(-rot * 2.4);
    g.fillStyle = '#e0525f';
    poly(g, [[0, -34], [4, 0], [-4, 0]]);
    g.restore();
    g.fillStyle = '#ffe9a8';
    ell(g, 80, 60, 7, 7);
  }

  function drawAstrolabe(g, t) {
    ring(g, 80, 60, 50, 3.5, '#c8a24a');
    for (var r = 0; r < 3; r++) {
      var rr = 42 - r * 12;
      g.save();
      g.translate(80, 60);
      g.rotate(t * (0.0009 + r * 0.0007) * (r % 2 ? -1 : 1));
      ring(g, 0, 0, rr, 2, r % 2 ? '#e0c273' : '#a8863a');
      for (var i = 0; i < 8 + r * 4; i++) {
        g.save(); g.rotate(i * TAU / (8 + r * 4));
        g.fillStyle = '#f0dca0';
        g.fillRect(-1, -rr - 3, 2, 6);
        g.restore();
      }
      g.restore();
    }
    g.save();
    g.translate(80, 60);
    g.rotate(t * 0.0021);
    g.fillStyle = '#e8d8a0';
    g.fillRect(-46, -1.6, 92, 3.2);
    ell(g, 40, 0, 5, 5);
    g.restore();
    g.fillStyle = '#8a6a20';
    ell(g, 80, 60, 6, 6);
  }

  function drawAlembic(g, t) {
    g.fillStyle = 'rgba(160,220,240,0.55)';       /* flask */
    ell(g, 56, 82, 24, 22);
    g.fillRect(50, 46, 12, 30);
    ell(g, 56, 46, 12, 7);
    g.fillStyle = 'rgba(80,220,140,0.7)';         /* liquid */
    ell(g, 56, 88, 20, 15);
    for (var i = 0; i < 7; i++) {                 /* bubbles */
      var by = 92 - ((t * 0.05 + i * 24) % 46);
      g.fillStyle = 'rgba(220,255,235,0.75)';
      ell(g, 50 + (i * 5 % 14), by, 2 + (i % 3), 2 + (i % 3));
    }
    g.strokeStyle = 'rgba(160,220,240,0.6)';      /* condenser arm */
    g.lineWidth = 7;
    g.beginPath(); g.moveTo(58, 44); g.quadraticCurveTo(100, 26, 112, 62); g.stroke();
    g.fillStyle = 'rgba(160,220,240,0.55)';       /* receiver */
    ell(g, 116, 86, 18, 18);
    g.fillStyle = 'rgba(230,120,60,0.7)';
    ell(g, 116, 92, 14, 11);
    for (var f = 0; f < 3; f++) {                 /* burner */
      g.fillStyle = f % 2 ? 'rgba(255,170,40,0.9)' : 'rgba(255,240,150,0.9)';
      poly(g, [[48 + f * 5, 108], [56, 96 + Math.sin(t * 0.02 + f) * 4], [64 - f * 5, 108]]);
    }
  }

  function drawMerkaba(g, t) {
    var a = t * 0.0013;
    function tetra(rot, col, flip) {
      g.strokeStyle = col; g.lineWidth = 2.2;
      var pts = [];
      for (var i = 0; i < 3; i++) {
        var an = rot + i * TAU / 3;
        pts.push([80 + Math.cos(an) * 38, 60 + Math.sin(an) * 38 * 0.6 + flip * 12]);
      }
      var apex = [80, 60 - flip * 34];
      for (var k = 0; k < 3; k++) {
        seg(g, pts[k][0], pts[k][1], pts[(k+1)%3][0], pts[(k+1)%3][1], 2.2, col);
        seg(g, pts[k][0], pts[k][1], apex[0], apex[1], 2.2, col);
      }
      for (var j = 0; j < 3; j++) { g.fillStyle = col; ell(g, pts[j][0], pts[j][1], 2.6, 2.6); }
    }
    tetra(a, '#6ad8ff', 1);
    tetra(-a + 0.5, '#ffb84f', -1);
    g.fillStyle = 'rgba(255,255,240,0.8)';
    ell(g, 80, 60, 4 + Math.sin(t * 0.006) * 1.5, 4 + Math.sin(t * 0.006) * 1.5);
  }

  function drawFlowerOfLife(g, t) {
    var n = 1 + Math.floor((t % 5600) / 700);
    var pts = [[0, 0]];
    for (var i = 0; i < 6; i++) pts.push([Math.cos(i * TAU / 6) * 17, Math.sin(i * TAU / 6) * 17]);
    for (var j = 0; j < 6; j++) {
      pts.push([Math.cos(j * TAU / 6) * 34, Math.sin(j * TAU / 6) * 34]);
      pts.push([Math.cos(j * TAU / 6 + TAU / 12) * 29.4, Math.sin(j * TAU / 6 + TAU / 12) * 29.4]);
    }
    for (var k = 0; k < Math.min(n, pts.length); k++) {
      var age = Math.min(1, (n - k) / 2);
      ring(g, 80 + pts[k][0], 60 + pts[k][1], 17, 1.8,
           'rgba(255,228,150,' + (0.35 + age * 0.6).toFixed(2) + ')');
    }
    ring(g, 80, 60, 51, 2.4, 'rgba(210,180,110,0.8)');
  }

  function drawMetatron(g, t) {
    var pts = [[80, 60]];
    for (var i = 0; i < 6; i++) pts.push([80 + Math.cos(i * TAU / 6) * 22, 60 + Math.sin(i * TAU / 6) * 22]);
    for (var j = 0; j < 6; j++) pts.push([80 + Math.cos(j * TAU / 6) * 44, 60 + Math.sin(j * TAU / 6) * 44]);
    var pulse = 0.4 + 0.6 * Math.abs(Math.sin(t * 0.002));
    for (var a = 0; a < pts.length; a++) {
      for (var b = a + 1; b < pts.length; b++) {
        seg(g, pts[a][0], pts[a][1], pts[b][0], pts[b][1], 0.9,
            'rgba(150,200,255,' + (0.10 + pulse * 0.16).toFixed(2) + ')');
      }
    }
    for (var k = 0; k < pts.length; k++) {
      ring(g, pts[k][0], pts[k][1], 9, 1.4, 'rgba(190,225,255,0.75)');
      g.fillStyle = 'rgba(230,245,255,' + (0.5 + pulse * 0.5).toFixed(2) + ')';
      ell(g, pts[k][0], pts[k][1], 2.6, 2.6);
    }
  }

  function drawSriYantra(g, t) {
    var pulse = 0.45 + 0.55 * Math.sin(t * 0.0022);
    for (var p = 0; p < 2; p++) {                 /* lotus petals */
      var pn = p ? 16 : 8, pr = p ? 52 : 44;
      for (var i = 0; i < pn; i++) {
        g.save();
        g.translate(80, 60);
        g.rotate(i * TAU / pn + (p ? 0.2 : 0));
        g.fillStyle = p ? 'rgba(230,120,60,0.55)' : 'rgba(240,170,80,0.6)';
        ell(g, 0, -pr, 5.5, 9);
        g.restore();
      }
    }
    g.strokeStyle = 'rgba(255,236,190,0.9)';
    g.lineWidth = 1.2;
    g.strokeRect(24, 4, 112, 112);
    var ups = [[38, 0.9], [30, 0.7], [22, 0.5], [14, 0.34]];
    for (var u = 0; u < ups.length; u++) {        /* upward triangles */
      var r = ups[u][0];
      g.strokeStyle = 'rgba(255,90,110,' + (0.5 + pulse * 0.45).toFixed(2) + ')';
      g.lineWidth = 1.5;
      g.beginPath();
      g.moveTo(80, 60 - r); g.lineTo(80 + r * 0.92, 60 + r * 0.6);
      g.lineTo(80 - r * 0.92, 60 + r * 0.6); g.closePath(); g.stroke();
      g.strokeStyle = 'rgba(120,190,255,' + (0.5 + pulse * 0.45).toFixed(2) + ')';
      g.beginPath();
      g.moveTo(80, 60 + r); g.lineTo(80 + r * 0.92, 60 - r * 0.6);
      g.lineTo(80 - r * 0.92, 60 - r * 0.6); g.closePath(); g.stroke();
    }
    g.fillStyle = 'rgba(255,240,200,' + (0.5 + pulse * 0.5).toFixed(2) + ')';
    ell(g, 80, 60, 3.4, 3.4);
  }

  function drawEnochian(g, t) {
    for (var r = 0; r < 5; r++) {
      for (var c = 0; c < 7; c++) {
        var x = 16 + c * 21, y = 20 + r * 21;
        var seed = r * 7 + c;
        var lit = Math.sin(t * 0.003 + seed * 1.7) > 0.6;
        g.strokeStyle = lit ? 'rgba(120,255,200,0.95)' : 'rgba(70,110,95,0.6)';
        g.lineWidth = lit ? 2 : 1.2;
        g.strokeRect(x - 8, y - 8, 16, 16);
        g.fillStyle = lit ? 'rgba(150,255,215,0.95)' : 'rgba(80,130,110,0.7)';
        var k = seed % 5;
        if (k === 0) { g.fillRect(x - 5, y - 5, 10, 2); g.fillRect(x - 1, y - 5, 2, 10); }
        else if (k === 1) { g.fillRect(x - 5, y - 1, 10, 2); ell(g, x, y - 5, 2.4, 2.4); }
        else if (k === 2) { poly(g, [[x - 5, y + 5], [x, y - 5], [x + 5, y + 5]]); }
        else if (k === 3) { ring(g, x, y, 5, 1.8, g.fillStyle); g.fillRect(x - 1, y, 2, 6); }
        else { g.fillRect(x - 5, y - 5, 3, 10); g.fillRect(x + 2, y - 5, 3, 10); g.fillRect(x - 5, y - 1, 10, 2); }
      }
    }
  }

  function drawHamsa(g, t) {
    var glow = 0.4 + 0.6 * Math.abs(Math.sin(t * 0.0024));
    g.fillStyle = '#2f7fa0';
    g.fillRect(60, 46, 40, 54);                    /* palm */
    ell(g, 80, 100, 20, 16);
    ell(g, 80, 46, 20, 12);
    g.fillRect(68, 24, 9, 26); g.fillRect(80, 20, 9, 30); g.fillRect(92, 26, 9, 24);
    ell(g, 72.5, 24, 4.5, 5); ell(g, 84.5, 20, 4.5, 5); ell(g, 96.5, 26, 4.5, 5);
    g.fillStyle = '#2f7fa0';                       /* thumbs both sides */
    g.save(); g.translate(60, 56); g.rotate(-0.7); g.fillRect(-8, 0, 9, 24);
    ell(g, -3.5, 24, 4.5, 5); g.restore();
    g.save(); g.translate(100, 56); g.rotate(0.7); g.fillRect(-1, 0, 9, 24);
    ell(g, 3.5, 24, 4.5, 5); g.restore();
    g.fillStyle = '#1d5a75';
    ell(g, 80, 74, 17, 12);
    g.fillStyle = '#f2ead6';
    ell(g, 80, 74, 13, 8);
    g.fillStyle = '#2a5fd0';
    ell(g, 80, 74, 6, 6);
    g.fillStyle = '#0c0c14';
    ell(g, 80, 74, 3, 3);
    g.fillStyle = 'rgba(255,255,255,' + glow.toFixed(2) + ')';
    ell(g, 77, 71, 1.8, 1.4);
  }

  function drawEyeOfHorus(g, t) {
    var blink = Math.sin(t * 0.0022);
    var open = blink > 0.8 ? Math.max(0.08, (1 - blink) * 5) : 1;
    g.fillStyle = '#e8c84a';                       /* brow */
    poly(g, [[30, 40], [96, 22], [104, 32], [36, 50]]);
    g.fillStyle = '#f2ead6';                       /* eye */
    ell(g, 70, 60, 30, 17 * open);
    g.fillStyle = '#1d6f9a';
    ell(g, 70, 60, 12 * Math.min(1, open * 1.5), 12 * open);
    g.fillStyle = '#100c10';
    ell(g, 70, 60, 5.5 * Math.min(1, open * 1.5), 5.5 * open);
    g.fillStyle = '#e8c84a';                       /* teardrop + spiral tail */
    poly(g, [[62, 76], [70, 76], [58, 104], [52, 96]]);
    g.strokeStyle = '#e8c84a'; g.lineWidth = 6;
    g.beginPath();
    g.moveTo(92, 74); g.quadraticCurveTo(114, 78, 112, 96);
    g.quadraticCurveTo(110, 108, 96, 102); g.stroke();
    g.fillStyle = '#e8c84a';
    g.fillRect(88, 68, 22, 7);
    for (var i = 0; i < 8; i++) {
      var a = i * TAU / 8 + t * 0.0012;
      seg(g, 70, 60, 70 + Math.cos(a) * 46, 60 + Math.sin(a) * 46, 1.4, 'rgba(240,210,110,0.22)');
    }
  }

  function drawAnkh(g, t) {
    var pulse = 0.4 + 0.6 * Math.abs(Math.sin(t * 0.0026));
    for (var i = 0; i < 16; i++) {
      var a = i * TAU / 16 + t * 0.0011;
      seg(g, 80, 56, 80 + Math.cos(a) * (52 * pulse), 56 + Math.sin(a) * (52 * pulse), 2,
          'rgba(255,220,120,' + (0.10 + pulse * 0.16).toFixed(2) + ')');
    }
    g.strokeStyle = '#e8c250'; g.lineWidth = 11;
    g.beginPath(); g.ellipse(80, 38, 17, 21, 0, 0, TAU); g.stroke();
    g.fillStyle = '#e8c250';
    g.fillRect(74, 58, 12, 52);
    g.fillRect(48, 60, 64, 11);
    g.fillStyle = 'rgba(255,246,200,' + pulse.toFixed(2) + ')';
    g.fillRect(76, 60, 3, 48);
    g.fillRect(50, 62, 60, 3);
  }

  function drawOrphicEgg(g, t) {
    var crack = (t % 6000) / 6000;
    g.fillStyle = '#efe6d2';
    ell(g, 80, 62, 30, 40);
    g.fillStyle = '#d8ccb2';
    ell(g, 88, 54, 9, 12);
    for (var i = 30; i > 0; i--) {                 /* serpent coiled round */
      var a = t * 0.001 + i * 0.21;
      var yy = 24 + i * 2.6;
      var xx = 80 + Math.sin(a) * (30 - Math.abs(i - 15) * 0.9);
      g.fillStyle = (i % 4 < 2) ? '#4a7f3a' : '#35602b';
      ell(g, xx, yy, 5.5, 4);
    }
    var ha = t * 0.001 + 0.21;
    g.fillStyle = '#5fa84c';
    ell(g, 80 + Math.sin(ha) * 16, 24, 8, 6);
    g.fillStyle = '#e8d24a';
    ell(g, 80 + Math.sin(ha) * 16 + 3, 22, 2, 2);
    if (crack > 0.55) {                            /* it opens */
      var w = (crack - 0.55) / 0.45;
      g.strokeStyle = 'rgba(255,240,180,' + w.toFixed(2) + ')';
      g.lineWidth = 2 + w * 3;
      g.beginPath();
      g.moveTo(62, 44); g.lineTo(72, 56); g.lineTo(64, 68); g.lineTo(78, 84);
      g.lineTo(70, 96); g.stroke();
      g.fillStyle = 'rgba(255,246,200,' + (w * 0.5).toFixed(2) + ')';
      ell(g, 80, 62, 12 * w, 22 * w);
    }
  }

  function drawBaphometSigil(g, t) {
    var pulse = 0.4 + 0.6 * Math.abs(Math.sin(t * 0.0028));
    ring(g, 80, 60, 48, 2.6, 'rgba(220,70,60,0.9)');
    ring(g, 80, 60, 43, 1.4, 'rgba(180,50,45,0.8)');
    g.strokeStyle = 'rgba(240,90,70,' + (0.6 + pulse * 0.4).toFixed(2) + ')';
    g.lineWidth = 2.4;
    g.beginPath();
    for (var i = 0; i <= 5; i++) {                 /* inverted pentagram */
      var a = Math.PI / 2 + (i * 2) * TAU / 5;
      var px = 80 + Math.cos(a) * 43, py = 60 + Math.sin(a) * 43;
      if (i) g.lineTo(px, py); else g.moveTo(px, py);
    }
    g.stroke();
    g.fillStyle = '#1b1418';                       /* goat head */
    poly(g, [[80, 96], [62, 58], [98, 58]]);
    ell(g, 80, 58, 19, 14);
    g.fillStyle = '#e8e2d0';                       /* horns */
    g.save(); g.translate(64, 48); g.rotate(-0.6); g.fillRect(-4, -18, 7, 22); g.restore();
    g.save(); g.translate(96, 48); g.rotate(0.6); g.fillRect(-3, -18, 7, 22); g.restore();
    g.fillStyle = 'rgba(255,90,60,' + (0.6 + pulse * 0.4).toFixed(2) + ')';
    ell(g, 72, 56, 4.4, 3.4); ell(g, 88, 56, 4.4, 3.4);
    g.fillStyle = 'rgba(255,220,120,' + pulse.toFixed(2) + ')';
    ell(g, 80, 26, 4, 4);
  }

  function drawCrystalBall(g, t) {
    g.fillStyle = '#4a2f5e';                       /* stand */
    poly(g, [[52, 118], [108, 118], [96, 96], [64, 96]]);
    g.fillStyle = '#6b4487';
    g.fillRect(66, 92, 28, 6);
    g.fillStyle = 'rgba(180,200,240,0.35)';        /* glass */
    ell(g, 80, 60, 36, 36);
    for (var i = 0; i < 5; i++) {                  /* inner mist */
      var a = t * 0.0013 + i * 1.25;
      g.fillStyle = 'rgba(140,190,255,0.16)';
      ell(g, 80 + Math.cos(a) * 12, 60 + Math.sin(a) * 10, 18 - i * 2, 14 - i * 2, a);
    }
    var show = Math.sin(t * 0.0011);
    if (show > 0.1) {                              /* a face swims up */
      var o = Math.min(1, (show - 0.1) * 2);
      g.fillStyle = 'rgba(220,235,255,' + (o * 0.5).toFixed(2) + ')';
      ell(g, 80, 58, 13, 17);
      g.fillStyle = 'rgba(30,20,50,' + (o * 0.8).toFixed(2) + ')';
      ell(g, 75, 54, 2.6, 3.4); ell(g, 85, 54, 2.6, 3.4);
      ell(g, 80, 68, 3.4, 4.4);
    }
    g.fillStyle = 'rgba(255,255,255,0.5)';
    ell(g, 66, 46, 8, 5, -0.6);
    ring(g, 80, 60, 36, 2, 'rgba(210,225,255,0.55)');
  }

  function drawAlchemicalSol(g, t) {
    for (var i = 0; i < 16; i++) {
      var a = i * TAU / 16 + t * 0.0009;
      var len = 40 + (i % 2 ? 12 : 5) + Math.sin(t * 0.005 + i) * 3;
      g.fillStyle = '#f0b028';
      poly(g, [[80 + Math.cos(a - 0.07) * 30, 60 + Math.sin(a - 0.07) * 30],
               [80 + Math.cos(a) * len, 60 + Math.sin(a) * len],
               [80 + Math.cos(a + 0.07) * 30, 60 + Math.sin(a + 0.07) * 30]]);
    }
    g.fillStyle = '#f4c94a';
    ell(g, 80, 60, 30, 30);
    g.fillStyle = '#c88a10';
    ell(g, 68, 54, 4, 5); ell(g, 92, 54, 4, 5);
    g.fillStyle = '#e8a820';
    ell(g, 80, 62, 4, 3.4);
    g.strokeStyle = '#c88a10'; g.lineWidth = 2.6;
    g.beginPath(); g.arc(80, 62, 14, 0.42, 2.72); g.stroke();
    g.fillStyle = 'rgba(255,240,190,0.55)';
    ell(g, 70, 48, 7, 5, -0.5);
  }

  function drawAlchemicalLuna(g, t) {
    for (var k = 0; k < 20; k++) {
      var sx = (k * 71 % 152) + 4, sy = (k * 37 % 108) + 4;
      var tw = 0.3 + 0.7 * Math.abs(Math.sin(t * 0.004 + k));
      g.fillStyle = 'rgba(220,230,255,' + tw.toFixed(2) + ')';
      star(g, sx, sy, 2.6 * tw + 1, 1, 4, k);
    }
    g.fillStyle = '#dfe4f0';                       /* crescent */
    ell(g, 84, 60, 34, 34);
    g.fillStyle = 'rgba(0,0,0,0)';
    g.save();
    g.globalCompositeOperation = 'destination-out';
    ell(g, 100, 54, 30, 30);
    g.restore();
    g.fillStyle = '#8d97b0';                       /* face on the crescent */
    ell(g, 70, 52, 3, 4);
    g.strokeStyle = '#8d97b0'; g.lineWidth = 2;
    g.beginPath(); g.arc(70, 62, 8, 0.5, 2.2); g.stroke();
    g.fillStyle = '#b8c0d8';
    ell(g, 64, 70, 3.4, 2.6);
  }

  function drawMementoMori(g, t) {
    var fl = Math.sin(t * 0.017) * 1.8;
    g.fillStyle = '#3a2c22';                        /* altar */
    g.fillRect(14, 96, 132, 24);
    g.fillStyle = '#5a4636';
    g.fillRect(14, 96, 132, 4);
    for (var c = 0; c < 2; c++) {                   /* candles */
      var cx = c ? 128 : 32;
      g.fillStyle = '#e8e0cc';
      g.fillRect(cx - 5, 62 + c * 8, 10, 34 - c * 8);
      g.fillStyle = 'rgba(255,180,50,0.95)';
      poly(g, [[cx - 4, 62 + c * 8], [cx, 44 + c * 8 + fl], [cx + 4, 62 + c * 8]]);
      g.fillStyle = 'rgba(255,244,190,0.95)';
      poly(g, [[cx - 1.8, 60 + c * 8], [cx, 51 + c * 8 + fl], [cx + 1.8, 60 + c * 8]]);
    }
    g.fillStyle = '#e8e0cc';                        /* skull */
    ell(g, 80, 68, 24, 22);
    g.fillRect(66, 84, 28, 11);
    g.fillStyle = '#191410';
    ell(g, 71, 65, 7.5, 8.5); ell(g, 89, 65, 7.5, 8.5);
    poly(g, [[80, 74], [76, 82], [84, 82]]);
    for (var i = 0; i < 5; i++) g.fillRect(68 + i * 5.4, 84, 2, 11);
    g.fillStyle = '#7d5a3a';                        /* open book */
    poly(g, [[36, 96], [76, 92], [76, 96], [36, 100]]);
    poly(g, [[124, 96], [84, 92], [84, 96], [124, 100]]);
  }

  function drawHourglass(g, t) {
    var c = (t % 7000) / 7000;
    g.fillStyle = '#7d5a2a';
    g.fillRect(38, 12, 84, 8); g.fillRect(38, 100, 84, 8);
    g.fillRect(42, 20, 6, 80); g.fillRect(112, 20, 6, 80);
    g.fillStyle = 'rgba(190,220,240,0.35)';
    poly(g, [[52, 20], [108, 20], [84, 60], [76, 60]]);
    poly(g, [[76, 60], [84, 60], [108, 100], [52, 100]]);
    g.fillStyle = '#e0b45e';                        /* upper sand drains */
    var up = 1 - c;
    poly(g, [[52 + (1 - up) * 22, 20 + (1 - up) * 34], [108 - (1 - up) * 22, 20 + (1 - up) * 34],
             [84, 60], [76, 60]]);
    g.fillStyle = '#d8a84a';                        /* lower sand piles */
    poly(g, [[80 - 26 * c, 100], [80 + 26 * c, 100], [80 + 10 * c, 100 - 30 * c], [80 - 10 * c, 100 - 30 * c]]);
    if (c > 0.02 && c < 0.98) {                     /* the stream */
      g.fillStyle = '#f0c86e';
      g.fillRect(78.5, 60, 3, 40 - 30 * c);
      for (var i = 0; i < 4; i++) {
        g.fillStyle = 'rgba(240,200,110,0.9)';
        ell(g, 80 + Math.sin(t * 0.02 + i) * 1.6, 62 + ((t * 0.12 + i * 10) % (38 - 28 * c)), 1.4, 1.8);
      }
    }
    ring(g, 80, 60, 3, 1.6, '#7d5a2a');
  }

  function drawGrail(g, t) {
    var pulse = 0.4 + 0.6 * Math.abs(Math.sin(t * 0.0025));
    for (var i = 0; i < 5; i++) {                   /* rising vapour */
      var vy = 44 - ((t * 0.035 + i * 12) % 44);
      g.fillStyle = 'rgba(255,240,170,' + (0.28 * (vy / 44)).toFixed(2) + ')';
      ell(g, 80 + Math.sin(t * 0.003 + i) * 9, vy, 7 + i, 5 + i * 0.6);
    }
    g.fillStyle = '#d8b247';
    poly(g, [[54, 48], [106, 48], [96, 82], [64, 82]]);
    g.fillStyle = '#f0d27a';
    poly(g, [[58, 51], [102, 51], [94, 78], [66, 78]]);
    g.fillStyle = 'rgba(180,30,50,0.9)';
    poly(g, [[60, 54], [100, 54], [93, 74], [67, 74]]);
    g.fillStyle = 'rgba(255,150,160,' + (pulse * 0.5).toFixed(2) + ')';
    ell(g, 80, 56, 18, 3.5);
    g.fillStyle = '#d8b247';
    g.fillRect(76, 82, 8, 20);
    ell(g, 80, 84, 9, 5);
    ell(g, 80, 106, 22, 8);
    for (var k = 0; k < 3; k++) {                   /* set stones */
      g.fillStyle = k === 1 ? '#e04a5a' : '#4ac9e0';
      ell(g, 68 + k * 12, 62, 3, 4);
    }
    g.fillStyle = 'rgba(255,255,230,' + (pulse * 0.7).toFixed(2) + ')';
    ell(g, 66, 56, 5, 3, -0.5);
  }

  function drawLabyrinth(g, t) {
    for (var r = 0; r < 6; r++) {
      var rr = 12 + r * 8;
      var gapA = r * 1.1 + 0.3;
      g.strokeStyle = 'rgba(200,180,120,0.9)';
      g.lineWidth = 2.6;
      g.beginPath();
      g.arc(80, 60, rr, gapA + 0.45, gapA + TAU - 0.45);
      g.stroke();
    }
    var p = (t % 9000) / 9000;
    var ra = 12 + (1 - p) * 40;
    var aa = p * 13;
    g.fillStyle = '#ff5f4a';
    ell(g, 80 + Math.cos(aa) * ra, 60 + Math.sin(aa) * ra, 3.6, 3.6);
    g.fillStyle = 'rgba(255,120,90,0.35)';
    ell(g, 80 + Math.cos(aa - 0.3) * ra, 60 + Math.sin(aa - 0.3) * ra, 2.4, 2.4);
    g.fillStyle = 'rgba(255,230,160,0.9)';
    ell(g, 80, 60, 4, 4);
  }

  function drawChakras(g, t) {
    var cols = ['#d8323c', '#e8792a', '#e8c22a', '#3fae54', '#2f8fd8', '#3f4fc0', '#9a4fd0'];
    g.fillStyle = 'rgba(230,220,240,0.30)';         /* seated figure */
    ell(g, 80, 22, 12, 13);
    poly(g, [[68, 36], [92, 36], [100, 96], [60, 96]]);
    ell(g, 80, 98, 34, 10);
    for (var i = 0; i < 7; i++) {
      var y = 100 - i * 12.5;
      var pulse = 0.45 + 0.55 * Math.sin(t * 0.004 - i * 0.7);
      g.fillStyle = cols[6 - i];
      ell(g, 80, y, 6 + pulse * 3, 6 + pulse * 3);
      for (var k = 0; k < 6; k++) {                 /* petals */
        var a = k * TAU / 6 + t * 0.001 * (i % 2 ? 1 : -1);
        g.fillStyle = cols[6 - i];
        ell(g, 80 + Math.cos(a) * (11 + pulse * 3), y + Math.sin(a) * (11 + pulse * 3),
            2.6, 2.6);
      }
    }
    g.fillStyle = 'rgba(255,255,255,' + (0.3 + 0.4 * Math.abs(Math.sin(t * 0.003))).toFixed(2) + ')';
    g.fillRect(78.5, 12, 3, 92);
  }

  /* ================================================================ */

  var CHANNELS = [
    { name: 'LEETV',              draw: drawIdent, hard: true, shadow: false },
    { name: 'Horses running',     draw: drawHorses },
    { name: 'Tiger eating sushi', draw: drawTiger },
    { name: 'Pickles dancing',    draw: drawPickles },
    { name: 'Heart pounding',     draw: drawHeart },
    { name: 'Eye winking',        draw: drawEye },
    { name: 'Skull laughing',     draw: drawSkull },
    { name: 'Ghost on the loo',   draw: drawGhostToilet },
    { name: 'Bigfoot sighting',   draw: drawBigfoot },
    { name: 'Tiki man dancing',   draw: drawTiki },
    { name: 'UFO abducts a cow',  draw: drawUfoCow },

    /* esoteric */
    { name: 'The all-seeing eye',  draw: drawAllSeeingEye },
    { name: 'Ouroboros',           draw: drawOuroboros },
    { name: 'Pentagram',           draw: drawPentagram },
    { name: 'Moon phases',         draw: drawMoonPhases },
    { name: 'Turning sigil',       draw: drawSigil },
    { name: 'Tarot card',          draw: drawTarot },

    /* geometric */
    { name: 'Hypnotic spiral',     draw: drawSpiral },
    { name: 'Wireframe cube',      draw: drawWireCube },
    { name: 'Kaleidoscope',        draw: drawKaleido },
    { name: 'Lissajous figure',    draw: drawLissajous },
    { name: 'Moire rings',         draw: drawMoire },
    { name: 'Tessellation',        draw: drawTessellation },
    { name: 'Sierpinski triangle', draw: drawSierpinski },

    /* animals doing weird things */
    { name: 'Octopus DJ',          draw: drawOctopusDJ },
    { name: 'Frog on a unicycle',  draw: drawFrogUnicycle },
    { name: 'Rocket-powered snail',draw: drawRocketSnail },
    { name: 'Cat doing business',  draw: drawBizCat },
    { name: 'Breakdancing sloth',  draw: drawSlothDance },
    { name: 'Crab in sunglasses',  draw: drawCrabShades },
    { name: 'Weightlifting pigeon',draw: drawPigeonLift },

    /* spaceships */
    { name: 'Rocket launch',       draw: drawRocketLaunch },
    { name: 'Warp speed',          draw: drawWarpSpeed },
    { name: 'Saucer dogfight',     draw: drawDogfight },
    { name: 'Satellite orbit',     draw: drawSatellite },
    { name: 'Docking manoeuvre',   draw: drawDocking },

    /* horror */
    { name: 'Haunted house',       draw: drawHauntedHouse },
    { name: 'Hand from the grave', draw: drawGraveHand },
    { name: 'The scream',          draw: drawScream },
    { name: 'Bats over the moon',  draw: drawBatsMoon },
    { name: 'Eyes in the dark',    draw: drawCreatureEyes },

    /* esoteric II */
    { name: 'Caduceus',             draw: drawCaduceus },
    { name: 'Tree of Life',         draw: drawTreeOfLife },
    { name: "Philosopher's stone",  draw: drawPhilosophersStone },
    { name: 'Sol and Luna',         draw: drawSolLuna },
    { name: 'The third eye',        draw: drawThirdEye },
    { name: 'Scrying mirror',       draw: drawScryingMirror },
    { name: 'Ouija planchette',     draw: drawOuija },
    { name: 'Rune cast',            draw: drawRuneCast },
    { name: 'Microcosmic man',      draw: drawMicrocosmicMan },
    { name: 'Zodiac wheel',         draw: drawZodiacWheel },
    { name: 'Astrolabe',            draw: drawAstrolabe },
    { name: 'The alembic',          draw: drawAlembic },
    { name: 'Merkaba',              draw: drawMerkaba },
    { name: 'Flower of Life',       draw: drawFlowerOfLife },
    { name: "Metatron's cube",      draw: drawMetatron },
    { name: 'Sri Yantra',           draw: drawSriYantra },
    { name: 'Enochian tablet',      draw: drawEnochian },
    { name: 'Hamsa',                draw: drawHamsa },
    { name: 'Eye of Horus',         draw: drawEyeOfHorus },
    { name: 'Ankh',                 draw: drawAnkh },
    { name: 'Orphic egg',           draw: drawOrphicEgg },
    { name: 'Baphomet sigil',       draw: drawBaphometSigil },
    { name: 'Crystal ball',         draw: drawCrystalBall },
    { name: 'Alchemical Sol',       draw: drawAlchemicalSol },
    { name: 'Alchemical Luna',      draw: drawAlchemicalLuna },
    { name: 'Memento mori',         draw: drawMementoMori },
    { name: 'Hourglass',            draw: drawHourglass },
    { name: 'The Grail',            draw: drawGrail },
    { name: 'Cretan labyrinth',     draw: drawLabyrinth },
    { name: 'Chakra column',        draw: drawChakras }
  ];

  var current = 0;
  var bag = [];

  function refillBag() {
    bag = [];
    for (var i = 0; i < CHANNELS.length; i++) if (i !== current) bag.push(i);
    for (var j = bag.length - 1; j > 0; j--) {        /* Fisher-Yates */
      var k = (Math.random() * (j + 1)) | 0;
      var tmp = bag[j]; bag[j] = bag[k]; bag[k] = tmp;
    }
    /* current goes back in, but never as the next pick */
    bag.splice((Math.random() * (bag.length - 1)) | 0, 0, current);
  }

  var stage = document.querySelector('.stage');
  var label = document.getElementById('channel-name');

  function announce() {
    var n = CHANNELS[current].name;
    if (stage) stage.setAttribute('data-channel', n);
    if (label) label.textContent = 'Channel: ' + n;
  }

  function nextChannel() {
    if (!bag.length) refillBag();
    current = bag.pop();
    burstUntil = performance.now() + 300;             /* switching snow */
    announce();
    if (rafId === null) apply();                      /* redraw when frozen */
  }

  /* --- per-frame glitch state ------------------------------------- */

  var rowShift = new Int16Array(H);
  var rowTint = new Uint8Array(H);
  var burstUntil = 0;

  function buildBands(heavy) {
    rowShift.fill(0);
    rowTint.fill(0);
    if (!heavy && Math.random() > 0.35) return;
    var bands = heavy ? 2 + ((Math.random() * 4) | 0) : 1;
    for (var b = 0; b < bands; b++) {
      var y0 = (Math.random() * H) | 0;
      var y1 = y0 + (heavy ? 3 + ((Math.random() * 18) | 0)
                           : 2 + ((Math.random() * 6) | 0));
      var s = heavy ? ((Math.random() * 19) | 0) - 9
                    : ((Math.random() * 7) | 0) - 3;
      var tint = heavy && Math.random() < 0.55 ? 1 : 0;
      for (var y = y0; y < y1 && y < H; y++) { rowShift[y] = s; rowTint[y] = tint; }
    }
  }

  /* --- one frame -------------------------------------------------- */

  function render(t, steady) {
    var strobe, splitR, splitB, jitterY, white;

    if (steady) {
      strobe = 1; splitR = -1; splitB = 1; jitterY = 0; white = 0;
      rowShift.fill(0); rowTint.fill(0);
    } else {
      if (t > burstUntil && Math.random() < 0.08) {
        burstUntil = t + 70 + Math.random() * 220;
      }
      var heavy = t < burstUntil;
      var flick = 0.76 + 0.24 * Math.sin(t / 62);
      if (heavy) {
        var roll = Math.random();
        strobe = roll < 0.22 ? 0.10 : (roll < 0.46 ? 1.3 : flick);
        splitR = -(1 + ((Math.random() * 4) | 0));
        splitB = 1 + ((Math.random() * 4) | 0);
        jitterY = ((Math.random() * 3) | 0) - 1;
        white = Math.random() < 0.22 ? 1 : 0;
      } else {
        strobe = Math.random() < 0.06 ? 0.3 : flick;
        splitR = -1 - (Math.random() < 0.22 ? 1 : 0);
        splitB = 1 + (Math.random() < 0.22 ? 1 : 0);
        jitterY = 0;
        white = Math.random() < 0.05 ? 1 : 0;
      }
      buildBands(heavy);
    }

    /* paint what the channel is broadcasting */
    sctx.save();
    sctx.setTransform(1, 0, 0, 1, 0, 0);
    sctx.globalAlpha = 1;
    sctx.globalCompositeOperation = 'source-over';
    sctx.clearRect(0, 0, W, H);
    if (CHANNELS[current].shadow === false) {
      sctx.shadowColor = 'transparent';
      sctx.shadowBlur = 0;
    } else {
      /* mid-tones sit right on the noise mean and vanish; a dark halo
         separates every subject from the static */
      sctx.shadowColor = 'rgba(0,0,0,0.85)';
      sctx.shadowBlur = 3;
    }
    CHANNELS[current].draw(sctx, steady ? 1400 : t);
    sctx.restore();
    var s = sctx.getImageData(0, 0, W, H).data;
    var hard = !!CHANNELS[current].hard;

    var i = 0;
    for (var y = 0; y < H; y++) {
      var sx = rowShift[y];
      var my = y + jitterY;
      var base = (my >= 0 && my < H) ? my * W : -1;
      var tint = rowTint[y];

      for (var x = 0; x < W; x++) {
        var n = (Math.random() * 196) | 0;
        var r = n, g = n, b = n;

        if (tint) { g = (g * 0.55) | 0; b = (b * 0.82) | 0; }

        if (base >= 0) {
          var bx = x + sx;
          var k = 0.886 + Math.random() * 0.118;      /* per-pixel signal luma */
          var p, a;

          var xr = bx + splitR;
          if (xr >= 0 && xr < W) {
            p = (base + xr) * 4;
            a = s[p + 3] / 255;
            if (hard) a = a >= 0.5 ? 1 : 0;
            if (a > 0) r = n + ((white ? 255 : s[p]) * k - n) * strobe * a;
          }
          if (bx >= 0 && bx < W) {
            p = (base + bx) * 4;
            a = s[p + 3] / 255;
            if (hard) a = a >= 0.5 ? 1 : 0;
            if (a > 0) g = n + ((white ? 255 : s[p + 1]) * k - n) * strobe * a;
          }
          var xb = bx + splitB;
          if (xb >= 0 && xb < W) {
            p = (base + xb) * 4;
            a = s[p + 3] / 255;
            if (hard) a = a >= 0.5 ? 1 : 0;
            if (a > 0) b = n + ((white ? 255 : s[p + 2]) * k - n) * strobe * a;
          }
        }

        data[i++] = r; data[i++] = g; data[i++] = b; data[i++] = 255;
      }
    }

    ctx.putImageData(image, 0, 0);
  }

  /* --- drive ------------------------------------------------------ */

  var reduce = window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : null;

  var rafId = null;
  var last = 0;

  function loop(now) {
    rafId = window.requestAnimationFrame(loop);
    if (now - last < interval - slack) return;
    last = now;
    render(now, false);
  }

  function start() {
    if (rafId !== null) return;
    last = 0;
    rafId = window.requestAnimationFrame(loop);
  }

  function stop() {
    if (rafId === null) return;
    window.cancelAnimationFrame(rafId);
    rafId = null;
  }

  function apply() {
    if (reduce && reduce.matches) {
      stop();
      render(0, true);          /* one frozen, unglitched frame */
    } else {
      start();
    }
  }

  if (reduce) {
    if (reduce.addEventListener) reduce.addEventListener('change', apply);
    else if (reduce.addListener) reduce.addListener(apply);
  }

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stop();
    else apply();
  });

  if (stage) {
    stage.addEventListener('click', nextChannel);
    stage.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        nextChannel();
      }
    });
  }

  announce();
  apply();
})();
