import { login } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-[400px]">
        <CardHeader>
          <CardTitle>Organiza MEI</CardTitle>
          <CardDescription>Acesse seu painel financeiro privado.</CardDescription>
        </CardHeader>
        <form>
          <CardContent className="space-y-4">
            {params?.error && (
              <div className="text-sm font-medium text-destructive">
                E-mail, senha ou usuario autorizado invalido.
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
        <p className="px-6 pb-6 text-xs text-muted-foreground">
          Cadastro publico desabilitado. Crie o primeiro usuario no painel Auth do Supabase.
        </p>
      </Card>
    </div>
  )
}
