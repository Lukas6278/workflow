import { WorkflowEntrypoint } from 'cloudflare:workers';

export class MeuWorkflow extends WorkflowEntrypoint {
  async run(event, step) {
    try {
      const {
        targetUrl,
        method = 'POST',
        contentType = 'application/json',
        payload,
        callbackUrl,
      } = event;

      const safeTarget =
        targetUrl && targetUrl !== 'undefined'
          ? targetUrl
          : `${new URL('/target', 'http://127.0.0.1:8787').href}`;

      console.log('[WORKFLOW] Step 1: Enviando POST para alvo →', safeTarget);

      // STEP 1
      const result = await step.do('POST para Worker alvo', async () => {
        const resp = await fetch(safeTarget, {
          method,
          headers: { 'Content-Type': contentType },
          body: payload,
        });

        const text = await resp.text();
        return { status: resp.status, body: text };
      });

      console.log(`[WORKFLOW] Step 1 completo. Status: ${result.status}`);

      // STEP 2
      if (callbackUrl && callbackUrl !== 'undefined') {
        console.log('[WORKFLOW] Step 2: Enviando callback para', callbackUrl);
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
