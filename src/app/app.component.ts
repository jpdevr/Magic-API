import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { MANA_OPTIONS, RULE_BOOK, TYPE_SYMBOLS } from './data/magic-content';
import { MagicApiService } from './services/magic-api.service';
import { LibraryService } from './services/library.service';
import { ManaCode, MtgCard, MtgSet } from './models/mtg.models';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  private readonly api = inject(MagicApiService);
  readonly library = inject(LibraryService);

  readonly manaOptions = MANA_OPTIONS;
  readonly typeSymbols = TYPE_SYMBOLS;
  readonly ruleBook = RULE_BOOK;

  readonly selectedMana = signal<ManaCode | null>(null);
  readonly selectedType = signal<string | null>(null);
  readonly cards = signal<MtgCard[]>([]);
  readonly sets = signal<MtgSet[]>([]);
  readonly selectedCard = signal<MtgCard | null>(null);
  readonly versions = signal<MtgCard[]>([]);
  readonly activeDeckId = signal('deck-60');
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

  constructor() {
    this.loadSets();
  }

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
    this.message.set('');
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
      error: () => this.message.set('Nao foi possivel consultar a API agora. Tente novamente em instantes.')
    });
  }

  openCard(card: MtgCard): void {
    this.selectedCard.set(card);
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
    const result = this.library.addToDeck(this.activeDeckId(), card);
    this.message.set(result ?? `${card.name} entrou no ${this.activeDeck()?.name}.`);
  }

  selectDeck(deckId: string): void {
    this.activeDeckId.set(deckId);
  }

  removeDeckCard(cardId: string): void {
    this.library.removeFromDeck(this.activeDeckId(), cardId);
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

  private loadSets(): void {
    this.api.getSets().subscribe({
      next: (sets) => this.sets.set(sets.slice(0, 12)),
      error: () => this.sets.set([])
    });
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
