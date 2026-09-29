/* ==========================================================================
   周家弘 · 个人简历 —— 交互脚本
   功能：主题切换（记忆上次选择）、区块滚动淡入、导航栏跳转与当前栏目高亮、回到顶部
   ========================================================================== */

(function () {
  'use strict';

  /* ---------- 功能：浅色 / 深色主题切换（记忆上次选择） ---------- */
  var THEME_KEY = 'resume-theme';
  var root = document.documentElement;
  var themeToggle = document.getElementById('themeToggle');

  function getStoredTheme() {
    try {
      return localStorage.getItem(THEME_KEY);
    } catch (err) {
      return null; // 隐私模式等场景下 localStorage 不可用
    }
  }

  function storeTheme(theme) {
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch (err) {
      /* 忽略写入失败，不影响主题切换 */
    }
  }

  function applyTheme(theme) {
    var isDark = theme === 'dark';
    root.setAttribute('data-theme', isDark ? 'dark' : 'light');

    if (themeToggle) {
      var label = isDark ? '切换浅色模式' : '切换深色模式';
      themeToggle.setAttribute('aria-label', label);
      themeToggle.setAttribute('title', label);
    }
  }

  function initTheme() {
    var stored = getStoredTheme();
    if (stored === 'dark' || stored === 'light') {
      applyTheme(stored);
      return;
    }
    // 未选择过时，跟随系统偏好
    var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(prefersDark ? 'dark' : 'light');
  }

  initTheme();

  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      storeTheme(next);
    });
  }

  /* ---------- 功能：区块滚动淡入 ---------- */
  var revealItems = document.querySelectorAll('.reveal');

  if (!('IntersectionObserver' in window)) {
    // 不支持时直接全部显示，保证内容可读
    revealItems.forEach(function (el) {
      el.classList.add('is-visible');
    });
  } else {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    revealItems.forEach(function (el) {
      revealObserver.observe(el);
    });
  }

  /* ---------- 功能：导航栏跳转 + 高亮当前栏目 ---------- */
  var sections = Array.prototype.slice.call(document.querySelectorAll('.anchor'));
  var links = Array.prototype.slice.call(document.querySelectorAll('.nav-link'));
  var currentLabel = document.getElementById('currentSection');
  var toTop = document.getElementById('toTop');

  function setActive(id) {
    var matched = null;

    links.forEach(function (link) {
      var isMatch = link.getAttribute('data-target') === id;
      link.classList.toggle('is-active', isMatch);
      if (isMatch) matched = link;
    });

    if (currentLabel) {
      currentLabel.textContent = matched ? matched.textContent : '个人优势';
    }
  }

  function updateActive() {
    if (!sections.length) return;

    var line = 104; // 判定线：导航栏底部下方约 100px
    var activeId = sections[0].id;

    var reachedBottom = window.innerHeight + window.pageYOffset >= document.body.scrollHeight - 4;

    if (reachedBottom) {
      // 滚动到底部时，直接高亮最后一个栏目
      activeId = sections[sections.length - 1].id;
    } else {
      sections.forEach(function (section) {
        if (section.getBoundingClientRect().top <= line) {
          activeId = section.id;
        }
      });
    }

    setActive(activeId);

    if (toTop) {
      toTop.classList.toggle('is-shown', window.pageYOffset > 240);
    }
  }

  // 点击导航：平滑滚动到目标区块，并同步地址栏 hash
  links.forEach(function (link) {
    link.addEventListener('click', function (event) {
      var target = document.getElementById(link.getAttribute('data-target'));
      if (!target) return;

      event.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      history.replaceState(null, '', '#' + target.id);
      setActive(target.id);
    });
  });

  /* ---------- 功能：回到顶部 ---------- */
  if (toTop) {
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // 滚动监听：用 requestAnimationFrame 节流
  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      updateActive();
      ticking = false;
    });
  }, { passive: true });

  window.addEventListener('resize', updateActive);

  // 首次进入时同步一次状态
  updateActive();
})();
