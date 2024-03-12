import {describe, it, expect} from '@jest/globals';
import { Matches, Tree } from '../tree.js';
import {printWithTest} from './lib/print.js';
import { pattern_cases, match_cases } from './testcases.js'


function withMatchValue(value: unknown) {
  return {
    value,
    params: {},
    constraint: {},
  };
}

// 只有静态节点的话，行为应该和一个普通的基数树一致。
describe('only static node', () => {
  describe('put:', () => {
    it('case1: 已存在节点，插入一个没有公共前缀的新单词', () => {
      const tree = new Tree();
      tree.put('water', 1);
      expect(printWithTest(tree)).toStrictEqual([
        'root [priority: 1]',
        '└── water <static> [value: 1]',
      ]);
      tree.put('slow', 2);
      expect(printWithTest(tree)).toStrictEqual([
        'root [priority: 2]',
        '├── water <static> [value: 1]',
        '└── slow <static> [value: 2]',
      ]);
    });

    it('case2: 前缀与单词的第一部分完全匹配，但单词仍有剩余部分', () => {
      const tree = new Tree();
      tree.put('water', 1);
      tree.put('slow', 2);
      expect(printWithTest(tree)).toStrictEqual([
        'root [priority: 2]',
        '├── water <static> [value: 1]',
        '└── slow <static> [value: 2]',
      ]);
      tree.put('slower', 3);
      expect(printWithTest(tree)).toStrictEqual([
        'root [priority: 3]',
        '├── slow <static> [priority: 1] [value: 2]',
        '│   └── er <static> [value: 3]',
        '└── water <static> [value: 1]',
      ]);
    });

    it('case3: 单词与前缀匹配，但前缀有剩余部分（单词比前缀短）', () => {
      const tree = new Tree();
      tree.put('water', 1);
      tree.put('slower', 2);
      expect(printWithTest(tree)).toStrictEqual([
        'root [priority: 2]',
        '├── water <static> [value: 1]',
        '└── slower <static> [value: 2]',
      ]);
      tree.put('slow', 3);
      expect(printWithTest(tree)).toStrictEqual([
        'root [priority: 3]',
        '├── slow <static> [priority: 1] [value: 3]',
        '│   └── er <static> [value: 2]',
        '└── water <static> [value: 1]',
      ]);
    });

    it('case4: 前缀与单词不匹配', () => {
      {
        /**
         * “waste” -> 找到“water”，但不匹配“wat”！=“was”
         *      “wa”是先前匹配的前缀
         *            必须将“water”拆分为“wa”和“ter”并将属性保留为单词
         * “ste” -> 插入
         */
        const tree = new Tree();
        tree.put('water', 1);
        tree.put('slow', 3);
        tree.put('slower', 4);
        expect(printWithTest(tree)).toStrictEqual([
          'root [priority: 3]',
          '├── slow <static> [priority: 1] [value: 3]',
          '│   └── er <static> [value: 4]',
          '└── water <static> [value: 1]',
        ]);
        tree.put('waste', 2);
        expect(printWithTest(tree)).toStrictEqual([
          'root [priority: 4]',
          '├── wa <static> [priority: 2]',
          '│   ├── ter <static> [value: 1]',
          '│   └── ste <static> [value: 2]',
          '└── slow <static> [priority: 1] [value: 3]',
          '    └── er <static> [value: 4]',
        ]);
      }
      {
        /**
         * “watch” -> 发现“wa”作为前缀，从当前输入中删除前缀
         * “tch” -> 找到“ter”，但错误匹配“te”！=“tc”
         *     “t”是先前匹配的前缀
         *     必须将“ter”拆分为“t”和“er”，并保留“er”属性作为单词。
         * “ch”-> 正常插入
         */
        const tree = new Tree();
        tree.put('water', 1);
        tree.put('slow', 2);
        tree.put('slower', 3);
        tree.put('waste', 4);
        expect(printWithTest(tree)).toStrictEqual([
          'root [priority: 4]',
          '├── wa <static> [priority: 2]',
          '│   ├── ter <static> [value: 1]',
          '│   └── ste <static> [value: 4]',
          '└── slow <static> [priority: 1] [value: 2]',
          '    └── er <static> [value: 3]',
        ]);
        tree.put('watch', 5);
        expect(printWithTest(tree)).toStrictEqual([
          'root [priority: 5]',
          '├── wa <static> [priority: 3]',
          '│   ├── t <static> [priority: 2]',
          '│   │   ├── er <static> [value: 1]',
          '│   │   └── ch <static> [value: 5]',
          '│   └── ste <static> [value: 4]',
          '└── slow <static> [priority: 1] [value: 2]',
          '    └── er <static> [value: 3]',
        ]);
      }
    });

    it('case5: 前缀和单词完全匹配并且长度相同', () => {
      //  只需将该节点标记为单词节点
      const tree = new Tree();
      tree.put('water', 1);
      tree.put('slow', 2);
      tree.put('slower', 3);
      tree.put('waste', 4);
      tree.put('watch', 5);
      expect(printWithTest(tree)).toStrictEqual([
        'root [priority: 5]',
        '├── wa <static> [priority: 3]',
        '│   ├── t <static> [priority: 2]',
        '│   │   ├── er <static> [value: 1]',
        '│   │   └── ch <static> [value: 5]',
        '│   └── ste <static> [value: 4]',
        '└── slow <static> [priority: 1] [value: 2]',
        '    └── er <static> [value: 3]',
      ]);
      tree.put('wa', 6);
      expect(printWithTest(tree)).toStrictEqual([
        'root [priority: 6]',
        '├── wa <static> [priority: 3] [value: 6]',
        '│   ├── t <static> [priority: 2]',
        '│   │   ├── er <static> [value: 1]',
        '│   │   └── ch <static> [value: 5]',
        '│   └── ste <static> [value: 4]',
        '└── slow <static> [priority: 1] [value: 2]',
        '    └── er <static> [value: 3]',
      ]);
    });

    it('case6: 插入一个已存在的键', function() {
      const tree = new Tree();
      tree.put('/user/id', 1);
      // 错误信息会在 error.test 文件测。
      expect(() => tree.put('/user/id', 2)).toThrowError();
    });
  });

  describe('remove:', () => {
    it('case1: 删除非叶子单词节点-触发节点合并', () => {
      const tree = new Tree();
      tree.put('water', 1);
      tree.put('slow', 2);
      tree.put('slower', 3);
      expect(printWithTest(tree)).toStrictEqual([
        'root [priority: 3]',
        '├── slow <static> [priority: 1] [value: 2]',
        '│   └── er <static> [value: 3]',
        '└── water <static> [value: 1]',
      ]);
      tree.remove('slow');
      expect(tree.match('slow')).toBe(null);
      expect(tree.match('slower')).toStrictEqual(withMatchValue(3));
      expect(printWithTest(tree)).toStrictEqual([
        'root [priority: 2]',
        '├── water <static> [value: 1]',
        '└── slower <static> [value: 3]',
      ]);
    });

    it('case2: 删除非叶子单词节点-不触发节点合并', () => {
      const tree = new Tree();
      tree.put('wa', 1);
      tree.put('hello', 2);
      tree.put('water', 3);
      tree.put('waste', 4);
      tree.put('watch', 5);
      expect(printWithTest(tree)).toStrictEqual([
        'root [priority: 5]',
        '├── wa <static> [priority: 3] [value: 1]',
        '│   ├── t <static> [priority: 2]',
        '│   │   ├── er <static> [value: 3]',
        '│   │   └── ch <static> [value: 5]',
        '│   └── ste <static> [value: 4]',
        '└── hello <static> [value: 2]',
      ]);
      expect(tree.match('wa')).toStrictEqual(withMatchValue(1));
      tree.remove('wa');
      expect(tree.match('wa')).toBe(null);
      expect(printWithTest(tree)).toStrictEqual([
        'root [priority: 4]',
        '├── wa <static> [priority: 3]',
        '│   ├── t <static> [priority: 2]',
        '│   │   ├── er <static> [value: 3]',
        '│   │   └── ch <static> [value: 5]',
        '│   └── ste <static> [value: 4]',
        '└── hello <static> [value: 2]',
      ]);
    });

    it('case3: 删除非叶子非单词节点-不触发节点合并', () => {
      const tree = new Tree();
      tree.put('hello', 1);
      tree.put('water', 2);
      tree.put('waste', 3);
      tree.put('watch', 4);
      expect(printWithTest(tree)).toStrictEqual([
        'root [priority: 4]',
        '├── wa <static> [priority: 3]',
        '│   ├── t <static> [priority: 2]',
        '│   │   ├── er <static> [value: 2]',
        '│   │   └── ch <static> [value: 4]',
        '│   └── ste <static> [value: 3]',
        '└── hello <static> [value: 1]',
      ]);
      expect(tree.match('wa')).toBe(null);
      tree.remove('wa');
      expect(printWithTest(tree)).toStrictEqual([
        'root [priority: 4]',
        '├── wa <static> [priority: 3]',
        '│   ├── t <static> [priority: 2]',
        '│   │   ├── er <static> [value: 2]',
        '│   │   └── ch <static> [value: 4]',
        '│   └── ste <static> [value: 3]',
        '└── hello <static> [value: 1]',
      ]);
    });

    it('case4: 删除叶子节点兄弟节点,是单词节点无子节点-不触发节点合并', () => {
      const tree = new Tree();
      tree.put('foo', 1);
      tree.put('hello', 2);
      tree.put('world', 3);
      expect(printWithTest(tree)).toStrictEqual([
        'root [priority: 3]',
        '├── foo <static> [value: 1]',
        '├── hello <static> [value: 2]',
        '└── world <static> [value: 3]',
      ]);
      tree.remove('foo');
      expect(tree.match('foo')).toBe(null);
      expect(printWithTest(tree)).toStrictEqual([
        'root [priority: 2]',
        '├── hello <static> [value: 2]',
        '└── world <static> [value: 3]',
      ]);
    });

    it('case5: 删除叶子节点，兄弟节点不是单词节点存在子节点-触发节点合并', () => {
      const tree = new Tree();
      tree.put('water', 2);
      tree.put('waste', 3);
      tree.put('watch', 4);
      expect(printWithTest(tree)).toStrictEqual([
        'root [priority: 3]',
        '└── wa <static> [priority: 3]',
        '    ├── t <static> [priority: 2]',
        '    │   ├── er <static> [value: 2]',
        '    │   └── ch <static> [value: 4]',
        '    └── ste <static> [value: 3]',
      ]);
      tree.remove('waste');
      expect(printWithTest(tree)).toStrictEqual([
        'root [priority: 2]',
        '└── wat <static> [priority: 2]',
        '    ├── er <static> [value: 2]',
        '    └── ch <static> [value: 4]',
      ]);
      expect(tree.match('waste')).toBe(null);
      expect(tree.match('water')).toStrictEqual(withMatchValue(2));
      expect(tree.match('watch')).toStrictEqual(withMatchValue(4));
    });

    it('case6: 删除叶子节点，兄弟节点是单词节点存在子节点-不触发节点合并', () => {
      const tree = new Tree();
      tree.put('wa', 1);
      tree.put('water', 2);
      tree.put('waste', 3);
      tree.put('watch', 4);
      expect(printWithTest(tree)).toStrictEqual([
        'root [priority: 4]',
        '└── wa <static> [priority: 3] [value: 1]',
        '    ├── t <static> [priority: 2]',
        '    │   ├── er <static> [value: 2]',
        '    │   └── ch <static> [value: 4]',
        '    └── ste <static> [value: 3]',
      ]);
      tree.remove('waste');
      expect(printWithTest(tree)).toStrictEqual([
        'root [priority: 3]',
        '└── wa <static> [priority: 2] [value: 1]',
        '    └── t <static> [priority: 2]',
        '        ├── er <static> [value: 2]',
        '        └── ch <static> [value: 4]',
      ]);
      expect(tree.match('saste')).toBe(null);
      expect(tree.match('wa')).toStrictEqual(withMatchValue(1));
      expect(tree.match('water')).toStrictEqual(withMatchValue(2));
      expect(tree.match('watch')).toStrictEqual(withMatchValue(4));
    });
  });

  describe('match:', () => {
    it('case1: 正常无拆分节点', () => {
      const tree = new Tree();
      tree.put('/user/id', 1);
      tree.put('/user/profile', 2);

      expect(tree.match('/user/id')).toStrictEqual(withMatchValue(1));
      expect(tree.match('/user/profile')).toStrictEqual(withMatchValue(2));
      expect(tree.match('/foo')).toBe(null);
    });

    it('case2: 一个单词是另一个单词前缀', () => {
      const tree = new Tree();
      tree.put('water', 1);
      tree.put('slow', 2);
      tree.put('slower', 3);
      expect(tree.match('water')).toStrictEqual(withMatchValue(1));
      expect(tree.match('slow')).toStrictEqual(withMatchValue(2));
      expect(tree.match('slower')).toStrictEqual(withMatchValue(3));
    });

    it('case3: 单词拆分场景', () => {
      const tree = new Tree();
      tree.put('water', 1);
      tree.put('slower', 2);
      tree.put('slow', 3);
      expect(tree.match('water')).toStrictEqual(withMatchValue(1));
      expect(tree.match('slower')).toStrictEqual(withMatchValue(2));
      expect(tree.match('slow')).toStrictEqual(withMatchValue(3));
    });

    it('case4: 节点多次拆分', () => {
      const tree = new Tree();
      tree.put('water', 1);
      tree.put('slow', 2);
      tree.put('slower', 3);
      tree.put('waste', 4);
      tree.put('watch', 5);
      expect(tree.match('water')).toStrictEqual(withMatchValue(1));
      expect(tree.match('slow')).toStrictEqual(withMatchValue(2));
      expect(tree.match('slower')).toStrictEqual(withMatchValue(3));
      expect(tree.match('waste')).toStrictEqual(withMatchValue(4));
      expect(tree.match('watch')).toStrictEqual(withMatchValue(5));
    });

    it('case5: 中间单词节点', () => {
      const tree = new Tree();
      tree.put('water', 1);
      tree.put('waste', 2);
      tree.put('watch', 3);
      expect(tree.match('water')).toStrictEqual(withMatchValue(1));
      expect(tree.match('waste')).toStrictEqual(withMatchValue(2));
      expect(tree.match('watch')).toStrictEqual(withMatchValue(3));
      expect(tree.match('wa')).toStrictEqual(null);
      tree.put('wa', 4);
      expect(tree.match('wa')).toStrictEqual(withMatchValue(4));
    });
  });
});


