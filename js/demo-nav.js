// demo-nav.js
// 功能导览面板，低耦合独立插件
(function () {
  'use strict';

  // ===== 演示页面配置 =====
  var demoPages = [
    {
      id: 'extract',
      label: '定向知识提取任务',
      url: './index.html'
    },
    {
      id: 'report-info',
      label: '公募基金定期报告信息',
      url: './report-info.html'
    },
    {
      id: 'fund-manager',
      label: '基金管理人',
      url: './fund-manager.html'
    }
  ];

  // ===== 工具函数 =====
  function getCurrentPageId() {
    var path = window.location.pathname;
    if (path.indexOf('report-info.html') !== -1) return 'report-info';
    if (path.indexOf('fund-manager.html') !== -1) return 'fund-manager';
    return 'extract';
  }

  // ===== 状态 =====
  var isOpen = false;
  var currentPageId = getCurrentPageId();

  // ===== 工具函数 =====
  function createEl(tag, className) {
    var el = document.createElement(tag);
    if (className) el.className = className;
    return el;
  }

  function findPage(id) {
    for (var i = 0; i < demoPages.length; i++) {
      if (demoPages[i].id === id) return demoPages[i];
    }
    return null;
  }

  // ===== 构建 DOM =====
  var root = document.getElementById('demo-nav-root');
  if (!root) return;

  // 功能导览入口
  var toggleBtn = createEl('button', 'demo-toggle');
  toggleBtn.setAttribute('type', 'button');
  toggleBtn.setAttribute('title', '功能导览');
  toggleBtn.innerHTML =
    '<span class="demo-toggle__icon">' +
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">' +
    '<circle cx="12" cy="12" r="10"></circle>' +
    '<polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>' +
    '</svg>' +
    '</span>' +
    '<span class="demo-toggle__text">功能导览</span>';
  root.appendChild(toggleBtn);

  // 遮罩层
  var overlay = createEl('div', 'demo-overlay');
  root.appendChild(overlay);

  // 面板
  var panel = createEl('aside', 'demo-panel');
  panel.setAttribute('aria-label', '功能导览');

  // 面板头部
  var header = createEl('div', 'demo-panel__header');
  var title = createEl('h2', 'demo-panel__title');
  title.textContent = '功能导览';
  var closeBtn = createEl('button', 'demo-panel__close');
  closeBtn.setAttribute('type', 'button');
  closeBtn.setAttribute('aria-label', '关闭功能导览');
  closeBtn.innerHTML = '&times;';
  header.appendChild(title);
  header.appendChild(closeBtn);
  panel.appendChild(header);

  // 页面导航
  var nav = createEl('nav', 'demo-panel__nav');
  var navList = createEl('ul', 'demo-panel__nav-list');
  var navButtons = [];

  demoPages.forEach(function (page) {
    var li = createEl('li', 'demo-panel__nav-item');
    var btn = createEl('button', 'demo-panel__nav-btn');
    btn.setAttribute('type', 'button');
    btn.setAttribute('data-page', page.id);
    btn.textContent = page.label;
    li.appendChild(btn);
    navList.appendChild(li);
    navButtons.push(btn);
  });

  nav.appendChild(navList);
  panel.appendChild(nav);

  root.appendChild(panel);

  // ===== 更新导航高亮 =====
  function updateActiveNav(pageId) {
    navButtons.forEach(function (btn) {
      btn.classList.toggle('is-active', btn.getAttribute('data-page') === pageId);
    });
  }

  // ===== 切换页面 =====
  function switchPage(pageId) {
    var page = findPage(pageId);
    if (!page) return;
    if (pageId === currentPageId) return;
    window.location.href = page.url;
  }

  // ===== 打开/收起面板 =====
  function openPanel() {
    isOpen = true;
    panel.classList.add('is-open');
    overlay.classList.add('is-visible');
    toggleBtn.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function closePanel() {
    isOpen = false;
    panel.classList.remove('is-open');
    overlay.classList.remove('is-visible');
    toggleBtn.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  function togglePanel() {
    if (isOpen) closePanel();
    else openPanel();
  }

  // ===== 事件绑定 =====
  toggleBtn.addEventListener('click', togglePanel);
  closeBtn.addEventListener('click', closePanel);
  overlay.addEventListener('click', closePanel);

  navButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var pageId = btn.getAttribute('data-page');
      switchPage(pageId);
    });
  });

  // ===== 初始化 =====
  if (currentPageId) {
    updateActiveNav(currentPageId);
  }
})();
