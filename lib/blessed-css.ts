import { Widgets, widget } from "blessed";
import Stylesheet from "./stylesheet";
import NodeStyle, { NodeStyleOptions } from "./node-style";
import { NodeStatePatch } from "./node-state";

export default class BlessedCss {
  private readonly events: Array<{ event: string; patch: NodeStatePatch }> = [
    // structure
    { event: "adopt", patch: { type: "children" } },
    { event: "remove", patch: { type: "children" } },
    { event: "reparent", patch: { type: "tree" } },
    // input
    { event: "mouseover", patch: { type: "hover", value: true } },
    { event: "mouseout", patch: { type: "hover", value: false } },
    { event: "focus", patch: { type: "focus", value: true } },
    { event: "blur", patch: { type: "focus", value: false } },
    // list
    { event: "select item", patch: { type: "tree" } },
  ];

  private stylesheet: Stylesheet;
  private options: NodeStyleOptions;

  private listeners: Array<() => void> = [];

  constructor(private screen: Widgets.Screen, private cssSource: string) {
    this.stylesheet = new Stylesheet(cssSource.toLowerCase());

    this.options = {
      blessedCss: this,
      stylesheet: this.stylesheet,
    };

    this.attach();
  }

  public attach() {
    this.detach();

    const on = (event: string, listener: (node: Widgets.Node) => void) => {
      this.screen.on(event, listener);
      this.listeners.push(() => this.screen.off(event, listener));
    };

    const commit = (patch: NodeStatePatch) => (node: Widgets.Node) =>
      NodeStyle.commit(node, patch, this.options);

    // update properties before screen render
    on("prerender", () => NodeStyle.render(this.screen, this.options));

    // tracking changes for every node
    this.events.forEach(({ event, patch }) => {
      on(event, () => commit(patch)(this.screen));
      on(`element ${event}`, commit(patch));
    });
  }

  public detach() {}

  public render(node: NodeStyle) {}
}
