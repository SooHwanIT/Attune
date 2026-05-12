import { Navigate } from "react-router-dom";
import type { ReactElement } from "react";

type DevOnlyRouteProps = {
  children: ReactElement;
};

export default function DevOnlyRoute({ children }: DevOnlyRouteProps) {
  if (!import.meta.env.DEV) {
    return <Navigate to="/" replace />;
  }

  return children;
}
