<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths'
	import { tick } from 'svelte';
	import DeleteFactoryDialog from '$lib/components/DeleteFactoryDialog.svelte';
	import type { WorkspaceState } from '$lib/flow/graphStorage';
	import {
		applyRemoveFactory,
		applyRenameFactory,
		applySetSidebarCollapsed,
		createFactory,
		loadWorkspaceState,
	} from '$lib/flow/graphStorage';

	interface Props {
		currentFactoryId: string;
	}

	let { currentFactoryId }: Props = $props();

	let workspace = $state<WorkspaceState>(loadWorkspaceState());

	$effect(() => {
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		currentFactoryId;
		workspace = loadWorkspaceState();
	});
	let deleteTargetId = $state<string | null>(null);
	let deleteTargetName = $state('');
	let editingId = $state<string | null>(null);
	let editingName = $state('');

	$effect(() => {
		const id = editingId;
		if (!id) return;
		void tick().then(() => {
			const el = document.getElementById(`sidebar-rename-${id}`) as HTMLInputElement | null;
			el?.focus();
			el?.select();
		});
	});

	const collapsed = $derived(workspace.sidebarCollapsed === true);

	function refresh() {
		workspace = loadWorkspaceState();
	}

	function toggleCollapse() {
		workspace = applySetSidebarCollapsed(workspace, !collapsed);
	}

	function startRename(id: string, name: string) {
		editingId = id;
		editingName = name;
	}

	function commitRename() {
		if (!editingId) return;
		workspace = applyRenameFactory(workspace, editingId, editingName);
		editingId = null;
		editingName = '';
	}

	function cancelRename() {
		editingId = null;
		editingName = '';
	}

	function openDelete(id: string, name: string) {
		deleteTargetId = id;
		deleteTargetName = name;
	}

	function confirmDelete() {
		if (!deleteTargetId) return;
		const id = deleteTargetId;
		const isCurrent = id === currentFactoryId;
		workspace = applyRemoveFactory(workspace, id);
		deleteTargetId = null;
		deleteTargetName = '';
		if (isCurrent) {
			const next = workspace.factories[0];
			if (next) {
				goto(resolve(`/factories/${next.id}`));
			} else {
			    goto(resolve('/'))
			}
		}
	}

	function cancelDelete() {
		deleteTargetId = null;
		deleteTargetName = '';
	}

	function addFactory() {
		const { workspace: w, factoryId } = createFactory();
		workspace = w;
		goto(resolve(`/factories/${factoryId}`));
	}

	/** Re-read when window regains focus (e.g. another tab) */
	function onFocus() {
		refresh();
	}
</script>

<svelte:window onfocus={onFocus} />

<aside
	class="flex h-full shrink-0 flex-col border-r border-gray-200 bg-gray-50 transition-[width] duration-200 ease-out"
	class:w-14={collapsed}
	class:w-80={!collapsed}
>
	<div class="flex items-center justify-between gap-1 border-b border-gray-200 p-2">
		{#if !collapsed}
			<span class="truncate px-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
				Factories
			</span>
		{/if}
		<button
			type="button"
			onclick={toggleCollapse}
			class="rounded p-2 text-gray-600 hover:bg-gray-200"
			title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
			aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
		>
			{#if collapsed}
				<span class="text-lg" aria-hidden="true">»</span>
			{:else}
				<span class="text-lg" aria-hidden="true">«</span>
			{/if}
		</button>
	</div>

	{#if !collapsed}
		<div class="border-b border-gray-200 p-2">
			<button
				type="button"
				onclick={addFactory}
				class="w-full rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
			>
				New factory
			</button>
		</div>

		<div class="flex-1 overflow-y-auto p-2">
			{#if workspace.factories.length === 0}
				<p class="px-1 text-sm text-gray-500">No factories yet.</p>
			{:else}
				<ul class="space-y-2">
					{#each workspace.factories as factory (factory.id)}
						{@const active = factory.id === currentFactoryId}
						<li
							class="rounded-lg border bg-white shadow-sm"
							class:border-blue-400={active}
							class:ring-1={active}
							class:ring-blue-300={active}
							class:border-gray-200={!active}
						>
							<div class="flex items-start gap-1 p-2">
								<div class="min-w-0 flex-1 px-1 py-0.5">
									{#if editingId === factory.id}
										<input
											id="sidebar-rename-{factory.id}"
											bind:value={editingName}
											class="w-full rounded border border-gray-300 px-1 py-0.5 text-sm"
											onblur={commitRename}
											onmousedown={(e) => e.stopPropagation()}
											onclick={(e) => e.stopPropagation()}
											onkeydown={(e) => {
												if (e.key === 'Enter') commitRename();
												if (e.key === 'Escape') cancelRename();
											}}
										/>
									{:else}
										<a
											href={resolve(`/factories/${factory.id}`)}
											class="block rounded text-left hover:bg-gray-50"
											data-sveltekit-preload-data="tap"
										>
											<div class="truncate font-medium text-gray-900">{factory.name}</div>
											<!-- <div class="text-xs text-gray-500">
												{summary.length} node{summary.length === 1 ? '' : 's'}
											</div> -->
										</a>
									{/if}
								</div>
								<div class="flex shrink-0 flex-col gap-0.5">
									<button
										type="button"
										class="rounded px-1.5 py-0.5 text-xs text-gray-600 hover:bg-gray-100"
										onclick={() => startRename(factory.id, factory.name)}
										title="Rename"
									>
										Rename
									</button>
									<button
										type="button"
										class="rounded px-1.5 py-0.5 text-xs text-red-600 hover:bg-red-50"
										onclick={() => openDelete(factory.id, factory.name)}
										title="Delete factory"
									>
										Delete
									</button>
								</div>
							</div>
						</li>
					{/each}
				</ul>
			{/if}
		</div>

		<div class="border-t border-gray-200 p-2">
			<a
				href={resolve('/')}
				class="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-center text-sm text-gray-700 hover:bg-gray-50"
			>
				All factories
			</a>
		</div>
	{/if}
</aside>

<DeleteFactoryDialog
	open={deleteTargetId !== null}
	factoryName={deleteTargetName}
	onConfirm={confirmDelete}
	onCancel={cancelDelete}
/>
