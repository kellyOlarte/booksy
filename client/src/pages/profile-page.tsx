import React from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { LoanWithBookInfo } from "@shared/schema";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  BookOpen, 
  User, 
  Calendar, 
  Clock, 
  Star, 
  MessageSquare,
  Loader2
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";

export default function ProfilePage() {
  const { user } = useAuth();
  
  // Fetch user's active loans
  const { data: activeLoans = [], isLoading: isLoadingActive } = useQuery<LoanWithBookInfo[]>({
    queryKey: ["/api/prestamos"],
    enabled: !!user
  });
  
  // Fetch user's loan history
  const { data: loanHistory = [], isLoading: isLoadingHistory } = useQuery<LoanWithBookInfo[]>({
    queryKey: ["/api/prestamos/historial"],
    enabled: !!user
  });
  
  // Calculate user stats
  const totalLoans = activeLoans.length + loanHistory.length;
  const registrationDate = user ? new Date(user.created_at) : new Date();
  const membershipDuration = differenceInDays(new Date(), registrationDate);

  return (
    <div className="bg-gray-50 py-10">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <Card className="mb-8">
            <CardContent className="p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
                <Avatar className="h-24 w-24">
                  <AvatarFallback className="text-3xl bg-primary text-white">
                    {user?.nombre.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="text-center sm:text-left">
                  <h1 className="text-2xl font-bold mb-2">{user?.nombre}</h1>
                  <p className="text-gray-500 mb-4">{user?.email}</p>
                  
                  <div className="flex flex-wrap justify-center sm:justify-start gap-4">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-primary mr-1" />
                      <span className="text-sm text-gray-600">
                        Miembro desde {format(registrationDate, "d 'de' MMMM, yyyy", { locale: es })}
                      </span>
                    </div>
                    
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-primary mr-1" />
                      <span className="text-sm text-gray-600">
                        {membershipDuration} días de antigüedad
                      </span>
                    </div>
                    
                    <div className="flex items-center">
                      <BookOpen className="h-4 w-4 text-primary mr-1" />
                      <span className="text-sm text-gray-600">
                        {totalLoans} libros prestados en total
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 sm:mt-0 sm:ml-auto">
                  <Button variant="outline" className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    Editar perfil
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-primary-50 border-primary-200">
              <CardContent className="p-6 text-center">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-3">
                  <BookOpen className="h-6 w-6" />
                </div>
                <h2 className="text-2xl font-bold text-primary">{totalLoans}</h2>
                <p className="text-sm text-gray-600">Libros prestados</p>
              </CardContent>
            </Card>
            
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-6 text-center">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10 text-green-500 mb-3">
                  <Star className="h-6 w-6" />
                </div>
                <h2 className="text-2xl font-bold text-green-600">{activeLoans.length}</h2>
                <p className="text-sm text-gray-600">Préstamos activos</p>
              </CardContent>
            </Card>
            
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-6 text-center">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10 text-blue-500 mb-3">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <h2 className="text-2xl font-bold text-blue-600">0</h2>
                <p className="text-sm text-gray-600">Comentarios realizados</p>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Mi actividad</CardTitle>
              <CardDescription>
                Gestiona tus préstamos y visualiza tu historial de actividad
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Tabs defaultValue="active" className="w-full">
                <TabsList className="w-full border-b rounded-none border-b-border flex justify-start p-0 h-auto">
                  <TabsTrigger 
                    value="active" 
                    className="py-2.5 px-4 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none"
                  >
                    Préstamos activos
                  </TabsTrigger>
                  <TabsTrigger 
                    value="history" 
                    className="py-2.5 px-4 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none"
                  >
                    Historial
                  </TabsTrigger>
                </TabsList>
                
                {/* Active Loans */}
                <TabsContent value="active" className="p-6">
                  {isLoadingActive ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : activeLoans.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-md">
                      <BookOpen className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-gray-500">No tienes préstamos activos actualmente.</p>
                      <Button asChild variant="link" className="mt-2">
                        <a href="/catalogo">Explorar libros disponibles</a>
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {activeLoans.map((loan) => (
                        <Card key={loan.id} className="overflow-hidden border-l-4 border-l-primary">
                          <CardContent className="p-0">
                            <div className="flex">
                              <div className="w-1/3 bg-gray-100">
                                <div className="h-full w-full relative">
                                  <img 
                                    src={loan.libro.imagen_url} 
                                    alt={loan.libro.titulo}
                                    className="absolute inset-0 w-full h-full object-cover"
                                  />
                                </div>
                              </div>
                              <div className="w-2/3 p-4">
                                <h3 className="font-bold mb-2 line-clamp-1">{loan.libro.titulo}</h3>
                                <p className="text-sm text-gray-500 mb-3">{loan.libro.autor}</p>
                                
                                <div className="space-y-1 text-sm">
                                  <div className="flex justify-between items-center">
                                    <span className="text-gray-600 flex items-center">
                                      <Calendar className="h-3 w-3 mr-1" /> Prestado:
                                    </span>
                                    <span className="font-medium">
                                      {format(new Date(loan.start_date), "dd/MM/yyyy")}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-gray-600 flex items-center">
                                      <Clock className="h-3 w-3 mr-1" /> Vence:
                                    </span>
                                    <span className="font-medium">
                                      {format(new Date(loan.due_date), "dd/MM/yyyy")}
                                    </span>
                                  </div>
                                </div>
                                
                                <div className="mt-4">
                                  <Button size="sm" className="w-full">
                                    Devolver libro
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
                
                {/* Loan History */}
                <TabsContent value="history" className="p-6">
                  {isLoadingHistory ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : loanHistory.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-md">
                      <Clock className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-gray-500">No tienes historial de préstamos.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {loanHistory.map((loan) => (
                        <Card key={loan.id} className="overflow-hidden">
                          <CardContent className="p-4">
                            <div className="flex gap-4 items-center">
                              <div className="w-12 h-16 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                                <img 
                                  src={loan.libro.imagen_url} 
                                  alt={loan.libro.titulo}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="flex-grow">
                                <h3 className="font-medium">{loan.libro.titulo}</h3>
                                <p className="text-sm text-gray-500">{loan.libro.autor}</p>
                              </div>
                              <div className="text-right text-sm">
                                <div className="text-gray-500">
                                  {format(new Date(loan.start_date), "dd/MM/yyyy")} - {format(new Date(loan.due_date), "dd/MM/yyyy")}
                                </div>
                                <div className="mt-1">
                                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                                    Devuelto
                                  </span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
