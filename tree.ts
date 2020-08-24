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

interface Tree {
  [key: string]: {} | Tree;
}

const fold = (nodes: NodeArray, children: Node['children']): Tree =>
  children.reduce((tree, nodeId) => {
    const node = nodes.find(({ id }) => id === nodeId);

    if (node) {
      return { ...tree, [node.name]: fold(nodes, node.children) };
    } else {
      throw new Error(`Cannot find node by id "${nodeId}"`);
    }
  }, {} as Tree);

if (isRight(nodes)) {
  const root = nodes.right.find((node) => node.parent === null);

  if (root) {
    console.log(JSON.stringify(fold(nodes.right, [root.id]), null, 2));
  } else {
    console.error('No root node.');
  }
} else {
  console.error('Invalid JSON.');
}
