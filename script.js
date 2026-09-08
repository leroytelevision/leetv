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

  /* ================================================================
     FACES — one parametric head, driven by expression parameters.

     Photoreal is not on the table at 160x120 through static, so this
     aims at convincing anatomy instead: a shaded skull form, lids that
     actually occlude the eye, brows that carry the expression, and a
     mouth built from lips rather than a hole.
     ================================================================ */

  var LOOKS = [
    { skin:'#f2cfae', lit:'#ffe6cd', dark:'#c69874', lip:'#c9736c', hair:'#3b2a1e', eye:'#5c7d4e', cloth:'#3d4f6b' },
    { skin:'#e0ae86', lit:'#f6d0ae', dark:'#a97753', lip:'#b25f5c', hair:'#14100e', eye:'#4a3524', cloth:'#6b3d4f' },
    { skin:'#a9724a', lit:'#c9926a', dark:'#734e30', lip:'#8e4a45', hair:'#120d0a', eye:'#3a2718', cloth:'#2f6b5f' },
    { skin:'#7a4f33', lit:'#9a6b48', dark:'#4e3020', lip:'#6d3a36', hair:'#0e0a08', eye:'#2e1f14', cloth:'#c07a2a' },
    { skin:'#f7ddc4', lit:'#fff0e2', dark:'#d0a888', lip:'#d1837c', hair:'#a8763c', eye:'#4a7fa8', cloth:'#4a6b3d' },
    { skin:'#d8a882', lit:'#f0c6a2', dark:'#a1704c', lip:'#ad5f58', hair:'#5c3a20', eye:'#6b5a3a', cloth:'#7a4a8f' },
    { skin:'#5f3d28', lit:'#7d5638', dark:'#3a2517', lip:'#5a2f2c', hair:'#0c0908', eye:'#241708', cloth:'#c8b23a' },
    { skin:'#ecc3a0', lit:'#ffdcc0', dark:'#b98a66', lip:'#c06f68', hair:'#6e6e74', eye:'#5a6b78', cloth:'#546070' }
  ];

  /* Every one of these channels is the same Vulcan: olive-pale skin,
     black bowl cut, severe upswept brows, pointed ears, blue tunic. */
  var VULCAN = { skin:'#e8cfae', lit:'#f7e3c8', dark:'#b8946c', lip:'#b8746a',
                 hair:'#141216', eye:'#3a2a1c', cloth:'#2f5f9a' };

  function baseFace(i) {
    return {
      L: LOOKS[i % LOOKS.length],
      hairStyle: i % 8,
      eyeL: 1, eyeR: 1, gazeX: 0, gazeY: 0,
      browL: 0, browR: 0, browY: 0,
      open: 0, wide: 0, smile: 0, teeth: 0, tongue: 0, pucker: 0,
      tilt: 0, bob: 0, turn: 0, scale: 1,
      blush: 0, tears: 0, sweat: 0, glasses: 0, shades: 0, vulcan: 0, hand: 0,
      cig: 0, bubble: 0, cup: 0, brush: 0, lipstick: 0, beard: 0, tache: 0
    };
  }

  function drawFace(g, o) {
    var L = o.L, cx = 80, cy = 56, hw = 38, hh = 46;
    var tx = o.turn * 5;

    g.save();
    g.translate(cx, cy + o.bob);
    g.rotate(o.tilt);
    g.scale(o.scale, o.scale);
    g.translate(-cx, -cy);

    /* shoulders and neck sit behind everything */
    g.fillStyle = L.cloth;
    ell(g, cx + tx * 0.4, 132, 62, 34);
    g.fillStyle = L.dark;
    g.fillRect(cx - 15 + tx, cy + 24, 30, 28);

    /* hair mass behind the head, for the longer styles */
    if (o.hairStyle === 2 || o.hairStyle === 5) {
      g.fillStyle = L.hair;
      ell(g, cx + tx, cy + 6, hw + 9, hh + 10);
    }

    g.fillStyle = L.skin;                        /* ears */
    if (!o.vulcan) {
      ell(g, cx - hw + 2 + tx, cy + 6, 6, 10);
      ell(g, cx + hw - 2 + tx, cy + 6, 6, 10);
      g.fillStyle = L.dark;
      ell(g, cx - hw + 2 + tx, cy + 6, 3, 5);
      ell(g, cx + hw - 2 + tx, cy + 6, 3, 5);
    }

    /* the head: cranium into a tapering jaw, lit from upper left */
    var grad = g.createRadialGradient(cx - 13 + tx, cy - 20, 5, cx + tx, cy + 6, 60);
    grad.addColorStop(0, L.lit);
    grad.addColorStop(0.42, L.skin);
    grad.addColorStop(1, L.dark);
    g.fillStyle = grad;
    g.beginPath();
    g.moveTo(cx - hw + tx, cy - 6);
    g.bezierCurveTo(cx - hw + tx, cy - hh - 8 + tx, cx + hw + tx, cy - hh - 8, cx + hw + tx, cy - 6);
    g.bezierCurveTo(cx + hw - 3 + tx, cy + 30, cx + 15 + tx, cy + 48, cx + tx, cy + 48);
    g.bezierCurveTo(cx - 15 + tx, cy + 48, cx - hw + 3 + tx, cy + 30, cx - hw + tx, cy - 6);
    g.closePath();
    g.fill();

    /* features carry their own modelling; the halo is for the silhouette */
    g.shadowColor = 'transparent';
    g.shadowBlur = 0;

    /* Pointed ears, drawn over the head. They have to rise clear of the
       skull's outline and carry their own edge, or in face-coloured
       fill they just merge back into the silhouette. */
    if (o.vulcan) {
      for (var ve = 0; ve < 2; ve++) {
        var vs = ve ? 1 : -1;
        var lo = [cx + vs * (hw - 11) + tx, cy + 15];
        var tip = [cx + vs * (hw + 9) + tx, cy - 35];
        var up = [cx + vs * (hw - 16) + tx, cy - 13];
        g.beginPath();
        g.moveTo(lo[0], lo[1]);
        g.quadraticCurveTo(cx + vs * (hw + 5) + tx, cy - 4, tip[0], tip[1]);
        g.quadraticCurveTo(cx + vs * (hw - 6) + tx, cy - 18, up[0], up[1]);
        g.closePath();
        g.fillStyle = L.skin;
        g.fill();
        g.strokeStyle = 'rgba(90,60,40,0.65)';
        g.lineWidth = 1.4;
        g.stroke();
        g.fillStyle = L.dark;                    /* inner fold */
        poly(g, [[cx + vs * (hw - 9) + tx, cy + 8],
                 [cx + vs * (hw + 4) + tx, cy - 24],
                 [cx + vs * (hw - 11) + tx, cy - 10]]);
      }
    }

    var eyY = cy + 2, eyDx = 16;

    /* brow ridge and cheek shading */
    g.fillStyle = 'rgba(0,0,0,0.10)';
    ell(g, cx - eyDx + tx, eyY - 2, 15, 9);
    ell(g, cx + eyDx + tx, eyY - 2, 15, 9);
    ell(g, cx + tx, cy + 34, 20, 10);

    /* eyes */
    for (var e = 0; e < 2; e++) {
      var s = e ? 1 : -1;
      var ex = cx + s * eyDx + tx;
      var op = e ? o.eyeR : o.eyeL;
      var lidH = 8 * op;

      g.fillStyle = '#f4f1ea';
      ell(g, ex, eyY, 11, Math.max(0.4, lidH));

      if (op > 0.12) {
        var ix = ex + o.gazeX * 3.4, iy = eyY + o.gazeY * 2.2;
        g.fillStyle = L.eye;
        ell(g, ix, iy, 5.4, Math.min(5.4, lidH * 0.92));
        g.fillStyle = '#0d0b0c';
        ell(g, ix, iy, 2.6, Math.min(2.6, lidH * 0.6));
        g.fillStyle = 'rgba(255,255,255,0.92)';
        ell(g, ix - 2, iy - 2, 1.5, 1.2);
      }
      /* Upper lid rests ON the opening rather than over it: its lower
         edge sits exactly at the top of the aperture, so closing the
         eye sweeps the lid down instead of hiding the eye entirely. */
      g.fillStyle = L.skin;
      ell(g, ex, eyY - 8 - lidH, 12, 8);
      g.fillStyle = 'rgba(60,35,25,0.6)';         /* lash line */
      ell(g, ex, eyY - lidH, 11, 1.2);
      g.fillStyle = 'rgba(90,60,45,0.30)';        /* lower lid */
      ell(g, ex, eyY + lidH + 1, 10, 1);

      /* brow */
      g.save();
      g.translate(ex, eyY - 15 + o.browY + (e ? o.browR : o.browL) * 5);
      g.rotate(s * ((e ? o.browR : o.browL) * 0.28) - (o.vulcan ? s * 0.30 : 0));
      g.fillStyle = L.hair;
      if (o.vulcan) {                            /* angular, swept up and out */
        poly(g, [[-12, 2.6], [11, -3.4], [13, 0.4], [-11, 4.2]]);
      } else {
        ell(g, 0, 0, 12, 2.8);
      }
      g.restore();
    }

    /* nose: a shaded bridge, a lit tip, two nostrils */
    g.fillStyle = 'rgba(0,0,0,0.13)';
    ell(g, cx + 4 + tx, cy + 12, 5, 13);
    g.fillStyle = 'rgba(255,255,255,0.16)';
    ell(g, cx - 2 + tx, cy + 8, 3.4, 11);
    g.fillStyle = L.lit;
    ell(g, cx + tx, cy + 19, 6, 4.5);
    g.fillStyle = 'rgba(40,20,14,0.55)';
    ell(g, cx - 4.6 + tx, cy + 21, 2.2, 1.5);
    ell(g, cx + 4.6 + tx, cy + 21, 2.2, 1.5);

    /* mouth: outer lip shape, inner cavity, teeth, tongue */
    var my = cy + 33, mw = 13 + o.wide * 9, mh = o.open * 12;
    var corner = -o.smile * 5;
    if (o.pucker) { mw = 7; }

    g.fillStyle = L.lip;
    g.beginPath();
    g.moveTo(cx - mw + tx, my + corner);
    g.quadraticCurveTo(cx + tx, my - mh - 7 - o.smile * 2, cx + mw + tx, my + corner);
    g.quadraticCurveTo(cx + tx, my + mh + 9 + o.smile * 1.5, cx - mw + tx, my + corner);
    g.closePath();
    g.fill();

    if (mh > 1.2) {
      g.fillStyle = '#3a1418';
      g.beginPath();
      g.moveTo(cx - mw + 3 + tx, my + corner);
      g.quadraticCurveTo(cx + tx, my - mh - 2, cx + mw - 3 + tx, my + corner);
      g.quadraticCurveTo(cx + tx, my + mh + 4, cx - mw + 3 + tx, my + corner);
      g.closePath();
      g.fill();
      if (o.teeth) {
        g.fillStyle = '#f2efe4';
        g.fillRect(cx - mw + 4 + tx, my + corner - Math.min(5, mh), (mw - 4) * 2, Math.min(4.5, mh * 0.7));
      }
      if (o.tongue) {
        g.fillStyle = '#c9565f';
        ell(g, cx + tx, my + corner + mh * 0.55, mw * 0.55, mh * 0.42);
      }
    } else if (o.smile > 0.2) {
      g.strokeStyle = 'rgba(90,40,40,0.6)'; g.lineWidth = 1.4;
      g.beginPath();
      g.moveTo(cx - mw + tx, my + corner);
      g.quadraticCurveTo(cx + tx, my + 3, cx + mw + tx, my + corner);
      g.stroke();
    }

    /* facial hair */
    if (o.tache) { g.fillStyle = L.hair; ell(g, cx + tx, my - 9, 13, 3.6); }
    if (o.beard) {
      g.fillStyle = L.hair;
      g.beginPath();
      g.moveTo(cx - 26 + tx, cy + 18);
      g.quadraticCurveTo(cx + tx, cy + 58, cx + 26 + tx, cy + 18);
      g.quadraticCurveTo(cx + tx, cy + 34, cx - 26 + tx, cy + 18);
      g.fill();
    }

    /* hair in front */
    g.fillStyle = L.hair;
    var hs = o.hairStyle;
    if (hs === 0) {                                   /* short crop */
      g.beginPath(); g.ellipse(cx + tx, cy - 24, hw - 1, 24, 0, Math.PI, TAU); g.fill();
      g.fillRect(cx - hw + 1 + tx, cy - 26, hw * 2 - 2, 7);
    } else if (hs === 1) {                            /* side parting */
      g.beginPath(); g.ellipse(cx + tx, cy - 23, hw - 1, 23, 0, Math.PI, TAU); g.fill();
      g.beginPath();
      g.moveTo(cx - hw + 1 + tx, cy - 22);
      g.quadraticCurveTo(cx - 6 + tx, cy - 14, cx + 22 + tx, cy - 24);
      g.quadraticCurveTo(cx + 4 + tx, cy - 34, cx - hw + 1 + tx, cy - 22);
      g.fill();
    } else if (hs === 2) {                            /* long */
      g.beginPath(); g.ellipse(cx + tx, cy - 22, hw, 24, 0, Math.PI, TAU); g.fill();
      g.fillRect(cx - hw - 7 + tx, cy - 20, 10, 54);
      g.fillRect(cx + hw - 3 + tx, cy - 20, 10, 54);
    } else if (hs === 3) {                            /* bun */
      g.beginPath(); g.ellipse(cx + tx, cy - 24, hw - 2, 22, 0, Math.PI, TAU); g.fill();
      ell(g, cx + tx, cy - 46, 12, 10);
    } else if (hs === 4) {                            /* curls */
      for (var k = 0; k < 9; k++) {
        var a = Math.PI + k * Math.PI / 8;
        ell(g, cx + tx + Math.cos(a) * (hw - 4), cy - 20 + Math.sin(a) * 24, 9, 9);
      }
    } else if (hs === 5) {                            /* bob */
      g.beginPath(); g.ellipse(cx + tx, cy - 20, hw + 1, 24, 0, Math.PI, TAU); g.fill();
      g.fillRect(cx - hw - 4 + tx, cy - 18, 9, 34);
      g.fillRect(cx + hw - 5 + tx, cy - 18, 9, 34);
    } else if (hs === 6) {                            /* receding */
      g.beginPath(); g.ellipse(cx + tx, cy - 26, hw - 6, 16, 0, Math.PI, TAU); g.fill();
      g.fillRect(cx - hw + 1 + tx, cy - 26, 7, 16);
      g.fillRect(cx + hw - 8 + tx, cy - 26, 7, 16);
    } else if (hs === 9) {                            /* Vulcan bowl cut */
      g.beginPath();
      g.ellipse(cx + tx, cy - 20, hw + 1, 27, 0, Math.PI, TAU);
      g.fill();
      g.fillRect(cx - hw - 1 + tx, cy - 22, hw * 2 + 2, 10);   /* blunt fringe */
      g.fillRect(cx - hw - 1 + tx, cy - 22, 7, 26);            /* sideburns */
      g.fillRect(cx + hw - 6 + tx, cy - 22, 7, 26);
    } else {                                          /* cropped/high top */
      g.beginPath(); g.ellipse(cx + tx, cy - 22, hw - 4, 18, 0, Math.PI, TAU); g.fill();
      g.fillRect(cx - 12 + tx, cy - 50, 24, 14);
    }

    /* extras */
    if (o.blush) {
      g.fillStyle = 'rgba(220,90,100,' + (0.35 * o.blush).toFixed(2) + ')';
      ell(g, cx - 24 + tx, cy + 16, 10, 7); ell(g, cx + 24 + tx, cy + 16, 10, 7);
    }
    if (o.glasses || o.shades) {
      g.fillStyle = o.shades ? 'rgba(18,18,24,0.92)' : 'rgba(190,220,240,0.30)';
      var gy = eyY + (o.shades ? o.shades - 1 : 0) * 14;
      ell(g, cx - eyDx + tx, gy, 14, 10); ell(g, cx + eyDx + tx, gy, 14, 10);
      g.fillStyle = '#2b2b33';
      g.fillRect(cx - 6 + tx, gy - 1, 12, 2.4);
      g.fillRect(cx - eyDx - 14 + tx, gy - 1, 4, 2.4);
      g.fillRect(cx + eyDx + 10 + tx, gy - 1, 4, 2.4);
    }
    if (o.tears) {
      g.fillStyle = 'rgba(150,215,255,0.85)';
      for (var d = 0; d < 2; d++) {
        var dy = eyY + 8 + ((o.tears * 40 + d * 18) % 42);
        ell(g, cx - eyDx - 6 + tx, dy, 2.4, 3.6);
        ell(g, cx + eyDx + 6 + tx, dy - 8, 2.4, 3.6);
      }
    }
    if (o.sweat) {
      g.fillStyle = 'rgba(170,225,255,0.9)';
      for (var w = 0; w < 3; w++) {
        var wy = cy - 28 + ((o.sweat * 50 + w * 20) % 46);
        ell(g, cx - hw + 2 + tx, wy, 2.6, 4);
      }
    }
    if (o.cig) {
      g.fillStyle = '#efe9dc';
      g.fillRect(cx + mw + tx, my - 2, 20, 4);
      g.fillStyle = '#d8663a';
      g.fillRect(cx + mw + 20 + tx, my - 2, 4, 4);
      for (var sm = 0; sm < 4; sm++) {
        g.fillStyle = 'rgba(210,210,215,' + (0.30 - sm * 0.06).toFixed(2) + ')';
        ell(g, cx + mw + 24 + tx + sm * 3, my - 8 - sm * 7 - o.cig * 6, 4 + sm * 2, 3 + sm * 1.6);
      }
    }
    if (o.bubble > 0.02) {
      g.fillStyle = 'rgba(255,150,190,0.72)';
      ell(g, cx + tx, my + 10 + o.bubble * 16, o.bubble * 26, o.bubble * 24);
      g.fillStyle = 'rgba(255,255,255,0.5)';
      ell(g, cx - o.bubble * 9 + tx, my + 4 + o.bubble * 12, o.bubble * 6, o.bubble * 4);
    }
    if (o.cup) {
      g.fillStyle = '#d8d2c6';
      g.fillRect(cx - 16 + tx, my - 4 + (1 - o.cup) * 26, 32, 30);
      g.fillStyle = '#b8b0a2';
      g.fillRect(cx - 16 + tx, my - 4 + (1 - o.cup) * 26, 32, 5);
      ring(g, cx + 20 + tx, my + 12 + (1 - o.cup) * 26, 7, 3, '#d8d2c6');
    }
    if (o.brush) {
      g.save();
      g.translate(cx + tx, my + 4);
      g.rotate(Math.sin(o.brush * 9) * 0.5);
      g.fillStyle = '#3fa8d8'; g.fillRect(-3, 0, 6, 34);
      g.fillStyle = '#f2f2ee'; g.fillRect(-7, -6, 14, 7);
      g.restore();
      g.fillStyle = 'rgba(245,250,255,0.85)';
      ell(g, cx - 10 + tx, my - 2, 5, 4); ell(g, cx + 11 + tx, my + 2, 4, 3.4);
    }
    if (o.hand) {
      var hx, hy, ha, spread;
      if (o.hand === 1) { hx = cx + 53 + tx; hy = cy + 8; ha = -0.12; spread = 1; }
      else if (o.hand === 2) { hx = cx + 30 + tx; hy = cy + 36; ha = -1.2; spread = 0; }
      else { hx = cx + 27 + tx; hy = cy + 6; ha = -1.5; spread = 0; }
      g.save();
      g.translate(hx, hy);
      g.rotate(ha);
      /* Fingers need their own outlines or they merge into one slab at
         this size — the split is the whole point of the salute. */
      for (var fg = 0; fg < 4; fg++) {
        var gap = spread ? (fg < 2 ? -4 : 4) : 0;
        var fx = -13 + fg * 6.5 + gap;
        g.fillStyle = L.skin;
        g.beginPath();
        g.moveTo(fx, 4);
        g.lineTo(fx, -22);
        g.quadraticCurveTo(fx + 2.6, -27, fx + 5.2, -22);
        g.lineTo(fx + 5.2, 4);
        g.closePath();
        g.fill();
        g.strokeStyle = 'rgba(120,80,55,0.75)';
        g.lineWidth = 1.1;
        g.stroke();
      }
      g.fillStyle = L.skin;                            /* palm */
      g.beginPath();
      g.moveTo(-14, 0); g.lineTo(14, 0);
      g.quadraticCurveTo(17, 20, 0, 23);
      g.quadraticCurveTo(-17, 20, -14, 0);
      g.closePath();
      g.fill();
      g.strokeStyle = 'rgba(120,80,55,0.75)'; g.lineWidth = 1.2; g.stroke();
      g.save();                                        /* thumb */
      g.translate(-13, 6); g.rotate(0.7);
      g.fillStyle = L.skin;
      g.beginPath();
      g.moveTo(0, 0); g.lineTo(-14, 3);
      g.quadraticCurveTo(-19, 6, -14, 9);
      g.lineTo(0, 8); g.closePath();
      g.fill(); g.stroke();
      g.restore();
      g.restore();
    }

    if (o.lipstick) {
      g.save();
      g.translate(cx + 20 + tx - o.lipstick * 18, my + 6);
      g.rotate(-0.5);
      g.fillStyle = '#2b2b33'; g.fillRect(-4, 0, 8, 18);
      g.fillStyle = '#d0304a'; g.fillRect(-3, -8, 6, 9);
      g.restore();
    }
    g.restore();
  }

  /* ================================================================
     A small 3D engine: rotate, project, depth-sort, shade.
     Geometry is built once and cached — only the transform runs per
     frame. Normals are flipped outward against the centroid so a
     solid shades correctly whatever winding its faces were built in.
     ================================================================ */

  var CAMD = 300;
  var GEO = {};

  function geo(name, build) {
    return GEO[name] || (GEO[name] = build());
  }

  function rot3(p, rx, ry, rz) {
    var x = p[0], y = p[1], z = p[2], c, s, q;
    c = Math.cos(rx); s = Math.sin(rx);
    q = y * c - z * s; z = y * s + z * c; y = q;
    c = Math.cos(ry); s = Math.sin(ry);
    q = x * c + z * s; z = -x * s + z * c; x = q;
    if (rz) { c = Math.cos(rz); s = Math.sin(rz); q = x * c - y * s; y = x * s + y * c; x = q; }
    return [x, y, z];
  }

  function pxy(p, sc) {
    var k = CAMD / (CAMD + p[2]);
    return [80 + p[0] * k * sc, 60 + p[1] * k * sc, k];
  }

  function xform(V, rx, ry, rz) {
    var out = [], i;
    for (i = 0; i < V.length; i++) out.push(rot3(V[i], rx, ry, rz));
    return out;
  }

  function wire(g, R, E, sc, rgb, lw) {
    for (var i = 0; i < E.length; i++) {
      var a = pxy(R[E[i][0]], sc), b = pxy(R[E[i][1]], sc);
      var d = (a[2] + b[2]) * 0.5;
      g.strokeStyle = 'rgba(' + rgb + ',' + Math.min(1, 0.18 + d * 0.85).toFixed(2) + ')';
      g.lineWidth = Math.max(0.6, lw * d);
      g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke();
    }
  }

  function dots(g, R, sc, rgb, size) {
    var i, order = [];
    for (i = 0; i < R.length; i++) order.push(i);
    order.sort(function (a, b) { return R[b][2] - R[a][2]; });
    for (i = 0; i < order.length; i++) {
      var p = pxy(R[order[i]], sc);
      g.fillStyle = 'rgba(' + rgb + ',' + Math.min(1, 0.15 + p[2] * 0.9).toFixed(2) + ')';
      ell(g, p[0], p[1], size * p[2], size * p[2]);
    }
  }

  function solid(g, R, F, sc, rgb, edge) {
    var i, k, order = [];
    for (i = 0; i < F.length; i++) {
      var f = F[i], z = 0;
      for (k = 0; k < f.length; k++) z += R[f[k]][2];
      order.push([i, z / f.length]);
    }
    order.sort(function (a, b) { return b[1] - a[1]; });   /* far first */
    for (i = 0; i < order.length; i++) {
      var fc = F[order[i][0]];
      var a = R[fc[0]], b = R[fc[1]], c = R[fc[2]];
      var ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
      var vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
      var nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      var cxm = 0, cym = 0, czm = 0;
      for (k = 0; k < fc.length; k++) { cxm += R[fc[k]][0]; cym += R[fc[k]][1]; czm += R[fc[k]][2]; }
      if (nx * cxm + ny * cym + nz * czm < 0) { nx = -nx; ny = -ny; nz = -nz; }
      var len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
      var sh = (nx * -0.42 + ny * -0.56 + nz * -0.72) / len;
      sh = 0.22 + Math.max(0, sh) * 0.9;
      g.fillStyle = 'rgb(' + ((rgb[0] * sh) | 0) + ',' + ((rgb[1] * sh) | 0) + ',' + ((rgb[2] * sh) | 0) + ')';
      g.beginPath();
      for (k = 0; k < fc.length; k++) {
        var s = pxy(R[fc[k]], sc);
        if (k) g.lineTo(s[0], s[1]); else g.moveTo(s[0], s[1]);
      }
      g.closePath();
      g.fill();
      if (edge) { g.strokeStyle = 'rgba(255,255,255,0.22)'; g.lineWidth = 0.7; g.stroke(); }
    }
  }

  /* --- geometry -------------------------------------------------- */

  function autoEdges(V, tol) {
    var i, j, d, min = Infinity, E = [];
    for (i = 0; i < V.length; i++) for (j = i + 1; j < V.length; j++) {
      d = Math.hypot(V[i][0] - V[j][0], V[i][1] - V[j][1], V[i][2] - V[j][2]);
      if (d < min) min = d;
    }
    for (i = 0; i < V.length; i++) for (j = i + 1; j < V.length; j++) {
      d = Math.hypot(V[i][0] - V[j][0], V[i][1] - V[j][1], V[i][2] - V[j][2]);
      if (d < min * (1 + tol)) E.push([i, j]);
    }
    return E;
  }

  function autoTris(V, E) {
    var set = {}, i, j, k, F = [];
    for (i = 0; i < E.length; i++) { set[E[i][0] + ',' + E[i][1]] = 1; set[E[i][1] + ',' + E[i][0]] = 1; }
    for (i = 0; i < V.length; i++)
      for (j = i + 1; j < V.length; j++)
        for (k = j + 1; k < V.length; k++)
          if (set[i + ',' + j] && set[j + ',' + k] && set[i + ',' + k]) F.push([i, j, k]);
    return F;
  }

  function gTetra() {
    var V = [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]];
    return { V: V, F: [[0, 1, 2], [0, 3, 1], [0, 2, 3], [1, 3, 2]], E: autoEdges(V, 0.1) };
  }

  function gCube() {
    var V = [], x, y, z;
    for (x = -1; x <= 1; x += 2) for (y = -1; y <= 1; y += 2) for (z = -1; z <= 1; z += 2) V.push([x, y, z]);
    /* index = ((x+1)/2)*4 + ((y+1)/2)*2 + (z+1)/2 */
    var F = [[0,1,3,2],[4,6,7,5],[0,4,5,1],[2,3,7,6],[0,2,6,4],[1,5,7,3]];
    return { V: V, F: F, E: autoEdges(V, 0.1) };
  }

  function gOcta() {
    var V = [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
    var E = autoEdges(V, 0.1);
    return { V: V, F: autoTris(V, E), E: E };
  }

  function gIcosa() {
    var p = 1.6180339887, V = [], i;
    var base = [[0,1,p],[0,1,-p],[0,-1,p],[0,-1,-p]];
    for (i = 0; i < 4; i++) {
      V.push(base[i]);
      V.push([base[i][1], base[i][2], base[i][0]]);
      V.push([base[i][2], base[i][0], base[i][1]]);
    }
    var E = autoEdges(V, 0.12);
    return { V: V, F: autoTris(V, E), E: E };
  }

  function gDodeca() {
    var p = 1.6180339887, ip = 1 / p, V = [], sx, sy, sz;
    for (sx = -1; sx <= 1; sx += 2) for (sy = -1; sy <= 1; sy += 2) for (sz = -1; sz <= 1; sz += 2) V.push([sx, sy, sz]);
    for (sy = -1; sy <= 1; sy += 2) for (sz = -1; sz <= 1; sz += 2) {
      V.push([0, sy * ip, sz * p]); V.push([sy * ip, sz * p, 0]); V.push([sy * p, 0, sz * ip]);
    }
    return { V: V, E: autoEdges(V, 0.12) };
  }

  function gTorus(nu, nv, R, r) {
    var V = [], F = [], E = [], u, v;
    for (u = 0; u < nu; u++) for (v = 0; v < nv; v++) {
      var a = u / nu * TAU, b = v / nv * TAU;
      V.push([(R + r * Math.cos(b)) * Math.cos(a), r * Math.sin(b), (R + r * Math.cos(b)) * Math.sin(a)]);
    }
    for (u = 0; u < nu; u++) for (v = 0; v < nv; v++) {
      var i0 = u * nv + v, i1 = ((u + 1) % nu) * nv + v;
      var i2 = ((u + 1) % nu) * nv + (v + 1) % nv, i3 = u * nv + (v + 1) % nv;
      F.push([i0, i1, i2, i3]); E.push([i0, i1]); E.push([i0, i3]);
    }
    return { V: V, F: F, E: E };
  }

  function gSphere(nu, nv, r) {
    var V = [], F = [], E = [], u, v;
    for (u = 0; u <= nu; u++) for (v = 0; v < nv; v++) {
      var ph = u / nu * Math.PI, th = v / nv * TAU;
      V.push([r * Math.sin(ph) * Math.cos(th), r * Math.cos(ph), r * Math.sin(ph) * Math.sin(th)]);
    }
    for (u = 0; u < nu; u++) for (v = 0; v < nv; v++) {
      var i0 = u * nv + v, i1 = (u + 1) * nv + v;
      var i2 = (u + 1) * nv + (v + 1) % nv, i3 = u * nv + (v + 1) % nv;
      F.push([i0, i1, i2, i3]); E.push([i0, i1]); E.push([i0, i3]);
    }
    return { V: V, F: F, E: E };
  }

  function gTube(nu, nv, rTop, rBot, h) {   /* cylinder / cone / hyperboloid base */
    var V = [], F = [], u, v;
    for (u = 0; u <= nu; u++) for (v = 0; v < nv; v++) {
      var f = u / nu, r = rBot + (rTop - rBot) * f, th = v / nv * TAU;
      V.push([r * Math.cos(th), -h / 2 + h * f, r * Math.sin(th)]);
    }
    for (u = 0; u < nu; u++) for (v = 0; v < nv; v++) {
      F.push([u * nv + v, (u + 1) * nv + v, (u + 1) * nv + (v + 1) % nv, u * nv + (v + 1) % nv]);
    }
    return { V: V, F: F };
  }

  function gGrid(n, sp) {
    var V = [], E = [], i, j;
    for (i = 0; i <= n; i++) for (j = 0; j <= n; j++) V.push([(i - n / 2) * sp, 0, (j - n / 2) * sp]);
    for (i = 0; i <= n; i++) for (j = 0; j <= n; j++) {
      if (i < n) E.push([i * (n + 1) + j, (i + 1) * (n + 1) + j]);
      if (j < n) E.push([i * (n + 1) + j, i * (n + 1) + j + 1]);
    }
    return { V: V, E: E, n: n };
  }

  function gTesseract() {
    var V = [], E = [], i, j, a, b, c, d;
    for (a = -1; a <= 1; a += 2) for (b = -1; b <= 1; b += 2)
      for (c = -1; c <= 1; c += 2) for (d = -1; d <= 1; d += 2) V.push([a, b, c, d]);
    for (i = 0; i < 16; i++) for (j = i + 1; j < 16; j++) {
      var diff = 0;
      for (var k = 0; k < 4; k++) if (V[i][k] !== V[j][k]) diff++;
      if (diff === 1) E.push([i, j]);
    }
    return { V: V, E: E };
  }

  function proj4(V, aw, rx, ry) {
    var out = [], i;
    for (i = 0; i < V.length; i++) {
      var x = V[i][0], y = V[i][1], z = V[i][2], w = V[i][3];
      var c = Math.cos(aw), s = Math.sin(aw);
      var x2 = x * c - w * s, w2 = x * s + w * c;
      var c2 = Math.cos(aw * 0.7), s2 = Math.sin(aw * 0.7);
      var y2 = y * c2 - w2 * s2, w3 = y * s2 + w2 * c2;
      var k = 2.4 / (2.4 + w3);
      out.push(rot3([x2 * k, y2 * k, z * k], rx, ry, 0));
    }
    return out;
  }

  function knotV(n, p, q, R, r) {
    var V = [], E = [], i;
    for (i = 0; i < n; i++) {
      var u = i / n * TAU * 1;
      var ph = p * u, th = q * u;
      var rad = R + r * Math.cos(th);
      V.push([rad * Math.cos(ph), r * Math.sin(th), rad * Math.sin(ph)]);
      E.push([i, (i + 1) % n]);
    }
    return { V: V, E: E };
  }

  function cubeAt(cx, cy, cz, s) {
    var V = [], x, y, z;
    for (x = -1; x <= 1; x += 2) for (y = -1; y <= 1; y += 2) for (z = -1; z <= 1; z += 2)
      V.push([cx + x * s, cy + y * s, cz + z * s]);
    return V;
  }
  var CUBE_F = [[0,1,3,2],[4,6,7,5],[0,4,5,1],[2,3,7,6],[0,2,6,4],[1,5,7,3]];

  function manyCubes(list, s) {           /* list of [x,y,z] centres */
    var V = [], F = [], i, k;
    for (i = 0; i < list.length; i++) {
      var base = V.length;
      var c = cubeAt(list[i][0], list[i][1], list[i][2], s);
      for (k = 0; k < 8; k++) V.push(c[k]);
      for (k = 0; k < 6; k++) F.push([base + CUBE_F[k][0], base + CUBE_F[k][1], base + CUBE_F[k][2], base + CUBE_F[k][3]]);
    }
    return { V: V, F: F };
  }

  /* --- composing solids out of parts ------------------------------
     boxGeo/merge let a scene be built from primitives, and solidM
     takes a colour per face so a whole object still goes through one
     depth sort — drawing parts separately would let them overlap
     wrongly. ---------------------------------------------------- */

  function boxGeo(x, y, z, w, h, d) {
    var V = [], sx, sy, sz, i;
    for (sx = -1; sx <= 1; sx += 2) for (sy = -1; sy <= 1; sy += 2) for (sz = -1; sz <= 1; sz += 2)
      V.push([x + sx * w, y + sy * h, z + sz * d]);
    var F = [];
    for (i = 0; i < CUBE_F.length; i++) F.push(CUBE_F[i].slice());
    return { V: V, F: F };
  }

  function cylGeo(x, y, z, rTop, rBot, h, seg, axis) {
    var m = gTube(1, seg || 10, rTop, rBot, h), V = [], i;
    for (i = 0; i < m.V.length; i++) {
      var p = m.V[i];
      if (axis === 'x') V.push([x + p[1], y + p[0], z + p[2]]);
      else if (axis === 'z') V.push([x + p[0], y + p[2], z + p[1]]);
      else V.push([x + p[0], y + p[1], z + p[2]]);
    }
    return { V: V, F: m.F };
  }

  function sphGeo(x, y, z, r, nu, nv) {
    var m = gSphere(nu || 7, nv || 10, r), V = [], i;
    for (i = 0; i < m.V.length; i++) V.push([x + m.V[i][0], y + m.V[i][1], z + m.V[i][2]]);
    return { V: V, F: m.F };
  }

  function part(geo, rgb) { return { V: geo.V, F: geo.F, c: rgb }; }

  function mergeC(parts) {
    var V = [], F = [], C = [], i, k;
    for (i = 0; i < parts.length; i++) {
      var base = V.length, p = parts[i];
      for (k = 0; k < p.V.length; k++) V.push(p.V[k]);
      for (k = 0; k < p.F.length; k++) {
        var f = p.F[k], nf = [], j;
        for (j = 0; j < f.length; j++) nf.push(f[j] + base);
        F.push(nf); C.push(p.c);
      }
    }
    return { V: V, F: F, C: C };
  }

  function solidM(g, R, F, C, sc, edge) {
    var i, k, order = [];
    for (i = 0; i < F.length; i++) {
      var f = F[i], z = 0;
      for (k = 0; k < f.length; k++) z += R[f[k]][2];
      order.push([i, z / f.length]);
    }
    order.sort(function (a, b) { return b[1] - a[1]; });
    for (i = 0; i < order.length; i++) {
      var idx = order[i][0], fc = F[idx], rgb = C[idx];
      var a = R[fc[0]], b = R[fc[1]], c = R[fc[2]];
      var ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
      var vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
      var nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      var cxm = 0, cym = 0, czm = 0;
      for (k = 0; k < fc.length; k++) { cxm += R[fc[k]][0]; cym += R[fc[k]][1]; czm += R[fc[k]][2]; }
      if (nx * cxm + ny * cym + nz * czm < 0) { nx = -nx; ny = -ny; nz = -nz; }
      var len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
      var sh = (nx * -0.42 + ny * -0.56 + nz * -0.72) / len;
      sh = 0.24 + Math.max(0, sh) * 0.9;
      g.fillStyle = 'rgb(' + ((rgb[0] * sh) | 0) + ',' + ((rgb[1] * sh) | 0) + ',' + ((rgb[2] * sh) | 0) + ')';
      g.beginPath();
      for (k = 0; k < fc.length; k++) {
        var s = pxy(R[fc[k]], sc);
        if (k) g.lineTo(s[0], s[1]); else g.moveTo(s[0], s[1]);
      }
      g.closePath();
      g.fill();
      if (edge) { g.strokeStyle = 'rgba(255,255,255,0.20)'; g.lineWidth = 0.7; g.stroke(); }
    }
  }

  /* draw a composed object with one rotation */
  function obj(g, m, rx, ry, rz, sc, edge) {
    solidM(g, xform(m.V, rx, ry, rz), m.F, m.C, sc, edge);
  }

  var G3 = [
    ['Tetrahedron', function (g, t) { var m = geo('tet', gTetra);
      solid(g, xform(m.V, t*0.0011, t*0.0017, 0), m.F, 32, [255,118,86], 1); }],

    ['Cube', function (g, t) { var m = geo('cub', gCube);
      solid(g, xform(m.V, t*0.0009, t*0.0014, t*0.0005), m.F, 30, [90,190,255], 1); }],

    ['Octahedron', function (g, t) { var m = geo('oct', gOcta);
      solid(g, xform(m.V, t*0.0013, t*0.0019, 0), m.F, 38, [180,120,255], 1); }],

    ['Icosahedron', function (g, t) { var m = geo('ico', gIcosa);
      solid(g, xform(m.V, t*0.001, t*0.0015, 0), m.F, 22, [90,230,170], 1); }],

    ['Dodecahedron', function (g, t) { var m = geo('dod', gDodeca);
      wire(g, xform(m.V, t*0.001, t*0.0016, 0), m.E, 26, '255,210,110', 2); }],

    ['Torus', function (g, t) { var m = geo('tor', function(){ return gTorus(20, 12, 1.5, 0.6); });
      solid(g, xform(m.V, t*0.0012, t*0.0017, 0), m.F, 30, [255,120,190], 0); }],

    ['Sphere', function (g, t) { var m = geo('sph', function(){ return gSphere(12, 18, 1.4); });
      solid(g, xform(m.V, 0.4, t*0.0016, 0), m.F, 34, [110,200,255], 0); }],

    ['Cone', function (g, t) { var m = geo('con', function(){ return gTube(8, 16, 0.02, 1.3, 2.4); });
      solid(g, xform(m.V, t*0.0008 + 0.35, t*0.0018, 0), m.F, 30, [255,180,70], 0); }],

    ['Cylinder', function (g, t) { var m = geo('cyl', function(){ return gTube(6, 16, 1.1, 1.1, 2.4); });
      solid(g, xform(m.V, t*0.0011 + 0.3, t*0.0016, 0), m.F, 30, [160,255,150], 0); }],

    ['Hyperboloid', function (g, t) {
      var V = [], E = [], i, n = 22;
      for (i = 0; i < n; i++) {
        var a = i / n * TAU;
        V.push([Math.cos(a) * 1.3, -1.3, Math.sin(a) * 1.3]);
        V.push([Math.cos(a + 1.3) * 1.3, 1.3, Math.sin(a + 1.3) * 1.3]);
        E.push([i * 2, i * 2 + 1]);
        E.push([i * 2, ((i + 1) % n) * 2]);
        E.push([i * 2 + 1, ((i + 1) % n) * 2 + 1]);
      }
      wire(g, xform(V, 0.25, t*0.0014, 0), E, 32, '120,255,235', 1.6); }],

    ['Tesseract', function (g, t) { var m = geo('tes', gTesseract);
      wire(g, proj4(m.V, t*0.0011, t*0.0007, t*0.0013), m.E, 36, '255,150,240', 1.8); }],

    ['Torus knot', function (g, t) { var m = geo('kn32', function(){ return knotV(140, 3, 2, 1.5, 0.55); });
      wire(g, xform(m.V, t*0.0009, t*0.0015, 0), m.E, 30, '120,220,255', 2.6); }],

    ['Trefoil knot', function (g, t) { var m = geo('kn23', function(){ return knotV(140, 2, 3, 1.4, 0.6); });
      wire(g, xform(m.V, t*0.0013, t*0.001, 0), m.E, 30, '255,190,90', 2.6); }],

    ['Mobius strip', function (g, t) {
      var m = geo('mob', function () {
        var V = [], F = [], i, n = 44;
        for (i = 0; i < n; i++) {
          var u = i / n * TAU, h = u / 2;
          for (var s = -1; s <= 1; s += 2) {
            var r = 1.4 + s * 0.42 * Math.cos(h);
            V.push([r * Math.cos(u), s * 0.42 * Math.sin(h), r * Math.sin(u)]);
          }
        }
        for (i = 0; i < n; i++) {
          var a = i * 2, b = ((i + 1) % n) * 2;
          F.push([a, a + 1, b + 1, b]);
        }
        return { V: V, F: F };
      });
      solid(g, xform(m.V, 0.5, t*0.0014, 0), m.F, 30, [255,120,150], 0); }],

    ['Helix spring', function (g, t) {
      var V = [], E = [], i, n = 120;
      for (i = 0; i < n; i++) {
        var u = i / n * TAU * 5;
        V.push([Math.cos(u) * 1.1, -1.6 + i / n * 3.2, Math.sin(u) * 1.1]);
        if (i) E.push([i - 1, i]);
      }
      wire(g, xform(V, 0.2, t*0.0016, 0), E, 32, '200,220,255', 2.4); }],

    ['DNA helix', function (g, t) {
      var V = [], E = [], i, n = 60;
      for (i = 0; i < n; i++) {
        var u = i / n * TAU * 3, y = -1.7 + i / n * 3.4;
        V.push([Math.cos(u) * 1.0, y, Math.sin(u) * 1.0]);
        V.push([Math.cos(u + Math.PI) * 1.0, y, Math.sin(u + Math.PI) * 1.0]);
        if (i) { E.push([(i-1)*2, i*2]); E.push([(i-1)*2+1, i*2+1]); }
        if (i % 3 === 0) E.push([i*2, i*2+1]);
      }
      wire(g, xform(V, 0.1, t*0.0013, 0), E, 30, '120,255,190', 2); }],

    ['Wireframe globe', function (g, t) { var m = geo('glb', function(){ return gSphere(9, 14, 1.5); });
      wire(g, xform(m.V, 0.42, t*0.0013, 0), m.E, 32, '150,200,255', 1.4); }],

    ['Ripple grid', function (g, t) {
      var m = geo('grd', function(){ return gGrid(12, 0.34); });
      var V = [], i;
      for (i = 0; i < m.V.length; i++) {
        var p = m.V[i], d = Math.hypot(p[0], p[2]);
        V.push([p[0], Math.sin(d * 3.4 - t * 0.005) * 0.42, p[2]]);
      }
      wire(g, xform(V, 0.95, t*0.0004, 0), m.E, 34, '110,240,255', 1.3); }],

    ['Terrain waves', function (g, t) {
      var m = geo('grd2', function(){ return gGrid(14, 0.3); });
      var V = [], i;
      for (i = 0; i < m.V.length; i++) {
        var p = m.V[i];
        V.push([p[0], Math.sin(p[0]*2.1 + t*0.0022) * 0.3 + Math.cos(p[2]*1.8 - t*0.0017) * 0.3, p[2]]);
      }
      wire(g, xform(V, 1.05, t*0.0003, 0), m.E, 34, '160,255,150', 1.3); }],

    ['Tunnel', function (g, t) {
      var i, k, V = [], E = [], n = 14, seg = 12;
      for (i = 0; i < n; i++) {
        var z = ((i * 1.2 + t * 0.0035) % (n * 1.2)) - n * 0.6;
        var base = V.length;
        for (k = 0; k < seg; k++) {
          var a = k / seg * TAU + z * 0.25;
          V.push([Math.cos(a) * 1.5, Math.sin(a) * 1.5, z * 3]);
          E.push([base + k, base + (k + 1) % seg]);
        }
      }
      wire(g, xform(V, 0, 0, 0), E, 46, '255,140,220', 2); }],

    ['Point sphere', function (g, t) {
      var V = [], i, n = 220;
      for (i = 0; i < n; i++) {
        var y = 1 - (i / (n - 1)) * 2, r = Math.sqrt(Math.max(0, 1 - y * y));
        var th = i * 2.39996 + t * 0.0012;
        V.push([Math.cos(th) * r * 1.5, y * 1.5, Math.sin(th) * r * 1.5]);
      }
      dots(g, xform(V, 0.3, t*0.0009, 0), 32, '140,240,255', 1.6); }],

    ['Lorenz attractor', function (g, t) {
      var m = geo('lor', function () {
        var x = 0.1, y = 0, z = 0, V = [], E = [], i;
        for (i = 0; i < 900; i++) {
          var dx = 10 * (y - x), dy = x * (28 - z) - y, dz = x * y - (8 / 3) * z;
          x += dx * 0.006; y += dy * 0.006; z += dz * 0.006;
          V.push([x * 0.07, (z - 25) * 0.07, y * 0.07]);
          if (i) E.push([i - 1, i]);
        }
        return { V: V, E: E };
      });
      wire(g, xform(m.V, 0.15, t*0.0009, 0), m.E, 30, '255,200,120', 1.4); }],

    ['Starfield cube', function (g, t) {
      var m = geo('stars', function () {
        var V = [], i;
        for (i = 0; i < 180; i++) V.push([(i*13%100)/50-1, (i*29%100)/50-1, (i*47%100)/50-1]);
        return { V: V };
      });
      dots(g, xform(m.V, t*0.0007, t*0.0011, t*0.0005), 40, '235,245,255', 1.4);
      var c = geo('cub', gCube);
      wire(g, xform(c.V, t*0.0007, t*0.0011, t*0.0005), c.E, 40, '90,140,200', 1); }],

    ['Particle vortex', function (g, t) {
      var V = [], i, n = 200;
      for (i = 0; i < n; i++) {
        var f = i / n, a = f * TAU * 4 + t * 0.003;
        var r = 0.2 + f * 1.5;
        V.push([Math.cos(a) * r, -1.4 + f * 2.8, Math.sin(a) * r]);
      }
      dots(g, xform(V, 0.2, t*0.0008, 0), 32, '255,160,220', 1.7); }],

    ['Cube array', function (g, t) {
      var m = geo('c27', function () {
        var list = [], x, y, z;
        for (x = -1; x <= 1; x++) for (y = -1; y <= 1; y++) for (z = -1; z <= 1; z++) list.push([x*1.1, y*1.1, z*1.1]);
        return manyCubes(list, 0.36);
      });
      solid(g, xform(m.V, t*0.001, t*0.0014, 0), m.F, 24, [255,150,90], 1); }],

    ['Nested cubes', function (g, t) {
      var c = geo('cub', gCube), i;
      for (i = 0; i < 3; i++) {
        var s = 1 + i * 0.8;
        var V = c.V.map(function (p) { return [p[0]*s, p[1]*s, p[2]*s]; });
        wire(g, xform(V, t*0.0009*(i%2?-1:1), t*0.0013*(i%2?1:-1), 0), c.E, 20,
             i === 0 ? '255,220,120' : i === 1 ? '120,255,200' : '180,150,255', 1.8);
      } }],

    ['Exploding cube', function (g, t) {
      var c = (t % 3600) / 3600;
      var burst = c < 0.5 ? Math.sin(c / 0.5 * Math.PI) : 0;
      var list = [], x, y, z;
      for (x = -1; x <= 1; x += 2) for (y = -1; y <= 1; y += 2) for (z = -1; z <= 1; z += 2)
        list.push([x * (0.55 + burst * 1.5), y * (0.55 + burst * 1.5), z * (0.55 + burst * 1.5)]);
      var m = manyCubes(list, 0.5);
      solid(g, xform(m.V, t*0.0012, t*0.0016, 0), m.F, 26, [255,110,110], 1); }],

    ['Cube to sphere', function (g, t) {
      var m = geo('sph2', function(){ return gSphere(10, 14, 1.0); });
      var f = 0.5 + 0.5 * Math.sin(t * 0.0013), V = [], i;
      for (i = 0; i < m.V.length; i++) {
        var p = m.V[i], mx = Math.max(Math.abs(p[0]), Math.abs(p[1]), Math.abs(p[2])) || 1;
        V.push([p[0]*(1-f) + p[0]/mx*f, p[1]*(1-f) + p[1]/mx*f, p[2]*(1-f) + p[2]/mx*f]);
      }
      solid(g, xform(V, t*0.001, t*0.0015, 0), m.F, 42, [200,160,255], 0); }],

    ['Gyroscope', function (g, t) {
      var i, k, rings = [[t*0.002, 0, 0], [0, t*0.0017, 0], [0, 0, t*0.0023]];
      var cols = ['255,120,120', '120,255,160', '140,180,255'];
      for (i = 0; i < 3; i++) {
        var V = [], E = [], n = 40;
        for (k = 0; k < n; k++) {
          var a = k / n * TAU;
          if (i === 0) V.push([Math.cos(a)*1.5, Math.sin(a)*1.5, 0]);
          else if (i === 1) V.push([Math.cos(a)*1.5, 0, Math.sin(a)*1.5]);
          else V.push([0, Math.cos(a)*1.5, Math.sin(a)*1.5]);
          E.push([k, (k + 1) % n]);
        }
        wire(g, xform(V, rings[i][0] + 0.3, rings[i][1] + t*0.0006, rings[i][2]), E, 30, cols[i], 2.2);
      } }],
    ['Linked rings', function (g, t) {
      var i, k, n = 4;
      for (i = 0; i < n; i++) {
        var V = [], E = [], m = 34;
        for (k = 0; k < m; k++) {
          var a = k / m * TAU;
          var p = [Math.cos(a) * 0.85, Math.sin(a) * 0.85, 0];
          if (i % 2) { var q = p[1]; p[1] = p[2]; p[2] = q; }
          p[0] += (i - (n - 1) / 2) * 1.15;
          V.push(p); E.push([k, (k + 1) % m]);
        }
        wire(g, xform(V, 0.35, t*0.0012, 0), E, 34,
             i % 2 ? '255,200,120' : '140,220,255', 2.4);
      } }],

    ['Menger sponge', function (g, t) {
      var m = geo('men', function () {
        var list = [], x, y, z;
        for (x = -1; x <= 1; x++) for (y = -1; y <= 1; y++) for (z = -1; z <= 1; z++) {
          var zeros = (x===0?1:0) + (y===0?1:0) + (z===0?1:0);
          if (zeros < 2) list.push([x*1.0, y*1.0, z*1.0]);
        }
        return manyCubes(list, 0.5);
      });
      solid(g, xform(m.V, t*0.0009, t*0.0013, 0), m.F, 26, [200,200,215], 1); }],

    ['Sierpinski tetra', function (g, t) {
      var m = geo('sie', function () {
        var base = [[1,1,1],[1,-1,-1],[-1,1,-1],[-1,-1,1]];
        var pts = [[0,0,0]], d;
        for (d = 0; d < 2; d++) {
          var next = [], i, k;
          for (i = 0; i < pts.length; i++) for (k = 0; k < 4; k++)
            next.push([pts[i][0] + base[k][0] * (d ? 0.55 : 1.1),
                       pts[i][1] + base[k][1] * (d ? 0.55 : 1.1),
                       pts[i][2] + base[k][2] * (d ? 0.55 : 1.1)]);
          pts = next;
        }
        var V = [], F = [], i, k;
        for (i = 0; i < pts.length; i++) {
          var b = V.length;
          for (k = 0; k < 4; k++) V.push([pts[i][0] + base[k][0]*0.28, pts[i][1] + base[k][1]*0.28, pts[i][2] + base[k][2]*0.28]);
          F.push([b,b+1,b+2]); F.push([b,b+3,b+1]); F.push([b,b+2,b+3]); F.push([b+1,b+3,b+2]);
        }
        return { V: V, F: F };
      });
      solid(g, xform(m.V, t*0.001, t*0.0015, 0), m.F, 24, [255,190,80], 0); }],

    ['Fractal tree', function (g, t) {
      var m = geo('tree', function () {
        var V = [[0,1.7,0]], E = [];
        (function grow(from, dir, len, depth) {
          if (depth === 0) return;
          for (var b = 0; b < 3; b++) {
            var a = b * TAU / 3 + depth;
            var nd = [dir[0]*0.55 + Math.cos(a)*0.55, dir[1]*0.8 - 0.25, dir[2]*0.55 + Math.sin(a)*0.55];
            var to = [V[from][0] + nd[0]*len, V[from][1] + nd[1]*len, V[from][2] + nd[2]*len];
            V.push(to); var idx = V.length - 1;
            E.push([from, idx]);
            grow(idx, nd, len * 0.62, depth - 1);
          }
        }(0, [0,-1,0], 1.0, 3));
        return { V: V, E: E };
      });
      wire(g, xform(m.V, 0.1, t*0.0011, 0), m.E, 30, '150,255,170', 1.8); }],

    ['Spiral staircase', function (g, t) {
      var list = [], i, n = 16;
      for (i = 0; i < n; i++) {
        var a = i / n * TAU * 1.6;
        list.push([Math.cos(a) * 1.1, -1.5 + i / n * 3, Math.sin(a) * 1.1]);
      }
      var m = manyCubes(list, 0.32);
      solid(g, xform(m.V, 0.2, t*0.0014, 0), m.F, 28, [120,200,255], 1); }],

    ['Twisting ribbon', function (g, t) {
      var V = [], F = [], i, n = 40;
      for (i = 0; i <= n; i++) {
        var f = i / n, y = -1.7 + f * 3.4, tw = f * 5 + t * 0.002;
        V.push([Math.cos(tw) * 0.9, y, Math.sin(tw) * 0.9]);
        V.push([-Math.cos(tw) * 0.9, y, -Math.sin(tw) * 0.9]);
        if (i) F.push([(i-1)*2, (i-1)*2+1, i*2+1, i*2]);
      }
      solid(g, xform(V, 0.15, t*0.0009, 0), F, 30, [255,140,200], 0); }],

    ['Vector field', function (g, t) {
      var V = [], E = [], i = 0, x, y, z;
      for (x = -1; x <= 1; x++) for (y = -1; y <= 1; y++) for (z = -1; z <= 1; z++) {
        var px = x * 1.1, py = y * 1.1, pz = z * 1.1;
        var a = t * 0.003 + px + py + pz;
        V.push([px, py, pz]);
        V.push([px + Math.cos(a) * 0.45, py + Math.sin(a) * 0.45, pz + Math.cos(a * 0.7) * 0.45]);
        E.push([i, i + 1]); i += 2;
      }
      wire(g, xform(V, t*0.0006, t*0.001, 0), E, 26, '255,230,140', 2.2); }],

    ['Pulsing sphere', function (g, t) {
      var m = geo('sph3', function(){ return gSphere(11, 16, 1.0); });
      var s = 1.15 + Math.sin(t * 0.005) * 0.35, V = [], i;
      for (i = 0; i < m.V.length; i++) V.push([m.V[i][0]*s, m.V[i][1]*s, m.V[i][2]*s]);
      solid(g, xform(V, 0.3, t*0.0012, 0), m.F, 34, [255,120,140], 0); }],

    ['Wave sphere', function (g, t) {
      var m = geo('sph4', function(){ return gSphere(13, 20, 1.0); });
      var V = [], i;
      for (i = 0; i < m.V.length; i++) {
        var p = m.V[i];
        var s = 1.35 + Math.sin(p[1] * 5 + t * 0.005) * 0.22;
        V.push([p[0]*s, p[1]*s, p[2]*s]);
      }
      solid(g, xform(V, 0.25, t*0.0011, 0), m.F, 32, [120,220,255], 0); }],

    ['Prism column', function (g, t) { var m = geo('pri', function(){ return gTube(1, 8, 1.1, 1.1, 3); });
      solid(g, xform(m.V, t*0.0008 + 0.25, t*0.0018, 0), m.F, 28, [220,180,255], 1); }],

    ['Stellated octahedron', function (g, t) {
      var m = geo('ste', function () {
        var a = gTetra(), V = [], F = [], i, k;
        for (i = 0; i < 4; i++) V.push(a.V[i]);
        for (i = 0; i < 4; i++) V.push([-a.V[i][0], -a.V[i][1], -a.V[i][2]]);
        for (k = 0; k < a.F.length; k++) F.push(a.F[k]);
        for (k = 0; k < a.F.length; k++) F.push([a.F[k][0]+4, a.F[k][1]+4, a.F[k][2]+4]);
        return { V: V, F: F };
      });
      solid(g, xform(m.V, t*0.0012, t*0.0016, 0), m.F, 30, [255,220,120], 1); }],

    ['Cuboctahedron', function (g, t) {
      var m = geo('cbo', function () {
        var V = [], s1, s2;
        for (s1 = -1; s1 <= 1; s1 += 2) for (s2 = -1; s2 <= 1; s2 += 2) {
          V.push([s1, s2, 0]); V.push([s1, 0, s2]); V.push([0, s1, s2]);
        }
        return { V: V, E: autoEdges(V, 0.12) };
      });
      wire(g, xform(m.V, t*0.0011, t*0.0015, 0), m.E, 36, '140,255,220', 2); }],

    ['Slotted disc', function (g, t) {
      var V = [], F = [], i, n = 12;
      for (i = 0; i < n; i++) {
        var a0 = i / n * TAU, a1 = a0 + TAU / n * 0.55, b = V.length;
        V.push([Math.cos(a0)*0.5, -0.12, Math.sin(a0)*0.5]);
        V.push([Math.cos(a1)*0.5, -0.12, Math.sin(a1)*0.5]);
        V.push([Math.cos(a1)*1.5, -0.12, Math.sin(a1)*1.5]);
        V.push([Math.cos(a0)*1.5, -0.12, Math.sin(a0)*1.5]);
        V.push([Math.cos(a0)*0.5, 0.12, Math.sin(a0)*0.5]);
        V.push([Math.cos(a1)*0.5, 0.12, Math.sin(a1)*0.5]);
        V.push([Math.cos(a1)*1.5, 0.12, Math.sin(a1)*1.5]);
        V.push([Math.cos(a0)*1.5, 0.12, Math.sin(a0)*1.5]);
        F.push([b,b+1,b+2,b+3]); F.push([b+4,b+7,b+6,b+5]);
        F.push([b+3,b+2,b+6,b+7]); F.push([b,b+4,b+5,b+1]);
      }
      solid(g, xform(V, 0.55, t*0.0022, 0), F, 32, [255,170,90], 0); }],

    ['Meshing gears', function (g, t) {
      var i, k;
      for (k = 0; k < 2; k++) {
        var V = [], F = [], n = 10, off = k ? 1.9 : -1.9, spin = t * 0.0024 * (k ? -1 : 1);
        for (i = 0; i < n; i++) {
          var a0 = i / n * TAU + spin + (k ? TAU / n / 2 : 0), a1 = a0 + TAU / n * 0.5, b = V.length;
          V.push([off + Math.cos(a0)*0.55, -0.2, Math.sin(a0)*0.55]);
          V.push([off + Math.cos(a1)*0.55, -0.2, Math.sin(a1)*0.55]);
          V.push([off + Math.cos(a1)*1.15, -0.2, Math.sin(a1)*1.15]);
          V.push([off + Math.cos(a0)*1.15, -0.2, Math.sin(a0)*1.15]);
          V.push([off + Math.cos(a0)*0.55, 0.2, Math.sin(a0)*0.55]);
          V.push([off + Math.cos(a1)*0.55, 0.2, Math.sin(a1)*0.55]);
          V.push([off + Math.cos(a1)*1.15, 0.2, Math.sin(a1)*1.15]);
          V.push([off + Math.cos(a0)*1.15, 0.2, Math.sin(a0)*1.15]);
          F.push([b,b+1,b+2,b+3]); F.push([b+4,b+7,b+6,b+5]);
          F.push([b+3,b+2,b+6,b+7]); F.push([b,b+4,b+5,b+1]);
        }
        solid(g, xform(V, 0.75, 0.15, 0), F, 26, k ? [255,140,110] : [140,200,255], 0);
      } }],

    ['Orbiting moons', function (g, t) {
      var m = geo('sph5', function(){ return gSphere(8, 12, 0.55); });
      solid(g, xform(m.V, 0.3, t*0.001, 0), m.F, 34, [255,200,90], 0);
      var i;
      for (i = 0; i < 3; i++) {
        var a = t * (0.0016 + i * 0.0007) + i * 2.1, r = 1.3 + i * 0.5;
        var V = [], k;
        for (k = 0; k < m.V.length; k++)
          V.push([m.V[k][0]*0.45 + Math.cos(a)*r, m.V[k][1]*0.45 + Math.sin(a*0.7)*0.5, m.V[k][2]*0.45 + Math.sin(a)*r]);
        solid(g, xform(V, 0.3, 0, 0), m.F, 34, i===0?[150,220,255]:i===1?[255,150,190]:[170,255,180], 0);
      } }],

    ['Spinning coin', function (g, t) { var m = geo('coin', function(){ return gTube(1, 20, 1.4, 1.4, 0.22); });
      solid(g, xform(m.V, Math.PI/2 + Math.sin(t*0.0016)*0.9, t*0.006, 0), m.F, 32, [240,215,120], 0); }],

    ['Pyramid stack', function (g, t) {
      var m = geo('pys', function () {
        var V = [], F = [], i, n = 4;
        for (i = 0; i < n; i++) {
          var s = 1.3 - i * 0.28, y = 1.2 - i * 0.72, b = V.length;
          V.push([-s, y, -s]); V.push([s, y, -s]); V.push([s, y, s]); V.push([-s, y, s]);
          V.push([0, y - 0.62, 0]);
          F.push([b,b+1,b+4]); F.push([b+1,b+2,b+4]); F.push([b+2,b+3,b+4]); F.push([b+3,b,b+4]);
          F.push([b,b+3,b+2,b+1]);
        }
        return { V: V, F: F };
      });
      solid(g, xform(m.V, 0.28, t*0.0015, 0), m.F, 26, [255,160,120], 1); }],

    ['Cross polycube', function (g, t) {
      var m = geo('crs', function () {
        return manyCubes([[0,0,0],[1.05,0,0],[-1.05,0,0],[0,1.05,0],[0,-1.05,0],[0,0,1.05],[0,0,-1.05]], 0.5);
      });
      solid(g, xform(m.V, t*0.0011, t*0.0015, t*0.0006), m.F, 28, [170,255,200], 1); }],

    ['Lattice cube', function (g, t) {
      var m = geo('lat', function () {
        var V = [], E = [], i, j, n = 3;
        for (i = 0; i <= n; i++) for (j = 0; j <= n; j++) {
          var a = (i / n * 2 - 1) * 1.4, b = (j / n * 2 - 1) * 1.4;
          var s = V.length;
          V.push([a, b, -1.4]); V.push([a, b, 1.4]);
          V.push([a, -1.4, b]); V.push([a, 1.4, b]);
          V.push([-1.4, a, b]); V.push([1.4, a, b]);
          E.push([s, s+1]); E.push([s+2, s+3]); E.push([s+4, s+5]);
        }
        return { V: V, E: E };
      });
      wire(g, xform(m.V, t*0.0008, t*0.0012, 0), m.E, 28, '190,190,255', 1.2); }],

    ['Kaleido polyhedron', function (g, t) {
      var m = geo('ico', gIcosa), i;
      for (i = 0; i < 4; i++) {
        var sx = (i & 1) ? -1 : 1, sy = (i & 2) ? -1 : 1;
        var V = m.V.map(function (p) { return [p[0]*sx*0.62 + sx*0.85, p[1]*sy*0.62 + sy*0.62, p[2]*0.62]; });
        solid(g, xform(V, t*0.0012*sx, t*0.0016*sy, 0), m.F, 26,
              i===0?[255,120,160]:i===1?[120,220,255]:i===2?[255,220,120]:[160,255,170], 0);
      } }],

    ['Ringed planet', function (g, t) {
      var m = geo('sph6', function(){ return gSphere(10, 16, 1.0); });
      var tilt = 0.42;
      solid(g, xform(m.V, tilt, t*0.0013, 0), m.F, 32, [220,180,120], 0);
      var i, k;
      for (k = 0; k < 3; k++) {
        var V = [], E = [], n = 46, rr = 1.6 + k * 0.32;
        for (i = 0; i < n; i++) {
          var a = i / n * TAU;
          V.push([Math.cos(a) * rr, 0, Math.sin(a) * rr]);
          E.push([i, (i + 1) % n]);
        }
        wire(g, xform(V, tilt, t*0.0006, 0), E, 32, '255,225,170', 1.6);
      } }]
  ];


  /* ================================================================
     ANIMAL FACES — one parametric head, close up.

     Species differ far more than human faces do, so the renderer takes
     a shape vocabulary (ear type, snout length, horn type, beak,
     markings) rather than a single skull. Each animal is a line of
     config plus an "act" that animates it.
     ================================================================ */

  function A(cfg) {                       /* defaults + overrides */
    var o = {
      fur:'#b08050', lit:'#d8a878', dark:'#7a5430', belly:'#f2e6d2',
      nose:'#2a2018', eye:'#f0e0b0', pupil:'#120c08', ear:'#7a5430',
      headW:40, headH:40, jaw:0.9,
      earType:2, earSz:1, earX:0.86, earY:-0.62, earTilt:0.5,
      muzzle:1, snout:0, noseType:1, noseSz:1, mouthType:0,
      horn:0, mark:0, whisk:0, mane:0, beak:0, tusk:0, trunk:0, comb:0, wattle:0,
      pupilType:0, eyeSz:1, eyeSpread:1, eyeY:0,
      act:'blink',
      eyeOpen:1, mouth:0, tongue:0, tilt:0, bob:0, gaze:0, earFlick:0
    };
    for (var k in cfg) if (cfg.hasOwnProperty(k)) o[k] = cfg[k];
    return o;
  }

  function animAct(o, t) {
    var b = Math.sin(t * 0.0017 + o.headW);
    o.eyeOpen = b > 0.9 ? 0.08 : 1;
    o.gaze = Math.sin(t * 0.0007) * 0.5;
    switch (o.act) {
      case 'pant':
        o.mouth = 0.45 + Math.abs(Math.sin(t * 0.011)) * 0.3; o.tongue = 1; break;
      case 'chew':
        o.mouth = 0.08 + Math.abs(Math.sin(t * 0.007)) * 0.22;
        o.tilt = Math.sin(t * 0.007) * 0.06; break;
      case 'twitch':
        o.earFlick = Math.sin(t * 0.004) > 0.7 ? Math.sin(t * 0.05) * 0.35 : 0;
        o.mouth = 0.05; break;
      case 'sniff':
        o.bob = Math.abs(Math.sin(t * 0.009)) * 2.5;
        o.mouth = 0.06 + Math.abs(Math.sin(t * 0.009)) * 0.08; break;
      case 'roar':
        var r = (t % 3400) / 3400;
        o.mouth = r < 0.4 ? Math.sin(r / 0.4 * Math.PI) * 0.95 : 0.05;
        o.tongue = o.mouth > 0.5 ? 1 : 0;
        o.eyeOpen = o.mouth > 0.4 ? 0.35 : 1; break;
      case 'hoot':
        o.tilt = Math.sin(t * 0.0012) * 0.3;
        o.eyeOpen = b > 0.93 ? 0.1 : 1;
        o.mouth = 0.1 + Math.abs(Math.sin(t * 0.004)) * 0.15; break;
      case 'peck':
        var pk = (t % 1800) / 1800;
        o.bob = pk < 0.3 ? Math.sin(pk / 0.3 * Math.PI) * 10 : 0;
        o.mouth = o.bob > 4 ? 0.4 : 0.05; break;
      case 'flick':
        var fl = (t % 2600) / 2600;
        o.tongue = fl < 0.16 ? 1 : 0;
        o.mouth = fl < 0.16 ? 0.3 : 0.02; break;
      case 'yawn':
        var y = (t % 4600) / 4600;
        o.mouth = y < 0.35 ? Math.sin(y / 0.35 * Math.PI) * 0.9 : 0.04;
        o.eyeOpen = 1 - o.mouth * 0.9; break;
      case 'bob':
        o.bob = Math.sin(t * 0.004) * 4; o.tilt = Math.sin(t * 0.004) * 0.09;
        o.mouth = 0.08; break;
      case 'grin':
        o.mouth = 0.22 + Math.abs(Math.sin(t * 0.003)) * 0.1;
        o.eyeOpen = 0.75; break;
      case 'blinkslow':
        o.eyeOpen = Math.sin(t * 0.0009) > 0.75 ? 0.06 : 1;
        o.mouth = 0.03; break;
      default:
        o.mouth = 0.06;
    }
  }

  function drawAnimal(g, o) {
    var cx = 80, cy = 58 + o.bob, hw = o.headW, hh = o.headH;

    g.save();
    g.translate(cx, cy);
    g.rotate(o.tilt);
    g.translate(-cx, -cy);

    /* neck / shoulders */
    g.fillStyle = o.dark;
    ell(g, cx, 128, hw * 1.5, 36);

    /* horns and antlers sit behind the head */
    if (o.horn) {
      g.fillStyle = o.horn === 3 ? '#8a6a42' : '#d8cdb0';
      for (var hs = 0; hs < 2; hs++) {
        var sx = hs ? 1 : -1;
        g.save();
        g.translate(cx + sx * hw * 0.62, cy - hh * 0.72);
        g.rotate(sx * 0.4);
        if (o.horn === 1) {                       /* curved back */
          g.beginPath(); g.moveTo(0, 0);
          g.quadraticCurveTo(sx * 16, -22, sx * 4, -30);
          g.quadraticCurveTo(sx * 2, -18, 0, 0); g.fill();
        } else if (o.horn === 2) {                /* short and out */
          g.beginPath(); g.moveTo(0, 0);
          g.quadraticCurveTo(sx * 22, -8, sx * 26, -20);
          g.quadraticCurveTo(sx * 14, -12, 0, 0); g.fill();
        } else if (o.horn === 3) {                /* antlers */
          seg(g, 0, 0, sx * 10, -26, 4, '#8a6a42');
          seg(g, sx * 10, -26, sx * 22, -34, 3, '#8a6a42');
          seg(g, sx * 6, -16, sx * 18, -22, 3, '#8a6a42');
          seg(g, sx * 10, -26, sx * 12, -40, 3, '#8a6a42');
        } else if (o.horn === 5) {                /* ossicones */
          g.fillRect(-2.5, -16, 5, 16); ell(g, 0, -17, 4.5, 4);
        }
        g.restore();
      }
      if (o.horn === 4) {                         /* single nose horn */
        g.fillStyle = '#cfc6ae';
        poly(g, [[cx - 6, cy + hh * 0.5], [cx, cy + hh * 0.5 - 30], [cx + 6, cy + hh * 0.5]]);
      }
    }

    /* ears behind the head */
    if (o.earType) {
      for (var e = 0; e < 2; e++) {
        var s = e ? 1 : -1;
        var ex = cx + s * hw * o.earX, ey = cy + hh * o.earY;
        g.save();
        g.translate(ex, ey);
        g.rotate(s * (o.earTilt + o.earFlick));
        var z = o.earSz;
        g.fillStyle = o.fur;
        if (o.earType === 1) {                    /* pointed */
          poly(g, [[-11 * z, 10 * z], [0, -26 * z], [11 * z, 10 * z]]);
          g.fillStyle = o.ear;
          poly(g, [[-6 * z, 7 * z], [0, -16 * z], [6 * z, 7 * z]]);
        } else if (o.earType === 2) {             /* round */
          ell(g, 0, 0, 13 * z, 13 * z);
          g.fillStyle = o.ear; ell(g, 0, 0, 7.5 * z, 7.5 * z);
        } else if (o.earType === 3) {             /* floppy */
          ell(g, 0, 14 * z, 10 * z, 22 * z, s * 0.25);
          g.fillStyle = o.ear; ell(g, 0, 14 * z, 5 * z, 15 * z, s * 0.25);
        } else if (o.earType === 4) {             /* long */
          ell(g, 0, -18 * z, 7.5 * z, 26 * z, s * 0.16);
          g.fillStyle = o.ear; ell(g, 0, -18 * z, 4 * z, 19 * z, s * 0.16);
        } else if (o.earType === 5) {             /* tiny */
          ell(g, 0, 0, 6 * z, 6 * z);
        } else if (o.earType === 6) {             /* tufted */
          poly(g, [[-10 * z, 10 * z], [0, -24 * z], [10 * z, 10 * z]]);
          g.fillStyle = o.dark;
          seg(g, 0, -18 * z, s * 6 * z, -34 * z, 2.4, o.dark);
          seg(g, 3 * s * z, -16 * z, s * 11 * z, -30 * z, 2, o.dark);
        }
        g.restore();
      }
    }

    /* mane behind the head */
    if (o.mane) {
      g.fillStyle = o.dark;
      for (var m = 0; m < 16; m++) {
        var ma = m * TAU / 16;
        ell(g, cx + Math.cos(ma) * hw * 0.98, cy + Math.sin(ma) * hh * 0.98,
            hw * 0.34, hh * 0.34);
      }
    }

    /* head */
    var grd = g.createRadialGradient(cx - hw * 0.35, cy - hh * 0.45, 4, cx, cy, hw * 1.5);
    grd.addColorStop(0, o.lit); grd.addColorStop(0.5, o.fur); grd.addColorStop(1, o.dark);
    g.fillStyle = grd;
    ell(g, cx, cy, hw, hh);
    if (o.jaw !== 1) ell(g, cx, cy + hh * 0.45, hw * o.jaw, hh * 0.55);

    g.shadowColor = 'transparent'; g.shadowBlur = 0;

    /* markings */
    if (o.mark === 1) {                           /* stripes */
      g.fillStyle = o.dark;
      for (var st = 0; st < 5; st++) {
        var sxp = cx + (st - 2) * hw * 0.34;
        g.save(); g.translate(sxp, cy - hh * 0.5); g.rotate((st - 2) * 0.14);
        g.fillRect(-2.5, -12, 5, 26); g.restore();
      }
    } else if (o.mark === 2) {                    /* spots */
      g.fillStyle = 'rgba(40,26,14,0.75)';
      for (var sp = 0; sp < 11; sp++) {
        var a2 = sp * 2.399, r2 = (sp % 4) * hw * 0.22;
        ell(g, cx + Math.cos(a2) * r2, cy + Math.sin(a2) * r2 * 0.9, 3.6, 3);
      }
    } else if (o.mark === 3) {                    /* bandit mask */
      g.fillStyle = '#1e1a18';
      ell(g, cx - hw * 0.42, cy - hh * 0.06, hw * 0.36, hh * 0.24, -0.18);
      ell(g, cx + hw * 0.42, cy - hh * 0.06, hw * 0.36, hh * 0.24, 0.18);
    } else if (o.mark === 4) {                    /* panda patches */
      g.fillStyle = '#141414';
      ell(g, cx - hw * 0.42, cy - hh * 0.1, hw * 0.3, hh * 0.3, -0.3);
      ell(g, cx + hw * 0.42, cy - hh * 0.1, hw * 0.3, hh * 0.3, 0.3);
    } else if (o.mark === 5) {                    /* dorsal stripe */
      g.fillStyle = '#f4f4f0';
      g.fillRect(cx - 5, cy - hh, 10, hh * 1.2);
    }

    /* muzzle */
    if (o.muzzle) {
      g.fillStyle = o.belly;
      ell(g, cx, cy + hh * (0.42 + o.snout * 0.2), hw * 0.5 * o.muzzle,
          hh * (0.3 + o.snout * 0.22) * o.muzzle);
    }

    /* eyes */
    var edx = hw * 0.42 * o.eyeSpread, ey2 = cy - hh * 0.14 + o.eyeY;
    for (var i = 0; i < 2; i++) {
      var sg = i ? 1 : -1, x2 = cx + sg * edx;
      var op = o.eyeOpen, rr = 8.5 * o.eyeSz;
      g.fillStyle = o.eye;
      ell(g, x2, ey2, rr, rr * op);
      if (op > 0.15) {
        g.fillStyle = o.pupil;
        if (o.pupilType === 1) ell(g, x2 + o.gaze * 2, ey2, rr * 0.22, rr * 0.78 * op);
        else if (o.pupilType === 2) ell(g, x2 + o.gaze * 2, ey2, rr * 0.8, rr * 0.24 * op);
        else ell(g, x2 + o.gaze * 2, ey2, rr * 0.46, rr * 0.46 * op);
        g.fillStyle = 'rgba(255,255,255,0.9)';
        ell(g, x2 - rr * 0.3, ey2 - rr * 0.3, rr * 0.16, rr * 0.14);
      }
      /* Lid in fur colour, and only while actually closing — drawn in
         the shading colour at full open it reads as a marking on the
         forehead rather than an eyelid. */
      if (op < 0.95) {
        g.fillStyle = o.fur;
        ell(g, x2, ey2 - rr - rr * op, rr * 1.3, rr);
      }
    }

    /* nose or beak */
    var ny = cy + hh * (0.36 + o.snout * 0.24);
    if (o.beak) {
      g.fillStyle = o.beak === 2 ? '#e8a83c' : '#d8a038';
      if (o.beak === 1) {                         /* hooked */
        poly(g, [[cx - 9, ny - 8], [cx + 9, ny - 8], [cx + 3, ny + 16], [cx - 3, ny + 16]]);
        g.fillStyle = '#b8801c';
        poly(g, [[cx - 4, ny + 8], [cx + 4, ny + 8], [cx, ny + 20]]);
      } else if (o.beak === 2) {                  /* broad bill */
        ell(g, cx, ny + 6, 17, 8);
        g.fillStyle = '#c98c22'; ell(g, cx, ny + 10, 15, 4);
      } else {                                    /* simple cone */
        poly(g, [[cx - 8, ny - 4], [cx + 8, ny - 4], [cx, ny + 14]]);
      }
    } else if (o.noseType === 1) {
      g.fillStyle = o.nose; ell(g, cx, ny, 8 * o.noseSz, 6 * o.noseSz);
    } else if (o.noseType === 2) {                /* snout disc */
      g.fillStyle = '#e29a9a'; ell(g, cx, ny, 13 * o.noseSz, 9 * o.noseSz);
      g.fillStyle = '#a86868';
      ell(g, cx - 5, ny, 2.6, 3.4); ell(g, cx + 5, ny, 2.6, 3.4);
    } else if (o.noseType === 3) {                /* triangle */
      g.fillStyle = o.nose;
      poly(g, [[cx - 6, ny - 3], [cx + 6, ny - 3], [cx, ny + 5]]);
    } else if (o.noseType === 4) {                /* wide nostrils */
      g.fillStyle = o.dark;
      ell(g, cx - 7, ny, 3.4, 4.4, -0.3); ell(g, cx + 7, ny, 3.4, 4.4, 0.3);
    }

    /* mouth */
    var my = ny + 9 + o.snout * 4;
    if (!o.beak) {
      if (o.mouth > 0.08) {
        g.fillStyle = '#40161c';
        ell(g, cx, my + o.mouth * 5, 12 + o.mouth * 6, 3 + o.mouth * 12);
        if (o.tongue) { g.fillStyle = '#e2717c';
          ell(g, cx, my + o.mouth * 12, 7, 4 + o.mouth * 5); }
        if (o.mouthType === 1) {                  /* fangs */
          g.fillStyle = '#f4f0e4';
          poly(g, [[cx - 8, my], [cx - 4, my], [cx - 6, my + 8]]);
          poly(g, [[cx + 8, my], [cx + 4, my], [cx + 6, my + 8]]);
        }
      } else {
        g.strokeStyle = 'rgba(50,30,20,0.7)'; g.lineWidth = 1.8;
        g.beginPath(); g.moveTo(cx - 9, my); g.quadraticCurveTo(cx, my + 5, cx + 9, my); g.stroke();
      }
    }

    if (o.comb) {                                 /* cockerel comb */
      g.fillStyle = '#d8323c';
      for (var cb = 0; cb < 4; cb++)
        ell(g, cx - 12 + cb * 8, cy - hh - 4 - (cb % 2) * 4, 6, 8);
    }
    if (o.wattle) {
      g.fillStyle = '#c8282f';
      ell(g, cx - 7, ny + 20, 5, 10); ell(g, cx + 7, ny + 20, 5, 10);
    }

    if (o.tusk) {
      g.fillStyle = '#efe8d4';
      poly(g, [[cx - 11, my - 2], [cx - 6, my - 2], [cx - 7, my + 24]]);
      poly(g, [[cx + 11, my - 2], [cx + 6, my - 2], [cx + 7, my + 24]]);
    }

    if (o.trunk) {
      /* Drawn in the face colour the trunk simply disappeared into the
         head. It needs its own tone and an outline to read. */
      g.beginPath();
      g.moveTo(cx - 11, ny - 6);
      g.quadraticCurveTo(cx - 9, my + 34, cx + 4, my + 46);
      g.quadraticCurveTo(cx + 12, my + 32, cx + 11, ny - 6);
      g.closePath();
      g.fillStyle = o.dark;
      g.fill();
      g.strokeStyle = 'rgba(0,0,0,0.55)'; g.lineWidth = 1.8; g.stroke();
      g.fillStyle = o.lit;                        /* wrinkles catch light */
      for (var w = 0; w < 6; w++) {
        g.fillRect(cx - 9 + w * 0.7, ny + 2 + w * 8, 19 - w * 1.9, 1.6);
      }
    }

    if (o.whisk) {
      g.strokeStyle = 'rgba(250,246,236,0.8)'; g.lineWidth = 1.3;
      for (var wi = 0; wi < 3; wi++) {
        g.beginPath(); g.moveTo(cx - 10, my - 6 + wi * 3); g.lineTo(cx - 40, my - 12 + wi * 7); g.stroke();
        g.beginPath(); g.moveTo(cx + 10, my - 6 + wi * 3); g.lineTo(cx + 40, my - 12 + wi * 7); g.stroke();
      }
    }

    g.restore();
  }

  /* Species already used by other channels are deliberately absent:
     cat, tiger, frog, horse, cow, octopus, crab, pigeon, snail, bats. */
  var ANIMALS = [
    ['Dog',       { fur:'#c58c4e', lit:'#e4b47c', dark:'#8a5a28', belly:'#f4e8d4', earType:3, earTilt:0.15, earX:0.8, earY:-0.3, snout:0.5, act:'pant' }],
    ['Fox',       { fur:'#e07a2c', lit:'#f5a355', dark:'#a04f14', belly:'#f6efe2', earType:1, earSz:1.1, snout:0.55, whisk:1, act:'twitch' }],
    ['Wolf',      { fur:'#8d9199', lit:'#b9bdc4', dark:'#5c6068', belly:'#e8ebef', earType:1, snout:0.6, mouthType:1, act:'roar' }],
    ['Lion',      { fur:'#d9a24e', lit:'#f0c27c', dark:'#9a6a22', belly:'#f3e6cc', earType:2, earSz:0.8, mane:1, snout:0.3, whisk:1, mouthType:1, act:'roar' }],
    ['Leopard',   { fur:'#e0b154', lit:'#f4cd82', dark:'#9e7420', belly:'#f6ecd6', earType:2, earSz:0.7, mark:2, snout:0.3, whisk:1, pupilType:1, act:'blinkslow' }],
    ['Cheetah',   { fur:'#dcb060', lit:'#f2ca8c', dark:'#997420', belly:'#f6eddc', earType:2, earSz:0.7, mark:2, snout:0.35, whisk:1, act:'grin' }],
    ['Lynx',      { fur:'#b7ad9c', lit:'#d8cfc0', dark:'#7d7466', belly:'#f2ede2', earType:6, snout:0.3, whisk:1, pupilType:1, act:'twitch' }],
    ['Bear',      { fur:'#8a6038', lit:'#ab7f52', dark:'#573a1e', belly:'#c9a678', earType:2, earSz:0.9, headW:44, snout:0.45, act:'chew' }],
    ['Panda',     { fur:'#f2f0ec', lit:'#ffffff', dark:'#c9c6c0', belly:'#ffffff', ear:'#141414', earType:2, earSz:0.9, mark:4, headW:44, snout:0.3, act:'chew' }],
    ['Koala',     { fur:'#9aa0a6', lit:'#c2c7cc', dark:'#666c72', belly:'#e6e9ec', earType:2, earSz:1.5, ear:'#c8a0a8', headW:42, noseSz:1.6, act:'blinkslow' }],
    ['Rabbit',    { fur:'#e8e2d8', lit:'#ffffff', dark:'#b5ae a2'.replace(' ',''), belly:'#ffffff', earType:4, earSz:1.1, headW:34, headH:36, whisk:1, noseType:3, act:'twitch' }],
    ['Mouse',     { fur:'#a8a2a0', lit:'#cbc6c4', dark:'#6f6a68', belly:'#efe6e2', earType:2, earSz:1.6, ear:'#e0a8b0', headW:32, headH:34, snout:0.6, whisk:1, noseType:3, act:'sniff' }],
    ['Hamster',   { fur:'#d8ac6c', lit:'#f0cd98', dark:'#9a7434', belly:'#f6ecd8', earType:2, earSz:0.9, headW:42, headH:38, whisk:1, noseType:3, act:'chew' }],
    ['Squirrel',  { fur:'#a8724a', lit:'#c9946a', dark:'#6f4626', belly:'#f0e2cc', earType:6, earSz:0.7, headW:34, snout:0.5, whisk:1, act:'chew' }],
    ['Raccoon',   { fur:'#9b9a97', lit:'#c0bfbc', dark:'#5f5e5c', belly:'#e8e6e2', earType:2, earSz:0.9, mark:3, snout:0.55, whisk:1, act:'sniff' }],
    ['Skunk',     { fur:'#2a2a2e', lit:'#4a4a50', dark:'#141418', belly:'#f2f2ee', earType:2, earSz:0.7, mark:5, snout:0.5, whisk:1, act:'sniff' }],
    ['Hedgehog',  { fur:'#8a7a62', lit:'#a99a80', dark:'#584c3a', belly:'#e0cfae', earType:5, mark:1, headW:36, snout:0.7, whisk:1, noseType:3, act:'sniff' }],
    ['Otter',     { fur:'#7c5a3c', lit:'#9c7a58', dark:'#4e3722', belly:'#d8c2a0', earType:5, headW:38, snout:0.35, whisk:1, act:'grin' }],
    ['Badger',    { fur:'#6e6a66', lit:'#918d88', dark:'#3e3b38', belly:'#f0eee8', earType:5, mark:5, snout:0.6, act:'sniff' }],
    ['Seal',      { fur:'#8e939a', lit:'#b4b9c0', dark:'#5c6067', belly:'#dfe3e8', earType:0, headW:38, headH:36, snout:0.3, whisk:1, pupilType:0, eyeSz:1.2, act:'blinkslow' }],
    ['Walrus',    { fur:'#a07a68', lit:'#c19a86', dark:'#6b4c3c', belly:'#d8bca8', earType:0, headW:42, snout:0.4, whisk:1, tusk:1, act:'blinkslow' }],
    ['Elephant',  { fur:'#aeaaa6', lit:'#cecac6', dark:'#5e5a56', belly:'#b0aca8', earType:3, earSz:2.1, earX:1.0, earY:-0.1, headW:38, trunk:1, noseType:0, eyeSz:0.7, act:'bob' }],
    ['Rhino',     { fur:'#8e8e8c', lit:'#adadaa', dark:'#5e5e5c', belly:'#a0a09c', earType:5, horn:4, headW:38, snout:0.7, eyeSz:0.7, noseType:4, act:'sniff' }],
    ['Hippo',     { fur:'#9a7f8e', lit:'#bb9fae', dark:'#65505d', belly:'#d0b6c2', earType:5, headW:44, headH:38, snout:0.5, muzzle:1.5, noseType:4, act:'yawn' }],
    ['Giraffe',   { fur:'#e2b45c', lit:'#f4d189', dark:'#a2792a', belly:'#f4e6c8', earType:1, earSz:0.9, horn:5, mark:2, headW:30, headH:40, snout:0.8, act:'chew' }],
    ['Zebra',     { fur:'#f0efe9', lit:'#ffffff', dark:'#b8b6b0', belly:'#ffffff', earType:1, earSz:0.9, mark:1, headW:30, headH:42, snout:0.8, act:'twitch' }],
    ['Donkey',    { fur:'#9c948c', lit:'#bdb5ac', dark:'#655e58', belly:'#e2dbd2', earType:4, earSz:1.2, headW:30, headH:42, snout:0.8, act:'chew' }],
    ['Bull',      { fur:'#7a5230', lit:'#9c7048', dark:'#4c3018', belly:'#c8a882', earType:5, horn:2, headW:40, snout:0.6, noseType:4, act:'sniff' }],
    ['Goat',      { fur:'#e6e0d2', lit:'#faf6ea', dark:'#b0a894', belly:'#f6f2e6', earType:3, earSz:0.9, horn:1, headW:30, headH:40, snout:0.7, act:'chew' }],
    ['Sheep',     { fur:'#efeade', lit:'#ffffff', dark:'#bab3a2', belly:'#f8f4ea', earType:3, earSz:1.1, earTilt:0.9, headW:34, snout:0.5, act:'chew' }],
    ['Pig',       { fur:'#eda8b0', lit:'#ffc8ce', dark:'#b8767e', belly:'#f8d2d8', earType:1, earSz:1.1, earTilt:0.9, headW:40, snout:0.4, noseType:2, act:'chew' }],
    ['Deer',      { fur:'#b98a56', lit:'#d8aa78', dark:'#7c5628', belly:'#f0e2cc', earType:4, earSz:0.9, earTilt:0.9, horn:3, headW:30, headH:40, snout:0.7, act:'twitch' }],
    ['Moose',     { fur:'#6f5238', lit:'#8d6c4c', dark:'#452f1c', belly:'#a88a66', earType:4, earSz:0.8, earTilt:1.0, horn:3, headW:32, headH:44, snout:0.9, act:'chew' }],
    ['Camel',     { fur:'#d4ab72', lit:'#eec99a', dark:'#93703c', belly:'#eedcc0', earType:5, headW:30, headH:40, snout:0.9, act:'chew' }],
    ['Llama',     { fur:'#e4d6bc', lit:'#f6ecd8', dark:'#a8977a', belly:'#f6efe2', earType:4, earSz:0.9, headW:30, headH:40, snout:0.7, act:'chew' }],
    ['Monkey',    { fur:'#8a6a4a', lit:'#a98a68', dark:'#584028', belly:'#e0c2a0', earType:2, earSz:1.4, headW:36, snout:0.4, muzzle:1.4, act:'grin' }],
    ['Gorilla',   { fur:'#3a3a3e', lit:'#5c5c62', dark:'#1e1e22', belly:'#6a5a52', earType:5, headW:44, headH:42, snout:0.4, muzzle:1.4, act:'roar' }],
    ['Lemur',     { fur:'#a8a8a4', lit:'#c9c9c4', dark:'#6a6a66', belly:'#f0efe8', earType:2, earSz:1.2, mark:3, headW:34, snout:0.5, eye:'#f6d24a', eyeSz:1.2, act:'blinkslow' }],
    ['Owl',       { fur:'#a1876a', lit:'#c2a789', dark:'#66523c', belly:'#e6d6bc', earType:6, earSz:0.6, beak:3, headW:44, headH:40, eyeSz:1.45, eyeSpread:1.08, muzzle:0, act:'hoot' }],
    ['Eagle',     { fur:'#f2efe6', lit:'#ffffff', dark:'#8a5a30', belly:'#f6f4ee', earType:0, beak:1, headW:38, eye:'#f0c23a', pupilType:0, muzzle:0, act:'blink' }],
    ['Parrot',    { fur:'#3fae54', lit:'#6ad07c', dark:'#25732f', belly:'#e8d24a', earType:0, beak:1, headW:34, eye:'#f6f0e0', muzzle:0, act:'peck' }],
    ['Penguin',   { fur:'#232830', lit:'#454c58', dark:'#12161c', belly:'#f4f2ec', earType:0, beak:3, headW:36, muzzle:1.5, eyeSz:0.8, act:'bob' }],
    ['Duck',      { fur:'#6f6a5a', lit:'#918b78', dark:'#464234', belly:'#d8d0b8', earType:0, beak:2, headW:34, muzzle:0, act:'peck' }],
    ['Rooster',   { fur:'#b8482c', lit:'#d86b48', dark:'#7c2c18', belly:'#e8c07c', earType:0, beak:3, comb:1, wattle:1, headW:32, muzzle:0, act:'peck' }],
    ['Toucan',    { fur:'#1e1e22', lit:'#3e3e46', dark:'#0e0e12', belly:'#f2f0e6', earType:0, beak:1, headW:34, eye:'#f0f0e0', muzzle:0, act:'peck' }],
    ['Chameleon', { fur:'#6aa83c', lit:'#8fca5e', dark:'#3f6f20', belly:'#c6e08a', earType:0, headW:38, headH:34, snout:0.4, eyeSz:1.5, eyeSpread:1.25, pupilType:0, act:'flick' }],
    ['Snake',     { fur:'#4f8a3c', lit:'#74ac5c', dark:'#2f5a22', belly:'#d2e0a0', earType:0, headW:36, headH:28, snout:0.5, pupilType:1, eyeSz:0.9, act:'flick' }],
    ['Crocodile', { fur:'#5d7a4a', lit:'#7c9c66', dark:'#38502a', belly:'#cbd2a0', earType:0, headW:38, headH:30, snout:1.1, pupilType:1, mouthType:1, act:'yawn' }],
    ['Turtle',    { fur:'#7a8f52', lit:'#9cb072', dark:'#4e5e32', belly:'#d8d8a8', earType:0, headW:34, headH:32, snout:0.5, beak:3, muzzle:0, act:'blinkslow' }],
    ['Shark',     { fur:'#7f8a94', lit:'#a3aeb8', dark:'#4e565e', belly:'#eef1f4', earType:0, headW:42, headH:34, snout:0.7, mouthType:1, eyeSz:0.7, pupilType:0, act:'blinkslow' }]
  ];

  /* ================================================================
     FISH — one parametric fish crossing the tube.

     A shape vocabulary (body form, tail, fins, pattern) plus per-
     species extras: bills, sails, lures, barbels, spines. Half the
     species swim left to right, half right to left; direction is a
     mirror on the whole scene so the art is only authored facing one
     way.
     ================================================================ */

  function F(cfg) {
    var o = {
      c1:'#f0783c', c2:'#ffd9a0', c3:'#ffffff', c4:'#f0a03c', eye:'#ffffff', pupil:'#101018',
      body:0, tail:0, pat:0, len:34, dep:20,
      dorsal:1, pect:1, pelvic:1,
      bill:0, sail:0, lure:0, barbel:0, spine:0, teeth:0, glow:0, ray:0, horse:0,
      speed:1, wig:1, dir:1
    };
    for (var k in cfg) if (cfg.hasOwnProperty(k)) o[k] = cfg[k];
    return o;
  }

  function fishShape(g, o, t, ph, sc) {
    var L = o.len, D = o.dep;
    var sw = Math.sin(t * 0.006 * o.wig + ph);         /* tail swish */
    var fl = Math.sin(t * 0.011 + ph);                 /* fin flutter */

    g.save();
    g.scale(sc, sc);

    /* tail, behind the body */
    g.save();
    g.translate(-L * 0.92, 0);
    g.rotate(sw * 0.36);
    g.fillStyle = o.c4;
    if (o.tail === 1) {                                /* forked */
      poly(g, [[0, 0], [-L * 0.6, -D * 1.1], [-L * 0.34, 0], [-L * 0.6, D * 1.1]]);
    } else if (o.tail === 2) {                         /* crescent */
      poly(g, [[0, 0], [-L * 0.55, -D * 1.15], [-L * 0.36, 0], [-L * 0.55, D * 1.15]]);
    } else if (o.tail === 3) {                         /* long flowing */
      poly(g, [[0, -D * 0.2], [-L * 0.9, -D * 1.1], [-L * 1.0, D * 0.2], [-L * 0.4, D * 0.5], [0, D * 0.2]]);
    } else if (o.tail === 4) {                         /* round */
      ell(g, -L * 0.3, 0, L * 0.38, D * 1.0);
    } else if (o.tail === 5) {                         /* whip */
      g.fillRect(-L * 1.1, -1.2, L * 1.1, 2.4);
    } else {                                           /* fan */
      poly(g, [[0, 0], [-L * 0.55, -D * 1.15], [-L * 0.55, D * 1.15]]);
    }
    g.restore();

    /* dorsal sail or fin */
    g.fillStyle = o.c4;
    if (o.sail) {
      g.beginPath();
      g.moveTo(-L * 0.7, -D * 0.5);
      g.quadraticCurveTo(0, -D * (2.4 + fl * 0.2), L * 0.55, -D * 0.5);
      g.fill();
    } else if (o.dorsal) {
      poly(g, [[-L * 0.34, -D * 0.75], [0, -D * (1.45 + fl * 0.12)], [L * 0.3, -D * 0.7]]);
    }
    if (o.pelvic) poly(g, [[-L * 0.2, D * 0.7], [0, D * (1.25 - fl * 0.12)], [L * 0.22, D * 0.66]]);

    /* body */
    var grd = g.createLinearGradient(0, -D, 0, D);
    grd.addColorStop(0, o.c1);
    grd.addColorStop(0.55, o.c1);
    grd.addColorStop(1, o.c2);
    g.fillStyle = grd;
    g.beginPath();
    if (o.body === 1) g.ellipse(0, 0, L * 0.78, D * 1.5, 0, 0, TAU);   /* disc */
    else if (o.body === 2) g.ellipse(0, 0, L, D * 0.44, 0, 0, TAU);         /* elongated */
    else if (o.body === 3) {                                       /* torpedo */
      g.beginPath();
      g.moveTo(L, 0);
      g.quadraticCurveTo(L * 0.2, -D, -L * 0.9, -D * 0.3);
      g.quadraticCurveTo(-L * 0.9, D * 0.3, L * 0.2, D);
      g.closePath(); g.fill();
    } else if (o.body === 4) {                                     /* box */
      g.fillRect(-L * 0.7, -D * 0.9, L * 1.5, D * 1.8);
    } else if (o.body === 5) ell(g, 0, 0, L * 0.85, D * 1.25);      /* puffer */
    else if (o.body === 6) {                                       /* ray */
      poly(g, [[L * 0.9, 0], [0, -D * 1.9], [-L * 0.8, 0], [0, D * 1.9]]);
    } else ell(g, 0, 0, L, D);                                     /* standard */

    g.strokeStyle = 'rgba(10,20,30,0.65)';
    g.lineWidth = 1.6;
    g.stroke();

    /* pattern */
    g.save();
    g.beginPath();
    if (o.body === 1) g.ellipse(0, 0, L * 0.78, D * 1.5, 0, 0, TAU);
    else if (o.body === 6) { g.moveTo(L*0.9,0); g.lineTo(0,-D*1.9); g.lineTo(-L*0.8,0); g.lineTo(0,D*1.9); }
    else g.ellipse(0, 0, L, D, 0, 0, TAU);
    g.clip();
    g.fillStyle = o.c3;
    var i;
    if (o.pat === 1) {                                             /* vertical bars */
      for (i = -2; i <= 2; i++) g.fillRect(i * L * 0.36 - 2.5, -D * 2, 5, D * 4);
    } else if (o.pat === 2) {                                      /* lateral stripes */
      for (i = -1; i <= 1; i++) g.fillRect(-L * 1.2, i * D * 0.5 - 2, L * 2.4, 4);
    } else if (o.pat === 3) {                                      /* spots */
      for (i = 0; i < 14; i++) {
        var a = i * 2.399;
        ell(g, Math.cos(a) * L * 0.62, Math.sin(a) * D * 0.7, 2.6, 2.6);
      }
    } else if (o.pat === 4) {                                      /* wide bands */
      g.fillRect(-L * 0.62, -D * 2, 7, D * 4);
      g.fillRect(L * 0.1, -D * 2, 8, D * 4);
    } else if (o.pat === 5) {                                      /* split tone */
      g.fillRect(-L * 1.2, -D * 2, L * 1.1, D * 4);
    } else if (o.pat === 6) {                                      /* chevrons */
      for (i = -2; i <= 2; i++) {
        poly(g, [[i * L * 0.34, -D], [i * L * 0.34 + 6, -D], [i * L * 0.34 - 3, D], [i * L * 0.34 - 9, D]]);
      }
    } else if (o.pat === 7) {                                      /* scales */
      for (i = 0; i < 22; i++) {
        var sx = -L + (i % 6) * L * 0.36, sy = -D * 0.7 + Math.floor(i / 6) * D * 0.5;
        ring(g, sx, sy, 3.4, 1, o.c3);
      }
    }
    g.restore();

    /* pectoral fin */
    if (o.pect) {
      g.fillStyle = o.c4;
      g.save(); g.translate(L * 0.12, D * 0.24); g.rotate(0.5 + fl * 0.35);
      ell(g, 0, D * 0.4, L * 0.16, D * 0.46);
      g.restore();
    }

    /* long venomous rays */
    if (o.spine) {
      g.strokeStyle = o.c4; g.lineWidth = 2;
      for (i = 0; i < 7; i++) {
        var sa = -1.9 + i * 0.42;
        g.beginPath();
        g.moveTo(Math.cos(sa) * L * 0.4, Math.sin(sa) * D * 0.6);
        g.lineTo(Math.cos(sa) * L * 1.5, Math.sin(sa) * D * 2.6 + fl * 2);
        g.stroke();
      }
    }

    /* head furniture */
    if (o.bill) {
      g.fillStyle = o.c1;
      poly(g, [[L * 0.9, -2.5], [L * (1.75 + o.bill * 0.5), 0], [L * 0.9, 2.5]]);
    }
    if (o.barbel) {
      g.strokeStyle = o.c2; g.lineWidth = 1.4;
      for (i = 0; i < 2; i++) {
        g.beginPath();
        g.moveTo(L * 0.8, D * 0.3);
        g.quadraticCurveTo(L * 1.2, D * (0.7 + i * 0.4) + fl, L * 0.6, D * (1.3 + i * 0.5));
        g.stroke();
      }
    }
    if (o.lure) {
      g.strokeStyle = o.c2; g.lineWidth = 1.6;
      g.beginPath();
      g.moveTo(L * 0.3, -D * 0.8);
      g.quadraticCurveTo(L * 1.3, -D * 2.4, L * 1.5, -D * 1.4 + fl * 2);
      g.stroke();
      g.fillStyle = 'rgba(190,255,220,0.95)';
      ell(g, L * 1.5, -D * 1.4 + fl * 2, 4.5, 4.5);
    }
    if (o.teeth) {
      g.fillStyle = '#f6f2e4';
      for (i = 0; i < 5; i++) {
        poly(g, [[L * (0.55 + i * 0.09), D * 0.12], [L * (0.6 + i * 0.09), D * 0.12],
                 [L * (0.575 + i * 0.09), D * 0.42]]);
      }
    }
    if (o.glow) {
      for (i = 0; i < 6; i++) {
        g.fillStyle = 'rgba(150,255,235,0.85)';
        ell(g, -L * 0.7 + i * L * 0.28, D * 0.62, 2, 2);
      }
    }

    /* mouth and eye */
    g.strokeStyle = 'rgba(20,14,20,0.6)'; g.lineWidth = 1.4;
    g.beginPath(); g.moveTo(L * 0.86, D * 0.16); g.lineTo(L * 0.62, D * 0.3); g.stroke();
    g.fillStyle = o.eye;
    ell(g, L * 0.58, -D * 0.24, D * 0.28, D * 0.28);
    g.fillStyle = o.pupil;
    ell(g, L * 0.61, -D * 0.24, D * 0.15, D * 0.15);
    g.fillStyle = 'rgba(255,255,255,0.9)';
    ell(g, L * 0.56, -D * 0.3, D * 0.06, D * 0.06);

    g.restore();
  }

  function drawFishScene(g, o, t) {
    /* The shared halo blurs every stripe, fin and bubble here, which
       turned the fish to mush. Outline the bodies instead. */
    g.shadowColor = 'transparent';
    g.shadowBlur = 0;
    /* a wash of water, kept translucent so the static still reads */
    g.fillStyle = 'rgba(20,90,130,0.20)';
    g.fillRect(0, 0, W, H);
    g.fillStyle = 'rgba(90,200,220,0.10)';
    for (var b = 0; b < 5; b++) {
      g.fillRect(0, ((t * 0.02 + b * 26) % 130) - 6, W, 3);
    }
    for (var q = 0; q < 9; q++) {                       /* bubbles */
      var bx = (q * 37 % 150) + 6;
      var by = 124 - ((t * 0.035 + q * 33) % 132);
      g.fillStyle = 'rgba(220,250,255,0.42)';
      ell(g, bx + Math.sin(by * 0.1 + q) * 3, by, 1.6 + (q % 3), 1.6 + (q % 3));
    }

    g.save();
    if (o.dir < 0) { g.translate(W, 0); g.scale(-1, 1); }

    var lanes = [[0.62, 60, 1.55, 0.85], [0.42, 24, 0.5, 1.6], [0.78, 100, 0.42, 1.15]];
    for (var i = 0; i < 3; i++) {
      var span = W + o.len * 3;
      var x = ((t * 0.028 * o.speed * lanes[i][3] + i * 71) % span) - o.len * 1.5;
      var y = lanes[i][1] + Math.sin(t * 0.002 + i * 2) * 5;
      g.save();
      g.translate(x, y);
      g.rotate(Math.sin(t * 0.003 + i) * 0.08);
      fishShape(g, o, t, i * 1.7, lanes[i][2]);
      g.restore();
    }
    g.restore();
  }

  /* First 25 swim left to right, last 25 right to left. */
  var FISH = [
    ['Clownfish',    { c1:'#ff7a1e', c2:'#ffb96e', c3:'#fdf6ea', c4:'#1c1c22', pat:4, tail:4, len:28, dep:17 }],
    ['Blue tang',    { c1:'#1f6fe0', c2:'#5aa2f4', c3:'#ffd93c', c4:'#ffd93c', body:1, pat:5, tail:2, len:28, dep:16 }],
    ['Angelfish',    { c1:'#f4d43c', c2:'#fff0a8', c3:'#1e1e26', c4:'#f4d43c', body:1, pat:1, tail:3, len:26, dep:16 }],
    ['Butterflyfish',{ c1:'#ffd23c', c2:'#fff2b0', c3:'#f0f4f8', c4:'#1a1a22', body:1, pat:1, tail:0, len:26, dep:15 }],
    ['Parrotfish',   { c1:'#20c0a8', c2:'#7ef0d8', c3:'#ff6fb0', c4:'#ff6fb0', pat:7, tail:2, len:34, dep:19 }],
    ['Triggerfish',  { c1:'#2a3a68', c2:'#5d76b8', c3:'#ffd03c', c4:'#ffd03c', body:1, pat:6, tail:1, len:28, dep:17 }],
    ['Lionfish',     { c1:'#d8322c', c2:'#ffb0a0', c3:'#fdf4ea', c4:'#f0684c', pat:1, tail:0, spine:1, len:26, dep:15 }],
    ['Pufferfish',   { c1:'#f0c23c', c2:'#fff0b8', c3:'#3a2a10', c4:'#e0a828', body:5, pat:3, tail:4, len:24, dep:19 }],
    ['Boxfish',      { c1:'#ffd430', c2:'#ffe98a', c3:'#1c1c24', c4:'#ffb020', body:4, pat:3, tail:0, len:22, dep:15 }],
    ['Mandarinfish', { c1:'#1a58c8', c2:'#3f8ef0', c3:'#ff9020', c4:'#20d0a0', pat:6, tail:4, len:26, dep:16 }],
    ['Discus',       { c1:'#e8622c', c2:'#ffb474', c3:'#2a4a9a', c4:'#e8622c', body:1, pat:2, tail:0, len:26, dep:16 }],
    ['Betta',        { c1:'#8a2ce0', c2:'#c878ff', c3:'#ff3f88', c4:'#ff3f88', pat:5, tail:3, len:24, dep:15 }],
    ['Guppy',        { c1:'#20b0e0', c2:'#8ce4ff', c3:'#ffb020', c4:'#ff7ad0', pat:3, tail:3, len:18, dep:11 }],
    ['Neon tetra',   { c1:'#20d8f0', c2:'#bff4ff', c3:'#f02040', c4:'#a0e8ff', pat:2, tail:1, len:18, dep:10 }],
    ['Goldfish',     { c1:'#ff9420', c2:'#ffd08a', c3:'#fff0c8', c4:'#ffb040', pat:0, tail:3, len:26, dep:16 }],
    ['Koi',          { c1:'#fdf6ea', c2:'#ffffff', c3:'#f0602c', c4:'#ffd0a8', pat:3, tail:3, len:32, dep:17 }],
    ['Swordtail',    { c1:'#f0503c', c2:'#ff9a84', c3:'#ffd03c', c4:'#f0503c', pat:2, tail:5, len:24, dep:13 }],
    ['Molly',        { c1:'#2c2c38', c2:'#5e5e70', c3:'#ffd03c', c4:'#3a3a48', pat:0, tail:0, len:24, dep:14 }],
    ['Rainbowfish',  { c1:'#20c8e0', c2:'#ffe040', c3:'#ff4090', c4:'#7ce860', pat:2, tail:1, len:26, dep:15 }],
    ['Cardinalfish', { c1:'#e02840', c2:'#ff8090', c3:'#1c1c24', c4:'#ff6070', pat:1, tail:1, len:22, dep:13 }],
    ['Damselfish',   { c1:'#2a50e0', c2:'#7c98ff', c3:'#ffe850', c4:'#2a50e0', pat:5, tail:1, len:20, dep:13 }],
    ['Wrasse',       { c1:'#30c060', c2:'#8ce8a8', c3:'#ff50a0', c4:'#ffd040', pat:2, tail:0, len:28, dep:14 }],
    ['Grouper',      { c1:'#7a5a8a', c2:'#b494c0', c3:'#ffe0a0', c4:'#6a4a78', pat:3, tail:4, len:36, dep:21 }],
    ['Snapper',      { c1:'#f04060', c2:'#ff98a8', c3:'#ffd8b0', c4:'#e03050', pat:0, tail:1, len:32, dep:17 }],
    ['Barracuda',    { c1:'#b8c4cc', c2:'#e8eef2', c3:'#5a6a76', c4:'#98a6b0', body:2, pat:2, tail:1, teeth:1, len:44, dep:16 }],

    ['Tuna',         { c1:'#2a6a9a', c2:'#cfe0ea', c3:'#7ac0e0', c4:'#f0d040', body:3, pat:0, tail:2, len:38, dep:18 }],
    ['Mackerel',     { c1:'#2e8a6a', c2:'#dfeee8', c3:'#12303a', c4:'#8ac0a8', body:3, pat:6, tail:2, len:34, dep:15 }],
    ['Sardine',      { c1:'#a8bcc8', c2:'#eef4f8', c3:'#6a8a9a', c4:'#c8d8e2', body:2, pat:2, tail:1, len:22, dep:9 }],
    ['Flying fish',  { c1:'#3a7ad0', c2:'#cfe4ff', c3:'#8ec4ff', c4:'#8ec4ff', body:2, pat:0, tail:1, spine:1, len:30, dep:12 }],
    ['Marlin',       { c1:'#1e4a9a', c2:'#a8c8f0', c3:'#4a90e0', c4:'#1e4a9a', body:3, pat:1, tail:2, bill:1, sail:1, len:38, dep:16 }],
    ['Sailfish',     { c1:'#2a5ab0', c2:'#b8d4f4', c3:'#6aa8e8', c4:'#2a5ab0', body:3, pat:3, tail:2, bill:1, sail:1, len:40, dep:15 }],
    ['Swordfish',    { c1:'#3a4a5a', c2:'#c8d4de', c3:'#7a8a9a', c4:'#3a4a5a', body:3, pat:0, tail:2, bill:2, len:40, dep:15 }],
    ['Anglerfish',   { c1:'#3a2a4a', c2:'#6a4a70', c3:'#a878c0', c4:'#2a1a38', body:5, pat:0, tail:4, lure:1, teeth:1, len:26, dep:18 }],
    ['Lanternfish',  { c1:'#2a2a4a', c2:'#4a4a70', c3:'#7ce8d0', c4:'#3a3a58', body:2, pat:0, tail:1, glow:1, len:26, dep:11 }],
    ['Hatchetfish',  { c1:'#cfd8e0', c2:'#f4f8fa', c3:'#8a98a4', c4:'#b0bcc6', body:1, pat:0, tail:1, glow:1, len:20, dep:14 }],
    ['Viperfish',    { c1:'#1e2a3a', c2:'#3e5062', c3:'#60e0c0', c4:'#2a3a4a', body:2, pat:0, tail:1, teeth:1, glow:1, len:40, dep:11 }],
    ['Moray eel',    { c1:'#5a7a3a', c2:'#a8c880', c3:'#e8e0a0', c4:'#4a6a2a', body:2, pat:3, tail:5, teeth:1, len:48, dep:11, wig:1.6 }],
    ['Ribbon eel',   { c1:'#1a50e0', c2:'#6a90ff', c3:'#ffe040', c4:'#ffe040', body:2, pat:0, tail:5, len:46, dep:8, wig:1.8 }],
    ['Trumpetfish',  { c1:'#c8a83c', c2:'#e8d48a', c3:'#8a6a20', c4:'#c8a83c', body:2, pat:2, tail:0, bill:1, len:44, dep:8 }],
    ['Needlefish',   { c1:'#9ec4d8', c2:'#e4f2f8', c3:'#5a8a9a', c4:'#9ec4d8', body:2, pat:0, tail:1, bill:2, len:46, dep:7 }],
    ['Sunfish',      { c1:'#8a94a0', c2:'#c8d0d8', c3:'#6a7480', c4:'#7a848e', body:1, pat:3, tail:4, dorsal:1, len:30, dep:22 }],
    ['Flounder',     { c1:'#a08a58', c2:'#d8c898', c3:'#5a4a28', c4:'#a08a58', body:6, pat:3, tail:4, dorsal:0, pelvic:0, len:28, dep:14 }],
    ['Manta ray',    { c1:'#2a3a4a', c2:'#e8eef2', c3:'#4a5a6a', c4:'#2a3a4a', body:6, pat:0, tail:5, dorsal:0, pelvic:0, pect:0, len:34, dep:20 }],
    ['Stingray',     { c1:'#8a7250', c2:'#d0bc90', c3:'#5a4830', c4:'#8a7250', body:6, pat:3, tail:5, dorsal:0, pelvic:0, pect:0, len:30, dep:18 }],
    ['Sturgeon',     { c1:'#6a7a6a', c2:'#adbcac', c3:'#48583f', c4:'#5a6a5a', body:2, pat:7, tail:1, barbel:1, len:42, dep:12 }],
    ['Catfish',      { c1:'#4a4038', c2:'#8a7c6c', c3:'#2a2420', c4:'#3a3028', body:2, pat:0, tail:0, barbel:1, len:38, dep:14 }],
    ['Piranha',      { c1:'#8a8a94', c2:'#f0a03c', c3:'#d02828', c4:'#7a7a84', body:1, pat:3, tail:1, teeth:1, len:24, dep:16 }],
    ['Archerfish',   { c1:'#dfe4e8', c2:'#f8fafc', c3:'#2a2a32', c4:'#c8d0d6', pat:1, tail:1, len:26, dep:14 }],
    ['Surgeonfish',  { c1:'#7a3ce0', c2:'#b088ff', c3:'#ffd83c', c4:'#ffd83c', body:1, pat:5, tail:2, len:28, dep:16 }],
    ['Oscar',        { c1:'#2a2620', c2:'#5a5044', c3:'#f07020', c4:'#3a342c', body:1, pat:3, tail:4, len:30, dep:19 }]
  ];

  /* ================================================================
     MISCELLANY — 100 scenes on themes not used elsewhere on the set.
     ================================================================ */

  var MISC = [
    ['Pizza spinning', function (g, t) {
      g.save(); g.translate(80, 60); g.rotate(t * 0.003);
      g.fillStyle = '#e8c069'; ell(g, 0, 0, 44, 40);
      g.fillStyle = '#d8302a'; ell(g, 0, 0, 37, 33);
      g.fillStyle = '#f0e0a8'; ell(g, 0, 0, 34, 30);
      g.fillStyle = '#c8202a';
      for (var i = 0; i < 8; i++) { var a = i * TAU / 8;
        ell(g, Math.cos(a) * 20, Math.sin(a) * 17, 5, 4.5); }
      g.fillStyle = '#7aa83c';
      for (var j = 0; j < 6; j++) { var b = j * TAU / 6 + 0.4;
        ell(g, Math.cos(b) * 11, Math.sin(b) * 9, 2.6, 2.2); }
      g.restore(); }],

    ['Coffee pouring', function (g, t) {
      var c = (t % 4000) / 4000;
      g.fillStyle = '#c8c2b8'; g.fillRect(48, 62, 46, 34);
      ring(g, 100, 78, 9, 4, '#c8c2b8');
      g.fillStyle = '#3a2418';
      var lv = Math.min(28, c * 40);
      g.fillRect(50, 94 - lv, 42, lv);
      if (c < 0.7) { g.fillStyle = '#4a2e1c'; g.fillRect(76, 20, 5, 42 - 0); }
      g.fillStyle = '#8a6a4a'; g.fillRect(58, 8, 44, 14);
      poly(g, [[60, 22], [100, 22], [82, 34], [78, 34]]);
      for (var s = 0; s < 4; s++) { g.fillStyle = 'rgba(230,225,215,' + (0.3 - s * 0.06) + ')';
        ell(g, 66 + Math.sin(t * 0.004 + s) * 5, 60 - s * 9 - c * 6, 5 + s, 4 + s); } }],

    ['Toast popping', function (g, t) {
      var c = (t % 3400) / 3400;
      var pop = c > 0.72 ? Math.sin((c - 0.72) / 0.28 * Math.PI) * 46 : 0;
      g.fillStyle = '#c86f3a';
      g.fillRect(52 - 0, 62 - pop, 24, 30); g.fillRect(84, 66 - pop, 24, 30);
      g.fillStyle = '#a8552a'; g.fillRect(55, 65 - pop, 18, 4);
      g.fillStyle = '#c0c6cc'; g.fillRect(42, 74, 76, 34);
      g.fillStyle = '#9aa0a6'; g.fillRect(42, 74, 76, 5);
      g.fillStyle = '#2a2a30'; g.fillRect(50, 78, 22, 5); g.fillRect(82, 78, 22, 5);
      g.fillStyle = c > 0.7 ? '#f04a30' : '#6a6a70'; ell(g, 112, 92, 4, 4); }],

    ['Egg frying', function (g, t) {
      g.fillStyle = '#3a3a40'; ell(g, 76, 68, 46, 32);
      g.fillStyle = '#2a2a30'; ell(g, 76, 66, 42, 28);
      g.fillRect(118, 62, 34, 8);
      g.fillStyle = '#f6f2e6';
      ell(g, 72, 66, 26 + Math.sin(t * 0.004) * 1.5, 18 + Math.cos(t * 0.005));
      g.fillStyle = '#f0b020'; ell(g, 70, 64, 9, 8);
      g.fillStyle = '#f8c848'; ell(g, 68, 62, 4, 3.4);
      for (var i = 0; i < 5; i++) { g.fillStyle = 'rgba(250,250,245,' + (0.22 - i * 0.04) + ')';
        ell(g, 70 + Math.sin(t * 0.005 + i) * 8, 46 - i * 8, 6 + i, 4 + i); } }],

    ['Birthday cake', function (g, t) {
      g.fillStyle = '#f2d0dc'; g.fillRect(38, 62, 84, 34);
      g.fillStyle = '#e0a0b8'; g.fillRect(38, 62, 84, 7);
      g.fillStyle = '#c87a98'; g.fillRect(38, 92, 84, 8);
      for (var i = 0; i < 5; i++) {
        var cx = 48 + i * 17;
        g.fillStyle = i % 2 ? '#6ac0e8' : '#f6f0e0'; g.fillRect(cx - 2.5, 42, 5, 20);
        var f = Math.sin(t * 0.02 + i) * 2;
        g.fillStyle = 'rgba(255,170,40,0.95)';
        poly(g, [[cx - 3.5, 42], [cx, 28 + f], [cx + 3.5, 42]]);
        g.fillStyle = 'rgba(255,244,190,0.95)';
        poly(g, [[cx - 1.6, 41], [cx, 34 + f], [cx + 1.6, 41]]); } }],

    ['Noodle bowl', function (g, t) {
      g.fillStyle = '#d8402e'; ell(g, 80, 84, 44, 22);
      g.fillStyle = '#f2f0e2'; ell(g, 80, 78, 40, 14);
      g.fillStyle = '#e8c860';
      var lift = Math.abs(Math.sin(t * 0.0022)) * 34;
      for (var i = 0; i < 5; i++) {
        g.beginPath(); g.moveTo(70 + i * 5, 78);
        g.quadraticCurveTo(74 + i * 5, 60 - lift, 84 + i * 3, 44 - lift);
        g.strokeStyle = '#e8c860'; g.lineWidth = 3; g.stroke(); }
      g.fillStyle = '#a8a8b0';
      g.save(); g.translate(96, 44 - lift); g.rotate(0.4);
      g.fillRect(0, -30, 3, 40); g.fillRect(6, -30, 3, 40); g.restore();
      for (var s = 0; s < 4; s++) { g.fillStyle = 'rgba(240,240,235,' + (0.24 - s * 0.05) + ')';
        ell(g, 66 + Math.sin(t * 0.004 + s) * 6, 62 - s * 10, 6 + s, 4 + s); } }],

    ['Melting ice cream', function (g, t) {
      var m = (t % 6000) / 6000;
      g.fillStyle = '#d8a058';
      poly(g, [[66, 62], [94, 62], [80, 112]]);
      g.fillStyle = '#c08840';
      for (var i = 0; i < 4; i++) seg(g, 68 + i * 4, 66 + i * 6, 90 - i * 4, 66 + i * 6, 1.2, '#c08840');
      g.fillStyle = '#f6a8c0'; ell(g, 80, 52 - m * 4, 20 - m * 3, 18 - m * 3);
      g.fillStyle = '#fbd0dc'; ell(g, 74, 46 - m * 4, 7, 6);
      g.fillStyle = '#f6a8c0';
      for (var d = 0; d < 3; d++) {
        var dy = 62 + ((m * 60 + d * 20) % 52);
        ell(g, 68 + d * 12, dy, 3.4, 4.6); } }],

    ['Popcorn', function (g, t) {
      g.fillStyle = '#e83a2e'; g.fillRect(50, 62, 60, 46);
      g.fillStyle = '#f6f2e8';
      for (var i = 0; i < 5; i++) g.fillRect(52 + i * 12, 62, 5, 46);
      for (var p = 0; p < 12; p++) {
        var ph = (t * 0.004 + p * 0.7) % 1;
        var px = 56 + (p * 13 % 52);
        var py = 62 - Math.sin(ph * Math.PI) * 46;
        g.fillStyle = '#f8f0d0';
        ell(g, px, py, 4.5, 4);
        ell(g, px + 3, py - 2, 3, 2.6); ell(g, px - 3, py + 2, 3, 2.6); } }],

    ['Cocktail shaker', function (g, t) {
      var sh = Math.sin(t * 0.02) * 5;
      g.save(); g.translate(80 + sh, 58 + Math.abs(sh) * 0.3); g.rotate(sh * 0.03);
      g.fillStyle = '#c8ccd2'; poly(g, [[-16, -30], [16, -30], [12, 28], [-12, 28]]);
      g.fillStyle = '#e2e6ea'; poly(g, [[-13, -30], [-4, -30], [-6, 28], [-10, 28]]);
      g.fillStyle = '#a8aeb4'; g.fillRect(-18, -38, 36, 9);
      g.restore();
      for (var i = 0; i < 6; i++) { g.fillStyle = 'rgba(160,230,255,0.6)';
        ell(g, 60 + (i * 17 % 44) + sh, 100 - ((t * 0.05 + i * 14) % 40), 2.4, 2.4); } }],

    ['Glazed donut', function (g, t) {
      g.save(); g.translate(80, 60); g.rotate(t * 0.0012);
      g.fillStyle = '#c88a48'; ell(g, 0, 0, 40, 36);
      g.fillStyle = '#f078a8'; ell(g, 0, -3, 37, 32);
      g.fillStyle = '#c88a48'; ell(g, 0, 0, 13, 11);
      var cols = ['#ffe040', '#4fd0e8', '#8aea60', '#ff6ab0', '#ffffff'];
      for (var i = 0; i < 16; i++) { var a = i * 2.399;
        g.save(); g.translate(Math.cos(a) * 24, Math.sin(a) * 21); g.rotate(a);
        g.fillStyle = cols[i % 5]; g.fillRect(-3.5, -1.2, 7, 2.4); g.restore(); }
      g.restore(); }],

    ['Cheese fondue', function (g, t) {
      g.fillStyle = '#2a2a32'; ell(g, 80, 80, 40, 24);
      g.fillStyle = '#f0c848'; ell(g, 80, 76, 35, 18);
      for (var i = 0; i < 5; i++) { g.fillStyle = 'rgba(250,220,120,0.9)';
        ell(g, 60 + i * 10, 72 + Math.sin(t * 0.006 + i) * 3, 6, 3.4); }
      var dip = Math.sin(t * 0.0022) * 16;
      g.strokeStyle = '#c8c8d0'; g.lineWidth = 2.4;
      g.beginPath(); g.moveTo(96, 24); g.lineTo(88, 62 + dip); g.stroke();
      g.fillStyle = '#e8c078'; ell(g, 88, 64 + dip, 6, 5);
      for (var f = 0; f < 3; f++) { g.fillStyle = 'rgba(255,190,60,0.6)';
        ell(g, 70 + f * 8, 96 + f * 3, 5, 3); } }],

    ['Hot dog', function (g, t) {
      g.fillStyle = '#d8a860'; ell(g, 80, 74, 52, 16);
      g.fillStyle = '#e8bc78'; ell(g, 80, 70, 50, 12);
      g.fillStyle = '#b8503a'; ell(g, 80, 68, 46, 9);
      g.strokeStyle = '#f0d030'; g.lineWidth = 4;
      g.beginPath();
      for (var i = 0; i <= 40; i++) {
        var x = 38 + i * 2.1;
        var y = 66 + Math.sin(i * 0.55 + t * 0.004) * 5;
        if (i) g.lineTo(x, y); else g.moveTo(x, y); }
      g.stroke();
      g.fillStyle = '#7aa83c';
      for (var j = 0; j < 8; j++) ell(g, 44 + j * 10, 62 + (j % 2) * 4, 2.4, 1.8); }],

    ['Rainstorm', function (g, t) {
      g.fillStyle = 'rgba(40,52,70,0.4)'; g.fillRect(0, 0, W, H);
      g.fillStyle = '#4a5468';
      for (var c = 0; c < 4; c++) ell(g, 26 + c * 36, 22 + (c % 2) * 6, 20, 12);
      g.strokeStyle = 'rgba(150,200,255,0.8)'; g.lineWidth = 1.4;
      for (var i = 0; i < 40; i++) {
        var x = (i * 37 % 160), y = ((t * 0.28 + i * 23) % 130);
        g.beginPath(); g.moveTo(x, y); g.lineTo(x - 2, y + 9); g.stroke(); }
      g.fillStyle = 'rgba(120,180,230,0.5)';
      for (var p = 0; p < 8; p++) ell(g, 12 + p * 20, 116, 5 + (p % 3), 1.6); }],

    ['Snowfall', function (g, t) {
      g.fillStyle = 'rgba(60,72,96,0.35)'; g.fillRect(0, 0, W, H);
      for (var i = 0; i < 46; i++) {
        var x = (i * 41 % 160) + Math.sin(t * 0.001 + i) * 7;
        var y = ((t * 0.045 + i * 19) % 132);
        var r = 1.2 + (i % 3) * 0.8;
        g.fillStyle = 'rgba(245,250,255,' + (0.5 + (i % 3) * 0.18) + ')';
        ell(g, x, y, r, r); }
      g.fillStyle = 'rgba(240,246,252,0.9)';
      ell(g, 80, 122, 90, 14); }],

    ['Lightning storm', function (g, t) {
      var f = (t % 2600) < 120 ? 1 : ((t % 2600) < 200 ? 0.45 : 0);
      if (f) { g.fillStyle = 'rgba(210,225,255,' + (f * 0.5) + ')'; g.fillRect(0, 0, W, H); }
      g.fillStyle = '#3a4256';
      for (var c = 0; c < 5; c++) ell(g, 18 + c * 32, 26 + (c % 2) * 8, 22, 13);
      if (f) { g.strokeStyle = 'rgba(240,248,255,0.95)'; g.lineWidth = 2.6;
        g.beginPath(); g.moveTo(72, 36); g.lineTo(62, 60); g.lineTo(76, 66);
        g.lineTo(60, 100); g.stroke(); }
      g.fillStyle = 'rgba(30,40,60,0.55)'; g.fillRect(0, 104, W, 16); }],

    ['Tornado', function (g, t) {
      g.fillStyle = 'rgba(70,66,58,0.35)'; g.fillRect(0, 0, W, H);
      for (var i = 0; i < 18; i++) {
        var f = i / 18;
        var w = 6 + f * 34;
        var y = 108 - f * 92;
        var x = 80 + Math.sin(t * 0.004 + f * 5) * (4 + f * 12);
        g.fillStyle = 'rgba(120,112,98,' + (0.35 + f * 0.35) + ')';
        ell(g, x, y, w, 4.5); }
      g.fillStyle = 'rgba(60,54,46,0.6)'; g.fillRect(0, 106, W, 14);
      for (var d = 0; d < 6; d++) { g.fillStyle = 'rgba(90,84,74,0.8)';
        var a = t * 0.006 + d;
        ell(g, 80 + Math.cos(a) * (20 + d * 4), 96 - d * 6, 3, 2.4); } }],

    ['Rainbow', function (g, t) {
      var cols = ['#e8402c', '#f08a20', '#f0d030', '#4fb04a', '#3a7ad8', '#6a3fc0'];
      for (var i = 0; i < 6; i++) {
        g.strokeStyle = cols[i]; g.lineWidth = 7;
        g.beginPath(); g.arc(80, 118, 72 - i * 7, Math.PI, TAU); g.stroke(); }
      g.fillStyle = 'rgba(250,250,255,0.9)';
      for (var c = 0; c < 3; c++) {
        var x = 24 + c * 56 + Math.sin(t * 0.0009 + c) * 6;
        ell(g, x, 32, 14, 8); ell(g, x + 10, 34, 10, 6); } }],

    ['Rolling fog', function (g, t) {
      g.fillStyle = 'rgba(90,96,104,0.3)'; g.fillRect(0, 0, W, H);
      g.fillStyle = '#4a5058';
      poly(g, [[0, 120], [30, 74], [58, 120]]);
      poly(g, [[52, 120], [88, 62], [124, 120]]);
      for (var i = 0; i < 7; i++) {
        var y = 58 + i * 9;
        var x = ((t * 0.03 * (1 + i * 0.2) + i * 40) % 220) - 40;
        g.fillStyle = 'rgba(226,232,238,' + (0.14 + i * 0.03) + ')';
        ell(g, x, y, 52, 8); ell(g, x + 40, y + 3, 40, 7); } }],

    ['Hailstones', function (g, t) {
      g.fillStyle = 'rgba(52,60,74,0.4)'; g.fillRect(0, 0, W, H);
      g.fillStyle = '#39415a';
      for (var c = 0; c < 4; c++) ell(g, 22 + c * 38, 20, 21, 11);
      for (var i = 0; i < 22; i++) {
        var x = (i * 53 % 158), y = ((t * 0.2 + i * 31) % 128);
        var r = 2.2 + (i % 3);
        g.fillStyle = 'rgba(226,244,255,0.95)';
        ell(g, x, y, r, r);
        g.fillStyle = 'rgba(255,255,255,0.7)';
        ell(g, x - r * 0.3, y - r * 0.3, r * 0.3, r * 0.3); } }],

    ['Wind', function (g, t) {
      g.strokeStyle = 'rgba(210,230,240,0.5)'; g.lineWidth = 2;
      for (var i = 0; i < 7; i++) {
        var y = 16 + i * 14;
        var x0 = ((t * 0.09 + i * 30) % 240) - 80;
        g.beginPath();
        g.moveTo(x0, y);
        g.quadraticCurveTo(x0 + 26, y - 7, x0 + 52, y);
        g.quadraticCurveTo(x0 + 74, y + 6, x0 + 92, y);
        g.stroke(); }
      for (var l = 0; l < 6; l++) {
        var lx = ((t * 0.13 + l * 44) % 220) - 30;
        var ly = 40 + Math.sin(t * 0.006 + l) * 26;
        g.save(); g.translate(lx, ly); g.rotate(t * 0.01 + l);
        g.fillStyle = l % 2 ? '#c87a2a' : '#a8622a';
        ell(g, 0, 0, 6, 3.4); g.restore(); } }],

    ['Aurora', function (g, t) {
      g.fillStyle = 'rgba(10,14,32,0.55)'; g.fillRect(0, 0, W, H);
      for (var k = 0; k < 24; k++) {
        var x = k * 7;
        var h = 34 + Math.sin(t * 0.002 + k * 0.5) * 22 + Math.sin(t * 0.004 + k) * 10;
        var grd = g.createLinearGradient(0, 18, 0, 18 + h);
        grd.addColorStop(0, 'rgba(80,255,180,0.05)');
        grd.addColorStop(0.5, 'rgba(90,240,190,0.5)');
        grd.addColorStop(1, 'rgba(150,90,240,0.08)');
        g.fillStyle = grd;
        g.fillRect(x, 18, 7, h); }
      for (var s = 0; s < 16; s++) { g.fillStyle = 'rgba(255,255,255,0.7)';
        ell(g, (s * 61 % 156) + 3, (s * 29 % 40) + 4, 1.2, 1.2); }
      g.fillStyle = '#12161f'; poly(g, [[0, 120], [40, 92], [80, 112], [120, 88], [160, 120]]); }],

    ['Sunrise', function (g, t) {
      var c = (t % 9000) / 9000;
      var sy = 108 - c * 58;
      var grd = g.createLinearGradient(0, 0, 0, 120);
      grd.addColorStop(0, 'rgba(40,60,120,0.5)');
      grd.addColorStop(0.6, 'rgba(240,140,60,0.45)');
      grd.addColorStop(1, 'rgba(250,200,90,0.5)');
      g.fillStyle = grd; g.fillRect(0, 0, W, H);
      g.fillStyle = 'rgba(255,220,120,0.35)'; ell(g, 80, sy, 34, 34);
      g.fillStyle = '#ffd85a'; ell(g, 80, sy, 20, 20);
      g.fillStyle = 'rgba(60,40,30,0.75)'; g.fillRect(0, 108, W, 12);
      for (var i = 0; i < 4; i++) { g.fillStyle = 'rgba(90,60,45,0.6)';
        ell(g, 20 + i * 42, 108, 16, 7); } }],

    ['Typewriter', function (g, t) {
      g.fillStyle = '#3a3a42'; g.fillRect(30, 60, 100, 40);
      g.fillStyle = '#2a2a30'; g.fillRect(30, 60, 100, 6);
      g.fillStyle = '#f4f0e4';
      var pg = ((t * 0.01) % 20);
      g.fillRect(56, 18 + pg, 48, 44);
      g.fillStyle = '#5a5a64'; g.fillRect(46, 56, 68, 8);
      var k = Math.floor(t / 160) % 10;
      for (var i = 0; i < 10; i++) {
        g.fillStyle = i === k ? '#f0e0a0' : '#c8c8d0';
        ell(g, 40 + i * 9.5, 88 + (i === k ? 2 : 0), 3.6, 3.2); }
      g.fillStyle = '#20202a';
      for (var r = 0; r < 3; r++) g.fillRect(60, 26 + r * 7 + pg, 8 + ((t / 200 + r) % 5) * 6, 2); }],

    ['Clock gears', function (g, t) {
      var specs = [[52, 56, 22, 10, 1], [104, 50, 16, 8, -1.4], [86, 88, 13, 7, 1.8]];
      var cols = ['#c8a44a', '#a8b8c8', '#c88a5a'];
      for (var i = 0; i < 3; i++) {
        var s = specs[i];
        g.save(); g.translate(s[0], s[1]); g.rotate(t * 0.0015 * s[4]);
        g.fillStyle = cols[i];
        for (var k = 0; k < s[3]; k++) { var a = k * TAU / s[3];
          g.save(); g.rotate(a); g.fillRect(-3.5, -s[2] - 5, 7, 8); g.restore(); }
        ell(g, 0, 0, s[2], s[2]);
        g.fillStyle = '#2a2a32'; ell(g, 0, 0, s[2] * 0.32, s[2] * 0.32);
        g.restore(); } }],

    ['Washing machine', function (g, t) {
      g.fillStyle = '#dfe3e8'; g.fillRect(30, 22, 100, 92);
      g.fillStyle = '#c2c8ce'; g.fillRect(30, 22, 100, 14);
      g.fillStyle = '#8a9098'; ell(g, 80, 72, 34, 34);
      g.fillStyle = '#4a90c0'; ell(g, 80, 72, 29, 29);
      g.save(); g.translate(80, 72); g.rotate(t * 0.006);
      for (var i = 0; i < 5; i++) { var a = i * TAU / 5;
        g.fillStyle = ['#f04a6a', '#f0d040', '#4fd08a', '#e8e4d8', '#8a6ae0'][i];
        ell(g, Math.cos(a) * 15, Math.sin(a) * 15, 6, 5); }
      g.restore();
      g.fillStyle = 'rgba(255,255,255,0.28)'; ell(g, 70, 62, 9, 6, -0.6);
      g.fillStyle = Math.floor(t / 400) % 2 ? '#4fe07a' : '#2a5a3a'; ell(g, 116, 30, 3.4, 3.4); }],
    ['Blender', function (g, t) {
      g.fillStyle = '#c8ccd2'; g.fillRect(52, 84, 56, 26);
      g.fillStyle = '#9aa0a8'; g.fillRect(52, 84, 56, 6);
      g.fillStyle = 'rgba(190,220,235,0.55)'; g.fillRect(56, 26, 48, 58);
      g.fillStyle = '#c04a8a';
      g.save(); g.beginPath(); g.rect(56, 26, 48, 58); g.clip();
      for (var i = 0; i < 14; i++) {
        var a = t * 0.02 + i * 0.9;
        ell(g, 80 + Math.cos(a) * (6 + (i % 5) * 5), 62 + Math.sin(a * 1.3) * 18, 5, 4); }
      g.restore();
      g.save(); g.translate(80, 80); g.rotate(t * 0.05);
      g.fillStyle = '#a8aeb6'; g.fillRect(-14, -1.6, 28, 3.2); g.fillRect(-1.6, -10, 3.2, 20);
      g.restore();
      g.fillStyle = Math.floor(t / 200) % 2 ? '#f04a30' : '#5a2a24'; ell(g, 100, 96, 3.4, 3.4); }],

    ['Sewing machine', function (g, t) {
      g.fillStyle = '#2a4a6a'; g.fillRect(28, 40, 24, 46);
      g.fillRect(28, 34, 92, 14); g.fillStyle = '#1e3a54'; g.fillRect(96, 46, 20, 22);
      g.fillStyle = '#8a6a48'; g.fillRect(20, 86, 120, 12);
      var nd = Math.abs(Math.sin(t * 0.02)) * 12;
      g.fillStyle = '#c8ccd2'; g.fillRect(104, 66 + nd, 3, 20);
      g.fillStyle = '#f2f0e6'; g.fillRect(60, 78, 74, 10);
      g.strokeStyle = '#e0405a'; g.lineWidth = 1.4;
      g.beginPath();
      for (var i = 0; i < 12; i++) { var x = 62 + i * 5;
        g.moveTo(x, 82); g.lineTo(x + 3, 82); }
      g.stroke();
      g.fillStyle = '#e0405a'; ell(g, 40, 30, 6, 8); }],

    ['Cash register', function (g, t) {
      var c = (t % 3000) / 3000;
      var drw = c > 0.7 ? (c - 0.7) / 0.3 * 22 : 0;
      g.fillStyle = '#4a4a56'; g.fillRect(38, 52, 84, 56);
      g.fillStyle = '#6a6a78'; g.fillRect(38, 52, 84, 8);
      g.fillStyle = '#2a2a34'; g.fillRect(46, 62, 68, 18);
      g.fillStyle = '#5ae08a'; g.font = 'bold 12px monospace'; g.textAlign = 'right';
      g.textBaseline = 'middle';
      g.fillText('$' + (((Math.floor(t / 300) * 37) % 900) / 100).toFixed(2), 110, 71);
      g.fillStyle = '#8a8a98'; g.fillRect(44 + drw, 88, 72, 16);
      for (var i = 0; i < 9; i++) { g.fillStyle = '#c8c8d2';
        ell(g, 50 + (i % 3) * 10, 88 + Math.floor(i / 3) * 6, 3, 2.4); } }],

    ['Jukebox', function (g, t) {
      g.fillStyle = '#8a2a3a'; g.fillRect(36, 18, 88, 96);
      g.beginPath(); g.ellipse(80, 24, 44, 20, 0, Math.PI, TAU); g.fill();
      var cols = ['#f0d040', '#4fd0e8', '#f04a8a', '#7ce860'];
      for (var i = 0; i < 4; i++) {
        g.fillStyle = Math.floor(t / 260 + i) % 4 === 0 ? '#ffffff' : cols[i];
        g.fillRect(40, 22 + i * 5, 80, 3); }
      g.fillStyle = '#2a1a20'; g.fillRect(48, 44, 64, 34);
      g.save(); g.translate(80, 61); g.rotate(t * 0.004);
      g.fillStyle = '#14141a'; ell(g, 0, 0, 15, 15);
      g.fillStyle = '#e8b040'; ell(g, 0, 0, 5, 5);
      g.restore();
      for (var k = 0; k < 8; k++) { g.fillStyle = '#d8d0c0';
        g.fillRect(44 + k * 9, 88, 6, 12); } }],

    ['Film projector', function (g, t) {
      g.fillStyle = '#3a3a44'; g.fillRect(20, 62, 60, 30);
      for (var r = 0; r < 2; r++) {
        g.save(); g.translate(34 + r * 34, 48); g.rotate(t * 0.006 * (r ? -1 : 1));
        g.fillStyle = '#5a5a66'; ell(g, 0, 0, 16, 16);
        g.fillStyle = '#2a2a32'; ell(g, 0, 0, 5, 5);
        for (var k = 0; k < 6; k++) { var a = k * TAU / 6;
          g.fillStyle = '#2a2a32'; ell(g, Math.cos(a) * 10, Math.sin(a) * 10, 2.6, 2.6); }
        g.restore(); }
      g.fillStyle = 'rgba(255,244,200,0.30)';
      poly(g, [[80, 70], [80, 82], [156, 106], [156, 44]]);
      g.fillStyle = 'rgba(250,246,230,0.5)'; g.fillRect(120, 50, 36, 50);
      g.fillStyle = 'rgba(40,40,50,' + (Math.floor(t / 300) % 2 ? 0.4 : 0.15) + ')';
      g.fillRect(126, 58, 24, 30); }],

    ['Lava lamp', function (g, t) {
      g.fillStyle = '#3a2a48'; g.fillRect(62, 100, 36, 14);
      g.fillStyle = 'rgba(90,40,120,0.5)';
      poly(g, [[64, 100], [96, 100], [90, 16], [70, 16]]);
      g.save(); g.beginPath();
      g.moveTo(64, 100); g.lineTo(96, 100); g.lineTo(90, 16); g.lineTo(70, 16); g.closePath(); g.clip();
      for (var i = 0; i < 5; i++) {
        var ph = (t * 0.0004 + i * 0.21) % 1;
        var y = 96 - ph * 78;
        var r = 7 + Math.sin(ph * Math.PI) * 5;
        g.fillStyle = 'rgba(255,90,150,0.85)';
        ell(g, 80 + Math.sin(ph * 6 + i) * 5, y, r, r * 1.15); }
      g.restore();
      g.fillStyle = '#c8a040'; g.fillRect(68, 12, 24, 6); }],

    ['Disco ball', function (g, t) {
      g.fillStyle = 'rgba(20,16,30,0.4)'; g.fillRect(0, 0, W, H);
      g.fillStyle = '#8a8a98'; g.fillRect(79, 0, 2, 22);
      g.save(); g.translate(80, 46); g.rotate(t * 0.002);
      for (var i = 0; i < 40; i++) {
        var a = i * 2.399, r = 24 * Math.sqrt((i + 1) / 40);
        var x = Math.cos(a) * r, y = Math.sin(a) * r * 0.95;
        var b = 0.35 + 0.65 * Math.abs(Math.sin(a * 3 + t * 0.006));
        g.fillStyle = 'rgba(' + (200 + b * 55 | 0) + ',' + (210 + b * 45 | 0) + ',255,' + b.toFixed(2) + ')';
        g.fillRect(x - 3, y - 3, 6, 6); }
      g.restore();
      for (var k = 0; k < 10; k++) { var a2 = t * 0.002 + k * TAU / 10;
        g.strokeStyle = 'rgba(190,220,255,0.16)'; g.lineWidth = 5;
        g.beginPath(); g.moveTo(80, 46);
        g.lineTo(80 + Math.cos(a2) * 120, 46 + Math.sin(a2) * 120); g.stroke(); } }],

    ['Desk fan', function (g, t) {
      g.fillStyle = '#4a5058'; g.fillRect(72, 84, 16, 24);
      ell(g, 80, 110, 24, 6);
      g.save(); g.translate(80, 54); g.rotate(t * 0.03);
      g.fillStyle = '#c8ccd2';
      for (var i = 0; i < 3; i++) { g.save(); g.rotate(i * TAU / 3);
        g.beginPath(); g.moveTo(0, 0);
        g.quadraticCurveTo(16, -14, 26, 2); g.quadraticCurveTo(14, 10, 0, 0);
        g.fill(); g.restore(); }
      g.restore();
      g.fillStyle = '#6a707a'; ell(g, 80, 54, 6, 6);
      for (var r = 1; r <= 4; r++) ring(g, 80, 54, r * 8, 1.4, 'rgba(170,180,190,0.7)');
      ring(g, 80, 54, 34, 3, '#8a9098'); }],

    ['Traffic light', function (g, t) {
      var ph = Math.floor(t / 1400) % 3;
      g.fillStyle = '#3a3a42'; g.fillRect(60, 10, 40, 92);
      g.fillStyle = '#2a2a32'; g.fillRect(74, 100, 12, 20);
      var cols = ['#f03a2a', '#f0c030', '#3ad06a'];
      for (var i = 0; i < 3; i++) {
        g.fillStyle = i === ph ? cols[i] : 'rgba(40,40,48,0.9)';
        ell(g, 80, 28 + i * 28, 13, 13);
        if (i === ph) { g.fillStyle = 'rgba(255,255,255,0.25)'; ell(g, 76, 24 + i * 28, 4, 3); } } }],

    ['Vending machine', function (g, t) {
      g.fillStyle = '#2a4a8a'; g.fillRect(28, 8, 104, 110);
      g.fillStyle = 'rgba(180,220,240,0.4)'; g.fillRect(34, 16, 66, 76);
      var drop = (t % 3600) / 3600;
      for (var r = 0; r < 3; r++) for (var c = 0; c < 4; c++) {
        g.fillStyle = ['#e84a3a', '#f0c030', '#3ac06a', '#e0e0e8'][(r + c) % 4];
        if (r === 0 && c === 2 && drop > 0.3) continue;
        g.fillRect(38 + c * 16, 22 + r * 24, 11, 17); }
      if (drop > 0.3) { g.fillStyle = '#3ac06a';
        g.fillRect(70, 22 + Math.min(70, (drop - 0.3) * 190), 11, 17); }
      g.fillStyle = '#1a2a4a'; g.fillRect(34, 96, 66, 16);
      g.fillStyle = '#4a4a56'; g.fillRect(106, 20, 20, 60);
      for (var k = 0; k < 8; k++) { g.fillStyle = '#c8c8d0';
        ell(g, 111 + (k % 2) * 9, 26 + Math.floor(k / 2) * 12, 3, 3); } }],

    ['Metronome', function (g, t) {
      var sw = Math.sin(t * 0.004) * 0.6;
      g.fillStyle = '#8a5a30'; poly(g, [[80, 12], [104, 108], [56, 108]]);
      g.fillStyle = '#6a4424'; poly(g, [[80, 18], [98, 104], [62, 104]]);
      g.save(); g.translate(80, 100); g.rotate(sw);
      g.fillStyle = '#c8ccd2'; g.fillRect(-1.6, -84, 3.2, 84);
      g.fillStyle = '#e0a030'; g.fillRect(-6, -58, 12, 9);
      g.restore();
      g.fillStyle = '#2a2a32'; ell(g, 80, 100, 5, 5);
      for (var i = 0; i < 5; i++) { g.fillStyle = 'rgba(240,230,200,0.5)';
        g.fillRect(72, 40 + i * 12, 16, 1.4); } }],

    ['Steam train', function (g, t) {
      g.fillStyle = 'rgba(60,52,44,0.4)'; g.fillRect(0, 96, W, 24);
      for (var r = 0; r < 12; r++) { g.fillStyle = '#5a4a3a';
        g.fillRect(((r * 20 - t * 0.06) % 180) - 10, 104, 12, 4); }
      var x = ((t * 0.05) % 220) - 50;
      g.save(); g.translate(x, 0);
      g.fillStyle = '#2a3a4a'; g.fillRect(0, 56, 70, 34);
      ell(g, 74, 66, 12, 22);
      g.fillStyle = '#1e2a36'; g.fillRect(4, 40, 26, 18);
      g.fillStyle = '#3a4a5a'; g.fillRect(56, 34, 14, 24);
      g.fillStyle = '#c8402a'; g.fillRect(0, 84, 86, 6);
      for (var w = 0; w < 3; w++) {
        g.save(); g.translate(14 + w * 26, 94); g.rotate(t * 0.02);
        g.fillStyle = '#8a2a24'; ell(g, 0, 0, 9, 9);
        g.fillStyle = '#d8d0c0'; g.fillRect(-1.4, -8, 2.8, 16); g.restore(); }
      for (var s = 0; s < 5; s++) { g.fillStyle = 'rgba(230,230,235,' + (0.4 - s * 0.07) + ')';
        ell(g, 62 - s * 12, 24 - s * 5 + Math.sin(t * 0.004 + s) * 3, 7 + s * 2, 5 + s * 1.6); }
      g.restore(); }],

    ['City bus', function (g, t) {
      g.fillStyle = 'rgba(70,70,80,0.35)'; g.fillRect(0, 98, W, 22);
      var x = ((t * 0.045) % 230) - 60;
      g.save(); g.translate(x, 0);
      g.fillStyle = '#e8a020'; g.fillRect(0, 44, 110, 50);
      g.fillStyle = '#c88418'; g.fillRect(0, 86, 110, 8);
      g.fillStyle = '#7ac0e0';
      for (var i = 0; i < 5; i++) g.fillRect(6 + i * 21, 52, 16, 18);
      g.fillStyle = '#2a2a32'; g.fillRect(84, 50, 22, 24);
      g.fillStyle = '#f0e8c0'; g.fillRect(4, 36, 60, 8);
      g.fillStyle = '#2a2a30';
      ell(g, 24, 96, 11, 11); ell(g, 88, 96, 11, 11);
      g.fillStyle = '#7a7a86'; ell(g, 24, 96, 4.5, 4.5); ell(g, 88, 96, 4.5, 4.5);
      g.restore(); }],

    ['Bicycle', function (g, t) {
      g.fillStyle = 'rgba(80,76,70,0.32)'; g.fillRect(0, 100, W, 20);
      var x = ((t * 0.05) % 220) - 40;
      g.save(); g.translate(x, 0);
      for (var w = 0; w < 2; w++) {
        g.save(); g.translate(20 + w * 56, 86); g.rotate(t * 0.02);
        ring(g, 0, 0, 15, 2.4, '#3a3a44');
        for (var k = 0; k < 8; k++) { var a = k * TAU / 8;
          seg(g, 0, 0, Math.cos(a) * 14, Math.sin(a) * 14, 0.9, '#9aa0a8'); }
        g.restore(); }
      g.strokeStyle = '#e04a5a'; g.lineWidth = 3;
      g.beginPath();
      g.moveTo(20, 86); g.lineTo(44, 62); g.lineTo(64, 86); g.moveTo(44, 62);
      g.lineTo(52, 86); g.moveTo(64, 86); g.lineTo(70, 58); g.stroke();
      g.fillStyle = '#2a2a32'; g.fillRect(38, 56, 14, 5);
      g.strokeStyle = '#2a2a32'; g.lineWidth = 2.4;
      g.beginPath(); g.moveTo(64, 56); g.lineTo(78, 52); g.stroke();
      g.restore(); }],

    ['Motorcycle', function (g, t) {
      g.fillStyle = 'rgba(70,70,78,0.35)'; g.fillRect(0, 100, W, 20);
      var x = ((t * 0.07) % 230) - 50;
      g.save(); g.translate(x, 0);
      for (var w = 0; w < 2; w++) {
        g.save(); g.translate(22 + w * 58, 88); g.rotate(t * 0.03);
        g.fillStyle = '#20202a'; ell(g, 0, 0, 15, 15);
        g.fillStyle = '#8a9098'; ell(g, 0, 0, 6, 6);
        g.fillStyle = '#c8ccd2'; g.fillRect(-1.2, -12, 2.4, 24);
        g.restore(); }
      g.fillStyle = '#c82a3a';
      poly(g, [[16, 84], [46, 62], [70, 62], [80, 84]]);
      g.fillStyle = '#2a2a34'; g.fillRect(44, 56, 22, 8);
      g.strokeStyle = '#3a3a44'; g.lineWidth = 3;
      g.beginPath(); g.moveTo(76, 84); g.lineTo(86, 56); g.stroke();
      g.fillStyle = '#f0e0a0'; ell(g, 88, 62, 6, 5);
      g.restore(); }],

    ['Sailboat', function (g, t) {
      g.fillStyle = 'rgba(30,90,140,0.35)'; g.fillRect(0, 76, W, 44);
      for (var i = 0; i < 5; i++) {
        g.fillStyle = 'rgba(140,210,240,0.35)';
        g.fillRect(0, 82 + i * 8, W, 2.6); }
      var rock = Math.sin(t * 0.0026) * 0.09;
      var x = 80 + Math.sin(t * 0.0011) * 26;
      g.save(); g.translate(x, 78 + Math.sin(t * 0.0026) * 3); g.rotate(rock);
      g.fillStyle = '#8a5a30'; poly(g, [[-30, 0], [30, 0], [22, 14], [-22, 14]]);
      g.fillStyle = '#6a4424'; g.fillRect(-1.6, -56, 3.2, 56);
      g.fillStyle = '#f4f0e4'; poly(g, [[2, -54], [26, -6], [2, -6]]);
      g.fillStyle = '#e0e8f0'; poly(g, [[-2, -50], [-22, -6], [-2, -6]]);
      g.fillStyle = '#e04a4a'; poly(g, [[2, -54], [14, -34], [2, -34]]);
      g.restore(); }],

    ['Submarine', function (g, t) {
      g.fillStyle = 'rgba(14,60,96,0.45)'; g.fillRect(0, 0, W, H);
      var x = ((t * 0.028) % 230) - 60;
      var y = 66 + Math.sin(t * 0.0015) * 12;
      g.save(); g.translate(x, y);
      g.fillStyle = '#d8a02a'; ell(g, 0, 0, 42, 17);
      g.fillStyle = '#b8801a'; g.fillRect(-8, -28, 22, 16);
      g.fillStyle = '#c89020'; poly(g, [[-42, -4], [-56, -16], [-56, 16], [-42, 4]]);
      g.fillStyle = '#7ad0e8';
      for (var i = 0; i < 3; i++) ell(g, -12 + i * 16, -2, 5, 5);
      g.fillStyle = '#8a6a10'; g.fillRect(2, -40, 2.4, 14);
      g.restore();
      for (var b = 0; b < 8; b++) { g.fillStyle = 'rgba(200,240,255,0.45)';
        ell(g, x - 50 - (b * 9), y - 4 - ((t * 0.03 + b * 8) % 30), 2.4, 2.4); } }],

    ['Hot air balloon', function (g, t) {
      g.fillStyle = 'rgba(120,190,230,0.28)'; g.fillRect(0, 0, W, H);
      var y = 70 - ((t * 0.012) % 90);
      var x = 80 + Math.sin(t * 0.0009) * 18;
      g.save(); g.translate(x, y + 40);
      var cols = ['#e8402c', '#f0c030', '#3aa8d8', '#7ac040'];
      for (var i = 0; i < 4; i++) {
        g.fillStyle = cols[i];
        g.beginPath();
        g.moveTo(0, -6);
        g.arc(0, -36, 30, Math.PI + i * Math.PI / 4, Math.PI + (i + 1) * Math.PI / 4);
        g.closePath(); g.fill(); }
      g.fillStyle = '#c8a060'; g.fillRect(-9, 4, 18, 14);
      g.strokeStyle = '#a8845a'; g.lineWidth = 1.2;
      g.beginPath(); g.moveTo(-9, 4); g.lineTo(-16, -10);
      g.moveTo(9, 4); g.lineTo(16, -10); g.stroke();
      g.restore();
      for (var c = 0; c < 3; c++) { g.fillStyle = 'rgba(250,250,255,0.75)';
        ell(g, ((t * 0.02 + c * 60) % 200) - 20, 24 + c * 26, 16, 8); } }],

    ['Helicopter', function (g, t) {
      var x = ((t * 0.05) % 230) - 50;
      var y = 52 + Math.sin(t * 0.0022) * 8;
      g.save(); g.translate(x, y);
      g.fillStyle = '#2a6a4a'; ell(g, 0, 0, 30, 16);
      poly(g, [[-28, -2], [-64, 2], [-64, -6], [-28, -8]]);
      g.fillStyle = '#7ad0e8'; ell(g, 14, -2, 11, 9);
      g.fillStyle = '#1e5038'; g.fillRect(-4, -26, 8, 12);
      g.save(); g.rotate(0); g.fillStyle = 'rgba(190,200,210,0.75)';
      var sp = Math.abs(Math.sin(t * 0.06));
      g.fillRect(-52 * (0.4 + sp * 0.6), -28, 104 * (0.4 + sp * 0.6), 3); g.restore();
      g.save(); g.translate(-62, 0); g.rotate(t * 0.08);
      g.fillStyle = 'rgba(190,200,210,0.7)'; g.fillRect(-1.5, -12, 3, 24); g.restore();
      g.fillStyle = '#3a3a44'; g.fillRect(-16, 14, 34, 3);
      g.restore(); }],

    ['Tractor', function (g, t) {
      g.fillStyle = 'rgba(110,90,50,0.35)'; g.fillRect(0, 96, W, 24);
      var x = ((t * 0.035) % 220) - 50;
      g.save(); g.translate(x, 0);
      g.fillStyle = '#2a8a3a'; g.fillRect(24, 54, 54, 30);
      g.fillStyle = '#1e6a2a'; g.fillRect(60, 34, 26, 22);
      g.fillStyle = '#7ad0e8'; g.fillRect(64, 38, 18, 14);
      g.fillStyle = '#3a3a40'; g.fillRect(30, 26, 8, 28);
      g.fillStyle = '#20202a';
      ell(g, 84, 88, 20, 20); ell(g, 34, 92, 12, 12);
      g.fillStyle = '#c8c020'; ell(g, 84, 88, 8, 8); ell(g, 34, 92, 5, 5);
      for (var s = 0; s < 4; s++) { g.fillStyle = 'rgba(90,90,96,' + (0.4 - s * 0.08) + ')';
        ell(g, 34, 20 - s * 8 + Math.sin(t * 0.005 + s) * 3, 4 + s, 3 + s); }
      g.restore(); }],

    ['Skateboard', function (g, t) {
      g.fillStyle = 'rgba(90,90,96,0.35)'; g.fillRect(0, 100, W, 20);
      var c = (t % 2400) / 2400;
      var x = ((t * 0.06) % 220) - 40;
      var air = c > 0.4 && c < 0.75 ? Math.sin((c - 0.4) / 0.35 * Math.PI) * 34 : 0;
      g.save(); g.translate(x, 88 - air); g.rotate(air * 0.02);
      g.fillStyle = '#c8402a';
      g.beginPath(); g.moveTo(-30, 0); g.quadraticCurveTo(-36, -8, -26, -8);
      g.lineTo(26, -8); g.quadraticCurveTo(36, -8, 30, 0); g.closePath(); g.fill();
      g.fillStyle = '#8a8a94'; g.fillRect(-20, 0, 6, 5); g.fillRect(14, 0, 6, 5);
      g.fillStyle = '#f0d040';
      ell(g, -17, 7, 5, 5); ell(g, 17, 7, 5, 5);
      g.restore(); }],

    ['Flower blooming', function (g, t) {
      var c = (t % 6000) / 6000;
      var op = Math.min(1, c * 1.6);
      g.fillStyle = '#3a7a34'; g.fillRect(78, 60, 5, 58);
      g.fillStyle = '#4a9a42';
      ell(g, 66, 84, 13, 6, -0.4); ell(g, 95, 96, 12, 5.5, 0.4);
      g.save(); g.translate(80, 54);
      g.fillStyle = '#e0407a';
      for (var i = 0; i < 8; i++) {
        g.save(); g.rotate(i * TAU / 8 + t * 0.0006);
        ell(g, 0, -18 * op, 8 * op, 16 * op); g.restore(); }
      g.fillStyle = '#f078a8';
      for (var j = 0; j < 6; j++) {
        g.save(); g.rotate(j * TAU / 6 + 0.4);
        ell(g, 0, -10 * op, 5 * op, 9 * op); g.restore(); }
      g.fillStyle = '#f0c83c'; ell(g, 0, 0, 8 * op, 8 * op);
      g.restore(); }],

    ['Tree growing', function (g, t) {
      var c = (t % 7000) / 7000;
      g.fillStyle = 'rgba(90,70,40,0.4)'; g.fillRect(0, 108, W, 12);
      g.fillStyle = '#6a4a2a';
      var h = 20 + c * 46;
      g.fillRect(76, 108 - h, 9, h);
      (function branch(x, y, len, ang, d) {
        if (d === 0 || len < 3) return;
        var nx = x + Math.cos(ang) * len, ny = y + Math.sin(ang) * len;
        seg(g, x, y, nx, ny, d * 1.2, '#6a4a2a');
        branch(nx, ny, len * 0.72, ang - 0.5, d - 1);
        branch(nx, ny, len * 0.72, ang + 0.5, d - 1);
      }(80, 108 - h, 16 * c, -Math.PI / 2, 4));
      g.fillStyle = 'rgba(70,160,60,' + (0.35 + c * 0.5) + ')';
      for (var i = 0; i < 14; i++) { var a = i * 2.399;
        ell(g, 80 + Math.cos(a) * 26 * c, 108 - h - 20 * c + Math.sin(a) * 18 * c, 7 * c, 6 * c); } }],

    ['Climbing vine', function (g, t) {
      var c = (t % 8000) / 8000;
      g.strokeStyle = '#3a8a3a'; g.lineWidth = 3;
      g.beginPath();
      var n = Math.floor(c * 60) + 1;
      for (var i = 0; i < n; i++) {
        var y = 118 - i * 2;
        var x = 80 + Math.sin(i * 0.22) * 26;
        if (i) g.lineTo(x, y); else g.moveTo(x, y); }
      g.stroke();
      for (var k = 0; k < n; k += 5) {
        var y2 = 118 - k * 2, x2 = 80 + Math.sin(k * 0.22) * 26;
        g.fillStyle = '#4faa46';
        g.save(); g.translate(x2, y2); g.rotate(k * 0.4);
        ell(g, 8, 0, 8, 4.5); ell(g, -8, 0, 8, 4.5); g.restore(); }
      g.fillStyle = '#8a6a3a'; g.fillRect(0, 116, W, 6); }],

    ['Cactus', function (g, t) {
      g.fillStyle = 'rgba(210,170,110,0.35)'; g.fillRect(0, 100, W, 20);
      g.fillStyle = '#3f8a4a';
      var sway = Math.sin(t * 0.0016) * 2;
      g.fillRect(72 + sway * 0.3, 40, 18, 66);
      ell(g, 81 + sway * 0.3, 40, 9, 9);
      g.fillRect(52, 60, 20, 9); g.fillRect(52, 60, 9, 26); ell(g, 56.5, 60, 4.5, 4.5);
      g.fillRect(90, 72, 18, 9); g.fillRect(99, 52, 9, 29); ell(g, 103.5, 52, 4.5, 4.5);
      g.strokeStyle = '#d8e8c0'; g.lineWidth = 1;
      for (var i = 0; i < 12; i++) {
        var y = 46 + i * 5;
        g.beginPath(); g.moveTo(74, y); g.lineTo(70, y - 2);
        g.moveTo(88, y); g.lineTo(92, y - 2); g.stroke(); }
      g.fillStyle = '#f04a8a'; ell(g, 81 + sway * 0.3, 33, 5, 4); }]
,
    ['Mushrooms', function (g, t) {
      g.fillStyle = 'rgba(60,80,50,0.35)'; g.fillRect(0, 96, W, 24);
      var spec = [[46, 96, 1.2], [80, 100, 1.7], [112, 94, 1.0]];
      for (var i = 0; i < 3; i++) {
        var s = spec[i], b = 1 + Math.sin(t * 0.002 + i) * 0.04;
        g.save(); g.translate(s[0], s[1]); g.scale(s[2] * b, s[2] * b);
        g.fillStyle = '#f2ead8'; g.fillRect(-5, -20, 10, 20);
        g.fillStyle = '#d8342c';
        g.beginPath(); g.ellipse(0, -20, 18, 13, 0, Math.PI, TAU); g.fill();
        g.fillStyle = '#f8f0e0';
        ell(g, -8, -24, 3.4, 2.6); ell(g, 5, -27, 3, 2.4); ell(g, 10, -21, 2.6, 2);
        g.restore(); }
      for (var sp = 0; sp < 8; sp++) { g.fillStyle = 'rgba(240,240,220,0.35)';
        ell(g, 40 + sp * 12, 70 - ((t * 0.02 + sp * 9) % 40), 1.4, 1.4); } }],

    ['Sunflower', function (g, t) {
      var sway = Math.sin(t * 0.0014);
      g.fillStyle = '#3a7a34'; g.fillRect(78, 56, 5, 62);
      g.fillStyle = '#4a9a42'; ell(g, 66, 88, 14, 6, -0.4);
      g.save(); g.translate(80 + sway * 8, 48);
      g.fillStyle = '#f0c020';
      for (var i = 0; i < 16; i++) { g.save(); g.rotate(i * TAU / 16);
        ell(g, 0, -24, 5, 12); g.restore(); }
      g.fillStyle = '#f8d84a';
      for (var j = 0; j < 12; j++) { g.save(); g.rotate(j * TAU / 12 + 0.26);
        ell(g, 0, -18, 4, 9); g.restore(); }
      g.fillStyle = '#5a3a1a'; ell(g, 0, 0, 15, 15);
      g.fillStyle = '#3a2410';
      for (var k = 0; k < 18; k++) { var a = k * 2.399, r = 13 * Math.sqrt((k + 1) / 18);
        ell(g, Math.cos(a) * r, Math.sin(a) * r, 1.5, 1.5); }
      g.restore(); }],

    ['Falling leaves', function (g, t) {
      g.fillStyle = 'rgba(150,110,60,0.22)'; g.fillRect(0, 0, W, H);
      var cols = ['#d8622a', '#e8a020', '#c84a2a', '#f0c040'];
      for (var i = 0; i < 16; i++) {
        var y = ((t * 0.05 + i * 27) % 140) - 10;
        var x = (i * 43 % 160) + Math.sin(t * 0.003 + i) * 14;
        g.save(); g.translate(x, y); g.rotate(t * 0.004 + i);
        g.fillStyle = cols[i % 4];
        ell(g, 0, 0, 7, 4);
        seg(g, -7, 0, 7, 0, 0.9, 'rgba(90,50,20,0.7)');
        g.restore(); }
      g.fillStyle = 'rgba(120,80,40,0.4)'; g.fillRect(0, 112, W, 8); }],

    ['Seed sprouting', function (g, t) {
      var c = (t % 6500) / 6500;
      g.fillStyle = 'rgba(90,64,40,0.55)'; g.fillRect(0, 70, W, 50);
      g.fillStyle = 'rgba(70,48,28,0.5)'; g.fillRect(0, 70, W, 5);
      g.fillStyle = '#c8a060'; ell(g, 80, 82, 7, 5);
      if (c > 0.15) {
        var h = (c - 0.15) * 70;
        g.strokeStyle = '#4faa46'; g.lineWidth = 3;
        g.beginPath(); g.moveTo(80, 82);
        g.quadraticCurveTo(78, 82 - h * 0.6, 80, 82 - h); g.stroke();
        g.fillStyle = '#5fbf52';
        ell(g, 72, 82 - h + 3, 9 * Math.min(1, (c - 0.3) * 3), 5, -0.5);
        ell(g, 88, 82 - h + 6, 9 * Math.min(1, (c - 0.45) * 3), 5, 0.5); }
      g.strokeStyle = 'rgba(200,170,120,0.5)'; g.lineWidth = 1.4;
      for (var r = 0; r < 3; r++) { g.beginPath(); g.moveTo(80, 86);
        g.quadraticCurveTo(72 + r * 8, 100, 66 + r * 14, 114); g.stroke(); } }],

    ['Venus flytrap', function (g, t) {
      var c = (t % 3800) / 3800;
      var open = c < 0.6 ? 1 : (c < 0.68 ? 0.05 : 1);
      g.fillStyle = 'rgba(60,80,50,0.3)'; g.fillRect(0, 100, W, 20);
      g.fillStyle = '#3a7a34';
      g.fillRect(78, 62, 5, 50); g.fillRect(52, 76, 5, 36); g.fillRect(104, 82, 5, 30);
      var traps = [[80, 60, 1.2], [54, 74, 0.85], [106, 80, 0.75]];
      for (var i = 0; i < 3; i++) {
        var p = traps[i];
        g.save(); g.translate(p[0], p[1]); g.scale(p[2], p[2]);
        for (var s = 0; s < 2; s++) {
          var sd = s ? 1 : -1;
          g.save(); g.rotate(sd * (0.35 + open * 0.65));
          g.fillStyle = '#4f9a44';
          ell(g, sd * 10, 0, 12, 7);
          g.fillStyle = '#c8384a'; ell(g, sd * 11, 0, 8, 4.5);
          g.strokeStyle = '#e8f0c0'; g.lineWidth = 1.2;
          for (var k = 0; k < 5; k++) {
            g.beginPath(); g.moveTo(sd * (4 + k * 4), -6);
            g.lineTo(sd * (4 + k * 4), -11); g.stroke(); }
          g.restore(); }
        g.restore(); }
      if (c < 0.55) { g.fillStyle = '#2a2a30';
        ell(g, 80 + Math.sin(t * 0.01) * 22, 44 + Math.cos(t * 0.013) * 12, 2.6, 2); } }],

    ['Bonsai', function (g, t) {
      g.fillStyle = '#8a4a2a'; g.fillRect(50, 96, 60, 18);
      g.fillStyle = '#6a3620'; g.fillRect(50, 96, 60, 5);
      g.fillStyle = '#5a4028';
      g.beginPath(); g.moveTo(76, 96);
      g.quadraticCurveTo(66, 76, 82, 62); g.quadraticCurveTo(96, 52, 88, 40);
      g.lineWidth = 7; g.strokeStyle = '#5a4028'; g.stroke();
      seg(g, 82, 62, 58, 54, 4, '#5a4028');
      var sw = Math.sin(t * 0.0018) * 2;
      g.fillStyle = '#3f8a3f';
      ell(g, 88 + sw, 34, 22, 11); ell(g, 56 + sw, 48, 16, 8); ell(g, 104 + sw, 46, 14, 7);
      g.fillStyle = '#4faa4a';
      ell(g, 92 + sw, 30, 12, 6); ell(g, 58 + sw, 45, 9, 4.5); }],

    ['Night skyline', function (g, t) {
      g.fillStyle = 'rgba(14,18,40,0.5)'; g.fillRect(0, 0, W, H);
      for (var s = 0; s < 20; s++) { g.fillStyle = 'rgba(255,255,255,' + (0.3 + 0.5 * Math.abs(Math.sin(t * 0.003 + s))) + ')';
        ell(g, (s * 59 % 156) + 3, (s * 23 % 42) + 4, 1.2, 1.2); }
      g.fillStyle = '#f0e8b0'; ell(g, 128, 26, 11, 11);
      var hs = [46, 70, 34, 88, 56, 76, 40];
      for (var b = 0; b < 7; b++) {
        var x = b * 23, h = hs[b];
        g.fillStyle = '#1a2038'; g.fillRect(x, 120 - h, 21, h);
        for (var w = 0; w < 12; w++) {
          var lit = ((b * 13 + w * 7 + Math.floor(t / 700)) % 5) < 2;
          g.fillStyle = lit ? 'rgba(255,220,120,0.9)' : 'rgba(40,50,80,0.8)';
          g.fillRect(x + 3 + (w % 3) * 6, 124 - h + Math.floor(w / 3) * 9, 4, 5); } } }],

    ['Lighthouse', function (g, t) {
      g.fillStyle = 'rgba(16,26,50,0.5)'; g.fillRect(0, 0, W, H);
      g.fillStyle = 'rgba(20,60,90,0.5)'; g.fillRect(0, 92, W, 28);
      g.fillStyle = '#f2f0e8'; poly(g, [[68, 100], [92, 100], [88, 30], [72, 30]]);
      g.fillStyle = '#d8342c';
      for (var i = 0; i < 3; i++) g.fillRect(69 + i * 0.6, 42 + i * 18, 22 - i * 1.2, 9);
      g.fillStyle = '#3a4450'; g.fillRect(68, 22, 24, 9);
      g.fillStyle = '#ffe98a'; ell(g, 80, 26, 7, 6);
      var a = t * 0.0022;
      g.fillStyle = 'rgba(255,240,170,0.16)';
      poly(g, [[80, 26], [80 + Math.cos(a) * 150, 26 + Math.sin(a) * 150 - 30],
               [80 + Math.cos(a + 0.3) * 150, 26 + Math.sin(a + 0.3) * 150 - 30]]);
      for (var w = 0; w < 4; w++) { g.fillStyle = 'rgba(120,190,220,0.4)';
        g.fillRect(0, 100 + w * 6, W, 2.4); } }],

    ['Windmill', function (g, t) {
      g.fillStyle = 'rgba(140,180,110,0.3)'; g.fillRect(0, 96, W, 24);
      g.fillStyle = '#c8b088'; poly(g, [[62, 108], [98, 108], [90, 46], [70, 46]]);
      g.fillStyle = '#8a5a3a'; poly(g, [[66, 48], [94, 48], [80, 30]]);
      g.fillStyle = '#4a3a2a'; g.fillRect(74, 86, 12, 22);
      g.save(); g.translate(80, 44); g.rotate(t * 0.0035);
      for (var i = 0; i < 4; i++) {
        g.save(); g.rotate(i * TAU / 4);
        g.fillStyle = '#e8e0c8'; g.fillRect(-2.5, -40, 5, 40);
        g.fillStyle = '#c8bca0'; g.fillRect(2.5, -38, 8, 32);
        g.restore(); }
      g.restore();
      g.fillStyle = '#5a4a3a'; ell(g, 80, 44, 4, 4); }],

    ['Ferris wheel', function (g, t) {
      g.fillStyle = 'rgba(20,26,50,0.45)'; g.fillRect(0, 0, W, H);
      g.fillStyle = '#5a5a68';
      poly(g, [[62, 116], [78, 60], [82, 60], [98, 116]]);
      g.save(); g.translate(80, 56); g.rotate(t * 0.0011);
      ring(g, 0, 0, 40, 2.4, '#8a8a98');
      ring(g, 0, 0, 26, 1.6, '#6a6a78');
      for (var i = 0; i < 10; i++) { var a = i * TAU / 10;
        seg(g, 0, 0, Math.cos(a) * 40, Math.sin(a) * 40, 1.2, '#7a7a88'); }
      g.restore();
      for (var k = 0; k < 10; k++) {
        var a2 = t * 0.0011 + k * TAU / 10;
        var cx2 = 80 + Math.cos(a2) * 40, cy2 = 56 + Math.sin(a2) * 40;
        g.fillStyle = ['#e8402c', '#f0c030', '#3aa8d8', '#7ac040', '#e070c0'][k % 5];
        g.fillRect(cx2 - 5, cy2, 10, 8); }
      g.fillStyle = '#c8c8d0'; ell(g, 80, 56, 4, 4); }],

    ['Construction crane', function (g, t) {
      g.fillStyle = 'rgba(120,140,160,0.28)'; g.fillRect(0, 0, W, H);
      g.fillStyle = '#e8b020';
      for (var i = 0; i < 8; i++) { g.fillRect(38, 108 - i * 12, 14, 3);
        seg(g, 38, 108 - i * 12, 52, 96 - i * 12, 1.6, '#e8b020'); }
      g.fillRect(36, 20, 18, 92);
      g.fillRect(20, 18, 118, 6);
      g.fillStyle = '#c89010'; g.fillRect(20, 18, 118, 2);
      var hx = 60 + ((t * 0.03) % 70);
      var hy = 30 + Math.abs(Math.sin(t * 0.0016)) * 46;
      seg(g, hx, 24, hx, hy, 1.2, '#8a8a94');
      g.fillStyle = '#c84a2a'; g.fillRect(hx - 8, hy, 16, 12);
      g.fillStyle = '#3a3a44'; g.fillRect(30, 8, 22, 14); }],

    ['Neon sign', function (g, t) {
      g.fillStyle = 'rgba(18,10,26,0.55)'; g.fillRect(0, 0, W, H);
      var on = Math.floor(t / 220) % 7 !== 0;
      var glow = on ? 1 : 0.18;
      g.strokeStyle = 'rgba(255,60,160,' + glow + ')'; g.lineWidth = 4;
      ring(g, 80, 52, 34, 4, 'rgba(255,60,160,' + glow + ')');
      g.strokeStyle = 'rgba(90,240,255,' + glow + ')'; g.lineWidth = 3.4;
      g.beginPath();
      g.moveTo(62, 44); g.lineTo(62, 62); g.moveTo(62, 53); g.lineTo(74, 53);
      g.moveTo(74, 44); g.lineTo(74, 62);
      g.moveTo(86, 44); g.lineTo(86, 62); g.lineTo(98, 62);
      g.stroke();
      g.fillStyle = 'rgba(255,60,160,' + (glow * 0.14) + ')'; ell(g, 80, 52, 48, 44);
      g.strokeStyle = 'rgba(255,220,80,' + (Math.floor(t / 400) % 2 ? 1 : 0.3) + ')';
      g.lineWidth = 2.6;
      g.beginPath(); g.moveTo(48, 92); g.lineTo(112, 92); g.stroke(); }],

    ['Subway train', function (g, t) {
      g.fillStyle = 'rgba(24,24,34,0.5)'; g.fillRect(0, 0, W, H);
      g.fillStyle = '#3a3a46'; g.fillRect(0, 96, W, 24);
      for (var i = 0; i < 10; i++) { g.fillStyle = '#6a6a78';
        g.fillRect(((i * 22 - t * 0.16) % 190) - 12, 104, 14, 3); }
      var x = ((t * 0.13) % 260) - 90;
      g.save(); g.translate(x, 0);
      g.fillStyle = '#b8bcc4'; g.fillRect(0, 44, 150, 52);
      g.fillStyle = '#8a3a44'; g.fillRect(0, 44, 150, 7);
      g.fillStyle = '#2a3a4a';
      for (var w = 0; w < 6; w++) g.fillRect(8 + w * 24, 56, 17, 20);
      g.fillStyle = 'rgba(255,240,190,0.85)';
      for (var p = 0; p < 6; p++) ell(g, 16 + p * 24, 70, 4, 5);
      g.fillStyle = '#f0e8a0'; ell(g, 148, 62, 5, 6);
      g.restore();
      g.fillStyle = 'rgba(10,10,18,0.5)'; g.fillRect(0, 0, W, 40); }],

    ['Rain on glass', function (g, t) {
      g.fillStyle = 'rgba(50,66,84,0.42)'; g.fillRect(0, 0, W, H);
      g.fillStyle = 'rgba(120,150,180,0.22)';
      for (var b = 0; b < 6; b++) ell(g, 20 + b * 26, 30 + (b % 3) * 30, 18, 14);
      for (var i = 0; i < 26; i++) {
        var x = (i * 47 % 158);
        var y = ((t * 0.06 * (1 + (i % 3) * 0.5) + i * 21) % 140);
        var r = 1.6 + (i % 4) * 0.9;
        g.fillStyle = 'rgba(215,240,255,0.7)';
        ell(g, x, y, r, r * 1.4);
        g.fillStyle = 'rgba(215,240,255,0.25)';
        g.fillRect(x - 0.7, y - 14, 1.4, 14); }
      for (var d = 0; d < 8; d++) { g.fillStyle = 'rgba(230,245,255,0.5)';
        ell(g, (d * 71 % 150) + 6, (d * 37 % 100) + 12, 2.6, 3.2); } }],

    ['Streetlight', function (g, t) {
      g.fillStyle = 'rgba(16,20,34,0.55)'; g.fillRect(0, 0, W, H);
      g.fillStyle = '#3a3a46'; g.fillRect(76, 30, 7, 90);
      g.beginPath(); g.moveTo(79, 30); g.quadraticCurveTo(79, 16, 100, 16);
      g.lineWidth = 6; g.strokeStyle = '#3a3a46'; g.stroke();
      g.fillStyle = '#e8e0b0'; ell(g, 100, 20, 8, 5);
      g.fillStyle = 'rgba(255,235,150,0.16)';
      poly(g, [[92, 22], [108, 22], [136, 120], [64, 120]]);
      g.strokeStyle = 'rgba(190,220,255,0.55)'; g.lineWidth = 1.2;
      for (var i = 0; i < 26; i++) {
        var x = 60 + (i * 31 % 78), y = ((t * 0.22 + i * 17) % 118);
        g.beginPath(); g.moveTo(x, y); g.lineTo(x - 2, y + 8); g.stroke(); }
      g.fillStyle = 'rgba(120,150,190,0.3)'; g.fillRect(0, 114, W, 6); }],

    ['Drawbridge', function (g, t) {
      var c = (t % 6000) / 6000;
      var lift = c < 0.5 ? Math.sin(c / 0.5 * Math.PI) : 0;
      g.fillStyle = 'rgba(30,70,110,0.45)'; g.fillRect(0, 78, W, 42);
      g.fillStyle = '#5a5a66'; g.fillRect(0, 70, 46, 10); g.fillRect(114, 70, 46, 10);
      g.fillStyle = '#8a5a3a';
      for (var s = 0; s < 2; s++) {
        var sd = s ? 1 : -1;
        g.save();
        g.translate(80 + sd * 34, 74);
        g.rotate(-sd * lift * 1.2);
        g.fillRect(sd > 0 ? 0 : -34, -5, 34, 8);
        g.restore(); }
      g.fillStyle = '#4a4a56'; g.fillRect(38, 30, 10, 44); g.fillRect(112, 30, 10, 44);
      g.fillStyle = '#6a6a78'; g.fillRect(34, 24, 18, 8); g.fillRect(108, 24, 18, 8);
      for (var w = 0; w < 4; w++) { g.fillStyle = 'rgba(140,200,230,0.35)';
        g.fillRect(0, 90 + w * 8, W, 2.4); } }],

    ['Bouncing ball', function (g, t) {
      g.fillStyle = 'rgba(90,90,100,0.3)'; g.fillRect(0, 106, W, 14);
      var x = ((t * 0.06) % 200) - 20;
      var b = Math.abs(Math.sin(t * 0.005));
      var y = 100 - b * 66;
      var sq = 1 + (1 - b) * 0.25;
      g.fillStyle = 'rgba(0,0,0,0.28)';
      ell(g, x, 106, 13 * b + 4, 3);
      g.save(); g.translate(x, y); g.rotate(t * 0.006);
      g.fillStyle = '#e8402c'; ell(g, 0, 0, 13 / sq, 13 * sq);
      g.fillStyle = '#f6f2e8';
      poly(g, [[-13 / sq, 0], [0, -5 * sq], [13 / sq, 0], [0, 5 * sq]]);
      g.restore(); }],

    ['Dartboard', function (g, t) {
      var c = (t % 2600) / 2600;
      ring(g, 80, 58, 44, 4, '#3a3a44');
      g.fillStyle = '#f2ead6'; ell(g, 80, 58, 40, 40);
      for (var i = 0; i < 20; i++) {
        g.save(); g.translate(80, 58); g.rotate(i * TAU / 20);
        g.fillStyle = i % 2 ? '#2a2a32' : '#e8dcc0';
        g.beginPath(); g.moveTo(0, 0);
        g.arc(0, 0, 40, -TAU / 40, TAU / 40); g.closePath(); g.fill();
        g.restore(); }
      g.fillStyle = '#2a8a4a'; ell(g, 80, 58, 11, 11);
      g.fillStyle = '#d8342c'; ell(g, 80, 58, 5, 5);
      if (c > 0.4) {
        var dx = 80 + 14, dy = 58 - 8;
        var fly = c < 0.5 ? (0.5 - c) * 300 : 0;
        g.strokeStyle = '#c8c8d0'; g.lineWidth = 2;
        g.beginPath(); g.moveTo(dx + fly, dy - fly * 0.3);
        g.lineTo(dx + 22 + fly, dy - 6 - fly * 0.3); g.stroke();
        g.fillStyle = '#e0405a';
        poly(g, [[dx + 22 + fly, dy - 6 - fly * 0.3], [dx + 30 + fly, dy - 12 - fly * 0.3],
                 [dx + 30 + fly, dy - 2 - fly * 0.3]]); } }],

    ['Slot machine', function (g, t) {
      g.fillStyle = '#8a2a3a'; g.fillRect(30, 14, 100, 96);
      g.fillStyle = '#f0c040'; g.fillRect(34, 18, 92, 8);
      g.fillStyle = '#1a1a22'; g.fillRect(40, 34, 80, 40);
      var syms = ['#e8402c', '#f0c030', '#3ac06a', '#e0e0e8', '#8a6ae0'];
      for (var r = 0; r < 3; r++) {
        var spin = Math.max(0, 1 - ((t % 4000) / 4000 - r * 0.15) * 4);
        var idx = Math.floor(t / (spin > 0.05 ? 70 : 100000) + r * 3) % 5;
        g.fillStyle = '#f4f0e4'; g.fillRect(44 + r * 26, 38, 22, 32);
        g.fillStyle = syms[idx];
        ell(g, 55 + r * 26, 54, 8, 9); }
      g.fillStyle = '#c8c8d2'; g.fillRect(126, 44, 6, 30);
      g.fillStyle = '#e0405a'; ell(g, 129, 42, 6, 6);
      for (var l = 0; l < 8; l++) { g.fillStyle = (Math.floor(t / 180) + l) % 3 ? '#5a2a34' : '#ffe060';
        ell(g, 38 + l * 12, 100, 3.4, 3.4); } }],

    ['Pinball', function (g, t) {
      g.fillStyle = 'rgba(20,24,44,0.45)'; g.fillRect(0, 0, W, H);
      g.fillStyle = '#2a3a5a'; g.fillRect(24, 8, 112, 104);
      var bumps = [[54, 36], [90, 30], [112, 56], [46, 66]];
      for (var i = 0; i < 4; i++) {
        var hit = Math.abs(Math.sin(t * 0.004 + i * 1.7)) > 0.93;
        g.fillStyle = hit ? '#ffe060' : '#e0405a';
        ell(g, bumps[i][0], bumps[i][1], 9, 9);
        g.fillStyle = '#f4f0e4'; ell(g, bumps[i][0], bumps[i][1], 4, 4); }
      var bx = 80 + Math.sin(t * 0.005) * 40, by = 60 + Math.cos(t * 0.0083) * 34;
      g.fillStyle = '#dfe4ea'; ell(g, bx, by, 5, 5);
      g.fillStyle = 'rgba(255,255,255,0.8)'; ell(g, bx - 1.6, by - 1.6, 1.6, 1.6);
      g.fillStyle = '#e8e0c0';
      var fl = Math.sin(t * 0.006) * 0.4;
      g.save(); g.translate(56, 100); g.rotate(-0.4 + fl); g.fillRect(0, -3, 24, 6); g.restore();
      g.save(); g.translate(104, 100); g.rotate(0.4 - fl); g.fillRect(-24, -3, 24, 6); g.restore(); }],

    ['Dice rolling', function (g, t) {
      var c = (t % 2800) / 2800;
      var roll = c < 0.55;
      g.fillStyle = 'rgba(30,80,50,0.4)'; g.fillRect(0, 0, W, H);
      for (var d = 0; d < 2; d++) {
        var x = 56 + d * 48 + (roll ? Math.sin(t * 0.02 + d * 2) * 16 : 0);
        var y = 62 + (roll ? Math.cos(t * 0.026 + d) * 14 : 0);
        var rot = roll ? t * 0.02 + d : (d ? 0.12 : -0.08);
        var n = roll ? (Math.floor(t / 90) + d) % 6 + 1 : [3, 5][d];
        g.save(); g.translate(x, y); g.rotate(rot);
        g.fillStyle = '#f6f2e8'; g.fillRect(-16, -16, 32, 32);
        g.fillStyle = '#c8c0b0'; g.fillRect(-16, 12, 32, 4);
        g.fillStyle = '#2a2a32';
        var pips = [[[0,0]], [[-7,-7],[7,7]], [[-7,-7],[0,0],[7,7]],
                    [[-7,-7],[7,-7],[-7,7],[7,7]], [[-7,-7],[7,-7],[0,0],[-7,7],[7,7]],
                    [[-7,-8],[7,-8],[-7,0],[7,0],[-7,8],[7,8]]][n - 1];
        for (var p = 0; p < pips.length; p++) ell(g, pips[p][0], pips[p][1], 2.6, 2.6);
        g.restore(); } }],

    ['Bowling', function (g, t) {
      var c = (t % 4200) / 4200;
      g.fillStyle = 'rgba(150,120,70,0.35)'; g.fillRect(0, 40, W, 80);
      g.fillStyle = 'rgba(90,70,40,0.4)'; g.fillRect(0, 40, W, 3);
      var pins = [[80, 46], [70, 56], [90, 56], [60, 66], [80, 66], [100, 66]];
      for (var i = 0; i < 6; i++) {
        var down = c > 0.62 && ((i * 7) % 5) < 4;
        g.save(); g.translate(pins[i][0], pins[i][1]);
        if (down) g.rotate(((i % 2) ? 1 : -1) * 1.3);
        g.fillStyle = '#f6f2e8';
        ell(g, 0, -8, 4, 5); g.fillRect(-3, -6, 6, 8);
        poly(g, [[-3, 2], [3, 2], [5, 12], [-5, 12]]);
        g.fillStyle = '#d8342c'; g.fillRect(-3.4, -2, 6.8, 3);
        g.restore(); }
      var bx = 80 + Math.sin(c * 3) * 6, by = 118 - c * 66;
      if (c < 0.68) { g.fillStyle = '#2a3a8a'; ell(g, bx, by, 11, 11);
        g.fillStyle = '#101828';
        ell(g, bx - 3, by - 3, 1.8, 1.8); ell(g, bx + 3, by - 3, 1.8, 1.8); ell(g, bx, by + 2, 1.8, 1.8); } }],

    ['Basketball hoop', function (g, t) {
      g.fillStyle = 'rgba(90,120,160,0.25)'; g.fillRect(0, 0, W, H);
      g.fillStyle = '#f2ead6'; g.fillRect(96, 14, 48, 38);
      g.fillStyle = '#d8342c'; g.strokeStyle = '#d8342c'; g.lineWidth = 3;
      g.strokeRect(108, 26, 24, 18);
      g.fillStyle = '#e8622a'; g.fillRect(96, 50, 40, 3);
      g.strokeStyle = 'rgba(245,240,230,0.85)'; g.lineWidth = 1;
      for (var i = 0; i < 6; i++) {
        g.beginPath(); g.moveTo(98 + i * 7, 53);
        g.lineTo(102 + i * 5, 70); g.stroke(); }
      var c = (t % 3000) / 3000;
      var bx = 30 + c * 84, by = 100 - Math.sin(c * Math.PI) * 76;
      g.save(); g.translate(bx, by); g.rotate(t * 0.01);
      g.fillStyle = '#e8722a'; ell(g, 0, 0, 11, 11);
      g.strokeStyle = '#3a2010'; g.lineWidth = 1.2;
      g.beginPath(); g.moveTo(-11, 0); g.lineTo(11, 0);
      g.moveTo(0, -11); g.lineTo(0, 11); g.stroke();
      g.restore(); }],

    ['Ping pong', function (g, t) {
      g.fillStyle = 'rgba(20,70,120,0.4)'; g.fillRect(0, 40, W, 62);
      g.fillStyle = 'rgba(240,240,245,0.8)'; g.fillRect(0, 68, W, 2);
      g.fillStyle = '#e8e4d8'; g.fillRect(76, 52, 8, 34);
      var c = (t % 1400) / 1400;
      var bx = 30 + Math.abs(Math.sin(c * Math.PI)) * 0 + (c < 0.5 ? c * 2 * 100 : (1 - (c - 0.5) * 2) * 100);
      var by = 84 - Math.abs(Math.sin(c * Math.PI * 2)) * 34;
      g.fillStyle = '#f4f0e0'; ell(g, 30 + bx * 0.9, by, 4, 4);
      for (var s = 0; s < 2; s++) {
        var px = s ? 132 : 28;
        g.save(); g.translate(px, 70); g.rotate(s ? -0.5 + Math.sin(t * 0.01) * 0.3 : 0.5 - Math.sin(t * 0.01) * 0.3);
        g.fillStyle = '#c8302a'; ell(g, 0, -10, 10, 13);
        g.fillStyle = '#8a5a30'; g.fillRect(-2.5, 2, 5, 14);
        g.restore(); } }],

    ['Punching bag', function (g, t) {
      var sw = Math.sin(t * 0.006) * 0.28;
      g.fillStyle = 'rgba(60,60,70,0.3)'; g.fillRect(0, 0, W, H);
      g.fillStyle = '#5a5a66'; g.fillRect(0, 8, W, 5);
      g.strokeStyle = '#8a8a94'; g.lineWidth = 2;
      g.save(); g.translate(80, 13); g.rotate(sw);
      g.beginPath(); g.moveTo(0, 0); g.lineTo(0, 18); g.stroke();
      g.fillStyle = '#8a2a24';
      g.fillRect(-16, 18, 32, 62);
      g.fillStyle = '#6a1e1a'; g.fillRect(-16, 18, 32, 7); g.fillRect(-16, 74, 32, 6);
      g.fillStyle = '#a83a30'; g.fillRect(-16, 40, 32, 6);
      g.restore();
      var hit = Math.abs(Math.sin(t * 0.006)) > 0.94;
      if (hit) { g.fillStyle = 'rgba(255,220,120,0.6)';
        star(g, 80 + Math.sign(sw) * 22, 48, 14, 6, 6, t * 0.01); } }]
,
    ['Oscilloscope', function (g, t) {
      g.fillStyle = 'rgba(10,26,18,0.55)'; g.fillRect(0, 0, W, H);
      g.strokeStyle = 'rgba(90,200,140,0.22)'; g.lineWidth = 1;
      for (var i = 0; i <= 8; i++) { g.beginPath(); g.moveTo(i * 20, 0); g.lineTo(i * 20, H); g.stroke(); }
      for (var j = 0; j <= 6; j++) { g.beginPath(); g.moveTo(0, j * 20); g.lineTo(W, j * 20); g.stroke(); }
      g.strokeStyle = '#5ef08a'; g.lineWidth = 2.2;
      g.beginPath();
      for (var x = 0; x <= W; x += 2) {
        var y = 60 + Math.sin(x * 0.09 + t * 0.006) * 26 * Math.sin(t * 0.0008)
                   + Math.sin(x * 0.21 + t * 0.01) * 10;
        if (x) g.lineTo(x, y); else g.moveTo(x, y); }
      g.stroke(); }],

    ['Equaliser', function (g, t) {
      g.fillStyle = 'rgba(14,14,24,0.5)'; g.fillRect(0, 0, W, H);
      for (var b = 0; b < 16; b++) {
        var h = 12 + Math.abs(Math.sin(t * 0.004 + b * 0.7) * Math.sin(t * 0.0017 + b)) * 80;
        for (var k = 0; k < Math.floor(h / 7); k++) {
          var y = 112 - k * 7;
          g.fillStyle = k > 12 ? '#f0402c' : k > 8 ? '#f0c030' : '#3ad06a';
          g.fillRect(6 + b * 9.5, y, 7, 5); } } }],

    ['Radar sweep', function (g, t) {
      g.fillStyle = 'rgba(8,26,16,0.55)'; g.fillRect(0, 0, W, H);
      for (var r = 1; r <= 4; r++) ring(g, 80, 60, r * 13, 1, 'rgba(90,220,140,0.4)');
      seg(g, 12, 60, 148, 60, 1, 'rgba(90,220,140,0.3)');
      seg(g, 80, 8, 80, 112, 1, 'rgba(90,220,140,0.3)');
      var a = t * 0.0022;
      for (var i = 0; i < 22; i++) {
        var aa = a - i * 0.05;
        g.strokeStyle = 'rgba(120,255,170,' + (0.35 - i * 0.015) + ')'; g.lineWidth = 3;
        g.beginPath(); g.moveTo(80, 60);
        g.lineTo(80 + Math.cos(aa) * 52, 60 + Math.sin(aa) * 52); g.stroke(); }
      var blips = [[0.7, 34], [2.4, 46], [4.1, 22]];
      for (var b = 0; b < 3; b++) {
        var d = ((a - blips[b][0]) % TAU + TAU) % TAU;
        var f = Math.max(0, 1 - d / 1.6);
        g.fillStyle = 'rgba(150,255,190,' + f.toFixed(2) + ')';
        ell(g, 80 + Math.cos(blips[b][0]) * blips[b][1],
               60 + Math.sin(blips[b][0]) * blips[b][1], 3.4, 3.4); } }],

    ['ECG monitor', function (g, t) {
      g.fillStyle = 'rgba(10,18,28,0.55)'; g.fillRect(0, 0, W, H);
      g.strokeStyle = 'rgba(70,140,190,0.2)'; g.lineWidth = 1;
      for (var i = 0; i <= 8; i++) { g.beginPath(); g.moveTo(i * 20, 20); g.lineTo(i * 20, 100); g.stroke(); }
      var sweep = (t * 0.06) % W;
      g.strokeStyle = '#5ef0a0'; g.lineWidth = 2;
      g.beginPath();
      for (var x = 0; x <= W; x += 1.5) {
        var ph = ((x - sweep + W) % W) / W;
        var p = (x % 46) / 46, y = 62;
        if (p > 0.30 && p < 0.36) y = 62 - (p - 0.30) / 0.06 * 8;
        else if (p > 0.36 && p < 0.40) y = 62 - 26;
        else if (p > 0.40 && p < 0.46) y = 62 + 14;
        else if (p > 0.46 && p < 0.52) y = 62;
        if (ph > 0.9) continue;
        if (x) g.lineTo(x, y); else g.moveTo(x, y); }
      g.stroke();
      g.fillStyle = '#5ef0a0'; ell(g, sweep, 62, 2.6, 2.6);
      g.font = 'bold 11px monospace'; g.textAlign = 'left'; g.textBaseline = 'middle';
      g.fillText((70 + Math.floor(Math.sin(t * 0.001) * 6)) + ' BPM', 8, 108); }],

    ['Seismograph', function (g, t) {
      g.fillStyle = 'rgba(240,236,224,0.5)'; g.fillRect(0, 0, W, H);
      g.strokeStyle = 'rgba(180,140,120,0.4)'; g.lineWidth = 1;
      for (var i = 0; i < 5; i++) { g.beginPath(); g.moveTo(0, 20 + i * 22); g.lineTo(W, 20 + i * 22); g.stroke(); }
      var quake = Math.max(0, Math.sin(t * 0.0009)) ;
      g.strokeStyle = '#c8302a'; g.lineWidth = 1.6;
      for (var r = 0; r < 4; r++) {
        g.beginPath();
        for (var x = 0; x <= W; x += 2) {
          var amp = (r === 1 ? 1 : 0.4) * quake * 16 + 1.5;
          var y = 20 + r * 22 + Math.sin(x * 0.9 + t * 0.02 + r) * amp * Math.random();
          if (x) g.lineTo(x, y); else g.moveTo(x, y); }
        g.stroke(); }
      g.fillStyle = '#3a3a44'; g.fillRect(W - 14, 10, 8, 100);
      g.fillStyle = '#c8302a'; ell(g, W - 10, 42, 4, 4); }],

    ['Pendulum', function (g, t) {
      g.fillStyle = 'rgba(40,36,50,0.35)'; g.fillRect(0, 0, W, H);
      g.fillStyle = '#5a5a66'; g.fillRect(0, 10, W, 6);
      var a = Math.sin(t * 0.0026) * 0.9;
      g.save(); g.translate(80, 16); g.rotate(a);
      g.strokeStyle = '#c8c8d0'; g.lineWidth = 1.6;
      g.beginPath(); g.moveTo(0, 0); g.lineTo(0, 78); g.stroke();
      g.fillStyle = '#d8b040'; ell(g, 0, 84, 13, 13);
      g.fillStyle = 'rgba(255,255,255,0.35)'; ell(g, -4, 80, 4, 3);
      g.restore();
      for (var i = 1; i <= 3; i++) {
        var a2 = Math.sin(t * 0.0026 - i * 0.22) * 0.9;
        g.fillStyle = 'rgba(216,176,64,' + (0.16 - i * 0.04) + ')';
        ell(g, 80 + Math.sin(a2) * 84, 16 + Math.cos(a2) * 84, 12, 12); } }],

    ['Spinning compass', function (g, t) {
      g.fillStyle = '#c8a44a'; ell(g, 80, 60, 46, 46);
      g.fillStyle = '#f2ead2'; ell(g, 80, 60, 40, 40);
      g.fillStyle = '#3a3a44'; g.font = 'bold 11px serif';
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText('N', 80, 28); g.fillText('S', 80, 92);
      g.fillText('E', 112, 60); g.fillText('W', 48, 60);
      for (var i = 0; i < 16; i++) { g.save(); g.translate(80, 60); g.rotate(i * TAU / 16);
        g.fillStyle = '#8a7a54'; g.fillRect(-0.8, -37, 1.6, i % 4 ? 4 : 7); g.restore(); }
      var a = t * 0.004 + Math.sin(t * 0.0011) * 2;
      g.save(); g.translate(80, 60); g.rotate(a);
      g.fillStyle = '#d8342c'; poly(g, [[0, -30], [5, 0], [-5, 0]]);
      g.fillStyle = '#e8e4d8'; poly(g, [[0, 30], [5, 0], [-5, 0]]);
      g.restore();
      g.fillStyle = '#8a7a54'; ell(g, 80, 60, 3.4, 3.4); }],

    ['Sonar ping', function (g, t) {
      g.fillStyle = 'rgba(8,30,46,0.6)'; g.fillRect(0, 0, W, H);
      for (var p = 0; p < 3; p++) {
        var ph = ((t * 0.0006 + p * 0.33) % 1);
        g.strokeStyle = 'rgba(90,220,255,' + ((1 - ph) * 0.6).toFixed(2) + ')';
        g.lineWidth = 2.4;
        ring(g, 80, 74, ph * 76, 2.4, 'rgba(90,220,255,' + ((1 - ph) * 0.6).toFixed(2) + ')'); }
      g.fillStyle = '#d8d040'; ell(g, 80, 74, 6, 6);
      g.fillStyle = 'rgba(30,60,80,0.7)';
      poly(g, [[0, 120], [30, 96], [64, 118], [100, 92], [136, 116], [160, 100], [160, 120]]);
      g.fillStyle = 'rgba(140,230,255,0.7)';
      ell(g, 118, 50, 5, 3.4); ell(g, 42, 40, 4, 2.6); }],

    ['Stopwatch', function (g, t) {
      g.fillStyle = '#b8bcc4'; ell(g, 80, 64, 44, 44);
      g.fillStyle = '#8a9098'; g.fillRect(72, 12, 16, 10);
      g.fillStyle = '#c8ccd2'; g.fillRect(69, 6, 22, 8);
      g.fillStyle = '#f4f2ea'; ell(g, 80, 64, 38, 38);
      for (var i = 0; i < 12; i++) { g.save(); g.translate(80, 64); g.rotate(i * TAU / 12);
        g.fillStyle = '#3a3a44'; g.fillRect(-1, -35, 2, 6); g.restore(); }
      var a = (t * 0.0016) % TAU;
      g.save(); g.translate(80, 64); g.rotate(a);
      g.fillStyle = '#d8342c'; g.fillRect(-1.2, -32, 2.4, 36); g.restore();
      g.save(); g.translate(80, 64); g.rotate(a / 60);
      g.fillStyle = '#2a2a32'; g.fillRect(-1.6, -20, 3.2, 24); g.restore();
      g.fillStyle = '#2a2a32'; ell(g, 80, 64, 3, 3); }],

    ['Barometer', function (g, t) {
      g.fillStyle = '#8a5a30'; ell(g, 80, 60, 48, 48);
      g.fillStyle = '#f2ead6'; ell(g, 80, 60, 40, 40);
      g.fillStyle = '#3a3a44'; g.font = 'bold 8px serif';
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText('RAIN', 54, 46); g.fillText('FAIR', 80, 32); g.fillText('DRY', 106, 46);
      for (var i = 0; i < 20; i++) { g.save(); g.translate(80, 60); g.rotate(-2.2 + i * 0.23);
        g.fillStyle = '#8a7a54'; g.fillRect(-0.7, -37, 1.4, i % 5 ? 3.5 : 6); g.restore(); }
      var a = -2.2 + (Math.sin(t * 0.0007) * 0.5 + 0.5) * 4.4;
      g.save(); g.translate(80, 60); g.rotate(a);
      g.fillStyle = '#2a3a8a'; poly(g, [[0, -32], [3, 4], [-3, 4]]); g.restore();
      g.fillStyle = '#c8a44a'; ell(g, 80, 60, 4, 4); }],

    ['Campfire', function (g, t) {
      g.fillStyle = 'rgba(30,24,40,0.5)'; g.fillRect(0, 0, W, H);
      g.fillStyle = '#5a4030';
      g.save(); g.translate(80, 100); g.rotate(0.3); g.fillRect(-26, -4, 52, 8); g.restore();
      g.save(); g.translate(80, 100); g.rotate(-0.3); g.fillRect(-26, -4, 52, 8); g.restore();
      for (var i = 0; i < 7; i++) {
        var f = Math.sin(t * 0.012 + i * 1.3);
        var h = 34 + f * 14 + (3 - Math.abs(i - 3)) * 10;
        g.fillStyle = i % 2 ? 'rgba(255,150,30,0.85)' : 'rgba(255,90,20,0.8)';
        poly(g, [[62 + i * 6, 98], [66 + i * 6 + f * 3, 98 - h], [70 + i * 6, 98]]); }
      g.fillStyle = 'rgba(255,240,160,0.9)';
      poly(g, [[74, 98], [80, 98 - 30 - Math.sin(t * 0.02) * 6], [86, 98]]);
      for (var s = 0; s < 8; s++) { g.fillStyle = 'rgba(255,190,90,' + (0.6 - s * 0.06) + ')';
        ell(g, 80 + Math.sin(t * 0.006 + s * 2) * (10 + s * 3), 60 - ((t * 0.05 + s * 12) % 56), 1.6, 1.6); } }],

    ['Candle', function (g, t) {
      g.fillStyle = 'rgba(24,20,30,0.55)'; g.fillRect(0, 0, W, H);
      var c = (t % 12000) / 12000;
      var hgt = 46 - c * 14;
      g.fillStyle = '#f2ead0'; g.fillRect(66, 108 - hgt, 28, hgt);
      g.fillStyle = '#e0d8ba'; ell(g, 80, 108 - hgt, 14, 4);
      g.fillStyle = '#f6f0dc'; ell(g, 72, 108 - hgt + 14, 4, 12);
      g.fillStyle = '#3a3028'; g.fillRect(79, 108 - hgt - 7, 2, 8);
      var fl = Math.sin(t * 0.014) * 1.6;
      g.fillStyle = 'rgba(255,160,40,0.9)';
      poly(g, [[75, 108 - hgt - 6], [80 + fl, 108 - hgt - 28], [85, 108 - hgt - 6]]);
      g.fillStyle = 'rgba(255,240,180,0.95)';
      poly(g, [[77.6, 108 - hgt - 6], [80 + fl * 0.6, 108 - hgt - 19], [82.4, 108 - hgt - 6]]);
      g.fillStyle = 'rgba(255,190,90,0.10)'; ell(g, 80, 108 - hgt - 12, 40, 34); }],

    ['Fireworks', function (g, t) {
      g.fillStyle = 'rgba(10,12,28,0.55)'; g.fillRect(0, 0, W, H);
      var cols = ['#ff6a5a', '#ffd84a', '#6ae0ff', '#8aff9a', '#ff7ad0'];
      for (var b = 0; b < 3; b++) {
        var ph = ((t * 0.0005 + b * 0.37) % 1);
        var bx = 40 + b * 40, by = 34 + (b % 2) * 20;
        if (ph < 0.35) { g.fillStyle = '#ffe8a0';
          ell(g, bx, 120 - (ph / 0.35) * (120 - by), 2, 3.4); }
        else { var f = (ph - 0.35) / 0.65;
          for (var i = 0; i < 18; i++) { var a = i * TAU / 18;
            g.fillStyle = cols[b % 5];
            g.globalAlpha = Math.max(0, 1 - f);
            ell(g, bx + Math.cos(a) * f * 42, by + Math.sin(a) * f * 42 + f * f * 20, 2.2, 2.2); }
          g.globalAlpha = 1; } }
      g.fillStyle = 'rgba(14,16,32,0.8)';
      poly(g, [[0, 120], [26, 104], [58, 118], [92, 100], [126, 116], [160, 106], [160, 120]]); }],

    ['Rising balloon', function (g, t) {
      g.fillStyle = 'rgba(140,200,240,0.28)'; g.fillRect(0, 0, W, H);
      var y = 130 - ((t * 0.02) % 150);
      var x = 80 + Math.sin(t * 0.0016) * 20;
      g.strokeStyle = 'rgba(240,240,240,0.8)'; g.lineWidth = 1;
      g.beginPath(); g.moveTo(x, y + 20);
      g.quadraticCurveTo(x + 6, y + 40, x - 3, y + 58); g.stroke();
      g.fillStyle = '#e0405a'; ell(g, x, y, 18, 21);
      g.fillStyle = 'rgba(255,255,255,0.4)'; ell(g, x - 6, y - 7, 5, 7, -0.4);
      g.fillStyle = '#c02a44'; poly(g, [[x - 4, y + 20], [x + 4, y + 20], [x, y + 26]]);
      for (var c = 0; c < 3; c++) { g.fillStyle = 'rgba(255,255,255,0.7)';
        ell(g, 24 + c * 52, 24 + c * 20, 15, 8); } }],

    ['Kite', function (g, t) {
      g.fillStyle = 'rgba(150,205,240,0.3)'; g.fillRect(0, 0, W, H);
      var x = 80 + Math.sin(t * 0.0013) * 34;
      var y = 40 + Math.cos(t * 0.0021) * 16;
      var a = Math.sin(t * 0.0013) * 0.4;
      g.strokeStyle = 'rgba(230,230,230,0.85)'; g.lineWidth = 1;
      g.beginPath(); g.moveTo(x, y + 16);
      g.quadraticCurveTo(x - 10, 84, 40, 116); g.stroke();
      g.save(); g.translate(x, y); g.rotate(a);
      g.fillStyle = '#e8402c'; poly(g, [[0, -22], [16, 0], [0, 22], [-16, 0]]);
      g.fillStyle = '#f0d040'; poly(g, [[0, -22], [16, 0], [0, 0]]);
      g.fillStyle = '#3aa8d8'; poly(g, [[0, 22], [-16, 0], [0, 0]]);
      g.strokeStyle = '#2a2a32'; g.lineWidth = 1;
      g.beginPath(); g.moveTo(0, -22); g.lineTo(0, 22); g.moveTo(-16, 0); g.lineTo(16, 0); g.stroke();
      for (var b = 0; b < 4; b++) { g.fillStyle = ['#f0d040','#7ac040','#e070c0','#f08a20'][b];
        ell(g, Math.sin(t * 0.01 + b) * 5, 26 + b * 9, 4, 2.6); }
      g.restore(); }],

    ['Umbrella', function (g, t) {
      g.fillStyle = 'rgba(60,72,90,0.42)'; g.fillRect(0, 0, W, H);
      g.strokeStyle = 'rgba(170,210,245,0.75)'; g.lineWidth = 1.4;
      for (var i = 0; i < 34; i++) {
        var x = (i * 47 % 160), y = ((t * 0.24 + i * 19) % 130);
        g.beginPath(); g.moveTo(x, y); g.lineTo(x - 2, y + 9); g.stroke(); }
      var sw = Math.sin(t * 0.0022) * 3;
      g.fillStyle = '#c8302a';
      g.beginPath(); g.ellipse(80 + sw, 62, 46, 34, 0, Math.PI, TAU); g.fill();
      g.fillStyle = '#a82420';
      for (var s = 0; s < 4; s++) {
        g.beginPath(); g.moveTo(80 + sw, 62);
        g.arc(80 + sw, 62, 46, Math.PI + s * Math.PI / 4 * 2 - Math.PI / 4, Math.PI + s * Math.PI / 4 * 2);
        g.closePath(); g.fill(); }
      g.fillStyle = '#8a5a30'; g.fillRect(78 + sw, 62, 4, 46);
      g.strokeStyle = '#8a5a30'; g.lineWidth = 3;
      g.beginPath(); g.arc(72 + sw, 106, 8, 0, Math.PI); g.stroke(); }],

    ['Garden swing', function (g, t) {
      g.fillStyle = 'rgba(140,190,120,0.28)'; g.fillRect(0, 0, W, H);
      g.fillStyle = '#5a4028'; g.fillRect(0, 14, W, 7);
      var a = Math.sin(t * 0.0028) * 0.55;
      g.save(); g.translate(80, 18); g.rotate(a);
      g.strokeStyle = '#c8a870'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(-14, 0); g.lineTo(-14, 66);
      g.moveTo(14, 0); g.lineTo(14, 66); g.stroke();
      g.fillStyle = '#8a5a30'; g.fillRect(-20, 66, 40, 7);
      g.restore();
      g.fillStyle = 'rgba(60,110,50,0.5)';
      for (var b = 0; b < 5; b++) ell(g, 14 + b * 34, 116, 20, 9); }],

    ['Clothesline', function (g, t) {
      g.fillStyle = 'rgba(160,200,230,0.28)'; g.fillRect(0, 0, W, H);
      g.strokeStyle = '#c8c0b0'; g.lineWidth = 1.4;
      g.beginPath(); g.moveTo(0, 26); g.quadraticCurveTo(80, 42, 160, 26); g.stroke();
      var cols = ['#e8402c', '#f0c030', '#3aa8d8', '#7ac040', '#e070c0'];
      for (var i = 0; i < 5; i++) {
        var x = 20 + i * 30;
        var ly = 26 + Math.sin((x / 160) * Math.PI) * 16;
        var sw = Math.sin(t * 0.004 + i) * 0.22;
        g.save(); g.translate(x, ly); g.rotate(sw);
        g.fillStyle = '#a8a8b0'; g.fillRect(-2, -4, 4, 6);
        g.fillStyle = cols[i];
        if (i % 2) { g.fillRect(-11, 2, 22, 26); g.fillRect(-16, 2, 6, 12); g.fillRect(10, 2, 6, 12); }
        else { g.fillRect(-9, 2, 18, 30); g.fillStyle = 'rgba(0,0,0,0.15)'; g.fillRect(-1, 14, 2, 18); }
        g.restore(); } }],

    ['Soap bubbles', function (g, t) {
      g.fillStyle = 'rgba(150,200,225,0.25)'; g.fillRect(0, 0, W, H);
      for (var i = 0; i < 12; i++) {
        var r = 5 + (i % 4) * 5;
        var x = (i * 53 % 150) + 8 + Math.sin(t * 0.002 + i) * 12;
        var y = 130 - ((t * 0.022 * (1 + (i % 3) * 0.4) + i * 24) % 150);
        g.fillStyle = 'rgba(220,245,255,0.22)';
        ell(g, x, y, r, r);
        g.strokeStyle = 'rgba(' + (180 + (i * 30) % 75) + ',' + (200 + (i * 17) % 55) + ',255,0.75)';
        g.lineWidth = 1.4;
        ring(g, x, y, r, 1.4, 'rgba(' + (180 + (i * 30) % 75) + ',' + (200 + (i * 17) % 55) + ',255,0.75)');
        g.fillStyle = 'rgba(255,255,255,0.6)';
        ell(g, x - r * 0.4, y - r * 0.4, r * 0.2, r * 0.15); } }],

    ['Paper plane', function (g, t) {
      g.fillStyle = 'rgba(170,210,240,0.25)'; g.fillRect(0, 0, W, H);
      var x = ((t * 0.04) % 210) - 30;
      var y = 50 + Math.sin(t * 0.0022) * 22;
      var a = Math.cos(t * 0.0022) * 0.3;
      g.strokeStyle = 'rgba(240,240,245,0.4)'; g.lineWidth = 1.2;
      g.beginPath();
      for (var i = 0; i < 30; i++) {
        var px = x - i * 4, py = 50 + Math.sin((t - i * 90) * 0.0022) * 22;
        if (i) g.lineTo(px, py); else g.moveTo(px, py); }
      g.stroke();
      g.save(); g.translate(x, y); g.rotate(a);
      g.fillStyle = '#f4f2ea'; poly(g, [[22, 0], [-16, -13], [-8, 0]]);
      g.fillStyle = '#d8d4c8'; poly(g, [[22, 0], [-16, 13], [-8, 0]]);
      g.strokeStyle = '#b8b4a8'; g.lineWidth = 1;
      g.beginPath(); g.moveTo(22, 0); g.lineTo(-8, 0); g.stroke();
      g.restore(); }],

    ['Falling dominoes', function (g, t) {
      g.fillStyle = 'rgba(90,80,70,0.3)'; g.fillRect(0, 96, W, 24);
      var c = (t % 4200) / 4200;
      var front = c * 12;
      for (var i = 0; i < 11; i++) {
        var fall = Math.max(0, Math.min(1, front - i));
        g.save();
        g.translate(16 + i * 13, 96);
        g.rotate(fall * 1.35);
        g.fillStyle = '#f2ead8'; g.fillRect(-4, -30, 8, 30);
        g.fillStyle = '#2a2a32';
        ell(g, 0, -22, 1.6, 1.6); ell(g, 0, -9, 1.6, 1.6);
        g.fillRect(-4, -16, 8, 1);
        g.restore(); } }],

    ["Newton's cradle", function (g, t) {
      g.fillStyle = 'rgba(60,60,72,0.28)'; g.fillRect(0, 0, W, H);
      g.fillStyle = '#5a5a66'; g.fillRect(24, 16, 112, 6);
      g.fillRect(24, 16, 6, 90); g.fillRect(130, 16, 6, 90);
      g.fillRect(20, 104, 120, 8);
      var sw = Math.sin(t * 0.004);
      for (var i = 0; i < 5; i++) {
        var a = 0;
        if (i === 0 && sw < 0) a = sw * 0.55;
        if (i === 4 && sw > 0) a = sw * 0.55;
        g.save(); g.translate(48 + i * 16, 22); g.rotate(a);
        g.strokeStyle = '#a8a8b4'; g.lineWidth = 1;
        g.beginPath(); g.moveTo(0, 0); g.lineTo(0, 52); g.stroke();
        g.fillStyle = '#c8ccd4'; ell(g, 0, 58, 7, 7);
        g.fillStyle = 'rgba(255,255,255,0.55)'; ell(g, -2.4, 55, 2.2, 1.8);
        g.restore(); } }],

    ['Snow globe', function (g, t) {
      g.fillStyle = '#5a3a24'; poly(g, [[46, 118], [114, 118], [104, 96], [56, 96]]);
      g.fillStyle = '#7a5030'; g.fillRect(52, 92, 56, 8);
      g.fillStyle = 'rgba(200,230,245,0.28)'; ell(g, 80, 60, 42, 42);
      g.save(); g.beginPath(); g.ellipse(80, 60, 41, 41, 0, 0, TAU); g.clip();
      g.fillStyle = '#f2f6fa'; ell(g, 80, 96, 44, 16);
      g.fillStyle = '#2a6a4a';
      poly(g, [[80, 34], [94, 70], [66, 70]]);
      poly(g, [[80, 46], [98, 84], [62, 84]]);
      g.fillStyle = '#5a3a24'; g.fillRect(77, 84, 6, 10);
      for (var i = 0; i < 24; i++) {
        var x = 42 + (i * 37 % 78) + Math.sin(t * 0.002 + i) * 5;
        var y = ((t * 0.03 + i * 17) % 84) + 22;
        g.fillStyle = 'rgba(255,255,255,0.9)';
        ell(g, x, y, 1.4, 1.4); }
      g.restore();
      g.fillStyle = 'rgba(255,255,255,0.22)'; ell(g, 64, 42, 12, 8, -0.6); }],

    ['Lava flow', function (g, t) {
      g.fillStyle = 'rgba(30,16,14,0.6)'; g.fillRect(0, 0, W, H);
      for (var l = 0; l < 4; l++) {
        g.fillStyle = ['rgba(255,90,20,0.85)', 'rgba(255,140,30,0.8)',
                       'rgba(255,200,60,0.7)', 'rgba(180,40,10,0.8)'][l];
        g.beginPath();
        g.moveTo(0, 60 + l * 12);
        for (var x = 0; x <= W; x += 8) {
          g.lineTo(x, 60 + l * 12 + Math.sin(x * 0.06 + t * 0.002 + l) * 6
                        + Math.sin(x * 0.13 - t * 0.003) * 3); }
        g.lineTo(W, 120); g.lineTo(0, 120); g.closePath(); g.fill(); }
      for (var r = 0; r < 7; r++) { g.fillStyle = 'rgba(60,40,36,0.85)';
        ell(g, (r * 43 % 150) + 8, 74 + (r % 3) * 14, 7, 4); }
      for (var s = 0; s < 8; s++) { g.fillStyle = 'rgba(255,190,80,' + (0.6 - s * 0.06) + ')';
        ell(g, 20 + s * 18 + Math.sin(t * 0.005 + s) * 6, 60 - ((t * 0.04 + s * 11) % 46), 1.8, 1.8); } }],

    ['Solar eclipse', function (g, t) {
      var c = (t % 11000) / 11000;
      g.fillStyle = 'rgba(20,22,40,' + (0.25 + Math.max(0, 1 - Math.abs(c - 0.5) * 4) * 0.4) + ')';
      g.fillRect(0, 0, W, H);
      g.fillStyle = 'rgba(255,220,120,0.30)'; ell(g, 80, 56, 42, 42);
      g.fillStyle = '#ffd85a'; ell(g, 80, 56, 28, 28);
      var mx = 80 + (c * 2 - 1) * 88;
      g.fillStyle = '#1a1c24'; ell(g, mx, 56, 28, 28);
      if (Math.abs(c - 0.5) < 0.06) {
        for (var i = 0; i < 22; i++) { var a = i * TAU / 22;
          g.strokeStyle = 'rgba(255,240,190,0.5)'; g.lineWidth = 1.6;
          g.beginPath();
          g.moveTo(80 + Math.cos(a) * 29, 56 + Math.sin(a) * 29);
          g.lineTo(80 + Math.cos(a) * (38 + Math.sin(i) * 5), 56 + Math.sin(a) * (38 + Math.sin(i) * 5));
          g.stroke(); } }
      for (var s = 0; s < 14; s++) { g.fillStyle = 'rgba(255,255,255,0.5)';
        ell(g, (s * 61 % 156) + 3, (s * 31 % 40) + 4, 1.2, 1.2); } }]
,
    ['Water ripples', function (g, t) {
      g.fillStyle = 'rgba(24,84,120,0.45)'; g.fillRect(0, 0, W, H);
      var drops = [[54, 46, 0], [104, 72, 0.45], [76, 96, 0.78]];
      for (var d = 0; d < 3; d++) {
        for (var r = 0; r < 3; r++) {
          var ph = ((t * 0.0006 + drops[d][2] + r * 0.33) % 1);
          g.strokeStyle = 'rgba(180,235,255,' + ((1 - ph) * 0.55).toFixed(2) + ')';
          g.lineWidth = 1.8;
          g.beginPath();
          g.ellipse(drops[d][0], drops[d][1], ph * 46, ph * 16, 0, 0, TAU);
          g.stroke(); } }
      for (var i = 0; i < 5; i++) {
        g.fillStyle = 'rgba(150,220,250,0.18)';
        g.fillRect(0, 20 + i * 22 + Math.sin(t * 0.002 + i) * 3, W, 3); } }]
  ];

  /* 100 more scenes through the 3D engine — objects and places, not
     only solids. Names checked against every other channel. */
  var G3B = [
    ['House', function (g, t) {
      var m = geo('house', function () { return mergeC([
        part(boxGeo(0, 0.4, 0, 1.5, 0.9, 1.1), [216, 200, 172]),
        part(boxGeo(0, -0.65, 0, 1.65, 0.12, 1.25), [140, 120, 96]),
        part(boxGeo(0.9, 1.6, 0, 0.22, 0.55, 0.22), [170, 90, 70]),
        part(boxGeo(0, 1.35, 0, 1.62, 0.1, 1.2), [176, 84, 62]),
        part(boxGeo(0, 1.0, 0, 1.2, 0.5, 0.85), [196, 96, 72]),
        part(boxGeo(0, -0.1, 1.12, 0.3, 0.5, 0.02), [110, 78, 52]),
        part(boxGeo(-0.75, 0.5, 1.12, 0.28, 0.28, 0.02), [140, 200, 230]),
        part(boxGeo(0.75, 0.5, 1.12, 0.28, 0.28, 0.02), [140, 200, 230])
      ]); });
      obj(g, m, 0.24, t * 0.0009, 0, 30, 1); }],

    ['Castle', function (g, t) {
      var m = geo('castle', function () {
        var ps = [part(boxGeo(0, -0.2, 0, 1.6, 0.7, 0.5), [178, 176, 168])], i;
        for (i = 0; i < 2; i++) {
          var x = i ? 1.5 : -1.5;
          ps.push(part(cylGeo(x, 0.1, 0, 0.42, 0.46, 1.8, 8), [190, 188, 180]));
          ps.push(part(boxGeo(x, 1.15, 0, 0.5, 0.12, 0.5), [150, 148, 142]));
          ps.push(part(cylGeo(x, 1.6, 0, 0.02, 0.5, 0.7, 8), [150, 70, 60]));
        }
        for (i = 0; i < 5; i++) ps.push(part(boxGeo(-0.9 + i * 0.45, 0.62, 0, 0.16, 0.18, 0.5), [178, 176, 168]));
        ps.push(part(boxGeo(0, -0.45, 0.52, 0.28, 0.45, 0.02), [80, 56, 40]));
        return mergeC(ps);
      });
      obj(g, m, 0.2, t * 0.0008, 0, 27, 1); }],

    ['Obelisk', function (g, t) {
      var m = geo('obel', function () { return mergeC([
        part(boxGeo(0, -1.5, 0, 0.9, 0.16, 0.9), [190, 180, 150]),
        part(boxGeo(0, -1.2, 0, 0.7, 0.14, 0.7), [204, 194, 162]),
        part(cylGeo(0, 0.15, 0, 0.28, 0.44, 2.5, 4), [222, 206, 160]),
        part(cylGeo(0, 1.6, 0, 0.01, 0.28, 0.5, 4), [240, 214, 120])
      ]); });
      obj(g, m, 0.16, t * 0.0013, 0, 27, 1); }],

    ['Water wheel', function (g, t) {
      var i, ps = [part(boxGeo(-1.6, -0.4, 0, 0.5, 1.1, 0.5), [120, 88, 56])];
      for (i = 0; i < 10; i++) {
        var a = i * TAU / 10 + t * 0.0016;
        ps.push(part(boxGeo(Math.cos(a) * 1.15, Math.sin(a) * 1.15, 0, 0.34, 0.1, 0.5), [150, 108, 66]));
      }
      ps.push(part(cylGeo(0, 0, 0, 0.16, 0.16, 1.2, 8, 'z'), [96, 70, 46]));
      obj(g, mergeC(ps), 0.14, 0.35, 0, 27, 1);
      var m2 = mergeC([part(boxGeo(0, -1.5, 0, 2.2, 0.14, 0.9), [60, 130, 170])]);
      obj(g, m2, 0.14, 0.35, 0, 27, 0); }],

    ['Space capsule', function (g, t) {
      var m = geo('caps', function () { return mergeC([
        part(cylGeo(0, 0, 0, 0.55, 1.0, 1.5, 12), [200, 202, 208]),
        part(cylGeo(0, -0.86, 0, 1.0, 0.9, 0.22, 12), [120, 96, 70]),
        part(sphGeo(0, 0.85, 0, 0.5, 6, 10), [130, 190, 220]),
        part(boxGeo(1.5, 0.1, 0, 0.9, 0.06, 0.5), [40, 70, 150]),
        part(boxGeo(-1.5, 0.1, 0, 0.9, 0.06, 0.5), [40, 70, 150])
      ]); });
      obj(g, m, Math.sin(t * 0.0009) * 0.3, t * 0.0012, Math.sin(t * 0.0007) * 0.2, 28, 1); }],

    ['Car', function (g, t) {
      var m = geo('car', function () {
        var ps = [
          part(boxGeo(0, -0.1, 0, 1.6, 0.34, 0.7), [200, 60, 52]),
          part(boxGeo(-0.1, 0.42, 0, 0.85, 0.32, 0.62), [180, 48, 42]),
          part(boxGeo(-0.1, 0.42, 0.63, 0.7, 0.22, 0.02), [140, 200, 230]),
          part(boxGeo(1.55, -0.05, 0, 0.08, 0.14, 0.5), [240, 235, 200])
        ], i;
        for (i = 0; i < 4; i++) ps.push(part(cylGeo((i < 2 ? 1 : -1) * 1.0, -0.42,
          (i % 2 ? 1 : -1) * 0.72, 0.32, 0.32, 0.2, 9, 'z'), [40, 40, 46]));
        return mergeC(ps);
      });
      obj(g, m, 0.22, t * 0.0013, 0, 28, 1); }],

    ['Delivery truck', function (g, t) {
      var m = geo('truck', function () {
        var ps = [
          part(boxGeo(-0.45, 0.25, 0, 1.15, 0.75, 0.75), [235, 230, 220]),
          part(boxGeo(0.95, -0.05, 0, 0.62, 0.45, 0.7), [60, 110, 190]),
          part(boxGeo(1.2, 0.2, 0.5, 0.3, 0.2, 0.22), [150, 205, 230]),
          part(boxGeo(0, -0.5, 0, 1.75, 0.12, 0.7), [50, 50, 58])
        ], i;
        for (i = 0; i < 4; i++) ps.push(part(cylGeo((i < 2 ? 1.0 : -0.85), -0.62,
          (i % 2 ? 1 : -1) * 0.74, 0.3, 0.3, 0.18, 9, 'z'), [36, 36, 42]));
        return mergeC(ps);
      });
      obj(g, m, 0.2, t * 0.0011, 0, 26, 1); }],

    ['Monorail', function (g, t) {
      var i, ps = [];
      for (i = 0; i < 3; i++) {
        var z = ((t * 0.0016 + i * 0.7) % 3) - 1.5;
        ps.push(part(boxGeo(0, 0.15, z * 2.2, 0.5, 0.4, 0.95), [225, 225, 232]));
        ps.push(part(boxGeo(0, 0.3, z * 2.2 + 0.5, 0.42, 0.2, 0.45), [90, 180, 220]));
      }
      ps.push(part(boxGeo(0, -0.45, 0, 0.22, 0.22, 4.2), [140, 140, 150]));
      obj(g, mergeC(ps), 0.3, 0.6 + Math.sin(t * 0.0005) * 0.15, 0, 26, 1); }],

    ['Tugboat', function (g, t) {
      var m = geo('boat', function () { return mergeC([
        part(boxGeo(0, -0.35, 0, 1.5, 0.35, 0.7), [190, 60, 55]),
        part(boxGeo(0, -0.05, 0, 1.35, 0.3, 0.62), [235, 230, 220]),
        part(boxGeo(-0.3, 0.42, 0, 0.55, 0.42, 0.5), [235, 230, 220]),
        part(cylGeo(0.45, 0.55, 0, 0.16, 0.2, 0.8, 8), [40, 44, 52]),
        part(boxGeo(-0.3, 0.5, 0.52, 0.4, 0.2, 0.02), [140, 200, 230])
      ]); });
      var rk = Math.sin(t * 0.0026) * 0.14;
      obj(g, m, 0.2 + rk, t * 0.001, rk * 0.5, 28, 1); }],

    ['Airliner', function (g, t) {
      var m = geo('plane', function () { return mergeC([
        part(cylGeo(0, 0, 0, 0.34, 0.3, 3.2, 10, 'x'), [238, 238, 244]),
        part(boxGeo(0, 0, 0, 0.5, 0.05, 2.2), [220, 220, 228]),
        part(boxGeo(-1.3, 0, 0, 0.25, 0.04, 0.9), [220, 220, 228]),
        part(boxGeo(-1.45, 0.35, 0, 0.2, 0.35, 0.05), [200, 60, 60]),
        part(cylGeo(0.1, -0.2, 0.95, 0.16, 0.16, 0.5, 8, 'x'), [120, 130, 150]),
        part(cylGeo(0.1, -0.2, -0.95, 0.16, 0.16, 0.5, 8, 'x'), [120, 130, 150])
      ]); });
      obj(g, m, Math.sin(t * 0.0008) * 0.2, t * 0.0011, Math.sin(t * 0.0012) * 0.25, 26, 1); }],

    ['Armchair', function (g, t) {
      var m = geo('chair', function () { return mergeC([
        part(boxGeo(0, -0.15, 0, 0.9, 0.2, 0.85), [180, 70, 90]),
        part(boxGeo(0, 0.55, -0.75, 0.9, 0.7, 0.14), [200, 84, 104]),
        part(boxGeo(-1.0, 0.2, 0, 0.14, 0.4, 0.85), [190, 78, 96]),
        part(boxGeo(1.0, 0.2, 0, 0.14, 0.4, 0.85), [190, 78, 96]),
        part(boxGeo(-0.75, -0.65, 0.6, 0.1, 0.35, 0.1), [90, 62, 40]),
        part(boxGeo(0.75, -0.65, 0.6, 0.1, 0.35, 0.1), [90, 62, 40]),
        part(boxGeo(-0.75, -0.65, -0.6, 0.1, 0.35, 0.1), [90, 62, 40]),
        part(boxGeo(0.75, -0.65, -0.6, 0.1, 0.35, 0.1), [90, 62, 40])
      ]); });
      obj(g, m, 0.28, t * 0.0011, 0, 30, 1); }],

    ['Desk lamp', function (g, t) {
      var m = geo('lamp', function () { return mergeC([
        part(cylGeo(0, -1.2, 0, 0.75, 0.8, 0.18, 12), [70, 74, 84]),
        part(cylGeo(-0.2, -0.4, 0, 0.09, 0.09, 1.5, 8), [110, 116, 128]),
        part(cylGeo(0.55, 0.5, 0, 0.09, 0.09, 1.3, 8), [110, 116, 128]),
        part(cylGeo(0.95, 1.15, 0, 0.55, 0.22, 0.6, 12), [240, 200, 90])
      ]); });
      obj(g, m, 0.18, t * 0.0012, 0, 27, 1); }],

    ['Bookshelf', function (g, t) {
      var m = geo('shelf', function () {
        var ps = [
          part(boxGeo(-1.15, 0, 0, 0.1, 1.5, 0.45), [130, 92, 58]),
          part(boxGeo(1.15, 0, 0, 0.1, 1.5, 0.45), [130, 92, 58])
        ], i, k;
        for (i = 0; i < 4; i++) ps.push(part(boxGeo(0, -1.1 + i * 0.72, 0, 1.15, 0.07, 0.45), [150, 108, 68]));
        var cols = [[200, 70, 60], [70, 130, 190], [230, 190, 80], [90, 170, 110], [170, 100, 190]];
        for (i = 0; i < 3; i++) for (k = 0; k < 7; k++)
          ps.push(part(boxGeo(-0.95 + k * 0.3, -0.75 + i * 0.72, 0, 0.11, 0.28, 0.34),
                       cols[(i * 7 + k) % 5]));
        return mergeC(ps);
      });
      obj(g, m, 0.2, 0.5 + Math.sin(t * 0.0007) * 0.4, 0, 27, 1); }],

    ["Rubik's cube", function (g, t) {
      var m = geo('rubik', function () {
        var ps = [], x, y, z;
        var cols = [[220, 60, 50], [240, 240, 240], [40, 110, 200], [240, 180, 40], [60, 170, 90], [250, 130, 40]];
        for (x = -1; x <= 1; x++) for (y = -1; y <= 1; y++) for (z = -1; z <= 1; z++) {
          ps.push(part(boxGeo(x * 0.7, y * 0.7, z * 0.7, 0.32, 0.32, 0.32),
                       cols[(x + y * 2 + z * 3 + 9) % 6]));
        }
        return mergeC(ps);
      });
      obj(g, m, t * 0.0011, t * 0.0016, 0, 26, 1); }],

    ['Robot', function (g, t) {
      var sw = Math.sin(t * 0.004);
      var ps = [
        part(boxGeo(0, 0.15, 0, 0.6, 0.75, 0.4), [150, 156, 170]),
        part(boxGeo(0, 1.25, 0, 0.45, 0.4, 0.4), [180, 186, 200]),
        part(boxGeo(-0.18, 1.3, 0.42, 0.12, 0.1, 0.02), [90, 240, 200]),
        part(boxGeo(0.18, 1.3, 0.42, 0.12, 0.1, 0.02), [90, 240, 200]),
        part(cylGeo(0, 1.75, 0, 0.05, 0.05, 0.4, 6), [120, 126, 140]),
        part(sphGeo(0, 2.0, 0, 0.12, 5, 8), [240, 90, 80]),
        part(boxGeo(-0.85, 0.3 + sw * 0.2, 0, 0.18, 0.55, 0.18), [160, 166, 180]),
        part(boxGeo(0.85, 0.3 - sw * 0.2, 0, 0.18, 0.55, 0.18), [160, 166, 180]),
        part(boxGeo(-0.3, -0.95, 0, 0.2, 0.5, 0.2), [120, 126, 140]),
        part(boxGeo(0.3, -0.95, 0, 0.2, 0.5, 0.2), [120, 126, 140])
      ];
      obj(g, mergeC(ps), 0.16, t * 0.0013, 0, 26, 1); }],

    ['Diamond', function (g, t) {
      var m = geo('gem', function () {
        var V = [[0, -1.5, 0]], F = [], i, n = 10;
        for (i = 0; i < n; i++) { var a = i * TAU / n;
          V.push([Math.cos(a) * 1.1, 0.1, Math.sin(a) * 1.1]); }
        for (i = 0; i < n; i++) { var a2 = i * TAU / n + TAU / n / 2;
          V.push([Math.cos(a2) * 0.72, 0.85, Math.sin(a2) * 0.72]); }
        V.push([0, 0.95, 0]);
        for (i = 0; i < n; i++) F.push([0, 1 + i, 1 + (i + 1) % n]);
        for (i = 0; i < n; i++) { F.push([1 + i, 1 + n + i, 1 + (i + 1) % n]);
          F.push([1 + (i + 1) % n, 1 + n + i, 1 + n + (i + 1) % n]); }
        for (i = 0; i < n; i++) F.push([1 + n + i, 1 + 2 * n, 1 + n + (i + 1) % n]);
        var C = []; for (i = 0; i < F.length; i++) C.push([120 + (i * 37) % 100, 210, 245]);
        return { V: V, F: F, C: C };
      });
      obj(g, m, 0.1, t * 0.0018, 0, 32, 1); }],

    ['Crown', function (g, t) {
      var m = geo('crown', function () {
        var ps = [part(cylGeo(0, -0.5, 0, 1.0, 1.0, 0.5, 12), [235, 195, 70])], i;
        for (i = 0; i < 8; i++) { var a = i * TAU / 8;
          ps.push(part(cylGeo(Math.cos(a) * 1.0, 0.15, Math.sin(a) * 1.0, 0.02, 0.16, 0.85, 4), [240, 205, 80]));
          ps.push(part(sphGeo(Math.cos(a) * 1.0, 0.62, Math.sin(a) * 1.0, 0.14, 5, 7),
                       i % 2 ? [220, 60, 70] : [70, 150, 220])); }
        return mergeC(ps);
      });
      obj(g, m, 0.28, t * 0.0014, 0, 30, 1); }],

    ['Chess king', function (g, t) {
      var m = geo('king', function () { return mergeC([
        part(cylGeo(0, -1.35, 0, 0.62, 0.75, 0.25, 12), [235, 230, 218]),
        part(cylGeo(0, -0.55, 0, 0.26, 0.5, 1.35, 12), [242, 238, 226]),
        part(cylGeo(0, 0.35, 0, 0.5, 0.28, 0.4, 12), [235, 230, 218]),
        part(sphGeo(0, 0.85, 0, 0.4, 6, 10), [242, 238, 226]),
        part(boxGeo(0, 1.4, 0, 0.09, 0.3, 0.09), [220, 200, 140]),
        part(boxGeo(0, 1.4, 0, 0.24, 0.09, 0.09), [220, 200, 140])
      ]); });
      obj(g, m, 0.14, t * 0.0013, 0, 28, 1); }],

    ['Chess knight', function (g, t) {
      var m = geo('knight', function () { return mergeC([
        part(cylGeo(0, -1.3, 0, 0.6, 0.72, 0.28, 12), [60, 58, 62]),
        part(cylGeo(0, -0.75, 0, 0.35, 0.5, 0.85, 12), [70, 68, 72]),
        part(boxGeo(0, -0.1, 0.05, 0.34, 0.5, 0.5), [80, 78, 84]),
        part(boxGeo(0.15, 0.5, 0.25, 0.3, 0.32, 0.55), [86, 84, 90]),
        part(boxGeo(0.3, 0.6, 0.6, 0.22, 0.2, 0.25), [86, 84, 90]),
        part(boxGeo(-0.05, 0.95, -0.1, 0.1, 0.28, 0.14), [60, 58, 62])
      ]); });
      obj(g, m, 0.14, t * 0.0012, 0, 28, 1); }],

    ['Barrel', function (g, t) {
      var m = geo('barrel', function () { return mergeC([
        part(cylGeo(0, 0, 0, 0.85, 0.85, 2.0, 12), [150, 100, 58]),
        part(cylGeo(0, 0.6, 0, 0.92, 0.92, 0.18, 12), [90, 92, 100]),
        part(cylGeo(0, -0.6, 0, 0.92, 0.92, 0.18, 12), [90, 92, 100]),
        part(cylGeo(0, 1.0, 0, 0.8, 0.8, 0.08, 12), [120, 80, 46])
      ]); });
      obj(g, m, 0.3, t * 0.0014, 0, 30, 1); }],

    ['Crate stack', function (g, t) {
      var m = geo('crates', function () {
        var ps = [], spec = [[-0.7, -1.0, 0], [0.7, -1.0, 0], [0, 0, 0], [-0.6, 1.0, 0.2]], i;
        for (i = 0; i < 4; i++) {
          ps.push(part(boxGeo(spec[i][0], spec[i][1], spec[i][2], 0.62, 0.5, 0.62), [176, 130, 74]));
          ps.push(part(boxGeo(spec[i][0], spec[i][1], spec[i][2] + 0.63, 0.62, 0.08, 0.02), [130, 92, 48]));
        }
        return mergeC(ps);
      });
      obj(g, m, 0.22, t * 0.001, 0, 27, 1); }],

    ['Colonnade', function (g, t) {
      var m = geo('cols', function () {
        var ps = [part(boxGeo(0, -1.35, 0, 2.4, 0.14, 0.8), [214, 208, 190]),
                  part(boxGeo(0, 1.25, 0, 2.4, 0.16, 0.8), [214, 208, 190])], i;
        for (i = 0; i < 5; i++) {
          var x = -1.8 + i * 0.9;
          ps.push(part(cylGeo(x, 0, 0, 0.26, 0.3, 2.4, 10), [232, 226, 208]));
          ps.push(part(cylGeo(x, 1.1, 0, 0.4, 0.34, 0.16, 10), [214, 208, 190]));
        }
        return mergeC(ps);
      });
      obj(g, m, 0.16, t * 0.0007, 0, 24, 1); }],

    ['Stone arch', function (g, t) {
      var m = geo('arch', function () {
        var ps = [], i, n = 11;
        for (i = 0; i < n; i++) {
          var a = Math.PI * (i / (n - 1));
          ps.push(part(boxGeo(-Math.cos(a) * 1.3, Math.sin(a) * 1.3 - 0.2, 0, 0.26, 0.3, 0.5),
                       [190 + (i % 3) * 12, 182, 164]));
        }
        ps.push(part(boxGeo(0, -1.35, 0, 1.9, 0.16, 0.6), [160, 152, 138]));
        return mergeC(ps);
      });
      obj(g, m, 0.18, t * 0.001, 0, 30, 1); }],

    ['Carousel', function (g, t) {
      var i, ps = [
        part(cylGeo(0, 1.15, 0, 0.1, 1.7, 0.5, 12), [210, 70, 80]),
        part(cylGeo(0, -1.2, 0, 1.7, 1.7, 0.16, 12), [230, 220, 200]),
        part(cylGeo(0, 0, 0, 0.12, 0.12, 2.4, 8), [180, 150, 90])
      ];
      for (i = 0; i < 6; i++) {
        var a = i * TAU / 6 + t * 0.0016;
        var y = -0.5 + Math.sin(t * 0.005 + i) * 0.25;
        ps.push(part(boxGeo(Math.cos(a) * 1.25, y, Math.sin(a) * 1.25, 0.28, 0.2, 0.14),
                     i % 2 ? [240, 230, 220] : [190, 130, 90]));
        ps.push(part(cylGeo(Math.cos(a) * 1.25, y + 0.75, Math.sin(a) * 1.25, 0.04, 0.04, 1.5, 6), [200, 180, 120]));
      }
      obj(g, mergeC(ps), 0.26, 0.3, 0, 26, 1); }],

    ['Wind turbine', function (g, t) {
      var i, ps = [
        part(cylGeo(0, -0.3, 0, 0.14, 0.26, 3.0, 10), [235, 235, 238]),
        part(boxGeo(0, 1.25, 0, 0.2, 0.16, 0.3), [220, 220, 224])
      ];
      for (i = 0; i < 3; i++) {
        var a = i * TAU / 3 + t * 0.004;
        ps.push(part(boxGeo(Math.cos(a) * 0.85, 1.25 + Math.sin(a) * 0.85, 0.3,
                            0.08 + Math.abs(Math.cos(a)) * 0.75, 0.08 + Math.abs(Math.sin(a)) * 0.75, 0.04),
                     [246, 246, 250]));
      }
      obj(g, mergeC(ps), 0.12, 0.4 + Math.sin(t * 0.0005) * 0.2, 0, 26, 1); }],
    ['Palm tree', function (g, t) {
      var i, ps = [], sw = Math.sin(t * 0.0018) * 0.12;
      for (i = 0; i < 6; i++) {
        var f = i / 6;
        ps.push(part(cylGeo(Math.sin(f * 1.2 + sw) * 0.5, -1.4 + i * 0.5, 0,
                            0.16 - f * 0.05, 0.2 - f * 0.05, 0.55, 8), [140, 100, 60]));
      }
      for (i = 0; i < 7; i++) {
        var a = i * TAU / 7 + sw;
        ps.push(part(boxGeo(Math.sin(1.2 + sw) * 0.5 + Math.cos(a) * 0.9, 1.5,
                            Math.sin(a) * 0.9, 0.75, 0.05, 0.22), [60, 150, 70]));
      }
      obj(g, mergeC(ps), 0.14, t * 0.0009, 0, 26, 1); }],

    ['Flower 3D', function (g, t) {
      var i, ps = [part(cylGeo(0, -0.9, 0, 0.08, 0.1, 1.8, 8), [60, 140, 60])];
      var op = 0.6 + Math.sin(t * 0.0016) * 0.4;
      for (i = 0; i < 8; i++) {
        var a = i * TAU / 8;
        ps.push(part(sphGeo(Math.cos(a) * 0.7 * op, 0.9 + (1 - op) * 0.4, Math.sin(a) * 0.7 * op,
                            0.34, 5, 8), [235, 90, 150]));
      }
      ps.push(part(sphGeo(0, 1.0, 0, 0.3, 6, 9), [245, 200, 70]));
      ps.push(part(boxGeo(0.6, -0.5, 0, 0.45, 0.05, 0.18), [70, 160, 70]));
      obj(g, mergeC(ps), 0.16, t * 0.0012, 0, 28, 0); }],

    ['Coral', function (g, t) {
      var m = geo('coral', function () {
        var ps = [];
        (function grow(x, y, z, r, d) {
          if (d === 0) return;
          ps.push(part(sphGeo(x, y, z, r, 5, 7), [240, 110 + d * 20, 140]));
          for (var i = 0; i < 3; i++) {
            var a = i * TAU / 3 + d;
            grow(x + Math.cos(a) * r * 1.6, y + r * 1.5, z + Math.sin(a) * r * 1.6, r * 0.6, d - 1);
          }
        }(0, -1.2, 0, 0.42, 4));
        return mergeC(ps);
      });
      obj(g, m, 0.1, t * 0.001, 0, 24, 0); }],

    ['Jellyfish', function (g, t) {
      var i, ps = [], pulse = 1 + Math.sin(t * 0.004) * 0.18;
      ps.push(part(sphGeo(0, 0.5, 0, 1.0 * pulse, 7, 12), [220, 150, 235]));
      for (i = 0; i < 8; i++) {
        var a = i * TAU / 8;
        for (var k = 0; k < 4; k++) {
          ps.push(part(sphGeo(Math.cos(a) * (0.7 + k * 0.12) + Math.sin(t * 0.003 + k) * 0.15,
                              -0.3 - k * 0.5,
                              Math.sin(a) * (0.7 + k * 0.12), 0.1, 4, 6), [200, 130, 220]));
        }
      }
      obj(g, mergeC(ps), 0.16, t * 0.0009, 0, 26, 0); }],

    ['Bird flock', function (g, t) {
      var i, ps = [];
      for (i = 0; i < 16; i++) {
        var f = i / 16;
        var x = Math.sin(t * 0.0012 + f * 6) * 1.8 + (f - 0.5) * 1.2;
        var y = Math.cos(t * 0.0015 + f * 5) * 1.0;
        var z = Math.sin(t * 0.0009 + f * 4) * 1.6;
        var fl = Math.sin(t * 0.02 + i) * 0.5;
        ps.push(part(boxGeo(x, y, z, 0.05, 0.05, 0.05), [40, 44, 56]));
        ps.push(part(boxGeo(x - 0.22, y + fl * 0.2, z, 0.22, 0.03, 0.06), [60, 64, 78]));
        ps.push(part(boxGeo(x + 0.22, y - fl * 0.2, z, 0.22, 0.03, 0.06), [60, 64, 78]));
      }
      obj(g, mergeC(ps), 0.1, 0.2, 0, 28, 0); }],

    ['Fish school', function (g, t) {
      var i, ps = [];
      for (i = 0; i < 22; i++) {
        var a = i * 2.399 + t * 0.0016;
        var r = 0.5 + (i % 5) * 0.3;
        var x = Math.cos(a) * r * 1.6, z = Math.sin(a) * r * 1.6;
        var y = Math.sin(t * 0.002 + i) * 0.8;
        ps.push(part(boxGeo(x, y, z, 0.24, 0.1, 0.1), [230, 150 + (i % 4) * 22, 60]));
        ps.push(part(boxGeo(x - 0.3, y, z, 0.1, 0.14, 0.03), [200, 120, 50]));
      }
      obj(g, mergeC(ps), 0.2, t * 0.0007, 0, 26, 0); }],

    ['Butterfly', function (g, t) {
      var fl = Math.sin(t * 0.008);
      var ps = [part(cylGeo(0, 0, 0, 0.08, 0.1, 1.1, 8), [50, 40, 40])];
      for (var s = 0; s < 2; s++) {
        var sd = s ? 1 : -1;
        var open = 0.35 + Math.abs(fl) * 0.65;
        ps.push(part(boxGeo(sd * 0.7 * open, 0.3, Math.abs(fl) * 0.5 * sd, 0.62 * open, 0.42, 0.04),
                     [240, 130, 60]));
        ps.push(part(boxGeo(sd * 0.55 * open, -0.35, Math.abs(fl) * 0.4 * sd, 0.45 * open, 0.3, 0.04),
                     [220, 90, 50]));
      }
      obj(g, mergeC(ps), 0.24 + Math.sin(t * 0.001) * 0.2, t * 0.0013, 0, 30, 0); }],

    ['Snowflake 3D', function (g, t) {
      var V = [[0, 0, 0]], E = [], i, k;
      for (i = 0; i < 6; i++) {
        var a = i * TAU / 6;
        var base = V.length;
        V.push([Math.cos(a) * 1.6, Math.sin(a) * 1.6, 0]);
        E.push([0, base]);
        for (k = 1; k <= 3; k++) {
          var px = Math.cos(a) * k * 0.4, py = Math.sin(a) * k * 0.4;
          V.push([px + Math.cos(a + 1) * 0.35, py + Math.sin(a + 1) * 0.35, 0]);
          V.push([px + Math.cos(a - 1) * 0.35, py + Math.sin(a - 1) * 0.35, 0]);
          E.push([base, V.length - 2]); E.push([base, V.length - 1]);
        }
      }
      wire(g, xform(V, Math.sin(t * 0.0009) * 0.6, t * 0.0013, 0), E, 30, '190,235,255', 2); }],

    ['Rain 3D', function (g, t) {
      var V = [], E = [], i;
      for (i = 0; i < 60; i++) {
        var x = ((i * 37) % 40) / 10 - 2, z = ((i * 53) % 40) / 10 - 2;
        var y = 2 - (((t * 0.004 + i * 0.17) % 4));
        V.push([x, y, z]); V.push([x, y - 0.35, z]);
        E.push([i * 2, i * 2 + 1]);
      }
      wire(g, xform(V, 0.25, t * 0.0003, 0), E, 30, '150,215,255', 1.8); }],

    ['Smoke plume', function (g, t) {
      var i, ps = [];
      for (i = 0; i < 18; i++) {
        var f = ((t * 0.0004 + i * 0.055) % 1);
        var r = 0.16 + f * 0.9;
        ps.push(part(sphGeo(Math.sin(f * 5 + i) * f * 1.2, -1.6 + f * 3.2,
                            Math.cos(f * 4 + i) * f * 0.9, r, 4, 6),
                     [200 - f * 90, 200 - f * 90, 210 - f * 80]));
      }
      obj(g, mergeC(ps), 0.1, t * 0.0006, 0, 26, 0); }],

    ['Fire 3D', function (g, t) {
      var i, ps = [];
      for (i = 0; i < 20; i++) {
        var f = ((t * 0.0011 + i * 0.05) % 1);
        var r = 0.5 * (1 - f) + 0.08;
        ps.push(part(sphGeo(Math.sin(f * 7 + i) * f * 0.6, -1.3 + f * 2.6,
                            Math.cos(f * 6 + i) * f * 0.5, r, 4, 6),
                     [255, 200 - f * 150, 60 - f * 50]));
      }
      obj(g, mergeC(ps), 0.08, t * 0.0009, 0, 28, 0); }],

    ['Volcano', function (g, t) {
      var m = geo('volc', function () { return mergeC([
        part(cylGeo(0, -0.6, 0, 0.55, 2.0, 1.8, 12), [90, 74, 66]),
        part(cylGeo(0, 0.32, 0, 0.5, 0.55, 0.12, 12), [50, 40, 36])
      ]); });
      obj(g, m, 0.2, t * 0.0006, 0, 26, 0);
      var i, ps = [];
      for (i = 0; i < 14; i++) {
        var f = ((t * 0.0009 + i * 0.07) % 1);
        var a = i * 2.399;
        ps.push(part(sphGeo(Math.cos(a) * f * 1.4, 0.4 + f * 1.9 - f * f * 2.2,
                            Math.sin(a) * f * 1.4, 0.13, 4, 6),
                     [255, 150 - f * 100, 40]));
      }
      obj(g, mergeC(ps), 0.2, t * 0.0006, 0, 26, 0); }],

    ['Iceberg', function (g, t) {
      var m = geo('berg', function () { return mergeC([
        part(cylGeo(0, 0.7, 0, 0.15, 1.1, 1.5, 7), [225, 240, 250]),
        part(cylGeo(0.5, 0.3, 0.3, 0.1, 0.6, 1.0, 6), [235, 246, 252]),
        part(cylGeo(0, -1.1, 0, 1.7, 1.0, 2.0, 8), [130, 190, 220])
      ]); });
      obj(g, m, 0.2 + Math.sin(t * 0.0018) * 0.05, t * 0.0009, 0, 26, 0); }],

    ['Mountain range', function (g, t) {
      var m = geo('mtn', function () {
        var ps = [], i;
        for (i = 0; i < 6; i++) {
          var x = -2.2 + i * 0.9, h = 1.0 + ((i * 7) % 5) * 0.28;
          ps.push(part(cylGeo(x, -0.6 + h / 2, ((i * 13) % 5) * 0.3 - 0.6, 0.02, 0.7, h, 4),
                       [110 + (i % 3) * 14, 108, 104]));
        }
        return mergeC(ps);
      });
      obj(g, m, 0.16, t * 0.0005, 0, 26, 0); }],

    ['Dune field', function (g, t) {
      var m = geo('grdD', function () { return gGrid(14, 0.3); });
      var V = [], i;
      for (i = 0; i < m.V.length; i++) {
        var p = m.V[i];
        V.push([p[0], Math.sin(p[0] * 1.6 + t * 0.0009) * 0.42 + Math.sin(p[2] * 0.9) * 0.3, p[2]]);
      }
      wire(g, xform(V, 0.55, t * 0.0003, 0), m.E, 34, '235,200,130', 1.3); }],

    ['Ocean swell', function (g, t) {
      var m = geo('grdO', function () { return gGrid(16, 0.26); });
      var V = [], i;
      for (i = 0; i < m.V.length; i++) {
        var p = m.V[i], d = Math.hypot(p[0], p[2]);
        V.push([p[0], Math.sin(p[0] * 2.2 + t * 0.004) * 0.22 +
                      Math.sin(d * 2.6 - t * 0.003) * 0.28, p[2]]);
      }
      wire(g, xform(V, 0.5, t * 0.0002, 0), m.E, 34, '90,190,235', 1.3); }],

    ['Geodesic dome', function (g, t) {
      var m = geo('geod', function () {
        var ico = gIcosa(), V = [], E = [], i, k;
        for (i = 0; i < ico.F.length; i++) {
          var f = ico.F[i], base = V.length;
          for (k = 0; k < 3; k++) {
            var a = ico.V[f[k]], b = ico.V[f[(k + 1) % 3]];
            var mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
            var L = Math.hypot(mid[0], mid[1], mid[2]) || 1;
            V.push([mid[0] / L * 1.9, mid[1] / L * 1.9, mid[2] / L * 1.9]);
          }
          E.push([base, base + 1]); E.push([base + 1, base + 2]); E.push([base + 2, base]);
        }
        return { V: V, E: E };
      });
      wire(g, xform(m.V, 0.3, t * 0.0011, 0), m.E, 28, '150,235,200', 1.6); }],

    ['Football', function (g, t) {
      var m = geo('ball', function () {
        var ico = gIcosa(), V = [], F = [], C = [], i, k;
        for (i = 0; i < ico.F.length; i++) {
          var f = ico.F[i], base = V.length;
          var cx2 = 0, cy2 = 0, cz2 = 0;
          for (k = 0; k < 3; k++) { cx2 += ico.V[f[k]][0]; cy2 += ico.V[f[k]][1]; cz2 += ico.V[f[k]][2]; }
          for (k = 0; k < 3; k++) {
            var v = ico.V[f[k]];
            var px = v[0] * 0.62 + cx2 / 3 * 0.38, py = v[1] * 0.62 + cy2 / 3 * 0.38,
                pz = v[2] * 0.62 + cz2 / 3 * 0.38;
            var L = Math.hypot(px, py, pz) || 1;
            V.push([px / L * 1.7, py / L * 1.7, pz / L * 1.7]);
          }
          F.push([base, base + 1, base + 2]);
          C.push(i % 3 === 0 ? [30, 30, 36] : [244, 244, 240]);
        }
        return { V: V, F: F, C: C };
      });
      obj(g, m, t * 0.0013, t * 0.0018, 0, 30, 1); }],

    ['Atom', function (g, t) {
      var i, k, ps = [part(sphGeo(0, 0, 0, 0.5, 6, 9), [240, 110, 70])];
      for (i = 0; i < 3; i++) {
        var a = t * (0.004 + i * 0.0012) + i * 2.1;
        var tilt = i * TAU / 3;
        var x = Math.cos(a) * 1.7, y = Math.sin(a) * 1.7;
        var rx2 = x, ry2 = y * Math.cos(tilt), rz2 = y * Math.sin(tilt);
        ps.push(part(sphGeo(rx2, ry2, rz2, 0.2, 5, 7), [110, 200, 245]));
      }
      obj(g, mergeC(ps), 0.2, t * 0.0007, 0, 28, 0);
      for (i = 0; i < 3; i++) {
        var V = [], E = [], tilt2 = i * TAU / 3;
        for (k = 0; k < 30; k++) {
          var aa = k / 30 * TAU;
          var x2 = Math.cos(aa) * 1.7, y2 = Math.sin(aa) * 1.7;
          V.push([x2, y2 * Math.cos(tilt2), y2 * Math.sin(tilt2)]);
          E.push([k, (k + 1) % 30]);
        }
        wire(g, xform(V, 0.2, t * 0.0007, 0), E, 28, '120,200,240', 1.2);
      } }],

    ['Water molecule', function (g, t) {
      var m = geo('h2o', function () { return mergeC([
        part(sphGeo(0, 0, 0, 0.85, 7, 10), [220, 70, 60]),
        part(sphGeo(1.25, 0.85, 0, 0.5, 6, 9), [240, 240, 246]),
        part(sphGeo(-1.25, 0.85, 0, 0.5, 6, 9), [240, 240, 246]),
        part(cylGeo(0.62, 0.42, 0, 0.12, 0.12, 1.5, 6), [180, 180, 190]),
        part(cylGeo(-0.62, 0.42, 0, 0.12, 0.12, 1.5, 6), [180, 180, 190])
      ]); });
      obj(g, m, Math.sin(t * 0.0011) * 0.4, t * 0.0014, 0, 26, 0); }],

    ['Crystal lattice', function (g, t) {
      var m = geo('latt', function () {
        var ps = [], x, y, z;
        for (x = -1; x <= 1; x++) for (y = -1; y <= 1; y++) for (z = -1; z <= 1; z++) {
          ps.push(part(sphGeo(x * 1.1, y * 1.1, z * 1.1, 0.22, 4, 6),
                       (x + y + z) % 2 ? [90, 160, 240] : [240, 200, 90]));
        }
        return mergeC(ps);
      });
      obj(g, m, t * 0.0009, t * 0.0013, 0, 26, 0);
      var c = geo('cub', gCube);
      var V = c.V.map(function (p) { return [p[0] * 1.1, p[1] * 1.1, p[2] * 1.1]; });
      wire(g, xform(V, t * 0.0009, t * 0.0013, 0), c.E, 26, '160,180,210', 1); }],

    ['Buckyball', function (g, t) {
      var m = geo('bucky', function () {
        var ico = gIcosa(), V = [], E = [], i, k;
        for (i = 0; i < ico.E.length; i++) {
          var a = ico.V[ico.E[i][0]], b = ico.V[ico.E[i][1]];
          for (k = 1; k <= 2; k++) {
            var f = k / 3;
            var p = [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
            var L = Math.hypot(p[0], p[1], p[2]) || 1;
            V.push([p[0] / L * 1.8, p[1] / L * 1.8, p[2] / L * 1.8]);
          }
        }
        return { V: V, E: autoEdges(V, 0.35) };
      });
      wire(g, xform(m.V, t * 0.0009, t * 0.0013, 0), m.E, 28, '140,240,180', 1.5); }],

    ['Solar system', function (g, t) {
      var i, ps = [part(sphGeo(0, 0, 0, 0.6, 7, 10), [250, 200, 60])];
      var cols = [[190, 150, 120], [230, 180, 110], [80, 150, 230], [210, 100, 70]];
      for (i = 0; i < 4; i++) {
        var a = t * (0.0028 - i * 0.0005) + i * 1.9, r = 1.0 + i * 0.55;
        ps.push(part(sphGeo(Math.cos(a) * r, 0, Math.sin(a) * r, 0.14 + i * 0.04, 5, 8), cols[i]));
      }
      obj(g, mergeC(ps), 0.55, t * 0.0004, 0, 27, 0);
      for (i = 0; i < 4; i++) {
        var V = [], E = [], k, r2 = 1.0 + i * 0.55;
        for (k = 0; k < 36; k++) { var aa = k / 36 * TAU;
          V.push([Math.cos(aa) * r2, 0, Math.sin(aa) * r2]); E.push([k, (k + 1) % 36]); }
        wire(g, xform(V, 0.55, t * 0.0004, 0), E, 27, '150,170,200', 1);
      } }],

    ['Asteroid field', function (g, t) {
      var m = geo('rocks', function () {
        var ps = [], i;
        for (i = 0; i < 22; i++) {
          var a = i * 2.399, r = 0.5 + (i % 6) * 0.42;
          ps.push(part(boxGeo(Math.cos(a) * r * 1.6, ((i * 17) % 9) / 9 * 2 - 1,
                              Math.sin(a) * r * 1.6, 0.14 + (i % 3) * 0.08,
                              0.12 + (i % 4) * 0.06, 0.15 + (i % 2) * 0.1),
                       [120 + (i % 4) * 18, 112, 100]));
        }
        return mergeC(ps);
      });
      obj(g, m, t * 0.0005, t * 0.0011, t * 0.0003, 26, 0); }],

    ['Wormhole', function (g, t) {
      var V = [], E = [], i, k, rings = 16, seg = 16;
      for (i = 0; i < rings; i++) {
        var f = i / rings;
        var z = ((f * 6 + t * 0.0022) % 6) - 3;
        var r = 0.35 + Math.abs(z) * 0.55;
        var base = V.length;
        for (k = 0; k < seg; k++) {
          var a = k / seg * TAU + z * 0.5;
          V.push([Math.cos(a) * r, Math.sin(a) * r, z]);
          E.push([base + k, base + (k + 1) % seg]);
        }
      }
      wire(g, xform(V, 0.1, 0.1, 0), E, 40, '180,120,255', 1.6); }]
,
    ['Planetary gears', function (g, t) {
      var i, ps = [], mk = function (cx2, cy2, r, teeth, rot, col) {
        var out = [part(cylGeo(cx2, cy2, 0, r, r, 0.3, 12), col)], k;
        for (k = 0; k < teeth; k++) { var a = k * TAU / teeth + rot;
          out.push(part(boxGeo(cx2 + Math.cos(a) * (r + 0.14), cy2 + Math.sin(a) * (r + 0.14), 0,
                               0.1, 0.1, 0.15), col)); }
        return out;
      };
      ps = ps.concat(mk(0, 0, 0.5, 8, t * 0.004, [220, 180, 70]));
      for (i = 0; i < 3; i++) {
        var a = i * TAU / 3 + t * 0.0016;
        ps = ps.concat(mk(Math.cos(a) * 1.15, Math.sin(a) * 1.15, 0.4, 7, -t * 0.005, [150, 190, 230]));
      }
      obj(g, mergeC(ps), 0.32, Math.sin(t * 0.0006) * 0.3, 0, 30, 1); }],

    ['Orrery', function (g, t) {
      var i, ps = [part(cylGeo(0, -1.0, 0, 0.12, 0.6, 1.4, 10), [180, 150, 90]),
                   part(sphGeo(0, 0.2, 0, 0.34, 6, 9), [250, 200, 60])];
      for (i = 0; i < 3; i++) {
        var a = t * (0.0032 - i * 0.0008) + i * 2, r = 0.75 + i * 0.5;
        ps.push(part(cylGeo(0, 0.2, 0, 0.03, 0.03, r * 2, 5, 'x'), [200, 175, 120]));
        ps.push(part(sphGeo(Math.cos(a) * r, 0.2, Math.sin(a) * r, 0.13, 5, 7),
                     [[130, 190, 240], [220, 150, 90], [160, 220, 150]][i]));
      }
      obj(g, mergeC(ps), 0.42, t * 0.0006, 0, 28, 0); }],

    ['Clock movement', function (g, t) {
      var ps = [part(cylGeo(0, 0, -0.2, 1.7, 1.7, 0.16, 16), [214, 208, 190])];
      var mk = function (cx2, cy2, r, teeth, rot, col) {
        var out = [part(cylGeo(cx2, cy2, 0, r, r, 0.16, 12), col)], k;
        for (k = 0; k < teeth; k++) { var a = k * TAU / teeth + rot;
          out.push(part(boxGeo(cx2 + Math.cos(a) * (r + 0.1), cy2 + Math.sin(a) * (r + 0.1), 0,
                               0.07, 0.07, 0.08), col)); }
        return out;
      };
      ps = ps.concat(mk(-0.55, 0.3, 0.42, 9, t * 0.003, [200, 170, 90]));
      ps = ps.concat(mk(0.5, -0.2, 0.32, 7, -t * 0.005, [180, 190, 200]));
      ps.push(part(boxGeo(0, 0, 0.3, 0.05, 1.2, 0.03), [60, 60, 70]));
      ps.push(part(boxGeo(0, 0, 0.34, 0.8, 0.05, 0.03), [60, 60, 70]));
      obj(g, mergeC(ps), 0.16, Math.sin(t * 0.0005) * 0.4, 0, 30, 1); }],

    ['Piston engine', function (g, t) {
      var i, ps = [], ph = t * 0.005;
      for (i = 0; i < 3; i++) {
        var x = -1.2 + i * 1.2;
        var y = Math.sin(ph + i * 2.1) * 0.45;
        ps.push(part(boxGeo(x, 0.6, 0, 0.32, 0.7, 0.32), [130, 136, 148]));
        ps.push(part(boxGeo(x, y + 0.3, 0, 0.26, 0.22, 0.26), [220, 150, 60]));
        ps.push(part(cylGeo(x, y - 0.35, 0, 0.07, 0.07, 0.9, 6), [190, 194, 204]));
      }
      ps.push(part(cylGeo(0, -1.0, 0, 0.2, 0.2, 3.0, 10, 'x'), [90, 96, 108]));
      obj(g, mergeC(ps), 0.2, 0.5 + Math.sin(t * 0.0006) * 0.25, 0, 28, 1); }],

    ['Conveyor belt', function (g, t) {
      var i, ps = [
        part(boxGeo(0, -0.55, 0, 2.2, 0.1, 0.7), [70, 74, 84]),
        part(cylGeo(-2.2, -0.55, 0, 0.35, 0.35, 0.7, 10, 'z'), [110, 116, 128]),
        part(cylGeo(2.2, -0.55, 0, 0.35, 0.35, 0.7, 10, 'z'), [110, 116, 128])
      ];
      for (i = 0; i < 4; i++) {
        var x = ((t * 0.0016 + i * 0.25) % 1) * 4.4 - 2.2;
        ps.push(part(boxGeo(x, -0.15, 0, 0.3, 0.3, 0.3),
                     [[220, 90, 80], [90, 180, 220], [240, 200, 80], [130, 210, 130]][i]));
      }
      obj(g, mergeC(ps), 0.24, 0.4, 0, 27, 1); }],

    ['Roller coaster', function (g, t) {
      var V = [], E = [], i, n = 90;
      for (i = 0; i < n; i++) {
        var u = i / n * TAU;
        V.push([Math.cos(u) * 2.0, Math.sin(u * 2) * 0.9 + Math.sin(u * 3) * 0.4, Math.sin(u) * 1.4]);
        E.push([i, (i + 1) % n]);
      }
      wire(g, xform(V, 0.35, t * 0.0007, 0), E, 26, '210,120,90', 2.2);
      var ps = [], k;
      for (k = 0; k < 3; k++) {
        var u2 = ((t * 0.0009 + k * 0.03) % 1) * TAU;
        ps.push(part(boxGeo(Math.cos(u2) * 2.0, Math.sin(u2 * 2) * 0.9 + Math.sin(u2 * 3) * 0.4 + 0.16,
                            Math.sin(u2) * 1.4, 0.16, 0.12, 0.16),
                     k ? [230, 210, 90] : [220, 70, 70]));
      }
      obj(g, mergeC(ps), 0.35, t * 0.0007, 0, 26, 0); }],

    ['Ferris frame', function (g, t) {
      var i, V = [], E = [], n = 14;
      for (i = 0; i < n; i++) {
        var a = i * TAU / n + t * 0.0012;
        V.push([Math.cos(a) * 1.9, Math.sin(a) * 1.9, 0]);
        V.push([Math.cos(a) * 1.9, Math.sin(a) * 1.9, 0.7]);
        E.push([i * 2, i * 2 + 1]);
        E.push([i * 2, ((i + 1) % n) * 2]);
        E.push([i * 2 + 1, ((i + 1) % n) * 2 + 1]);
      }
      wire(g, xform(V, 0.2, Math.sin(t * 0.0005) * 0.4, 0), E, 26, '160,220,255', 1.6);
      var ps = [];
      for (i = 0; i < n; i++) {
        var a2 = i * TAU / n + t * 0.0012;
        ps.push(part(boxGeo(Math.cos(a2) * 1.9, Math.sin(a2) * 1.9 - 0.28, 0.35, 0.16, 0.14, 0.16),
                     [[230, 80, 70], [240, 200, 70], [90, 180, 230], [130, 210, 130]][i % 4]));
      }
      obj(g, mergeC(ps), 0.2, Math.sin(t * 0.0005) * 0.4, 0, 26, 0); }],

    ['Spinning top', function (g, t) {
      var wob = Math.sin(t * 0.006) * 0.16;
      var m = geo('top', function () { return mergeC([
        part(cylGeo(0, 0.35, 0, 0.9, 0.9, 0.35, 14), [220, 70, 90]),
        part(cylGeo(0, -0.35, 0, 0.05, 0.9, 1.05, 14), [240, 200, 80]),
        part(cylGeo(0, 0.8, 0, 0.12, 0.12, 0.6, 8), [180, 186, 200])
      ]); });
      obj(g, m, wob, t * 0.03, wob * 0.6, 30, 0); }],

    ['Yo-yo', function (g, t) {
      var c = (t % 2200) / 2200;
      var drop = Math.sin(c * Math.PI) * 1.8;
      var ps = [
        part(cylGeo(0, 1.6, 0, 0.06, 0.06, 0.1, 6), [200, 200, 210]),
        part(boxGeo(0, 1.6 - drop / 2, 0, 0.03, drop / 2, 0.03), [230, 230, 235]),
        part(cylGeo(0, 1.5 - drop, 0.22, 0.7, 0.7, 0.2, 12), [230, 80, 90]),
        part(cylGeo(0, 1.5 - drop, -0.22, 0.7, 0.7, 0.2, 12), [230, 80, 90]),
        part(cylGeo(0, 1.5 - drop, 0, 0.2, 0.2, 0.45, 8, 'z'), [240, 200, 80])
      ];
      obj(g, mergeC(ps), 0.2, t * 0.02, 0, 28, 0); }],

    ['Slinky', function (g, t) {
      var V = [], E = [], i, n = 100;
      for (i = 0; i < n; i++) {
        var u = i / n;
        var stretch = 1 + Math.sin(t * 0.003) * 0.5;
        V.push([Math.cos(u * TAU * 7) * 1.0,
                (u * 2.6 - 1.3) * stretch,
                Math.sin(u * TAU * 7) * 1.0]);
        if (i) E.push([i - 1, i]);
      }
      wire(g, xform(V, 0.25, t * 0.0009, 0), E, 28, '200,205,215', 2.4); }],

    ['Chain links', function (g, t) {
      var i, k, V = [], E = [], n = 6;
      for (i = 0; i < n; i++) {
        var base = V.length;
        var y = (i - (n - 1) / 2) * 0.72;
        var sw = Math.sin(t * 0.002 + i * 0.5) * 0.25;
        for (k = 0; k < 18; k++) {
          var a = k / 18 * TAU;
          var px = Math.cos(a) * 0.45, pz = Math.sin(a) * 0.28;
          if (i % 2) V.push([px + sw, y, pz]);
          else V.push([pz + sw, y, px]);
          E.push([base + k, base + (k + 1) % 18]);
        }
      }
      wire(g, xform(V, 0.2, t * 0.001, 0), E, 30, '190,196,210', 2); }],

    ['Figure-eight knot', function (g, t) {
      var m = geo('fig8', function () {
        var V = [], E = [], i, n = 140;
        for (i = 0; i < n; i++) {
          var u = i / n * TAU;
          V.push([(2 + Math.cos(2 * u)) * Math.cos(3 * u) * 0.5,
                  (2 + Math.cos(2 * u)) * Math.sin(3 * u) * 0.5,
                  Math.sin(4 * u) * 0.6]);
          E.push([i, (i + 1) % n]);
        }
        return { V: V, E: E };
      });
      wire(g, xform(m.V, t * 0.0011, t * 0.0014, 0), m.E, 26, '255,170,90', 2.4); }],

    ['Torus stack', function (g, t) {
      var i, ps = [];
      for (i = 0; i < 4; i++) {
        var m = gTorus(14, 8, 1.3 - i * 0.22, 0.28);
        var V = m.V.map(function (p) { return [p[0], p[1] + (i - 1.5) * 0.6, p[2]]; });
        ps.push(part({ V: V, F: m.F },
                     [[230, 80, 90], [240, 190, 80], [110, 200, 130], [110, 170, 240]][i]));
      }
      obj(g, mergeC(ps), 0.45, t * 0.0013, 0, 27, 0); }],

    ['Sphere packing', function (g, t) {
      var m = geo('pack', function () {
        var ps = [], x, y, z;
        for (x = -1; x <= 1; x++) for (y = -1; y <= 1; y++) for (z = -1; z <= 1; z++) {
          if (Math.abs(x) + Math.abs(y) + Math.abs(z) > 2) continue;
          ps.push(part(sphGeo(x * 0.9, y * 0.9, z * 0.9, 0.45, 5, 8),
                       [200 - Math.abs(x) * 40, 140 + Math.abs(y) * 50, 230 - Math.abs(z) * 60]));
        }
        return mergeC(ps);
      });
      obj(g, m, t * 0.0009, t * 0.0012, 0, 28, 0); }],

    ['Cantor dust', function (g, t) {
      var m = geo('cantor', function () {
        var ps = [];
        (function div(x, y, z, s, d) {
          if (d === 0) { ps.push(part(boxGeo(x, y, z, s, s, s), [220, 210, 240])); return; }
          for (var i = -1; i <= 1; i += 2) for (var j = -1; j <= 1; j += 2)
            for (var k = -1; k <= 1; k += 2)
              div(x + i * s * 0.66, y + j * s * 0.66, z + k * s * 0.66, s / 3, d - 1);
        }(0, 0, 0, 0.9, 2));
        return mergeC(ps);
      });
      obj(g, m, t * 0.0008, t * 0.0012, 0, 26, 1); }],

    ['Impossible triangle', function (g, t) {
      var m = geo('penrose', function () {
        var ps = [], i, k;
        for (i = 0; i < 3; i++) {
          var a = i * TAU / 3;
          for (k = 0; k < 4; k++) {
            var f = k / 4;
            ps.push(part(boxGeo(Math.cos(a) * 1.3 + Math.cos(a + 2.09) * (f * 1.6 - 0.8),
                                Math.sin(a) * 1.3 + Math.sin(a + 2.09) * (f * 1.6 - 0.8),
                                0, 0.24, 0.24, 0.24),
                         [200 - i * 30, 170 + i * 20, 230 - i * 40]));
          }
        }
        return mergeC(ps);
      });
      obj(g, m, 0.2, t * 0.0009, t * 0.0005, 28, 1); }],

    ['Neon grid', function (g, t) {
      var V = [], E = [], i, n = 12;
      for (i = 0; i <= n; i++) {
        var z = ((i * 0.5 + t * 0.0024) % 6) - 3;
        var base = V.length;
        V.push([-3, 0, z]); V.push([3, 0, z]);
        E.push([base, base + 1]);
      }
      for (i = -6; i <= 6; i++) {
        var base2 = V.length;
        V.push([i * 0.5, 0, -3]); V.push([i * 0.5, 0, 3]);
        E.push([base2, base2 + 1]);
      }
      wire(g, xform(V, 0.75, 0, 0), E, 32, '255,80,200', 1.6);
      var s = geo('sunS', function () { return gSphere(8, 12, 1.1); });
      var V2 = s.V.map(function (p) { return [p[0], p[1] * 0.9 + 1.4, p[2] - 3]; });
      solid(g, xform(V2, 0, 0, 0), s.F, 32, [255, 140, 60], 0); }],

    ['City blocks', function (g, t) {
      var m = geo('city', function () {
        var ps = [], x, z;
        for (x = -2; x <= 2; x++) for (z = -2; z <= 2; z++) {
          var h = 0.3 + ((x * 7 + z * 13 + 20) % 9) * 0.22;
          ps.push(part(boxGeo(x * 0.75, -1.2 + h, z * 0.75, 0.28, h, 0.28),
                       [110 + ((x + z) % 3) * 22, 118, 140]));
        }
        return mergeC(ps);
      });
      obj(g, m, 0.42, t * 0.0007, 0, 26, 1); }],

    ['Skyscraper', function (g, t) {
      var m = geo('tower', function () {
        var ps = [], i;
        for (i = 0; i < 7; i++) {
          var w = 0.85 - i * 0.09;
          ps.push(part(boxGeo(0, -1.5 + i * 0.52, 0, w, 0.24, w),
                       [150 + i * 8, 160 + i * 8, 185 + i * 6]));
        }
        ps.push(part(cylGeo(0, 2.3, 0, 0.03, 0.05, 0.9, 6), [220, 220, 230]));
        return mergeC(ps);
      });
      obj(g, m, 0.14, t * 0.0011, 0, 26, 1); }],

    ['Fountain', function (g, t) {
      var i, ps = [
        part(cylGeo(0, -1.2, 0, 1.7, 1.8, 0.3, 14), [200, 196, 186]),
        part(cylGeo(0, -0.6, 0, 0.3, 0.5, 0.9, 10), [214, 210, 200]),
        part(cylGeo(0, 0.05, 0, 0.9, 0.6, 0.16, 12), [200, 196, 186])
      ];
      for (i = 0; i < 16; i++) {
        var a = i * TAU / 16;
        var f = ((t * 0.0016 + i * 0.06) % 1);
        var r = f * 1.5;
        ps.push(part(sphGeo(Math.cos(a) * r, 0.9 - f * f * 2.4, Math.sin(a) * r, 0.1, 4, 6),
                     [130, 200, 240]));
      }
      obj(g, mergeC(ps), 0.3, t * 0.0007, 0, 26, 0); }],

    ['Maze', function (g, t) {
      var m = geo('maze', function () {
        var ps = [], x, z;
        for (x = -3; x <= 3; x++) for (z = -3; z <= 3; z++) {
          if (((x * 5 + z * 11 + 33) % 7) > 3) continue;
          ps.push(part(boxGeo(x * 0.5, -0.6, z * 0.5, 0.22, 0.42, 0.22), [170, 150, 200]));
        }
        ps.push(part(boxGeo(0, -1.1, 0, 1.9, 0.08, 1.9), [90, 84, 110]));
        return mergeC(ps);
      });
      obj(g, m, 0.55, t * 0.0008, 0, 28, 1); }],

    ['Domino run 3D', function (g, t) {
      var i, ps = [], front = ((t % 5000) / 5000) * 14;
      for (i = 0; i < 13; i++) {
        var fall = Math.max(0, Math.min(1, front - i));
        var a = fall * 1.4;
        var x = -2.2 + i * 0.38;
        ps.push(part(boxGeo(x + Math.sin(a) * 0.3, -0.6 + Math.cos(a) * 0.4, 0,
                            0.06 + Math.sin(a) * 0.3, 0.42 * Math.cos(a) + 0.06, 0.22),
                     [238, 234, 224]));
      }
      ps.push(part(boxGeo(0, -1.05, 0, 2.6, 0.06, 0.4), [110, 96, 84]));
      obj(g, mergeC(ps), 0.28, 0.35, 0, 27, 1); }],

    ['Pendulum wave', function (g, t) {
      var i, ps = [part(boxGeo(0, 1.6, 0, 2.2, 0.06, 0.06), [120, 126, 140])];
      for (i = 0; i < 11; i++) {
        var len = 1.0 + i * 0.09;
        var a = Math.sin(t * 0.0022 * (1 + i * 0.045)) * 0.55;
        var x = -1.9 + i * 0.38;
        ps.push(part(sphGeo(x + Math.sin(a) * len, 1.6 - Math.cos(a) * len, 0, 0.14, 5, 7),
                     [240 - i * 12, 120 + i * 10, 90 + i * 14]));
      }
      obj(g, mergeC(ps), 0.12, Math.sin(t * 0.0004) * 0.3, 0, 28, 0); }],

    ['Infinity mirror', function (g, t) {
      var i, k;
      for (i = 10; i > 0; i--) {
        var f = i / 10;
        var V = [], E = [], z = -i * 0.55 + ((t * 0.0018) % 0.55);
        for (k = 0; k < 4; k++) {
          var a = k * TAU / 4 + Math.PI / 4;
          V.push([Math.cos(a) * 1.7 * f, Math.sin(a) * 1.7 * f, z]);
          E.push([k, (k + 1) % 4]);
        }
        wire(g, xform(V, 0, 0, t * 0.0006), E, 34,
             i % 2 ? '255,90,190' : '90,220,255', 2.2);
      } }],

    ['Sound bars 3D', function (g, t) {
      var i, k, ps = [];
      for (i = 0; i < 6; i++) for (k = 0; k < 6; k++) {
        var h = 0.12 + Math.abs(Math.sin(t * 0.004 + i * 0.6 + k * 0.4)) * 1.1;
        ps.push(part(boxGeo((i - 2.5) * 0.5, -1.2 + h, (k - 2.5) * 0.5, 0.18, h, 0.18),
                     [90 + h * 120, 220 - h * 60, 140]));
      }
      obj(g, mergeC(ps), 0.42, t * 0.0007, 0, 27, 1); }],

    ['Rotating letters', function (g, t) {
      var i, ps = [];
      var pat = [[0,0],[0,1],[0,2],[1,2],[2,2]];
      for (i = 0; i < pat.length; i++)
        ps.push(part(boxGeo((pat[i][0] - 1) * 0.5, (1 - pat[i][1]) * 0.5, 0, 0.22, 0.22, 0.22),
                     [240, 90, 160]));
      obj(g, mergeC(ps), Math.sin(t * 0.001) * 0.5, t * 0.0018, 0, 30, 1); }]
,
    ['Dinosaur', function (g, t) {
      var sw = Math.sin(t * 0.003);
      var ps = [
        part(sphGeo(0, 0, 0, 0.85, 6, 9), [110, 160, 90]),
        part(cylGeo(-1.3, 0.35, 0, 0.18, 0.4, 1.6, 8, 'x'), [120, 170, 95]),
        part(cylGeo(1.1, 0.75, 0, 0.22, 0.4, 1.5, 8), [120, 170, 95]),
        part(sphGeo(1.25, 1.55, 0, 0.34, 5, 8), [130, 180, 100]),
        part(boxGeo(1.55, 1.5, 0, 0.22, 0.12, 0.16), [130, 180, 100]),
        part(cylGeo(-0.4, -0.85 + sw * 0.08, 0.4, 0.16, 0.2, 0.9, 6), [100, 150, 82]),
        part(cylGeo(-0.4, -0.85 - sw * 0.08, -0.4, 0.16, 0.2, 0.9, 6), [100, 150, 82]),
        part(cylGeo(0.5, -0.85 - sw * 0.08, 0.4, 0.16, 0.2, 0.9, 6), [100, 150, 82]),
        part(cylGeo(0.5, -0.85 + sw * 0.08, -0.4, 0.16, 0.2, 0.9, 6), [100, 150, 82])
      ];
      obj(g, mergeC(ps), 0.16, t * 0.001, 0, 26, 1); }],

    ['Whale', function (g, t) {
      var sw = Math.sin(t * 0.0026);
      var ps = [
        part(sphGeo(0, 0, 0, 1.35, 7, 11), [70, 110, 160]),
        part(sphGeo(-1.1, 0, 0, 0.7, 5, 8), [66, 104, 152]),
        part(boxGeo(-2.0, sw * 0.25, 0, 0.5, 0.08, 0.6), [60, 96, 142]),
        part(boxGeo(0.3, -0.5, 0.9, 0.5, 0.08, 0.3), [64, 100, 148]),
        part(boxGeo(0.3, -0.5, -0.9, 0.5, 0.08, 0.3), [64, 100, 148]),
        part(sphGeo(0.4, -0.9, 0, 1.0, 5, 9), [210, 220, 230]),
        part(sphGeo(1.0, 0.35, 0.4, 0.1, 4, 6), [20, 20, 26])
      ];
      obj(g, mergeC(ps), 0.14 + sw * 0.05, t * 0.001, 0, 24, 0); }],

    ['Beetle', function (g, t) {
      var lg = Math.sin(t * 0.008);
      var ps = [
        part(sphGeo(0, 0, 0, 1.0, 6, 10), [50, 90, 60]),
        part(sphGeo(0.9, 0.15, 0, 0.45, 5, 8), [40, 70, 48]),
        part(boxGeo(0, 0.6, 0, 0.05, 0.35, 0.9), [30, 55, 38]),
        part(cylGeo(1.35, 0.4, 0.15, 0.03, 0.05, 0.7, 5, 'x'), [30, 50, 36]),
        part(cylGeo(1.35, 0.4, -0.15, 0.03, 0.05, 0.7, 5, 'x'), [30, 50, 36])
      ], i;
      for (i = 0; i < 6; i++) {
        var sd = i < 3 ? 1 : -1, k = i % 3;
        ps.push(part(cylGeo(-0.5 + k * 0.5, -0.7 + lg * 0.1 * (k % 2 ? 1 : -1), sd * 0.9,
                            0.05, 0.07, 0.7, 5), [35, 60, 42]));
      }
      obj(g, mergeC(ps), 0.34, t * 0.0011, 0, 26, 1); }],

    ['Ant', function (g, t) {
      var lg = Math.sin(t * 0.01);
      var ps = [
        part(sphGeo(-1.0, 0, 0, 0.62, 5, 8), [110, 50, 30]),
        part(sphGeo(0, 0, 0, 0.4, 5, 8), [120, 56, 34]),
        part(sphGeo(0.85, 0.1, 0, 0.48, 5, 8), [130, 62, 38]),
        part(cylGeo(1.3, 0.6, 0.15, 0.03, 0.04, 0.8, 5), [90, 44, 26]),
        part(cylGeo(1.3, 0.6, -0.15, 0.03, 0.04, 0.8, 5), [90, 44, 26])
      ], i;
      for (i = 0; i < 6; i++) {
        var sd = i < 3 ? 1 : -1, k = i % 3;
        ps.push(part(cylGeo(-0.3 + k * 0.4, -0.5 + lg * 0.12 * (k % 2 ? 1 : -1), sd * 0.6,
                            0.04, 0.05, 0.85, 5), [95, 46, 28]));
      }
      obj(g, mergeC(ps), 0.3, t * 0.0013, 0, 26, 1); }],

    ['Spider', function (g, t) {
      var i, ps = [
        part(sphGeo(-0.5, 0, 0, 0.75, 6, 9), [50, 44, 56]),
        part(sphGeo(0.55, 0.05, 0, 0.45, 5, 8), [62, 54, 68])
      ];
      for (i = 0; i < 8; i++) {
        var sd = i < 4 ? 1 : -1, k = i % 4;
        var a = -0.5 + k * 0.35, lift = Math.sin(t * 0.006 + i) * 0.2;
        ps.push(part(cylGeo(Math.cos(a) * 0.9, 0.2 + lift, sd * 0.8, 0.05, 0.06, 1.0, 5), [56, 48, 62]));
        ps.push(part(cylGeo(Math.cos(a) * 1.5, -0.4 + lift, sd * 1.4, 0.04, 0.05, 1.0, 5), [50, 44, 56]));
      }
      ps.push(part(sphGeo(0.85, 0.2, 0.18, 0.09, 4, 6), [220, 60, 60]));
      ps.push(part(sphGeo(0.85, 0.2, -0.18, 0.09, 4, 6), [220, 60, 60]));
      obj(g, mergeC(ps), 0.34, t * 0.0009, 0, 26, 1); }],

    ['Telescope', function (g, t) {
      var m = geo('tele', function () { return mergeC([
        part(cylGeo(0, 0.4, 0, 0.36, 0.5, 2.6, 12, 'x'), [60, 66, 82]),
        part(cylGeo(1.5, 0.4, 0, 0.28, 0.3, 0.5, 12, 'x'), [180, 186, 200]),
        part(cylGeo(-1.5, 0.4, 0, 0.22, 0.24, 0.5, 10, 'x'), [40, 44, 56]),
        part(cylGeo(0, -0.9, 0, 0.14, 0.2, 1.4, 8), [140, 146, 160]),
        part(cylGeo(0, -1.6, 0, 0.9, 0.95, 0.16, 12), [90, 96, 110])
      ]); });
      obj(g, m, 0.2 + Math.sin(t * 0.0009) * 0.25, t * 0.0011, 0, 26, 1); }],

    ['Microscope', function (g, t) {
      var m = geo('micro', function () { return mergeC([
        part(boxGeo(0, -1.35, 0, 1.0, 0.16, 0.7), [70, 76, 90]),
        part(cylGeo(-0.5, -0.2, 0, 0.16, 0.2, 2.2, 8), [110, 116, 130]),
        part(cylGeo(0.15, 0.75, 0, 0.22, 0.24, 1.3, 10), [50, 56, 70]),
        part(boxGeo(0.15, -0.55, 0, 0.55, 0.08, 0.55), [180, 186, 200]),
        part(cylGeo(0.15, -0.15, 0, 0.1, 0.18, 0.6, 8), [40, 44, 56]),
        part(cylGeo(-0.5, 0.3, 0, 0.3, 0.3, 0.3, 10, 'x'), [200, 180, 90])
      ]); });
      obj(g, m, 0.2, t * 0.0011, 0, 26, 1); }],

    ['Camera', function (g, t) {
      var m = geo('cam', function () { return mergeC([
        part(boxGeo(0, 0, 0, 1.2, 0.75, 0.5), [50, 52, 60]),
        part(boxGeo(0, 0.85, 0, 0.45, 0.2, 0.4), [60, 62, 72]),
        part(cylGeo(0, 0, 0.75, 0.42, 0.5, 0.6, 12, 'z'), [30, 32, 40]),
        part(cylGeo(0, 0, 1.05, 0.3, 0.32, 0.1, 12, 'z'), [120, 190, 220]),
        part(cylGeo(-0.75, 0.85, 0, 0.14, 0.14, 0.2, 8), [200, 60, 60])
      ]); });
      obj(g, m, 0.22, t * 0.0012, 0, 28, 1); }],

    ['Guitar', function (g, t) {
      var m = geo('gtr', function () {
        var ps = [
          part(cylGeo(0, -0.6, 0, 1.0, 1.0, 0.28, 14), [190, 110, 50]),
          part(cylGeo(0, 0.35, 0, 0.75, 0.75, 0.28, 14), [190, 110, 50]),
          part(cylGeo(0, -0.6, 0.2, 0.34, 0.34, 0.06, 12), [40, 30, 20]),
          part(boxGeo(0, 1.5, 0, 0.2, 0.9, 0.14), [110, 70, 40]),
          part(boxGeo(0, 2.5, 0, 0.28, 0.16, 0.16), [80, 52, 30])
        ], i;
        for (i = 0; i < 5; i++)
          ps.push(part(boxGeo(-0.16 + i * 0.08, 0.6, 0.2, 0.012, 1.6, 0.012), [225, 225, 230]));
        return mergeC(ps);
      });
      obj(g, m, 0.14, t * 0.0012, 0, 24, 1); }],

    ['Piano keys', function (g, t) {
      var i, ps = [];
      for (i = 0; i < 12; i++) {
        var hit = Math.sin(t * 0.006 + i * 0.9) > 0.85;
        ps.push(part(boxGeo((i - 5.5) * 0.32, -0.4 - (hit ? 0.08 : 0), 0, 0.14, 0.08, 0.8),
                     [244, 242, 236]));
      }
      for (i = 0; i < 12; i++) {
        if (i % 7 === 2 || i % 7 === 6) continue;
        var hit2 = Math.sin(t * 0.006 + i * 0.9 + 1) > 0.9;
        ps.push(part(boxGeo((i - 5) * 0.32, -0.22 - (hit2 ? 0.08 : 0), -0.25, 0.08, 0.1, 0.45),
                     [30, 30, 36]));
      }
      ps.push(part(boxGeo(0, -0.66, 0, 2.0, 0.16, 0.9), [90, 60, 40]));
      obj(g, mergeC(ps), 0.5, 0.25 + Math.sin(t * 0.0005) * 0.2, 0, 28, 1); }],

    ['Drum kit', function (g, t) {
      var b1 = Math.abs(Math.sin(t * 0.006)), b2 = Math.abs(Math.sin(t * 0.009 + 1));
      var ps = [
        part(cylGeo(0, -0.8, 0, 1.0, 1.0, 1.0, 14, 'z'), [190, 60, 60]),
        part(cylGeo(-0.9, 0.3, 0.3, 0.45, 0.45, 0.5, 12), [200, 70, 70]),
        part(cylGeo(0.9, 0.3, 0.3, 0.4, 0.4, 0.45, 12), [200, 70, 70]),
        part(cylGeo(-1.5, 0.9 + b1 * 0.06, -0.4, 0.7, 0.7, 0.05, 14), [220, 190, 80]),
        part(cylGeo(1.5, 1.0 + b2 * 0.06, -0.4, 0.6, 0.6, 0.05, 14), [220, 190, 80]),
        part(cylGeo(-1.5, 0.2, -0.4, 0.05, 0.05, 1.4, 6), [140, 146, 160]),
        part(cylGeo(1.5, 0.3, -0.4, 0.05, 0.05, 1.4, 6), [140, 146, 160])
      ];
      obj(g, mergeC(ps), 0.24, 0.35 + Math.sin(t * 0.0005) * 0.2, 0, 24, 1); }],

    ['Trumpet', function (g, t) {
      var i, ps = [
        part(cylGeo(-1.2, 0, 0, 0.16, 0.16, 1.6, 10, 'x'), [220, 180, 70]),
        part(cylGeo(0.6, 0, 0, 0.16, 0.7, 1.4, 12, 'x'), [230, 190, 80]),
        part(cylGeo(-2.1, 0, 0, 0.24, 0.14, 0.3, 10, 'x'), [200, 165, 65])
      ];
      for (i = 0; i < 3; i++) {
        var press = Math.sin(t * 0.007 + i * 2) > 0.6 ? 0.12 : 0;
        ps.push(part(cylGeo(-0.8 + i * 0.4, 0.35 - press, 0, 0.1, 0.1, 0.55, 8), [190, 155, 60]));
      }
      obj(g, mergeC(ps), 0.2, t * 0.0012, 0, 26, 1); }],

    ['Chessboard', function (g, t) {
      var m = geo('board', function () {
        var ps = [], x, z;
        for (x = 0; x < 8; x++) for (z = 0; z < 8; z++)
          ps.push(part(boxGeo((x - 3.5) * 0.42, -0.5, (z - 3.5) * 0.42, 0.21, 0.06, 0.21),
                       (x + z) % 2 ? [240, 232, 214] : [70, 52, 40]));
        ps.push(part(boxGeo(0, -0.62, 0, 1.85, 0.08, 1.85), [110, 78, 52]));
        return mergeC(ps);
      });
      obj(g, m, 0.5 + Math.sin(t * 0.0006) * 0.2, t * 0.0009, 0, 27, 0); }],

    ['Abacus', function (g, t) {
      var i, k, ps = [
        part(boxGeo(0, 1.4, 0, 1.7, 0.1, 0.16), [130, 90, 50]),
        part(boxGeo(0, -1.4, 0, 1.7, 0.1, 0.16), [130, 90, 50]),
        part(boxGeo(-1.6, 0, 0, 0.1, 1.5, 0.16), [130, 90, 50]),
        part(boxGeo(1.6, 0, 0, 0.1, 1.5, 0.16), [130, 90, 50])
      ];
      for (i = 0; i < 5; i++) {
        var y = 1.0 - i * 0.5;
        ps.push(part(cylGeo(0, y, 0, 0.03, 0.03, 3.1, 5, 'x'), [180, 186, 200]));
        for (k = 0; k < 6; k++) {
          var slide = Math.sin(t * 0.001 + i * 1.3) * 0.5;
          ps.push(part(sphGeo(-1.3 + k * 0.42 + slide, y, 0, 0.16, 4, 7),
                       k % 2 ? [220, 80, 70] : [230, 190, 70]));
        }
      }
      obj(g, mergeC(ps), 0.16, Math.sin(t * 0.0005) * 0.4, 0, 26, 0); }],

    ['Balance scales', function (g, t) {
      var tip = Math.sin(t * 0.0018) * 0.28;
      var ps = [
        part(cylGeo(0, -1.0, 0, 0.9, 1.0, 0.14, 12), [150, 120, 60]),
        part(cylGeo(0, 0.1, 0, 0.09, 0.12, 2.2, 8), [170, 140, 70])
      ];
      var bx = Math.cos(tip) * 1.5, by = Math.sin(tip) * 1.5;
      ps.push(part(boxGeo(0, 1.2, 0, 1.5 * Math.cos(tip), 0.06 + Math.abs(Math.sin(tip)) * 1.4, 0.06),
                   [190, 160, 80]));
      ps.push(part(cylGeo(bx, 1.2 + by - 0.55, 0, 0.45, 0.4, 0.1, 12), [210, 180, 90]));
      ps.push(part(cylGeo(-bx, 1.2 - by - 0.55, 0, 0.45, 0.4, 0.1, 12), [210, 180, 90]));
      obj(g, mergeC(ps), 0.14, Math.sin(t * 0.0006) * 0.3, 0, 27, 0); }],

    ['Anvil', function (g, t) {
      var hit = (t % 1600) < 200;
      var m = geo('anvil', function () { return mergeC([
        part(boxGeo(0, -0.9, 0, 0.9, 0.25, 0.6), [60, 62, 72]),
        part(boxGeo(0, -0.35, 0, 0.35, 0.35, 0.3), [70, 72, 84]),
        part(boxGeo(0, 0.25, 0, 1.2, 0.3, 0.55), [86, 88, 100]),
        part(cylGeo(1.5, 0.25, 0, 0.02, 0.28, 0.7, 8, 'x'), [80, 82, 94])
      ]); });
      obj(g, m, 0.2, 0.5, 0, 28, 1);
      var hm = mergeC([
        part(boxGeo(0, 0, 0, 0.35, 0.22, 0.22), [150, 152, 165]),
        part(cylGeo(0, 0.9, 0, 0.09, 0.09, 1.4, 6), [140, 100, 55])
      ]);
      var V = hm.V.map(function (p) {
        var a = hit ? -0.2 : -1.1;
        return [p[0] * Math.cos(a) - p[1] * Math.sin(a), p[0] * Math.sin(a) + p[1] * Math.cos(a) + 1.2, p[2]];
      });
      obj(g, { V: V, F: hm.F, C: hm.C }, 0.2, 0.5, 0, 28, 1); }],

    ['Ladder', function (g, t) {
      var m = geo('ladder', function () {
        var ps = [
          part(boxGeo(-0.7, 0, 0, 0.1, 2.2, 0.1), [190, 145, 80]),
          part(boxGeo(0.7, 0, 0, 0.1, 2.2, 0.1), [190, 145, 80])
        ], i;
        for (i = 0; i < 7; i++)
          ps.push(part(boxGeo(0, -1.8 + i * 0.6, 0, 0.72, 0.06, 0.08), [210, 165, 95]));
        return mergeC(ps);
      });
      obj(g, m, 0.15, t * 0.0013, 0.1, 26, 1); }],

    ['Teapot', function (g, t) {
      var m = geo('pot', function () { return mergeC([
        part(sphGeo(0, 0, 0, 1.1, 8, 12), [230, 235, 240]),
        part(cylGeo(0, 1.0, 0, 0.4, 0.5, 0.3, 12), [215, 220, 228]),
        part(sphGeo(0, 1.35, 0, 0.22, 5, 7), [200, 90, 90]),
        part(cylGeo(1.75, 0.5, 0, 0.09, 0.3, 1.5, 8, 'x'), [225, 230, 236]),
        part(cylGeo(-1.7, 0.2, 0, 0.13, 0.13, 1.5, 8), [225, 230, 236]),
        part(cylGeo(-1.45, 0.9, 0, 0.75, 0.13, 0.13, 8, 'x'), [225, 230, 236]),
        part(cylGeo(-1.45, -0.5, 0, 0.7, 0.13, 0.13, 8, 'x'), [225, 230, 236])
      ]); });
      obj(g, m, 0.2, t * 0.0013, 0, 26, 0); }],

    ['Wine glass', function (g, t) {
      var m = geo('glass', function () { return mergeC([
        part(cylGeo(0, -1.3, 0, 0.85, 0.9, 0.1, 14), [225, 232, 238]),
        part(cylGeo(0, -0.55, 0, 0.08, 0.08, 1.4, 8), [230, 236, 242]),
        part(cylGeo(0, 0.45, 0, 0.85, 0.2, 1.2, 14), [220, 230, 238]),
        part(cylGeo(0, 0.25, 0, 0.6, 0.24, 0.6, 14), [150, 40, 60])
      ]); });
      obj(g, m, 0.14, t * 0.0014, 0, 28, 0); }],

    ['Bottle', function (g, t) {
      var m = geo('bottle', function () { return mergeC([
        part(cylGeo(0, -0.7, 0, 0.7, 0.72, 1.6, 12), [60, 130, 90]),
        part(cylGeo(0, 0.35, 0, 0.25, 0.7, 0.6, 12), [60, 130, 90]),
        part(cylGeo(0, 1.0, 0, 0.24, 0.24, 0.8, 10), [55, 120, 84]),
        part(cylGeo(0, 1.45, 0, 0.26, 0.26, 0.2, 10), [180, 140, 70]),
        part(boxGeo(0, -0.7, 0.73, 0.5, 0.5, 0.02), [235, 230, 210])
      ]); });
      obj(g, m, 0.16, t * 0.0013, 0, 28, 0); }],

    ['Lantern', function (g, t) {
      var fl = 0.8 + Math.sin(t * 0.012) * 0.2;
      var ps = [
        part(cylGeo(0, -1.1, 0, 0.6, 0.65, 0.2, 10), [80, 70, 50]),
        part(cylGeo(0, 1.05, 0, 0.35, 0.6, 0.25, 10), [80, 70, 50]),
        part(cylGeo(0, 1.45, 0, 0.06, 0.06, 0.5, 6), [110, 96, 66]),
        part(sphGeo(0, -0.1, 0, 0.3 * fl, 5, 8), [255, 210 * fl, 90])
      ], i;
      for (i = 0; i < 4; i++) {
        var a = i * TAU / 4 + Math.PI / 4;
        ps.push(part(cylGeo(Math.cos(a) * 0.5, 0, Math.sin(a) * 0.5, 0.05, 0.05, 2.0, 5), [90, 78, 56]));
      }
      obj(g, mergeC(ps), 0.2, t * 0.001, 0, 28, 0); }],

    ['Sundial', function (g, t) {
      var m = geo('sund', function () { return mergeC([
        part(cylGeo(0, -0.9, 0, 1.6, 1.7, 0.2, 16), [200, 194, 176]),
        part(cylGeo(0, -1.4, 0, 0.5, 0.7, 0.8, 10), [170, 164, 148])
      ]); });
      obj(g, m, 0.62, t * 0.0004, 0, 28, 0);
      var gn = mergeC([part(boxGeo(0, 0, 0, 0.06, 0.9, 0.9), [140, 120, 70])]);
      var V = gn.V.map(function (p) { return [p[0], p[1] - 0.35, p[2] - 0.2]; });
      obj(g, { V: V, F: gn.F, C: gn.C }, 0.62, t * 0.0004, 0, 28, 0);
      var i, V2 = [], E = [];
      for (i = 0; i < 12; i++) {
        var a = i * TAU / 12;
        V2.push([Math.cos(a) * 1.2, -0.7, Math.sin(a) * 1.2]);
        V2.push([Math.cos(a) * 1.55, -0.7, Math.sin(a) * 1.55]);
        E.push([i * 2, i * 2 + 1]);
      }
      wire(g, xform(V2, 0.62, t * 0.0004, 0), E, 28, '120,110,80', 1.4); }],

    ['Weather vane', function (g, t) {
      var a = t * 0.0012 + Math.sin(t * 0.0026) * 0.5;
      var ps = [
        part(cylGeo(0, -0.7, 0, 0.09, 0.14, 2.6, 8), [90, 92, 100]),
        part(cylGeo(0, 0.75, 0, 0.14, 0.14, 0.14, 8), [140, 146, 160])
      ], i;
      for (i = 0; i < 4; i++) {
        var aa = i * TAU / 4;
        ps.push(part(boxGeo(Math.cos(aa) * 0.9, 0.4, Math.sin(aa) * 0.9, 0.06, 0.06, 0.06),
                     [190, 190, 200]));
      }
      var vm = mergeC([
        part(boxGeo(0.7, 0, 0, 0.7, 0.05, 0.35), [60, 62, 74]),
        part(boxGeo(-0.85, 0, 0, 0.35, 0.05, 0.5), [60, 62, 74])
      ]);
      var V = vm.V.map(function (p) {
        return [p[0] * Math.cos(a) - p[2] * Math.sin(a), p[1] + 1.15,
                p[0] * Math.sin(a) + p[2] * Math.cos(a)];
      });
      ps.push({ V: V, F: vm.F, c: [70, 72, 84] });
      obj(g, mergeC(ps.map(function (p) { return p.c ? p : p; })), 0.16, 0.4, 0, 26, 1); }],

    ['Fire hydrant', function (g, t) {
      var m = geo('hyd', function () { return mergeC([
        part(cylGeo(0, -1.2, 0, 0.85, 0.95, 0.3, 12), [180, 40, 34]),
        part(cylGeo(0, -0.1, 0, 0.55, 0.7, 2.0, 12), [200, 48, 40]),
        part(cylGeo(0, 1.1, 0, 0.3, 0.55, 0.4, 12), [180, 40, 34]),
        part(sphGeo(0, 1.45, 0, 0.28, 5, 8), [210, 55, 46]),
        part(cylGeo(0.75, 0.2, 0, 0.22, 0.26, 0.5, 8, 'x'), [190, 44, 38]),
        part(cylGeo(-0.75, 0.2, 0, 0.22, 0.26, 0.5, 8, 'x'), [190, 44, 38])
      ]); });
      obj(g, m, 0.16, t * 0.0013, 0, 28, 1); }],

    ['Trestle bridge', function (g, t) {
      var m = geo('brid', function () {
        var ps = [part(boxGeo(0, 0.3, 0, 2.6, 0.08, 0.6), [150, 110, 66])], i;
        for (i = 0; i < 5; i++) {
          var x = -2.0 + i * 1.0;
          ps.push(part(boxGeo(x, -0.5, 0.5, 0.07, 0.85, 0.07), [120, 88, 52]));
          ps.push(part(boxGeo(x, -0.5, -0.5, 0.07, 0.85, 0.07), [120, 88, 52]));
          if (i < 4) {
            ps.push(part(boxGeo(x + 0.5, 0.85, 0.55, 0.55, 0.05, 0.05), [140, 102, 60]));
            ps.push(part(boxGeo(x + 0.5, 0.85, -0.55, 0.55, 0.05, 0.05), [140, 102, 60]));
          }
          ps.push(part(boxGeo(x, 0.6, 0.55, 0.05, 0.32, 0.05), [140, 102, 60]));
          ps.push(part(boxGeo(x, 0.6, -0.55, 0.05, 0.32, 0.05), [140, 102, 60]));
        }
        return mergeC(ps);
      });
      obj(g, m, 0.24, t * 0.0009, 0, 26, 1); }]

  ];

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

  /* Each entry animates the parameters; the renderer does the anatomy. */
  /* All the same Vulcan; each channel is a different thing he does. */
  var FACES = [
    ['Raising an eyebrow', function (o, t) {
      var c = Math.sin(t * 0.0016);
      o.browR = c > 0 ? -c * 1.5 : 0; o.eyeL = 0.82; o.eyeR = 1;
      o.gazeX = 0.2; o.open = 0.05;
    }],
    ['The Vulcan salute', function (o, t) {
      o.hand = 1; o.open = 0.1; o.eyeL = o.eyeR = 0.85;
      o.tilt = -0.05 + Math.sin(t * 0.0012) * 0.03; o.browY = -1;
    }],
    ['Nerve pinch', function (o, t) {
      var c = (t % 3200) / 3200;
      o.hand = 2; o.eyeL = o.eyeR = c > 0.45 ? 0.35 : 0.9;
      o.browY = c > 0.45 ? 2 : 0; o.open = 0.06; o.turn = 0.3;
    }],
    ['Mind meld', function (o, t) {
      o.hand = 3; o.eyeL = o.eyeR = 0.12; o.browY = -2;
      o.open = 0.16; o.tilt = Math.sin(t * 0.0009) * 0.05;
    }],
    ['Fascinating', function (o, t) {
      o.browL = -0.9; o.browR = -0.9; o.browY = -4;
      o.eyeL = o.eyeR = 1; o.open = 0.14; o.gazeY = -0.2;
      o.tilt = 0.12 + Math.sin(t * 0.001) * 0.03;
    }],
    ['Highly illogical', function (o, t) {
      o.browR = -1.2; o.browL = 0.3; o.eyeL = 0.7; o.eyeR = 0.95;
      o.open = 0.12; o.smile = -0.4; o.turn = Math.sin(t * 0.0011) * 0.25;
    }],
    ['Blinking', function (o, t) {
      var b = Math.sin(t * 0.0015);
      o.eyeL = o.eyeR = b > 0.87 ? 0.05 : 1;
      o.gazeX = Math.sin(t * 0.0006) * 0.4; o.open = 0.05;
    }],
    ['Reporting', function (o, t) {
      o.open = 0.1 + Math.abs(Math.sin(t * 0.013)) * 0.32;
      o.wide = 0.15; o.teeth = 1; o.eyeL = o.eyeR = 0.9;
      o.browY = Math.sin(t * 0.005) * 1.5;
    }],
    ['Computing odds', function (o, t) {
      o.gazeY = -0.7; o.gazeX = Math.sin(t * 0.0016) * 0.5;
      o.eyeL = o.eyeR = 0.75; o.browY = -2; o.open = 0.06;
      o.tilt = 0.06;
    }],
    ['Meditating', function (o, t) {
      o.eyeL = o.eyeR = 0.03; o.open = 0.03; o.browY = 1;
      o.bob = Math.sin(t * 0.0016) * 2; o.tilt = 0.02;
    }],
    ['Sceptical squint', function (o, t) {
      o.eyeL = 0.24; o.eyeR = 0.3; o.browY = 4;
      o.browL = -0.7; o.browR = -0.7; o.smile = -0.2;
      o.gazeX = Math.sin(t * 0.0009) * 0.7;
    }],
    ['A rare smile', function (o, t) {
      o.smile = 0.35 + Math.sin(t * 0.0018) * 0.15;
      o.eyeL = o.eyeR = 0.7; o.browY = -1; o.tilt = -0.05;
    }],
    ['Nodding once', function (o, t) {
      var n = Math.sin(t * 0.0022);
      o.bob = n > 0 ? n * 7 : 0; o.tilt = n > 0 ? n * 0.06 : 0;
      o.eyeL = o.eyeR = 0.9; o.open = 0.05;
    }],
    ['Scanning the room', function (o, t) {
      var s2 = Math.floor(t / 900) % 4;
      o.gazeX = s2 === 0 ? -1 : s2 === 1 ? 0 : s2 === 2 ? 1 : 0;
      o.turn = o.gazeX * 0.3; o.eyeL = o.eyeR = 0.9; o.open = 0.05;
    }],
    ['Suppressing emotion', function (o, t) {
      o.eyeL = o.eyeR = 0.5; o.browY = 2; o.open = 0.04;
      o.wide = 0.5 + Math.abs(Math.sin(t * 0.0025)) * 0.2;
      o.sweat = (t % 2600) / 2600;
    }],
    ['Surprised', function (o, t) {
      var c = (t % 3000) / 3000;
      var g2 = c < 0.3 ? Math.sin(c / 0.3 * Math.PI) : 0.08;
      o.open = 0.2 + g2 * 0.45; o.pucker = 1;
      o.eyeL = o.eyeR = 0.85 + g2 * 0.15; o.browY = -g2 * 7;
      o.scale = 1 + g2 * 0.03;
    }],
    ['Deep in thought', function (o, t) {
      o.gazeY = 0.5; o.gazeX = -0.4; o.eyeL = o.eyeR = 0.6;
      o.browY = 2; o.open = 0.04; o.tilt = -0.14;
    }],
    ['Disapproving', function (o, t) {
      o.browL = -1; o.browR = -1; o.browY = 4;
      o.eyeL = o.eyeR = 0.55; o.smile = -0.7; o.open = 0.04;
      o.turn = Math.sin(t * 0.0008) * 0.15;
    }],
    ['Listening intently', function (o, t) {
      o.tilt = 0.22; o.eyeL = o.eyeR = 0.9; o.gazeX = -0.6;
      o.open = 0.05; o.browY = -1;
    }],
    ['A slow sigh', function (o, t) {
      var c = (t % 4200) / 4200;
      var b2 = Math.sin(c * TAU);
      o.open = 0.1 + Math.max(0, b2) * 0.3; o.eyeL = o.eyeR = 0.55 - Math.max(0, b2) * 0.35;
      o.bob = b2 * 2.5; o.browY = 1;
    }],
    ['Winking', function (o, t) {
      var c = (t % 3000) / 3000;
      o.eyeR = c > 0.75 && c < 0.87 ? 0.05 : 1;
      o.smile = c > 0.73 && c < 0.9 ? 0.4 : 0.1;
      o.browR = c > 0.75 && c < 0.87 ? -0.6 : 0;
    }],
    ['In pain', function (o, t) {
      var p2 = Math.abs(Math.sin(t * 0.004));
      o.eyeL = o.eyeR = 0.2 - p2 * 0.15; o.browL = 0.9; o.browR = 0.9;
      o.browY = -2; o.open = 0.25 + p2 * 0.2; o.wide = 0.4; o.teeth = 1;
      o.sweat = (t % 1800) / 1800;
    }],
    ['Turning to camera', function (o, t) {
      var c = (t % 4000) / 4000;
      o.turn = c < 0.5 ? -0.9 + c * 1.8 : 0;
      o.browR = c > 0.6 ? -1.2 : 0;
      o.eyeL = o.eyeR = 0.95; o.open = 0.05;
    }],
    ['Whispering an aside', function (o, t) {
      o.open = 0.1 + Math.abs(Math.sin(t * 0.012)) * 0.09;
      o.pucker = 1; o.turn = 0.55; o.gazeX = -0.8;
      o.eyeL = o.eyeR = 0.75;
    }],
    ['Impassive', function (o, t) {
      var b3 = Math.sin(t * 0.0006);
      o.eyeL = o.eyeR = b3 > 0.96 ? 0.08 : 0.95;
      o.open = 0.04; o.browY = 0; o.bob = Math.sin(t * 0.0008) * 0.8;
    }]
  ];

  for (var fi = 0; fi < FACES.length; fi++) {
    (function (i) {
      CHANNELS.push({
        name: FACES[i][0],
        draw: function (g, t) {
          var o = baseFace(i);
          o.L = VULCAN;
          o.hairStyle = 9;
          o.vulcan = 1;
          FACES[i][1](o, t);
          drawFace(g, o);
        }
      });
    }(fi));
  }

  /* Registered after the CHANNELS array is assigned: `var` hoists the
     declaration but not the value, so pushing any earlier throws. */
  for (var gi = 0; gi < G3.length; gi++) {
    (function (i) {
      CHANNELS.push({ name: G3[i][0], draw: G3[i][1] });
    }(gi));
  }

  for (var ani = 0; ani < ANIMALS.length; ani++) {
    (function (i) {
      CHANNELS.push({
        name: ANIMALS[i][0],
        draw: function (g, t) {
          var o = A(ANIMALS[i][1]);
          animAct(o, t);
          drawAnimal(g, o);
        }
      });
    }(ani));
  }

  for (var gb = 0; gb < G3B.length; gb++) {
    (function (i) {
      CHANNELS.push({ name: G3B[i][0], draw: G3B[i][1] });
    }(gb));
  }

  for (var mi2 = 0; mi2 < MISC.length; mi2++) {
    (function (i) {
      CHANNELS.push({ name: MISC[i][0], draw: MISC[i][1] });
    }(mi2));
  }

  for (var fsi = 0; fsi < FISH.length; fsi++) {
    (function (i) {
      var dir = i < 25 ? 1 : -1;          /* half each way */
      CHANNELS.push({
        name: FISH[i][0],
        draw: function (g, t) {
          var o = F(FISH[i][1]);
          o.dir = dir;
          drawFishScene(g, o, t);
        }
      });
    }(fsi));
  }

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
    MUSIC.setChannel(current, CHANNELS[current].name);
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


  /* ================================================================
     CHIPTUNE — 8-bit new wave, synthesised in the browser.

     No audio files: pulse waves are built as PeriodicWaves from the
     Fourier series of a square pulse, drums from filtered noise. Each
     channel seeds a PRNG from its own index, so every one of the 171
     gets its own key, mode, tempo, progression, bassline, arpeggio,
     lead motif and drum pattern — deterministically, so a channel
     always sounds the same.

     Scheduling uses the lookahead pattern: a coarse JS timer queues
     notes slightly ahead on the audio clock, which is sample-accurate.
     setTimeout alone is far too jittery to sequence against.
     ================================================================ */

  var MUSIC = (function () {
    var ctx = null, master = null, delayNode = null, delayFb = null, delayWet = null, comp = null;
    var noiseBuf = null, waves = {};
    var timer = null, enabled = false;
    var track = null, nextTime = 0, step = 0, rung = 0;
    var LOOKAHEAD = 0.04, TICK = 12, MASTER_VOL = 0.22;
    var live = [];                                  /* sounding nodes */

    /* Minor modes only. Mixolydian and lydian were the two bright
       ones and they were pulling tracks major. */
    var SCALES = [
      [0, 2, 3, 5, 7, 8, 10],   /* aeolian */
      [0, 2, 3, 5, 7, 9, 10],   /* dorian */
      [0, 1, 3, 5, 7, 8, 10],   /* phrygian */
      [0, 2, 3, 5, 7, 8, 11],   /* harmonic minor */
      [0, 2, 3, 5, 6, 8, 10],   /* locrian-ish, darker still */
      [0, 1, 3, 5, 7, 8, 11]    /* double harmonic flavour */
    ];

    /* All under 92bpm; the busier styles subdivide instead. */
    var STYLES = [
      { bpm:[84,90],  feel:1, swing:0,    arp:2, hats:2, leadOct:1, bassOct:-1, lead:'pulse', drop:1 },
      { bpm:[78,88],  feel:0, swing:0,    arp:1, hats:1, leadOct:2, bassOct:-1, lead:'pulse', drop:0 },
      { bpm:[62,72],  feel:2, swing:0,    arp:2, hats:2, leadOct:1, bassOct:-1, lead:'tri',   drop:1, vib:14 },
      { bpm:[70,80],  feel:1, swing:0.14, arp:4, hats:4, leadOct:1, bassOct:0,  lead:'pulse', drop:1 },
      { bpm:[80,88],  feel:1, swing:0,    arp:2, hats:2, leadOct:2, bassOct:-1, lead:'pulse', drop:0 },
      { bpm:[64,74],  feel:2, swing:0,    arp:4, hats:0, leadOct:1, bassOct:-2, lead:'tri',   drop:1, vib:9 },
      { bpm:[74,84],  feel:3, swing:0.17, arp:2, hats:1, leadOct:1, bassOct:-1, lead:'pulse', drop:1 },
      { bpm:[86,91],  feel:0, swing:0,    arp:1, hats:1, leadOct:2, bassOct:-1, lead:'pulse', drop:0 },
      { bpm:[76,86],  feel:1, swing:0,    arp:2, hats:2, leadOct:1, bassOct:-1, lead:'pulse', drop:1, vamp:1 },
      { bpm:[56,66],  feel:2, swing:0,    arp:4, hats:4, leadOct:2, bassOct:-1, lead:'tri',   drop:0, vib:18 }
    ];

    var PROGS = [
      [0,5,3,4],[0,3,4,4],[0,6,5,4],[0,4,5,3],[0,2,3,4],[5,3,0,4],
      [0,5,1,4],[3,4,0,0],[0,0,5,5],[0,4,0,5],[0,1,0,6],[5,4,3,4]
    ];

    /* Denser onset grids than before — the lead is meant to carry the
       tune, so it needs notes to sing with. */
    var LEADRHY = [
      [1,0,1,0, 1,0,0,1, 0,1,0,0, 1,0,1,0],
      [1,0,0,1, 1,0,1,0, 1,0,0,1, 0,1,0,0],
      [1,1,0,1, 0,1,0,0, 1,0,1,1, 0,1,0,0],
      [1,0,1,1, 0,1,1,0, 1,0,1,0, 1,1,0,0],
      [1,0,0,0, 1,1,0,1, 0,1,1,0, 1,0,1,0],
      [1,0,1,0, 0,1,1,0, 1,0,0,1, 1,0,0,0]
    ];

    var KITS = [
      { kick:[0,8], snare:[4,12], ghost:0 }, { kick:[0,6,10], snare:[4,12], ghost:1 },
      { kick:[0,3,8,11], snare:[4,12], ghost:0 }, { kick:[0,8], snare:[8], ghost:0 },
      { kick:[0,10], snare:[4,12], ghost:1 }, { kick:[0,7,8], snare:[12], ghost:0 }
    ];

    var BASSF = [
      function (k) { return k % 2 === 0; }, function (k) { return k % 2 === 0; },
      function (k) { return k % 4 === 0; },
      function (k) { return k===0||k===3||k===6||k===8||k===11||k===14; }
    ];

    function mulberry32(a) {
      return function () {
        a |= 0; a = a + 0x6D2B79F5 | 0;
        var t = Math.imul(a ^ a >>> 15, 1 | a);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
      };
    }

    /* Four bars of tune: an arc per bar so phrases rise and fall, and
       a note length that runs to the next onset so lines are legato
       rather than a string of equal blips. */
    function makeMelody(r) {
      var rhA = LEADRHY[(r() * LEADRHY.length) | 0];
      var rhB = LEADRHY[(r() * LEADRHY.length) | 0];
      var arc = [0, 1, 2, 1], deg = 2 + ((r() * 3) | 0);
      var notes = [], bar, i;
      for (bar = 0; bar < 4; bar++) {
        var rh = (bar % 2 === 0) ? rhA : rhB;
        for (i = 0; i < 16; i++) {
          if (!rh[i]) { notes.push(-1); continue; }
          deg += r() < 0.74 ? (r() < 0.5 ? -1 : 1) : (r() < 0.5 ? -2 : 2);
          var target = 2 + arc[bar] * 2;
          if (deg > target + 4) deg -= 2;
          if (deg < target - 3) deg += 2;
          notes.push(deg);
        }
      }
      var dur = [], n;
      for (i = 0; i < 64; i++) {
        if (notes[i] < 0) { dur.push(0); continue; }
        n = 1;
        while (n < 8 && notes[(i + n) % 64] < 0) n++;
        dur.push(n);
      }
      return { n: notes, d: dur };
    }

    function buildTrack(i, name) {
      var seed = (i + 1) * 2654435761 ^ (name ? name.length * 8191 : 0);
      var r = mulberry32(seed);
      var st = STYLES[i % STYLES.length];
      return {
        st: st,
        bpm: st.bpm[0] + ((r() * (st.bpm[1] - st.bpm[0] + 1)) | 0),
        root: 40 + ((r() * 10) | 0),
        scale: SCALES[(r() * SCALES.length) | 0],
        prog: st.vamp ? [0, 0, 5, 5] : PROGS[(r() * PROGS.length) | 0],
        kit: KITS[(r() * KITS.length) | 0],
        bassOn: BASSF[st.feel],
        duty: [0.5, 0.25][(r() * 2) | 0],
        leadDuty: [0.5, 0.25][(r() * 2) | 0],
        cutoff: 600 + r() * 2400,
        sweep: r() < 0.5 ? 0 : 900 + r() * 1800,
        arpUp: r() < 0.62,
        arpSpan: r() < 0.4 ? 4 : 3,
        mel: makeMelody(r),
        delayOn: r() < 0.55,
        delayTime: 0.18 + r() * 0.22,
        octJump: r() < 0.35
      };
    }

    function pulseWave(duty) {
      var key = 'p' + duty;
      if (waves[key]) return waves[key];
      var n = 24, real = new Float32Array(n + 1), imag = new Float32Array(n + 1);
      for (var k = 1; k <= n; k++) imag[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * duty);
      waves[key] = ctx.createPeriodicWave(real, imag);
      return waves[key];
    }

    function freq(m) { return 440 * Math.pow(2, (m - 69) / 12); }

    /* Octave-fold rather than clamp, so a line keeps its shape instead
       of flattening against a ceiling. Ranges are deliberately low —
       nothing reaches the piercing register. */
    function fold(m, lo, hi) {
      while (m > hi) m -= 12;
      while (m < lo) m += 12;
      return m;
    }

    function chord(t, degIdx, oct) {
      var out = [], sc = t.scale, i;
      for (i = 0; i < 4; i++) {
        var idx = degIdx + i * 2;
        out.push(t.root + sc[idx % sc.length] + (oct + Math.floor(idx / sc.length)) * 12);
      }
      return out;
    }

    /* A source that is merely silenced still runs; keeping handles lets
       a cut actually stop them. Ended nodes are pruned as we go. */
    function hold(node, until) {
      live.push({ n: node, t: until });
      if (live.length > 96) {
        var now = ctx.currentTime, keep = [], i;
        for (i = 0; i < live.length; i++) if (live[i].t > now) keep.push(live[i]);
        live = keep;
      }
    }

    function killAll(when) {
      for (var i = 0; i < live.length; i++) {
        try { live[i].n.stop(when); } catch (e) { /* already finished */ }
      }
      live = [];
    }

    function voice(time, f, dur, kind, duty, gain, dest, vib, tone) {
      var o = ctx.createOscillator(), g = ctx.createGain(), lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = tone || 1800;          /* take the glare off */
      lp.Q.value = 0.7;
      if (kind === 'tri') o.type = 'triangle'; else o.setPeriodicWave(pulseWave(duty));
      o.frequency.setValueAtTime(f, time);
      if (vib) {
        var lfo = ctx.createOscillator(), la = ctx.createGain();
        lfo.frequency.value = 5.5; la.gain.value = f * vib / 1200;
        lfo.connect(la); la.connect(o.frequency);
        lfo.start(time); lfo.stop(time + dur + 0.03); hold(lfo, time + dur + 0.03);
      }
      g.gain.setValueAtTime(0.0001, time);
      g.gain.linearRampToValueAtTime(gain, time + 0.008);
      g.gain.setValueAtTime(gain, time + dur * 0.55);
      g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
      o.connect(lp); lp.connect(g); g.connect(dest);
      o.start(time); o.stop(time + dur + 0.03); hold(o, time + dur + 0.03);
    }

    function bass(time, f, dur, t) {
      var o = ctx.createOscillator(), g = ctx.createGain(), fl = ctx.createBiquadFilter();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(f, time);
      fl.type = 'lowpass';
      fl.frequency.setValueAtTime(t.cutoff + t.sweep, time);
      if (t.sweep) fl.frequency.exponentialRampToValueAtTime(Math.max(200, t.cutoff), time + dur);
      fl.Q.value = 6;
      g.gain.setValueAtTime(0.0001, time);
      g.gain.linearRampToValueAtTime(0.28, time + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
      o.connect(fl); fl.connect(g); g.connect(master);
      o.start(time); o.stop(time + dur + 0.03); hold(o, time + dur + 0.03);
    }

    function noise(time, dur, type, hz, gain, q) {
      var s = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), g = ctx.createGain();
      s.buffer = noiseBuf;
      fl.type = type; fl.frequency.value = hz; if (q) fl.Q.value = q;
      g.gain.setValueAtTime(gain, time);
      g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
      s.connect(fl); fl.connect(g); g.connect(master);
      s.start(time); s.stop(time + dur + 0.02); hold(s, time + dur + 0.02);
    }

    function kick(time) {
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(150, time);
      o.frequency.exponentialRampToValueAtTime(44, time + 0.11);
      g.gain.setValueAtTime(0.6, time);
      g.gain.exponentialRampToValueAtTime(0.0001, time + 0.16);
      o.connect(g); g.connect(master);
      o.start(time); o.stop(time + 0.2); hold(o, time + 0.2);
    }

    /* Silence, stop and flush. The delay line holds up to ~400ms of the
       previous track; muting the wet path stops it re-emerging when the
       gain comes back. */
    function cut() {
      if (!ctx) return;
      var now = ctx.currentTime;
      master.gain.cancelScheduledValues(now);
      master.gain.setValueAtTime(master.gain.value, now);
      master.gain.linearRampToValueAtTime(0.0001, now + 0.004);
      delayFb.gain.cancelScheduledValues(now);
      delayFb.gain.setValueAtTime(0, now);
      delayWet.gain.cancelScheduledValues(now);
      delayWet.gain.setValueAtTime(0, now);
      killAll(now + 0.005);
    }

    function restore(at, dt) {
      master.gain.cancelScheduledValues(at);
      master.gain.setValueAtTime(0.0001, at);
      master.gain.linearRampToValueAtTime(MASTER_VOL, at + 0.02);
      delayFb.gain.setValueAtTime(0.32, at);
      /* wet comes back only once the line has drained of the old track */
      delayWet.gain.setValueAtTime(0, at);
      delayWet.gain.setValueAtTime(0.85, at + dt + 0.05);
    }

    function has(arr, k) { for (var i = 0; i < arr.length; i++) if (arr[i] === k) return true; return false; }

    function snap(deg, chDeg) {
      var best = deg, bd = 99, i, c;
      for (i = 0; i < 3; i++) {
        c = chDeg + i * 2;
        while (c - deg > 3.5) c -= 7;
        while (deg - c > 3.5) c += 7;
        if (Math.abs(c - deg) < bd) { bd = Math.abs(c - deg); best = c; }
      }
      return best;
    }

    function playStep(s, time) {
      var t = track, st = t.st;
      var bar = (s / 16) | 0, k = s % 16;
      var sect = (bar / 4) | 0;
      var beat = 60 / t.bpm, sixteenth = beat / 4;
      var degIdx = t.prog[bar % t.prog.length];
      var ch = chord(t, degIdx, 0);
      var wantDrums = !(st.drop && bar === 15);
      var arpRate = (sect === 1 || sect === 3) && st.arp > 1 ? st.arp / 2 : st.arp;

      if (t.bassOn(k)) {
        var bn = fold(ch[0] + 12 * st.bassOct, 28, 45);
        if (t.octJump && k % 8 === 6) bn += 12;
        bass(time, freq(bn), sixteenth * (st.feel === 2 ? 3.2 : 1.7), t);
      }

      if (k % arpRate === 0) {
        var ai = ((k / arpRate) | 0) % t.arpSpan;
        var an = fold(ch[(t.arpUp ? ai : t.arpSpan - 1 - ai) % 4], 43, 60);
        voice(time, freq(an), sixteenth * 1.3, 'pulse', t.duty, 0.05, master, 0, 1400);
      }

      /* the tune: every sixteenth is available, held to the next onset,
         and pulled onto a chord tone on the strong beats */
      var mi = (bar % 4) * 16 + k;
      var d = t.mel.n[mi];
      if (d >= 0) {
        var dd = (k % 8 === 0) ? snap(d, degIdx) : d;
        var oct = Math.floor(dd / 7);
        var ln = fold(t.root + t.scale[((dd % 7) + 7) % 7] + 12 * (st.leadOct + oct), 55, 71);
        voice(time, freq(ln), sixteenth * t.mel.d[mi] * 0.92, st.lead, t.leadDuty,
              0.135, t.delayOn ? delayNode : master, st.vib || 0, 1900);
      }

      if (wantDrums) {
        if (has(t.kit.kick, k)) kick(time);
        if (has(t.kit.snare, k)) noise(time, 0.15, 'bandpass', 1350, 0.24, 1.1);
        if (t.kit.ghost && (k === 7 || k === 15)) noise(time, 0.05, 'bandpass', 1700, 0.07, 1.2);
        if (st.hats && k % st.hats === 0) noise(time, 0.03, 'highpass', 6000, 0.045);
      }
    }

    function scheduler() {
      if (!ctx || !track) return;
      var sixteenth = (60 / track.bpm) / 4;
      var sw = track.st.swing * sixteenth;
      while (nextTime < ctx.currentTime + LOOKAHEAD) {
        playStep(step, nextTime + ((step % 2) ? sw : 0));
        nextTime += sixteenth;
        step = (step + 1) % 256;
      }
    }

    function init() {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      comp = ctx.createDynamicsCompressor();
      master = ctx.createGain();
      master.gain.value = MASTER_VOL;
      delayNode = ctx.createDelay(1.0);
      delayNode.delayTime.value = 0.26;
      delayFb = ctx.createGain(); delayFb.gain.value = 0.32;
      delayWet = ctx.createGain(); delayWet.gain.value = 0.85;
      delayNode.connect(delayFb); delayFb.connect(delayNode);
      delayNode.connect(delayWet); delayWet.connect(master);
      master.connect(comp); comp.connect(ctx.destination);
      var n = ctx.sampleRate, buf = ctx.createBuffer(1, n, n), d = buf.getChannelData(0);
      for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
      noiseBuf = buf;
      return true;
    }

    return {
      supported: function () { return !!(window.AudioContext || window.webkitAudioContext); },
      isOn: function () { return enabled; },
      setChannel: function (i, name) {
        var wasOn = enabled;
        track = buildTrack(i, name);
        step = 0;
        if (ctx) {
          if (wasOn) cut();
          var at = ctx.currentTime + 0.03;
          delayNode.delayTime.setValueAtTime(track.delayTime, at);
          if (wasOn) {
            restore(at, track.delayTime);
            noise(at, 0.09, 'highpass', 900, 0.10);
            /* Each click steps one rung up the new channel's scale and
               wraps at the octave, so clicking through the channels
               walks up a run. The mode belongs to the channel you land
               on, so the colour of the run changes as you go. Folded
               into a low register like everything else. */
            /* Fixed base: deriving it from the new channel's root made
               the pitch jump around per channel and buried the run. With
               it held constant the run always climbs, while the mode of
               the channel you land on still colours the intervals. */
            var base = 55;
            var deg = rung % track.scale.length;
            voice(at + 0.012, freq(base + track.scale[deg]), 0.5, 'pulse',
                  0.25, 0.15, delayNode, 0, 2400);
            rung = (rung + 1) % track.scale.length;
          }
          nextTime = at + 0.01;
        }
      },
      toggle: function () {
        if (!ctx && !init()) return false;
        enabled = !enabled;
        if (enabled) {
          if (ctx.state === 'suspended') ctx.resume();
          /* resume() is async: currentTime is still frozen for a moment,
             so anything scheduled at it lands in a stale past and the
             ramp is caught half-finished. Offset into the future. */
          var at = ctx.currentTime + 0.03;
          if (track) delayNode.delayTime.setValueAtTime(track.delayTime, at);
          restore(at, track ? track.delayTime : 0.26);
          nextTime = at + 0.02;
          step = 0;
          timer = window.setInterval(scheduler, TICK);
        } else {
          window.clearInterval(timer); timer = null;
          cut();
          /* Deliberately NOT suspending here. Resuming a context takes
             a moment to spin the clock back up, which shows up as lag
             when the sound is switched on again. Muted with no sources
             running costs next to nothing, and unmuting is instant.
             The tab-hidden handler still suspends, where lag is fine. */
        }
        return enabled;
      },
      pause: function () { if (ctx && enabled && ctx.state === 'running') ctx.suspend(); },
      resume: function () { if (ctx && enabled && ctx.state === 'suspended') ctx.resume(); }
    };
  }());

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

  var soundBtn = document.getElementById('sound');
  if (soundBtn) {
    if (!MUSIC.supported()) {
      soundBtn.disabled = true;
      soundBtn.setAttribute('aria-label', 'Sound not supported in this browser');
    } else {
      soundBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        var on = MUSIC.toggle();
        soundBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
        soundBtn.setAttribute('aria-label', on ? 'Turn sound off' : 'Turn sound on');
      });
    }
  }

  /* the audio clock keeps running in a hidden tab otherwise */
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) MUSIC.pause(); else MUSIC.resume();
  });

  MUSIC.setChannel(current, CHANNELS[current].name);
  announce();
  apply();
})();
