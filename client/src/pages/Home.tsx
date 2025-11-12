import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { trpc } from "@/lib/trpc";
import { Loader2, Send, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";

type Etapa = "boas-vindas" | "dados-pessoais" | "questionario" | "resultado";

export default function Home() {
  const [etapa, setEtapa] = useState<Etapa>("boas-vindas");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [questaoAtual, setQuestaoAtual] = useState(0);
  const [respostas, setRespostas] = useState<Record<string, number>>({});
  const [trilhaGerada, setTrilhaGerada] = useState<any>(null);

  const { data: questoes } = trpc.questionario.obterQuestoes.useQuery();
  const salvarDados = trpc.questionario.salvarDados.useMutation();
  const gerarTrilha = trpc.questionario.gerarTrilha.useMutation();

  const totalQuestoes = questoes?.length || 0;
  const progresso = totalQuestoes > 0 ? ((questaoAtual + 1) / totalQuestoes) * 100 : 0;

  const handleIniciar = () => {
    setEtapa("dados-pessoais");
  };

  const handleSalvarDados = () => {
    if (!nome.trim() || !email.trim() || !whatsapp.trim()) {
      toast.error("Por favor, preencha todos os campos");
      return;
    }
    if (!email.includes("@")) {
      toast.error("Por favor, insira um email válido");
      return;
    }
    setEtapa("questionario");
  };

  const handleResposta = (valor: number) => {
    if (!questoes) return;

    const novasRespostas = {
      ...respostas,
      [questoes[questaoAtual].id.toString()]: valor,
    };
    setRespostas(novasRespostas);

    if (questaoAtual < totalQuestoes - 1) {
      setQuestaoAtual(questaoAtual + 1);
    } else {
      finalizarQuestionario(novasRespostas);
    }
  };

  const finalizarQuestionario = async (respostasFinal: Record<string, number>) => {
    try {
      // Salvar dados no banco
      await salvarDados.mutateAsync({
        nome,
        email,
        whatsapp,
        respostas: respostasFinal,
      });

      // Gerar trilha personalizada
      const trilha = await gerarTrilha.mutateAsync({
        respostas: respostasFinal,
      });

      setTrilhaGerada(trilha);
      setEtapa("resultado");
      toast.success("Sua trilha de conhecimento foi gerada!");
    } catch (error) {
      toast.error("Erro ao gerar trilha. Tente novamente.");
      console.error(error);
    }
  };

  const valorAtual = useMemo(() => {
    if (!questoes || questaoAtual >= questoes.length) return 3;
    return respostas[questoes[questaoAtual].id.toString()] ?? 3;
  }, [questoes, questaoAtual, respostas]);

  const escalaLabels = [
    "Não me identifico",
    "Me identifico pouco",
    "Me identifico moderadamente",
    "Me identifico",
    "Me identifico bastante",
    "Me identifico totalmente"
  ];

  if (etapa === "boas-vindas") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-100 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full shadow-2xl border-neutral-200" style={{paddingTop: '0px', paddingBottom: '0px'}}>
          <CardHeader className="text-center space-y-6 bg-black text-white rounded-t-lg pb-8" style={{paddingTop: '26px'}}>
            <div>
              <div className="mb-4">
                <div className="inline-block bg-yellow-400 text-black px-4 py-2 rounded-full text-sm font-bold mb-3">
                  🔥 BLACK FMA 2025
                </div>
              </div>
              <CardTitle className="text-4xl font-bold mb-3">
                Trilha de Conhecimento FMA
              </CardTitle>
              <CardDescription className="text-neutral-200 text-lg">
                Mais de 40 formações, com 4 anos de acesso, por um único valor. Responda ao questionário e descubra os cursos ideais para você na maior oferta da história da FMA.
              </CardDescription>
            </div>
          </CardHeader>         <CardContent className="space-y-6">
            <div className="bg-neutral-50 rounded-lg p-6 space-y-3 border-l-4 border-primary">
              <h3 className="font-semibold text-black flex items-center gap-2">
                <span className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm">1</span>
                Como funciona
              </h3>
              <p className="text-gray-700 ml-8">
                Você responderá a algumas perguntas sobre seus interesses e aspirações profissionais. Em uma escala de 0 a 5, responda o quanto se identifica com cada afirmação.
              </p>
            </div>

            <div className="bg-neutral-50 rounded-lg p-6 space-y-3 border-l-4 border-secondary" style={{borderColor: '#16b1a3'}}>
              <h3 className="font-semibold text-black flex items-center gap-2">
                <span className="w-6 h-6 bg-secondary text-black rounded-full flex items-center justify-center text-sm" style={{color: '#fefefe', backgroundColor: '#19b5a7'}}>2</span>
                Sua trilha personalizada
              </h3>
              <p className="text-gray-700 ml-8">
                Com base nas suas respostas, geraremos uma trilha de conhecimento exclusiva com os cursos mais adequados ao seu perfil.
              </p>
            </div>

            <Button
              onClick={handleIniciar}
              size="lg"
              className="w-full text-lg h-14 shadow-lg"
              style={{backgroundColor: '#19b5a7', color: '#ffffff', borderWidth: '0px'}}
            >
              Começar Agora
            </Button>

            <p className="text-center text-sm text-gray-500" style={{paddingBottom: '20px'}}>
              Tempo estimado: 5-7 minutos
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (etapa === "dados-pessoais") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full shadow-xl border-neutral-200">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-primary" style={{color: '#000000'}}>Vamos começar!</CardTitle>
            <CardDescription>
              Precisamos de algumas informações para personalizar sua experiência
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Seu nome completo</label>
              <Input
                type="text"
                placeholder="Digite seu nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="border-neutral-200 focus:border-neutral-200"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Seu melhor email</label>
              <Input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-neutral-200 focus:border-neutral-200"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Seu WhatsApp</label>
              <Input
                type="tel"
                placeholder="+55 (00) 00000-0000"
                value={whatsapp}
                onChange={(e) => {
                  let value = e.target.value;
                  // Remove tudo exceto números e o sinal de +
                  if (!value.startsWith('+')) {
                    value = '+' + value.replace(/\D/g, '');
                  } else {
                    value = '+' + value.slice(1).replace(/\D/g, '');
                  }
                  
                  // Limita a 15 dígitos (padrão internacional E.164)
                  const numbers = value.slice(1);
                  if (numbers.length > 15) {
                    value = '+' + numbers.slice(0, 15);
                  }
                  
                  // Detecta tamanho do código do país automaticamente
                  // Códigos de 1 dígito: +1 (EUA, Canadá)
                  // Códigos de 2 dígitos: +55 (Brasil), +44 (UK), etc
                  // Códigos de 3 dígitos: +351 (Portugal), etc
                  let countryCodeLength = 2; // padrão
                  if (numbers.startsWith('1')) {
                    countryCodeLength = 1;
                  } else if (numbers.length >= 3 && (numbers.startsWith('351') || numbers.startsWith('352') || numbers.startsWith('353'))) {
                    countryCodeLength = 3;
                  }
                  
                  // Formatação dinâmica
                  if (numbers.length > countryCodeLength) {
                    const countryCode = numbers.slice(0, countryCodeLength);
                    const rest = numbers.slice(countryCodeLength);
                    
                    if (rest.length > 0) {
                      if (rest.length <= 2) {
                        value = `+${countryCode} (${rest}`;
                      } else if (rest.length <= 6) {
                        value = `+${countryCode} (${rest.slice(0, 2)}) ${rest.slice(2)}`;
                      } else {
                        value = `+${countryCode} (${rest.slice(0, 2)}) ${rest.slice(2, 7)}-${rest.slice(7)}`;
                      }
                    }
                  }
                  
                  setWhatsapp(value);
                }}
                className="border-neutral-200 focus:border-neutral-200"
                maxLength={20}
              />
              <p className="text-xs text-gray-500">
                Formato internacional: +[Código País] (DDD) Número
              </p>
            </div>

            <Button
              onClick={handleSalvarDados}
              className="w-full bg-primary hover:bg-primary/90 border-2 border-secondary"
              size="lg" style={{borderWidth: '0px', borderColor: '#16b6a8'}}
            >
              Continuar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (etapa === "questionario" && questoes) {
    const questao = questoes[questaoAtual];

    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-100 flex items-center justify-center p-4">
        <Card className="max-w-3xl w-full shadow-xl border-neutral-200">
          <CardHeader>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-primary">
                Questão {questaoAtual + 1} de {totalQuestoes}
              </span>
              <span className="text-sm font-medium text-primary">
                {Math.round(progresso)}% concluído
              </span>
            </div>
            <div className="w-full bg-neutral-50 rounded-full h-2">
              <div
                className="bg-gradient-to-r bg-primary h-2 rounded-full transition-all duration-500"
                style={{ width: `${progresso}%` }}
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-8 pt-6">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-semibold text-gray-800 leading-relaxed">
                {questao.frase}
              </h2>
            </div>

            <div className="space-y-6">
              <div className="px-4">
                <Slider
                  value={[valorAtual]}
                  onValueChange={(value) => {
                    const novasRespostas = {
                      ...respostas,
                      [questao.id.toString()]: value[0],
                    };
                    setRespostas(novasRespostas);
                  }}
                  min={0}
                  max={5}
                  step={1}
                  className="cursor-pointer"
                />
              </div>

              <div className="flex justify-between text-xs text-gray-600 px-2">
                <span className="text-center max-w-[80px]">Não me identifico</span>
                <span className="text-center max-w-[80px]">Me identifico totalmente</span>
              </div>

              <div className="text-center">
                <div className="inline-flex items-center gap-3 bg-neutral-50 px-6 py-3 rounded-full">
                  <span className="text-sm text-gray-600">Sua resposta:</span>
                  <span className="text-lg font-bold text-primary">{valorAtual}</span>
                  <span className="text-sm text-gray-600">- {escalaLabels[valorAtual]}</span>
                </div>
              </div>
            </div>

            <Button
              onClick={() => handleResposta(valorAtual)}
              className="w-full bg-primary hover:bg-primary/90 border-2 border-secondary"
              size="lg"
              disabled={gerarTrilha.isPending || salvarDados.isPending}
              style={{fontSize: '15px', borderWidth: '0px'}}
            >
              {questaoAtual < totalQuestoes - 1 ? (
                <>
                  Próxima <Send className="ml-2 w-4 h-4" />
                </>
              ) : gerarTrilha.isPending || salvarDados.isPending ? (
                <>
                  <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                  Gerando sua trilha...
                </>
              ) : (
                <>
                  Finalizar e Ver Resultado <Sparkles className="ml-2 w-4 h-4" />
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (etapa === "resultado" && trilhaGerada) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-100 p-4 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          <Card className="shadow-xl border-neutral-200" style={{paddingTop: '0px'}}>
            <CardHeader className="text-center space-y-4 bg-gradient-to-r bg-primary text-white rounded-t-lg" style={{paddingTop: '25px', paddingBottom: '25px'}}>
              <div className="mx-auto w-16 h-16 bg-white rounded-full flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-3xl font-bold">
                Parabéns, {nome}!
              </CardTitle>
              <CardDescription className="text-primary text-lg" style={{color: '#ffffff'}}>
                Sua trilha de conhecimento personalizada está pronta
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-8 space-y-6">
              <div className="bg-neutral-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-primary mb-2">🎯 Suas áreas de maior interesse:</h3>
                <div className="flex flex-wrap gap-2">
                  {trilhaGerada.areas.map((area: string) => (
                    <span key={area} className="bg-neutral-50 text-white px-4 py-2 rounded-full text-sm font-medium" style={{color: '#000000', backgroundColor: '#ededed'}}>
                      {area}
                    </span>
                  ))}
                </div>
              </div>
              <p className="text-gray-600 text-center">
                Com base nas suas respostas, selecionamos 5 cursos priorizados especialmente para o seu perfil.
              </p>
            </CardContent>
          </Card>

          {/* Feedback Visual - Pontuações por Área */}
          <Card className="shadow-xl border-neutral-200">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-black">📊 Como chegamos a esse resultado?</CardTitle>
              <CardDescription>
                Veja como suas respostas foram distribuídas entre as diferentes áreas de conhecimento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {trilhaGerada.pontuacoes && Object.entries(trilhaGerada.pontuacoes)
                .sort(([, a]: any, [, b]: any) => b - a)
                .map(([area, pontos]: [string, any]) => {
                  const maxPontos = Math.max(...Object.values(trilhaGerada.pontuacoes as Record<string, number>));
                  const porcentagem = (pontos / maxPontos) * 100;
                  return (
                    <div key={area} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-800">{area}</span>
                        <span className="text-sm text-gray-600">{pontos} pontos</span>
                      </div>
                      <div className="w-full bg-neutral-200 rounded-full h-3 overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-1000 ease-out"
                          style={{ width: `${porcentagem}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              <div className="mt-6 p-4 bg-neutral-50 rounded-lg border-l-4 border-primary">
                <p className="text-sm text-gray-700">
                  <strong>💡 Como funciona:</strong> Cada resposta contribui para uma ou mais áreas de conhecimento.
                  Quanto maior a pontuação, mais você demonstrou interesse naquela área. Os cursos recomendados
                  foram selecionados das áreas com maiores pontuações.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800">Cursos Recomendados</h2>
            <div className="grid gap-4">
              {trilhaGerada.cursos.map((curso: any, index: number) => (
                <Card key={index} className="hover:shadow-lg transition-shadow border-neutral-200 relative">
                  <div className="absolute top-4 left-4 w-12 h-12 bg-gradient-to-br bg-primary text-white rounded-full flex items-center justify-center font-bold text-xl shadow-md">
                    {curso.prioridade || index + 1}
                  </div>
                  <CardHeader className="pl-20">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl text-primary mb-2">{curso.nome}</CardTitle>
                        <div className="flex gap-2 flex-wrap">
                          <span className="text-sm bg-neutral-50 text-black px-3 py-1 rounded-full font-medium">
                            {curso.tipo}
                          </span>
                          <span className="text-sm bg-neutral-50 text-primary px-3 py-1 rounded-full font-medium" style={{color: '#000000'}}>
                            {curso.area}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pl-20 space-y-4">
                    {curso.justificativa && (
                      <div className="bg-neutral-50 p-4 rounded-lg border-l-4 border-neutral-200">
                        <p className="text-sm font-semibold text-primary mb-2">Por que este curso é ideal para você:</p>
                        <p className="text-gray-700 leading-relaxed">{curso.justificativa}</p>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600">{curso.descricao}</p>
                    </div>
                    <Button
                      variant="default"
                      className="w-full bg-primary hover:bg-primary/90 border-2 border-secondary"
                      onClick={() => window.open(curso.link, "_blank")} style={{borderWidth: '0px', borderColor: '#16b6a8'}}
                    >
                      Saiba Mais Sobre Este Curso →
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Black FMA - Oferta Especial */}
          <Card className="shadow-2xl border-4 border-yellow-400 overflow-hidden">
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 p-6 text-center">
              <h2 className="text-3xl font-bold text-black mb-2">🔥 APROVEITE A BLACK FMA</h2>
              <p className="text-black text-lg font-semibold">A maior oferta da história do ensino superior brasileiro</p>
            </div>
            <CardContent className="pt-8 space-y-6">
              <div className="text-center mb-6">
                <p className="text-2xl font-bold text-gray-800 mb-2">43 cursos por um único valor</p>
                <p className="text-gray-600">Acesso completo a pós-graduações reconhecidas pelo MEC, certificações e formações</p>
              </div>

              <div className="bg-neutral-50 rounded-lg p-6 space-y-4">
                <h3 className="text-xl font-bold text-gray-800 mb-4">✨ Bônus Exclusivos:</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">🎯</span>
                    <div>
                      <p className="font-semibold text-gray-800">Programa de Mentoring FMA</p>
                      <p className="text-sm text-gray-600">6 meses de acompanhamento com encontros online quinzenais</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">⏰</span>
                    <div>
                      <p className="font-semibold text-gray-800">4 anos de acesso</p>
                      <p className="text-sm text-gray-600">Para todos os inscritos até 12 de novembro, às 23h59</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">🎁</span>
                    <div>
                      <p className="font-semibold text-gray-800">2 acessos pelo preço de 1</p>
                      <p className="text-sm text-gray-600">Presenteie alguém com acesso completo gratuitamente (até 06/11)</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-primary text-white rounded-lg p-6 text-center" style={{backgroundColor: '#19b5a7'}}>
                <p className="text-sm mb-2 opacity-90">Investimento</p>
                <p className="text-4xl font-bold mb-1">24x R$ 489</p>
                <p className="text-sm opacity-90">Ou 24x R$ 389 para alunos FMA</p>
              </div>

              <div className="space-y-3">
                <Button
                  size="lg"
                  className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold text-lg h-14"
                  onClick={() => window.open("https://faculdademaratlantico.edu.br/", "_blank")}
                >
                  🔥 GARANTIR MINHA VAGA AGORA
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full border-2 border-primary text-primary hover:bg-primary hover:text-white"
                  onClick={() => window.open("https://faculdademaratlantico.edu.br/", "_blank")}
                >
                  Falar com um Consultor
                </Button>
              </div>

              <div className="text-center pt-4">
                <p className="text-sm text-gray-600">
                  🔒 Mais de 15 mil alunos em 102 países | Reconhecida pelo MEC
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="text-center text-sm text-gray-600">
            <p>Sua trilha personalizada foi enviada para <strong>{email}</strong></p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
}
