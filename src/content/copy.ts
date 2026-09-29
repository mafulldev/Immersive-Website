/**
 * Todo o conteúdo do site vive aqui. Nenhum componente tem texto hardcoded.
 * Os números do HUD e da seção "Por quê" são ilustrativos e editáveis.
 */

export const BRAND = {
  name: 'CAUDAL',
  tagline: 'Código. Critério. Confiança.',
  ctaUrl: '#contato',
  year: 2026,
  siteUrl: 'https://caudal.dev/',
} as const;

export const NAV = {
  links: [
    { id: 'inicio', label: 'Início' },
    { id: 'porque', label: 'Por quê' },
    { id: 'processo', label: 'Processo' },
    { id: 'solucoes', label: 'Soluções' },
    { id: 'contato', label: 'Contato' },
  ],
  cta: 'Fale com um especialista',
  menuOpen: 'Abrir menu',
  menuClose: 'Fechar menu',
  skipLink: 'Pular para o conteúdo',
  homeAria: 'CAUDAL — voltar ao início',
} as const;

export const SECTIONS = [
  { id: 'inicio', index: '01' },
  { id: 'porque', index: '02' },
  { id: 'processo', index: '03' },
  { id: 'solucoes', index: '04' },
  { id: 'contato', index: '05' },
  { id: 'rodape', index: '06' },
] as const;

export type SectionId = (typeof SECTIONS)[number]['id'];

export const HERO = {
  eyebrow: 'Vibe coding com engenharia',
  scrambleChars: '01<>/{}_',
  title: {
    lines: ['A IA gera o fluxo.', 'O profissional', 'dá a direção.'],
    accentLine: 2,
    accentPrefix: 'dá ',
    accent: 'a direção.',
  },
  lead:
    'Vibe coding coloca um produto no ar em horas — e os problemas também. Por trás de toda criação com IA que funciona de verdade existe alguém que entende de arquitetura, segurança e pessoas.',
  primary: 'Fale com um especialista',
  secondary: 'Veja o que a IA não vê',
  secondaryTarget: '#processo',
  highlights: [
    { icon: 'ShieldCheck', lines: ['Revisão humana', 'em cada linha'] },
    { icon: 'Lock', lines: ['Segurança', 'desde o prompt'] },
    { icon: 'TrendingUp', lines: ['Código que', 'escala'] },
  ],
  hud: {
    eyebrow: 'Sessão de vibe coding · ao vivo',
    generatedStart: 1284,
    generatedLabel: 'linhas geradas pela IA',
    rate: '+38/s',
    tickMs: 900,
    tickMin: 12,
    tickMax: 48,
    reviewDelayMs: 400,
    reviewedLabel: 'Revisadas por humano',
    blockedLabel: 'Problemas barrados',
    blocked: 37,
    statusLabel: 'Status',
    statusValue: 'Pronto para produção',
    sparkline: [8, 14, 11, 18, 16, 24, 21, 30, 27, 36, 33, 42, 40, 48],
    sparklineAria: 'Gráfico de linhas geradas ao longo da sessão, em tendência de alta.',
  },
  scrollCue: 'Role para descobrir',
  scrollCueAria: 'Rolar para a próxima seção',
} as const;

export const WHY = {
  eyebrow: 'Por que isso importa?',
  title: { lines: ['Gerar é fácil.', 'Sustentar é ofício.'], accentLine: 1, accentPrefix: 'Sustentar é ', accent: 'ofício.' },
  body:
    'Qualquer pessoa gera um protótipo numa tarde. Levar para produção — com dados protegidos, performance real e código que outra pessoa consegue manter — exige quem saiba ler o que a IA escreveu.',
  link: 'Conheça nosso método',
  linkTarget: '#processo',
  cards: [
    { icon: 'Boxes', title: 'Arquitetura', text: 'A IA resolve a tela. Nós resolvemos o sistema.' },
    { icon: 'ShieldAlert', title: 'Segurança', text: 'Chaves expostas, rotas abertas, dados sem regra de acesso.' },
    { icon: 'Gauge', title: 'Performance', text: 'Consultas repetidas, bundles inchados, telas que travam.' },
    { icon: 'Wrench', title: 'Manutenção', text: 'Código que outra pessoa entende daqui a seis meses.' },
    { icon: 'Users', title: 'Produto', text: 'A IA não conversa com o seu cliente. A gente conversa.' },
  ],
  numbers: [
    { value: 100, suffix: '%', display: '100%', label: 'do código gerado passa por revisão humana' },
    { value: 0, suffix: '', display: '0', label: 'segredos expostos no front-end' },
    { value: 24, suffix: '/7', display: '24/7', label: 'observabilidade em produção' },
  ],
} as const;

