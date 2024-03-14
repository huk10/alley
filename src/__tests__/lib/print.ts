import {NodeType} from '../../constant.js';
import {Node, Tree} from '../../tree.js';

function nodeTypeString(kind: NodeType): string {
  switch (kind) {
    case NodeType.static:
      return 'static';
    case NodeType.parameter:
      return 'parameter';
    case NodeType.wildcard:
      return 'wildcard';
    default:
      return 'unknown';
  }
}

function displayNodeName(node: Node<any>): string {
  let text = node.prefix;
  if (node.kind === NodeType.parameter) {
    const constraint = node.constraint ? `<${node.constraint}>` : '';
    text = `{${node.paramName}${constraint}}`;
  }
  if (node.kind === NodeType.wildcard) {
    text = `*`;
  }
  return text;
}

function nodeDescription(node: Node<any>): string {
  const priority = `[priority: ${node.priority}]`
  const type = `<${nodeTypeString(node.kind)}>`;
  const parameter = `(${node.paramName}${node.constraint ? `<${node.constraint}>` : ''})`
  const value = `[value: ${node.value}]`;

  let description = type;
  if (node.priority) description+= ` ${priority}`;
  if (node.kind !== NodeType.static) description += ` ${parameter}`;
  if (node.value) description += ` ${value}`;
  return description;
}

export function printWithTest(tree: Tree<any>): string[] {
  const result = [];
  const stack = [{prefix: '', parentPrefix: '', node: (tree as any).root}];
  while (stack.length) {
    const {prefix, parentPrefix, node} = stack.pop()!;
    const children = node.children;
    const maxIndex = children.length - 1;
    if (node !== (tree as any).root) {
      result.push(`${prefix} ${nodeDescription(node)}`);
    } else {
      result.push(`root` + ((tree as any).root.priority > 0 ? ` [priority: ${(tree as any).root.priority}]` : ''));
    }
    for (let i = maxIndex; i >= 0; i--) {
      const child = children.at(i);
      const isLastNode = i === maxIndex;
      const nodePrefix = isLastNode ? '└── ' : '├── ';
      const childPrefix = isLastNode ? '    ' : '│   ';
      stack.push({
        node: child,
        parentPrefix: parentPrefix + childPrefix,
        prefix: `${parentPrefix + nodePrefix}${displayNodeName(child)}`,
      });
    }
  }
  return result;
}
