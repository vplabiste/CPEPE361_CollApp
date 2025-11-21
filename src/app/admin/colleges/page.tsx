
'use client';

import { useState, useEffect, useMemo, useTransition } from 'react';
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Building2, MoreHorizontal, Search, Trash2, Edit, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { deleteCollege, getColleges } from '@/app/actions/colleges';
import { useToast } from '@/hooks/use-toast';
import { AddCollegeDialog } from '@/components/admin/add-college-dialog';
import { EditCollegeDialog } from '@/components/admin/edit-college-dialog';
import { regions } from '@/lib/ph-address-data';
import type { College } from '@/lib/college-schemas';
import { Skeleton } from '@/components/ui/skeleton';

function TableSkeleton() {
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[80px]">Logo</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Region</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {Array.from({ length: 3 }).map((_, i) => (
                        <TableRow key={i}>
                            <TableCell><Skeleton className="h-10 w-16 rounded-md" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                            <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                            <TableCell className="text-right"><Skeleton className="h-8 w-8 rounded-md" /></TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}

export default function AdminCollegesPage() {
  const [allColleges, setAllColleges] = useState<College[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const [dialogState, setDialogState] = useState<{
    deleteOpen: boolean;
    editOpen: boolean;
    selectedCollege: College | null;
  }>({ deleteOpen: false, editOpen: false, selectedCollege: null });

  const fetchColleges = async () => {
    setIsLoading(true);
    const colleges = await getColleges(false);
    setAllColleges(colleges);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchColleges();
  }, []);

  const filteredColleges = useMemo(() => {
    return allColleges.filter(college => {
      const nameMatch = college.name.toLowerCase().includes(searchTerm.toLowerCase());
      const regionMatch = selectedRegion === 'all' || college.region === selectedRegion;
      return nameMatch && regionMatch;
    });
  }, [allColleges, searchTerm, selectedRegion]);

  const handleDelete = () => {
    if (!dialogState.selectedCollege) return;
    startTransition(async () => {
        const result = await deleteCollege(dialogState.selectedCollege!.id);
        if (result.success) {
            toast({ title: 'Success', description: result.message });
            setAllColleges(prev => prev.filter(c => c.id !== dialogState.selectedCollege!.id));
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.message });
        }
        setDialogState({ deleteOpen: false, editOpen: false, selectedCollege: null });
    });
  };

  if (isLoading) {
      return (
          <Card>
              <CardHeader><CardTitle>Loading Colleges...</CardTitle></CardHeader>
              <CardContent><TableSkeleton /></CardContent>
          </Card>
      );
  }

  return (
    <>
      <Card>
        <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" /> College Management
                    </CardTitle>
                    <CardDescription>
                    Add, edit, and manage partner universities and colleges.
                    </CardDescription>
                </div>
                <AddCollegeDialog onSuccess={fetchColleges} />
            </div>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input placeholder="Search by name..." className="pl-10" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
                <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                    <SelectTrigger><SelectValue placeholder="Filter by region..." /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Regions</SelectItem>
                        {regions.map(r => <SelectItem key={r.region_code} value={r.region_name}>{r.region_name}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Logo</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Region</TableHead>
                <TableHead className="hidden md:table-cell">Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredColleges.length > 0 ? (
                filteredColleges.map((college) => (
                  <TableRow key={college.id}>
                    <TableCell>
                      <Image
                        src={college.logoUrl}
                        alt={`${college.name} logo`}
                        width={60}
                        height={40}
                        className="rounded-md object-contain"
                      />
                    </TableCell>
                    <TableCell className="font-medium">{college.name}</TableCell>
                    <TableCell className="text-muted-foreground">{college.region || 'N/A'}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground max-w-sm truncate">{college.description}</TableCell>
                    <TableCell>
                        <Badge variant={college.isPublished ? "default" : "secondary"}>
                            {college.isPublished ? "Published" : "Unpublished"}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onSelect={() => setDialogState({ deleteOpen: false, editOpen: true, selectedCollege: college })}>
                                    <Edit className="mr-2 h-4 w-4" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onSelect={() => setDialogState({ deleteOpen: true, editOpen: false, selectedCollege: college })} className="text-destructive focus:text-destructive">
                                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                    No colleges match your criteria.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {dialogState.selectedCollege && (
        <>
            <EditCollegeDialog
                isOpen={dialogState.editOpen}
                setIsOpen={(open) => setDialogState(prev => ({ ...prev, editOpen: open }))}
                college={dialogState.selectedCollege}
                onSuccess={() => {
                    fetchColleges();
                    setDialogState({ deleteOpen: false, editOpen: false, selectedCollege: null });
                }}
            />

            <AlertDialog open={dialogState.deleteOpen} onOpenChange={(open) => setDialogState(prev => ({...prev, deleteOpen: open}))}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure you want to delete this college?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will permanently delete "{dialogState.selectedCollege.name}", its representative's account, and all associated files. This action cannot be undone.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} disabled={isPending} className="bg-destructive hover:bg-destructive/90">
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Delete
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
      )}
    </>
  );
}
