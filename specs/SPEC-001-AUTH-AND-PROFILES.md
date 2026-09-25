### `specs/SPEC-001-AUTH-AND-PROFILES.md`

```markdown # SPEC-001: Autenticación, Control de Acceso y Perfiles

## 1. Esquema de Base de Datos (PostgreSQL)

```sql **CREATE** **TYPE** user_role AS **ENUM** ('admin', 'player'); **CREATE** **TYPE** user_status AS **ENUM** ('pending', 'approved', 'rejected');

**CREATE** **TABLE** public.profiles (
    id **UUID** **PRIMARY** **KEY** **REFERENCES** auth.users(id) ON **DELETE** **CASCADE**,
    username **TEXT** **UNIQUE** **NOT** **NULL**,
    email **TEXT** **UNIQUE** **NOT** **NULL**,
    role user_role **NOT** **NULL** **DEFAULT** 'player',
    status user_status **NOT** **NULL** **DEFAULT** 'pending',
    created_at **TIMESTAMP** **WITH** **TIME** **ZONE** **DEFAULT** **NOW**(),
    **CONSTRAINT** username_min_length **CHECK** (char_length(username) >= 3)
);

-- Habilitar **RLS** (Row Level Security) **ALTER** **TABLE** public.profiles **ENABLE** **ROW** **LEVEL** **SECURITY**;

-- Lectura pública para cualquier usuario (autenticado o anónimo) **CREATE** **POLICY** *Public Profiles Read* ON public.profiles **FOR** **SELECT** **USING** (true);

-- Edición exclusiva para el propio usuario **CREATE** **POLICY** *User Self Update* ON public.profiles **FOR** **UPDATE** **USING** (auth.uid() = id) **WITH** **CHECK** (auth.uid() = id);

-- Control total para el Admin
**CREATE** **POLICY** *Admin Full Access* 
ON public.profiles **FOR** **ALL** 
**USING** (
    **EXISTS** (
    **SELECT** 1 **FROM** public.profiles 
    **WHERE** id = auth.uid() **AND** role = 'admin'
    )
);
## Especificación de Server Actions
registerUser(formData: RegisterInput): Promise<ActionResult>
Validación: username (3-20 caracteres alfanuméricos), email válido, password mínimo 8 caracteres.

Flujo:

Ejecuta supabase.auth.signUp().

Inserta un registro en public.profiles con status: 'pending' y role: 'player'.

Retorna estado PENDING_APPROVAL.

updateUserStatus(userId: string, newStatus: 'approved' | 'rejected'): Promise<ActionResult> Seguridad: Verifica que auth.uid() posea role === 'admin'.

Flujo: Actualiza public.profiles.status del usuario objetivo.

## Middleware de Seguridad (middleware.ts)

Usuarios Anónimos:

Acceso permitido a /, /torneos/*, /rankings, /h2h, /login, /register.

Bloqueo de Server Actions que realicen mutaciones (**INSERT**, **UPDATE**, **DELETE**).

Usuarios Autenticados con status === 'pending':

Acceso a vistas públicas.

Muestra Banner persistente: "Tu cuenta está pendiente de validación por el Admin."

Bloqueo de acciones de escritura (inscripciones, ingresar goles, votar Puskas, subir vídeo).

Usuarios Admin (role === 'admin'):

Acceso exclusivo al panel /admin/users.

## Criterios de Aceptación

[ ] Intentar escribir datos con estado pending lanza el error UNAUTHORIZED_PENDING_APPROVAL.

[ ] La ruta /admin/users lista usuarios pendientes ordenados por fecha de registro.

[ ] Aprobar a un usuario refresca los permisos mediante revalidatePath.