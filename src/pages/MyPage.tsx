import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser, logout } from "../utils/auth";
import {
  ArrowRight,
  Bell,
  CreditCard,
  LogOut,
  Lock,
  Mail,
  Shield,
  User,
  X,
  ChevronRight,
} from "lucide-react";

// --- Types ---
interface MenuItemType {
  id: string;
  icon: React.ReactNode;
  label: string;
  description: string;
}

// --- Constants ---
const CARD_CLASS = "rounded-2xl border border-slate-100 bg-white p-6 shadow-sm";

const ACCOUNT_MENU: MenuItemType[] = [
  {
    id: "account-info",
    icon: <User size={20} />,
    label: "계정 정보",
    description: "이메일, 비밀번호, 개인정보 확인 및 수정",
  },
  {
    id: "subscription",
    icon: <CreditCard size={20} />,
    label: "구독 및 결제",
    description: "구독 플랜, 결제 수단, 청구 내역 관리",
  },
  {
    id: "notifications",
    icon: <Bell size={20} />,
    label: "알림 설정",
    description: "이메일, 푸시 알림 및 상담 예약 알림",
  },
  {
    id: "privacy",
    icon: <Shield size={20} />,
    label: "개인정보 보호",
    description: "데이터 관리, 개인정보 처리 방침",
  },
];

