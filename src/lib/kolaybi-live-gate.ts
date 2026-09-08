const LIVE_SYNC_ENABLED_VALUE = "true";

export function isKolayBiLiveEnvironment(baseUrl: string) {
  return !baseUrl.toLocaleLowerCase("tr-TR").includes("sandbox");
}

export function isKolayBiSyncEnabled(baseUrl: string) {
  if (!isKolayBiLiveEnvironment(baseUrl)) return true;
  return process.env.KOLAYBI_LIVE_SYNC_ENABLED === LIVE_SYNC_ENABLED_VALUE;
}

export function assertKolayBiSyncEnabled(baseUrl: string) {
  if (!isKolayBiSyncEnabled(baseUrl)) {
    throw new Error(
      "KolayBi canlı senkronizasyonu güvenli geçiş için kapalıdır. Bağlantı doğrulandıktan sonra KOLAYBI_LIVE_SYNC_ENABLED=true olarak etkinleştirilmelidir.",
    );
  }
}
