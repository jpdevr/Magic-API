import { Injectable, signal } from '@angular/core';
import { Deck, DeckCard, DeckSize, FavoriteCard, MtgCard } from '../models/mtg.models';

const FAVORITES_KEY = 'mtg_favorites';
const DECKS_KEY = 'mtg_decks';

@Injectable({ providedIn: 'root' })
export class LibraryService {
  readonly favorites = signal<FavoriteCard[]>(this.readCookie<FavoriteCard[]>(FAVORITES_KEY, []));
  readonly decks = signal<Deck[]>(this.readCookie<Deck[]>(DECKS_KEY, [
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
    this.writeCookie(FAVORITES_KEY, next);
  }

  isFavorite(id: string): boolean {
    return this.favorites().some((item) => item.id === id);
  }

  addToDeck(deckId: string, card: MtgCard): string | null {
    const decks = this.decks().map((deck) => {
      if (deck.id !== deckId) {
        return deck;
      }

      const total = deck.cards.reduce((sum, item) => sum + item.quantity, 0);
      if (total >= deck.size) {
        return deck;
      }

      const favorite = this.toFavorite(card);
      const existingCopiesByName = deck.cards
        .filter((item) => item.name === favorite.name && !this.isBasicLand(item))
        .reduce((sum, item) => sum + item.quantity, 0);

      if (existingCopiesByName >= 4) {
        return deck;
      }

      const existing = deck.cards.find((item) => item.id === favorite.id);
      const cards = existing
        ? deck.cards.map((item) => item.id === favorite.id ? { ...item, quantity: item.quantity + 1 } : item)
        : [{ ...favorite, quantity: 1 }, ...deck.cards];

      return { ...deck, cards };
    });

    if (JSON.stringify(decks) === JSON.stringify(this.decks())) {
      const deck = this.decks().find((item) => item.id === deckId);
      const total = deck?.cards.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
      return total >= (deck?.size ?? 0) ? 'Deck cheio.' : 'Limite de 4 copias por carta neste deck.';
    }

    this.decks.set(decks);
    this.writeCookie(DECKS_KEY, decks);
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
    this.writeCookie(DECKS_KEY, decks);
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
    this.writeCookie(DECKS_KEY, decks);
  }

  renameDeck(deckId: string, name: string): void {
    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }

    const decks = this.decks().map((deck) => deck.id === deckId ? { ...deck, name: trimmed } : deck);
    this.decks.set(decks);
    this.writeCookie(DECKS_KEY, decks);
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
    this.writeCookie(DECKS_KEY, decks);
    return null;
  }

  deleteDeck(deckId: string): string | null {
    if (this.decks().length <= 1) {
      return 'Mantenha pelo menos um deck.';
    }

    const decks = this.decks().filter((deck) => deck.id !== deckId);
    this.decks.set(decks);
    this.writeCookie(DECKS_KEY, decks);
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

  private readCookie<T>(key: string, fallback: T): T {
    const cookie = document.cookie.split('; ').find((item) => item.startsWith(`${key}=`));
    if (!cookie) {
      return fallback;
    }

    try {
      return JSON.parse(decodeURIComponent(cookie.split('=').slice(1).join('='))) as T;
    } catch {
      return fallback;
    }
  }

  private writeCookie<T>(key: string, value: T): void {
    const encoded = encodeURIComponent(JSON.stringify(value));
    document.cookie = `${key}=${encoded}; max-age=31536000; path=/; SameSite=Lax`;
  }
}
