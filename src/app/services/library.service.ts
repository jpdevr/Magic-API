import { Injectable, signal } from '@angular/core';
import { Deck, DeckCard, DeckSize, FavoriteCard, MtgCard } from '../models/mtg.models';

const FAVORITES_KEY = 'mtg_favorites';
const DECKS_KEY = 'mtg_decks';

@Injectable({ providedIn: 'root' })
export class LibraryService {
  readonly favorites = signal<FavoriteCard[]>(this.readStorage<FavoriteCard[]>(FAVORITES_KEY, []));
  readonly decks = signal<Deck[]>(this.readStorage<Deck[]>(DECKS_KEY, [
    { id: 'deck-30', name: 'Deck de estudo', size: 30, cards: [] },
    { id: 'deck-60', name: 'Deck construido', size: 60, cards: [] }
  ]));

  toggleFavorite(card: MtgCard): void {
    const favorite = this.toFavorite(card);
    const exists = this.favorites().some((item) => item.id === favorite.id);
    const next = exists
      ? this.favorites().filter((item) => item.id !== favorite.id)
      : [favorite, ...this.favorites()];
    this.favorites.set(next);
    this.writeStorage(FAVORITES_KEY, next);
  }

  isFavorite(id: string): boolean {
    return this.favorites().some((item) => item.id === id);
  }

  addToDeck(deckId: string, card: MtgCard): string | null {
    const sourceDecks = this.decks();
    const deckIndex = sourceDecks.findIndex((deck) => deck.id === deckId);
    if (deckIndex < 0) {
      return 'Deck nao encontrado.';
    }

    const targetDeck = sourceDecks[deckIndex];
    const total = targetDeck.cards.reduce((sum, item) => sum + item.quantity, 0);
    if (total >= targetDeck.size) {
      return 'Deck cheio.';
    }

    const favorite = this.toFavorite(card);
    const existingCopiesByName = targetDeck.cards
      .filter((item) => item.name === favorite.name && !this.isBasicLand(item))
      .reduce((sum, item) => sum + item.quantity, 0);

    if (existingCopiesByName >= 4) {
      return 'Limite de 4 copias por carta neste deck.';
    }

    const cards = targetDeck.cards.map((item) => ({ ...item }));
    const existingIndex = cards.findIndex((item) => item.id === favorite.id);
    if (existingIndex >= 0) {
      cards[existingIndex] = { ...cards[existingIndex], quantity: cards[existingIndex].quantity + 1 };
    } else {
      cards.unshift({ ...favorite, quantity: 1 });
    }

    const decks = sourceDecks.map((deck, index) => index === deckIndex ? { ...deck, cards } : deck);
    this.decks.set(decks);
    this.writeStorage(DECKS_KEY, decks);
    return null;
  }

  removeFromDeck(deckId: string, cardId: string): void {
    const decks = this.decks().map((deck) => {
      if (deck.id !== deckId) {
        return deck;
      }

      const cards = deck.cards
        .map((item) => item.id === cardId ? { ...item, quantity: item.quantity - 1 } : item)
        .filter((item) => item.quantity > 0);
      return { ...deck, cards };
    });

    this.decks.set(decks);
    this.writeStorage(DECKS_KEY, decks);
  }

  createDeck(size: DeckSize): void {
    const deck: Deck = {
      id: `deck-${Date.now()}`,
      name: size === 60 ? 'Novo deck construido' : 'Novo deck de estudo',
      size,
      cards: []
    };
    const decks = [deck, ...this.decks()];
    this.decks.set(decks);
    this.writeStorage(DECKS_KEY, decks);
  }

  renameDeck(deckId: string, name: string): void {
    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }

    const decks = this.decks().map((deck) => deck.id === deckId ? { ...deck, name: trimmed } : deck);
    this.decks.set(decks);
    this.writeStorage(DECKS_KEY, decks);
  }

  updateDeckSize(deckId: string, size: DeckSize): string | null {
    const deck = this.decks().find((item) => item.id === deckId);
    if (!deck) {
      return 'Deck nao encontrado.';
    }

    const total = deck.cards.reduce((sum, item) => sum + item.quantity, 0);
    if (total > size) {
      return `Este deck tem ${total} cartas. Remova cartas antes de reduzir para ${size}.`;
    }

    const decks = this.decks().map((item) => item.id === deckId ? { ...item, size } : item);
    this.decks.set(decks);
    this.writeStorage(DECKS_KEY, decks);
    return null;
  }

  deleteDeck(deckId: string): string | null {
    if (this.decks().length <= 1) {
      return 'Mantenha pelo menos um deck.';
    }

    const decks = this.decks().filter((deck) => deck.id !== deckId);
    this.decks.set(decks);
    this.writeStorage(DECKS_KEY, decks);
    return null;
  }

  private toFavorite(card: MtgCard): FavoriteCard {
    return {
      id: card.id,
      name: card.name,
      set: card.set,
      setName: card.setName,
      imageUrl: card.imageUrl,
      manaCost: card.manaCost,
      colors: card.colors,
      type: card.type,
      rarity: card.rarity
    };
  }

  private isBasicLand(card: DeckCard | FavoriteCard): boolean {
    return card.type?.includes('Basic Land') ?? false;
  }

  private readStorage<T>(key: string, fallback: T): T {
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        return JSON.parse(stored) as T;
      }

      const migrated = this.readCookie<T>(key);
      if (migrated !== null) {
        localStorage.setItem(key, JSON.stringify(migrated));
        return migrated;
      }
    } catch {
      return fallback;
    }

    return fallback;
  }

  private writeStorage<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // ignore storage quota errors to keep UI responsive
    }
  }

  private readCookie<T>(key: string): T | null {
    const cookie = document.cookie.split('; ').find((item) => item.startsWith(`${key}=`));
    if (!cookie) {
      return null;
    }

    try {
      return JSON.parse(decodeURIComponent(cookie.split('=').slice(1).join('='))) as T;
    } catch {
      return null;
    }
  }
}
