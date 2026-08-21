import { useState, useEffect, type ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  BarChart3, 
  Users, 
  Eye, 
  TrendingUp, 
  Globe, 
  Smartphone, 
  Monitor,
  Tablet,
  ExternalLink,
  MapPin,
  Activity,
  Compass,
  Languages,
  Laptop,
} from "lucide-react";
import {
  getActiveVisitors,
  getDailyStats,
  getTopPages,
  getTopReferrers,
  getDeviceStats,
  getLocationStats,
  getTotalVisits,
  getUniqueVisitors,
  getBrowserStats,
  getOsStats,
  getLanguageStats,
} from "@/services/analyticsService";

interface DailyStat {
  date: string;
  total_visits: number;
  unique_visitors: number;
  desktop_visits: number;
  mobile_visits: number;
  tablet_visits: number;
}

interface PageStat {
  url: string;
  title: string;
  count: number;
}

interface ReferrerStat {
  referrer_domain: string;
  visit_count: number;
  last_visit: string;
}

interface LocationStat {
  country: string;
  city: string;
  region: string;
  count: number;
}

interface BreakdownStat {
  name: string;
  count: number;
}

function countryName(code: string) {
  if (!code) return "Bilinmiyor";
  try {
    return new Intl.DisplayNames(["tr"], { type: "region" }).of(code.toUpperCase()) || code;
  } catch {
    return code;
  }
}

function languageName(code: string) {
  if (!code) return "Bilinmiyor";
  try {
    return new Intl.DisplayNames(["tr"], { type: "language" }).of(code.split("-")[0]) || code;
  } catch {
    return code;
  }
}

