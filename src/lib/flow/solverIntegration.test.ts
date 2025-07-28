import { describe, expect, it } from 'vitest';
import { Satisfactory } from '../satisfactory';
import type { RecipeNode } from '../solver';
import { autoLayoutNodes, calculateResourceRequirements, convertSolverResultToFlow, markSolverGenerated } from './solverIntegration';

describe('Solver Integration', () => {
  // Mock data for testing
  const mockData: Satisfactory.SatisfactoryData = {
    items: {
      'Desc_IronPlate_C': {
        className: 'Desc_IronPlate_C',
        slug: 'iron-plate',
        name: 'Iron Plate',
        description: 'A plate made of iron',
        sinkPoints: 6,
        stackSize: 200,
        energyValue: 0,
        liquid: false
      },
      'Desc_OreIron_C': {
        className: 'Desc_OreIron_C',
        slug: 'iron-ore',
        name: 'Iron Ore',
        description: 'Raw iron ore',
        sinkPoints: 1,
        stackSize: 100,
        energyValue: 0,
        liquid: false
      }
    },
    recipes: {
      'Recipe_IronPlate_C': {
        className: 'Recipe_IronPlate_C',
        slug: 'iron-plate',
        name: 'Iron Plate',
        ingredients: [
          { item: 'Desc_OreIron_C', amount: 3 }
        ],
        products: [
          { item: 'Desc_IronPlate_C', amount: 2 }
        ],
        alternate: false,
        time: 6,
        inHand: true,
        forBuilding: false,
        inWorkshop: false,
        producedIn: ['Desc_SmelterMk1_C'],
        isVariablePower: false,
        minPower: 0,
        maxPower: 1
      }
    },
    buildings: {
      'Desc_SmelterMk1_C': {
        className: 'Desc_SmelterMk1_C',
        name: 'Smelter',
        slug: 'smelter',
        description: 'Smelts ore into ingots',
        metadata: {
          powerConsumption: 4,
          powerConsumptionExponent: 1.6,
          manufacturingSpeed: 1
        }
      }
    },
    resources: {
      'Desc_OreIron_C': {
        item: 'Desc_OreIron_C',
        speed: 60
      }
    }
  };

  // Mock RecipeNode for testing
  const mockRecipeNode: RecipeNode = {
    recipe: mockData.recipes['Recipe_IronPlate_C'],
    building: mockData.buildings['Desc_SmelterMk1_C'],
    amount: 1,
    requiredInput: [
      {
        item: 'Desc_OreIron_C',
        amountPerMinute: 30,
        children: undefined // Raw material, no children
      }
    ]
  };

  it('should convert solver result to flow nodes and edges', () => {
    const result = convertSolverResultToFlow(mockRecipeNode, mockData, 1);

    expect(result.nodes).toHaveLength(2); // 1 production node + 1 source node
    expect(result.edges).toHaveLength(1); // 1 edge connecting them
    expect(result.nextNodeId).toBe(3); // Started at 1, used 1 and 2

    // Check production node
    const productionNode = result.nodes.find(n => n.type === 'production');
    expect(productionNode).toBeDefined();
    expect(productionNode?.data.label).toBe('Smelter');
    expect(productionNode?.data.solverGenerated).toBe(true);

    // Check source node
    const sourceNode = result.nodes.find(n => n.type === 'source');
    expect(sourceNode).toBeDefined();
    expect((sourceNode?.data.assignedItem as Satisfactory.Item)?.name).toBe('Iron Ore');
    expect(sourceNode?.data.solverGenerated).toBe(true);

    // Check edge
    expect(result.edges[0].source).toBe(sourceNode?.id);
    expect(result.edges[0].target).toBe(productionNode?.id);
  });

  it('should auto-layout nodes without overlaps', () => {
    const result = convertSolverResultToFlow(mockRecipeNode, mockData, 1);
    const layoutedNodes = autoLayoutNodes(result.nodes);

    // Check that nodes have different positions
    const positions = layoutedNodes.map(node => `${node.position.x},${node.position.y}`);
    const uniquePositions = new Set(positions);
    expect(uniquePositions.size).toBe(layoutedNodes.length);
  });

  it('should mark solver-generated content with visual styles', () => {
    const result = convertSolverResultToFlow(mockRecipeNode, mockData, 1);
    const { nodes, edges } = markSolverGenerated(result.nodes, result.edges);

    // Check that solver-generated nodes have styles
    nodes.forEach(node => {
      if (node.data?.solverGenerated) {
        expect(node.style).toContain('border: 2px solid #3b82f6');
      }
    });

    // Check that solver-generated edges have styles
    edges.forEach(edge => {
      if (edge.data?.solverGenerated) {
        expect(edge.style).toContain('stroke: #3b82f6');
      }
    });
  });

  it('should calculate resource requirements correctly', () => {
    const requirements = calculateResourceRequirements(mockRecipeNode);

    expect(requirements['Desc_OreIron_C']).toBe(30);
    expect(Object.keys(requirements)).toHaveLength(1);
  });
}); 