import { Satisfactory } from '$lib/satisfactory';
import type { PageLoad } from './$types';

// Enhanced types with name properties for better UI display
interface EnhancedIngredient extends Satisfactory.Ingredient {
  itemName: string;
  itemSlug: string;
}

interface EnhancedProduct extends Satisfactory.Product {
  itemName: string;
  itemSlug: string;
}

interface EnhancedRecipe extends Satisfactory.Recipe {
  key: string;
  enrichedIngredients: EnhancedIngredient[];
  enrichedProducts: EnhancedProduct[];
  producedInNames: string[];
}

interface EnhancedResource {
  key: string;
  item: string;
  itemName: string;
  itemSlug: string;
  speed: number;
}

interface EnhancedItem extends Satisfactory.Item {
  key: string;
  producedByRecipes: EnhancedRecipe[];
}

// Main load function
export const load: PageLoad = async ({ fetch }) => {
  // Load data asynchronously
  const data = await Satisfactory.loadData(fetch);
  
  // Create lookup maps for quick access by ID/className
  const itemsMap = createItemsMap(data.items);
  const buildingsMap = createBuildingsMap(data.buildings);
  
  // Process and enhance recipes first
  const enhancedRecipes = Object.entries(data.recipes).map(([key, recipe]) => {
    // Create an enhanced recipe with resolved references
    const enrichedRecipe: EnhancedRecipe = {
      ...recipe,
      key,
      
      // Enhance ingredients with item names
      enrichedIngredients: recipe.ingredients.map(ingredient => ({
        ...ingredient,
        itemName: itemsMap[ingredient.item]?.name || ingredient.item,
        itemSlug: itemsMap[ingredient.item]?.slug || ingredient.item
      })),
      
      // Enhance products with item names
      enrichedProducts: recipe.products.map(product => ({
        ...product, 
        itemName: itemsMap[product.item]?.name || product.item,
        itemSlug: itemsMap[product.item]?.slug || product.item
      })),
      
      // Add building names for the producedIn array
      producedInNames: recipe.producedIn.map(buildingId => 
        buildingsMap[buildingId]?.name || buildingId
      )
    };
    
    return enrichedRecipe;
  });
  
  // Create a lookup of recipes by the item they produce
  const recipesByProduct: Record<string, EnhancedRecipe[]> = {};
  for (const recipe of enhancedRecipes) {
    for (const product of recipe.products) {
      if (!recipesByProduct[product.item]) {
        recipesByProduct[product.item] = [];
      }
      recipesByProduct[product.item].push(recipe);
    }
  }
  
  // Now enhance the items with their related recipes
  const enhancedItems = Object.entries(data.items).map(([key, item]) => {
    const producedByRecipes = recipesByProduct[item.className] || [];
    
    return {
      ...item,
      key,
      producedByRecipes
    } satisfies EnhancedItem;
  });
  
  // Return the enhanced data
  return {
    items: enhancedItems,
    recipes: enhancedRecipes,
    buildings: Object.entries(data.buildings).map(([key, building]) => ({
      key,
      ...building
    })),
    resources: Object.entries(data.resources).map(([key, resource]) => {
      // Create enhanced resource with item name
      const enhancedResource: EnhancedResource = {
        key,
        ...resource,
        itemName: itemsMap[resource.item]?.name || resource.item,
        itemSlug: itemsMap[resource.item]?.slug || resource.item
      };
      
      return enhancedResource;
    })
  };
};

// Helper functions to create lookup maps
function createItemsMap(items: Record<string, Satisfactory.Item>) {
  const map: Record<string, Satisfactory.Item> = {};
  
  // Index by className for easy lookup
  for (const [key, item] of Object.entries(items)) {
    map[item.className] = item;
  }
  
  return map;
}

function createBuildingsMap(buildings: Record<string, Satisfactory.Building>) {
  const map: Record<string, Satisfactory.Building> = {};
  
  // Index by className for easy lookup
  for (const [key, building] of Object.entries(buildings)) {
    map[building.className] = building;
  }
  
  return map;
} 