# Deploy e domínio — OberFritz

Guia completo para publicar o site no **Cloudflare Pages** e apontar o domínio
**oberfritz.com.br**, registrado no **Registro.br**.

Tempo total: ~20 minutos de trabalho + até 24h de propagação de DNS.

---

## Visão geral

```
GitHub (push na main)  →  Cloudflare Pages (build automático)  →  oberfritz.com.br
                                                                       ↑
                          Registro.br: delega o DNS para a Cloudflare ─┘
```

**Ponto crítico antes de começar:** o Registro.br **não permite registro CNAME na
raiz do domínio** (`oberfritz.com.br` sem `www`), e o Cloudflare Pages exige
exatamente isso. Por causa disso, a única forma de usar o domínio raiz é
**delegar os servidores DNS para a Cloudflare** (Etapa 3). Não tente configurar
apenas um CNAME no painel de DNS do Registro.br — não vai funcionar para a raiz.

---

## Etapa 1 — Subir o código para o GitHub

Na pasta do projeto:

```bash
git init
git add .
git commit -m "Site institucional OberFritz"
git branch -M main
```

Crie o repositório e envie (via GitHub CLI):

```bash
gh repo create oberfritz-site --public --source=. --remote=origin --push
```

> Prefere repositório privado? Troque `--public` por `--private`. O Cloudflare
> Pages funciona com os dois.

Sem o `gh`, crie o repositório manualmente em <https://github.com/new> e depois:

```bash
git remote add origin https://github.com/vitormondardo/oberfritz-site.git
git push -u origin main
```

---

## Etapa 2 — Criar o projeto no Cloudflare Pages

1. Acesse <https://dash.cloudflare.com> e crie uma conta (ou faça login).
2. No menu lateral: **Compute (Workers & Pages)** → **Create** → aba **Pages**
   → **Connect to Git**.
3. Autorize o GitHub e selecione o repositório `oberfritz-site`.
4. Configure o build **exatamente assim**:

   | Campo | Valor |
   |---|---|
   | Production branch | `main` |
   | Framework preset | `None` |
   | Build command | *(deixe vazio)* |
   | Build output directory | `/` |
   | Root directory | *(deixe vazio)* |

   > O site é estático e as páginas já vão prontas no repositório. **Não**
   > configure Python nem comando de build — o `_src/build.py` roda na sua
   > máquina, antes do commit.

5. Clique em **Save and Deploy**.

Em ~1 minuto o site estará no ar em `oberfritz-site.pages.dev`.
**Abra e confira se está tudo certo antes de seguir para o domínio.**

---

## Etapa 3 — Delegar o DNS do Registro.br para a Cloudflare

### 3.1 Adicionar o domínio na Cloudflare

1. No painel da Cloudflare: **Add a domain** (ou **+ Add** → **Existing domain**).
2. Digite `oberfritz.com.br` e escolha **Manually enter DNS records** se ele não
   encontrar nada — o domínio ainda não tem registros.
3. Escolha o plano **Free**.
4. A Cloudflare vai exibir **dois servidores de nomes**, algo como:

   ```
   arya.ns.cloudflare.com
   rick.ns.cloudflare.com
   ```

   > Esses nomes são **únicos da sua conta**. Copie os que aparecerem na sua tela,
   > não os do exemplo acima.

### 3.2 Trocar os servidores DNS no Registro.br

1. Acesse <https://registro.br> e faça login (CPF/CNPJ e senha).
2. Vá em **Painel** → **Meus Domínios** → clique em **oberfritz.com.br**.
3. Procure a seção **DNS** e clique em **Alterar servidores DNS**
   (dependendo da versão do painel: **Configurar DNS** → **Usar outros servidores**).
4. Selecione a opção de **usar servidores DNS externos / próprios**
   — e **não** "Utilizar os servidores do Registro.br".
5. Preencha os dois campos com os nameservers copiados da Cloudflare:

   ```
   Servidor 1:  arya.ns.cloudflare.com
   Servidor 2:  rick.ns.cloudflare.com
   ```

6. Salve.

