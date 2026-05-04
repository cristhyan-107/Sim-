import { Sidebar } from '@/components/layout/sidebar';
import { FinanceProvider } from '@/lib/finance/store';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <FinanceProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar />
        <main className="flex-1 bg-muted/20">
          {children}
        </main>
      </div>
    </FinanceProvider>
  );
}
