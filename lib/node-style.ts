import { Widgets } from "blessed";
import BlessedCss from "./blessed-css";
import Stylesheet from "./stylesheet";
import NodeState, { NodeStatePatch } from "./node-state";
import { memoize } from "./utils/memoize";
import { SelectorBasicType } from "./selector";

type NodeStyleSelector = {
  [T in SelectorBasicType]?: {
    [value: string]: any[] | undefined;
  }
};

interface NodeStyleOptions {
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
  public get index(): number {
    return this.pNode ? this.pNode.children.indexOf(this.node) : -1;
  }

  public get pNode(): Widgets.Node {
    return this.node.parent;
  }
  public get lNode(): Widgets.Node {
    return this.pNode && this.pNode.children[this.index - 1];
  }
  public get rNode(): Widgets.Node {
    return this.pNode && this.pNode.children[this.index + 1];
  }

  public get pStyle(): NodeStyle {
    return NodeStyle.get(this.pNode);
  }
  public get lStyle(): NodeStyle {
    return NodeStyle.get(this.lNode);
  }
  public get rStyle(): NodeStyle {
    return NodeStyle.get(this.rNode);
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

  public render(): void {
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
      NodeStyle.commit(node, { type: "node" }, this.options);
    });
    this.blessedCss.render(this);
  }

  @memoize((ctx) => ctx.nodeState.value, true)
  public get selector(): NodeStyleSelector {
    const { attrs, input, node, children } = this.nodeState.value;
    return {};
  }

  // // Data
  // _buildSelector() {
  //   const result = [];
  //   const { attrs, input, node, children } = this.state;

  //   // base attrs
  //   if (attrs) {
  //     result.push(
  //       { type: 'node', value: attrs.node },
  //       { type: 'id'  , value: attrs.id   },
  //       ...(attrs.class || '')
  //         .trim().split(/[\s\t]+/g)                // clear spaces
  //         .filter((c, i, a) => i === a.indexOf(c)) // unique
  //         .map(c => ({ type: 'class', value: c })) // format
  //     );
  //   }

  //   // input effect
  //   if (input) {
  //     result.push(
  //       { type: 'pseudo', value: input.hover && 'hover' },
  //       { type: 'pseudo', value: input.focus && 'focus' }
  //     );
  //   }

  //   // node position
  //   if (node) {
  //     const {
  //       index:ai, total:at,
  //       indexType:ti, totalType:tt,
  //       indexList:li, totalList:lt,
  //     } = node;
  //     result.push(
  //       { type: 'pseudo', value: (ai ===  0) && 'first-child'   },
  //       { type: 'pseudo', value: (ai === at) && 'last-child'    },
  //       { type: 'pseudo', value: (at ===  0) && 'only-child'    },

  //       { type: 'pseudo', value: (ti ===  0) && 'first-of-type' },
  //       { type: 'pseudo', value: (ti === tt) && 'last-of-type'  },
  //       { type: 'pseudo', value: (tt ===  0) && 'only-of-type'  },

  //       { type: 'pseudo', value: (li ===  0) && 'first-in-list' },
  //       { type: 'pseudo', value: (li === lt) && 'last-in-list'  },
  //       { type: 'pseudo', value: (lt ===  0) && 'only-in-list'  },

  //       { type: 'pseudo', value: 'nth-child'       , args: [ai +  1] },
  //       { type: 'pseudo', value: 'nth-last-child'  , args: [at - ai] },
  //       { type: 'pseudo', value: 'nth-of-type'     , args: [ti +  1] },
  //       { type: 'pseudo', value: 'nth-last-of-type', args: [tt - ti] },
  //       { type: 'pseudo', value: 'nth-in-list'     , args: [li +  1] },
  //       { type: 'pseudo', value: 'nth-last-in-list', args: [lt - li] },

  //       { type: 'pseudo', value: node.isSelected && 'selected' }
  //     );
  //   } else {
  //     // screen node has not parent
  //     result.push({ type: 'pseudo', value: 'root' });
  //   }

  //   // children
  //   if (children) {
  //     result.push(
  //       { type: 'pseudo', value: !children.total && 'empty' }
  //     );
  //   }

  //   // prepare result
  //   return result
  //     .filter(v => Boolean(v.value))
  //     // group by type => value => args
  //     .reduce((types, { type, value, args=true }) => {
  //       if (!types.hasOwnProperty(type)) { types[type] = {}; }
  //       types[type][value.toLowerCase()] = args;
  //       return types;
  //     }, {});
  // }
}
