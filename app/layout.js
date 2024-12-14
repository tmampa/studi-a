import './globals.css';

export const metadata = {
  title: 'Studi-a',
  description: 'A study platform',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        {children}
      </body>
    </html>
  );
}
