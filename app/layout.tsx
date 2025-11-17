import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import SessionProvider from "@/components/providers/SessionProvider";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { CartProvider } from "@/contexts/CartContext";
import { WishlistProvider } from "@/contexts/WishlistContext";
import { LastViewedProvider } from "@/contexts/LastViewedContext";
import { BuyAgainProvider } from "@/contexts/BuyAgainContext";
import { CheckoutProvider } from "@/contexts/CheckoutContext";
import { OrderProvider } from "@/contexts/OrderContext";
import { FavoriteEditModeProvider } from "@/contexts/FavoriteEditModeContext";
import { SaveActionProvider } from "@/contexts/SaveActionContext";
import { APP_NAME } from "@/lib/constants";
import { getStoreSettingsServer, getSEOSettingsServer } from "@/lib/settings";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

// Generate metadata dynamically from settings
export async function generateMetadata(): Promise<Metadata> {
  const storeSettings = await getStoreSettingsServer();
  const seoSettings = await getSEOSettingsServer();
  
  const storeName = storeSettings.storeName || APP_NAME;
  const metaTitle = seoSettings.metaTitle || storeName;
  const metaDescription = seoSettings.metaDescription || storeSettings.storeDescription || 
    "Modern e-commerce platform built with Next.js 14";

  return {
    title: {
      default: metaTitle,
      template: `%s | ${storeName}`,
    },
    description: metaDescription,
  };
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <SessionProvider>
          <NotificationProvider>
            <CartProvider>
              <WishlistProvider>
                <LastViewedProvider>
                  <BuyAgainProvider>
                    <CheckoutProvider>
                      <OrderProvider>
                        <FavoriteEditModeProvider>
                          <SaveActionProvider>{children}</SaveActionProvider>
                        </FavoriteEditModeProvider>
                      </OrderProvider>
                    </CheckoutProvider>
                  </BuyAgainProvider>
                </LastViewedProvider>
              </WishlistProvider>
            </CartProvider>
          </NotificationProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
