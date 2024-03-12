import {describe, it, expect} from '@jest/globals';
import {Tree} from '../tree.js';

describe('error', () => {
  it('errors should be thrown if there is a similar pattern', () => {
    const tree = new Tree();

    tree.put('/user/{id}', 2);
    tree.put('/user/{id}/*', 3);

    expect(() => tree.put('/user/{type}', 1)).toThrowError(`a similar pattern already exists.`);

    expect(() => tree.put('/user/*', 1)).toThrowError(`a similar pattern already exists.`);
  });

  it('an error should be thrown if there is the same pattern', () => {
    const tree = new Tree();

    tree.put('/user/id', 2);
    tree.put('/user/{id}', 2);
    tree.put('/user/{id}/*', 2);

    expect(() => tree.put('/user/*', 1)).toThrowError(`pattern already exists`);
    expect(() => tree.put('/user/id', 1)).toThrowError(`pattern already exists`);
    expect(() => tree.put('/user/{id}', 1)).toThrowError(`pattern already exists`);
    expect(() => tree.put('/user/{id}/*', 1)).toThrowError(`pattern already exists`);
  });

  it('parameter has no boundary characters', () => {
    const tree = new Tree();
    expect(() => tree.put('/at/{year}{month}', 1)).toThrowError(
      `Invalid pattern syntax in pattern '/at/{year}{month}'. The 10th character is incorrect; Named parameters must be separated by "-", ".", "/".`
    );

    // 对 - 转义
    // 对 - 和 . 和 / 转义，可能并没有实际性的意义，但是可以用来测试转义字符的正确性。
    // 这个例子两个分界符都被转义了，所以认为不是一个有效参数。
    {
      const tree = new Tree();
      expect(() => tree.put('/v1/{name}\\-\\.js', 1)).toThrowError(
        `Invalid pattern syntax in pattern '/v1/{name}\\-\\.js'. The 10th character is incorrect; Named parameters must be separated by "-", ".", "/".`
      )
    }
  });

  it('wildcards can only appear at the end', () => {
    const tree = new Tree();
    expect(() => tree.put('/user/*/avatar', 1)).toThrowError(
      `Invalid pattern syntax in pattern '/user/*/avatar'. The 7th character is incorrect; a '*' must be the last character`
    );
  });




});
