import type { ProductionNode, ProductionNodeInput } from './ProductionNode.svelte';
import type { SourceNode, SourceNodeInput } from './SourceNode.svelte';

export type FactoryNode = ProductionNode | SourceNode;

export type { ProductionNode, ProductionNodeInput, SourceNode, SourceNodeInput };
