// app.js
// 页面交互逻辑
(function () {
  'use strict';

  var results = Array.isArray(window.__EXTRACT_RESULTS__) ? window.__EXTRACT_RESULTS__ : [];
  var knowledgeTypeMap = window.__KNOWLEDGE_TYPE_MAP__ || {};
  var eventLabelMap = window.__LOG_EVENT_LABEL_MAP__ || {};
  var scheduledTasks = Array.isArray(window.__SCHEDULED_TASKS__) ? window.__SCHEDULED_TASKS__ : [];
  var currentYear = new Date().getFullYear();
  var currentMonth = new Date().getMonth() + 1;

  var runningTask = null;
  var taskTimer = null;

  var els = {
    rows: document.getElementById('resultRows'),
    empty: document.getElementById('emptyState'),
    selectionInfo: document.getElementById('selectionInfo'),
    reportType: document.getElementById('reportType'),
    reportPeriod: document.getElementById('reportPeriod'),
    knowledgeType: document.getElementById('knowledgeType'),
    paginationTotal: document.getElementById('paginationTotal'),
    logModalMask: document.getElementById('logModalMask'),
    logModalBody: document.getElementById('logModalBody'),
    closeLogModalX: document.getElementById('closeLogModalX'),
    closeLogModalBtn: document.getElementById('closeLogModalBtn'),
    batchLogModalMask: document.getElementById('batchLogModalMask'),
    batchLogModalBody: document.getElementById('batchLogModalBody'),
    closeBatchLogModalX: document.getElementById('closeBatchLogModalX'),
    closeBatchLogModalBtn: document.getElementById('closeBatchLogModalBtn'),
    scheduleModalMask: document.getElementById('scheduleModalMask'),
    scheduleModalBody: document.getElementById('scheduleModalBody'),
    closeScheduleModalX: document.getElementById('closeScheduleModalX'),
    cancelScheduleBtn: document.getElementById('cancelScheduleBtn'),
    saveScheduleBtn: document.getElementById('saveScheduleBtn'),
    taskPanel: document.getElementById('taskPanel'),
    taskReportType: document.getElementById('taskReportType'),
    taskReportPeriod: document.getElementById('taskReportPeriod'),
    taskProcessed: document.getElementById('taskProcessed'),
    taskTotal: document.getElementById('taskTotal'),
    taskPercent: document.getElementById('taskPercent'),
    taskProgressFill: document.getElementById('taskProgressFill'),
    taskElapsed: document.getElementById('taskElapsed'),
    taskRemaining: document.getElementById('taskRemaining'),
    taskQueueCount: document.getElementById('taskQueueCount'),
    taskDetailBtn: document.getElementById('taskDetailBtn'),
    taskCancelBtn: document.getElementById('taskCancelBtn')
  };

  // ===== 顶栏/标签栏吸顶效果 =====
  function initSticky(el, className, threshold) {
    if (!el) return;
    threshold = threshold || 8;
    var ticking = false;
    function update() {
      ticking = false;
      el.classList.toggle(className, window.scrollY > threshold);
    }
    function onScroll() {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    update();
  }

  initSticky(document.querySelector('.top-nav'), 'is-scrolled');
  initSticky(document.getElementById('tabBar'), 'is-scrolled');

  // ===== 系统标签栏点击/关闭 =====
  (function initTabBar() {
    var tabBar = document.getElementById('tabBar');
    if (!tabBar) return;
    tabBar.addEventListener('click', function (e) {
      var close = e.target.closest('.tab-close-icon');
      if (close) {
        e.stopPropagation();
        var card = close.closest('.dynamic-tab-item');
        if (card) card.style.display = 'none';
        return;
      }
      var card = e.target.closest('.dynamic-tab-item');
      if (!card) return;
      tabBar.querySelectorAll('.dynamic-tab-item').forEach(function (c) {
        c.classList.remove('active');
      });
      card.classList.add('active');
    });
  })();

  // ===== Toast 轻提示 =====
  window.showToast = function (message) {
    var toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(function () {
      toast.classList.remove('show');
    }, 2500);
  };

  // ===== 绑定按钮点击 =====
  function bindClick(id, handler) {
    var el = document.getElementById(id);
    if (el) el.addEventListener('click', handler);
  }

  bindClick('refreshBtn', function () {
    renderRows();
    showToast('列表已刷新');
  });

  bindClick('searchBtn', function () {
    renderRows();
    showToast('查询条件已提交');
  });

  bindClick('scheduleBtn', function () {
    openScheduleModal();
  });

  bindClick('resetBtn', function () {
    document.querySelectorAll('.filters input, .filters select').forEach(function (el) {
      if (el.tagName === 'SELECT') {
        el.selectedIndex = 0;
      } else if (el.type === 'checkbox') {
        el.checked = false;
      } else {
        el.value = '';
      }
    });
    renderRows();
    showToast('筛选条件已重置');
  });

  bindClick('exportLogBtn', function () {
    showToast('操作日志导出中...');
  });

  bindClick('batchExportBtn', function () {
    showToast('批量导出中...');
  });

  bindClick('batchLogBtn', function () {
    openBatchLogModal();
  });

  // ===== 生成报告期下拉选项（近5年，按时间倒序平铺） =====
  function initReportPeriodOptions() {
    if (!els.reportPeriod) return;

    var yearShort = function (year) { return String(year).slice(-2); };
    var items = [];

    function addItem(year, month, priority, value, label) {
      // 当年份为当前年份时，过滤掉未到报告期末月份的项
      if (year === currentYear && month > currentMonth) return;
      items.push({ year: year, month: month, priority: priority, value: value, label: label });
    }

    // 季度报告：当前年份往前 4 年，共 5 年
    for (var y = currentYear - 4; y <= currentYear; y++) {
      addItem(y, 3,  1, 'quarterly-' + y + '-Q1', yearShort(y) + '年1季报');
      addItem(y, 6,  1, 'quarterly-' + y + '-Q2', yearShort(y) + '年2季报');
      addItem(y, 9,  1, 'quarterly-' + y + '-Q3', yearShort(y) + '年3季报');
      addItem(y, 12, 1, 'quarterly-' + y + '-Q4', yearShort(y) + '年4季报');
    }

    // 中期报告：当前年份往前 4 年，共 5 年
    for (var y2 = currentYear - 4; y2 <= currentYear; y2++) {
      addItem(y2, 6, 2, 'semiAnnual-' + y2, yearShort(y2) + '年中报');
    }

    // 年度报告：当前年份往前 5 年至前 1 年，共 5 年
    for (var y3 = currentYear - 5; y3 < currentYear; y3++) {
      addItem(y3, 12, 3, 'annual-' + y3, yearShort(y3) + '年年报');
    }

    // 按时间倒序排列；同期末月份时，披露更晚的中报/年报排在季报前面
    items.sort(function (a, b) {
      if (b.year !== a.year) return b.year - a.year;
      if (b.month !== a.month) return b.month - a.month;
      return b.priority - a.priority;
    });

    els.reportPeriod.innerHTML = '<option value="">全部报告期</option>';
    items.forEach(function (opt) {
      var option = document.createElement('option');
      option.value = opt.value;
      option.textContent = opt.label;
      els.reportPeriod.appendChild(option);
    });
  }

  // ===== 数据筛选 =====
  function getFilteredData() {
    var reportType = els.reportType ? els.reportType.value : '';
    var reportPeriod = els.reportPeriod ? els.reportPeriod.value : '';
    var knowledgeType = els.knowledgeType ? els.knowledgeType.value : '';

    return results.filter(function (item) {
      if (reportType && item.reportType !== reportType) return false;
      if (reportPeriod && item.reportPeriodKey !== reportPeriod) return false;
      if (knowledgeType && item.knowledgeTypeKey !== knowledgeType) return false;
      return true;
    }).sort(function (a, b) {
      var t1 = Date.parse((a.lastModifyTime || '').replace(' ', 'T')) || 0;
      var t2 = Date.parse((b.lastModifyTime || '').replace(' ', 'T')) || 0;
      return t2 - t1;
    });
  }

  // ===== 渲染表格 =====
  function renderRows() {
    var data = getFilteredData();
    if (!els.rows) return;

    var checkAll = document.getElementById('checkAll');
    if (checkAll) checkAll.checked = false;

    els.rows.innerHTML = '';
    if (els.empty) els.empty.hidden = data.length > 0;
    if (els.paginationTotal) els.paginationTotal.textContent = data.length;
    updateSelectionInfo();

    data.forEach(function (item, index) {
      var tr = document.createElement('tr');
      var knowledgeText = item.knowledgeTypeName || knowledgeTypeMap[item.knowledgeTypeKey] || '';
      var periodText = item.reportPeriodLabel || '';
      var createTime = item.createTime || '--';
      var lastModifyTime = item.lastModifyTime || '--';
      var operator = item.operator || '系统';
      var statusClass = item.status === 'failed' ? 'red' : 'green';
      var statusText = item.statusLabel || (item.status === 'failed' ? '提取失败' : '提取成功');
      tr.innerHTML =
        '<td class="check-col"><input type="checkbox" data-check="' + escapeHtml(item.id) + '" aria-label="选择"></td>' +
        '<td class="col-index">' + (index + 1) + '</td>' +
        '<td class="type-col">' + escapeHtml(item.reportType || '') + '</td>' +
        '<td class="knowledge-col" title="' + escapeHtml(knowledgeText) + '"' +
        '>' + escapeHtml(knowledgeText) + '</td>' +
        '<td class="period-col">' + escapeHtml(periodText) + '</td>' +
        '<td class="status-col"><span class="tag ' + statusClass + '">' + escapeHtml(statusText) + '</span></td>' +
        '<td class="time-col">' + escapeHtml(createTime) + '</td>' +
        '<td class="time-col">' + escapeHtml(lastModifyTime) + '</td>' +
        '<td class="operator-col">' + escapeHtml(operator) + '</td>' +
        '<td class="sticky-right">' +
          '<div class="row-actions">' +
            '<button class="link-btn" data-action="download" data-id="' + escapeHtml(item.id) + '">下载</button>' +
            '<button class="link-btn danger" data-action="delete" data-id="' + escapeHtml(item.id) + '">删除</button>' +
            '<button class="link-btn" data-action="log" data-id="' + escapeHtml(item.id) + '">日志</button>' +
            '<button class="link-btn" data-action="retry" data-id="' + escapeHtml(item.id) + '">重试</button>' +
          '</div>' +
        '</td>';
      els.rows.appendChild(tr);
    });

    bindRowActions();
  }

  // ===== 行内按钮事件绑定 =====
  function bindRowActions() {
    if (!els.rows) return;
    els.rows.querySelectorAll('[data-action="log"]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        openLogModal(btn.dataset.id);
      });
    });
    els.rows.querySelectorAll('[data-action="retry"]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.dataset.id;
        var item = results.find(function (r) { return String(r.id) === String(id); });
        if (!item) return;
        startRunningTask(item);
      });
    });
  }

  // ===== 正在执行任务面板 =====
  function startRunningTask(item) {
    if (runningTask && runningTask.status === 'running') return;

    runningTask = {
      id: item.id,
      reportType: item.reportType || '',
      reportPeriodLabel: item.reportPeriodLabel || '',
      total: 120,
      processed: 0,
      progress: 0,
      elapsed: 0,
      remaining: '计算中',
      queueCount: 2,
      status: 'running'
    };

    showTaskPanel();
    updateTaskPanelUI();

    if (taskTimer) clearInterval(taskTimer);
    taskTimer = setInterval(function () {
      tickRunningTask();
    }, 200);
  }

  function tickRunningTask() {
    if (!runningTask || runningTask.status !== 'running') return;

    runningTask.progress += 2;
    if (runningTask.progress > 100) runningTask.progress = 100;
    runningTask.processed = Math.floor(runningTask.total * runningTask.progress / 100);
    runningTask.elapsed += 0.2;

    if (runningTask.progress > 5) {
      var rate = runningTask.elapsed / runningTask.progress;
      var remainingSeconds = rate * (100 - runningTask.progress);
      runningTask.remaining = formatDuration(remainingSeconds);
    } else {
      runningTask.remaining = '计算中';
    }

    updateTaskPanelUI();

    if (runningTask.progress >= 100) {
      completeRunningTask();
    }
  }

  function completeRunningTask() {
    if (taskTimer) clearInterval(taskTimer);
    if (!runningTask) return;

    runningTask.status = 'success';
    runningTask.remaining = '0分00秒';
    updateTaskPanelUI();

    // 更新结果列表中对应任务状态
    var item = results.find(function (r) { return String(r.id) === String(runningTask.id); });
    if (item) {
      item.status = 'success';
      item.statusLabel = '提取成功';
    }

    setTimeout(function () {
      hideTaskPanel();
      renderRows();
      runningTask = null;
    }, 800);
  }

  function cancelRunningTask() {
    if (taskTimer) clearInterval(taskTimer);
    if (!runningTask) return;

    runningTask.status = 'failed';
    hideTaskPanel();
    runningTask = null;
  }

  function showTaskPanel() {
    if (els.taskPanel) els.taskPanel.classList.add('is-visible');
  }

  function hideTaskPanel() {
    if (els.taskPanel) els.taskPanel.classList.remove('is-visible');
  }

  function updateTaskPanelUI() {
    if (!runningTask) return;
    if (els.taskReportType) els.taskReportType.textContent = runningTask.reportType;
    if (els.taskReportPeriod) els.taskReportPeriod.textContent = runningTask.reportPeriodLabel;
    if (els.taskProcessed) els.taskProcessed.textContent = runningTask.processed;
    if (els.taskTotal) els.taskTotal.textContent = runningTask.total;
    if (els.taskPercent) els.taskPercent.textContent = runningTask.progress + '%';
    if (els.taskProgressFill) els.taskProgressFill.style.width = runningTask.progress + '%';
    if (els.taskElapsed) els.taskElapsed.textContent = formatDuration(runningTask.elapsed);
    if (els.taskRemaining) els.taskRemaining.textContent = runningTask.remaining;
    if (els.taskQueueCount) els.taskQueueCount.textContent = runningTask.queueCount;
  }

  function formatDuration(seconds) {
    seconds = Math.max(0, Math.floor(seconds));
    var m = Math.floor(seconds / 60);
    var s = seconds % 60;
    return m + '分' + (s < 10 ? '0' : '') + s + '秒';
  }

  if (els.taskDetailBtn) {
    els.taskDetailBtn.addEventListener('click', function () {
      if (!runningTask) return;
      openLogModal(runningTask.id);
    });
  }
  if (els.taskCancelBtn) {
    els.taskCancelBtn.addEventListener('click', cancelRunningTask);
  }

  // ===== 操作日志弹框 =====
  function openLogModal(id) {
    var item = results.find(function (r) { return String(r.id) === String(id); });
    var logs = item && Array.isArray(item.logs) ? item.logs : [];
    renderLogs(logs);
    if (els.logModalMask) els.logModalMask.classList.add('open');
  }

  function closeLogModal() {
    if (els.logModalMask) els.logModalMask.classList.remove('open');
  }

  function renderLogs(logs) {
    if (!els.logModalBody) return;
    els.logModalBody.innerHTML = '';
    if (!logs.length) {
      els.logModalBody.innerHTML = '<tr><td colspan="4" class="empty">暂无操作日志</td></tr>';
      return;
    }

    var statusMap = { success: '成功', failed: '失败', running: '运行中' };

    logs.forEach(function (log) {
      var tr = document.createElement('tr');
      var eventLabel = eventLabelMap[log.event] || log.event || '';
      var showStatus = log.event === 'ai_extract_completed';
      var statusText = showStatus ? (statusMap[log.status] || log.status || '') : '--';
      var statusClass = log.status === 'success' ? 'green' : (log.status === 'failed' ? 'red' : 'cyan');
      tr.innerHTML =
        '<td>' + escapeHtml(log.time || '') + '</td>' +
        '<td>' + escapeHtml(log.operator || '') + '</td>' +
        '<td><span class="tag gold">' + escapeHtml(eventLabel) + '</span></td>' +
        '<td>' + (showStatus ? '<span class="tag ' + statusClass + '"' : '') +
        (showStatus ? '>' + escapeHtml(statusText) + '</span>' : escapeHtml(statusText)) + '</td>';
      els.logModalBody.appendChild(tr);
    });
  }

  if (els.logModalMask) {
    els.logModalMask.addEventListener('click', function (e) {
      if (e.target === els.logModalMask) closeLogModal();
    });
  }
  if (els.closeLogModalX) els.closeLogModalX.addEventListener('click', closeLogModal);
  if (els.closeLogModalBtn) els.closeLogModalBtn.addEventListener('click', closeLogModal);

  // ===== 批量查询日志弹框 =====
  function openBatchLogModal() {
    if (!els.rows) return;
    var selectedIds = Array.from(els.rows.querySelectorAll('[data-check]:checked')).map(function (box) {
      return box.dataset.check;
    });
    renderBatchLogs(selectedIds);
    if (els.batchLogModalMask) els.batchLogModalMask.classList.add('open');
  }

  function closeBatchLogModal() {
    if (els.batchLogModalMask) els.batchLogModalMask.classList.remove('open');
  }

  function renderBatchLogs(selectedIds) {
    if (!els.batchLogModalBody) return;
    els.batchLogModalBody.innerHTML = '';

    var index = 0;
    selectedIds.forEach(function (id) {
      var item = results.find(function (r) { return String(r.id) === String(id); });
      if (!item || !Array.isArray(item.logs)) return;
      var knowledgeText = item.knowledgeTypeName || knowledgeTypeMap[item.knowledgeTypeKey] || '';
      item.logs.forEach(function (log) {
        index++;
        var eventLabel = eventLabelMap[log.event] || log.event || '';
        var tr = document.createElement('tr');
        tr.innerHTML =
          '<td>' + index + '</td>' +
          '<td>' + escapeHtml(item.reportType || '') + '</td>' +
          '<td title="' + escapeHtml(knowledgeText) + '">' + escapeHtml(knowledgeText) + '</td>' +
          '<td>' + escapeHtml(item.reportPeriodLabel || '') + '</td>' +
          '<td>' + escapeHtml(item.operator || '') + '</td>' +
          '<td>' + escapeHtml(log.time || '') + '</td>' +
          '<td><span class="tag gold">' + escapeHtml(eventLabel) + '</span></td>';
        els.batchLogModalBody.appendChild(tr);
      });
    });

    if (index === 0) {
      els.batchLogModalBody.innerHTML = '<tr><td colspan="7" class="empty">暂无操作日志</td></tr>';
    }
  }

  if (els.batchLogModalMask) {
    els.batchLogModalMask.addEventListener('click', function (e) {
      if (e.target === els.batchLogModalMask) closeBatchLogModal();
    });
  }
  if (els.closeBatchLogModalX) els.closeBatchLogModalX.addEventListener('click', closeBatchLogModal);
  if (els.closeBatchLogModalBtn) els.closeBatchLogModalBtn.addEventListener('click', closeBatchLogModal);

  // ===== 定时任务配置弹框 =====
  function openScheduleModal() {
    renderScheduleTasks();
    if (els.scheduleModalMask) els.scheduleModalMask.classList.add('open');
  }

  function closeScheduleModal() {
    if (els.scheduleModalMask) els.scheduleModalMask.classList.remove('open');
  }

  function renderScheduleTasks() {
    if (!els.scheduleModalBody) return;
    els.scheduleModalBody.innerHTML = '';

    if (!scheduledTasks.length) {
      els.scheduleModalBody.innerHTML = '<tr><td colspan="4" class="empty">暂无待执行定时任务</td></tr>';
      return;
    }

    scheduledTasks.forEach(function (task, index) {
      var tr = document.createElement('tr');
      tr.dataset.taskId = task.id;
      tr.innerHTML =
        '<td>' + escapeHtml(task.reportType || '') + '</td>' +
        '<td>' + escapeHtml(task.reportPeriodLabel || '') + '</td>' +
        '<td>' +
          '<label class="switch">' +
            '<input type="checkbox" class="schedule-enabled" ' + (task.enabled ? 'checked' : '') + '>' +
            '<span class="slider"></span>' +
          '</label>' +
        '</td>' +
        '<td><input type="datetime-local" class="schedule-time" value="' + escapeHtml(task.executeTime || '') + '" ' + (task.enabled ? '' : 'disabled') + '></td>';
      els.scheduleModalBody.appendChild(tr);
    });

    // 启用/停用联动控制执行时间输入框
    els.scheduleModalBody.querySelectorAll('.schedule-enabled').forEach(function (checkbox) {
      checkbox.addEventListener('change', function () {
        var timeInput = checkbox.closest('tr').querySelector('.schedule-time');
        if (timeInput) timeInput.disabled = !checkbox.checked;
      });
    });
  }

  function saveScheduleTasks() {
    var rows = els.scheduleModalBody ? els.scheduleModalBody.querySelectorAll('tr[data-task-id]') : [];
    rows.forEach(function (row) {
      var taskId = row.dataset.taskId;
      var task = scheduledTasks.find(function (t) { return String(t.id) === String(taskId); });
      if (!task) return;
      var enabledCheckbox = row.querySelector('.schedule-enabled');
      var timeInput = row.querySelector('.schedule-time');
      if (enabledCheckbox) task.enabled = enabledCheckbox.checked;
      if (timeInput) task.executeTime = timeInput.value;
    });
    showToast('定时任务配置已保存');
    closeScheduleModal();
  }

  if (els.scheduleModalMask) {
    els.scheduleModalMask.addEventListener('click', function (e) {
      if (e.target === els.scheduleModalMask) closeScheduleModal();
    });
  }
  if (els.closeScheduleModalX) els.closeScheduleModalX.addEventListener('click', closeScheduleModal);
  if (els.cancelScheduleBtn) els.cancelScheduleBtn.addEventListener('click', closeScheduleModal);
  if (els.saveScheduleBtn) els.saveScheduleBtn.addEventListener('click', saveScheduleTasks);

  function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // 全选/取消全选
  (function bindCheckAll() {
    var checkAll = document.getElementById('checkAll');
    if (!checkAll || !els.rows) return;
    checkAll.addEventListener('change', function () {
      var checked = checkAll.checked;
      els.rows.querySelectorAll('[data-check]').forEach(function (box) {
        box.checked = checked;
      });
      updateSelectionInfo();
    });

    els.rows.addEventListener('change', function (e) {
      if (e.target.matches('[data-check]')) {
        if (!e.target.checked) checkAll.checked = false;
        updateSelectionInfo();
      }
    });
  })();

  function updateSelectionInfo() {
    if (!els.selectionInfo || !els.rows) return;
    var count = els.rows.querySelectorAll('[data-check]:checked').length;
    els.selectionInfo.textContent = '已选择 ' + count + ' 条';

    var batchExportBtn = document.getElementById('batchExportBtn');
    var batchLogBtn = document.getElementById('batchLogBtn');
    if (batchExportBtn) batchExportBtn.disabled = count < 2;
    if (batchLogBtn) batchLogBtn.disabled = count < 2;
  }

  // 初始化
  initReportPeriodOptions();
  renderRows();
})();
