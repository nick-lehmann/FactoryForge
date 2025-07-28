<script lang="ts">
	import type { PageData } from './$types';
	import BuildingsList from './components/BuildingsList.svelte';
	import ItemsList from './components/ItemsList.svelte';
	import ResourcesList from './components/ResourcesList.svelte';

	const { data }: { data: PageData } = $props();

	const { items, buildings, resources } = data;

	let activeTab = $state('items');
</script>

<div class="container mx-auto p-4">
	<h1 class="mb-4 text-3xl font-bold">Satisfactory Data</h1>

	<div class="mb-4">
		<div class="flex space-x-2 border-b">
			<button
				class="px-4 py-2 {activeTab === 'items' ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}"
				onclick={() => (activeTab = 'items')}
			>
				Items
			</button>
			<button
				class="px-4 py-2 {activeTab === 'buildings'
					? 'bg-blue-500 text-white'
					: 'hover:bg-gray-100'}"
				onclick={() => (activeTab = 'buildings')}
			>
				Buildings
			</button>
			<button
				class="px-4 py-2 {activeTab === 'resources'
					? 'bg-blue-500 text-white'
					: 'hover:bg-gray-100'}"
				onclick={() => (activeTab = 'resources')}
			>
				Resources
			</button>
		</div>
	</div>

	{#if activeTab === 'items'}
		<ItemsList {items} />
	{:else if activeTab === 'buildings'}
		<BuildingsList {buildings} />
	{:else if activeTab === 'resources'}
		<ResourcesList {resources} />
	{/if}
</div>
