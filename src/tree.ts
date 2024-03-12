import {CURLY_BRACES_START, NO_MISMATCH, NodeType, WILDCARD_CHAR} from './constant.js';
import {OrderedList} from './ordered-list.js';
import {
  deleteEscapeCharacter,
  findFirstMismatchLetter,
  findNamedParameterEndCharacter,
  findNearestSpecialCharacter,
  findNextDelimiter,
  parseNamedParameter,
} from './pattern.js';

export interface Matches<T> {
  value: T;
  params: Record<string, string>;
  constraint: Record<string, string>;
}

class ResolveContext<T> {
  public currIndex = 0;
  public value: T = null as unknown as T;
  public params: Record<string, string> = {};
  public constraint: Record<string, string> = {};

  toMatches(): Matches<T> {
    return {value: this.value, params: this.params, constraint: this.constraint};
  }
}

export interface NodeDescription {
  value: string;
  paramName: string;
  constraint: string;
  kind: 'static' | 'parameter' | 'wildcard';
}

function defaultFormat(node: NodeDescription): string {
  const type = `<${node.kind}>`;
  const parameter = `(${node.paramName}${node.constraint ? `<${node.constraint}>` : ''})`
  const value = `[value: ${node.value}]`;

  let description = type;
  if (node.kind !== 'static') description += ` ${parameter}`;
  if (node.value) description += ` ${value}`;
  return description;
}

// 节点可能没有边（单词结尾）
export class Node<T = unknown> {
  // 在基数树中的一段公共前缀。如果是动态节点，这里会是空字符串。
  public prefix: string = '';
  // 拥有更多子节点的优先级更高，这里表示该节点下存储了多少条数据。
  public priority: number = 0;
  // 节点类型。
  public kind: NodeType = NodeType.static;
  // 如果是命名参数节点，这里就是参数名
  public paramName: string = '';
  // 如果命名参数节点可能存在的约束字段
  public constraint: string = '';
  // 存储数据。
  public value: T = null as T;
  // 存储子节点。
  public children = new OrderedList<Node<T>>();
  // 表示这个节点是否是叶子节点。如果是一个叶子节点，那么就表示这个节点存储了数据。
  public isLeaf: boolean = false;

  // 创建静态节点。
  private createStaticNode(pattern: string): Node {
    for (const [index, child] of this.children.entries()) {
      // 跳过非静态节点
      if (child.kind !== NodeType.static) continue;
      if (child.prefix[0] !== pattern[0]) continue;
      // 寻找第一个不匹配的字符
      const splitIndex = findFirstMismatchLetter(child.prefix, pattern);
      // 完全匹配(或者是彼此的前缀。)
      if (splitIndex === NO_MISMATCH) {
        // 完全匹配-这个是修改的场景或者插入一个已注册pattern的前缀。
        if (child.prefix.length === pattern.length) {
          return child;
        }
        // 如果当前节点比要匹配的字符串长，则需要对此节点进行分裂.
        if (child.prefix.length > pattern.length) {
          // 创建一个新的节点作为父节点，将共同的前缀作为前缀。
          const parent = new Node<T>();
          parent.prefix = deleteEscapeCharacter(pattern);
          // 将修改当前节点的前缀为剩余的单词。
          child.prefix = child.prefix.substring(pattern.length);
          // 将修改后的节点作为父节点的子节点。
          parent.priority = child.priority + 1;
          parent.children.append(child);
          // 将父节点作为当前节点。
          this.children.replace(index, parent);
          return parent;
        }
        // 还有剩余的字符，需要匹配。剩下的字符需要用当前 child 去匹配。
        const node = child.createStaticNode(pattern.substring(child.prefix.length));
        if (!node.isLeaf) {
          child.priority++;
          child.children.sort();
        }
        return node;
      }
      // 存在公共前缀，需要将公共前缀作为新的节点。需要分拆当前节点并新增新的兄弟节点。
      // 新创建一个父节点。它不是叶子节点。
      const parent = new Node<T>();
      parent.prefix = deleteEscapeCharacter(pattern.substring(0, splitIndex));
      // 修改命中节点的前缀值，为提取前缀的剩余字符。
      child.prefix = child.prefix.substring(splitIndex);
      // 需要插入的剩余字符。
      const brother = new Node<T>();
      brother.prefix = deleteEscapeCharacter(pattern.substring(splitIndex));
      // 将当前节点和兄弟节点添加到新的父节点中。
      parent.priority = child.priority + 1 + (child.isLeaf ? 1 : 0);
      parent.children.append(child, brother);
      // 修改树指针
      this.children.replace(index, parent);
      return brother;
    }
    // 如果没有命中，则直接插入。
    const node = new Node<T>();
    node.prefix = deleteEscapeCharacter(pattern);
    this.children.append(node);
    return node;
  }

