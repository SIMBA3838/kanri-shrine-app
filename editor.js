/* ============================================================
   わびなび CMS — エディター
   ============================================================ */
(function () {
  'use strict';
  WabiStore.requireAuth();

  var params = new URLSearchParams(location.search);
  var editId = params.get('id');
  var current = editId ? WabiStore.getArticle(editId) : null;
  if (editId && current) document.getElementById('edTitle').textContent = '記事を編集';

  function toast(msg) {
    var t = document.getElementById('toast');
    t.textContent = msg; t.classList.add('show');
    setTimeout(function () { t.classList.remove('show'); }, 2200);
  }
  function $(id) { return document.getElementById(id); }

  // ── リピーター（スポット／近隣／宿泊） ──
  function spotTemplate(s, i) {
    s = s || {};
    return '<div class="rep-item" data-rep="spot">' +
      '<button class="rep-del" title="削除">×</button>' +
      '<div class="rep-num">神社 ' + (i + 1) + '</div>' +
      '<div class="field"><label>神社名</label><input data-k="name" value="' + av(s.name) + '" placeholder="善光寺"></div>' +
      '<div class="field"><label>読み仮名</label><input data-k="reading" value="' + av(s.reading) + '" placeholder="ぜんこうじ"></div>' +
      '<div class="field"><label>所在地</label><input data-k="loc" value="' + av(s.loc) + '" placeholder="長野県長野市"></div>' +
      '<div class="field"><label>ご利益タグ（カンマ区切り）</label><input data-k="tags" value="' + av((s.tags || []).join(',')) + '" placeholder="開運,厄除け,心願成就"></div>' +
      '<div class="field"><label>写真URL</label><input data-k="photo" value="' + av(s.photo) + '" placeholder="https://..."></div>' +
      '<div class="field"><label>説明文</label><textarea data-k="desc" placeholder="仏教と神道が融合した…">' + tv(s.desc) + '</textarea></div>' +
    '</div>';
  }
  function nearbyTemplate(n, i) {
    n = n || {};
    return '<div class="rep-item" data-rep="nearby">' +
      '<button class="rep-del" title="削除">×</button>' +
      '<div class="rep-num">スポット ' + (i + 1) + '</div>' +
      '<div class="field"><label>施設名</label><input data-k="name" value="' + av(n.name) + '" placeholder="そば処 桜庵"></div>' +
      '<div class="field"><label>カテゴリ（補足）</label><input data-k="cat" value="' + av(n.cat) + '" placeholder="おすすめの飲食店"></div>' +
      '<div class="field"><label>タグ（カンマ区切り）</label><input data-k="tags" value="' + av((n.tags || []).join(',')) + '" placeholder="そば,和食"></div>' +
      '<div class="field"><label>写真URL</label><input data-k="photo" value="' + av(n.photo) + '" placeholder="https://..."></div>' +
      '<div class="field"><label>説明文</label><textarea data-k="desc" placeholder="善光寺門前にある…">' + tv(n.desc) + '</textarea></div>' +
    '</div>';
  }
  function lodgingTemplate(l, i) {
    l = l || {};
    return '<div class="rep-item" data-rep="lodging">' +
      '<button class="rep-del" title="削除">×</button>' +
      '<div class="rep-num">宿泊施設 ' + (i + 1) + '</div>' +
      '<div class="field"><label>施設名</label><input data-k="name" value="' + av(l.name) + '" placeholder="ホテル国際21"></div>' +
      '<div class="field"><label>写真URL</label><input data-k="photo" value="' + av(l.photo) + '" placeholder="https://..."></div>' +
      '<div class="field"><label>説明文</label><textarea data-k="desc" placeholder="善光寺まで徒歩圏内の…">' + tv(l.desc) + '</textarea></div>' +
      '<div class="field"><label>リンクURL（アフィリエイト）</label><input data-k="url" value="' + av(l.url) + '" placeholder="https://..."></div>' +
    '</div>';
  }
  function av(s) { return String(s == null ? '' : s).replace(/"/g, '&quot;'); }
  function tv(s) { return String(s == null ? '' : s).replace(/</g, '&lt;'); }

  function renderRep(containerId, items, tmpl) {
    var c = $(containerId);
    c.innerHTML = (items && items.length ? items : [{}]).map(tmpl).join('');
    bindRepDel(c);
  }
  function bindRepDel(container) {
    container.querySelectorAll('.rep-del').forEach(function (btn) {
      btn.onclick = function () {
        if (container.children.length <= 1) { btn.closest('.rep-item').querySelectorAll('input,textarea').forEach(function (f) { f.value = ''; }); return; }
        btn.closest('.rep-item').remove();
        renumber(container);
      };
    });
  }
  function renumber(container) {
    var labels = { spot: '神社', nearby: 'スポット', lodging: '宿泊施設' };
    container.querySelectorAll('.rep-item').forEach(function (item, i) {
      var type = item.dataset.rep;
      item.querySelector('.rep-num').textContent = labels[type] + ' ' + (i + 1);
    });
  }

  function collectRep(containerId) {
    var out = [];
    $(containerId).querySelectorAll('.rep-item').forEach(function (item) {
      var obj = {};
      item.querySelectorAll('[data-k]').forEach(function (f) {
        var k = f.dataset.k;
        if (k === 'tags') {
          obj[k] = f.value.split(',').map(function (t) { return t.trim(); }).filter(Boolean);
        } else {
          obj[k] = f.value.trim();
        }
      });
      // 名前が空の項目は無視
      if (obj.name) out.push(obj);
    });
    return out;
  }

  // ── フォーム ⇔ データ ──
  function fillForm(a) {
    a = a || {};
    $('f_title').value = a.title || '';
    $('f_category').value = a.category || '';
    $('f_date').value = a.date || '';
    $('f_slug').value = a.slug || '';
    $('f_hero').value = a.hero || '';
    $('f_lead').value = a.lead || '';
    $('f_summary').value = a.summary || '';
    renderRep('spotsRep', a.spots, spotTemplate);
    renderRep('nearbyRep', a.nearby, nearbyTemplate);
    renderRep('lodgingRep', a.lodging, lodgingTemplate);
  }

  function readForm() {
    return {
      id: current ? current.id : null,
      title: $('f_title').value.trim(),
      category: $('f_category').value.trim(),
      date: $('f_date').value,
      slug: ($('f_slug').value.trim() || 'article-' + Date.now().toString(36)),
      hero: $('f_hero').value.trim(),
      lead: $('f_lead').value.trim(),
      spots: collectRep('spotsRep'),
      nearby: collectRep('nearbyRep'),
      summary: $('f_summary').value.trim(),
      lodging: collectRep('lodgingRep'),
      status: current ? current.status : 'draft'
    };
  }

  // ── 保存・公開 ──
  function save(status) {
    var data = readForm();
    if (!data.title) { toast('タイトルを入力してください'); return null; }
    data.status = status;
    current = WabiStore.upsert(data);
    return current;
  }

  $('saveDraft').onclick = function () {
    if (save('draft')) toast('下書きを保存しました');
  };
  $('publish').onclick = function () {
    var saved = save('published');
    if (saved) {
      toast('公開に設定しました。一覧から「articles.json書き出し」でサイトに反映');
      setTimeout(function () { location.href = 'dashboard.html'; }, 1600);
    }
  };

  // 自動下書き保存（5秒ごと、タイトルがあれば）
  setInterval(function () {
    var d = readForm();
    if (d.title) { current = WabiStore.upsert(Object.assign(d, { status: current ? current.status : 'draft' })); }
  }, 5000);

  // ── リピーター追加 ──
  $('addSpot').onclick = function () {
    var c = $('spotsRep'); c.insertAdjacentHTML('beforeend', spotTemplate({}, c.children.length)); bindRepDel(c);
  };
  $('addNearby').onclick = function () {
    var c = $('nearbyRep'); c.insertAdjacentHTML('beforeend', nearbyTemplate({}, c.children.length)); bindRepDel(c);
  };
  $('addLodging').onclick = function () {
    var c = $('lodgingRep'); c.insertAdjacentHTML('beforeend', lodgingTemplate({}, c.children.length)); bindRepDel(c);
  };

  // ── プレビュー ──
  function openPreview() {
    var d = readForm();
    sessionStorage.setItem('wabinavi_preview', JSON.stringify(d));
    var frame = $('previewFrame');
    frame.src = '../articles/article.html?preview=1&t=' + Date.now();
    $('previewModal').classList.add('show');
  }
  $('previewBtn').onclick = openPreview;
  $('previewClose').onclick = function () {
    $('previewModal').classList.remove('show');
    $('previewFrame').src = '';
  };

  // 初期化
  fillForm(current || {});
})();
