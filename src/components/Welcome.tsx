import { Database, MousePointerClick } from 'lucide-react';

export default function Welcome() {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center p-4">
      <div className="flex items-center justify-center w-24 h-24 rounded-full bg-primary/10 mb-6">
        <Database className="w-12 h-12 text-primary" />
      </div>
      <h2 className="text-3xl font-bold text-foreground mb-2">
        Welcome to DataLens Pro
      </h2>
      <p className="text-muted-foreground max-w-md">
        Select a data source from the sidebar to begin reviewing data. If you
        don't have any sources, add one to get started.
      </p>
      <div className="flex items-center text-sm text-muted-foreground/80 mt-8 gap-2">
        <MousePointerClick className="w-4 h-4" />
        <span>Use the sidebar to navigate</span>
      </div>
    </div>
  );
}
