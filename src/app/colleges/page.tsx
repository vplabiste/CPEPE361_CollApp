
import Image from 'next/image';
import Link from 'next/link';
import { getColleges } from '@/app/actions/colleges';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Frown } from 'lucide-react';
import type { College } from '@/lib/college-schemas';

export const dynamic = 'force-dynamic';

export default async function AllCollegesPage() {
    const allColleges = await getColleges(); // Fetches published colleges by default

    return (
        <div className="flex min-h-screen flex-col bg-background text-foreground">
            <Header />
            <main className="flex-grow py-16 sm:py-24 bg-muted/40">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h1 className="font-headline text-3xl font-bold tracking-tight text-primary sm:text-4xl">
                            All Partner Universities
                        </h1>
                        <p className="mt-4 text-lg text-foreground/70">
                            Explore and apply to these renowned institutions through COLLAPP.
                        </p>
                    </div>

                    {allColleges.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {allColleges.map((college: College) => (
                                <Card key={college.id} className="flex flex-col h-full overflow-hidden rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                                    <div className="relative h-48 w-full bg-card-foreground/5 p-4">
                                        <Image src={college.logoUrl} alt={`${college.name} logo`} fill sizes="100vw" className="object-contain" data-ai-hint="university logo" />
                                    </div>
                                    <CardHeader>
                                        <CardTitle>{college.name}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="flex-grow flex flex-col">
                                        <CardDescription className="flex-grow text-sm">{college.description}</CardDescription>
                                        <div className="pt-4 mt-auto">
                                            <Link href={`/student/colleges/${college.id}`} passHref>
                                                <Button className="w-full">View Details</Button>
                                            </Link>
                                         </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                         <div className="text-center py-16 text-muted-foreground bg-muted/50 rounded-lg">
                            <Frown className="mx-auto h-12 w-12" />
                            <h3 className="mt-4 text-lg font-semibold">No Colleges Found</h3>
                            <p className="mt-2 text-sm">No partner universities have been published yet. Please check back later.</p>
                        </div>
                    )}
                </div>
            </main>
            <Footer />
        </div>
    );
}
