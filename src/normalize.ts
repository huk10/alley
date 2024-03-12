export interface NormalOptions {
  // 是否忽略尾斜杠
  ignoreTrailingSlash?: boolean;
  // 是否忽略重复的斜杠
  ignoreDuplicateSlashes?: boolean;
  // 是否大小写敏感
  caseSensitive?: boolean;
}

export function normalize(path: string, options: Partial<NormalOptions> = {}) {
  const {caseSensitive = false, ignoreTrailingSlash = true, ignoreDuplicateSlashes = true} = options;

  let result = path;
  if (!caseSensitive) {
    result = result.toLowerCase();
  }
  if (ignoreTrailingSlash) {
    result = result.replace(/\/+$/, '');
  }
  if (ignoreDuplicateSlashes) {
    result = result.replace(/\/+/g, '/');
  }
  if (result[0] !== '/') {
    result = '/' + result;
  }
  return result;
}
