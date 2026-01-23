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
    <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden text-white">
      {/* Modern Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950" />
      
      {/* Animated Mesh Gradient */}
      <div className="absolute inset-0 opacity-40">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-indigo-500/30 via-transparent to-transparent" />
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-purple-500/30 via-transparent to-transparent" />
      </div>
      
      {/* Floating Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-[10%] w-64 h-64 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-[10%] w-80 h-80 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-indigo-500/10 to-violet-500/10 rounded-full blur-3xl animate-pulse" />
      </div>
      
      {/* Grid Pattern Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(to right, white 1px, transparent 1px),
            linear-gradient(to bottom, white 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />
      
      {/* Noise Texture */}
      <div className="absolute inset-0 opacity-[0.015] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIzMDAiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iMSIvPjwvc3ZnPg==')]" />
      
      <div className="relative z-10 text-center max-w-5xl mx-auto px-6 py-20">
        {/* Project Name Badge */}
        {projectName && (
          <div className="mb-8 animate-fade-in-down">
            <span className="inline-flex items-center gap-3 px-5 py-2.5 bg-white/10 backdrop-blur-md rounded-full text-sm font-semibold border border-white/20 shadow-lg shadow-black/10">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              {projectName}
            </span>
          </div>
        )}
        
        {/* Logos */}
        {logos && (
          <div className="flex items-center justify-center gap-8 mb-10 animate-fade-in-down" style={{ animationDelay: '0.1s' }}>
            {logos.primary && (
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 shadow-2xl shadow-black/20 border border-white/10 hover:scale-105 hover:bg-white/15 transition-all duration-300">
                <img 
                  src={logos.primary.src} 
                  alt={logos.primary.alt} 
                  className="h-20 w-auto object-contain"
                />
              </div>
            )}
            {logos.secondary && (
              <>
                <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                  <span className="text-2xl font-bold opacity-80">+</span>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 shadow-2xl shadow-black/20 border border-white/10 hover:scale-105 hover:bg-white/15 transition-all duration-300">
                  <img 
                    src={logos.secondary.src} 
                    alt={logos.secondary.alt} 
                    className="h-20 w-auto object-contain"
                  />
                </div>
              </>
            )}
          </div>
        )}
        
        {/* Title */}
        <h1 className="text-4xl md:text-5xl lg:text-7xl font-extrabold mb-6 animate-fade-in-up leading-[1.1] tracking-tight">
          <span className="bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent drop-shadow-2xl">
            {title}
          </span>
        </h1>
        
        {/* Subtitle */}
        <p className="text-lg md:text-xl lg:text-2xl text-white/80 max-w-3xl mx-auto mb-10 animate-fade-in-up leading-relaxed" style={{ animationDelay: '0.2s' }}>
          {subtitle}
        </p>
        
        {/* Badges */}
        {badges && badges.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-3 mb-10 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            {badges.map((badge, i) => (
              <span 
                key={i} 
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-sm rounded-xl text-sm font-medium border border-white/10 hover:border-white/20 hover:bg-white/15 transition-all duration-300"
              >
                {badge.icon && <span className="text-lg">{badge.icon}</span>}
                {badge.text}
              </span>
            ))}
          </div>
        )}
        
        {/* Highlights */}
        {highlights && highlights.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-8 mb-10 animate-fade-in-up" style={{ animationDelay: '0.35s' }}>
            {highlights.map((h, i) => (
              <div key={i} className="text-center px-6 py-4 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
                <div className="text-3xl font-bold mb-1 bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                  {h.icon && <span className="mr-2">{h.icon}</span>}
                  {h.value}
                </div>
                <div className="text-sm text-white/60">{h.label}</div>
              </div>
            ))}
          </div>
        )}
        
        {/* Meta Info */}
        {meta && (
          <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-white/60 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            {meta.date && (
              <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg border border-white/10">
                <span>📅</span>
                <span>{meta.date}</span>
              </div>
            )}
            {meta.location && (
              <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg border border-white/10">
                <span>📍</span>
                <span>{meta.location}</span>
              </div>
            )}
            {meta.type && (
              <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg border border-white/10">
                <span>📋</span>
                <span>{meta.type}</span>
              </div>
            )}
          </div>
        )}
        
        {children}
      </div>
      
      {/* Bottom Gradient Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent" />
    </section>
  )
}