describe('mixed type node', () => {


  it('put', () => {
    const tree = new Tree();
    tree.put('/api/v1/user/{id}/profile', 3)
    expect(printWithTest(tree)).toStrictEqual([
      'root [priority: 1]',
      '└── /api/v1/user/ <static> [priority: 1]',
      '    └── {id} <parameter> [priority: 1] (id)',
      '        └── /profile <static> [value: 3]',
    ])
    tree.put('/api/v1/user/id', 1)
    tree.put('/api/v2/user/id', 2)
    expect(printWithTest(tree)).toStrictEqual([
      'root [priority: 3]',
      '└── /api/v <static> [priority: 3]',
      '    ├── 1/user/ <static> [priority: 2]',
      '    │   ├── id <static> [value: 1]',
      '    │   └── {id} <parameter> [priority: 1] (id)',
      '    │       └── /profile <static> [value: 3]',
      '    └── 2/user/id <static> [value: 2]'
    ])
    tree.put('/static/*', 2);
    expect(printWithTest(tree)).toStrictEqual([
      'root [priority: 4]',
      '└── / <static> [priority: 4]',
      '    ├── api/v <static> [priority: 3]',
      '    │   ├── 1/user/ <static> [priority: 2]',
      '    │   │   ├── id <static> [value: 1]',
      '    │   │   └── {id} <parameter> [priority: 1] (id)',
      '    │   │       └── /profile <static> [value: 3]',
      '    │   └── 2/user/id <static> [value: 2]',
      '    └── static/ <static> [priority: 1]',
      '        └── * <wildcard> (1*) [value: 2]'
    ])
  })

  it('remove', () => {
    const tree = new Tree();
    tree.put('/api/v1/user/{id}/profile', 3)
    tree.put('/api/v1/user/id', 1)
    tree.put('/api/v2/user/id', 2)
    tree.put('/static/*', 2);
    tree.put('/api/v2/order/{id}/list', 2);
    tree.put('/api/v2/order/{id}/item', 2);

    expect(printWithTest(tree)).toStrictEqual([
      'root [priority: 6]',
      '└── / <static> [priority: 6]',
      '    ├── api/v <static> [priority: 5]',
      '    │   ├── 2/ <static> [priority: 3]',
      '    │   │   ├── order/ <static> [priority: 2]',
      '    │   │   │   └── {id} <parameter> [priority: 2] (id)',
      '    │   │   │       └── / <static> [priority: 2]',
      '    │   │   │           ├── list <static> [value: 2]',
      '    │   │   │           └── item <static> [value: 2]',
      '    │   │   └── user/id <static> [value: 2]',
      '    │   └── 1/user/ <static> [priority: 2]',
      '    │       ├── id <static> [value: 1]',
      '    │       └── {id} <parameter> [priority: 1] (id)',
      '    │           └── /profile <static> [value: 3]',
      '    └── static/ <static> [priority: 1]',
      '        └── * <wildcard> (1*) [value: 2]'
    ])

    expect(tree.remove('/static/*')).toBe(1);

    // 中间非叶子节点合并
    expect(printWithTest(tree)).toStrictEqual([
      'root [priority: 5]',
      '└── /api/v <static> [priority: 5]',
      '    ├── 2/ <static> [priority: 3]',
      '    │   ├── order/ <static> [priority: 2]',
      '    │   │   └── {id} <parameter> [priority: 2] (id)',
      '    │   │       └── / <static> [priority: 2]',
      '    │   │           ├── list <static> [value: 2]',
      '    │   │           └── item <static> [value: 2]',
      '    │   └── user/id <static> [value: 2]',
      '    └── 1/user/ <static> [priority: 2]',
      '        ├── id <static> [value: 1]',
      '        └── {id} <parameter> [priority: 1] (id)',
      '            └── /profile <static> [value: 3]'
    ])
    // 无此节点，返回0
    expect(tree.remove('/static/*')).toBe(0);
    // 只能匹配中间节点，不能匹配叶子节点
    expect(tree.remove('/api/v')).toBe(0);
    expect(tree.remove('/api/v1/user/{id}')).toBe(0);
    // 结构不变
    expect(printWithTest(tree)).toStrictEqual([
      'root [priority: 5]',
      '└── /api/v <static> [priority: 5]',
      '    ├── 2/ <static> [priority: 3]',
      '    │   ├── order/ <static> [priority: 2]',
      '    │   │   └── {id} <parameter> [priority: 2] (id)',
      '    │   │       └── / <static> [priority: 2]',
      '    │   │           ├── list <static> [value: 2]',
      '    │   │           └── item <static> [value: 2]',
      '    │   └── user/id <static> [value: 2]',
      '    └── 1/user/ <static> [priority: 2]',
      '        ├── id <static> [value: 1]',
      '        └── {id} <parameter> [priority: 1] (id)',
      '            └── /profile <static> [value: 3]'
    ])

    // 顺序没有变，非静态节点不合并
    expect(tree.remove('/api/v2/order/{id}/list')).toBe(1);
    expect(printWithTest(tree)).toStrictEqual([
      'root [priority: 4]',
      '└── /api/v <static> [priority: 4]',
      '    ├── 2/ <static> [priority: 2]',
      '    │   ├── order/ <static> [priority: 1]',
      '    │   │   └── {id} <parameter> [priority: 1] (id)',
      '    │   │       └── /item <static> [value: 2]',
      '    │   └── user/id <static> [value: 2]',
      '    └── 1/user/ <static> [priority: 2]',
      '        ├── id <static> [value: 1]',
      '        └── {id} <parameter> [priority: 1] (id)',
      '            └── /profile <static> [value: 3]'
    ])
  })

  it ('order', () => {
    const tree = new Tree()
    tree.put("/v1/{id}", 1)
    tree.put("/v1/id", 1)
    // 静态节点在前，即使是后面插入的。
    expect(printWithTest(tree)).toStrictEqual([
      'root [priority: 2]',
      '└── /v1/ <static> [priority: 2]',
      '    ├── id <static> [value: 1]',
      '    └── {id} <parameter> (id) [value: 1]'
    ])

    const tree2 = new Tree()
    tree2.put("/v1/{id}/123", 2)
    tree2.put("/v1/{id}/345", 2)
    tree2.put("/v1/abc/123", 2)
    // 静态节点在前，即使是后面插入的。
    expect(printWithTest(tree2)).toStrictEqual([
      'root [priority: 3]',
      '└── /v1/ <static> [priority: 3]',
      '    ├── abc/123 <static> [value: 2]',
      '    └── {id} <parameter> [priority: 2] (id)',
      '        └── / <static> [priority: 2]',
      '            ├── 123 <static> [value: 2]',
      '            └── 345 <static> [value: 2]',
    ])

    {
      const tree = new Tree()
      tree.put("/v1/edf/123", 2)
      tree.put("/v1/edf/345", 2)
      tree.put("/v1/abc/123", 2)
      tree.put("/v1/abc/456", 2)
      tree.put("/v1/abc/7b9", 2)
      // 更多单词节点的在前，即使是后面插入的。
      expect(printWithTest(tree)).toStrictEqual([
        'root [priority: 5]',
        '└── /v1/ <static> [priority: 5]',
        '    ├── abc/ <static> [priority: 3]',
        '    │   ├── 123 <static> [value: 2]',
        '    │   ├── 456 <static> [value: 2]',
        '    │   └── 7b9 <static> [value: 2]',
        '    └── edf/ <static> [priority: 2]',
        '        ├── 123 <static> [value: 2]',
        '        └── 345 <static> [value: 2]'
      ])
    }

    {
      const tree = new Tree()
      tree.put("/v1/edf/123", 2)
      tree.put("/v1/edf/345", 2)
      tree.put("/v1/abc/123", 2)
      tree.put("/v1/abc/456", 2)
      tree.put("/v1/abc/7b9", 2)
      expect(printWithTest(tree)).toStrictEqual([
        'root [priority: 5]',
        '└── /v1/ <static> [priority: 5]',
        '    ├── abc/ <static> [priority: 3]',
        '    │   ├── 123 <static> [value: 2]',
        '    │   ├── 456 <static> [value: 2]',
        '    │   └── 7b9 <static> [value: 2]',
        '    └── edf/ <static> [priority: 2]',
        '        ├── 123 <static> [value: 2]',
        '        └── 345 <static> [value: 2]'
      ])

      expect(tree.remove('/v1/abc/123')).toBe(1)
      expect(tree.remove('/v1/abc/456')).toBe(1)
      // 删除节点后，优先级会重新计算。并重新排序。
      expect(printWithTest(tree)).toStrictEqual([
        'root [priority: 3]',
        '└── /v1/ <static> [priority: 3]',
        '    ├── edf/ <static> [priority: 2]',
        '    │   ├── 123 <static> [value: 2]',
        '    │   └── 345 <static> [value: 2]',
        '    └── abc/7b9 <static> [value: 2]'
      ])
    }

  })

  it('size()', () => {
    const tree = new Tree()
    tree.put("/user/at", 2);
    expect(tree.size()).toBe(1);

    tree.put("/user/id", 2);
    expect(tree.size()).toBe(2);

    tree.put("/user/{id}", 2);
    expect(tree.size()).toBe(3);

    tree.put("/user/{id}/*", 2);
    expect(tree.size()).toBe(4);

    tree.remove("/")
    expect(tree.size()).toBe(4);

    tree.remove("/user/id")
    expect(tree.size()).toBe(3);

    tree.remove("/user/")
    expect(tree.size()).toBe(3);
  })

  it('clear()', () => {
    const tree = new Tree()
    tree.put("/api/v1/user/*", 2);
    tree.put("/api/v2/user/*", 2);
    tree.put("/static/*", 2);
    expect(tree.size()).toBe(3);
    expect(tree.match("/static/js/abc.mjs")).toStrictEqual({
      value: 2,
      params: {'1*': 'js/abc.mjs'},
      constraint: {},
    })

    tree.clear()
    expect(tree.size()).toBe(0);
    expect(tree.remove("/static/*")).toBe(0);
    expect(tree.match("/static/js/abc.mjs")).toStrictEqual(null)
  })
})

it('pattern parse', () => {
  for (const item of pattern_cases) {
    const tree = new Tree()
    tree.put(item.pattern, item.value)
    expect(printWithTest(tree)).toStrictEqual(item.print)
  }
})


it('match ', function() {
  for (const item of match_cases) {
    const tree = new Tree()
    for (const pattern of item.patterns) {
      tree.put(pattern, 1)
    }
    tree.put(item.pattern, 1)
    for (let c of item.testCases) {
      if (c.match === null) {
        expect(tree.match(c.path)).toBe(null)
      } else {
        expect(tree.match(c.path)).toStrictEqual(<Matches<number>> {
          value: 1,
          params: (c.match as any).params || {},
          constraint: (c.match as any).constraint || {},
        })
      }
    }
  }
});
