/**
 * Demo file showing how to use the solver with real Satisfactory data
 */
import { Satisfactory } from './satisfactory';
import { solve, type RecipeNode } from './solver';

export async function runSolverDemo() {
  try {
    // Load the real Satisfactory data
    const data = await Satisfactory.loadData(fetch);
    
    // Example 1: Simple item - Iron Plate
    const ironPlate = data.items['Desc_IronPlate_C'];
    if (ironPlate) {
      console.log('\n=== Solving for Iron Plate (20/min) ===');
      const result = solve({ item: ironPlate, amount: 20 }, data);
      
      if (result.success && result.rootNode) {
        console.log(`Recipe: ${result.rootNode.recipe.name}`);
        console.log(`Building: ${result.rootNode.building.name}`);
        console.log(`Required buildings: ${result.rootNode.amount}`);
        console.log('Required inputs:');
        result.rootNode.requiredInput.forEach(input => {
          const inputItem = data.items[input.item];
          console.log(`  - ${inputItem?.name || input.item}: ${input.amountPerMinute.toFixed(2)}/min`);
        });
      } else {
        console.log(`Failed: ${result.error}`);
      }
    }

    // Example 2: More complex item - Steel Pipe
    const steelPipe = data.items['Desc_SteelPipe_C'];
    if (steelPipe) {
      console.log('\n=== Solving for Steel Pipe (10/min) ===');
      const result = solve({ item: steelPipe, amount: 10 }, data);
      
      if (result.success && result.rootNode) {
        console.log(`Recipe: ${result.rootNode.recipe.name}`);
        console.log(`Building: ${result.rootNode.building.name}`);
        console.log(`Required buildings: ${result.rootNode.amount}`);
        console.log('Required inputs:');
        
        function printInputTree(inputs: Array<{
          item: string;
          amountPerMinute: number;
          children?: RecipeNode[];
        }>, depth = 0) {
          const indent = '  '.repeat(depth);
          inputs.forEach(input => {
            const inputItem = data.items[input.item];
            console.log(`${indent}- ${inputItem?.name || input.item}: ${input.amountPerMinute.toFixed(2)}/min`);
            if (input.children) {
              input.children.forEach(child => {
                console.log(`${indent}  ↳ Recipe: ${child.recipe.name} (${child.amount} buildings)`);
                if (child.requiredInput.length > 0) {
                  printInputTree(child.requiredInput, depth + 2);
                }
              });
            }
          });
        }
        
        printInputTree(result.rootNode.requiredInput);
      } else {
        console.log(`Failed: ${result.error}`);
      }
    }

    // Example 3: Complex item - Computer
    const computer = data.items['Desc_Computer_C'];
    if (computer) {
      console.log('\n=== Solving for Computer (2/min) ===');
      const result = solve({ item: computer, amount: 2 }, data);
      
      if (result.success && result.rootNode) {
        console.log(`Recipe: ${result.rootNode.recipe.name}`);
        console.log(`Building: ${result.rootNode.building.name}`);
        console.log(`Required buildings: ${result.rootNode.amount}`);
        console.log('Production tree:');
        
        function printTree(node: RecipeNode, depth = 0) {
          const indent = '  '.repeat(depth);
          console.log(`${indent}${node.recipe.name} (${node.amount}x ${node.building.name})`);
          
          node.requiredInput.forEach(input => {
            const inputItem = data.items[input.item];
            console.log(`${indent}  Input: ${inputItem?.name || input.item} - ${input.amountPerMinute.toFixed(2)}/min`);
            if (input.children) {
              input.children.forEach(child => printTree(child, depth + 2));
            }
          });
        }
        
        printTree(result.rootNode);
      } else {
        console.log(`Failed: ${result.error}`);
      }
    }

  } catch (error) {
    console.error('Demo failed:', error);
  }
}

// Function to get all buildable items (non-raw materials)
export async function getBuildableItems() {
  try {
    const data = await Satisfactory.loadData(fetch);
    const resourceItems = new Set(Object.values(data.resources).map(r => r.item));
    
    const buildableItems = Object.values(data.items)
      .filter(item => !resourceItems.has(item.className))
      .filter(item => {
        // Check if there's at least one recipe that can produce this item
        return Object.values(data.recipes).some(recipe => 
          recipe.products.some(product => product.item === item.className) &&
          !recipe.forBuilding && 
          !recipe.inWorkshop &&
          recipe.producedIn.length > 0
        );
      })
      .sort((a, b) => a.name.localeCompare(b.name));
    
    console.debug('Buildable items:', buildableItems);
    
    return buildableItems;
  } catch (error) {
    console.error('Failed to get buildable items:', error);
    return [];
  }
} 