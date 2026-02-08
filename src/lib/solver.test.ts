import assert from 'node:assert';
import * as fs from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { Satisfactory } from './satisfactory';
import { solve } from './solver';

const rawData = await fs.readFile('static/data.json', { encoding: 'utf-8' })
const parsedData = JSON.parse(rawData)
const mockData = Satisfactory.DataSchema.parse(parsedData)

describe('Solver', () => {
  // Mock data for testing
  // const mockData: Satisfactory.SatisfactoryData = {
  //   items: {
  //     Desc_IronPlate_C: {
  //       className: 'Desc_IronPlate_C',
  //       slug: 'iron-plate',
  //       name: 'Iron Plate',
  //       description: 'A plate made of iron',
  //       sinkPoints: 6,
  //       stackSize: 200,
  //       energyValue: 0,
  //       liquid: false
  //     },
  //     Desc_OreIron_C: {
  //       className: 'Desc_OreIron_C',
  //       slug: 'iron-ore',
  //       name: 'Iron Ore',
  //       description: 'Raw iron ore',
  //       sinkPoints: 1,
  //       stackSize: 100,
  //       energyValue: 0,
  //       liquid: false
  //     },
  //     Desc_IronPlateReinforced_C: {
  //       slug: 'reinforced-iron-plate',
  //       name: 'Reinforced Iron Plate',
  //       description: 'Used for crafting.\nA sturdier and more durable Iron Plate.',
  //       sinkPoints: 120,
  //       className: 'Desc_IronPlateReinforced_C',
  //       stackSize: 100,
  //       energyValue: 0.0,
  //       liquid: false
  //     }
  //   },
  //   recipes: {
  //     Recipe_IronPlate_C: {
  //       className: 'Recipe_IronPlate_C',
  //       slug: 'iron-plate',
  //       name: 'Iron Plate',
  //       ingredients: [{ item: 'Desc_OreIron_C', amount: 3 }],
  //       products: [{ item: 'Desc_IronPlate_C', amount: 2 }],
  //       alternate: false,
  //       time: 6,
  //       inHand: true,
  //       forBuilding: false,
  //       inWorkshop: false,
  //       producedIn: ['Desc_SmelterMk1_C'],
  //       isVariablePower: false,
  //       minPower: 0,
  //       maxPower: 1
  //     }
  //   },
  //   buildings: {
  //     Desc_SmelterMk1_C: {
  //       className: 'Desc_SmelterMk1_C',
  //       name: 'Smelter',
  //       slug: 'smelter',
  //       description: 'Smelts ore into ingots',
  //       metadata: {
  //         powerConsumption: 4,
  //         powerConsumptionExponent: 1.6,
  //         manufacturingSpeed: 1
  //       }
  //     }
  //   },
  //   resources: {
  //     Desc_OreIron_C: {
  //       item: 'Desc_OreIron_C',
  //       speed: 60
  //     }
  //   }
  // };

  it('should solve for iron plate production', () => {
    const target = {
      item: mockData.items['Desc_IronPlate_C'],
      amount: 20 // 20 per minute
    };

    const result = solve(target, mockData);

    console.debug(JSON.stringify(result, undefined, 4))

    expect(result.success).toBe(true);
    assert(result.rootNode);

    expect(result.rootNode.recipe.name).toBe('Iron Plate');
    expect(result.rootNode.building.name).toBe('Constructor');
    expect(result.rootNode.amount).toEqual(1);
    expect(result.rootNode.requiredInput).toHaveLength(1);

    // 30/min iron ingots
    const ingotsInput = result.rootNode.requiredInput[0];
    expect(ingotsInput.item).toBe('Desc_IronIngot_C');
    expect(ingotsInput.amountPerMinute).toBe(30);
    expect(ingotsInput.producer).toBeDefined();
    const ingotProducer = ingotsInput.producer!
    expect(ingotProducer.building.name).toBe('Smelter')
    expect(ingotProducer.amount).toBe(1) // We need only one smelter

    expect(ingotProducer.requiredInput).toHaveLength(1)
    expect(ingotProducer.requiredInput[0].item).toEqual('Desc_OreIron_C')
    expect(ingotProducer.requiredInput[0].amountPerMinute).toEqual(30)


  });

  it('should handle items that cannot be produced', () => {
    const target = {
      item: {
        className: 'Desc_NonExistent_C',
        slug: 'non-existent',
        name: 'Non-existent Item',
        description: 'Does not exist',
        sinkPoints: 0,
        stackSize: 1,
        energyValue: 0,
        liquid: false
      },
      amount: 10
    };

    const result = solve(target, mockData);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Could not find a production chain');
  });

  it('should handle raw materials directly', () => {
    const target = {
      item: mockData.items['Desc_OreIron_C'],
      amount: 60
    };

    const result = solve(target, mockData);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Could not find a production chain');
  });
});
