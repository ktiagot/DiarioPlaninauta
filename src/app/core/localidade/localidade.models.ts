export interface LocalidadeSugestao {
  displayName: string; // ex: "São Paulo, São Paulo, Brasil"
  cidade: string;      // ex: "São Paulo"
  estado: string;      // ex: "São Paulo" ou "SP"
  pais: string;        // ex: "Brasil"
  lat: number;
  lng: number;
}
