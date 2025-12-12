
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCollegeById } from '@/app/actions/colleges';
import { getPlatformSettings } from '@/app/actions/settings';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { Check, Download, FileText, School, NotebookText, MessageSquare } from 'lucide-react';
import { availableRequirements, type College } from '@/lib/college-schemas';
import type { PlatformSettings } from '@/lib/settings-schemas';
import { ApplyButton } from './apply-button';
import { Skeleton } from '@/components/ui/skeleton';
import { auth } from '@/lib/firebase';
import { getChatId } from '@/lib/utils';

function CollegeDetailsSkeleton() {
  return (
    <div className="w-full space-y-8">
      <Card className="overflow-hidden">
        <Skeleton className="h-48 w-full" />
      </Card>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <div className="space-y-8">
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    </div>
  );
}

export default function CollegeDetailsPage({ params }: { params: { id: string } }) {
  const [college, setCollege] = useState<College | null>(null);
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      try {
        const [collegeData, settingsData] = await Promise.all([
          getCollegeById(params.id),
          getPlatformSettings(),
        ]);
        if (!collegeData) {
          router.push('/404');
          return;
        }
        setCollege(collegeData);
        setSettings(settingsData);
      } catch (error) {
        console.error("Failed to fetch data", error);
      } finally {
        setLoading(false);
      }
    }
    
    const unsubscribe = auth.onAuthStateChanged(user => {
      setCurrentUserId(user?.uid || null);
    });
    
    fetchData();

    return () => unsubscribe();
  }, [params.id, router]);

  const handleStartChat = () => {
    if (!currentUserId || !college?.repUid) return;
    const chatId = getChatId(currentUserId, college.repUid);
    router.push(`/student/messages?chatId=${chatId}`);
  };

  if (loading || !college || !settings) {
    return <CollegeDetailsSkeleton />;
  }

  const requirementsMap = new Map(availableRequirements.map(req => [req.id, req.label]));
  const allRequirements = [
    ...(college.applicationRequirements?.map(reqId => ({ id: reqId, label: requirementsMap.get(reqId) || reqId })) || []),
    ...(college.customRequirements?.map(req => ({ id: req.replace(/\s+/g, '-').toLowerCase(), label: req })) || [])
  ];

  return (
    <div className="w-full space-y-8">
      <Card className="overflow-hidden">
        <div className="relative h-48 w-full bg-muted">
           <Image
            src={college.logoUrl}
            alt={`${college.name} Cover`}
            fill
            className="object-contain p-8"
            data-ai-hint="university logo"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-0 left-0 p-6">
            <h1 className="text-4xl font-bold tracking-tight text-white">{college.name}</h1>
            <p className="text-lg text-white/90">{college.city}, {college.region}</p>
          </div>
        </div>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><School className="h-5 w-5" /> About {college.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{college.description}</p>
              {college.url && (
                <Button asChild variant="link" className="px-0 mt-2">
                  <a href={college.url} target="_blank" rel="noopener noreferrer">Visit Website &rarr;</a>
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><NotebookText className="h-5 w-5" /> Programs Offered</CardTitle>
              <CardDescription>Explore the academic programs available at this institution.</CardDescription>
            </CardHeader>
            <CardContent>
              {college.programs && college.programs.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {college.programs.map((program, index) => (
                    <Badge key={index} variant="secondary">{program}</Badge>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No specific programs listed.</p>
              )}
            </CardContent>
          </Card>

          {college.brochureUrls && college.brochureUrls.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Download className="h-5 w-5" /> Download Brochures</CardTitle>
                <CardDescription>Get more detailed information about the college and its offerings.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {college.brochureUrls.map((url, index) => (
                  <Button asChild variant="outline" key={index} className="w-full justify-start">
                    <a href={url} target="_blank" rel="noopener noreferrer">
                      <FileText className="mr-2 h-4 w-4" />
                      Promotional Brochure {index + 1}
                    </a>
                  </Button>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-8">
            <Card className="sticky top-20">
                <CardHeader>
                    <CardTitle>Application Requirements</CardTitle>
                    <CardDescription>Make sure you have these documents ready.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {allRequirements.length > 0 ? (
                        allRequirements.map(req => (
                            <div key={req.id} className="flex items-center gap-3">
                                <Check className="h-5 w-5 text-success" />
                                <span className="text-sm">{req.label}</span>
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-muted-foreground">No specific requirements listed.</p>
                    )}
                    <div className="pt-4 space-y-2">
                        <ApplyButton 
                            collegeId={college.id} 
                            requirements={allRequirements}
                            applicationsOpen={settings.applicationsOpen}
                            programs={college.programs || []}
                        />
                        <Button variant="outline" className="w-full" onClick={handleStartChat} disabled={!currentUserId}>
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Message Representative
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