function BreakdownCard({
  title,
  description,
  icon,
  data,
  loading,
  label = (value) => value,
  className = "",
}: {
  title: string;
  description: string;
  icon: ReactNode;
  data: BreakdownStat[];
  loading: boolean;
  label?: (value: string) => string;
  className?: string;
}) {
  const breakdownTotal = data.reduce((sum, item) => sum + item.count, 0);
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">{icon}{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Yükleniyor...</div>
        ) : data.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">Yeni ziyaretlerle veri oluşacaktır</div>
        ) : (
          <div className="space-y-3">
            {data.map((item) => {
              const percentage = breakdownTotal > 0 ? Math.round((item.count / breakdownTotal) * 100) : 0;
              return (
                <div key={item.name} className="space-y-2 p-3 rounded-lg border">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium truncate">{label(item.name)}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">%{percentage}</span>
                      <Badge variant="secondary">{item.count}</Badge>
                    </div>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-1.5">
                    <div className="bg-primary h-1.5 rounded-full" style={{ width: `${percentage}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function AnalyticsModule() {
  const [activeVisitors, setActiveVisitors] = useState(0);
  const [totalVisits, setTotalVisits] = useState(0);
  const [uniqueVisitors, setUniqueVisitors] = useState(0);
  const [dailyStats, setDailyStats] = useState<DailyStat[]>([]);
  const [topPages, setTopPages] = useState<PageStat[]>([]);
  const [topReferrers, setTopReferrers] = useState<ReferrerStat[]>([]);
  const [deviceStats, setDeviceStats] = useState({ desktop: 0, mobile: 0, tablet: 0 });
  const [locationStats, setLocationStats] = useState<LocationStat[]>([]);
  const [browserStats, setBrowserStats] = useState<BreakdownStat[]>([]);
  const [osStats, setOsStats] = useState<BreakdownStat[]>([]);
  const [languageStats, setLanguageStats] = useState<BreakdownStat[]>([]);
  const [timeRange, setTimeRange] = useState<"7" | "30" | "90">("30");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
    
    // Refresh active visitors every 30 seconds
    const interval = setInterval(() => {
      getActiveVisitors().then(setActiveVisitors);
    }, 30000);

    return () => clearInterval(interval);
  }, [timeRange]);

  async function loadAnalytics() {
    setLoading(true);
    try {
      const days = parseInt(timeRange);
      const endDate = new Date().toISOString().split("T")[0];
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

      const [
        activeCount,
        totalCount,
        uniqueCount,
        dailyData,
        pagesData,
        referrersData,
        devicesData,
        locationsData,
        browsersData,
        operatingSystemsData,
        languagesData,
      ] = await Promise.all([
        getActiveVisitors(),
        getTotalVisits(days),
        getUniqueVisitors(days),
        getDailyStats(startDate, endDate),
        getTopPages(10, days),
        getTopReferrers(10),
        getDeviceStats(days),
        getLocationStats(days, 10),
        getBrowserStats(days),
        getOsStats(days),
        getLanguageStats(days),
      ]);

      setActiveVisitors(activeCount);
      setTotalVisits(totalCount);
      setUniqueVisitors(uniqueCount);
      setDailyStats(dailyData as unknown as DailyStat[]);
      setTopPages(pagesData as unknown as PageStat[]);
      setTopReferrers(referrersData as unknown as ReferrerStat[]);
      setDeviceStats(devicesData);
      setLocationStats(locationsData as unknown as LocationStat[]);
      setBrowserStats(browsersData);
      setOsStats(operatingSystemsData);
      setLanguageStats(languagesData);
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setLoading(false);
    }
  }

  const totalDeviceVisits = deviceStats.desktop + deviceStats.mobile + deviceStats.tablet;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Web Analitik</h2>
          <p className="text-muted-foreground mt-1">
            Web sitenizin ziyaretçi istatistiklerini görüntüleyin
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-green-500 animate-pulse" />
          <span className="text-sm text-muted-foreground">
            Canlı İzleme Aktif
          </span>
        </div>
      </div>

      {/* Time Range Selector */}
      <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as "7" | "30" | "90")} className="w-full">
        <TabsList>
          <TabsTrigger value="7">Son 7 Gün</TabsTrigger>
          <TabsTrigger value="30">Son 30 Gün</TabsTrigger>
          <TabsTrigger value="90">Son 90 Gün</TabsTrigger>
        </TabsList>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aktif Ziyaretçi</CardTitle>
              <Activity className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeVisitors}</div>
              <p className="text-xs text-muted-foreground">Son 5 dakika</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Ziyaret</CardTitle>
              <Eye className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalVisits.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Son {timeRange} gün</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Benzersiz Ziyaretçi</CardTitle>
              <Users className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{uniqueVisitors.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Son {timeRange} gün</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ortalama / Gün</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(totalVisits / parseInt(timeRange)).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">Günlük ortalama</p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Statistics */}
        <TabsContent value={timeRange} className="space-y-6 mt-6">
          <div>
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <Globe className="h-5 w-5" /> Ziyaretçi Profili ve Demografi
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Ülke, şehir, cihaz ve teknik kullanım dağılımları; IP adresi saklanmaz.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Pages */}
            <Card className="order-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  En Çok Ziyaret Edilen Sayfalar
                </CardTitle>
                <CardDescription>Son {timeRange} gündeki popüler sayfalar</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">Yükleniyor...</div>
                ) : topPages.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">Henüz veri yok</div>
                ) : (
                  <div className="space-y-3">
                    {topPages.map((page, index) => (
                      <div key={index} className="flex items-start justify-between gap-4 p-3 rounded-lg border">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{page.title || "Başlık yok"}</p>
                          <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                            <ExternalLink className="h-3 w-3" />
                            {page.url}
                          </p>
                        </div>
                        <Badge variant="secondary">{page.count}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Referrers */}
            <Card className="order-7">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Trafik Kaynakları
                </CardTitle>
                <CardDescription>Ziyaretçiler nereden geliyor</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">Yükleniyor...</div>
                ) : topReferrers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Henüz dış kaynak verisi yok
                  </div>
                ) : (
                  <div className="space-y-3">
                    {topReferrers.map((referrer, index) => (
                      <div key={index} className="flex items-center justify-between gap-4 p-3 rounded-lg border">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {referrer.referrer_domain || "Doğrudan Giriş"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Son ziyaret: {new Date(referrer.last_visit).toLocaleDateString("tr-TR")}
                          </p>
                        </div>
                        <Badge variant="secondary">{referrer.visit_count}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Device Statistics */}
            <Card className="order-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  Cihaz Dağılımı
                </CardTitle>
                <CardDescription>Ziyaretçiler hangi cihazları kullanıyor</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">Yükleniyor...</div>
                ) : totalDeviceVisits === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">Henüz veri yok</div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Monitor className="h-4 w-4 text-blue-500" />
                          <span className="text-sm font-medium">Masaüstü</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            {Math.round((deviceStats.desktop / totalDeviceVisits) * 100)}%
                          </span>
                          <Badge variant="secondary">{deviceStats.desktop}</Badge>
                        </div>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all"
                          style={{ width: `${(deviceStats.desktop / totalDeviceVisits) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Smartphone className="h-4 w-4 text-green-500" />
                          <span className="text-sm font-medium">Mobil</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            {Math.round((deviceStats.mobile / totalDeviceVisits) * 100)}%
                          </span>
                          <Badge variant="secondary">{deviceStats.mobile}</Badge>
                        </div>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full transition-all"
                          style={{ width: `${(deviceStats.mobile / totalDeviceVisits) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Tablet className="h-4 w-4 text-purple-500" />
                          <span className="text-sm font-medium">Tablet</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            {Math.round((deviceStats.tablet / totalDeviceVisits) * 100)}%
                          </span>
                          <Badge variant="secondary">{deviceStats.tablet}</Badge>
                        </div>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div
                          className="bg-purple-500 h-2 rounded-full transition-all"
                          style={{ width: `${(deviceStats.tablet / totalDeviceVisits) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Location Statistics */}
            <Card className="order-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Coğrafi Konum
                </CardTitle>
                <CardDescription>Ziyaretçiler nereden geliyor</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">Yükleniyor...</div>
                ) : locationStats.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Konum bilgisi yeni ziyaretlerle birlikte oluşacaktır
                  </div>
                ) : (
                  <div className="space-y-3">
                    {locationStats.map((location, index) => (
                      <div key={index} className="flex items-center justify-between gap-4 p-3 rounded-lg border">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{countryName(location.country)}</p>
                          <p className="text-xs text-muted-foreground">
                            {[location.city, location.region].filter(Boolean).join(" / ") || "Şehir bilinmiyor"}
                          </p>
                        </div>
                        <Badge variant="secondary">{location.count}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <BreakdownCard
              title="Tarayıcılar"
              description="Kullanılan internet tarayıcıları"
              icon={<Compass className="h-5 w-5" />}
              data={browserStats}
              loading={loading}
              className="order-3"
            />

            <BreakdownCard
              title="İşletim Sistemleri"
              description="Ziyaretçilerin kullandığı sistemler"
              icon={<Laptop className="h-5 w-5" />}
              data={osStats}
              loading={loading}
              className="order-4"
            />

            <BreakdownCard
              title="Dil Dağılımı"
              description="Tarayıcı dil tercihlerine göre"
              icon={<Languages className="h-5 w-5" />}
              data={languageStats}
              loading={loading}
              label={languageName}
              className="order-5"
            />
          </div>

          {/* Daily Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Günlük Ziyaret Trendi
              </CardTitle>
              <CardDescription>Son {timeRange} günün detaylı görünümü</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Yükleniyor...</div>
              ) : dailyStats.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">Henüz günlük veri yok</div>
              ) : (
                <div className="space-y-2">
                  {dailyStats.slice(-14).map((stat) => {
                    const maxVisits = Math.max(...dailyStats.map(s => s.total_visits));
                    const percentage = maxVisits > 0 ? (stat.total_visits / maxVisits) * 100 : 0;
                    
                    return (
                      <div key={stat.date} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            {new Date(stat.date).toLocaleDateString("tr-TR", { 
                              day: "numeric", 
                              month: "short" 
                            })}
                          </span>
                          <div className="flex items-center gap-4">
                            <span className="text-xs text-muted-foreground">
                              {stat.unique_visitors} benzersiz
                            </span>
                            <span className="font-medium">{stat.total_visits} ziyaret</span>
                          </div>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
