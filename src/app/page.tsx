
import Image from 'next/image';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';
import { LoginForm } from '@/components/auth/login-form';
import { getColleges } from './actions/colleges';
import { getPlatformSettings } from './actions/settings';
import { HomeRedirect } from '@/components/auth/home-redirect';

export default async function HomePage() {
  const allColleges = await getColleges(false); // Fetch all colleges
  const settings = await getPlatformSettings();

  const featuredColleges = allColleges.filter(college => 
    settings.featuredColleges.includes(college.id) && college.isPublished
  );

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <HomeRedirect />
      <Header />
      <main className="flex-grow">
        <section className="relative py-20 md:py-32 text-center bg-background">
          <div className="absolute inset-0 opacity-40" style={{ backgroundImage: "url('https://www.collegiate-ac.com/propeller/uploads/sites/2/2021/03/Cambridge-University-Lawn-1450x993.jpg')", backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
          <div className="container relative mx-auto px-4">
            <h1 className="font-headline text-4xl font-bold tracking-tight text-primary sm:text-5xl md:text-6xl">
              Connect Your Future with COLLAPP
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-lg leading-8 text-foreground/80">
              COLLAPP makes college applications seamless for students and school representatives. Discover, apply, and manage with ease.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link href="/signup">
                <Button size="lg" className="shadow-md hover:shadow-lg transition-shadow">
                  Sign Up Now
                </Button>
              </Link>
              <Link href="/#login-section" scroll={true}>
                <Button size="lg" variant="outline" className="shadow-md hover:shadow-lg transition-shadow">
                  Login <span aria-hidden="true" className="ml-1.5">&rarr;</span>
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section id="universities-section" className="py-16 sm:py-24 bg-muted/40">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="font-headline text-3xl font-bold tracking-tight text-primary sm:text-4xl">
                Featured Universities
              </h2>
              <p className="mt-4 text-lg text-foreground/70">
                Explore and apply to these renowned institutions through COLLAPP.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {featuredColleges.map((uni) => (
                <Link key={uni.id} href={uni.url || '#'} target="_blank" rel="noopener noreferrer" className="block hover:no-underline focus:outline-none focus:ring-2 focus:ring-primary rounded-xl">
                  <Card className="flex flex-col h-full overflow-hidden rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 bg-card text-card-foreground border-border">
                    <div className="relative h-48 w-full bg-card-foreground/5 p-4">
                      <Image src={uni.logoUrl} alt={`${uni.name} logo`} fill sizes="100vw" className="object-contain" data-ai-hint="university logo" />
                    </div>
                    <CardHeader className="text-center">
                      <CardTitle className="font-headline text-xl text-card-foreground">{uni.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow">
                      <CardDescription className="text-card-foreground/80 text-sm">{uni.description}</CardDescription>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
             {featuredColleges.length === 0 && (
                <p className="text-center text-muted-foreground">No featured universities are available at the moment. Please check back later!</p>
            )}
            <div className="mt-12 text-center">
              <Link href="/colleges">
                <Button size="lg" variant="outline" className="shadow-md hover:shadow-lg transition-shadow">
                  View All Partner Universities
                </Button>
              </Link>
            </div>
          </div>
        </section>
        
        <section className="py-16 sm:py-24 bg-background">
          <div className="container mx-auto px-4">
            <div className="lg:grid lg:grid-cols-2 lg:items-center lg:gap-12">
              <div>
                <h2 className="font-headline text-3xl font-bold tracking-tight text-primary sm:text-4xl">
                  Unlock Your Potential
                </h2>
                <p className="mt-4 text-lg text-foreground/70">
                  COLLAPP offers a suite of tools designed to empower both students and institutions in the college admission process.
                </p>
                <ul className="mt-8 space-y-4">
                  <li className="flex items-start">
                    <CheckCircle className="h-6 w-6 text-accent flex-shrink-0 mr-3 mt-1" />
                    <span className="text-foreground/90">Personalized dashboards for easy tracking.</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-6 w-6 text-accent flex-shrink-0 mr-3 mt-1" />
                    <span className="text-foreground/90">Direct communication channels.</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-6 w-6 text-accent flex-shrink-0 mr-3 mt-1" />
                    <span className="text-foreground/90">Secure document handling.</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-6 w-6 text-accent flex-shrink-0 mr-3 mt-1" />
                    <span className="text-foreground/90">Comprehensive school profiles.</span>
                  </li>
                </ul>
              </div>
              <div className="mt-10 lg:mt-0">
                <Image
                  src="https://www.princetoncollegeconsulting.net/hubfs/pic-00.jpg"
                  alt="Students collaborating"
                  width={600}
                  height={450}
                  className="rounded-xl shadow-xl object-cover"
                  data-ai-hint="students collaborating"
                />
              </div>
            </div>
          </div>
        </section>

        <section id="login-section" className="py-16 sm:py-24 bg-muted/40 scroll-mt-20">
          <div className="container mx-auto px-4 flex flex-col items-center">
            <div className="text-center mb-12">
                <h2 className="font-headline text-3xl font-bold tracking-tight text-primary sm:text-4xl">
                Access Your COLLAPP Portal
                </h2>
                <p className="mt-4 text-lg text-foreground/70">
                Sign in to continue your journey with COLLAPP.
                </p>
            </div>
            <LoginForm /> 
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
