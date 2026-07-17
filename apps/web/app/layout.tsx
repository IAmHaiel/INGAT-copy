import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import { WalletProvider } from "@/context/WalletContext";
import { Toaster } from "sonner";
import Footer from "@/components/ui/layout/Footer";
 
const manrope = Manrope({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800"],
  variable: "--font-manrope",
  display: "swap",
});
 
export const metadata: Metadata = {
  title: "INGAT - Protect Your Remittances",
  description: "Allocate remittances into purpose-bound smart contract accounts on Stellar",
};
 
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${manrope.variable} h-full`}>
      <body className="font-sans flex flex-col min-h-screen bg-background-warm text-on-surface antialiased">
        <WalletProvider>
          <main className="flex-1">
            {children}
          </main>
          <Footer />
          <Toaster 
            position="top-right"
            richColors
            closeButton
            toastOptions={{
              classNames: {
                toast: "font-sans shadow-xl rounded-xl border border-outline-variant !p-4 !pb-7 !pr-14 relative overflow-hidden",
                title: "text-sm font-bold text-on-surface",
                description: "text-xs font-medium text-on-surface-variant",
                actionButton: "bg-[#005145] hover:bg-[#0f6b5c] text-white font-bold rounded-lg px-3 py-1.5 transition-colors cursor-pointer border-0",
                success: "bg-[#FAF7F2] text-[#005145] border-[#005145]/20",
                error: "bg-[#faf2f2] text-red-800 border-red-200",
                closeButton: "!static !ml-auto !mt-0 !bg-transparent !border-0 !text-on-surface-variant hover:!text-on-surface !cursor-pointer !opacity-60 hover:!opacity-100 !transition-opacity"
              }
            }}
          />
        </WalletProvider>
      </body>
    </html>
  );
}
