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
          <SidebarMenu>
            {dataSources.map((source) => (
              <SidebarMenuItem key={source.id}>
                <SidebarMenuButton
                  onClick={() => setActiveDataSource(source)}
                  isActive={activeDataSource?.id === source.id}
                  className="pr-8 justify-between"
                >
                  <div className="flex items-center gap-2 truncate">
                    {defaultDataSourceId === source.id && (
                      <Star className="h-4 w-4 shrink-0 text-amber-400 fill-amber-400" />
                    )}
                    <span className="truncate">{source.name}</span>
                  </div>
                  {source.newItemsCount > 0 && (
                    <Badge variant="destructive" className="h-5 px-2">
                      {source.newItemsCount > 99 ? '99+' : source.newItemsCount}
                    </Badge>
                  )}
                </SidebarMenuButton>

                <div className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover/menu-item:opacity-100 focus-within:opacity-100 transition-opacity">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onSelect={() => setDefaultDataSource(source.id)}
                        disabled={defaultDataSourceId === source.id}
                      >
                        <Star className="mr-2 h-4 w-4" />
                        Set as Default
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => openEditDialog(source)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => setDeletingSource(source)}
                        className="text-destructive focus:text-destructive focus:bg-destructive/10"
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

      <SidebarFooter>
        <Button onClick={openAddDialog} className="w-full">
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
