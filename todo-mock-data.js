/* =====================================================================
 * todo-mock-data.js
 * 作用:首页"待办公告任务提示"卡 + 二级页"自动化公告待办"列表
 *      共享的【唯一事实源 (Single Source of Truth)】。
 *
 * 字段契约(供首页 widget 与二级页严格对齐使用,不允许任何一方私自加字段):
 *   id              {string}   任务唯一标识
 *   type            {string}   公告类型(如"基金合同生效公告")
 *   fundFullName    {string}   基金全称(单条任务兜底字段,无 funds 时使用)
 *   fundCode        {string}   基金代码(单条任务兜底字段,无 funds 时使用)
 *   fundShortName   {string}   基金简称(单条任务兜底字段,无 funds 时使用)
 *   funds           {Object[]=} 单条任务承载多只基金时的结构化数组
 *                              [{ fundCode, fundFullName, fundShortName }, ...]
 *                              存在时表格渲染 funds[0] + 副标"等 N 只";模糊搜索遍历全部
 *                              不存在时回退到单字符串兜底字段
 *   noticeDate      {string}   公告日期(YYYY-MM-DD,或 "-" 表示未定)
 *   source          {string}   任务来源(NCRM / OA / 系统定时 / ...)
 *   generatedAt     {string}   系统生成时间(YYYY-MM-DD HH:mm)
 *   status          {enum}     'pending' | 'editing' | 'submitted' | 'expired'
 *   complete        {boolean}  发起参数是否齐备
 *   duplicate       {boolean}  是否疑似重复
 *   params          {Object[]} 发起参数明细 { key, value, source, required, type? }
 *   logs            {Object[]} 合规操作日志 { time, operator, type, detail }
 *
 * 加载顺序约束(主页面 / 二级页都必须遵守):
 *   <script src="./todo-mock-data.js"></script>      <!-- 必须先 -->
 *   <script> ...业务初始化... </script>
 *
 * Mock 阶段说明:
 *   - 真实环境下,本文件应替换为 GET /api/todo/tasks 的运行时获取。
 *   - 二级页 autoExpireOutdatedTasks() 会就地修改 status,但因为
 *     首页与二级页是不同 HTML,各自从零加载,所以"同进程内 mutation"
 *     不会影响首页。真实接口接入时,前端在写后请重新拉取以保持一致。
 * ===================================================================== */
