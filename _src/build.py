import re, pathlib, sys, datetime

base = pathlib.Path(__file__).resolve().parent.parent
index = (base / "index.html").read_text(encoding="utf-8")

# domínio de produção — usado em canonical, og:url e sitemap.xml
SITE = "https://oberfritz.com.br"

nav = index.split("<!-- ============================ NAV ============================ -->")[1]
nav = nav.split("<!-- ============================ HERO ============================ -->")[0].strip()

footer = index.split("<!-- ============================ FOOTER ============================ -->")[1]
footer = footer.split('<script src="assets/js/site.js"></script>')[0].strip()

HEAD = """<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title}</title>
<meta name="description" content="{desc}">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:type" content="website">
<meta property="og:url" content="{site}/{nome}.html">
<meta property="og:image" content="{site}/assets/img/logo-oberfritz.png">
<meta property="og:locale" content="pt_BR">
<meta property="og:site_name" content="OberFritz">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#030D09">
<link rel="canonical" href="{site}/{nome}.html">
<link rel="icon" href="assets/img/logo-marca.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&family=Instrument+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/css/style.css">
</head>
<body>
"""

TAIL = """
<script src="assets/js/site.js"></script>
</body>
</html>
"""

paginas = []

# páginas geradas que não devem entrar no sitemap nem ser indexadas
FORA_DO_SITEMAP = {"404"}

for arquivo in sorted((base / "_src").glob("*.body.html")):
    nome = arquivo.name.replace(".body.html", "")
    corpo = arquivo.read_text(encoding="utf-8")
    m = re.search(r"<!--HEAD:(.*?)\|(.*?)-->", corpo)
    title, desc = m.group(1), m.group(2)
    corpo = corpo.replace(m.group(0), "").strip()

    # marca o link ativo da navegação
    nav_pagina = nav.replace(' class="is-active"', "")
    nav_pagina = nav_pagina.replace(
        f'<a href="{nome}.html">', f'<a href="{nome}.html" class="is-active">', 1
    )

    corpo = corpo.replace("<!--NAV-->", nav_pagina).replace("<!--FOOTER-->", footer)
    html = HEAD.format(title=title, desc=desc, site=SITE, nome=nome) + corpo + TAIL
    if nome in FORA_DO_SITEMAP:
        html = html.replace("</head>", '<meta name="robots" content="noindex">\n</head>')
    (base / f"{nome}.html").write_text(html, encoding="utf-8")
    print("gerado:", nome + ".html", len(html), "bytes")
    if nome not in FORA_DO_SITEMAP:
        paginas.append(nome)

# ---------------------------------------------------------------------
# sitemap.xml — regenerado junto com as páginas para nunca ficar defasado
# ---------------------------------------------------------------------
hoje = datetime.date.today().isoformat()
urls = [(f"{SITE}/", "1.0")] + [(f"{SITE}/{n}.html", "0.8") for n in sorted(paginas)]
linhas = "\n".join(
    f"  <url>\n    <loc>{loc}</loc>\n    <lastmod>{hoje}</lastmod>\n"
    f"    <priority>{prio}</priority>\n  </url>"
    for loc, prio in urls
)
(base / "sitemap.xml").write_text(
    '<?xml version="1.0" encoding="UTF-8"?>\n'
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    f"{linhas}\n</urlset>\n",
    encoding="utf-8",
)
print("gerado: sitemap.xml", len(urls), "urls")
