import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import SessionProvider from "@/components/providers/SessionProvider";
import ToastProvider from "@/components/providers/ToastProvider";
import { CartProvider } from "@/contexts/CartContext";
import { WishlistProvider } from "@/contexts/WishlistContext";
import { LastViewedProvider } from "@/contexts/LastViewedContext";
import { BuyAgainProvider } from "@/contexts/BuyAgainContext";
import { CheckoutProvider } from "@/contexts/CheckoutContext";
import { OrderProvider } from "@/contexts/OrderContext";
import { FavoriteEditModeProvider } from "@/contexts/FavoriteEditModeContext";
import { SaveActionProvider } from "@/contexts/SaveActionContext";
import { APP_NAME } from "@/lib/constants";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description: "Modern e-commerce platform built with Next.js 14",
};

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
          <CartProvider>
            <WishlistProvider>
              <LastViewedProvider>
                <BuyAgainProvider>
                  <CheckoutProvider>
                    <OrderProvider>
                      <FavoriteEditModeProvider>
                        <SaveActionProvider>
                          {children}
                          <ToastProvider />
                        </SaveActionProvider>
                      </FavoriteEditModeProvider>
                    </OrderProvider>
                  </CheckoutProvider>
                </BuyAgainProvider>
              </LastViewedProvider>
            </WishlistProvider>
          </CartProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
