-- schema.sql (PostgreSQL / Supabase)
CREATE TABLE IF NOT EXISTS public.orcamentos (
    id TEXT PRIMARY KEY,
    codigo TEXT NOT NULL UNIQUE,
    titulo TEXT NOT NULL,
    cliente TEXT NOT NULL,
    cnpj TEXT,
    orcamentista TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'em_analise' CHECK (status IN ('rascunho', 'em_analise', 'enviado', 'aprovado', 'rejeitado')),
    custo_base NUMERIC(14, 2) NOT NULL DEFAULT 0,
    margem_percentual NUMERIC(6, 2) NOT NULL DEFAULT 20,
    impostos_percentual NUMERIC(6, 2) NOT NULL DEFAULT 12,
    desconto NUMERIC(14, 2) NOT NULL DEFAULT 0,
    valor_total NUMERIC(14, 2) NOT NULL DEFAULT 0,
    validade DATE,
    observacoes TEXT,
    itens JSONB NOT NULL DEFAULT '[]'::jsonb,
    historico JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Habilitar acesso para testes no projeto isolado (ajuste conforme suas políticas RLS)
ALTER TABLE public.orcamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir leitura e escrita publica no modo isolado"
ON public.orcamentos
FOR ALL
USING (true)
WITH CHECK (true);