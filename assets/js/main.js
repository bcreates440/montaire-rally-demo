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

  // Register page: order builder -> hands off to Stride
  var list = document.getElementById('opts');
  if (list) {
    var state = {};
    var money = function (n) { return '$' + n.toLocaleString('en-US'); };
    var sum = document.getElementById('sum-list'), tot = document.getElementById('sum-total'), go = document.getElementById('go');
    function render() {
      var rows = '', total = 0, count = 0;
      list.querySelectorAll('.opt').forEach(function (o) {
        var id = o.getAttribute('data-id'), price = +o.getAttribute('data-price'), name = o.getAttribute('data-name');
        var q = state[id] || 0;
        o.classList.toggle('on', q > 0);
        o.querySelector('output').textContent = q;
        if (q) { rows += '<li><span>' + q + ' × ' + name + '</span><span>' + money(q * price) + '</span></li>'; total += q * price; count += q; }
      });
      sum.innerHTML = rows || '<li class="empty"><span>Nothing selected yet</span></li>';
      tot.textContent = money(total);
      go.setAttribute('aria-disabled', count ? 'false' : 'true');
      go.style.opacity = count ? '1' : '.5';
      go.style.pointerEvents = count ? 'auto' : 'none';
      go.tabIndex = count ? 0 : -1;
    }
    go.addEventListener('click', function (e) { if (go.getAttribute('aria-disabled') === 'true') e.preventDefault(); });
    list.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-d]'); if (!b) return;
      var o = b.closest('.opt'), id = o.getAttribute('data-id');
      state[id] = Math.max(0, Math.min(20, (state[id] || 0) + (+b.getAttribute('data-d'))));
      render();
    });
    render();
  }
})();
