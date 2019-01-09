import { Widgets } from "blessed";
import { memoize } from "./utils/memoize";

interface List extends Widgets.ListElement {
  selected: number;
  items: Widgets.Node[];
  getItemIndex(child: Widgets.Node): number;
}

export default class NodeTree {
  @memoize((ctx, node) => node, true)
  public static get(node: Widgets.Node) {
    return new NodeTree(node);
  }

  // Parent element. Return if node is not root.
  private get $nodeWrapper() {
    return (this.node.parent && this.node.parent.children) || void 0;
  }

  private get $typeWrapper() {
    return (
      (this.node.parent &&
        this.node.parent.children &&
        this.node.parent.children.filter((x) => x.type === this.node.type)) ||
      void 0
    );
  }

  // Parent list element. Return if node is a list item.
  private get $listWrapper() {
    return (
      (this.node.parent &&
        this.node.parent instanceof Widgets.ListElement &&
        (this.node.parent as List)) ||
      void 0
    );
  }

  public constructor(public readonly node: Widgets.Node) {}

  // Is root node.
  public get isRoot(): boolean {
    return this.node instanceof Widgets.Screen;
  }

  // Parent NodeTree.
  public get parent(): NodeTree | undefined {
    return this.node.parent ? NodeTree.get(this.node.parent) : void 0;
  }

  // Previous NodeTree in parent.
  public get prev(): NodeTree | undefined {
    const { nodeIndex } = this;
    return 0 < nodeIndex
      ? NodeTree.get(this.node.parent.children[nodeIndex - 1])
      : void 0;
  }

  // Next NodeTree in parent.
  public get next(): NodeTree | undefined {
    const { nodeIndex, nodeTotal } = this;
    return 0 <= nodeIndex && nodeIndex < nodeTotal - 1
      ? NodeTree.get(this.node.parent.children[nodeIndex + 1])
      : void 0;
  }

  // Node position relative parent.
  public get nodeIndex(): number {
    const { $nodeWrapper } = this;
    return $nodeWrapper ? $nodeWrapper.indexOf(this.node) : -1;
  }

  // Children count of parent.
  public get nodeTotal(): number {
    const { $nodeWrapper } = this;
    return $nodeWrapper ? $nodeWrapper.length : 0;
  }

  public get typeIndex(): number {
    const { $typeWrapper } = this;
    return $typeWrapper ? $typeWrapper.indexOf(this.node) : -1;
  }

  public get typeTotal(): number {
    const { $typeWrapper } = this;
    return $typeWrapper ? $typeWrapper.length : 0;
  }

  // Is list element.
  public get isList(): boolean {
    return this.node instanceof Widgets.ListElement;
  }

  // Is item of list.
  public get isListItem(): boolean {
    return this.listIndex >= 0;
  }

  // Item position relative parent list.
  public get listIndex(): number {
    const { $listWrapper } = this;
    return $listWrapper ? $listWrapper.getItemIndex(this.node) : -1;
  }

  // Items count of parent list.
  public get listTotal(): number {
    const { $listWrapper } = this;
    return (
      ($listWrapper &&
        $listWrapper.getItemIndex(this.node) >= 0 &&
        $listWrapper.items.length) ||
      0
    );
  }

  // Selected item index in parent list.
  public get listSelected(): number {
    const { $listWrapper } = this;
    return $listWrapper ? $listWrapper.selected : -1;
  }

  // Array of self items. Return `undefined` if node is not the list.
  public get listItems(): NodeTree[] | undefined {
    return this.isList ? (this.node as List).items.map(NodeTree.get) : void 0;
  }

  // Array of children.
  public get children(): NodeTree[] {
    return this.node.children.map(NodeTree.get);
  }

  // Count of children.
  public get childrenTotal(): number {
    return this.node.children ? this.node.children.length : 0;
  }
}
