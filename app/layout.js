import './globals.css';
import { I18nProvider } from './lib/i18n';

export const metadata = {
  title: 'THE NEW REPUBLIC',
  description: 'One million citizens. One nation. One future.',
};

export default function RootLayout({ children }) {
  return (
    <html lang='en'>
      <body>
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
