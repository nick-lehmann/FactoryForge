<script lang="ts">
	import { SvelteFlowProvider } from '@xyflow/svelte';
	import '../app.css';

	let { children } = $props();
</script>

<SvelteFlowProvider>
	{@render children()}
</SvelteFlowProvider>
