import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { AuthProvider } from '@/context/AuthContext';

export const metadata = {
  title: 'FlatMate AI — Find Your Perfect Flatmate',
  description:
    'AI-powered lifestyle compatibility matching for college students and young professionals. Find trusted roommates who share your vibe, habits, and budget.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body className="bg-navy-950 text-slate-100 min-h-screen flex flex-col selection:bg-purple-600 selection:text-white antialiased">
        <AuthProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
