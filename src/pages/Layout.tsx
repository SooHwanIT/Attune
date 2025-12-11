import { NavLink, Outlet } from "react-router-dom";
import React from "react";

export default function Layout() {
  return (
    <div className="h-screen flex flex-col">
      <main className="flex-1 bg-white overflow-y-auto">
        <Outlet />
      </main>

      {/* Floating test navigator (bottom-left) */}
      <div className="fixed left-6 bottom-6 z-50">
        <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl shadow-lg p-2 w-44">
          <div className="text-xs text-gray-500 font-medium mb-2 px-2">Test Navigator</div>
          <nav className="flex flex-col gap-2">
            <NavLink to="/" end className={({ isActive }) =>
              `px-3 py-2 rounded text-sm text-left ${isActive ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`
            }>
              홈
            </NavLink>

            <NavLink to="/counsel" className={({ isActive }) =>
              `px-3 py-2 rounded text-sm text-left ${isActive ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`
            }>
              AI 상담하기
            </NavLink>

            <NavLink to="/chat" className={({ isActive }) =>
              `px-3 py-2 rounded text-sm text-left ${isActive ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`
            }>
              상담
            </NavLink>

            <NavLink to="/mypage" className={({ isActive }) =>
              `px-3 py-2 rounded text-sm text-left ${isActive ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`
            }>
              마이페이지
            </NavLink>

            <NavLink to="/report" className={({ isActive }) =>
              `px-3 py-2 rounded text-sm text-left ${isActive ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`
            }>
              리포트
            </NavLink>

            <NavLink to="/diagnosis" className={({ isActive }) =>
              `px-3 py-2 rounded text-sm text-left ${isActive ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`
            }>
              자가진단
            </NavLink>
          </nav>
        </div>
      </div>
    </div>
  );
}
