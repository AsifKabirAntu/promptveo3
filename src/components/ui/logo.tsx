import Image from "next/image"

interface LogoProps {
  className?: string
  size?: number
}

export function Logo({ className = "", size = 32 }: LogoProps) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Image
        src="/favicon-32x32.png"
        alt="PromptVeo3"
        width={size}
        height={size}
        className="w-auto h-auto"
        style={{ width: `${size}px`, height: `${size}px` }}
      />
    </div>
  )
} 