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

  // Gallery lightbox + filters
  var lb = document.querySelector('.lightbox');
  if (lb) {
    var lbImg = lb.querySelector('img');
    var close = function () { lb.classList.remove('open'); lbImg.removeAttribute('src'); };
    document.querySelectorAll('.masonry figure').forEach(function (f) {
      var open = function () {
        lbImg.src = f.getAttribute('data-full') || f.querySelector('img').src;
        lb.classList.add('open');
      };
      f.addEventListener('click', open);
      f.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
    });
    lb.addEventListener('click', close);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    document.querySelectorAll('.filters button').forEach(function (b) {
      b.addEventListener('click', function () {
        document.querySelectorAll('.filters button').forEach(function (x) { x.classList.remove('on'); });
        b.classList.add('on');
        var cat = b.getAttribute('data-cat');
        document.querySelectorAll('.masonry figure').forEach(function (f) {
          f.style.display = (cat === 'all' || f.getAttribute('data-cat') === cat) ? '' : 'none';
        });
      });
    });
  }
})();
