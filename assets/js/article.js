/* ============================================================
   わびなび 記事詳細 — データ取得＆描画
   データ優先順位: data/articles.json → LocalStorage → サンプル
   ============================================================ */
(function () {
  'use strict';

  // URLの ?slug=xxx で記事を特定
  var params = new URLSearchParams(location.search);
  var slug = params.get('slug');
  var isPreview = params.get('preview') === '1';

  // ── サンプル記事（JSONもLocalStorageも無い場合のフォールバック）──
  var SAMPLE = {
    slug: 'zenkoji-monzen',
    category: '定番巡礼ルート',
    title: '善光寺と門前町を巡る\n歴史とご利益の旅',
    hero: 'https://images.unsplash.com/photo-1493997181344-712f2f19d87a?w=900&q=80',
    lead: '善光寺と門前町の歴史に触れながら、心を整える定番の巡礼ルート。由緒ある神社とお寺を巡り、信仰と文化にふれる一日旅をご提案します。',
    spots: [
      {
        name: '善光寺', reading: 'ぜんこうじ', loc: '長野県長野市',
        tags: ['開運', '厄除け', '心願成就'],
        photo: 'https://images.unsplash.com/photo-1480796927426-f609979314bd?w=800&q=80',
        desc: '仏教と神道が融合した日本を代表する古刹。「一生に一度は善光寺参り」と言われるほど、厚い信仰を集めています。'
      },
      {
        name: '戸隠神社 中社', reading: 'とがくしじんじゃ ちゅうしゃ', loc: '長野県長野市',
        tags: ['心願成就', '学業成就', '開運'],
        photo: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800&q=80',
        desc: '天照大神をお祀りする神社で、学業成就や心願成就のご利益で知られています。静かな森に佇む神聖な空気が魅力です。'
      }
    ],
    nearby: [
      {
        name: 'そば処 桜庵', cat: 'おすすめの飲食店',
        tags: ['そば', '和食'],
        photo: 'https://images.unsplash.com/photo-1552611052-33e04de081de?w=800&q=80',
        desc: '善光寺門前にある老舗のそば店。信州そばの風味を堪能できます。'
      },
      {
        name: '戸隠高原ドライブウェイ', cat: 'おすすめのドライブスポット',
        tags: ['絶景', '自然'],
        photo: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80',
        desc: '四季折々の自然が楽しめる絶景ドライブコース。戸隠連峰の眺望が魅力です。'
      }
    ],
    summary: '歴史ある善光寺と、門前町のグルメや自然を楽しむ充実のルート。心と体を整えるご利益旅にぴったりです。',
    lodging: [
      {
        name: 'ホテル国際21', photo: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80',
        desc: '善光寺まで徒歩圏内のシティホテル。温泉大浴場で旅の疲れを癒せます。', url: '#'
      },
      {
        name: '山のホテル大町', photo: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&q=80',
        desc: '自然に囲まれた静かなリゾートホテル。露天風呂と信州の食材を楽しめます。', url: '#'
      }
    ]
  };

  // ── データ取得 ──
  function loadArticles() {
    return fetch('../data/articles.json', { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error('no json'); return r.json(); })
      .catch(function () {
        // JSONが無ければLocalStorageを試す
        try {
          var ls = JSON.parse(localStorage.getItem('wabinavi_articles') || '[]');
          return ls;
        } catch (e) { return []; }
      });
  }

  loadArticles().then(function (articles) {
    var article = null;
    // プレビューモード：sessionStorageの記事を優先
    if (isPreview) {
      try { article = JSON.parse(sessionStorage.getItem('wabinavi_preview') || 'null'); } catch (e) {}
    }
    if (!article && Array.isArray(articles) && articles.length) {
      article = slug ? articles.find(function (a) { return a.slug === slug; }) : articles[0];
    }
    if (!article) article = SAMPLE;
    render(article);
  });

  // ── 描画 ──
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function tagsHtml(tags) {
    return (tags || []).map(function (t) { return '<span class="tag">' + esc(t) + '</span>'; }).join('');
  }

  function render(a) {
    document.title = 'わびなび｜' + (a.title || '').replace(/\n/g, ' ');
    var h = '';

    // ヒーロー
    h += '<section class="hero fade-up">' +
      '<img class="hero-img" src="' + esc(a.hero) + '" alt="">' +
      '<div class="hero-grad"></div>' +
      '<div class="hero-content">' +
        (a.category ? '<span class="hero-tag">' + esc(a.category) + '</span>' : '') +
        '<h1 class="hero-title">' + esc(a.title).replace(/\n/g, '<br>') + '</h1>' +
      '</div>' +
    '</section>';

    // リード
    if (a.lead) h += '<p class="lead fade-up">' + esc(a.lead).replace(/\n/g, '<br>') + '</p>';

    // セクション01：巡礼する神社
    if (a.spots && a.spots.length) {
      h += '<section class="section">' +
        '<div class="section-head fade-up"><span class="section-num">01</span><span class="section-title">巡礼する神社</span></div>';
      a.spots.forEach(function (s) {
        h += '<article class="spot fade-up">' +
          '<div class="spot-photo"><img src="' + esc(s.photo) + '" alt="' + esc(s.name) + '"></div>' +
          '<div class="spot-info">' +
            '<h2 class="spot-name">' + esc(s.name) + (s.reading ? '<span class="reading">（' + esc(s.reading) + '）</span>' : '') + '</h2>' +
            '<div class="spot-loc">' + esc(s.loc) + '</div>' +
            '<div class="spot-tags">' + tagsHtml(s.tags) + '</div>' +
            (s.desc ? '<p class="spot-desc">' + esc(s.desc).replace(/\n/g, '<br>') + '</p>' : '') +
          '</div>' +
        '</article>';
      });
      h += '</section>';
    }

    // セクション02：近隣のおすすめスポット
    if (a.nearby && a.nearby.length) {
      h += '<section class="section">' +
        '<div class="section-head fade-up"><span class="section-num">02</span><span class="section-title">近隣のおすすめスポット</span></div>';
      a.nearby.forEach(function (n) {
        h += '<article class="nearby fade-up">' +
          '<div class="nearby-photo"><img src="' + esc(n.photo) + '" alt="' + esc(n.name) + '"></div>' +
          '<div class="nearby-info">' +
            '<h3 class="nearby-name">' + esc(n.name) + (n.cat ? '<span class="cat">（' + esc(n.cat) + '）</span>' : '') + '</h3>' +
            '<div class="nearby-tags">' + tagsHtml(n.tags) + '</div>' +
            (n.desc ? '<p class="nearby-desc">' + esc(n.desc).replace(/\n/g, '<br>') + '</p>' : '') +
          '</div>' +
        '</article>';
      });
      h += '</section>';
    }

    // セクション03：まとめ＋宿泊施設
    h += '<section class="section">' +
      '<div class="section-head fade-up"><span class="section-num">03</span><span class="section-title">巡礼のまとめとおすすめ宿泊施設</span></div>';
    if (a.summary) {
      h += '<div class="summary-card fade-up"><p>' + esc(a.summary).replace(/\n/g, '<br>') + '</p></div>';
    }
    if (a.lodging && a.lodging.length) {
      h += '<div class="lodging-head fade-up"><span class="ico">🏯</span><h3>おすすめ宿泊施設</h3><span class="note">（アフィリエイト掲載）</span></div>';
      h += '<div class="lodging-grid fade-up">';
      a.lodging.forEach(function (l) {
        h += '<a class="lodging-card" href="' + esc(l.url || '#') + '" target="_blank" rel="noopener sponsored">' +
          '<div class="lodging-photo"><img src="' + esc(l.photo) + '" alt="' + esc(l.name) + '"></div>' +
          '<div class="lodging-body">' +
            '<div class="lodging-name">' + esc(l.name) + '</div>' +
            '<div class="lodging-desc">' + esc(l.desc) + '</div>' +
            '<div class="lodging-cta">詳細を見る <svg viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></div>' +
          '</div>' +
        '</a>';
      });
      h += '</div>';
    }
    h += '</section>';

    // SNS共有
    h += '<section class="share">' +
      '<div class="share-title fade-up">この記事をシェア</div>' +
      '<div class="share-icons fade-up">' +
        shareBtn('x', 'X（旧Twitter）', '<svg viewBox="0 0 24 24" fill="#fff"><path d="M18.9 2H22l-7.6 8.7L23.4 22h-7l-5.5-7.2L4.6 22H1.5l8.1-9.3L1 2h7.2l4.9 6.5L18.9 2zm-1.2 18h1.9L7.1 4H5.1l12.6 16z"/></svg>') +
        shareBtn('fb', 'Facebook', '<svg viewBox="0 0 24 24" fill="#fff"><path d="M22 12a10 10 0 10-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.4v7A10 10 0 0022 12z"/></svg>') +
        shareBtn('line', 'LINEで送る', '<svg viewBox="0 0 24 24" fill="#fff"><path d="M12 2C6.5 2 2 5.6 2 10c0 4 3.6 7.3 8.5 7.9.3.1.8.2.9.5.1.3.1.7 0 1l-.1.9c0 .3-.2 1 .9.6 1.1-.5 6-3.5 8.2-6C21.5 13.4 22 11.8 22 10c0-4.4-4.5-8-10-8zM8 13H6.5c-.2 0-.4-.2-.4-.4V9.4c0-.2.2-.4.4-.4s.4.2.4.4v2.8H8c.2 0 .4.2.4.4S8.2 13 8 13zm1.7-.4c0 .2-.2.4-.4.4s-.4-.2-.4-.4V9.4c0-.2.2-.4.4-.4s.4.2.4.4v3.2zm4-.0c0 .2-.1.3-.3.4h-.1c-.1 0-.3-.1-.3-.2l-1.4-1.9v1.7c0 .2-.2.4-.4.4s-.4-.2-.4-.4V9.4c0-.2.1-.3.3-.4.2 0 .3 0 .4.2l1.4 1.9V9.4c0-.2.2-.4.4-.4s.4.2.4.4v3.2zm2.9-2c.2 0 .4.2.4.4s-.2.4-.4.4h-1.1v.7h1.1c.2 0 .4.2.4.4s-.2.4-.4.4h-1.5c-.2 0-.4-.2-.4-.4V9.4c0-.2.2-.4.4-.4h1.5c.2 0 .4.2.4.4s-.2.4-.4.4h-1.1v.7h1.1z"/></svg>') +
      '</div>' +
    '</section>';

    document.getElementById('article').innerHTML = h;
    document.getElementById('hdTitle').textContent = 'おすすめルート';
    bindShare(a);
    observeFade();
  }

  function shareBtn(kind, label, svg) {
    return '<button class="share-btn share-' + kind + '" data-share="' + kind + '">' +
      '<span class="share-icon">' + svg + '</span>' +
      '<span class="share-label">' + label + '</span>' +
    '</button>';
  }

  function bindShare(a) {
    var url = encodeURIComponent(location.href);
    var text = encodeURIComponent((a.title || '').replace(/\n/g, ' ') + ' ｜ わびなび');
    var map = {
      x: 'https://twitter.com/intent/tweet?url=' + url + '&text=' + text,
      fb: 'https://www.facebook.com/sharer/sharer.php?u=' + url,
      line: 'https://social-plugins.line.me/lineit/share?url=' + url
    };
    document.querySelectorAll('[data-share]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var k = btn.getAttribute('data-share');
        window.open(map[k], '_blank', 'width=600,height=500');
      });
    });
  }

  // スクロールfade-up
  function observeFade() {
    var els = document.querySelectorAll('.fade-up');
    if (!('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    els.forEach(function (e) { io.observe(e); });
  }
})();
