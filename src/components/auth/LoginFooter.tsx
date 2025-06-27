
import { Link } from 'react-router-dom'

export function LoginFooter() {
  return (
    <>
      <div className="mt-6 text-center">
        <p className="text-sm text-slate-600">
          Don't have an account?{" "}
          <Link to="/register" className="text-blue-600 hover:underline font-medium">
            Register with invite
          </Link>
        </p>
        <p className="text-xs text-slate-500 mt-2">
          Sales Whisperer is invite-only for enterprise customers
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
