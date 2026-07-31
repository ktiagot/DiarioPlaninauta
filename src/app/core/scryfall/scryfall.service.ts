import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, of, catchError } from 'rxjs';

export interface ScryfallCard {
  name: string;
  image_uris?: { art_crop?: string };
  card_faces?: Array<{ image_uris?: { art_crop?: string } }>;
}

interface ScryfallSearchResponse {
  data: ScryfallCard[];
}

const SCRYFALL_URL = 'https://api.scryfall.com/cards/search';

@Injectable({ providedIn: 'root' })
export class ScryfallService {
  constructor(private readonly http: HttpClient) {}

  /**
   * Busca criaturas lendárias pelo nome.
   * Retorna até 8 resultados com art_crop.
   */
  buscarLendarias(termo: string): Observable<{ name: string; artCropUrl: string }[]> {
    if (!termo || termo.length < 2) return of([]);

    const query = `${termo} type:legendary type:creature`;
    const params = { q: query, unique: 'art' };

    return this.http.get<ScryfallSearchResponse>(SCRYFALL_URL, { params }).pipe(
      map((res) =>
        (res.data ?? [])
          .slice(0, 8)
          .map((card) => ({
            name: card.name,
            artCropUrl:
              card.image_uris?.art_crop ??
              card.card_faces?.[0]?.image_uris?.art_crop ??
              '',
          }))
          .filter((c) => !!c.artCropUrl),
      ),
      catchError(() => of([])),
    );
  }
}
