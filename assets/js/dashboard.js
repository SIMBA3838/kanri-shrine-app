/* ============================================================
   わびなび CMS — ダッシュボード
   ============================================================ */
(function () {
  'use strict';
  WabiStore.requireAuth();

  var currentFilter = 'all';

  function toast(msg) {
    var t = document.getElementById('toast');
    t.textContent = msg; t.classList.add('show');
    setTimeout(function () { t.classList.remove('show'); }, 2200);
  }

  function fmtDate(ts) {
    if (!ts) return '';
    var d = new Date(ts);
    return d.getFullYear() + '/' + (d.getMonth() + 1) + '/' + d.getDate();
  }

  function render() {
    var all = WabiStore.getArticles();
    var list = all.filter(function (a) {
      if (currentFilter === 'all') return true;
      return (a.status || 'draft') === currentFilter;
    });
    var el = document.getElementById('list');

    if (!list.length) {
      el.innerHTML = '<div class="empty"><div class="ico">📝</div>' +
        (all.length ? 'この条件の記事はありません' : 'まだ記事がありません。<br>「＋ 新規投稿」から作成しましょう') +
        '</div>';
      return;
    }

    el.innerHTML = list.map(function (a) {
      var status = a.status === 'published' ? 'published' : 'draft';
      var statusLabel = status === 'published' ? '● 公開中' : '○ 下書き';
      var thumb = a.hero || (a.spots && a.spots[0] && a.spots[0].photo) || '';
      var title = (a.title || '無題').replace(/\n/g, ' ');
      return '<div class="art-item">' +
        '<div class="art-thumb">' + (thumb ? '<img src="' + esc(thumb) + '" alt="">' : '') + '</div>' +
        '<div class="art-main">' +
          '<span class="art-status ' + status + '">' + statusLabel + '</span>' +
          '<div class="art-title">' + esc(title) + '</div>' +
          '<div class="art-meta">' + esc(a.category || 'カテゴリーなし') + ' ・ 更新 ' + fmtDate(a.updatedAt) + '</div>' +
          '<div class="art-ops">' +
            '<button class="art-op" data-edit="' + a.id + '">編集</button>' +
            '<button class="art-op" data-preview="' + a.id + '">プレビュー</button>' +
            '<button class="art-op" data-dup="' + a.id + '">複製</button>' +
            '<button class="art-op del" data-del="' + a.id + '">削除</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    }).join('');

    bindRowEvents();
  }

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function bindRowEvents() {
    document.querySelectorAll('[data-edit]').forEach(function (b) {
      b.onclick = function () { location.href = 'editor.html?id=' + b.dataset.edit; };
    });
    document.querySelectorAll('[data-dup]').forEach(function (b) {
      b.onclick = function () { WabiStore.duplicate(b.dataset.dup); toast('複製しました'); render(); };
    });
    document.querySelectorAll('[data-del]').forEach(function (b) {
      b.onclick = function () {
        if (confirm('この記事を削除しますか？この操作は取り消せません。')) {
          WabiStore.remove(b.dataset.del); toast('削除しました'); render();
        }
      };
    });
    document.querySelectorAll('[data-preview]').forEach(function (b) {
      b.onclick = function () { openPreview(b.dataset.preview); };
    });
  }

  // プレビュー：記事データを一時保存してiframeで表示
  function openPreview(id) {
    var a = WabiStore.getArticle(id);
    if (!a) return;
    sessionStorage.setItem('wabinavi_preview', JSON.stringify(a));
    var frame = document.getElementById('previewFrame');
    frame.src = '../articles/article.html?preview=1&t=' + Date.now();
    document.getElementById('previewModal').classList.add('show');
  }
  document.getElementById('previewClose').onclick = function () {
    document.getElementById('previewModal').classList.remove('show');
    document.getElementById('previewFrame').src = '';
  };

  // タブ
  document.querySelectorAll('.dash-tab').forEach(function (t) {
    t.onclick = function () {
      document.querySelectorAll('.dash-tab').forEach(function (x) { x.classList.remove('on'); });
      t.classList.add('on');
      currentFilter = t.dataset.filter;
      render();
    };
  });

  // JSON書き出し
  document.getElementById('exportBtn').onclick = function () {
    var pubCount = WabiStore.getArticles().filter(function (a) { return a.status === 'published'; }).length;
    if (pubCount === 0) { toast('公開中の記事がありません'); return; }
    var n = WabiStore.exportJson();
    toast(n + '件を articles.json に書き出しました');
  };

  // ログアウト
  document.getElementById('logoutBtn').onclick = function () {
    WabiStore.logout(); location.href = 'login.html';
  };

  // 初回：JSONがあればLocalStorageへ取り込み
  WabiStore.seedFromJson('../data/articles.json').then(render);
})();
