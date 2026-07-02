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
    exportLogBtn: document.getElementById('reportInfoExportLogBtn'),
    exportListBtn: document.getElementById('reportInfoExportListBtn'),
    refreshBtn: document.getElementById('reportInfoRefreshBtn'),
    batchLogBtn: document.getElementById('reportInfoBatchLogBtn'),
    addBtn: document.getElementById('reportInfoAddBtn'),
    selectionInfo: document.getElementById('reportInfoSelectionInfo'),
    tableHead: document.getElementById('reportInfoTableHead'),
    tableBody: document.getElementById('reportInfoTableBody'),
    emptyState: document.getElementById('reportInfoEmpty'),
    paginationTotal: document.getElementById('reportInfoPaginationTotal'),
    pageSizeSelect: document.getElementById('reportInfoPageSizeSelect'),
    paginationNav: document.getElementById('reportInfoPaginationNav'),
    jumpInput: document.getElementById('reportInfoJumpInput'),
    recordModalMask: document.getElementById('recordModalMask'),
    sheetTitle: document.getElementById('reportInfoSheetTitle'),
    recordModalTitle: document.getElementById('recordModalTitle'),
    recordModalBody: document.getElementById('recordModalBody'),
    recordModalCloseX: document.getElementById('recordModalCloseX'),
    recordModalCancelBtn: document.getElementById('recordModalCancelBtn'),
    recordModalSaveBtn: document.getElementById('recordModalSaveBtn'),
    dimensionTag: document.getElementById('reportInfoDimensionTag'),
    contentTypeTag: document.getElementById('reportInfoContentTypeTag'),
    confirmModalMask: document.getElementById('confirmModalMask'),
    confirmModalTitle: document.getElementById('confirmModalTitle'),
    confirmModalBody: document.getElementById('confirmModalBody'),
    confirmModalCancelBtn: document.getElementById('confirmModalCancelBtn'),
    confirmModalConfirmBtn: document.getElementById('confirmModalConfirmBtn')
  };

  var currentSheetIndex = 0;
  var currentFilterValue = '';
  var currentPage = 1;
  var pageSize = 10;
  var currentNavTab = 'mid';
  var navButtons = [];
  var editingRow = null;
  var isAddingRow = false;
  var editableColumns = [];
  var pendingDeleteRow = null;
  var confirmModalCallback = null;

  // 新增弹框中由基金代码回填的只读字段
  var AUTO_FILL_COLUMNS = ['基金简称', '基金名称', '报告名称', '管理人名称', '报告ID', '公告发布日期'];

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

  if (typeof window.showToast !== 'function') {
    window.showToast = function (message) {
      var toast = document.getElementById('toast');
      if (!toast) return;
      toast.textContent = message;
      toast.classList.add('show');
      setTimeout(function () {
        toast.classList.remove('show');
      }, 2500);
    };
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

  // ===== 根据基金代码在所有数据中查找记录 =====
  function findRowByFundCode(fundCode) {
    var code = String(fundCode || '').trim();
    if (!code) return null;
    for (var i = 0; i < reportData.length; i++) {
      var sheet = reportData[i];
      if (!Array.isArray(sheet.rows)) continue;
      for (var j = 0; j < sheet.rows.length; j++) {
        var row = sheet.rows[j];
        if (String(row['基金代码'] || '').trim() === code) {
          return row;
        }
      }
    }
    return null;
  }

  // ===== 获取所有不重复的基金代码选项（代码 + 简称）=====
  function getFundCodeOptions() {
    var options = [];
    var seen = [];
    reportData.forEach(function (sheet) {
      if (!Array.isArray(sheet.rows)) return;
      sheet.rows.forEach(function (row) {
        var code = row['基金代码'];
        var name = row['基金简称'];
        if (code && String(code).trim() && seen.indexOf(code) === -1) {
          seen.push(code);
          options.push({ code: code, name: name || '' });
        }
      });
    });
    return options;
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

      if (sheet.structured === false) {
        var badgeSpan = createEl('span', 'report-info-nav__badge report-info-nav__badge--unstructured');
        badgeSpan.textContent = '非结构化';
        badgeSpan.title = '该章节数据为非结构化文本';
        btn.appendChild(badgeSpan);
      }

      if (sheet.extractOnly === true) {
        var extractBadge = createEl('span', 'report-info-nav__badge report-info-nav__badge--extract-only');
        extractBadge.textContent = '仅提取';
        extractBadge.title = '该章节仅做提取，不做结构化处理';
        btn.appendChild(extractBadge);
      }

      var nameSpan = createEl('span', 'report-info-nav__name');
      nameSpan.textContent = sheet.sheetName || '未命名';
      btn.appendChild(nameSpan);

      li.appendChild(btn);
      listEl.appendChild(li);
      navButtons.push(btn);

      btn.addEventListener('click', function () {
        switchSheet(index);
      });
    });

    els.navContent.appendChild(listEl);
    updateActiveNav(currentSheetIndex);
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
    columns = columns.filter(function (col) { return col !== '章节'; });

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
        '<button class="link-btn" type="button" data-action="view" data-row-index="' + globalIndex + '">查看</button>' +
        '<button class="link-btn" type="button" data-action="edit" data-row-index="' + globalIndex + '">编辑</button>' +
        '<button class="link-btn danger" type="button" data-action="delete" data-row-index="' + globalIndex + '">删除</button>' +
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
    updateSheetDimension();
    renderSheetTitle();
    renderTable();
  }

  // ===== 更新当前 Sheet 维度/内容类型标签 =====
  function updateSheetDimension() {
    var sheet = getCurrentSheet();
    if (els.dimensionTag) {
      els.dimensionTag.textContent = (sheet && sheet.dimension) ? sheet.dimension : '';
    }
    if (els.contentTypeTag) {
      els.contentTypeTag.textContent = (sheet && sheet.contentType) ? sheet.contentType : '';
    }
  }

  // ===== 渲染当前章节小标题 =====
  function renderSheetTitle() {
    if (!els.sheetTitle) return;
    var sheet = getCurrentSheet();
    els.sheetTitle.textContent = (sheet && sheet.sheetName) ? sheet.sheetName : '未命名';
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

    if (els.exportLogBtn) {
      els.exportLogBtn.addEventListener('click', function () {
        window.showToast && window.showToast('日志导出中...');
      });
    }

    if (els.exportListBtn) {
      els.exportListBtn.addEventListener('click', function () {
        window.showToast && window.showToast('列表导出中...');
      });
    }

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
      var rowIndex = parseInt(btn.getAttribute('data-row-index'), 10);
      if (action === 'view' || action === 'edit') {
        openRecordModal(action, rowIndex);
      } else if (action === 'delete') {
        deleteRow(rowIndex);
      }
    });
  }

  // ===== 删除行 =====
  function deleteRow(rowIndex) {
    var row = getRowByFilteredIndex(rowIndex);
    if (!row) return;

    pendingDeleteRow = row;

    openConfirmModal('确认删除记录', '确定要删除这条记录吗？', doDeleteRow);
  }

  // ===== 执行删除 =====
  function doDeleteRow() {
    if (!pendingDeleteRow) return;

    var sheet = getCurrentSheet();
    var actualIndex = sheet.rows.indexOf(pendingDeleteRow);
    if (actualIndex === -1) return;

    sheet.rows.splice(actualIndex, 1);
    pendingDeleteRow = null;
    currentPage = 1;
    renderTable();
    if (window.showToast) window.showToast('删除成功');
  }

  // ===== 打开确认弹框 =====
  function openConfirmModal(title, body, callback) {
    if (els.confirmModalTitle) els.confirmModalTitle.textContent = title || '确认';
    if (els.confirmModalBody) els.confirmModalBody.textContent = body || '';
    confirmModalCallback = callback;
    if (els.confirmModalMask) els.confirmModalMask.classList.add('open');
  }

  // ===== 关闭确认弹框 =====
  function closeConfirmModal() {
    if (els.confirmModalMask) els.confirmModalMask.classList.remove('open');
    confirmModalCallback = null;
    pendingDeleteRow = null;
  }

  function getRowByFilteredIndex(rowIndex) {
    var rows = getFilteredRows();
    if (isNaN(rowIndex) || rowIndex < 0 || rowIndex >= rows.length) return null;
    return rows[rowIndex];
  }

  function getEditableColumns(columns) {
    var hasContentIndex = columns.indexOf('是否有内容');
    if (hasContentIndex === -1) return [];
    return columns.slice(hasContentIndex + 1);
  }

  function openRecordModal(mode, rowIndex) {
    var sheet = getCurrentSheet();
    if (!sheet) return;

    var columns = Array.isArray(sheet.columns) ? sheet.columns : [];
    var row;

    if (mode === 'add') {
      row = {};
      columns.forEach(function (col) {
        if (col === '章节') {
          row[col] = sheet.sheetName || '';
        } else if (col === '是否有内容') {
          row[col] = '是';
        } else {
          row[col] = '';
        }
      });
      editingRow = row;
      isAddingRow = true;
    } else {
      row = getRowByFilteredIndex(rowIndex);
      if (!row) return;
      editingRow = mode === 'edit' ? row : null;
      isAddingRow = false;
    }

    if (mode === 'add') {
      editableColumns = columns.filter(function (col) {
        return AUTO_FILL_COLUMNS.indexOf(col) === -1;
      });
    } else if (mode === 'edit') {
      editableColumns = getEditableColumns(columns);
    } else {
      editableColumns = [];
    }

    if (els.recordModalTitle) {
      if (mode === 'add') {
        els.recordModalTitle.textContent = '新增记录';
      } else {
        els.recordModalTitle.textContent = mode === 'edit' ? '编辑记录' : '查看记录';
      }
    }
    if (els.recordModalSaveBtn) {
      els.recordModalSaveBtn.hidden = mode === 'view';
      els.recordModalSaveBtn.style.display = mode === 'view' ? 'none' : '';
    }
    if (els.recordModalCancelBtn) {
      els.recordModalCancelBtn.textContent = mode === 'edit' || mode === 'add' ? '取消' : '关闭';
    }

    renderRecordModalFields(row, columns, mode);
    if (els.recordModalMask) els.recordModalMask.classList.add('open');
  }

  function getAddModalColumns(columns) {
    var ordered = ['报告期', '基金代码', '基金简称', '基金名称'];
    var front = [];
    var rest = columns.slice();
    ordered.forEach(function (col) {
      var idx = rest.indexOf(col);
      if (idx !== -1) {
        front.push(col);
        rest.splice(idx, 1);
      }
    });
    return front.concat(rest);
  }

  // ===== 根据基金代码回填新增弹框只读字段 =====
  function autoFillByFundCode(fundCode) {
    if (!editingRow) return;
    var matched = findRowByFundCode(fundCode);
    if (!matched) {
      window.showToast && window.showToast('未找到该基金代码对应记录');
      return;
    }

    AUTO_FILL_COLUMNS.forEach(function (col) {
      if (matched[col] === undefined) return;
      // 页面未选择报告期时，不预填报告名称
      if (col === '报告名称' && !(els.reportPeriod && els.reportPeriod.value)) {
        return;
      }
      editingRow[col] = matched[col];
      var displayEl = els.recordModalBody.querySelector('[data-autofill-col="' + col + '"]');
      if (displayEl) {
        var displayValue = formatCellValue(matched[col]);
        if (col === '公告发布日期') {
          displayValue = formatDate(matched[col]);
        }
        displayEl.textContent = displayValue;
      }
    });

    window.showToast && window.showToast('已回填基金信息');
  }

  function renderRecordModalFields(row, columns, mode) {
    if (!els.recordModalBody) return;
    els.recordModalBody.innerHTML = '';

    if (mode === 'add') {
      columns = getAddModalColumns(columns);
    }

    var sheet = getCurrentSheet();
    var grid = createEl('div', 'record-modal__grid');
    columns.forEach(function (col) {
      var value = formatCellValue(row[col]);
      var isEditable = (mode === 'edit' || mode === 'add') && editableColumns.indexOf(col) !== -1;
      var isWide = isLongTextColumn(col) || String(value).length > 60;
      var field = createEl('div', 'record-modal__field' + (isWide ? ' record-modal__field--wide' : ''));
      var label = createEl('label', 'record-modal__label');
      label.textContent = col;
      field.appendChild(label);

      if (isEditable) {
        var control;
        if (mode === 'add' && col === '基金代码') {
          var wrapper = createEl('div', 'record-modal__fund-code-tag-input');
          control = createEl('input', 'record-modal__control record-modal__fund-code-input');
          control.setAttribute('data-field', col);
          control.setAttribute('type', 'search');
          control.setAttribute('placeholder', '请输入基金代码搜索');
          control.value = value === '--' ? '' : value;

          var tagEl = createEl('div', 'record-modal__fund-code-tag');
          var tagText = createEl('span', 'record-modal__fund-code-tag-text');
          var tagClose = createEl('span', 'record-modal__fund-code-tag-close');
          tagClose.innerHTML = '×';
          tagClose.setAttribute('title', '清除');
          tagEl.appendChild(tagText);
          tagEl.appendChild(tagClose);
          tagEl.style.display = 'none';

          var dropdown = createEl('div', 'record-modal__fund-code-dropdown');
          dropdown.style.display = 'none';

          function clearFundCodeSelection() {
            control.value = '';
            tagEl.style.display = 'none';
            control.style.display = '';
            if (!editingRow) return;
            AUTO_FILL_COLUMNS.forEach(function (c) {
              editingRow[c] = '';
              var displayEl = els.recordModalBody.querySelector('[data-autofill-col="' + c + '"]');
              if (displayEl) displayEl.textContent = '--';
            });
          }

          function setFundCodeSelection(code) {
            control.value = code;
            tagText.textContent = code;
            tagEl.style.display = '';
            control.style.display = 'none';
            autoFillByFundCode(code);
          }

          if (control.value) {
            setFundCodeSelection(control.value);
          }

          tagClose.addEventListener('click', function (e) {
            e.stopPropagation();
            clearFundCodeSelection();
            control.focus();
          });

          wrapper.addEventListener('click', function (e) {
            if (tagEl.style.display !== 'none' && e.target !== tagClose && !dropdown.contains(e.target)) {
              clearFundCodeSelection();
              control.focus();
            }
          });

          function renderFundCodeDropdown() {
            dropdown.innerHTML = '';
            var options = getFundCodeOptions();
            if (options.length === 0) {
              var emptyItem = createEl('div', 'record-modal__fund-code-item record-modal__fund-code-item--empty');
              emptyItem.textContent = '暂无数据';
              dropdown.appendChild(emptyItem);
            } else {
              options.forEach(function (opt) {
                var item = createEl('div', 'record-modal__fund-code-item');
                item.innerHTML = '<span class="record-modal__fund-code-code">' + escapeHtml(String(opt.code)) + '</span>' +
                                 '<span class="record-modal__fund-code-name">' + escapeHtml(String(opt.name)) + '</span>';
                item.addEventListener('mousedown', function (e) {
                  e.preventDefault();
                  setFundCodeSelection(opt.code);
                  dropdown.style.display = 'none';
                });
                dropdown.appendChild(item);
              });
            }
          }

          control.addEventListener('focus', function () {
            renderFundCodeDropdown();
            dropdown.style.display = 'block';
          });

          control.addEventListener('blur', function () {
            setTimeout(function () {
              dropdown.style.display = 'none';
            }, 150);
          });

          control.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
              e.preventDefault();
              autoFillByFundCode(control.value);
              dropdown.style.display = 'none';
            }
          });

          wrapper.appendChild(control);
          wrapper.appendChild(tagEl);
          wrapper.appendChild(dropdown);
          field.appendChild(wrapper);
        } else if (mode === 'add' && col === '报告期') {
          control = createEl('select', 'record-modal__control');
          control.setAttribute('data-field', col);
          var emptyOption = createEl('option');
          emptyOption.value = '';
          emptyOption.textContent = '请选择';
          control.appendChild(emptyOption);
          var periods = [];
          if (sheet && Array.isArray(sheet.rows)) {
            sheet.rows.forEach(function (r) {
              var period = r['报告期'];
              if (period && String(period).trim() && periods.indexOf(period) === -1) {
                periods.push(period);
              }
            });
          }
          periods.forEach(function (period) {
            var option = createEl('option');
            option.value = period;
            option.textContent = period;
            if (String(value) === String(period)) option.selected = true;
            control.appendChild(option);
          });
          field.appendChild(control);
        } else if (mode === 'add' && col === '公告发布日期') {
          control = createEl('input', 'record-modal__control');
          control.setAttribute('data-field', col);
          control.setAttribute('type', 'date');
          control.value = value === '--' ? '' : formatDate(value);
          field.appendChild(control);
        } else if (mode === 'add' && col === '是否有内容') {
          control = createEl('select', 'record-modal__control');
          control.setAttribute('data-field', col);
          ['是', '否'].forEach(function (opt) {
            var option = createEl('option');
            option.value = opt;
            option.textContent = opt;
            if (String(value) === opt) option.selected = true;
            control.appendChild(option);
          });
          field.appendChild(control);
        } else {
          control = createEl(isWide ? 'textarea' : 'input', 'record-modal__control');
          control.setAttribute('data-field', col);
          if (!isWide) control.setAttribute('type', 'text');
          control.value = value === '--' ? '' : value;
          field.appendChild(control);
        }
      } else {
        var valueEl = createEl('div', 'record-modal__value');
        valueEl.textContent = value;
        if (mode === 'add' && AUTO_FILL_COLUMNS.indexOf(col) !== -1) {
          valueEl.setAttribute('data-autofill-col', col);
        }
        field.appendChild(valueEl);
      }

      grid.appendChild(field);
    });

    els.recordModalBody.appendChild(grid);
  }

  function closeRecordModal() {
    if (els.recordModalMask) els.recordModalMask.classList.remove('open');
    editingRow = null;
    isAddingRow = false;
    editableColumns = [];
  }

  function saveRecordModal() {
    if (!editingRow || !els.recordModalBody) return;
    els.recordModalBody.querySelectorAll('[data-field]').forEach(function (control) {
      var field = control.getAttribute('data-field');
      if (editableColumns.indexOf(field) !== -1) {
        editingRow[field] = control.value;
      }
    });

    if (isAddingRow) {
      var sheet = getCurrentSheet();
      if (sheet && Array.isArray(sheet.rows)) {
        sheet.rows.unshift(editingRow);
      }
      isAddingRow = false;
    }

    closeRecordModal();
    renderTable();
    window.showToast && window.showToast('记录已保存');
  }

  if (els.recordModalCloseX) els.recordModalCloseX.addEventListener('click', closeRecordModal);
  if (els.recordModalCancelBtn) els.recordModalCancelBtn.addEventListener('click', closeRecordModal);
  if (els.recordModalSaveBtn) els.recordModalSaveBtn.addEventListener('click', saveRecordModal);
  if (els.recordModalMask) {
    els.recordModalMask.addEventListener('click', function (e) {
      if (e.target === els.recordModalMask) closeRecordModal();
    });
  }

  if (els.addBtn) {
    els.addBtn.addEventListener('click', function () {
      openRecordModal('add');
    });
  }

  // ===== 确认弹框事件绑定 =====
  if (els.confirmModalCancelBtn) els.confirmModalCancelBtn.addEventListener('click', closeConfirmModal);
  if (els.confirmModalConfirmBtn) {
    els.confirmModalConfirmBtn.addEventListener('click', function () {
      if (typeof confirmModalCallback === 'function') {
        confirmModalCallback();
      }
      closeConfirmModal();
    });
  }
  if (els.confirmModalMask) {
    els.confirmModalMask.addEventListener('click', function (e) {
      if (e.target === els.confirmModalMask) closeConfirmModal();
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
