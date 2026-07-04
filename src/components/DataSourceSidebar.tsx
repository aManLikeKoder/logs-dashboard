'use client';

import { useState } from 'react';
import { useDataSources, type EnrichedDataSource } from '@/contexts/DataSourceContext';
import {
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Database,
  Plus,
  Star,
  MoreVertical,
  Pencil,
  Trash2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import AddDataSourceDialog from './AddDataSourceDialog';
import DeleteDataSourceDialog from './DeleteDataSourceDialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

export default function DataSourceSidebar() {
  const { isMobile, setOpenMobile } = useSidebar();
  const {
    dataSources,
    activeDataSource,
    setActiveDataSource,
    defaultDataSourceId,
    setDefaultDataSource,
  } = useDataSources();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<EnrichedDataSource | null>(
    null
  );
  const [deletingSource, setDeletingSource] =
    useState<EnrichedDataSource | null>(null);

  const openAddDialog = () => {
    setEditingSource(null);
    setDialogOpen(true);
  };

  const openEditDialog = (source: EnrichedDataSource) => {
    setEditingSource(source);
    setDialogOpen(true);
  };

  const selectSource = (source: EnrichedDataSource) => {
    setActiveDataSource(source);
    if (isMobile) setOpenMobile(false);
  };

  return (
    <>
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-3 p-3">
          <Database className="h-7 w-7 text-sidebar-foreground/80" />
          <div className="flex items-center gap-2">
            <p className="text-lg font-semibold text-sidebar-foreground">
              DataLens
            </p>
            <Badge variant="outline" className="border-primary/50 text-xs">
              Pro
            </Badge>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <p className="px-2 pb-2 text-xs font-medium uppercase tracking-wide text-sidebar-foreground/60">
            Data sources
          </p>
          <SidebarMenu>
            {dataSources.map((source) => (
              <SidebarMenuItem key={source.id}>
                <SidebarMenuButton
                  onClick={() => selectSource(source)}
                  isActive={activeDataSource?.id === source.id}
                  className="h-12 justify-between pr-12 text-sm"
                >
                  <div className="flex items-center gap-2 truncate">
                    {defaultDataSourceId === source.id && (
                      <Star className="h-4 w-4 shrink-0 text-amber-400 fill-amber-400" />
                    )}
                    <span className="truncate">{source.name}</span>
                  </div>
                  {source.newItemsCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="mr-8 h-5 min-w-5 px-1.5 tabular-nums"
                      aria-label={`${source.newItemsCount.toLocaleString()} new records`}
                    >
                      {source.newItemsCount.toLocaleString()}
                    </Badge>
                  )}
                </SidebarMenuButton>

                <div className="absolute right-1 top-1/2 -translate-y-1/2 opacity-100 transition-opacity md:opacity-0 md:group-hover/menu-item:opacity-100 md:focus-within:opacity-100">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10"
                        aria-label={`Actions for ${source.name}`}
                        title={`Actions for ${source.name}`}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onSelect={() => setDefaultDataSource(source.id)}
                        disabled={defaultDataSourceId === source.id}
                        className="min-h-11"
                      >
                        <Star className="mr-2 h-4 w-4" />
                        Set as Default
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => openEditDialog(source)}
                        className="min-h-11"
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => setDeletingSource(source)}
                        className="min-h-11 text-destructive focus:bg-destructive/10 focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <Button onClick={openAddDialog} className="h-11 w-full">
          <Plus className="mr-2 h-4 w-4" />
          Add Source
        </Button>
      </SidebarFooter>

      <AddDataSourceDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingSource={editingSource}
      />
      <DeleteDataSourceDialog
        open={!!deletingSource}
        onOpenChange={() => setDeletingSource(null)}
        source={deletingSource}
      />
    </>
  );
}
