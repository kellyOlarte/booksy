import React, { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { BookOpen } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";


// Login schema
const loginSchema = z.object({
  email: z.string().email({ message: "Email inválido" }),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres" })
});

// Función para calcular la edad
function calculateAge(birthDate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
}

// Register schema
const registerSchema = z.object({
  nombre: z.string().min(3, { message: "El nombre debe tener al menos 3 caracteres" }),
  email: z.string().email({ message: "Email inválido" }),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres" }),
  confirmPassword: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres" }),
  birthDate: z.date({
    required_error: "La fecha de nacimiento es requerida",
    invalid_type_error: "La fecha de nacimiento debe ser una fecha válida"
  })
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"]
}).refine((data) => {
  const age = calculateAge(data.birthDate);
  return age >= 5;
}, {
  message: "Debes tener al menos 5 años para registrarte",
  path: ["birthDate"]
});

export default function AuthPage() {
  const [location, navigate] = useLocation();
  const { user, loginMutation, registerMutation } = useAuth();
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");

  // Parse tab from URL 
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (tab === "register") {
      setActiveTab("register");
    }
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  // Login form
  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: ""
    }
  });

  // Register form
  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      nombre: "",
      email: "",
      password: "",
      confirmPassword: "",
      birthDate: new Date(2000, 0, 1) // Default to January 1, 2000
    }
  });

  // Submit handlers
  const onLoginSubmit = (data: z.infer<typeof loginSchema>) => {
   loginMutation.mutate({
    ...data,
    email: data.email.toLowerCase()});
  };
  

  const onRegisterSubmit = (data: z.infer<typeof registerSchema>) => {
    // Formatear la fecha como string ISO para enviar al servidor
    const formattedBirthDate = data.birthDate.toISOString().split('T')[0];


    registerMutation.mutate({
      nombre: data.nombre,
      email: data.email.toLowerCase(),
      password: data.password,
      confirmPassword: data.confirmPassword,
      birthDate: data.birthDate
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row items-center gap-8 max-w-6xl mx-auto">
          {/* Left Column - Auth Forms */}
          <div className="w-full lg:w-1/2">
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "login" | "register")}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Iniciar sesión</TabsTrigger>
                <TabsTrigger value="register">Registrarse</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <Card>
                  <CardHeader>
                    <CardTitle>Iniciar sesión
                    </CardTitle>
                    <CardDescription>
                      Introduce tus credenciales para acceder a tu cuenta
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...loginForm}>
                      <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                        <FormField
                          control={loginForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input placeholder="tu@email.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={loginForm.control}
                          name="password"
                          render={({ field }) => {
                            const [showPassword, setShowPassword] = useState(false);

                            return (
                              <FormItem>
                                <FormLabel>Contraseña</FormLabel>
                                <FormControl>
                                  <div style={{ position: "relative" }}>
                                    <Input
                                      {...field}
                                      type={showPassword ? "text" : "password"}
                                      placeholder="••••••••"
                                    />
                                    <div
                                      onClick={() => setShowPassword(!showPassword)}
                                      style={{
                                        position: "absolute",
                                        right: "10px",
                                        top: "50%",
                                        transform: "translateY(-50%)",
                                        cursor: "pointer",
                                      }}
                                    >
                                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </div>
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            );
                          }}
                        />



                        <Button
                          type="submit"
                          className="w-full"
                          disabled={loginMutation.isPending}
                        >
                          {loginMutation.isPending ? "Iniciando sesión..." : "Iniciar sesión"}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                  <CardFooter className="flex flex-col space-y-4">
                    <div className="text-sm text-center text-gray-500">
                      ¿No tienes una cuenta?{" "}
                      <button
                        type="button"
                        className="text-primary hover:underline"
                        onClick={() => setActiveTab("register")}
                      >
                        Regístrate
                      </button>

                    </div>
                  </CardFooter>
                </Card>
              </TabsContent>

              <TabsContent value="register">
                <Card>
                  <CardHeader>
                    <CardTitle>Crear cuenta</CardTitle>
                    <CardDescription>
                      Completa el formulario para crear una nueva cuenta
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...registerForm}>
                      <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                        <FormField
                          control={registerForm.control}
                          name="nombre"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nombre</FormLabel>
                              <FormControl>
                                <Input placeholder="Ingresa tu nombre" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={registerForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input placeholder="tu@email.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={registerForm.control}
                          name="birthDate"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>Fecha de nacimiento</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant="outline"
                                      className={cn(
                                        "w-full pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                      )}
                                    >
                                      {field.value ? (
                                        format(field.value, "PPP", { locale: es })
                                      ) : (
                                        <span>Selecciona una fecha</span>
                                      )}
                                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <DayPicker
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    captionLayout="dropdown"
                                    fromYear={1600}
                                    toYear={new Date().getFullYear()}
                                    locale={es}
                                    modifiers={{
                                      future: (date) => date > new Date(),
                                    }}
                                    modifiersClassNames={{
                                      selected: 'bg-blue-500 text-white',
                                      future: 'text-gray-400',
                                    }}
                                  />
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={registerForm.control}
                          name="password"
                          render={({ field }) => {
                            const [showPassword, setShowPassword] = useState(false);

                            return (
                              <FormItem>
                                <FormLabel>Contraseña</FormLabel>
                                <FormControl>
                                  <div style={{ position: "relative" }}>
                                    <Input
                                      {...field}
                                      type={showPassword ? "text" : "password"}
                                      placeholder="••••••••"
                                    />
                                    <div
                                      onClick={() => setShowPassword(!showPassword)}
                                      style={{
                                        position: "absolute",
                                        right: "10px",
                                        top: "50%",
                                        transform: "translateY(-50%)",
                                        cursor: "pointer",
                                      }}
                                    >
                                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </div>
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            );
                          }}
                        />

                        <FormField
                          control={registerForm.control}
                          name="confirmPassword"
                          render={({ field }) => {
                            const [showConfirmPassword, setShowConfirmPassword] = useState(false);

                            return (
                              <FormItem>
                                <FormLabel>Confirmar contraseña</FormLabel>
                                <FormControl>
                                  <div style={{ position: "relative" }}>
                                    <Input
                                      {...field}
                                      type={showConfirmPassword ? "text" : "password"}
                                      placeholder="••••••••"
                                    />
                                    <div
                                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                      style={{
                                        position: "absolute",
                                        right: "10px",
                                        top: "50%",
                                        transform: "translateY(-50%)",
                                        cursor: "pointer",
                                      }}
                                    >
                                      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </div>
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            );
                          }}
                        />

                        <Button
                          type="submit"
                          className="w-full"
                          disabled={registerMutation.isPending}
                        >
                          {registerMutation.isPending ? "Registrando..." : "Crear cuenta"}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                  <CardFooter className="flex flex-col space-y-4">
                    <div className="text-sm text-center text-gray-500">
                      ¿Ya tienes una cuenta?{" "}
                      <button
                        type="button"
                        className="text-primary hover:underline"
                        onClick={() => setActiveTab("login")}
                      >
                        Inicia sesión
                      </button>
                    </div>
                  </CardFooter>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Hero Section */}
          <div className="w-full lg:w-1/2 bg-primary rounded-lg p-8 text-white">
            <div className="flex items-center mb-8">
              <BookOpen className="h-10 w-10 mr-2" />
              <h2 className="text-2xl font-serif font-bold">Booksy</h2>
            </div>

            <h1 className="text-3xl font-serif font-bold mb-4">
              Bienvenido a tu biblioteca virtual
            </h1>

            <p className="text-lg mb-6 text-white/80">
              Accede a una gran colección de libros, haz préstamos, califica y comenta tus lecturas favoritas.
            </p>

            <div className="space-y-4">
              <div className="flex items-start">
                <div className="bg-white/10 p-2 rounded-full mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                    <path d="M12 6v6l4 2"></path>
                    <circle cx="12" cy="12" r="10"></circle>
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Préstamos rápidos</h3>
                  <p className="text-white/80">Solicita préstamos de libros con un simple clic.</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="bg-white/10 p-2 rounded-full mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Gran catálogo</h3>
                  <p className="text-white/80">Explora una amplia variedad de géneros literarios.</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="bg-white/10 p-2 rounded-full mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Califica y comenta</h3>
                  <p className="text-white/80">Comparte tus opiniones sobre los libros que lees.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
