<script lang="ts">
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import DeleteFactoryDialog from '$lib/components/DeleteFactoryDialog.svelte';
	import type { WorkspaceState } from '$lib/flow/graphStorage';
	import {
		applyRemoveFactory,
		applyRenameFactory,
		createFactory,
		loadWorkspaceState,
	} from '$lib/flow/graphStorage';
	import { onMount, tick } from 'svelte';
	import { resolve } from '$app/paths';

	let workspace = $state<WorkspaceState>(emptySafe());

	function emptySafe(): WorkspaceState {
		if (!browser) return { factories: [], sidebarCollapsed: false };
		return loadWorkspaceState();
	}

	onMount(() => {
		workspace = loadWorkspaceState();
	});

	function refresh() {
		workspace = loadWorkspaceState();
	}

	let deleteTargetId = $state<string | null>(null);
	let deleteTargetName = $state('');
	let editingId = $state<string | null>(null);
	let editingName = $state('');

	$effect(() => {
		const id = editingId;
		if (!id) return;
		void tick().then(() => {
			const el = document.getElementById(`home-rename-${id}`) as HTMLInputElement | null;
			el?.focus();
			el?.select();
		});
	});

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
		workspace = applyRemoveFactory(workspace, deleteTargetId);
		deleteTargetId = null;
		deleteTargetName = '';
	}

	function cancelDelete() {
		deleteTargetId = null;
		deleteTargetName = '';
	}

	function addFactoryAndOpen() {
		const { workspace: w, factoryId } = createFactory();
		workspace = w;
		goto(resolve(`/factories/${factoryId}`));
	}

	function openFactory(id: string) {
		goto(`/factories/${id}`);
	}
</script>

<svelte:window onfocus={refresh} />

<div class="min-h-screen bg-gray-100">
	<div class="mx-auto max-w-5xl px-4 py-8">
		<header class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
			<div>
				<h1 class="text-3xl font-bold text-gray-900">Your factories</h1>
				<p class="mt-1 text-gray-600">
					Manage all production graphs. Open a factory to edit the flow, or create a new one.
				</p>
			</div>
			<button
				type="button"
				onclick={addFactoryAndOpen}
				class="shrink-0 rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white shadow hover:bg-blue-700"
			>
				New factory
			</button>
		</header>

		{#if workspace.factories.length === 0}
			<div
				class="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center shadow-sm"
			>
				<p class="text-lg text-gray-600">You don’t have any factories yet.</p>
				<p class="mt-2 text-sm text-gray-500">Create one to start building your production flow.</p>
				<button
					type="button"
					onclick={addFactoryAndOpen}
					class="mt-6 rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700"
				>
					Create your first factory
				</button>
			</div>
		{:else}
			<ul class="space-y-6">
				{#each workspace.factories as factory (factory.id)}
					<li class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
						<div class="flex flex-col gap-4 p-6 sm:flex-row sm:items-start sm:justify-between">
							<div class="min-w-0 flex-1">
								{#if editingId === factory.id}
									<input
										id="home-rename-{factory.id}"
										bind:value={editingName}
										class="mb-2 w-full max-w-md rounded border border-gray-300 px-2 py-1 text-lg font-semibold"
										onblur={commitRename}
										onkeydown={(e) => {
											if (e.key === 'Enter') commitRename();
											if (e.key === 'Escape') cancelRename();
										}}
									/>
								{:else}
									<h2 class="text-xl font-semibold text-gray-900">{factory.name}</h2>
								{/if}
								<p class="text-sm text-gray-500">
									Updated
									{new Date(factory.updatedAt).toLocaleString()}
								</p>
							</div>
							<div class="flex flex-wrap gap-2">
								<button
									type="button"
									onclick={() => openFactory(factory.id)}
									class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
								>
									Open
								</button>
								<button
									type="button"
									onclick={() => startRename(factory.id, factory.name)}
									class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
								>
									Rename
								</button>
								<button
									type="button"
									onclick={() => openDelete(factory.id, factory.name)}
									class="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 hover:bg-red-100"
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
</div>

<DeleteFactoryDialog
	open={deleteTargetId !== null}
	factoryName={deleteTargetName}
	onConfirm={confirmDelete}
	onCancel={cancelDelete}
/>

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
