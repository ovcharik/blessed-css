import { SelectorBasicType } from "./selector";
import { PseudoArgumentArgs } from "./selector/meta-pseudo";

export type NodeSelector = {
  [T in SelectorBasicType]?: Record<string, PseudoArgumentArgs>;
};

export default interface Node {
  parent: Node;
  prev: Node;
  next: Node;
  selector: NodeSelector;
}
