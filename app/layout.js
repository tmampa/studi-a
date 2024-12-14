import './globals.css';

export const metadata = {
  title: 'Studi-a',
  description: 'A study platform',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
