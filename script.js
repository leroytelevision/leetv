/* ---------------------------------------------------------------
   leetv.tv — animated CRT static with an embedded "LEETV" ident.

   The wordmark is rasterised into a mask at the canvas's own low
   internal resolution, then each frame the noise inside the mask is
   biased bright. The letters are therefore made OF the static rather
   than drawn over it, and they pixelate identically when scaled up.
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

  /* Coarse on purpose - real static is not smooth. Frame-skipping off rAF
     quantises to the display: on a 60Hz panel this lands at 20fps, on 120Hz
     nearer the nominal 24. The slack stops a frame that arrives a whisker
     early from being dropped into the next slot. */
  var FPS = 24;
  var interval = 1000 / FPS;
  var slack = 6;

  /* --- wordmark mask --------------------------------------------- */

  function buildMask() {
    var off = document.createElement('canvas');
    off.width = W;
    off.height = H;
    var g = off.getContext('2d');

    g.fillStyle = '#000';
    g.fillRect(0, 0, W, H);

    var letters = 'LEETV'.split('');
    var squeeze = 0.86;                    /* horizontal squash => condensed */
    var maxRun = W * 0.84;                 /* keep clear of the tube edges */

    var size = Math.round(H * 0.30);
    var tracking, widths, total;

    /* Shrink to fit: "Arial Narrow" may not resolve, and the fallbacks are
       much wider, so measure what we actually got instead of assuming. */
    for (;;) {
      g.font = '700 ' + size + 'px "Arial Narrow", "Helvetica Neue", Arial, sans-serif';
      tracking = Math.max(3, Math.round(size * 0.30));   /* wide tracking */
      widths = letters.map(function (ch) {
        return g.measureText(ch).width * squeeze;
      });
      total = widths.reduce(function (a, b) { return a + b; }, 0) +
              tracking * (letters.length - 1);
      if (total <= maxRun || size <= 12) break;
      size -= 1;
    }

    g.textBaseline = 'middle';
    g.textAlign = 'left';

    var x = (W - total) / 2;
    var y = H * 0.5;

    g.fillStyle = '#fff';
    letters.forEach(function (ch, i) {
      g.save();
      g.translate(x, y);
      g.scale(squeeze, 1);
      g.fillText(ch, 0, 0);
      g.restore();
      x += widths[i] + tracking;
    });

    var px = g.getImageData(0, 0, W, H).data;
    var mask = new Uint8Array(W * H);
    for (var p = 0, i = 0; p < mask.length; p++, i += 4) {
      mask[p] = px[i] > 128 ? 1 : 0;
    }
    return mask;
  }

  var mask = buildMask();

  function maskAt(x, y) {
    if (x < 0 || x >= W) return 0;
    return mask[y * W + x];
  }

  /* --- one frame of noise ---------------------------------------- */

  function render(t, steady) {
    /* Signal strength drifts, so the ident fades in and out of the
       interference instead of sitting at a constant brightness. */
    var signal;
    if (steady) {
      signal = 0.92;
    } else {
      signal = 0.84 + 0.13 * Math.sin(t / 1150) + 0.04 * Math.sin(t / 337);
      if (Math.random() < 0.025) signal *= 0.55;  /* momentary dropout */
      if (signal < 0.42) signal = 0.42;
      if (signal > 1) signal = 1;
    }

    /* Occasional horizontal tear across a band of scanlines. */
    var tearTop = -1, tearBottom = -1, tearShift = 0;
    if (!steady && Math.random() < 0.07) {
      tearTop = (Math.random() * H) | 0;
      tearBottom = tearTop + 3 + ((Math.random() * 11) | 0);
      tearShift = ((Math.random() * 9) | 0) - 4;
    }

    var i = 0;
    for (var y = 0; y < H; y++) {
      var shift = (y >= tearTop && y < tearBottom) ? tearShift : 0;

      for (var x = 0; x < W; x++) {
        var n = (Math.random() * 196) | 0;
        var r = n, g = n, b = n;

        var mx = x + shift;
        /* Channels sample the mask one pixel apart -> chromatic fringe. */
        var mr = maskAt(mx - 1, y);
        var mg = maskAt(mx, y);
        var mb = maskAt(mx + 1, y);

        if (mr || mg || mb) {
          var lum = 228 + ((Math.random() * 28) | 0);
          if (mr) r = n + (lum - n) * signal;
          if (mg) g = n + (lum - n) * signal;
          if (mb) b = n + (lum - n) * signal;
        }

        data[i++] = r;
        data[i++] = g;
        data[i++] = b;
        data[i++] = 255;
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
      render(0, true);          /* a single frozen frame of noise */
    } else {
      start();
    }
  }

  if (reduce) {
    if (reduce.addEventListener) reduce.addEventListener('change', apply);
    else if (reduce.addListener) reduce.addListener(apply);
  }

  /* Don't burn cycles on a backgrounded tab. */
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stop();
    else apply();
  });

  apply();
})();
