'use client';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalCount: number;
  itemsPerPage: number;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalCount,
  itemsPerPage
}: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }
  
  const fromItem = (currentPage - 1) * itemsPerPage + 1;
  const toItem = Math.min(currentPage * itemsPerPage, totalCount);

  return (
    <nav
      className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      aria-label="Data pagination"
    >
      <div className="text-center text-sm text-muted-foreground sm:text-left">
        Showing {fromItem}-{toItem} of {totalCount} entries
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <Button
          variant="outline"
          className="min-h-11"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Previous</span>
        </Button>
        <div className="whitespace-nowrap px-1 text-sm">
          Page {currentPage} of {totalPages}
        </div>
        <Button
          variant="outline"
          className="min-h-11"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <span>Next</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </nav>
  );
}
