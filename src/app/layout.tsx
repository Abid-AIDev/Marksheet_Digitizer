import type {Metadata} from 'next';
import { Inter } from 'next/font/google'; // Use a standard font like Inter
import './globals.css';
import { Toaster } from '@/components/ui/toaster'; // Import Toaster
import Footer from '@/components/footer'; // Import Footer

const inter = Inter({ subsets: ['latin'] }); // Initialize Inter font

export const metadata: Metadata = {
  title: 'MarkSheet Digitizer', // Update title
  description: 'Digitize marks from marksheets accurately.', // Update description
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} antialiased flex flex-col min-h-full`}> {/* Use Inter font class and ensure full height */}
        <main className="flex-grow">
          {children}
        </main>
        <Toaster /> {/* Add Toaster component here */}
        <Footer /> {/* Add Footer component here */}
      </body>
    </html>
  );
}
