"use client";

import { useState, useEffect, useCallback } from "react";
import { Quote, Star, ArrowLeft, ArrowRight } from "lucide-react";

const testimonials = [
  {
    name: "Ahmad Fauzi",
    role: "WIRASWASTA",
    initial: "A",
    text: "Badan terasa jauh lebih ringan setelah rutin bekam di sini. Terapisnya ramah dan tempatnya sangat bersih. Sangat direkomendasikan untuk siapa pun yang mencari kesehatan sunnah yang profesional!"
  },
  {
    name: "Budi Santoso",
    role: "PEGAWAI NEGERI",
    initial: "B",
    text: "Pijat refleksinya sangat luar biasa. Otot-otot yang tegang setelah seharian bekerja di kantor langsung rileks. Tempatnya juga sangat nyaman dan mengedepankan privasi."
  },
  {
    name: "Siti Nuraini",
    role: "IBU RUMAH TANGGA",
    initial: "S",
    text: "Pelayanan sangat memuaskan, tempat terpisah khusus wanita bikin nyaman banget. Bakal langganan terus di sini untuk menjaga kebugaran tubuh sehari-hari."
  },
  {
    name: "Ridwan Kamil",
    role: "KARYAWAN SWASTA",
    initial: "R",
    text: "Awalnya takut untuk mencoba bekam, tapi terapis di sini sangat edukatif dan sabar menjelaskan prosedurnya. Sama sekali tidak sakit dan efeknya langsung terasa di badan."
  }
];

export function TestimonialCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const next = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  }, []);

  const prev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      next();
    }, 6000);
    return () => clearInterval(timer);
  }, [next]);

  return (
    <div className="relative w-full overflow-hidden py-10">
      
      {/* Decorative large quote in background */}
      <div className="absolute top-0 right-10 text-accent/10 pointer-events-none">
         <Quote className="w-32 h-32 md:w-48 md:h-48 transform rotate-12" />
      </div>

      <div className="relative h-[450px] md:h-[400px] flex items-center justify-center">
        {testimonials.map((testimonial, index) => {
          // Calculate relative position (-2, -1, 0, 1, 2)
          let offset = index - currentIndex;
          if (offset < -2) offset += testimonials.length;
          if (offset > 2) offset -= testimonials.length;

          // Determine styles based on offset
          const isActive = offset === 0;
          
          let translateX = '0%';
          let scale = 1;
          let zIndex = 10;
          let opacity = 1;

          if (offset === -1) {
            translateX = '-110%'; // Or use pixel values like '-120%'
            scale = 0.9;
            zIndex = 0;
            opacity = 0.5;
          } else if (offset === 1) {
            translateX = '110%';
            scale = 0.9;
            zIndex = 0;
            opacity = 0.5;
          } else if (offset < -1 || offset > 1) {
             opacity = 0;
             scale = 0.5;
             translateX = offset < 0 ? '-200%' : '200%';
             zIndex = -10;
          }

          return (
            <div 
              key={index}
              className="absolute w-[95%] max-w-3xl transition-all duration-700 ease-in-out"
              style={{
                transform: `translateX(${translateX}) scale(${scale})`,
                zIndex,
                opacity,
                pointerEvents: isActive ? 'auto' : 'none'
              }}
            >
              {/* Card Container exactly matching screenshot: Solid dark background, rounded large corners */}
              <div className={`bg-[#181c25] rounded-[2rem] p-8 md:p-12 shadow-2xl relative text-white flex flex-col md:flex-row gap-8 md:gap-12 items-center md:items-stretch h-full`}>
                  
                  {/* Avatar & Info (Left Column) */}
                  <div className="flex flex-col items-center justify-center text-center w-full md:w-[30%] md:border-r border-slate-700/50 md:pr-8 shrink-0">
                    <div className="w-24 h-24 rounded-full bg-[#3b82f6] shadow-lg flex items-center justify-center text-4xl font-extrabold mb-6 text-white">
                      {testimonial.initial}
                    </div>
                    <h3 className="text-2xl font-bold mb-2 leading-tight">{testimonial.name}</h3>
                    <p className="text-[#f59e0b] tracking-wider font-bold text-xs mb-4">{testimonial.role}</p>
                    <div className="flex gap-1 justify-center">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="h-5 w-5 fill-[#f59e0b] text-[#f59e0b]" />
                        ))}
                    </div>
                  </div>

                  {/* Quote Content (Right Column) */}
                  <div className="relative w-full md:w-[70%] flex flex-col justify-center pb-12 md:pb-0">
                    {/* Large quote watermark */}
                    <div className="absolute -top-4 -left-6 text-slate-600/30 opacity-50 select-none pointer-events-none">
                       <Quote className="h-16 w-16 fill-current" />
                    </div>
                    
                    <p className="text-lg md:text-xl font-light leading-relaxed text-gray-200 mt-2 relative z-10 text-center md:text-left">
                        "{testimonial.text}"
                    </p>

                    {/* Navigation Buttons inside the card matching screenshot */}
                    {isActive && (
                      <div className="absolute -bottom-4 right-0 md:bottom-0 md:right-0 flex gap-4 mt-8">
                         <button 
                           onClick={prev}
                           className="w-12 h-12 rounded-full bg-[#232936] hover:bg-[#2a3040] flex items-center justify-center text-white transition-all duration-300 border border-slate-700/50"
                           aria-label="Previous Testimonial"
                         >
                             <ArrowLeft className="h-5 w-5" />
                         </button>
                         <button 
                           onClick={next}
                           className="w-12 h-12 rounded-full bg-[#232936] hover:bg-[#2a3040] flex items-center justify-center text-white transition-all duration-300 border border-slate-700/50"
                           aria-label="Next Testimonial"
                         >
                             <ArrowRight className="h-5 w-5" />
                         </button>
                      </div>
                    )}
                  </div>

              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
