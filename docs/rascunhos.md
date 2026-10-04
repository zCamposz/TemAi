# Tem Aí? — o que ainda está em rascunho

Itens conferidos no código e que ainda não estão entregues. O que já funciona (autenticação, anúncios, busca por geolocalização, mapas, ecopontos, endereço privado do perfil) não entra nesta lista.

## Reserva e transação (Incremento 4)

- Processo end-to-end de reserva e transação (solicitação, confirmação, pagamento, retirada e devolução).
- O locatário autenticado solicita a reserva de um item para um período, sem datas conflitantes.
- O locador confirma ou recusa solicitações de reserva.

Hoje a página do produto só simula o valor (diárias, taxa de 10% e caução). O botão “Solicitar reserva” avisa que a transação entra no Incremento 4.

## Confiança e operação

- Sistema de avaliações e reputação. As notas dos cards de demonstração são fixas; anúncio real entra com nota zero e não há fluxo para avaliar.
- Notificações de negócio por e-mail, no aplicativo ou SMS (aviso de reserva, mensagem entre usuários). Os toasts da tela são só feedback imediato.
- Painel administrativo. Não há rota, tela nem papel de administrador.

## Desempenho

- A busca por proximidade deve apresentar os resultados em até 3 segundos em condições normais de uso. A busca existe, mas esse tempo ainda não foi medido nem garantido no projeto.
