import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import Landing from './components/Landing'
import Login from './components/Login'
import Register from './components/Register'
import ParseScreen from './components/ParseScreen'
import ResultsPage from './components/ResultsPage'
import ProtectedRoute from './components/ProtectedRoute'
import PublicRoute from './components/PublicRoute'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes - redirect to /parse if already authenticated */}
        <Route
          path="/"
          element={
            <PublicRoute>
              <Landing />
            </PublicRoute>
          }
        />
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />

        {/* Protected routes - redirect to /login if not authenticated */}
        <Route
          path="/parse"
          element={
            <ProtectedRoute>
              <ParseScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/results/:id"
          element={
            <ProtectedRoute>
              <ResultsPage />
            </ProtectedRoute>
          }
        />

        {/* Redirect unknown routes to landing */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
