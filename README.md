# CAUDAL — Vibe coding com engenharia de verdade

Ao vivo: https://mafulldev.github.io/Immersive-Website/ (GitHub Pages, publicado pelo workflow em `.github/workflows/deploy.yml`). O `netlify.toml` deixa o projeto pronto para a Netlify (`caudal-site`) quando o repositório for ligado lá.

Site imersivo one-page, em português do Brasil, sobre vibe coding. A tese: toda criação feita com IA precisa de um profissional competente por trás.

A metáfora é uma cachoeira de código que desce **do caos ao critério**: um monólito de dados (a IA) despeja uma torrente turbulenta, a água atravessa o Núcleo de Revisão (o profissional), onde os problemas são detectados e corrigidos um a um, e termina num lago calmo e espelhado (o produto estável em produção). Rolar a página é descer a cachoeira: o site inteiro é um único mundo contínuo em WebGL, sem cortes de cena.

## Rodando

```bash
npm i
npm run dev        # http://localhost:5173
npm run build      # gera dist/ (tsc + vite build)
npm run preview    # serve dist/ em http://localhost:4173
npm run typecheck  # TypeScript strict, sem `any`
```

Node 20+ é suficiente.

## Stack

- React 19 + TypeScript (strict) + Vite 8
- Tailwind CSS v4 com tokens via `@theme` (`src/styles/tokens.css`)
- GSAP 3.15 (ScrollTrigger, SplitText, ScrambleText, DrawSVG, Draggable, Inertia, CustomEase) + `@gsap/react`
- Lenis (smooth scroll, sincronizado pelo `gsap.ticker`)
- three + @react-three/fiber + @react-three/drei + @react-three/postprocessing
- zustand (store do mundo, lido em `useFrame` sem re-render)
- lucide-react

Sem framer-motion, locomotive-scroll, tsparticles, jQuery ou `scroll-behavior: smooth`.

## Estrutura

```
src/content/copy.ts            # TODO o texto e TODO número do site (pt-BR)
src/lib/gsap.ts                # registro de plugins + ease "caudal"
src/lib/lenis.ts               # Lenis + ScrollTrigger + âncoras com offset
src/lib/scrollSync.ts          # ScrollTriggers por seção → seção ativa + câmera/caos do mundo
src/lib/pin.ts                 # extensão do pin da seção 03 (200% desktop / 120% mobile)
src/lib/sound.ts               # som ambiente opcional (Web Audio, sem assets)
src/store/world.ts             # camY, camZ, tilt, chaos, order, resolved, pulseY, reveal, velocity, mouse, tier
src/hooks/                     # useTier (heurística + tiers), useReducedMotion, useMagnetic
src/components/ui/             # GlassCard, Button, MagneticButton, IconTile, Eyebrow, SplitHeading, Counter, …
src/components/layout/         # Nav, SectionRail, Footer, Logo
src/sections/                  # Hero, Why, Process (pinada), Solutions (carrossel), Contact
src/world/                     # World, CameraRig, Plates, Monolith, Waterfall, waterMaterial,
                               # GlyphStream, Mist, ReviewCore, Pool, Effects, path, textures
src/styles/tokens.css, globals.css
```

O mundo 3D (`src/world`) é um chunk separado, importado dinamicamente após o primeiro paint (`requestIdleCallback`). Até lá aparece o poster CSS; quando o primeiro frame renderiza, o poster faz crossfade de 800 ms.

## Variáveis

Em `src/content/copy.ts` → `BRAND`:

| Variável | Valor atual | Onde trocar |
|---|---|---|
| `name` | CAUDAL | `BRAND.name` |
| `tagline` | Código. Critério. Confiança. | `BRAND.tagline` |
| `ctaUrl` | `#contato` | `BRAND.ctaUrl` (troque por WhatsApp ou Calendly) |
| `year` | 2026 | `BRAND.year` |
| `siteUrl` | https://mafulldev.github.io/Immersive-Website/ | `BRAND.siteUrl` e as metas em `index.html` |

Os números do HUD e da seção "Por quê" são ilustrativos e ficam em `HERO.hud` e `WHY.numbers`.

## Assets esperados em `public/world/`

Nenhum asset é obrigatório: sem imagens, as placas de rocha caem num shader procedural (ridged fbm + rim light azul vindo da água) e o poster usa gradientes CSS.

