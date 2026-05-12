// Router entrypoint rendered from `main.tsx`
import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import DevOnlyRoute from "./components/DevOnlyRoute";

const Layout = lazy(() => import("./pages/Layout"));
const MainPage = lazy(() => import("./pages/MainPage"));
const MyPage = lazy(() => import("./pages/MyPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage.tsx"));
const ReportPage = lazy(() => import("./pages/ReportPage"));
const AnalysisPage = lazy(() => import("./pages/AnalysisPage"));
const SessionAnalysisPage = lazy(() => import("./pages/SessionAnalysisPage"));
const AnalysisHubPage = lazy(() => import("./pages/AnalysisHubPage"));
const ContentsPage = lazy(() => import("./pages/ContentsPage"));
const ContentDetailPage = lazy(() => import("./pages/ContentDetailPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));
const CounselPage = lazy(() => import("./pages/counsel/CounselPage"));
const CounselTestPage = lazy(() => import("./pages/counsel/CounselTestPage.tsx"));
const CounselWaitingPage = lazy(() => import("./pages/CounselWaitingPage"));
const TestPosePage = lazy(() => import("./pages/TestPosePage"));
const TestMicPage = lazy(() => import("./pages/TestMicPage"));
const TestTtsSampleBuilderPage = lazy(() => import("./pages/TestTtsSampleBuilderPage"));

export default function App() {
  // Global scroll listener for custom auto-hiding scrollbar
  useEffect(() => {
    const scrollTimeouts = new WeakMap<EventTarget, NodeJS.Timeout>();

    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      
      // Target could be document in some cases, so fallback to documentElement
      const element = target === document ? document.documentElement : target;

      // Only apply to actual Elements
      if (!(element instanceof Element)) return;

      element.classList.add('is-scrolling');

      if (scrollTimeouts.has(element)) {
        clearTimeout(scrollTimeouts.get(element));
      }

      const timeoutId = setTimeout(() => {
        element.classList.remove('is-scrolling');
      }, 800);

      scrollTimeouts.set(element, timeoutId);
    };

    // Use capture phase (true) to catch all scroll events in the DOM
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, []);

  return (
    <BrowserRouter>
      <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-sm text-stone-500">Loading...</div>}>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<MainPage />} />
            <Route path="counsel/prepare" element={<ProtectedRoute><CounselWaitingPage /></ProtectedRoute>} />
            <Route path="counsel" element={<ProtectedRoute><CounselPage /></ProtectedRoute>} />
            <Route path="counsel/records" element={<ProtectedRoute><AnalysisHubPage /></ProtectedRoute>} />
            <Route path="counsel/records/:sessionId" element={<ProtectedRoute><SessionAnalysisPage /></ProtectedRoute>} />
            <Route path="mypage" element={<ProtectedRoute><MyPage /></ProtectedRoute>} />
            <Route path="login" element={<LoginPage />} />
            <Route path="forgot-password" element={<ForgotPasswordPage />} />
            <Route path="report" element={<ProtectedRoute><ReportPage /></ProtectedRoute>} />
            <Route path="analysis" element={<ProtectedRoute><AnalysisPage /></ProtectedRoute>} />
            <Route path="analysis/session/:sessionId" element={<ProtectedRoute><SessionAnalysisPage /></ProtectedRoute>} />
            <Route path="contents" element={<ContentsPage />} />
            <Route path="contents/:id" element={<ContentDetailPage />} />
            <Route path="test" element={<DevOnlyRoute><TestPosePage /></DevOnlyRoute>} />
            <Route path="test/mic" element={<DevOnlyRoute><TestMicPage /></DevOnlyRoute>} />
            <Route path="test/counsel" element={<DevOnlyRoute><CounselTestPage /></DevOnlyRoute>} />
            <Route path="test/tts-builder" element={<DevOnlyRoute><TestTtsSampleBuilderPage /></DevOnlyRoute>} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}