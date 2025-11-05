import {WorkflowEntrypoint} from 'cloudflare:workers';

export class MeuWorkflow extends WorkflowEntrypoint {
	async run(event, step) {
		try {
			const {
				targetUrl,
				callbackUrl,
				contentType = 'application/json',
				payload,
				headers = {},
				body,
				method = 'POST',
			} = event?.payload ?? {};

			// Monta URL
			const url = new URL(targetUrl);

			// Headers finais
			const finalHeaders = new Headers(headers);
			if (contentType && !finalHeaders.has('content-type')) {
				finalHeaders.set('content-type', contentType);
			}
			finalHeaders.set('x-internal-workflow', '1');


			const  finalBody = JSON.stringify({payload: payload || {}, headers: headers || {}});

			// Log e Step 1
			const len = typeof finalBody === 'string' ? finalBody.length : finalBody?.byteLength ?? 0;
			console.log(
				`[WORKFLOW] Step 1: Enviando ${method} → ${url.toString()} | CT=${finalHeaders.get(
					'content-type'
				)} | LEN=${len}`
			);

			const result = await step.do('Step 1 - POST para', async () => {
				const resp = await fetch(url.toString(), {
					method,
					headers: finalHeaders,
					body: finalBody,
				}); // ← Usa finalBody
				const text = await resp.text();
				return {
					status: resp.status,
					body: text,
					headers: Object.fromEntries(resp.headers.entries()),
				};
			});

			console.log(`[WORKFLOW] Step 1 completo. Status: ${result.status}`);
			console.log('[WORKFLOW IN <- TARGET] preview:', result.body?.slice(0, 300) || '(vazio)');

			// Step 2
			const processed = await step.do('Step 2 - Processar e enviar', async () => {
				let parsed;
				try {
					parsed = JSON.parse(result.body);
				} catch {
					parsed = {raw: result.body};
				}

				if (callbackUrl) {
					await this.sendCallback(callbackUrl, {
						status: result.status,
						data: parsed,
						headers: result.headers,
						originalBody: body,
						originalPayload: payload,
					});
				}

				return {ok: true, data: parsed};
			});

			console.log('[WORKFLOW] Step 2 completo. Resultado processado:', processed);
			console.log('[WORKFLOW] Finalizado com sucesso.');

			return {done: true, result: processed};
		} catch (err) {
			console.error('[WORKFLOW] Erro:', err?.message || err);
			return {done: false, error: String(err?.message || err)};
		}
	}

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
