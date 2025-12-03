import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AlertTriangle, Newspaper, RefreshCw } from "lucide-react";

interface DJENErrorCardProps {
  readonly compact?: boolean;
  readonly error?: string;
  readonly onRetry: () => void;
}

export function DJENErrorCard({
  compact = false,
  error,
  onRetry,
}: DJENErrorCardProps) {
  return (
    <Card className={cn("card-glow-hover glassmorphic", compact && "h-fit")}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Newspaper size={20} className="text-primary" />
          Publicações DJEN
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Alert variant="destructive">
          <AlertTriangle size={16} />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="mt-3 w-full"
        >
          <RefreshCw size={16} />
          Tentar novamente
        </Button>
      </CardContent>
    </Card>
  );
}
