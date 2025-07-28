<script lang="ts">
	import { Satisfactory } from '$lib/satisfactory';

	// Define our enriched resource type
	interface EnhancedResource {
		key: string;
		item: string;
		itemName: string;
		itemSlug: string;
		speed: number;
	}

	// Accept the enriched resources
	const { resources }: { resources: EnhancedResource[] } = $props();
</script>

<div>
	<h2 class="mb-2 text-2xl font-semibold">Resources</h2>
	<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
		{#each resources.sort((r1, r2) => r1.itemName.localeCompare(r2.itemName)) as resource}
			<div class="rounded border p-4 shadow-sm">
				<h3 class="font-bold">{resource.itemName}</h3>
				<h4 class="text-sm text-gray-600">{resource.item}</h4>
				<div class="mt-2 text-sm">
					<div><span class="font-semibold">Speed:</span> {resource.speed}/min</div>
				</div>
			</div>
		{/each}
		{#if resources.length > 20}
			<p class="col-span-full text-center text-gray-500">
				Showing 20 of {resources.length} resources
			</p>
		{/if}
	</div>
</div>
