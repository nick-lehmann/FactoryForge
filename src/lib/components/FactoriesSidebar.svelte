<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths'
	import DeleteFactoryDialog from '$lib/components/DeleteFactoryDialog.svelte';
	import type { WorkspaceState } from '$lib/flow/graphStorage';
	import {
		applyRemoveFactory,
		applyRenameFactory,
		applySetSidebarCollapsed,
		createFactory,
		loadWorkspaceState,
	} from '$lib/flow/graphStorage';
	import FactoryOverview from './FactoryOverview.svelte'

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

	const collapsed = $derived(workspace.sidebarCollapsed === true);

	function refresh() {
		workspace = loadWorkspaceState();
	}

	function toggleCollapse() {
		workspace = applySetSidebarCollapsed(workspace, !collapsed);
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
						    <FactoryOverview
								name={factory.name}
								onclick={() => goto(resolve(`/factories/${factory.id}`))}
								onrename={(name) => workspace = applyRenameFactory(workspace, factory.id, name)}
								ondelete={() => workspace = applyRemoveFactory(workspace, factory.id)}
							/>
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
