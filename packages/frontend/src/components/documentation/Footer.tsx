interface FooterProps {
  logos?: { src: string; alt: string }[]
  date?: string
  location?: string
  copyright?: string
  links?: { label: string; url: string }[]
}

export default function Footer({ logos, date, location, copyright, links }: FooterProps) {
  return (
    <footer className="relative overflow-hidden">
      {/* Main Footer */}
      <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-16 px-6">
        {/* Background Decorations */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
          
          {/* Grid Pattern */}
          <div 
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: `
                linear-gradient(to right, white 1px, transparent 1px),
                linear-gradient(to bottom, white 1px, transparent 1px)
              `,
              backgroundSize: '60px 60px',
            }}
          />
        </div>
        
        <div className="relative z-10 max-w-5xl mx-auto">
          {/* Logos */}
          {logos && logos.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-8 mb-10">
              {logos.map((logo, idx) => (
                <div 
                  key={idx} 
                  className="group bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/10 hover:bg-white/15 hover:border-white/20 transition-all duration-300 hover:scale-105"
                >
                  <img
                    src={logo.src}
                    alt={logo.alt}
                    className="h-12 w-auto object-contain filter brightness-0 invert group-hover:brightness-100 transition-all duration-300"
                  />
                </div>
              ))}
            </div>
          )}
          
          {/* Divider */}
          <div className="flex items-center justify-center gap-4 mb-10">
            <div className="h-px w-20 bg-gradient-to-r from-transparent to-white/20" />
            <div className="w-2 h-2 rounded-full bg-indigo-400" />
            <div className="h-px w-20 bg-gradient-to-l from-transparent to-white/20" />
          </div>
          
          {/* Info */}
          <div className="text-center space-y-3 mb-8">
            {date && (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg border border-white/10 text-gray-300">
                <span>📅</span>
                <span>{date}</span>
              </div>
            )}
            {location && (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg border border-white/10 text-gray-300 ml-4">
                <span>📍</span>
                <span>{location}</span>
              </div>
            )}
          </div>
          
          {/* Links */}
          {links && links.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-6 mb-8">
              {links.map((link, idx) => (
                <a
                  key={idx}
                  href={link.url}
                  className="text-gray-400 hover:text-white transition-colors duration-200 text-sm font-medium"
                >
                  {link.label}
                </a>
              ))}
            </div>
          )}
          
          {/* Copyright */}
          {copyright && (
            <p className="text-center text-gray-500 text-sm">
              {copyright}
            </p>
          )}
        </div>
      </div>
      
      {/* Bottom Bar */}
      <div className="bg-slate-950 py-4 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-center gap-2 text-xs text-gray-500">
          <span>Gerado com</span>
          <span className="text-red-400">❤️</span>
          <span>por</span>
          <span className="font-semibold text-indigo-400">DocuMentor</span>
        </div>
      </div>
    </footer>
  )
}
