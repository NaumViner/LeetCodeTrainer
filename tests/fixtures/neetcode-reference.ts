import { sequenceOracles } from "./neetcode-sequence-reference";
import { structureOracles } from "./neetcode-structure-reference";
import { searchOracles } from "./neetcode-search-reference";
import { dynamicOracles } from "./neetcode-dynamic-reference";
import { miscellaneousOracles } from "./neetcode-misc-reference";
import { extendedSequenceOracles } from "./neetcode250-sequence-reference";
import { extendedGraphOracles } from "./neetcode250-graph-reference";
import { extendedStructureOracles } from "./neetcode250-structure-reference";
import { extendedDynamicOracles } from "./neetcode250-dynamic-reference";
export const expansionOracles = {
  ...extendedSequenceOracles,
  ...extendedGraphOracles,
  ...extendedStructureOracles,
  ...extendedDynamicOracles,
  ...sequenceOracles,
  ...structureOracles,
  ...searchOracles,
  ...dynamicOracles,
  ...miscellaneousOracles,
};
