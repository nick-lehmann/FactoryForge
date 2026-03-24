<script lang="ts">
	type Props = {
		name: string;
		onclick: () => void;
		onrename: (name: string) => void;
		ondelete: () => void;
	};

	let { name = $bindable(), onclick, onrename, ondelete }: Props = $props();

	function startRename() {
		isRenaming = true;
		editingName = name;
		editingField?.focus();
	}

	function rename() {
		isRenaming = false;
		onrename(editingName);
		editingName = '';
	}

	let isRenaming = $state(false);
	let editingName = $state('');

	let editingField: HTMLElement | null = $state(null);
</script>

<div class="flex items-start gap-1 p-2">
	<div class="min-w-0 flex-1 px-1 py-0.5">
		{#if isRenaming}
			<input
				bind:value={editingName}
				bind:this={editingField}
				class="w-full rounded border border-gray-300 px-1 py-0.5 text-sm"
				onblur={() => onrename(editingName)}
				onmousedown={(e) => e.stopPropagation()}
				onclick={(e) => e.stopPropagation()}
				onkeydown={(e) => {
					if (e.key === 'Enter') rename();
					if (e.key === 'Escape') isRenaming = false;
				}}
			/>
		{:else}
			<button
				{onclick}
				class="block rounded text-left hover:bg-gray-50"
				data-sveltekit-preload-data="tap"
			>
				<div class="truncate font-medium text-gray-900">{name}</div>
				<!-- <div class="text-xs text-gray-500">
					{summary.length} node{summary.length === 1 ? '' : 's'}
				</div> -->
			</button>
		{/if}
	</div>
	<div class="flex shrink-0 flex-col gap-0.5">
		<button
			type="button"
			class="rounded px-1.5 py-0.5 text-xs text-gray-600 hover:bg-gray-100"
			onclick={startRename}
			title="Rename"
		>
			Rename
		</button>
		<button
			type="button"
			class="rounded px-1.5 py-0.5 text-xs text-red-600 hover:bg-red-50"
			onclick={ondelete}
			title="Delete factory"
		>
			Delete
		</button>
	</div>
</div>
