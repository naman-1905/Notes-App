import { Nunito } from "next/font/google";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["200", "400", "600", "700", "900"], // add weights you need
});

export const metadata = {
  title: "Notes App",
  description: "A simple notes app",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${nunito.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
