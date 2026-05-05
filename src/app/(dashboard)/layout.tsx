import { Sidebar } from '@/components/layout/sidebar';
import { FinanceProvider } from '@/lib/finance/store';
import { Level2Provider } from '@/components/providers/level2-provider';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <FinanceProvider>
      <Level2Provider>
        <div className="flex min-h-screen w-full flex-col md:flex-row">
          <Sidebar />
          <main className="min-w-0 flex-1 bg-muted/20">
            {children}
          </main>
        </div>
      </Level2Provider>
    </FinanceProvider>
  );
}
