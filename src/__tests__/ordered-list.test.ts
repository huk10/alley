import {describe, it, expect} from '@jest/globals';
import { OrderedList } from '../ordered-list.js'

describe('OrderList', () => {

  it('should be orderly after adding new elements', function() {
    const list = new OrderedList();

    list.append({priority: 3, kind: 2})
    expect(list.first()).toStrictEqual({priority: 3, kind: 2});

    list.append({priority: 4, kind: 2})
    expect(list.first()).toStrictEqual({priority: 4, kind: 2});

    list.append({priority: 1, kind: 1})
    expect(list.first()).toStrictEqual({priority: 1, kind: 1});

    list.append({priority: 10, kind: 2})
    expect(list.first()).toStrictEqual({priority: 1, kind: 1});

    expect(Array.from(list.values())).toStrictEqual([
      {priority: 1, kind: 1},
      {priority: 10, kind: 2},
      {priority: 4, kind: 2},
      {priority: 3, kind: 2},
    ])
  });

  it('should be in order after replace elements', function() {
    const list = new OrderedList();
    list.append(
      {priority: 3, kind: 3},
      {priority: 3, kind: 1},
      {priority: 5, kind: 2},
      {priority: 1, kind: 1},
    )
    expect(Array.from(list.values())).toStrictEqual([
      {priority: 3, kind: 1},
      {priority: 1, kind: 1},
      {priority: 5, kind: 2},
      {priority: 3, kind: 3},
    ]);

    list.replace( 1, {priority: 10, kind: 1})

    expect(Array.from(list.values())).toStrictEqual([
      {priority: 10, kind: 1},
      {priority: 3, kind: 1},
      {priority: 5, kind: 2},
      {priority: 3, kind: 3},
    ]);
  });
})
