/**
 * Componente Azure Storage Upload
 *
 * Interface para upload de autos processuais para Azure Blob Storage
 * com análise automática pelos agentes
 */

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { AlertCircle, CheckCircle, FileText, Loader2, Upload } from "lucide-react";
import { useState } from "react";

interface UploadResult {
  success: boolean;
  blobName?: string;
  url?: string;
  size?: number;
  processNumber?: string;
  error?: string;
  taskId?: string;
}

export function AzureStorageUpload() {
  const [processNumber, setProcessNumber] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [autoAnalyze, setAutoAnalyze] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [result, setResult] = useState<UploadResult | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar tipo de arquivo
      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
      ];

      if (!allowedTypes.includes(file.type)) {
        setResult({
          success: false,
          error: "Tipo de arquivo não suportado. Use PDF, DOC, DOCX ou TXT.",
        });
        return;
      }

      // Validar tamanho (50MB)
      if (file.size > 50 * 1024 * 1024) {
        setResult({
          success: false,
          error: "Arquivo muito grande. Limite: 50MB.",
        });
        return;
      }

      setSelectedFile(file);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !processNumber) {
      setResult({
        success: false,
        error: "Selecione um arquivo e informe o número do processo",
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("processNumber", processNumber);
      formData.append("autoAnalyze", autoAnalyze.toString());

      // Simular progresso
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch("/api/azure-upload", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const data: UploadResult = await response.json();

      if (response.ok && data.success) {
        setResult({
          ...data,
          success: true,
        });

        // Limpar formulário
        setSelectedFile(null);
        setProcessNumber("");

        // Reset progress após 2s
        setTimeout(() => {
          setUploadProgress(0);
        }, 2000);
      } else {
        setResult({
          success: false,
          error: data.error || "Erro no upload",
        });
      }
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : "Erro ao fazer upload",
      });
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload de Autos Processuais
        </CardTitle>
        <CardDescription>
          Envie documentos completos de processos para análise automática pelos agentes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Número do Processo */}
        <div className="space-y-2">
          <Label htmlFor="processNumber">Número do Processo</Label>
          <Input
            id="processNumber"
            placeholder="0001234-56.2024.8.02.0001"
            value={processNumber}
            onChange={(e) => setProcessNumber(e.target.value)}
            disabled={uploading}
          />
        </div>

        {/* Seleção de Arquivo */}
        <div className="space-y-2">
          <Label htmlFor="file">Arquivo do Auto Processual</Label>
          <div className="flex items-center gap-2">
            <Input
              id="file"
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              onChange={handleFileSelect}
              disabled={uploading}
              className="cursor-pointer"
            />
          </div>
          {selectedFile && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span>{selectedFile.name}</span>
              <span>({formatFileSize(selectedFile.size)})</span>
            </div>
          )}
        </div>

        {/* Análise Automática */}
        <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
          <div className="space-y-0.5">
            <Label htmlFor="autoAnalyze" className="text-base">
              Análise Automática
            </Label>
            <p className="text-sm text-muted-foreground">
              Agendar análise automática pelos agentes após upload
            </p>
          </div>
          <Switch
            id="autoAnalyze"
            checked={autoAnalyze}
            onCheckedChange={setAutoAnalyze}
            disabled={uploading}
          />
        </div>

        {/* Progress Bar */}
        {uploading && uploadProgress > 0 && (
          <div className="space-y-2">
            <Progress value={uploadProgress} className="w-full" />
            <p className="text-sm text-center text-muted-foreground">
              {uploadProgress < 100 ? "Enviando..." : "Upload concluído!"}
            </p>
          </div>
        )}

        {/* Resultado */}
        {result && (
          <Alert variant={result.success ? "default" : "destructive"}>
            {result.success ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertDescription>
              {result.success ? (
                <div className="space-y-1">
                  <p className="font-medium">✅ Upload realizado com sucesso!</p>
                  <p className="text-sm">Processo: {result.processNumber}</p>
                  <p className="text-sm">Tamanho: {result.size && formatFileSize(result.size)}</p>
                  {result.taskId && <p className="text-sm">Análise agendada: {result.taskId}</p>}
                </div>
              ) : (
                <p>{result.error}</p>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Botão de Upload */}
        <Button
          onClick={handleUpload}
          disabled={!selectedFile || !processNumber || uploading}
          className="w-full"
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Fazer Upload
            </>
          )}
        </Button>

        {/* Informações */}
        <div className="rounded-lg bg-muted p-4 text-sm space-y-2">
          <p className="font-medium">ℹ️ Formatos aceitos:</p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>PDF (autos completos digitalizados)</li>
            <li>DOC/DOCX (documentos Microsoft Word)</li>
            <li>TXT (documentos de texto simples)</li>
          </ul>
          <p className="text-muted-foreground">Tamanho máximo: 50MB por arquivo</p>
        </div>
      </CardContent>
    </Card>
  );
}
