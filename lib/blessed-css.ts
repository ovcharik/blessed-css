import { widget } from "blessed";
import Stylesheet from "./stylesheet";
import NodeStyle from "./node-style";
import { NodeStatePatch } from "./node-state";

export interface Dispatcher {
  emit: (event: "invalidated", source: any) => void;
}

export interface BlessedCssOptions {
  dispatcher: Dispatcher;
  stylesheet: Stylesheet;
  screen: widget.Screen;
  fps: number;
}

export default class BlessedCss {
  // prettier-ignore
  private readonly events: Array<[string, NodeStatePatch]> = [
    // tree & list
    [ "adopt"      , { type: "children" } ],
    [ "remove"     , { type: "children" } ],
    [ "reparent"   , { type: "tree"     } ],
    [ "select item", { type: "tree"     } ],
    // user input
    [ "mouseover"  , { type: "hover", value: true  } ],
    [ "mouseout"   , { type: "hover", value: false } ],
    [ "focus"      , { type: "focus", value: true  } ],
    [ "blur"       , { type: "focus", value: false } ],
  ];

  private listeners: Array<() => void> = [];

  private dispatcher: Dispatcher = {
    emit: (event, source) => {
      const actions = {
        invalidated: this.render.bind(this),
      };
      actions[event](source);
    },
  };

  private options: BlessedCssOptions;

  private isAttached: boolean = false;
  private isRendering: boolean = false;

  constructor(
    private screen: widget.Screen,
    cssSource: string,
    options: Partial<BlessedCssOptions> = {},
  ) {
    const requiredOptions = {
      dispatcher: this.dispatcher,
      stylesheet: new Stylesheet(cssSource.toLowerCase()),
    };

    const defaultOptions = {
      screen: this.screen,
      fps: 1000 / 60,
    };

    this.options = { ...defaultOptions, ...options, ...requiredOptions };
    this.attach();
  }

  public attach() {
    this.detach();
    this.isAttached = true;

    const on = (event: string, listener: (node: widget.Node) => void) => {
      this.screen.on(event, listener);
      this.listeners.push(() => this.screen.off(event, listener));
    };

    // update properties before screen render
    on("prerender", () => NodeStyle.render(this.screen, this.options));

    // tracking changes for every node
    this.events.forEach(([event, patch]) => {
      on(event, () => NodeStyle.commit(this.screen, patch, this.options));
      on(`element ${event}`, (x) => NodeStyle.commit(x, patch, this.options));
    });
  }

  public detach() {
    this.isAttached = false;
    this.listeners.forEach((x) => x());
    this.listeners = [];
  }

  public render(node: NodeStyle) {
    if (!this.isAttached) {
      return;
    }
    if (this.isRendering) {
      return;
    }

    this.isRendering = true;
    setTimeout(() => {
      if (!this.isAttached) {
        return;
      }
      try {
        this.screen.render();
      } catch (renderError) {
        // tslint:disable:no-console
        console.error(renderError);
      }
      this.isRendering = false;
    }, this.options.fps);
  }
}
