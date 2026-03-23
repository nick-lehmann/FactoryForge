import { describe, expect, it } from 'vitest';
import {
	addFactory,
	createDefaultGraphState,
	emptyWorkspace,
	parseWorkspaceState,
	removeFactory,
	renameFactory,
	serializeWorkspaceState,
	setSidebarCollapsed,
	updateFactoryGraph,
	getFactoryById
} from './workspaceState.js';

describe('workspaceState', () => {
	it('addFactory appends a factory with default graph', () => {
		const ws = emptyWorkspace();
		const next = addFactory(ws, 'Alpha');
		expect(next.factories).toHaveLength(1);
		expect(next.factories[0].name).toBe('Alpha');
		expect(next.factories[0].graph.nodes.length).toBeGreaterThan(0);
	});

	it('renameFactory trims name', () => {
		let ws = addFactory(emptyWorkspace(), 'A');
		const id = ws.factories[0].id;
		ws = renameFactory(ws, id, '  Beta  ');
		expect(getFactoryById(ws, id)?.name).toBe('Beta');
	});

	it('removeFactory drops by id', () => {
		let ws = addFactory(emptyWorkspace(), 'A');
		const id = ws.factories[0].id;
		ws = removeFactory(ws, id);
		expect(ws.factories).toHaveLength(0);
	});

	it('updateFactoryGraph replaces graph', () => {
		let ws = addFactory(emptyWorkspace(), 'A');
		const id = ws.factories[0].id;
		const g = createDefaultGraphState();
		g.nextNodeId = 99;
		ws = updateFactoryGraph(ws, id, g);
		expect(getFactoryById(ws, id)?.graph.nextNodeId).toBe(99);
	});

	it('parseWorkspaceState round-trips', () => {
		let ws = addFactory(emptyWorkspace(), 'X');
		ws = setSidebarCollapsed(ws, true);
		const raw = serializeWorkspaceState(ws);
		const parsed = parseWorkspaceState(raw);
		expect(parsed).not.toBeNull();
		expect(parsed!.factories).toHaveLength(1);
		expect(parsed!.factories[0].name).toBe('X');
		expect(parsed!.sidebarCollapsed).toBe(true);
	});

	it('parseWorkspaceState rejects invalid json', () => {
		expect(parseWorkspaceState('not json')).toBeNull();
	});
});
