import * as fp from 'fp-ts';
import { isRight } from 'fp-ts/lib/These';
import * as io from 'io-ts';
import treeJSON from './tree.json';

interface Node {
  id: number;
  name: string;
  children: number[];
  parent: number | null;
}

type NodeArray = Node[];

const NodeType = io.type({
  id: io.number,
  name: io.string,
  children: io.array(io.number),
  parent: io.union([io.null, io.number]),
});

const NodeArrayType = io.array(NodeType);

const nodes = NodeArrayType.decode(treeJSON);

type NameTree = fp.tree.Tree<Node['name']>;

const reduce = (
  nodes: NodeArray,
  children: Node['children'],
): fp.tree.Forest<Node['name']> =>
  fp.array.map((id: Node['id']) => {
    const node = fp.array.findFirst((node: Node) => node.id === id)(nodes);

    if (fp.option.isSome(node)) {
      return fp.tree.make(node.value.name, reduce(nodes, node.value.children));
    } else {
      throw new Error(`Cannot find node by id "${id}"`);
    }
  })(children);

if (isRight(nodes)) {
  const root = fp.array.findFirst(({ parent }: Node) => parent === null)(
    nodes.right,
  );

  if (fp.option.isSome(root)) {
    const nameTree: NameTree = fp.tree.make(
      root.value.name,
      reduce(nodes.right, root.value.children),
    );

    console.log(JSON.stringify(nameTree, null, 2));
  } else {
    console.error('No root node.');
  }
} else {
  console.error('Invalid JSON.');
}
