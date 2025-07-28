<script lang="ts">
	import { Satisfactory } from '$lib/satisfactory';
	import Fuse from 'fuse.js';

	// Define the enriched types
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

	// Define the item type using the existing Satisfactory type + key + recipes
	interface EnhancedItem extends Satisfactory.Item {
		key: string;
		producedByRecipes: EnhancedRecipe[];
	}

	// Accept items with their recipes
	const { items }: { items: EnhancedItem[] } = $props();

	// Search state
	let searchQuery = $state('');
	let filteredItems = $state<EnhancedItem[]>([]);

	// Configure Fuse.js for fuzzy search
	const fuseOptions = {
		keys: ['name', 'description', 'producedByRecipes.name'],
		threshold: 0.3, // Lower = more strict, higher = more fuzzy
		includeScore: true,
		minMatchCharLength: 2
	};

	let fuse: Fuse<EnhancedItem>;

	// Initialize Fuse and set initial filtered items
	$effect(() => {
		fuse = new Fuse(items, fuseOptions);
		filteredItems = items;
	});

	// Handle search
	$effect(() => {
		if (searchQuery.trim() === '') {
			filteredItems = items;
		} else {
			const results = fuse.search(searchQuery);
			filteredItems = results.map((result) => result.item);
		}
	});

	// Sort items alphabetically
	const sortedItems = $derived([...filteredItems].sort((a, b) => a.name.localeCompare(b.name)));
</script>

<div>
	<div class="mb-4 flex items-center justify-between">
		<h2 class="text-2xl font-semibold">Items</h2>
		<div class="flex items-center space-x-2">
			<span class="text-sm text-gray-500">
				{filteredItems.length} of {items.length} items
			</span>
		</div>
	</div>

	<!-- Search Input -->
	<div class="mb-6">
		<div class="relative">
			<input
				type="text"
				placeholder="Search items and recipes..."
				bind:value={searchQuery}
				class="w-full rounded-lg border border-gray-300 px-4 py-2 pr-10 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
			/>
			<div class="absolute inset-y-0 right-0 flex items-center pr-3">
				<svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
					></path>
				</svg>
			</div>
		</div>
	</div>

	<!-- Results -->
	{#if filteredItems.length === 0 && searchQuery.trim() !== ''}
		<div class="py-8 text-center">
			<div class="text-lg text-gray-500">No items found</div>
			<div class="mt-1 text-sm text-gray-400">Try adjusting your search terms</div>
		</div>
	{:else}
		<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
			{#each sortedItems as item}
				<div class="rounded border p-4 shadow-sm">
					<div class="mb-3 border-b pb-2">
						<h3 class="text-lg font-bold">{item.name}</h3>
						<h4 class="text-xs text-gray-500">{item.className}</h4>
						<p class="mt-1 text-sm text-gray-600">{item.description}</p>
						<div class="mt-2 grid grid-cols-2 gap-1 text-sm">
							<div><span class="font-semibold">Sink Points:</span> {item.sinkPoints}</div>
							<div><span class="font-semibold">Stack Size:</span> {item.stackSize}</div>
							{#if item.radioctiveDecay}
								<div class="col-span-2 text-red-500">
									<span class="font-semibold">Radioactive:</span>
									{item.radioctiveDecay}
								</div>
							{/if}
						</div>
					</div>

					{#if item.producedByRecipes.length > 0}
						<div>
							<h4 class="mb-1 text-sm font-semibold">Production Recipes:</h4>
							<div class="space-y-3">
								{#each item.producedByRecipes as recipe}
									<div class="rounded bg-gray-50 p-2 text-sm">
										<div class="font-medium">{recipe.name}</div>
										<div class="my-1 text-xs">
											<span class="font-semibold">Produced in:</span>
											{recipe.producedInNames.join(', ')}
										</div>

										<div class="flex justify-between">
											<div>
												<div class="text-xs font-semibold">Ingredients:</div>
												<ul class="list-disc pl-4 text-xs">
													{#each recipe.enrichedIngredients as ingredient}
														<li>{ingredient.amount} × {ingredient.itemName}</li>
													{/each}
												</ul>
											</div>

											<div>
												<div class="text-xs font-semibold">Products:</div>
												<ul class="list-disc pl-4 text-xs">
													{#each recipe.enrichedProducts as product}
														<li>{product.amount} × {product.itemName}</li>
													{/each}
												</ul>
											</div>
										</div>

										<div class="mt-1 text-xs text-gray-500">
											Production time: {recipe.time}s
										</div>
									</div>
								{/each}
							</div>
						</div>
					{:else}
						<div class="text-sm text-gray-500 italic">No production recipes available</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>
