/**
 * Cores do produto: sempre token (sem hex). Sem seletor livre.
 */
export type SectorColorToken =
  | "green"
  | "blue"
  | "amber"
  | "rose"
  | "purple"
  | "teal";

export type Sector = {
  id: string;
  name: string;
  unit: string;
  color: SectorColorToken;
  /** Emoji; se vazio, a UI mostra o ícone por defeito (caixa) */
  icon: string;
};

