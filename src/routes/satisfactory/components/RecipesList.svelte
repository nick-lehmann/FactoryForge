<script lang="ts">
	import { Satisfactory } from '$lib/satisfactory';

	// Define our enriched recipe type including our enhanced properties
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

	// Accept the enriched recipes
	const { recipes }: { recipes: EnhancedRecipe[] } = $props();
</script>

<div>
	<h2 class="mb-2 text-2xl font-semibold">Recipes</h2>
	<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
		{#each recipes.sort((r1, r2) => r1.name.localeCompare(r2.name)) as recipe}
			<div class="rounded border p-4 shadow-sm">
				<h3 class="font-bold">{recipe.name}</h3>
				<h4 class="text-sm text-gray-600">{recipe.className}</h4>
				<div class="mt-2 text-sm">
					<div><span class="font-semibold">Time:</span> {recipe.time}s</div>
					<div>
						<span class="font-semibold">Produced In:</span>
						{recipe.producedInNames.join(', ')}
					</div>

					{#if recipe.enrichedIngredients?.length}
						<div class="mt-2">
							<span class="font-semibold">Ingredients:</span>
							<ul class="list-inside list-disc">
								{#each recipe.enrichedIngredients as ingredient}
									<li>
										{ingredient.amount} × <span class="font-medium">{ingredient.itemName}</span>
									</li>
								{/each}
							</ul>
						</div>
					{/if}

					{#if recipe.enrichedProducts?.length}
						<div class="mt-2">
							<span class="font-semibold">Products:</span>
							<ul class="list-inside list-disc">
								{#each recipe.enrichedProducts as product}
									<li>{product.amount} × <span class="font-medium">{product.itemName}</span></li>
								{/each}
							</ul>
						</div>
					{/if}
				</div>
			</div>
		{/each}
		{#if recipes.length > 20}
			<p class="col-span-full text-center text-gray-500">
				Showing 20 of {recipes.length} recipes
			</p>
		{/if}
	</div>
</div>
