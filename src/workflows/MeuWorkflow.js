import { WorkflowEntrypoint } from 'cloudflare:workers';

export class MeuWorkflow extends WorkflowEntrypoint {
  async run(event, step) {
    const { targetUrl, method, headers, data, contentType, callbackUrl } = event;

    // Step 1 enviar para o Worker
    const result = await step.do('POST para o Worker', async () => {
      const resp = await fetch(targetUrl, {
        method: method || 'POST',
        headers,
        body: data,
      });
      const text = await resp.text();
      return { status: resp.status, body: text };
    });

    console.log(`[WORKFLOW] Step 1 retornou ${result.status}`);

    // Step 2 callback pra envia 
    if (callbackUrl) {
      await step.do('Enviar callback', async () => {
        await fetch(callbackUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ workflow: 'concluído', result }),
        });
      });
      console.log("[WORKFLOW] Callback enviado.");
    }

    return { done: true, result };
  }
}