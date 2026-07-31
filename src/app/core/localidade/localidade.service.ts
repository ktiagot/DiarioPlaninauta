import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { LocalidadeSugestao } from './localidade.models';

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
  address: {
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    state?: string;
    country?: string;
  };
}

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

@Injectable({ providedIn: 'root' })
export class LocalidadeService {
  constructor(private readonly http: HttpClient) {}

  /**
   * Busca cidades no mundo todo via OpenStreetMap Nominatim.
   * Retorna até 5 sugestões formatadas.
   */
  buscar(termo: string): Observable<LocalidadeSugestao[]> {
    const params = {
      q: termo,
      format: 'json',
      addressdetails: '1',
      limit: '5',
      'accept-language': 'pt-BR',
      featuretype: 'city',
    };

    return this.http
      .get<NominatimResult[]>(NOMINATIM_URL, { params })
      .pipe(
        map((results) =>
          results
            .filter((r) => r.address?.city || r.address?.town || r.address?.village || r.address?.municipality)
            .map((r) => {
              const cidade =
                r.address.city || r.address.town || r.address.village || r.address.municipality || '';
              const estado = r.address.state || '';
              const pais = r.address.country || '';

              return {
                displayName: [cidade, estado, pais].filter(Boolean).join(', '),
                cidade,
                estado,
                pais,
                lat: parseFloat(r.lat),
                lng: parseFloat(r.lon),
              };
            }),
        ),
      );
  }
}
