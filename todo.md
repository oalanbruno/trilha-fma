# TODO - Trilha de Conhecimento FMA

## Funcionalidades Principais

- [x] Criar schema do banco de dados para armazenar respostas dos usuários
- [x] Implementar interface de chat para coleta de nome e email
- [x] Criar questionário com frases afirmativas e escala 0-5
- [x] Desenvolver lógica de recomendação de cursos baseada nas respostas
- [ ] Integrar com Google Sheets para armazenar dados dos usuários (opcional - dados já salvos no banco)
- [ ] Implementar envio de email com trilha personalizada
- [x] Adicionar texto promocional da Faculdade Mar Atlântico no resultado
- [x] Criar design visual atraente e responsivo
- [x] Testar fluxo completo do questionário
- [x] Ajustar cores e identidade visual da FMA

## Melhorias Solicitadas

- [x] Adicionar campo de WhatsApp no formulário inicial

- [x] Atualizar lista de cursos com dados da planilha fornecida
- [x] Limitar recomendações a 5 cursos priorizados
- [x] Adicionar justificativa individual para cada curso recomendado
- [x] Incluir botão "Saiba mais" com link específico para cada curso

## Bugs

- [x] Corrigir lógica de recomendação - sistema está retornando apenas 2 cursos ao invés de 5

- [x] Corrigir mapeamento entre áreas das questões e áreas dos cursos - sistema recomenda cursos errados (ex: usuário interessado em Negócios recebe cursos de Filosofia)

## Melhorias de Design

- [x] Adaptar identidade visual para seguir o padrão da página oficial da FMA (cores, tipografia, estilo)

- [x] Remover todas as questões relacionadas a Medicina do questionário
- [x] Refazer questionário para abranger apenas áreas da planilha fornecida (Direito, Educação, Negócios e Inovação, Comunicação, Ciências Sociais, Filosofia, Psicologia e Saúde Mental)

## Novas Funcionalidades

- [x] Adicionar feedback visual mostrando como as respostas influenciaram o resultado final
- [x] Criar gráfico ou visualização das pontuações por área de conhecimento
- [x] Mostrar distribuição das respostas do usuário

## Campanha Black FMA

- [x] Adaptar página inicial para destacar campanha Black FMA
- [x] Adicionar seção de benefícios da Black FMA no final da trilha personalizada
- [x] Incluir informações sobre bônus exclusivos (Mentoring, 4 anos de acesso, 2 acessos pelo preço de 1)
- [x] Adicionar CTA para garantir vaga na Black FMA

- [x] Corrigir ano da campanha de 2024 para 2025

- [x] Adicionar máscara de telefone celular internacional ao campo WhatsApp

- [x] Adaptar máscara de WhatsApp para aceitar códigos de diferentes países

- [x] Corrigir detecção automática de código de país na máscara de WhatsApp

- [x] Corrigir erro de inserção no banco - coluna whatsapp estava faltando na tabela