> **Importante:** o Registro.br valida se os servidores respondem pela zona antes
> de aceitar. Por isso o domínio precisa **já estar adicionado na Cloudflare**
> (passo 3.1) antes de você salvar aqui. Se der erro de validação, aguarde alguns
> minutos e tente de novo.

### 3.3 Aguardar a propagação

O Registro.br publica alterações de zona em lotes. Costuma valer em
**30 minutos a algumas horas**, mas o prazo oficial é de **até 24 horas**.

Para acompanhar:

```bash
nslookup -type=NS oberfritz.com.br
```

Quando retornar os servidores `.ns.cloudflare.com`, a delegação está pronta.
Na Cloudflare, o status do domínio muda de *Pending Nameserver Update* para
**Active** (você recebe um e-mail).

---

## Etapa 4 — Ligar o domínio ao Pages

Só faça esta etapa **depois** de o domínio aparecer como **Active** na Cloudflare.

1. **Compute (Workers & Pages)** → projeto `oberfritz-site` → aba **Custom domains**.
2. **Set up a domain** → digite `oberfritz.com.br` → **Continue** → **Activate domain**.
3. Repita o processo para `www.oberfritz.com.br`.

A Cloudflare cria os registros DNS sozinha (um `CNAME` para `www` e um registro
achatado na raiz) e emite o certificado SSL automaticamente. O certificado leva
de alguns minutos até ~15 minutos para ficar ativo.

### Redirecionar www → domínio raiz

Para o site ter um endereço só (bom para SEO):

1. No painel do domínio: **Rules** → **Redirect Rules** → **Create rule**.
2. Nome: `www para raiz`.
3. **If** → Custom filter expression → campo `Hostname` → operador `equals` →
   valor `www.oberfritz.com.br`.
4. **Then** → Type: `Dynamic` → Expression:
   `concat("https://oberfritz.com.br", http.request.uri.path)`
   → Status code: `301`.
5. **Deploy**.

---

## Etapa 5 — Conferência final

- [ ] `https://oberfritz.com.br` abre com cadeado (HTTPS válido)
- [ ] `https://www.oberfritz.com.br` redireciona para a raiz
- [ ] As cinco páginas abrem: `/`, `/quem-somos`, `/produtos`, `/planos`, `/contato`
- [ ] Uma URL inexistente (`/qualquer-coisa`) mostra a página 404 do site
- [ ] Os botões de WhatsApp abrem a conversa com a mensagem preenchida
- [ ] `https://oberfritz.com.br/sitemap.xml` responde
- [ ] `https://oberfritz.com.br/_src/produtos.body.html` retorna 404

Recomendado depois: em **SSL/TLS** → **Overview**, deixe o modo em
**Full (strict)**.

---

## Publicando alterações no dia a dia

```bash
# 1. edite o que precisar (_src/*.body.html, assets/css/style.css, ...)
python3 _src/build.py          # se mexeu em _src/, nav ou rodapé

# 2. publique
git add .
git commit -m "descrição da alteração"
git push
```

O Cloudflare Pages detecta o push e republica sozinho em cerca de 1 minuto.
Cada deploy fica salvo — dá para reverter para qualquer versão anterior pelo
painel, em **Deployments** → **Rollback**.

---

## Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| Registro.br recusa os nameservers | Domínio ainda não foi adicionado na Cloudflare | Faça o passo 3.1 primeiro e tente de novo |
| Domínio preso em *Pending Nameserver Update* | Propagação ainda em andamento | Aguarde até 24h; confira com `nslookup -type=NS` |
| Site abre em `.pages.dev` mas não no domínio | Custom domain não foi ativado | Etapa 4 |
| Erro de certificado / aviso de "não seguro" | SSL ainda sendo emitido | Aguarde ~15 min após ativar o domínio |
| CSS antigo depois de publicar | Cache do navegador | `Ctrl+F5`; o `_headers` já limita o cache de CSS a 1 hora |
| Alteração não apareceu no site | Build do Pages falhou | Painel → **Deployments** → veja o log do último deploy |
