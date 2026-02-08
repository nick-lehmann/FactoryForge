<script lang="ts">
	import { BaseEdge, EdgeLabel, type EdgeProps, getBezierPath, getSmoothStepPath, getStraightPath } from '@xyflow/svelte';

	let {
		id,
		sourceX,
		sourceY,
		targetX,
		targetY,
		sourcePosition,
		targetPosition,
		markerStart,
		markerEnd,
		style,
		data
	}: EdgeProps = $props();

  const type: string = "bezier"

	let [path, labelX, labelY] = $derived(
    type == "straight" ? getStraightPath({ sourceX, sourceY, targetX, targetY, }) :
    type == "smooth" ?  getSmoothStepPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition }) : 
    type == "bezier" ?  getBezierPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition }) : ['0', 0, 0]
	);

	const itemName = $derived(data?.itemName as string | undefined);
	const amount = $derived(data?.amount as number | undefined);
	const hasLabel = $derived(!!itemName || amount != null);
</script>

<BaseEdge {id} {path} {markerStart} {markerEnd} {style} />

{#if hasLabel}
	<EdgeLabel x={labelX} y={labelY}>
		<div class="edge-label">
			{#if itemName}
				<span class="item-name">{itemName}</span>
			{/if}
			{#if amount != null}
				<span class="amount">{amount.toFixed(1)}/min</span>
			{/if}
		</div>
	</EdgeLabel>
{/if}

<style>
	.edge-label {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1px;
		background: white;
		border: 1px solid #cbd5e1;
		border-radius: 6px;
		padding: 3px 8px;
		font-size: 10px;
		line-height: 1.3;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		white-space: nowrap;
		pointer-events: all;
	}

	.item-name {
		font-weight: 600;
		color: #334155;
	}

	.amount {
		color: #3b82f6;
		font-weight: 500;
		font-variant-numeric: tabular-nums;
	}
</style>
