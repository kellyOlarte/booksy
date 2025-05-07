import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import CatalogPage from "@/pages/catalog-page";
import BookDetailPage from "@/pages/book-detail-page";
import CategoriesPage from "@/pages/categories-page";
import FeaturedPage from "@/pages/featured-page";
import ProfilePage from "@/pages/profile-page";
import LoansPage from "@/pages/loans-page";
import AdminPage from "@/pages/admin-page";
import { ProtectedRoute } from "@/lib/protected-route";
import { AuthProvider } from "@/hooks/use-auth";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

function Router() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <Switch>
          <Route path="/" component={HomePage} />
          <Route path="/auth" component={AuthPage} />
          <Route path="/catalogo" component={CatalogPage} />
          <Route path="/categorias" component={CategoriesPage} />
          <Route path="/destacados" component={FeaturedPage} />
          <Route path="/libro/:id" component={BookDetailPage} />
          <ProtectedRoute path="/perfil" component={ProfilePage} />
          <ProtectedRoute path="/prestamos" component={LoansPage} />
          <ProtectedRoute path="/admin" component={AdminPage} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
