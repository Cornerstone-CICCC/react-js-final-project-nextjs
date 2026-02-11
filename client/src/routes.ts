import { createBrowserRouter } from "react-router";
import { LandingPage } from "./components/pages/LandingPage";
import { LoginPage } from "./components/pages/LoginPage";
import { SignupPage } from "./components/pages/SignupPage";
import { MainLayout } from "./components/layout/MainLayout";
import { StudyHomePage } from "./components/pages/StudyHomePage";
import { ChatPage } from "./components/pages/ChatPage";
import { TodosPage } from "./components/pages/TodosPage";
import { SchedulePage } from "./components/pages/SchedulePage";
import { HistoryPage } from "./components/pages/HistoryPage";
import { MeetingPage } from "./components/pages/MeetingPage";
import { NotFound } from "./components/pages/NotFound";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: LandingPage,
  },
  {
    path: "/login",
    Component: LoginPage,
  },
  {
    path: "/signup",
    Component: SignupPage,
  },
  {
    path: "/app",
    Component: MainLayout,
    children: [
      {
        path: "study/:studyId",
        Component: StudyHomePage,
      },
      {
        path: "study/:studyId/chat",
        Component: ChatPage,
      },
      {
        path: "study/:studyId/todos",
        Component: TodosPage,
      },
      {
        path: "study/:studyId/schedule",
        Component: SchedulePage,
      },
      {
        path: "study/:studyId/history",
        Component: HistoryPage,
      },
    ],
  },
  {
    path: "/meeting/:studyId",
    Component: MeetingPage,
  },
  {
    path: "*",
    Component: NotFound,
  },
]);
