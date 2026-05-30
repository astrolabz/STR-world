# STR World - Global Short-Term Rental 3D Map

STR World è una webapp per aggregare annunci di affitti brevi (case, appartamenti, stanze) da più sorgenti e visualizzarli su un globo 3D interattivo in stile Google Earth.

Ogni annuncio mantiene i dati principali più fedeli possibile alla sorgente (prezzo/notte, rating, dettagli essenziali) e include sempre il link diretto alla pagina originale del provider.

## Stack tecnico

- **Frontend/Backend**: Next.js (App Router), React, TypeScript
- **UI/Styling**: Tailwind CSS + componenti stile shadcn/ui
- **Mappa 3D**: CesiumJS (caricato client-side)
- **Database**: PostgreSQL + PostGIS
- **ORM/query layer**: Drizzle ORM + query SQL geospaziali
- **Ingestion**: Node.js con `fetch`, `axios`, `cheerio`, parsing CSV/JSON, `node-ical`, `ical-generator`

## Setup progetto

### Prerequisiti

- Node.js 20+
- npm 10+
- PostgreSQL 14+ con estensione PostGIS

### 1) Installazione dipendenze

```bash
npm install
```

### 2) Configurazione variabili ambiente

Copia il file di esempio:

```bash
cp .env.example .env
```

Variabili principali:

- `DATABASE_URL`: connessione PostgreSQL
- `INGESTION_CRON_SECRET`: token segreto per endpoint cron
- `OPEN_DATA_CITY_DATASET_URL`: URL dataset open-data STR/licenze
- `ANALYTICS_PROVIDER_API_URL`: endpoint provider analytics autorizzato
- `ANALYTICS_PROVIDER_API_KEY`: chiave API provider analytics
- `AIRBNB_SCRAPER_API_URL`: endpoint del tuo adapter/microservizio Airbnb
- `AIRBNB_SCRAPER_API_KEY`: chiave opzionale per il microservizio Airbnb
- `BOOKING_SCRAPER_API_URL`: endpoint del tuo adapter/microservizio Booking
- `BOOKING_SCRAPER_API_KEY`: chiave opzionale per il microservizio Booking
- `ICAL_SYNC_FEEDS`: array JSON con feed iCal da sincronizzare nel formato `[{ "listingPlatform": "Airbnb", "sourceListingId": "123", "feedProvider": "Airbnb iCal", "url": "..." }]`

### 3) Creazione DB e PostGIS

Esempio SQL:

```sql
CREATE DATABASE str_world;
\c str_world;
CREATE EXTENSION IF NOT EXISTS postgis;
```

### 4) Migrazione schema

```bash
npm run db:migrate
```

## Avvio in sviluppo

```bash
npm run dev
```

Apri `http://localhost:3000`.

## Deploy automatico su GitHub Pages

Il repository include una GitHub Action (`.github/workflows/deploy-pages.yml`) che pubblica automaticamente su GitHub Pages a ogni push su `main`.

Per abilitarlo:

1. Vai in **Settings > Pages** del repository.
2. In **Build and deployment**, seleziona **Source: GitHub Actions**.
3. Esegui un push su `main` (oppure lancia manualmente il workflow da tab Actions).

L’app verrà esportata in modalità statica e pubblicata su:
- `https://<owner>.github.io/<repo>/` per repository project pages (es. `https://astrolabz.github.io/STR-world/`)
- `https://<owner>.github.io/` per repository `<owner>.github.io`

## Ingestion job

### Esecuzione manuale via API

```bash
curl -X POST http://localhost:3000/api/cron/ingest \
  -H "Authorization: <INGESTION_CRON_SECRET>"
```

### Scheduling giornaliero

- **VPS/Linux cron**: pianifica una chiamata HTTP giornaliera all’endpoint.
- **Hosting con cron integrato (es. Vercel Cron)**: configura un job quotidiano verso `/api/cron/ingest` includendo l’header `Authorization`.

La stessa esecuzione sincronizza anche gli eventuali feed iCal configurati in `ICAL_SYNC_FEEDS`.

## Endpoint backend

- `GET /api/listings` con BBOX obbligatorio e filtri opzionali
- `GET /api/ingestion-jobs` log base ingestione
- `POST /api/cron/ingest` endpoint protetto per eseguire ingestion + sync iCal
- `GET /api/calendar?platform=<platform>&sourceListingId=<id>` esporta un feed `.ics` con i blocchi sincronizzati

Se `DATABASE_URL` non è configurata (es. deploy statico su GitHub Pages), `GET /api/listings` restituisce un dataset demo statico per mantenere l’interfaccia funzionante.

## Scraping e sincronizzazione calendari

### Scraping listings, prezzi e recensioni

La repo ora include adapter configurabili per collegare microservizi esterni:

- `AirbnbLikeConnector` legge dati da `AIRBNB_SCRAPER_API_URL`
- `BookingLikeConnector` legge dati da `BOOKING_SCRAPER_API_URL`

Gli endpoint devono restituire JSON nel formato:

```json
{
  "data": [
    {
      "id": "listing-id",
      "title": "Nome annuncio",
      "nightlyPrice": 120,
      "latitude": 45.46,
      "longitude": 9.19,
      "city": "Milano",
      "countryCode": "IT",
      "originalUrl": "https://..."
    }
  ]
}
```

Dalla ricerca fatta, l’opzione open-source più solida per Airbnb è `pyairbnb`, mentre per Booking non esiste oggi un package Node.js davvero mantenuto: conviene quindi usare un microservizio separato o un provider esterno che tu controlli.

### Sync iCal tra Airbnb, Booking e STR World

Per la sincronizzazione disponibilità, la via consigliata e inclusa nel progetto è iCal:

- import feed remoti con `node-ical`
- salva i blocchi in `listing_availability_blocks`
- riesporta i blocchi da STR World tramite `GET /api/calendar`

Questo copre il caso d’uso di sincronizzazione calendario senza dipendere dalle API partner o da channel manager a pagamento.

## Note legali importanti

I connettori per piattaforme commerciali (Airbnb, Booking, VRBO) sono forniti come **adapter configurabili verso servizi esterni gestiti da chi deploya il progetto**.

Per integrarli realmente è necessario:

- rispettare i Termini di Servizio delle piattaforme,
- usare API ufficiali e/o provider autorizzati,
- configurare credenziali e endpoint legittimi da parte di chi deploya il codice,
- accettare che gli scraper community richiedano manutenzione continua contro anti-bot e cambi di markup.

Questo progetto non include scraping hardcoded delle pagine HTML di piattaforme commerciali senza autorizzazione né bypass anti-bot incorporati.
