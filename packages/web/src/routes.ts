import { createBrowserRouter } from "react-router";
import { MembersView } from "./views/Members";
import { SaludView } from "./views/Salud.tsx";
import { HomeView } from "./views/Home";
import { SportsView } from "./views/Sports";
import Layout from "./Layout";
import { PaymentsView } from "./views/Payments";

export let router = createBrowserRouter([
  {
    Component: Layout,
    children: [
      {
        path: "/",
        Component: HomeView,
      },
      {
        path: "/members",
        Component: MembersView,
      },
      {
        path: "/salud",
        Component: SaludView
      },
      { 
        path: "/payments",
        Component: PaymentsView,
      },
      {
        path: "/sports",
        Component: SportsView,
      },
    ],
  },
]);
