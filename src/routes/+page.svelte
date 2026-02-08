<script lang="ts">
	import {
		SvelteFlow,
		MiniMap,
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
		loadGraphState,
		saveGraphState,
		resetGraphState,
		convertSolverResultToFlow,
		type GraphState
	} from '$lib/flow';
	import { Satisfactory } from '$lib/satisfactory';
	import BuildingCommandPalette from '$lib/components/BuildingCommandPalette.svelte';
	import RecipeCommandPalette from '$lib/components/RecipeCommandPalette.svelte';
	import ItemCommandPalette from '$lib/components/ItemCommandPalette.svelte';
	import SolverCommandPalette from '$lib/components/SolverCommandPalette.svelte';
	import { solve } from '$lib/solver';
	import { satisfactoryDataStore } from '$lib/stores/satisfactoryData';

	import '@xyflow/svelte/dist/style.css';

	// Get the fitView function from SvelteFlow
	const { fitView } = $derived(useSvelteFlow());

	// Define node types mapping
	const nodeTypes = {
		production: ProductionNode,
		source: SourceNode
	};

	// Define edge types mapping
	const edgeTypes = {
		labeled: LabeledEdge
	};

	// Define default edge options
	const defaultEdgeOptions: DefaultEdgeOptions = {
		type: 'labeled',
		animated: true,
		markerEnd: {
			type: MarkerType.ArrowClosed,
			width: 20,
			height: 20
		}
	};

	// Recipe assignment state
	let recipeAssignmentOpen = $state(false);
	let selectedNodeId = $state<string | null>(null);
	let selectedBuildingClassName = $state<string | null>(null);

	// Item assignment state
	let itemAssignmentOpen = $state(false);
	let selectedSourceNodeId = $state<string | null>(null);

	// Solver state
	let solverOpen = $state(false);

	// Handle recipe assignment initiation
	function handleRecipeAssign(nodeId: string, buildingClassName: string) {
		console.info('Open Recipe selector');
		selectedNodeId = nodeId;
		selectedBuildingClassName = buildingClassName;
		recipeAssignmentOpen = true;
	}

	// Handle item assignment initiation
	function handleItemAssign(nodeId: string) {
		console.info('Open Item selector');
		selectedSourceNodeId = nodeId;
		itemAssignmentOpen = true;
	}

	// Load initial state from localStorage
	let graphState = $state<GraphState>(loadGraphState());
	$effect(() => console.debug('graphState', graphState));

	// Add callbacks to loaded nodes
	const hydratedNodes = graphState.nodes.map((node) => ({
		...node,
		data: {
			...node.data,
			onContextMenu: node.type === 'production' ? handleRecipeAssign : handleItemAssign
		}
	}));

	let nodes = $state.raw<Node[]>(hydratedNodes);
	let edges = $state.raw<Edge[]>(graphState.edges);
	let nextNodeId = $state<number>(graphState.nextNodeId);

	// Auto-save to localStorage whenever the graph changes
	$effect(() => {
		const currentState: GraphState = {
			nodes,
			edges,
			nextNodeId
		};
		saveGraphState(currentState);
	});

	// Enforce connection rules
	const onConnect = (params: Connection) => {
		// Guard clause - exit early if required parameters are missing
		if (!params.source || !params.target || !params.sourceHandle || !params.targetHandle) return;

		const newEdge: Edge = {
			...params,
			id: `e${params.source}-${params.target}`,
			...defaultEdgeOptions
		};

		edges = [...edges, newEdge];
	};

	// Handle building selection from command palette
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

	// Handle source node creation from command palette
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
				onItemAssign: handleItemAssign
			}
		};

		nodes = [...nodes, newNode];
		nextNodeId++;
	}

	function handleRecipeSelected(recipe: Satisfactory.Recipe) {
		if (!selectedNodeId) return;

		// Update the node with the assigned recipe
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

		// Close the recipe assignment
		selectedNodeId = null;
		selectedBuildingClassName = null;
	}

	function handleItemSelected(item: Satisfactory.Item) {
		if (!selectedSourceNodeId) return;

		// Update the source node with the assigned item
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

		// Close the item assignment
		selectedSourceNodeId = null;
	}

	// Handle recipe assignment close
	function handleRecipeAssignmentClose() {
		recipeAssignmentOpen = false;
		selectedNodeId = null;
		selectedBuildingClassName = null;
	}

	// Handle item assignment close
	function handleItemAssignmentClose() {
		itemAssignmentOpen = false;
		selectedSourceNodeId = null;
	}

	// Reset graph to default state
	function handleReset() {
		const defaultState = resetGraphState();
		// Add callbacks back to reset nodes
		const resetNodesWithCallbacks = defaultState.nodes.map((node) => ({
			...node,
			data: {
				...node.data,
				onContextMenu: node.type === 'production' ? handleRecipeAssign : undefined,
				onItemAssign: node.type === 'source' ? handleItemAssign : undefined
			}
		}));
		nodes = resetNodesWithCallbacks;
		edges = defaultState.edges;
		nextNodeId = defaultState.nextNodeId;
	}

	// Clear all nodes and edges
	function handleClear() {
		nodes = [];
		edges = [];
		nextNodeId = 1;
	}

	// Handle solver dialog open
	function handleSolverOpen() {
		solverOpen = true;
	}

	// Handle solver execution
	function handleSolve(item: Satisfactory.Item, quantity: number) {
		if (!$satisfactoryDataStore.data) {
			console.error('Satisfactory data not loaded');
			return;
		}

		try {
			// Run the solver
			const result = solve({ item, amount: quantity }, $satisfactoryDataStore.data);

			if (!result.success || !result.rootNode) {
				console.error('Solver failed:', result.error);
				return;
			}

			// Convert solver result to flow nodes and edges (with Dagre layout)
			const conversion = convertSolverResultToFlow(
				result.rootNode,
				$satisfactoryDataStore.data,
				nextNodeId
			);

			// Mark solver-generated content
			// const { nodes: markedNodes, edges: markedEdges } = markSolverGenerated(
			// 	conversion.nodes,
			// 	conversion.edges
			// );

			// Add callbacks to new nodes
			const nodesWithCallbacks = conversion.nodes.map((node) => ({
				...node,
				data: {
					...node.data,
					onContextMenu: node.type === 'production' ? handleRecipeAssign : undefined,
					onItemAssign: node.type === 'source' ? handleItemAssign : undefined
				}
			}));

			nodes = nodesWithCallbacks;
			edges = conversion.edges;
			nextNodeId = 0;
			// nodes = [...nodes, ...nodesWithCallbacks];
			// edges = [...edges, ...conversion.edges];
			// nextNodeId = conversion.nextNodeId;

			// Refit the view to show all nodes including the newly generated ones
			window.requestAnimationFrame(() => fitView());

			console.log(`Successfully generated production chain for ${item.name} (${quantity}/min)`);
		} catch (error) {
			console.error('Error during solve:', error);
			// TODO: Show error toast/notification
		}
	}

	// Handle solver dialog close
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

<div style:width="100%" style:height="100vh">
	<SvelteFlow bind:nodes bind:edges {nodeTypes} {edgeTypes} onconnect={onConnect} {defaultEdgeOptions} fitView>
		<MiniMap />
		<Controls />
		<Background />
		<Panel position="top-left">
			<h1>Factory Production Flow</h1>
			<p class="mt-1 text-sm text-gray-600">Press Cmd+K to add buildings/sources</p>
			<div class="mt-2 flex gap-2">
				<button
					onclick={handleReset}
					class="rounded border border-red-300 bg-red-100 px-3 py-1 text-xs text-red-700 transition-colors hover:bg-red-200"
				>
					Reset to Default
				</button>
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
