// demo-nav.js
// 功能导览面板，低耦合独立插件
(function () {
  'use strict';

  // ===== 演示页面配置 =====
  var demoPages = [
    {
      id: 'extract',
      label: '定向知识提取任务',
      desc: '发起取数、重试任务、下载提取结果',
      url: './extract-task.html'
    },
    {
      id: 'report-info',
      label: '公募基金定期报告信息',
      desc: '查看、筛选、编辑、导出结构化结果',
      url: './index.html'
    },
    {
      id: 'fund-manager',
      label: '基金管理人',
      desc: '查看某时间节点全部管理人及基金范围',
      url: './fund-manager.html'
    }
  ];

  // ===== 工具函数 =====
  function getCurrentPageId() {
    var path = window.location.pathname;
    if (path.indexOf('extract-task.html') !== -1) return 'extract';
    if (path.indexOf('fund-manager.html') !== -1) return 'fund-manager';
    return 'report-info';
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

  // 页面关系简图
  var relation = createEl('section', 'demo-panel__relation');
  var relationTitle = createEl('div', 'demo-panel__relation-title');
  relationTitle.textContent = '页面关系';
  var relationGraph = createEl('div', 'demo-relation-graph');

  [
    { name: '基金管理人', desc: '时间节点全量管理人' },
    { name: '知识提取任务', desc: '按章节/维度取数' },
    { name: '报告信息', desc: '结构化查询/编辑/导出' }
  ].forEach(function (item, index) {
    var node = createEl('div', 'demo-relation-node');
    var name = createEl('span', 'demo-relation-node__name');
    var desc = createEl('span', 'demo-relation-node__desc');
    name.textContent = item.name;
    desc.textContent = item.desc;
    node.appendChild(name);
    node.appendChild(desc);
    relationGraph.appendChild(node);

    if (index < 2) {
      var arrow = createEl('div', 'demo-relation-arrow');
      arrow.textContent = '↓';
      relationGraph.appendChild(arrow);
    }
  });

  var scope = createEl('div', 'demo-relation-scope');
  var scopeNode = createEl('div', 'demo-relation-scope__node');
  var scopeName = createEl('span', 'demo-relation-scope__name');
  var scopeDesc = createEl('span', 'demo-relation-scope__desc');
  var scopeFlow = createEl('span', 'demo-relation-scope__flow');
  scopeName.textContent = '取数范围';
  scopeDesc.textContent = '管理人维度取任一普通公募基金报告，产品维度取该管理人全部普通公募基金报告';
  scopeFlow.textContent = '管理人 → 基金';
  scopeNode.appendChild(scopeName);
  scopeNode.appendChild(scopeDesc);
  scope.appendChild(scopeNode);
  scope.appendChild(scopeFlow);

  relation.appendChild(relationTitle);
  relation.appendChild(relationGraph);
  relation.appendChild(scope);

  // 页面导航
  var nav = createEl('nav', 'demo-panel__nav');
  var navTitle = createEl('div', 'demo-panel__nav-title');
  navTitle.textContent = '页面切换';
  var navList = createEl('ul', 'demo-panel__nav-list');
  var navButtons = [];

  demoPages.forEach(function (page) {
    var li = createEl('li', 'demo-panel__nav-item');
    var btn = createEl('button', 'demo-panel__nav-btn');
    var btnMain = createEl('span', 'demo-panel__nav-main');
    var btnLabel = createEl('span', 'demo-panel__nav-label');
    var btnBadge = createEl('span', 'demo-panel__nav-badge');
    var btnDesc = createEl('span', 'demo-panel__nav-desc');
    btn.setAttribute('type', 'button');
    btn.setAttribute('data-page', page.id);
    btnLabel.textContent = page.label;
    btnBadge.textContent = '当前';
    btnDesc.textContent = page.desc;
    btnMain.appendChild(btnLabel);
    btnMain.appendChild(btnBadge);
    btn.appendChild(btnMain);
    btn.appendChild(btnDesc);
    li.appendChild(btn);
    navList.appendChild(li);
    navButtons.push(btn);
  });

  nav.appendChild(navTitle);
  nav.appendChild(navList);

  // 面板内容区（可滚动）
  var content = createEl('div', 'demo-panel__content');
  content.appendChild(relation);
  content.appendChild(nav);
  panel.appendChild(content);

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
