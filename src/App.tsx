import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { CourseEditPage } from './pages/CourseEditPage'
import { CoursePathPage } from './pages/CoursePathPage'
import { CoursePreviewPage } from './pages/CoursePreviewPage'
import { GraphPage } from './pages/GraphPage'
import { HomePage } from './pages/HomePage'
import { PathsPage } from './pages/PathsPage'
import { PersonalizePage } from './pages/PersonalizePage'
import { UnitPage } from './pages/UnitPage'

const basename = import.meta.env.BASE_URL.replace(/\/$/, '')

export default function App() {
  return (
    <BrowserRouter basename={basename}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/u/:id" element={<UnitPage />} />
        <Route path="/personalize" element={<PersonalizePage />} />
        <Route path="/personalize/preview" element={<CoursePreviewPage />} />
        <Route path="/courses/:courseId/edit" element={<CourseEditPage />} />
        <Route path="/courses/:courseId" element={<CoursePathPage />} />
        <Route path="/paths" element={<PathsPage />} />
        <Route path="/paths/:sectionId" element={<PathsPage />} />
        <Route path="/graph" element={<GraphPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
