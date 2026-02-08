/**
 * Integration utilities for converting solver results into SvelteFlow nodes and edges
 */
import dagre from '@dagrejs/dagre';
import type { Edge, Node } from '@xyflow/svelte';
import { Position } from '@xyflow/svelte';
import { Satisfactory } from '../satisfactory';
import type { RecipeNode } from '../solver';
import type { FactoryNode, ProductionNode, SourceNode } from './nodes/nodes';

// Node sizing configuration for Dagre
const NODE_WIDTH = 172;
const NODE_HEIGHT = 120;

export interface SolverConversionResult {
  nodes: FactoryNode[];
  edges: Edge[];
  nextNodeId: number;
}

/**
 * Convert a RecipeNode tree into SvelteFlow nodes and edges with Dagre layout
 */
export function convertSolverResultToFlow(
  rootNode: RecipeNode,
  data: Satisfactory.SatisfactoryData,
  startNodeId: number = 1
): SolverConversionResult {
  const nodes: FactoryNode[] = [];
  const edges: Edge[] = [];
  let currentNodeId = startNodeId;

  // Track which RecipeNode objects have already been converted to prevent duplicates
  const convertedNodes = new Map<RecipeNode, string>();

  // Track which raw materials have already had source nodes created
  const sourceNodes = new Map<string, string>();

  /**
   * Recursively create nodes for the production tree
   */
  function createNodesRecursive(recipeNode: RecipeNode): string {
    // Check if this RecipeNode has already been converted
    if (convertedNodes.has(recipeNode)) {
      return convertedNodes.get(recipeNode)!;
    }

    // Create production node
    const nodeId = currentNodeId.toString();
    currentNodeId++;

    const { building, amount, recipe } = recipeNode
    const productionNode: ProductionNode = {
      id: nodeId,
      type: 'production',
      position: { x: 0, y: 0 }, // Will be set by Dagre
      data: {
        label: building.name,
        icon: 'machine',
        buildingClassName: building.className,
        recipe: recipe,
        solverGenerated: true,
        amount: amount
      }
    };

    nodes.push(productionNode);

    // Track this conversion to prevent duplicates
    convertedNodes.set(recipeNode, nodeId);

    // Process inputs and create source nodes or child production nodes
    for (let inputIndex = 0; inputIndex < recipeNode.requiredInput.length; inputIndex++) {
      const input = recipeNode.requiredInput[inputIndex];

      if (input.producer) {
        // This input is produced by a producer node
        const producerNodeId = createNodesRecursive(input.producer);

        // Create edge from producer to current node
        const itemObj = data.items[input.item];
        const edge: Edge = {
          id: `e${producerNodeId}-${nodeId}`,
          source: producerNodeId,
          target: nodeId,
          sourceHandle: 'source-1',
          targetHandle: `target-${inputIndex + 1}`,
          type: 'labeled',
          animated: true,
          data: {
            itemClass: input.item,
            itemName: itemObj?.name ?? input.item,
            amount: input.amountPerMinute,
            solverGenerated: true
          }
        };
        edges.push(edge);
      } else {
        // This input is a raw material - create or reuse a source node
        let sourceNodeId: string;

        if (sourceNodes.has(input.item)) {
          // Reuse existing source node for this raw material
          sourceNodeId = sourceNodes.get(input.item)!;
        } else {
          // Create new source node for this raw material
          sourceNodeId = currentNodeId.toString();
          currentNodeId++;

          const item = data.items[input.item];
          const sourceNode: SourceNode = {
            id: sourceNodeId,
            type: 'source',
            position: { x: 0, y: 0 }, // Will be set by Dagre
            data: {
              label: 'Resource Source', // Required by SourceNodeInput
              icon: 'mine',
              assignedItem: item,
              solverGenerated: true
              // requiredAmount: input.amountPerMinute
            }
          };

          nodes.push(sourceNode);

          // Track this source node
          sourceNodes.set(input.item, sourceNodeId);
        }

        // Create edge from source to production node
        const sourceItemObj = data.items[input.item];
        const edge: Edge = {
          id: `e${sourceNodeId}-${nodeId}`,
          source: sourceNodeId,
          target: nodeId,
          sourceHandle: 'source-1',
          targetHandle: `target-${inputIndex + 1}`,
          type: 'labeled',
          animated: true,
          data: {
            itemClass: input.item,
            itemName: sourceItemObj?.name ?? input.item,
            amount: input.amountPerMinute,
            solverGenerated: true
          }
        };
        edges.push(edge);
      }
    }

    return nodeId;
  }

  // Start the recursive conversion
  createNodesRecursive(rootNode);

  // Apply Dagre layout to the nodes
  const layoutedNodes = layoutNodesWithDagre(nodes, edges);

  // Sort edges by y-position of the source node and correct handle position
  // to avoid unnecessary edge crossings
  for (const node of layoutedNodes) {
    const connections: { edge: Edge; node: Node }[] = [];

    for (const edge of edges.filter((edge) => edge.target === node.id)) {
      const node = layoutedNodes.find((n) => n.id === edge.source);
      // This case should not happen
      if (!node) continue;

      connections.push({ edge, node });
    }

    connections.sort((a, b) => a.node.position.y - b.node.position.y);

    for (let index = 0; index < connections.length; index++) {
      const { edge } = connections[index];
      edge.targetHandle = `target-${index + 1}`;
    }
  }

  return {
    nodes: layoutedNodes,
    edges,
    nextNodeId: currentNodeId
  };
}

