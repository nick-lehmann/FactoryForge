<script lang="ts">
	import { Command, Dialog } from 'bits-ui';
	import { Satisfactory } from '$lib/satisfactory';
	import Fuse from 'fuse.js';
	import { recipes, isLoading, error } from '$lib/stores';

	// Props
	interface Props {
		open: boolean;
		buildingClassName: string | null;
		onRecipeSelected: (recipe: Satisfactory.Recipe) => void;
		onClose: () => void;
	}

	let { open = $bindable(), buildingClassName, onRecipeSelected, onClose }: Props = $props();

	// State for recipe palette
	let availableRecipes = $state<Satisfactory.Recipe[]>([]);
	let filteredRecipes = $state<Satisfactory.Recipe[]>([]);
	let searchValue = $state('');

	// Configure Fuse.js for fuzzy search
	const fuseOptions = {
		keys: ['name'],
		threshold: 0.3, // Slightly more fuzzy for recipes
		includeScore: true,
		minMatchCharLength: 1
	};

	let fuse: Fuse<Satisfactory.Recipe>;

	$effect(() => console.debug('Select recipe', { buildingClassName }));

	// Filter recipes for the selected building
	$effect(() => {
		console.debug('Finding recipes for building', { buildingClassName });
		if (!$recipes || !buildingClassName) {
			availableRecipes = [];
			return;
		}

		// Filter recipes that can be produced in this building
		availableRecipes = Object.values($recipes)
			.filter((recipe) => recipe.producedIn.includes(buildingClassName))
			.sort((a, b) => a.name.localeCompare(b.name))
			.map((recipe) => ({
				...recipe,
				name: recipe.name.startsWith('Alternate: ') ? recipe.name.slice(11) : recipe.name
			}));
	});

	// Initialize Fuse when recipes are loaded
	$effect(() => {
		if (availableRecipes.length > 0) {
			fuse = new Fuse(availableRecipes, {
				...fuseOptions,
				isCaseSensitive: false
			});
			filteredRecipes = availableRecipes;
		} else {
			filteredRecipes = [];
		}
	});

	// Handle search with Fuse.js
	$effect(() => {
		if (!fuse || !availableRecipes.length) {
			filteredRecipes = availableRecipes;
			return;
		}

		if (searchValue.trim() === '') {
			filteredRecipes = availableRecipes;
		} else {
			const results = fuse.search(searchValue);
			filteredRecipes = results.map((result) => result.item);
		}
	});

	// Handle recipe selection
	function selectRecipe(recipe: Satisfactory.Recipe) {
		onRecipeSelected(recipe);
		handleClose();
	};

	// Handle closing
	function handleClose() {
		searchValue = '';
		onClose();
	};

	// Reset search when opening
	$effect(() => {
		if (open) {
			searchValue = '';
		}
	});
</script>

<!-- Recipe Command Palette -->
<Dialog.Root bind:open>
	<Dialog.Portal>
		<Dialog.Overlay class="fixed inset-0 z-50 bg-black/50" />
		<Dialog.Content
			class="fixed top-1/2 left-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white shadow-2xl"
		>
			<Dialog.Title class="sr-only">Select Recipe</Dialog.Title>
			<Dialog.Description class="sr-only"
				>Choose a recipe for this production building.</Dialog.Description
			>

			<Command.Root class="divide-y divide-gray-200 overflow-hidden rounded-xl">
				<Command.Input
					bind:value={searchValue}
					placeholder="Search for recipes..."
					class="w-full border-0 px-4 py-3 text-lg outline-none"
				/>
				<Command.List class="max-h-96 overflow-y-auto">
					<Command.Viewport>
						{#if $isLoading}
							<div class="px-4 py-8 text-center text-gray-500">Loading recipes...</div>
						{:else if $error}
							<div class="px-4 py-8 text-center text-red-500">
								Error: {$error}
							</div>
						{:else if !buildingClassName}
							<div class="px-4 py-8 text-center text-gray-500">No building selected.</div>
						{:else if filteredRecipes.length === 0}
							<Command.Empty class="px-4 py-8 text-center text-gray-500">
								No recipes found for this building.
							</Command.Empty>
						{:else}
							{#each filteredRecipes as recipe}
								<Command.Item
									value={recipe.name}
									onSelect={() => selectRecipe(recipe)}
									class="cursor-pointer border-l-4 border-transparent px-4 py-3 transition-colors duration-150 hover:border-green-500 hover:bg-gray-100 data-[selected]:border-green-500 data-[selected]:bg-green-50"
								>
									<div class="flex-1">
										<div class="font-medium">{recipe.name}</div>
										{#if recipe.alternate}
											<div class="text-xs font-medium text-orange-600">Alternate Recipe</div>
										{/if}

										<!-- Show ingredients and products -->
										<div class="mt-1 space-y-1">
											{#if recipe.ingredients.length > 0}
												<div class="text-xs text-gray-600">
													Input: {recipe.ingredients
														.map((ing) => `${ing.amount}/min ${ing.item}`)
														.join(', ')}
												</div>
											{/if}
											{#if recipe.products.length > 0}
												<div class="text-xs text-gray-600">
													Output: {recipe.products
														.map((prod) => `${prod.amount}/min ${prod.item}`)
														.join(', ')}
												</div>
											{/if}
											<div class="text-xs text-gray-500">
												Time: {recipe.time}s | Power: {recipe.minPower}-{recipe.maxPower}MW
											</div>
										</div>
									</div>
								</Command.Item>
							{/each}
						{/if}
					</Command.Viewport>
				</Command.List>
			</Command.Root>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
