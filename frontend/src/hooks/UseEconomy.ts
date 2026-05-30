import { useQuery } from '@tanstack/react-query';
import { DAILY } from '../constants/queryTimes';
import { bcbService } from '../api/services/Bcb';


// --- BANCO CENTRAL DO BRASIL (BCB) ---
// --- ECONOMIA - BRASIL ---

export function useDollarPtax() {
  return useQuery({
    queryKey: ['bcb', 'dollar', 'ptax'],
    queryFn: bcbService.getDollarPtax,
    ...DAILY,
  });
}

export function useSelic() {
  return useQuery({
    queryKey: ['bcb', 'selic'],
    queryFn: bcbService.getSelic,
    ...DAILY,
  });
}

export function useCdiRate() {
  return useQuery({
    queryKey: ['bcb', 'cdi'],
    queryFn: bcbService.getCdi,
    ...DAILY,
  });
}

export function useIpca() {
  return useQuery({
    queryKey: ['bcb', 'ipca'],
    queryFn: bcbService.getIpca,
    ...DAILY,
  });
}

export function useSelicHistory() {
  return useQuery({
    queryKey: ['bcb', 'selic', 'history'],
    queryFn: bcbService.getSelicHistory,
    ...DAILY,
  });
}


export function useMinimumWage() {
  return useQuery({
    queryKey: ['bcb', 'minimum-wage'],
    queryFn: bcbService.getMinimumWage,
    ...DAILY,
  });
}

export function useMinimumWageHistory() {
  return useQuery({
    queryKey: ['bcb', 'minimum-wage', 'history'],
    queryFn: bcbService.getMinimumWageAll,
    ...DAILY,
  });
}