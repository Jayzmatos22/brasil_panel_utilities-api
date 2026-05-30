import { useQuery } from '@tanstack/react-query';
import { DAILY } from '../constants/queryTimes';
import { bcbService } from '../api/services/Bcb';


// --- BANCO CENTRAL DO BRASIL (BCB) ---
// --- ECONOMIA - BRASIL ---

export function useDollarPtax(enabled = true) {
  return useQuery({
    queryKey: ['bcb', 'dollar', 'ptax'],
    queryFn: bcbService.getDollarPtax,
    enabled,
    ...DAILY,
  });
}

export function useSelic(enabled = true) {
  return useQuery({
    queryKey: ['bcb', 'selic'],
    queryFn: bcbService.getSelic,
    enabled,
    ...DAILY,
  });
}

export function useCdiRate(enabled = true) {
  return useQuery({
    queryKey: ['bcb', 'cdi'],
    queryFn: bcbService.getCdi,
    enabled,
    ...DAILY,
  });
}

export function useIpca(enabled = true) {
  return useQuery({
    queryKey: ['bcb', 'ipca'],
    queryFn: bcbService.getIpca,
    enabled,
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