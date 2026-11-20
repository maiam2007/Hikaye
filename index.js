(function () {
  'use strict';

  const { SUPABASE_URL, SUPABASE_ANON_KEY } = window.HIKAYE_CONFIG;
  const MEDIA_HOST = new URL(SUPABASE_URL).host;

  const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  });

  const loadingMsg = document.querySelector('#loadingMsg');
  const arContainer = document.querySelector('#arContainer');
  const overlay = document.querySelector('#videoOverlay');
  const video = document.querySelector('#myVideo');
  const playBtn = document.querySelector('#playBtn');
  const errorMsg = document.querySelector('#errorMsg');
  const recognizedMark = document.querySelector('#recognizedMark');

  const RECOGNITION_DELAY_MS = 1300;
  const BOOK_RE = /^\d{1,9}$/;
  const KEY_RE = /^[\w.~-]{6,200}$/;
  const GENERIC_ERROR = 'رابط غير صحيح أو الفوتوبوك غير موجود';

  function showError(msg) {
    loadingMsg.style.display = 'none';
    errorMsg.textContent = msg;
    errorMsg.style.display = 'flex';
  }

  function isSafeMediaUrl(value) {
    try {
      const u = new URL(value);
      return u.protocol === 'https:' && u.host === MEDIA_HOST;
    } catch (_) {
      return false;
    }
  }

  async function loadSceneFromBook() {
    const params = new URLSearchParams(window.location.search);
    const bookNumber = params.get('book');
    const key = params.get('key');

    if (!bookNumber || !key || !BOOK_RE.test(bookNumber) || !KEY_RE.test(key)) {
      showError(GENERIC_ERROR);
      return;
    }

    const { data, error } = await supabaseClient.rpc('get_photobook', {
      p_book: bookNumber,
      p_key: key
    });

    if (error || !Array.isArray(data) || data.length === 0) {
      showError(GENERIC_ERROR);
      return;
    }

    const videoMap = new Map();
    for (const row of data) {
      if (Number.isInteger(row.target_index) && row.target_index >= 0 &&
          row.target_index <= 10000 && isSafeMediaUrl(row.video_url)) {
        videoMap.set(row.target_index, row.video_url);
      }
    }
    if (videoMap.size === 0) {
      showError(GENERIC_ERROR);
      return;
    }

    const mindFileUrl =
      `${SUPABASE_URL}/storage/v1/object/public/targets/${encodeURIComponent(bookNumber)}.mind`;

    const scene = document.createElement('a-scene');
    scene.setAttribute('mindar-image', `imageTargetSrc: ${mindFileUrl};`);
    scene.setAttribute('color-space', 'sRGB');
    scene.setAttribute('renderer', 'colorManagement: true, physicallyCorrectLights');
    scene.setAttribute('vr-mode-ui', 'enabled: false');
    scene.setAttribute('device-orientation-permission-ui', 'enabled: false');

    const camera = document.createElement('a-camera');
    camera.setAttribute('position', '0 0 0');
    camera.setAttribute('look-controls', 'enabled: false');
    scene.appendChild(camera);

    for (const idx of videoMap.keys()) {
      const ent = document.createElement('a-entity');
      ent.className = 'target';
      ent.dataset.index = String(idx);
      ent.setAttribute('mindar-image-target', `targetIndex: ${idx}`);
      scene.appendChild(ent);
    }

    arContainer.appendChild(scene);
    loadingMsg.style.display = 'none';

    scene.addEventListener('renderstart', function () {
      let alreadyTriggered = false;

      scene.querySelectorAll('.target').forEach(target => {
        target.addEventListener('targetFound', function () {
          if (alreadyTriggered) return;
          const url = videoMap.get(Number(target.dataset.index));
          if (!url) return;
          alreadyTriggered = true;

          scene.style.display = 'none';
          recognizedMark.style.display = 'flex';

          setTimeout(() => {
            recognizedMark.style.display = 'none';
            video.src = url;
            overlay.style.display = 'flex';
          }, RECOGNITION_DELAY_MS);
        });
      });
    });
  }

  loadSceneFromBook().catch(() => showError(GENERIC_ERROR));

  playBtn.addEventListener('click', function () {
    video.play();
    playBtn.style.display = 'none';
  });
})();
