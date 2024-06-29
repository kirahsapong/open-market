import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import Products from './views/Products';
import Orders from './views/Orders';
import Partners from './views/Partners';
import Settings from './views/Settings';
import Landing from './views/Landing';
import "primereact/resources/themes/lara-dark-teal/theme.css";
import 'primeicons/primeicons.css';
import { GuardProvider } from './providers/GuardProvider';
import SidebarLayout from './components/SidebarLayout';
import { PrimeReactProvider } from 'primereact/api';

const router = createBrowserRouter([
  {
    path: "/",
    children: [
      {
        path: "",
        element: <SidebarLayout component={<Landing />} />
      },
      {
        path: "products",
        element: <SidebarLayout component={<Products />} />
      },
      {
        path: "orders",
        element: <SidebarLayout component={<Orders />} />
      },
      {
        path: "partners",
        element: <SidebarLayout component={<Partners />} />
      },
      {
        path: "settings",
        element: <SidebarLayout component={<Settings />} />
      }
    ]
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PrimeReactProvider>
      <GuardProvider>
        <RouterProvider router={router} />
      </GuardProvider>
    </PrimeReactProvider>
  </React.StrictMode>,
)
