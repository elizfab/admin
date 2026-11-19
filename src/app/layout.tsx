import type { Metadata } from "next";
import { Open_Sans } from "next/font/google";

import "./globals.scss";

const openSans = Open_Sans({
    variable: "--font-open-sans",
    subsets: ["latin"],
    display: "swap",
});

export const metadata: Metadata = {
    title: {
        default: "Admin",
        template: "%s | Admin",
    },
    description: "Portal administrativo pessoal.",
    manifest: "/site.webmanifest",
};

// Aplica o tema salvo (ou o do sistema) antes da primeira pintura,
// evitando o "flash" de tema errado. Precisa ser inline e síncrono.
const themeScript = `(function(){try{var t=localStorage.getItem("theme");if(t!=="light"&&t!=="dark"){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.dataset.theme=t}catch(e){document.documentElement.dataset.theme="light"}})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
    return (
        <html lang="pt-BR" className={openSans.variable} suppressHydrationWarning>
            <body>
                <script dangerouslySetInnerHTML={{ __html: themeScript }} />
                {children}
            </body>
        </html>
    );
}
