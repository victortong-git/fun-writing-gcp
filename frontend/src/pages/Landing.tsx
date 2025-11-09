import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { BookOpen, Zap, Award, Users, ArrowRight, CheckCircle, Menu, X } from 'lucide-react'
import { useAuth } from '../hooks'

export const Landing = () => {
  const navigate = useNavigate()
  const { isUserAuthenticated, isAdminAuthenticated } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    if (isUserAuthenticated) {
      navigate('/dashboard')
    } else if (isAdminAuthenticated) {
      navigate('/admin/dashboard')
    }
  }, [isUserAuthenticated, isAdminAuthenticated, navigate])

  return (
    <div className="bg-white">
      {/* Navigation */}
      <nav className="px-4 sm:px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-7 h-7 sm:w-8 sm:h-8 text-primary-600" />
            <span className="text-xl sm:text-2xl font-bold text-slate-900">Fun Writing</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <button
              onClick={() => navigate('/login')}
              className="px-6 py-2 text-primary-600 font-semibold hover:bg-primary-50 rounded-lg transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('/signup')}
              className="px-6 py-2 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors hidden"
            >
              Get Started
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-slate-700 hover:bg-slate-100 rounded-lg"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 space-y-2">
            <button
              onClick={() => {
                navigate('/login')
                setIsMobileMenuOpen(false)
              }}
              className="w-full px-6 py-3 text-primary-600 font-semibold hover:bg-primary-50 rounded-lg transition-colors text-center"
            >
              Sign In
            </button>
            <button
              onClick={() => {
                navigate('/signup')
                setIsMobileMenuOpen(false)
              }}
              className="w-full px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors text-center hidden"
            >
              Get Started
            </button>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-20 text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-4 sm:mb-6">
          Learn to Write with <span className="text-primary-600">Fun</span>
        </h1>
        <p className="text-base sm:text-lg md:text-xl text-slate-600 mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
          Join thousands of young writers improving their skills through engaging prompts, AI-powered feedback, and a supportive community.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 px-4">
          <button
            onClick={() => navigate('/signup')}
            className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center space-x-2 hidden"
          >
            <span>Start Writing</span>
            <ArrowRight className="w-5 h-5" />
          </button>
          <button
            onClick={() => navigate('/login')}
            className="w-full sm:w-auto px-6 sm:px-8 py-3 border-2 border-primary-600 text-primary-600 font-semibold rounded-lg hover:bg-primary-50 transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-slate-900 mb-12 text-center">Why Choose Fun Writing?</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="bg-white rounded-xl p-6 shadow-md">
              <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Smart Prompts</h3>
              <p className="text-slate-600">
                Get age-appropriate writing prompts personalized for your skill level and interests.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-xl p-6 shadow-md">
              <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">AI Feedback</h3>
              <p className="text-slate-600">
                Receive instant, detailed feedback on grammar, spelling, and creativity from advanced AI.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-xl p-6 shadow-md">
              <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Award className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Earn Rewards</h3>
              <p className="text-slate-600">
                Unlock achievements, earn credits, and level up as you improve your writing skills.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white rounded-xl p-6 shadow-md">
              <div className="bg-orange-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Community</h3>
              <p className="text-slate-600">
                Connect with other young writers, share your work, and learn from each other.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-slate-900 mb-12 text-center">How It Works</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Step 1 */}
          <div className="text-center">
            <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-primary-600">1</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Choose a Theme</h3>
            <p className="text-slate-600">
              Select from 20 different writing themes that match your interests and age group.
            </p>
          </div>

          {/* Step 2 */}
          <div className="text-center">
            <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-primary-600">2</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Get a Prompt</h3>
            <p className="text-slate-600">
              Receive a customized prompt with instructions, word count targets, and tips.
            </p>
          </div>

          {/* Step 3 */}
          <div className="text-center">
            <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-primary-600">3</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Write & Get Feedback</h3>
            <p className="text-slate-600">
              Submit your writing and get detailed feedback on how to improve.
            </p>
          </div>
        </div>
      </div>

      {/* Benefits */}
      <div className="bg-gradient-to-br from-primary-50 to-primary-100 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-slate-900 mb-12 text-center">Student Benefits</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex space-x-4">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-slate-900">Improve Writing Skills</h4>
                <p className="text-slate-600">Progressive practice with instant feedback</p>
              </div>
            </div>

            <div className="flex space-x-4">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-slate-900">Boost Confidence</h4>
                <p className="text-slate-600">Celebrate achievements and track progress</p>
              </div>
            </div>

            <div className="flex space-x-4">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-slate-900">Have Fun</h4>
                <p className="text-slate-600">Engaging prompts across 20 exciting themes</p>
              </div>
            </div>

            <div className="flex space-x-4">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-slate-900">Learn from AI</h4>
                <p className="text-slate-600">Advanced feedback powered by AI technology</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-6 py-20 text-center">
        <h2 className="text-3xl font-bold text-slate-900 mb-6">Ready to Start Your Writing Journey?</h2>
        <p className="text-xl text-slate-600 mb-8">
          Join thousands of students improving their writing skills with Fun Writing.
        </p>
        <button
          onClick={() => navigate('/signup')}
          className="px-8 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors inline-flex items-center space-x-2 hidden"
        >
          <span>Get Started Free</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p>&copy; {new Date().getFullYear()} C6 Fun Writing. All rights reserved.</p>
          <p className="text-sm mt-2">Transforming stories into visual art.</p>
        </div>
      </footer>
    </div>
  )
}
