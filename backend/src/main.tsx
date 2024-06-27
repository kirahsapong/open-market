import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import Products from './views/Products';
import Orders from './views/Orders';
import Partners from './views/Partners';
import Settings from './views/Settings';
import Landing from './views/Landing';

const router = createBrowserRouter([
  {
    path: "/",
    children: [
      {
        path: "",
        element: <Landing />
      },
      {
        path: "products",
        element: <Products />
      },
      {
        path: "orders",
        element: <Orders />
      },
      {
        path: "partners",
        element: <Partners />
      },
      {
        path: "settings",
        element: <Settings />
      }
    ]
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
