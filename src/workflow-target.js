export default {
  async fetch(request) {
    try {
      const contentType = request.headers.get('Content-Type') || 'text/plain';
      const data = await request.text(); // pode ser json ou qualquer outro formato

      console.log("[TARGET] Dados recebidos do workflow:", data);

      const resultado = { recebido: true, conteudo: data };

      return new Response(
        JSON.stringify(resultado),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );

    } catch (err) {
      return new Response(
        JSON.stringify({ error: err.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },
};