  // 创建命名参数节点。
  private createParameterNode(paramName: string, constraint: string): Node {
    const child = this.matchParamNode(paramName, constraint);
    if (child) return child;
    const node = new Node<T>();
    node.paramName = paramName;
    node.constraint = constraint;
    node.kind = NodeType.parameter;
    this.children.append(node);
    return node;
  }

  // 创建通配符节点。
  private createWildcardNode(paramName: string): Node {
    const child = this.matchWildcardNode(paramName);
    if (child) return child;
    const node = new Node<T>();
    node.paramName = paramName;
    node.kind = NodeType.wildcard;
    this.children.append(node);
    return node;
  }

  // 匹配剩余的静态节点。
  private matchStaticNode(pattern: string): Node[] | null {
    let currIndex = 0;
    let current: Node = this;
    const nodes: Node[] = [];
    while (currIndex < pattern.length && current !== null) {
      const rest = pattern.substring(currIndex);
      const children = Array.from(current.children.values()).filter(
        child => child.kind === NodeType.static
      );
      const child = children.find(child => rest.startsWith(child.prefix));
      // 不存在指定的 pattern，直接返回 null。
      if (!child) return null;
      // 完全相等，直接删除。
      if (pattern.length - currIndex === child.prefix.length) {
        nodes.push(child);
        return nodes;
      }
      nodes.push(child);
      // 还有剩余的字符，那么就继续匹配。
      current = child;
      currIndex += child.prefix.length;
    }
    return null;
  }

  // 匹配命名参数节点。
  private matchParamNode(paramName: string, constraint: string): Node | null {
    for (const child of this.children.values()) {
      if (child.kind !== NodeType.parameter || child.paramName !== paramName) continue;
      if (child.constraint !== constraint) continue;
      return child;
    }
    return null;
  }

  // 匹配通配符节点。
  private matchWildcardNode(paramName: string): Node | null {
    for (const child of this.children.values()) {
      // 这里如果类型一致，paramName 应该必然相同。
      if (child.kind !== NodeType.wildcard || child.paramName !== paramName) continue;
      return child;
    }
    return null;
  }

