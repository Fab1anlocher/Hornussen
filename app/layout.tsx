import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Blauer Himmel, mehr Nummern? — eine Hornussen-Datengeschichte",
  description:
    "Bei blauem Himmel sieht man den Nouss schlechter — stimmt das? 13'793 Meisterschaftsspiele und das Wetter darüber, als Scroll-Geschichte erzählt.",
};

// Marks JS as available before first paint. Every animation is gated on this
// class, so the page renders complete and readable if the script never runs.
const jsFlag = `document.documentElement.classList.add('js')`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..800&family=Instrument+Sans:wght@400..600&display=swap"
          rel="stylesheet"
        />
        <script dangerouslySetInnerHTML={{ __html: jsFlag }} />
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
