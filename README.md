# Organiza MEI

Sistema web de controle financeiro pessoal e empresarial para MEI.
Desenvolvido com Next.js (App Router), TailwindCSS, shadcn/ui e Supabase.

## Pré-requisitos

- Node.js 18.17+ 
- Conta no Supabase

## Configuração Inicial

1. Clone o repositório ou inicie na raiz.
2. Instale as dependências:
   ```bash
   npm install
   ```

3. Crie um novo projeto no [Supabase](https://supabase.com/).
4. No menu SQL Editor do Supabase, execute os arquivos presentes na pasta `/sql/` nesta ordem:
   - `schema.sql` (Estrutura de tabelas e triggers)
   - `rls.sql` (Políticas de segurança de linha - Row Level Security)
   - `seed.sql` (Atenção: substitua `YOUR-USER-ID-UUID` pelo ID real do seu usuário de teste gerado no painel Auth do Supabase).

5. Renomeie o arquivo `.env.example` para `.env.local` e preencha com as credenciais do seu projeto Supabase:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=sua-url-do-projeto
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key-publica
   ```

## Rodando Localmente

Para iniciar o servidor de desenvolvimento:

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no seu navegador. O sistema irá redirecionar automaticamente para a tela de `/login` ou `/dashboard` dependendo da sua sessão.

## Regras de Segurança

- Este sistema não processa pagamentos reais.
- Nenhum dado de cartão de crédito completo é armazenado.
- Apenas "apelidos" e últimos 4 dígitos são permitidos.
- A segurança principal é feita pelas políticas RLS (`Row Level Security`) no banco de dados.

## Stack
- Next.js 14+
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase (Auth, Postgres)
- Recharts (Gráficos)
- Zod & React Hook Form
