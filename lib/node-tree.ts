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

  private get $wrapper() {
    return (this.node.parent && this.node.parent.children) || null;
  }

  private get $parentList() {
    return (
      (this.node.parent &&
        this.node.parent instanceof Widgets.ListElement &&
        (this.node.parent as List)) ||
      null
    );
  }

  public constructor(public readonly node: Widgets.Node) {}

  // navigation getters
  public get isRoot(): boolean {
    return this.node instanceof Widgets.Screen;
  }

  public get parent(): NodeTree | null {
    return this.node.parent ? NodeTree.get(this.node.parent) : null;
  }

  public get index(): number {
    const { $wrapper } = this;
    return $wrapper ? $wrapper.indexOf(this.node) : -1;
  }

  public get total(): number {
    const { $wrapper } = this;
    return $wrapper ? $wrapper.length : 0;
  }

  public get before(): NodeTree | null {
    const { index } = this;
    return 0 < index
      ? NodeTree.get(this.node.parent.children[index - 1])
      : null;
  }

  public get after(): NodeTree | null {
    const { index, total } = this;
    return 0 <= index && index < total - 1
      ? NodeTree.get(this.node.parent.children[index + 1])
      : null;
  }

  public get children(): NodeTree[] {
    return this.node.children.map(NodeTree.get);
  }

  public get isList(): boolean {
    return this.node instanceof Widgets.ListElement;
  }

  public get isListItem(): boolean {
    return this.listIndex >= 0;
  }

  public get listIndex(): number {
    const { $parentList } = this;
    return $parentList ? $parentList.getItemIndex(this.node) : -1;
  }

  public get listTotal(): number {
    const { $parentList } = this;
    return (
      ($parentList &&
        $parentList.getItemIndex(this.node) >= 0 &&
        $parentList.items.length) ||
      0
    );
  }

  public get listItems(): NodeTree[] | null {
    return this.isList ? (this.node as List).items.map(NodeTree.get) : null;
  }
}
