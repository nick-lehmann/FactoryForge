# Satisfactory Factory Solver

A simple solver that creates production trees for Satisfactory items with automatic deduplication of common inputs.

## How it works

Given a target item and desired production rate (items per minute), the solver:

1. Finds recipes that can produce the target item
2. Calculates required buildings and production rates
3. Recursively solves for all ingredient requirements
4. **Deduplicates common inputs** - if multiple recipes need the same item, it's only produced once
5. Stops at raw materials (resources that can be mined/extracted)
6. Returns a DAG (Directed Acyclic Graph) structure showing the complete production chain

## Key Features

### Deduplication

The solver automatically detects when multiple recipes require the same input item and ensures it's only produced once. This creates a more efficient and realistic factory layout where common intermediate products (like Iron Ingots, Steel Ingots, etc.) are centrally produced and distributed to all consumers.

**Example**: If both "Steel Pipe" and "Steel Beam" recipes require Steel Ingots, the solver will create only one Steel Ingot production line that feeds both recipes, rather than duplicating the entire steel production chain.

## Usage

```typescript
import { solve } from './solver';
import { Satisfactory } from './satisfactory';

// Load game data
const data = await Satisfactory.loadData(fetch);

// Define target production
const target = {
	item: data.items['Desc_IronPlate_C'], // Iron Plate
	amount: 20 // 20 per minute
};

// Solve for production chain
const result = solve(target, data);

if (result.success && result.rootNode) {
	console.log(`Recipe: ${result.rootNode.recipe.name}`);
	console.log(`Building: ${result.rootNode.building.name}`);
	console.log(`Required buildings: ${result.rootNode.amount}`);

	// Print required inputs
	result.rootNode.requiredInput.forEach((input) => {
		const inputItem = data.items[input.item];
		console.log(`Input: ${inputItem?.name} - ${input.amountPerMinute}/min`);
	});
} else {
	console.log(`Failed: ${result.error}`);
}
```

## Data Structure

### RecipeNode

```typescript
type RecipeNode = {
	recipe: Satisfactory.Recipe; // The recipe being used
	building: Satisfactory.Building; // The building that produces this recipe
	requiredInput: Array<{
		item: string; // Item class name (e.g., 'Desc_IronOre_C')
		producer?: RecipeNode; // Single node that produces this input (deduplicated)
	}>;
};
```

### SolverResult

```typescript
type SolverResult = {
	success: boolean; // Whether solving was successful
	rootNode?: RecipeNode; // The root production node (if successful)
	error?: string; // Error message (if failed)
};
```

## Features

- **Recursive solving**: Automatically resolves ingredient dependencies
- **Input deduplication**: Common inputs are produced only once and shared
- **Raw material detection**: Stops at items that can be mined/extracted
- **Building calculation**: Determines how many buildings are needed
- **Production rate calculation**: Accounts for recipe time and building speed
- **Circular dependency detection**: Prevents infinite loops
- **Error handling**: Graceful handling of missing recipes/buildings
- **DAG structure**: Creates efficient factory layouts without duplicate production lines

## Limitations

- Always chooses the first available recipe (no optimization)
- Prefers standard recipes over alternates
- Excludes workshop and building recipes (only automated production)
- Simple "first solution found" approach (no efficiency optimization)
- Does not consider power requirements or resource node limitations

## Example Output

For Iron Plate (20/min):

```
Recipe: Iron Plate
Building: Smelter
Input: Iron Ore (raw material)
```

For a complex item requiring Steel Ingots in multiple places:

```
Recipe: Heavy Modular Frame
Building: Manufacturer
Input: Modular Frame
  ↳ Recipe: Modular Frame (Constructor)
    Input: Steel Beam
      ↳ Recipe: Steel Beam (Constructor)
        Input: Steel Ingot → [SHARED PRODUCER]
Input: Steel Pipe
  ↳ Recipe: Steel Pipe (Constructor)
    Input: Steel Ingot → [SHARED PRODUCER]
Input: Encased Industrial Beam
  ↳ Recipe: Encased Industrial Beam (Assembler)
    Input: Steel Beam → [SHARED PRODUCER]
    Input: Concrete
      ↳ Recipe: Concrete (Constructor)
        Input: Limestone (raw material)

[SHARED PRODUCER] Steel Ingot:
  ↳ Recipe: Steel Ingot (Foundry)
    Input: Iron Ore (raw material)
    Input: Coal (raw material)
```

The `[SHARED PRODUCER]` notation shows how Steel Ingot is produced once but consumed by multiple recipes, eliminating duplication.

## Future Improvements

- Recipe optimization (choose most efficient recipes)
- Alternative recipe consideration
- Power consumption calculation
- Resource node capacity planning
- Multi-product optimization
- Building placement suggestions
- Production rate balancing across shared nodes
