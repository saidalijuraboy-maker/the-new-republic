
import "./globals.css";

export const metadata = {
  title: "THE NEW REPUBLIC",
  description: "One million citizens. One nation. One future.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
