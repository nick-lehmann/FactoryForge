<script lang="ts">
	import { Command, Dialog } from 'bits-ui';
	import { Satisfactory } from '$lib/satisfactory';
	import { onMount } from 'svelte';
	import Fuse from 'fuse.js';
	import { productionBuildings, isLoading, error } from '$lib/stores';

	// Props
	interface Props {
		onBuildingSelected: (building: Satisfactory.Building) => void;
		onSourceSelected: () => void;
		onSolverSelected: () => void;
	}

	const { onBuildingSelected, onSourceSelected, onSolverSelected }: Props = $props();

	// State for command palette
	let filteredBuildings = $state<Satisfactory.Building[]>([]);
	let commandPaletteOpen = $state(false);
	let searchValue = $state('');

	// Configure Fuse.js for fuzzy search
	const fuseOptions = {
		keys: ['name'],
		threshold: 0, // Lower = more strict, higher = more fuzzy
		includeScore: true,
		minMatchCharLength: 1
	};

	let fuse: Fuse<Satisfactory.Building>;

	// Initialize Fuse when buildings are loaded
	$effect(() => {
		if ($productionBuildings.length > 0) {
			fuse = new Fuse($productionBuildings, fuseOptions);
			filteredBuildings = $productionBuildings;
		}
	});

	// Handle search with Fuse.js
	$effect(() => {
		if (!fuse || !$productionBuildings.length) return;

		if (searchValue.trim() === '') {
			filteredBuildings = $productionBuildings;
		} else {
			const results = fuse.search(searchValue);
			filteredBuildings = results.map((result) => result.item);
		}
	});

	// Handle keyboard shortcuts
	const handleKeydown = (event: KeyboardEvent) => {
		// Cmd+K or Ctrl+K to open command palette
		if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
			event.preventDefault();
			commandPaletteOpen = true;
			searchValue = '';
		}
		// Escape to close command palette
		if (event.key === 'Escape' && commandPaletteOpen) {
			commandPaletteOpen = false;
			searchValue = '';
		}
	};

	// Handle building selection
	const selectBuilding = (building: Satisfactory.Building) => {
		onBuildingSelected(building);
		commandPaletteOpen = false;
		searchValue = '';
	};

	// Handle source selection
	const selectSource = () => {
		onSourceSelected();
		commandPaletteOpen = false;
		searchValue = '';
	};

	// Handle solver selection
	const selectSolver = () => {
		onSolverSelected();
		commandPaletteOpen = false;
		searchValue = '';
	};

	// Setup keyboard listeners
	onMount(() => {
		document.addEventListener('keydown', handleKeydown);
		return () => {
			document.removeEventListener('keydown', handleKeydown);
		};
	});
</script>

<!-- Command Palette -->
<Dialog.Root bind:open={commandPaletteOpen}>
	<Dialog.Portal>
		<Dialog.Overlay class="fixed inset-0 z-50 bg-black/50" />
		<Dialog.Content
			class="fixed top-1/2 left-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white shadow-2xl"
		>
			<Dialog.Title class="sr-only">Add Building</Dialog.Title>
			<Dialog.Description class="sr-only"
				>Search and select a building to add to your factory.</Dialog.Description
			>

			<Command.Root class="divide-y divide-gray-200 overflow-hidden rounded-xl">
				<Command.Input
					bind:value={searchValue}
					placeholder="Search for buildings..."
					class="w-full border-0 px-4 py-3 text-lg outline-none"
				/>
				<Command.List class="max-h-96 overflow-y-auto">
					<Command.Viewport>
						{#if $isLoading}
							<div class="px-4 py-8 text-center text-gray-500">Loading buildings...</div>
						{:else if $error}
							<div class="px-4 py-8 text-center text-red-500">
								Error: {$error}
							</div>
						{:else if filteredBuildings.length === 0}
							<Command.Empty class="px-4 py-8 text-center text-gray-500">
								No buildings found.
							</Command.Empty>
						{:else}
							<!-- Solver Option -->
							<Command.Item
								value="Production Solver"
								onSelect={selectSolver}
								class="flex cursor-pointer items-center border-l-4 border-transparent px-4 py-3 transition-colors duration-150 hover:border-purple-500 hover:bg-purple-50 data-[selected]:border-purple-500 data-[selected]:bg-purple-100"
							>
								<div class="flex-1">
									<div class="font-medium text-purple-700">🧮 Production Solver</div>
									<div class="text-xs text-purple-600">
										Auto-generate production chains for any item
									</div>
								</div>
							</Command.Item>

							<!-- Resource Source Option -->
							<Command.Item
								value="Resource Source"
								onSelect={selectSource}
								class="flex cursor-pointer items-center border-l-4 border-transparent px-4 py-3 transition-colors duration-150 hover:border-green-500 hover:bg-green-50 data-[selected]:border-green-500 data-[selected]:bg-green-100"
							>
								<div class="flex-1">
									<div class="font-medium text-green-700">🏭 Resource Source</div>
									<div class="text-xs text-green-600">Extract raw materials and resources</div>
								</div>
							</Command.Item>

							{#each filteredBuildings as building}
								<Command.Item
									value={building.name}
									onSelect={() => selectBuilding(building)}
									class="flex cursor-pointer items-center border-l-4 border-transparent px-4 py-3 transition-colors duration-150 hover:border-blue-500 hover:bg-gray-100 data-[selected]:border-blue-500 data-[selected]:bg-blue-50"
								>
									<div class="flex-1">
										<div class="font-medium">{building.name}</div>
										<!-- <div class="text-sm text-gray-500">{building.description}</div> -->
										{#if building.metadata}
											<div class="text-xs text-gray-400">
												Power: {building.metadata.powerConsumption}MW
											</div>
										{/if}
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
