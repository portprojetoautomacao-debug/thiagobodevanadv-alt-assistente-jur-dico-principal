import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useNotifications } from "@/hooks/use-notifications";
import { cn } from "@/lib/utils";
import {
  Bell,
  CheckCircle,
  DiscordLogo,
  Globe,
  Plus,
  SlackLogo,
  Spinner,
  TestTube,
  Trash,
  Warning,
  XCircle,
} from "@phosphor-icons/react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

// Microsoft Teams icon
const TeamsIcon = ({ size = 20 }: { size?: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M20.625 8.5h-3.75V6.875c0-.69.56-1.25 1.25-1.25h1.25c.69 0 1.25.56 1.25 1.25V8.5zm-.938 1.25c-.865 0-1.562-.697-1.562-1.562V6.875c0-1.381 1.119-2.5 2.5-2.5h1.25c1.381 0 2.5 1.119 2.5 2.5v4.375c0 2.071-1.679 3.75-3.75 3.75h-.625V19c0 .69-.56 1.25-1.25 1.25H4.25c-.69 0-1.25-.56-1.25-1.25V9.75c0-.69.56-1.25 1.25-1.25h4.375V5.75c0-.69.56-1.25 1.25-1.25h5c.69 0 1.25.56 1.25 1.25v2.75h3.562z" />
  </svg>
);

type WebhookType = "slack" | "discord" | "teams" | "generic";

interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  type: WebhookType;
  enabled: boolean;
  createdAt: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

export default function NotificationSettings() {
  const {
    preferences,
    setPreferences,
    requestPermission,
    testNotification,
    isSupported,
    permission,
  } = useNotifications();

  // Webhook state
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [loadingWebhooks, setLoadingWebhooks] = useState(true);
  const [savingWebhook, setSavingWebhook] = useState(false);
  const [testingWebhook, setTestingWebhook] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newWebhook, setNewWebhook] = useState<{
    name: string;
    url: string;
    type: WebhookType;
  }>({
    name: "",
    url: "",
    type: "slack",
  });

  // Helpers para reduzir complexidade cognitiva
  const hasNewWebhookFields = () => {
    const hasFields = newWebhook.name.trim() && newWebhook.url.trim();
    if (!hasFields) {
      toast.error("Nome e URL são obrigatórios");
      return false;
    }
    return true;
  };

  const runApiWithToast = async <T,>(
    fn: () => Promise<T>,
    onSuccess?: (data: T) => void,
    successMsg?: string,
    errorPrefix = "Erro"
  ) => {
    try {
      const data = await fn();
      if (onSuccess) onSuccess(data);
      if (successMsg) toast.success(successMsg);
    } catch (error) {
      console.error("[NotificationSettings]", error);
      toast.error(`${errorPrefix}`);
    }
  };

  // Buscar webhooks do backend
  const fetchWebhooks = useCallback(async () => {
    setLoadingWebhooks(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      if (Array.isArray(data.webhooks)) {
        setWebhooks(data.webhooks);
      } else {
        setWebhooks([]);
      }
    } catch (error) {
      console.error("[NotificationSettings] Fetch error:", error);
      toast.error("Erro ao carregar webhooks");
      setWebhooks([]);
    } finally {
      setLoadingWebhooks(false);
    }
  }, []);

  useEffect(() => {
    fetchWebhooks();
  }, [fetchWebhooks]);

  // Adicionar webhook
  const addWebhook = async () => {
    if (!hasNewWebhookFields()) return;
    setSavingWebhook(true);
    await runApiWithToast(
      async () => {
        const response = await fetch(
          `${API_BASE_URL}/api/notifications/webhook`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...newWebhook, events: ["all"] }),
          }
        );
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      },
      (data: any) => {
        if (data.webhook) setWebhooks((prev) => [...prev, data.webhook]);
        setNewWebhook({ name: "", url: "", type: "slack" });
        setShowAddForm(false);
      },
      "Webhook adicionado!",
      "Erro ao adicionar webhook"
    );
    setSavingWebhook(false);
  };

  // Remover webhook
  const deleteWebhook = async (id: string) => {
    await runApiWithToast(
      async () => {
        const response = await fetch(
          `${API_BASE_URL}/api/notifications/webhook/${id}`,
          { method: "DELETE" }
        );
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return { id };
      },
      () => {
        setWebhooks((prev) => prev.filter((w) => w.id !== id));
      },
      "Webhook removido",
      "Erro ao remover webhook"
    );
  };

  // Testar webhook
  const testWebhookFn = async (webhookId: string) => {
    setTestingWebhook(webhookId);
    await runApiWithToast(
      async () => {
        const response = await fetch(`${API_BASE_URL}/api/notifications/test`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ webhookId }),
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      },
      (data: any) => {
        if (data.success) {
          toast.success("Teste enviado!", {
            description: data.webhook?.name
              ? `Webhook: ${data.webhook.name}`
              : undefined,
          });
        } else {
          toast.error("Falha no teste do webhook");
        }
      },
      undefined,
      "Erro ao testar webhook"
    );
    setTestingWebhook(null);
  };

  const getWebhookIcon = (type: WebhookType) => {
    switch (type) {
      case "slack":
        return <SlackLogo size={18} weight="duotone" />;
      case "discord":
        return <DiscordLogo size={18} weight="duotone" />;
      case "teams":
        return <TeamsIcon size={18} />;
      default:
        return <Globe size={18} weight="duotone" />;
    }
  };

  const handleEnableNotifications = async () => {
    if (!isSupported) {
      toast.error("Seu navegador não suporta notificações");
      return;
    }

    const result = await requestPermission();

    if (result === "granted") {
      toast.success("Notificações ativadas com sucesso!");
      testNotification();
    } else if (result === "denied") {
      toast.error(
        "Você bloqueou as notificações. Ative-as nas configurações do navegador."
      );
    }
  };

  const getPermissionBadge = () => {
    switch (permission) {
      case "granted":
        return (
          <Badge variant="default" className="gap-1 bg-primary">
            <CheckCircle size={12} weight="fill" />
            Permitido
          </Badge>
        );
      case "denied":
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle size={12} weight="fill" />
            Bloqueado
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="gap-1">
            <Warning size={12} weight="fill" />
            Pendente
          </Badge>
        );
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold gradient-text mb-2">
          Configurações de Notificações
        </h1>
        <p className="text-muted-foreground">
          Configure os alertas que deseja receber
        </p>
      </div>

      <div className="space-y-6">
        {/* STATUS / PERMISSÃO DO NAVEGADOR */}
        <Card className="glassmorphic border-border/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="text-primary" size={24} weight="duotone" />
                  Status das Notificações
                </CardTitle>
                <CardDescription className="mt-2">
                  Permissão do navegador para enviar notificações
                </CardDescription>
              </div>
              {getPermissionBadge()}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isSupported && (
              <Alert variant="destructive">
                <XCircle size={16} weight="fill" />
                <AlertDescription>
                  Seu navegador não suporta notificações push. Tente usar
                  Chrome, Firefox ou Edge.
                </AlertDescription>
              </Alert>
            )}

            {isSupported && permission === "default" && (
              <Alert className="border-primary/50 bg-primary/5">
                <Warning className="text-primary" size={16} weight="fill" />
                <AlertDescription>
                  Você ainda não permitiu notificações. Clique no botão abaixo
                  para ativar.
                </AlertDescription>
              </Alert>
            )}

            {isSupported && permission === "denied" && (
              <Alert variant="destructive">
                <XCircle size={16} weight="fill" />
                <AlertDescription>
                  Notificações bloqueadas. Para ativar, clique no ícone de
                  cadeado ao lado da URL e permita notificações.
                </AlertDescription>
              </Alert>
            )}

            {isSupported && permission === "granted" && (
              <Alert className="border-primary/50 bg-primary/5">
                <CheckCircle className="text-primary" size={16} weight="fill" />
                <AlertDescription>
                  Notificações ativadas! Você receberá alertas importantes.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-3">
              {permission !== "granted" && (
                <Button
                  onClick={handleEnableNotifications}
                  className="button-gradient"
                  disabled={!isSupported || permission === "denied"}
                >
                  <Bell size={20} weight="duotone" />
                  Ativar Notificações
                </Button>
              )}

              {permission === "granted" && (
                <Button onClick={testNotification} variant="outline">
                  <Bell size={20} weight="duotone" />
                  Testar Notificação
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* TIPOS DE NOTIFICAÇÃO */}
        <Card className="glassmorphic border-border/50">
          <CardHeader>
            <CardTitle>Tipos de Notificações</CardTitle>
            <CardDescription>
              Escolha quais tipos de alertas deseja receber
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="prazo-alerts" className="text-base font-medium">
                  Alertas de Prazos
                </Label>
                <p className="text-sm text-muted-foreground">
                  Receber notificações sobre prazos próximos do vencimento (D-7,
                  D-2, D-1)
                </p>
              </div>
              <Switch
                id="prazo-alerts"
                aria-label="Ativar alertas de prazos próximos do vencimento (D-7, D-2, D-1)"
                checked={preferences?.prazoAlerts ?? true}
                onCheckedChange={(checked) =>
                  setPreferences((current: any) => ({
                    ...current,
                    prazoAlerts: checked,
                  }))
                }
                disabled={permission !== "granted"}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="agent-alerts" className="text-base font-medium">
                  Alertas de Agentes IA
                </Label>
                <p className="text-sm text-muted-foreground">
                  Receber notificações quando agentes autônomos completarem
                  tarefas
                </p>
              </div>
              <Switch
                id="agent-alerts"
                aria-label="Ativar alertas quando agentes autônomos completarem tarefas"
                checked={preferences?.agentAlerts ?? true}
                onCheckedChange={(checked) =>
                  setPreferences((current: any) => ({
                    ...current,
                    agentAlerts: checked,
                  }))
                }
                disabled={permission !== "granted"}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label
                  htmlFor="financial-alerts"
                  className="text-base font-medium"
                >
                  Alertas Financeiros
                </Label>
                <p className="text-sm text-muted-foreground">
                  Receber notificações sobre honorários vencidos e pagamentos
                  pendentes
                </p>
              </div>
              <Switch
                id="financial-alerts"
                aria-label="Ativar alertas sobre honorários vencidos e pagamentos pendentes"
                checked={preferences?.financialAlerts ?? true}
                onCheckedChange={(checked) =>
                  setPreferences((current: any) => ({
                    ...current,
                    financialAlerts: checked,
                  }))
                }
                disabled={permission !== "granted"}
              />
            </div>
          </CardContent>
        </Card>

        {/* INFO GERAL */}
        <Card className="glassmorphic border-border/50">
          <CardHeader>
            <CardTitle>Sobre as Notificações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">Prazos:</strong> Você receberá
              alertas automáticos 7, 2 e 1 dia antes do vencimento de cada prazo
              ativo.
            </p>
            <p>
              <strong className="text-foreground">Privacidade:</strong> As
              notificações são processadas localmente no seu navegador. Nenhum
              dado é enviado para servidores externos apenas para exibir o
              alerta.
            </p>
            <p>
              <strong className="text-foreground">Controle:</strong> Você pode
              desativar as notificações a qualquer momento usando os switches
              acima.
            </p>
          </CardContent>
        </Card>

        {/* WEBHOOKS */}
        <Card className="glassmorphic border-border/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="text-primary" size={24} weight="duotone" />
                  Webhooks (Slack/Discord/Teams)
                </CardTitle>
                <CardDescription className="mt-2">
                  Receba notificações em canais externos quando novas
                  publicações ou eventos relevantes forem encontrados
                </CardDescription>
              </div>
              <Button
                onClick={() => setShowAddForm(true)}
                disabled={showAddForm}
                size="sm"
              >
                <Plus size={16} />
                Adicionar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Formulário de novo webhook */}
            {showAddForm && (
              <Alert className="border-primary/50">
                <div className="space-y-4">
                  <AlertDescription className="font-medium">
                    Adicionar novo webhook
                  </AlertDescription>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="space-y-1">
                      <Label htmlFor="wh-name" className="text-xs">
                        Nome
                      </Label>
                      <Input
                        id="wh-name"
                        placeholder="Ex: Slack Jurídico"
                        value={newWebhook.name}
                        onChange={(e) =>
                          setNewWebhook((p) => ({
                            ...p,
                            name: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="wh-type" className="text-xs">
                        Tipo
                      </Label>
                      <Select
                        value={newWebhook.type}
                        onValueChange={(v: WebhookType) =>
                          setNewWebhook((p) => ({ ...p, type: v }))
                        }
                      >
                        <SelectTrigger id="wh-type">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="slack">
                            <span className="flex items-center gap-2">
                              <SlackLogo size={14} />
                              Slack
                            </span>
                          </SelectItem>
                          <SelectItem value="discord">
                            <span className="flex items-center gap-2">
                              <DiscordLogo size={14} />
                              Discord
                            </span>
                          </SelectItem>
                          <SelectItem value="teams">
                            <span className="flex items-center gap-2">
                              <TeamsIcon size={14} />
                              Teams
                            </span>
                          </SelectItem>
                          <SelectItem value="generic">
                            <span className="flex items-center gap-2">
                              <Globe size={14} />
                              Genérico
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1 sm:col-span-1">
                      <Label htmlFor="wh-url" className="text-xs">
                        URL do Webhook
                      </Label>
                      <Input
                        id="wh-url"
                        type="url"
                        placeholder="https://hooks..."
                        value={newWebhook.url}
                        onChange={(e) =>
                          setNewWebhook((p) => ({ ...p, url: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowAddForm(false);
                        setNewWebhook({
                          name: "",
                          url: "",
                          type: "slack",
                        });
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      onClick={addWebhook}
                      disabled={
                        savingWebhook ||
                        !newWebhook.name.trim() ||
                        !newWebhook.url.trim()
                      }
                    >
                      {savingWebhook ? (
                        <Spinner className="animate-spin" size={14} />
                      ) : (
                        <Plus size={14} />
                      )}
                      Adicionar
                    </Button>
                  </div>
                </div>
              </Alert>
            )}

            {/* Lista de webhooks */}
            {loadingWebhooks ? (
              <div className="flex justify-center py-4">
                <Spinner className="animate-spin" size={24} />
              </div>
            ) : webhooks.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Globe size={40} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhum webhook configurado</p>
                <p className="text-xs">
                  Configure webhooks para receber notificações no Slack, Discord
                  ou Teams
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {webhooks.map((wh) => (
                  <div
                    key={wh.id}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg border",
                      wh.enabled ? "bg-card" : "bg-muted/50 opacity-70"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded bg-primary/10">
                        {getWebhookIcon(wh.type)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{wh.name}</span>
                          <Badge variant="outline" className="text-xs px-1">
                            {wh.type}
                          </Badge>
                          {wh.enabled && (
                            <Badge className="bg-green-500/20 text-green-600 text-xs px-1">
                              <CheckCircle
                                size={8}
                                className="mr-0.5"
                                weight="fill"
                              />
                              Ativo
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate max-w-[220px]">
                          {wh.url}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2"
                        onClick={() => testWebhookFn(wh.id)}
                        disabled={testingWebhook === wh.id}
                        title="Testar webhook"
                      >
                        {testingWebhook === wh.id ? (
                          <Spinner className="animate-spin" size={12} />
                        ) : (
                          <TestTube size={12} />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-destructive"
                        onClick={() => deleteWebhook(wh.id)}
                        title="Excluir webhook"
                      >
                        <Trash size={12} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Separator />

            <Alert>
              <Warning size={14} />
              <AlertDescription className="text-xs">
                <strong>Como obter a URL do webhook:</strong> Slack: Apps →
                Incoming Webhooks • Discord: Configurações do Canal → Webhooks •
                Teams: Conectores → Incoming Webhook.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
