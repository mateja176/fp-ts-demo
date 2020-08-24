import * as fp from 'fp-ts';
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

type NameTree = fp.tree.Tree<Node['name'] | Error>;

const reduce = (nodes: NodeArray) => (
  children: Node['children'],
): fp.tree.Forest<Node['name'] | Error> =>
  fp.function.pipe(
    children,
    fp.array.map((id: Node['id']) => {
      const node = fp.function.pipe(
        nodes,
        fp.array.findFirst((node: Node) => node.id === id),
      );

      return fp.function.pipe(
        node,
        fp.option.fold(
          () => fp.tree.tree.of(new Error(`Cannot find node by id "${id}"`)),
          (node) => fp.tree.make(node.name, reduce(nodes)(node.children)),
        ),
      );
    }),
  );

const mapNodesToTree = (nodes: NodeArray) => (root: Node) => {
  const nameTree: NameTree = fp.tree.make(
    root.name,
    reduce(nodes)(root.children),
  );

  return nameTree;
};

fp.function.pipe(
  nodes,
  fp.either.fold(console.error, (nodes) => {
    const root = fp.function.pipe(
      nodes,
      fp.array.findFirst(({ parent }: Node) => parent === null),
    );

    fp.function.pipe(
      root,
      fp.option.fold(
        () => console.error('No root node.'),
        fp.function.flow(
          mapNodesToTree(nodes),
          (tree) => JSON.stringify(tree, null, 2),
          console.log,
        ),
      ),
    );
  }),
);
