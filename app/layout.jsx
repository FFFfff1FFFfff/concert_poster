import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/barlow-condensed/600.css';
import '@fontsource/barlow-condensed/700.css';
import './globals.css';

export const metadata = { title: 'FLIKX — Concert Studio', description: 'Two slides. One concert moment.' };

export default function RootLayout({ children }) {
  return <html lang="en"><body>{children}</body></html>;
}
