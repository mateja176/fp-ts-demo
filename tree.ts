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

type NodeRecord = Record<string, Node>;

const mapNodeIdsToTrees = (nodeRecord: NodeRecord) => (
  children: Node['children'],
): fp.tree.Forest<Node['name'] | Error> =>
  fp.function.pipe(
    children,
    fp.array.map((id: Node['id']) => {
      const node = nodeRecord[id];

      return fp.tree.make(
        node.name,
        mapNodeIdsToTrees(nodeRecord)(node.children),
      );
    }),
  );

const mapNodesToTree = (nodeRecord: NodeRecord) => (root: Node): NameTree =>
  fp.tree.make(root.name, mapNodeIdsToTrees(nodeRecord)(root.children));

fp.function.pipe(
  nodes,
  fp.either.fold(console.error, (nodes) => {
    const root = fp.function.pipe(
      nodes,
      fp.array.findFirst(({ parent }: Node) => parent === null),
    );

    const nodeRecord = fp.function.pipe(
      nodes,
      fp.array.reduce({}, (record: NodeRecord, node) => ({
        ...record,
        [node.id]: node,
      })),
    );

    fp.function.pipe(
      root,
      fp.option.fold(
        () => console.error('No root node.'),
        fp.function.flow(
          mapNodesToTree(nodeRecord),
          (tree) => JSON.stringify(tree, null, 2),
          console.log,
        ),
      ),
    );
  }),
);
