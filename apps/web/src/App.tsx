import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { ScrollToTop } from './components/ScrollToTop'
import { ExamProvider } from './examContext'
import { About } from './pages/About'
import { Admin } from './pages/Admin'
import { Exam } from './pages/Exam'
import { Home } from './pages/Home'
import { Links } from './pages/Links'
import { Report } from './pages/Report'
import { Search } from './pages/Search'
import { Events } from './pages/Events'
import { Notices } from './pages/Notices'
import { NotFound } from './pages/NotFound'
import { WikiList } from './pages/WikiList'
import { WikiPage } from './pages/WikiPage'
import { Weekly } from './pages/Weekly'

export default function App() {
  return (
    <ExamProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="weekly" element={<Weekly />} />
            <Route path="exam" element={<Exam />} />
            <Route path="wiki" element={<WikiList />} />
            <Route path="wiki/:slug" element={<WikiPage />} />
            <Route path="links" element={<Links />} />
            <Route path="notices" element={<Notices />} />
            <Route path="events" element={<Events />} />
            <Route path="search" element={<Search />} />
            <Route path="about" element={<About />} />
            <Route path="report" element={<Report />} />
            <Route path="admin" element={<Admin />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ExamProvider>
  )
}
