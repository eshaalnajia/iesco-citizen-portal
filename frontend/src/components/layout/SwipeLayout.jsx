import { Swiper, SwiperSlide }    from "swiper/react"
import { Pagination, Keyboard }   from "swiper/modules"
import "swiper/css"
import "swiper/css/pagination"

export function SwipeLayout({ slides, className = "" }) {
  return (
    <div className={`relative ${className}`}>
      <Swiper
        modules={[Pagination, Keyboard]}
        pagination={{ clickable: true, dynamicBullets: true }}
        keyboard={{ enabled: true }}
        spaceBetween={0}
        slidesPerView={1}
        style={{ paddingBottom: "2.5rem" }}
      >
        {slides.map((slide, i) => (
          <SwiperSlide key={i}>
            <div className="min-h-[60vh]">
              {slide.content}
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  )
}