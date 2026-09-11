/* ---------------------------------------------------------------
   leetv.tv — five hundred and ninety-nine channels of broadcast,
   all fighting through the same interference.

   Every channel is a scene in three dimensions. Geometry is built
   from a small vocabulary — extruded outlines, lathed profiles,
   boxes, spheres, tubes and tapered bars — then rotated, projected,
   depth-sorted and shaded into an offscreen 160x120 canvas. Models
   are authored the way you would describe them out loud: +X right,
   +Y up, +Z out of the screen towards you. pxy() is the only place
   that knows the tube disagrees.

   The compositor then rebuilds every pixel out of noise, pulling
   toward the scene colour by the current signal strength, sampling
   the R, G and B channels a few pixels apart for chromatic split.
   Nothing is drawn ON the static — everything is made OF it.

   Moving the cursor turns the picture: most channels read it as a
   camera and swing round, while the heads read it as a gaze and look
   back at you. A hundred of the channels are optical illusions, and
   most of those only work from one angle — so the cursor is also the
   thing that takes them apart.

   Clicking (or Enter/Space on) the set changes channel. Channels
   come from a shuffled bag, so no channel repeats until all of them
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

  /* ================================================================
     CHANNEL 0 — the LEETV ident, cut from solid pink
     ================================================================ */

  var IDENT_STROKES = {
    L: [[-0.26, 0.05, 0.11, 0.68], [0.02, -0.56, 0.39, 0.17]],
    E: [[-0.26, 0.05, 0.11, 0.68], [0.05, 0.62, 0.42, 0.11],
        [0.02, 0.05, 0.36, 0.1], [0.05, -0.52, 0.42, 0.11]],
    T: [[0, 0.62, 0.46, 0.11], [0, -0.02, 0.11, 0.61]],
    V: [[-0.22, 0, 0.1, 0.7, 0.24], [0.22, 0, 0.1, 0.7, -0.24]]
  };

  function drawIdent(g, t) {
    var letters = 'LEETV'.split('');
    var ps = [], i, k;
    for (i = 0; i < letters.length; i++) {
      var st = IDENT_STROKES[letters[i]];
      var ox = (i - 2) * 1.12;
      for (k = 0; k < st.length; k++) {
        var b = st[k];
        ps.push(part(xfG(boxGeo(0, 0, 0, b[2], b[3], 0.2), 0, 0, b[4] || 0,
                         ox + b[0], b[1], 0), [255, 51, 153]));
      }
    }
    obj(g, mergeC(ps), Math.sin(t * 0.0007) * 0.12, Math.sin(t * 0.0005) * 0.34, 0, 28, 0);
  }

  /* ================================================================
     THE ORIGINAL ELEVEN
     ================================================================ */

  function drawHorses(g, t) {
    var ps = [], k, i;
    for (k = 0; k < 3; k++) {
      var ph = t * 0.0075 + k * 2.1;
      var x = (((t * 0.00035 + k * 0.34) % 1) - 0.5) * 6.5;
      var y = -0.35 + k * 0.5 + Math.abs(Math.sin(ph)) * 0.1;
      var z = 1.2 - k * 1.3, s2 = 1 - k * 0.16;
      var bd = [];
      /* barrel, laid along X, with the neck and head raked up off it */
      bd.push(part(scG(xfG(lathe([[0.06, 1], [0.55, 0.72], [0.66, 0], [0.55, -0.7],
                                  [0.06, -1]], 9), 0, 0, -Math.PI / 2),
                       0.95 * s2, 0.5 * s2, 0.42 * s2), [126, 82, 46]));
      bd.push(part(barGeo(0.62 * s2, 0.24 * s2, 0, 1.02 * s2, 0.86 * s2, 0, 0.19 * s2),
                   [126, 82, 46]));
      bd.push(part(xfG(scG(xfG(lathe([[0.06, 1], [0.5, 0.7], [0.55, 0], [0.4, -0.75],
                                      [0.06, -1]], 8), 0, 0, -Math.PI / 2),
                           0.42 * s2, 0.2 * s2, 0.18 * s2), 0, 0, -0.5,
                       1.28 * s2, 0.98 * s2, 0), [138, 92, 52]));
      bd.push(part(xfG(scG(prism([[0.2, 0], [-0.5, 0.34], [-0.62, -0.3]], 0.05), s2, s2, 1),
                       0, 0, 0, 0.95 * s2, 1.05 * s2, 0), [70, 46, 26]));
      bd.push(part(xfG(scG(prism([[0, 0.2], [-0.85, 0.35], [-0.95, -0.4]], 0.05), s2, s2, 1),
                       0, 0, 0, -0.95 * s2, 0.25 * s2, 0), [70, 46, 26]));
      for (i = 0; i < 4; i++) {
        var sw = Math.sin(ph + i * 1.6);
        var hx = (i < 2 ? 0.62 : -0.62) * s2, hz = (i % 2 ? 0.26 : -0.26) * s2;
        var kx = hx + sw * 0.34 * s2;
        bd.push(part(barGeo(hx, -0.28 * s2, hz, kx, -0.78 * s2, hz, 0.1 * s2), [126, 82, 46]));
        bd.push(part(barGeo(kx, -0.78 * s2, hz, kx + sw * 0.18 * s2, -1.34 * s2, hz, 0.075 * s2),
                     [104, 66, 38]));
      }
      for (i = 0; i < bd.length; i++)
        ps.push({ V: xfG(bd[i], 0, 0, 0, x, y, z).V, F: bd[i].F, c: bd[i].c });
    }
    obj(g, mergeC(ps), 0.12, 0, 0, 30, 0);
  }

  function drawTiger(g, t) {
    var chew = Math.abs(Math.sin(t * 0.006)) * 0.3;
    var ps = [], i;
    ps.push(part(ovalGeo(0, 0.1, 0, 1.0, 0.95, 0.85, 6, 12), [222, 150, 52]));
    for (i = 0; i < 5; i++)
      ps.push(part(xfG(boxGeo(0, 0, 0, 0.06, 0.34, 0.02), 0, 0, (i - 2) * 0.3,
                       (i - 2) * 0.34, 0.75, 0.55), [40, 32, 28]));
    for (i = 0; i < 2; i++) {
      var sd = i ? 1 : -1;
      ps.push(part(ovalGeo(sd * 0.72, 0.85, -0.2, 0.24, 0.26, 0.1, 3, 7), [200, 128, 44]));
      ps.push(part(ovalGeo(sd * 0.38, 0.24, 0.62, 0.19, 0.17, 0.1, 3, 7), [246, 230, 160]));
      ps.push(part(ovalGeo(sd * 0.38, 0.24, 0.72, 0.08, 0.08, 0.04, 3, 5), [24, 20, 18]));
    }
    ps.push(part(ovalGeo(0, -0.34 - chew * 0.3, 0.72, 0.42, 0.26, 0.34, 4, 8), [248, 240, 220]));
    ps.push(part(xfG(prism([[-0.12, 0.08], [0.12, 0.08], [0, -0.12]], 0.06), 0, 0, 0,
                     0, -0.16, 0.96), [50, 32, 34]));
    ps.push(part(boxGeo(0, -0.5 - chew, 0.9, 0.24, 0.1 + chew, 0.1), [70, 26, 30]));
    ps.push(part(xfG(boxGeo(0, 0, 0, 0.34, 0.06, 0.34), 0.2, 0.4, 0.2,
                     0.9, -0.2 + chew * 0.4, 0.9), [242, 238, 226]));
    ps.push(part(xfG(boxGeo(0, 0, 0, 0.26, 0.09, 0.2), 0.2, 0.4, 0.2,
                     0.9, -0.08 + chew * 0.4, 0.9), [214, 88, 84]));
    obj(g, mergeC(ps), 0.05, Math.sin(t * 0.0008) * 0.24, 0, 34, 0);
  }

  function drawPickles(g, t) {
    var ps = [], k, i;
    for (k = 0; k < 3; k++) {
      var ph = t * 0.005 + k * 2.0;
      var x = (k - 1) * 1.25, y = Math.abs(Math.sin(ph)) * 0.34 - 0.1;
      var lean = Math.sin(ph) * 0.24;
      var bd = [part(scG(xfG(lathe([[0.05, 1], [0.55, 0.72], [0.62, 0], [0.55, -0.72],
                                    [0.05, -1]], 9), 0, 0, 0), 0.55, 1.0, 0.5),
                     [92, 150, 58])];
      for (i = 0; i < 14; i++) {
        var a = i * 2.399;
        bd.push(part(ovalGeo(Math.cos(a) * 0.4, Math.sin(i * 1.1) * 0.7, Math.sin(a) * 0.36,
                             0.07, 0.05, 0.07, 3, 5), [140, 190, 90]));
      }
      for (i = 0; i < 2; i++) {
        var sd = i ? 1 : -1;
        bd.push(part(ovalGeo(sd * 0.2, 0.44, 0.44, 0.1, 0.1, 0.05, 3, 6), [244, 244, 236]));
        bd.push(part(ovalGeo(sd * 0.2, 0.44, 0.48, 0.05, 0.05, 0.03, 3, 4), [24, 22, 20]));
        bd.push(part(barGeo(sd * 0.5, 0.2, 0, sd * (0.9 + Math.sin(ph + i) * 0.3),
                            0.5 + Math.cos(ph + i) * 0.5, 0, 0.07), [92, 150, 58]));
        bd.push(part(barGeo(sd * 0.24, -0.9, 0, sd * (0.3 + Math.sin(ph + i * 2) * 0.25),
                            -1.4, 0, 0.08), [92, 150, 58]));
      }
      bd.push(part(boxGeo(0, 0.1, 0.5, 0.16, 0.03, 0.02), [40, 60, 30]));
      for (i = 0; i < bd.length; i++)
        ps.push({ V: xfG(bd[i], 0, 0, lean, x, y, 0).V, F: bd[i].F, c: bd[i].c });
    }
    obj(g, mergeC(ps), 0.1, Math.sin(t * 0.0006) * 0.2, 0, 30, 0);
  }

  function drawHeart(g, t) {
    var b = (t % 900) / 900;
    var s2 = 1 + (b < 0.18 ? Math.sin(b / 0.18 * Math.PI) * 0.16 :
                  b < 0.4 ? Math.sin((b - 0.18) / 0.22 * Math.PI) * 0.09 : 0);
    var m = geo('heart3', function () {
      return mergeC([part(scG(prism(heartO(1), 0.5), 1, 1, 1), [214, 40, 62])]);
    });
    var m2 = { V: scG(m, s2, s2, s2).V, F: m.F, C: m.C };
    obj(g, m2, 0.08, Math.sin(t * 0.0009) * 0.5, 0.1, 26, 0);
    var ps = [], i;
    for (i = 0; i < 3; i++)
      ps.push(part(cylGeo(-0.3 + i * 0.3, 1.5 * s2 + i * 0.1, 0, 0.1, 0.16, 0.6, 7),
                   [168, 30, 48]));
    obj(g, mergeC(ps), 0.08, Math.sin(t * 0.0009) * 0.5, 0.1, 26, 0);
  }

  function drawEye(g, t) {
    var c = (t % 3200) / 3200;
    var lid = c > 0.78 && c < 0.9 ? 1 : 0;
    var ps = [], i;
    ps.push(part(ovalGeo(0, 0, 0, 1.15, 1.15, 1.0, 7, 14), [244, 242, 234]));
    for (i = 0; i < 12; i++) {
      var a = i * TAU / 12;
      ps.push(part(barGeo(Math.cos(a) * 0.42, Math.sin(a) * 0.42, 0.95,
                          Math.cos(a) * 0.14, Math.sin(a) * 0.14, 1.05, 0.03), [60, 110, 140]));
    }
    ps.push(part(xfG(prism(discO(0.46, 12), 0.06), 0, 0, 0, 0, 0, 0.94), [78, 140, 170]));
    ps.push(part(xfG(prism(discO(0.22, 10), 0.06), 0, 0, 0, 0, 0, 1.02), [16, 14, 18]));
    ps.push(part(ovalGeo(-0.18, 0.2, 1.06, 0.09, 0.09, 0.03, 3, 5), [250, 250, 244]));
    /* the lids swing down over the ball rather than hanging across the tube */
    ps.push(part(xfG(prism(discO(1.35, 14), 0.16), 0, 0, 0,
                     0, (1 - lid) * 2.9 + 0.05, 0.35), [214, 150, 118]));
    ps.push(part(xfG(prism(discO(1.35, 14), 0.16), 0, 0, 0,
                     0, -(1 - lid) * 2.4 - 1.5, 0.35), [214, 150, 118]));
    obj(g, mergeC(ps), 0, Math.sin(t * 0.0008) * 0.3, 0, 30, 0);
  }

  function drawSkull(g, t) {
    var laugh = Math.abs(Math.sin(t * 0.008));
    var ps = [], i;
    ps.push(part(scG(lathe([[0.06, 1.0], [0.55, 0.9], [0.9, 0.5], [0.98, 0], [0.8, -0.5],
                            [0.55, -0.8], [0.06, -0.9]], 12), 1.0, 0.95, 0.9), [232, 228, 212]));
    ps.push(part(xfG(scG(lathe([[0.05, 0.26], [0.6, 0.16], [0.66, -0.1], [0.4, -0.24],
                                [0.05, -0.26]], 10), 1.0, 1.0, 0.9), 0, 0, 0,
                     0, -0.92 - laugh * 0.42, 0.16), [222, 218, 202]));
    for (i = 0; i < 2; i++) {
      var sd = i ? 1 : -1;
      ps.push(part(ovalGeo(sd * 0.4, 0.16, 0.66, 0.26, 0.28, 0.16, 4, 8), [26, 24, 26]));
      ps.push(part(ovalGeo(sd * 0.4, 0.16, 0.7, 0.1, 0.1, 0.06, 3, 5), [200, 60, 60]));
    }
    ps.push(part(xfG(prism([[-0.14, 0.16], [0.14, 0.16], [0, -0.16]], 0.1), 0, 0, 0,
                     0, -0.36, 0.72), [26, 24, 26]));
    for (i = 0; i < 6; i++) {
      ps.push(part(boxGeo(-0.4 + i * 0.16, -0.78, 0.6, 0.06, 0.09, 0.06), [244, 242, 230]));
      ps.push(part(boxGeo(-0.4 + i * 0.16, -1.02 - laugh * 0.4, 0.6, 0.06, 0.09, 0.06),
                   [244, 242, 230]));
    }
    obj(g, mergeC(ps), 0.06 + laugh * 0.1, Math.sin(t * 0.0011) * 0.4, laugh * 0.08, 32, 0);
  }

  function drawGhostToilet(g, t) {
    var bob = Math.sin(t * 0.0022) * 0.12;
    var ps = [], i;
    ps.push(part(lathe([[0.7, -1.4], [0.6, -0.9], [0.5, -0.5], [0.75, -0.2], [0.8, 0.05],
                        [0.7, 0.12], [0.62, -0.1], [0.42, -0.4]], 12), [242, 244, 246]));
    ps.push(part(lathe([[0, 0.12], [0.78, 0.12], [0.8, 0.2], [0, 0.2]], 12), [230, 232, 236]));
    ps.push(part(boxGeo(0, 0.7, -0.7, 0.5, 0.6, 0.2), [232, 236, 242]));
    for (i = 0; i < 7; i++) {
      var f = i / 7;
      ps.push(part(ovalGeo(Math.sin(t * 0.002 + f * 3) * 0.2, 1.5 + bob - f * 0.24,
                           0.4 - f * 0.05, 0.62 - f * 0.06, 0.3, 0.5 - f * 0.05, 4, 9),
                   [182, 208, 236]));
    }
    for (i = 0; i < 2; i++)
      ps.push(part(ovalGeo((i ? 1 : -1) * 0.24, 1.62 + bob, 0.5, 0.11, 0.14, 0.06, 3, 6),
                   [40, 44, 56]));
    ps.push(part(ovalGeo(0, 1.3 + bob, 0.5, 0.12, 0.14, 0.06, 3, 6), [40, 44, 56]));
    g.globalAlpha = 0.85;
    obj(g, mergeC(ps), 0.1, Math.sin(t * 0.0006) * 0.3, 0, 30, 0);
    g.globalAlpha = 1;
  }

  function drawBigfoot(g, t) {
    var c = (t % 3600) / 3600;
    var flash = c > 0.55 && c < 0.62;
    var ps = [], i;
    var step = Math.sin(t * 0.004);
    ps.push(part(ovalGeo(-0.7, 0.1, -0.5, 0.5, 0.7, 0.42, 5, 10), flash ? [140, 116, 92] : [72, 58, 44]));
    ps.push(part(ovalGeo(-0.7, 0.95, -0.5, 0.3, 0.3, 0.3, 4, 8), flash ? [140, 116, 92] : [72, 58, 44]));
    for (i = 0; i < 2; i++) {
      var sd = i ? 1 : -1;
      ps.push(part(barGeo(-0.7 + sd * 0.45, 0.5, -0.5, -0.7 + sd * 0.72,
                          -0.3 + sd * step * 0.3, -0.5, 0.12),
                   flash ? [126, 104, 82] : [64, 52, 40]));
      ps.push(part(barGeo(-0.7 + sd * 0.2, -0.55, -0.5, -0.7 + sd * 0.24,
                          -1.4, -0.5 + sd * step * 0.5, 0.14),
                   flash ? [126, 104, 82] : [64, 52, 40]));
    }
    for (i = 0; i < 2; i++)
      ps.push(part(ovalGeo(-0.7 + (i ? 1 : -1) * 0.12, 1.0, -0.22, 0.06, 0.06, 0.04, 3, 4),
                   [230, 210, 120]));
    ps.push(part(boxGeo(1.1, -0.2, 0.9, 0.4, 0.28, 0.26), [50, 52, 62]));
    ps.push(part(cylGeo(1.1, -0.2, 1.2, 0.16, 0.2, 0.3, 8, 'z'), [30, 32, 40]));
    if (flash) {
      g.globalAlpha = 0.4;
      obj(g, mergeC([part(xfG(coneGeo(0, 0, 0, 1.2, 2.4, 8), 0, 0, Math.PI / 2, -0.1, -0.2, 0.9),
                          [250, 248, 230])]), 0, 0, 0, 30, 0);
      g.globalAlpha = 1;
    }
    obj(g, mergeC(ps), 0.06, 0.18, 0, 30, 0);
  }

  function drawTiki(g, t) {
    var sw = Math.sin(t * 0.005);
    var ps = [], i;
    for (i = 0; i < 4; i++)
      ps.push(part(xfG(boxGeo(0, 0, 0, 0.6, 0.42, 0.55), 0, 0, sw * 0.06 * (i - 1.5),
                       sw * 0.1 * (i - 1.5), -1.1 + i * 0.85, 0), [124, 82, 46]));
    for (i = 0; i < 2; i++) {
      var sd = i ? 1 : -1;
      ps.push(part(ovalGeo(sd * 0.26, 1.5, 0.5, 0.14, 0.1, 0.06, 3, 6), [244, 236, 210]));
      ps.push(part(ovalGeo(sd * 0.26, 1.5, 0.54, 0.06, 0.06, 0.03, 3, 4), [30, 24, 20]));
      ps.push(part(xfG(prism([[-0.1, 0.3], [0.1, 0.3], [0.16, -0.3], [-0.16, -0.3]], 0.05),
                       0, 0, sd * 0.4, sd * 0.7, 1.2, 0.3), [92, 60, 34]));
      ps.push(part(barGeo(sd * 0.62, 0.6, 0, sd * (1.0 + sw * 0.3), 1.0 + sw * 0.4, 0.2, 0.12),
                   [124, 82, 46]));
    }
    ps.push(part(boxGeo(0, 1.05, 0.52, 0.42, 0.1, 0.06), [60, 40, 24]));
    for (i = 0; i < 5; i++)
      ps.push(part(boxGeo(-0.32 + i * 0.16, 1.02, 0.56, 0.05, 0.07, 0.04), [240, 236, 220]));
    ps.push(part(lathe([[0, 1.9], [0.6, 1.75], [0.75, 1.62], [0.7, 1.58], [0, 1.6]], 10),
                 [200, 60, 50]));
    obj(g, mergeC(ps), 0.06, sw * 0.3, sw * 0.05, 28, 0);
  }

  function drawUfoCow(g, t) {
    var c = (t % 5200) / 5200;
    var lift = c > 0.3 ? Math.min(1, (c - 0.3) / 0.5) : 0;
    var ps = [], i;
    var ux = Math.sin(t * 0.0008) * 0.5;
    ps.push(part(lathe([[0, -0.16], [1.3, -0.1], [1.4, 0.06], [1.1, 0.2], [0, 0.24]], 14),
                 [166, 172, 186]));
    ps.push(part(ovalGeo(0, 0.34, 0, 0.6, 0.34, 0.6, 4, 10), [130, 210, 230]));
    for (i = 0; i < 8; i++) {
      var a = i * TAU / 8 + t * 0.003;
      ps.push(part(ovalGeo(Math.cos(a) * 1.05, -0.14, Math.sin(a) * 1.05, 0.11, 0.09, 0.11, 3, 5),
                   i % 2 ? [250, 220, 110] : [230, 90, 90]));
    }
    for (i = 0; i < ps.length; i++)
      ps[i] = { V: xfG(ps[i], 0, 0, 0, ux, 1.15, 0).V, F: ps[i].F, c: ps[i].c };

    var cy = -1.15 + lift * 1.9;
    var cow = [part(scG(xfG(lathe([[0.05, 1], [0.5, 0.72], [0.6, 0], [0.5, -0.72],
                                   [0.05, -1]], 8), 0, 0, -Math.PI / 2), 0.62, 0.34, 0.3),
                    [238, 236, 230])];
    cow.push(part(ovalGeo(0.6, 0.2, 0, 0.22, 0.2, 0.2, 3, 7), [238, 236, 230]));
    cow.push(part(ovalGeo(-0.2, 0.05, 0.28, 0.18, 0.14, 0.06, 3, 6), [46, 42, 44]));
    cow.push(part(ovalGeo(0.15, -0.1, -0.3, 0.16, 0.12, 0.06, 3, 6), [46, 42, 44]));
    for (i = 0; i < 4; i++)
      cow.push(part(barGeo((i < 2 ? 0.32 : -0.32), -0.24, (i % 2 ? 0.18 : -0.18),
                           (i < 2 ? 0.34 : -0.34), -0.66 + lift * 0.2 * Math.sin(t * 0.01 + i),
                           (i % 2 ? 0.2 : -0.2), 0.06), [238, 236, 230]));
    for (i = 0; i < cow.length; i++)
      ps.push({ V: xfG(cow[i], 0, lift * 3, lift * 0.6, ux * lift, cy, 0).V,
                F: cow[i].F, c: cow[i].c });
    obj(g, mergeC(ps), 0.12, 0, 0, 30, 0);
    if (lift > 0) {
      g.globalAlpha = 0.28;
      obj(g, mergeC([part(xfG(coneGeo(0, 0, 0, 1.1, 2.3, 10), Math.PI, 0, 0, ux, -0.15, 0),
                          [180, 240, 200])]), 0.12, 0, 0, 30, 0);
      g.globalAlpha = 1;
    }
  }

  /* ================================================================
     ESOTERIC
     ================================================================ */

  function drawAllSeeingEye(g, t) {
    var ps = [], i;
    for (i = 0; i < 12; i++) {
      var a = t * 0.0009 + i * TAU / 12;
      ps.push(part(boxGeo(Math.cos(a) * 1.7, Math.sin(a) * 1.7, -1.2, 0.55, 0.05, 0.05),
                   [200, 164, 74]));
    }
    ps.push(part(scG(prism([[0, 1.25], [1.35, -0.95], [-1.35, -0.95]], 0.16), 1, 1, 1),
                 [198, 158, 58]));
    ps.push(part(xfG(scG(prism([[0, 1.0], [1.05, -0.72], [-1.05, -0.72]], 0.02), 1, 1, 1),
                     0, 0, 0, 0, 0.05, 0.18), [58, 44, 16]));
    ps.push(part(xfG(scG(prism(discO(0.5, 12), 0.06), 1, 0.62, 1), 0, 0, 0, 0, 0, 0.24),
                 [244, 234, 210]));
    ps.push(part(xfG(prism(discO(0.24, 10), 0.06), 0, 0, 0, 0, 0, 0.32), [90, 130, 170]));
    ps.push(part(xfG(prism(discO(0.11, 8), 0.06), 0, 0, 0, 0, 0, 0.4), [20, 18, 22]));
    obj(g, mergeC(ps), 0.06, Math.sin(t * 0.0006) * 0.3, 0, 30, 0);
  }

  function drawOuroboros(g, t) {
    var ps = [], i, n = 26;
    for (i = 0; i < n; i++) {
      var a = i / n * TAU + t * 0.0009;
      var r = 0.16 + (i / n) * 0.16;
      ps.push(part(ovalGeo(Math.cos(a) * 1.25, Math.sin(a) * 1.25, Math.sin(a * 2) * 0.3,
                           r, r, r, 3, 7),
                   i % 2 ? [86, 140, 66] : [66, 112, 52]));
    }
    var ha = t * 0.0009;
    ps.push(part(ovalGeo(Math.cos(ha) * 1.25, Math.sin(ha) * 1.25, Math.sin(ha * 2) * 0.3 + 0.1,
                         0.36, 0.28, 0.3, 4, 8), [100, 156, 74]));
    for (i = 0; i < 2; i++)
      ps.push(part(ovalGeo(Math.cos(ha) * 1.25 + (i ? 0.12 : -0.12),
                           Math.sin(ha) * 1.25 + 0.12,
                           Math.sin(ha * 2) * 0.3 + 0.32, 0.07, 0.07, 0.05, 3, 5),
                   [240, 200, 60]));
    obj(g, mergeC(ps), 0.4, Math.sin(t * 0.0005) * 0.4, 0, 30, 0);
  }

  function drawPentagram(g, t) {
    var ps = [], i;
    ps.push(part(prism(starO(1.35, 0.53, 5, Math.PI), 0.22), [214, 176, 70]));
    ps.push(part(prism(ringO(1.5, 0.09, 22), 0.16), [190, 150, 56]));
    for (i = 0; i < 5; i++) {
      var a = -Math.PI / 2 + i * TAU / 5;
      ps.push(part(ovalGeo(Math.cos(a) * 1.35, Math.sin(a) * 1.35, 0.18, 0.1, 0.1, 0.1, 3, 5),
                   [250, 214, 120]));
    }
    obj(g, mergeC(ps), Math.sin(t * 0.0008) * 0.4, Math.sin(t * 0.0005) * 0.5, t * 0.0007, 30, 0);
  }

  function drawMoonPhases(g, t) {
    var ps = [], i;
    for (i = 0; i < 5; i++) {
      var x = -1.7 + i * 0.85;
      var ph = (t * 0.0004 + i * 0.2) % 1;
      ps.push(part(ovalGeo(x, 0, 0, 0.36, 0.36, 0.36, 5, 10), [226, 224, 210]));
      ps.push(part(ovalGeo(x + Math.cos(ph * TAU) * 0.62, 0, 0.34, 0.36, 0.36, 0.3, 5, 10),
                   [34, 34, 44]));
    }
    for (i = 0; i < 14; i++)
      ps.push(part(ovalGeo(((i * 41 % 71) / 71 - 0.5) * 4.4, ((i * 29 % 53) / 53 - 0.5) * 2.6,
                           -1.4, 0.03, 0.03, 0.03, 3, 4), [240, 240, 232]));
    obj(g, mergeC(ps), 0, 0, 0, 30, 0);
  }

  function drawSigil(g, t) {
    var ps = [], i, a, b;
    ps.push(part(prism(ringO(1.45, 0.07, 22), 0.05), [178, 130, 200]));
    ps.push(part(prism(ringO(1.15, 0.05, 20), 0.05), [148, 106, 176]));
    for (i = 0; i < 7; i++) {
      a = -Math.PI / 2 + i * TAU / 7;
      b = -Math.PI / 2 + ((i * 3) % 7) * TAU / 7;
      ps.push(part(barGeo(Math.cos(a) * 1.1, Math.sin(a) * 1.1, 0,
                          Math.cos(b) * 1.1, Math.sin(b) * 1.1, 0, 0.05), [204, 160, 232]));
      ps.push(part(ovalGeo(Math.cos(a) * 1.1, Math.sin(a) * 1.1, 0.08, 0.1, 0.1, 0.1, 3, 5),
                   [230, 200, 250]));
    }
    obj(g, mergeC(ps), 0.3, Math.sin(t * 0.0006) * 0.5, t * 0.0009, 30, 0);
  }

  function drawTarot(g, t) {
    var a = t * 0.0013;
    var ps = [], i;
    ps.push(part(boxGeo(0, 0, 0, 0.95, 1.45, 0.09), [238, 230, 206]));
    ps.push(part(boxGeo(0, 0, 0.1, 0.82, 1.32, 0.01), [60, 40, 90]));
    ps.push(part(xfG(prism(starO(0.34, 0.14, 5), 0.02), 0, 0, 0, 0, 0.5, 0.14), [244, 208, 90]));
    ps.push(part(boxGeo(0, -0.3, 0.14, 0.12, 0.5, 0.02), [244, 208, 90]));
    ps.push(part(boxGeo(0, -0.05, 0.14, 0.42, 0.1, 0.02), [244, 208, 90]));
    for (i = 0; i < 4; i++)
      ps.push(part(ovalGeo((i < 2 ? -1 : 1) * 0.62, (i % 2 ? 1 : -1) * 1.1, 0.14,
                           0.07, 0.07, 0.02, 3, 5), [244, 208, 90]));
    obj(g, mergeC(ps), 0.1, a, Math.sin(t * 0.0007) * 0.1, 30, 0);
  }

  /* ================================================================
     GEOMETRIC
     ================================================================ */

  function drawSpiral(g, t) {
    var ps = [], i, n = 60;
    for (i = 0; i < n; i++) {
      var f = i / n;
      var a = f * 22 + t * 0.003;
      var r = 0.1 + f * 1.9;
      ps.push(part(ovalGeo(Math.cos(a) * r, Math.sin(a) * r, 1.5 - f * 5,
                           0.05 + f * 0.16, 0.05 + f * 0.16, 0.05 + f * 0.16, 3, 6),
                   i % 2 ? [244, 240, 232] : [150, 70, 150]));
    }
    obj(g, mergeC(ps), 0, 0, 0, 30, 0);
  }

  function drawWireCube(g, t) {
    var c = geo('cub', gCube);
    wire(g, xform(c.V, t * 0.0009, t * 0.0013, t * 0.0005), c.E, 34, '120,230,255', 2.4);
    var inner = geo('cub2', gCube);
    wire(g, xform(inner.V, -t * 0.0013, -t * 0.0009, 0).map(function (p) {
      return [p[0] * 0.5, p[1] * 0.5, p[2] * 0.5];
    }), inner.E, 34, '255,120,190', 1.6);
  }

  function drawKaleido(g, t) {
    var ps = [], i, k;
    for (k = 0; k < 6; k++) {
      var a = k * TAU / 6 + t * 0.0012;
      for (i = 0; i < 4; i++) {
        var r = 0.5 + i * 0.42;
        var b = a + i * 0.3;
        ps.push(part(xfG(scG(gTetra(), 0.2, 0.2, 0.2), b, t * 0.002 + i, 0,
                         Math.cos(b) * r, Math.sin(b) * r, Math.sin(t * 0.001 + i) * 0.5),
                     [[240, 90, 130], [110, 210, 240], [250, 220, 110], [140, 230, 150]][i]));
      }
    }
    obj(g, mergeC(ps), 0, 0, t * 0.0006, 30, 0);
  }

  function drawLissajous(g, t) {
    var ps = [], i, n = 70;
    for (i = 0; i < n; i++) {
      var u = i / n * TAU;
      ps.push(part(ovalGeo(Math.sin(u * 3 + t * 0.0008) * 1.6, Math.sin(u * 2) * 1.2,
                           Math.sin(u * 5 + t * 0.0004) * 1.0, 0.07, 0.07, 0.07, 3, 5),
                   [110, 240, 200]));
    }
    obj(g, mergeC(ps), 0.2, t * 0.0006, 0, 30, 0);
  }

  function drawMoire(g, t) {
    var ps = [], i, k;
    for (k = 0; k < 2; k++)
      for (i = 1; i <= 9; i++)
        ps.push(part(torGeo(k ? Math.sin(t * 0.0011) * 0.6 : 0, 0,
                            k ? 0.6 : -0.6, i * 0.22, 0.035, 22, 4, 'z'),
                     k ? [240, 120, 170] : [120, 200, 240]));
    obj(g, mergeC(ps), 0.1, Math.sin(t * 0.0005) * 0.2, 0, 34, 0);
  }

  function drawTessellation(g, t) {
    var ps = [], i, j;
    for (i = 0; i < 7; i++) for (j = 0; j < 7; j++) {
      var x = (i - 3) * 0.62, z = (j - 3) * 0.62;
      var h = 0.1 + (Math.sin(t * 0.0022 + i * 0.7 + j * 0.5) * 0.5 + 0.5) * 0.7;
      ps.push(part(xfG(scG(prism(discO(0.32, 6, 0.5), h), 1, 1, 1), Math.PI / 2, 0, 0,
                       x, h - 0.6, z),
                   (i + j) % 2 ? [90, 170, 220] : [200, 150, 240]));
    }
    obj(g, mergeC(ps), 0.55, Math.sin(t * 0.0005) * 0.5, 0, 26, 1);
  }

  function drawSierpinski(g, t) {
    var m = geo('sierp', function () {
      var pts = [[0, 1.5, 0], [-1.35, -0.8, 0.78], [1.35, -0.8, 0.78], [0, -0.8, -1.55]];
      var out = [], base = gTetra();
      /* three levels: 16 little tetrahedra, each an eighth of the whole */
      function rec(cx, cy, cz, s2, d) {
        var k;
        if (d === 0) {
          out.push(part(xfG(scG(base, s2, s2, s2), 0, 0, 0, cx, cy, cz),
                        [240, 176 + d * 20, 84 + (out.length % 4) * 22]));
          return;
        }
        for (k = 0; k < 4; k++)
          rec(cx + pts[k][0] * s2 * 0.5, cy + pts[k][1] * s2 * 0.5,
              cz + pts[k][2] * s2 * 0.5, s2 * 0.5, d - 1);
      }
      rec(0, 0, 0, 0.9, 2);
      return mergeC(out);
    });
    obj(g, m, 0.16, t * 0.0011, 0, 26, 1);
  }

  /* ================================================================
     ANIMALS DOING WEIRD THINGS
     ================================================================ */

  function drawOctopusDJ(g, t) {
    var ps = [], i;
    ps.push(part(ovalGeo(0, 0.55, 0, 0.72, 0.68, 0.62, 5, 10), [178, 82, 154]));
    for (i = 0; i < 2; i++) {
      ps.push(part(ovalGeo((i ? 1 : -1) * 0.3, 0.62, 0.5, 0.16, 0.16, 0.1, 3, 6), [246, 240, 226]));
      ps.push(part(ovalGeo((i ? 1 : -1) * 0.3, 0.62, 0.56, 0.07, 0.07, 0.04, 3, 5), [24, 20, 26]));
    }
    for (i = 0; i < 8; i++) {
      var a = i * TAU / 8;
      var w = Math.sin(t * 0.005 + i) * 0.5;
      ps.push(part(barGeo(Math.cos(a) * 0.4, 0.1, Math.sin(a) * 0.4,
                          Math.cos(a) * (1.0 + w * 0.3), -0.8 + w * 0.4,
                          Math.sin(a) * (1.0 + w * 0.3), 0.11), [158, 68, 138]));
    }
    ps.push(part(boxGeo(0, -1.1, 0.3, 1.5, 0.14, 0.7), [50, 50, 60]));
    for (i = 0; i < 2; i++)
      ps.push(part(xfG(cylGeo(0, 0, 0, 0.44, 0.44, 0.05, 14), 0, 0, 0,
                       (i ? 1 : -1) * 0.75, -0.94, 0.3), [24, 24, 30]));
    for (i = 0; i < 2; i++)
      ps.push(part(xfG(boxGeo(0, 0.3, 0, 0.05, 0.3, 0.02), 0, 0, t * (i ? 0.008 : -0.006),
                       (i ? 1 : -1) * 0.75, -0.94, 0.36), [220, 60, 60]));
    ps.push(part(torGeo(0, 0.95, 0, 0.7, 0.07, 12, 5, 'z'), [40, 40, 48]));
    obj(g, mergeC(ps), 0.16, Math.sin(t * 0.0007) * 0.3, 0, 30, 0);
  }

  function drawFrogUnicycle(g, t) {
    var a = t * 0.006, wob = Math.sin(t * 0.004) * 0.16;
    var ps = [], i;
    ps.push(part(xfG(torGeo(0, 0, 0, 0.62, 0.07, 16, 5, 'z'), 0, 0, 0, 0, -0.9, 0), [40, 40, 48]));
    for (i = 0; i < 6; i++)
      ps.push(part(barGeo(0, -0.9, 0, Math.cos(a + i * TAU / 6) * 0.6,
                          -0.9 + Math.sin(a + i * TAU / 6) * 0.6, 0, 0.02), [200, 200, 210]));
    ps.push(part(barGeo(0, -0.9, 0, 0, -0.05, 0, 0.05), [180, 184, 192]));
    ps.push(part(boxGeo(0, 0.02, 0, 0.28, 0.05, 0.14), [70, 70, 80]));
    var frog = [part(ovalGeo(0, 0.42, 0, 0.5, 0.42, 0.44, 5, 10), [96, 176, 76])];
    frog.push(part(ovalGeo(0, 0.92, 0.1, 0.42, 0.32, 0.4, 4, 9), [110, 190, 84]));
    for (i = 0; i < 2; i++) {
      frog.push(part(ovalGeo((i ? 1 : -1) * 0.26, 1.2, 0.12, 0.17, 0.17, 0.17, 3, 7),
                     [190, 224, 130]));
      frog.push(part(ovalGeo((i ? 1 : -1) * 0.26, 1.24, 0.24, 0.08, 0.08, 0.05, 3, 5),
                     [22, 20, 24]));
      frog.push(part(barGeo((i ? 1 : -1) * 0.4, 0.5, 0, (i ? 1 : -1) * (0.85 + wob),
                            0.95 - wob * 0.6, 0.1, 0.08), [96, 176, 76]));
      frog.push(part(barGeo((i ? 1 : -1) * 0.3, 0.1, 0, (i ? 1 : -1) * 0.5,
                            -0.35 + Math.sin(a + i * 3.1) * 0.16, 0.1, 0.09), [96, 176, 76]));
    }
    frog.push(part(boxGeo(0, 0.78, 0.4, 0.2, 0.02, 0.02), [60, 40, 40]));
    for (i = 0; i < frog.length; i++)
      ps.push({ V: xfG(frog[i], 0, 0, wob, 0, 0, 0).V, F: frog[i].F, c: frog[i].c });
    obj(g, mergeC(ps), 0.06, 0.2, 0, 30, 0);
  }

  function drawRocketSnail(g, t) {
    var ps = [], i;
    var bob = Math.sin(t * 0.008) * 0.06;
    ps.push(part(scG(xfG(lathe([[0.05, 1], [0.5, 0.7], [0.6, 0], [0.42, -0.8], [0.05, -1]], 8),
                         0, 0, -Math.PI / 2), 1.15, 0.3, 0.34), [206, 186, 140]));
    ps.push(part(xfG(scG(lathe([[0.05, 1.0], [0.6, 0.7], [0.85, 0], [0.6, -0.7], [0.05, -1.0]], 12),
                         0.85, 0.85, 0.5), Math.PI / 2, 0, 0, -0.15, 0.5 + bob, 0),
                 [178, 116, 56]));
    for (i = 0; i < 12; i++) {
      var a = i / 12 * TAU * 2.2;
      var r = 0.12 + (i / 12) * 0.6;
      ps.push(part(ovalGeo(-0.15 + Math.cos(a) * r, 0.5 + bob + Math.sin(a) * r, 0.42,
                           0.09, 0.09, 0.04, 3, 5), [140, 88, 40]));
    }
    for (i = 0; i < 2; i++) {
      ps.push(part(barGeo(0.9, 0.1 + bob, (i ? 0.12 : -0.12), 1.15, 0.6 + bob,
                          (i ? 0.16 : -0.16), 0.04), [206, 186, 140]));
      ps.push(part(ovalGeo(1.18, 0.66 + bob, (i ? 0.16 : -0.16), 0.08, 0.08, 0.08, 3, 5),
                   [30, 26, 30]));
    }
    ps.push(part(xfG(cylGeo(0, 0, 0, 0.18, 0.24, 0.7, 8), 0, 0, Math.PI / 2, -1.1, 0.4, 0),
                 [200, 60, 56]));
    for (i = 0; i < 5; i++) {
      var f = (t * 0.004 + i * 0.2) % 1;
      ps.push(part(ovalGeo(-1.5 - f * 1.1, 0.4 + Math.sin(t * 0.01 + i) * 0.1, 0,
                           0.2 - f * 0.12, 0.2 - f * 0.12, 0.2 - f * 0.12, 3, 6),
                   f < 0.4 ? [252, 226, 110] : [236, 120, 50]));
    }
    obj(g, mergeC(ps), 0.1, 0.14, 0, 30, 0);
  }

  function drawBizCat(g, t) {
    var typ = Math.sin(t * 0.012);
    var ps = [], i;
    ps.push(part(boxGeo(0, -0.85, 0.2, 1.5, 0.1, 0.8), [140, 96, 56]));
    ps.push(part(boxGeo(0.1, -0.55, 0.5, 0.55, 0.2, 0.3), [60, 62, 72]));
    ps.push(part(xfG(boxGeo(0, 0, 0, 0.5, 0.34, 0.03), -0.5, 0, 0, 0.1, -0.15, 0.15),
                 [200, 230, 240]));
    ps.push(part(ovalGeo(-0.4, 0.05, -0.1, 0.55, 0.5, 0.45, 5, 10), [176, 150, 120]));
    ps.push(part(ovalGeo(-0.4, 0.75, -0.05, 0.42, 0.38, 0.4, 4, 9), [196, 170, 138]));
    for (i = 0; i < 2; i++) {
      var sd = i ? 1 : -1;
      ps.push(part(xfG(prism([[-0.16, -0.1], [0.16, -0.1], [0, 0.34]], 0.05), 0, 0, sd * 0.3,
                       -0.4 + sd * 0.28, 1.06, -0.05), [196, 170, 138]));
      ps.push(part(ovalGeo(-0.4 + sd * 0.16, 0.8, 0.32, 0.08, 0.1, 0.05, 3, 6), [230, 216, 120]));
      ps.push(part(barGeo(-0.4 + sd * 0.3, 0.15, 0.2,
                          0.05 + sd * 0.1, -0.35 + typ * 0.1 * sd, 0.42, 0.07), [176, 150, 120]));
    }
    ps.push(part(xfG(prism([[-0.05, 0.05], [0.05, 0.05], [0, -0.06]], 0.04), 0, 0, 0,
                     -0.4, 0.66, 0.42), [180, 100, 110]));
    ps.push(part(boxGeo(-0.4, 0.3, 0.3, 0.3, 0.16, 0.06), [180, 40, 50]));
    ps.push(part(barGeo(-0.4, 0.42, 0.28, -0.4, 0.05, 0.34, 0.06), [180, 40, 50]));
    obj(g, mergeC(ps), 0.2, 0.3, 0, 30, 0);
  }

  function drawSlothDance(g, t) {
    var a = t * 0.0035;
    var ps = [], i;
    var spin = Math.sin(a) * 0.8;
    ps.push(part(ovalGeo(0, 0, 0, 0.62, 0.72, 0.55, 5, 10), [150, 130, 106]));
    ps.push(part(ovalGeo(0, 0.85, 0.1, 0.46, 0.42, 0.44, 4, 9), [176, 156, 128]));
    ps.push(part(ovalGeo(0, 0.78, 0.4, 0.3, 0.24, 0.14, 3, 8), [214, 196, 160]));
    for (i = 0; i < 2; i++) {
      var sd = i ? 1 : -1;
      ps.push(part(ovalGeo(sd * 0.17, 0.86, 0.46, 0.09, 0.09, 0.05, 3, 6), [40, 34, 30]));
      ps.push(part(barGeo(sd * 0.5, 0.3, 0, sd * (0.9 + Math.sin(a + i * 2) * 0.4),
                          0.7 + Math.cos(a + i * 2) * 0.6, 0.1, 0.1), [150, 130, 106]));
      ps.push(part(barGeo(sd * 0.3, -0.6, 0, sd * (0.5 + Math.sin(a * 1.3 + i) * 0.3),
                          -1.3, 0.1, 0.11), [150, 130, 106]));
    }
    ps.push(part(boxGeo(0, 0.7, 0.45, 0.14, 0.03, 0.03), [60, 50, 44]));
    ps.push(part(boxGeo(0, -1.45, 0, 1.6, 0.1, 1.0), [60, 60, 74]));
    obj(g, mergeC(ps), 0.1, spin, Math.sin(a * 2) * 0.16, 30, 0);
  }

  function drawCrabShades(g, t) {
    var sc2 = Math.sin(t * 0.004);
    var ps = [], i;
    ps.push(part(scG(lathe([[0.05, 0.6], [0.6, 0.5], [1.0, 0.1], [1.05, -0.1],
                            [0.6, -0.4], [0.05, -0.45]], 12), 1.15, 0.9, 0.85), [206, 62, 46]));
    for (i = 0; i < 2; i++) {
      var sd = i ? 1 : -1;
      ps.push(part(barGeo(sd * 0.9, 0.1, 0.2, sd * (1.5 + sc2 * 0.2), 0.5, 0.4, 0.12),
                   [186, 52, 40]));
      ps.push(part(xfG(prism([[0, 0], [0.5, 0.26], [0.55, 0.06], [0.5, -0.2]], 0.12),
                       0, 0, sd * (0.4 + sc2 * 0.2) + (i ? 0 : Math.PI),
                       sd * (1.5 + sc2 * 0.2), 0.5, 0.4), [222, 76, 56]));
      ps.push(part(cylGeo(sd * 0.32, 0.72, 0.5, 0.06, 0.06, 0.42, 6), [206, 62, 46]));
      var f;
      for (f = 0; f < 3; f++)
        ps.push(part(barGeo(sd * 0.8, -0.2, -0.1 + f * 0.2,
                            sd * (1.25 + f * 0.05), -0.75 - f * 0.05, -0.3 + f * 0.35, 0.06),
                     [186, 52, 40]));
    }
    ps.push(part(boxGeo(0, 0.92, 0.5, 0.55, 0.14, 0.1), [26, 26, 34]));
    ps.push(part(boxGeo(0, 0.92, 0.58, 0.14, 0.02, 0.02), [26, 26, 34]));
    ps.push(part(boxGeo(0, -0.2, 0.75, 0.34, 0.05, 0.06), [140, 32, 26]));
    obj(g, mergeC(ps), 0.24, Math.sin(t * 0.0007) * 0.3, 0, 30, 0);
  }

  function drawPigeonLift(g, t) {
    var c = (t % 2600) / 2600;
    var lift = c < 0.45 ? Math.sin(c / 0.45 * Math.PI) : 0;
    var ps = [], i;
    ps.push(part(ovalGeo(0, -0.15, 0, 0.55, 0.62, 0.5, 5, 10), [120, 132, 150]));
    ps.push(part(ovalGeo(0, 0.62 + lift * 0.1, 0.1, 0.34, 0.32, 0.32, 4, 8), [140, 152, 172]));
    ps.push(part(ovalGeo(0, -0.1, 0.42, 0.3, 0.34, 0.16, 3, 8), [90, 160, 150]));
    for (i = 0; i < 2; i++) {
      var sd = i ? 1 : -1;
      ps.push(part(ovalGeo(sd * 0.15, 0.68 + lift * 0.1, 0.34, 0.07, 0.07, 0.05, 3, 5),
                   [230, 90, 70]));
      ps.push(part(barGeo(sd * 0.44, 0.2, 0, sd * 0.62, 0.95 + lift * 0.5, 0, 0.09),
                   [120, 132, 150]));
      ps.push(part(barGeo(sd * 0.18, -0.7, 0, sd * 0.2, -1.2, 0, 0.06), [212, 140, 60]));
    }
    ps.push(part(xfG(prism([[-0.06, 0.06], [0.2, 0], [-0.06, -0.06]], 0.05), 0, 0, 0,
                     0, 0.6 + lift * 0.1, 0.36), [222, 168, 60]));
    ps.push(part(cylGeo(0, 1.25 + lift * 0.5, 0, 0.05, 0.05, 2.0, 6, 'x'), [70, 70, 80]));
    for (i = 0; i < 2; i++)
      ps.push(part(xfG(cylGeo(0, 0, 0, 0.32, 0.32, 0.18, 10), 0, 0, Math.PI / 2,
                       (i ? 1 : -1) * 0.85, 1.25 + lift * 0.5, 0), [40, 40, 48]));
    obj(g, mergeC(ps), 0.1, Math.sin(t * 0.0006) * 0.3, 0, 30, 0);
  }

  /* ================================================================
     SPACESHIPS
     ================================================================ */

  function drawRocketLaunch(g, t) {
    var c = (t % 5000) / 5000;
    var y = -1.6 + c * c * 4.2;
    var ps = [], i;
    var rk = [
      part(scG(lathe([[0.03, 1.0], [0.34, 0.3], [0.4, -0.7], [0.34, -0.9], [0.03, -0.95]], 12),
               1, 1.1, 1), [236, 236, 230]),
      part(lathe([[0.4, -0.9], [0.42, -1.05], [0.3, -1.1], [0, -1.1]], 12), [70, 74, 84])
    ];
    for (i = 0; i < 3; i++) {
      var a = i * TAU / 3;
      rk.push(part(xfG(prism([[0, 0.3], [0.42, -0.5], [0, -0.5]], 0.03), 0, a + Math.PI / 2, 0,
                       Math.cos(a) * 0.36, -0.62, Math.sin(a) * 0.36), [200, 60, 56]));
    }
    rk.push(part(boxGeo(0, 0.1, 0.38, 0.1, 0.3, 0.03), [200, 60, 56]));
    for (i = 0; i < rk.length; i++)
      ps.push({ V: xfG(rk[i], 0, 0, 0, 0, y, 0).V, F: rk[i].F, c: rk[i].c });
    for (i = 0; i < 8; i++) {
      var f = (i / 8);
      ps.push(part(ovalGeo(Math.sin(t * 0.02 + i) * f * 0.3, y - 1.2 - f * 1.3, 0,
                           0.2 + f * 0.3, 0.24 + f * 0.3, 0.2 + f * 0.3, 3, 6),
                   f < 0.3 ? [252, 240, 180] : f < 0.6 ? [246, 160, 60] : [150, 150, 158]));
    }
    obj(g, mergeC(ps), 0.06, Math.sin(t * 0.0005) * 0.3, 0, 30, 0);
  }

  function drawWarpSpeed(g, t) {
    var ps = [], i;
    for (i = 0; i < 40; i++) {
      var a = i * 2.399;
      var f = ((t * 0.0009 + i * 0.025) % 1);
      var r = 0.1 + f * f * 3.2;
      var len = 0.1 + f * 1.2;
      ps.push(part(xfG(boxGeo(0, 0, 0, len, 0.035, 0.035), 0, 0, a,
                       Math.cos(a) * r, Math.sin(a) * r, -2 + f * 3),
                   [190 + f * 60, 210 + f * 40, 250]));
    }
    obj(g, mergeC(ps), 0, 0, 0, 30, 0);
  }

  function drawDogfight(g, t) {
    var ps = [], k, i;
    for (k = 0; k < 2; k++) {
      var a = t * (k ? 0.0012 : -0.0016) + k * 2.4;
      var x = Math.cos(a) * 1.4, y = Math.sin(a * 1.3) * 0.9, z = Math.sin(a) * 1.0;
      var sh = [part(lathe([[0, -0.1], [0.55, -0.06], [0.6, 0.04], [0.45, 0.12], [0, 0.14]], 12),
                     k ? [180, 184, 196] : [150, 120, 170])];
      sh.push(part(ovalGeo(0, 0.16, 0, 0.24, 0.14, 0.24, 3, 8), [140, 220, 240]));
      for (i = 0; i < sh.length; i++)
        ps.push({ V: xfG(sh[i], Math.sin(a) * 0.4, a, 0, x, y, z).V, F: sh[i].F, c: sh[i].c });
      for (i = 0; i < 4; i++) {
        var f = (t * 0.003 + i * 0.25 + k * 0.5) % 1;
        ps.push(part(ovalGeo(x - Math.cos(a) * f * 2.4, y - Math.sin(a * 1.3) * f * 1.6,
                             z - Math.sin(a) * f * 1.6, 0.07, 0.07, 0.07, 3, 4),
                     k ? [250, 200, 90] : [250, 110, 90]));
      }
    }
    obj(g, mergeC(ps), 0.1, 0, 0, 30, 0);
  }

  function drawSatellite(g, t) {
    var a = t * 0.0011;
    var ps = [], i;
    ps.push(part(ovalGeo(0, 0, -1.6, 1.0, 1.0, 1.0, 6, 12), [70, 120, 170]));
    for (i = 0; i < 6; i++)
      ps.push(part(ovalGeo(Math.cos(i * 1.7) * 0.7, Math.sin(i * 1.7) * 0.5, -1.0,
                           0.24, 0.16, 0.1, 3, 6), [90, 160, 100]));
    var sx = Math.cos(a) * 1.7, sy = Math.sin(a) * 1.2, sz = Math.sin(a) * 1.2;
    var st = [part(boxGeo(0, 0, 0, 0.24, 0.2, 0.2), [200, 200, 210]),
              part(boxGeo(0.62, 0, 0, 0.4, 0.02, 0.24), [50, 70, 160]),
              part(boxGeo(-0.62, 0, 0, 0.4, 0.02, 0.24), [50, 70, 160]),
              part(xfG(lathe([[0, 0.2], [0.3, 0], [0.26, -0.02], [0, 0.16]], 10),
                       -0.6, 0, 0, 0, 0.24, 0.14), [222, 222, 230])];
    for (i = 0; i < st.length; i++)
      ps.push({ V: xfG(st[i], 0, a, a * 0.5, sx, sy, sz).V, F: st[i].F, c: st[i].c });
    obj(g, mergeC(ps), 0.1, 0, 0, 30, 0);
  }

  function drawDocking(g, t) {
    var c = (t % 6000) / 6000;
    var gap = c < 0.75 ? (0.75 - c) * 3.2 : 0;
    var ps = [], i;
    var a = [part(scG(xfG(lathe([[0.05, 1], [0.4, 0.7], [0.5, 0], [0.4, -0.8], [0.05, -1]], 10),
                        0, 0, -Math.PI / 2), 1.0, 0.5, 0.5), [204, 208, 216]),
             part(cylGeo(0.95, 0, 0, 0.16, 0.2, 0.3, 8, 'x'), [140, 144, 152])];
    for (i = 0; i < 2; i++)
      a.push(part(boxGeo(-0.4, 0, (i ? 1 : -1) * 0.8, 0.5, 0.03, 0.34), [50, 70, 160]));
    for (i = 0; i < a.length; i++)
      ps.push({ V: xfG(a[i], 0, 0, 0.06, -1.1 - gap, 0.1, 0).V, F: a[i].F, c: a[i].c });
    var b = [part(lathe([[0, -0.7], [0.55, -0.6], [0.6, 0.5], [0.5, 0.7], [0, 0.72]], 12),
                  [186, 190, 200]),
             part(cylGeo(-0.85, 0.1, 0, 0.16, 0.2, 0.3, 8, 'x'), [140, 144, 152]),
             part(torGeo(0, 0.8, 0, 0.5, 0.08, 12, 5), [120, 124, 132])];
    for (i = 0; i < b.length; i++)
      ps.push({ V: xfG(b[i], 0, 0, -0.06, 1.1 + gap, 0.05, 0).V, F: b[i].F, c: b[i].c });
    for (i = 0; i < 10; i++)
      ps.push(part(ovalGeo(((i * 41 % 71) / 71 - 0.5) * 4.4, ((i * 29 % 53) / 53 - 0.5) * 2.8,
                           -2.2, 0.03, 0.03, 0.03, 3, 4), [244, 244, 236]));
    obj(g, mergeC(ps), 0.16, Math.sin(t * 0.0004) * 0.3, 0, 30, 0);
  }

  /* ================================================================
     HORROR
     ================================================================ */

  function drawHauntedHouse(g, t) {
    var flick = Math.sin(t * 0.02) > 0.2 ? 1 : 0.4;
    var m = geo('haunt', function () {
      var ps = [part(xfG(boxGeo(0, 0, 0, 1.1, 0.8, 0.85), 0, 0, 0.05, 0, -0.4, 0), [58, 52, 62])], i;
      ps.push(part(xfG(coneGeo(0, 0, 0, 1.35, 1.0, 4), 0, 0.7, 0.05, 0, 0.85, 0), [40, 34, 46]));
      ps.push(part(xfG(boxGeo(0, 0, 0, 0.5, 0.7, 0.5), 0, 0.4, -0.06, -1.1, 0.1, 0.2), [52, 46, 56]));
      ps.push(part(xfG(coneGeo(0, 0, 0, 0.6, 0.8, 4), 0, 0.4, -0.06, -1.1, 1.1, 0.2), [38, 32, 44]));
      ps.push(part(boxGeo(0.6, 1.5, -0.2, 0.16, 0.4, 0.16), [46, 40, 50]));
      ps.push(part(boxGeo(0, -0.65, 0.86, 0.22, 0.34, 0.02), [24, 20, 26]));
      ps.push(part(boxGeo(0, -1.3, 0, 1.9, 0.14, 1.3), [40, 46, 40]));
      for (i = 0; i < 5; i++)
        ps.push(part(barGeo(-1.7 + i * 0.2, -1.2, 0.8, -1.75 + i * 0.22, -0.2, 0.7, 0.03),
                     [36, 30, 28]));
      return mergeC(ps);
    });
    obj(g, m, 0.12, Math.sin(t * 0.0004) * 0.2, 0, 28, 0);
    var ps = [], i;
    ps.push(part(boxGeo(-0.42, -0.25, 0.87, 0.16, 0.16, 0.02),
                 [Math.round(240 * flick), Math.round(210 * flick), 90]));
    ps.push(part(boxGeo(0.42, -0.25, 0.87, 0.16, 0.16, 0.02),
                 [Math.round(240 * flick), Math.round(210 * flick), 90]));
    ps.push(part(ovalGeo(1.4, 1.5, -1.8, 0.42, 0.42, 0.42, 5, 10), [230, 226, 200]));
    for (i = 0; i < 4; i++) {
      var b = t * 0.0018 + i * 1.7;
      ps.push(part(xfG(prism([[-0.2, 0], [0, 0.09], [0.2, 0], [0, -0.05]], 0.01), 0, 0,
                       Math.sin(b * 3) * 0.4,
                       Math.cos(b) * 1.6, 1.1 + Math.sin(b * 2) * 0.5, -1.2), [26, 24, 30]));
    }
    obj(g, mergeC(ps), 0.12, Math.sin(t * 0.0004) * 0.2, 0, 28, 0);
  }

  function drawGraveHand(g, t) {
    var c = (t % 5000) / 5000;
    var rise = Math.min(1, c * 2.2);
    var ps = [], i;
    ps.push(part(boxGeo(0, -1.2, 0, 2.2, 0.4, 1.2), [58, 48, 40]));
    ps.push(part(xfG(scG(prism([[-0.5, -0.8], [-0.5, 0.5], [-0.3, 0.8], [0.3, 0.8],
                                [0.5, 0.5], [0.5, -0.8]], 0.12), 1, 1, 1), 0, 0, 0.04,
                     -1.05, -0.4, -0.5), [130, 128, 122]));
    ps.push(part(boxGeo(-1.05, -0.35, -0.36, 0.24, 0.03, 0.02), [80, 78, 74]));
    ps.push(part(boxGeo(-1.05, -0.5, -0.36, 0.18, 0.03, 0.02), [80, 78, 74]));
    var hy = -1.0 + rise * 1.1;
    ps.push(part(ovalGeo(0.25, hy, 0.2, 0.24, 0.3, 0.2, 4, 8), [186, 176, 152]));
    for (i = 0; i < 5; i++) {
      var a = -0.5 + i * 0.28;
      ps.push(part(barGeo(0.25 + Math.sin(a) * 0.18, hy + 0.24, 0.2 + Math.cos(a) * 0.08,
                          0.25 + Math.sin(a) * 0.42, hy + 0.68 - Math.abs(i - 2) * 0.06,
                          0.2 + Math.cos(a) * 0.2, 0.055), [186, 176, 152]));
    }
    ps.push(part(cylGeo(0.25, hy - 0.34, 0.2, 0.16, 0.18, 0.5, 8), [186, 176, 152]));
    for (i = 0; i < 6; i++)
      ps.push(part(boxGeo(0.25 + ((i * 31 % 17) / 17 - 0.5) * 0.9, -0.85 + (i % 3) * 0.1,
                          0.2 + ((i * 47 % 23) / 23 - 0.5) * 0.7, 0.1, 0.06, 0.1), [70, 58, 46]));
    obj(g, mergeC(ps), 0.16, Math.sin(t * 0.0005) * 0.25, 0, 30, 0);
  }

  function drawScream(g, t) {
    var w = Math.sin(t * 0.0026);
    var ps = [], i;
    ps.push(part(scG(lathe([[0.05, 1.0], [0.5, 0.88], [0.75, 0.4], [0.8, -0.1],
                            [0.6, -0.7], [0.3, -1.0], [0.05, -1.1]], 12),
                     1.0 + w * 0.05, 1.05, 0.8), [222, 176, 120]));
    for (i = 0; i < 2; i++) {
      var sd = i ? 1 : -1;
      ps.push(part(ovalGeo(sd * 0.32, 0.3, 0.6, 0.16, 0.2, 0.1, 3, 7), [244, 240, 230]));
      ps.push(part(ovalGeo(sd * 0.32, 0.3, 0.66, 0.07, 0.09, 0.05, 3, 5), [20, 18, 22]));
      ps.push(part(barGeo(sd * 0.75, 0.1, 0.2, sd * 1.15, 0.5, 0.5, 0.09), [222, 176, 120]));
      ps.push(part(ovalGeo(sd * 1.2, 0.6, 0.55, 0.16, 0.2, 0.14, 3, 6), [232, 190, 136]));
    }
    ps.push(part(ovalGeo(0, -0.5, 0.62, 0.22, 0.34 + Math.abs(w) * 0.12, 0.16, 4, 8),
                 [40, 20, 26]));
    ps.push(part(xfG(prism(discO(1.1, 12), 0.06), 0.3, 0, 0, 0, 0.4, -0.5), [180, 100, 70]));
    obj(g, mergeC(ps), 0.06, w * 0.2, w * 0.06, 30, 0);
  }

  function drawBatsMoon(g, t) {
    var ps = [], i;
    ps.push(part(ovalGeo(0.5, 0.5, -2.5, 1.1, 1.1, 1.1, 6, 12), [236, 232, 200]));
    for (i = 0; i < 4; i++)
      ps.push(part(ovalGeo(0.5 + Math.cos(i * 1.9) * 0.6, 0.5 + Math.sin(i * 1.9) * 0.6, -2.35,
                           0.16, 0.14, 0.05, 3, 6), [206, 202, 172]));
    for (i = 0; i < 7; i++) {
      var a = t * 0.0013 + i * 0.9;
      var flap = Math.sin(t * 0.012 + i * 1.3) * 0.7;
      var bx = Math.cos(a) * 1.9, by = Math.sin(a * 1.4) * 1.1, bz = -1 + Math.sin(a) * 1.4;
      ps.push(part(ovalGeo(bx, by, bz, 0.1, 0.13, 0.1, 3, 5), [30, 26, 34]));
      var k;
      for (k = 0; k < 2; k++)
        ps.push(part(xfG(prism([[0, 0], [0.42, 0.2], [0.5, -0.04], [0.3, -0.1]], 0.01),
                         0, 0, (k ? 1 : -1) * flap + (k ? 0 : Math.PI),
                         bx + (k ? 0.1 : -0.1), by, bz), [30, 26, 34]));
    }
    obj(g, mergeC(ps), 0, 0, 0, 30, 0);
  }

  function drawCreatureEyes(g, t) {
    var ps = [], i;
    for (i = 0; i < 5; i++) {
      var f = i / 5;
      var bl = Math.sin(t * 0.0016 + i * 2.1) > 0.9 ? 0.1 : 1;
      var x = -1.7 + i * 0.85 + Math.sin(t * 0.0006 + i) * 0.16;
      var y = Math.sin(i * 2.3) * 0.7;
      var z = -2 + i * 0.6;
      var k;
      for (k = 0; k < 2; k++) {
        var ex = x + (k ? 0.22 : -0.22);
        ps.push(part(ovalGeo(ex, y, z, 0.16, 0.16 * bl, 0.1, 3, 7),
                     i % 2 ? [244, 210, 90] : [140, 230, 190]));
        ps.push(part(boxGeo(ex, y, z + 0.1, 0.04, 0.14 * bl, 0.02), [20, 18, 22]));
      }
    }
    for (i = 0; i < 8; i++)
      ps.push(part(barGeo(-2.2 + i * 0.6, -1.6, 0.6, -2.1 + i * 0.6, -0.2, 0.5, 0.05),
                   [26, 32, 26]));
    obj(g, mergeC(ps), 0, 0, 0, 30, 0);
  }

  /* ================================================================
     ESOTERIC II — thirty emblems, each turned in the round
     ================================================================ */

  function drawCaduceus(g, t) {
    var ps = [], i, k;
    ps.push(part(cylGeo(0, -0.1, 0, 0.07, 0.08, 2.8, 8), [214, 184, 90]));
    for (k = 0; k < 2; k++)
      for (i = 0; i < 22; i++) {
        var f = i / 22;
        var a = f * 9 + k * Math.PI + t * 0.0012;
        ps.push(part(ovalGeo(Math.cos(a) * 0.36, -1.3 + f * 2.3, Math.sin(a) * 0.36,
                             0.1, 0.09, 0.1, 3, 5), k ? [110, 176, 84] : [90, 150, 70]));
      }
    for (k = 0; k < 2; k++) {
      var b = 9 + k * Math.PI + t * 0.0012;
      ps.push(part(ovalGeo(Math.cos(b) * 0.42, 1.05, Math.sin(b) * 0.42, 0.15, 0.12, 0.15, 3, 6),
                   [130, 196, 96]));
    }
    for (k = 0; k < 2; k++)
      ps.push(part(xfG(scG(prism([[0, 0], [0.75, 0.36], [0.9, 0.05], [0.6, -0.24]], 0.02), 1, 1, 1),
                       0, 0, (k ? 1 : -1) * 0.3 + (k ? 0 : Math.PI), 0, 1.15, 0),
                   [232, 226, 210]));
    ps.push(part(ovalGeo(0, 1.5, 0, 0.16, 0.2, 0.16, 3, 6), [230, 200, 110]));
    obj(g, mergeC(ps), 0.08, Math.sin(t * 0.0005) * 0.4, 0, 30, 0);
  }

  function drawTreeOfLife(g, t) {
    var m = geo('tol', function () {
      var nodes = [[0, 1.5], [-0.62, 1.0], [0.62, 1.0], [-0.62, 0.35], [0.62, 0.35],
                   [0, 0.05], [-0.62, -0.4], [0.62, -0.4], [0, -0.75], [0, -1.3]];
      var links = [[0,1],[0,2],[1,2],[1,3],[2,4],[3,4],[1,5],[2,5],[3,5],[4,5],
                   [3,6],[4,7],[5,6],[5,7],[6,7],[6,8],[7,8],[5,8],[8,9],[6,9],[7,9]];
      var ps = [], i;
      for (i = 0; i < links.length; i++)
        ps.push(part(barGeo(nodes[links[i][0]][0], nodes[links[i][0]][1], 0,
                            nodes[links[i][1]][0], nodes[links[i][1]][1], 0, 0.025),
                     [200, 180, 130]));
      for (i = 0; i < nodes.length; i++)
        ps.push(part(ovalGeo(nodes[i][0], nodes[i][1], 0, 0.17, 0.17, 0.17, 4, 8),
                     [244, 216, 120]));
      return mergeC(ps);
    });
    obj(g, m, 0.06, Math.sin(t * 0.0006) * 0.5, 0, 30, 0);
  }

  function drawPhilosophersStone(g, t) {
    var ps = [], i;
    ps.push(part(prism(ringO(1.45, 0.07, 22), 0.04), [190, 160, 90]));
    ps.push(part(xfG(prism([[0, 1.2], [1.05, -0.65], [-1.05, -0.65]], 0.03), 0, 0, 0, 0, 0, 0.06),
                 [180, 150, 84]));
    ps.push(part(xfG(prism([[0, -1.2], [1.05, 0.65], [-1.05, 0.65]], 0.03), 0, 0, 0, 0, 0, -0.06),
                 [180, 150, 84]));
    ps.push(part(prism(discO(0.72, 4, Math.PI / 4), 0.04), [166, 140, 76]));
    ps.push(part(xfG(scG(gIcosa(), 0.34, 0.34, 0.34), t * 0.0018, t * 0.0026, 0, 0, 0, 0.4),
                 [230, 70, 90]));
    for (i = 0; i < 6; i++) {
      var a = i * TAU / 6 + t * 0.0011;
      ps.push(part(ovalGeo(Math.cos(a) * 1.45, Math.sin(a) * 1.45, 0.1, 0.09, 0.09, 0.09, 3, 5),
                   [244, 214, 130]));
    }
    obj(g, mergeC(ps), 0.1, Math.sin(t * 0.0005) * 0.35, 0, 30, 0);
  }

  function drawSolLuna(g, t) {
    var ps = [], i;
    ps.push(part(ovalGeo(-0.75, 0.15, 0.2, 0.62, 0.62, 0.62, 6, 12), [246, 206, 80]));
    for (i = 0; i < 12; i++) {
      var a = i * TAU / 12 + t * 0.0012;
      ps.push(part(boxGeo(-0.75 + Math.cos(a) * 0.9, 0.15 + Math.sin(a) * 0.9, 0.2,
                          0.22, 0.05, 0.05), [244, 196, 70]));
    }
    ps.push(part(ovalGeo(0.8, -0.15, -0.2, 0.66, 0.66, 0.66, 6, 12), [216, 220, 232]));
    ps.push(part(ovalGeo(1.15, 0.05, 0.1, 0.56, 0.56, 0.56, 5, 10), [40, 40, 52]));
    ps.push(part(prism(ringO(1.65, 0.05, 24), 0.03), [150, 140, 120]));
    obj(g, mergeC(ps), 0.06, Math.sin(t * 0.0006) * 0.4, t * 0.0004, 28, 0);
  }

  function drawThirdEye(g, t) {
    var p2 = (Math.sin(t * 0.0022) + 1) / 2;
    var ps = [], i;
    ps.push(part(scG(lathe([[0.05, 1.0], [0.55, 0.9], [0.8, 0.4], [0.85, -0.1],
                            [0.6, -0.7], [0.3, -1.0], [0.05, -1.1]], 12), 1, 1, 0.8),
                 [206, 176, 146]));
    for (i = 0; i < 2; i++) {
      var sd = i ? 1 : -1;
      ps.push(part(ovalGeo(sd * 0.32, 0.16, 0.6, 0.14, 0.05, 0.08, 3, 6), [90, 70, 56]));
    }
    ps.push(part(xfG(scG(prism(discO(0.36, 12), 0.06), 1, 0.6, 1), 0, 0, 0, 0, 0.62, 0.66),
                 [244, 238, 228]));
    ps.push(part(xfG(prism(discO(0.18, 10), 0.05), 0, 0, 0, 0, 0.62, 0.74),
                 [120 + p2 * 80, 90, 200]));
    ps.push(part(xfG(prism(discO(0.08, 8), 0.05), 0, 0, 0, 0, 0.62, 0.8), [20, 16, 26]));
    for (i = 0; i < 10; i++) {
      var a = i * TAU / 10 + t * 0.001;
      ps.push(part(ovalGeo(Math.cos(a) * (0.6 + p2 * 0.3), 0.62 + Math.sin(a) * (0.6 + p2 * 0.3),
                           0.7, 0.05, 0.05, 0.05, 3, 4), [180, 140, 250]));
    }
    obj(g, mergeC(ps), 0.06, Math.sin(t * 0.0005) * 0.25, 0, 30, 0);
  }

  function drawScryingMirror(g, t) {
    var ps = [], i;
    ps.push(part(lathe([[0, -0.14], [1.3, -0.14], [1.42, 0.04], [1.28, 0.14], [0, 0.14]], 18),
                 [128, 100, 54]));
    ps.push(part(xfG(prism(discO(1.15, 16), 0.06), 0, 0, 0, 0, 0, 0.18), [24, 22, 34]));
    for (i = 0; i < 5; i++) {
      var f = ((t * 0.0006 + i * 0.2) % 1);
      ps.push(part(xfG(prism(ringO(0.16 + f * 1.0, 0.05, 18), 0.02), 0, 0, 0, 0, 0, 0.22),
                   [90 + (1 - f) * 120, 80 + (1 - f) * 90, 160 + (1 - f) * 60]));
    }
    ps.push(part(ovalGeo(-0.3, 0.35, 0.24, 0.24, 0.14, 0.03, 3, 7), [140, 140, 180]));
    obj(g, mergeC(ps), 0.3 + Math.sin(t * 0.0005) * 0.2, Math.sin(t * 0.0004) * 0.3, 0, 30, 0);
  }

  function drawOuija(g, t) {
    var a = t * 0.0007;
    var ps = [], i;
    ps.push(part(boxGeo(0, 0, -0.2, 1.75, 1.2, 0.08), [188, 152, 96]));
    for (i = 0; i < 13; i++)
      ps.push(part(boxGeo(-1.5 + i * 0.25, 0.55, -0.1, 0.06, 0.1, 0.02), [60, 44, 28]));
    for (i = 0; i < 13; i++)
      ps.push(part(boxGeo(-1.5 + i * 0.25, 0.1, -0.1, 0.06, 0.1, 0.02), [60, 44, 28]));
    for (i = 0; i < 10; i++)
      ps.push(part(boxGeo(-1.15 + i * 0.26, -0.35, -0.1, 0.05, 0.09, 0.02), [60, 44, 28]));
    var px = Math.sin(a * 1.7) * 1.1, py = Math.sin(a * 2.3) * 0.5;
    ps.push(part(xfG(scG(prism([[0, 0.42], [0.42, -0.16], [-0.42, -0.16]], 0.06), 1, 1, 1),
                     0, 0, Math.sin(a * 3) * 0.3, px, py, -0.02), [98, 66, 40]));
    ps.push(part(xfG(prism(ringO(0.18, 0.05, 12), 0.07), 0, 0, 0, px, py + 0.06, -0.02),
                 [230, 228, 220]));
    obj(g, mergeC(ps), 0.7, Math.sin(t * 0.0004) * 0.25, 0, 30, 0);
  }

  function drawRuneCast(g, t) {
    var ps = [], i, k;
    var marks = [[[0,-1,0,1]], [[-0.5,-1,-0.5,1],[-0.5,1,0.5,0.2]],
                 [[0,-1,0,1],[-0.5,0.4,0.5,1]], [[-0.5,-1,-0.5,1],[-0.5,1,0.5,0]],
                 [[-0.5,-1,0,1],[0,1,0.5,-1]], [[-0.5,-1,-0.5,1],[-0.5,1,0.5,1]]];
    for (i = 0; i < 6; i++) {
      var a = t * 0.0006 + i * TAU / 6;
      var x = Math.cos(a) * 1.25, y = Math.sin(a) * 0.85, z = Math.sin(a * 2) * 0.5;
      var st = [part(xfG(boxGeo(0, 0, 0, 0.32, 0.42, 0.09), 0.2, a, 0.1, x, y, z),
                     [200, 190, 168])];
      for (k = 0; k < marks[i].length; k++) {
        var mk = marks[i][k];
        st.push(part(xfG(barGeo(mk[0] * 0.2, mk[1] * 0.28, 0.1, mk[2] * 0.2, mk[3] * 0.28, 0.1,
                                0.03), 0.2, a, 0.1, x, y, z), [80, 60, 44]));
      }
      for (k = 0; k < st.length; k++) ps.push(st[k]);
    }
    obj(g, mergeC(ps), 0.06, 0, 0, 30, 0);
  }

  function drawMicrocosmicMan(g, t) {
    var ps = [], i;
    ps.push(part(prism(ringO(1.5, 0.05, 24), 0.03), [200, 176, 120]));
    ps.push(part(prism(starO(1.5, 0.6, 5, Math.PI), 0.02), [150, 130, 88]));
    ps.push(part(ovalGeo(0, 0.85, 0.1, 0.22, 0.26, 0.2, 4, 8), [226, 200, 168]));
    ps.push(part(scG(lathe([[0.05, 0.6], [0.34, 0.4], [0.3, -0.5], [0.05, -0.62]], 8),
                     1, 1, 0.6), [226, 200, 168]));
    for (i = 0; i < 2; i++) {
      var sd = i ? 1 : -1;
      ps.push(part(barGeo(sd * 0.2, 0.45, 0.1, sd * 1.2, 0.5, 0.1, 0.075), [226, 200, 168]));
      ps.push(part(barGeo(sd * 0.16, -0.55, 0.1, sd * 0.75, -1.3, 0.1, 0.085), [226, 200, 168]));
    }
    obj(g, mergeC(ps), 0.06, Math.sin(t * 0.0007) * 0.45, 0, 30, 0);
  }

  function drawZodiacWheel(g, t) {
    var ps = [], i;
    ps.push(part(prism(ringO(1.55, 0.08, 26), 0.04), [190, 160, 90]));
    ps.push(part(prism(ringO(1.1, 0.05, 22), 0.04), [170, 142, 80]));
    for (i = 0; i < 12; i++) {
      var a = i * TAU / 12 + t * 0.0006;
      ps.push(part(barGeo(Math.cos(a) * 1.1, Math.sin(a) * 1.1, 0,
                          Math.cos(a) * 1.5, Math.sin(a) * 1.5, 0, 0.03), [180, 152, 86]));
      ps.push(part(xfG(scG(prism(starO(0.12, 0.05, 5), 0.02), 1, 1, 1), 0, 0, a,
                       Math.cos(a) * 1.32, Math.sin(a) * 1.32, 0.06), [246, 216, 130]));
    }
    ps.push(part(ovalGeo(0, 0, 0.1, 0.34, 0.34, 0.34, 4, 9), [244, 208, 90]));
    obj(g, mergeC(ps), 0.2, Math.sin(t * 0.0005) * 0.3, t * 0.0004, 30, 0);
  }

  function drawAstrolabe(g, t) {
    var ps = [], i;
    ps.push(part(prism(ringO(1.5, 0.1, 24), 0.05), [192, 164, 96]));
    for (i = 0; i < 3; i++) {
      var tilt = 0.4 + i * 0.5, spin = t * (0.0009 + i * 0.0006);
      ps.push(part(xfG(prism(ringO(1.25 - i * 0.28, 0.06, 22), 0.03), tilt, spin, 0, 0, 0, 0),
                   [[214, 186, 110], [180, 190, 200], [200, 150, 90]][i]));
    }
    ps.push(part(ovalGeo(0, 0, 0, 0.24, 0.24, 0.24, 4, 9), [246, 214, 120]));
    ps.push(part(xfG(barGeo(-1.4, 0, 0, 1.4, 0, 0, 0.04), 0, 0, t * 0.0014, 0, 0, 0.1),
                 [230, 226, 214]));
    obj(g, mergeC(ps), 0.2, Math.sin(t * 0.0004) * 0.4, 0, 30, 0);
  }

  function drawAlembic(g, t) {
    var ps = [], i;
    ps.push(part(lathe([[0, -0.9], [0.72, -0.7], [0.8, -0.1], [0.4, 0.35], [0.34, 0.7],
                        [0.4, 0.75], [0.3, 0.78]], 14), [206, 224, 232]));
    ps.push(part(lathe([[0, -0.86], [0.66, -0.68], [0.7, -0.2], [0, -0.2]], 14), [120, 190, 130]));
    for (i = 0; i < 8; i++) {
      var f = i / 8;
      ps.push(part(ovalGeo(0.3 + f * 0.9, 0.7 - f * f * 1.3, 0, 0.09, 0.09, 0.09, 3, 5),
                   [180, 216, 226]));
    }
    ps.push(part(lathe([[0, -1.3], [0.5, -1.2], [0.52, -0.7], [0, -0.7]], 12, 1.35, 0, 0),
                 [206, 224, 232]));
    ps.push(part(lathe([[0, -1.28], [0.44, -1.18], [0.46, -0.95], [0, -0.95]], 12, 1.35, 0, 0),
                 [120, 190, 130]));
    for (i = 0; i < 4; i++)
      ps.push(part(ovalGeo(Math.sin(t * 0.004 + i) * 0.2, -0.1 + i * 0.16, 0,
                           0.09, 0.07, 0.09, 3, 5), [160, 220, 170]));
    ps.push(part(coneGeo(0, -1.35, 0, 0.24, 0.4, 6), [244, 160, 60]));
    obj(g, mergeC(ps), 0.1, Math.sin(t * 0.0006) * 0.35, 0, 28, 0);
  }

  function drawMerkaba(g, t) {
    var m = geo('merk', function () {
      var up = gTetra(), dn = gTetra();
      return mergeC([part(scG(up, 1.15, 1.15, 1.15), [110, 200, 240]),
                     part(scG(dn, -1.15, -1.15, -1.15), [240, 150, 200])]);
    });
    obj(g, m, t * 0.0011, t * 0.0016, t * 0.0007, 28, 1);
  }

  function drawFlowerOfLife(g, t) {
    var m = geo('flower', function () {
      var ps = [], i, k;
      ps.push(part(prism(ringO(0.62, 0.045, 18), 0.02), [180, 210, 240]));
      for (i = 0; i < 6; i++) {
        var a = i * TAU / 6;
        ps.push(part(xfG(prism(ringO(0.62, 0.045, 18), 0.02), 0, 0, 0,
                         Math.cos(a) * 0.62, Math.sin(a) * 0.62, 0), [160, 200, 236]));
        for (k = 0; k < 2; k++) {
          var b = a + (k ? 0.52 : -0.52);
          ps.push(part(xfG(prism(ringO(0.62, 0.045, 18), 0.02), 0, 0, 0,
                           Math.cos(b) * 1.07, Math.sin(b) * 1.07, 0), [140, 186, 226]));
        }
      }
      ps.push(part(prism(ringO(1.68, 0.06, 24), 0.03), [210, 226, 246]));
      return mergeC(ps);
    });
    obj(g, m, Math.sin(t * 0.0006) * 0.35, Math.sin(t * 0.0008) * 0.4, t * 0.0004, 28, 0);
  }

  function drawMetatron(g, t) {
    var m = geo('metatron', function () {
      var pts = [[0, 0]], i, k;
      for (i = 0; i < 6; i++) pts.push([Math.cos(i * TAU / 6) * 0.72, Math.sin(i * TAU / 6) * 0.72]);
      for (i = 0; i < 6; i++) pts.push([Math.cos(i * TAU / 6) * 1.44, Math.sin(i * TAU / 6) * 1.44]);
      var ps = [];
      for (i = 0; i < pts.length; i++) {
        for (k = i + 1; k < pts.length; k++)
          ps.push(part(barGeo(pts[i][0], pts[i][1], 0, pts[k][0], pts[k][1], 0, 0.018),
                       [190, 170, 240]));
        ps.push(part(ovalGeo(pts[i][0], pts[i][1], 0, 0.1, 0.1, 0.1, 3, 6), [230, 214, 250]));
      }
      return mergeC(ps);
    });
    obj(g, m, Math.sin(t * 0.0005) * 0.3, t * 0.0006, 0, 28, 0);
  }

  function drawSriYantra(g, t) {
    var m = geo('sri', function () {
      var ps = [], i;
      ps.push(part(prism(ringO(1.62, 0.08, 24), 0.02), [214, 160, 80]));
      for (i = 0; i < 16; i++) {
        var a = i * TAU / 16;
        ps.push(part(xfG(scG(prism(discO(0.26, 8), 0.015), 1, 0.6, 1), 0, 0, a,
                         Math.cos(a) * 1.35, Math.sin(a) * 1.35, 0), [232, 132, 90]));
      }
      for (i = 0; i < 5; i++) {
        var s2 = 1.15 - i * 0.2;
        ps.push(part(xfG(prism([[0, s2], [s2 * 0.9, -s2 * 0.55], [-s2 * 0.9, -s2 * 0.55]],
                               0.012), 0, 0, 0, 0, 0, i * 0.05), [230, 190, 110]));
        ps.push(part(xfG(prism([[0, -s2 * 0.92], [s2 * 0.82, s2 * 0.5], [-s2 * 0.82, s2 * 0.5]],
                               0.012), 0, 0, 0, 0, 0, i * 0.05 + 0.02), [220, 150, 90]));
      }
      ps.push(part(ovalGeo(0, 0, 0.3, 0.08, 0.08, 0.08, 3, 6), [250, 230, 170]));
      return mergeC(ps);
    });
    obj(g, m, Math.sin(t * 0.0006) * 0.3, Math.sin(t * 0.0009) * 0.35, 0, 28, 0);
  }

  function drawEnochian(g, t) {
    var ps = [], i, j;
    ps.push(part(boxGeo(0, 0, -0.2, 1.7, 1.25, 0.08), [180, 148, 92]));
    for (i = 0; i < 6; i++) for (j = 0; j < 5; j++) {
      var lit = ((i * 5 + j) === Math.floor(t * 0.004) % 30);
      ps.push(part(boxGeo(-1.4 + i * 0.56, 0.9 - j * 0.46, -0.1, 0.2, 0.16, 0.03),
                   lit ? [250, 226, 140] : [96, 70, 40]));
      ps.push(part(boxGeo(-1.4 + i * 0.56, 0.9 - j * 0.46, -0.06,
                          0.03, 0.11, 0.02), lit ? [60, 40, 20] : [140, 108, 62]));
    }
    obj(g, mergeC(ps), 0.14, Math.sin(t * 0.0005) * 0.4, 0, 30, 0);
  }

  function drawHamsa(g, t) {
    var ps = [], i;
    ps.push(part(scG(lathe([[0.05, 0.9], [0.62, 0.6], [0.7, -0.2], [0.5, -0.85],
                            [0.05, -1.0]], 12), 1.0, 1.0, 0.4), [110, 170, 210]));
    for (i = 0; i < 5; i++) {
      var a = -0.9 + i * 0.45;
      var len = i === 0 || i === 4 ? 0.55 : 0.75;
      ps.push(part(barGeo(Math.sin(a) * 0.45, 0.6 + Math.cos(a) * 0.2, 0,
                          Math.sin(a) * (0.45 + len), 0.6 + Math.cos(a) * (0.2 + len), 0, 0.13),
                   [110, 170, 210]));
    }
    ps.push(part(xfG(scG(prism(discO(0.34, 12), 0.05), 1, 0.62, 1), 0, 0, 0, 0, 0, 0.42),
                 [244, 240, 230]));
    ps.push(part(xfG(prism(discO(0.16, 10), 0.05), 0, 0, 0, 0, 0, 0.5), [60, 110, 170]));
    ps.push(part(xfG(prism(discO(0.07, 8), 0.05), 0, 0, 0, 0, 0, 0.56), [20, 18, 24]));
    obj(g, mergeC(ps), 0.06, Math.sin(t * 0.0007) * 0.4, 0, 30, 0);
  }

  function drawEyeOfHorus(g, t) {
    var m = geo('horus', function () {
      var ps = [];
      ps.push(part(xfG(scG(prism(discO(0.62, 14), 0.05), 1, 0.62, 1), 0, 0, 0, -0.1, 0.2, 0),
                   [244, 240, 228]));
      ps.push(part(xfG(prism(discO(0.28, 10), 0.05), 0, 0, 0, -0.1, 0.2, 0.08), [40, 60, 130]));
      ps.push(part(xfG(prism(discO(0.13, 8), 0.05), 0, 0, 0, -0.1, 0.2, 0.14), [20, 18, 24]));
      ps.push(part(xfG(boxGeo(0, 0, 0, 0.75, 0.09, 0.06), 0, 0, 0.18, -0.15, 0.62, 0),
                   [30, 28, 34]));
      ps.push(part(xfG(boxGeo(0, 0, 0, 0.42, 0.08, 0.06), 0, 0, -0.5, 0.75, -0.05, 0),
                   [30, 28, 34]));
      ps.push(part(xfG(boxGeo(0, 0, 0, 0.34, 0.08, 0.06), 0, 0, 0.1, -0.3, -0.28, 0),
                   [30, 28, 34]));
      ps.push(part(xfG(boxGeo(0, 0, 0, 0.24, 0.08, 0.06), 0, 0, 1.1, -0.62, -0.62, 0),
                   [30, 28, 34]));
      return mergeC(ps);
    });
    obj(g, m, 0.06, Math.sin(t * 0.0008) * 0.4, Math.sin(t * 0.0005) * 0.08, 30, 0);
  }

  function drawAnkh(g, t) {
    var m = geo('ankh', function () { return mergeC([
      part(xfG(prism(ringO(0.6, 0.2, 16), 0.3), 0, 0, 0, 0, 0.85, 0), [216, 182, 88]),
      part(boxGeo(0, -0.5, 0, 0.19, 0.85, 0.3), [216, 182, 88]),
      part(boxGeo(0, 0.15, 0, 0.85, 0.17, 0.3), [216, 182, 88])
    ]); });
    obj(g, m, 0.06, t * 0.0011, 0, 30, 1);
  }

  function drawOrphicEgg(g, t) {
    var ps = [], i, k;
    ps.push(part(scG(lathe([[0.03, 1.15], [0.5, 0.85], [0.78, 0.1], [0.72, -0.6],
                            [0.4, -1.05], [0.03, -1.15]], 14), 1, 1, 1), [232, 224, 200]));
    for (k = 0; k < 24; k++) {
      var f = k / 24;
      var a = f * 12 + t * 0.0012;
      var y = -1.05 + f * 2.15;
      var r = 0.78 * Math.sqrt(Math.max(0.05, 1 - Math.pow((y - 0.1) / 1.2, 2)));
      ps.push(part(ovalGeo(Math.cos(a) * r, y, Math.sin(a) * r, 0.11, 0.1, 0.11, 3, 5),
                   [96, 150, 78]));
    }
    for (i = 0; i < 6; i++) {
      var b = i * TAU / 6 - t * 0.0009;
      ps.push(part(ovalGeo(Math.cos(b) * 1.5, Math.sin(b) * 1.5 * 0.5, Math.sin(b) * 1.2,
                           0.06, 0.06, 0.06, 3, 4), [246, 226, 150]));
    }
    obj(g, mergeC(ps), 0.1, 0, 0, 30, 0);
  }

  function drawBaphometSigil(g, t) {
    var ps = [], i;
    ps.push(part(prism(starO(1.3, 0.51, 5, 0), 0.06), [188, 60, 62]));
    ps.push(part(prism(ringO(1.48, 0.08, 22), 0.04), [150, 44, 48]));
    ps.push(part(xfG(scG(prism(discO(0.4, 10), 0.05), 1, 0.8, 1), 0, 0, 0, 0, -0.35, 0.12),
                 [40, 36, 44]));
    for (i = 0; i < 2; i++)
      ps.push(part(xfG(prism([[0, 0], [0.5, 0.5], [0.6, 0.1]], 0.04), 0, 0,
                       (i ? 1 : -1) * 0.2 + (i ? 0 : Math.PI), (i ? 1 : -1) * 0.34, 0.1, 0.12),
                   [222, 216, 200]));
    for (i = 0; i < 5; i++) {
      var a = Math.PI / 2 + i * TAU / 5;
      ps.push(part(ovalGeo(Math.cos(a) * 1.3, Math.sin(a) * 1.3, 0.12, 0.09, 0.09, 0.09, 3, 5),
                   [244, 180, 90]));
    }
    obj(g, mergeC(ps), Math.sin(t * 0.0006) * 0.3, t * 0.0007, t * 0.0004, 30, 0);
  }

  function drawCrystalBall(g, t) {
    var ps = [], i;
    ps.push(part(lathe([[0, -1.5], [0.7, -1.45], [0.6, -1.15], [0.4, -1.0]], 12), [110, 74, 44]));
    ps.push(part(torGeo(0, -0.95, 0, 0.42, 0.1, 12, 5), [150, 110, 64]));
    for (i = 0; i < 8; i++) {
      var a = i * TAU / 8 + t * 0.0011;
      ps.push(part(ovalGeo(Math.cos(a) * 0.42, -0.1 + Math.sin(a * 2) * 0.3, Math.sin(a) * 0.42,
                           0.16, 0.16, 0.16, 3, 6),
                   [150 + i * 10, 120 + i * 8, 220]));
    }
    obj(g, mergeC(ps), 0.1, 0, 0, 30, 0);
    g.globalAlpha = 0.34;
    obj(g, mergeC([part(ovalGeo(0, -0.1, 0, 0.95, 0.95, 0.95, 7, 14), [200, 220, 246])]),
        0.1, 0, 0, 30, 0);
    g.globalAlpha = 1;
  }

  function drawAlchemicalSol(g, t) {
    var ps = [], i;
    ps.push(part(prism(ringO(1.15, 0.11, 22), 0.07), [232, 190, 70]));
    ps.push(part(prism(discO(0.28, 12), 0.08), [244, 214, 110]));
    for (i = 0; i < 16; i++) {
      var a = i * TAU / 16 + t * 0.0011;
      ps.push(part(boxGeo(Math.cos(a) * 1.5, Math.sin(a) * 1.5, 0, 0.26, 0.05, 0.05),
                   [244, 196, 74]));
    }
    obj(g, mergeC(ps), Math.sin(t * 0.0006) * 0.3, Math.sin(t * 0.0009) * 0.4, 0, 30, 0);
  }

  function drawAlchemicalLuna(g, t) {
    var ps = [], i;
    ps.push(part(prism(discO(1.25, 16), 0.1), [222, 226, 238]));
    ps.push(part(xfG(prism(discO(1.05, 16), 0.14), 0, 0, 0, 0.62, 0.1, 0.26), [36, 36, 48]));
    for (i = 0; i < 10; i++) {
      var a = i * TAU / 10 - t * 0.0008;
      ps.push(part(ovalGeo(Math.cos(a) * 1.6, Math.sin(a) * 1.6, -0.3, 0.06, 0.06, 0.06, 3, 4),
                   [230, 234, 244]));
    }
    obj(g, mergeC(ps), 0.06, Math.sin(t * 0.0007) * 0.35, t * 0.0004, 30, 0);
  }

  function drawMementoMori(g, t) {
    var ps = [], i;
    ps.push(part(scG(lathe([[0.06, 1.0], [0.55, 0.9], [0.9, 0.5], [0.98, 0], [0.8, -0.5],
                            [0.55, -0.8], [0.06, -0.9]], 12), 0.8, 0.78, 0.72),
                 [226, 222, 206]));
    ps.push(part(boxGeo(0, -0.82, 0.16, 0.42, 0.18, 0.4), [216, 212, 196]));
    for (i = 0; i < 2; i++)
      ps.push(part(ovalGeo((i ? 1 : -1) * 0.3, 0.12, 0.52, 0.2, 0.22, 0.14, 3, 7), [26, 24, 26]));
    ps.push(part(xfG(prism([[-0.1, 0.12], [0.1, 0.12], [0, -0.12]], 0.08), 0, 0, 0,
                     0, -0.3, 0.56), [26, 24, 26]));
    ps.push(part(lathe([[0, -1.5], [1.2, -1.5], [1.25, -1.34], [0, -1.34]], 14), [150, 108, 62]));
    for (i = 0; i < 8; i++) {
      var a = i * TAU / 8 + t * 0.0009;
      ps.push(part(xfG(scG(prism(discO(0.24, 8), 0.02), 1, 0.5, 1), 0, 0, a,
                       Math.cos(a) * 1.0, -1.15, Math.sin(a) * 1.0), [190, 70, 90]));
    }
    ps.push(part(boxGeo(0.95, -0.3, 0.4, 0.34, 0.4, 0.16), [200, 190, 168]));
    obj(g, mergeC(ps), 0.1, Math.sin(t * 0.0006) * 0.35, 0, 28, 0);
  }

  function drawHourglass(g, t) {
    var c = (t % 8000) / 8000;
    var ps = [], i;
    for (i = 0; i < 2; i++)
      ps.push(part(boxGeo(0, (i ? 1 : -1) * 1.35, 0, 0.95, 0.12, 0.7), [140, 96, 54]));
    for (i = 0; i < 4; i++)
      ps.push(part(barGeo((i < 2 ? 1 : -1) * 0.8, -1.3, (i % 2 ? 1 : -1) * 0.5,
                          (i < 2 ? 1 : -1) * 0.8, 1.3, (i % 2 ? 1 : -1) * 0.5, 0.07),
                   [140, 96, 54]));
    ps.push(part(lathe([[0, -1.15], [0.68, -1.1], [0.62, -0.5], [0.08, -0.05], [0.62, 0.5],
                        [0.68, 1.1], [0, 1.15]], 14), [216, 226, 234]));
    var top = (1 - c) * 0.55;
    ps.push(part(lathe([[0, 0.05], [0.55 * top + 0.06, 0.05 + top], [0, 0.05 + top]], 12),
                 [226, 190, 110]));
    ps.push(part(lathe([[0, -1.08], [0.62, -1.08], [0.5 * c + 0.08, -1.08 + c * 0.7],
                        [0, -1.08 + c * 0.7]], 12), [226, 190, 110]));
    for (i = 0; i < 4; i++)
      ps.push(part(ovalGeo(0, -0.05 - ((t * 0.004 + i * 0.25) % 1) * 0.9, 0,
                           0.04, 0.06, 0.04, 3, 4), [226, 190, 110]));
    g.globalAlpha = 0.85;
    obj(g, mergeC(ps), 0.06, Math.sin(t * 0.0006) * 0.4, 0, 28, 0);
    g.globalAlpha = 1;
  }

  function drawGrail(g, t) {
    var ps = [], i;
    ps.push(part(lathe([[0, -1.3], [0.85, -1.25], [0.75, -1.05], [0.16, -0.85], [0.14, -0.3],
                        [0.85, 0.35], [0.9, 0.95], [0.78, 0.95], [0.72, 0.35],
                        [0.06, -0.28]], 16), [222, 186, 92]));
    ps.push(part(lathe([[0, 0.5], [0.78, 0.6], [0.74, 0.55], [0, 0.45]], 16), [150, 30, 48]));
    ps.push(part(torGeo(0, -0.55, 0, 0.24, 0.07, 12, 5), [236, 208, 130]));
    for (i = 0; i < 10; i++) {
      var a = i * TAU / 10 + t * 0.0013;
      ps.push(part(ovalGeo(Math.cos(a) * 1.35, 0.7 + Math.sin(a * 2) * 0.5, Math.sin(a) * 1.35,
                           0.07, 0.07, 0.07, 3, 5), [250, 236, 170]));
    }
    obj(g, mergeC(ps), 0.16, Math.sin(t * 0.0006) * 0.4, 0, 28, 0);
  }

  function drawLabyrinth(g, t) {
    var m = geo('laby', function () {
      var ps = [], k, i;
      for (k = 0; k < 7; k++) {
        var r = 0.28 + k * 0.2;
        var gap = k * 0.9;
        for (i = 0; i < 26; i++) {
          var a = i / 26 * TAU;
          if (Math.abs(((a - gap) % TAU + TAU) % TAU) < 0.34) continue;
          ps.push(part(boxGeo(Math.cos(a) * r, Math.sin(a) * r, 0, 0.07, 0.07, 0.14),
                       [180 + k * 8, 160 + k * 8, 130]));
        }
      }
      return mergeC(ps);
    });
    obj(g, m, 0.28, t * 0.0005, 0, 30, 0);
  }

  function drawChakras(g, t) {
    var cols = [[214, 60, 60], [230, 140, 50], [240, 210, 70], [90, 200, 110],
                [80, 160, 230], [110, 90, 220], [190, 120, 230]];
    var ps = [], i, k;
    ps.push(part(cylGeo(0, 0, 0, 0.07, 0.07, 3.0, 6), [230, 226, 240]));
    for (i = 0; i < 7; i++) {
      var y = -1.3 + i * 0.44;
      var p2 = (Math.sin(t * 0.003 + i * 0.7) + 1) / 2;
      ps.push(part(ovalGeo(0, y, 0, 0.2 + p2 * 0.06, 0.2 + p2 * 0.06, 0.2 + p2 * 0.06, 4, 8),
                   cols[i]));
      for (k = 0; k < 6; k++) {
        var a = k * TAU / 6 + t * 0.001 * (i % 2 ? 1 : -1);
        ps.push(part(ovalGeo(Math.cos(a) * (0.34 + p2 * 0.1), y, Math.sin(a) * (0.34 + p2 * 0.1),
                             0.07, 0.07, 0.07, 3, 5), cols[i]));
      }
    }
    obj(g, mergeC(ps), 0.06, Math.sin(t * 0.0005) * 0.4, 0, 30, 0);
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

  /* The head is built fresh every frame: expression lives in the
     geometry, not in a transform, so a raised brow really is a raised
     brow when the head turns.

     It goes down in three passes rather than one merged solid. A
     painter's sort compares average depths, and a brow is far too
     small to win that argument against the skull facet behind it —
     so the skull is laid down first and the face drawn onto it. */
  function drawFace(g, o) {
    /* A head reads the cursor as something to look at rather than
       something to be looked at from, so it borrows the gaze matrix
       for the length of its own drawing and puts the camera back. */
    var camera = viewM;
    viewM = lookM;
    var L = o.L;
    var skin = hex2(L.skin), warm = hex2(L.lit), shade = hex2(L.dark);
    var lipc = hex2(L.lip), hairc = hex2(L.hair), iris = hex2(L.eye);
    var cloth = hex2(L.cloth);
    var ry = o.turn * 0.85, rz = o.tilt, sc = 33 * (o.scale || 1);
    var dy = -o.bob * 0.02;
    var ps = [], i, sd;

    /* --- pass one: everything with a back to it -------------------- */
    ps.push(part(boxGeo(0, -2.25 + dy, -0.1, 1.45, 0.55, 0.6), cloth));
    ps.push(part(cylGeo(0, -1.5 + dy, -0.04, 0.4, 0.5, 1.0, 10), shade));
    ps.push(part(boxGeo(0, -1.72 + dy, 0.3, 0.5, 0.24, 0.3), cloth));
    ps.push(part(xfG(scG(lathe([[0.03, 1.12], [0.46, 1.02], [0.76, 0.74], [0.88, 0.3],
                                [0.86, -0.12], [0.7, -0.54], [0.44, -0.9], [0.03, -1.05]], 14),
                         0.98, 1, 0.84), 0, 0, 0, 0, 0.1 + dy, 0.04), skin));

    var earO = [[-0.08, -0.3], [0.24, -0.16], [0.15, 0.18], [-0.02, 0.6], [-0.18, 0.12]];
    for (i = 0; i < 2; i++) {
      sd = i ? 1 : -1;
      ps.push(part(xfG(prism(earO, 0.07), 0, sd * Math.PI / 2, 0, sd * 0.84, dy - 0.02, -0.06), warm));
    }
    if (o.hairStyle !== -1)
      ps.push(part(xfG(scG(lathe([[0.05, 1.1], [0.56, 1.0], [0.9, 0.7],
                                  [0.99, 0.52], [0.97, 0.42]], 12),
                           0.98, 1.02, 0.92), 0, 0, 0, 0, 0.12 + dy, 0.02), hairc));
    var passHead = ps;

    /* --- pass two: the face itself, laid on the front -------------- */
    ps = [];
    for (i = 0; i < 2; i++) {
      sd = i ? 1 : -1;
      var bv = (i ? o.browR : o.browL);
      var sweep = o.vulcan ? 0.5 : 0.14;
      ps.push(part(xfG(boxGeo(0, 0, 0, 0.3, 0.055, 0.1),
                       0, 0, -sd * (sweep + bv * 0.55),
                       sd * 0.38, 0.28 - o.browY * 0.035 + dy, 0.58), hairc));
    }
    for (i = 0; i < 2; i++) {
      sd = i ? 1 : -1;
      var open = i ? o.eyeR : o.eyeL;
      var ex = sd * 0.37, ey = 0.02 + dy, ez = 0.5;
      ps.push(part(ovalGeo(ex, ey, ez, 0.23, 0.2, 0.14, 4, 8), [240, 238, 230]));
      var gx = ex + o.gazeX * 0.1, gy = ey - o.gazeY * 0.08;
      ps.push(part(xfG(prism(discO(0.135, 8), 0.02), 0, 0, 0, gx, gy, ez + 0.13), iris));
      ps.push(part(xfG(prism(discO(0.07, 7), 0.02), 0, 0, 0, gx, gy, ez + 0.16), [14, 10, 12]));
      /* the lid is a thin flap swinging down over the ball */
      var drop = (1 - open) * 0.26;
      /* the lid rides forward as it closes, so it hides the pupil */
      ps.push(part(boxGeo(ex, ey + 0.24 - drop, ez + 0.06 + drop * 0.45,
                          0.24, 0.05 + drop, 0.15), warm));
      ps.push(part(boxGeo(ex, ey - 0.23, ez + 0.05, 0.24, 0.04, 0.11), shade));
    }
    ps.push(part(barGeo(0, 0.26 + dy, 0.56, 0, -0.3 + dy, 0.74, 0.085), skin));
    ps.push(part(ovalGeo(0, -0.34 + dy, 0.76, 0.15, 0.13, 0.14, 3, 7), warm));
    ps.push(part(ovalGeo(-0.17, -0.38 + dy, 0.66, 0.07, 0.06, 0.07, 3, 5), shade));
    ps.push(part(ovalGeo(0.17, -0.38 + dy, 0.66, 0.07, 0.06, 0.07, 3, 5), shade));

    var gap = o.open * 0.4;
    var mw = 0.32 + o.wide * 0.15 - o.pucker * 0.13;
    var my = -0.82 + dy;
    if (gap > 0.02) ps.push(part(boxGeo(0, my, 0.5, mw, gap, 0.06), [46, 18, 22]));
    if (o.teeth && gap > 0.06)
      ps.push(part(boxGeo(0, my + gap - 0.03, 0.54, mw * 0.86, 0.05, 0.05), [238, 234, 220]));
    ps.push(part(boxGeo(0, my + gap + 0.04, 0.56, mw, 0.035, 0.09), lipc));
    ps.push(part(boxGeo(0, my - gap - 0.05, 0.56, mw, 0.045, 0.09), lipc));
    for (i = 0; i < 2; i++) {
      sd = i ? 1 : -1;
      ps.push(part(ovalGeo(sd * mw, my + o.smile * 0.18, 0.5, 0.045, 0.045, 0.045, 3, 5), lipc));
    }
    if (o.sweat)
      ps.push(part(ovalGeo(0.66, 0.6 - o.sweat * 1.6 + dy, 0.4, 0.08, 0.11, 0.08, 3, 6),
                   [170, 210, 235]));
    var passFace = ps;

    /* Spin him past side-on and the face is behind the skull, so the
       three passes go down back to front instead of front to back. */
    var toward = facingZ(0, ry, rz) >= 0;
    if (toward) {
      obj(g, mergeC(passHead), 0, ry, rz, sc, 0);
      obj(g, mergeC(passFace), 0, ry, rz, sc, 0);
      if (o.hand) obj(g, mergeC(handParts(o.hand, skin, warm)), 0, ry * 0.4, rz, sc, 0);
    } else {
      if (o.hand) obj(g, mergeC(handParts(o.hand, skin, warm)), 0, ry * 0.4, rz, sc, 0);
      obj(g, mergeC(passFace), 0, ry, rz, sc, 0);
      obj(g, mergeC(passHead), 0, ry, rz, sc, 0);
    }
    viewM = camera;
  }

  /* Salute, nerve pinch, meld: the same hand, placed and splayed
     differently. Fingers are bars so they can point anywhere. */
  function handParts(kind, skin, warm) {
    var ps = [], i, a, sp, px, py, pz, rot;
    if (kind === 1) { px = 1.15; py = 0.1; pz = 0.75; rot = -0.2; sp = 1; }
    else if (kind === 2) { px = 0.75; py = -1.55; pz = 0.55; rot = 0.5; sp = 0; }
    else { px = 0.9; py = 0.2; pz = 0.6; rot = 0.1; sp = 2; }

    ps.push(part(xfG(boxGeo(0, 0, 0, 0.16, 0.3, 0.26), 0, 0, rot, px, py, pz), skin));
    for (i = 0; i < 4; i++) {
      /* the salute parts two and two; the meld lays them in a line */
      a = sp === 1 ? (i < 2 ? -0.34 : 0.1) + i * 0.14
        : sp === 2 ? -0.5 + i * 0.1 : -0.16 + i * 0.1;
      var fx = px + Math.sin(a) * 0.5, fy = py + Math.cos(a) * 0.62;
      ps.push(part(barGeo(px - 0.1 + i * 0.07, py + 0.25, pz,
                          fx - 0.1 + i * 0.07, fy, pz - 0.04, 0.055), warm));
    }
    ps.push(part(barGeo(px - 0.12, py - 0.05, pz + 0.06,
                        px - 0.48, py + 0.18, pz + 0.1, 0.06), warm));
    return ps;
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

  /* Models are authored the way a person would describe them: +X to
     the right, +Y up, +Z out of the screen towards you. The tube
     counts Y downward and reckons depth the other way, so this is
     where the two conventions are reconciled — once, here, rather
     than in three hundred scenes. */
  function pxy(p, sc) {
    var k = CAMD / (CAMD - p[2]);
    return [80 + p[0] * k * sc, 60 - p[1] * k * sc, k];
  }

  /* --- the viewer's own angle on the scene ------------------------
     The cursor does two different jobs depending on what is on.

     For most channels it swings the camera round the scene: sweep
     across the window and the thing turns the whole way about. That
     is ORBIT, and it is what xform applies by default.

     Heads are the exception. A face that turns away from you as you
     approach it is unnerving, so the Vulcan and the fifty animals
     read the same cursor as a gaze and turn to look straight at it —
     LOOK, below, which those two renderers swap in for themselves.
     It stops at sixty degrees: the tube is a hand's width across, so
     a cursor at the edge of the window is nowhere near side-on from
     where the picture sits, and a head turned the full ninety shows
     you an ear instead of a face.

     Both are eased toward, so a flicked mouse arcs round rather than
     snapping; hold still and it drifts back to square on and leaves
     the channel to get on with whatever it was doing. */

  var curX = 0, curY = 0;     /* where the pointer is, -1..1 from the tube */
  var eX = 0, eY = 0;         /* where the easing has got to */
  var viewM = null;           /* null while square on: skip the maths */
  var lookM = null;
  var ORBIT_YAW = Math.PI, ORBIT_PITCH = Math.PI * 0.28;
  var LOOK_YAW = 1.05, LOOK_PITCH = 0.55;
  var lastAim = 0;

  /* yaw about the world's up, then pitch about the camera's own
     side-to-side axis — the order a person's head does it in */
  function rotM(rx, ry) {
    if (Math.abs(rx) < 0.002 && Math.abs(ry) < 0.002) return null;
    var cy = Math.cos(ry), sy = Math.sin(ry);
    var cx = Math.cos(rx), sx = Math.sin(rx);
    return [cy, 0, sy,
            sx * sy, cx, -sx * cy,
            -cx * sy, sx, cx * cy];
  }

  function easeView() {
    if (Date.now() - lastAim > 700) { curX *= 0.92; curY *= 0.92; }
    eX += (curX - eX) * 0.16;
    eY += (curY - eY) * 0.16;
    viewM = rotM(-eY * ORBIT_PITCH, -eX * ORBIT_YAW);
    lookM = rotM(eY * LOOK_PITCH, eX * LOOK_YAW);
  }

  function toEye(p) {
    var m = viewM;
    return [m[0] * p[0] + m[1] * p[1] + m[2] * p[2],
            m[3] * p[0] + m[4] * p[1] + m[5] * p[2],
            m[6] * p[0] + m[7] * p[1] + m[8] * p[2]];
  }

  /* Where a scene's own +Z ends up once the camera has moved. The
     heads paint their features onto the skull, which is only the right
     order while the face is still pointing at us; spin past side-on and
     the order has to turn over with it. */
  function facingZ(rx, ry, rz) {
    var p = rot3([0, 0, 1], rx || 0, ry || 0, rz || 0);
    return viewM ? toEye(p)[2] : p[2];
  }

  function xform(V, rx, ry, rz) {
    var out = [], i;
    if (viewM) for (i = 0; i < V.length; i++) out.push(toEye(rot3(V[i], rx, ry, rz)));
    else for (i = 0; i < V.length; i++) out.push(rot3(V[i], rx, ry, rz));
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
    order.sort(function (a, b) { return R[a][2] - R[b][2]; });
    for (i = 0; i < order.length; i++) {
      var p = pxy(R[order[i]], sc);
      g.fillStyle = 'rgba(' + rgb + ',' + Math.min(1, 0.15 + p[2] * 0.9).toFixed(2) + ')';
      ell(g, p[0], p[1], size * p[2], size * p[2]);
    }
  }

  function solid(g, R, F, sc, rgb, edge) {
    var i, k, order = [], mx = 0, my = 0, mz = 0;
    for (i = 0; i < R.length; i++) { mx += R[i][0]; my += R[i][1]; mz += R[i][2]; }
    mx /= R.length || 1; my /= R.length || 1; mz /= R.length || 1;
    for (i = 0; i < F.length; i++) {
      var f = F[i], z = 0;
      for (k = 0; k < f.length; k++) z += R[f[k]][2];
      order.push([i, z / f.length]);
    }
    order.sort(function (a, b) { return a[1] - b[1]; });   /* far first */
    for (i = 0; i < order.length; i++) {
      var fc = F[order[i][0]];
      var a = R[fc[0]], b = R[fc[1]], c = R[fc[2]];
      var ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
      var vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
      var nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      var cxm = 0, cym = 0, czm = 0;
      for (k = 0; k < fc.length; k++) { cxm += R[fc[k]][0]; cym += R[fc[k]][1]; czm += R[fc[k]][2]; }
      var m = fc.length;
      if (nx * (cxm / m - mx) + ny * (cym / m - my) + nz * (czm / m - mz) < 0) {
        nx = -nx; ny = -ny; nz = -nz;
      }
      var len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
      var sh = (nx * -0.40 + ny * 0.52 + nz * 0.76) / len;
      sh = 0.30 + Math.max(0, sh) * 0.82;
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
      var q = rot3([x2 * k, y2 * k, z * k], rx, ry, 0);
      out.push(viewM ? toEye(q) : q);
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
    var V = [], F = [], C = [], P = [], fp = [], i, k;
    for (i = 0; i < parts.length; i++) {
      var base = V.length, p = parts[i];
      for (k = 0; k < p.V.length; k++) V.push(p.V[k]);
      P.push([base, V.length]);
      for (k = 0; k < p.F.length; k++) {
        var f = p.F[k], nf = [], j;
        for (j = 0; j < f.length; j++) nf.push(f[j] + base);
        F.push(nf); C.push(p.c); fp.push(i);
      }
    }
    return { V: V, F: F, C: C, P: P, fp: fp };
  }

  /* Which way is "out"? The winding of the geometry builders is not
     consistent, so a face normal is oriented by pointing it away from
     the middle of its own part. Judging it against the world origin
     instead — as this used to — is right only while the object sits
     at the centre of the scene, and quietly wrecks the shading of
     anything parked off to one side. */
  function solidM(g, R, F, C, sc, edge, P, fp) {
    var i, k, order = [], cen = null;
    if (P) {
      cen = [];
      for (i = 0; i < P.length; i++) {
        var sx = 0, sy = 0, sz = 0, n = P[i][1] - P[i][0] || 1;
        for (k = P[i][0]; k < P[i][1]; k++) { sx += R[k][0]; sy += R[k][1]; sz += R[k][2]; }
        cen.push([sx / n, sy / n, sz / n]);
      }
    }
    for (i = 0; i < F.length; i++) {
      var f = F[i], z = 0;
      for (k = 0; k < f.length; k++) z += R[f[k]][2];
      order.push([i, z / f.length]);
    }
    order.sort(function (a, b) { return a[1] - b[1]; });   /* far first */
    for (i = 0; i < order.length; i++) {
      var idx = order[i][0], fc = F[idx], rgb = C[idx];
      var a = R[fc[0]], b = R[fc[1]], c = R[fc[2]];
      var ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
      var vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
      var nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      var cxm = 0, cym = 0, czm = 0;
      for (k = 0; k < fc.length; k++) { cxm += R[fc[k]][0]; cym += R[fc[k]][1]; czm += R[fc[k]][2]; }
      var o = cen ? cen[fp[idx]] : null, m = fc.length;
      var dx = cxm / m - (o ? o[0] : 0);
      var dy = cym / m - (o ? o[1] : 0);
      var dz = czm / m - (o ? o[2] : 0);
      if (nx * dx + ny * dy + nz * dz < 0) { nx = -nx; ny = -ny; nz = -nz; }
      var len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
      var sh = (nx * -0.40 + ny * 0.52 + nz * 0.76) / len;
      sh = 0.30 + Math.max(0, sh) * 0.82;
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
    solidM(g, xform(m.V, rx, ry, rz), m.F, m.C, sc, edge, m.P, m.fp);
  }

  /* --- a wider vocabulary of parts --------------------------------
     prism extrudes a flat outline into a slab, which is how anything
     with a recognisable silhouette gets made; lathe spins a profile,
     which is how anything turned on a wheel gets made. xfG poses a
     finished part, so limbs and lids need not be axis-aligned.
     ---------------------------------------------------------------- */

  function prism(pts, d) {
    var V = [], F = [], n = pts.length, i, f = [], b = [];
    for (i = 0; i < n; i++) V.push([pts[i][0], pts[i][1], d]);
    for (i = 0; i < n; i++) V.push([pts[i][0], pts[i][1], -d]);
    for (i = 0; i < n; i++) f.push(i);
    for (i = n - 1; i >= 0; i--) b.push(n + i);
    F.push(f); F.push(b);
    for (i = 0; i < n; i++) F.push([i, (i + 1) % n, n + (i + 1) % n, n + i]);
    return { V: V, F: F };
  }

  function lathe(prof, seg, x, y, z) {
    var V = [], F = [], i, k, n = prof.length, c0 = [], c1 = [];
    seg = seg || 10; x = x || 0; y = y || 0; z = z || 0;
    for (i = 0; i < n; i++) for (k = 0; k < seg; k++) {
      var a = k / seg * TAU;
      V.push([x + Math.cos(a) * prof[i][0], y + prof[i][1], z + Math.sin(a) * prof[i][0]]);
    }
    for (i = 0; i < n - 1; i++) for (k = 0; k < seg; k++) {
      var k2 = (k + 1) % seg;
      F.push([i * seg + k, (i + 1) * seg + k, (i + 1) * seg + k2, i * seg + k2]);
    }
    if (prof[0][0] > 0.02) { for (k = seg - 1; k >= 0; k--) c0.push(k); F.push(c0); }
    if (prof[n - 1][0] > 0.02) { for (k = 0; k < seg; k++) c1.push((n - 1) * seg + k); F.push(c1); }
    return { V: V, F: F };
  }

  function coneGeo(x, y, z, r, h, seg, axis) {
    return cylGeo(x, y, z, 0.015, r, h, seg || 10, axis);
  }

  function torGeo(x, y, z, R, r, nu, nv, axis) {
    var m = gTorus(nu || 14, nv || 8, R, r), V = [], i;
    for (i = 0; i < m.V.length; i++) {
      var q = m.V[i];
      if (axis === 'x') V.push([x + q[1], y + q[0], z + q[2]]);
      else if (axis === 'z') V.push([x + q[0], y + q[2], z + q[1]]);
      else V.push([x + q[0], y + q[1], z + q[2]]);
    }
    return { V: V, F: m.F };
  }

  /* pose a finished part: rotate about its own origin, then place */
  function xfG(m, rx, ry, rz, dx, dy, dz) {
    var V = [], i, q;
    for (i = 0; i < m.V.length; i++) {
      q = rot3(m.V[i], rx || 0, ry || 0, rz || 0);
      V.push([q[0] + (dx || 0), q[1] + (dy || 0), q[2] + (dz || 0)]);
    }
    return { V: V, F: m.F };
  }

  function scG(m, sx, sy, sz) {
    var V = [], i;
    for (i = 0; i < m.V.length; i++)
      V.push([m.V[i][0] * sx, m.V[i][1] * sy, m.V[i][2] * sz]);
    return { V: V, F: m.F };
  }

  /* a limb: a tapered box from a to b, so arms and legs can point
     anywhere without the caller doing trigonometry */
  function barGeo(ax, ay, az, bx, by, bz, w) {
    var dx = bx - ax, dy = by - ay, dz = bz - az;
    var len = Math.sqrt(dx * dx + dy * dy + dz * dz) || 0.001;
    var ry = Math.atan2(dx, dz), rx = Math.asin(Math.max(-1, Math.min(1, dy / len)));
    var m = boxGeo(0, 0, 0, w, w, len / 2);
    return xfG(m, -rx, ry, 0, (ax + bx) / 2, (ay + by) / 2, (az + bz) / 2);
  }

  function ovalGeo(x, y, z, rx, ry, rz, nu, nv) {
    return xfG(scG(sphGeo(0, 0, 0, 1, nu || 6, nv || 10), rx, ry, rz), 0, 0, 0, x, y, z);
  }

  function hex2(c) {
    return [parseInt(c.substr(1, 2), 16), parseInt(c.substr(3, 2), 16),
            parseInt(c.substr(5, 2), 16)];
  }

  /* --- flat outlines for prism ------------------------------------ */

  function discO(r, n, rot) {
    var p = [], i;
    for (i = 0; i < n; i++) { var a = (rot || 0) + i / n * TAU; p.push([Math.cos(a) * r, Math.sin(a) * r]); }
    return p;
  }

  function starO(r1, r2, n, rot) {
    var p = [], i;
    for (i = 0; i < n * 2; i++) {
      var a = (rot || 0) - Math.PI / 2 + i * Math.PI / n;
      var rr = i % 2 ? r2 : r1;
      p.push([Math.cos(a) * rr, Math.sin(a) * rr]);
    }
    return p;
  }

  function heartO(s) {
    var p = [], i;
    for (i = 0; i < 22; i++) {
      var a = i / 22 * TAU;
      var x = 16 * Math.pow(Math.sin(a), 3);
      var y = 13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a);
      p.push([x * s / 16, y * s / 16]);
    }
    return p;
  }

  function ringO(r, w, n, rot) {           /* annulus as one winding */
    var p = [], i;
    n = n || 16;
    for (i = 0; i <= n; i++) { var a = (rot || 0) + i / n * TAU; p.push([Math.cos(a) * r, Math.sin(a) * r]); }
    for (i = n; i >= 0; i--) { var b = (rot || 0) + i / n * TAU; p.push([Math.cos(b) * (r - w), Math.sin(b) * (r - w)]); }
    return p;
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

  /* One head, three passes: the skull and everything that grows out of
     it, then the face laid on the front, then the small dark details
     that have to win over both. Sorting by average depth cannot keep a
     nostril in front of a snout, so the order is made explicit. */
  function drawAnimal(g, o) {
    var camera = viewM;         /* see drawFace: heads look, they do not orbit */
    viewM = lookM;
    var fur = hex2(o.fur), lit = hex2(o.lit), dk = hex2(o.dark);
    var belly = hex2(o.belly), nosec = hex2(o.nose);
    /* the stock ear brown only suits a brown animal; everyone else
       wears their own shadow colour */
    var earc = hex2(o.ear === '#7a5430' ? o.dark : o.ear);
    var eyec = hex2(o.eye), pup = hex2(o.pupil);
    var hx = o.headW / 40, hy = o.headH / 40;
    var i, sd, a, ps = [];
    /* where the skull's surface is at a given point on the face, so an
       eye set wide still sits on the head rather than beside it */
    function skin3(px, py) {
      var u = px / (hx * 1.04), v = py / (hy * 1.04);
      return hx * 0.92 * Math.sqrt(Math.max(0.1, 1 - u * u - v * v));
    }

    /* --- pass one: skull, ears, horns, mane ------------------------ */
    ps.push(part(scG(lathe([[0.05, 1.0], [0.52, 0.93], [0.84, 0.68], [0.99, 0.26],
                            [1.0, -0.16], [0.88 * o.jaw, -0.58], [0.56 * o.jaw, -0.88],
                            [0.05, -1.0]], 14), hx, hy, hx * 0.92), fur));

    if (o.mane)
      for (i = 0; i < 14; i++) {
        a = i * TAU / 14;
        ps.push(part(ovalGeo(Math.cos(a) * hx * 1.15, Math.sin(a) * hy * 1.12 - hy * 0.1,
                             -hx * 0.3, hx * 0.3, hx * 0.3, hx * 0.3, 3, 5), dk));
      }

    for (i = 0; i < 2 && o.earType; i++) {
      sd = i ? 1 : -1;
      var ex = sd * hx * o.earX, ey = -o.earY * hy, ez = -hx * 0.2;
      var t2 = sd * (o.earTilt + (i ? o.earFlick : -o.earFlick));
      var es = o.earSz;
      if (o.earType === 1)                                  /* pricked triangle */
        ps.push(part(xfG(prism([[-0.3, -0.2], [0.3, -0.2], [0, 0.95]], 0.07),
                         0, 0, -t2 * 0.5, ex, ey + hy * 0.25 * es, ez), earc));
      else if (o.earType === 2)                             /* round */
        ps.push(part(ovalGeo(ex, ey, ez, 0.3 * es, 0.32 * es, 0.09, 4, 8), earc));
      else if (o.earType === 3)                             /* floppy, hanging */
        ps.push(part(xfG(scG(prism(discO(0.34 * es, 9), 0.06), 1, 1.5, 1),
                         0, 0, -t2, ex + sd * 0.18 * es, ey - 0.34 * es, ez), earc));
      else if (o.earType === 4)                             /* long */
        ps.push(part(xfG(scG(prism(discO(0.2 * es, 9), 0.06), 1, 2.6, 1),
                         0, 0, -t2 * 0.6, ex, ey + 0.5 * es, ez), earc));
      else if (o.earType === 5)                             /* small, tucked */
        ps.push(part(ovalGeo(ex, ey - 0.1, ez, 0.17 * es, 0.17 * es, 0.08, 3, 6), earc));
      else {                                                /* tufted */
        ps.push(part(ovalGeo(ex, ey, ez, 0.24 * es, 0.26 * es, 0.08, 3, 7), earc));
        ps.push(part(xfG(prism([[-0.1, 0], [0.1, 0], [0, 0.5]], 0.05),
                         0, 0, -t2 * 0.4, ex, ey + 0.2 * es, ez), dk));
      }
    }

    if (o.horn === 1)                                       /* goat: up and back */
      for (i = 0; i < 2; i++) { sd = i ? 1 : -1;
        for (var k = 0; k < 5; k++) {
          a = k * 0.36;
          ps.push(part(barGeo(sd * (hx * 0.4 + Math.sin(a) * 0.16), hy * 0.86 + k * 0.22,
                              -0.1 - k * k * 0.055,
                              sd * (hx * 0.4 + Math.sin(a + 0.36) * 0.16), hy * 0.86 + (k + 1) * 0.22,
                              -0.1 - (k + 1) * (k + 1) * 0.055, 0.12 - k * 0.018), [222, 210, 184])); }
      }
    else if (o.horn === 2)                                  /* bull: out then up */
      for (i = 0; i < 2; i++) { sd = i ? 1 : -1;
        for (k = 0; k < 4; k++)
          ps.push(part(barGeo(sd * hx * (0.72 + k * 0.26), hy * (0.42 + k * k * 0.11), -0.05,
                              sd * hx * (0.72 + (k + 1) * 0.26), hy * (0.42 + (k + 1) * (k + 1) * 0.11),
                              -0.05, 0.13 - k * 0.026), [234, 228, 208])); }
    else if (o.horn === 3)                                  /* antlers */
      for (i = 0; i < 2; i++) { sd = i ? 1 : -1;
        ps.push(part(barGeo(sd * hx * 0.4, hy * 0.85, -0.1, sd * hx * 0.8, hy * 1.75, -0.25, 0.075),
                     [156, 124, 82]));
        ps.push(part(barGeo(sd * hx * 0.6, hy * 1.25, -0.16, sd * hx * 1.25, hy * 1.55, -0.28, 0.055),
                     [156, 124, 82]));
        ps.push(part(barGeo(sd * hx * 0.72, hy * 1.6, -0.22, sd * hx * 1.3, hy * 2.05, -0.3, 0.055),
                     [156, 124, 82])); }
    else if (o.horn === 5)                                  /* ossicones */
      for (i = 0; i < 2; i++) { sd = i ? 1 : -1;
        ps.push(part(cylGeo(sd * hx * 0.32, hy * 1.1, -0.1, 0.08, 0.1, 0.42, 6), fur));
        ps.push(part(ovalGeo(sd * hx * 0.32, hy * 1.34, -0.1, 0.13, 0.12, 0.13, 3, 5), dk)); }

    if (o.comb) {
      for (i = 0; i < 4; i++)
        ps.push(part(xfG(prism([[-0.12, 0], [0.12, 0], [0, 0.34]], 0.05), 0, 0, 0,
                         -0.3 + i * 0.2, hy * 1.0, 0.05), [212, 48, 44]));
      ps.push(part(boxGeo(0, hy * 0.98, 0.05, 0.34, 0.09, 0.05), [212, 48, 44]));
    }
    var passSkull = ps;

    /* --- pass two: the face on the front --------------------------- */
    ps = [];
    var mz = hx * 0.78, snout = 0.28 + o.snout * 0.85;
    if (o.muzzle) {
      ps.push(part(ovalGeo(0, -hy * 0.34, mz + snout * 0.34,
                           hx * (0.44 + o.muzzle * 0.1), hy * (0.26 + o.muzzle * 0.08),
                           snout * 0.5, 4, 9), lit));
    }
    if (o.trunk)
      for (i = 0; i < 6; i++)
        ps.push(part(ovalGeo(0, -hy * (0.28 + i * 0.3), mz + 0.34 - i * i * 0.04,
                             0.28 - i * 0.03, 0.19, 0.28 - i * 0.03, 3, 7), i % 2 ? lit : fur));
    if (o.beak === 1) {                                     /* hooked */
      ps.push(part(xfG(prism([[0, 0.3], [0.62, 0.16], [0.5, -0.34], [0.3, -0.1], [0, -0.16]], 0.11),
                       0, Math.PI / 2, 0, 0, -hy * 0.2, mz + 0.28), [236, 178, 46]));
    } else if (o.beak === 2) {                              /* duck bill */
      ps.push(part(xfG(scG(prism(discO(0.4, 10), 0.4), 1, 0.44, 1), 0.3, 0, 0,
                       0, -hy * 0.36, mz + 0.24), [230, 182, 62]));
    } else if (o.beak === 3) {                              /* short cone */
      ps.push(part(xfG(coneGeo(0, 0, 0, 0.19, 0.46, 7), Math.PI / 2, 0, 0,
                       0, -hy * 0.22, mz + 0.24), [232, 176, 58]));
    }
    if (o.tusk)
      for (i = 0; i < 2; i++) { sd = i ? 1 : -1;
        ps.push(part(xfG(coneGeo(0, 0, 0, 0.1, 0.85, 6), Math.PI, 0, sd * 0.12,
                         sd * hx * 0.3, -hy * 0.85, mz + 0.2), [240, 236, 220])); }

    /* --- markings -------------------------------------------------- */
    if (o.mark === 1)
      for (i = 0; i < 5; i++)
        ps.push(part(xfG(boxGeo(0, 0, 0, 0.06, hy * 0.4, 0.02), 0, 0, (i - 2) * 0.3,
                         (i - 2) * hx * 0.34, hy * 0.6, skin3((i - 2) * hx * 0.34, hy * 0.6) * 0.94), dk));
    else if (o.mark === 2)
      for (i = 0; i < 9; i++) {
        a = i * 2.399;
        ps.push(part(xfG(prism(discO(0.08, 6), 0.02), 0, 0, 0,
                         Math.cos(a) * hx * 0.6, Math.sin(a) * hy * 0.5 + hy * 0.2,
                         skin3(Math.cos(a) * hx * 0.6, Math.sin(a) * hy * 0.5 + hy * 0.2) * 0.96), dk));
      }
    else if (o.mark === 3 || o.mark === 4)
      for (i = 0; i < 2; i++) { sd = i ? 1 : -1;
        ps.push(part(xfG(prism(discO(o.mark === 4 ? 0.34 : 0.28, 8), 0.02), 0, 0, 0,
                         sd * hx * 0.46 * o.eyeSpread, hy * 0.2 + o.eyeY,
                         skin3(sd * hx * 0.46 * o.eyeSpread, hy * 0.2 + o.eyeY) * 0.82),
                     o.mark === 4 ? [26, 24, 26] : dk)); }
    else if (o.mark === 5)
      ps.push(part(boxGeo(0, hy * 0.4, skin3(0, hy * 0.4) * 0.95, 0.09, hy * 0.6, 0.03), belly));

    /* --- eyes ------------------------------------------------------ */
    for (i = 0; i < 2; i++) {
      sd = i ? 1 : -1;
      var px = sd * hx * 0.46 * o.eyeSpread, py = hy * 0.2 + o.eyeY;
      var r = 0.2 * o.eyeSz, pz = skin3(px, py) * 0.86;
      ps.push(part(ovalGeo(px, py, pz, r, r, r * 0.7, 4, 8), eyec));
      var gxx = px + o.gaze * r * 0.4;
      if (o.pupilType === 1)
        ps.push(part(boxGeo(gxx, py, pz + r * 0.75, r * 0.2, r * 0.72, 0.02), pup));
      else
        ps.push(part(xfG(prism(discO(r * 0.52, 7), 0.02), 0, 0, 0, gxx, py, pz + r * 0.75), pup));
      var drop = (1 - o.eyeOpen) * r * 1.9;
      ps.push(part(boxGeo(px, py + r * 1.05 - drop, pz + r * 0.4, r * 1.0, r * 0.45 + drop, r * 0.7), fur));
    }
    var passFront = ps;

    /* --- pass three: nose, mouth, whiskers ------------------------- */
    ps = [];
    var nz = mz + snout * 0.72, ny = -hy * 0.34, ns = o.noseSz;
    if (o.noseType === 1)
      ps.push(part(xfG(prism([[-0.16, 0.1], [0.16, 0.1], [0, -0.16]], 0.08), 0, 0, 0,
                       0, ny + 0.12, nz), nosec));
    else if (o.noseType === 2)                              /* pig disc */
      ps.push(part(xfG(prism(discO(0.26 * ns, 9), 0.06), 0, 0, 0, 0, ny, nz), [214, 140, 150]));
    else if (o.noseType === 3)
      ps.push(part(ovalGeo(0, ny + 0.1, nz, 0.11 * ns, 0.09 * ns, 0.08, 3, 6), [216, 140, 148]));
    else if (o.noseType === 4)
      ps.push(part(ovalGeo(0, ny + 0.06, nz - 0.04, 0.24 * ns, 0.13 * ns, 0.12, 3, 7), nosec));
    if (o.noseType === 2 || o.noseType === 4)
      for (i = 0; i < 2; i++)
        ps.push(part(ovalGeo((i ? 1 : -1) * 0.1, ny, nz + 0.05, 0.04, 0.06, 0.02, 3, 5), [40, 24, 26]));

    if (o.horn === 4) {                                     /* rhino: two, upright */
      ps.push(part(xfG(coneGeo(0, 0, 0, 0.2, 1.05, 7), -0.16, 0, 0,
                       0, ny + 0.5, nz - 0.22), [220, 212, 194]));
      ps.push(part(xfG(coneGeo(0, 0, 0, 0.14, 0.45, 6), -0.1, 0, 0,
                       0, ny + 0.86, nz - 0.62), [206, 198, 180]));
    }

    var mo = o.mouth * (0.45 + o.snout * 0.2);
    if (mo > 0.03) {
      ps.push(part(boxGeo(0, ny - 0.22 - mo * 0.5, nz - 0.2, hx * 0.28, mo * 0.6, 0.14), [58, 22, 26]));
      if (o.mouthType === 1)
        for (i = 0; i < 4; i++)
          ps.push(part(xfG(prism([[-0.05, 0.14], [0.05, 0.14], [0, -0.1]], 0.03), 0, 0,
                           i < 2 ? 0 : Math.PI, (i % 2 ? 1 : -1) * hx * 0.18,
                           ny - 0.22 + (i < 2 ? mo * 0.1 : -mo * 1.05), nz - 0.1),
                       [244, 242, 232]));
      if (o.tongue)
        ps.push(part(ovalGeo(0, ny - 0.3 - mo * 0.6, nz - 0.12, hx * 0.16, mo * 0.4, 0.1, 3, 6),
                     [214, 96, 110]));
    } else {
      ps.push(part(boxGeo(0, ny - 0.22, nz - 0.16, hx * 0.24, 0.03, 0.1), dk));
    }
    if (o.whisk)
      for (i = 0; i < 6; i++) {
        sd = i < 3 ? -1 : 1;
        ps.push(part(barGeo(sd * hx * 0.2, ny + 0.02, nz - 0.1,
                            sd * hx * 1.25, ny + 0.24 - (i % 3) * 0.22, nz - 0.5, 0.022), belly));
      }
    if (o.wattle)
      ps.push(part(ovalGeo(0, ny - 0.34, nz - 0.16, 0.1, 0.2, 0.08, 3, 6), [206, 44, 42]));

    /* turned away from us, the muzzle is behind the skull */
    var order = facingZ(0, o.gaze * 0.35, o.tilt) >= 0
      ? [passSkull, passFront, ps] : [ps, passFront, passSkull];
    for (i = 0; i < 3; i++) obj(g, mergeC(order[i]), 0, o.gaze * 0.35, o.tilt, 40, 0);
    viewM = camera;
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

  /* A fish is a lathed body with fins hung off it. The body is turned
     about its own long axis and then laid on its side, which gives a
     real tapering snout and caudal peduncle for nothing — a stack of
     boxes never looks like it swims. */
  function fishParts(o, t, ph) {
    var L = o.len / 26, D = o.dep / 26;
    var sw = Math.sin(t * 0.006 * o.wig + ph);          /* tail swish */
    var fl = Math.sin(t * 0.011 + ph);                  /* fin flutter */
    var c1 = hex2(o.c1), c2 = hex2(o.c2), c3 = hex2(o.c3), c4 = hex2(o.c4);
    var ps = [], i, a, bodyL = L, bodyD = D, m;

    /* --- body ------------------------------------------------------ */
    var prof = [[0.03, 1.0], [0.34, 0.74], [0.6, 0.34], [0.68, -0.04],
                [0.52, -0.44], [0.24, -0.76], [0.04, -1.0]];
    if (o.body === 1) { m = scG(xfG(lathe(prof, 9), 0, 0, -Math.PI / 2), L * 0.82, D * 2.1, D * 0.5); bodyD = D * 1.45; bodyL = L * 0.56; }
    else if (o.body === 2) { m = scG(xfG(lathe(prof, 9), 0, 0, -Math.PI / 2), L * 1.2, D * 0.72, D * 0.66); bodyD = D * 0.5; bodyL = L * 1.2; }
    else if (o.body === 3) { m = scG(xfG(lathe(prof, 10), 0, 0, -Math.PI / 2), L * 1.1, D * 1.2, D * 1.0); bodyD = D * 0.82; bodyL = L * 1.1; }
    else if (o.body === 4) { m = boxGeo(0, 0, 0, L * 0.72, D * 0.92, D * 0.8); bodyD = D * 0.92; bodyL = L * 0.72; }
    else if (o.body === 5) { m = ovalGeo(0, 0, 0, L * 0.82, D * 1.25, D * 1.15, 5, 10); bodyD = D * 1.25; bodyL = L * 0.82; }
    else if (o.body === 6) { m = scG(prism([[0.9, 0], [0, -1.9], [-0.8, -0.3], [-0.8, 0.3], [0, 1.9]], 0.1),
                                     L, D, D * 0.9); bodyD = D * 1.5; bodyL = L * 0.8; }
    else { m = scG(xfG(lathe(prof, 9), 0, 0, -Math.PI / 2), L, D * 1.45, D * 1.1); bodyD = D * 1.0; bodyL = L * 0.68; }
    ps.push(part(m, c1));
    /* a paler belly, so the fish has a top and a bottom */
    if (o.body !== 6)
      ps.push(part(ovalGeo(-L * 0.05, -bodyD * 0.62, 0, L * 0.62, bodyD * 0.34, bodyD * 0.5, 3, 8), c2));

    /* --- tail ------------------------------------------------------ */
    var tp;
    if (o.tail === 1) tp = [[0, 0], [-0.62, -1.15], [-0.34, 0], [-0.62, 1.15]];
    else if (o.tail === 2) tp = [[0, 0], [-0.56, -1.2], [-0.38, 0], [-0.56, 1.2]];
    else if (o.tail === 3) tp = [[0, -0.2], [-0.95, -1.15], [-1.05, 0.2], [-0.42, 0.55], [0, 0.22]];
    else if (o.tail === 4) tp = discO(0.42, 9);
    else if (o.tail === 5) tp = [[0, -0.08], [-1.15, -0.05], [-1.15, 0.05], [0, 0.08]];
    else tp = [[0, 0], [-0.58, -1.2], [-0.58, 1.2]];
    ps.push(part(xfG(scG(prism(tp, 0.05), L, bodyD * 1.05, 1), 0, sw * 0.42, 0,
                     -L * 0.9, 0, 0), c4));

    /* --- dorsal, pelvic, pectorals --------------------------------- */
    if (o.sail)
      ps.push(part(scG(prism([[-0.7, 0.5], [-0.3, 2.3 + fl * 0.2], [0.3, 2.4], [0.6, 0.5]], 0.04),
                       L, bodyD, 1), c4));
    else if (o.dorsal)
      ps.push(part(scG(prism([[-0.36, 0.72], [0, 1.5 + fl * 0.12], [0.32, 0.68]], 0.04),
                       L, bodyD, 1), c4));
    if (o.pelvic)
      ps.push(part(scG(prism([[-0.22, -0.68], [0, -1.3 + fl * 0.12], [0.24, -0.64]], 0.04),
                       L, bodyD, 1), c4));
    if (o.pect)
      for (i = 0; i < 2; i++)
        ps.push(part(xfG(scG(prism([[0.2, 0.1], [-0.5, 0.45], [-0.45, -0.3]], 0.03), L, bodyD, 1),
                         (i ? 1 : -1) * (1.0 + fl * 0.3), 0, 0,
                         L * 0.12, -bodyD * 0.2, (i ? 1 : -1) * bodyD * 0.55), c4));

    /* --- markings, both flanks ------------------------------------- */
    for (var side = 0; side < 2; side++) {
      var sz = (side ? 1 : -1) * bodyD * (o.body === 1 ? 0.42 : 0.78);
      if (o.pat === 1)
        for (i = -2; i <= 2; i++)
          ps.push(part(boxGeo(i * bodyL * 0.42, 0, sz, bodyL * 0.1,
                              bodyD * 0.92 * Math.sqrt(1 - i * i * 0.11), 0.02), c3));
      else if (o.pat === 2)
        for (i = -1; i <= 1; i++)
          ps.push(part(boxGeo(0, i * bodyD * 0.45, sz, bodyL * 0.9, bodyD * 0.09, 0.02), c3));
      else if (o.pat === 3)
        for (i = 0; i < 8; i++) {
          a = i * 2.399;
          ps.push(part(xfG(prism(discO(L * 0.09, 6), 0.02), 0, 0, 0,
                           Math.cos(a) * bodyL * 0.62, Math.sin(a) * bodyD * 0.5, sz), c3));
        }
      else if (o.pat === 4)
        for (i = 0; i < 3; i++)
          ps.push(part(boxGeo(bodyL * (0.62 - i * 0.62), 0, sz, bodyL * 0.13,
                              bodyD * 0.9 * (1 - i * 0.18), 0.02), c3));
      else if (o.pat === 5)
        ps.push(part(boxGeo(-bodyL * 0.6, 0, sz, bodyL * 0.32, bodyD * 0.72, 0.02), c3));
      else if (o.pat === 6)
        ps.push(part(xfG(prism([[-0.4, 0.5], [0.3, 0.2], [-0.1, -0.5]], 0.02), 0, 0, 0,
                         0, 0, sz), c3));
      else if (o.pat === 7)
        for (i = 0; i < 5; i++)
          ps.push(part(boxGeo(-bodyL * 0.75 + i * bodyL * 0.38, bodyD * 0.3, sz,
                              bodyL * 0.16, bodyD * 0.1, 0.02), c3));
    }

    /* --- head furniture -------------------------------------------- */
    if (o.bill)
      ps.push(part(xfG(coneGeo(0, 0, 0, D * 0.14, L * 1.1, 6), 0, 0, -Math.PI / 2,
                       L * 1.5, 0, 0), c4));
    if (o.barbel)
      for (i = 0; i < 2; i++)
        ps.push(part(barGeo(L * 0.72, -bodyD * 0.3, (i ? 1 : -1) * bodyD * 0.3,
                            L * 0.5, -bodyD * 1.3, (i ? 1 : -1) * bodyD * 0.7, 0.025), c4));
    if (o.lure) {
      ps.push(part(barGeo(L * 0.5, bodyD * 0.8, 0, L * 0.95, bodyD * 1.9, 0, 0.03), c4));
      ps.push(part(ovalGeo(L * 1.0, bodyD * 2.0, 0, 0.13, 0.13, 0.13, 3, 6), [250, 240, 170]));
    }
    if (o.spine)
      for (i = 0; i < 7; i++)
        ps.push(part(barGeo(0, 0, 0, Math.cos(i * 0.9) * L * 1.3, Math.sin(i * 0.9) * bodyD * 1.7,
                            0, 0.03), c4));
    if (o.teeth)
      for (i = 0; i < 4; i++)
        ps.push(part(xfG(prism([[-0.04, 0], [0.04, 0], [0, -0.16]], 0.02), 0, 0, i < 2 ? 0 : Math.PI,
                         L * (0.62 + (i % 2) * 0.12), -bodyD * 0.16, (i < 2 ? 1 : -1) * bodyD * 0.5),
                     [245, 244, 236]));
    for (i = 0; i < 2; i++) {
      var ez = (i ? 1 : -1) * bodyD * (o.body === 1 ? 0.44 : 0.7);
      ps.push(part(ovalGeo(L * 0.6, bodyD * 0.28, ez, D * 0.2, D * 0.2, D * 0.12, 3, 7), hex2(o.eye)));
      ps.push(part(ovalGeo(L * 0.62, bodyD * 0.28, ez * 1.15, D * 0.1, D * 0.1, D * 0.06, 3, 6), hex2(o.pupil)));
    }
    return ps;
  }

  /* Three of the species crossing the tube at three depths, over water
     that is itself a plane in the scene rather than a wash on the
     glass. */
  function drawFishScene(g, o, t) {
    g.shadowColor = 'transparent';
    g.shadowBlur = 0;

    g.globalAlpha = 0.24;
    obj(g, mergeC([part(boxGeo(0, 0, -4, 16, 12, 0.1), [22, 92, 132])]), 0, 0, 0, 40, 0);
    var ps = [], i;
    for (i = 0; i < 5; i++)
      ps.push(part(boxGeo(0, 1.6 - ((t * 0.0006 + i * 0.2) % 1) * 3.4, -3.5, 12, 0.05, 0.05),
                   [110, 220, 240]));
    obj(g, mergeC(ps), 0, 0, 0, 40, 0);
    g.globalAlpha = 1;

    ps = [];
    for (i = 0; i < 9; i++) {                            /* bubbles rising */
      var bx = (i * 37 % 150) / 30 - 2.5;
      var by = ((t * 0.0009 + i * 0.11) % 1) * 3.4 - 1.7;
      ps.push(part(ovalGeo(bx + Math.sin(by * 3 + i) * 0.08, by, -1.5 - (i % 3),
                           0.06 + (i % 3) * 0.02, 0.06 + (i % 3) * 0.02,
                           0.06 + (i % 3) * 0.02, 3, 6), [214, 246, 252]));
    }
    obj(g, mergeC(ps), 0, 0, 0, 40, 0);

    /* Three lanes: far, middle and near. The camera is long enough that
       perspective alone barely shrinks anything at this size, so depth
       is carried by scale as well as by z. */
    var lanes = [[0.68, -2.6, 0.38, 1.5], [-0.7, -0.6, 0.58, 0.9], [0.02, 1.2, 0.82, 0.58]];
    var seq = [0, 1, 2];
    if (viewM) seq.sort(function (a, b) {         /* far lane first, still */
      return toEye([0, lanes[a][0], lanes[a][1]])[2] - toEye([0, lanes[b][0], lanes[b][1]])[2];
    });
    for (var q = 0; q < 3; q++) {
      i = seq[q];
      var ln = lanes[i], k;
      var x = (((t * 0.00046 * o.speed * ln[3] + i * 0.37) % 1) - 0.5) * 6.4;
      var y = ln[0] + Math.sin(t * 0.002 + i * 2) * 0.16;
      var pp = fishParts(o, t, i * 1.7);
      for (k = 0; k < pp.length; k++) {
        var q = scG(pp[k], ln[2], ln[2], ln[2]);
        q = xfG(q, 0, o.dir < 0 ? Math.PI : 0, Math.sin(t * 0.003 + i) * 0.09);
        pp[k] = { V: xfG(q, 0, 0, 0, o.dir < 0 ? -x : x, y, ln[1]).V, F: pp[k].F, c: pp[k].c };
      }
      obj(g, mergeC(pp), 0, 0, 0, 40, 0);
    }
  }

  /* First 25 swim left to right, last 25 right to left. */
  /* One fish. There were fifty of them; through a 160x120 tube they
     had started to feel like a category rather than a channel. */
  var FISH = [
    ['Clownfish',    { c1:'#ff7a1e', c2:'#ffb96e', c3:'#fdf6ea', c4:'#1c1c22', pat:4, tail:4, len:28, dep:17 }]
  ];

  /* ================================================================
     OPTICAL ILLUSIONS — a hundred of them.

     Most of these only work from one angle, which is the whole joke:
     the cursor turns the picture, so moving it takes the trick apart
     and shows you the join. They are therefore built to sit still and
     let the viewer do the moving, rather than turning on their own.
     ================================================================ */

  /* A rectangular field laid out like a floor, one cell at a time.
     fn returns [centreY, halfHeight, colour] for each cell, or nothing
     to leave a gap — which between them is most of what a moving
     pattern is. */
  function fieldOf(nx, nz, sp, fn) {
    var ps = [], i, j;
    for (j = 0; j < nz; j++) for (i = 0; i < nx; i++) {
      var x = (i - (nx - 1) / 2) * sp, z = (j - (nz - 1) / 2) * sp;
      var c = fn(i, j, x, z);
      if (c) ps.push(part(boxGeo(x, c[0], z, sp * 0.42, c[1], sp * 0.42), c[2]));
    }
    return ps;
  }

  /* the same, but the cell decides its own footprint and shape */
  function fieldAt(nx, nz, sp, fn) {
    var ps = [], i, j;
    for (j = 0; j < nz; j++) for (i = 0; i < nx; i++) {
      var x = (i - (nx - 1) / 2) * sp, z = (j - (nz - 1) / 2) * sp;
      var c = fn(i, j, x, z);
      if (c) ps = ps.concat(c);
    }
    return ps;
  }

  /* a slab of tiles, which half the classics are made of */
  function tiles(nx, ny, w, h, d, gap, fn) {
    var ps = [], i, j;
    for (j = 0; j < ny; j++) for (i = 0; i < nx; i++) {
      var c = fn(i, j);
      if (!c) continue;
      ps.push(part(boxGeo((i - (nx - 1) / 2) * (w + gap), ((ny - 1) / 2 - j) * (h + gap),
                          c[3] || 0, w / 2, h / 2, d), c));
    }
    return ps;
  }

  var ILL = [
    ['Penrose stairs', function (g, t) {
      var m = geo('pstairs', function () {
        var ps = [], i, k, side;
        for (side = 0; side < 4; side++) {
          for (k = 0; k < 4; k++) {
            var n = side * 4 + k, f = n / 16;
            var a = side * TAU / 4;
            var along = (k / 4 - 0.5) * 1.7;
            var x = Math.cos(a) * 1.25 - Math.sin(a) * along;
            var z = Math.sin(a) * 1.25 + Math.cos(a) * along;
            ps.push(part(boxGeo(x, -0.9 + f * 1.5, z, 0.3, 0.1 + f * 0.02, 0.3),
                         [206 - side * 18, 196 - side * 14, 178]));
            ps.push(part(boxGeo(x, -1.3 + f * 0.75, z, 0.28, 0.4 + f * 0.38, 0.28),
                         [150 - side * 12, 142 - side * 10, 128]));
          }
        }
        return mergeC(ps);
      });
      obj(g, m, 0.62, 0.78, 0, 26, 1); }],

    ['Impossible cube', function (g, t) {
      var m = geo('impcube', function () {
        var V = [], E = [], x, y, z;
        for (x = -1; x <= 1; x += 2) for (y = -1; y <= 1; y += 2) for (z = -1; z <= 1; z += 2)
          V.push([x, y, z]);
        var pairs = [[0,1],[0,2],[0,4],[3,1],[3,2],[3,7],[5,1],[5,4],[5,7],[6,2],[6,4],[6,7]];
        for (var i = 0; i < pairs.length; i++) E.push(pairs[i]);
        return { V: V, E: E };
      });
      /* the near bar is drawn last, so it reads as passing behind */
      wire(g, xform(m.V, 0.42, 0.72, 0), m.E, 30, '240,200,110', 3.4);
      wire(g, xform([[1, -1, -1], [1, 1, -1]], 0.42, 0.72, 0), [[0, 1]], 30, '240,200,110', 3.4); }],

    ["Devil's fork", function (g, t) {
      var m = geo('fork', function () {
        var ps = [], i;
        for (i = 0; i < 3; i++)                         /* three round prongs */
          ps.push(part(cylGeo(-0.4, (i - 1) * 0.62, 0, 0.16, 0.16, 2.0, 8, 'x'),
                       [214, 196, 150]));
        ps.push(part(boxGeo(-1.55, 0, 0, 0.45, 0.95, 0.2), [190, 172, 128]));
        for (i = 0; i < 2; i++)                         /* but only two flat ones */
          ps.push(part(boxGeo(0.7, (i - 0.5) * 0.62, 0, 1.1, 0.16, 0.16), [214, 196, 150]));
        return mergeC(ps);
      });
      obj(g, m, 0, 0, 0, 30, 1); }],

    ['Blivet', function (g, t) {
      var m = geo('blivet', function () {
        var ps = [part(boxGeo(-0.9, 0, 0, 0.7, 0.9, 0.18), [186, 150, 210])], i;
        for (i = 0; i < 2; i++)
          ps.push(part(boxGeo(0.8, (i - 0.5) * 1.1, 0, 1.0, 0.2, 0.18), [206, 176, 230]));
        for (i = 0; i < 3; i++)
          ps.push(part(cylGeo(-1.4, (i - 1) * 0.6, 0, 0.13, 0.13, 1.1, 8, 'x'), [166, 130, 196]));
        return mergeC(ps);
      });
      obj(g, m, 0, 0, 0, 30, 1); }],

    ['Freemish crate', function (g, t) {
      var m = geo('crate', function () {
        var ps = [], i, e;
        var c = [[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]];
        var ed = [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];
        for (i = 0; i < ed.length; i++) {
          e = ed[i];
          ps.push(part(barGeo(c[e[0]][0] * 1.15, c[e[0]][1] * 1.15, c[e[0]][2] * 1.15,
                              c[e[1]][0] * 1.15, c[e[1]][1] * 1.15, c[e[1]][2] * 1.15, 0.11),
                       [176, 132, 78]));
        }
        return mergeC(ps);
      });
      obj(g, m, 0.42, 0.68, 0, 26, 1); }],

    ['Impossible arch', function (g, t) {
      var m = geo('imparch', function () {
        var ps = [part(boxGeo(-1.1, -0.5, 0, 0.24, 1.0, 0.24), [200, 192, 176]),
                  part(boxGeo(1.1, -0.5, 0.9, 0.24, 1.0, 0.24), [176, 168, 152])], i;
        for (i = 0; i < 9; i++) {
          var a = Math.PI * (i / 8);
          ps.push(part(boxGeo(-Math.cos(a) * 1.1, 0.5 + Math.sin(a) * 0.8, i / 8 * 0.9,
                              0.2, 0.2, 0.2), [208 - i * 4, 200 - i * 4, 184]));
        }
        return mergeC(ps);
      });
      obj(g, m, 0.1, 0, 0, 28, 1); }],

    ['Endless staircase', function (g, t) {
      var m = geo('endless', function () {
        var ps = [], side, k, n = 0;
        for (side = 0; side < 4; side++) for (k = 0; k < 5; k++, n++) {
          var f = k / 5;
          var e = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
          var A = e[side], B = e[(side + 1) % 4];
          var x = (A[0] + (B[0] - A[0]) * f) * 1.25;
          var z = (A[1] + (B[1] - A[1]) * f) * 1.25;
          var y = -0.75 + (n % 20) * 0.075;
          ps.push(part(boxGeo(x, y, z, 0.32, 0.055, 0.32), [214 - side * 16, 206, 222]));
          ps.push(part(boxGeo(x, y - 0.18, z, 0.29, 0.13, 0.29), [150 - side * 10, 146, 162]));
        }
        return mergeC(ps);
      });
      obj(g, m, 0.72, 0.3, 0, 28, 1); }],

    ['Reutersvard triangle', function (g, t) {
      var m = geo('reuters', function () {
        var ps = [], i, k, R = 1.35, V = [];
        for (i = 0; i < 3; i++) {
          var a = i * TAU / 3 - Math.PI / 2;
          V.push([Math.cos(a) * R, Math.sin(a) * R]);
        }
        /* each arm walks from one corner to the next, stepping in depth
           as it goes — which is the join the eye refuses to accept */
        for (i = 0; i < 3; i++) {
          var A = V[i], B = V[(i + 1) % 3];
          for (k = 0; k < 4; k++) {
            var f = k / 4;
            ps.push(part(boxGeo(A[0] + (B[0] - A[0]) * f, A[1] + (B[1] - A[1]) * f,
                                (i - 1) * 0.34, 0.22, 0.22, 0.22),
                         [[230, 120, 110], [120, 200, 230], [230, 210, 120]][i]));
          }
        }
        return mergeC(ps);
      });
      obj(g, m, 0, 0, 0, 28, 1); }],

    ['Impossible shelf', function (g, t) {
      var m = geo('impshelf', function () { return mergeC([
        part(boxGeo(0, 0.7, 0, 1.5, 0.1, 0.5), [200, 168, 120]),
        part(boxGeo(0, -0.7, 0, 1.5, 0.1, 0.5), [200, 168, 120]),
        part(boxGeo(-1.35, 0, -0.4, 0.12, 0.7, 0.12), [160, 130, 90]),
        part(boxGeo(1.35, 0, 0.4, 0.12, 0.7, 0.12), [160, 130, 90]),
        part(boxGeo(0, 0, -0.4, 0.12, 0.7, 0.12), [176, 144, 100])
      ]); });
      obj(g, m, 0.16, 0.1, 0, 30, 1); }],

    ['Escher waterfall', function (g, t) {
      /* the channel runs downhill all the way round the square and
         still arrives above where it set off */
      var ps = [], i, k;
      var e = [[-1.25, 0.85], [1.25, 0.85], [1.25, -0.85], [-1.25, -0.85]];
      for (i = 0; i < 4; i++) {
        var A = e[i], B = e[(i + 1) % 4];
        for (k = 0; k < 6; k++) {
          var f = k / 6, n = i * 6 + k;
          var x = A[0] + (B[0] - A[0]) * f, y = A[1] + (B[1] - A[1]) * f;
          ps.push(part(boxGeo(x, y - 0.12 - n * 0.028, (i - 1.5) * 0.34,
                              0.19, 0.1, 0.24), [150, 146, 142]));
          ps.push(part(boxGeo(x, y - 0.02 - n * 0.028, (i - 1.5) * 0.34,
                              0.14, 0.035, 0.18), [120, 198, 234]));
        }
      }
      /* and falls back to the top to do it again */
      for (i = 0; i < 8; i++)
        ps.push(part(ovalGeo(-1.25, 0.7 - ((t * 0.0018 + i * 0.125) % 1) * 1.55, -0.5,
                             0.11, 0.15, 0.11), [136, 206, 238]));
      ps.push(part(boxGeo(-1.25, -1.0, -0.5, 0.34, 0.1, 0.34), [110, 180, 215]));
      ps.push(part(boxGeo(-1.25, -1.35, -0.5, 0.13, 0.3, 0.13), [140, 134, 128]));
      obj(g, mergeC(ps), 0.22, 0, 0, 28, 1); }],

    ['Impossible ring', function (g, t) {
      var m = geo('impring', function () {
        var ps = [], i;
        for (i = 0; i < 20; i++) {
          var a = i / 20 * TAU;
          var sq = i < 10 ? 0.24 : 0.1;                  /* half round, half flat */
          ps.push(part(boxGeo(Math.cos(a) * 1.3, Math.sin(a) * 1.3, 0,
                              sq, sq, i < 10 ? 0.1 : 0.24),
                       [220 - i * 3, 190, 150 + i * 3]));
        }
        return mergeC(ps);
      });
      obj(g, m, 0.2, 0, 0, 28, 1); }],

    ['Impossible column', function (g, t) {
      var m = geo('impcol', function () {
        var ps = [], i;
        for (i = 0; i < 3; i++)
          ps.push(part(boxGeo((i - 1) * 0.7, 0.6, 0, 0.2, 0.9, 0.2), [206, 198, 182]));
        for (i = 0; i < 2; i++)
          ps.push(part(boxGeo((i - 0.5) * 1.4, -0.9, 0, 0.2, 0.9, 0.2), [186, 178, 162]));
        ps.push(part(boxGeo(0, -0.05, 0, 1.35, 0.16, 0.3), [166, 158, 142]));
        return mergeC(ps);
      });
      obj(g, m, 0, 0, 0, 30, 1); }],

    ['Impossible knot', function (g, t) {
      var m = geo('impknot', function () {
        var ps = [], i, n = 44, P = [];
        for (i = 0; i <= n; i++) {                  /* a trefoil, drawn as tube */
          var u = i / n * TAU;
          P.push([(Math.sin(u) + 2 * Math.sin(2 * u)) * 0.42,
                  (Math.cos(u) - 2 * Math.cos(2 * u)) * 0.42,
                  -Math.sin(3 * u) * 0.55]);
        }
        for (i = 0; i < n; i++)
          ps.push(part(barGeo(P[i][0], P[i][1], P[i][2],
                              P[i + 1][0], P[i + 1][1], P[i + 1][2], 0.15),
                       [206, 128 + (i % 3) * 36, 224]));
        return mergeC(ps);
      });
      obj(g, m, 0.3, 0.4, 0, 28, 1); }],

    ['Necker cube', function (g, t) {
      var c = geo('cub', gCube);
      wire(g, xform(c.V, 0.42, 0.72, 0), c.E, 32, '150,240,255', 2.6); }],

    ['Necker lattice', function (g, t) {
      var m = geo('necklat', function () {
        var V = [], E = [], i, j, k, idx = {};
        for (i = 0; i < 3; i++) for (j = 0; j < 3; j++) for (k = 0; k < 2; k++) {
          idx[i + ',' + j + ',' + k] = V.length;
          V.push([(i - 1) * 1.0, (j - 1) * 1.0, (k - 0.5) * 1.0]);
        }
        for (i = 0; i < 3; i++) for (j = 0; j < 3; j++) for (k = 0; k < 2; k++) {
          if (i < 2) E.push([idx[i+','+j+','+k], idx[(i+1)+','+j+','+k]]);
          if (j < 2) E.push([idx[i+','+j+','+k], idx[i+','+(j+1)+','+k]]);
          if (k < 1) E.push([idx[i+','+j+','+k], idx[i+','+j+','+(k+1)]]);
        }
        return { V: V, E: E };
      });
      wire(g, xform(m.V, 0.38, 0.66, 0), m.E, 26, '180,220,255', 1.8); }],

    ['Schroeder stairs', function (g, t) {
      var m = geo('schroeder', function () {
        var ps = [], i;
        for (i = 0; i < 6; i++) {
          ps.push(part(boxGeo(-1.3 + i * 0.5, 1.0 - i * 0.4, 0, 0.25, 0.06, 0.6),
                       [216, 210, 196]));
          ps.push(part(boxGeo(-1.05 + i * 0.5, 0.8 - i * 0.4, 0, 0.06, 0.22, 0.6),
                       [162, 156, 144]));
        }
        return mergeC(ps);
      });
      obj(g, m, 0, 0, 0, 28, 1); }],

    ['Rubin vase', function (g, t) {
      /* the profile is the silhouette of the vase: both readings are
         the same geometry, which is the point */
      var m = geo('rubin', function () {
        return mergeC([part(lathe([[0.05, 1.15], [0.42, 1.0], [0.3, 0.65], [0.5, 0.2],
                                   [0.66, -0.2], [0.5, -0.7], [0.62, -1.0],
                                   [0.05, -1.15]], 16), [232, 224, 206])]);
      });
      obj(g, m, 0, 0, 0, 34, 0);
      g.globalAlpha = 0.5;
      obj(g, mergeC([part(boxGeo(0, 0, -1.4, 2.6, 1.7, 0.05), [40, 38, 52])]), 0, 0, 0, 34, 0);
      g.globalAlpha = 1; }],

    ['Thiery figure', function (g, t) {
      var m = geo('thiery', function () {
        var ps = [], i, k;
        /* two boxes meeting along one shared edge: read either as
           stacked or as folded away, and they swap as you look */
        for (i = 0; i < 2; i++) {
          var sd = i ? 1 : -1;
          var ox = sd * 0.62, oy = sd * 0.52;
          var top = [[0, 0], [0.78, 0.42], [0, 0.84], [-0.78, 0.42]];
          ps.push(part(xfG(prism(top, 0.02), 0, 0, 0, ox, oy + 0.36, 0.1), [222, 218, 208]));
          for (k = 0; k < 2; k++)
            ps.push(part(xfG(prism([[0, 0], [0.78, 0.42], [0.78, -0.42], [0, -0.84]], 0.02),
                             0, 0, k ? Math.PI : 0, ox, oy - 0.34, 0.08),
                         k ? [140, 136, 128] : [180, 176, 166]));
        }
        return mergeC(ps);
      });
      obj(g, m, 0, 0, 0, 28, 1); }],

    ['Ambiguous cylinder', function (g, t) {
      /* square from one side, round from the other: the top edge is a
         wave that reads as both */
      var m = geo('ambicyl', function () {
        var ps = [], i, n = 24;
        for (i = 0; i < n; i++) {
          var a = i / n * TAU;
          var x = Math.cos(a) * 0.9, z = Math.sin(a) * 0.9;
          var top = 0.55 + Math.cos(a * 2) * 0.32;
          ps.push(part(boxGeo(x, top / 2 - 0.6, z, 0.13, top / 2 + 0.6, 0.13),
                       [190, 205, 225]));
        }
        return mergeC(ps);
      });
      obj(g, m, 0.32, 0, 0, 30, 0); }],

    ['Hollow mask', function (g, t) {
      var m = geo('hollow', function () {
        var ps = [part(scG(lathe([[0.05, 1.0], [0.55, 0.85], [0.8, 0.3], [0.76, -0.3],
                                  [0.45, -0.9], [0.05, -1.05]], 14), 1, 1, 0.5),
                       [210, 186, 158])], i;
        for (i = 0; i < 2; i++) {
          var sd = i ? 1 : -1;
          ps.push(part(ovalGeo(sd * 0.3, 0.2, 0.3, 0.16, 0.12, 0.16, 3, 7), [90, 78, 70]));
        }
        ps.push(part(ovalGeo(0, -0.15, 0.38, 0.1, 0.2, 0.12, 3, 6), [176, 152, 128]));
        ps.push(part(boxGeo(0, -0.6, 0.3, 0.26, 0.05, 0.1), [120, 92, 84]));
        return mergeC(ps);
      });
      /* concave, so the lighting argues with the shape */
      obj(g, m, 0, Math.sin(t * 0.0008) * 0.3, 0, 32, 0); }],

    ['Crater or dome', function (g, t) {
      var ps = [], i, j;
      for (j = 0; j < 3; j++) for (i = 0; i < 4; i++) {
        var up = (i + j) % 2;
        var x = (i - 1.5) * 0.95, y = (1 - j) * 0.95;
        var k;
        for (k = 0; k < 5; k++) {
          var f = k / 5;
          ps.push(part(ovalGeo(x, y + (up ? 1 : -1) * f * 0.16, 0,
                               0.4 - f * 0.07, 0.4 - f * 0.07, 0.06, 3, 9),
                       [110 + f * 120, 106 + f * 116, 100 + f * 110]));
        }
      }
      obj(g, mergeC(ps), 0, 0, 0, 28, 0); }],

    ['Corner reversal', function (g, t) {
      var m = geo('corner', function () { return mergeC([
        part(boxGeo(-0.75, 0, 0, 0.75, 1.2, 0.06), [172, 168, 160]),
        part(xfG(boxGeo(0, 0, 0, 0.75, 1.2, 0.06), 0, Math.PI / 2, 0, 0, 0, -0.75),
             [126, 122, 116]),
        part(boxGeo(-0.05, -1.16, -0.75, 0.75, 0.06, 0.75), [202, 198, 190])
      ]); });
      obj(g, m, 0.24, 0.5, 0, 30, 0); }],

    ['Cube stack', function (g, t) {
      var m = geo('cstack', function () {
        var ps = [], i, spots = [[0,0],[1,0],[0,1],[-1,0],[0,-1],[1,1]];
        for (i = 0; i < spots.length; i++) {
          var q = spots[i], x = (q[0] - q[1]) * 0.78, y = (q[0] + q[1]) * 0.45;
          ps.push(part(xfG(prism(discO(0.45, 6, 0), 0.02), 0, 0, 0, x, y, 0.1), [226, 214, 190]));
          ps.push(part(xfG(prism([[0, 0], [0.39, 0.225], [0.39, -0.225], [0, -0.45]], 0.02),
                           0, 0, 0, x, y, 0.12), [170, 158, 138]));
          ps.push(part(xfG(prism([[0, 0], [-0.39, 0.225], [-0.39, -0.225], [0, -0.45]], 0.02),
                           0, 0, 0, x, y, 0.12), [120, 110, 96]));
        }
        return mergeC(ps);
      });
      obj(g, m, 0, 0, 0, 26, 0); }],

    ['Duck or rabbit', function (g, t) {
      var m = geo('duckrab', function () {
        /* the two prongs on the left are a bill from one side and a
           pair of ears from the other; the head is the same head */
        return mergeC([part(prism([[-1.55, 0.34], [-0.55, 0.3], [-0.5, 0.12],
                                   [-1.5, -0.06], [-0.55, -0.1], [-0.2, -0.34],
                                   [0.45, -0.5], [1.0, -0.32], [1.3, 0.1],
                                   [1.05, 0.5], [0.4, 0.66], [-0.25, 0.56]], 0.2),
                            [228, 222, 208])]);
      });
      obj(g, m, 0, 0, 0, 30, 1);
      obj(g, mergeC([part(ovalGeo(0.72, 0.22, 0.22, 0.1, 0.1, 0.06, 3, 6), [30, 28, 34])]),
          0, 0, 0, 30, 0); }],

    ['Silhouette spin', function (g, t) {
      /* no shading and no depth cue, so which way it turns is yours */
      var a = t * 0.0016;
      var ps = [], i;
      ps.push(part(ovalGeo(Math.sin(a) * 0.12, 0.95, Math.cos(a) * 0.12, 0.22, 0.26, 0.22, 4, 8),
                   [18, 16, 22]));
      ps.push(part(scG(lathe([[0.05, 0.7], [0.3, 0.4], [0.24, -0.3], [0.34, -0.7],
                              [0.05, -0.8]], 10), 1, 1, 1), [18, 16, 22]));
      for (i = 0; i < 2; i++) {
        var sd = i ? 1 : -1;
        ps.push(part(barGeo(sd * 0.22, 0.5, 0, Math.sin(a + sd) * 0.9, 0.2, Math.cos(a + sd) * 0.9,
                            0.08), [18, 16, 22]));
        ps.push(part(barGeo(sd * 0.14, -0.75, 0, sd * 0.2, -1.6, Math.cos(a) * 0.3, 0.1),
                     [18, 16, 22]));
      }
      obj(g, mergeC(ps), 0, a, 0, 30, 0); }],
    ['Muller-Lyer', function (g, t) {
      var m = geo('mueller', function () {
        var ps = [], i, k;
        for (i = 0; i < 2; i++) {
          var y = i ? -0.6 : 0.6, out = i ? 1 : -1;
          ps.push(part(boxGeo(0, y, 0, 1.15, 0.08, 0.12), [226, 220, 206]));
          for (k = 0; k < 4; k++) {
            var sx = k < 2 ? -1.15 : 1.15, sy = k % 2 ? 1 : -1;
            ps.push(part(xfG(boxGeo(0, 0, 0, 0.38, 0.07, 0.1), 0, 0,
                             sy * 0.7 * (k < 2 ? 1 : -1) * out,
                             sx + (k < 2 ? 1 : -1) * out * 0.3, y + sy * 0.22, 0),
                         [206, 176, 120]));
          }
        }
        return mergeC(ps);
      });
      obj(g, m, 0, 0, 0, 32, 0); }],

    ['Ponzo lines', function (g, t) {
      var m = geo('ponzo', function () {
        var ps = [], i;
        for (i = 0; i < 2; i++)                         /* converging rails */
          ps.push(part(xfG(boxGeo(0, 0, 0, 0.06, 1.5, 0.06), 0, 0, (i ? -1 : 1) * 0.34,
                           (i ? 1 : -1) * 0.75, 0, 0), [178, 174, 166]));
        ps.push(part(boxGeo(0, 0.78, 0.1, 0.55, 0.09, 0.1), [232, 196, 110]));
        ps.push(part(boxGeo(0, -0.78, 0.1, 0.55, 0.09, 0.1), [232, 196, 110]));
        return mergeC(ps);
      });
      obj(g, m, 0, 0, 0, 32, 0); }],

    ['Ebbinghaus circles', function (g, t) {
      var m = geo('ebbing', function () {
        var ps = [], i;
        ps.push(part(xfG(prism(discO(0.32, 12), 0.07), 0, 0, 0, -0.95, 0, 0.1), [232, 140, 90]));
        ps.push(part(xfG(prism(discO(0.32, 12), 0.07), 0, 0, 0, 0.95, 0, 0.1), [232, 140, 90]));
        for (i = 0; i < 6; i++) {                       /* big neighbours */
          var a = i * TAU / 6;
          ps.push(part(xfG(prism(discO(0.34, 11), 0.06), 0, 0, 0,
                           -0.95 + Math.cos(a) * 0.78, Math.sin(a) * 0.78, 0), [140, 150, 174]));
        }
        for (i = 0; i < 8; i++) {                       /* small ones */
          var b = i * TAU / 8;
          ps.push(part(xfG(prism(discO(0.12, 9), 0.06), 0, 0, 0,
                           0.95 + Math.cos(b) * 0.6, Math.sin(b) * 0.6, 0), [140, 150, 174]));
        }
        return mergeC(ps);
      });
      obj(g, m, 0, 0, 0, 30, 0); }],

    ['Delboeuf rings', function (g, t) {
      var m = geo('delboeuf', function () { return mergeC([
        part(xfG(prism(ringO(0.52, 0.06, 16), 0.05), 0, 0, 0, -0.9, 0, 0), [150, 160, 182]),
        part(xfG(prism(discO(0.34, 12), 0.07), 0, 0, 0, -0.9, 0, 0.08), [230, 150, 90]),
        part(xfG(prism(ringO(1.05, 0.06, 20), 0.05), 0, 0, 0, 0.95, 0, 0), [150, 160, 182]),
        part(xfG(prism(discO(0.34, 12), 0.07), 0, 0, 0, 0.95, 0, 0.08), [230, 150, 90])
      ]); });
      obj(g, m, 0, 0, 0, 28, 0); }],

    ['Jastrow blocks', function (g, t) {
      var m = geo('jastrow', function () {
        var ps = [], i;
        for (i = 0; i < 2; i++) {
          var y = i ? -0.55 : 0.5;
          var arc = [];
          for (var k = 0; k <= 10; k++) {
            var a = -0.5 + k / 10;
            arc.push([Math.sin(a) * 1.5, Math.cos(a) * 1.5 - 1.5 + 0.42]);
          }
          for (k = 10; k >= 0; k--) {
            var b = -0.5 + k / 10;
            arc.push([Math.sin(b) * 1.12, Math.cos(b) * 1.12 - 1.5 + 0.42]);
          }
          ps.push(part(xfG(prism(arc, 0.1), 0, 0, 0, 0, y, 0),
                       i ? [220, 150, 90] : [130, 180, 210]));
        }
        return mergeC(ps);
      });
      obj(g, m, 0, 0, 0, 30, 0); }],

    ['Shepard tables', function (g, t) {
      var m = geo('shepard', function () {
        var ps = [], i;
        var a = [[-1.6, 0.5], [-0.2, 0.95], [0.1, 0.2], [-1.3, -0.25]];
        var b = [[0.3, 0.6], [1.6, 0.3], [1.3, -0.6], [0.0, -0.3]];
        ps.push(part(prism(a, 0.05), [200, 168, 120]));
        ps.push(part(prism(b, 0.05), [200, 168, 120]));
        for (i = 0; i < 3; i++) {
          ps.push(part(boxGeo(a[i][0] + 0.1, a[i][1] - 0.45, 0, 0.06, 0.4, 0.06), [140, 112, 76]));
          ps.push(part(boxGeo(b[i][0] - 0.1, b[i][1] - 0.45, 0, 0.06, 0.4, 0.06), [140, 112, 76]));
        }
        return mergeC(ps);
      });
      obj(g, m, 0, 0, 0, 30, 0); }],

    ['Sander parallelogram', function (g, t) {
      var m = geo('sander', function () { return mergeC([
        part(prism([[-1.6, -0.5], [0.2, -0.5], [1.0, 0.6], [-0.8, 0.6]], 0.04), [120, 150, 190]),
        part(prism([[-1.6, -0.5], [0.2, -0.5], [-0.78, 0.58], [-0.82, 0.62]], 0.06), [240, 220, 120]),
        part(prism([[0.2, -0.5], [1.0, 0.6], [0.96, 0.62], [0.16, -0.46]], 0.06), [240, 220, 120])
      ]); });
      obj(g, m, 0, 0, 0, 30, 0); }],

    ['Vertical horizontal', function (g, t) {
      var m = geo('vhoriz', function () { return mergeC([
        part(boxGeo(0, -0.7, 0, 0.9, 0.07, 0.1), [226, 218, 200]),
        part(boxGeo(0, 0.2, 0, 0.07, 0.9, 0.1), [226, 218, 200])
      ]); });
      obj(g, m, 0, 0, 0, 34, 0); }],

    ['Oppel-Kundt', function (g, t) {
      var m = geo('oppel', function () {
        var ps = [part(boxGeo(0, -0.7, 0, 1.7, 0.05, 0.08), [210, 204, 190])], i;
        for (i = 0; i <= 10; i++)                        /* filled half */
          ps.push(part(boxGeo(-1.7 + i * 0.17, -0.45, 0, 0.035, 0.25, 0.08), [230, 210, 150]));
        ps.push(part(boxGeo(-1.7, -0.1, 0, 0.05, 0.35, 0.08), [240, 180, 120]));
        ps.push(part(boxGeo(0, -0.1, 0, 0.05, 0.35, 0.08), [240, 180, 120]));
        ps.push(part(boxGeo(1.7, -0.1, 0, 0.05, 0.35, 0.08), [240, 180, 120]));
        return mergeC(ps);
      });
      obj(g, m, 0, 0, 0, 26, 0); }],

    ['Baldwin illusion', function (g, t) {
      var m = geo('baldwin', function () { return mergeC([
        part(boxGeo(0, 0.55, 0, 1.0, 0.05, 0.08), [232, 226, 210]),
        part(boxGeo(-1.0, 0.55, 0, 0.16, 0.16, 0.16), [140, 156, 186]),
        part(boxGeo(1.0, 0.55, 0, 0.16, 0.16, 0.16), [140, 156, 186]),
        part(boxGeo(0, -0.55, 0, 1.0, 0.05, 0.08), [232, 226, 210]),
        part(boxGeo(-1.0, -0.55, 0, 0.5, 0.5, 0.5), [140, 156, 186]),
        part(boxGeo(1.0, -0.55, 0, 0.5, 0.5, 0.5), [140, 156, 186])
      ]); });
      obj(g, m, 0, 0, 0, 28, 1); }],

    ['Moon illusion', function (g, t) {
      var ps = [], i;
      ps.push(part(boxGeo(0, -1.05, -1.2, 3.0, 0.5, 0.1), [40, 52, 62]));
      for (i = 0; i < 6; i++)                            /* rooftops for scale */
        ps.push(part(boxGeo(-2.2 + i * 0.85, -0.7 + (i % 3) * 0.16, -1.0,
                            0.26, 0.36, 0.1), [52, 60, 74]));
      ps.push(part(ovalGeo(-1.15, -0.35, -0.9, 0.62, 0.62, 0.1, 6, 14), [236, 230, 198]));
      ps.push(part(ovalGeo(1.2, 0.85, -0.9, 0.62, 0.62, 0.1, 6, 14), [236, 230, 198]));
      obj(g, mergeC(ps), 0, 0, 0, 28, 0); }],

    ['Ames room', function (g, t) {
      var m = geo('ames', function () { return mergeC([
        part(prism([[-1.7, -1.0], [1.7, -0.55], [1.7, 0.55], [-1.7, 1.0]], 0.02), [190, 178, 158]),
        part(prism([[-1.7, -1.0], [-1.7, 1.0], [-1.35, 0.72], [-1.35, -0.72]], 0.03), [156, 146, 128]),
        part(prism([[1.7, -0.55], [1.7, 0.55], [1.35, 0.4], [1.35, -0.4]], 0.03), [156, 146, 128])
      ]); });
      obj(g, m, 0, 0, 0, 30, 0);
      /* same two people, different corners */
      var ps = [], i;
      for (i = 0; i < 2; i++) {
        var sd = i ? 1 : -1, sc2 = i ? 0.46 : 1.0;
        ps.push(part(ovalGeo(sd * 1.15, (i ? 0.05 : -0.3) + 0.42 * sc2, 0.3,
                             0.16 * sc2, 0.19 * sc2, 0.16 * sc2, 4, 8), [226, 190, 150]));
        ps.push(part(boxGeo(sd * 1.15, (i ? 0.05 : -0.3) - 0.05 * sc2, 0.3,
                            0.18 * sc2, 0.42 * sc2, 0.14 * sc2), [180, 70, 80]));
      }
      obj(g, mergeC(ps), 0, 0, 0, 30, 0); }],

    ['Ames window', function (g, t) {
      var a = t * 0.0016;
      var m = geo('ameswin', function () {
        var ps = [part(prism([[-1.5, -0.62], [1.5, -0.42], [1.5, 0.42], [-1.5, 0.62]], 0.05),
                       [176, 142, 96])], i;
        for (i = 0; i < 2; i++)
          ps.push(part(boxGeo(-0.5 + i * 1.0, 0, 0.08, 0.05, 0.42, 0.03), [120, 96, 62]));
        return mergeC(ps);
      });
      obj(g, m, 0, a, 0, 28, 1); }],

    ['Forced perspective', function (g, t) {
      var ps = [], i;
      for (i = 0; i < 5; i++) {                          /* a receding colonnade */
        var f = i / 5, z = -f * 4;
        ps.push(part(boxGeo(-1.5 + f * 0.5, -0.2, z, 0.16, 1.0, 0.16), [196, 190, 176]));
        ps.push(part(boxGeo(1.5 - f * 0.5, -0.2, z, 0.16, 1.0, 0.16), [196, 190, 176]));
      }
      ps.push(part(boxGeo(0, -1.25, -1.8, 2.4, 0.08, 4.2), [110, 106, 98]));
      /* two identical figures, one near, one far: the same size on screen */
      for (i = 0; i < 2; i++)
        ps.push(part(boxGeo(i ? 0.55 : -0.55, -0.6, i ? -3.4 : 0.4,
                            0.2, 0.5, 0.2), i ? [220, 120, 90] : [120, 170, 220]));
      obj(g, mergeC(ps), 0.06, 0, 0, 30, 1); }],

    ['Zollner lines', function (g, t) {
      var m = geo('zollner', function () {
        var ps = [], i, k;
        for (i = 0; i < 5; i++) {
          var y = (i - 2) * 0.62;
          ps.push(part(boxGeo(0, y, 0, 1.75, 0.05, 0.06), [228, 222, 206]));
          for (k = 0; k < 11; k++)                       /* alternating hatching */
            ps.push(part(xfG(boxGeo(0, 0, 0, 0.035, 0.2, 0.05), 0, 0,
                             (i % 2 ? 1 : -1) * 0.7, -1.6 + k * 0.32, y, 0.04),
                         [150, 190, 220]));
        }
        return mergeC(ps);
      });
      obj(g, m, 0, 0, 0, 28, 0); }],

    ['Poggendorff', function (g, t) {
      var m = geo('poggen', function () { return mergeC([
        part(boxGeo(0, 0, 0, 0.42, 1.5, 0.06), [150, 160, 186]),
        part(xfG(boxGeo(0, 0, 0, 0.75, 0.055, 0.07), 0, 0, 0.42, -1.1, -0.3, 0.06),
             [236, 200, 110]),
        part(xfG(boxGeo(0, 0, 0, 0.75, 0.055, 0.07), 0, 0, 0.42, 1.1, 0.42, 0.06),
             [236, 200, 110])
      ]); });
      obj(g, m, 0, 0, 0, 30, 0); }],

    ['Hering illusion', function (g, t) {
      var m = geo('hering', function () {
        var ps = [], i;
        for (i = 0; i < 18; i++) {                       /* radiating fan */
          var a = i * Math.PI / 18;
          ps.push(part(xfG(boxGeo(0, 0, 0, 2.4, 0.03, 0.04), 0, 0, a, 0, 0, 0),
                       [120, 130, 160]));
        }
        ps.push(part(boxGeo(-0.68, 0, 0.1, 0.055, 1.5, 0.07), [240, 214, 120]));
        ps.push(part(boxGeo(0.68, 0, 0.1, 0.055, 1.5, 0.07), [240, 214, 120]));
        return mergeC(ps);
      });
      obj(g, m, 0, 0, 0, 30, 0); }],

    ['Wundt illusion', function (g, t) {
      var m = geo('wundt', function () {
        var ps = [], i;
        for (i = 0; i < 14; i++) {
          var f = (i / 13 - 0.5) * 2;
          ps.push(part(xfG(boxGeo(0, 0, 0, 1.9, 0.03, 0.04), 0, 0, f * 0.55, 0, 0, 0),
                       [126, 136, 166]));
        }
        ps.push(part(boxGeo(-0.6, 0, 0.1, 0.055, 1.4, 0.07), [236, 130, 120]));
        ps.push(part(boxGeo(0.6, 0, 0.1, 0.055, 1.4, 0.07), [236, 130, 120]));
        return mergeC(ps);
      });
      obj(g, m, 0, 0, 0, 30, 0); }],

    ['Cafe wall', function (g, t) {
      var m = geo('cafe', function () {
        var ps = [], i, j;
        for (j = 0; j < 7; j++) {
          var off = (j % 2 ? 0.22 : -0.22);
          ps.push(part(boxGeo(0, 0.95 - j * 0.32, -0.06, 1.9, 0.025, 0.05), [150, 146, 138]));
          for (i = 0; i < 7; i++)
            ps.push(part(boxGeo(-1.65 + i * 0.55 + off, 0.95 - j * 0.32 - 0.16, 0,
                                0.26, 0.13, 0.06), [246, 244, 238]));
        }
        return mergeC(ps);
      });
      obj(g, m, 0, 0, 0, 30, 0); }],

    ['Fraser spiral', function (g, t) {
      var m = geo('fraser', function () {
        var ps = [], r, i;
        for (r = 1; r <= 5; r++) {
          var R = r * 0.32, n = 10 + r * 5;
          for (i = 0; i < n; i++) {
            var a = i / n * TAU;
            ps.push(part(xfG(boxGeo(0, 0, 0, 0.13, 0.045, 0.03), 0, 0, a + 0.55,
                             Math.cos(a) * R, Math.sin(a) * R, 0),
                         i % 2 ? [244, 242, 234] : [34, 32, 40]));
          }
        }
        return mergeC(ps);
      });
      obj(g, m, 0, 0, 0, 30, 0); }],

    ['Twisted cord', function (g, t) {
      var m = geo('twist', function () {
        var ps = [], i, j;

        ps.push(part(boxGeo(0, 0, -0.1, 1.9, 1.35, 0.04), [96, 100, 116]));
        for (j = 0; j < 5; j++) for (i = 0; i < 15; i++) {
          var x = -1.65 + i * 0.236;
          ps.push(part(xfG(boxGeo(0, 0, 0, 0.13, 0.055, 0.03), 0, 0,
                           (j % 2 ? 1 : -1) * 0.8,
                           x, 0.95 - j * 0.48, 0),
                       i % 2 ? [248, 246, 238] : [24, 24, 32]));
        }
        return mergeC(ps);
      });
      obj(g, m, 0, 0, 0, 30, 0); }],

    ['Bulging squares', function (g, t) {
      var m = geo('bulge', function () {
        var ps = [], i, j;
        for (j = 0; j < 9; j++) for (i = 0; i < 9; i++) {
          var x = (i - 4) * 0.4, y = (j - 4) * 0.4;
          var d = Math.sqrt(x * x + y * y) / 2.3;
          var s2 = 0.15 + (1 - Math.min(1, d)) * 0.06;
          ps.push(part(boxGeo(x, y, 0, s2, s2, 0.05),
                       (i + j) % 2 ? [246, 244, 238] : [28, 28, 36]));
        }
        return mergeC(ps);
      });
      obj(g, m, 0, 0, 0, 28, 0); }],

    ['Tilted tower', function (g, t) {
      var ps = [], k, i;
      for (k = 0; k < 2; k++) {                          /* identical, side by side */
        var ox = k ? 0.85 : -0.85;
        for (i = 0; i < 7; i++)
          ps.push(part(boxGeo(ox + i * 0.055, -1.1 + i * 0.34, -i * 0.28,
                              0.34 - i * 0.02, 0.17, 0.34 - i * 0.02),
                       [214 - i * 8, 204 - i * 8, 184]));
      }
      obj(g, mergeC(ps), 0.08, 0, 0, 26, 1); }],

    ['Judd illusion', function (g, t) {
      var m = geo('judd', function () {
        var ps = [part(boxGeo(0, 0, 0, 1.5, 0.06, 0.08), [230, 224, 208])], i;
        for (i = 0; i < 2; i++) {
          var sd = i ? 1 : -1;
          for (var k = 0; k < 2; k++)
            ps.push(part(xfG(boxGeo(0, 0, 0, 0.42, 0.055, 0.07), 0, 0,
                             (k ? 1 : -1) * 0.7 * sd,
                             sd * 1.5 - sd * 0.28, (k ? 1 : -1) * 0.26, 0), [206, 170, 110]));
        }
        ps.push(part(ovalGeo(-0.35, 0, 0.14, 0.1, 0.1, 0.06, 3, 7), [240, 120, 110]));
        return mergeC(ps);
      });
      obj(g, m, 0, 0, 0, 30, 0); }],

    ['Orbison illusion', function (g, t) {
      var m = geo('orbison', function () {
        var ps = [], i;
        for (i = 1; i <= 7; i++)
          ps.push(part(xfG(prism(ringO(i * 0.26, 0.03, 22), 0.02), 0, 0, 0, 0, 0, 0),
                       [116, 128, 158]));
        ps.push(part(xfG(prism(ringO(0.95, 0.05, 4, Math.PI / 4), 0.05), 0, 0, 0, 0, 0, 0.08),
                     [240, 214, 120]));
        return mergeC(ps);
      });
      obj(g, m, 0, 0, 0, 28, 0); }],

    ['Hermann grid', function (g, t) {
      var m = geo('hermann', function () {
        var ps = [part(boxGeo(0, 0, -0.1, 1.9, 1.45, 0.05), [26, 26, 32])], i, j;
        for (j = 0; j < 5; j++) for (i = 0; i < 6; i++)
          ps.push(part(boxGeo(-1.55 + i * 0.62, 1.1 - j * 0.58, 0, 0.24, 0.22, 0.05),
                       [238, 236, 228]));
        return mergeC(ps);
      });
      obj(g, m, 0, 0, 0, 30, 0); }],

    ['Scintillating grid', function (g, t) {
      var m = geo('scint', function () {
        var ps = [part(boxGeo(0, 0, -0.12, 1.9, 1.45, 0.05), [24, 24, 30])], i, j;
        for (j = 0; j < 5; j++) for (i = 0; i < 6; i++) {
          ps.push(part(boxGeo(-1.55 + i * 0.62, 1.1 - j * 0.58, 0, 0.25, 0.1, 0.04),
                       [130, 132, 140]));
          ps.push(part(boxGeo(-1.55 + i * 0.62, 1.1 - j * 0.58, 0, 0.1, 0.25, 0.04),
                       [130, 132, 140]));
          ps.push(part(xfG(prism(discO(0.095, 9), 0.03), 0, 0, 0,
                           -1.24 + i * 0.62, 0.81 - j * 0.58, 0.06), [246, 246, 240]));
        }
        return mergeC(ps);
      });
      obj(g, m, 0, 0, 0, 30, 0); }],

    ['Checker shadow', function (g, t) {
      var m = geo('checksh', function () {
        var ps = [], i, j;
        for (j = 0; j < 6; j++) for (i = 0; i < 6; i++) {
          var dark = (i + j) % 2;
          var shade = i >= 3 ? 0.58 : 1;                 /* the cast shadow */
          var v = dark ? 92 : 176;
          ps.push(part(boxGeo(-1.4 + i * 0.56, 1.0 - j * 0.42, 0, 0.27, 0.2, 0.04),
                       [v * shade, v * shade, (v + 6) * shade]));
        }
        ps.push(part(boxGeo(1.2, 0.4, 0.4, 0.26, 0.95, 0.26), [80, 92, 108]));
        return mergeC(ps);
      });
      obj(g, m, 0, 0, 0, 30, 0); }],

    ['Cornsweet edge', function (g, t) {
      var m = geo('cornsweet', function () {
        var ps = [], i;
        for (i = 0; i < 24; i++) {                       /* two equal greys, one seam */
          var f = i / 23;
          var v = f < 0.5 ? 150 + Math.pow(f * 2, 6) * 60
                          : 150 - Math.pow((1 - f) * 2, 6) * 60;
          ps.push(part(boxGeo(-1.75 + i * 0.152, 0, 0, 0.078, 1.1, 0.04), [v, v, v + 4]));
        }
        return mergeC(ps);
      });
      obj(g, m, 0, 0, 0, 30, 0); }],

    ['Mach bands', function (g, t) {
      var m = geo('mach', function () {
        var ps = [], i;
        for (i = 0; i < 22; i++) {
          var f = i / 21;
          var v = f < 0.3 ? 70 : f > 0.7 ? 220 : 70 + (f - 0.3) / 0.4 * 150;
          ps.push(part(boxGeo(-1.7 + i * 0.165, 0, 0, 0.085, 1.15, 0.04), [v, v, v + 5]));
        }
        return mergeC(ps);
      });
      obj(g, m, 0, 0, 0, 30, 0); }],

    ["White's illusion", function (g, t) {
      var m = geo('white', function () {
        var ps = [], i, j;
        for (i = 0; i < 9; i++)                          /* black and white bars */
          ps.push(part(boxGeo(-1.6 + i * 0.4, 0, -0.04, 0.19, 1.25, 0.04),
                       i % 2 ? [240, 238, 230] : [30, 30, 38]));
        for (j = 0; j < 2; j++)                          /* identical grey patches */
          ps.push(part(boxGeo(-1.2 + j * 1.6, j ? -0.4 : 0.4, 0.04, 0.19, 0.34, 0.04),
                       [140, 140, 148]));
        return mergeC(ps);
      });
      obj(g, m, 0, 0, 0, 30, 0); }],

    ['Simultaneous contrast', function (g, t) {
      var m = geo('simcon', function () { return mergeC([
        part(boxGeo(-0.9, 0, -0.05, 0.85, 0.9, 0.05), [30, 30, 38]),
        part(boxGeo(0.9, 0, -0.05, 0.85, 0.9, 0.05), [236, 234, 226]),
        part(boxGeo(-0.9, 0, 0.04, 0.34, 0.36, 0.04), [142, 142, 150]),
        part(boxGeo(0.9, 0, 0.04, 0.34, 0.36, 0.04), [142, 142, 150])
      ]); });
      obj(g, m, 0, 0, 0, 32, 0); }],

    ['Bezold effect', function (g, t) {
      var m = geo('bezold', function () {
        var ps = [], i, j;
        for (j = 0; j < 8; j++) for (i = 0; i < 10; i++) {
          var left = i < 5;
          ps.push(part(boxGeo(-1.7 + i * 0.38, 1.0 - j * 0.29, 0, 0.17, 0.13, 0.04),
                       (i + j) % 2 ? (left ? [236, 234, 226] : [26, 26, 34])
                                   : [214, 84, 96]));
        }
        return mergeC(ps);
      });
      obj(g, m, 0, 0, 0, 30, 0); }],

    ['Chubb contrast', function (g, t) {
      var m = geo('chubb', function () {
        var ps = [], i, j, k;
        for (k = 0; k < 2; k++) {
          var amp = k ? 0.35 : 1;
          var ox = k ? 0.95 : -0.95;
          if (k) ps.push(part(boxGeo(ox, 0, -0.06, 0.8, 0.8, 0.04), [140, 140, 148]));
          for (j = 0; j < 8; j++) for (i = 0; i < 8; i++) {
            var v = 140 + (((i + j) % 2) ? 1 : -1) * 100 * amp;
            ps.push(part(boxGeo(ox - 0.7 + i * 0.2, 0.7 - j * 0.2, 0, 0.09, 0.09, 0.04),
                         [v, v, v + 5]));
          }
        }
        return mergeC(ps);
      });
      obj(g, m, 0, 0, 0, 30, 0); }],

    ['Vasarely nest', function (g, t) {
      var m = geo('vasarely', function () {
        var ps = [], i;
        for (i = 8; i >= 1; i--) {
          var v = 40 + (8 - i) * 26;
          ps.push(part(boxGeo(0, 0, (9 - i) * 0.02, i * 0.17, i * 0.17, 0.015),
                       [v, v, v + 6]));
        }
        return mergeC(ps);
      });
      obj(g, m, 0, 0, 0, 34, 0); }],

    ['Glare illusion', function (g, t) {
      var m = geo('glare', function () {
        var ps = [], i, j;
        for (j = 0; j < 2; j++) for (i = 0; i < 2; i++) {
          var x = (i - 0.5) * 1.1, y = (j - 0.5) * 1.1;
          var k;
          for (k = 0; k < 5; k++) {                      /* luminance ramp inward */
            var f = k / 5;
            ps.push(part(boxGeo(x + (i ? -1 : 1) * f * 0.22, y + (j ? -1 : 1) * f * 0.22,
                                k * 0.01, 0.42 - f * 0.06, 0.42 - f * 0.06, 0.02),
                         [70 + f * 150, 70 + f * 150, 80 + f * 155]));
          }
        }
        ps.push(part(boxGeo(0, 0, 0.1, 0.3, 0.3, 0.04), [252, 250, 244]));
        return mergeC(ps);
      });
      obj(g, m, 0, 0, 0, 32, 0); }],

    ['Brightness ramp', function (g, t) {
      var m = geo('bramp', function () {
        var ps = [], i;
        for (i = 0; i < 20; i++) {
          var v = 30 + i * 11;
          ps.push(part(boxGeo(-1.8 + i * 0.19, 0.45, 0, 0.095, 0.45, 0.04), [v, v, v + 5]));
        }
        ps.push(part(boxGeo(0, -0.45, 0.04, 1.9, 0.3, 0.04), [140, 140, 148]));
        return mergeC(ps);
      });
      obj(g, m, 0, 0, 0, 30, 0); }],

    ['Neon colour spread', function (g, t) {
      var m = geo('neon', function () {
        var ps = [part(boxGeo(0, 0, -0.1, 1.9, 1.6, 0.04), [22, 22, 30])], i, j;
        for (j = 0; j < 9; j++) for (i = 0; i < 9; i++) {
          var x = (i - 4) * 0.42, y = (j - 4) * 0.36;
          var inside = Math.abs(i - 4) <= 1 && Math.abs(j - 4) <= 1;
          ps.push(part(boxGeo(x, y, 0, 0.035, 0.17, 0.03),
                       inside ? [110, 205, 252] : [226, 222, 210]));
          ps.push(part(boxGeo(x, y, 0, 0.17, 0.035, 0.03),
                       inside ? [110, 205, 252] : [226, 222, 210]));
        }
        return mergeC(ps);
      });
      obj(g, m, 0, 0, 0, 30, 0); }],

    ['Watercolour illusion', function (g, t) {
      var m = geo('watercol', function () {
        var ps = [], i, n = 26, P = [];
        for (i = 0; i < n; i++) {
          var a = i / n * TAU;
          var r = 1.15 + Math.sin(a * 5) * 0.16;
          P.push([Math.cos(a) * r, Math.sin(a) * r]);
        }
        ps.push(part(prism(P, 0.02), [246, 238, 206]));   /* the "tinted" inside */
        for (i = 0; i < n; i++) {
          var b = P[i], c = P[(i + 1) % n];
          ps.push(part(barGeo(b[0], b[1], 0.05, c[0], c[1], 0.05, 0.055), [244, 176, 80]));
          ps.push(part(barGeo(b[0] * 1.08, b[1] * 1.08, 0.03, c[0] * 1.08, c[1] * 1.08, 0.03,
                              0.04), [140, 60, 160]));
        }
        return mergeC(ps);
      });
      obj(g, m, 0, 0, 0, 28, 0); }],

    ['Chromostereopsis', function (g, t) {
      var m = geo('chromo', function () {
        var ps = [part(boxGeo(0, 0, -0.1, 1.9, 1.4, 0.05), [16, 16, 22])], i, j;
        for (j = 0; j < 6; j++) for (i = 0; i < 7; i++)
          ps.push(part(boxGeo(-1.5 + i * 0.5, 1.0 - j * 0.4, 0, 0.16, 0.14, 0.04),
                       (i + j) % 2 ? [240, 40, 50] : [40, 70, 240]));
        return mergeC(ps);
      });
      obj(g, m, 0, 0, 0, 30, 0); }],

    ['Benham top', function (g, t) {
      var a = t * 0.012;
      var ps = [], i;
      ps.push(part(xfG(prism(discO(1.25, 20), 0.05), 0, 0, a, 0, 0, 0), [244, 242, 234]));
      for (i = 0; i < 10; i++) {                          /* half black, arcs on the rest */
        var b = a + Math.PI + i / 10 * Math.PI;
        ps.push(part(xfG(boxGeo(0, 0, 0, 0.6, 0.12, 0.02), 0, 0, b,
                         Math.cos(b) * 0.62, Math.sin(b) * 0.62, 0.07), [24, 24, 30]));
      }
      for (i = 0; i < 9; i++) {
        var c = a + i / 9 * Math.PI * 0.9;
        ps.push(part(xfG(boxGeo(0, 0, 0, 0.13, 0.05, 0.02), 0, 0, c + 1.57,
                         Math.cos(c) * (0.35 + (i % 3) * 0.3),
                         Math.sin(c) * (0.35 + (i % 3) * 0.3), 0.08), [24, 24, 30]));
      }
      ps.push(part(cylGeo(0, 0, -0.3, 0.06, 0.12, 0.6, 6, 'z'), [150, 120, 70]));
      obj(g, mergeC(ps), 0.16, 0, 0, 30, 0); }],

    ['Afterimage flag', function (g, t) {
      var m = geo('afterflag', function () {
        var ps = [part(boxGeo(0, 0, -0.04, 1.55, 0.95, 0.04), [40, 210, 180])], i;
        for (i = 0; i < 6; i++)                           /* complementary stripes */
          ps.push(part(boxGeo(0, 0.78 - i * 0.32, 0, 1.5, 0.08, 0.04), [30, 30, 40]));
        ps.push(part(boxGeo(-0.85, 0.48, 0.05, 0.6, 0.42, 0.04), [240, 200, 40]));
        for (i = 0; i < 6; i++)
          ps.push(part(xfG(prism(starO(0.09, 0.04, 5), 0.02), 0, 0, 0,
                           -1.25 + (i % 3) * 0.4, 0.62 - ((i / 3) | 0) * 0.3, 0.1),
                       [30, 30, 40]));
        return mergeC(ps);
      });
      obj(g, m, 0, 0, 0, 30, 0); }],

    ['Colour assimilation', function (g, t) {
      var m = geo('assim', function () {
        var ps = [part(boxGeo(0, 0, -0.08, 1.85, 1.35, 0.04), [232, 228, 214])], i;
        for (i = 0; i < 22; i++) {
          var x = -1.75 + i * 0.16;
          var left = x < 0;
          ps.push(part(boxGeo(x, 0, 0, 0.045, 1.3, 0.04),
                       left ? [230, 60, 70] : [60, 110, 230]));
        }
        return mergeC(ps);
      });
      obj(g, m, 0, 0, 0, 30, 0); }],

    ['Munker illusion', function (g, t) {
      var m = geo('munker', function () {
        var ps = [part(boxGeo(0, 0, -0.1, 1.85, 1.35, 0.04), [30, 30, 38])], i, j;
        for (j = 0; j < 3; j++)
          for (i = 0; i < 5; i++)
            ps.push(part(xfG(prism(discO(0.2, 11), 0.03), 0, 0, 0,
                             -1.5 + i * 0.75, 0.85 - j * 0.85, 0), [200, 150, 60]));
        for (i = 0; i < 26; i++) {
          var y = 1.2 - i * 0.095;
          var band = y > 0.42 ? 0 : (y > -0.42 ? 1 : 2);
          ps.push(part(boxGeo(0, y, 0.06, 1.8, 0.03, 0.03),
                       [[70, 220, 240], [240, 80, 100], [120, 240, 120]][band]));
        }
        return mergeC(ps);
      });
      obj(g, m, 0, 0, 0, 30, 0); }],

    ['Kanizsa triangle', function (g, t) {
      var m = geo('kanizsa', function () {
        var ps = [part(boxGeo(0, 0, -0.15, 1.85, 1.4, 0.04), [232, 228, 216])], i;
        for (i = 0; i < 3; i++) {                         /* three bitten discs */
          var a = i * TAU / 3 - Math.PI / 2;
          var x = Math.cos(a) * 1.15, y = Math.sin(a) * 1.15;
          ps.push(part(xfG(prism(discO(0.42, 13), 0.03), 0, 0, 0, x, y, 0), [28, 28, 36]));
          ps.push(part(xfG(prism([[0, 0], [0.62, 0.36], [0.62, -0.36]], 0.05), 0, 0,
                           a + Math.PI, x, y, 0.04), [232, 228, 216]));
        }
        return mergeC(ps);
      });
      obj(g, m, 0, 0, 0, 30, 0); }],

    ['Ehrenstein figure', function (g, t) {
      var m = geo('ehrenstein', function () {
        var ps = [part(boxGeo(0, 0, -0.1, 1.9, 1.4, 0.04), [26, 26, 34])], i, j, k;
        for (j = 0; j < 3; j++) for (i = 0; i < 4; i++) {
          var x = (i - 1.5) * 0.95, y = (1 - j) * 0.9;
          for (k = 0; k < 4; k++) {
            var a = k * TAU / 4;
            ps.push(part(boxGeo(x + Math.cos(a) * 0.42, y + Math.sin(a) * 0.42, 0,
                                k % 2 ? 0.025 : 0.22, k % 2 ? 0.22 : 0.025, 0.03),
                         [242, 240, 232]));
          }
        }
        return mergeC(ps);
      });
      obj(g, m, 0, 0, 0, 30, 0); }],

    ['Illusory sphere', function (g, t) {
      var m = geo('illsphere', function () {
        var ps = [], u, v;
        /* dots on a sphere that is not there: the surface is entirely
           in the arrangement */
        for (u = 0; u < 11; u++) for (v = 0; v < 16; v++) {
          var ph = (u + 0.5) / 11 * Math.PI, th = v / 16 * TAU + u * 0.2;
          ps.push(part(ovalGeo(Math.sin(ph) * Math.cos(th) * 1.25, Math.cos(ph) * 1.25,
                               Math.sin(ph) * Math.sin(th) * 1.25,
                               0.055, 0.055, 0.055, 3, 5), [240, 238, 228]));
        }
        return mergeC(ps);
      });
      obj(g, m, 0.2, t * 0.0006, 0, 32, 0); }],

    ['Koffka ring', function (g, t) {
      var m = geo('koffka', function () { return mergeC([
        part(boxGeo(-0.9, 0, -0.06, 0.9, 1.2, 0.04), [28, 28, 36]),
        part(boxGeo(0.9, 0, -0.06, 0.9, 1.2, 0.04), [234, 232, 224]),
        part(xfG(prism(ringO(0.85, 0.3, 22), 0.03), 0, 0, 0, 0, 0, 0.02), [144, 144, 152])
      ]); });
      obj(g, m, 0, 0, 0, 30, 0); }],

    ['Varin figure', function (g, t) {
      var m = geo('varin', function () {
        var ps = [], i, k;
        for (i = 0; i < 4; i++) {
          var a = i * TAU / 4 + Math.PI / 4;
          for (k = 0; k < 7; k++) {
            var r = 0.55 + k * 0.17;
            ps.push(part(xfG(boxGeo(0, 0, 0, 0.07, 0.03, 0.02), 0, 0, a + Math.PI / 2,
                             Math.cos(a) * r, Math.sin(a) * r, 0), [238, 236, 228]));
          }
        }
        return mergeC(ps);
      });
      obj(g, m, 0, 0, 0, 30, 0); }],

    ['Abutting gratings', function (g, t) {
      var m = geo('abut', function () {
        var ps = [part(boxGeo(0, 0, -0.1, 1.85, 1.35, 0.04), [26, 26, 34])], i;
        for (i = 0; i < 20; i++) {
          var y = 1.2 - i * 0.13;
          var split = Math.sin(i * 0.5) * 0.5;
          ps.push(part(boxGeo(-0.95 + split / 2, y, 0, 0.85 - split / 2, 0.035, 0.03),
                       [238, 236, 228]));
          ps.push(part(boxGeo(0.95 + split / 2, y + 0.065, 0, 0.85 - split / 2, 0.035, 0.03),
                       [238, 236, 228]));
        }
        return mergeC(ps);
      });
      obj(g, m, 0, 0, 0, 30, 0); }],

    ['Rotating snakes', function (g, t) {
      var m = geo('snakes', function () {
        var ps = [], r, i;
        var band = [[248, 246, 236], [244, 190, 60], [26, 26, 34], [80, 150, 230]];
        for (r = 0; r < 3; r++) {
          var R = 0.45 + r * 0.52, n = 12 + r * 6;
          for (i = 0; i < n; i++) {
            var a = i / n * TAU;
            var k;
            for (k = 0; k < 4; k++)
              ps.push(part(xfG(boxGeo(0, 0, 0, 0.055, 0.17, 0.02), 0, 0, a,
                               Math.cos(a) * (R + (k - 1.5) * 0.1),
                               Math.sin(a) * (R + (k - 1.5) * 0.1), 0),
                           band[(k + r) % 4]));
          }
        }
        return mergeC(ps);
      });
      obj(g, m, 0, 0, 0, 30, 0); }],

    ['Peripheral drift', function (g, t) {
      var m = geo('drift', function () {
        var ps = [], i, j, k;
        var band = [[250, 248, 238], [240, 170, 50], [24, 24, 32], [70, 140, 220]];
        for (j = 0; j < 4; j++) for (i = 0; i < 5; i++) {
          var x = (i - 2) * 0.76, y = (1.5 - j) * 0.68;
          for (k = 0; k < 4; k++)
            ps.push(part(boxGeo(x, y - 0.24 + k * 0.16, 0, 0.3, 0.08, 0.02),
                         band[((i + j) % 2 ? k : 3 - k)]));
        }
        return mergeC(ps);
      });
      obj(g, m, 0, 0, 0, 28, 0); }],

    ['Ouchi illusion', function (g, t) {
      var m = geo('ouchi', function () {
        var ps = [], i, j;
        for (j = 0; j < 14; j++) for (i = 0; i < 9; i++) {
          var x = (i - 4) * 0.42, y = (6.5 - j) * 0.2;
          var inside = (x * x) / 0.55 + (y * y) / 0.55 < 1;
          if (inside) continue;
          ps.push(part(boxGeo(x, y, 0, 0.2, 0.09, 0.02),
                       (i + j) % 2 ? [244, 242, 234] : [26, 26, 34]));
        }
        for (j = 0; j < 9; j++) for (i = 0; i < 14; i++) {
          var x2 = (6.5 - i) * 0.2, y2 = (j - 4) * 0.42;
          if ((x2 * x2) / 0.55 + (y2 * y2) / 0.55 >= 1) continue;
          ps.push(part(boxGeo(x2, y2, 0.02, 0.09, 0.2, 0.02),
                       (i + j) % 2 ? [244, 242, 234] : [26, 26, 34]));
        }
        return mergeC(ps);
      });
      obj(g, m, 0, 0, 0, 30, 0); }],

    ['Enigma illusion', function (g, t) {
      var m = geo('enigma', function () {
        var ps = [], i;
        for (i = 0; i < 70; i++) {                        /* fine radial rays */
          var a = i / 70 * TAU;
          ps.push(part(xfG(boxGeo(0, 0, 0, 1.45, 0.022, 0.02), 0, 0, a,
                           Math.cos(a) * 1.45, Math.sin(a) * 1.45, 0),
                       i % 2 ? [242, 240, 232] : [28, 28, 36]));
        }
        ps.push(part(xfG(prism(ringO(1.0, 0.16, 26), 0.03), 0, 0, 0, 0, 0, 0.05),
                     [130, 90, 220]));
        ps.push(part(xfG(prism(ringO(0.6, 0.14, 22), 0.03), 0, 0, 0, 0, 0, 0.05),
                     [210, 90, 120]));
        return mergeC(ps);
      });
      obj(g, m, 0, 0, 0, 28, 0); }],

    ['Pinna rings', function (g, t) {
      var m = geo('pinna', function () {
        var ps = [], r, i;
        for (r = 0; r < 2; r++) {
          var R = 0.7 + r * 0.62, n = 18 + r * 8;
          for (i = 0; i < n; i++) {
            var a = i / n * TAU;
            ps.push(part(xfG(boxGeo(0, 0, 0, 0.11, 0.11, 0.02), 0, 0,
                             a + (r ? 0.5 : -0.5),
                             Math.cos(a) * R, Math.sin(a) * R, 0),
                         i % 2 ? [246, 244, 236] : [26, 26, 34]));
          }
        }
        return mergeC(ps);
      });
      obj(g, m, 0, 0, 0, 28, 0); }],

    ['Barber pole', function (g, t) {
      var ps = [], i;
      for (i = 0; i < 26; i++) {
        var f = ((i / 26) + t * 0.00035) % 1;
        ps.push(part(xfG(torGeo(0, 0, 0, 0.46, 0.09, 12, 5), 0, 0, 0.55,
                         0, 1.25 - f * 2.5, 0), i % 2 ? [226, 60, 60] : [244, 242, 234]));
      }
      obj(g, mergeC(ps), 0, 0, 0, 30, 0);
      g.globalAlpha = 0.22;
      obj(g, mergeC([part(cylGeo(0, 0, 0, 0.52, 0.52, 2.5, 12), [200, 220, 235])]),
          0, 0, 0, 30, 0);
      g.globalAlpha = 1; }],

    ['Wagon wheel', function (g, t) {
      /* sampled at the frame rate, so it stalls and runs backwards */
      var a = Math.round(t * 0.012 / 0.42) * 0.42;
      var ps = [], i;
      ps.push(part(torGeo(0, 0, 0, 1.25, 0.1, 22, 6, 'z'), [120, 96, 60]));
      for (i = 0; i < 12; i++)
        ps.push(part(barGeo(0, 0, 0, Math.cos(a + i * TAU / 12) * 1.2,
                            Math.sin(a + i * TAU / 12) * 1.2, 0, 0.05), [176, 144, 96]));
      ps.push(part(cylGeo(0, 0, 0, 0.2, 0.2, 0.3, 10, 'z'), [90, 74, 50]));
      obj(g, mergeC(ps), 0, 0, 0, 30, 0); }],

    ['Motion aftereffect', function (g, t) {
      var ps = [], i;
      for (i = 0; i < 16; i++) {
        var f = ((i / 16) + t * 0.0004) % 1;
        var R = 0.15 + f * 1.35;
        ps.push(part(xfG(prism(ringO(R, 0.09, 22), 0.02), 0, 0, 0, 0, 0, -f * 0.3),
                     i % 2 ? [238, 236, 228] : [34, 34, 42]));
      }
      obj(g, mergeC(ps), 0, 0, 0, 30, 0); }],

    ['Phi phenomenon', function (g, t) {
      var ps = [], i;
      var on = Math.floor(t * 0.006) % 8;
      for (i = 0; i < 8; i++) {
        var a = i * TAU / 8;
        ps.push(part(ovalGeo(Math.cos(a) * 1.15, Math.sin(a) * 1.15, 0,
                             0.26, 0.26, 0.12, 4, 9),
                     i === on ? [24, 24, 32] : [230, 226, 214]));
      }
      obj(g, mergeC(ps), 0, 0, 0, 30, 0); }],

    ['Stepping feet', function (g, t) {
      var m = geo('stepbg', function () {
        var ps = [], i;
        for (i = 0; i < 18; i++)
          ps.push(part(boxGeo(-1.8 + i * 0.21, 0, -0.1, 0.1, 1.2, 0.04),
                       i % 2 ? [240, 238, 230] : [28, 28, 36]));
        return mergeC(ps);
      });
      obj(g, m, 0, 0, 0, 30, 0);
      var x = Math.sin(t * 0.0011) * 1.3;
      obj(g, mergeC([part(boxGeo(x, 0.35, 0.1, 0.3, 0.14, 0.05), [30, 30, 40]),
                     part(boxGeo(-x, -0.35, 0.1, 0.3, 0.14, 0.05), [240, 238, 230])]),
          0, 0, 0, 30, 0); }],

    ['Breathing square', function (g, t) {
      var m = geo('breathbg', function () {
        var ps = [], i;
        for (i = 0; i < 16; i++)
          ps.push(part(boxGeo(0, 1.2 - i * 0.16, -0.1, 1.9, 0.075, 0.04),
                       i % 2 ? [236, 234, 226] : [30, 30, 38]));
        return mergeC(ps);
      });
      obj(g, m, 0, 0, 0, 30, 0);
      var s2 = 0.55 + Math.sin(t * 0.0018) * 0.2;
      obj(g, mergeC([part(boxGeo(0, 0, 0.1, s2, s2, 0.05), [150, 150, 158])]),
          0, 0, 0, 30, 0); }],

    ['Rotating rings', function (g, t) {
      var ps = [], r, i;
      for (r = 0; r < 3; r++) {
        var R = 0.5 + r * 0.48, n = 14 + r * 6;
        var a0 = t * 0.0008 * (r % 2 ? 1 : -1);
        for (i = 0; i < n; i++) {
          var a = a0 + i / n * TAU;
          ps.push(part(xfG(boxGeo(0, 0, 0, 0.1, 0.1, 0.02), 0, 0, a,
                           Math.cos(a) * R, Math.sin(a) * R, 0),
                       i % 2 ? [244, 242, 234] : [28, 28, 36]));
        }
      }
      obj(g, mergeC(ps), 0, 0, 0, 30, 0); }],

    ['Wheel reversal', function (g, t) {
      var a = Math.round(t * 0.02 / 0.55) * 0.55;
      var m = geo('wheelrev', function () {
        var ps = [], i;
        for (i = 0; i < 16; i++) {
          var b = i * TAU / 16;
          ps.push(part(xfG(prism([[0.25, 0], [1.3, 0.2], [1.3, -0.2]], 0.03), 0, 0, b, 0, 0, 0),
                       i % 2 ? [230, 150, 70] : [60, 70, 110]));
        }
        return mergeC(ps);
      });
      obj(g, m, 0, 0, a, 30, 0); }],

    ['Stereokinetic disc', function (g, t) {
      var a = t * 0.0014;
      var ps = [], i;
      ps.push(part(xfG(prism(discO(1.3, 20), 0.02), 0, 0, 0, 0, 0, -0.04), [232, 230, 220]));
      for (i = 0; i < 4; i++) {
        var R = 1.0 - i * 0.26;
        ps.push(part(xfG(prism(discO(R, 18), 0.02), 0, 0, 0,
                         Math.cos(a) * i * 0.1, Math.sin(a) * i * 0.1, i * 0.02),
                     i % 2 ? [40, 40, 50] : [226, 222, 210]));
      }
      obj(g, mergeC(ps), 0, 0, 0, 30, 0); }],

    ['Kinetic depth', function (g, t) {
      /* dots on an invisible cylinder: the shape is only in the motion */
      var ps = [], i;
      for (i = 0; i < 40; i++) {
        var a = i * 2.399 + t * 0.0016;
        var y = ((i * 37 % 41) / 41 - 0.5) * 2.3;
        ps.push(part(ovalGeo(Math.cos(a) * 1.1, y, Math.sin(a) * 1.1,
                             0.07, 0.07, 0.07, 3, 5), [244, 242, 232]));
      }
      obj(g, mergeC(ps), 0, 0, 0, 30, 0); }],

    ['Structure from motion', function (g, t) {
      var ps = [], i;
      for (i = 0; i < 46; i++) {                          /* dots on a hidden sphere */
        var ph = Math.acos(1 - 2 * ((i + 0.5) / 46));
        var th = i * 2.399 + t * 0.0013;
        ps.push(part(ovalGeo(Math.sin(ph) * Math.cos(th) * 1.25,
                             Math.cos(ph) * 1.25,
                             Math.sin(ph) * Math.sin(th) * 1.25,
                             0.065, 0.065, 0.065, 3, 5), [240, 238, 230]));
      }
      obj(g, mergeC(ps), 0, 0, 0, 32, 0); }],

    ['Anaglyph cube', function (g, t) {
      var c = geo('cub', gCube);
      var a = t * 0.0008, b = t * 0.0012;
      g.globalAlpha = 0.75;
      wire(g, xform(c.V, a, b, 0).map(function (p) { return [p[0] - 0.12, p[1], p[2]]; }),
           c.E, 30, '240,50,60', 2.4);
      wire(g, xform(c.V, a, b, 0).map(function (p) { return [p[0] + 0.12, p[1], p[2]]; }),
           c.E, 30, '50,200,240', 2.4);
      g.globalAlpha = 1; }],

    ['Stereogram pair', function (g, t) {
      var ps = [], k, i;
      for (k = 0; k < 2; k++) {
        var ox = k ? 0.95 : -0.95;
        ps.push(part(boxGeo(ox, 0, -0.1, 0.8, 0.8, 0.04), [40, 44, 56]));
        for (i = 0; i < 26; i++) {
          var x = ((i * 37 % 53) / 53 - 0.5) * 1.5;
          var y = ((i * 61 % 47) / 47 - 0.5) * 1.5;
          var inside = Math.abs(x) < 0.4 && Math.abs(y) < 0.4;
          ps.push(part(boxGeo(ox + x + (inside ? (k ? -0.07 : 0.07) : 0), y, 0,
                              0.05, 0.05, 0.03), [236, 234, 226]));
        }
      }
      obj(g, mergeC(ps), 0, 0, 0, 30, 0); }],

    ['Pulfrich pendulum', function (g, t) {
      var a = Math.sin(t * 0.0022) * 0.9;
      var ps = [part(boxGeo(0, 1.35, 0, 1.1, 0.1, 0.2), [120, 110, 96])];
      ps.push(part(barGeo(0, 1.3, 0, Math.sin(a) * 1.9, 1.3 - Math.cos(a) * 1.9, 0, 0.025),
                   [200, 200, 210]));
      ps.push(part(ovalGeo(Math.sin(a) * 2.05, 1.3 - Math.cos(a) * 2.05, 0,
                           0.24, 0.24, 0.24, 4, 9), [220, 180, 70]));
      obj(g, mergeC(ps), 0, 0, 0, 26, 0);
      g.globalAlpha = 0.3;                                /* the dark filter, one eye */
      obj(g, mergeC([part(boxGeo(-1.0, 0, 1.6, 1.0, 1.5, 0.03), [40, 40, 60])]),
          0, 0, 0, 26, 0);
      g.globalAlpha = 1; }],

    ['Droste effect', function (g, t) {
      var ps = [], i;
      for (i = 0; i < 7; i++) {
        var s2 = Math.pow(0.66, i);
        var a = i * 0.24 + t * 0.0004;
        ps.push(part(xfG(prism(ringO(1.45 * s2, 0.16 * s2, 4, Math.PI / 4), 0.03), 0, 0, a,
                         0, 0, i * 0.06), [220 - i * 18, 200 - i * 14, 170]));
      }
      obj(g, mergeC(ps), 0, 0, 0, 30, 0); }],

    ['Recursive frames', function (g, t) {
      var ps = [], i;
      for (i = 0; i < 9; i++) {
        var s2 = Math.pow(0.78, i);
        ps.push(part(xfG(prism(ringO(1.5 * s2, 0.1 * s2, 4, Math.PI / 4), 0.02),
                         0, 0, i * 0.12, 0, 0, -i * 0.22), [230 - i * 16, 226 - i * 16, 214]));
      }
      obj(g, mergeC(ps), 0.1, Math.sin(t * 0.0005) * 0.2, 0, 28, 0); }],

    ['Zoetrope', function (g, t) {
      var a = t * 0.0022;
      var ps = [], i;
      for (i = 0; i < 14; i++) {                          /* slotted drum */
        var b = a + i * TAU / 14;
        ps.push(part(xfG(boxGeo(0, 0, 0, 0.12, 0.5, 0.03), 0, -b, 0,
                         Math.cos(b) * 1.2, 0.1, Math.sin(b) * 1.2), [90, 70, 50]));
        ps.push(part(xfG(boxGeo(0, 0, 0, 0.12, 0.28, 0.03), 0, -b, 0,
                         Math.cos(b) * 1.18, -0.62, Math.sin(b) * 1.18),
                     i % 2 ? [220, 120, 80] : [120, 190, 200]));
      }
      ps.push(part(lathe([[0, -0.95], [1.25, -0.95], [1.25, -0.85], [0, -0.85]], 16),
                   [110, 88, 62]));
      ps.push(part(cylGeo(0, -1.3, 0, 0.16, 0.22, 0.7, 8), [90, 72, 52]));
      obj(g, mergeC(ps), 0.24, 0, 0, 28, 0); }],

    ['Thaumatrope', function (g, t) {
      var a = t * 0.009;
      var m = geo('thauma', function () {
        var ps = [part(xfG(prism(discO(1.1, 18), 0.04), 0, 0, 0, 0, 0, 0), [238, 232, 216])];
        ps.push(part(xfG(prism(ringO(0.75, 0.1, 20), 0.02), 0, 0, 0, 0, 0, 0.06),
                     [60, 60, 72]));                      /* cage on one face */
        ps.push(part(ovalGeo(0, 0, -0.06, 0.3, 0.24, 0.03, 3, 8), [220, 170, 60]));
        return mergeC(ps);                                /* bird on the other */
      });
      obj(g, m, 0, a, 0, 32, 0);
      obj(g, mergeC([part(barGeo(-1.5, 0, 0, -1.05, 0, 0, 0.03), [180, 176, 166]),
                     part(barGeo(1.05, 0, 0, 1.5, 0, 0, 0.03), [180, 176, 166])]),
          0, 0, 0, 32, 0); }],

    ['Anamorphic skull', function (g, t) {
      /* only resolves from one corner: square on it is a smear */
      var m = geo('anamorph', function () {
        var ps = [], i;
        var sk = scG(lathe([[0.06, 1.0], [0.55, 0.9], [0.9, 0.5], [0.98, 0],
                            [0.8, -0.5], [0.55, -0.8], [0.06, -0.9]], 12), 3.4, 0.5, 0.6);
        ps.push(part(xfG(sk, 0, 0, 0.2, 0, 0.1, 0), [226, 222, 206]));
        for (i = 0; i < 2; i++)
          ps.push(part(ovalGeo((i ? 1 : -1) * 1.0, 0.16, 0.42, 0.5, 0.12, 0.12, 3, 7),
                       [30, 28, 32]));
        ps.push(part(boxGeo(0, -0.3, 0.4, 0.9, 0.06, 0.1), [30, 28, 32]));
        ps.push(part(boxGeo(0, -1.15, 0, 2.6, 0.06, 1.2), [90, 86, 96]));
        return mergeC(ps);
      });
      obj(g, m, 0.3, 0, 0, 26, 0); }],

    ['Shepard tone spiral', function (g, t) {
      var ps = [], i, n = 46;
      for (i = 0; i < n; i++) {
        var f = ((i / n) + t * 0.00035) % 1;
        var a = f * TAU * 3;
        var R = 0.2 + f * 1.35;
        var fade = Math.sin(f * Math.PI);
        ps.push(part(ovalGeo(Math.cos(a) * R, Math.sin(a) * R, 0,
                             0.05 + f * 0.09, 0.05 + f * 0.09, 0.04, 3, 6),
                     [120 + fade * 130, 110 + fade * 120, 200 + fade * 50]));
      }
      obj(g, mergeC(ps), 0, 0, 0, 30, 0); }]
  ];

  /* ================================================================
     REPEATING PATTERNS — a hundred fields that move.

     Each is a tiling or a lattice with a phase running through it, so
     the repeat is in the geometry and the life is in the offset. Most
     are laid out like a floor and seen from a low angle, which is
     where a repeat reads best.
     ================================================================ */

  var PAT = [
    ['Hex tiling', function (g, t) {
      var ps = fieldAt(7, 7, 0.62, function (i, j, x, z) {
        var ox = (j % 2) * 0.31;
        var h = 0.12 + (Math.sin(t * 0.003 + (x + ox) * 1.4 + z * 1.1) * 0.5 + 0.5) * 0.5;
        return [part(xfG(prism(discO(0.33, 6), h), Math.PI / 2, 0, 0, x + ox, h - 0.3, z),
                     [110 + h * 180, 170 + h * 70, 220])];
      });
      obj(g, mergeC(ps), 1.0, 0, 0, 30, 0); }],

    ['Triangle tiling', function (g, t) {
      var ps = fieldAt(8, 8, 0.55, function (i, j, x, z) {
        var up = (i + j) % 2;
        var h = 0.1 + (Math.sin(t * 0.0032 + i * 0.6 - j * 0.5) * 0.5 + 0.5) * 0.45;
        return [part(xfG(prism(discO(0.34, 3, up ? 0 : Math.PI), h), Math.PI / 2, 0, 0,
                         x, h - 0.3, z), up ? [236, 170, 90] : [90, 150, 210])];
      });
      obj(g, mergeC(ps), 1.0, 0, 0, 32, 0); }],

    ['Rhombus tiling', function (g, t) {
      var ps = fieldAt(7, 8, 0.6, function (i, j, x, z) {
        var k = (i + j) % 3;
        var h = 0.1 + (Math.sin(t * 0.0028 + k * 2.1 + i * 0.3) * 0.5 + 0.5) * 0.5;
        return [part(xfG(prism([[0, 0.34], [0.24, 0], [0, -0.34], [-0.24, 0]], h),
                         Math.PI / 2, k * 1.05, 0, x + (j % 2) * 0.3, h - 0.3, z),
                     [[226, 120, 130], [130, 200, 170], [200, 190, 110]][k])];
      });
      obj(g, mergeC(ps), 1.0, 0, 0, 30, 0); }],

    ['Herringbone', function (g, t) {
      var ps = fieldAt(7, 9, 0.52, function (i, j, x, z) {
        var lie = (i + j) % 2;
        var h = 0.08 + (Math.sin(t * 0.0026 + (i + j) * 0.5) * 0.5 + 0.5) * 0.3;
        return [part(boxGeo(x, h - 0.3, z, lie ? 0.46 : 0.16, h, lie ? 0.16 : 0.46),
                     lie ? [188, 138, 86] : [150, 106, 64])];
      });
      obj(g, mergeC(ps), 1.05, 0, 0, 32, 0); }],

    ['Basketweave', function (g, t) {
      var ps = fieldAt(5, 5, 0.86, function (i, j, x, z) {
        var flip = (i + j) % 2, out = [], k;
        var h = 0.08 + (Math.sin(t * 0.0024 + i * 0.7 + j * 0.7) * 0.5 + 0.5) * 0.26;
        for (k = 0; k < 3; k++)
          out.push(part(boxGeo(x + (flip ? (k - 1) * 0.24 : 0), h - 0.3,
                               z + (flip ? 0 : (k - 1) * 0.24),
                               flip ? 0.09 : 0.38, h, flip ? 0.38 : 0.09),
                        flip ? [206, 170, 110] : [166, 130, 78]));
        return out;
      });
      obj(g, mergeC(ps), 1.05, 0, 0, 30, 0); }],

    ['Pinwheel tiling', function (g, t) {
      var ps = fieldAt(5, 5, 0.92, function (i, j, x, z) {
        var out = [], k;
        var a0 = t * 0.0012 * ((i + j) % 2 ? 1 : -1);
        for (k = 0; k < 4; k++)
          out.push(part(xfG(boxGeo(0, 0, 0, 0.32, 0.07, 0.13), 0, a0 + k * TAU / 4, 0,
                            x + Math.cos(a0 + k * TAU / 4) * 0.3, -0.2,
                            z + Math.sin(a0 + k * TAU / 4) * 0.3),
                        [[230, 150, 90], [110, 190, 220], [220, 210, 120], [180, 130, 220]][k]));
        return out;
      });
      obj(g, mergeC(ps), 1.0, 0, 0, 28, 0); }],

    ['Truchet tiles', function (g, t) {
      var ps = fieldAt(7, 7, 0.6, function (i, j, x, z) {
        var turn = ((i * 7 + j * 13 + Math.floor(t * 0.0008)) % 4) * Math.PI / 2;
        var out = [], k;
        for (k = 0; k < 7; k++) {                 /* a quarter arc, corner to corner */
          var a = k / 6 * Math.PI / 2;
          out.push(part(xfG(boxGeo(Math.cos(a) * 0.3 - 0.3, 0, Math.sin(a) * 0.3 - 0.3,
                                   0.07, 0.07, 0.07), 0, turn, 0, x, -0.2, z),
                        [236, 232, 220]));
        }
        out.push(part(xfG(boxGeo(0, -0.1, 0, 0.3, 0.04, 0.3), 0, turn, 0, x, -0.2, z),
                      [56, 66, 92]));
        return out;
      });
      obj(g, mergeC(ps), 1.0, 0, 0, 30, 0); }],

    ['Penrose tiling', function (g, t) {
      var ps = [], ring, i, k;
      for (ring = 1; ring <= 4; ring++) {
        var n = ring * 5;
        for (i = 0; i < n; i++) {
          var a = i / n * TAU + ring * 0.31 + t * 0.0004;
          var r = ring * 0.42;
          for (k = 0; k < 2; k++) {
            var fat = (i + k) % 2;
            ps.push(part(xfG(prism([[0, 0.24], [fat ? 0.28 : 0.14, 0], [0, -0.24],
                                    [fat ? -0.28 : -0.14, 0]], 0.05),
                             Math.PI / 2, a + k * 0.62, 0,
                             Math.cos(a) * r + Math.cos(a + k * 1.2) * 0.2, -0.2,
                             Math.sin(a) * r + Math.sin(a + k * 1.2) * 0.2),
                         fat ? [230, 176, 92] : [104, 168, 212]));
          }
        }
      }
      obj(g, mergeC(ps), 0.95, 0, 0, 28, 0); }],

    ['Ammann bars', function (g, t) {
      var ps = [], i, k;
      for (k = 0; k < 5; k++) {
        var a = k * Math.PI / 5;
        for (i = -3; i <= 3; i++) {
          var off = i * 0.52 + Math.sin(t * 0.0009 + k) * 0.1;
          ps.push(part(xfG(boxGeo(0, 0, 0, 1.7, 0.035, 0.035), 0, a, 0,
                           Math.cos(a + Math.PI / 2) * off, -0.2,
                           Math.sin(a + Math.PI / 2) * off),
                       [200 - k * 22, 180, 120 + k * 24]));
        }
      }
      obj(g, mergeC(ps), 0.95, 0, 0, 30, 0); }],

    ['Cairo tiling', function (g, t) {
      var ps = fieldAt(5, 5, 0.86, function (i, j, x, z) {
        var out = [], k;
        for (k = 0; k < 4; k++) {
          var a = k * TAU / 4 + ((i + j) % 2 ? Math.PI / 4 : 0);
          var h = 0.1 + (Math.sin(t * 0.0026 + i * 0.5 + j * 0.4 + k) * 0.5 + 0.5) * 0.3;
          out.push(part(xfG(prism([[0, 0.3], [0.26, 0.08], [0.16, -0.26],
                                   [-0.16, -0.26], [-0.26, 0.08]], h),
                            Math.PI / 2, a, 0,
                            x + Math.cos(a) * 0.24, h - 0.3, z + Math.sin(a) * 0.24),
                        [150 + k * 22, 190, 150 + ((i + j) % 2) * 60]));
        }
        return out;
      });
      obj(g, mergeC(ps), 1.0, 0, 0, 28, 0); }],

    ['Snub square tiling', function (g, t) {
      var ps = fieldAt(6, 6, 0.72, function (i, j, x, z) {
        var a = ((i + j) % 2 ? 1 : -1) * (0.5 + Math.sin(t * 0.0016) * 0.3);
        var out = [part(xfG(prism(discO(0.28, 4, Math.PI / 4), 0.1), Math.PI / 2, a, 0,
                            x, -0.2, z), [110, 180, 220])], k;
        for (k = 0; k < 4; k++) {
          var b = a + k * TAU / 4 + Math.PI / 4;
          out.push(part(xfG(prism(discO(0.2, 3), 0.08), Math.PI / 2, b, 0,
                            x + Math.cos(b) * 0.42, -0.22, z + Math.sin(b) * 0.42),
                        [230, 170, 100]));
        }
        return out;
      });
      obj(g, mergeC(ps), 1.0, 0, 0, 28, 0); }],

    ['Kagome lattice', function (g, t) {
      var ps = [], i, j, k;
      for (j = 0; j < 6; j++) for (i = 0; i < 6; i++) {
        var x = (i - 2.5) * 0.62 + (j % 2) * 0.31, z = (j - 2.5) * 0.54;
        var lift = Math.sin(t * 0.003 + i * 0.7 + j * 0.6) * 0.14;
        for (k = 0; k < 3; k++) {
          var a = k * Math.PI / 3;
          ps.push(part(xfG(boxGeo(0, 0, 0, 0.3, 0.05, 0.05), 0, a, 0,
                           x, -0.2 + lift, z), [200, 170 + k * 20, 120 + k * 40]));
        }
      }
      obj(g, mergeC(ps), 1.0, 0, 0, 30, 0); }],

    ['Brick bond', function (g, t) {
      var ps = fieldAt(6, 9, 0.56, function (i, j, x, z) {
        var ox = (j % 2) * 0.28;
        var out = Math.sin(t * 0.0026 + i * 0.8 + j * 0.5) * 0.13;
        return [part(boxGeo(x + ox, -0.2, z, 0.25, 0.11, 0.11 + out + 0.14),
                     [186 - (i * 7 + j * 3) % 26, 96, 74])];
      });
      obj(g, mergeC(ps), 0.55, 0, 0, 32, 1); }],

    ['Shingle roof', function (g, t) {
      var ps = fieldAt(7, 8, 0.52, function (i, j, x, z) {
        var ox = (j % 2) * 0.26;
        var flap = Math.max(0, Math.sin(t * 0.003 - j * 0.7 + i * 0.2)) * 0.5;
        return [part(xfG(boxGeo(0, 0, 0, 0.24, 0.04, 0.3), -0.5 - flap, 0, 0,
                         x + ox, -0.2 + flap * 0.2, z), [120 + j * 10, 100 + j * 8, 92])];
      });
      obj(g, mergeC(ps), 0.9, 0, 0, 32, 0); }],

    ['Scale armour', function (g, t) {
      var ps = fieldAt(8, 9, 0.46, function (i, j, x, z) {
        var ox = (j % 2) * 0.23;
        var lift = Math.max(0, Math.sin(t * 0.0034 - j * 0.6)) * 0.18;
        return [part(xfG(scG(prism(discO(0.26, 9), 0.05), 1, 1.25, 1), -1.0, 0, 0,
                         x + ox, -0.2 + lift, z), [168 + j * 6, 176 + j * 5, 190])];
      });
      obj(g, mergeC(ps), 0.85, 0, 0, 32, 0); }],

    ['Parquet floor', function (g, t) {
      var ps = fieldAt(4, 4, 1.05, function (i, j, x, z) {
        var out = [], k;
        var turn = (i + j) % 2;
        var lift = Math.sin(t * 0.0022 + i * 0.8 + j * 0.8) * 0.1;
        for (k = 0; k < 4; k++)
          out.push(part(boxGeo(x + (turn ? 0 : (k - 1.5) * 0.23), -0.2 + lift,
                               z + (turn ? (k - 1.5) * 0.23 : 0),
                               turn ? 0.44 : 0.1, 0.05, turn ? 0.1 : 0.44),
                        turn ? [190, 142, 84] : [158, 112, 62]));
        return out;
      });
      obj(g, mergeC(ps), 1.05, 0, 0, 28, 0); }],

    ['Chevron rows', function (g, t) {
      var ps = fieldAt(8, 8, 0.5, function (i, j, x, z) {
        var up = i % 2;
        var h = 0.08 + (Math.sin(t * 0.0032 - j * 0.7 + i * 0.3) * 0.5 + 0.5) * 0.4;
        return [part(xfG(boxGeo(0, 0, 0, 0.3, h, 0.1), 0, up ? 0.7 : -0.7, 0,
                         x, h - 0.3, z), up ? [232, 168, 90] : [70, 130, 190])];
      });
      obj(g, mergeC(ps), 1.0, 0, 0, 32, 0); }],

    ['Zigzag tiling', function (g, t) {
      var ps = [], i, j;
      for (j = 0; j < 8; j++) for (i = 0; i < 9; i++) {
        var x = (i - 4) * 0.42, z = (j - 3.5) * 0.46;
        var y = -0.2 + Math.sin(i * 1.6) * 0.12 + Math.sin(t * 0.0028 - j * 0.6) * 0.14;
        ps.push(part(xfG(boxGeo(0, 0, 0, 0.24, 0.05, 0.22), 0, 0, (i % 2 ? 1 : -1) * 0.6,
                         x, y, z), i % 2 ? [220, 200, 120] : [110, 170, 200]));
      }
      obj(g, mergeC(ps), 0.95, 0, 0, 32, 0); }],

    ['Octagon tiling', function (g, t) {
      var ps = fieldAt(5, 5, 0.82, function (i, j, x, z) {
        var h = 0.1 + (Math.sin(t * 0.0026 + i * 0.6 + j * 0.6) * 0.5 + 0.5) * 0.4;
        var out = [part(xfG(prism(discO(0.34, 8, Math.PI / 8), h), Math.PI / 2, 0, 0,
                            x, h - 0.3, z), [200, 210, 226])];
        if (i < 4 && j < 4)
          out.push(part(xfG(prism(discO(0.16, 4), 0.06), Math.PI / 2, 0, 0,
                            x + 0.41, -0.28, z + 0.41), [226, 140, 100]));
        return out;
      });
      obj(g, mergeC(ps), 1.0, 0, 0, 28, 0); }],

    ['Star tiling', function (g, t) {
      var ps = fieldAt(5, 5, 0.86, function (i, j, x, z) {
        var a = t * 0.0011 * ((i + j) % 2 ? 1 : -1);
        return [part(xfG(prism(starO(0.4, 0.17, 8), 0.08), Math.PI / 2, a, 0, x, -0.2, z),
                     [226, 190, 90]),
                part(xfG(prism(discO(0.16, 8), 0.1), Math.PI / 2, -a, 0, x, -0.16, z),
                     [90, 150, 200])];
      });
      obj(g, mergeC(ps), 1.0, 0, 0, 28, 0); }],

    ['Sine field', function (g, t) {
      var ps = fieldOf(11, 11, 0.36, function (i, j, x, z) {
        var h = Math.sin(x * 1.6 + t * 0.004) * 0.4 + Math.sin(z * 1.3 - t * 0.003) * 0.3;
        return [h * 0.5 - 0.1, Math.abs(h) * 0.5 + 0.05,
                [110 + h * 90, 170 + h * 60, 230]];
      });
      obj(g, mergeC(ps), 0.95, 0, 0, 30, 0); }],

    ['Ripple rings', function (g, t) {
      var ps = fieldOf(12, 12, 0.33, function (i, j, x, z) {
        var r = Math.sqrt(x * x + z * z);
        var h = Math.sin(r * 3.2 - t * 0.006) * 0.35 / (1 + r * 0.5);
        return [h - 0.1, Math.abs(h) * 0.6 + 0.04, [130, 190 + h * 120, 230]];
      });
      obj(g, mergeC(ps), 0.95, 0, 0, 30, 0); }],

    ['Cross waves', function (g, t) {
      var ps = fieldOf(11, 11, 0.36, function (i, j, x, z) {
        var h = Math.sin(x * 2.2 + t * 0.005) * Math.sin(z * 2.2 - t * 0.004) * 0.45;
        return [h - 0.1, Math.abs(h) * 0.6 + 0.04,
                h > 0 ? [230, 150, 110] : [110, 160, 220]];
      });
      obj(g, mergeC(ps), 0.95, 0, 0, 30, 0); }],

    ['Travelling wave', function (g, t) {
      var ps = fieldOf(12, 9, 0.36, function (i, j, x, z) {
        var h = Math.sin(x * 1.8 - t * 0.006) * 0.42;
        return [h - 0.1, 0.06 + Math.abs(h) * 0.5, [200 + h * 50, 140 + h * 90, 220]];
      });
      obj(g, mergeC(ps), 0.95, 0, 0, 30, 0); }],

    ['Standing wave', function (g, t) {
      var ps = fieldOf(12, 9, 0.36, function (i, j, x, z) {
        var h = Math.sin(x * 2.4) * Math.cos(t * 0.005) * 0.45;
        return [h - 0.1, 0.06 + Math.abs(h) * 0.5, [230, 190 - h * 70, 120 + h * 90]];
      });
      obj(g, mergeC(ps), 0.95, 0, 0, 30, 0); }],

    ['Mexican wave', function (g, t) {
      var ps = fieldOf(13, 6, 0.34, function (i, j, x, z) {
        var ph = (t * 0.0016 - i * 0.09) % 1;
        var h = ph > 0 && ph < 0.25 ? Math.sin(ph / 0.25 * Math.PI) * 0.55 : 0;
        return [h - 0.1, 0.09 + h * 0.4, [220, 150 + h * 100, 90]];
      });
      obj(g, mergeC(ps), 0.9, 0, 0, 30, 0); }],

    ['Wave interference', function (g, t) {
      var ps = fieldOf(12, 12, 0.34, function (i, j, x, z) {
        var r1 = Math.sqrt((x - 0.9) * (x - 0.9) + z * z);
        var r2 = Math.sqrt((x + 0.9) * (x + 0.9) + z * z);
        var h = (Math.sin(r1 * 4 - t * 0.006) + Math.sin(r2 * 4 - t * 0.006)) * 0.2;
        return [h - 0.1, Math.abs(h) * 0.6 + 0.04, [140 + h * 120, 180, 230 - h * 60]];
      });
      obj(g, mergeC(ps), 0.95, 0, 0, 30, 0); }],

    ['Plasma field', function (g, t) {
      var ps = fieldOf(12, 12, 0.34, function (i, j, x, z) {
        var v = Math.sin(x * 2 + t * 0.003) + Math.sin(z * 2.4 - t * 0.0025)
              + Math.sin((x + z) * 1.6 + t * 0.004);
        var h = v * 0.14;
        return [h - 0.1, 0.05 + Math.abs(h) * 0.4,
                [150 + v * 40, 110 + v * 30, 210 - v * 35]];
      });
      obj(g, mergeC(ps), 0.95, 0, 0, 30, 0); }],

    ['Breathing grid', function (g, t) {
      var b = 0.5 + Math.sin(t * 0.0022) * 0.35;
      var ps = fieldAt(9, 9, 0.42, function (i, j, x, z) {
        var s2 = 0.06 + b * 0.15;
        return [part(boxGeo(x, -0.2, z, s2, 0.06, s2), [220, 200 - b * 70, 120 + b * 100])];
      });
      obj(g, mergeC(ps), 1.0, 0, 0, 30, 0); }],

    ['Pulse lattice', function (g, t) {
      var ps = fieldAt(7, 7, 0.52, function (i, j, x, z) {
        var d = Math.sqrt(i * i + j * j);
        var p2 = Math.max(0, Math.sin(t * 0.005 - d * 0.8));
        return [part(ovalGeo(x, -0.2, z, 0.1 + p2 * 0.14, 0.1 + p2 * 0.14, 0.1 + p2 * 0.14,
                             3, 7), [110 + p2 * 140, 200, 230])];
      });
      obj(g, mergeC(ps), 0.95, 0, 0, 30, 0); }],

    ['Swell rows', function (g, t) {
      var ps = fieldAt(10, 7, 0.4, function (i, j, x, z) {
        var h = Math.sin(z * 1.4 - t * 0.0035) * 0.3;
        return [part(boxGeo(x, h - 0.15, z, 0.18, 0.06, 0.18),
                     [60 + h * 60, 130 + h * 80, 190 + h * 50])];
      });
      obj(g, mergeC(ps), 0.9, 0, 0, 30, 0); }],

    ['Chop field', function (g, t) {
      var ps = fieldAt(11, 11, 0.36, function (i, j, x, z) {
        var h = (Math.sin(x * 3.1 + t * 0.005) + Math.sin(z * 2.7 - t * 0.006)) * 0.16;
        return [part(xfG(prism(discO(0.18, 4), 0.05), Math.PI / 2, (i + j) * 0.4, 0,
                         x, h - 0.15, z), [90 + h * 100, 150 + h * 90, 210])];
      });
      obj(g, mergeC(ps), 0.95, 0, 0, 30, 0); }],

    ['Caustic net', function (g, t) {
      var ps = [], i, j;
      for (j = 0; j < 10; j++) for (i = 0; i < 10; i++) {
        var x = (i - 4.5) * 0.4, z = (j - 4.5) * 0.4;
        var w = Math.sin(x * 2 + t * 0.004) * Math.sin(z * 2 - t * 0.003);
        var b = 0.5 + w * 0.5;
        ps.push(part(boxGeo(x + w * 0.08, -0.2, z - w * 0.08,
                            0.16 + b * 0.06, 0.02, 0.16 + b * 0.06),
                     [120 + b * 130, 190 + b * 60, 220]));
      }
      obj(g, mergeC(ps), 1.0, 0, 0, 30, 0); }],

    ['Spiral wave', function (g, t) {
      var ps = fieldOf(12, 12, 0.34, function (i, j, x, z) {
        var a = Math.atan2(z, x), r = Math.sqrt(x * x + z * z);
        var h = Math.sin(a * 2 + r * 2.6 - t * 0.005) * 0.3;
        return [h - 0.1, Math.abs(h) * 0.6 + 0.04, [210 + h * 40, 140 + h * 90, 190]];
      });
      obj(g, mergeC(ps), 0.95, 0, 0, 30, 0); }],

    ['Radial pulse', function (g, t) {
      var ps = [], k, i;
      for (k = 1; k <= 6; k++) {
        var n = k * 5;
        var p2 = Math.max(0, Math.sin(t * 0.004 - k * 0.7));
        for (i = 0; i < n; i++) {
          var a = i / n * TAU + k * 0.2;
          var R = k * 0.28;
          ps.push(part(boxGeo(Math.cos(a) * R, -0.2 + p2 * 0.2, Math.sin(a) * R,
                              0.07, 0.05 + p2 * 0.12, 0.07),
                       [230, 140 + p2 * 100, 90 + k * 20]));
        }
      }
      obj(g, mergeC(ps), 0.95, 0, 0, 30, 0); }],

    ['Diagonal sweep', function (g, t) {
      var ps = fieldOf(11, 11, 0.36, function (i, j, x, z) {
        var ph = ((x + z) * 0.5 + t * 0.0022) % 1.4;
        var h = ph > 0 && ph < 0.5 ? Math.sin(ph / 0.5 * Math.PI) * 0.45 : 0;
        return [h - 0.12, 0.06 + h * 0.4, [150 + h * 120, 200, 160 + h * 80]];
      });
      obj(g, mergeC(ps), 0.95, 0, 0, 30, 0); }],

    ['Corner wave', function (g, t) {
      var ps = fieldOf(11, 11, 0.36, function (i, j, x, z) {
        var d = Math.sqrt((x + 1.8) * (x + 1.8) + (z + 1.8) * (z + 1.8));
        var h = Math.sin(d * 2.4 - t * 0.005) * 0.32;
        return [h - 0.1, Math.abs(h) * 0.6 + 0.04, [230 - h * 60, 170, 120 + h * 110]];
      });
      obj(g, mergeC(ps), 0.95, 0, 0, 30, 0); }],

    ['Twisting rows', function (g, t) {
      var ps = fieldAt(9, 8, 0.42, function (i, j, x, z) {
        var a = Math.sin(t * 0.003 - j * 0.6) * 1.1;
        return [part(xfG(boxGeo(0, 0, 0, 0.17, 0.05, 0.17), 0, a, 0, x, -0.2, z),
                     [200 + j * 6, 150 + j * 10, 110 + j * 14])];
      });
      obj(g, mergeC(ps), 1.0, 0, 0, 30, 0); }],

    ['Rolling columns', function (g, t) {
      var ps = fieldAt(9, 7, 0.42, function (i, j, x, z) {
        var a = t * 0.0025 + i * 0.5;
        return [part(xfG(cylGeo(0, 0, 0, 0.13, 0.13, 0.34, 8, 'x'), 0, 0, a, x, -0.2, z),
                     [190, 170 + i * 6, 140 + j * 10])];
      });
      obj(g, mergeC(ps), 0.95, 0, 0, 30, 0); }],

    ['Shear waves', function (g, t) {
      var ps = fieldAt(10, 9, 0.38, function (i, j, x, z) {
        var sh = Math.sin(t * 0.003 - j * 0.5) * 0.22;
        return [part(boxGeo(x + sh, -0.2, z, 0.16, 0.05, 0.16),
                     [140 + j * 10, 190, 220 - j * 12])];
      });
      obj(g, mergeC(ps), 1.0, 0, 0, 30, 0); }],

    ['Spinning tiles', function (g, t) {
      var ps = fieldAt(8, 8, 0.46, function (i, j, x, z) {
        var a = t * 0.003 + (i + j) * 0.4;
        return [part(xfG(prism(discO(0.2, 4), 0.04), Math.PI / 2, a, 0, x, -0.2, z),
                     (i + j) % 2 ? [230, 160, 90] : [100, 170, 220])];
      });
      obj(g, mergeC(ps), 1.0, 0, 0, 30, 0); }],

    ['Flipping tiles', function (g, t) {
      var ps = fieldAt(8, 8, 0.46, function (i, j, x, z) {
        var a = Math.sin(t * 0.0026 + i * 0.5 + j * 0.5) * 1.5;
        return [part(xfG(boxGeo(0, 0, 0, 0.19, 0.19, 0.025), a, 0, 0, x, -0.15, z),
                     [220, 190, 110])];
      });
      obj(g, mergeC(ps), 0.85, 0, 0, 30, 0); }],

    ['Cascading flips', function (g, t) {
      var ps = fieldAt(9, 8, 0.42, function (i, j, x, z) {
        var ph = t * 0.0022 - i * 0.35;
        var a = Math.max(0, Math.min(Math.PI, (ph % 3) * 2));
        return [part(xfG(boxGeo(0, 0, 0, 0.17, 0.17, 0.02), a, 0, 0, x, -0.15, z),
                     Math.cos(a) > 0 ? [230, 200, 120] : [80, 120, 190])];
      });
      obj(g, mergeC(ps), 0.85, 0, 0, 30, 0); }],

    ['Rotor field', function (g, t) {
      var ps = fieldAt(6, 6, 0.66, function (i, j, x, z) {
        var a = t * 0.004 * ((i + j) % 2 ? 1 : -1), out = [], k;
        for (k = 0; k < 3; k++)
          out.push(part(xfG(boxGeo(0, 0, 0, 0.24, 0.03, 0.06), 0, a + k * TAU / 3, 0,
                            x, -0.2, z), [210 - k * 30, 170, 120 + k * 40]));
        return out;
      });
      obj(g, mergeC(ps), 1.0, 0, 0, 30, 0); }],

    ['Gear field', function (g, t) {
      var ps = fieldAt(5, 5, 0.8, function (i, j, x, z) {
        var dir = (i + j) % 2 ? 1 : -1;
        var a = t * 0.0022 * dir, out = [], k;
        out.push(part(xfG(cylGeo(0, 0, 0, 0.26, 0.26, 0.1, 10), Math.PI / 2, 0, 0,
                          x, -0.2, z), [176, 150, 90]));
        for (k = 0; k < 8; k++) {
          var b = a + k * TAU / 8;
          out.push(part(xfG(boxGeo(0, 0, 0, 0.07, 0.05, 0.07), 0, b, 0,
                            x + Math.cos(b) * 0.3, -0.2, z + Math.sin(b) * 0.3),
                        [200, 172, 104]));
        }
        return out;
      });
      obj(g, mergeC(ps), 1.0, 0, 0, 28, 0); }],

    ['Windmill array', function (g, t) {
      var ps = fieldAt(5, 5, 0.8, function (i, j, x, z) {
        var a = t * 0.003 + (i + j) * 0.5, out = [], k;
        out.push(part(cylGeo(x, -0.35, z, 0.055, 0.08, 0.8, 6), [150, 146, 136]));
        for (k = 0; k < 4; k++)
          out.push(part(xfG(boxGeo(0, 0.2, 0, 0.07, 0.22, 0.02), 0, 0, a + k * TAU / 4,
                            x, 0.22, z + 0.1), [232, 228, 216]));
        out.push(part(ovalGeo(x, 0.22, z + 0.12, 0.06, 0.06, 0.05, 3, 5), [120, 116, 108]));
        return out;
      });
      obj(g, mergeC(ps), 0.5, 0, 0, 28, 0); }],

    ['Turning cubes', function (g, t) {
      var ps = fieldAt(7, 7, 0.52, function (i, j, x, z) {
        var a = t * 0.0018 + i * 0.4, b = t * 0.0014 + j * 0.4;
        return [part(xfG(boxGeo(0, 0, 0, 0.16, 0.16, 0.16), a, b, 0, x, -0.2, z),
                     [180 + i * 8, 150 + j * 10, 210])];
      });
      obj(g, mergeC(ps), 0.9, 0, 0, 30, 1); }],

    ['Tumbling blocks', function (g, t) {
      /* three rhombi to a cell, which the eye assembles into cubes */
      var wob = Math.sin(t * 0.0016) * 0.12;
      var ps = [], i, j, k;
      var rh = [[0, 0], [0.32, 0.19], [0.32, 0.57], [0, 0.38]];
      for (j = 0; j < 6; j++) for (i = 0; i < 6; i++) {
        var x = (i - 2.5) * 0.64 + (j % 2) * 0.32, y = (2.5 - j) * 0.56;
        for (k = 0; k < 3; k++) {
          var a = k * TAU / 3 + wob;
          ps.push(part(xfG(prism(rh, 0.015), 0, 0, a, x, y, k * 0.01),
                       [[240, 234, 218], [170, 162, 148], [96, 90, 84]][k]));
        }
      }
      obj(g, mergeC(ps), 0.05, 0, 0, 30, 0); }],

    ['Pivot grid', function (g, t) {
      var ps = fieldAt(8, 8, 0.46, function (i, j, x, z) {
        var a = Math.sin(t * 0.0024 + i * 0.6) * 0.9;
        return [part(xfG(boxGeo(0, 0, 0, 0.2, 0.04, 0.07), 0, 0, a, x, -0.2, z),
                     [220, 160 + i * 8, 100 + j * 12])];
      });
      obj(g, mergeC(ps), 0.95, 0, 0, 30, 0); }],

    ['Louvre blinds', function (g, t) {
      var ps = [], i;
      var a = Math.sin(t * 0.0018) * 1.2;
      for (i = 0; i < 12; i++)
        ps.push(part(xfG(boxGeo(0, 0, 0, 1.6, 0.02, 0.17), a, 0, 0,
                         0, 1.15 - i * 0.21, 0), [198, 202, 210]));
      for (i = 0; i < 2; i++)
        ps.push(part(boxGeo((i ? 1 : -1) * 1.65, 0, 0, 0.06, 1.3, 0.06), [140, 144, 152]));
      obj(g, mergeC(ps), 0.1, 0, 0, 30, 0); }],

    ['Shutter rows', function (g, t) {
      var ps = [], i, j;
      for (j = 0; j < 6; j++) for (i = 0; i < 8; i++) {
        var a = Math.sin(t * 0.0026 - j * 0.5 + i * 0.2) * 1.4;
        ps.push(part(xfG(boxGeo(0, 0, 0, 0.19, 0.19, 0.02), 0, a, 0,
                         (i - 3.5) * 0.42, (2.5 - j) * 0.42, 0), [206, 176, 120]));
      }
      obj(g, mergeC(ps), 0.1, 0, 0, 30, 0); }],

    ['Fan array', function (g, t) {
      var ps = fieldAt(5, 4, 0.82, function (i, j, x, z) {
        var out = [], k;
        var a = t * 0.006 + i * 0.4 + j * 0.3;
        for (k = 0; k < 4; k++)
          out.push(part(xfG(scG(prism(discO(0.15, 7), 0.02), 1, 2.1, 1), 0, 0, a + k * TAU / 4,
                            x + Math.cos(a + k * TAU / 4) * 0.16,
                            0.35 - j * 0.12 + Math.sin(a + k * TAU / 4) * 0.16, z),
                       [214, 218, 228]));
        out.push(part(ovalGeo(x, 0.35 - j * 0.12, z + 0.04, 0.08, 0.08, 0.06, 3, 6),
                      [130, 134, 142]));
        out.push(part(cylGeo(x, -0.3, z, 0.05, 0.07, 1.0, 6), [120, 124, 132]));
        return out;
      });
      obj(g, mergeC(ps), 0.25, 0, 0, 28, 0); }],

    ['Propeller grid', function (g, t) {
      var ps = fieldAt(6, 6, 0.66, function (i, j, x, z) {
        var a = t * 0.008 * ((i + j) % 2 ? 1 : -1), out = [], k;
        for (k = 0; k < 2; k++)
          out.push(part(xfG(boxGeo(0, 0, 0, 0.28, 0.02, 0.06), 0, a + k * Math.PI / 2, 0,
                            x, -0.15, z), [226, 206, 150]));
        out.push(part(ovalGeo(x, -0.15, z, 0.06, 0.06, 0.06, 3, 5), [120, 116, 108]));
        return out;
      });
      obj(g, mergeC(ps), 1.0, 0, 0, 30, 0); }],

    ['Swinging pendula', function (g, t) {
      var ps = [], i;
      for (i = 0; i < 11; i++) {
        var a = Math.sin(t * (0.0022 + i * 0.00013)) * 0.7;
        var x = (i - 5) * 0.34;
        ps.push(part(barGeo(x, 1.15, 0, x + Math.sin(a) * 1.5, 1.15 - Math.cos(a) * 1.5, 0,
                            0.018), [190, 190, 200]));
        ps.push(part(ovalGeo(x + Math.sin(a) * 1.65, 1.15 - Math.cos(a) * 1.65, 0,
                             0.13, 0.13, 0.13, 3, 7), [226, 176, 70]));
      }
      ps.push(part(boxGeo(0, 1.25, 0, 2.0, 0.07, 0.1), [120, 112, 100]));
      obj(g, mergeC(ps), 0.06, 0, 0, 28, 0); }],

    ['Metronome bank', function (g, t) {
      var ps = [], i;
      for (i = 0; i < 7; i++) {
        var a = Math.sin(t * 0.004 + i * 0.5) * 0.45;
        var x = (i - 3) * 0.56;
        ps.push(part(xfG(prism([[-0.22, -0.7], [0.22, -0.7], [0.08, 0.6], [-0.08, 0.6]], 0.12),
                         0, 0, 0, x, 0, 0), [150, 100, 56]));
        ps.push(part(xfG(barGeo(0, -0.55, 0.14, 0, 0.9, 0.14, 0.025), 0, 0, a, x, 0, 0),
                     [220, 216, 206]));
        ps.push(part(xfG(boxGeo(0, 0.45, 0.14, 0.09, 0.07, 0.05), 0, 0, a, x, 0, 0),
                     [70, 72, 80]));
      }
      obj(g, mergeC(ps), 0.08, 0, 0, 28, 0); }],

    ['Piston bank', function (g, t) {
      var ps = [], i;
      for (i = 0; i < 8; i++) {
        var y = Math.sin(t * 0.005 + i * 0.78) * 0.4;
        var x = (i - 3.5) * 0.44;
        ps.push(part(cylGeo(x, -0.55, 0, 0.15, 0.15, 0.9, 8), [110, 114, 124]));
        ps.push(part(cylGeo(x, 0.15 + y, 0, 0.11, 0.11, 0.7, 8), [206, 210, 218]));
        ps.push(part(cylGeo(x, 0.55 + y, 0, 0.17, 0.17, 0.14, 8), [180, 150, 90]));
      }
      obj(g, mergeC(ps), 0.14, 0, 0, 28, 0); }],

    ['Lever array', function (g, t) {
      var ps = fieldAt(7, 5, 0.56, function (i, j, x, z) {
        var a = Math.sin(t * 0.003 + i * 0.6 - j * 0.4) * 0.8;
        return [part(xfG(boxGeo(0, 0, 0, 0.26, 0.035, 0.06), 0, 0, a, x, -0.1, z),
                     [206, 176, 100]),
                part(cylGeo(x, -0.35, z, 0.04, 0.05, 0.5, 6), [130, 126, 118])];
      });
      obj(g, mergeC(ps), 0.35, 0, 0, 30, 0); }],

    ['Cam field', function (g, t) {
      var ps = fieldAt(6, 5, 0.62, function (i, j, x, z) {
        var a = t * 0.003 + i * 0.5 + j * 0.3;
        var lift = (Math.sin(a) * 0.5 + 0.5) * 0.28;
        return [part(xfG(scG(prism(discO(0.2, 10), 0.05), 1, 1.5, 1), 0, 0, a, x, -0.35, z),
                     [176, 150, 96]),
                part(boxGeo(x, 0.02 + lift, z, 0.06, 0.22, 0.06), [214, 218, 226])];
      });
      obj(g, mergeC(ps), 0.3, 0, 0, 28, 0); }],

    ['Escapement rows', function (g, t) {
      var ps = [], i, j;
      for (j = 0; j < 4; j++) for (i = 0; i < 5; i++) {
        var x = (i - 2) * 0.72, y = (1.5 - j) * 0.66;
        var a = Math.sin(t * 0.006 + j * 0.8) * 0.28;
        var k;
        for (k = 0; k < 10; k++)
          ps.push(part(xfG(boxGeo(0, 0.24, 0, 0.035, 0.06, 0.03), 0, 0,
                           t * 0.0016 + k * TAU / 10, x, y, 0), [190, 164, 100]));
        ps.push(part(xfG(boxGeo(0, 0.3, 0, 0.14, 0.04, 0.04), 0, 0, a, x, y + 0.1, 0.06),
                     [216, 220, 228]));
      }
      obj(g, mergeC(ps), 0.1, 0, 0, 30, 0); }],

    ['Rocking tiles', function (g, t) {
      var ps = fieldAt(8, 8, 0.46, function (i, j, x, z) {
        var a = Math.sin(t * 0.0028 + i * 0.5) * 0.5;
        var b = Math.cos(t * 0.0028 + j * 0.5) * 0.5;
        return [part(xfG(boxGeo(0, 0, 0, 0.19, 0.025, 0.19), a, 0, b, x, -0.2, z),
                     [200 + i * 6, 180, 130 + j * 12])];
      });
      obj(g, mergeC(ps), 0.9, 0, 0, 30, 0); }],

    ['Op art waves', function (g, t) {
      var ps = [], i, j;
      for (j = 0; j < 22; j++) {
        var y = 1.25 - j * 0.115;
        for (i = 0; i < 15; i++) {
          var x = (i - 7) * 0.26;
          var w = 0.1 + (Math.sin(x * 1.6 + t * 0.003 + j * 0.3) * 0.5 + 0.5) * 0.1;
          ps.push(part(boxGeo(x, y, 0, w, 0.05, 0.02),
                       (i + j) % 2 ? [244, 242, 234] : [26, 26, 34]));
        }
      }
      obj(g, mergeC(ps), 0.06, 0, 0, 30, 0); }],

    ['Riley curves', function (g, t) {
      var ps = [], i, j;
      for (j = 0; j < 16; j++) for (i = 0; i < 18; i++) {
        var x = (i - 8.5) * 0.21;
        var y = 1.2 - j * 0.16 + Math.sin(x * 1.4 + t * 0.0026 + j * 0.2) * 0.12;
        ps.push(part(boxGeo(x, y, 0, 0.095, 0.06, 0.02),
                     i % 2 ? [242, 240, 232] : [28, 28, 36]));
      }
      obj(g, mergeC(ps), 0.06, 0, 0, 30, 0); }],

    ['Vasarely grid', function (g, t) {
      var ps = fieldAt(9, 9, 0.4, function (i, j, x, z) {
        var d = Math.sqrt(x * x + z * z);
        var s2 = 0.08 + (1 - Math.min(1, d / 1.8)) * 0.1
               + Math.sin(t * 0.0022 - d * 1.6) * 0.03;
        return [part(ovalGeo(x, -0.2, z, s2, s2, s2, 3, 8),
                     (i + j) % 2 ? [242, 240, 230] : [40, 46, 70])];
      });
      obj(g, mergeC(ps), 1.0, 0, 0, 30, 0); }],

    ['Warping checks', function (g, t) {
      var ps = [], i, j;
      for (j = 0; j < 11; j++) for (i = 0; i < 11; i++) {
        var x = (i - 5) * 0.3, y = (5 - j) * 0.26;
        var w = Math.sin(x * 1.2 + t * 0.0024) * 0.09;
        ps.push(part(boxGeo(x + w, y + w * 0.6, 0, 0.14, 0.12, 0.02),
                     (i + j) % 2 ? [244, 242, 234] : [30, 30, 38]));
      }
      obj(g, mergeC(ps), 0.06, 0, 0, 30, 0); }],

    ['Bulge field', function (g, t) {
      var b = 0.6 + Math.sin(t * 0.0018) * 0.4;
      var ps = [], i, j;
      for (j = 0; j < 11; j++) for (i = 0; i < 11; i++) {
        var x = (i - 5) * 0.3, y = (5 - j) * 0.26;
        var d = Math.sqrt(x * x + y * y) / 2.2;
        var s2 = 0.07 + (1 - Math.min(1, d)) * 0.09 * b;
        ps.push(part(boxGeo(x, y, 0, s2, s2, 0.02),
                     (i + j) % 2 ? [244, 242, 234] : [28, 28, 36]));
      }
      obj(g, mergeC(ps), 0.06, 0, 0, 30, 0); }],

    ['Pinch field', function (g, t) {
      var p2 = 0.5 + Math.sin(t * 0.002) * 0.4;
      var ps = [], i, j;
      for (j = 0; j < 11; j++) for (i = 0; i < 11; i++) {
        var x = (i - 5) * 0.3, y = (5 - j) * 0.26;
        var d = Math.max(0.25, Math.sqrt(x * x + y * y));
        var f = 1 - p2 * 0.45 / d;
        ps.push(part(boxGeo(x * f, y * f, 0, 0.11, 0.1, 0.02),
                     (i + j) % 2 ? [240, 226, 200] : [60, 50, 90]));
      }
      obj(g, mergeC(ps), 0.06, 0, 0, 30, 0); }],

    ['Twist field', function (g, t) {
      var ps = [], i, j;
      for (j = 0; j < 11; j++) for (i = 0; i < 11; i++) {
        var x = (i - 5) * 0.3, y = (5 - j) * 0.28;
        var r = Math.sqrt(x * x + y * y), a = Math.atan2(y, x);
        var tw = Math.sin(t * 0.0016) * 0.7 * (1 - Math.min(1, r / 2));
        ps.push(part(boxGeo(Math.cos(a + tw) * r, Math.sin(a + tw) * r, 0, 0.1, 0.1, 0.02),
                     (i + j) % 2 ? [238, 234, 222] : [46, 60, 92]));
      }
      obj(g, mergeC(ps), 0.06, 0, 0, 30, 0); }],

    ['Moire drift', function (g, t) {
      var ps = [], k, i;
      for (k = 0; k < 2; k++) {
        var a = k ? Math.sin(t * 0.0009) * 0.22 : 0;
        for (i = 0; i < 26; i++)
          ps.push(part(xfG(boxGeo(0, 0, 0, 0.025, 1.35, 0.02), 0, 0, a,
                           (i - 12.5) * 0.14, 0, k * 0.06),
                       k ? [230, 120, 150] : [110, 190, 230]));
      }
      obj(g, mergeC(ps), 0.04, 0, 0, 30, 0); }],

    ['Interference bars', function (g, t) {
      var ps = [], i;
      for (i = 0; i < 40; i++) {
        var x = (i - 19.5) * 0.095;
        var v = Math.sin(x * 9 + t * 0.003) * Math.sin(x * 9.7 - t * 0.002);
        var b = 0.5 + v * 0.5;
        ps.push(part(boxGeo(x, 0, 0, 0.045, 1.25, 0.02),
                     [40 + b * 200, 44 + b * 190, 60 + b * 180]));
      }
      obj(g, mergeC(ps), 0.04, 0, 0, 30, 0); }],

    ['Stripe shear', function (g, t) {
      var ps = [], i, j;
      for (j = 0; j < 8; j++) {
        var off = Math.sin(t * 0.0022 + j * 0.7) * 0.28;
        for (i = 0; i < 14; i++)
          ps.push(part(boxGeo((i - 6.5) * 0.26 + off, 1.05 - j * 0.3, 0, 0.11, 0.13, 0.02),
                       i % 2 ? [242, 240, 232] : [40, 44, 62]));
      }
      obj(g, mergeC(ps), 0.06, 0, 0, 30, 0); }],

    ['Chevron drift', function (g, t) {
      var ps = [], i, j;
      for (j = 0; j < 10; j++) for (i = 0; i < 12; i++) {
        var ph = ((i * 0.12 + t * 0.0012) % 1);
        var x = (i - 5.5) * 0.3, y = 1.15 - j * 0.26;
        ps.push(part(xfG(boxGeo(0, 0, 0, 0.15, 0.05, 0.02), 0, 0,
                         (j % 2 ? 1 : -1) * 0.7, x, y + ph * 0.1, 0),
                     j % 2 ? [232, 170, 90] : [90, 160, 210]));
      }
      obj(g, mergeC(ps), 0.06, 0, 0, 30, 0); }],

    ['Radial op', function (g, t) {
      var ps = [], k, i;
      for (k = 0; k < 48; k++) {
        var a = k / 48 * TAU + Math.sin(t * 0.0012) * 0.2;
        for (i = 1; i <= 5; i++) {
          var R = i * 0.3;
          ps.push(part(xfG(boxGeo(0, 0, 0, 0.14, 0.05, 0.02), 0, 0, a,
                           Math.cos(a) * R, Math.sin(a) * R, 0),
                       (k + i) % 2 ? [244, 242, 234] : [30, 30, 40]));
        }
      }
      obj(g, mergeC(ps), 0.04, 0, 0, 30, 0); }],

    ['Concentric drift', function (g, t) {
      var ps = [], i;
      for (i = 0; i < 14; i++) {
        var R = 0.14 + i * 0.11;
        var off = Math.sin(t * 0.0022 - i * 0.5) * 0.12;
        ps.push(part(xfG(prism(ringO(R, 0.05, 24), 0.02), 0, 0, 0, off, 0, i * 0.005),
                     i % 2 ? [240, 238, 228] : [44, 52, 80]));
      }
      obj(g, mergeC(ps), 0.04, 0, 0, 30, 0); }],

    ['Lens grid', function (g, t) {
      var ps = fieldAt(9, 9, 0.4, function (i, j, x, z) {
        var s2 = 0.14 + Math.sin(t * 0.0024 + i * 0.5 + j * 0.5) * 0.05;
        return [part(ovalGeo(x, -0.16, z, s2, s2 * 0.5, s2, 4, 8), [186, 214, 232])];
      });
      g.globalAlpha = 0.85;
      obj(g, mergeC(ps), 1.0, 0, 0, 30, 0);
      g.globalAlpha = 1; }],

    ['Prism rows', function (g, t) {
      var ps = fieldAt(9, 7, 0.42, function (i, j, x, z) {
        var a = Math.sin(t * 0.0024 + i * 0.4) * 0.6;
        return [part(xfG(prism(discO(0.19, 3), 0.16), 0, 0, a, x, -0.2, z),
                     [200 + i * 5, 150 + j * 10, 220 - j * 10])];
      });
      obj(g, mergeC(ps), 0.9, 0, 0, 30, 0); }],

    ['Honeycomb pulse', function (g, t) {
      var ps = fieldAt(7, 7, 0.58, function (i, j, x, z) {
        var ox = (j % 2) * 0.29;
        var d = Math.sqrt((x + ox) * (x + ox) + z * z);
        var h = 0.1 + Math.max(0, Math.sin(t * 0.004 - d * 1.5)) * 0.42;
        return [part(xfG(prism(ringO(0.3, 0.07, 6), h), Math.PI / 2, 0, 0,
                         x + ox, h - 0.3, z), [232, 190 + h * 60, 90])];
      });
      obj(g, mergeC(ps), 1.0, 0, 0, 30, 0); }],

    ['Fish scales', function (g, t) {
      var ps = fieldAt(9, 10, 0.42, function (i, j, x, z) {
        var ox = (j % 2) * 0.21;
        var sh = Math.sin(t * 0.003 - j * 0.5 + i * 0.2);
        return [part(xfG(scG(prism(discO(0.24, 9), 0.04), 1, 1.2, 1), -0.9 - sh * 0.12, 0, 0,
                         x + ox, -0.2, z),
                     [120 + sh * 50, 180 + sh * 40, 200 + sh * 30])];
      });
      obj(g, mergeC(ps), 0.8, 0, 0, 32, 0); }],

    ['Feather rows', function (g, t) {
      var ps = fieldAt(8, 8, 0.46, function (i, j, x, z) {
        var ox = (j % 2) * 0.23;
        var sw = Math.sin(t * 0.0026 - j * 0.6) * 0.2;
        return [part(xfG(scG(prism(discO(0.2, 7), 0.02), 1, 1.8, 1), -1.0, sw, 0,
                         x + ox, -0.16, z), [200 - j * 8, 160 + i * 6, 130 + j * 10])];
      });
      obj(g, mergeC(ps), 0.8, 0, 0, 32, 0); }],

    ['Pine cone spiral', function (g, t) {
      var ps = [], i, n = 80;
      for (i = 0; i < n; i++) {
        var f = i / n;
        var a = i * 2.39996 + t * 0.0007;
        var r = Math.sin(f * Math.PI * 0.92) * 0.85 + 0.12;   /* fat in the middle */
        var y = -1.15 + f * 2.3;
        ps.push(part(xfG(scG(prism(discO(0.2, 5), 0.06), 1, 0.75, 1), -0.55, a, 0,
                         Math.cos(a) * r, y, Math.sin(a) * r),
                     [150 + (i % 5) * 14, 104 + (i % 4) * 16, 62]));
      }
      obj(g, mergeC(ps), 0.12, 0, 0, 30, 0); }],

    ['Phyllotaxis', function (g, t) {
      var ps = [], i;
      for (i = 0; i < 130; i++) {
        var a = i * 2.39996 + t * 0.0008;
        var r = Math.sqrt(i) * 0.14;
        ps.push(part(ovalGeo(Math.cos(a) * r, -0.2, Math.sin(a) * r,
                             0.04 + i * 0.0004, 0.03, 0.04 + i * 0.0004, 3, 6),
                     [220 - i * 0.6, 180 - i * 0.3, 90 + i * 0.5]));
      }
      obj(g, mergeC(ps), 1.0, 0, 0, 30, 0); }],

    ['Coral polyps', function (g, t) {
      var ps = fieldAt(7, 7, 0.52, function (i, j, x, z) {
        var out = [], k;
        var op = 0.5 + Math.sin(t * 0.003 + i * 0.7 + j * 0.5) * 0.5;
        out.push(part(cylGeo(x, -0.35, z, 0.09, 0.12, 0.4, 7), [206, 130, 130]));
        for (k = 0; k < 6; k++) {
          var a = k * TAU / 6;
          out.push(part(barGeo(x, -0.15, z,
                               x + Math.cos(a) * (0.08 + op * 0.16), -0.05 + op * 0.12,
                               z + Math.sin(a) * (0.08 + op * 0.16), 0.025),
                        [236, 170, 170]));
        }
        return out;
      });
      obj(g, mergeC(ps), 0.55, 0, 0, 30, 0); }],

    ['Cell division', function (g, t) {
      var c = (t % 4000) / 4000;
      var ps = fieldAt(6, 6, 0.6, function (i, j, x, z) {
        var ph = (c + (i * 3 + j * 5) % 7 / 7) % 1;
        var sep = ph < 0.5 ? 0 : (ph - 0.5) * 0.5;
        var r = 0.2 - sep * 0.2;
        return [part(ovalGeo(x - sep, -0.2, z, r, r, r, 4, 8), [170, 210, 170]),
                part(ovalGeo(x + sep, -0.2, z, r, r, r, 4, 8), [190, 225, 185])];
      });
      obj(g, mergeC(ps), 0.95, 0, 0, 30, 0); }],

    ['Bubble raft', function (g, t) {
      var ps = fieldAt(8, 8, 0.47, function (i, j, x, z) {
        var ox = (j % 2) * 0.235;
        var r = 0.18 + Math.sin(t * 0.0028 + i * 0.8 + j * 0.6) * 0.045;
        return [part(ovalGeo(x + ox, -0.2 + r * 0.4, z, r, r, r, 4, 9),
                     [200, 225, 240])];
      });
      g.globalAlpha = 0.8;
      obj(g, mergeC(ps), 0.9, 0, 0, 30, 0);
      g.globalAlpha = 1; }],

    ['Crystal growth', function (g, t) {
      var c = (t % 6000) / 6000;
      var ps = fieldAt(6, 6, 0.6, function (i, j, x, z) {
        var d = Math.sqrt(i * i + j * j) / 9;
        var grow = Math.max(0, Math.min(1, (c * 1.6 - d) * 3));
        if (grow <= 0) return null;
        var h = grow * 0.5;
        return [part(xfG(prism(discO(0.2 * grow, 6), h), Math.PI / 2, 0, 0,
                         x, h - 0.3, z), [170 + grow * 60, 200 + grow * 40, 240])];
      });
      obj(g, mergeC(ps), 0.95, 0, 0, 30, 0); }],

    ['Fern spiral', function (g, t) {
      var ps = [], k, i;
      for (k = 0; k < 5; k++) {
        var base = k * TAU / 5 + t * 0.0004;
        for (i = 0; i < 16; i++) {
          var f = i / 16;
          var a = base + f * 4;
          var r = 0.2 + f * 1.2;
          ps.push(part(xfG(scG(prism(discO(0.14 * (1 - f * 0.6), 6), 0.02), 1, 0.6, 1),
                           Math.PI / 2, a, 0,
                           Math.cos(a) * r, -0.2 + f * 0.1, Math.sin(a) * r),
                       [60 + f * 60, 130 + f * 70, 60]));
        }
      }
      obj(g, mergeC(ps), 0.9, 0, 0, 30, 0); }],

    ['Leaf veins', function (g, t) {
      var ps = [], i, k;
      ps.push(part(barGeo(0, -0.2, -1.4, 0, -0.2, 1.4, 0.05), [90, 150, 70]));
      for (i = 0; i < 12; i++) {
        var z = -1.25 + i * 0.23;
        var sw = Math.sin(t * 0.0024 - i * 0.5) * 0.1;
        for (k = 0; k < 2; k++) {
          var sd = k ? 1 : -1;
          ps.push(part(barGeo(0, -0.2, z, sd * (0.9 - Math.abs(z) * 0.35), -0.2 + sw,
                              z + 0.4, 0.03), [110, 175, 85]));
        }
      }
      obj(g, mergeC(ps), 0.95, 0, 0, 30, 0); }],

    ['Snakeskin', function (g, t) {
      var ps = fieldAt(9, 10, 0.42, function (i, j, x, z) {
        var ox = (j % 2) * 0.21;
        var w = Math.sin(t * 0.0026 - z * 1.6);
        return [part(xfG(scG(prism(discO(0.22, 4), 0.03), 1, 1.3, 1), -1.1, 0, 0,
                         x + ox + w * 0.06, -0.2, z),
                     (i + j) % 3 ? [150 + w * 30, 140, 90] : [70, 80, 60])];
      });
      obj(g, mergeC(ps), 0.8, 0, 0, 32, 0); }],

    ['Reptile scutes', function (g, t) {
      var ps = fieldAt(7, 8, 0.5, function (i, j, x, z) {
        var lift = Math.max(0, Math.sin(t * 0.003 - j * 0.6)) * 0.14;
        return [part(xfG(prism(discO(0.26, 6), 0.05), Math.PI / 2, (i + j) * 0.3, 0,
                         x, -0.2 + lift, z),
                     [96 + lift * 200, 118 + lift * 120, 76])];
      });
      obj(g, mergeC(ps), 0.9, 0, 0, 30, 0); }],

    ['Bark ridges', function (g, t) {
      var ps = [], i, j;
      for (j = 0; j < 14; j++) for (i = 0; i < 7; i++) {
        var x = (i - 3) * 0.5 + Math.sin(j * 0.7 + i) * 0.1;
        var y = 1.25 - j * 0.19;
        var d = 0.06 + (Math.sin(t * 0.0018 + i * 1.1 + j * 0.4) * 0.5 + 0.5) * 0.12;
        ps.push(part(boxGeo(x, y, 0, 0.16, 0.08, d), [96 + d * 200, 76 + d * 160, 56]));
      }
      obj(g, mergeC(ps), 0.1, 0, 0, 30, 0); }],

    ['Wave dunes', function (g, t) {
      var ps = fieldOf(11, 11, 0.36, function (i, j, x, z) {
        var h = Math.sin(z * 1.5 - t * 0.0014) * 0.3 + Math.sin(x * 0.8 + z * 0.5) * 0.12;
        return [h - 0.1, 0.05 + Math.abs(h) * 0.4, [216 + h * 30, 186 + h * 40, 130]];
      });
      obj(g, mergeC(ps), 0.9, 0, 0, 30, 0); }],

    ['Houndstooth', function (g, t) {
      var ps = fieldAt(7, 7, 0.54, function (i, j, x, z) {
        var dark = (i + j) % 2;
        var lift = Math.sin(t * 0.0024 + i * 0.5 + j * 0.5) * 0.08;
        return [part(xfG(prism([[-0.28, -0.28], [0.1, -0.28], [0.28, 0.1], [0.28, 0.28],
                                [-0.1, 0.28], [-0.28, -0.1]], 0.04),
                         Math.PI / 2, dark ? 0 : Math.PI, 0, x, -0.2 + lift, z),
                     dark ? [34, 34, 42] : [238, 236, 228])];
      });
      obj(g, mergeC(ps), 1.0, 0, 0, 30, 0); }],

    ['Argyle', function (g, t) {
      var ps = fieldAt(6, 6, 0.64, function (i, j, x, z) {
        var lift = Math.sin(t * 0.0022 + (i + j) * 0.6) * 0.1;
        var out = [part(xfG(prism([[0, 0.34], [0.26, 0], [0, -0.34], [-0.26, 0]], 0.04),
                              Math.PI / 2, 0, 0, x, -0.2 + lift, z),
                        (i + j) % 2 ? [186, 76, 92] : [70, 90, 140])];
        out.push(part(xfG(boxGeo(0, 0, 0, 0.02, 0.44, 0.02), Math.PI / 2, 0.72, 0,
                          x, -0.14 + lift, z), [230, 216, 180]));
        return out;
      });
      obj(g, mergeC(ps), 1.0, 0, 0, 28, 0); }],

    ['Tartan weave', function (g, t) {
      var ps = [], i;
      var drift = Math.sin(t * 0.0016) * 0.12;
      for (i = 0; i < 13; i++) {
        var w = (i % 3 === 0) ? 0.1 : 0.045;
        var c = (i % 3 === 0) ? [30, 60, 40] : (i % 2 ? [160, 30, 40] : [220, 200, 140]);
        ps.push(part(boxGeo((i - 6) * 0.29 + drift, 0, 0, w, 1.4, 0.03), c));
        ps.push(part(boxGeo(0, (i - 6) * 0.24 - drift, 0.05, 1.9, w, 0.03), c));
      }
      obj(g, mergeC(ps), 0.06, 0, 0, 28, 0); }],

    ['Gingham', function (g, t) {
      var ps = [], i, j;
      var ph = Math.sin(t * 0.002) * 0.1;
      for (j = 0; j < 11; j++) for (i = 0; i < 11; i++) {
        var v = ((i % 2) + (j % 2));
        ps.push(part(boxGeo((i - 5) * 0.3 + ph, (5 - j) * 0.26 - ph, v * 0.01,
                            0.145, 0.125, 0.02),
                     v === 2 ? [180, 60, 70] : v === 1 ? [222, 150, 158] : [246, 242, 234]));
      }
      obj(g, mergeC(ps), 0.06, 0, 0, 30, 0); }],

    ['Polka drift', function (g, t) {
      var ps = fieldAt(8, 8, 0.46, function (i, j, x, z) {
        var ox = (j % 2) * 0.23;
        var r = 0.11 + Math.sin(t * 0.0024 + i * 0.6 - j * 0.5) * 0.05;
        return [part(ovalGeo(x + ox, -0.2, z, r, 0.05, r, 3, 9), [236, 120, 150])];
      });
      obj(g, mergeC(ps), 1.0, 0, 0, 30, 0); }],

    ['Stripe weave', function (g, t) {
      var ps = fieldAt(8, 8, 0.46, function (i, j, x, z) {
        var over = (i + j) % 2;
        var lift = Math.sin(t * 0.0026 + i * 0.5 + j * 0.5) * 0.05;
        return [part(boxGeo(x, -0.2 + (over ? 0.05 : 0) + lift, z,
                            over ? 0.21 : 0.08, 0.04, over ? 0.08 : 0.21),
                     over ? [206, 160, 90] : [110, 140, 170])];
      });
      obj(g, mergeC(ps), 1.0, 0, 0, 30, 0); }],

    ['Basket lattice', function (g, t) {
      var ps = [], i;
      var lift = Math.sin(t * 0.002) * 0.08;
      for (i = 0; i < 9; i++) {
        ps.push(part(boxGeo((i - 4) * 0.42, -0.2 + (i % 2 ? lift : -lift), 0,
                            0.13, 0.05, 1.8), [196, 158, 96]));
        ps.push(part(boxGeo(0, -0.2 + (i % 2 ? -lift : lift), (i - 4) * 0.42,
                            1.8, 0.05, 0.13), [166, 128, 74]));
      }
      obj(g, mergeC(ps), 1.0, 0, 0, 30, 0); }],

    ['Quilt blocks', function (g, t) {
      var ps = fieldAt(5, 5, 0.8, function (i, j, x, z) {
        var out = [], k;
        var a0 = t * 0.0008 * ((i + j) % 2 ? 1 : -1);
        for (k = 0; k < 4; k++)
          out.push(part(xfG(prism([[0, 0], [0.34, 0.34], [-0.34, 0.34]], 0.03),
                            Math.PI / 2, a0 + k * TAU / 4, 0, x, -0.2, z),
                        [[214, 96, 92], [236, 202, 120], [110, 150, 190],
                         [140, 186, 130]][k]));
        return out;
      });
      obj(g, mergeC(ps), 1.0, 0, 0, 28, 0); }],

    ['Mosaic drift', function (g, t) {
      var ps = fieldAt(10, 10, 0.38, function (i, j, x, z) {
        var n = (i * 7 + j * 13) % 5;
        var lift = Math.sin(t * 0.0022 + n * 1.2) * 0.07;
        return [part(xfG(prism(discO(0.17, 4), 0.03), Math.PI / 2, n * 0.3, 0,
                         x, -0.2 + lift, z),
                     [[214, 96, 92], [236, 202, 120], [110, 150, 190],
                      [140, 186, 130], [220, 216, 204]][n])];
      });
      obj(g, mergeC(ps), 1.0, 0, 0, 30, 0); }],

    ['Terrazzo', function (g, t) {
      var ps = [], i;
      obj(g, mergeC([part(boxGeo(0, -0.26, 0, 2.0, 0.05, 2.0), [226, 222, 210])]),
          1.0, 0, 0, 30, 0);
      for (i = 0; i < 70; i++) {
        var a = i * 2.399, r = Math.sqrt(i / 70) * 1.9;
        var lift = Math.sin(t * 0.0022 + i * 0.4) * 0.03;
        ps.push(part(xfG(prism(discO(0.07 + (i % 3) * 0.03, 5), 0.02),
                         Math.PI / 2, i * 0.7, 0,
                         Math.cos(a) * r, -0.2 + lift, Math.sin(a) * r),
                     [[206, 86, 82], [240, 196, 110], [96, 140, 180],
                      [130, 176, 120], [60, 60, 70]][i % 5]));
      }
      obj(g, mergeC(ps), 1.0, 0, 0, 30, 0); }]
  ];

  /* ================================================================
     MISCELLANY — 100 scenes on themes not used elsewhere on the set.
     ================================================================ */

  var MISC = [
    ['Pizza spinning', function (g, t) {
      var m = geo('pizza', function () {
        var ps = [part(lathe([[0, 0.06], [1.5, 0.06], [1.55, -0.02], [1.5, -0.09], [0, -0.09]], 16), [232, 196, 112])], i, a;
        ps.push(part(lathe([[0, 0.09], [1.34, 0.09], [1.34, 0.05]], 16), [186, 58, 42]));
        ps.push(part(lathe([[0, 0.12], [1.24, 0.12], [1.24, 0.08]], 16), [240, 206, 118]));
        for (i = 0; i < 8; i++) { a = i * TAU / 8;
          ps.push(part(cylGeo(Math.cos(a) * 0.9, 0.12, Math.sin(a) * 0.9, 0.22, 0.22, 0.06, 8), [176, 34, 44])); }
        for (i = 0; i < 7; i++) { a = i * TAU / 7 + 0.4;
          ps.push(part(boxGeo(Math.cos(a) * 0.5, 0.12, Math.sin(a) * 0.5, 0.1, 0.03, 0.1), [120, 168, 60])); }
        return mergeC(ps);
      });
      obj(g, m, 0.72, t * 0.0026, 0, 30, 0); }],

    ['Coffee pouring', function (g, t) {
      var c = (t % 4000) / 4000, i, ps = [];
      ps.push(part(lathe([[0.6, -0.9], [0.62, 0.5], [0.66, 0.56], [0.56, 0.56], [0.52, -0.84]], 14),
                   [214, 208, 198]));
      ps.push(part(lathe([[0, -0.8], [0.54, -0.8], [0.54, -0.8 + Math.min(1.2, c * 1.8)],
                          [0, -0.8 + Math.min(1.2, c * 1.8)]], 14), [58, 34, 22]));
      ps.push(part(torGeo(0.78, -0.14, 0, 0.3, 0.07, 10, 6, 'z'), [214, 208, 198]));
      ps.push(part(lathe([[0.7, 1.9], [0.75, 1.5], [0.3, 1.4], [0.28, 1.32]], 12), [150, 112, 76]));
      if (c < 0.72) ps.push(part(cylGeo(0.1, 0.7, 0, 0.07, 0.07, 1.3, 6), [78, 46, 28]));
      for (i = 0; i < 4; i++)
        ps.push(part(ovalGeo(-0.3 + Math.sin(t * 0.004 + i) * 0.2, 0.7 + i * 0.4, 0,
                             0.12 + i * 0.06, 0.1 + i * 0.05, 0.12, 3, 6), [226, 222, 214]));
      obj(g, mergeC(ps), 0.16, 0.5 + Math.sin(t * 0.0006) * 0.3, 0, 30, 0); }],

    ['Toast popping', function (g, t) {
      var c = (t % 3400) / 3400;
      var pop = c > 0.72 ? Math.sin((c - 0.72) / 0.28 * Math.PI) * 1.5 : 0;
      var ps = [part(lathe([[0, -0.7], [1.1, -0.7], [1.15, 0.3], [1.05, 0.36], [0, 0.36]], 4), [188, 194, 200])], i;
      ps.push(part(boxGeo(0, -0.72, 0, 1.2, 0.1, 0.7), [140, 146, 152]));
      for (i = 0; i < 2; i++)
        ps.push(part(boxGeo((i ? 1 : -1) * 0.42, 0.2 + pop, 0, 0.34, 0.44, 0.1), [206, 128, 66]));
      ps.push(part(ovalGeo(0.95, -0.3, 0.5, 0.11, 0.11, 0.11, 3, 6), c > 0.7 ? [240, 90, 60] : [110, 110, 118]));
      obj(g, mergeC(ps), 0.2, 0.6, 0, 34, 1); }],

    ['Egg frying', function (g, t) {
      var ps = [part(lathe([[0, -0.34], [1.3, -0.34], [1.36, 0.1], [1.28, 0.12], [1.22, -0.26], [0, -0.26]], 16),
                     [52, 52, 60])], i;
      ps.push(part(cylGeo(1.9, 0.0, 0, 0.1, 0.1, 1.2, 6, 'x'), [40, 40, 46]));
      ps.push(part(lathe([[0, -0.2], [0.95, -0.22], [0.88, -0.28]], 14), [246, 242, 232]));
      ps.push(part(ovalGeo(-0.1, -0.08, 0.06, 0.34, 0.16, 0.34, 4, 8), [238, 178, 40]));
      for (i = 0; i < 4; i++)
        ps.push(part(ovalGeo(Math.sin(t * 0.005 + i) * 0.3, 0.3 + i * 0.34, 0,
                             0.1 + i * 0.05, 0.09 + i * 0.04, 0.1, 3, 6), [232, 230, 222]));
      obj(g, mergeC(ps), 0.62, t * 0.0007, 0, 32, 0); }],

    ['Birthday cake', function (g, t) {
      var ps = [], i, a;
      ps.push(part(lathe([[0, -0.9], [1.3, -0.9], [1.3, -0.1], [0, -0.1]], 16), [232, 176, 200]));
      ps.push(part(lathe([[0, -0.1], [1.34, -0.12], [1.3, 0.02], [0, 0.02]], 16), [246, 232, 214]));
      ps.push(part(lathe([[0, 0.02], [0.9, 0.02], [0.9, 0.5], [0, 0.5]], 16), [236, 190, 208]));
      for (i = 0; i < 5; i++) {
        a = i * TAU / 5 + t * 0.0004;
        var cx = Math.cos(a) * 0.55, cz = Math.sin(a) * 0.55;
        ps.push(part(cylGeo(cx, 0.75, cz, 0.07, 0.08, 0.5, 6), i % 2 ? [110, 196, 232] : [246, 242, 226]));
        ps.push(part(coneGeo(cx, 1.14 + Math.sin(t * 0.02 + i) * 0.03, cz, 0.08, 0.28, 6), [255, 186, 60]));
      }
      obj(g, mergeC(ps), 0.34, 0, 0, 28, 0); }],

    ['Noodle bowl', function (g, t) {
      var lift = Math.abs(Math.sin(t * 0.0022)), ps = [], i;
      ps.push(part(lathe([[0.4, -0.8], [1.45, 0.1], [1.5, 0.18], [1.36, 0.16], [0.3, -0.72]], 16), [206, 62, 46]));
      ps.push(part(lathe([[0, -0.62], [1.28, 0.06], [1.2, 0.04], [0, -0.66]], 16), [222, 206, 156]));
      for (i = 0; i < 5; i++) {
        var a = i * TAU / 5;
        ps.push(part(barGeo(Math.cos(a) * 0.4, 0.05, Math.sin(a) * 0.4,
                            Math.cos(a) * 0.16, 0.4 + lift * 0.9, Math.sin(a) * 0.16, 0.055), [228, 196, 96]));
      }
      for (i = 0; i < 2; i++)
        ps.push(part(barGeo(0.5 + i * 0.14, 0.5 + lift * 0.8, -0.2, 1.1 + i * 0.14, 1.6, -0.5, 0.05),
                     [172, 172, 180]));
      for (i = 0; i < 3; i++)
        ps.push(part(ovalGeo(-0.4 + Math.sin(t * 0.004 + i) * 0.2, 0.6 + i * 0.4, 0,
                             0.12 + i * 0.06, 0.1 + i * 0.05, 0.12, 3, 6), [230, 228, 222]));
      obj(g, mergeC(ps), 0.3, 0.4, 0, 30, 0); }],

    ['Melting ice cream', function (g, t) {
      var m2 = (t % 6000) / 6000, ps = [], i;
      ps.push(part(lathe([[0.62, 0.2], [0.5, -0.4], [0.28, -1.0], [0.02, -1.5]], 10), [198, 146, 78]));
      ps.push(part(ovalGeo(0, 0.42 - m2 * 0.16, 0, 0.62 - m2 * 0.08, 0.56 - m2 * 0.1,
                           0.62 - m2 * 0.08, 5, 10), [244, 166, 190]));
      ps.push(part(ovalGeo(-0.2, 0.62 - m2 * 0.16, 0.2, 0.2, 0.16, 0.2, 3, 6), [252, 214, 226]));
      for (i = 0; i < 3; i++) {
        var a = i * 2.1;
        ps.push(part(ovalGeo(Math.cos(a) * 0.5, 0.1 - ((m2 * 1.6 + i * 0.33) % 1) * 1.4,
                             Math.sin(a) * 0.5, 0.09, 0.13, 0.09, 3, 6), [244, 166, 190]));
      }
      obj(g, mergeC(ps), 0.1, t * 0.0009, 0, 32, 0); }],

    ['Popcorn', function (g, t) {
      var ps = [], i, p;
      ps.push(part(lathe([[0.7, -1.0], [1.0, 0.5], [1.05, 0.56], [0.9, 0.54], [0.6, -0.94]], 14), [216, 58, 46]));
      for (i = 0; i < 5; i++) {
        var a = i * TAU / 5;
        ps.push(part(boxGeo(Math.cos(a) * 0.92, -0.2, Math.sin(a) * 0.92, 0.1, 0.75, 0.1), [244, 240, 232]));
      }
      for (p = 0; p < 12; p++) {
        var ph = (t * 0.0008 + p * 0.083) % 1;
        var px = ((p * 13 % 52) / 52 - 0.5) * 1.4;
        var py = 0.4 + Math.sin(ph * Math.PI) * 1.5;
        var pz = ((p * 29 % 37) / 37 - 0.5) * 1.2;
        ps.push(part(ovalGeo(px, py, pz, 0.16, 0.14, 0.16, 3, 6), [248, 240, 206]));
        ps.push(part(ovalGeo(px + 0.11, py + 0.08, pz, 0.1, 0.09, 0.1, 3, 5), [252, 246, 220]));
      }
      obj(g, mergeC(ps), 0.16, 0.3, 0, 30, 0); }],

    ['Cocktail shaker', function (g, t) {
      var sh = Math.sin(t * 0.018);
      var m = geo('shaker', function () { return mergeC([
        part(lathe([[0, -1.1], [0.56, -1.05], [0.6, 0.1], [0.46, 0.6], [0.44, 0.9], [0, 0.92]], 14), [196, 200, 208]),
        part(lathe([[0, 0.92], [0.5, 0.9], [0.52, 1.2], [0, 1.22]], 14), [166, 170, 178]),
        part(torGeo(0, 0.06, 0, 0.6, 0.06, 12, 6), [150, 154, 162])
      ]); });
      obj(g, m, sh * 0.1, t * 0.001, sh * 0.28, 32, 0); }],

    ['Glazed donut', function (g, t) {
      var m = geo('donut', function () {
        var ps = [part(torGeo(0, 0, 0, 1.0, 0.42, 18, 10), [206, 152, 88])], i, a;
        ps.push(part(torGeo(0, 0.14, 0, 1.0, 0.36, 18, 10), [238, 168, 190]));
        for (i = 0; i < 18; i++) { a = i * TAU / 18;
          ps.push(part(xfG(boxGeo(0, 0, 0, 0.12, 0.03, 0.04), 0, -a + 0.6, 0,
                           Math.cos(a) * 1.0, 0.45, Math.sin(a) * 1.0),
                       [[250, 230, 90], [120, 210, 240], [250, 250, 244]][i % 3])); }
        return mergeC(ps);
      });
      obj(g, m, 0.5 + Math.sin(t * 0.0009) * 0.25, t * 0.0016, 0, 30, 0); }],

    ['Cheese fondue', function (g, t) {
      var d = Math.sin(t * 0.0018), ps = [];
      ps.push(part(lathe([[0, -0.8], [1.1, -0.7], [1.15, 0.3], [1.02, 0.3], [0.98, -0.62], [0, -0.7]], 16),
                   [180, 90, 54]));
      ps.push(part(lathe([[0, 0.16], [1.0, 0.2], [0.96, 0.14], [0, 0.1]], 16), [238, 200, 84]));
      ps.push(part(barGeo(1.4, 1.5, 0.3, 0.2, 0.3 + d * 0.5, 0.1, 0.05), [190, 194, 200]));
      ps.push(part(boxGeo(0.16, 0.16 + d * 0.5, 0.08, 0.16, 0.16, 0.16), [226, 194, 140]));
      ps.push(part(boxGeo(0, -0.9, 0, 0.7, 0.12, 0.7), [120, 120, 128]));
      ps.push(part(coneGeo(0, -1.1, 0, 0.2, 0.4, 6), [244, 160, 60]));
      obj(g, mergeC(ps), 0.24, 0.4, 0, 30, 0); }],

    ['Hot dog', function (g, t) {
      var m = geo('hotdog', function () {
        var roll = scG(xfG(lathe([[0.04, 1.0], [0.5, 0.8], [0.62, 0], [0.5, -0.8], [0.04, -1.0]], 10),
                           0, 0, -Math.PI / 2), 2.2, 0.5, 0.75), i;
        var ps = [part(xfG(roll, 0, 0, 0, 0, -0.3, 0.34), [214, 168, 96]),
                  part(xfG(roll, 0, 0, 0, 0, -0.3, -0.34), [214, 168, 96])];
        ps.push(part(scG(xfG(lathe([[0.04, 1.0], [0.5, 0.82], [0.6, 0], [0.5, -0.82], [0.04, -1.0]], 10),
                             0, 0, -Math.PI / 2), 2.4, 0.38, 0.38), [186, 78, 58]));
        for (i = 0; i < 9; i++)
          ps.push(part(boxGeo(-1.0 + i * 0.25, 0.34, (i % 2 ? 0.14 : -0.14), 0.13, 0.05, 0.07),
                       [244, 206, 48]));
        return mergeC(ps);
      });
      obj(g, m, 0.24, t * 0.0011, 0, 30, 0); }],

    ['Rainstorm', function (g, t) {
      var ps = [], i, a;
      for (i = 0; i < 7; i++) { a = i * 0.9;
        ps.push(part(ovalGeo(-1.3 + i * 0.44, 1.15 + Math.sin(a) * 0.16, Math.cos(a) * 0.3,
                             0.44, 0.3, 0.36, 3, 7), [96, 100, 114])); }
      for (i = 0; i < 26; i++) {
        var x = ((i * 37 % 101) / 101 - 0.5) * 4.2;
        var y = 0.9 - ((t * 0.0016 + i * 0.038) % 1) * 3.0;
        ps.push(part(boxGeo(x, y, ((i * 53 % 61) / 61 - 0.5) * 2, 0.02, 0.16, 0.02), [140, 200, 240]));
      }
      obj(g, mergeC(ps), 0, 0, 0.06, 30, 0); }],

    ['Snowfall', function (g, t) {
      var ps = [], i;
      for (i = 0; i < 34; i++) {
        var x = ((i * 41 % 97) / 97 - 0.5) * 4.4;
        var y = 1.5 - ((t * 0.0004 + i * 0.029) % 1) * 3.2;
        var z = ((i * 67 % 53) / 53 - 0.5) * 2.4;
        ps.push(part(xfG(scG(gOcta(), 0.1, 0.13, 0.1), t * 0.002 + i, t * 0.0016 + i, 0,
                         x, y, z), [236, 244, 250]));
      }
      obj(g, mergeC(ps), 0, 0, 0, 30, 0); }],

    ['Lightning storm', function (g, t) {
      var c = (t % 2600) / 2600, ps = [], i, a;
      for (i = 0; i < 7; i++) { a = i * 0.9;
        ps.push(part(ovalGeo(-1.3 + i * 0.44, 1.2 + Math.sin(a) * 0.14, Math.cos(a) * 0.3,
                             0.46, 0.32, 0.36, 3, 7), c < 0.1 ? [180, 184, 196] : [78, 80, 94])); }
      if (c < 0.14) {
        var x = 0;
        for (i = 0; i < 6; i++) {
          var nx = x + (i % 2 ? 0.32 : -0.26);
          ps.push(part(barGeo(x, 0.85 - i * 0.36, 0, nx, 0.85 - (i + 1) * 0.36, 0, 0.07),
                       [255, 244, 170]));
          x = nx;
        }
      }
      for (i = 0; i < 16; i++)
        ps.push(part(boxGeo(((i * 37 % 101) / 101 - 0.5) * 4, 0.8 - ((t * 0.0018 + i * 0.06) % 1) * 2.8,
                            ((i * 53 % 61) / 61 - 0.5) * 2, 0.02, 0.14, 0.02), [130, 180, 220]));
      obj(g, mergeC(ps), 0, 0, 0, 30, 0); }],

    ['Tornado', function (g, t) {
      var ps = [], i;
      for (i = 0; i < 16; i++) {
        var f = i / 16;
        var r = 0.12 + f * f * 1.15;
        var a = t * 0.004 + f * 5;
        ps.push(part(torGeo(Math.cos(a) * f * 0.35, -1.4 + f * 2.9, Math.sin(a) * f * 0.3,
                            r, 0.1 + f * 0.06, 12, 5), [128, 126, 134]));
      }
      for (i = 0; i < 6; i++) {
        var b = t * 0.006 + i;
        ps.push(part(boxGeo(Math.cos(b) * 1.5, -1.2 + (i % 3) * 0.3, Math.sin(b) * 1.2,
                            0.1, 0.08, 0.1), [92, 76, 60]));
      }
      obj(g, mergeC(ps), 0.06, 0, 0, 30, 0); }],

    ['Rainbow', function (g, t) {
      var cols = [[228, 62, 54], [244, 148, 46], [246, 220, 70], [96, 194, 96],
                  [70, 140, 232], [128, 92, 214]];
      var ps = [], i, k;
      for (k = 0; k < 6; k++)
        for (i = 0; i <= 14; i++) {
          var a = Math.PI * (i / 14);
          var r = 1.9 - k * 0.16;
          ps.push(part(ovalGeo(Math.cos(a) * r, -0.5 + Math.sin(a) * r, 0,
                               0.1, 0.1, 0.1, 3, 5), cols[k]));
        }
      obj(g, mergeC(ps), 0, Math.sin(t * 0.0005) * 0.3, 0, 30, 0); }],

    ['Rolling fog', function (g, t) {
      var ps = [], i;
      for (i = 0; i < 16; i++) {
        var x = (((t * 0.0002 + i * 0.062) % 1) - 0.5) * 5.4;
        ps.push(part(ovalGeo(x, -0.9 + (i % 4) * 0.3, -1 + (i % 3), 0.8, 0.3, 0.7, 5, 10),
                     [178 + (i % 3) * 14, 182 + (i % 3) * 14, 190 + (i % 3) * 14]));
      }
      g.globalAlpha = 0.42;
      obj(g, mergeC(ps), 0.1, 0, 0, 30, 0);
      g.globalAlpha = 1; }],

    ['Hailstones', function (g, t) {
      var ps = [], i;
      for (i = 0; i < 22; i++) {
        var x = ((i * 43 % 89) / 89 - 0.5) * 4.2;
        var y = 1.6 - ((t * 0.0014 + i * 0.045) % 1) * 3.4;
        ps.push(part(xfG(scG(gIcosa(), 0.055, 0.055, 0.055), t * 0.003 + i, t * 0.002, 0,
                         x, y, ((i * 71 % 47) / 47 - 0.5) * 2), [226, 238, 248]));
      }
      obj(g, mergeC(ps), 0, 0, 0, 30, 0); }],

    ['Wind', function (g, t) {
      var ps = [], i, k;
      for (k = 0; k < 4; k++)
        for (i = 0; i < 12; i++) {
          var f = i / 12;
          var x = ((f + t * 0.0006 + k * 0.2) % 1) * 4.6 - 2.3;
          ps.push(part(boxGeo(x, 0.9 - k * 0.55 + Math.sin(x * 1.6 + k) * 0.22, -0.5 + k * 0.4,
                              0.16, 0.03, 0.03), [186, 206, 220]));
        }
      for (i = 0; i < 4; i++) {
        var a = t * 0.003 + i * 1.6;
        ps.push(part(xfG(prism([[0, 0], [0.22, 0.12], [0.3, 0], [0.2, -0.14]], 0.02), a, a * 0.7, 0,
                         (((t * 0.0005 + i * 0.25) % 1) - 0.5) * 4.4,
                         Math.sin(t * 0.002 + i) * 0.8, 0.3), [178, 128, 62]));
      }
      obj(g, mergeC(ps), 0, 0, 0, 30, 0); }],

    ['Aurora', function (g, t) {
      var ps = [], i, k;
      /* curtains, not columns: each strip floats on its own and the
         whole sheet ripples across */
      for (k = 0; k < 4; k++)
        for (i = 0; i < 20; i++) {
          var x = -2.2 + i * 0.23;
          var w = Math.sin(t * 0.0013 + i * 0.42 + k * 1.7);
          var h = 0.45 + (Math.sin(i * 0.55 + k * 2.1) * 0.5 + 0.5) * 0.6;
          ps.push(part(boxGeo(x + w * 0.12, 0.85 + w * 0.34 - h * 0.2,
                              -1.6 + k * 0.5 + w * 0.4, 0.05, h, 0.02),
                       k % 2 ? [70, 224, 160] : [120, 170, 236]));
        }
      for (i = 0; i < 14; i++)
        ps.push(part(ovalGeo(((i * 37 % 97) / 97 - 0.5) * 4.2, -0.8 + (i % 3) * 0.2, -2,
                             0.03, 0.03, 0.03, 3, 4), [240, 244, 250]));
      g.globalAlpha = 0.8;
      obj(g, mergeC(ps), 0, 0, 0, 30, 0);
      g.globalAlpha = 1; }],

    ['Sunrise', function (g, t) {
      var c = (Math.sin(t * 0.0006) + 1) / 2, ps = [], i;
      for (i = 0; i < 14; i++) {
        var a = i * TAU / 14 + t * 0.0008;
        ps.push(part(boxGeo(Math.cos(a) * 1.5, -0.5 + c * 0.9 + Math.sin(a) * 1.5, -1,
                            0.35, 0.05, 0.05), [250, 208, 96]));
      }
      ps.push(part(ovalGeo(0, -0.5 + c * 0.9, -0.6, 0.8, 0.8, 0.8, 6, 12), [252, 214, 92]));
      ps.push(part(boxGeo(0, -1.3, 0.4, 5.5, 0.5, 0.6), [46, 62, 78]));
      obj(g, mergeC(ps), 0.05, 0, 0, 30, 0); }],
    ['Typewriter', function (g, t) {
      var k = Math.floor(t * 0.006) % 12, ps = [], i, j;
      ps.push(part(boxGeo(0, -0.5, 0, 1.5, 0.24, 1.0), [58, 58, 66]));
      ps.push(part(boxGeo(0, 0.1, -0.5, 1.4, 0.4, 0.34), [42, 42, 50]));
      ps.push(part(cylGeo(0, 0.5, -0.5, 0.26, 0.26, 2.7, 10, 'x'), [30, 30, 36]));
      ps.push(part(boxGeo(0, 0.62, -0.28, 0.9, 0.02, 0.4), [244, 242, 232]));
      for (i = 0; i < 4; i++) for (j = 0; j < 8; j++) {
        var hit = (i * 8 + j) % 12 === k ? 0.1 : 0;
        ps.push(part(cylGeo(-1.05 + j * 0.3, -0.2 - i * 0.12 - hit, 0.5 - i * 0.28,
                            0.11, 0.11, 0.1, 6), [232, 228, 216]));
      }
      ps.push(part(barGeo(0, -0.1, 0.2, 0, 0.5 + (k % 3) * 0.1, -0.3, 0.03), [180, 180, 190]));
      obj(g, mergeC(ps), 0.42, 0.28 + Math.sin(t * 0.0005) * 0.2, 0, 30, 1); }],

    ['Clock gears', function (g, t) {
      function gear(r, n, teeth, x, y, z, a, col) {
        var ps = [part(cylGeo(x, y, z, r, r, 0.16, n), col)], i, b;
        for (i = 0; i < teeth; i++) { b = a + i * TAU / teeth;
          ps.push(part(xfG(boxGeo(0, 0, 0, 0.09, 0.09, 0.08), 0, 0, b,
                           x + Math.cos(b) * r, y + Math.sin(b) * r, z), col)); }
        ps.push(part(cylGeo(x, y, z, 0.09, 0.09, 0.24, 6), [80, 76, 70]));
        return ps;
      }
      var ps = gear(0.68, 12, 12, -0.6, 0.2, 0, t * 0.0018, [198, 166, 76])
        .concat(gear(0.46, 10, 9, 0.62, -0.2, 0.2, -t * 0.0027, [176, 178, 186]))
        .concat(gear(0.32, 8, 7, 0.5, 0.8, -0.2, t * 0.0039, [186, 140, 84]));
      obj(g, mergeC(ps), 0.34, Math.sin(t * 0.0005) * 0.4, 0, 32, 1); }],

    ['Washing machine', function (g, t) {
      var m = geo('washer', function () { return mergeC([
        part(boxGeo(0, 0, 0, 1.1, 1.3, 1.0), [222, 224, 228]),
        part(boxGeo(0, 1.34, 0, 1.12, 0.08, 1.02), [190, 192, 198]),
        part(torGeo(0, -0.1, 1.0, 0.72, 0.12, 14, 6, 'z'), [150, 154, 162]),
        part(cylGeo(0, 1.2, 0.5, 0.12, 0.12, 0.3, 8, 'z'), [80, 82, 90])
      ]); });
      var ps = [], i;
      for (i = 0; i < 6; i++) {
        var a = t * 0.006 + i * TAU / 6;
        ps.push(part(ovalGeo(Math.cos(a) * 0.42, -0.1 + Math.sin(a) * 0.42, 1.04,
                             0.16, 0.14, 0.04, 3, 6),
                     [[228, 90, 90], [96, 160, 226], [244, 232, 120]][i % 3]));
      }
      /* the washing sits behind the door, so it goes down after the
         machine only while the door is the side facing us */
      var drum = mergeC(ps);
      if (facingZ(0, 0.5, 0) >= 0) {
        obj(g, m, 0.1, 0.5, Math.sin(t * 0.04) * 0.02, 30, 1);
        obj(g, drum, 0.1, 0.5, 0, 30, 0);
      } else {
        obj(g, drum, 0.1, 0.5, 0, 30, 0);
        obj(g, m, 0.1, 0.5, Math.sin(t * 0.04) * 0.02, 30, 1);
      } }],

    ['Blender', function (g, t) {
      var ps = [], i;
      ps.push(part(boxGeo(0, -1.1, 0, 0.72, 0.34, 0.6), [56, 58, 66]));
      for (i = 0; i < 8; i++) {
        var a = t * 0.02 + i * TAU / 8;
        var r = 0.14 + (i % 3) * 0.14;
        ps.push(part(ovalGeo(Math.cos(a) * r, -0.4 + (i % 4) * 0.34, Math.sin(a) * r,
                             0.16, 0.14, 0.16, 3, 6), i % 2 ? [214, 84, 124] : [148, 196, 92]));
      }
      for (i = 0; i < 3; i++)
        ps.push(part(xfG(boxGeo(0, 0, 0, 0.3, 0.02, 0.06), 0, t * 0.03 + i * 2.1, 0,
                         0, -0.66, 0), [190, 194, 202]));
      obj(g, mergeC(ps), 0.16, 0.4, 0, 30, 0);
      g.globalAlpha = 0.32;
      obj(g, mergeC([part(lathe([[0.5, -0.72], [0.66, 1.0], [0.7, 1.06], [0.58, 1.04],
                                 [0.42, -0.68]], 12), [214, 228, 238])]), 0.16, 0.4, 0, 30, 0);
      g.globalAlpha = 1; }],

    ['Sewing machine', function (g, t) {
      var n = Math.sin(t * 0.014), ps = [];
      ps.push(part(boxGeo(0, -0.9, 0, 1.6, 0.16, 0.7), [148, 108, 62]));
      ps.push(part(boxGeo(-0.7, -0.1, 0, 0.34, 0.7, 0.3), [40, 44, 54]));
      ps.push(part(boxGeo(0.1, 0.66, 0, 1.15, 0.26, 0.3), [40, 44, 54]));
      ps.push(part(cylGeo(-0.7, 0.4, 0.34, 0.3, 0.3, 0.12, 12, 'z'), [190, 60, 60]));
      ps.push(part(boxGeo(0.9, 0.1 + n * 0.14, 0, 0.1, 0.34, 0.1), [180, 184, 192]));
      ps.push(part(barGeo(0.9, -0.12 + n * 0.14, 0, 0.9, -0.62, 0, 0.02), [230, 230, 240]));
      ps.push(part(boxGeo(0.9, -0.74, 0, 0.5, 0.03, 0.4), [220, 90, 120]));
      obj(g, mergeC(ps), 0.24, 0.4 + Math.sin(t * 0.0005) * 0.15, 0, 30, 1); }],

    ['Cash register', function (g, t) {
      var c = (t % 2800) / 2800, out = c > 0.7 ? (c - 0.7) / 0.3 : 0, ps = [], i, j;
      ps.push(part(boxGeo(0, -0.5, 0, 1.2, 0.6, 0.9), [188, 150, 70]));
      ps.push(part(boxGeo(0, 0.4, -0.2, 0.9, 0.52, 0.5), [166, 128, 56]));
      ps.push(part(boxGeo(0, 0.5, 0.1, 0.66, 0.34, 0.02), [70, 90, 80]));
      for (i = 0; i < 3; i++) for (j = 0; j < 4; j++)
        ps.push(part(cylGeo(-0.7 + j * 0.46, -0.1, 0.5 - i * 0.22, 0.1, 0.1, 0.08, 6),
                     [236, 232, 220]));
      ps.push(part(boxGeo(0, -0.5, 0.9 + out * 0.8, 1.1, 0.4, 0.1), [150, 116, 50]));
      obj(g, mergeC(ps), 0.3, 0.42, 0, 30, 1); }],

    ['Jukebox', function (g, t) {
      var ps = [], i;
      ps.push(part(lathe([[0.9, -1.3], [0.95, 0.3], [0.8, 1.0], [0.5, 1.3], [0, 1.34]], 12),
                   [150, 60, 60]));
      ps.push(part(lathe([[0.7, -0.4], [0.75, 0.4], [0.6, 0.9], [0, 1.0]], 12),
                   [250, 210 + Math.sin(t * 0.004) * 40, 110]));
      for (i = 0; i < 10; i++) {
        var a = i * TAU / 10 + t * 0.001;
        ps.push(part(ovalGeo(Math.cos(a) * 0.92, 0.2 + Math.sin(a) * 0.5, 0.6,
                             0.09, 0.09, 0.06, 3, 5),
                     [[250, 120, 60], [120, 200, 250], [250, 240, 140]][i % 3]));
      }
      ps.push(part(xfG(cylGeo(0, 0, 0, 0.42, 0.42, 0.04, 14), 0.5, t * 0.004, 0, 0, 0.3, 0.4),
                   [40, 40, 48]));
      obj(g, mergeC(ps), 0.14, Math.sin(t * 0.0006) * 0.3, 0, 30, 0); }],

    ['Film projector', function (g, t) {
      var ps = [], i;
      ps.push(part(boxGeo(-0.2, -0.1, 0, 0.8, 0.5, 0.5), [66, 66, 76]));
      for (i = 0; i < 2; i++)
        ps.push(part(xfG(cylGeo(0, 0, 0, 0.5, 0.5, 0.1, 14), 0, 0, 0,
                         -0.7 + i * 1.0, 0.7, 0.3), [40, 40, 48]));
      for (i = 0; i < 2; i++)
        ps.push(part(xfG(torGeo(0, 0, 0, 0.42, 0.06, 12, 5, 'z'), 0, 0, t * 0.004,
                         -0.7 + i * 1.0, 0.7, 0.36), [180, 180, 190]));
      ps.push(part(cylGeo(0.5, -0.1, 0, 0.2, 0.28, 0.4, 10, 'x'), [40, 40, 48]));
      ps.push(part(boxGeo(0, -0.8, 0, 1.2, 0.16, 0.7), [50, 50, 58]));
      g.globalAlpha = 0.35;
      obj(g, mergeC([part(xfG(coneGeo(0, 0, 0, 1.1, 2.6, 8), 0, 0, -Math.PI / 2, 2.0, -0.1, 0),
                          [250, 246, 210])]), 0, 0, 0, 30, 0);
      g.globalAlpha = 1;
      obj(g, mergeC(ps), 0.2, 0.3, 0, 30, 1); }],

    ['Lava lamp', function (g, t) {
      var ps = [], i;
      for (i = 0; i < 5; i++) {
        var f = ((t * 0.00035 + i * 0.2) % 1);
        var y = -1.0 + f * 2.1;
        var r = 0.14 + Math.sin(f * Math.PI) * 0.12;
        ps.push(part(ovalGeo(Math.sin(f * 7 + i) * 0.08, y, 0, r, r * 1.3, r, 4, 8),
                     [232, 92, 140]));
      }
      ps.push(part(lathe([[0.6, -1.5], [0.66, -1.4], [0.5, -1.34]], 12), [180, 150, 70]));
      obj(g, mergeC(ps), 0.06, t * 0.0006, 0, 32, 0);
      g.globalAlpha = 0.3;
      obj(g, mergeC([part(lathe([[0.62, -1.4], [0.42, -1.1], [0.32, 0.2], [0.5, 1.1],
                                 [0.34, 1.3]], 14), [150, 160, 180])]), 0.06, t * 0.0006, 0, 32, 0);
      g.globalAlpha = 1; }],

    ['Disco ball', function (g, t) {
      var m = geo('disco', function () {
        var ps = [], u, v, nu = 8, nv = 14;
        for (u = 0; u < nu; u++) for (v = 0; v < nv; v++) {
          var ph = (u + 0.5) / nu * Math.PI, th = v / nv * TAU;
          ps.push(part(xfG(boxGeo(0, 0, 0, 0.16, 0.16, 0.02), ph - Math.PI / 2, th, 0,
                           Math.sin(ph) * Math.cos(th) * 1.05, Math.cos(ph) * 1.05,
                           Math.sin(ph) * Math.sin(th) * 1.05),
                       (u + v) % 3 ? [188, 196, 208] : [240, 246, 252]));
        }
        return mergeC(ps);
      });
      obj(g, m, 0.2, t * 0.0016, 0, 34, 0);
      var ps = [], i;
      for (i = 0; i < 10; i++) {
        var a = t * 0.0016 + i * TAU / 10;
        ps.push(part(boxGeo(Math.cos(a) * 2.0, Math.sin(a) * 1.6, -2, 0.5, 0.05, 0.05),
                     [250, 244, 200]));
      }
      g.globalAlpha = 0.4;
      obj(g, mergeC(ps), 0, 0, 0, 30, 0);
      g.globalAlpha = 1; }],

    ['Desk fan', function (g, t) {
      var ps = [], i;
      ps.push(part(boxGeo(0, -1.2, 0, 0.7, 0.12, 0.5), [60, 62, 70]));
      ps.push(part(cylGeo(0, -0.5, 0, 0.09, 0.09, 1.2, 6), [140, 144, 152]));
      var sw = Math.sin(t * 0.0009) * 0.7;
      var head = [part(cylGeo(0, 0, 0, 0.16, 0.16, 0.3, 8, 'z'), [120, 124, 132])];
      for (i = 0; i < 4; i++)
        head.push(part(xfG(scG(prism(discO(0.36, 8), 0.02), 1, 1.9, 1), 0, 0,
                           t * 0.03 + i * TAU / 4, 0, 0, 0.06), [206, 210, 218]));
      head.push(part(torGeo(0, 0, 0.22, 0.9, 0.05, 16, 5, 'z'), [150, 154, 162]));
      head.push(part(torGeo(0, 0, 0.22, 0.56, 0.04, 14, 5, 'z'), [150, 154, 162]));
      for (i = 0; i < head.length; i++)
        ps.push({ V: xfG(head[i], 0, sw, 0, 0, 0.45, 0.2).V, F: head[i].F, c: head[i].c });
      obj(g, mergeC(ps), 0.1, 0, 0, 30, 0); }],

    ['Traffic light', function (g, t) {
      var k = Math.floor(t / 1600) % 3, ps = [], i;
      ps.push(part(cylGeo(0, -1.2, 0, 0.12, 0.16, 1.4, 8), [70, 72, 80]));
      ps.push(part(boxGeo(0, 0.5, 0, 0.42, 1.05, 0.34), [46, 48, 56]));
      for (i = 0; i < 3; i++)
        ps.push(part(cylGeo(0, 1.16 - i * 0.62, 0.36, 0.26, 0.26, 0.14, 10, 'z'),
                     k === i ? [[240, 70, 60], [244, 200, 70], [80, 220, 120]][i]
                             : [[80, 34, 32], [82, 70, 32], [32, 76, 46]][i]));
      obj(g, mergeC(ps), 0.1, Math.sin(t * 0.0006) * 0.5, 0, 34, 1); }],

    ['Vending machine', function (g, t) {
      var c = (t % 3600) / 3600, ps = [], i, j;
      ps.push(part(boxGeo(0, 0, 0, 1.0, 1.6, 0.7), [180, 60, 60]));
      ps.push(part(boxGeo(-0.2, 0.25, 0.71, 0.66, 1.2, 0.02), [60, 90, 110]));
      for (i = 0; i < 4; i++) for (j = 0; j < 3; j++) {
        var drop = (i === 1 && j === 2 && c > 0.4) ? Math.min(2.2, (c - 0.4) * 6) : 0;
        ps.push(part(boxGeo(-0.68 + j * 0.36, 1.25 - i * 0.5 - drop, 0.6, 0.13, 0.17, 0.12),
                     [[240, 200, 70], [110, 200, 240], [230, 110, 150]][(i + j) % 3]));
      }
      ps.push(part(boxGeo(0.62, 0.7, 0.72, 0.22, 0.5, 0.03), [40, 42, 50]));
      ps.push(part(boxGeo(-0.2, -1.05, 0.72, 0.6, 0.24, 0.03), [40, 42, 50]));
      obj(g, mergeC(ps), 0.12, 0.4 + Math.sin(t * 0.0005) * 0.15, 0, 30, 1); }],

    ['Metronome', function (g, t) {
      var a = Math.sin(t * 0.004) * 0.5, ps = [];
      ps.push(part(xfG(prism([[-0.7, -1.2], [0.7, -1.2], [0.24, 1.2], [-0.24, 1.2]], 0.4),
                       0, 0, 0, 0, 0, 0), [148, 96, 52]));
      ps.push(part(xfG(barGeo(0, -1.0, 0.45, 0, 1.4, 0.45, 0.05), 0, 0, a, 0, 0, 0),
                   [220, 216, 206]));
      ps.push(part(xfG(boxGeo(0, 0.75, 0.45, 0.16, 0.12, 0.08), 0, 0, a, 0, 0, 0), [70, 72, 80]));
      ps.push(part(boxGeo(0, -1.24, 0, 0.8, 0.1, 0.45), [110, 70, 36]));
      obj(g, mergeC(ps), 0.06, 0.24, 0, 34, 1); }],

    ['Steam train', function (g, t) {
      var ps = [], i;
      ps.push(part(cylGeo(-0.2, 0.1, 0, 0.5, 0.5, 2.0, 12, 'x'), [60, 62, 72]));
      ps.push(part(boxGeo(-1.3, 0.25, 0, 0.45, 0.6, 0.55), [46, 48, 58]));
      ps.push(part(cylGeo(0.4, 0.85, 0, 0.16, 0.22, 0.6, 8), [40, 42, 50]));
      ps.push(part(boxGeo(0, -0.55, 0, 1.7, 0.12, 0.66), [40, 40, 48]));
      for (i = 0; i < 4; i++)
        ps.push(part(xfG(cylGeo(0, 0, 0, 0.3, 0.3, 0.16, 10), Math.PI / 2, 0, t * 0.006,
                         -1.0 + i * 0.62, -0.62, (i % 2 ? 1 : -1) * 0.4), [140, 40, 40]));
      for (i = 0; i < 5; i++)
        ps.push(part(ovalGeo(0.4 - i * 0.24, 1.3 + i * 0.34, 0, 0.14 + i * 0.07,
                             0.12 + i * 0.06, 0.14, 3, 6), [216, 214, 210]));
      obj(g, mergeC(ps), 0.2, 0.5 + Math.sin(t * 0.0006) * 0.2, 0, 28, 1); }],

    ['City bus', function (g, t) {
      var m = geo('bus', function () {
        var ps = [part(boxGeo(0, 0.1, 0, 1.8, 0.6, 0.62), [230, 176, 40])], i;
        ps.push(part(boxGeo(0, -0.62, 0, 1.75, 0.16, 0.6), [60, 60, 68]));
        for (i = 0; i < 5; i++)
          ps.push(part(boxGeo(-1.3 + i * 0.62, 0.28, 0.63, 0.24, 0.24, 0.02), [130, 190, 220]));
        for (i = 0; i < 4; i++)
          ps.push(part(cylGeo(-1.1 + (i % 2) * 2.0, -0.72, (i < 2 ? 1 : -1) * 0.52,
                              0.26, 0.26, 0.16, 9, 'z'), [40, 40, 46]));
        return mergeC(ps);
      });
      obj(g, m, 0.2, t * 0.0011, 0, 28, 1); }],

    ['Bicycle', function (g, t) {
      var ps = [], i, s2;
      for (s2 = 0; s2 < 2; s2++) {
        var x = s2 ? 1.0 : -1.0;
        ps.push(part(xfG(torGeo(0, 0, 0, 0.62, 0.05, 16, 5, 'z'), 0, 0, 0, x, -0.4, 0),
                     [50, 50, 58]));
        for (i = 0; i < 6; i++) {
          var a = t * 0.004 + i * TAU / 6;
          ps.push(part(barGeo(x, -0.4, 0, x + Math.cos(a) * 0.6, -0.4 + Math.sin(a) * 0.6, 0, 0.02),
                       [190, 194, 202]));
        }
      }
      ps.push(part(barGeo(-1.0, -0.4, 0, 0.1, 0.5, 0, 0.05), [200, 60, 70]));
      ps.push(part(barGeo(0.1, 0.5, 0, 1.0, -0.4, 0, 0.05), [200, 60, 70]));
      ps.push(part(barGeo(-1.0, -0.4, 0, -0.35, -0.4, 0, 0.05), [200, 60, 70]));
      ps.push(part(barGeo(-0.35, -0.4, 0, 0.1, 0.5, 0, 0.05), [200, 60, 70]));
      ps.push(part(boxGeo(-0.55, 0.62, 0, 0.24, 0.06, 0.1), [40, 40, 48]));
      ps.push(part(boxGeo(0.9, 0.66, 0, 0.06, 0.06, 0.4), [40, 40, 48]));
      obj(g, mergeC(ps), 0.14, 0.22 + Math.sin(t * 0.0006) * 0.2, 0, 30, 0); }],

    ['Motorcycle', function (g, t) {
      var ps = [], i;
      for (i = 0; i < 2; i++) {
        var x = i ? 1.1 : -1.1;
        ps.push(part(xfG(cylGeo(0, 0, 0, 0.55, 0.55, 0.2, 12), Math.PI / 2, 0, t * 0.008,
                         x, -0.5, 0), [36, 36, 42]));
        ps.push(part(xfG(cylGeo(0, 0, 0, 0.28, 0.28, 0.22, 8), Math.PI / 2, 0, t * 0.008,
                         x, -0.5, 0), [180, 184, 192]));
      }
      ps.push(part(boxGeo(0, -0.1, 0, 0.85, 0.3, 0.28), [180, 40, 40]));
      ps.push(part(boxGeo(-0.5, 0.28, 0, 0.45, 0.14, 0.26), [40, 40, 48]));
      ps.push(part(barGeo(0.6, 0.5, 0, 1.1, -0.5, 0, 0.07), [150, 154, 162]));
      ps.push(part(boxGeo(0.62, 0.6, 0, 0.06, 0.06, 0.4), [40, 40, 48]));
      obj(g, mergeC(ps), 0.16, 0.3 + Math.sin(t * 0.0007) * 0.25, 0, 30, 0); }],

    ['Sailboat', function (g, t) {
      var roll = Math.sin(t * 0.0016) * 0.12, ps = [], i;
      ps.push(part(xfG(scG(prism([[-1.2, 0.24], [1.35, 0.3], [1.0, -0.3], [-0.95, -0.26]], 0.42),
                           1, 1, 1), 0, 0, roll, 0, -0.5, 0), [150, 96, 52]));
      ps.push(part(xfG(cylGeo(0, 0.9, 0, 0.05, 0.06, 2.4, 6), 0, 0, roll, 0, -0.4, 0),
                   [200, 196, 186]));
      ps.push(part(xfG(scG(prism([[0.06, 1.7], [0.06, -0.5], [1.15, -0.5]], 0.03), 1, 1, 1),
                       0, 0, roll, 0, -0.1, 0), [244, 242, 236]));
      ps.push(part(xfG(scG(prism([[-0.06, 1.5], [-0.06, -0.5], [-0.9, -0.45]], 0.03), 1, 1, 1),
                       0, 0, roll, 0, -0.1, 0), [232, 230, 224]));
      for (i = 0; i < 5; i++)
        ps.push(part(boxGeo(-2 + i, -1.05 + Math.sin(t * 0.003 + i) * 0.08, -0.5 + (i % 2) * 1,
                            0.55, 0.07, 0.5), [50, 110, 150]));
      obj(g, mergeC(ps), 0.16, 0.2, 0, 28, 0); }],

    ['Submarine', function (g, t) {
      var m = geo('sub', function () {
        var ps = [part(scG(xfG(lathe([[0.03, 1], [0.5, 0.8], [0.62, 0], [0.5, -0.8], [0.03, -1]], 12),
                               0, 0, -Math.PI / 2), 1.9, 0.55, 0.55), [90, 112, 96])], i;
        ps.push(part(boxGeo(-0.1, 0.55, 0, 0.36, 0.34, 0.24), [78, 98, 84]));
        ps.push(part(cylGeo(-0.1, 1.0, 0, 0.05, 0.05, 0.5, 6), [180, 184, 190]));
        ps.push(part(boxGeo(-1.6, 0.1, 0, 0.2, 0.5, 0.06), [78, 98, 84]));
        ps.push(part(boxGeo(-1.6, 0.1, 0, 0.2, 0.06, 0.5), [78, 98, 84]));
        for (i = 0; i < 3; i++)
          ps.push(part(cylGeo(0.3 + i * 0.5, 0.1, 0.56, 0.11, 0.11, 0.05, 8, 'z'), [216, 226, 232]));
        return mergeC(ps);
      });
      obj(g, m, Math.sin(t * 0.001) * 0.14, 0.5 + Math.sin(t * 0.0007) * 0.3, 0, 30, 0);
      var ps = [], i;
      for (i = 0; i < 8; i++)
        ps.push(part(ovalGeo(-2.0 - (i % 4) * 0.3, 0.2 + ((t * 0.001 + i * 0.13) % 1) * 1.6,
                             (i % 3) * 0.3 - 0.3, 0.07, 0.07, 0.07, 3, 5), [200, 236, 244]));
      obj(g, mergeC(ps), 0, 0, 0, 30, 0); }],

    ['Hot air balloon', function (g, t) {
      var b = Math.sin(t * 0.0012) * 0.2, ps = [], i;
      for (i = 0; i < 8; i++) {
        var a = i * TAU / 8;
        ps.push(part(xfG(scG(prism([[0, 1.05], [0.42, 0.5], [0.5, -0.2], [0.24, -0.8], [0, -0.85]], 0.02),
                             1, 1, 1), 0, a, 0, 0, 0.7 + b, 0),
                     i % 2 ? [226, 74, 74] : [244, 236, 226]));
      }
      ps.push(part(boxGeo(0, -0.9 + b, 0, 0.34, 0.3, 0.34), [154, 112, 60]));
      for (i = 0; i < 4; i++)
        ps.push(part(barGeo((i < 2 ? 1 : -1) * 0.3, -0.6 + b, (i % 2 ? 1 : -1) * 0.3,
                            (i < 2 ? 1 : -1) * 0.16, -0.15 + b, (i % 2 ? 1 : -1) * 0.16, 0.02),
                     [90, 80, 70]));
      obj(g, mergeC(ps), 0.06, t * 0.0007, Math.sin(t * 0.0009) * 0.05, 30, 0); }],

    ['Helicopter', function (g, t) {
      var ps = [], i;
      ps.push(part(scG(xfG(lathe([[0.03, 1], [0.55, 0.7], [0.66, 0], [0.4, -0.8], [0.03, -1]], 10),
                           0, 0, -Math.PI / 2), 1.1, 0.6, 0.6), [60, 110, 160]));
      ps.push(part(boxGeo(-1.5, 0.2, 0, 0.6, 0.1, 0.1), [60, 110, 160]));
      ps.push(part(cylGeo(0.2, 0.62, 0, 0.06, 0.06, 0.34, 6), [60, 60, 70]));
      for (i = 0; i < 4; i++)
        ps.push(part(xfG(boxGeo(0, 0, 0, 1.5, 0.03, 0.12), 0, t * 0.03 + i * TAU / 4, 0,
                         0.2, 0.82, 0), [70, 72, 82]));
      for (i = 0; i < 3; i++)
        ps.push(part(xfG(boxGeo(0, 0, 0, 0.03, 0.4, 0.06), 0, 0, t * 0.04 + i * 2.1,
                         -2.05, 0.3, 0.12), [70, 72, 82]));
      for (i = 0; i < 2; i++)
        ps.push(part(boxGeo(0, -0.72, (i ? 1 : -1) * 0.4, 0.9, 0.05, 0.05), [70, 72, 82]));
      obj(g, mergeC(ps), 0.14, 0.42 + Math.sin(t * 0.0006) * 0.2, Math.sin(t * 0.0012) * 0.05,
          28, 0); }],

    ['Tractor', function (g, t) {
      var ps = [], i;
      ps.push(part(boxGeo(0.1, 0.05, 0, 0.7, 0.34, 0.42), [60, 140, 70]));
      ps.push(part(boxGeo(-0.7, 0.3, 0, 0.4, 0.5, 0.4), [50, 120, 60]));
      ps.push(part(cylGeo(0.7, 0.2, 0, 0.05, 0.05, 0.4, 6), [40, 40, 46]));
      ps.push(part(xfG(cylGeo(0, 0, 0, 0.72, 0.72, 0.34, 12), Math.PI / 2, 0, t * 0.004,
                       -0.75, -0.5, 0), [40, 40, 46]));
      ps.push(part(xfG(cylGeo(0, 0, 0, 0.36, 0.36, 0.3, 10), Math.PI / 2, 0, t * 0.008,
                       0.85, -0.85, 0), [40, 40, 46]));
      for (i = 0; i < 2; i++)
        ps.push(part(xfG(cylGeo(0, 0, 0, 0.3, 0.3, 0.12, 8), Math.PI / 2, 0, t * 0.004,
                         -0.75, -0.5, 0), [180, 184, 60]));
      obj(g, mergeC(ps), 0.18, 0.5 + Math.sin(t * 0.0006) * 0.2, 0, 32, 1); }],

    ['Skateboard', function (g, t) {
      var a = Math.sin(t * 0.0022), ps = [], i;
      ps.push(part(xfG(scG(prism([[-1.3, 0.1], [-1.15, 0.3], [1.15, 0.3], [1.3, 0.1],
                                  [1.1, -0.06], [-1.1, -0.06]], 0.34), 1, 1, 1),
                       0, 0, a * 0.6, 0, 0.3 + Math.abs(a) * 0.5, 0), [180, 70, 90]));
      for (i = 0; i < 4; i++) {
        var wx = (i < 2 ? -0.8 : 0.8), wz = (i % 2 ? 0.36 : -0.36);
        var p = rot3([wx, -0.1, wz], 0, 0, a * 0.6);
        ps.push(part(xfG(cylGeo(0, 0, 0, 0.16, 0.16, 0.12, 8), 0, 0, Math.PI / 2 + t * 0.01,
                         p[0], p[1] + 0.3 + Math.abs(a) * 0.5, p[2]), [240, 210, 90]));
      }
      ps.push(part(boxGeo(0, -1.0, 0, 2.2, 0.06, 1.0), [70, 72, 80]));
      obj(g, mergeC(ps), 0.24, 0.4, 0, 32, 0); }],
    ['Flower blooming', function (g, t) {
      var c = (Math.sin(t * 0.0011) + 1) / 2, ps = [], i;
      ps.push(part(cylGeo(0, -0.9, 0, 0.06, 0.08, 1.6, 6), [70, 150, 70]));
      for (i = 0; i < 2; i++)
        ps.push(part(xfG(scG(prism(discO(0.34, 8), 0.02), 1, 0.5, 1), 0, 0, (i ? 1 : -1) * 0.5,
                         (i ? 1 : -1) * 0.4, -0.7, 0), [64, 140, 64]));
      for (i = 0; i < 8; i++) {
        var a = i * TAU / 8;
        ps.push(part(xfG(scG(prism(discO(0.42, 9), 0.02), 1, 0.55, 1),
                         -0.2 - c * 1.0, a, 0,
                         Math.cos(a) * (0.2 + c * 0.5), 0.1 + (1 - c) * 0.2,
                         Math.sin(a) * (0.2 + c * 0.5)), [232, 96, 150]));
      }
      ps.push(part(ovalGeo(0, 0.14, 0, 0.24, 0.16, 0.24, 4, 8), [244, 206, 70]));
      obj(g, mergeC(ps), 0.24, t * 0.0007, 0, 32, 0); }],

    ['Tree growing', function (g, t) {
      var c = ((t % 8000) / 8000), ps = [], i;
      var h = 0.3 + c * 1.6;
      ps.push(part(cylGeo(0, -1.4 + h / 2, 0, 0.1, 0.2, h, 8), [116, 84, 52]));
      for (i = 0; i < 7; i++) {
        var a = i * TAU / 7, r = c * 0.85;
        ps.push(part(ovalGeo(Math.cos(a) * r, -1.4 + h + Math.sin(i * 1.7) * 0.2 * c,
                             Math.sin(a) * r, c * 0.5, c * 0.45, c * 0.5, 4, 8),
                     [58 + (i % 3) * 12, 140 + (i % 3) * 16, 60]));
      }
      ps.push(part(boxGeo(0, -1.55, 0, 1.5, 0.12, 1.2), [96, 78, 54]));
      obj(g, mergeC(ps), 0.14, t * 0.0006, 0, 30, 0); }],

    ['Climbing vine', function (g, t) {
      var ps = [], i;
      ps.push(part(cylGeo(0, 0, 0, 0.24, 0.24, 3.2, 8), [176, 168, 150]));
      for (i = 0; i < 26; i++) {
        var f = i / 26;
        var a = f * 9 + t * 0.0008;
        var y = -1.5 + f * 3.0;
        ps.push(part(ovalGeo(Math.cos(a) * 0.34, y, Math.sin(a) * 0.34, 0.1, 0.08, 0.1, 3, 5),
                     [70, 140, 62]));
        if (i % 3 === 0)
          ps.push(part(xfG(scG(prism(discO(0.24, 7), 0.02), 1, 0.6, 1), 0, -a, 0.4,
                           Math.cos(a) * 0.62, y, Math.sin(a) * 0.62), [86, 168, 74]));
      }
      obj(g, mergeC(ps), 0.06, t * 0.0005, 0, 30, 0); }],

    ['Cactus', function (g, t) {
      var m = geo('cactus', function () {
        var ps = [part(lathe([[0.42, -1.4], [0.46, 0.6], [0.4, 1.0], [0.2, 1.15], [0, 1.16]], 10),
                       [70, 140, 84])], i, a;
        ps.push(part(lathe([[0.26, -0.3], [0.28, 0.4], [0.2, 0.6], [0, 0.62]], 8), [70, 140, 84]));
        ps[ps.length - 1] = part(xfG(lathe([[0.26, -0.3], [0.28, 0.4], [0.2, 0.6], [0, 0.62]], 8),
                                     0, 0, 0, -0.75, 0.3, 0), [70, 140, 84]);
        ps.push(part(xfG(lathe([[0.24, -0.2], [0.26, 0.5], [0.18, 0.7], [0, 0.72]], 8),
                         0, 0, 0, 0.75, 0.1, 0), [70, 140, 84]));
        ps.push(part(barGeo(-0.75, -0.2, 0, -0.2, -0.2, 0, 0.16), [70, 140, 84]));
        ps.push(part(barGeo(0.75, -0.4, 0, 0.2, -0.4, 0, 0.16), [70, 140, 84]));
        for (i = 0; i < 26; i++) { a = i * 2.399;
          ps.push(part(ovalGeo(Math.cos(a) * 0.48, -1.2 + (i / 26) * 2.2, Math.sin(a) * 0.48,
                               0.03, 0.08, 0.03, 3, 4), [232, 226, 200])); }
        ps.push(part(lathe([[0.9, -1.5], [0.95, -1.2], [0.8, -1.15]], 12), [166, 112, 70]));
        return mergeC(ps);
      });
      obj(g, m, 0.1, t * 0.0009, 0, 30, 0); }],

    ['Mushrooms', function (g, t) {
      var ps = [], i, k;
      for (k = 0; k < 3; k++) {
        var x = -0.9 + k * 0.9, s2 = 0.7 + k * 0.22;
        var sw = Math.sin(t * 0.0016 + k) * 0.05;
        ps.push(part(xfG(cylGeo(0, 0, 0, 0.16 * s2, 0.2 * s2, 0.9 * s2, 8), 0, 0, sw,
                         x, -0.7, k * 0.3 - 0.3), [232, 224, 206]));
        ps.push(part(xfG(lathe([[0, 0.4 * s2], [0.5 * s2, 0.16 * s2], [0.62 * s2, -0.06 * s2],
                                [0.5 * s2, -0.1 * s2], [0, -0.08 * s2]], 12), 0, 0, sw,
                         x + sw * 0.4, -0.28 + 0.9 * s2 * 0.5, k * 0.3 - 0.3), [200, 60, 54]));
        for (i = 0; i < 5; i++) {
          var a = i * TAU / 5 + k;
          ps.push(part(ovalGeo(x + Math.cos(a) * 0.34 * s2, -0.28 + 0.9 * s2 * 0.5 + 0.24 * s2,
                               k * 0.3 - 0.3 + Math.sin(a) * 0.34 * s2,
                               0.07, 0.03, 0.07, 3, 5), [246, 244, 236]));
        }
      }
      ps.push(part(boxGeo(0, -1.3, 0, 1.7, 0.14, 1.0), [80, 92, 62]));
      obj(g, mergeC(ps), 0.2, t * 0.0005, 0, 32, 0); }],

    ['Sunflower', function (g, t) {
      var sw = Math.sin(t * 0.0012) * 0.14, ps = [], i;
      ps.push(part(xfG(cylGeo(0, 0, 0, 0.08, 0.11, 2.2, 8), 0, 0, sw, 0, -0.6, 0), [78, 148, 66]));
      for (i = 0; i < 14; i++) {
        var a = i * TAU / 14;
        ps.push(part(xfG(scG(prism(discO(0.42, 8), 0.02), 1, 0.42, 1), 0, a, 0,
                         Math.cos(a) * 0.66 + sw * 1.2, 0.6, Math.sin(a) * 0.66),
                     [244, 194, 46]));
      }
      ps.push(part(xfG(lathe([[0.62, 0], [0.6, 0.1], [0, 0.14]], 14), 0, 0, 0, sw * 1.2, 0.6, 0),
                   [86, 56, 34]));
      for (i = 0; i < 2; i++)
        ps.push(part(xfG(scG(prism(discO(0.34, 8), 0.02), 1, 0.6, 1), 0, 0, (i ? 1 : -1) * 0.7,
                         (i ? 1 : -1) * 0.42, -0.9, 0), [70, 140, 60]));
      obj(g, mergeC(ps), 0.1, 0, 0, 30, 0); }],

    ['Falling leaves', function (g, t) {
      var ps = [], i;
      for (i = 0; i < 16; i++) {
        var f = (t * 0.00035 + i * 0.062) % 1;
        var x = -1.9 + i * 0.25 + Math.sin(f * 8 + i) * 0.4;
        ps.push(part(xfG(scG(prism([[0, 0], [0.2, 0.16], [0.34, 0], [0.2, -0.18]], 0.02), 1, 1, 1),
                         t * 0.003 + i, t * 0.002 + i * 2, f * 6,
                         x, 1.6 - f * 3.2, ((i * 53 % 41) / 41 - 0.5) * 2),
                     [[204, 118, 44], [186, 74, 46], [214, 168, 54]][i % 3]));
      }
      obj(g, mergeC(ps), 0, 0, 0, 30, 0); }],

    ['Seed sprouting', function (g, t) {
      var c = (t % 7000) / 7000, ps = [], i;
      ps.push(part(boxGeo(0, -1.1, 0, 1.6, 0.5, 1.0), [92, 66, 44]));
      ps.push(part(ovalGeo(0, -0.9, 0, 0.2, 0.26, 0.2, 3, 7), [176, 140, 88]));
      if (c > 0.15) {
        var h = Math.min(1.6, (c - 0.15) * 3.2);
        ps.push(part(cylGeo(0, -0.7 + h / 2, 0, 0.05, 0.07, h, 6), [86, 166, 70]));
        for (i = 0; i < 2; i++)
          ps.push(part(xfG(scG(prism(discO(0.3, 8), 0.02), 1, 0.6, 1), 0, 0, (i ? 1 : -1) * 0.6,
                           (i ? 1 : -1) * 0.34 * Math.min(1, h), -0.7 + h, 0), [96, 182, 78]));
      }
      if (c > 0.7)
        ps.push(part(cylGeo(0, -0.66 + Math.min(1.6, (c - 0.15) * 3.2), 0, 0.02, 0.05, 0.3, 6),
                     [86, 166, 70]));
      obj(g, mergeC(ps), 0.22, t * 0.0006, 0, 32, 0); }],

    ['Venus flytrap', function (g, t) {
      var c = (t % 3400) / 3400;
      var open = c < 0.6 ? 0.9 : Math.max(0.05, 0.9 - (c - 0.6) * 6);
      var ps = [], i, k;
      ps.push(part(boxGeo(0, -1.3, 0, 1.2, 0.3, 0.9), [90, 68, 46]));
      for (k = 0; k < 2; k++) {
        var x = k ? 0.6 : -0.55, sc2 = k ? 0.9 : 1.1;
        ps.push(part(barGeo(x, -1.0, 0, x * 1.2, 0.1, 0, 0.09), [80, 150, 64]));
        for (i = 0; i < 2; i++) {
          var lp = xfG(scG(prism(discO(0.4, 8), 0.03), sc2, sc2 * 0.9, 1),
                       0, 0, (i ? 1 : -1) * open + (k ? 0.2 : -0.2),
                       x * 1.2 + (i ? 0.2 : -0.2) * sc2, 0.42, 0);
          ps.push(part(lp, [140, 40, 52]));
          for (var j = 0; j < 5; j++)
            ps.push(part(xfG(boxGeo(0, 0, 0, 0.03, 0.14, 0.03), 0, 0,
                             (i ? 1 : -1) * open + (k ? 0.2 : -0.2),
                             x * 1.2 + (i ? 0.45 : -0.45) * sc2, 0.42 + (j - 2) * 0.16, 0),
                         [230, 226, 210]));
        }
      }
      obj(g, mergeC(ps), 0.2, Math.sin(t * 0.0006) * 0.4, 0, 30, 0); }],

    ['Bonsai', function (g, t) {
      var m = geo('bonsai', function () {
        var ps = [part(lathe([[0.95, -1.5], [1.0, -1.1], [0.8, -1.05], [0.78, -1.4]], 12),
                       [130, 78, 60])], i, a;
        ps.push(part(barGeo(0, -1.05, 0, -0.2, -0.3, 0.1, 0.16), [110, 82, 54]));
        ps.push(part(barGeo(-0.2, -0.3, 0.1, 0.4, 0.2, -0.1, 0.13), [110, 82, 54]));
        ps.push(part(barGeo(0.4, 0.2, -0.1, 0.1, 0.7, 0.1, 0.1), [110, 82, 54]));
        ps.push(part(barGeo(-0.2, -0.3, 0.1, -0.9, 0.1, 0, 0.09), [110, 82, 54]));
        var pads = [[0.1, 0.95, 0.1, 0.62], [-1.0, 0.3, 0, 0.5], [0.75, 0.45, -0.1, 0.42]];
        for (i = 0; i < pads.length; i++)
          for (a = 0; a < 5; a++)
            ps.push(part(ovalGeo(pads[i][0] + Math.cos(a * 1.3) * pads[i][3] * 0.7,
                                 pads[i][1] + (a % 2) * 0.1,
                                 pads[i][2] + Math.sin(a * 1.3) * pads[i][3] * 0.7,
                                 pads[i][3] * 0.5, pads[i][3] * 0.3, pads[i][3] * 0.5, 3, 6),
                         [56, 122, 62]));
        return mergeC(ps);
      });
      obj(g, m, 0.14, t * 0.0008, 0, 30, 0); }],

    ['Night skyline', function (g, t) {
      var m = geo('skyline', function () {
        var ps = [], i, j;
        for (i = 0; i < 9; i++) {
          var h = 0.5 + ((i * 37) % 11) / 11 * 1.5;
          var x = -2.1 + i * 0.52;
          ps.push(part(boxGeo(x, -1.3 + h, -(i % 3) * 0.5, 0.22, h, 0.24), [40, 44, 58]));
          for (j = 0; j < 5; j++)
            if ((i * 7 + j * 3) % 3)
              ps.push(part(boxGeo(x + ((j % 2) ? 0.09 : -0.09), -1.2 + j * h * 0.38,
                                  -(i % 3) * 0.5 + 0.25, 0.05, 0.06, 0.01), [244, 226, 150]));
        }
        return mergeC(ps);
      });
      obj(g, m, 0.05, Math.sin(t * 0.0004) * 0.25, 0, 30, 0);
      var ps = [], i;
      for (i = 0; i < 10; i++)
        ps.push(part(ovalGeo(((i * 41 % 79) / 79 - 0.5) * 4, 0.9 + (i % 3) * 0.3, -2.5,
                             0.025, 0.025, 0.025, 3, 4), [240, 244, 250]));
      obj(g, mergeC(ps), 0, 0, 0, 30, 0); }],

    ['Lighthouse', function (g, t) {
      var a = t * 0.0022, ps = [], i;
      ps.push(part(lathe([[0.62, -1.5], [0.42, 0.4], [0.36, 0.9]], 12), [240, 238, 230]));
      for (i = 0; i < 3; i++)
        ps.push(part(lathe([[0.58 - i * 0.07, -1.1 + i * 0.62], [0.55 - i * 0.07, -0.85 + i * 0.62]], 12),
                     [206, 62, 50]));
      ps.push(part(cylGeo(0, 1.0, 0, 0.46, 0.42, 0.16, 12), [60, 66, 76]));
      ps.push(part(cylGeo(0, 1.34, 0, 0.3, 0.34, 0.55, 10), [70, 78, 90]));
      ps.push(part(ovalGeo(0, 1.34, 0, 0.2, 0.2, 0.2, 3, 7), [252, 236, 150]));
      ps.push(part(coneGeo(0, 1.75, 0, 0.4, 0.3, 10), [60, 66, 76]));
      ps.push(part(boxGeo(0, -1.62, 0, 2.4, 0.2, 1.2), [50, 60, 74]));
      obj(g, mergeC(ps), 0.12, 0, 0, 30, 0);
      g.globalAlpha = 0.3;
      obj(g, mergeC([part(xfG(coneGeo(0, 0, 0, 0.7, 3.2, 7), 0, 0, -Math.PI / 2,
                              Math.cos(a) * 1.6, 1.34, Math.sin(a) * 1.6 - 1),
                          [252, 240, 170])]), 0.12, 0, 0, 30, 0);
      g.globalAlpha = 1; }],

    ['Windmill', function (g, t) {
      var ps = [], i;
      ps.push(part(lathe([[0.8, -1.5], [0.6, 0.4], [0.55, 0.7]], 10), [214, 200, 176]));
      ps.push(part(coneGeo(0, 1.0, 0, 0.7, 0.6, 10), [140, 70, 56]));
      ps.push(part(cylGeo(0, 0.5, 0.6, 0.1, 0.1, 0.3, 6, 'z'), [90, 70, 50]));
      for (i = 0; i < 4; i++) {
        var a = t * 0.0018 + i * TAU / 4;
        ps.push(part(xfG(boxGeo(0, 0.75, 0, 0.1, 0.75, 0.04), 0, 0, a, 0, 0.5, 0.75),
                     [176, 140, 96]));
        ps.push(part(xfG(boxGeo(0, 0.75, 0, 0.3, 0.62, 0.02), 0, 0, a, 0, 0.5, 0.78),
                     [238, 234, 220]));
      }
      ps.push(part(boxGeo(0, -1.6, 0, 2.2, 0.14, 1.2), [96, 122, 70]));
      obj(g, mergeC(ps), 0.1, 0.1, 0, 28, 0); }],

    ['Ferris wheel', function (g, t) {
      var a = t * 0.0009, ps = [], i;
      for (i = 0; i < 12; i++) {
        var b = a + i * TAU / 12;
        ps.push(part(barGeo(0, 0.2, 0, Math.cos(b) * 1.5, 0.2 + Math.sin(b) * 1.5, 0, 0.03),
                     [200, 200, 210]));
        ps.push(part(boxGeo(Math.cos(b) * 1.62, 0.2 + Math.sin(b) * 1.62 - 0.18, 0,
                            0.14, 0.12, 0.14),
                     [[226, 80, 80], [240, 200, 70], [90, 170, 230]][i % 3]));
      }
      ps.push(part(torGeo(0, 0.2, 0, 1.55, 0.04, 20, 5, 'z'), [200, 200, 210]));
      ps.push(part(barGeo(-0.8, -1.4, 0.3, 0, 0.2, 0, 0.07), [150, 154, 162]));
      ps.push(part(barGeo(0.8, -1.4, 0.3, 0, 0.2, 0, 0.07), [150, 154, 162]));
      ps.push(part(cylGeo(0, 0.2, 0, 0.12, 0.12, 0.4, 8, 'z'), [120, 124, 132]));
      obj(g, mergeC(ps), 0.06, 0.24, 0, 30, 0); }],

    ['Construction crane', function (g, t) {
      var sw = Math.sin(t * 0.0009), ps = [], i;
      for (i = 0; i < 5; i++)
        ps.push(part(xfG(boxGeo(0, 0, 0, 0.22, 0.02, 0.22), 0, 0, 0, 0, -1.4 + i * 0.6, 0),
                     [240, 180, 50]));
      for (i = 0; i < 4; i++)
        ps.push(part(barGeo((i < 2 ? 1 : -1) * 0.2, -1.5, (i % 2 ? 1 : -1) * 0.2,
                            (i < 2 ? 1 : -1) * 0.2, 1.2, (i % 2 ? 1 : -1) * 0.2, 0.035),
                     [240, 180, 50]));
      var arm = { P: [part(boxGeo(0.7, 1.3, 0, 1.6, 0.06, 0.12), [240, 180, 50]),
                      part(boxGeo(-0.9, 1.3, 0, 0.5, 0.1, 0.14), [80, 82, 90]),
                      part(barGeo(1.6 + sw * 0.4, 1.28, 0, 1.6 + sw * 0.4, 0.2, 0, 0.015),
                           [200, 200, 210]),
                      part(boxGeo(1.6 + sw * 0.4, 0.1, 0, 0.14, 0.12, 0.14), [180, 60, 50])] };
      obj(g, mergeC(ps.concat(arm.P)), 0.06, sw * 0.5, 0, 30, 0); }],

    ['Neon sign', function (g, t) {
      var on = Math.sin(t * 0.006) > -0.5, ps = [], i, a;
      for (i = 0; i < 22; i++) {
        a = i / 22 * TAU;
        ps.push(part(ovalGeo(Math.cos(a) * 1.35, Math.sin(a) * 1.05, 0, 0.08, 0.08, 0.08, 3, 5),
                     on ? [250, 90, 160] : [90, 40, 66]));
      }
      var wordX = [-0.7, -0.24, 0.24, 0.7];
      for (i = 0; i < 4; i++)
        ps.push(part(boxGeo(wordX[i], 0, 0.1, 0.1, 0.4, 0.06),
                     on ? [110, 230, 250] : [40, 76, 84]));
      ps.push(part(boxGeo(0, 0, -0.24, 1.6, 1.25, 0.03), [44, 40, 54]));
      obj(g, mergeC(ps), 0.04, Math.sin(t * 0.0006) * 0.3, 0, 32, 0); }],

    ['Subway train', function (g, t) {
      var x = (((t * 0.0004) % 1) - 0.5) * 7, ps = [], i, k;
      for (k = 0; k < 2; k++) {
        var cx = x + k * 2.3;
        ps.push(part(scG(xfG(lathe([[0.06, 1], [0.6, 0.86], [0.68, 0], [0.6, -0.86], [0.06, -1]], 10),
                             0, 0, -Math.PI / 2), 1.05, 0.62, 0.6), [188, 192, 200]));
        ps[ps.length - 1] = part(xfG(scG(xfG(lathe([[0.06, 1], [0.6, 0.86], [0.68, 0],
                                                    [0.6, -0.86], [0.06, -1]], 10),
                                             0, 0, -Math.PI / 2), 1.05, 0.62, 0.6),
                                     0, 0, 0, cx, 0.1, 0), [188, 192, 200]);
        for (i = 0; i < 3; i++)
          ps.push(part(boxGeo(cx - 0.6 + i * 0.6, 0.24, 0.62, 0.2, 0.2, 0.02), [110, 170, 210]));
      }
      ps.push(part(boxGeo(0, -0.72, 0, 3.4, 0.08, 0.7), [80, 74, 66]));
      for (i = 0; i < 10; i++)
        ps.push(part(boxGeo(-2.4 + i * 0.55, -0.84, 0, 0.16, 0.06, 0.9), [110, 80, 56]));
      obj(g, mergeC(ps), 0.2, 0.36, 0, 28, 1); }],

    ['Rain on glass', function (g, t) {
      var ps = [], i;
      ps.push(part(boxGeo(0, 0, -0.6, 5.2, 3.8, 0.05), [58, 76, 96]));
      for (i = 0; i < 30; i++) {
        var f = (t * 0.0006 * (0.5 + (i % 4) * 0.3) + i * 0.033) % 1;
        var x = ((i * 47 % 89) / 89 - 0.5) * 4.2;
        ps.push(part(ovalGeo(x + Math.sin(f * 12 + i) * 0.05, 1.5 - f * 3.0, -0.4,
                             0.05, 0.09 + (i % 3) * 0.03, 0.05, 3, 5), [186, 218, 236]));
      }
      for (i = 0; i < 12; i++)
        ps.push(part(ovalGeo(((i * 61 % 71) / 71 - 0.5) * 4, ((i * 29 % 53) / 53 - 0.5) * 3, -0.45,
                             0.04, 0.04, 0.04, 3, 4), [170, 206, 226]));
      obj(g, mergeC(ps), 0, 0, 0, 30, 0); }],

    ['Streetlight', function (g, t) {
      var ps = [], i;
      ps.push(part(cylGeo(0.9, -0.4, 0, 0.09, 0.13, 2.4, 8), [66, 70, 80]));
      ps.push(part(barGeo(0.9, 0.8, 0, 0.1, 1.15, 0, 0.08), [66, 70, 80]));
      ps.push(part(xfG(lathe([[0, 0.1], [0.34, -0.06], [0.3, -0.12], [0, -0.1]], 10),
                       0, 0, 0, 0.05, 1.1, 0), [80, 84, 94]));
      ps.push(part(ovalGeo(0.05, 1.0, 0, 0.2, 0.12, 0.2, 3, 7), [252, 240, 180]));
      g.globalAlpha = 0.14;
      obj(g, mergeC([part(xfG(coneGeo(0, 0, 0, 0.85, 1.9, 9), Math.PI, 0, 0, 0.05, 0.05, 0),
                          [252, 238, 176])]), 0.1, 0, 0, 30, 0);
      g.globalAlpha = 1;
      for (i = 0; i < 14; i++)
        ps.push(part(boxGeo(0.05 + ((i * 37 % 41) / 41 - 0.5) * 1.6,
                            1.0 - ((t * 0.0016 + i * 0.07) % 1) * 2.2, ((i % 3) - 1) * 0.3,
                            0.015, 0.12, 0.015), [180, 210, 230]));
      ps.push(part(boxGeo(0, -1.7, 0, 2.4, 0.16, 1.0), [56, 58, 66]));
      obj(g, mergeC(ps), 0.1, 0.2, 0, 30, 0); }],

    ['Drawbridge', function (g, t) {
      var a = (Math.sin(t * 0.0011) + 1) / 2 * 1.1, ps = [], i;
      ps.push(part(boxGeo(0, -1.2, 0, 2.4, 0.3, 1.0), [60, 90, 120]));
      for (i = 0; i < 2; i++) {
        var sd = i ? 1 : -1;
        ps.push(part(boxGeo(sd * 1.6, -0.35, 0, 0.5, 0.6, 0.7), [140, 130, 116]));
        ps.push(part(boxGeo(sd * 1.6, 0.6, 0, 0.24, 0.4, 0.3), [120, 110, 96]));
        ps.push(part(xfG(boxGeo(0.55, 0, 0, 0.6, 0.06, 0.55), 0, 0, sd * a,
                         sd * 1.1, 0.3, 0), [150, 110, 70]));
      }
      obj(g, mergeC(ps), 0.18, 0.2, 0, 30, 1); }],
    ['Bouncing ball', function (g, t) {
      var c = (t % 1400) / 1400;
      var y = -0.95 + Math.abs(Math.sin(c * Math.PI)) * 1.9;
      var sq = y < -0.75 ? 0.22 : 0;
      var ps = [part(ovalGeo(Math.sin(t * 0.0008) * 1.2, y, 0,
                             0.42 + sq, 0.42 - sq, 0.42, 6, 12), [220, 70, 70])], i;
      for (i = 0; i < 4; i++)
        ps.push(part(xfG(boxGeo(0, 0, 0, 0.42, 0.06, 0.06), 0, i * 0.8 + t * 0.004, 0,
                         Math.sin(t * 0.0008) * 1.2, y, 0), [244, 240, 232]));
      ps.push(part(boxGeo(0, -1.4, 0, 2.4, 0.14, 1.2), [70, 86, 76]));
      obj(g, mergeC(ps), 0.24, 0, 0, 32, 0); }],

    ['Dartboard', function (g, t) {
      var c = (t % 2600) / 2600, ps = [], i;
      ps.push(part(lathe([[0, -0.1], [1.35, -0.1], [1.4, 0.02], [1.35, 0.08], [0, 0.08]], 18),
                   [40, 42, 50]));
      for (i = 0; i < 10; i++)
        ps.push(part(xfG(prism([[0, 0], [1.3, 0.42], [1.3, -0.42]], 0.01), 0, 0, i * TAU / 10,
                         0, 0, 0.1), i % 2 ? [232, 224, 200] : [40, 42, 50]));
      ps.push(part(xfG(prism(ringO(0.72, 0.13, 20), 0.015), 0, 0, 0, 0, 0, 0.11), [190, 50, 46]));
      ps.push(part(xfG(prism(discO(0.2, 12), 0.02), 0, 0, 0, 0, 0, 0.12), [60, 140, 80]));
      ps.push(part(xfG(prism(discO(0.1, 10), 0.02), 0, 0, 0, 0, 0, 0.14), [190, 50, 46]));
      var dx = c < 0.5 ? -3 + c * 6.4 : 0.4, dy = c < 0.5 ? 1.4 - c * 2.6 : 0.15;
      ps.push(part(barGeo(dx, dy, 0.16, dx - 0.7, dy + 0.16, 1.0, 0.035), [200, 204, 212]));
      ps.push(part(xfG(prism(starO(0.16, 0.06, 4), 0.02), 0, 0, 0, dx - 0.7, dy + 0.16, 1.0),
                   [230, 190, 60]));
      obj(g, mergeC(ps), 0.06, Math.sin(t * 0.0005) * 0.35, 0, 32, 0); }],

    ['Slot machine', function (g, t) {
      var ps = [], i, k;
      ps.push(part(boxGeo(0, 0, 0, 1.1, 1.3, 0.6), [176, 60, 56]));
      ps.push(part(boxGeo(0, 1.42, 0, 1.0, 0.2, 0.5), [140, 44, 42]));
      for (k = 0; k < 3; k++) {
        var stop = Math.max(0, (t % 4000) / 4000 - 0.2 - k * 0.16);
        var spin = stop > 0.3 ? Math.round(t * 0.001 + k) : t * 0.02 + k;
        ps.push(part(boxGeo(-0.62 + k * 0.62, 0.3, 0.61, 0.24, 0.36, 0.02), [242, 240, 230]));
        for (i = 0; i < 3; i++)
          ps.push(part(xfG(prism(starO(0.11, 0.05, 5), 0.01), 0, 0, 0,
                           -0.62 + k * 0.62, 0.3 + Math.sin(spin + i * 2.1) * 0.2, 0.64),
                       [[220, 60, 60], [240, 200, 70], [90, 180, 240]][(k + i) % 3]));
      }
      ps.push(part(barGeo(1.15, 0.4, 0, 1.6, 0.9 - ((t % 4000) / 4000 < 0.2 ? 0.8 : 0), 0, 0.05),
                   [190, 194, 202]));
      ps.push(part(ovalGeo(1.6, 1.0 - ((t % 4000) / 4000 < 0.2 ? 0.8 : 0), 0, 0.15, 0.15, 0.15, 3, 6),
                   [220, 60, 60]));
      obj(g, mergeC(ps), 0.16, 0.36, 0, 30, 1); }],

    ['Pinball', function (g, t) {
      var ps = [], i;
      ps.push(part(xfG(boxGeo(0, 0, 0, 1.2, 1.6, 0.06), -0.9, 0, 0, 0, 0, 0), [40, 50, 80]));
      for (i = 0; i < 3; i++) {
        var bx = [-0.6, 0.1, 0.7][i], by = [0.5, 0.9, 0.2][i];
        var p = rot3([bx, by, 0.12], -0.9, 0, 0);
        ps.push(part(cylGeo(p[0], p[1], p[2], 0.18, 0.2, 0.18, 8), [230, 90, 90]));
      }
      var ph = (t % 2200) / 2200;
      var bl = rot3([-0.9 + Math.sin(ph * 7) * 0.7, -1.3 + ph * 2.4, 0.16], -0.9, 0, 0);
      ps.push(part(ovalGeo(bl[0], bl[1], bl[2], 0.11, 0.11, 0.11, 3, 6), [216, 220, 228]));
      for (i = 0; i < 2; i++) {
        var f = rot3([(i ? 0.45 : -0.45), -1.3, 0.1], -0.9, 0, 0);
        ps.push(part(xfG(boxGeo(0, 0, 0, 0.3, 0.06, 0.05), -0.9, 0,
                         (i ? -1 : 1) * (0.3 + Math.sin(t * 0.01) * 0.4),
                         f[0], f[1], f[2]), [240, 200, 70]));
      }
      obj(g, mergeC(ps), 0.1, 0.1, 0, 32, 0); }],

    ['Dice rolling', function (g, t) {
      var ps = [], k, i;
      var pips = [[[0, 0]], [[-0.4, 0.4], [0.4, -0.4]], [[-0.4, 0.4], [0, 0], [0.4, -0.4]]];
      for (k = 0; k < 2; k++) {
        var a = t * (0.0022 + k * 0.0009), b = t * (0.0031 - k * 0.0008);
        var x = -0.75 + k * 1.5, y = Math.abs(Math.sin(t * 0.0018 + k * 2)) * 0.9 - 0.5;
        ps.push(part(xfG(boxGeo(0, 0, 0, 0.46, 0.46, 0.46), a, b, 0, x, y, 0), [242, 240, 232]));
        for (i = 0; i < pips[k + 1].length; i++)
          ps.push(part(xfG(ovalGeo(pips[k + 1][i][0] * 0.46, pips[k + 1][i][1] * 0.46, 0.48,
                                   0.08, 0.08, 0.03, 3, 5), a, b, 0, x, y, 0), [40, 40, 48]));
      }
      ps.push(part(boxGeo(0, -1.3, 0, 2.2, 0.12, 1.2), [60, 96, 74]));
      obj(g, mergeC(ps), 0.28, 0, 0, 32, 0); }],

    ['Bowling', function (g, t) {
      var c = (t % 3600) / 3600, ps = [], i;
      var bz = 2.2 - c * 4.4;
      for (i = 0; i < 6; i++) {
        var px = ((i % 3) - 1) * 0.42, pz = -1.4 - (i < 3 ? 0 : 0.5);
        var down = (c > 0.62 && bz < pz + 0.6) ? Math.min(1.4, (c - 0.62) * 8) : 0;
        ps.push(part(xfG(lathe([[0.16, -0.5], [0.24, -0.2], [0.12, 0.16], [0.2, 0.4],
                                [0.1, 0.56], [0, 0.58]], 8), down, 0, down * 0.8,
                         px, -0.7 + down * 0.2, pz), [244, 242, 234]));
      }
      ps.push(part(ovalGeo(Math.sin(c * 3) * 0.3, -0.62, bz, 0.34, 0.34, 0.34, 5, 10),
                   [50, 60, 120]));
      ps.push(part(boxGeo(0, -0.98, 0, 1.4, 0.06, 3.0), [186, 146, 90]));
      obj(g, mergeC(ps), 0.34, 0.06, 0, 32, 0); }],

    ['Basketball hoop', function (g, t) {
      var c = (t % 2600) / 2600, ps = [], i;
      ps.push(part(boxGeo(0, 0.7, -0.6, 0.9, 0.6, 0.06), [238, 236, 228]));
      ps.push(part(boxGeo(0, 0.6, -0.55, 0.34, 0.24, 0.02), [220, 90, 60]));
      ps.push(part(torGeo(0, 0.28, -0.1, 0.42, 0.05, 14, 5), [226, 110, 50]));
      for (i = 0; i < 10; i++) {
        var a = i * TAU / 10;
        ps.push(part(barGeo(Math.cos(a) * 0.42, 0.28, -0.1 + Math.sin(a) * 0.42,
                            Math.cos(a) * 0.2, -0.2, -0.1 + Math.sin(a) * 0.2, 0.015),
                     [240, 240, 236]));
      }
      var by = c < 0.5 ? -1.3 + Math.sin(c * 2 * Math.PI) * 2.6 : 0.3 - (c - 0.5) * 3.4;
      var bz = c < 0.5 ? 1.6 - c * 3.4 : -0.1;
      ps.push(part(ovalGeo(0, by, bz, 0.28, 0.28, 0.28, 5, 9), [216, 118, 48]));
      ps.push(part(cylGeo(0, -0.4, -0.7, 0.09, 0.11, 2.0, 8), [90, 94, 104]));
      obj(g, mergeC(ps), 0.1, 0.16, 0, 30, 0); }],

    ['Ping pong', function (g, t) {
      var c = (t % 1600) / 1600, ps = [], i;
      ps.push(part(boxGeo(0, -0.7, 0, 1.9, 0.06, 1.1), [40, 90, 130]));
      ps.push(part(boxGeo(0, -0.44, 0, 0.03, 0.22, 1.15), [238, 238, 232]));
      for (i = 0; i < 2; i++) {
        var sd = i ? 1 : -1;
        var sw = Math.sin(t * 0.008 + i * Math.PI) * 0.5;
        ps.push(part(xfG(scG(prism(discO(0.34, 10), 0.04), 1, 1, 1), 0, 0, sw,
                         sd * 1.5, -0.1, 0), [180, 50, 50]));
        ps.push(part(xfG(boxGeo(0, -0.4, 0, 0.06, 0.22, 0.06), 0, 0, sw, sd * 1.5, -0.1, 0),
                     [150, 110, 70]));
      }
      var bx = Math.cos(c * TAU) * 1.2;
      ps.push(part(ovalGeo(bx, -0.3 + Math.abs(Math.sin(c * TAU * 2)) * 0.6, 0,
                           0.1, 0.1, 0.1, 3, 6), [244, 240, 230]));
      obj(g, mergeC(ps), 0.28, 0.1, 0, 32, 0); }],

    ['Punching bag', function (g, t) {
      var a = Math.sin(t * 0.005) * 0.4, ps = [], i;
      ps.push(part(boxGeo(0, 1.5, 0, 1.2, 0.08, 0.6), [70, 72, 80]));
      for (i = 0; i < 2; i++)
        ps.push(part(barGeo((i ? 0.12 : -0.12), 1.42, 0,
                            Math.sin(a) * 1.5 + (i ? 0.1 : -0.1),
                            1.42 - Math.cos(a) * 0.9, 0, 0.02), [180, 184, 192]));
      ps.push(part(xfG(lathe([[0, 0.6], [0.42, 0.5], [0.46, -0.5], [0.34, -0.64], [0, -0.64]], 12),
                       0, 0, 0, Math.sin(a) * 1.5, 1.42 - Math.cos(a) * 1.5, 0), [140, 70, 46]));
      ps.push(part(boxGeo(-1.6, -0.4, 0.3, 0.26, 0.22, 0.26), [170, 50, 50]));
      obj(g, mergeC(ps), 0.1, 0.24, 0, 30, 0); }],

    ['Oscilloscope', function (g, t) {
      var ps = [], i;
      ps.push(part(boxGeo(0, 0, -0.3, 1.7, 1.25, 0.2), [50, 54, 62]));
      ps.push(part(boxGeo(0, 0, -0.1, 1.45, 1.0, 0.04), [16, 34, 24]));
      for (i = 0; i < 5; i++) {
        ps.push(part(boxGeo(0, -0.8 + i * 0.4, -0.06, 1.4, 0.01, 0.01), [40, 90, 60]));
        ps.push(part(boxGeo(-1.4 + i * 0.7, 0, -0.06, 0.01, 0.95, 0.01), [40, 90, 60]));
      }
      for (i = 0; i < 40; i++) {
        var x = -1.35 + i * 0.069;
        var y = Math.sin(x * 3.4 + t * 0.006) * 0.6 * Math.sin(x * 0.9 + t * 0.001);
        ps.push(part(ovalGeo(x, y, 0, 0.035, 0.035, 0.035, 3, 4), [120, 250, 150]));
      }
      obj(g, mergeC(ps), 0.06, Math.sin(t * 0.0005) * 0.28, 0, 32, 0); }],

    ['Equaliser', function (g, t) {
      var ps = [], i, k;
      for (i = 0; i < 12; i++) {
        var h = 0.15 + (Math.sin(t * 0.005 + i * 0.9) * 0.5 + 0.5) *
                       (0.4 + Math.sin(i * 1.3) * 0.2 + 0.5) * 1.4;
        for (k = 0; k * 0.24 < h * 2; k++)
          ps.push(part(boxGeo(-1.55 + i * 0.28, -1.2 + k * 0.24, 0, 0.11, 0.09, 0.11),
                       k < 4 ? [80, 200, 120] : k < 7 ? [230, 200, 70] : [230, 80, 70]));
      }
      obj(g, mergeC(ps), 0.24, Math.sin(t * 0.0006) * 0.4, 0, 32, 1); }],

    ['Radar sweep', function (g, t) {
      var a = t * 0.0022, ps = [], i;
      ps.push(part(lathe([[0, -0.06], [1.5, -0.06], [1.55, 0.04], [0, 0.04]], 18), [22, 52, 36]));
      for (i = 1; i <= 3; i++)
        ps.push(part(torGeo(0, 0.06, 0, i * 0.48, 0.02, 20, 4), [70, 180, 110]));
      ps.push(part(xfG(prism([[0, 0], [1.5, 0.34], [1.5, -0.34]], 0.01), Math.PI / 2, -a, 0,
                       0, 0.08, 0), [90, 230, 140]));
      for (i = 0; i < 3; i++) {
        var b = i * 2.2 + 0.4;
        var fade = ((a - b) % TAU + TAU) % TAU;
        ps.push(part(ovalGeo(Math.cos(b) * (0.5 + i * 0.4), 0.12, Math.sin(b) * (0.5 + i * 0.4),
                             0.09, 0.06, 0.09, 3, 5),
                     fade < 1.2 ? [190, 255, 200] : [60, 150, 90]));
      }
      obj(g, mergeC(ps), 1.0, 0, 0, 32, 0); }],

    ['ECG monitor', function (g, t) {
      var ps = [], i;
      ps.push(part(boxGeo(0, 0, -0.3, 1.75, 1.2, 0.22), [54, 58, 66]));
      ps.push(part(boxGeo(0, 0, -0.08, 1.5, 0.95, 0.04), [14, 26, 34]));
      for (i = 0; i < 44; i++) {
        var f = ((i / 44) + t * 0.0006) % 1;
        var x = -1.45 + i * 0.066;
        var q = (f * 6) % 1;
        var y = q < 0.3 ? 0 : q < 0.38 ? -0.18 : q < 0.46 ? 0.7 : q < 0.54 ? -0.3 :
                q < 0.7 ? 0 : q < 0.82 ? 0.18 : 0;
        ps.push(part(ovalGeo(x, y, 0, 0.035, 0.035, 0.035, 3, 4), [110, 250, 160]));
      }
      for (i = 0; i < 3; i++)
        ps.push(part(boxGeo(-1.2 + i * 0.4, -0.85, 0.02, 0.1, 0.06, 0.02),
                     [[240, 90, 80], [240, 200, 80], [110, 200, 240]][i]));
      obj(g, mergeC(ps), 0.06, Math.sin(t * 0.0005) * 0.28, 0, 32, 0); }],

    ['Seismograph', function (g, t) {
      var q = Math.sin(t * 0.0011) > 0.6 ? 1 : 0.12, ps = [], i;
      ps.push(part(xfG(cylGeo(0, 0, 0, 0.7, 0.7, 1.9, 14), 0, 0, Math.PI / 2, -0.2, -0.2, 0),
                   [232, 228, 218]));
      for (i = 0; i < 34; i++) {
        var x = -1.1 + i * 0.066;
        var y = Math.sin(i * 1.9 + t * 0.004) * 0.5 * q;
        ps.push(part(ovalGeo(x, -0.2 + y, 0.72, 0.03, 0.03, 0.03, 3, 4), [190, 50, 46]));
      }
      ps.push(part(barGeo(1.3, 1.2, 0.6, 1.0 + Math.sin(t * 0.004) * 0.06, -0.2, 0.74, 0.03),
                   [80, 84, 94]));
      ps.push(part(boxGeo(0, -1.35, 0, 1.9, 0.14, 0.9), [70, 74, 84]));
      obj(g, mergeC(ps), 0.24, 0.2, 0, 30, 0); }],

    ['Pendulum', function (g, t) {
      var a = Math.sin(t * 0.0022) * 0.8, ps = [], i;
      ps.push(part(boxGeo(0, 1.4, 0, 1.4, 0.12, 0.4), [110, 78, 46]));
      ps.push(part(xfG(barGeo(0, 1.3, 0, 0, -0.5, 0, 0.02), 0, 0, a, 0, 0, 0), [190, 194, 202]));
      var p = rot3([0, -0.7, 0], 0, 0, a);
      ps.push(part(ovalGeo(p[0], 1.3 + p[1] * 1.0, p[2], 0.3, 0.3, 0.3, 5, 10), [190, 160, 70]));
      for (i = 0; i < 2; i++)
        ps.push(part(barGeo((i ? 1 : -1) * 1.1, 1.34, 0, (i ? 1 : -1) * 0.9, -1.4, 0, 0.05),
                     [130, 92, 54]));
      obj(g, mergeC(ps), 0.1, 0.3, 0, 32, 0); }],

    ['Spinning compass', function (g, t) {
      var a = t * 0.0016 + Math.sin(t * 0.0008) * 2, ps = [], i;
      ps.push(part(lathe([[0, -0.2], [1.2, -0.2], [1.3, 0.06], [1.2, 0.14], [0, 0.14]], 16),
                   [176, 140, 76]));
      ps.push(part(lathe([[0, 0.16], [1.05, 0.16], [1.0, 0.12], [0, 0.12]], 16), [242, 238, 224]));
      for (i = 0; i < 8; i++) {
        var b = i * TAU / 8;
        ps.push(part(boxGeo(Math.cos(b) * 0.88, 0.19, Math.sin(b) * 0.88,
                            0.04, 0.02, 0.1), [60, 60, 68]));
      }
      ps.push(part(xfG(prism([[0, 0.8], [0.16, 0], [-0.16, 0]], 0.03), Math.PI / 2, -a, 0,
                       0, 0.24, 0), [200, 60, 56]));
      ps.push(part(xfG(prism([[0, -0.8], [0.16, 0], [-0.16, 0]], 0.03), Math.PI / 2, -a, 0,
                       0, 0.24, 0), [230, 228, 220]));
      ps.push(part(ovalGeo(0, 0.26, 0, 0.09, 0.06, 0.09, 3, 6), [120, 100, 60]));
      obj(g, mergeC(ps), 0.9, 0, 0, 34, 0); }],

    ['Sonar ping', function (g, t) {
      var ps = [], i, k;
      ps.push(part(boxGeo(0, 0, -1.2, 6.5, 4.8, 0.1), [18, 44, 62]));
      for (k = 0; k < 3; k++) {
        var f = ((t * 0.0006 + k * 0.33) % 1);
        for (i = 0; i < 18; i++) {
          var a = i * TAU / 18;
          ps.push(part(ovalGeo(Math.cos(a) * f * 1.8, Math.sin(a) * f * 1.4, -1.0,
                               0.05, 0.05, 0.05, 3, 4),
                       [70 + (1 - f) * 150, 200, 150 + (1 - f) * 80]));
        }
      }
      ps.push(part(ovalGeo(0, 0, -0.9, 0.14, 0.14, 0.14, 3, 6), [200, 250, 220]));
      ps.push(part(xfG(scG(xfG(lathe([[0.03, 1], [0.5, 0.8], [0.6, 0], [0.4, -0.9], [0.03, -1]], 8),
                               0, 0, -Math.PI / 2), 0.5, 0.16, 0.16), 0, 0, 0.3, 0.9, 0.5, -0.9),
                   [90, 130, 120]));
      obj(g, mergeC(ps), 0, 0, 0, 30, 0); }],

    ['Stopwatch', function (g, t) {
      var ps = [], i;
      ps.push(part(lathe([[0, -0.2], [1.2, -0.2], [1.28, 0.04], [1.2, 0.16], [0, 0.16]], 18),
                   [190, 194, 202]));
      ps.push(part(lathe([[0, 0.18], [1.05, 0.18], [1.0, 0.14], [0, 0.14]], 18), [244, 242, 234]));
      ps.push(part(cylGeo(0, 1.32, 0, 0.16, 0.2, 0.3, 8), [150, 154, 162]));
      ps.push(part(torGeo(0, 1.6, 0, 0.22, 0.06, 10, 5), [150, 154, 162]));
      for (i = 0; i < 12; i++) {
        var b = i * TAU / 12;
        ps.push(part(boxGeo(Math.cos(b) * 0.88, 0.21, Math.sin(b) * 0.88, 0.04, 0.02,
                            i % 3 ? 0.08 : 0.14), [50, 50, 58]));
      }
      var a = (t % 60000) / 60000 * TAU * 12;
      ps.push(part(xfG(prism([[0, 0.9], [0.06, 0], [-0.06, 0]], 0.02), Math.PI / 2, -a, 0,
                       0, 0.26, 0), [200, 60, 56]));
      ps.push(part(xfG(prism([[0, 0.5], [0.05, 0], [-0.05, 0]], 0.02), Math.PI / 2, -a * 0.08, 0,
                       0, 0.28, 0), [50, 50, 58]));
      obj(g, mergeC(ps), 0.95, 0, 0, 32, 0); }],

    ['Barometer', function (g, t) {
      var a = Math.sin(t * 0.0007) * 1.6, ps = [], i;
      ps.push(part(lathe([[0, -0.24], [1.3, -0.24], [1.38, 0.02], [1.3, 0.16], [0, 0.16]], 18),
                   [130, 88, 52]));
      ps.push(part(lathe([[0, 0.18], [1.1, 0.18], [1.05, 0.14], [0, 0.14]], 18), [246, 240, 224]));
      for (i = 0; i < 16; i++) {
        var b = -2.4 + i * (4.8 / 15);
        ps.push(part(boxGeo(Math.cos(b) * 0.9, 0.21, Math.sin(b) * 0.9, 0.04, 0.02, 0.09),
                     [60, 56, 50]));
      }
      ps.push(part(xfG(prism([[0, 0.85], [0.05, 0], [-0.05, 0]], 0.02), Math.PI / 2, -a, 0,
                       0, 0.26, 0), [40, 40, 48]));
      ps.push(part(xfG(prism([[0, 0.8], [0.04, 0], [-0.04, 0]], 0.02), Math.PI / 2, -a * 0.3 - 0.6, 0,
                       0, 0.24, 0), [190, 60, 56]));
      ps.push(part(ovalGeo(0, 0.28, 0, 0.08, 0.06, 0.08, 3, 6), [120, 100, 60]));
      obj(g, mergeC(ps), 0.9, 0, 0, 32, 0); }],

    ['Campfire', function (g, t) {
      var ps = [], i;
      for (i = 0; i < 5; i++) {
        var a = i * TAU / 5;
        ps.push(part(xfG(cylGeo(0, 0, 0, 0.1, 0.13, 1.5, 6), 0.5, a, 0,
                         Math.cos(a) * 0.5, -0.9, Math.sin(a) * 0.5), [116, 82, 52]));
      }
      for (i = 0; i < 9; i++) {
        var f = ((t * 0.0016 + i * 0.111) % 1);
        var r = (1 - f) * 0.42;
        ps.push(part(ovalGeo(Math.sin(t * 0.006 + i * 2) * f * 0.3, -0.7 + f * 1.5,
                             Math.cos(t * 0.005 + i) * f * 0.2, r, r * 1.4, r, 3, 6),
                     f < 0.4 ? [250, 220, 90] : f < 0.7 ? [244, 140, 46] : [200, 66, 40]));
      }
      for (i = 0; i < 5; i++)
        ps.push(part(ovalGeo(Math.sin(t * 0.002 + i) * 0.5, 1.0 + i * 0.3, 0,
                             0.1 + i * 0.05, 0.09 + i * 0.04, 0.1, 3, 5), [110, 110, 118]));
      obj(g, mergeC(ps), 0.24, t * 0.0004, 0, 30, 0); }],

    ['Candle', function (g, t) {
      var fl = Math.sin(t * 0.012) * 0.06, ps = [], i;
      ps.push(part(lathe([[0, -1.2], [0.6, -1.2], [0.56, 0.5], [0.5, 0.6], [0, 0.62]], 14),
                   [240, 232, 210]));
      for (i = 0; i < 3; i++)
        ps.push(part(ovalGeo(Math.cos(i * 2.1) * 0.4, 0.4 - i * 0.3, Math.sin(i * 2.1) * 0.4,
                             0.09, 0.22, 0.09, 3, 5), [226, 218, 196]));
      ps.push(part(cylGeo(0, 0.68, 0, 0.02, 0.03, 0.16, 5), [50, 46, 42]));
      ps.push(part(xfG(coneGeo(0, 0, 0, 0.14, 0.55, 7), 0, 0, fl, 0, 1.04, 0), [250, 190, 60]));
      ps.push(part(xfG(coneGeo(0, 0, 0, 0.07, 0.3, 6), 0, 0, fl, 0, 0.94, 0), [252, 244, 200]));
      ps.push(part(lathe([[0, -1.3], [0.9, -1.3], [0.92, -1.2], [0, -1.2]], 14), [180, 150, 80]));
      obj(g, mergeC(ps), 0.14, t * 0.0006, 0, 32, 0); }],

    ['Fireworks', function (g, t) {
      var ps = [], i, k;
      for (k = 0; k < 3; k++) {
        var f = ((t * 0.0005 + k * 0.33) % 1);
        var cx = [-1.0, 0.4, 1.1][k], cy = [0.5, 0.9, -0.2][k];
        var col = [[250, 100, 120], [120, 210, 250], [250, 220, 110]][k];
        if (f < 0.25) {
          ps.push(part(ovalGeo(cx, -1.4 + f * 4 * (cy + 1.4), 0, 0.07, 0.1, 0.07, 3, 5),
                       [250, 240, 200]));
        } else {
          var r = (f - 0.25) * 2.2;
          for (i = 0; i < 30; i++) {
            var a = i * 2.399, e = 0.55 + (i % 4) * 0.16;
            ps.push(part(ovalGeo(cx + Math.cos(a) * r * e,
                                 cy + Math.sin(a) * r * e - r * r * 0.35,
                                 Math.cos(a * 1.7) * r * e * 0.6,
                                 0.1 - r * 0.02, 0.1 - r * 0.02, 0.1 - r * 0.02, 3, 5), col));
          }
        }
      }
      obj(g, mergeC(ps), 0, 0, 0, 30, 0); }],

    ['Rising balloon', function (g, t) {
      var ps = [], i;
      for (i = 0; i < 5; i++) {
        var f = ((t * 0.00028 * (0.6 + i * 0.12) + i * 0.2) % 1);
        var x = -1.5 + i * 0.75 + Math.sin(f * 5 + i) * 0.3;
        var y = -1.7 + f * 3.4;
        var col = [[226, 70, 90], [240, 200, 70], [90, 180, 230], [140, 210, 120], [200, 130, 220]][i];
        ps.push(part(ovalGeo(x, y, -i * 0.4, 0.3, 0.36, 0.3, 5, 9), col));
        ps.push(part(coneGeo(x, y - 0.42, -i * 0.4, 0.08, 0.2, 5), col));
        ps.push(part(barGeo(x, y - 0.5, -i * 0.4, x + Math.sin(f * 9) * 0.15, y - 1.0, -i * 0.4,
                            0.012), [220, 220, 226]));
      }
      obj(g, mergeC(ps), 0, 0, 0, 30, 0); }],

    ['Kite', function (g, t) {
      var sw = Math.sin(t * 0.0016), ps = [], i;
      var kx = sw * 0.9, ky = 0.7 + Math.cos(t * 0.0012) * 0.3;
      ps.push(part(xfG(prism([[0, 0.6], [0.45, 0], [0, -0.75], [-0.45, 0]], 0.02),
                       0.2, sw * 0.5, sw * 0.3, kx, ky, 0), [226, 70, 80]));
      ps.push(part(xfG(prism([[0, 0.6], [0.45, 0], [0, 0]], 0.025), 0.2, sw * 0.5, sw * 0.3,
                       kx, ky, 0), [240, 200, 70]));
      for (i = 0; i < 7; i++) {
        var f = i / 7;
        ps.push(part(ovalGeo(kx - f * 1.4 - Math.sin(t * 0.004 + i) * 0.12,
                             ky - 0.8 - f * 1.3, 0, 0.06, 0.06, 0.06, 3, 4),
                     i % 2 ? [110, 200, 240] : [240, 160, 90]));
      }
      for (i = 0; i < 9; i++)
        ps.push(part(ovalGeo(kx - (kx + 1.6) * (i / 9), ky - (ky + 1.5) * (i / 9) * (i / 9),
                             0, 0.018, 0.018, 0.018, 3, 4), [230, 230, 236]));
      obj(g, mergeC(ps), 0, 0, 0, 30, 0); }],

    ['Umbrella', function (g, t) {
      var sp = t * 0.0012, ps = [], i;
      for (i = 0; i < 8; i++) {
        var a = i * TAU / 8;
        ps.push(part(xfG(prism([[0, 0], [0.52, -0.42], [0.86, -0.04], [0.4, 0.1]], 0.02),
                         -0.9, a, 0, 0, 0.55, 0), i % 2 ? [200, 50, 46] : [166, 38, 36]));
      }
      ps.push(part(cylGeo(0, -0.35, 0, 0.05, 0.05, 2.0, 6), [130, 92, 54]));
      ps.push(part(torGeo(0, -1.32, 0.16, 0.16, 0.05, 10, 5, 'x'), [130, 92, 54]));
      for (i = 0; i < 14; i++)
        ps.push(part(boxGeo(((i * 37 % 61) / 61 - 0.5) * 4, 1.5 - ((t * 0.0018 + i * 0.07) % 1) * 3,
                            ((i % 3) - 1) * 0.6, 0.02, 0.14, 0.02), [150, 200, 235]));
      obj(g, mergeC(ps), 0.12, sp, 0, 30, 0); }],

    ['Garden swing', function (g, t) {
      var a = Math.sin(t * 0.0018) * 0.55, ps = [], i;
      ps.push(part(boxGeo(0, 1.35, 0, 1.6, 0.1, 0.16), [120, 82, 46]));
      for (i = 0; i < 2; i++) {
        var sd = i ? 1 : -1;
        ps.push(part(barGeo(sd * 1.5, -1.4, 0.5, sd * 0.3, 1.35, 0, 0.06), [120, 82, 46]));
        ps.push(part(barGeo(sd * 1.5, -1.4, -0.5, sd * 0.3, 1.35, 0, 0.06), [120, 82, 46]));
        ps.push(part(xfG(barGeo(0, 0, 0, 0, -1.5, 0, 0.02), 0, 0, a, sd * 0.4, 1.3, 0),
                     [200, 200, 208]));
      }
      var p = rot3([0, -1.6, 0], 0, 0, a);
      ps.push(part(xfG(boxGeo(0, 0, 0, 0.5, 0.06, 0.22), 0, 0, a, p[0], 1.3 + p[1], p[2]),
                   [176, 130, 70]));
      for (i = 0; i < 5; i++)
        ps.push(part(ovalGeo(-1.6 + i * 0.8, -1.55, -0.4, 0.3, 0.14, 0.3, 3, 6), [70, 110, 60]));
      obj(g, mergeC(ps), 0.1, 0.24, 0, 30, 0); }],

    ['Clothesline', function (g, t) {
      var ps = [], i;
      for (i = 0; i < 16; i++) {
        var f = i / 15;
        ps.push(part(ovalGeo(-2.1 + f * 4.2, 0.9 - Math.sin(f * Math.PI) * 0.35, 0,
                             0.03, 0.03, 0.03, 3, 4), [220, 218, 210]));
      }
      for (i = 0; i < 5; i++) {
        var f2 = 0.12 + i * 0.19;
        var y = 0.9 - Math.sin(f2 * Math.PI) * 0.35;
        var sw = Math.sin(t * 0.0022 + i) * 0.22;
        ps.push(part(xfG(boxGeo(0, -0.42, 0, 0.28, 0.42, 0.03), 0, 0, sw,
                         -2.1 + f2 * 4.2, y, 0),
                     [[226, 70, 80], [240, 200, 70], [90, 180, 230], [140, 210, 120],
                      [220, 130, 200]][i]));
        ps.push(part(xfG(boxGeo(0, -0.12, 0, 0.42, 0.1, 0.03), 0, 0, sw,
                         -2.1 + f2 * 4.2, y, 0),
                     [[226, 70, 80], [240, 200, 70], [90, 180, 230], [140, 210, 120],
                      [220, 130, 200]][i]));
        ps.push(part(boxGeo(-2.1 + f2 * 4.2, y + 0.06, 0, 0.05, 0.09, 0.05), [200, 190, 170]));
      }
      obj(g, mergeC(ps), 0.06, Math.sin(t * 0.0005) * 0.2, 0, 30, 0); }],

    ['Soap bubbles', function (g, t) {
      var ps = [], i;
      for (i = 0; i < 11; i++) {
        var f = ((t * 0.00025 * (0.5 + (i % 5) * 0.18) + i * 0.09) % 1);
        var r = 0.16 + (i % 4) * 0.12;
        ps.push(part(ovalGeo(-1.9 + i * 0.38 + Math.sin(f * 7 + i) * 0.3, -1.6 + f * 3.2,
                             ((i * 53 % 37) / 37 - 0.5) * 2, r, r, r, 6, 12),
                     [214 + (i % 3) * 12, 238, 252]));
      }
      g.globalAlpha = 0.5;
      obj(g, mergeC(ps), 0, 0, 0, 30, 0);
      g.globalAlpha = 1; }],

    ['Paper plane', function (g, t) {
      var f = (t % 6000) / 6000;
      var x = -2.4 + f * 4.8, y = 0.6 + Math.sin(f * 7) * 0.6, rz = Math.cos(f * 7) * 0.3;
      var ps = [
        part(prism([[0.8, 0], [-0.7, 0.42], [-0.4, 0]], 0.01), [244, 242, 234]),
        part(prism([[0.8, 0], [-0.7, -0.42], [-0.4, 0]], 0.01), [226, 224, 216]),
        part(xfG(prism([[0.8, 0], [-0.7, 0], [-0.4, -0.2]], 0.01), Math.PI / 2, 0, 0, 0, 0, 0),
             [236, 234, 226])
      ], i;
      for (i = 0; i < ps.length; i++)
        ps[i] = { V: xfG(ps[i], 0.2, -0.3, rz, x, y, 0).V, F: ps[i].F, c: ps[i].c };
      for (i = 0; i < 9; i++)
        ps.push(part(ovalGeo(x - 0.6 - i * 0.22, y - i * 0.05 + Math.sin(i) * 0.06, 0,
                             0.02, 0.02, 0.02, 3, 4), [200, 210, 220]));
      obj(g, mergeC(ps), 0, 0, 0, 36, 0); }],

    ["Newton's cradle", function (g, t) {
      var a = Math.sin(t * 0.004) * 0.55;
      var ps = [], i;
      for (i = 0; i < 4; i++)
        ps.push(part(barGeo((i < 2 ? 1 : -1) * 1.15, -1.2, (i % 2 ? 1 : -1) * 0.55,
                            (i < 2 ? 1 : -1) * 1.05, 1.05, (i % 2 ? 1 : -1) * 0.5, 0.06),
                     [90, 94, 104]));
      for (i = 0; i < 2; i++)
        ps.push(part(cylGeo(0, 1.05, (i ? 1 : -1) * 0.5, 0.04, 0.04, 2.1, 6, 'x'),
                     [130, 134, 144]));
      /* only the end balls move: the ones between just pass it along */
      for (i = 0; i < 5; i++) {
        var sw = i === 0 ? Math.min(0, a) : i === 4 ? Math.max(0, a) : 0;
        var bx = (i - 2) * 0.42 + Math.sin(sw) * 1.3;
        var by = 1.05 - Math.cos(sw) * 1.3;
        ps.push(part(ovalGeo(bx, by, 0, 0.21, 0.21, 0.21, 4, 8), [206, 210, 220]));
        var k;
        for (k = 0; k < 2; k++)
          ps.push(part(barGeo((i - 2) * 0.42, 1.05, (k ? 1 : -1) * 0.5, bx, by, 0, 0.012),
                       [180, 184, 194]));
      }
      obj(g, mergeC(ps), 0.12, 0.34, 0, 30, 0); }],

    ['Falling dominoes', function (g, t) {
      var c = (t % 4200) / 4200, ps = [], i;
      for (i = 0; i < 9; i++) {
        var trig = c * 11 - i;
        var a = trig <= 0 ? 0 : Math.min(1.35, trig * 0.9);
        ps.push(part(xfG(boxGeo(0, 0.34, 0, 0.1, 0.34, 0.22), 0, 0, -a,
                         -1.7 + i * 0.44 + Math.sin(a) * 0.3, -0.9, 0), [242, 240, 232]));
        ps.push(part(xfG(boxGeo(0, 0.34, 0.23, 0.06, 0.02, 0.01), 0, 0, -a,
                         -1.7 + i * 0.44 + Math.sin(a) * 0.3, -0.9, 0), [40, 40, 48]));
      }
      ps.push(part(boxGeo(0, -1.0, 0, 2.2, 0.1, 0.7), [86, 74, 60]));
      obj(g, mergeC(ps), 0.24, 0.42, 0, 32, 1); }],

    ['Snow globe', function (g, t) {
      var ps = [], i;
      ps.push(part(lathe([[0, -1.5], [1.0, -1.5], [1.05, -1.1], [0.7, -1.0], [0, -1.0]], 14),
                   [120, 78, 46]));
      ps.push(part(coneGeo(0, 0.2, 0, 0.5, 1.4, 8), [56, 122, 62]));
      ps.push(part(cylGeo(0, -0.85, 0, 0.1, 0.12, 0.4, 6), [110, 76, 46]));
      for (i = 0; i < 16; i++) {
        var a = i * 2.399 + t * 0.0006;
        var f = ((t * 0.0004 + i * 0.062) % 1);
        ps.push(part(ovalGeo(Math.cos(a) * 0.8 * (1 - f * 0.3), 1.0 - f * 2.0,
                             Math.sin(a) * 0.8 * (1 - f * 0.3), 0.05, 0.05, 0.05, 3, 4),
                     [246, 250, 254]));
      }
      obj(g, mergeC(ps), 0.1, 0, 0, 32, 0);
      g.globalAlpha = 0.28;
      obj(g, mergeC([part(ovalGeo(0, -0.1, 0, 1.35, 1.35, 1.35, 7, 14), [190, 220, 240])]),
          0, 0, 0, 32, 0);
      g.globalAlpha = 1; }],

    ['Lava flow', function (g, t) {
      var ps = [], i, k;
      for (k = 0; k < 4; k++)
        for (i = 0; i < 10; i++) {
          var x = -2.1 + i * 0.47;
          var y = -1.2 + k * 0.42 + Math.sin(x * 1.4 + t * 0.0016 + k) * 0.22;
          ps.push(part(ovalGeo(x, y, -k * 0.4, 0.3, 0.16, 0.3, 3, 7),
                       [[236, 92, 30], [246, 150, 40], [252, 200, 70], [180, 60, 30]][k]));
        }
      for (i = 0; i < 7; i++)
        ps.push(part(xfG(scG(gIcosa(), 0.1, 0.08, 0.1), i, i * 2, 0,
                         -1.8 + i * 0.6, -0.9 + Math.sin(i * 2) * 0.5, 0.5), [50, 44, 44]));
      for (i = 0; i < 8; i++)
        ps.push(part(ovalGeo(-1.6 + i * 0.45, 0.6 + ((t * 0.0006 + i * 0.12) % 1) * 1.2, 0,
                             0.05, 0.05, 0.05, 3, 4), [250, 200, 90]));
      obj(g, mergeC(ps), 0.3, 0, 0, 30, 0); }],

    ['Solar eclipse', function (g, t) {
      var c = Math.sin(t * 0.0005) * 1.5, ps = [], i;
      for (i = 0; i < 20; i++) {
        var a = i * TAU / 20 + t * 0.0006;
        ps.push(part(boxGeo(Math.cos(a) * 1.15, Math.sin(a) * 1.15, -0.5,
                            0.24, 0.05, 0.05), [250, 224, 130]));
      }
      ps.push(part(ovalGeo(0, 0, -0.3, 0.82, 0.82, 0.82, 6, 14), [252, 214, 92]));
      ps.push(part(ovalGeo(c, 0.1, 0.4, 0.78, 0.78, 0.78, 6, 14), [42, 42, 52]));
      for (i = 0; i < 10; i++)
        ps.push(part(ovalGeo(((i * 41 % 71) / 71 - 0.5) * 4, ((i * 29 % 47) / 47 - 0.5) * 3, -1.6,
                             0.025, 0.025, 0.025, 3, 4), [230, 236, 246]));
      obj(g, mergeC(ps), 0, 0, 0, 32, 0); }],

    ['Water ripples', function (g, t) {
      var ps = [], i, k, d;
      var drops = [[-0.9, 0.4], [0.7, -0.3], [0.1, 0.9]];
      for (d = 0; d < 3; d++) {
        for (k = 0; k < 3; k++) {
          var f = ((t * 0.0005 + d * 0.33 + k * 0.33) % 1);
          for (i = 0; i < 20; i++) {
            var a = i * TAU / 20;
            ps.push(part(ovalGeo(drops[d][0] + Math.cos(a) * f * 1.5,
                                 -0.3 + Math.sin(a) * f * 0.5 + drops[d][1] * 0.4,
                                 drops[d][1] + Math.sin(a) * f * 1.5,
                                 0.1, 0.05, 0.1, 3, 5),
                         [140 + (1 - f) * 90, 210, 235]));
          }
        }
      }
      obj(g, mergeC(ps), 0.9, 0, 0, 30, 0); }]
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

  for (var pti = 0; pti < PAT.length; pti++) {
    (function (i) {
      CHANNELS.push({ name: PAT[i][0], draw: PAT[i][1] });
    }(pti));
  }

  for (var ili = 0; ili < ILL.length; ili++) {
    (function (i) {
      CHANNELS.push({ name: ILL[i][0], draw: ILL[i][1] });
    }(ili));
  }

  for (var fsi = 0; fsi < FISH.length; fsi++) {
    (function (i) {
      CHANNELS.push({
        name: FISH[i][0],
        draw: function (g, t) {
          var o = F(FISH[i][1]);
          o.dir = 1;
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

  /* --- how well this channel is coming in -------------------------
     Every channel arrives at its own strength, re-rolled on every
     turn of the dial, so a channel you liked is never quite the same
     twice — which is how an aerial behaves.

     Zero is the set as it always was, and that is now the worst a
     channel gets: the dial only ever tunes it clearer from there. The
     lift goes on the flicker rather than on the signal, so the slow
     pulse that makes the picture breathe is raised off its floor
     instead of being scaled away, and the hard glitch dropouts keep
     their bite. A little of the snow itself calms with it.

     Called clarity rather than lift because four of the scenes have a
     local `lift` of their own, and a shadowed global is a trap left
     lying about for later. */

  var CLARITY_MAX = 0.7;
  var clarity = 0;

  function rollClarity() {
    clarity = Math.random() * CLARITY_MAX;
  }

  /* --- the end of the dial ----------------------------------------
     Six hundred channels is a great deal of television. Get through
     every one of them in a sitting and the set has a view about it:
     it collapses to a dot the way a tube does and says so.

     Not remembered between visits. Sitting down to a fresh set and
     being told off for something you did last week would be a poor
     joke, and the walk only counts if you take it in one go. */

  var seen = new Uint8Array(CHANNELS.length);
  var seenCount = 0;
  var isOff = false, wasPlaying = false, offTimer = null;
  var offEl = document.getElementById('off');

  function markSeen(i) {
    if (seen[i]) return;
    seen[i] = 1;
    if (++seenCount >= CHANNELS.length) powerOff();
  }

  function powerOff() {
    if (isOff) return;
    isOff = true;
    wasPlaying = MUSIC.isOn();
    MUSIC.pause();
    var sc = document.querySelector('.screen');
    if (sc) sc.classList.add('is-off');
    if (offEl) offEl.hidden = false;
    if (label) label.textContent = 'Go outside. You are watching too much LEETV.';
    /* let the tube finish collapsing before the loop stops */
    offTimer = window.setTimeout(function () { offTimer = null; stop(); }, 950);
  }

  function powerOn() {
    isOff = false;
    if (offTimer !== null) { window.clearTimeout(offTimer); offTimer = null; }
    seen = new Uint8Array(CHANNELS.length);
    seenCount = 0;
    var sc = document.querySelector('.screen');
    if (sc) sc.classList.remove('is-off');
    if (offEl) offEl.hidden = true;
    if (wasPlaying) MUSIC.resume();
    markSeen(current);
    announce();
    apply();
  }

  function nextChannel() {
    if (isOff) { powerOn(); return; }           /* switch it back on */
    if (!bag.length) refillBag();
    current = bag.pop();
    rollClarity();
    burstUntil = performance.now() + 300;             /* switching snow */
    MUSIC.setChannel(current, CHANNELS[current].name);
    announce();
    markSeen(current);
    if (rafId === null && !isOff) apply();            /* redraw when frozen */
  }

  /* --- rolling the dial -------------------------------------------
     A wheel gesture slides the picture out and the next one in, the
     way a vertical hold slips. It is drawn as a slide rather than
     transformed after the fact, so the static and the chroma split
     run over the join exactly as they do over everything else.

     The direction is yours; the destination is not. It still comes
     off the shuffled bag, so rolling the dial is as random as
     clicking it — it just looks like you meant it. */

  var slideFrom = -1, slideDir = 1, slideAt = 0, wheelAcc = 0;
  var SLIDE_MS = 260, WHEEL_STEP = 44;

  function nowMs() {
    return (window.performance && performance.now) ? performance.now() : Date.now();
  }

  function rollChannel(dir) {
    if (isOff) { powerOn(); return; }
    var was = current;
    nextChannel();
    if (current === was) return;
    slideFrom = was;
    slideDir = dir;                       /* +1 the picture falls, -1 it rises */
    slideAt = nowMs();
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

    easeView();

    if (steady) {
      strobe = 1; splitR = -1; splitB = 1; jitterY = 0; white = 0;
      rowShift.fill(0); rowTint.fill(0);
    } else {
      if (t > burstUntil && Math.random() < 0.08) {
        burstUntil = t + 70 + Math.random() * 220;
      }
      var heavy = t < burstUntil;
      var flick = 0.76 + 0.24 * Math.sin(t / 62);
      flick += (1 - flick) * clarity;       /* how well this one comes in */
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
    var amp = 196 - clarity * 46;

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
    var sp = -1;
    if (slideFrom >= 0 && !steady) {
      sp = (t - slideAt) / SLIDE_MS;
      if (sp >= 1 || sp < 0) { slideFrom = -1; sp = -1; }
    } else if (steady) {
      slideFrom = -1;
    }
    if (sp >= 0) {
      /* ease in and out, so the roll starts and settles rather than
         running at a constant speed */
      var e = sp < 0.5 ? 2 * sp * sp : 1 - Math.pow(-2 * sp + 2, 2) / 2;
      sctx.save();
      sctx.translate(0, e * H * slideDir);
      CHANNELS[slideFrom].draw(sctx, t);
      sctx.restore();
      sctx.save();
      sctx.translate(0, -(1 - e) * H * slideDir);
      CHANNELS[current].draw(sctx, t);
      sctx.restore();
    } else {
      CHANNELS[current].draw(sctx, steady ? 1400 : t);
    }
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
        var n = (Math.random() * amp) | 0;
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
      recentre();
      eX = eY = 0;
      viewM = lookM = null;     /* the frozen frame is square on */
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

  /* The cursor's offset from the middle of the tube is the angle it
     asks for, full deflection a little beyond the edge of the set.
     Reduced motion leaves the camera square on. */
  var screenEl = document.querySelector('.screen') || stage;

  function aim(e) {
    if (!screenEl || (reduce && reduce.matches)) { curX = curY = 0; return; }
    var r = screenEl.getBoundingClientRect();
    if (!r.width || !r.height) return;
    var nx = (e.clientX - (r.left + r.width / 2)) / (r.width * 1.6);
    var ny = (e.clientY - (r.top + r.height / 2)) / (r.height * 1.6);
    curX = nx < -1 ? -1 : nx > 1 ? 1 : nx;
    curY = ny < -1 ? -1 : ny > 1 ? 1 : ny;
    lastAim = Date.now();
  }

  function recentre() { curX = curY = 0; }

  if (window.PointerEvent) {
    window.addEventListener('pointermove', aim, { passive: true });
    window.addEventListener('pointerdown', aim, { passive: true });
    /* a finger has no hover, so it lets go of the camera when it lifts */
    window.addEventListener('pointerup', function (e) {
      if (e.pointerType && e.pointerType !== 'mouse') recentre();
    }, { passive: true });
  } else {
    window.addEventListener('mousemove', aim, { passive: true });
  }
  document.addEventListener('mouseleave', recentre);
  window.addEventListener('blur', recentre);

  if (stage) {
    stage.addEventListener('click', nextChannel);
    stage.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        nextChannel();
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        rollChannel(e.key === 'ArrowDown' ? 1 : -1);
      }
    });
  }

  /* Trackpads send a flurry of small deltas where a mouse sends one
     big one, so the wheel is accumulated to a threshold rather than
     acted on tick by tick. */
  window.addEventListener('wheel', function (e) {
    if (!e.deltaY) return;
    if (wheelAcc && (wheelAcc > 0) !== (e.deltaY > 0)) wheelAcc = 0;
    wheelAcc += e.deltaY;
    if (Math.abs(wheelAcc) < WHEEL_STEP) return;
    rollChannel(wheelAcc > 0 ? 1 : -1);
    wheelAcc = 0;
  }, { passive: true });

  var soundBtn = document.getElementById('sound');
  if (soundBtn) {
    if (!MUSIC.supported()) {
      soundBtn.disabled = true;
      soundBtn.setAttribute('aria-label', 'Sound not supported in this browser');
    } else {
      soundBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        if (isOff) return;                            /* the set is off */
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

  rollClarity();
  MUSIC.setChannel(current, CHANNELS[current].name);
  announce();
  markSeen(current);
  apply();
})();
