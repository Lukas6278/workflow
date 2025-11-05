import { MeuWorkflow } from './workflows/MeuWorkflow.js';

export default {
	async fetch(request, env) {
		const url = new URL(request.url);

		// Aceita apenas POST em /redi
		if (url.pathname === '/redi' && request.method === 'POST') {
			try {
				const bodyData = await request.json();

				const payload = bodyData.payload || {};
				const targetUrl = bodyData.targetUrl || "";
				const callbackUrl = bodyData.callbackUrl || "";
				const headers = bodyData.headers || {};
				const body = bodyData.body || {};			

				const method = 'POST';
				
				console.log('[STARTER] Requisição recebida:', {
					targetUrl,
					callbackUrl,	
					headers,					
					payload,	
					//body, 
					method,
				});

				// se callbackUrl ou targetUrl não forem enviados → erro 400
				if (!targetUrl || !callbackUrl) {
					return new Response(
						JSON.stringify({ error: 'targetUrl ou callbackUrl é obrigatório no body principal' }),
						{ status: 400, headers: { 'Content-Type': 'application/json' } }
					);
				}

				const instance = await env.MEU_WORKFLOW.create({
					params: {
						targetUrl,
						callbackUrl,	
						headers,					
						payload,
						body,
						method,
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
		}

		// Qualquer outra rota retorna 404
		return new Response('Not Found', { status: 404 });
	},
};

export { MeuWorkflow };