  // 新增或修改子节点。
  // 新增的 pattern 是模式字符串，value 是要保存的值，count 是通配符的数量。
  // 因为只是内部使用，所以 count 放在参数上了，可以默认 0 的。
  put(pattern: string, value: unknown, count: number): void {
    const nextIndex = findNearestSpecialCharacter(pattern);
    // 如果不存在命名参数和通配符
    if (nextIndex === NO_MISMATCH) {
      // 直接插入静态节点
      const node = this.createStaticNode(pattern);
      if (node.isLeaf) throw new Error('pattern already exists');
      this.priority++;
      this.children.sort();
      node.isLeaf = true;
      node.value = value;
      return;
    }

    // 新增并插入一个中间节点。
    const parent = this.createStaticNode(pattern.substring(0, nextIndex));

    // 如果下一个字符是命名参数，则创建参数节点。
    if (pattern[nextIndex] === CURLY_BRACES_START) {
      const {paramName, constraint, endIndex} = parseNamedParameter(pattern.slice(nextIndex));
      const node = parent.createParameterNode(paramName, constraint);
      if (nextIndex + endIndex === pattern.length - 1) {
        // 已存在的节点，前面不会导致树结构改变。
        if (node.isLeaf) throw new Error('pattern already exists');

        // 检查是否存在相似的 pattern 。
        // 如：/user/{id} 和 /user/{name} 或者 /user/* 这样的 pattern。
        // 它们是相似的，因为命名参数和通配符的匹配边界存在重合即都匹配到 /，在匹配的时候只能靠优先级匹配，就永远只会匹配中其中的一个。
        for (const child of parent.children.values()) {
          if (child !== node && child.kind !== NodeType.static && child.isLeaf) {
            throw new Error('a similar pattern already exists.');
          }
        }

        node.isLeaf = true;
        node.value = value;
        this.priority++;
        this.children.sort();
        parent.priority++;
        parent.children.sort();
        return;
      }
      node.put(pattern.substring(nextIndex + endIndex + 1), value, count);
      this.priority++;
      this.children.sort();
      parent.priority++;
      parent.children.sort();
      return;
    }

    // 如果下一个字符是通配符，则创建通配符节点。
    if (pattern[nextIndex] === WILDCARD_CHAR) {
      const node = parent.createWildcardNode(count + '*');
      if (nextIndex === pattern.length - 1) {
        if (node.isLeaf) throw new Error('pattern already exists');
        // 检查是否存在相似的 pattern 。
        // 如：/user/{id} 和 /user/{name} 或者 /user/* 这样的 pattern。
        // 它们是相似的，因为命名参数和通配符的匹配边界存在重合即都匹配到 /，在匹配的时候只能靠优先级匹配，就永远只会匹配中其中的一个。
        for (const child of parent.children.values()) {
          if (child !== node && child.kind !== NodeType.static && child.isLeaf) {
            throw new Error('a similar pattern already exists.');
          }
        }
        node.isLeaf = true;
        node.value = value;
        this.priority++;
        parent.priority++;
        this.children.sort();
        parent.children.sort();
        return;
      }
      node.put(pattern.substring(nextIndex + 1), value, count + 1);
      this.priority++;
      parent.priority++;
      this.children.sort();
      parent.children.sort();
      return;
    }
    throw new Error('不可达');
  }

  // 匹配节点。
  matchNodes(pattern: string, count = 1): Node[] | null {
    const nodes: Node[] = [];
    const nextIndex = findNearestSpecialCharacter(pattern);
    // 如果剩下的部分都是静态节点。
    if (nextIndex === NO_MISMATCH) return this.matchStaticNode(pattern);
    // 下个参数节点前的静态节点。
    const matches = this.matchStaticNode(pattern.substring(0, nextIndex));
    if (matches === null) return null;
    nodes.push(...matches);
    const parentNode = nodes[nodes.length - 1];
    // 匹配参数节点。
    if (pattern[nextIndex] === CURLY_BRACES_START) {
      const {paramName, constraint, endIndex} = parseNamedParameter(pattern.slice(nextIndex));
      const node = parentNode.matchParamNode(paramName, constraint);
      if (node === null) return null;
      nodes.push(node);
      if (nextIndex + endIndex === pattern.length - 1) return nodes;
      const matches = node.matchNodes(pattern.substring(nextIndex + endIndex + 1), count);
      if (matches === null) return null;
      return nodes.concat(matches);
    }

    // 匹配通配符节点。
    if (pattern[nextIndex] === WILDCARD_CHAR) {
      const node = parentNode.matchWildcardNode(count + '*');
      if (node === null) return null;
      nodes.push(node);
      if (nextIndex === pattern.length - 1) return nodes;
      const matches = node.matchNodes(pattern.substring(nextIndex + 1), count + 1);
      if (matches === null) return null;
      return nodes.concat(matches);
    }
    // 代码不该走到这里。
    // console.warn('不可达');
    return null;
  }

