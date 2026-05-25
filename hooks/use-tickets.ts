import { useState, useCallback, useMemo } from 'react';
import { storage } from '@/utils/storage';
import { Ticket } from '@/types';

export const useTickets = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const refreshTickets = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await storage.getTickets();
      setTickets(data);
      await storage.flushExpiredDeletes();
    } catch (error) {
      console.error('Failed to load tickets:', error);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  const filteredTickets = useMemo(() => {
    return tickets.filter(ticket => {
      const matchesSearch = 
        ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.location.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = 
        selectedCategory === 'All' || 
        ticket.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [tickets, searchQuery, selectedCategory]);

  const categories = useMemo(() => {
    const unique = new Set(tickets.map(t => t.category));
    return ['All', ...Array.from(unique)];
  }, [tickets]);

  return {
    tickets: filteredTickets,
    loading,
    refreshTickets,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    categories,
  };
};