export default function MyPage() {
  const user = getCurrentUser();
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    void logout();
    navigate("/");
  };

  const handleMenuClick = (menuId: string) => {
    setActiveMenu(activeMenu === menuId ? null : menuId);
  };

  return (
    <div className="relative min-h-screen bg-[#F9FAFB] pb-12 text-slate-900 font-sans">
      <main>
        {/* 헤더 섹션 */}
        <section className="bg-white border-b border-slate-200">
          <div className="mx-auto max-w-7xl px-4 py-8 md:px-8 lg:py-12">
            <p className="text-xs font-bold tracking-widest text-slate-400 uppercase mb-3">Account</p>
            <h1 className="text-3xl font-extrabold tracking-tight md:text-5xl">마이페이지</h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-500">
              계정 정보, 구독 설정, 개인정보 등을 한 곳에서 관리하세요.
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8 lg:py-12">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            
            {/* 왼쪽: 프로필 카드 */}
            <aside className="lg:col-span-1">
              <div className={CARD_CLASS}>
                <div className="flex flex-col items-center text-center">
                  {/* 프로필 아바타 */}
                  <div className="relative mb-6">
                    <div className="absolute inset-0 rounded-full bg-brand-green/20 blur-md"></div>
                    <div className="relative inline-flex h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-brand-green/10 text-3xl font-extrabold text-brand-green shadow-sm">
                      {user?.avatar || (user?.name ? user.name[0] : "김")}
                    </div>
                  </div>

                  {/* 사용자 정보 */}
                  <h2 className="text-xl font-bold text-slate-900">{user?.name || "김어튠"}</h2>
                  <p className="mt-2 text-sm text-slate-500">{user?.email || "attune_user@email.com"}</p>

                  {/* 플랜 배지 */}
                  <div className="my-6 inline-flex items-center gap-2 rounded-full bg-brand-green/10 px-4 py-2 text-sm font-bold text-brand-green">
                    <span className="h-2 w-2 rounded-full bg-brand-green"></span>
                    Free Plan
                  </div>

                  {/* 프로필 편집 버튼 */}
                  <button className="w-full rounded-xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 transition-all duration-200 hover:bg-slate-100 hover:text-slate-900 mb-3">
                    프로필 편집
                  </button>

                  {/* 프리미엄 업그레이드 */}
                  <button className="w-full rounded-xl bg-gradient-to-r from-brand-green to-brand-green-dark px-4 py-3 text-sm font-bold text-white transition-all duration-200 hover:shadow-lg hover:shadow-brand-green/30 flex items-center justify-center gap-2">
                    프리미엄 업그레이드
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </aside>

            {/* 오른쪽: 계정 관리 메뉴 */}
            <section className="lg:col-span-2 space-y-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">계정 설정</h3>
                <p className="text-sm text-slate-500">계정 정보와 서비스 설정을 관리합니다.</p>
              </div>

              {/* 메뉴 항목들 */}
              <div className="space-y-3">
                {ACCOUNT_MENU.map((menu) => (
                  <div key={menu.id} className={CARD_CLASS}>
                    <button
                      onClick={() => handleMenuClick(menu.id)}
                      className="w-full flex items-start justify-between transition-all duration-200 hover:text-brand-green"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-50 text-slate-500 group-hover:bg-brand-green/10 group-hover:text-brand-green mt-0.5">
                          {menu.icon}
                        </div>
                        <div className="text-left">
                          <h4 className="text-base font-bold text-slate-900">{menu.label}</h4>
                          <p className="mt-1 text-sm text-slate-500">{menu.description}</p>
                        </div>
                      </div>
                      <ChevronRight 
                        size={20} 
                        className={`text-slate-300 transition-transform flex-shrink-0 mt-1 ${
                          activeMenu === menu.id ? "rotate-90 text-brand-green" : ""
                        }`}
                      />
                    </button>

                    {/* 확장 섹션 */}
                    {activeMenu === menu.id && (
                      <div className="mt-4 border-t border-slate-100 pt-4">
                        {menu.id === "account-info" && <AccountInfoDetail user={user} />}
                        {menu.id === "subscription" && <SubscriptionDetail />}
                        {menu.id === "notifications" && <NotificationsDetail />}
                        {menu.id === "privacy" && <PrivacyDetail />}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* 로그아웃 섹션 */}
              <div className={CARD_CLASS}>
                <button
                  onClick={() => setShowLogoutConfirm(true)}
                  className="w-full flex items-center justify-between rounded-lg p-2 text-left transition-colors hover:bg-rose-50"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-rose-50 text-rose-500">
                      <LogOut size={20} />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-rose-600">로그아웃</h4>
                      <p className="mt-1 text-sm text-slate-500">현재 계정에서 로그아웃합니다</p>
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-rose-300" />
                </button>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* 로그아웃 확인 모달 */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowLogoutConfirm(false)}></div>
          
          <div className="relative z-10 w-full max-w-sm rounded-3xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 px-8 py-6">
              <h2 className="text-xl font-bold text-slate-900">로그아웃</h2>
              <button 
                onClick={() => setShowLogoutConfirm(false)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="px-8 py-6">
              <p className="text-sm text-slate-600">
                정말로 로그아웃하시겠습니까? 다시 로그인할 때까지 상담과 분석 기능에 접근할 수 없습니다.
              </p>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 px-8 py-5">
              <button 
                onClick={() => setShowLogoutConfirm(false)}
                className="rounded-xl bg-white px-6 py-2.5 text-sm font-bold text-slate-700 shadow-sm border border-slate-200 transition-colors hover:bg-slate-50"
              >
                취소
              </button>
              <button 
                onClick={handleLogout}
                className="rounded-xl bg-rose-500 px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-rose-600"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Sub Components ---

function AccountInfoDetail({ user }: { user: any }) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-slate-50 p-4">
        <div className="flex items-center gap-3 mb-4">
          <Mail size={18} className="text-slate-400" />
          <span className="text-sm font-medium text-slate-600">가입 이메일</span>
        </div>
        <p className="text-sm font-semibold text-slate-900">{user?.email || "attune_user@email.com"}</p>
      </div>

      <div className="rounded-lg bg-slate-50 p-4">
        <div className="flex items-center gap-3 mb-4">
          <Lock size={18} className="text-slate-400" />
          <span className="text-sm font-medium text-slate-600">비밀번호</span>
        </div>
        <button className="text-sm font-bold text-brand-green hover:text-brand-green-dark transition-colors">
          비밀번호 변경 →
        </button>
      </div>

      <p className="text-xs text-slate-400">마지막 변경: 2024년 3월 15일</p>
    </div>
  );
}

function SubscriptionDetail() {
  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-slate-50 p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-slate-600">현재 플랜</span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
            <span className="h-2 w-2 rounded-full bg-slate-400"></span>
            Free Plan
          </span>
        </div>
        <p className="text-xs text-slate-500">월 5회 상담 가능 (무료)</p>
      </div>

      <div className="rounded-lg bg-brand-green/5 border border-brand-green/20 p-4">
        <h5 className="text-sm font-bold text-brand-green mb-2">Pro Plan으로 업그레이드</h5>
        <p className="text-xs text-slate-600 mb-3">
          무제한 상담, 심층 분석 리포트, 우선 예약 등의 기능을 이용하세요.
        </p>
        <button className="text-xs font-bold text-brand-green hover:text-brand-green-dark transition-colors">
          자세히 보기 →
        </button>
      </div>

      <p className="text-xs text-slate-400">다음 청구일: 2026년 6월 11일</p>
    </div>
  );
}

function NotificationsDetail() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [counselReminder, setCounselReminder] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(false);

  return (
    <div className="space-y-4">
      <label className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 cursor-pointer">
        <div>
          <p className="text-sm font-medium text-slate-900">이메일 알림</p>
          <p className="text-xs text-slate-500">이메일로 알림을 받습니다</p>
        </div>
        <input 
          type="checkbox" 
          checked={emailNotifications}
          onChange={(e) => setEmailNotifications(e.target.checked)}
          className="w-5 h-5 rounded border-slate-300"
        />
      </label>

      <label className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 cursor-pointer">
        <div>
          <p className="text-sm font-medium text-slate-900">상담 예약 알림</p>
          <p className="text-xs text-slate-500">상담 예약 시간 1시간 전 알림</p>
        </div>
        <input 
          type="checkbox" 
          checked={counselReminder}
          onChange={(e) => setCounselReminder(e.target.checked)}
          className="w-5 h-5 rounded border-slate-300"
        />
      </label>

      <label className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 cursor-pointer">
        <div>
          <p className="text-sm font-medium text-slate-900">주간 리포트</p>
          <p className="text-xs text-slate-500">매주 월요일 아침에 리포트 받기</p>
        </div>
        <input 
          type="checkbox" 
          checked={weeklyReport}
          onChange={(e) => setWeeklyReport(e.target.checked)}
          className="w-5 h-5 rounded border-slate-300"
        />
      </label>
    </div>
  );
}

function PrivacyDetail() {
  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-slate-50 p-4">
        <h5 className="text-sm font-bold text-slate-900 mb-2">개인정보 처리방침</h5>
        <p className="text-xs text-slate-600 leading-relaxed mb-3">
          Attune은 사용자의 개인정보를 안전하게 관리합니다. 모든 상담 내용과 개인정보는 암호화되어 저장되며, 동의 없이 제3자와 공유되지 않습니다.
        </p>
        <button className="text-xs font-bold text-brand-green hover:text-brand-green-dark transition-colors">
          전체 내용 보기 →
        </button>
      </div>

      <div className="rounded-lg bg-slate-50 p-4">
        <h5 className="text-sm font-bold text-slate-900 mb-2">데이터 다운로드</h5>
        <p className="text-xs text-slate-600 mb-3">
          내 상담 기록, 분석 데이터, 개인정보를 다운로드할 수 있습니다.
        </p>
        <button className="text-xs font-bold text-brand-green hover:text-brand-green-dark transition-colors">
          데이터 다운로드 →
        </button>
      </div>

      <div className="rounded-lg bg-rose-50 border border-rose-200 p-4">
        <h5 className="text-sm font-bold text-rose-600 mb-2">계정 삭제</h5>
        <p className="text-xs text-slate-600 mb-3">
          계정을 삭제하면 모든 상담 기록과 개인정보가 영구적으로 삭제됩니다.
        </p>
        <button className="text-xs font-bold text-rose-600 hover:text-rose-700 transition-colors">
          계정 삭제 →
        </button>
      </div>
    </div>
  );
}
