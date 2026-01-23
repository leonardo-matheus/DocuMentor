interface FooterProps {
  logos?: { src: string; alt: string }[]
  date?: string
  location?: string
  copyright?: string
}

export default function Footer({ logos, date, location, copyright }: FooterProps) {
  return (
    <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-16 px-6">
      <div className="max-w-4xl mx-auto text-center">
        {/* Logos */}
        {logos && logos.length > 0 && (
          <div className="flex items-center justify-center gap-6 mb-8">
            {logos.map((logo, idx) => (
              <div key={idx} className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <img
                  src={logo.src}
                  alt={logo.alt}
                  className="h-10 w-auto object-contain filter brightness-0 invert"
                />
              </div>
            ))}
          </div>
        )}
        
        {/* Info */}
        <div className="space-y-2 text-gray-300">
          {date && <p>{date}</p>}
          {location && <p>{location}</p>}
        </div>
        
        {/* Copyright */}
        {copyright && (
          <p className="mt-8 text-gray-500 text-sm">{copyright}</p>
        )}
      </div>
    </footer>
  )
}
