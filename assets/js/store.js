/* ============================================================
   わびなび CMS — データストア
   記事は LocalStorage に保存。公開時に articles.json を書き出す。
   ============================================================ */
window.WabiStore = (function () {
  'use strict';
  var LS_ARTICLES = 'wabinavi_articles';
  var LS_AUTH = 'wabinavi_auth';
  // 簡易パスワード（GitHub Pagesは静的なので本格認証は不可。閲覧抑止レベル）
  var PASSWORD = 'wabinavi2026';

  function uid() {
    return 'a' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  function getArticles() {
    try { return JSON.parse(localStorage.getItem(LS_ARTICLES) || '[]'); }
    catch (e) { return []; }
  }
  function saveArticles(list) {
    localStorage.setItem(LS_ARTICLES, JSON.stringify(list));
  }
  function getArticle(id) {
    return getArticles().find(function (a) { return a.id === id; }) || null;
  }
  function upsert(article) {
    var list = getArticles();
    if (!article.id) { article.id = uid(); article.createdAt = Date.now(); }
    article.updatedAt = Date.now();
    var idx = list.findIndex(function (a) { return a.id === article.id; });
    if (idx >= 0) list[idx] = article; else list.unshift(article);
    saveArticles(list);
    return article;
  }
  function remove(id) {
    saveArticles(getArticles().filter(function (a) { return a.id !== id; }));
  }
  function duplicate(id) {
    var src = getArticle(id);
    if (!src) return null;
    var copy = JSON.parse(JSON.stringify(src));
    copy.id = null;
    copy.title = (copy.title || '') + '（複製）';
    copy.slug = (copy.slug || 'article') + '-copy';
    copy.status = 'draft';
    return upsert(copy);
  }

  // 初回ロード時、JSONがあればLocalStorageへ取り込み（初期データ）
  function seedFromJson(jsonUrl) {
    return fetch(jsonUrl, { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (arr) {
        if (Array.isArray(arr) && arr.length && getArticles().length === 0) {
          arr.forEach(function (a) { if (!a.id) a.id = uid(); });
          saveArticles(arr);
        }
        return getArticles();
      })
      .catch(function () { return getArticles(); });
  }

  // 公開用JSONを書き出し（公開記事のみ）
  function exportJson() {
    var published = getArticles().filter(function (a) { return a.status === 'published'; });
    // 公開に不要な内部フィールドを除去
    var clean = published.map(function (a) {
      var c = JSON.parse(JSON.stringify(a));
      delete c.id; delete c.createdAt; delete c.updatedAt;
      return c;
    });
    var blob = new Blob([JSON.stringify(clean, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var aEl = document.createElement('a');
    aEl.href = url; aEl.download = 'articles.json';
    document.body.appendChild(aEl); aEl.click();
    document.body.removeChild(aEl);
    URL.revokeObjectURL(url);
    return clean.length;
  }

  // 認証
  function login(pw) {
    if (pw === PASSWORD) { sessionStorage.setItem(LS_AUTH, '1'); return true; }
    return false;
  }
  function isAuthed() { return sessionStorage.getItem(LS_AUTH) === '1'; }
  function logout() { sessionStorage.removeItem(LS_AUTH); }
  function requireAuth() { if (!isAuthed()) location.href = 'login.html'; }

  return {
    getArticles: getArticles, getArticle: getArticle, upsert: upsert,
    remove: remove, duplicate: duplicate, seedFromJson: seedFromJson,
    exportJson: exportJson, login: login, isAuthed: isAuthed,
    logout: logout, requireAuth: requireAuth, uid: uid
  };
})();
