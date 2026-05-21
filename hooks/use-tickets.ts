import { useState, useEffect, useCallback } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { Ticket } from '@/types';
import { dbOps } from '@/utils/database';
import { deleteFile } from '@/utils/files';

export const useTickets = () => {
  const db = useSQLiteContext();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');

  const refreshTickets = useCallback(async (query?: string, sortBy: 'ASC' | 'DESC' = sortOrder) => {
    setLoading(true);
    try {
      let data: Ticket[];
      if (query && query.trim()) {
        data = await dbOps.searchTickets(db, query, sortBy);
      } else {
        data = await dbOps.getTickets(db, sortBy);
      }
      setTickets(data);
    } catch (error) {
      console.error('[useTickets] Failed to refresh tickets:', error);
    } finally {
      setLoading(false);
    }
  }, [db, sortOrder]);

  const toggleSortOrder = useCallback(() => {
    const newOrder = sortOrder === 'DESC' ? 'ASC' : 'DESC';
    setSortOrder(newOrder);
    refreshTickets(undefined, newOrder);
  }, [sortOrder, refreshTickets]);

  const createTicket = async (ticket: Ticket) => {
    try {
      await dbOps.insertTicket(db, ticket);
      await refreshTickets();
    } catch (error) {
      console.error('[useTickets] Failed to create ticket:', error);
      throw error;
    }
  };

  const updateTicket = async (ticket: Ticket) => {
    try {
      const oldTicket = tickets.find(t => t.id === ticket.id);
      
      await dbOps.updateTicket(db, ticket);
      
      // If image changed, cleanup old files
      if (oldTicket && oldTicket.photoUri !== ticket.photoUri) {
        if (oldTicket.photoUri) await deleteFile(oldTicket.photoUri);
        if (oldTicket.thumbnailUri) await deleteFile(oldTicket.thumbnailUri);
      }
      
      await refreshTickets();
    } catch (error) {
      console.error('[useTickets] Failed to update ticket:', error);
      throw error;
    }
  };

  const deleteTicket = async (ticketId: string) => {
    try {
      const ticketToDelete = tickets.find(t => t.id === ticketId);
      
      // Optimistic UI update
      setTickets((prev) => prev.filter((t) => t.id !== ticketId));
      
      await dbOps.deleteTicket(db, ticketId);
      
      // Physical file cleanup
      if (ticketToDelete) {
        if (ticketToDelete.photoUri) await deleteFile(ticketToDelete.photoUri);
        if (ticketToDelete.thumbnailUri) await deleteFile(ticketToDelete.thumbnailUri);
      }
    } catch (error) {
      console.error('[useTickets] Failed to delete ticket:', error);
      // Revert if failed
      await refreshTickets();
      throw error;
    }
  };

  useEffect(() => {
    refreshTickets();
  }, [refreshTickets]);

  return {
    tickets,
    loading,
    sortOrder,
    refreshTickets,
    toggleSortOrder,
    createTicket,
    updateTicket,
    deleteTicket,
  };
};
