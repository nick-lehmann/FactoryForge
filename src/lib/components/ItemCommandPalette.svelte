<script lang="ts">
	import { Dialog } from 'bits-ui';
	import { Satisfactory } from '$lib/satisfactory';
	import { items, satisfactoryDataStore } from '$lib/stores/satisfactoryData';
	import Fuse from 'fuse.js';

	interface Props {
		open: boolean;
		onItemSelected: (item: Satisfactory.Item) => void;
		onClose: () => void;
	}

	const { open, onItemSelected, onClose }: Props = $props();

	let searchQuery = $state('');
	let selectedIndex = $state(0);
	let isOpen = $state(false);

	// Get all items and filter out non-extractable ones
	const allItems = $derived(() => {
		if (!$items) return [];

		return Object.values($items).sort((a, b) => a.name.localeCompare(b.name));
		// // Filter to include resources and basic materials that could be mined/extracted
		// return Object.values($items).filter((item) => {
		// 	const name = item.name.toLowerCase();
		// 	// Include ores, basic resources, and liquids that are typically extracted
		// 	return (
		// 		name.includes('ore') ||
		// 		name.includes('coal') ||
		// 		name.includes('stone') ||
		// 		name.includes('sulfur') ||
		// 		name.includes('quartz') ||
		// 		name.includes('oil') ||
		// 		name.includes('water') ||
		// 		name.includes('nitrogen') ||
		// 		name.includes('uranium') ||
		// 		name.includes('bauxite') ||
		// 		name.includes('caterium') ||
		// 		item.className.includes('Desc_Ore') ||
		// 		item.className.includes('Desc_Liquid') ||
		// 		item.className.includes('Desc_Water') ||
		// 		item.className.includes('Desc_Coal') ||
		// 		item.className.includes('Desc_Stone') ||
		// 		item.className.includes('Desc_Sulfur') ||
		// 		item.className.includes('Desc_RawQuartz')
		// 	);
		// });
	});

	// Initialize Fuse for fuzzy search
	const fuse = $derived(() => {
		const itemsArray = allItems();
		if (itemsArray.length === 0) return null;

		return new Fuse(itemsArray, {
			keys: ['name', 'slug'],
			threshold: 0.3,
			includeScore: true
		});
	});

	// Sync local state with prop
	$effect(() => {
		isOpen = open;
	});

	// Notify parent when local state changes
	$effect(() => {
		if (!isOpen && open) {
			onClose();
		}
	});

	// Filter items based on search query
	const filteredItems = $derived(() => {
		if (!fuse() || !searchQuery.trim()) {
			return allItems().slice(0, 10); // Show first 10 items when no search
		}

		const results = fuse()!.search(searchQuery);
		return results.map((result: any) => result.item).slice(0, 10);
	});

	// Handle keyboard navigation
	const handleKeydown = (event: KeyboardEvent) => {
		if (!isOpen) return;

		switch (event.key) {
			case 'ArrowDown':
				event.preventDefault();
				selectedIndex = Math.min(selectedIndex + 1, filteredItems().length - 1);
				break;
			case 'ArrowUp':
				event.preventDefault();
				selectedIndex = Math.max(selectedIndex - 1, 0);
				break;
			case 'Enter':
				event.preventDefault();
				if (filteredItems()[selectedIndex]) {
					handleItemSelect(filteredItems()[selectedIndex]);
				}
				break;
			case 'Escape':
				event.preventDefault();
				onClose();
				break;
		}
	};

	// Handle item selection
	const handleItemSelect = (item: Satisfactory.Item) => {
		onItemSelected(item);
		onClose();
		searchQuery = '';
		selectedIndex = 0;
	};

	// Reset state when dialog opens
	$effect(() => {
		if (isOpen) {
			searchQuery = '';
			selectedIndex = 0;
		}
	});
</script>

<svelte:window on:keydown={handleKeydown} />

<Dialog.Root bind:open={isOpen}>
	<Dialog.Portal>
		<Dialog.Overlay data-bits-dialog-overlay />
		<Dialog.Content data-bits-dialog-content>
			<div class="command-palette">
				<div class="search-container">
					<div class="search-icon">
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
							<circle cx="11" cy="11" r="8" />
							<path d="M21 21l-4.35-4.35" />
						</svg>
					</div>
					<input
						bind:value={searchQuery}
						placeholder="Search for extractable items..."
						class="search-input"
						autofocus
					/>
				</div>

				<div class="results-container">
					{#if $satisfactoryDataStore.loading}
						<div class="loading">Loading items...</div>
					{:else if $satisfactoryDataStore.error}
						<div class="error">Error: {$satisfactoryDataStore.error}</div>
					{:else if filteredItems().length === 0}
						<div class="no-results">No extractable items found</div>
					{:else}
						{#each filteredItems() as item, index}
							<button
								class="result-item"
								class:selected={index === selectedIndex}
								onclick={() => handleItemSelect(item)}
								onmouseenter={() => (selectedIndex = index)}
							>
								<div class="item-info">
									<div class="item-name">{item.name}</div>
									<div class="item-details">
										{#if item.description}
											<span class="item-description"
												>{item.description.slice(0, 80)}{item.description.length > 80
													? '...'
													: ''}</span
											>
										{/if}
									</div>
								</div>
							</button>
						{/each}
					{/if}
				</div>
			</div>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>

<style>
	.command-palette {
		padding: 0;
		max-height: 500px;
		display: flex;
		flex-direction: column;
	}

	.search-container {
		display: flex;
		align-items: center;
		padding: 16px;
		border-bottom: 1px solid #e5e7eb;
		gap: 12px;
	}

	.search-icon {
		color: #9ca3af;
		flex-shrink: 0;
	}

	.search-input {
		flex: 1;
		border: none;
		outline: none;
		font-size: 16px;
		background: transparent;
	}

	.results-container {
		overflow-y: auto;
		max-height: 400px;
	}

	.loading,
	.error,
	.no-results {
		padding: 32px;
		text-align: center;
		color: #6b7280;
	}

	.error {
		color: #dc2626;
	}

	.result-item {
		width: 100%;
		padding: 12px 16px;
		border: none;
		background: white;
		text-align: left;
		cursor: pointer;
		border-bottom: 1px solid #f3f4f6;
		transition: background-color 0.1s;
	}

	.result-item:hover,
	.result-item.selected {
		background-color: #10b981;
		color: white;
	}

	.result-item.selected .item-details {
		color: rgba(255, 255, 255, 0.8);
	}

	.item-info {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.item-name {
		font-weight: 600;
		font-size: 14px;
	}

	.item-details {
		display: flex;
		flex-direction: column;
		font-size: 12px;
		color: #6b7280;
		gap: 2px;
	}

	.item-description {
		color: inherit;
		opacity: 0.8;
	}

	.result-item.selected .item-details {
		color: rgba(255, 255, 255, 0.8);
	}
</style>