| Arquivo | Uso | Recomendação |
|---|---|---|
| `poster.avif` | Poster antes do WebGL, reduced motion e sem WebGL. Também o pré-load do LCP visual. | 1600×1000, ≤ 250 KB. Gerado pelo script abaixo. |
| `og.jpg` | Imagem Open Graph (`index.html`). | 1200×630. |
| `plates.json` | Manifesto das placas de rocha (já existe, vazio). | Liste os tiles de cada camada, de cima para baixo. |
| `plate-far-1.avif` … `plate-far-N.avif` | Fundo: penhascos em névoa (parallax 0.6, z −7). | Tiles de até 2048 px de altura, ≤ 250 KB cada. |
| `plate-mid-1.avif` … | Meio: degraus por onde a água passa (parallax 1.0). | Idem. |
| `plate-near-1.png` … | Frente: silhuetas laterais com alpha (parallax 1.25, z 2). | PNG com transparência, ≤ 2048 px por tile. |

Exemplo de `plates.json` com imagens:

```json
{
  "far": ["plate-far-1.avif", "plate-far-2.avif", "plate-far-3.avif", "plate-far-4.avif"],
  "mid": ["plate-mid-1.avif", "plate-mid-2.avif", "plate-mid-3.avif", "plate-mid-4.avif"],
  "near": ["plate-near-1.png", "plate-near-2.png", "plate-near-3.png", "plate-near-4.png"]
}
```

Os tiles de uma camada são empilhados verticalmente cobrindo o mundo inteiro (do topo do monólito ao lago). Tiles acima de 2048 px são ignorados (limite de textura em mobile) e a camada volta ao fallback procedural.

Prompts para gerar as placas:

- Meio e fundo: *"Ultra-tall vertical cinematic matte painting at night, dark wet basalt cliffs forming a zigzag of rock ledges descending down the center, a dry empty channel where a waterfall would flow, deep navy-black atmosphere, cold blue rim light on rock edges coming from the center, pockets of mist, photoreal, high detail, no water, no text, no people, no buildings."*
- Frente: *"Isolated dark wet rock silhouettes on pure black background framing only the left and right edges, empty center, subtle blue highlights."*

### Gerando o poster a partir do próprio mundo

Com o site servido (`npm run preview`), um script de Playwright pode abrir a página, esconder o DOM e salvar um frame do WebGL como `poster.avif` e `og.jpg`. O poster incluído em `public/world/` foi gerado assim.

## Acessibilidade e fallbacks

- `prefers-reduced-motion`: sem Lenis (scroll nativo), sem pin, sem scramble, sem parallax; reveals viram fades de 300 ms; contadores mostram o valor final; a seção 03 mostra os cinco casos já resolvidos em lista estática "antes → depois"; o Canvas vira o poster.
- Sem WebGL: mesmo poster e mesma experiência DOM completa.
- Skip-link, `lang="pt-BR"`, landmarks semânticos, um único `h1` e um `h2` por seção, carrossel navegável por teclado (← →) com `aria-label`, card de alerta sem `aria-live` e com equivalente `sr-only`.
- O cursor nativo continua visível; a luz que segue o cursor é decorativa.

## Performance

- Tiers de qualidade: heurística inicial (`hardwareConcurrency`, `deviceMemory`, renderer WebGL, largura) e `PerformanceMonitor` do drei rebaixando em tempo real.
  - Alto: DPR até 2, 1600 glifos, bloom completo, reflexo 512.
  - Médio: DPR 1.5, partículas a 60 %, 900 glifos, bloom em meia resolução, reflexo 256.
  - Baixo: DPR 1, partículas a 25 %, sem glifos, sem bloom, lago sem reflexo (gradiente radial).
- O render pausa quando a aba fica oculta (`frameloop="never"`).
- Nada de `setState` em `useFrame`; geometrias e texturas são descartadas no unmount.
- JS inicial (sem o mundo): ~165 KB gzip. O chunk do mundo (~280 KB gzip) só carrega depois do primeiro paint.

## Som ambiente

Desligado por padrão. O botão de onda no canto inferior esquerdo liga um loop de cachoeira sintetizado com Web Audio (ruído filtrado, volume .25, fade-in de 1,5 s) e um "tick" suave a cada problema resolvido na seção 03. Não há arquivos de áudio.
