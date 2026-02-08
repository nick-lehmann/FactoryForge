/**
 * A very simple satisfactory factory solver.
 *
 * The user may specify a target item and amount, and the solver will
 * return a graph of buildings with a corresponding recipe.
 *
 * TODO: Specify inputs. For now, only raw materials should be assumed as inputs.
 */
import { Satisfactory } from './satisfactory';

export type RecipeNode = {
	recipe: Satisfactory.Recipe;
	building: Satisfactory.Building;
	amount: number; // Number of buildings required for this recipe
	requiredInput: Array<{
		item: string;
		amountPerMinute: number;
		producer?: RecipeNode; // Single node that produces this input (deduplicated)
	}>;
};

export type SolverResult = {
	success: boolean;
	rootNode?: RecipeNode;
	error?: string;
};

/**
 * Checks if an item is a raw material (exists in resources)
 */
function isRawMaterial(itemClassName: string, data: Satisfactory.SatisfactoryData): boolean {
	return Object.values(data.resources).some((resource) => resource.item === itemClassName);
}

/**
 * Find the first recipe that can produce the given item
 */
function findRecipeForItem(
	itemClassName: string,
	data: Satisfactory.SatisfactoryData
): Satisfactory.Recipe | null {
	const recipes = Object.values(data.recipes).filter(
		(recipe) =>
			recipe.products.some((product) => product.item === itemClassName) &&
			!recipe.forBuilding && // Exclude building recipes
			!recipe.inWorkshop && // Exclude workshop recipes (they can't be automated)
			recipe.producedIn.length > 0 // Must be produced in a machine
	);

	// Prefer non-alternate recipes
	const standardRecipes = recipes.filter((recipe) => !recipe.alternate);
	return standardRecipes.length > 0 ? standardRecipes[0] : recipes.length > 0 ? recipes[0] : null;
}

/**
 * Find a building that can produce the given recipe
 */
function findBuildingForRecipe(
	recipe: Satisfactory.Recipe,
	data: Satisfactory.SatisfactoryData
): Satisfactory.Building | null {
	const buildingClassName = recipe.producedIn[0]; // Take the first building that can produce this
	return data.buildings[buildingClassName] || null;
}

/**
 * Calculate production rate for a recipe (items per minute)
 */
function calculateProductionRate(
	recipe: Satisfactory.Recipe,
	building: Satisfactory.Building
): number {
	// Items per minute = (products per cycle / cycle time in seconds) * 60
	const cycleTimeMinutes = recipe.time / 60;
	const manufacturingSpeed = building.metadata.manufacturingSpeed;
	return manufacturingSpeed / cycleTimeMinutes;
}

/**
 * Recursively solve for the production tree with deduplication
 */
function solveRecursive(
	targetItem: string,
	targetAmountPerMinute: number,
	data: Satisfactory.SatisfactoryData,
	visited: Set<string> = new Set(),
	producedItems: Map<string, RecipeNode> = new Map()
): RecipeNode | null {
	// Check for circular dependencies
	if (visited.has(targetItem)) {
		console.warn(`Circular dependency detected for item: ${targetItem}`);
		return null;
	}

	// If it's a raw material, we don't need to produce it
	if (isRawMaterial(targetItem, data)) return null;

	// Check if this item is already being produced (deduplication)
	if (producedItems.has(targetItem)) {
		console.debug('Resuing node for', targetItem);
		return producedItems.get(targetItem)!;
	}

	// Find a recipe that can produce this item
	const recipe = findRecipeForItem(targetItem, data);
	if (!recipe) {
		console.warn(`No recipe found for item: ${targetItem}`);
		return null;
	}

	// Find a building that can produce this recipe
	const building = findBuildingForRecipe(recipe, data);
	if (!building) {
		console.warn(`No building found for recipe: ${recipe.name}`);
		return null;
	}

	// Calculate how much this recipe produces of our target item
	const targetProduct = recipe.products.find((product) => product.item === targetItem);
	if (!targetProduct) {
		console.warn(`Recipe ${recipe.name} doesn't actually produce ${targetItem}`);
		return null;
	}

	/**
	 * Calculate how many machines we will need.
	 *
	 * E.g. We want to produce 100 Iron Plates per minute.
	 * Smelter takes in 3 iron ore and produces 2 iron plates in a cycle
	 * -> we need 50 cycles per minute
	 *
	 * Each smelter takes 6 seconds per cycle
	 * -> 60 / 6 = 10 => a smelter cranks out 10 production cycles per minute
	 *
	 * ==> We need 50 / 10 = 5 smelters to satisfy the output
	 */
	// How many production cycles do we need to produce the target amount
	const neededCyclesPerMinute = targetAmountPerMinute / targetProduct.amount;

	// Number of cycles the machine can do in a single minute
	const cyclesPerMachinePerMinute = 60 / recipe.time;
	const neededBuildings = neededCyclesPerMinute / cyclesPerMachinePerMinute;

	// Create the node (but don't populate requiredInput yet to avoid circular references)
	const node: RecipeNode = {
		recipe,
		amount: neededBuildings,
		building,
		requiredInput: []
	};

	// Add to produced items map immediately to enable deduplication
	producedItems.set(targetItem, node);

	// Add to visited set to prevent circular dependencies
	const newVisited = new Set(visited);
	newVisited.add(targetItem);

	// Calculate required inputs
	const requiredInput = recipe.ingredients.map((ingredient) => {
		const amountPerMinute = neededCyclesPerMinute * ingredient.amount;

		// Recursively solve for this ingredient (will use existing node if already produced)
		const producer = solveRecursive(
			ingredient.item,
			amountPerMinute,
			data,
			newVisited,
			producedItems
		);

		return {
			item: ingredient.item,
			amountPerMinute,
			producer: producer || undefined
		};
	});

	// Now populate the requiredInput
	node.requiredInput = requiredInput;

	return node;
}

export function solve(
	target: {
		item: Satisfactory.Item;
		amount: number;
	},
	data: Satisfactory.SatisfactoryData
): SolverResult {
	try {
		// Create fresh maps for each solve operation
		const producedItems = new Map<string, RecipeNode>();
		const rootNode = solveRecursive(
			target.item.className,
			target.amount,
			data,
			new Set(),
			producedItems
		);

		if (!rootNode) {
			return {
				success: false,
				error: `Could not find a production chain for ${target.item.name}`
			};
		}

		// console.log(rootNode)

		return {
			success: true,
			rootNode
		};
	} catch (error) {
		return {
			success: false,
			error: `Solver error: ${error instanceof Error ? error.message : String(error)}`
		};
	}
}
