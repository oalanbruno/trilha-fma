import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { salvarQuestionario, atualizarTrilhaSugerida, buscarQuestionarioPorId } from "./db";
import { CURSOS_FMA } from "../shared/cursos_atualizados";
import { QUESTOES } from "../shared/questoes";
import { invokeLLM } from "./_core/llm";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  questionario: router({
    // Retorna as questões do questionário
    obterQuestoes: publicProcedure.query(async () => {
      return QUESTOES;
    }),

    // Salva os dados iniciais (nome, email e whatsapp)
    salvarDados: publicProcedure
      .input(z.object({
        nome: z.string().min(1),
        email: z.string().email(),
        whatsapp: z.string().min(1),
        respostas: z.record(z.string(), z.number()),
      }))
      .mutation(async ({ input }) => {
        const resultado = await salvarQuestionario({
          nome: input.nome,
          email: input.email,
          whatsapp: input.whatsapp,
          respostas: JSON.stringify(input.respostas),
        });

        return {
          id: 1, // Placeholder - será substituído pela implementação real
          success: true,
        };
      }),

    // Gera a trilha de conhecimento baseada nas respostas
    gerarTrilha: publicProcedure
      .input(z.object({
        respostas: z.record(z.string(), z.number()),
      }))
      .mutation(async ({ input }) => {
        // Calcular pontuação por área
        const pontuacaoPorArea: Record<string, number> = {};

        Object.entries(input.respostas).forEach(([questaoId, valor]) => {
          const questao = QUESTOES.find((q: any) => q.id === parseInt(questaoId));
          if (questao && typeof valor === 'number') {
            questao.areas.forEach((area: string) => {
              pontuacaoPorArea[area] = (pontuacaoPorArea[area] || 0) + valor;
            });
          }
        });

        // Ordenar áreas por pontuação
        const areasOrdenadas = Object.entries(pontuacaoPorArea)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 3); // Top 3 áreas

        // Selecionar top 5 cursos das áreas com maior pontuação
        let cursosRecomendados: any[] = [];
        
        // Primeiro, pegar cursos das top 3 áreas
        for (const [area] of areasOrdenadas) {
          const cursosDaArea = CURSOS_FMA.filter(curso => curso.area === area);
          cursosRecomendados.push(...cursosDaArea);
          
          // Se já temos 5 ou mais cursos, parar
          if (cursosRecomendados.length >= 5) break;
        }
        
        // Se ainda não temos 5 cursos, pegar de outras áreas
        if (cursosRecomendados.length < 5) {
          const areasJaUsadas = areasOrdenadas.map(([area]) => area);
          const cursosExtras = CURSOS_FMA.filter(curso => 
            !areasJaUsadas.includes(curso.area) && 
            !cursosRecomendados.some((c: any) => c.nome === curso.nome)
          );
          cursosRecomendados.push(...cursosExtras);
        }
        
        // Garantir exatamente 5 cursos
        cursosRecomendados = cursosRecomendados.slice(0, 5);

        // Usar LLM para gerar justificativas personalizadas
        const prompt = `Com base nas respostas do questionário, o usuário demonstrou maior interesse nas seguintes áreas:
${areasOrdenadas.map(([area, pontos]) => `- ${area} (pontuação: ${pontos})`).join('\n')}

Cursos recomendados:
${cursosRecomendados.map((c: any) => `- ${c.nome} (${c.tipo}) - ${c.descricao}`).join('\n')}

Para cada curso recomendado, gere uma justificativa individual (2-3 frases) explicando por que este curso específico é ideal para o perfil do usuário.

Formato da resposta (JSON):
{
  "cursos": [
    {
      "nome": "Nome do Curso",
      "justificativa": "Justificativa personalizada de 2-3 frases",
      "prioridade": 1
    }
  ]
}

Ordene os cursos por prioridade (1 = mais recomendado).`;

        const llmResponse = await invokeLLM({
          messages: [
            { role: "system", content: "Você é um consultor educacional da Faculdade Mar Atlântico. Seja caloroso, profissional e motivador. Responda APENAS com JSON válido." },
            { role: "user", content: prompt }
          ],
        });

        const respostaLLM = typeof llmResponse.choices[0].message.content === 'string' 
          ? llmResponse.choices[0].message.content 
          : JSON.stringify(llmResponse.choices[0].message.content);
        let cursosComJustificativa;
        
        try {
          const jsonMatch = respostaLLM.match(/\{[\s\S]*\}/);
          const jsonStr = jsonMatch ? jsonMatch[0] : respostaLLM;
          const parsedResponse = JSON.parse(jsonStr);
          
          // Combinar dados dos cursos com justificativas do LLM
          cursosComJustificativa = parsedResponse.cursos.map((cursoLLM: any) => {
            const cursoOriginal = cursosRecomendados.find((c: any) => 
              c.nome.toLowerCase().includes(cursoLLM.nome.toLowerCase()) ||
              cursoLLM.nome.toLowerCase().includes(c.nome.toLowerCase())
            );
            
            return {
              ...cursoOriginal,
              justificativa: cursoLLM.justificativa,
              prioridade: cursoLLM.prioridade
            };
          }).sort((a: any, b: any) => a.prioridade - b.prioridade);
        } catch (e) {
          // Fallback: usar cursos sem justificativas individuais
          cursosComJustificativa = cursosRecomendados.map((c: any, idx: number) => ({
            ...c,
            justificativa: respostaLLM,
            prioridade: idx + 1
          }));
        }

        return {
          cursos: cursosComJustificativa,
          areas: areasOrdenadas.map(([area]) => area),
          pontuacoes: Object.fromEntries(areasOrdenadas),
        };
      }),

    // Envia email com a trilha
    enviarEmail: publicProcedure
      .input(z.object({
        email: z.string().email(),
        nome: z.string(),
        trilha: z.object({
          cursos: z.array(z.any()),
          justificativa: z.string(),
        }),
      }))
      .mutation(async ({ input }) => {
        // TODO: Implementar envio de email real
        // Por enquanto, apenas retorna sucesso
        console.log("Email seria enviado para:", input.email);
        console.log("Trilha:", input.trilha);

        return {
          success: true,
          message: "Email enviado com sucesso!",
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;