  // 匹配字符串
  // 内部采用递归的方式处理。
  // 这里的 pattern 是目标字符串，currIndex 是当前匹配到的索引。
  // 因为只是内部内部使用，所以 currIndex 放在参数上了，可以默认 0 的。
  match(path: string, context: ResolveContext<T>): boolean {
    // 匹配子节点，只有上层节点已经命中才会进入子节点匹配。
    for (const child of this.children.values()) {
      // 如果当前节点是一个静态节点。
      if (child.kind === NodeType.static) {
        // 如果当前节点的前缀不是剩余字符的前缀，则当前子节点匹配失败。
        if (!path.substring(context.currIndex).startsWith(child.prefix)) {
          continue;
        }
        // 如果剩余部分与当前节点的前缀长度相同，则匹配成功。
        if (path.substring(context.currIndex) === child.prefix) {
          if (child.isLeaf) {
            context.value = child.value;
            return true;
          }
          // 如果此节点不是叶子节点，则这个 pattern 并没有注册。
          return false;
        }
        // 递归匹配子节点。
        context.currIndex += child.prefix.length;
        const result = child.match(path, context);
        // 如果匹配成功，则将结果返回。
        if (result) return true;
        return false;
      }
      // 如果当前节点是命名参数节点。
      // 命名参数的匹配规则是：
      //    命名参数的结束必须是："/"、"-"、 "." 或者字符串结尾。
      //    需要考虑转义字符。
      //    不用考虑前一个是什么字符，因为前一个节点已经匹配成功了。
      if (child.kind === NodeType.parameter) {
        // 一直匹配字符，直到遇到: "/"、"-"、 "." 或者到字符串结尾。
        const lastIndex = findNamedParameterEndCharacter(path, context.currIndex);
        // 如果没有匹配到，则匹配失败。
        if (lastIndex === NO_MISMATCH) {
          continue;
        }
        // 匹配成功，将命名参数的值保存到params中。
        context.params[child.paramName] = path.substring(context.currIndex, lastIndex + 1);
        if (child.constraint) {
          context.constraint[child.paramName] = child.constraint;
        }
        // 如果没有剩余需要匹配的字符，则匹配成功。
        if (lastIndex === path.length - 1) {
          if (child.isLeaf) {
            context.value = child.value;
            return true;
          }
          return false;
        }
        // 还有剩余字符，继续匹配子节点。
        context.currIndex = lastIndex;
        const result = child.match(path, context);
        // 如果匹配成功，则将结果返回。
        if (result) return true;
        // 子节点未匹配成功。
        // 命名参数的优先级更高，这里匹配失败可以接着尝试使用通配符匹配。
        continue;
      }
      // 如果当前节点是通配符。
      // 统配符的匹配规则是：
      //    通配符可以匹配剩余的全部，也可以仅匹配到下一个 "/"。
      //    需要考虑转义字符。
      if (child.kind === NodeType.wildcard) {
        // 寻找最近的结束位置，即下一个 "/"。
        const lastIndex = findNextDelimiter(path, context.currIndex);
        // 如果没有下一个 "/" 字符，那么就只能是匹配剩余的全部。
        if (lastIndex === NO_MISMATCH) {
          if (child.isLeaf) {
            context.value = child.value;
            context.params[child.paramName] = path.substring(context.currIndex, lastIndex);
            return true;
          }
          return false;
        }
        // 存在下一个 "/" 字符，则优先尝试精确匹配。
        // 这里不检查是否存在子节点，因为结果是一样的。
        const previousIndex = context.currIndex;
        context.currIndex = lastIndex;
        const result = child.match(path, context);
        // 如果精确匹配成功，则将结果返回。
        if (result) {
          // 精确匹配成功，将通配符的值保存到 params 中。
          context.params[child.paramName] = path.substring(context.currIndex, lastIndex);
          return true;
        }
        // 匹配失败，将索引还原。
        context.currIndex = previousIndex;
        // 如果精确匹配失败，则尝试通配符匹配。
        if (child.isLeaf) {
          context.value = child.value;
          context.params[child.paramName] = path.substring(context.currIndex);
          return true;
        }
        return false;
      }
    }
    return false;
  }

