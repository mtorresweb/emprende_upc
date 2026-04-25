# Roadmap Emprende UPC

## Objetivo
Lanzar una app institucional para publicar y visibilizar emprendimientos de estudiantes, con formación en línea y un chatbot de asistencia.

## Stack y librerías clave
- Framework: Next.js 16 (app router), React 19, TypeScript.
- Estilos: Tailwind CSS 4, shadcn/ui (Radix) para UI consistente y rápida.
- Formularios/validación: react-hook-form + Zod.
- Auth: Auth.js (NextAuth) con credenciales y Google OAuth (opcional), bcrypt para hash.
- DB: PostgreSQL (Neon) con Prisma ORM + Prisma Migrate.
- Storage: Vercel Blob (uploads de imágenes/adjuntos).
- Chatbot: Vercel AI SDK (con OpenAI/Azure OpenAI provider), streaming.
- Utilidades: eslint, tsconfig path aliases, date-fns.

## Supuestos de entorno
- Variables existentes: `DATABASE_URL` (Neon Postgres), `BLOB_READ_WRITE_TOKEN`, `SESSION_SECRET` (rotar en prod). Añadiremos claves para OpenAI/Azure, y OAuth si aplica.

## Fases y entregables
1) **Base UI + estilos**
   - Instalar Tailwind 4 y shadcn/ui; generar layout base, tipografía, color tokens.
   - Configurar paths de importación y reset CSS.

2) **ORM y modelo de datos**
   - Agregar Prisma; definir esquemas: `User`, `Profile`, `Venture`, `VentureUpdate`, `Attachment`, `TrainingModule`, `Message`.
   - Ejecutar migración inicial contra Neon y seed mínimo.

3) **Auth (RF1, RF2, RF3)**
   - NextAuth credenciales + Google opcional; middleware de protección.
   - Registro/login, gestión de sesión; página de perfil con edición (bio, links, avatar en Blob).

4) **Publicación y visibilidad (RF4, RF5)**
   - Formularios de creación/edición de emprendimientos (shadcn form + Zod).
   - Listado con filtros (tags, etapa, búsqueda) y detalle con actualizaciones y adjuntos (Blob).
   - Sección pública de emprendimientos destacados.

5) **Módulos de formación (RF6)**
   - Leer estructura en `public/modulo de formacion final/**` y mostrar lista por categoría.
   - Enlaces que abren PDFs en nueva pestaña (`target="_blank" rel="noopener noreferrer"`).

6) **Chatbot (RF7)**
   - UI de chat con historial en Postgres (`Message`).
   - Respuestas con Vercel AI SDK y proveedor (OpenAI/Azure). Posible grounding con títulos/etiquetas de ventures y módulos.

7) **Admin y moderación**
   - Rol admin: aprobar/ocultar/ destacar ventures, revisar reportes.
   - Panel simple con tablas filtrables.

8) **Ops y calidad**
   - ESLint + formateo, manejo de errores, estados vacíos.
   - Monitoreo básico (logs Vercel), rate limiting en rutas sensibles.

## Orden sugerido de implementación inmediata
- Paso 1: Instalar Tailwind 4 + shadcn/ui y crear layout base.
- Paso 2: Añadir Prisma, modelar y migrar a Neon.
- Paso 3: Integrar Auth.js (registro/login) y proteger rutas.
- Paso 4: CRUD de emprendimientos + listado con filtros.
- Paso 5: Catálogo de PDFs de formación (abrir en nueva pestaña).
- Paso 6: Chatbot con Vercel AI SDK + historial en Postgres.
- Paso 7: Panel admin y toques finales (observabilidad, rate limit, accesibilidad).
