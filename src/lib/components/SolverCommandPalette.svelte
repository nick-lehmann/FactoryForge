<script lang="ts">
	import { Command, Dialog } from 'bits-ui';
	import { Satisfactory } from '$lib/satisfactory';
	import { onMount } from 'svelte';
	import Fuse from 'fuse.js';
	import { getBuildableItems } from '$lib/solver-demo';

	// Props
	interface Props {
		open: boolean;
		onSolve: (item: Satisfactory.Item, quantity: number) => void;
		onClose: () => void;
	}

	const { open, onSolve, onClose }: Props = $props();

	// State
	let buildableItems = $state<Satisfactory.Item[]>([]);
	let filteredItems = $state<Satisfactory.Item[]>([]);
	let searchValue = $state('');
	let selectedItem = $state<Satisfactory.Item | null>(null);
	let quantity = $state<number>(10);
	let isLoading = $state(true);

	// Configure Fuse.js for fuzzy search
	const fuseOptions = {
		keys: ['name'],
		threshold: 0.3,
		includeScore: true,
		minMatchCharLength: 1
	};

	let fuse: Fuse<Satisfactory.Item>;

	// Load buildable items when component mounts
	onMount(async () => {
		try {
			isLoading = true;
			buildableItems = await getBuildableItems();
			filteredItems = buildableItems;
			fuse = new Fuse(buildableItems, fuseOptions);
		} catch (error) {
			console.error('Failed to load buildable items:', error);
		} finally {
			isLoading = false;
		}
	});

	// Handle search with Fuse.js
	$effect(() => {
		if (!fuse || !buildableItems.length) return;

		if (searchValue.trim() === '') {
			filteredItems = buildableItems;
		} else {
			const results = fuse.search(searchValue);
			filteredItems = results.map((result) => result.item);
		}
	});

	// Reset state when dialog opens/closes
	$effect(() => {
		if (open) {
			searchValue = '';
			selectedItem = null;
			quantity = 10;
		}
	});

	// Handle item selection
	const selectItem = (item: Satisfactory.Item) => {
		selectedItem = item;
		searchValue = item.name;
		// Focus quantity input
		setTimeout(() => {
			const quantityInput = document.getElementById('quantity-input');
			quantityInput?.focus();
		}, 100);
	};

	// Handle solve
	const handleSolve = () => {
		if (selectedItem && quantity > 0) {
			onSolve(selectedItem, quantity);
			onClose();
		}
	};

	// Handle key navigation
	const handleKeydown = (event: KeyboardEvent) => {
		if (event.key === 'Enter' && selectedItem && quantity > 0) {
			event.preventDefault();
			handleSolve();
		}
	};
</script>

<Dialog.Root {open}>
	<Dialog.Portal>
		<Dialog.Overlay class="fixed inset-0 z-50 bg-black/50" />
		<Dialog.Content
			class="fixed top-1/2 left-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white shadow-2xl"
		>
			<Dialog.Title class="sr-only">Solve Production Chain</Dialog.Title>
			<Dialog.Description class="sr-only">
				Select an item and quantity to automatically generate a production chain.
			</Dialog.Description>

			<div class="divide-y divide-gray-200 overflow-hidden rounded-xl">
				<!-- Header -->
				<div class="border-b bg-blue-50 px-4 py-3">
					<h3 class="text-lg font-semibold text-blue-900">🧮 Solve Production Chain</h3>
					<p class="text-sm text-blue-700">
						Select an item and quantity to auto-generate the production tree
					</p>
				</div>

				<!-- Item Selection -->
				{#if !selectedItem}
					<Command.Root class="overflow-hidden">
						<Command.Input
							bind:value={searchValue}
							placeholder="Search for items to produce..."
							class="w-full border-0 px-4 py-3 text-lg outline-none"
							onkeydown={handleKeydown}
						/>
						<Command.List class="max-h-64 overflow-y-auto">
							<Command.Viewport>
								{#if isLoading}
									<div class="px-4 py-8 text-center text-gray-500">Loading items...</div>
								{:else if filteredItems.length === 0}
									<Command.Empty class="px-4 py-8 text-center text-gray-500">
										No buildable items found.
									</Command.Empty>
								{:else}
									<!-- {#each filteredItems.slice(0, 20) as item} -->
									{#each filteredItems as item}
										<Command.Item
											value={item.name}
											onSelect={() => selectItem(item)}
											class="flex cursor-pointer items-center border-l-4 border-transparent px-4 py-3 transition-colors duration-150 hover:border-blue-500 hover:bg-blue-50 data-[selected]:border-blue-500 data-[selected]:bg-blue-100"
										>
											<div class="flex-1">
												<div class="font-medium">{item.name}</div>
												<div class="truncate text-sm text-gray-500">{item.description}</div>
												<div class="text-xs text-gray-400">
													Sink Value: {item.sinkPoints} points
												</div>
											</div>
										</Command.Item>
									{/each}
								{/if}
							</Command.Viewport>
						</Command.List>
					</Command.Root>
				{:else}
					<!-- Quantity Input -->
					<div class="p-4">
						<div class="mb-4 flex items-center space-x-4">
							<div class="flex-1">
								<div class="font-medium text-gray-900">{selectedItem.name}</div>
								<div class="text-sm text-gray-500">{selectedItem.description}</div>
							</div>
							<button
								onclick={() => {
									selectedItem = null;
									searchValue = '';
								}}
								class="text-gray-400 transition-colors hover:text-gray-600"
								title="Change item"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="20"
									height="20"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
								>
									<path d="M3 6h18" />
									<path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
									<path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
									<line x1="10" y1="11" x2="10" y2="17" />
									<line x1="14" y1="11" x2="14" y2="17" />
								</svg>
							</button>
						</div>

						<div class="space-y-4">
							<div>
								<label for="quantity-input" class="mb-2 block text-sm font-medium text-gray-700">
									Target Production Rate (items per minute)
								</label>
								<input
									id="quantity-input"
									type="number"
									bind:value={quantity}
									min="1"
									max="1000"
									class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
									onkeydown={handleKeydown}
								/>
							</div>

							<div class="flex space-x-3">
								<button
									onclick={onClose}
									class="flex-1 rounded-md bg-gray-100 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-200"
								>
									Cancel
								</button>
								<button
									onclick={handleSolve}
									disabled={!selectedItem || quantity <= 0}
									class="flex-1 rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
								>
									🧮 Solve Production
								</button>
							</div>
						</div>
					</div>
				{/if}
			</div>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
