declare global {
  interface Window {
    Cesium?: unknown;
    CESIUM_BASE_URL?: string;
    __NEXT_DATA__?: {
      assetPrefix?: string;
    };
  }
}

export {};
