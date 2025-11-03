import {MeuWorkflow} from './workflows/MeuWorkflow.js';

export default {
	async fetch(request, env) {
		try {

			// Define para onde o workflow vai apontar
			const targetUrl = 'https://google.com';

			console.log(
				targetUrl,
			);

			const callback = request.headers.get('X-Callback-URL') || '';

			const resp = await fetch(targetUrl, {
				method: 'GET',
			});
			console.log(resp, JSON.stringify(resp));
			const responseText = await resp.text();
			const step2 = await fetch(callback);
			console.log(step2, JSON.stringify(step2));
      

			// console.log(`[LOG] Workflow ${instance.id} criado para ${targetUrl}`);

			return new Response(
				JSON.stringify({status: 'ok', message: 'Workflow iniciado em background'}),
				{status: 200, headers: {'Content-Type': 'application/json'}}
			);
		} catch (err) {
			return new Response(JSON.stringify({error: err.message}), {
				status: 500,
				headers: {'Content-Type': 'application/json'},
			});
		}
	},
};

export {MeuWorkflow};
