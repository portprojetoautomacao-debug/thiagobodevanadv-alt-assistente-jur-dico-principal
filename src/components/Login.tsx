import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkle, User, Lock } from '@phosphor-icons/react'
import { toast } from 'sonner'
import type { User as UserType } from '@/types'

interface LoginProps {
  onLogin: (user: UserType) => void
}

/**
 * Contas de desenvolvimento/demonstração
 * 
 * IMPORTANTE: Em produção, substituir por autenticação real
 * (ex: OAuth, JWT, integração com sistema de usuários do escritório)
 * 
 * Estas contas existem apenas para demonstração e desenvolvimento.
 * Não são dados "falsos" no sentido de simulação de IA - são credenciais
 * de teste para permitir acesso ao sistema durante desenvolvimento.
 */
const DEV_ACCOUNTS = [
  { username: 'admin', password: 'admin123', name: 'Administrador', email: 'admin@lawtech.com', role: 'admin' as const },
  { username: 'demo', password: 'demo', name: 'Usuário Demo', email: 'demo@lawtech.com', role: 'advogado' as const },
  { username: 'usuario', password: '123456', name: 'Usuário Teste', email: 'usuario@lawtech.com', role: 'assistente' as const },
]

export default function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const account = DEV_ACCOUNTS.find(
      acc => acc.username === username && acc.password === password
    )

    if (account) {
      const user: UserType = {
        id: crypto.randomUUID(),
        email: account.email,
        name: account.name,
        role: account.role,
      }
      toast.success(`Bem-vindo, ${account.name}!`)
      onLogin(user)
    } else {
      toast.error('Credenciais inválidas')
    }
  }

  const handleQuickAccess = (account: typeof DEV_ACCOUNTS[0]) => {
    const user: UserType = {
      id: crypto.randomUUID(),
      email: account.email,
      name: account.name,
      role: account.role,
    }
    toast.success(`Bem-vindo, ${account.name}!`)
    onLogin(user)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md card-glow glassmorphic">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <div className="w-16 h-16 button-gradient rounded-xl flex items-center justify-center shadow-lg ring-4 ring-primary/20">
              <Sparkle className="w-10 h-10 text-primary-foreground neon-glow" weight="fill" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold gradient-text">Assistente Jurídico PJe</CardTitle>
          <CardDescription className="text-base">
            Ferramentas inteligentes com IA Gemini para otimizar sua rotina jurídica
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Usuário</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="username"
                  type="text"
                  placeholder="Digite seu usuário"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10 focus:ring-2 focus:ring-primary/50 transition-all"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 focus:ring-2 focus:ring-primary/50 transition-all"
                />
              </div>
            </div>
            <Button type="submit" className="w-full button-gradient" size="lg">
              Entrar
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Acesso Rápido
              </span>
            </div>
          </div>

          <div className="space-y-2">
            {DEV_ACCOUNTS.map((account) => (
              <Button
                key={account.username}
                variant="outline"
                className="w-full justify-start hover:gradient-border hover:scale-[1.02] transition-all"
                onClick={() => handleQuickAccess(account)}
              >
                <User className="w-4 h-4 mr-2" />
                <span className="flex-1 text-left">{account.name}</span>
                <span className="text-xs text-muted-foreground">
                  {account.username} / {account.password}
                </span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
