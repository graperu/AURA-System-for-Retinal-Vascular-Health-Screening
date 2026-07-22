import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return <main className="not-found"><p className="kicker">404</p><h1>Không tìm thấy trang.</h1><Link to="/dashboard">Trở về tổng quan</Link></main>
}
