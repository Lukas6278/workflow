import { MeuWorkflow } from './workflows/MeuWorkflow.js';

export default {
	async fetch(request, env) {
		const url = new URL(request.url);

		// rota /target de teste (apenas log + eco; NÃO cria workflow aqui!)
		if (url.pathname === '/target') {
			const ct = request.headers.get('content-type') || '';
			const buf = await request.arrayBuffer();
			const preview =
				ct.includes('json') || ct.startsWith('text/')
					? new TextDecoder().decode(buf)
					: `(binário ${buf.byteLength} bytes)`;
			console.log('[TARGET] CT:', ct);
			console.log('[TARGET] Recebido do workflow:', preview || '(vazio)');
			return new Response(
				JSON.stringify({
					ok: true,
					contentType: ct,
					size: buf.byteLength,
					preview: String(preview).slice(0, 400),
				}),
				{
					status: 200,
					headers: { 'content-type': 'application/json' },
				}
			);
		}

		try {
			const method = request.method;
			const contentType = request.headers.get('Content-Type') || 'application/octet-stream';
			const callbackUrl = request.headers.get('X-Callback-URL') || '';

			console.log('[STARTER] Requisição recebida:', { method, contentType });

			// TESTE (sem loop): use a própria /target
			const targetUrl = `${url.origin}/target`;
			// PRODUÇÃO: troque para seu endpoint real
			// const targetUrl = 'https://workflow-target.meu-ai-worker.workers.dev/target';

			const bodyText = await request.text();
			let payload = bodyText;
			if (contentType.includes('application/json')) {
				try {
					payload = bodyText ? JSON.parse(bodyText) : {};
				} catch {
					/* deixa como texto */
				}
			}
			console.log(`[STARTER] Payload antes de enviar:`, payload);

			const instance = await env.MEU_WORKFLOW.create({
				params: {
					targetUrl,
					method,
					contentType,
					callbackUrl,
					payload,
					headers: { 'x-flow': 'demo' },
				},
			});

			console.log(`[STARTER] Workflow ${instance.id} criado para ${targetUrl}`);

			return new Response(
				JSON.stringify({
					status: 'ok',
					message: 'Workflow criado e rodando em background',
					id: instance.id,
				}),
				{ status: 200, headers: { 'Content-Type': 'application/json' } }
			);
		} catch (err) {
			console.error('[STARTER] Erro:', err);
			return new Response(JSON.stringify({ error: err.message }), {
				status: 500,
				headers: { 'Content-Type': 'application/json' },
			});
		}
	},
};

export { MeuWorkflow };