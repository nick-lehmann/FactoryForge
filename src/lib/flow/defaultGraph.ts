import type { Edge, Node } from '@xyflow/svelte';
import { MarkerType } from '@xyflow/svelte';

export const defaultNodes: Node[] = [
	{
		id: '1',
		type: 'production',
		position: { x: 100, y: 100 },
		data: {
			label: 'Miner',
			icon: 'machine',
			buildingClassName: 'Desc_MinerMk1_C'
		}
	},
	{
		id: '2',
		type: 'production',
		position: { x: 350, y: 50 },
		data: {
			label: 'Smelter',
			icon: 'machine',
			buildingClassName: 'Desc_SmelterMk1_C'
		}
	},
	{
		id: '3',
		type: 'production',
		position: { x: 350, y: 200 },
		data: {
			label: 'Constructor',
			icon: 'machine',
			buildingClassName: 'Desc_ConstructorMk1_C'
		}
	},
	{
		id: '4',
		type: 'production',
		position: { x: 600, y: 125 },
		data: {
			label: 'Assembler',
			icon: 'machine',
			buildingClassName: 'Desc_AssemblerMk1_C'
		}
	}
];

export const defaultEdges: Edge[] = [
	{
		id: 'e1-2',
		source: '1',
		sourceHandle: 'source-1',
		target: '2',
		targetHandle: 'target-1',
		type: 'smoothstep',
		animated: true,
		markerEnd: {
			type: MarkerType.ArrowClosed
		}
	},
	{
		id: 'e1-3',
		source: '1',
		sourceHandle: 'source-2',
		target: '3',
		targetHandle: 'target-1',
		type: 'smoothstep',
		animated: true,
		markerEnd: {
			type: MarkerType.ArrowClosed
		}
	},
	{
		id: 'e2-4',
		source: '2',
		sourceHandle: 'source-1',
		target: '4',
		targetHandle: 'target-1',
		type: 'smoothstep',
		animated: true,
		markerEnd: {
			type: MarkerType.ArrowClosed
		}
	},
	{
		id: 'e3-4',
		source: '3',
		sourceHandle: 'source-1',
		target: '4',
		targetHandle: 'target-2',
		type: 'smoothstep',
		animated: true,
		markerEnd: {
			type: MarkerType.ArrowClosed
		}
	}
];
