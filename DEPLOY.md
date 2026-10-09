# Deploy — OberFritz

O site é estático e roda na **Vercel** (projeto `oberfritz-site`). As páginas já
vão prontas no repositório: **não há build na Vercel**. O `_src/build.py` roda na
sua máquina, antes do commit.

**Endereço na Vercel:** <https://oberfritz-site.vercel.app>

## Configuração do projeto na Vercel

| Campo | Valor |
|---|---|
| Framework preset | `Other` |
| Build command | *(vazio)* |
| Output directory | *(vazio — raiz)* |
| Install command | *(vazio)* |

Cabeçalhos de segurança, cache, URLs limpas, redirect `www` → raiz e bloqueio de
`/_src/` estão no `vercel.json`. O `.vercelignore` impede o envio de `_src/` e
dos `.md` em deploys feitos pela CLI.

## Publicar alterações

```bash
# 1. edite o que precisar (_src/*.body.html, assets/css/style.css, ...)
python3 _src/build.py          # se mexeu em _src/, nav ou rodapé

# 2a. via Git (se o projeto estiver conectado ao repositório)
git add . && git commit -m "descrição" && git push

# 2b. ou direto pela CLI
vercel --prod
```

Cada deploy fica salvo; para reverter, use **Deployments → Promote/Rollback**
no painel da Vercel.

## Domínio

O site já responde em `oberfritz-site.vercel.app`. Para usar o domínio próprio, no painel: **Project → Settings → Domains**. Cadastre `oberfritz.com.br` e
`www.oberfritz.com.br` e aponte o DNS conforme as instruções exibidas pela
Vercel. O `www` redireciona (301) para a raiz via `vercel.json`.

## Conferência

- [ ] `https://oberfritz-site.vercel.app` abre o site atualizado
- [ ] `https://oberfritz.com.br` abre com HTTPS válido
- [ ] `https://www.oberfritz.com.br/planos` redireciona para `https://oberfritz.com.br/planos`
- [ ] `/`, `/quem-somos`, `/produtos`, `/planos`, `/contato` abrem
- [ ] Uma URL inexistente mostra a página 404 do site
- [ ] `/_src/produtos.body.html` retorna 404
- [ ] `/sitemap.xml` responde
