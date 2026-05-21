import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ticket } from "../types";
import { saveImagePermanently, deleteFile, isTemporaryUri, createThumbnail } from "./files";

const TICKETS_KEY = "@memory_tickets";
const ONBOARDING_KEY = "@onboarding_completed";

/**
 * Marks onboarding as completed.
 */
export const setOnboardingCompleted = async (): Promise<void> => {
  try {
    console.log("[Storage] Marking onboarding as completed...");
    await AsyncStorage.setItem(ONBOARDING_KEY, "true");
    console.log("[Storage] Onboarding status saved successfully.");
  } catch (e) {
    console.error("[Storage] Failed to set onboarding status:", e);
    throw e;
  }
};

/**
 * Checks if onboarding has been completed.
 */
export const getOnboardingStatus = async (): Promise<boolean> => {
  try {
    console.log("[Storage] Fetching onboarding status...");
    const value = await AsyncStorage.getItem(ONBOARDING_KEY);
    const isCompleted = value === "true";
    console.log(`[Storage] Onboarding status: ${isCompleted ? "Completed" : "Pending"}`);
    return isCompleted;
  } catch (e) {
    console.error("[Storage] Failed to get onboarding status:", e);
    return false;
  }
};

/**
 * Migrates a ticket's image to permanent storage and generates a thumbnail.
 */
const migrateTicketImage = async (ticket: Ticket): Promise<Ticket> => {
  let updatedTicket = { ...ticket };

  // 1. Permanent Image Migration
  if (ticket.photoUri && isTemporaryUri(ticket.photoUri)) {
    try {
      console.log(`[Migration] Migrating image for ticket: ${ticket.id}`);
      const permanentUri = await saveImagePermanently(ticket.photoUri);
      updatedTicket.photoUri = permanentUri;
    } catch (error) {
      console.warn(`[Migration] Failed to migrate image for ticket ${ticket.id}:`, error);
    }
  }

  // 2. Thumbnail Generation
  if (updatedTicket.photoUri && !updatedTicket.thumbnailUri) {
    try {
      console.log(`[Migration] Generating thumbnail for ticket: ${ticket.id}`);
      const thumbUri = await createThumbnail(updatedTicket.photoUri);
      updatedTicket.thumbnailUri = thumbUri;
    } catch (error) {
      console.warn(`[Migration] Failed to create thumbnail for ticket ${ticket.id}:`, error);
    }
  }

  return updatedTicket;
};

/**
 * Retrieves all tickets from legacy AsyncStorage and migrates them.
 * Used only during the initialization phase of SQLite.
 */
export const getAllTickets = async (): Promise<Ticket[]> => {
  try {
    const jsonValue = await AsyncStorage.getItem(TICKETS_KEY);
    if (!jsonValue) return [];

    const parsed = JSON.parse(jsonValue) as Ticket[];
    if (!Array.isArray(parsed)) return [];

    // Perform migration of URIs and thumbnails
    const migratedTickets = await Promise.all(parsed.map(migrateTicketImage));
    return migratedTickets;
  } catch (e) {
    console.error("Error reading tickets from legacy storage:", e);
    return [];
  }
};

/**
 * Legacy delete function - just in case.
 */
export const deleteTicket = async (ticketId: string): Promise<void> => {
  try {
    const tickets = await getAllTickets();
    const ticketToDelete = tickets.find(t => t.id === ticketId);
    
    if (ticketToDelete) {
      if (ticketToDelete.photoUri && !isTemporaryUri(ticketToDelete.photoUri)) {
        await deleteFile(ticketToDelete.photoUri);
      }
      if (ticketToDelete.thumbnailUri && !isTemporaryUri(ticketToDelete.thumbnailUri)) {
        await deleteFile(ticketToDelete.thumbnailUri);
      }
    }

    const filteredTickets = tickets.filter((t) => t.id !== ticketId);
    await AsyncStorage.setItem(TICKETS_KEY, JSON.stringify(filteredTickets));
  } catch (e) {
    console.error("Error deleting ticket from legacy storage:", e);
  }
};
