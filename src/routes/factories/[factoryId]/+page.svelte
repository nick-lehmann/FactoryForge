<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import {
		SvelteFlow,
		Controls,
		Background,
		Panel,
		useSvelteFlow,
		type Node,
		type Edge,
		type Connection,
		type DefaultEdgeOptions,
		MarkerType
	} from '@xyflow/svelte';
	import {
		ProductionNode,
		SourceNode,
		LabeledEdge,
		applyUpdateFactoryGraph,
		convertSolverResultToFlow,
		createDefaultGraphState,
		getFactoryById,
		loadWorkspaceState,
		type GraphState
	} from '$lib/flow';
	import { Satisfactory } from '$lib/satisfactory';
	import BuildingCommandPalette from '$lib/components/BuildingCommandPalette.svelte';
	import RecipeCommandPalette from '$lib/components/RecipeCommandPalette.svelte';
	import ItemCommandPalette from '$lib/components/ItemCommandPalette.svelte';
	import SolverCommandPalette from '$lib/components/SolverCommandPalette.svelte';
	import FactoriesSidebar from '$lib/components/FactoriesSidebar.svelte';
	import { solve } from '$lib/solver';
	import { satisfactoryDataStore } from '$lib/stores/satisfactoryData';

	import '@xyflow/svelte/dist/style.css';
	import { resolve } from '$app/paths';

	const { fitView } = $derived(useSvelteFlow());

	const factoryId = $derived(page.params.factoryId ?? '');

	const nodeTypes = {
		production: ProductionNode,
		source: SourceNode
	};

	const edgeTypes = {
		labeled: LabeledEdge
	};

	const defaultEdgeOptions: DefaultEdgeOptions = {
		type: 'labeled',
		animated: true,
		markerEnd: {
			type: MarkerType.ArrowClosed,
			width: 20,
			height: 20
		}
	};

	let recipeAssignmentOpen = $state(false);
	let selectedNodeId = $state<string | null>(null);
	let selectedBuildingClassName = $state<string | null>(null);

	let itemAssignmentOpen = $state(false);
	let selectedSourceNodeId = $state<string | null>(null);

	let solverOpen = $state(false);

	function handleRecipeAssign(nodeId: string, buildingClassName: string) {
		selectedNodeId = nodeId;
		selectedBuildingClassName = buildingClassName;
		recipeAssignmentOpen = true;
	}

	function handleItemAssign(nodeId: string) {
		selectedSourceNodeId = nodeId;
		itemAssignmentOpen = true;
	}

	function hydrateNodes(graphNodes: Node[]): Node[] {
		return graphNodes.map((node) => ({
			...node,
			data: {
				...node.data,
				onContextMenu: node.type === 'production' ? handleRecipeAssign : handleItemAssign
			}
		}));
	}

	let nodes = $state.raw<Node[]>([]);
	let edges = $state.raw<Edge[]>([]);
	let nextNodeId = $state(1);
	let graphReady = $state(false);

	$effect(() => {
		if (!browser) return;
		const id = factoryId;
		if (!id) return;

		graphReady = false;
		const w = loadWorkspaceState();
		const f = getFactoryById(w, id);
		if (!f) {
			goto(resolve('/'));
			return;
		}

		nodes = hydrateNodes(f.graph.nodes);
		edges = f.graph.edges;
		nextNodeId = f.graph.nextNodeId;
		graphReady = true;
	});

	$effect(() => {
		if (!browser || !graphReady) return;
		const id = factoryId;
		if (!id) return;

		const currentState: GraphState = {
			nodes,
			edges,
			nextNodeId
		};

		const w = loadWorkspaceState();
		if (!getFactoryById(w, id)) return;

		applyUpdateFactoryGraph(w, id, currentState);
	});

	const onConnect = (params: Connection) => {
		if (!params.source || !params.target || !params.sourceHandle || !params.targetHandle) return;

		const newEdge: Edge = {
			...params,
			id: `e${params.source}-${params.target}`,
			...defaultEdgeOptions
		};

		edges = [...edges, newEdge];
	};

	function handleBuildingSelected(building: Satisfactory.Building) {
		const newNode: Node = {
			id: nextNodeId.toString(),
			type: 'production',
			position: {
				x: Math.random() * 400 + 200,
				y: Math.random() * 300 + 150
			},
			data: {
				label: building.name,
				icon: 'machine',
				buildingClassName: building.className,
				onContextMenu: handleRecipeAssign
			}
		};

		nodes = [...nodes, newNode];
		nextNodeId++;
	}

	function handleSourceSelected() {
		const newNode: Node = {
			id: nextNodeId.toString(),
			type: 'source',
			position: {
				x: Math.random() * 400 + 200,
				y: Math.random() * 300 + 150
			},
			data: {
				label: 'Resource Source',
				icon: 'mine',
				onContextMenu: handleItemAssign
			}
		};

		nodes = [...nodes, newNode];
		nextNodeId++;
	}

	function handleRecipeSelected(recipe: Satisfactory.Recipe) {
		if (!selectedNodeId) return;

		nodes = nodes.map((node) => {
			if (node.id === selectedNodeId) {
				return {
					...node,
					data: {
						...node.data,
						recipe
					}
				};
			}
			return node;
		});

		selectedNodeId = null;
		selectedBuildingClassName = null;
	}

	function handleItemSelected(item: Satisfactory.Item) {
		if (!selectedSourceNodeId) return;

		nodes = nodes.map((node) => {
			if (node.id === selectedSourceNodeId) {
				return {
					...node,
					data: {
						...node.data,
						assignedItem: item
					}
				};
			}
			return node;
		});

		selectedSourceNodeId = null;
	}

	function handleRecipeAssignmentClose() {
		recipeAssignmentOpen = false;
		selectedNodeId = null;
		selectedBuildingClassName = null;
	}

	function handleItemAssignmentClose() {
		itemAssignmentOpen = false;
		selectedSourceNodeId = null;
	}

	function handleClear() {
		nodes = [];
		edges = [];
		nextNodeId = 1;
	}

	function handleSolverOpen() {
		solverOpen = true;
	}

	function handleSolve(item: Satisfactory.Item, quantity: number) {
		if (!$satisfactoryDataStore.data) {
			console.error('Satisfactory data not loaded');
			return;
		}

		try {
			const result = solve({ item, amount: quantity }, $satisfactoryDataStore.data);

			if (!result.success || !result.rootNode) {
				console.error('Solver failed:', result.error);
				return;
			}

			const conversion = convertSolverResultToFlow(
				result.rootNode,
				$satisfactoryDataStore.data,
				nextNodeId
			);

			nodes = hydrateNodes(conversion.nodes);
			edges = conversion.edges;
			nextNodeId = 0;

			window.requestAnimationFrame(() => fitView());

			console.log(`Successfully generated production chain for ${item.name} (${quantity}/min)`);
		} catch (error) {
			console.error('Error during solve:', error);
		}
	}

	const handleSolverClose = () => {
		solverOpen = false;
	};
