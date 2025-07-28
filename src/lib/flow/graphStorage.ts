import { browser } from '$app/environment';
import type { Edge, Node } from '@xyflow/svelte';
import { defaultEdges, defaultNodes } from './defaultGraph.js';

const STORAGE_KEY = 'factoryforge-graph';

export interface GraphState {
	nodes: Node[];
	edges: Edge[];
	nextNodeId: number;
}

/**
 * Load graph state from localStorage or return default state
 */
export function loadGraphState(): GraphState {
	if (!browser) {
		return {
			nodes: [...defaultNodes],
			edges: [...defaultEdges],
			nextNodeId: 5
		};
	}

	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			const parsed = JSON.parse(stored) as GraphState;
			// Validate that the parsed data has the expected structure
			if (parsed.nodes && parsed.edges && typeof parsed.nextNodeId === 'number') {
				return parsed;
			}
		}
	} catch (error) {
		console.warn('Failed to load graph state from localStorage:', error);
	}

	// Return default state if nothing was stored or if there was an error
	return {
		nodes: [...defaultNodes],
		edges: [...defaultEdges],
		nextNodeId: 5
	};
}

/**
 * Save graph state to localStorage
 */
export function saveGraphState(state: GraphState): void {
	if (!browser) return;

	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
	} catch (error) {
		console.warn('Failed to save graph state to localStorage:', error);
	}
}

/**
 * Reset graph to default state and save to localStorage
 */
export function resetGraphState(): GraphState {
	const defaultState: GraphState = {
		nodes: [...defaultNodes],
		edges: [...defaultEdges],
		nextNodeId: 5
	};

	saveGraphState(defaultState);
	return defaultState;
} 