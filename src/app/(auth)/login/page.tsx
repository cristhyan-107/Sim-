import { login } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-muted/50">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle>Organiza MEI</CardTitle>
          <CardDescription>
            Faça login para acessar seu painel financeiro.
          </CardDescription>
        </CardHeader>
        <form>
          <CardContent className="space-y-4">
            {searchParams?.error && (
              <div className="text-sm font-medium text-destructive">
                E-mail ou senha incorretos.
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" name="password" type="password" required />
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" formAction={login}>
              Entrar
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
