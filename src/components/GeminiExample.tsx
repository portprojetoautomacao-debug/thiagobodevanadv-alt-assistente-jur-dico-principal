import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { isGeminiConfigured } from "@/lib/gemini-config";
import {
  analyzeDocument,
  answerLegalQuestion,
  calculateDeadline,
  generatePeticao,
  suggestStrategy,
  summarizeJurisprudence,
} from "@/lib/gemini-service";
import { ArrowRight, Sparkles, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type AnalysisType =
  | "document"
  | "question"
  | "deadline"
  | "strategy"
  | "jurisprudence"
  | "peticao";

interface AnalysisOption {
  id: AnalysisType;
  label: string;
  placeholder: string;
  description: string;
}

const ANALYSIS_OPTIONS: AnalysisOption[] = [
  {
    id: "document",
    label: "Analisar Documento",
    placeholder: "Cole aqui o texto do documento jurídico para análise...",
    description: "Analisa documentos e fornece resumo estruturado",
  },
  {
    id: "question",
    label: "Pergunta Jurídica",
    placeholder: "Digite sua pergunta jurídica...",
    description: "Responde perguntas com fundamentação legal",
  },
  {
    id: "deadline",
    label: "Calcular Prazo",
    placeholder:
      "Data de publicação: 15/01/2024\nPrazo: 15 dias\nContexto: Recurso de apelação",
    description: "Analisa prazos processuais com base no CPC",
  },
  {
    id: "strategy",
    label: "Sugerir Estratégia",
    placeholder: "Descreva o caso e a situação atual...",
    description: "Fornece análise estratégica e recomendações",
  },
  {
    id: "jurisprudence",
    label: "Resumir Jurisprudência",
    placeholder: "Cole aqui o texto do acórdão ou decisão...",
    description: "Extrai teses e pontos principais de decisões",
  },
  {
    id: "peticao",
    label: "Gerar Minuta",
    placeholder:
      "Tipo: Contestação\nDetalhes: Cliente é réu em ação de cobrança...",
    description: "Gera minutas de peças processuais",
  },
];

export default function GeminiExample() {
  const [selectedType, setSelectedType] = useState<AnalysisType>("document");
  const [input, setInput] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const isConfigured = isGeminiConfigured();

  const handleAnalyze = async () => {
    if (!input.trim()) {
      toast.error("Digite ou cole o texto para análise");
      return;
    }

    setLoading(true);
    setResult("");

    try {
      let response;

      switch (selectedType) {
        case "document":
          response = await analyzeDocument(input);
          break;
        case "question":
          response = await answerLegalQuestion(input);
          break;
        case "deadline":
          response = await calculateDeadline(
            new Date().toISOString(),
            15,
            input
          );
          break;
        case "strategy":
          response = await suggestStrategy(input);
          break;
        case "jurisprudence":
          response = await summarizeJurisprudence(input);
          break;
        case "peticao":
          response = await generatePeticao("Petição Inicial", input);
          break;
      }

      if (response.error) {
        toast.error(response.error);
      } else if (response.text) {
        setResult(response.text);
        toast.success("Análise concluída!");
      }
    } catch (error) {
      console.error("Erro na análise:", error);
      toast.error("Erro ao processar análise");
    } finally {
      setLoading(false);
    }
  };

  const currentOption = ANALYSIS_OPTIONS.find((opt) => opt.id === selectedType);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Sparkle size={32} className="text-primary" weight="duotone" />
          Assistente IA com Google Gemini
        </h1>
        <p className="text-muted-foreground">
          Análise inteligente de documentos e questões jurídicas
        </p>
      </div>

      {!isConfigured && (
        <Alert variant="destructive">
          <Warning size={20} />
          <AlertDescription>
            API do Gemini não configurada. Configure a variável{" "}
            <code className="bg-destructive/20 px-1 rounded">
              VITE_GEMINI_API_KEY
            </code>{" "}
            no arquivo{" "}
            <code className="bg-destructive/20 px-1 rounded">.env</code>.
            Consulte{" "}
            <code className="bg-destructive/20 px-1 rounded">
              GEMINI_API_SETUP.md
            </code>{" "}
            para instruções.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {ANALYSIS_OPTIONS.map((option) => (
          <button
            key={option.id}
            onClick={() => setSelectedType(option.id)}
            className={`p-4 rounded-lg border-2 text-left transition-all ${
              selectedType === option.id
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            }`}>
            <h3 className="font-semibold mb-1">{option.label}</h3>
            <p className="text-sm text-muted-foreground">
              {option.description}
            </p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{currentOption?.label}</CardTitle>
            <CardDescription>{currentOption?.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={currentOption?.placeholder}
              className="min-h-[300px] font-mono text-sm"
              disabled={!isConfigured}
            />
            <Button
              onClick={handleAnalyze}
              disabled={loading || !isConfigured || !input.trim()}
              className="w-full"
              size="lg">
              {loading ? (
                <>Analisando...</>
              ) : (
                <>
                  Analisar com IA
                  <ArrowRight size={20} />
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resultado</CardTitle>
            <CardDescription>Análise gerada pelo Google Gemini</CardDescription>
          </CardHeader>
          <CardContent>
            {(() => {
              if (loading) {
                return (
                  <div className="flex items-center justify-center min-h-[300px]">
                    <div className="space-y-3 text-center">
                      <Sparkle
                        size={48}
                        className="text-primary animate-pulse mx-auto"
                        weight="duotone"
                      />
                      <p className="text-muted-foreground">
                        Processando com IA...
                      </p>
                    </div>
                  </div>
                );
              }

              if (result) {
                return (
                  <div className="prose prose-sm max-w-none">
                    <pre className="whitespace-pre-wrap bg-muted p-4 rounded-lg text-sm">
                      {result}
                    </pre>
                  </div>
                );
              }

              return (
                <div className="flex items-center justify-center min-h-[300px] text-muted-foreground">
                  Resultado aparecerá aqui após a análise
                </div>
              );
            })()}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle className="text-lg">💡 Dicas de Uso</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            • <strong>Documentos:</strong> Cole o texto completo para análise
            estruturada
          </p>
          <p>
            • <strong>Perguntas:</strong> Seja específico e contextual nas
            perguntas
          </p>
          <p>
            • <strong>Prazos:</strong> Inclua data de publicação e tipo de prazo
          </p>
          <p>
            • <strong>Estratégia:</strong> Descreva o caso com detalhes
            relevantes
          </p>
          <p>
            • <strong>Jurisprudência:</strong> Cole o texto completo do acórdão
          </p>
          <p>
            • <strong>Minutas:</strong> Especifique tipo e detalhes do caso
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
