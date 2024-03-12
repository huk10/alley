import {
  CONSTRAINT_BOUNDS,
  CURLY_BRACES_END,
  CURLY_BRACES_START,
  DOT_CHAR,
  ESCAPE_CHAR,
  HYPHEN_CHAR,
  NO_MISMATCH,
  SLASH_DELIMITER,
  WILDCARD_CHAR,
  Bounds,
  Ranges,
  PARAMETER_BOUNDS,
  PARAMETER_DELIMITER,
} from './constant.js';

interface NamedParameter {
  endIndex: number;
  paramName: string;
  constraint: string;
}

// 删除所以得转义字符
export function deleteEscapeCharacter(str: string): string {
  return str.replaceAll(ESCAPE_CHAR, '');
}

// 解析命名参数规则
export function parseNamedParameter(pattern: string): NamedParameter {
  // 这里是安全的，因为只会在安全的时候调用这个函数。所以 parameterBounds 是必定有值的。
  const parameterBounds = findBounds(pattern, PARAMETER_BOUNDS) as Ranges;
  const constraintBounds = findBounds(pattern, CONSTRAINT_BOUNDS, parameterBounds[0]!);
  let constraint = '';
  let paramName = pattern.slice(parameterBounds[0]! + 1, parameterBounds[1]).trim();
  if (constraintBounds !== NO_MISMATCH) {
    paramName = pattern.slice(parameterBounds[0]! + 1, constraintBounds[0]).trim();
    constraint = pattern.slice(constraintBounds[0]! + 1, constraintBounds[1]).trim();
  }
  return {
    endIndex: parameterBounds[1]!,
    paramName: deleteEscapeCharacter(paramName),
    constraint: deleteEscapeCharacter(constraint),
  };
}

// 比较两个字符串是否相等，忽略转义字符。
export function compareString(a: string, b: string): boolean {
  return deleteEscapeCharacter(a) === deleteEscapeCharacter(b);
}

// 是否是最后一个参数，如果index的位置后面全是转义字符，也认为是最后一个字符。
export function isLastCharacter(pattern: string, index: number): boolean {
  if (index === pattern.length - 1) {
    return true;
  }
  for (let i = index+1; i< pattern.length; i++) {
    if (pattern[i] !== ESCAPE_CHAR) {
      return false;
    }
  }
  return true;
}

// 下个字符是否是指定的字符，并且这个字符不能被转义。
function matchesNextChar(pattern: string, charset: string[]): boolean {
  let count = 0;
  for (let i = 0; i < pattern.length; i++) {
    if (pattern[i] === ESCAPE_CHAR) {
      count++;
      continue;
    }
    if (charset.includes(pattern[i])) {
      // 如果是无效的转义字符，也是允许的。
      if (count % 2 === 1) {
        count = 0;
        continue
      }
      return count % 2 === 0;
    }
    return false;
  }
  return false;
}

// 判断字符串的指定位置字符是否有效。
export function noEscape(pattern: string, index: number): boolean {
  let count = 0;
  for (let i = index - 1; i >= 0; i--) {
    if (pattern[i] !== ESCAPE_CHAR) {
      break;
    }
    count++;
  }
  return count % 2 === 0;
}

// 寻找下一个特殊字符的位置，如果找不到则返回-1。
export function findNearestSpecialCharacter(pattern: string): number {
  const stack = [];
  for (let i = 0, len = pattern.length; i < len; i++) {
    if (pattern[i] === WILDCARD_CHAR && noEscape(pattern, i)) {
      // * 必须是最后一个字符。
      if (i !== len - 1) {
        throw new Error(
          `Invalid pattern syntax in pattern '${pattern}'. The ${i + 1}th character is incorrect; a '*' must be the last character.`
        );
      }
      // 找到 * 号，返回其索引。
      return i;
    }

    // 如果找到左边符号，则将索引添加到栈中。
    // 我们的目标是一个有效并且最小闭合的大括号。
    if (pattern[i] === CURLY_BRACES_START && noEscape(pattern, i)) {
      stack.push(i);
      continue;
    }
    // 找到右边的符号并且栈不为空。
    if (stack.length && pattern[i] === CURLY_BRACES_END && noEscape(pattern, i)) {
      // 判断下一个字符是否允许的分隔符，如果不是则抛出错误。
      if (i !== len - 1 && !matchesNextChar(pattern.slice(i + 1), PARAMETER_DELIMITER)) {
        throw new Error(
          `Invalid pattern syntax in pattern '${pattern}'. The ${i + 1}th character is incorrect; Named parameters must be separated by "-", ".", "/".`
        );
      }
      return stack.pop()!;
    }
  }
  return NO_MISMATCH;
}

// 寻找边界，返回索引。
export function findBounds(pattern: string, charset: Bounds, startIndex = 0): Ranges | -1 {
  const stack = [];
  for (let i = startIndex, len = pattern.length; i < len; i++) {
    if (pattern[i] === charset[0] && noEscape(pattern, i)) {
      stack.push(i);
      continue;
    }
    if (stack.length && pattern[i] === charset[1] && noEscape(pattern, i)) {
      return [stack.pop()!, i];
    }
  }
  return NO_MISMATCH;
}

// 找到第一个不匹配的字符，返回索引
// 注意内部从1开始遍历，因为使用它的地方是会先检查 0 是否匹配，如果匹配才会调用这个方法。
export function findFirstMismatchLetter(str1: string, str2: string): number {
  const LENGTH = Math.min(str1.length, str2.length);
  for (let i = 1; i < LENGTH; i++) {
    if (str1[i] !== str2[i]) {
      return i;
    }
  }
  return NO_MISMATCH;
}

// 寻找命名参数的结束字符，返回索引
export function findNamedParameterEndCharacter(path: string, startIndex = 0): number {
  for (let i = startIndex, len = path.length; i < len; i++) {
    if (i === len - 1) return i;
    if ([SLASH_DELIMITER, DOT_CHAR, HYPHEN_CHAR].includes(path[i]) && noEscape(path, i)) {
      return i;
    }
  }
  return NO_MISMATCH;
}

// 寻找下一个分隔符，并返回其索引
export function findNextDelimiter(path: string, startIndex = 0): number {
  for (let i = startIndex, len = path.length; i < len; i++) {
    if (path[i] === '/' && noEscape(path, i)) {
      return i;
    }
  }
  return NO_MISMATCH;
}
