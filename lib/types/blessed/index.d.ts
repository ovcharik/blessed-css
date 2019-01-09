/// <reference types="node" />

declare module "blessed" {
  import { EventEmitter } from "events";

  export default function blessed(): Program;

  export class Program {}
  export class Tput {}

  export namespace widget {
    // prettier-ignore
    export type ClassName =
      | "Node" | "Screen" | "Element" | "Box" | "Text" | "Line" | "ScrollableBox"
      | "ScrollableText" | "BigText" | "List" | "Form" | "Input" | "Textarea"
      | "Textbox" | "Button" | "ProgressBar" | "FileManager" | "Checkbox"
      | "RadioSet" | "RadioButton" | "Prompt" | "Question" | "Message" | "Loading"
      | "Listbar" | "ListBar" | "Log" | "Table" | "ListTable" | "Terminal"
      | "Image" | "ANSIImage" | "PNG" | "OverlayImage" | "Video" | "Layout";

    // prettier-ignore
    export type ClassNameLower =
      | "node" | "screen" | "element" | "box" | "text" | "line" | "scrollablebox"
      | "scrollabletext" | "bigtext" | "list" | "form" | "input" | "textarea"
      | "textbox" | "button" | "progressbar" | "filemanager" | "checkbox"
      | "radioset" | "radiobutton" | "prompt" | "question" | "message" | "loading"
      | "listbar" | "log" | "table" | "listtable" | "terminal"
      | "image" | "ansiimage" | "overlayimage" | "video" | "layout";

    export const classes: ClassName[];
    export const aliases: { [name in ClassName]: ClassName };

    interface Renderable {
      render(): void;
    }

    // Node
    type NodeType = ClassNameLower;
    interface NodeOptions {
      id?: string;
      class?: string;
    }

    class Node extends EventEmitter {
      public type: NodeType;
      public options: NodeOptions;

      public screen: Screen;
      public parent: Node | undefined;
      public children: Node[];

      constructor(options: NodeOptions);
    }

    // Screen
    interface ScreenOptions extends NodeOptions {}

    class Screen extends Node implements Renderable {
      public render(): void;
      public enableMouse(el: Element): void;
      public enableKeys(el: Element): void;
      public enableInput(el: Element): void;
    }

    // Element
    interface ElementOptions extends NodeOptions {}

    class Element extends Node implements Renderable {
      public render(): void;
      public enableMouse(): void;
      public enableKeys(): void;
      public enableInput(): void;
    }

    // Box
    interface BoxOptions extends ElementOptions {}

    class Box extends Element {}

    // List
    interface ListOptions extends BoxOptions {}

    class List extends Box {
      public items: Box[];
      public selected: number;

      public getItemIndex(child: number): number;
      public getItemIndex(child: string): number;
      public getItemIndex(child: Node): number;
    }
  }

  export namespace colors {
    // prettier-ignore
    export interface NameGroups {
      Special: "default" | "normal" | "bg" | "fg";
      Normal: "black" | "red" | "green" | "yellow" | "blue" | "magenta" | "cyan" | "white";
      Light: "lightblack" | "lightred" | "lightgreen" | "lightyellow" | "lightblue" | "lightmagenta" | "lightcyan" | "lightwhite";
      Bright: "brightblack" | "brightred" | "brightgreen" | "brightyellow" | "brightblue" | "brightmagenta" | "brightcyan" | "brightwhite";
      Alter: "grey" | "gray" | "lightgrey" | "lightgray" | "brightgrey" | "brightgray";
    }

    // Color formats
    export type Name = NameGroups[keyof NameGroups];
    export type Term = number;
    export type Rgb = [number, number, number];
    export type Hex = string;

    /**
     * XTerm Colors
     * These were actually tough to track down. The xterm source only uses color
     * keywords. The X11 source needed to be examined to find the actual values.
     * They then had to be mapped to rgb values and then converted to hex values.
     */
    export const xterm: Hex[];
    /** Seed all 256 colors. Assume xterm defaults. */
    export const colors: Hex[];
    /** Seed all 256 colors. Assume xterm defaults. */
    export const vcolors: Rgb[];
    /** Map higher colors to the first 8 terminal colors. */
    export const ccolors: { [index: number]: Term };
    /** Map higher colors to the terminal color names. */
    export const ncolors: Name[];

    /** Match color with base 8 colors */
    export function match(hex: Hex): Term;
    export function match([r, g, b]: Rgb): Term;
    export function match(...rgb: Rgb): Term;

    /** Convert from RGB vector to Hex string */
    export function RGBToHex([r, g, b]: Rgb): Hex;
    export function RGBToHex(...rgb: Rgb): Hex;

    /** Convert from Hex string to RGB vector */
    export function HexToRGB(hex: Hex): Rgb;

    /**
     * This might work well enough for a terminal's colors: treat RGB as XYZ in a
     * 3-dimensional space and go midway between the two points.
     */
    export function mixColors(a: Rgb, b: Rgb, alpha: number): number;

    /** Blend two terminal color, include modes, brightness and other. */
    export function blend(a: Term, b: Term, alpha: number): number;

    /** Reduce color to available edges. */
    export function reduce(color: Term, total: number): Term;

    /** Convert every color format to terminal-color */
    export function convert(color: Name | Term | Rgb | Hex): Term;
  }
}
