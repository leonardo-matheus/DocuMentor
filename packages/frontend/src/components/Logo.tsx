interface LogoProps {
  className?: string
  size?: number
  showText?: boolean
}

export default function Logo({ className = '', size = 40, showText = true }: LogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 64 64" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#667eea"/>
            <stop offset="50%" stopColor="#764ba2"/>
            <stop offset="100%" stopColor="#6B8DD6"/>
          </linearGradient>
          <linearGradient id="docGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff"/>
            <stop offset="100%" stopColor="#e0e7ff"/>
          </linearGradient>
        </defs>
        
        {/* Background Circle */}
        <circle cx="32" cy="32" r="30" fill="url(#bgGradient)"/>
        
        {/* Document Shape */}
        <path d="M20 14h16l10 10v26a2 2 0 01-2 2H20a2 2 0 01-2-2V16a2 2 0 012-2z" fill="url(#docGradient)"/>
        
        {/* Document Fold */}
        <path d="M36 14v8a2 2 0 002 2h8" fill="none" stroke="#667eea" strokeWidth="2" strokeLinecap="round"/>
        
        {/* AI Sparkle */}
        <path d="M40 38l2.5-5 2.5 5 5 2.5-5 2.5-2.5 5-2.5-5-5-2.5z" fill="#fbbf24"/>
        
        {/* Text Lines */}
        <rect x="24" y="30" width="16" height="2" rx="1" fill="#667eea" opacity="0.6"/>
        <rect x="24" y="36" width="12" height="2" rx="1" fill="#667eea" opacity="0.4"/>
        <rect x="24" y="42" width="14" height="2" rx="1" fill="#667eea" opacity="0.3"/>
      </svg>
      
      {showText && (
        <div className="flex flex-col">
          <span className="font-bold text-lg leading-tight bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
            DocuMentor
          </span>
          <span className="text-xs text-gray-500">by MoveMais</span>
        </div>
      )}
    </div>
  )
}
