import { dev } from '$app/env';
import { asyncExecShell, getEngine } from '$lib/common';
import { prisma } from '$lib/database';
import { defaultProxyImageHttp, defaultProxyImageTcp } from '$lib/haproxy';

export default async function () {
	if (!dev) {
		const destinationDockers = await prisma.destinationDocker.findMany();
		for (const destinationDocker of destinationDockers) {
			const host = getEngine(destinationDocker.engine);
			// Tagging images with labels
			try {
				const images = [
					`coollabsio/${defaultProxyImageTcp}`,
					`coollabsio/${defaultProxyImageHttp}`,
					'certbot/certbot:latest',
					'node:16.14.0-alpine',
					'alpine:latest',
					'nginx:stable-alpine',
					'node:lts',
					'php:apache',
					'rust:latest'
				];
				for (const image of images) {
					await asyncExecShell(
						`DOCKER_HOST=${host} docker pull ${image} && echo "FROM ${image}" | docker build --label coolify.image="true" -t "${image}" -`
					);
				}
			} catch (error) {}
			try {
				await asyncExecShell(`DOCKER_HOST=${host} docker container prune -f`);
			} catch (error) {
				console.log(error);
			}
			// Cleanup images that are not managed by coolify
			try {
				await asyncExecShell(
					`DOCKER_HOST=${host} docker image prune --filter 'label!=coolify.image=true' -a -f`
				);
			} catch (error) {
				console.log(error);
			}
			// Cleanup dangling images
			try {
				await asyncExecShell(`DOCKER_HOST=${host} docker image prune -f`);
			} catch (error) {
				console.log(error);
			}
		}
	}
}
