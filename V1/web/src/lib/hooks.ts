'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './api';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export function useAuth() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = api.getToken();
    if (!token) {
      setIsLoading(false);
      return;
    }
    api
      .getProfile()
      .then(() => {
        setIsAuthenticated(true);
        setIsLoading(false);
      })
      .catch(() => {
        api.setToken(null);
        setIsAuthenticated(false);
        setIsLoading(false);
      });
  }, []);

  const loginMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      api.login(email, password),
    onSuccess: (data) => {
      api.setToken(data.token);
      setIsAuthenticated(true);
      router.push('/dashboard');
    },
  });

  const registerMutation = useMutation({
    mutationFn: ({ email, password, firstName, lastName }: { email: string; password: string; firstName?: string; lastName?: string }) =>
      api.register(email, password, firstName, lastName),
    onSuccess: (data) => {
      api.setToken(data.token);
      setIsAuthenticated(true);
      router.push('/dashboard');
    },
  });

  const logout = () => {
    api.setToken(null);
    setIsAuthenticated(false);
    router.push('/login');
  };

  return {
    isAuthenticated,
    isLoading,
    login: loginMutation.mutate,
    loginError: loginMutation.error,
    isLoginPending: loginMutation.isPending,
    register: registerMutation.mutate,
    registerError: registerMutation.error,
    isRegisterPending: registerMutation.isPending,
    logout,
  };
}

export function useLinks(params?: Record<string, string>) {
  return useQuery({
    queryKey: ['links', params],
    queryFn: () => api.getLinks(params),
  });
}

export function useCollections() {
  return useQuery({
    queryKey: ['collections'],
    queryFn: () => api.getCollections(),
  });
}

export function useFavorites() {
  return useQuery({
    queryKey: ['favorites'],
    queryFn: () => api.getFavorites(),
  });
}

export function useDeleteLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteLink(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['links'] });
      qc.invalidateQueries({ queryKey: ['collections'] });
    },
  });
}

export function useToggleFavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (linkId: string) => api.toggleFavorite(linkId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['links'] });
      qc.invalidateQueries({ queryKey: ['favorites'] });
    },
  });
}

export function useSearch() {
  return useMutation({
    mutationFn: ({ q, filters }: { q: string; filters?: Record<string, string> }) =>
      api.search(q, filters),
  });
}