export const PROCESS = {
  eyebrow: 'O processo',
  title: { lines: ['Inteligência que', 'precisa de critério.'], accentLine: 1, accentPrefix: 'precisa de ', accent: 'critério.' },
  body:
    'Usamos os melhores agentes de código do mercado — e um processo humano que revisa, testa e endurece cada entrega antes de ela chegar ao seu cliente.',
  button: 'Ver o processo completo',
  buttonTarget: '#solucoes',
  alertLabel: 'Alerta',
  resolvedLabel: 'Corrigido',
  steps: [
    {
      icon: 'Boxes',
      label: 'Revisão de arquitetura',
      alert: 'LÓGICA DUPLICADA · 3 componentes fazem a mesma chamada',
      resolved: 'CORRIGIDO · camada de dados única',
    },
    {
      icon: 'ShieldAlert',
      label: 'Auditoria de segurança',
      alert: 'CHAVE SECRETA EXPOSTA · api/auth.ts:42',
      resolved: 'CORRIGIDO · movida para o servidor',
    },
    {
      icon: 'FlaskConical',
      label: 'Testes automatizados',
      alert: 'SEM TESTES · checkout.ts · cobertura 0%',
      resolved: 'CORRIGIDO · cobertura 92%',
    },
    {
      icon: 'Gauge',
      label: 'Performance',
      alert: 'CONSULTA SEM ÍNDICE · 2,4 s por requisição',
      resolved: 'CORRIGIDO · 38 ms',
    },
    {
      icon: 'Radar',
      label: 'Deploy e observabilidade',
      alert: 'SEM MONITORAMENTO · erros invisíveis em produção',
      resolved: 'CORRIGIDO · alertas e logs ativos',
    },
  ],
  finale: '5/5 RESOLVIDOS · PRONTO PARA PRODUÇÃO',
  idle: 'AGUARDANDO REVISÃO · role para iniciar',
  staticHeading: 'Os cinco casos, antes e depois',
  srIntro: 'Cinco problemas típicos de código gerado por IA e como cada um é resolvido:',
  arrow: '→',
} as const;

export const SOLUTIONS = {
  eyebrow: 'Para quem',
  title: { lines: ['Do primeiro prompt', 'ao produto em escala.'], accentLine: -1, accentPrefix: '', accent: '' },
  body: 'Cada estágio de um projeto com IA tem riscos diferentes. A gente entra exatamente onde você está.',
  button: 'Explorar todas as soluções',
  buttonTarget: '#contato',
  more: 'Saiba mais',
  carouselAria: 'Carrossel de soluções. Use as setas do teclado para navegar.',
  prevAria: 'Solução anterior',
  nextAria: 'Próxima solução',
  cards: [
    { icon: 'Rocket', title: 'Founders com protótipo', text: 'Seu MVP feito com IA vira produto de verdade — sem reescrever do zero.' },
    { icon: 'Building2', title: 'Empresas adotando IA', text: 'Governança, revisão e padrões para times que já codam com agentes.' },
    { icon: 'Layers', title: 'Times de produto', text: 'Mais velocidade sem contrair dívida técnica.' },
    { icon: 'Code2', title: 'Criadores e agências', text: 'Code review e mentoria para quem entrega com vibe coding.' },
  ],
} as const;

export const CONTACT = {
  eyebrow: 'Vamos conversar?',
  title: { lines: ['Seu próximo produto com IA', 'começa do jeito certo.'], accentLine: 1, accentPrefix: 'começa ', accent: 'do jeito certo.' },
  body:
    'Conte o que você construiu — ou quer construir. Um especialista analisa o seu caso e mostra o caminho mais curto e seguro até a produção.',
  primary: 'Fale com um especialista',
  list: [
    { icon: 'ScanSearch', text: 'Diagnóstico do código gerado por IA' },
    { icon: 'Route', text: 'Plano do protótipo à produção' },
    { icon: 'Activity', text: 'Acompanhamento pós-lançamento' },
  ],
  orbitAria: 'Ir para o contato',
  aside: ['A IA acelera.', 'O critério sustenta.', 'E a gente está', 'em todas as etapas.'],
} as const;

export const FOOTER = {
  legal: `© ${BRAND.year} ${BRAND.name}. Todos os direitos reservados.`,
  legalLinks: [
    { label: 'Privacidade', href: '#privacidade' },
    { label: 'Termos', href: '#termos' },
    { label: 'Cookies', href: '#cookies' },
  ],
  socials: [
    { icon: 'Linkedin', label: 'LinkedIn', href: 'https://www.linkedin.com/' },
    { icon: 'XLogo', label: 'X', href: 'https://x.com/' },
    { icon: 'Youtube', label: 'YouTube', href: 'https://www.youtube.com/' },
    { icon: 'Github', label: 'GitHub', href: 'https://github.com/' },
  ],
  navAria: 'Navegação do rodapé',
  socialAria: 'Redes sociais',
} as const;

export const SOUND = {
  enable: 'Ativar som ambiente',
  disable: 'Desativar som ambiente',
} as const;

export const A11Y = {
  worldAria: 'Cenário decorativo: uma cachoeira de código que desce do caos à ordem.',
  posterAlt: 'Cachoeira azul de luz descendo por rochas escuras até um lago calmo.',
} as const;
