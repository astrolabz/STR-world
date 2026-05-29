import { AirbnbLikeConnector } from "@/src/lib/ingestion/connectors/airbnb-like-connector";
import { AnalyticsProviderConnector } from "@/src/lib/ingestion/connectors/analytics-provider-connector";
import { BookingLikeConnector } from "@/src/lib/ingestion/connectors/booking-like-connector";
import { OpenDataCityConnector } from "@/src/lib/ingestion/connectors/open-data-city-connector";

export function getDefaultConnectors() {
  return [
    new OpenDataCityConnector(),
    new AnalyticsProviderConnector(),
    new AirbnbLikeConnector(),
    new BookingLikeConnector(),
  ];
}
