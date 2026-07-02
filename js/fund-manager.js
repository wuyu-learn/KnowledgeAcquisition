// fund-manager.js
// 基金管理人页面交互逻辑
(function () {
  'use strict';

  var data = Array.isArray(window.__FUND_MANAGER_DATA__)
    ? window.__FUND_MANAGER_DATA__
    : [];

  var currentPage = 1;
  var pageSize = 10;
  var currentFilterValue = '';
  var currentEndDate = '';
  var currentArea = '';
  var currentCompanyType = '';

  var els = {
    rows: document.getElementById('resultRows'),
    empty: document.getElementById('emptyState'),
    selectionInfo: document.getElementById('selectionInfo'),
    managerName: document.getElementById('managerName'),
    endDateSelect: document.getElementById('endDateSelect'),
    areaSelect: document.getElementById('areaSelect'),
    companyTypeSelect: document.getElementById('companyTypeSelect'),
    paginationTotal: document.getElementById('paginationTotal'),
    pageSizeSelect: document.getElementById('pageSizeSelect'),
    paginationNav: document.getElementById('paginationNav'),
    jumpInput: document.getElementById('jumpInput'),
    checkAll: document.getElementById('checkAll')
  };

  // ===== 通用工具 =====
  function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function formatValue(value) {
    if (value === undefined || value === null || value === '') return '--';
    return String(value);
  }

  function formatNumber(value) {
    if (value === undefined || value === null || value === '') return '--';
    var num = parseFloat(value);
    if (isNaN(num)) return '--';
    return num.toFixed(2);
  }

  function formatDate(value) {
    if (!value) return '--';
    var text = String(value).trim();
    if (!text) return '--';
    return text.split('T')[0];
  }

  // CSV 字段转义
  function escapeCsvField(value) {
    var text = String(value == null ? '' : value);
    if (/[",\n\r]/.test(text)) {
      return '"' + text.replace(/"/g, '""') + '"';
    }
    return text;
  }

  // ===== Toast 轻提示 =====
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

  // ===== 筛选数据 =====
  function getFilteredData() {
    var keyword = currentFilterValue.trim();
    var endDate = currentEndDate;
    var area = currentArea;
    var companyType = currentCompanyType;
    var result = data;

    if (keyword) {
      result = result.filter(function (item) {
        var name = String(item.INVESTADVISORNAME || '').toLowerCase();
        return name.indexOf(keyword.toLowerCase()) !== -1;
      });
    }

    if (endDate) {
      result = result.filter(function (item) {
        return formatDate(item.ENDDATE) === endDate;
      });
    }

    if (area) {
      result = result.filter(function (item) {
        return formatValue(item.AREACHINAME) === area;
      });
    }

    if (companyType) {
      result = result.filter(function (item) {
        return formatValue(item.COMPANYCVAL) === companyType;
      });
    }

    return result.slice().sort(function (a, b) {
      return (b.UNMSBFNV || 0) - (a.UNMSBFNV || 0);
    });
  }

  // 从下拉框字段中提取唯一值
  function extractUniqueValues(fieldName) {
    return data.reduce(function (acc, item) {
      var value = formatValue(item[fieldName]);
      if (value && value !== '--' && acc.indexOf(value) === -1) {
        acc.push(value);
      }
      return acc;
    }, []).sort();
  }

  // 渲染下拉框选项
  function renderSelectOptions(selectEl, values) {
    if (!selectEl) return;
    var html = '<option value="">全部</option>';
    values.forEach(function (value) {
      html += '<option value="' + escapeHtml(value) + '">' + escapeHtml(value) + '</option>';
    });
    selectEl.innerHTML = html;
  }

  // ===== 初始化筛选下拉框 =====
  function initFilterOptions() {
    renderSelectOptions(els.endDateSelect, extractUniqueValues('ENDDATE').map(formatDate));
    renderSelectOptions(els.areaSelect, extractUniqueValues('AREACHINAME'));
    renderSelectOptions(els.companyTypeSelect, extractUniqueValues('COMPANYCVAL'));
  }

  // ===== 分页数据 =====
  function getPaginationData() {
    var rows = getFilteredData();
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

  // ===== 渲染分页 =====
  function renderPagination() {
    if (!els.paginationNav || !els.paginationTotal) return;

    var data = getPaginationData();
    if (els.paginationTotal) els.paginationTotal.textContent = data.total;
    if (els.jumpInput) {
      els.jumpInput.value = '';
      els.jumpInput.max = data.totalPages;
    }

    els.paginationNav.innerHTML = '';

    // 上一页
    var prevBtn = document.createElement('button');
    prevBtn.className = 'page-btn page-btn-prev';
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
      var pageBtn = document.createElement('button');
      pageBtn.className = 'page-btn';
      pageBtn.setAttribute('type', 'button');
      pageBtn.setAttribute('data-page', String(p));
      pageBtn.textContent = String(p);
      if (p === data.page) pageBtn.classList.add('active');
      els.paginationNav.appendChild(pageBtn);
    }

    // 下一页
    var nextBtn = document.createElement('button');
    nextBtn.className = 'page-btn page-btn-next';
    nextBtn.setAttribute('type', 'button');
    nextBtn.setAttribute('data-page', 'next');
    nextBtn.setAttribute('title', '下一页');
    nextBtn.textContent = '›';
    nextBtn.disabled = data.page >= data.totalPages;
    els.paginationNav.appendChild(nextBtn);
  }

  // ===== 渲染表格 =====
  function renderRows() {
    if (!els.rows) return;

    var result = getPaginationData();
    var rows = result.rows;

    if (els.checkAll) els.checkAll.checked = false;
    els.rows.innerHTML = '';

    if (els.empty) els.empty.hidden = rows.length > 0;
    updateSelectionInfo();

    rows.forEach(function (item, index) {
      var tr = document.createElement('tr');
      var globalIndex = result.start + index;
      tr.innerHTML =
        '<td class="check-col"><input type="checkbox" data-check="' + globalIndex + '" aria-label="选择"></td>' +
        '<td class="col-index">' + (globalIndex + 1) + '</td>' +
        '<td class="knowledge-col" title="' + escapeHtml(formatValue(item.INVESTADVISORNAME)) + '">' +
        escapeHtml(formatValue(item.INVESTADVISORNAME)) + '</td>' +
        '<td class="col-abbr" title="' + escapeHtml(formatValue(item.ABBRINVESTADVISORNAME)) + '">' +
        escapeHtml(formatValue(item.ABBRINVESTADVISORNAME)) + '</td>' +
        '<td class="col-area">' + escapeHtml(formatValue(item.AREACHINAME)) + '</td>' +
        '<td class="col-type">' + escapeHtml(formatValue(item.COMPANYCVAL)) + '</td>' +
        '<td class="col-amount">' + escapeHtml(formatNumber(item.UNMSBFNV)) + '</td>' +
        '<td class="col-rank">' + escapeHtml(formatValue(item.UNMSBFNVRANK)) + '</td>' +
        '<td class="time-col">' + escapeHtml(formatDate(item.ENDDATE)) + '</td>';
      els.rows.appendChild(tr);
    });

    renderPagination();
  }

  // ===== 全选/取消全选 =====
  function bindCheckAll() {
    if (!els.checkAll || !els.rows) return;
    els.checkAll.addEventListener('change', function () {
      var checked = els.checkAll.checked;
      els.rows.querySelectorAll('[data-check]').forEach(function (box) {
        box.checked = checked;
      });
      updateSelectionInfo();
    });

    els.rows.addEventListener('change', function (e) {
      if (e.target.matches('[data-check]')) {
        if (!e.target.checked) els.checkAll.checked = false;
        updateSelectionInfo();
      }
    });
  }

  function updateSelectionInfo() {
    if (!els.selectionInfo || !els.rows) return;
    var count = els.rows.querySelectorAll('[data-check]:checked').length;
    els.selectionInfo.textContent = '已选择 ' + count + ' 条';
  }

  // ===== 导出列表 =====
  function exportList() {
    var rows = getFilteredData();
    if (!rows.length) {
      if (window.showToast) window.showToast('当前没有可导出的数据');
      return;
    }

    var headers = ['序号', '管理人名称', '管理人简称', '地区', '公司类型', '非货规模(亿)', '非货规模排名', '截止日期'];
    var lines = [headers.map(escapeCsvField).join(',')];

    rows.forEach(function (item, index) {
      var line = [
        index + 1,
        formatValue(item.INVESTADVISORNAME),
        formatValue(item.ABBRINVESTADVISORNAME),
        formatValue(item.AREACHINAME),
        formatValue(item.COMPANYCVAL),
        formatNumber(item.UNMSBFNV),
        formatValue(item.UNMSBFNVRANK),
        formatDate(item.ENDDATE)
      ].map(escapeCsvField).join(',');
      lines.push(line);
    });

    var bom = '﻿';
    var csvContent = bom + lines.join('\r\n');
    var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    var timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');

    link.href = url;
    link.download = '基金管理人列表_' + timestamp + '.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    if (window.showToast) window.showToast('列表导出成功');
  }

  // ===== 绑定筛选/分页事件 =====
  function bindEvents() {
    var searchBtn = document.getElementById('searchBtn');
    var resetBtn = document.getElementById('resetBtn');
    var refreshBtn = document.getElementById('refreshBtn');
    var exportBtn = document.getElementById('exportBtn');

    if (searchBtn) {
      searchBtn.addEventListener('click', function () {
        currentFilterValue = els.managerName ? els.managerName.value : '';
        currentEndDate = els.endDateSelect ? els.endDateSelect.value : '';
        currentArea = els.areaSelect ? els.areaSelect.value : '';
        currentCompanyType = els.companyTypeSelect ? els.companyTypeSelect.value : '';
        currentPage = 1;
        renderRows();
        if (window.showToast) window.showToast('查询条件已提交');
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        if (els.managerName) els.managerName.value = '';
        if (els.endDateSelect) els.endDateSelect.value = '';
        if (els.areaSelect) els.areaSelect.value = '';
        if (els.companyTypeSelect) els.companyTypeSelect.value = '';
        currentFilterValue = '';
        currentEndDate = '';
        currentArea = '';
        currentCompanyType = '';
        currentPage = 1;
        renderRows();
        if (window.showToast) window.showToast('筛选条件已重置');
      });
    }

    if (refreshBtn) {
      refreshBtn.addEventListener('click', function () {
        renderRows();
        if (window.showToast) window.showToast('列表已刷新');
      });
    }

    if (exportBtn) {
      exportBtn.addEventListener('click', function () {
        exportList();
      });
    }

    if (els.endDateSelect) {
      els.endDateSelect.addEventListener('change', function () {
        currentEndDate = els.endDateSelect.value;
        currentPage = 1;
        renderRows();
      });
    }

    if (els.areaSelect) {
      els.areaSelect.addEventListener('change', function () {
        currentArea = els.areaSelect.value;
        currentPage = 1;
        renderRows();
      });
    }

    if (els.companyTypeSelect) {
      els.companyTypeSelect.addEventListener('change', function () {
        currentCompanyType = els.companyTypeSelect.value;
        currentPage = 1;
        renderRows();
      });
    }

    if (els.pageSizeSelect) {
      els.pageSizeSelect.addEventListener('change', function () {
        pageSize = parseInt(els.pageSizeSelect.value, 10) || 10;
        currentPage = 1;
        renderRows();
      });
    }

    if (els.paginationNav) {
      els.paginationNav.addEventListener('click', function (e) {
        var btn = e.target.closest('.page-btn');
        if (!btn || btn.disabled) return;

        var page = btn.getAttribute('data-page');
        var result = getPaginationData();

        if (page === 'prev') {
          if (currentPage > 1) currentPage--;
        } else if (page === 'next') {
          if (currentPage < result.totalPages) currentPage++;
        } else {
          currentPage = parseInt(page, 10) || 1;
        }

        renderRows();
      });
    }

    if (els.jumpInput) {
      els.jumpInput.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter') return;
        var result = getPaginationData();
        var page = parseInt(els.jumpInput.value, 10);
        if (page >= 1 && page <= result.totalPages) {
          currentPage = page;
          renderRows();
        }
      });
    }
  }

  // ===== 初始化 =====
  initFilterOptions();
  bindCheckAll();
  bindEvents();
  renderRows();
})();
