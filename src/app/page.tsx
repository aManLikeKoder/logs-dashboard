'use client';
import { useState } from 'react';
import { DataSourceProvider } from '@/contexts/DataSourceContext';
import DataSourceSidebar from '@/components/DataSourceSidebar';
import DataSourceContent from '@/components/DataSourceContent';
import {
  SidebarProvider,
  Sidebar,
  SidebarInset,
} from '@/components/ui/sidebar';

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <DataSourceProvider>
      <SidebarProvider
        open={sidebarOpen}
        onOpenChange={setSidebarOpen}
        defaultOpen={false}
      >
        <Sidebar>
          <DataSourceSidebar />
        </Sidebar>
        <SidebarInset>
          <DataSourceContent />
        </SidebarInset>
      </SidebarProvider>
    </DataSourceProvider>
  );
}
