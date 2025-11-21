
'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Frown, ChevronDown } from "lucide-react";
import { getColleges } from '@/app/actions/colleges';
import { getMyApplications } from '@/app/actions/student';
import { auth } from '@/lib/firebase';
import type { College, Application } from '@/lib/college-schemas';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { regions } from '@/lib/ph-address-data';
import { availableRequirements } from '@/lib/college-schemas';

function CollegeListItemSkeleton() {
    return (
        <Card className="p-6">
            <div className="flex justify-between items-start">
                <div className="space-y-4 w-2/3">
                    <Skeleton className="h-6 w-full max-w-sm" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <div className="flex gap-2">
                            <Skeleton className="h-5 w-20 rounded-full" />
                            <Skeleton className="h-5 w-24 rounded-full" />
                            <Skeleton className="h-5 w-16 rounded-full" />
                        </div>
                    </div>
                     <Skeleton className="h-4 w-40" />
                </div>
                <div className="flex flex-col items-end gap-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-32 rounded-md" />
                </div>
            </div>
        </Card>
    )
}

const requirementsMap = new Map(availableRequirements.map(req => [req.id, req.label]));

export default function CollegesPage() {
  const [allColleges, setAllColleges] = useState<College[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('all');
  
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
        setLoading(true);
        if (user) {
            const [fetchedColleges, fetchedApplications] = await Promise.all([
                getColleges(),
                getMyApplications(user.uid),
            ]);
            setAllColleges(fetchedColleges);
            setApplications(fetchedApplications);
        }
        setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const applicationStatusMap = useMemo(() => {
    const map = new Map<string, Application['status']>();
    applications.forEach(app => {
        map.set(app.collegeId, app.status);
    });
    return map;
  }, [applications]);

  const filteredColleges = useMemo(() => {
    return allColleges.filter(college => {
      const nameMatch = college.name.toLowerCase().includes(searchTerm.toLowerCase());
      const regionMatch = selectedRegion === 'all' || !college.region || college.region === selectedRegion;
      return nameMatch && regionMatch;
    });
  }, [allColleges, searchTerm, selectedRegion]);


  return (
    <div className="w-full space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">AVAILABLE COLLEGES</h1>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search" 
            className="pl-9 h-11 border-input bg-background"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-11 justify-between w-full sm:w-48">
                    <span>{selectedRegion === 'all' ? 'Region' : selectedRegion}</span>
                    <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 max-h-60 overflow-y-auto">
                <DropdownMenuItem onSelect={() => setSelectedRegion('all')}>
                    All Regions
                </DropdownMenuItem>
                {regions.map(r => (
                    <DropdownMenuItem key={r.region_code} onSelect={() => setSelectedRegion(r.region_name)}>
                        {r.region_name}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {loading ? (
        <div className="space-y-4">
            <CollegeListItemSkeleton />
            <CollegeListItemSkeleton />
            <CollegeListItemSkeleton />
        </div>
      ) : (
        <div className="space-y-4">
            {filteredColleges.length > 0 ? (
                filteredColleges.map((college) => {
                    const appStatus = applicationStatusMap.get(college.id);
                    
                    let displayStatus: string;
                    let buttonComponent: React.ReactNode;

                    switch (appStatus) {
                        case 'Under Review':
                            displayStatus = 'Already Applied';
                            buttonComponent = <Button className="bg-warning hover:bg-warning/90 text-warning-foreground font-semibold shadow-sm" disabled>UNDER REVIEW</Button>;
                            break;
                        case 'Accepted':
                            displayStatus = 'Accepted';
                            buttonComponent = (
                                <Link href={`/student/applications`} passHref>
                                    <Button className="bg-success hover:bg-success/90 text-success-foreground font-semibold shadow-sm">VIEW DETAILS</Button>
                                </Link>
                            );
                            break;
                        case 'Rejected':
                            displayStatus = 'Rejected';
                            buttonComponent = <Button variant="destructive" className="font-semibold shadow-sm" disabled>REJECTED</Button>;
                            break;
                        default:
                            displayStatus = 'Available';
                            buttonComponent = (
                                <Link href={`/student/colleges/${college.id}`} passHref>
                                    <Button className="bg-cyan-400 hover:bg-cyan-500 text-black font-semibold shadow-sm">APPLY</Button>
                                </Link>
                            );
                    }

                    return (
                        <Card key={college.id} className="p-6 transition-shadow hover:shadow-md">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                                <div className="space-y-3 flex-grow">
                                    <div>
                                        <h3 className="text-lg font-semibold text-foreground">{college.name}</h3>
                                        <Link href={`/student/colleges/${college.id}`} className="text-xs text-muted-foreground uppercase hover:underline">Details</Link>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-muted-foreground mb-2">REQUIRED DOCUMENTS</p>
                                        <div className="flex flex-wrap gap-2">
                                            {(college.applicationRequirements && college.applicationRequirements.length > 0) || (college.customRequirements && college.customRequirements.length > 0) ? (
                                                <>
                                                    {college.applicationRequirements?.map(reqId => (
                                                        <Badge key={reqId} variant="secondary" className="font-normal">{requirementsMap.get(reqId) || reqId}</Badge>
                                                    ))}
                                                    {college.customRequirements?.map((req, i) => (
                                                        <Badge key={`custom-${i}`} variant="secondary" className="font-normal">{req}</Badge>
                                                    ))}
                                                </>
                                            ) : <p className="text-xs text-muted-foreground">None specified.</p>}
                                        </div>
                                    </div>
                                    <p className="text-sm text-muted-foreground pt-1">Deadline: March 15, 2025</p>
                                </div>
                                <div className="flex flex-col items-start sm:items-end gap-2 shrink-0 pt-2 sm:pt-0">
                                    <p className="text-sm font-medium text-muted-foreground">{displayStatus}</p>
                                    {buttonComponent}
                                </div>
                            </div>
                        </Card>
                    );
                })
            ) : (
                <div className="text-center py-16 text-muted-foreground bg-muted/20 rounded-lg">
                    <Frown className="mx-auto h-12 w-12" />
                    <h3 className="mt-4 text-lg font-semibold">No colleges found</h3>
                    <p className="mt-2 text-sm">Your search returned no results. Try adjusting your filters.</p>
                </div>
            )}
        </div>
      )}
    </div>
  );
}
