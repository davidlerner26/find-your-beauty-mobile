import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { Professional } from '../models/professional';
import { followProfessionals, isPublished } from '../services/professionals';
import { log } from '../utils/log';

type ProfessionalsState = {
  list: Professional[];
  // What clients can see
  published: Professional[];
  status: 'loading' | 'ready' | 'error';
  byId: (id: string) => Professional | undefined;
};

const ProfessionalsContext = createContext<ProfessionalsState | null>(null);

// The catalog of professionals, followed live (the same collection the site reads)
export function ProfessionalsProvider({ children }: { children: ReactNode }) {
  const [list, setList] = useState<Professional[]>([]);
  const [status, setStatus] = useState<ProfessionalsState['status']>('loading');

  useEffect(
    () =>
      followProfessionals(
        (next) => {
          setList(next);
          setStatus('ready');
        },
        (error) => {
          log.error('Failed to follow the professionals', error);
          setStatus('error');
        },
      ),
    [],
  );

  const value = useMemo<ProfessionalsState>(
    () => ({
      list,
      published: list.filter(isPublished),
      status,
      byId: (id) => list.find((professional) => professional.id === id),
    }),
    [list, status],
  );
  return <ProfessionalsContext.Provider value={value}>{children}</ProfessionalsContext.Provider>;
}

export function useProfessionals() {
  const value = useContext(ProfessionalsContext);
  if (!value) throw new Error('useProfessionals must be used inside ProfessionalsProvider');
  return value;
}
