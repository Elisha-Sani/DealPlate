import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const plusJakartaSans = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-display" });

export const metadata: Metadata = {
    title: "DealPlate — Discounted Student Meals in Nairobi",
    description:
        "Access quality, discounted food from vendors around Nairobi. DealPlate connects university students with surplus meals at up to 70% off.",
    keywords: [
        "student deals",
        "food",
        "Nairobi",
        "university",
        "discounted meals",
        "Kenya",
    ],
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning className={`${inter.variable} ${plusJakartaSans.variable}`}>
            <head>
                <meta charSet="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
            </head>
            <body suppressHydrationWarning className="bg-gray-50 text-[#111827] antialiased">
                {children}
                <Analytics />
            </body>
        </html>
    );
}
