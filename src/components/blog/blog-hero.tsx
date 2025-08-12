import { Search } from "lucide-react"

export function BlogHero() {
  return (
    <section className="relative overflow-hidden py-20 sm:py-24 lg:py-32">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50" />
      <div className="absolute inset-0 bg-grid-black/[0.02] bg-grid" />
      
      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob" />
      <div className="absolute top-40 right-20 w-32 h-32 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000" />
      <div className="absolute bottom-20 left-1/3 w-24 h-24 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000" />
      
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* Badge */}
          <div className="inline-flex items-center rounded-full bg-gradient-to-r from-blue-100 to-purple-100 px-4 py-2 text-sm font-medium text-blue-800 mb-6">
            <span className="mr-2">📚</span>
            Expert Insights & Resources
          </div>
          
          {/* Main Heading */}
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl lg:text-7xl">
            <span className="block leading-[1.1]">Master the art of</span>
            <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent leading-[1.2]">
              AI video creation
            </span>
          </h1>
          
          {/* Subtitle */}
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-gray-700 sm:text-xl">
            Discover expert insights, tutorials, and best practices for creating stunning Veo 3 videos. 
            From beginner tips to advanced techniques.
          </p>
          

        </div>
      </div>
      
      {/* Custom CSS for blob animation */}
      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </section>
  )
} 