  // 删除一个 pattern。
  // 如果真正删除了一个节点，返回 1 否则返回 0。
  remove(pattern: string): 0 | 1 {
    const result = this.matchNodes(pattern);
    if (result === null || result.length === 0) return 0;
    let current = result.pop()!;
    // 不是叶子节点，就是这个 pattern 不存在。
    if (!current.isLeaf) return 0;
    current.value = null;
    current.isLeaf = false;
    const nodes = [this as Node].concat(result);

    for (let i = nodes.length - 1; i >= 0; i--) {
      if (nodes[i].priority > 0) {
        nodes[i].priority--;
      }
    }

    for (let i = nodes.length - 1; i >= 0; i--) {
      const parent = nodes[i];
      if (current.children.length > 1) return 1;

      // 如果该节点只有一个子节点，且是叶子节点，则删除该节点。
      if (current.children.length === 0 && !current.isLeaf) {
        parent.children.remove(current);
        current = parent;
        continue;
      }

      // 如果该节点只有一个子节点，且不是叶子节点，则删除该节点。
      // 此时会触发节点合并。需要将该节点的前缀与其子节点合并，并用其子节点替代该节点的位置。
      // 非静态节点不参与合并和分裂。
      if (current.children.length === 1 && !current.isLeaf && current.kind === NodeType.static) {
        const child = current.children.first()!;
        // 如果剩下的节点不是静态节点，则退出。非静态节点不能合并。
        if (child.kind !== NodeType.static) return 1;
        parent.children.remove(current);
        child.prefix = current.prefix + child.prefix;
        parent.children.append(child);
      }

      current = parent;
    }
    // 正常应该不会走到这里。
    return 1;
  }
}

/**
 * 基于基数树的路由树。
 * 它将命名参数和通配符都化做一个单独的特殊节点："参数节点"。
 * 它与普通的基数树的差别是，所以得参数节点都会单独出一个节点，不会合并到一起。
 * 其本质是将命名参数和通配符认定为一个单独的"字符"，也就是每个参数节点都是一个单独的节点，只在参数节点的特征一致时才会命中。
 */
export class Tree<T> {
  private length = 0;
  private root = new Node<T>();

  put(pattern: string, value: T) {
    this.root.put(pattern, value, 1);
    this.length++;
  }

  has(pattern: string): boolean {
    const nodes = this.root.matchNodes(pattern);
    return nodes !== null
  }

  match(path: string): Matches<T> | null {
    const context = new ResolveContext<T>();
    if (!this.root.match(path, context)) return null;
    return context.toMatches();
  }

  remove(pattern: string): 0 | 1 {
    const result = this.root.remove(pattern);
    if (result == 1) this.length--;
    return result;
  }

  size(): number {
    return this.length;
  }

  clear() {
    this.length = 0;
    this.root = new Node<T>();
  }

  print(format?: (node: NodeDescription) => string): string {
    const result = [];
    const formatFn = format || defaultFormat;
    const stack = [{prefix: '', parentPrefix: '', node: this.root}];
    while (stack.length) {
      const {prefix, parentPrefix, node} = stack.pop()!;
      const children = node.children;
      const maxIndex = children.length - 1;
      const description: NodeDescription = {
        kind: node.kind === NodeType.parameter ? 'parameter' : node.kind === NodeType.wildcard ? 'wildcard' : 'static',
        value: node.value as any,
        paramName: node.paramName,
        constraint: node.constraint,
      }
      if (node === this.root) {
        result.push(`root`);
      } else {
        result.push(`${prefix} ${formatFn(description)}`);
      }
      for (let i = maxIndex; i >= 0; i--) {
        const child = children.at(i);
        const isLastNode = i === maxIndex;
        const nodePrefix = isLastNode ? '└── ' : '├── ';
        const childPrefix = isLastNode ? '    ' : '│   ';
        let text = child.prefix;
        if (child.kind === NodeType.parameter) {
          const constraint = child.constraint ? `<${child.constraint}>` : '';
          text = `{${child.paramName}${constraint}}`;
        }
        if (child.kind === NodeType.wildcard) {
          text = `*`;
        }
        stack.push({
          node: child,
          parentPrefix: parentPrefix + childPrefix,
          prefix: `${parentPrefix + nodePrefix}${text}`,
        });
      }
    }
    return result.join('\n');
  }
}