/**
 * Use Dagre to calculate hierarchical layout for nodes
 */
function layoutNodesWithDagre(nodes: Node[], edges: Edge[]): FactoryNode[] {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  // Set the graph to be a directed graph with top-to-bottom layout
  // TB = Top to Bottom (tree flows from top producers to bottom raw materials)
  dagreGraph.setGraph({
    rankdir: 'LR',
    nodesep: 100,
    ranksep: 100,
    marginx: 20,
    marginy: 20
  });

  for (const node of nodes)
    dagreGraph.setNode(node.id, {
      width: NODE_WIDTH,
      height: NODE_HEIGHT
    });
  for (const edge of edges) dagreGraph.setEdge(edge.source, edge.target);

  // Calculate layout
  dagre.layout(dagreGraph);

  // Apply calculated positions to nodes
  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);

    // Set handle positions for vertical layout
    return {
      ...node,
      targetPosition: Position.Top,
      sourcePosition: Position.Bottom,
      position: {
        // Dagre returns center position, adjust to top-left for SvelteFlow
        x: nodeWithPosition.x - NODE_WIDTH / 2,
        y: nodeWithPosition.y - NODE_HEIGHT / 2
      }
    };
  });

  // @ts-expect-error Label missing?
  return layoutedNodes;
}

/**
 * Auto-layout nodes (now delegates to Dagre layout - kept for backward compatibility)
 */
export function autoLayoutNodes(nodes: Node[]): Node[] {
  // Since we now do layout in convertSolverResultToFlow, this just returns nodes as-is
  // We keep this function for backward compatibility
  return nodes;
}

/**
 * Add visual indicators for solver-generated content
 */
// export function markSolverGenerated(nodes: FactoryNode[], edges: Edge[]): { nodes: FactoryNode[], edges: Edge[] } {
//   const markedNodes = nodes.map(node => ({
//     ...node,
//     style: node.data?.solverGenerated ? 'border: 2px solid #3b82f6; box-shadow: 0 0 10px rgba(59, 130, 246, 0.3);' : undefined
//   }));

//   const markedEdges = edges.map(edge => ({
//     ...edge,
//     style: edge.data?.solverGenerated ? 'stroke: #3b82f6; stroke-width: 2px;' : undefined
//   }));

//   return { nodes: markedNodes, edges: markedEdges };
// }

/**
 * Calculate total resource requirements from solver result
 */
export function calculateResourceRequirements(rootNode: RecipeNode): Record<string, number> {
  const requirements: Record<string, number> = {};

  function collectRequirements(node: RecipeNode) {
    node.requiredInput.forEach((input) => {
      if (input.producer) {
        // Recursively collect from producer node
        collectRequirements(input.producer);
      } else {
        // This is a raw material requirement
        // Note: amountPerMinute is currently disabled in the solver
        requirements[input.item] = (requirements[input.item] || 0) + 1; // Placeholder count
      }
    });
  }

  collectRequirements(rootNode);
  return requirements;
}
