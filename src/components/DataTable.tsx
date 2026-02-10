'use client';
import { useState } from 'react';
import type { DataItem, DataSource } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from './ui/button';
import { Copy, Check, Info } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import Pagination from './Pagination';

interface DataTableProps {
  data: DataItem[];
  source: DataSource;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalCount: number;
  itemsPerPage: number;
}

const CopyButton = ({ value }: { value: string | undefined }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-7 w-7"
      onClick={handleCopy}
      disabled={!value}
    >
      {copied ? (
        <Check className="h-4 w-4 text-green-500" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </Button>
  );
};

const MobileDataCard = ({
  item,
  source,
}: {
  item: DataItem;
  source: DataSource;
}) => {
  const value = item[source.fieldPassword] ?? 'N/A';
  const createdAtDate = new Date(
    item.createdAt.seconds * 1000
  ).toLocaleString();

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex justify-between items-start">
          <span className="font-semibold">{item.username}</span>
          <CopyButton value={item.username} />
        </div>
        <div className="flex justify-between items-start">
          <span className="font-mono text-sm text-muted-foreground truncate">
            {value}
          </span>
          <CopyButton value={value} />
        </div>
        {source.displayPin && (
          <div className="flex justify-between items-start">
            <span className="font-mono text-sm text-muted-foreground">
              {item.pin ?? 'N/A'}
            </span>
            <CopyButton value={item.pin} />
          </div>
        )}
        <p className="text-xs text-muted-foreground pt-2">{createdAtDate}</p>
      </CardContent>
    </Card>
  );
};

const DesktopDataRow = ({
  item,
  source,
}: {
  item: DataItem;
  source: DataSource;
}) => {
  const value = item[source.fieldPassword] ?? 'N/A';
  const createdAtDate = new Date(
    item.createdAt.seconds * 1000
  ).toLocaleString();

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-2">
          <span>{item.username}</span>
          <CopyButton value={item.username} />
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2 font-mono text-sm">
          <span className="truncate">{value}</span>
          <CopyButton value={value} />
        </div>
      </TableCell>
      {source.displayPin && (
        <TableCell>
          <div className="flex items-center gap-2 font-mono text-sm">
            <span>{item.pin ?? 'N/A'}</span>
            <CopyButton value={item.pin} />
          </div>
        </TableCell>
      )}
      <TableCell className="text-muted-foreground text-xs">
        {createdAtDate}
      </TableCell>
    </TableRow>
  );
};

export default function DataTable({
  data,
  source,
  currentPage,
  totalPages,
  onPageChange,
  totalCount,
  itemsPerPage,
}: DataTableProps) {
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8 rounded-lg bg-card">
        <Info className="w-12 h-12 mb-4" />
        <h3 className="text-xl font-semibold text-foreground">No Data Found</h3>
        <p className="mt-2">No entries match your current search query.</p>
        <p>Try refining your search or refreshing the data source.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1">
        {/* Mobile View */}
        <div className="md:hidden space-y-4">
          {data.map((item) => (
            <MobileDataCard key={item.id} item={item} source={source} />
          ))}
        </div>

        {/* Desktop View */}
        <div className="hidden md:block rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Password / Access</TableHead>
                {source.displayPin && <TableHead>PIN</TableHead>}
                <TableHead>Created At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item) => (
                <DesktopDataRow key={item.id} item={item} source={source} />
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
      <div className="mt-6">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
          totalCount={totalCount}
          itemsPerPage={itemsPerPage}
        />
      </div>
    </div>
  );
}
