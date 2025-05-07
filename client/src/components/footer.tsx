import React from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookOpen, Facebook, Twitter, Instagram, Send } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-gray-200 pt-12 pb-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center mb-4">
              <BookOpen className="h-8 w-8 text-primary" />
              <span className="font-serif font-bold text-2xl text-white ml-2">Booksy</span>
            </div>
            <p className="text-gray-400 mb-4">
              Tu biblioteca virtual para descubrir, prestar y compartir opiniones sobre tus libros favoritos en español.
            </p>
            <div className="flex space-x-4">
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                <Facebook className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                <Twitter className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                <Instagram className="h-5 w-5" />
              </Button>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-bold mb-4">Explorar</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/catalogo" className="text-gray-400 hover:text-white transition-colors">
                  Catálogo
                </Link>
              </li>
              <li>
                <Link href="/categorias" className="text-gray-400 hover:text-white transition-colors">
                  Categorías
                </Link>
              </li>
              <li>
                <Link href="/destacados" className="text-gray-400 hover:text-white transition-colors">
                  Destacados
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-bold mb-4">Ayuda</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/#" className="text-gray-400 hover:text-white transition-colors">
                  Cómo funciona
                </Link>
              </li>
              <li>
                <Link href="/#" className="text-gray-400 hover:text-white transition-colors">
                  Preguntas frecuentes
                </Link>
              </li>
              <li>
                <Link href="/#" className="text-gray-400 hover:text-white transition-colors">
                  Términos de servicio
                </Link>
              </li>
              <li>
                <Link href="/#" className="text-gray-400 hover:text-white transition-colors">
                  Política de privacidad
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-bold mb-4">Suscríbete</h3>
            <p className="text-gray-400 mb-4">
              Recibe notificaciones sobre nuevos libros y actualizaciones.
            </p>
            <form className="flex">
              <Input 
                type="email" 
                placeholder="Tu correo electrónico" 
                className="rounded-r-none bg-gray-800 border-gray-700 focus-visible:ring-primary"
              />
              <Button className="rounded-l-none">
                <Send className="h-4 w-4" />
              </Button>
            </form>
            <p className="text-xs text-gray-500 mt-2">
              Al suscribirte, aceptas nuestra política de privacidad.
            </p>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-10 pt-6 text-center text-gray-500 text-sm">
          <p>&copy; {new Date().getFullYear()} Booksy. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
};
