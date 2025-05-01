import { Switch, Route, Link } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { queryClient } from "./lib/queryClient";

// Pages
import Home from "@/pages/home";
import Tasks from "@/pages/tasks";
import Games from "@/pages/games";
import SpinWheelPage from "@/pages/games/spinwheel";
import QuizPage from "@/pages/games/quiz";
import Leaderboard from "@/pages/leaderboard";
import Profile from "@/pages/profile";
import AdminDashboard from "@/pages/admin/index";
import AdminUsers from "@/pages/admin/users";
import AdminTasks from "@/pages/admin/tasks";
import AdminRewards from "@/pages/admin/rewards";
import AdminSettings from "@/pages/admin/settings";
import NotFound from "@/pages/not-found";

// Providers
import { Web3Provider } from "@/providers/Web3Provider";
import { GameProvider } from "@/providers/GameProvider";
import { TelegramProvider } from "@/providers/TelegramProvider";
import { ThemeProvider } from "@/components/layout/ThemeProvider";

// Layout Components
import Header from "@/components/layout/Header";
import BottomNavigation from "@/components/layout/BottomNavigation";

function Router() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="flex-grow">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/tasks" component={Tasks} />
          <Route path="/games" component={Games} />
          <Route path="/games/spinwheel" component={SpinWheelPage} />
          <Route path="/games/quiz" component={QuizPage} />
          <Route path="/leaderboard" component={Leaderboard} />
          <Route path="/profile" component={Profile} />
          <Route path="/admin" component={AdminDashboard} />
          <Route path="/admin/users" component={AdminUsers} />
          <Route path="/admin/tasks" component={AdminTasks} />
          <Route path="/admin/rewards" component={AdminRewards} />
          <Route path="/admin/settings" component={AdminSettings} />
          <Route component={NotFound} />
        </Switch>
      </div>
      <BottomNavigation />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TelegramProvider>
          <Web3Provider>
            <GameProvider>
              <Router />
              <Toaster />
            </GameProvider>
          </Web3Provider>
        </TelegramProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
