"use client";

import { useRef, useState } from "react";

import { TeamBadge } from "@/components/ui/team-badge";
import { cn } from "@/lib/utils";

export interface TeamSelection {
  name: string;
  logoUrl: string | null;
  providerId: string | null;
}

interface TeamResult {
  id: string;
  name: string;
  logo: string | null;
  country: string | null;
}

export function TeamPicker({
  initialName = "",
  initialLogo = null,
  placeholder = "Buscar equipo…",
  inputClassName,
  onDirty,
  onChange,
}: {
  initialName?: string;
  initialLogo?: string | null;
  placeholder?: string;
  inputClassName?: string;
  onDirty?: () => void;
  onChange?: (value: TeamSelection) => void;
}) {
  const [name, setName] = useState(initialName);
  const [logoUrl, setLogoUrl] = useState<string | null>(initialLogo);
  const [providerId, setProviderId] = useState<string | null>(null);
  const [results, setResults] = useState<TeamResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function emit(nextName: string, nextLogo: string | null, nextId: string | null) {
    onDirty?.();
    onChange?.({ name: nextName, logoUrl: nextLogo, providerId: nextId });
  }

  function handleInput(value: string) {
    setName(value);
    setLogoUrl(null);
    setProviderId(null);
    emit(value, null, null);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (value.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    setLoading(true);
    timeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/teams/search?q=${encodeURIComponent(value)}`);
        const json = (await res.json()) as { teams: TeamResult[] };
        setResults(json.teams ?? []);
      } catch {
        setResults([]);
      }
      setLoading(false);
      setOpen(true);
    }, 300);
  }

  function select(team: TeamResult) {
    setName(team.name);
    setLogoUrl(team.logo);
    setProviderId(team.id);
    setResults([]);
    setOpen(false);
    emit(team.name, team.logo, team.id);
  }

  return (
    <div className="relative w-full">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={name}
          onChange={(event) => handleInput(event.target.value)}
          onFocus={() => {
            if (results.length > 0) setOpen(true);
          }}
          placeholder={placeholder}
          required
          minLength={2}
          className={cn(
            "h-9 w-full rounded-lg border border-leather-stitch/50 bg-black/40 px-3 text-sm text-chalk shadow-skeuo-inset placeholder:text-chalk/40 focus:border-beer focus:outline-none",
            inputClassName,
          )}
        />
        <TeamBadge src={logoUrl} name={name} />
      </div>

      <input type="hidden" name="teamName" value={name} />
      <input type="hidden" name="teamLogoUrl" value={logoUrl ?? ""} />
      <input type="hidden" name="teamProviderId" value={providerId ?? ""} />

      {open && (
        <ul className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-leather-stitch/50 bg-leather-dark shadow-skeuo-card">
          {loading && (
            <li className="px-3 py-2 text-xs text-chalk/60">Buscando…</li>
          )}
          {!loading && results.length === 0 && (
            <li className="px-3 py-2 text-xs text-chalk/60">
              Sin resultados. Puedes escribir el nombre manualmente.
            </li>
          )}
          {results.map((team) => (
            <li key={team.id}>
              <button
                type="button"
                onMouseDown={(event) => {
                  event.preventDefault();
                  select(team);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-chalk hover:bg-white/10"
              >
                <TeamBadge src={team.logo} name={team.name} />
                <span className="truncate">{team.name}</span>
                {team.country && (
                  <span className="ml-auto text-xs text-chalk/50">
                    {team.country}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
