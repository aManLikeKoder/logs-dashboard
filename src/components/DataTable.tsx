'use client';
import { useState } from 'react';
import { format } from 'date-fns';
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface DataTableProps {
  data: DataItem[];
  source: DataSource;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalCount: number;
  itemsPerPage: number;
  hasActiveSearch: boolean;
}

const CharacterCount = ({ value }: { value: unknown }) => {
  if (value === null || value === undefined || value === '') return null;

  const count = Array.from(String(value)).length;

  return (
    <span className="w-fit whitespace-nowrap rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
      {count} {count === 1 ? 'char' : 'chars'}
    </span>
  );
};

const CopyButton = ({ value }: { value: string | undefined }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={handleCopy}
          disabled={!value}
          aria-label={copied ? 'Copied to clipboard' : 'Copy to clipboard'}
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{copied ? 'Copied' : 'Copy'}</TooltipContent>
    </Tooltip>
  );
};

const FieldValue = ({
  value,
  className,
}: {
  value: unknown;
  className?: string;
}) => {
  const normalizedValue =
    value === null || value === undefined || value === ''
      ? null
      : String(value);

  return (
    <div className="flex min-w-0 flex-1">
      <span
        className={cn('min-w-0 truncate font-mono text-sm', className)}
        title={normalizedValue || undefined}
      >
        {normalizedValue || 'N/A'}
      </span>
    </div>
  );
};

const MobileFieldRow = ({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: unknown;
  mono?: boolean;
}) => {
  const normalizedValue =
    value === null || value === undefined || value === ''
      ? null
      : String(value);

  return (
    <div className="grid min-h-14 grid-cols-[4.75rem_minmax(0,1fr)_2rem] items-center gap-2">
      <div className="flex flex-col items-start gap-1">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <CharacterCount value={normalizedValue} />
      </div>
      <span
        className={cn(
          'min-w-0 truncate text-sm',
          mono && 'font-mono text-muted-foreground'
        )}
        title={normalizedValue || undefined}
      >
        {normalizedValue || 'N/A'}
      </span>
      <CopyButton value={normalizedValue || undefined} />
    </div>
  );
};

const MobileDataCard = ({
  item,
  source,
}: {
  item: DataItem;
  source: DataSource;
}) => {
  const value = item[source.fieldPassword];
  const pinValue = item[source.fieldPin || 'pin'];
  const createdAtDate = format(
    new Date(item.createdAt.seconds * 1000),
    "do (EEEE), MMMM, yyyy h:mm a"
  );

  return (
    <Card>
      <CardContent className="divide-y p-3">
        <MobileFieldRow label="Username" value={item.username} />
        <MobileFieldRow label="Password" value={value} mono />
        {source.displayPin && (
          <MobileFieldRow label="PIN" value={pinValue} mono />
        )}
        <div className="grid min-h-11 grid-cols-[4.75rem_minmax(0,1fr)_2rem] items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Created
          </span>
          <span className="text-xs text-muted-foreground">{createdAtDate}</span>
          <span aria-hidden="true" />
        </div>
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
  const value = item[source.fieldPassword];
  const pinValue = item[source.fieldPin || 'pin'];
  const createdAtDate = format(
    new Date(item.createdAt.seconds * 1000),
    "do (EEEE), MMMM, yyyy h:mm a"
  );

  return (
    <TableRow>
      <TableCell>
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="min-w-0 truncate" title={item.username}>
              {item.username}
            </span>
          </div>
          <CharacterCount value={item.username} />
          <CopyButton value={item.username} />
        </div>
      </TableCell>
      <TableCell>
        <div className="flex min-w-0 items-center justify-between gap-2">
          <FieldValue value={value} />
          <CharacterCount value={value} />
          <CopyButton
            value={value === null || value === undefined ? undefined : String(value)}
          />
        </div>
      </TableCell>
      {source.displayPin && (
        <TableCell>
          <div className="flex min-w-0 items-center justify-between gap-2">
            <FieldValue value={pinValue} />
            <CharacterCount value={pinValue} />
            <CopyButton
              value={
                pinValue === null || pinValue === undefined
                  ? undefined
                  : String(pinValue)
              }
            />
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
  hasActiveSearch,
}: DataTableProps) {
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8 rounded-lg bg-card">
        <Info className="w-12 h-12 mb-4" />
        <h3 className="text-xl font-semibold text-foreground">
          {hasActiveSearch ? 'No Matching Entries' : 'No Entries Yet'}
        </h3>
        <p className="mt-2">
          {hasActiveSearch
            ? 'No entries match your current username search.'
            : 'This data source does not contain any entries yet.'}
        </p>
        <p>
          {hasActiveSearch
            ? 'Try changing or clearing your search.'
            : 'Refresh the data source after new entries are added.'}
        </p>
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
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[26%]">Username</TableHead>
                <TableHead className="w-[30%]">Password / Access</TableHead>
                {source.displayPin && <TableHead className="w-[18%]">PIN</TableHead>}
                <TableHead className="w-56">Created At</TableHead>
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
