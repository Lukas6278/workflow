import { WorkflowEntrypoint } from 'cloudflare:workers';

export class MeuWorkflow extends WorkflowEntrypoint {
	async run(event, step) {
		try {
			// tudo que o starter enviar deve estar em event.payload
			const {
				method = 'POST',
				contentType = 'application/json',
				payload,
				callbackUrl,
				targetUrl = 'https://workflow-starter.fariasribas.workers.dev', // prod
				headers = {}, // extra headers para o target (opcional)
			} = event?.payload ?? {};

			if (!targetUrl) return { done: false, error: 'targetUrl missing' };

			// monta URL (e garante que existe como variável!)
			const url = new URL(targetUrl);

			// headers finais + fusível anti-loop
			const finalHeaders = new Headers(headers);
			if (contentType && !finalHeaders.has('content-type')) {
				finalHeaders.set('content-type', contentType);
			}
			finalHeaders.set('x-internal-workflow', '1');

			// normaliza body
			let body;
			if (payload == null) {
				body = undefined;
			} else if (typeof payload === 'string') {
				body = payload;
			} else if (payload instanceof ArrayBuffer || payload instanceof Uint8Array) {
				body = payload;
			} else if ((finalHeaders.get('content-type') || '').includes('application/json')) {
				body = JSON.stringify(payload);
			} else {
				body = String(payload);
			}

			// log de saída
			const len = typeof body === 'string' ? body.length : body?.byteLength ?? 0;
			console.log('[WORKFLOW] Step 1: Enviando POST →', url.toString());
			console.log('[WORKFLOW OUT] CT =', finalHeaders.get('content-type'), 'LEN =', len);

			// STEP 1: faz o POST
			const result = await step.do('POST para Worker alvo', async () => {
				const resp = await fetch(url.toString(), { method, headers: finalHeaders, body });
				const text = await resp.text();
				return { status: resp.status, body: text };
			});

			console.log(`[WORKFLOW] Step 1 completo. Status: ${result.status}`);
			console.log('[WORKFLOW IN <- TARGET] preview:', result.body?.slice(0, 600) || '(vazio)');

			// STEP 2: callback opcional
			if (callbackUrl) {
				await step.do('Enviar callback', async () => {
					await fetch(callbackUrl, {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							workflow: 'concluído',
							result,
							timestamp: new Date().toISOString(),
						}),
					});
				});
				console.log('[WORKFLOW] Callback enviado com sucesso.');
			}

			return { done: true, result };
		} catch (err) {
			console.error('[WORKFLOW] Erro:', err?.message || err);
			return { done: false, error: String(err?.message || err) };
		}
	}
}