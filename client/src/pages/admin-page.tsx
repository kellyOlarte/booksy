import React, { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LibroWithRating, Usuario, LoanWithBookInfo, InsertLibro } from "@shared/schema";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { StarRating } from "@/components/ui/stars";
import { AvailabilityBadge } from "@/components/ui/availability-badge";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Users,
  BookOpen,
  BarChart,
  Edit,
  Trash,
  Plus,
  Check,
  X,
  Loader2
} from "lucide-react";
import { Redirect } from "wouter";

// Book validation schema
const bookSchema = z.object({
  titulo: z.string()
  .min(3, { message: "El título debe tener al menos 3 caracteres" })
  .regex(/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s.,:;()'-]+$/, {message: "El título contiene caracteres no permitidos"}),
  autor: z.string().min(3, { message: "El autor debe tener al menos 3 caracteres" }),
  published_year: z.coerce.number().min(1000).max(new Date().getFullYear()).optional().nullable(),
  description: z.string().min(10, { message: "La descripción debe tener al menos 10 caracteres" })
  .regex(/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s.,:;()'"!?-]+$/, {message: "La descripción contiene caracteres no permitidos"}),
  categoria: z.string().min(1, { message: "La categoría es requerida" }),
  imagen_url: z.string().url({ message: "La URL de la imagen no es válida" }).optional().nullable(),
  totalCopies: z.coerce.number().min(1).max(1000),
  availableCopies: z.coerce.number().min(0)
}).refine(data => {
  if (data.availableCopies > data.totalCopies) {
    return false;
  }
  return true;
}, {
  message: "El número de copias disponibles no puede ser mayor que el total",
  path: ["availableCopies"]
});

export default function AdminPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("books");
  const [bookToEdit, setBookToEdit] = useState<LibroWithRating | null>(null);
  const [bookToDelete, setBookToDelete] = useState<LibroWithRating | null>(null);
  
const { data: categories = [], isLoading: isLoadingCategories } = useQuery<string[]>({
  queryKey: ["/api/categories"],
  queryFn: async () => {
    const res = await fetch("/api/categories");
    if (!res.ok) throw new Error("Error al cargar categorías");
    return res.json();
  }
});


  // Check if user is admin
  const { data: isAdmin, isLoading: isCheckingAdmin } = useQuery<{ isAdmin: boolean }>({
    queryKey: ["/api/check-admin"],
    retry: false
  });
  
  // Fetch books
  const { data: books = [], isLoading: isLoadingBooks } = useQuery<LibroWithRating[]>({
    queryKey: ["/api/libros"],
    enabled: !!isAdmin?.isAdmin
  });
  
  // Fetch users
  const { data: users = [], isLoading: isLoadingUsers } = useQuery<Usuario[]>({
    queryKey: ["/api/admin/usuarios"],
    enabled: !!isAdmin?.isAdmin && activeTab === "users"
  });
  
  // Fetch active loans
  const { data: loans = [], isLoading: isLoadingLoans } = useQuery<LoanWithBookInfo[]>({
    queryKey: ["/api/admin/prestamos"],
    enabled: !!isAdmin?.isAdmin && activeTab === "loans"
  });
  
  // Create book form
  const bookForm = useForm<z.infer<typeof bookSchema>>({
    resolver: zodResolver(bookSchema),
    defaultValues: {
      titulo: "",
      autor: "",
      published_year: null,
      description: "",
      categoria: "General",
      imagen_url: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80",
      totalCopies: 50,
      availableCopies: 50
    }
  });
  
  // Mutations
  const createBookMutation = useMutation({
    mutationFn: async (data: z.infer<typeof bookSchema>) => {
      const bookData: InsertLibro = {
        titulo: data.titulo,
        autor: data.autor,
        published_year: data.published_year || undefined,
        description: data.description,
        categoria: data.categoria,
        imagen_url: data.imagen_url || undefined
      };
      
      const res = await apiRequest("POST", "/api/libros", bookData);
      const book = await res.json();
      
      // Update stock if needed
      if (data.totalCopies !== 50 || data.availableCopies !== 50) {
        await apiRequest("PUT", `/api/libros/${book.id}/stock`, {
          totalCopies: data.totalCopies,
          availableCopies: data.availableCopies
        });
      }
      
      return book;
    },
    onSuccess: () => {
      toast({
        title: "Libro creado",
        description: "El libro se ha creado exitosamente",
      });
      bookForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/libros"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al crear libro",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const updateBookMutation = useMutation({
    mutationFn: async (data: z.infer<typeof bookSchema> & { id: number }) => {
      const { id, totalCopies, availableCopies, ...bookData } = data;
      
      // Update book data
      const res = await apiRequest("PUT", `/api/libros/${id}`, bookData);
      await res.json();
      
      // Update stock
      await apiRequest("PUT", `/api/libros/${id}/stock`, {
        totalCopies,
        availableCopies
      });
      
      return true;
    },
    onSuccess: () => {
      toast({
        title: "Libro actualizado",
        description: "El libro se ha actualizado exitosamente",
      });
      setBookToEdit(null);
      queryClient.invalidateQueries({ queryKey: ["/api/libros"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al actualizar libro",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const deleteBookMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/libros/${id}`);
      return true;
    },
    onSuccess: () => {
      toast({
        title: "Libro eliminado",
        description: "El libro se ha eliminado exitosamente",
      });
      setBookToDelete(null);
      queryClient.invalidateQueries({ queryKey: ["/api/libros"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al eliminar libro",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const toggleUserStatusMutation = useMutation({
    mutationFn: async ({ id, activo }: { id: number, activo: boolean }) => {
      const res = await apiRequest("PUT", `/api/admin/usuarios/${id}/estado`, { activo });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Estado actualizado",
        description: "El estado del usuario se ha actualizado correctamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/usuarios"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al actualizar estado",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Handlers
  const onCreateBookSubmit = (data: z.infer<typeof bookSchema>) => {
    createBookMutation.mutate(data);
  };
  
  const onUpdateBookSubmit = (data: z.infer<typeof bookSchema>) => {
    if (!bookToEdit) return;
    updateBookMutation.mutate({ ...data, id: bookToEdit.id });
  };
  
  const handleEditBook = (book: LibroWithRating) => {
    setBookToEdit(book);
    bookForm.reset({
      titulo: book.titulo,
      autor: book.autor,
      published_year: book.published_year || null,
      description: book.description || "",
      categoria: book.categoria,
      imagen_url: book.imagen_url,
      totalCopies: book.totalCopies,
      availableCopies: book.availableCopies
    });
  };
  
  const handleDeleteBook = () => {
    if (bookToDelete) {
      deleteBookMutation.mutate(bookToDelete.id);
    }
  };
  
  const toggleUserStatus = (id: number, currentStatus: boolean) => {
    toggleUserStatusMutation.mutate({ id, activo: !currentStatus });
  };
  
  // Redirect if user is not admin
  if (!isCheckingAdmin && (!isAdmin || !isAdmin.isAdmin)) {
    toast({
      title: "Acceso denegado",
      description: "No tienes permisos para acceder a esta sección",
      variant: "destructive",
    });
    return <Redirect to="/" />;
  }
  
  // Show loading while checking admin status
  if (isCheckingAdmin) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="bg-gray-50 py-10">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-serif font-bold text-gray-900 mb-8">Panel de administración</h1>
        
        <Card>
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="books" className="flex items-center">
                  <BookOpen className="mr-2 h-4 w-4" /> Libros
                </TabsTrigger>
                <TabsTrigger value="users" className="flex items-center">
                  <Users className="mr-2 h-4 w-4" /> Usuarios
                </TabsTrigger>
                <TabsTrigger value="loans" className="flex items-center">
                  <BarChart className="mr-2 h-4 w-4" /> Préstamos
                </TabsTrigger>
              </TabsList>
              
              {/* Books Tab */}
              <TabsContent value="books" className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-medium text-gray-900">Gestión de libros</h2>
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="mr-2 h-4 w-4" /> Añadir libro
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl">
                      <DialogHeader>
                        <DialogTitle>Nuevo libro</DialogTitle>
                        <DialogDescription>
                          Completa el formulario para añadir un nuevo libro al catálogo
                        </DialogDescription>
                      </DialogHeader>
                      
                      <Form {...bookForm}>
                        <form onSubmit={bookForm.handleSubmit(onCreateBookSubmit)} className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={bookForm.control}
                              name="titulo"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Título</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Título del libro" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={bookForm.control}
                              name="autor"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Autor</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Nombre del autor" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={bookForm.control}
                              name="published_year"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Año de publicación</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      placeholder="Año de publicación" 
                                      {...field}
                                      value={field.value === null ? "" : field.value}
                                      onChange={e => field.onChange(e.target.value === "" ? null : Number(e.target.value))}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                              <FormField
                                control={bookForm.control}
                                name="categoria"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Categoría</FormLabel>
                                    <FormControl>
                                      <Select onValueChange={field.onChange} value={field.value}>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Selecciona una categoría" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {categories.map((cat) => (
                                            <SelectItem key={cat} value={cat}>
                                              {cat}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
              
                            <FormField
                              control={bookForm.control}
                              name="imagen_url"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>URL de la imagen</FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder="URL de la imagen de portada" 
                                      {...field}
                                      value={field.value === null ? "" : field.value}
                                    />
                                  </FormControl>
                                  <FormDescription>
                                    URL de la imagen de portada del libro
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <div className="grid grid-cols-2 gap-2">
                              <FormField
                                control={bookForm.control}
                                name="totalCopies"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Total de copias</FormLabel>
                                    <FormControl>
                                      <Input type="number" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={bookForm.control}
                                name="availableCopies"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Copias disponibles</FormLabel>
                                    <FormControl>
                                      <Input type="number" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>
                          
                          <FormField
                            control={bookForm.control}
                            name="description"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Descripción</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Descripción del libro" 
                                    className="resize-none min-h-[120px]" 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <DialogFooter>
                            <Button 
                              type="submit" 
                              disabled={createBookMutation.isPending}
                            >
                              {createBookMutation.isPending ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Creando...
                                </>
                              ) : (
                                "Crear libro"
                              )}
                            </Button>
                          </DialogFooter>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>
                
                {isLoadingBooks ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : books.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-md">
                    <p className="text-gray-500">No hay libros disponibles.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[50px]">ID</TableHead>
                          <TableHead>Título</TableHead>
                          <TableHead>Autor</TableHead>
                          <TableHead>Año</TableHead>
                          <TableHead>Categoría</TableHead>
                          <TableHead>Stock</TableHead>
                          <TableHead>Disponibles</TableHead>
                          <TableHead>Valoración</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {books.map((book) => (
                          <TableRow key={book.id}>
                            <TableCell className="font-medium">{book.id}</TableCell>
                            <TableCell>{book.titulo}</TableCell>
                            <TableCell>{book.autor}</TableCell>
                            <TableCell>{book.published_year || "-"}</TableCell>
                            <TableCell>{book.categoria}</TableCell>
                            <TableCell>{book.totalCopies}</TableCell>
                            <TableCell>
                              {book.availableCopies <= 0 ? (
                                <Badge variant="destructive">No disponible</Badge>
                              ) : book.availableCopies <= 5 ? (
                                <Badge variant="warning">Pocos ({book.availableCopies})</Badge>
                              ) : (
                                <Badge variant="success">{book.availableCopies}</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <StarRating rating={book.averageRating} size="sm" />
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button 
                                  variant="outline" 
                                  size="icon"
                                  onClick={() => handleEditBook(book)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="destructive" 
                                  size="icon"
                                  onClick={() => setBookToDelete(book)}
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>
              
              {/* Users Tab */}
              <TabsContent value="users" className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-medium text-gray-900">Gestión de usuarios</h2>
                </div>
                
                {isLoadingUsers ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : users.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-md">
                    <p className="text-gray-500">No hay usuarios registrados.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[50px]">ID</TableHead>
                          <TableHead>Nombre</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Rol</TableHead>
                          <TableHead>Fecha registro</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">{user.id}</TableCell>
                            <TableCell>{user.nombre}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                              {user.role_id === 2 ? (
                                <Badge variant="primary">Administrador</Badge>
                              ) : (
                                <Badge variant="outline">Usuario</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {format(new Date(user.created_at), "dd/MM/yyyy", { locale: es })}
                            </TableCell>
                            <TableCell>
                              <Badge variant="success">Activo</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => toggleUserStatus(user.id, true)}
                                  disabled={toggleUserStatusMutation.isPending}
                                >
                                  {toggleUserStatusMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <>
                                      <X className="mr-1 h-4 w-4" /> Desactivar
                                    </>
                                  )}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>
              
              {/* Loans Tab */}
              <TabsContent value="loans" className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-medium text-gray-900">Préstamos activos</h2>
                </div>
                
                {isLoadingLoans ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : loans.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-md">
                    <p className="text-gray-500">No hay préstamos activos en este momento.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[50px]">ID</TableHead>
                          <TableHead>Usuario</TableHead>
                          <TableHead>Libro</TableHead>
                          <TableHead>Fecha inicio</TableHead>
                          <TableHead>Fecha vencimiento</TableHead>
                          <TableHead>Estado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loans.map((loan) => (
                          <TableRow key={loan.id}>
                            <TableCell className="font-medium">{loan.id}</TableCell>
                            <TableCell>
                              {loan.usuario?.nombre || `Usuario ID: ${loan.user_id}`}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-12 bg-gray-100 overflow-hidden rounded">
                                  {loan.libro.imagen_url && (
                                    <img 
                                      src={loan.libro.imagen_url} 
                                      alt={loan.libro.titulo}
                                      className="w-full h-full object-cover"
                                    />
                                  )}
                                </div>
                                <span>{loan.libro.titulo}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {format(new Date(loan.start_date), "dd/MM/yyyy", { locale: es })}
                            </TableCell>
                            <TableCell>
                              {format(new Date(loan.due_date), "dd/MM/yyyy", { locale: es })}
                            </TableCell>
                            <TableCell>
                              <Badge variant="success">Prestado</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      
      {/* Edit Book Dialog */}
      {bookToEdit && (
        <Dialog open={!!bookToEdit} onOpenChange={(open) => !open && setBookToEdit(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Editar libro</DialogTitle>
              <DialogDescription>
                Modifica la información del libro "{bookToEdit.titulo}"
              </DialogDescription>
            </DialogHeader>
            
            <Form {...bookForm}>
              <form onSubmit={bookForm.handleSubmit(onUpdateBookSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={bookForm.control}
                    name="titulo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Título</FormLabel>
                        <FormControl>
                          <Input placeholder="Título del libro" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={bookForm.control}
                    name="autor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Autor</FormLabel>
                        <FormControl>
                          <Input placeholder="Nombre del autor" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={bookForm.control}
                    name="published_year"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Año de publicación</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="Año de publicación" 
                            {...field}
                            value={field.value === null ? "" : field.value}
                            onChange={e => field.onChange(e.target.value === "" ? null : Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                        control={bookForm.control}
                        name="categoria"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Categoría</FormLabel>
                            <FormControl>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecciona una categoría" />
                                </SelectTrigger>
                                <SelectContent>
                                  {categories.map((cat) => (
                                    <SelectItem key={cat} value={cat}>
                                      {cat}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                  
                  <FormField
                    control={bookForm.control}
                    name="imagen_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL de la imagen</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="URL de la imagen de portada" 
                            {...field}
                            value={field.value === null ? "" : field.value}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-2">
                    <FormField
                      control={bookForm.control}
                      name="totalCopies"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Total de copias</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={bookForm.control}
                      name="availableCopies"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Copias disponibles</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                <FormField
                  control={bookForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Descripción del libro" 
                          className="resize-none min-h-[120px]" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button 
                    type="submit" 
                    disabled={updateBookMutation.isPending}
                  >
                    {updateBookMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Actualizando...
                      </>
                    ) : (
                      "Guardar cambios"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Delete Book Confirmation */}
      <AlertDialog 
        open={!!bookToDelete} 
        onOpenChange={(open) => !open && setBookToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el libro 
              "{bookToDelete?.titulo}" y todos sus datos asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteBook}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteBookMutation.isPending}
            >
              {deleteBookMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                "Eliminar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
