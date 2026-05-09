export type ManaCode = 'W' | 'U' | 'B' | 'R' | 'G' | 'C';
export type DeckSize = 30 | 60;

export interface MtgCard {
  id: string;
  name: string;
  manaCost?: string;
  cmc?: number;
  colors?: string[];
  colorIdentity?: string[];
  type?: string;
  supertypes?: string[];
  types?: string[];
  subtypes?: string[];
  rarity?: string;
  set?: string;
  setName?: string;
  text?: string;
  flavor?: string;
  artist?: string;
  number?: string;
  power?: string;
  toughness?: string;
  loyalty?: string;
  layout?: string;
  multiverseid?: number;
  imageUrl?: string;
  printings?: string[];
  legalities?: Array<{ format: string; legality: string }>;
  rulings?: Array<{ date: string; text: string }>;
  foreignNames?: Array<{ language: string; name: string; multiverseid?: number }>;
}

export interface MtgSet {
  code: string;
  name: string;
  type?: string;
  border?: string;
  mkm_id?: number;
  booster?: string[];
  releaseDate?: string;
  block?: string;
  onlineOnly?: boolean;
}

export interface CardResponse {
  cards: MtgCard[];
}

export interface SetResponse {
  sets: MtgSet[];
}

export interface FavoriteCard {
  id: string;
  name: string;
  set?: string;
  setName?: string;
  imageUrl?: string;
  manaCost?: string;
  colors?: string[];
  type?: string;
  rarity?: string;
}

export interface DeckCard extends FavoriteCard {
  quantity: number;
}

export interface Deck {
  id: string;
  name: string;
  size: DeckSize;
  cards: DeckCard[];
}

export interface LoreEntry {
  name: string;
  mana: ManaCode | 'C' | 'M';
  title: string;
  summary: string;
}

export interface RuleBookSection {
  number: string;
  title: string;
  description: string;
}
