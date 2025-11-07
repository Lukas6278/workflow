import {WorkflowEntrypoint} from 'cloudflare:workers';

export class MeuWorkflow extends WorkflowEntrypoint {
	async run(event, step) {
		try {
			const {
				targetUrl,
				callbackUrl,
				headers = {},
				body,
				contentType = 'application/json',
				method,
			} = event?.payload ?? {};

			// Monta URL
			const url = new URL(targetUrl);

			const finalHeaders = new Headers(headers);
			if (contentType && !finalHeaders.has('content-type')) {
				finalHeaders.set('content-type', contentType);
			}
			finalHeaders.set('x-internal-workflow', '1');

			let payload = body;
			if (typeof body === 'object') {
				payload = JSON.stringify(body);
			}

			let fetchOptions = {
				method,
				headers: finalHeaders,
			};

			if (method === 'GET' || method === 'HEAD') {
				fetchOptions.body = undefined;
			}

			// Step 1 POST para o targetUrl
			const result = await step.do(`Step 1 - ${method} para ${url}`, async () => {
				const resp = await fetch(url.toString(), fetchOptions);
				const text = await resp.text();
				return {
					status: resp.status,
					body: text,
					headers: Object.fromEntries(resp.headers.entries()),
				};
			});

			console.log(`[WORKFLOW] Step 1 completo. Status: ${result.status}`);

			// Step 2 enviar para callback
			const processed = await step.do('Step 2 - Processado e enviado para callback', async () => {
				if (callbackUrl) {
					const dataComHeaders = {
						payload: JSON.parse(result.body),
						headers: result.headers,
					};

					await this.sendCallback(callbackUrl, {
						status: result.status,
						data: dataComHeaders,
					});

					console.log('[WORKFLOW] Step 2 completo. Resultado processado:');
					console.log('[WORKFLOW] Dados enviados ao callback:', {
						status: result.status,
						data: {
							payload: JSON.stringify(result.body), // Transforma o array em string
							headers: result.headers,
						},
					});
				}

				return {ok: true, payload: JSON.parse(result.body), headers: result.headers};
			});

			console.log('[WORKFLOW] Finalizado com sucesso.');
			return {done: true, result: processed};
		} catch (err) {
			console.error('[WORKFLOW] Erro:', err?.message || err);
			return {done: false, error: String(err?.message || err)};
		}
	}

	// Envia o callback
	async sendCallback(callbackUrl, result) {
		await fetch(callbackUrl, {
			method: 'POST',
			headers: {'Content-Type': 'application/json'},
			body: JSON.stringify({
				workflow: 'concluído',
				result,
				timestamp: new Date().toISOString(),
			}),
		});
	}
}
