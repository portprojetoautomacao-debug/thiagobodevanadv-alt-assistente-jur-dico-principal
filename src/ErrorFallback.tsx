import { Alert, AlertTitle, AlertDescription } from "./components/ui/alert";
import { Button } from "./components/ui/button";
import { Warning, ArrowClockwise } from "@phosphor-icons/react";
import { WarningCircle, ArrowsClockwise } from "@phosphor-icons/react";

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

export const ErrorFallback = ({ error, resetErrorBoundary }: ErrorFallbackProps) => {
  if (import.meta.env.DEV) throw error;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Alert variant="destructive" className="mb-6">
          <Warning size={20} />
          <WarningCircle size={20} />
          <AlertTitle>Erro na aplicação</AlertTitle>
          <AlertDescription>
            Algo inesperado aconteceu durante a execução da aplicação. Os detalhes do erro estão abaixo. Tente recarregar a página ou entre em contato com o suporte.
          </AlertDescription>
        </Alert>
        
        <div className="bg-card border rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-sm text-muted-foreground mb-2">Detalhes do Erro:</h3>
          <pre className="text-xs text-destructive bg-muted/50 p-3 rounded border overflow-auto max-h-32">
            {error.message}
          </pre>
        </div>
        
        <Button 
          onClick={resetErrorBoundary} 
          className="w-full"
          variant="outline"
        >
          <ArrowClockwise size={20} />
          <ArrowsClockwise size={20} />
          Tentar Novamente
        </Button>
      </div>
    </div>
  );
}
