/**
 * Settings Helper
 * Helper functions untuk mengambil dan menggunakan settings
 */

interface StoreSettings {
  storeName?: string;
  storeDescription?: string;
  contactEmail?: string;
  contactPhone?: string;
  storeAddress?: string;
  currency?: string;
  metaTitle?: string;
  metaDescription?: string;
  googleAnalyticsId?: string;
}

let cachedSettings: StoreSettings | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get store settings from API (Client-side)
 * Uses caching to reduce API calls
 */
export async function getStoreSettings(): Promise<StoreSettings> {
  // Return cached settings if still valid
  if (typeof window !== 'undefined' && cachedSettings && Date.now() - cacheTimestamp < CACHE_DURATION) {
    return cachedSettings;
  }

  try {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');
    const response = await fetch(`${baseUrl}/api/settings?category=general`, {
      cache: 'no-store', // Always fetch fresh data
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch settings');
    }

    const data = await response.json();
    if (data.success) {
      cachedSettings = data.data;
      cacheTimestamp = Date.now();
      return data.data;
    }
  } catch (error) {
    console.error('Error fetching store settings:', error);
  }

  // Return empty object if fetch fails
  return {};
}

/**
 * Get store settings on server side
 */
export async function getStoreSettingsServer(): Promise<StoreSettings> {
  try {
    const { prisma } = await import('@/lib/prisma');
    
    const settings = await prisma.setting.findMany({
      where: {
        category: 'general',
      },
      select: {
        key: true,
        value: true,
      },
    });

    const settingsMap: Record<string, any> = {};
    settings.forEach((setting) => {
      try {
        settingsMap[setting.key] = JSON.parse(setting.value);
      } catch {
        settingsMap[setting.key] = setting.value;
      }
    });

    return settingsMap as StoreSettings;
  } catch (error) {
    console.error('Error fetching store settings on server:', error);
    return {};
  }
}

/**
 * Get SEO settings on server side
 */
export async function getSEOSettingsServer(): Promise<{
  metaTitle?: string;
  metaDescription?: string;
  googleAnalyticsId?: string;
}> {
  try {
    const { prisma } = await import('@/lib/prisma');
    
    const settings = await prisma.setting.findMany({
      where: {
        category: 'seo',
      },
      select: {
        key: true,
        value: true,
      },
    });

    const settingsMap: Record<string, any> = {};
    settings.forEach((setting) => {
      try {
        settingsMap[setting.key] = JSON.parse(setting.value);
      } catch {
        settingsMap[setting.key] = setting.value;
      }
    });

    return {
      metaTitle: settingsMap.metaTitle,
      metaDescription: settingsMap.metaDescription,
      googleAnalyticsId: settingsMap.googleAnalyticsId,
    };
  } catch (error) {
    console.error('Error fetching SEO settings on server:', error);
    return {};
  }
}

/**
 * Clear settings cache
 * Call this after updating settings in admin
 */
export function clearSettingsCache() {
  cachedSettings = null;
  cacheTimestamp = 0;
}

