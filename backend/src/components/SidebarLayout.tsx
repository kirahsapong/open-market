import { ReactNode } from "react";
import { NavLink, Navigate, useLocation } from "react-router-dom";
import { useGuard } from "../hooks/useGuard";
import Logo from '../assets/logo.svg';

const SidebarLayout = ({ component }: { component: ReactNode }) => {
  const { isGuarded } = useGuard();
  const location = useLocation();

  if (location.pathname == "/" && !isGuarded) {
    return <Navigate to="/products" state={{ from: location }} />;
  }
  
  if (location.pathname !== "/" && isGuarded) {
    return <Navigate to="/" state={{ from: location }} />;
  }

  return (
    <>
      <aside>
        <div>
          <img src={Logo} alt="OpenMarket logo" width="128" />
        </div>
        { !isGuarded 
        && (
          <nav>
            <NavLink to="/products"><i className="pi pi-box"></i> Products</NavLink>
            <NavLink to="/orders"><i className="pi pi-receipt"></i> Orders</NavLink>
            <NavLink to="/partners"><i className="pi pi-users"></i> Partners</NavLink>
            <NavLink to="/settings"><i className="pi pi-cog"></i> Settings</NavLink>
          </nav>
        )}
      </aside>
      <main>
        {component}
      </main>
    </>
  )
}

export default SidebarLayout;