</script>

<BuildingCommandPalette
	onBuildingSelected={handleBuildingSelected}
	onSourceSelected={handleSourceSelected}
	onSolverSelected={handleSolverOpen}
/>
<RecipeCommandPalette
	bind:open={recipeAssignmentOpen}
	buildingClassName={selectedBuildingClassName}
	onRecipeSelected={handleRecipeSelected}
	onClose={handleRecipeAssignmentClose}
/>
<ItemCommandPalette
	open={itemAssignmentOpen}
	onItemSelected={handleItemSelected}
	onClose={handleItemAssignmentClose}
/>
<SolverCommandPalette open={solverOpen} onSolve={handleSolve} onClose={handleSolverClose} />

<div class="flex h-screen w-full">
	<FactoriesSidebar currentFactoryId={factoryId} />
	<div class="min-h-0 min-w-0 flex-1">
		<SvelteFlow
			bind:nodes
			bind:edges
			{nodeTypes}
			{edgeTypes}
			onconnect={onConnect}
			{defaultEdgeOptions}
			fitView
		>
			<Controls />
			<Background />
			<Panel position="bottom-right">
				<div class="mt-2 flex flex-wrap gap-2">
					<button
						onclick={handleClear}
						class="rounded border border-orange-300 bg-orange-100 px-3 py-1 text-xs text-orange-700 transition-colors hover:bg-orange-200"
					>
						Clear All
					</button>
				</div>
			</Panel>
		</SvelteFlow>
	</div>
</div>

<style>
	:global([data-bits-dialog-overlay]) {
		background-color: rgba(0, 0, 0, 0.5);
		position: fixed;
		inset: 0;
		z-index: 50;
	}

	:global([data-bits-dialog-content]) {
		position: fixed;
		top: 20%;
		left: 50%;
		transform: translateX(-50%);
		width: 90%;
		max-width: 600px;
		background: white;
		border-radius: 12px;
		box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
		z-index: 51;
		overflow: hidden;
	}
</style>
