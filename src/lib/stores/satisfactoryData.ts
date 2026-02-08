import { browser } from '$app/environment';
import { Satisfactory } from '$lib/satisfactory';
import { derived, writable, type Readable } from 'svelte/store';

// State interface for the store
interface SatisfactoryDataState {
	data: Satisfactory.SatisfactoryData | null;
	loading: boolean;
	error: string | null;
	initialized: boolean;
}

// Initial state
const initialState: SatisfactoryDataState = {
	data: null,
	loading: false,
	error: null,
	initialized: false
};

// Create the main store
function createSatisfactoryDataStore() {
	const { subscribe, update } = writable<SatisfactoryDataState>(initialState);

	return {
		subscribe,

		// Load the data
		async load() {
			update((state) => ({ ...state, loading: true, error: null }));

			try {
				const data = await Satisfactory.loadData();
				update((state) => ({
					...state,
					data,
					loading: false,
					error: null,
					initialized: true
				}));
				return data;
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : 'Failed to load data';
				update((state) => ({
					...state,
					loading: false,
					error: errorMessage,
					initialized: true
				}));
				throw error;
			}
		},

		// Reset the store
		reset() {
			update(() => initialState);
		}
	};
}

// Create the store instance
export const satisfactoryDataStore = createSatisfactoryDataStore();

// Derived stores for easy access to specific parts of the data
export const buildings: Readable<Record<string, Satisfactory.Building> | null> = derived(
	satisfactoryDataStore,
	($store) => $store.data?.buildings ?? null
);

export const items: Readable<Record<string, Satisfactory.Item> | null> = derived(
	satisfactoryDataStore,
	($store) => $store.data?.items ?? null
);

export const recipes: Readable<Record<string, Satisfactory.Recipe> | null> = derived(
	satisfactoryDataStore,
	($store) => $store.data?.recipes ?? null
);

export const resources: Readable<Record<string, Satisfactory.Resource> | null> = derived(
	satisfactoryDataStore,
	($store) => $store.data?.resources ?? null
);

// Derived store for production buildings (buildings that appear in recipes)
export const productionBuildings: Readable<Satisfactory.Building[]> = derived(
	[satisfactoryDataStore],
	([$store]) => {
		if (!$store.data) return [];

		// Create a set of building class names that appear in recipes
		const productionBuildingClassNames = new Set<string>();

		Object.values($store.data.recipes).forEach((recipe) => {
			recipe.producedIn.forEach((buildingClassName) => {
				productionBuildingClassNames.add(buildingClassName);
			});
		});

		// Filter buildings to only include those that can produce items
		return Object.entries($store.data.buildings)
			.filter(([key, building]) => productionBuildingClassNames.has(building.className))
			.map(([key, building]) => ({
				...building,
				key
			}));
	}
);

// Convenience stores for loading and error states
export const isLoading: Readable<boolean> = derived(
	satisfactoryDataStore,
	($store) => $store.loading
);

export const error: Readable<string | null> = derived(
	satisfactoryDataStore,
	($store) => $store.error
);

export const isInitialized: Readable<boolean> = derived(
	satisfactoryDataStore,
	($store) => $store.initialized
);

// Auto-load data when in browser environment
if (browser) {
	satisfactoryDataStore.load().catch(console.error);
}
