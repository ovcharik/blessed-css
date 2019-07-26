import NodeStyle from "./node-style";
import NodeTree from "./node-tree";
import { createLensByPath } from "./utils/lens";
import { memoize } from "./utils/memoize";

export type NodeStatePatchType =
  | "attrs"
  | "focus"
  | "hover"
  | "select"
  | "tree"
  | "children";

export type NodeStateGroup = "attrs" | "input" | "tree" | "children";

export type NodeStateArg = string | number | boolean;
export type NodeStateDetail = [string, NodeStateArg];
export type NodeStateValue = {
  [group in NodeStateGroup]?: {
    [key: string]: NodeStateArg;
  };
};

export interface NodeStatePatch {
  type: NodeStatePatchType;
  value?: any;
}

export default class NodeState {
  public get value() {
    return this.current;
  }
  public get hasChanges() {
    return this.previous !== this.current;
  }
  @memoize((ctx, x) => x)
  private static lens(path: string) {
    return createLensByPath<NodeStateValue, NodeStateArg>(path);
  }

  private previous?: NodeStateValue;
  private current: NodeStateValue = {};

  private groupDetails: {
    [method in NodeStateGroup]: (
      nodeStyle: NodeStyle,
      nodeTree: NodeTree,
      patch: NodeStatePatch
    ) => NodeStateDetail[];
  } = {
    attrs(nodeStyle, nodeTree, patch) {
      return [
        ["id", nodeStyle.nodeId],
        ["node", nodeStyle.nodeType],
        ["class", nodeStyle.nodeClass]
      ];
    },

    input(nodeStyle, nodeTree, patch) {
      return [[patch.type, patch.value]];
    },

    tree(nodeStyle, nodeTree, patch) {
      return nodeTree.isRoot
        ? []
        : [
            ["nodeIndex", nodeTree.nodeIndex],
            ["nodeTotal", nodeTree.nodeTotal],
            ["typeIndex", nodeTree.typeIndex],
            ["typeTotal", nodeTree.typeTotal],
            ["listIndex", nodeTree.listIndex],
            ["listTotal", nodeTree.listTotal],
            ["listSelected", nodeTree.listSelected]
          ];
    },

    children(nodeStyle, nodeTree, patch) {
      return [["total", nodeTree.childrenTotal]];
    }
  };

  public constructor(private nodeStyle: NodeStyle) {}

  public save() {
    this.previous = this.current;
  }

  public commit(patch: NodeStatePatch) {
    this.patchToDetails(patch).forEach(([path, value]) => {
      const lens = NodeState.lens(path);
      this.current = lens.set(this.current, value);
    });
  }

  private patchToDetails(patch: NodeStatePatch): NodeStateDetail[] {
    const group = this.patchToGroup(patch);
    const details = this.groupDetails[group](
      this.nodeStyle,
      this.nodeStyle.nodeTree,
      patch
    );
    return details.map<NodeStateDetail>(([path, value]) => {
      return [`${group}.${path}`, value];
    });
  }

  private patchToGroup(patch: NodeStatePatch): NodeStateGroup {
    switch (patch.type) {
      case "focus":
      case "hover": {
        return "input";
      }
      case "select": {
        return "tree";
      }
      default: {
        return patch.type;
      }
    }
  }
}
