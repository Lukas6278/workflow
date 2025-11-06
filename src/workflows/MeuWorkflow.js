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
				method = 'POST',
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

			// Step 1 POST para o targetUrl
			const result = await step.do('Step 1 - POST para', async () => {
				const resp = await fetch(url.toString(), {
					method,
					headers: finalHeaders,
					body: payload,
				});
				const text = await resp.text();
				return {
					status: resp.status,
					body: text,
					headers: Object.fromEntries(resp.headers.entries()), // Coletando os headers da resposta
				};
			});

			console.log(`[WORKFLOW] Step 1 completo. Status: ${result.status}`);

			//console so pra ver oque chegou da request
			console.log(
				'[WORKFLOW IN <- TARGET] preview body:',
				result.body?.slice(0, 300) || '(vazio)'
			);
			console.log(
				'[WORKFLOW IN <- TARGET] preview headers:',
				JSON.stringify(headers, null, 2) || '(vazio)'
			);

			// Step 2  Processar e enviar para callback
			const processed = await step.do('Step 2 - Processar e enviar', async () => {
				let parsed;

				try {
					parsed = JSON.parse(result.body);
				} catch {
					parsed = {raw: result.body};
				}

				// Envia os dados processados para o callback
				if (callbackUrl) {
					const dataComHeaders = {
						payload: body,
						headers: headers,
						id: parsed.id,
					};

					await this.sendCallback(callbackUrl, {
						status: result.status,
						data: dataComHeaders,
					});
					
					console.log('[WORKFLOW] Step 2 completo. Resultado processado:');
					console.log('[WORKFLOW] Dados enviados ao callback:', {status: result.status,data: dataComHeaders,});
				}

				return {ok: true, payload: body, headers: headers };
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
