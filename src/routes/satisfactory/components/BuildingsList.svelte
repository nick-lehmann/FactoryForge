<script lang="ts">
	import { Satisfactory } from '$lib/satisfactory';

	// Define our enriched building type
	interface EnhancedBuilding extends Satisfactory.Building {
		key: string;
	}

	// Accept the buildings as a property
	const { buildings }: { buildings: EnhancedBuilding[] } = $props();
</script>

<div>
	<h2 class="mb-2 text-2xl font-semibold">Buildings</h2>
	<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
		{#each buildings.sort((b1, b2) => b1.name.localeCompare(b2.name)) as building}
			<div class="rounded border p-4 shadow-sm">
				<h3 class="font-bold">{building.name}</h3>
				<h4 class="text-sm text-gray-600">{building.className}</h4>
				<p class="text-sm text-gray-600">{building.description}</p>
				{#if building.metadata}
					<div class="mt-2 text-sm">
						<div>
							<span class="font-semibold">Power Consumption:</span>
							{building.metadata.powerConsumption}MW
						</div>
						<div>
							<span class="font-semibold">Manufacturing Speed:</span>
							{building.metadata.manufacturingSpeed}
						</div>
					</div>
				{/if}
			</div>
		{/each}
		{#if buildings.length > 20}
			<p class="col-span-full text-center text-gray-500">
				Showing 20 of {buildings.length} buildings
			</p>
		{/if}
	</div>
</div>
