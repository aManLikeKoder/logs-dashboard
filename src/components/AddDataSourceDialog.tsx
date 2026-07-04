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
  FormDescription,
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
import { Braces, Columns3, Database, Loader2 } from 'lucide-react';

const normalizeFirebaseConfig = (value: string): string | null => {
  try {
    let config = value.trim().replace(/^```(?:json|javascript|js)?/i, '');
    config = config.replace(/```$/, '').trim();

    const objectStart = config.indexOf('{');
    const objectEnd = config.lastIndexOf('}');
    if (objectStart === -1 || objectEnd <= objectStart) return null;

    config = config
      .slice(objectStart, objectEnd + 1)
      .replace(
        /([{,]\s*)([A-Za-z_$][\w$]*)(\s*:)/g,
        '$1"$2"$3'
      )
      .replace(/,\s*([}\]])/g, '$1');

    const parsed = JSON.parse(config);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return null;
    }

    return JSON.stringify(parsed, null, 2);
  } catch {
    return null;
  }
};

const formSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, { message: 'Name must be at least 2 characters.' }),
    firebaseConfig: z
      .string()
      .min(10, { message: 'Firebase config is required.' })
      .refine(
        (val) => normalizeFirebaseConfig(val) !== null,
        { message: 'Paste a valid Firebase web app configuration.' }
      ),
    collectionPath: z
      .string()
      .trim()
      .min(1, { message: 'Collection path is required.' }),
    fieldUsername: z
      .string()
      .trim()
      .min(1, { message: 'Field name is required.' }),
    fieldPassword: z
      .string()
      .trim()
      .min(1, { message: 'Field name is required.' }),
    fieldCreatedAt: z
      .string()
      .trim()
      .min(1, { message: 'Field name is required.' }),
    displayPin: z.boolean().default(false),
    fieldPin: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.displayPin) {
        return data.fieldPin && data.fieldPin.trim().length > 0;
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

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const normalizedConfig = normalizeFirebaseConfig(values.firebaseConfig);
    if (!normalizedConfig) {
      form.setError('firebaseConfig', {
        message: 'Paste a valid Firebase web app configuration.',
      });
      return;
    }

    const normalizedValues = {
      ...values,
      name: values.name.trim(),
      collectionPath: values.collectionPath.trim(),
      fieldUsername: values.fieldUsername.trim(),
      fieldPassword: values.fieldPassword.trim(),
      fieldCreatedAt: values.fieldCreatedAt.trim(),
      fieldPin: values.fieldPin?.trim(),
      firebaseConfig: normalizedConfig,
    };

    const succeeded =
      isEditing && editingSource
        ? await updateDataSource(editingSource.id, normalizedValues)
        : await addDataSource(
            normalizedValues as Omit<DataSource, 'id'>
          );

    if (succeeded) {
      onOpenChange(false);
    }
  }

  const isSubmitting = form.formState.isSubmitting;

  const formatFirebaseConfig = () => {
    const formatted = normalizeFirebaseConfig(
      form.getValues('firebaseConfig')
    );

    if (formatted) {
      form.setValue('firebaseConfig', formatted, {
        shouldDirty: true,
        shouldValidate: true,
      });
    } else {
      void form.trigger('firebaseConfig');
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!isSubmitting) onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="max-h-[calc(100dvh-1rem)] w-[calc(100%-1rem)] grid-rows-[auto_1fr_auto] p-4 sm:max-w-[800px] sm:p-6">
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
            aria-busy={isSubmitting}
          >
            <ScrollArea className="h-[62vh] pr-3 md:h-auto md:max-h-[65vh] md:pr-6">
              <div className="space-y-5 pb-1">
                <section className="space-y-4 rounded-lg border bg-card p-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-md bg-primary/10 p-2">
                      <Database className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Source details</h3>
                      <p className="text-sm text-muted-foreground">
                        Give this source a recognizable name and collection.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Source name</FormLabel>
                          <FormControl>
                            <Input
                              className="h-11"
                              placeholder="Customer signups"
                              autoComplete="off"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            This is the name shown in the sidebar.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="collectionPath"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Firestore collection</FormLabel>
                          <FormControl>
                            <Input
                              className="h-11 font-mono"
                              placeholder="users or forms/submissions"
                              autoCapitalize="none"
                              autoCorrect="off"
                              spellCheck={false}
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Enter the exact collection path.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </section>

                <section className="space-y-4 rounded-lg border bg-card p-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-md bg-primary/10 p-2">
                      <Braces className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold">Firebase connection</h3>
                      <p className="text-sm text-muted-foreground">
                        Paste the web app config from Firebase project settings.
                      </p>
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="firebaseConfig"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between gap-3">
                          <FormLabel>Firebase web configuration</FormLabel>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={formatFirebaseConfig}
                            disabled={!field.value || isSubmitting}
                          >
                            Format JSON
                          </Button>
                        </div>
                        <FormControl>
                          <Textarea
                            placeholder={'const firebaseConfig = {\n  apiKey: "...",\n  projectId: "...",\n  appId: "..."\n};'}
                            className="min-h-52 resize-y font-mono text-xs leading-5"
                            autoCapitalize="none"
                            autoCorrect="off"
                            spellCheck={false}
                            onBlur={() => {
                              field.onBlur();
                              const formatted = normalizeFirebaseConfig(
                                field.value
                              );
                              if (formatted) field.onChange(formatted);
                            }}
                            name={field.name}
                            ref={field.ref}
                            value={field.value}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormDescription>
                          Pure JSON and the standard Firebase{' '}
                          <code>const firebaseConfig = {'{ … }'};</code> snippet
                          are both accepted.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </section>

                <section className="space-y-4 rounded-lg border bg-card p-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-md bg-primary/10 p-2">
                      <Columns3 className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Field mapping</h3>
                      <p className="text-sm text-muted-foreground">
                        Match the dashboard columns to your document field names.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <FormField
                      control={form.control}
                      name="fieldUsername"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username field</FormLabel>
                          <FormControl>
                            <Input
                              className="h-11 font-mono"
                              placeholder="username"
                              autoCapitalize="none"
                              autoCorrect="off"
                              spellCheck={false}
                              {...field}
                            />
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
                          <FormLabel>Password/access field</FormLabel>
                          <FormControl>
                            <Input
                              className="h-11 font-mono"
                              placeholder="password"
                              autoCapitalize="none"
                              autoCorrect="off"
                              spellCheck={false}
                              {...field}
                            />
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
                          <FormLabel>Timestamp field</FormLabel>
                          <FormControl>
                            <Input
                              className="h-11 font-mono"
                              placeholder="createdAt"
                              autoCapitalize="none"
                              autoCorrect="off"
                              spellCheck={false}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="displayPin"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between gap-4 rounded-lg border bg-muted/30 p-4">
                        <div className="space-y-1">
                          <FormLabel>Documents include a PIN</FormLabel>
                          <FormDescription>
                            Turn this on to display and copy a PIN column.
                          </FormDescription>
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
                        <FormItem className="max-w-xs">
                          <FormLabel>PIN field</FormLabel>
                          <FormControl>
                            <Input
                              className="h-11 font-mono"
                              placeholder="pin"
                              autoCapitalize="none"
                              autoCorrect="off"
                              spellCheck={false}
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Enter the exact field name containing the PIN.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </section>
              </div>
            </ScrollArea>
          </form>
        </Form>
        <DialogFooter className="pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" form="add-source-form" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting
              ? isEditing
                ? 'Saving Changes...'
                : 'Saving Source...'
              : isEditing
                ? 'Save Changes'
                : 'Save Source'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
