# TODO

## Interventi manuali richiesti

### 1. Configurare le variabili ambiente
- File: `/tmp/workspace/astrolabz/STR-world/.env.example`
- Motivo: il progetto dipende da credenziali, URL esterni e configurazioni runtime che non possono essere valorizzate automaticamente.
- Azione manuale:
  - creare `.env` a partire da `.env.example`
  - inserire i valori reali per `DATABASE_URL`, `INGESTION_CRON_SECRET`, `ANALYTICS_PROVIDER_API_URL`, `ANALYTICS_PROVIDER_API_KEY`, `AIRBNB_SCRAPER_API_URL`, `AIRBNB_SCRAPER_API_KEY`, `BOOKING_SCRAPER_API_URL`, `BOOKING_SCRAPER_API_KEY`
  - decidere se mantenere o sostituire `OPEN_DATA_CITY_DATASET_URL`
  - valorizzare `ICAL_SYNC_FEEDS` con feed iCal reali oppure lasciarlo vuoto

### 2. Provisioning del database PostgreSQL/PostGIS
- File coinvolti:
  - `/tmp/workspace/astrolabz/STR-world/README.md`
  - `/tmp/workspace/astrolabz/STR-world/src/lib/db/client.ts`
  - `/tmp/workspace/astrolabz/STR-world/drizzle.config.ts`
  - `/tmp/workspace/astrolabz/STR-world/drizzle/0000_initial.sql`
  - `/tmp/workspace/astrolabz/STR-world/drizzle/0001_ical_availability.sql`
- Motivo: senza database reale l’app usa fallback/demo oppure fallisce sulle parti server che richiedono dati persistenti.
- Azione manuale:
  - creare un database PostgreSQL
  - abilitare l’estensione PostGIS
  - impostare `DATABASE_URL`
  - eseguire `npm run db:migrate`

### 3. Collegare provider esterni autorizzati
- File coinvolti:
  - `/tmp/workspace/astrolabz/STR-world/src/lib/ingestion/connectors/analytics-provider-connector.ts`
  - `/tmp/workspace/astrolabz/STR-world/src/lib/ingestion/connectors/airbnb-like-connector.ts`
  - `/tmp/workspace/astrolabz/STR-world/src/lib/ingestion/connectors/booking-like-connector.ts`
  - `/tmp/workspace/astrolabz/STR-world/src/lib/ingestion/connectors/external-listings-adapter.ts`
- Motivo: il repository contiene adapter configurabili, ma gli endpoint reali e le relative credenziali devono essere forniti da te.
- Azione manuale:
  - predisporre i microservizi/provider reali per Analytics, Airbnb e Booking
  - inserire URL e chiavi API reali nelle variabili ambiente
  - verificare che il formato di autenticazione richiesto dai provider coincida con l’header `Authorization` usato nel codice

### 4. Sostituire il comportamento mock del provider analytics
- File: `/tmp/workspace/astrolabz/STR-world/src/lib/ingestion/connectors/analytics-provider-connector.ts`
- Motivo: se il provider analytics non è configurato, il connettore restituisce un listing mock; inoltre nel file è presente un TODO esplicito sulla chiave API reale.
- Azione manuale:
  - confermare il provider autorizzato da usare
  - verificare il formato esatto dell'header `Authorization` richiesto dal provider reale

### 5. Configurare la sincronizzazione iCal
- File coinvolti:
  - `/tmp/workspace/astrolabz/STR-world/src/lib/availability/config.ts`
  - `/tmp/workspace/astrolabz/STR-world/README.md`
- Motivo: i feed remoti e gli identificativi listing da sincronizzare dipendono dal tuo inventario reale.
- Azione manuale:
  - compilare `ICAL_SYNC_FEEDS` con `listingPlatform`, `sourceListingId`, `feedProvider`, `url` e opzionale `calendarName`

### 6. Configurare il trigger schedulato dell’ingestion
- File coinvolti:
  - `/tmp/workspace/astrolabz/STR-world/app/api/cron/ingest/route.ts`
  - `/tmp/workspace/astrolabz/STR-world/README.md`
- Motivo: il job giornaliero non parte da solo; serve un chiamante esterno autenticato.
- Azione manuale:
  - scegliere dove schedulare le chiamate all’endpoint `/api/cron/ingest`
  - configurare l’header `Authorization` con il valore di `INGESTION_CRON_SECRET`

### 7. Abilitare il deploy su GitHub Pages
- File coinvolti:
  - `/tmp/workspace/astrolabz/STR-world/.github/workflows/deploy-pages.yml`
  - `/tmp/workspace/astrolabz/STR-world/README.md`
- Motivo: il workflow esiste già, ma richiede configurazione lato repository GitHub.
- Azione manuale:
  - aprire `Settings > Pages`
  - selezionare `GitHub Actions` come source
  - lanciare o verificare il workflow dopo il push su `main`

## Nota
- Ho verificato che `npm run lint` e `npm run build` passano correttamente dopo `npm ci`.
