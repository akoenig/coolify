<script context="module" lang="ts">
	import type { Load } from '@sveltejs/kit';
	function checkConfiguration(service): string {
		let configurationPhase = null;
		if (!service.type) {
			configurationPhase = 'type';
		} else if (!service.version) {
			configurationPhase = 'version';
		} else if (!service.destinationDockerId) {
			configurationPhase = 'destination';
		}
		return configurationPhase;
	}
	export const load: Load = async ({ fetch, params, url }) => {
		let readOnly = false;
		const endpoint = `/services/${params.id}.json`;
		const res = await fetch(endpoint);
		if (res.ok) {
			const { service, isRunning } = await res.json();
			if (!service || Object.entries(service).length === 0) {
				return {
					status: 302,
					redirect: '/databases'
				};
			}
			const configurationPhase = checkConfiguration(service);
			if (
				configurationPhase &&
				url.pathname !== `/services/${params.id}/configuration/${configurationPhase}`
			) {
				return {
					status: 302,
					redirect: `/services/${params.id}/configuration/${configurationPhase}`
				};
			}
			if (service.plausibleAnalytics?.email && service.plausibleAnalytics.username) readOnly = true;
			if (service.wordpress?.mysqlDatabase) readOnly = true;

			return {
				props: {
					service,
					isRunning
				},
				stuff: {
					service,
					isRunning,
					readOnly
				}
			};
		}

		return {
			status: 302,
			redirect: '/services'
		};
	};
</script>

<script>
	import { session } from '$app/stores';
	import { errorNotification } from '$lib/form';
	import DeleteIcon from '$lib/components/DeleteIcon.svelte';
	import Loading from '$lib/components/Loading.svelte';
	import { del, post } from '$lib/api';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	export let service;
	export let isRunning;

	let loading = false;

	async function deleteService() {
		const sure = confirm(`Are you sure you would like to delete '${service.name}'?`);
		if (sure) {
			loading = true;
			try {
				if (service.type) await post(`/services/${service.id}/${service.type}/stop.json`, {});
				await del(`/services/${service.id}/delete.json`, { id: service.id });
				return await goto(`/services`);
			} catch ({ error }) {
				return errorNotification(error);
			} finally {
				loading = false;
			}
		}
	}
	async function stopService() {
		const sure = confirm(`Are you sure you would like to stop '${service.name}'?`);
		if (sure) {
			loading = true;
			try {
				await post(`/services/${service.id}/${service.type}/stop.json`, {});
				return window.location.reload();
			} catch ({ error }) {
				return errorNotification(error);
			} finally {
				loading = false;
			}
		}
	}
	async function startService() {
		loading = true;
		try {
			await post(`/services/${service.id}/${service.type}/start.json`, {});
			return window.location.reload();
		} catch ({ error }) {
			return errorNotification(error);
		} finally {
			loading = false;
		}
	}
	// onMount(async () => {
	// 	if (
	// 		service.type &&
	// 		service.destinationDockerId &&
	// 		service.version &&
	// 		service.fqdn &&
	// 		!isRunning
	// 	) {
	// 		try {
	// 			await post(`/services/${service.id}/${service.type}/stop.json`, {});
	// 		} catch ({ error }) {
	// 			return errorNotification(error);
	// 		} finally {
	// 			loading = false;
	// 		}
	// 	}
	// });
</script>

<nav class="nav-side">
	{#if loading}
		<Loading fullscreen cover />
	{:else}
		{#if service.type && service.destinationDockerId && service.version && service.fqdn}
			{#if isRunning}
				<button
					on:click={stopService}
					title="Stop Service"
					type="submit"
					disabled={!$session.isAdmin}
					class="icons bg-transparent tooltip-bottom text-sm flex items-center space-x-2 hover:bg-pink-600 hover:text-white"
					data-tooltip={$session.isAdmin
						? 'Stop Service'
						: 'You do not have permission to stop the service.'}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="w-6 h-6"
						viewBox="0 0 24 24"
						stroke-width="1.5"
						stroke="currentColor"
						fill="none"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path stroke="none" d="M0 0h24v24H0z" fill="none" />
						<rect x="6" y="5" width="4" height="14" rx="1" />
						<rect x="14" y="5" width="4" height="14" rx="1" />
					</svg>
				</button>
			{:else}
				<button
					on:click={startService}
					title="Start Service"
					type="submit"
					disabled={!$session.isAdmin}
					class="icons bg-transparent tooltip-bottom text-sm flex items-center space-x-2 hover:bg-pink-600 hover:text-white"
					data-tooltip={$session.isAdmin
						? 'Start Service'
						: 'You do not have permission to start the service.'}
					><svg
						xmlns="http://www.w3.org/2000/svg"
						class="w-6 h-6"
						viewBox="0 0 24 24"
						stroke-width="1.5"
						stroke="currentColor"
						fill="none"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path stroke="none" d="M0 0h24v24H0z" fill="none" />
						<path d="M7 4v16l13 -8z" />
					</svg>
				</button>
			{/if}
		{/if}
		<button
			on:click={deleteService}
			title="Delete Service"
			type="submit"
			disabled={!$session.isAdmin}
			class:hover:text-red-500={$session.isAdmin}
			class="icons bg-transparent tooltip-bottom text-sm"
			data-tooltip={$session.isAdmin
				? 'Delete Service'
				: 'You do not have permission to delete a service.'}><DeleteIcon /></button
		>
	{/if}
</nav>
<slot />
