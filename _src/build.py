import re, pathlib, sys, datetime

base = pathlib.Path(__file__).resolve().parent.parent
src = base / "_src"
index = (base / "index.html").read_text(encoding="utf-8")

# domínio de produção — usado em canonical, og:url, hreflang e sitemap.xml
SITE = "https://oberfritz.com.br"

# página em português → página equivalente em inglês (alimenta hreflang,
# sitemap e o botão PT/EN do menu). A 404 não tem par: não é indexada.
PARES = {
    "index": "index",
    "quem-somos": "about",
    "produtos": "services",
    "projetos": "projects",
    "planos": "pricing",
    "contato": "contact",
}
PARES_EN = {en: pt for pt, en in PARES.items()}

# páginas geradas que não devem entrar no sitemap nem ser indexadas
FORA_DO_SITEMAP = {"404"}

# --- menu e rodapé: o português vem do index.html, o inglês de _src/en/ ----
def recorta(texto, inicio, fim):
    parte = texto.split(inicio)[1]
    return parte.split(fim)[0].strip()

NAV_PT = recorta(
    index,
    "<!-- ============================ NAV ============================ -->",
    "<!-- ============================ HERO ============================ -->",
)
FOOTER_PT = recorta(
    index,
    "<!-- ============================ FOOTER ============================ -->",
    '<script src="assets/js/site.js"></script>',
)
NAV_EN = (src / "en" / "_nav.html").read_text(encoding="utf-8").strip()
FOOTER_EN = (src / "en" / "_footer.html").read_text(encoding="utf-8").strip()


def url_pt(nome):
    return f"{SITE}/" if nome == "index" else f"{SITE}/{nome}.html"


def url_en(nome):
    return f"{SITE}/en" if nome == "index" else f"{SITE}/en/{nome}.html"


def href_pt(nome):
    return "/index.html" if nome == "index" else f"/{nome}.html"


def href_en(nome):
    return f"/en/{nome}.html"


HEAD = """<!DOCTYPE html>
<html lang="{lang}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title}</title>
<meta name="description" content="{desc}">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:type" content="website">
<meta property="og:url" content="{canonical}">
<meta property="og:image" content="{site}/assets/img/logo-oberfritz.png">
<meta property="og:locale" content="{og_locale}">
<meta property="og:locale:alternate" content="{og_alt}">
<meta property="og:site_name" content="OberFritz">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#030D09">
<link rel="canonical" href="{canonical}">
{alternates}<link rel="icon" href="{assets}assets/img/logo-marca.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&family=Instrument+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="{assets}assets/css/style.css">
</head>
<body>
"""

TAIL = """
<script src="{assets}assets/js/site.js"></script>
</body>
</html>
"""

IDIOMAS = {
    "pt": dict(
        lang="pt-BR", og_locale="pt_BR", og_alt="en_US", assets="",
        nav=NAV_PT, footer=FOOTER_PT, fontes=src, saida=base,
        href=lambda n: f"{n}.html",
    ),
    "en": dict(
        lang="en", og_locale="en_US", og_alt="pt_BR", assets="/",
        nav=NAV_EN, footer=FOOTER_EN, fontes=src / "en", saida=base / "en",
        href=lambda n: href_en(n),
    ),
}


def alternates(nome_pt):
    """hreflang das duas versões (+ x-default apontando para o português)."""
    if nome_pt not in PARES:
        return ""
    en = PARES[nome_pt]
    return (
        f'<link rel="alternate" hreflang="pt-BR" href="{url_pt(nome_pt)}">\n'
        f'<link rel="alternate" hreflang="en" href="{url_en(en)}">\n'
        f'<link rel="alternate" hreflang="x-default" href="{url_pt(nome_pt)}">\n'
    )