(function (global) {
  'use strict';

  // 幂等:重复引入时只赋值一次,避免 mutation 被覆盖
  if (global.__TODO_TODAY__ && Array.isArray(global.__TODO_TASKS__)) return;

  // 当前业务日(Mock 阶段写死;真实环境改为 new Date().toISOString().slice(0,10))
  global.__TODO_TODAY__ = '2026-07-01';

  global.__TODO_TASKS__ = [
    {
      id: 'T20260701001',
      type: '基金上市交易公告书提示性公告',
      fundFullName: '汇添富中证A500交易型开放式指数证券投资基金',
      fundCode: '563880',
      fundShortName: 'A500ETF汇添富',
      noticeDate: '2026-07-10',
      source: '上市交易公告书流程',
      generatedAt: '2026-07-01 09:12',
      status: 'pending',
      complete: true,
      duplicate: false,
            params: [
        { key: '选择基金/上市份额', value: '汇添富中证A500ETF 563880.SH', source: '取自上市交易公告书流程的"上市份额"', required: true },
        { key: '公告日期', value: '2026-07-10', source: '取自上市交易公告书流程的"公告发布日期"', required: true, type: 'date' }
      ],
      logs: [
        { time: '2026-07-01 09:12', operator: '系统', type: '创建', detail: '根据上市交易公告书发起流程生成待办任务' }
      ]
    },
    {
      id: 'T20260701002',
      type: '基金上市交易公告书提示性公告',
      fundFullName: '汇添富中证A500交易型开放式指数证券投资基金',
      fundCode: '563880',
      fundShortName: 'A500ETF汇添富',
      noticeDate: '2026-07-10',
      source: '上市交易公告书流程',
      generatedAt: '2026-07-01 09:35',
      status: 'pending',
      complete: true,
      duplicate: true,
            params: [
        { key: '选择基金/上市份额', value: '汇添富中证A500ETF 563880.SH', source: '取自上市交易公告书流程的"上市份额"', required: true },
        { key: '公告日期', value: '2026-07-10', source: '取自上市交易公告书流程的"公告发布日期"', required: true, type: 'date' }
      ],
      logs: [
        { time: '2026-07-01 09:35', operator: '系统', type: '创建', detail: '同一基金、同一公告日期再次生成任务' }
      ]
    },
    {
      id: 'T20260701003',
      type: '定期报告提示性公告',
      // ⭐ T003 单任务承载 20 只基金:3 个单字符串字段用 " / " 拼接,浏览器原生 title 悬浮浮窗显示完整内容
      fundFullName: [
        '汇添富中证A500交易型开放式指数证券投资基金',
        '汇添富中证细分化工产业主题ETF',
        '汇添富中证沪港深500ETF',
        '汇添富中证光伏产业ETF',
        '汇添富中证新能源汽车产业ETF',
        '汇添富中证半导体材料设备ETF',
        '汇添富中证沪港深互联网ETF',
        '汇添富中证全指证券公司ETF',
        '汇添富中证消费龙头ETF',
        '汇添富中证医药卫生ETF',
        '汇添富中证沪港深科技龙头ETF',
        '汇添富中证机器人ETF',
        '汇添富中证大数据产业ETF',
        '汇添富中证国防军工ETF',
        '汇添富中证沪港深金融地产ETF',
        '汇添富中证环保产业ETF',
        '汇添富中证高端装备ETF',
        '汇添富中证新材料ETF',
        '汇添富中证创新药ETF',
        '汇添富中证数字经济ETF'
      ].join(','),
      fundCode: ['563880', '560110', '159711', '560120', '159716', '560150', '159729', '560090', '159735', '560180', '159702', '560160', '159739', '560170', '159713', '560130', '159725', '560140', '159728', '560100'].join(','),
      fundShortName: [
        'A500ETF汇添富', '化工ETF汇添富', '沪港深500ETF汇添富', '光伏ETF汇添富', '新能源车ETF汇添富',
        '半导体ETF汇添富', '互联网ETF汇添富', '证券ETF汇添富', '消费ETF汇添富', '医药ETF汇添富',
        '科技龙头ETF汇添富', '机器人ETF汇添富', '大数据ETF汇添富', '军工ETF汇添富', '金融地产ETF汇添富',
        '环保ETF汇添富', '高端装备ETF汇添富', '新材料ETF汇添富', '创新药ETF汇添富', '数字经济ETF汇添富'
      ].join(','),
      noticeDate: '2026-07-18',
      source: '系统定时',
      generatedAt: '2026-07-01 07:00',
      status: 'pending',
      complete: false,
      duplicate: false,
            params: [
        { key: '报告年份', value: '2026', source: '根据披露日期最临近的定期报告预填', required: true },
        { key: '报告类型', value: '二季度报告', source: '季度结束第5个工作日自动生成', required: true },
        { key: '报告期内清盘产品', value: '', source: '默认不勾选,由业务人员确认', required: false }
      ],
      logs: [
        { time: '2026-07-07 06:00', operator: '系统', type: '创建', detail: '季度结束第5个工作日生成任务' }
      ]
    },
    {
      id: 'T20260701004',
      type: 'ETF新增发售代理机构公告',
      fundFullName: '汇添富中证A500交易型开放式指数证券投资基金',
      fundCode: '563880',
      fundShortName: 'A500ETF汇添富',
      noticeDate: '2026-07-20',
      source: 'NCRM',
      generatedAt: '2026-07-01 10:18',
      status: 'editing',
      complete: true,
      duplicate: false,
            params: [
        { key: '选择基金', value: '汇添富中证A500ETF 563880', source: 'NCRM 产品代码', required: true },
        { key: '基金发售代理机构生效日期', value: '2026-07-22', source: 'NCRM 业务开始办理日期', required: true, type: 'date' },
        { key: '公告发布日期', value: '2026-07-20', source: 'NCRM 公告日期', required: true, type: 'date' },
        { key: '发售起始日', value: '2026-07-15', source: '底层A500ETF汇添富募集期起始日', required: true, type: 'date' },
        { key: '发售截止日', value: '2026-07-25', source: '底层A500ETF汇添富募集期截止日', required: true, type: 'date' },
        { key: '代销机构', value: '东方证券', source: 'NCRM 机构简称', required: true }
      ],
      logs: [
        { time: '2026-07-01 10:18', operator: '系统', type: '创建', detail: '根据NCRM推送生成待办任务' },
        { time: '2026-07-01 10:42', operator: '李四', type: '编辑', detail: '修改发售截止日并保存' }
      ]
    },
    {
      id: 'T20260701005',
      type: '基金合同生效公告',
      fundFullName: '汇添富中证A500交易型开放式指数证券投资基金',
      fundCode: '563880',
      fundShortName: 'A500ETF汇添富',
      noticeDate: '-',
      source: '系统定时',
      generatedAt: '2026-07-01 06:00',
      status: 'pending',
      complete: false,
      duplicate: false,
            params: [
        { key: '选择基金', value: '汇添富中证A500ETF 563880', source: '产品底层信息', required: true },
        { key: '文号', value: '', source: '系统无底层字段,需人工填写', required: true }
      ],
      logs: [
        { time: '2026-07-01 06:00', operator: '系统', type: '创建', detail: '募集期截止日下一自然日早6点生成任务' }
      ]
    },
    {
      id: 'T20260701006',
      type: '非货币市场基金分红公告',
      fundFullName: '汇添富中证A500交易型开放式指数证券投资基金',
      fundCode: '563880',
      fundShortName: 'A500ETF汇添富',
      noticeDate: '2026-07-15',
      source: 'OA',
      generatedAt: '2026-06-30 17:26',
      status: 'pending',
      complete: true,
      duplicate: false,
            params: [
        { key: '基金简称', value: 'A500ETF汇添富', source: 'OA收益分配流程', required: true },
        { key: '基准日', value: '2026-06-30', source: 'OA收益分配流程', required: true, type: 'date' },
        { key: '收益分配方式', value: '', source: '默认为空,允许人工选择', required: false },
        { key: '是否场外定开基金封闭期', value: '否', source: '系统默认值', required: true },
        { key: '是否持有期产品', value: '否', source: '系统默认值', required: true }
      ],
      logs: [
        { time: '2026-06-30 17:26', operator: '系统', type: '创建', detail: '根据OA推送生成分红公告待办' }
      ]
    },
    {
      id: 'T20260701007',
      type: '基金经理变更公告',
      fundFullName: '汇添富中证A500交易型开放式指数证券投资基金',
      fundCode: '563880',
      fundShortName: 'A500ETF汇添富',
      noticeDate: '2026-07-02',
      source: '产品数据同步',
      generatedAt: '2026-06-17 12:00',
      status: 'pending',
      complete: true,
      duplicate: false,
            params: [
        { key: '报告类型', value: '增聘基金经理', source: '基金经理角色变动判断', required: true },
        { key: '基金经理', value: '王某', source: '产品数据同步流程', required: true },
        { key: '任职日期', value: '2026-07-02', source: '产品数据同步流程', required: true, type: 'date' }
      ],
      logs: [
        { time: '2026-06-17 12:00', operator: '系统', type: '创建', detail: '根据公募产品:基金经理变更流程生成任务' }
      ]
    },
    {
      id: 'T20260701008',
      type: '基金上市交易公告书提示性公告',
      fundFullName: '汇添富中证A500交易型开放式指数证券投资基金',
      fundCode: '563880',
      fundShortName: 'A500ETF汇添富',
      noticeDate: '2026-06-28',
      source: '上市交易公告书流程',
      generatedAt: '2026-06-26 11:10',
      status: 'expired',
      complete: true,
      duplicate: true,
            params: [
        { key: '选择基金/上市份额', value: '汇添富中证A500ETF 563880.SZ', source: '取自上市交易公告书流程的"上市份额"', required: true },
        { key: '公告日期', value: '2026-06-28', source: '取自上市交易公告书流程的"公告发布日期"', required: true, type: 'date' }
      ],
      logs: [
        { time: '2026-06-26 11:10', operator: '系统', type: '创建', detail: '生成提示性公告待办任务' },
        { time: '2026-06-26 15:36', operator: '张三', type: '删除', detail: '判断为重复任务并删除' }
      ]
    },
    {
      id: 'T20260701009',
      type: '基金上网发售提示性公告',
      fundFullName: '汇添富中证A500交易型开放式指数证券投资基金',
      fundCode: '563880',
      fundShortName: 'A500ETF汇添富',
      noticeDate: '2026-07-03',
      source: '产品数据同步',
      generatedAt: '2026-07-01 16:30',
      status: 'pending',
      complete: true,
      duplicate: false,
            params: [
        { key: '上网发售起始日', value: '2026-07-04', source: '募集期起始日', required: true, type: 'date' },
        { key: '上网发售截止日', value: '2026-07-18', source: '募集期截止日', required: true, type: 'date' },
        { key: '挂牌价', value: '1.00', source: '系统默认值', required: true },
        { key: '公告发布日期', value: '2026-07-03', source: '按现有发起页逻辑预填', required: true, type: 'date' }
      ],
      logs: [
        { time: '2026-07-01 16:30', operator: '系统', type: '创建', detail: '交易所基金募集日期补充后生成任务' }
      ]
    },
    {
      id: 'T20260701010',
      type: '基金新增申赎代理券商公告',
      fundFullName: '汇添富中证A500交易型开放式指数证券投资基金',
      fundCode: '563880',
      fundShortName: 'A500ETF汇添富',
      noticeDate: '2026-07-04',
      source: 'NCRM',
      generatedAt: '2026-07-01 17:05',
      status: 'pending',
      complete: true,
      duplicate: false,
            params: [
        { key: '披露主体', value: '单一基金', source: '根据NCRM推送的基金/机构数量判断', required: true },
        { key: '选择基金', value: '汇添富中证A500ETF 563880', source: 'NCRM 产品代码', required: true },
        { key: '生效日期', value: '2026-07-08', source: 'NCRM 业务开始办理日期', required: true, type: 'date' },
        { key: '公告日期', value: '2026-07-04', source: 'NCRM 公告日期', required: true, type: 'date' },
        { key: '序号', value: '1', source: '单一基金场景下系统自动计数', required: true },
        { key: '申赎代理券商全称', value: '东方证券股份有限公司', source: 'NCRM 机构全称', required: true },
        { key: '申赎代理券商简称', value: '东方证券', source: 'NCRM 机构简称', required: true },
        { key: '网站', value: 'www.dfzq.com.cn', source: 'NCRM 网址', required: true },
        { key: '客服电话', value: '95503', source: 'NCRM 客服电话', required: true }
      ],
      logs: [
        { time: '2026-07-01 17:05', operator: '系统', type: '创建', detail: '根据NCRM推送生成新增申赎代理券商待办任务' }
      ]
    },
    {
      id: 'T20260701011',
      type: '基金上市交易提示性公告',
      fundFullName: '汇添富中证A500交易型开放式指数证券投资基金',
      fundCode: '563880',
      fundShortName: 'A500ETF汇添富',
      noticeDate: '2026-07-10',
      source: '上市交易公告书流程',
      generatedAt: '2026-07-01 17:22',
      status: 'pending',
      complete: false,
      duplicate: false,
            params: [
        { key: '选择基金/上市份额', value: '汇添富中证A500ETF 563880.SH', source: '取自上市交易公告书流程的"上市份额"', required: true },
        { key: '公告日期', value: '2026-07-10', source: '默认显示上市日期', required: true, type: 'date' },
        { key: '取数日期', value: '', source: '默认为空,由业务人员确认或填写', required: true, type: 'date' }
      ],
      logs: [
        { time: '2026-07-01 17:22', operator: '系统', type: '创建', detail: '根据上市交易公告书发起流程同步生成上市交易提示性公告待办任务' }
      ]
    }
  ];
})(window);
