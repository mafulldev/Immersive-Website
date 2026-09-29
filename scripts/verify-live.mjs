/**
 * Smoke test do site publicado. Roda no CI depois do deploy.
 *
 * Verifica, em desktop, mobile e reduced motion:
 * - resposta 200 e nenhuma resposta 4xx/5xx de assets do próprio site;
 * - nenhum erro de console nem exceção não tratada;
 * - título, lang, canonical e h1 esperados;
 * - o mundo WebGL renderizou (poster escondido), exceto em reduced motion.
 *
 * Uso: SITE_URL=https://exemplo.com/ node scripts/verify-live.mjs
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const SITE_URL = process.env.SITE_URL ?? 'http://localhost:4173/';
const OUT = process.env.SHOTS_DIR ?? 'verify-shots';
mkdirSync(OUT, { recursive: true });

const IGNORED = /fontshare|googleapis|gstatic|THREE\.Clock/;

async function check(label, viewport, reduced) {
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
  });
  const context = await browser.newContext({
    viewport,
    reducedMotion: reduced ? 'reduce' : 'no-preference',
    isMobile: viewport.width < 1024,
    hasTouch: viewport.width < 1024,
  });
  const page = await context.newPage();
  const problems = [];
  page.on('console', (m) => {
    if (m.type() === 'error' && !IGNORED.test(m.text())) problems.push(`console.error: ${m.text().slice(0, 200)}`);
  });
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
  page.on('response', (r) => {
    if (r.status() >= 400 && r.url().startsWith(SITE_URL)) problems.push(`http ${r.status()}: ${r.url()}`);
  });

  const res = await page.goto(SITE_URL, { waitUntil: 'load', timeout: 90_000 });
  if (!res || res.status() !== 200) problems.push(`status ${res?.status()}`);
  await page.waitForTimeout(12_000);

  const state = await page.evaluate(() => ({
    title: document.title,
    lang: document.documentElement.lang,
    canonical: document.querySelector('link[rel=canonical]')?.getAttribute('href') ?? null,
    h1: document.querySelector('h1')?.textContent?.replace(/\s+/g, ' ').trim() ?? null,
    posterHidden: document.querySelector('.poster')?.classList.contains('is-hidden') ?? null,
    canvas: Boolean(document.querySelector('canvas')),
    sections: document.querySelectorAll('main > section').length,
  }));

  if (!state.title.includes('CAUDAL')) problems.push(`title inesperado: ${state.title}`);
  if (state.lang !== 'pt-BR') problems.push(`lang inesperado: ${state.lang}`);
  if (state.canonical !== SITE_URL) problems.push(`canonical ${state.canonical} != ${SITE_URL}`);
  if (!state.h1?.startsWith('A IA gera o fluxo.')) problems.push(`h1 inesperado: ${state.h1}`);
  if (state.sections !== 5) problems.push(`seções: ${state.sections}`);
  if (reduced) {
    if (state.canvas) problems.push('canvas montado com reduced motion');
  } else if (!state.posterHidden) {
    problems.push('mundo WebGL não renderizou (poster ainda visível)');
  }

  await page.screenshot({ path: `${OUT}/${label}-top.png` });
  await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'auto' }));
  await page.waitForTimeout(6_000);
  await page.screenshot({ path: `${OUT}/${label}-bottom.png` });
  await browser.close();
  return { label, state, problems };
}

const results = [];
results.push(await check('desktop', { width: 1440, height: 900 }, false));
results.push(await check('mobile', { width: 390, height: 844 }, false));
results.push(await check('reduced', { width: 1440, height: 900 }, true));

console.log(JSON.stringify(results, null, 2));
const failed = results.filter((r) => r.problems.length > 0);
if (failed.length > 0) {
  console.error(`\nFALHOU em ${failed.map((f) => f.label).join(', ')}`);
  process.exit(1);
}
console.log('\nOK: site publicado passou no smoke test.');