def gerar(codigo):
    cfg = IDIOMAS[codigo]
    cfg["saida"].mkdir(exist_ok=True)
    gerados = []

    for arquivo in sorted(cfg["fontes"].glob("*.body.html")):
        nome = arquivo.name.replace(".body.html", "")
        nome_pt = nome if codigo == "pt" else PARES_EN[nome]
        nome_en = PARES.get(nome_pt)

        corpo = arquivo.read_text(encoding="utf-8")
        m = re.search(r"<!--HEAD:(.*?)\|(.*?)-->", corpo)
        title, desc = m.group(1), m.group(2)
        corpo = corpo.replace(m.group(0), "").strip()

        # marca o link ativo da navegação
        nav = cfg["nav"].replace(' class="is-active"', "")
        alvo = cfg["href"](nome)
        nav = nav.replace(f'<a href="{alvo}">', f'<a href="{alvo}" class="is-active">', 1)

        # botão de idioma → página equivalente (a 404 não tem par: vai para a home)
        if codigo == "pt":
            destino = href_en(nome_en or "index")
            nav = re.sub(r'(data-lang="en" href=")[^"]*"', rf'\g<1>{destino}"', nav)
        else:
            destino = href_pt(nome_pt)
            nav = re.sub(r'(data-lang="pt" href=")[^"]*"', rf'\g<1>{destino}"', nav)

        corpo = corpo.replace("<!--NAV-->", nav).replace("<!--FOOTER-->", cfg["footer"])
        canonical = url_pt(nome) if codigo == "pt" else url_en(nome)
        html = (
            HEAD.format(
                lang=cfg["lang"], title=title, desc=desc, site=SITE, canonical=canonical,
                og_locale=cfg["og_locale"], og_alt=cfg["og_alt"], assets=cfg["assets"],
                alternates=alternates(nome_pt),
            )
            + corpo
            + TAIL.format(assets=cfg["assets"])
        )
        if nome in FORA_DO_SITEMAP:
            html = html.replace("</head>", '<meta name="robots" content="noindex">\n</head>')

        (cfg["saida"] / f"{nome}.html").write_text(html, encoding="utf-8")
        print("gerado:", (cfg["saida"] / f"{nome}.html").relative_to(base), len(html), "bytes")
        if nome not in FORA_DO_SITEMAP:
            gerados.append(nome)
    return gerados


paginas_pt = gerar("pt")
paginas_en = gerar("en")

# ---------------------------------------------------------------------
# sitemap.xml — regenerado junto com as páginas para nunca ficar defasado
# Cada URL lista as duas versões (xhtml:link), como o Google recomenda.
# ---------------------------------------------------------------------
hoje = datetime.date.today().isoformat()
# a home do português não é gerada (index.html é a fonte), por isso entra à parte
nomes_pt = ["index"] + [n for n in paginas_pt if n != "index"]
nomes_pt = [n for n in nomes_pt if n in PARES]


def entrada(loc, prio, nome_pt):
    en = PARES[nome_pt]
    alt = (
        f'    <xhtml:link rel="alternate" hreflang="pt-BR" href="{url_pt(nome_pt)}"/>\n'
        f'    <xhtml:link rel="alternate" hreflang="en" href="{url_en(en)}"/>\n'
        f'    <xhtml:link rel="alternate" hreflang="x-default" href="{url_pt(nome_pt)}"/>\n'
    )
    return (
        f"  <url>\n    <loc>{loc}</loc>\n{alt}    <lastmod>{hoje}</lastmod>\n"
        f"    <priority>{prio}</priority>\n  </url>"
    )


linhas = []
for n in sorted(nomes_pt, key=lambda x: (x != "index", x)):
    linhas.append(entrada(url_pt(n), "1.0" if n == "index" else "0.8", n))
    linhas.append(entrada(url_en(PARES[n]), "0.9" if n == "index" else "0.7", n))

(base / "sitemap.xml").write_text(
    '<?xml version="1.0" encoding="UTF-8"?>\n'
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" '
    'xmlns:xhtml="http://www.w3.org/1999/xhtml">\n'
    + "\n".join(linhas)
    + "\n</urlset>\n",
    encoding="utf-8",
)
print("gerado: sitemap.xml", len(linhas), "urls")
