
import { Link } from 'react-router-dom'

export function RegisterFooter() {
  return (
    <>
      <div className="mt-6 text-center">
        <p className="text-sm text-slate-600">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-600 hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>

      <div className="text-center mt-8">
        <Link to="/" className="text-sm text-slate-600 hover:text-slate-900">
          ← Back to Home
        </Link>
      </div>
    </>
  )
}
