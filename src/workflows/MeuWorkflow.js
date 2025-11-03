import { WorkflowEntrypoint } from 'cloudflare:workers';

export class MeuWorkflow extends WorkflowEntrypoint {
  async run(event, step) {
    try {
      const {
        method = 'POST',  // Define um método padrão
        contentType = 'application/json',
        payload,
        callbackUrl,
        targetUrl = 'https://workflow-target.meu-ai-worker.workers.dev/', // Alvo padrão
      } = event?.payload ?? {};

      console.log('[WORKFLOW] Step 1: Enviando requisição', targetUrl);

      // STEP 1: faz a requisição
      const result = await step.do(`${method} ${targetUrl}`, async () => {
        console.log(`[WORKFLOW] Iniciando ${method} para ${targetUrl}`);
        
        // Log do payload formatado como JSON
        console.log(`[WORKFLOW] Payload: ${JSON.stringify(payload, null, 2)}`); // Indentação para melhor leitura

        const resp = await fetch(targetUrl, {
          method, // Usa o método passado como parâmetro
          headers: { 'Content-Type': contentType },
          body: payload ? JSON.stringify(payload) : undefined, // Verifica se o payload é definido
        });

        const contentTypeResp = resp.headers.get('Content-Type');
        const text = await resp.text();

        console.log(`[WORKFLOW] Resposta: ${text}`);

        // Tenta parsear a resposta
        if (contentTypeResp && contentTypeResp.includes('application/json')) {
          try {
            const jsonResponse = JSON.parse(text);
            console.log(`[WORKFLOW] Resposta em JSON: ${JSON.stringify(jsonResponse, null, 2)}`);
            return { status: resp.status, body: jsonResponse };
          } catch (error) {
            console.error(`[WORKFLOW] Erro ao parsear resposta JSON: ${error.message}`);
          }
        } else {
          console.warn(`[WORKFLOW] Resposta não é JSON, recebida como texto: ${text}`);
          return { status: resp.status, body: text }; // Retorna o texto em vez de um objeto JSON
        }
      });

      console.log(`[WORKFLOW] Step 1 completo. Status: ${result.status}`);

      if (callbackUrl) {
        console.log('[WORKFLOW] Step 2: Enviando callback →', callbackUrl);
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
      console.error('[WORKFLOW] Erro:', err.message);
      return { done: false, error: err.message };
    }
  }
}
