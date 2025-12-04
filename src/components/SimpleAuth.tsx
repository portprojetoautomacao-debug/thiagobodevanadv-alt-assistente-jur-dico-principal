import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { User } from "@/types";
import { useState } from "react";

interface SimpleAuthProps {
  onSuccess: (user: User) => void;
}

export function SimpleAuth({ onSuccess }: SimpleAuthProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string>("");

  const handleLogin = () => {
    // Login simples: usuário "adm" e senha "adm123"
    if (username === "adm" && password === "adm123") {
      const user: User = {
        id: "local-admin",
        email: "admin@local",
        name: "Administrador",
        avatarUrl: "",
        role: "admin",
      };
      onSuccess(user);
    } else {
      setError("Credenciais inválidas. Use usuário 'adm' e senha 'adm123'.");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Login Simples</CardTitle>
        <CardDescription>Entre com credenciais locais</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input
          placeholder="Usuário"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          aria-label="Usuário"
        />
        <Input
          placeholder="Senha"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-label="Senha"
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button className="w-full" onClick={handleLogin}>
          Entrar
        </Button>
      </CardContent>
    </Card>
  );
}
