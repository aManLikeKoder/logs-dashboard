'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useDataSources } from '@/contexts/DataSourceContext';
import type { DataSource } from '@/lib/types';
import { useEffect } from 'react';
import { ScrollArea } from './ui/scroll-area';

const formSchema = z
  .object({
    name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
    firebaseConfig: z
      .string()
      .min(10, { message: 'Firebase config is required.' })
      .refine(
        (val) => {
          try {
            JSON.parse(val);
            return true;
          } catch (e) {
            return false;
          }
        },
        { message: 'Invalid JSON format.' }
      ),
    collectionPath: z
      .string()
      .min(1, { message: 'Collection path is required.' }),
    fieldUsername: z.string().min(1, { message: 'Field name is required.' }),
    fieldPassword: z.string().min(1, { message: 'Field name is required.' }),
    fieldCreatedAt: z.string().min(1, { message: 'Field name is required.' }),
    displayPin: z.boolean().default(false),
    fieldPin: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.displayPin) {
        return data.fieldPin && data.fieldPin.length > 0;
      }
      return true;
    },
    {
      message: 'PIN field name is required when display is enabled.',
      path: ['fieldPin'],
    }
  );

type AddDataSourceDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingSource?: DataSource | null;
};

const defaultFormValues = {
  name: '',
  firebaseConfig: '',
  collectionPath: '',
  fieldUsername: 'username',
  fieldPassword: 'password',
  fieldCreatedAt: 'createdAt',
  displayPin: false,
  fieldPin: 'pin',
};

export default function AddDataSourceDialog({
  open,
  onOpenChange,
  editingSource,
}: AddDataSourceDialogProps) {
  const { addDataSource, updateDataSource } = useDataSources();
  const isEditing = !!editingSource;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultFormValues,
  });

  const displayPinValue = form.watch('displayPin');

  useEffect(() => {
    if (open) {
      if (isEditing && editingSource) {
        form.reset({
          name: editingSource.name,
          firebaseConfig: editingSource.firebaseConfig,
          collectionPath: editingSource.collectionPath,
          fieldUsername: editingSource.fieldUsername,
          fieldPassword: editingSource.fieldPassword,
          fieldCreatedAt: editingSource.fieldCreatedAt,
          displayPin: editingSource.displayPin,
          fieldPin: editingSource.fieldPin || 'pin',
        });
      } else {
        form.reset(defaultFormValues);
      }
    }
  }, [open, editingSource, isEditing, form]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (isEditing && editingSource) {
      updateDataSource(editingSource.id, values);
    } else {
      addDataSource(values as Omit<DataSource, 'id'>);
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] grid-rows-[auto_1fr_auto]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Data Source' : 'Add New Data Source'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the configuration for this data source.'
              : 'Configure a new Firebase data source to monitor.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            id="add-source-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 overflow-hidden"
          >
            <ScrollArea className="h-[60vh] md:h-auto md:max-h-[65vh] pr-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data Source Name</FormLabel>
                        <FormControl>
                          <Input placeholder="My Awesome Project" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="firebaseConfig"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Firebase Config (JSON)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder='{ "apiKey": "...", "authDomain": "...", ... }'
                            className="h-48 font-mono text-xs"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="collectionPath"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Collection Path</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., users" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="fieldUsername"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username Field</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="fieldPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password/Access Field</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="fieldCreatedAt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Timestamp Field</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="border-t border-border pt-4 space-y-4">
                    <FormField
                      control={form.control}
                      name="displayPin"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                          <div className="space-y-0.5">
                            <FormLabel>Display PIN</FormLabel>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    {displayPinValue && (
                      <FormField
                        control={form.control}
                        name="fieldPin"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>PIN Field Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                </div>
              </div>
            </ScrollArea>
          </form>
        </Form>
        <DialogFooter className="pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="submit" form="add-source-form">
            {isEditing ? 'Save Changes' : 'Save Source'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
