// data.js
// 提取结果演示数据
window.__EXTRACT_RESULTS__ = [
  {
    id: '1',
    reportType: '中期报告',
    reportPeriodKey: 'semiAnnual-2026',
    reportPeriodLabel: '26年中报',
    status: 'success',
    statusLabel: '提取成功',
    knowledgeTypeKey: '1',
    knowledgeTypeName: '基金管理人及其管理基金的经验',
    createTime: '2026-06-28 09:00:00',
    lastModifyTime: '2026-06-28 09:05:32',
    operator: '系统',
    logs: [
      { time: '2026-07-01 17:22', operator: '系统', event: 'task_created', status: 'success' },
      { time: '2026-07-01 17:23', operator: '系统', event: 'ai_extract_completed', status: 'success' }
    ]
  },
  {
    id: '2',
    reportType: '中期报告',
    reportPeriodKey: 'semiAnnual-2026',
    reportPeriodLabel: '26年中报',
    status: 'success',
    statusLabel: '提取成功',
    knowledgeTypeKey: '2',
    knowledgeTypeName: '期末兼任私募资产管理计划投资经理的基金经理同时管理的产品情况',
    createTime: '2026-06-28 10:00:00',
    lastModifyTime: '2026-06-28 10:05:32',
    operator: '系统',
    logs: [
      { time: '2026-07-01 18:22', operator: '系统', event: 'task_created', status: 'success' },
      { time: '2026-07-01 18:23', operator: '系统', event: 'ai_extract_completed', status: 'success' }
    ]
  },
  {
    id: '3',
    reportType: '中期报告',
    reportPeriodKey: 'semiAnnual-2026',
    reportPeriodLabel: '26年中报',
    status: 'failed',
    statusLabel: '提取失败',
    knowledgeTypeKey: '3',
    knowledgeTypeName: '报告期内管理人对本基金持有人数或基金资产净值预警情形的说明',
    createTime: '2026-06-28 11:00:00',
    lastModifyTime: '2026-06-28 11:05:32',
    operator: '系统',
    logs: [
      { time: '2026-07-01 19:22', operator: '系统', event: 'task_created', status: 'success' },
      { time: '2026-07-01 19:23', operator: '系统', event: 'ai_extract_completed', status: 'failed' }
    ]
  },
  {
    id: '4',
    reportType: '中期报告',
    reportPeriodKey: 'semiAnnual-2026',
    reportPeriodLabel: '26年中报',
    status: 'canceled',
    statusLabel: '已取消',
    knowledgeTypeKey: '7',
    knowledgeTypeName: '管理人受调查或处罚等情况',
    createTime: '2026-07-01 20:00:00',
    lastModifyTime: '2026-07-01 20:02:18',
    operator: '系统',
    logs: [
      { time: '2026-07-01 20:00', operator: '系统', event: 'task_created', status: 'success' },
      { time: '2026-07-01 20:02', operator: '业务用户', event: 'task_canceled', status: 'canceled' }
    ]
  },
  {
    id: '5',
    reportType: '中期报告',
    reportPeriodKey: 'semiAnnual-2026',
    reportPeriodLabel: '26年中报',
    status: 'running',
    statusLabel: '执行中',
    taskTotal: 1000,
    taskProcessed: 350,
    taskElapsed: 42,
    taskDuration: 120,
    knowledgeTypeKey: '4',
    knowledgeTypeName: '盈利投资者数量占比',
    createTime: '2026-07-02 09:30:00',
    lastModifyTime: '2026-07-02 09:34:12',
    operator: '系统',
    logs: [
      { time: '2026-07-02 09:30', operator: '系统', event: 'task_created', status: 'success' },
      { time: '2026-07-02 09:34', operator: '系统', event: 'ai_extract_running', status: 'running' }
    ]
  }
];

// 知识获取类型选项映射（与筛选下拉保持一致）
window.__KNOWLEDGE_TYPE_MAP__ = {
  '1': '基金管理人及其管理基金的经验',
  '2': '期末兼任私募资产管理计划投资经理的基金经理同时管理的产品情况',
  '3': '报告期内管理人对本基金持有人数或基金资产净值预警情形的说明',
  '4': '盈利投资者数量占比',
  '5': '基金管理人、基金托管人的专门基金托管部门的重大人事变动',
  '6': '涉及基金管理人、基金财产、基金托管业务的诉讼',
  '7': '管理人受调查或处罚等情况',
  '8': '管理人相关从业人员受调查或处罚等情况',
  '9': '托管人受调查或处罚等情况',
  '10': '托管人相关从业人员受调查或处罚等情况'
};

// 日志事件类型显示映射
window.__LOG_EVENT_LABEL_MAP__ = {
  task_created: '任务创建',
  ai_extract_running: '信息提取处理中',
  task_canceled: '任务取消',
  ai_extract_completed: '信息提取处理结束'
};

// 定时任务配置演示数据（未来 3 个待执行任务）
window.__SCHEDULED_TASKS__ = [
  {
    id: 's1',
    reportType: '中期报告',
    reportPeriodLabel: '2026年中报',
    reportPeriodKey: 'semiAnnual-2026',
    enabled: true,
    executeTime: '2026-07-01T02:00'
  },
  {
    id: 's2',
    reportType: '中期报告',
    reportPeriodLabel: '2026年中报',
    reportPeriodKey: 'semiAnnual-2026',
    enabled: true,
    executeTime: '2026-10-01T02:00'
  },
  {
    id: 's3',
    reportType: '中期报告',
    reportPeriodLabel: '2026年中报',
    reportPeriodKey: 'semiAnnual-2026',
    enabled: true,
    executeTime: '2027-01-01T02:00'
  }
];
