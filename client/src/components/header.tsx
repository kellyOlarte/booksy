import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BookOpen,
  Menu,
  Search,
  User,
  LogOut,
  BookMarked,
  Settings,
  Bell,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const Header: React.FC = () => {
  const [location, navigate] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/catalogo?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const isActive = (path: string) => {
    return location === path;
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <BookOpen className="h-8 w-8 text-primary" />
              <span className="font-serif font-bold text-2xl text-primary ml-2">Booksy</span>
            </Link>

            {/* Desktop nav */}
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link href="/" className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${isActive("/")
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                }`}>
                Inicio
              </Link>
              <Link href="/catalogo" className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${isActive("/catalogo") || location.startsWith("/catalogo")
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                }`}>
                Catálogo
              </Link>
              <Link href="/destacados" className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${isActive("/destacados")
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                }`}>
                Destacados
              </Link>
              <Link href="/categorias" className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${isActive("/categorias")
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                }`}>
                Categorías
              </Link>
            </div>
          </div>

          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {/* Search form */}
            <form onSubmit={handleSearch} className="relative mx-4">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <Input
                type="text"
                placeholder="Buscar libros..."
                className="pl-10 pr-3 py-2 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </form>

            {/* Auth buttons / User profile */}
            {user ? (
              <div className="flex items-center space-x-4">
                <Link href="/prestamos">
                  <Button variant="ghost" size="icon" className="relative">
                    <BookMarked className="h-5 w-5" />
                    <Badge className="absolute -top-1 -right-1 px-1.5 min-w-[1.25rem] h-5 flex items-center justify-center">
                      0
                    </Badge>
                  </Button>
                </Link>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center uppercase">
                        {user.nombre.charAt(0)}
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href="/perfil" className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        <span>Mi Perfil</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/prestamos" className="cursor-pointer">
                        <BookMarked className="mr-2 h-4 w-4" />
                        <span>Mis Préstamos</span>
                      </Link>
                    </DropdownMenuItem>
                    {user.role_id === 2 && (
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="cursor-pointer">
                          <Settings className="mr-2 h-4 w-4" />
                          <span>Administración</span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Cerrar sesión</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Button variant="outline" asChild>
                  <Link href="/auth">Iniciar sesión</Link>
                </Button>
                <Button asChild>
                  <Link href="/auth?tab=register">Registrarse</Link>
                </Button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="sm:hidden">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Abrir menú</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <div className="flex flex-col h-full">
                <div className="py-4">
                  <Link href="/" className="flex items-center">
                    <BookOpen className="h-6 w-6 text-primary" />
                    <span className="font-serif font-bold text-xl text-primary ml-2">Booksy</span>
                  </Link>
                </div>

                <form onSubmit={handleSearch} className="mb-6">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-4 w-4 text-gray-400" />
                    </div>
                    <Input
                      type="text"
                      placeholder="Buscar libros..."
                      className="pl-10 w-full"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </form>

                <div className="space-y-3">
                  <SheetClose asChild>
                    <Button
                      variant={isActive("/") ? "secondary" : "ghost"}
                      className="w-full justify-start"
                      asChild
                    >
                      <Link href="/">Inicio</Link>
                    </Button>
                  </SheetClose>

                  <SheetClose asChild>
                    <Button
                      variant={isActive("/catalogo") || location.startsWith("/catalogo") ? "secondary" : "ghost"}
                      className="w-full justify-start"
                      asChild
                    >
                      <Link href="/catalogo">Catálogo</Link>
                    </Button>
                  </SheetClose>

                  <SheetClose asChild>
                    <Button
                      variant={isActive("/destacados") ? "secondary" : "ghost"}
                      className="w-full justify-start"
                      asChild
                    >
                      <Link href="/destacados">Destacados</Link>
                    </Button>
                  </SheetClose>

                  <SheetClose asChild>
                    <Button
                      variant={isActive("/categorias") ? "secondary" : "ghost"}
                      className="w-full justify-start"
                      asChild
                    >
                      <Link href="/categorias">Categorías</Link>
                    </Button>
                  </SheetClose>
                </div>

                <div className="border-t border-gray-200 mt-6 pt-6">
                  {user ? (
                    <div className="space-y-3">
                      <SheetClose asChild>
                        <Button
                          variant={isActive("/perfil") ? "secondary" : "ghost"}
                          className="w-full justify-start"
                          asChild
                        >
                          <Link href="/perfil">
                            <User className="mr-2 h-4 w-4" />
                            Mi Perfil
                          </Link>
                        </Button>
                      </SheetClose>

                      <SheetClose asChild>
                        <Button
                          variant={isActive("/prestamos") ? "secondary" : "ghost"}
                          className="w-full justify-start"
                          asChild
                        >
                          <Link href="/prestamos">
                            <BookMarked className="mr-2 h-4 w-4" />
                            Mis Préstamos
                          </Link>
                        </Button>
                      </SheetClose>

                      {user.role_id === 2 && (
                        <SheetClose asChild>
                          <Button
                            variant={isActive("/admin") ? "secondary" : "ghost"}
                            className="w-full justify-start"
                            asChild
                          >
                            <Link href="/admin">
                              <Settings className="mr-2 h-4 w-4" />
                              Administración
                            </Link>
                          </Button>
                        </SheetClose>
                      )}

                      <Button
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={handleLogout}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Cerrar sesión
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <SheetClose asChild>
                        <Button className="w-full" onClick={() => navigate("/auth")}>
                          Iniciar sesión
                        </Button>
                      </SheetClose>

                      <SheetClose asChild>
                        <Button variant="outline" className="w-full" onClick={() => navigate("/auth?tab=register")}>
                          Registrarse
                        </Button>
                      </SheetClose>
                    </div>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};
