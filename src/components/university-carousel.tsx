'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import Swiper from 'swiper';
import { EffectCoverflow, Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

interface College {
  id: string;
  name: string;
  description: string;
  logoUrl: string;
  url?: string;
  isPublished?: boolean;
}

interface UniversityCarouselProps {
  colleges: College[];
}

export function UniversityCarousel({ colleges }: UniversityCarouselProps) {
  const swiperRef = useRef<Swiper | null>(null);
  const [selectedCollege, setSelectedCollege] = useState<College | null>(colleges[0] || null);

  useEffect(() => {
    if (colleges.length > 0) {
      const swiper: Swiper = new Swiper('.university-swiper', {
        modules: [EffectCoverflow, Navigation, Pagination],
        effect: 'coverflow',
        grabCursor: true,
        centeredSlides: true,
        slidesPerView: 3,
        coverflowEffect: {
          rotate: 50,
          stretch: 0,
          depth: 100,
          modifier: -0.8,
          slideShadows: true,
        },
        loop: true,
        pagination: {
          el: '.swiper-pagination',
          clickable: true,
        },
        navigation: {
          nextEl: '.swiper-button-next',
          prevEl: '.swiper-button-prev',
        },
        breakpoints: {
          320: {
            slidesPerView: 1,
            coverflowEffect: {
              rotate: 30,
              stretch: 0,
              depth: 50,
            },
          },
          640: {
            slidesPerView: 3,
            coverflowEffect: {
              rotate: -40,
              stretch: 0,
              depth: 75,
            },
          },
          1024: {
            slidesPerView: 3,
            coverflowEffect: {
              rotate: 50,
              stretch: 0,
              depth: 100,
            },
          },
        },
        on: {
          slideChange: function (this: Swiper) {
            const activeIndex = this.realIndex;
            setSelectedCollege(colleges[activeIndex]);
          },
        },
      });

      swiperRef.current = swiper;
      setSelectedCollege(colleges[0]);
    }

    return () => {
      if (swiperRef.current) {
        swiperRef.current.destroy();
      }
    };
  }, [colleges]);

  if (colleges.length === 0) return null;

  return (
    <div className="w-full">
      <style>{`
      .university-swiper .swiper-slide:not(.swiper-slide-active) .card-class {
        transform: scale(0.8);
        transition: transform 0.3s ease;
      }
      .university-swiper .swiper-slide-active .card-class {
        transform: scale(1);
        transition: transform 0.3s ease;
      }
      
      /* Move shadow overlays to the card */
      .university-swiper .swiper-slide-shadow-left,
      .university-swiper .swiper-slide-shadow-right {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 10;
      }
      
      .university-swiper .swiper-slide:not(.swiper-slide-active) .swiper-slide-shadow-left,
      .university-swiper .swiper-slide:not(.swiper-slide-active) .swiper-slide-shadow-right {
        transform: scale(0.8);
      }
      `}</style>
      <div className="swiper university-swiper">
        <div className="swiper-wrapper">
          {colleges.map((college) => (
            <div
              key={college.id}
              className="swiper-slide"
            >
              <Link href={college.url || '#'} target="_blank" rel="noopener noreferrer" className="block hover:no-underline focus:outline-none focus:ring-2 focus:ring-primary rounded-xl">
                <Card className="card-class w-full h-56 flex items-center justify-center p-4">
                  <Image
                    src={college.logoUrl}
                    alt={`${college.name} logo`}
                    width={200}
                    height={120}
                    className="object-contain select-none"
                    onDragStart={(e) => e.preventDefault()}
                  />
                </Card>
              </Link>
            </div>
          ))}
        </div>
        <div className="swiper-pagination mt-4"></div>
        <div className="swiper-button-next"></div>
        <div className="swiper-button-prev"></div>
      </div>
      {selectedCollege && (
        <div className="mt-8 text-center">
          <h3 className="text-xl font-semibold">{selectedCollege.name}</h3>
          <p className="text-muted-foreground mt-2">{selectedCollege.description}</p>
        </div>
      )}
    </div>
  );
}
