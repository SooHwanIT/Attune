import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useState } from "react";
import Header from "../components/Header";

const HEADER_HIDDEN_PATHS = new Set(["/test", "/test/mic", "/test/counsel"]);


export default function Layout() {
  const [isExpanded, setIsExpanded] = useState(false);
  const showTestNavigator = import.meta.env.DEV;
  const location = useLocation();
  const isCounselLiveRoute = location.pathname === "/counsel";
  const showGlobalHeader = !isCounselLiveRoute && !HEADER_HIDDEN_PATHS.has(location.pathname);

  return (
    <div className="h-screen flex flex-col">
      {showGlobalHeader && <Header />}
      <main className="flex-1 bg-white overflow-y-auto">
        <Outlet />
      </main>

      {/* Floating test navigator (bottom-left) */}
      {showTestNavigator && (
        <div className="fixed left-6 bottom-6 z-50">
          {isExpanded ? (
            <div className="bg-white/95 backdrop-blur-sm border border-[#E0E0E0] rounded-[2px] shadow-lg p-2 w-44">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-slate-500 font-medium px-2">Test Navigator</div>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="text-slate-400 hover:text-slate-600 text-lg leading-none px-1"
                >
                  ×
                </button>
              </div>
              <nav className="flex flex-col gap-2">
                <NavLink to="/" end className={({ isActive }) =>
                  `px-3 py-2 rounded-[2px] text-sm text-left ${isActive ? 'bg-[#39A61B] text-white' : 'text-slate-700 hover:bg-[#F4FBEF]'}`
                }>
                  홈
                </NavLink>

                <NavLink to="/test" className={({ isActive }) =>
                  `px-3 py-2 rounded-[2px] text-sm text-left ${isActive ? 'bg-[#39A61B] text-white' : 'text-slate-700 hover:bg-[#F4FBEF]'}`
                }>
                  테스트 포즈
                </NavLink>

                <NavLink to="/test/mic" className={({ isActive }) =>
                  `px-3 py-2 rounded-[2px] text-sm text-left ${isActive ? 'bg-[#39A61B] text-white' : 'text-slate-700 hover:bg-[#F4FBEF]'}`
                }>
                  테스트 마이크
                </NavLink>

                <NavLink to="/test/counsel" className={({ isActive }) =>
                  `px-3 py-2 rounded-[2px] text-sm text-left ${isActive ? 'bg-[#39A61B] text-white' : 'text-slate-700 hover:bg-[#F4FBEF]'}`
                }>
                  테스트 상담
                </NavLink>

                <NavLink to="/mypage" className={({ isActive }) =>
                  `px-3 py-2 rounded-[2px] text-sm text-left ${isActive ? 'bg-[#39A61B] text-white' : 'text-slate-700 hover:bg-[#F4FBEF]'}`
                }>
                  마이페이지
                </NavLink>

                <NavLink to="/analysis" className={({ isActive }) =>
                  `px-3 py-2 rounded-[2px] text-sm text-left ${isActive ? 'bg-[#39A61B] text-white' : 'text-slate-700 hover:bg-[#F4FBEF]'}`
                }>
                  분석
                </NavLink>

              </nav>
            </div>
          ) : (
            <button
              onClick={() => setIsExpanded(true)}
              className="bg-white/95 backdrop-blur-sm border border-[#E0E0E0] rounded-[2px] shadow-lg p-2 w-8 h-8 flex items-center justify-center hover:bg-[#F4FBEF] text-slate-600 text-xs font-bold"
            >
              ☰
            </button>
          )}
        </div>
      )}
    </div>
  );
}
