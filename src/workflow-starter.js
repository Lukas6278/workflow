import {MeuWorkflow} from './workflows/MeuWorkflow.js';

export default {
	async fetch(request, env) {
		const url = new URL(request.url);

		// Aceita apenas request em /redi
		if (url.pathname === '/redi') {
			try {
				const bodyData = await request.json();

				const targetUrl = bodyData.targetUrl || '';
				const callbackUrl = bodyData.callbackUrl || '';
				const headers = bodyData.headers || {};
				const payload = bodyData.body || {};

				const method = bodyData.method || 'POST';

				//cria workflow se tiver um dos dois com valor se nao, mas se nao tiver os dois nao cria
				if (Object.keys(payload).length === 0 && Object.keys(headers).length === 0) {
					return new Response(
						JSON.stringify({error: 'body e headers não podem estar vazios'}),
						{status: 400, headers: {'Content-Type': 'application/json'}}
					);
				}

				console.log('[STARTER] Requisição recebida:', {
					targetUrl,
					callbackUrl,
					headers,
					body: payload,
					method,
				});


				// se callbackUrl ou targetUrl não forem enviados erro 400
				if (!targetUrl || !callbackUrl) {
					return new Response(
						JSON.stringify({
							error: 'targetUrl ou callbackUrl é obrigatório no body principal',
						}),
						{status: 400, headers: {'Content-Type': 'application/json'}}
					);
				}

				const instance = await env.MEU_WORKFLOW.create({
					params: {
						targetUrl,
						callbackUrl,
						headers,
						body: payload,
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
					{status: 200, headers: {'Content-Type': 'application/json'}}
				);
			} catch (err) {
				console.error('[STARTER] Erro:', err);
				return new Response(JSON.stringify({error: err.message}), {
					status: 500,
					headers: {'Content-Type': 'application/json'},
				});
			}
		}

		// Qualquer outra rota retorna 404
		return new Response('Not Found', {status: 404});
	},
};

export {MeuWorkflow};
