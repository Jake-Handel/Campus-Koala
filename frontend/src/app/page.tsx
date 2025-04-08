import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden backdrop-blur-sm">
        <div className="absolute inset-0 blur-3xl pointer-events-none"></div>
        <div className="px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-8 shadow-xl border border-gray-100 max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 mb-8 animate-fade-in duration-600">
              Campus Koala
            </h1>
            <p className="text-xl md:text-3xl text-gray-600 mb-12 max-w-3xl mx-auto animate-fade-in duration-600 delay-200">
              Streamline your academic journey with our intelligent study management platform
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 animate-fade-in duration-600 delay-400">
              <Link
                href="/login"
                className="inline-flex items-center px-8 py-4 border border-transparent text-base font-medium rounded-xl text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transform hover:scale-105 transition-all shadow-lg hover:shadow-xl"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center px-8 py-4 border border-gray-300 text-base font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transform hover:scale-105 transition-all shadow-sm hover:shadow-md"
              >
                Create Account
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white/50 backdrop-blur-sm">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Key Features</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Discover what makes Campus Koala the perfect study companion
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-8 shadow-xl border border-gray-100 hover:shadow-xl transition-all">
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Smart Scheduling</h3>
              <p className="text-gray-600">Automatically create and optimize your study schedule based on your preferences and deadlines</p>
            </div>
            <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-8 shadow-xl border border-gray-100 hover:shadow-xl transition-all">
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">AI Study Assistant</h3>
              <p className="text-gray-600">Get personalized study recommendations and assistance from our intelligent AI tutor</p>
            </div>
            <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-8 shadow-xl border border-gray-100 hover:shadow-xl transition-all">
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Progress Tracking</h3>
              <p className="text-gray-600">Monitor your academic progress with detailed analytics and performance metrics</p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gradient-to-b from-indigo-50 to-purple-50/10">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Why Choose Campus Koala?</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Join thousands of students who have transformed their study habits
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-8 shadow-xl border border-gray-100">
              <div className="flex items-center gap-4">
                <div className="bg-indigo-600/10 p-3 rounded-full">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Time Management</h3>
                  <p className="text-gray-600">Optimize your study time with intelligent scheduling and prioritization</p>
                </div>
              </div>
            </div>
            <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-8 shadow-xl border border-gray-100">
              <div className="flex items-center gap-4">
                <div className="bg-purple-600/10 p-3 rounded-full">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Assissted Learning</h3>
                  <p className="text-gray-600">Get study help from our AI</p>
                </div>
              </div>
            </div>
            <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-8 shadow-xl border border-gray-100">
              <div className="flex items-center gap-4">
                <div className="bg-indigo-600/10 p-3 rounded-full">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Performance Tracking</h3>
                  <p className="text-gray-600">Track your progress and identify areas for improvement</p>
                </div>
              </div>
            </div>
            <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-8 shadow-xl border border-gray-100">
              <div className="flex items-center gap-4">
                <div className="bg-purple-600/10 p-3 rounded-full">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Organisation</h3>
                  <p className="text-gray-600">Our software is designed to help you stay organised and focused</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white/50 backdrop-blur-sm">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">What Students Say</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Real success stories from our users
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-8 shadow-xl border border-gray-100">
              <div className="text-center">
                <p className="text-gray-600 mb-4">
                  "Campus Koala has revolutionized the way I approach my studies. The AI assistant is incredibly helpful and the analytics have helped me improve my grades significantly."
                </p>
                <div className="flex items-center justify-center gap-2">
                  <div className="bg-indigo-600/10 p-2 rounded-full">
                    <svg className="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Sarah Johnson</h3>
                    <p className="text-gray-600">Computer Science Student</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-8 shadow-xl border border-gray-100">
              <div className="text-center">
                <p className="text-gray-600 mb-4">
                  "The time management features have been a game changer for me. I finally feel in control of my study schedule and can balance all my commitments effectively."
                </p>
                <div className="flex items-center justify-center gap-2">
                  <div className="bg-purple-600/10 p-2 rounded-full">
                    <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Michael Chen</h3>
                    <p className="text-gray-600">Business Student</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-8 shadow-xl border border-gray-100">
              <div className="text-center">
                <p className="text-gray-600 mb-4">
                  "I've never felt more organized in my academic life. The progress tracking features help me stay motivated and see my improvement over time."
                </p>
                <div className="flex items-center justify-center gap-2">
                  <div className="bg-indigo-600/10 p-2 rounded-full">
                    <svg className="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Emily Wilson</h3>
                    <p className="text-gray-600">Medicine Student</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-semibold mb-4">Campus Koala</h3>
              <p className="text-gray-400">
                Transform your academic journey with our intelligent study management platform
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><Link href="/login" className="text-gray-400 hover:text-white">Sign In</Link></li>
                <li><Link href="/register" className="text-gray-400 hover:text-white">Create Account</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-800 text-center">
            <p className="text-gray-400"> 2025 Campus Koala. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}