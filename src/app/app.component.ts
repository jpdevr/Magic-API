import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { MANA_OPTIONS, TYPE_SYMBOLS } from './data/magic-content';
import { MagicApiService } from './services/magic-api.service';
import { LibraryService } from './services/library.service';
import { Deck, DeckCard, ManaCode, MtgCard } from './models/mtg.models';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  private readonly api = inject(MagicApiService);
  private toastTimeoutId: ReturnType<typeof setTimeout> | null = null;
  readonly library = inject(LibraryService);

  readonly manaOptions = MANA_OPTIONS;
  readonly typeSymbols = TYPE_SYMBOLS;

  readonly selectedMana = signal<ManaCode | null>(null);
  readonly selectedType = signal<string | null>(null);
  readonly cards = signal<MtgCard[]>([]);
  readonly selectedCard = signal<MtgCard | null>(null);
  readonly versions = signal<MtgCard[]>([]);
  readonly activeDeckId = signal('deck-60');
  readonly addTargetDeckId = signal('deck-60');
  readonly loading = signal(false);
  readonly versionsLoading = signal(false);
  readonly message = signal('');
  readonly searchTerm = signal('');
  readonly currentPage = signal(1);
  readonly hasSearched = signal(false);

  readonly themeClass = computed(() => this.selectedMana() ? `theme-${this.selectedMana()}` : 'theme-all');
  readonly selectedManaOption = computed(() => this.manaOptions.find((mana) => mana.code === this.selectedMana()));
  readonly activeDeck = computed(() => this.library.decks().find((deck) => deck.id === this.activeDeckId()) ?? this.library.decks()[0]);
  readonly activeDeckCount = computed(() => this.activeDeck()?.cards.reduce((sum, card) => sum + card.quantity, 0) ?? 0);

  constructor() {}

  chooseMana(code: ManaCode): void {
    this.selectedMana.set(code);
    this.currentPage.set(1);
    this.runSearch();
  }

  chooseType(type: string): void {
    this.selectedType.set(type);
    this.currentPage.set(1);
    this.runSearch();
  }

  clearType(): void {
    this.selectedType.set(null);
    this.cards.set([]);
    this.hasSearched.set(false);
  }

  runSearch(page = 1): void {
    if (!this.selectedMana() && !this.selectedType() && this.searchTerm().trim().length < 2) {
      return;
    }

    this.currentPage.set(page);
    this.loading.set(true);
    this.clearToast();
    this.hasSearched.set(true);

    const filters: Record<string, string | number | boolean | undefined> = {
      page,
      pageSize: 100,
      name: this.searchTerm().trim() || undefined,
      types: this.selectedType() ?? undefined
    };

    const mana = this.selectedMana();
    if (mana && mana !== 'C' && !this.selectedType()) {
      filters['colorIdentity'] = mana;
    }

    this.api.searchCards(filters).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (cards) => this.cards.set(this.dedupeAndSort(cards)),
      error: () => this.showToast('Nao foi possivel consultar a API agora. Tente novamente em instantes.')
    });
  }

  openCard(card: MtgCard): void {
    this.selectedCard.set(card);
    this.addTargetDeckId.set(this.activeDeckId());
    this.versions.set([card]);
    this.versionsLoading.set(true);
    this.api.findCardVersions(card.name).pipe(finalize(() => this.versionsLoading.set(false))).subscribe({
      next: (cards) => this.versions.set(this.sortVersions(cards.length ? cards : [card])),
      error: () => this.versions.set([card])
    });
  }

  closeCard(): void {
    this.selectedCard.set(null);
    this.versions.set([]);
  }

  toggleFavorite(card: MtgCard): void {
    this.library.toggleFavorite(card);
  }

  addToDeck(card: MtgCard): void {
    const deckId = this.addTargetDeckId();
    const deck = this.library.decks().find((item) => item.id === deckId);
    if (!deck) {
      this.showToast('Selecione um deck valido.');
      return;
    }

    const result = this.library.addToDeck(deckId, card);
    this.showToast(result ?? `${card.name} entrou no ${deck.name}.`);
  }

  selectDeck(deckId: string): void {
    this.activeDeckId.set(deckId);
    this.addTargetDeckId.set(deckId);
  }

  removeDeckCard(cardId: string): void {
    this.library.removeFromDeck(this.activeDeckId(), cardId);
  }

  createDeck(): void {
    const size = this.activeDeck()?.size ?? 60;
    this.library.createDeck(size);
  }

  renameActiveDeck(name: string): void {
    const activeDeck = this.activeDeck();
    if (!activeDeck) {
      return;
    }
    this.library.renameDeck(activeDeck.id, name);
  }

  deleteActiveDeck(): void {
    const activeDeck = this.activeDeck();
    if (!activeDeck) {
      return;
    }

    const result = this.library.deleteDeck(activeDeck.id);
    if (result) {
      this.showToast(result);
      return;
    }

    const fallbackDeck = this.library.decks()[0];
    if (fallbackDeck) {
      this.activeDeckId.set(fallbackDeck.id);
      this.addTargetDeckId.set(fallbackDeck.id);
    }
  }

  selectPreviousDeck(): void {
    const decks = this.library.decks();
    const currentIndex = decks.findIndex((deck) => deck.id === this.activeDeckId());
    if (currentIndex <= 0) {
      return;
    }
    this.selectDeck(decks[currentIndex - 1].id);
  }

  selectNextDeck(): void {
    const decks = this.library.decks();
    const currentIndex = decks.findIndex((deck) => deck.id === this.activeDeckId());
    if (currentIndex < 0 || currentIndex >= decks.length - 1) {
      return;
    }
    this.selectDeck(decks[currentIndex + 1].id);
  }

  deckState(deck: Deck): 'ok-30' | 'ok-60' | 'invalid' {
    const total = this.deckCount(deck);
    if (total === 30) {
      return 'ok-30';
    }
    if (total === 60) {
      return 'ok-60';
    }
    return 'invalid';
  }

  deckStatusText(deck: Deck): string {
    const total = this.deckCount(deck);
    if (total === 30) {
      return 'Formato 30 pronto';
    }
    if (total === 60) {
      return 'Formato 60 pronto';
    }
    if (total < 30) {
      return `Faltam ${30 - total} cartas para 30`;
    }
    return `Faltam ${60 - total} cartas para 60`;
  }

  deckCount(deck: Deck): number {
    return deck.cards.reduce((sum, card) => sum + card.quantity, 0);
  }

  deckColorTokens(deck: Deck): string[] {
    const colorCount = new Map<ManaCode, number>();
    for (const card of deck.cards) {
      const manaCodes = this.cardManaCodes(card);
      for (const code of manaCodes) {
        colorCount.set(code, (colorCount.get(code) ?? 0) + card.quantity);
      }
    }

    const sorted = [...colorCount.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([code]) => code);

    const limited = sorted.slice(0, 3);
    return limited.length ? limited : ['C'];
  }

  deckColorStyle(deck: Deck): string {
    const palette: Record<string, string> = {
      W: '#e9dfc7',
      U: '#4aa6c8',
      B: '#7f6990',
      R: '#cc5731',
      G: '#5f9450',
      C: '#9d9585'
    };
    const tokens = this.deckColorTokens(deck);
    if (tokens.length === 1) {
      const color = palette[tokens[0]];
      return `linear-gradient(135deg, ${color}, ${color})`;
    }

    const segment = 100 / tokens.length;
    const stops = tokens
      .map((token, index) => {
        const start = Math.round(index * segment);
        const end = Math.round((index + 1) * segment);
        return `${palette[token]} ${start}% ${end}%`;
      })
      .join(', ');
    return `linear-gradient(135deg, ${stops})`;
  }

  private cardManaCodes(card: DeckCard): Array<Exclude<ManaCode, 'C'>> {
    const colors = card.colors ?? [];
    const mapped = colors
      .map((item) => item.toLowerCase())
      .map((color) => {
        if (color.startsWith('white')) return 'W';
        if (color.startsWith('blue')) return 'U';
        if (color.startsWith('black')) return 'B';
        if (color.startsWith('red')) return 'R';
        if (color.startsWith('green')) return 'G';
        return null;
      })
      .filter((code): code is Exclude<ManaCode, 'C'> => code !== null);

    return mapped;
  }

  imageFor(card: MtgCard): string {
    return card.imageUrl?.replace('http://', 'https://') ?? '';
  }

  hideBrokenAsset(event: Event): void {
    const image = event.target as HTMLImageElement;
    image.hidden = true;
  }

  trackByCard(_: number, card: MtgCard): string {
    return card.id;
  }

  private showToast(text: string): void {
    this.message.set(text);
    if (this.toastTimeoutId) {
      clearTimeout(this.toastTimeoutId);
    }
    this.toastTimeoutId = setTimeout(() => {
      this.message.set('');
      this.toastTimeoutId = null;
    }, 3200);
  }

  private clearToast(): void {
    if (this.toastTimeoutId) {
      clearTimeout(this.toastTimeoutId);
      this.toastTimeoutId = null;
    }
    this.message.set('');
  }

  private dedupeAndSort(cards: MtgCard[]): MtgCard[] {
    const seen = new Map<string, MtgCard>();
    const mana = this.selectedMana();
    const filteredCards = mana
      ? cards.filter((card) => this.matchesSelectedMana(card, mana))
      : cards;

    filteredCards.forEach((card) => {
      const key = card.name.toLowerCase();
      const current = seen.get(key);
      if (!current || (!current.imageUrl && card.imageUrl)) {
        seen.set(key, card);
      }
    });

    return [...seen.values()].sort((a, b) => {
      const colorlessA = this.isUniversalOrColorless(a, mana);
      const colorlessB = this.isUniversalOrColorless(b, mana);
      if (colorlessA !== colorlessB) {
        return colorlessA ? 1 : -1;
      }
      return a.name.localeCompare(b.name);
    });
  }

  private sortVersions(cards: MtgCard[]): MtgCard[] {
    const unique = new Map<string, MtgCard>();
    cards.forEach((card) => unique.set(card.id, card));
    return [...unique.values()].sort((a, b) => (b.set ?? '').localeCompare(a.set ?? ''));
  }

  private isUniversalOrColorless(card: MtgCard, mana: ManaCode | null): boolean {
    if (!mana) {
      return false;
    }
    const identity = card.colorIdentity ?? [];
    return identity.length === 0 || identity.length === 5;
  }

  private matchesSelectedMana(card: MtgCard, mana: ManaCode): boolean {
    const identity = card.colorIdentity ?? [];
    if (mana === 'C') {
      return identity.length === 0;
    }

    return identity.includes(mana) || identity.length === 0 || identity.length === 5;
  }
}
