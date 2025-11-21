
'use client';

import { useState, useEffect, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormDescription } from "@/components/ui/form";
import { Checkbox } from '@/components/ui/checkbox';
import { Settings, Wrench, University, Loader2 } from "lucide-react";
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getPlatformSettings, savePlatformSettings } from '@/app/actions/settings';
import { getColleges } from '@/app/actions/colleges';
import type { College } from '@/lib/college-schemas';
import { Skeleton } from '@/components/ui/skeleton';
import { platformSettingsSchema, type PlatformSettings } from '@/lib/settings-schemas';

function SettingsSkeleton() {
    return (
        <div className="space-y-6">
            <Skeleton className="h-8 w-1/3 mb-2" />
            <Skeleton className="h-4 w-2/3" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
                <Skeleton className="h-64" />
                <Skeleton className="h-64" />
            </div>
        </div>
    )
}

export default function AdminSettingsPage() {
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();
    const [isLoading, setIsLoading] = useState(true);
    const [allColleges, setAllColleges] = useState<College[]>([]);

    const form = useForm<PlatformSettings>({
        resolver: zodResolver(platformSettingsSchema),
        defaultValues: {
            maintenanceMode: false,
            applicationsOpen: true,
            featuredColleges: [],
        }
    });

    useEffect(() => {
        async function loadSettings() {
            setIsLoading(true);
            try {
                const [settings, colleges] = await Promise.all([
                    getPlatformSettings(),
                    getColleges(false) // Get all colleges for the checklist
                ]);
                form.reset(settings);
                setAllColleges(colleges);
            } catch (error) {
                toast({ variant: 'destructive', title: 'Error', description: 'Failed to load settings.' });
            } finally {
                setIsLoading(false);
            }
        }
        loadSettings();
    }, [form, toast]);

    const onSubmit = (data: PlatformSettings) => {
        startTransition(async () => {
            const result = await savePlatformSettings(data);
            if (result.success) {
                toast({ title: 'Success', description: result.message });
            } else {
                toast({ variant: 'destructive', title: 'Error', description: result.message || 'Failed to save settings.' });
            }
        });
    };

    if (isLoading) {
        return <SettingsSkeleton />;
    }

    return (
        <div className="w-full space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                <Settings className="h-8 w-8" />
                Platform Settings
                </h1>
                <p className="text-muted-foreground">
                Manage global settings for the entire application.
                </p>
            </div>
            
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Wrench/> Site Status</CardTitle>
                                <CardDescription>Control site-wide access and application periods.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <FormField control={form.control} name="maintenanceMode" render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                        <div className="space-y-0.5">
                                            <FormLabel className="text-base">Maintenance Mode</FormLabel>
                                            <FormDescription>Redirect all non-admin users to a maintenance page.</FormDescription>
                                        </div>
                                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                    </FormItem>
                                )}/>
                                 <FormField control={form.control} name="applicationsOpen" render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                        <div className="space-y-0.5">
                                            <FormLabel className="text-base">College Applications</FormLabel>
                                            <FormDescription>Globally enable or disable the "Apply Now" buttons.</FormDescription>
                                        </div>
                                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                    </FormItem>
                                )}/>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><University/> Featured Colleges</CardTitle>
                                <CardDescription>Select which colleges appear on the public homepage.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <FormField control={form.control} name="featuredColleges" render={() => (
                                    <FormItem className="space-y-3 max-h-60 overflow-y-auto pr-2">
                                        {allColleges.length > 0 ? allColleges.map((college) => (
                                            <FormField key={college.id} control={form.control} name="featuredColleges" render={({ field }) => (
                                                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                                    <FormControl>
                                                        <Checkbox
                                                            checked={field.value?.includes(college.id)}
                                                            onCheckedChange={(checked) => {
                                                                return checked
                                                                ? field.onChange([...field.value, college.id])
                                                                : field.onChange(field.value?.filter((id) => id !== college.id))
                                                            }}
                                                        />
                                                    </FormControl>
                                                    <FormLabel className="font-normal">{college.name}</FormLabel>
                                                </FormItem>
                                            )}
                                            />
                                        )) : <p className="text-sm text-muted-foreground">No colleges found to feature.</p>}
                                    </FormItem>
                                )}/>
                            </CardContent>
                        </Card>
                    </div>

                     <div className="flex justify-end">
                        <Button type="submit" size="lg" disabled={isPending}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save All Settings
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
}
