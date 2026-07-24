import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Blauer Himmel, mehr Nummern? — Hornussen-Wetteranalyse",
  description:
    "Stimmt die Hornusser-Weisheit, dass man den Nouss bei blauem Himmel schlechter sieht und mehr Nummern entstehen? Eine datenbasierte Untersuchung der EHV-Meisterschaft.",
};

// Set theme before paint to avoid a flash.
const themeScript = `
(function(){try{
  var t=localStorage.getItem('theme');
  if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){
    document.documentElement.classList.add('dark');
  }
}catch(e){}})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="font-sans antialiased min-h-screen flex flex-col">
        <Nav />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
