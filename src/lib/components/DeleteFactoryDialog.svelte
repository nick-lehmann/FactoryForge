<script lang="ts">
	import { Dialog } from 'bits-ui';

	interface Props {
		open: boolean;
		factoryName: string;
		onConfirm: () => void;
		onCancel: () => void;
	}

	let { open, factoryName, onConfirm, onCancel }: Props = $props();
</script>

<Dialog.Root
	{open}
	onOpenChange={(v: boolean) => {
		if (!v) onCancel();
	}}
>
	<Dialog.Portal>
		<Dialog.Overlay class="fixed inset-0 z-50 bg-black/50" />
		<Dialog.Content
			class="fixed top-1/2 left-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-2xl"
		>
			<Dialog.Title class="text-lg font-semibold text-gray-900">Delete factory?</Dialog.Title>
			<Dialog.Description class="mt-2 text-sm text-gray-600">
				This will permanently remove <strong>{factoryName}</strong> and its graph from this browser. This
				cannot be undone.
			</Dialog.Description>
			<div class="mt-6 flex justify-end gap-2">
				<button
					type="button"
					class="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
					onclick={onCancel}
				>
					Cancel
				</button>
				<button
					type="button"
					class="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
					onclick={onConfirm}
				>
					Delete
				</button>
			</div>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
