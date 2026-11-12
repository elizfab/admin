import type { Metadata } from "next";
import { Open_Sans } from "next/font/google";
import "./globals.scss";

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Painel administrativo",
  description: "Plataforma pessoal de ferramentas e aplicações.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={openSans.variable}>
      <body>{children}</body>
    </html>
  );
}
