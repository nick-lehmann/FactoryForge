// Import all namespaces
import { z } from 'zod';

const BuildingIdentifier = z.string()
const ItemIdentifier = z.string()
const RecipeIdentifier = z.string()
const ResourceIdentifier = z.string()

const Amount = z.number().min(0)

// Create a unified namespace
export namespace Satisfactory {
  export const BuildingSchema = z.object({
    // Used to uniquely reer to items from anyhwere
    className: BuildingIdentifier,

    name: z.string(),
    slug: z.string(),

    description: z.string(),

    metadata: z.object({
      powerConsumption: z.number(),
      powerConsumptionExponent: z.number(),
      manufacturingSpeed: z.number()
    })
  });

  export type Building = z.infer<typeof BuildingSchema>;

  export const ItemSchema = z.object({
    // Used to uniquely reer to items from anyhwere
    className: ItemIdentifier,

    slug: z.string(),
    name: z.string(),

    description: z.string(),
    sinkPoints: z.number(),
    stackSize: z.number(),
    energyValue: z.number(),
    radioctiveDecay: z.boolean().optional(),
    liquid: z.boolean()
  });

  export type Item = z.infer<typeof ItemSchema>;

  // Re-export types and schemas from recipes
  export const IngredientSchema = z.object({
    item: ItemIdentifier,
    amount: Amount
  });
  export type Ingredient = z.infer<typeof IngredientSchema>;

  export const ProductSchema = z.object({
    item: ItemIdentifier,
    amount: Amount
  });
  export type Product = z.infer<typeof ProductSchema>;

  export const RecipeSchema = z.object({
    // Unique identifier that can be used to refer to this recipe
    className: RecipeIdentifier,

    slug: z.string(),
    name: z.string(),

    ingredients: z.array(IngredientSchema),
    products: z.array(ProductSchema),

    alternate: z.boolean(),
    time: z.number(),
    inHand: z.boolean(),
    forBuilding: z.boolean(),
    inWorkshop: z.boolean(),

    producedIn: z.array(BuildingIdentifier),

    isVariablePower: z.boolean(),
    minPower: z.number(),
    maxPower: z.number()
  });
  export type Recipe = z.infer<typeof RecipeSchema>;

  export const ResourceSchema = z.object({
    item: ResourceIdentifier,
    speed: z.number()
  });

  export type Resource = z.infer<typeof ResourceSchema>;

  export const DataSchema = z.object({
    items: z.record(z.string(), ItemSchema),
    recipes: z.record(z.string(), RecipeSchema),
    buildings: z.record(z.string(), BuildingSchema),
    resources: z.record(z.string(), ResourceSchema)
  });

  export type SatisfactoryData = z.infer<typeof DataSchema>;


  // Cache for the validated data
  let cachedData: SatisfactoryData | null = null;

  /**
   * Load data from the data.json file
   * @param customFetch Optional fetch function to use (required for server-side rendering)
   */
  export async function loadData(customFetch?: typeof fetch): Promise<SatisfactoryData> {
    if (cachedData) return cachedData;
    
    try {
      // Use the provided fetch or fall back to global fetch
      const fetchFunc = customFetch || fetch;
      
      // Fetch data from static folder
      const response = await fetchFunc('/data.json');
      if (!response.ok) throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
      
      const rawData = await response.json();
      
      // Validate the data against our schema
      const validatedData = DataSchema.parse(rawData);
      cachedData = validatedData;
      return validatedData;
    } catch (error) {
      console.error('Error loading Satisfactory data:', error);
      throw new Error('Failed to load Satisfactory data');
    }
  }
}