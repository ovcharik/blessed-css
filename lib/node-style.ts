import { Widgets } from "blessed";
import BlessedCss from "./blessed-css";
import Stylesheet from "./stylesheet";
import NodeState, { NodeStatePatch } from "./node-state";
import { PseudoArgumentArgs } from "./utils/selector-meta-pseudo";
import { memoize } from "./utils/memoize";
import { SelectorBasicType } from "./selector";
import NodeTree from "./node-tree";

type NodeStyleSelectorParts = Record<string, PseudoArgumentArgs>;
type NodeStyleSelector = { [T in SelectorBasicType]?: NodeStyleSelectorParts };

export interface NodeStyleOptions {
  blessedCss: BlessedCss;
  stylesheet: Stylesheet;
}

export default class NodeStyle {
  @memoize((ctx, x) => x, true)
  private static get(
    node: Widgets.Node,
    options?: NodeStyleOptions,
  ): NodeStyle {
    if (!options) {
      throw new Error("Try getting nodeStyle without options");
    }
    return new NodeStyle(node, options);
  }

  // static
  public static render(node: Widgets.Node, options: NodeStyleOptions) {
    const nodeStyle = NodeStyle.get(node, options);
    return nodeStyle && nodeStyle.render();
  }

  public static commit(
    node: Widgets.Node,
    patch: NodeStatePatch,
    options: NodeStyleOptions,
  ) {
    const nodeStyle = NodeStyle.get(node, options);
    return nodeStyle && nodeStyle.commit(patch);
  }

  // getters
  public get nodeTree(): NodeTree {
    return NodeTree.get(this.node);
  }

  public get parent(): NodeStyle | undefined {
    const { parent } = this.nodeTree;
    return parent ? NodeStyle.get(parent.node) : void 0;
  }
  public get prev(): NodeStyle | undefined {
    const { prev } = this.nodeTree;
    return prev ? NodeStyle.get(prev.node) : void 0;
  }
  public get next(): NodeStyle | undefined {
    const { next } = this.nodeTree;
    return next ? NodeStyle.get(next.node) : void 0;
  }

  public get nodeId(): string {
    return ((this.node.options || {}) as { id: string }).id;
  }
  public get nodeType(): string {
    return this.node.type;
  }
  public get nodeClass(): string {
    return ((this.node.options || {}) as { class: string }).class;
  }

  // properties
  private readonly nodeState: NodeState = new NodeState(this);

  private readonly blessedCss: BlessedCss;
  private readonly stylesheet: Stylesheet;

  private isRendering: boolean = false;

  constructor(
    public readonly node: Widgets.Node,
    public readonly options: NodeStyleOptions,
  ) {
    this.blessedCss = options.blessedCss;
    this.stylesheet = options.stylesheet;
  }

  public render(): undefined {
    this.isRendering = true;
    // render children
    this.node.children.forEach((node) => {
      NodeStyle.render(node, this.options);
    });
    // not render screen and not render previous state
    if (this.nodeType === "screen") {
      this.isRendering = false;
      return;
    }
    // apply all css properties
    this.stylesheet.getProperties(this).forEach((property) => {
      property.apply(this.node as Widgets.BlessedElement, property.value);
    });
    this.nodeState.save();
    this.isRendering = false;
  }

  public commit(patch: NodeStatePatch) {
    // TODO: listen attrs events
    this.nodeState.commit({ type: "attrs" });
    this.nodeState.commit(patch);
    // not send changes to children while style rendering
    if (this.isRendering) {
      return;
    }
    // notify all children
    this.node.children.forEach((node) => {
      NodeStyle.commit(node, { type: "tree" }, this.options);
    });
    this.blessedCss.render(this);
  }

  @memoize((ctx) => ctx.nodeState.value, true)
  public get selector(): NodeStyleSelector {
    const { attrs, input, tree, children } = this.nodeState.value;

    type Part<T> = [SelectorBasicType, T, PseudoArgumentArgs?];
    const parts: Array<Part<string>> = [];
    const push = (...rows: Array<Part<any>>) => {
      return parts.push(...rows.filter((x) => x[1]));
    };

    // base node attrs: nodeName, id, classes
    if (attrs) {
      const { node, id, class: classes = "" } = attrs as Record<string, string>;
      push(
        ["node", node],
        ["id", id],
        ...classes
          .split(/\s/)
          .filter(Boolean)
          .filter((x, i, a) => i === a.indexOf(x)) // unique
          .map<Part<any>>((value) => ["class", value]),
      );
    }

    // effects from user input
    if (input) {
      push(
        ["pseudo", input.hover && "hover"],
        ["pseudo", input.focus && "focus"],
      );
    }

    // node has't parent (root element)
    if (!tree) {
      push(["pseudo", "root"]);
    }

    // node position in tree
    if (tree) {
      // prettier-ignore
      const {
        nodeIndex, nodeTotal,
        typeIndex, typeTotal,
        listIndex, listTotal, listSelected,
      } = tree as Record<string, number>;

      push(
        ["pseudo", nodeIndex === 0 && "first-child"],
        ["pseudo", nodeTotal === 0 && "only-child"],
        ["pseudo", nodeIndex === nodeTotal && "last-child"],
        ["pseudo", "nth-child", [nodeIndex + 1]],
        ["pseudo", "nth-last-child", [nodeTotal - nodeIndex]],
      );

      push(
        ["pseudo", typeIndex === 0 && "first-of-type"],
        ["pseudo", typeTotal === 0 && "only-of-type"],
        ["pseudo", typeIndex === typeTotal && "last-of-type"],
        ["pseudo", "nth-of-type", [typeIndex + 1]],
        ["pseudo", "nth-last-of-type", [typeTotal - typeIndex]],
      );

      push(
        ["pseudo", listIndex === 0 && "first-in-list"],
        ["pseudo", listTotal === 0 && "only-in-list"],
        ["pseudo", listIndex === listTotal && "last-in-list"],
        ["pseudo", "nth-in-list", [listIndex + 1]],
        ["pseudo", "nth-last-in-list", [listTotal - listIndex]],
        ["pseudo", listSelected === listIndex && "selected"],
      );
    }

    // node children
    if (children) {
      push(["pseudo", children.total <= 0 && "empty"]);
    }

    // reduce result selector
    return parts.reduce(
      (selector, [type, value, args = []]) => {
        selector[type] = { ...selector[type], [value]: args };
        return selector;
      },
      {} as NodeStyleSelector,
    );
  }
}
