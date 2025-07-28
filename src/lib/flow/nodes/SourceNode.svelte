<script module>
	import type { Node } from '@xyflow/svelte';

	export type SourceNodeInput = {
		label: string;
		icon?: string;
		assignedItem?: Satisfactory.Item;
		onContextMenu?: (nodeId: string) => void;
	};

	export type SourceNode = Node<SourceNodeInput & Record<string, unknown>, 'source'>;
</script>

<script lang="ts">
	import { Handle, Position, type NodeProps } from '@xyflow/svelte';
	import { Satisfactory } from '$lib/satisfactory';

	interface Props {
		id: string;
		data: NodeProps['data'] & SourceNodeInput;
	}

	const { id, data }: Props = $props();

	function handleContextMenu(event: MouseEvent) {
		event.preventDefault();
		if (!data.onContextMenu) return;

		data.onContextMenu(id);
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="source-node" oncontextmenu={handleContextMenu}>
	<div class="node-content">
		<div class="icon">
			{#if (data.icon ?? 'mine') === 'mine'}
				<!-- Mining/extraction icon -->
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
					<path d="M7 17l-4-4 4-4" />
					<path d="M17 17l4-4-4-4" />
					<path d="M14 5l-2 14" />
					<path d="M12 19h0" />
					<circle cx="12" cy="5" r="2" />
				</svg>
			{:else}
				<span>{data.icon}</span>
			{/if}
		</div>
		<div class="label">{data.label}</div>
		{#if data.assignedItem}
			<div class="item">{data.assignedItem.name}</div>
		{:else}
			<div class="item-prompt">Right-click to assign item</div>
		{/if}
	</div>

	<Handle type="source" position={Position.Right} id="source-1" class="output-handle" />
</div>

<style>
	.source-node {
		padding: 12px;
		border-radius: 6px;
		background: linear-gradient(135deg, #f4f4f4, #e8e8e8);
		border: 1px solid #ccc;
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

	.source-node:hover {
		border-color: #2ecc71;
		box-shadow: 0 2px 8px rgba(46, 204, 113, 0.2);
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
		color: #2c3e50;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.label {
		font-size: 12px;
		font-weight: 600;
		text-align: center;
		color: #2c3e50;
		max-width: 100px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		margin-bottom: 4px;
	}

	.item {
		font-size: 10px;
		text-align: center;
		color: #27ae60;
		background: #e8f5e8;
		padding: 2px 6px;
		border-radius: 4px;
		max-width: 100px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		border: 1px solid #27ae60;
	}

	.item-prompt {
		font-size: 9px;
		text-align: center;
		color: #7f8c8d;
		background: #f8f9fa;
		padding: 2px 4px;
		border-radius: 3px;
		max-width: 100px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		border: 1px solid #dee2e6;
	}

	.output-handle {
		width: 10px;
		height: 10px;
		background: #27ae60;
		border: 2px solid white;
	}
</style>
