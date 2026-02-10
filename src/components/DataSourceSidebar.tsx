'use client';

import { useState } from 'react';
import { useDataSources } from '@/contexts/DataSourceContext';
import {
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarMenuAction,
} from '@/components/ui/sidebar';
import { Database, Plus, Star } from 'lucide-react';
import AddDataSourceDialog from './AddDataSourceDialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';

export default function DataSourceSidebar() {
  const {
    dataSources,
    activeDataSource,
    setActiveDataSource,
    defaultDataSourceId,
    setDefaultDataSource,
  } = useDataSources();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-3 p-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20 text-primary">
            <Database className="h-6 w-6" />
          </div>
          <div className="flex flex-col">
            <p className="text-lg font-semibold text-sidebar-foreground">
              DataLens Pro
            </p>
            <p className="text-xs text-sidebar-foreground/70">
              Data Source Viewer
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {dataSources.map((source) => (
              <SidebarMenuItem key={source.id}>
                <SidebarMenuButton
                  onClick={() => setActiveDataSource(source)}
                  isActive={activeDataSource?.id === source.id}
                  className="justify-between"
                >
                  <div className="flex items-center gap-2">
                    {defaultDataSourceId === source.id && (
                      <Star className="h-4 w-4 shrink-0 text-amber-400 fill-amber-400" />
                    )}
                    <span className="truncate">{source.name}</span>
                  </div>
                  {source.newItemsCount && source.newItemsCount > 0 && (
                    <Badge className="bg-primary/20 text-primary-foreground hover:bg-primary/30 h-5">
                      {source.newItemsCount > 99
                        ? '99+'
                        : source.newItemsCount}
                    </Badge>
                  )}
                </SidebarMenuButton>

                <SidebarMenuAction
                  showOnHover={true}
                  onClick={() => setDefaultDataSource(source.id)}
                  aria-label="Set as default"
                  className={cn(
                    defaultDataSourceId === source.id &&
                      'text-amber-400 hover:text-amber-400'
                  )}
                >
                  <Star
                    className={cn(
                      'h-4 w-4',
                      defaultDataSourceId === source.id && 'fill-current'
                    )}
                  />
                </SidebarMenuAction>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <Button onClick={() => setIsDialogOpen(true)} className="w-full">
          <Plus className="mr-2 h-4 w-4" />
          Add Source
        </Button>
      </SidebarFooter>

      <AddDataSourceDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </>
  );
}
