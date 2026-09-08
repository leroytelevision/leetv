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

  function baseFace(i) {
    return {
      L: LOOKS[i % LOOKS.length],
      hairStyle: i % 8,
      eyeL: 1, eyeR: 1, gazeX: 0, gazeY: 0,
      browL: 0, browR: 0, browY: 0,
      open: 0, wide: 0, smile: 0, teeth: 0, tongue: 0, pucker: 0,
      tilt: 0, bob: 0, turn: 0, scale: 1,
      blush: 0, tears: 0, sweat: 0, glasses: 0, shades: 0,
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

    g.fillStyle = L.hair;                        /* ears */
    g.fillStyle = L.skin;
    ell(g, cx - hw + 2 + tx, cy + 6, 6, 10);
    ell(g, cx + hw - 2 + tx, cy + 6, 6, 10);
    g.fillStyle = L.dark;
    ell(g, cx - hw + 2 + tx, cy + 6, 3, 5);
    ell(g, cx + hw - 2 + tx, cy + 6, 3, 5);

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
      g.rotate(s * ((e ? o.browR : o.browL) * 0.28));
      g.fillStyle = L.hair;
      ell(g, 0, 0, 12, 2.8);
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
  var FACES = [
    ['Blinking', function (o, t) {
      var b = Math.sin(t * 0.0016);
      o.eyeL = o.eyeR = b > 0.86 ? Math.max(0.04, (1 - b) * 7) : 1;
      o.gazeX = Math.sin(t * 0.0006) * 0.4;
    }],
    ['Winking', function (o, t) {
      var c = (t % 2600) / 2600;
      o.eyeR = c > 0.72 && c < 0.86 ? 0.05 : 1;
      o.smile = c > 0.7 && c < 0.9 ? 0.7 : 0.25;
      o.browR = c > 0.72 && c < 0.86 ? -0.5 : 0;
    }],
    ['Yawning', function (o, t) {
      var c = (t % 4200) / 4200;
      var y = c < 0.55 ? Math.sin(c / 0.55 * Math.PI) : 0;
      o.open = y; o.wide = y * 0.3; o.teeth = y > 0.5 ? 1 : 0; o.tongue = y > 0.6 ? 1 : 0;
      o.eyeL = o.eyeR = 1 - y * 0.94; o.browY = -y * 4; o.tilt = -y * 0.12;
    }],
    ['Laughing', function (o, t) {
      var l = Math.abs(Math.sin(t * 0.0075));
      o.open = 0.35 + l * 0.5; o.wide = 0.7; o.smile = 1; o.teeth = 1; o.tongue = l > 0.6 ? 1 : 0;
      o.eyeL = o.eyeR = 0.28; o.bob = l * 4; o.tilt = Math.sin(t * 0.0075) * 0.07;
    }],
    ['Crying', function (o, t) {
      o.tears = (t % 3000) / 3000;
      o.browL = 0.7; o.browR = 0.7; o.browY = -2;
      o.eyeL = o.eyeR = 0.35 + Math.sin(t * 0.004) * 0.12;
      o.open = 0.4; o.smile = -0.9; o.wide = 0.2; o.bob = Math.sin(t * 0.006) * 2;
    }],
    ['Sneezing', function (o, t) {
      var c = (t % 3000) / 3000;
      if (c < 0.62) { var b = c / 0.62;
        o.eyeL = o.eyeR = 1 - b * 0.7; o.browY = -b * 3; o.tilt = -b * 0.16; o.open = b * 0.25;
      } else { var a = (c - 0.62) / 0.38;
        o.eyeL = o.eyeR = 0.04; o.open = (1 - a) * 0.95; o.wide = 0.5; o.teeth = 1;
        o.tilt = 0.22 * (1 - a); o.bob = 6 * (1 - a); }
    }],
    ['Whistling', function (o, t) {
      o.pucker = 1; o.open = 0.22; o.browY = -3;
      o.eyeL = o.eyeR = 0.7; o.gazeX = Math.sin(t * 0.0014) * 0.7;
      o.tilt = Math.sin(t * 0.002) * 0.05;
    }],
    ['Chewing gum', function (o, t) {
      var c = Math.sin(t * 0.008);
      o.open = 0.12 + Math.abs(c) * 0.2; o.turn = c * 0.35; o.smile = 0.2;
      o.eyeL = o.eyeR = 0.85;
    }],
    ['Blowing a bubble', function (o, t) {
      var c = (t % 4600) / 4600;
      o.bubble = c < 0.78 ? c / 0.78 : 0;
      o.open = 0.2; o.pucker = c < 0.78 ? 1 : 0;
      o.eyeL = o.eyeR = c > 0.72 && c < 0.82 ? 0.2 : 0.9;
    }],
    ['Smoking', function (o, t) {
      var c = (t % 3800) / 3800;
      o.cig = 1 + Math.sin(t * 0.002) * 0.5;
      o.open = c < 0.2 ? 0.1 : 0.02; o.pucker = c < 0.2 ? 1 : 0;
      o.eyeL = o.eyeR = 0.6; o.gazeY = -0.4; o.tilt = 0.05;
    }],
    ['Sipping tea', function (o, t) {
      var c = (t % 4400) / 4400;
      o.cup = c < 0.62 ? Math.min(1, c / 0.3) : Math.max(0, 1 - (c - 0.62) / 0.25);
      o.eyeL = o.eyeR = o.cup > 0.6 ? 0.35 : 0.9;
      o.tilt = -o.cup * 0.1; o.open = o.cup > 0.8 ? 0.2 : 0;
    }],
    ['Eating', function (o, t) {
      var c = Math.abs(Math.sin(t * 0.006));
      o.open = c * 0.55; o.teeth = 1; o.wide = 0.2;
      o.eyeL = o.eyeR = 0.8 - c * 0.3; o.bob = c * 2;
    }],
    ['Tongue out', function (o, t) {
      o.open = 0.5; o.tongue = 1; o.wide = 0.4;
      o.eyeL = o.eyeR = 0.3; o.smile = 0.5;
      o.tilt = Math.sin(t * 0.003) * 0.08;
    }],
    ['Raised eyebrow', function (o, t) {
      var c = Math.sin(t * 0.0018);
      o.browR = c > 0 ? -c * 1.4 : 0; o.eyeR = 1; o.eyeL = 0.8;
      o.smile = 0.3; o.gazeX = 0.2;
    }],
    ['Scowling', function (o, t) {
      o.browL = -1; o.browR = -1; o.browY = 4;
      o.eyeL = o.eyeR = 0.55; o.smile = -0.8; o.open = 0.05;
      o.turn = Math.sin(t * 0.001) * 0.2;
    }],
    ['Shy smile', function (o, t) {
      o.smile = 0.6; o.blush = 0.7 + Math.sin(t * 0.003) * 0.3;
      o.gazeY = 0.7; o.gazeX = -0.5; o.eyeL = o.eyeR = 0.7;
      o.tilt = 0.1;
    }],
    ['Screaming', function (o, t) {
      var s = 0.7 + Math.abs(Math.sin(t * 0.01)) * 0.3;
      o.open = s; o.wide = 0.6; o.teeth = 1; o.tongue = 1;
      o.eyeL = o.eyeR = 1; o.browY = -5; o.browL = 0.5; o.browR = 0.5;
      o.bob = Math.sin(t * 0.02) * 2;
    }],
    ['Whispering', function (o, t) {
      o.open = 0.12 + Math.abs(Math.sin(t * 0.012)) * 0.1;
      o.pucker = 1; o.turn = 0.6; o.gazeX = -0.8;
      o.eyeL = o.eyeR = 0.75;
    }],
    ['Singing', function (o, t) {
      var s = 0.35 + Math.abs(Math.sin(t * 0.0035)) * 0.5;
      o.open = s; o.wide = 0.2 + s * 0.3; o.tongue = 1;
      o.eyeL = o.eyeR = 0.4; o.browY = -3; o.bob = Math.sin(t * 0.0035) * 3;
      o.tilt = Math.sin(t * 0.0018) * 0.1;
    }],
    ['Talking', function (o, t) {
      o.open = 0.1 + Math.abs(Math.sin(t * 0.014)) * 0.35;
      o.wide = 0.2 + Math.sin(t * 0.009) * 0.2; o.teeth = 1;
      o.eyeL = o.eyeR = 0.9; o.gazeX = Math.sin(t * 0.0011) * 0.5;
      o.browY = Math.sin(t * 0.006) * 2;
    }],
    ['Falling asleep', function (o, t) {
      var c = (t % 6000) / 6000;
      var d = c < 0.85 ? c / 0.85 : 0;
      o.eyeL = o.eyeR = 1 - d * 0.97;
      o.tilt = d * 0.34; o.bob = d * 8; o.open = d * 0.2;
      o.browY = d * 3;
    }],
    ['Waking with a start', function (o, t) {
      var c = (t % 4000) / 4000;
      if (c < 0.7) { o.eyeL = o.eyeR = 0.05; o.tilt = 0.3; o.bob = 7; o.open = 0.15; }
      else { var a = Math.min(1, (c - 0.7) / 0.08);
        o.eyeL = o.eyeR = a; o.tilt = 0.3 * (1 - a); o.bob = 7 * (1 - a);
        o.open = a * 0.5; o.browY = -a * 5; }
    }],
    ['Shifty eyes', function (o, t) {
      var s = Math.floor(t / 700) % 4;
      o.gazeX = s === 0 ? -1 : s === 1 ? 0 : s === 2 ? 1 : 0;
      o.eyeL = o.eyeR = 0.8; o.smile = -0.1; o.browY = 1;
      o.turn = o.gazeX * 0.15;
    }],
    ['Rolling eyes', function (o, t) {
      var a = t * 0.004;
      o.gazeX = Math.cos(a); o.gazeY = Math.sin(a) * 0.9;
      o.eyeL = o.eyeR = 0.95; o.smile = -0.3; o.browY = -2;
    }],
    ['Blowing a kiss', function (o, t) {
      var c = (t % 3200) / 3200;
      o.pucker = c < 0.5 ? 1 : 0; o.open = c < 0.5 ? 0.25 : 0.05;
      o.smile = c < 0.5 ? 0 : 0.8; o.eyeL = c < 0.5 ? 0.3 : 1; o.eyeR = 0.3;
      if (c > 0.5) { o.blush = 0.6; }
    }],
    ['Sour face', function (o, t) {
      o.pucker = 1; o.open = 0.15; o.eyeL = o.eyeR = 0.18;
      o.browL = -0.8; o.browR = -0.8; o.browY = 3;
      o.tilt = Math.sin(t * 0.006) * 0.06; o.turn = Math.sin(t * 0.004) * 0.2;
    }],
    ['Sniffing', function (o, t) {
      var s = Math.abs(Math.sin(t * 0.006));
      o.eyeL = o.eyeR = 0.6 - s * 0.3; o.open = 0.06;
      o.browY = -s * 2; o.tilt = -s * 0.06; o.bob = -s * 2;
    }],
    ['Coughing', function (o, t) {
      var c = (t % 2200) / 2200;
      var burst = c < 0.3 ? Math.abs(Math.sin(c / 0.3 * Math.PI * 3)) : 0;
      o.open = burst * 0.7; o.wide = 0.3; o.teeth = 1;
      o.eyeL = o.eyeR = 1 - burst * 0.8; o.tilt = burst * 0.18; o.bob = burst * 5;
    }],
    ['Hiccups', function (o, t) {
      var c = (t % 1500) / 1500;
      var h = c < 0.12 ? Math.sin(c / 0.12 * Math.PI) : 0;
      o.bob = -h * 7; o.open = h * 0.5; o.eyeL = o.eyeR = 1 - h * 0.2 + h * 0.2;
      o.browY = -h * 5; o.scale = 1 + h * 0.04;
    }],
    ['Holding breath', function (o, t) {
      var c = (t % 5000) / 5000;
      o.wide = 0.9; o.open = 0; o.blush = Math.min(1, c * 1.4);
      o.eyeL = o.eyeR = 0.45; o.browY = 3; o.scale = 1 + c * 0.03;
      o.sweat = c > 0.6 ? c : 0;
    }],
    ['Nodding', function (o, t) {
      var n = Math.sin(t * 0.006);
      o.bob = n * 6; o.tilt = n * 0.07; o.smile = 0.4;
      o.eyeL = o.eyeR = 0.85 - Math.abs(n) * 0.2;
    }],
    ['Shaking head', function (o, t) {
      o.turn = Math.sin(t * 0.006);
      o.tilt = Math.sin(t * 0.006) * 0.06; o.smile = -0.3;
      o.eyeL = o.eyeR = 0.8; o.browY = 1;
    }],
    ['Confused', function (o, t) {
      o.tilt = 0.22 + Math.sin(t * 0.0016) * 0.06;
      o.browR = -1.1; o.browL = 0.4;
      o.open = 0.14; o.pucker = 1; o.eyeR = 0.7; o.eyeL = 1;
      o.gazeX = Math.sin(t * 0.0013) * 0.6;
    }],
    ['Suspicious squint', function (o, t) {
      o.eyeL = o.eyeR = 0.22; o.browY = 4; o.browL = -0.6; o.browR = -0.6;
      o.gazeX = Math.sin(t * 0.0009) * 0.8; o.smile = -0.2;
      o.turn = -0.2;
    }],
    ['Gasping', function (o, t) {
      var c = (t % 2800) / 2800;
      var gsp = c < 0.35 ? Math.sin(c / 0.35 * Math.PI) : 0.1;
      o.open = 0.25 + gsp * 0.5; o.pucker = 1;
      o.eyeL = o.eyeR = 0.8 + gsp * 0.2; o.browY = -gsp * 6;
      o.scale = 1 + gsp * 0.03;
    }],
    ['Disgusted', function (o, t) {
      o.eyeL = 0.3; o.eyeR = 0.5; o.browY = 3; o.browL = -0.9;
      o.open = 0.2; o.smile = -0.9; o.wide = 0.3;
      o.turn = -0.5 + Math.sin(t * 0.002) * 0.1; o.tilt = -0.08;
    }],
    ['Smug grin', function (o, t) {
      o.smile = 0.9; o.turn = 0.25; o.browR = -0.8;
      o.eyeL = 0.55; o.eyeR = 0.75; o.gazeX = -0.4;
      o.tilt = -0.06 + Math.sin(t * 0.0012) * 0.03;
    }],
    ['Blushing', function (o, t) {
      o.blush = 0.5 + Math.abs(Math.sin(t * 0.0022)) * 0.5;
      o.smile = 0.5; o.gazeY = 0.6; o.gazeX = 0.5;
      o.eyeL = o.eyeR = 0.6; o.tilt = -0.12;
    }],
    ['Nervous sweat', function (o, t) {
      o.sweat = (t % 2000) / 2000;
      o.gazeX = Math.sin(t * 0.006) * 0.9; o.eyeL = o.eyeR = 0.95;
      o.smile = -0.4; o.open = 0.1; o.browY = -2; o.browL = 0.5; o.browR = 0.5;
    }],
    ['Crying with laughter', function (o, t) {
      var l = Math.abs(Math.sin(t * 0.008));
      o.open = 0.4 + l * 0.45; o.wide = 0.7; o.smile = 1; o.teeth = 1;
      o.eyeL = o.eyeR = 0.15; o.tears = (t % 2200) / 2200;
      o.bob = l * 5; o.tilt = Math.sin(t * 0.008) * 0.1;
    }],
    ['Grinding teeth', function (o, t) {
      o.open = 0.16; o.wide = 0.8; o.teeth = 1;
      o.turn = Math.sin(t * 0.01) * 0.25;
      o.eyeL = o.eyeR = 0.35; o.browY = 4; o.browL = -1; o.browR = -1;
    }],
    ['Licking lips', function (o, t) {
      var c = (t % 2600) / 2600;
      var lick = c < 0.4 ? Math.sin(c / 0.4 * Math.PI) : 0;
      o.open = 0.2 + lick * 0.3; o.tongue = lick > 0.2 ? 1 : 0;
      o.turn = Math.sin(c / 0.4 * Math.PI * 2) * lick * 0.4;
      o.eyeL = o.eyeR = 0.7; o.smile = 0.3;
    }],
    ['Biting lip', function (o, t) {
      o.open = 0.14; o.teeth = 1; o.wide = -0.1;
      o.eyeL = o.eyeR = 0.6; o.gazeX = Math.sin(t * 0.0011) * 0.6;
      o.browY = 1; o.tilt = 0.06;
    }],
    ['Pouting', function (o, t) {
      o.pucker = 1; o.open = 0.2; o.smile = -0.7;
      o.browL = 0.8; o.browR = 0.8; o.gazeY = -0.5;
      o.eyeL = o.eyeR = 0.8; o.tilt = Math.sin(t * 0.0014) * 0.08;
    }],
    ['Squinting into the sun', function (o, t) {
      o.eyeL = 0.12; o.eyeR = 0.18; o.browY = 5;
      o.browL = -1; o.browR = -1; o.open = 0.12; o.wide = 0.4;
      o.tilt = -0.1; o.turn = Math.sin(t * 0.0008) * 0.15;
    }],
    ['Lowering sunglasses', function (o, t) {
      var c = (t % 4600) / 4600;
      o.shades = c < 0.5 ? 1 : 1 + Math.min(1, (c - 0.5) / 0.25);
      o.eyeL = o.eyeR = c > 0.6 ? 1 : 0.9;
      o.browY = c > 0.6 ? -4 : 0; o.smile = 0.3;
    }],
    ['Applying lipstick', function (o, t) {
      var c = (t % 4000) / 4000;
      o.lipstick = Math.min(1, c * 2.2);
      o.pucker = c > 0.4 ? 1 : 0; o.open = 0.18;
      o.eyeL = o.eyeR = 0.7; o.gazeY = 0.3;
    }],
    ['Brushing teeth', function (o, t) {
      o.brush = t * 0.001;
      o.open = 0.45; o.wide = 0.5; o.teeth = 1;
      o.eyeL = o.eyeR = 0.7; o.turn = Math.sin(t * 0.009) * 0.2;
    }],
    ['Jump scare', function (o, t) {
      var c = (t % 3600) / 3600;
      if (c < 0.72) { o.eyeL = o.eyeR = 0.75; o.open = 0.05; o.scale = 1; }
      else { var a = 1 - (c - 0.72) / 0.28;
        o.eyeL = o.eyeR = 1; o.open = 0.85; o.wide = 0.5; o.teeth = 1;
        o.browY = -7 * a; o.scale = 1 + a * 0.16; o.bob = -a * 5; }
    }],
    ['Thousand-yard stare', function (o, t) {
      var b = Math.sin(t * 0.0007);
      o.eyeL = o.eyeR = b > 0.95 ? 0.1 : 0.95;
      o.gazeX = 0; o.gazeY = -0.1; o.open = 0.08;
      o.browY = 1; o.smile = -0.1; o.bob = Math.sin(t * 0.0009) * 1;
    }]
  ];

  for (var fi = 0; fi < FACES.length; fi++) {
    (function (i) {
      CHANNELS.push({
        name: FACES[i][0],
        draw: function (g, t) {
          var o = baseFace(i);
          o.hairStyle = (i * 3 + 1) % 8;          /* decouple hair from skin tone */
          if (i % 7 === 2) o.beard = 1;
          if (i % 9 === 4) o.tache = 1;
          if (i % 11 === 5) o.glasses = 1;
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
