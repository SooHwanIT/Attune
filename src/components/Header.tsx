import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { isLoggedIn, getCurrentUser, logout } from "../utils/auth";
import { LogOut, Menu, X } from "lucide-react";

const NAV_ITEMS = [
  { key: "counsel", label: "상담하기", path: "/counsel/prepare", protected: true },
  { key: "record", label: "상담 기록", path: "/counsel/records", protected: true },
  { key: "analysis", label: "분석", path: "/analysis", protected: true },
  { key: "contents", label: "콘텐츠", path: "/contents", protected: false },
  { key: "mypage", label: "마이페이지", path: "/mypage", protected: true },
];

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const loggedIn = isLoggedIn();
  const user = getCurrentUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 24);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, []);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const resolvePath = (item: (typeof NAV_ITEMS)[number]) => item.path;

  const isNavItemActive = (item: (typeof NAV_ITEMS)[number]) => {
    if (item.key === "record") {
      return location.pathname === "/counsel/records" || location.pathname.startsWith("/analysis/session/");
    }
    if (item.key === "analysis") {
      return location.pathname === "/analysis";
    }
    return location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
  };

  const handleProtectedLink = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    if (!isLoggedIn()) {
      e.preventDefault();
      closeMobileMenu();
      navigate("/login", { state: { from: path } });
    }
  };

  const handleLogoutClick = () => {
    void logout();
    closeMobileMenu();
    navigate("/");
  };

  const navigateWithGuard = (path: string, isProtected: boolean) => {
    if (isProtected && !isLoggedIn()) {
      closeMobileMenu();
      navigate("/login", { state: { from: path } });
      return;
    }

    closeMobileMenu();
    navigate(path);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white transition-colors duration-200">
      <div className={`max-w-7xl mx-auto px-4 md:px-6 lg:px-8 flex items-center justify-between transition-all duration-200 ${isScrolled ? "h-14" : "h-16"}`}>
        <Link to="/" className={`font-extrabold text-gray-900 transition-all duration-200 ${isScrolled ? "text-lg md:text-xl" : "text-xl md:text-2xl"}`}>
          Attune <span className="text-brand-green text-xs md:text-sm font-medium">AI Care</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 md:gap-2 text-xs md:text-sm font-semibold text-gray-600">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.key}
              to={resolvePath(item)}
              onClick={(e) => {
                if (item.protected) {
                  handleProtectedLink(e, resolvePath(item));
                }
              }}
              className={() => {
                const isActive = isNavItemActive(item);

                return `relative px-2 md:px-3 py-2 rounded-lg transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/30 text-xs md:text-sm ${
                    isActive
                      ? "bg-brand-green/10 text-brand-green after:scale-x-100"
                      : "hover:text-brand-green hover:bg-gray-50"
                  }`;
              }}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2 md:gap-4">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-1 text-gray-600 hover:text-brand-green transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/30"
            aria-label="메뉴"
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-nav-drawer"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {loggedIn && user ? (
            <div className="flex items-center gap-2 md:gap-3">
              <span className="text-lg md:text-xl">{user.avatar}</span>
              <span className="text-xs md:text-sm font-semibold text-gray-900 hidden sm:inline">{user.name}</span>
              <button
                onClick={handleLogoutClick}
                className="flex items-center gap-1 text-xs md:text-sm font-semibold text-semantic-negative hover:text-semantic-negative/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-semantic-negative/30"
                aria-label="로그아웃"
                title="로그아웃"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <Link to="/login" className="text-xs md:text-sm font-semibold text-gray-600 hover:text-brand-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/30">로그인</Link>
          )}
        </div>
      </div>

      <div
        className={`fixed inset-0 z-40 bg-slate-200/40 transition-opacity duration-200 md:hidden ${
          isMobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={closeMobileMenu}
        aria-hidden="true"
      />

      <aside
        id="mobile-nav-drawer"
        className={`fixed right-0 top-0 z-50 h-full w-[280px] sm:w-[320px] border-l border-gray-200 bg-white transition-transform duration-200 md:hidden ${
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!isMobileMenuOpen}
      >
        <div className="flex h-14 md:h-16 items-center justify-between border-b border-gray-200 px-4">
          <span className="text-xs md:text-sm font-bold text-gray-900">메뉴</span>
          <button
            onClick={closeMobileMenu}
            className="rounded-lg p-1 text-gray-600 hover:text-brand-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/30"
            aria-label="메뉴 닫기"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex flex-col gap-2 p-4">
          {loggedIn && user ? (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">현재 로그인</p>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-lg">{user.avatar}</span>
                <span className="text-xs md:text-sm font-bold text-gray-900">{user.name}</span>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
              <p className="text-xs text-gray-600">로그인 후 맞춤 상담, 기록, 통계 기능을 이용할 수 있어요.</p>
              <button
                onClick={() => navigateWithGuard("/login", false)}
                className="mt-2 w-full rounded-lg bg-brand-green px-3 py-2 text-xs md:text-sm font-bold text-white transition-colors hover:bg-brand-green-dark shadow-sm"
              >
                로그인 하기
              </button>
            </div>
          )}

          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.key}
              to={resolvePath(item)}
              onClick={(e) => {
                if (item.protected) {
                  handleProtectedLink(e, resolvePath(item));
                }
                closeMobileMenu();
              }}
              className={() =>
                `block rounded-lg px-3 py-2 text-xs md:text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/30 ${
                  isNavItemActive(item)
                    ? "border border-brand-green bg-brand-green/5 text-brand-green"
                    : "text-gray-600 hover:text-brand-green hover:bg-gray-50"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}

          <div className="mt-2 grid grid-cols-2 gap-2 border-t border-gray-200 pt-3">
            <button
              onClick={() => navigateWithGuard("/counsel/records", true)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-600 transition-colors hover:bg-gray-50 hover:text-brand-green shadow-sm"
            >
              기록 바로가기
            </button>
            <button
              onClick={() => navigateWithGuard("/analysis", true)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-600 transition-colors hover:bg-gray-50 hover:text-brand-green shadow-sm"
            >
              통계 보기
            </button>
          </div>

          {loggedIn && (
            <button
              onClick={handleLogoutClick}
              className="mt-2 flex items-center justify-center gap-1 rounded-lg border border-semantic-negative/30 bg-semantic-negative/5 px-3 py-2 text-xs md:text-sm font-bold text-semantic-negative transition-colors hover:bg-semantic-negative/10"
              aria-label="로그아웃"
              title="로그아웃"
            >
              <LogOut size={14} />
            </button>
          )}
        </nav>
      </aside>
    </header>
  );
}