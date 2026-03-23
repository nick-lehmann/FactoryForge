import { browser } from '$app/environment';
import type { GraphState, WorkspaceState } from './workspaceState.js';
import {
	addFactory as addFactoryPure,
	emptyWorkspace,
	parseWorkspaceState,
	removeFactory as removeFactoryPure,
	renameFactory as renameFactoryPure,
	serializeWorkspaceState,
	setSidebarCollapsed as setSidebarCollapsedPure,
	updateFactoryGraph as updateFactoryGraphPure
} from './workspaceState.js';

const WORKSPACE_STORAGE_KEY = 'factoryforge-workspace';

export type { FactoryRecord, GraphState, WorkspaceState } from './workspaceState.js';
export { createDefaultGraphState, emptyWorkspace, getFactoryById } from './workspaceState.js';

/**
 * Load workspace from localStorage or empty state
 */
export function loadWorkspaceState(): WorkspaceState {
	if (!browser) {
		return emptyWorkspace();
	}
	try {
		const stored = localStorage.getItem(WORKSPACE_STORAGE_KEY);
		if (stored) {
			const parsed = parseWorkspaceState(stored);
			if (parsed) return parsed;
		}
	} catch (error) {
		console.warn('Failed to load workspace from localStorage:', error);
	}
	return emptyWorkspace();
}

/**
 * Persist full workspace
 */
export function saveWorkspaceState(state: WorkspaceState): void {
	if (!browser) return;
	try {
		localStorage.setItem(WORKSPACE_STORAGE_KEY, serializeWorkspaceState(state));
	} catch (error) {
		console.warn('Failed to save workspace to localStorage:', error);
	}
}

/**
 * Add a factory and persist. Returns the new factory id.
 */
export function createFactory(name?: string): { workspace: WorkspaceState; factoryId: string } {
	const current = loadWorkspaceState();
	const next = addFactoryPure(current, name);
	const created = next.factories[next.factories.length - 1];
	saveWorkspaceState(next);
	return { workspace: next, factoryId: created.id };
}

export function applyRenameFactory(
	workspace: WorkspaceState,
	factoryId: string,
	name: string
): WorkspaceState {
	const next = renameFactoryPure(workspace, factoryId, name);
	saveWorkspaceState(next);
	return next;
}

export function applyRemoveFactory(workspace: WorkspaceState, factoryId: string): WorkspaceState {
	const next = removeFactoryPure(workspace, factoryId);
	saveWorkspaceState(next);
	return next;
}

export function applyUpdateFactoryGraph(
	workspace: WorkspaceState,
	factoryId: string,
	graph: GraphState
): WorkspaceState {
	const next = updateFactoryGraphPure(workspace, factoryId, graph);
	saveWorkspaceState(next);
	return next;
}

export function applySetSidebarCollapsed(
	workspace: WorkspaceState,
	collapsed: boolean
): WorkspaceState {
	const next = setSidebarCollapsedPure(workspace, collapsed);
	saveWorkspaceState(next);
	return next;
}
