// Router entrypoint rendered from `main.tsx`
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./pages/Layout";
import MainPage from "./pages/MainPage";
import ChatPage from "./pages/ChatPage";
import MyPage from "./pages/MyPage";
import LoginPage from "./pages/LoginPage";
import BusinessPage from "./pages/BusinessPage";
import ReportPage from "./pages/ReportPage";
import DiagnosisPage from "./pages/DiagnosisPage";
import NotFoundPage from "./pages/NotFoundPage";
import CounselPage from "./pages/counsel/CounselPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<MainPage />} />
          <Route path="counsel" element={<CounselPage />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="mypage" element={<MyPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="business" element={<BusinessPage />} />
          <Route path="report" element={<ReportPage />} />
          <Route path="diagnosis" element={<DiagnosisPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}