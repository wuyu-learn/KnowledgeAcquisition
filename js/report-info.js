// report-info.js
// 公募基金定期报告信息页面逻辑
(function () {
  'use strict';

  var reportData = Array.isArray(window.__REPORT_INFO_DATA__)
    ? window.__REPORT_INFO_DATA__
    : [];

  var els = {
    navTabs: document.getElementById('reportInfoNavTabs'),
    navContent: document.getElementById('reportInfoNavContent'),
    reportPeriod: document.getElementById('reportPeriod'),
    managerName: document.getElementById('managerName'),
    searchBtn: document.getElementById('reportInfoSearchBtn'),
    resetBtn: document.getElementById('reportInfoResetBtn'),
    refreshBtn: document.getElementById('reportInfoRefreshBtn'),
    batchExportBtn: document.getElementById('reportInfoBatchExportBtn'),
    batchLogBtn: document.getElementById('reportInfoBatchLogBtn'),
    selectionInfo: document.getElementById('reportInfoSelectionInfo'),
    tableHead: document.getElementById('reportInfoTableHead'),
    tableBody: document.getElementById('reportInfoTableBody'),
    emptyState: document.getElementById('reportInfoEmpty'),
    paginationTotal: document.getElementById('reportInfoPaginationTotal'),
    pageSizeSelect: document.getElementById('reportInfoPageSizeSelect'),
    paginationNav: document.getElementById('reportInfoPaginationNav'),
    jumpInput: document.getElementById('reportInfoJumpInput')
  };

  var currentSheetIndex = 0;
  var currentFilterValue = '';
  var currentPage = 1;
  var pageSize = 10;
  var currentNavTab = 'mid';
  var navButtons = [];

  function createEl(tag, className) {
    var el = document.createElement(tag);
    if (className) el.className = className;
    return el;
  }

  function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function formatCellValue(value) {
    if (value === undefined || value === null || value === '') return '--';
    var text = String(value);
    text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    text = text.replace(/\n{3,}/g, '\n\n');
    return text;
  }

  function formatDate(value) {
    if (value === undefined || value === null || value === '') return '--';
    var text = String(value).trim();
    if (!text) return '--';
    // 只取日期部分，如 "2025-08-29 00:00:00" → "2025-08-29"
    return text.split(' ')[0];
  }

  function isLongTextColumn(col) {
    return /段落内容|整改措施|处罚的依据|调查处罚情况/.test(col);
  }

  // ===== 获取当前 Sheet =====
  function getCurrentSheet() {
    return reportData[currentSheetIndex] || null;
  }

  // ===== 根据章节名称查找 Sheet 索引 =====
  function findSheetIndexByName(name) {
    for (var i = 0; i < reportData.length; i++) {
      if (reportData[i].sheetName === name) return i;
    }
    return -1;
  }

  // ===== 获取 URL 中的 chapter 参数 =====
  function getUrlChapterParam() {
    try {
      var params = new URLSearchParams(window.location.search);
      return params.get('chapter');
    } catch (e) {
      return null;
    }
  }

  // ===== 渲染左侧导航 =====
  function renderNav() {
    if (!els.navTabs || !els.navContent) return;

    // 渲染 tab 按钮
    els.navTabs.innerHTML = '';
    var tabs = [
      { key: 'mid', label: '中报' },
      { key: 'annual', label: '年报' },
      { key: 'quarter', label: '季报' }
    ];

    tabs.forEach(function (tab) {
      var btn = createEl('button', 'report-info-nav__tab');
      btn.setAttribute('type', 'button');
      btn.setAttribute('data-tab', tab.key);
      btn.textContent = tab.label;
      if (tab.key === currentNavTab) {
        btn.classList.add('is-active');
      }
      els.navTabs.appendChild(btn);

      btn.addEventListener('click', function () {
        switchNavTab(tab.key);
      });
    });

    // 渲染 tab 内容
    renderNavContent();
  }

  function renderNavContent() {
    if (!els.navContent) return;

    els.navContent.innerHTML = '';

    if (currentNavTab !== 'mid') {
      var emptyEl = createEl('div', 'report-info-nav__empty');
      emptyEl.textContent = '后续建设中...';
      els.navContent.appendChild(emptyEl);
      return;
    }

    var listEl = createEl('ul', 'report-info-nav__list');
    navButtons = [];

    reportData.forEach(function (sheet, index) {
      var li = createEl('li', 'report-info-nav__item');
      var btn = createEl('button', 'report-info-nav__btn');
      btn.setAttribute('type', 'button');
      btn.setAttribute('data-index', String(index));
      btn.textContent = sheet.sheetName || '未命名';
      li.appendChild(btn);
      listEl.appendChild(li);
      navButtons.push(btn);

      btn.addEventListener('click', function () {
        switchSheet(index);
      });
    });

    els.navContent.appendChild(listEl);
  }

  function switchNavTab(tabKey) {
    currentNavTab = tabKey;
    renderNav();
  }

  function updateActiveNav(index) {
    navButtons.forEach(function (btn, idx) {
      btn.classList.toggle('is-active', idx === index);
    });
  }

  // ===== 筛选区：报告期选项 =====
  function initReportPeriodOptions() {
    if (!els.reportPeriod) return;

    var sheet = getCurrentSheet();
    var periods = [];

    if (sheet && Array.isArray(sheet.rows)) {
      sheet.rows.forEach(function (row) {
        var period = row['报告期'];
        if (period && String(period).trim() && periods.indexOf(period) === -1) {
          periods.push(period);
        }
      });
    }

    els.reportPeriod.innerHTML = '<option value="">全部报告期</option>';

    periods.forEach(function (period) {
      var option = createEl('option');
      option.value = period;
      option.textContent = period;
      els.reportPeriod.appendChild(option);
    });

    // 切换 Sheet 时重置筛选条件
    els.reportPeriod.value = '';
    currentFilterValue = '';
  }

  // ===== 筛选区：管理人名称选项 =====
  function initManagerNameOptions() {
    if (!els.managerName) return;

    var managers = [];
    reportData.forEach(function (sheet) {
      if (!Array.isArray(sheet.rows)) return;
      sheet.rows.forEach(function (row) {
        var manager = row['管理人名称'];
        if (manager && String(manager).trim() && managers.indexOf(manager) === -1) {
          managers.push(manager);
        }
      });
    });

    els.managerName.innerHTML = '<option value="">全部</option>';

    managers.forEach(function (manager) {
      var option = createEl('option');
      option.value = manager;
      option.textContent = manager;
      els.managerName.appendChild(option);
    });
  }

  // ===== 获取过滤后的数据 =====
  function getFilteredRows() {
    var sheet = getCurrentSheet();
    if (!sheet || !Array.isArray(sheet.rows)) return [];

    var rows = sheet.rows;
    if (currentFilterValue) {
      rows = rows.filter(function (row) {
        return String(row['报告期'] || '') === currentFilterValue;
      });
    }

    return sortRowsByHasContent(rows);
  }

  // ===== 按"是否有内容"排序：否沉底，全是否时保持原顺序 =====
  function sortRowsByHasContent(rows) {
    if (!Array.isArray(rows) || rows.length === 0) return rows;

    var hasYes = rows.some(function (row) {
      return String(row['是否有内容'] || '').trim() === '是';
    });

    // 全是"否"，保持原顺序
    if (!hasYes) return rows;

    // 同时存在"是"和"否"，"是"在前，"否"在后，内部保持原顺序
    return rows.slice().sort(function (a, b) {
      var aYes = String(a['是否有内容'] || '').trim() === '是';
      var bYes = String(b['是否有内容'] || '').trim() === '是';
      if (aYes === bYes) return 0;
      return aYes ? -1 : 1;
    });
  }

  // ===== 分页数据 =====
  function getPaginationData() {
    var rows = getFilteredRows();
    var total = rows.length;
    var totalPages = Math.max(1, Math.ceil(total / pageSize));
    var page = Math.min(currentPage, totalPages);
    var start = (page - 1) * pageSize;
    var end = start + pageSize;
    return {
      total: total,
      totalPages: totalPages,
      page: page,
      start: start,
      end: end,
      rows: rows.slice(start, end)
    };
  }

  // ===== 渲染分页组件 =====
  function renderPagination() {
    if (!els.paginationTotal || !els.paginationNav) return;

    var data = getPaginationData();

    if (els.paginationTotal) {
      els.paginationTotal.textContent = data.total;
    }

    if (els.jumpInput) {
      els.jumpInput.value = '';
      els.jumpInput.max = data.totalPages;
    }

    els.paginationNav.innerHTML = '';

    // 上一页
    var prevBtn = createEl('button', 'page-btn page-btn-prev');
    prevBtn.setAttribute('type', 'button');
    prevBtn.setAttribute('data-page', 'prev');
    prevBtn.setAttribute('title', '上一页');
    prevBtn.textContent = '‹';
    prevBtn.disabled = data.page <= 1;
    els.paginationNav.appendChild(prevBtn);

    // 页码按钮
    var maxVisible = 5;
    var startPage = 1;
    var endPage = data.totalPages;

    if (data.totalPages > maxVisible) {
      var half = Math.floor(maxVisible / 2);
      startPage = Math.max(1, data.page - half);
      endPage = Math.min(data.totalPages, startPage + maxVisible - 1);
      if (endPage - startPage + 1 < maxVisible) {
        startPage = endPage - maxVisible + 1;
      }
    }

    for (var p = startPage; p <= endPage; p++) {
      var pageBtn = createEl('button', 'page-btn');
      pageBtn.setAttribute('type', 'button');
      pageBtn.setAttribute('data-page', String(p));
      pageBtn.textContent = String(p);
      if (p === data.page) {
        pageBtn.classList.add('active');
      }
      els.paginationNav.appendChild(pageBtn);
    }

    // 下一页
    var nextBtn = createEl('button', 'page-btn page-btn-next');
    nextBtn.setAttribute('type', 'button');
    nextBtn.setAttribute('data-page', 'next');
    nextBtn.setAttribute('title', '下一页');
    nextBtn.textContent = '›';
    nextBtn.disabled = data.page >= data.totalPages;
    els.paginationNav.appendChild(nextBtn);
  }

  function bindPaginationEvents() {
    if (!els.paginationNav) return;

    els.paginationNav.addEventListener('click', function (e) {
      var btn = e.target.closest('.page-btn');
      if (!btn || btn.disabled) return;

      var page = btn.getAttribute('data-page');
      var data = getPaginationData();

      if (page === 'prev') {
        if (currentPage > 1) currentPage--;
      } else if (page === 'next') {
        if (currentPage < data.totalPages) currentPage++;
      } else {
        currentPage = parseInt(page, 10) || 1;
      }

      renderTable();
    });

    if (els.pageSizeSelect) {
      els.pageSizeSelect.addEventListener('change', function () {
        pageSize = parseInt(els.pageSizeSelect.value, 10) || 10;
        currentPage = 1;
        renderTable();
      });
    }

    if (els.jumpInput) {
      els.jumpInput.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter') return;
        var data = getPaginationData();
        var page = parseInt(els.jumpInput.value, 10);
        if (page >= 1 && page <= data.totalPages) {
          currentPage = page;
          renderTable();
        }
      });
    }
  }

  // ===== 渲染表格 =====
  function renderTable() {
    if (!els.tableHead || !els.tableBody) return;

    var sheet = getCurrentSheet();
    if (!sheet) return;

    var columns = Array.isArray(sheet.columns) ? sheet.columns : [];
    var data = getPaginationData();
    var rows = data.rows;

    // 表头
    els.tableHead.innerHTML = '';
    var headerTr = createEl('tr');

    var checkAllTh = createEl('th', 'check-col');
    checkAllTh.innerHTML = '<input id="reportInfoCheckAll" aria-label="全选" type="checkbox">';
    headerTr.appendChild(checkAllTh);

    var indexTh = createEl('th', 'col-index');
    indexTh.textContent = '序号';
    headerTr.appendChild(indexTh);

    columns.forEach(function (col) {
      var th = createEl('th');
      if (isLongTextColumn(col)) {
        th.className = 'knowledge-col';
      } else if (col === '基金简称' || col === '基金名称') {
        th.className = 'report-info-fund-name';
      } else if (col === '报告名称') {
        th.className = 'report-info-report-name';
      } else if (col === '章节') {
        th.className = 'report-info-chapter';
      }
      th.textContent = col;
      headerTr.appendChild(th);
    });
    var actionTh = createEl('th', 'sticky-right');
    actionTh.textContent = '操作';
    headerTr.appendChild(actionTh);
    els.tableHead.appendChild(headerTr);

    // 表体
    els.tableBody.innerHTML = '';

    if (rows.length === 0) {
      if (els.emptyState) els.emptyState.hidden = false;
      if (els.paginationTotal) els.paginationTotal.textContent = data.total;
      updateSelectionInfo();
      renderPagination();
      return;
    }

    if (els.emptyState) els.emptyState.hidden = true;

    rows.forEach(function (row, rowIndex) {
      var tr = createEl('tr');

      var checkTd = createEl('td', 'check-col');
      var globalIndex = data.start + rowIndex;
      checkTd.innerHTML = '<input type="checkbox" data-check="' + globalIndex + '" aria-label="选择">';
      tr.appendChild(checkTd);

      var indexTd = createEl('td', 'col-index');
      indexTd.textContent = String(globalIndex + 1);
      tr.appendChild(indexTd);

      columns.forEach(function (col) {
        var td = createEl('td');
        if (isLongTextColumn(col)) {
          td.className = 'knowledge-col';
        } else if (col === '基金简称' || col === '基金名称') {
          td.className = 'report-info-fund-name';
        } else if (col === '报告名称') {
          td.className = 'report-info-report-name';
        } else if (col === '章节') {
          td.className = 'report-info-chapter';
        }
        var value = row[col];
        var formatted = formatCellValue(value);
        if (formatted === '--') {
          td.innerHTML = '<span style="color: var(--biz-muted, #667085);">--</span>';
        } else if (isLongTextColumn(col)) {
          td.textContent = formatted;
          td.setAttribute('title', formatted);
        } else if (col === '公告发布日期') {
          td.textContent = formatDate(value);
        } else {
          td.innerHTML = escapeHtml(formatted).replace(/\n/g, '<br>');
        }
        tr.appendChild(td);
      });

      var actionTd = createEl('td', 'sticky-right');
      actionTd.innerHTML =
        '<div class="row-actions">' +
        '<button class="link-btn" type="button" data-action="view">查看</button>' +
        '<button class="link-btn" type="button" data-action="edit">编辑</button>' +
        '<button class="link-btn danger" type="button" data-action="delete">删除</button>' +
        '</div>';
      tr.appendChild(actionTd);

      els.tableBody.appendChild(tr);
    });

    bindCheckAll();
    updateSelectionInfo();
    renderPagination();
  }

  // ===== 全选/取消全选 =====
  function bindCheckAll() {
    var checkAll = document.getElementById('reportInfoCheckAll');
    if (!checkAll || !els.tableBody) return;

    checkAll.addEventListener('change', function () {
      var checked = checkAll.checked;
      els.tableBody.querySelectorAll('[data-check]').forEach(function (box) {
        box.checked = checked;
      });
      updateSelectionInfo();
    });

    els.tableBody.addEventListener('change', function (e) {
      if (e.target.matches('[data-check]')) {
        if (!e.target.checked) checkAll.checked = false;
        updateSelectionInfo();
      }
    });
  }

  // ===== 更新选择信息 =====
  function updateSelectionInfo() {
    if (!els.selectionInfo || !els.tableBody) return;

    var count = els.tableBody.querySelectorAll('[data-check]:checked').length;
    els.selectionInfo.textContent = '已选择 ' + count + ' 条';

    if (els.batchExportBtn) els.batchExportBtn.disabled = count < 2;
    if (els.batchLogBtn) els.batchLogBtn.disabled = count < 2;
  }

  // ===== 切换 Sheet =====
  function switchSheet(index) {
    if (index < 0 || index >= reportData.length) return;
    currentSheetIndex = index;
    currentPage = 1;
    currentFilterValue = '';
    updateActiveNav(index);
    initReportPeriodOptions();
    renderTable();
  }

  // ===== 绑定筛选事件 =====
  function bindFilterEvents() {
    if (!els.searchBtn || !els.resetBtn || !els.reportPeriod) return;

    els.searchBtn.addEventListener('click', function () {
      currentFilterValue = els.reportPeriod.value;
      currentPage = 1;
      renderTable();
    });

    els.resetBtn.addEventListener('click', function () {
      els.reportPeriod.value = '';
      currentFilterValue = '';
      currentPage = 1;
      renderTable();
    });

    if (els.refreshBtn) {
      els.refreshBtn.addEventListener('click', function () {
        renderTable();
        window.showToast && window.showToast('列表已刷新');
      });
    }
  }

  // ===== 绑定行操作按钮事件 =====
  function bindRowActionEvents() {
    if (!els.tableBody) return;

    els.tableBody.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-action]');
      if (!btn) return;

      var action = btn.getAttribute('data-action');
      if (action === 'edit') {
        // V1：编辑入口，暂不做实际功能
        window.showToast && window.showToast('编辑功能开发中');
      }
    });
  }

  // ===== 初始化 =====
  function init() {
    if (reportData.length === 0) {
      if (els.navTitle) els.navTitle.textContent = '报告章节（0）';
      if (els.emptyState) {
        els.emptyState.hidden = false;
        els.emptyState.textContent = '暂无数据';
      }
      return;
    }

    renderNav();
    initManagerNameOptions();
    bindFilterEvents();
    bindPaginationEvents();
    bindRowActionEvents();

    var targetChapter = getUrlChapterParam();
    if (targetChapter) {
      var targetIndex = findSheetIndexByName(targetChapter);
      if (targetIndex !== -1) {
        switchSheet(targetIndex);
        return;
      }
    }
    switchSheet(0);
  }

  init();
})();
