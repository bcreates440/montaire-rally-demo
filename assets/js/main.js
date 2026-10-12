/* Montaire Rally demo — tiny, dependency-free */
(function () {
  // Mobile nav
  var btn = document.querySelector('[data-menu]'), nav = document.getElementById('nav');
  if (btn && nav) {
    btn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.addEventListener('click', function (e) { if (e.target.tagName === 'A') nav.classList.remove('open'); });
  }

  // Re-jump to #route / #vehicles once images above it have loaded and pushed it down
  window.addEventListener('load', function () {
    var t = location.hash && document.getElementById(location.hash.slice(1));
    if (t) t.scrollIntoView();
  });

  // Lightbox for any [data-full] image (FAQ carousel)
  var lb = document.querySelector('.lightbox');
  if (lb) {
    var lbImg = lb.querySelector('img');
    var close = function () { lb.classList.remove('open'); lbImg.removeAttribute('src'); };
    document.querySelectorAll('[data-full]').forEach(function (f) {
      var open = function () {
        lbImg.src = f.getAttribute('data-full');
        lbImg.alt = f.querySelector('img').alt;
        lb.classList.add('open');
      };
      f.addEventListener('click', open);
      f.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
    });
    lb.addEventListener('click', close);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  }

  // Carousel arrows
  document.querySelectorAll('.carousel').forEach(function (c) {
    var track = c.querySelector('.car-track');
    c.querySelector('.prev').addEventListener('click', function () { track.scrollBy({ left: -track.clientWidth * 0.8 }); });
    c.querySelector('.next').addEventListener('click', function () { track.scrollBy({ left: track.clientWidth * 0.8 }); });
  });
})();
