(function () {
  'use strict';

  function setLang(lang) {
    document.getElementById('btnAr').classList.toggle('active', lang === 'ar');
    document.getElementById('btnEn').classList.toggle('active', lang === 'en');

    document.querySelectorAll('.tagline').forEach(el => {
      el.style.display = (el.getAttribute('lang') === lang) ? 'block' : 'none';
    });

    document.querySelector('#startBtn span').textContent =
      lang === 'ar' ? 'ابدأ المسح' : 'Start Scanning';
  }

  document.getElementById('btnAr').addEventListener('click', () => setLang('ar'));
  document.getElementById('btnEn').addEventListener('click', () => setLang('en'));

  window.addEventListener('DOMContentLoaded', () => {
    const p = new URLSearchParams(window.location.search);
    const book = p.get('book');
    const key = p.get('key');
    if (book && key && /^\d{1,9}$/.test(book) && /^[\w.~-]{6,200}$/.test(key)) {
      document.getElementById('startBtn').href =
        'index.html?' + new URLSearchParams({ book, key }).toString();
    }
  });
})();
