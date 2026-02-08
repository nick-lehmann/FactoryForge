<script module>
	import { type Node } from '@xyflow/svelte';

	export type ProductionNodeInput = {
		// Human readable name for building
		label: string;

		// Internal name for building
		buildingClassName?: string;

		// Icon for building
		icon?: string;

		// Recipe assigned to building
		recipe?: Satisfactory.Recipe;

    // How often you need this building
    amount?: number

		// Context menu handler
		onContextMenu?: (nodeId: string, buildingClassName: string) => void;
	};

	export type ProductionNode = Node<ProductionNodeInput & Record<string, unknown>, 'production'>;

  type InputOutput = { inputs: number, outputs: number}
  const InputOutputMap: Record<string, InputOutput> = {
    "Desc_SmelterMk1_C": {inputs: 1, outputs: 1},
    "Desc_ConstructorMk1_C": {inputs: 1, outputs: 1},
    "Desc_AssemblerMk1_C": {inputs: 2, outputs: 2},
    "Desc_ManufacturerMk1_C": {inputs: 4, outputs: 1},
    "Desc_OilRefinery_C": {inputs: 2, outputs: 2},
  }
</script>

<script lang="ts">
	import { Handle, Position, type NodeProps } from '@xyflow/svelte';
	import { Satisfactory } from '$lib/satisfactory';
	import { items } from '$lib/stores/satisfactoryData';

	interface Props {
		id: string;
		data: NodeProps['data'] & ProductionNodeInput;
	}

	const { id, data }: Props = $props();

	// Handle right-click to open recipe selector
	function handleContextMenu(event: MouseEvent) {
		event.preventDefault();
		if (data.onContextMenu && data.buildingClassName) {
			data.onContextMenu(id, data.buildingClassName);
		}
	}

	const getItemName = (itemClassName: string): string => {
		if (!$items) return itemClassName;

		const item = Object.values($items).find((item) => item.className === itemClassName);
		return item?.name || itemClassName;
	};

	const getOutputLabels = (): string[] => {
		if (!data.recipe) return [];
		return data.recipe.products.map((product) => getItemName(product.item));
	};

	// const inputLabels = $derived(getInputLabels());
	const outputLabels = $derived(getOutputLabels());

  function getInputOutputMapping(buildingClassName: string | undefined): InputOutput {
    const fallback: InputOutput = {inputs: 4, outputs: 4}
    if (buildingClassName === undefined) return fallback
    return InputOutputMap[buildingClassName] ?? fallback
  }

	const numberOfInputs = getInputOutputMapping(data.buildingClassName).inputs
	const numberOfOutputs = getInputOutputMapping(data.buildingClassName).outputs

	const separation = [[50], [40, 60], [30, 50, 70], [20, 40, 60, 80]];
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="production-node" oncontextmenu={handleContextMenu}>
	{#each { length: numberOfInputs } as _, index}
		<Handle
			type="target"
			position={Position.Left}
			id={`target-${index + 1}`}
			class="input-handle"
			style={`top: ${separation[numberOfInputs - 1][index]}%`}
		/>
	{/each}

	<div class="node-content">
		<div class="icon">
			{#if (data.icon ?? 'machine') === 'machine'}
				<!-- Default machine icon (you can replace with your own SVG) -->
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<rect x="4" y="5" width="16" height="16" rx="2" />
					<rect x="8" y="9" width="8" height="8" rx="1" />
					<path d="M12 16v3" />
					<path d="M9 13v-2" />
					<path d="M15 13v-2" />
					<path d="M9 5v4" />
					<path d="M15 5v4" />
				</svg>
			{:else}
				<!-- Use the provided icon name (you can extend this with more icons) -->
				<span>{data.icon}</span>
			{/if}
		</div>
		<div class="label">{data.label}</div>
		{#if data.recipe}
			<div class="recipe">{data.recipe.name}</div>
		{/if}
    {#if data.amount}
      <div>x{data.amount.toFixed(2)}</div>
    {/if}
	</div>

	{#each { length: numberOfOutputs } as _, index}
		<Handle
			type="source"
			position={Position.Right}
			id={`source-${index + 1}`}
			class="output-handle"
			style={`top: ${separation[numberOfOutputs - 1][index]}%`}
		/>
	{/each}
</div>

<style>
	.production-node {
		padding: 12px;
		border-radius: 6px;
		background: white;
		border: 1px solid #ddd;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		width: 120px;
		height: 120px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		position: relative;
		cursor: pointer;
	}

	.production-node:hover {
		border-color: #3498db;
		box-shadow: 0 2px 8px rgba(52, 152, 219, 0.2);
	}

	.node-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		width: 100%;
	}

	.icon {
		margin-bottom: 8px;
		color: #555;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.label {
		font-size: 12px;
		font-weight: 600;
		text-align: center;
		color: #333;
		max-width: 100px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		margin-bottom: 4px;
	}

	.recipe {
		font-size: 10px;
		text-align: center;
		color: #16a085;
		background: #e8f8f5;
		padding: 2px 6px;
		border-radius: 4px;
		max-width: 100px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		border: 1px solid #16a085;
	}
</style>
