# SPEC-000: Arquitectura General y Estructura del Proyecto

## 1. Visión General
Plataforma web para la gestión del torneo privado "Enchepaitos Tournament" para Football League 2026 (FL26).
- **Modelo de Acceso:** Lectura Pública / Escritura Restringida por Aprobación de Admin.
- **Metodología:** Spec-Driven Development (SDD) para ejecución en OpenCode con DeepSeek.

## 2. Estructura de Directorios

```text
/
├── specs/                        # Especificaciones Canónicas (OpenCode)
│   ├── SPEC-000-ARCHITECTURE.md
│   ├── SPEC-001-AUTH-AND-PROFILES.md
│   ├── SPEC-002-TOURNAMENT-ENGINE.md
│   ├── SPEC-003-DYNAMIC-AWARDS-AND-MEDIA.md
│   └── SPEC-004-FINANCIALS-H2H-AND-CARDS.md
├── src/
│   ├── app/                      # Rutas de Next.js (App Router)
│   │   ├── (public)/             # Vistas Públicas (Lectura: Torneos, H2H, Rankings)
│   │   ├── (auth)/               # Login y Registro
│   │   ├── admin/                # Panel de Control del Admin
│   │   └── api/                  # Endpoints y Server Actions
│   ├── components/               # Componentes React
│   │   ├── ui/                   # Componentes base (Botones, Modales, Inputs)
│   │   ├── tournament/           # Clasificación, Partidos, Selección de Equipo
│   │   ├── media/                # Galería Puskas y Reproductor
│   │   └── stats/                # H2H, Billetera, Tarjetas para WhatsApp
│   ├── lib/                      # Motores y Algoritmos
│   │   ├── berger.ts             # Generador de Calendarios (Algoritmo de Berger)
│   │   ├── awards.ts             # Motor Dinámico de Premios
│   │   └── supabase/             # Clientes de Base de Datos y Storage
│   └── types/                    # Interfaces de TypeScript
└── supabase/
    └── migrations/               # Esquema PostgreSQL y Políticas RLS