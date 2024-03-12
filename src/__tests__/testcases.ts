export const pattern_cases = [
  // pattern中的 / 并没有什么特殊含义，它在 pattern 中只是可以用来分割命名参数而已。
  {
    value: 1,
    pattern: '/user/avatar*',
    print: [
      'root [priority: 1]',
      '└── /user/avatar <static> [priority: 1]',
      '    └── * <wildcard> (1*) [value: 1]',
    ],
  },

  // 是识别距离最近的第一个合并的括号，下面这个会分为三段 "/v1/{" 、"{id}' 、"-}"
  {
    value: 1,
    pattern: '/v1/{{id}-}',
    print: [
      'root [priority: 1]',
      '└── /v1/{ <static> [priority: 1]',
      '    └── {id} <parameter> [priority: 1] (id)',
      '        └── -} <static> [value: 1]',
    ],
  },

  // 参数约束
  {
    value: 1,
    pattern: '/user/{ id < uuid > }',
    print: [
      'root [priority: 1]',
      '└── /user/ <static> [priority: 1]',
      '    └── {id<uuid>} <parameter> (id<uuid>) [value: 1]',
    ],
  },

  // 转义字符
  // 有效的转义，转义字符会被删除。
  {
    value: 1,
    pattern: '/v1/\\{id}',
    print: ['root [priority: 1]', '└── /v1/{id} <static> [value: 1]'],
  },
  // 支持多重转义，这里相当于没有转义
  {
    value: 1,
    pattern: '/v1/\\\\{id}',
    print: [
      'root [priority: 1]',
      '└── /v1/ <static> [priority: 1]',
      '    └── {id} <parameter> (id) [value: 1]',
    ],
  },
  // 错误的转义，这里只有三个转义字符，这种写法是错误的，js 读到的字符串只能获取到两个转义字符。
  {
    value: 1,
    pattern: '/v1/\\{id}',
    print: ['root [priority: 1]', '└── /v1/{id} <static> [value: 1]'],
  },
  // 对 * 转义
  {
    value: 1,
    pattern: '/v1/\\*',
    print: ['root [priority: 1]', '└── /v1/* <static> [value: 1]'],
  },

  // 不支持
  // {
  //   value: 1,
  //   pattern: '/v1/{name}\\\\\\',
  // },
];

export const match_cases = [
  {
    patterns: ['/api/v1'],
    pattern: '/api/v1/user/id',
    testCases: [
      {path: '/api/v1/user', match: null},
      {path: '/api/v1/user/id/', match: null},
      {path: '/api/v1/user/id', match: {}},
    ],
  },
  {
    patterns: ['/api/v1'],
    pattern: '/api/v1/user/{id<uuid>}',
    testCases: [
      {path: '/api/v1/user', match: null},
      {path: '/api/v1/user/id', match: {params: {id: 'id'}, constraint: {id: 'uuid'}}},
    ],
  },
];
