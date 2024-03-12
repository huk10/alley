export const SPACE = " "
export const DOT_CHAR = '.';
export const HYPHEN_CHAR = '-';
export const ESCAPE_CHAR = '\\';
export const WILDCARD_CHAR = '*';
export const SLASH_DELIMITER = '/';
export const NAMED_PARAMETER = ':';
export const PAREN_THESES_END = ')';
export const PAREN_THESES_START = '(';
export const CURLY_BRACES_END = "}"
export const CURLY_BRACES_START = "{"
export const ANGLE_BRACKETS_END = '>';
export const ANGLE_BRACKETS_START = '<';

export type Bounds = [string, string];
export type Ranges = [number, number];

export const PARAMETER_BOUNDS = [CURLY_BRACES_START, CURLY_BRACES_END] as Bounds;
export const CONSTRAINT_BOUNDS = [ANGLE_BRACKETS_START, ANGLE_BRACKETS_END] as Bounds;

export const PARAMETER_DELIMITER= [DOT_CHAR, HYPHEN_CHAR, SLASH_DELIMITER];

export const NO_MISMATCH = -1 as const;

export enum NodeType {
  static = 0,
  wildcard = 2,
  parameter = 1,
}
