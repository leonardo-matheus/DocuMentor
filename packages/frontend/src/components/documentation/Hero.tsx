import { ReactNode } from 'react'

interface HeroProps {
  title: string
  subtitle: string
  projectName?: string
  logos?: {
    primary?: { src: string; alt: string }
    secondary?: { src: string; alt: string }
  }
  meta?: {
    date?: string
    location?: string
    type?: string
  }
  badges?: Array<{ text: string; icon?: string }>
  highlights?: Array<{ label: string; value: string; icon?: string }>
  children?: ReactNode
}

export default function Hero({ title, subtitle, projectName, logos, meta, badges, highlights, children }: HeroProps) {
  return (
    <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden gradient-hero text-white">
      {/* Background Effects */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-10 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
      </div>
      
      <div className="relative z-10 text-center max-w-4xl mx-auto px-6 py-16">
        {/* Project Name Badge */}
        {projectName && (
          <div className="mb-6 animate-fade-in-down">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-semibold">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              {projectName}
            </span>
          </div>
        )}
        
        {/* Logos */}
        {logos && (
          <div className="flex items-center justify-center gap-6 mb-8 animate-fade-in-down">
            {logos.primary && (
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 shadow-lg hover:scale-105 transition-transform">
                <img 
                  src={logos.primary.src} 
                  alt={logos.primary.alt} 
                  className="h-16 w-auto object-contain"
                />
              </div>
            )}
            {logos.secondary && (
              <>
                <span className="text-4xl font-bold opacity-80">+</span>
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 shadow-lg hover:scale-105 transition-transform">
                  <img 
                    src={logos.secondary.src} 
                    alt={logos.secondary.alt} 
                    className="h-16 w-auto object-contain"
                  />
                </div>
              </>
            )}
          </div>
        )}
        
        {/* Title */}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 animate-fade-in-up leading-tight">
          {title}
        </h1>
        
        {/* Subtitle */}
        <p className="text-lg md:text-xl opacity-90 max-w-2xl mx-auto mb-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          {subtitle}
        </p>
        
        {/* Badges */}
        {badges && badges.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-3 mb-8 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            {badges.map((badge, i) => (
              <span key={i} className="inline-flex items-center gap-2 px-4 py-2 bg-white/15 backdrop-blur-sm rounded-lg text-sm font-medium">
                {badge.icon && <span>{badge.icon}</span>}
                {badge.text}
              </span>
            ))}
          </div>
        )}
        
        {/* Highlights */}
        {highlights && highlights.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-6 mb-8 animate-fade-in-up" style={{ animationDelay: '0.35s' }}>
            {highlights.map((h, i) => (
              <div key={i} className="text-center px-4">
                <div className="text-2xl font-bold">{h.icon || ''} {h.value}</div>
                <div className="text-sm opacity-80">{h.label}</div>
              </div>
            ))}
          </div>
        )}
        
        {/* Meta Info */}
        {meta && (
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm opacity-80 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            {meta.date && (
              <div className="flex items-center gap-2">
                <span>📅</span>
                <span>{meta.date}</span>
              </div>
            )}
            {meta.location && (
              <div className="flex items-center gap-2">
                <span>📍</span>
                <span>{meta.location}</span>
              </div>
            )}
            {meta.type && (
              <div className="flex items-center gap-2">
                <span>👥</span>
                <span>{meta.type}</span>
              </div>
            )}
          </div>
        )}
        
        {children}
      </div>
    </section>
  )
}
