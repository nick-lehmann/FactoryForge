import type { Edge, Node } from '@xyflow/svelte';
import { defaultEdges, defaultNodes } from './defaultGraph.js';

export interface GraphState {
	nodes: Node[];
	edges: Edge[];
	nextNodeId: number;
}

export interface FactoryRecord {
	id: string;
	name: string;
	graph: GraphState;
	createdAt: number;
	updatedAt: number;
}

export interface WorkspaceState {
	factories: FactoryRecord[];
	sidebarCollapsed?: boolean;
}

export function createDefaultGraphState(): GraphState {
	return {
		nodes: structuredClone(defaultNodes) as Node[],
		edges: structuredClone(defaultEdges) as Edge[],
		nextNodeId: 5
	};
}

export function emptyWorkspace(): WorkspaceState {
	return { factories: [], sidebarCollapsed: false };
}

function isGraphState(value: unknown): value is GraphState {
	if (!value || typeof value !== 'object') return false;
	const g = value as Record<string, unknown>;
	return Array.isArray(g.nodes) && Array.isArray(g.edges) && typeof g.nextNodeId === 'number';
}

function isFactoryRecord(value: unknown): value is FactoryRecord {
	if (!value || typeof value !== 'object') return false;
	const f = value as Record<string, unknown>;
	return (
		typeof f.id === 'string' &&
		typeof f.name === 'string' &&
		isGraphState(f.graph) &&
		typeof f.createdAt === 'number' &&
		typeof f.updatedAt === 'number'
	);
}

/** Parse and validate workspace JSON shape */
export function parseWorkspaceState(raw: string): WorkspaceState | null {
	try {
		const parsed = JSON.parse(raw) as unknown;
		if (!parsed || typeof parsed !== 'object') return null;
		const o = parsed as Record<string, unknown>;
		if (!Array.isArray(o.factories)) return null;
		const factories = o.factories.filter(isFactoryRecord);
		return {
			factories,
			sidebarCollapsed: typeof o.sidebarCollapsed === 'boolean' ? o.sidebarCollapsed : false
		};
	} catch {
		return null;
	}
}

export function serializeWorkspaceState(state: WorkspaceState): string {
	return JSON.stringify(state);
}

let idCounter = 0;
function newFactoryId(): string {
	if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
		return crypto.randomUUID();
	}
	idCounter += 1;
	return `factory-${Date.now()}-${idCounter}`;
}

export function createFactoryRecord(name: string): FactoryRecord {
	const now = Date.now();
	return {
		id: newFactoryId(),
		name: name.trim() || 'Untitled factory',
		graph: createDefaultGraphState(),
		createdAt: now,
		updatedAt: now
	};
}

export function getFactoryById(workspace: WorkspaceState, id: string): FactoryRecord | undefined {
	return workspace.factories.find((f) => f.id === id);
}

export function addFactory(workspace: WorkspaceState, name?: string): WorkspaceState {
	const label = name?.trim() || `Factory ${workspace.factories.length + 1}`;
	const factory = createFactoryRecord(label);
	return {
		...workspace,
		factories: [...workspace.factories, factory]
	};
}

export function renameFactory(
	workspace: WorkspaceState,
	factoryId: string,
	name: string
): WorkspaceState {
	const trimmed = name.trim();
	if (!trimmed) return workspace;
	const factories = workspace.factories.map((f) =>
		f.id === factoryId ? { ...f, name: trimmed, updatedAt: Date.now() } : f
	);
	return { ...workspace, factories };
}

export function updateFactoryGraph(
	workspace: WorkspaceState,
	factoryId: string,
	graph: GraphState
): WorkspaceState {
	const factories = workspace.factories.map((f) =>
		f.id === factoryId ? { ...f, graph, updatedAt: Date.now() } : f
	);
	return { ...workspace, factories };
}

export function removeFactory(workspace: WorkspaceState, factoryId: string): WorkspaceState {
	return {
		...workspace,
		factories: workspace.factories.filter((f) => f.id !== factoryId)
	};
}

export function setSidebarCollapsed(workspace: WorkspaceState, collapsed: boolean): WorkspaceState {
	return { ...workspace, sidebarCollapsed: collapsed };
}
