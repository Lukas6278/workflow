export default {
  async fetch(request) {
    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    let recebido;
    const contentType = request.headers.get('Content-Type') || '';
    try {
      if (contentType.includes('application/json')) {
        recebido = await request.json();
      } else {
        recebido = await request.text();
      }
    } catch {
      recebido = 'Erro ao processar o corpo da requisição';
    }

    return new Response(
      JSON.stringify({ ok: true, recebido }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  },
};