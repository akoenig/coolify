<script context="module" lang="ts">
	import type { Load } from '@sveltejs/kit';
	export const load: Load = async ({ fetch }) => {
		const url = `/common/getUniqueName.json`;
		const res = await fetch(url);

		if (res.ok) {
			return {
				props: {
					...(await res.json())
				}
			};
		}

		return {
			status: res.status,
			error: new Error(`Could not load ${url}`)
		};
	};
</script>

<script lang="ts">
	export let name;
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { post } from '$lib/api';
	import { errorNotification } from '$lib/form';

	let nameEl: HTMLInputElement;
	onMount(() => {
		nameEl.focus();
	});
	async function handleSubmit() {
		try {
			const { id } = await post('/new/application.json', { name });
			return await goto(`/applications/${id}`);
		} catch ({ error }) {
			return errorNotification(error);
		}
	}
</script>

<div class="flex space-x-1 p-6 font-bold">
	<div class="mr-4 text-2xl tracking-tight">Add New Application</div>
</div>
<div class="pt-10">
	<form on:submit|preventDefault={handleSubmit}>
		<div class="flex flex-col items-center space-y-4">
			<input name="name" placeholder="Application name" bind:this={nameEl} bind:value={name} />
			<button type="submit" class="bg-green-600 hover:bg-green-500">Save</button>
		</div>
	</form>
</div>
