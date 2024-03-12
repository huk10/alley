import {describe, expect, test} from '@jest/globals';
import { CONSTRAINT_BOUNDS, NO_MISMATCH, PARAMETER_BOUNDS } from '../constant.js';
import {findBounds, findNearestSpecialCharacter, noEscape} from '../pattern.js';

test('noEscape', () => {
  expect(noEscape('\\\\<', 2)).toEqual(true);
  expect(noEscape('\\<', 1)).toEqual(false);
  expect(noEscape('\\\\\\<', 3)).toEqual(false);
});

test('findNearestSpecialCharacter', () => {
  expect(findNearestSpecialCharacter('/user/{id}')).toEqual(6);
  expect(findNearestSpecialCharacter('/user/\\{id}')).toEqual(-1);
  expect(findNearestSpecialCharacter('/user/\\\\{id}')).toEqual(8);
  expect(findNearestSpecialCharacter('/user/{id}/*')).toEqual(6);
  // expect(findNearestSpecialCharacter('/user/*/{id}')).toEqual(6);
  // expect(findNearestSpecialCharacter('/user/*\\/{id}')).toEqual(9);
  // expect(findNearestSpecialCharacter('/user/*\\\\/{id}')).toEqual(6);
  // expect(findNearestSpecialCharacter('/user/\\*/{id}')).toEqual(9);
  // expect(findNearestSpecialCharacter('/user/\\\\*/{id}')).toEqual(10);
  // expect(findNearestSpecialCharacter('/user\\/*/{id}')).toEqual(9);
  // expect(findNearestSpecialCharacter('/user\\\\/*/{id}')).toEqual(8);
});

describe('find named parameter constraint bounds', () => {
  test('no escape', () => {
    expect(findBounds('/user/{id<uuid>}/profile', CONSTRAINT_BOUNDS, 6)).toEqual([9, 14]);
    expect(findBounds('/user/{id<<uuid>}/abc', CONSTRAINT_BOUNDS, 6)).toEqual([10, 15]);
    expect(findBounds('/user/{id<<uuid>>}/abc', CONSTRAINT_BOUNDS, 6)).toEqual([10, 15]);
  });
  test('exist escape', () => {
    expect(findBounds('/user/{id\\<uuid>}/abc', CONSTRAINT_BOUNDS, 6)).toEqual(NO_MISMATCH);
    expect(findBounds('/user/{id<\\<uuid>?}/abc', CONSTRAINT_BOUNDS, 6)).toEqual([9, 16]);
    expect(findBounds('/user/{id<\\<uuid\\>>}/abc', CONSTRAINT_BOUNDS, 6)).toEqual([9, 18]);
  });
});

// 命名参数的定义 *{*<*>*}*   * 表示可能存在的字符，某些位置的字符会被忽略
// 取最近的一对 {} 如果有嵌套如：{{}} 则会取内部的
describe('find named parameter bounds', () => {
  test('not escape', () => {
    expect(findBounds('/user/{id', PARAMETER_BOUNDS)).toEqual(NO_MISMATCH);
    expect(findBounds('/user/id}', PARAMETER_BOUNDS)).toEqual(NO_MISMATCH);
    expect(findBounds('/user/{id}', PARAMETER_BOUNDS)).toEqual([6, 9]);
    expect(findBounds('/user/{id}}', PARAMETER_BOUNDS)).toEqual([6, 9]);
    expect(findBounds('/user/{id}/profile}', PARAMETER_BOUNDS)).toEqual([6, 9]);
    expect(findBounds('/user/{{id}}/profile', PARAMETER_BOUNDS)).toEqual([7, 10]);
    expect(findBounds('/user/{id<uuid>}/profile', PARAMETER_BOUNDS)).toEqual([6, 15]);
    expect(findBounds('/user/{id<uuid>?}/profile', PARAMETER_BOUNDS)).toEqual([6, 16]);
  });

  // 当我们想要表示一个字面量的反斜杠时，我们需要再次使用反斜杠来转义它。
  // 而单独一个反斜杠是无效的，会被忽略，所以两个斜杠与三个斜杠的结果是一致的。
  test('Effective escape', () => {
    expect(findBounds('/user/{id}', PARAMETER_BOUNDS)).toEqual([6, 9]);
    expect(findBounds('/user/\\{id}', PARAMETER_BOUNDS)).toEqual(NO_MISMATCH);
    expect(findBounds('/user/{id\\}', PARAMETER_BOUNDS)).toEqual(NO_MISMATCH);
    expect(findBounds('/user/\\{id\\}', PARAMETER_BOUNDS)).toEqual(NO_MISMATCH);

    expect(findBounds('/user/{{id}}/abc', PARAMETER_BOUNDS)).toEqual([7, 10]);
    expect(findBounds('/user/{\\{id}}/abc', PARAMETER_BOUNDS)).toEqual([6, 11]);

    expect(findBounds('/user/{id<uuid>}/abc', PARAMETER_BOUNDS)).toEqual([6, 15]);
    expect(findBounds('/user/{id<uuid>\\}/abc', PARAMETER_BOUNDS)).toEqual(NO_MISMATCH);
    expect(findBounds('/user/{id\\<uuid\\>}/abc', PARAMETER_BOUNDS)).toEqual([6, 17]);
    expect(findBounds('/user/{id<uuid>\\?}/abc', PARAMETER_BOUNDS)).toEqual([6, 17]);
  });

  test('Invalid escape', () => {
    // 双层转义与原结果一致。
    expect(findBounds('/user/{{id}}/abc', PARAMETER_BOUNDS)).toEqual([7, 10]);
    expect(findBounds('/user/{\\\\{id\\\\}}/abc', PARAMETER_BOUNDS)).toEqual([9, 14]);
  });
});
