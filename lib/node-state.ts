import { Widgets } from "blessed";
import NodeStyle from "./node-style";
import { memoize } from "./utils/memoize";
import { createLensByPath } from "./utils/lens";

export type NodeStatePatchType =
  | "attrs"
  | "focus"
  | "hover"
  | "select"
  | "node"
  | "children";

export type NodeStateGroup = "attrs" | "input" | "node" | "children";

export type NodeStateDetail = [string, any];
export type NodeStateValue = { [group in NodeStateGroup]?: any };

export interface NodeStatePatch {
  type: NodeStatePatchType;
  value?: any;
}

export default class NodeState {
  @memoize((ctx, x) => x)
  private static lens(path: string) {
    return createLensByPath(path);
  }

  private previous?: NodeStateValue;
  private current: NodeStateValue = {};

  public get value() {
    return this.current;
  }
  public get hasChanges() {
    return this.previous !== this.current;
  }

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
    const details = this.groupDetails[group](this.nodeStyle, patch);
    return details.map<NodeStateDetail>(([path, value]) => {
      return [`${group}.${path}`, value];
    });
  }

  private patchToGroup(patch: NodeStatePatch): NodeStateGroup {
    switch (patch.type) {
      case "focus":
      case "hover":
      case "select": {
        return "input";
      }
      default: {
        return patch.type;
      }
    }
  }

  private groupDetails: {
    [method in NodeStateGroup]: (
      nodeStyle: NodeStyle,
      patch: NodeStatePatch,
    ) => NodeStateDetail[]
  } = {
    attrs(nodeStyle, patch) {
      return [
        ["id", nodeStyle.nodeId],
        ["node", nodeStyle.nodeType],
        ["class", nodeStyle.nodeClass],
      ];
    },

    input(nodeStyle, patch) {
      return [[patch.type, patch.value]];
    },

    node(nodeStyle, patch) {
      if (!nodeStyle.pNode) {
        return [];
      }
      const node = nodeStyle.node;
      const pNode = nodeStyle.pNode;
      const children = pNode.children;
      const childrenType = children.filter((x) => x.type === node.type);

      const [totalList, indexList, selected] =
        pNode instanceof Widgets.ListElement
          ? [
              pNode.getLines(),
              pNode.getItemIndex(node as Widgets.BlessedElement),
              (pNode as any).selected as number,
            ]
          : [0, -1, 0];

      return [
        ["index", children.indexOf(node)],
        ["total", children.length],
        ["indexType", childrenType.indexOf(node)],
        ["totalType", childrenType.length],
        ["indexList", indexList],
        ["totalList", totalList],
        ["isSelected", selected === indexList],
      ];
    },

    children(nodeStyle, patch) {
      return [["total", nodeStyle.node.children.length]];
    },
  };
}
