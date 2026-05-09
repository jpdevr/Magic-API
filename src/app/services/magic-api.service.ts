import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { CardResponse, MtgCard, MtgSet, SetResponse } from '../models/mtg.models';

@Injectable({ providedIn: 'root' })
export class MagicApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.mtgApiBaseUrl;

  searchCards(filters: Record<string, string | number | boolean | undefined>): Observable<MtgCard[]> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params = params.set(key, String(value));
      }
    });

    return this.http.get<CardResponse>(`${this.baseUrl}/cards`, { params }).pipe(
      map((response) => response.cards ?? [])
    );
  }

  searchCardsWithHeaders(filters: Record<string, string | number | boolean | undefined>): Observable<HttpResponse<CardResponse>> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params = params.set(key, String(value));
      }
    });

    return this.http.get<CardResponse>(`${this.baseUrl}/cards`, { params, observe: 'response' });
  }

  findCardVersions(name: string): Observable<MtgCard[]> {
    return this.searchCards({ name: `"${name}"`, pageSize: 100 });
  }

  getSets(): Observable<MtgSet[]> {
    return this.http.get<SetResponse>(`${this.baseUrl}/sets`).pipe(
      map((response) => (response.sets ?? []).sort((a, b) => (b.releaseDate ?? '').localeCompare(a.releaseDate ?? '')))
    );
  }

  getTypes(): Observable<string[]> {
    return this.http.get<{ types: string[] }>(`${this.baseUrl}/types`).pipe(map((response) => response.types ?? []));
  }

  getFormats(): Observable<string[]> {
    return this.http.get<{ formats: string[] }>(`${this.baseUrl}/formats`).pipe(map((response) => response.formats ?? []));
  }
}
