import {MeuWorkflow} from './workflows/MeuWorkflow.js';

export default {
	async fetch(request, env) {
		try {
			const method = request.method;
			const contentType = request.headers.get('Content-Type') || 'application/octet-stream';
			const callbackUrl = request.headers.get('X-Callback-URL') || '';
		
			console.log('[STARTER] Requisição recebida:', {method, contentType});

			const targetUrl = 'https://google.com';

			const body = await request.arrayBuffer();

			const instance = await env.MEU_WORKFLOW.create({
					targetUrl,
					method : 'POST',
					contentType,
					callbackUrl,
					payload: body,
			});

			console.log(`[STARTER] Workflow ${instance.id} criado para ${targetUrl}`);

			return new Response(
				JSON.stringify({
					status: 'ok',
					message: 'Workflow criado e rodando em background',
					id: instance.id,
				}),
				{status: 200, headers: {'Content-Type': 'application/json'}}
			);
		} catch (err) {
			console.error('[STARTER] Erro:', err);
			return new Response(JSON.stringify({error: err.message}), {
				status: 500,
				headers: {'Content-Type': 'application/json'},
			});
		}
	},
};

export {MeuWorkflow};
