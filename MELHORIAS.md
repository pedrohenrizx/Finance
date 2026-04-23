# 25 Melhorias Implementadas no Dashboard de Finanças Pessoais

## UI/UX (Interface e Experiência do Utilizador)
1. **Toast Notifications:** Sistema global de notificações não-intrusivas (sucesso, erro, aviso) em vez de `alert()`.
2. **Password Visibility Toggle:** Botão com ícone para mostrar/ocultar a senha no login.
3. **Remember Me (Lembrar de Mim):** Checkbox no login que ajusta a duração do cookie da sessão (ex: 30 dias vs 1 dia).
4. **Esqueci a Senha:** Link visual para recuperação de senha na página de login.
5. **Loading States Aprimorados:** Desativação de botões (`disabled`) e alteração do texto para "Salvando..." durante envios de formulário.
6. **Count-up Animations:** Animação suave dos números nas caixas de Receitas, Despesas e Saldo Total ao carregar os dados.
7. **Tooltips Refinados:** Os gráficos agora mostram o valor monetário exato (`R$`) ao passar o rato (hover).
8. **Tabela de Transações Recentes:** Adição de uma tabela listando os últimos registos, substituindo o conceito vago de gráfico histórico.
9. **Empty States Ilustrativos:** Mensagens estilizadas para quando não há transações ou metas a mostrar.
10. **Acessibilidade (ARIA):** Adição de rótulos (aria-labels) para leitores de ecrã em botões apenas com ícones.
11. **Footer Global:** Um rodapé consistente nas páginas principais com links úteis.
12. **Sidebar Responsiva Melhorada:** O menu lateral fecha automaticamente ao clicar num link (em ecrãs pequenos).

## Funcionalidades e Funcionalidade Core
13. **Upload de Foto de Perfil:** Utilização do `Parse.File` para permitir o upload de um avatar no Perfil.
14. **Edição de Perfil:** Formulário para atualizar Nome e Email do `Parse.User`.
15. **Exportação para CSV:** Novo botão para exportar as transações filtradas para formato `.csv` (além do PDF já existente).
16. **Filtros Avançados (Tipo e Categoria):** Capacidade de filtrar transações não só por data, mas também por receita/despesa e categoria.
17. **Botão de Limpar Filtros:** Atalho rápido para repor todos os filtros.
18. **Refresh Manual:** Adição de um botão de atualização rápida para forçar o recarregamento dos dados.
19. **Edição de Transações:** Capacidade de clicar e editar uma transação existente diretamente da tabela.
20. **Exclusão de Transações:** Botão na tabela para apagar (delete) uma transação do banco de dados (Parse).
21. **Edição de Metas:** Adição de ícones para editar valores de uma meta existente.
22. **Exclusão de Metas:** Adição de ícones para eliminar uma meta existente.
23. **Modal de Confirmação de Logout:** Aviso de segurança para confirmar se o utilizador deseja realmente sair, evitando cliques acidentais.

## Segurança e Organização Estrutural
24. **Separação de Utilitários:** Movimentação das funções de formatação, animação e Toasts para um ficheiro genérico `js/utils.js`.
25. **Proteção Anti-Spam de Formulários:** Bloqueio de submissão múltipla rápida em todos os formulários (`preventDefault` e debouncing visual nos botões).
