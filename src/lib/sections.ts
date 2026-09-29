import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';
import { SECTIONS, type SectionId } from '../content/copy';

interface SectionState {
  active: SectionId;
  /** Progresso 0..1 da seção ativa. */
  progress: number;
  /** Já rolou pelo menos uma vez (esconde o "Role para descobrir"). */
  scrolled: boolean;
}

export const sections = createStore<SectionState>(() => ({
  active: 'inicio',
  progress: 0,
  scrolled: false,
}));

export function useSections<T>(selector: (s: SectionState) => T): T {
  return useStore(sections, selector);
}

export function sectionIndex(id: SectionId): string {
  return SECTIONS.find((s) => s.id === id)?.index ?? '01';
}
