// Keep the date line current without a build step.
document.addEventListener('DOMContentLoaded', function () {
  var el = document.getElementById('today');
  if (!el) return;

  var now = new Date();
  var pad = function (n) { return String(n).padStart(2, '0'); };
  var iso = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate());

  el.dateTime = iso;
  el.textContent = iso;
});
